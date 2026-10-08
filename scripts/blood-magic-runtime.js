// Sorcerer blood magic (the spell features audit, batch F2, 2026-10-05). PF2e tags a sorcerer's blood magic spells ("blood-magic-spell") and links each
// bloodline's Effect in their description, but leaves applying it to the player. Here:
// - Casting a tagged spell posts the blood magic card: the bloodline's options, read from its text (src/compiler/blood-magic.js).
// - Each option's button applies it to the caster or the targeted creature:
//   - PF2e's Effect, with its pick preset;
//   - Concealed for 1 round;
//   - damage equal to the spell's rank;
//   - Hag's spite, a watching Effect.
// - Tenacious Blood Magic: a 1-round effect lasts 1 minute, once per minute.
// - Blood Sovereignty: a second, different effect for 2 × the rank in Hit Points.
// - Blood Rising (its card posted): the card again, the effects lasting until the caster's next turn; Blood Ascendancy allows a second.
import { readBloodMagic } from "../src/compiler/blood-magic.js";
import { loadNativeEffectTemplate, prepareNativeEffectSource, createNativeEffect } from "./native-outcome-effects.js";
import { startShapeCard, shapeDC } from "./spellshape-runtime.js";
import { MODULE_ID, activeGM, escapeHTML } from "./runtime-utils.js";

const CONCEALED = "Compendium.pf2e.conditionitems.Item.DmAIPqOBomZ7H95W";
const hasFeat = (actor, slug) => (actor.itemTypes?.feat ?? []).some(item => item.slug === slug);

/** The actor's chosen bloodlines: [{ slug, name, read }] — the primary (blood-magic:x) and, with Blood Sovereignty or Ascendancy, the second. */
export function actorBloodlines(actor) {
    const options = actor.getRollOptions?.(["all", "spellcasting"]) ?? [];
    let picked = ["blood-magic", "second-blood-magic"].map(prefix => options.find(option => option.startsWith(`${prefix}:`))?.slice(prefix.length + 1)).filter(Boolean);
    // (No toggle set — the toggle needs the Sorcerer class item: the bloodline features the actor has, each its own blood magic.)
    if (!picked.length) picked = (actor.itemTypes?.feat ?? []).flatMap(item => (item.system?.rules ?? []).filter(rule => rule.key === "RollOption" && rule.option === "blood-magic").flatMap(rule => (rule.suboptions ?? []).map(entry => entry.value)));
    const lines = [];
    for (const value of [...new Set(picked)]) {
        const feature = (actor.itemTypes?.feat ?? []).find(item => (item.system?.rules ?? []).some(rule => rule.key === "RollOption" && rule.option === "blood-magic" && (rule.suboptions ?? []).some(entry => entry.value === value)));
        const alteration = (feature?.system?.rules ?? []).find(rule => rule.key === "ItemAlteration" && rule.property === "description" && rule.itemType === "spell");
        const text = alteration?.value?.[0]?.text ? game.i18n.localize(alteration.value[0].text) : null;
        const read = text ? readBloodMagic(text, alteration.value?.[1]?.text ?? null) : null;
        if (read) lines.push({ slug: value, name: feature.name.replace(/^Bloodline: /, ""), read });
    }
    return lines;
}

/** A cast (or Blood Rising) by a sorcerer: the blood magic card. */
export async function bloodMagicOnCast(message) {
    if (!activeGM()) return null;
    const pf2e = message?.flags?.pf2e;
    const actor = message?.actor;
    if (!actor) return null;
    const rising = pf2e?.origin?.type === "feat" && /^blood-rising$/.test(fromUuidSync(pf2e.origin.uuid ?? "")?.slug ?? "");
    const isCast = pf2e?.context?.type === "spell-cast" || (!pf2e?.context?.type && pf2e?.origin?.type === "spell" && pf2e?.casting);
    if (!rising && !isCast) return null;
    if (isCast && message.getFlag(MODULE_ID, "bloodMagicPosted")) return null;
    const spell = isCast ? message.item : null;
    if (isCast && !(spell?.system?.traits?.otherTags ?? []).includes("blood-magic-spell")) return null;
    const lines = actorBloodlines(actor);
    if (!lines.length) return null;
    if (isCast) await message.setFlag(MODULE_ID, "bloodMagicPosted", true).catch(() => null);
    // (The rank: the cast's; for Blood Rising, the triggering spell's — the last spell cast by another creature — or 1.)
    const triggering = rising ? game.messages.contents.slice(-30).reverse().find(entry => entry.id !== message.id && entry.actor && entry.actor !== actor && (entry.flags?.pf2e?.context?.type === "spell-cast" || entry.flags?.pf2e?.casting)) : null;
    const rank = Number(isCast ? (pf2e?.origin?.castRank ?? pf2e?.casting?.castRank ?? spell?.rank ?? 1) : (triggering?.flags?.pf2e?.origin?.castRank ?? triggering?.item?.rank ?? 1));
    const twice = rising ? hasFeat(actor, "blood-ascendancy") : hasFeat(actor, "blood-sovereignty");
    const tenacious = hasFeat(actor, "tenacious-blood-magic");
    const buttons = lines.flatMap((line, lineIndex) => line.read.options.map(option =>
        `<button type="button" data-pf2e-auto-blood-magic="${lineIndex}:${option.key}">${escapeHTML(lines.length > 1 ? `${line.name} — ` : "")}${escapeHTML(option.label)}</button>`)).join("");
    const extras = [rising ? "Blood Rising: the target must be you or the creature whose spell triggered it; an effect with a duration lasts until the beginning of your next turn." : "",
        twice ? (rising ? "Blood Ascendancy: you can pick a second, different effect." : `Blood Sovereignty: you can pick a second, different effect by losing ${2 * rank} Hit Points.`) : "",
        tenacious ? "Tenacious Blood Magic (once per minute): tick it before picking a 1-round effect to make it last 1 minute." : ""].filter(Boolean);
    try {
        await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), flags: { [MODULE_ID]: { kind: "blood-magic", bloodMagic: { casterUuid: actor.uuid, rank, rising, twice, used: [],
                spellUuid: spell?.uuid ?? null, triggerActorUuid: triggering?.actor?.uuid ?? null, lines: lines.map(line => ({ slug: line.slug, name: line.name, options: line.read.options })) } } },
            content: `<section class="pf2e-auto-runtime-card"><p><strong>Blood magic</strong> (${escapeHTML(lines.map(line => line.name).join(", "))}, rank ${rank}): pick one; a target option needs the creature targeted.</p>`
                + `${extras.map(extra => `<p><em>${escapeHTML(extra)}</em></p>`).join("")}${tenacious ? `<p><label><input type="checkbox" data-pf2e-auto-blood-tenacious> Tenacious Blood Magic</label></p>` : ""}${buttons}</section>` });
    } catch (_) {}
    return { lines: lines.map(line => line.slug), rank };
}

/** A blood magic option picked: applied to the caster or the targeted creature. */
export async function runBloodMagic(message, choice, { target = null, tenacious = false } = {}) {
    const data = message.getFlag(MODULE_ID, "bloodMagic");
    const caster = await fromUuid(data?.casterUuid ?? "").catch(() => null);
    if (!data || !caster) throw new Error("This blood magic card is unavailable.");
    const [lineIndex, key] = String(choice).split(":");
    const line = data.lines[Number(lineIndex)];
    const option = line?.options?.find(entry => entry.key === key);
    if (!option) throw new Error("No such blood magic option.");
    if (data.used.length >= (data.twice ? 2 : 1)) throw new Error("This casting's blood magic has been used.");
    if (data.used.includes(choice)) throw new Error("Pick a different effect for the second.");
    const recipient = option.who === "self" ? caster : (target ?? [...game.user.targets][0])?.actor ?? null;
    if (!recipient) throw new Error("Target the creature first.");
    // (Blood Rising: "The target must be either you or the creature that triggered Blood Rising.")
    if (data.rising && option.who === "target" && data.triggerActorUuid && recipient.uuid !== data.triggerActorUuid && recipient !== caster) throw new Error("Blood Rising's target must be you or the creature whose spell triggered it.");
    const rank = Number(data.rank);
    // (Tenacious: once per minute, a 1-round effect for 1 minute.)
    let longer = false;
    if (tenacious && (option.effect || option.concealed)) {
        const last = Number(caster.getFlag(MODULE_ID, "tenaciousBloodMagicAt") ?? -Infinity);
        if (game.time.worldTime - last < 60) throw new Error("Tenacious Blood Magic was used within the last minute.");
        await caster.setFlag(MODULE_ID, "tenaciousBloodMagicAt", game.time.worldTime);
        longer = true;
    }
    // (Blood Sovereignty's second effect: its Hit Points.)
    if (data.used.length === 1 && !data.rising) await caster.update({ "system.attributes.hp.value": Math.max(0, Number(caster.hitPoints?.value ?? 0) - 2 * rank) });
    const duration = longer ? { value: 1, unit: "minutes", expiry: "turn-start", sustained: false } : null;
    let result;
    if (option.effect && !option.damage) {
        const template = await loadNativeEffectTemplate(option.effect);
        if (!template) throw new Error("PF2e's blood magic Effect is unavailable.");
        const source = prepareNativeEffectSource(template, { castInstanceId: message.id, castRank: rank, sourceActorUuid: caster.uuid, sourceItemUuid: data.spellUuid, sourceItemName: template.name,
            resolutionKind: "blood-magic", targetActorUuid: recipient.uuid });
        if (option.selection) {
            foundry.utils.setProperty(source, `flags.system.rulesSelections.${option.selection.flag}`, option.selection.value);
            for (const rule of source.system?.rules ?? []) if (rule.key === "ChoiceSet") rule.selection = option.selection.value;
        }
        // (Its level the spell's rank — "temporary Hit Points equal to the spell's rank"; its origin the caster — "you" or "a target".)
        foundry.utils.setProperty(source, "system.level.value", rank);
        foundry.utils.setProperty(source, "system.context.origin.actor", caster.uuid);
        if (duration) source.system.duration = duration;
        const made = await createNativeEffect(recipient, source);
        result = { effect: made?.uuid ?? null };
    } else if (option.concealed) {
        const [made] = await recipient.createEmbeddedDocuments("Item", [{ name: `Blood magic (${line.name}): Concealed`, type: "effect", img: "icons/svg/mystery-man.svg",
            flags: { [MODULE_ID]: { bloodMagicEffect: true } },
            system: { duration: duration ?? { value: 1, unit: "rounds", expiry: "turn-start", sustained: false }, start: { value: game.time.worldTime, initiative: game.combat?.combatant?.initiative ?? null },
                rules: [{ key: "GrantItem", uuid: CONCEALED, onDeleteActions: { grantee: "restrict" } }], tokenIcon: { show: true },
                description: { value: "<p>Concealed; this obvious concealment can't be used to Hide.</p>" } } }]);
        result = { effect: made?.uuid ?? null };
    } else if (option.damage) {
        const traits = recipient.traits ?? new Set(recipient.system?.traits?.value ?? []);
        const type = option.damage.type ?? (option.damage.flag ? foundry.utils.getProperty(caster.flags?.system ?? {}, option.damage.flag) : null)
            ?? ((traits.has?.("undead") ?? [...traits].includes("undead")) ? option.damage.undead : option.damage.alive);
        if (!type) throw new Error("The blood magic's damage type is unknown (the elemental bloodline's element).");
        const DamageRoll = CONFIG.Dice.rolls.find(roll => roll.name === "DamageRoll");
        const roll = await new DamageRoll(`${rank}[${type}]`).evaluate();
        await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: caster }), flavor: `<strong>Blood magic</strong> (${escapeHTML(line.name)}): ${escapeHTML(recipient.name)}` }).catch(() => null);
        await recipient.applyDamage({ damage: roll, token: recipient.getActiveTokens?.(true, true)?.[0], rollOptions: new Set(["blood-magic"]) });
        result = { damage: roll.total, type };
    } else if (option.spite) {
        const combat = game.combat?.started ? game.combat : null;
        const [made] = await caster.createEmbeddedDocuments("Item", [{ name: `Blood magic (${line.name}): spite`, type: "effect", img: "icons/svg/terror.svg",
            flags: { [MODULE_ID]: { bloodSpite: { ...option.spite, rank, dc: shapeDC(caster, data.spellUuid ? fromUuidSync(data.spellUuid) : null), casterUuid: caster.uuid, name: `Blood magic (${line.name})`,
                startedAt: combat ? { combatId: combat.id, round: combat.round, turn: combat.turn } : { worldTime: game.time.worldTime } } } },
            system: { duration: { value: 2, unit: "rounds", expiry: "turn-start", sustained: false }, start: { value: game.time.worldTime, initiative: combat?.combatant?.initiative ?? null }, rules: [], tokenIcon: { show: true },
                description: { value: `<p>The first creature that damages you before the end of your next turn takes ${option.spite.perRank * rank} ${option.spite.type} damage (basic ${option.spite.statistic} save). If none does, you gain ${rank} temporary Hit Points as your next turn begins.</p>` } } }]);
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), flags: { [MODULE_ID]: { kind: "blood-spite", spiteUuid: made.uuid } },
            content: `<section class="pf2e-auto-runtime-card"><p><strong>Blood magic</strong> (${escapeHTML(line.name)}): spite.</p><button type="button" data-pf2e-auto-blood-spite="${made.uuid}">A creature damaged you (target it)</button></section>` }); } catch (_) {}
        result = { spite: made?.uuid ?? null };
    }
    await message.setFlag(MODULE_ID, "bloodMagic", { ...data, used: [...data.used, choice] });
    return { option: option.label, recipient: recipient.name, longer, ...result };
}

/** Hag's spite set off: the creature that damaged the caster saves (basic) against the spite's damage; the spite is spent. */
export async function spiteStrikes(spiteUuid, token) {
    const spite = await fromUuid(spiteUuid).catch(() => null);
    const data = spite?.flags?.[MODULE_ID]?.bloodSpite;
    const caster = data ? await fromUuid(data.casterUuid).catch(() => null) : null;
    if (!data || !caster) throw new Error("The spite is spent.");
    if (!token?.actor) throw new Error("Target the creature that damaged you.");
    await spite.delete();
    return startShapeCard({ caster, name: data.name, rank: data.rank, statistic: data.statistic, damage: { formula: String(data.perRank * data.rank), type: data.type }, targets: [token.object ?? token], dc: data.dc });
}

/** As the caster's next turn begins: an unspent spite becomes temporary Hit Points equal to the rank, until its following turn. */
export async function spiteTurnStart(combat) {
    if (!activeGM() || !combat?.started) return [];
    const actor = combat.combatant?.actor;
    const done = [];
    for (const spite of (actor?.itemTypes?.effect ?? []).filter(effect => effect.flags?.[MODULE_ID]?.bloodSpite)) {
        const data = spite.flags[MODULE_ID].bloodSpite;
        if (data.startedAt?.combatId === combat.id && data.startedAt.round === combat.round && data.startedAt.turn === combat.turn) continue;
        await spite.delete();
        await actor.createEmbeddedDocuments("Item", [{ name: `${data.name}: spite consumed`, type: "effect", img: "icons/svg/regen.svg",
            system: { duration: { value: 1, unit: "rounds", expiry: "turn-start", sustained: false }, start: { value: game.time.worldTime, initiative: combat.combatant?.initiative ?? null },
                rules: [{ key: "TempHP", value: Number(data.rank) }], tokenIcon: { show: true } } }]);
        done.push({ tempHp: data.rank });
    }
    return done;
}

/** The cards' buttons. */
export function bindBloodMagicButtons(message, html) {
    const root = html instanceof HTMLElement ? html : html?.[0];
    for (const button of root?.querySelectorAll?.("[data-pf2e-auto-blood-magic]") ?? []) button.addEventListener("click", async () => {
        try { await runBloodMagic(message, button.dataset.pf2eAutoBloodMagic, { tenacious: !!root.querySelector("[data-pf2e-auto-blood-tenacious]")?.checked }); }
        catch (error) { ui.notifications.error(error.message); }
    });
    for (const button of root?.querySelectorAll?.("[data-pf2e-auto-blood-spite]") ?? []) button.addEventListener("click", async () => {
        try { await spiteStrikes(button.dataset.pf2eAutoBloodSpite, [...game.user.targets][0]?.document); } catch (error) { ui.notifications.error(error.message); }
    });
}
