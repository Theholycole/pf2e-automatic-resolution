// Special thralls the caster conjures (Recurring Nightmare, Living Graveyard, Skeletal Lancers, Perfected Thrall): each sentence of the text read whole, as the thralls'
// statistics (by the thrall rules — the user's, from the thrall trait, 2026-10-03), Thrall Charge's extra dice (a toggle on their Strike), notes, or a card control:
//   a save the GM starts for the creatures it reaches (a creature whose space the nightmare enters; the creatures around the graveyard as it appears);
//   more base thralls (the graveyard's five as it appears, five more on each Stride; four on the perfected thrall's critical hit);
//   the nightmare summoned again (once per round, on a Sustain); the lancers' 5 piercing to an enemy that Strikes near them.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK as C, SIZE_SLUGS as SIZES, WORD_NUMBERS_1_6 as WORDS } from "./text-patterns.js";

const count = text => WORDS[String(text).toLowerCase()] ?? Number(text);
const NARRATION = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|Strikes?|Speed)\b/i;

// Each reader: a sentence and what it sets on the read (r).
const READERS = [
    [/^You create an? ((?:Tiny|Small|Medium|Large|Huge|Gargantuan) )?thrall within range(?:, and you can create it in a space occupied by a creature)?\.$/, (r, m) => { r.count = 1; if (m[1]) r.size = SIZES[m[1].trim()]; }],
    [/^You create up to (\d+|one|two|three|four|five|six) thralls in different spaces within range\.$/, (r, m) => { r.count = count(m[1]); r.upTo = true; }],
    [/^You create a thrall that has (\d+) Hit Points and a Speed of (\d+) feet\.$/, (r, m) => { r.count = 1; r.hp = Number(m[1]); r.speed = Number(m[2]); }],
    [/^This thrall has (\d+) Hit Points and a Speed of (\d+) feet\.$/, (r, m) => { r.hp = Number(m[1]); r.speed = Number(m[2]); }],
    [/^The [a-z ]+ have a Speed of (\d+) feet\.$/, (r, m) => { r.speed = Number(m[1]); }],
    [/^The thrall has a fly Speed of (\d+) feet and remains airborne at the end of your turn even if it didn't Fly that turn\.$/, (r, m, s) => { r.fly = Number(m[1]); r.notes.push(s); }],
    [/^(?:The [a-z' ]+|Their) Strikes have a reach of (\d+) feet and deal ([a-z]+) damage\.$/, (r, m) => { r.reach = Number(m[1]); r.damageType = m[2]; }],
    [/^The thrall's Strikes deal ([a-z]+) damage and must target a creature in the thrall's space\.$/, (r, m, s) => { r.damageType = m[1]; r.notes.push(s); }],
    [/^When you use (?:@UUID\[[^\]]+\]\{Thrall Charge\}|Thrall Charge) to order (?:this thrall|the [a-z ]+|an? [a-z ]+) to (?:make a )?Strike, (?:that|the) Strike deals an additional (\d+)d(\d+) damage\.$/,
        (r, m) => { r.charge = { dice: Number(m[1]), faces: Number(m[2]) }; }],
    // Card controls.
    [new RegExp(String.raw`^If this thrall is summoned into or ends its movement in a creature's space, the creature must succeed at an? (Fortitude|Reflex|Will) saving throw or become ${C} \(or ${C} on a critical failure\); this is an? ([a-z, ]+) effect\.$`),
        (r, m, s) => r.controls.push({ kind: "save", label: "The thrall entered a creature's space: target it", statistic: m[1].toLowerCase(), failure: m.slice(2, 5), critical: m.slice(5, 8), traits: m[8].split(/,? and |, /).map(t => t.trim()), sourceText: s })],
    [new RegExp(String.raw`^All creatures in a @Template\[(?:type:)?emanation\|distance:(\d+)\] must succeed at an? (Fortitude|Reflex|Will) saving throw or fall ${C}\.$`),
        (r, m, s) => r.controls.push({ kind: "save", label: `It appears: target the creatures within ${m[1]} feet of it`, statistic: m[2].toLowerCase(), failure: m.slice(3, 6), critical: m.slice(3, 6), traits: [], sourceText: s })],
    [/^Additionally, (\w+) thralls \(using the base thrall statistics\) fall from their graves into empty spaces adjacent to the [a-z ]+\.$/, (r, m, s) => { r.appear = count(m[1]); r.notes.push(s); }],
    [/^Whenever this thrall Strides, it creates (\d+) thralls in empty spaces along the path it Strides\.$/, (r, m, s) => r.controls.push({ kind: "spawn", count: Number(m[1]), label: `It Strode: ${m[1]} thralls along its path`, sourceText: s })],
    [/^Whenever the [a-z ]+ critically hits a creature, you create up to (\d+) thralls, each of which must be adjacent to either the [a-z ]+ or the Strike's target\.$/,
        (r, m, s) => r.controls.push({ kind: "spawn", count: Number(m[1]), label: `It critically hit: up to ${m[1]} thralls beside it or the target`, sourceText: s })],
    [/^If the thrall has been destroyed, you can Sustain this spell to resummon the thrall\.$/, (r, m, s) => r.controls.push({ kind: "resummon", label: "Sustain: resummon the destroyed thrall (once per round)", sourceText: s })],
    [/^You can do this only once per round\.$/, (r, m, s) => { r.notes.push(s); }],
    [/^When an enemy makes a Strike while within (\d+) feet of an? [a-z ]+, the [a-z ]+ deals @Damage\[(\d+)\[([a-z]+)\]\] damage to it\.$/,
        (r, m, s) => r.controls.push({ kind: "damage", formula: `${m[2]}[${m[3]}]`, label: `An enemy Struck within ${m[1]} feet of one: target it (${m[2]} ${m[3]})`, sourceText: s })],
    // Notes (the GM's).
    [/^Unlike other thralls, the [a-z ]+ can share its space with other creatures, and other creatures can move through its space with ease\.$/, (r, m, s) => r.notes.push(s)],
    [/^Any ability you use that would make the thrall Stride allows it to Fly instead\.$/, (r, m, s) => r.notes.push(s)],
    [/^The enemy takes this damage only once per Strike, even if it's in the reach of multiple [a-z ]+\.$/, (r, m, s) => r.notes.push(s)],
    [/^When you command an? [a-z ]+ to Stride, you can have any number of your [a-z ]+ Stride instead of just one\.$/, (r, m, s) => r.notes.push(s)],
    [/^Whenever you use an ability that would destroy this thrall, it instead loses (\d+) Hit Points\.$/, (r, m, s) => r.notes.push(s)]
];
const STEP = /^Heightened \((\d+)(?:st|nd|rd|th)\) The additional damage increases to (\d+)d(\d+)\.$/;

/** {thrallSummon, claimed} or null. */
export function compileThrallSummon(adapted) {
    if ((adapted.damageComponents ?? []).length || !(adapted.activation?.traits ?? []).includes("thrall")) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const range = /^(\d+) feet$/.exec(String(adapted.targeting?.range ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").replace(/<\/?em>/g, "").split(/<hr\s*\/?>/i);
    if (!minutes || !range || rest.length) return null;
    const sentences = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].flatMap(match => match[1].replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/)).filter(Boolean);
    const r = { notes: [], controls: [] }, claimed = [];
    for (const [index, sentence] of sentences.entries()) {
        const reader = READERS.find(([pattern]) => pattern.test(sentence));
        if (reader) { reader[1](r, reader[0].exec(sentence), htmlToPlainText(sentence)); claimed.push(htmlToPlainText(sentence)); continue; }
        // (Narration: no rule words.)
        if (!NARRATION.test(htmlToPlainText(sentence).replace(/\bthralls?\b/g, "")) || (index < 3 && /^(?:You conjure|The [a-z ]+ is made of|It wields|The spirit inhabiting|When the [a-z ]+ appears, it violently shakes)\b/.test(sentence) && !/@|\d/.test(sentence))) continue;
        if (globalThis.process?.env?.THRALL_DEBUG) console.error("thrall-summon refused:", sentence);
        return null;
    }
    const plainStep = htmlToPlainText(heightened).replace(/\s+/g, " ").trim();
    const step = plainStep ? STEP.exec(plainStep) : null;
    if ((plainStep && !step) || !r.count || !r.charge || (step && Number(step[3]) !== r.charge.faces)) return null;
    // (The spell's own save statistic must be the one a save control names.)
    const saves = r.controls.filter(control => control.kind === "save");
    if (saves.length && (adapted.defense?.kind !== "save" || saves.some(control => control.statistic !== adapted.defense.statistic))) return null;
    if (!saves.length && (adapted.defense?.kind ?? "none") !== "none") return null;
    return { thrallSummon: { seconds: Number(minutes[1]) * 60, range: Number(range[1]), count: r.count, upTo: r.upTo === true, size: r.size ?? "med", hp: r.hp ?? null, speed: r.speed ?? null,
            fly: r.fly ?? null, reach: r.reach ?? null, damageType: r.damageType ?? null, charge: { ...r.charge, ...(step ? { from: Number(step[1]), dice: r.charge.dice, upDice: Number(step[2]) } : {}) },
            appear: r.appear ?? 0, controls: r.controls, notes: r.notes, baseRank: Number(adapted.rank) },
        claimed: [...claimed, ...(step ? [plainStep] : [])] };
}

/** Thrall Charge's extra dice at a cast rank. */
export function thrallChargeDice(data, castRank) {
    return data.charge.from && Number(castRank) >= data.charge.from ? data.charge.upDice : data.charge.dice;
}
