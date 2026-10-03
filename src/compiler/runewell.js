// A personal runewell (Personal Runewell): "Area (continued) 15-foot radius, 30-foot-tall cylinder" / "… Whenever any creature Casts a Spell within your
// personal runewell, the well resonates, with your choice of effects." / "The runewell amplifies the power of your spells, as well as those of your allies. If
// the spell deals damage and doesn't have a duration, the well adds a status bonus to damage equal to the spell's rank." with PF2e's Spell Effect / "The
// runewell punishes enemies foolish enough to attempt magic in your seat of power, firing arcane bolts at the spell's caster that deal 4d6 force damage, with a
// basic Reflex save." / "If you cast personal runewell a second time, your previous personal runewell vanishes. You can Dismiss the spell." with "Heightened
// (+1) The amount of damage dealt by the runewell's bolts increases by 1d6.": a placed cylinder for the minute; the caster and allies inside hold PF2e's
// Effect (spell damage + the spell's rank, status) while inside; the GM's control when an enemy casts a spell inside opens its basic Reflex card against the
// bolts (PF2e's force damage, heightened); a recast ends the previous one; Dismiss; the amplification's "no duration" limit a note.
import { htmlToPlainText } from "./description-parser.js";

const AREA = /^Area \(continued\) (\d+)-foot radius, (\d+)-foot-tall cylinder$/;
const WHENEVER = /Whenever any creature Casts a Spell within your [a-z ]+, the well resonates, with your choice of effects\.$/;
const AMPLIFY = /^The runewell amplifies the power of your spells, as well as those of your allies\. (If the spell deals damage and doesn't have a duration, the well adds a status bonus to damage equal to the spell's rank\.)$/;
const PUNISH = /^The runewell punishes enemies foolish enough to attempt magic in your seat of power, firing arcane bolts at the spell's caster that deal (\d+d\d+) ([a-z]+) damage, with a basic (Fortitude|Reflex|Will) save\.$/;
const RECAST = /^If you cast [a-z ]+ a second time, your previous [a-z ]+ vanishes\. You can Dismiss the spell\.$/;
const LINK = /@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}/;

/** {html, lingering(link), sentences} or null. */
export function rewriteRunewell(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area?.type !== "cylinder" || adapted.lifecycle?.sustained) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const components = adapted.damageComponents ?? [];
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || sections.length !== 4) return null;
    const [areaHTML, body, heightened, pfs] = sections;
    const area = AREA.exec(htmlToPlainText(areaHTML).replace(/\s+/g, " ").trim());
    const items = [...body.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map(match => match[1]);
    const intro = htmlToPlainText(body.split(/<ul>/i)[0]).replace(/\s+/g, " ").trim();
    const after = htmlToPlainText(body.split(/<\/ul>/i)[1] ?? "").replace(/\s+/g, " ").trim();
    const link = LINK.exec(items[0] ?? "")?.[0];
    const amplify = AMPLIFY.exec(htmlToPlainText((items[0] ?? "").replace(LINK, "")).replace(/\s+/g, " ").trim());
    const punish = PUNISH.exec(htmlToPlainText(items[1] ?? "").replace(/\s+/g, " ").trim());
    if (!area || Number(area[1]) !== Number(adapted.targeting.area.value) || !WHENEVER.test(intro) || items.length !== 2 || !link || !amplify || !punish || !RECAST.test(after)
        || !/^PFS Note:/.test(htmlToPlainText(pfs).trim())) return null;
    const [, formula, type, statistic] = punish;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== formula || String(components[0].type).toLowerCase() !== type
        || statistic.toLowerCase() !== adapted.defense.statistic) return null;
    return {
        html: `<p>The bolts deal ${formula} ${type} damage with a basic ${statistic} save.</p><p>${link}</p>`,
        lingering: link => ({ events: [], initial: false, oncePerRound: false, excludeCaster: false, enemiesOnly: false, area: { type: "cylinder", value: Number(area[1]) }, centre: "placed",
            durationSeconds: Number(minutes[1]) * 60, sustained: false, concealment: false, recastEnds: true, dismissible: true,
            memberEffect: { allies: true, notOwnSpell: true, uuid: link.uuid, label: link.label ?? null, document: structuredClone(link.document), sourceText: htmlToPlainText((items[0] ?? "").replace(LINK, "")).replace(/\s+/g, " ").trim() },
            gmAction: { actions: ["cast"], label: "cast a spell in the runewell (an enemy: the bolts)", sourceText: htmlToPlainText(items[1]).replace(/\s+/g, " ").trim() },
            notes: [`The amplification: ${amplify[1]} (PF2e's Effect adds it to any spell damage; skip it for a spell with a duration).`],
            sourceText: [intro] }),
        sentences: [htmlToPlainText(areaHTML).trim(), intro, htmlToPlainText((items[0] ?? "").replace(LINK, "")).replace(/\s+/g, " ").trim(), htmlToPlainText(items[1]).replace(/\s+/g, " ").trim(), after, htmlToPlainText(heightened).trim(), htmlToPlainText(pfs).trim()]
    };
}
