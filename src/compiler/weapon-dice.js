// Dice of the caster's weapon (Weapon Storm): "Area 30-foot cone or 10-foot emanation" / "You swing a weapon you're holding, and the weapon magically
// multiplies into duplicates that swipe at all creatures in either a cone or an emanation." / "This flurry deals four dice of damage to creatures in
// the area." / "This damage has the same type as the weapon and uses the same die size." / "Determine the die size as if you were attacking with the
// weapon; for instance, if you were wielding a two-hand weapon in both hands, you'd use its two-hand damage die." with rows half / full / "double
// damage and is subject to the weapon's critical specialization effect" and "Heightened (+1) Add another damage die.": the caster picks the held
// weapon; the card rolls that many of its dice (its two-hand die when held in both hands) of its damage type, one more each rank; the critical
// specialization is a reminder. The area is the caster's choice of the two (a reminder; the cone is placed by default).
import { htmlToPlainText } from "./description-parser.js";

const WORDS = { two: 2, three: 3, four: 4, five: 5, six: 6 };
const AREA = /^<p>\s*<strong>\s*Area\s*<\/strong>\s*(\d+)-foot (cone|burst|line) or (\d+)-foot (emanation|burst|cone)\s*<\/p>$/i;
const NARRATION_RULES = /\d|@|\[\[|\b(?:saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const DICE = /^This [a-z]+ deals (two|three|four|five|six) dice of damage to creatures in the area\.$/;
const SAME = /^This damage has the same type as the weapon and uses the same die size\.$/;
const TWO_HAND = /^Determine the die size as if you were attacking with the weapon; for instance, if you were wielding a two-hand weapon in both hands, you'd use its two-hand damage die\.$/;
const ROWS = { criticalSuccess: /^The creature is unaffected\.$/, success: /^The target takes half damage\.$/, failure: /^The target takes full damage\.$/,
    criticalFailure: /^The target takes double damage and is subject to the weapon's critical specialization effect\.$/ };
const DEGREES = [["criticalSuccess", "Critical Success"], ["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]];
const STEP = /^Heightened \(\+1\) Add another damage die\.$/;

/** {html, components, area, weaponDice, reminders, sentences} or null. */
export function rewriteWeaponDice(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [area, body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    const shapes = AREA.exec(area ?? "");
    if (!shapes || !body || !table || rest.length || !STEP.test(htmlToPlainText(heightened).replace(/\s+/g, " ").trim())) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (sentences.length !== 4 || NARRATION_RULES.test(sentences[0]) || !SAME.test(sentences[2]) || !TWO_HAND.test(sentences[3])) return null;
    const dice = DICE.exec(sentences[1]);
    if (!dice) return null;
    const paragraphs = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const written = [];
    for (const [degree, heading] of DEGREES) {
        const text = htmlToPlainText(paragraphs.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").trim();
        if (!ROWS[degree].test(text)) return null;
        written.push(`${heading} ${text}`);
    }
    const count = WORDS[dice[1]];
    return {
        html: `<p>This flurry deals ${count}d4 untyped damage to creatures in the area.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage.</p><p><strong>Critical Failure</strong> The creature takes double damage.</p>`,
        components: [{ id: "weapon-dice", formula: `${count}d4`, type: "untyped", category: null, applyModifier: false, kinds: ["damage"], materials: [] }],
        area: { type: shapes[2].toLowerCase(), value: Number(shapes[1]) },
        weaponDice: { count, perRank: 1, baseRank: Number(adapted.rank), twoHand: true, sourceText: sentences.slice(1).join(" ") },
        reminders: [{ kind: "area-choice", text: `Area: the caster chooses a ${shapes[1]}-foot ${shapes[2].toLowerCase()} or a ${shapes[3]}-foot ${shapes[4].toLowerCase()}. Place it and target the creatures in it.` },
            { kind: "weapon-critical-specialization", text: "A critically failing creature is also subject to the weapon's critical specialization effect (GM)." }],
        sentences: [htmlToPlainText(area).trim(), ...sentences, ...written, htmlToPlainText(heightened).trim()]
    };
}
