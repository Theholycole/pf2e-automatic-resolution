// A ward that stops one type of damage at 1 Hit Point and heals (Phoenix Ward): "You raise a fiery shield around yourself, gaining resistance 10 to
// fire. If you take fire damage that would reduce you to 0 Hit Points, the phoenix ward absorbs any damage beyond the amount that would bring you to 1
// Hit Point. The ward then heals you in a brilliant display of flames … You regain Hit Points equal to 4d8 + the absorbed damage; this is a healing
// vitality effect. The phoenix ward then ends, and you can't cast it again for 24 hours." with "Heightened (+1) The healing increases by 1d8." — the
// caster's Effect with the resistance for the spell's time; when damage of the type would drop the caster to 0, the module leaves 1 Hit Point and
// heals the item's dice (at the cast rank) plus the damage absorbed; the Effect ends, and casting again is refused for the stated time.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = [/^You raise a [a-z ]+ around yourself, gaining resistance (\d+) to ([a-z]+)\.$/,
    /^If you take ([a-z]+) damage that would reduce you to 0 Hit Points, the [a-z ]+ absorbs any damage beyond the amount that would bring you to 1 Hit Point\.$/,
    /^The ward then heals you in [a-z ,'-]+\.$/,
    /^You regain Hit Points equal to (\d+)d(\d+) \+ the absorbed damage; this is a healing vitality effect\.$/,
    /^The [a-z ]+ then ends, and you can't cast it again for (\d+) (hours?|days?)\.$/];
const STEP = /^Heightened \(\+(\d)\) The healing increases by (\d+)d(\d+)\.$/;

/** {deathWard, claimed} or null. */
export function compileDeathWard(adapted) {
    const components = adapted.damageComponents ?? [];
    if ((adapted.defense?.kind ?? "none") !== "none" || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").replace(/<p>\s*@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}\s*<\/p>/g, "").split(/<hr\s*\/?>/i);
    if (!minutes || rest.some(section => section.trim())) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (sentences.length !== LEAD.length || LEAD.some((pattern, index) => !pattern.test(sentences[index]))) return null;
    const [, value, type] = LEAD[0].exec(sentences[0]), heal = LEAD[3].exec(sentences[3]), lockout = LEAD[4].exec(sentences[4]);
    if (LEAD[1].exec(sentences[1])[1] !== type) return null;
    // (The healing is the item's own entry, with its heightening.)
    const own = components.length === 1 && (components[0].kinds ?? []).includes("healing") && String(components[0].formula).replace(/\s+/g, "") === `${heal[1]}d${heal[2]}` ? components[0] : null;
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!own || (heightened.trim() && !(step && step[3] === heal[2] && adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(step[1])
        && adapted.heightening.damage?.[own.id] === `${step[2]}d${step[3]}`))) return null;
    const unit = lockout[2].replace(/s$/, "");
    return { deathWard: { type, resistance: Number(value), seconds: Number(minutes[1]) * 60, heal: { dice: Number(heal[1]), faces: Number(heal[2]), step: step ? { interval: Number(step[1]), dice: Number(step[2]) } : null },
            lockout: { value: Number(lockout[1]) * (unit === "day" ? 24 : 1), unit: "hours" } },
        claimed: [...sentences, ...(step ? [step[0]] : [])] };
}

/** The healing dice at a cast rank. */
export function deathWardHealing(data, castRank, baseRank) {
    const steps = data.heal.step ? Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.heal.step.interval)) : 0;
    return `${data.heal.dice + steps * (data.heal.step?.dice ?? 0)}d${data.heal.faces}`;
}
