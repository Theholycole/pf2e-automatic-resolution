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


// Rank 4, batch 26 (2026-10-02): Dull Ambition (a note with PF2e's RollTwice on initiative, for the row's hour, day, or without end).

test('Dull Ambition: RollTwice on initiative for each row\'s time', async () => {
    const plan = compile(await spell('rank-4/dull-ambition'));
    assert.equal(supported(plan), true);
    assert.equal(plan.lifecycle.durationSpec.mode, 'outcome');
    const note = degree => plan.resolution.outcomes[degree].noteEffects[0];
    assert.deepEqual(note('success').rules, [{key: 'RollTwice', selector: 'initiative', keep: 'lower'}]);
    assert.deepEqual([note('success').duration.value, note('success').duration.unit], [1, 'hours']);
    assert.deepEqual([note('failure').duration.value, note('failure').duration.unit], [1, 'days']);
    assert.equal(note('criticalFailure').duration.mode, 'unlimited');
    assert.match(note('failure').text, /downtime activity/);
    // Another roll isn't read.
    const other = compile(withText(await spell('rank-4/dull-ambition'), html => html.replace('For 1 hour, the target rolls twice and uses the lower result on initiative rolls', 'For 1 hour, the target rolls twice and uses the lower result on Perception checks')));
    assert.equal(supported(other), false);
});
