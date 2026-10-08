// A spell whose effect is another spell's (the third-party "proxy" spells): the caster picks that spell and the module resolves it at this spell's rank.
// - Coalesce Form (Magic+): "You gain the effects of the spell you chose during your daily preparations for the same duration as the original spell. The spell's effects are
//   heightened to the rank of coalesce form." — the daily pick a polymorph spell (asked), cast at this rank.
// - Untamed Aspect Shift (Magic+): "You can polymorph into any form listed in Pest Shift, which lasts 10 minutes. All other untamed shift shapes last 1 minute. …" / "When you
//   choose to use your own attack modifier while polymorphed instead of the form's default attack modifier, you gain a +2 status bonus to your attack rolls." with "Heightened
//   (2nd) You can transform into shapes listed in Animal Shift.": the listed spell (Animal Shift from 2nd), cast at this rank; the +2 behind a toggle on the caster for the
//   form's time; added shapes from feats the GM's.
// - Witch's Bottle (Witches+): "You Cast a Spell with the hex trait on the triggering target. If the spell you chose required two actions to be cast, you become Slowed 1 until
//   the end of your next turn, or Slowed 2 if the spell you chose required three actions. If the hex spell requires a Sustain …, you must Sustain the Spell as normal …": one
//   of the caster's own hex spells on its target; Slowed by the actions it takes.
// - Fractal Frosting (Oracles+): "You cast Frostbite as part of casting fractal frosting. For the duration of fractal frosting, you can cast frostbite with a range of 60
//   feet, targeting up to three different targets within range. You create difficult terrain in a 5-foot emanation in the area around each of the targets that lasts for
//   1 round." with "Heightened (9th) For the duration, when you cast frostbite, the target takes a –5-foot status penalty to its Speed for 1 round on a failure or a
//   –15-foot status penalty to its Speed on a critical failure.": the named spell at this rank; the caster's Effect for the duration shaping each of its casts (this one
//   too) — the terrain around each target, from 9th the penalty by the target's result (the module's Effect checked against it; the module builds it from the text).
import { htmlToPlainText } from "./description-parser.js";

const COALESCE = /^You assume the form for your daily anatomical configuration\. You gain the effects of the spell you chose during your daily preparations for the same duration as the original spell\. The spell['’]s effects are heightened to the rank of coalesce form\.$/;
const UNTAMED = /^You reach within for a different part of yourself, and you set it free, transforming your body into another form\. You can polymorph into any form listed in @UUID\[(Compendium\.[A-Za-z0-9_.-]+?)\.(?:Item\.)?([A-Za-z0-9]{16})\]\{([^}]+)\}, which lasts (\d+) minutes\. All other untamed shift shapes last (\d+) minutes?\. (You can add more shapes to your untamed shift list with druid feats; your feat might grant you some or all of the shapes from a given polymorph spell\.)$/;
const UNTAMED_TWO = /^When you transform into a shape granted by a spell, you gain all the effects of the shape you chose from a version of the spell heightened to untamed shift['’]s rank\. Untamed shift allows you to use your own shapeshifting training more easily than most polymorph spells\. When you choose to use your own attack modifier while polymorphed instead of the form['’]s default attack modifier, you gain a \+(\d) status bonus to your attack rolls\.$/;
const UNTAMED_STEP = /^Heightened \((\d)(?:st|nd|rd|th)\) You can transform into shapes listed in @UUID\[(Compendium\.[A-Za-z0-9_.-]+?)\.(?:Item\.)?([A-Za-z0-9]{16})\]\{([^}]+)\}\.$/;
const BOTTLE = /^You Cast a Spell with the hex trait on the triggering target\. If the spell you chose required two actions to be cast, you become @(?:UUID|Compendium)\[(?:Compendium\.)?pf2e\.conditionitems\.(?:Item\.)?([A-Za-z0-9]{16})\]\{Slowed (\d)\} until the end of your next turn, or @(?:UUID|Compendium)\[(?:Compendium\.)?pf2e\.conditionitems\.(?:Item\.)?[A-Za-z0-9]{16}\]\{Slowed (\d)\} if the spell you chose required three actions\. (If the hex spell requires a @(?:UUID|Compendium)\[[^\]]+\]\{Sustain\} to remain in effect, you must Sustain the Spell as normal on your next turn or the spell ends\.)$/;

const FRACTAL = /^You cast @UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]{16})\]\{([^}]+)\} as part of casting ([a-z ]+)\. For the duration of \3, you can cast ([a-z ]+) with a range of (\d+) feet, targeting up to (three|two|four) different targets within range\. You create difficult terrain in a @Template\[emanation\|distance:(\d+)\] in the area around each of the targets that lasts for 1 round\.$/;
const FRACTAL_STEP = /^<strong>Heightened \((\d+)(?:st|nd|rd|th)\)<\/strong> For the duration, when you cast ([a-z ]+), the target takes a [–-](\d+)-foot status penalty to its Speed for 1 round on a failure or a [–-](\d+)-foot status penalty to its Speed on a critical failure\.$/;
const LINK = /^@UUID\[(Compendium\.[A-Za-z0-9_.-]+\.Item\.([A-Za-z0-9]{16}))\]\{([^}]+)\}$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const NUMBER = { two: 2, three: 3, four: 4 };

/** The module's Effect gives the text's Speed penalty by the result, for 1 round. */
function speedPenaltyMatches(effect, failure, critical) {
    const rules = effect?.mechanics?.rules ?? effect?.system?.rules ?? [], duration = effect?.mechanics?.duration ?? effect?.system?.duration ?? {};
    const choice = rules.find(rule => rule.key === "ChoiceSet"), modifier = rules.find(rule => rule.key === "FlatModifier");
    const values = (choice?.choices ?? []).map(entry => Number(entry.value)).sort((a, b) => a - b);
    return rules.length === 2 && values.join() === [-critical, -failure].join() && [modifier?.selector].flat().join() === "speed" && modifier?.type === "status"
        && String(modifier?.value).includes(choice.flag) && duration.value === 1 && duration.unit === "rounds";
}

/** {proxy, sentences} or null. */
export function extractProxyCast(item, catalog = null) {
    const html = String(item?.system?.description?.value ?? "");
    const paragraphs = html.split(/<hr\s*\/?>/i).map(part => [...part.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/<\/?em>/g, "").replace(/\s+/g, " ").trim()));
    const flat = paragraphs.flat();
    const coalesce = flat.length === 1 && COALESCE.test(htmlToPlainText(flat[0]).trim());
    if (coalesce) return { proxy: { source: "polymorph", sameRank: true, notes: ["The spell is your daily anatomical configuration (asked when you cast)."] }, sentences: [htmlToPlainText(flat[0]).trim()] };
    const untamed = UNTAMED.exec(flat[0] ?? ""), two = UNTAMED_TWO.exec(htmlToPlainText(flat[1] ?? "").trim()), step = UNTAMED_STEP.exec(String(paragraphs[1]?.[0] ?? "").replace(/<\/?strong>/g, ""));
    if (untamed && two && step) return {
        proxy: { source: "list", sameRank: true, list: [{ name: untamed[3], uuid: `${untamed[1]}.Item.${untamed[2]}`, minRank: 1, seconds: Number(untamed[4]) * 60 },
            { name: step[4], uuid: `${step[2]}.Item.${step[3]}`, minRank: Number(step[1]), seconds: Number(untamed[5]) * 60 }],
            attackToggle: { value: Number(two[1]), option: "untamed-own-attack", label: "Using your own attack modifier" },
            notes: [untamed[6]] },
        sentences: [htmlToPlainText(flat[0]).trim(), htmlToPlainText(flat[1]).trim(), htmlToPlainText(paragraphs[1][0]).trim()] };
    const fractal = paragraphs.length === 2 && paragraphs[0].length === 1 && paragraphs[1].length === 2 ? FRACTAL.exec(htmlToPlainText(paragraphs[0][0]).replace(/^.*?(?=You cast @UUID)/, "").trim()) : null;
    const fractalStep = fractal ? FRACTAL_STEP.exec(paragraphs[1][0]) : null, link = fractal ? LINK.exec(paragraphs[1][1]) : null;
    if (fractal && fractalStep && link && fractal[2].toLowerCase() === fractal[4] && fractalStep[2] === fractal[4] && fractal[3] === String(item.name ?? "").toLowerCase()
        && /^1 minute$/.test(String(item.system?.duration?.value ?? "").trim()) && !NARRATION_RULES.test(htmlToPlainText(paragraphs[0][0]).split(/\s*You cast @UUID/)[0])
        && speedPenaltyMatches(catalog?.get?.(link[2]), Number(fractalStep[3]), Number(fractalStep[4]))) {
        const slug = fractal[4].replace(/ /g, "-"), step = Number(fractalStep[1]);
        const penalty = feet => [{ key: "FlatModifier", selector: "speed", type: "status", value: -feet }];
        return {
            proxy: { source: "list", sameRank: true, list: [{ name: fractal[2], uuid: fractal[1], minRank: 1 }],
                shaper: { spellSlug: slug, seconds: 60, maxTargets: NUMBER[fractal[6]], range: Number(fractal[5]),
                    riders: [{ type: "terrain", where: "around-creature", each: true, feet: Number(fractal[7]), difficult: true, until: "caster-turn-start" },
                        { type: "generated", name: `Speed –${fractalStep[3]} feet`, minRank: step, degrees: ["failure"], rules: penalty(Number(fractalStep[3])) },
                        { type: "generated", name: `Speed –${fractalStep[4]} feet`, minRank: step, degrees: ["criticalFailure"], rules: penalty(Number(fractalStep[4])) }],
                    note: `For 1 minute you can cast ${fractal[4]} with a range of ${fractal[5]} feet at up to ${NUMBER[fractal[6]]} targets; each target's ground (a ${fractal[7]}-foot emanation) is difficult terrain for 1 round.` } },
            sentences: [htmlToPlainText(paragraphs[0][0]).trim(), htmlToPlainText(paragraphs[1][0]).trim()] };
    }
    const bottle = flat.length === 1 ? BOTTLE.exec(flat[0]) : null;
    if (bottle && String(item.system?.time?.value ?? "").toLowerCase() === "reaction") return {
        proxy: { source: "own-trait", trait: "hex", sameRank: false, slowed: { uuid: `Compendium.pf2e.conditionitems.Item.${bottle[1]}`, byActions: { 2: Number(bottle[2]), 3: Number(bottle[3]) } },
            notes: [htmlToPlainText(bottle[4]).trim()] },
        sentences: [htmlToPlainText(flat[0]).trim()] };
    return null;
}
