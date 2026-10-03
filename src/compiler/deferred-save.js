// A save the target attempts only when it does what the spell invites (Albatross Curse; user decision 2026-10-01: what the module can't detect
// is a GM control):
//   "You and allies within 30 feet of the target gain a +1 circumstance bonus to attacks against the target." (PF2e's Effect) / "The target
//   creature can spend an action to Strike the albatross, which automatically succeeds and kills it." / "The target must then attempt a Will save
//   against your spell DC." / Success "… The target is Stupefied 1 for 1 round." / Failure "… for 1 minute, … the target must roll twice and
//   take the worse result on their next Will save, after which the albatross disappears." (PF2e's Failure Effect) / Critical Failure "As
//   failure, but the duration is 1 hour." (PF2e's Critical Failure Effect)
// Casting puts PF2e's Effect on the target. The GM's control rolls the target's save when it kills the albatross: the success's condition, or
// the row's PF2e Effect (roll twice on the next Will save, removed after that roll — PF2e's Effects keep it for every save: the text wins).
import { htmlToPlainText } from "./description-parser.js";

const NARRATION = /^You create a spectral ([a-z]+), a guiding bird for sailors, to hover around the target\.$/;
const BONUS = /^You and allies within (\d+) feet of the target gain a \+(\d) circumstance bonus to attacks against the target\.$/;
const TRIGGER = /^The target creature can spend an action to Strike the ([a-z]+), which automatically succeeds and kills it\.$/;
const SAVE = /^The target must then attempt an? (Fortitude|Reflex|Will) save against your spell DC\.$/;
const SUCCESS = /^The guilt of slaughtering a bird of good fortune weighs on the target's mind\. The target is @UUID\[Compendium\.pf2e\.conditionitems\.Item\.([A-Za-z0-9]+)\]\{([A-Za-z]+) (\d)\} for 1 round\.$/;
const FAILURE = /^The [a-z]+ hangs around a cord from the target's neck \(or closest equivalent\) for (\d+) minutes?, cursing them for their transgression\. During this time, the target must roll twice and take the worse result on their next (Will|Fortitude|Reflex) save, after which the [a-z]+ disappears\.$/;
const CRITICAL = /^As failure, but the duration is (\d+) hours?\.$/;

const plain = text => htmlToPlainText(String(text ?? "")).replace(/\s+/g, " ").trim();

/** Returns {deferredSave, claimed} or null. */
export function compileDeferredSave(adapted, nativeSpellEffects, catalog = null) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || !/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [preamble, table, ...rest] = html.split(/<hr\s*\/?>/i);
    if (!table || rest.length) return null;
    const link = /@UUID\[Compendium\.pf2e\.spell-effects\.Item\.([^\]]+)\]\{[^}]+\}/g;
    const rowOf = heading => new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>`).exec(table)?.[1] ?? "";
    const rows = Object.fromEntries(["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => [heading, rowOf(heading)]));
    const effectsIn = text => [...String(text).matchAll(link)].map(match => match[1]);
    const preambleEffects = effectsIn(preamble), failureEffects = effectsIn(rows.Failure + table.split(/<strong>\s*Critical Failure/)[0].split(/<strong>\s*Failure\s*<\/strong>/)[1]), criticalEffects = effectsIn(table.split(/<strong>\s*Critical Failure\s*<\/strong>/)[1] ?? "");
    const sentences = plain(preamble.replace(link, "")).split(/(?<=[.!?])\s+(?=[A-Z])/);
    if (sentences.length !== 4 || !NARRATION.test(sentences[0]) || !BONUS.test(sentences[1]) || !TRIGGER.test(sentences[2]) || !SAVE.test(sentences[3])) return null;
    if (SAVE.exec(sentences[3])[1].toLowerCase() !== adapted.defense.statistic) return null;
    const success = SUCCESS.exec(plain(rows.Success)), failure = FAILURE.exec(plain(rows.Failure.replace(link, ""))), critical = CRITICAL.exec(plain(rows["Critical Failure"].replace(link, "")));
    if (plain(rows["Critical Success"]) !== "The target is unaffected." || !success || !failure || !critical) return null;
    // PF2e's three Effects: the bonus (an ephemeral modifier for attackers), and each row's roll twice on that save.
    const linked = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? []), ...Object.values(nativeSpellEffects?.outcomes ?? {}).flat()];
    const byName = name => linked.find(effect => effect.reference === name || effect.label === name || effect.uuid?.endsWith(`.${name}`));
    const initial = byName(preambleEffects[0]), failed = byName(failureEffects[0]), critted = byName(criticalEffects[0]);
    if (preambleEffects.length !== 1 || !initial || !failed || !critted) return null;
    const rules = effect => effect.document?.mechanics?.rules ?? [];
    const duration = effect => effect.document?.mechanics?.duration ?? {};
    const ephemeral = rules(initial);
    if (ephemeral.length !== 1 || ephemeral[0].key !== "EphemeralEffect" || ephemeral[0].affects !== "origin" || JSON.stringify(ephemeral[0].selectors) !== '["strike-attack-roll"]') return null;
    // The attackers' Effect it hands out: the stated bonus within the stated distance.
    const id = /^Compendium\.pf2e\.spell-effects\.Item\.([A-Za-z0-9]+)$/.exec(ephemeral[0].uuid ?? "")?.[1];
    const entries = catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {});
    const bonusRules = entries.find(entry => entry?.id === id)?.mechanics?.rules ?? [];
    const [, feet, amount] = BONUS.exec(sentences[1]);
    if (bonusRules.length !== 1 || bonusRules[0].key !== "FlatModifier" || bonusRules[0].type !== "circumstance" || Number(bonusRules[0].value) !== Number(amount)
        || bonusRules[0].selector !== "attack-roll" || !JSON.stringify(bonusRules[0].predicate ?? []).includes(`{"lte":["target:distance",${feet}]}`)) return null;
    const twice = (effect, value, unit) => { const [rule] = rules(effect); return rules(effect).length === 1 && rule.key === "RollTwice" && rule.keep === "lower" && rule.selector === failure[2].toLowerCase()
        && duration(effect).value === value && duration(effect).unit === unit; };
    if (!twice(failed, Number(failure[1]), "minutes") || !twice(critted, Number(critical[1]), "hours")) return null;
    const effect = entry => ({ uuid: entry.uuid, label: entry.label ?? entry.reference });
    return {
        deferredSave: { statistic: adapted.defense.statistic, trigger: TRIGGER.exec(sentences[2])[1], initial: effect(initial),
            rows: { success: { condition: { slug: success[2].toLowerCase(), name: success[2], value: Number(success[3]), uuid: `Compendium.pf2e.conditionitems.Item.${success[1]}`, rounds: 1 } },
                failure: { effect: effect(failed) }, criticalFailure: { effect: effect(critted) } },
            // (PF2e's row Effects roll twice on every save of the kind; the text: the next one only.)
            ruleOverrides: [{ index: 0, key: "RollTwice", patch: { removeAfterRoll: true } }] },
        claimed: [...sentences, plain(rows.Success), plain(rows.Failure), plain(rows["Critical Failure"])]
    };
}
