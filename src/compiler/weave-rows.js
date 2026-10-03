// A timeline locked in (Behold the Weave): "You behold the many timelines that weave around a creature, and in so doing, you make one more likely to
// occur. The target must attempt a Will save." with rows "You can make neither heads nor tails of the target's timeline, and the target is
// unaffected." / "The target must commit to a single action that it will take at some point during its next turn: … it loses the last action of its
// turn as it reels in a temporal paradox. …" / "As success, but the creature must commit at least two of its actions for the next turn— …" / "As
// failure, but the creature must commit all of its actions for the next turn." with "Heightened (7th) Instead of affecting a single target, the spell
// affects all enemies within a 30-foot emanation.": each row a note for the target's next turn (the GM plays the commitment); the heightened area
// the caster's targets (all enemies within 30 feet), a reminder.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = /^You behold the many timelines that weave around a creature, and in so doing, you make one more likely to occur\. The target must attempt a (Fortitude|Reflex|Will) save\.$/;
const SUCCESS = /^The target must commit to a single action that it will take at some point during its next turn: .+ That action is now locked in, and the creature must attempt it, even if the situation has changed.+ If the creature is entirely unable to fulfill the action it committed to.+it loses the last action of its turn as it reels in a temporal paradox\. The creature can choose to lock in a 2- or 3-action activity if it prefers to do so, but if it does, it loses all the associated actions if it can't perform the activity on its turn\. If the situation changes oddly .+ the GM determines what happens\.$/;
const FAILURE = /^As success, but the creature must commit at least two of its actions for the next turn.+All of these actions are similarly locked in and can't be changed, but the creature can take them in any order\.$/;
const CRITICAL = /^As failure, but the creature must commit all of its actions for the next turn\.$/;
const HEIGHTENED = /^Heightened \(7th\) Instead of affecting a single target, the spell affects all enemies within a (\d+)-foot emanation\.$/;

/** {html, notes, reminder, sentences} or null. */
export function rewriteWeaveRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const plain = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const lift = HEIGHTENED.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!lead || lead[1].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || !/^You can make neither heads nor tails of the target's timeline, and the target is unaffected\.$/.test(plain("Critical Success"))
        || !SUCCESS.test(plain("Success")) || !FAILURE.test(plain("Failure")) || !CRITICAL.test(plain("Critical Failure")) || !lift) return null;
    const rule = "The commitment is locked in and must be attempted even if things change; if it can't be fulfilled, it loses the last action of its turn (all of a committed activity's actions). If the situation changes oddly, the GM decides.";
    const nextTurn = { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 1, sourceText: "its next turn" };
    const note = (heading, what) => ({ label: "Locked timeline", text: `Before its next turn, it commits to ${what} for that turn. ${rule}`, sourceText: plain(heading), claimsRow: true, gmPlays: true, duration: { ...nextTurn } });
    return {
        html: `<p>The target must attempt a ${lead[1]} save.</p><hr />` + ["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `<p><strong>${heading}</strong> The target is unaffected.</p>`).join(""),
        notes: { success: note("Success", "a single action (or a 2- or 3-action activity)"), failure: note("Failure", "at least two of its actions (taken in any order)"), criticalFailure: note("Critical Failure", "all of its actions (taken in any order)") },
        reminder: { kind: "spell-note", text: `At 7th rank or higher, target every enemy within a ${lift[1]}-foot emanation of the caster instead of one creature.`, sourceText: lift[0] },
        sentences: [lead[0], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`), lift[0]]
    };
}
