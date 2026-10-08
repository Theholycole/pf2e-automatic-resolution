// Items that act when a spell is cast (the spell features audit, batch F6, 2026-10-05), from their text:
//   - Rune of Sin: "When you Cast a Spell from the arcane tradition, … resistance 10 to damage from divine spells until the start of your next turn."
//   - Book of Warding Prayers: "Trigger Your last action was to cast a prepared divine spell … You and all your allies in a 30-foot emanation gain
//     resistance 10 to spirit damage for 1 minute" (holy or unholy instead, when the spell had that trait) — PF2e's Effect, its choice preset.
//   - Reflecting Shield: "Trigger You're targeted by a spell Requirements The reflecting shield is raised … counteract rank of 9th and a counteract
//     modifier of +30. If the spell is successfully counteracted, it's turned back on its caster."
//   - Spell Duelist's Siphon: "Trigger You're targeted with an arcane spell attack and you have this grimoire raised … You attempt to counteract the
//     triggering spell. If you succeed, the spell is absorbed into the grimoire …"
// A counteracted spell is lost (casting-rules-runtime.js): its cards refuse to resolve.
import { counters, loseSpell } from "./casting-rules-runtime.js";
import { castTargetActors, tokensWithin } from "./spellshape-runtime.js";
import { loadNativeEffectTemplate, prepareNativeEffectSource, createNativeEffect } from "./native-outcome-effects.js";
import { MODULE_ID, activeGM, castRankOf, escapeHTML, gmIds, isCastMessage, ownerIds, degreeOf } from "./runtime-utils.js";

const traditionOf = message => message.flags?.pf2e?.casting?.tradition ?? message.item?.spellcasting?.tradition ?? null;
const held = (actor, slug) => [...(actor?.itemTypes?.equipment ?? []), ...(actor?.itemTypes?.shield ?? []), ...(actor?.itemTypes?.armor ?? [])].find(item => item.slug === slug && item.isInvested !== false) ?? null;
const WARDING_EFFECT = "Compendium.pf2e.equipment-effects.Item.GqXIV46JqB8x8eEN";

/** A spell cast: the caster's items that act on it, and the targets' reactions offered. */
export async function spellTriggerItemsOnCast(message) {
    if (!activeGM() || !isCastMessage(message)) return [];
    const caster = message.actor, spell = message.item;
    if (!caster || !spell) return [];
    const done = [];
    // Rune of Sin.
    const rune = held(caster, "rune-of-sin");
    if (rune && traditionOf(message) === "arcane") {
        const combat = game.combat?.started ? game.combat : null;
        const [made] = await caster.createEmbeddedDocuments("Item", [{ name: `${rune.name}: resistance 10 to divine spells`, type: "effect", img: rune.img ?? "icons/svg/shield.svg",
            flags: { [MODULE_ID]: { spellTriggerItem: { slug: "rune-of-sin" }, ...(combat ? { turnBound: { untilStartOf: caster.uuid, combatId: combat.id, startedAt: { round: combat.round, turn: combat.turn } } } : {}) } },
            system: { duration: { value: 1, unit: "rounds", expiry: "turn-start", sustained: false }, start: { value: game.time.worldTime, initiative: combat?.combatant?.initiative ?? null }, tokenIcon: { show: true },
                rules: [{ key: "Resistance", type: "custom", definition: ["item:type:spell", "item:trait:divine"], label: "Divine spells", value: 10 }] } }]);
        done.push({ rune: made?.uuid ?? null });
    }
    // Book of Warding Prayers: a prepared divine spell (the deity's grant is the table's).
    const book = held(caster, "book-of-warding-prayers");
    const entry = spell.spellcasting;
    if (book && traditionOf(message) === "divine" && entry?.isPrepared) {
        const traits = spell.system?.traits?.value ?? [];
        const choices = ["spirit", ...["holy", "unholy"].filter(trait => traits.includes(trait))];
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), whisper: [...new Set([...gmIds(), ...ownerIds(caster)])],
            flags: { [MODULE_ID]: { kind: "spell-trigger-item", triggerItem: { rule: "warding", casterUuid: caster.uuid, castId: message.id } } },
            content: `<section class="pf2e-auto-runtime-card"><p><strong>${escapeHTML(book.name)}</strong> (free action, once per day): you and your allies within 30 feet gain resistance 10 for 1 minute.</p>${choices.map(choice =>
                `<button type="button" data-pf2e-auto-trigger-item="warding" data-choice="${choice}">Resistance 10 to ${choice}</button>`).join("")}</section>` }); } catch (_) {}
        done.push({ warding: choices });
    }
    // The targets' reactions: Reflecting Shield (raised), Spell Duelist's Siphon (an arcane spell attack, Raise a Tome).
    const attack = (spell.system?.traits?.value ?? []).includes("attack") || spell.system?.defense?.passive?.statistic === "ac";
    for (const target of castTargetActors(message, caster)) {
        if (target === caster) continue;
        const shield = held(target, "reflecting-shield");
        if (shield && target.attributes?.shield?.raised && target.attributes.shield.itemId === shield.id) {
            await offerCounter(target, message, { rule: "reflect", name: shield.name, rank: 9, modifier: 30, label: "Reflect the spell (counteract rank 9, +30)" });
            done.push({ reflect: target.name });
        }
        const siphon = held(target, "spell-duelists-siphon");
        if (siphon && attack && traditionOf(message) === "arcane" && (target.itemTypes?.feat ?? []).some(feat => feat.slug === "raise-a-tome")) {
            const modifier = Math.max(...(target.spellcasting?.contents ?? []).map(entry => Number(entry.statistic?.check?.mod ?? -Infinity)), Number(target.attributes?.classDC?.value ?? 10) - 10);
            await offerCounter(target, message, { rule: "siphon", name: siphon.name, rank: Math.ceil(Number(target.level ?? 1) / 2), modifier, label: `Absorb the spell (counteract rank ${Math.ceil(Number(target.level ?? 1) / 2)}, +${modifier}) — the grimoire raised` });
            done.push({ siphon: target.name });
        }
    }
    return done;
}

async function offerCounter(target, message, data) {
    try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: target }), whisper: [...new Set([...gmIds(), ...ownerIds(target)])],
        flags: { [MODULE_ID]: { kind: "spell-trigger-item", triggerItem: { ...data, targetUuid: target.uuid, castId: message.id } } },
        content: `<section class="pf2e-auto-runtime-card"><p><strong>${escapeHTML(data.name)}</strong> (reaction): ${escapeHTML(target.name)} is targeted by ${escapeHTML(message.actor?.name ?? "a caster")}'s ${escapeHTML(message.item?.name ?? "spell")} (rank ${castRankOf(message)}).</p><button type="button" data-pf2e-auto-trigger-item="${data.rule}">${escapeHTML(data.label)}</button></section>` }); } catch (_) {}
}

/** A card's button: the warding Effect on the caster and allies within 30 feet, or the counteract. */
export async function runTriggerItem(message, button) {
    const data = message.flags?.[MODULE_ID]?.triggerItem;
    if (!data) throw new Error("This card has no item.");
    const cast = game.messages.get(data.castId);
    if (data.rule === "warding") {
        const caster = await fromUuid(data.casterUuid).catch(() => null);
        const choice = button?.dataset?.choice ?? "spirit";
        const template = await loadNativeEffectTemplate(WARDING_EFFECT);
        if (!caster || !template) throw new Error("The book's Effect is unavailable.");
        const token = caster.getActiveTokens?.(true, true)?.[0] ?? null;
        const recipients = [caster, ...(token ? tokensWithin(token, 30).map(other => other.actor).filter(other => other && other.alliance && other.alliance === caster.alliance) : [])];
        const given = [];
        for (const recipient of [...new Set(recipients)]) {
            const source = prepareNativeEffectSource(template, { castInstanceId: data.castId, castRank: 1, sourceActorUuid: caster.uuid, sourceItemUuid: null, sourceItemName: template.name, resolutionKind: "save", targetActorUuid: recipient.uuid });
            for (const rule of source.system?.rules ?? []) if (rule.key === "ChoiceSet") rule.selection = choice;
            foundry.utils.setProperty(source, "flags.system.rulesSelections.resistance", choice);
            await createNativeEffect(recipient, source);
            given.push(recipient.name);
        }
        return { choice, given };
    }
    const target = await fromUuid(data.targetUuid).catch(() => null);
    if (!cast || !target) throw new Error("The spell or its target is gone.");
    if (message.getFlag(MODULE_ID, "triggerUsed")) throw new Error(`${data.name} has already been used for this spell.`);
    await message.setFlag(MODULE_ID, "triggerUsed", true);
    const dc = Number(cast.item?.spellcasting?.statistic?.dc?.value ?? cast.actor?.attributes?.spellDC?.value ?? NaN);
    if (!Number.isFinite(dc)) throw new Error(`${cast.item?.name ?? "The spell"} has no DC to counteract.`);
    const roll = await new Roll(`1d20 + ${data.modifier}`).evaluate();
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: target }), flavor: `<strong>${escapeHTML(data.name)}</strong>: counteract ${escapeHTML(cast.item?.name ?? "the spell")} (DC ${dc})` }).catch(() => null);
    const degree = degreeOf(roll.total, dc, roll.dice[0]?.results?.[0]?.result ?? null);
    const countered = counters(degree, data.rank, castRankOf(cast));
    if (countered) {
        await loseSpell(cast, data.rule === "reflect" ? `reflected by ${target.name}'s ${data.name}` : `absorbed by ${target.name}'s ${data.name}`);
        if (data.rule === "reflect") try { await ChatMessage.create({ whisper: gmIds(), content: `<p class="pf2e-auto-gm-reminder"><strong>${escapeHTML(data.name)}</strong> (GM): ${escapeHTML(cast.item?.name ?? "the spell")} is turned back on ${escapeHTML(cast.actor?.name ?? "its caster")} — resolve it with the caster as its target.</p>` }); } catch (_) {}
        else await target.createEmbeddedDocuments("Item", [{ name: `${data.name}: holds ${cast.item?.name ?? "a spell"} (rank ${castRankOf(cast)})`, type: "effect", img: "icons/svg/book.svg",
            flags: { [MODULE_ID]: { siphonHolds: { spell: cast.item?.toObject?.() ?? null, rank: castRankOf(cast) } } },
            system: { duration: { value: -1, unit: "unlimited", expiry: null, sustained: false }, start: { value: game.time.worldTime, initiative: null }, tokenIcon: { show: true },
                description: { value: `<p>The grimoire holds ${escapeHTML(cast.item?.name ?? "a spell")} (rank ${castRankOf(cast)}). Spend a spell slot of that rank or higher to cast it instead, heightened to the slot's rank; then it's expended from the grimoire.</p>` } } }]);
    }
    return { degree: ["criticalFailure", "failure", "success", "criticalSuccess"][degree], countered, total: roll.total, dc };
}

export function bindTriggerItemButtons(message, html) {
    const root = html instanceof HTMLElement ? html : html?.[0];
    for (const button of root?.querySelectorAll?.("[data-pf2e-auto-trigger-item]") ?? []) button.addEventListener("click", async () => {
        try { await runTriggerItem(message, button); } catch (error) { ui.notifications.error(error.message); }
    });
}
