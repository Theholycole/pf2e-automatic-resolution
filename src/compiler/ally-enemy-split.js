// An area that heals allies and harms enemies, with separate rolls:
//   "You restore @Damage[(@item.level)d4[healing]] HP to all allies in the area, and those allies gain a +1 status bonus
//    to Fortitude saves for 1 minute. Enemies in the area take 1d4 fire damage with a basic Reflex save."
// Allies take no save: they're healed by the inline formula (rolled once for the cast) and get the linked Effect, whose
// only rule must be the stated bonus for the stated time. Enemies save against the item's damage as a basic save.
import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";

const HEAL = /^You restore @Damage\[(\([^()\[\]]*\)d\d+|\d+d\d+)\[healing\]\] HP to all allies in the area, and those allies gain a \+(\d) (status|circumstance) bonus to (Fortitude|Reflex|Will) saves for (1 round|1 minute|\d+ minutes)\.$/;
const HARM = /^Enemies in the area take (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\.$/;
const LINK = /^@UUID\[[^\]]+\]\{[^}]+\}$/;
const RULE_WORDS = /\d|@|\[\[|\b(?:damage|save|bonus|penalty|condition|allies|enemies|creature|target|HP|Hit Points|immune)\b/i;

/** The Effect's only rule is the stated save bonus, and it lasts the stated time. */
export function proveAllyEffect(mechanics, { value, type, statistic, duration }) {
    const rules = mechanics?.rules ?? [];
    if (rules.length !== 1) return false;
    const [rule] = rules;
    const selector = Array.isArray(rule.selector) && rule.selector.length === 1 ? rule.selector[0] : rule.selector;
    if (rule.key !== "FlatModifier" || selector !== statistic || rule.type !== type || rule.value !== value || rule.predicate != null) return false;
    const stated = /^(\d+) (round|minute)s?$/.exec(duration);
    const own = mechanics.duration ?? {};
    return !!stated && own.value === Number(stated[1]) && own.unit === `${stated[2]}s` && own.sustained === false;
}

export function compileAllyEnemySplit(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "save" || !adapted.defense.basic || !adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category || components[0].kinds?.join() !== "damage") return null;
    const linked = [...(nativeSpellEffects.unscoped ?? []), ...(nativeSpellEffects.onUse ?? [])];
    if (linked.length !== 1 || linked[0].resolutionStatus !== "resolved" || linked[0].document?.type !== "effect") return null;
    const text = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML)).replace(/\s+/g, " ").trim();
    const sentences = text.split(/(?<=[.!?}])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
    let heal = null, harm = null, link = null, narrated = 0;
    for (const sentence of sentences) {
        const healed = !heal ? HEAL.exec(sentence) : null;
        if (healed) {
            // The formula reads only the cast rank.
            if ([...healed[1].matchAll(/@([a-z.]+)/gi)].some(match => !["item.level", "item.rank"].includes(match[1]))) return null;
            heal = { formula: `${healed[1]}[healing]`, bonus: { value: Number(healed[2]), type: healed[3], statistic: healed[4].toLowerCase(), duration: healed[5] }, sourceText: sentence };
            continue;
        }
        const harmed = !harm ? HARM.exec(sentence) : null;
        if (harmed) {
            if (harmed[1] !== String(components[0].formula).replace(/\s+/g, "") || harmed[2] !== String(components[0].type).toLowerCase()
                || harmed[3].toLowerCase() !== adapted.defense.statistic) return null;
            harm = sentence; continue;
        }
        if (LINK.test(sentence) && !link) { link = sentence; continue; }
        if (!heal && !harm && narrated < 2 && !RULE_WORDS.test(sentence)) { narrated++; continue; }
        return null;
    }
    if (!heal || !harm || !link) return null;
    const [entry] = linked;
    if (!proveAllyEffect(entry.document.mechanics, heal.bonus)) return null;
    const { triggerAnalysis, ...rest } = entry;
    return {
        allySplit: { healing: { formula: heal.formula }, bonus: heal.bonus,
            effect: { ...rest, scope: "ally", recipient: { actor: "target", evidence: "ally-enemy-split" }, applicationRequiresConfirmation: true } },
        sentences: [heal.sourceText, harm, link]
    };
}

// Enemies saving and allies given temporary Hit Points, with the GM's penalty for some foes (Roar of Freedom, PF2e 8.6):
//   "Enemies within the emanation take 12d8 sonic damage and must attempt a Will save; particularly tyrannical creatures, like a despot or a devil, take a –2
//   circumstance penalty to their saves." / "The GM determines which creatures take this penalty." / "Allied creatures within the emanation gain 15 temporary Hit
//   Points that last for 1 minute." with the table, "Heightened (+1) The damage increases by 1d8, and the temporary Hit Points increase by 5." and PF2e's Effect
//   (TempHP by rank).
// The enemies' save is the table's; each one's penalty is the GM's answer on the card; allies get PF2e's Effect (its temporary Hit Points) and no save.
const ENEMIES = /^Enemies within the emanation take (\d+d\d+) ([a-z]+) damage and must attempt an? (Fortitude|Reflex|Will) save; (particularly [a-z]+ creatures(?:, like [a-z ,]+?)?), take a [–−-](\d) (circumstance|status) penalty to their saves\.$/;
const GM_PICKS = /^The GM determines which creatures take this penalty\.$/;
const ALLIES = /^Allied creatures within the emanation gain (\d+) temporary Hit Points that last for (\d+) (round|minute)s?\.$/;
const TEMP_STEP = /^<p>\s*<strong>\s*Heightened \(\+1\)\s*<\/strong>\s*The damage increases by (\d+d\d+), and the temporary Hit Points increase by (\d+)\.\s*<\/p>$/;

/** The Effect's only rule is TempHP of the stated amount at each rank from the spell's, lasting the stated time. */
export function proveAllyTempHP(mechanics, { base, step, rank, duration }) {
    const rules = mechanics?.rules ?? [];
    if (rules.length !== 1 || rules[0].key !== "TempHP" || rules[0].predicate != null) return false;
    const valueAt = level => { const formula = String(rules[0].value).replace(/@item\.(?:level|rank)/g, String(level));
        if (!/^[\d\s+\-*/(),.max]+$/.test(formula)) return null; try { return Function(`"use strict"; const max = Math.max; return (${formula});`)(); } catch { return null; } };
    if (!Array.from({ length: 11 - rank }, (_, offset) => rank + offset).every(level => valueAt(level) === base + step * (level - rank))) return false;
    const stated = /^(\d+) (round|minute)s?$/.exec(duration);
    const own = mechanics.duration ?? {};
    return !!stated && own.value === Number(stated[1]) && own.unit === `${stated[2]}s` && own.sustained === false;
}

/** {html, allySplit, saveAdjustment, sentences} or null. */
export function compileAllyTempEnemySave(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || adapted.targeting?.area?.type !== "emanation" || String(adapted.targeting?.target ?? "").trim()) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const linked = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    if (linked.length !== 1 || linked[0].resolutionStatus !== "resolved" || linked[0].document?.type !== "effect") return null;
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => ENEMIES.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 3 || !GM_PICKS.test(sentences[at + 1]) || sentences.slice(0, at).some(sentence => RULE_WORDS.test(sentence))) return null;
    const enemies = ENEMIES.exec(sentences[at]), allies = ALLIES.exec(sentences[at + 2]);
    if (!enemies || !allies || enemies[3].toLowerCase() !== adapted.defense.statistic || String(components[0].formula).replace(/\s+/g, "") !== enemies[1]
        || String(components[0].type).toLowerCase() !== enemies[2]) return null;
    // The heightening: the item's damage step, the temporary Hit Points' step; then only PF2e's Effect link.
    const [step, ...links] = [...heightened.matchAll(/<p>[\s\S]*?<\/p>/gi)].map(match => match[0].trim());
    const temp = step ? TEMP_STEP.exec(step) : null;
    if (!temp || links.length !== 1 || !/^<p>\s*@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}\s*<\/p>$/.test(links[0]) || adapted.heightening?.type !== "interval"
        || Number(adapted.heightening.interval) !== 1 || String(adapted.heightening.damage?.[components[0].id] ?? "").replace(/\s+/g, "") !== temp[1]) return null;
    const tempHP = { base: Number(allies[1]), step: Number(temp[2]), rank: Number(adapted.rank), duration: `${allies[2]} ${allies[3]}` };
    const [entry] = linked;
    if (!proveAllyTempHP(entry.document.mechanics, tempHP)) return null;
    const { triggerAnalysis, ...effect } = entry;
    return {
        html: `<p>Each enemy in the area takes ${enemies[1]} ${enemies[2]} damage and must attempt a ${enemies[3]} save.</p><hr />${table}<hr /><p><strong>Heightened (+1)</strong> The damage increases by ${temp[1]}.</p>`,
        allySplit: { healing: null, tempHP, effect: { ...effect, scope: "ally", recipient: { actor: "target", evidence: "ally-enemy-split" }, applicationRequiresConfirmation: true } },
        saveAdjustment: { question: `Is the creature one of the ${enemies[4].replace(/^particularly /, "particularly ")}? If so, it takes a −${enemies[5]} ${enemies[6]} penalty to its save.`, modifierType: enemies[6],
            appliesTo: "save", choices: [{ label: `Yes (−${enemies[5]})`, value: -Number(enemies[5]) }, { label: "No", value: 0 }], sourceText: `${sentences[at]} ${sentences[at + 1]}` },
        sentences: [sentences[at], sentences[at + 1], sentences[at + 2]]
    };
}
