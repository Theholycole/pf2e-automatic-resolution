// A call to rebellion (Long Live the Revolution): "Choose an act of rebellion … Targets who notice your speech, song, or other call to action must attempt a Will save or be
// spirited to engage in your act of rebellion. You must choose an act that would overthrow an authority … or your spell automatically fails." / "Creatures can choose
// to gain the effects of a failure on this spell and forgo their Will save and creatures that would be in conflict with your act of rebellion … gain a +4 circumstance
// bonus to their save (subject to GM discretion)." / "Each creature that comes within range has to attempt a save when you Sustain the Spell. Creatures that succeed at
// their save or remove the effect are immune for 1 hour." with the rows — a critical success's +1 circumstance to others' saves (cumulative to +4); Fascinated with the
// act and +1 status to checks to complete it, the attitude a step worse, a new save on witnessing what it disagrees with, ended by another's Diplomacy or Intimidation
// (not on a critical failure): the caster's Effect holds the act and the critical successes; each target's save (PF2e's, the spell its origin — incapacitation
// applies), the willing failing and the opposed at +4; the failing rows' Effect with its two controls; immunity for an hour; the Sustain's control for newcomers.
import { htmlToPlainText } from "./description-parser.js";

const TEXT = [/^You speak or sing without interruption throughout the casting and duration\.$/, /^Choose an act of rebellion, such as [a-z ,]+\.$/,
    /^Targets who notice your speech, song, or other call to action must attempt a (Fortitude|Reflex|Will) save or be spirited to engage in your act of rebellion\.$/,
    /^(You must choose an act that would overthrow an authority and be possible for the creatures you are targeting to accomplish together or your spell automatically fails\.)$/,
    /^Creatures can choose to gain the effects of a failure on this spell and forgo their \1 save and creatures that would be in conflict with your act of rebellion, such as [a-z ,]+, gain a \+(\d) circumstance bonus to their save \(subject to GM discretion\)\.$/,
    /^Each creature that comes within range has to attempt a save when you Sustain the Spell\.$/, /^Creatures that succeed at their save or remove the effect are immune for (\d+) hours?\.$/];
const ROWS = { criticalSuccess: /^The target is unaffected and on subsequent turns they grant creatures within range a \+(\d) circumstance bonus to their saves\. This circumstance bonus is cumulative with other creatures that critically succeed their save up to a maximum of a \+(\d) circumstance bonus\.$/,
    success: /^The target is unaffected\.$/,
    failure: /^The target is fascinated with the act of rebellion and gains a \+(\d) status bonus to checks to complete your act of rebellion\. (The targets attitude towards creatures that oppose the act of rebellion decreases by one step\.) It can attempt another (Fortitude|Reflex|Will) save if it witnesses actions or speech with which it disagrees\. If another creature succeeds at a Diplomacy or Intimidation check against it, these effects end immediately\.$/,
    criticalFailure: /^As failure, but attempts to use Diplomacy or Intimidation against it do not end the effects\.$/ };

/** {rally, sentences} or null. */
export function extractRallyCry(item) {
    const save = item?.system?.defense?.save;
    if (!save?.statistic || save.basic || !item.system?.duration?.sustained || String(item.system?.duration?.value ?? "").trim() || !/^all creatures within range$/.test(String(item.system?.target?.value ?? "").trim())) return null;
    const [body, table = "", ...rest] = String(item.system?.description?.value ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const sentences = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].flatMap(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim().split(/(?<=[.!?)])\s+(?=[A-Z@])/));
    const first = TEXT[2].exec(sentences[2] ?? "");
    const found = first ? TEXT.map((pattern, index) => new RegExp(pattern.source.replace("\\1", first[1])).exec(sentences[index] ?? "")) : [];
    const row = heading => htmlToPlainText(String(new RegExp(String.raw`<p><strong>${heading}\s*</strong>\s*([\s\S]*?)</p>`).exec(table)?.[1] ?? "")).replace(/\s+/g, " ").trim();
    const rows = Object.fromEntries(Object.entries(ROWS).map(([degree, pattern]) => [degree, pattern.exec(row({ criticalSuccess: "Critical Success", success: "Success", failure: "Failure", criticalFailure: "Critical Failure" }[degree]))]));
    if (sentences.length !== TEXT.length || !first || found.some(match => !match) || Object.values(rows).some(entry => !entry) || first[1].toLowerCase() !== save.statistic || rows.failure[3] !== first[1]) return null;
    return {
        rally: { statistic: save.statistic, opposed: Number(found[4][1]), immuneHours: Number(found[6][1]), cheer: { per: Number(rows.criticalSuccess[1]), max: Number(rows.criticalSuccess[2]) },
            bonus: Number(rows.failure[1]), attitude: rows.failure[2], seconds: 600, notes: [found[3][1], "The caster speaks or sings without interruption throughout the casting and duration."] },
        sentences: [...sentences, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(row)]
    };
}
