// A rune the caster holds against a creature's attacks (Weaponize Secret): rows "The target is unaffected." / "A rune symbolizing a secret the target is
// keeping (at the GM's discretion) appears floating in front of you. If that creature attempts a Strike or spell attack against you while you hold
// their secret, you can discharge the rune as a reaction to deal @Damage[7d6[mental]] damage to the creature." / "As failure, but the target becomes
// convinced you know their secret and takes @Damage[1d6[persistent,mental]] damage from worry. If the rune with the secret is discharged while the
// creature is still taking the persistent mental damage, the persistent mental damage immediately ends." with "Heightened (+1) The mental damage
// increases by 2d6, and the persistent mental damage on a critical failure increases by 1.": the failing rows' rune a note whose control (the GM
// reports the creature's attack against the caster) deals the damage once at the cast rank and ends that creature's part; the critical failure's
// persistent damage at the cast rank, which the discharge also ends. PF2e's item has no damage: the text's.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = /^You understand that [a-z ,]+\. Each target must attempt an? (Fortitude|Reflex|Will) save\.$/;
const FAILURE = /^A rune symbolizing a secret the target is keeping \(at the GM's discretion\) appears floating in front of you\. If that creature attempts a Strike or spell attack against you while you hold their secret, you can discharge the rune as a reaction to deal @Damage\[(\d+)d(\d+)\[([a-z]+)\]\] damage to the creature\.$/;
const CRITICAL = /^As failure, but the target becomes convinced you know their secret and takes @Damage\[(\d+)d(\d+)\[persistent,([a-z]+)\]\] damage from worry\. If the rune with the secret is discharged while the creature is still taking the persistent ([a-z]+) damage, the persistent \4 damage immediately ends\.$/;
const STEP = /^Heightened \(\+1\) The ([a-z]+) damage increases by (\d+)d(\d+), and the persistent ([a-z]+) damage on a critical failure increases by 1\.$/;

/** {html, rune, persistentType, sentences} or null. */
export function rewriteSecretRune(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const failure = FAILURE.exec(row("Failure")), critical = CRITICAL.exec(row("Critical Failure")), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!lead || lead[1].toLowerCase() !== adapted.defense.statistic || rows.length !== 3 || !/^The target is unaffected\.$/.test(htmlToPlainText(row("Success"))) || row("Critical Success")
        || !failure || !critical || !step || step[1] !== failure[3] || step[3] !== failure[2] || critical[3] !== critical[4] || step[4] !== critical[3]) return null;
    const rank = Number(adapted.rank);
    const persistent = `@Damage[(${critical[1]}d${critical[2]} + @item.rank - ${rank})[persistent,${critical[3]}]]`;
    return {
        html: `<p>Each target must attempt a ${lead[1]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> The target is unaffected.</p><p><strong>Critical Failure</strong> The target takes ${persistent} damage.</p>`,
        rune: { dice: Number(failure[1]), die: Number(failure[2]), type: failure[3], baseRank: rank, heightening: { interval: 1, dice: Number(step[2]) } },
        persistentType: critical[3],
        sentences: [htmlToPlainText(body).trim(), `Success ${htmlToPlainText(row("Success"))}`, `Failure ${htmlToPlainText(row("Failure"))}`, `Critical Failure ${htmlToPlainText(row("Critical Failure"))}`, htmlToPlainText(heightened).trim()]
    };
}
