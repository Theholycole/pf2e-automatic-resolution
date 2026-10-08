// A cry that draws creatures in (Luring Wail): "You emit a plaintive cry to lure your enemies closer. Each creature in the emanation that can hear you
// must attempt a Will save. If you speak a creature's name as part of the casting of the spell, that creature takes a –2 circumstance penalty to its
// saving throw. Each creature that enters the area on its turn must attempt a save. If you attack or take a hostile action, the Fascinated condition
// ends only for the creature that's attacked." with rows "… Slowed 1 for 1 round." / "The creature becomes fascinated and compelled to move toward
// the sound of your cry on its turn. As long as it is in the emanation and can hear, it must spend at least one of its actions on each of its turns
// to move closer to you." / "As failure, but the creature must spend all its actions moving toward the sound. Additionally, the creature is
// Off-Guard.": the lingering area's saves (in it at the cast, or entering it); the named creature's penalty the GM's answer; Fascinated (and the
// critical failure's Off-Guard) until it leaves the area, the compulsion a note while it's fascinated; hearing the GM's review.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_START as C } from "./text-patterns.js";

const LEAD = /^You emit a [a-z ]+ to lure your enemies closer\. Each creature in the emanation that can hear you must attempt a (Fortitude|Reflex|Will) save\. (If you speak a creature's name as part of the casting of the spell, that creature takes a [–−-]\d circumstance penalty to its saving throw\.) Each creature that enters the area on its turn must attempt a save\. (If you attack or take a hostile action, the (?:@UUID\[[^\]]+\]\{Fascinated\}|Fascinated) condition ends only for the creature that's attacked\.)$/;
const SUCCESS = new RegExp(String.raw`^The creature is (${C}Slowed \d\}) for 1 round\.$`);
const FAILURE = /^The creature becomes fascinated and compelled to move toward the sound of your cry on its turn\. (As long as it is in the emanation and can hear, it must spend at least one of its actions on each of its turns to move closer to you\.)$/;
const CRITICAL = new RegExp(String.raw`^As failure, but the creature must spend all its actions moving toward the sound\. Additionally, the creature is (${C}Off-Guard\})\.$`);
const FASCINATED = "@UUID[Compendium.pf2e.conditionitems.Item.AdPVz7rbaVSRxHFg]{Fascinated}";

/** {html, notes, reminder, sentences} or null. */
export function rewriteLuringRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area?.type !== "emanation" || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const plain = heading => htmlToPlainText(row(heading)).replace(/\s+/g, " ").trim();
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(plain("Failure")), critical = CRITICAL.exec(row("Critical Failure"));
    if (!lead || lead[1].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || !/^The creature is unaffected\.$/.test(plain("Critical Success")) || !success || !failure || !critical) return null;
    const lured = (degree, text) => ({ label: "Lured", text, sourceText: plain(degree), claimsRow: true, gmPlays: true, whileCondition: "fascinated", duration: { mode: "unlimited", sourceText: "unlimited" } });
    return {
        html: `<p>A creature in the area when you Cast the Spell, or that enters the area, must attempt a ${lead[1]} save. ${lead[2]}</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is ${success[1]} for 1 round.</p>`
            + `<p><strong>Failure</strong> The creature is ${FASCINATED} until it leaves the area.</p>`
            + `<p><strong>Critical Failure</strong> The creature is ${FASCINATED} and ${critical[1]} until it leaves the area.</p>`,
        notes: {
            failure: lured("Failure", "While it's in the emanation and can hear the cry, it must spend at least one action on each of its turns moving closer to the caster. If the caster attacks or takes a hostile action, Fascinated ends only for the creature attacked."),
            criticalFailure: lured("Critical Failure", "While it's in the emanation and can hear the cry, it must spend all its actions moving toward the sound. If the caster attacks or takes a hostile action, Fascinated ends only for the creature attacked.")
        },
        reminder: { kind: "spell-note", text: "Only creatures that can hear the caster are affected: leave out (in the area review) those that can't.", sourceText: lead[0] },
        sentences: [lead[0], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`)]
    };
}
