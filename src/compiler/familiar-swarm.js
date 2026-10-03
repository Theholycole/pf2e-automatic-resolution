// A familiar turned swarm (Sudden Swarm): "… While in its swarm form, your familiar gains immunity to precision damage and to the grappled, Prone, and
// Restrained conditions; weakness 4 to area and splash damage; and resistance 4 to piercing and slashing damage. It occupies the space of a Large creature and
// can occupy the same space as other creatures. If your familiar is reduced to 0 Hit Points while under the effect of this spell, the spell immediately ends,
// and your familiar is instead reduced to 1 Hit Point. Once per turn, your familiar can use the Swarming Bites action." / "Swarming Bites [one-action] Each
// creature in the familiar swarm's space takes 3d6 damage of the appropriate type (basic Reflex save). …" / "Upon Casting this spell, you immediately Command
// your familiar. …" with "Heightened (+1) The damage of Swarming Bites increases by 1d6, and all resistances and weaknesses increase by 1."
// The familiar's Effect for the duration (sustained) with the immunities, weaknesses and resistances at the cast rank and a Large size; Swarming Bites the
// card's control (once per turn): the item's basic Reflex save for the targeted creatures in its space (the type the GM's: piercing by default).
import { htmlToPlainText } from "./description-parser.js";

const FORM = /^While in its swarm form, your familiar gains immunity to precision damage and to the grappled, (?:@UUID\[[^\]]+\]\{Prone\}|Prone), and (?:@UUID\[[^\]]+\]\{Restrained\}|Restrained) conditions; weakness (\d+) to area and splash damage; and resistance (\d+) to piercing and slashing damage\.$/;
const SPACE = /^It occupies the space of a (Large) creature and can occupy the same space as other creatures\.$/;
const ZERO = /^If your familiar is reduced to 0 Hit Points while under the effect of this spell, the spell immediately ends, and your familiar is instead reduced to 1 Hit Point\.$/;
const ONCE = /^Once per turn, your familiar can use the Swarming Bites action\.$/;
const BITES = /^Swarming Bites 1 Each creature in the familiar swarm's space takes @Damage\[(\d+d\d+)\[untyped\]\] damage of the appropriate type \(basic (Reflex) save\)\. Usually this is piercing damage, but depending on your familiar, it can be bludgeoning or slashing at the GM's discretion\.$/;
const COMMAND = /^Upon Casting this spell, you immediately Command your familiar\. The first time each round you Sustain this spell on subsequent turns, you Command your familiar as part of the same action\.$/;
const STEP = /^Heightened \(\+1\) The damage of Swarming Bites increases by (\d+d\d+), and all resistances and weaknesses increase by (\d+)\.$/;

/** {familiarSwarm, claimed} or null. */
export function compileFamiliarSwarm(adapted) {
    if (!/^your familiar$/i.test(String(adapted.targeting?.target ?? "").trim()) || adapted.lifecycle?.sustained !== true) return null;
    const components = adapted.damageComponents ?? [];
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1].replace(/<span[^>]*>(\d)<\/span>/g, "$1")).replace(/\s+/g, " ").trim());
    const lead = (paragraphs[0] ?? "").split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const at = lead.findIndex(sentence => FORM.test(sentence));
    const step = STEP.exec(htmlToPlainText(rest.join(" ")).replace(/\s+/g, " ").trim());
    const bites = BITES.exec(paragraphs[1] ?? "");
    if (!minutes || paragraphs.length !== 3 || at < 0 || lead.length !== at + 4 || !SPACE.test(lead[at + 1]) || !ZERO.test(lead[at + 2]) || !ONCE.test(lead[at + 3]) || !bites || !COMMAND.test(paragraphs[2]) || !step) return null;
    if (lead.slice(0, at).some(sentence => /\d|@|\b(?:damage|saves?|bonus|penalty|immun|resist|weak)/i.test(sentence))) return null;
    if (components.length !== 1 || String(components[0].formula).replace(/\s+/g, "") !== bites[1] || adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== 1
        || adapted.heightening.damage?.[components[0].id] !== step[1]) return null;
    const [, weakness, resistance] = FORM.exec(lead[at]);
    return { familiarSwarm: { seconds: Number(minutes[1]) * 60, weakness: Number(weakness), resistance: Number(resistance), step: Number(step[2]), size: "lg", statistic: bites[2].toLowerCase(),
        types: ["piercing", "bludgeoning", "slashing"], notes: [lead[at + 2], "It can occupy the same space as other creatures.", paragraphs[2]] }, claimed: [...lead.slice(at), paragraphs[1], paragraphs[2], step[0]] };
}

/** The familiar's rules at a cast rank. */
export function familiarSwarmRules(data, castRank, baseRank) {
    const extra = Math.max(0, Number(castRank) - Number(baseRank)) * data.step;
    return [{ key: "Immunity", type: "precision" }, ...["grappled", "prone", "restrained"].map(type => ({ key: "Immunity", type })),
        { key: "Weakness", type: "area-damage", value: data.weakness + extra }, { key: "Weakness", type: "splash-damage", value: data.weakness + extra },
        { key: "Resistance", type: "piercing", value: data.resistance + extra }, { key: "Resistance", type: "slashing", value: data.resistance + extra },
        { key: "CreatureSize", value: "large" }];
}
