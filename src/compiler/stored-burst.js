// Resistance that stores what it prevents, released as a burst (Reflective Scales): "When you cast this spell, choose acid, cold, fire, electricity, or
// poison damage. You gain resistance 5 against that type of damage. …" / "The scales store up energy as they protect you. Keep track of how much damage the
// scales have prevented. As a 2-action activity that has the concentrate and manipulate traits, you can explode your scales outward in a 20-foot emanation,
// dealing 1d6 damage of the chosen type to all creatures in the area for every 10 damage the scales have prevented, to a maximum of 10d6 damage (after
// preventing 100 damage). Each creature in the area must attempt a basic Reflex save. Once you do so, the spell ends." with "Heightened (+2) The resistance
// increases by 5, and the maximum damage from the scale explosion increases by 5d6."
// The caster's Effect (the type picked) with the resistance at the cast rank; the module counts the damage it prevents (each damage of that type: the
// resistance or the type's damage, whichever is less); the card's Explode posts the basic save of the dice the store gives (the targeted creatures in the
// emanation) and ends the spell.
import { htmlToPlainText } from "./description-parser.js";

const CHOOSE = /^When you cast this spell, choose ((?:[a-z]+, )+[a-z]+,? or [a-z]+) damage\.$/;
const RESIST = /^You gain resistance (\d+) against that type of damage\.$/;
const STORE = [/^The scales store up energy as they protect you\.$/, /^Keep track of how much damage the scales have prevented\.$/];
const EXPLODE = /^As a 2-action activity that has the concentrate and manipulate traits, you can explode your scales outward in an? @Template\[type:emanation\|distance:(\d+)\], dealing 1d(\d+) damage of the chosen type to all creatures in the area for every (\d+) damage the scales have prevented, to a maximum of (\d+)d\2 damage \(after preventing \d+ damage\)\.$/;
const SAVE = /^Each creature in the area must attempt a basic (Reflex|Fortitude|Will) save\.$/;
const ENDS = /^Once you do so, the spell ends\.$/;
const STEP = /^Heightened \(\+(\d)\) The resistance increases by (\d+), and the maximum damage from the scale explosion increases by (\d+)d(\d+)\.$/;

/** {storedBurst, claimed} or null. */
export function compileStoredBurst(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim()) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = sentences.findIndex(sentence => CHOOSE.test(sentence));
    const step = STEP.exec(htmlToPlainText(rest.join(" ")).replace(/\s+/g, " ").trim());
    if (!minutes || at < 1 || !step || sentences.length !== at + 8) return null;
    const choose = CHOOSE.exec(sentences[at]), resist = RESIST.exec(sentences[at + 1]), explode = EXPLODE.exec(sentences[at + 5]), save = SAVE.exec(sentences[at + 6]);
    // (Sentence at + 2 is the colour of the scales: narration.)
    if (!resist || /\d|\b(?:damage|resistance|save)\b/i.test(sentences[at + 2].replace(/damage type you chose|fire damage/g, "")) && !/^The scales' color depends on the damage type you chose/.test(sentences[at + 2])) return null;
    if (!STORE[0].test(sentences[at + 3]) || !STORE[1].test(sentences[at + 4]) || !explode || !save || !ENDS.test(sentences[at + 7]) || step[4] !== explode[2]) return null;
    const types = choose[1].replace(/,? or /, ", ").split(/,\s*/).map(type => type.trim());
    return { storedBurst: { types, seconds: Number(minutes[1]) * 60, resistance: { base: Number(resist[1]), step: Number(step[2]), interval: Number(step[1]) }, radius: Number(explode[1]),
        die: Number(explode[2]), every: Number(explode[3]), max: { base: Number(explode[4]), step: Number(step[3]), interval: Number(step[1]) }, statistic: save[1].toLowerCase() },
        claimed: [...sentences.slice(at), step[0]] };
}

/** The resistance and the dice cap at a cast rank. */
export function storedBurstAt(data, castRank, baseRank) {
    const steps = Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.resistance.interval));
    return { resistance: data.resistance.base + steps * data.resistance.step, maxDice: data.max.base + steps * data.max.step };
}

// Resistance against one triggering effect that stores what it prevents, released as a spell attack (Bottle the Storm): "Trigger You would take
// electricity damage." / "You gain electricity resistance 10 against the triggering effect." / "If you successfully prevent damage in this way, at any
// time during the spell's duration, you can spend a single action, which has the attack trait, to expend the charge and make a spell attack against
// the AC of a target within 60 feet." / "This attack deals electricity damage equal to the damage prevented by bottle the storm." / "If you Cast bottle
// the storm a second time before the original duration elapses, or if you do not make this attack within 1 minute, the stored charge dissipates
// harmlessly." with "Heightened (7th) The resistance increases to 15, and you can immediately make the spell attack … as part of the reaction …" and
// (10th) 20: the caster's Effect with the resistance at the cast rank for the triggering damage only (the module counts what it prevented, then
// drops the resistance); the card's Release is the spell attack for that much damage (double on a critical hit); a new casting dissipates the old charge.
const CHARGE = {
    trigger: /^Trigger You would take ([a-z]+) damage\.$/,
    resist: /^You gain ([a-z]+) resistance (\d+) against the triggering effect\.$/,
    release: /^If you successfully prevent damage in this way, at any time during the spell's duration, you can spend a single action, which has the attack trait, to expend the charge and make a spell attack against the AC of a target within (\d+) feet\.$/,
    damage: /^This attack deals ([a-z]+) damage equal to the damage prevented by [a-z ]+\.$/,
    dissipates: /^If you Cast [a-z ]+ a second time before the original duration elapses, or if you do not make this attack within (\d+) minutes?, the stored charge dissipates harmlessly\.$/,
    step: /^Heightened \((\d+)(?:st|nd|rd|th)\) The resistance increases to (\d+), and you can immediately make the spell attack granted by [a-z ]+ as part of the reaction used to Cast the Spell\.$/
};
/** {storedCharge, claimed} or null. */
export function compileStoredCharge(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim()) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [trigger, body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    const plain = html => htmlToPlainText(html ?? "").replace(/\s+/g, " ").trim();
    const triggered = CHARGE.trigger.exec(plain(trigger));
    const sentences = plain(body).split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = sentences.findIndex(sentence => CHARGE.resist.test(sentence));
    if (!minutes || !triggered || at < 0 || sentences.length !== at + 4 || (at > 1) || (at === 1 && /\d|@|\b(?:damage|resistance|save|attack)\b/i.test(sentences[0]))) return null;
    const resist = CHARGE.resist.exec(sentences[at]), release = CHARGE.release.exec(sentences[at + 1]), damage = CHARGE.damage.exec(sentences[at + 2]), gone = CHARGE.dissipates.exec(sentences[at + 3]);
    if (!resist || !release || !damage || !gone || resist[1] !== triggered[1] || damage[1] !== triggered[1] || Number(gone[1]) * 60 !== Number(minutes[1]) * 60) return null;
    const steps = [...rest.join(" ").matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => plain(match[1])).filter(text => /^Heightened/.test(text)).map(text => CHARGE.step.exec(text));
    if (steps.some(step => !step)) return null;
    return { storedCharge: { type: triggered[1], seconds: Number(minutes[1]) * 60, range: Number(release[1]),
            resistance: { base: Number(resist[2]), fixed: steps.map(step => ({ rank: Number(step[1]), value: Number(step[2]) })) },
            immediateFrom: steps.length ? Math.min(...steps.map(step => Number(step[1]))) : null },
        claimed: [plain(trigger), ...sentences, ...steps.map(step => step[0])] };
}

/** The resistance at a cast rank (the highest fixed entry reached). */
export function storedChargeResistance(data, castRank) {
    return [...data.resistance.fixed].sort((left, right) => left.rank - right.rank).filter(entry => Number(castRank) >= entry.rank).at(-1)?.value ?? data.resistance.base;
}
