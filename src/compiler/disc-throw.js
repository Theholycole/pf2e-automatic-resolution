// A radiant diadem that throws discs of light (Diadem of Divine Radiance): "You don a diadem of radiant light, which sheds bright light to a range of 60 feet and dim
// light to a further 60 feet. When you Cast the Spell and when you Sustain it during the duration, you can draw a disc of spiraling light from the diadem and throw it
// at a creature within 120 feet. Make a ranged spell attack at mythic proficiency against the target's AC. This action has the attack and spirit traits. On a hit, you
// deal 4d8 spirit damage, 1d4 persistent spirit damage, and the target is {Dazzled} for 1 round (3 rounds on a critical hit). The persistent damage isn't doubled on a
// critical hit." / "If the disc passes through an area of magical darkness … counteract the darkness …" with "Heightened (+2) The disc's spirit damage increases by 2d8,
// and the persistent damage increases by 1d4." — PF2e's Effect (its light proved) on the caster; the card's throw (at the cast and on each Sustain): the caster's spell
// attack with its proficiency raised to mythic against the target's AC; a hit's damage at the cast rank (the persistent part not doubled) and Dazzled for the rounds;
// the darkness counteract the GM's.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_UUID_START as C, SPELL_EFFECT_LINK as LINK } from "./text-patterns.js";

const RULES = {
    light: /^You don a diadem of radiant light, which sheds bright light to a range of (\d+) feet and dim light to a further (\d+) feet\.$/,
    throw: /^When you Cast the Spell and when you Sustain it during the duration, you can draw a disc of spiraling light from the diadem and throw it at a creature within (\d+) feet\.$/,
    attack: /^Make a ranged spell attack at mythic proficiency against the target's AC\.$/,
    traits: /^This action has the ([a-z]+) and ([a-z]+) traits\.$/,
    hit: new RegExp(String.raw`^On a hit, you deal (\d+)d(\d+) ([a-z]+) damage, (\d+)d(\d+) persistent ([a-z]+) damage, and the target is ${C}Dazzled\} for (\d+) rounds? \((\d+) rounds on a critical hit\)\.$`),
    single: /^The persistent damage isn't doubled on a critical hit\.$/
};
const DARK = /^If the disc passes through an area of magical darkness or targets a creature affected by magical darkness, the disc's glow attempts to counteract the darkness using your ([A-Z][a-z]+) or ([A-Z][a-z]+) skill modifier as the counteract check modifier and half your level as the counteract rank\.$/;
const STEP = /^Heightened \(\+(\d)\) The disc's ([a-z]+) damage increases by (\d+)d(\d+), and the persistent damage increases by (\d+)d(\d+)\.$/;

/** {discThrow, claimed} or null; the catalog proves PF2e's Effect. */
export function compileDiscThrow(adapted, catalog) {
    if (String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!minutes || rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const link = paragraphs.map(paragraph => LINK.exec(paragraph)).find(Boolean);
    if (!link || paragraphs.length !== 3) return null;
    const sentences = paragraphs[0].split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    const claimed = {};
    for (const sentence of sentences) {
        const key = Object.keys(RULES).find(name => !claimed[name] && RULES[name].test(sentence));
        if (!key) return null;
        claimed[key] = RULES[key].exec(sentence);
    }
    const dark = DARK.exec(htmlToPlainText(paragraphs[1]).replace(/\s+/g, " ").trim());
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (Object.keys(claimed).length !== Object.keys(RULES).length || !dark || !step) return null;
    const hit = claimed.hit;
    if (step[2] !== hit[3] || step[4] !== hit[2] || step[6] !== hit[5]) return null;
    const entries = catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {});
    const effect = entries.find(entry => entry?.name === link[2]);
    const light = (effect?.mechanics?.rules ?? []).find(rule => rule.key === "TokenLight");
    if (!effect?.id || Number(light?.value?.bright) !== Number(claimed.light[1]) || Number(light?.value?.dim) !== Number(claimed.light[1]) + Number(claimed.light[2])) return null;
    return { discThrow: { seconds: Number(minutes[1]) * 60, effect: { uuid: `Compendium.pf2e.spell-effects.Item.${effect.id}`, name: effect.name }, range: Number(claimed.throw[1]),
            traits: [claimed.traits[1], claimed.traits[2]], damage: { dice: Number(hit[1]), faces: Number(hit[2]), type: hit[3] }, persistent: { dice: Number(hit[4]), faces: Number(hit[5]), type: hit[6] },
            dazzled: { uuid: hit[7], rounds: Number(hit[8]), criticalRounds: Number(hit[9]) }, step: { interval: Number(step[1]), dice: Number(step[3]), persistent: Number(step[5]) },
            notes: [htmlToPlainText(paragraphs[1]).replace(/\s+/g, " ").trim()] },
        claimed: [...sentences.map(sentence => htmlToPlainText(sentence)), htmlToPlainText(paragraphs[1]), step[0], link[0]] };
}

/** The disc's damage and persistent formulas at a cast rank. */
export function discThrowAt(data, castRank, baseRank) {
    const steps = Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.step.interval));
    return { damage: `${data.damage.dice + steps * data.step.dice}d${data.damage.faces}`, persistent: `${data.persistent.dice + steps * data.step.persistent}d${data.persistent.faces}` };
}
