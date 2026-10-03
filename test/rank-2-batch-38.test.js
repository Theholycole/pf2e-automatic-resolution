import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}, ...(e.system?.badge ? {badge: e.system.badge} : {})}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}
const effects = await catalog();
const compile = source => compileAbility(source, {nativeEffectCatalog: effects});
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };



// Rank 2, batch 38 (2026-10-01): Mirror Image, See the Unseen.

test('Mirror Image: the image count and the stated odds for each count', async () => {
    const plan = compile(await spell('rank-2/mirror-image'));
    assert.equal(plan.resolution.kind, 'image-decoys');
    assert.equal(plan.automation.level, 'automatic');
    const {images, chances} = plan.resolution.imageDecoys;
    assert.equal(images, 3);
    assert.deepEqual(Object.fromEntries(Object.entries(chances).map(([count, chance]) => [count, [chance.die, chance.max]])), {1: [6, 3], 2: [6, 2], 3: [4, 1]});
    // Odds that don't match the stated range aren't read.
    const changed = compile(withText(await spell('rank-2/mirror-image'), html => html.replace('(1-2 on', '(1-3 on')));
    assert.notEqual(changed.resolution.kind, 'image-decoys');
});

test('See the Unseen: every rule sentence proved against PF2e\'s Effect, the heightened duration read', async () => {
    const source = await spell('rank-2/see-the-unseen');
    const plan = compile(source);
    assert.equal(plan.resolution.kind, 'effect-note');
    assert.equal(plan.automation.level, 'automatic');
    assert.deepEqual(plan.resolution.effectNote.proof.claims.map(claim => claim.rule), [0, 1]);
    assert.deepEqual(plan.resolution.effectNote.heightenedDurations.map(entry => [entry.minRank, entry.value, entry.unit]), [[5, 8, 'hours']]);
    // A different bonus isn't proved: the plan stays guided.
    const changed = compile(withText(source, html => html.replace('+2 status bonus', '+3 status bonus')));
    assert.equal(changed.automation.level, 'guided');
});
