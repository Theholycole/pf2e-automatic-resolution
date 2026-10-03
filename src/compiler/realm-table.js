// Damage types from a rolled table (Chthonian Wrath): "The damage types of the spell (one energy and one physical) are based on the result of rolling
// on the table below." / "You deal 4d6 damage of each of the corresponding damage types to each creature in the cone (8d6 total damage)." with a
// [[/r 1D4]] table whose rows name a realm and "Bludgeoning and electricity" — the item's two untyped entries, typed by the row the caster rolls:
// the card's choice of realm (the roll is the caster's), each realm's pair of types.
import { htmlToPlainText } from "./description-parser.js";

const BASED_ON = /^The damage types of the spell \(one energy and one physical\) are based on the result of rolling on the table below\.$/;
const DEAL_EACH = /^You deal (\d+d\d+) damage of each of the corresponding damage types to each creature in the (cone|burst|emanation|line) \((\d+d\d+) total damage\)\.$/;
const ROW = /<tr>\s*<td>\s*(\d)\s*<\/td>\s*<td>\s*([A-Z][a-z]+)\s*<\/td>\s*<td>[^<]*<\/td>\s*<td>\s*([A-Z][a-z]+) and ([a-z]+)\s*<\/td>\s*<\/tr>/g;
const TYPES = new Set(["acid", "bludgeoning", "cold", "electricity", "fire", "piercing", "slashing", "sonic", "force", "poison", "mental", "spirit", "vitality", "void"]);

/** {html, choice, sourceText} or null. */
export function rewriteRealmTable(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || !adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 2 || components.some(component => component.category || String(component.type).toLowerCase() !== "untyped")) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const table = /<table[\s\S]*?<\/table>/i.exec(html);
    if (!table || !/\[\[\/r 1D4\]\]/i.test(table[0])) return null;
    const [body, ...rest] = html.slice(0, table.index).split(/<hr\s*\/?>/i);
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const based = sentences.findIndex(sentence => BASED_ON.test(sentence)), deal = sentences.findIndex(sentence => DEAL_EACH.test(sentence));
    if (based < 0 || deal !== based + 1 || sentences.length !== deal + 1 || sentences.slice(0, based).some(sentence => /\d|@|\b(?:damage|save)\b/i.test(sentence))) return null;
    const dealt = DEAL_EACH.exec(sentences[deal]);
    if (dealt[2] !== adapted.targeting.area.type || components.some(component => String(component.formula).replace(/\s+/g, "") !== dealt[1])) return null;
    const rows = [...table[0].matchAll(ROW)];
    if (rows.length !== 4 || rows.some((row, index) => Number(row[1]) !== index + 1)) return null;
    const pairs = {};
    for (const row of rows) {
        const pair = [row[3].toLowerCase(), row[4].toLowerCase()];
        if (pair.some(type => !TYPES.has(type)) || pair[0] === pair[1]) return null;
        pairs[row[2].toLowerCase()] = pair;
    }
    // The Heightened entry is the item's own step for both entries.
    // (The table's own heading follows the entry: "<h2>Chthonian Wrath</h2>".)
    const heightened = htmlToPlainText(rest.join(" ").replace(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/gi, "")).replace(/\s+/g, " ").trim();
    const step = /^Heightened \(\+(\d)\) The damage for each type increases by (\d+d\d+)\.?$/.exec(heightened);
    if (!step || adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== Number(step[1]) || components.some(component => adapted.heightening.damage?.[component.id] !== step[2])) return null;
    const values = Object.keys(pairs);
    return {
        html: `<p>Each creature in the ${dealt[2]} takes ${dealt[1]} damage and ${dealt[1]} damage with a basic ${adapted.defense.statistic[0].toUpperCase()}${adapted.defense.statistic.slice(1)} save.</p><hr /><p><strong>Heightened (+${step[1]})</strong> The damage increases by ${step[2]} and ${step[2]}.</p>`,
        choice: { kind: "damage-pair", values, pairs, label: `Realm (roll 1d4: ${rows.map(row => `${row[1]} ${row[2].toLowerCase()}, ${row[3].toLowerCase()} and ${row[4].toLowerCase()}`).join("; ")})` },
        sourceText: [sentences[based], sentences[deal], heightened]
    };
}
