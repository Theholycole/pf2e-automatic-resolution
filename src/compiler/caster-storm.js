// A storm around the caster that hurts everyone when cast and shelters the caster after (Poltergeist's Fury): "Your fury spills over in a telekinetic storm of terrifying
// proportions. Any loose, unattended objects of 1 Bulk or less within range are picked up and begin to orbit you at breathtaking speeds. All creatures in the area take
// 6d4 piercing damage with a basic Reflex save. Each time you Sustain the spell, you can increase the radius of the storm by 10 feet, to a maximum of 100 feet. The storm
// moves with you and provides you with lesser cover, though you can't use this cover to hide or sneak. Allies within the storm who roll a success on their Reflex save
// against your poltergeist's fury get a critical success instead, as you attempt to avoid hitting them." — the basic save on the creatures in the emanation (the GM
// targets them), an ally's success a critical success; the caster's Effect for the spell's time: lesser cover (+1 circumstance AC); its growth a note.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_COVER as RULE_WORDS } from "./text-patterns.js";

const OBJECTS = /^Any loose, unattended objects of \d+ Bulk or less within range are picked up and begin to orbit you at [a-z ]+\.$/;
const DEALS = /^All creatures in the area take (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\.$/;
const GROWS = /^Each time you Sustain the spell, you can increase the radius of the storm by (\d+) feet, to a maximum of (\d+) feet\.$/;
const COVER = /^The storm moves with you and provides you with lesser cover, though you can't use this cover to hide or sneak\.$/;
const ALLIES = /^Allies within the storm who roll a success on their (Fortitude|Reflex|Will) save against your [a-z' ]+ get a critical success instead, as you attempt to avoid hitting them\.$/;

/** {html, degreeAdjustment, casterStorm, reminders, sentences} or null. */
export function rewriteCasterStorm(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area?.type !== "emanation" || adapted.lifecycle?.sustained !== true) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const deals = DEALS.exec(sentences[2] ?? ""), grows = GROWS.exec(sentences[3] ?? ""), allies = ALLIES.exec(sentences[5] ?? "");
    if (!minutes || sentences.length !== 6 || RULE_WORDS.test(sentences[0]) || !OBJECTS.test(sentences[1]) || !deals || !grows || !COVER.test(sentences[4]) || !allies
        || deals[3].toLowerCase() !== adapted.defense.statistic || allies[1].toLowerCase() !== adapted.defense.statistic) return null;
    return {
        html: `<p>${sentences[2]}</p>${rest.length ? `<hr />${rest.join("<hr />")}` : ""}`,
        degreeAdjustment: { predicate: { kind: "ally-of-caster" }, map: { criticalSuccess: "criticalSuccess", success: "criticalSuccess", failure: "failure", criticalFailure: "criticalFailure" }, sourceText: sentences[5] },
        casterStorm: { name: "the storm (lesser cover)", seconds: Number(minutes[1]) * 60, sustained: true, rules: [{ key: "FlatModifier", selector: "ac", type: "circumstance", value: 1, label: "Lesser cover (the storm)" }],
            text: `${sentences[4]} (Lesser cover: +1 circumstance bonus to AC.)` },
        reminders: [{ kind: "spell-note", text: `${sentences[1]} ${sentences[3]} (The storm's damage is only when cast; its growth widens the cover.)`, sourceText: sentences[3] }],
        sentences
    };
}
