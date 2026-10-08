// A touch that reworks a creature's attributes (Instant Surgery): "Make a spell attack roll against the target's AC. If you have view internal anatomy active on the
// creature, your spell attack roll has a +2 circumstance bonus. If the creature is willing, they can Aid you using Medicine without having to spend the preparatory
// action normally required to Aid." with "Critical Success Select two attributes of the target and choose to boost or deplete them. All rolls made with these attributes
// gain a +1 or –1 status bonus or penalty, depending on your choice." / "Success As critical success, but one attribute must be a +1 status boost, and one must be a –1
// status penalty." and "Heightened (8th) The status bonus and penalty each increase by 1.": the caster's spell attack against the target's AC (+2 circumstance with the
// named spell's Effect on it); on a hit the caster's two picks — each a boost or a penalty on a critical hit, one of each on a hit — as the target's Effect for the
// duration (a status modifier to the rolls of each attribute); the willing creature's Aid a note.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES } from "./text-patterns.js";

const ATTACK = /^Make a spell attack roll against the target['’]s AC\.$/;
const BONUS = /^If you have ([a-z ]+) active on the creature, your spell attack roll has a \+(\d) circumstance bonus\.$/;
const AID = /^(If the creature is willing, they can Aid you using Medicine without having to spend the preparatory action normally required to Aid\.)$/;
const CRIT = /^Select (two) attributes of the target and choose to boost or deplete them\. All rolls made with these attributes gain a \+(\d) or [–-](\d) status bonus or penalty, depending on your choice\.$/;
const HIT = /^As critical success, but one attribute must be a \+(\d) status boost, and one must be a [–-](\d) status penalty\.$/;
const STEP = /^Heightened \((\d+)(?:st|nd|rd|th)\) The status bonus and penalty each increase by (\d)\.$/;
const ATTRIBUTES = ["str", "dex", "con", "int", "wis", "cha"];

/** {surgery, sentences} or null. */
export function extractInstantSurgery(item) {
    const traits = item?.system?.traits?.value ?? [];
    const rounds = /^1 minute$/.test(String(item?.system?.duration?.value ?? "").trim());
    if (!traits.includes("attack") || !rounds || item.system?.defense || Object.keys(item.system?.damage ?? {}).length || !/^1 living or corporeal undead creature$/.test(String(item.system?.target?.value ?? "").trim())) return null;
    const [body, rows = "", heightened = "", ...rest] = String(item.system?.description?.value ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const lead = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const row = heading => htmlToPlainText(String(new RegExp(String.raw`<p><strong>${heading}</strong>\s*([\s\S]*?)</p>`).exec(rows)?.[1] ?? "")).replace(/\s+/g, " ").trim();
    const bonus = BONUS.exec(lead[2] ?? ""), aid = AID.exec(lead[3] ?? ""), crit = CRIT.exec(row("Critical Success")), hit = HIT.exec(row("Success")), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (lead.length !== 4 || NARRATION_RULES.test(lead[0]) || !ATTACK.test(lead[1]) || !bonus || !aid || !crit || !hit || !step || crit[2] !== crit[3] || hit[1] !== crit[2] || hit[2] !== crit[2]
        || /<p><strong>(?:Failure|Critical Failure)<\/strong>/.test(rows)) return null;
    return {
        surgery: { anatomy: { name: bonus[1], bonus: Number(bonus[2]) }, attributes: ATTRIBUTES, value: Number(crit[2]), heightened: { rank: Number(step[1]), add: Number(step[2]) },
            picks: { criticalSuccess: { count: 2, mixed: false }, success: { count: 2, mixed: true } }, seconds: 60, notes: [aid[1]] },
        sentences: [lead[1], lead[2], lead[3], row("Critical Success"), row("Success"), htmlToPlainText(heightened).trim()]
    };
}
