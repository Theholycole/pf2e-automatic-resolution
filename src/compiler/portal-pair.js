// Two linked portals only the caster (and those it designates) pass freely (Infiltrator's Tunnel): "You create two portals. One appears on a flat surface you can
// touch, and the other appears on a different flat surface in range that you can see." / "You can move through the portals as though they were adjacent to each other.
// Any other creature attempting to move through the portals must succeed at a Will saving throw or be teleported up to 30 feet away from their starting point to a
// random safe space determined by the GM." with "Heightened (6th) When you Cast the Spell, you can designate up to 5 other creatures to freely move between the
// portals." — the caster's Effect for the duration (the designated creatures from the heightened rank, the targets at the cast); the card's control for a creature
// moving through: free if designated, else its save against the spell DC (a failure: the GM's teleport); the portals' places the GM's.
import { htmlToPlainText } from "./description-parser.js";

const RULES = {
    create: /^You create two portals\.$/,
    place: /^One appears on a flat surface you can touch, and the other appears on a different flat surface in range that you can see\.$/,
    move: /^You can move through the portals as though they were adjacent to each other\.$/,
    others: /^Any other creature attempting to move through the portals must succeed at a (Will|Fortitude|Reflex) saving throw or be teleported up to (\d+) feet away from their starting point to a random safe space determined by the GM\.$/
};
const STEP = /^Heightened \((\d+)(?:st|nd|rd|th)\) When you Cast the Spell, you can designate up to (\d+) other creatures to freely move between the portals\.$/;

/** {portalPair, claimed} or null. */
export function compilePortalPair(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim()) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!minutes || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    const claimed = {};
    for (const [index, sentence] of sentences.entries()) {
        const key = Object.keys(RULES).find(name => !claimed[name] && RULES[name].test(sentence));
        if (key) { claimed[key] = RULES[key].exec(sentence); continue; }
        if (index <= 1 && !/\d|@|\b(?:damage|save|bonus|penalty)\b/.test(sentence)) continue;
        return null;
    }
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (Object.keys(claimed).length !== Object.keys(RULES).length || !step || claimed.others[1].toLowerCase() !== adapted.defense.statistic) return null;
    return { portalPair: { seconds: Number(minutes[1]) * 60, statistic: adapted.defense.statistic, teleportFeet: Number(claimed.others[2]), designate: { rank: Number(step[1]), count: Number(step[2]) },
            notes: [claimed.place[0]] },
        claimed: [...sentences, step[0]] };
}
