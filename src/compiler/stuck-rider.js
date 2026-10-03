// A basic save whose failing creature is stuck to the caster's appendage (Frog Tongue):
//   "On a failure, the creature is also stuck to the end of the tongue." / "It is Off-Guard and can't move beyond the reach of your
//   tongue." / "A creature can sever the tongue with a Strike that deals at least 10 slashing damage or attempt to Escape against your
//   spell DC." / "The AC of the tongue is equal to your spell DC." / "Severing the tongue in this way deals no damage to you but ends the
//   spell." / "While a creature is stuck to the end of your tongue, actions you take with the auditory trait take a –2 circumstance
//   penalty." / "If you move so that the affected creature is outside of the tongue's reach, the spell ends."
// The failing rows' Off-Guard lasts the spell and ends on an Escape (spell DC). The tether, severing and the caster moving away are the
// GM's (a note on the creature). The caster's penalty is a note Effect with the modifier, made only when a creature is stuck and
// removed with that creature's Off-Guard Effect. (PF2e gives a spell's traits as item:trait:…, and the acting creature's action traits as
// self:action:trait:… — Demoralize's auditory.)
import { htmlToPlainText, stripHeighteningHTML, analyzeDescription } from "./description-parser.js";
import { assessSimpleBasicSaveDescription } from "./semantic-gate.js";

const CONDITION = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Off-Guard\}`;
const ESCAPE = String.raw`(?:@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{Escape\}|Escape)`;

export function compileStuckRider(adapted, lifecycle) {
    if (!adapted.defense?.basic || lifecycle?.sustained) return null;
    const spec = lifecycle?.durationSpec;
    if (spec?.mode !== "fixed" || !Number.isInteger(spec.value) || !["rounds", "minutes"].includes(spec.unit)) return null;
    const sentences = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML)).replace(/\s+/g, " ").trim()
        .split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const stuck = sentences.map(sentence => /^On a failure, the creature is also stuck to the end of (?:the|your) ([a-z]+)\.$/.exec(sentence)).find(Boolean);
    if (!stuck) return null;
    const thing = stuck[1];
    const find = pattern => { const found = sentences.map(sentence => [sentence, pattern.exec(sentence)]).filter(([, match]) => match); return found.length === 1 ? found[0] : null; };
    const offGuard = find(new RegExp(String.raw`^It is ${CONDITION} and can't move beyond the reach of your ${thing}\.$`));
    const sever = find(new RegExp(String.raw`^A creature can sever the ${thing} with a Strike that deals at least (\d+) slashing damage or attempt to ${ESCAPE} against your spell DC\.$`));
    const armour = find(new RegExp(String.raw`^The AC of the ${thing} is equal to your spell DC\.$`));
    const severed = find(new RegExp(String.raw`^Severing the ${thing} in this way deals no damage to you but ends the spell\.$`));
    const penalty = find(new RegExp(String.raw`^While a creature is stuck to the end of your ${thing}, actions you take with the ([a-z]+) trait take a [–−-](\d) (circumstance|status) penalty\.$`));
    const away = find(new RegExp(String.raw`^If you move so that the affected creature is outside of the ${thing}'s reach, the spell ends\.$`));
    if (![offGuard, sever, armour, severed, penalty, away].every(Boolean)) return null;
    const claimed = [sentences.find(sentence => sentence.includes(stuck[0])), offGuard[0], sever[0], armour[0], severed[0], penalty[0], away[0]];
    // What remains is the ordinary basic save.
    const remainder = sentences.filter(sentence => !claimed.includes(sentence)).join(" ");
    if (!assessSimpleBasicSaveDescription({ ...adapted, descriptionHTML: remainder }, analyzeDescription(remainder)).complete) return null;
    const duration = { mode: "fixed", value: spec.value, unit: spec.unit, expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: spec.raw ?? "the spell's duration" };
    const condition = { kind: "condition", slug: "off-guard", name: "Off-Guard", value: null, duration: { ...duration }, source: "description-reference",
        reference: offGuard[1][1].split(".").at(-1), raw: offGuard[0], endsWhen: [{ event: "escape", dc: "spell" }], expirationMode: "first", escapeSourceText: sever[0] };
    const note = { label: "Stuck", text: `Stuck to the end of the caster's ${thing}: it can't move beyond the ${thing}'s reach. It can sever the ${thing} with a Strike that deals at least ${sever[1][1]} slashing damage (the ${thing}'s AC is the caster's spell DC), which ends the spell, or Escape against the spell DC (a successful Escape ends its Off-Guard). If the caster moves so that it's outside the ${thing}'s reach, the spell ends. GM: remove this when it Escapes or the spell ends.`,
        sourceText: stuck[0], sourceTexts: [offGuard[0], sever[0], armour[0], severed[0], away[0]], gmPlays: true, duration: { ...duration } };
    const [, trait, amount, type] = penalty[1];
    const casterNote = { recipient: "source", kind: "while-target-condition", condition: "off-guard", degrees: ["failure", "criticalFailure"],
        text: `${penalty[0]} (Removed when the creature's Off-Guard from this spell ends.)`, sourceText: penalty[0], duration: { ...duration },
        rules: [{ key: "FlatModifier", selector: "all", type, value: -Number(amount), predicate: [{ or: [`item:trait:${trait}`, `self:action:trait:${trait}`] }] }], heightened: [] };
    return { condition, note, casterNote, sentences: claimed };
}
