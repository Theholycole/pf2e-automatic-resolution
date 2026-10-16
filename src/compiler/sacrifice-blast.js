// A basic-save blast made by destroying the caster's own creature (user decision 2026-10-01: the card asks for the choice):
//   Final Sacrifice — "The target is immediately slain, and the explosion deals 6d6 fire damage to creatures within 20 feet of it with a basic
//   Reflex save." / "If the target has the cold or water trait, the spell deals cold damage and has the cold trait instead of the fire trait." /
//   "Attempting to cast this spell targeting a creature that you temporarily seized control of, … automatically fails and breaks the controlling
//   effect."
//   Bony Barrage — "Destroy the target thrall, and each creature in a 30-foot cone originating from the thrall's former space takes 2d10 piercing
//   damage with a basic Reflex save." / "You can destroy a second thrall in the cone's area to cover you and any allies in the area in bone
//   armor." / "If you do, you and affected allies take no damage from this spell and gain a +1 status bonus to AC until the start of your next
//   turn."
// Rewritten to the ordinary basic save of the creatures in the area. The card asks for the minion (a token with the minion trait, which is
// slain — PF2e's Dead status — and whose cold or water trait makes the damage cold; the GM confirms the caster summoned or permanently controls
// it), or reminds the GM to remove the thrall (thralls are marks on the map); Bony Barrage's card asks whether a second thrall is destroyed —
// then the caster and its allies among the targets take no damage and get the AC bonus until the start of the caster's next turn.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_NO_TERRAIN as NARRATION_RULES, SPELL_EFFECT_LINK_ANY as LINK } from "./text-patterns.js";

const MINION_BLAST = /^The target is immediately slain, and the explosion deals (\d+)d(\d+) ([a-z]+) damage to creatures within (\d+) feet of it with a basic (Fortitude|Reflex|Will) save\.$/;
const TRAIT_TYPE = /^If the target has the ([a-z]+) or ([a-z]+) trait, the spell deals ([a-z]+) damage and has the \3 trait instead of the ([a-z]+) trait\.$/;
const SEIZED = /^Attempting to cast this spell targeting a creature that you temporarily seized control of, such as [^,]+, automatically fails and breaks the controlling effect\.$/;
const THRALL_BLAST = /^Destroy the target thrall, and each creature in a (\d+)-foot (cone|burst|line) originating from the thrall's former space takes (\d+)d(\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\.$/;
const SECOND = /^You can destroy a second thrall in the [a-z]+'s area to cover you and any allies in the area in bone armor\.$/;
const ARMOR = /^If you do, you and affected allies take no damage from this spell and gain a \+(\d) status bonus to AC until the start of your next turn\.$/;

/** {html, sacrifice, boneArmor?, sentences} or null. */
export function extractSacrificeBlast(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const target = String(adapted.targeting?.target ?? "").trim();
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length > 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    // (PF2e 8.6 links its own "Spell Effect: Bony Barrage" — the bone armor's +1 to AC — after the text: read and left, the card's bone armor gives it.)
    const link = LINK.test(sentences.at(-1) ?? "") ? sentences.pop() : null;
    const statistic = adapted.defense.statistic;
    const matches = (dice, faces, type, save) => `${dice}d${faces}` === String(components[0].formula).replace(/\s+/g, "") && type === String(components[0].type).toLowerCase()
        && save.toLowerCase() === statistic;
    let parsed = null;
    if (/^1 creature with the minion trait that you summoned or permanently control$/i.test(target)) {
        const at = sentences.findIndex(sentence => MINION_BLAST.test(sentence));
        if (at < 0 || at > 1 || sentences.length !== at + 3 || (at === 1 && NARRATION_RULES.test(sentences[0]))) return null;
        const blast = MINION_BLAST.exec(sentences[at]), swap = TRAIT_TYPE.exec(sentences[at + 1]);
        if (!blast || !swap || !SEIZED.test(sentences[at + 2]) || !matches(blast[1], blast[2], blast[3], blast[5]) || swap[4] !== blast[3]) return null;
        parsed = { area: { type: "emanation", value: Number(blast[4]) }, dice: `${blast[1]}d${blast[2]}`, type: blast[3], save: blast[5],
            sacrifice: { pick: "minion", trait: "minion", slain: true, typeByTrait: { traits: [swap[1], swap[2]], type: swap[3], replaces: blast[3] },
                question: "Is this a creature the caster summoned or permanently controls? A creature it only temporarily seized control of makes the spell fail and breaks the control.",
                sourceText: sentences[at] }, sentences: sentences.slice(at) };
    } else if (/^(?:1|one) of your thralls$/i.test(target)) {
        const at = sentences.findIndex(sentence => THRALL_BLAST.test(sentence));
        if (at < 0 || at > 1 || sentences.length !== at + 3 || (at === 1 && NARRATION_RULES.test(sentences[0]))) return null;
        const blast = THRALL_BLAST.exec(sentences[at]), armor = ARMOR.exec(sentences[at + 2]);
        if (!blast || !SECOND.test(sentences[at + 1]) || !armor || !matches(blast[3], blast[4], blast[5], blast[6])) return null;
        parsed = { area: { type: blast[2], value: Number(blast[1]) }, dice: `${blast[3]}d${blast[4]}`, type: blast[5], save: blast[6],
            sacrifice: { pick: "thrall", slain: true, reminder: `Destroy the target thrall (remove its mark): the ${blast[1]}-foot ${blast[2]} starts from its former space.`, sourceText: sentences[at] },
            boneArmor: { question: "Destroy a second thrall in the area for bone armor? You and your allies in the area take no damage and gain the AC bonus.",
                ac: Number(armor[1]), sourceText: `${sentences[at + 1]} ${sentences[at + 2]}` }, sentences: sentences.slice(at) };
    } else return null;
    if (Number(adapted.targeting?.area?.value) !== parsed.area.value || adapted.targeting?.area?.type !== parsed.area.type) return null;
    // "Heightened (+1) The damage increases by XdY.": the item's own heightening.
    const entries = rest.length ? [...rest[0].matchAll(/<p>[\s\S]*?<\/p>/gi)].map(match => match[0].trim()) : [];
    if (entries.length > 1) return null;
    if (entries.length) {
        const step = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The damage increases by (\d+d\d+)\.\s*<\/p>$/.exec(entries[0]);
        if (!step || !(adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(step[1]) && adapted.heightening.damage?.[components[0].id] === step[2])) return null;
    }
    if (link && !parsed.boneArmor) return null;
    return { html: `<p>Each creature in the area takes ${parsed.dice} ${parsed.type} damage (basic ${parsed.save} save).</p>`, sacrifice: parsed.sacrifice,
        ...(parsed.boneArmor ? { boneArmor: parsed.boneArmor } : {}), sentences: link ? [...parsed.sentences, link] : parsed.sentences };
}
