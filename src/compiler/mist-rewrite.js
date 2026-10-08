// A fog with Mist's effects that harms those in it (Frozen Fog): "You conjure a chilling mist that settles into the bones and makes it difficult to move. This has the
// effects of {Mist}, except that you can Sustain the spell once per round to move the fog up to 10 feet. A creature that starts its turn in the area takes 6d8 cold damage
// with a basic Fortitude save. A creature that fails its save is also {Clumsy 1} for 1 minute ({Clumsy 2} on a critical failure) and takes a –10-foot status penalty to
// Speeds for as long as it's clumsy." with PF2e's Effect link (the same Clumsy and penalty) — Mist's concealment (its own sentence: everyone in the area concealed, and
// those outside to those within), the lingering save as a turn starts inside with the Clumsy rider, and the Speed penalty a rule note on the failing rows for the
// Clumsy's minute; moving the fog on a Sustain the GM's (move the region).
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES as RULE_WORDS } from "./text-patterns.js";

const MIST = /^This has the effects of @UUID\[[^\]]+\]\{Mist\}, except that you can Sustain the spell once per round to move the fog up to (\d+) feet\.$/;
const STARTS = /^A creature that starts its turn in the area takes (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\.$/;
const RIDER = /^A creature that fails its save is also (@UUID\[[^\]]+\]\{Clumsy \d\}) for (\d+) minutes? \((@UUID\[[^\]]+\]\{Clumsy \d\}) on a critical failure\) and takes a [–-](\d+)-foot status penalty to Speeds for as long as it's clumsy\.$/;
const LINK = /^@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{Spell Effect: [^}]+\}$/;

/** {html, speedNote, reminder, sentences} or null. */
export function rewriteMistHazard(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area?.type !== "burst" || adapted.lifecycle?.sustained) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = body.replace(/<\/?p>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const mist = MIST.exec(sentences[1] ?? ""), starts = STARTS.exec(htmlToPlainText(sentences[2] ?? "")), rider = RIDER.exec(sentences[3] ?? "");
    if (sentences.length !== 5 || RULE_WORDS.test(htmlToPlainText(sentences[0])) || !mist || !starts || !rider || !LINK.test(sentences[4]) || starts[3].toLowerCase() !== adapted.defense.statistic) return null;
    const minutes = Number(rider[2]);
    return {
        html: `<p>All creatures in the area become concealed, and all creatures outside the area become concealed to creatures within it. ${sentences[2]} A creature that fails its save is also ${rider[1]} for ${minutes} minute${minutes === 1 ? "" : "s"} (${rider[3]} on a critical failure).</p>${rest.length ? `<hr />${rest.join("<hr />")}` : ""}`,
        speedNote: { label: "Slowed by the fog", text: `A –${rider[4]}-foot status penalty to Speeds for as long as it's clumsy from this spell (${minutes} minute${minutes === 1 ? "" : "s"}).`, claimsRow: true,
            rules: [{ key: "FlatModifier", selector: "all-speeds", type: "status", value: -Number(rider[4]) }],
            duration: { mode: "fixed", value: minutes, unit: "minutes", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: `${minutes} minute` }, sourceText: htmlToPlainText(sentences[3]) },
        reminder: { kind: "spell-note", text: `The fog has Mist's effects (concealment). Once per round you can Sustain the spell to move it up to ${mist[1]} feet: move the region.`, sourceText: htmlToPlainText(sentences[1]) },
        sentences: sentences.map(sentence => htmlToPlainText(sentence))
    };
}
