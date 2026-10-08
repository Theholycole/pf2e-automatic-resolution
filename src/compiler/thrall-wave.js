// A thrall melted into a wave of flesh (Flesh Tsunami): "You melt one of your thralls into a massive wave of sticky flesh. Destroy the target thrall to
// create an area of greater difficult terrain in a 60-foot cone originating from the thrall's former space. You can destroy a second thrall in the cone to
// make its limbs grasp your foes. If you do, each enemy in the area must succeed at a Fortitude saving throw or be Immobilized for 1 round or until it
// Escapes; the Escape DC is your spell DC." — a card of parts: destroy the thrall, the cone's greater difficult terrain for the spell's time (placed from
// the thrall's space), and the second thrall's grasp: destroy it, then the enemies in the cone save (Immobilized for 1 round or until it Escapes).
import { plainOrEmpty as plain } from "./text-patterns.js";

const LEAD = [
    /^You melt one of your thralls into a [a-z ]+\.$/,
    /^Destroy the target thrall to create an area of (greater )?difficult terrain in an? (\d+)-foot (cone|burst|line|emanation) originating from the thrall's former space\.$/,
    /^You can destroy a second thrall in the (cone|burst|line|area) to make its limbs grasp your foes\.$/,
    /^If you do, each enemy in the area must succeed at an? (Fortitude|Reflex|Will) saving throw or be @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{(Immobilized|Grabbed|Restrained)\} for (\d+) rounds? or until it Escapes; the Escape DC is your spell DC\.$/
];

/** {terrain, grasp, sentences} or null. */
export function extractThrallWave(adapted) {
    if (!/^1 of your thralls$/i.test(String(adapted.targeting?.target ?? "").trim()) || adapted.targeting?.area || adapted.defense?.kind !== "save" || adapted.defense.basic) return null;
    if ((adapted.damageComponents ?? []).length || /<hr/i.test(adapted.descriptionHTML ?? "")) return null;
    const sentences = plain(adapted.descriptionHTML).split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (sentences.length !== LEAD.length) return null;
    const m = LEAD.map((pattern, index) => pattern.exec(sentences[index]));
    if (m.some(hit => !hit) || m[3][1].toLowerCase() !== adapted.defense.statistic) return null;
    const seconds = (minutes => minutes ? Number(minutes[1]) * 60 : null)(/^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim()));
    if (!seconds) return null;
    const statistic = m[3][1];
    return {
        terrain: { area: { type: m[1][3], value: Number(m[1][2]) }, difficulty: m[1][1] ? 3 : 2, seconds, sourceText: sentences[1] },
        grasp: { area: { type: m[1][3], value: Number(m[1][2]) }, statistic: statistic.toLowerCase(), sourceText: [sentences[2], sentences[3]].join(" "),
            html: `<p>Each enemy in the area must attempt a ${statistic} save.</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
                + `<p><strong>Failure</strong> The creature is @UUID[${m[3][2]}]{${m[3][3]}} for ${m[3][4]} round${m[3][4] === "1" ? "" : "s"} or until it Escapes.</p><p><strong>Critical Failure</strong> As failure.</p>` },
        sentences
    };
}
