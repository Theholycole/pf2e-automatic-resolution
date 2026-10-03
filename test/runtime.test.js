import assert from "node:assert/strict";
import test from "node:test";

import { EffectRuntime, MODULE_ID } from "../scripts/effect-runtime.js";

class ItemCollection extends Array {
    get(id) {
        return this.find(item => item.id === id) ?? null;
    }
}

function actor(name, id) {
    const result = {
        id,
        uuid: `Actor.${id}`,
        name,
        documentName: "Actor",
        items: new ItemCollection(),
        canUserModify: () => true,
        async createEmbeddedDocuments(_type, sources) {
            const created = sources.map(source => {
                const item = {
                    ...structuredClone(source),
                    id: `effect-${this.items.length + 1}`,
                    uuid: `${this.uuid}.Item.effect-${this.items.length + 1}`,
                    actor: this,
                    async delete() {
                        const index = this.actor.items.indexOf(this);
                        if (index >= 0) this.actor.items.splice(index, 1);
                    }
                };
                this.items.push(item);
                return item;
            });
            return created;
        }
    };
    return result;
}

function installGlobals(t, { actors, templates, castId }) {
    const prior = Object.fromEntries(["foundry", "game", "canvas", "ChatMessage", "Hooks", "fromUuid"]
        .map(key => [key, globalThis[key]]));
    globalThis.foundry = {
        utils: { deepClone: structuredClone, randomID: () => castId, escapeHTML: value => String(value) },
        applications: { api: { DialogV2: { prompt: async () => true } } }
    };
    globalThis.game = {
        user: { id: "gm", isGM: true, targets: new Set() },
        users: { contents: [{ id: "gm", active: true, isGM: true }] },
        actors: { contents: actors },
        messages: { get: () => null }
    };
    globalThis.canvas = { tokens: { placeables: [] } };
    globalThis.ChatMessage = {
        getSpeaker: () => ({}),
        create: async data => ({ id: "receipt", ...data })
    };
    globalThis.Hooks = { callAll: () => {} };
    globalThis.fromUuid = async uuid => templates.get(uuid) ?? null;
    t.after(() => Object.assign(globalThis, prior));
}

function effectTemplate(uuid, name) {
    return {
        uuid,
        name,
        type: "effect",
        _stats: { compendiumSource: uuid },
        toObject: () => ({
            _id: "pack-id",
            name,
            type: "effect",
            system: { level: { value: 1 }, rules: [] },
            flags: {},
            _stats: { compendiumSource: uuid }
        })
    };
}

function basePlan(kind, sourceActor) {
    const primaryUuid = "Compendium.pf2e.spell-effects.Item.Primary";
    const primary = {
        uuid: primaryUuid,
        reference: "Primary",
        label: "Primary",
        recipient: { actor: "source" }
    };
    return {
        compilerVersion: "test",
        source: { name: "Runtime Test", uuid: "Actor.source.Item.spell" },
        rank: 1,
        automation: { level: "automatic", pendingCapabilities: [] },
        nativeEffects: {
            onUse: [primary],
            rankVariants: [],
            choiceVariants: [],
            deferred: [],
            sequences: [],
            terminations: []
        },
        resolution: {
            kind,
            applications: [{ kind: "native-spell-effect", uuid: primaryUuid, source: "nativeEffects.onUse" }]
        },
        sourceActor
    };
}

test("Foundry runtime clones, tags, and dismisses a direct native Effect", async t => {
    const caster = actor("Caster", "source");
    const primaryUuid = "Compendium.pf2e.spell-effects.Item.Primary";
    const templates = new Map([[primaryUuid, effectTemplate(primaryUuid, "Primary Effect")]]);
    const prior = Object.fromEntries(["foundry", "game", "canvas", "ChatMessage", "Hooks", "fromUuid"].map(key => [key, globalThis[key]]));
    globalThis.foundry = { utils: { deepClone: structuredClone, randomID: () => "cast-1", escapeHTML: value => String(value) } };
    globalThis.game = {
        user: { id: "gm", isGM: true, targets: new Set() },
        users: { contents: [{ id: "gm", active: true, isGM: true }] },
        actors: { contents: [caster] },
        messages: { get: () => null }
    };
    globalThis.canvas = { tokens: { placeables: [] } };
    globalThis.ChatMessage = {
        getSpeaker: () => ({}),
        create: async data => ({ id: "receipt", ...data })
    };
    globalThis.Hooks = { callAll: () => {} };
    globalThis.fromUuid = async uuid => templates.get(uuid) ?? null;
    t.after(() => Object.assign(globalThis, prior));

    const plan = basePlan("effect", caster);
    const termination = {
        id: `${primaryUuid}:dismiss`,
        action: { cost: { type: "action", value: 1 } },
        scope: "cast-instance"
    };
    plan.nativeEffects.onUse[0].terminationId = termination.id;
    plan.nativeEffects.terminations.push(termination);
    plan.resolution.applications[0].terminationId = termination.id;

    const runtime = new EffectRuntime();
    const result = await runtime.execute({ uuid: plan.source.uuid, actor: caster }, {
        plan,
        sourceActor: caster,
        castRank: 4,
        skipConfirmation: true
    });

    assert.equal(result.status, "applied");
    assert.equal(result.created.length, 1);
    assert.equal(result.created[0].system.level.value, 4);
    assert.equal(result.created[0].system.context.origin.actor, caster.uuid);
    assert.equal(result.created[0].system.context.origin.item, plan.source.uuid);
    assert.equal(result.created[0].flags[MODULE_ID].runtime.castInstanceId, "cast-1");
    assert.equal(result.created[0].flags[MODULE_ID].runtime.termination.id, termination.id);
    await runtime.dismiss(result.created[0], { skipConfirmation: true });
    assert.equal(caster.items.length, 0);
});

test("Foundry runtime preserves and completes an effect-ended sequence", async t => {
    const caster = actor("Caster", "source");
    const primaryUuid = "Compendium.pf2e.spell-effects.Item.Primary";
    const successorUuid = "Compendium.pf2e.spell-effects.Item.Successor";
    const templates = new Map([
        [primaryUuid, effectTemplate(primaryUuid, "Primary Effect")],
        [successorUuid, effectTemplate(successorUuid, "Successor Effect")]
    ]);
    const prior = Object.fromEntries(["foundry", "game", "canvas", "ChatMessage", "Hooks", "fromUuid"].map(key => [key, globalThis[key]]));
    globalThis.foundry = {
        utils: { deepClone: structuredClone, randomID: () => "cast-2", escapeHTML: value => String(value) },
        applications: { api: { DialogV2: { prompt: async () => true } } }
    };
    globalThis.game = {
        user: { id: "gm", isGM: true, targets: new Set() },
        users: { contents: [{ id: "gm", active: true, isGM: true }] },
        actors: { contents: [caster] },
        messages: { get: () => null }
    };
    globalThis.canvas = { tokens: { placeables: [] } };
    globalThis.ChatMessage = {
        getSpeaker: () => ({}),
        create: async data => ({ id: "receipt", ...data })
    };
    globalThis.Hooks = { callAll: () => {} };
    globalThis.fromUuid = async uuid => templates.get(uuid) ?? null;
    t.after(() => Object.assign(globalThis, prior));

    const plan = basePlan("effect-sequence", caster);
    plan.nativeEffects.deferred.push({ uuid: successorUuid, label: "Successor Effect", reference: "Successor" });
    plan.nativeEffects.sequences.push({
        id: "sequence-1",
        primaryEffectUuid: primaryUuid,
        successorEffectUuid: successorUuid,
        transition: { event: "effect-ended", sourceEffectUuid: primaryUuid, reasons: ["expired"] }
    });
    plan.resolution.sequenceId = "sequence-1";
    plan.resolution.applications.push({
        kind: "native-spell-effect",
        uuid: successorUuid,
        source: "nativeEffects.deferred"
    });

    const runtime = new EffectRuntime();
    const result = await runtime.execute({ uuid: plan.source.uuid, actor: caster }, {
        plan,
        sourceActor: caster,
        castRank: 1,
        skipConfirmation: true
    });
    const primary = result.created[0];
    assert.equal(primary.flags[MODULE_ID].runtime.sequence.id, "sequence-1");

    await primary.delete();
    await runtime.handleDeletedEffect(primary);
    assert.equal(caster.items.length, 1);
    const successor = caster.items.find(item => item.name === "Successor Effect");
    assert.equal(successor.flags[MODULE_ID].runtime.completedSequenceId, "sequence-1");
});

test("Foundry runtime confirms and completes an action-used sequence", async t => {
    const caster = actor("Caster", "source");
    const primaryUuid = "Compendium.pf2e.spell-effects.Item.Primary";
    const successorUuid = "Compendium.pf2e.spell-effects.Item.Successor";
    const templates = new Map([
        [primaryUuid, effectTemplate(primaryUuid, "Raised Shield")],
        [successorUuid, effectTemplate(successorUuid, "Shield Blocked")]
    ]);
    installGlobals(t, { actors: [caster], templates, castId: "cast-3" });

    const plan = basePlan("effect-sequence", caster);
    plan.nativeEffects.deferred.push({ uuid: successorUuid, label: "Shield Blocked", reference: "Successor" });
    plan.nativeEffects.sequences.push({
        id: "sequence-2",
        primaryEffectUuid: primaryUuid,
        successorEffectUuid: successorUuid,
        reapplication: {
            blockedWhileSuccessorActive: true,
            blockerEffectUuid: successorUuid,
            recipient: "sequence-recipient",
            reason: "temporary-immunity"
        },
        transition: {
            event: "action-used",
            actionUuid: "Compendium.pf2e.actionspf2e.Item.ShieldBlock",
            actionLabel: "Shield Block"
        }
    });
    plan.resolution.sequenceId = "sequence-2";
    plan.resolution.applications.push({
        kind: "native-spell-effect",
        uuid: successorUuid,
        source: "nativeEffects.deferred"
    });

    const runtime = new EffectRuntime();
    await runtime.execute({ uuid: plan.source.uuid, actor: caster }, {
        plan,
        sourceActor: caster,
        castRank: 1,
        skipConfirmation: true
    });
    const [transition] = await runtime.triggerActionUsed(caster, "Compendium.pf2e.actionspf2e.Item.ShieldBlock");

    assert.equal(transition.status, "applied");
    assert.equal(caster.items.length, 1);
    assert.equal(caster.items[0].name, "Shield Blocked");
    assert.equal(caster.items[0].flags[MODULE_ID].runtime.completedSequenceId, "sequence-2");

    const blocked = await runtime.execute({ uuid: plan.source.uuid, actor: caster }, {
        plan,
        sourceActor: caster,
        castRank: 1,
        skipConfirmation: true
    });
    assert.equal(blocked.status, "blocked");
    assert.equal(blocked.reason, "successor-active");
    assert.equal(caster.items.length, 1);
});

test("Foundry runtime rolls back earlier targets when a later Effect creation fails", async t => {
    const caster = actor("Caster", "source");
    const firstTarget = actor("First Target", "target-1");
    const failingTarget = actor("Failing Target", "target-2");
    failingTarget.createEmbeddedDocuments = async () => {
        throw new Error("simulated PF2e creation failure");
    };
    const primaryUuid = "Compendium.pf2e.spell-effects.Item.Primary";
    const templates = new Map([[primaryUuid, effectTemplate(primaryUuid, "Target Effect")]]);
    installGlobals(t, { actors: [caster, firstTarget, failingTarget], templates, castId: "cast-4" });

    const plan = basePlan("effect", caster);
    plan.nativeEffects.onUse[0].recipient.actor = "target";
    const runtime = new EffectRuntime();

    await assert.rejects(runtime.execute({ uuid: plan.source.uuid, actor: caster }, {
        plan,
        sourceActor: caster,
        targets: [firstTarget, failingTarget],
        castRank: 1,
        skipConfirmation: true
    }), /simulated PF2e creation failure/);
    assert.equal(firstTarget.items.length, 0);
    assert.equal(failingTarget.items.length, 0);
});
