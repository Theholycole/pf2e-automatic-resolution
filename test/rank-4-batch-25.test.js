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


// Rank 4, batch 25 (2026-10-02): Aromatic Lure (the compelled movement a 1-round note; the critical failure's stay a note of 1d4 rolled rounds).

test('Aromatic Lure: Stupefied rows, the Lured note and the rolled stay', async () => {
    const plan = compile(await spell('rank-4/aromatic-lure'));
    assert.equal(supported(plan), true);
    const labels = degree => (plan.resolution.outcomes[degree].noteEffects ?? []).map(note => note.label);
    assert.deepEqual(labels('success'), []);
    assert.deepEqual(labels('failure'), ['Lured']);
    assert.deepEqual(labels('criticalFailure'), ['Lured', 'Stays at the destination']);
    assert.equal(plan.resolution.outcomes.criticalFailure.noteEffects[1].duration.valueRoll, '1d4');
    // A stay worded otherwise isn't read.
    const other = compile(withText(await spell('rank-4/aromatic-lure'), html => html.replace('but can otherwise act normally', 'and can take no actions')));
    assert.equal(supported(other), false);
});
