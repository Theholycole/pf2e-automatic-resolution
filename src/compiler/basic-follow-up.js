// A basic save followed by something the caster does when the target fails, which the module can't roll for them:
//   Brain Drain: "If the target fails the save, you sort through the stolen memories to attempt a single check to
//   Recall Knowledge. Choose a skill that has the Recall Knowledge action, and use the target's skill modifier for the
//   check."
// The card shows it to the caster for each target that failed. The rest of the text must be a plain basic save.
import { analyzeDescription, htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";
import { assessSimpleBasicSaveDescription } from "./semantic-gate.js";

const FAILED = /^If the target fails (?:the|its) save, you [^.]*@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[^\]]+\]\{[^}]+\}[^.]*\.$/;
// Instructions for that action only: no damage, condition, number or other rule.
const INSTRUCTION = /^(?:Choose|Use) [^.]+\.$/;
const RULE_WORDS = /\d|@UUID\[Compendium\.pf2e\.conditionitems|\b(?:damage|save|bonus|penalty|immune|condition|spell ends|Sustain)\b/i;

export function compileBasicFailedSaveFollowUp(adapted) {
    if (!adapted.defense?.basic) return null;
    const sentences = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML)).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
    const start = sentences.findIndex(sentence => FAILED.test(sentence));
    if (start < 0 || sentences.filter(sentence => FAILED.test(sentence)).length !== 1) return null;
    const follow = [sentences[start]];
    for (const sentence of sentences.slice(start + 1)) {
        if (!INSTRUCTION.test(sentence)) break;
        follow.push(sentence);
    }
    // The action sentence may name the action; nothing else in the follow-up may state a rule.
    const plain = sentence => sentence.replace(/@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[^\]]+\]\{([^}]+)\}/g, "$1");
    if (follow.some(sentence => RULE_WORDS.test(plain(sentence).replace(/^If the target fails (?:the|its) save, /, "")))) return null;
    const remainder = sentences.filter(sentence => !follow.includes(sentence)).join(" ");
    if (!assessSimpleBasicSaveDescription({ ...adapted, descriptionHTML: remainder }, analyzeDescription(remainder)).complete) return null;
    const text = follow.map(sentence => sentence.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")).join(" ");
    return { reminder: { kind: "failed-save-follow-up", degrees: ["failure", "criticalFailure"], text }, sentences: follow };
}
