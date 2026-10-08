// Rolled color tables (feature group 9), as cards whose parts resolve a color on its creature:
//   - Prismatic Spray: "Each creature in the area must roll 1d8 on the table below to see which beam affects it, then attempt a saving throw of the indicated
//     type. … For all rays, a successful saving throw negates the effect for that creature." with the table (Red 50 fire, Orange 60 acid, Yellow 70
//     electricity — Reflex; Green 30 poison and Enfeebled 1 for 1 minute — Fortitude; Blue as Petrify; Indigo Confused as Warp Mind; Violet Slowed for 1
//     minute or, on a critical failure, another plane; 8 two beams) — the card's beams part rolls each targeted creature's color (twice on an 8) and runs it;
//   - Rainbow Fumarole: "roll 1d8 on the table below to determine the effects of the fumarole." with the colors' damage and added effects (or "All": the
//     caster's pick per creature) — the area's own basic save as creatures are caught in it, move through it or end their turn there, difficult terrain;
//   - Prismatic Wall: the light's Will save (Dazzled, Blinded for 1 round or 1 minute, then immune for 1 hour) and the seven layers, each a color of
//     Chromatic Wall (5th rank for red to green, 7th for the others), run in order for a creature passing through.
import { htmlToPlainText } from "./description-parser.js";

const plain = html => htmlToPlainText(html).replace(/\s+/g, " ").trim();
const split = text => text.split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
const Stat = name => name[0].toUpperCase() + name.slice(1);
const rows = list => `<hr />` + ["Critical Success", "Success", "Failure", "Critical Failure"].map((label, index) => `<p><strong>${label}</strong> ${list[index]}</p>`).join("");
const SPELL = String.raw`@UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\}`;
const COND = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+)(?: (\d))?\}`;
const tableRows = html => [...String(html).matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(match => [...match[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map(cell => plain(cell[1]))).filter(cells => cells.length);
// "Negates the effect": a save that hits only on a failure (the same on a critical failure, nothing more stated).
const negatedSave = (statistic, failure, damage) => ({ type: "save", statistic, basic: false, ...(damage ? { damage } : {}),
    html: `<p>The target must attempt a ${Stat(statistic)} save.</p>` + rows(["The target is unaffected.", "The target is unaffected.", failure, failure]) });

/** {parts, notes, claimed, cast?} or null. */
export function extractPrismaticCard(adapted, referencedSpells = null) {
    for (const reader of [prismaticSpray, rainbowFumarole, prismaticWall]) { const found = reader(adapted, referencedSpells); if (found) return found; }
    return null;
}

function prismaticSpray(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || adapted.targeting?.area?.type !== "cone") return null;
    const html = String(adapted.descriptionHTML ?? "");
    const lead = /^<p>([\s\S]*?)<\/p>/.exec(html.trim());
    const table = /<table[^>]*>([\s\S]*?)<\/table>/.exec(html);
    if (!lead || !table) return null;
    const sentences = split(plain(lead[1]));
    const STATED = [/^Each creature in the area must roll 1d(\d) on the table below to see which beam affects it, then attempt a saving throw of the indicated type\.$/,
        /^The table notes any additional traits that apply to each type of ray\.$/, /^If a creature is struck by multiple beams, it uses the same d20 result for all its saving throws\.$/,
        /^For all rays, a successful saving throw negates the effect for that creature\.$/];
    const found = STATED.map(pattern => sentences.map(sentence => pattern.exec(sentence)).find(Boolean));
    if (!found.every(Boolean)) return null;
    const die = Number(found[0][1]);
    const cells = tableRows(table[1]);
    if (cells.length !== die) return null;
    const parts = [], table_ = {}, notes = [], claimed = [...found.map(match => match[0])];
    let twice = null;
    for (const [roll, color, saveName, effect] of cells) {
        const key = color.toLowerCase().replace(/[^a-z]+/g, "-");
        const statistic = saveName.toLowerCase();
        let m;
        if ((m = /^@Damage\[(\d+)\[([a-z]+)\]\] damage \(([a-z]+)\)$/.exec(effect))) {
            parts.push({ key, title: `${color} beam`, spec: negatedSave(statistic, "The target takes full damage.", { formula: m[1], type: m[2] }) });
        } else if ((m = new RegExp(String.raw`^@Damage\[(\d+)\[([a-z]+)\]\] damage and ${COND} for (\d+) minutes? \(([a-z]+)\)$`).exec(effect))) {
            parts.push({ key, title: `${color} beam`, spec: negatedSave(statistic, `The target takes full damage and is @UUID[${m[3]}]{${m[4]} ${m[5]}} for ${m[6]} minute.`, { formula: m[1], type: m[2] }) });
        } else if ((m = new RegExp(String.raw`^Affected as if by ${SPELL}$`).exec(effect))) {
            parts.push({ key, title: `${color} beam: ${m[2]}`, cast: { uuid: m[1], name: m[2] } });
        } else if ((m = new RegExp(String.raw`^${COND}, as the ${SPELL} spell \(([a-z]+)\)$`).exec(effect))) {
            parts.push({ key, title: `${color} beam: ${m[5]}`, cast: { uuid: m[4], name: m[5] } });
        } else if ((m = new RegExp(String.raw`^${COND} for (\d+) minutes?; if a critical failure, sent to another plane, as ${SPELL} \(([a-z]+)\)$`).exec(effect))) {
            parts.push({ key, title: `${color} beam`, spec: negatedSave(statistic, `The target is @UUID[${m[1]}]{${m[2]} ${m[3] ?? 1}} for ${m[4]} minute.`) });
            notes.push(`${color}: a critical failure also sends the creature to another plane (as ${m[6]}): remove it from the map.`);
        } else if (/^Affected by two beams - roll twice, rerolling any duplicates or results of \d$/.test(effect)) { twice = Number(roll); claimed.push(effect); continue; }
        else return null;
        table_[roll] = key;
        claimed.push(`${roll} ${color} ${saveName} ${effect}`);
    }
    if (!twice) return null;
    return {
        beams: { key: "beams", title: "The beams", die, table: table_, twice, reminder: `Target the creatures in the cone: each rolls 1d${die} for its beam (two beams on a ${twice}), then that beam's save.` },
        parts, notes: ["A creature struck by two beams uses the same d20 result for both saves (the GM keeps the first roll).", ...notes], claimed, rank: Number(adapted.rank)
    };
}

function rainbowFumarole(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.basic !== true || area?.type !== "cylinder") return null;
    const html = String(adapted.descriptionHTML ?? "");
    const table = /<table[^>]*>([\s\S]*?)<\/table>/.exec(html);
    const head = /^<p><strong>Area<\/strong> (\d+)-foot radius, (\d+)-foot-tall cylinder<\/p>\s*<hr\s*\/?>/.exec(html.trim());
    if (!table || !head) return null;
    const text = plain(html.slice(head[0].length, table.index));
    const STATED = [/When you cast the spell, roll 1d(\d) on the table below to determine the effects of the fumarole\./,
        /Any creature caught inside the area of [a-z ]+ when you cast it takes the indicated damage with a basic (Reflex|Fortitude) save and, on a failure, takes any added effect listed\./,
        /Creatures must also attempt a saving throw when they move through the spell's area or end their turn in it\./, /Squares within the area of the [a-z ]+ are difficult terrain\./];
    const found = STATED.map(pattern => pattern.exec(text.replace(/ \./g, ".")));
    if (!found.every(Boolean)) return null;
    const cells = tableRows(table[1]);
    const die = Number(found[0][1]);
    if (cells.length !== die) return null;
    const colors = {};
    let all = null;
    for (const [roll, color, damage, added] of cells) {
        if (/^Choose the color for each affected creature and use that color's damage and added effect; if a creature is affected again, you can choose a different color\.$/.test(damage)) { all = Number(roll); continue; }
        const pools = [...damage.matchAll(/(\d+d\d+|\d+)\[((?:persistent,)?[a-z]+)\]/g)].map(match => `${match[1]}[${match[2]}]`);
        if (!pools.length) return null;
        let effect = null, m;
        if (added === "—") effect = null;
        else if ((m = /^Knocked @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Prone\}$/.exec(added))) effect = { conditions: [{ uuid: m[1], slug: "prone" }] };
        else if ((m = /^Pushed (\d+) feet$/.exec(added))) effect = { push: Number(m[1]) };
        else if ((m = new RegExp(String.raw`^${COND}$`).exec(added))) effect = { conditions: [{ uuid: m[1], slug: m[2].toLowerCase(), value: Number(m[3]) || null }] };
        else if ((m = new RegExp(String.raw`^${COND} for (\d+) (round|minute)s?$`).exec(added))) effect = { conditions: [{ uuid: m[1], slug: m[2].toLowerCase(), value: Number(m[3]) || null }], rounds: Number(m[4]) * (m[5] === "minute" ? 10 : 1) };
        else return null;
        colors[roll] = { name: color, formula: pools.length > 1 ? `{${pools.join(",")}}` : pools[0], ...(effect ? { effect } : {}) };
    }
    if (!all || Object.keys(colors).length !== die - 1) return null;
    const statistic = found[1][1].toLowerCase();
    return {
        fumarole: { key: "fumarole", title: "The fumarole", die, all, colors, statistic, area: { type: "cylinder", value: Number(head[1]) }, seconds: 60, terrain: 2,
            reminder: `Place the ${head[1]}-foot cylinder: the module rolls its color, and each creature caught in it, moving through it or ending its turn there attempts the basic ${Stat(statistic)} save.` },
        notes: [`On a ${all} (All), the caster picks each creature's color each time it's affected.`, "Added effects are incapacitation effects (the GM adjusts for creatures of a much higher level).", "A push (10 feet) is away from the fumarole's centre: the module moves the token."],
        claimed: [...found.map(match => match[0]), ...cells.map(cells_ => cells_.join(" "))]
    };
}

function prismaticWall(adapted, referencedSpells) {
    if ((adapted.defense?.kind ?? "none") !== "none" || adapted.targeting?.area?.type !== "line") return null;
    const html = String(adapted.descriptionHTML ?? "");
    const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(match => plain(match[1]));
    if (paragraphs.length !== 3) return null;
    const light = new RegExp(String.raw`Creatures other than you that come into the wall's light must attempt a @Check\[(will|fortitude|reflex)\|against:spell\] save; they're ${COND} for (\d+) rounds? on a success, ${COND} for (\d+) rounds? on a failure, and Blinded for (\d+) minutes? on a critical failure\. They are then temporarily immune to the blinding effect for (\d+) hours?\.`).exec(paragraphs[0]);
    const layers = new RegExp(String.raw`^A prismatic wall has seven different layers, each a different color\. Red, orange, yellow, and green have the effect of a (\d)(?:st|nd|rd|th)-rank ${SPELL} spell of that color, and the others have the effect of a (\d)(?:st|nd|rd|th)-rank [a-z ]+ spell of that color\. A creature that tries to pass through the wall must attempt a saving throw against each component wall\.`).exec(paragraphs[1]);
    if (!light || !layers) return null;
    const referenced = referencedSpells?.get?.(layers[2]);
    if (!referenced) return null;
    return {
        wall: { low: Number(layers[1]), high: Number(layers[4]), chromatic: { uuid: layers[2], name: layers[3] }, source: referenced,
            light: { statistic: light[1].toLowerCase(), success: { uuid: light[2], name: light[3], rounds: Number(light[5]) }, failure: { uuid: light[6], name: light[7], rounds: Number(light[9]) }, criticalMinutes: Number(light[10]), immuneHours: Number(light[11]) } },
        notes: [paragraphs[0].replace(light[0], "").trim(), "The layers take effect together (a creature turned to stone by blue is still a creature for indigo and violet).",
            "Each color must be counteracted by its own spell, in order (red to violet); counteracting all of them ends the spell. The caster can Dismiss it."],
        claimed: paragraphs
    };
}
