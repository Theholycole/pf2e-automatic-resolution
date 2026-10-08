// A weapon that will bring death to a foe (Implement of Destruction): "… The effect is based on the target enemy's Will save." with rows "The target
// enemy is unaffected." / "The target weapon deals an additional @Damage[2d6[mental]] damage the first time it hits the target enemy before the end of
// the spell's duration." / "The target weapon deals an additional @Damage[2d6[persistent,mental]] damage to the target enemy. If the enemy is critically
// hit by the weapon, the enemy is @UUID[…]{Doomed 1} for as long as it takes this persistent mental damage." / "The target weapon deals an additional
// @Damage[4d6[persistent,mental]] damage to the target enemy. If the enemy is critically hit by the weapon, the enemy is doomed 1." and "Heightened (+2)
// Increase the mental damage by 1d6 on a success, and increase the persistent mental damage by 1d6 on a failure or by 2d6 on a critical failure.": the
// enemy's save; each row a note on it whose controls the GM uses when the weapon hits it (the success's damage once; the failing rows' persistent
// damage each hit) or critically hits it (the same damage and Doomed 1 — while it takes that persistent damage after a failure); the weapon a reminder.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_UUID_START as C, NARRATION_RULES } from "./text-patterns.js";

const LEAD = /^The effect is based on the target enemy's (Fortitude|Reflex|Will) save\.$/;
const TARGET = /^1 enemy, and (1 weapon that is either unattended or wielded by you or a willing ally)$/;
const SUCCESS = /^The target weapon deals an additional @Damage\[(\d+)d(\d+)\[([a-z]+)\]\] damage the first time it hits the target enemy before the end of the spell's duration\.$/;
const FAILURE = new RegExp(String.raw`^The target weapon deals an additional @Damage\[(\d+)d(\d+)\[persistent,([a-z]+)\]\] damage to the target enemy\. If the enemy is critically hit by the weapon, the enemy is ${C}(Doomed) (\d)\} for as long as it takes this persistent \3 damage\.$`);
const CRITICAL = /^The target weapon deals an additional @Damage\[(\d+)d(\d+)\[persistent,([a-z]+)\]\] damage to the target enemy\. If the enemy is critically hit by the weapon, the enemy is (doomed) (\d)\.$/;
const STEP = /^Heightened \(\+(\d)\) Increase the ([a-z]+) damage by (\d)d(\d+) on a success, and increase the persistent \2 damage by (\d)d\4 on a failure or by (\d)d\4 on a critical failure\.$/;

/** {html, target, notes: {degree: note}, reminder, sentences} or null. */
export function rewriteDestructionImplement(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const target = TARGET.exec(String(adapted.targeting?.target ?? "").trim());
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!target || !table || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const lead = LEAD.exec(sentences.at(-1) ?? "");
    if (!lead || sentences.slice(0, -1).some(sentence => NARRATION_RULES.test(sentence)) || lead[1].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(row("Failure")), critical = CRITICAL.exec(row("Critical Failure"));
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (rows.length !== 4 || htmlToPlainText(row("Critical Success")).trim() !== "The target enemy is unaffected." || !success || !failure || !critical || !step) return null;
    const type = success[3];
    if (failure[3] !== type || critical[3] !== type || step[2] !== type || [success[2], failure[2], critical[2]].some(die => die !== step[4])) return null;
    const baseRank = Number(adapted.rank) || 1, interval = Number(step[1]);
    const plain = heading => htmlToPlainText(row(heading)).replace(/\s+/g, " ").trim();
    const note = (heading, text, triggeredDamage) => ({ label: "Implement of destruction", text, sourceText: plain(heading), claimsRow: true, triggeredDamage });
    const doomed = { uuid: failure[4], slug: failure[5].toLowerCase(), value: Number(failure[6]) };
    return {
        html: `<p>${sentences.slice(0, -1).join(" ")} The target must attempt a ${lead[1]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
            + `<p><strong>Success</strong> The target is unaffected.</p><p><strong>Failure</strong> The target is unaffected.</p><p><strong>Critical Failure</strong> The target is unaffected.</p>`,
        target: "1 enemy",
        notes: {
            success: note("Success", plain("Success"), { trigger: "weapon-hit", dice: Number(success[1]), die: Number(success[2]), type, frequency: "once", endsSpell: true, baseRank,
                heightening: { interval, dice: Number(step[3]) } }),
            failure: note("Failure", plain("Failure"), { trigger: "weapon-hit", dice: Number(failure[1]), die: Number(failure[2]), type, persistent: true, frequency: "each", endsSpell: false, baseRank,
                heightening: { interval, dice: Number(step[5]) }, criticalCondition: { ...doomed, whilePersistent: true } }),
            criticalFailure: note("Critical Failure", plain("Critical Failure"), { trigger: "weapon-hit", dice: Number(critical[1]), die: Number(critical[2]), type, persistent: true, frequency: "each", endsSpell: false, baseRank,
                heightening: { interval, dice: Number(step[6]) }, criticalCondition: { ...doomed, value: Number(critical[5]), whilePersistent: false } })
        },
        reminder: { kind: "spell-note", text: `The weapon: ${target[1]}. Use the target's controls in Ongoing spells when that weapon hits it (or critically hits it).`, sourceText: adapted.targeting.target },
        sentences: [...sentences, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(h => plain(h)), htmlToPlainText(heightened).trim(), adapted.targeting.target]
    };
}
