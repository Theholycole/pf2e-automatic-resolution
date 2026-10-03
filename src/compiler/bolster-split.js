// Creatures of a kind the GM judges don't save; they get the spell's bonus instead (Lift Nature's Caul):
//   "Aberrations or worshippers of Outer Gods or Great Old Ones are bolstered by this vision of warped reality and gain a +1 status bonus
//   to Will saving throws and attack rolls for 1 minute, while all other creatures must attempt a Will saving throw." with one linked
//   Effect whose only rule is exactly that bonus, lasting that long.
// The card asks the GM, for each target, whether it's one of them: yes, no save and PF2e's Effect at Finalize; no, it saves.
import { htmlToPlainText } from "./description-parser.js";

const BOLSTER = /^([A-Z][A-Za-z ,']{3,150}?) are bolstered by [a-z' ]{3,80} and gain a \+(\d) (status|circumstance) bonus to ([A-Za-z ]+?) for (\d+) (minute|round)s?, while all other creatures must attempt an? (Fortitude|Reflex|Will) saving throw\.$/;
const STATISTICS = { "Will saving throws": "will", "Fortitude saving throws": "fortitude", "Reflex saving throws": "reflex", "saving throws": "saving-throw", "attack rolls": "attack-roll", "AC": "ac", "skill checks": "skill-check", "Perception checks": "perception" };
const LINK = /^@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}$/;

/** The Effect's only rule is exactly the bonus, lasting exactly that long. */
export function proveBolsterEffect(mechanics, claim) {
    const rules = mechanics?.rules ?? [], duration = mechanics?.duration ?? {};
    if (rules.length !== 1) return false;
    const [rule] = rules;
    // (Or a resistance to the stated types, heightened by its step, to the start of the caster's next turn: Call the Ten's shield.)
    if (claim?.kind === "resistance") {
        const types = Array.isArray(rule.type) ? rule.type : [rule.type];
        const formula = `${claim.value}+${claim.step.add}*floor((@item.level-${claim.step.baseRank})/${claim.step.interval})`;
        return rule.key === "Resistance" && Object.keys(rule).every(key => ["key", "type", "value"].includes(key)) && types.length === claim.types.length
            && claim.types.every(type => types.includes(type)) && String(rule.value).replace(/\s+/g, "") === formula
            && duration.value === 1 && duration.unit === "rounds" && duration.expiry === "turn-start" && !duration.sustained;
    }
    const selectors = Array.isArray(rule.selector) ? rule.selector : [rule.selector];
    return rule.key === "FlatModifier" && Object.keys(rule).every(key => ["key", "selector", "type", "value"].includes(key)) && rule.type === claim.type && rule.value === claim.value
        && selectors.length === claim.selectors.length && claim.selectors.every(selector => selectors.includes(selector))
        && duration.value === claim.duration.value && duration.unit === claim.duration.unit && !duration.sustained;
}

/** {bolster, sentences} or null. `links` are the spell's unscoped / on-use Effect links. */
export function compileBolsterSplit(adapted, links) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic) return null;
    const prefix = String(adapted.descriptionHTML ?? "").split(/<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0];
    const sentences = htmlToPlainText(prefix).split(/(?<=[.!?}])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const found = sentences.map(sentence => BOLSTER.exec(sentence)).filter(Boolean);
    if (found.length !== 1) return null;
    const [sentence, group, value, type, list, amount, unit, statistic] = found[0];
    if (statistic.toLowerCase() !== adapted.defense.statistic) return null;
    const names = list.split(/ and |, /);
    if (names.some(name => !STATISTICS[name])) return null;
    const claim = { value: Number(value), type, selectors: names.map(name => STATISTICS[name]), duration: { value: Number(amount), unit: `${unit}s` } };
    const linkSentences = sentences.filter(candidate => LINK.test(candidate));
    if (links.length !== 1 || linkSentences.length !== 1 || links[0].resolutionStatus !== "resolved" || !proveBolsterEffect(links[0].document?.mechanics, claim)) return null;
    return {
        bolster: { question: `Is this creature one of: ${group.charAt(0).toLowerCase()}${group.slice(1)}? If so, it doesn't save: it gains ${links[0].label ?? "the spell's Effect"}.`,
            uuid: links[0].uuid, label: links[0].label ?? null, document: links[0].document, claim, sourceText: sentence },
        sentences: [sentence, linkSentences[0]]
    };
}
