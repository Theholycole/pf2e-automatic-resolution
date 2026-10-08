// Gray Dust Ammunition (Alchemists+): "Activate 1 Interact This ammunition is infused with irradiated dust from the Mana Wastes, causing it to have volatile effects when fired at
// spellcasters. The first time they Cast a Spell for the next minute, they take 8d4 force damage with a DC 25 basic Fortitude save as their own magic backfires. On a critical failure,
// the creature is also Stupefied 2 for 1 round."
// Its card posted arms the shooter's next Strike; a hit marks the creature for a minute; its next cast opens the save card.
import { startShapeCard } from "./spellshape-runtime.js";

const MODULE_ID = "pf2e-automatic-resolution";
const activeGM = () => game.user?.isGM && game.users.activeGM?.id === game.user.id;
const STUPEFIED = "Compendium.pf2e.conditionitems.Item.e1XGnhKNSQIm5IXg";
const plainText = html => String(html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const GRAY_DUST = /The first time they Cast a Spell for the next (minute|(\d+) rounds?), they take @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage with a @Check\[(fortitude|reflex|will)\|dc:(\d+)\|basic\] save as their own magic backfires\. On a critical failure, the creature is also @UUID\[(Compendium\.pf2e\.conditionitems\.(?:Item\.)?[A-Za-z0-9]+)\]\{(Stupefied) (\d+)\} for (\d+) rounds?\./;
export function readBackfireAmmo(source) {
    const m = GRAY_DUST.exec(plainText(source?.system?.description?.value));
    if (!m) return null;
    return { rounds: m[1] === "minute" ? 10 : Number(m[2]), damage: { formula: m[3], type: m[4] }, statistic: m[5], dc: Number(m[6]),
        criticalFailure: { uuid: m[7].replace(/conditionitems\.(?!Item\.)/, "conditionitems.Item."), slug: m[8].toLowerCase(), value: Number(m[9]), rounds: Number(m[10]) } };
}

/** The ammunition's card: the shooter's next Strike carries it (actor flag `backfireAmmo`). */
export async function backfireAmmoOnCard(message) {
    if (!activeGM() || message?.flags?.pf2e?.context?.type || !["ammo", "consumable"].includes(message?.flags?.pf2e?.origin?.type)) return null;
    const item = await fromUuid(message.flags.pf2e.origin.uuid ?? "").catch(() => null);
    const read = item ? readBackfireAmmo(item.toObject()) : null;
    if (!read || !item.actor) return null;
    await item.actor.setFlag(MODULE_ID, "backfireAmmo", { name: item.name, read });
    return read;
}

/** The armed Strike: a hit marks the target for the duration; a miss spends the ammunition. */
export async function backfireAmmoOnStrike(message) {
    const context = message?.flags?.pf2e?.context;
    if (!activeGM() || context?.type !== "attack-roll") return null;
    const actor = message.actor;
    const armed = actor?.getFlag(MODULE_ID, "backfireAmmo");
    if (!armed) return null;
    await actor.unsetFlag(MODULE_ID, "backfireAmmo");
    if (!["success", "criticalSuccess"].includes(context.outcome)) return { missed: true };
    const target = await fromUuid(context.target?.actor ?? "").catch(() => null);
    if (!target) return null;
    const combat = game.combat?.started ? game.combat : null;
    const [mark] = await target.createEmbeddedDocuments("Item", [{ name: `${armed.name}: backfire on the next spell`, type: "effect", img: "icons/magic/unholy/orb-glowing-purple.webp",
        flags: { [MODULE_ID]: { backfireMark: { ...armed.read, name: armed.name, shooterUuid: actor.uuid } } },
        system: { duration: { value: armed.read.rounds, unit: "rounds", expiry: "turn-start", sustained: false }, start: { value: game.time.worldTime, initiative: combat?.combatant?.initiative ?? null }, tokenIcon: { show: true },
            description: { value: `<p>The first time this creature Casts a Spell, it takes ${armed.read.damage.formula} ${armed.read.damage.type} damage (DC ${armed.read.dc} basic ${armed.read.statistic}); on a critical failure, also ${armed.read.criticalFailure.slug} ${armed.read.criticalFailure.value} for ${armed.read.criticalFailure.rounds} round.</p>` } } }]);
    return { marked: target.uuid, effect: mark?.uuid ?? null };
}

/** The marked creature's cast: the save card, then the mark goes. */
export async function backfireAmmoOnCast(message) {
    if (!activeGM() || !message?.flags?.pf2e?.casting) return null;
    const actor = message.actor;
    const mark = (actor?.itemTypes?.effect ?? []).find(effect => effect.flags?.[MODULE_ID]?.backfireMark);
    if (!mark) return null;
    const data = mark.flags[MODULE_ID].backfireMark;
    await mark.delete();
    const token = actor.getActiveTokens?.(true, false)?.[0] ?? null;
    if (!token) return null;
    const crit = data.criticalFailure;
    // ("as their own magic backfires": the card is the creature's own, through the entry it cast from — PF2e rolls a spell's damage only through one.)
    const entryId = message.item?.spellcasting?.id ?? message.flags?.pf2e?.casting?.id ?? actor.itemTypes?.spellcastingEntry?.[0]?.id ?? null;
    return startShapeCard({ caster: actor, name: data.name, rank: 1, statistic: data.statistic, damage: data.damage, targets: [token], dc: data.dc, entryId,
        riders: [{ type: "conditions", degrees: { criticalFailure: [{ uuid: crit.uuid, slug: crit.slug, value: crit.value, rounds: crit.rounds }] } }] });
}
