// A d20 kept for later (Lucky Decision): "As part of casting this spell roll a d20 and make note of the result. For the duration of the spell you gain the Your Good
// Luck and Their Bad Luck reactions. If you use either reaction the spell ends immediately." / "Your Good Luck … Trigger You are about to attempt a non-secret attack
// roll, saving throw, or skill check; Effect … Instead of rolling a d20, you use the result you rolled when casting this spell for your roll. This is a fortune
// effect." / "Their Bad Luck … Trigger An enemy creature is about to attempt an attack roll, saving throw, or skill check; Effect … The target must attempt a Will
// save." with "Critical Success The target is unaffected." / "Success The target rolls their check with a –2 status penalty." / "Failure The target uses your roll
// from this spell for the triggering roll and takes a –2 status penalty to the check." / "Critical Failure As failure, except the status penalty is a –4 status
// penalty.": the d20 rolled at the cast and kept on the caster's Effect until the next daily preparations; its card's two reactions — the caster's next such roll
// is the kept result (PF2e's SubstituteRoll, a fortune effect), or the enemy's Will save and its next such roll's penalty (and the kept result on a failure);
// either ends the spell.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES } from "./text-patterns.js";

const LEAD = [/^As part of casting this spell roll a d20 and make note of the result\.$/, /^For the duration of the spell you gain the ([A-Z][a-z]+(?: [A-Z][a-z]+)*) and ([A-Z][a-z]+(?: [A-Z][a-z]+)*) reactions\.$/,
    /^If you use either reaction the spell ends immediately\.$/];
const GOOD = /^(.+?) r \(manipulate\) Trigger (You are about to attempt a non-secret attack roll, saving throw, or skill check); Effect You insert the fate you have made for yourself\. Instead of rolling a d20, you use the result you rolled when casting this spell for your roll\. This is a fortune effect\.$/;
const BAD = /^(.+?) r \(manipulate\) Trigger (An enemy creature is about to attempt an attack roll, saving throw, or skill check); Effect You steal the creature's fate and insert your own\. The target must attempt a (Fortitude|Reflex|Will) save\.$/;
const ROWS = { criticalSuccess: /^The target is unaffected\.$/, success: /^The target rolls their check with a [–-](\d) status penalty\.$/,
    failure: /^The target uses your roll from this spell for the triggering roll and takes a [–-](\d) status penalty to the check\.$/, criticalFailure: /^As failure, except the status penalty is a [–-](\d) status penalty\.$/ };

/** {fate, sentences} or null. */
export function extractFateRoll(item) {
    if (!/^until your next daily preparations$/.test(String(item?.system?.duration?.value ?? "").trim()) || Object.keys(item.system?.damage ?? {}).length) return null;
    const paragraphs = [...String(item.system?.description?.value ?? "").matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1].replace(/<span class="action-glyph">\s*([a-z0-9])\s*<\/span>/gi, "$1")).replace(/\s+/g, " ").trim().replace(/[’]/g, "'"));
    const lead = (paragraphs[0] ?? "").split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const reactions = LEAD[1].exec(lead[2] ?? ""), good = GOOD.exec(paragraphs[1] ?? ""), bad = BAD.exec(paragraphs[2] ?? "");
    const row = heading => (paragraphs.find(p => p.startsWith(`${heading} `)) ?? "").slice(heading.length + 1);
    const rows = { criticalSuccess: ROWS.criticalSuccess.test(row("Critical Success")), success: ROWS.success.exec(row("Success")), failure: ROWS.failure.exec(row("Failure")), criticalFailure: ROWS.criticalFailure.exec(row("Critical Failure")) };
    if (paragraphs.length !== 7 || lead.length !== 4 || NARRATION_RULES.test(lead[0]) || !LEAD[0].test(lead[1]) || !reactions || !LEAD[2].test(lead[3]) || !good || !bad
        || good[1] !== reactions[1] || bad[1] !== reactions[2] || Object.values(rows).some(entry => !entry) || bad[3].toLowerCase() !== item.system?.defense?.save?.statistic) return null;
    return {
        fate: { good: { name: good[1], trigger: good[2] }, bad: { name: bad[1], trigger: bad[2], statistic: bad[3].toLowerCase(),
            rows: { criticalSuccess: null, success: { penalty: Number(rows.success[1]), substitute: false }, failure: { penalty: Number(rows.failure[1]), substitute: true }, criticalFailure: { penalty: Number(rows.criticalFailure[1]), substitute: true } } },
            selectors: ["attack-roll", "saving-throw", "skill-check"] },
        sentences: [...lead.slice(1), paragraphs[1], paragraphs[2], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(row)]
    };
}
