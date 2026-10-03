// Areas whose Sustain damages the creatures they hold (Gluttonous Growth, Grasping Earth):
//   Gluttonous Growth — "All affected squares are difficult terrain, both on the ground and for flying creatures." / "Each creature that begins its
//   turn in the area must attempt a Reflex save unless it's already @UUID[…]{Grabbed} or @UUID[…]{Restrained}." / "When you Sustain this spell,
//   each creature grabbed or restrained by the plants takes 4d6 piercing damage." with rows "Success … grabbed until the beginning of its next turn
//   or it Escapes." / "Failure … grabbed until the spell ends or it Escapes." / "Critical Failure … restrained until the spell ends or it Escapes."
//   and "Heightened (+1) The damage dealt by the plants when you Sustain the spell increases by 2d6.";
//   Grasping Earth — "Each creature in the area when you cast the spell, and each creature that ends its turn in the area during the spell's
//   duration, must attempt a Fortitude save." / "The first time each round you Sustain this spell, each creature still @UUID[…]{Grabbed} by the
//   earth takes @Damage[1d6[bludgeoning]] damage, and each creature @UUID[…]{Restrained} by the earth takes @Damage[2d6[bludgeoning]] damage." /
//   "A creature can attempt to @UUID[…]{Escape}, rolling against your spell DC." with rows "Success … unaffected." / "Failure … grabbed by the
//   earth." / "Critical Failure … restrained by the earth." and "Heightened (+2) … increases by 1d6 for grabbed creatures and 2d6 for restrained
//   creatures."
// The lingering area's plain rows (the condition until it Escapes, ending with the spell); each Sustain deals the held creatures their damage at
// the cast rank (the text's step); Gluttonous Growth's held creatures don't save again.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const DEGREES = [["criticalSuccess", "Critical Success"], ["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]];

const GLUTTON = {
    terrain: /^All affected squares are difficult terrain, both on the ground and for flying creatures\.$/,
    save: new RegExp(String.raw`^Each creature that begins its turn in the area must attempt an? (Fortitude|Reflex|Will) save unless it's already (${C}Grabbed\}) or (${C}Restrained\})\.$`),
    held: /^When you Sustain this spell, each creature grabbed or restrained by the [a-z]+ takes (\d+)d(\d+) ([a-z]+) damage\.$/,
    rows: { criticalSuccess: /^The creature is unaffected\.$/, success: /^The creature is grabbed until the beginning of its next turn or it Escapes\.$/,
        failure: /^The creature is grabbed until the spell ends or it Escapes\.$/, criticalFailure: /^The creature is restrained until the spell ends or it Escapes\.$/ },
    step: /^Heightened \(\+(\d)\) The damage dealt by the [a-z]+ when you Sustain the spell increases by (\d+)d(\d+)\.$/
};
const GRASP = {
    save: /^Each creature in the area when you cast the spell, and each creature that ends its turn in the area during the spell's duration, must attempt an? (Fortitude|Reflex|Will) save\.$/,
    held: new RegExp(String.raw`^The first time each round you Sustain this spell, each creature still (${C}Grabbed\}) by the [a-z]+ takes @Damage\[(\d+)d(\d+)\[([a-z]+)\]\] damage, and each creature (${C}Restrained\}) by the [a-z]+ takes @Damage\[(\d+)d(\d+)\[([a-z]+)\]\] damage\.$`),
    escape: /^A creature can attempt to @UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{Escape\}, rolling against your spell DC\.$/,
    rows: { success: /^The creature is unaffected\.$/, failure: /^The creature is grabbed by the [a-z]+\.$/, criticalFailure: /^The creature is restrained by the [a-z]+\.$/ },
    step: /^Heightened \(\+(\d)\) The [a-z]+ damage dealt when you Sustain this spell increases by (\d+)d(\d+) for grabbed creatures and (\d+)d(\d+) for restrained creatures\.$/
};

function rowsOf(table, patterns) {
    const written = [];
    for (const [degree, heading] of DEGREES) {
        const row = new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*<\/strong>([\s\S]*?)<\/p>`, "i").exec(table);
        if (!patterns[degree]) { if (row) return null; continue; }
        const text = row ? htmlToPlainText(row[1]).replace(/\s+/g, " ").trim() : "";
        if (!patterns[degree].test(text)) return null;
        written.push(`${heading} ${text}`);
    }
    return written;
}

/** {html, heldDamage, skipWhile, flyingTerrain, claimed} or null. */
export function rewriteHeldDamage(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.lifecycle?.sustained !== true || !adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const [body, table, heightened, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || !heightened || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const step = htmlToPlainText(heightened).replace(/\s+/g, " ").trim();
    const rank = Number(adapted.rank) || 1;
    const component = components[0];
    const matches = (count, faces, type) => String(component.formula).replace(/\s+/g, "") === `${count}d${faces}` && String(component.type).toLowerCase() === type;
    // Gluttonous Growth.
    if (sentences.length === 4 && !NARRATION_RULES.test(sentences[0]) && GLUTTON.terrain.test(sentences[1])) {
        const save = GLUTTON.save.exec(sentences[2]), held = GLUTTON.held.exec(sentences[3]), heighten = GLUTTON.step.exec(step);
        const written = rowsOf(table, GLUTTON.rows);
        if (!save || !held || !heighten || !written || save[1].toLowerCase() !== adapted.defense.statistic || !matches(held[1], held[2], held[3]) || heighten[3] !== held[2]) return null;
        const [, statistic, grabbed, restrained] = save;
        const stepping = { interval: Number(heighten[1]), dice: Number(heighten[2]) };
        return {
            html: `<p>All surfaces in the area are difficult terrain. Each creature that begins its turn in the area must attempt a ${statistic} save.</p><hr />`
                + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is ${grabbed} for 1 round or until it Escapes.</p>`
                + `<p><strong>Failure</strong> The creature is ${grabbed} until it Escapes.</p><p><strong>Critical Failure</strong> The creature is ${restrained} until it Escapes.</p>`,
            heldDamage: { baseRank: rank, entries: [{ slug: "grabbed", count: Number(held[1]), faces: Number(held[2]), type: held[3], step: stepping },
                { slug: "restrained", count: Number(held[1]), faces: Number(held[2]), type: held[3], step: stepping }], sourceText: sentences[3] },
            skipWhile: { slugs: ["grabbed", "restrained"], sourceText: sentences[2] },
            flyingTerrain: true,
            claimed: [...sentences, ...written, step]
        };
    }
    // Grasping Earth.
    if (sentences.length === 4 && !NARRATION_RULES.test(sentences[0])) {
        const save = GRASP.save.exec(sentences[1]), held = GRASP.held.exec(sentences[2]), heighten = GRASP.step.exec(step);
        const written = rowsOf(table, GRASP.rows);
        if (!save || !held || !GRASP.escape.test(sentences[3]) || !heighten || !written || save[1].toLowerCase() !== adapted.defense.statistic) return null;
        const [, grabbed, gCount, gFaces, gType, restrained, rCount, rFaces, rType] = held;
        if (!matches(gCount, gFaces, gType) || heighten[3] !== gFaces || heighten[5] !== rFaces) return null;
        return {
            html: `<p>Each creature in the area when you Cast the Spell, and each creature that ends its turn in the area, must attempt a ${save[1]} save.</p><hr />`
                + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
                + `<p><strong>Failure</strong> The creature is ${grabbed} until it Escapes.</p><p><strong>Critical Failure</strong> The creature is ${restrained} until it Escapes.</p>`,
            heldDamage: { baseRank: rank, entries: [{ slug: "grabbed", count: Number(gCount), faces: Number(gFaces), type: gType, step: { interval: Number(heighten[1]), dice: Number(heighten[2]) } },
                { slug: "restrained", count: Number(rCount), faces: Number(rFaces), type: rType, step: { interval: Number(heighten[1]), dice: Number(heighten[4]) } }], sourceText: sentences[2] },
            skipWhile: null,
            flyingTerrain: false,
            claimed: [...sentences, ...written, step]
        };
    }
    return null;
}

/** The held creature's damage formula at a cast rank. */
export function heldDamageFormula(entry, castRank, baseRank) {
    const steps = Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / entry.step.interval));
    return `${entry.count + steps * entry.step.dice}d${entry.faces}[${entry.type}]`;
}
