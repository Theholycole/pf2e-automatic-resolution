// A hunger to feast on the fallen (Ravening Maw): "The target becomes overwhelmed with cannibalistic hunger and can restore its vitality by feasting on the flesh of the
// fallen. On its turn, the target can use 2 actions (these actions have the manipulate trait) to cannibalize an adjacent {Dying} or dead creature. If the cannibalized
// creature is Dying, it dies. If the cannibalized creature is an ally of the target, the target regains 5d8 HP; otherwise, the target regains 5d4 HP. … Once
// cannibalized, a particular creature's body doesn't have enough meat to cannibalize again. During any round that there's a Dying or dead creature within 30 feet of the
// target, if the target can't or doesn't cannibalize a creature, the target takes 5d4 mental damage." with "Heightened (+1) The amount of HP restored by cannibalizing a
// creature increases by 1d8 for eating an ally and 1d4 otherwise, and the mental damage increases by 1d4." PF2e's data gives a Will save but the text no results:
// a failure (or critical failure) gives the whole effect for the duration, a success nothing (the user's ruling of 2026-10-03). The target's Effect with the card's
// controls: its cannibalizing (a Dying creature dies; the healing by whether it was an ally; each body once) and the round's mental damage (refused unless a Dying or
// dead creature is within the distance and it hasn't eaten this round).
import { htmlToPlainText } from "./description-parser.js";

const RULES = [
    [/^You evoke [^.]+ and inflict it upon your target\.$/, null],
    [/^The target becomes overwhelmed with cannibalistic hunger and can restore its vitality by feasting on the flesh of the fallen\.$/, null],
    [/^On its turn, the target can use (\d) actions \(these actions have the manipulate trait\) to cannibalize an adjacent (?:@UUID\[[^\]]+\]\{Dying\}|Dying) or dead creature\.$/, "actions"],
    [/^If the cannibalized creature is Dying, it dies\.$/, null],
    [/^If the cannibalized creature is an ally of the target, the target regains (\d+)d(\d+) HP; otherwise, the target regains (\d+)d(\d+) HP\.$/, "heal"],
    [/^Certain monsters \(such as those whose blood is acidic or magical\) might inflict additional effects on those who cannibalize them at the GM's discretion\.$/, "note"],
    [/^Once cannibalized, a particular creature's body doesn't have enough meat to cannibalize again\.$/, null],
    [/^During any round that there's a Dying or dead creature within (\d+) feet of the target, if the target can't or doesn't cannibalize a creature, the target takes (\d+)d(\d+) ([a-z]+) damage\.$/, "starve"]
];
const STEP = /^Heightened \(\+(\d)\) The amount of HP restored by cannibalizing a creature increases by (\d+)d(\d+) for eating an ally and (\d+)d(\d+) otherwise, and the ([a-z]+) damage increases by (\d+)d(\d+)\.$/;

/** {cannibalHunger, claimed} or null. */
export function compileCannibalHunger(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || (adapted.damageComponents ?? []).length || adapted.targeting?.area) return null;
    const rounds = /^(\d+) rounds?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!rounds || rest.length || /<strong>\s*(?:Critical Success|Success|Failure|Critical Failure)/.test(body)) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const found = {};
    const notes = [];
    for (const sentence of sentences) {
        const rule = RULES.find(([pattern], index) => !found[index] && pattern.test(sentence));
        if (!rule) return null;
        found[RULES.indexOf(rule)] = rule[0].exec(sentence);
        if (rule[1] === "note") notes.push(sentence);
    }
    const match = key => found[RULES.findIndex(rule => rule[1] === key)];
    const heal = match("heal"), starve = match("starve"), actions = match("actions");
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (Object.keys(found).length !== RULES.length || !heal || !starve || !actions || !step || step[6] !== starve[4] || step[3] !== heal[2] || step[5] !== heal[4] || step[8] !== starve[3]) return null;
    return { cannibalHunger: { statistic: adapted.defense.statistic, seconds: Number(rounds[1]) * 6, actions: Number(actions[1]), radius: Number(starve[1]),
            ally: { dice: Number(heal[1]), die: Number(heal[2]), step: Number(step[2]) }, other: { dice: Number(heal[3]), die: Number(heal[4]), step: Number(step[4]) },
            starve: { dice: Number(starve[2]), die: Number(starve[3]), type: starve[4], step: Number(step[7]) }, every: Number(step[1]), baseRank: Number(adapted.rank), notes,
            // (No results in the text: the user's ruling.)
            degrees: { criticalSuccess: false, success: false, failure: true, criticalFailure: true } },
        claimed: [...sentences, step[0]] };
}
