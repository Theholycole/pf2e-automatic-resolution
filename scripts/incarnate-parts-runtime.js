// An incarnate's parts that aren't a save card (incarnate-phases.js): damage or healing with no save on the creatures the GM targets, a
// generated Effect (a d20 limit, a fortune, granted conditions), conditions reduced, and the damage a note deals as its creature's turn
// starts (Garden of the Green Man's squeezing vines).
import { applyDamageWithReceipt } from "./native-damage-receipt.js";
import { isDying, recoverFromDying, revivedNote } from "./dying-recovery.js";
import { prepareNoteEffectSource } from "./note-effects.js";

const MODULE_ID = "pf2e-automatic-resolution";
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const damageRollClass = () => {
    const DamageRoll = (CONFIG.Dice?.rolls ?? []).find(candidate => candidate?.name === "DamageRoll");
    if (!DamageRoll) throw new Error("PF2e's DamageRoll class could not be resolved.");
    return DamageRoll;
};

/** The moment a part's Effect starts (its turn-anchored durations read the combat's order). */
export function effectStartNow(sourceActor) {
    return { value: game.time?.worldTime ?? 0, initiative: game.combat?.combatants?.find?.(combatant => combatant.actor?.uuid === sourceActor?.uuid)?.initiative ?? null,
        started: game.combat?.started === true, combatId: game.combat?.id ?? null, turn: game.combat?.turn ?? 0, turnActors: (game.combat?.turns ?? []).map(turn => turn.actor?.uuid ?? null) };
}

/** Damage with no save: one roll at the cast rank, applied to each targeted creature. */
export async function applyPartDamage({ spell, caster, castRank, castId, spellName, title, formula, tokens }) {
    const roll = await new (damageRollClass())(formula, spell?.getRollData?.({ castRank }) ?? { item: { rank: castRank, level: castRank } }, { rollerId: game.user.id }).evaluate();
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: caster }), flavor: `<strong>${escapeHTML(spellName)}</strong> — ${escapeHTML(title)} (no save)`,
        flags: { [MODULE_ID]: { kind: "incarnate-damage", castInstanceId: castId } } });
    const results = [];
    for (const token of tokens) {
        const receipt = await applyDamageWithReceipt(token.actor, { damage: roll, token: token.document ?? token, item: spell, rollOptions: new Set(), skipIWR: false }, foundry.utils.randomID());
        results.push({ actorUuid: token.actor.uuid, name: token.actor.name, receipt });
    }
    return { formula: roll.formula, total: roll.total, results };
}

/** Healing with no save: one roll at the cast rank, applied to each targeted ally (back from Dying as the rules say). */
export async function applyPartHealing({ spell, caster, castRank, castId, spellName, title, formula, tokens }) {
    const roll = await new (damageRollClass())(`(${formula})[healing]`, spell?.getRollData?.({ castRank }) ?? { item: { rank: castRank, level: castRank } }, { rollerId: game.user.id }).evaluate();
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: caster }), flavor: `<strong>${escapeHTML(spellName)}</strong> — ${escapeHTML(title)} (healing)`,
        flags: { [MODULE_ID]: { kind: "incarnate-healing", castInstanceId: castId } } });
    const results = [];
    for (const token of tokens) {
        const actor = token.actor;
        const wasDying = isDying(actor);
        const receipt = await applyDamageWithReceipt(actor, { damage: -roll.total, token: token.document ?? token, item: spell, rollOptions: new Set(), skipIWR: false }, foundry.utils.randomID());
        const revived = await recoverFromDying(actor, wasDying);
        results.push({ actorUuid: actor.uuid, name: actor.name, healing: receipt.healing, ...(revived ? { revived } : {}) });
    }
    const back = results.filter(result => result.revived);
    if (back.length) await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), flags: { [MODULE_ID]: { kind: "dying-recovery", castInstanceId: castId } },
        content: `<p><strong>${escapeHTML(spellName)}</strong></p>${back.map(result => `<p>${escapeHTML(result.name)}: ${escapeHTML(revivedNote(result.revived))}</p>`).join("")}` });
    return { formula: roll.formula, total: roll.total, results };
}

/** A part's generated Effect on each targeted creature: its rules, the conditions it grants, its d20 limit, for the part's time. */
export async function applyPartEffect({ spell, caster, castRank, castId, spellName, part, tokens }) {
    const grants = (part.grants ?? []).map(grant => ({ key: "GrantItem", uuid: grant.uuid, flag: `condition${grant.slug.split("-").map(word => word[0].toUpperCase() + word.slice(1)).join("")}`,
        allowDuplicate: true, onDeleteActions: { grantee: "restrict" },
        ...(grant.value ? { alterations: [{ mode: "override", property: "badge-value", value: grant.value }] } : {}), ...(grant.predicate ? { predicate: [...grant.predicate] } : {}) }));
    // (Values by rank: "AC becomes 28 (36 at 9th)", "20 temporary Hit Points (30 at 9th)".)
    const atRank = entry => entry ? Object.entries(entry.byRank ?? {}).filter(([rank]) => Number(castRank) >= Number(rank)).sort(([a], [b]) => Number(a) - Number(b)).at(-1)?.[1] ?? entry.base : null;
    const temp = atRank(part.tempHp);
    const base = { label: part.label, text: part.text, sourceText: part.sourceText, rules: [...(part.rules ?? []), ...grants, ...(temp ? [{ key: "TempHP", value: temp }] : [])], duration: { ...part.duration },
        ...(part.d20Clamp ? { d20Clamp: { ...part.d20Clamp } } : {}), ...(part.turnStartAttack ? { turnStartAttack: JSON.parse(JSON.stringify(part.turnStartAttack)) } : {}), ...(part.endsInDeath ? { endsInDeath: true } : {}), ...(part.zeroToOne ? { zeroToOne: true } : {}) };
    const effectStart = effectStartNow(caster);
    const created = [];
    for (const token of tokens) {
        // ("Your familiar's AC becomes 28": the difference from its AC now.)
        const acSet = atRank(part.acSet);
        const note = acSet == null ? base : { ...base, rules: [...base.rules, { key: "FlatModifier", selector: "ac", type: "untyped", value: acSet - Number(token.actor.armorClass?.value ?? token.actor.system?.attributes?.ac?.value ?? acSet), slug: "ac-set" }] };
        const source = prepareNoteEffectSource(note, { castId, sourceActorUuid: caster.uuid, targetActorUuid: token.actor.uuid, sourceItemUuid: spell?.uuid ?? null, sourceItemName: spellName,
            castRank, degree: null, effectStart, targetName: token.actor.name, dc: spell?.spellcasting?.statistic?.dc?.value ?? null });
        const [effect] = await token.actor.createEmbeddedDocuments("Item", [source]);
        created.push({ actorUuid: token.actor.uuid, effectUuid: effect.uuid });
    }
    return created;
}

/** "… reduce the value of any Clumsy, Drained, … conditions by 2": each targeted creature's listed conditions, lowered (removed at 0). */
export async function reducePartConditions({ slugs, by, tokens }) {
    const results = [];
    for (const token of tokens) {
        const changed = [];
        for (const slug of slugs) {
            const before = token.actor.getCondition?.(slug)?.value ?? null;
            if (!before) continue;
            for (let step = 0; step < by && token.actor.hasCondition?.(slug); step += 1) await token.actor.decreaseCondition(slug);
            changed.push({ slug, before, after: token.actor.getCondition?.(slug)?.value ?? 0 });
        }
        results.push({ actorUuid: token.actor.uuid, name: token.actor.name, changed });
    }
    return results;
}

/** Each creature whose turn starts now: the damage its note deals (once per turn). The active GM only. */
export async function turnStartNoteDamage(combat) {
    if (!game.user?.isGM || game.users.activeGM?.id !== game.user.id || !combat?.started) return [];
    const actor = combat.combatant?.actor;
    if (!actor) return [];
    const stamp = `${combat.id}:${combat.round}:${combat.turn}`;
    const dealt = [];
    for (const effect of actor.itemTypes?.effect ?? []) {
        const data = effect.flags?.[MODULE_ID]?.runtime;
        // (Remake Physiology: the flat check before it regains actions; a failure Slowed for this round.)
        if (data?.turnStartFlat && effect.flags?.[MODULE_ID]?.turnStartStamp !== stamp) {
            await effect.setFlag(MODULE_ID, "turnStartStamp", stamp);
            const flat = await new Roll("1d20").evaluate();
            const failed = flat.total < data.turnStartFlat.flat;
            await flat.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<strong>${escapeHTML(data.sourceItemName)}</strong> — ${escapeHTML(effect.name)}: DC ${data.turnStartFlat.flat} flat check ${failed ? `failed: ${escapeHTML(data.turnStartFlat.condition.slug)} ${data.turnStartFlat.condition.value} this round` : "succeeded"}` });
            if (failed) await actor.createEmbeddedDocuments("Item", [{ name: `${data.sourceItemName}: ${data.turnStartFlat.condition.slug} ${data.turnStartFlat.condition.value}`, type: "effect", img: "icons/svg/downgrade.svg",
                flags: { [MODULE_ID]: { runtime: { schema: 1, kind: "turn-start-flat", castInstanceId: data.castInstanceId, sourceActorUuid: data.sourceActorUuid, sourceItemName: data.sourceItemName } } },
                system: { duration: { value: 0, unit: "rounds", expiry: "turn-end", sustained: false }, start: { value: game.time.worldTime, initiative: game.combat?.combatant?.initiative ?? null },
                    description: { value: `<p>${escapeHTML(data.turnStartFlat.condition.slug)} ${data.turnStartFlat.condition.value} for this round.</p>` },
                    rules: [{ key: "GrantItem", uuid: data.turnStartFlat.condition.uuid, flag: "conditionTurnFlat", allowDuplicate: true, onDeleteActions: { grantee: "cascade" },
                        ...(data.turnStartFlat.condition.value > 1 ? { alterations: [{ mode: "override", property: "badge-value", value: data.turnStartFlat.condition.value }] } : {}) }] } }]);
            dealt.push({ effectUuid: effect.uuid, flat: flat.total, failed });
            continue;
        }
        // (Nature's Enmity: the flat check, then the basic save, damage and Off-Guard.)
        if (data?.turnStartAttack && effect.flags?.[MODULE_ID]?.turnStartStamp !== stamp) {
            await effect.setFlag(MODULE_ID, "turnStartStamp", stamp);
            dealt.push({ effectUuid: effect.uuid, ...await turnStartAttack(actor, effect, data) });
            continue;
        }
        if (!data?.turnStartDamage || effect.flags?.[MODULE_ID]?.turnStartStamp === stamp) continue;
        await effect.setFlag(MODULE_ID, "turnStartStamp", stamp);
        const roll = await new (damageRollClass())(`${data.turnStartDamage.formula}[${data.turnStartDamage.type}]`, {}, { rollerId: game.user.id }).evaluate();
        await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<strong>${escapeHTML(data.sourceItemName)}</strong> — ${escapeHTML(effect.name)}: as ${escapeHTML(actor.name)}'s turn starts`,
            flags: { [MODULE_ID]: { kind: "turn-start-note-damage", castInstanceId: data.castInstanceId } } });
        const token = actor.getActiveTokens?.(true, true)?.[0];
        await applyDamageWithReceipt(actor, { damage: roll, token, rollOptions: new Set(), skipIWR: false }, foundry.utils.randomID());
        // ("If this damage drops the creature to 0 Hit Points, it dies instantly.")
        const killed = data.turnStartDamage.diesAtZero === true && Number(actor.system?.attributes?.hp?.value ?? 1) <= 0;
        if (killed && !actor.statuses?.has?.("dead")) {
            await actor.toggleStatusEffect?.("dead", { overlay: true, active: true });
            try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p><strong>${escapeHTML(data.sourceItemName)}</strong>: ${escapeHTML(actor.name)} drops to 0 Hit Points and dies.</p>` }); } catch (_) {}
        }
        dealt.push({ effectUuid: effect.uuid, total: roll.total, ...(killed ? { killed: true } : {}) });
    }
    return dealt;
}


/** A note's turn-start attack: the DC flat check; on a failure the basic save, the damage at its result, and Off-Guard unless it critically succeeded. */
async function turnStartAttack(actor, effect, data) {
    const attack = data.turnStartAttack;
    const flat = await new Roll("1d20").evaluate();
    const failed = flat.total < attack.flat;
    await flat.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<strong>${escapeHTML(data.sourceItemName)}</strong> — ${escapeHTML(effect.name)}: DC ${attack.flat} flat check ${failed ? "failed: it's attacked" : "succeeded"}` });
    if (!failed) return { flat: flat.total, attacked: false };
    const save = await actor.saves?.[attack.statistic]?.roll({ dc: { value: Number(attack.dc) }, skipDialog: true, extraRollOptions: ["damaging-effect"] });
    const degree = Number(save?.degreeOfSuccess ?? -1);
    if (degree < 0) throw new Error(`${actor.name}'s save wasn't rolled.`);
    const multiplier = [2, 1, 0.5, 0][degree];
    let total = 0;
    if (multiplier) {
        const roll = await new (damageRollClass())(`${attack.formula}[${attack.type}]`, {}, { rollerId: game.user.id }).evaluate();
        const dealt = multiplier === 1 ? roll : roll.alter(multiplier, 0);
        await dealt.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<strong>${escapeHTML(data.sourceItemName)}</strong> — the animals' attack (${["critical failure", "failure", "success", "critical success"][degree]})` });
        await applyDamageWithReceipt(actor, { damage: dealt, token: actor.getActiveTokens?.(true, true)?.[0], rollOptions: new Set(), skipIWR: false }, foundry.utils.randomID());
        total = dealt.total;
    }
    let offGuard = null;
    if (attack.offGuard && degree < 3) {
        const [created] = await actor.createEmbeddedDocuments("Item", [{ name: `${data.sourceItemName}: Off-Guard`, type: "effect", img: "icons/svg/downgrade.svg",
            flags: { [MODULE_ID]: { runtime: { schema: 1, kind: "turn-start-attack", castInstanceId: data.castInstanceId, sourceActorUuid: data.sourceActorUuid, sourceItemName: data.sourceItemName } } },
            system: { duration: { value: attack.offGuard.rounds, unit: "rounds", expiry: "turn-start", sustained: false }, start: { value: game.time.worldTime, initiative: game.combat?.combatant?.initiative ?? null },
                description: { value: `<p>Off-Guard from the animals' attack.</p>` }, rules: [{ key: "GrantItem", uuid: attack.offGuard.uuid, flag: "conditionOffGuard", allowDuplicate: true, onDeleteActions: { grantee: "cascade" } }] } }]);
        offGuard = created?.uuid ?? null;
    }
    return { flat: flat.total, attacked: true, degree: ["criticalFailure", "failure", "success", "criticalSuccess"][degree], total, offGuard };
}

/** An incarnate card's part: its heading (Arrive / Depart, its traits and title, when it happens, its reminder) and its button. */
export function incarnatePartHTML(phase) {
    // (A mode's own action is pressed through its mode.)
    if (phase.hidden) return "";
    const base = phase.key.replace(/-\d+$/, "");
    const label = base === "arrive" ? "Arrive" : base === "depart" ? "Depart" : phase.title;
    const when = base === "depart" ? " — at the end of your next turn" : base === "arrive" ? " — when it appears" : phase.dc ? ` — DC ${phase.dc}` : "";
    const action = phase.kind === "attack" ? `target up to ${phase.count} creatures, then roll the attacks` : phase.kind === "damage" ? "target the creatures, then roll the damage"
        : phase.kind === "heal" ? "target the allies, then roll the healing" : ["effect", "native-effect"].includes(phase.kind) ? "target the creatures, then apply it"
        : phase.kind === "reduce-conditions" ? "target the allies, then reduce their conditions" : phase.kind === "cast-spell" ? `target the creatures, then cast ${phase.name}`
        : phase.onConjured && phase.kind === "effect" ? "apply it to the conjured token" : phase.kind === "terrain" ? (phase.place ? "place its area" : "make its area difficult terrain") : phase.kind === "hazard" ? (phase.between ? "target the creatures shot, then draw the lines" : "place its area")
        : phase.kind === "summon" ? (phase.fromCorpse ? "target the corpse, then raise it" : "target the dying creature, then summon")
        : phase.kind === "form-aura" ? "on a Sustain" : phase.kind === "retaliate" ? "target the creature, then roll the damage" : phase.kind === "temp-hp" ? "roll the temporary Hit Points" : phase.kind === "cast-form" ? "choose the form" : phase.kind === "teleport" ? (phase.mode === "swap" ? (phase.who === "caster" ? "target the creature, then swap" : "target the two creatures, then swap")
            : phase.who === "caster" ? "click the destination" : "target the creature, then click its destination") : phase.kind === "hp-share" ? "target the creatures, then share" : phase.kind === "descend" ? "target the flying creatures, then lower them"
        : phase.kind === "elevate" ? "rise" : phase.kind === "fuse" ? "target the creature, then fuse" : phase.kind === "launch" ? "target the creatures, then throw them" : phase.kind === "temp-share" ? "target the allies, then share" : phase.kind === "glyph" ? "target the creatures, then mark them" : phase.kind === "beam-roll" ? "target the creatures, then roll their beams" : phase.kind === "sequence" ? "target the creature, then run each layer" : phase.kind === "fumarole" ? "roll the color, then place the area" : phase.kind === "attack-save" ? "target the creature, then roll the attack (a hit starts the save)" : phase.kind === "charge" ? "target the creature, then charge" : phase.kind === "teeth" ? "place the darkness" : phase.kind === "link" ? "target the foe, then link it" : phase.kind === "sacrifice" ? "target the creature, then roll its save" : phase.kind === "fury" ? "target the creature, then roll its save" : phase.kind === "leech" ? "target the creature casting the divine spell" : phase.kind === "mimic" ? "target the creature casting the spell, then counteract" : phase.kind === "death-mark" ? "target the creature hit, then mark it" : phase.kind === "word" ? "target the marked creature, then speak the word" : phase.kind === "emblem" ? "target the enemy, then place the emblem" : phase.kind === "raise" ? "target the dead creature, then raise it" : phase.kind === "revive" ? "target the living and the dead, then roll the healing" : phase.kind === "shock" ? "target the creature or the corpse, then jolt it" : phase.kind === "renewal" ? "target the creatures, then renew them" : phase.kind === "seed" ? "place the burst where it lands" : phase.kind === "pod" ? "place the burst where it lands" : phase.kind === "gift" ? "target the character, then pick its benefit" : phase.kind === "true-target" ? "target the attackers, then designate the creature" : phase.kind === "covenant" ? "target the caster and the willing creatures" : phase.kind === "heartbolt" ? "target the creature, then loose the bolt" : phase.kind === "mode" ? (phase.actionLabel ?? "choose it") : phase.kind === "cloud" ? "select or place its area" : phase.kind === "destroy-thrall" ? "target the thrall, then destroy it" : phase.kind === "check-copy" ? `target the corpse, then roll ${phase.skillLabel}` : phase.linger ? "place the area"
        : phase.kind === "attack" && phase.count === 1 ? "target the creature, then roll the attack" : "target the creatures, then roll their saves";
    const repeat = phase.repeat ? ` Again each time ${phase.repeat.trigger}${phase.repeat.unless ? `, unless ${phase.repeat.unless}` : ""} (the GM presses it).` : "";
    const immune = phase.immunityRounds ? ` A creature that critically succeeds is immune for ${phase.immunityRounds} round${phase.immunityRounds === 1 ? "" : "s"}.` : "";
    const runnable = phase.plan || ["damage", "heal", "effect", "native-effect", "reduce-conditions", "cast-spell", "cloud", "destroy-thrall", "check-copy", "terrain", "summon", "hazard", "form-aura", "retaliate", "temp-hp", "cast-form", "teleport", "hp-share", "descend", "elevate", "fuse", "mode", "launch", "temp-share", "glyph", "beam-roll", "sequence", "fumarole", "attack-save", "charge", "teeth", "link", "sacrifice", "fury", "leech", "mimic", "death-mark", "word", "emblem", "raise", "revive", "shock", "renewal", "seed", "pod", "gift", "true-target", "covenant", "heartbolt"].includes(phase.kind);
    return `<p><strong>${escapeHTML(label)}${phase.traits?.length ? ` (${escapeHTML(phase.traits.join(", "))})` : ""}${phase.dc ? "" : `: ${escapeHTML(phase.title)}`}</strong>${when}${phase.reminder ? `. ${escapeHTML(phase.reminder)}` : ""}${phase.note ? `. ${escapeHTML(phase.note)}` : ""}${escapeHTML(repeat)}${escapeHTML(immune)}</p>`
        + (runnable ? `<button type="button" class="pf2e-auto-incarnate" data-phase="${phase.key}"><i class="fa-solid fa-users"></i> ${escapeHTML(label === phase.title ? phase.title : `${label}: ${phase.title}`)}: ${escapeHTML(action)}</button>` : "");
}

/**
 * A spell's controls card (Puppet Strings' forced Strike and Stride), posted when its save card finishes with a row that gives them: the same
 * buttons as an incarnate's card, each pressed while the spell lasts.
 */
export async function postControlsCard({ controls, spellName, itemUuid, sourceActorUuid, castRank, castId, targets }) {
    const caster = await fromUuid(sourceActorUuid);
    const content = `<h3>${escapeHTML(spellName)} — ${escapeHTML(controls.label)}</h3><p>For ${targets.map(name => `<strong>${escapeHTML(name)}</strong>`).join(", ")}, while the spell lasts.</p>`
        + controls.parts.map(part => incarnatePartHTML(part)).join("");
    return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), content,
        flags: { [MODULE_ID]: { kind: "incarnate", castInstanceId: castId, incarnate: { itemUuid, sourceActorUuid, castRank, spellName, used: [], choice: null, source: "controls" } } } });
}

/**
 * A copy of a creature that fights for the caster (Duplicate Foe's duplicate, Reanimate Foe's reanimated enemy): the creature's statistics (attack
 * modifiers, AC, saves, Perception, skills) and its Strikes without their added effects, but the stated Hit Points, none of its special abilities,
 * immunities, resistances or weaknesses, and no spells or other items but its weapons and armor; a minion the caster's players own, beside the
 * original's token. Its Effect holds the time, the Hit Points it loses after each of its turns, half damage when stated, and its end at 0 Hit Points.
 */
export async function copyCreature({ original, originalToken, caster, spellName, castId, castRank, hp, hpLoss, halfDamage = false, seconds, sustained = false, notes = [] }) {
    const data = original.toObject();
    delete data._id; delete data.folder; delete data.sort;
    const keep = new Set(["melee", "weapon", "armor", "lore"]);
    data.items = (data.items ?? []).filter(entry => keep.has(entry.type)).map(entry => {
        if (entry.type === "melee") foundry.utils.setProperty(entry, "system.attackEffects.value", []);
        return entry;
    });
    data.effects = [];
    data.name = `${original.name} (${spellName})`;
    foundry.utils.setProperty(data, "system.attributes.hp", { value: hp, max: hp, temp: 0 });
    foundry.utils.setProperty(data, "system.attributes.immunities", []);
    foundry.utils.setProperty(data, "system.attributes.weaknesses", []);
    foundry.utils.setProperty(data, "system.attributes.resistances", []);
    foundry.utils.setProperty(data, "system.traits.value", [...new Set([...(data.system?.traits?.value ?? []).filter(trait => trait !== "living"), "minion", "summoned"])]);
    foundry.utils.setProperty(data, "system.details.alliance", caster.alliance ?? caster.system?.details?.alliance ?? null);
    const casterToken = caster.getActiveTokens?.(true, true)?.[0] ?? null;
    data.ownership = { ...foundry.utils.deepClone(caster.ownership ?? {}), default: 0 };
    data.prototypeToken = { ...(data.prototypeToken ?? {}), actorLink: true, name: data.name, disposition: casterToken?.disposition ?? data.prototypeToken?.disposition };
    data.flags = { ...(data.flags ?? {}), [MODULE_ID]: { summoned: { castId, casterUuid: caster.uuid, spell: spellName, endsAtZero: true } } };
    const actor = await Actor.create(data);
    const scene = (originalToken?.document ?? originalToken)?.parent ?? canvas.scene;
    const near = originalToken?.document ?? originalToken;
    const size = Math.max(1, Number(near?.width ?? 1));
    const spot = [[size, 0], [-1, 0], [0, size], [0, -1], [size, size], [-1, -1]].map(([dx, dy]) => ({ x: (near?.x ?? 0) + dx * canvas.grid.size, y: (near?.y ?? 0) + dy * canvas.grid.size }))
        .find(point => !scene.tokens.some(token => token.x === point.x && token.y === point.y)) ?? { x: near?.x ?? 0, y: near?.y ?? 0 };
    const [token] = await scene.createEmbeddedDocuments("Token", [(await actor.getTokenDocument({ x: spot.x, y: spot.y, actorLink: true })).toObject()]);
    // (The copy's own Effect: its time is the spell's; it loses Hit Points after each of its turns; it may deal half damage.)
    const unit = seconds % 60 === 0 && seconds >= 60 ? "minutes" : "rounds";
    await actor.createEmbeddedDocuments("Item", [{ name: `${spellName}: copy`, type: "effect", img: "icons/svg/mystery-man.svg",
        flags: { [MODULE_ID]: { runtime: { schema: 1, kind: "copy-creature", castInstanceId: castId, sourceActorUuid: caster.uuid, sourceItemName: spellName, targetActorUuid: actor.uuid,
            turnEndHpLoss: hpLoss, ...(halfDamage ? { halfStrikeDamage: true } : {}) } } },
        system: { duration: { value: unit === "minutes" ? seconds / 60 : Math.max(1, Math.round(seconds / 6)), unit, expiry: "turn-start", sustained },
            description: { value: `<p>A copy of ${original.name} fighting for ${caster.name}: it can only Stride and Strike; its Strikes have no added effects${halfDamage ? " and deal half damage" : ""}. After each of its turns it loses ${hpLoss} Hit Points, and it can't regain Hit Points. It's gone at 0 Hit Points or when this ends.</p>${notes.map(note => `<p>${escapeHTML(note)}</p>`).join("")}` },
            start: { value: game.time.worldTime, initiative: null }, rules: [] } }]);
    const effect = (await caster.createEmbeddedDocuments("Item", [{ name: `${spellName}: ${original.name}'s copy`, type: "effect", img: "icons/svg/mystery-man.svg",
        flags: { [MODULE_ID]: { runtime: { schema: 1, kind: "rule-effect", sourceActorUuid: caster.uuid, sourceItemName: spellName, targetActorUuid: caster.uuid }, summon: { castId, actorUuid: actor.uuid, tokenUuid: token.uuid } } },
        system: { duration: { value: unit === "minutes" ? seconds / 60 : Math.max(1, Math.round(seconds / 6)), unit, expiry: "turn-start", sustained },
            description: { value: `<p>${escapeHTML(actor.name)} fights for you (a minion) while this lasts.</p>` }, start: { value: game.time.worldTime, initiative: game.combat?.combatant?.initiative ?? null }, rules: [] } }]))[0];
    return { actorUuid: actor.uuid, tokenUuid: token.uuid, effectUuid: effect.uuid, name: actor.name };
}

/** The creature whose turn just ended: the Hit Points its copy Effect says it loses (no resistances; it can't regain them). Active GM, once a turn. */
export async function turnEndHpLoss(combat) {
    if (!game.user?.isGM || game.users.activeGM?.id !== game.user.id || !combat?.started) return [];
    const previous = combat.previous?.combatantId ? combat.combatants.get(combat.previous.combatantId) : null;
    const ended = previous?.actor;
    if (!ended) return [];
    const stamp = `${combat.id}:${combat.previous.round}:${combat.previous.turn}`;
    // (A minion — PF2e keeps it out of the encounter — acts on its commander's turn: the copy loses its Hit Points when the caster's turn ends.)
    const minions = (canvas?.scene?.tokens?.contents ?? []).map(token => token.actor).filter(actor => actor && actor !== ended && actor.flags?.[MODULE_ID]?.summoned?.casterUuid === ended.uuid);
    const lost = [];
    for (const actor of [ended, ...new Set(minions)]) for (const effect of actor.itemTypes?.effect ?? []) {
        const data = effect.flags?.[MODULE_ID]?.runtime;
        if (!data?.turnEndHpLoss || effect.flags?.[MODULE_ID]?.turnEndStamp === stamp) continue;
        await effect.setFlag(MODULE_ID, "turnEndStamp", stamp);
        const roll = await new Roll(String(data.turnEndHpLoss)).evaluate();
        const hp = actor.system?.attributes?.hp;
        await actor.update({ "system.attributes.hp.value": Math.max(0, Number(hp?.value ?? 0) - roll.total) });
        await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<strong>${escapeHTML(data.sourceItemName)}</strong> — ${escapeHTML(actor.name)} loses Hit Points after its turn` });
        lost.push({ actorUuid: actor.uuid, amount: roll.total });
    }
    return lost;
}

/** A form's temporary Hit Points ending with it (Corrosive Body): what's left of them, when no other source gave more. */
export async function formTempHpExpiry(item) {
    if (!game.user?.isGM || game.users.activeGM?.id !== game.user.id || item?.type !== "effect") return null;
    const data = item.flags?.[MODULE_ID]?.formRiders, actor = item.actor;
    if (!data?.tempExpires || !actor || !(Number(data.tempGranted) > 0)) return null;
    const temp = Number(actor.system?.attributes?.hp?.temp ?? 0);
    if (!(temp > 0) || temp > Number(data.tempGranted)) return null;
    await actor.update({ "system.attributes.hp.temp": 0 });
    return temp;
}

/** A glyph's smaller meteor (Metallic Meteorite Glyph): the creature whose turn just ended rolls its basic save; the damage by its result. */
export async function turnEndSaves(combat) {
    if (!game.user?.isGM || game.users.activeGM?.id !== game.user.id || !combat?.started) return [];
    const previous = combat.previous?.combatantId ? combat.combatants.get(combat.previous.combatantId) : null;
    const actor = previous?.actor;
    if (!actor) return [];
    const stamp = `${combat.id}:${combat.previous.round}:${combat.previous.turn}`;
    const done = [];
    for (const effect of actor.itemTypes?.effect ?? []) {
        const data = effect.flags?.[MODULE_ID]?.runtime;
        if (!data?.turnEndSave || effect.flags[MODULE_ID].turnEndSaveStamp === stamp) continue;
        await effect.setFlag(MODULE_ID, "turnEndSaveStamp", stamp);
        const save = data.turnEndSave;
        // (Suffocation — Vacuum: the DC and the damage grow each turn; a failure deals the dice, a critical failure kills.)
        const suffocation = save.suffocation ?? null;
        const dc = Number(save.dc) + (suffocation ? suffocation.turns * suffocation.dcStep : 0);
        const roll = await actor.saves?.[save.statistic]?.roll({ dc: { value: dc }, skipDialog: true, extraRollOptions: suffocation ? [] : ["damaging-effect"] });
        const degree = Number(roll?.degreeOfSuccess ?? -1);
        if (degree < 0) continue;
        if (suffocation) {
            await effect.setFlag(MODULE_ID, "runtime.turnEndSave.suffocation.turns", suffocation.turns + 1);
            if (degree === 0) {
                await actor.update({ "system.attributes.hp.value": 0 });
                if (!actor.statuses?.has?.("dead")) await actor.toggleStatusEffect("dead", { active: true, overlay: true }).catch(() => null);
                try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p><strong>${escapeHTML(data.sourceItemName)}</strong>: ${escapeHTML(actor.name)} critically fails its suffocation save and dies.</p>` }); } catch (_) {}
                done.push({ actorUuid: actor.uuid, degree, died: true });
            } else if (degree === 1) {
                const damage = await new (damageRollClass())(`${suffocation.turns + 1}d${suffocation.die}`, {}, { rollerId: game.user.id }).evaluate();
                await damage.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<strong>${escapeHTML(data.sourceItemName)}</strong> — suffocating (DC ${dc} failed)` }).catch(() => null);
                await applyDamageWithReceipt(actor, { damage, token: actor.getActiveTokens?.(true, true)?.[0], rollOptions: new Set(), skipIWR: true }, foundry.utils.randomID());
                done.push({ actorUuid: actor.uuid, degree, total: damage.total });
            } else done.push({ actorUuid: actor.uuid, degree, total: 0 });
            continue;
        }
        // (A save that ends the Effect on a success — Wand of Dazzling Rays' blinded — rather than damage.)
        if (save.endsEffect) {
            if (degree >= 2) await effect.delete();
            done.push({ actorUuid: actor.uuid, degree, ended: degree >= 2 });
            continue;
        }
        const multiplier = [2, 1, 0.5, 0][degree];
        let total = 0;
        if (multiplier) {
            const damage = await new (damageRollClass())(save.formula.replace(/^(\d+d\d+)\[([a-z]+)\]$/, "{$1[$2]}"), {}, { rollerId: game.user.id }).evaluate();
            const dealt = multiplier === 1 ? damage : damage.alter(multiplier, 0);
            await dealt.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<strong>${escapeHTML(data.sourceItemName)}</strong> — the glyph's meteor (${["critical failure", "failure", "success", "critical success"][degree]})` });
            await applyDamageWithReceipt(actor, { damage: dealt, token: actor.getActiveTokens?.(true, true)?.[0], rollOptions: new Set(), skipIWR: false }, foundry.utils.randomID());
            total = dealt.total;
        }
        done.push({ actorUuid: actor.uuid, degree, total });
    }
    return done;
}

/** A form's turn-end recovery (Monstrosity Form's Inexorable): the listed conditions removed from the creature whose turn just ended. */
export async function turnEndRecovery(combat) {
    if (!game.user?.isGM || game.users.activeGM?.id !== game.user.id || !combat?.started) return [];
    const previous = combat.previous?.combatantId ? combat.combatants.get(combat.previous.combatantId) : null;
    const actor = previous?.actor;
    if (!actor) return [];
    const stamp = `${combat.id}:${combat.previous.round}:${combat.previous.turn}`;
    const removed = [];
    for (const effect of actor.itemTypes?.effect ?? []) {
        const data = effect.flags?.[MODULE_ID]?.formRiders?.turnEndRecovery;
        if (!data || effect.flags[MODULE_ID].recoveryStamp === stamp) continue;
        await effect.setFlag(MODULE_ID, "recoveryStamp", stamp);
        for (const slug of data.slugs) {
            const conditions = (actor.itemTypes?.condition ?? []).filter(condition => condition.slug === slug);
            if (!conditions.length) continue;
            // (A condition an Effect granted goes with that Effect; PF2e's own condition is removed.)
            for (const condition of conditions) {
                const granter = condition.grantedBy ?? (condition.flags?.pf2e?.grantedBy?.id ? actor.items.get(condition.flags.pf2e.grantedBy.id) : null);
                if (granter?.type === "effect") await granter.delete(); else await condition.delete();
            }
            removed.push(slug);
        }
        if (removed.length) try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p><strong>${escapeHTML(data.sourceItemName)}:</strong> ${escapeHTML(actor.name)} recovers from ${removed.map(escapeHTML).join(", ")} at the end of its turn.</p>` }); } catch (_) {}
    }
    return removed;
}

/** The attacker's copy Effect halves its Strike damage: the damage roll altered to half before PF2e applies it (its own rule for multipliers). */
export function halvedCopyDamage(params) {
    const signature = [...(params?.rollOptions ?? [])].find(option => typeof option === "string" && option.startsWith("origin:signature:"))?.slice("origin:signature:".length);
    if (!signature || typeof params?.damage?.alter !== "function") return params;
    const attackers = [...game.actors, ...(canvas?.scene?.tokens?.contents ?? []).map(token => token.actor).filter(Boolean)];
    const attacker = attackers.find(actor => actor.signature === signature);
    const halving = (attacker?.itemTypes?.effect ?? []).filter(effect => effect.flags?.[MODULE_ID]?.runtime?.halfStrikeDamage);
    if (!halving.length) return params;
    // (Undermine Reality: only its Strikes — a weapon's or an NPC's attack damage.)
    const options = [...(params?.rollOptions ?? [])];
    const strike = options.some(option => option === "action:strike" || /^item:type:(?:weapon|melee)$/.test(option));
    if (halving.every(effect => effect.flags[MODULE_ID].runtime.strikesOnly) && !strike) return params;
    return { ...params, damage: params.damage.alter(0.5, 0) };
}
