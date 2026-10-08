// The witch's familiar abilities that act "When you Cast or Sustain a hex" (Witches: Familiar of …; docs/planning/third-party-features-audit.md), read from their texts. On a hex
// cast (or PF2e's Sustain card while a hex lasts):
// - an aura's Effect on the creatures within its distance of the familiar (Churning Saltwater, Faraway Worlds), for its round;
// - the module's Effect on the targeted creature, on the familiar, or both (Murky Worlds, Keen Senses, Illogical Forms);
// - a condition or a choice on the targeted creature (Sunlit Dawn's dazzled; Reprising Melody's frightened reduced or deafened);
// - Stumbling Steps' 5-foot push of an off-guard targeted creature (away from the familiar), or off-guard when it can't move;
// - the rest a reminder to the GM (terrain, flanking, reactions, flat checks, prolonged effects).
import { shapeEffect, riderChoice, tokensWithin } from "./spellshape-runtime.js";
import { forcedMove } from "./forced-movement.js";
import { MODULE_ID, activeGM, escapeHTML, familiarOf, plainText } from "./runtime-utils.js";

const itemUuid = uuid => uuid.replace(/^(Compendium\.[^.]+\.[^.]+)\.(?!Item\.)/, "$1.Item.");
const EFFECT = String.raw`@UUID\[([^\]]+)\]\{(Effect: [^}]+)\}`;
const COND = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.(?:Item\.)?[A-Za-z0-9]+\]\{([A-Za-z-]+)\}`;

const FORMS = [
    // Churning Saltwater: "All creatures within a 10-foot emanation of the familiar take a -1 circumstance penalty …"; Faraway Worlds: "for 1 round in a 15-foot emanation, giving
    // creatures in the area …".
    [new RegExp(String.raw`(?:All creatures within a @Template\[type:emanation\|distance:(\d+)\] of the familiar|for 1 round in a @Template\[type:emanation\|distance:(\d+)\], giving creatures in the area).*${EFFECT}`),
        m => ({ mode: "aura", radius: Number(m[1] ?? m[2]), effect: { uuid: itemUuid(m[3]), name: m[4] } })],
    // Illogical Forms: "your familiar gains one of the following familiar abilities and grants the same familiar ability to one ally of your choice within 30 feet …".
    [new RegExp(String.raw`your familiar gains one of the following familiar abilities and grants the same familiar ability to one ally of your choice within (\d+) feet .*${EFFECT}`),
        m => ({ mode: "familiar-and-target", within: Number(m[1]), effect: { uuid: itemUuid(m[2]), name: m[3] } })],
    // Murky Worlds: "your familiar can grant a creature within 30 feet the ability to ignore non-magical concealment …".
    [new RegExp(String.raw`your familiar can grant a creature within (\d+) feet .*${EFFECT}`), m => ({ mode: "target", within: Number(m[1]), effect: { uuid: itemUuid(m[2]), name: m[3] } })],
    // Keen Senses: "your familiar gains your choice of a precise scent, tremorsense, or wavesense … Effect: Familiar of Keen senses".
    [new RegExp(String.raw`your familiar gains your choice of .*${EFFECT}`), m => ({ mode: "familiar", effect: { uuid: itemUuid(m[1]), name: m[2] } })],
    // Sunlit Dawn: "the creature becomes Dazzled until the beginning of your next turn or until it spends an Interact action to rub its eyes."
    [new RegExp(String.raw`your familiar chooses one creature within (\d+) feet that can see it and is also in bright light, and the creature becomes ${COND} until the beginning of your next turn (or until it spends an Interact action to rub its eyes\.)`),
        m => ({ mode: "target-condition", within: Number(m[1]), slug: m[2].toLowerCase(), until: "caster-turn-start", table: [`It ends early ${m[3].replace(/^or until/, "if")}`] })],
    // Reprising Melody: "reducing their Frightened condition by 1 or giving them the Deafened condition until the beginning of their next turn, your choice."
    [new RegExp(String.raw`flood a single creature within (\d+) feet with music, reducing their ${COND} condition by (\d) or giving them the ${COND} condition until the beginning of their next turn, your choice\.`),
        m => ({ mode: "target-choice", within: Number(m[1]), reduce: { slug: m[2].toLowerCase(), by: Number(m[3]) }, give: { slug: m[4].toLowerCase(), rounds: 1 } })],
    // Stumbling Steps: "a creature within 15 feet that is Off-Guard to you to move 5 feet in a direction of your choice. If the creature is unable to move in the direction you chose, it
    // instead becomes off-guard until the beginning of its next turn."
    [new RegExp(String.raw`cause a creature within (\d+) feet that is ${COND} to you to move (\d+) feet in a direction of your choice\. If the creature is unable to move in the direction you chose, it instead becomes off-guard until the beginning of its next turn\.`),
        m => ({ mode: "target-push", within: Number(m[1]), requires: m[2].toLowerCase(), feet: Number(m[3]) })]
];
export function readHexFamiliar(source) {
    const text = plainText(source?.system?.description?.value);
    const lead = /When you Cast or Sustain a hex, (.+)$/.exec(text);
    if (!lead) return null;
    for (const [pattern, build] of FORMS) { const m = pattern.exec(text); if (m) return { name: source.name, ...build(m) }; }
    // (The links and inline rolls in words: "10-foot emanation", "DC 15 flat check", the damage's formula.)
    const words = lead[1].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")
        .replace(/@Template\[type:([a-z]+)\|distance:(\d+)\](?:\{([^}]+)\})?/g, (all, type, feet, label) => label ?? `${feet}-foot ${type}`)
        .replace(/@Check\[type:flat\|dc:(\d+)\](?:\{([^}]+)\})?/g, (all, dc, label) => label ?? `DC ${dc} flat check`)
        .replace(/@Damage\[((?:[^\[\]]|\[[^\]]*\])+)\](?:\{([^}]+)\})?/g, (all, formula, label) => label ?? formula);
    return { name: source.name, mode: "note", text: words };
}
const abilitiesOf = actor => [...(actor?.itemTypes?.action ?? []), ...(actor?.itemTypes?.feat ?? [])].map(item => readHexFamiliar(item.toObject())).filter(Boolean);

async function moduleEffect(target, effect, caster) {
    const template = await fromUuid(effect.uuid).catch(() => null);
    if (!template) return null;
    const source = template.toObject(); delete source._id;
    foundry.utils.setProperty(source, "_stats.compendiumSource", effect.uuid);
    foundry.utils.setProperty(source, "system.context", { origin: { actor: caster.uuid, token: null, item: null, spellcasting: null, rollOptions: [] }, target: null, roll: null });
    const combat = game.combat?.started ? game.combat : null;
    source.system.start = { value: game.time.worldTime, initiative: combat?.combatant?.initiative ?? null };
    const [made] = await target.createEmbeddedDocuments("Item", [source]);
    return made;
}

/** A hex cast or Sustained: the caster's familiar abilities. */
export async function hexFamiliarOnCast(message) {
    if (!activeGM()) return null;
    const isCast = message?.flags?.pf2e?.casting && (message.item?.system?.traits?.value ?? []).includes("hex");
    // (PF2e's Sustain card while one of the caster's hexes lasts.)
    const isSustain = !message?.flags?.pf2e?.context?.type && ["sustain", "sustain-a-spell"].includes(message?.item?.slug ?? "");
    if (!isCast && !isSustain) return null;
    const caster = message.actor;
    const abilities = abilitiesOf(caster);
    if (!abilities.length) return null;
    const familiar = familiarOf(caster);
    const familiarToken = familiar?.getActiveTokens?.(true, true)?.[0] ?? null;
    const target = [...game.user.targets].find(token => token.actor && token.actor !== caster)?.actor ?? null;
    const results = [];
    for (const ability of abilities) try {
        if (ability.mode === "aura") {
            if (!familiarToken) { results.push(`${ability.name}: no familiar on the scene`); continue; }
            // ("causing others to be easily manipulated": not the witch.)
            const caught = tokensWithin(familiarToken, ability.radius).filter(token => token.actor !== familiar && token.actor !== caster);
            for (const token of caught) await moduleEffect(token.actor, ability.effect, caster);
            results.push(`${ability.name}: ${ability.effect.name} on ${caught.map(token => token.name).join(", ") || "no one"} (within ${ability.radius} feet of the familiar)`);
        } else if (ability.mode === "familiar" || ability.mode === "familiar-and-target") {
            if (familiar) await moduleEffect(familiar, ability.effect, caster);
            if (ability.mode === "familiar-and-target" && target) await moduleEffect(target, ability.effect, caster);
            results.push(`${ability.name}: ${ability.effect.name} on ${[familiar?.name, ability.mode === "familiar-and-target" ? target?.name : null].filter(Boolean).join(" and ") || "no one"}`);
        } else if (ability.mode === "target") {
            if (target) await moduleEffect(target, ability.effect, caster);
            results.push(`${ability.name}: ${target ? `${ability.effect.name} on ${target.name}` : "target the creature and use it again"}`);
        } else if (ability.mode === "target-condition") {
            if (target) {
                const row = (await game.packs.get("pf2e.conditionitems").getIndex()).find(entry => entry.name.toLowerCase() === ability.slug);
                await shapeEffect(target, caster, `${ability.name}: ${ability.slug}`, [{ key: "GrantItem", uuid: `Compendium.pf2e.conditionitems.Item.${row._id}`, onDeleteActions: { grantee: "cascade" } }],
                    { until: ability.until, rounds: 1, description: ability.table.join(" ") });
            }
            results.push(`${ability.name}: ${target ? `${target.name} ${ability.slug} until the start of ${caster.name}'s next turn` : "target the creature"}`);
        } else if (ability.mode === "target-choice") {
            if (target) {
                const choice = await riderChoice({ name: ability.name, choice: caster.getFlag(MODULE_ID, "passiveChoices")?.[ability.name] ?? null }, "Reduce frightened or give deafened?",
                    [{ value: "reduce", label: `Reduce ${ability.reduce.slug} by ${ability.reduce.by}` }, { value: "give", label: `${ability.give.slug}` }]);
                if (choice === "give") {
                    const row = (await game.packs.get("pf2e.conditionitems").getIndex()).find(entry => entry.name.toLowerCase() === ability.give.slug);
                    await shapeEffect(target, caster, `${ability.name}: ${ability.give.slug}`, [{ key: "GrantItem", uuid: `Compendium.pf2e.conditionitems.Item.${row._id}`, onDeleteActions: { grantee: "cascade" } }], { rounds: ability.give.rounds });
                    results.push(`${ability.name}: ${target.name} ${ability.give.slug}`);
                } else {
                    for (let step = 0; step < ability.reduce.by; step++) if (target.hasCondition?.(ability.reduce.slug)) await target.decreaseCondition(ability.reduce.slug);
                    results.push(`${ability.name}: ${target.name}'s ${ability.reduce.slug} reduced`);
                }
            } else results.push(`${ability.name}: target the creature`);
        } else if (ability.mode === "target-push") {
            const tokenDoc = target?.getActiveTokens?.(true, true)?.[0] ?? null;
            if (!tokenDoc || !target.hasCondition?.(ability.requires)) { results.push(`${ability.name}: ${target ? `${target.name} isn't ${ability.requires}` : "target the creature"}`); continue; }
            const from = familiarToken ?? caster.getActiveTokens?.(true, true)?.[0] ?? null;
            const size = canvas.grid.size;
            const point = from ? { x: from.x + Number(from.width ?? 1) * size / 2, y: from.y + Number(from.height ?? 1) * size / 2 } : null;
            const moved = point ? await forcedMove(tokenDoc, { point, direction: "away", feet: ability.feet, reason: ability.name }).catch(() => null) : null;
            if (!moved?.moved) await shapeEffect(target, caster, `${ability.name}: off-guard`, [{ key: "GrantItem", uuid: "Compendium.pf2e.conditionitems.Item.AJh5ex99aV6VTggg", onDeleteActions: { grantee: "cascade" } }], { rounds: 1 });
            results.push(`${ability.name}: ${target.name} ${moved?.moved ? `moved ${moved.squares * 5} feet` : "can't move: off-guard until its next turn"}`);
        } else results.push(`${ability.name} (GM): ${ability.text}`);
    } catch (error) { results.push(`${ability.name}: failed (${error.message})`); }
    try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), whisper: game.users.filter(user => user.isGM).map(user => user.id),
        content: `<section class="pf2e-auto-runtime-card">${results.map(text => `<p>${escapeHTML(text)}</p>`).join("")}</section>` }); } catch (_) {}
    return results;
}
