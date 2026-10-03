// Enemies around the caster are off-guard against the caster's attacks (Menacing Lament):
//   "You wail a dirge for your enemies." / "Enemies in the area are Off-Guard against your attacks and gain no benefits from flanking you for
//   the duration." — an emanation, 1 round, no save.
// Casting gives each enemy of the caster (PF2e alliances) within the emanation an Effect until the start of the caster's next turn: a –2
// circumstance penalty to AC (PF2e's off-guard slug, so it doesn't stack with Off-Guard) only against the caster's attacks
// (`origin:signature:<caster>`), and a note that it gains no benefit from flanking the caster.
import { htmlToPlainText } from "./description-parser.js";

const OFF_GUARD = /^Enemies in the area are (?:@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Off-Guard\}|off-guard) against your attacks( and gain no benefits from flanking you)? for the duration\.$/;
const NARRATION_RULES = /\d|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|rounds?|minutes?|off-guard)\b/i;

/** Returns {againstCaster, claimed} or null. */
export function compileAgainstCaster(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim() || adapted.lifecycle?.sustained) return null;
    if (area?.type !== "emanation" || !(Number(area.value) > 0) || !/^1 round$/i.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<hr\s*\/?>|Heightened/i.test(html)) return null;
    const sentences = htmlToPlainText(html).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    let rule = null, narrated = 0;
    const claimed = [];
    for (const sentence of sentences) {
        const match = !rule ? OFF_GUARD.exec(sentence) : null;
        if (match) { rule = { flanking: !!match[1] }; claimed.push(sentence); continue; }
        if (!rule && narrated < 1 && !NARRATION_RULES.test(sentence)) { narrated++; continue; }
        return null;
    }
    if (!rule) return null;
    return { againstCaster: { radius: Number(area.value), penalty: { selector: "ac", type: "circumstance", value: -2, slug: "off-guard" }, flankingNote: rule.flanking,
        duration: { value: 1, unit: "rounds", expiry: "turn-start" } }, claimed };
}
