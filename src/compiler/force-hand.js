// A sustained hand of force that shields its caster (or an ally) by what the caster did on its turn, and at higher ranks acts instead (Forceful Hand): "A Medium
// floating, disembodied hand made of magical force appears in an unoccupied space adjacent to you … When you Sustain the Spell, you can have the hand Fly to an
// unoccupied space of your choice adjacent to an ally to protect that ally instead. …" / "… The hand has an AC of 25, 50 Hit Points, and can't recover HP by any
// means. …" / "… At the end of your turn, what the hand does is determined by the first entry on this list that matches a trait from any of the actions you used on
// your turn. …" with "Manipulate or Attack" (lesser cover, +1 circumstance to AC), "Move" (standard cover, +2 to AC, Reflex and Stealth) and "Concentrate" (greater,
// +4), and the Heightened entries (6th–9th: the hand's AC and Hit Points, Large from 7th, and the actions that can replace Manipulate or Attack: Swat — a Push with
// the spell attack roll; Grasp — a Grapple with it; Punch — a melee spell attack Strike of 7d8 force; Crush — a Strike of 6d8 force that grabs, or Constrict for
// 6d8 force with a basic Fortitude save on a grabbed target) — the hand a token with its statistics at the cast rank, removed when the caster's sustained Effect
// ends; the card's end-of-turn controls: the protected creature's cover Effect (its bonuses toggled on for an attack through the hand's square), or the chosen
// replacement's roll against a targeted enemy; protecting an ally the card's control.
import { htmlToPlainText } from "./description-parser.js";

const NOTES = [/^Each time you Sustain the Spell, the hand moves to an unoccupied space of your choice adjacent to you\.$/, /^The hand's movement does not trigger reactions based on creature movement\.$/,
    /^The [a-z ]+ occupies its space, but creatures can move through the hand freely\.$/, /^Successful attacks against the hand damage it, and damaging effects that can target a creature can target the hand\.$/,
    /^A hit by a [a-z ]+ spell or similar effect destroys the hand\.$/, /^The hand's actions and the cover it provides depend on what actions you take during your turn\.$/,
    /^For instance, if you Step, Stride, and Sustain the Spell, you use the entry for move actions, so the hand provides standard cover\.$/];
const APPEAR = /^An? (Medium|Large) floating, disembodied hand made of magical force appears in an unoccupied space adjacent to you, following you across the battlefield to shield you against your foes' attacks\.$/;
const PROTECT = /^When you Sustain the Spell, you can have the hand Fly to an unoccupied space of your choice adjacent to an ally to protect that ally instead\.$/;
const STATS = /^The hand has an AC of (\d+), (\d+) Hit Points, and can't recover HP by any means\.$/;
const ORDER = /^At the end of your turn, what the hand does is determined by the first entry on this list that matches a trait from any of the actions you used on your turn\.$/;
const COVER = /^(?:The hand interposes between you and your foes\. )?It provides (lesser|standard|greater) cover \(\+(\d) circumstance bonus to ([A-Za-z, ]+?)(?: checks)?\) against all attacks that pass through the hand's square\.$/;
const COVER_MOVE = /^The hand provides (lesser|standard|greater) cover \(\+(\d) circumstance bonus to ([A-Za-z, ]+?)(?: checks)?\) against all attacks that pass through the hand's square\.$/;
const STEP = /^Heightened \((\d+)(?:st|nd|rd|th)\) The hand has AC (\d+) and (\d+) Hit Points(, and it is Large)?\. When you Cast this Spell, you can choose to replace the hand's Manipulate or Attack option with ([A-Za-z, ]+)\.$/;
const FLIES = "The hand Flies to an enemy of your choice within range and attempts to";
const SWAT = new RegExp(String.raw`^${FLIES} (Push|Grapple) that enemy, using your spell attack roll instead of an Athletics check to determine the results of the \1\.$`);
const PUNCH = new RegExp(String.raw`^${FLIES} Strike that enemy with crushing force\. The hand's Strikes use your melee spell attack modifiers and deal @Damage\[(\d+)d(\d+)\[([a-z]+)\]\] damage\. The hand's Strikes don't use or contribute to your multiple attack penalty\.$`);
const CRUSH = /^If the hand doesn't have a target grabbed, it Flies to an enemy of your choice within range and attempts to Strike that enemy with deadly crushing force\. The hand's Strikes are melee spell attacks that deal @Damage\[(\d+)d(\d+)\[([a-z]+)\]\] damage\. The hand's Strikes don't take or contribute to your multiple attack penalty\. On a successful Strike, the target is grabbed by the hand until the end of your next turn, unless the hand moves or the target successfully Escapes against your spell DC\. However, if the hand has a target grabbed when it uses Crush, it instead @UUID\[[^\]]+\]\{Constricts\} the target, dealing @Damage\[(\d+)d(\d+)\[([a-z]+)\]\] damage with a basic (Fortitude|Reflex|Will) save\.$/;
const SELECTORS = { AC: "ac", Reflex: "reflex", Stealth: "stealth" };

/** {forceHand, claimed} or null. */
export function compileForceHand(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim() || adapted.lifecycle?.sustained !== true) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const range = /^(\d+) feet$/.exec(String(adapted.targeting?.range ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!minutes || !range || rest.length) return null;
    const list = /<ul>([\s\S]*?)<\/ul>/.exec(body);
    if (!list) return null;
    const split = text => htmlToPlainText(text).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const sentences = split(body.replace(list[0], ""));
    let appear = null, protect = false, stats = null, order = false;
    const notes = [];
    for (const sentence of sentences) {
        if (!appear && APPEAR.test(sentence)) { appear = APPEAR.exec(sentence); continue; }
        if (!protect && PROTECT.test(sentence)) { protect = true; continue; }
        if (!stats && STATS.test(sentence)) { stats = STATS.exec(sentence); continue; }
        if (!order && ORDER.test(sentence)) { order = true; continue; }
        if (NOTES.some(pattern => pattern.test(sentence))) { notes.push(sentence); continue; }
        return null;
    }
    if (!appear || !protect || !stats || !order) return null;
    const items = html => [...html.matchAll(/<li>\s*<strong>([^<]+)<\/strong>\s*([\s\S]*?)<\/li>/g)].map(match => ({ name: match[1].trim(), text: htmlToPlainText(match[2]).replace(/\s+/g, " ").trim(), raw: match[2].replace(/\s+/g, " ").trim() }));
    const modes = [];
    for (const entry of items(list[1])) {
        const cover = COVER.exec(entry.text) ?? COVER_MOVE.exec(entry.text);
        const traits = entry.name.toLowerCase().split(/ or /);
        const selectors = cover ? cover[3].split(/, (?:and )?|,? and /).map(name => SELECTORS[name.trim()]) : [];
        if (!cover || selectors.some(selector => !selector)) return null;
        modes.push({ key: traits.join("-"), label: entry.name, traits, cover: cover[1], bonus: Number(cover[2]), selectors });
    }
    if (modes.length !== 3) return null;
    // The Heightened entries: each rank's statistics and the replacements it allows; each replacement described once.
    const paragraphs = [...heightened.matchAll(/<p>([\s\S]*?)<\/p>\s*(?:<ul>([\s\S]*?)<\/ul>)?/g)];
    const ranks = [{ rank: Number(adapted.rank), ac: Number(stats[1]), hp: Number(stats[2]), size: appear[1] === "Large" ? "lg" : "med", replacements: [] }];
    const replacements = {};
    for (const [, paragraph, described] of paragraphs) {
        const step = STEP.exec(htmlToPlainText(paragraph).replace(/\s+/g, " ").trim());
        if (!step) return null;
        ranks.push({ rank: Number(step[1]), ac: Number(step[2]), hp: Number(step[3]), size: step[4] ? "lg" : "med", replacements: step[5].split(/, (?:or )?| or /).map(name => name.trim().toLowerCase()) });
        for (const entry of items(described ?? "")) {
            const key = entry.name.toLowerCase();
            if (replacements[key]) return null;
            const swat = SWAT.exec(entry.text), punch = PUNCH.exec(entry.raw), crush = CRUSH.exec(entry.raw);
            if (swat) replacements[key] = { key, label: entry.name, kind: swat[1].toLowerCase(), text: entry.text };
            else if (punch) replacements[key] = { key, label: entry.name, kind: "strike", dice: Number(punch[1]), faces: Number(punch[2]), type: punch[3], text: entry.text };
            else if (crush) replacements[key] = { key, label: entry.name, kind: "crush", dice: Number(crush[1]), faces: Number(crush[2]), type: crush[3],
                constrict: { dice: Number(crush[4]), faces: Number(crush[5]), type: crush[6], statistic: crush[7].toLowerCase() }, text: entry.text };
            else return null;
        }
    }
    if (ranks.slice(1).some(entry => entry.replacements.some(key => !replacements[key]))) return null;
    return { forceHand: { seconds: Number(minutes[1]) * 60, range: Number(range[1]), ranks, modes, replacements, notes },
        claimed: [...sentences, ...items(list[1]).map(entry => `${entry.name} ${entry.text}`), ...paragraphs.map(([, paragraph, described]) => `${htmlToPlainText(paragraph)} ${htmlToPlainText(described ?? "")}`.replace(/\s+/g, " ").trim())] };
}

/** The hand at a cast rank: the last entry at or below it. */
export function forceHandAt(data, castRank) {
    return data.ranks.filter(entry => Number(castRank) >= entry.rank).at(-1) ?? data.ranks[0];
}
