// An area's save the item doesn't define (Horizon's Veil; user decision 2026-09-27: the text over PF2e's data):
//   "The affected area has the following effects. You can Dismiss this spell." with the list "Ranged attacks that pass through the area take a –2
//   circumstance penalty to attack rolls." / "The area is difficult terrain." / "Creatures who end their turn in the area must succeed at a Will save
//   or become Slowed 1 for 1 round."
// Rewritten for the lingering area as "Each creature that ends its turn in the area must attempt a Will save." with the degree rows (success:
// unaffected; failure and critical failure: the condition for its time), the item's save set from the text; the attacks passing through are the
// GM's (a note).
import { htmlToPlainText } from "./description-parser.js";

const OR_BECOME = /^Creatures who end their turn in the area must succeed at an? (Fortitude|Reflex|Will) save or become (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Z][a-z]+(?: \d)?\}) for (\d+) rounds?\.$/;
const PASSING = /^Ranged attacks that pass through the area take an? [–−-](\d) (circumstance|status) penalty to attack rolls\.$/;
const KEPT = [/^The area is difficult terrain\.$/, /^You can Dismiss this spell\.$/];
const LEAD = /^The affected area has the following effects\.$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|terrain)\b/i;

/** {html, defense, notes} or null. */
export function extractTextAreaSave(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || adapted.targeting?.area?.type !== "burst" || String(adapted.targeting?.target ?? "").trim()) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<hr\b/i.test(html)) return null;
    const sentences = htmlToPlainText(html.replace(/<\/li>/g, " </li>")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    let save = null, narrated = 0;
    const kept = [], notes = [];
    for (const sentence of sentences) {
        const become = !save ? OR_BECOME.exec(sentence) : null;
        if (become) { save = become; continue; }
        if (PASSING.test(sentence)) { notes.push(`${sentence} (The GM applies it to an attack whose line passes through the area.)`); continue; }
        if (KEPT.some(pattern => pattern.test(sentence))) { kept.push(sentence); continue; }
        if (LEAD.test(sentence)) continue;
        if (!save && !kept.length && narrated < 1 && !NARRATION_RULES.test(sentence)) { narrated++; continue; }
        return null;
    }
    if (!save) return null;
    const [, statistic, condition, rounds] = save;
    const lasting = `${condition} for ${rounds} round${rounds === "1" ? "" : "s"}`;
    return {
        html: `<p>${kept.join(" ")} Each creature that ends its turn in the area must attempt a ${statistic} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Failure</strong> The creature is ${lasting}.</p><p><strong>Critical Failure</strong> The creature is ${lasting}.</p>`,
        defense: { kind: "save", statistic: statistic.toLowerCase(), basic: false },
        notes, sourceText: save[0]
    };
}

// Radiant Globe: "Attackers targeting creatures or objects through the globe's surface with physical ranged attacks must succeed at a Fortitude save
// or become Dazzled for 1 round (Blinded for 1 round on a critical failure)." with the projectiles it destroys (a note) — rewritten as the GM's
// control on the area ("An attacker … must attempt a Fortitude save.") with the degree rows.
const THROUGH = /^Attackers targeting creatures or objects through the ([a-z]+)'s surface with physical ranged attacks must succeed at an? (Fortitude|Reflex|Will) save or become (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Z][a-z]+\}) for (\d+) rounds? \((@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Z][a-z]+\}) for (\d+) rounds? on a critical failure\)\.$/;
const AMMUNITION = /^Ammunition from physical ranged attacks—[^.]+—is destroyed in a flash of light when it passes into or out of the [a-z]+'s area\.$/;

/** {html, notes, sourceText} or null. */
export function extractThroughAreaSave(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || (adapted.damageComponents ?? []).length || adapted.targeting?.area?.type !== "burst") return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<hr\b/i.test(html)) return null;
    const sentences = htmlToPlainText(html).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => THROUGH.test(sentence));
    if (at < 0) return null;
    const [, noun, statistic, condition, rounds, critical, criticalRounds] = THROUGH.exec(sentences[at]);
    if (statistic.toLowerCase() !== adapted.defense.statistic) return null;
    const notes = [];
    for (const [index, sentence] of sentences.entries()) {
        if (index === at) continue;
        if (AMMUNITION.test(sentence)) { notes.push(`${sentence} (The GM's.)`); continue; }
        if (index === 0 && !/\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|must)\b/i.test(sentence)) continue;
        return null;
    }
    const plural = n => `${n} round${n === "1" ? "" : "s"}`;
    return {
        html: `<p>An attacker targeting creatures or objects through the ${noun}'s surface with a physical ranged attack must attempt a ${statistic} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Failure</strong> The creature is ${condition} for ${plural(rounds)}.</p><p><strong>Critical Failure</strong> The creature is ${critical} for ${plural(criticalRounds)}.</p>`,
        notes, sourceText: sentences[at]
    };
}

// Fallen Soldier's Lament: "Whenever you Cast this Spell or Sustain this spell, you move the illusion up to 30 feet and cause each enemy in a 30-foot
// emanation of the spirit to attempt a Will save against your spell DC." / "Enemies who fail become Frightened 1 (or Frightened 2 on a critical
// failure)." on a target that is a corpse (no area) — rewritten as a placed area the GM moves (the illusion's emanation, starting in the corpse's
// space): "Each enemy in the area when you Cast this Spell and each time you Sustain the Spell must attempt a Will save." with the rows; the
// corpse limits (and the Heightened entry's) are notes.
const MOVING_SPIRIT = /^Whenever you Cast this Spell or Sustain this spell, you move the illusion up to (\d+) feet and cause each enemy in a (\d+)-foot emanation of the spirit to attempt an? (Fortitude|Reflex|Will) save against your spell DC\.$/;
const FAIL_BECOME = /^Enemies who fail become (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{([A-Z][a-z]+) (\d)\}) \(or (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{([A-Z][a-z]+) (\d)\}) on a critical failure\)\.$/;
const CORPSE_TARGET = /^1 corpse of an? ([A-Z][a-z]+) or smaller creature that has died within the past (\d+) hours$/;

/** {html, area, notes, sourceText} or null. */
export function extractMovingSpiritSave(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || (adapted.damageComponents ?? []).length || adapted.targeting?.area || adapted.lifecycle?.sustained !== true) return null;
    const corpse = CORPSE_TARGET.exec(String(adapted.targeting?.target ?? "").trim());
    if (!corpse) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (rest.length > 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    let move = null, rows = null, narrated = 0;
    for (const sentence of sentences) {
        const moving = !move ? MOVING_SPIRIT.exec(sentence) : null;
        if (moving) { move = moving; continue; }
        const fail = move && !rows ? FAIL_BECOME.exec(sentence) : null;
        if (fail && fail[2] === fail[5]) { rows = fail; continue; }
        if (!move && narrated < 1 && !NARRATION_RULES.test(sentence)) { narrated++; continue; }
        return null;
    }
    if (!move || !rows || move[3].toLowerCase() !== adapted.defense.statistic) return null;
    // "Heightened (6th) You can target a corpse of any size that has died within the past 8 hours.": a note from that rank.
    const notes = [`Place the area as a ${move[2]}-foot emanation around the illusion, starting in the space of the corpse (${corpse[1]} or smaller, dead within the past ${corpse[2]} hours). When you Sustain the spell, move the region up to ${move[1]} feet first; each enemy in it then saves.`];
    if (rest.length) {
        const any = /^<p>\s*<strong>\s*Heightened \((\d)(?:st|nd|rd|th)\)\s*<\/strong>\s*You can target a corpse of any size that has died within the past (\d+) hours\.\s*<\/p>\s*$/.exec(rest[0].trim());
        if (!any || any[2] !== corpse[2]) return null;
        notes.push(`From ${any[1]}th rank, the corpse can be of any size.`);
    }
    return {
        html: `<p>Each enemy in the area when you Cast this Spell and each time you Sustain the Spell must attempt a ${move[3]} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Failure</strong> The creature is ${rows[1]}.</p><p><strong>Critical Failure</strong> The creature is ${rows[4]}.</p>`,
        area: { type: "burst", value: Number(move[2]) }, notes, sourceText: [move[0], rows[0]]
    };
}
