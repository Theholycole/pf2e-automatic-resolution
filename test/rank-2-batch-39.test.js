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



// Rank 2, batch 39 (2026-10-01): Lifelink Surge, Warping Pull, Everlight (Effect + note proved).

test('Proved Effect + note: Fast Healing and resistance follow their heightened steps; the recipient is stated', async () => {
    const {ruleValueAt} = await import('../src/compiler/effect-note-proof.js');
    const lifelink = compile(await spell('rank-2/lifelink-surge'));
    assert.equal(lifelink.automation.level, 'automatic');
    assert.deepEqual([lifelink.resolution.effectNote.recipient, lifelink.resolution.effectNote.targetTrait], ['target', 'eidolon']);
    const warping = compile(await spell('rank-2/warping-pull'));
    assert.equal(warping.automation.level, 'automatic');
    assert.equal(warping.resolution.effectNote.proof.endsAfterDamage, true);
    const everlight = compile(await spell('rank-2/everlight'));
    assert.deepEqual([everlight.automation.level, everlight.resolution.effectNote.recipient], ['automatic', 'source']);
    assert.equal(ruleValueAt('5*floor(@item.level / 2)', 4), 10);
    assert.equal(ruleValueAt('@actor.level', 4), null);
    // A different step isn't proved.
    const changed = compile(withText(await spell('rank-2/lifelink-surge'), html => html.replace('increases by 2', 'increases by 3')));
    assert.equal(changed.automation.level, 'guided');
});
