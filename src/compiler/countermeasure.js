// A reaction undermining a spell being cast (Arcane Countermeasure): "Trigger A creature within range that you can see Casts a Spell." / "… You reduce the spell's
// rank by 1, and targets of the spell gain a +2 status bonus to any saving throws, skill checks, AC, or DC against it." / "You can't reduce the spell's rank below
// its minimum. For example, … Targets still gain all the other benefits, even if you don't reduce the spell's rank." — PF2e's Effect on the spell's targets (its
// bonus proved; its rules keyed to an "against the countered spell" option, on by default, as the text limits it to that spell; the DCs added); the rank reduction
// the GM's (the spell's card corrects its rank), its minimum a note.
import { htmlToPlainText } from "./description-parser.js";

const LINK = /^@UUID\[Compendium\.pf2e\.spell-effects\.Item\.([^\]]+)\]\{(Spell Effect: [^}]+)\}$/;
const RULES = {
    trigger: /^Trigger A creature within range that you can see Casts a Spell\.$/,
    core: /^You reduce the spell's rank by (\d), and targets of the spell gain a \+(\d) (status|circumstance) bonus to any saving throws, skill checks, AC, or DC against it\.$/,
    minimum: /^You can't reduce the spell's rank below its minimum\.$/,
    example: /^For example, .+ would become \d+(?:st|nd|rd|th)-rank\.$/,
    still: /^Targets still gain all the other benefits, even if you don't reduce the spell's rank\.$/
};

/** {countermeasure, claimed} or null; the catalog proves PF2e's Effect. */
export function compileCountermeasure(adapted, catalog) {
    if (String(adapted.activation?.time ?? "").trim() !== "reaction" || !/^the spell cast by the triggering creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const link = paragraphs.map(paragraph => LINK.exec(paragraph)).find(Boolean);
    if (!link) return null;
    const sentences = paragraphs.filter(paragraph => !LINK.test(paragraph)).flatMap(paragraph => htmlToPlainText(paragraph).replace(/\s+/g, " ").trim()
        .replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").split(/(?<=[.!?])\s+(?=[A-Z])/)).filter(Boolean);
    const claimed = {};
    for (const [index, sentence] of sentences.entries()) {
        const key = Object.keys(RULES).find(name => !claimed[name] && RULES[name].test(sentence));
        if (key) { claimed[key] = RULES[key].exec(sentence); continue; }
        if (index === 1 && !/\d|@|\b(?:damage|save|bonus|penalty)\b/.test(sentence)) continue;
        return null;
    }
    if (Object.keys(claimed).length !== Object.keys(RULES).length) return null;
    const entries = catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {});
    const effect = entries.find(entry => entry?.name === link[2]);
    const rules = effect?.mechanics?.rules ?? [];
    const bonus = rules.findIndex(rule => rule.key === "FlatModifier");
    if (!effect?.id || rules.length !== 1 || bonus !== 0 || rules[0].type !== claimed.core[3] || Number(rules[0].value) !== Number(claimed.core[2])
        || JSON.stringify([...[rules[0].selector].flat()].sort()) !== '["ac","saving-throw","skill-check"]') return null;
    const option = "countered-spell";
    return { countermeasure: { effect: { uuid: `Compendium.pf2e.spell-effects.Item.${effect.id}`, name: effect.name }, reduce: Number(claimed.core[1]),
            ruleOverrides: [{ index: bonus, key: "FlatModifier", patch: { selector: ["ac", "saving-throw", "skill-check", "saving-throw-dc"], predicate: [option] } }],
            ruleAdditions: [{ key: "RollOption", domain: "all", option, toggleable: true, value: true, label: "Against the countered spell" }],
            notes: [`Reduce the countered spell's rank by ${claimed.core[1]} (not below its minimum rank; the spell's card corrects its rank). Its targets keep the bonus either way.`] },
        claimed: [...sentences, link[0]] };
}
