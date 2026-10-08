// Class and archetype actions that change how a spell is cast or resolved (the spell features audit, batch G2, 2026-10-06), from PF2e's action texts:
//   - Spellstrike, Eldritch Shot, Spell-Woven Shot, Spellsling: "You Cast a Spell that takes 1 or 2 actions … Make a Strike … using your attack roll result
//     to determine the effects of both the Strike and the spell." A card on the cast marks it delivered: its spell attack is then read from the caster's
//     Strike (basic-save-runtime.js). Spellstrike also takes a save spell: "the target … rolls its saving throw normally … unless your Strike was a
//     critical failure, in which case your spell is disrupted."
//   - Intercession Spell: "Trigger Your hierophant Casts a Spell … They do not expend the spell slot, usage, or Focus Point."
//   - Dueling Counter: "Expend a prepared spell or spell slot. You then attempt to counteract the triggering spell with the expended spell."
//     (casting-rules-runtime.js counterOptions.)
//   - Absorb into the Aegis: "Trigger An enemy casts a spell that targets you or an ally within 15 feet of you … counteract check, using your Religion
//     modifier … On a success, the spell is counteracted and your shield takes damage equal to four times the spell rank … On a failure, … twice."
//   - Only You and I: the enemy "must attempt a Will save against your class DC whenever it tries to … Cast a Spell that doesn't include you as a
//     target. On a failure, the action … is disrupted."
//   - Ring Bell (Distracting Cacophony): "The trigger is a spell … Fortitude save against your class DC or become Stupefied 1 until the end of your next
//     turn (Stupefied 2 on a critical failure) … the discordant ring does lower the spell attack modifier or spell DC of the triggering spell."
import { counters, loseSpell } from "./casting-rules-runtime.js";
import { castTargetActors, refundSlot, timedConditions } from "./spellshape-runtime.js";
import { tokenDistance } from "./token-distance.js";
import { DEGREES, MODULE_ID, activeGM, allied, castRankOf, escapeHTML, gmIds, isCastMessage, ownerIds, degreeOf } from "./runtime-utils.js";

/** Whether a creature has an action (PF2e grants class actions as action items; some are feats). */
export const hasAbility = (actor, slug) => [...(actor?.itemTypes?.action ?? []), ...(actor?.itemTypes?.feat ?? [])].some(item => item.slug === slug);
const DELIVERY = { spellstrike: { name: "Spellstrike", saves: true }, "eldritch-shot": { name: "Eldritch Shot" }, "spell-woven-shot": { name: "Spell-Woven Shot" }, spellsling: { name: "Spellsling" } };

const card = (actor, whisperTo, data, html) => ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), whisper: whisperTo, flags: { [MODULE_ID]: { kind: "spell-action", spellAction: data } }, content: `<section class="pf2e-auto-runtime-card">${html}</section>` }).catch(() => null);

/** The cast's delivery by a Strike, when marked: { kind, name, saves } or null. */
export function strikeDeliveryFor(messageId) {
    return messageId ? game.messages.get(messageId)?.getFlag(MODULE_ID, "strikeDelivery") ?? null : null;
}

/** A spell cast: the caster's delivery offered; the allies', the targets' and the foes' actions offered or rolled. */
export async function spellActionsOnCast(message) {
    if (!activeGM() || !isCastMessage(message)) return [];
    const caster = message.actor, spell = message.item;
    if (!caster || !spell) return [];
    const done = [];
    const traits = spell.system?.traits?.value ?? [];
    const actions = Number(String(spell.system?.time?.value ?? "").replace(/[^0-9]/g, "")) || null;
    const attack = traits.includes("attack") || spell.system?.defense?.passive?.statistic === "ac";
    const save = Boolean(spell.system?.defense?.save?.statistic);
    // The caster's delivery: a card per action it has, when the spell fits ("1 or 2 actions … a spell attack roll [or a saving throw]").
    // (A creature's own: "Casts a Spell that takes 1 or 2 actions to cast and requires a spell attack roll. The effects of the spell don't occur
    // immediately but are imbued into an attack instead" — the graveknight's Channel Magic.)
    const channel = (caster.itemTypes?.action ?? []).find(item => /Casts? a Spell that takes 1 or 2 actions to cast and requires a spell attack (?:roll|modifier)\. The effects of the spell don't occur immediately but are imbued into an attack/.test(String(item.system?.description?.value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")));
    const deliveries = Object.entries(DELIVERY).filter(([slug]) => hasAbility(caster, slug));
    if (channel) deliveries.push([channel.slug ?? "channel-magic", { name: channel.name }]);
    if (actions && actions <= 2) for (const [slug, delivery] of deliveries) {
        if (!(attack || (delivery.saves && save))) continue;
        await card(caster, [...new Set([...gmIds(), ...ownerIds(caster)])], { rule: "deliver", kind: slug, castId: message.id },
            `<p><strong>${escapeHTML(delivery.name)}</strong>: ${escapeHTML(spell.name)} imbued into a Strike — ${attack ? "the Strike's result is the spell attack's" : "the target saves normally; a critically failed Strike disrupts the spell"}.</p><button type="button" data-pf2e-auto-spell-action="deliver">Deliver it with ${escapeHTML(delivery.name)}</button>`);
        done.push({ deliver: slug });
    }
    // Intercession Spell: an ally of the caster with the action (whether the caster is that ally's hierophant is the table's).
    if (!traits.includes("cantrip")) for (const token of canvas.scene?.tokens ?? []) {
        const ally = token.actor;
        if (!ally || ally === caster || !allied(ally, caster) || !hasAbility(ally, "intercession-spell")) continue;
        await card(ally, [...new Set([...gmIds(), ...ownerIds(ally)])], { rule: "intercession", castId: message.id, allyUuid: ally.uuid },
            `<p><strong>Intercession Spell</strong> (once per day): ${escapeHTML(caster.name)}, if your hierophant, doesn't expend ${escapeHTML(spell.name)}'s slot, usage or Focus Point.</p><button type="button" data-pf2e-auto-spell-action="intercession">Intercede</button>`);
        done.push({ intercession: ally.name });
    }
    const targets = castTargetActors(message, caster).filter(target => target !== caster);
    // (The combat turn it was cast on — PF2e's Arcane Cascade's "Cast a Spell and then enter Arcane Cascade on the same turn".)
    if (game.combat?.started) await message.setFlag(MODULE_ID, "castTurn", { combatId: game.combat.id, round: game.combat.round, turn: game.combat.turn }).catch(() => null);
    // (Slidecasting: a cast in a turn the caster also moved.)
    await slidecastNow(caster, "cast").catch(() => null);
    // (Who the cast targeted, kept on its message — Reverse Spellstrike's "you were targeted with a hostile spell".)
    if (targets.length) await message.setFlag(MODULE_ID, "castTargets", targets.map(target => target.uuid)).catch(() => null);
    for (const token of canvas.scene?.tokens ?? []) {
        const other = token.actor;
        if (!other || other === caster || allied(other, caster)) continue;
        // Absorb into the Aegis: the spell targets this creature or an ally within 15 feet of it.
        if (hasAbility(other, "absorb-into-the-aegis") && other.heldShield && targets.some(target => target === other || (allied(target, other) && target.getActiveTokens?.(true, true)?.[0] && tokenDistance(token, target.getActiveTokens(true, true)[0]) <= 15))) {
            await card(other, [...new Set([...gmIds(), ...ownerIds(other)])], { rule: "aegis", castId: message.id, actorUuid: other.uuid },
                `<p><strong>Absorb into the Aegis</strong> (reaction): ${escapeHTML(other.name)}'s shield against ${escapeHTML(caster.name)}'s ${escapeHTML(spell.name)} (rank ${castRankOf(message)}).</p><button type="button" data-pf2e-auto-spell-action="aegis">Counteract with Religion</button>`);
            done.push({ aegis: other.name });
        }
        // Ring Bell: the thaumaturge's bell within 30 feet of the caster, the spell affecting it or its allies (the Exploit Vulnerability target the table's).
        const casterToken = caster.getActiveTokens?.(true, true)?.[0];
        if (hasAbility(other, "ring-bell") && casterToken && tokenDistance(token, casterToken) <= 30) {
            await card(other, [...new Set([...gmIds(), ...ownerIds(other)])], { rule: "ring-bell", castId: message.id, actorUuid: other.uuid },
                `<p><strong>Ring Bell</strong> (reaction, Distracting Cacophony): if ${escapeHTML(caster.name)} is your Exploit Vulnerability target and ${escapeHTML(spell.name)} would affect you or an ally.</p><button type="button" data-pf2e-auto-spell-action="ring-bell">Ring the bell</button>`);
            done.push({ ringBell: other.name });
        }
    }
    // Only You and I: the caster under the Effect, casting a spell that doesn't include its exemplar as a target — the Will save, rolled now.
    for (const effect of caster.itemTypes?.effect ?? []) {
        if (effect.slug !== "effect-only-you-and-i") continue;
        const exemplar = await fromUuid(effect.system?.context?.origin?.actor ?? "").catch(() => null);
        if (!exemplar || targets.includes(exemplar)) continue;
        const dc = Number(exemplar.classDC?.value ?? exemplar.system?.attributes?.classDC?.value ?? NaN);
        if (!Number.isFinite(dc)) continue;
        const roll = await caster.saves?.will?.roll({ dc: { value: dc }, skipDialog: true, label: `Only You and I: ${spell.name} without ${exemplar.name} as a target` });
        const degree = DEGREES[Number(roll?.degreeOfSuccess ?? 2)];
        if (degree === "failure" || degree === "criticalFailure") await loseSpell(message, `disrupted (Only You and I: ${exemplar.name}'s Will save failed)`);
        done.push({ onlyYouAndI: degree });
    }
    return done;
}

const combatTurn = () => game.combat?.started ? { combatId: game.combat.id, round: game.combat.round, turn: game.combat.turn } : null;
const sameTurn = (a, b) => Boolean(a && b && a.combatId === b.combatId && a.round === b.round && a.turn === b.turn);

/**
 * Slidecasting: "Whenever you Step or Stride in the same turn you also Cast a Spell or Spellstrike, you gain a +1 status bonus to your Reflex saves against effects that target an
 * area for 2 rounds (3, 4 with weapon specialization)": the module's Effect, its bonus the text's status, once a turn, when the caster has cast and moved this combat turn.
 */
export async function slidecastNow(actor, cause) {
    const { readSpellstrikeFeature } = await import("../src/compiler/plus-feature-rules.js");
    const turn = combatTurn();
    if (!activeGM() || !actor || !turn) return null;
    const feature = (actor.itemTypes?.feat ?? []).map(item => readSpellstrikeFeature(item.toObject())).find(read => read?.kind === "slidecast");
    if (!feature) return null;
    if (cause === "move") await actor.setFlag(MODULE_ID, "movedTurn", turn);
    const moved = sameTurn(cause === "move" ? turn : actor.getFlag(MODULE_ID, "movedTurn"), turn);
    const cast = game.messages.contents.slice(-30).reverse().find(entry => entry.actor === actor && isCastMessage(entry));
    const casted = cause === "cast" || sameTurn(cast?.getFlag(MODULE_ID, "castTurn"), turn);
    if (!moved || !casted || sameTurn(actor.getFlag(MODULE_ID, "slidecastTurn"), turn)) return null;
    await actor.setFlag(MODULE_ID, "slidecastTurn", turn);
    const template = await fromUuid(feature.effect.uuid).catch(() => null);
    if (!template) return null;
    const source = template.toObject(); delete source._id;
    foundry.utils.setProperty(source, "_stats.compendiumSource", feature.effect.uuid);
    const options = new Set(actor.getRollOptions?.() ?? []);
    const rounds = options.has("feature:greater-weapon-specialization") ? feature.rounds[2] : options.has("feature:weapon-specialization") ? feature.rounds[1] : feature.rounds[0];
    source.system.duration = { ...(source.system.duration ?? {}), value: rounds, unit: "rounds" };
    // (The module's +1 is circumstance; the text's is status.)
    for (const rule of source.system.rules ?? []) if (rule.key === "FlatModifier" && [rule.selector].flat().includes("reflex") && Number(rule.value) === feature.bonus) rule.type = feature.bonusType;
    for (const old of actor.itemTypes.effect.filter(effect => effect.name.startsWith(feature.effect.name))) await old.delete();
    const [made] = await actor.createEmbeddedDocuments("Item", [source]);
    return { effect: made?.uuid ?? null, rounds };
}

/**
 * A creature reduced to 0 Hit Points by a spell, or by a Strike delivering one: the black blade's Invigorate offered to its magus ("Trigger You reduce a creature to 0 Hit Points
 * with a spell or Spellstrike").
 */
export async function invigorateOnDamage(message) {
    if (!activeGM() || message?.flags?.pf2e?.context?.type !== "damage-taken") return null;
    const target = message.actor, origin = message.flags?.pf2e?.origin;
    const killer = origin?.actor ? fromUuidSync(origin.actor) : null;
    if (!target || !killer || Number(target.hitPoints?.value ?? 1) > 0) return null;
    const { readSpellstrikeFeature } = await import("../src/compiler/plus-feature-rules.js");
    const reaction = [...(killer.itemTypes?.action ?? []), ...(killer.itemTypes?.feat ?? [])].map(item => readSpellstrikeFeature(item.toObject())).find(read => read?.kind === "kill-reaction");
    if (!reaction) return null;
    const bySpell = origin.type === "spell";
    const cast = bySpell ? null : game.messages.contents.slice(-30).reverse().find(entry => entry.actor === killer && isCastMessage(entry));
    const bySpellstrike = !bySpell && ["weapon", "melee"].includes(origin.type) && cast?.getFlag(MODULE_ID, "strikeDelivery")?.kind === "spellstrike";
    if (!bySpell && !bySpellstrike) return null;
    await card(killer, [...new Set([...gmIds(), ...ownerIds(killer)])], { rule: "invigorate", castId: message.id, actorUuid: killer.uuid, effect: reaction.effect },
        `<p><strong>${escapeHTML(reaction.name)}</strong> (the black blade's reaction, if ${escapeHTML(reaction.table[0].replace(/^You /, "you "))}): ${escapeHTML(target.name)} fell to ${bySpell ? "a spell" : "a Spellstrike"}.</p><button type="button" data-pf2e-auto-spell-action="invigorate">Invigorate</button>`);
    return { offered: killer.name, target: target.name };
}

/** A card's button. */
export async function runSpellAction(message, button) {
    const data = message.flags?.[MODULE_ID]?.spellAction;
    const cast = game.messages.get(data?.castId ?? "");
    if (!data || !cast) throw new Error("The spell's cast is gone.");
    if (message.getFlag(MODULE_ID, "spellActionUsed")) throw new Error("This has already been used.");
    await message.setFlag(MODULE_ID, "spellActionUsed", true);
    const spell = cast.item, caster = cast.actor, rank = castRankOf(cast);
    if (data.rule === "deliver") {
        const delivery = DELIVERY[data.kind] ?? { name: cast.actor?.items?.find(item => item.slug === data.kind)?.name ?? "Channel Magic" };
        const attack = (spell?.system?.traits?.value ?? []).includes("attack") || spell?.system?.defense?.passive?.statistic === "ac";
        await cast.setFlag(MODULE_ID, "strikeDelivery", { ...(cast.getFlag(MODULE_ID, "strikeDelivery") ?? {}), kind: data.kind, name: delivery.name, attack, at: Date.now() });
        return { delivered: delivery.name, attack };
    }
    if (data.rule === "intercession") return refundSlot(caster, spell, rank, "Intercession Spell");
    if (data.rule === "invigorate") {
        // ("apply both to your PC and your familiar": the magus and its familiar — the black blade.)
        const magus = await fromUuid(data.actorUuid ?? "").catch(() => null);
        const template = await fromUuid(data.effect?.uuid ?? "").catch(() => null);
        if (!magus || !template) throw new Error("The magus or the Effect is gone.");
        const familiar = game.actors.find(actor => actor.type === "familiar" && (actor.system?.master?.id === magus.id || actor.master === magus));
        const made = [];
        for (const holder of [magus, familiar].filter(Boolean)) {
            const source = template.toObject(); delete source._id;
            foundry.utils.setProperty(source, "_stats.compendiumSource", template.uuid);
            made.push(...await holder.createEmbeddedDocuments("Item", [source]));
        }
        return { invigorated: made.map(effect => effect.parent?.name) };
    }
    const actor = await fromUuid(data.actorUuid ?? "").catch(() => null);
    if (!actor) throw new Error("The creature is gone.");
    if (data.rule === "aegis") {
        // ("using your Religion modifier as your counteract modifier"; its counteract rank half its level, rounded up.)
        const dc = Number(spell?.spellcasting?.statistic?.dc?.value ?? caster?.attributes?.spellDC?.value ?? NaN);
        const modifier = Number(actor.skills?.religion?.mod ?? 0);
        const roll = await new Roll(`1d20 + ${modifier}`).evaluate();
        await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<strong>Absorb into the Aegis</strong>: counteract ${escapeHTML(spell?.name ?? "the spell")} (DC ${dc})` }).catch(() => null);
        const degree = degreeOf(roll.total, dc, roll.dice[0]?.results?.[0]?.result ?? null);
        const countered = degree >= 2 && counters(degree, Math.ceil(Number(actor.level ?? 1) / 2), rank);
        if (countered) await loseSpell(cast, `counteracted by ${actor.name}'s Absorb into the Aegis`);
        // (The shield takes the damage: its Hardness reduces it, as any damage to a shield.)
        const shield = actor.heldShield;
        const raw = (countered ? 4 : 2) * rank;
        const taken = Math.max(0, raw - Number(shield?.system?.hardness ?? 0));
        if (shield && taken) await shield.update({ "system.hp.value": Math.max(0, Number(shield.system.hp.value) - taken) });
        return { degree: DEGREES[degree], countered, shieldDamage: taken, total: roll.total, dc };
    }
    if (data.rule === "ring-bell") {
        const dc = Number(actor.classDC?.value ?? actor.system?.attributes?.classDC?.value ?? NaN);
        const roll = await caster.saves?.fortitude?.roll({ dc: { value: dc }, skipDialog: true, label: "Ring Bell: Distracting Cacophony" });
        const degree = DEGREES[Number(roll?.degreeOfSuccess ?? 2)];
        const value = degree === "criticalFailure" ? 2 : degree === "failure" ? 1 : 0;
        if (value) {
            // ("until the end of your next turn": the thaumaturge's.)
            const row = (await game.packs.get("pf2e.conditionitems").getIndex()).find(entry => entry.name === "Stupefied");
            await timedConditions(caster, [{ uuid: `Compendium.pf2e.conditionitems.Item.${row._id}`, slug: "stupefied", value, until: "caster-next-turn-end" }], "Ring Bell", { caster: actor });
        }
        return { degree, stupefied: value };
    }
    throw new Error(`Unknown action ${data.rule}.`);
}

/**
 * The caster's Strike after a delivered cast: Spellstrike with a save spell disrupted when it critically fails; a Magus+ variant's additions applied on its degree
 * ("Make a Spellstrike. It gains the following effects …") — once, on the first Strike after the cast.
 */
export async function deliveryOnStrike(message) {
    const context = message?.flags?.pf2e?.context;
    if (!activeGM() || context?.type !== "attack-roll") return null;
    const actor = message.actor;
    const cast = game.messages.contents.slice(-30).reverse().find(entry => entry.timestamp <= message.timestamp && isCastMessage(entry) && entry.actor === actor && entry.getFlag(MODULE_ID, "strikeDelivery"));
    const delivery = cast?.getFlag(MODULE_ID, "strikeDelivery");
    if (!delivery || cast.getFlag(MODULE_ID, "spellLost")) return null;
    const done = {};
    // (Dual-Weapon Spellstrike: "Your second Strike is made with a –3 penalty, or a –2 penalty if it has the agile trait" — on the caster for that next Strike.)
    if (delivery.dual && !delivery.dualFirst && actor === cast.actor) {
        await cast.setFlag(MODULE_ID, "strikeDelivery", { ...cast.getFlag(MODULE_ID, "strikeDelivery"), dualFirst: message.id });
        await actor.createEmbeddedDocuments("Item", [{ name: "Dual-Weapon Spellstrike: second Strike", type: "effect", img: "icons/svg/sword.svg",
            flags: { [MODULE_ID]: { spellshapeRider: { label: "Dual-Weapon Spellstrike" } } },
            system: { duration: { value: 0, unit: "rounds", expiry: "turn-end", sustained: false }, start: { value: game.time.worldTime, initiative: game.combat?.combatant?.initiative ?? null }, tokenIcon: { show: true },
                // (The agile weapon's smaller penalty as the difference, on agile Strikes: PF2e weighs a "not agile" predicate before it knows the weapon.)
                rules: [{ key: "FlatModifier", selector: "strike-attack-roll", value: -delivery.dual.penalty, label: "Dual-Weapon Spellstrike", slug: "dual-weapon-spellstrike", removeAfterRoll: "if-enabled" },
                    { key: "FlatModifier", selector: "strike-attack-roll", value: delivery.dual.penalty - delivery.dual.agilePenalty, label: "Dual-Weapon Spellstrike (agile)", slug: "dual-weapon-spellstrike-agile", predicate: ["item:trait:agile"] }] } }]);
        done.dualSecond = true;
    }
    if (delivery.variant && !delivery.variantDone) {
        await cast.setFlag(MODULE_ID, "strikeDelivery", { ...delivery, variantDone: message.id });
        done.variant = await applySpellstrikeVariant(delivery.variant, { caster: actor, cast, strike: message, degree: context.outcome });
    }
    // (Features that act on any Spellstrike of the caster's — Dealer of Death's card, Slide Slice's reminder —, once, on the first Strike after the cast; the eat-this toggle off.)
    if (actor === cast.actor && !delivery.featuresDone && delivery.kind === "spellstrike") {
        await cast.setFlag(MODULE_ID, "strikeDelivery", { ...cast.getFlag(MODULE_ID, "strikeDelivery"), featuresDone: message.id });
        done.features = await spellstrikeFeatures({ caster: actor, cast, strike: message, degree: context.outcome });
        if (delivery.rollOption) await actor.toggleRollOption("all", delivery.rollOption.option, delivery.rollOption.itemId, false).catch(() => null);
    }
    if (context.outcome === "criticalFailure" && !delivery.attack && delivery.kind === "spellstrike") {
        await loseSpell(cast, "disrupted (Spellstrike's Strike critically failed)");
        done.disrupted = cast.item?.name ?? null;
    }
    return Object.keys(done).length ? done : null;
}

/**
 * The Strike (or attack) that delivers a cast: by default the caster's latest Strike against the target after the cast; Scissored Assault's by the mystic duo; Big Shot's the caster's
 * next attack with the makeshift spellgun (or a spell attack roll); Dual-Weapon Spellstrike's the first successful of its two Strikes, else the first (null while only a failed
 * first Strike is made); after Residual Spellstrike, its Strike.
 */
export function deliveredStrikeMessage({ cast, delivery, caster, target, targetTokenUuid = null }, messages = game.messages?.contents ?? []) {
    const strikerUuid = delivery.strikerUuid ?? caster.uuid;
    const after = Math.max(Number(cast?.timestamp ?? 0), Number(delivery.residual?.at ?? 0));
    const attacks = messages.filter(message => {
        const context = message?.flags?.pf2e?.context;
        if (!context || Number(message.timestamp ?? 0) < after || (message.actor?.uuid ?? null) !== strikerUuid || message.id === cast?.id) return false;
        const strike = context.type === "attack-roll" && (context.domains ?? []).includes("strike-attack-roll");
        const spellgun = delivery.kind === "big-shot" && (context.type === "spell-attack-roll"
            || (context.type === "attack-roll" && (!delivery.spellgunId || String(message.flags?.pf2e?.origin?.uuid ?? "").endsWith(delivery.spellgunId) || (context.options ?? []).includes(`item:id:${delivery.spellgunId}`))));
        if (!(delivery.kind === "big-shot" ? spellgun : strike)) return false;
        const aimed = context.target ?? {};
        return aimed.actor === target.uuid || (targetTokenUuid && aimed.token === targetTokenUuid);
    }).sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    if (delivery.dual) {
        const two = attacks.slice(0, 2);
        return two.find(message => ["success", "criticalSuccess"].includes(message.flags.pf2e.context.outcome)) ?? (two.length === 2 ? two[0] : null);
    }
    if (delivery.residual || delivery.kind === "big-shot" || delivery.strikerUuid) return attacks[0] ?? null;
    return attacks.at(-1) ?? null;
}

/** A Magus+ Spellstrike variant's additions for its Strike's degree: on that degree's row, on a hit, and always. */
async function applySpellstrikeVariant(variant, { caster, cast, strike, degree }) {
    const { shapeEffect, riderChoice } = await import("./spellshape-runtime.js");
    const { forcedMove } = await import("./forced-movement.js");
    const targetUuid = strike.flags?.pf2e?.context?.target?.actor ?? null;
    const target = targetUuid ? await fromUuid(targetUuid).catch(() => null) : null;
    const tokenDoc = strike.flags?.pf2e?.context?.target?.token ? await fromUuid(strike.flags.pf2e.context.target.token).catch(() => null) : target?.getActiveTokens?.(true, true)?.[0]?.document ?? null;
    if (!target) return [{ label: `${variant.name}: the Strike had no target`, status: "skipped" }];
    const hit = degree === "success" || degree === "criticalSuccess";
    const riders = [...(variant.rows?.[degree] ?? []), ...(hit ? variant.hit ?? [] : []), ...(variant.always ?? [])];
    const options = new Set(caster.getRollOptions?.() ?? []);
    const specialization = options.has("feature:greater-weapon-specialization") ? "greater" : options.has("feature:weapon-specialization") ? "specialization" : "base";
    const dc = Number(cast.item?.spellcasting?.statistic?.dc?.value ?? caster.system?.attributes?.spellDC?.value ?? NaN);
    const results = [];
    const say = text => ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), content: `<p><strong>${escapeHTML(variant.name)}</strong>: ${text}</p>` }).catch(() => null);
    for (const rider of riders) {
        if (rider.type === "target-rules") {
            const made = await shapeEffect(target, caster, rider.label, rider.rules, { until: rider.until ?? null });
            results.push({ label: `${variant.name}: ${target.name} ${rider.rules.map(rule => `${rule.value} ${rule.selector}${rule.predicate ? ` (${rule.predicate.join(", ")})` : ""}`).join(", ")}`, status: "applied", effectUuid: made?.uuid ?? null });
        } else if (rider.type === "push") {
            const casterToken = caster.getActiveTokens?.(true, true)?.[0] ?? null;
            const point = casterToken ? { x: casterToken.x + Number(casterToken.w ?? casterToken.width * canvas.grid.size) / 2, y: casterToken.y + Number(casterToken.h ?? casterToken.height * canvas.grid.size) / 2 } : null;
            const moved = point && tokenDoc ? await forcedMove(tokenDoc, { point, direction: "away", feet: rider.feet, reason: variant.name }).catch(() => null) : null;
            results.push({ label: `${variant.name}: ${target.name} pushed ${moved?.moved ? moved.squares * 5 : 0} of ${rider.feet} feet`, status: moved?.moved ? "applied" : "skipped" });
        } else if (rider.type === "target-condition") {
            // (Dazzled, and "a –1 circumstance penalty to their attack rolls against you as long as they are dazzled": both on one Effect, gone together.)
            const row = (await game.packs.get("pf2e.conditionitems").getIndex()).find(entry => entry.name.toLowerCase() === rider.slug);
            const rules = [{ key: "GrantItem", uuid: `Compendium.pf2e.conditionitems.Item.${row._id}`, onDeleteActions: { grantee: "cascade" } },
                ...(rider.againstCaster ? [{ key: "FlatModifier", selector: "attack-roll", type: "circumstance", value: rider.againstCaster, predicate: [`target:signature:${caster.signature}`] }] : [])];
            const made = await shapeEffect(target, caster, `${variant.name}: ${rider.slug}`, rules, rider.until ? { until: rider.until } : { rounds: rider.rounds });
            results.push({ label: `${variant.name}: ${target.name} ${rider.slug}${rider.rounds ? ` for ${rider.rounds} rounds` : " until the end of the caster's next turn"}`, status: "applied", effectUuid: made?.uuid ?? null });
        } else if (rider.type === "check-weakness") {
            // ("an Arcana check … to identify weak points": against the standard DC of the creature's level, as Recall Knowledge on it.)
            const checkDC = levelBasedDC(Number(target.level ?? 0));
            const roll = await caster.skills?.[rider.skill]?.roll({ dc: { value: checkDC }, skipDialog: true, label: `${variant.name}: weak points` });
            const checkDegree = Number(roll?.degreeOfSuccess ?? -1);
            if (checkDegree < 2) { results.push({ label: `${variant.name}: the ${rider.skill} check failed`, status: "skipped" }); continue; }
            const value = rider.value[specialization] * (checkDegree === 3 ? rider.criticalMultiplier : 1);
            const types = ["acid", "bludgeoning", "cold", "electricity", "fire", "force", "mental", "piercing", "poison", "slashing", "sonic", "spirit", "vitality", "void"];
            const preset = variant.choice && types.includes(variant.choice) ? variant.choice : null;
            const type = preset ?? await riderChoice({ name: variant.name, choice: null }, "the weakness's damage type", types.map(entry => ({ value: entry, label: entry })));
            const made = await shapeEffect(target, caster, `${variant.name}: weakness ${value} to ${type}`, [{ key: "Weakness", type, value }], { until: rider.until ?? null });
            results.push({ label: `${variant.name}: ${target.name} weakness ${value} to ${type}`, status: "applied", effectUuid: made?.uuid ?? null, checkDC });
        } else if (rider.type === "cone-burst") {
            // (Cone of Figments: a cone from behind the target — its far side, away from the caster — and the creatures in it but the target; 1d4 per rank, basic save; the
            // spell's type (one asked among several), or with no damage one of the schools' types asked: force, the weapon's, mental, void or vitality.)
            const { startShapeCard } = await import("./spellshape-runtime.js");
            const casterToken = caster.getActiveTokens?.(true, true)?.[0] ?? null;
            if (!casterToken || !tokenDoc) { results.push({ label: `${variant.name}: no tokens for the cone`, status: "manual" }); continue; }
            const size = canvas.grid.size, perFoot = size / Number(canvas.dimensions?.distance ?? 5);
            const centre = token => ({ x: token.x + Number(token.width ?? 1) * size / 2, y: token.y + Number(token.height ?? 1) * size / 2 });
            const from = centre(casterToken), at = centre(tokenDoc);
            const angle = Math.atan2(at.y - from.y, at.x - from.x);
            const origin = { x: at.x + Math.cos(angle) * Number(tokenDoc.width ?? 1) * size / 2, y: at.y + Math.sin(angle) * Number(tokenDoc.height ?? 1) * size / 2 };
            const inCone = token => {
                const c = centre(token), dx = c.x - origin.x, dy = c.y - origin.y, dist = Math.hypot(dx, dy);
                if (dist > rider.feet * perFoot + size / 2) return false;
                const off = Math.abs(((Math.atan2(dy, dx) - angle + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
                return off <= Math.PI / 4 + 0.05;
            };
            const caught = (tokenDoc.parent?.tokens ?? []).filter(token => token.actor && !token.hidden && token.id !== tokenDoc.id && token.id !== casterToken.id && inCone(token));
            const spellTypes = [...new Set(Object.values(cast.item?.system?.damage ?? {}).filter(entry => !(entry.kinds ?? []).includes?.("healing")).map(entry => entry.type).filter(Boolean))];
            const weaponType = strike.item?.system?.damage?.damageType ?? null;
            const choices = spellTypes.length ? spellTypes : rider.noDamageTypes.map(type => type === "weapon" ? weaponType : type).filter(Boolean);
            const type = choices.length > 1 ? await riderChoice({ name: variant.name, choice: variant.choice ?? null }, "the cone's damage type", choices.map(entry => ({ value: entry, label: entry }))) ?? choices[0] : choices[0];
            const rank = Number(cast.flags?.pf2e?.casting?.castRank ?? cast.flags?.pf2e?.origin?.castRank ?? cast.item?.rank ?? 1);
            if (!caught.length) { results.push({ label: `${variant.name}: no creature in the cone`, status: "applied", caught: [] }); continue; }
            const card = await startShapeCard({ caster, name: variant.name, rank, statistic: rider.statistic, damage: { formula: `${rider.dice * rank}d${rider.faces}`, type }, traits: rider.traits,
                targets: caught.map(token => token.object ?? token), dc, entryId: cast.item?.spellcasting?.id ?? null }).catch(error => ({ error: error.message }));
            results.push({ label: `${variant.name}: ${rider.dice * rank}d${rider.faces} ${type} (basic ${rider.statistic}) to ${caught.map(token => token.name).join(", ")}${card?.error ? ` — ${card.error}` : ""}`, status: card?.error ? "failed" : "applied", caught: caught.map(token => token.name), type });
        } else if (rider.type === "banish-save") {
            const summoned = (target.system?.traits?.value ?? []).includes("summoned") || Boolean(target.flags?.[MODULE_ID]?.summoned);
            const roll = await target.saves?.[rider.statistic]?.roll({ dc: { value: dc }, skipDialog: true, label: `${variant.name}` });
            let saveDegree = Number(roll?.degreeOfSuccess ?? -1);
            // (Incapacitation, not a spell: a creature of a higher level than the effect — the caster's — gets one degree better; not a summoned creature.)
            if (rider.incapacitation && !(rider.exceptSummoned && summoned) && Number(target.level ?? 0) > Number(caster.level ?? 0) && saveDegree >= 0) saveDegree = Math.min(3, saveDegree + 1);
            const key = DEGREES[saveDegree] ?? "success";
            const row = rider.rows[key] ?? {};
            if (row.casterCondition) await caster.increaseCondition(row.casterCondition.slug, { value: row.casterCondition.value });
            if (row.banished) {
                // (A creature the module summoned: its summon ended; any other, sent to its home plane by the GM.)
                const summonEffect = summoned ? game.actors.contents.flatMap(actor => actor.itemTypes?.effect ?? []).find(effect => effect.flags?.[MODULE_ID]?.summon?.actorUuid === target.uuid) : null;
                if (summonEffect) await summonEffect.delete();
                else await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), whisper: gmIds(), content: `<p><strong>${escapeHTML(variant.name)}</strong>: ${escapeHTML(target.name)} is banished to its home plane${row.cannotReturn ? ` and can't return by any means for ${escapeHTML(row.cannotReturn)}` : ""} (send it away).</p>` }).catch(() => null);
            }
            await say(`${escapeHTML(target.name)}'s ${rider.statistic} save: ${key}${row.banished ? " — banished" : row.casterCondition ? ` — ${escapeHTML(caster.name)} is ${row.casterCondition.slug} ${row.casterCondition.value}` : " — resists"}. ${escapeHTML(rider.note)}`);
            results.push({ label: `${variant.name}: ${target.name} ${key}`, status: "applied", degree: key, banished: Boolean(row.banished) });
        }
    }
    await cast.setFlag(MODULE_ID, "spellstrikeVariantResults", results);
    return results;
}

/**
 * Dealer of Death: "If you make a Spellstrike with a card from your infused deck with a spell that deals damage, roll 1d6 on the table below. If the damage of the spell matches
 * the card drawn, you deal additional damage of the listed type equal to the level of the spell … or half your level if the spell was a cantrip." — the Strike's weapon a
 * deck or cards; the bonus on the caster for that Strike's damage. Slide Slice: its reminder on a critical hit.
 */
async function spellstrikeFeatures({ caster, cast, strike, degree }) {
    const { readSpellstrikeFeature } = await import("../src/compiler/plus-feature-rules.js");
    const { shapeEffect } = await import("./spellshape-runtime.js");
    const results = [];
    const spell = cast.item;
    const weaponName = String(strike.item?.name ?? strike.flags?.pf2e?.context?.options?.find(option => option.startsWith("item:slug:"))?.slice(10) ?? "");
    const types = Object.values(spell?.system?.damage ?? {}).map(entry => entry.type).filter(Boolean);
    for (const item of [...(caster.itemTypes?.feat ?? []), ...(caster.itemTypes?.action ?? [])]) {
        const read = readSpellstrikeFeature(item.toObject());
        if (read?.kind === "card-draw" && types.length && new RegExp(read.weapon, "i").test(weaponName)) {
            const roll = await new Roll("1d6").evaluate();
            const card = read.cards.find(entry => entry.roll === roll.total);
            const matches = card && types.includes(card.type);
            const amount = (spell?.system?.traits?.value ?? []).includes("cantrip") ? Math.floor(Number(caster.level ?? 1) / 2) : Number(cast.flags?.pf2e?.casting?.castRank ?? spell?.rank ?? 1);
            await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: caster }), flavor: `<strong>${escapeHTML(read.name)}</strong>: ${escapeHTML(card?.card ?? "?")} (${escapeHTML(card?.type ?? "?")})${matches ? ` — +${amount} ${card.type} damage` : " — no match"}` }).catch(() => null);
            if (matches && amount > 0) {
                const made = await shapeEffect(caster, caster, `${read.name}: ${card.card}`, [{ key: "FlatModifier", selector: "strike-damage", damageType: card.type, value: amount, removeAfterRoll: "if-enabled" }], { thisTurn: true });
                results.push({ label: `${read.name}: ${card.card} — +${amount} ${card.type}`, status: "applied", effectUuid: made?.uuid ?? null, card: card.card });
            } else results.push({ label: `${read.name}: ${card?.card ?? "?"} — no match`, status: "skipped", card: card?.card ?? null });
        }
        if (read?.kind === "crit-card" && degree === "criticalSuccess") {
            await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), whisper: [...new Set([...gmIds(), ...ownerIds(caster)])],
                content: `<p><strong>${escapeHTML(read.name)}</strong> (free action, if ${escapeHTML(read.table[0].replace(/^You /, "you "))}): ${escapeHTML(read.text)}</p>` }).catch(() => null);
            results.push({ label: `${read.name}: offered`, status: "note" });
        }
    }
    return results;
}

/** PF2e's DC by level (the standard table). */
function levelBasedDC(level) {
    const table = [14, 15, 16, 18, 19, 20, 22, 23, 24, 26, 27, 28, 30, 31, 32, 34, 35, 36, 38, 39, 40, 42, 44, 46, 48, 50];
    return level < 0 ? 13 : table[Math.min(25, level)];
}

/**
 * An action that changes the next spell, read from its text (Draw From the Pages: "The spell you cast must be one that takes one or two actions to cast,
 * and it's automatically heightened to a rank equal to half your level. Use mythic proficiency to determine any attack rolls or spell DCs."):
 * { requires, riders } for spellshape-runtime.js, or null.
 */
export function readActionShape(source) {
    const text = String(source?.system?.description?.value ?? "").replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    if (!/\b[Cc]ast a Spell\b|next action is to Cast a Spell/.test(text)) return null;
    const requires = {}, riders = [];
    if (/The spell you cast must be one that takes one or two actions to cast/.test(text)) requires.actions = [1, 2];
    if (/it's automatically heightened to a rank equal to half your level/.test(text)) riders.push({ type: "rank-change", to: "half-level" });
    if (/Use mythic proficiency to determine any attack rolls or spell DCs/.test(text)) riders.push({ type: "mythic-proficiency" });
    // (A lich's Metamagic Alteration: "change the area of the spell if the spell has an area and doesn't have a duration. If the spell is a burst with a
    // radius of at least 10 feet, increase the radius by 5 feet. If it is a line or a cone that has an area of 15 feet or smaller, add 10 feet" — the
    // range alternative isn't measured.)
    const area = /change the area of the spell if the spell has an area and doesn't have a duration\. If the spell is a burst with a radius of at least (\d+) feet, increase the radius by (\d+) feet\. If it is a line or a cone that has an area of (\d+) feet or smaller, add (\d+) feet to the area/.exec(text);
    // (River's Reflection: "If the next action you use is to Cast a Spell with the vitality or void traits, that spell's effects on living and undead
    // targets are reversed. All void damage becomes vitality damage and vice versa. Any ability to heal living creatures or undead creatures is similarly
    // swapped." — the damage swapped; the healing's swap the GM's.)
    if (/If the next action you use is to Cast a Spell with the vitality or void traits, that spell's effects on living and undead targets are reversed\. All void damage becomes vitality damage and vice versa\./.test(text)) {
        requires.anyTraits = ["vitality", "void"];
        riders.push({ type: "damage-type-swap", pair: ["vitality", "void"] }, { type: "note", wandRule: true, text: "The spell's healing of living and undead creatures is swapped as well." });
    }
    if (area) { requires.area = true; requires.noDuration = true; riders.push({ type: "area", grow: [{ types: ["burst"], min: Number(area[1]), add: Number(area[2]) }, { types: ["cone", "line"], max: Number(area[3]), add: Number(area[4]) }] }); }
    return riders.length ? { name: source.name, kind: "action", requires, riders } : null;
}

export function bindSpellActionButtons(message, html) {
    const root = html instanceof HTMLElement ? html : html?.[0];
    for (const button of root?.querySelectorAll?.("[data-pf2e-auto-spell-action]") ?? []) button.addEventListener("click", async () => {
        try { await runSpellAction(message, button); } catch (error) { ui.notifications.error(error.message); }
    });
}
