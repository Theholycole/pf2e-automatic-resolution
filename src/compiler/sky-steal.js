// A flying creature denied the air (Steal the Sky): "Trigger You make a successful unarmed Strike against a flying creature." / "You deny a flying creature the
// support of the air." with rows "The creature is unaffected." / "The target descends 60 feet. If it hits a surface, it takes bludgeoning damage as if it had
// fallen." / "As success; if the target hits a surface, it falls @UUID[…]{Prone} and can't Fly, levitate, or otherwise leave the ground for 1 minute." / "As
// failure, and the creature takes double damage from hitting a surface." and "Heightened (+1) Increase the distance the creature must descend by 20 feet.":
// the target's Fortitude save; the descent a note (60 feet, +20 a rank); the GM's answer for each creature whether it hit a surface — if so the falling
// damage (half the descent, doubled on a critical failure) and, on a failure, Prone and a minute's note that it can't leave the ground.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const TRIGGER = /^Trigger You make a successful unarmed Strike against a flying creature\.$/;
const SUCCESS = /^The target descends (\d+) feet\. If it hits a surface, it takes bludgeoning damage as if it had fallen\.$/;
const FAILURE = new RegExp(String.raw`^As success; if the target hits a surface, it falls (${C}Prone\}) and (can't Fly, levitate, or otherwise leave the ground) for (\d+) minutes?\.$`);
const CRITICAL = /^As failure, and the creature takes double damage from hitting a surface\.$/;
const STEP = /^Heightened \(\+(\d)\) Increase the distance the creature must descend by (\d+) feet\.$/;

/** {html, gate, notes, reminder, sentences} or null. */
export function rewriteSkySteal(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (sections.length !== 4) return null;
    const [trigger, narration, table, heightened] = sections;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const success = SUCCESS.exec(htmlToPlainText(row("Success")).trim()), failure = FAILURE.exec(row("Failure")), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    const narrate = htmlToPlainText(narration).replace(/\s+/g, " ").trim();
    if (!TRIGGER.test(htmlToPlainText(trigger).replace(/\s+/g, " ").trim()) || /\d|@/.test(narrate) || rows.length !== 4 || htmlToPlainText(row("Critical Success")).trim() !== "The creature is unaffected."
        || !success || !failure || !CRITICAL.test(htmlToPlainText(row("Critical Failure")).trim()) || !step) return null;
    const baseRank = Number(adapted.rank) || 1, feet = Number(success[1]), perRank = Number(step[2]) / Number(step[1]);
    // (Whole Hit Points: an even descent and an even step a rank.)
    if (!Number.isInteger(feet / 2) || !Number.isInteger(perRank / 2)) return null;
    // (Falling: half the distance fallen, bludgeoning — the descent's at the cast rank.)
    const fall = `(${feet / 2}+${perRank / 2}*(@item.rank - ${baseRank}))`;
    const statistic = adapted.defense.statistic[0].toUpperCase() + adapted.defense.statistic.slice(1);
    const descent = { label: "Denied the air", text: `It descends ${feet} feet (${step[2]} more each rank above ${baseRank === 5 ? "5th" : `${baseRank}th`}).`, sourceText: htmlToPlainText(row("Success")).trim(), claimsRow: true,
        duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: "1 round" } };
    return {
        html: `${trigger}<hr /><p>${narrate} The target must attempt a ${statistic} save.</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Success</strong> The target takes @Damage[${fall}[bludgeoning]] damage.</p><p><strong>Failure</strong> The target takes @Damage[${fall}[bludgeoning]] damage and is ${failure[1]}.</p>`
            + `<p><strong>Critical Failure</strong> The target takes @Damage[(2*${fall})[bludgeoning]] damage and is ${failure[1]}.</p>`,
        gate: { kind: "gm-question", question: "Did its descent bring it down onto a surface? If so, it takes the falling damage (and on a failure is Prone and can't leave the ground for 1 minute).", sourceText: htmlToPlainText(row("Success")).trim() },
        notes: { success: descent, failure: { ...descent, text: `${descent.text} If it hit a surface, it ${failure[2]} for ${failure[3]} minute${failure[3] === "1" ? "" : "s"}.`, sourceText: htmlToPlainText(row("Failure")).trim(),
            duration: { mode: "fixed", value: Number(failure[3]), unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: `for ${failure[3]} minute` } } },
        reminder: { kind: "spell-note", text: "If the surface was nearer than the full descent, the fall is half the distance it actually fell (adjust the damage).", sourceText: htmlToPlainText(row("Success")).trim() },
        sentences: [htmlToPlainText(trigger).trim(), narrate, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(h => htmlToPlainText(row(h)).trim()), htmlToPlainText(heightened).trim()]
    };
}
