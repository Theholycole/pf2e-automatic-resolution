// A spell that waits for a trigger, then makes the triggering creature save and ends:
//   Animus Mine: "The first creature that uses a magical mental effect against you triggers the animus mine, causing the
//   spell to end. The animus mine deals 4d8 mental damage to the triggering creature, which must attempt a Will save."
//   Bandit's Doom: "When a creature attempts to take the target into its possession, it takes 8d8 mental damage and is
//   doomed, depending on the result of its Will save. The spell then ends."
// Casting sets a marker tracked in Ongoing spells; its "Trigger" control opens an ordinary save card for the creature the
// GM targets. What the GM judges (who triggered it, suppression, excluded creatures) is shown as notes.
import { htmlToPlainText } from "./description-parser.js";

const TRIGGER_FIRST = /^The first creature that (.+?) triggers the [a-z' ]+, causing the spell to end\.$/;
const SAVE_FIRST = /^The [a-z' ]+ deals (\d+d\d+) ([a-z]+) damage to the triggering creature, which must attempt an? (Fortitude|Reflex|Will) save\.$/;
const TRIGGER_WHEN = /^When a creature (.+?), it takes (\d+d\d+) ([a-z]+) damage and is [a-z]+, depending on the result of its (Fortitude|Reflex|Will) save\.$/;
const THEN_ENDS = /^The spell then ends\.$/;
// A trigger that doesn't end the spell: every creature doing it during the duration saves (Crescent Scepter).
const TRIGGER_REPEAT = /^(?:If|Whenever|Each time) a creature (.+?) during the spell's duration, it must attempt an? (Fortitude|Reflex|Will) save\.$/;
// "Frightened 1, the penalty applying to its attack roll": the condition comes before the triggering attack.
const ATTACK_TIMING = /, the penalty applying to its attack roll(?=\.)/;
const NOTES = [
    /^You can Sustain the spell to suppress [^.]+\.$/,
    /^You can Dismiss the spell\.$/,
    /^You can choose up to \d+ creatures when you cast this spell; if you do, those creatures can [^.;]+ without triggering the ward\.$/
];
const ONLY_ONE = /^You can only have one [a-z' ]+ active at a time\.$/;
const SUPERSEDES = /^If you cast the spell again, the newer casting supersedes the older\.$/;
const RULE_WORDS = /\d|\b(?:damage|save|condition|bonus|penalty|immune|Sustain|Dismiss|counteract|can't|must|until|whenever|trigger)|\beach (?:turn|round|time)\b|\beach of\b/i;
// A row sentence about the caster, not the triggering creature ("You're unaffected by the triggering mental effect.").
const CASTER_ROW = /^You(?:'re| are) unaffected by the triggering [a-z ]+\.$/;

const sentencesOf = html => htmlToPlainText(html).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);

// The marker's duration: a timed spell's, or "until the beginning of your next turn".
function markerDuration(duration) {
    const text = String(duration ?? "").trim().toLowerCase();
    if (/^until the (?:beginning|start) of your next turn$/.test(text)) return { value: 1, unit: "rounds", expiry: "turn-start" };
    return null;
}

function seconds(duration) {
    const match = /^(\d+) (minute|hour|day|week|month)s?$/.exec(String(duration ?? "").trim().toLowerCase());
    if (!match) return null;
    return Number(match[1]) * { minute: 60, hour: 3600, day: 86400, week: 604800, month: 2592000 }[match[2]];
}

/** Returns {html, target, storedTrigger} with the preamble rewritten to the triggering creature's save, or null. */
export function extractStoredTrigger(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || adapted.targeting?.area) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const split = html.search(/<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i);
    if (split < 0) return null;
    const preamble = sentencesOf(html.slice(0, split).replace(/<hr\b[^>]*>/gi, ""));
    const components = adapted.damageComponents ?? [];
    const one = components.length === 1 && !components[0].category ? components[0] : null;
    const matches = (formula, type, save) => one && String(one.formula).replace(/\s+/g, "") === formula && String(one.type).toLowerCase() === type.toLowerCase()
        && save.toLowerCase() === adapted.defense.statistic;
    let trigger = null, damage = null, ends = false, onlyOne = false, supersedes = false, narrated = 0, repeats = false;
    const notes = [];
    for (const sentence of preamble) {
        let match;
        if (!trigger && !components.length && (match = TRIGGER_REPEAT.exec(sentence))) {
            if (match[2].toLowerCase() !== adapted.defense.statistic) return null;
            trigger = `If a creature ${match[1]}.`; damage = sentence; repeats = true; continue;
        }
        if (!trigger && (match = TRIGGER_FIRST.exec(sentence))) { trigger = `The first creature that ${match[1]}.`; ends = true; continue; }
        if (!damage && (match = SAVE_FIRST.exec(sentence))) { if (!matches(match[1], match[2], match[3])) return null; damage = sentence; continue; }
        if (!trigger && (match = TRIGGER_WHEN.exec(sentence))) { if (!matches(match[2], match[3], match[4])) return null; trigger = `When a creature ${match[1]}.`; damage = sentence; continue; }
        if (THEN_ENDS.test(sentence) && trigger) { ends = true; continue; }
        if (NOTES.some(pattern => pattern.test(sentence))) { notes.push(sentence); continue; }
        if (ONLY_ONE.test(sentence)) { onlyOne = true; continue; }
        if (SUPERSEDES.test(sentence)) { supersedes = true; continue; }
        if (!trigger && narrated < 1 && !RULE_WORDS.test(sentence)) { narrated++; continue; }
        return null;
    }
    const durationSeconds = seconds(adapted.lifecycle?.duration);
    const turnDuration = durationSeconds ? null : markerDuration(adapted.lifecycle?.duration);
    if (!trigger || !damage || ends === repeats || !(durationSeconds || turnDuration) || onlyOne !== supersedes) return null;
    // A caster sentence in a result row is a note for that result.
    let rows = html.slice(split);
    const rowNotes = [];
    // Only for a trigger that is an attack: its condition applies before that attack roll.
    if (/\battack\b/.test(trigger) && ATTACK_TIMING.test(htmlToPlainText(rows))) {
        rows = rows.replace(ATTACK_TIMING, "");
        notes.push("The condition's penalty applies to the triggering attack roll.");
    }
    rows = rows.replace(/(<p>\s*<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>)([\s\S]*?)(<\/p>)/gi, (whole, head, degree, body, end) => {
        const kept = [];
        for (const sentence of htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean)) {
            if (CASTER_ROW.test(sentence)) rowNotes.push({ degree: degree.toLowerCase().replace(/ (\w)/, (_, c) => c.toUpperCase()), text: sentence });
            else kept.push(sentence);
        }
        return rowNotes.length && kept.length ? `${head} ${body.replace(/\s*You(?:'re| are) unaffected by the triggering [a-z ]+\./, "")}${end}` : whole;
    });
    const statistic = adapted.defense.statistic[0].toUpperCase() + adapted.defense.statistic.slice(1);
    return {
        html: `<p>${one ? `The target takes ${one.formula} ${String(one.type).toLowerCase()} damage and must attempt` : "The target must attempt"} a ${statistic} save.</p><hr />${rows}`,
        target: "1 creature",
        // The cast's own Target (an item, or blank for the caster); the save is the triggering creature's.
        storedTrigger: { trigger, endsOnTrigger: !repeats, notes, rowNotes, supersedes, durationSeconds, markerDuration: turnDuration, castTarget: String(adapted.targeting?.target ?? "").trim() || null, sourceText: damage }
    };
}

// A trigger held on the cast's own target: the target takes the damage (basic save) when it does something.
//   Needle of Vengeance: "Name yourself or one of your allies. The target takes 2 mental damage any time it uses a hostile
//   action against the named creature, with a basic Will save." (sustained; any number of times)
//   Forbidden Thought: "Choose "Strike," "Stride," "Cast a Spell," or a specific action you know the creature to have (…).
//   If the creature attempts that action on its next turn, it must surmount your lock to do so, causing it to take 2d6
//   mental damage (with a basic Will save). The target is then temporarily immune for 1 minute." (once, on its next turn)
// The caster's choice (the named creature, the locked action) is a note on the marker, which goes on the target.
const HELD_REPEAT = /^The target takes (\d+d\d+|\d+) ([a-z]+) damage any time it (.+?), with a basic (Fortitude|Reflex|Will) save\.$/;
const HELD_NEXT_TURN = /^If the (?:creature|target) (.+?) on its next turn, (?:it must [a-z ]+ to do so, )?causing it to take (\d+d\d+|\d+) ([a-z]+) damage \(with a basic (Fortitude|Reflex|Will) save\)\.$/;
const HELD_CHOICES = [
    /^Name yourself or one of your allies\.$/,
    /^Choose "[^"]+," "[^"]+," "[^"]+," or a specific action you know the creature to have(?: \([^)]*\))?\.$/
];
const HELD_IMMUNITY = /^The target is then temporarily immune for (\d+) (minute|hour|day)s?\.$/;

export function extractHeldTrigger(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area) return null;
    if (!/^(?:1|one) (?:creature|enemy)$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const [component] = components;
    const html = String(adapted.descriptionHTML ?? "");
    const body = html.split(/<strong\b[^>]*>\s*Heightened\b/i)[0];
    if (/<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i.test(body)) return null;
    const sentences = htmlToPlainText(body.replace(/<hr\b[^>]*>/gi, "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z"])/).filter(Boolean);
    let trigger = null, repeats = null, immunity = null, narrated = 0;
    const notes = [], narration = [];
    for (const sentence of sentences) {
        let match;
        if (!trigger && (match = HELD_REPEAT.exec(sentence))) {
            if (match[1] !== String(component.formula).replace(/\s+/g, "") || match[2] !== String(component.type).toLowerCase() || match[4].toLowerCase() !== adapted.defense.statistic) return null;
            trigger = `The target ${match[3]}.`; repeats = true; continue;
        }
        if (!trigger && (match = HELD_NEXT_TURN.exec(sentence))) {
            if (match[2] !== String(component.formula).replace(/\s+/g, "") || match[3] !== String(component.type).toLowerCase() || match[4].toLowerCase() !== adapted.defense.statistic) return null;
            trigger = `The target ${match[1]} on its next turn.`; repeats = false; continue;
        }
        if (HELD_CHOICES.some(pattern => pattern.test(sentence))) { notes.push(`The caster chooses: ${sentence}`); continue; }
        if ((match = HELD_IMMUNITY.exec(sentence)) && trigger && !immunity) { immunity = { value: Number(match[1]), unit: `${match[2]}s`, sourceText: sentence }; continue; }
        narration.push(sentence);
    }
    if (!trigger || notes.length !== 1) return null;
    // One opening sentence of narration; it may only describe the trigger ("… whenever it tries to attack …").
    for (const sentence of narration) {
        if (++narrated > 1 || /\d|\b(?:damage|save|condition|bonus|penalty|immune|Sustain|Dismiss|counteract|can't|must|until)\b/i.test(sentence)) return null;
    }
    // Sustained (any number of times while it lasts), or once on the target's next turn.
    const sustained = adapted.lifecycle?.sustained === true;
    const durationSeconds = sustained ? seconds(adapted.lifecycle?.duration) : null;
    if (repeats ? !(sustained && durationSeconds) : (sustained || String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const statistic = adapted.defense.statistic[0].toUpperCase() + adapted.defense.statistic.slice(1);
    return {
        html: `<p>The target takes ${component.formula} ${String(component.type).toLowerCase()} damage with a basic ${statistic} save.</p>`,
        target: String(adapted.targeting.target).trim(),
        storedTrigger: { held: true, trigger, endsOnTrigger: !repeats, notes, rowNotes: [], supersedes: false, sustained,
            durationSeconds, markerDuration: repeats ? null : { value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 1 },
            immunity, castTarget: String(adapted.targeting.target).trim(), sourceText: trigger }
    };
}

// A sustained aura whose trigger makes an enemy save (Gift of the Anemos): "When an enemy in the aura critically fails a Strike against you,
// they must succeed at a Reflex save or become Off-Guard until the end of your next turn." The marker stays on the caster while it's
// sustained; each trigger opens a save card for the creature the GM targets. "When you cast or sustain this spell, you can either Step,
// … or jump 10 feet …" is the caster's option, a note on the marker.
const AURA_TRIGGER = /^When an enemy in the aura (.+?), (?:they|it) must succeed at an? (Fortitude|Reflex|Will) save or become (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[^}]+\}) (until the end of your next turn|for \d+ rounds?)\.$/;
const AURA_OPTIONS = /^When you cast or sustain this spell, you can either [^.]+\.$/;

export function extractAuraTrigger(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || adapted.targeting?.area?.type !== "emanation" || String(adapted.targeting?.target ?? "").trim()) return null;
    if (!adapted.lifecycle?.sustained || (adapted.damageComponents ?? []).length) return null;
    const durationSeconds = seconds(adapted.lifecycle?.duration);
    const html = String(adapted.descriptionHTML ?? "");
    if (!durationSeconds || /<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i.test(html)) return null;
    const links = [];
    const plain = htmlToPlainText(html.split(/<hr\b[^>]*>\s*<p>\s*<strong>\s*Heightened\b/i)[0].replace(/@UUID\[[^\]]+\]\{[^}]+\}/g, link => `@@${links.push(link) - 1}@@`))
        .replace(/\s+/g, " ").trim();
    const unmask = text => text.replace(/@@(\d+)@@/g, (_, index) => links[Number(index)]);
    let trigger = null, narrated = 0;
    const notes = [];
    for (const sentence of plain.split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean).map(unmask)) {
        const match = AURA_TRIGGER.exec(sentence);
        if (match && !trigger) { if (match[2].toLowerCase() !== adapted.defense.statistic) return null; trigger = { event: match[1], condition: match[3], lasts: match[4], sourceText: sentence }; continue; }
        const labelled = sentence.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1");
        if (AURA_OPTIONS.test(labelled) && !notes.length) { notes.push(labelled); continue; }
        if (!trigger && narrated < 1 && !RULE_WORDS.test(sentence)) { narrated++; continue; }
        return null;
    }
    if (!trigger) return null;
    const statistic = adapted.defense.statistic[0].toUpperCase() + adapted.defense.statistic.slice(1);
    const affected = `The target is ${trigger.condition} ${trigger.lasts}.`;
    return {
        html: `<p>The target must attempt a ${statistic} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> ${affected}</p><p><strong>Critical Failure</strong> ${affected}</p>`,
        target: "1 creature",
        storedTrigger: { trigger: `An enemy in the aura ${trigger.event}.`, endsOnTrigger: false, notes, rowNotes: [], supersedes: false, durationSeconds, markerDuration: null,
            aura: true, sustained: true, castTarget: null, sourceText: trigger.sourceText }
    };
}

// A caster Effect whose Sustain can end it with a basic save on one creature (Draconic Barrage): "Choose fire, force, mental, or spirit damage
// when you Cast the Spell. For the duration of the spell, your Strikes with weapons or unarmed attacks deal 1 additional damage of the chosen
// type, … You can Sustain the spell to change the damage type." with the linked Effect, then "In addition, you can Sustain the spell to have
// the dragons fly off to bombard a creature within 60 feet. That creature takes 2d4 damage of the chosen type (basic Reflex save). Once the
// dragons have been used in this way, they wink out of existence and the spell ends." PF2e's Effect is the marker (its damage type is the
// caster's toggle); the bombard is a Trigger control opening the basic save, of the Effect's type, and ending the spell.
const EFFECT_TYPES = /^Choose ((?:[a-z]+, )+or [a-z]+) damage when you Cast the Spell\.$/;
const EFFECT_STRIKES = /^For the duration of the spell, your Strikes with weapons or unarmed attacks deal (\d+) additional damage of the chosen type(?:, as [a-z' ]+)?\.$/;
const EFFECT_CHANGE = /^You can Sustain the spell to change the damage type\.$/;
const BOMBARD = /^In addition, you can Sustain the spell to have the [a-z]+ fly off to bombard a creature within (\d+) feet\.$/;
const BOMBARD_SAVE = /^That creature takes (\d+d\d+) damage of the chosen type \(basic (Fortitude|Reflex|Will) save\)\.$/;
const BOMBARD_ENDS = /^Once the [a-z]+ have been used in this way, they wink out of existence and the spell ends\.$/;

export function extractEffectTrigger(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim()) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category || String(components[0].type).toLowerCase() !== "untyped") return null;
    const durationSeconds = seconds(adapted.lifecycle?.duration);
    const html = String(adapted.descriptionHTML ?? "");
    const links = [...html.matchAll(/@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}/g)].map(match => match[0]);
    if (!durationSeconds || links.length !== 1) return null;
    const sentences = htmlToPlainText(html.split(/<hr\b[^>]*>\s*<p>\s*<strong>\s*Heightened\b/i)[0].replace(links[0], "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    let types = null, strikes = null, change = false, bombard = null, save = null, ends = false, narrated = 0;
    for (const sentence of sentences) {
        let match;
        if (!types && (match = EFFECT_TYPES.exec(sentence))) { types = match[1].replace(/,? or /, ", ").split(/,\s*/); continue; }
        if (types && !strikes && (match = EFFECT_STRIKES.exec(sentence))) { strikes = { amount: Number(match[1]), sourceText: sentence }; continue; }
        if (strikes && EFFECT_CHANGE.test(sentence)) { change = true; continue; }
        if (!bombard && (match = BOMBARD.exec(sentence))) { bombard = { range: Number(match[1]), sourceText: sentence }; continue; }
        if (bombard && !save && (match = BOMBARD_SAVE.exec(sentence))) {
            if (match[1] !== String(components[0].formula).replace(/\s+/g, "") || match[2].toLowerCase() !== adapted.defense.statistic) return null;
            save = sentence; continue;
        }
        if (save && BOMBARD_ENDS.test(sentence)) { ends = true; continue; }
        if (!types && narrated < 1 && !RULE_WORDS.test(sentence)) { narrated++; continue; }
        return null;
    }
    if (!types || !strikes || !bombard || !save || !ends) return null;
    const statistic = adapted.defense.statistic[0].toUpperCase() + adapted.defense.statistic.slice(1);
    return {
        html: `<p>The target takes ${components[0].formula} damage (basic ${statistic} save).</p>`,
        target: "1 creature",
        storedTrigger: { trigger: `You Sustain the spell to bombard a creature within ${bombard.range} feet.`, endsOnTrigger: true, notes: [...(change ? ["You can Sustain the spell to change the damage type (the Effect's toggle)."] : [])],
            rowNotes: [], supersedes: false, durationSeconds, markerDuration: null, castTarget: null, sourceText: save,
            effectLink: links[0], effectTypes: types, strikeAmount: strikes.amount }
    };
}

// A summoned shield that explodes on its Shield Block (Glass Shield): "This counts as using the Raise a Shield action, giving you a +1
// circumstance bonus to AC until the start of your next turn, but it doesn't require a hand to use. You can Shield Block with the glass shield.
// It has Hardness 2. … When you Shield Block, the shield explodes in a shower of glass. If creature that broke it is within 5 feet, the shards
// deal 1d4 piercing damage to that creature with a basic Reflex save. After you use Shield Block, the spell ends and you can't cast it again for
// 10 minutes." PF2e's shield Effect is the marker (proved below); the explosion is the Trigger's basic save, and the spell ends.
const SHIELD_RAISE = /^This counts as using the Raise a Shield action, giving you a \+(\d) circumstance bonus to AC until the start of your next turn, but it doesn't require a hand to use\.$/;
const SHIELD_BLOCK = /^You can Shield Block with the [a-z ]+\.$/;
const SHIELD_HARDNESS = /^It has Hardness (\d+)\.$/;
const SHIELD_MAGIC = /^You can use the spell's reaction to reduce damage from any spell or magical effect, even if it doesn't deal physical damage\.$/;
const SHIELD_EXPLODES = /^When you Shield Block, the shield explodes in a shower of [a-z]+\.$/;
const SHIELD_SAVE = /^If (?:the )?creature that broke it is within (\d+) feet, the shards deal (\d+d\d+) ([a-z]+) damage to that creature with a basic (Fortitude|Reflex|Will) save\.$/;
const SHIELD_ENDS = /^After you use Shield Block, the spell ends and you can't cast it again for (\d+) (minute|hour)s?\.$/;
const SHIELD_HEIGHTENED = /^Heightened \((\d+)(?:st|nd|rd|th)\) The shield has Hardness (\d+), and the damage increases to (\d+d\d+)\.$/;

export function extractShieldTrigger(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim()) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const turnDuration = markerDuration(adapted.lifecycle?.duration);
    const html = String(adapted.descriptionHTML ?? "");
    const links = [...html.matchAll(/@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}/g)].map(match => match[0]);
    if (!turnDuration || links.length !== 1) return null;
    const [base, ...heightenedBlocks] = html.split(/<hr\b[^>]*>/i);
    const text = htmlToPlainText(base.replace(links[0], "")).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim();
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    let raise = null, block = false, hardness = null, magic = false, explodes = false, save = null, ends = null, narrated = 0;
    for (const sentence of sentences) {
        let match;
        if (!raise && (match = SHIELD_RAISE.exec(sentence))) { raise = Number(match[1]); continue; }
        if (raise && SHIELD_BLOCK.test(sentence)) { block = true; continue; }
        if (block && hardness == null && (match = SHIELD_HARDNESS.exec(sentence))) { hardness = Number(match[1]); continue; }
        if (block && SHIELD_MAGIC.test(sentence)) { magic = true; continue; }
        if (block && SHIELD_EXPLODES.test(sentence)) { explodes = true; continue; }
        if (explodes && !save && (match = SHIELD_SAVE.exec(sentence))) {
            if (match[2] !== String(components[0].formula).replace(/\s+/g, "") || match[3] !== String(components[0].type).toLowerCase() || match[4].toLowerCase() !== adapted.defense.statistic) return null;
            save = { range: Number(match[1]), sourceText: sentence }; continue;
        }
        if (save && !ends && (match = SHIELD_ENDS.exec(sentence))) { ends = { value: Number(match[1]), unit: `${match[2]}s`, sourceText: sentence }; continue; }
        if (!raise && narrated < 1 && !RULE_WORDS.test(sentence)) { narrated++; continue; }
        return null;
    }
    if (!raise || !block || hardness == null || !save || !ends) return null;
    // Fixed-rank Heightened entries: each a Hardness and the item's damage at that rank.
    const levels = adapted.heightening?.levels ?? {};
    const hardnessByRank = { [adapted.rank ?? 1]: hardness };
    for (const block of heightenedBlocks) {
        for (const paragraph of block.split(/<\/p>/i).map(value => htmlToPlainText(value).replace(/\s+/g, " ").trim()).filter(Boolean)) {
            const match = SHIELD_HEIGHTENED.exec(paragraph);
            if (!match) return null;
            const levelDamage = Object.values(levels?.[match[1]]?.damage ?? {})[0];
            if (!levelDamage || String(levelDamage.formula).replace(/\s+/g, "") !== match[3]) return null;
            hardnessByRank[match[1]] = Number(match[2]);
        }
    }
    const statistic = adapted.defense.statistic[0].toUpperCase() + adapted.defense.statistic.slice(1);
    return {
        html: `<p>The target takes ${components[0].formula} ${String(components[0].type).toLowerCase()} damage (basic ${statistic} save).</p>`,
        target: "1 creature",
        storedTrigger: { trigger: "You Shield Block with the spell's shield: it explodes.", endsOnTrigger: true,
            notes: [`Only the creature that broke the shield, if it's within ${save.range} feet, saves.`, ...(magic ? ["You can use the shield's reaction against any spell or magical effect, even one that doesn't deal physical damage."] : []),
                `After the Shield Block, you can't cast it again for ${ends.value} ${ends.unit.replace(/s$/, ends.value === 1 ? "" : "s")}.`],
            rowNotes: [], supersedes: false, durationSeconds: null, markerDuration: turnDuration, castTarget: null, sourceText: save.sourceText,
            effectLink: links[0], shield: { ac: raise, hardnessByRank } }
    };
}

// A pact held on the target (Pact Broker): "If the target accepts and doesn't take hostile actions against you and your allies during
// the hex's duration, you take a –1 status penalty to Deception checks to Lie to them. If they refuse and take a hostile action against
// you or an ally during the hex's duration, they must first attempt a Will save. If they accepted the offer and then take a hostile action
// …, they must first attempt a Will save and treat the result as one category worse. Regardless of the outcome, the target is then
// temporarily immune for 1 minute." with a degree table. The marker goes on the target; each hostile action is an Ongoing control that
// opens the target's save, whose card asks the GM whether it had accepted (one degree worse); then it's immune for the stated time.
// The caster's Deception penalty is a note.
const PACT_PEACE = /^If the target accepts and doesn't take hostile actions against you and your allies during the (?:hex|spell)'s duration, you take a [–−-](\d) status penalty to Deception checks to Lie to them\.$/;
const PACT_REFUSE = /^If they refuse and take a hostile action against you or an ally during the (?:hex|spell)'s duration, they must first attempt an? (Fortitude|Reflex|Will) save\.$/;
const PACT_ACCEPTED = /^If they accepted the offer and then take a hostile action against you or an ally during the (?:hex|spell)'s duration, they must first attempt an? (Fortitude|Reflex|Will) save and treat the result as one category worse\.$/;
const PACT_IMMUNE = /^Regardless of the outcome, the target is then temporarily immune for (\d+) (minute|hour)s?\.$/;
const WORSE = { criticalSuccess: "success", success: "failure", failure: "criticalFailure", criticalFailure: "criticalFailure" };

export function extractPactTrigger(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || adapted.targeting?.area) return null;
    if (!/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim()) || adapted.lifecycle?.sustained !== true) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const split = html.search(/<p>\s*<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i);
    if (split < 0) return null;
    const preamble = sentencesOf(html.slice(0, split));
    const peace = preamble.findIndex(sentence => PACT_PEACE.test(sentence));
    if (peace < 0 || preamble.length !== peace + 4) return null;
    const refuse = PACT_REFUSE.exec(preamble[peace + 1]), accepted = PACT_ACCEPTED.exec(preamble[peace + 2]), immune = PACT_IMMUNE.exec(preamble[peace + 3]);
    if (!refuse || !accepted || !immune || refuse[1] !== accepted[1] || refuse[1].toLowerCase() !== adapted.defense.statistic) return null;
    if (preamble.slice(0, peace).some(sentence => RULE_WORDS.test(sentence))) return null;
    const durationSeconds = seconds(adapted.lifecycle?.duration);
    if (!durationSeconds) return null;
    const statistic = refuse[1];
    // The rows' one Effect link (after the table) belongs to the failure row, which the critical failure inherits.
    let rows = html.slice(split);
    const link = /<p>\s*(@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\})\s*<\/p>/.exec(rows);
    if (link) rows = rows.replace(link[0], "").replace(/(<p>\s*<strong>\s*Failure\s*<\/strong>[\s\S]*?)(<\/p>)/i, `$1 ${link[1]}$2`);
    // "The target takes 2d4 mental damage and a –1 status penalty …": the item's damage entry, as the table's full damage.
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const own = new RegExp(String.raw`(<strong>\s*Failure\s*<\/strong>\s*The target takes )${String(components[0].formula).replace(/\s+/g, "")} ${String(components[0].type).toLowerCase()} damage and`);
    if (!own.test(rows)) return null;
    rows = rows.replace(own, "$1full damage and");
    return {
        html: `<p>The target must attempt a ${statistic} save.</p><hr />${rows}`,
        target: "1 creature",
        storedTrigger: { held: true, trigger: "The target takes a hostile action against you or an ally.", endsOnTrigger: false, sustained: true, durationSeconds, markerDuration: null,
            notes: [`If the target accepted and stays peaceful, the caster takes a –${PACT_PEACE.exec(preamble[peace])[1]} status penalty to Deception checks to Lie to it.`],
            rowNotes: [], supersedes: false, immunity: { value: Number(immune[1]), unit: `${immune[2]}s`, sourceText: preamble[peace + 3] },
            castTarget: String(adapted.targeting.target).trim(), sourceText: preamble[peace + 1] },
        heldDuration: { value: durationSeconds % 60 === 0 ? durationSeconds / 60 : durationSeconds / 6, unit: durationSeconds % 60 === 0 ? "minutes" : "rounds" },
        degreeAdjustment: { predicate: { kind: "gm-confirmed", question: "Had the target accepted the pact before this hostile action? (If so, its result is one degree worse.)" },
            map: { ...WORSE }, sourceText: preamble[peace + 2] },
        sentences: preamble
    };
}

// A warning held on the target (Murmuration): "The target feels …, warning it to keep away from a creature you designate that's within 30 feet
// of you when you Cast this Spell (which can include yourself). Once per round, if the target moves closer to the designated creature, it must
// attempt a Will save or take @Damage[(@item.rank)d4[piercing]] or @Damage[(@item.rank)d4[sonic]] damage." with the rows (half, full, and on a
// critical failure both types and PF2e's −2 Effect on its next roll). The marker goes on the target; each move closer (once a round, the GM's)
// opens its save; the damage is the text's, of the type the caster picks when casting.
const MURMUR_WARN = /^The target feels [^.@\d]+, warning it to keep away from a creature you designate that's within (\d+) feet of you when you Cast this Spell \(which can include yourself\)\.$/;
const MURMUR_SAVE = /^Once per round, if the target moves closer to the designated creature, it must attempt an? (Fortitude|Reflex|Will) save or take @Damage\[\(@item\.(?:rank|level)\)d(\d+)\[([a-z]+)\]\] or @Damage\[\(@item\.(?:rank|level)\)d(\d+)\[([a-z]+)\]\] damage\.$/;
const MURMUR_CRIT = /^The target takes @Damage\[\(@item\.(?:rank|level)\)d(\d+)\[([a-z]+)\],\(@item\.(?:rank|level)\)d(\d+)\[([a-z]+)\]\] damage, and if it attempts an attack roll or hostile skill check this round, it takes a [–−-](\d) status penalty to the roll\.$/;
const MURMUR_HEIGHTENED = /^<p>\s*<strong>\s*Heightened \(\+1\)\s*<\/strong>\s*The damage increases by 1d(\d+), or by 2d\1 on a critical failure \(1d\1 of which is ([a-z]+) and 1d\1 of which is ([a-z]+)\)\.\s*<\/p>$/;

export function extractMurmurTrigger(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    if (!/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim()) || adapted.lifecycle?.sustained !== true) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const split = html.search(/<p>\s*<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i);
    if (split < 0) return null;
    const preamble = htmlToPlainText(html.slice(0, split).replace(/<hr\b[^>]*>/gi, "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (preamble.length !== 2 || !MURMUR_WARN.test(preamble[0]) || !MURMUR_SAVE.test(preamble[1])) return null;
    const save = MURMUR_SAVE.exec(preamble[1]);
    if (save[1].toLowerCase() !== adapted.defense.statistic || save[2] !== save[4] || save[3] === save[5]) return null;
    const cut = html.search(/<hr\b[^>]*>\s*<p>\s*<strong>\s*Heightened\b/i);
    const rowsHTML = html.slice(split, cut < 0 ? undefined : cut);
    const row = name => htmlToPlainText((new RegExp(String.raw`<p>\s*<strong>\s*${name}\s*<\/strong>([\s\S]*?)<\/p>`, "i").exec(rowsHTML) ?? [])[1] ?? "").replace(/\s+/g, " ").trim();
    if (row("Critical Success") !== "The target is unaffected." || row("Success") !== "The target takes half damage." || row("Failure") !== "The target takes full damage.") return null;
    const crit = MURMUR_CRIT.exec(row("Critical Failure"));
    if (!crit || crit[1] !== save[2] || crit[3] !== save[2] || new Set([crit[2], crit[4]]).size !== 2 || ![crit[2], crit[4]].every(type => [save[3], save[5]].includes(type))) return null;
    const link = /<p>\s*(@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\})\s*<\/p>/.exec(rowsHTML);
    if (!link) return null;
    const heightened = cut < 0 ? [] : html.slice(cut).match(/<p>\s*<strong>\s*Heightened[\s\S]*?<\/p>/gi) ?? [];
    const step = heightened.length === 1 ? MURMUR_HEIGHTENED.exec(heightened[0].trim()) : null;
    if (heightened.length && (!step || step[1] !== save[2] || ![step[2], step[3]].every(type => [save[3], save[5]].includes(type)))) return null;
    const durationSeconds = seconds(adapted.lifecycle?.duration);
    if (!durationSeconds) return null;
    const rows = `<p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target takes half damage.</p>`
        + `<p><strong>Failure</strong> The target takes full damage.</p><p><strong>Critical Failure</strong> The target takes @Damage[(@item.rank)d${save[2]}[${crit[2]}],(@item.rank)d${save[2]}[${crit[4]}]] damage. ${link[1]}</p>`;
    return {
        html: `<p>The target takes 1d${save[2]} untyped damage and must attempt a ${save[1]} save.</p><hr />${rows}`,
        target: "1 creature",
        storedTrigger: { held: true, trigger: "The target moves closer to the designated creature (once per round).", endsOnTrigger: false, sustained: true, durationSeconds, markerDuration: null,
            notes: [`The caster designates a creature within ${MURMUR_WARN.exec(preamble[0])[1]} feet when casting (it can be the caster). Only the first move closer each round triggers the save.`],
            rowNotes: [], supersedes: false, immunity: null, castTarget: String(adapted.targeting.target).trim(), sourceText: preamble[1] },
        murmur: { dieSize: Number(save[2]), types: [save[3], save[5]], penalty: Number(crit[5]), critText: row("Critical Failure"), sentences: preamble },
        component: { id: "text-damage", formula: `1d${save[2]}`, type: "untyped", category: null, applyModifier: false, kinds: ["damage"], materials: [] }
    };
}

// A caster Effect that grants a Strike, with a basic save it can call on each Cast or Sustain (Crown of Prophets): "You gain a fangs unarmed
// attack that deals 1d6 piercing damage and has the agile, finesse, and versatile poison traits. The first time you Cast or Sustain this spell
// each round, you can perform one of the following as a free action." with "Serpentine Advice …" (a note) and "Toxic Prophecy (poison)
// Requirements A creature within 15 feet damaged you since the end of your last turn Effect The snakes spit toxic curses at the required
// creature, dealing 2d4 poison damage (basic Fortitude save)." PF2e's Effect (the Strike) is the marker; Toxic Prophecy is its Trigger control,
// any number of times while sustained (the once-a-round limit and the requirement are the GM's).
const PROPHET_STRIKE = /^You gain an? ([a-z]+) unarmed attack that deals (\d+d\d+) ([a-z]+) damage and has the ([a-z, ]+) traits\.$/;
const PROPHET_ONCE = /^The first time you Cast or Sustain this spell each round, you can perform one of the following as a free action\.$/;
const PROPHET_ADVICE = /^<p>\s*<strong>\s*([A-Z][a-z]+ [A-Z][a-z]+)\s*<\/strong>\s*([^<]*(?:@UUID\[[^\]]+\]\{[^}]+\}[^<]*)*)<\/p>$/;
const PROPHET_ACTION = /^<p>\s*<strong>\s*([A-Z][a-z]+ [A-Z][a-z]+)\s*<\/strong>\s*\(([a-z]+)\)\s*<\/p>\s*<p>\s*<strong>\s*Requirements\s*<\/strong>\s*([^<]+)<\/p>\s*<p>\s*<strong>\s*Effect\s*<\/strong>\s*([^<]+)<\/p>/;
const PROPHET_SAVE = /^The [a-z]+ [a-z ]+ at the required creature, dealing (\d+d\d+) ([a-z]+) damage \(basic (Fortitude|Reflex|Will) save\)\.$/;

export function extractProphecyTrigger(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim() || adapted.lifecycle?.sustained !== true) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const durationSeconds = seconds(adapted.lifecycle?.duration);
    const html = String(adapted.descriptionHTML ?? "");
    const cut = html.search(/<hr\b[^>]*>\s*<p>\s*<strong>\s*Heightened\b/i);
    const base = cut < 0 ? html : html.slice(0, cut);
    const paragraphs = [...base.matchAll(/<p>[\s\S]*?<\/p>/g)].map(match => match[0].trim());
    const links = [...base.matchAll(/@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}/g)].map(match => match[0]);
    if (!durationSeconds || links.length !== 1 || paragraphs.length !== 6) return null;
    const lead = htmlToPlainText(paragraphs[0]).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (lead.length !== 3 || RULE_WORDS.test(lead[0]) || !PROPHET_STRIKE.test(lead[1]) || !PROPHET_ONCE.test(lead[2])) return null;
    const advice = PROPHET_ADVICE.exec(paragraphs[1]);
    const action = PROPHET_ACTION.exec(paragraphs.slice(2, 5).join(""));
    if (!advice || !action || paragraphs[5] !== `<p>${links[0]}</p>`) return null;
    const save = PROPHET_SAVE.exec(action[4].trim());
    if (!save || save[1] !== String(components[0].formula).replace(/\s+/g, "") || save[2] !== String(components[0].type).toLowerCase() || save[3].toLowerCase() !== adapted.defense.statistic) return null;
    const heightened = cut < 0 ? [] : html.slice(cut).match(/<p>\s*<strong>\s*Heightened[\s\S]*?<\/p>/gi) ?? [];
    const step = heightened.length === 1 ? new RegExp(String.raw`^<p>\s*<strong>\s*Heightened \(\+1\)\s*<\/strong>\s*The ${save[2]} damage dealt by ${action[1]} increases by (\d+d\d+)\.\s*<\/p>$`).exec(heightened[0].trim()) : null;
    if (heightened.length && !(step && adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === 1 && adapted.heightening.damage?.[components[0].id] === step[1])) return null;
    const plainAdvice = htmlToPlainText(advice[2]).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim();
    const [, strikeName, dice, damageType, traitText] = PROPHET_STRIKE.exec(lead[1]);
    return {
        html: `<p>The target takes ${save[1]} ${save[2]} damage (basic ${save[3]} save).</p>`,
        target: "1 creature",
        storedTrigger: { trigger: `${action[1]} (free action, the first time you Cast or Sustain the spell each round): ${htmlToPlainText(action[3]).trim()}.`, endsOnTrigger: false, sustained: true,
            notes: [`${advice[1]} (instead of ${action[1]}): ${plainAdvice}`, "Only one of these once each round, when you Cast or Sustain the spell."],
            rowNotes: [], supersedes: false, durationSeconds, markerDuration: null, castTarget: null, sourceText: action[4].trim(),
            effectLink: links[0], grantedStrike: { slug: strikeName, dice, damageType, traits: traitText.replace(/,? and /, ", ").split(/,\s*/).map(trait => trait.trim().replace(/ /g, "-")) } },
        sentences: [...lead, htmlToPlainText(paragraphs[1]).trim()]
    };
}

// A Hit Point pool around the target that blocks Strikes and bursts on the one who breaks it (Shattering Gem): "The gem has 5 Hit Points." /
// "Each time a creature Strikes the target, the target attempts a DC 11 flat check." / "On a success, the gem blocks the attack, so the attack
// first damages the gem and then applies any remaining damage to the target." / "If the gem is reduced to 0 Hit Points, it shatters,
// immediately dealing 1d8 slashing damage (basic Reflex save) to the creature that destroyed it, as long as that creature is within 10 feet
// of the target." with "Heightened (+1) The gem has 5 additional Hit Points, and the damage dealt by its detonation increases by 1d8."
// The marker goes on the target and holds the pool. Its "Struck" control (the attacker targeted) rolls the flat check; on a success the
// damage the target just took comes back from the pool; at 0 the attacker, if that close, gets the basic save, and the spell ends.
const POOL_HP = /^The ([a-z]+) has (\d+) Hit Points\.$/;
const POOL_STRUCK = /^Each time a creature Strikes the target, the target attempts a @Check\[flat\|dc:(\d+)(?:\|[^\]]*)?\]\.$/;
const POOL_BLOCK = /^On a success, the ([a-z]+) blocks the attack, so the attack first damages the \1 and then applies any remaining damage to the target\.$/;
const POOL_SHATTER = /^If the ([a-z]+) is reduced to 0 Hit Points, it [a-z]+, immediately dealing (\d+d\d+) ([a-z]+) damage \(basic (Fortitude|Reflex|Will) save\) to the creature that destroyed it, as long as that creature is within (\d+) feet of the target\.$/;
const POOL_HEIGHTENED = /^<p>\s*<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>\s*The ([a-z]+) has (\d+) additional Hit Points, and the damage dealt by its [a-z]+ increases by (\d+d\d+)\.\s*<\/p>$/;

export function extractGemTrigger(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area || adapted.lifecycle?.sustained) return null;
    if (!/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const [component] = components;
    const durationSeconds = seconds(adapted.lifecycle?.duration);
    const html = String(adapted.descriptionHTML ?? "");
    const [body, ...rest] = html.split(/<hr\b[^>]*>/i);
    if (!durationSeconds || rest.length > 1 || /<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i.test(body)) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    let pool = null, flat = null, block = false, shatter = null, narrated = 0;
    for (const sentence of sentences) {
        let match;
        if (!pool && (match = POOL_HP.exec(sentence))) { pool = { label: match[1], hp: Number(match[2]) }; continue; }
        if (pool && flat == null && (match = POOL_STRUCK.exec(sentence))) { flat = Number(match[1]); continue; }
        if (flat != null && !block && (match = POOL_BLOCK.exec(sentence)) && match[1] === pool.label) { block = true; continue; }
        if (block && !shatter && (match = POOL_SHATTER.exec(sentence)) && match[1] === pool.label) {
            if (match[2] !== String(component.formula).replace(/\s+/g, "") || match[3] !== String(component.type).toLowerCase() || match[4].toLowerCase() !== adapted.defense.statistic) return null;
            shatter = { range: Number(match[5]), sourceText: sentence }; continue;
        }
        if (!pool && narrated < 1 && !RULE_WORDS.test(sentence) && !/\bHit Points\b/.test(sentence)) { narrated++; continue; }
        return null;
    }
    if (!pool || flat == null || !block || !shatter) return null;
    // "Heightened (+1) The gem has 5 additional Hit Points, and the damage … increases by 1d8.": the pool's step, and the item's own damage step.
    let perStep = 0, interval = null;
    if (rest.length) {
        const entries = [...rest[0].matchAll(/<p>[\s\S]*?<\/p>/gi)].map(match => match[0].trim());
        const heightened = entries.length === 1 ? POOL_HEIGHTENED.exec(entries[0]) : null;
        if (!heightened || heightened[2] !== pool.label) return null;
        const step = adapted.heightening?.damage?.[component.id];
        if (adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== Number(heightened[1]) || String(step ?? "").replace(/\s+/g, "") !== heightened[4]) return null;
        perStep = Number(heightened[3]); interval = Number(heightened[1]);
    }
    const statistic = adapted.defense.statistic[0].toUpperCase() + adapted.defense.statistic.slice(1);
    return {
        html: `<p>The target takes ${component.formula} ${String(component.type).toLowerCase()} damage with a basic ${statistic} save.</p>`,
        target: "1 creature",
        storedTrigger: { held: true, trigger: `The ${pool.label} is reduced to 0 Hit Points by a creature's Strike.`, endsOnTrigger: true,
            notes: [`Each time a creature Strikes the target, use “Struck” in Ongoing spells with the attacker targeted: it rolls the DC ${flat} flat check, and on a success the ${pool.label} takes the damage first.`,
                `When the ${pool.label} shatters, the creature that destroyed it takes the damage (basic ${statistic} save) if it's within ${shatter.range} feet of the target.`],
            rowNotes: [], supersedes: false, sustained: false, durationSeconds, markerDuration: null, immunity: null,
            pool: { label: pool.label, hp: pool.hp, perStep, interval, flatDC: flat, range: shatter.range },
            castTarget: "1 creature", saveTarget: "attacker", sourceText: shatter.sourceText }
    };
}

// Images around the caster that take hits for them (Trickster's Mirrors): "You are surrounded by up to 3 mirrors that …" / "You start with 1
// mirror and gain an additional mirror each time you Sustain this spell, up to a maximum of 3 mirrors." / "Any attack that would hit you has a
// random chance of hitting one of your mirrors instead of you." / "With one mirror, the chances are 1 in 2 (1–3 on 1d6)." / "With two mirrors,
// there is a 1 in 3 chance of hitting you (1–2 on 1d6)." / … / "Once an image is hit, it is destroyed." / "If an attack roll fails to hit your
// AC but doesn't critically fail, it destroys a mirror." / "If the attacker was within 5 feet, they must succeed at a basic Will save or take
// 1d4 mental damage as …" / "A damaging effect that affects all targets within your space (…) destroys all of the mirrors."
// The marker on the caster counts the images; Ongoing controls roll the chance, break one on a miss (the attacker's basic save when that
// close), clear them all on area damage, and add one on a Sustain.
const IMAGES_UP_TO = /^You are surrounded by up to (\d+) ([a-z]+)s that [^.\d]+\.$/;
const IMAGES_GROW = /^You start with (\d+) ([a-z]+) and gain an additional \2 each time you Sustain this spell, up to a maximum of (\d+) \2s\.$/;
const IMAGES_CHANCE = /^Any attack that would hit you has a random chance of hitting one of your ([a-z]+)s instead of you\.$/;
const IMAGES_ODDS = /^With (one|two|three|four|five) ([a-z]+?)s?, (?:the chances are|there is a) 1 in (\d+)(?: chance of hitting you)? \((\d+)(?:[–-](\d+))? on 1d(\d+)\)\.$/;
const IMAGES_HIT = /^Once an image is hit, it is destroyed\.$/;
const IMAGES_MISS = /^If an attack roll fails to hit your AC but doesn't critically fail, it destroys an? ([a-z]+)\.$/;
const IMAGES_SAVE = /^If the attacker was within (\d+) feet, they must succeed at a basic (Fortitude|Reflex|Will) save or take (\d+d\d+) ([a-z]+) damage(?: as [^.@\d]+)?\.$/;
const IMAGES_AREA = /^A damaging effect that affects all targets within your space(?: \(such as [^)]+\))? destroys all of the ([a-z]+)s\.$/;
const COUNT = { one: 1, two: 2, three: 3, four: 4, five: 5 };

export function extractMirrorTrigger(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim()) return null;
    if (adapted.lifecycle?.sustained !== true) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const [component] = components;
    const durationSeconds = seconds(adapted.lifecycle?.duration);
    const html = String(adapted.descriptionHTML ?? "");
    const [body, ...rest] = html.split(/<hr\b[^>]*>/i);
    if (!durationSeconds || rest.length > 1 || /<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i.test(body)) return null;
    const sentences = htmlToPlainText(body).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    let max = null, noun = null, grow = null, chance = false, hit = false, miss = false, save = null, area = false;
    const odds = [];
    for (const sentence of sentences) {
        let match;
        if (max == null && (match = IMAGES_UP_TO.exec(sentence))) { max = Number(match[1]); noun = match[2]; continue; }
        if (noun && !grow && (match = IMAGES_GROW.exec(sentence)) && match[2] === noun && Number(match[3]) === max) { grow = { start: Number(match[1]) }; continue; }
        if (grow && !chance && (match = IMAGES_CHANCE.exec(sentence)) && match[1] === noun) { chance = true; continue; }
        if (chance && (match = IMAGES_ODDS.exec(sentence)) && match[2] === noun) {
            const count = COUNT[match[1]], outOf = Number(match[3]), low = Number(match[4]), high = Number(match[5] ?? match[4]), die = Number(match[6]);
            // "1 in N" must be the stated faces' share of the die (those faces hit you).
            if (low !== 1 || high * outOf !== die || count !== odds.length + 1) return null;
            odds.push({ count, die: `1d${die}`, you: high }); continue;
        }
        if (odds.length && !hit && IMAGES_HIT.test(sentence)) { hit = true; continue; }
        if (hit && !miss && (match = IMAGES_MISS.exec(sentence)) && match[1] === noun) { miss = true; continue; }
        if (miss && !save && (match = IMAGES_SAVE.exec(sentence))) {
            if (match[3] !== String(component.formula).replace(/\s+/g, "") || match[4] !== String(component.type).toLowerCase() || match[2].toLowerCase() !== adapted.defense.statistic) return null;
            save = { range: Number(match[1]), sourceText: sentence }; continue;
        }
        if (save && !area && (match = IMAGES_AREA.exec(sentence)) && match[1] === noun) { area = true; continue; }
        return null;
    }
    if (!grow || odds.length !== max || !hit || !miss || !save || !area) return null;
    // "Heightened (+1) The mental damage dealt by a broken mirror increases by 1d4.": the item's own damage step.
    if (rest.length) {
        const entries = [...rest[0].matchAll(/<p>[\s\S]*?<\/p>/gi)].map(match => match[0].trim());
        const heightened = entries.length === 1 ? /^<p>\s*<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>\s*The ([a-z]+) damage dealt by a broken ([a-z]+) increases by (\d+d\d+)\.\s*<\/p>$/.exec(entries[0]) : null;
        const step = adapted.heightening?.damage?.[component.id];
        if (!heightened || heightened[2] !== String(component.type).toLowerCase() || heightened[3] !== noun || adapted.heightening?.type !== "interval"
            || Number(adapted.heightening.interval) !== Number(heightened[1]) || String(step ?? "").replace(/\s+/g, "") !== heightened[4]) return null;
    }
    const statistic = adapted.defense.statistic[0].toUpperCase() + adapted.defense.statistic.slice(1);
    return {
        html: `<p>The target takes ${component.formula} ${String(component.type).toLowerCase()} damage with a basic ${statistic} save.</p>`,
        target: "1 creature",
        storedTrigger: { trigger: `An attack roll against you fails but doesn't critically fail: it destroys a ${noun}.`, endsOnTrigger: false,
            notes: [`Any attack that would hit you may hit a ${noun} instead: use the ${noun} roll in Ongoing spells. A ${noun} that's hit is destroyed.`,
                `An attack that fails (not critically) destroys a ${noun}; if the attacker was within ${save.range} feet, it saves.`, `A damaging effect on everything in your space destroys all the ${noun}s.`],
            rowNotes: [], supersedes: false, sustained: true, durationSeconds, markerDuration: null,
            images: { noun, start: grow.start, max, perSustain: 1, odds, range: save.range }, castTarget: null, saveTarget: "attacker", sourceText: save.sourceText }
    };
}
