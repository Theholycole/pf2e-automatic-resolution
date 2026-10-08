// The end of the world in four bursts (Patron's Apocalypse): "You select up to four non-overlapping 10-foot bursts at any point within range, even in the air. These become
// points of the apocalypse, and creatures that begin their turn in the area take the listed damage and effects of the apocalypse envisioned by your patron. When you Sustain
// the spell, you can move one of these bursts up to 30 feet, leaving hazardous terrain in the previous area that deals 10 damage of the same type as the spell would deal
// and applying the additional effects for creatures within the area of the spell. You select the type of apocalypse envisioned by your patron when you first take the
// Lesson of Apocalypses." with the table the Foundry data lacks — read from the user's own copy of the book, kept outside the module (supplement-store.js: the
// user's decision 2026-10-07, moved out of the repository 2026-10-10): each burst a region whose creatures starting their turn there take the apocalypse's damage
// (basic Reflex) and its effects; a moved burst leaves hazardous terrain (10 of the type to each creature passing through, with the effects); the apocalypse
// chosen when cast (kept on the caster).
import { htmlToPlainText } from "./description-parser.js";
import { supplement } from "./supplements/supplement-store.js";
import { WORD_NUMBERS_2_4 as COUNT, NARRATION_RULES } from "./text-patterns.js";

const TEXT = [/^You select up to (four|three|two) non-overlapping @Template\[type:burst\|distance:(\d+)\] at any point within range, even in the air\.$/,
    /^These become points of the apocalypse, and creatures that begin their turn in the area take the listed damage and effects of the apocalypse envisioned by your patron\.$/,
    /^When you Sustain the spell, you can move one of these bursts up to (\d+) feet, leaving hazardous terrain in the previous area that deals (\d+) damage of the same type as the spell would deal and applying the additional effects for creatures within the area of the spell\.$/,
    /^You select the type of apocalypse envisioned by your patron when you first take the Lesson of Apocalypses\.$/, /^This spell gains the trait associated with the damage type of your choice\.$/];
// (An entry of the table: its name, its damage dice and type, then its added effect.)
const ENTRY = /^([A-Z][a-z]+)\.\s.*?\b(\d+)d(\d+) ([a-z]+) damage\b(.*)$/;
const SICKENED = "Compendium.pf2e.conditionitems.Item.fesd1n5eVhpCSS18";

/** Each apocalypse's added effect as the module applies it, by its name and the numbers its entry gives (null when the entry doesn't say what's expected). */
function effectOf(name, rest) {
    const has = pattern => pattern.test(rest);
    switch (name) {
        case "cosmic": return has(/\bdazzled\b/) ? { memberRules: [{ key: "GrantItem", uuid: "Compendium.pf2e.conditionitems.Item.TkIyaNPgTZFBCCuh", onDeleteActions: { grantee: "restrict" } }] } : null;
        case "corpses": return has(/\bundead\b/) && has(/regain Hit Points/) ? { note: "Undead regain Hit Points equal to the damage dealt (once per round): PF2e's void healing does it." } : null;
        case "flames": return has(/\bconceal/) ? { concealment: true } : null;
        case "floods": { const m = /[–-](\d+) penalty/.exec(rest);
            return m && has(/forced movement/) && has(/\bwater\b/) ? { memberRules: [{ key: "FlatModifier", selector: ["saving-throw", "check"], value: -Number(m[1]), predicate: [{ or: ["forced-movement", "item:trait:water", "water"] }] }] } : null; }
        case "frost": { const m = /[–-](\d+)[- ]foot status penalty to (?:their )?speeds? for (\d+) rounds?/i.exec(rest);
            return m ? { always: { label: "slowed by frost", rounds: Number(m[2]), rules: [{ key: "FlatModifier", selector: "all-speeds", type: "status", value: -Number(m[1]) }] } } : null; }
        case "nature": { const m = /(\d+) persistent ([a-z]+) damage/.exec(rest); return m ? { always: { persistent: { formula: m[1], type: m[2] } } } : null; }
        case "plague": { const m = /\bsickened (\d)\b/.exec(rest); if (!m) return null;
            const conditions = [{ slug: "sickened", value: Number(m[1]), uuid: SICKENED }];
            return { failure: { conditions }, terrainAlways: { conditions: conditions.map(entry => ({ ...entry })) } }; }
        case "rapture": { const m = /\+(\d) status bonus to (?:their )?attack rolls/.exec(rest);
            return m && has(/\ballies\b/) ? { enemiesOnly: true, allyRules: [{ key: "FlatModifier", selector: "attack-roll", type: "status", value: Number(m[1]) }] } : null; }
        default: return null;
    }
}

/** {apocalypse, sentences} or null. */
export function extractPatronApocalypse(item) {
    const save = item?.system?.defense?.save;
    if (!save?.basic || item.system?.area?.type !== "burst") return null;
    const sentences = htmlToPlainText(String(/<p>([\s\S]*?)<\/p>/.exec(item.system?.description?.value ?? "")?.[1] ?? "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/);
    if (sentences.length !== TEXT.length + 1 || NARRATION_RULES.test(sentences[0])) return null;
    const found = TEXT.map((pattern, index) => pattern.exec(sentences[index + 1]));
    if (found.some(match => !match)) return null;
    // (The table: the user's copy, read at startup; without it the spell isn't automated.)
    const table = supplement("patronsApocalypse");
    if (!Array.isArray(table?.entries) || !table.entries.length) return null;
    const types = {};
    for (const line of table.entries) {
        const entry = ENTRY.exec(String(line));
        const added = entry ? effectOf(entry[1].toLowerCase(), entry[5]) : null;
        if (!entry || !added) return null;
        types[entry[1].toLowerCase()] = { name: entry[1], formula: `${entry[2]}d${entry[3]}`, type: entry[4], ...added, sourceText: line };
    }
    return {
        apocalypse: { count: COUNT[found[0][1]], radius: Number(found[0][2]), move: Number(found[2][1]), terrain: Number(found[2][2]), statistic: save.statistic, seconds: 60, sustained: /sustained/.test(String(table.duration ?? "")), types },
        sentences: sentences.slice(1)
    };
}
