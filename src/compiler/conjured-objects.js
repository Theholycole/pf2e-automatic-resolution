// Conjured things with stated statistics, as module tokens (user decision 2026-10-01), and what they do from the spell's card:
//   - a cage (Lifewood Cage): "You create an immobile, Invisible prison … The cage is a 20-foot cube … Each creature in the area where you create the cage
//     must attempt a Reflex save. If such a creature fails, it becomes trapped inside the cage. If it succeeds, it's pushed outside the cage into a space of
//     its choice. … The cage has AC 10, Hardness 20, and 40 Hit Points, and it's immune to critical hits and precision damage, though it has weakness 5 to
//     void damage. …": the cage token (Hardness as resistance to all damage), the save's trapped and pushed rows, the rest the GM's notes;
//   - a confluence (Elemental Confluence): "The confluence has AC 28, 120 Hit Points, weakness 10 to area effects, and immunity to bleed and poison.
//     Creatures can move through the confluence; creatures within the confluence are Concealed, and all creatures outside the confluence are concealed to
//     creatures within it. When you Cast or Sustain this Spell, you can move the confluence up to 20 feet and choose up to two different types of elementals
//     to act." with the listed elementals: its token, the concealing area that follows it, and each elemental's action as a button.
import { plainOrEmpty as plain, sentenceSplitCapital as sentencesOf } from "./text-patterns.js";

const DMG = String.raw`@Damage\[(\d+d\d+)\[(persistent,)?([a-z]+)\]\]`;

const CAGE = [
    [/^You create an immobile, @UUID\[[^\]]+\]\{Invisible\} prison of [A-Za-z ,]+\.$/, "invisible"],
    [/^The cage is a (\d+)-foot cube made of [a-z ,]+\.$/, "cube"],
    [/^Each creature in the area where you create the cage must attempt an? (Fortitude|Reflex|Will) save\.$/, "lead"],
    [/^If such a creature fails, it becomes trapped inside the cage\.$/, "trapped"],
    [/^If it succeeds, it's pushed outside the cage into a space of its choice\.$/, "pushed"],
    [/^If a creature in the area is too big to fit inside the prison, the spell automatically fails\.$/, "too-big"],
    [/^The cage has AC (\d+), Hardness (\d+), and (\d+) Hit Points, and it's immune to critical hits and precision damage, though it has weakness (\d+) to ([a-z]+) damage\.$/, "stats"],
    [/^A creature capable of passing through the space between the bars \(typically a Tiny creature\) can leave; all others are confined within\.$/, "confined"],
    [/^The vitality energy suffusing the wood prevents incorporeal undead creatures from passing through the beams\.$/, "incorporeal"],
    [/^Attacks with a weapon too large to fit between the bars can't pass through the cage, and the bars provide standard cover even against attacks that can pass through the gaps\.$/, "cover"],
    [/^Spells and most area effects \(such as dragon breath\) can pass through the cage uninhibited\.$/, "spells"]
];

/** {conjure, statistic, notes, trapped, pushed, sentences} or null. */
export function extractCage(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic) return null;
    const sentences = sentencesOf(plain(adapted.descriptionHTML));
    if (sentences.length !== CAGE.length) return null;
    const found = {};
    for (const [index, [pattern, key]] of CAGE.entries()) {
        const m = pattern.exec(sentences[index]);
        if (!m) return null;
        found[key] = { m, sentence: sentences[index] };
    }
    if (found.lead.m[1].toLowerCase() !== adapted.defense.statistic) return null;
    const [, ac, hardness, hp, weakness, weakType] = found.stats.m;
    const feet = Number(found.cube.m[1]);
    return {
        statistic: adapted.defense.statistic,
        conjure: { name: "cage", size: feet >= 20 ? "grg" : feet >= 15 ? "huge" : feet >= 10 ? "lg" : "med", ac: Number(ac), saves: 0, hp: Number(hp), object: true,
            immunities: ["critical-hits", "precision"], weaknesses: [{ type: weakType, value: Number(weakness) }], resistances: [{ type: "all-damage", value: Number(hardness) }],
            traits: [], endsAtZero: true, sourceText: [found.cube.sentence, found.stats.sentence].join(" ") },
        trapped: { label: "Trapped in the cage", text: `Trapped inside the cage: it can't leave unless it can pass between the bars (typically Tiny); incorporeal undead can't pass either. The bars give it standard cover against attacks that can pass through them. This ends when the cage is destroyed or the spell ends.`, sourceText: found.trapped.sentence },
        pushed: found.pushed.sentence,
        notes: [`${found.invisible.sentence} ${found.cube.sentence} (Hardness ${hardness}: the token's resistance to all damage.)`, found["too-big"].sentence, found.cover.sentence, found.spells.sentence],
        sentences
    };
}

const CONFLUENCE = [
    [/^You conjure [a-z ]+ types of elementals who combine forces to form a [a-z ]+\.$/, "conjure"],
    [/^The ([a-z]+) has AC (\d+), (\d+) Hit Points, weakness (\d+) to area effects, and immunity to ([a-z]+) and ([a-z]+)\.$/, "stats"],
    [new RegExp(String.raw`^Creatures can move through the ([a-z]+); creatures within the \1 are @UUID\[[^\]]+\]\{Concealed\}, and all creatures outside the \1 are concealed to creatures within it\.$`), "concealed"],
    [/^When you Cast or Sustain this Spell, you can move the ([a-z]+) up to (\d+) feet and choose up to (two|three|\d) different types of elementals to act\.$/, "acts"]
];
const ELEMENTS = {
    // "Bolts of electricity burst from the confluence, dealing 4d4 electricity damage to creatures within 20 feet of the confluence, with a basic Reflex save. This doesn't affect creatures that are completely inside of the confluence."
    near: new RegExp(String.raw`^[A-Z][a-z ]+ from the ([a-z]+), dealing ${DMG} damage to creatures within (\d+) feet of the \1, with a basic (Fortitude|Reflex|Will) save\. This doesn't affect creatures that are completely inside of the \1\.$`),
    // "The confluence gains a +2 circumstance bonus to AC and resistance 10 to all physical damage (except adamantine) for 1 round."
    guard: /^The ([a-z]+) gains a \+(\d) (circumstance|status) bonus to AC and resistance (\d+) to all (physical) damage \(except ([a-z]+)\) for (\d+) rounds?\.$/,
    // "Flames roar through the confluence, dealing 1d6 persistent fire damage to those partially or entirely inside the confluence."
    inside: new RegExp(String.raw`^[A-Z][a-z ]+ through the ([a-z]+), dealing ${DMG} damage to those partially or entirely inside the \1\.$`),
    // "… dealing 2d6 slashing damage to those partially or entirely inside the confluence with a basic Reflex save. A creature that critically fails also takes 1d6 persistent bleed damage."
    insideSave: new RegExp(String.raw`^[A-Z][a-z ]+ through the ([a-z]+), dealing ${DMG} damage to those partially or entirely inside the \1 with a basic (Fortitude|Reflex|Will) save\. A creature that critically fails also takes ${DMG} damage\.$`),
    // "Attempt a ranged spell attack against a target inside or within 60 feet of the confluence, using your spell attack modifier. … The water deals 4d6 bludgeoning damage on a hit (doubled on a critical hit). …"
    jet: new RegExp(String.raw`^The elemental expels a [a-z ]+\. Attempt a ranged spell attack against a target inside or within (\d+) feet of the ([a-z]+), using your spell attack modifier\. This attack ignores concealment granted by the \2, and the elemental gets a \+(\d) circumstance bonus on the spell attack roll against a target inside the \2\. The [a-z]+ deals ${DMG} damage on a hit \(doubled on a critical hit\)\. This attack doesn't count toward your multiple attack penalty\.$`),
    // "Roots and stumps grow, making ground in the area difficult terrain for 1 round."
    terrain: /^[A-Z][a-z ,]+, making ground in the area difficult terrain for (\d+) rounds?\.$/
};

/** {conjure, concealment, move, choose, elements: [{key, label, traits, kind, …}], sentences} or null. */
export function extractConfluence(adapted) {
    const html = String(adapted.descriptionHTML ?? "");
    const lead = /^<p>([\s\S]*?)<\/p>\s*<ul>([\s\S]*)<\/ul>\s*$/.exec(html.trim());
    if (!lead) return null;
    const sentences = sentencesOf(plain(lead[1]));
    if (sentences.length !== CONFLUENCE.length) return null;
    const found = {};
    for (const [index, [pattern, key]] of CONFLUENCE.entries()) {
        const m = pattern.exec(sentences[index]);
        if (!m) return null;
        found[key] = m;
    }
    const name = found.stats[1];
    if (found.concealed[1] !== name || found.acts[1] !== name || adapted.targeting?.area?.type !== "burst") return null;
    const elements = [];
    for (const item of lead[2].matchAll(/<li>\s*<p>\s*<strong>([A-Z][a-z]+)<\/strong>\s*\(([a-z, ]+)\)\s*([\s\S]*?)<\/p>\s*<\/li>/g)) {
        const [label, traits, text] = [item[1], item[2].split(/,\s*/), plain(item[3])];
        let m;
        if ((m = ELEMENTS.near.exec(text)) && m[1] === name) elements.push({ key: label.toLowerCase(), label, traits, kind: "save", damage: [[m[2], m[4], m[3] ? "persistent" : null]], within: Number(m[5]), statistic: m[6].toLowerCase(), outside: true, sourceText: text });
        else if ((m = ELEMENTS.guard.exec(text)) && m[1] === name) elements.push({ key: label.toLowerCase(), label, traits, kind: "self-effect", bonus: Number(m[2]), bonusType: m[3], resistance: Number(m[4]), resistType: m[5], except: m[6], rounds: Number(m[7]), sourceText: text });
        else if ((m = ELEMENTS.insideSave.exec(text)) && m[1] === name) elements.push({ key: label.toLowerCase(), label, traits, kind: "save", damage: [[m[2], m[4], m[3] ? "persistent" : null]], statistic: m[5].toLowerCase(),
            critical: [[m[6], m[8], m[7] ? "persistent" : null]], inside: true, sourceText: text });
        else if ((m = ELEMENTS.inside.exec(text)) && m[1] === name) elements.push({ key: label.toLowerCase(), label, traits, kind: "damage", damage: [[m[2], m[4], m[3] ? "persistent" : null]], inside: true, sourceText: text });
        else if ((m = ELEMENTS.jet.exec(text)) && m[2] === name) elements.push({ key: label.toLowerCase(), label, traits, kind: "attack", range: Number(m[1]), insideBonus: Number(m[3]), damage: [[m[4], m[6], m[5] ? "persistent" : null]], sourceText: text });
        else if ((m = ELEMENTS.terrain.exec(text))) elements.push({ key: label.toLowerCase(), label, traits, kind: "terrain", rounds: Number(m[1]), sourceText: text });
        else return null;
    }
    if (elements.length < 2) return null;
    return {
        conjure: { name, size: "grg", ac: Number(found.stats[2]), saves: 0, hp: Number(found.stats[3]), immunities: [found.stats[5], found.stats[6]],
            weaknesses: [{ type: "area-damage", value: Number(found.stats[4]) }], resistances: [], traits: ["elemental"], endsAtZero: true, sourceText: sentences[1],
            concealing: { radius: adapted.targeting.area.value, sourceText: sentences[2] } },
        move: Number(found.acts[2]), choose: { two: 2, three: 3 }[found.acts[3]] ?? Number(found.acts[3]), elements, sentences
    };
}
