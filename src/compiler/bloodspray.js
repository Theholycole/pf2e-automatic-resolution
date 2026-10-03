// A curse that makes wounds gush blood (Bloodspray Curse): "You inflict a curse upon the target that causes any wound to gush blood. The target must
// attempt a Fortitude save." with rows "The target is unaffected." / "For 1 minute, the first time each round that the target would take at least 10
// piercing or slashing damage from a single Strike, the strike deals an additional @Damage[(floor(@item.rank/2))d6[piercing]] or
// @Damage[(floor(@item.rank/2))d6[slashing]] damage of the same type." / "As success, but the Strike also deals an additional
// @Damage[(floor(@item.rank/2))d6[bleed]] damage." and "Heightened (+2) The additional damage increases by 1d6, and the persistent bleed damage
// increases by 1d6.": the target's save; on a success or worse a note for the minute whose controls (one per type) the GM uses when such a Strike
// wounds it — the added damage of that type, once a round, and on a failure the persistent bleed too.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const LEAD = /^The target must attempt an? (Fortitude|Reflex|Will) save\.$/;
const SUCCESS = /^For (\d+) minutes?, the first time each round that the target would take at least (\d+) ([a-z]+) or ([a-z]+) damage from a single Strike, the strike deals an additional @Damage\[([^\[\]]+)\[\3\]\] or @Damage\[\5\[\4\]\] damage of the same type\.$/;
const FAILURE = /^As success, but the Strike also deals an additional @Damage\[([^\[\]]+)\[([a-z]+)\]\] damage\.$/;
const STEP = /^Heightened \(\+2\) The additional damage increases by 1d6, and the persistent ([a-z]+) damage increases by 1d6\.$/;

/** {html, notes: {degree: note}, sentences} or null. */
export function rewriteBloodspray(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const lead = LEAD.exec(sentences.at(-1) ?? "");
    if (!lead || sentences.slice(0, -1).some(sentence => NARRATION_RULES.test(sentence)) || lead[1].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const plain = heading => htmlToPlainText(row(heading)).replace(/\s+/g, " ").trim();
    const success = SUCCESS.exec(plain("Success")), failure = FAILURE.exec(plain("Failure")), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    // (Three rows: a critical failure is a failure's.)
    if (rows.length !== 3 || plain("Critical Success") !== "The target is unaffected." || !success || !failure || !step || failure[1] !== success[5] || failure[2] !== step[1]
        // (The dice are (rank ÷ 2)d6: 1 more every 2 ranks, as the step says.)
        || !/^\(floor\(@item\.rank\/2\)\)d6$/.test(success[5])) return null;
    const minutes = Number(success[1]);
    const trigger = extra => ({ trigger: "strike-wound", formula: success[5], types: [success[3], success[4]], threshold: Number(success[2]), frequency: "round", endsSpell: false,
        baseRank: Number(adapted.rank) || 1, ...(extra ? { extra: { formula: failure[1], type: failure[2], persistent: true } } : {}) });
    const note = (text, sourceText, extra) => ({ label: "Bloodspray curse", text, sourceText, claimsRow: true,
        duration: { mode: "fixed", value: minutes, unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: `For ${minutes} minute${minutes === 1 ? "" : "s"}` }, triggeredDamage: trigger(extra) });
    const failText = `${plain("Success")} The Strike also deals an additional persistent ${failure[2]} damage (${failure[1]}).`;
    return {
        html: `<p>${sentences.join(" ")}</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> The target is unaffected.</p><p><strong>Critical Failure</strong> The target is unaffected.</p>`,
        notes: { success: note(plain("Success"), plain("Success"), false), failure: note(failText, plain("Failure"), true), criticalFailure: note(failText, plain("Failure"), true) },
        sentences: [...sentences, plain("Critical Success"), plain("Success"), plain("Failure"), htmlToPlainText(heightened).trim()]
    };
}
