import assert from "node:assert/strict";
import test from "node:test";

import {
    correctSaveTarget,
    synchronizeSecondary,
    recordSecondarySave,
    basicSaveMultiplier,
    basicSaveReadiness,
    saveCollectionReadiness,
    checkRollSkipDialog,
    isExecutableDegreeSavePlan,
    isExecutableBasicSavePlan,
    normalizeSaveDegree,
    recordProvisionalSave,
    requiredOutcomeDamageRolls,
    validateActorTarget
} from "../scripts/basic-save-core.js";
import { BasicSaveRuntime } from "../scripts/basic-save-runtime.js";
import { BASIC_SAVE_PREPARE_ACTION, claimNativeSpellSaveButton, refreshSaveButtonAuthority } from "../scripts/chat-card-controls.js";
import { MODULE_ID } from "../scripts/effect-runtime.js";

async function mockNativeDamage({ damage, rollOptions }) {
    this.system.attributes.hp.value -= damage.total;
    Hooks.callAll("updateActor", this, {}, { damageTaken: damage.total }, game.user.id);
    Hooks.callAll("createChatMessage", { id: "native-receipt", flags: { pf2e: {
        appliedDamage: { uuid: this.uuid, updates: [{ path: "system.attributes.hp.value", value: damage.total }], persistent: [] },
        context: { type: "damage-taken", options: [...rollOptions] }
    } } });
}

function automaticPlan() {
    const outcome = multiplier => ({
        damage: { mode: multiplier === 0 ? "none" : "shared", multiplier },
        effects: [],
        nativeEffects: [],
        followUps: [],
        terminal: null
    });
    return {
        compilerVersion: "test",
        source: { name: "Test Burst", uuid: "Actor.caster.Item.spell" },
        rank: 3,
        automation: { level: "automatic" },
        targeting: {
            actorConstraints: { sourceText: "1 creature", supportsActorTargets: true, complete: true, predicates: [] }
        },
        resolution: {
            kind: "save",
            check: { statistic: "reflex", basic: true, dcSource: "source-actor" },
            sharedDamage: {
                mode: "pf2e-item-damage",
                rollOnce: true,
                components: [{ id: "0", formula: "6d6", type: "fire" }]
            },
            outcomes: {
                criticalSuccess: outcome(0),
                success: outcome(0.5),
                failure: outcome(1),
                criticalFailure: outcome(2)
            }
        }
    };
}

function degreePlan() {
    const outcome = (effects = []) => ({
        damage: { mode: "none", multiplier: 0, sourceComponentIds: [] },
        effects,
        nativeEffects: [],
        followUps: [],
        decisions: [],
        manualInstructions: [],
        terminal: null,
        semanticCoverage: { complete: true, fullyCompiled: true }
    });
    const clumsy = value => ({
        kind: "condition",
        slug: "clumsy",
        name: "Clumsy",
        value,
        duration: null
    });
    const stupefied = value => ({
        kind: "condition",
        slug: "stupefied",
        name: "Stupefied",
        value,
        duration: null
    });
    const confused = {
        kind: "condition",
        slug: "confused",
        name: "Confused",
        value: null,
        duration: null
    };
    return {
        compilerVersion: "test",
        source: { name: "Test Befuddle", uuid: "Actor.caster.Item.spell" },
        rank: 1,
        automation: { level: "guided", pendingCapabilities: [], delegatedCapabilities: [] },
        targeting: {
            actorConstraints: { sourceText: "1 creature", supportsActorTargets: true, complete: true, predicates: [] }
        },
        lifecycle: {
            durationSpec: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-start", anchor: "effect-start" },
            controller: { required: false }
        },
        resolution: {
            kind: "save",
            check: { statistic: "will", basic: false, dcSource: "source-actor" },
            sharedDamage: null,
            outcomes: {
                criticalSuccess: outcome(),
                success: outcome([clumsy(1)]),
                failure: outcome([clumsy(2)]),
                criticalFailure: outcome([clumsy(3), stupefied(3), confused])
            },
            postDamageTerminal: null
        }
    };
}

function degreeDamagePlan() {
    const plan = degreePlan();
    plan.source.name = "Test Noise Blast";
    plan.rank = 2;
    plan.lifecycle.durationSpec = { mode: "instantaneous", raw: "" };
    plan.resolution.sharedDamage = {
        mode: "pf2e-item-damage",
        rollOnce: true,
        components: [{ id: "0", formula: "2d10", type: "sonic", category: null }]
    };
    for (const [degree, multiplier] of Object.entries({
        criticalSuccess: 0,
        success: 0.5,
        failure: 1,
        criticalFailure: 2
    })) {
        plan.resolution.outcomes[degree].damage = {
            mode: multiplier === 0 ? "none" : "shared",
            multiplier,
            sourceComponentIds: multiplier === 0 ? [] : ["0"]
        };
    }
    return plan;
}

function outcomeDamagePlan({ mixed = false } = {}) {
    const plan = degreePlan();
    plan.source.name = mixed ? "Test Mixed Damage" : "Test Outcome Damage";
    plan.rank = 2;
    plan.lifecycle.durationSpec = { mode: "instantaneous", raw: "" };
    for (const outcome of Object.values(plan.resolution.outcomes)) outcome.effects = [];
    const formula = value => ({
        mode: "formulas",
        formulas: [{ formula: `${value}d6[fire]`, source: "description-inline" }],
        rollScope: "outcome"
    });
    plan.resolution.outcomes.success.damage = formula(1);
    plan.resolution.outcomes.failure.damage = formula(2);
    plan.resolution.outcomes.criticalFailure.damage = formula(3);
    if (mixed) {
        plan.resolution.sharedDamage = {
            mode: "pf2e-item-damage",
            rollOnce: true,
            components: [{ id: "0", formula: "2d6", type: "sonic", category: null }]
        };
        plan.resolution.outcomes.failure.damage = {
            mode: "mixed",
            shared: { multiplier: 1, sourceComponentIds: ["0"] },
            formulas: [{
                formula: "1d4[persistent,fire]",
                source: "description-inline",
                heightening: { type: "interval", interval: 2, formula: "1d4" }
            }],
            rollScope: "outcome"
        };
    }
    return plan;
}

function secondarySavePlan() {
    const plan = degreePlan();
    plan.source.name = "Test Phantasmal Killer";
    plan.rank = 4;
    plan.lifecycle.durationSpec = { mode: "instantaneous", raw: "" };
    for (const outcome of Object.values(plan.resolution.outcomes)) {
        outcome.damage = { mode: "none", multiplier: 0, sourceComponentIds: [] };
        outcome.effects = [];
    }
    const secondaryOutcome = ({ damage = null, effects = [], terminal = null } = {}) => ({
        damage: damage ?? { mode: "none", multiplier: 0, sourceComponentIds: [] },
        effects,
        stateChanges: [],
        terminal,
        manualInstructions: []
    });
    const frightened = {
        kind: "condition",
        slug: "frightened",
        name: "Frightened",
        value: 4,
        duration: null
    };
    const formula = {
        mode: "formulas",
        formulas: [{ formula: "3d6[mental]", source: "description-inline" }],
        rollScope: "secondary-outcome"
    };
    const death = { kind: "death", label: "Dies", automatic: true };
    plan.resolution.outcomes.criticalFailure.followUps = [{
        kind: "save",
        timing: { event: "after-primary-outcome", recurring: false, subject: "affected-actor" },
        check: { statistic: "fortitude", basic: false, dcSource: "source-actor", traits: ["incapacitation"] },
        decisionWindows: { nativeRollDialog: true, provisionalResult: true },
        outcomes: {
            criticalSuccess: secondaryOutcome({ damage: formula, effects: [frightened] }),
            success: secondaryOutcome({ damage: formula, effects: [frightened] }),
            failure: secondaryOutcome({ terminal: death }),
            criticalFailure: secondaryOutcome({ terminal: death })
        },
        complete: true
    }];
    return plan;
}

function provisionalState() {
    return {
        damage: { rollJSON: null },
        targets: [{
            id: "target-1",
            name: "Target",
            degree: null,
            saveTimestamp: 0,
            rollRevision: 0,
            applicationStatus: "pending",
            reviewRequired: false
        }],
        reviewRequired: false,
        reviewReason: null
    };
}

test("GM corrections retain rolls, reject stale edits, and reset secondary branches", () => {
    const state = provisionalState();
    state.status = "collecting";
    state.damage.enabled = false;
    state.outcomes = automaticPlan().resolution.outcomes;
    state.outcomes.criticalFailure.followUps = [{ id: "secondary" }];
    const target = state.targets[0];
    recordProvisionalSave(state, target.id, { degree: "failure", total: 19, natural: 10, timestamp: 1 });
    correctSaveTarget(state, target.id, { action: "degree", degree: "criticalFailure", expectedRevision: 1 }, "gm");
    assert.equal(target.rolledDegree, "failure");
    assert.equal(target.saveTotal, 19);
    assert.equal(target.degreeOverride.to, "criticalFailure");
    recordSecondarySave(state, target.id, { degree: "failure", total: 10 });
    correctSaveTarget(state, target.id, { action: "degree", stage: "secondary", degree: "success" }, "gm");
    assert.equal(target.secondary.rolledDegree, "failure");
    correctSaveTarget(state, target.id, { action: "exclude" }, "gm");
    assert.equal(saveCollectionReadiness(state).ready, true);
    assert.equal(recordProvisionalSave(state, target.id, { degree: "success", timestamp: 2 }).status, "stale");
    correctSaveTarget(state, target.id, { action: "restore" }, "gm");
    assert.equal(target.secondary.degree, "success");
    assert.throws(() => correctSaveTarget(state, target.id, { action: "exclude", expectedRevision: 1 }, "gm"), /changed/);
    correctSaveTarget(state, target.id, { action: "degree", degree: "success" }, "gm");
    assert.equal(target.secondary, null);
    correctSaveTarget(state, target.id, { action: "degree", degree: "criticalFailure" }, "gm");
    assert.equal(target.secondary.degree, null);
    recordProvisionalSave(state, target.id, { degree: "success", timestamp: 3, reroll: true });
    synchronizeSecondary(state, target);
    assert.equal(target.degreeOverride, null);
    assert.equal(target.rolledDegree, "success");
    assert.equal(target.secondary, null);
    correctSaveTarget(state, target.id, { action: "unaffected" }, "gm");
    assert.equal(target.originalEligibility.eligible, true);
    correctSaveTarget(state, target.id, { action: "affected" }, "gm");
    assert.equal(target.eligible, true);
    state.status = "finalizing";
    assert.throws(() => correctSaveTarget(state, target.id, { action: "exclude" }, "gm"), /locked/);
    assert.equal(recordProvisionalSave(state, target.id, { degree: "failure", timestamp: 4 }).status, "stale");
    state.status = "completed";
    assert.throws(() => correctSaveTarget(state, target.id, { action: "exclude" }, "gm"), /locked/);
});

test("basic-save core accepts only complete automatic shared-damage plans", () => {
    const plan = automaticPlan();
    assert.equal(isExecutableBasicSavePlan(plan), true);
    const guided = structuredClone(plan);
    guided.automation.level = "guided";
    assert.equal(isExecutableBasicSavePlan(guided), false);
    const rider = structuredClone(plan);
    rider.resolution.outcomes.failure.effects.push({ slug: "frightened" });
    assert.equal(isExecutableBasicSavePlan(rider), false);
});

test("degree-outcome gate accepts only fully compiled, bounded save results", () => {
    const plan = degreePlan();
    assert.equal(isExecutableDegreeSavePlan(plan), true);
    const pending = structuredClone(plan);
    pending.automation.pendingCapabilities.push("residual-prose");
    assert.equal(isExecutableDegreeSavePlan(pending), false);
    const eventCondition = structuredClone(plan);
    eventCondition.resolution.outcomes.failure.effects[0].endsWhen = [{ event: "escape" }];
    assert.equal(isExecutableDegreeSavePlan(eventCondition), false);
    const formulaDamage = structuredClone(plan);
    formulaDamage.resolution.outcomes.failure.damage = { mode: "formulas", multiplier: null, formulas: [{ formula: "1d6[fire]" }] };
    assert.equal(isExecutableDegreeSavePlan(formulaDamage), false);
    assert.equal(isExecutableDegreeSavePlan(outcomeDamagePlan()), true);
    assert.equal(isExecutableDegreeSavePlan(outcomeDamagePlan({ mixed: true })), true);
    assert.equal(isExecutableDegreeSavePlan(secondarySavePlan()), true);
    const recurringSecondary = structuredClone(secondarySavePlan());
    recurringSecondary.resolution.outcomes.criticalFailure.followUps[0].timing = {
        event: "turn-end", recurring: true, subject: "affected-actor"
    };
    assert.equal(isExecutableDegreeSavePlan(recurringSecondary), false);
    const missingValue = structuredClone(plan);
    missingValue.resolution.outcomes.failure.effects[0].value = null;
    assert.equal(isExecutableDegreeSavePlan(missingValue), false);
    const multiTurnStunned = structuredClone(plan);
    multiTurnStunned.resolution.outcomes.failure.effects[0] = {
        kind: "condition", slug: "stunned", name: "Stunned", value: 4, duration: null
    };
    assert.equal(isExecutableDegreeSavePlan(multiTurnStunned), true);
});

test("actor target predicates enforce undead and living creature restrictions", () => {
    const actor = (type, traits) => ({ type, system: { traits: { value: traits } } });
    const undead = { supportsActorTargets: true, complete: true, predicates: [{ kind: "trait", slug: "undead", present: true }] };
    const living = { supportsActorTargets: true, complete: true, predicates: [{ kind: "living-creature" }] };
    assert.equal(validateActorTarget(undead, actor("npc", ["undead"])).eligible, true);
    assert.equal(validateActorTarget(undead, actor("npc", [])).eligible, false);
    assert.equal(validateActorTarget(living, actor("character", [])).eligible, true);
    assert.equal(validateActorTarget(living, actor("npc", ["undead"])).eligible, false);
    assert.equal(validateActorTarget(living, actor("npc", ["construct"])).eligible, false);
});

test("automatic basic saves claim the native PF2e spell-save button", () => {
    const classes = new Set();
    const button = {
        dataset: { action: "spell-save", save: "reflex", dc: "24" },
        classList: { add: value => classes.add(value) }
    };
    assert.equal(claimNativeSpellSaveButton(button), true);
    assert.equal(button.dataset.action, BASIC_SAVE_PREPARE_ACTION);
    assert.equal(button.dataset.save, "reflex");
    assert.equal(button.dataset.dc, "24");
    assert.equal(classes.has("pf2e-auto-runtime-resolve"), true);
    assert.equal(claimNativeSpellSaveButton(button), false);
});

test("basic-save core normalizes degrees and preserves PF2e multipliers", () => {
    assert.equal(normalizeSaveDegree(0), "criticalFailure");
    assert.equal(normalizeSaveDegree("critical-success"), "criticalSuccess");
    assert.deepEqual([
        basicSaveMultiplier("criticalSuccess"),
        basicSaveMultiplier("success"),
        basicSaveMultiplier("failure"),
        basicSaveMultiplier("criticalFailure")
    ], [0, 0.5, 1, 2]);
});

test("GM handoff refreshes authority without unlocking unready or busy controls", () => {
    const button = { dataset: { saveAction: "correct-target" }, disabled: false, title: "" };
    refreshSaveButtonAuthority(button, false);
    assert.equal(button.disabled, true);
    refreshSaveButtonAuthority(button, true);
    assert.equal(button.disabled, false);
    button.dataset.runtimeBusy = "true";
    refreshSaveButtonAuthority(button, true);
    assert.equal(button.disabled, true);
    delete button.dataset.runtimeBusy;
    refreshSaveButtonAuthority(button, true);
    assert.equal(button.disabled, false);
    refreshSaveButtonAuthority(button, false);
    assert.equal(button.disabled, true);
    const unready = { dataset: { saveAction: "finalize" }, disabled: true, title: "Wait for saves" };
    refreshSaveButtonAuthority(unready, false);
    refreshSaveButtonAuthority(unready, true);
    assert.equal(unready.disabled, true);
    assert.equal(unready.title, "Wait for saves");
});

test("save buttons use PF2e's Shift-click dialog toggle", () => {
    assert.equal(checkRollSkipDialog({ shiftKey: false }, true), false);
    assert.equal(checkRollSkipDialog({ shiftKey: true }, true), true);
    assert.equal(checkRollSkipDialog({ shiftKey: false }, false), true);
    assert.equal(checkRollSkipDialog({ shiftKey: true }, false), false);
});

test("provisional rerolls replace unapplied results and stop after application", () => {
    const state = provisionalState();
    recordProvisionalSave(state, "target-1", {
        degree: "failure", messageId: "save-1", timestamp: 1, reroll: false
    });
    recordProvisionalSave(state, "target-1", {
        degree: "success", messageId: "save-2", timestamp: 2, reroll: true
    });
    assert.equal(state.targets[0].degree, "success");
    assert.equal(state.targets[0].rollRevision, 2);
    assert.equal(state.targets[0].reroll, true);
    state.targets[0].applicationStatus = "applied";
    const result = recordProvisionalSave(state, "target-1", {
        degree: "criticalSuccess", messageId: "save-3", timestamp: 3, reroll: true
    });
    assert.equal(result.status, "manual-review");
    assert.equal(state.reviewRequired, true);
    assert.equal(state.targets[0].postApplicationDegree, "criticalSuccess");
});

test("basic-save readiness requires damage and every provisional save", () => {
    const state = provisionalState();
    assert.equal(saveCollectionReadiness(state).ready, false);
    assert.equal(basicSaveReadiness(state).ready, false);
    state.damage.rollJSON = { formula: "6d6" };
    assert.equal(basicSaveReadiness(state).ready, false);
    state.targets[0].degree = "failure";
    assert.equal(saveCollectionReadiness(state).ready, true);
    assert.equal(basicSaveReadiness(state).ready, true);
});

class DamageRoll {
    static fromData(data) {
        return new DamageRoll(data.total, data.formula);
    }

    constructor(total = 12, formula = "6d6[fire]") {
        if (typeof total === "string") {
            this.formula = total;
            const dice = /^(\d+)d\d+/i.exec(total);
            this.total = dice ? Number(dice[1]) * 4 : Number.parseInt(total, 10) || 0;
        } else {
            this.total = total;
            this.formula = formula;
        }
    }

    async evaluate() {
        return this;
    }

    toJSON() {
        return { total: this.total, formula: this.formula };
    }

    alter(multiplier) {
        return new DamageRoll(this.total * multiplier, this.formula);
    }

    async toMessage(data) {
        return await globalThis.ChatMessage.create({ ...data, rolls: [this] });
    }
}

class MessageCollection extends Array {
    get(id) {
        return this.find(message => message.id === id) ?? null;
    }
}

test("basic-save runtime persists a reroll and applies one shared roll by degree", async t => {
    const messages = new MessageCollection();
    const documents = new Map();
    const prior = Object.fromEntries([
        "foundry", "game", "ChatMessage", "Hooks", "fromUuid", "CONFIG", "ui"
    ].map(key => [key, globalThis[key]]));
    let id = 0;
    let damagePreparations = 0;
    let saveRolls = 0;
    const outcomeEffectSources = [];
    const caster = {
        id: "caster",
        uuid: "Actor.caster",
        name: "Caster",
        system: { attributes: { spellDC: { value: 24 } } },
        canUserModify: () => true
    };
    const target = {
        id: "target",
        uuid: "Actor.target",
        documentName: "Actor",
        getActiveTokens() { return [{ documentName: "Token", name: this.name, actor: this }]; },
        type: "character",
        name: "Target",
        system: { attributes: { hp: { value: 50 } } },
        canUserModify: () => true,
        isOfType: type => type === "character" || type === "creature",
        heroPoints: 1,
        getResource(slug) { return slug === "hero-points" ? { slug, value: this.heroPoints } : null; },
        async updateResource(slug, value) { if (slug === "hero-points") this.heroPoints = value; },
        saves: {
            reflex: { roll: async () => ({ degreeOfSuccess: "failure" }) },
            will: { roll: async () => ({ degreeOfSuccess: "failure" }) }
        },
        async applyDamage(options) { await mockNativeDamage.call(this, options); },
        async createEmbeddedDocuments(_type, sources) {
            outcomeEffectSources.push(...structuredClone(sources));
            return sources.flatMap((source, index) => [{
                id: `outcome-effect-${index}`,
                uuid: `${this.uuid}.Item.outcome-effect-${index}`,
                type: "effect",
                flags: source.flags,
                system: { rules: source.system.rules },
                async delete() {}
            }, ...source.system.rules.map((rule, ruleIndex) => ({
                id: `granted-condition-${index}-${ruleIndex}`,
                uuid: `${this.uuid}.Item.granted-condition-${index}-${ruleIndex}`,
                type: "condition",
                flags: {},
                system: { rules: [] },
                async delete() {}
            }))]);
        }
    };
    const spell = {
        uuid: "Actor.caster.Item.spell",
        actor: caster,
        name: "Test Burst",
        rank: 3,
        system: { traits: { value: ["fire"] } },
        spellcasting: { statistic: { dc: { value: 24 } } },
        getRollData() { return { item: { rank: this.rank, level: this.rank } }; },
        // PF2e returns a heightened copy of the spell for the requested rank.
        loadVariant({ castRank }) { return { ...this, rank: castRank }; },
        async getDamage() {
            damagePreparations += 1;
            return { template: { damage: { roll: new DamageRoll() } }, context: { options: new Set(["item:trait:fire"]) } };
        }
    };
    documents.set(caster.uuid, caster);
    documents.set(target.uuid, target);
    documents.set(spell.uuid, spell);
    globalThis.foundry = {
        utils: { deepClone: structuredClone, randomID: () => `random-${++id}`, escapeHTML: String },
        applications: { api: { DialogV2: { prompt: async () => true } } }
    };
    globalThis.game = {
        user: { id: "gm", isGM: true, targets: new Set(), settings: { showCheckDialogs: true } },
        users: { contents: [{ id: "gm", active: true, isGM: true }] },
        actors: { get: actorId => actorId === target.id ? target : caster },
        messages,
        time: { worldTime: 100 },
        pf2e: { ConditionManager: { getCondition: slug => ({
            id: slug === "clumsy" ? "Clumsy" : slug,
            uuid: `Compendium.pf2e.conditionitems.Item.${slug}`,
            img: `icons/${slug}.webp`,
            _stats: { compendiumSource: `Compendium.pf2e.conditionitems.Item.${slug}` },
            system: { value: { isValued: ["clumsy", "frightened", "stupefied", "stunned"].includes(slug) } }
        }) } }
    };
    globalThis.ChatMessage = {
        getSpeaker: () => ({}),
        async create(data) {
            const message = {
                id: `message-${++id}`,
                author: { id: "gm" },
                ...structuredClone(data),
                getFlag(scope, key) { return this.flags?.[scope]?.[key]; },
                async setFlag(scope, key, value) {
                    this.flags ??= {};
                    this.flags[scope] ??= {};
                    this.flags[scope][key] = structuredClone(value);
                },
                async update(changes) {
                    this.content = changes.content ?? this.content;
                    const state = changes[`flags.${MODULE_ID}.basicSaveState`];
                    if (state) this.flags[MODULE_ID].basicSaveState = structuredClone(state);
                },
                async delete() {
                    messages.splice(messages.indexOf(this), 1);
                }
            };
            messages.push(message);
            return message;
        }
    };
    const hookHandlers = new Map();
    globalThis.Hooks = {
        on(event, fn) { const handlers = hookHandlers.get(event) ?? new Set(); handlers.add(fn); hookHandlers.set(event, handlers); return fn; },
        off(event, fn) { hookHandlers.get(event)?.delete(fn); },
        callAll(event, ...args) { for (const fn of hookHandlers.get(event) ?? []) fn(...args); }
    };
    globalThis.fromUuid = async uuid => documents.get(uuid) ?? null;
    globalThis.CONFIG = { Dice: { rolls: [DamageRoll] }, PF2E: { chatDamageButtonShieldToggle: false } };
    globalThis.ui = { notifications: { warn: () => {} } };
    t.after(() => Object.assign(globalThis, prior));

    const runtime = new BasicSaveRuntime();
    const started = await runtime.start(spell, {
        plan: automaticPlan(),
        sourceActor: caster,
        targets: [target],
        castRank: 3,
        skipConfirmation: true
    });
    await runtime.rollDamage(started.card);
    assert.equal((await runtime.rollDamage(started.card)).status, "already-rolled");
    assert.equal(damagePreparations, 1);
    let lastSaveOptions = null;
    target.saves.reflex.roll = async options => {
        saveRolls += 1;
        lastSaveOptions = options;
        const heroReroll = options.extraRollOptions.includes("check:reroll:hero-points");
        return {
            degreeOfSuccess: heroReroll ? "success" : "failure",
            total: heroReroll ? 25 : 19,
            options: { degreeOfSuccess: heroReroll ? 2 : 1, totalModifier: 9 },
            dice: [{ results: [{ result: heroReroll ? 16 : 10, active: true }] }]
        };
    };
    const messageCountBeforeSave = messages.length;
    const rollAll = await runtime.rollAll(started.card, { event: { shiftKey: true } });
    assert.equal(rollAll.status, "rolled");
    assert.equal(rollAll.rolled, 1);
    assert.equal(saveRolls, 1);
    assert.equal(lastSaveOptions.skipDialog, true);
    assert.equal(lastSaveOptions.createMessage, false);
    assert.equal(messages.length, messageCountBeforeSave);
    assert.match(started.card.content, /19[\s\S]*Failure/);
    const state = started.card.getFlag(MODULE_ID, "basicSaveState");
    const makeSaveMessage = (messageId, degree, reroll, saveState = state) => ({
        id: messageId,
        actor: target,
        timestamp: Date.now() + (reroll ? 2 : 1),
        rolls: [{ degreeOfSuccess: degree }],
        flags: { pf2e: { context: {
            outcome: degree,
            isReroll: reroll,
            options: [`pf2e-auto-basic-save:${saveState.castId}:${saveState.targets[0].id}`, ...(reroll ? ["check:reroll:hero-points"] : [])]
        } } }
    });
    assert.equal(started.card.getFlag(MODULE_ID, "basicSaveState").targets[0].rollRevision, 1);
    assert.equal(started.card.getFlag(MODULE_ID, "basicSaveState").targets[0].saveTotal, 19);
    const noRemainingSaves = await runtime.rollAll(started.card);
    assert.equal(noRemainingSaves.status, "nothing-to-roll");
    assert.equal(saveRolls, 1);
    const reloadedRuntime = new BasicSaveRuntime();
    await reloadedRuntime.rollSave(started.card, state.targets[0].id, { heroPoint: true });
    assert.equal(started.card.getFlag(MODULE_ID, "basicSaveState").targets[0].degree, "success");
    assert.equal(target.heroPoints, 0);
    assert.equal(messages.length, messageCountBeforeSave);

    const applied = await reloadedRuntime.apply(started.card, { skipConfirmation: true });
    assert.equal(applied.status, "applied");
    assert.equal(target.system.attributes.hp.value, 44);
    assert.equal(started.card.getFlag(MODULE_ID, "basicSaveState").status, "completed");

    const degreeRuntime = new BasicSaveRuntime();
    const degreeStarted = await degreeRuntime.start(spell, {
        plan: degreePlan(),
        sourceActor: caster,
        targets: [target],
        castRank: 1,
        skipConfirmation: true
    });
    const degreeState = degreeStarted.card.getFlag(MODULE_ID, "basicSaveState");
    await degreeRuntime.handleSaveMessage(makeSaveMessage("degree-save-1", "failure", false, degreeState));
    const degreeApplied = await degreeRuntime.apply(degreeStarted.card, { skipConfirmation: true });
    assert.equal(degreeApplied.status, "applied");
    assert.equal(target.system.attributes.hp.value, 44);
    assert.equal(outcomeEffectSources.length, 1);
    assert.equal(outcomeEffectSources[0].system.duration.value, 1);
    assert.equal(outcomeEffectSources[0].system.duration.unit, "rounds");
    assert.deepEqual(outcomeEffectSources[0].system.rules[0].alterations, [{
        mode: "override", property: "badge-value", value: 2
    }]);
    assert.equal(outcomeEffectSources[0].system.rules[0].allowDuplicate, true);
    assert.deepEqual(outcomeEffectSources[0].system.rules[0].onDeleteActions, {
        granter: "cascade", grantee: "cascade"
    });
    assert.equal(degreeStarted.card.getFlag(MODULE_ID, "basicSaveState").status, "completed");

    const rollbackStarted = await degreeRuntime.start(spell, {
        plan: degreePlan(),
        sourceActor: caster,
        targets: [target],
        castRank: 1,
        skipConfirmation: true
    });
    const rollbackState = rollbackStarted.card.getFlag(MODULE_ID, "basicSaveState");
    await degreeRuntime.handleSaveMessage(makeSaveMessage("degree-save-rollback", "failure", false, rollbackState));
    target.createEmbeddedDocuments = async () => { throw new Error("condition creation failed"); };
    await assert.rejects(
        degreeRuntime.apply(rollbackStarted.card, { skipConfirmation: true }),
        /condition creation failed/
    );
    const rolledBack = rollbackStarted.card.getFlag(MODULE_ID, "basicSaveState");
    assert.equal(rolledBack.status, "collecting");
    assert.equal(rolledBack.targets[0].applicationStatus, "pending");
    assert.equal(rolledBack.reviewRequired, false);

    const interruptedStarted = await degreeRuntime.start(spell, {
        plan: degreeDamagePlan(),
        sourceActor: caster,
        targets: [target],
        castRank: 2,
        skipConfirmation: true
    });
    await degreeRuntime.rollDamage(interruptedStarted.card);
    const interruptedState = interruptedStarted.card.getFlag(MODULE_ID, "basicSaveState");
    await degreeRuntime.handleSaveMessage(makeSaveMessage("degree-save-interrupted", "failure", false, interruptedState));
    target.applyDamage = async ({ damage }) => {
        target.system.attributes.hp.value -= damage.total;
        throw new Error("post-damage hook failed");
    };
    await assert.rejects(
        degreeRuntime.apply(interruptedStarted.card, { skipConfirmation: true }),
        /post-damage hook failed/
    );
    const interrupted = interruptedStarted.card.getFlag(MODULE_ID, "basicSaveState");
    assert.equal(interrupted.status, "review");
    assert.equal(interrupted.reviewRequired, true);
    assert.match(interrupted.reviewReason, /irreversible damage/);

    const makeSyntheticActor = suffix => ({
        id: `synthetic-${suffix}`,
        uuid: `Scene.scene.Token.${suffix}.Actor.synthetic-${suffix}`,
        name: `Synthetic ${suffix.toUpperCase()}`,
        system: { attributes: { hp: { value: 50 } } },
        statuses: new Set(),
        items: [],
        canUserModify: () => true,
        saves: { fortitude: { roll: async () => ({ degreeOfSuccess: "failure" }) } },
        async applyDamage(options) { await mockNativeDamage.call(this, options); },
        async toggleStatusEffect(slug, { active }) {
            if (active) this.statuses.add(slug);
            else this.statuses.delete(slug);
        },
        async createEmbeddedDocuments(_type, sources) {
            this.createdEffects = (this.createdEffects ?? 0) + sources.length;
            this.effectSources = structuredClone(sources);
            return sources.flatMap((source, index) => [{
                uuid: `${this.uuid}.Item.effect-${index}`,
                type: "effect",
                flags: source.flags,
                system: { rules: source.system.rules },
                async delete() {}
            }, ...source.system.rules.map((_rule, ruleIndex) => ({
                uuid: `${this.uuid}.Item.condition-${index}-${ruleIndex}`,
                type: "condition",
                flags: {},
                system: { rules: [] },
                async delete() {}
            }))]);
        }
    });
    const syntheticA = makeSyntheticActor("a");
    const syntheticB = makeSyntheticActor("b");
    const tokenA = { documentName: "Token", uuid: "Scene.scene.Token.a", actor: syntheticA };
    const tokenB = { documentName: "Token", uuid: "Scene.scene.Token.b", actor: syntheticB };
    const placeableA = { documentName: "Token", actor: syntheticA, document: tokenA };
    const placeableB = { documentName: "Token", actor: syntheticB, document: tokenB };
    documents.set(tokenA.uuid, tokenA);
    documents.set(tokenB.uuid, tokenB);
    documents.set(syntheticA.uuid, syntheticA);
    documents.set(syntheticB.uuid, syntheticB);
    const multiTargetStarted = await degreeRuntime.start(spell, {
        plan: degreeDamagePlan(),
        sourceActor: caster,
        targets: [placeableA, placeableB],
        castRank: 2,
        skipConfirmation: true
    });
    await degreeRuntime.rollDamage(multiTargetStarted.card);
    const multiTargetState = multiTargetStarted.card.getFlag(MODULE_ID, "basicSaveState");
    assert.deepEqual(multiTargetState.targets.map(target => target.tokenUuid), [tokenA.uuid, tokenB.uuid]);
    const syntheticDegrees = ["failure", "criticalFailure"];
    for (const [index, synthetic] of [syntheticA, syntheticB].entries()) {
        await degreeRuntime.handleSaveMessage({
            id: `synthetic-save-${index}`,
            actor: synthetic,
            timestamp: index + 1,
            rolls: [{ degreeOfSuccess: syntheticDegrees[index] }],
            flags: { pf2e: { context: {
                outcome: syntheticDegrees[index],
                options: [`pf2e-auto-basic-save:${multiTargetState.castId}:${multiTargetState.targets[index].id}`]
            } } }
        });
    }
    // Reproduce the unsafe post-reload lookup: both actor UUIDs resolve to the
    // first actor. Also remove tokenUuid to exercise migration of cards created
    // before 0.3.2 from their persisted synthetic-actor UUIDs.
    documents.set(syntheticB.uuid, syntheticA);
    const legacyState = multiTargetStarted.card.getFlag(MODULE_ID, "basicSaveState");
    legacyState.targets.forEach(target => { target.tokenUuid = null; });
    await multiTargetStarted.card.update({
        [`flags.${MODULE_ID}.basicSaveState`]: legacyState
    });
    const afterReloadRuntime = new BasicSaveRuntime();
    await afterReloadRuntime.apply(multiTargetStarted.card, { skipConfirmation: true });
    assert.equal(syntheticA.system.attributes.hp.value, 38);
    assert.equal(syntheticB.system.attributes.hp.value, 26);
    assert.equal(syntheticA.createdEffects, 1);
    assert.equal(syntheticB.createdEffects, 1);
    assert.equal(syntheticA.effectSources[0].system.rules.length, 1);
    assert.equal(syntheticA.effectSources[0].system.rules[0].onDeleteActions.grantee, "cascade");
    assert.equal(syntheticB.effectSources[0].system.rules.length, 3);
    assert.equal(syntheticB.effectSources[0].system.rules[0].onDeleteActions.grantee, "detach");
    const completedMultiTarget = multiTargetStarted.card.getFlag(MODULE_ID, "basicSaveState");
    assert.equal(completedMultiTarget.targets[1].effectUuids.length, 1);
    assert.equal(completedMultiTarget.targets[1].conditionResults.length, 3);

    const syntheticC = makeSyntheticActor("c");
    const tokenC = { documentName: "Token", uuid: "Scene.scene.Token.c", actor: syntheticC };
    documents.set(tokenC.uuid, tokenC);
    documents.set(syntheticC.uuid, syntheticC);
    const mixedDurationPlan = degreeDamagePlan();
    mixedDurationPlan.resolution.outcomes.criticalFailure.effects[2] = {
        kind: "condition", slug: "stunned", name: "Stunned", value: 1, duration: null
    };
    const mixedDurationStarted = await degreeRuntime.start(spell, {
        plan: mixedDurationPlan,
        sourceActor: caster,
        targets: [{ documentName: "Token", actor: syntheticC, document: tokenC }],
        castRank: 2,
        skipConfirmation: true
    });
    await degreeRuntime.rollDamage(mixedDurationStarted.card);
    const mixedDurationState = mixedDurationStarted.card.getFlag(MODULE_ID, "basicSaveState");
    await degreeRuntime.handleSaveMessage({
        id: "mixed-duration-save",
        actor: syntheticC,
        timestamp: 10,
        rolls: [{ degreeOfSuccess: "criticalFailure" }],
        flags: { pf2e: { context: {
            outcome: "criticalFailure",
            options: [`pf2e-auto-basic-save:${mixedDurationState.castId}:${mixedDurationState.targets[0].id}`]
        } } }
    });
    await degreeRuntime.apply(mixedDurationStarted.card, { skipConfirmation: true });
    assert.equal(syntheticC.createdEffects, 2);
    assert.deepEqual(syntheticC.effectSources.map(source => source.system.rules.length).sort(), [1, 2]);
    const stunnedEffect = syntheticC.effectSources.find(source =>
        source.system.rules.some(rule => rule.uuid.endsWith(".stunned")));
    assert.deepEqual(stunnedEffect.system.duration, {
        value: -1, unit: "unlimited", expiry: null, sustained: false
    });
    assert.equal(stunnedEffect.flags["pf2e-automatic-resolution"].outcomeEffect.conditions[0].recovery, "stunned-actions");

    const syntheticD = makeSyntheticActor("d");
    const syntheticE = makeSyntheticActor("e");
    const tokenD = { documentName: "Token", uuid: "Scene.scene.Token.d", actor: syntheticD };
    const tokenE = { documentName: "Token", uuid: "Scene.scene.Token.e", actor: syntheticE };
    for (const document of [syntheticD, syntheticE, tokenD, tokenE]) documents.set(document.uuid, document);
    const formulaStarted = await degreeRuntime.start(spell, {
        plan: outcomeDamagePlan(),
        sourceActor: caster,
        targets: [
            { documentName: "Token", actor: syntheticD, document: tokenD },
            { documentName: "Token", actor: syntheticE, document: tokenE }
        ],
        castRank: 2,
        skipConfirmation: true
    });
    let formulaState = formulaStarted.card.getFlag(MODULE_ID, "basicSaveState");
    for (const [index, synthetic] of [syntheticD, syntheticE].entries()) {
        const degree = index === 0 ? "failure" : "criticalFailure";
        await degreeRuntime.handleSaveMessage({
            id: `formula-save-${index}`,
            actor: synthetic,
            timestamp: 20 + index,
            rolls: [{ degreeOfSuccess: degree }],
            flags: { pf2e: { context: {
                outcome: degree,
                options: [`pf2e-auto-basic-save:${formulaState.castId}:${formulaState.targets[index].id}`]
            } } }
        });
    }
    formulaState = formulaStarted.card.getFlag(MODULE_ID, "basicSaveState");
    assert.equal(requiredOutcomeDamageRolls(formulaState).length, 2);
    await degreeRuntime.handleSaveMessage({
        id: "formula-save-reroll",
        actor: syntheticE,
        timestamp: 30,
        rolls: [{ degreeOfSuccess: "failure" }],
        flags: { pf2e: { context: {
            outcome: "failure",
            isReroll: true,
            options: [`pf2e-auto-basic-save:${formulaState.castId}:${formulaState.targets[1].id}`, "check:reroll:hero-points"]
        } } }
    });
    formulaState = formulaStarted.card.getFlag(MODULE_ID, "basicSaveState");
    const requiredFormula = requiredOutcomeDamageRolls(formulaState);
    assert.equal(requiredFormula.length, 1);
    assert.equal(requiredFormula[0].formula, "2d6[fire]");
    await degreeRuntime.rollOutcomeDamage(formulaStarted.card, requiredFormula[0].id);
    await new BasicSaveRuntime().apply(formulaStarted.card, { skipConfirmation: true });
    assert.equal(syntheticD.system.attributes.hp.value, 42);
    assert.equal(syntheticE.system.attributes.hp.value, 42);
    const completedFormula = formulaStarted.card.getFlag(MODULE_ID, "basicSaveState");
    assert.equal(completedFormula.targets[0].damageResults[0].kind, "outcome");
    assert.equal(completedFormula.targets[1].damageResults[0].rollId, completedFormula.targets[0].damageResults[0].rollId);

    const syntheticF = makeSyntheticActor("f");
    const tokenF = { documentName: "Token", uuid: "Scene.scene.Token.f", actor: syntheticF };
    documents.set(syntheticF.uuid, syntheticF);
    documents.set(tokenF.uuid, tokenF);
    const mixedStarted = await degreeRuntime.start(spell, {
        plan: outcomeDamagePlan({ mixed: true }),
        sourceActor: caster,
        targets: [{ documentName: "Token", actor: syntheticF, document: tokenF }],
        castRank: 4,
        skipConfirmation: true
    });
    await degreeRuntime.rollDamage(mixedStarted.card);
    const mixedState = mixedStarted.card.getFlag(MODULE_ID, "basicSaveState");
    await degreeRuntime.handleSaveMessage({
        id: "mixed-damage-save",
        actor: syntheticF,
        timestamp: 40,
        rolls: [{ degreeOfSuccess: "failure" }],
        flags: { pf2e: { context: {
            outcome: "failure",
            options: [`pf2e-auto-basic-save:${mixedState.castId}:${mixedState.targets[0].id}`]
        } } }
    });
    const mixedRequired = requiredOutcomeDamageRolls(mixedStarted.card.getFlag(MODULE_ID, "basicSaveState"));
    assert.equal(mixedRequired.length, 1);
    assert.equal(mixedRequired[0].formula, "2d4[persistent,fire]");
    await degreeRuntime.rollOutcomeDamage(mixedStarted.card, mixedRequired[0].id);
    await degreeRuntime.apply(mixedStarted.card, { skipConfirmation: true });
    const completedMixed = mixedStarted.card.getFlag(MODULE_ID, "basicSaveState");
    assert.deepEqual(completedMixed.targets[0].damageResults.map(result => result.kind), ["shared", "outcome"]);

    const restrictedPlan = outcomeDamagePlan();
    restrictedPlan.source.name = "Test Undead Targeting";
    restrictedPlan.targeting.actorConstraints = {
        sourceText: "1 undead creature",
        supportsActorTargets: true,
        complete: true,
        predicates: [{ kind: "trait", slug: "undead", present: true }]
    };
    const syntheticG = makeSyntheticActor("g");
    syntheticG.type = "npc";
    syntheticG.system.traits = { value: [] };
    const tokenG = { documentName: "Token", uuid: "Scene.scene.Token.g", actor: syntheticG };
    documents.set(syntheticG.uuid, syntheticG);
    documents.set(tokenG.uuid, tokenG);
    const unaffected = await degreeRuntime.start(spell, {
        plan: restrictedPlan,
        sourceActor: caster,
        targets: [{ documentName: "Token", actor: syntheticG, document: tokenG }],
        castRank: 2,
        skipConfirmation: true
    });
    assert.equal(unaffected.status, "prepared");
    assert.equal(unaffected.state.targets[0].eligible, false);
    assert.equal(unaffected.state.targets[0].applicationStatus, "unaffected");
    assert.match(unaffected.state.targets[0].eligibilityReason, /requires the undead trait/);
    syntheticG.system.traits.value.push("undead");
    const eligible = await degreeRuntime.start(spell, {
        plan: restrictedPlan,
        sourceActor: caster,
        targets: [{ documentName: "Token", actor: syntheticG, document: tokenG }],
        castRank: 2,
        skipConfirmation: true
    });
    assert.equal(eligible.status, "prepared");

    const syntheticH = makeSyntheticActor("h");
    const syntheticI = makeSyntheticActor("i");
    const tokenH = { documentName: "Token", uuid: "Scene.scene.Token.h", actor: syntheticH };
    const tokenI = { documentName: "Token", uuid: "Scene.scene.Token.i", actor: syntheticI };
    for (const document of [syntheticH, syntheticI, tokenH, tokenI]) documents.set(document.uuid, document);
    const finalizeStarted = await degreeRuntime.start(spell, {
        plan: outcomeDamagePlan(),
        sourceActor: caster,
        targets: [{ documentName: "Token", actor: syntheticH, document: tokenH }],
        castRank: 2,
        skipConfirmation: true
    });
    assert.match(finalizeStarted.card.content, /data-save-action="add-targets"/);
    assert.match(finalizeStarted.card.content, /data-save-action="finalize"/);
    assert.doesNotMatch(finalizeStarted.card.content, /data-save-action="roll-damage"/);
    assert.doesNotMatch(finalizeStarted.card.content, /data-save-action="apply"/);
    const added = await degreeRuntime.addTargets(finalizeStarted.card, [
        { documentName: "Token", actor: syntheticH, document: tokenH },
        { documentName: "Token", actor: syntheticI, document: tokenI }
    ]);
    assert.equal(added.status, "added");
    assert.equal(added.added, 1);
    const finalizeState = finalizeStarted.card.getFlag(MODULE_ID, "basicSaveState");
    assert.equal(finalizeState.targets.length, 2);
    for (const [index, synthetic] of [syntheticH, syntheticI].entries()) {
        await degreeRuntime.handleSaveMessage({
            id: `finalize-save-${index}`,
            actor: synthetic,
            timestamp: 50 + index,
            rolls: [{ degreeOfSuccess: "failure" }],
            flags: { pf2e: { context: {
                outcome: "failure",
                options: [`pf2e-auto-basic-save:${finalizeState.castId}:${finalizeState.targets[index].id}`]
            } } }
        });
    }
    const messageCountBeforeFinalize = messages.length;
    const finalized = await degreeRuntime.finalize(finalizeStarted.card);
    assert.equal(finalized.status, "applied");
    const finalizedState = finalizeStarted.card.getFlag(MODULE_ID, "basicSaveState");
    assert.equal(finalizedState.status, "completed");
    assert.ok(finalizedState.resultMessageId);
    assert.equal(messages.length, messageCountBeforeFinalize + 1);
    assert.equal(messages.get(finalizedState.resultMessageId).flags[MODULE_ID].kind, "save-resolution-result");
    assert.match(messages.get(finalizedState.resultMessageId).content, /Damage &amp; Effects/);
    assert.match(messages.get(finalizedState.resultMessageId).content, /damage color fire pf2e-auto-damage-result/);
    assert.match(messages.get(finalizedState.resultMessageId).content, /fa-fire/);
    await assert.rejects(degreeRuntime.addTargets(finalizeStarted.card, []), /locked after finalization/);

    const syntheticJ = makeSyntheticActor("j");
    const syntheticK = makeSyntheticActor("k");
    syntheticJ.saves.fortitude.roll = async () => ({
        total: 25,
        options: { degreeOfSuccess: 2, totalModifier: 12 },
        dice: [{ results: [{ result: 13, active: true }] }]
    });
    syntheticK.saves.fortitude.roll = async () => ({
        total: 18,
        options: { degreeOfSuccess: 1, totalModifier: 8 },
        dice: [{ results: [{ result: 10, active: true }] }]
    });
    const tokenJ = { documentName: "Token", uuid: "Scene.scene.Token.j", actor: syntheticJ };
    const tokenK = { documentName: "Token", uuid: "Scene.scene.Token.k", actor: syntheticK };
    for (const document of [syntheticJ, syntheticK, tokenJ, tokenK]) documents.set(document.uuid, document);
    const secondaryStarted = await degreeRuntime.start(spell, {
        plan: secondarySavePlan(),
        sourceActor: caster,
        targets: [
            { documentName: "Token", actor: syntheticJ, document: tokenJ },
            { documentName: "Token", actor: syntheticK, document: tokenK }
        ],
        castRank: 4,
        skipConfirmation: true
    });
    const secondaryState = secondaryStarted.card.getFlag(MODULE_ID, "basicSaveState");
    for (const [index, synthetic] of [syntheticJ, syntheticK].entries()) {
        await degreeRuntime.handleSaveMessage({
            id: `secondary-primary-save-${index}`,
            actor: synthetic,
            timestamp: 70 + index,
            rolls: [{ degreeOfSuccess: "criticalFailure" }],
            flags: { pf2e: { context: {
                outcome: "criticalFailure",
                options: [`pf2e-auto-basic-save:${secondaryState.castId}:${secondaryState.targets[index].id}`]
            } } }
        });
    }
    let pendingSecondary = secondaryStarted.card.getFlag(MODULE_ID, "basicSaveState");
    assert.equal(pendingSecondary.targets.every(targetEntry => targetEntry.secondary != null), true);
    assert.equal(saveCollectionReadiness(pendingSecondary).ready, false);
    assert.match(secondaryStarted.card.content, /Secondary fortitude save/);
    assert.equal(
        (secondaryStarted.card.content.match(/Secondary fortitude save/g) ?? []).length,
        pendingSecondary.targets.filter(targetEntry => targetEntry.secondary != null).length,
        "each active secondary save should only be labeled in its dedicated panel",
    );
    await degreeRuntime.handleSaveMessage({
        id: "secondary-primary-reroll-away",
        actor: syntheticK,
        timestamp: 80,
        rolls: [{ degreeOfSuccess: "success" }],
        flags: { pf2e: { context: {
            outcome: "success",
            isReroll: true,
            options: [`pf2e-auto-basic-save:${secondaryState.castId}:${secondaryState.targets[1].id}`, "check:reroll"]
        } } }
    });
    assert.equal(secondaryStarted.card.getFlag(MODULE_ID, "basicSaveState").targets[1].secondary, null);
    await degreeRuntime.handleSaveMessage({
        id: "secondary-primary-reroll-back",
        actor: syntheticK,
        timestamp: 81,
        rolls: [{ degreeOfSuccess: "criticalFailure" }],
        flags: { pf2e: { context: {
            outcome: "criticalFailure",
            isReroll: true,
            options: [`pf2e-auto-basic-save:${secondaryState.castId}:${secondaryState.targets[1].id}`, "check:reroll"]
        } } }
    });
    pendingSecondary = secondaryStarted.card.getFlag(MODULE_ID, "basicSaveState");
    assert.equal(pendingSecondary.targets[1].secondary.degree, null);
    const reloadedSecondaryRuntime = new BasicSaveRuntime();
    for (const targetEntry of pendingSecondary.targets) {
        await reloadedSecondaryRuntime.rollSave(secondaryStarted.card, targetEntry.id, {
            stage: "secondary",
            skipDialog: true
        });
    }
    pendingSecondary = secondaryStarted.card.getFlag(MODULE_ID, "basicSaveState");
    assert.deepEqual(pendingSecondary.targets.map(targetEntry => targetEntry.secondary.degree), ["success", "failure"]);
    assert.equal(saveCollectionReadiness(pendingSecondary).ready, true);
    await reloadedSecondaryRuntime.finalize(secondaryStarted.card);
    const completedSecondary = secondaryStarted.card.getFlag(MODULE_ID, "basicSaveState");
    assert.equal(syntheticJ.system.attributes.hp.value, 38);
    assert.equal(syntheticK.system.attributes.hp.value, 50);
    assert.equal(completedSecondary.targets[0].damageResults[0].kind, "outcome");
    assert.equal(syntheticJ.effectSources[0].system.rules[0].uuid.endsWith(".frightened"), true);
    assert.equal(syntheticK.statuses.has("dead"), true);
    const secondaryResultCard = messages.get(completedSecondary.resultMessageId);
    assert.match(secondaryResultCard.content, /Secondary fortitude save/);
    assert.match(secondaryResultCard.content, /Mental Damage/);
    const corrections = await runtime.start(spell, {
        plan: automaticPlan(), sourceActor: caster, targets: [target], castRank: 3, skipConfirmation: true
    });
    const correctionState = corrections.card.getFlag(MODULE_ID, "basicSaveState");
    const correctionId = correctionState.targets[0].id;
    await runtime.handleSaveMessage(makeSaveMessage("correction-save", "failure", false, correctionState));
    await runtime.correctTarget(corrections.card, correctionId, { action: "degree", degree: "success" });
    assert.match(corrections.card.content, /GM adjusted/);
    game.user.isGM = false;
    await assert.rejects(runtime.correctTarget(corrections.card, correctionId, { action: "exclude" }), /coordinating GM/);
    game.user.isGM = true;
    await runtime.correctTarget(corrections.card, correctionId, { action: "exclude" });
    assert.match(corrections.card.content, /Restore Target/);
    await runtime.correctTarget(corrections.card, correctionId, { action: "restore" });
    assert.equal(corrections.card.getFlag(MODULE_ID, "basicSaveState").targets[0].degree, "success");
    await runtime.correctTarget(corrections.card, correctionId, { action: "unaffected" });
    const hpBeforeCorrection = target.system.attributes.hp.value;
    const concurrent = await Promise.allSettled([
        runtime.finalize(corrections.card),
        runtime.finalize(corrections.card),
        runtime.correctTarget(corrections.card, correctionId, { action: "affected" })
    ]);
    assert.deepEqual(concurrent.map(result => result.status), ["fulfilled", "rejected", "rejected"]);
    assert.match(concurrent[2].reason.message, /locked/);
    assert.equal(target.system.attributes.hp.value, hpBeforeCorrection);
    await assert.rejects(runtime.correctTarget(corrections.card, correctionId, { action: "affected" }), /locked/);

    const tokenless = await runtime.start(spell, {
        plan: automaticPlan(), sourceActor: caster, targets: [target], castRank: 3, skipConfirmation: true
    });
    await runtime.handleSaveMessage(makeSaveMessage("tokenless-save", "failure", false, tokenless.card.getFlag(MODULE_ID, "basicSaveState")));
    const activeTokens = target.getActiveTokens;
    target.getActiveTokens = () => [];
    const tokenlessHp = target.system.attributes.hp.value;
    target.applyDamage = async options => mockNativeDamage.call(target, options);
    await assert.rejects(runtime.finalize(tokenless.card), /token.*damage/i);
    assert.equal(target.system.attributes.hp.value, tokenlessHp, "missing token must stop before irreversible PF2e damage");
    assert.equal(tokenless.card.getFlag(MODULE_ID, "basicSaveState").status, "collecting");
    target.getActiveTokens = activeTokens;

    let releaseNativeRoll;
    let nativeRollStarted;
    const nativeStarted = new Promise(resolve => { nativeRollStarted = resolve; });
    target.saves.reflex.roll = () => {
        nativeRollStarted();
        return new Promise(resolve => { releaseNativeRoll = resolve; });
    };
    const tokenlessState = tokenless.card.getFlag(MODULE_ID, "basicSaveState");
    const pendingNativeRoll = runtime.rollSave(tokenless.card, tokenlessState.targets[0].id);
    await nativeStarted;
    await runtime.correctTarget(tokenless.card, tokenlessState.targets[0].id, { action: "degree", degree: "success" });
    releaseNativeRoll({ degreeOfSuccess: "criticalFailure", total: 1 });
    await assert.rejects(pendingNativeRoll, /changed while the save dialog was open/);
    assert.equal(tokenless.card.getFlag(MODULE_ID, "basicSaveState").targets[0].degree, "success");
    await assert.rejects(runtime.handleSocket({
        type: "inline-save-result", castId: tokenlessState.castId,
        targetId: tokenlessState.targets[0].id, actorUuid: target.uuid,
        userId: "unknown-player", degree: "criticalSuccess", submissionId: "unauthorized",
        targetRevision: tokenless.card.getFlag(MODULE_ID, "basicSaveState").targets[0].revision
    }), /submitting user cannot roll/);

});
