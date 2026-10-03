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


// Rank 3, batch 49 (2026-10-02): Gasping Marsh (a basic save whose four rows are written out: read as that table when the basic reading leaves rules
// uncompiled; a sustained placed area: each breathing creature starting its turn inside takes 4d6 poison and saves — the breathing a GM note; moving
// the mist on a Sustain a note; the 1-minute immunity stops repeat exposures).

test("Gasping Marsh: the written rows, the area and the immunity", async () => {
    const plan = compile(await spell("rank-3/gasping-marsh"));
    assert.equal(plan.resolution.kind, 'save');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    assert.equal(plan.resolution.check.basic, false);
    assert.equal(plan.compilerEvidence.writtenBasicRows, true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual(lingering.events, ['turn-start']);
    assert.equal(lingering.sustained, true);
    assert.equal(lingering.notes.length, 2);
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, {value: 1, unit: 'minutes'});
    assert.equal(plan.resolution.outcomes.criticalFailure.damage.formulas[0].formula, '1d8[persistent,poison]');
    // A basic save already compiled from its written rows keeps its basic reading (Acid Grip).
    assert.equal(compile(await spell("rank-2/acid-grip")).resolution.check.basic, true);
});
