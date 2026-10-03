// An incarnate whose manifestation is one of several listed options, each with its own Arrive and Depart (Pest Swarm): "The pest squadron occupies
// the space of a Large creature, and like a swarm, they can occupy the same space as other creatures. When you Cast this Spell, choose one of the pest
// squadrons below to summon." with a list "<strong>Cockroaches</strong> Speed 30 feet, climb 30 feet." / "<strong>Arrive</strong> <em>Scurrying
// Swarm</em> … They deal @Damage[4d6[piercing]] damage (@Check[reflex|basic] save) to all enemies within their space and in a @Template[emanation|
// distance:5]. On a critical failure, a creature can't use concentrate actions for 1 round …" / "<strong>Depart</strong> …".
// Each phase's sentences are read into a save's own text (the damage, the save, the rows the riders state); "exposed to <the listed affliction>" is a
// further phase, that affliction's own save at its stated DC; "becomes difficult terrain for 1 round" is the phase's terrain, placed by the card.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.([A-Za-z0-9]+)\]\{([A-Z][a-z]+)(?: (\d))?\}`;
const DAMAGE = String.raw`@Damage\[((?:\d+d\d+\[[a-z]+\],?)+)(?:\|[^\]]*)?\]`;
const CHECK = String.raw`@Check\[(fortitude|reflex|will)(\|basic)?(?:\|[^\]]*)?\]`;
const SPACE = /^The ([a-z ]+) occupies the space of an? (Small|Medium|Large|Huge) creature, and like a swarm, they can occupy the same space as other creatures\.$/;
const CHOOSE = /^When you Cast this Spell, choose one of the ([a-z ]+) below to summon\.$/;
const NARRATION = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i;
const WHO = String.raw`(?:[Aa]ll enemies|[Ee]ach enemy|enemies|[Aa]ll creatures|[Ee]ach creature) (?:with)?in their space(?: and (?:with)?in an? @Template\[(?:type:)?emanation\|distance:(\d+)\])?`;
// The lead sentence: damage with a basic save, or a save the creatures attempt (non-basic).
const LEADS = [
    // "They deal X damage (@Check save) to all enemies within their space and in a @Template[emanation|distance:5]."
    [new RegExp(String.raw`^[A-Z][^@.]*?\b(?:deal|dealing) ${DAMAGE} damage (?:\(${CHECK} save\) )?to ${WHO}(?: \(${CHECK} save\))?\.$`), m => ({ damage: m[1], statistic: m[2] ?? m[5], basic: !!(m[3] ?? m[6]), within: m[4] })],
    // "Each enemy within their space takes X damage (@Check save)." / "… and within a @Template[emanation|distance:5] take X damage (@Check save) as …"
    [new RegExp(String.raw`^(?:[A-Z][^@.]*?, and )?(?:Each|each) enemy (?:with)?in their space(?: and (?:with)?in an? @Template\[(?:type:)?emanation\|distance:(\d+)\])? takes? ${DAMAGE} damage \(${CHECK} save\)(?: as [a-z ,]+)?\.$`), m => ({ within: m[1], damage: m[2], statistic: m[3], basic: !!m[4] })],
    // "All creatures in the area take X damage (@Check save)." (after a cone sentence)
    [new RegExp(String.raw`^(?:All creatures in the area|Each enemy) takes? ${DAMAGE} damage \(${CHECK} save\)\.$`), m => ({ damage: m[1], statistic: m[2], basic: !!m[3] })],
    // "All enemies in their space must attempt a @Check save." / "All creatures in this cone must attempt a @Check save."
    [new RegExp(String.raw`^(?:${WHO}|All creatures in this cone) must attempt an? ${CHECK} save\.$`), m => ({ within: m[1], statistic: m[2], basic: !!m[3] })],
    // "All enemies in their space and in a @Template[…] must succeed at a @Check save or become {Drained 1} ({Drained 2} on a critical failure)."
    [new RegExp(String.raw`^${WHO} must succeed at an? ${CHECK} save or become ${C} \(${C} on a critical failure\)\.$`),
        m => ({ within: m[1], statistic: m[2], basic: !!m[3], failure: cond(m, 4), criticalFailure: cond(m, 7) })],
    // "Each enemy in their space must succeed a @Check save or be knocked {Prone} and take X damage."
    [new RegExp(String.raw`^${WHO} must succeed (?:at )?an? ${CHECK} save or be knocked ${C} and take ${DAMAGE} damage\.$`),
        m => ({ within: m[1], statistic: m[2], basic: !!m[3], failure: { ...cond(m, 4), knocked: true }, criticalFailure: { ...cond(m, 4), knocked: true }, damage: m[7], damageOn: "failure" })]
];
const cond = (m, at) => ({ id: m[at], name: m[at + 1], value: m[at + 2] ? Number(m[at + 2]) : null });
const CONE = /^[A-Z][^@.]*? in an? @Template\[(?:type:)?cone\|distance:(\d+)\](?: and [a-z ]+)?\.$/;
// "A horde of … crawls up from the ground, climbing onto enemies within their space and in a @Template[emanation|distance:5] and biting them."
const AROUND = /^[A-Z][^@.]*? enemies within their space and in an? @Template\[(?:type:)?emanation\|distance:(\d+)\](?: and [a-z ]+)?\.$/;
const RIDERS = [
    [/^On a critical failure, a creature can't use (concentrate) actions for (\d+) rounds?(?: as [a-z ]+)?\.$/, (r, m) => { r.criticalNote = `It can't use ${m[1]} actions for ${m[2]} round${m[2] === "1" ? "" : "s"}.`; }],
    [new RegExp(String.raw`^On a critical failure, a creature is ${C} for (\d+) rounds?\.$`), (r, m) => { r.criticalFailure = { ...cond(m, 1), rounds: Number(m[4]) }; }],
    [new RegExp(String.raw`^On a failure, a creature is (?:also )?${C} \((?:${C}|([a-z]+) (\d)) on a critical failure\)\.$`), (r, m) => {
        r.failure = cond(m, 1);
        r.criticalFailure = m[4] ? cond(m, 4) : (m[7].toLowerCase() === m[2].toLowerCase() ? { id: m[1], name: m[2], value: Number(m[8]) } : null);
    }],
    [/^On a failure, a creature takes a [–-](\d+)-foot (circumstance) penalty to their Speeds \([–-](\d+)-foot circumstance penalty on a critical failure\) for (\d+) minutes?; a creature can remove this penalty with a successful @UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{Escape\} against your spell DC\.$/,
        (r, m) => { r.speed = { failure: Number(m[1]), criticalFailure: Number(m[3]), type: m[2], minutes: Number(m[4]) }; }],
    [/^(?:Enemies|Creatures) who fail are exposed to (.+)\.$/, (r, m) => { r.exposure = m[1]; }],
    [/^The area (?:the [a-z ]+ was in becomes|of the cone is also) difficult terrain for (\d+) rounds?\.$/, (r, m, sentence) => { r.terrain = { rounds: Number(m[1]), sourceText: sentence }; }]
];

const rows = (cs, s, f, cf) => `<hr /><p><strong>Critical Success</strong> ${cs}</p><p><strong>Success</strong> ${s}</p><p><strong>Failure</strong> ${f}</p><p><strong>Critical Failure</strong> ${cf}</p>`;
const link = c => `@UUID[Compendium.pf2e.conditionitems.Item.${c.id}]{${c.name}${c.value != null ? ` ${c.value}` : ""}}`;
const STAT = statistic => `${statistic[0].toUpperCase()}${statistic.slice(1)}`;

/** One phase's text → {html, statistic, basic, damage: [{formula, type}], area, reminder, terrain, exposure, sentences} or null. */
function readPhase(raw) {
    const text = raw.replace(/<\/?(?:p|em|strong)>/g, "").replace(/\s+/g, " ").trim();
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    let lead = null, cone = null;
    const r = {};
    for (const sentence of sentences) {
        const coneMatch = CONE.exec(sentence);
        if (coneMatch && !/@Damage|@Check/.test(sentence)) { cone = Number(coneMatch[1]); continue; }
        const around = AROUND.exec(sentence);
        if (around && !/@Damage|@Check/.test(sentence)) { r.within = around[1]; continue; }
        const found = LEADS.map(([pattern, read]) => { const m = pattern.exec(sentence); return m ? read(m) : null; }).find(Boolean);
        if (found) { if (lead) return null; lead = found; continue; }
        const rider = RIDERS.find(([pattern]) => pattern.test(sentence));
        if (rider) { rider[1](r, rider[0].exec(sentence), sentence); continue; }
        if (NARRATION.test(htmlToPlainText(sentence))) return null;
    }
    if (!lead) return null;
    const statistic = lead.statistic;
    const damage = lead.damage ? [...lead.damage.matchAll(/(\d+d\d+)\[([a-z]+)\]/g)].map(m => ({ formula: m[1], type: m[2] })) : [];
    const dealt = damage.map(entry => `${entry.formula} ${entry.type} damage`).join(" and ");
    const failure = lead.failure ?? r.failure, critical = lead.criticalFailure ?? r.criticalFailure;
    const unaffected = "The creature is unaffected.";
    let html;
    if (lead.basic) {
        const plus = (c, rounds) => c ? ` and is ${link(c)}${rounds ? ` for ${rounds} round${rounds === 1 ? "" : "s"}` : ""}` : "";
        html = `<p>Each creature in the area takes ${dealt} with a basic ${STAT(statistic)} save.</p>`
            + rows(unaffected, "The creature takes half damage.", `The creature takes full damage${plus(r.failure)}.`,
                `The creature takes double damage${plus(critical, critical?.rounds)}.${r.criticalNote ? ` ${r.criticalNote}` : ""}`);
    } else if (r.speed) {
        html = `<p>Each creature in the area must attempt a ${STAT(statistic)} save.</p>`
            + rows(unaffected, unaffected, `The creature takes a –${r.speed.failure}-foot ${r.speed.type} penalty to its Speeds until it Escapes.`,
                `The creature takes a –${r.speed.criticalFailure}-foot ${r.speed.type} penalty to its Speeds until it Escapes.`);
    } else if (failure && critical) {
        const row = c => lead.damageOn ? `The creature takes full damage and falls ${link(c)}.` : `The creature is ${link(c)}.`;
        html = `<p>Each creature in the area must attempt a ${STAT(statistic)} save${lead.damageOn ? ` or take ${dealt}` : ""}.</p>` + rows(unaffected, unaffected, row(failure), row(critical));
    } else return null;
    const within = lead.within ?? r.within;
    const who = cone ? `the creatures in a ${cone}-foot cone` : `the enemies in its space${within ? ` and within ${within} feet` : ""}`;
    return { html, statistic, basic: lead.basic, damage, seconds: r.speed ? r.speed.minutes * 60 : null, reminder: `Target ${who}.`,
        ...(r.terrain ? { terrain: r.terrain } : {}), ...(r.exposure ? { exposure: r.exposure } : {}), sentences };
}

/** {notes, label, options: [{key, label, phases: [{key, title, traits, html, statistic, basic, damage, reminder, terrain, seconds, dc}]}], claimed} or null. */
export function extractIncarnateSquadrons(adapted) {
    if (!(adapted.activation?.traits ?? []).includes("incarnate") || !/^until the end of your next turn$/i.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    if ((adapted.damageComponents ?? []).length || adapted.defense?.kind === "save") return null;
    const [body, blockHTML = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const intro = /^\s*<p>([\s\S]*?)<\/p>\s*<ul>([\s\S]*)<\/ul>\s*$/.exec(body);
    if (!intro) return null;
    const sentences = htmlToPlainText(`<p>${intro[1]}</p>`).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    const space = sentences.find(sentence => SPACE.test(sentence)), choose = sentences.find(sentence => CHOOSE.test(sentence));
    if (!space || !choose || sentences.some(sentence => sentence !== space && sentence !== choose && NARRATION.test(sentence))) return null;
    // The affliction a phase exposes creatures to: the block after the list (its name, its save and DC).
    const block = /^\s*<p><strong>([^<]+)<\/strong>\s*\(([a-z]+)\)<\/p>\s*<p><strong>Saving Throw<\/strong>\s*@Check\[(fortitude|reflex|will)\|dc:(\d+)(?:\|[^\]]*)?\]<\/p>/.exec(blockHTML);
    // The options: "<li><p><strong>Name</strong> Speed …</p><ul><li>Arrive …</li><li>Depart …</li></ul></li>".
    const options = [];
    for (const match of intro[2].matchAll(/<li>\s*<p>\s*<strong>([A-Z][a-z]+)<\/strong>\s*(Speed [^<]+?)[.;]?<\/p>\s*<ul>([\s\S]*?)<\/ul>\s*<\/li>/g)) {
        const phases = [];
        for (const li of match[3].matchAll(/<li>\s*(?:<p>)?\s*<strong>(Arrive|Depart)<\/strong>\s*(?:\(([a-z, ]+)\)\s*)?<em>([^<]+)<\/em>\s*([\s\S]*?)(?:<\/p>)?\s*<\/li>/g)) {
            const read = readPhase(li[4]);
            if (!read) return null;
            const key = li[1].toLowerCase();
            phases.push({ key, title: li[3].trim(), traits: li[2] ? li[2].split(/,\s*/) : [], ...read });
            if (read.exposure) {
                if (!block || read.exposure.toLowerCase() !== block[1].toLowerCase()) return null;
                const stat = STAT(block[3]);
                phases.push({ key: `${key}-exposure`, title: block[1], traits: [block[2]], statistic: block[3], basic: false, damage: [], dc: Number(block[4]),
                    reminder: `Target the creatures that failed the ${li[3].trim()} save.`,
                    html: `<p>The target must attempt a ${stat} save against ${block[1].toLowerCase()}.</p>`
                        + rows("The target is unaffected.", "The target is unaffected.", `The target is afflicted with ${block[1].toLowerCase()} at stage 1.`, `The target is afflicted with ${block[1].toLowerCase()} at stage 2.`)
                        + `<hr />${blockHTML}` });
            }
        }
        if (phases.filter(phase => !phase.dc).map(phase => phase.key).join() !== "arrive,depart") return null;
        options.push({ key: match[1].toLowerCase(), label: `${match[1]} (${match[2].trim()})`, phases });
    }
    if (options.length < 2 || options.length !== (intro[2].match(/<li>\s*<p>\s*<strong>[^<]+<\/strong>\s*Speed\b/g) ?? []).length) return null;
    if (options.some(option => option.phases.some(phase => phase.dc)) !== !!block && blockHTML.trim()) return null;
    return { notes: [space.replace(/^The ([a-z ]+) occupies/, "The $1 occupies")], label: CHOOSE.exec(choose)[1], options };
}
