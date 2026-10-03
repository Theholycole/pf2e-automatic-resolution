// A basic save whose damage cuts through its own type's protection (Flame Strike): "Because the flame is infused with divine
// energy, creatures in the area apply only half their usual fire resistance." and "Creatures that are immune to fire, instead of
// gaining the usual benefit of immunity, treat the results of their saving throws as one degree of success better.": half the
// creature's resistance to that type, and a creature immune to it takes the damage (untyped) with its result one degree better.
// Both sentences must be present and name the spell's one damage type.
import { htmlToPlainText } from "./description-parser.js";

const HALF = /^(?:[A-Z][^.]*?, )?creatures in the area apply only half their usual ([a-z]+) resistance\.$/;
const IMMUNE = /^Creatures that are immune to ([a-z]+), instead of gaining the usual benefit of immunity, treat the results of their saving throws as one degree of success better\.$/;
const BETTER = { criticalSuccess: "criticalSuccess", success: "criticalSuccess", failure: "success", criticalFailure: "failure" };

/** `sentences`: the description's plain sentences. Returns null unless both are there for the spell's one damage type. */
export function compileResistanceHalving(sentences, damageComponents) {
    const plain = sentences.map(sentence => htmlToPlainText(sentence).trim());
    const half = plain.map(text => [text, HALF.exec(text)]).filter(([, match]) => match);
    const immune = plain.map(text => [text, IMMUNE.exec(text)]).filter(([, match]) => match);
    const components = damageComponents ?? [];
    if (half.length !== 1 || immune.length !== 1 || components.length !== 1) return null;
    const type = String(components[0].type ?? "").toLowerCase();
    if (half[0][1][1] !== type || immune[0][1][1] !== type || components[0].category) return null;
    return {
        halving: { type, sourceText: half[0][0] },
        degreeAdjustment: { predicate: { kind: "immunity-any", immunities: [type] }, map: { ...BETTER }, sourceText: immune[0][0] },
        sentences: [half[0][0], immune[0][0]]
    };
}
