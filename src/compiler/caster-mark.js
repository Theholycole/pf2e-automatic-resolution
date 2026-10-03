// A caster's bonus against a target while that target has the spell's persistent damage (Savor the Sting):
//   "As long as the target is taking persistent damage from this spell, you gain a +1 status bonus to attack rolls and skill
//   checks against the target."
// with PF2e's Effect holding exactly a TokenMark and one FlatModifier predicated on that mark and on the target's persistent
// damage of the rows' type. The Effect goes on the caster for each target whose row deals that persistent damage, its TokenMark
// bound to that target's token; PF2e turns the bonus on and off with the persistent damage.
import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";

const STATISTICS = { "attack rolls": "attack-roll", "skill checks": "skill-check", "damage rolls": "damage", "saving throws": "saving-throw", "Perception checks": "perception" };
const LIST = String.raw`(?:attack rolls|skill checks|damage rolls|saving throws|Perception checks)`;
const MARK_CLAIM = new RegExp(String.raw`^As long as the target is taking persistent damage from this spell, you gain a \+([1-4]) (status|circumstance) bonus to (${LIST}(?:(?:, and |, | and )${LIST})*) against the target\.$`);

/** The claim's bonus: {value, type, selectors}, or null. */
export function parseCasterMarkClaim(sentence) {
    const match = MARK_CLAIM.exec(String(sentence ?? ""));
    if (!match) return null;
    const selectors = match[3].split(/, and |, | and /).map(name => STATISTICS[name]);
    if (new Set(selectors).size !== selectors.length) return null;
    return { value: Number(match[1]), type: match[2], selectors };
}

const sameSet = (left, right) => Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every(entry => right.includes(entry));

/** The Effect's rules give exactly the claim against a marked target with persistent damage of that type: {slug} or null. */
export function proveCasterMark(mechanics, claimText, damageType) {
    const claim = parseCasterMarkClaim(claimText);
    const rules = mechanics?.rules ?? [];
    if (!claim || rules.length !== 2 || !/^[a-z]+$/.test(damageType ?? "")) return null;
    const mark = rules.find(rule => rule?.key === "TokenMark");
    const modifier = rules.find(rule => rule?.key === "FlatModifier");
    if (!mark || !modifier || Object.keys(mark).some(key => !["key", "slug"].includes(key)) || !/^[a-z0-9-]+$/.test(mark.slug ?? "")) return null;
    if (Object.keys(modifier).some(key => !["key", "predicate", "selector", "type", "value"].includes(key))) return null;
    const selectors = Array.isArray(modifier.selector) ? modifier.selector : [modifier.selector];
    if (modifier.type !== claim.type || modifier.value !== claim.value || !sameSet(selectors, claim.selectors)
        || !sameSet(modifier.predicate, [`target:condition:persistent-damage:${damageType}`, `target:mark:${mark.slug}`])) return null;
    return { slug: mark.slug };
}

function persistentTypes(outcome) {
    const formulas = outcome?.damage?.mode === "mixed" ? outcome.damage.formulas ?? [] : [];
    return formulas.map(entry => /\[persistent,([a-z]+)\]$/.exec(entry.formula ?? "")?.[1]).filter(Boolean);
}

/**
 * The claim sentence and the one linked Effect of a degree save whose rows deal persistent damage: {casterMark, sentence} or null.
 * `linked` is the one outcome Effect the compile placed in a row.
 */
export function compileCasterMark(adapted, plan, linked) {
    if (plan.resolution?.kind !== "save" || plan.resolution.check?.basic !== false || !linked?.document?.mechanics || typeof linked.uuid !== "string") return null;
    const sentences = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML).split(/<hr\b/i, 1)[0]).replace(/\s+/g, " ").trim()
        .split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim());
    const claims = sentences.filter(sentence => /^As long as the target is taking persistent damage from this spell\b/.test(sentence));
    if (claims.length !== 1) return null;
    const outcomes = plan.resolution.outcomes ?? {};
    const degrees = Object.keys(outcomes).filter(degree => persistentTypes(outcomes[degree]).length);
    const types = [...new Set(degrees.flatMap(degree => persistentTypes(outcomes[degree])))];
    if (!degrees.length || types.length !== 1) return null;
    const proof = proveCasterMark(linked.document.mechanics, claims[0], types[0]);
    if (!proof) return null;
    return {
        sentence: claims[0],
        casterMark: { uuid: linked.uuid, label: linked.label ?? linked.document.name ?? null, document: linked.document, claimText: claims[0],
            slug: proof.slug, damageType: types[0], degrees }
    };
}
