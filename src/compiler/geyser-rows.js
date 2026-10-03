// A blast that throws creatures up (Geyser): "Area 10-foot radius, 50-foot-tall cylinder" / "A powerful geyser blasts up from solid ground, pushing creatures on top
// of it into the air. Each creature in the area takes 3d6 bludgeoning damage and 4d6 fire damage, with a Reflex save. A creature pushed into the air by the geyser can't
// be pushed beyond the top of the geyser. After being pushed into the air, a creature falls unless it's flying or has some other means of staying aloft, taking falling
// damage (normally equal to half the distance it fell). After the geyser erupts, its area is filled with a cloud of steam for 1 round. All creatures in the steam are
// Concealed, and all creatures outside the steam are concealed to creatures within it." with rows "… half damage and isn't pushed into the air." / "… full damage and is
// pushed 20 feet into the air." / "… double damage and is pushed 40 feet into the air.": the rows' damage, and the fall from the push (half its height) as bludgeoning;
// a creature that stays aloft is the GM's (it takes no fall); the steam a reminder.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = /^A powerful geyser blasts up from solid ground, pushing creatures on top of it into the air\. Each creature in the area takes (\d+d\d+) ([a-z]+) damage and (\d+d\d+) ([a-z]+) damage, with a (Fortitude|Reflex|Will) save\. (A creature pushed into the air by the geyser can't be pushed beyond the top of the geyser\.) (After being pushed into the air, a creature falls unless it's flying or has some other means of staying aloft, taking falling damage \(normally equal to half the distance it fell\)\.) (After the geyser erupts, its area is filled with a cloud of steam for (\d+) rounds?\. All creatures in the steam are (?:@UUID\[[^\]]+\]\{Concealed\}|Concealed), and all creatures outside the steam are concealed to creatures within it\.)$/;
const ROW = /^The creature takes (full|double) damage and is pushed (\d+) feet into the air\.$/;

/** {html, reminder, sentences} or null. */
export function rewriteGeyser(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area?.type !== "cylinder") return null;
    const components = adapted.damageComponents ?? [];
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (sections.length !== 4 || !/^<p><strong>Area<\/strong>[^<]+<\/p>$/.test(sections[0])) return null;
    const [, body, table, heightened] = sections;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const plain = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const failure = ROW.exec(plain("Failure")), critical = ROW.exec(plain("Critical Failure"));
    if (!lead || lead[5].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || plain("Critical Success") !== "The creature is unaffected."
        || plain("Success") !== "The creature takes half damage and isn't pushed into the air." || failure?.[1] !== "full" || critical?.[1] !== "double") return null;
    const matches = (formula, type) => components.some(component => !component.category && String(component.formula).replace(/\s+/g, "") === formula && String(component.type).toLowerCase() === type);
    if (components.length !== 2 || !matches(lead[1], lead[2]) || !matches(lead[3], lead[4])) return null;
    const fall = feet => Math.floor(Number(feet) / 2);
    return {
        html: `<p>Each creature in the area takes ${lead[1]} ${lead[2]} damage and ${lead[3]} ${lead[4]} damage and must attempt a ${lead[5]} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage and @Damage[${fall(failure[2])}[bludgeoning]] damage.</p>`
            + `<p><strong>Critical Failure</strong> The creature takes double damage and @Damage[${fall(critical[2])}[bludgeoning]] damage.</p><hr />${heightened}`,
        reminder: { kind: "spell-note", text: `A failing creature is pushed ${failure[2]} feet up (${critical[2]} on a critical failure) and falls back, taking the fall's bludgeoning (half the distance) with the spell's damage — undo that part for a creature that flies or stays aloft. ${lead[6]} ${lead[8].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")} (mark the steam for ${lead[9]} round${lead[9] === "1" ? "" : "s"}.)`,
            sourceText: lead[0] },
        sentences: [lead[0], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`)]
    };
}
