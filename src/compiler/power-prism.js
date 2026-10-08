// A prism that bends magic (Prism of Power): "You create a prism that occupies a 5-foot square within range. When you create the prism, select one of the following
// options." — "Diffract … If a line spell enters the area of the prism, the area changes from a line to a cone and its size is equal to half the remaining feet the line
// could travel before it entered the prism in the same direction the line could travel (minimum 5 feet)." / "Refract … If a spell attack targets the prism or a line
// spell passes through its space, and doing so does not require all of the spell's range, it can alter directions. Determine your spell's line of effect and line of
// sight from the prism, as well as whether creatures have cover against the spell. The spell can exceed its normal range as measured from you, as long as it's within
// its normal range from the prism." / "Scatter … You can target 2 creatures with a spell attack by targeting the prism, targeting up to 2 creatures within 5 feet of the
// prism. For the purposes of a spell attack roll, you roll your spell attack roll once and compare the result against the AC of both creatures.": the prism a 5-foot
// region for the minute with the mode chosen; its card's control — Scatter: one spell attack against the AC of each of up to 2 creatures within 5 feet of it; Diffract:
// the cone's size from the feet the line had left, its template placed from the prism; Refract: the GM's measuring from the prism (a note).
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES } from "./text-patterns.js";

const LEAD = [/^You create a prism that occupies a @Template\[square\|distance:(\d+)\] within range\.$/, /^When you create the prism, select one of the following options\.$/];
const DIFFRACT = /^Diffract (Magic enters the prism and is split into a spectrum\.) If a line spell enters the area of the prism, the area changes from a line to a cone and its size is equal to half the remaining feet the line could travel before it entered the prism in the same direction the line could travel \(minimum (\d+) feet\)\.$/;
const REFRACT = /^Refract (Magic entering the prism can change directions, even around corners\.) (If a spell attack targets the prism or a line spell passes through its space, and doing so does not require all of the spell['’]s range, it can alter directions\. Determine your spell's line of effect and line of sight from the prism, as well as whether creatures have cover against the spell\. The spell can exceed its normal range as measured from you, as long as it['’]s within its normal range from the prism\.)$/;
const SCATTER = /^Scatter (Magic is dispersed and reflected all around the prism\.) You can target (\d) creatures with a spell attack by targeting the prism, targeting up to \2 creatures within (\d+) feet of the prism\. For the purposes of a spell attack roll, you roll your spell attack roll once and compare the result against the AC of both creatures\.$/;

/** {prism, sentences} or null. */
export function extractPowerPrism(item) {
    if (!/^1 minute$/.test(String(item?.system?.duration?.value ?? "").trim()) || item.system?.duration?.sustained || item.system?.defense || Object.keys(item.system?.damage ?? {}).length) return null;
    const html = String(item.system?.description?.value ?? "");
    const lead = htmlToPlainText(String(/^<p>([\s\S]*?)<\/p>/.exec(html)?.[1] ?? "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const options = [...html.matchAll(/<li>\s*<p>([\s\S]*?)<\/p>\s*<\/li>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    const square = LEAD[0].exec(lead[1] ?? ""), diffract = DIFFRACT.exec(options[0] ?? ""), refract = REFRACT.exec(options[1] ?? ""), scatter = SCATTER.exec(options[2] ?? "");
    if (lead.length !== 3 || NARRATION_RULES.test(lead[0]) || !square || !LEAD[1].test(lead[2]) || options.length !== 3 || !diffract || !refract || !scatter) return null;
    return {
        prism: { size: Number(square[1]), seconds: 60, modes: { diffract: { minimum: Number(diffract[2]) }, refract: { note: refract[2] }, scatter: { targets: Number(scatter[2]), reach: Number(scatter[3]) } } },
        sentences: [lead[1], lead[2], ...options]
    };
}

/** Diffract's cone: half the feet the line had left, in 5-foot steps, at least the minimum. */
export function diffractCone(prism, feetLeft) {
    return Math.max(prism.modes.diffract.minimum, Math.floor(Number(feetLeft) / 2 / 5) * 5);
}
