// A save the spell sets off again and again while it lasts, on a trigger the module can't see — the card's button (the GM targets the creature each time); the rest of
// the spell the caster's Effect (PF2e's, when the spell links one, or the module's note for the duration):
//   For Love, For Lightning — "When you Cast the Spell, you plunge the required weapon into the ground, where it crackles with crimson lightning. When you Cast the
//   Spell, and the first time during each of your subsequent turns that you Sustain the spell, the crimson lightning arcs. When the weapon arcs, one enemy of your
//   choice within 30 feet of the weapon takes 3d12 electricity damage (basic Reflex save). If you Interact to draw the weapon from the ground, the spell ends.";
//   Living Thunderbolt — "… When you move through a creature's space, they take 4d12 electricity damage with a basic Reflex save. On a failure, they're also
//   {Dazzled} for 1 round. A creature can only take damage this way once per round." with PF2e's Effect for the rest.
import { htmlToPlainText } from "./description-parser.js";

const plain = text => htmlToPlainText(text).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim();
const split = html => html.replace(/<\/?p>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);

const ARC = {
    plunge: /^When you Cast the Spell, you plunge the required weapon into the ground, where it crackles with [a-z ]+\.$/,
    when: /^When you Cast the Spell, and the first time during each of your subsequent turns that you Sustain the spell, the [a-z ]+ arcs\.$/,
    hits: /^When the weapon arcs, one enemy of your choice within (\d+) feet of the weapon takes (\d+d\d+) ([a-z]+) damage \(basic (Fortitude|Reflex|Will) save\)\.$/,
    ends: /^If you Interact to draw the weapon from the ground, the spell ends\.$/
};
const ESCAPE = /(,)? and automatically succeed at attempts to Escape an effect that has you @UUID\[[^\]]+\]\{Immobilized\}, @UUID\[[^\]]+\]\{Grabbed\}, or @UUID\[[^\]]+\]\{Restrained\} unless the effect is magical and of a higher rank than the (?:<em>)?[a-z ]+(?:<\/em>)? spell/;
const THROUGH = {
    hits: /^When you move through a creature's space, they take (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\.$/,
    rider: /^On a failure, they're also (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Z][a-z]+\}) for (\d+) rounds?\.$/,
    once: /^A creature can only take damage this way once per round\.$/
};

// A sustained spell that strikes a new creature each round (Implosion): "You crush the target by causing it to collapse in on itself, dealing 75 damage. The first time
// each round you Sustain the spell, you must choose a new target to be subject to the same effect; the same creature can never be targeted more than once with a single
// casting of this spell. You also can't affect more than one creature per turn with implosion. You can't target a creature that's incorporeal, gaseous, or liquid, or
// otherwise lacking a solid form." with "Target 1 corporeal creature" — the card's button for the cast's target and each Sustain's new one (a creature it already hit is
// refused); the solid-form limit a note.
const ROUNDS = {
    deals: /^You [a-z]+ the target by [^,]+, dealing (\d+) damage\.$/,
    again: /^The first time each round you Sustain the spell, you must choose a new target to be subject to the same effect; the same creature can never be targeted more than once with a single casting of this spell\.$/,
    once: /^You also can't affect more than one creature per turn with [a-z ]+\.$/,
    solid: /^You can't target a creature that's incorporeal, gaseous, or liquid, or otherwise lacking a solid form\.$/
};

/**
 * {effectHTML, action: {label, html, statistic, basic, sourceText}, notes, sustained} or null — effectHTML (the rest, for PF2e's Effect) or null (the module's note
 * for the duration).
 */
// A creature that attempts a hostile action against the warded target saves (Mask of Terror): "When any creature attempts a hostile action against the target, the
// creature must attempt a Will save. It is then temporarily immune until the end of its next turn." with rows "Success The creature is unaffected." / "Failure The
// creature becomes {Frightened 2} before using its action." / "Critical Failure The creature becomes frightened 2, and its action fails and is wasted." and
// "Heightened (8th) You can target up to 5 creatures. If a creature uses a hostile action or reaction that affects multiple targets simultaneously, it needs to
// attempt only one save against mask of terror." — the masked creatures' note Effect for the duration; the card's button rolls the acting creature's save (its
// row: Frightened 2; on a critical failure the GM voids its action), immune until the end of its next turn.
const HOSTILE = {
    trigger: /^When any creature attempts a hostile action against the target, the creature must attempt an? (Fortitude|Reflex|Will) save\.$/,
    immune: /^It is then temporarily immune until the end of its next turn\.$/,
    success: /^The creature is unaffected\.$/,
    failure: new RegExp(String.raw`^The creature becomes (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{([A-Z][a-z]+) (\d)\}) before using its action\.$`),
    critical: /^The creature becomes ([a-z]+) (\d), and its action fails and is wasted\.$/,
    more: /^Heightened \((\d+)(?:st|nd|rd|th)\) You can target up to (\d+) creatures\. If a creature uses a hostile action or reaction that affects multiple targets simultaneously, it needs to attempt only one save against [a-z ]+\.$/
};
function readHostileWard(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || !/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    if (!minutes || paragraphs.length !== 5 || rest.length > 1) return null;
    const lead = split(paragraphs[0]), ward = split(paragraphs[1]);
    const row = heading => paragraphs.find(text => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(text))?.replace(/^<strong>[^<]*<\/strong>\s*/, "");
    const trigger = HOSTILE.trigger.exec(ward[0] ?? ""), failure = HOSTILE.failure.exec(row("Failure") ?? ""), critical = HOSTILE.critical.exec(row("Critical Failure") ?? "");
    if (lead.some(sentence => /\d|@|\b(?:damage|saves?|bonus|penalty|must)\b/.test(plain(sentence))) || ward.length !== 2 || !trigger || !HOSTILE.immune.test(ward[1])
        || !HOSTILE.success.test(row("Success") ?? "") || !failure || !critical || critical[1] !== failure[2].toLowerCase() || critical[2] !== failure[3] || trigger[1].toLowerCase() !== adapted.defense.statistic) return null;
    const more = rest.length ? HOSTILE.more.exec(plain(rest[0])) : null;
    if (rest.length && !more) return null;
    const statistic = trigger[1];
    return { effectHTML: null, sustained: false, onTargets: { count: 1, ...(more ? { step: { rank: Number(more[1]), count: Number(more[2]) } } : {}) },
        action: { label: "A creature attempted a hostile action against a masked creature: target the one acting", statistic: statistic.toLowerCase(), basic: false,
            html: `<p>The creature must attempt a ${statistic} save.</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
                + `<p><strong>Failure</strong> The creature is ${failure[1]}.</p><p><strong>Critical Failure</strong> The creature is ${failure[1]}. Its action fails and is wasted.</p>`,
            sourceText: plain(ward[0]), immunity: { duration: { value: 1, unit: "rounds", expiry: "turn-end" }, sourceText: plain(ward[1]) } },
        notes: [plain(paragraphs[0]), ...(more ? [plain(rest[0]).replace(/^Heightened \(\d+(?:st|nd|rd|th)\) /, `From rank ${more[1]}: `)] : [])],
        claimed: [...lead.map(plain), ...ward.map(plain), ...["Success", "Failure", "Critical Failure"].map(heading => plain(row(heading))), ...(more ? [plain(rest[0])] : [])] };
}

export function readRepeatSave(adapted) {
    const hostile = readHostileWard(adapted);
    if (hostile) return hostile;
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area) return null;
    const targeted = String(adapted.targeting?.target ?? "").trim();
    // A new target each round.
    if (/^1 corporeal creature$/i.test(targeted) && adapted.lifecycle?.sustained === true) {
        const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
        const sentences = split(body), deals = ROUNDS.deals.exec(sentences[0] ?? "");
        const components = adapted.damageComponents ?? [];
        if (sentences.length !== 4 || !deals || !ROUNDS.again.test(sentences[1]) || !ROUNDS.once.test(sentences[2]) || !ROUNDS.solid.test(sentences[3]) || components.length !== 1
            || String(components[0].formula).replace(/\s+/g, "") !== deals[1]) return null;
        const statistic = adapted.defense.statistic[0].toUpperCase() + adapted.defense.statistic.slice(1);
        return { effectHTML: null, sustained: true, distinct: true,
            action: { label: "The target (when cast, then a new creature the first time you Sustain each round)", statistic: adapted.defense.statistic, basic: true,
                html: `<p>The target takes ${deals[1]} damage with a basic ${statistic} save.</p>${rest.length ? `<hr />${rest.join("<hr />")}` : ""}`, sourceText: plain(sentences[0]) },
            notes: [plain(sentences[1]), plain(sentences[2]), plain(sentences[3])], claimed: sentences.map(plain) };
    }
    if (targeted) return null;
    const components = adapted.damageComponents ?? [];
    const matches = (formula, type, statistic) => components.length === 1 && String(components[0].formula).replace(/\s+/g, "") === formula && String(components[0].type).toLowerCase() === type
        && statistic.toLowerCase() === adapted.defense.statistic;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const heightened = rest.length ? `<hr />${rest.join("<hr />")}` : "";
    const sentences = split(body);
    // The weapon's arcs on the cast and each Sustain.
    if (sentences.length === 4 && ARC.plunge.test(sentences[0]) && ARC.when.test(sentences[1]) && ARC.ends.test(sentences[3])) {
        const hits = ARC.hits.exec(sentences[2]);
        if (!hits || adapted.lifecycle?.sustained !== true || !matches(hits[2], hits[3], hits[4])) return null;
        return { effectHTML: null, sustained: true,
            action: { label: `The weapon arcs (when cast, and the first Sustain each turn): one enemy within ${hits[1]} feet of the weapon`, statistic: hits[4].toLowerCase(), basic: true,
                html: `<p>The target takes ${hits[2]} ${hits[3]} damage with a basic ${hits[4]} save.</p>${heightened}`, sourceText: plain(sentences[2]) },
            notes: [plain(sentences[0]), plain(sentences[3])], claimed: sentences.map(plain) };
    }
    // Moving through creatures' spaces, with PF2e's Effect for the rest.
    const at = sentences.findIndex(sentence => THROUGH.hits.test(sentence));
    if (at > 0 && THROUGH.rider.test(sentences[at + 1] ?? "") && THROUGH.once.test(sentences[at + 2] ?? "") && /@UUID\[Compendium\.pf2e\.spell-effects\./.test(body)) {
        const hits = THROUGH.hits.exec(sentences[at]), rider = THROUGH.rider.exec(sentences[at + 1]);
        if (!matches(hits[1], hits[2], hits[3])) return null;
        const rounds = Number(rider[2]);
        let effectHTML = body.replace(sentences[at], "").replace(sentences[at + 1], "").replace(sentences[at + 2], "").replace(/\s+(?=<\/p>)/g, "");
        // ("…, and automatically succeed at attempts to Escape an effect that has you {Immobilized}, {Grabbed}, or {Restrained} unless the effect is magical and of a
        // higher rank than the … spell": PF2e's rule — an Escape check is a success — behind a toggle the GM turns off for a higher-rank magical hold.)
        const escape = ESCAPE.exec(effectHTML);
        const ruleAdditions = [];
        if (escape) {
            effectHTML = effectHTML.replace(escape[0], escape[1] ? " and" : "");
            ruleAdditions.push({ key: "RollOption", domain: "all", option: "auto-escape", toggleable: true, value: true, label: "Escape: the hold isn't magical and of a higher rank than the spell" },
                { key: "AdjustDegreeOfSuccess", selector: "check", predicate: ["action:escape", "auto-escape"], adjustment: { all: "to-success" } });
        }
        return { effectHTML: `${effectHTML}${heightened}`, sustained: false, ruleAdditions, escapeText: escape ? plain(escape[0]) : null,
            action: { label: "A creature you moved through (once per round each)", statistic: hits[3].toLowerCase(), basic: true,
                html: `<p>The target takes ${hits[1]} ${hits[2]} damage with a basic ${hits[3]} save. On a failure, it's also ${rider[1]} for ${rounds} round${rounds === 1 ? "" : "s"}.</p>${heightened}`,
                sourceText: [sentences[at], sentences[at + 1], sentences[at + 2]].map(plain).join(" ") },
            notes: [], claimed: [sentences[at], sentences[at + 1], sentences[at + 2]].map(plain) };
    }
    return null;
}
