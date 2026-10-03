// A banner that inspires the bearer's side (Rallying Banner): "You create an illusory banner … hovers 20 feet in the air above the target. …" / "Your allies and
// any members of the banner's associated group who are within 200 feet and who can see and hear the banner are inspired by its presence. They gain a +1
// status bonus to attack rolls and a +1 status bonus to saves against fear, emotion effects that inflict despair, and effects that would impose the
// {Confused} or {Controlled} condition. When the bearer of the banner would gain the {Fleeing} condition, they can choose to stand their ground and be
// {Stunned} for the effect's duration instead. During the duration, the target can touch a willing creature and transfer the banner to the touched creature,
// making them the new bearer of the banner. …": an aura around the bearer for the spell's duration giving the caster's allies inside (and the bearer) the
// bonuses — attack rolls, saves against fear effects (PF2e's trait), and a toggle for the despair, confusion and control saves; the group's other members,
// sight and hearing the GM's; the bearer's stand-your-ground a note; the transfer the GM's control.
import { htmlToPlainText } from "./description-parser.js";

const INSPIRED = /^Your allies and any members of the banner's associated group who are within (\d+) feet and who can see and hear the banner are inspired by its presence\.$/;
const BONUS = /^They gain a \+(\d) status bonus to attack rolls and a \+(\d) status bonus to saves against fear, emotion effects that inflict despair, and effects that would impose the (?:@UUID\[[^\]]+\]\{)?Confused\}? or (?:@UUID\[[^\]]+\]\{)?Controlled\}? condition\.$/;
const STAND = /^When the bearer of the banner would gain the (?:@UUID\[[^\]]+\]\{)?Fleeing\}? condition, they can choose to stand their ground and be (?:@UUID\[[^\]]+\]\{)?Stunned\}? for the effect's duration instead\.$/;
const TRANSFER = /^During the duration, the target can touch a willing creature and transfer the banner to the touched creature, making them the new bearer of the banner\.$/;
const ACTION = /^Touching a creature for this purpose is an action with the concentrate and manipulate traits\.$/;

/** {rallyBanner, claimed} or null. */
export function compileRallyBanner(adapted) {
    if (adapted.defense?.kind === "save" || !/^1 willing creature$/.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const paragraphs = [...String(adapted.descriptionHTML ?? "").matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1]);
    if (!minutes || paragraphs.length !== 2 || adapted.lifecycle?.sustained) return null;
    const first = htmlToPlainText(paragraphs[0]).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const second = paragraphs[1].replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (first.some(sentence => /@|\b(?:damage|save|bonus|penalty|condition)\b/i.test(sentence))) return null;
    const inspired = INSPIRED.exec(second[0] ?? ""), bonus = BONUS.exec(second[1] ?? "");
    if (second.length !== 5 || !inspired || !bonus || !STAND.test(second[2]) || !TRANSFER.test(second[3]) || !ACTION.test(second[4]) || bonus[1] !== bonus[2]) return null;
    const value = Number(bonus[1]);
    const plain = text => htmlToPlainText(text).replace(/\s+/g, " ").trim();
    return {
        rallyBanner: { radius: Number(inspired[1]), durationSeconds: Number(minutes[1]) * 60,
            member: { name: "Rallying banner", rules: [
                { key: "FlatModifier", selector: "attack-roll", type: "status", value },
                { key: "FlatModifier", selector: "saving-throw", type: "status", value, predicate: [{ or: ["item:trait:fear", "rallying-banner:resolve"] }] },
                { key: "RollOption", domain: "saving-throw", option: "rallying-banner:resolve", toggleable: true, label: "Rallying banner: against despair, or being confused or controlled" }],
                text: `${plain(second[1])} (Saves against fear effects take it automatically; toggle it for a save against despair or against becoming confused or controlled.)` },
            bearerNote: `${plain(second[2])} ${plain(second[3])} ${plain(second[4])}`,
            notes: [`${plain(second[0])} Members of the banner's group who aren't your allies, and who can't see or hear it, are the GM's.`] },
        claimed: [...first, ...second.map(plain)]
    };
}
