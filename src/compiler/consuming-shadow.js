// A spreading pool of shadow (Consuming Darkness): "Your shadow wriggles before spreading out from you, … The first time each turn you Sustain the Spell,
// the radius increases by 5 feet. Each enemy that enters the area or begins its turn in the area takes @Damage[2d6[void]] damage and must attempt a Reflex
// save." with rows "The creature sinks partially into the shadow, taking half damage and a –5-foot circumstance penalty to its Speeds for as long it remains
// in the area." / "As success, but the creature takes full damage and a 10-foot circumstance penalty." / "The creature is absorbed into the shadows, …;
// it takes double damage and is Immobilized for 1 round or until it Escapes.": the lingering emanation's saves (enemies entering or starting a turn in
// it), growing on each round's first Sustain; the rows' damage, the Speed penalty until it leaves the area, the critical failure's hold.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = /^Your shadow wriggles before spreading out from you, [^.]+\. (The first time each turn you (?:@UUID\[[^\]]+\]\{Sustain the Spell\}|Sustain the Spell), the radius increases by (\d+) feet\.) Each enemy that enters the area or begins its turn in the area takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage and must attempt a (Fortitude|Reflex|Will) save\.$/;
const SUCCESS = /^The creature sinks partially into the shadow, taking half damage and a [–−-](\d+)-foot (circumstance|status) penalty to its Speeds for as long it remains in the area\.$/;
const FAILURE = /^As success, but the creature takes full damage and a [–−-]?(\d+)-foot (circumstance|status) penalty\.$/;
const CRITICAL = /^The creature is absorbed into the shadows, [^;]+; it takes double damage and is (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Immobilized\}) for 1 round or until it (?:@UUID\[[^\]]+\]\{Escapes\}|Escapes)\.$/;

/** {html, growth, sentences} or null. */
export function rewriteConsumingShadow(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area?.type !== "emanation" || adapted.lifecycle?.sustained !== true) return null;
    const components = adapted.damageComponents ?? [];
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const plain = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const success = SUCCESS.exec(plain("Success")), failure = FAILURE.exec(plain("Failure")), critical = CRITICAL.exec(plain("Critical Failure"));
    if (!lead || lead[5].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || plain("Critical Success") !== "The creature is unaffected." || !success || !failure || !critical
        || failure[2] !== success[2]) return null;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== lead[3] || String(components[0].type).toLowerCase() !== lead[4]) return null;
    const penalty = (value, type) => `a –${value}-foot ${type} penalty to its Speeds until it leaves the area`;
    return {
        html: `<p>Each enemy that enters or begins its turn in the area must attempt a ${lead[5]} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage and ${penalty(success[1], success[2])}.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage and ${penalty(failure[1], failure[2])}.</p>`
            + `<p><strong>Critical Failure</strong> The creature takes double damage and is ${critical[1]} for 1 round or until it Escapes.</p>${heightened ? `<hr />${heightened}` : ""}`,
        growth: { feet: Number(lead[2]), optional: false, sourceText: lead[1] },
        sentences: [lead[0], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`)]
    };
}
