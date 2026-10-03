// Two bound trees, one harming and one healing those beneath them (Tree of Life and Death): "The trees must be at least 20 feet apart. Each one occupies its square,
// and its canopy spreads out in a @Template[type:emanation|distance:10]. Each tree has AC 10, Hardness 10, and 50 Hit Points. They're immune to critical hits and
// precision damage. When either tree is reduced to 0 Hit Points or the spell ends, both trees disintegrate into a pile of dust." with "Tree of Death … A living
// creature that starts its turn within or enters the emanation takes @Damage[(@item.rank)d4[void]…] damage, with a basic Fortitude save. A creature can only be
// damaged this way once per round." and "Tree of Life … A living creature that starts its turn within or enters the emanation regains @Damage[(@item.rank)d4[vitality,
// healing]…] Hit Points. A creature can only be healed this way once per round." and "Heightened (+1) … tree's Hit Points increases by 10." — the trees tokens (their
// statistics at the cast rank), each with its emanation as an Ongoing area following it: the living creatures entering or starting a turn in it take the death tree's
// damage (their basic save) or the life tree's healing, once per round; either at 0 HP, or the spell's end, removes both.
import { htmlToPlainText } from "./description-parser.js";

const RULES = {
    apart: /^The trees must be at least (\d+) feet apart\.$/,
    canopy: /^Each one occupies its square, and its canopy spreads out in a @Template\[type:emanation\|distance:(\d+)\]\.$/,
    stats: /^Each tree has AC (\d+), Hardness (\d+), and (\d+) Hit Points\.$/,
    immune: /^They're immune to critical hits and precision damage\.$/,
    end: /^When either tree is reduced to 0 Hit Points or the spell ends, both trees disintegrate into a pile of dust\.$/
};
const HARM = [/^A living creature that starts its turn within or enters the emanation takes @Damage\[\(@item\.rank\)d(\d+)\[([a-z]+)\](?:\|[^\]]*)?\] damage, with a basic (Fortitude|Reflex|Will) save\.$/,
    /^A creature can only be damaged this way once per round\.$/];
const HEAL = [/^A living creature that starts its turn within or enters the emanation regains @Damage\[\(@item\.rank\)d(\d+)\[vitality,healing\](?:\|[^\]]*)?\] Hit Points\.$/,
    /^A creature can only be healed this way once per round\.$/];
const STEP = /^Heightened \(\+1\) The ([a-z]+) damage increases by 1d(\d+), the healing increases by 1d(\d+), and tree's Hit Points increases by (\d+)\.$/;

/** {treePair, claimed} or null. */
export function compileTreePair(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim()) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const range = /^(\d+) feet$/.exec(String(adapted.targeting?.range ?? "").trim());
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!minutes || !range || sections.length !== 3 || !/^\s*<p>\s*<strong>Area<\/strong>\s*2 unoccupied squares\s*<\/p>\s*$/.test(sections[0])) return null;
    const body = sections[1], list = /<ul>([\s\S]*?)<\/ul>/.exec(body);
    if (!list) return null;
    const split = text => htmlToPlainText(text).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const lead = split(body.replace(list[0], ""));
    const claimed = {};
    for (const [index, sentence] of lead.entries()) {
        const key = Object.keys(RULES).find(name => !claimed[name] && RULES[name].test(sentence));
        if (key) { claimed[key] = RULES[key].exec(sentence); continue; }
        if (index <= 1 && !/\d|@|\b(?:damage|save|bonus|penalty)\b/.test(sentence)) continue;
        return null;
    }
    if (Object.keys(claimed).length !== Object.keys(RULES).length) return null;
    const trees = [...list[1].matchAll(/<li>\s*(?:<p>\s*)?<strong>([^<]+)<\/strong>\s*([\s\S]*?)(?:<\/p>\s*)?<\/li>/g)].map(match => ({ name: match[1].trim(), lines: split(match[2]) }));
    const read = (tree, patterns) => tree.lines.length === patterns.length + 1 && !/\d|@|\b(?:damage|save|bonus|penalty)\b/.test(tree.lines[0])
        && patterns.every((pattern, index) => pattern.test(tree.lines[index + 1])) ? patterns.map((pattern, index) => pattern.exec(tree.lines[index + 1])) : null;
    const harmTree = trees.find(tree => read(tree, HARM)), healTree = trees.find(tree => read(tree, HEAL));
    const step = STEP.exec(htmlToPlainText(sections[2]).replace(/\s+/g, " ").trim());
    if (trees.length !== 2 || !harmTree || !healTree || !step) return null;
    const harm = read(harmTree, HARM)[0], heal = read(healTree, HEAL)[0];
    if (step[1] !== harm[2] || step[2] !== harm[1] || step[3] !== heal[1] || harm[3].toLowerCase() !== adapted.defense.statistic) return null;
    return { treePair: { seconds: Number(minutes[1]) * 60, range: Number(range[1]), apart: Number(claimed.apart[1]), canopy: Number(claimed.canopy[1]),
            stats: { ac: Number(claimed.stats[1]), hardness: Number(claimed.stats[2]), hp: Number(claimed.stats[3]), step: Number(step[4]) },
            harm: { name: harmTree.name, faces: Number(harm[1]), type: harm[2], statistic: harm[3].toLowerCase() }, heal: { name: healTree.name, faces: Number(heal[1]) } },
        claimed: [...lead, ...trees.flatMap(tree => tree.lines), step[0]] };
}
