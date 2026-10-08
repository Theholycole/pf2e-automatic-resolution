// Dreams loosed in an aura (Dream Logic): "All creatures within the aura must make a Will save; on a failure, roll 1d4 to determine the results on the table below. On a
// critical failure, roll twice, taking the result chosen by the caster. Creatures can choose to get the result of a failure on their save." with the table — 1 Object
// Fallacy ("Until the start of your next turn, you can speak to inanimate objects … You have a +1 circumstance bonus to Make a Request or Demoralize while this effect
// is active."), 2 Static Time ("Effects and conditions with a duration affecting you are extended by 1d4 rounds."), 3 Untethered To Ground ("The creature gains a fly
// Speed equal to its land Speed until the end of its next turn."), 4 Warped Energy ("Until the end of the creature's turn, if the creature deals acid, cold,
// electricity, fire or sonic damage, it instead deals another energy damage type (roll 1d4 randomly to determine which other damage type). …"): each creature in the
// caster's aura when it's cast saves (or takes a failure); the table rolled for each that fails (twice on a critical failure, the caster picking); each entry's
// effect — the +1 to Make a Request and Demoralize, the creature's timed Effects lengthened, the module's fly Speed Effect (checked against the text), each energy
// type's replacement rolled.
import { htmlToPlainText } from "./description-parser.js";
import { DOMAIN, ITEM_LINK as LINK, NARRATION_RULES } from "./text-patterns.js";

const LEAD = [/^All creatures within the aura must make a (Fortitude|Reflex|Will) save; on a failure, roll \[\[\/r 1d(\d)\]\] to determine the results on the table below\.$/,
    /^On a critical failure, roll twice, taking the result chosen by the caster\.$/, /^Creatures can choose to get the result of a failure on their save\.$/];
const ENTRIES = [
    { kind: "social", pattern: /^Object Fallacy (Even things without minds seem to speak here\.) Until the start of your next turn, (you can speak to inanimate objects; they will respond only to you using a language you understand that only you can hear\.) You have a \+(\d) circumstance bonus to Make a Request or Demoralize while this effect is active\.$/ },
    { kind: "extend", pattern: /^Static Time (Clocks tick irregularly, moving backwards as often as forwards\.) Effects and conditions with a duration affecting you are extended by 1d(\d) rounds\.$/ },
    { kind: "fly", pattern: /^Untethered To Ground (Gravity acts as more of a suggestion than a rule\.) The creature gains a fly Speed equal to its land Speed until the end of its next turn\.$/ },
    { kind: "warp", pattern: /^Warped Energy (Energies are maladapted in the area\.) Until the end of the creature's turn, if the creature deals ([a-z]+), ([a-z]+), ([a-z]+), ([a-z]+) or ([a-z]+) damage, it instead deals another energy damage type \(roll 1d4 randomly to determine which other damage type\)\. (If a creature would deal more than one type of these damage types, you choose which damage type is altered\.)$/ }];

/** {table, sentences} or null. */
export function extractDreamTable(item, catalog = null) {
    const area = item?.system?.area, save = item?.system?.defense?.save;
    if (area?.type !== "emanation" || !save?.statistic || !/^1 minute$/.test(String(item.system?.duration?.value ?? "").trim()) || Object.keys(item.system?.damage ?? {}).length) return null;
    const [domain, body, ...rest] = String(item.system?.description?.value ?? "").split(/<hr\s*\/?>/i);
    if (rest.length || !DOMAIN.test(String(/<p>([\s\S]*?)<\/p>/.exec(domain ?? "")?.[1] ?? "").trim())) return null;
    const lead = htmlToPlainText(String(/^\s*<p>([\s\S]*?)<\/p>/.exec(body ?? "")?.[1] ?? "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const first = LEAD[0].exec(lead[2] ?? "");
    if (lead.length !== 5 || NARRATION_RULES.test(lead[0]) || NARRATION_RULES.test(lead[1]) || !first || !LEAD[1].test(lead[3]) || !LEAD[2].test(lead[4]) || first[1].toLowerCase() !== save.statistic) return null;
    const rows = [...String(body).matchAll(/<tr>\s*<td>\s*<p>(\d)<\/p>\s*<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/gi)].map(match => ({ roll: Number(match[1]),
        paragraphs: [...match[2].matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(p => p[1].replace(/\s+/g, " ").trim()) }));
    if (rows.length !== Number(first[2]) || rows.some((row, index) => row.roll !== index + 1)) return null;
    const table = [];
    for (const [index, row] of rows.entries()) {
        const text = htmlToPlainText(row.paragraphs[0] ?? "").replace(/\s+/g, " ").trim().replace(/’/g, "'");
        const match = ENTRIES[index].pattern.exec(text), link = row.paragraphs[1] ? LINK.exec(row.paragraphs[1]) : null;
        if (!match || row.paragraphs.length > 2 || (row.paragraphs[1] && !link)) return null;
        const name = text.split(" ").slice(0, ENTRIES[index].kind === "fly" ? 3 : 2).join(" ");
        const entry = { roll: row.roll, kind: ENTRIES[index].kind, name, sourceText: text };
        if (entry.kind === "social") Object.assign(entry, { bonus: Number(match[3]), note: `Until the start of its next turn, ${match[2].replace(/\byou\b/g, "it").replace(/\bunderstand\b/, "understands").replace(/\bcan hear\b/, "can hear")}` });
        if (entry.kind === "extend") entry.die = Number(match[2]);
        if (entry.kind === "fly") {
            // (The module's Effect: a fly Speed of the land Speed, for 1 round to the end of a turn — the text's.)
            const effect = link ? catalog?.get?.(link[2]) : null, rules = effect?.mechanics?.rules ?? effect?.system?.rules ?? [], duration = effect?.mechanics?.duration ?? effect?.system?.duration ?? {};
            if (!(rules.length === 1 && rules[0].key === "BaseSpeed" && rules[0].selector === "fly" && /land/.test(String(rules[0].value)) && duration.value === 1 && duration.unit === "rounds" && duration.expiry === "turn-end")) return null;
            entry.effect = { uuid: link[1], name: link[3] };
        }
        if (entry.kind === "warp") Object.assign(entry, { types: [match[2], match[3], match[4], match[5], match[6]], note: match[7] });
        table.push(entry);
    }
    return {
        table: { statistic: save.statistic, radius: Number(area.value), die: Number(first[2]), entries: table, critical: "twice-caster-picks", willing: true },
        sentences: [lead[2], lead[3], lead[4], ...table.map(entry => entry.sourceText)]
    };
}
