// Lingering areas the general reader (lingering-area-compiler.js) doesn't take, each read whole by its own sentences.
import { htmlToPlainText } from "./description-parser.js";

const RULE_WORDS = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const sentencesOf = html => htmlToPlainText(html).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
const minutesOf = adapted => { const match = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim()); return match ? Number(match[1]) * 60 : null; };

// A fiery whirlwind moved on each Sustain (Flame Vortex): "<strong>Area</strong> 5-foot radius, 40-foot tall cylinder" / "You combine a blazing inferno and air currents
// into a fiery vortex. You can Cast this Spell only if you're outside or the ceiling is 40 feet or higher. All squares in the vortex are difficult terrain for flying
// creatures." / "All creatures in the area take 3d4 bludgeoning damage and 3d6 fire damage as gusts of fiery wind buffet them, with a basic Reflex save. Each time you
// Sustain the Spell, you can move the whirlwind up to 20 feet in a straight line. Each creature the whirlwind moves through takes the damage with a basic Reflex save.
// A creature can take damage from a flame vortex only once per round." — a placed cylinder: the save when cast and, after the GM moves it on a Sustain, for the
// creatures in it; those it moved through the GM's control; once per round; difficult terrain for flying creatures.
const VORTEX = {
    area: /^<p>\s*<strong>Area<\/strong>\s*(\d+)-foot radius, (\d+)-foot tall cylinder\s*<\/p>$/,
    ceiling: /^You can Cast this Spell only if you're outside or the ceiling is (\d+) feet or higher\.$/,
    flyers: /^All squares in the [a-z]+ are difficult terrain for flying creatures\.$/,
    deals: /^All creatures in the area take (.+?) as [^,]+, with a basic (Fortitude|Reflex|Will) save\.$/,
    move: /^Each time you Sustain the Spell, you can move the [a-z]+ up to (\d+) feet in a straight line\.$/,
    through: /^Each creature the [a-z]+ moves through takes the damage with a basic (Fortitude|Reflex|Will) save\.$/,
    once: /^A creature can take damage from an? [a-z ]+ only once per round\.$/
};
function compileVortex(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "save" || !adapted.defense.basic || area?.type !== "cylinder" || adapted.lifecycle?.sustained !== true) return null;
    const seconds = minutesOf(adapted);
    const [lead, body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(part => part.trim());
    const shape = VORTEX.area.exec(lead);
    if (!seconds || !shape || !body || Number(shape[1]) !== Number(area.value) || rest.length > 1) return null;
    const sentences = sentencesOf(body);
    const keys = ["ceiling", "flyers", "deals", "move", "through", "once"];
    if (sentences.length !== keys.length + 1 || RULE_WORDS.test(sentences[0]) || keys.some((key, index) => !VORTEX[key].test(sentences[index + 1]))) return null;
    const deals = VORTEX.deals.exec(sentences[3]), through = VORTEX.through.exec(sentences[5]);
    const items = deals[1].split(/,? and |, /).map(item => /^(\d+d\d+) ([a-z]+) damage$/.exec(item.trim()));
    const components = adapted.damageComponents ?? [];
    if (items.some(item => !item) || items.length !== components.length || deals[2].toLowerCase() !== adapted.defense.statistic || through[1].toLowerCase() !== adapted.defense.statistic
        || !components.every(component => items.some(item => item[1] === String(component.formula).replace(/\s+/g, "") && item[2] === String(component.type).toLowerCase()))) return null;
    const claimed = sentences.slice(1);
    return {
        lingering: { events: ["sustain"], initial: true, oncePerRound: true, excludeCaster: false, enemiesOnly: false, area: { type: "cylinder", value: Number(area.value) }, centre: "placed",
            durationSeconds: seconds, sustained: true, concealment: false, moveOnSustain: true, terrain: { difficulty: 2, movement: ["fly"], hazardous: false },
            gmAction: { actions: ["vortex"], label: "was moved through by the vortex", sourceText: sentences[5] },
            notes: [`The cylinder is ${shape[2]} feet tall. ${sentences[1]}`, `Each time you Sustain it, move the region up to ${VORTEX.move.exec(sentences[4])[1]} feet in a straight line first; the creatures in it then save, and those it moved through use the area's control (each once per round).`],
            sourceText: claimed },
        // (The area paragraph read: its radius and height.)
        areaParagraph: true, claimedSentences: claimed
    };
}

// A burst of music made on the cast and each first Sustain of a round, moved anywhere in range (Phantom Orchestra): "When you Cast the Spell, a captured breath of
// ephemeral music explodes in a great crescendo, appearing in a space you choose within range. On subsequent rounds, the first time you Sustain the Spell each round, you
// can move your conjured melody to a space within range (if needed) and create another explosion of music." / "Each explosion of sound from the phantom orchestra deals
// 8d6 sonic damage to all creatures in a 10-foot burst (basic Fortitude save). The phantom orchestra doesn't take up space, grant flanking, or have any other attributes a
// creature would." — a placed burst: the save when cast and on each Sustain (the GM moves the region first).
const ORCHESTRA = {
    cast: /^When you Cast the Spell, [^,]+ explodes in [^,]+, appearing in a space you choose within range\.$/,
    sustain: /^On subsequent rounds, the first time you Sustain the Spell each round, you can move your [a-z ]+ to a space within range \(if needed\) and create another explosion of [a-z ]+\.$/,
    deals: /^Each explosion of [a-z ]+ deals (\d+d\d+) ([a-z]+) damage to all creatures in an? (\d+)-foot burst \(basic (Fortitude|Reflex|Will) save\)\.$/,
    inert: /^The [a-z ]+ doesn't take up space, grant flanking, or have any other attributes a creature would\.$/
};
function compileOrchestra(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "save" || !adapted.defense.basic || area?.type !== "burst" || adapted.lifecycle?.sustained !== true) return null;
    const seconds = minutesOf(adapted);
    const [body] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = sentencesOf(body);
    const at = sentences.findIndex(sentence => ORCHESTRA.cast.test(sentence));
    if (!seconds || at < 1 || sentences.length !== at + 4 || sentences.slice(0, at).some(sentence => RULE_WORDS.test(sentence)) || !ORCHESTRA.sustain.test(sentences[at + 1])
        || !ORCHESTRA.inert.test(sentences[at + 3])) return null;
    const deals = ORCHESTRA.deals.exec(sentences[at + 2]);
    const components = adapted.damageComponents ?? [];
    if (!deals || Number(deals[3]) !== Number(area.value) || deals[4].toLowerCase() !== adapted.defense.statistic || components.length !== 1
        || String(components[0].formula).replace(/\s+/g, "") !== deals[1] || String(components[0].type).toLowerCase() !== deals[2]) return null;
    const claimed = sentences.slice(at);
    return {
        lingering: { events: ["sustain"], initial: true, oncePerRound: false, excludeCaster: false, enemiesOnly: false, area: { type: "burst", value: Number(area.value) }, centre: "placed",
            durationSeconds: seconds, sustained: true, concealment: false, moveOnSustain: true,
            notes: ["The first time you Sustain it each round, move the burst's region to a space within range (if needed) first; the creatures in it then save.", sentences[at + 3]],
            sourceText: claimed },
        claimedSentences: claimed
    };
}

// Tears in space that bite the living (Devouring Void): "Countless tears in space appear in the area, like hungry mouths. When the spell is cast and the first time each round
// it's sustained, living creatures in its area take 7d8 void damage (basic Fortitude save). A living creature using a move action to leave the area must succeed at a
// @Check[reflex] save or their action is disrupted at the edge of the area." — a placed area: the save for living creatures when cast and on each Sustain; leaving the
// GM's reminder (its Reflex save from the card's link).
const VOID = {
    cast: /^When the spell is cast and the first time each round it's sustained, living creatures in its area take (\d+d\d+) ([a-z]+) damage \(basic (Fortitude|Reflex|Will) save\)\.$/,
    leave: /^A living creature using a move action to leave the area must succeed at a @Check\[(fortitude|reflex|will)\] save or their action is disrupted at the edge of the area\.$/
};
function compileLivingTears(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "save" || !adapted.defense.basic || !area || adapted.lifecycle?.sustained !== true) return null;
    const seconds = minutesOf(adapted);
    const [body] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const raw = body.replace(/<\/?p>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const sentences = raw.map(sentence => htmlToPlainText(sentence));
    const cast = VOID.cast.exec(sentences[1] ?? ""), leave = VOID.leave.exec(raw[2] ?? "");
    const components = adapted.damageComponents ?? [];
    if (!seconds || raw.length !== 3 || RULE_WORDS.test(sentences[0]) || !cast || !leave || cast[3].toLowerCase() !== adapted.defense.statistic || components.length !== 1
        || String(components[0].formula).replace(/\s+/g, "") !== cast[1] || String(components[0].type).toLowerCase() !== cast[2]) return null;
    return {
        lingering: { events: ["sustain"], initial: true, oncePerRound: false, excludeCaster: false, enemiesOnly: false, area: { type: area.type, value: Number(area.value) }, centre: "placed",
            durationSeconds: seconds, sustained: true, concealment: false, livingOnly: true,
            notes: [`Only living creatures are affected. A living creature using a move action to leave the area attempts a ${leave[1][0].toUpperCase()}${leave[1].slice(1)} save (the spell DC); on a failure its action is disrupted at the edge of the area.`],
            sourceText: [sentences[1], sentences[2]] },
        livingOnly: true, claimedSentences: [sentences[1], sentences[2]]
    };
}

// A vortex that grows or moves on each Sustain, hurting those it moves through (Hungry Depths): "All creatures in the area take 4d8 piercing damage plus 4d4 void
// damage (basic Reflex save). Each time you Sustain the spell, you can increase the vortex's radius by 5 feet, to a maximum of 15 feet, or you can move the vortex up
// to 10 feet in a straight line. Each creature the vortex moves through takes the damage with a basic Reflex save. A creature can take damage from hungry depths only
// once per round." / "If cast underwater, hungry depths instead fills a 40-foot-tall cylinder with a 5-foot radius." — a placed burst: the save when cast; those it
// moves through the GM's control (once per round each); growing it and the underwater shape the GM's (notes).
const DEPTHS = {
    deals: /^All creatures in the area take (\d+d\d+) ([a-z]+) damage plus (\d+d\d+) ([a-z]+) damage \(basic (Fortitude|Reflex|Will) save\)\.$/,
    sustain: /^Each time you Sustain the spell, you can increase the [a-z]+'s radius by (\d+) feet, to a maximum of (\d+) feet, or you can move the [a-z]+ up to (\d+) feet in a straight line\.$/,
    through: /^Each creature the [a-z]+ moves through takes the damage with a basic (Fortitude|Reflex|Will) save\.$/,
    once: /^A creature can take damage from [a-z ]+ only once per round\.$/,
    underwater: /^If cast underwater, [a-z ]+ instead fills an? (\d+)-foot-tall cylinder with an? (\d+)-foot radius\.$/
};
function compileDepths(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "save" || !adapted.defense.basic || area?.type !== "burst" || adapted.lifecycle?.sustained !== true) return null;
    const seconds = minutesOf(adapted);
    const [body] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => sentencesOf(match[1]));
    if (!seconds || paragraphs.length !== 3 || paragraphs[0].some(sentence => RULE_WORDS.test(sentence)) || paragraphs[1].length !== 4 || paragraphs[2].length !== 1) return null;
    const [dealsText, sustainText, throughText, onceText] = paragraphs[1];
    const deals = DEPTHS.deals.exec(dealsText), sustain = DEPTHS.sustain.exec(sustainText), through = DEPTHS.through.exec(throughText), underwater = DEPTHS.underwater.exec(paragraphs[2][0]);
    const components = adapted.damageComponents ?? [];
    if (!deals || !sustain || !through || !DEPTHS.once.test(onceText) || !underwater || deals[5].toLowerCase() !== adapted.defense.statistic || through[1].toLowerCase() !== adapted.defense.statistic
        || components.length !== 2 || ![[deals[1], deals[2]], [deals[3], deals[4]]].every(([dice, type]) => components.some(component => String(component.formula).replace(/\s+/g, "") === dice && String(component.type).toLowerCase() === type))) return null;
    const claimed = [...paragraphs[1], paragraphs[2][0]];
    return {
        lingering: { events: [], initial: true, oncePerRound: true, excludeCaster: false, enemiesOnly: false, area: { type: "burst", value: Number(area.value) }, centre: "placed",
            durationSeconds: seconds, sustained: true, concealment: false, moveOnSustain: true,
            gmAction: { actions: ["vortex"], label: "was moved through by the vortex", sourceText: throughText },
            notes: [`Each time you Sustain it, either grow the region's radius by ${sustain[1]} feet (to at most ${sustain[2]}) or move it up to ${sustain[3]} feet in a straight line; the creatures it moves through use the area's control (each once per round).`,
                `Underwater, it's a ${underwater[1]}-foot-tall cylinder with a ${underwater[2]}-foot radius.`],
            sourceText: claimed },
        claimedSentences: claimed
    };
}

/** {lingering, claimedSentences} or null. */
export function compileExtraLingering(adapted) {
    return compileVortex(adapted) ?? compileOrchestra(adapted) ?? compileLivingTears(adapted) ?? compileDepths(adapted);
}
