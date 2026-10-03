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


// Rank 5, batch 56 (2026-10-02): Over the Coals (the Will save and a day's immunity whatever the result; on a success or worse a note whose control deals the
// row's persistent void damage and conditions if it doesn't comply by the end of its next turn; the demand's limit, the cantrip immunity, a later compliance
// and the 9th rank's second target reminders).

test("Over the Coals: the noncompliance's damage and conditions", async () => {
    const { isTriggeredDamage } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/over-the-coals"));
    const td = d => plan.resolution.outcomes[d].noteEffects[0].triggeredDamage;
    assert.deepEqual([td("success").dice, td("success").persistent, td("success").conditions], [3, true, []]);
    assert.deepEqual([td("failure").dice, td("failure").conditions.map(c => [c.slug, c.value])], [6, [["drained", 1]]]);
    assert.deepEqual(td("criticalFailure").conditions.map(c => [c.slug, c.value]), [["drained", 2], ["doomed", 1]]);
    assert.deepEqual([plan.resolution.temporaryImmunity.duration, plan.resolution.temporaryImmunity.degrees ?? null], [{ value: 1, unit: "days" }, null]);
    assert.equal(plan.resolution.reminders.length, 4);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    assert.equal(isTriggeredDamage({ ...td("failure"), conditions: [{ slug: "drained", value: 9, uuid: td("failure").conditions[0].uuid }] }), false);
    const other = compile(withText(await spell("rank-5/over-the-coals"), html => html.replace("target up to two creatures", "target up to three creatures")));
    assert.equal(other.compilerEvidence.coalsDemand, undefined);
});
