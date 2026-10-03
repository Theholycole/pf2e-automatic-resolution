// A ward planted by a Strike (Warding Aggression): "… Make a melee Strike with a weapon or unarmed attack against a foe. In addition to the normal effects of the
// Strike, it has the effects below. Warding aggression ends if the foe you attacked dies or at the end of any turn in which you didn't hit that foe with a
// melee Strike." with rows "+3 … for 1 round and a +2 … for the remaining duration." / "+2" / "+1" / "no additional effect" and PF2e's Effect (a TokenMark, the
// degree as a ChoiceSet, +1 upgraded to +2 on a success, the critical success's +3 for 1 round granted): the caster's Strike from the card; its result picks
// PF2e's Effect's degree, marking the struck foe; Ongoing ends it at the end of a caster turn without a melee hit on that foe, or when the foe dies.
import { htmlToPlainText } from "./description-parser.js";

const STRIKE = /^Make a melee Strike with a weapon or unarmed attack against a foe\.$/;
const ALSO = /^In addition to the normal effects of the Strike, it has the effects below\.$/;
const ENDS = /^[A-Z][a-z ]+ ends if the foe you attacked dies or at the end of any turn in which you didn't hit that foe with a melee Strike\.$/;
const ROWS = {
    criticalSuccess: /^You gain a \+(\d) status bonus to AC against the foe for 1 round and a \+(\d) status bonus to AC against the foe for the remaining duration\.$/,
    success: /^You gain a \+(\d) status bonus to AC against the foe\.$/,
    failure: /^You gain a \+(\d) status bonus to AC against the foe\.$/,
    criticalFailure: /^You gain no additional effect\.$/
};
const LINK = /@UUID\[Compendium\.pf2e\.spell-effects\.Item\.([^\]]+)\]\{([^}]+)\}/;

/** {strikeWard, claimed} or null; the catalog proves PF2e's Effect. */
export function compileStrikeWard(adapted, catalog) {
    if (adapted.defense?.kind === "save" || adapted.targeting?.target || !/^up to (\d+) minutes?$/.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = sentences.findIndex(sentence => STRIKE.test(sentence));
    if (at < 0 || sentences.length !== at + 3 || !ALSO.test(sentences[at + 1]) || !ENDS.test(sentences[at + 2]) || sentences.slice(0, at).some(sentence => /\d|@|\b(?:damage|save|penalty)\b/i.test(sentence))) return null;
    const paragraphs = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].trim());
    const row = heading => htmlToPlainText(paragraphs.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const link = LINK.exec(paragraphs.at(-1) ?? "");
    const cs = ROWS.criticalSuccess.exec(row("Critical Success")), s = ROWS.success.exec(row("Success")), f = ROWS.failure.exec(row("Failure"));
    if (paragraphs.length !== 5 || !link || !cs || !s || !f || !ROWS.criticalFailure.test(row("Critical Failure")) || cs[2] !== s[1]) return null;
    const entries = catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {});
    const effect = entries.find(entry => entry?.name === link[2] || entry?.id === link[1]);
    const rules = effect?.mechanics?.rules ?? [];
    const mark = rules.find(rule => rule.key === "TokenMark"), choice = rules.find(rule => rule.key === "ChoiceSet");
    const base = rules.find(rule => rule.key === "FlatModifier"), upgrade = rules.find(rule => rule.key === "AdjustModifier"), grant = rules.find(rule => rule.key === "GrantItem");
    const granted = grant ? entries.find(entry => grant.uuid?.endsWith(`.${entry?.id}`)) : null;
    const grantedRule = granted?.mechanics?.rules?.[0];
    if (!mark || !choice || !base || !upgrade || !grant || rules.length !== 5 || base.selector !== "ac" || Number(base.value) !== Number(f[1]) || base.type !== "status"
        || !(base.predicate ?? []).includes(`origin:mark:${mark.slug}`) || upgrade.mode !== "upgrade" || Number(upgrade.value) !== Number(s[1]) || upgrade.slug !== base.slug
        || JSON.stringify(choice.choices.map(entry => entry.value)) !== '["critical-success","success","failure"]'
        || !granted || granted.mechanics.rules.length !== 1 || grantedRule.key !== "FlatModifier" || Number(grantedRule.value) !== Number(cs[1]) || granted.mechanics.duration?.value !== 1 || granted.mechanics.duration?.unit !== "rounds") return null;
    return {
        strikeWard: { effect: { uuid: `Compendium.pf2e.spell-effects.Item.${effect.id}`, label: effect.name }, choiceIndex: rules.indexOf(choice), markSlug: mark.slug,
            degrees: { criticalSuccess: "critical-success", success: "success", failure: "failure", criticalFailure: null } },
        claimed: [...sentences, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(row)]
    };
}
