// A tree grown to seize foes (Wooden Engulfment): "You create a tree in the designated area, and creatures in the area are immediately moved to an adjacent square of
// their choice they could occupy. The tree is 40 feet high and has 60 Hit Points, AC 30, a reach of 15 feet, and is permanently Immobilized." / "When you first Cast
// the Spell and each time you Sustain the spell, you can attempt a spell attack roll against the Reflex DC of a target within the tree's reach. If your spell attack
// roll is successful, the target is Grabbed by the tree until the end of your next turn or Restrained if your spell attack roll was a critical success. The creature
// grabbed or restrained by the tree can attempt to Escape and other creatures can attempt to free the grabbed or restrained creature by attempting a Force Open,
// using your spell DC for the DC of both checks. The tree uses and contributes to your multiple attack penalty." with "Heightened (+1) The tree's height increases by
// 5 feet, its Hit Points increases by 10, and its AC increases by 3.": the tree a token (decision 2026-10-01: conjured creatures are tokens) — its Hit Points and AC
// at the rank, Immobilized; the creatures in its square moved beside it; its grab on the cast and each Sustain the card's control (the caster's spell attack against
// the creature's Reflex DC, with the multiple attack penalty): Grabbed or Restrained until the end of the caster's next turn, Escape or Force Open at the spell DC; the
// tree that outlasts the spell a note.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES, named as withName } from "./text-patterns.js";

const CREATE = /^You create a ([a-z]+) in the designated area, and creatures in the area are immediately moved to an adjacent square of their choice they could occupy\.$/;
const STATS = /^The \1 is \[\[\/r (\d+) \+ \(@item\.level - (\d+)\) \*(\d+)\]\] feet high and has \[\[\/r (\d+) \+ \(@item\.level - \2\) \*(\d+)\]\] Hit Points, AC \[\[\/r (\d+) \+ \(@item\.level - \2\) \*(\d+)\]\], a reach of (\d+) feet, and is permanently @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Immobilized\}\.$/;
const ATTACK = /^When you first Cast the Spell and each time you Sustain the spell, you can attempt a spell attack roll against the (Fortitude|Reflex|Will) DC of a target within the \1['’]s reach\.$/;
const HOLD = /^If your spell attack roll is successful, the target is @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Grabbed\} by the \1 until the end of your next turn or @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Restrained\} if your spell attack roll was a critical success\.$/;
const FREE = /^(The creature grabbed or restrained by the \1 can attempt to \[\[\/act escape\]\] and other creatures can attempt to free the grabbed or restrained creature by attempting a \[\[\/act force-open\]\], using your spell DC for the DC of both checks\.)$/;
const MAP = /^(The \1 uses and contributes to your multiple attack penalty\.)$/;
const STEP = /^Heightened \(\+1\) The \1['’]s height increases by (\d+) feet, its Hit Points increases by (\d+), and its AC increases by (\d+)\.$/;

/** {tree, sentences} or null. */
export function extractEngulfingTree(item) {
    const area = item?.system?.area;
    if (area?.type !== "square" || !item.system?.duration?.sustained || !/^1 minute$/.test(String(item.system?.duration?.value ?? "").trim()) || !(item.system?.traits?.value ?? []).includes("attack")) return null;
    const [body, heightened = "", ...rest] = String(item.system?.description?.value ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim().replace(/’/g, "'"));
    const split = text => text.split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const first = split(paragraphs[0] ?? ""), second = split(paragraphs[1] ?? "");
    const create = CREATE.exec(first[1] ?? "");
    if (paragraphs.length !== 3 || first.length !== 3 || second.length !== 4 || NARRATION_RULES.test(first[0]) || !create) return null;
    const name = create[1];
    const stats = withName(STATS, name).exec(first[2] ?? ""), attack = withName(ATTACK, name).exec(second[0] ?? ""), hold = withName(HOLD, name).exec(second[1] ?? "");
    const free = withName(FREE, name).exec(second[2] ?? ""), map = withName(MAP, name).exec(second[3] ?? "");
    const step = withName(STEP, name).exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim().replace(/’/g, "'"));
    const baseRank = Number(item.system?.level?.value ?? 1);
    if (!stats || !attack || !hold || !free || !map || !step || Number(stats[2]) !== baseRank || Number(stats[3]) !== Number(step[1]) || Number(stats[5]) !== Number(step[2]) || Number(stats[7]) !== Number(step[3])) return null;
    return {
        tree: { name, size: Number(area.value), baseRank, height: { base: Number(stats[1]), add: Number(stats[3]) }, hp: { base: Number(stats[4]), add: Number(stats[5]) }, ac: { base: Number(stats[6]), add: Number(stats[7]) },
            reach: Number(stats[8]), immobilized: stats[9], defense: attack[1].toLowerCase(), grabbed: hold[1], restrained: hold[2], seconds: 60,
            notes: [free[1].replace(/\[\[\/act escape\]\]/, "Escape").replace(/\[\[\/act force-open\]\]/, "Force Open"), map[1], paragraphs[2]] },
        sentences: [first[1], first[2], ...second, paragraphs[2], htmlToPlainText(heightened).trim()]
    };
}

/** The tree's statistics at a rank. */
export function treeAt(tree, rank) {
    const steps = Math.max(0, Number(rank) - tree.baseRank);
    return { height: tree.height.base + steps * tree.height.add, hp: tree.hp.base + steps * tree.hp.add, ac: tree.ac.base + steps * tree.ac.add };
}
