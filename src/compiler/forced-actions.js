// A save whose failing target the caster makes act (Puppet Strings): "Failure The target is clumsy 1 and Slowed 1. Additionally, when you Cast this
// Spell and the first time you Sustain it on subsequent turns, you can force the target to Stride or Strike. If you force the target to Stride, you
// determine the path it takes; … This is forced movement. If you cause the creature to Strike, it makes a melee Strike against a creature within its
// reach using your spell attack modifier. … On a hit, the Strike deals 7d6 bludgeoning, piercing, or slashing damage, as appropriate. … At the end of its
// turn, the target can attempt a Fortitude save against your spell DC to free itself from the threads. On a success, the spell ends." with "Critical
// Failure As failure, but the target is Slowed 2, and you can force the target to use 2 actions when you Cast or Sustain the spell."
// The rows keep their conditions; the forced actions are the spell's controls (a Strike with the caster's spell attack, the type the caster picks;
// a Stride the GM moves); the end-of-turn save a note Effect on the failing target that ends the spell on a success.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+)(?: (\d))?\}`;
const BARE = /^(clumsy|slowed|stunned|enfeebled|stupefied) (\d)$/i;
const plain = html => htmlToPlainText(String(html ?? "")).replace(/\s+/g, " ").trim();
const NARRATION = /\d|@|\b(?:damage|save|bonus|penalty|condition|Stride|Strike|Sustain|actions?|ends?)\b/i;

const FORCE = /^Additionally, when you Cast this Spell and the first time you Sustain it on subsequent turns, you can force the target to (Stride) or (Strike)\.$/;
const STRIDE = [/^If you force the target to Stride, you determine the path it takes;$/, /^you can't force it to Stride into a space where it can't stand easily\.$/, /^This is forced movement\.$/];
const STRIKE = /^If you cause the creature to Strike, it makes a melee Strike against a creature within its reach using your spell attack modifier\.$/;
const NOT_SELF = /^The target can't hit itself this way\.$/;
const HIT = /^On a hit, the Strike deals (\d+d\d+) ((?:[a-z]+, )+)?([a-z]+),? or ([a-z]+) damage, as appropriate\.$/;
const NO_GEAR = /^None of the target's equipment or abilities modify this Strike\.$/;
const MAP = /^This Strike contributes to and uses your multiple attack penalty\.$/;
const FREE = /^At the end of its turn, the target can attempt an? (Fortitude|Reflex|Will) save against your spell DC to free itself from the [a-z]+\.$/;
const FREED = /^On a success, the spell ends\.$/;
const CRITICAL = new RegExp(String.raw`^As failure, but the target is ${C}, and you can force the target to use (\d|two|three) actions when you Cast or Sustain the spell\.$`);

/** {html, controls, freeSave, criticalActions, sentences} or null. */
export function extractForcedActions(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || !adapted.lifecycle?.sustained) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const rows = {};
    for (const [key, heading] of [["criticalSuccess", "Critical Success"], ["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]]) {
        const m = new RegExp(String.raw`<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>`).exec(html);
        if (!m) return null;
        rows[key] = m[1].trim();
    }
    const intro = html.split(/<hr\s*\/?>/i)[0];
    // The failure: its conditions first, then the forced actions and the save to break free.
    const parts = plain(rows.failure).split(/(?<=[.!?;])\s+(?=[A-Za-z])/).filter(Boolean);
    const lead = /^The target is (.+)\.$/.exec(parts[0] ?? "");
    if (!lead) return null;
    const conditions = lead[1].split(/,? and |, /).map(entry => entry.trim());
    if (!conditions.every(entry => BARE.test(entry) || new RegExp(`^${C}$`).test(entry))) return null;
    let at = 1;
    const force = FORCE.exec(parts[at++] ?? "");
    if (!force) return null;
    for (const pattern of STRIDE) if (!pattern.test(parts[at++] ?? "")) return null;
    if (!STRIKE.test(parts[at++] ?? "") || !NOT_SELF.test(parts[at++] ?? "")) return null;
    const hit = HIT.exec(parts[at++] ?? "");
    if (!hit) return null;
    if (!NO_GEAR.test(parts[at++] ?? "") || !MAP.test(parts[at++] ?? "")) return null;
    const free = FREE.exec(parts[at++] ?? "");
    if (!free || !FREED.test(parts[at++] ?? "") || at !== parts.length) return null;
    const critical = CRITICAL.exec(plain(rows.criticalFailure));
    if (!critical) return null;
    // The success: narration of the strings, then its condition.
    const success = plain(rows.success).split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    const successRule = success.filter(sentence => NARRATION.test(sentence));
    if (successRule.length !== 1 || success.filter(sentence => !NARRATION.test(sentence)).some(sentence => !/\bcan't control\b/.test(sentence))) return null;
    if (!/^The target is unaffected\.$/.test(plain(rows.criticalSuccess))) return null;
    const types = [...(hit[2] ? hit[2].split(/,\s*/).filter(Boolean) : []), hit[3], hit[4]];
    const actions = { two: 2, three: 3 }[critical[4]] ?? Number(critical[4]);
    const critCondition = `@UUID[${critical[1]}]{${critical[2]}${critical[3] ? ` ${critical[3]}` : ""}}`;
    const failConditions = conditions;
    const slug = name => name.replace(/^@UUID\[[^\]]+\]\{/, "").replace(/\}$/, "").replace(/ \d$/, "").toLowerCase();
    const critConditions = [...failConditions.filter(entry => slug(entry) !== critical[2].toLowerCase()), critCondition];
    const rewritten = `${intro}<hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> ${successRule[0]}</p>`
        + `<p><strong>Failure</strong> The target is ${failConditions.join(" and ")}.</p><p><strong>Critical Failure</strong> The target is ${critConditions.join(" and ")}.</p>`;
    const freeText = `At the end of its turn, it can attempt a ${free[1]} save against the spell DC to free itself; on a success, the spell ends.`;
    return {
        html: rewritten,
        freeSave: { statistic: free[1].toLowerCase(), text: freeText, sourceText: `${free[0]} ${parts[at - 1]}` },
        controls: {
            degrees: ["failure", "criticalFailure"], label: "Forced actions",
            strike: { formula: hit[1], types, sourceText: parts.slice(5, 10).join(" ") },
            stride: { text: "You choose the path of its Stride (forced movement); it can't be forced into a space where it can't stand easily. Move its token.", sourceText: parts.slice(2, 5).join(" ") },
            actions: { failure: 1, criticalFailure: actions }, sourceText: force[0]
        },
        sentences: { failure: parts, criticalFailure: critical[0], success: success }
    };
}
