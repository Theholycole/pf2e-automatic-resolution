// Areas that grow when sustained.
//   Awaken Entropy: "Any creature that enters or begins its turn in the area takes 8d6 void damage with a basic Fortitude save, or 8d6 force damage if the
//   creature normally doesn't take void damage, such as if the creature is a construct or undead." / "The first time you Sustain the Spell on each subsequent
//   turn, … The radius of the burst increases by 10 feet (to a maximum of 40 feet), and the size of the damage dice increases by one step (from d6 to
//   @Damage[(2+@item.rank)d8[void]], then to …d10…, and finally to …d12…)." — the lingering basic-save burst (entering, starting a turn), its void part force
//   for a creature void doesn't affect (PF2e's own reading), the region growing on each Sustain up to the maximum, and the dice stepping to the next listed
//   formula each time. Narration (no rule words) is set aside.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|until)\b/i;
const ENTROPY = /^Any creature that enters or begins its turn in the area takes (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save, or \1 ([a-z]+) damage if the creature normally doesn't take \2 damage, such as if the creature is a construct or undead\.$/;
const STRONGER = /^The first time you Sustain the Spell on each subsequent turn, the [a-z ]+ grows stronger in addition to having its duration increased\.$/;
const GROWS = /^The radius of the burst increases by (\d+) feet \(to a maximum of (\d+) feet\), and the size of the damage dice increases by one step \(from d(\d+) to @Damage\[([^\]]+\])(?:\|[^\]]*)?\], then to @Damage\[([^\]]+\])(?:\|[^\]]*)?\], and finally to @Damage\[([^\]]+\])(?:\|[^\]]*)?\]\)\.$/;
const STEP = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The damage increases by (\d+)d(\d+)\.\s*<\/p>$/;

/** {html, growth, damageSwap, sentences} or null. */
export function rewriteGrowingEntropy(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area?.type !== "burst" || adapted.lifecycle?.sustained !== true) return null;
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const sentences = body.replace(/<\/?p>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?)])\s+(?=[A-Z@])/).filter(Boolean);
    const plain = sentences.map(sentence => htmlToPlainText(sentence).replace(/\s+/g, " ").trim());
    const at = plain.findIndex(sentence => ENTROPY.test(sentence)), stronger = plain.findIndex(sentence => STRONGER.test(sentence));
    const grows = sentences.map(sentence => GROWS.exec(sentence)).find(Boolean);
    if (at < 0 || stronger < 0 || !grows) return null;
    const entropy = ENTROPY.exec(plain[at]);
    const components = adapted.damageComponents ?? [];
    if (entropy[3].toLowerCase() !== adapted.defense.statistic || components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== entropy[1]
        || String(components[0].type).toLowerCase() !== entropy[2]) return null;
    // (Each step is the spell's dice count at the cast rank with the next die, of the same type.)
    const formulas = [grows[4], grows[5], grows[6]].map(formula => formula.replace(/\s+/g, ""));
    const faces = formulas.map(formula => /^\(2\+@item\.rank\)d(\d+)\[([a-z]+)\]$/.exec(formula));
    if (faces.some(face => !face || face[2] !== entropy[2]) || `d${grows[3]}` !== `d${/d(\d+)$/.exec(entropy[1])[1]}`) return null;
    // ("8d6" is (2+rank)d6 at the spell's rank; the Heightened step adds one die each rank.)
    const step = heightened ? STEP.exec(heightened) : null;
    if (Number(/^(\d+)d/.exec(entropy[1])[1]) !== 2 + Number(adapted.rank) || (heightened && !(step && step[1] === "1" && step[2] === "1" && step[3] === grows[3]))) return null;
    // Everything else is narration.
    const claimed = new Set([at, stronger, sentences.findIndex(sentence => GROWS.test(sentence))]);
    if (plain.some((sentence, index) => !claimed.has(index) && NARRATION_RULES.test(sentence.replace(/\bworn away by entropy\b/, "")))) return null;
    return {
        html: `<p>A creature that enters the burst or starts its turn inside the burst takes ${entropy[1]} ${entropy[2]} damage with a basic ${entropy[3]} saving throw.</p>${heightened ? `<hr />${heightened}` : ""}`,
        growth: { feet: Number(grows[1]), optional: false, maximum: Number(grows[2]), dieSteps: formulas, sourceText: htmlToPlainText(sentences.find(sentence => GROWS.test(sentence))).trim() },
        damageSwap: { from: entropy[2], to: entropy[4], when: "not-affected", sourceText: plain[at] },
        sentences: plain
    };
}

// Roses' Thorns: "The rose bushes deal 8d8 piercing damage to each creature that's in the area when the spell is cast or that ends its turn in the area (basic
// Reflex save). A creature that critically fails its saving throw also takes @Damage[(ternary(gte(@item.rank,9),2,1))d8[persistent,bleed]] damage and is {Immobilized}
// for 1 round or until the creature {Escapes} (against your spell DC), whichever comes first. The area is difficult terrain and hazardous terrain. A creature that
// moves through the area takes @Damage[(ternary(gte(@item.rank,9),8,5))[piercing]] damage for every square of that area it moves into. Each time you sustain this
// spell, the radius of the burst increases by 5 feet." — the lingering basic-save burst (when cast, ending a turn inside), the critical failure's persistent
// bleed and Immobilized (Escape), the region's difficult terrain, the per-square hazard as the GM's control (5, or 8 from the rank the formula names), and the
// region growing on each Sustain. The Heightened entry is PF2e's own (its damage at the rank) and the formulas' ternaries.
const THORNS = /^The [a-z ]+ deal (\d+d\d+) ([a-z]+) damage to each creature that's in the area when the spell is cast or that ends its turn in the area \(basic (Fortitude|Reflex|Will) save\)\.$/;
const THORNS_CRIT = /^A creature that critically fails its saving throw also takes @Damage\[(\(ternary\(gte\(@item\.rank,\d+\),\d+,\d+\)\)d\d+\[persistent,[a-z]+\])\] damage and is (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Immobilized\}) for 1 round or until the creature (?:@UUID\[[^\]]+\]\{Escapes\}|Escapes) \(against your spell DC\), whichever comes first\.$/;
const THORNS_TERRAIN = /^The area is difficult terrain and hazardous terrain\.$/;
const THORNS_SQUARE = /^A creature that moves through the area takes @Damage\[\(ternary\(gte\(@item\.rank,(\d+)\),(\d+),(\d+)\)\)\[([a-z]+)\]\] damage for every square of that area it moves into\.$/;
const THORNS_GROW = /^Each time you sustain this spell, the radius of the burst increases by (\d+) feet\.$/;
export function rewriteGrowingThorns(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area?.type !== "burst" || adapted.lifecycle?.sustained !== true) return null;
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const sentences = body.replace(/<\/?p>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?)])\s+(?=[A-Z@])/).filter(Boolean);
    const plain = sentences.map(sentence => htmlToPlainText(sentence).replace(/\s+/g, " ").trim());
    const at = plain.findIndex(sentence => THORNS.test(sentence));
    if (at < 0 || sentences.length !== at + 5 || (at === 1 && NARRATION_RULES.test(plain[0])) || at > 1) return null;
    const deals = THORNS.exec(plain[at]), crit = THORNS_CRIT.exec(sentences[at + 1]), square = THORNS_SQUARE.exec(sentences[at + 3]), grow = THORNS_GROW.exec(plain[at + 4]);
    const components = adapted.damageComponents ?? [];
    if (!deals || !crit || !THORNS_TERRAIN.test(plain[at + 2]) || !square || !grow || deals[3].toLowerCase() !== adapted.defense.statistic || components.length !== 1 || components[0].category
        || String(components[0].formula).replace(/\s+/g, "") !== deals[1] || String(components[0].type).toLowerCase() !== deals[2]) return null;
    // (Its Heightened entry restates the rank the formulas switch at.)
    if (heightened && !new RegExp(String.raw`^<p>\s*<strong>\s*Heightened \(${square[1]}(?:st|nd|rd|th)\)\s*</strong>`).test(heightened)) return null;
    return {
        html: `<p>A creature that's in the area when it's created or ends its turn in the area takes ${deals[1]} ${deals[2]} damage with a basic ${deals[3]} saving throw. A creature that critically fails its saving throw is also ${crit[2]} for 1 round or until it Escapes. The area is difficult terrain.</p>`,
        growth: { feet: Number(grow[1]), optional: false, sourceText: plain[at + 4] },
        hazardMove: { text: true, formula: square[3], type: square[4], fixed: { rank: Number(square[1]), value: Number(square[2]) }, sourceText: [plain[at + 2], plain[at + 3]] },
        persistent: { formula: crit[1], sourceText: plain[at + 1] },
        sentences: [...plain, ...(heightened ? [htmlToPlainText(heightened).trim()] : [])]
    };
}

// Voracious Gestalt: "When you Cast the Spell, the gestalt deals 14d6 void damage to all living creatures of your choice in the area, with a basic Fortitude
// save. Creatures you choose that end their turns in the area take @Damage[(@item.level -3)d6[void]] damage, with a basic Fortitude save." / "At the end of
// each of your turns, if you killed a living creature during that turn or if the gestalt's damage killed a creature since the end of your last turn, you add
// the slain creature's soul to the gestalt. The emanation's radius increases by 20 feet and the damage dealt by the aura increases by 1d6. (Note that this
// increase only happens once, …) As normal for determining threat level, the GM determines if a creature is of significant enough threat …" — the caster's
// lingering emanation (cast, ending a turn inside), its turn damage of its own formula, the creatures the caster chooses (living ones) the GM's review,
// and the soul the GM's control: once a round, +20 feet and +1d6 to the turn damage. The Heightened entry is PF2e's (16d6) and the formula's (7d6 at 10th).
const GESTALT_CAST = /^When you Cast the Spell, the [a-z]+ deals (\d+d\d+) ([a-z]+) damage to all living creatures of your choice in the area, with a basic (Fortitude|Reflex|Will) save\.$/;
const GESTALT_TURN = /^Creatures you choose that end their turns in the area take @Damage\[\(@item\.level ?-(\d+)\)d(\d+)\[([a-z]+)\]\] damage, with a basic (Fortitude|Reflex|Will) save\.$/;
const GESTALT_SOUL = /^At the end of each of your turns, if you killed a living creature during that turn or if the [a-z]+'s damage killed a creature since the end of your last turn, you add the slain creature's soul to the [a-z]+\.$/;
const GESTALT_GROW = /^The emanation's radius increases by (\d+) feet and the damage dealt by the aura increases by 1d(\d+)\.$/;
const GESTALT_ONCE = /^\(Note that this increase only happens once, even if you killed multiple living creatures that turn\.\)$/;
const GESTALT_THREAT = /^As normal for determining threat level, the GM determines if a creature is of significant enough threat to empower the [a-z]+; in general, a creature several levels below you rarely poses a significant threat\.$/;
const GESTALT_STEP = /^Heightened \((\d+)(?:st|nd|rd|th)\) The initial damage increases to (\d+d\d+) and the aura's damage starts at (\d+)d(\d+) ([a-z]+) damage\.$/;
export function rewriteGrowingGestalt(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area?.type !== "emanation" || adapted.lifecycle?.sustained !== true) return null;
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const sentences = body.replace(/<\/?p>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?)])\s+(?=[A-Z@(])/).filter(Boolean);
    const plain = sentences.map(sentence => htmlToPlainText(sentence).replace(/\s+/g, " ").trim());
    if (sentences.length !== 7 || NARRATION_RULES.test(plain[0])) return null;
    const cast = GESTALT_CAST.exec(plain[1]), turn = GESTALT_TURN.exec(sentences[2]), grow = GESTALT_GROW.exec(plain[4]);
    const components = adapted.damageComponents ?? [];
    if (!cast || !turn || !GESTALT_SOUL.test(plain[3]) || !grow || !GESTALT_ONCE.test(plain[5]) || !GESTALT_THREAT.test(plain[6])) return null;
    const statistic = adapted.defense.statistic;
    if (cast[3].toLowerCase() !== statistic || turn[4].toLowerCase() !== statistic || turn[3] !== cast[2] || grow[2] !== turn[2] || components.length !== 1 || components[0].category
        || String(components[0].formula).replace(/\s+/g, "") !== cast[1] || String(components[0].type).toLowerCase() !== cast[2]) return null;
    const plainStep = htmlToPlainText(heightened).replace(/\s+/g, " ").trim();
    const step = plainStep ? GESTALT_STEP.exec(plainStep) : null;
    if (plainStep && !(step && Number(step[3]) === Number(step[1]) - Number(turn[1]) && step[4] === turn[2] && step[5] === turn[3])) return null;
    return {
        html: `<p>A creature other than you that's in the area when you Cast the Spell or ends its turn in the area takes ${cast[1]} ${cast[2]} damage with a basic ${cast[3]} save.</p>`,
        turnDamage: { formula: `(@item.level-${turn[1]})d${turn[2]}[${turn[3]}]`, offset: -Number(turn[1]), faces: Number(turn[2]), type: turn[3], sourceText: plain[2] },
        soulGrowth: { feet: Number(grow[1]), dice: 1, faces: Number(grow[2]), sourceText: `${plain[3]} ${plain[4]} ${plain[5]}` },
        notes: ["Only living creatures the caster chooses take the damage: leave the others out when you review the targets.", plain[6]],
        sentences: [...plain, ...(plainStep ? [plainStep] : [])]
    };
}
