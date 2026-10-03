// A judgment on the caster's prey (Vindicator's Judgment): "You pronounce a terrible judgment upon your quarry … The target takes extra damage from
// your attacks, depending on the result of its Fortitude save. The spell ends immediately if the target is no longer your hunted prey." with rows
// "The target has weakness 5 to the next Strike you make against it or damaging divine spell you cast that includes it as a target before the end of
// your next turn." / "The target has weakness 5 to all Strikes you make against it or damaging divine spells … for the duration of the spell." / "As
// failure, but the target is Off-Guard against the first Strike or divine spell attack you make against it each round …" with "Heightened (7th) The
// weakness is 10." / "Heightened (9th) The weakness is 15.": the hunted prey the GM's answer; each row a note (the weakness only against the caster's
// Strikes and divine spells, which PF2e's Weakness can't scope) with its amount at the cast rank, for its time.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = /^You pronounce a terrible judgment upon your quarry that [^.]+\. The target takes extra damage from your attacks, depending on the result of its (Fortitude|Reflex|Will) save\. (The spell ends immediately if the target is no longer your hunted prey\.)$/;
const SUCCESS = /^The target has weakness (\d+) to the next Strike you make against it or damaging divine spell you cast that includes it as a target before the end of your next turn\.$/;
const FAILURE = /^The target has weakness (\d+) to all Strikes you make against it or damaging divine spells you cast that includes? it as a target for the duration of the spell\.$/;
const CRITICAL = /^As failure, but the target is (?:@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Off-Guard\}|Off-Guard) against the first Strike or divine spell attack you make against it each round for the duration of the spell\.$/;

/** {html, notes, constraint, sentences} or null. */
export function rewriteJudgmentRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    if (!/^your hunted prey$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length || !minutes) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const plain = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const success = SUCCESS.exec(plain("Success")), failure = FAILURE.exec(plain("Failure"));
    const lifts = [...heightened.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => /^Heightened \((\d+)th\) The weakness is (\d+)\.$/.exec(htmlToPlainText(match[1]).replace(/\s+/g, " ").trim()));
    if (!lead || lead[1].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || !/^The target is unaffected\.$/.test(plain("Critical Success")) || !success || !failure
        || !CRITICAL.test(plain("Critical Failure")) || success[1] !== failure[1] || lifts.length !== 2 || lifts.some(lift => !lift)) return null;
    // (The heightened entries must be one even step: 5 at the rank, +5 every 2 ranks.)
    const base = Number(success[1]), rank = Number(adapted.rank), interval = Number(lifts[0][1]) - rank, step = Number(lifts[0][2]) - base;
    if (interval < 1 || step < 1 || Number(lifts[1][1]) - Number(lifts[0][1]) !== interval || Number(lifts[1][2]) - Number(lifts[0][2]) !== step) return null;
    const rankAmount = { base, step, interval, baseRank: rank, multiplier: 1 };
    const ends = "The spell ends if it stops being the caster's hunted prey.";
    const spell = { mode: "fixed", value: Number(minutes[1]), unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: `${minutes[1]} minute${minutes[1] === "1" ? "" : "s"}` };
    const note = (heading, text, duration) => ({ label: "Judgment", text, sourceText: plain(heading), claimsRow: true, gmPlays: true, rankAmount, duration });
    return {
        html: `<p>The target must attempt a ${lead[1]} save.</p><hr />` + ["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `<p><strong>${heading}</strong> The target is unaffected.</p>`).join(""),
        notes: {
            success: note("Success", `Weakness {amount} to the caster's next Strike against it, or next damaging divine spell targeting it, before the end of the caster's next turn (the GM adds it). ${ends}`,
                { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "source-turn", offset: 1, sourceText: "before the end of your next turn" }),
            failure: note("Failure", `Weakness {amount} to every Strike the caster makes against it and every damaging divine spell the caster casts targeting it (the GM adds it). ${ends}`, spell),
            criticalFailure: note("Critical Failure", `Weakness {amount} to every Strike the caster makes against it and every damaging divine spell the caster casts targeting it, and Off-Guard against the caster's first Strike or divine spell attack against it each round (the GM applies both). ${ends}`, spell)
        },
        constraint: { kind: "gm-confirmed", question: "Is this creature the caster's hunted prey? Only it can be the target.", sourceText: adapted.targeting.target },
        sentences: [lead[0], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`), ...lifts.map(lift => lift[0])]
    };
}
