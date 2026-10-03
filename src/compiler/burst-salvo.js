// A burst and a rolled number of smaller bursts (Explosive Barrage): "<strong>Area</strong> (continued) 20-foot burst plus additional {5-foot bursts}" / "You fire a
// booming, fiery explosion followed by a salvo of smaller blasts, each cracking the air with the sound of thunder. You create a 20-foot burst and [[/r 1d4#…]] additional
// 5-foot bursts each within the range and within 20 feet of another burst. None of the bursts can intersect. Each creature caught in at least one of these bursts takes
// 6d8 fire damage and 6d4 sonic damage (basic Fortitude save). On a failed save, a creature is also {Deafened} for 1 minute." — the ordinary basic save on the creatures
// the GM targets in any of the bursts (each once), the failure's condition from the text; the extra bursts' count a roll in the GM's reminder (placing them the GM's).
import { htmlToPlainText } from "./description-parser.js";

const AREA = /^<p>\s*<strong>Area<\/strong>\s*\(continued\)[^<]*(?:@Template\[[^\]]+\]\{[^}]+\}[^<]*)?<\/p>\s*$/;
const BURSTS = /^You create an? (\d+)-foot burst and \[\[\/r (\d+d\d+)(?:#[^\]]*)?\]\] additional (\d+)-foot bursts each within the range and within (\d+) feet of another burst\.$/;
const APART = /^None of the bursts can intersect\.$/;
const EACH = /^Each creature caught in at least one of these bursts takes (\d+d\d+) ([a-z]+) damage and (\d+d\d+) ([a-z]+) damage \(basic (Fortitude|Reflex|Will) save\)\.$/;
const RIDER = /^On a failed save, a creature is also (@UUID\[[^\]]+\]\{[A-Za-z]+\}) for (\d+) (rounds?|minutes?)\.$/;

/** {html, reminder, sentences} or null. */
export function rewriteBurstSalvo(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area?.type !== "burst") return null;
    const [lead, body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!AREA.test(lead.trim()) || !body) return null;
    const raw = body.replace(/<\/?p>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@[])/).filter(Boolean);
    const plain = raw.map(sentence => htmlToPlainText(sentence).trim());
    const burstAt = raw.findIndex(sentence => BURSTS.test(sentence));
    if (burstAt < 1 || raw.length !== burstAt + 4 || plain.slice(0, burstAt).some(sentence => /\d|@|\b(?:damage|saves?|conditions?)\b/i.test(sentence))) return null;
    const bursts = BURSTS.exec(raw[burstAt]), each = EACH.exec(plain[burstAt + 2]), rider = RIDER.exec(raw[burstAt + 3]);
    if (!APART.test(plain[burstAt + 1]) || !each || !rider || Number(bursts[1]) !== Number(adapted.targeting.area.value) || each[5].toLowerCase() !== adapted.defense.statistic) return null;
    const components = adapted.damageComponents ?? [];
    const pairs = [[each[1], each[2]], [each[3], each[4]]];
    if (components.length !== 2 || !pairs.every(([formula, type]) => components.some(component => String(component.formula).replace(/\s+/g, "") === formula && String(component.type).toLowerCase() === type))) return null;
    return {
        html: `<p>Each creature in the area takes ${each[1]} ${each[2]} damage and ${each[3]} ${each[4]} damage with a basic ${each[5]} save. On a failed save, a creature is also ${rider[1]} for ${rider[2]} ${rider[3]}.</p>${rest.length ? `<hr />${rest.join("<hr />")}` : ""}`,
        reminder: { kind: "spell-note", text: `Place the ${bursts[1]}-foot burst and ${bursts[2]} more ${bursts[3]}-foot bursts (roll [[/r ${bursts[2]}]]), each within range and within ${bursts[4]} feet of another; none can intersect. Target every creature caught in at least one (each once).`, sourceText: plain[burstAt] },
        sentences: plain
    };
}
