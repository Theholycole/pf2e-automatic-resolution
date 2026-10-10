// Hooks for self-spell Effects: a climbing rope's fall check (Inside Ropes: when a creature bearing the Effect critically fails a Climb
// check, the active GM's client rolls the stated flat check; a success prevents the fall), and an Effect ending when its bearer gains a
// condition (Eat Fire).
import { escapeHTML, MODULE_ID } from "./runtime-utils.js";
import { tokenDistance } from "./token-distance.js";
import { flatCheckPasses } from "../src/compiler/climb-aid.js";
import { regradeCheck } from "../src/compiler/check-bonus-reaction.js";
import { createNativeEffect, loadNativeEffectTemplate, prepareNativeEffectSource } from "./native-outcome-effects.js";

export async function climbAidOnCheck(message) {
    const context = message?.flags?.pf2e?.context;
    if (context?.type !== "skill-check" || context.outcome !== "criticalFailure" || !(context.options ?? []).includes("action:climb")) return null;
    if (!game.user?.isGM || game.users.activeGM?.id !== game.user.id) return null;
    const actor = game.actors.get(context.actor ?? message.speaker?.actor) ?? (message.speaker?.token ? canvas.scene?.tokens.get(message.speaker.token)?.actor : null);
    const effect = (actor?.itemTypes?.effect ?? []).find(entry => entry.flags?.[MODULE_ID]?.climbAid);
    if (!effect) return null;
    const dc = Number(effect.flags[MODULE_ID].climbAid.fallCheckDC);
    const roll = await new Roll("1d20").evaluate();
    const held = flatCheckPasses(roll.total, dc);
    try { await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flags: { [MODULE_ID]: { kind: "climb-aid-fall", checkMessageId: message.id } },
        flavor: `<strong>${escapeHTML(effect.name)}</strong>: DC ${dc} flat check to prevent the fall — ${held ? "<strong>success</strong>: the fall is prevented." : "<strong>failure</strong>: the fall happens."}` }); } catch (_) {}
    return { actorUuid: actor.uuid, natural: roll.total, dc, held };
}

/** A spell Effect that ends when its bearer gains a condition (Eat Fire: "The spell ends if you fall Unconscious"). */
export async function cloudActionOnCondition(item) {
    if (item?.type !== "condition" || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return null;
    const actor = item.actor;
    const ending = (actor?.itemTypes?.effect ?? []).filter(effect => effect.flags?.[MODULE_ID]?.cloudAction?.endsOnCondition === item.slug);
    if (!ending.length) return null;
    await actor.deleteEmbeddedDocuments("Item", ending.map(effect => effect.id), { [MODULE_ID]: { reason: `condition:${item.slug}` } });
    try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p>${[...new Set(ending.map(effect => effect.flags[MODULE_ID].cloudAction.spell))].map(name => `<strong>${escapeHTML(name)}</strong>`).join(", ")} ends: ${escapeHTML(actor.name)} is ${escapeHTML(item.name)}.</p>` }); } catch (_) {}
    return { ended: ending.length };
}

/** Whether the turn an Effect was bound to is over: in combat, the combat's turn or round moved on (or the combat ended); outside, time passed. */
export function turnBoundEnded(bound, combat = game.combat, worldTime = game.time.worldTime) {
    if (!bound) return false;
    // "until the start of your next turn" for an Effect on another creature: over when that creature's next turn (not the cast's) begins.
    if (bound.untilStartOf) return !combat || combat.id !== bound.combatId || (combat.combatant?.actor?.uuid === bound.untilStartOf && (combat.round !== bound.startedAt?.round || combat.turn !== bound.startedAt?.turn));
    // "until the end of its next turn": over once that creature's turn (a later one than the cast's) has been and gone.
    if (bound.actorUuid) return !combat || combat.id !== bound.combatId || (bound.seen && combat.combatant?.actor?.uuid !== bound.actorUuid);
    if (bound.combatId) return !combat || combat.id !== bound.combatId || combat.round !== bound.round || combat.turn !== bound.turn;
    return Number(worldTime) > Number(bound.worldTime);
}

/** The module's Effects bound to a turn ("until the end of the current turn"): deleted once that turn is over (the active GM). */
export async function expireTurnBound() {
    if (!game.user?.isGM || game.users.activeGM?.id !== game.user.id) return [];
    const actors = new Set([...(canvas.scene?.tokens ?? [])].map(token => token.actor).filter(Boolean));
    for (const combatant of game.combat?.combatants ?? []) if (combatant.actor) actors.add(combatant.actor);
    const removed = [];
    for (const actor of actors) {
        // A creature's next turn has begun (not the turn the Effect started in): mark it seen.
        for (const effect of actor.itemTypes?.effect ?? []) {
            const bound = effect.flags?.[MODULE_ID]?.turnBound;
            if (bound?.actorUuid && !bound.seen && game.combat?.id === bound.combatId && game.combat.combatant?.actor?.uuid === bound.actorUuid
                && (game.combat.round !== bound.startedAt?.round || game.combat.turn !== bound.startedAt?.turn)) await effect.setFlag(MODULE_ID, "turnBound", { ...bound, seen: true });
        }
        const expired = (actor.itemTypes?.effect ?? []).filter(effect => turnBoundEnded(effect.flags?.[MODULE_ID]?.turnBound));
        if (!expired.length) continue;
        await actor.deleteEmbeddedDocuments("Item", expired.map(effect => effect.id), { [MODULE_ID]: { reason: "turn-ended" } });
        removed.push(...expired.map(effect => effect.uuid));
    }
    return removed;
}

/**
 * Whether a roll uses up an Effect whose text allows one use (`consumeOn`): the next attack roll or saving throw, a Strike with the chosen
 * weapon (a miss, or its damage), the next damage with that weapon, or a damage roll with the Effect's toggle on.
 */
export function rollConsumes(consume, { type, outcome, options, weaponId, substituted = false }) {
    const has = option => options.has(option);
    const weapon = !consume.weaponFlag || (weaponId && has(`item:id:${weaponId}`));
    switch (consume.on) {
        case "attack-roll": return ["attack-roll", "spell-attack-roll"].includes(type) && (!consume.option || has(consume.option));
        case "saving-throw": return type === "saving-throw" && (!consume.option || has(consume.option));
        case "skill-check": return type === "skill-check" && (!consume.option || has(consume.option)) && (!consume.options || consume.options.some(has));
        // Any check rolled with the Effect's toggle on (Time Sense).
        case "check-with-option": return ["attack-roll", "spell-attack-roll", "saving-throw", "skill-check", "perception-check", "initiative"].includes(type) && has(consume.option);
        case "perception": return type === "perception-check";
        case "strike": return weapon && ((type === "attack-roll" && ["failure", "criticalFailure"].includes(outcome)) || type === "damage-roll");
        case "weapon-damage": return weapon && type === "damage-roll";
        // (Organsight: only piercing or slashing damage uses it.)
        case "damage-roll": return type === "damage-roll" && (!consume.option || has(consume.option)) && (!consume.options || consume.options.some(has));
        // A roll substitution used (the check has no d20): PF2e keeps the Effect, so the module removes it.
        case "substituted-check": return ["saving-throw", "skill-check"].includes(type) && substituted;
        default: return false;
    }
}

/** The roller's module Effects used up by this roll are removed (the active GM). */
export async function consumeUsedEffects(message) {
    const context = message?.flags?.pf2e?.context;
    if (!context?.type || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return [];
    const actor = game.actors.get(context.actor ?? message.speaker?.actor) ?? (message.speaker?.token ? canvas.scene?.tokens.get(message.speaker.token)?.actor : null);
    const options = new Set(context.options ?? []);
    const used = (actor?.itemTypes?.effect ?? []).filter(effect => {
        const consume = effect.flags?.[MODULE_ID]?.runtime?.consumeOn;
        if (!consume) return false;
        const weaponId = consume.weaponFlag ? effect.flags?.system?.rulesSelections?.[consume.weaponFlag] ?? null : null;
        return rollConsumes(consume, { type: context.type, outcome: context.outcome, options, weaponId, substituted: (message.rolls?.[0]?.dice ?? []).length === 0 });
    });
    if (!used.length) return [];
    // (Prophet's Luck: the save's result against the prophecy — the caster's bonus to saves if it came true, the target's penalty if not — for the spell's time.)
    for (const effect of used.filter(effect => effect.flags[MODULE_ID].runtime.prophecy)) {
        const prophecy = effect.flags[MODULE_ID].runtime.prophecy, runtime = effect.flags[MODULE_ID].runtime;
        const succeeded = ["success", "criticalSuccess"].includes(context.outcome);
        if (!["success", "criticalSuccess", "failure", "criticalFailure"].includes(context.outcome)) continue;
        const correct = (prophecy.prediction === "success") === succeeded;
        const holder = correct ? await fromUuid(prophecy.casterUuid) : actor;
        if (!holder) continue;
        await holder.createEmbeddedDocuments("Item", [{ name: `${runtime.sourceItemName}: ${correct ? "fortune favors" : "fortune spurns"}`, type: "effect", img: "icons/svg/eye.svg",
            flags: { [MODULE_ID]: { prophecyAftermath: { castInstanceId: runtime.castInstanceId } } },
            system: { level: { value: Number(prophecy.castRank) }, duration: { value: prophecy.minutes, unit: "minutes", expiry: null, sustained: false },
                start: { value: game.time.worldTime, initiative: game.combat?.combatant?.initiative ?? null },
                description: { value: `<p>The prophecy of ${prophecy.prediction} ${correct ? "came true" : "failed"}: ${correct ? "+" : "−"}${prophecy.value} status to saving throws.</p>` },
                rules: [{ key: "FlatModifier", selector: "saving-throw", type: "status", value: correct ? prophecy.value : -prophecy.value, label: runtime.sourceItemName }] } }]);
    }
    // ("its next two attack rolls": a counted Effect loses one use per roll, and goes after the last.)
    const counted = used.filter(effect => Number(effect.flags[MODULE_ID].runtime.consumeOn.count) > 1);
    for (const effect of counted) {
        const left = Number(effect.flags[MODULE_ID].runtime.consumeOn.count) - 1;
        await effect.update({ [`flags.${MODULE_ID}.runtime.consumeOn.count`]: left, name: effect.name.replace(/\(\d+ attack rolls?\)/, `(${left} attack roll${left === 1 ? "" : "s"})`) });
    }
    // (Organsight: the Effect lasts its minute; the damage removes only the mark on the creature.)
    const disarmed = used.filter(effect => effect.flags[MODULE_ID].runtime.consumeOn.disarmMark);
    for (const effect of disarmed) {
        const slug = effect.flags[MODULE_ID].runtime.consumeOn.disarmMark;
        await effect.update({ "system.rules": (effect._source.system.rules ?? []).filter(rule => !(rule.key === "TokenMark" && rule.slug === slug)) });
    }
    if (counted.length + disarmed.length === used.length) return [...counted, ...disarmed].map(effect => effect.name);
    used.splice(0, used.length, ...used.filter(effect => !disarmed.includes(effect)));
    used.splice(0, used.length, ...used.filter(effect => !counted.includes(effect)));
    // PF2e may remove a used Effect itself after the roll (its own rule): wait for that, then remove only what's left.
    await new Promise(resolve => setTimeout(resolve, 750));
    const left = used.filter(effect => actor.items.has(effect.id)).map(effect => effect.id);
    if (left.length) await actor.deleteEmbeddedDocuments("Item", left, { [MODULE_ID]: { reason: "used" } }).catch(() => null);
    return used.map(effect => effect.name);
}

/**
 * After the generic route creates PF2e's Effect: a first-Strike toggle starts on (Gravity Weapon), and a shape from the named spell gets the
 * text's longer time (Untamed Form's Pest Form shapes, 10 minutes), on the Effect and the form it granted.
 */
export async function applyTextCorrections(effect, plan) {
    const toggle = plan.resolution?.autoToggle;
    if (toggle) await effect.actor.toggleRollOption(toggle.domain ?? "all", toggle.option, effect.id, true);
    const shape = plan.resolution?.shapeDuration;
    if (shape) {
        const selected = Object.values(effect.flags?.system?.rulesSelections ?? {}).find(value => typeof value === "string" && value.startsWith("Compendium."));
        const form = selected ? await fromUuid(selected) : null;
        if (form && new RegExp(`\\b${shape.spell.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(form.name)) {
            const duration = { value: shape.minutes, unit: "minutes", expiry: "turn-start", sustained: false };
            await effect.update({ "system.duration": duration });
            const granted = effect.actor.items.filter(item => item.flags?.pf2e?.grantedBy?.id === effect.id && item.type === "effect");
            for (const item of granted) await item.update({ "system.duration": duration });
            return { extended: shape.minutes };
        }
    }
    return null;
}

/** Whether a damage roll uses the first-Strike toggle: a weapon Strike (not unarmed) with the toggle on. */
export function toggleUsed(toggle, options) {
    return toggle.offAfter === "weapon-damage" && options.has(toggle.option) && options.has("item:type:weapon") && !options.has("item:category:unarmed");
}

/** The first weapon Strike's damage switches the toggle off until the next round (the active GM). */
export async function autoToggleOnDamage(message) {
    const context = message?.flags?.pf2e?.context;
    if (context?.type !== "damage-roll" || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return null;
    const actor = game.actors.get(context.actor ?? message.speaker?.actor) ?? (message.speaker?.token ? canvas.scene?.tokens.get(message.speaker.token)?.actor : null);
    const options = new Set(context.options ?? []);
    for (const effect of actor?.itemTypes?.effect ?? []) {
        const toggle = effect.flags?.[MODULE_ID]?.runtime?.autoToggle;
        if (!toggle || !toggleUsed(toggle, options)) continue;
        await actor.toggleRollOption(toggle.domain ?? "all", toggle.option, effect.id, false);
        await effect.setFlag(MODULE_ID, "toggleUsed", game.combat?.started ? { combatId: game.combat.id, round: game.combat.round } : { worldTime: game.time.worldTime });
        return { off: effect.name };
    }
    return null;
}

/** A new round (or a round's time passing outside combat): each used first-Strike toggle is on again (the active GM). */
export async function autoToggleNewRound() {
    if (!game.user?.isGM || game.users.activeGM?.id !== game.user.id) return [];
    const actors = new Set([...(canvas.scene?.tokens ?? [])].map(token => token.actor).filter(Boolean));
    const renewed = [];
    for (const actor of actors) for (const effect of actor.itemTypes?.effect ?? []) {
        const toggle = effect.flags?.[MODULE_ID]?.runtime?.autoToggle, used = effect.flags?.[MODULE_ID]?.toggleUsed;
        if (!toggle || !used) continue;
        const fresh = used.combatId ? !(game.combat?.id === used.combatId && game.combat.round === used.round) : game.time.worldTime >= Number(used.worldTime) + 6;
        if (!fresh) continue;
        await actor.toggleRollOption(toggle.domain ?? "all", toggle.option, effect.id, true);
        await effect.unsetFlag(MODULE_ID, "toggleUsed");
        renewed.push(effect.uuid);
    }
    return renewed;
}

/** Whether an actor still has persistent damage of a type (PF2e's persistent-damage conditions). */
export function hasPersistentOf(conditions, damageType) {
    return (conditions ?? []).some(condition => condition.slug === "persistent-damage" && condition.system?.persistent?.damageType === damageType);
}

/** A persistent-damage condition ended: each caster mark whose target has no more of that damage type ends (Savor the Sting; the active GM). */
export async function endMarksWithoutPersistent(item) {
    if (item?.type !== "condition" || item.slug !== "persistent-damage" || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return [];
    const target = item.actor;
    if (!target) return [];
    const tokens = new Set((target.getActiveTokens?.(true, true) ?? []).map(token => token.uuid));
    const ended = [];
    for (const actor of new Set([...(canvas.scene?.tokens ?? [])].map(token => token.actor).filter(Boolean))) {
        const marks = (actor.itemTypes?.effect ?? []).filter(effect => {
            const runtime = effect.flags?.[MODULE_ID]?.runtime;
            return runtime?.endsWithTargetPersistent && tokens.has(runtime.markedTokenUuid) && !hasPersistentOf(target.itemTypes?.condition, runtime.endsWithTargetPersistent);
        });
        if (!marks.length) continue;
        await actor.deleteEmbeddedDocuments("Item", marks.map(effect => effect.id), { [MODULE_ID]: { reason: "persistent-ended" } }).catch(() => null);
        ended.push(...marks.map(effect => effect.uuid));
    }
    return ended;
}

/** The token a creature must stay near (Song of the Soul's thrall): the nearest with the trait within the distance, or the cast refuses. */
export function nearTokenFor(near, actor, spellName) {
    const own = actor.getActiveTokens?.(true, false)?.[0];
    if (!own) throw new Error(`${spellName}: ${actor.name} needs a token on the scene.`);
    const candidates = canvas.tokens.placeables.filter(token => token.actor && token.actor !== actor && token.actor.traits?.has?.(near.trait))
        .map(token => ({ token, feet: tokenDistance(own, token) })).filter(entry => entry.feet <= near.feet).sort((left, right) => left.feet - right.feet);
    if (!candidates.length) throw new Error(`${spellName}: ${actor.name} must be within ${near.feet} feet of a ${near.trait}.`);
    return candidates[0].token.document.uuid;
}

/** The rule stays on only while its bearer is within the distance of the bound token (the active GM re-checks on token moves). */
export async function syncNearTokens() {
    if (!game.user?.isGM || game.users.activeGM?.id !== game.user.id) return [];
    const changed = [];
    for (const actor of new Set([...(canvas.scene?.tokens ?? [])].map(token => token.actor).filter(Boolean))) for (const effect of actor.itemTypes?.effect ?? []) {
        const near = effect.flags?.[MODULE_ID]?.runtime?.nearToken;
        if (!near?.tokenUuid) continue;
        const own = actor.getActiveTokens?.(true, false)?.[0], other = fromUuidSync(near.tokenUuid)?.object;
        const inside = Boolean(own && other && tokenDistance(own, other) <= near.feet);
        const rules = foundry.utils.deepClone(effect._source.system.rules);
        const rule = rules[near.ruleIndex];
        if (!rule) continue;
        const off = JSON.stringify(rule.predicate ?? []) === JSON.stringify(["pf2e-automatic-resolution:out-of-range"]);
        if (inside === !off) continue;
        if (inside) delete rule.predicate; else rule.predicate = ["pf2e-automatic-resolution:out-of-range"];
        await effect.update({ "system.rules": rules });
        changed.push({ effect: effect.uuid, inside });
    }
    return changed;
}

/** A caster Effect that lasts to the end of a movement: removed when its token moves (the active GM). */
export async function endAfterMovement(tokenDocument, changes) {
    if (!("x" in changes || "y" in changes) || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return [];
    const actor = tokenDocument.actor;
    const ending = (actor?.itemTypes?.effect ?? []).filter(effect => effect.flags?.[MODULE_ID]?.runtime?.endsAfterMovement);
    if (ending.length) await actor.deleteEmbeddedDocuments("Item", ending.map(effect => effect.id), { [MODULE_ID]: { reason: "movement-ended" } }).catch(() => null);
    return ending.map(effect => effect.name);
}

/** The first ranged attack locks the penalty to its weapon, spell or ability (Curse of Recoil's critical failure). */
export async function lockToFirstItem(message) {
    const context = message?.flags?.pf2e?.context;
    if (!["attack-roll", "spell-attack-roll"].includes(context?.type) || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return null;
    const actor = game.actors.get(context.actor ?? message.speaker?.actor) ?? (message.speaker?.token ? canvas.scene?.tokens.get(message.speaker.token)?.actor : null);
    const itemId = (context.options ?? []).find(option => /^item:id:/.test(option))?.slice(8);
    // (PF2e labels an Effect's modifier with its name, less "Spell Effect: " and a "(Degree)" suffix.)
    const applied = new Set((message.flags.pf2e.modifiers ?? []).filter(modifier => modifier.enabled !== false).map(modifier => modifier.label));
    for (const effect of actor?.itemTypes?.effect ?? []) {
        const lock = effect.flags?.[MODULE_ID]?.lockToFirstItem;
        if (!lock || !itemId || !(applied.has(effect.name) || applied.has(modifierLabel(effect.name)))) continue;
        const rules = foundry.utils.deepClone(effect._source.system.rules);
        if (!rules[lock.ruleIndex]) continue;
        rules[lock.ruleIndex].predicate = [`item:id:${itemId}`];
        await effect.update({ "system.rules": rules, [`flags.${MODULE_ID}.-=lockToFirstItem`]: null });
        return { locked: itemId };
    }
    return null;
}

/** The healing spell a bonus was added to is excluded from the bonus afterwards (Healer's Blessing: once per spell). */
export function healingSourceOf(options) {
    const set = new Set(options ?? []);
    if (!set.has("item:type:spell")) return null;
    return [...set].find(option => /^item:id:/.test(option))?.slice(8) ?? null;
}

export async function oncePerSourceOnHealing(message) {
    const applied = message?.flags?.pf2e?.appliedDamage, context = message?.flags?.pf2e?.context;
    if (!applied?.isHealing || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return null;
    const actor = await fromUuid(applied.uuid);
    const source = healingSourceOf(context?.options);
    if (!actor || !source) return null;
    for (const effect of actor.itemTypes?.effect ?? []) {
        const once = effect.flags?.[MODULE_ID]?.runtime?.oncePerSource;
        if (!once) continue;
        const rules = foundry.utils.deepClone(effect._source.system.rules);
        const rule = rules[once.ruleIndex];
        if (!rule) continue;
        const exclusion = { not: `item:id:${source}` };
        if ((rule.predicate ?? []).some(term => JSON.stringify(term) === JSON.stringify(exclusion))) continue;
        rule.predicate = [...(rule.predicate ?? []), exclusion];
        await effect.update({ "system.rules": rules });
        return { excluded: source };
    }
    return null;
}

/** A new cast of a spell counts afresh: its exclusion is lifted on every creature holding a once-per-spell Effect. */
export async function oncePerSourceOnCast(message) {
    const origin = message?.flags?.pf2e?.origin;
    if (origin?.type !== "spell" || message.flags?.pf2e?.context?.type || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return [];
    const itemId = String(origin.uuid ?? "").split(".").pop();
    const lifted = [];
    for (const actor of new Set([...(canvas.scene?.tokens ?? [])].map(token => token.actor).filter(Boolean))) for (const effect of actor.itemTypes?.effect ?? []) {
        const once = effect.flags?.[MODULE_ID]?.runtime?.oncePerSource;
        if (!once) continue;
        const rules = foundry.utils.deepClone(effect._source.system.rules);
        const rule = rules[once.ruleIndex];
        const kept = (rule?.predicate ?? []).filter(term => JSON.stringify(term) !== JSON.stringify({ not: `item:id:${itemId}` }));
        if (!rule || kept.length === (rule.predicate ?? []).length) continue;
        rule.predicate = kept;
        await effect.update({ "system.rules": rules });
        lifted.push(effect.uuid);
    }
    return lifted;
}

/** PF2e's label for an Effect's modifier: its name without "Spell Effect: " (or "Effect: ") and without a trailing parenthetical. */
export function modifierLabel(name) {
    return String(name ?? "").replace(/^(?:Spell )?Effect:\s*/, "").replace(/\s*\([^)]*\)\s*$/, "").trim();
}

/** A retroactive bonus (Nudge Fate): the bearer's failed roll that the bonus improves is re-graded, and the hex ends (the active GM). */
export async function retroBonusOnRoll(message) {
    const context = message?.flags?.pf2e?.context;
    if (!context?.type || !["failure", "criticalFailure"].includes(context.outcome) || !Number.isFinite(Number(context.dc?.value)) || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return null;
    const actor = game.actors.get(context.actor ?? message.speaker?.actor) ?? (message.speaker?.token ? canvas.scene?.tokens.get(message.speaker.token)?.actor : null);
    const effect = (actor?.itemTypes?.effect ?? []).find(entry => entry.flags?.[MODULE_ID]?.retroBonus?.rolls?.includes(context.type));
    if (!effect) return null;
    const data = effect.flags[MODULE_ID].retroBonus, roll = message.rolls?.[0];
    const natural = Number(roll?.dice?.[0]?.total ?? roll?.terms?.[0]?.total);
    const existing = (message.flags.pf2e.modifiers ?? []).filter(modifier => modifier.type === data.type && modifier.enabled !== false && modifier.modifier > 0).reduce((max, modifier) => Math.max(max, modifier.modifier), 0);
    const regraded = regradeCheck({ total: Number(roll?.total), dc: Number(context.dc.value), natural, existingOfType: existing }, data.value);
    const rank = { criticalFailure: 0, failure: 1, success: 2, criticalSuccess: 3 };
    if (rank[regraded.degree] <= rank[context.outcome]) return { unchanged: true };
    await effect.delete({ [MODULE_ID]: { reason: "used" } });
    const readable = { criticalFailure: "critical failure", failure: "failure", success: "success", criticalSuccess: "critical success" };
    try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p><strong>${escapeHTML(effect.name)}</strong>: ${escapeHTML(actor.name)}'s ${escapeHTML(String(context.type).replace(/-/g, " "))} ${roll.total} → <strong>${regraded.total}</strong> (+${regraded.added} ${escapeHTML(data.type)}) against DC ${context.dc.value}: ${readable[context.outcome]} → <strong>${readable[regraded.degree]}</strong>. The spell ends.</p><p class="pf2e-auto-gm-reminder"><strong>GM:</strong> apply the new result.</p>` }); } catch (_) {}
    return { from: context.outcome, to: regraded.degree, total: regraded.total };
}

/** The last damage each creature took (PF2e's damageTaken on the update), for reactions to it. */
const lastDamage = new Map();
export function recordDamage(actor, amount) {
    if (actor?.uuid && Number(amount) > 0) lastDamage.set(actor.uuid, { amount: Number(amount), at: Date.now() });
}
export function lastDamageOf(actor) {
    return lastDamage.get(actor?.uuid) ?? null;
}

/** Delayed damage (Delay Consequence): dealt when its Effect ends (the active GM). */
export async function delayedDamageOnEnd(item) {
    const data = item?.flags?.[MODULE_ID]?.delayedDamage;
    if (!data || !item.actor || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return null;
    const token = item.actor.getActiveTokens?.(true, true)?.[0] ?? undefined;
    await item.actor.applyDamage({ damage: data.amount, token, skipIWR: true });
    try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: item.actor }), content: `<p><strong>${escapeHTML(data.spell)}</strong> ends: ${escapeHTML(item.actor.name)} takes the delayed ${data.amount} damage.</p><p class="pf2e-auto-gm-reminder">The attack's other effects apply now.</p>` }); } catch (_) {}
    return { dealt: data.amount };
}

/** A reduction used by the damage it's for (Interposing Earth): the caster's next damage taken removes the Effect (the active GM). */
export async function consumeOnDamageTaken(message) {
    const applied = message?.flags?.pf2e?.appliedDamage;
    if (!applied || applied.isHealing || message.flags.pf2e.context?.type !== "damage-taken" || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return [];
    const actor = await fromUuid(applied.uuid);
    const used = (actor?.itemTypes?.effect ?? []).filter(effect => effect.flags?.[MODULE_ID]?.runtime?.consumeOn?.on === "damage-taken");
    if (!used.length) return [];
    await new Promise(resolve => setTimeout(resolve, 300));
    await actor.deleteEmbeddedDocuments("Item", used.filter(effect => actor.items.has(effect.id)).map(effect => effect.id), { [MODULE_ID]: { reason: "used" } }).catch(() => null);
    return used.map(effect => effect.name);
}

/** The next matching spell's Effects take a spellshape's duration (Extend Boost, Lingering Composition) or its Effect (Fortissimo Composition); a failure refunds its Focus Point. */
export async function spellshapeOnEffect(item) {
    if (item?.type !== "effect" || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return null;
    const originUuid = item.system?.context?.origin?.actor, spellUuid = item.system?.context?.origin?.item;
    const caster = originUuid ? fromUuidSync(originUuid) : null;
    const pending = caster?.getFlag?.(MODULE_ID, "spellshapePending");
    const spell = spellUuid ? fromUuidSync(spellUuid) : null;
    if (!pending || !spell) return null;
    const traits = spell.system?.traits?.value ?? [];
    const matches = pending.next.spells ? pending.next.spells.includes(spell.name) : traits.includes(pending.next.trait) && traits.includes("cantrip");
    if (!matches) return null;
    // That one casting: its Effects carry the module's cast id (or PF2e's origin item). A later casting's Effect gets nothing (the pending is gone
    // by then, or it's a different cast).
    const cast = item.flags?.[MODULE_ID]?.runtime?.castInstanceId ?? spellUuid;
    if (pending.appliedCast && pending.appliedCast !== cast) return null;
    if (pending.rounds) await item.update({ "system.duration": { value: pending.rounds, unit: "rounds", expiry: "turn-start", sustained: false } });
    // Fortissimo Composition: each recipient of the composition's Effect also gets PF2e's Effect with the check's bonus selected.
    if (pending.effect && item.actor && !item.actor.itemTypes.effect.some(effect => effect.flags?.[MODULE_ID]?.spellshapeEffect === pending.id)) {
        const template = await loadNativeEffectTemplate(pending.effect.uuid);
        if (!template) throw new Error(`${pending.spell}: PF2e's ${pending.effect.label} is unavailable.`);
        const source = prepareNativeEffectSource(template, { castRank: pending.castRank, sourceActorUuid: caster.uuid, sourceItemUuid: pending.sourceItemUuid ?? null, sourceItemName: pending.spell,
            resolutionKind: "spellshape-effect" });
        for (const rule of source.system?.rules ?? []) if (rule.key === "ChoiceSet" && rule.flag === pending.effect.flag) rule.selection = pending.effect.value;
        foundry.utils.setProperty(source, `flags.system.rulesSelections.${pending.effect.flag}`, pending.effect.value);
        foundry.utils.setProperty(source, `flags.${MODULE_ID}.spellshapeEffect`, pending.id);
        await createNativeEffect(item.actor, source);
    }
    if (!pending.applied) {
        await caster.setFlag(MODULE_ID, "spellshapePending", { ...pending, applied: spell.name, appliedCast: cast });
        if (pending.refund) {
            const focus = caster.system?.resources?.focus;
            if (focus && Number(focus.value) < Number(focus.max)) await caster.update({ "system.resources.focus.value": Number(focus.value) + 1 });
        }
        // The spellshape is for that one casting: cleared once its Effects have been made.
        // (Only this spellshape: a newer one set meanwhile stays.)
        // (The module applies a cast's Effects one recipient at a time, which can take several seconds: a minute is that casting's.)
        setTimeout(() => { if (caster.getFlag(MODULE_ID, "spellshapePending")?.id === pending.id) caster.unsetFlag(MODULE_ID, "spellshapePending").catch(() => null); }, 60000);
    }
    return { rounds: pending.rounds };
}

/** Share Lore's Effect ended: the Lore items it gave go with it (the active GM). */
export async function sharedLoreOnEnd(item) {
    const castId = item?.flags?.[MODULE_ID]?.sharedLoreCast;
    if (!castId || item.type !== "effect" || !item.actor || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return [];
    const lores = item.actor.itemTypes.lore.filter(lore => lore.flags?.[MODULE_ID]?.sharedLoreCast === castId).map(lore => lore.id);
    if (lores.length) await item.actor.deleteEmbeddedDocuments("Item", lores).catch(() => null);
    return lores;
}

/** Walls placed by a spell (House of Imaginary Walls, Hologram Cage, a terrain-less Wall of Shrubs): its Effect ended, so they go (the active GM). */
export async function sceneWallsOnEnd(item) {
    const cast = item?.flags?.[MODULE_ID]?.sceneWalls;
    if (!cast || item.type !== "effect" || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return null;
    const scene = game.scenes.get(cast.sceneId);
    if (scene) {
        const walls = scene.walls.filter(wall => wall.flags?.[MODULE_ID]?.sceneWallCast === cast.castId).map(wall => wall.id);
        if (walls.length) await scene.deleteEmbeddedDocuments("Wall", walls).catch(() => null);
        const lights = scene.lights.filter(light => light.flags?.[MODULE_ID]?.sceneWallCast === cast.castId).map(light => light.id);
        if (lights.length) await scene.deleteEmbeddedDocuments("AmbientLight", lights).catch(() => null);
    }
    if (cast.regionUuid) { const region = await fromUuid(cast.regionUuid).catch(() => null); if (region) await region.delete().catch(() => null); }
    return true;
}

/** Whether a token's centre is inside a region. */
export function regionHolds(region, token) {
    const size = token.parent?.grid?.size ?? 100;
    const point = { x: token.x + (token.width * size) / 2, y: token.y + (token.height * size) / 2, elevation: token.elevation ?? 0 };
    try { if (typeof region.testPoint === "function") return region.testPoint(point, point.elevation); } catch (_) {}
    try { if (typeof region.object?.testPoint === "function") return region.object.testPoint(point, point.elevation); } catch (_) {}
    return (region.shapes ?? []).some(shape => shape.type === "rectangle" && point.x >= shape.x && point.x <= shape.x + shape.width && point.y >= shape.y && point.y <= shape.y + shape.height);
}

/**
 * A cover square (Extradimensional Cover) and a token that moved or appeared: in the square it has the square's cover Effect, out of it not; a
 * creature not on the caster's side that stops in it is moved to a random free space next to the square (the active GM).
 */
export async function coverSquareSync(token, changes = {}, { push = true } = {}) {
    if (!token?.actor || !token.parent || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return null;
    const squares = token.parent.regions.filter(region => region.flags?.[MODULE_ID]?.coverSquare);
    if (!squares.length) return null;
    const actor = token.actor;
    for (const region of squares) {
        const data = region.flags[MODULE_ID].coverSquare;
        const inside = regionHolds(region, token);
        const caster = await fromUuid(data.casterUuid).catch(() => null);
        const own = actor === caster || caster?.isAllyOf?.(actor);
        if (inside && !own && push && data.pushesOthers && ("x" in changes || "y" in changes)) {
            const size = token.parent.grid.size;
            const box = (region.shapes ?? [])[0] ?? { x: token.x, y: token.y, width: size, height: size };
            const blocked = (x, y) => token.parent.tokens.some(other => other.id !== token.id && x < other.x + other.width * size && x + token.width * size > other.x && y < other.y + other.height * size && y + token.height * size > other.y);
            const spots = [];
            for (let x = box.x - token.width * size; x <= box.x + box.width; x += size) for (let y = box.y - token.height * size; y <= box.y + box.height; y += size) {
                const overlaps = x < box.x + box.width && x + token.width * size > box.x && y < box.y + box.height && y + token.height * size > box.y;
                if (!overlaps && !blocked(x, y)) spots.push({ x, y });
            }
            const spot = spots[Math.floor(Math.random() * spots.length)];
            if (spot) { await token.update(spot, { teleport: true, animate: false, [MODULE_ID]: { reason: "cover-square-push" } });
                await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ token }), content: `<p><strong>${escapeHTML(data.spell)}</strong>: ${escapeHTML(token.name)} can't end its movement in the cover and is pushed out.</p>`, flags: { [MODULE_ID]: { kind: "cover-square-push" } } }).catch(() => null); }
            continue;
        }
        const effects = actor.itemTypes.effect.filter(effect => effect.flags?.[MODULE_ID]?.coverFrom === data.castId);
        if (inside && !effects.length) await actor.createEmbeddedDocuments("Item", [{ name: `${data.spell}: ${data.degree} cover`, type: "effect", img: "icons/svg/shield.svg",
            flags: { [MODULE_ID]: { coverFrom: data.castId } }, system: { rules: data.rules, tokenIcon: { show: true }, duration: { value: -1, unit: "unlimited", expiry: null, sustained: false },
                description: { value: `<p>${escapeHTML(data.degree)} cover while in the square.</p>` } } }]);
        if (!inside && effects.length) await actor.deleteEmbeddedDocuments("Item", effects.map(effect => effect.id)).catch(() => null);
    }
    return true;
}

/** A cover square's Effect on the caster ended: the square and every occupant's cover go (the active GM). */
export async function coverSquareOnEnd(item) {
    const cast = item?.flags?.[MODULE_ID]?.coverSquareCast;
    if (!cast || item.type !== "effect" || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return null;
    const region = await fromUuid(cast.regionUuid).catch(() => null);
    for (const actor of [...game.actors, ...(region?.parent?.tokens ?? []).map(token => token.actor).filter(Boolean)]) {
        const ids = actor.itemTypes?.effect?.filter(effect => effect.flags?.[MODULE_ID]?.coverFrom === cast.castId).map(effect => effect.id) ?? [];
        if (ids.length) await actor.deleteEmbeddedDocuments("Item", ids).catch(() => null);
    }
    if (region) await region.delete().catch(() => null);
    return true;
}

/** Dim the Light's marker ended with the turn: the caster stops being Hidden (the active GM; the GM deletes the marker earlier to keep it). */
export async function hiddenTurnEnd(item, options) {
    if (!item?.flags?.[MODULE_ID]?.hiddenTurnEnd || item.type !== "effect" || !item.actor || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return null;
    // (Its turn over: the module's turn-end pass, or PF2e expiring its 6 seconds first on the same clock change — it's over either way. Deleted
    // before then, it's the GM keeping the caster Hidden.)
    const ended = options?.[MODULE_ID]?.reason === "turn-ended" || item.isExpired === true || turnBoundEnded(item.flags[MODULE_ID].turnBound);
    if (!ended) return null;
    if (item.actor.hasCondition?.("hidden")) await item.actor.decreaseCondition("hidden", { forceRemove: true });
    return true;
}

/** A conjured item's Effect ended: the item is removed (the active GM). */
export async function conjuredOnEnd(item) {
    const conjured = item?.flags?.[MODULE_ID]?.conjuredItem;
    if (!conjured || item.type !== "effect" || !item.actor || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return null;
    const ids = item.actor.items.filter(entry => entry.flags?.[MODULE_ID]?.conjuredFor?.castId === conjured.castId).map(entry => entry.id);
    if (ids.length) await item.actor.deleteEmbeddedDocuments("Item", ids).catch(() => null);
    return ids;
}

/** A summon's Effect on the caster ended: its summoned token and creature are removed (the active GM). */
export async function summonOnEnd(item) {
    const summon = item?.flags?.[MODULE_ID]?.summon;
    if (!summon || item.type !== "effect" || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return null;
    const token = await fromUuid(summon.tokenUuid).catch(() => null);
    if (token) await token.delete().catch(() => null);
    // (More summons of the same cast — Tree of Life and Death's second tree — go too.)
    for (const extra of summon.extra ?? []) {
        const other = await fromUuid(extra.tokenUuid).catch(() => null);
        if (other) await other.delete().catch(() => null);
        const otherActor = await fromUuid(extra.actorUuid).catch(() => null);
        if (otherActor?.flags?.[MODULE_ID]?.summoned?.castId === summon.castId) await otherActor.delete().catch(() => null);
    }
    // (Effects the summon put on others — Forceful Hand's cover and grabs — end with it.)
    const holders = new Set([...game.actors, ...game.scenes.contents.flatMap(scene => scene.tokens.contents.map(entry => entry.actor).filter(Boolean))]);
    for (const holder of holders) {
        const ids = (holder.itemTypes?.effect ?? []).filter(effect => effect.flags?.[MODULE_ID]?.summonLinked === summon.castId).map(effect => effect.id);
        if (ids.length) await holder.deleteEmbeddedDocuments("Item", ids).catch(() => null);
    }
    const actor = await fromUuid(summon.actorUuid).catch(() => null);
    if (actor?.flags?.[MODULE_ID]?.summoned?.castId === summon.castId) {
        for (const scene of game.scenes) { const ids = scene.tokens.filter(token => token.actorId === actor.id).map(token => token.id); if (ids.length) await scene.deleteEmbeddedDocuments("Token", ids).catch(() => null); }
        await actor.delete().catch(() => null);
    }
    return summon;
}

/**
 * A ward against attacks (Sanctuary): an attack roll on the warded creature rolls the attacker's save against the spell DC once per turn
 * (critical success ends the ward; failure wastes the attack and further attacks this turn; critical failure bars it for the duration); the
 * warded creature's own attack ends the ward (the active GM).
 */
export async function attackWardOnAttack(message) {
    const context = message?.flags?.pf2e?.context;
    if (!["attack-roll", "spell-attack-roll"].includes(context?.type) || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return null;
    const attacker = game.actors.get(context.actor ?? message.speaker?.actor) ?? (message.speaker?.token ? canvas.scene?.tokens.get(message.speaker.token)?.actor : null);
    const targetRef = context.target?.actor ?? null;
    const target = targetRef ? await fromUuid(targetRef) : null;
    // The warded creature attacks: its ward ends.
    const own = (attacker?.itemTypes?.effect ?? []).find(effect => effect.flags?.[MODULE_ID]?.attackWard);
    if (own && target && target !== attacker) {
        await own.delete({ [MODULE_ID]: { reason: "hostile-action" } });
        try { await ChatMessage.create({ content: `<p><strong>${escapeHTML(own.flags[MODULE_ID].attackWard.spell)}</strong> ends: ${escapeHTML(attacker.name)} used a hostile action.</p>` }); } catch (_) {}
        return { ended: "hostile-action" };
    }
    const ward = (target?.itemTypes?.effect ?? []).find(effect => effect.flags?.[MODULE_ID]?.attackWard);
    if (!ward || !attacker || attacker === target) return null;
    const data = ward.flags[MODULE_ID].attackWard;
    const combat = game.combat?.started ? game.combat : null;
    const turnKey = combat ? `${combat.id}:${combat.round}:${combat.turn}` : `t${Math.floor(game.time.worldTime / 6)}`;
    const say = async text => { try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: attacker }), content: `<p><strong>${escapeHTML(data.spell)}</strong>: ${text}</p>` }); } catch (_) {} };
    if (data.barred.includes(attacker.uuid)) { await say(`${escapeHTML(attacker.name)} can't attack ${escapeHTML(target.name)} for the rest of the spell: void this attack.`); return { barred: true }; }
    if (data.wasted[attacker.uuid] === turnKey) { await say(`${escapeHTML(attacker.name)} can't attack ${escapeHTML(target.name)} this turn: void this attack.`); return { wasted: true }; }
    if (data.passes[attacker.uuid] === turnKey) return { passed: true };
    const roll = await attacker.saves?.[data.save]?.roll({ dc: { value: data.dc }, skipDialog: true });
    const degree = ["criticalFailure", "failure", "success", "criticalSuccess"][roll?.degreeOfSuccess ?? roll?.options?.degreeOfSuccess];
    if (degree === "criticalSuccess") { await ward.delete({ [MODULE_ID]: { reason: "critical-success" } }); await say(`${escapeHTML(attacker.name)} critically succeeds: the spell ends.`); return { degree }; }
    const flags = foundry.utils.deepClone(data);
    if (degree === "success") flags.passes[attacker.uuid] = turnKey;
    else if (degree === "failure") { flags.wasted[attacker.uuid] = turnKey; await say(`${escapeHTML(attacker.name)} fails: the action is wasted (void this attack), and it can't attack ${escapeHTML(target.name)} again this turn.`); }
    else if (degree === "criticalFailure") { flags.barred.push(attacker.uuid); await say(`${escapeHTML(attacker.name)} critically fails: the action is wasted (void this attack), and it can't attack ${escapeHTML(target.name)} for the rest of the spell.`); }
    await ward.setFlag(MODULE_ID, "attackWard", flags);
    return { degree };
}

/**
 * Spellmaster's Ward: a spell damaged the rune-holder (PF2e's damage-taken message, its origin a spell). A rune's roll at a time is restored, until that
 * damage is gone or the runes are; the Effect shows the runes left, and goes (the spell with it) after the last.
 */
export async function runeWardOnDamage(message) {
    const applied = message?.flags?.pf2e?.appliedDamage;
    if (!applied || applied.isHealing || message.flags.pf2e.context?.type !== "damage-taken" || message.flags.pf2e.origin?.type !== "spell" || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return null;
    const actor = await fromUuid(applied.uuid);
    const effect = (actor?.itemTypes?.effect ?? []).find(entry => entry.flags?.[MODULE_ID]?.runtime?.runeWard?.runes > 0);
    if (!effect) return null;
    const ward = effect.flags[MODULE_ID].runtime.runeWard, name = effect.flags[MODULE_ID].runtime.sourceItemName;
    const lost = (applied.updates ?? []).filter(update => ["system.attributes.hp.value", "system.attributes.hp.temp"].includes(update.path)).reduce((sum, update) => sum + Number(update.value ?? 0), 0);
    if (!(lost > 0)) return null;
    let runes = Number(ward.runes), prevented = 0;
    const rolls = [];
    while (runes > 0 && prevented < lost) {
        const roll = await new Roll(ward.formula).evaluate();
        rolls.push(roll.total); prevented += Math.max(0, roll.total); runes -= 1;
    }
    const restored = Math.min(lost, prevented);
    const hp = actor.system.attributes.hp;
    await actor.update({ "system.attributes.hp.value": Math.min(Number(hp.max), Number(hp.value) + restored) });
    try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p><strong>${escapeHTML(name)}</strong>: ${rolls.length} rune${rolls.length === 1 ? "" : "s"} (${rolls.join(", ")}) prevent ${restored} of the spell's ${lost} damage; ${runes} left.</p>` }); } catch (_) {}
    if (runes > 0) await effect.update({ name: effect.name.replace(/\(\d+ runes?\)/, `(${runes} rune${runes === 1 ? "" : "s"})`), [`flags.${MODULE_ID}.runtime.runeWard.runes`]: runes });
    else await effect.delete({ [MODULE_ID]: { reason: "used" } });
    return { restored, runes, rolls };
}
