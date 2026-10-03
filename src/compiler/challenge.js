// A challenge that turns a foe's attention to the caster (Dutiful Challenge): "The target takes a -1 status penalty to attack rolls, damage rolls, and skill
// checks against creatures other than you, and you take a -1 status penalty to attack rolls, damage rolls, and skill checks against creatures other than the
// target." / "Each time a creature other than you uses a hostile action that affects the challenged enemy, the enemy can attempt a Will save. On a success, the
// enemy no longer takes the penalty against that creature. You can Dismiss the spell, and it ends automatically if you or the target is defeated." with
// "Heightened (+3) The status penalties increase by 1." — the caster's PF2e Effect (proved: its mark on the target and the penalty against any other); the
// target's Effect with the same penalty against all but the caster (PF2e's target signature); the card's control rolls the enemy's Will save when another
// creature's hostile action affects it, a success exempting that creature; either one defeated ends both.
import { htmlToPlainText } from "./description-parser.js";
import { ruleValueAt } from "./effect-note-proof.js";

const PENALTY = /^The target takes a [-–−](\d) (status) penalty to attack rolls, damage rolls, and skill checks against creatures other than you, and you take a [-–−]\1 \2 penalty to attack rolls, damage rolls, and skill checks against creatures other than the target\.$/;
const EXEMPT = [/^Each time a creature other than you uses a hostile action that affects the challenged enemy, the enemy can attempt a (Will|Fortitude|Reflex) save\.$/,
    /^On a success, the enemy no longer takes the penalty against that creature\.$/, /^You can Dismiss the spell, and it ends automatically if you or the target is defeated\.$/];
const STEP = /^Heightened \(\+(\d)\) The status penalties increase by (\d)\.$/;

/** {challenge, claimed} or null; `effect` is PF2e's linked Effect document. */
export function compileChallenge(adapted, effect) {
    if (!/^1 creature$/i.test(String(adapted.targeting?.target ?? "").trim()) || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").replace(/<p>\s*@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}\s*<\/p>/g, "").split(/<hr\s*\/?>/i);
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    const at = sentences.findIndex(sentence => PENALTY.test(sentence));
    if (!minutes || rest.some(section => section.trim()) || at < 0 || at > 1 || sentences.length !== at + 1 + EXEMPT.length || EXEMPT.some((pattern, index) => !pattern.test(sentences[at + 1 + index]))) return null;
    if (at === 1 && /\d|@|\b(?:damage|save|bonus|penalty)\b/.test(sentences[0])) return null;
    const [, value, type] = PENALTY.exec(sentences[at]), statistic = EXEMPT[0].exec(sentences[at + 1])[1].toLowerCase();
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (statistic !== adapted.defense?.statistic || (heightened.trim() && !step)) return null;
    // PF2e's Effect: the mark on the target, and the penalty to those rolls against any unmarked creature, scaling as the text says.
    const rules = effect?.mechanics?.rules ?? [];
    const mark = rules.find(rule => rule.key === "TokenMark" && typeof rule.slug === "string");
    const penalty = rules.find(rule => rule.key === "FlatModifier" && rule.type === type && JSON.stringify([rule.selector].flat().sort()) === '["attack-roll","damage","skill-check"]'
        && mark && JSON.stringify(rule.predicate) === JSON.stringify([{ not: `target:mark:${mark.slug}` }]));
    const baseRank = Number(adapted.rank) || 1;
    const at10 = rank => -(Number(value) + (step ? Math.floor((rank - baseRank) / Number(step[1])) * Number(step[2]) : 0));
    if (rules.length !== 2 || !mark || !penalty || Array.from({ length: 11 - baseRank }, (_, index) => baseRank + index).some(rank => ruleValueAt(penalty.value, rank) !== at10(rank))) return null;
    return { challenge: { type, value: Number(value), step: step ? { interval: Number(step[1]), add: Number(step[2]) } : null, statistic, seconds: Number(minutes[1]) * 60, markSlug: mark.slug },
        claimed: [...sentences, ...(step ? [step[0]] : [])] };
}

/** The penalty's size at a cast rank. */
export function challengePenalty(data, castRank, baseRank) {
    return data.value + (data.step ? Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.step.interval)) * data.step.add : 0);
}
