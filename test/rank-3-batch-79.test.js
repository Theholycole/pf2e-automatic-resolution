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


// Rank 3, batch 79 (2026-10-02): Unravel Knowledge (the Will save; on a failure or worse a note whose controls — the chosen ability 3d8, or a basic or untrained
// one 3d4, each +1 die a rank — deal the damage once a round; the critical failure's –2 PF2e's toggled Effect; the choice of ability a reminder).

test("Unravel Knowledge: the ability's damage and the toggled penalty", async () => {
    const { isTriggeredDamage } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-3/unravel-knowledge"));
    const td = d => plan.resolution.outcomes[d].noteEffects[0].triggeredDamage;
    assert.deepEqual(td("failure").variants.map(v => [v.dice, v.die, v.heightening.dice]), [[3, 8, 1], [3, 4, 1]]);
    assert.deepEqual([td("failure").frequency, td("criticalFailure").type], ["round", "mental"]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.nativeEffects.map(e => [e.outcomeRule.kind, e.outcomeRule.penalty.value]), [["toggle-penalty-effect", -2]]);
    assert.equal(plan.resolution.outcomes.success.noteEffects?.length ?? 0, 0);
    assert.ok(plan.resolution.reminders.some(r => /Choose a single action/.test(r.text)));
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another penalty is refused by the proof.
    const bad = structuredClone(plan); bad.resolution.outcomes.criticalFailure.nativeEffects[0].outcomeRule.penalty.value = -3;
    assert.ok((inspectSavePlan(bad).blockers ?? []).some(b => /no longer states the row/.test(b.message)));
    assert.equal(isTriggeredDamage({ ...td("failure"), variants: [] }), false);
    const other = compile(withText(await spell("rank-3/unravel-knowledge"), html => html.replace("or by 1d4 for a basic action", "or by 1d6 for a basic action")));
    assert.equal(other.compilerEvidence.knowledgeUnravel, undefined);
});
