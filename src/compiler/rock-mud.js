// Rock to mud or mud to rock (Transmute Rock and Mud): "Area 2 adjacent 10-foot cubes" / "… Choose one of these two options when you Cast the Spell." with "Rock to
// Mud … If you Cast this Spell on a stone floor, it becomes difficult terrain; if the resulting mud is at least 3 feet deep, it is greater difficult terrain, or the
// creature can try to Swim through it (@Check[athletics|dc:10|traits:action:swim]). … If you Cast this Spell on a ceiling, the falling mud deals @Damage[8d6[bludgeoning]]
// damage (@Check[reflex|basic] save) and spreads out, creating difficult terrain in an area 10 feet larger in radius than the original spell's area. …" and "Mud to Rock
// Mud in the area turns into unworked stone. If creatures are in the mud when it is transformed to stone, they must attempt a @Check[reflex] saving throw." (Success
// Prone; Failure Grabbed for 1 round or until it Escapes; Critical Failure Restrained …) with "Heightened (+2) Add an additional 10-foot cube to the area …" — the
// caster's option and (for the mud) where: the area's region (PF2e's template or the GM's) made difficult (or greater difficult) terrain that stays; a ceiling's
// basic save for the creatures under it (a compiled plan of the text's damage); mud to rock: the creatures inside's save of the stated rows (a compiled plan).
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_UUID_START as C, LABELS } from "./text-patterns.js";

const LEAD = [/^You warp the structure of earthen material, turning rock into mud or mud into rock\.$/, /^Choose one of these two options when you Cast the Spell\.$/];
const MUD = [/^You transform non-magical, unworked, and unattended stone in the area into an equal volume of mud\.$/,
    /^If you Cast this Spell on a stone floor, it becomes difficult terrain; if the resulting mud is at least (\d+) feet deep, it is greater difficult terrain, or the creature can try to (?:@UUID\[[^\]]+\]\{)?Swim\}? through it \(@Check\[athletics\|dc:(\d+)\|traits:action:swim\]\)\.$/,
    /^If the mud is deep enough that a creature can't reach the bottom, the creature must Swim to move through it\.$/,
    /^If you Cast this Spell on a ceiling, the falling mud deals @Damage\[(\d+)d(\d+)\[([a-z]+)\]\] damage \(@Check\[(reflex|fortitude|will)\|basic\] save\) and spreads out, creating difficult terrain in an area (\d+) feet larger in radius than the original spell's area\.$/,
    /^Once the rock is transformed into mud, the mud is non-magical and remains until natural conditions cause it to dry out or otherwise disperse\.$/];
const ROCK = [/^Mud in the area turns into unworked stone\.$/, /^If creatures are in the mud when it is transformed to stone, they must attempt a @Check\[(reflex|fortitude|will)\] saving throw\.$/];
const ROWS = {
    criticalSuccess: /^The creature escapes the mud and is atop the stone, unaffected\.$/,
    success: new RegExp(String.raw`^The creature climbs out of the mud as it turns to rock and is ${C}Prone\} atop the stone\.$`),
    failure: new RegExp(String.raw`^The creature is partially stuck in the mud and is ${C}Grabbed\} for (\d+) rounds? or until it (?:@UUID\[[^\]]+\]\{)?Escapes\}?, whichever comes first\.$`),
    criticalFailure: new RegExp(String.raw`^The creature is entirely stuck\. It is ${C}Restrained\} for (\d+) rounds? or until it Escapes, whichever comes first\.$`)
};
const STEP = /^Heightened \(\+(\d)\) Add an additional (\d+)-foot cube to the area, adjacent to at least one of the other cubes\.$/;

/** {rockMud, claimed} or null. */
export function compileRockMud(adapted) {
    const area = adapted.targeting?.area;
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim() || area?.type !== "cube") return null;
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const split = text => htmlToPlainText(text).replace(/\s+/g, " ").trim().split(/(?<=[.!?)])\s+(?=[A-Z])/).filter(Boolean);
    const cubes = /^\s*<p>\s*<strong>Area<\/strong>\s*(\d+) adjacent (\d+)-foot cubes\s*<\/p>/.exec(body);
    const intro = /<\/p>\s*<p>([\s\S]*?)<\/p>\s*<ul>/.exec(body);
    const mud = /<li>\s*<strong>Rock to Mud<\/strong>([\s\S]*?)<\/li>\s*<li>\s*<strong>Mud to Rock<\/strong>([\s\S]*?)<ul>([\s\S]*?)<\/ul>\s*<\/li>\s*<\/ul>\s*$/.exec(body);
    if (!cubes || !intro || !mud) return null;
    const lead = split(intro[1]);
    const keyed = (lines, patterns) => lines.length === patterns.length && patterns.every((pattern, index) => pattern.test(lines[index])) ? lines.map((line, index) => patterns[index].exec(line)) : null;
    const lines = (html => html.replace(/\s+/g, " ").trim().split(/(?<=[.!?)])\s+(?=[A-Z])/).filter(Boolean))(mud[1]);
    const m = keyed(lines.map(line => line.replace(/@UUID\[[^\]]+\]\{Swim\}/, "Swim")), MUD), r = keyed(split(mud[2]), ROCK);
    if (!keyed(lead, LEAD) || !m || !r) return null;
    const rows = {};
    for (const [, label, text] of mud[3].matchAll(/<li>\s*<strong>([^<]+)<\/strong>\s*([\s\S]*?)<\/li>/g)) {
        const key = LABELS[label.trim()], line = text.replace(/\s+/g, " ").trim();
        if (!key || rows[key] || !ROWS[key].test(line)) return null;
        rows[key] = ROWS[key].exec(line);
    }
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (Object.keys(rows).length !== 4 || !step || Number(step[2]) !== Number(cubes[2]) || Number(area.value) !== Number(cubes[2])) return null;
    const ceiling = m[3];
    return { rockMud: { cubes: { count: Number(cubes[1]), feet: Number(cubes[2]), step: { interval: Number(step[1]), add: 1 } },
            mud: { deepFeet: Number(m[1][1]), swimDC: Number(m[1][2]), ceiling: { dice: Number(ceiling[1]), faces: Number(ceiling[2]), type: ceiling[3], statistic: ceiling[4], spread: Number(ceiling[5]) } },
            rock: { statistic: r[1][1], success: { uuid: rows.success[1] }, failure: { uuid: rows.failure[1], rounds: Number(rows.failure[2]) }, criticalFailure: { uuid: rows.criticalFailure[1], rounds: Number(rows.criticalFailure[2]) } },
            notes: [htmlToPlainText(lines[2]), htmlToPlainText(lines[4])] },
        claimed: [...lead, ...lines.map(line => htmlToPlainText(line)), ...split(mud[2]), ...Object.values(rows).map(row => htmlToPlainText(row[0])), step[0]] };
}
