// A lance that impales until the creature Escapes (Stone Lance): "… Make a spell attack roll against the target. On a hit, you deal 6d6 piercing damage and the
// lance impales the creature, giving it a –10-foot circumstance penalty to its Speeds unless it Escapes. On a critical hit, if the creature is on the ground,
// the lance also embeds into the ground and {Immobilizes} the creature until it Escapes. A creature that Escapes after being impaled takes @Damage[3[bleed]]
// damage. When the spell ends, the lance crumbles into dirt, freeing the target if it hasn't Escaped." with "Heightened (+1) Increase the damage by 2d6 and
// the persistent bleed damage for Escapes by 1.": the spell attack's rows — the hit's damage and the Speed penalty until it Escapes (the spell's time at
// most), the critical hit's Immobilized too (a creature off the ground: the GM's) — and the persistent bleed dealt when it Escapes, heightened.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+)\}`;
const ATTACK = /^Make a spell attack roll against the target\.$/;
const HIT = /^On a hit, you deal (\d+)d(\d+) ([a-z]+) damage and the [a-z]+ impales the creature, giving it a [–-](\d+)-foot (circumstance|status) penalty to its Speeds unless it Escapes\.$/;
const CRIT = new RegExp(String.raw`^On a critical hit, if the creature is on the ground, the [a-z]+ also embeds into the ground and ${C} the creature until it Escapes\.$`);
const BLEED = /^A creature that Escapes after being impaled takes @Damage\[(\d+)\[bleed\]\] damage\.$/;
const ENDS = /^When the spell ends, the [a-z]+ crumbles into [a-z]+, freeing the target if it hasn't Escaped\.$/;
const STEP = /^Heightened \(\+1\) Increase the damage by (\d+)d(\d+) and the persistent bleed damage for Escapes by (\d+)\.$/;
const CONDITION_NAMES = { Immobilizes: "Immobilized" };

/** {html, escapeDamage, reminder, sentences} or null. */
export function rewriteImpalingLance(adapted) {
    if (adapted.defense?.kind === "save" || !/^1 creature$/.test(String(adapted.targeting?.target ?? "").trim()) || !/^\d+ (?:minute|round)s?$/.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const components = adapted.damageComponents ?? [];
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length || components.length !== 1 || components[0].category) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = sentences.findIndex(sentence => ATTACK.test(sentence));
    if (at < 0 || sentences.length !== at + 5 || sentences.slice(0, at).some(sentence => /\d|@|\b(?:damage|save|bonus|penalty|condition)\b/i.test(sentence))) return null;
    const hit = HIT.exec(sentences[at + 1]), crit = CRIT.exec(sentences[at + 2]), bleed = BLEED.exec(sentences[at + 3]);
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!hit || !crit || !bleed || !ENDS.test(sentences[at + 4]) || !step || !CONDITION_NAMES[crit[2]]) return null;
    if (String(components[0].formula).replace(/\s+/g, "") !== `${hit[1]}d${hit[2]}` || String(components[0].type).toLowerCase() !== hit[3] || step[2] !== hit[2]
        || adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== 1 || String(adapted.heightening.damage?.[components[0].id] ?? "").replace(/\s+/g, "") !== `${step[1]}d${step[2]}`) return null;
    const held = `@UUID[${crit[1]}]{${CONDITION_NAMES[crit[2]]}}`;
    const penalty = `a –${hit[4]}-foot ${hit[5]} penalty to its Speeds until it Escapes`;
    return {
        html: `<p>${sentences.slice(0, at + 1).join(" ")}</p><hr /><p><strong>Critical Success</strong> The target takes double damage, is ${held} until it Escapes, and takes ${penalty}.</p>`
            + `<p><strong>Success</strong> The target takes full damage and ${penalty}.</p><p><strong>Failure</strong> The target is unaffected.</p>`
            + `<hr /><p><strong>Heightened (+1)</strong> Increase the damage by ${step[1]}d${step[2]}.</p>`,
        escapeDamage: { base: Number(bleed[1]), perRank: Number(step[3]), baseRank: Number(adapted.rank) || 1, type: "bleed", sourceText: sentences[at + 3] },
        reminder: { kind: "spell-note", text: `${sentences[at + 2]} Remove the Immobilized from a creature that isn't on the ground. ${sentences[at + 4]}`, sourceText: sentences[at + 2] },
        sentences: [...sentences, htmlToPlainText(heightened).trim()]
    };
}
