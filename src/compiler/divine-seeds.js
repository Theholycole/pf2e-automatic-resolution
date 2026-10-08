// Seeds that sprout into bushes (Seeds of Divinity): "You create 4 seeds of negligible Bulk which appear in one of your open hands, or immediately in 4 squares adjacent to
// you when you Cast the Spell. You can Release a seed into an adjacent square or Interact to throw the seed at a space within 10 feet. When a seed comes in contact with the
// ground, it sprouts into a small bush which occupies a 5-foot square and provides concealment. Each bush has (rank − 1) × 10 + 10 Hit Points and 10 + 2 × rank AC." /
// "After 1 round has passed since a bush has sprouted, you can Sustain the spell to force a bush to grow, becoming your choice of hazardous or bountiful …" with
// "Hazardous The bush becomes hazardous terrain in addition to providing concealment, dealing 2 piercing and poison damage to creatures each time they move through its
// space." / "Bountiful The bush produces a single fruit which grants creatures that consume it a status bonus to damage equal to your maximum cursebound value and 4 + 2 ×
// (rank − 1) temporary Hit Points. These effects last for the duration …" and "Heightened (+1) The Hit Points of the bushes increases by 10 and their AC increases by 2.
// The temporary Hit Points, piercing, and poison damage each increase by 2.": the bushes tokens (decision 2026-10-01) where the seeds land; the Sustain's control growing
// one a round old — its square hazardous terrain (each creature entering it takes the piercing and poison damage), or a fruit that a creature eats for the temporary Hit
// Points and the damage bonus until the spell ends; the bushes' concealment a note.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const LEAD = [/^You create (\d) seeds of negligible Bulk which appear in one of your open hands, or immediately in \1 squares adjacent to you when you Cast the Spell\.$/,
    /^You can Release a seed into an adjacent square or Interact to throw the seed at a space within (\d+) feet\.$/,
    /^When a seed comes in contact with the ground, it sprouts into a small bush which occupies a 5-foot square and provides concealment\.$/,
    /^Each bush has \[\[\/r \(@item\.level - 1\) \* (\d+) \+ (\d+)\]\] Hit Points and \[\[\/r (\d+) \+ (\d+) \* @item\.level\]\] AC\.$/];
const GROW = /^After (\d) round has passed since a bush has sprouted, you can Sustain the spell to force a bush to grow, becoming your choice of hazardous or bountiful when you do, and once a bush has been grown in this way it cannot be selected again\.$/;
const HAZARD = /^Hazardous The bush becomes hazardous terrain in addition to providing concealment, dealing (\d+) ([a-z]+) and ([a-z]+) damage to creatures each time they move through its space\.$/;
const FRUIT = /^Bountiful The bush produces a single fruit which grants creatures that consume it a status bonus to damage equal to your maximum cursebound value and \[\[\/r (\d+) \+ (\d+) \* \(@item\.level -1\)\]\] temporary Hit Points\. These effects last for the duration and fruit produced by the bush decomposes into nothing after the duration has elapsed\. A creature can harvest and consume a fruit from a bush as a single Interact action\.(?: @UUID\[[^\]]+\]\{[^}]+\})?$/;
const STEP = /^Heightened \(\+1\) The Hit Points of the bushes increases by (\d+) and their AC increases by (\d+)\. The temporary Hit Points, piercing, and poison damage each increase by (\d+)\.$/;

/** {seeds, sentences} or null. */
export function extractDivineSeeds(item) {
    if (!item?.system?.duration?.sustained || !/^1 minute$/.test(String(item.system?.duration?.value ?? "").trim()) || item.system?.defense) return null;
    const [body, heightened = "", ...rest] = String(item.system?.description?.value ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    const lead = (paragraphs[0] ?? "").split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const found = LEAD.map((pattern, index) => pattern.exec(lead[index + 1] ?? "")), grow = GROW.exec(paragraphs[1] ?? ""), hazard = HAZARD.exec(paragraphs[2] ?? ""), fruit = FRUIT.exec(paragraphs[3] ?? "");
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 4 || lead.length !== LEAD.length + 1 || NARRATION_RULES.test(lead[0]) || found.some(match => !match) || !grow || !hazard || !fruit || !step) return null;
    const stats = found[3], rank = Number(item.system?.level?.value ?? 1);
    if (Number(stats[1]) !== Number(step[1]) || Number(stats[4]) !== Number(step[2]) || Number(fruit[2]) !== Number(step[3])) return null;
    const components = Object.values(item.system?.damage ?? {});
    if (components.length !== 2 || components.some(component => Number(component.formula) !== Number(hazard[1])) || [hazard[2], hazard[3]].some(type => !components.some(component => component.type === type))) return null;
    return {
        seeds: { count: Number(found[0][1]), throwFeet: Number(found[1][1]), baseRank: rank, hp: { base: Number(stats[1]) * (rank - 1) + Number(stats[2]), add: Number(stats[1]) }, ac: { base: Number(stats[3]) + Number(stats[4]) * rank, add: Number(stats[4]) },
            growAfterSeconds: Number(grow[1]) * 6, hazard: { damage: Number(hazard[1]), types: [hazard[2], hazard[3]], add: Number(step[3]) }, fruit: { tempHP: Number(fruit[1]), add: Number(step[3]) }, seconds: 60,
            notes: ["Each bush occupies a 5-foot square and provides concealment."] },
        sentences: [...lead.slice(1), paragraphs[1], paragraphs[2], paragraphs[3], htmlToPlainText(heightened).trim()]
    };
}

/** The bushes and the growth at a rank. */
export function seedsAt(seeds, rank) {
    const steps = Math.max(0, Number(rank) - seeds.baseRank);
    return { hp: seeds.hp.base + steps * seeds.hp.add, ac: seeds.ac.base + steps * seeds.ac.add, damage: seeds.hazard.damage + steps * seeds.hazard.add, tempHP: seeds.fruit.tempHP + steps * seeds.fruit.add };
}
