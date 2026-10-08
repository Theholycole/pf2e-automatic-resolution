// PF2e's Effect for a feral frenzy the targets can try to shake off (Moon Frenzy): "Targets gain 5 temporary Hit Points, a +10-foot status bonus to their Speeds,
// and weakness 5 to silver. They also grow vicious fangs and claws, which are unarmed attacks. The fangs deal 2d8 piercing damage; the claws deal 2d6 slashing
// damage and have the agile and finesse traits. … On a critical hit with one of these unarmed attacks, the creature struck takes 1d4 persistent bleed damage." /
// "The targets can't use concentrate actions unless those actions also have the rage trait, with the exception of {Seek}. A creature can attempt to end the
// spell's effect on itself by using a single action, which has the rage trait, to attempt a Will save against your spell DC; on a success, it ends the spell's
// effect on itself." / "If a target is in the light of a full moon, it also grows by one size …" with "Heightened (6th) The temporary Hit Points increase to 10,
// the silver weakness to 10, and the damage dealt by the attacks to three dice." and "(10th) … 20, … 20, … four dice." — PF2e's Effect on each target (its
// numbers proved against the text at every rank; its land Speed bonus made every Speed's, as the text says); the card's control for a target's Will save to end
// it on itself; the concentrate restriction a note.
import { htmlToPlainText } from "./description-parser.js";
import { SPELL_EFFECT_LINK as LINK, WORD_NUMBERS_2_5 as WORDS } from "./text-patterns.js";

const RULES = {
    gain: /^Targets gain (\d+) temporary Hit Points, a \+(\d+)-foot status bonus to their Speeds, and weakness (\d+) to ([a-z]+)\.$/,
    grow: /^They also grow vicious fangs and claws, which are unarmed attacks\.$/,
    attacks: /^The fangs deal (\d+)d(\d+) ([a-z]+) damage; the claws deal (\d+)d(\d+) ([a-z]+) damage and have the ([a-z]+) and ([a-z]+) traits\.$/,
    proficiency: /^The targets use their highest weapon or unarmed attack proficiency with these attacks, and if they have weapon specialization or greater weapon specialization, they add this damage as well\.$/,
    bleed: /^On a critical hit with one of these unarmed attacks, the creature struck takes (\d+)d(\d+) persistent bleed damage\.$/,
    restrict: /^The targets can't use concentrate actions unless those actions also have the rage trait, with the exception of (?:@UUID\[[^\]]+\]\{Seek\}|Seek)\.$/,
    end: /^A creature can attempt to end the spell's effect on itself by using a single action, which has the ([a-z]+) trait, to attempt a (Will|Fortitude|Reflex) save against your spell DC; on a success, it ends the spell's effect on itself\.$/,
    moon: /^If a target is in the light of a full moon, it also grows by one size if it were Medium or smaller\.$/,
    reach: /^This increases the reach of a Medium or Tiny creature by (\d+) feet\.$/
};
const STEP = /^Heightened \((\d+)(?:st|nd|rd|th)\) The temporary Hit Points increase to (\d+), the ([a-z]+) weakness to (\d+), and the damage dealt by the attacks to (two|three|four|five) dice\.$/;

/** {frenzy, claimed} or null; the catalog proves PF2e's Effect. */
export function compileFrenzy(adapted, catalog) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || !/^up to (\d+) willing creatures$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const html = String(adapted.descriptionHTML ?? "");
    const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const link = paragraphs.map(paragraph => LINK.exec(paragraph)).find(Boolean);
    if (!minutes || !link) return null;
    const body = paragraphs.filter(paragraph => !LINK.test(paragraph) && !/^<strong>Heightened/.test(paragraph));
    const steps = paragraphs.filter(paragraph => /^<strong>Heightened/.test(paragraph)).map(paragraph => STEP.exec(htmlToPlainText(paragraph).replace(/\s+/g, " ").trim()));
    const sentences = body.flatMap(paragraph => htmlToPlainText(paragraph).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/)).filter(Boolean);
    const claimed = {};
    for (const [index, sentence] of sentences.entries()) {
        const key = Object.keys(RULES).find(name => !claimed[name] && RULES[name].test(sentence));
        if (key) { claimed[key] = RULES[key].exec(sentence); continue; }
        if (index === 0 && !/\d|@|\b(?:damage|save|bonus|penalty)\b/.test(sentence)) continue;
        return null;
    }
    if (Object.keys(claimed).length !== Object.keys(RULES).length || !steps.length || steps.some(step => !step)) return null;
    const { gain, attacks, bleed, end, reach } = claimed;
    if (steps.some(step => step[3] !== gain[4])) return null;
    // The numbers at each rank: the text's base, then each Heightened entry's; PF2e's formulas must be exactly those.
    const formula = (base, pick) => { const sorted = steps.slice().sort((a, b) => Number(a[1]) - Number(b[1])); let out = String(base); for (const step of sorted) out = `ternary(gte(@item.level, ${step[1]}), ${pick(step)}, ${out})`; return out; };
    const tempHP = formula(gain[1], step => step[2]), weakness = formula(gain[3], step => step[4]), dice = formula(attacks[1], step => WORDS[step[5]]);
    if (attacks[1] !== attacks[4]) return null;
    const entries = catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {});
    const effect = entries.find(entry => entry?.name === link[2]);
    const rules = effect?.mechanics?.rules ?? [];
    const plain = rule => !(rule.predicate ?? []).some(term => typeof term === "string" && /beastkin/.test(term));
    const temp = rules.find(rule => rule.key === "TempHP" && plain(rule)), weak = rules.find(rule => rule.key === "Weakness" && plain(rule));
    const speed = rules.findIndex(rule => rule.key === "FlatModifier" && rule.selector === "land-speed");
    const strikes = rules.filter(rule => rule.key === "Strike");
    const fangs = strikes.find(rule => rule.damage?.base?.damageType === attacks[3]), claws = strikes.find(rule => rule.damage?.base?.damageType === attacks[6]);
    const bleedRule = rules.find(rule => rule.key === "DamageDice" && rule.damageType === "bleed");
    const size = rules.find(rule => rule.key === "CreatureSize");
    if (!effect?.id || String(temp?.value) !== tempHP || String(weak?.value) !== weakness || weak.type !== gain[4] || speed < 0 || rules[speed].type !== "status" || Number(rules[speed].value) !== Number(gain[2])
        || String(fangs?.damage?.base?.dice) !== dice || fangs.damage.base.die !== `d${attacks[2]}` || String(claws?.damage?.base?.dice) !== dice || claws.damage.base.die !== `d${attacks[5]}`
        || ![attacks[7], attacks[8]].every(trait => (claws.traits ?? []).includes(trait)) || bleedRule?.critical !== true || Number(bleedRule.diceNumber) !== Number(bleed[1]) || bleedRule.dieSize !== `d${bleed[2]}`
        || !rules.some(rule => rule.key === "RollOption" && rule.option === "terrain:full-moon") || Number(size?.reach?.add) !== Number(reach[1])) return null;
    return { frenzy: { seconds: Number(minutes[1]) * 60, maxTargets: Number(/^up to (\d+)/i.exec(adapted.targeting.target)[1]), effect: { uuid: `Compendium.pf2e.spell-effects.Item.${effect.id}`, name: effect.name },
            ruleOverrides: [{ index: speed, key: "FlatModifier", patch: { selector: "all-speeds" } }], end: { trait: end[1], statistic: end[2].toLowerCase() },
            // (The attacks' dice at the cast rank, written into PF2e's Strike rules: their formula isn't resolved at the Effect's level on every actor.)
            strikes: { indexes: [rules.indexOf(fangs), rules.indexOf(claws)], dice: [{ rank: 0, dice: Number(attacks[1]) }, ...steps.map(step => ({ rank: Number(step[1]), dice: WORDS[step[5]] }))].sort((a, b) => a.rank - b.rank) },
            notes: [claimed.restrict[0].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1"), "Switch on the Effect's full-moon option when the creature is in the light of a full moon."] },
        claimed: [...sentences, ...paragraphs.filter(paragraph => /^<strong>Heightened/.test(paragraph)).map(paragraph => htmlToPlainText(paragraph).replace(/\s+/g, " ").trim()), link[0]] };
}
