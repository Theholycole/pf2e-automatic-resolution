// A reaction's blast around the creature that triggered it, with persistent damage on a failure (Glimpse the Netherworld, PF2e 8.6):
//   "Trigger A living enemy you can see within 60 feet is reduced to 0 Hit Points." / "As a creature slips into that final darkness, …" / "Each creature in a
//   @Template[type:emanation|distance:10] from the triggering enemy takes 4d8 cold damage with a basic Reflex save." / "On a failure, a creature also takes
//   @Damage[(@item.level - 3)d6[persistent,cold]|options:area-damage] damage (double on a critical failure)." with "Heightened (+1) Increase the cold damage
//   by 1d8 and the persistent cold damage by 1d6" (PF2e's text has "4d8 cold] damage").
// Rewritten to the ordinary basic save of the creatures in the area; the failure adds the persistent damage, doubled on a critical failure; the trigger and
// where the area goes are the caster's reminders (the template placed on the triggering creature).
import { htmlToPlainText } from "./description-parser.js";

const TRIGGER = /^<p>\s*<strong>\s*Trigger\s*<\/strong>\s*([^<]+?)\s*<\/p>\s*<hr\s*\/?>\s*/i;
const BLAST = /^Each creature in a @Template\[type:(emanation|burst)\|distance:(\d+)\] from the triggering (enemy|creature|ally) takes (\d+d\d+) ([a-z]+)\]? damage with a basic (Fortitude|Reflex|Will) save\.$/;
const PERSISTENT = /^On a failure, a creature also takes @Damage\[(\(@item\.(?:level|rank) - \d+\)d\d+)\[persistent,([a-z]+)\](?:\|options:area-damage)?\] damage \(double on a critical failure\)\.$/;
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \(\+1\)\s*<\/strong>\s*Increase the ([a-z]+) damage by (\d+d\d+) and the persistent ([a-z]+) damage by 1d(\d+)\.?\s*<\/p>$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|save|bonus|penalty|condition|immune|must|each|area)\b/i;

/** {html, persistent, reminders, sentences} or null. */
export function extractTriggeredBlast(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const trigger = TRIGGER.exec(html);
    if (!trigger) return null;
    const [body, heightened = "", ...rest] = html.slice(trigger[0].length).split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => BLAST.test(sentence));
    if (at < 0 || sentences.length !== at + 2 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const blast = BLAST.exec(sentences[at]), persistent = PERSISTENT.exec(sentences[at + 1]);
    if (!blast || !persistent || persistent[2] !== blast[5]) return null;
    const area = adapted.targeting?.area;
    if (area?.type !== blast[1] || Number(area.value) !== Number(blast[2]) || String(components[0].formula).replace(/\s+/g, "") !== blast[4] || String(components[0].type).toLowerCase() !== blast[5]
        || blast[6].toLowerCase() !== adapted.defense.statistic) return null;
    // The heightening: the item's own interval of the stated dice, the persistent dice in its formula's rank (1 die each rank).
    const step = heightened ? HEIGHTENED.exec(heightened) : null;
    if (heightened && (!step || step[1] !== blast[5] || step[3] !== blast[5] || !persistent[1].endsWith(`d${step[4]}`) || adapted.heightening?.type !== "interval"
        || Number(adapted.heightening.interval) !== 1 || String(adapted.heightening.damage?.[components[0].id] ?? "").replace(/\s+/g, "") !== step[2])) return null;
    const statistic = blast[6];
    return {
        html: `<p>Each creature in the area takes ${blast[4]} ${blast[5]} damage with a basic ${statistic} save.</p>${step ? `<hr /><p><strong>Heightened (+1)</strong> The damage increases by ${step[2]}.</p>` : ""}`,
        persistent: { failure: `${persistent[1]}[persistent,${persistent[2]}]`, criticalFailure: `(2*(${persistent[1]}))[persistent,${persistent[2]}]`, sourceText: sentences[at + 1] },
        reminders: [{ kind: "triggered-blast", text: `A reaction — trigger: ${trigger[1].replace(/\.$/, "")}. Place the ${blast[2]}-foot ${blast[1]} on the triggering ${blast[3]}.`,
            sourceText: `Trigger ${trigger[1]} ${sentences[at]}` }],
        sentences: [`Trigger ${trigger[1]}`, ...sentences]
    };
}
