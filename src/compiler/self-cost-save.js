// A spell that costs the caster damage, with a basic save's critical-failure persistent rider (Mutilate):
//   "You cut your own body in a ritualistic manner, causing similar damage to a creature in your line of sight." / "These cuts are superficial and
//   cause 1d4 slashing damage to you; however, the wounds that open up on our target's body are far deeper." / "The targeted creature takes 5d8
//   slashing damage; a creature that critically fails this saving throw also takes @Damage[(1d8 + @item.level -4)[bleed]] damage." / "If you cast
//   this as a three-action spell, the spell instead affects a 5-foot burst." with "Heightened (+1) Increase the damage dealt to the target by 1d8,
//   and increase the persistent bleed damage by 1."
// Written out as the basic save's four rows (the critical failure's persistent bleed); the caster's own damage is rolled and applied once when the
// card finalizes; the 3-action burst is a card note (the caster targets every creature in it).
import { htmlToPlainText } from "./description-parser.js";

const SELF_CUT = /^These cuts are superficial and cause (\d+d\d+) ([a-z]+) damage to you; however, the wounds that open up on (?:our|your|the) target's body are far deeper\.$/;
const TARGET_TAKES = /^The targeted creature takes (\d+d\d+) ([a-z]+) damage; a creature that critically fails this saving throw also takes @Damage\[\((\d+)d(\d+) \+ @item\.(?:level|rank) ?- ?(\d+)\)\[(?:persistent,)?bleed\]\] damage\.$/;
const THREE_ACTION_BURST = /^If you cast this as a three-action spell, the spell instead affects an? (\d+)-foot burst\.$/;
const STEP = /^Heightened \(\+1\) Increase the damage dealt to the target by (\d+d\d+), and increase the persistent bleed damage by 1\.$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:saves?|bonus|penalty|conditions?|immune|must|each|until)\b/i;

/** {html, casterDamage, note, sourceText} or null. */
export function rewriteSelfCostSave(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (rest.length !== 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    let self = null, takes = null, burst = null, narrated = 0;
    for (const sentence of sentences) {
        if (!self && SELF_CUT.test(sentence)) { self = SELF_CUT.exec(sentence); continue; }
        if (!takes && TARGET_TAKES.test(sentence)) { takes = TARGET_TAKES.exec(sentence); continue; }
        if (!burst && THREE_ACTION_BURST.test(sentence)) { burst = THREE_ACTION_BURST.exec(sentence); continue; }
        if (!self && !takes && narrated < 1 && !NARRATION_RULES.test(sentence.replace(/\bcausing similar damage to a creature in your line of sight\b/, ""))) { narrated++; continue; }
        return null;
    }
    if (!self || !takes) return null;
    if (String(components[0].formula).replace(/\s+/g, "") !== takes[1] || String(components[0].type).toLowerCase() !== takes[2]) return null;
    // The bleed's base at the spell's rank must be its stated dice (the level term adds the rank's step).
    if (Number(takes[5]) !== Number(adapted.rank)) return null;
    const step = STEP.exec(htmlToPlainText(rest[0]).replace(/\s+/g, " ").trim());
    if (!step || adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== 1 || adapted.heightening.damage?.[components[0].id] !== step[1]) return null;
    if (burst && String(adapted.activation?.time ?? "").trim() !== "2 or 3") return null;
    const bleed = `(${takes[3]}d${takes[4]} + @item.rank - ${takes[5]})[persistent,bleed]`;
    return {
        html: `<p>The target takes ${takes[1]} ${takes[2]} damage, depending on its ${adapted.defense.statistic[0].toUpperCase()}${adapted.defense.statistic.slice(1)} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage.</p><p><strong>Critical Failure</strong> The creature takes double damage and @Damage[${bleed}] damage.</p>`
            + `<hr /><p><strong>Heightened (+1)</strong> The damage increases by ${step[1]}.</p>`,
        casterDamage: { formula: self[1], type: self[2], sourceText: self[0] },
        ...(burst ? { note: `If the caster used 3 actions, the spell affects a ${burst[1]}-foot burst instead of one creature: target every creature in it.`, noteSource: burst[0] } : {}),
        sourceText: sentences
    };
}
