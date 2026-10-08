// A spell whose effect depends on the target's level, no save (the power words, Fatal Aria): "Once targeted, the target is then temporarily immune for 10 minutes. The
// effect of the spell depends on the target's level." with tiers ("13th or Lower", "14th-15th", "16th or Higher", "17th") as a list or paragraphs, each one of:
//   "The target is {Stunned} for [[/r 1d6 #rounds]]{1d6 rounds}." / "The target is Stunned for 1 round." / "The target is {Stunned 1}." / "The target is Blinded
//   permanently." / "The target is {Dazzled} for 1 minute." / "The target dies instantly." / "If the target has 50 Hit Points or fewer, it dies instantly; otherwise,
//   it drops to 0 Hit Points and becomes {Dying 1}(, or increases its Dying condition by 1 if it's already Dying)." / "The target takes 50 damage; if this brings the
//   target to 0 Hit Points, the target dies instantly." (or "@Damage[50[untyped]] … If this brings it to 0 Hit Points, it dies instantly.")
// with "Heightened (+1)" or "Heightened (10th)" "The levels at which each outcome applies increase by 2." — the target's tier at the cast rank, its outcome applied,
// and the target's temporary immunity Effect.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_NO_TERRAIN as NARRATION_RULES } from "./text-patterns.js";

const LINK = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+)(?: (\d+))?\}`;
const IMMUNE = /^Once targeted, the (?:target is then|creature becomes) temporarily immune for (\d+) (minute|hour|day)s?\.$/;
const DEPENDS = /^The effect of the spell depends on the target's level( and current Hit Points)?\.$/;
const WORD = new RegExp(`^You utter an arcane word of power that can make the target ${LINK} upon hearing it\\.$`);
const TIER = /^(\d+)(?:st|nd|rd|th)(?: or (Lower|Higher)|-(\d+)(?:st|nd|rd|th))?$/;
const OUTCOMES = [
    [new RegExp(`^The target is (?:${LINK}|([A-Z][a-z]+)) for \\[\\[/r (\\d+d\\d+) #(rounds|minutes)\\]\\]\\{\\5 \\6\\}\\.$`), m => ({ kind: "condition", uuid: m[1], name: m[2] ?? m[4], value: m[3] ? Number(m[3]) : null, rolled: { formula: m[5], unit: m[6] } })],
    [new RegExp(`^The target is (?:${LINK}|([A-Z][a-z]+)) for (\\d+) (round|minute)s?\\.$`), m => ({ kind: "condition", uuid: m[1], name: m[2] ?? m[4], value: m[3] ? Number(m[3]) : null, fixed: { value: Number(m[5]), unit: `${m[6]}s` } })],
    [new RegExp(`^The target is ${LINK}\\.$`), m => ({ kind: "condition", uuid: m[1], name: m[2], value: m[3] ? Number(m[3]) : null })],
    [new RegExp(`^The target is (?:${LINK}|([A-Z][a-z]+)) permanently\\.$`), m => ({ kind: "condition", uuid: m[1], name: m[2] ?? m[4], value: m[3] ? Number(m[3]) : null, permanent: true })],
    [/^The target dies instantly\.$/, () => ({ kind: "death" })],
    [new RegExp(`^If the target has (\\d+) Hit Points or fewer, it dies instantly; otherwise, it drops to 0 Hit Points and becomes ${LINK}(, or increases its Dying condition by 1 if it's already Dying)?\\.$`),
        m => m[3] === "Dying" ? ({ kind: "death-or-dying", threshold: Number(m[1]), uuid: m[2], dying: Number(m[4] ?? 1), stacks: !!m[5] }) : null],
    [/^The target takes (?:@Damage\[(\d+)\[untyped\]\]|(\d+)) damage(?:; if this brings the target to 0 Hit Points, the target dies instantly| ?\. If this brings it to 0 Hit Points, it dies instantly)\.$/,
        m => ({ kind: "damage-or-death", amount: Number(m[1] ?? m[2]) })]
];
const STEP = /^Heightened \((\+1|\d+(?:st|nd|rd|th))\) The levels at which each outcome applies increase by (\d+)\.$/;

/** {levelTiers, claimed} or null. */
export function compileLevelTiers(adapted) {
    if (adapted.defense?.kind !== "none" || adapted.targeting?.area || !/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const parts = html.split(/<hr\s*\/?>/i);
    // The tiers: the list's items, or the paragraphs that open with a tier label.
    const tierHTML = [...html.matchAll(/<(li|p)>\s*<strong>([^<]+)<\/strong>\s*([\s\S]*?)<\/\1>/g)].map(match => ({ label: match[2].trim(), text: match[3].trim(), whole: match[0] }));
    const tiers = [], claimed = [];
    let step = null;
    for (const entry of tierHTML) {
        const heightened = /^Heightened/.test(entry.label) ? STEP.exec(htmlToPlainText(`${entry.label} ${entry.text}`).replace(/\s+/g, " ").trim()) : null;
        if (/^Heightened/.test(entry.label)) { if (!heightened || step) return null; step = heightened[1] === "+1" ? { interval: 1, levels: Number(heightened[2]) } : { atRank: parseInt(heightened[1], 10), levels: Number(heightened[2]) }; claimed.push(htmlToPlainText(`${entry.label} ${entry.text}`).replace(/\s+/g, " ").trim()); continue; }
        const label = TIER.exec(entry.label);
        if (!label) return null;
        const text = entry.text.replace(/\s+/g, " ").trim();
        const found = OUTCOMES.map(([pattern, build]) => { const match = pattern.exec(text); return match ? build(match) : null; }).find(Boolean);
        if (!found) return null;
        tiers.push({ min: label[2] === "Higher" ? Number(label[1]) : label[3] ? Number(label[1]) : label[2] === "Lower" ? -Infinity : Number(label[1]),
            max: label[2] === "Lower" ? Number(label[1]) : label[3] ? Number(label[3]) : label[2] === "Higher" ? Infinity : Number(label[1]), outcome: found });
        claimed.push(htmlToPlainText(`${entry.label} ${entry.text}`).replace(/\s+/g, " ").trim());
    }
    if (tiers.length < 3) return null;
    // Contiguous, lowest first.
    for (let index = 1; index < tiers.length; index++) if (tiers[index].min !== tiers[index - 1].max + 1) return null;
    if (tiers[0].min !== -Infinity || tiers.at(-1).max !== Infinity) return null;
    // A condition named in plain text is the one the spell links elsewhere.
    const links = new Map([...html.matchAll(new RegExp(LINK, "g"))].map(match => [match[2], match[1]]));
    for (const tier of tiers) if (tier.outcome.kind === "condition" && !tier.outcome.uuid) { tier.outcome.uuid = links.get(tier.outcome.name) ?? null; if (!tier.outcome.uuid) return null; }
    // The lead: narration, the immunity, "depends on".
    let rest = html;
    for (const entry of tierHTML) rest = rest.replace(entry.whole, "");
    const lead = htmlToPlainText(rest.replace(/<\/?(?:ul|hr)\s*\/?>/gi, " ")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    let immunity = null, depends = null;
    for (const [index, sentence] of lead.entries()) {
        const immune = IMMUNE.exec(sentence);
        if (immune && !immunity) { immunity = { seconds: Number(immune[1]) * { minute: 60, hour: 3600, day: 86400 }[immune[2]] }; claimed.push(sentence); continue; }
        const dep = DEPENDS.exec(sentence);
        if (dep && !depends) { depends = { hitPoints: !!dep[1] }; claimed.push(sentence); continue; }
        if (index === 0 && (!NARRATION_RULES.test(sentence) || WORD.test(lead[0].replace(/\s+/g, " ")) || WORD.test(String(sentence)))) continue;
        return null;
    }
    // (The raw lead keeps the link for the arcane-word narration.)
    if (!immunity || !depends || (depends.hitPoints && !tiers.some(tier => tier.outcome.kind === "death-or-dying"))) return null;
    if (parts.length > 1 && !step) return null;
    return { levelTiers: { tiers: tiers.map(tier => ({ ...tier, min: Number.isFinite(tier.min) ? tier.min : null, max: Number.isFinite(tier.max) ? tier.max : null })), immunity, step, baseRank: Number(adapted.rank) || 1 },
        claimed };
}

/** The tier for a target's level at a cast rank (the heightened shift applied). */
export function levelTierAt(data, level, castRank) {
    const shift = !data.step ? 0 : data.step.interval ? Math.max(0, Number(castRank) - data.baseRank) * data.step.levels : Number(castRank) >= data.step.atRank ? data.step.levels : 0;
    return data.tiers.find(tier => (tier.min == null || Number(level) >= tier.min + shift) && (tier.max == null || Number(level) <= tier.max + shift)) ?? null;
}
