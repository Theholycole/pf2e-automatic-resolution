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


// Rank 3, batch 108 (2026-10-03): Phantom Prison (Trickster's Twin's family: the cast's Will save; a failure's prison note with the Will Disbelieve
// control that ends the spell; the size limit and the heightened count a card note).

test("Phantom Prison: the prison note and its Disbelieve", async () => {
    const plan = compile(await spell("rank-3/phantom-prison"));
    assert.equal(plan.resolution.check.statistic, "will");
    assert.equal(supported(plan), true);
    for (const degree of ["failure", "criticalFailure"]) assert.deepEqual(plan.resolution.outcomes[degree].noteEffects.at(-1).disbelieve, { statistic: "will", endsSpell: true, needs: "success" });
    assert.equal((plan.resolution.outcomes.success.noteEffects ?? []).length, 0);
    assert.match(plan.resolution.reminders.at(-1).text, /Large or smaller.*8th rank, up to 5/);
    // A different disbelief outcome isn't read.
    const other = compile(withText(await spell("rank-3/phantom-prison"), html => html.replace("and the spell ends", "and it can move")));
    assert.notEqual(other.compilerEvidence?.twinIllusion?.length, 5);
});
