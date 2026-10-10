import { MODULE_ID } from "./effect-runtime.js";
import { escapeHTML, randomID } from "./runtime-utils.js";
import { applyDamageWithReceipt } from "./native-damage-receipt.js";

/**
 * Black Tentacles' attempt on one creature: one already held by this cast's tentacles takes the held damage; otherwise the caster's spell attack against its
 * stated DC, and on a success it's Grabbed by the tentacles (until it Escapes or the spell ends) and takes the capture damage — at the cast; a grab as a creature ends
 * its turn (`turnEnd`) deals none.
 */
export async function tentacleAttempt({ spell, actor, token, castId, castRank, data, skipDialog = true, turnEnd = false }) {
    const DamageRoll = (CONFIG.Dice?.rolls ?? []).find(candidate => candidate?.name === "DamageRoll");
    if (!DamageRoll) throw new Error("PF2e's damage roll is unavailable.");
    const speaker = ChatMessage.getSpeaker({ actor: spell.actor });
    const deal = async (part, label) => {
        const roll = await new DamageRoll(`{${part.formula}[${part.type}]}`).evaluate();
        try { await roll.toMessage({ speaker, flavor: `<strong>${escapeHTML(spell.name)}</strong>: ${escapeHTML(actor.name)} ${label}` }); } catch (_) {}
        return (await applyDamageWithReceipt(actor, { damage: roll, token: token ?? undefined, item: spell, rollOptions: new Set(), skipIWR: false }, randomID())).damage;
    };
    const held = (actor.itemTypes?.effect ?? []).find(effect => effect.flags?.[MODULE_ID]?.tentacleGrab === castId);
    if (held) return { status: "held", damage: await deal(data.held, "is crushed by the tentacles holding it") };
    const statistic = spell.spellcasting?.statistic;
    const dc = Number(actor.saves?.[data.defense]?.dc?.value ?? NaN);
    if (!statistic?.check?.roll || !Number.isFinite(dc)) throw new Error(`${spell.name}: the caster's spell attack or ${actor.name}'s ${data.defense} DC is unavailable.`);
    const roll = await statistic.check.roll({ dc: { value: dc }, item: spell, traits: [...new Set([...(spell.traits ?? []), "attack"])], extraRollOptions: ["attack", "item:trait:attack"], skipDialog });
    const degree = Number(roll?.degreeOfSuccess ?? -1);
    if (degree < 2) return { status: "missed", degree };
    const uuid = data.grabbed;
    const [effect] = await actor.createEmbeddedDocuments("Item", [{ name: `${spell.name}: Grabbed by the tentacles`, type: "effect", img: spell.img ?? "icons/svg/net.svg",
        flags: { [MODULE_ID]: { tentacleGrab: castId, areaLifetime: { castId } } },
        system: { level: { value: castRank }, duration: { value: -1, unit: "unlimited", expiry: null, sustained: false }, start: { value: game.time.worldTime, initiative: game.combat?.combatant?.initiative ?? null },
            description: { value: `<p>Grabbed by the tentacles until it Escapes (the spell DC) or the spell ends.</p>` }, rules: [{ key: "GrantItem", uuid, onDeleteActions: { grantee: "restrict" } }] } }]);
    // (A grab as a creature ends its turn deals no damage: only the creatures already held take the turn's damage — the user, 2026-10-10.)
    return { status: "grabbed", degree, effectUuid: effect.uuid, damage: turnEnd ? 0 : await deal(data.capture, "is caught by the tentacles") };
}
