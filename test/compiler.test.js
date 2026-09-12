import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
    analyzeResidualProse,
    compileAbility,
    degreesFromNativeEffectLabel,
    compileItemDuration,
    DISMISS_ACTION_UUID,
    extractConditionReferences,
    extractDegreeSections,
    extractInlineExpressions,
    extractNativeSpellEffectLinks,
    extractScopedConditionReferences,
    validateAbilityPlan
} from "../src/compiler/index.js";
import {
    effectForApplication,
    recipientActorType,
    selectApplications,
    selectChoiceBranch,
    selectRankBranch
} from "../scripts/runtime-core.js";

const contentRoot = "/home/theholycole/Documents/ChatGPT/pf2e/spells/spells";
const effectRoot = "/home/theholycole/Documents/ChatGPT/pf2e/spell-effects";

async function fixture(relativePath) {
    return JSON.parse(await readFile(`${contentRoot}/${relativePath}`, "utf8"));
}

async function effectCatalog(...relativePaths) {
    const entries = await Promise.all(relativePaths.map(async relativePath => {
        const source = JSON.parse(await readFile(`${effectRoot}/${relativePath}`, "utf8"));
        const rules = source.system?.rules ?? [];
        return [source.name, {
            id: source._id,
            name: source.name,
            type: source.type,
            sourceFile: relativePath,
            automation: {
                ruleKeys: [...new Set(rules.map(rule => rule.key).filter(Boolean))],
                requiresConfiguration: rules.some(rule => rule.key === "ChoiceSet"),
                removesAfterRoll: rules.some(rule => rule.removeAfterRoll != null)
            }
        }];
    }));
    return new Map(entries);
}

async function installedPackFixture(spellPath, ...effectPaths) {
    const source = await fixture(spellPath);
    const byName = await effectCatalog(...effectPaths);
    const catalog = new Map();
    const profiles = [...byName.values()].sort((left, right) => right.name.length - left.name.length);
    for (const profile of profiles) {
        source.system.description.value = source.system.description.value.replaceAll(
            `Compendium.pf2e.spell-effects.Item.${profile.name}`,
            `Compendium.pf2e.spell-effects.Item.${profile.id}`
        );
        catalog.set(profile.name, profile);
        catalog.set(profile.id, profile);
    }
    return { source, catalog };
}

test("compiles Electric Arc structured basic-save damage", async () => {
    const plan = compileAbility(await fixture("cantrip/electric-arc.json"));

    assert.equal(plan.source.name, "Electric Arc");
    assert.equal(plan.resolution.kind, "save");
    assert.equal(plan.resolution.check.statistic, "reflex");
    assert.equal(plan.resolution.check.basic, true);
    assert.equal(plan.resolution.sharedDamage.rollOnce, true);
    assert.equal(plan.resolution.sharedDamage.components[0].formula, "2d4");
    assert.equal(plan.resolution.sharedDamage.components[0].type, "electricity");
    assert.equal(plan.resolution.outcomes.criticalSuccess.damage.multiplier, 0);
    assert.equal(plan.resolution.outcomes.success.damage.multiplier, 0.5);
    assert.equal(plan.resolution.outcomes.failure.damage.multiplier, 1);
    assert.equal(plan.resolution.outcomes.criticalFailure.damage.multiplier, 2);
    assert.equal(plan.automation.level, "automatic");
    assert.ok(plan.diagnostics.some(entry => entry.code === "SIMPLE_BASIC_SAVE_COMPLETE"));
    assert.deepEqual(validateAbilityPlan(plan), []);
});

test("preserves Fireball targeting, area, and heightening", async () => {
    const plan = compileAbility(await fixture("rank-3/fireball.json"));

    assert.deepEqual(plan.targeting.area, { type: "burst", value: 20 });
    assert.equal(plan.rank, 3);
    assert.equal(plan.resolution.sharedDamage.heightening.type, "interval");
    assert.deepEqual(plan.resolution.sharedDamage.heightening.damage, { "0": "2d6" });
    assert.equal(plan.automation.level, "automatic");
});

test("creates a caster controller contract for sustained spells", async () => {
    const plan = compileAbility(await fixture("rank-2/laughing-fit.json"));

    assert.equal(plan.automation.level, "guided");
    assert.equal(plan.resolution.kind, "save");
    assert.equal(plan.resolution.check.statistic, "will");
    assert.deepEqual(
        plan.resolution.outcomes.failure.effects.map(effect => [effect.slug, effect.value]),
        [["slowed", 1]]
    );
    assert.equal(plan.lifecycle.sustained, true);
    assert.equal(plan.lifecycle.durationSpec.mode, "sustained");
    assert.equal(plan.lifecycle.durationSpec.endsWhen[0].event, "sustain-ended");
    assert.equal(plan.lifecycle.controller.required, true);
    assert.equal(plan.lifecycle.controller.owner, "source-actor");
    assert.equal(plan.lifecycle.controller.deletionEndsCast, true);
    assert.equal(plan.lifecycle.controller.removeDependentEffects, true);
    assert.ok(plan.diagnostics.some(entry => entry.code === "NON_BASIC_DEGREE_SECTIONS_COMPILED"));
});

test("retains the interaction and reroll contract on every spell plan", async () => {
    const plan = compileAbility(await fixture("rank-3/fireball.json"));

    assert.equal(plan.decisionWindows.beforeRoll, true);
    assert.equal(plan.decisionWindows.nativeRollDialog, true);
    assert.equal(plan.decisionWindows.provisionalResult, true);
    assert.equal(plan.decisionWindows.rerollBeforeApplication, "replace");
    assert.equal(plan.decisionWindows.rerollAfterApplication, "manual-review");
    assert.equal(plan.decisionWindows.applicationRequiresConfirmation, true);
});

test("returns a diagnostic instead of throwing for unknown item types", () => {
    const plan = compileAbility({ _id: "example", name: "Example Action", type: "action", system: {} });

    assert.equal(plan.automation.level, "unsupported");
    assert.equal(plan.diagnostics[0].code, "SOURCE_ADAPTER_NOT_IMPLEMENTED");
});

test("extracts bounded degree sections without leaking heightening text", () => {
    const sections = extractDegreeSections([
        "<p><strong>Critical Success</strong> Nothing happens.</p>",
        "<p><strong>Success</strong> Half damage.</p>",
        "<p><strong>Failure</strong> Full damage.</p>",
        "<p><strong>Critical Failure</strong> Double damage.</p>",
        "<p><strong>Heightened (+1)</strong> The damage increases.</p>"
    ].join(""));

    assert.deepEqual(Object.keys(sections), ["criticalSuccess", "success", "failure", "criticalFailure"]);
    assert.equal(sections.criticalFailure.text, "Double damage.");
});

test("inherits omitted PF2e critical outcomes from their ordinary outcome", async () => {
    const plan = compileAbility(await fixture("rank-1/command.json"));

    assert.equal(plan.resolution.kind, "save");
    assert.equal(plan.compilerEvidence.inheritedDegreeSections.criticalSuccess, "success");
    assert.equal(plan.resolution.outcomes.criticalSuccess.rawText, plan.resolution.outcomes.success.rawText);
    assert.ok(plan.diagnostics.some(entry => entry.code === "OMITTED_CRITICAL_OUTCOMES_INHERITED"));
});

test("extracts valued and unvalued PF2e condition references", () => {
    const effects = extractConditionReferences(
        "@UUID[Compendium.pf2e.conditionitems.Item.Sickened]{Sickened 2} and "
        + "@UUID[Compendium.pf2e.conditionitems.Item.Prone]"
    );

    assert.deepEqual(effects.map(effect => ({ slug: effect.slug, value: effect.value })), [
        { slug: "sickened", value: 2 },
        { slug: "prone", value: null }
    ]);
});

test("extracts raw and enriched native spell-effect links and compound degree labels", () => {
    const links = extractNativeSpellEffectLinks(
        "@UUID[Compendium.pf2e.spell-effects.Item.Spell Effect: Example]{Example Effect} "
        + '<a data-uuid="Compendium.pf2e.spell-effects.Item.Spell Effect: Other">Other Effect</a>'
    );

    assert.deepEqual(links.map(link => [link.reference, link.label]), [
        ["Spell Effect: Example", "Example Effect"],
        ["Spell Effect: Other", "Other Effect"]
    ]);
    assert.deepEqual(
        degreesFromNativeEffectLabel("Spell Effect: Example (Failure or Critical Failure)"),
        ["failure", "criticalFailure"]
    );
});

test("compiles and resolves native spell effects into their intended outcomes", async () => {
    const catalog = await effectCatalog(
        "spell-effect-equal-footing-success.json",
        "spell-effect-equal-footing-failure-or-critical-failure.json"
    );
    const plan = compileAbility(await fixture("rank-1/equal-footing.json"), { nativeEffectCatalog: catalog });

    assert.equal(plan.resolution.outcomes.success.nativeEffects[0].reference, "Spell Effect: Equal Footing (Success)");
    assert.equal(plan.resolution.outcomes.failure.nativeEffects[0].reference, "Spell Effect: Equal Footing (Failure or Critical Failure)");
    assert.equal(plan.resolution.outcomes.criticalFailure.nativeEffects[0].reference, "Spell Effect: Equal Footing (Failure or Critical Failure)");
    assert.equal(plan.resolution.outcomes.success.nativeEffects[0].recipient.actor, "target");
    assert.equal(plan.resolution.outcomes.success.nativeEffects[0].resolutionStatus, "resolved");
    assert.ok(plan.automation.compiledCapabilities.includes("native-spell-effects"));
    assert.deepEqual(validateAbilityPlan(plan), []);
});

test("preserves caster recipients and leaves ambiguous native-effect scope pending", async () => {
    const deathKnell = compileAbility(await fixture("rank-2/death-knell.json"));
    assert.equal(deathKnell.resolution.outcomes.failure.nativeEffects[0].recipient.actor, "source");
    assert.equal(deathKnell.resolution.outcomes.criticalFailure.nativeEffects[0].recipient.actor, "source");

    const mentalMap = compileAbility(await fixture("rank-2/mental-map.json"));
    assert.equal(mentalMap.resolution.outcomes.failure.nativeEffects[0].recipient.actor, "source");
    assert.equal(mentalMap.resolution.outcomes.criticalFailure.nativeEffects[0].recipient.actor, "source");

    const wardingAggression = compileAbility(await fixture("rank-3/warding-aggression.json"));
    assert.equal(wardingAggression.nativeEffects.unscoped[0].recipient.actor, "source");
    assert.ok(wardingAggression.automation.pendingCapabilities.includes("native-spell-effect-scope"));
});

test("compiles safe immediate native effects with explicit actor recipients", async () => {
    const fleetStep = compileAbility(await fixture("rank-1/fleet-step.json"));
    assert.equal(fleetStep.nativeEffects.onUse[0].recipient.actor, "source");
    assert.deepEqual(fleetStep.nativeEffects.onUse[0].trigger, {
        event: "use",
        timing: "after-activation",
        once: true
    });

    const rousingSplash = compileAbility(await fixture("cantrip/rousing-splash.json"));
    assert.equal(rousingSplash.nativeEffects.onUse[0].recipient.actor, "target");
    assert.equal(rousingSplash.nativeEffects.onUse[0].applicationRequiresConfirmation, true);

    const beseech = compileAbility(await fixture("rank-1/beseech-the-sphinx.json"));
    assert.equal(beseech.nativeEffects.onUse[0].recipient.actor, "target");
    assert.ok(beseech.automation.compiledCapabilities.includes("native-spell-effect-on-use"));
});

test("builds automatic, prompted, and guided direct native-effect resolutions", async () => {
    const fleetCatalog = await effectCatalog("spell-effect-fleet-step.json");
    const fleetStep = compileAbility(await fixture("rank-1/fleet-step.json"), { nativeEffectCatalog: fleetCatalog });
    assert.equal(fleetStep.resolution.kind, "effect");
    assert.equal(fleetStep.automation.level, "automatic");
    assert.equal(fleetStep.resolution.applications[0].uuid, fleetStep.nativeEffects.onUse[0].uuid);
    const [fleetApplication] = selectApplications(fleetStep);
    assert.equal(effectForApplication(fleetStep, fleetApplication).reference, "Spell Effect: Fleet Step");

    const beseechCatalog = await effectCatalog("spell-effect-beseech-the-sphinx.json");
    const beseech = compileAbility(await fixture("rank-1/beseech-the-sphinx.json"), { nativeEffectCatalog: beseechCatalog });
    assert.equal(beseech.resolution.kind, "effect");
    assert.equal(beseech.automation.level, "prompted");
    assert.equal(beseech.compilerEvidence.directEffectCompleteness.requiresConfiguration, true);

    const splashCatalog = await effectCatalog("spell-effect-rousing-splash.json");
    const splash = compileAbility(await fixture("cantrip/rousing-splash.json"), { nativeEffectCatalog: splashCatalog });
    assert.equal(splash.resolution.kind, "effect");
    assert.equal(splash.automation.level, "guided");
    assert.ok(splash.automation.pendingCapabilities.includes("direct-effect:temporary-immunity"));
    assert.ok(splash.automation.pendingCapabilities.includes("direct-effect:recovery-check"));
    assert.deepEqual(validateAbilityPlan(splash), []);
});

test("ships an installable Foundry v14 and PF2e 8.5 module manifest", async () => {
    const manifest = JSON.parse(await readFile(new URL("../module.json", import.meta.url), "utf8"));

    assert.equal(manifest.id, "pf2e-automatic-resolution");
    assert.equal(manifest.compatibility.minimum, "14");
    assert.equal(manifest.relationships.systems[0].id, "pf2e");
    assert.equal(manifest.relationships.systems[0].compatibility.minimum, "8.5.0");
    assert.deepEqual(manifest.esmodules, ["scripts/main.js"]);
});

test("compiles standard and recipient-scoped Dismiss transitions", async () => {
    const pestCatalog = await effectCatalog("spell-effect-pest-form.json");
    const pest = compileAbility(await fixture("rank-1/pest-form.json"), { nativeEffectCatalog: pestCatalog });
    const pestTermination = pest.nativeEffects.terminations[0];
    assert.equal(pest.automation.level, "automatic");
    assert.equal(pestTermination.action.uuid, DISMISS_ACTION_UUID);
    assert.deepEqual(pestTermination.action.cost, { type: "action", value: 1 });
    assert.equal(pestTermination.authority.actor, "source");
    assert.equal(pestTermination.scope, "cast-instance");
    assert.equal(pestTermination.applicationRequiresConfirmation, true);
    assert.equal(pest.resolution.applications[0].terminationId, pestTermination.id);

    const herdCatalog = await effectCatalog("spell-effect-primal-herd.json");
    const herd = compileAbility(await fixture("rank-10/primal-herd.json"), { nativeEffectCatalog: herdCatalog });
    assert.equal(herd.nativeEffects.terminations[0].authority.actor, "target");
    assert.equal(herd.nativeEffects.terminations[0].scope, "recipient-effect");
    assert.deepEqual(validateAbilityPlan(pest), []);
    assert.deepEqual(validateAbilityPlan(herd), []);
});

test("compiles triggered free-action dismissal without losing its trigger", async () => {
    const catalog = await effectCatalog("spell-effect-oaken-resilience.json");
    const plan = compileAbility(await fixture("rank-2/oaken-resilience.json"), { nativeEffectCatalog: catalog });
    const termination = plan.nativeEffects.terminations[0];

    assert.equal(plan.automation.level, "automatic");
    assert.deepEqual(termination.action.cost, { type: "free-action", value: 0 });
    assert.deepEqual(termination.action.traits, ["concentrate"]);
    assert.deepEqual(termination.action.trigger, { event: "damage-taken", damageType: "fire" });
    assert.equal(termination.authority.actor, "target");
    assert.deepEqual(validateAbilityPlan(plan), []);
});

test("keeps post-dismissal consequences guided", async () => {
    const catalog = await effectCatalog("spell-effect-earthbreaker-stride.json");
    const plan = compileAbility(await fixture("rank-8/earthbreaker-stride.json"), { nativeEffectCatalog: catalog });

    assert.equal(plan.resolution.kind, "effect");
    assert.equal(plan.automation.level, "guided");
    assert.ok(plan.automation.pendingCapabilities.includes("direct-effect:dismissal-consequence"));
    assert.equal(plan.nativeEffects.terminations[0].complete, false);
    assert.deepEqual(validateAbilityPlan(plan), []);
});

test("sequences primary native Effects into delayed immunity Effects", async () => {
    const guidanceCatalog = await effectCatalog(
        "spell-effect-guidance.json",
        "effect-guidance-immunity.json"
    );
    const guidance = compileAbility(await fixture("cantrip/guidance.json"), { nativeEffectCatalog: guidanceCatalog });
    assert.equal(guidance.resolution.kind, "effect-sequence");
    assert.equal(guidance.automation.level, "prompted");
    assert.equal(guidance.nativeEffects.onUse[0].recipient.actor, "target");
    assert.equal(guidance.nativeEffects.deferred[0].recipient.actor, "target");
    assert.deepEqual(guidance.nativeEffects.deferred[0].trigger.reasons, ["consumed", "expired"]);
    assert.equal(guidance.nativeEffects.sequences[0].reapplication.blockedWhileSuccessorActive, true);
    assert.equal(
        guidance.nativeEffects.sequences[0].reapplication.blockerEffectUuid,
        guidance.nativeEffects.deferred[0].uuid
    );
    assert.equal(guidance.nativeEffects.unscoped.length, 0);
    assert.equal(selectApplications(guidance)[0].uuid, guidance.nativeEffects.onUse[0].uuid);

    const shieldCatalog = await effectCatalog(
        "spell-effect-shield.json",
        "effect-shield-immunity.json"
    );
    const shield = compileAbility(await fixture("cantrip/shield.json"), { nativeEffectCatalog: shieldCatalog });
    assert.equal(shield.resolution.kind, "effect-sequence");
    assert.equal(shield.automation.level, "prompted");
    assert.equal(shield.nativeEffects.onUse[0].recipient.actor, "source");
    assert.equal(shield.nativeEffects.deferred[0].trigger.event, "action-used");
    assert.equal(shield.nativeEffects.deferred[0].trigger.actionUuid, "Compendium.pf2e.feats-srd.Item.Shield Block");
    assert.equal(shield.nativeEffects.deferred[0].trigger.removesSourceEffect, true);
    assert.equal(shield.nativeEffects.sequences[0].reapplication.reason, "temporary-immunity");
    assert.deepEqual(validateAbilityPlan(shield), []);
});

test("compiles installed-pack document-ID links into rank, choice, and sequence paths", async () => {
    const tailwind = await installedPackFixture(
        "rank-1/tailwind.json",
        "spell-effect-tailwind.json",
        "spell-effect-tailwind-8-hours.json"
    );
    assert.equal(compileAbility(tailwind.source, { nativeEffectCatalog: tailwind.catalog }).resolution.kind, "effect-variant");

    const animalFiles = [
        "ape", "bear", "bull", "canine", "cat", "crab", "crocodile",
        "deer", "frog", "orca", "seal", "shark", "snake"
    ].map(form => `spell-effect-animal-form-${form}.json`);
    const animalForm = await installedPackFixture("rank-2/animal-form.json", ...animalFiles);
    const animalPlan = compileAbility(animalForm.source, { nativeEffectCatalog: animalForm.catalog });
    assert.equal(animalPlan.resolution.kind, "effect-choice");
    assert.equal(animalPlan.resolution.selector.branches.length, 13);

    const guidance = await installedPackFixture(
        "cantrip/guidance.json",
        "spell-effect-guidance.json",
        "effect-guidance-immunity.json"
    );
    assert.equal(compileAbility(guidance.source, { nativeEffectCatalog: guidance.catalog }).resolution.kind, "effect-sequence");

    const shield = await installedPackFixture(
        "cantrip/shield.json",
        "spell-effect-shield.json",
        "effect-shield-immunity.json"
    );
    assert.equal(compileAbility(shield.source, { nativeEffectCatalog: shield.catalog }).resolution.kind, "effect-sequence");
});

test("selects exactly one Tailwind Effect from the cast rank", async () => {
    const catalog = await effectCatalog(
        "spell-effect-tailwind.json",
        "spell-effect-tailwind-8-hours.json"
    );
    const tailwind = compileAbility(await fixture("rank-1/tailwind.json"), { nativeEffectCatalog: catalog });

    assert.equal(tailwind.nativeEffects.sequences.length, 0);
    assert.equal(tailwind.nativeEffects.onUse.length, 0);
    assert.equal(tailwind.nativeEffects.unscoped.length, 0);
    assert.equal(tailwind.nativeEffects.rankVariants.length, 2);
    assert.equal(tailwind.resolution.kind, "effect-variant");
    assert.equal(tailwind.automation.level, "automatic");
    assert.deepEqual(tailwind.resolution.selector.branches.map(branch => [branch.minRank, branch.maxRank]), [
        [1, 1],
        [2, null]
    ]);
    assert.equal(tailwind.resolution.selector.exclusive, true);
    assert.equal(tailwind.resolution.selector.exhaustive, true);
    assert.equal(selectRankBranch(tailwind.resolution.selector, 1).effectUuid, tailwind.nativeEffects.rankVariants[0].uuid);
    assert.equal(selectRankBranch(tailwind.resolution.selector, 10).effectUuid, tailwind.nativeEffects.rankVariants[1].uuid);
    assert.equal(selectApplications(tailwind, { castRank: 2 })[0].uuid, tailwind.nativeEffects.rankVariants[1].uuid);
    assert.deepEqual(validateAbilityPlan(tailwind), []);

    const overlapping = structuredClone(tailwind);
    overlapping.resolution.selector.branches[1].minRank = 1;
    assert.ok(validateAbilityPlan(overlapping)
        .some(error => error.code === "RANK_PARTITION_DISCONTIGUOUS"));
});

test("selects Darkvision duration and recipient independently by cast rank", async () => {
    const catalog = await effectCatalog(
        "spell-effect-darkvision.json",
        "spell-effect-darkvision-24-hours.json"
    );
    const darkvision = compileAbility(await fixture("rank-2/darkvision.json"), { nativeEffectCatalog: catalog });

    assert.equal(darkvision.resolution.kind, "effect-variant");
    assert.equal(darkvision.automation.level, "automatic");
    assert.deepEqual(darkvision.resolution.selector.branches.map(branch => [branch.minRank, branch.maxRank]), [
        [2, 4],
        [5, null]
    ]);
    assert.deepEqual(darkvision.resolution.selector.recipientBranches.map(branch => [branch.minRank, branch.maxRank, branch.actor]), [
        [2, 2, "source"],
        [3, null, "target"]
    ]);
    assert.ok(darkvision.nativeEffects.rankVariants.every(effect => effect.recipient.actor === "rank-dependent"));
    assert.equal(recipientActorType(darkvision.nativeEffects.rankVariants[0], 2), "source");
    assert.equal(recipientActorType(darkvision.nativeEffects.rankVariants[0], 3), "target");
    assert.deepEqual(validateAbilityPlan(darkvision), []);
});

test("keeps rank-selected Effects guided when description mechanics remain", async () => {
    const ironGutCatalog = await effectCatalog(
        "spell-effect-iron-gut.json",
        "spell-effect-iron-gut-3rd-rank.json"
    );
    const ironGut = compileAbility(await fixture("rank-2/iron-gut.json"), { nativeEffectCatalog: ironGutCatalog });
    assert.equal(ironGut.resolution.kind, "effect-variant");
    assert.equal(ironGut.automation.level, "guided");
    assert.ok(ironGut.automation.pendingCapabilities.includes("rank-variant:description-damage"));

    const vesselCatalog = await effectCatalog(
        "spell-effect-divine-vessel.json",
        "spell-effect-divine-vessel-9th-level.json"
    );
    const divineVessel = compileAbility(await fixture("rank-7/divine-vessel.json"), { nativeEffectCatalog: vesselCatalog });
    assert.equal(divineVessel.resolution.kind, "effect-variant");
    assert.equal(divineVessel.automation.level, "guided");
    assert.ok(divineVessel.automation.pendingCapabilities.includes("rank-variant:prerequisite-or-placement"));
    assert.deepEqual(validateAbilityPlan(ironGut), []);
    assert.deepEqual(validateAbilityPlan(divineVessel), []);
});

test("compiles Animal Form as one required player-selected Effect", async () => {
    const files = [
        "ape", "bear", "bull", "canine", "cat", "crab", "crocodile",
        "deer", "frog", "orca", "seal", "shark", "snake"
    ].map(form => `spell-effect-animal-form-${form}.json`);
    const catalog = await effectCatalog(...files);
    const plan = compileAbility(await fixture("rank-2/animal-form.json"), { nativeEffectCatalog: catalog });

    assert.equal(plan.resolution.kind, "effect-choice");
    assert.equal(plan.automation.level, "prompted");
    assert.equal(plan.resolution.selector.prompt, "select-one");
    assert.equal(plan.resolution.selector.required, true);
    assert.equal(plan.resolution.selector.exclusive, true);
    assert.equal(plan.resolution.selector.applicationRequiresConfirmation, true);
    assert.equal(plan.resolution.selector.branches.length, 13);
    assert.equal(plan.nativeEffects.choiceVariants.length, 13);
    assert.equal(plan.nativeEffects.unscoped.length, 0);
    assert.equal(plan.nativeEffects.terminations.length, 13);
    const cat = selectChoiceBranch(plan.resolution.selector, "cat");
    assert.equal(cat.label, "Cat");
    assert.equal(selectApplications(plan, { choiceId: "cat" })[0].uuid, cat.effectUuid);
    assert.deepEqual(validateAbilityPlan(plan), []);

    const duplicateChoice = structuredClone(plan);
    duplicateChoice.resolution.selector.branches[1].choiceId = duplicateChoice.resolution.selector.branches[0].choiceId;
    assert.ok(validateAbilityPlan(duplicateChoice)
        .some(error => error.code === "EFFECT_CHOICE_BRANCHES_INVALID"));
});

test("compiles every Dinosaur Form option into the shared choice selector", async () => {
    const files = [
        "ankylosaurus", "brontosaurus", "deinonychus",
        "stegosaurus", "triceratops", "tyrannosaurus"
    ].map(form => `spell-effect-dinosaur-form-${form}.json`);
    const catalog = await effectCatalog(...files);
    const plan = compileAbility(await fixture("rank-4/dinosaur-form.json"), { nativeEffectCatalog: catalog });

    assert.equal(plan.resolution.kind, "effect-choice");
    assert.equal(plan.automation.level, "prompted");
    assert.deepEqual(plan.resolution.selector.branches.map(branch => branch.label), [
        "Ankylosaurus", "Brontosaurus", "Deinonychus",
        "Stegosaurus", "Triceratops", "Tyrannosaurus"
    ]);
    assert.deepEqual(validateAbilityPlan(plan), []);
});

test("keeps choice variants guided when their native Effects contain auras", async () => {
    const files = ["air", "earth", "fire", "metal", "water", "wood"]
        .map(element => `spell-effect-element-embodied-${element}.json`);
    const catalog = await effectCatalog(...files);
    const plan = compileAbility(await fixture("rank-10/element-embodied.json"), { nativeEffectCatalog: catalog });

    assert.equal(plan.resolution.kind, "effect-choice");
    assert.equal(plan.automation.level, "guided");
    assert.equal(plan.resolution.selector.branches.length, 6);
    assert.ok(plan.automation.pendingCapabilities.includes("choice-variant:aura-reminder-runtime"));
    assert.deepEqual(validateAbilityPlan(plan), []);
});

test("keeps degree-dependent, aura, and non-Actor native effects unscoped", async () => {
    const tangleVine = compileAbility(await fixture("cantrip/tangle-vine.json"));
    assert.equal(tangleVine.nativeEffects.onUse.length, 0);
    assert.ok(tangleVine.nativeEffects.unscoped[0].triggerAnalysis.reasons.includes("degree-sections-present"));

    const protection = compileAbility(await fixture("rank-1/protection.json"));
    assert.equal(protection.nativeEffects.onUse.length, 0);
    assert.ok(protection.nativeEffects.unscoped[0].triggerAnalysis.reasons.includes("area-or-aura-present"));

    const runicWeapon = compileAbility(await fixture("rank-1/runic-weapon.json"));
    assert.equal(runicWeapon.nativeEffects.onUse.length, 0);
    assert.ok(runicWeapon.nativeEffects.unscoped[0].triggerAnalysis.reasons.includes("non-actor-target"));

    const shillelagh = compileAbility(await fixture("rank-1/shillelagh.json"));
    assert.equal(shillelagh.nativeEffects.onUse.length, 0);
    assert.ok(shillelagh.nativeEffects.unscoped[0].triggerAnalysis.reasons.includes("non-actor-target"));

    const variableGravity = compileAbility(await fixture("rank-4/variable-gravity.json"));
    assert.equal(variableGravity.nativeEffects.onUse.length, 0);
    assert.ok(variableGravity.nativeEffects.unscoped[0].triggerAnalysis.reasons.includes("option-block-link"));

    const chromaticArmor = compileAbility(await fixture("rank-4/chromatic-armor.json"));
    assert.equal(chromaticArmor.nativeEffects.onUse.length, 0);
    assert.ok(chromaticArmor.nativeEffects.unscoped[0].triggerAnalysis.reasons.includes("immediate-application-not-explicit"));
});

test("assigns the nearest mention-scoped condition duration", () => {
    const effects = extractScopedConditionReferences(
        "The creature is @UUID[Compendium.pf2e.conditionitems.Item.Blinded] for 1 round and "
        + "@UUID[Compendium.pf2e.conditionitems.Item.Deafened] for 1 minute."
    );

    assert.deepEqual(effects.map(effect => [effect.slug, effect.duration?.value, effect.duration?.unit]), [
        ["blinded", 1, "rounds"],
        ["deafened", 1, "minutes"]
    ]);
});

test("compiles event-based condition expiration", async () => {
    const stinkingCloud = compileAbility(await fixture("rank-3/stinking-cloud.json"));
    for (const effect of stinkingCloud.resolution.outcomes.failure.effects) {
        assert.ok(effect.endsWhen.some(event => event.event === "leave-area"));
        assert.equal(effect.expirationMode, "event");
    }

    const tether = compileAbility(await fixture("rank-1/tether.json"));
    const immobilized = tether.resolution.outcomes.criticalFailure.effects.find(effect => effect.slug === "immobilized");
    assert.deepEqual(immobilized.endsWhen.map(event => event.event), ["escape", "spell-ended"]);

    const enfeeble = compileAbility(await fixture("rank-1/enfeeble.json"));
    const enfeebled = enfeeble.resolution.outcomes.success.effects[0];
    assert.equal(enfeebled.duration.anchor, "source-turn");
    assert.equal(enfeebled.duration.expiry, "turn-start");
});

test("normalizes item duration without guessing variable text", () => {
    assert.deepEqual(compileItemDuration("until the end of your turn"), {
        mode: "turn-boundary",
        value: 1,
        unit: "rounds",
        expiry: "turn-end",
        anchor: "source-turn",
        offset: 0,
        raw: "until the end of your turn"
    });
    assert.equal(compileItemDuration("until your next daily preparations").mode, "daily-preparations");
    assert.equal(compileItemDuration("10 minutes or 8 hours").mode, "choice");
    const sustained = compileItemDuration("1 round or sustained up to 1 minute", { sustained: true });
    assert.equal(sustained.mode, "sustained");
    assert.equal(sustained.base.unit, "rounds");
    assert.equal(sustained.maximum.unit, "minutes");
    assert.equal(compileItemDuration("varies").mode, "text");
});

test("bounds affliction stages outside outcomes and delegates their resolution", async () => {
    const spiderSting = compileAbility(await fixture("rank-1/spider-sting.json"));

    assert.ok(!spiderSting.resolution.outcomes.criticalFailure.rawText.includes("Stage 1"));
    assert.deepEqual(spiderSting.automation.delegatedCapabilities, ["affliction-resolution"]);
    assert.equal(spiderSting.delegations[0].handler, "external-module");
    assert.ok(spiderSting.diagnostics.some(entry => entry.code === "AFFLICTION_RESOLUTION_DELEGATED"));
});

test("extracts balanced nested PF2e inline damage expressions", () => {
    const expressions = extractInlineExpressions(
        "The target takes @Damage[(floor(@item.rank/2)*2)d8[persistent,void]] damage.",
        "@Damage["
    );
    assert.equal(expressions.length, 1);
    assert.equal(expressions[0].body, "(floor(@item.rank/2)*2)d8[persistent,void]");

    const labeled = extractInlineExpressions(
        "The target takes @Damage[1[bleed]]{1 persistent bleed} damage.",
        "@Damage["
    );
    assert.equal(labeled[0].label, "1 persistent bleed");
    assert.equal(labeled[0].raw, "@Damage[1[bleed]]{1 persistent bleed}");
});

test("compiles non-basic per-degree inline damage and conditions conservatively", async () => {
    const plan = compileAbility(await fixture("rank-3/reblooded.json"));

    assert.equal(plan.automation.level, "guided");
    assert.equal(plan.resolution.kind, "save");
    assert.equal(plan.resolution.outcomes.success.damage.mode, "formulas");
    assert.equal(plan.resolution.outcomes.success.damage.formulas[0].formula, "1d6[persistent,acid]");
    assert.deepEqual(
        plan.resolution.outcomes.failure.effects.map(effect => [effect.slug, effect.value]),
        [["clumsy", 1]]
    );
    assert.ok(!plan.automation.pendingCapabilities.includes("condition-duration-scope"));
    assert.ok(!plan.automation.pendingCapabilities.includes("manual-rider-detection"));
    assert.ok(plan.diagnostics.some(entry => entry.code === "OUTCOME_PROSE_ACCOUNTED"));
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{
        kind: "trait", slug: "undead", present: true
    }]);
});

test("compiles actor eligibility and identifies item-only save targets", async () => {
    const painful = compileAbility(await fixture("rank-4/painful-vibrations.json"));
    assert.deepEqual(painful.targeting.actorConstraints.predicates, [{ kind: "living-creature" }]);

    const banditsDoom = compileAbility(await fixture("rank-5/bandits-doom.json"));
    assert.equal(banditsDoom.targeting.actorConstraints.supportsActorTargets, false);
    assert.equal(banditsDoom.targeting.actorConstraints.complete, true);

    for (const path of ["rank-4/deathless-march.json", "rank-4/enervation.json"]) {
        const areaSpell = compileAbility(await fixture(path));
        assert.deepEqual(areaSpell.targeting.actorConstraints.predicates, [{ kind: "living-creature" }]);
    }
});

test("preserves shared and outcome-specific damage in mixed degree results", async () => {
    const fireworks = compileAbility(await fixture("rank-2/ignite-fireworks.json"));
    const fireworksCritical = fireworks.resolution.outcomes.criticalFailure.damage;
    assert.equal(fireworksCritical.mode, "mixed");
    assert.equal(fireworksCritical.shared.multiplier, 2);
    assert.equal(fireworksCritical.formulas[0].formula, "1d4[persistent,fire]");
    assert.deepEqual(fireworksCritical.formulas[0].heightening, {
        type: "interval", interval: 2, formula: "1d4"
    });

    const glassSand = compileAbility(await fixture("rank-3/glass-sand.json"));
    assert.deepEqual(
        glassSand.resolution.outcomes.failure.damage.formulas.map(entry => entry.formula),
        ["1[persistent,bleed]"]
    );
    assert.equal(glassSand.resolution.outcomes.failure.damage.shared.multiplier, 1);
    assert.deepEqual(
        glassSand.resolution.outcomes.criticalFailure.damage.formulas.map(entry => entry.formula),
        ["2[persistent,bleed]"]
    );
    assert.equal(glassSand.resolution.outcomes.criticalFailure.damage.shared.multiplier, 2);
});

test("keeps outcome and resolution shapes consistent before a compiler path is implemented", async () => {
    const plan = compileAbility(await fixture("cantrip/detect-magic.json"));

    assert.equal(plan.resolution.postDamageTerminal, null);
    for (const outcome of Object.values(plan.resolution.outcomes)) {
        assert.equal(outcome.terminal, null);
        assert.equal(outcome.rawText, "");
    }
});

test("compiles unconditional death and conditional death in a secondary-save branch", async () => {
    const deathKnell = compileAbility(await fixture("rank-2/death-knell.json"));
    assert.equal(deathKnell.resolution.outcomes.failure.terminal.kind, "death");
    assert.equal(deathKnell.resolution.outcomes.criticalFailure.terminal.kind, "death");

    const phantasmalKiller = compileAbility(await fixture("rank-4/phantasmal-killer.json"));
    assert.equal(phantasmalKiller.resolution.outcomes.criticalFailure.terminal, null);
    const secondary = phantasmalKiller.resolution.outcomes.criticalFailure.followUps[0];
    assert.equal(secondary.kind, "save");
    assert.equal(secondary.check.statistic, "fortitude");
    assert.deepEqual(secondary.check.traits, ["incapacitation"]);
    assert.equal(secondary.outcomes.failure.terminal.kind, "death");
    assert.equal(secondary.outcomes.success.damage.mode, "formulas");
    assert.deepEqual(
        secondary.outcomes.success.effects.map(effect => effect.slug),
        ["fleeing", "frightened"]
    );
    assert.equal(secondary.outcomes.success.effects[0].duration.expiry, "turn-end");
    assert.equal(secondary.outcomes.success.effects[1].duration, null);
    assert.ok(phantasmalKiller.automation.compiledCapabilities.includes("secondary-saves"));
});

test("compiles condition lifetimes that depend on another condition", async () => {
    const missedCue = compileAbility(await fixture("rank-6/missed-cue.json"));
    const failureSlowed = missedCue.resolution.outcomes.failure.effects.find(effect => effect.slug === "slowed");
    const criticalSlowed = missedCue.resolution.outcomes.criticalFailure.effects.find(effect => effect.slug === "slowed");

    assert.equal(failureSlowed.whileCondition, "frightened");
    assert.equal(failureSlowed.endsWhen.event, "condition-removed");
    assert.equal(criticalSlowed.whileCondition, "frightened");
    assert.ok(missedCue.automation.compiledCapabilities.includes("linked-conditions"));

    const divineWrath = compileAbility(await fixture("rank-4/divine-wrath.json"));
    const slowed = divineWrath.resolution.outcomes.criticalFailure.effects.find(effect => effect.slug === "slowed");
    assert.equal(slowed.whileCondition, "sickened");
});

test("compiles recurring secondary-save condition deltas", async () => {
    const lignify = compileAbility(await fixture("rank-6/lignify.json"));
    const secondary = lignify.resolution.outcomes.failure.followUps[0];

    assert.equal(secondary.timing.event, "turn-end");
    assert.equal(secondary.timing.recurring, true);
    assert.deepEqual(secondary.outcomes.success.stateChanges[0], {
        kind: "condition-value",
        condition: "slowed",
        delta: -1
    });
    assert.equal(secondary.outcomes.failure.stateChanges[0].delta, 1);
    assert.equal(secondary.outcomes.criticalFailure.stateChanges[0].delta, 2);
    assert.equal(secondary.complete, true);
});

test("separates a critical-success exception inside a secondary save", async () => {
    const weird = compileAbility(await fixture("rank-9/weird.json"));
    const secondary = weird.resolution.outcomes.criticalFailure.followUps[0];

    assert.deepEqual(secondary.outcomes.success.effects.map(effect => effect.slug), ["frightened", "fleeing"]);
    assert.deepEqual(secondary.outcomes.criticalSuccess.effects.map(effect => effect.slug), ["frightened"]);
    assert.equal(secondary.outcomes.failure.terminal.kind, "death");
    assert.equal(secondary.complete, true);
});

test("reports compiled, guided, and residual outcome prose separately", () => {
    const coverage = analyzeResidualProse({
        damage: { mode: "shared", multiplier: 1 },
        effects: [],
        followUps: [],
        terminal: null,
        rawText: "The target takes full damage. The moon turns blue."
    });

    assert.equal(coverage.compiledClauseCount, 1);
    assert.equal(coverage.residualClauseCount, 1);
    assert.equal(coverage.complete, false);
});

test("compiles source-specific death when this spell reduces a target to zero HP", async () => {
    const plan = compileAbility(await fixture("rank-8/devour-life.json"));

    assert.equal(plan.resolution.postDamageTerminal.kind, "death");
    assert.equal(plan.resolution.postDamageTerminal.requiresReductionBySource, true);
    assert.equal(plan.automation.level, "guided");
    assert.ok(plan.diagnostics.some(entry => entry.code === "POST_DAMAGE_TERMINAL_COMPILED"));
});

test("attaches degree-scoped conditions only when sections belong to the primary save", async () => {
    const gaspingMarsh = compileAbility(await fixture("rank-3/gasping-marsh.json"));
    assert.deepEqual(
        gaspingMarsh.resolution.outcomes.failure.effects.map(effect => [effect.slug, effect.value]),
        [["sickened", 1]]
    );
    assert.deepEqual(
        gaspingMarsh.resolution.outcomes.criticalFailure.effects.map(effect => [effect.slug, effect.value]),
        [["sickened", 2]]
    );
    assert.equal(gaspingMarsh.resolution.outcomes.failure.effects[0].duration, null);

    const fireworkBlast = compileAbility(await fixture("rank-3/firework-blast.json"));
    assert.deepEqual(fireworkBlast.resolution.outcomes.failure.effects, []);
    assert.ok(fireworkBlast.diagnostics.some(entry => entry.code === "DEGREE_SECTION_SCOPE_AMBIGUOUS"));

    const pyrotechnics = compileAbility(await fixture("rank-3/pyrotechnics.json"));
    assert.ok(!pyrotechnics.automation.compiledCapabilities.includes("secondary-saves"));
});

test("withholds complete automation when basic-save prose has extra mechanics", async () => {
    const gaspingMarsh = compileAbility(await fixture("rank-3/gasping-marsh.json"));
    assert.equal(gaspingMarsh.automation.level, "guided");
    assert.ok(gaspingMarsh.compilerEvidence.simpleBasicSaveGate.reasons.includes("sustained"));

    const fireworkBlast = compileAbility(await fixture("rank-3/firework-blast.json"));
    assert.equal(fireworkBlast.automation.level, "guided");
    assert.ok(fireworkBlast.compilerEvidence.simpleBasicSaveGate.reasons.includes("inline-checks-present"));

    const blazingDive = compileAbility(await fixture("rank-3/blazing-dive.json"));
    assert.equal(blazingDive.automation.level, "guided");
    assert.ok(blazingDive.compilerEvidence.simpleBasicSaveGate.reasons.includes("action-language-present"));

    const diveAndBreach = compileAbility(await fixture("rank-3/dive-and-breach.json"));
    assert.equal(diveAndBreach.automation.level, "guided");
    assert.ok(diveAndBreach.compilerEvidence.simpleBasicSaveGate.reasons.includes("action-references-present"));
});
