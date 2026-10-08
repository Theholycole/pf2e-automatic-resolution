// A dance that leaves a burst of magical darkness lasting by a Performance check (Dance of Darkness): "You dance, {Striding} up to half your Speed. At either the start
// or end of your Stride, you create an area of magical darkness in a 10-foot burst centered on your location. This area is filled with magical darkness that works the
// same way as that created by a {Darkness} spell of the same rank. When you create the darkness, attempt a Performance check to dance, with a standard DC for your level,
// to determine the duration of the darkness." with the results ("Critical Success 1 minute" / "Success 2 rounds" / "Failure 1 round") — the caster's skill check
// against the level's standard DC (a critical failure as a failure, PF2e's rule for an unlisted result); the burst a region at the caster's position (start or end of
// the Stride, the caster's press) made the linked spell's darkness for the result's time (that spell's own compiled darkness and notes at the cast rank).
import { htmlToPlainText } from "./description-parser.js";
import { LABELS } from "./text-patterns.js";

const RULES = {
    stride: /^You dance, (?:@UUID\[[^\]]+\]\{)?Striding\}? up to half your Speed\.$/,
    area: /^At either the start or end of your Stride, you create an area of magical darkness in a (\d+)-foot burst centered on your location\.$/,
    same: /^This area is filled with magical darkness that works the same way as that created by a @UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\} spell of the same rank\.$/,
    check: /^When you create the darkness, attempt a ([A-Z][a-z]+) check to dance, with a standard DC for your level, to determine the duration of the darkness\.$/
};
const UNITS = { round: 6, rounds: 6, minute: 60, minutes: 60 };

/** {danceDarkness, claimed} or null. */
export function compileDanceDarkness(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim() || !/^varies$/i.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const [body, results = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const sentences = body.replace(/<\/?p>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const claimed = {};
    for (const sentence of sentences) {
        const key = Object.keys(RULES).find(name => !claimed[name] && RULES[name].test(sentence));
        if (!key) return null;
        claimed[key] = RULES[key].exec(sentence);
    }
    const rows = {};
    for (const [, label, text] of results.matchAll(/<p>\s*<strong>([^<]+)<\/strong>\s*([\s\S]*?)<\/p>/g)) {
        const key = LABELS[label.trim()], time = /^(\d+) (rounds?|minutes?)$/.exec(text.replace(/\s+/g, " ").trim());
        if (!key || rows[key] || !time) return null;
        rows[key] = Number(time[1]) * UNITS[time[2]];
    }
    if (Object.keys(claimed).length !== Object.keys(RULES).length || !rows.criticalSuccess || !rows.success || !rows.failure) return null;
    // ("Critical Failure" unlisted: PF2e treats it as the failure.)
    rows.criticalFailure ??= rows.failure;
    return { danceDarkness: { radius: Number(claimed.area[1]), darkness: { uuid: claimed.same[1], name: claimed.same[2] }, skill: claimed.check[1].toLowerCase(), seconds: rows },
        claimed: [...sentences.map(sentence => htmlToPlainText(sentence)), ...[...results.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(match => htmlToPlainText(match[1]).trim())] };
}
