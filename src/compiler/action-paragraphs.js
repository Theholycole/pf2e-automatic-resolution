// A spell whose text gives one paragraph per action count ("<span class="action-glyph">2</span> (manipulate) The spell
// deals 2d4 sonic damage to all creatures in a @Template[burst|distance:10], with a basic Fortitude save."), cast as the
// PF2e variant for that count (its item data carries the area, targets and damage). The variant's own paragraph applies;
// the others describe other variants and are set aside, and so is the sentence saying the action count decides.
// A sentence restating the variant's targets, area or damage is set aside only when it agrees with the variant's data;
// every other sentence stays for the compilers to judge.
const GLYPH_PARAGRAPH = /<p>\s*<span class="action-glyph">\s*([1-3])\s*<\/span>([\s\S]*?)<\/p>/gi;
const INTRO = /(?:number of|how many) actions you spend\b/i;
const VARIANT_NARRATION = /^You [a-z]+ [a-z ,']+, focusing on a single target or spreading out to [a-z ]+\.$/;
const NUMBER = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, ten: 10 };
const TEMPLATE = /@Template\[(?:type:)?(burst|cone|line|emanation|square)\|distance:(\d+)\](?:\{[^}]*\})?/gi;

const plain = html => String(html ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const sentences = text => text.split(/(?<=[.!?])\s+(?=[A-Z@(])/).map(value => value.trim()).filter(Boolean);

function sameArea(area, type, value) {
    // (PF2e may store an emanation as a burst with `areaType: "emanation"`.)
    return area && [area.type, area.areaType].some(kind => String(kind ?? "").toLowerCase() === type.toLowerCase()) && Number(area.value) === Number(value);
}

/** Whether a sentence only restates the variant's own data. */
function restates(sentence, adapted) {
    const area = adapted.targeting?.area ?? null;
    const target = String(adapted.targeting?.target ?? "").trim().toLowerCase();
    const range = String(adapted.targeting?.range ?? "").trim().toLowerCase();
    const components = adapted.damageComponents ?? [];
    const damageIs = (formula, type) => components.length === 1 && String(components[0].formula).replace(/\s+/g, "") === formula
        && String(components[0].type).toLowerCase() === type.toLowerCase();
    let match = /^The spell targets (one (living )?creature|up to (\w+) (living )?creatures)(?: in range| within (\d+) feet)?\.$/.exec(sentence);
    if (match) {
        const count = match[3] ? NUMBER[match[3].toLowerCase()] ?? Number(match[3]) : 1;
        const living = match[2] || match[4] ? "living " : "";
        const targetOk = count === 1 ? new RegExp(`^(?:1|one) ${living}creature$`).test(target) : new RegExp(`^up to ${count} ${living}creatures$`).test(target);
        return targetOk && !area && (!match[5] || range === `${match[5]} feet`);
    }
    // "The spell is a 30-foot cone." / "This spell is a 15-foot cone, dealing 2d6 electricity damage and 2d6 fire damage."
    match = /^(?:The|This) spell is an? (\d+)-foot (burst|cone|line|emanation|square)(?:, dealing (.+) damage)?\.$/.exec(sentence);
    if (match) {
        if (!sameArea(area, match[2], match[1])) return false;
        if (!match[3]) return true;
        const stated = match[3].split(/ damage and | damage, and |, /).map(part => /^(\d+d\d+|\d+) ([a-z]+)$/.exec(part.trim()));
        return stated.every(Boolean) && stated.length === components.length
            && stated.every(([, formula, type]) => components.some(component => String(component.formula).replace(/\s+/g, "") === formula && String(component.type).toLowerCase() === type));
    }
    // "The spell targets one living creature in range, and the damage is 10d6 void damage instead of 5d6." (Rip the Spirit's 2 actions)
    match = /^The spell targets one (living )?creature in range, and the damage is (\d+d\d+) ([a-z]+) damage instead of \d+d\d+\.$/.exec(sentence);
    if (match) return new RegExp(`^(?:1|one) ${match[1] ?? ""}creature$`).test(target) && !area && damageIs(match[2], match[3]);
    // "The spell targets all living creatures in a @Template[emanation|distance:30]." (its 3 actions)
    match = /^The spell targets all living creatures in an? @Template\[(?:type:)?(\w+)\|distance:(\d+)\](?:\{[^}]*\})?\.$/.exec(sentence);
    if (match) return /^all living creatures$/.test(target) && sameArea(area, match[1], match[2]);
    // "The spell targets all creatures in a 60-foot line." (Spiritual Torrent)
    match = /^The spell targets all creatures in an? (\d+)-foot (burst|cone|line|emanation)\.$/.exec(sentence);
    if (match) return sameArea(area, match[2], match[1]);
    match = /^The spell targets all creatures in an? @Template\[(?:type:)?(\w+)\|distance:(\d+)\](?:\{[^}]*\})?\.$/.exec(sentence);
    if (match) return sameArea(area, match[1], match[2]);
    match = /^This spell deals (\d+d\d+|\d+) ([a-z]+) damage, and its area is an? (\d+)-foot (square|burst|cone|line|emanation)\.$/.exec(sentence);
    if (match) return damageIs(match[1], match[2]) && sameArea(area, match[4], match[3]);
    match = /^This spell affects (?:a single (\d+)-foot square|all squares in an? @Template\[(?:type:)?(\w+)\|distance:(\d+)\](?:\{[^}]*\})?) and deals (\d+d\d+|\d+) ([a-z]+) damage\.$/.exec(sentence);
    if (match) return damageIs(match[4], match[5]) && (match[1] ? sameArea(area, "square", match[1]) : sameArea(area, match[2], match[3]));
    match = /^The line is (?:(\d+) feet|@Template\[(?:type:)?line\|distance:(\d+)\](?:\{[^}]*\})?) long\.$/.exec(sentence);
    if (match) return sameArea(area, "line", match[1] ?? match[2]);
    match = /^The spell is an? @Template\[(?:type:)?(\w+)\|distance:(\d+)\](?:\{[^}]*\})?\.$/.exec(sentence);
    if (match) return sameArea(area, match[1], match[2]);
    return false;
}

/**
 * "This spell deals 2d10 sonic damage, and its area is a 20-foot burst." where PF2e's variant data says otherwise (a 1d10
 * variant, or a 5-foot burst for the text's 5-foot square): the text's damage and area, when the damage is the variant's one
 * entry of the same type. (User decision: the text.) Returns the text's values, or null when the sentence isn't this form.
 */
function textOverride(sentence, adapted) {
    const match = /^This spell deals (\d+d\d+) ([a-z]+) damage, and its area is an? (\d+)-foot (square|burst|cone|line|emanation)\.$/.exec(sentence);
    const components = adapted.damageComponents ?? [];
    if (!match || components.length !== 1 || String(components[0].type).toLowerCase() !== match[2] || components[0].category != null) return null;
    return { componentId: components[0].id, formula: match[1], dataFormula: String(components[0].formula), area: { type: match[4], value: Number(match[3]) },
        dataArea: adapted.targeting?.area ? { type: String(adapted.targeting.area.type), value: Number(adapted.targeting.area.value) } : null, sourceText: sentence };
}

/**
 * Rewrites the description for the cast variant. Returns null when the spell has no action paragraphs; {html} with the
 * variant's text; or {blocked} when this isn't a single-action-count variant or a restatement disagrees with its data.
 */
export function selectActionParagraph(adapted) {
    const html = String(adapted.descriptionHTML ?? "");
    const paragraphs = [...html.matchAll(GLYPH_PARAGRAPH)];
    if (!paragraphs.length) return null;
    const time = String(adapted.activation?.time ?? "").trim();
    if (!/^[1-3]$/.test(time)) return { blocked: "not-an-action-variant" };
    const own = paragraphs.filter(paragraph => paragraph[1] === time);
    if (own.length !== 1) return { blocked: "no-paragraph-for-this-variant" };
    // The variant's paragraph: an optional "(manipulate)" trait note, then its sentences.
    const body = plain(own[0][2]).replace(/^\((?:[a-z]+(?:, [a-z]+)*)\)\s*/i, "");
    const kept = [];
    let override = null;
    for (const sentence of sentences(body)) {
        if (restates(sentence, adapted)) continue;
        const text = !override ? textOverride(sentence, adapted) : null;
        if (text) { override = text; continue; }
        // A template naming the variant's own area is that area, written out.
        const area = adapted.targeting?.area;
        const written = sentence.replace(TEMPLATE, (all, type, distance) => sameArea(area, type, distance) ? `${distance}-foot ${type.toLowerCase()}` : all);
        kept.push(written);
    }
    // The rule before the action paragraphs separates them from the opening text; the kept paragraph joins it.
    let rewritten = html.replace(/<hr\s*\/?>\s*(?=<p>\s*<span class="action-glyph">)/i, "").replace(GLYPH_PARAGRAPH, (paragraph, count) => count === time && kept.length ? `<p>${kept.join(" ")}</p>` : "")
        // "Two Rounds …" describes the 2-round variant, not this one.
        .replace(/<p>\s*<strong>\s*(?:One|Two|Three) Rounds?\s*<\/strong>[\s\S]*?<\/p>/gi, "");
    // The sentence saying the action count decides, in the opening text.
    rewritten = rewritten.replace(/<p>([\s\S]*?)<\/p>/, (paragraph, inner) => {
        const text = plain(inner);
        // The intro, and narration describing the variants as a choice ("…, focusing on a single target or spreading out to
        // damage many foes.").
        const remaining = sentences(text).filter(sentence => !INTRO.test(sentence) && !VARIANT_NARRATION.test(sentence));
        return remaining.length === sentences(text).length ? paragraph : `<p>${remaining.join(" ")}</p>`;
    });
    return { html: rewritten.replace(/<hr\s*\/?>\s*(?=<hr)/gi, ""), paragraph: body, ...(override ? { override } : {}) };
}

// Action counts stated as sentences in the opening text ("You unleash your qi as a powerful blast that deals 2d6 force damage." / "If you use 2
// actions to cast qi blast, increase the size of the cone to 30 feet and the damage to 3d6." / "If you use 3 actions …, increase the cone to 60
// feet and the damage to 4d6.") with "Heightened (+1) The damage increases by 1d6, or by 2d6 if you use 2 or 3 actions.", cast as the PF2e
// variant for that count. The variant's own numbers apply only when its data agrees with the text: the stated damage, the stated area, and
// the stated heightening step. The opening sentence's damage becomes the variant's; the "If you use" sentences are set aside.
const IF_ACTIONS = /^If you use (\d) actions to cast [a-z' ]+, increase (?:the size of )?the (cone|line|burst|emanation) to (\d+) feet and the damage to (\d+d\d+)\.$/i;
const BASE_DAMAGE = /\bdeals (\d+d\d+) ([a-z]+) damage\b/;
const ACTION_STEP = /^<p>\s*<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>\s*The damage increases by (\d+d\d+), or by (\d+d\d+) if you use 2 or 3 actions\.\s*<\/p>$/;

/** Rewrites the description for the cast variant: {html} or null. */
export function selectActionSentences(adapted) {
    const time = String(adapted.activation?.time ?? "").trim();
    if (!/^[1-3]$/.test(time)) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    const list = sentences(plain(body));
    const stated = list.map(sentence => IF_ACTIONS.exec(sentence));
    if (stated.filter(Boolean).length !== 2 || JSON.stringify(stated.filter(Boolean).map(match => match[1])) !== '["2","3"]') return null;
    const components = adapted.damageComponents ?? [];
    const area = adapted.targeting?.area;
    if (components.length !== 1 || components[0].category != null || !area) return null;
    const opening = list.findIndex(sentence => BASE_DAMAGE.test(sentence));
    const base = opening >= 0 ? BASE_DAMAGE.exec(list[opening]) : null;
    if (!base || base[2] !== String(components[0].type).toLowerCase()) return null;
    const own = stated.find(match => match?.[1] === time);
    const formula = own ? own[4] : base[1];
    // The variant's data must say what the text says for this count.
    if (String(components[0].formula).replace(/\s+/g, "") !== formula || (own && !sameArea(area, own[2], own[3]))) return null;
    // The heightening: "by 1d6, or by 2d6 if you use 2 or 3 actions" against the variant's step.
    const heightened = rest.find(section => /Heightened/.test(section));
    let step = null;
    if (heightened) {
        step = ACTION_STEP.exec(heightened);
        if (!step || rest.length !== 2) return null;
        const mine = time === "1" ? step[2] : step[3];
        if (adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== Number(step[1]) || adapted.heightening.damage?.[components[0].id] !== mine) return null;
    } else if (rest.length !== 1) return null;
    const kept = list.filter((sentence, index) => !stated[index]).map((sentence, index) => list.indexOf(sentence) === opening ? sentence.replace(BASE_DAMAGE, `deals ${formula} ${base[2]} damage`) : sentence);
    const table = rest.find(section => !/Heightened/.test(section));
    const html = `<p>${kept.join(" ")}</p><hr />${table}${step ? `<hr /><p><strong>Heightened (+${step[1]})</strong> The damage increases by ${time === "1" ? step[2] : step[3]}.</p>` : ""}`;
    return { html, sourceText: [...stated.filter(Boolean).map(match => match[0]), ...(step ? [plain(heightened)] : [])] };
}

// Two damage types by action count, with the save's riders in the text (Wronged Monk's Wrath): "…, dealing 2d6 force damage and 2d12 electricity
// damage to creatures in the area." / "If you use 2 actions to cast the spell, increase the size of the emanation to 10 feet and the damage to 3d6
// force damage and 3d12 electricity damage." (and 3) / "Each creature attempts one basic Reflex save that applies to both types of damage On a
// failed save, the creature is Deafened for 1 round; on a critical failure, the creature also takes @Damage[2d12[persistent,electricity]] damage and
// is deafened for 1 minute." with "Heightened (+2) The force damage increases by 1d6 and the electricity damage by 1d12, or 2d6 and 2d12 if you use
// 2 or 3 actions" — cast as the PF2e variant for that count (its data must say the text's numbers), written out as the basic save's four rows
// with the riders on the failing rows (a non-basic table that says the same).
const IF_ACTIONS_TWO = /^If you use (\d) actions to cast the spell, increase the size of the (cone|line|burst|emanation) to (\d+) feet and the damage to (\d+d\d+) ([a-z]+) damage and (\d+d\d+) ([a-z]+) damage\.$/;
const BASE_TWO = /^(.+?), dealing (\d+d\d+) ([a-z]+) damage and (\d+d\d+) ([a-z]+) damage to creatures in the area\.$/;
const RIDERS_TWO = /^Each creature attempts one basic (Fortitude|Reflex|Will) save that applies to both types of damage\.? On a failed save, the creature is (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{([A-Z][a-z]+)\}) for (\d+) (round|minute)s?; on a critical failure, the creature also takes (@Damage\[\d+d\d+\[persistent,[a-z]+\]\]) damage and is ([a-z]+) for (\d+) (round|minute)s?\.$/;
const STEP_TWO = /^<p>\s*<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>\s*The ([a-z]+) damage increases by (\d+d\d+) and the ([a-z]+) damage by (\d+d\d+), or (\d+d\d+) and (\d+d\d+) if you use 2 or 3 actions\.?\s*<\/p>$/;

/** {html, sourceText} or null: the variant's table (the save is no longer basic: the rows say it). */
export function selectTwoTypeActionSentences(adapted) {
    const time = String(adapted.activation?.time ?? "").trim();
    if (!/^[1-3]$/.test(time) || adapted.defense?.kind !== "save" || adapted.defense.basic !== true) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [body, ...rest] = html.split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length !== 1) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1]);
    const list = paragraphs.flatMap(paragraph => sentences(plain(paragraph.replace(/(damage) (On a failed save)/, "$1. $2"))));
    // (The rider paragraph keeps its own run-on: read it whole.)
    const riderText = plain(paragraphs.find(paragraph => /^Each creature attempts one basic/.test(plain(paragraph))) ?? "");
    const riders = RIDERS_TWO.exec(riderText);
    const stated = list.map(sentence => IF_ACTIONS_TWO.exec(sentence));
    const base = list.map(sentence => BASE_TWO.exec(sentence)).find(Boolean);
    if (!riders || !base || stated.filter(Boolean).length !== 2 || JSON.stringify(stated.filter(Boolean).map(match => match[1])) !== '["2","3"]') return null;
    if (riders[1].toLowerCase() !== adapted.defense.statistic || riders[7].toLowerCase() !== riders[3].toLowerCase()) return null;
    // Every sentence is the base, a stated count, or the riders.
    const riderSentences = sentences(riderText.replace(/(damage) (On a failed save)/, "$1. $2"));
    if (list.some(sentence => !BASE_TWO.test(sentence) && !IF_ACTIONS_TWO.test(sentence) && !riderSentences.includes(sentence))) return null;
    const own = stated.find(match => match?.[1] === time);
    const dice = own ? { [own[5]]: own[4], [own[7]]: own[6] } : { [base[3]]: base[2], [base[5]]: base[4] };
    const components = adapted.damageComponents ?? [];
    const area = adapted.targeting?.area;
    if (components.length !== 2 || components.some(component => component.category != null || dice[String(component.type).toLowerCase()] !== String(component.formula).replace(/\s+/g, ""))
        || (own && !sameArea(area, own[2], own[3])) || (!own && !area)) return null;
    // The heightening step for this count against the variant's data.
    const step = STEP_TWO.exec(rest[0]);
    if (!step || adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== Number(step[1])) return null;
    const steps = time === "1" ? { [step[2]]: step[3], [step[4]]: step[5] } : { [step[2]]: step[6], [step[4]]: step[7] };
    if (components.some(component => adapted.heightening.damage?.[component.id] !== steps[String(component.type).toLowerCase()])) return null;
    const lasting = (count, unit) => `${count} ${unit}${count === "1" ? "" : "s"}`;
    const condition = riders[2];
    return {
        html: `<p>${base[1]}. Each creature in the area takes ${dice[base[3]]} ${base[3]} damage and ${dice[base[5]]} ${base[5]} damage, depending on its ${riders[1]} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage and is ${condition} for ${lasting(riders[4], riders[5])}.</p>`
            + `<p><strong>Critical Failure</strong> The creature takes double damage and ${riders[6]} damage, and is ${condition} for ${lasting(riders[8], riders[9])}.</p><hr />`
            + `<p><strong>Heightened (+${step[1]})</strong> The damage increases by ${steps[step[2]]} ${step[2]} and ${steps[step[4]]} ${step[4]}.</p>`,
        sourceText: [...stated.filter(Boolean).map(match => match[0]), riderText, plain(rest[0])]
    };
}

// A basic save's push rider and trait option in an action variant (Elemental Annihilation Wave): "… that deals 1d6 fire damage and 3d6 bludgeoning
// damage with a basic Reflex save." / "You can replace the air trait with the metal and wood traits when you cast the spell." / (3 actions) "On a
// failed saving throw, creatures are pushed 5 feet away from you, and on a critical failure they are pushed 10 feet away and are knocked prone."
// with "Heightened (+2) The damage increases by 3d6 bludgeoning and 1d6 fire, and the distance that enemies are pushed back if you spent 3 actions
// or 2 rounds increases by 5 feet on a failed save and 10 feet on a critical failure." — the trait option is a card note; with the push, the basic
// save's four rows with the pushes (each row's own heightened distance); without it, the basic save as it is.
const BASIC_DAMAGE = /^(.+?) (?:deals|dealing) (\d+d\d+ [a-z]+ damage(?: and \d+d\d+ [a-z]+ damage)?) with a basic (Fortitude|Reflex|Will) save\.$/;
const TRAIT_SWAP = /^You can replace the ([a-z]+) trait with the ([a-z]+) and ([a-z]+) traits when you cast the spell\.$/;
const PUSH_RIDER = /^On a failed saving throw, creatures are pushed (\d+) feet away from you, and on a critical failure they are pushed (\d+) feet away and are knocked prone\.$/;
const PUSH_STEP = /^Heightened \(\+(\d)\) The damage increases by ([^,]+), and the distance that enemies are pushed back if you spent 3 actions or 2 rounds increases by (\d+) feet on a failed save and (\d+) feet on a critical failure\.?$/;

/** {html, notes, basic, pushSteps, sourceText} or null. */
export function rewriteBasicPushVariant(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [body, ...rest] = html.split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length !== 1) return null;
    const list = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].flatMap(match => sentences(plain(match[1])));
    const damage = list.map(sentence => BASIC_DAMAGE.exec(sentence)).find(Boolean);
    const swap = list.map(sentence => TRAIT_SWAP.exec(sentence)).find(Boolean);
    const push = list.map(sentence => PUSH_RIDER.exec(sentence)).find(Boolean);
    const step = PUSH_STEP.exec(plain(rest[0]));
    if (!damage || !swap || !step || damage[3].toLowerCase() !== adapted.defense.statistic) return null;
    if (list.some(sentence => sentence !== damage[0] && sentence !== swap[0] && sentence !== push?.[0])) return null;
    if (!(adapted.activation?.traits ?? []).includes(swap[1])) return null;
    // The text's step for each damage type against PF2e's: equal, or more dice of the same size at the same interval (the text over the data:
    // the card adds the missing dice at the cast rank).
    const textSteps = Object.fromEntries([...step[2].matchAll(/(\d+)d(\d+) ([a-z]+)/g)].map(match => [match[3], { dice: Number(match[1]), faces: Number(match[2]) }]));
    const corrections = [];
    for (const component of adapted.damageComponents ?? []) {
        const type = String(component.type).toLowerCase(), stated = textSteps[type], data = /^(\d+)d(\d+)$/.exec(String(adapted.heightening?.damage?.[component.id] ?? ""));
        if (!stated || !data || Number(data[2]) !== stated.faces || adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== Number(step[1])) return null;
        if (stated.dice < Number(data[1])) return null;
        if (stated.dice > Number(data[1])) corrections.push({ type, faces: stated.faces, perStep: stated.dice - Number(data[1]), interval: Number(step[1]), baseRank: Number(adapted.rank) });
    }
    if (Object.keys(textSteps).length !== (adapted.damageComponents ?? []).length) return null;
    const notes = [`You can replace the ${swap[1]} trait with the ${swap[2]} and ${swap[3]} traits when you cast the spell (the GM applies a trait's effects).`];
    const heightened = `<hr /><p><strong>Heightened (+${step[1]})</strong> The damage increases by ${step[2]}.</p>`;
    const sourceText = [swap[0], plain(rest[0]), ...(push ? [push[0]] : [])];
    if (!push) return { html: `<p>${damage[0]}</p>${heightened}`, notes, basic: true, sourceText, corrections };
    return {
        html: `<p>${damage[1]}. Each creature in the area takes ${damage[2].replace(/ damage$/, "")} damage, depending on its ${damage[3]} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage and is pushed ${push[1]} feet away from you.</p>`
            + `<p><strong>Critical Failure</strong> The creature takes double damage and is pushed ${push[2]} feet away from you and knocked @UUID[Compendium.pf2e.conditionitems.Item.j91X7x0XSomq8d60]{Prone}.</p>${heightened}`,
        notes, basic: false, corrections, pushSteps: { failure: { interval: Number(step[1]), feet: Number(step[3]) }, criticalFailure: { interval: Number(step[1]), feet: Number(step[4]) } },
        sourceText
    };
}

// A 2-or-3-action variant and a two-round variant with pushes (Psychic Outburst): "…, dealing mental damage to creatures in the area with a basic
// Will save. The number of actions you spend …" / [2] "The spell deals @Damage[6d10[mental]] damage." / [3] "The spell deals @Damage[6d10[mental]]
// damage. Creatures that fail their save are pushed 10 feet away from you (or 20 feet on a critical failure)." / "Two Rounds … The area increases to
// a @Template[type:emanation|distance:40], deals @Damage[8d10[mental]|options:area-damage] damage, and targets only enemies. Creatures that fail
// their save are pushed 10 feet away from you (20 feet on a critical failure)." — PF2e's variant for "2 to 3" (the 2- and 3-action damage the
// same: the push only when cast with 3 actions, a GM reminder) or for the two rounds (its own area and damage: enemies only, the push always),
// written out as the basic save's four rows.
const LEAD_BASIC = /^(.+?), dealing ([a-z]+) damage to creatures in the area with a basic (Fortitude|Reflex|Will) save\.$/;
const ACTIONS_LEAD = /^The number of actions you spend when Casting this Spell determines the damage and other parameters\.$/;
const DEALS_INLINE = /^The spell deals @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage\.$/;
const FAIL_PUSH = /^Creatures that fail their save are pushed (\d+) feet away from you \((?:or )?(\d+) feet on a critical failure\)\.$/;
const TWO_ROUNDS = /^<p>\s*<strong>\s*Two Rounds\s*<\/strong>\s*If you spend 3 actions Casting the Spell, you can avoid finishing the spell and spend another 2 actions on your next turn to empower the spell even further\. You can take other actions before finishing this spell, but the spell is lost if you Cast another Spell in between\. The area increases to a @Template\[type:(emanation|burst|cone)\|distance:(\d+)\], deals @Damage\[(\d+d\d+)\[([a-z]+)\]\|options:area-damage\] damage, and targets only enemies\. Creatures that fail their save are pushed (\d+) feet away from you \((?:or )?(\d+) feet on a critical failure\)\.\s*<\/p>$/;

/** {html, enemiesOnly, threeActionPush, sourceText} or null. */
export function rewriteOutburstVariant(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || !/^2 to (?:3|2 rounds)$/.test(String(adapted.activation?.time ?? "").trim())) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [body, ...rest] = html.split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length !== 1) return null;
    const paragraphs = [...body.matchAll(/<p>[\s\S]*?<\/p>/gi)].map(match => match[0].trim());
    if (paragraphs.length !== 4) return null;
    const lead = sentences(plain(paragraphs[0]));
    const leadDamage = LEAD_BASIC.exec(lead[0] ?? "");
    const two = /^<p>\s*<span class="action-glyph">2<\/span>([\s\S]*?)<\/p>$/.exec(paragraphs[1]), three = /^<p>\s*<span class="action-glyph">3<\/span>([\s\S]*?)<\/p>$/.exec(paragraphs[2]);
    const rounds = TWO_ROUNDS.exec(paragraphs[3]);
    if (!leadDamage || lead.length !== 2 || !ACTIONS_LEAD.test(lead[1]) || !two || !three || !rounds || leadDamage[3].toLowerCase() !== adapted.defense.statistic) return null;
    const twoDeals = DEALS_INLINE.exec(plain(two[1]));
    const threeParts = sentences(plain(three[1]));
    const threeDeals = DEALS_INLINE.exec(threeParts[0] ?? ""), threePush = FAIL_PUSH.exec(threeParts[1] ?? "");
    if (!twoDeals || !threeDeals || !threePush || threeParts.length !== 2 || twoDeals[1] !== threeDeals[1] || [twoDeals[2], threeDeals[2], rounds[4]].some(type => type !== leadDamage[2])) return null;
    const step = /^<p>\s*<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>\s*The damage increases by (\d+d\d+)\.\s*<\/p>$/.exec(rest[0]);
    if (!step || adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== Number(step[1]) || adapted.heightening.damage?.[components[0].id] !== step[2]) return null;
    // Which variant this is: its data says (the two rounds' area and damage, or the 2/3 actions').
    const formula = String(components[0].formula).replace(/\s+/g, ""), area = adapted.targeting?.area;
    const roundsVariant = formula === rounds[3] && sameArea(area, rounds[1], rounds[2]);
    if (!roundsVariant && formula !== twoDeals[1]) return null;
    const [fail, critical] = roundsVariant ? [rounds[5], rounds[6]] : [threePush[1], threePush[2]];
    return {
        html: `<p>${leadDamage[1]}. Each ${roundsVariant ? "enemy" : "creature"} in the area takes ${formula} ${leadDamage[2]} damage, depending on its ${leadDamage[3]} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage and is pushed ${fail} feet away from you.</p>`
            + `<p><strong>Critical Failure</strong> The creature takes double damage and is pushed ${critical} feet away from you.</p>`
            + `<hr /><p><strong>Heightened (+${step[1]})</strong> The damage increases by ${step[2]}.</p>`,
        enemiesOnly: roundsVariant, threeActionPush: !roundsVariant,
        sourceText: roundsVariant ? [plain(paragraphs[3])] : [plain(two[1]), plain(three[1]), lead[1]]
    };
}
