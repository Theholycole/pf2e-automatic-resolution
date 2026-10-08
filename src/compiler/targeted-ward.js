// A ward against one foe, its strength the foe's save (Targeted Ward): "You gain a status bonus to your choice of AC, Fortitude saves, Reflex saves, or Will saves
// against that opponent based on the results of the opponent's Will save. The number of actions you spend determines when the bonus applies." with "Critical
// Success You do not gain a bonus." / "Success The status bonus is +1." / "Failure … +2." / "Critical Failure … +3.", the versions ("1 The range is 30 feet. You
// focus on a specific action … The bonus only applies when the opponent uses that same action against you." / "2 The range is 30 feet, and the bonus applies every
// time that opponent targets your chosen defense." / "3 As the two-action version, except the range is 60 feet. Additionally, … you can change your defense …
// once …") and "Heightened (5th) Increase the status bonuses granted by each result by 1 (including granting a +1 status bonus on a critical success).": each
// version the opponent's save card; at Finalize the caster's Effect for 4 rounds — the defense its ChoiceSet, the row's bonus (one more from 5th rank) against that
// opponent; the one-action version's bonus behind a toggle (that one action), the three-action version's one change of defense a note.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES } from "./text-patterns.js";

const LEAD = /^You gain a status bonus to your choice of AC, Fortitude saves, Reflex saves, or Will saves against that opponent based on the results of the opponent['’]s (Fortitude|Reflex|Will) save\.$/;
const VERSIONS = /^The number of actions you spend determines when the bonus applies\.$/;
const ROWS = { criticalSuccess: /^You do not gain a bonus\.$/, success: /^The status bonus is \+(\d)\.$/, failure: /^The status bonus is \+(\d)\.$/, criticalFailure: /^The status bonus is \+(\d)\.$/ };
const ONE = /^The range is (\d+) feet\. (You focus on a specific action the opponent has taken in the past, such as a breath weapon or a Strike\. The bonus only applies when the opponent uses that same action against you\.)$/;
const TWO = /^The range is (\d+) feet, and the bonus applies every time that opponent targets your chosen defense\.$/;
const THREE = /^As the two-action version, except the range is (\d+) feet\. (Additionally, when the opponent uses an offensive ability against you that targets a different defense \(such as targeting your AC after you have chosen to gain a status bonus to Fortitude saves\), you can change your defense to match the one appropriate for the incoming attack as a free action\. Once you have changed the defense type once, you can['’]t change it again during the same casting of [a-z ]+\.)$/;
const STEP = /^Heightened \((\d+)(?:st|nd|rd|th)\) Increase the status bonuses granted by each result by (\d) \(including granting a \+\2 status bonus on a critical success\)\.$/;

/** {saveHTML, statistic, versions: [{actions, range, toggle, note}], ward: {byDegree, heightened, seconds}, sentences} or null. */
export function extractTargetedWard(item) {
    if (!/^1 to 3$/.test(String(item?.system?.time?.value ?? "").trim()) || Object.keys(item.system?.overlays ?? {}).length || Object.keys(item.system?.damage ?? {}).length) return null;
    const rounds = /^(\d+) rounds?$/.exec(String(item.system?.duration?.value ?? "").trim());
    const [body, heightened = "", ...rest] = String(item.system?.description?.value ?? "").split(/<hr\s*\/?>/i);
    if (!rounds || rest.length || item.system?.duration?.sustained) return null;
    const paragraphs = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1].replace(/<span class="action-glyph">\s*(\d)\s*<\/span>/g, "[$1] ")).replace(/\s+/g, " ").trim());
    const lead = (paragraphs[0] ?? "").split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const row = heading => (paragraphs.find(p => p.startsWith(`${heading} `)) ?? "").slice(heading.length + 1);
    const version = n => (paragraphs.find(p => p.startsWith(`[${n}] `)) ?? "").slice(4).trim();
    const leadMatch = LEAD.exec(lead[1] ?? ""), one = ONE.exec(version(1)), two = TWO.exec(version(2)), three = THREE.exec(version(3)), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    const rows = { criticalSuccess: ROWS.criticalSuccess.test(row("Critical Success")), success: ROWS.success.exec(row("Success")), failure: ROWS.failure.exec(row("Failure")), criticalFailure: ROWS.criticalFailure.exec(row("Critical Failure")) };
    if (paragraphs.length !== 8 || lead.length !== 3 || NARRATION_RULES.test(lead[0]) || !leadMatch || !VERSIONS.test(lead[2]) || !one || !two || !three || !step || Object.values(rows).some(entry => !entry)) return null;
    const statistic = leadMatch[1];
    return {
        saveHTML: `<p>The target must attempt a ${statistic} save.</p>${["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `<p><strong>${heading}</strong> The target is unaffected.</p>`).join("")}`,
        statistic: statistic.toLowerCase(),
        versions: [
            { actions: 1, range: Number(one[1]), toggle: true, note: one[2] },
            { actions: 2, range: Number(two[1]), toggle: false, note: null },
            { actions: 3, range: Number(three[1]), toggle: false, note: three[2] }
        ],
        ward: { byDegree: { criticalSuccess: 0, success: Number(rows.success[1]), failure: Number(rows.failure[1]), criticalFailure: Number(rows.criticalFailure[1]) },
            heightened: { rank: Number(step[1]), add: Number(step[2]) }, seconds: Number(rounds[1]) * 6 },
        sentences: [lead[1], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(row), version(1), version(2), version(3), htmlToPlainText(heightened).trim()]
    };
}
