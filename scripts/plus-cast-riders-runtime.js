// "+" features that act on a cast after it resolves (docs/planning/third-party-features-audit.md, the spell-modifier triage):
// - Stigmata (Clerics), its Heal part: "When you cast Heal on a single target other than yourself, they automatically end any ongoing persistent damage they are suffering from. If
//   you use the 3-action cast, targets instead get an immediate attempt to end any ongoing persistent damage they are suffering from by succeeding at a DC 11 flat check." — while the
//   cleric's own stigmata bleed (its Harm part: the persistent rider, plus-feature-rules.js).
// - Outsider Caller (Clerics): "When you Cast the Spell, you can choose to deal twice the spell rank in spirit damage in a 15-foot emanation around the summoned creature on a basic
//   Reflex save against your spell DC." — a card after a summon spell; its button for the summoned creature the GM targets.
import { startShapeCard, tokensWithin, shapeDC } from "./spellshape-runtime.js";

const MODULE_ID = "pf2e-automatic-resolution";
const activeGM = () => game.user?.isGM && game.users.activeGM?.id === game.user.id;
const plainText = html => String(html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().replace(/[’]/g, "'");
const escapeHTML = text => String(text ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const say = (actor, text) => ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p>${text}</p>` }).catch(() => null);

const STIGMATA_HEAL = /Heal When you cast @UUID\[[^\]]+\]\{Heal\} on a single target other than yourself, they automatically end any ongoing persistent damage they are suffering from\. If you use the 3-action cast, targets instead get an immediate attempt to end any ongoing persistent damage they are suffering from by succeeding at a @Check\[type:flat\|dc:(\d+)\]\./;
const OUTSIDER = /When you Cast the Spell, you can choose to deal twice the spell rank in (spirit) damage in a @Template\[type:emanation\|distance:(\d+)\] around the summoned creature on a basic (Reflex|Fortitude|Will) save against your spell DC\./;
// Ancient Surge, Bizarre Surge (Summoners+): "When you cast evolution surge you can choose from the following effects … Spell Effect: Ancient Surge" — the feat's Spell Effect beside
// Evolution Surge's on the eidolon (its choice the caster's, asked by the Effect).
const SURGE = /When you cast @UUID\[[^\]]+\]\{evolution surge\} you can choose from the following effects.*@UUID\[([^\]]+)\]\{(Spell Effect: [^}]+)\}$/i;
const EVOLUTION_SURGE = "Compendium.pf2e.spell-effects.Item.1XlF12UbvJsTZxfp";
export function readCastAfter(source) {
    const text = plainText(source?.system?.description?.value);
    let m;
    if (source?.type === "feat" && (m = SURGE.exec(text))) return { kind: "surge-addon", name: source.name, effect: { uuid: m[1].replace(/^(Compendium\.[^.]+\.[^.]+)\.(?!Item\.)/, "$1.Item."), name: m[2] } };
    if ((m = STIGMATA_HEAL.exec(text))) return { kind: "stigmata-heal", name: source.name, flatDC: Number(m[1]) };
    if ((m = OUTSIDER.exec(text))) return { kind: "summon-burst", name: source.name, type: m[1], radius: Number(m[2]), statistic: m[3].toLowerCase() };
    return null;
}
const featOf = (actor, kind) => (actor?.itemTypes?.feat ?? []).map(item => ({ item, read: readCastAfter(item.toObject()) })).find(entry => entry.read?.kind === kind) ?? null;
const bleeding = actor => (actor?.itemTypes?.condition ?? []).some(entry => entry.slug === "persistent-damage" && entry.system?.persistent?.damageType === "bleed");

/** Stigmata's Heal: a creature healed by the bleeding cleric's Heal (not the cleric) — its persistent damage ended, or a DC 11 flat check for each after the 3-action Heal. */
export async function stigmataOnHealing(message) {
    if (!activeGM() || message?.flags?.pf2e?.context?.type !== "damage-taken" || !message.flags.pf2e.appliedDamage?.isHealing) return null;
    const spell = message.flags.pf2e.origin?.uuid ? fromUuidSync(message.flags.pf2e.origin.uuid) : null;
    const caster = spell?.actor, target = message.actor;
    if (!spell || spell.slug !== "heal" || !caster || !target || target === caster || !bleeding(caster)) return null;
    const found = featOf(caster, "stigmata-heal");
    if (!found) return null;
    const cast = game.messages.contents.slice(-30).reverse().find(entry => entry.flags?.pf2e?.casting && entry.actor === caster && entry.item?.slug === "heal");
    const area = Boolean(cast?.item?.system?.area?.value) || Number(cast?.item?.system?.time?.value) === 3;
    const persistent = (target.itemTypes?.condition ?? []).filter(entry => entry.slug === "persistent-damage");
    if (!persistent.length) return { none: true };
    const ended = [];
    for (const condition of persistent) {
        if (area) {
            const roll = await new Roll("1d20").evaluate();
            await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: target }), flavor: `<strong>${escapeHTML(found.item.name)}</strong>: DC ${found.read.flatDC} flat check to end ${escapeHTML(condition.name)}` }).catch(() => null);
            if (roll.total < found.read.flatDC) continue;
        }
        ended.push(condition.name);
        await condition.delete();
    }
    await say(caster, `<strong>${escapeHTML(found.item.name)}</strong>: ${escapeHTML(target.name)}'s persistent damage ${ended.length ? `ended (${escapeHTML(ended.join(", "))})` : "not ended"}.`);
    return { ended, area };
}

/** Outsider Caller: a summon spell cast — its card, the burst around the summoned creature the GM targets. */
export async function summonBurstOnCast(message) {
    if (!activeGM() || !message?.flags?.pf2e?.casting) return null;
    const actor = message.actor, spell = message.item;
    if (!(spell?.system?.traits?.value ?? []).includes("summon")) return null;
    const found = featOf(actor, "summon-burst");
    if (!found) return null;
    const rank = Number(message.flags.pf2e.casting.castRank ?? spell.rank ?? 1);
    return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), flags: { [MODULE_ID]: { kind: "cast-after-card", summonBurst: { actorUuid: actor.uuid, spellUuid: spell.uuid, rank, ...found.read } } },
        content: `<section class="pf2e-auto-runtime-card"><p><strong>${escapeHTML(found.item.name)}</strong>: ${2 * rank} ${escapeHTML(found.read.type)} in a ${found.read.radius}-foot emanation around the summoned creature (basic ${escapeHTML(found.read.statistic)}), if you choose.</p><button type="button" data-pf2e-auto-cast-after="summon-burst">Burst around the targeted summoned creature</button></section>` });
}

export async function summonBurst(message) {
    const data = message.getFlag(MODULE_ID, "summonBurst");
    const actor = await fromUuid(data?.actorUuid ?? "").catch(() => null);
    const summoned = [...game.user.targets][0] ?? null;
    if (!actor || !data) throw new Error("This card's caster is gone.");
    if (!summoned) throw new Error("Target the summoned creature first.");
    if (data.used) throw new Error("Already used.");
    const spell = await fromUuid(data.spellUuid).catch(() => null);
    const caught = tokensWithin(summoned.document ?? summoned, data.radius).map(token => token.object ?? token);
    await message.setFlag(MODULE_ID, "summonBurst", { ...data, used: true });
    if (!caught.length) { await say(actor, `<strong>${escapeHTML(data.name)}</strong>: no creature around ${escapeHTML(summoned.name)}.`); return { caught: [] }; }
    return startShapeCard({ caster: actor, name: data.name, rank: data.rank, statistic: data.statistic, damage: { formula: String(2 * data.rank), type: data.type }, area: { type: "emanation", value: data.radius },
        targets: caught, dc: shapeDC(actor, spell), entryId: spell?.spellcasting?.id ?? actor.spellcasting?.regular?.[0]?.id ?? null });
}

export function bindCastAfterButtons(message, html) {
    for (const button of html.querySelectorAll?.("[data-pf2e-auto-cast-after]") ?? []) button.addEventListener("click", async () => {
        try { if (button.dataset.pf2eAutoCastAfter === "summon-burst") await summonBurst(message); } catch (error) { ui.notifications.error(error.message); }
    });
}

/** Evolution Surge's Spell Effect put on: the caster's surge feats' Spell Effects beside it, for its duration. */
export async function surgeAddonOnCreate(item) {
    if (!activeGM() || item?.type !== "effect" || !item.actor) return null;
    const source = item._stats?.compendiumSource ?? item.flags?.core?.sourceId ?? null;
    if (source !== EVOLUTION_SURGE && item.name !== "Spell Effect: Evolution Surge") return null;
    const casterUuid = item.system?.context?.origin?.actor ?? item.flags?.[MODULE_ID]?.runtime?.sourceActorUuid ?? null;
    const caster = casterUuid ? await fromUuid(casterUuid).catch(() => null) : null;
    const addons = (caster?.itemTypes?.feat ?? []).map(feat => ({ feat, read: readCastAfter(feat.toObject()) })).filter(entry => entry.read?.kind === "surge-addon");
    const made = [];
    for (const { feat, read } of addons) {
        const template = await fromUuid(read.effect.uuid).catch(() => null);
        if (!template) continue;
        const copy = template.toObject(); delete copy._id;
        foundry.utils.setProperty(copy, "_stats.compendiumSource", read.effect.uuid);
        copy.system.duration = foundry.utils.deepClone(item.system.duration);
        copy.system.start = foundry.utils.deepClone(item.system.start);
        copy.system.context = foundry.utils.deepClone(item.system.context);
        const [effect] = await item.actor.createEmbeddedDocuments("Item", [copy]);
        if (effect) made.push(effect.name);
        await say(caster, `<strong>${escapeHTML(feat.name)}</strong>: ${escapeHTML(read.effect.name)} on ${escapeHTML(item.actor.name)} with Evolution Surge.`);
    }
    return made;
}

