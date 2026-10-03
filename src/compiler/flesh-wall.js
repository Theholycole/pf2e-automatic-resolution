// A wall of living flesh with one chosen feature (Wall of Flesh): "You craft a 20-foot-tall wall of living flesh in a straight line up to 30 feet long. The wall is
// 3 feet thick, and each 5-foot-long section has AC 10 and 75 Hit Points. … When you Cast the Spell, choose one of the following features for your wall." with
// "Mouths … The mouths Strike any creature that ends its turn within 5 feet of the wall, using your spell attack modifier for these Strikes and dealing
// @Damage[(1+(ceil((@item.level - 4) / 2)))d6[piercing]] damage. …", "Eyes … You can see through these eyes, gaining a +2 circumstance bonus to visual Perception
// checks within the wall's line of sight. …" and "Arms … Any creature that ends its turn within 5 feet of the wall must attempt a Reflex save." (Failure: {Grabbed}
// by the wall for 1 round or until it Escapes against your spell DC; Critical Failure: {Restrained} …) with "Heightened (+2) The Hit Points of each section of the
// wall increase by 10, and the piercing damage dealt by the wall's mouths increases by 1d6." — the caster's pick; the GM's region (the wall and the squares within 5
// feet of it): as a creature ends its turn in it, the mouths' Strike (the caster's spell attack against its AC, the dice at the cast rank) or the arms' save (the
// condition for 1 round); the eyes the caster's Effect (its bonus toggled on within the wall's sight); the sections' statistics and the rest notes.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{`;
const WALL = /^You craft a (\d+)-foot-tall wall of living flesh in a straight line up to (\d+) feet long\.$/;
const SECTION = /^The wall is (\d+) feet thick, and each (\d+)-foot-long section has AC (\d+) and (\d+) Hit Points\.$/;
const NOTES = [/^If you wish, the wall can be of a smaller length or height\.$/, /^You must create the wall in an unbroken open space so its edges don't pass through any creatures or objects, or the spell is lost\.$/,
    /^The wall can't be Repaired but can be healed by vitality, and healing spells and abilities\.$/];
const CHOOSE = /^When you Cast the Spell, choose one of the following features for your wall\.$/;
const MOUTHS = [/^The wall has countless toothy mouths along its surface\.$/,
    /^The mouths Strike any creature that ends its turn within (\d+) feet of the wall, using your spell attack modifier for these Strikes and dealing @Damage\[\(1\+\(ceil\(\(@item\.level - (\d+)\) \/ (\d)\)\)\)d(\d+)\[([a-z]+)\]\] damage\.$/,
    /^The mouths are capable of consuming potions; since the wall is alive, it can recover Hit Points from a (?:@UUID\[[^\]]+\]\{)?Healing Potion\}?, but it can't benefit from any effect that would give it the ability to move\.$/,
    /^Otherwise, the GM determines which potions can affect the wall\.$/];
const EYES = [/^The wall sprouts hundreds of unblinking eyes\.$/, /^You can see through these eyes, gaining a \+(\d) (circumstance|status) bonus to visual Perception checks within the wall's line of sight\.$/,
    /^You can also use the eyes for determining line of sight for ranged attacks and spells, but you don't have line of effect through the wall\.$/];
const ARMS = [/^The wall is a mass of grasping arms\.$/, /^Any creature that ends its turn within (\d+) feet of the wall must attempt a (Reflex|Fortitude|Will) save\.$/];
const ROW = new RegExp(String.raw`^The creature is (?:unaffected|${C}(Grabbed|Restrained)\} by the wall for (\d+) rounds? or until it Escapes against your spell DC, whichever comes first)\.$`);
const STEP = /^Heightened \(\+(\d)\) The Hit Points of each section of the wall increase by (\d+), and the ([a-z]+) damage dealt by the wall's mouths increases by (\d+)d(\d+)\.$/;

/** {fleshWall, claimed} or null. */
export function compileFleshWall(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!minutes || rest.length) return null;
    const listStart = body.indexOf("<ul>");
    if (listStart < 0) return null;
    const split = text => htmlToPlainText(text).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    const lead = split(body.slice(0, listStart));
    const wall = WALL.exec(lead[0] ?? ""), section = SECTION.exec(lead[1] ?? "");
    const notes = lead.slice(2, -1);
    if (!wall || !section || !CHOOSE.test(lead.at(-1)) || notes.some(sentence => !NOTES.some(pattern => pattern.test(sentence)))) return null;
    // The three features: each top-level item (the arms' result rows are its own nested list).
    const list = body.slice(listStart);
    const heads = [...list.matchAll(/<li>\s*(?:<p>\s*)?<strong>([A-Z][a-z]+)<\/strong>/g)].filter(match => !["Success", "Failure", "Critical"].includes(match[1]) && !/^Critical/.test(match[1]));
    if (heads.map(match => match[1]).join() !== "Mouths,Eyes,Arms") return null;
    const bodies = heads.map((match, index) => list.slice(match.index + match[0].length, heads[index + 1]?.index ?? list.length));
    const keyed = (lines, patterns) => lines.length === patterns.length && patterns.every((pattern, index) => pattern.test(lines[index])) ? lines.map((line, index) => patterns[index].exec(line)) : null;
    const mouths = keyed(split(bodies[0]), MOUTHS), eyes = keyed(split(bodies[1]), EYES);
    const armsLead = bodies[2].split(/<ul>/)[0], armsRows = [...bodies[2].matchAll(/<li>\s*<p>\s*<strong>([^<]+)<\/strong>\s*([\s\S]*?)<\/p>\s*<\/li>/g)];
    const arms = keyed(split(armsLead), ARMS);
    if (!mouths || !eyes || !arms || armsRows.length !== 3) return null;
    const rows = {};
    for (const [, label, text] of armsRows) {
        const row = ROW.exec(text.replace(/\s+/g, " ").trim());
        const key = { Success: "success", Failure: "failure", "Critical Failure": "criticalFailure" }[label.trim()];
        if (!row || !key) return null;
        rows[key] = row[1] ? { uuid: row[1], name: row[2], rounds: Number(row[3]) } : null;
    }
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    const m = mouths[1];
    if (!step || step[3] !== m[5] || step[5] !== m[4] || Number(step[1]) !== Number(m[3]) || Number(m[2]) !== Number(adapted.rank) - 1 || rows.success !== null || !rows.failure || !rows.criticalFailure) return null;
    return { fleshWall: { seconds: Number(minutes[1]) * 60, wall: { height: Number(wall[1]), length: Number(wall[2]), thickness: Number(section[1]) },
            section: { feet: Number(section[2]), ac: Number(section[3]), hp: Number(section[4]), step: { interval: Number(step[1]), hp: Number(step[2]) } },
            features: {
                mouths: { reach: Number(m[1]), base: 1, offset: Number(m[2]), interval: Number(m[3]), faces: Number(m[4]), type: m[5] },
                eyes: { value: Number(eyes[1][1]), type: eyes[1][2] },
                arms: { reach: Number(arms[1][1]), statistic: arms[1][2].toLowerCase(), failure: rows.failure, criticalFailure: rows.criticalFailure } },
            notes: [...notes, mouths[2][0].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1"), mouths[3][0], eyes[2][0]] },
        claimed: [...lead, ...split(bodies[0]), ...split(bodies[1]), ...split(armsLead), ...armsRows.map(row => htmlToPlainText(`${row[1]} ${row[2]}`)), step[0]] };
}

/** The mouths' dice and a section's Hit Points at a cast rank. */
export function fleshWallAt(data, castRank) {
    const mouths = data.features.mouths;
    const dice = mouths.base + Math.ceil((Number(castRank) - mouths.offset) / mouths.interval);
    const hp = data.section.hp + Math.max(0, Math.floor((Number(castRank) - (mouths.offset + 1)) / data.section.step.interval)) * data.section.step.hp;
    return { dice, formula: `${dice}d${mouths.faces}`, hp };
}
