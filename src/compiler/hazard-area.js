// A placed area whose damage the GM triggers (user decision 2026-10-01: an Ongoing control the GM presses; the module rolls and applies):
//   Explosive Dust — "You and your allies can pass through it safely, but enemies who move into the dust trigger explosions, taking 1d4 fire
//   damage for every square they pass through." with "Heightened (+2) The damage an enemy takes by passing through a square increase by 1d4.";
//   Tacky Pine Sap — "This area becomes difficult terrain." / "When a creature within the area uses a fire effect or receives fire damage, the
//   sap ignites, dealing @Damage[floor(@item.rank /2)d6[persistent,fire]] damage to anyone standing on it; this burns up the sap, removing it
//   and its difficult terrain."
// Casting places the area for the duration (difficult terrain on its region where stated). The per-square control asks for the enemy (targeted)
// and the squares it passed through, rolling the damage for each square; the ignite control gives each targeted creature standing on it the
// persistent damage and ends the spell. The rest of the text is the GM's notes.
import { htmlToPlainText } from "./description-parser.js";

const PER_SQUARE = /^You and your allies can pass through it safely, but enemies who move into the [a-z]+ trigger explosions, taking (\d+)d(\d+) ([a-z]+) damage for every square they pass through\.$/;
const IGNITE = /^When a creature within the area uses a ([a-z]+) effect or receives \1 damage, the [a-z]+ ignites, dealing @Damage\[floor\(@item\.rank ?\/ ?(\d)\)d(\d+)\[persistent,([a-z]+)\]\] damage to anyone standing on it; this burns up the [a-z]+, removing it and its difficult terrain\.$/;
const TERRAIN = /^(?:(?:This|The) area becomes|The covered area is) difficult terrain( and hazardous terrain)?\.$/;
// Spike Stones: "A creature that moves on the ground through the area takes 3 piercing damage for every square of that area it moves into." with
// "Heightened (+1) Increase the damage by 1." — any creature on the ground, a flat amount per square.
const PER_SQUARE_FLAT = /^A creature that moves on the ground through the area takes (\d+) ([a-z]+) damage for every square of that area it moves into\.$/;
const STEP_FLAT = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*(?:Increase the damage by|The [a-z]+ damage of the hazardous terrain increases by|The damage per square increases by) (\d+)\.\s*<\/p>$/;
// Field of Razors: "The covered area is difficult terrain. A creature that moves through the area takes @Damage[5[slashing]] damage per square traversed." /
// "If a creature takes slashing, piercing, or persistent bleed damage while inside the thicket, you can spend a reaction to grow the iron in the shed blood into
// additional wires, expanding the burst by 5 feet. You can grow the area four times in this way, to a maximum of a @Template[burst|distance:40]." / "The metal must
// be of a type you currently have in your possession." / "The barbed wires are made of the metal you chose and activate resistances, weaknesses, and the like
// normally. The metal reforms in your possession when the spell ends." — any creature moving through, a flat amount per square; the caster's reaction a control
// that grows the region (to the stated count and radius); the metal the caster's (notes). (No duration in the data or the text: 1 minute, the user's ruling.)
const PER_TRAVERSED = /^A creature that moves through the area takes (?:@Damage\[(\d+)\[([a-z]+)\]\]|(\d+) ([a-z]+)) damage per square traversed\.$/;
const BLOOD_GROWTH = /^If a creature takes ([a-z]+), ([a-z]+), or persistent ([a-z]+) damage while inside the [a-z]+, you can spend a reaction to [a-z ]+, expanding the burst by (\d+) feet\.$/;
const GROWTH_LIMIT = /^You can grow the area (two|three|four|five|six) times in this way, to a maximum of an? (?:@Template\[(?:type:)?burst\|distance:(\d+)\]|(\d+)-foot burst)\.$/;
const METAL_NOTES = [/^The metal must be of a type you currently have in your possession\.$/, /^The barbed wires are made of the metal you chose and activate resistances, weaknesses, and the like normally\.$/,
    /^The metal reforms in your possession when the spell ends\.$/];
const TIMES = { two: 2, three: 3, four: 4, five: 5, six: 6 };
// Nature's Reprisal: "To your enemies, the area becomes difficult terrain, and areas that were naturally difficult terrain due to plants become greater difficult
// terrain as well as hazardous terrain, dealing 6 poison damage to an enemy each time it enters an affected square." with "Target all squares on the ground that
// contain plants in an 80-foot burst" — a flat amount per hazardous square an enemy enters; which squares have plants, and the terrain (enemies only), the GM's.
const PLANT_SQUARE = /^To your enemies, the area becomes difficult terrain, and areas that were naturally difficult terrain due to plants become greater difficult terrain as well as hazardous terrain, dealing (\d+) ([a-z]+) damage to an enemy each time it enters an affected square\.$/;
const NOTES = [
    /^This dust is hard to see, requiring a (?:\[\[\/act seek\]\]|Seek) roll against your spell DC to identify\.$/,
    /^Once the [a-z]+ in a square explodes, that square becomes safe for everyone\.$/,
    /^If all the [a-z]+ explodes, the spell ends\.$/
];
const STEP = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The (?:damage an enemy takes by passing through a square increases?|persistent ([a-z]+) damage increases|damage increases) by (\d+)d(\d+)\.\s*<\/p>$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
// Sacred Nimbus: "The rain deals 5d6 spirit damage to fiends, undead, and creatures that have a weakness to spirit damage in the area at the end of
// your turn." with "When you Sustain the spell, you can move the cloud at a fly speed of 15 feet to anywhere in the spell's range." — the area deals
// the damage itself as the caster's turn ends (only to creatures with those traits or PF2e's weakness to that type), with no save (the text states
// none, whatever PF2e's item lists); the GM moves the region when the caster Sustains (a note).
const CASTER_TURN_RAIN = /^The [a-z]+ deals (\d+)d(\d+) ([a-z]+) damage to ([a-z]+), ([a-z]+), and creatures that have a weakness to \3 damage in the area at the end of your turn\.$/;
const SUSTAIN_MOVE = /^When you Sustain the spell, you can move the [a-z]+ at a fly speed of (\d+) feet to anywhere in the spell's range\.$/;
// ("You summon a small, fluffy white nimbus cloud that floats 10 feet above the ground …": where the cloud floats; "The water dissipates as it
// makes contact with any creatures or surfaces, …": what the rain leaves.)
const FLOATS = /^You summon an? [a-z ,]+ that floats \d+ feet above the ground and [a-z ,]+\.$/;
const DISSIPATES = /^The [a-z]+ dissipates as it makes contact with any creatures or surfaces, leaving only a bit of [a-z]+ in its place\.$/;
// Field of Life: "Each living creature that starts its turn in the area regains 1d8 Hit Points, and any undead creature that starts its turn in the area takes
// 1d8 vitality damage." with "Heightened (8th) The healing and damage increase to 1d10." — the area heals the living and harms the undead itself as each turn
// starts (no save), sustained; the fixed heightened dice from the text (matching the item's).
const LIFE_FIELD = /^Each living creature that starts its turn in the area regains (\d+d\d+) Hit Points, and any undead creature that starts its turn in the area takes \1 ([a-z]+) damage\.$/;
const LIFE_STEP = /^<p>\s*<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>\s*The healing and damage increase to (\d+d\d+)\.\s*<\/p>$/;
const TRAIT_SLUGS = { fiends: "fiend", undead: "undead", constructs: "construct", aberrations: "aberration", elementals: "elemental" };

/** Returns {hazardArea, claimed} or null. */
export function compileHazardArea(adapted) {
    const area = adapted.targeting?.area;
    // (A save PF2e's item lists but the text never mentions is the item's error: the text over the data.)
    const textNoSave = adapted.defense?.kind === "save" && !/\bsav(?:e|es|ing throw)\b/i.test(htmlToPlainText(String(adapted.descriptionHTML ?? "")));
    const plantTarget = /^all squares on the ground that contain plants in an? \d+-foot burst$/i.test(String(adapted.targeting?.target ?? "").trim());
    if ((adapted.defense?.kind !== "none" && !textNoSave) || (String(adapted.targeting?.target ?? "").trim() && !plantTarget) || !["burst", "square"].includes(area?.type)) return null;
    // (Sustained and square only for the caster's-turn rain, checked below.)
    const sustained = adapted.lifecycle?.sustained === true;
    // (A placed burst stating no duration anywhere — neither PF2e's data nor its text — lasts 1 minute: the user's ruling, 2026-10-03.)
    const unstated = !String(adapted.lifecycle?.duration ?? "").trim() && !sustained && area?.type === "burst" && !/\b(?:minutes?|rounds?|hours?|until)\b/i.test(htmlToPlainText(String(adapted.descriptionHTML ?? "")));
    const fixed = unstated ? [null, "1", "minute"] : /^(\d+) (round|minute|hour)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!fixed) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length > 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    let control = null, terrain = false, narrated = 0, growth = null;
    const notes = [], claimed = [];
    for (const sentence of sentences) {
        const square = !control ? PER_SQUARE.exec(sentence) : null;
        if (square) { control = { kind: "per-square", count: Number(square[1]), faces: Number(square[2]), type: square[3], enemiesOnly: true }; claimed.push(sentence); continue; }
        const flat = !control ? PER_SQUARE_FLAT.exec(sentence) : null;
        if (flat) { control = { kind: "per-square", flat: Number(flat[1]), type: flat[2], enemiesOnly: false, groundOnly: true }; claimed.push(sentence); continue; }
        const traversed = !control ? PER_TRAVERSED.exec(sentence) : null;
        if (traversed) { control = { kind: "per-square", flat: Number(traversed[1] ?? traversed[3]), type: traversed[2] ?? traversed[4], enemiesOnly: false, groundOnly: false }; claimed.push(sentence); continue; }
        const blood = control?.kind === "per-square" && !growth ? BLOOD_GROWTH.exec(sentence) : null;
        if (blood) { growth = { feet: Number(blood[4]), types: [blood[1], blood[2], `persistent ${blood[3]}`], sourceText: sentence }; claimed.push(sentence); continue; }
        const limit = growth && growth.times == null ? GROWTH_LIMIT.exec(sentence) : null;
        if (limit) { growth.times = TIMES[limit[1]]; growth.maximum = Number(limit[2] ?? limit[3]); growth.sourceText = `${growth.sourceText} ${sentence}`; claimed.push(sentence); continue; }
        if (METAL_NOTES.some(pattern => pattern.test(sentence))) { notes.push(sentence); claimed.push(sentence); continue; }
        const plant = !control && plantTarget ? PLANT_SQUARE.exec(sentence) : null;
        if (plant) {
            control = { kind: "per-square", flat: Number(plant[1]), type: plant[2], enemiesOnly: true };
            notes.push("To your enemies only, the area is difficult terrain; squares that were already difficult terrain from plants are greater difficult terrain and hazardous (only those deal the damage). The squares with plants are the GM's.");
            claimed.push(sentence); continue;
        }
        const rain = !control ? CASTER_TURN_RAIN.exec(sentence) : null;
        if (rain) {
            const traits = [rain[4], rain[5]].map(word => TRAIT_SLUGS[word]);
            if (traits.some(trait => !trait)) return null;
            control = { kind: "caster-turn-end", count: Number(rain[1]), faces: Number(rain[2]), type: rain[3], traits, weakness: rain[3] }; claimed.push(sentence); continue;
        }
        const moves = control?.kind === "caster-turn-end" && sustained ? SUSTAIN_MOVE.exec(sentence) : null;
        if (moves) { notes.push(`When you Sustain the spell, you can move the area at a fly Speed of ${moves[1]} feet anywhere in range: move the region (before your turn ends).`); claimed.push(sentence); continue; }
        if (!claimed.length && narrated < 1 && FLOATS.test(sentence)) { narrated++; continue; }
        if (control?.kind === "caster-turn-end" && DISSIPATES.test(sentence)) { claimed.push(sentence); continue; }
        const life = !control && sustained ? LIFE_FIELD.exec(sentence) : null;
        if (life) { control = { kind: "life-field", formula: life[1], type: life[2] }; claimed.push(sentence); continue; }
        const ignite = !control ? IGNITE.exec(sentence) : null;
        if (ignite) { control = { kind: "ignite", trigger: ignite[1], divisor: Number(ignite[2]), faces: Number(ignite[3]), type: ignite[4], persistent: true, endsSpell: true }; claimed.push(sentence); continue; }
        if (!terrain && TERRAIN.test(sentence)) { terrain = true; if (TERRAIN.exec(sentence)[1]) notes.push("The area is also hazardous terrain."); claimed.push(sentence); continue; }
        if (NOTES.some(pattern => pattern.test(sentence))) { notes.push(sentence.replace(/\[\[\/act seek\]\]/, "Seek")); claimed.push(sentence); continue; }
        if (!claimed.length && narrated < 1 && !NARRATION_RULES.test(sentence)) { narrated++; continue; }
        return null;
    }
    if (!control || (control.kind === "ignite" && !terrain) || (plantTarget && control.enemiesOnly !== true)) return null;
    // Only the caster's-turn rain is sustained or a square; a save the text doesn't state only there too.
    // (A growth by the caster's reaction must reach its stated maximum in its stated count; a save the text doesn't state is then the item's error.)
    if (growth && !(growth.times && Number(area.value) + growth.times * growth.feet === growth.maximum && control.kind === "per-square")) return null;
    if (!["caster-turn-end", "life-field"].includes(control.kind) && (sustained || area.type !== "burst" || (textNoSave && !growth))) return null;
    if (unstated && !growth) return null;
    if (control.kind === "caster-turn-end" && !sustained) return null;
    if (control.kind === "life-field") {
        const components = adapted.damageComponents ?? [];
        const entries = rest.length ? [...rest[0].matchAll(/<p>[\s\S]*?<\/p>/gi)].map(match => match[0].trim()) : [];
        const steps = entries.map(entry => LIFE_STEP.exec(entry));
        const levels = adapted.heightening?.type === "fixed" ? adapted.heightening.levels ?? {} : {};
        if (textNoSave || area.type !== "burst" || components.length !== 1 || String(components[0].formula).replace(/\s+/g, "") !== control.formula
            || String(components[0].type).toLowerCase() !== control.type || steps.some(step => !step)
            || steps.some(step => String(Object.values(levels[step[1]]?.damage ?? {})[0]?.formula ?? "").replace(/\s+/g, "") !== step[2])) return null;
        control.fixed = Object.fromEntries(steps.map(step => [Number(step[1]), step[2]]));
        return {
            hazardArea: { area: { type: area.type, value: Number(area.value) }, durationSeconds: Number(fixed[1]) * { round: 6, minute: 60, hour: 3600 }[fixed[2].toLowerCase()], terrain, control, notes,
                baseRank: Number(adapted.rank) || 1, sustained: true },
            claimed: [...claimed, ...entries.map(entry => htmlToPlainText(entry).trim())]
        };
    }
    // The damage entry is the item's (Explosive Dust's 1d4 fire) for the per-square control.
    const components = adapted.damageComponents ?? [];
    if (control.kind === "caster-turn-end" && !(components.length === 1 && !components[0].category && String(components[0].formula).replace(/\s+/g, "") === `${control.count}d${control.faces}`
        && String(components[0].type).toLowerCase() === control.type)) return null;
    if (control.kind === "per-square" && !(components.length === 1 && String(components[0].formula).replace(/\s+/g, "") === (control.flat != null ? String(control.flat) : `${control.count}d${control.faces}`)
        && String(components[0].type).toLowerCase() === control.type)) return null;
    const entries = rest.length ? [...rest[0].matchAll(/<p>[\s\S]*?<\/p>/gi)].map(match => match[0].trim()) : [];
    if (entries.length > 1) return null;
    // (A flat amount steps by a flat amount: the item's own heightening.)
    if (control.flat != null) {
        const flatStep = entries.length ? STEP_FLAT.exec(entries[0]) : null;
        if (entries.length && !(flatStep && adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(flatStep[1])
            && String(Object.values(adapted.heightening.damage ?? {})[0] ?? "") === flatStep[2])) return null;
        if (flatStep) control.step = { interval: Number(flatStep[1]), flat: Number(flatStep[2]) };
        if (textNoSave) notes.push(`PF2e's item lists a ${adapted.defense.statistic[0].toUpperCase()}${adapted.defense.statistic.slice(1)} save; the text states none, so the damage applies with no save.`);
        return {
            hazardArea: { area: { type: area.type, value: Number(area.value) }, durationSeconds: Number(fixed[1]) * { round: 6, minute: 60, hour: 3600 }[fixed[2].toLowerCase()], terrain, control,
                notes: control.groundOnly ? [...notes, "Only creatures moving on the ground take the damage."] : notes, baseRank: Number(adapted.rank) || 1,
                ...(growth ? { growth } : {}), ...(textNoSave ? { textNoSave: adapted.defense.statistic } : {}), ...(unstated ? { durationRuling: "No duration is stated: 1 minute (the user's ruling)." } : {}) },
            claimed: [...claimed, ...(flatStep ? [htmlToPlainText(entries[0]).trim()] : [])]
        };
    }
    const step = entries.length ? STEP.exec(entries[0]) : null;
    if (entries.length && !(step && Number(step[4]) === control.faces)) return null;
    // The ignite formula scales itself (one die per `divisor` ranks): its Heightened entry must be that step.
    if (control.kind === "ignite" && step && !(Number(step[1]) === control.divisor && Number(step[3]) === 1 && step[2] === control.type)) return null;
    if (["per-square", "caster-turn-end"].includes(control.kind) && step) control.step = { interval: Number(step[1]), dice: Number(step[3]) };
    if (control.kind === "caster-turn-end" && textNoSave) notes.push(`PF2e's item lists a ${adapted.defense.statistic[0].toUpperCase()}${adapted.defense.statistic.slice(1)} save; the text states none, so the damage applies with no save.`);
    if (control.kind === "caster-turn-end") return {
        hazardArea: { area: { type: area.type, value: Number(area.value) }, durationSeconds: Number(fixed[1]) * { round: 6, minute: 60, hour: 3600 }[fixed[2].toLowerCase()], terrain, control, notes,
            baseRank: Number(adapted.rank) || 1, sustained: true, ...(textNoSave ? { textNoSave: adapted.defense.statistic } : {}) },
        claimed: [...claimed, ...(step ? [htmlToPlainText(entries[0]).trim()] : [])]
    };
    return {
        hazardArea: { area: { type: area.type, value: Number(area.value) }, durationSeconds: Number(fixed[1]) * { round: 6, minute: 60, hour: 3600 }[fixed[2].toLowerCase()], terrain, control, notes,
            baseRank: Number(adapted.rank) || 1 },
        claimed: [...claimed, ...(step ? [htmlToPlainText(entries[0]).trim()] : [])]
    };
}

/** The control's formula at a cast rank ("2d4[fire]", "(1d6)[persistent,fire]"). */
export function hazardFormulaAt(data, castRank) {
    const control = data.control;
    if (control.kind === "per-square" || control.kind === "caster-turn-end") {
        const steps = control.step ? Math.max(0, Math.floor((Number(castRank) - data.baseRank) / control.step.interval)) : 0;
        if (control.flat != null) return `${control.flat + steps * (control.step?.flat ?? 0)}[${control.type}]`;
        return `${control.count + steps * (control.step?.dice ?? 0)}d${control.faces}[${control.type}]`;
    }
    // (The life field's dice: the highest heightened entry at or below the cast rank.)
    if (control.kind === "life-field") {
        const rank = Object.keys(control.fixed ?? {}).map(Number).filter(value => value <= Number(castRank)).sort((x, y) => y - x)[0];
        return rank ? control.fixed[rank] : control.formula;
    }
    return `(${Math.floor(Number(castRank) / control.divisor)}d${control.faces})[persistent,${control.type}]`;
}
