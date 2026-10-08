// Shrouds that hide their wearers in the dark and pry at those who strike them (Mirecloak): "… granting a +1 status bonus to AC and a +2 status bonus to Stealth
// checks, both only while the target is in dim light or darkness." / "If a creature deals damage in melee to or touches a cloaked creature, the cloak wraps around the
// attacker, … The attacker takes 2d8 mental damage and must attempt a Will save." / "Afterward, the spell ends for the cloaked creature, and the attacker is
// temporarily immune to mirecloak for 24 hours." with the results (Success half damage; Failure full damage and {Sickened 1}, and the cloaked creature gleans a piece
// of information …; Critical Failure as failure, double damage and {Sickened 2}) — PF2e's Effect on each target (its bonuses proved; its dim-light toggle's option
// name corrected to the one its rules check); the card's control for a creature that damaged a wearer in melee or touched it: its save card (the item's damage, the
// stated rows; then immune for the stated time), and the wearer's Effect ends; the information the GM's.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_UUID_START as C, LABELS, SPELL_EFFECT_LINK as LINK } from "./text-patterns.js";

const RULES = {
    bonus: /^The shroud settles about each target's shoulders, granting a \+(\d) status bonus to AC and a \+(\d) status bonus to Stealth checks, both only while the target is in dim light or darkness\.$/,
    trigger: /^If a creature deals damage in melee to or touches a cloaked creature, the cloak wraps around the attacker, temporarily connecting the psyches of the cloaked creature and the attacker and violently prying a random piece of interesting information from the attacker's mind\.$/,
    save: /^The attacker takes (\d+)d(\d+) ([a-z]+) damage and must attempt a (Will|Fortitude|Reflex) save\.$/,
    end: /^Afterward, the spell ends for the cloaked creature, and the attacker is temporarily immune to [a-z ]+ for (\d+) hours\.$/
};
const ROWS = {
    criticalSuccess: /^The attacker is unaffected\.$/,
    success: /^The attacker takes half damage\.$/,
    failure: new RegExp(String.raw`^The attacker takes full damage and is ${C}Sickened (\d)\}\. In addition, the cloaked creature gleans a piece of information from the attacker's mind\. The details and extent of this information are at the GM's discretion\.$`),
    criticalFailure: new RegExp(String.raw`^As failure, but the attacker takes double damage and is ${C}Sickened (\d)\}\.$`)
};

/** {mireCloak, claimed} or null; the catalog proves PF2e's Effect. */
export function compileMireCloak(adapted, catalog) {
    const most = /^up to (\d+) creatures$/i.exec(String(adapted.targeting?.target ?? "").trim());
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || !most) return null;
    const minutes = /^(?:up to )?(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, results = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!minutes || rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const sentences = paragraphs.flatMap(paragraph => htmlToPlainText(paragraph).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/)).filter(Boolean);
    const claimed = {};
    for (const [index, sentence] of sentences.entries()) {
        const key = Object.keys(RULES).find(name => !claimed[name] && RULES[name].test(sentence));
        if (key) { claimed[key] = RULES[key].exec(sentence); continue; }
        if (index === 0 && !/\d|@|\b(?:damage|save|bonus|penalty)\b/.test(sentence)) continue;
        return null;
    }
    const rowParagraphs = [...results.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const link = rowParagraphs.map(paragraph => LINK.exec(paragraph)).find(Boolean);
    const rows = {};
    for (const paragraph of rowParagraphs.filter(paragraph => !LINK.test(paragraph))) {
        const row = /^<strong>(Critical Success|Success|Failure|Critical Failure)<\/strong>\s*([\s\S]*)$/.exec(paragraph);
        const key = row ? LABELS[row[1]] : null;
        if (!key || rows[key] || !ROWS[key].test(row[2].trim())) return null;
        rows[key] = ROWS[key].exec(row[2].trim());
    }
    if (Object.keys(claimed).length !== Object.keys(RULES).length || Object.keys(rows).length !== 4 || !link) return null;
    const [entry, ...others] = adapted.damageComponents ?? [];
    const save = claimed.save;
    if (others.length || String(entry?.formula ?? "").replace(/\s+/g, "") !== `${save[1]}d${save[2]}` || entry.type !== save[3] || save[4].toLowerCase() !== adapted.defense.statistic) return null;
    const entries = catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {});
    const effect = entries.find(item => item?.name === link[2]);
    const rules = effect?.mechanics?.rules ?? [];
    const toggle = rules.findIndex(rule => rule.key === "RollOption" && rule.toggleable);
    const ac = rules.find(rule => rule.key === "FlatModifier" && rule.selector === "ac"), stealth = rules.find(rule => rule.key === "FlatModifier" && rule.selector === "stealth");
    const checked = JSON.stringify(ac?.predicate ?? []).match(/"(mire[a-z]*-darkness)"/)?.[1];
    if (!effect?.id || toggle < 0 || ac?.type !== "status" || Number(ac.value) !== Number(claimed.bonus[1]) || stealth?.type !== "status" || Number(stealth.value) !== Number(claimed.bonus[2]) || !checked) return null;
    return { mireCloak: { seconds: Number(minutes[1]) * 60, maxTargets: Number(most[1]), effect: { uuid: `Compendium.pf2e.spell-effects.Item.${effect.id}`, name: effect.name },
            ruleOverrides: rules[toggle].option === checked ? [] : [{ index: toggle, key: "RollOption", patch: { option: checked } }],
            immunityHours: Number(claimed.end[1]), statistic: adapted.defense.statistic,
            rows: { failure: { uuid: rows.failure[1], value: Number(rows.failure[2]) }, criticalFailure: { uuid: rows.criticalFailure[1], value: Number(rows.criticalFailure[2]) } },
            immuneText: claimed.end[0], notes: ["On a failure or critical failure, the cloaked creature gleans a piece of information from the attacker's mind (the GM's discretion)."] },
        claimed: [...sentences, ...rowParagraphs.map(paragraph => htmlToPlainText(paragraph).replace(/\s+/g, " ").trim())] };
}
