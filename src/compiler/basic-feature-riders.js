// A basic save's sentences that tie the spell to its caster (third-party spells, 2026-10-06), read from the text:
//   - "The damage dealt by this spell is the same type as your Arcane Cascade." (Magus+'s Wreak Havok, Mystic Bomb): the damage takes the caster's
//     Arcane Cascade stance's chosen type — force, the stance's own, when none is chosen — at the card (`damageTypeFrom`);
//   - "Creatures in a @Template[emanation 5], @Template[cone 10], or @Template[line 15] of you take 2d4 damage.": the damage sentence, the area the
//     caster's choice of those (a GM reminder: the GM places the area);
//   - "Creatures that fail their save are Off-Guard to you until the beginning of your next turn.": a note Effect on failing creatures — a –2
//     circumstance penalty to AC (PF2e's off-guard slug) against the caster's attacks only, until the caster's next turn starts.
// Returns { remainderHTML, sentences, damageTypeFrom, areaChoice, reminders, noteEffects } when at least one is read, else null.
import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";

const split = text => String(text ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
const CASCADE_TYPE = /^(?:The damage (?:dealt by this spell|of your [a-z ]+)|This spell's damage) is (?:of )?the same (?:damage )?type as your (?:@UUID\[[^\]]+\]\{)?Arcane Cascade\}?\.$/;
const TEMPLATE = String.raw`@Template\[(?:type:)?(burst|cone|emanation|line)\|distance:(\d+)\]`;
const TEMPLATE_CHOICE = new RegExp(String.raw`^Creatures in an? ${TEMPLATE}, ${TEMPLATE},? or ?${TEMPLATE} of you take (\d+d\d+) damage\.$`);
const OFF_GUARD_TO_YOU = /^(?:Creatures|A creature) that (fail|critically fail)s? (?:their|its) (?:save|saving throw) (?:are|is) @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Off-Guard\} to you until the (?:beginning|start) of your next turn\.$/;

// Ray of Light (Oracles+): "All creatures in the area must make a basic Fortitude save or take 1d6 fire damage." (the damage sentence); "Creatures with
// the shadow trait or with light blindness take a –2 status penalty to their save." (the GM's question per creature); "Creatures that fail their save
// are also Dazzled for 1 round, or Blinded for 1 round and then dazzled for 1 minute if it was a critical failure." (PF2e's conditions: Dazzled 11 rounds
// from the cast on the critical failure, under Blinded at first); "The spell leaves an ambient light in each square of the area which sheds like a torch
// for 1 minute." (the GM's light, a reminder).
const SAVE_OR_TAKE = /^All creatures in the area must make a basic (Fortitude|Reflex|Will) save or take (\d+d\d+) ([a-z]+) damage\.$/;
const SAVE_PENALTY_FOR = /^Creatures with the ([a-z]+) trait or with ([a-z ]+) take a [–−-]([1-4]) (status|circumstance) penalty to their save\.$/;
const LINK = name => String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.([A-Za-z0-9]+)\]\{${name}\}`;
const DAZZLE_OR_BLIND = new RegExp(String.raw`^Creatures that fail their save are also ${LINK("Dazzled")} for 1 round, or ${LINK("Blinded")} for 1 round and then dazzled for 1 minute if it was a critical failure\.$`);
const AMBIENT_LIGHT = /^The spell leaves an ambient light in each square of the area which sheds like a torch for (\d+) minutes?\.$/;
const condition = (slug, reference, rounds, sourceText) => ({ kind: "condition", slug, name: slug.replace(/^./, letter => letter.toUpperCase()), value: null,
    duration: { mode: "fixed", value: rounds, unit: "rounds", expiry: "turn-start", anchor: "effect-start", sourceText }, source: "description-reference", reference, raw: slug, expirationMode: "duration" });

// A third-party basic save's condition riders ("If the creature critically fails the save, it is also Enfeebled 1 until the start of your next turn.",
// "If a target critically fails the save, it's also deafened for 1 minute.", "If the target fails its save, it is also off-guard until the end of your
// next turn.", "On a failure, the target is clumsy 1 until the end of your next turn.", "On a failed save, the target is Enfeebled 1 until the start of
// your next turn (Enfeebled 2 on a critical failure).", "If the target critically fails the save, it is also Stunned 1."): PF2e's conditions on those rows
// for that time. "On a failure" holds on a critical failure too (a worse failure; user decision 2026-10-03: a row the text leaves out gets the failure's).
// A later sentence about the same condition on the critical failure replaces an earlier one (Dynamic Void Warp's three-action version).
const CONDITION_IDS = { blinded: "XgEqL1kFApUbl5Z2", clumsy: "i3OJZU2nk64Df3xm", dazzled: "TkIyaNPgTZFBCCuh", deafened: "9PR9y0bi4JPKnHPR", drained: "4D2KBtexWXa6oUMR",
    enfeebled: "MIRkyAjyBeXivMa7", fascinated: "AdPVz7rbaVSRxHFg", fatigued: "HL2l2VRSaQHu9lUw", frightened: "TBSHQspnbcqxsmjL", immobilized: "eIcWbB5o3pP6OIMe",
    "off-guard": "AJh5ex99aV6VTggg", prone: "j91X7x0XSomq8d60", sickened: "fesd1n5eVhpCSS18", slowed: "xYTAsEpcJE1Ccni3", stunned: "dfCMdR4wnpbYNTix", stupefied: "e1XGnhKNSQIm5IXg" };
const VALUED = new Set(["clumsy", "drained", "enfeebled", "frightened", "sickened", "slowed", "stunned", "stupefied"]);
const COND = String.raw`(?:@UUID\[Compendium\.pf2e\.conditionitems\.(?:Item\.)?[A-Za-z0-9]+\]\{([A-Za-z-]+)(?: (\d))?\}|(blinded|clumsy|dazzled|deafened|drained|enfeebled|fascinated|fatigued|frightened|immobilized|off-guard|prone|sickened|slowed|stunned|stupefied)(?: (\d))?)`;
const DUR = String.raw`(?: (until the (?:start|beginning|end) of (?:your|its|their) next turn|for (?:\d+|one) (?:round|minute)s?|for the duration of the spell))?`;
const RIDERS = [
    [new RegExp(String.raw`^If (?:the|a) (?:creature|target) critically fails (?:the|its) save, (?:it is|it's) also ${COND}${DUR}\.$`), ["criticalFailure"]],
    [new RegExp(String.raw`^(?:If (?:the|a) (?:creature|target) fails (?:the|its) save|On a failure|On a failed save), (?:the (?:creature|target) is|it is|it's)(?: also)? ${COND}${DUR}(?: \(${COND} on a critical failure\))?\.$`), ["failure", "criticalFailure"]]
];
function riderDuration(text, lifecycle = null) {
    if (!text) return null;
    // "for the duration of the spell": a sustained spell's, ending with it.
    if (text === "for the duration of the spell") {
        const spec = lifecycle?.durationSpec;
        return spec?.mode === "sustained" && spec.maximum?.mode === "fixed" ? { ...spec, sourceText: text, spellLifetime: true } : undefined;
    }
    const turn = /^until the (start|beginning|end) of (your|its|their) next turn$/.exec(text);
    if (turn) return { mode: "fixed", value: 1, unit: "rounds", expiry: turn[1] === "end" ? "turn-end" : "turn-start", anchor: turn[2] === "your" ? "source-turn" : "target-turn", offset: 1, sourceText: text };
    const span = /^for (\d+|one) (round|minute)s?$/.exec(text);
    const value = span[1] === "one" ? 1 : Number(span[1]);
    return { mode: "fixed", value, unit: `${span[2]}s`, expiry: span[2] === "round" ? "turn-start" : null, anchor: "effect-start", offset: 0, sourceText: text };
}
function riderCondition(name, value, durationText, sourceText, lifecycle = null) {
    const slug = String(name).toLowerCase();
    if (!CONDITION_IDS[slug] || (VALUED.has(slug) !== (value != null))) return null;
    const duration = riderDuration(durationText, lifecycle);
    if (duration === undefined) return null;
    if (duration?.spellLifetime) { const { spellLifetime, sourceText: _text, ...spec } = duration;
        return { kind: "condition", slug, name: slug.replace(/^./, letter => letter.toUpperCase()), value: value == null ? null : Number(value), duration: spec,
            endsWhen: [{ event: "spell-ended" }], expirationMode: "first", source: "description-reference", reference: CONDITION_IDS[slug], raw: sourceText }; }
    // (A condition with no value and no end — Prone aside — needs a stated time; Stunned ends itself.)
    if (!duration && !["stunned", "prone"].includes(slug)) return null;
    return { kind: "condition", slug, name: slug.replace(/^./, letter => letter.toUpperCase()), value: value == null ? null : Number(value), duration,
        source: "description-reference", reference: CONDITION_IDS[slug], raw: sourceText, ...(duration ? { expirationMode: "duration" } : {}) };
}
/** The rider sentences a basic save's text adds: {degree: [conditions]} for the claimed sentences, or null when a sentence isn't one. */
export function readConditionRider(sentence, lifecycle = null) {
    for (const [pattern, degrees] of RIDERS) {
        const match = pattern.exec(sentence);
        if (!match) continue;
        const main = riderCondition(match[1] ?? match[3], match[2] ?? match[4], match[5], sentence, lifecycle);
        if (!main) return null;
        const critical = match[6] || match[8] ? riderCondition(match[6] ?? match[8], match[7] ?? match[9], match[5], sentence, lifecycle) : null;
        if ((match[6] || match[8]) && !critical) return null;
        return Object.fromEntries(degrees.map(degree => [degree, [degree === "criticalFailure" && critical ? critical : main]]));
    }
    return null;
}

export function compileBasicFeatureRiders(adapted) {
    if (adapted.defense?.kind !== "save" || !adapted.defense.basic) return null;
    const all = split(htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML)));
    const claimed = [], kept = [], reminders = [];
    let damageTypeFrom = null, areaChoice = null;
    const noteEffects = { failure: [], criticalFailure: [] };
    const effects = { failure: [], criticalFailure: [] };
    let saveAdjustment = null;
    const components = adapted.damageComponents ?? [];
    for (const sentence of all) {
        let m;
        if (CASCADE_TYPE.test(sentence) && components.length && components.every(component => component.type === "untyped" || !component.type)) {
            damageTypeFrom = { kind: "arcane-cascade", fallback: "force", sourceText: sentence };
            claimed.push(sentence);
        } else if ((m = TEMPLATE_CHOICE.exec(sentence)) && components.length === 1 && String(components[0].formula).replace(/\s+/g, "") === m[7]) {
            areaChoice = [[m[1], m[2]], [m[3], m[4]], [m[5], m[6]]].map(([shape, distance]) => ({ shape, distance: Number(distance) }));
            reminders.push({ kind: "area-choice", text: `Area: the caster chooses ${areaChoice.map(area => `a ${area.distance}-foot ${area.shape}`).join(", ").replace(/, ([^,]+)$/, ", or $1")} of themself. Place it, then target the creatures in it.`, sourceText: sentence });
            claimed.push(sentence);
            // (The damage sentence, kept for the save gate without its areas.)
            kept.push(`Creatures in the area take ${m[7]} damage.`);
        } else if ((m = OFF_GUARD_TO_YOU.exec(sentence))) {
            const note = { label: "Off-guard to the caster", text: "Off-guard against the caster's attacks until the start of the caster's next turn.", sourceText: sentence,
                rules: [{ key: "FlatModifier", selector: "ac", type: "circumstance", slug: "off-guard", value: -2, predicate: ["origin:signature:{caster-signature}"] }],
                duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-start", anchor: "source-turn", sourceText: "until the beginning of your next turn" } };
            for (const degree of m[1] === "fail" ? ["failure", "criticalFailure"] : ["criticalFailure"]) noteEffects[degree].push(note);
            claimed.push(sentence);
        } else if ((m = SAVE_OR_TAKE.exec(sentence)) && m[1].toLowerCase() === adapted.defense.statistic && components.length === 1
            && String(components[0].formula).replace(/\s+/g, "") === m[2] && String(components[0].type).toLowerCase() === m[3]) {
            claimed.push(sentence);
            kept.push(`Creatures in the area take ${m[2]} ${m[3]} damage.`);
        } else if ((m = SAVE_PENALTY_FOR.exec(sentence))) {
            const value = -Number(m[3]);
            saveAdjustment = { question: `Does the creature have the ${m[1]} trait or ${m[2]}? If so, it gets a −${m[3]} ${m[4]} penalty to its save.`, modifierType: m[4], appliesTo: "save",
                choices: [{ label: `Yes (−${m[3]})`, value }, { label: "No", value: 0 }], sourceText: sentence };
            claimed.push(sentence);
        } else if ((m = DAZZLE_OR_BLIND.exec(sentence))) {
            effects.failure.push(condition("dazzled", m[1], 1, "Dazzled for 1 round"));
            effects.criticalFailure.push(condition("blinded", m[2], 1, "Blinded for 1 round"), condition("dazzled", m[1], 11, "for 1 round and then dazzled for 1 minute"));
            claimed.push(sentence);
        } else if ((m = readConditionRider(sentence, adapted.lifecycle))) {
            for (const [degree, list] of Object.entries(m)) for (const effect of list) {
                // (A later sentence about the same condition on that row replaces the earlier one.)
                effects[degree] = [...effects[degree].filter(entry => entry.slug !== effect.slug), effect];
            }
            claimed.push(sentence);
        } else if (/^You push into the target's mind and daze it with a mental jolt\.$/.test(sentence) && claimed.length === 0 && all.some(other => readConditionRider(other))) {
            // (Dynamic Daze's opening narration: "push" moves no one.)
            claimed.push(sentence);
        } else if (/^The target is also more likely to become [a-z]+\.$/.test(sentence) && all.some(other => readConditionRider(other))) {
            claimed.push(sentence);
        } else if ((m = AMBIENT_LIGHT.exec(sentence))) {
            reminders.push({ kind: "area-light", text: `Light the area's squares like torches (bright light 20 feet, dim 20 more) for ${m[1]} minute${m[1] === "1" ? "" : "s"}; the module doesn't place the light.`, sourceText: sentence });
            claimed.push(sentence);
        } else kept.push(sentence);
    }
    // "Heightened (+1) Increase the fire damage by 1d6 and the distance of the line by 5 feet.": the line's length at the cast rank (the caster places it).
    const lineStep = /Heightened \(\+1\)\s*Increase the [a-z]+ damage by \d+d\d+ and the distance of the line by (\d+) feet\./.exec(htmlToPlainText(String(adapted.descriptionHTML ?? "")).replace(/\s+/g, " "));
    if (lineStep && claimed.length && adapted.targeting?.area?.type === "line")
        reminders.push({ kind: "area-size", text: `The line is ${adapted.targeting.area.value} feet, plus ${lineStep[1]} feet for each rank above ${adapted.rank}; place it at the cast rank's length.`, sourceText: lineStep[0] });
    if (!claimed.length) return null;
    return { remainderHTML: kept.join(" "), sentences: claimed, damageTypeFrom, areaChoice, reminders, noteEffects, effects, saveAdjustment };
}
