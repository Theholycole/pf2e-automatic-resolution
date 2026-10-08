// Overwhelming Festivities: an enemy holding the caster's aura Effect (it's in the emanation) that fails a save against an emotion effect, or newly becomes
// Frightened, takes the spell's persistent damage at the cast rank. The active GM applies it; persistent damage of one type doesn't stack, so a save and the
// Frightened it gives land as one.
import { escapeHTML, MODULE_ID, activeGM } from "./runtime-utils.js";
import { applyDamageWithReceipt } from "./native-damage-receipt.js";

/** The caster's aura Effect behind the enemy's granted Effect, or null. */
async function auraFor(actor) {
    for (const effect of actor?.itemTypes?.effect ?? []) {
        const source = effect._stats?.compendiumSource ?? effect.flags?.core?.sourceId ?? effect.sourceId ?? "";
        const originUuid = effect.system?.context?.origin?.actor ?? null;
        if (!originUuid) continue;
        const caster = await fromUuid(originUuid);
        const aura = (caster?.itemTypes?.effect ?? []).find(candidate => candidate.flags?.[MODULE_ID]?.triggerAura && candidate.flags[MODULE_ID].triggerAura.granted
            && (source === candidate.flags[MODULE_ID].triggerAura.granted || source.endsWith(candidate.flags[MODULE_ID].triggerAura.granted.split(".").pop())));
        if (aura && caster !== actor) return { aura, caster };
    }
    return null;
}

async function hurt(actor, found, why) {
    const data = found.aura.flags[MODULE_ID].triggerAura;
    const DamageRoll = (CONFIG.Dice?.rolls ?? []).find(candidate => candidate?.name === "DamageRoll");
    const formula = String(data.formula).replace(/@item\.(?:rank|level)\b/g, String(Number(data.castRank)));
    const roll = await new DamageRoll(`(${formula})[persistent,${data.type}]`).evaluate();
    const spell = data.spellUuid ? await fromUuid(data.spellUuid) : null;
    try { await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: found.caster }), flavor: `<strong>${escapeHTML(data.spellName)}</strong>: ${escapeHTML(actor.name)} ${escapeHTML(why)}` }); } catch (_) {}
    const token = actor.getActiveTokens?.()?.[0]?.document;
    return applyDamageWithReceipt(actor, { damage: roll, token: token ?? undefined, item: spell ?? undefined, rollOptions: new Set(), skipIWR: false }, foundry.utils.randomID());
}

/** PF2e's saving-throw message: a failure against an effect with the trait. */
export async function triggerAuraOnSave(message) {
    if (!activeGM()) return null;
    const context = message?.flags?.pf2e?.context;
    if (context?.type !== "saving-throw" || !["failure", "criticalFailure"].includes(context.outcome)) return null;
    const actor = message.actor;
    const found = actor ? await auraFor(actor) : null;
    if (!found) return null;
    const trait = found.aura.flags[MODULE_ID].triggerAura.trait;
    const options = context.options ?? [];
    if (!options.includes(trait) && !options.includes(`item:trait:${trait}`) && !(context.traits ?? []).some(entry => (entry?.name ?? entry) === trait)) return null;
    return hurt(actor, found, `failed a save against an ${trait} effect`);
}

/** A condition just gained: the stated one, from an effect. */
export async function triggerAuraOnCondition(item) {
    if (!activeGM() || item?.type !== "condition" || !item.actor) return null;
    const found = await auraFor(item.actor);
    if (!found || item.slug !== found.aura.flags[MODULE_ID].triggerAura.condition) return null;
    return hurt(item.actor, found, `became ${item.slug}`);
}
