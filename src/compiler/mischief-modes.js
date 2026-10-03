// A sustained area whose mischief the caster picks when casting, produced on the cast and the first Sustain each round (Mad Monkeys):
//   "Choose the kind of mischief your monkeys make when you Cast the Spell. They produce the effect listed for that mischief when you Cast the
//   Spell and the first time each round when you Sustain the Spell. The first time each round when you Sustain the Spell, you can move the area of
//   the monkeys by 5 feet." with modes:
//   "Flagrant Burglary The monkeys try to Steal any one item from one creature in the area. Use your spell DC - 10 as the monkeys' Thievery
//   modifier. …" — the module's Thievery roll (spell DC − 10) against the creature's Perception DC; the item and getting it back are notes.
//   "Raucous Din … Each creature in the spell's area must attempt a Fortitude save." with rows (immune 10 minutes / unaffected / Deafened for
//   1 round / Deafened for 1 minute) — the module rolls each targeted creature's save and applies its row.
//   "Tumultuous Gymnastics … must attempt a Reflex save." with rows (… / For 1 round, a DC 5 flat check on each manipulate action / as failure,
//   lasting until the spell ends) — the flat check is a note Effect for the row's time (to the spell's end on a critical failure).
// The caster's Effect (sustained) carries the cast; its end ends the clinging notes. Calm, the area's move and the stolen items are notes.
import { htmlToPlainText } from "./description-parser.js";

const plain = html => htmlToPlainText(html).replace(/\s+/g, " ").trim();
const split = text => text.split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
const CHOOSE = /^Choose the kind of mischief your ([a-z]+) make when you Cast the Spell\.$/;
const PRODUCE = /^They produce the effect listed for that mischief when you Cast the Spell and the first time each round when you Sustain the Spell\.$/;
const MOVE = /^The first time each round when you Sustain the Spell, you can move the area of the [a-z]+ by (\d+) feet\.$/;
const STEAL = /^The [a-z]+ try to (?:@UUID\[[^\]]+\]\{Steal\}|Steal) any one item from one creature in the area\.$/;
const THIEVERY = /^Use your spell DC - (\d+) as the [a-z]+' Thievery modifier\.$/;
const SAVE = /^Each creature in the spell's area must attempt an? (Fortitude|Reflex|Will) save\.$/;
const IMMUNE = /^The creature is unaffected and is temporarily immune for (\d+) minutes\.$/;
const UNAFFECTED = /^The creature is unaffected\.$/;
const TIMED = /^The creature is (?:@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+)\}|([A-Z][a-z]+)) for 1 (round|minute)\.$/;
const FLAT = /^For 1 round, the creature must succeed at a @Check\[flat\|dc:(\d+)\] whenever it attempts a manipulate action\. If it fails this check, the creature loses that action\.$/;
const CLING = /^As failure, but the [a-z]+ cling to the creature tenaciously, and the effect lasts until the spell ends, even if the creature leaves the spell's area\.$/;
const ROW = /<p>\s*<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>\s*([\s\S]*?)<\/p>/g;
const DEGREES = { "Critical Success": "criticalSuccess", Success: "success", Failure: "failure", "Critical Failure": "criticalFailure" };

function rowsOf(html) {
    const rows = Object.fromEntries([...html.matchAll(ROW)].map(match => [DEGREES[match[1]], match[2].replace(/\s+/g, " ").trim()]));
    return Object.keys(rows).length === 4 ? rows : null;
}

/** Returns {mischief, claimed} or null. */
export function compileMischiefModes(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || adapted.lifecycle?.sustained !== true || !adapted.targeting?.area) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!minutes) return null;
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim()).filter(Boolean);
    const lead = split(plain(sections[0] ?? ""));
    const at = lead.findIndex(sentence => CHOOSE.test(sentence));
    if (at < 0 || lead.length !== at + 3 || !PRODUCE.test(lead[at + 1]) || !MOVE.test(lead[at + 2])) return null;
    // (The narration before: what the monkeys are, that they can't be hurt, and Calm making them docile.)
    const narration = lead.slice(0, at);
    if (narration.length > 3 || narration.some(sentence => /\d|\b(?:damage|saves?|bonus|penalty|conditions?)\b/i.test(unlink(sentence)))) return null;
    const modes = [];
    const claimed = [...lead];
    for (let index = 1; index < sections.length; index++) {
        const head = /^<p>\s*<strong>\s*([A-Z][a-z]+ [A-Z][a-z]+)\s*<\/strong>\s*([\s\S]*?)<\/p>$/.exec(sections[index]);
        if (!head) return null;
        const sentences = split(plain(head[2]));
        claimed.push(...sentences);
        if (STEAL.test(sentences[0])) {
            const thievery = THIEVERY.exec(sentences[1] ?? "");
            if (!thievery || sentences.length > 5 || sentences.slice(2).some(sentence => /\b(?:damage|saves?|bonus|penalty|conditions?)\b/i.test(sentence) && !/Disarming|Stealing/.test(sentence))) return null;
            modes.push({ key: slugOf(head[1]), label: head[1], kind: "steal", minus: Number(thievery[1]), notes: sentences.slice(2).map(unlink) });
            continue;
        }
        const save = SAVE.exec(sentences.at(-1) ?? "");
        const rows = rowsOf(sections[index + 1] ?? "");
        if (!save || sentences.length > 2 || !rows) return null;
        index++;
        const immune = IMMUNE.exec(rows.criticalSuccess);
        if (!immune || !UNAFFECTED.test(rows.success)) return null;
        const outcome = text => {
            const timed = TIMED.exec(text);
            if (timed) return { condition: (timed[2] ?? timed[3]).toLowerCase(), uuid: timed[1] ?? null, unit: timed[4] === "round" ? "rounds" : "minutes", value: 1 };
            const flat = FLAT.exec(text);
            if (flat) return { note: `A DC ${flat[1]} flat check whenever it attempts a manipulate action; on a failure it loses that action.`, unit: "rounds", value: 1 };
            return null;
        };
        const failure = outcome(rows.failure);
        const critical = CLING.test(rows.criticalFailure) && failure?.note ? { ...failure, untilSpellEnds: true } : outcome(rows.criticalFailure);
        if (!failure || !critical || (critical.condition && critical.condition !== failure.condition)) return null;
        const uuid = failure.uuid ?? critical.uuid ?? null;
        if (failure.condition && !uuid) return null;
        claimed.push(...Object.values(rows).map(row => plain(row)));
        modes.push({ key: slugOf(head[1]), label: head[1], kind: "save", statistic: save[1].toLowerCase(), immunityMinutes: Number(immune[1]),
            failure: { ...failure, uuid: failure.condition ? uuid : null }, criticalFailure: { ...critical, uuid: critical.condition ? uuid : null }, intro: unlink(sentences[0]) });
    }
    if (modes.length < 2 || modes.filter(mode => mode.kind === "steal").length > 1) return null;
    return { mischief: { seconds: Number(minutes[1]) * 60, moveFeet: Number(MOVE.exec(lead[at + 2])[1]), modes, notes: [...narration.map(unlink), unlink(lead[at + 2])] }, claimed };
}
const slugOf = text => text.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
const unlink = text => text.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1");
