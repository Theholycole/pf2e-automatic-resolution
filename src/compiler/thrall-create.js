// Thralls conjured as tokens (Create Thrall): "You conjure forth the undead. You either create 2 thralls in unoccupied squares within range or create 1 thrall and
// immediately {Command} that Thrall." — the caster's choice (two, or one and its Command); the thralls by the thrall rules (scripts/thrall-tokens.js), Small or
// Medium as the caster chooses, in the free squares nearest the caster within range (or the given positions), for the duration.
import { htmlToPlainText } from "./description-parser.js";

const WORDS = { 1: 1, 2: 2, 3: 3, one: 1, two: 2, three: 3 };
const OPEN = /^You conjure forth the undead\.$/;
const CREATE = /^You either create (\d|two|three) thralls in unoccupied squares within range or create (1|one) thrall and immediately (?:@UUID\[[^\]]+\]\{Command\}|Command) that Thrall\.$/;

/** {thrallCreate, claimed} or null. */
export function compileThrallCreate(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    if (!(adapted.activation?.traits ?? []).includes("thrall") || /<hr/i.test(String(adapted.descriptionHTML ?? ""))) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const range = /^(\d+) feet$/.exec(String(adapted.targeting?.range ?? "").trim());
    const sentences = htmlToPlainText(String(adapted.descriptionHTML ?? "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const create = CREATE.exec(sentences[1] ?? "");
    if (!minutes || !range || sentences.length !== 2 || !OPEN.test(sentences[0]) || !create) return null;
    return { thrallCreate: { range: Number(range[1]), seconds: Number(minutes[1]) * 60, options: [{ key: "many", count: WORDS[create[1]], command: false }, { key: "command", count: WORDS[create[2]], command: true }] },
        claimed: sentences };
}
