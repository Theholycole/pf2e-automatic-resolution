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


// Rank 3, batch 115 (2026-10-03): Aqueous Orb (a lingering 10-foot orb the GM places and rolls; the GM's control for a creature the orb tries to move
// through — its Reflex save; the engulfed note ending on an Escape; the rest a reminder).

test("Aqueous Orb: the orb, its control and the engulfed note", async () => {
    const plan = compile(await spell("rank-3/aqueous-orb"));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.area.type, lingering.area.value, lingering.events.length, lingering.initial, lingering.sustained], ["burst", 5, 0, false, true]);
    assert.match(lingering.gmAction.label, /orb tried to move through it/);
    assert.equal(plan.resolution.outcomes.failure.noteEffects.at(-1).escape, true);
    assert.match(plan.resolution.outcomes.criticalFailure.noteEffects.at(-1).text, /^(?!.*Swimming)/);
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    // A different orb isn't read.
    const other = compile(withText(await spell("rank-3/aqueous-orb"), html => html.replace("can attempt a Reflex save", "can attempt a Fortitude save")));
    assert.equal(other.resolution.lingering?.gmAction, undefined);
});
