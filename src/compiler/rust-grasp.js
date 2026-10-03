// A touch whose effect depends on what it targets, a creature or an item (Rusting Grasp): "… The effect of the spell depends on its target." with
// "<strong>Creature or Hazard</strong> … The grasp deals 8d6 damage (basic Fortitude save), plus @Damage[2d6[persistent]] on a failed save. …" and
// "<strong>Item</strong> The rust deals [[/r {2d6}]]{2d6 damage}, subject to a basic Reflex save by the creature wearing or holding the item; if the item
// is unattended, it automatically gets a critical failure. On a failed save, the item also takes @Damage[1d6[persistent]]. For an attended item, this
// persistent damage occurs at the end of the attending creature's turns; if the item was unattended when you Cast the Spell, the damage happens at the
// end of your turns. …" and "Heightened (+1) Increase the initial damage to creatures or hazards by 2d6, and increase the maximum Bulk of an item you can
// target by 1." — a creature or hazard: the basic save of the text's damage at the cast rank (the failing rows' persistent damage); an item (user
// decision 2026-10-01, objects rolled on the card): its holder's basic save (an unattended item a critical failure), the damage rolled for the GM to
// apply to the item, and on a failure the card's control for the persistent damage at the end of each turn the text names.
import { htmlToPlainText } from "./description-parser.js";

const GM_NOTES = [/^You cause the target to rapidly rust\.$/, /^This magical rust can affect nonferrous materials, but the target must be all or mostly metal\.$/,
    /^Skymetals such as adamantine and orichalcum are immune to this rust, and the GM might determine other precious materials are similarly resilient\.$/,
    /^Ultimately, the GM decides if an object or creature can be targeted with this spell\.$/, /^All damage from this spell ignores Hardness\.$/,
    /^If the spell causes persistent damage from rust, a creature can attempt to scrape off the rust to assist the target in recovering from the persistent damage \(reducing the DC of the flat check to end persistent damage to (\d+) and granting an immediate flat check\)\.$/,
    /^The effect of the spell depends on its target\.$/,
    /^A creature or hazard must be made of all or mostly metal to be affected \(this includes many mechanical traps\)\.$/,
    /^Touching a hazard to affect it with this spell might trigger the hazard, as determined by the GM\.$/,
    /^When targeting armor someone is wearing, its Bulk is 1 higher than the listed value, since carrying armor is more cumbersome than wearing it\.$/,
    /^Thin iron or steel items, such as weapons, have \d+ HP and a Broken Threshold of \d+, and thicker iron or steel items, such as most suits of armor, have \d+ HP and a Broken Threshold of \d+\.$/];
const CREATURE = /^The grasp deals (\d+)d(\d+) damage \(basic (Fortitude|Reflex|Will) save\), plus @Damage\[(\d+)d(\d+)\[persistent\]\] on a failed save\.$/;
const ITEM = /^The rust deals \[\[\/r \{(\d+)d(\d+)\}\]\]\{[^}]+\}, subject to a basic (Fortitude|Reflex|Will) save by the creature wearing or holding the item; if the item is unattended, it automatically gets a critical failure\.$/;
const ITEM_PERSISTENT = /^On a failed save, the item also takes @Damage\[(\d+)d(\d+)\[persistent\]\]\.$/;
const ITEM_WHEN = /^For an attended item, this persistent damage occurs at the end of the attending creature's turns; if the item was unattended when you Cast the Spell, the damage happens at the end of your turns\.$/;
const STEP = /^Heightened \(\+(\d)\) Increase the initial damage to creatures or hazards by (\d+)d(\d+), and increase the maximum Bulk of an item you can target by (\d+)\.$/;

/** {rustGrasp, claimed} or null. */
export function compileRustGrasp(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || (adapted.damageComponents ?? []).length) return null;
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (rest.length || !/<ul>/.test(body)) return null;
    const split = html => htmlToPlainText(html).replace(/\s+/g, " ").trim().split(/(?<=[.!?)])\s+(?=[A-Z@[])/).filter(Boolean);
    const intro = body.split(/<ul>/)[0];
    const items = Object.fromEntries([...body.matchAll(/<li>\s*(?:<p>\s*)?<strong>([^<]+)<\/strong>([\s\S]*?)<\/li>/g)].map(match => [match[1].trim(), split(match[2])]));
    if (Object.keys(items).join() !== "Creature or Hazard,Item") return null;
    const notes = [];
    const all = [...split(intro), ...items["Creature or Hazard"], ...items.Item];
    let creature = null, item = null, persistent = null, when = false;
    for (const sentence of all) {
        const c = CREATURE.exec(sentence), i = ITEM.exec(sentence), p = ITEM_PERSISTENT.exec(sentence);
        if (c && !creature) { creature = c; continue; }
        if (i && !item) { item = i; continue; }
        if (p && !persistent) { persistent = p; continue; }
        if (ITEM_WHEN.test(sentence) && !when) { when = true; continue; }
        if (GM_NOTES.some(pattern => pattern.test(sentence))) { notes.push(sentence); continue; }
        return null;
    }
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!creature || !item || !persistent || !when || !step || step[3] !== creature[2] || creature[3].toLowerCase() !== adapted.defense.statistic) return null;
    const baseRank = Number(adapted.rank) || 1;
    return { rustGrasp: {
            creature: { statistic: creature[3].toLowerCase(), formula: `(${creature[1]} + ${step[2]}*floor((@item.rank - ${baseRank})/${step[1]}))d${creature[2]}[untyped]`,
                persistent: `${creature[4]}d${creature[5]}` },
            item: { statistic: item[3].toLowerCase(), formula: `${item[1]}d${item[2]}`, persistent: `${persistent[1]}d${persistent[2]}`, bulkStep: { interval: Number(step[1]), bulk: Number(step[4]) } },
            notes },
        claimed: [...all, step[0]] };
}
