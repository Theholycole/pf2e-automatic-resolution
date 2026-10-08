// Impossible spells (Pyroclastic Truth): the creatures a cast damaged are marked for the spell's duration (Effects in one Ongoing record),
// Fuel deals the persistent damage to every creature still marked, and the caster carries the lethologic mark (fire damage frightens; fire
// damage to 0 Hit Points kills). Healing the mark is a note on it.
import { escapeHTML, randomID, MODULE_ID } from "./runtime-utils.js";
import { applyDamageWithReceipt } from "./native-damage-receipt.js";

/** The marks on the damaged creatures, their Ongoing record (with Fuel), and the caster's lethologic mark (once). */
export async function startImpossibleMarks(ongoing, { spellName, spellSlug, sourceActor, sourceItemUuid, castRank, img, impossible, damaged, durationSeconds }) {
    const castId = randomID();
    const created = [];
    for (const actor of damaged) {
        const [mark] = await actor.createEmbeddedDocuments("Item", [{ name: `${spellName}: ${impossible.mark.label}`, type: "effect", img: img ?? "icons/svg/fire.svg",
            flags: { [MODULE_ID]: { runtime: { schema: 1, kind: "impossible-mark", castInstanceId: castId, sourceActorUuid: sourceActor.uuid, sourceItemName: spellName, targetActorUuid: actor.uuid,
                impossibleMark: { castRank, dieSize: impossible.fuel.dieSize, damageType: impossible.fuel.damageType } } } },
            system: { description: { value: `<p>Marked by ${escapeHTML(spellName)}: when the caster Fuels it, this creature takes ${castRank}d${impossible.fuel.dieSize} persistent ${escapeHTML(impossible.fuel.damageType)} damage.</p>` },
                duration: { value: Math.round(durationSeconds / 60), unit: "minutes", expiry: "turn-start", sustained: false }, level: { value: castRank }, rules: [], tokenIcon: { show: true }, traits: { value: [] },
                start: { value: game.time.worldTime, initiative: game.combat?.combatant?.initiative ?? null },
                context: { origin: { actor: sourceActor.uuid, item: sourceItemUuid }, target: { actor: actor.uuid }, roll: null } } }]);
        created.push(mark);
    }
    if (created.length && ongoing) {
        const journal = await ongoing.begin({ castId, name: spellName, kind: "native", sourceActorUuid: sourceActor.uuid, sourceItemUuid, recipientUuids: created.map(mark => mark.actor.uuid) });
        for (const mark of created) await ongoing.attach(journal, mark);
        await ongoing.activate(journal);
    }
    // The caster's lethologic mark: fire damage frightens, fire damage to 0 Hit Points kills. It stays until healed.
    const lethologic = impossible.lethologic;
    let markEffect = sourceActor.itemTypes.effect.find(effect => effect.flags?.[MODULE_ID]?.lethologic?.spell === spellSlug) ?? null;
    if (!markEffect) [markEffect] = await sourceActor.createEmbeddedDocuments("Item", [{ name: `Lethologic Mark (${spellName})`, type: "effect", img: img ?? "icons/svg/fire.svg",
        flags: { [MODULE_ID]: { lethologic: { spell: spellSlug, frightened: lethologic.frightened, deathAtZero: lethologic.deathAtZero } } },
        system: { description: { value: `<p>${escapeHTML(lethologic.text)}</p><p><strong>Automated:</strong> ${escapeHTML(lethologic.frightened.damageType)} damage makes you Frightened ${lethologic.frightened.value}; being reduced to 0 Hit Points by ${escapeHTML(lethologic.deathAtZero.damageType)} damage kills you.</p><p><strong>Healing the mark:</strong> ${escapeHTML(lethologic.healNote)} Delete this Effect once the mark is healed.</p>` },
            duration: { value: -1, unit: "unlimited", expiry: null, sustained: false }, rules: [], tokenIcon: { show: true }, traits: { value: [] },
            context: { origin: { actor: sourceActor.uuid, item: sourceItemUuid }, target: { actor: sourceActor.uuid }, roll: null } } }]);
    return { castId, marked: created.map(mark => mark.actor.uuid), lethologic: markEffect?.uuid ?? null };
}

/** Fuel: every creature still marked by this cast takes the persistent damage (PF2e's own damage application). */
export async function fuelImpossible(record) {
    const DamageRoll = (CONFIG.Dice?.rolls ?? []).find(candidate => candidate?.name === "DamageRoll");
    const results = [];
    for (const entry of record.entries.filter(candidate => candidate.status === "active" && candidate.metadata?.impossibleMark)) {
        const mark = await fromUuid(entry.uuid), actor = mark?.actor;
        if (!actor) continue;
        const data = entry.metadata.impossibleMark;
        const roll = await new DamageRoll(`${data.castRank}d${data.dieSize}[persistent,${data.damageType}]`).evaluate();
        const token = actor.getActiveTokens?.(true, true)?.[0] ?? undefined;
        await applyDamageWithReceipt(actor, { damage: roll, token, rollOptions: new Set(), skipIWR: false }, randomID());
        results.push({ actorUuid: actor.uuid, name: actor.name, formula: roll.formula });
    }
    try { await ChatMessage.create({ content: `<p><strong>${escapeHTML(record.name)}</strong> — Fuel: ${results.map(entry => `${escapeHTML(entry.name)} takes ${escapeHTML(entry.formula)}`).join("; ") || "no creature is still marked"}.</p>` }); } catch (_) {}
    return { status: "fuelled", results };
}

/** The lethologic mark's rules on a damage PF2e applied to its bearer (the active GM acts). */
export async function lethologicOnDamage(message) {
    const applied = message?.flags?.pf2e?.appliedDamage, context = message?.flags?.pf2e?.context;
    if (!applied || applied.isHealing || context?.type !== "damage-taken" || !game.user?.isGM || game.users.activeGM?.id !== game.user.id) return null;
    const actor = await fromUuid(applied.uuid);
    const mark = (actor?.itemTypes?.effect ?? []).find(effect => effect.flags?.[MODULE_ID]?.lethologic);
    if (!mark) return null;
    const data = mark.flags[MODULE_ID].lethologic;
    const options = new Set(context.options ?? []);
    const of = type => options.has(type) || options.has(`item:damage:type:${type}`) || options.has(`damage:type:${type}`)
        || (applied.persistent ?? []).some(entry => String(entry).includes(type));
    const out = {};
    const frightenedNow = Number(actor.getCondition?.("frightened")?.value ?? 0);
    if (of(data.frightened.damageType) && frightenedNow < data.frightened.value) {
        await actor.increaseCondition("frightened", { value: data.frightened.value - frightenedNow }); // (PF2e adds the value to an existing condition.)
        out.frightened = data.frightened.value;
    }
    if (of(data.deathAtZero.damageType) && Number(actor.system?.attributes?.hp?.value ?? 1) <= 0) {
        const max = Number(actor.system?.attributes?.dying?.max ?? 4);
        await actor.increaseCondition("dying", { value: max });
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p><strong>${escapeHTML(actor.name)}</strong> is reduced to 0 Hit Points by ${escapeHTML(data.deathAtZero.damageType)} damage while bearing the lethologic mark: they instantly die and are turned to ash.</p>` }); } catch (_) {}
        out.died = true;
    }
    return out;
}
