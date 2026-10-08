// An ice sculpture that shields its side (Oracles+'s Ice Guardian): "An ice sculpture of Large size appears adjacent to you and attempts to defend you and your allies. You
// and your allies gain lesser cover while you are adjacent to the guardian, and you can Sustain the spell to increase the cover it grants to standard cover until the
// beginning of your next turn or to move the guardian to another area by having it Stride with its land Speed of 25 feet. The guardian can be destroyed and has
// [[/r 30+(@item.level -3)*10]] Hit Points, an AC of [[/r 22+(@item.level -3)*3]], [[/r 3+(@item.level -3)*3]] weakness to bludgeoning damage, and immunity to cold." with
// "Heightened (+1) The guardian's AC and weakness increases by 3, and its Hit Points increase by 10.": the guardian a token the module makes beside the caster (its
// Hit Points, AC, weakness and immunity at the cast rank; removed with the spell or when destroyed); the caster and its allies adjacent to it hold lesser cover (a
// region following it); the Sustain's standard cover the card's part until the start of the caster's next turn; its Stride the caster's move of the token.
import { htmlToPlainText } from "./description-parser.js";

const BODY = /^You create a guardian made of ice to defend you\. An ice sculpture of (Large|Medium|Huge) size appears adjacent to you and attempts to defend you and your allies\. (You and your allies gain lesser cover while you are adjacent to the guardian), and you can Sustain the spell to increase the cover it grants to standard cover until the beginning of your next turn or to move the guardian to another area by having it Stride with its land Speed of (\d+) feet\. The guardian can be destroyed and has \[\[\/r (\d+)\+\(@item\.level -(\d+)\)\*(\d+)\]\] Hit Points, an AC of \[\[\/r (\d+)\+\(@item\.level -\5\)\*(\d+)\]\], \[\[\/r (\d+)\+\(@item\.level -\5\)\*(\d+)\]\] weakness to ([a-z]+) damage, and immunity to ([a-z]+)\.$/;
const STEP = /^Heightened \(\+1\) The guardian['’]s AC and weakness increases by (\d+), and its Hit Points increase by (\d+)\.$/;

/** {conjure, cover, sentences} or null. */
export function extractIceGuardian(item) {
    const [body, heightened, ...rest] = String(item?.system?.description?.value ?? "").split(/<hr\s*\/?>/i);
    const text = htmlToPlainText(String(body ?? "").replace(/\[\[\/r ([^\]]+)\]\]/g, (m) => m)).replace(/\s+/g, " ").trim();
    const raw = String(body ?? "").replace(/<[^>]+>/g, " ").replace(/&#39;|’/g, "'").replace(/\s+/g, " ").trim();
    const match = BODY.exec(raw), step = STEP.exec(htmlToPlainText(heightened ?? "").replace(/\s+/g, " ").trim());
    if (!match || !step || rest.length || Object.keys(item.system?.damage ?? {}).length || item.system?.defense?.save || !/^1 minute$/.test(String(item.system?.duration?.value ?? "").trim())) return null;
    const baseRank = Number(match[5]);
    if (Number(match[6]) !== Number(step[2]) || Number(match[8]) !== Number(step[1]) || Number(match[10]) !== Number(step[1]) || Number(item.system?.level?.value) !== baseRank) return null;
    void text;
    return {
        conjure: { name: "ice guardian", size: { Medium: "med", Large: "lg", Huge: "huge" }[match[1]], hp: Number(match[4]), ac: Number(match[7]), saves: 0, immunities: [match[12]],
            weaknesses: [{ type: match[11], value: Number(match[9]) }], resistances: [], traits: [], object: true, endsAtZero: true, rangeFeet: 5, speed: Number(match[3]),
            step: { baseRank, hp: Number(step[2]), ac: Number(step[1]), weakness: Number(step[1]) },
            coverAura: { feet: 5, label: "Lesser cover (beside the ice guardian)", rules: [{ key: "FlatModifier", selector: "ac", type: "circumstance", value: 1, label: "Lesser cover" }] },
            sourceText: match[0] },
        cover: { sourceText: match[2] },
        sentences: [raw, htmlToPlainText(heightened ?? "").trim()]
    };
}
