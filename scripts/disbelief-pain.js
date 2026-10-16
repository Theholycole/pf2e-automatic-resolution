// A caster's feat that hurts a creature disbelieving its illusion (And Yet it Still Hurts, PF2e 8.6): "Whenever a creature attempts to disbelieve one of your
// illusion spells, it takes nonlethal mental damage equal to twice the spell's rank regardless of the outcome." Read from the caster's feats' text (never
// their names); after each attempt the module rolls (whatever its result), the creature takes that damage; damage that brings it to 0 knocks it out.
import { MODULE_ID } from "./runtime-utils.js";
import { applyDamageWithReceipt } from "./native-damage-receipt.js";

const PAIN = /Whenever a creature attempts to disbelieve one of your illusion spells, it takes nonlethal ([a-z]+) damage equal to (twice|three times)? ?the spell's rank regardless of the outcome\./;
const plain = html => String(html ?? "").replace(/<[^>]+>/g, " ").replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim();
const escapeHTML = value => foundry.utils.escapeHTML?.(String(value ?? "")) ?? String(value ?? "");

/** The caster's rule, {damageType, multiple, feat} or null. */
export function disbeliefPainRule(caster) {
    for (const item of caster?.itemTypes?.feat ?? []) {
        const match = PAIN.exec(plain(item.system?.description?.value));
        if (match) return { damageType: match[1], multiple: match[2] === "three times" ? 3 : match[2] === "twice" ? 2 : 1, feat: item.name };
    }
    return null;
}

/** After a disbelief attempt against the caster's illusion spell: the nonlethal damage, or null when the caster has no such rule or the spell isn't an illusion. */
export async function disbeliefPain({ casterUuid, itemUuid = null, rank, target, spellName = null }) {
    const caster = casterUuid ? await fromUuid(casterUuid).catch(() => null) : null;
    const rule = disbeliefPainRule(caster);
    if (!rule || !target || !Number.isFinite(Number(rank))) return null;
    const spell = itemUuid ? await fromUuid(itemUuid).catch(() => null) : null;
    // (Only an illusion spell: the item's traits when it's still there.)
    if (spell && !(spell.system?.traits?.value ?? []).includes("illusion")) return null;
    const amount = rule.multiple * Number(rank);
    const DamageRoll = CONFIG.Dice.rolls.find(cls => cls.name === "DamageRoll");
    const roll = await new DamageRoll(`${amount}[${rule.damageType}]`).evaluate();
    const before = Number(target.hitPoints?.value ?? 0);
    const receipt = await applyDamageWithReceipt(target, { damage: roll, token: target.getActiveTokens?.(true, true)?.[0] ?? undefined, skipIWR: false, rollOptions: new Set(["nonlethal"]) }, foundry.utils.randomID());
    // (Nonlethal: brought to 0 Hit Points, it's knocked out rather than dying.)
    if (before > 0 && Number(target.hitPoints?.value ?? 1) <= 0) {
        for (const condition of (target.itemTypes?.condition ?? []).filter(entry => entry.slug === "dying")) await condition.delete().catch(() => null);
        if (!target.hasCondition?.("unconscious")) await target.increaseCondition("unconscious").catch(() => null);
    }
    try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), flags: { [MODULE_ID]: { disbeliefPain: { targetUuid: target.uuid, amount } } },
        content: `<p><strong>${escapeHTML(rule.feat)}</strong>: ${escapeHTML(target.name)} tried to disbelieve ${escapeHTML(spellName ?? "the illusion")} and takes ${escapeHTML(receipt?.damage ?? amount)} nonlethal ${escapeHTML(rule.damageType)} damage.</p>` }); } catch (_) {}
    return { amount, dealt: receipt?.damage ?? null };
}
