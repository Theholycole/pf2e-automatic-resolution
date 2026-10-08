// A voice and a face taken (Seize Identity): "For the duration, you look and sound like the target, and the target can't speak." with "Success You take on
// the target's appearance, with the same effects of a 3rd-rank Illusory Disguise spell, and the target can't speak, with the same effects of a 2nd-rank
// Silence spell." / "Failure As success, but the target also takes 4d6 mental damage …" / "Critical Failure … 8d6 …" and "The first time each round you
// Sustain this spell after you cast this spell, the target ages rapidly, taking (2, 3 from 9th)d8 void damage (basic Will save). On a failure, the target
// also becomes Enfeebled 1 or increases the value of its enfeebled condition by 1." with "Heightened (9th) The mental damage increases by 4d6, and the void
// damage increases by 1d8." — the rows' damage; the spell's controls card (from a success or worse): PF2e's Illusory Disguise Effect on the caster, PF2e's
// Silence Effect on the target, and the aging's basic save the GM presses on the first Sustain each round.
import { htmlToPlainText } from "./description-parser.js";

const plain = html => htmlToPlainText(String(html ?? "")).replace(/\s+/g, " ").trim();
const rowOf = (html, heading) => { const row = new RegExp(String.raw`<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>`).exec(html); return row ? row[1].replace(/\s+/g, " ").trim() : null; };
const LEAD = [/^With a gleeful cackle, you seize an individual's voice and swallow it\.$/, /^For the duration, you look and sound like the target, and the target can't speak\.$/,
    /^The effects depend on the result of the target's (Fortitude|Reflex|Will) saving throw\.$/];
const SUCCESS = /^You take on the target's appearance, with the same effects of a (\d)(?:st|nd|rd|th)-rank @UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{Illusory Disguise\} spell, and the target can't speak, with the same effects of a (\d)(?:st|nd|rd|th)-rank @UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{Silence\} spell\.$/;
const FAILURE = /^As success, but the target also takes (\d+)d(\d+) ([a-z]+) damage from the transformation\.$/;
const SUSTAIN = /^The first time each round you Sustain this spell after you cast this spell, the target ages rapidly, taking @Damage\[\(ternary\(gte\(@item\.rank,(\d+)\),(\d+),(\d+)\)\)d(\d+)\[([a-z]+)\]\] damage \(@Check\[(fortitude|reflex|will)\|basic\] save\)\. On a failure, the target also becomes @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Enfeebled (\d)\} or increases the value of its enfeebled condition by (\d)\.$/;
const STEP = /^Heightened \((\d+)(?:st|nd|rd|th)\) The mental damage increases by (\d+)d(\d+), and the void damage increases by (\d+)d(\d+)\.$/;

/** {html, aging, effects, sentences} or null. */
export function extractSeizedIdentity(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || adapted.lifecycle?.sustained !== true || !/^1 intelligent creature$/.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const [body, table, heightened, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!heightened || rest.length) return null;
    const lead = plain(body).split(/(?<=[.!?])\s+(?=[A-Z])/);
    if (lead.length !== 3 || LEAD.some((pattern, index) => !pattern.test(lead[index]))) return null;
    const statistic = LEAD[2].exec(lead[2])[1];
    const success = SUCCESS.exec(rowOf(table, "Success") ?? ""), failure = FAILURE.exec(plain(rowOf(table, "Failure") ?? "")), critical = FAILURE.exec(plain(rowOf(table, "Critical Failure") ?? ""));
    const sustainText = [...table.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(match => match[1].replace(/\s+/g, " ").trim()).find(text => /^The first time each round you Sustain/.test(text)) ?? "";
    const sustain = SUSTAIN.exec(sustainText), step = STEP.exec(plain(heightened));
    if (plain(rowOf(table, "Critical Success") ?? "") !== "The creature is unaffected." || !success || !failure || !critical || !sustain || !step) return null;
    if (Number(sustain[1]) !== Number(step[1]) || Number(sustain[2]) - Number(sustain[3]) !== Number(step[4]) || step[3] !== failure[2] || step[5] !== sustain[4]) return null;
    const at = Number(step[1]);
    const mental = dice => `(${dice}+${step[2]}*min(1,floor(@item.rank/${at})))d${failure[2]}[${failure[3]}]`;
    const aging = `(${sustain[3]}+${Number(sustain[2]) - Number(sustain[3])}*min(1,floor(@item.rank/${at})))d${sustain[4]}[${sustain[5]}]`;
    const Stat = sustain[6][0].toUpperCase() + sustain[6].slice(1);
    // (The increase for a creature already enfeebled is the condition's increment, set after compiling.)
    if (sustain[8] !== sustain[9]) return null;
    const enfeebled = `@UUID[${sustain[7]}]{Enfeebled ${sustain[8]}}`;
    return {
        html: `<p>The target must attempt a ${statistic} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> The target takes @Damage[${mental(failure[1])}] damage.</p><p><strong>Critical Failure</strong> The target takes @Damage[${mental(critical[1])}] damage.</p>`,
        aging: { formula: aging, statistic: sustain[6], html: `<p>The target must attempt a ${Stat} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target takes half damage.</p>`
            + `<p><strong>Failure</strong> The target takes full damage and is ${enfeebled}.</p><p><strong>Critical Failure</strong> The target takes double damage and is ${enfeebled}.</p>`, sourceText: plain(sustainText) },
        disguise: { spell: success[2], rank: Number(success[1]) }, silence: { spell: success[4], rank: Number(success[3]) },
        sentences: [...lead, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(rowOf(table, heading) ?? "")}`), plain(sustainText), plain(heightened)]
    };
}
