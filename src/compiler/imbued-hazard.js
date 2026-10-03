// An object or a square that harms whoever ends a turn with it (Necrotic Radiation): "You imbue the touched object or space with slow-acting necrotic
// radiation. If you cast the spell on an object, any creature ending its turn holding or carrying the object takes 2d6 void damage. If you cast the
// spell on an area, any creature ending its turn in the area takes 2d6 void damage. You can attempt to use this spell on an attended object by touching
// the object. If you do, the creature attempts a Reflex save to reduce the effect." with rows "The object is unaffected." / "… The spell only lasts 1
// minute." / "… The spell lasts 10 minutes." / "The spell lasts the full 24 hours." and "Heightened (+2) Increase the radiation's void damage by 1d6" —
// on a square: the GM's region, the damage at the end of each creature's turn inside; on an object: the damage at the end of its holder's turns (the GM
// moves it to a new holder from the card); an attended object's holder saves first, its result the spell's time.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = [/^You imbue the touched object or space with [a-z -]+\.$/,
    /^If you cast the spell on an object, any creature ending its turn holding or carrying the object takes (\d+)d(\d+) ([a-z]+) damage\.$/,
    /^If you cast the spell on an area, any creature ending its turn in the area takes (\d+)d(\d+) ([a-z]+) damage\.$/,
    /^You can attempt to use this spell on an attended object by touching the object\.$/,
    /^If you do, the creature attempts a (Fortitude|Reflex|Will) save to reduce the effect\.$/];
const LASTS = { criticalSuccess: /^The object is unaffected\.$/, success: /^The creature [a-z ]+\. The spell only lasts (\d+) (minute|hour)s?\.$/,
    failure: /^The creature [a-z ]+\. The spell lasts (\d+) (minute|hour)s?\.$/, criticalFailure: /^The spell lasts the full (\d+) (minute|hour)s?\.$/ };
const STEP = /^Heightened \(\+(\d)\) Increase the [a-z' ]+ ([a-z]+) damage by (\d+)d(\d+)\.?$/;
const SECONDS = { minute: 60, hour: 3600 };

/** {imbuedHazard, claimed} or null. */
export function compileImbuedHazard(adapted) {
    const components = adapted.damageComponents ?? [];
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || components.length !== 1 || components[0].category) return null;
    const lasting = /^(\d+) (minute|hour)s?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!lasting || !table || rest.length) return null;
    const plain = html => htmlToPlainText(html).replace(/\s+/g, " ").trim();
    const sentences = plain(body).split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (sentences.length !== LEAD.length || LEAD.some((pattern, index) => !pattern.test(sentences[index]))) return null;
    const object = LEAD[1].exec(sentences[1]), area = LEAD[2].exec(sentences[2]), save = LEAD[4].exec(sentences[4]);
    if (object.slice(1).join() !== area.slice(1).join() || `${object[1]}d${object[2]}` !== String(components[0].formula).replace(/\s+/g, "") || object[3] !== String(components[0].type).toLowerCase()
        || save[1].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = Object.fromEntries([...table.matchAll(/<p>\s*<strong>([^<]+)<\/strong>([\s\S]*?)<\/p>/g)].map(match => [match[1].trim(), plain(match[2])]));
    const heading = { criticalSuccess: "Critical Success", success: "Success", failure: "Failure", criticalFailure: "Critical Failure" };
    const byDegree = {};
    for (const [degree, pattern] of Object.entries(LASTS)) {
        const row = pattern.exec(rows[heading[degree]] ?? "");
        if (!row) return null;
        byDegree[degree] = degree === "criticalSuccess" ? 0 : Number(row[1]) * SECONDS[row[2]];
    }
    const seconds = Number(lasting[1]) * SECONDS[lasting[2]];
    const step = STEP.exec(plain(heightened));
    if (byDegree.criticalFailure !== seconds || (heightened.trim() && !(step && step[2] === object[3] && step[4] === object[2] && adapted.heightening?.type === "interval"
        && Number(adapted.heightening.interval) === Number(step[1]) && adapted.heightening.damage?.[components[0].id] === `${step[3]}d${step[4]}`))) return null;
    return { imbuedHazard: { dice: Number(object[1]), faces: Number(object[2]), type: object[3], step: step ? { interval: Number(step[1]), dice: Number(step[3]) } : null,
            seconds, statistic: adapted.defense.statistic, byDegree },
        claimed: [...sentences, ...Object.values(heading).map(name => `${name} ${rows[name]}`), ...(step ? [step[0]] : [])] };
}

/** The damage formula at a cast rank. */
export function imbuedHazardFormula(data, castRank, baseRank) {
    const steps = data.step ? Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.step.interval)) : 0;
    return `${data.dice + steps * (data.step?.dice ?? 0)}d${data.faces}`;
}
