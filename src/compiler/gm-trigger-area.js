// A placed area whose save the GM triggers when a creature in it does a stated thing (Bralani Referendum; user decision 2026-10-01: what the
// module can't detect is a GM control):
//   "When you Cast this Spell, choose one condition from among Clumsy, Drained, Enfeebled, or Stupefied." / "When a creature in the area
//   inflicts the chosen condition, they take 2d6 slashing damage with a basic Fortitude save." / "A creature can't take this damage more than
//   once per round." / "You can Dismiss the spell." / "Heightened (+2) Choose one more condition. The slashing damage when a creature inflicts
//   any of the chosen conditions increases by 2d6."
// Rewritten to the lingering basic-save area, its exposure being the GM's control (the targeted creatures in the area, once a round each);
// the conditions are chosen when the area starts (one, and one more each heightened step).
import { htmlToPlainText } from "./description-parser.js";
import { DISMISS_THE as DISMISS, NARRATION_RULES_NO_TERRAIN as NARRATION_RULES } from "./text-patterns.js";

const CONDITION = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{([A-Z][a-z]+)\}`;
const CHOOSE = new RegExp(String.raw`^When you Cast this Spell, choose one condition from among ((?:${CONDITION}, )+(?:or )?${CONDITION})\.$`);
const TRIGGER = /^When a creature in the area inflicts the chosen condition, they take (\d+)d(\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\.$/;
const ONCE = /^A creature can't take this damage more than once per round\.$/;

/** {html, gmTrigger, sentences} or null. */
export function extractGmTriggerArea(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || String(adapted.targeting?.target ?? "").trim() || area?.type !== "burst" || adapted.lifecycle?.sustained) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length > 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    let choose = null, trigger = null, once = false, dismiss = false, narration = 0;
    for (const [index, sentence] of sentences.entries()) {
        if (!choose && CHOOSE.test(sentence)) { choose = sentence; continue; }
        if (!trigger && TRIGGER.test(sentence)) { trigger = TRIGGER.exec(sentence); continue; }
        if (!once && ONCE.test(sentence)) { once = true; continue; }
        if (!dismiss && DISMISS.test(sentence)) { dismiss = true; continue; }
        if (index === 0 && !NARRATION_RULES.test(sentence)) { narration++; continue; }
        return null;
    }
    if (!choose || !trigger || !once || `${trigger[1]}d${trigger[2]}` !== String(components[0].formula).replace(/\s+/g, "") || trigger[3] !== String(components[0].type).toLowerCase()
        || trigger[4].toLowerCase() !== adapted.defense.statistic) return null;
    const choices = [...choose.matchAll(new RegExp(CONDITION, "g"))].map(match => match[1].toLowerCase());
    // "Heightened (+2) Choose one more condition. The slashing damage when a creature inflicts any of the chosen conditions increases by 2d6."
    let step = null;
    if (rest.length) {
        const heightened = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*Choose one more condition\. The ([a-z]+) damage when a creature inflicts any of the chosen conditions increases by (\d+d\d+)\.\s*<\/p>$/.exec(rest[0]);
        if (!heightened || heightened[2] !== trigger[3] || !(adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(heightened[1])
            && adapted.heightening.damage?.[components[0].id] === heightened[3])) return null;
        step = { interval: Number(heightened[1]), add: 1 };
    }
    return {
        html: `<p>A creature that enters the area takes ${trigger[1]}d${trigger[2]} ${trigger[3]} damage (basic ${trigger[4]} save). A creature can take this damage only once per round.</p>`
            + (rest.length ? `<hr /><p><strong>Heightened (+${step.interval})</strong> The damage increases by ${adapted.heightening.damage[components[0].id]}.</p>` : ""),
        gmTrigger: { kind: "inflicts-condition", choices, count: 1, step, baseRank: adapted.rank, sourceText: [choose, trigger[0]].join(" ") },
        dismissible: dismiss, sentences
    };
}
