// A shield of spirits that blunts damage crossing it (Spirit Boundary): "You call forth a stationary shield … The spirits do not impede sight, movement, or line of effect.
// When an effect that deals damage passes through the spirit shield, reduce the damage that the effect deals by the listed amount; the shield takes the same amount of
// damage that it reduced. If the crossing effect deals damage to multiple creatures, the shield only takes damage once. When the shield is reduced to 0 Hit Points, it is
// destroyed. The size of the shield, the amount of damage reduced, and the shield's durability depend upon the number of actions used to cast the spell." with the
// versions (1: a 10-foot radius, (1 + rank) × 4 Hit Points, reducing by 1 + rank; 2: 20 feet, 2 + rank × 12, reducing by (1 + rank) × 2; 3: any radius from 5 to 30 feet,
// as the two-action version, and Dismissed as a reaction) and "Heightened (+1) …": the burst a region for the minute; damage a creature takes from an origin on the other
// side of its edge reduced (the Hit Points given back), the shield losing what it reduced — once per damaging effect; destroyed at 0; the Dismiss reaction the card's.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const LEAD = [/^The spirits do not impede sight, movement, or line of effect\.$/,
    /^When an effect that deals damage passes through the spirit shield, reduce the damage that the effect deals by the listed amount; the shield takes the same amount of damage that it reduced\.$/,
    /^If the crossing effect deals damage to multiple creatures, the shield only takes damage once\.$/, /^When the shield is reduced to 0 Hit Points, it is destroyed\.$/,
    /^The size of the shield, the amount of damage reduced, and the shield['’]s durability depend upon the number of actions used to cast the spell\.$/];
const ONE = /^1 The shield has a @Template\[type:burst\|distance:(\d+)\]\{[^}]+\} and \[\[([^\]]+)\]\] Hit Points\. It reduces damage that crosses it by \[\[([^\]]+)\]\]\.$/;
const TWO = /^2 The shield has a @Template\[type:burst\|distance:(\d+)\]\{[^}]+\} and \[\[([^\]]+)\]\] Hit Points\. It reduces damage that crosses it by \[\[([^\]]+)\]\]\.$/;
const THREE = /^3 You can select any radius between @Template\[type:burst\|distance:(\d+)\]\{[^}]+\} and @Template\[type:burst\|distance:(\d+)\]\{[^}]+\} for the shield\. The shield has \[\[([^\]]+)\]\] Hit Points and reduces damage that crosses it by \[\[([^\]]+)\]\]\. (You can Dismiss this spell as a reaction triggered by a damaging effect passing through it\.)$/;
const STEP = /^Heightened \(\+1\) For the one-action version, increase the damage reduced by (\d+) and the shield['’]s Hit Points by (\d+)\. For the two-action version and three-action versions, increase the damage reduced by (\d+) and the shield['’]s Hit Points by (\d+)\.$/;

/** A formula of the rank (or null). */
export function boundaryAt(formula, rank) {
    const text = String(formula).replace(/@item\.(?:level|rank)\b/g, String(rank));
    if (!/^[\d\s()+*\/-]+$/.test(text)) return null;
    try { return Function(`"use strict"; return (${text});`)(); } catch { return null; }
}

/** {boundary, sentences} or null. */
export function extractSpiritBoundary(item) {
    if (!/^1 to 3$/.test(String(item?.system?.time?.value ?? "").trim()) || !/^1 minute$/.test(String(item.system?.duration?.value ?? "").trim()) || item.system?.defense || Object.keys(item.system?.damage ?? {}).length) return null;
    const [body, heightened = "", ...rest] = String(item.system?.description?.value ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/<span class="action-glyph">\s*(\d)\s*<\/span>/g, "$1").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
    const lead = (paragraphs[0] ?? "").split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const one = ONE.exec(paragraphs[1] ?? ""), two = TWO.exec(paragraphs[2] ?? ""), three = THREE.exec(paragraphs[3] ?? ""), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 4 || lead.length !== LEAD.length + 1 || NARRATION_RULES.test(lead[0]) || LEAD.some((pattern, index) => !pattern.test(lead[index + 1])) || !one || !two || !three || !step) return null;
    const versions = { 1: { radius: Number(one[1]), hp: one[2], reduce: one[3] }, 2: { radius: Number(two[1]), hp: two[2], reduce: two[3] },
        3: { radius: null, min: Number(three[1]), max: Number(three[2]), hp: three[3], reduce: three[4], dismiss: three[5] } };
    // (The inline rolls grow as the Heightened entry says, at every rank.)
    const grows = (version, hp, reduce) => [1, 2, 3, 4, 5, 6, 7, 8, 9].every(rank => boundaryAt(version.hp, rank + 1) - boundaryAt(version.hp, rank) === hp
        && boundaryAt(version.reduce, rank + 1) - boundaryAt(version.reduce, rank) === reduce);
    if (!grows(versions[1], Number(step[2]), Number(step[1])) || !grows(versions[2], Number(step[4]), Number(step[3])) || !grows(versions[3], Number(step[4]), Number(step[3]))) return null;
    return { boundary: { versions, seconds: 60 }, sentences: [...lead.slice(1), paragraphs[1], paragraphs[2], paragraphs[3], htmlToPlainText(heightened).trim()] };
}
