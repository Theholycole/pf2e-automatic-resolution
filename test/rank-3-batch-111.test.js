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


// Rank 3, batch 111 (2026-10-03): Oneiric Mire (a lingering area: difficult terrain; the cast's and entering's Will save — a critical success immune for
// the spell (disbelieved), the penalty and Immobilized until it Escapes; the affected rows' note carries the end-of-turn Will save).

test("Oneiric Mire: the lingering mire and its end-of-turn save", async () => {
    const plan = compile(await spell("rank-3/oneiric-mire"));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events.join(), lingering.initial, lingering.terrain.difficulty], ["enter", true, 2]);
    assert.equal(plan.resolution.outcomes.failure.modifiers[0].duration.mode, "escape");
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ["immobilized"]);
    assert.match(plan.resolution.outcomes.criticalSuccess.rowImmunityText, /temporarily immune for 1 minute/);
    for (const degree of ["failure", "criticalFailure"]) assert.deepEqual(plan.resolution.outcomes[degree].noteEffects.at(-1).endSave,
        { statistic: "will", label: "at the end of its turn", oncePerRound: true, scope: "creature", immunityOnCritical: { value: 1, unit: "minutes" } });
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    // A different penalty isn't read.
    const other = compile(withText(await spell("rank-3/oneiric-mire"), html => html.replace("–10-foot circumstance penalty", "–15-foot circumstance penalty to its Speeds and")));
    assert.notEqual(other.compilerEvidence?.twinIllusion?.length, 7);
});
