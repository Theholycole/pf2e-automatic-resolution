// Incarnate spells: a manifestation that Arrives when cast and Departs at the end of the caster's next turn, each with its own effect
// (Incarnate Faerie Revelers, Incarnate Skeletal Giant, …):
//   "<strong>Arrive</strong> (mental) <em>Mischief</em> The infectious nature of the faerie revel causes chaos. Each creature adjacent to the
//   revel must attempt a Will save." with its degree rows; "<strong>Depart</strong> … Up to 2 different targets within 30 feet of the giant
//   take @Damage[6d6[bludgeoning]] damage (basic Reflex save)."
// Each phase is compiled as its own save (its text, its save; the item's damage only where the phase states it); the cast posts a card with a
// button per phase (the GM targets the creatures it reaches). The manifestation's space and Speed are a note (the GM places and moves it).
import { htmlToPlainText } from "./description-parser.js";

const ROW = /^<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i;
// (A third-party title in bold — Wizards+'s Summon Jury: "<strong>Arrive</strong> (emotion, mental) <strong>Call to Order</strong> …" — reads the same.)
const PHASE = /^<strong>\s*(Arrive|Depart)\s*<\/strong>\s*(?:\(([a-z, ]+)\)\s*)?(?:<em>([^<]+)<\/em>|<strong>([^<]+)<\/strong>)\s*([\s\S]+)$/i;
// "Heightened (5th) The status penalties increase to 2.": a heightening of the phases' penalties (no damage), kept with each phase for its rows.
const PENALTY_HEIGHTENED = /^\s*(?:<p>\s*<strong>\s*Heightened \((?:\d+)(?:st|nd|rd|th)\)\s*<\/strong>\s*The status penalties increase to \d+\.\s*<\/p>\s*)+$/;
// (Or no Speed stated: Summon Jury's "The jury occupies the space of a Huge creature.")
const SPACE = /^(?:The [a-z' ]+|It) occup(?:y|ies) the space of an? (Small|Medium|Large|Huge|Gargantuan) creature(?:,? (?:and (?:has|have) an? (?:(?:fly|swim|burrow|climb) )?(?:Speed|speed) of (\d+) feet(?: and [^.]+)?|but (?:has|have) no Speed))?\.$|^Your [a-z]+ occupies the space of a creature of your size and has Speeds equal to yours(?: \([^)]*\))?\.$/;
// (An opening sentence that is only narration: no number, link or rule word — "until" and "each" are common in openings.)
const OPENING_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must)\b/i;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i;

const BASIC_DAMAGE = /^(.*?\b(?:take|takes|dealing|deal|deals)\s+)((?:@Damage\[[^\]]*\](?:\])?|\d+d\d+ [a-z]+) damage(?: and \d+d\d+ [a-z]+ damage)?)(.*?)\s*\((?:with a )?basic (Fortitude|Reflex|Will) save\)(.*)$/;
const CRIT_RIDERS = [
    [/^On a critical failure, a creature (?:also )?takes? (?:an additional )?(@Damage\[[^\]]*persistent[^\]]*\](?:\])?) damage\.$/, (m, rows) => { rows.criticalFailure.push(`${m[1]} damage`); }],
    [/^On a critical failure, a creature is also (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Z][a-z]+(?: \d)?\}) for (\d+) (rounds?|minutes?)\.$/, (m, rows) => { rows.criticalFailure.push(`is ${m[1]} for ${m[2]} ${m[3]}`); }],
    [/^On a failed save, (?:a creature|it|the creature) is also (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Z][a-z]+(?: \d)?\}) for (\d+) (rounds?|minutes?)\.$/, (m, rows) => { rows.failure.push(`is ${m[1]} for ${m[2]} ${m[3]}`); rows.criticalFailure.push(`is ${m[1]} for ${m[2]} ${m[3]}`); }]
];
/** A basic-save phase lead with riders, as a table: {lead, rows} or null. */
// "The stampede ignores and attempts to counteract all difficult terrain it enters caused by debris, overgrowth, rubble, or thick ground cover." (Summon Stampede's
// Depart): the GM's, a reminder beside the save.
const TERRAIN_NOTE = /^The [a-z]+ ignores and attempts to counteract all difficult terrain it enters caused by [^.]+\.$/;
function riderTable(lead) {
    const sentences = lead.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = sentences.findIndex(sentence => BASIC_DAMAGE.test(sentence));
    if (at < 0 || at === sentences.length - 1) return null;
    const rows = { failure: [], criticalFailure: [] }, notes = [];
    for (const sentence of sentences.slice(at + 1)) {
        if (TERRAIN_NOTE.test(htmlToPlainText(sentence))) { notes.push(htmlToPlainText(sentence)); continue; }
        const rider = CRIT_RIDERS.find(([pattern]) => pattern.test(sentence));
        if (!rider) return null;
        rider[1](rider[0].exec(sentence), rows);
    }
    const m = BASIC_DAMAGE.exec(sentences[at]);
    const rest = m[5].trim();
    // (Who it reaches — "Enemies within a 20-foot emanation", "to enemies in a 20-foot burst … within 30 feet" — is the GM's targeting, a reminder.)
    const who = htmlToPlainText(`${m[1]}${m[3]} ${rest}`).replace(/\b(?:take|takes|dealing|deal|deals)\b/g, "").replace(/\s+/g, " ").replace(/^[\s,.]+|[\s,.]+$/g, "");
    const leadText = [...sentences.slice(0, at), `Each target takes ${m[2]} and must attempt a ${m[4]} save.`].join(" ");
    const join = list => list.length ? ` and ${list.join(" and ")}` : "";
    return { lead: leadText, reminder: `Target the creatures it reaches: ${who}.${notes.length ? ` ${notes.join(" ")}` : ""}`, rows: [`<strong>Critical Success</strong> The creature is unaffected.`, `<strong>Success</strong> The creature takes half damage.`,
        `<strong>Failure</strong> The creature takes full damage${join(rows.failure)}.`, `<strong>Critical Failure</strong> The creature takes double damage${join(rows.criticalFailure)}.`] };
}

/** {intro, notes, phases: [{key, title, traits, html, statistic, basic, damage}]} or null. */
export function extractIncarnate(adapted) {
    // (INCARNATE_DEBUG=1: which check refused it.)
    const fail = at => { if (globalThis.process?.env?.INCARNATE_DEBUG) console.error("incarnate refused at", at); return null; };
    if (!(adapted.activation?.traits ?? []).includes("incarnate")) return fail(1);
    if (!/^until the end of your next turn$/i.test(String(adapted.lifecycle?.duration ?? "").trim())) return fail(2);
    // (The rows may follow an <hr />; only a Heightened paragraph after one is set apart.)
    const html = String(adapted.descriptionHTML ?? "");
    const cut = html.search(/<hr\s*\/?>\s*<p>\s*<strong>\s*Heightened\b/i);
    const body = (cut >= 0 ? html.slice(0, cut) : html).replace(/<hr\s*\/?>/gi, "");
    const rest = cut >= 0 ? [html.slice(cut).replace(/^<hr\s*\/?>/i, "")] : [];
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].trim());
    const phases = [], intro = [];
    for (const paragraph of paragraphs) {
        const phase = PHASE.exec(paragraph);
        if (phase) { phases.push({ key: phase[1].toLowerCase(), traits: phase[2] ? phase[2].split(/,\s*/) : [], title: (phase[3] ?? phase[4]).trim(), lead: phase[5].trim(), rows: [] }); continue; }
        if (ROW.test(paragraph) && phases.length) { phases.at(-1).rows.push(paragraph); continue; }
        if (phases.length) return fail(3);
        intro.push(paragraph);
    }
    if (phases.map(phase => phase.key).join() !== "arrive,depart") return fail(4);
    // The opening: narration, and the manifestation's space and Speed.
    const sentences = htmlToPlainText(intro.map(paragraph => `<p>${paragraph}</p>`).join("")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    const space = sentences.find(sentence => SPACE.test(sentence));
    // (The Speed in its own sentence: "It has a Speed of 200 feet.")
    const speed = sentences.find(sentence => /^It has an? (?:(?:fly|swim|burrow|climb) )?Speed of \d+ feet\.$/.test(sentence));
    if (!space || sentences.some(sentence => sentence !== space && sentence !== speed && OPENING_RULES.test(sentence))) return fail(5);
    const heightened = rest[0] ?? "";
    const penaltyHeightened = heightened && PENALTY_HEIGHTENED.test(heightened);
    for (const phase of phases) {
        // (A basic save with a rider for some results — "On a critical failure, a creature also take(s) @Damage[2d8[persistent,bleed]] damage." / "… is also
        // {Frightened 1} for 1 round." / "On a failed save, … also …" — becomes the save's table: the damage halved, full and doubled by the rows, the rider on its rows.)
        // ("All your enemies within …" is "Each enemy within …"; "Fleeing for 1 round or until it's no longer frightened, whichever comes first" is its
        // round — the Frightened 3 beside it outlasts that round: Incarnate Tempest of Shades.)
        phase.lead = phase.lead.replace(/(^|\. )All your enemies within /, "$1Each enemy creature within ")
            // ("must attempt a will save": the save's name.)
            .replace(/\bmust attempt an? (fortitude|reflex|will) save\b/, (all, statistic) => `must attempt a ${statistic[0].toUpperCase()}${statistic.slice(1)} save`)
            // ("must attempt @Check[will|…|traits:…] saves": a Will save — the phase's traits are its heading's.)
            .replace(/\bmust attempt @Check\[(fortitude|reflex|will)(?:\|(?!basic)[^\]|]*)*\] saves\b/i, (all, statistic) => `must attempt a ${statistic[0].toUpperCase()}${statistic.slice(1).toLowerCase()} save`);
        phase.rows = phase.rows.map(row => row.replace(/ for 1 round or until it's no longer frightened, whichever comes first\./, " for 1 round."));
        if (!phase.rows.length) {
            const table = riderTable(phase.lead);
            if (table) { phase.lead = table.lead; phase.rows = table.rows; phase.reminder = table.reminder; }
        }
        const text = htmlToPlainText(`<p>${phase.lead}</p>`);
        // (Or PF2e's inline check: "must attempt a @Check[reflex|…] saving throw", "with a @Check[fortitude|basic|…] save".)
        const inline = /@Check\[(fortitude|reflex|will)((?:\|[^\]]*)?)\]/i.exec(text);
        const inlineBasic = inline && /\|basic\b/.test(inline[2]);
        // (Or "must attempt @Check[will|…] saves": Incarnate Tempest of Shades' Depart, for every enemy at once.)
        const nonBasic = /\bmust attempt an? (Fortitude|Reflex|Will) sav(?:e|ing throw)\b/.exec(text) ?? (inline && !inlineBasic && /\bmust (?:attempt|succeed at) (?:an? )?@Check\[[^\]]+\] sav(?:e|es|ing throws?)\b/.test(text) ? [null, inline[1]] : null);
        const basic = /\((?:with a )?basic (Fortitude|Reflex|Will) save\)|\bwith a basic (Fortitude|Reflex|Will) save\b/.exec(text) ?? (inlineBasic ? [null, inline[1]] : null);
        // A phase with no save and no rows is the GM's (Incarnate Shadow Minuet's darkness globe: the GM's lighting): a note.
        if (!nonBasic && !basic && !phase.rows.length && !/@Damage\[|\b\d+d\d+\b|@UUID\[Compendium\.pf2e\.conditionitems/.test(phase.lead)) { phase.note = text.replace(/@Template\[[^\]]*\]/g, "area").replace(/\s+/g, " ").trim(); continue; }
        if (!!nonBasic === !!basic || (nonBasic && !phase.rows.length) || (basic && phase.rows.length)) return fail(6);
        phase.statistic = (nonBasic?.[1] ?? basic[1] ?? basic[2]).toLowerCase();
        phase.basic = !!basic;
        phase.damage = /@Damage\[|\b\d+d\d+ [a-z]+ damage\b/.test(`${phase.lead} ${phase.rows.join(" ")}`);
        // Damage written in the rows (Incarnate Shadow Minuet's @Damage[4d6[spirit]] on a failure and 8d6 on a critical failure): when each is
        // once or twice the item's one entry of that type, the rows take "full" and "double" damage of the item's shared roll (its own heightening:
        // "The spirit damage increases by 2d6 on a failure and 4d6 on a critical failure." is that entry's 2d6 step).
        const components = adapted.damageComponents ?? [];
        if (phase.damage && !/@Damage\[|\b\d+d\d+ [a-z]+ damage\b/.test(phase.lead)) {
            const own = components.length === 1 && !components[0].category ? /^(\d+)d(\d+)$/.exec(String(components[0].formula).replace(/\s+/g, "")) : null;
            if (!own) return fail(7);
            const type = String(components[0].type).toLowerCase();
            let ok = true;
            phase.rows = phase.rows.map(row => row.replace(/@Damage\[(\d+)d(\d+)\[([a-z]+)\](?:\|[^\]]*)?\] damage/g, (all, count, faces, kind) => {
                const times = Number(count) / Number(own[1]);
                if (kind !== type || faces !== own[2] || ![1, 2].includes(times)) { ok = false; return all; }
                return times === 2 ? "double damage" : "full damage";
            }));
            const stepText = /The ([a-z]+) damage increases by (\d+)d(\d+) on a failure and (\d+)d(\d+) on a critical failure\./.exec(htmlToPlainText(heightened));
            const itemStep = String(Object.values(adapted.heightening?.damage ?? {})[0] ?? "");
            if (!ok || (heightened && !(stepText && stepText[1] === type && `${stepText[2]}d${stepText[3]}` === itemStep && Number(stepText[4]) === 2 * Number(stepText[2])))) return fail(8);
            phase.heightened = heightened ? heightened.replace(stepText[0], `The damage increases by ${itemStep}.`) : "";
        }
        // (A row's flavor about the creature's shadow — Incarnate Shadow Minuet — states no rule.)
        phase.rows = phase.rows.map(row => row.replace(/\s*The creature's shadow [a-z ,']+\.(?=\s|$)/g, ""));
        let lead = phase.lead;
        // "Up to 2 different targets within 30 feet of the giant take @Damage[6d6[bludgeoning]] damage (basic Reflex save).": the targets, and the
        // item's damage as the basic save's.
        const upTo = phase.basic ? /(?:^|\.\s+)Up to (\d) different targets within (\d+) feet of the [a-z ]+ take @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage \(basic (Fortitude|Reflex|Will) save\)\.$/.exec(htmlToPlainText(`<p>${lead}</p>`).replace(/\s+/g, " ").trim()) : null;
        if (upTo) {
            const components = adapted.damageComponents ?? [];
            if (!(components.length === 1 && String(components[0].formula).replace(/\s+/g, "") === upTo[3] && String(components[0].type).toLowerCase() === upTo[4])) return fail(9);
            phase.target = `up to ${upTo[1]} creatures`;
            phase.reminder = `Target up to ${upTo[1]} different creatures within ${upTo[2]} feet of the manifestation.`;
            lead = `Each target takes ${upTo[3]} ${upTo[4]} damage (basic ${upTo[5]} save).`;
        }
        phase.html = `<p>${lead}</p>${phase.rows.map(row => `<p>${row}</p>`).join("")}${(phase.damage || penaltyHeightened) && heightened ? `<hr />${phase.heightened ?? heightened}` : ""}`;
    }
    // A Heightened entry belongs to the phase with damage (the item's own heightening).
    if (heightened && !penaltyHeightened && phases.filter(phase => phase.damage).length !== 1) return fail(10);
    if (penaltyHeightened && phases.some(phase => phase.damage)) return fail(11);
    return { notes: [space], phases: phases.map(({ lead, rows, ...phase }) => phase) };
}
