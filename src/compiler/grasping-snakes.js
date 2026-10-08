// Snakes that bite and hold (Slither): "A mass of snakes made of shadow rise up to capture creatures in the area. Each creature in the area when you Cast
// the Spell takes @Damage[3d6[piercing]] damage and @Damage[1d6[persistent,poison]] damage from a biting snake, and it's Grabbed or Restrained depending
// on its Reflex save. A creature that ends its turn in the area must also attempt this save, even if it's already grabbed or restrained by the snakes.
// You can Dismiss the spell." with rows "The creature is unaffected." / "The creature takes full damage and is grabbed by a snake. The snakes' Escape DC
// is equal to your spell DC. A creature can attack a snake to release the creature. A snake's AC is equal to your spell DC, and it's destroyed if it
// takes 12 or more damage at once. New snakes continually regrow …" / "As failure, but the creature takes double damage and is restrained by a snake."
// with "Heightened (+2) The persistent poison damage increases by 1d6 and snake HP increases by 6.": the lingering area's saves (in it at the cast, or
// ending a turn in it); each failing row's own damage (the persistent part at the cast rank, doubled with the rest on a critical failure) and the
// condition until it Escapes at the spell DC; attacking a snake the GM's (a reminder with its HP at the cast rank).
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_UUID_START as C } from "./text-patterns.js";

const LEAD = new RegExp(String.raw`^A mass of [a-z ]+ rise up to capture creatures in the area\. Each creature in the area when you Cast the Spell takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage and @Damage\[(\d)d(\d+)\[persistent,([a-z]+)\]\] damage from a biting [a-z]+, and it's ${C}(Grabbed)\} or ${C}(Restrained)\} depending on its (Fortitude|Reflex|Will) save\. A creature that ends its turn in the area must also attempt this save, even if it's already grabbed or restrained by the [a-z]+\. (You can Dismiss the spell\.)$`);
const FAILURE = /^The creature takes full damage and is grabbed by a [a-z]+\. The [a-z]+' (?:@UUID\[[^\]]+\]\{Escape\}|Escape) DC is equal to your spell DC\. (A creature can attack a [a-z]+ to release the creature\.) A [a-z]+'s AC is equal to your spell DC, and it's destroyed if it takes (\d+) or more damage at once\. (New [a-z]+ continually regrow as long as the spell lasts, so destroying [a-z]+ doesn't prevent [a-z]+ from capturing more creatures\.)$/;
const CRITICAL = /^As failure, but the creature takes double damage and is restrained by a [a-z]+\.$/;
const STEP = /^Heightened \(\+(\d)\) The persistent ([a-z]+) damage increases by (\d)d(\d+) and [a-z]+ HP increases by (\d+)\.$/;

/** {html, reminder, sentences} or null. */
export function rewriteGraspingSnakes(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || !adapted.targeting?.area) return null;
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const plain = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const failure = FAILURE.exec(plain("Failure")), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!lead || lead[10].toLowerCase() !== adapted.defense.statistic || rows.length !== 3 || plain("Success") !== "The creature is unaffected." || !failure || !CRITICAL.test(plain("Critical Failure")) || !step
        || step[2] !== lead[5] || step[4] !== lead[4] || step[3] !== "1" || lead[3] !== "1") return null;
    // (The structured entries must be the text's: the rows below roll the text's formulas.)
    const components = adapted.damageComponents ?? [];
    if (components.length && !(components.length === 2 && components.some(c => !c.category && String(c.formula).replace(/\s+/g, "") === lead[1] && String(c.type).toLowerCase() === lead[2])
        && components.some(c => c.category === "persistent" && String(c.formula).replace(/\s+/g, "") === `1d${lead[4]}` && String(c.type).toLowerCase() === lead[5]))) return null;
    const rank = Number(adapted.rank), interval = Number(step[1]);
    const persistent = `(floor((@item.rank - ${rank - interval})/${interval}))d${lead[4]}`;
    const grabbed = `@UUID[${lead[6]}]{${lead[7]}}`, restrained = `@UUID[${lead[8]}]{${lead[9]}}`;
    return {
        html: `<p>A creature in the area when you Cast the Spell, or that ends its turn in the area, must attempt a ${lead[10]} save. ${lead[11]}</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Failure</strong> The creature takes @Damage[${lead[1]}[${lead[2]}]] damage and @Damage[${persistent}[persistent,${lead[5]}]] damage and is ${grabbed} until it Escapes.</p>`
            + `<p><strong>Critical Failure</strong> The creature takes @Damage[(2*(${lead[1]}))[${lead[2]}]] damage and @Damage[(2*(${persistent}))[persistent,${lead[5]}]] damage and is ${restrained} until it Escapes.</p>`,
        reminder: { kind: "spell-note", text: `${failure[1]} A snake has AC equal to the spell DC and is destroyed by ${failure[2]} or more damage at once (+${step[5]} every ${interval} ranks above ${rank}); new ones regrow while the spell lasts. A creature that ends its turn in the area saves again even if already held.`,
            sourceText: `Failure ${plain("Failure")}` },
        sentences: [lead[0], `Failure ${plain("Failure")}`, `Critical Failure ${plain("Critical Failure")}`, step[0]]
    };
}
