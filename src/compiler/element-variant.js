// A rolled element whose PF2e variants each carry one element's damage (Elemental Breath):
//   "… Roll 1d6 to determine the element. If you used 3 actions to Cast this Spell, you can choose the element instead. This spell gains the trait
//   matching the element." / "Each creature in the cone must attempt a basic Reflex save." with a list ("Air Strong winds … dealing
//   @Damage[6d10[electricity]] damage. A creature that fails its save is also pushed 10 feet." / "Earth … A creature on the ground that fails its
//   save slips and falls @UUID[…]{Prone}." / "Fire …" / "Metal … A creature made of metal gets a result one degree of success worse than it
//   rolled, and an unattended metal object gets a critical failure." / "Water … @Damage[3d10[cold]] damage and @Damage[3d10[bludgeoning]] damage." /
//   "Wood … Ground in the area becomes difficult terrain for 1 minute.") and "Heightened (+1) The damage increases by [[/r 1d10]]. For water and
//   wood, you can choose which damage type increases for each rank the spell is heightened."
// Each PF2e variant (its trait names the element) reads its own list item: the basic save of its damage (checked against the variant's data),
// with the failing rows' push or Prone written out, a metal creature's worse result as a degree adjustment, the terrain as the card's area
// terrain, and for two damage types the caster's split of the heightened dice. The roll for the element is the caster's (a note).
import { htmlToPlainText } from "./description-parser.js";

const LEAD = [
    /^Roll 1d(\d+) to determine the element\.$/,
    /^If you used 3 actions to Cast this Spell, you can choose the element instead\.$/,
    /^This spell gains the trait matching the element\.$/
];
const SAVE = /^Each creature in the (cone|area|line|burst|emanation) must attempt a basic (Fortitude|Reflex|Will) save\.$/;
const INLINE = /@Damage\[(\d+d\d+)\[([a-z]+)\]\]/g;
const PUSH = /^A creature that fails its save is also pushed (\d+) feet\.$/;
const PRONE = /^A creature on the ground that fails its save slips and falls (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Prone\})\.$/;
const METAL = /^A creature made of ([a-z]+) gets a result one degree of success worse than it rolled, and an unattended \1 object gets a critical failure\.$/;
const TERRAIN = /^Ground in the area becomes difficult terrain for (\d+) minutes?\.$/;
const STEP = /^Heightened \(\+1\) The damage increases by (?:\[\[\/r )?1d(\d+)(?:\]\])?\.(?: For ([a-z]+) and ([a-z]+), you can choose which damage type increases for each rank the spell is heightened\.)?$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|until|fails?)\b/i;
const NAMES = { cone: "cone", area: "area", line: "line", burst: "burst", emanation: "emanation" };

/** {html, notes, areaTerrain, diceSplit, claimed} or null. */
export function rewriteElementVariant(adapted) {
    const html = String(adapted.descriptionHTML ?? "");
    const parts = /^\s*<p>([\s\S]*?)<\/p>\s*<p>([\s\S]*?)<\/p>\s*<ol>([\s\S]*?)<\/ol>\s*<hr\s*\/?>\s*<p>([\s\S]*?)<\/p>\s*$/.exec(html);
    if (!parts || adapted.defense?.kind !== "save" || adapted.defense.basic !== true) return null;
    const lead = htmlToPlainText(`<p>${parts[1]}</p>`).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = lead.findIndex(sentence => LEAD[0].test(sentence));
    if (at < 0 || lead.length !== at + LEAD.length || lead.slice(0, at).some(sentence => NARRATION_RULES.test(sentence)) || LEAD.some((pattern, index) => !pattern.test(lead[at + index]))) return null;
    const save = SAVE.exec(htmlToPlainText(`<p>${parts[2]}</p>`).replace(/\s+/g, " ").trim());
    if (!save || save[2].toLowerCase() !== adapted.defense.statistic) return null;
    const items = [...parts[3].matchAll(/<li>\s*<strong>\s*([A-Z][a-z]+)\s*<\/strong>\s*([\s\S]*?)<\/li>/g)];
    if (items.length !== Number(LEAD[0].exec(lead[at])[1])) return null;
    // The variant's element: its trait.
    const traits = adapted.activation?.traits ?? [];
    const own = items.filter(item => traits.includes(item[1].toLowerCase()));
    if (own.length !== 1) return null;
    const element = own[0][1].toLowerCase();
    const sentences = own[0][2].replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const components = adapted.damageComponents ?? [];
    let stated = [], push = null, prone = null, metal = null, terrain = null;
    for (const sentence of sentences) {
        const dice = [...sentence.matchAll(INLINE)];
        if (dice.length) {
            if (stated.length || NARRATION_RULES.test(sentence.replace(INLINE, ""))) return null;
            stated = dice.map(match => ({ formula: match[1], type: match[2] }));
            continue;
        }
        if (!push && PUSH.test(sentence)) { push = Number(PUSH.exec(sentence)[1]); continue; }
        if (!prone && PRONE.test(sentence)) { prone = PRONE.exec(sentence)[1]; continue; }
        if (!metal && METAL.test(sentence)) { metal = METAL.exec(sentence)[1]; continue; }
        if (!terrain && TERRAIN.test(sentence)) { terrain = Number(TERRAIN.exec(sentence)[1]); continue; }
        if (!NARRATION_RULES.test(sentence)) continue;
        return null;
    }
    // The stated damage is the variant's own entries.
    if (!stated.length || stated.length !== components.length || components.some(component => component.category)
        || !stated.every(part => components.some(component => String(component.formula).replace(/\s+/g, "") === part.formula && String(component.type).toLowerCase() === part.type))) return null;
    const step = STEP.exec(htmlToPlainText(`<p>${parts[4]}</p>`).replace(/\s+/g, " ").trim());
    if (!step || stated.some(part => !part.formula.endsWith(`d${step[1]}`))) return null;
    const split = stated.length === 2;
    if (split && !(step[2] && [step[2], step[3]].includes(element))) return null;
    if (adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== 1) return null;
    const steps = components.map(component => String(adapted.heightening.damage?.[component.id] ?? "0").replace(/\s+/g, ""));
    // (PF2e heightens the first entry only; the caster splits those dice between the two types.)
    if (split ? !(steps.filter(value => value === `1d${step[1]}`).length === 1 && steps.filter(value => value === "0").length === 1) : steps[0] !== `1d${step[1]}`) return null;
    const statistic = save[2], noun = NAMES[save[1]];
    const damageText = stated.map(part => `${part.formula} ${part.type} damage`).join(" and ");
    const adjust = metal ? `<p>Creatures with the ${metal} trait get a result one degree of success worse than they rolled.</p>` : "";
    const heightened = `<hr /><p><strong>Heightened (+1)</strong> The damage increases by 1d${step[1]}.</p>`;
    let body;
    if (push || prone) {
        const rider = push ? ` and is pushed ${push} feet away from you` : ` and falls ${prone}`;
        body = `${adjust}<p>Each creature in the ${noun} takes ${damageText}, depending on its ${statistic} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage${rider}.</p><p><strong>Critical Failure</strong> The creature takes double damage${rider}.</p>`;
    } else body = `<p>Each creature in the ${noun} takes ${damageText} (basic ${statistic} save).${metal ? ` Creatures with the ${metal} trait get a result one degree of success worse than they rolled.` : ""}</p>`;
    const notes = [`Roll 1d${items.length} for the element when you cast (with 3 actions you can choose it) and cast that variant; the spell gains its trait.`];
    if (prone) notes.push("Only a creature on the ground falls Prone: remove Prone from a creature that isn't (flying, climbing, swimming).");
    if (metal) notes.push(`An unattended ${metal} object in the ${noun} gets a critical failure (the GM's).`);
    const heightenedType = String(components.find(component => String(adapted.heightening.damage?.[component.id] ?? "0").replace(/\s+/g, "") !== "0")?.type ?? "").toLowerCase();
    return {
        html: `${body}${heightened}`,
        notes,
        areaTerrain: terrain ? { durationSeconds: terrain * 60, sourceText: sentences.find(sentence => TERRAIN.test(sentence)) } : null,
        diceSplit: split ? { faces: Number(step[1]), from: heightenedType, to: stated.map(part => part.type).find(type => type !== heightenedType), baseRank: Number(adapted.rank) || 1,
            sourceText: htmlToPlainText(`<p>${parts[4]}</p>`).replace(/\s+/g, " ").trim() } : null,
        element,
        claimed: [...lead, htmlToPlainText(`<p>${parts[2]}</p>`).trim(), ...sentences]
    };
}
