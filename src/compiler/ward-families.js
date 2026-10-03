// Note-only spells that ward against attacks (Sanctuary, Protector Tree).
import { plainText as plain, splitSentences as split } from "./description-parser.js";


// Sanctuary: "Creatures attempting to attack the target must attempt a Will save each time. If the target uses a hostile action, the spell ends."
// with the degree table (critical success: the spell ends; success: it can attack the target this turn; failure: the action is wasted and no
// more attacks on the target this turn; critical failure: wasted, and no attacks on the target for the rest of the spell) — the warded Effect;
// each attack on the target rolls the attacker's Will save against the spell DC and applies its row (the card tells the GM to void a wasted
// attack); the target's own attack ends the spell.
const WARD = /^Creatures attempting to attack the target must attempt a (Fortitude|Reflex|Will) save each time\.$/;
const HOSTILE_ENDS = /^If the target uses a hostile action, the spell ends\.$/;
export function compileAttackWard(adapted) {
    if (adapted.defense?.kind !== "none" && adapted.defense?.kind !== undefined) return null;
    if (!/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, ...extra] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!minutes || !table || extra.length) return null;
    const sentences = split(plain(body));
    const at = sentences.findIndex(sentence => WARD.test(sentence));
    if (at < 0 || sentences.length !== at + 2 || !HOSTILE_ENDS.test(sentences[at + 1]) || sentences.slice(0, at).some(sentence => /\d|@|\b(?:damage|bonus|penalty)\b/i.test(sentence))) return null;
    const rows = plain(table.replace(/<\/?em>/g, ""));
    const expected = [/Critical Success [A-Za-z' ]+ ends\./, /Success The creature can attempt its attack and any other attacks against the target this turn\./,
        /Failure The creature can't attack the target and wastes the action\. It can't attempt further attacks against the target this turn\./,
        /Critical Failure The creature wastes the action and can't attempt to attack the target for the rest of [a-z' ]+duration\./];
    if (!expected.every(pattern => pattern.test(rows))) return null;
    return { attackWard: { save: WARD.exec(sentences[at])[1].toLowerCase(), durationSeconds: Number(minutes[1]) * 60, endsOnHostile: true,
        rows: { criticalSuccess: "ends", success: "may-attack-this-turn", failure: "wasted-this-turn", criticalFailure: "barred" } }, claimed: [...sentences, rows] };
}

// Protector Tree: "A Medium tree suddenly grows in an unoccupied square within range. The tree has AC 10 and 10 Hit Points. Whenever an ally
// adjacent to the tree is hit by a Strike, the tree interposes its branches and takes the damage first. Any additional damage beyond what it
// takes to reduce the tree to 0 Hit Points is dealt to the original target." with "Heightened (+1) The tree has an additional 10 Hit Points." —
// a 5-foot square placed for the duration holds the tree's Hit Points; Strike damage to an ally adjacent to it is taken from the tree first
// (the ally's Hit Points restored by that much); at 0 the tree is gone. Its AC (if attacked), movement and staying as a tree are notes.
const TREE = [/^A Medium tree suddenly grows in an unoccupied square within range\.$/, /^The tree has AC (\d+) and (\d+) Hit Points\.$/,
    /^Whenever an ally adjacent to the tree is hit by a Strike, the tree interposes its branches and takes the damage first\.$/,
    /^Any additional damage beyond what it takes to reduce the tree to 0 Hit Points is dealt to the original target\.$/];
export function compileStrikeAbsorber(adapted) {
    if (String(adapted.targeting?.target ?? "").trim() || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = split(plain(body));
    if (!minutes || TREE.some((pattern, index) => !pattern.test(sentences[index] ?? ""))) return null;
    const notes = sentences.slice(TREE.length);
    if (notes.some(sentence => /\b(?:damage|bonus|penalty|saves?|Hit Points)\b/i.test(sentence))) return null;
    const step = rest.length ? /^Heightened \(\+(\d+)\) The tree has an additional (\d+) Hit Points\.$/.exec(plain(rest.join(" "))) : null;
    if (rest.length && !step) return null;
    const [, ac, hp] = TREE[1].exec(sentences[1]);
    return { strikeAbsorber: { ac: Number(ac), hp: Number(hp), step: step ? { interval: Number(step[1]), hp: Number(step[2]) } : null, durationSeconds: Number(minutes[1]) * 60,
        size: 5, notes: [`The tree has AC ${ac}; attacks on it are the GM's.`, ...notes] }, claimed: [...sentences, ...rest.map(plain)] };
}

/** The tree's Hit Points at a cast rank. */
export function absorberHp(data, castRank, baseRank = 1) {
    return data.hp + (data.step ? Math.floor(Math.max(0, castRank - baseRank) / data.step.interval) * data.step.hp : 0);
}

/** Whether a damage roll's options are a Strike's (a weapon or creature attack, not a spell). */
export function isStrikeDamage(options) {
    const set = new Set(options ?? []);
    if (set.has("item:type:spell")) return false;
    return set.has("action:strike") || set.has("item:type:weapon") || set.has("item:type:melee");
}
