// A sustained duplicate that Strides and blasts fire (Ember Doppelgänger): "… It has AC 10; 50 Hit Points; is immune to critical hits, precision damage, and the
// {Immobilized}, {Prone}, and {Restrained} conditions; and has weakness 10 to cold and water. This creature doesn't provide or benefit from flanking and automatically
// fails all skill checks and saving throws, and all skill checks attempted against it automatically succeed. When you Cast the Spell and the first time you Sustain it
// each turn on subsequent rounds, the duplicate Strides up to 30 feet and launches a blast of fire in a @Template[type:burst|distance:10] up to 30 feet away. Each
// creature in the burst takes 6d6 fire damage with a basic Reflex saving throw, using your spell DC." with "Heightened (+1) The duplicate has an additional 10 Hit
// Points, and the damage increases by 1d6." — the duplicate a token with its statistics at the cast rank (its 0 HP ending the spell), removed with the caster's
// sustained Effect; the card's blast (the cast and each turn's first Sustain): the targeted creatures' basic save card (a compiled plan of the damage at the rank).
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_START as C } from "./text-patterns.js";

const STATS = new RegExp(String.raw`^It has AC (\d+); (\d+) Hit Points; is immune to critical hits, precision damage, and the ${C}(Immobilized)\}, ${C}(Prone)\}, and ${C}(Restrained)\} conditions; and has weakness (\d+) to ([a-z]+) and ([a-z]+)\.$`);
const FAILS = /^This creature doesn't provide or benefit from flanking and automatically fails all skill checks and saving throws, and all skill checks attempted against it automatically succeed\.$/;
const BLAST = /^When you Cast the Spell and the first time you Sustain it each turn on subsequent rounds, the duplicate Strides up to (\d+) feet and launches a blast of fire in a @Template\[type:burst\|distance:(\d+)\] up to (\d+) feet away\.$/;
const DAMAGE = /^Each creature in the burst takes (\d+)d(\d+) ([a-z]+) damage with a basic (Reflex|Fortitude|Will) saving throw, using your spell DC\.$/;
const STEP = /^Heightened \(\+1\) The duplicate has an additional (\d+) Hit Points, and the damage increases by (\d+)d(\d+)\.$/;

/** {emberDouble, claimed} or null. */
export function compileEmberDouble(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.lifecycle?.sustained !== true) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!minutes || rest.length) return null;
    const sentences = body.replace(/<\/?p>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (sentences.length !== 6 || sentences.slice(0, 2).some(sentence => /\d|@|\b(?:damage|save|bonus|penalty)\b/.test(htmlToPlainText(sentence)))) return null;
    const stats = STATS.exec(sentences[2]), blast = BLAST.exec(sentences[4]), damage = DAMAGE.exec(sentences[5]);
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!stats || !FAILS.test(sentences[3]) || !blast || !damage || !step || step[3] !== damage[2] || damage[4].toLowerCase() !== adapted.defense.statistic) return null;
    const [entry, ...others] = adapted.damageComponents ?? [];
    if (others.length || String(entry?.formula ?? "").replace(/\s+/g, "") !== `${damage[1]}d${damage[2]}` || entry.type !== damage[3]) return null;
    return { emberDouble: { seconds: Number(minutes[1]) * 60, ac: Number(stats[1]), hp: Number(stats[2]), immune: ["critical-hits", "precision", ...[stats[3], stats[4], stats[5]].map(name => name.toLowerCase())],
            weakness: { value: Number(stats[6]), types: [stats[7], stats[8]] }, stride: Number(blast[1]), burst: Number(blast[2]), reach: Number(blast[3]),
            damage: { dice: Number(damage[1]), faces: Number(damage[2]), type: damage[3], statistic: damage[4].toLowerCase() }, step: { hp: Number(step[1]), dice: Number(step[2]) },
            notes: [htmlToPlainText(sentences[3])] },
        claimed: [...sentences.map(sentence => htmlToPlainText(sentence)), step[0]] };
}
