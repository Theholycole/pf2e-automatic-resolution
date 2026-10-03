import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { compileAbility } from "../src/compiler/index.js";
import { isExecutableSavePlan } from "../scripts/basic-save-core.js";

const root = process.env.PF2E_CONTENT_ROOT
    ?? fileURLToPath(new URL("../.cache/pf2e-test-fixtures", import.meta.url));

async function spell(path) {
    return JSON.parse(await readFile(`${root}/spells/spells/${path}.json`, "utf8"));
}

function custom(source, name) {
    const copy = structuredClone(source);
    copy.name = name;
    copy._id = `custom-${name.toLowerCase().replaceAll(" ", "-")}`;
    copy.system.slug = copy._id;
    delete copy._stats.compendiumSource;
    return copy;
}

test("basic persistent rider applies only on critical failure", async () => {
    const plan = compileAbility(await spell("cantrip/caustic-blast"));
    assert.equal(isExecutableSavePlan(plan), true);
    assert.ok(plan.compilerEvidence.basicPersistentDamageRider);
    const outcomes = plan.resolution.outcomes;
    assert.equal(outcomes.success.damage.multiplier, 0.5);
    assert.equal(outcomes.failure.damage.multiplier, 1);
    assert.equal(outcomes.criticalFailure.damage.shared.multiplier, 2);
    assert.deepEqual(outcomes.criticalFailure.damage.formulas, [{
        formula: "(1+floor((@item.rank -1)/2))[persistent,acid]",
        source: "description-inline"
    }]);
    assert.equal(outcomes.criticalFailure.damage.formulas[0].heightening, undefined);
    assert.equal(outcomes.failure.damage.formulas, undefined);
});

test("degree save separates initial and persistent damage, including critical doubling", async () => {
    const plan = compileAbility(await spell("cantrip/puff-of-poison"));
    assert.equal(isExecutableSavePlan(plan), true);
    assert.ok(plan.automation.compiledCapabilities.includes("degree-persistent-damage"));
    const outcomes = plan.resolution.outcomes;
    assert.equal(outcomes.criticalSuccess.damage.mode, "none");
    assert.deepEqual(outcomes.success.damage, { mode: "shared", multiplier: 0.5, sourceComponentIds: ["0"] });
    assert.equal(outcomes.failure.damage.shared.multiplier, 1);
    assert.equal(outcomes.criticalFailure.damage.shared.multiplier, 2);
    assert.equal(outcomes.failure.damage.formulas[0].formula, "(ceil(@item.level/2))d4[persistent,poison]");
    assert.equal(outcomes.criticalFailure.damage.formulas[0].formula, "(2*((ceil(@item.level/2))d4))[persistent,poison]");
    assert.equal(outcomes.failure.damage.formulas[0].heightening, undefined);
    assert.equal(outcomes.criticalFailure.damage.formulas[0].heightening, undefined);
});

test("renamed copies derive changed damage dice and rank variables from source", async () => {
    const caustic = custom(await spell("cantrip/caustic-blast"), "Glass Eruption");
    const causticId = Object.keys(caustic.system.damage)[0];
    caustic.system.damage[causticId].formula = "1d10";
    caustic.system.heightening.damage[causticId] = "1d10";
    caustic.system.description.value = caustic.system.description.value
        .replaceAll("d8", "d10")
        .replaceAll("@item.rank", "@item.level")
        .replace("1+floor", "2+floor");
    const causticPlan = compileAbility(caustic);
    assert.equal(isExecutableSavePlan(causticPlan), true);
    assert.equal(causticPlan.source.name, "Glass Eruption");
    assert.equal(causticPlan.resolution.outcomes.criticalFailure.damage.formulas[0].formula,
        "(2+floor((@item.level -1)/2))[persistent,acid]");

    const poison = custom(await spell("cantrip/puff-of-poison"), "Venom Cloud");
    poison.system.damage["0"].formula = "1d6";
    poison.system.heightening.damage["0"] = "1d6";
    poison.system.description.value = poison.system.description.value.replaceAll("d4", "d6")
        .replaceAll("@item.level", "@item.rank");
    const poisonPlan = compileAbility(poison);
    assert.equal(isExecutableSavePlan(poisonPlan), true);
    assert.equal(poisonPlan.source.name, "Venom Cloud");
    assert.equal(poisonPlan.resolution.outcomes.criticalFailure.damage.formulas[0].formula,
        "(2*((ceil(@item.rank/2))d6))[persistent,poison]");
});

test("extra mechanics or inconsistent heightening keep persistent families gated", async () => {
    const baseCaustic = await spell("cantrip/caustic-blast");
    for (const mutate of [
        source => { source.system.description.value = source.system.description.value.replace(
            "Creatures in the area take", "The target's Speed is halved. Creatures in the area take"); },
        source => { source.system.description.value = source.system.description.value.replace(
            "Creatures in the area take", "The target loses 1 action. Creatures in the area take"); },
        source => { source.system.description.value = source.system.description.value.replace(
            "Creatures in the area take", "The target gains one action. Creatures in the area take"); },
        source => { source.system.description.value = source.system.description.value.replace(
            "Creatures in the area take", "The target becomes frightened 2. Creatures in the area take"); },
        source => { source.system.description.value = source.system.description.value.replace(
            "take 1d8 acid damage", "take 3d8 acid damage"); },
        source => { source.system.description.value = source.system.description.value.replace(
            "take 1d8 acid damage", "take 1d8 fire damage"); },
        source => { source.system.description.value = source.system.description.value.replace(
            "take 1d8 acid damage", "take 1d8 acid damage and lose an action"); },
        source => { source.system.description.value = source.system.description.value.replace(
            "]] damage.</p>", "]] damage and is pushed 5 feet.</p>"); },
        source => { source.system.description.value += " The target is also dazzled."; },
        source => { source.system.description.value = source.system.description.value.replace("increases by 1.</p>", "increases by 2.</p>"); },
        source => { source.system.heightening.interval = 0;
            source.system.description.value = source.system.description.value.replaceAll("(+2)", "(+0)").replaceAll("/2)", "/0)"); },
        source => { source.system.damage[Object.keys(source.system.damage)[0]].formula = "0d8";
            source.system.description.value = source.system.description.value.replace("take 1d8 acid damage", "take 0d8 acid damage"); }
    ]) {
        const source = structuredClone(baseCaustic);
        mutate(source);
        assert.equal(isExecutableSavePlan(compileAbility(source)), false);
    }

    const basePoison = await spell("cantrip/puff-of-poison");
    for (const mutate of [
        source => { source.system.description.value = source.system.description.value.replace(
            "at an enemy's face.", "at an enemy's face and lose an action."); },
        source => { source.system.description.value = source.system.description.value.replace(
            "at an enemy's face.", "at an enemy's face and create an ally."); },
        source => { source.system.description.value = source.system.description.value.replace(
            "at an enemy's face.", "at an enemy's face and suffer a curse."); },
        source => { source.system.description.value = source.system.description.value.replace(
            "The target takes half initial damage", "The target is slowed 1. The target takes half initial damage"); },
        source => { source.system.description.value = source.system.description.value.replace(
            "The target takes full initial and persistent damage.", "The target takes full initial and persistent damage and is pushed 5 feet."); },
        source => { source.system.description.value = source.system.description.value.replace("@item.level/2", "@item.level/3"); },
        source => { source.system.description.value = source.system.description.value.replace(
            "persistent poison damage increases by 1d4", "persistent poison damage increases by 2d4"); },
        source => { source.system.heightening.interval = 0;
            source.system.description.value = source.system.description.value.replaceAll("(+2)", "(+0)").replaceAll("/2", "/0"); },
        source => { source.system.description.value = source.system.description.value.replace(
            "<strong>Critical Success</strong>", "The target loses an action. <strong>Critical Success</strong>"); },
        source => { source.system.damage["0"].formula = "1d0";
            source.system.description.value = source.system.description.value.replaceAll("d4", "d0"); }
    ]) {
        const source = structuredClone(basePoison);
        mutate(source);
        assert.equal(isExecutableSavePlan(compileAbility(source)), false);
    }
});

test("uncertified structured persistent components and separate lifecycle mechanics remain gated", async () => {
    const ancient = compileAbility(await spell("cantrip/ancient-dust"));
    delete ancient.compilerEvidence.componentSelectiveDamage;
    assert.equal(isExecutableSavePlan(ancient), false);
    // Phantom Pain's persistent damage ending with Sickened is compiled (cantrip-rank-1 batch 85); without that sentence it stays gated.
    const phantom = await spell("rank-1/phantom-pain");
    phantom.system.description.value = phantom.system.description.value.replace("If the target recovers from being Sickened, the persistent damage ends and the spell ends.", "The persistent damage lasts until the target recovers.");
    // (Scouring Pulse's failing-row persistent damage and halo are compiled since rank-5 batch 22.)
    for (const source of [phantom]) {
        assert.equal(isExecutableSavePlan(compileAbility(source)), false, source.name);
    }
});
