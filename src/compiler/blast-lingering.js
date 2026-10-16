// A blast that leaves a lingering area (Brimstone Rain, PF2e 8.6):
//   "Globs of smoldering brimstone erupt from the earth, dealing 8d6 fire damage to each creature in the area with a basic Reflex save and choking them with
//   sulfurous fumes." / "For the duration, the area is difficult terrain, and breathing creatures that start their turn in the area must succeed at a Fortitude
//   save or take @Damage[(@item.level - 3)d6[persistent,poison]] damage; this is an inhaled poison effect." / "On a critical failure, they're also {Sickened 1}." /
//   "You can Dismiss the spell." with "Heightened (+1) The fire damage increases by 1d6, and the persistent poison damage increases by 1d6."
// Two texts the readers know: the lingering area (its difficult terrain and the turn-start save with its rows) and the blast, a basic save card for the
// creatures inside when the area starts. PF2e's data has no duration: 1 minute (the user's decision, 2026-10-16). Who breathes is the GM's, at the review.
import { htmlToPlainText } from "./description-parser.js";

const BLAST = /^[A-Z][^.]*?, dealing (\d+d\d+) ([a-z]+) damage to each creature in the area with a basic (Fortitude|Reflex|Will) save(?: and [a-z ]+)?\.$/;
const LINGER = /^For the duration, the area is difficult terrain, and (breathing )?creatures that start their turn in the area must succeed at an? (Fortitude|Reflex|Will) save or take (@Damage\[\(@item\.level - (\d+)\)d(\d+)\[persistent,([a-z]+)\]\]) damage; this is an? ([a-z ]+) effect\.$/;
const CRITICAL = /^On a critical failure, they're also (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Za-z]+ \d+\})\.$/;
const DISMISS = /^You can Dismiss the spell\.$/;
const HEIGHTENED = /^Heightened \(\+1\) The ([a-z]+) damage increases by (\d+)d(\d+), and the persistent ([a-z]+) damage increases by (\d+)d(\d+)\.$/;
export const BLAST_LINGERING_MINUTES = 1;

/** {saveHTML, lingerHTML, reminder, dataNote, sentences} or null. */
export function extractBlastLingering(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.lifecycle?.sustained || String(adapted.lifecycle?.duration ?? "").trim()) return null;
    const area = adapted.targeting?.area, components = adapted.damageComponents ?? [];
    if (!area || !["burst", "cylinder", "cube", "emanation"].includes(area.type) || components.length !== 1 || components[0].category || String(adapted.targeting?.target ?? "").trim()) return null;
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    if (sentences.length !== 4 || !DISMISS.test(sentences[3])) return null;
    const blast = BLAST.exec(sentences[0]), linger = LINGER.exec(sentences[1]), critical = CRITICAL.exec(sentences[2]);
    if (!blast || !linger || !critical || blast[3].toLowerCase() !== adapted.defense.statistic) return null;
    const component = components[0];
    if (String(component.formula).replace(/\s+/g, "") !== blast[1] || String(component.type).toLowerCase() !== blast[2]) return null;
    // (The heightening: the blast's dice the item's own; the persistent dice by the rank in the inline formula — one die a rank.)
    const step = heightened ? HEIGHTENED.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim()) : null;
    if (heightened && (!step || step[1] !== blast[2] || step[4] !== linger[6] || step[5] !== "1" || step[6] !== linger[5]
        || adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== 1
        || String(adapted.heightening.damage?.[component.id] ?? "").replace(/\s+/g, "") !== `${step[2]}d${step[3]}`)) return null;
    const [, , save, damage] = linger;
    return {
        saveHTML: `<p>Each creature in the area takes ${blast[1]} ${blast[2]} damage with a basic ${blast[3]} save.</p>${heightened ? `<hr /><p><strong>Heightened (+1)</strong> The ${blast[2]} damage increases by ${step[2]}d${step[3]}.</p>` : ""}`,
        lingerHTML: `<p>The area is difficult terrain. Each creature that starts its turn in the area must attempt a ${save} save. You can Dismiss the spell.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Failure</strong> The creature takes ${damage} damage.</p><p><strong>Critical Failure</strong> The creature takes ${damage} damage and is ${critical[1]}.</p>`,
        reminder: linger[1] ? `Only breathing creatures are exposed (${linger[7]}): leave out creatures that don't breathe when you review them.` : null,
        dataNote: `PF2e's data has no duration: the area lasts ${BLAST_LINGERING_MINUTES} minute (your decision, 2026-10-16).`,
        sentences
    };
}
