// Music that charms foes in an aura (Enchanting Rhapsody): "Enemy creatures in the initial area or that end their turn in the area must make a Will save." with
// rows "The target is unaffected and is temporarily immune for 1 minute." / "The target takes a –1 status penalty to their saves against mental effects until they
// leave the area and for 1 round after." / "As success, except the target is Fascinated until they leave the area and for 1 round after and the status penalty
// increases to –2." / "As failure, but the target must spend the first action on each of its turns to Perform by dancing to the music for as long as it is
// fascinated.": the caster's emanation (enemies, when cast and as their turns end); each row a note while the creature is in the area and 1 round after it
// leaves — the penalty to saves against mental effects, Fascinated granted with the failure's, the dance a note the GM plays; immune for a minute on a critical
// success. (The module's Effect picks its row by a degree its own roll options carry; the module builds the rows from the text.)
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const LEAD = /^Enemy creatures in the initial area or that end their turn in the area must make an? (Fortitude|Reflex|Will) save\.$/;
const CRIT = /^The target is unaffected and is temporarily immune for (\d+) (minute|hour)s?\.$/;
const SUCCESS = /^The target takes a [–-](\d) status penalty to their saves against ([a-z]+) effects until they leave the area and for (\d) rounds? after\.(?: @UUID\[[^\]]+\]\{[^}]+\})?$/;
const FAILURE = /^As success, except the target is @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{(Fascinated)\} until they leave the area and for (\d) rounds? after and the status penalty increases to [–-](\d)\.$/;
const CRITICAL = /^As failure, but (the target must spend the first action on each of its turns to \[\[\/act perform variant=dance\]\] by dancing to the music for as long as it is fascinated)\.$/;

/** {html, notes, immunity, sentences} or null. */
export function rewriteRhapsody(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area?.type !== "emanation" || adapted.lifecycle?.sustained || (adapted.damageComponents ?? []).length) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<hr\s*\/?>/i.test(html) || !/^\d+ minutes?$/.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => paragraphs.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const lead = htmlToPlainText(paragraphs[0] ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const first = LEAD.exec(lead[1] ?? ""), crit = CRIT.exec(htmlToPlainText(row("Critical Success")).trim()), success = SUCCESS.exec(row("Success").replace(/<[^>]+>/g, "").trim()),
        failure = FAILURE.exec(row("Failure")), critical = CRITICAL.exec(row("Critical Failure"));
    if (paragraphs.length !== 5 || lead.length !== 2 || NARRATION_RULES.test(lead[0]) || !first || !crit || !success || !failure || !critical || first[1].toLowerCase() !== adapted.defense.statistic
        || success[3] !== failure[3]) return null;
    const inArea = { mode: "unlimited", sourceText: "until they leave the area" };
    const after = Number(success[3]);
    const penalty = value => ({ key: "FlatModifier", selector: "saving-throw", type: "status", value: -Number(value), predicate: [success[2]] });
    const fascinated = { key: "GrantItem", uuid: failure[1], flag: `condition${failure[2]}`, onDeleteActions: { grantee: "restrict" } };
    const text = value => `A –${value} status penalty to saves against ${success[2]} effects`;
    const plainCritical = htmlToPlainText(critical[1].replace(/\[\[\/act perform variant=dance\]\]/, "Perform (dance)")).replace(/\s+/g, " ").trim();
    return {
        html: `<p>${lead[0]} Each enemy in the area when you Cast the Spell or that ends its turn in the area must attempt a ${first[1]} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p><p><strong>Failure</strong> The creature is unaffected.</p><p><strong>Critical Failure</strong> The creature is unaffected.</p>`,
        immunity: { degrees: ["criticalSuccess"], duration: { value: Number(crit[1]), unit: `${crit[2]}s` }, sourceText: htmlToPlainText(row("Critical Success")).trim() },
        notes: {
            success: { label: "Enchanting rhapsody", text: `${text(success[1])} while it's in the area and ${after} round after it leaves.`, sourceText: htmlToPlainText(row("Success")).trim(), claimsRow: true,
                duration: inArea, whileInArea: true, afterLeaveRounds: after, rules: [penalty(success[1])] },
            failure: { label: "Enchanting rhapsody", text: `Fascinated, and ${text(failure[4]).toLowerCase()}, while it's in the area and ${after} round after it leaves.`, sourceText: htmlToPlainText(row("Failure")).trim(),
                claimsRow: true, duration: inArea, whileInArea: true, afterLeaveRounds: after, rules: [penalty(failure[4]), fascinated] },
            criticalFailure: { label: "Enchanting rhapsody", text: `Fascinated, and ${text(failure[4]).toLowerCase()}, while it's in the area and ${after} round after it leaves. ${plainCritical[0].toUpperCase()}${plainCritical.slice(1)}.`,
                sourceText: htmlToPlainText(row("Critical Failure")).trim(), claimsRow: true, duration: inArea, whileInArea: true, afterLeaveRounds: after, rules: [penalty(failure[4]), fascinated], gmPlays: true }
        },
        sentences: [lead[1], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => htmlToPlainText(row(heading)).trim())]
    };
}
