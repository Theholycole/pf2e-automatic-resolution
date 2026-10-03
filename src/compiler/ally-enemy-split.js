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
