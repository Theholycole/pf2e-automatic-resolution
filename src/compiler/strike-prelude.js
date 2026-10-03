// Strike-prelude spells: "Make a ranged firearm Strike. Regardless of the result, each enemy in a 20-foot emanation
// around you must succeed at a Will save …". The Strike is the caster's own PF2e Strike (PF2e rolls it and applies its
// damage); the rest of the spell doesn't depend on its result and is resolved by the ordinary save route. The card
// tells the caster to make the Strike. Rules that change the Strike itself (its range, damage type, multiple attack
// penalty, concealment) aren't read, so such spells stay unresolved. One exception is additional damage on a hit
// ("if you hit, you deal an additional 3d8 sonic damage"): it's added to the Strike's own damage roll by a generated
// PF2e damage-dice Effect on the caster, removed after the caster's next Strike damage roll.
import { htmlToPlainText } from "./description-parser.js";

const LINK = /@UUID\[[^\]]+\]\{[^}]+\}/g;
// "Make a melee Strike with your two-handed weapon." / "Make a ranged firearm Strike." /
// "Make a melee Strike against a creature in your reach; if you hit, you deal an additional 3d8 sonic damage."
const STRIKE = /^Make an? (melee|ranged)(?: (firearm))? Strike(?: with your two-handed weapon| against a creature in your reach)?(?:; if you hit, you deal an additional (\d+d\d+) ([a-z]+) damage)?\.$/;
const REGARDLESS = /^Regardless of the result(?: of your Strike)?, /;
// Movement the caster makes around the Strike: "You Stride up to 50 feet. This movement doesn't trigger reactions."
const MOVEMENT = [/^You Stride up to \d+ feet\.$/, /^This movement doesn't trigger reactions\.$/];
// "You can make a Strike at any point during your Stride."
const STRIKE_DURING = /^You can make a Strike at any point during your Stride\.$/;
// A rider that depends on the Strike's result: "If your Strike hits and deals damage, the wave flows after you to
// batter the target of your Strike, dealing 2d10 bludgeoning damage and pushing it 10 feet in a direction of your choice."
const ON_HIT = /^If (?:your|the) Strike hits( and deals damage)?, (?:[^.]+?, )?(?:dealing|the target takes) (\d+d\d+) ([a-z]+) damage(?: and pushing it (\d+) feet (in a direction of your choice|away from you))?\.$/;
const RULE_WORDS = /\d|\b(?:damage|save|bonus|penalty|Strike|condition|immune)\b/i;

/** The spell's rules, with the Strike set aside; null for anything outside the grammar. */
export function extractStrikePrelude(adapted) {
    // PF2e repeats the item's Requirements at the start of the description (sometimes as its own paragraph and rule).
    const requirements = String(adapted.activation?.requirements ?? "").trim().replace(/\.$/, "");
    const html = String(adapted.descriptionHTML ?? "").replace(/^\s*<p>\s*<strong>\s*Requirements\s*<\/strong>([^<]*)<\/p>\s*(?:<hr\s*\/?>)?/i,
        (all, stated) => requirements && stated.trim().replace(/\.$/, "") === requirements ? "" : all);
    const [base, ...rest] = html.split(/(?=<hr\b[^>]*>\s*<p>\s*<strong>\s*Heightened\b)/i);
    const links = [];
    const masked = base.replace(LINK, link => `@@${links.push(link) - 1}@@`);
    const unmask = text => text.replace(/@@(\d+)@@/g, (_, index) => links[Number(index)]);
    const text = htmlToPlainText(masked).replace(/\s+/g, " ").trim();
    const body = requirements && text.startsWith(`Requirements ${requirements}`) ? text.slice(`Requirements ${requirements}`.length).replace(/^\.\s*/, "") : text;
    const sentences = body.split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    // A Strike whose result decides a rider (the card reads the Strike's degree from PF2e).
    const during = sentences.findIndex(sentence => STRIKE_DURING.test(sentence));
    if (during >= 0) return strikeResult(adapted, sentences, during, unmask, rest);
    const conditions = strikeConditions(adapted, sentences, unmask, rest);
    if (conditions !== undefined) return conditions;
    const breakPush = strikeBreakPush(adapted, sentences, unmask, rest);
    if (breakPush !== undefined) return breakPush;
    const index = sentences.findIndex(sentence => STRIKE.test(sentence));
    if (index < 0 || sentences.filter(sentence => /\bStrike\b/.test(sentence)).length > 2) return null;
    const narration = sentences.slice(0, index);
    if (narration.some(sentence => RULE_WORDS.test(sentence))) return null;
    const [, reach, weapon, extraDice, extraType] = STRIKE.exec(sentences[index]);
    const area = adapted.targeting?.area;
    const areaNoun = area?.type;
    const areaText = `${area?.value}-foot ${areaNoun}`;
    const reminders = [];
    const rules = [];
    for (const sentence of sentences.slice(index + 1)) {
        let rule = sentence.replace(REGARDLESS, "");
        rule = rule.charAt(0).toUpperCase() + rule.slice(1);
        // "The target of your Strike must be within the cone or the effect fails." — the GM checks placement.
        if (/^The target of your Strike must be within the (?:cone|emanation|area) or the effect fails\.$/.test(rule)) {
            reminders.push({ kind: "strike-placement", text: sentence });
            continue;
        }
        // "… that creature becomes the point of origin of a 15-foot cone, aimed directly away from you."
        const origin = new RegExp(String.raw`^That creature becomes the point of origin of an? ${areaText}, aimed directly away from you\.$`).exec(rule);
        if (origin) { reminders.push({ kind: "strike-placement", text: sentence }); continue; }
        // The area subject names the item's area.
        rule = rule.replace(new RegExp(String.raw`\b(creatures?|enem(?:y|ies)) in (?:an? ${areaText}(?: (?:around|from) you)?|that ${areaNoun})\b`), `$1 in the ${areaNoun}`);
        // "… must attempt a basic Fortitude save against your spell DC or take 2 sonic damage." is a basic save.
        rule = rule.replace(/^(Each creature in the [a-z]+) must attempt a basic (Fortitude|Reflex|Will) save against your spell DC or take (\d+(?:d\d+)?) ([a-z]+) damage\.$/, "$1 takes $3 $4 damage (basic $2 save).");
        // "… must succeed at a Will save against your spell DC or be …" is a one-sentence degree table.
        rule = rule.replace(/ against your spell DC(?= or )/, "");
        rules.push(unmask(rule));
    }
    if (!rules.length || !areaNoun) return null;
    // PF2e stores no defense for some of these ("… must succeed at a Will save against your spell DC …"): the text's
    // one stated save is the spell's save.
    const stated = rules.join(" ").match(/\bmust (?:succeed at|attempt) an? (Fortitude|Reflex|Will) save\b/g) ?? [];
    let defense = null;
    if (adapted.defense?.kind === "none") {
        if (stated.length !== 1) return null;
        defense = { kind: "save", statistic: /Fortitude|Reflex|Will/.exec(stated[0])[0].toLowerCase(), basic: false };
    }
    return {
        ...(defense ? { defense } : {}),
        // The narration before the Strike carries no rule (checked above); only the rules are compiled.
        html: `<p>${rules.join(" ")}</p>${rest.join("")}`,
        narration: narration.map(unmask),
        strike: {
            reach, weapon: weapon ?? null, sourceText: unmask(sentences[index]),
            ...(extraDice ? { extraOnHit: { formula: extraDice, damageType: extraType } } : {})
        },
        reminders,
        // The Target field names the Strike's target; the save's recipients are the area's creatures.
        constraints: String(adapted.targeting?.target ?? "").trim() ? { sourceText: `description: creatures in the ${areaNoun}`, supportsActorTargets: true, complete: true, predicates: [] } : null
    };
}

// A Strike whose weapon breaks and pushes the creatures next to the caster (Turbulent Tide):
//   "Make a melee Strike with your improvised weapon." / "The weapon then breaks, and each creature adjacent to you must succeed at a
//   Fortitude saving throw against your spell DC or be pushed 5 feet away from you (10 feet on a critical failure)." / "You can Stride
//   after the target of your Strike if they are pushed but you must move the same distance and in the same direction." / "If the item has
//   a Hardness greater than your level, or if it's an artifact, …, it doesn't break and adjacent creatures don't need to attempt Fortitude
//   saves."
// The save is a push table for creatures in a 5-foot emanation; the break is the GM's yes/no on the card (no break: nobody saves); the
// caster's follow-up Stride is a reminder. Returns undefined when the spell isn't this shape.
const IMPROVISED_STRIKE = /^Make a melee Strike with your improvised weapon\.$/;
const BREAK_PUSH = /^The weapon then breaks, and each creature adjacent to you must succeed at an? (Fortitude|Reflex|Will) saving throw against your spell DC or be pushed (\d+) feet away from you \((\d+) feet on a critical failure\)\.$/;
const FOLLOW_PUSHED = /^You can Stride after the target of your Strike if they are pushed but you must move the same distance and in the same direction\.$/;
const UNBREAKABLE = /^If the item has a Hardness greater than your level, or if it's an artifact, cursed item, or other item that's difficult to break or destroy, it doesn't break and adjacent creatures don't need to attempt (Fortitude|Reflex|Will) saves\.$/;

function strikeBreakPush(adapted, sentences, unmask, rest) {
    const index = sentences.findIndex(sentence => IMPROVISED_STRIKE.test(sentence));
    if (index < 0 || !BREAK_PUSH.test(sentences[index + 1] ?? "")) return undefined;
    const narration = sentences.slice(0, index), after = sentences.slice(index + 2);
    if (narration.some(sentence => RULE_WORDS.test(sentence)) || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    if (after.length !== 2 || !FOLLOW_PUSHED.test(after[0]) || !UNBREAKABLE.test(after[1])) return null;
    const [, statistic, feet, critical] = BREAK_PUSH.exec(sentences[index + 1]);
    if (UNBREAKABLE.exec(after[1])[1] !== statistic || (adapted.defense?.kind === "save" && adapted.defense.statistic !== statistic.toLowerCase())) return null;
    return {
        ...(adapted.defense?.kind === "save" ? {} : { defense: { kind: "save", statistic: statistic.toLowerCase(), basic: false } }),
        area: { type: "emanation", value: 5 },
        html: `<p>Each creature in the area must succeed at a ${statistic} saving throw or be pushed ${feet} feet away from you (or ${critical} feet on a critical failure).</p>${rest.join("")}`,
        narration: narration.map(unmask),
        strike: { reach: "melee", weapon: "improvised", sourceText: unmask(sentences[index]) },
        reminders: [{ kind: "strike-placement", text: "The improvised weapon breaks: mark it broken (unless the GM answers that it doesn't)." },
            { kind: "strike-placement", text: `${after[0]} (Move your token too.)` }],
        castGate: { question: "Did the improvised weapon break? It doesn't if its Hardness is greater than your level, or it's an artifact, cursed item or other item that's difficult to break or destroy. If not, no creature saves.",
            sourceText: after[1] },
        breakText: sentences[index + 1],
        constraints: { sourceText: "description: creatures adjacent to you", supportsActorTargets: true, complete: true, predicates: [] }
    };
}

// "Make a melee Strike with your qi-infused fabric." then conditions on the Strike's result (no damage of the spell's own):
// "On a success, the target is Immobilized until the start of your next turn, though it can attempt to Escape against your
// spell DC." / "On a critical success, <narration>, making it your choice of Clumsy 1 or Enfeebled 1 until the start of your
// next turn, in addition to immobilizing it."
const CONDITION_STRIKE = /^Make an? (melee|ranged) Strike with your [a-z-]+(?: [a-z-]+){0,2}\.$/;
const ON_SUCCESS = /^On a (?:success|hit), the (target is (@@\d+@@)[^]*)\.$/;
const ON_CRITICAL = /^On a critical (?:success|hit), [a-z' ,]+?, making it (your choice of @@\d+@@ or @@\d+@@ (?:until the (?:start|end) of your next turn|for \d+ (?:round|minute)s?)), in addition to ([a-z]+) it\.$/;
const CONDITION_NAME = /\{([A-Za-z-]+)(?: \d+)?\}$/;

/**
 * A Strike with no damage of the spell's own, whose result decides conditions: the card's check is the caster's PF2e Strike;
 * a hit applies the success row, a critical hit the success row plus the critical one. Returns undefined when the spell
 * isn't this shape, and null when it is but something isn't read.
 */
function strikeConditions(adapted, sentences, unmask, rest) {
    const index = sentences.findIndex(sentence => CONDITION_STRIKE.test(sentence));
    if (index < 0 || (adapted.damageComponents ?? []).length || adapted.defense?.kind !== "none" || adapted.targeting?.area) return undefined;
    const narration = sentences.slice(0, index);
    const after = sentences.slice(index + 1);
    const success = after.length === 2 ? ON_SUCCESS.exec(after[0]) : null;
    const critical = after.length === 2 ? ON_CRITICAL.exec(after[1]) : null;
    if (!success || !critical || narration.some(sentence => RULE_WORDS.test(sentence))) return null;
    // "in addition to immobilizing it" names the success row's condition.
    const name = CONDITION_NAME.exec(unmask(success[2]))?.[1]?.toLowerCase();
    if (!name || !name.endsWith("ed") || critical[2].toLowerCase() !== name.replace(/ed$/, "ing")) return null;
    const table = [["Critical Success", `The ${success[1]}, and is ${critical[1]}.`], ["Success", `The ${success[1]}.`],
        ["Failure", "The target is unaffected."], ["Critical Failure", "The target is unaffected."]]
        .map(([heading, body]) => `<p><strong>${heading}</strong> ${unmask(body)}</p>`).join("");
    return {
        html: `<p>${narration.map(unmask).join(" ")} The target must attempt a Strike.</p>${table}${rest.join("")}`,
        narration: narration.map(unmask),
        defense: { kind: "save", statistic: "strike", basic: false },
        strike: { reach: null, weapon: null, sourceText: unmask(sentences[index]), result: true },
        reminders: [],
        constraints: { sourceText: "the target of your Strike", supportsActorTargets: true, complete: true, predicates: [] },
        riderText: after.map(unmask).join(" "),
        conditionChoice: unmask(critical[1])
    };
}

/**
 * A Strike whose result decides the rider: the card's check is the caster's own PF2e Strike ("strike"), read from
 * PF2e's attack message; a hit or critical hit applies the rider (its damage isn't the Strike's, so it isn't doubled).
 */
function strikeResult(adapted, sentences, during, unmask, rest) {
    const before = sentences.slice(0, during);
    const reminders = [];
    for (const sentence of before) {
        if (MOVEMENT.some(pattern => pattern.test(sentence))) reminders.push({ kind: "strike-prelude", text: sentence });
        else if (RULE_WORDS.test(sentence)) return null; // anything else before the Strike is narration only
    }
    const after = sentences.slice(during + 1);
    const rider = after.length === 1 ? ON_HIT.exec(after[0]) : null;
    const components = adapted.damageComponents ?? [];
    if (!rider || components.length !== 1 || components[0].category
        || String(components[0].formula).replace(/\s+/g, "") !== rider[2] || String(components[0].type).toLowerCase() !== rider[3]) return null;
    if (adapted.defense?.kind !== "none" || adapted.targeting?.area) return null;
    const push = rider[4] ? { kind: "push", distance: Number(rider[4]), upTo: false, optional: false, direction: rider[5] === "away from you" ? "away" : "any" } : null;
    const hit = "The target takes full damage.";
    const table = [["Critical Success", hit], ["Success", hit], ["Failure", "The target is unaffected."], ["Critical Failure", "The target is unaffected."]]
        .map(([heading, body]) => `<p><strong>${heading}</strong> ${body}</p>`).join("");
    const predicates = rider[1] ? [{ kind: "gm-confirmed", question: "Did the caster's Strike hit this creature and deal damage? The rider follows only a Strike that hits and deals damage.", sourceText: after[0] }] : [];
    return {
        html: `<p>The target must attempt a Strike.</p>${table}${rest.join("")}`,
        narration: [],
        defense: { kind: "save", statistic: "strike", basic: false },
        strike: { reach: null, weapon: null, sourceText: unmask(sentences[during]), result: true },
        reminders,
        ...(push ? { forcedMovement: { criticalSuccess: push, success: push } } : {}),
        constraints: { sourceText: "the target of your Strike", supportsActorTargets: true, complete: true, predicates },
        riderText: unmask(after[0])
    };
}
