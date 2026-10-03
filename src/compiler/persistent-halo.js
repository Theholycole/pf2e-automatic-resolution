// A basic save whose failure adds persistent damage that marks the creature (Scouring Pulse):
//   "Area 10-foot radius, 60-foot-tall cylinder" (the item's area) / "Each creature in the area takes 6d8 vitality damage and must attempt a basic
//   Reflex save." / "Creatures that fail the save also take @Damage[…d8[persistent,vitality]] damage." / "Creatures that take persistent vitality
//   damage from scouring pulse are wreathed in a heatless halo of light. They emit bright light in a 5-foot radius preventing them from being
//   Concealed; if the creature is Invisible, they're concealed while affected by scouring pulse, rather than being undetected." with "Heightened
//   (8th) The vitality damage increases to 9d8 damage, and the persistent vitality damage increases to 2d8 persistent vitality damage. Creatures
//   remain suffused in light for 1d4 additional rounds after removing the persistent vitality damage."
// Written out as the basic save's four rows with the failing rows' persistent damage (1d8, 2d8 from the Heightened rank: the text's numbers), and
// a note on those rows lasting while the creature takes that persistent damage (the light and its concealment are the GM's).
import { htmlToPlainText } from "./description-parser.js";

const AREA_PARAGRAPH = /^\s*<p>\s*<strong>\s*Area\s*<\/strong>\s*(\d+)-foot radius, (\d+)-foot-tall cylinder\s*<\/p>\s*<hr\s*\/?>/i;
const TAKES_BASIC = /^Each creature in the area takes (\d+d\d+) ([a-z]+) damage and must attempt a basic (Fortitude|Reflex|Will) save\.$/;
const FAIL_PERSISTENT = /^Creatures that fail the save also take @Damage\[[^\]]*\[persistent,([a-z]+)\]\] damage\.$/;
const HALO = /^Creatures that take persistent ([a-z]+) damage from [a-z' ]+ are wreathed in a heatless halo of light\.$/;
const HALO_LIGHT = /^They emit bright light in a (\d+)-foot radius preventing them from being (?:@UUID\[[^\]]+\]\{Concealed\}|Concealed); if the creature is (?:@UUID\[[^\]]+\]\{Invisible\}|Invisible), they're concealed while affected by [a-z' ]+, rather than being undetected\.$/;
const AT_RANK = /^<p>\s*<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>\s*The ([a-z]+) damage increases to (\d+d\d+) damage, and the persistent \2 damage increases to (\d+)d(\d+) persistent \2 damage\. Creatures remain suffused in light for \[\[\/r (\d+d\d+) #Rounds\]\]\{\6 additional rounds\} after removing the persistent \2 damage\.\s*<\/p>$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|must|each|until)\b/i;

/** {html, note, sourceText} or null. */
export function rewritePersistentHalo(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area?.type !== "cylinder") return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const area = AREA_PARAGRAPH.exec(html);
    if (!area || Number(area[1]) !== Number(adapted.targeting.area.value)) return null;
    const [body, ...rest] = html.slice(area[0].length).split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length !== 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    let takes = null, fails = null, halo = null, light = null, narrated = 0;
    for (const sentence of sentences) {
        if (!takes && TAKES_BASIC.test(sentence)) { takes = TAKES_BASIC.exec(sentence); continue; }
        if (takes && !fails && FAIL_PERSISTENT.test(sentence)) { fails = FAIL_PERSISTENT.exec(sentence); continue; }
        if (fails && !halo && HALO.test(sentence)) { halo = HALO.exec(sentence); continue; }
        if (halo && !light && HALO_LIGHT.test(sentence)) { light = HALO_LIGHT.exec(sentence); continue; }
        if (!takes && narrated < 1 && !NARRATION_RULES.test(sentence)) { narrated++; continue; }
        return null;
    }
    if (!takes || !fails || !halo || !light) return null;
    const type = takes[2];
    if (fails[1] !== type || halo[1] !== type || takes[3].toLowerCase() !== adapted.defense.statistic
        || String(components[0].formula).replace(/\s+/g, "") !== takes[1] || String(components[0].type).toLowerCase() !== type) return null;
    // The Heightened rank: PF2e's data for the initial damage must say the text's; the persistent dice are the text's.
    const at = AT_RANK.exec(rest[0]);
    if (!at || at[2] !== type || adapted.heightening?.type !== "fixed") return null;
    const rank = Number(at[1]);
    const data = adapted.heightening.levels?.[rank]?.damage?.[components[0].id]?.formula;
    if (String(data ?? "").replace(/\s+/g, "") !== at[3] || Number(at[4]) !== 2) return null;
    const persistent = `(1 + floor(@item.rank / ${rank}))d${at[5]}[persistent,${type}]`;
    const statistic = takes[3];
    return {
        html: `<p>Each creature in the area takes ${takes[1]} ${type} damage, depending on its ${statistic} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage and @Damage[${persistent}] damage.</p>`
            + `<p><strong>Critical Failure</strong> The creature takes double damage and @Damage[${persistent}] damage.</p>`,
        note: { label: "Halo of light", text: `While it takes this persistent ${type} damage, it's wreathed in a heatless halo of light: it sheds bright light in a ${light[1]}-foot radius and can't be Concealed; if Invisible, it's concealed instead of undetected. From ${rank}th rank, the light lasts ${at[6]} more rounds after the persistent damage ends (GM).`,
            sourceText: `${halo[0]} ${light[0]}`, gmPlays: true, duration: { mode: "unlimited", value: null, unit: null, expiry: null, anchor: "effect-start", offset: 0, sourceText: "while taking the persistent damage" },
            whilePersistent: type },
        sourceText: [area[0].replace(/<[^>]+>/g, " ").trim(), halo[0], light[0], htmlToPlainText(rest[0]).trim()]
    };
}
