// A shroud that dazzles the creatures adjacent to its wearer and flashes at a creature that hits it in melee (Cloak of Colors): "A cloak of swirling colors
// shrouds the target. Creatures are {Dazzled} while adjacent to it, and attacking the target causes a brilliant flash of light. A creature that hits the target
// with a melee attack must attempt a Will save. The creature is then temporarily immune until the end of its turn; this effect has the incapacitation trait." with
// the results ("Success The attacker is unaffected." / "Failure The attacker is {Blinded} for 1 round." / "Critical Failure The attacker is {Stunned} for 1 round")
// — the wearer's Effect for the duration; the adjacent creatures (not the wearer) hold Dazzled while adjacent (Ongoing's aura); the card's control for a creature
// that hit it in melee: its save of the stated results (incapacitation), then temporarily immune until the end of its turn.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{`;
const ADJACENT = new RegExp(String.raw`^Creatures are ${C}([A-Z][a-z]+)\} while adjacent to it, and attacking the target causes a brilliant flash of light\.$`);
const HIT = /^A creature that hits the target with a melee attack must attempt an? (Will|Fortitude|Reflex) save\.$/;
const IMMUNE = /^The creature is then temporarily immune until the end of its turn; this effect has the ([a-z]+) trait\.$/;
const ROW = new RegExp(String.raw`^The attacker is (?:unaffected|${C}([A-Z][a-z]+)(?: (\d))?\} for (\d+) rounds?)\.?$`);
const LABELS = { "Critical Success": "criticalSuccess", Success: "success", Failure: "failure", "Critical Failure": "criticalFailure" };

/** {flashCloak, claimed} or null. */
export function compileFlashCloak(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || !/^1 creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, results = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!minutes || rest.length || !results.trim()) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    const raw = body.replace(/<[^@>]*>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (sentences.length !== 4 || raw.length !== 4 || /\d|@|\b(?:damage|save|bonus|penalty)\b/.test(sentences[0])) return null;
    const adjacent = ADJACENT.exec(raw[1]), hit = HIT.exec(raw[2]), immune = IMMUNE.exec(raw[3]);
    if (!adjacent || !hit || !immune) return null;
    const rows = {};
    for (const match of results.matchAll(/<p>\s*<strong>([^<]+)<\/strong>\s*([\s\S]*?)<\/p>/g)) {
        const key = LABELS[match[1].trim()], text = match[2].replace(/\s+/g, " ").trim();
        const row = ROW.exec(text);
        if (!key || !row || rows[key]) return null;
        rows[key] = row[1] ? { uuid: row[1], name: row[2], value: row[3] ? Number(row[3]) : null, rounds: Number(row[4]) } : null;
    }
    if (!("success" in rows) || !rows.failure || !rows.criticalFailure) return null;
    if (results.replace(/<p>\s*<strong>[^<]+<\/strong>[\s\S]*?<\/p>/g, "").trim()) return null;
    return { flashCloak: { seconds: Number(minutes[1]) * 60, radius: 5, adjacent: { uuid: adjacent[1], name: adjacent[2] }, statistic: hit[1].toLowerCase(), trait: immune[1], rows, immuneText: sentences[3] },
        claimed: [...sentences, ...[...results.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim())] };
}
