// A bridge that trips the creatures it doesn't carry (Bridge of Vines): "Vines sprout beneath your feet and extend away from you in a straight line up to 60
// feet, forming a 10-foot-wide bridge … The bridge has an AC equal to your spell DC, Hardness 10, and 20 Hit Points. It is immune to critical hits and
// precision damage. The bridge lasts either for the duration of the spell, until it is destroyed, or until you Dismiss the spell." / "While the spell is
// active, you and your allies can use the bridge normally. If any other creatures attempt to use the bridge, the vines attempt to trip and entangle them.
// They must attempt a Reflex save against your spell DC." with rows "… unaffected." / "The target treats the length of the bridge as difficult terrain." /
// "As success, and the target is knocked {Prone}." / "As success, and the target is knocked prone and {Grabbed} until it Escapes (…) or the spell ends."
// and "Heightened (+1) The bridge's Hit Points increase by 10." — the GM's drawn region (the bridge), each creature other than the caster and its allies
// entering it saves; a success or worse makes the bridge difficult terrain for that creature (the region's own per-creature cost); Prone; Grabbed until it
// Escapes (ending with the spell); the bridge's statistics a note.
import { htmlToPlainText } from "./description-parser.js";
import { HEADINGS } from "./text-patterns.js";

const LEAD = [/^Vines sprout beneath your feet and extend away from you in a straight line up to (\d+) feet, forming a (\d+)-foot-wide bridge that can cross over difficult terrain and low obstacles, as well as reach higher ground\.$/,
    /^The bridge has an AC equal to your spell DC, Hardness (\d+), and (\d+) Hit Points\.$/, /^It is immune to critical hits and precision damage\.$/,
    /^The bridge lasts either for the duration of the spell, until it is destroyed, or until you Dismiss the spell\.$/,
    /^While the spell is active, you and your allies can use the bridge normally\.$/,
    /^If any other creatures attempt to use the bridge, the vines attempt to trip and entangle them\.$/,
    /^They must attempt a (Fortitude|Reflex|Will) save against your spell DC\.$/];
const ROWS = { criticalSuccess: /^The target is unaffected\.$/, success: /^The target treats the length of the bridge as difficult terrain\.$/,
    failure: /^As success, and the target is knocked (@UUID\[[^\]]+\]\{Prone\})\.$/,
    criticalFailure: /^As success, and the target is knocked prone and (@UUID\[[^\]]+\]\{Grabbed\}) until it Escapes \(with a DC equal to your spell DC\) or the spell ends\.$/ };
const STEP = /^Heightened \(\+(\d)\) The bridge's Hit Points increase by (\d+)\.$/;

/** {html, lingering additions, notes, claimed} or null. */
export function rewriteBridgeRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim() || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!minutes || !table || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (sentences.length !== LEAD.length || LEAD.some((pattern, index) => !pattern.test(sentences[index]))) return null;
    if (LEAD[6].exec(sentences[6])[1].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = {}, written = [];
    for (const [degree, heading] of Object.entries(HEADINGS)) {
        const row = new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*<\/strong>([\s\S]*?)<\/p>`, "i").exec(table);
        const text = row ? row[1].replace(/\s+/g, " ").trim() : "";
        rows[degree] = ROWS[degree].exec(text);
        if (!rows[degree]) return null;
        written.push(`${heading} ${htmlToPlainText(text)}`);
    }
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (heightened.trim() && !step) return null;
    const [, length, width] = LEAD[0].exec(sentences[0]), [, hardness, hp] = LEAD[1].exec(sentences[1]);
    const statistic = LEAD[6].exec(sentences[6])[1];
    return {
        html: `<p>Each creature that enters the area must attempt a ${statistic} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Failure</strong> The creature is knocked ${rows.failure[1]}.</p><p><strong>Critical Failure</strong> The creature is knocked ${rows.failure[1]} and ${rows.criticalFailure[1]} until it Escapes.</p>`,
        // (A line for the lingering compiler; the bridge itself is the GM's drawn region, 10 feet wide.)
        area: { type: "line", value: Number(length) },
        lingering: { excludeCaster: true, enemiesOnly: true, drawnArea: `a ${length}-foot line, ${width} feet wide, from you`, dismissible: true,
            rowTerrain: { degrees: ["success", "failure", "criticalFailure"], until: "spell", sourceText: written[1] } },
        sectionHP: { base: Number(hp), step: step ? { interval: Number(step[1]), add: Number(step[2]) } : null },
        notes: [`The bridge has AC equal to your spell DC, Hardness ${hardness} and ${hp} Hit Points${step ? ` (+${step[2]} per rank above ${adapted.rank})` : ""}, immune to critical hits and precision damage; destroyed, the spell ends.`,
            "You and your allies use the bridge normally; other creatures entering it save."],
        claimed: [...sentences, ...written, ...(step ? [step[0]] : [])]
    };
}
