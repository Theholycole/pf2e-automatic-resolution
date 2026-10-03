// An area that heals the living at the start of their turns and sickens the undead (Life's Fresh Bloom): "Each living and non-nindoru creature that starts
// its turn standing on the ground in the area recovers 1d6 Hit Points and gains a +5-foot status bonus to its Speed until the end of its next turn.
// Nindoru fiends and undead that start their turn in the area of life's fresh bloom instead become {Sickened 1} unless they succeed at a Fortitude saving
// throw." with "Heightened (7th) Increase the Hit Points restored to 1d8 and {Sickened 2}." / "(10th) … 1d10 and {Sickened 3}." — the sustained area's
// turn start: a living creature (not nindoru) on the ground heals the item's dice at the rank and gets PF2e's Effect (the Speed bonus, proved); an undead
// or nindoru creature attempts the save, a failure Sickened at the rank's value.
import { htmlToPlainText } from "./description-parser.js";

const HEAL = /^Each living and non-([a-z]+) creature that starts its turn standing on the ground in the area recovers (\d+)d(\d+) Hit Points and gains a \+(\d+)-foot (status) bonus to its Speed until the end of its next turn\.$/;
const HARM = /^([A-Z][a-z]+) fiends and undead that start their turn in the area of [a-z' ]+ instead become @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{(Sickened) (\d)\} unless they succeed at a (Fortitude|Reflex|Will) saving throw\.$/;
const STEP = /^Heightened \((\d+)(?:st|nd|rd|th)\) Increase the Hit Points restored to (\d+)d(\d+) and @UUID\[[^\]]+\]\{Sickened (\d)\}\.$/;

/** {bloom, claimed} or null; `effect` is the linked PF2e Effect's document ({rules}). */
export function compileBloomArea(adapted, effect) {
    const components = adapted.damageComponents ?? [];
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.lifecycle?.sustained !== true || !adapted.targeting?.area) return null;
    const rounds = /^(\d+) rounds?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").replace(/<p>\s*@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}\s*<\/p>/g, "").split(/<hr\s*\/?>/i);
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (!rounds || sentences.length !== 3 || /\d|@|\b(?:damage|save|bonus|penalty|Hit Points)\b/.test(sentences[0])) return null;
    const heal = HEAL.exec(sentences[1]), harm = HARM.exec(sentences[2]);
    if (!heal || !harm || heal[1] !== harm[1].toLowerCase() || harm[5].toLowerCase() !== adapted.defense.statistic) return null;
    const own = components.length === 1 && (components[0].kinds ?? []).includes("healing") && String(components[0].formula).replace(/\s+/g, "") === `${heal[2]}d${heal[3]}`;
    // PF2e's Effect: the stated Speed bonus, until the end of the creature's next turn.
    const rules = effect?.mechanics?.rules ?? [];
    const speed = rules.length === 1 && rules[0].key === "FlatModifier" && [rules[0].selector].flat().join() === "land-speed" && rules[0].type === heal[5] && Number(rules[0].value) === Number(heal[4]);
    const timed = effect?.mechanics?.duration?.unit === "rounds" && Number(effect.mechanics.duration.value) === 1 && effect.mechanics.duration.expiry === "turn-end";
    const steps = [...rest.join(" ").matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim()).filter(Boolean).map(text => STEP.exec(text));
    if (!own || !speed || !timed || steps.some(step => !step)) return null;
    return { bloom: { seconds: Number(rounds[1]) * 6, exempt: heal[1], harmedTraits: ["undead"], harmedFiend: harm[1].toLowerCase(), statistic: harm[5].toLowerCase(),
            condition: { uuid: harm[2], slug: harm[3].toLowerCase(), value: Number(harm[4]) },
            byRank: [{ rank: Number(adapted.rank) || 1, heal: `${heal[2]}d${heal[3]}`, value: Number(harm[4]) }, ...steps.map(step => ({ rank: Number(step[1]), heal: `${step[2]}d${step[3]}`, value: Number(step[4]) }))] },
        claimed: [...sentences, ...steps.map(step => step[0])] };
}

/** The healing dice and the condition's value at a cast rank. */
export function bloomAt(data, castRank) {
    return [...data.byRank].sort((left, right) => left.rank - right.rank).filter(entry => Number(castRank) >= entry.rank).at(-1) ?? data.byRank[0];
}
