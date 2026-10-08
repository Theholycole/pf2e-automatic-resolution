// A demand paid in life force (Over the Coals): "… The demand can't be obviously self-destructive, or the spell fails. If the target resists, you take
// your payment from its life force. The target must attempt a Will save. Regardless of the result of its save, the target is temporarily immune for 1
// day." with rows "The target is unaffected and is immune to your pact broker cantrips for 1 day." / "If the target doesn't comply with your request by
// the end of its next turn, it takes @Damage[3d8[persistent,void]] damage. If it later complies, the spell automatically ends." / "As success, but if the
// target doesn't comply, it is @UUID[…]{Drained 1} and takes @Damage[6d8[persistent,void]] damage." / "As success, but if the target doesn't comply, it is
// @UUID[…]{Drained 2} and @UUID[…]{Doomed 1}, and takes @Damage[6d8[persistent,void]] damage. Even if the target completes your commands later, the spell
// doesn't end until all the conditions end." and "Heightened (9th) You can target up to two creatures.": the save and a day's immunity whatever the
// result; on a success or worse a note whose control the GM uses if it hasn't complied by the end of its next turn — the row's persistent damage and
// conditions, once; the demand's limits, the cantrip immunity, a later compliance and the 9th rank's second target reminders.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_UUID_START as C } from "./text-patterns.js";

const LEAD = /^The target must attempt an? (Fortitude|Reflex|Will) save\. Regardless of the result of its save, the target is temporarily immune for (\d+) (day|hour)s?\.$/;
const LIMIT = /^The demand can't be obviously self-destructive, or the spell fails\.$/;
const CRIT_SUCCESS = /^The target is unaffected and (is immune to your [a-z ]+ for \d+ (?:day|hour)s?)\.$/;
const SUCCESS = /^If the target doesn't comply with your request by the end of its next turn, it takes @Damage\[(\d+)d(\d+)\[persistent,([a-z]+)\]\] damage\. (If it later complies, the spell automatically ends\.)$/;
const FAILURE = new RegExp(String.raw`^As success, but if the target doesn't comply, it is ${C}(Drained) (\d)\} and takes @Damage\[(\d+)d(\d+)\[persistent,([a-z]+)\]\] damage\.$`);
const CRITICAL = new RegExp(String.raw`^As success, but if the target doesn't comply, it is ${C}(Drained) (\d)\} and ${C}(Doomed) (\d)\}, and takes @Damage\[(\d+)d(\d+)\[persistent,([a-z]+)\]\] damage\. (Even if the target completes your commands later, the spell doesn't end until all the conditions end\.)$`);
const STEP = /^Heightened \((\d)th\) You can target up to two creatures\.$/;

/** {html, immunity, notes, reminders, sentences} or null. */
export function rewriteCoalsDemand(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const plainBody = htmlToPlainText(body).replace(/\s+/g, " ").trim();
    const leadAt = plainBody.indexOf("The target must attempt");
    const lead = LEAD.exec(plainBody.slice(leadAt));
    const before = plainBody.slice(0, leadAt).trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (leadAt < 0 || !lead || lead[1].toLowerCase() !== adapted.defense.statistic || !before.some(sentence => LIMIT.test(sentence))) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const plain = heading => htmlToPlainText(row(heading)).replace(/\s+/g, " ").trim();
    const critSuccess = CRIT_SUCCESS.exec(plain("Critical Success")), success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(row("Failure")), critical = CRITICAL.exec(row("Critical Failure"));
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (rows.length !== 4 || !critSuccess || !success || !failure || !critical || !step) return null;
    const type = success[3];
    if (failure[6] !== type || critical[9] !== type || failure[5] !== success[2] || critical[8] !== success[2]) return null;
    const baseRank = Number(adapted.rank) || 1;
    const condition = (uuid, name, value) => ({ uuid, slug: name.toLowerCase(), value: Number(value) });
    const note = (heading, dice, conditions) => ({ label: "Over the coals", text: `${plain(heading)} (Use the control if it hasn't complied by the end of its next turn; if it complies first, end the spell.)`,
        sourceText: plain(heading), claimsRow: true, duration: { mode: "unlimited", sourceText: "until it complies or doesn't" },
        triggeredDamage: { trigger: "noncompliance", dice: Number(dice), die: Number(success[2]), type, persistent: true, frequency: "once", endsSpell: true, baseRank, conditions } });
    const unit = lead[3] === "day" ? "days" : "hours";
    return {
        // (The demand's limit is the reminder's.)
        html: `<p>${before.filter(sentence => !LIMIT.test(sentence)).join(" ")} The target must attempt a ${lead[1]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
            + `<p><strong>Success</strong> The target is unaffected.</p><p><strong>Failure</strong> The target is unaffected.</p><p><strong>Critical Failure</strong> The target is unaffected.</p>`,
        immunity: { duration: { value: Number(lead[2]), unit }, sourceText: lead[0] },
        notes: {
            success: note("Success", success[1], []),
            failure: note("Failure", failure[4], [condition(failure[1], failure[2], failure[3])]),
            criticalFailure: note("Critical Failure", critical[7], [condition(critical[1], critical[2], critical[3]), condition(critical[4], critical[5], critical[6])])
        },
        reminders: [
            { kind: "spell-note", text: before.filter(sentence => LIMIT.test(sentence)).join(" "), sourceText: before.find(sentence => LIMIT.test(sentence)) },
            { kind: "spell-note", text: `On a critical success the target ${critSuccess[1]}.`, sourceText: plain("Critical Success") },
            { kind: "spell-note", text: `${success[4]} ${critical[10]}`, sourceText: success[4] },
            { kind: "spell-note", text: `At ${step[1]}th rank you can target up to two creatures.`, sourceText: step[0] }
        ],
        sentences: [...before, lead[0], plain("Critical Success"), plain("Success"), plain("Failure"), plain("Critical Failure"), success[4], critical[10], step[0]]
    };
}
