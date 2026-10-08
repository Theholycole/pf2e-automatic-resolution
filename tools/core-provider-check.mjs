// The spell module's providers through pf2e-resolution-core's real patches (its scripts/patches.js), Foundry and PF2e faked: the d20 limit,
// the text rules and the cascade transformer, selective terrain, Demon Bone Tiles' shield and the damage readers. Needs the core beside this
// module (../pf2e-resolution-core). Run: node tools/core-provider-check.mjs
import assert from "node:assert/strict";
import fs from "node:fs";

const SPELL = new URL("../", import.meta.url);
const MODULE_ID = "pf2e-automatic-resolution";

// ---- fake Foundry / PF2e ----
const hooks = {};
const flagWrites = [];
class Actor {
    constructor(uuid, extra = {}) { this._uuid = uuid; Object.assign(this, extra); }
    get uuid() { return this._uuid; }
    async applyDamage(params) { this.lastParams = params; return `applied ${params?.damage?.instances?.length ?? 0}`; }
}
class ItemPF2e { prepareRuleElements() { return this.system.rules; } static async createDocuments(data) { return data; } }
class FeatPF2e extends ItemPF2e {}
class CheckRoll {
    constructor(d20, domains, modifiers = []) { this.dice = [{ faces: 20, modifiers, results: d20.map(result => ({ result, active: true })) }]; this.options = { domains }; }
    async evaluate() { return this; }
    _evaluateTotal() { return this.dice[0].results.filter(entry => entry.active !== false).reduce((sum, entry) => sum + entry.result, 0); }
}
const Check = { roll: async (check, context) => context };
class ModifyMovementCost { constructor(flags) { this.parent = { flags }; } _getTerrainEffects() { return ["original"]; } }
globalThis.CONFIG = {
    Actor: { documentClass: Actor },
    PF2E: { Item: { documentClasses: { feat: FeatPF2e } } },
    Dice: { rolls: [CheckRoll] },
    RegionBehavior: { dataModels: { modifyMovementCost: ModifyMovementCost } }
};
const api = {};
globalThis.game = { pf2e: { Check }, actors: [], scenes: { get: () => null }, user: { isGM: true, id: "gm" }, users: { activeGM: { id: "gm" }, filter: () => [] },
    modules: { get: id => (id === "pf2e-resolution-core" ? { api } : null) } };
globalThis.Hooks = { on: (name, fn) => (hooks[name] ??= []).push(fn), once: (name, fn) => (hooks[name] ??= []).push(fn), callAll: () => {} };
globalThis.foundry = { utils: { deepClone: value => structuredClone(value) } };
globalThis.canvas = {};

// ---- the core, installed ----
const { installPatches, patchesApi } = await import("../../pf2e-resolution-core/scripts/patches.js");
api.patches = patchesApi;
installPatches();
await new Promise(resolve => setTimeout(resolve, 5));
assert.deepEqual(patchesApi.status(), { damage: "core", rules: "core", d20: "core", terrain: "core" });

// ---- the spell module's registration, as main.js's init hook does it ----
const { core } = await import(new URL("scripts/runtime-utils.js", SPELL));
const { d20LimitsFor } = await import(new URL("scripts/d20-clamp.js", SPELL));
const { rulesFromText, cascadeTypeAhead } = await import(new URL("scripts/text-rules.js", SPELL));
const { shieldShardsBlock } = await import(new URL("scripts/item-spellshape-runtime.js", SPELL));
const { readTextRules, rulesWithText } = await import(new URL("src/compiler/plus-feature-rules.js", SPELL));
const { halvedCopyDamage } = await import(new URL("scripts/incarnate-parts-runtime.js", SPELL));
// (main.js's damageFollowUps needs Foundry to load: a stand-in with its shape — the real halving, then an awaited follow-up.)
const followUps = [];
const damageFollowUps = (actor, params) => ({ params: halvedCopyDamage(params), after: async () => { await new Promise(resolve => setTimeout(resolve, 10)); followUps.push(actor.uuid); } });
const patches = core().patches;
patches.d20.registerLimitProvider({ module: MODULE_ID, name: "effect-d20-limits", limits: d20LimitsFor });
patches.rules.registerRewriter({ module: MODULE_ID, name: "text-rules", rewrite: rulesFromText });
patches.rules.registerCreateTransformer({ module: MODULE_ID, name: "arcane-cascade", transform: cascadeTypeAhead });
patches.terrain.registerProvider({ module: MODULE_ID, name: "selective-terrain",
    selective: behavior => behavior.behavior?.flags?.[MODULE_ID]?.selectiveTerrain ?? behavior.parent?.flags?.[MODULE_ID]?.selectiveTerrain ?? null });
patches.damage.onApply({ module: MODULE_ID, name: "damage-follow-ups", before: damageFollowUps });
patches.damage.onApply({ module: MODULE_ID, name: "shield-shards", before: shieldShardsBlock });

// d20: a module Effect's "get a 10 instead" on saves.
const clamped = new Actor("Actor.c", { itemTypes: { effect: [{ flags: { [MODULE_ID]: { runtime: { d20Clamp: { types: ["saving-throw"], min: 10 } } } } }] } });
const context = await Check.roll({}, { actor: clamped, type: "saving-throw" });
assert.ok(context.domains.includes("pf2e-resolution-core-d20:10:"), "the save is marked");
const unmarked = await Check.roll({}, { actor: clamped, type: "attack-roll" });
assert.equal(unmarked.domains, undefined, "other checks are not");
const roll = await new CheckRoll([3], context.domains).evaluate();
assert.equal(roll.dice[0].results[0].result, 10);
assert.equal(roll._total, 10);
assert.deepEqual(roll.options.d20Clamped, { min: 10, max: null });
const fortune = await new CheckRoll([3, 7], context.domains, ["kh"]).evaluate();
assert.deepEqual(fortune.dice[0].results.map(entry => entry.active), [true, false], "keep-highest picks again among the limited results");

// rules: a "+" Effect's rules from its text, as the old wrapper gave them.
const items = JSON.parse(fs.readFileSync(new URL(".cache/third-party-items.json", SPELL)));
for (const name of ["Effect: Comfort of Struggle", "Effect: Scholar's Lore"]) {
    const source = structuredClone(items.find(entry => entry.name === name && entry.type !== "spell"));
    const item = Object.assign(new FeatPF2e(), { _source: structuredClone(source), type: source.type, name: source.name, uuid: `Actor.x.Item.${source._id}`, system: { rules: structuredClone(source.system.rules) } });
    assert.deepEqual(item.prepareRuleElements(), rulesWithText(source.system.rules, readTextRules(source)), name);
}
const official = Object.assign(new FeatPF2e(), { _source: { _stats: { compendiumSource: "Compendium.pf2e.feats-srd.Item.x" }, system: { rules: [{ key: "Keep" }] } }, type: "feat", name: "Official", uuid: "Item.o", system: { rules: [{ key: "Keep" }] } });
assert.deepEqual(official.prepareRuleElements(), [{ key: "Keep" }], "official items untouched");
const created = await ItemPF2e.createDocuments([{ type: "feat", name: "Plain" }], { parent: clamped });
assert.deepEqual(created, [{ type: "feat", name: "Plain" }], "non-cascade items created as given");

// terrain: per creature, by size, the living; unflagged regions are Foundry's.
const listed = new ModifyMovementCost({ [MODULE_ID]: { selectiveTerrain: { actions: ["walk", "travel"], default: 1, creatures: [{ actorUuid: "Actor.a", difficulty: 2 }] } } });
const creature = (uuid, extra = {}) => ({ actor: { uuid, isOfType: () => true, size: "med", modeOfBeing: "living", ...extra } });
assert.deepEqual(listed._getTerrainEffects(creature("Actor.a"), { action: "walk" }), [{ name: "difficulty", difficulty: 2 }]);
assert.deepEqual(listed._getTerrainEffects(creature("Actor.b"), { action: "walk" }), []);
assert.deepEqual(listed._getTerrainEffects(creature("Actor.a"), { action: "fly" }), []);
const bySize = new ModifyMovementCost({ [MODULE_ID]: { selectiveTerrain: { actions: ["walk"], default: 1, bySize: { min: "med", difficulty: 2 } } } });
assert.deepEqual(bySize._getTerrainEffects(creature("Actor.a", { size: "sm" }), { action: "walk" }), []);
assert.deepEqual(bySize._getTerrainEffects(creature("Actor.a", { size: "lg" }), { action: "walk" }), [{ name: "difficulty", difficulty: 2 }]);
const living = new ModifyMovementCost({ [MODULE_ID]: { selectiveTerrain: { actions: ["walk"], default: 1, living: { difficulty: 2 } } } });
assert.deepEqual(living._getTerrainEffects(creature("Actor.a", { modeOfBeing: "undead" }), { action: "walk" }), []);
assert.deepEqual(living._getTerrainEffects(creature("Actor.a"), { action: "walk" }), [{ name: "difficulty", difficulty: 2 }]);
assert.deepEqual(new ModifyMovementCost({})._getTerrainEffects(creature("Actor.a"), { action: "walk" }), ["original"]);

// damage: types and source remembered; Demon Bone Tiles' shield marked after a Shield Block with it.
const shards = { id: "shield1", flags: { [MODULE_ID]: { shieldShards: { spent: false, name: "Demon Bone Tiles" } } },
    setFlag: async (scope, key, value) => { flagWrites.push([scope, key, value]); } };
const holder = new Actor("Actor.h", { attributes: { shield: { raised: true, itemId: "shield1" } }, itemTypes: { effect: [shards] } });
assert.equal(await holder.applyDamage({ damage: { instances: [{ type: "slashing" }] }, shieldBlockRequest: true, item: { uuid: "Item.w", type: "weapon", isRanged: false, actor: { uuid: "Actor.att" } } }), "applied 1");
assert.equal(flagWrites.length, 1, "marked before the caller's await resolves");
assert.deepEqual(followUps, ["Actor.h"], "the follow-ups ran first, awaited");
assert.equal(flagWrites[0][1], "shieldShards");
assert.ok(flagWrites[0][2].blockedAt > 0 && flagWrites[0][2].name === "Demon Bone Tiles");
await holder.applyDamage({ damage: { instances: [{ type: "fire" }] } });
assert.equal(flagWrites.length, 1, "no Shield Block: no mark");
// Duplicate Foe's copy (its Effect halves its Strikes): the halved damage reaches PF2e's applyDamage; its other damage doesn't.
game.actors = [new Actor("Actor.copy", { signature: "sig1", itemTypes: { effect: [{ flags: { [MODULE_ID]: { runtime: { halfStrikeDamage: true, strikesOnly: true } } } }] } })];
const damage = () => ({ instances: [{ type: "slashing" }], alter: multiplier => ({ instances: [{ type: "slashing" }], multiplier }) });
const victim = new Actor("Actor.v", { itemTypes: { effect: [] } });
assert.equal(await victim.applyDamage({ damage: damage(), rollOptions: new Set(["origin:signature:sig1", "action:strike"]) }), "applied 1");
assert.equal(victim.lastParams.damage.multiplier, 0.5);
await victim.applyDamage({ damage: damage(), rollOptions: new Set(["origin:signature:sig1"]) });
assert.equal(victim.lastParams.damage.multiplier, undefined);
assert.deepEqual(core().patches.damage.lastTypes("Actor.h"), ["fire"], "catalystSporesOnDamage's reader");
const message = { flags: { pf2e: { context: { type: "damage-taken" } } } };
assert.equal(core().patches.damage.sourceOf(message), null);
message.flags["pf2e-resolution-core"] = { damageSource: { uuid: "Item.w", actor: "Actor.att", type: "weapon", ranged: false } };
assert.equal(core().patches.damage.sourceOf(message).actor, "Actor.att", "catalystOnDamage's reader");

console.log("integration: all checks passed");
