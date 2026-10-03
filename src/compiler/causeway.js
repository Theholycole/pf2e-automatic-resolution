// A path the caster speeds along and others slog through (Glacial Causeway; user decision 2026-10-01: terrain for only some creatures is the region
// for everyone plus an exemption Effect):
//   "You create a path of ice that begins beneath your feet and extends up to 120 feet in a straight line, starting from you." / "When you end
//   your turn on the path, you gain the Quickened condition until the end of your next turn and can use the extra action only to Stride." /
//   "Other creatures treat the path as difficult terrain."
// The path is a placed line region of difficult terrain for the duration; the caster gets an Effect saying it ignores that terrain; when the
// caster's turn ends on the path, it's Quickened until the end of its next turn (the Stride-only use is the Effect's note).
import { htmlToPlainText } from "./description-parser.js";

const PATH = /^You create a path of ice that begins beneath your feet and extends up to (\d+) feet in a straight line, starting from you\.$/;
const QUICK = /^When you end your turn on the path, you gain the @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Quickened\} condition until the end of your next turn and can use the extra action only to Stride\.$/;
const OTHERS = /^Other creatures treat the path as difficult terrain\.$/;

/** Returns {causeway, claimed} or null. */
export function compileCauseway(adapted) {
    const fixed = /^(\d+) (minute|round)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "none" || !fixed || area?.type !== "line" || /<hr\b|Heightened/i.test(String(adapted.descriptionHTML ?? ""))) return null;
    const sentences = String(adapted.descriptionHTML ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    if (sentences.length !== 3) return null;
    const path = PATH.exec(sentences[0]), quick = QUICK.exec(sentences[1]);
    if (!path || !quick || !OTHERS.test(sentences[2]) || Number(path[1]) !== Number(area.value)) return null;
    return {
        causeway: { area: { type: "line", value: Number(area.value) }, durationSeconds: Number(fixed[1]) * (fixed[2].toLowerCase() === "round" ? 6 : 60),
            casterTurnEnd: { uuid: quick[1], label: "Quickened", note: "Quickened until the end of your next turn; use the extra action only to Stride." },
            exemption: "You ignore the path's difficult terrain (the region applies it to everyone; the GM adjusts your movement)." },
        claimed: sentences.map(sentence => htmlToPlainText(sentence))
    };
}
