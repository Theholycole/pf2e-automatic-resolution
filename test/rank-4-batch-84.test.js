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


// Rank 4, batch 84 (2026-10-02): Remember the Lost (enemies' basic Will save, Frightened 1 on a critical failure; the caster's answer for each enemy whose
// victims it named: that enemy's damage the larger dice; the immunity the GM's confirmation; the guessing rule a reminder).

test("Remember the Lost: the named enemies' larger dice", async () => {
    const { correctSaveTarget, saveCollectionReadiness } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/remember-the-lost"));
    assert.equal(plan.resolution.check.basic, true);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(e => [e.slug, e.value]), [["frightened", 1]]);
    assert.equal(plan.resolution.targetUpgrade.formula, "(2*(@item.level - 1))d10[mental]");
    assert.deepEqual(plan.targeting.actorConstraints.predicates.map(p => p.kind), ["enemy-of-caster", "gm-confirmed"]);
    assert.ok(plan.resolution.reminders.some(r => /guessing a name/.test(r.text)));
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    assert.equal(supported(plan), true);
    // A larger formula of another type is refused.
    const bad = structuredClone(plan); bad.resolution.targetUpgrade.formula = "(2*(@item.level - 1))d10[fire]";
    assert.ok((inspectSavePlan(bad).blockers ?? []).some(b => /named targets/.test(b.message)));
    // Each damaged target waits for the caster's answer; an answer after the damage roll is refused.
    const state = { spellName: "Remember the Lost", status: "collecting", targetUpgrade: plan.resolution.targetUpgrade, outcomes: plan.resolution.outcomes, damage: { rollJSON: null },
        targets: [{ id: "a", name: "A", degree: "failure", applicationStatus: "pending", eligible: true }, { id: "b", name: "B", degree: "criticalSuccess", applicationStatus: "pending", eligible: true }] };
    assert.match(saveCollectionReadiness(state).reason ?? "", /^Caster: A:/);
    correctSaveTarget(state, "a", { action: "upgrade-yes" }, "gm");
    assert.equal(state.targets[0].upgradeAnswer.answer, "yes");
    assert.doesNotMatch(saveCollectionReadiness(state).reason ?? "", /Caster:/);
    state.damage.rollJSON = {};
    assert.throws(() => correctSaveTarget(state, "a", { action: "upgrade-no" }, "gm"), /already rolled/);
    // Another heightening isn't read.
    const other = compile(withText(await spell("rank-4/remember-the-lost"), html => html.replace("(or 2d10 to an enemy", "(or 3d10 to an enemy")));
    assert.equal(other.compilerEvidence.lostNames, undefined);
});
