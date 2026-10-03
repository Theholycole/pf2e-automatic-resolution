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


// Rank 4, batch 44 (2026-10-02): Darkened Eyes (Fortitude, then 24 hours' immunity: the suppressed darkvision or low-light vision a note Effect for
// 1 round / 1 minute; a critical failure also Blinded for 1 minute with an end-of-turn save that ends the blindness).

test("Darkened Eyes: suppressed vision and the blindness", async () => {
    const plan = compile(await spell("rank-4/darkened-eyes"));
    assert.deepEqual(inspectSavePlan(plan).blockers, []);
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, { value: 24, unit: "hours" });
    const notes = degree => (plan.resolution.outcomes[degree].noteEffects ?? []).map(n => [n.label, n.duration.value, n.duration.unit]);
    assert.deepEqual([notes("criticalSuccess"), notes("success"), notes("failure"), notes("criticalFailure")],
        [[], [["Vision suppressed", 1, "rounds"]], [["Vision suppressed", 1, "minutes"]], [["Vision suppressed", 1, "minutes"]]]);
    const blinded = plan.resolution.outcomes.criticalFailure.effects;
    assert.deepEqual(blinded.map(e => [e.slug, e.duration.value, e.recurringSave?.timing]), [["blinded", 1, "turn-end"]]);
    // A row that isn't the suppression isn't read.
    const other = compile(withText(await spell("rank-4/darkened-eyes"), html => html.replace("is suppressed for 1 round", "is suppressed for 2 hours")));
    assert.equal(other.compilerEvidence.senseSuppression, undefined);
});
