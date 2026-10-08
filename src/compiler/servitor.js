// An incarnate servitor that shields allies on arrival and heals or harms on departure (Summon Healing Servitor): "… The servitor occupies the space of a Huge creature
// and has a speed of 60 feet." / "Arrive … All allies within 20 feet of the Servitor gain 20 temporary Hit Points until the servitor departs." / "Depart … The servitor
// disappears in a @Template[emanation|distance:30] of vitality energy. All willing living creatures within heal 3d8 Hit Points. All undead within take that much damage,
// with a basic Fortitude save." with "Heightened (+2) The Arrive effect's temporary Hit Points increase by 8, and the Depart effect's healing and damage to undead
// increase by 1d8." — Arrive: PF2e's Effect (its temporary Hit Points proved at both ranks) on the targeted allies until the departure; Depart (the card's, at the end
// of the caster's next turn): the targeted living creatures heal the rolled amount, the undead among them its basic save card (a compiled plan); the Effects end.
import { htmlToPlainText } from "./description-parser.js";
import { SPELL_EFFECT_LINK as LINK } from "./text-patterns.js";

const SPACE = /^The [a-z]+ occupies the space of an? (Small|Medium|Large|Huge|Gargantuan) creature and has a speed of (\d+) feet\.$/;
const ARRIVE = /^<strong>Arrive<\/strong>\s*\(([a-z, ]+)\)\s*<em>([^<]+)<\/em>\s*([\s\S]+)$/;
const DEPART = /^<strong>Depart<\/strong>\s*\(([a-z, ]+)\)\s*<em>([^<]+)<\/em>\s*([\s\S]+)$/;
const SHIELD = /^All allies within (\d+) feet of the Servitor gain (\d+) temporary Hit Points until the servitor departs\.$/;
const BLESS = [/^The servitor disappears in a @Template\[emanation\|distance:(\d+)\] of vitality energy\.$/, /^All willing living creatures within heal (\d+)d(\d+) Hit Points\.$/,
    /^All undead within take that much damage, with a basic (Fortitude|Reflex|Will) save\.$/];
const STEP = /^Heightened \(\+(\d)\) The Arrive effect's temporary Hit Points increase by (\d+), and the Depart effect's healing and damage to undead increase by (\d+)d(\d+)\.$/;

/** {servitor, claimed} or null; the catalog proves PF2e's Effect. */
export function compileServitor(adapted, catalog) {
    if (!(adapted.activation?.traits ?? []).includes("incarnate") || !/^until the end of your next turn$/i.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const split = text => htmlToPlainText(text).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const link = paragraphs.map(paragraph => LINK.exec(paragraph)).find(Boolean);
    const arrive = paragraphs.map(paragraph => ARRIVE.exec(paragraph)).find(Boolean), depart = paragraphs.map(paragraph => DEPART.exec(paragraph)).find(Boolean);
    if (!link || !arrive || !depart || paragraphs.length !== 4) return null;
    const intro = split(paragraphs[0]);
    if (intro.length !== 2 || /\d|@/.test(intro[0]) || !SPACE.test(intro[1])) return null;
    const shieldLines = split(arrive[3]), blessLines = split(depart[3]);
    const shield = shieldLines.length === 2 && !/\d|@/.test(shieldLines[0]) ? SHIELD.exec(shieldLines[1]) : null;
    const bless = blessLines.length === 3 && BLESS.every((pattern, index) => pattern.test(blessLines[index])) ? BLESS.map((pattern, index) => pattern.exec(blessLines[index])) : null;
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!shield || !bless || !step || step[4] !== bless[1][2]) return null;
    // PF2e's Effect: its temporary Hit Points the text's at the base rank and one step up.
    const entries = catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {});
    const effect = entries.find(entry => entry?.name === link[2]);
    const temp = (effect?.mechanics?.rules ?? []).find(rule => rule.key === "TempHP");
    const formula = /^ceil\(@item\.level\/(\d+)\)\*(\d+)-(\d+)$/.exec(String(temp?.value ?? "").replace(/\s+/g, ""));
    const at = level => formula ? Math.ceil(level / Number(formula[1])) * Number(formula[2]) - Number(formula[3]) : NaN;
    const rank = Number(adapted.rank);
    if (!effect?.id || at(rank) !== Number(shield[2]) || at(rank + Number(step[1])) !== Number(shield[2]) + Number(step[2])) return null;
    return { servitor: { size: intro[1] && SPACE.exec(intro[1])[1], speed: Number(SPACE.exec(intro[1])[2]), effect: { uuid: `Compendium.pf2e.spell-effects.Item.${effect.id}`, name: effect.name },
            arrive: { title: arrive[2].trim(), traits: arrive[1].split(/,\s*/), radius: Number(shield[1]), tempHP: Number(shield[2]) },
            depart: { title: depart[2].trim(), traits: depart[1].split(/,\s*/), radius: Number(bless[0][1]), dice: Number(bless[1][1]), faces: Number(bless[1][2]), statistic: bless[2][1].toLowerCase() },
            step: { interval: Number(step[1]), tempHP: Number(step[2]), dice: Number(step[3]) } },
        claimed: [...intro, ...shieldLines, ...blessLines, step[0], link[0]] };
}

/** The departure's dice at a cast rank. */
export function servitorDice(data, castRank, baseRank) {
    return `${data.depart.dice + Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.step.interval)) * data.step.dice}d${data.depart.faces}`;
}
