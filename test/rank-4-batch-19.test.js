import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

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

const supported = plan => inspectSavePlan(plan).supported;


// Rank 4, batch 19 (2026-10-02): healing — Life Siphon (the caster heals 1d8 per rank of the triggering spell) and Let Not the Fallen Rest
// (rank 5: allies within 30 feet that are dying, or unconscious, at Dying 2 or less regain 4d10 and can Stand freely).

test('Life Siphon: 1d8 per triggering rank on the caster', async () => {
    const plan = compile(await spell('rank-4/life-siphon'));
    assert.equal(plan.resolution.kind, 'healing');
    assert.deepEqual([plan.resolution.healing.recipient, plan.resolution.healing.perTriggeringRank], ['source', {dice: 1, faces: 8}]);
});

test('Let Not the Fallen Rest: allies within the emanation at Dying 2 or less', async () => {
    const plan = compile(await spell('rank-5/let-not-the-fallen-rest'));
    assert.equal(plan.resolution.kind, 'healing');
    assert.deepEqual([plan.resolution.healing.recipient, plan.resolution.healing.within, plan.resolution.healing.alliesOnly, plan.resolution.healing.dyingMax], ['target', 30, true, 2]);
    assert.ok(plan.resolution.healing.notes.some(note => note.kind === 'free-stand'));
    assert.notEqual(compile(withText(await spell('rank-5/let-not-the-fallen-rest'), html => html.replace('Each allied creature', 'Each creature'))).resolution.kind, 'healing');
});
