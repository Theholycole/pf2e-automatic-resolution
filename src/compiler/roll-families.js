// Note-only spells whose rule is a roll (Diviner's Sight, Read Fate, Fact Check, Nudge Fate).
import { htmlToPlainText } from "./description-parser.js";

const split = html => htmlToPlainText(html).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
const RULE_WORDS = /\d|@|\[\[|\b(?:damage|saves?|saving throws?|bonus|penalty|conditions?|immune|Sustain|can't|must|checks?|DC|Hit Points|terrain|rolls?)\b/i;
const narration = sentences => sentences.every(sentence => !RULE_WORDS.test(sentence));

// Diviner's Sight: "Roll a d20; when the target attempts a non-secret saving throw or skill check, it can use the number you rolled instead of
// rolling, and the spell ends." — PF2e's SubstituteRoll on the target's saves and skill checks (optional in PF2e's check dialog, the Effect
// removed once used). "Alternatively, … reveal the result … for one of the target's secret checks …" and "Casting it again ends …" are handled
// as a note and a replacement.
const SUBSTITUTE = /^Roll a d20; when the target attempts a non-secret saving throw or skill check, it can use the number you rolled instead of rolling, and the spell ends\.$/;
const SECRET = /^Alternatively, you can instead reveal the result of the die roll for one of the target's secret checks during the duration, and the spell ends\.$/;
const RECAST = /^Casting it again ends any active [a-z' ]+ you have cast, as well as any active [a-z' ]+ on the target\.$/;
export function compileSubstituteRoll(adapted) {
    if (adapted.defense?.kind !== "none" || !/^1 willing living creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    if (!/^until the end of your next turn$/i.test(String(adapted.lifecycle?.duration ?? "").trim()) || /<hr\b/i.test(String(adapted.descriptionHTML))) return null;
    const sentences = split(adapted.descriptionHTML);
    const at = sentences.findIndex(sentence => SUBSTITUTE.test(sentence));
    if (at < 0 || sentences.length !== at + 3 || !SECRET.test(sentences[at + 1]) || !RECAST.test(sentences[at + 2]) || !narration(sentences.slice(0, at))) return null;
    return { substituteRoll: { selectors: ["saving-throw", "skill-check"], notSecret: true, replaces: true, notes: [sentences[at + 1]] }, claimed: sentences };
}

// Read Fate: "The GM rolls a secret @Check[flat|dc:6|traits:secret]. If the creature's fate is too uncertain, or on a failed flat check, the spell
// yields the word "inconclusive." Either way, the creature is then temporarily immune for 24 hours." — the module rolls the secret flat check
// for the GM, and the immunity marker goes on the target.
const SECRET_FLAT = /^The GM rolls a secret @Check\[flat\|dc:(\d+)\|traits:secret\]\.$/;
const INCONCLUSIVE = /^If the creature's fate is too uncertain, or on a failed flat check, the spell yields the word "inconclusive\."$/;
const IMMUNE = /^Either way, the creature is then temporarily immune for (\d+) hours\.$/;
export function compileSecretFlatCheck(adapted) {
    if (adapted.defense?.kind !== "none" || !/^1 creature other than you$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<hr\b/i.test(html)) return null;
    const sentences = htmlToPlainText(html).replace(/\s+/g, " ").trim().split(/(?<=[.!?"])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => SECRET_FLAT.test(sentence));
    if (at < 0 || sentences.length !== at + 3 || !INCONCLUSIVE.test(sentences[at + 1]) || !IMMUNE.exec(sentences[at + 2])) return null;
    // The sentences before it say what the spell reveals (the GM's): no other rules.
    if (sentences.slice(0, at).some(sentence => /@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|DC)\b/i.test(sentence))) return null;
    return { secretFlatCheck: { dc: Number(SECRET_FLAT.exec(sentences[at])[1]), immunityHours: Number(IMMUNE.exec(sentences[at + 2])[1]), reveals: sentences.slice(0, at).join(" ") }, claimed: sentences };
}

// Fact Check: "Trigger You or an ally within 30 feet attempts a check to Recall Knowledge using a skill in which you're trained." / "Attempt a
// check using the same skill as the triggering check." with the degree table — the module rolls the caster's check with that skill and posts
// what the degree tells (the GM answers).
const FACT_TRIGGER = /^<p>\s*<strong>\s*Trigger\s*<\/strong>\s*You or an ally within (\d+) feet attempts a check to (?:@UUID\[[^\]]+\]\{Recall Knowledge\}|Recall Knowledge) using a skill in which you're trained\.\s*<\/p>/;
const SAME_SKILL = /^Attempt a check using the same skill as the triggering check\.$/;
export function compileRepeatCheck(adapted) {
    if (adapted.defense?.kind !== "none" || !/^reaction$/i.test(String(adapted.activation?.time ?? "").trim())) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const trigger = FACT_TRIGGER.exec(html);
    if (!trigger) return null;
    const rest = html.slice(trigger[0].length).replace(/^\s*<hr\s*\/?>\s*/i, "");
    const table = [...rest.matchAll(/<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>\s*([^<]+)/gi)].map(match => ({ degree: match[1], text: match[2].trim() }));
    const lead = split(rest.split(/<(?:p|li)>\s*<strong>\s*(?:Critical Success|Success|Failure|Critical Failure)/i)[0]);
    const at = lead.findIndex(sentence => SAME_SKILL.test(sentence));
    // (Narration may size what the spell shows: "a 2-inch-tall illusory avatar".)
    if (at < 0 || at !== lead.length - 1 || !narration(lead.slice(0, at).map(sentence => sentence.replace(/\b\d+-(?:inch|foot)-(?:tall|long|wide)\b/g, "").replace(/\bdouble-check\b/g, ""))) || table.length < 3) return null;
    return { repeatCheck: { rangeFeet: Number(trigger[1]), trainedOnly: true, action: "recall-knowledge", outcomes: Object.fromEntries(table.map(row => [row.degree.replace(/ (\w)/, (_, letter) => letter.toUpperCase()).replace(/^./, letter => letter.toLowerCase()), row.text])) },
        claimed: [...lead, ...table.map(row => row.text)] };
}

// Nudge Fate: "When the target fails an attack roll, skill check, or saving throw and a +1 status bonus would turn a critical failure into a
// failure, or failure into a success, you grant the target a +1 status bonus to the check retroactively, changing the outcome appropriately.
// The spell then ends. If you cast nudge fate while a previous casting of this hex is still in effect, the previous effect ends" — a watcher
// Effect on the target: the module re-grades the first failed roll the +1 improves, and the Effect ends.
const NUDGE = /^When the target fails an attack roll, skill check, or saving throw and a \+(\d) status bonus would turn a critical failure into a failure, or failure into a success, you grant the target a \+\d status bonus to the check retroactively, changing the outcome appropriately\.$/;
const ENDS = /^The spell then ends\.$/;
const HEX_RECAST = /^If you cast [a-z' ]+ while a previous casting of this hex is still in effect, the previous effect ends\.?$/;
export function compileRetroBonus(adapted) {
    if (adapted.defense?.kind !== "none" || !/^1 creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!minutes || /<hr\b/i.test(String(adapted.descriptionHTML))) return null;
    const sentences = split(adapted.descriptionHTML);
    const at = sentences.findIndex(sentence => NUDGE.test(sentence));
    if (at < 0 || sentences.length !== at + 3 || !ENDS.test(sentences[at + 1]) || !HEX_RECAST.test(sentences[at + 2]) || !narration(sentences.slice(0, at))) return null;
    return { retroBonus: { value: Number(NUDGE.exec(sentences[at])[1]), type: "status", rolls: ["attack-roll", "spell-attack-roll", "skill-check", "saving-throw"], durationSeconds: Number(minutes[1]) * 60, replaces: true }, claimed: sentences };
}
