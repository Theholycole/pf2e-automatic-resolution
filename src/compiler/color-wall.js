// A wall of a rolled color whose crossing has that color's effect (Chromatic Wall): "You create an opaque wall of light in a single vibrant color. The wall is
// straight and vertical, stretching 60 feet long and 30 feet high. …" / "Roll [[/r 1d4]] to determine the color of the wall. …" with the colors ("<strong>Red</strong>
// The wall destroys ranged weapon ammunition … and it deals @Damage[20[fire]] damage to anyone passing through, with a @Check[reflex|against:spell|basic] save.
// @UUID[…]{Cone of Cold} can counteract a <em>red chromatic wall</em>." … "<strong>Green</strong> … It deals @Damage[10[poison]] damage to anyone passing through and
// makes them {Enfeebled 1} for 1 minute. A @Check[fortitude|…|basic] save reduces the damage and negates the Enfeebled condition on a success. …") and "Heightened
// (7th) The spell's duration increases to 1 hour. Roll [[/r 1d8]] … the results for 5-8 are below. A … red, … orange, … yellow, or … green wall deals an extra 10
// damage." with "Blue" (the effects of {Petrify}), "Indigo" (the effects of {Warp Mind}), "Violet" (a Will save or Slowed 1 for 1 minute; a critical failure
// Interplanar Teleport instead) and "Reroll" (and a −2 circumstance penalty to the crossing creature's saves) — the color rolled at the cast rank; the GM draws the
// wall; the card's control for a creature that passed through: the color's save (its damage at the rank), the borrowed spell's own resolution, the Slowed save;
// what the wall stops, its light and the counteracting spells notes.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{`;
const S = String.raw`@UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\}`;
const LEAD = [/^You create an opaque wall of light in a single vibrant color\.$/, /^The wall is straight and vertical, stretching (\d+) feet long and (\d+) feet high\.$/,
    /^If the wall would pass through a creature, the spell is lost\.$/, /^The wall sheds bright light for (\d+) feet on each side, and dim light for the next (\d+) feet\.$/,
    /^You can ignore the wall's effects\.$/, /^Roll \[\[\/r 1d(\d)\]\] to determine the color of the wall\.$/,
    /^Each color has a particular effect on items, effects, or creatures that attempt to pass through\.$/,
    /^[A-Za-z ]+ can't be counteracted normally; rather, each color is automatically counteracted when targeted by a specific spell, even if that spell's rank is lower than that of [A-Za-z ]+\.$/];
const COUNTER = new RegExp(String.raw`^${S} can counteract an? <em>[a-z ]+<\/em>\.$`);
const BLOCKS = /^The wall (destroys [a-z ]+(?: \([^)]*\))? that would pass through|stops [a-z, ]+ from passing through|prevents spells from targeting the other side \(area effects still cross as normal\))/;
const DAMAGE = /^The wall (?:destroys [a-z ]+(?: \([^)]*\))? that would pass through|stops [a-z, ]+ from passing through), and it deals @Damage\[(\d+)\[([a-z]+)\]\] damage to anyone passing through, with a @Check\[(reflex|fortitude|will)\|against:spell\|basic\] save\.$/;
const STOPS = /^The wall stops [a-z, ]+ from passing through\.$/;
const RIDER = new RegExp(String.raw`^It deals @Damage\[(\d+)\[([a-z]+)\]\] damage to anyone passing through and makes them (${C}[A-Z][a-z]+ \d\}) for (\d+) minutes?\.$`);
const NEGATES = /^A @Check\[(reflex|fortitude|will)\|against:spell\|basic\] save reduces the damage and negates the [A-Z][a-z]+ condition on a success\.$/;
const BORROW = new RegExp(String.raw`^The wall stops [a-z, ]+ from passing through, and (?:creatures|those) passing through are subject to the effects of ${S}\.$`);
const VIOLET = new RegExp(String.raw`^Creatures passing through must succeed at a @Check\[(will|fortitude|reflex)\|against:spell\] save or they are (${C}Slowed \d\}) for (\d+) minutes?; on a critical failure, the creature is instead sent to another plane, with the effect of ${S}\.$`);
const PREVENTS = /^The wall prevents spells from targeting the other side \(area effects still cross as normal\)\.$/;
const REROLL = /^, and creatures that pass through the wall take a -(\d) (circumstance|status) penalty to their saves\.$/;
const STEP = [/^Heightened \((\d+)(?:st|nd|rd|th)\) The spell's duration increases to (\d+) hours?\.$/, /^Roll \[\[\/r 1d(\d)\]\] to determine the wall's color; the results for (\d)-(\d) are below\.$/,
    /^A (.+) wall deals an extra (\d+) damage\.$/];

const split = text => text.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
const items = html => [...html.matchAll(/<li>\s*<strong>([^<]+)<\/strong>\s*([\s\S]*?)<\/li>/g)].map(match => ({ name: match[1].trim(), text: match[2].replace(/\s+/g, " ").trim() }));

/** {colorWall, claimed} or null. */
export function compileColorWall(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim()) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const html = String(adapted.descriptionHTML ?? "");
    const [body, heightened = "", ...rest] = html.split(/<hr\s*\/?>/i);
    const lowList = /<ol>([\s\S]*?)<\/ol>/.exec(body), highList = /<ol start="(\d+)">([\s\S]*?)<\/ol>/.exec(heightened);
    if (!minutes || rest.length || !lowList || !highList) return null;
    const lead = split(htmlToPlainText(body.replace(lowList[0], "")));
    if (lead.length !== LEAD.length || LEAD.some((pattern, index) => !pattern.test(lead[index]))) return null;
    const m = index => LEAD[index].exec(lead[index]);
    const low = items(lowList[1]), high = items(highList[2]);
    if (low.length !== Number(m(5)[1])) return null;
    const colors = [], claimed = [...lead];
    // (A color's sentences: the HTML kept for the @-links; the counteracting spell and what the wall stops are notes.)
    const read = (entry, roll) => {
        const sentences = split(entry.text);
        const color = { roll, name: entry.name, notes: [] };
        for (const sentence of sentences) {
            const plain = htmlToPlainText(sentence);
            let found;
            if ((found = COUNTER.exec(sentence))) { color.notes.push(`${found[2]} counteracts this color automatically.`); continue; }
            if ((found = DAMAGE.exec(sentence))) { color.damage = { amount: Number(found[1]), type: found[2], statistic: found[3] }; color.notes.push(`The wall ${BLOCKS.exec(plain)[1]}.`); continue; }
            if (STOPS.test(plain)) { color.notes.push(plain); continue; }
            if ((found = RIDER.exec(sentence))) { color.damage = { amount: Number(found[1]), type: found[2], statistic: null }; color.rider = { condition: found[3], minutes: Number(found[5]) }; continue; }
            if ((found = NEGATES.exec(sentence)) && color.rider && !color.damage.statistic) { color.damage.statistic = found[1]; continue; }
            if ((found = BORROW.exec(sentence))) { color.borrowed = { uuid: found[1], name: found[2] }; color.notes.push(`The wall ${BLOCKS.exec(plain)[1]}.`); continue; }
            if ((found = VIOLET.exec(sentence))) { color.slowed = { statistic: found[1], condition: found[2], minutes: Number(found[4]) }; color.teleport = { uuid: found[5], name: found[6] }; continue; }
            if (PREVENTS.test(plain)) { color.notes.push(plain); continue; }
            return null;
        }
        if (color.damage && !color.damage.statistic) return null;
        if (!color.damage && !color.borrowed && !color.slowed) return null;
        claimed.push(`${entry.name} ${htmlToPlainText(entry.text)}`);
        return color;
    };
    for (const [index, entry] of low.entries()) { const color = read(entry, index + 1); if (!color || !color.damage) return null; colors.push(color); }
    const stepText = split(htmlToPlainText(/<p>\s*<strong>\s*Heightened[\s\S]*?<\/p>/.exec(heightened)?.[0] ?? ""));
    if (stepText.length !== STEP.length || STEP.some((pattern, index) => !pattern.test(stepText[index]))) return null;
    const s = index => STEP[index].exec(stepText[index]);
    if (Number(s(1)[2]) !== low.length + 1 || Number(s(1)[3]) !== low.length + high.length || Number(highList[1]) !== low.length + 1) return null;
    // ("A @Damage[30[fire]]{red}, … wall deals an extra 10 damage.": each named color's damage plus the extra.)
    const extra = Number(s(2)[2]);
    const raised = [.../<p>\s*<strong>\s*Heightened[\s\S]*?<\/p>/.exec(heightened)[0].matchAll(/@Damage\[(\d+)\[([a-z]+)\]\]\{([a-z]+)\}/g)];
    if (raised.length !== low.length || !raised.every(([, amount, type, name]) => colors.some(color => color.name.toLowerCase() === name && color.damage.type === type && color.damage.amount + extra === Number(amount)))) return null;
    claimed.push(...stepText);
    let reroll = null;
    for (const [index, entry] of high.entries()) {
        const roll = low.length + 1 + index;
        const again = /^Reroll$/.test(entry.name) ? REROLL.exec(entry.text) : null;
        if (again) { if (reroll || roll !== low.length + high.length) return null; reroll = { roll, penalty: Number(again[1]), type: again[2] }; claimed.push(`${entry.name}${htmlToPlainText(entry.text)}`); continue; }
        const color = read(entry, roll);
        if (!color || color.damage) return null;
        colors.push(color);
    }
    if (!reroll) return null;
    return { colorWall: { seconds: Number(minutes[1]) * 60, length: Number(m(1)[1]), height: Number(m(1)[2]), light: { bright: Number(m(3)[1]), dim: Number(m(3)[1]) + Number(m(3)[2]) },
            lowDie: low.length, highDie: low.length + high.length, highFrom: Number(s(0)[1]), highSeconds: Number(s(0)[2]) * 3600, extra, colors, reroll },
        claimed };
}
