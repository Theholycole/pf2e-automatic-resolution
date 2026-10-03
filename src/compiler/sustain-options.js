// A sustained area that makes one of several listed effects when cast and on the first Sustain of each later round (Pernicious Poltergeist): "When
// you Cast the Spell, and the first time you Sustain it on subsequent rounds, the poltergeist creates your choice of one of the following effects."
// with a list ("<strong>Deathly Assault</strong> (void) … one creature in the area … dealing @Damage[…[void]] damage (@Check[fortitude|…|basic]
// save)." / "<strong>Frighten</strong> (emotion, fear, mental) … Creatures in the area must attempt a @Check[will|…] save, becoming {Frightened 2}
// on a failure." / "<strong>Telekinetic Storm</strong> (force) … All creatures in the area take @Damage[…[force]] damage (@Check[reflex|…|basic]
// save).") and a Heightened entry that is each damage formula's own step: each effect a save of its own text (the damage the inline formula at the
// cast rank); the card's button per effect, once a round, while the caster's sustained Effect lasts.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.([A-Za-z0-9]+)\]\{([A-Z][a-z]+)(?: (\d))?\}`;
const DAMAGE = String.raw`@Damage\[(\(\d+ \+ floor\(\(@item\.rank - \d+\)\/\d\)\)d\d+|\d+d\d+)\[([a-z]+)\]\]`;
const CHECK = String.raw`@Check\[(fortitude|reflex|will)(?:\|name:[^|\]]+)?(?:\|traits:[a-z,]+)?(\|basic)?\]`;
const WHEN = /^When you Cast the Spell, and the first time you Sustain it on subsequent rounds, the ([a-z]+) creates your choice of one of the following effects\.$/;
const OPTION_LEADS = [
    // "… focuses on one creature in the area and flies through that creature, dealing X damage (@Check save)."
    [new RegExp(String.raw`^The [a-z]+ focuses on one creature in the area and [a-z ]+, dealing ${DAMAGE} damage \(${CHECK} save\)\.$`), m => ({ target: "one", formula: m[1], type: m[2], statistic: m[3], basic: !!m[4] })],
    // "All creatures in the area take X damage (@Check save)."
    [new RegExp(String.raw`^All creatures in the area take ${DAMAGE} damage \(${CHECK} save\)\.$`), m => ({ target: "all", formula: m[1], type: m[2], statistic: m[3], basic: !!m[4] })],
    // "Creatures in the area must attempt a @Check save, becoming {Frightened 2} on a failure."
    [new RegExp(String.raw`^Creatures in the area must attempt an? ${CHECK} save, becoming ${C} on a failure\.$`), m => ({ target: "all", statistic: m[1], basic: !!m[2], failure: { id: m[3], name: m[4], value: m[5] ? Number(m[5]) : null } })]
];
// Narration a listed effect may carry: what the manifestation does or looks like (no rules).
const NARRATION = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i;
const STAT = statistic => `${statistic[0].toUpperCase()}${statistic.slice(1)}`;
const link = c => `@UUID[Compendium.pf2e.conditionitems.Item.${c.id}]{${c.name}${c.value != null ? ` ${c.value}` : ""}}`;

/** {seconds, options: [{key, label, traits, html, statistic, basic, formula, type, target, notes}], notes, claimed} or null. */
export function extractSustainOptions(adapted) {
    if (adapted.lifecycle?.sustained !== true || (adapted.damageComponents ?? []).length || adapted.defense?.kind === "save" || !adapted.targeting?.area) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightenedHTML = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const intro = /^\s*<p>([\s\S]*?)<\/p>\s*<ul>([\s\S]*)<\/ul>\s*$/.exec(body);
    if (!minutes || rest.length || !intro) return null;
    const lead = htmlToPlainText(`<p>${intro[1]}</p>`).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    const when = lead.findIndex(sentence => WHEN.test(sentence));
    if (when !== lead.length - 1) return null;
    // (The opening: narration, and the manifestation's own state — "it can't be attacked or hurt; it remains Invisible unless otherwise stated" — a note.)
    const notes = lead.slice(0, when).filter(sentence => /\bcan't be attacked or hurt\b/.test(sentence));
    if (lead.slice(0, when).some(sentence => !notes.includes(sentence) && NARRATION.test(sentence))) return null;
    const options = [];
    for (const match of intro[2].matchAll(/<li>\s*<p>\s*<strong>([^<]+)<\/strong>\s*(?:\(([a-z, ]+)\)\s*)?([\s\S]*?)<\/p>\s*<\/li>/g)) {
        const raw = match[3].replace(/\s+/g, " ").trim();
        const sentences = raw.split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
        let read = null;
        const said = [];
        for (const sentence of sentences) {
            const found = OPTION_LEADS.map(([pattern, parse]) => { const m = pattern.exec(sentence); return m ? parse(m) : null; }).find(Boolean);
            if (found) { if (read) return null; read = found; continue; }
            if (NARRATION.test(htmlToPlainText(sentence))) return null;
            said.push(htmlToPlainText(sentence));
        }
        if (!read) return null;
        const subject = read.target === "one" ? "The target" : "Each creature in the area";
        const html = read.basic
            ? `<p>${subject} takes ${read.formula.replace(/^\((.*)\)(d\d+)$/, "($1)$2")} ${read.type} damage with a basic ${STAT(read.statistic)} save.</p>`
            : read.failure ? `<p>${subject === "The target" ? "The target" : "Each creature in the area"} must attempt a ${STAT(read.statistic)} save.</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p>`
                + `<p><strong>Success</strong> The creature is unaffected.</p><p><strong>Failure</strong> The creature is ${link(read.failure)}.</p><p><strong>Critical Failure</strong> The creature is ${link(read.failure)}.</p>` : null;
        if (!html) return null;
        options.push({ key: match[1].trim().toLowerCase().replace(/[^a-z]+/g, "-"), label: match[1].trim(), traits: match[2] ? match[2].split(/,\s*/) : [], html, statistic: read.statistic, basic: read.basic,
            formula: read.formula ? `${read.formula}[${read.type}]` : null, type: read.type ?? null, target: read.target, notes: said });
    }
    if (options.length < 2 || options.length !== (intro[2].match(/<li>/g) ?? []).length) return null;
    // "Heightened (+2) The damage of the deathly assault effect increases by 1d10, and the damage of the telekinetic storm effect increases by 1d8.":
    // each named effect's own formula steps by that die every interval.
    const heightened = htmlToPlainText(heightenedHTML).replace(/\s+/g, " ").trim();
    const step = /^Heightened \(\+(\d)\) (.+)\.$/.exec(heightened);
    const damaging = options.filter(option => option.formula);
    if (damaging.length && heightened) {
        if (!step) return null;
        const parts = step[2].split(/, and /);
        if (parts.length !== damaging.length) return null;
        for (const part of parts) {
            const m = /^The damage of the ([a-z ]+) effect increases by 1(d\d+)$/.exec(part.replace(/^the /, "The "));
            const option = m && damaging.find(entry => entry.label.toLowerCase() === m[1]);
            const own = option && new RegExp(String.raw`^\(\d+ \+ floor\(\(@item\.rank - ${adapted.rank}\)\/${step[1]}\)\)${m[2]}\[`).test(option.formula);
            if (!own) return null;
        }
    } else if (heightened) return null;
    return { seconds: Number(minutes[1]) * 60, options, notes: notes.map(sentence => sentence.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")),
        claimed: [...lead, ...options.flatMap(option => option.notes), heightened].filter(Boolean) };
}
