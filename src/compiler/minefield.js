// Hidden mines (Instant Minefield): "… Choose up to 6 unoccupied squares within range. A mine appears in each chosen square, visible only to you and your
// allies. A mine can't be targeted and isn't affected by area effects, but if it hasn't been triggered by the end of the spell's duration, it dissipates
// harmlessly. A creature that can see @UUID[…]{Invisible} creatures and objects can see the mines. A creature can also attempt a Perception check against your
// spell DC to [[/act seek]] to find an invisible mine." / "A creature who enters a square with an invisible mine triggers it, causing an explosion that deals
// 3d6 fire damage and 3d6 piercing damage (basic Reflex save) to the creature and every creature in a @Template[emanation|distance:5] from the mine's
// square." with "Heightened (+1) The fire damage and piercing damage dealt by a mine each increase by 1d6.": the mines the squares of a region the GM draws
// (hidden from players), for the duration; the GM's control when one is triggered opens one basic Reflex card of PF2e's two damage entries (heightened) for
// the creatures it catches; after the last mine the spell ends; seeing and finding the mines notes.
import { htmlToPlainText } from "./description-parser.js";

const CHOOSE = /^Choose up to (\d+) unoccupied squares within range\.$/;
const TRIGGER = /^A creature who enters a square with an invisible mine triggers it, causing an explosion that deals (\d+d\d+) ([a-z]+) damage and (\d+d\d+) ([a-z]+) damage \(basic (Fortitude|Reflex|Will) save\) to the creature and every creature in a @Template\[emanation\|distance:(\d+)\] from the mine's square\.$/;
const STEP = /^Heightened \(\+1\) The ([a-z]+) damage and ([a-z]+) damage dealt by a mine each increase by 1d(\d+)\.$/;

/** {html, lingering, sentences} or null. */
export function rewriteMinefield(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim()) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const components = adapted.damageComponents ?? [];
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || sections.length !== 2) return null;
    const paragraphs = [...sections[0].matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 2) return null;
    const first = paragraphs[0].split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const choose = CHOOSE.exec(first[1] ?? ""), trigger = TRIGGER.exec(paragraphs[1]), step = STEP.exec(htmlToPlainText(sections[1]).replace(/\s+/g, " ").trim());
    if (first.length !== 6 || !choose || !trigger || !step) return null;
    const [, dice1, type1, dice2, type2, statistic, feet] = trigger;
    const byType = Object.fromEntries(components.map(component => [String(component.type).toLowerCase(), String(component.formula).replace(/\s+/g, "")]));
    if (components.length !== 2 || components.some(component => component.category) || byType[type1] !== dice1 || byType[type2] !== dice2 || statistic.toLowerCase() !== adapted.defense.statistic
        || ![step[1], step[2]].every(type => [type1, type2].includes(type))) return null;
    const notes = [`Draw the mines as up to ${choose[1]} squares of the area's region (hidden from the players): ${first.slice(2).join(" ")}`];
    return {
        html: `<p>The explosion deals ${dice1} ${type1} damage and ${dice2} ${type2} damage with a basic ${statistic} save.</p>`,
        lingering: { events: [], initial: false, oncePerRound: false, excludeCaster: false, enemiesOnly: false, area: { type: "burst", value: 5 }, centre: "placed",
            durationSeconds: Number(minutes[1]) * 60, sustained: false, concealment: false, mines: { count: Number(choose[1]), emanation: Number(feet), sourceText: paragraphs[1] },
            notes, sourceText: [first[1], paragraphs[1]] },
        sentences: [...first, paragraphs[1], htmlToPlainText(sections[1]).trim()]
    };
}

// Motion-triggered bulbs (Pollen Pods): "Area four unoccupied 5-foot squares, each of which is at least 20 feet apart" / "You cultivate four wooden bulbs, each
// filled with toxic pollen and sensitive to motion. When a creature enters a space adjacent to a bulb, or when a bulb is touched or damaged (each bulb has AC 5),
// the bulb blossoms and releases pollen in a @Template[emanation|distance:15]. Creatures in the area take 8d8 poison damage and must attempt a Fortitude save
// with the following results." — the minefield route with the rows' table: the bulbs the squares of a region the GM draws; the GM's control when one blossoms
// opens the save card for the creatures within 15 feet of it.
const COUNTS = { two: 2, three: 3, four: 4, five: 5, six: 6 };
const BULB_AREA = /^Area (two|three|four|five|six) unoccupied 5-foot squares, each of which is at least (\d+) feet apart$/;
const BULB_NARRATION = /^You cultivate (two|three|four|five|six) [a-z ]+ bulbs, each filled with [a-z ]+ and sensitive to motion\.$/;
const BULB_TRIGGER = /^When a creature enters a space adjacent to a bulb, or when a bulb is touched or damaged \(each bulb has AC (\d+)\), the bulb blossoms and releases [a-z]+ in a @Template\[emanation\|distance:(\d+)\]\.$/;
const BULB_SAVE = /^Creatures in the area take (\d+d\d+) ([a-z]+) damage and must attempt an? (Fortitude|Reflex|Will) save with the following results\.$/;
export function rewritePollenBulbs(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim()) return null;
    const hours = /^(\d+) (minute|hour)s?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const components = adapted.damageComponents ?? [];
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!hours || sections.length < 3 || components.length !== 1 || components[0].category) return null;
    const area = BULB_AREA.exec(htmlToPlainText(sections[0]).replace(/\s+/g, " ").trim());
    const lead = htmlToPlainText(sections[1]).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const narration = BULB_NARRATION.exec(lead[0] ?? ""), trigger = BULB_TRIGGER.exec(lead[1] ?? ""), save = BULB_SAVE.exec(lead[2] ?? "");
    if (!area || !narration || !trigger || !save || lead.length !== 3 || area[1] !== narration[1] || save[3].toLowerCase() !== adapted.defense.statistic
        || String(components[0].formula).replace(/\s+/g, "") !== save[1] || String(components[0].type).toLowerCase() !== save[2]) return null;
    const count = COUNTS[area[1]];
    return {
        html: [`<p>Creatures in the area take ${save[1]} ${save[2]} damage and must attempt a ${save[3]} save.</p>`, ...sections.slice(2)].join("<hr />"),
        lingering: { events: [], initial: false, oncePerRound: false, excludeCaster: false, enemiesOnly: false, area: { type: "burst", value: 5 }, centre: "placed",
            durationSeconds: Number(hours[1]) * (hours[2] === "hour" ? 3600 : 60), sustained: false, concealment: false, mines: { count, emanation: Number(trigger[2]), sourceText: lead[1] },
            notes: [`Draw the bulbs as ${count} unoccupied squares of the area's region, each at least ${area[2]} feet from the others. A bulb blossoms when a creature enters a space adjacent to it, or when it's touched or damaged (AC ${trigger[1]}): press its control.`],
            sourceText: [lead[1], lead[2]] },
        sentences: [htmlToPlainText(sections[0]).replace(/\s+/g, " ").trim(), ...lead]
    };
}
