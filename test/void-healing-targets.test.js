import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { compileAbility, validateAbilityPlan } from "../src/compiler/index.js";
import { compileActorTargetConstraints } from "../src/compiler/target-predicate-compiler.js";
import { validateActorTarget } from "../scripts/basic-save-core.js";

const fixtureRoot = process.env.PF2E_CONTENT_ROOT
    ?? fileURLToPath(new URL("../.cache/pf2e-test-fixtures", import.meta.url));

const expected = {
    supportsActorTargets: true,
    complete: true,
    predicates: [{ kind: "undead-or-void-healing" }]
};

function constraints(target) {
    return compileActorTargetConstraints({ target });
}

function creature(traits = [], negativeHealing = false, type = "npc") {
    return { type, system: { traits: { value: traits }, attributes: { hp: { negativeHealing } } } };
}

test("target grammar compiles undead or native void healing as one OR predicate", () => {
    for (const target of [
        "1 creature that is undead or otherwise has void healing",
        "one creature that is undead or has void healing",
        "2 creatures that are undead or otherwise have void healing",
        "one creature that has void healing or is undead"
    ]) {
        assert.deepEqual(constraints(target), { sourceText: target, ...expected });
    }
    const extraRule = constraints("1 creature that is undead or otherwise has void healing and is willing");
    assert.equal(extraRule.complete, false);
});

test("void-healing eligibility reads live PF2e HP state and undead trait", () => {
    const rule = constraints("1 creature that is undead or otherwise has void healing");
    const undead = creature(["undead"], false);
    const livingVoid = creature([], true);
    const living = creature();
    const construct = creature(["construct"]);
    const constructVoid = creature(["construct"], true);
    const objectVoid = creature([], true, "hazard");

    assert.equal(validateActorTarget(rule, undead).eligible, true);
    assert.equal(validateActorTarget(rule, livingVoid).eligible, true);
    assert.equal(validateActorTarget(rule, living).eligible, false);
    assert.equal(validateActorTarget(rule, construct).eligible, false);
    assert.equal(validateActorTarget(rule, constructVoid).eligible, true);
    assert.equal(validateActorTarget(rule, objectVoid).eligible, false);
    assert.equal(validateActorTarget(rule, { type: "npc", system: { traits: { value: [] } } }).eligible, false);

    // An initially eligible saved target is checked again before application.
    const savedRule = structuredClone(rule);
    livingVoid.system.attributes.hp.negativeHealing = false;
    assert.equal(validateActorTarget(savedRule, livingVoid).eligible, false);
    livingVoid.system.attributes.hp.negativeHealing = true;
    assert.equal(validateActorTarget(savedRule, livingVoid).eligible, true);
    livingVoid.system.attributes.hp.negativeHealing = false;
    livingVoid.hitPoints = { negativeHealing: true };
    assert.equal(validateActorTarget(savedRule, livingVoid).eligible, true);
});

test("renamed custom spell retains generic target eligibility", async () => {
    const original = JSON.parse(await readFile(
        `${fixtureRoot}/spells/spells/cantrip/vitality-lash.json`, "utf8"
    ));
    const custom = structuredClone(original);
    custom.name = "Creation's Rebuke";
    custom._id = "custom-creations-rebuke";
    custom.system.slug = "creations-rebuke";
    custom._stats.compendiumSource = null;
    const plan = compileAbility(custom);

    assert.equal(plan.source.name, custom.name);
    assert.deepEqual(plan.targeting.actorConstraints, {
        sourceText: original.system.target.value,
        ...expected
    });
    assert.equal(validateAbilityPlan(plan).some(error => error.code === "ACTOR_TARGET_PREDICATE_INVALID"), false);
});
