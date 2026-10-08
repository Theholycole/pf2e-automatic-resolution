// Casting rules the module carries out (the spell features audit, batch F3, 2026-10-05):
// - Stupefied: "If you Cast a Spell while stupefied, the spell is disrupted unless you succeed at a flat check (DC 5 + the stupefied value)" — rolled as the
//   spell is cast; a failure loses the spell.
// - Steady Spellcasting: "If a reaction would disrupt your spellcasting action, attempt a DC 15 flat check" — a button on the cast; a failure loses it.
// - Counterspell (Prepared, Spontaneous), Master's Counterspell and Mythic Counterspell: a foe's cast offers each eligible caster on the scene the counter.
//   It expends the slot and rolls the counteract check against the foe's spell DC; a counter loses the foe's spell.
// - Communal Healing: Heal cast on a single creature (1 or 2 actions) heals another creature for the spell's rank.
// A lost spell's cast message carries `spellLost`; the module's resolutions refuse it (`assertSpellNotLost`).
// Conditions on casting (the spell features audit, batch G1, 2026-10-06), from PF2e's condition texts:
// - Restrained: "you can't use any attack or manipulate actions" — a manipulate spell is lost.
// - Grabbed: "If you attempt a manipulate action while grabbed, you must succeed at a DC 5 flat check or it is lost."
// - Deafened: "If you perform an action that has the auditory trait, you must succeed at a DC 5 flat check or the action is lost."
// - Fascinated ("can't use concentrate actions unless … related to the subject of your fascination, as determined by the GM") and Confused: the GM told.
// - A concealed or hidden target: "must succeed at a DC 5 [DC 11] flat check when targeting you with an attack, spell, or other effect" — rolled for each
//   targeted creature; one that's missed is left out of the spell's cards (`targetMisses`, `dropMissedTargets`).
import { refundSlot, timedConditions, highestCastableRank, readCasterWicketTraits } from "./spellshape-runtime.js";
import { readCastReaction } from "../src/compiler/plus-feature-rules.js";
import { loadNativeEffectTemplate, prepareNativeEffectSource, createNativeEffect } from "./native-outcome-effects.js";
import { tokenDistance } from "./token-distance.js";
import { MODULE_ID, activeGM, castRankOf, escapeHTML, gmIds, isCastMessage } from "./runtime-utils.js";
const hasFeat = (actor, slug) => (actor?.itemTypes?.feat ?? []).some(item => item.slug === slug);
const hasAbility = (actor, slug) => [...(actor?.itemTypes?.action ?? []), ...(actor?.itemTypes?.feat ?? [])].some(item => item.slug === slug);

/** A cast message's spell lost (disrupted, countered): the reason. */
export async function loseSpell(message, reason) {
    await message.setFlag(MODULE_ID, "spellLost", { reason, at: game.time.worldTime });
    try { await ChatMessage.create({ speaker: message.speaker, content: `<p><strong>${escapeHTML(message.item?.name ?? "The spell")}</strong> is lost: ${escapeHTML(reason)}.</p>` }); } catch (_) {}
}

/** The spell's targets less those its concealed or hidden flat check missed (the creatures' tokens, or the user's targets when none are given). */
export function dropMissedTargets(sourceMessageId, targets) {
    const missed = sourceMessageId ? game.messages.get(sourceMessageId)?.getFlag(MODULE_ID, "targetMisses") : null;
    if (!missed?.length) return targets;
    const list = targets ?? [...(game.user?.targets ?? [])];
    return list.filter(target => !missed.includes((target?.actor ?? target?.object?.actor)?.uuid));
}

/** The module's resolutions refuse a lost spell. */
export function assertSpellNotLost(sourceMessageId) {
    const lost = sourceMessageId ? game.messages.get(sourceMessageId)?.getFlag(MODULE_ID, "spellLost") : null;
    if (lost) throw new Error(`The spell was lost (${lost.reason}); it has no effect.`);
}

async function flatCheck(actor, dc, label) {
    const roll = await new Roll("1d20").evaluate();
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<strong>${escapeHTML(label)}</strong>: flat check DC ${dc}` }).catch(() => null);
    return roll.total >= dc;
}

/** As a spell is cast: the stupefied flat check; the Steady Spellcasting, Counterspell and Communal Healing cards. */
export async function castingRulesOnCast(message) {
    if (!activeGM() || !isCastMessage(message) || message.getFlag(MODULE_ID, "castingRules")) return null;
    const actor = message.actor, spell = message.item;
    if (!actor || !spell) return null;
    await message.setFlag(MODULE_ID, "castingRules", true).catch(() => null);
    const done = {};
    // Stupefied.
    const stupefied = Number(actor.getCondition?.("stupefied")?.value ?? 0);
    if (stupefied > 0) {
        const dc = 5 + stupefied;
        done.stupefied = await flatCheck(actor, dc, `${spell.name}: Stupefied ${stupefied}`);
        if (!done.stupefied) { await loseSpell(message, `disrupted (Stupefied ${stupefied}: flat check DC ${dc} failed)`); return done; }
    }
    // The caster's conditions: restrained, grabbed (a manipulate spell), deafened (an auditory spell).
    const traits = spell.system?.traits?.value ?? [];
    if (traits.includes("manipulate") && actor.hasCondition?.("restrained")) {
        done.restrained = false;
        await loseSpell(message, "a restrained creature can't use manipulate actions");
        return done;
    }
    for (const [slug, trait] of [["grabbed", "manipulate"], ["deafened", "auditory"]]) {
        // (Restrained creatures are also grabbed in effect; the grabbed check is for the grabbed alone.)
        if (!traits.includes(trait) || !actor.hasCondition?.(slug)) continue;
        done[slug] = await flatCheck(actor, 5, `${spell.name}: ${slug[0].toUpperCase()}${slug.slice(1)} (${trait})`);
        if (!done[slug]) { await loseSpell(message, `lost (${slug}: flat check DC 5 failed)`); return done; }
    }
    for (const slug of ["fascinated", "confused"]) if (actor.hasCondition?.(slug)) {
        const note = slug === "fascinated" ? (traits.includes("concentrate") ? "a fascinated creature can use a concentrate action only if it relates to the subject of its fascination" : null)
            : "a confused creature treats no one as an ally and can't Delay or use reactions; if it can't attack or cast, it babbles";
        if (note) try { await ChatMessage.create({ whisper: gmIds(), content: `<p class="pf2e-auto-gm-reminder"><strong>${escapeHTML(spell.name)}</strong> (GM): ${escapeHTML(actor.name)} is ${slug} — ${escapeHTML(note)}.</p>` }); } catch (_) {}
        done[slug] = "told";
    }
    // Concealed and hidden targets: each one's flat check (a spell that targets, not an area).
    if (String(spell.system?.target?.value ?? "").trim()) {
        const user = message.author ?? game.user;
        const misses = [];
        for (const token of [...(user?.targets ?? [])]) {
            const target = token.actor;
            if (!target || target === actor) continue;
            const dc = target.hasCondition?.("hidden") ? 11 : target.hasCondition?.("concealed") ? 5 : null;
            if (!dc) continue;
            const hit = await flatCheck(actor, dc, `${spell.name} at ${token.name} (${dc === 11 ? "hidden" : "concealed"})`);
            (done.targetChecks ??= []).push({ target: token.name, dc, hit });
            if (!hit) misses.push(target.uuid);
        }
        if (misses.length) {
            await message.setFlag(MODULE_ID, "targetMisses", misses);
            try { await ChatMessage.create({ speaker: message.speaker, content: `<p><strong>${escapeHTML(spell.name)}</strong> fails to affect ${escapeHTML(done.targetChecks.filter(entry => !entry.hit).map(entry => entry.target).join(", "))} (the flat check failed).</p>` }); } catch (_) {}
        }
    }
    // A note Effect forbidding spells with a trait (Sensory Deprivation: "cannot take actions with the manipulate trait").
    for (const note of actor.itemTypes?.effect ?? []) {
        const forbid = note.flags?.[MODULE_ID]?.runtime?.castForbid;
        if (!forbid || !traits.includes(forbid.trait)) continue;
        done.forbidden = forbid.trait;
        await loseSpell(message, `${note.name}: it can't take actions with the ${forbid.trait} trait`);
        return done;
    }
    // A note Effect's flat check on every cast (Silence of the Archmage's critical failure: "on a failure, the action fails").
    for (const note of actor.itemTypes?.effect ?? []) {
        const check = note.flags?.[MODULE_ID]?.runtime?.castFlatCheck;
        if (!check || !Number.isInteger(check.dc) || (check.trait && !traits.includes(check.trait))) continue;
        done.noteCheck = await flatCheck(actor, check.dc, `${spell.name}: ${note.name}`);
        if (!done.noteCheck) { await loseSpell(message, `${note.name}: the flat check DC ${check.dc} failed, the spell fails and its resources are wasted`); return done; }
    }
    // A curse's flat check on every cast — Nethys's Moderate Curse: "Whenever you cast a spell, attempt a DC 11 flat check. On a failure, if your spell was
    // harmful, you instead cast a beneficial spell of the same rank … You still lose the spell slot."
    for (const curse of actor.itemTypes?.feat ?? []) {
        const text = String(curse.system?.description?.value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
        const m = /Whenever you cast a spell, attempt a @Check\[flat\|dc:(\d+)\]\. On a failure, if your spell was harmful, you instead cast a beneficial spell of the same rank/.exec(text);
        if (!m) continue;
        done.curse = await flatCheck(actor, Number(m[1]), `${spell.name}: ${curse.name}`);
        if (!done.curse) {
            await loseSpell(message, `${curse.name}: the opposite spell of the same rank is cast instead`);
            try { await ChatMessage.create({ whisper: gmIds(), content: `<p class="pf2e-auto-gm-reminder"><strong>${escapeHTML(curse.name)}</strong> (GM): instead of ${escapeHTML(spell.name)}, ${escapeHTML(actor.name)} casts a rank-${castRankOf(message)} spell of the opposite kind (harmful ↔ beneficial) on the same targets; the slot is still spent.</p>` }); } catch (_) {}
            return done;
        }
    }
    // Steady Spellcasting: its button. (Its DC from the feat's text — Magus+'s Steady Spellcasting+ "attempt a DC 10 flat check" —, and that version's "if you cast a
    // non-cantrip spell that was disrupted by a reaction, you do not expend the focus point or spell slot".)
    const steady = (actor.itemTypes?.feat ?? []).find(item => ["steady-spellcasting", "steady-spellcasting-magus"].includes(item.slug));
    if (steady) {
        const text = String(steady.system?.description?.value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
        const dc = Number(/If a reaction would disrupt your spellcasting action, attempt a (?:@Check\[(?:type:)?flat\|dc:(\d+)\]|DC (\d+) flat check)/.exec(text)?.slice(1).find(Boolean) ?? 15);
        const refund = /if you cast a non-cantrip spell that was disrupted by a reaction, you do not expend the focus point or spell slot even if your spell was disrupted/.test(text);
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), whisper: [...new Set([...gmIds(), ...game.users.filter(user => actor.testUserPermission(user, "OWNER")).map(user => user.id)])],
            flags: { [MODULE_ID]: { kind: "casting-rule", castingRule: { rule: "steady", castId: message.id, dc, refund, name: steady.name } } },
            content: `<section class="pf2e-auto-runtime-card"><p><strong>${escapeHTML(steady.name)}</strong>: if a reaction disrupts ${escapeHTML(spell.name)}, roll the DC ${dc} flat check.</p><button type="button" data-pf2e-auto-casting-rule="steady">A reaction disrupted it: ${escapeHTML(steady.name)}</button></section>` }); } catch (_) {}
        done.steady = true;
    }
    // Communal Healing: Heal on a single creature (1 or 2 actions).
    // (Heal's card reads "1 to 3" until its variant is picked: the card unless the cast is the 3-action burst.)
    const actions = Number(spell.system?.time?.value);
    if (hasFeat(actor, "communal-healing") && spell.slug === "heal" && actions !== 3) {
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), flags: { [MODULE_ID]: { kind: "casting-rule", castingRule: { rule: "communal", castId: message.id, rank: castRankOf(message) } } },
            content: `<section class="pf2e-auto-runtime-card"><p><strong>Communal Healing</strong>: another willing living creature within range of the heal regains ${castRankOf(message)} Hit Points.</p><button type="button" data-pf2e-auto-casting-rule="communal">Heal the targeted creature (${castRankOf(message)} Hit Points)</button></section>` }); } catch (_) {}
        done.communal = true;
    }
    // Counterspell: each eligible foe's offer.
    done.counters = await offerCounterspells(message);
    // (The "+" reactions: Haughty Correction from a creature within 30 feet; the caster's own Residual Energy Capture.)
    done.reactions = await offerCastReactions(message);
    return done;
}

/** The spells a creature could counter the cast with: [{ entry, spell, rank, kind, penalty, mythic }] (the first eligible feat's). */
export function counterOptions(actor, castSpell, castRank) {
    const options = [];
    const entries = actor.itemTypes?.spellcastingEntry ?? [];
    const slug = castSpell.slug ?? castSpell.name.toLowerCase().replace(/[^a-z]+/g, "-");
    const slots = (entry, rank) => entry.system?.slots?.[`slot${rank}`];
    for (const entry of entries) {
        const prepared = entry.system?.prepared?.value;
        const tradition = entry.system?.tradition?.value;
        for (const rank of [castRank, ...Array.from({ length: 10 - castRank }, (_, index) => castRank + index + 1)]) {
            const slot = slots(entry, rank);
            if (!slot) continue;
            if (prepared === "prepared") {
                for (const [index, entryOf] of (slot.prepared ?? []).entries()) {
                    if (!entryOf?.id || entryOf.expended) continue;
                    const spell = actor.items.get(entryOf.id);
                    if (!spell) continue;
                    if (rank === castRank && spell.slug === slug && hasFeat(actor, "counterspell-prepared")) options.push({ entry, spell, rank, index, kind: "Counterspell", penalty: 0 });
                    else if (hasFeat(actor, "masters-counterspell")) options.push({ entry, spell, rank, index, kind: "Master's Counterspell", penalty: -2, tradition });
                    else if (hasFeat(actor, "mythic-counterspell")) options.push({ entry, spell, rank, index, kind: "Mythic Counterspell", penalty: 0, mythic: true });
                    // (Dueling Counter: "Expend a prepared spell or spell slot … counteract the triggering spell with the expended spell" — any, in a duel.)
                    else if (hasAbility(actor, "dueling-counter")) options.push({ entry, spell, rank, index, kind: "Dueling Counter", penalty: 0 });
                }
            } else if (prepared === "spontaneous" && Number(slot.value ?? 0) > 0) {
                const known = (actor.itemTypes?.spell ?? []).find(spell => spell.system?.location?.value === entry.id && spell.slug === slug);
                if (known && rank === castRank && hasFeat(actor, "counterspell-spontaneous")) options.push({ entry, spell: known, rank, kind: "Counterspell", penalty: 0 });
                else if (hasFeat(actor, "masters-counterspell")) options.push({ entry, spell: null, rank, kind: "Master's Counterspell", penalty: -2, tradition });
                else if (hasFeat(actor, "mythic-counterspell")) options.push({ entry, spell: null, rank, kind: "Mythic Counterspell", penalty: 0, mythic: true });
                else if (hasAbility(actor, "dueling-counter")) options.push({ entry, spell: null, rank, kind: "Dueling Counter", penalty: 0 });
            }
        }
    }
    // (The "+" reactions: Archmage's Counter — no slot, a rank of half the level, the spellcasting attribute and proficiency; Seal the Wicket — a prepared spell or a slot
    // with the triggering wicket trait.)
    for (const item of [...(actor.itemTypes?.feat ?? []), ...(actor.itemTypes?.action ?? [])]) {
        const reaction = readCastReaction(item.toObject?.() ?? item);
        if (reaction?.kind !== "counter") continue;
        if (reaction.noSlot) {
            if (castRank > highestCastableRank(actor)) continue;
            const entry = entries.find(candidate => ["prepared", "spontaneous", "innate"].includes(candidate.system?.prepared?.value)) ?? entries[0];
            if (!entry) continue;
            const mods = entry.statistic?.check?.modifiers ?? [];
            const modifier = mods.filter(mod => ["ability", "proficiency"].includes(mod.type) && mod.enabled !== false).reduce((total, mod) => total + Number(mod.modifier ?? 0), 0);
            const counterRank = Math.ceil(Number(actor.level ?? 1) / 2);
            options.push({ entry, spell: null, rank: counterRank, kind: reaction.name, penalty: 0, noSlot: true, modifier });
            if (reaction.mythic) options.push({ entry, spell: null, rank: counterRank, kind: reaction.name, penalty: 0, noSlot: true, modifier: Number(actor.level ?? 0) + 10 + Number(mods.find(mod => mod.type === "ability")?.modifier ?? 0), mythic: true });
        } else if (reaction.wicketTrait) {
            const traits = readCasterWicketTraits(actor).filter(trait => (castSpell.system?.traits?.value ?? []).includes(trait));
            if (!traits.length) continue;
            for (const entry of entries) {
                const prepared = entry.system?.prepared?.value;
                for (const [key, slot] of Object.entries(entry.system?.slots ?? {})) {
                    const rank = Number(key.replace("slot", ""));
                    if (!(rank > 0)) continue;
                    if (prepared === "prepared") for (const [index, entryOf] of (slot.prepared ?? []).entries()) {
                        const spell = entryOf?.id && !entryOf.expended ? actor.items.get(entryOf.id) : null;
                        if (spell && traits.some(trait => (spell.system?.traits?.value ?? []).includes(trait))) options.push({ entry, spell, rank, index, kind: reaction.name, penalty: 0 });
                    } else if (prepared === "spontaneous" && Number(slot.value ?? 0) > 0 && (actor.itemTypes?.spell ?? []).some(spell => spell.system?.location?.value === entry.id && Number(spell.rank) <= rank && traits.some(trait => (spell.system?.traits?.value ?? []).includes(trait))))
                        options.push({ entry, spell: null, rank, kind: reaction.name, penalty: 0 });
                }
            }
        }
    }
    return options;
}

async function offerCounterspells(message) {
    const caster = message.actor, spell = message.item;
    const rank = castRankOf(message);
    const offers = [];
    const seen = new Set();
    for (const token of canvas.scene?.tokens ?? []) {
        const actor = token.actor;
        if (!actor || actor === caster || seen.has(actor.uuid) || !(actor.alliance && caster.alliance && actor.alliance !== caster.alliance)) continue;
        seen.add(actor.uuid);
        const options = counterOptions(actor, spell, rank);
        if (!options.length) continue;
        const choices = options.slice(0, 12).map((option, index) => ({ index, label: option.noSlot ? `${option.kind}: no slot, counteract rank ${option.rank}${option.mythic ? " — spend a Mythic Point" : ""}`
            : `${option.kind}: ${option.spell?.name ?? `a rank ${option.rank} slot`} (rank ${option.rank}, ${option.entry.name})${option.penalty ? ` –${-option.penalty}` : ""}${option.mythic ? " — spend a Mythic Point" : ""}`,
            entryId: option.entry.id, spellId: option.spell?.id ?? null, rank: option.rank, slotIndex: option.index ?? null, penalty: option.penalty, kind: option.kind,
            ...(option.noSlot ? { noSlot: true, modifier: option.modifier } : {}), ...(option.mythic ? { mythic: true } : {}) }));
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), whisper: [...new Set([...gmIds(), ...game.users.filter(user => actor.testUserPermission(user, "OWNER")).map(user => user.id)])],
            flags: { [MODULE_ID]: { kind: "casting-rule", castingRule: { rule: "counterspell", castId: message.id, actorUuid: actor.uuid, choices } } },
            content: `<section class="pf2e-auto-runtime-card"><p><strong>Counterspell</strong> (reaction): ${escapeHTML(actor.name)} can counter ${escapeHTML(caster.name)}'s ${escapeHTML(spell.name)} (rank ${rank}).</p>${choices.map(choice =>
                `<button type="button" data-pf2e-auto-casting-rule="counterspell" data-choice="${choice.index}">${escapeHTML(choice.label)}</button>`).join("")}</section>` }); } catch (_) {}
        offers.push(actor.name);
    }
    return offers;
}

/** Haughty Correction (a creature near the caster) and Residual Energy Capture (the caster): their cards. */
async function offerCastReactions(message) {
    const caster = message.actor, spell = message.item;
    const casterToken = caster?.getActiveTokens?.(true, true)?.[0] ?? null;
    const offers = [];
    const card = async (actor, rule, label, text, extra = {}) => {
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), whisper: [...new Set([...gmIds(), ...game.users.filter(user => actor.testUserPermission(user, "OWNER")).map(user => user.id)])],
            flags: { [MODULE_ID]: { kind: "casting-rule", castingRule: { rule, castId: message.id, actorUuid: actor.uuid, ...extra } } },
            content: `<section class="pf2e-auto-runtime-card"><p><strong>${escapeHTML(label)}</strong>: ${escapeHTML(text)}</p><button type="button" data-pf2e-auto-casting-rule="${rule}">${escapeHTML(label)}</button></section>` }); offers.push(`${actor.name}: ${label}`); } catch (_) {}
    };
    for (const token of canvas.scene?.tokens ?? []) {
        const actor = token.actor;
        if (!actor || actor === caster || !casterToken) continue;
        for (const item of actor.itemTypes?.feat ?? []) {
            const reaction = readCastReaction(item.toObject());
            if (reaction?.kind !== "haughty" || tokenDistance(token, casterToken) > reaction.within) continue;
            if ((caster.itemTypes?.effect ?? []).some(effect => effect.flags?.[MODULE_ID]?.spellshapeImmunity?.name === item.name)) continue;
            await card(actor, "haughty", item.name, `${actor.name} can correct ${caster.name}'s ${spell.name} (Arcana against its Will DC).`, { itemUuid: item.uuid });
        }
    }
    // (Residual Energy Capture: a spell from slots with one of the traits — the wizard's slots the table's; a summon's creature trait too.)
    const traits = spell?.system?.traits?.value ?? [];
    const fromSlots = spell?.spellcasting && (spell.spellcasting.isPrepared || spell.spellcasting.isSpontaneous) && !traits.includes("cantrip") && !traits.includes("focus");
    for (const item of [...(caster?.itemTypes?.action ?? []), ...(caster?.itemTypes?.feat ?? [])]) {
        const reaction = readCastReaction(item.toObject());
        if (reaction?.kind !== "residual" || !fromSlots) continue;
        const trait = reaction.traits.find(entry => traits.includes(entry));
        if (!trait) continue;
        await card(caster, "residual", item.name, `${caster.name} can capture ${trait} residual energy from ${spell.name} (rank ${castRankOf(message)}).`, { itemUuid: item.uuid, trait, rank: castRankOf(message), minutes: reaction.minutes });
    }
    return offers;
}

/** The counteract outcome (PF2e): a critical success counters up to 3 ranks higher; a success up to 1 higher; a failure only a lower rank. */
export function counters(degree, counterRank, targetRank) {
    return degree === 3 ? targetRank <= counterRank + 3 : degree === 2 ? targetRank <= counterRank + 1 : degree === 1 ? targetRank < counterRank : false;
}

/** A casting-rule card's button. */
export async function runCastingRule(message, button) {
    const data = message.getFlag(MODULE_ID, "castingRule");
    const cast = game.messages.get(data?.castId ?? "");
    if (!data || !cast) throw new Error("The cast is gone.");
    if (data.rule === "steady") {
        const actor = cast.actor;
        const dc = Number(data.dc ?? 15), name = data.name ?? "Steady Spellcasting";
        const kept = await flatCheck(actor, dc, name);
        if (kept) return { kept };
        await loseSpell(cast, `disrupted (${name}'s DC ${dc} flat check failed)`);
        // (Steady Spellcasting+: the disrupted non-cantrip's slot or Focus Point not spent.)
        const spell = cast.item;
        if (!data.refund || !spell || (spell.system?.traits?.value ?? []).includes("cantrip")) return { kept };
        if ((spell.system?.traits?.value ?? []).includes("focus") || spell.spellcasting?.isFocusPool) {
            const focus = actor.system?.resources?.focus;
            if (focus && Number(focus.value) < Number(focus.max)) await actor.update({ "system.resources.focus.value": Number(focus.value) + 1 });
            return { kept, refunded: "focus" };
        }
        return { kept, refunded: (await refundSlot(actor, spell, castRankOf(cast), name))?.status ?? null };
    }
    if (data.rule === "communal") {
        const target = [...game.user.targets][0]?.actor;
        if (!target) throw new Error("Target the creature to heal.");
        // ("another willing living creature": not undead or a construct.)
        const traits = target.traits ?? new Set(target.system?.traits?.value ?? []);
        if (["undead", "construct"].some(trait => traits.has?.(trait) ?? [...traits].includes(trait))) throw new Error(`${target.name} isn't a living creature.`);
        await target.applyDamage({ damage: -Number(data.rank), token: target.getActiveTokens?.(true, true)?.[0], skipIWR: true, rollOptions: new Set(["item:trait:healing"]) });
        try { await ChatMessage.create({ speaker: cast.speaker, content: `<p><strong>Communal Healing</strong>: ${escapeHTML(target.name)} regains ${Number(data.rank)} Hit Points.</p>` }); } catch (_) {}
        return { healed: target.name, amount: Number(data.rank) };
    }
    if (data.rule === "haughty") {
        // (Haughty Correction: Arcana against the caster's Will DC; Stupefied 1 for 1 minute on a critical success, until the end of its next turn on a success; on a critical
        // failure the module's Effect on the corrector; the caster immune for 1 minute either way.)
        const actor = await fromUuid(data.actorUuid), item = await fromUuid(data.itemUuid ?? "").catch(() => null), target = cast.actor;
        const reaction = item ? readCastReaction(item.toObject()) : null;
        if (!actor || !target || reaction?.kind !== "haughty") throw new Error("Haughty Correction is unavailable.");
        const dc = Number(target.saves?.will?.dc?.value ?? 10 + Number(target.saves?.will?.mod ?? 0));
        const roll = await actor.skills?.[reaction.skill]?.roll({ dc: { value: dc }, skipDialog: true });
        const degree = Number(roll?.degreeOfSuccess ?? 1);
        if (degree === 3) await timedConditions(target, [{ ...reaction.condition, rounds: reaction.criticalRounds }], item.name, { caster: actor });
        else if (degree === 2) await timedConditions(target, [{ ...reaction.condition, rounds: 1 }], item.name, { caster: actor });
        else if (degree === 0) { const template = await loadNativeEffectTemplate(reaction.failEffect.uuid); if (template) await createNativeEffect(actor, prepareNativeEffectSource(template, { castInstanceId: cast.id, castRank: 1, sourceActorUuid: actor.uuid, sourceItemUuid: item.uuid, sourceItemName: item.name, resolutionKind: "save", targetActorUuid: actor.uuid })); }
        await target.createEmbeddedDocuments("Item", [{ name: `${item.name}: immune`, type: "effect", img: "icons/svg/aura.svg", flags: { [MODULE_ID]: { spellshapeImmunity: { name: item.name } } },
            system: { duration: { value: reaction.immunityMinutes, unit: "minutes", expiry: null, sustained: false }, start: { value: game.time.worldTime, initiative: null }, tokenIcon: { show: false } } }]);
        await message.update({ content: message.content.replace(/<button[\s\S]*<\/button>/, `<p><em>Used: ${["critical failure", "failure", "success", "critical success"][degree]}.</em></p>`) }).catch(() => null);
        return { degree };
    }
    if (data.rule === "residual") {
        // (Residual Energy Capture: the module's Effect with the spell's trait, its level the spell's rank; an earlier residual energy replaced.)
        const actor = await fromUuid(data.actorUuid);
        const template = await loadNativeEffectTemplate("Compendium.pf2e-team-plus-wizards.wizards-misc.Item.XrPdZdUTxuUz6nnA");
        if (!actor || !template) throw new Error("Residual Energy is unavailable.");
        const old = (actor.itemTypes?.effect ?? []).filter(effect => effect.name.startsWith(template.name));
        if (old.length) await actor.deleteEmbeddedDocuments("Item", old.map(effect => effect.id));
        const source = prepareNativeEffectSource(template, { castInstanceId: cast.id, castRank: data.rank, sourceActorUuid: actor.uuid, sourceItemUuid: data.itemUuid, sourceItemName: "Residual Energy Capture", resolutionKind: "save", targetActorUuid: actor.uuid });
        source.system.level = { value: Number(data.rank) };
        const choice = (source.system.rules ?? []).find(rule => rule.key === "ChoiceSet");
        if (choice) { choice.selection = data.trait; foundry.utils.setProperty(source, `flags.pf2e.rulesSelections.${choice.flag ?? "energyTrait"}`, data.trait); }
        const made = await createNativeEffect(actor, source);
        await message.update({ content: message.content.replace(/<button[\s\S]*<\/button>/, `<p><em>Captured: ${escapeHTML(data.trait)} (rank ${Number(data.rank)}).</em></p>`) }).catch(() => null);
        return { effectUuid: made?.uuid ?? null, trait: data.trait };
    }
    if (data.rule === "counterspell") {
        if (cast.getFlag(MODULE_ID, "spellLost")) throw new Error("That spell is already lost.");
        const choice = data.choices[Number(button?.dataset?.choice ?? 0)];
        const actor = await fromUuid(data.actorUuid);
        const entry = actor?.items.get(choice?.entryId ?? "");
        if (!choice || !entry) throw new Error("That counterspell is no longer available.");
        // (The slot: "You lose your spell slot as if you had cast the triggering spell.")
        const spell = choice.spellId ? actor.items.get(choice.spellId) : null;
        // (Archmage's Counter: no slot; a Mythic Point spent for mythic proficiency.)
        if (choice.noSlot) {
            if (choice.mythic) {
                const points = actor.system?.resources?.mythicPoints;
                if (!(Number(points?.value ?? 0) > 0)) throw new Error(`${actor.name} has no Mythic Point to spend.`);
                await actor.update({ "system.resources.mythicPoints.value": Number(points.value) - 1 });
            }
        } else if (entry.system?.prepared?.value === "prepared" && choice.slotIndex != null) await entry.setSlotExpendedState(choice.rank, choice.slotIndex, true);
        else if (entry.system?.prepared?.value === "spontaneous") await entry.update({ [`system.slots.slot${choice.rank}.value`]: Math.max(0, Number(entry.system.slots[`slot${choice.rank}`].value) - 1) });
        // (The counteract check: the entry's spell attack modifier against the foe's spell DC; Master's Counterspell –2.)
        const casterEntry = cast.item?.spellcasting;
        const dc = Number(casterEntry?.statistic?.dc?.value ?? cast.actor?.attributes?.spellDC?.value ?? 15);
        const check = entry.statistic?.check;
        const modifier = (choice.noSlot ? Number(choice.modifier ?? 0) : Number(check?.mod ?? 0)) + Number(choice.penalty ?? 0);
        const roll = await new Roll(`1d20 + ${modifier}`).evaluate();
        const natural = roll.dice[0]?.total ?? 10;
        let degree = roll.total >= dc + 10 ? 3 : roll.total >= dc ? 2 : roll.total > dc - 10 ? 1 : 0;
        if (natural === 20) degree = Math.min(3, degree + 1); else if (natural === 1) degree = Math.max(0, degree - 1);
        const targetRank = castRankOf(cast);
        const countered = counters(degree, choice.rank, targetRank);
        await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<strong>${escapeHTML(choice.kind)}</strong>: counteract check against DC ${dc} (rank ${choice.rank} vs ${targetRank}) — ${["critical failure", "failure", "success", "critical success"][degree]}${countered ? ", countered" : ", not countered"}` }).catch(() => null);
        if (countered) await loseSpell(cast, `countered by ${actor.name}'s ${choice.kind}`);
        await message.update({ content: message.content.replace(/<button[\s\S]*<\/button>/, `<p><em>${escapeHTML(choice.kind)} used: ${countered ? "countered" : "not countered"}.</em></p>`) }).catch(() => null);
        return { degree, countered, spell: spell?.name ?? null };
    }
    return null;
}

/** The cards' buttons. */
export function bindCastingRuleButtons(message, html) {
    const root = html instanceof HTMLElement ? html : html?.[0];
    for (const button of root?.querySelectorAll?.("[data-pf2e-auto-casting-rule]") ?? []) button.addEventListener("click", async () => {
        try { await runCastingRule(message, button); } catch (error) { ui.notifications.error(error.message); }
    });
}
