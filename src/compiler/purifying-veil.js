// A veil of holy water around a creature (Purifying Veil): "… The veil surrounds the target. Everything on each side of the veil is @UUID[…]{Concealed} from
// creatures on the opposite side, but the water doesn't impede attacks or movement across the veil. If the target moves through the veil, it takes 4d6 spirit
// damage with a basic Will save. If the target leaves the veil, the spell ends." with "Heightened (+1) The damage increases by 1d6.": an area on the target
// for the minute: it's Concealed, with the note that those outside are concealed to it; the GM's control when it moves through the veil opens its basic Will
// save against PF2e's damage (heightened), and then the spell ends.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES } from "./text-patterns.js";

const SURROUNDS = /^The veil surrounds the target\.$/;
const CONCEAL = /^Everything on each side of the veil is @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Concealed\} from creatures on the opposite side, but the water doesn't impede attacks or movement across the veil\.$/;
const THROUGH = /^If the target moves through the veil, it takes (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\.$/;
const LEAVES = /^If the target leaves the veil, the spell ends\.$/;
const TARGET = /^1 (Large|Medium|Small) or smaller creature$/;

/** {html, lingering, size, sentences} or null. */
export function rewritePurifyingVeil(adapted) {
    const omen = rewriteSuspendedOmen(adapted);
    if (omen) return omen;
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area || adapted.lifecycle?.sustained) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const target = TARGET.exec(String(adapted.targeting?.target ?? "").trim());
    const components = adapted.damageComponents ?? [];
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || !target || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const through = THROUGH.exec(sentences[3] ?? "");
    if (sentences.length !== 5 || NARRATION_RULES.test(sentences[0]) || !SURROUNDS.test(sentences[1]) || !CONCEAL.test(sentences[2]) || !through || !LEAVES.test(sentences[4])) return null;
    const [, formula, type, statistic] = through;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== formula || String(components[0].type).toLowerCase() !== type
        || statistic.toLowerCase() !== adapted.defense.statistic) return null;
    return {
        html: `<p>${sentences[0]} The target takes ${formula} ${type} damage with a basic ${statistic} save.</p>${heightened ? `<hr />${heightened}` : ""}`,
        target: `1 ${target[1]} or smaller creature`,
        size: { Large: "lg", Medium: "med", Small: "sm" }[target[1]],
        lingering: { events: [], initial: false, oncePerRound: false, excludeCaster: false, enemiesOnly: false, area: null, centre: "targets",
            durationSeconds: Number(minutes[1]) * 60, sustained: false, concealment: true,
            gmAction: { actions: ["leave"], label: "moved through the veil (it saves; the spell then ends)", endsSpell: true, sourceText: sentences[3] },
            notes: ["The veil doesn't impede attacks or movement across it."], sourceText: [sentences[2], sentences[3], sentences[4]] },
        sentences: [...sentences, htmlToPlainText(heightened).trim()]
    };
}

// An omen over the target (Suspended Retribution): "… When you Cast this Spell, pick one of the following triggers." with a list ("The target moves more than its
// Speed in a single round." …) / "If the target takes the triggering action, the portent of doom activates—…—and the target takes 70 mental damage with a basic
// Reflex save." / "The target instinctively knows which action will trigger the omen and can ward off the omen by spending a total of 3 actions, which have the
// concentrate trait, … These actions need not be consecutive. After the creature spends the actions, the spell ends." with "Heightened (+1) The damage increases
// by 10.": the omen on the target for the minute; the GM's control when it takes the chosen action opens its basic save against PF2e's damage (heightened), and the
// omen is spent (the spell ends). The trigger list and the warding actions are notes (the GM ends the spell in Ongoing spells once 3 such actions are spent).
const PICK = /^When you Cast this Spell, pick one of the following triggers\.$/;
const ACTIVATES = /^If the target takes the triggering action, the portent of doom activates[—–-][^.]*?[—–-]and the target takes (\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\.$/;
const WARD = /^The target instinctively knows which action will trigger the omen and can ward off the omen by spending a total of (\d+) actions, which have the concentrate trait, to [a-z ,]+\.$/;
const APART = /^These actions need not be consecutive\.$/;
const WARDED = /^After the creature spends the actions, the spell ends\.$/;
function rewriteSuspendedOmen(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area || adapted.lifecycle?.sustained || !/^1 creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const components = adapted.damageComponents ?? [];
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || rest.length) return null;
    const items = [...body.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    const sentences = htmlToPlainText(body.replace(/<ul>[\s\S]*?<\/ul>/, " ")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const pick = sentences.findIndex(sentence => PICK.test(sentence));
    if (pick < 1 || items.length < 2) return null;
    let after = sentences.slice(pick + 1);
    // (PF2e's text repeats the list's last item before the trigger: the list's.)
    if (after[0] === items.at(-1)) after = after.slice(1);
    const activates = ACTIVATES.exec(after[0] ?? ""), ward = WARD.exec(after[1] ?? "");
    if (!activates || !ward || after.length !== 4 || !APART.test(after[2]) || !WARDED.test(after[3])) return null;
    if (sentences.slice(0, pick).some(sentence => /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|can't|must|until)\b/i.test(sentence))) return null;
    const [, amount, type, statistic] = activates;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== amount || String(components[0].type).toLowerCase() !== type
        || statistic.toLowerCase() !== adapted.defense.statistic) return null;
    return {
        html: `<p>The target takes ${amount} ${type} damage with a basic ${statistic} save.</p>${heightened ? `<hr />${heightened}` : ""}`,
        lingering: { events: [], initial: false, oncePerRound: false, excludeCaster: false, enemiesOnly: false, area: null, centre: "targets",
            durationSeconds: Number(minutes[1]) * 60, sustained: false, concealment: false,
            gmAction: { actions: ["trigger"], label: "took the chosen triggering action (it saves; the omen is spent)", endsSpell: true, sourceText: after[0] },
            notes: [`The caster picks the trigger when casting: ${items.join(" / ")}`, `The target knows the trigger, and can ward off the omen by spending a total of ${ward[1]} actions with the concentrate trait (not necessarily consecutive): then end the spell in Ongoing spells.`],
            sourceText: [sentences[pick], ...after] },
        sentences: [...sentences.slice(0, pick + 1), ...items, ...after, htmlToPlainText(heightened).trim()]
    };
}
