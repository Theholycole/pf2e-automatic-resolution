// A condition chosen by one roll for the cast, stated before the table and applied by the rows:
//   "Roll [[/r 1d4]]. On a 1, the foe becomes clumsy; on a 2, it becomes enfeebled; on a 3, it becomes stupefied; and on a
//   4, you choose which condition applies." with rows "The target is either Clumsy 1, Enfeebled 1, or Stupefied 1 for 1
//   round, depending on the result of the d4." and "As failure, but … . The condition's value is 3, and the condition
//   lasts for 2 rounds." (Temporal Distortion)
// Each row gets the three conditions marked `choiceGroup`; the card rolls once and keeps the rolled (or chosen) one.
import { htmlToPlainText } from "./description-parser.js";

const ROLL = /^Roll \[\[\/r (1d(\d+))\]\]\.$/;
const MAP = /^On a 1, the (?:foe|target|creature) becomes ([a-z]+); on a 2, it becomes ([a-z]+); on a 3, it becomes ([a-z]+); and on a 4, you choose which condition applies\.$/;
const ROW = /^The (?:target|creature) is either ([a-z]+) (\d+), ([a-z]+) (\d+), or ([a-z]+) (\d+) for (\d+) (round|minute)s?, depending on the result of the d4\.$/i;
const STRONGER = /^As failure, but [a-z ,']+\.$/;
const CHANGED = /^The condition's value is (\d+), and the condition lasts for (\d+) (round|minute)s?\.$/;
const RULE_WORDS = /\d|@|\b(?:damage|save|bonus|penalty|immune|can't|must|until)\b/i;

const plain = text => htmlToPlainText(String(text ?? "")).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim();
const sentences = text => plain(text).split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
const duration = (value, unit, sourceText) => ({ mode: "fixed", value: Number(value), unit: `${unit}s`, expiry: unit === "round" ? "turn-start" : null, anchor: "effect-start", sourceText });

export function compileConditionRoll(plan, preambleHTML) {
    const pre = sentences(preambleHTML);
    const rollIndex = pre.findIndex(sentence => ROLL.test(sentence));
    if (rollIndex < 0) return null;
    const roll = ROLL.exec(pre[rollIndex]), map = MAP.exec(pre[rollIndex + 1] ?? "");
    if (!map || roll[2] !== "4") return null;
    const options = [map[1], map[2], map[3]];
    if (new Set(options).size !== 3) return null;
    // The success row's linked conditions are the templates (slug, uuid, label).
    const templates = Object.fromEntries(Object.values(plan.resolution.outcomes).flatMap(outcome => outcome.effects ?? []).filter(effect => options.includes(effect.slug)).map(effect => [effect.slug, effect]));
    if (options.some(slug => !templates[slug])) return null;
    const rows = {};
    for (const degree of ["success", "failure", "criticalFailure"]) {
        const text = sentences(plan.resolution.outcomes[degree]?.rawText);
        const row = text.length === 1 ? ROW.exec(text[0]) : null;
        if (row) {
            const listed = [row[1], row[3], row[5]].map(name => name.toLowerCase());
            if (JSON.stringify(listed) !== JSON.stringify(options) || row[2] !== row[4] || row[4] !== row[6]) return null;
            rows[degree] = { value: Number(row[2]), duration: duration(row[7], row[8], `for ${row[7]} ${row[8]}${row[7] === "1" ? "" : "s"}`), claims: text };
            continue;
        }
        // "As failure, but <narration>. The condition's value is 3, and the condition lasts for 2 rounds."
        if (text.length === 2 && STRONGER.test(text[0]) && !RULE_WORDS.test(text[0].replace(/^As failure, but /, "")) && CHANGED.test(text[1]) && rows.failure) {
            const changed = CHANGED.exec(text[1]);
            rows[degree] = { value: Number(changed[1]), duration: duration(changed[2], changed[3], text[1]), claims: text };
            continue;
        }
        if (!/^The (?:target|creature) is unaffected\.$/.test(text.join(" "))) return null;
    }
    if (!rows.success && !rows.failure) return null;
    for (const [degree, row] of Object.entries(rows)) {
        const outcome = plan.resolution.outcomes[degree];
        outcome.effects = options.map(slug => ({ ...structuredClone(templates[slug]), value: row.value, duration: structuredClone(row.duration), choiceGroup: "condition-roll" }));
        outcome.conditionRollClaims = row.claims;
    }
    return { conditionRoll: { formula: roll[1], results: { 1: options[0], 2: options[1], 3: options[2] }, chooseOn: [4], options }, sentences: [pre[rollIndex], pre[rollIndex + 1]] };
}

// Realityflicker (Witches+): "The target takes 1d4 damage, and then rolls [[/r 1d4]] and gains the following condition until the end of its next turn." with the
// list "The target is Clumsy 1." / "… Enfeebled 1." / "… Stupefied 1." / "The target is Clumsy 1, Enfeebled 1, or Stupefied 1, your choice." and "The target takes
// double damage and rolls [[/r 2d4]]. If they would get the same condition twice, you can treat the second result as if they had rolled a 4." — the card's
// roll picks the condition (a 4 the caster's choice), until the end of the creature's next turn; a critical failure rolls a second (the same one again
// becoming the caster's choice of another).
const FLICKER_FAILURE = /^The target takes (\d+d\d+) damage, and then rolls \[\[\/r 1d(\d)\]\] and gains the following condition until the end of its next turn\.$/;
const FLICKER_ITEM = /^The target is @UUID\[Compendium\.pf2e\.conditionitems\.Item\.([A-Za-z0-9]+)\]\{([A-Z][a-z]+) (\d)\}\.$/;
const FLICKER_CHOICE = /^The target is @UUID\[[^\]]+\]\{([A-Z][a-z]+) (\d)\}, @UUID\[[^\]]+\]\{([A-Z][a-z]+) \2\}, or @UUID\[[^\]]+\]\{([A-Z][a-z]+) \2\}, your choice\.$/;
const FLICKER_CRITICAL = /^The target takes double damage and rolls \[\[\/r 2d(\d)\]\]\. If they would get the same condition twice, you can treat the second result as if they had rolled a (\d)\.$/;
export function compileFlickerRoll(plan, components) {
    const outcomes = plan.resolution.outcomes ?? {};
    const raw = degree => String(outcomes[degree]?.rawText ?? "").replace(/\s+/g, " ").trim();
    const split = text => text.split(/(?<=\.)\s+(?=[A-Z@])/).filter(Boolean);
    const failure = split(raw("failure")), critical = FLICKER_CRITICAL.exec(raw("criticalFailure"));
    const head = FLICKER_FAILURE.exec(failure[0] ?? ""), items = failure.slice(1, 4).map(sentence => FLICKER_ITEM.exec(sentence)), choice = FLICKER_CHOICE.exec(failure[4] ?? "");
    const component = (components ?? []).length === 1 && !components[0].category ? components[0] : null;
    if (!head || !critical || items.some(item => !item) || !choice || failure.length !== 5 || head[2] !== "4" || critical[1] !== "4" || critical[2] !== "4" || !component
        || String(component.formula).replace(/\s+/g, "") !== head[1] || !/^The target takes half damage\.$/.test(raw("success")) || !/^The target is unaffected\.$/.test(raw("criticalSuccess"))) return null;
    const options = items.map(item => item[2].toLowerCase());
    if (new Set(options).size !== 3 || JSON.stringify([choice[1], choice[3], choice[4]].map(name => name.toLowerCase())) !== JSON.stringify(options) || items.some(item => item[3] !== choice[2])) return null;
    const lasts = { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 1, sourceText: "until the end of its next turn" };
    const effects = () => items.map(item => ({ kind: "condition", slug: item[2].toLowerCase(), name: item[2], value: Number(item[3]), duration: { ...lasts }, source: "description-reference",
        reference: item[1], raw: `@UUID[Compendium.pf2e.conditionitems.Item.${item[1]}]{${item[2]} ${item[3]}}`, expirationMode: "duration", choiceGroup: "condition-roll" }));
    for (const [degree, multiplier] of [["failure", 1], ["criticalFailure", 2]]) {
        const outcome = outcomes[degree];
        outcome.effects = effects();
        outcome.damage = { mode: "shared", multiplier, sourceComponentIds: [component.id] };
        outcome.conditionRollClaims = [raw(degree)];
        outcome.manualInstructions = [];
    }
    return { conditionRoll: { formula: "1d4", results: { 1: options[0], 2: options[1], 3: options[2] }, chooseOn: [4], options, criticalSecond: true }, sentences: [raw("failure"), raw("criticalFailure")] };
}
