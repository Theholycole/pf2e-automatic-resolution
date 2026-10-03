import assert from "node:assert/strict";
import test from "node:test";
import { executableConditionLinks, isExecutableDegreeSavePlan } from "../scripts/basic-save-core.js";
import { OngoingRuntime } from "../scripts/ongoing-runtime.js";
import { BasicSaveRuntime } from "../scripts/basic-save-runtime.js";

const NS = "pf2e-automatic-resolution";
const condition = (slug, value = 1) => ({ kind: "condition", slug, name: slug, value, duration: null });
const linked = (slug, root) => ({ ...condition(slug), whileCondition: root,
    endsWhen: { event: "condition-removed", condition: root } });

function plan(effects) {
    const outcome = list => ({ damage: { mode: "none", multiplier: 0 }, effects: list,
        nativeEffects: [], followUps: [], decisions: [], manualInstructions: [], terminal: null,
        semanticCoverage: { fullyCompiled: true } });
    return { source: { name: "Custom nausea", uuid: "Actor.caster.Item.custom" }, rank: 1,
        targeting: { actorConstraints: { supportsActorTargets: true, complete: true, predicates: [] } },
        automation: { level: "guided", pendingCapabilities: [], delegatedCapabilities: [] },
        lifecycle: { durationSpec: { mode: "instantaneous" }, controller: { required: false } },
        resolution: { kind: "save", check: { statistic: "fortitude", basic: false },
            sharedDamage: null, postDamageTerminal: null,
            outcomes: { criticalSuccess: outcome([]), success: outcome([]), failure: outcome([]),
                criticalFailure: outcome(effects) } } };
}

test("linked conditions require one independent sibling root and the supported removal transition", () => {
    const root = condition("sickened", 2), dependent = linked("slowed", "sickened");
    assert.deepEqual([...executableConditionLinks([root, dependent])], [[1, 0]]);
    assert.equal(isExecutableDegreeSavePlan(plan([root, dependent])), true);
    for (const effects of [
        [dependent],
        [root, root, dependent],
        [linked("sickened", "slowed"), dependent],
        [root, { ...dependent, endsWhen: { event: "turn-end" } }],
        [root, { ...dependent, duration: { mode: "fixed", value: 1, unit: "rounds" } }]
    ]) assert.equal(isExecutableDegreeSavePlan(plan(effects)), false);
    assert.equal(isExecutableDegreeSavePlan({ ...plan([root, dependent]),
        resolution: { ...plan([root, dependent]).resolution, postDamageTerminal: { kind: "death" } } }), false);
});

test("save card snapshot preserves a linked condition through start and apply", async t => {
    const names = ["game", "foundry", "ChatMessage", "fromUuid", "Hooks", "CONFIG"];
    const prior = Object.fromEntries(names.map(name => [name, globalThis[name]]));
    t.after(() => Object.assign(globalThis, prior));
    let sequence = 0;
    const gm = { id: "gm", active: true, isGM: true };
    const users = [gm]; users.contents = users;
    const docs = new Map(), createdSources = [], entries = [];
    let immuneRoot = false;
    const items = []; items.get = id => items.find(item => item.id === id);
    const caster = { uuid: "Actor.caster", name: "Caster", type: "npc",
        system: { traits: { value: [] }, attributes: { hp: { value: 100 } } } };
    const recipient = { uuid: "Actor.recipient", documentName: "Actor", name: "Recipient", type: "npc", items,
        system: { traits: { value: [] }, attributes: { hp: { value: 100 } } },
        isOfType: kind => kind === "creature", canUserModify: () => true,
        async createEmbeddedDocuments(_type, sources) {
            if (immuneRoot) for (const source of sources) for (const rule of source.system.rules) {
                if (rule.uuid.endsWith("sickened")) rule.ignored = true;
            }
            createdSources.push(...structuredClone(sources));
            return sources.flatMap(source => {
                const id = `effect-${++sequence}`;
                const grants = {};
                const effect = { id, uuid: `${this.uuid}.Item.${id}`, type: "effect", actor: this,
                    flags: structuredClone(source.flags), system: structuredClone(source.system),
                    async delete() { docs.delete(this.uuid); items.splice(items.indexOf(this), 1); } };
                docs.set(effect.uuid, effect); items.push(effect);
                const created = [effect];
                for (const rule of source.system.rules) {
                    if (rule.ignored) continue;
                    const conditionId = `grant-${++sequence}`;
                    const condition = { id: conditionId, uuid: `${this.uuid}.Item.${conditionId}`,
                        type: "condition", slug: rule.uuid.endsWith("sickened") ? "sickened" : "slowed", actor: this };
                    grants[rule.flag] = { id: conditionId };
                    docs.set(condition.uuid, condition); items.push(condition); created.push(condition);
                }
                effect.flags.pf2e = { itemGrants: grants };
                return created;
            });
        } };
    const spell = { uuid: "Actor.caster.Item.custom", actor: caster, name: "Custom nausea",
        rank: 1, system: { traits: { value: [] } }, getRollOptions: () => [],
        toObject: () => ({ name: "Custom nausea", type: "spell", system: {} }) };
    for (const document of [caster, recipient, spell]) docs.set(document.uuid, document);
    globalThis.foundry = { utils: { deepClone: structuredClone, randomID: () => `id-${++sequence}`, escapeHTML: String } };
    globalThis.game = { user: gm, users, journal: { contents: [] },
        actors: { contents: [caster, recipient] }, scenes: { contents: [] },
        messages: [], time: { worldTime: 0 }, pf2e: { ConditionManager: { getCondition: slug => ({
            id: slug, uuid: `Compendium.pf2e.conditionitems.Item.${slug}`,
            _stats: { compendiumSource: `Compendium.pf2e.conditionitems.Item.${slug}` },
            img: `${slug}.webp`, system: { value: { isValued: true } }
        }) } } };
    globalThis.fromUuid = async uuid => docs.get(uuid) ?? null;
    globalThis.Hooks = { callAll() {} };
    globalThis.CONFIG = { Dice: { rolls: [] }, PF2E: {} };
    globalThis.ChatMessage = { getSpeaker: () => ({}), create: async source => {
        const card = { id: `message-${++sequence}`, author: gm, content: source.content,
            flags: structuredClone(source.flags),
            getFlag(scope, key) { return this.flags[scope]?.[key]; },
            async setFlag(scope, key, data) { (this.flags[scope] ??= {})[key] = structuredClone(data); },
            async update(changes) {
                this.content = changes.content ?? this.content;
                const state = changes[`flags.${NS}.basicSaveState`];
                if (state) this.flags[NS].basicSaveState = structuredClone(state);
            } };
        game.messages.push(card); return card;
    } };
    const runtime = new BasicSaveRuntime();
    runtime.ongoing = { assertCoordinator() {}, assertSave() {}, hasSave: () => false,
        begin: async () => ({ id: "journal" }),
        attach: async (_journal, effect) => { entries.push(effect); },
        activate: async () => {}, review: async () => {} };
    const { card } = await runtime.start(spell, { plan: plan([condition("sickened", 2), linked("slowed", "sickened")]),
        sourceActor: caster, targets: [recipient], dc: 20, skipConfirmation: true });
    const state = card.getFlag(NS, "basicSaveState");
    assert.equal(state.outcomes.criticalFailure.effects[1].whileCondition, "sickened");
    assert.deepEqual(state.outcomes.criticalFailure.effects[1].endsWhen,
        { event: "condition-removed", condition: "sickened" });
    state.targets[0].degree = "criticalFailure";
    await card.setFlag(NS, "basicSaveState", state);
    const result = await runtime.apply(card, { skipConfirmation: true, createResultCard: false });
    assert.equal(result.status, "applied");
    assert.equal(createdSources.length, 2);
    assert.equal(createdSources[1].flags[NS].outcomeEffect.linkedTo.rootGrantId,
        entries[0].flags.pf2e.itemGrants.condition1.id);
    assert.equal(entries.length, 2);

    immuneRoot = true;
    const skipped = await runtime.start(spell, { plan: plan([condition("sickened", 2), linked("slowed", "sickened")]),
        sourceActor: caster, targets: [recipient], dc: 20, skipConfirmation: true });
    const skippedState = skipped.card.getFlag(NS, "basicSaveState");
    skippedState.targets[0].degree = "criticalFailure";
    await skipped.card.setFlag(NS, "basicSaveState", skippedState);
    const skippedResult = await runtime.apply(skipped.card, { skipConfirmation: true });
    assert.equal(skippedResult.status, "applied");
    assert.equal(skippedResult.state.targets[0].conditionResults[1].status, "dependency-unavailable");
    assert.equal(createdSources.length, 3);
    assert.match(game.messages.at(-1).content, /slowed 1 \(not applied — required condition absent\)/i);
});

function fixture(t) {
    const names = ["game", "foundry", "JournalEntry", "fromUuid"];
    const prior = Object.fromEntries(names.map(name => [name, globalThis[name]]));
    t.after(() => Object.assign(globalThis, prior));
    const docs = new Map(), journals = [];
    let next = 0;
    const gm = { id: "gm", active: true, isGM: true };
    const users = [gm]; users.contents = users;
    const items = []; items.get = id => items.find(item => item.id === id);
    const actor = { uuid: "Actor.target", name: "Target", items, reset() {} };
    globalThis.game = { user: gm, users, journal: { contents: journals },
        actors: { contents: [actor] }, scenes: { contents: [] }, time: { worldTime: 0 } };
    globalThis.foundry = { utils: { deepClone: structuredClone } };
    globalThis.fromUuid = async uuid => docs.get(uuid) ?? null;
    globalThis.JournalEntry = { create: async source => {
        const journal = { id: `journal-${++next}`, flags: source.flags,
            getFlag(ns, key) { return this.flags[ns][key]; },
            async setFlag(ns, key, data) { this.flags[ns][key] = structuredClone(data); } };
        journals.push(journal); return journal;
    } };
    const add = (id, type, metadata, extra = {}) => {
        const item = { id, uuid: `${actor.uuid}.Item.${id}`, type, actor, name: id,
            flags: { [NS]: metadata ? { outcomeEffect: metadata } : {}, ...extra.flags },
            system: { duration: { value: -1, unit: "unlimited" }, rules: extra.rules ?? [] },
            async delete() { docs.delete(this.uuid); items.splice(items.indexOf(this), 1); } };
        docs.set(item.uuid, item); items.push(item); return item;
    };
    const root = add("root", "effect", { castId: "cast", sourceActorUuid: actor.uuid,
        conditions: [{ slug: "sickened", ruleFlag: "condition1" }] },
        { flags: { pf2e: { itemGrants: { condition1: { id: "root-grant" } } } } });
    const grant = add("root-grant", "condition", null); grant.slug = "sickened";
    const dependent = add("dependent", "effect", { castId: "cast", sourceActorUuid: actor.uuid,
        linkedTo: { rootEffectUuid: root.uuid, rootGrantId: grant.id,
            rootRuleFlag: "condition1", rootSlug: "sickened" },
        conditions: [{ slug: "slowed", ruleFlag: "condition1" }] });
    const unrelated = add("other-sickened", "condition", null); unrelated.slug = "sickened";
    const runtime = new OngoingRuntime();
    return { docs, journals, actor, root, grant, dependent, unrelated, runtime };
}

async function track(f) {
    const journal = await f.runtime.begin({ castId: "cast", name: "Custom Spell", kind: "native",
        sourceActorUuid: f.actor.uuid, recipientUuids: [f.actor.uuid] });
    await f.runtime.attach(journal, f.root);
    await f.runtime.attach(journal, f.dependent);
    await f.runtime.activate(journal);
    return journal;
}

test("native removal of one root grant ends its own linked effect despite overlapping Sickened", async t => {
    const f = fixture(t), journal = await track(f);
    await f.grant.delete();
    await f.runtime.deleted(f.grant);
    const record = journal.getFlag(NS, "ongoingCast");
    assert.equal(record.status, "ended");
    assert.equal(f.docs.has(f.dependent.uuid), false);
    assert.equal(f.docs.has(f.root.uuid), false);
    assert.equal(f.docs.has(f.unrelated.uuid), true);
});

test("native root expiry ends the linked contribution and leaves unrelated conditions", async t => {
    const f = fixture(t), journal = await track(f);
    f.root.isExpired = true;
    await f.runtime.reconcile();
    assert.equal(journal.getFlag(NS, "ongoingCast").status, "ended");
    assert.equal(f.docs.has(f.root.uuid), false);
    assert.equal(f.docs.has(f.dependent.uuid), false);
    assert.equal(f.docs.has(f.unrelated.uuid), true);
});

test("native root wrapper removal ends its linked effect without using actor-wide condition state", async t => {
    const f = fixture(t), journal = await track(f);
    await f.root.delete();
    await f.runtime.deleted(f.root);
    assert.equal(journal.getFlag(NS, "ongoingCast").status, "ended");
    assert.equal(f.docs.has(f.dependent.uuid), false);
    assert.equal(f.docs.has(f.unrelated.uuid), true);
});

test("root recovery and expiry end only owned linked effects; dependent detachment preserves manual effect", async t => {
    const f = fixture(t), journal = await track(f);
    let record = journal.getFlag(NS, "ongoingCast");
    record.entries.find(entry => entry.uuid === f.dependent.uuid).detached = true;
    await f.runtime.save(journal, record);
    await f.root.delete();
    await f.runtime.reconcileLinks(journal);
    assert.equal(f.docs.has(f.dependent.uuid), true);
    assert.equal(f.docs.has(f.unrelated.uuid), true);
});

test("detaching a root transfers its dependent; detaching only a dependent leaves the root tracked", async t => {
    const f = fixture(t), journal = await track(f);
    await f.runtime.request("detach", { castId: "cast", uuid: f.root.uuid });
    let record = journal.getFlag(NS, "ongoingCast");
    assert.equal(record.entries.every(entry => entry.detached), true);
    assert.equal(f.docs.has(f.root.uuid), true);
    assert.equal(f.docs.has(f.dependent.uuid), true);

    const second = fixture(t), secondJournal = await track(second);
    await second.runtime.request("detach", { castId: "cast", uuid: second.dependent.uuid });
    record = secondJournal.getFlag(NS, "ongoingCast");
    assert.equal(record.entries.find(entry => entry.uuid === second.root.uuid).detached, undefined);
    assert.equal(record.entries.find(entry => entry.uuid === second.dependent.uuid).detached, true);
});

test("uncertain linked deletion enters review and is never replayed", async t => {
    const f = fixture(t), journal = await track(f);
    await f.grant.delete();
    let attempts = 0;
    f.dependent.delete = async () => { attempts++; throw Error("uncertain native write"); };
    await assert.rejects(f.runtime.reconcileLinks(journal), /uncertain native write/);
    assert.equal(journal.getFlag(NS, "ongoingCast").status, "review");
    await f.runtime.reconcile({ recover: true });
    assert.equal(attempts, 1);
});
