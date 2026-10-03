// A touch at mythic proficiency that launches its target by the actions spent (Banishing Touch):
//   "Make a melee spell attack at mythic proficiency against your target's AC." / "If you hit, you deal 1d6 bludgeoning damage, and you launch the
//   target into the air and away from you; the target takes falling damage as normal." / "The number of actions you spend while Casting the Spell
//   determines the damage dealt by your touch and how far the target is launched." with the rows (1) "The target is launched 10 feet into the
//   air and knocked back 10 feet." (2) "Your touch deals 2d6 bludgeoning damage instead. The target is launched 20 feet into the air and pushed
//   back 10 feet." (3) "… 30 feet into the air and pushed back 20 feet." and "Heightened (4th) The initial damage increases by 1d6, and all
//   distances increase by 10 feet for the 1-action version or 20 feet for the 2- and 3-action versions." (6th, 8th).
// The cast asks the actions; the attack is the caster's spell attack with its proficiency raised to mythic (level + 10). On a hit: the touch's
// damage, the push away from the caster, then the fall from the launch height (half the distance, PF2e's falling damage) and Prone.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i;
const ATTACK = /^Make a melee spell attack at mythic proficiency against your target's AC\.$/;
const HIT = /^If you hit, you deal (\d+)d(\d+) ([a-z]+) damage, and you launch the target into the air and away from you; the target takes falling damage as normal\.$/;
const ACTIONS = /^The number of actions you spend while Casting the Spell determines the damage dealt by your touch and how far the target is launched\.$/;
const ROW = /^(?:Your touch deals (\d+)d(\d+) ([a-z]+) damage instead\. )?The target is launched (\d+) feet into the air and (?:knocked|pushed) back (\d+) feet\.$/;
const STEP = /^The initial damage increases by (\d+)d(\d+), and all distances increase by (\d+) feet for the 1-action version or (\d+) feet for the 2- and 3-action versions\.$/;

/** Returns {mythicLaunch, claimed} or null. */
export function compileMythicLaunch(adapted) {
    const components = adapted.damageComponents ?? [];
    if (!(adapted.activation?.traits ?? []).includes("mythic") || !/^1 creature$/i.test(String(adapted.targeting?.target ?? "").trim()) || components.length !== 1) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length !== 1) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].trim());
    if (paragraphs.length !== 4) return null;
    const sentences = htmlToPlainText(`<p>${paragraphs[0]}</p>`).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => ATTACK.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 3 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const hit = HIT.exec(sentences[at + 1]);
    if (!hit || !ACTIONS.test(sentences[at + 2])) return null;
    if (`${hit[1]}d${hit[2]}` !== String(components[0].formula).replace(/\s+/g, "") || hit[3] !== String(components[0].type).toLowerCase()) return null;
    const rows = {};
    for (const paragraph of paragraphs.slice(1)) {
        const glyph = /^<span class="action-glyph">([123])<\/span>\s*([\s\S]+)$/.exec(paragraph);
        const row = glyph ? ROW.exec(htmlToPlainText(glyph[2]).replace(/\s+/g, " ").trim()) : null;
        if (!row || rows[glyph[1]]) return null;
        if (row[1] && row[3] !== hit[3]) return null;
        rows[glyph[1]] = { dice: Number(row[1] ?? hit[1]), faces: Number(row[2] ?? hit[2]), up: Number(row[4]), back: Number(row[5]) };
    }
    if (Object.keys(rows).length !== 3) return null;
    // The entries: each its rank's total increase (not added together).
    const steps = [];
    const entries = [...rest[0].matchAll(/<p>\s*<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>([\s\S]*?)<\/p>/gi)];
    if (!entries.length || rest[0].replace(/<p>\s*<strong>\s*Heightened[\s\S]*?<\/p>/gi, "").trim()) return null;
    for (const entry of entries) {
        const step = STEP.exec(htmlToPlainText(entry[2]).replace(/\s+/g, " ").trim());
        if (!step || Number(step[2]) !== Number(hit[2])) return null;
        steps.push({ minRank: Number(entry[1]), dice: Number(step[1]), one: Number(step[3]), more: Number(step[4]) });
    }
    // PF2e's heightened damage is the 1-action row's: the item's dice at each entry's rank must be the base plus the entry's.
    const levels = adapted.heightening?.type === "fixed" ? adapted.heightening.levels ?? {} : {};
    if (!steps.every(step => String(levels[step.minRank]?.damage?.[components[0].id]?.formula ?? "").replace(/\s+/g, "") === `${Number(hit[1]) + step.dice}d${hit[2]}`)) return null;
    return {
        mythicLaunch: { type: hit[3], rows, steps, falling: { per: 2, type: "bludgeoning", prone: true } },
        claimed: [...sentences.slice(at), ...paragraphs.slice(1).map(paragraph => htmlToPlainText(paragraph).trim()), ...entries.map(entry => htmlToPlainText(entry[2]).trim())]
    };
}

/** The touch's dice and distances for the actions spent at a cast rank. */
export function launchAt(data, actions, castRank) {
    const row = data.rows[String(actions)];
    const step = data.steps.filter(entry => Number(castRank) >= entry.minRank).at(-1) ?? { dice: 0, one: 0, more: 0 };
    const add = Number(actions) === 1 ? step.one : step.more;
    return { formula: `${row.dice + step.dice}d${row.faces}`, up: row.up + add, back: row.back + add, fall: Math.floor((row.up + add) / data.falling.per) };
}
