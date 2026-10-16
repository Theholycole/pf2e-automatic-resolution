// A tale whose telling sets its targets (Ibex's Harvest): "… The number of actions you spend when Casting this Spell and telling the story determine its targets
// and effects." / [1] "… One willing target you can touch gains 10 temporary Hit Points that last 1 minute." / [2] "… Two willing targets within 20 feet each
// gain 10 temporary Hit Points that last 1 minute." / [3] "… All creatures within a 10-foot emanation are affected by the tale. Choose one creature in the
// emanation to take 2d8 mental (basic Will save), while each other creature in the emanation gains 5 temporary Hit Points that last 1 minute." with
// "Heightened (+1) The temporary Hit Points increase by 3 and the mental damage for the 3-action version increases by 1d8.": the actions spent (asked when
// cast); temporary Hit Points (PF2e's rule on an Effect for the stated time) for the targeted willing creatures, or, with 3 actions, the chosen creature's
// basic save card (a plan of its own) and the temporary Hit Points for every other creature in the emanation.
import { WORD_NUMBERS_1_3 as WORDS, plain, sentenceSplit as split } from "./text-patterns.js";

const LEAD = /^The number of actions you spend when Casting this Spell and telling the story determine its targets and effects\.$/;
const ONE = /^(One|Two) willing targets? (you can touch|within (\d+) feet) (?:each )?gains? (\d+) temporary Hit Points that last (\d+) (minute|round)s?\.$/;
const AREA = /^All creatures within an? (\d+)-foot emanation are affected by the [a-z]+\.$/;
const CHOSEN = /^Choose one creature in the emanation to take (\d+)d(\d+) ([a-z]+) \(basic (Fortitude|Reflex|Will) save\), while each other creature in the emanation gains (\d+) temporary Hit Points that last (\d+) (minute|round)s?\.$/;
const STEP = /^Heightened \(\+1\) The temporary Hit Points increase by (\d+) and the [a-z]+ damage for the 3-action version increases by (\d+)d(\d+)\.$/;

/** {actionTale, saveHTML, claimed} or null. */
export function compileActionTale(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || !/^1 to 3$/.test(String(adapted.activation?.time ?? "").trim())) return null;
    const components = adapted.damageComponents ?? [];
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length || components.length !== 1 || components[0].category) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].trim());
    // (PF2e 8.6 puts the link to its spell Effect at the body's end, 8.5 after the heightened step: either is left.)
    const bodyLink = paragraphs.length === 5 && /^@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}$/.test(paragraphs[4]) ? paragraphs.pop() : null;
    if (paragraphs.length !== 4) return null;
    const lead = split(plain(paragraphs[0]));
    if (!LEAD.test(lead.at(-1) ?? "") || lead.slice(0, -1).some(sentence => /\d|@|\b(?:damage|save|bonus|penalty|Hit Points)\b/i.test(sentence))) return null;
    const glyph = (paragraph, count) => new RegExp(String.raw`^<span class="action-glyph">${count}<\/span>\s*([\s\S]*)$`).exec(paragraph)?.[1];
    const parts = [1, 2, 3].map(count => glyph(paragraphs[count], count));
    if (parts.some(part => part == null)) return null;
    const one = split(plain(parts[0])), two = split(plain(parts[1])), three = split(plain(parts[2]));
    const first = ONE.exec(one.at(-1) ?? ""), second = ONE.exec(two.at(-1) ?? "");
    const area = AREA.exec(three.at(-2) ?? ""), chosen = CHOSEN.exec(three.at(-1) ?? "");
    // (After the step, only a link to PF2e's spell Effect may follow: the module makes its own temporary Hit Points.)
    const hParagraphs = [...heightened.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].trim());
    if (hParagraphs.slice(1).some(paragraph => !/^@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}$/.test(paragraph))) return null;
    const heightenedText = plain(`<p>${hParagraphs[0] ?? ""}</p>`), step = STEP.exec(heightenedText);
    const narration = sentences => sentences.slice(0, -1).every(sentence => !/\d|@|\b(?:damage|save|bonus|penalty|Hit Points)\b/i.test(sentence));
    if (!first || !second || !area || !chosen || !step || one.length !== 2 || two.length !== 2 || three.length !== 3 || !narration(one) || !narration(two) || !narration([three[0], ""])
        || WORDS[first[1].toLowerCase()] !== 1 || WORDS[second[1].toLowerCase()] !== 2 || first[2] !== "you can touch" || !second[3]) return null;
    const [, dice, faces, type, statistic] = chosen;
    if (statistic.toLowerCase() !== adapted.defense.statistic || String(components[0].formula).replace(/\s+/g, "") !== `${dice}d${faces}` || String(components[0].type).toLowerCase() !== type
        || step[3] !== faces || adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== 1 || String(adapted.heightening.damage?.[components[0].id] ?? "").replace(/\s+/g, "") !== `${step[2]}d${faces}`
        || Number(area[1]) !== Number(adapted.targeting?.area?.value) || adapted.targeting?.area?.type !== "emanation") return null;
    const time = (value, unit) => ({ value: Number(value), unit: `${unit}s` });
    return {
        actionTale: {
            baseRank: Number(adapted.rank) || 1, thpStep: Number(step[1]),
            actions: {
                1: { targets: 1, touch: true, thp: Number(first[4]), duration: time(first[5], first[6]), sourceText: one.at(-1) },
                2: { targets: 2, within: Number(second[3]), thp: Number(second[4]), duration: time(second[5], second[6]), sourceText: two.at(-1) },
                3: { emanation: Number(area[1]), statistic: statistic.toLowerCase(), othersThp: Number(chosen[5]), duration: time(chosen[6], chosen[7]), sourceText: three.at(-1) }
            }
        },
        saveHTML: `<p>The target takes ${dice}d${faces} ${type} damage (basic ${statistic} save).</p><hr /><p><strong>Heightened (+1)</strong> The damage increases by ${step[2]}d${faces}.</p>`,
        claimed: [...lead, ...one, ...two, ...three, heightenedText]
    };
}
