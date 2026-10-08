// Blasts whose creatures take different damage by where they are, or whose type the caster picks (feature group 9), as a card of save parts:
//   - Falling Stars: "Choose for the falling stars to be airbursts (sonic), asteroids (fire), comets (cold), or plasma (electricity)." / "Each falling star
//     deals 6d10 bludgeoning damage to each creature in the 10-foot burst at the center of its area of effect before exploding, dealing 14d6 energy damage
//     of the type you chose to each creature in its 40-foot burst. A creature in any of the areas attempts one basic Reflex save …" — a creature in a centre
//     takes both (one save), one only in the outer burst the energy; the type picked on the card; the rank in the dice ("Heightened (+1) The bludgeoning
//     damage increases by 1d10, and the energy damage increases by 2d6.");
//   - Planar Collision: "choose an elemental plane. The collision deals 8d6 force damage and 8d8 damage of a type depending on the chosen plane …" with the
//     planes' list, the failure's push from the centre (25 feet, 50 on a critical failure), and the hazardous ground for a year and a day (15 damage of the
//     plane's type to a creature ending its turn there, difficult terrain);
//   - Cataclysm: "Each creature attempts one basic Reflex save that applies to all five types of damage." with the list (acid; bludgeoning on the ground;
//     cold; electricity; bludgeoning to flying creatures; the tsunami's bludgeoning, doubled for swimmers; fire) — a part for creatures on the ground,
//     flying, and swimming.
import { htmlToPlainText } from "./description-parser.js";

const plain = html => htmlToPlainText(html).replace(/\s+/g, " ").trim();
const split = text => text.split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
const Stat = name => name[0].toUpperCase() + name.slice(1);
const rows = list => `<hr />` + ["Critical Success", "Success", "Failure", "Critical Failure"].map((label, index) => `<p><strong>${label}</strong> ${list[index]}</p>`).join("");
const basicRows = (failure = "", critical = failure) => rows(["The creature is unaffected.", "The creature takes half damage.", `The creature takes full damage${failure}.`, `The creature takes double damage${critical}.`]);
// "(6 + 1 * (@item.rank - 9))d10": the stated dice at the rank, with the heightened step.
const ranked = (base, step, rank) => step ? `(${base} + ${step} * (@item.rank - ${rank}))` : String(base);
const save = (html, statistic, basic, extra = {}) => ({ type: "save", html, statistic, basic, area: true, ...extra });

/** {parts, notes, claimed} or null. */
export function extractBlastCard(adapted) {
    for (const reader of [fallingStars, planarCollision, cataclysm, revelry, meteorGlyph]) { const found = reader(adapted); if (found) return found; }
    return null;
}

function fallingStars(adapted) {
    if (adapted.defense?.basic !== true || adapted.targeting?.area) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const parts = /^<p><strong>Area<\/strong> (\d) (\d+)-foot bursts<\/p>\s*<hr\s*\/?>\s*<p>([\s\S]*?)<\/p>\s*<hr\s*\/?>\s*<p><strong>Heightened \(\+1\)<\/strong> The bludgeoning damage increases by (\d+)d(\d+), and the energy damage increases by (\d+)d(\d+)\.<\/p>\s*$/.exec(html.trim());
    if (!parts) return null;
    const sentences = split(plain(parts[3]));
    const CHOOSE = /^Choose for the falling stars to be ([a-z]+) \(([a-z]+)\), ([a-z]+) \(([a-z]+)\), ([a-z]+) \(([a-z]+)\), or ([a-z]+) \(([a-z]+)\)\.$/;
    const STATED = [CHOOSE, /^The spell gains the trait of the falling star type you chose\.$/, /^The (four) stars' central (\d+)-foot bursts can't overlap\.$/,
        /^Each falling star deals (\d+)d(\d+) ([a-z]+) damage to each creature in the @Template\[burst\|distance:(\d+)\] at the center of its area of effect before exploding, dealing (\d+)d(\d+) energy damage of the type you chose to each creature in its @Template\[burst\|distance:(\d+)\]\.$/,
        /^A creature in any of the areas attempts one basic (Reflex|Fortitude) save against the spell no matter how many overlapping explosions it's caught in and can take each type of damage only once\.$/];
    const found = STATED.map(pattern => sentences.map(sentence => pattern.exec(sentence)).find(Boolean));
    if (!found.every(Boolean) || sentences.filter(sentence => !found.some(match => match[0] === sentence)).some(sentence => /\d|@|\b(?:damage|save)\b/.test(sentence))) return null;
    const [choose, , , blast, once] = found;
    const components = adapted.damageComponents ?? [];
    const rank = Number(adapted.rank);
    if (once[1].toLowerCase() !== adapted.defense.statistic || components.length !== 2 || Number(blast[7]) !== Number(parts[2])) return null;
    const types = [choose[2], choose[4], choose[6], choose[8]];
    const center = `${ranked(blast[1], Number(parts[4]), rank)}d${blast[2]}[${blast[3]}]`, energy = `${ranked(blast[5], Number(parts[6]), rank)}d${blast[6]}[untyped]`;
    const choice = { values: types, label: "Falling star", sourceText: choose[0] };
    const statistic = once[1].toLowerCase();
    return {
        parts: [
            { key: "center", title: "In a central burst (both damages)", kind: "action", spec: save(`<p>Each creature takes ${blast[5]}d${blast[6]} damage (basic ${Stat(statistic)} save).</p>`,
                    statistic, true, { damage: { formula: `${blast[5]}d${blast[6]}`, type: "untyped" }, formula: `{${center},${energy}}`, choice }),
                repeat: { trigger: "another group of creatures is targeted" }, reminder: `Target the creatures in any star's central ${blast[4]}-foot burst (each creature once).` },
            { key: "outer", title: "Only in an explosion (energy)", kind: "action", spec: save(`<p>Each creature takes ${blast[5]}d${blast[6]} damage (basic ${Stat(statistic)} save).</p>`,
                    statistic, true, { damage: { formula: `${blast[5]}d${blast[6]}`, type: "untyped" }, formula: energy, choice }),
                repeat: { trigger: "another group of creatures is targeted" }, reminder: `Target the creatures in the ${blast[7]}-foot bursts but in no central burst (each creature once).` }],
        notes: [`Place the four ${parts[2]}-foot bursts (their central ${blast[4]}-foot bursts can't overlap). Each creature attempts one save however many explosions catch it: target it on one part only.`,
            `Pick the same type on both parts: ${choose[1]} (${choose[2]}), ${choose[3]} (${choose[4]}), ${choose[5]} (${choose[6]}) or ${choose[7]} (${choose[8]}); the spell gains its trait.`],
        claimed: [...found.map(match => match[0]), plain(html.slice(html.lastIndexOf("<p><strong>Heightened")))]
    };
}

function planarCollision(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.basic !== true || area?.type !== "burst") return null;
    const html = String(adapted.descriptionHTML ?? "");
    const parts = /^<p>([\s\S]*?)<\/p>\s*<ul>([\s\S]*?)<\/ul>\s*$/.exec(html.trim());
    if (!parts || /Heightened/.test(html)) return null;
    const sentences = split(plain(parts[1]));
    const STATED = [/^When you Cast this Spell, choose an elemental plane\.$/,
        /^The collision deals (\d+)d(\d+) ([a-z]+) damage and (\d+)d(\d+) damage of a type depending on the chosen plane to each creature in the area with a basic (Reflex|Fortitude) save\.$/,
        /^A creature that fails the saving throw is also pushed (\d+) feet away from the center of the burst \(or (\d+) feet on a critical failure\)\.$/,
        /^Each creature whose movement is stopped by a firm surface, such as a w[a-z]+, takes bludgeoning damage equal to the remaining number of feet it would've moved\.$/,
        /^The area also becomes difficult terrain and hazardous terrain that lasts for a year and a day or until counteracted by a spell or effect such as @UUID\[[^\]]+\]\{[^}]+\}\.$/,
        /^Any creature that ends its turn in the hazardous terrain takes @Damage\[(\d+)\[untyped\]\] damage of a type depending on the chosen plane\.$/];
    const found = STATED.map(pattern => sentences.map(sentence => pattern.exec(sentence)).find(Boolean));
    if (!found.every(Boolean) || sentences.filter(sentence => !found.some(match => match[0] === sentence)).some(sentence => /\d|@|\b(?:damage|save)\b/.test(sentence))) return null;
    const planes = [...parts[2].matchAll(/<li>\s*<p>\s*<strong>Plane of ([A-Z][a-z]+)<\/strong> The damage dealt is ([a-z]+) damage, and the spell gains the ([a-z]+) trait\.\s*<\/p>\s*<\/li>/g)];
    if (planes.length < 2 || plain(parts[2]).length !== planes.map(plane => plain(plane[0])).join(" ").length) return null;
    const [, collision, push, , , ground] = found;
    const statistic = collision[6].toLowerCase();
    const components = adapted.damageComponents ?? [];
    if (statistic !== adapted.defense.statistic || components.length !== 1 || String(components[0].formula).replace(/\s+/g, "") !== `${collision[1]}d${collision[2]}`) return null;
    const types = planes.map(plane => plane[2]);
    const choice = { values: types, label: "Plane", sourceText: found[0][0] };
    const shoved = feet => ` and is pushed ${feet} feet away from the center of the burst`;
    return {
        parts: [
            { key: "collision", title: "The collision", kind: "action", spec: save(`<p>Each creature in the area must attempt a basic ${Stat(statistic)} save.</p>`
                    + basicRows(shoved(push[1]), shoved(push[2])), statistic, true, { damage: { formula: `${collision[4]}d${collision[5]}`, type: "untyped" },
                    formula: `{${collision[1]}d${collision[2]}[${collision[3]}],${collision[4]}d${collision[5]}[untyped]}`, choice }),
                // (A push stopped by a firm surface: bludgeoning equal to the feet left, by the module.)
                pushStopped: { damage: "bludgeoning" }, reminder: "Target each creature in the burst; pick the plane's damage type on the card." },
            { key: "ground", title: "The ruined ground", kind: "hazard", place: { type: "burst", value: Number(area.value) }, events: ["turn-end"], formula: ground[1], typeChoice: types, terrain: 2,
                rounds: 366 * 24 * 600, label: "Hazardous terrain", reminder: `Place the ${area.value}-foot burst: difficult terrain, and ${ground[1]} damage of the plane's type to each creature ending its turn there, for a year and a day.` }],
        notes: [`The planes: ${planes.map(plane => `${plane[1]} ${plane[2]} (the ${plane[3]} trait)`).join(", ")}.`,
            "A creature whose push is stopped by a firm surface takes bludgeoning damage equal to the feet it had left to move (the module, for a wall or the scene's edge).",
            "The hazardous terrain lasts until counteracted (such as by dispel magic): the GM ends it in Ongoing spells."],
        claimed: [...found.map(match => match[0]), ...planes.map(plane => plain(plane[0]))]
    };
}

function cataclysm(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.basic !== true || area?.type !== "burst") return null;
    const html = String(adapted.descriptionHTML ?? "");
    const parts = /^<p>([\s\S]*?)<\/p>\s*<ul>([\s\S]*?)<\/ul>\s*$/.exec(html.trim());
    if (!parts || /Heightened/.test(html)) return null;
    const sentences = split(plain(parts[1]));
    const RESIST = /^Treat the resistances of creatures in the area as if they were (\d+) lower for the purpose of determining the [a-z]+'s damage\.$/;
    const ONE = /^Each creature attempts one basic (Reflex|Fortitude) save that applies to all five types of damage\.$/;
    const resist = sentences.map(sentence => RESIST.exec(sentence)).find(Boolean), one = sentences.map(sentence => ONE.exec(sentence)).find(Boolean);
    if (!resist || !one || one[1].toLowerCase() !== adapted.defense.statistic) return null;
    const items = [...parts[2].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(match => plain(match[1]));
    const READ = [
        { pattern: /^Flesh-dissolving acid rain deals (\d+d\d+) (acid) damage\.$/, where: "all" },
        { pattern: /^A roaring earthquake shakes and bludgeons creatures on the ground, dealing (\d+d\d+) (bludgeoning) damage\.$/, where: "ground" },
        { pattern: /^A blast of freezing wind deals (\d+d\d+) (cold) damage\.$/, where: "all" },
        { pattern: /^Incredible lightning lashes the area, dealing (\d+d\d+) (electricity) damage\.$/, where: "all" },
        { pattern: /^Beating winds churn across the sky, dealing (\d+d\d+) (bludgeoning) damage to creatures flying in the area\.$/, where: "flying" },
        { pattern: /^An instant tsunami sweeps over creatures in the area, dealing (\d+d\d+) (bludgeoning) damage with the water trait \(doubled for creatures swimming in the area\)\.$/, where: "water" },
        { pattern: /^A massive wildfire burns in a sudden inferno, dealing (\d+d\d+) (fire) damage\.$/, where: "all" }];
    const read = items.map(item => READ.map(entry => ({ entry, match: entry.pattern.exec(item) })).find(found => found.match));
    if (read.some(found => !found) || new Set(read.map(found => found.entry)).size !== READ.length) return null;
    const pool = (found, double = false) => double ? `(2*${found.match[1]})[${found.match[2]}]` : `${found.match[1]}[${found.match[2]}]`;
    const pools = where => read.filter(found => found.entry.where === "all" || found.entry.where === where || (found.entry.where === "water"))
        .map(found => pool(found, found.entry.where === "water" && where === "swimming"));
    const statistic = one[1].toLowerCase();
    const part = (key, title, where, who) => ({ key, title, kind: "action", spec: save(`<p>Each creature takes ${read[0].match[1]} ${read[0].match[2]} damage (basic ${Stat(statistic)} save).</p>`, statistic, true,
        { damage: { formula: read[0].match[1], type: read[0].match[2] }, formula: `{${pools(where).join(",")}}`, resistanceLower: Number(resist[1]) }), reminder: `Target the creatures in the area ${who} (each creature once).` });
    return {
        parts: [part("ground", "On the ground", "ground", "on the ground"), part("flying", "Flying", "flying", "flying"), part("swimming", "Swimming", "swimming", "swimming (the tsunami doubled)")],
        // (User decision 2026-10-05: the module applies "resistances … 10 lower" — the save card gives back up to 10 of each resistance PF2e applied.)
        notes: ["The tsunami's bludgeoning damage has the water trait."],
        claimed: [resist[0], one[0], ...items]
    };
}

// Vampiric Revelry: "You deal 12d6 void damage to living enemies in the area with a basic Fortitude save." / "You gain temporary Hit Points equal to half the
// damage a single creature takes from this spell; calculate these temporary Hit Points using the creature that took the most damage. Any temporary Hit Points
// gained through this spell are lost after 1 minute." with its actions: 2 (a 20-foot emanation), 3 (the same Hit Points for the allies in it), Two Rounds (a
// 30-foot emanation, the highest damage in full, a 60-foot teleport, then the allies within 30 feet) — a part for each, the caster's Hit Points from the save
// card's damage, the allies' share their own button.
function revelry(adapted) {
    if (adapted.defense?.basic !== true || adapted.targeting?.area || (adapted.damageComponents ?? []).length !== 1) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(match => match[1]);
    if (paragraphs.length !== 5) return null;
    const lead = split(plain(paragraphs[0]));
    const deal = /^You deal @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage to living enemies in the area with a basic (Fortitude|Reflex) save\.$/.exec(lead.find(sentence => /^You deal/.test(sentence)) ?? "");
    const temp = split(plain(paragraphs[1]));
    const half = /^You gain temporary Hit Points equal to half the damage a single creature takes from this spell; calculate these temporary Hit Points using the creature that took the most damage\.$/.test(temp[0] ?? "");
    const lost = /^Any temporary Hit Points gained through this spell are lost after (\d+) minutes?\.$/.exec(temp[1] ?? "");
    const two = /^2 The spell is a @Template\[type:emanation\|distance:(\d+)\]\.$/.exec(plain(paragraphs[2]));
    const three = /^3 The spell is a @Template\[type:emanation\|distance:(\d+)\]\. In addition to granting temporary Hit Points to yourself, you grant the same number of temporary Hit Points to all allies in the emanation\.$/.exec(plain(paragraphs[3]));
    const rounds = /^Two Rounds If you spend 3 actions casting the spell, you can avoid finishing the spell and spend another 2 actions on your next turn to empower the spell even further\. You can take other actions before finishing this spell, but the spell is lost if you Cast another Spell in between\. The spell's area increases to a @Template\[type:emanation\|distance:(\d+)\], and the temporary Hit Points gained equal the highest damage a single creature took from the spell\. After dealing damage, you can then teleport up to (\d+) feet to a location you can see\. You can then grant all allies in a @Template\[type:emanation\|distance:(\d+)\] the same number of temporary Hit Points you gained\.$/.exec(plain(paragraphs[4]));
    if (!deal || !half || !lost || !two || !three || !rounds || temp.length !== 2 || deal[3].toLowerCase() !== adapted.defense.statistic) return null;
    const statistic = deal[3].toLowerCase();
    const benefit = fraction => `<p>You gain temporary Hit Points equal to ${fraction === 1 ? "" : "half "}the damage a single creature takes from this spell; calculate these temporary Hit Points using the creature that took the most damage. ${lost[0]}</p>`;
    const blast = (radius, fraction) => save(`<p>You deal ${deal[1]} ${deal[2]} damage to each creature in the area (basic ${Stat(statistic)} save).</p>${benefit(fraction)}`, statistic, true,
        { itemDamage: true, benefit: true, areaShape: { type: "emanation", value: radius } });
    return {
        parts: [
            { key: "two", title: `2 actions (a ${two[1]}-foot emanation)`, kind: "action", spec: blast(Number(two[1]), 0.5), reminder: `Target the living enemies in the ${two[1]}-foot emanation: the caster gains half the most damage one took, for ${lost[1]} minute.` },
            { key: "three", title: `3 actions (a ${three[1]}-foot emanation)`, kind: "action", spec: blast(Number(three[1]), 0.5), reminder: `Target the living enemies in the ${three[1]}-foot emanation, then share the Hit Points with the allies.` },
            { key: "three-share", title: "Allies' temporary Hit Points (3 actions)", kind: "temp-share", from: "three", seconds: Number(lost[1]) * 60, reminder: "Target the allies in the emanation: the caster's temporary Hit Points from the 3-action casting." },
            { key: "rounds", title: `Two rounds (a ${rounds[1]}-foot emanation)`, kind: "action", spec: blast(Number(rounds[1]), 1), reminder: `On the second turn: target the living enemies in the ${rounds[1]}-foot emanation; the caster gains the most damage one took.` },
            { key: "rounds-jump", title: "Two rounds: teleport", kind: "teleport", mode: "move", who: "caster", within: Number(rounds[2]), from: "caster", reminder: `The caster may teleport up to ${rounds[2]} feet to a space it can see.` },
            { key: "rounds-share", title: "Two rounds: allies' temporary Hit Points", kind: "temp-share", from: "rounds", seconds: Number(lost[1]) * 60, reminder: `Target the allies within ${rounds[3]} feet of the caster's new space.` }],
        notes: ["Only living enemies take the damage (the GM targets them).", "Two Rounds: the spell is lost if the caster casts another spell before finishing it on its next turn."],
        claimed: [...lead, ...temp, plain(paragraphs[2]), plain(paragraphs[3]), plain(paragraphs[4])]
    };
}

// Metallic Meteorite Glyph: "The meteor collides with the target, dealing 8d12 bludgeoning damage with a basic Reflex save." with its actions: 2 (1 creature),
// 3 (up to 3), Two Rounds (as 3, the glyphs left for 1 minute: "A creature that has a glyph on it at the end of its turn is targeted by another smaller meteor
// that deals 6d12 bludgeoning damage (basic Reflex save).") — the meteors' save, and the glyph on each target (the module rolls its save as the turn ends).
function meteorGlyph(adapted) {
    if (adapted.defense?.basic !== true || adapted.targeting?.area || (adapted.damageComponents ?? []).length !== 1) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(match => plain(match[1]));
    if (paragraphs.length !== 4) return null;
    const hit = /The meteor collides with the target, dealing @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage with a basic (Reflex|Fortitude) save\./.exec(paragraphs[0]);
    const one = /^2 The rune appears on 1 creature in range, and the meteor targets that creature\. The rune fades away after the meteor falls\.$/.test(paragraphs[1]);
    const three = /^3 Runes appear on up to (\d+) different creatures within range, and a meteor targets each of these creatures\. The rune fades away after the meteor falls\.$/.exec(paragraphs[2]);
    const rounds = /^Two Rounds If you spend 3 actions casting the spell, you can avoid finishing the spell and spend another 2 actions on your next turn to empower the spell even further\. You can take other actions before finishing this spell, but the spell is lost if you Cast another Spell in between\. The spell acts as the 3-action version, but the glyphs remain on the targets for (\d+) minutes?\. A creature that has a glyph on it at the end of its turn is targeted by another smaller meteor that deals @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage \(basic (Reflex|Fortitude) save\)\.$/.exec(paragraphs[3]);
    if (!hit || !one || !three || !rounds || hit[3].toLowerCase() !== adapted.defense.statistic) return null;
    const statistic = hit[3].toLowerCase();
    const meteor = count => ({ ...save(`<p>The target takes ${hit[1]} ${hit[2]} damage (basic ${Stat(statistic)} save).</p>`, statistic, true, { itemDamage: true }), area: false, ...(count > 1 ? { area: true, count } : {}) });
    return {
        parts: [
            { key: "one", title: "2 actions (1 creature)", kind: "action", spec: meteor(1), reminder: "Target the creature with the rune." },
            { key: "three", title: `3 actions (up to ${three[1]} creatures)`, kind: "action", spec: meteor(Number(three[1])), reminder: `Target up to ${three[1]} different creatures in range.` },
            { key: "glyph", title: "Two rounds: the glyphs", kind: "glyph", seconds: Number(rounds[1]) * 60, statistic: rounds[4].toLowerCase(), formula: `${rounds[2]}[${rounds[3]}]`,
                reminder: `After the 3-action meteors on the second turn: target the same creatures; each glyph lasts ${rounds[1]} minute, and a smaller meteor (${rounds[2]} ${rounds[3]}, basic ${rounds[4]}) strikes its creature at the end of each of its turns.` }],
        notes: ["Two Rounds: the spell is lost if the caster casts another spell before finishing it on its next turn."],
        claimed: paragraphs
    };
}
