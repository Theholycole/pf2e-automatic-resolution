// A self spell that is a climbing rope for its duration (Inside Ropes):
//   "You can use the guts as 50 feet of rope to help you Climb, and they help attach you to a wall." / "You move half as quickly as usual
//   while climbing with your guts (minimum 5 feet), but you can attempt a @Check[flat|dc:5] check whenever you critically fail to prevent a
//   fall." / "Other creatures can use your guts to climb like a squishy rope, but …" / "If you let go of your guts or your guts are damaged,
//   the spell ends." with "Heightened (3rd) You gain a +1 item bonus to Athletics checks to Climb while using your guts." and PF2e's rank-3
//   Effect (that FlatModifier).
// One generated Effect on the caster for the duration: a PF2e Note on its Climb checks (half the distance, minimum 5 feet), the flat check the
// module rolls on a critically failed Climb (a success prevents the fall), and from the Heightened rank the Effect's own +1 item bonus rule.
// Others climbing the rope, and the spell ending when it's let go or damaged, are notes on the Effect.
import { htmlToPlainText } from "./description-parser.js";

const ROPE = /^You can use the ([a-z]+) as (\d+) feet of rope to help you (?:@UUID\[[^\]]+\]\{Climb\}|Climb), and they help attach you to a wall\.$/;
const HALF = /^You move half as quickly as usual while climbing with your ([a-z]+) \(minimum 5 feet\), but you can attempt a @Check\[flat\|dc:(\d+)\] check whenever you critically fail to prevent a fall\.$/;
const OTHERS = /^Other creatures can use your ([a-z]+) to climb like a [a-z ]*rope, but the [a-z]+ don't help anyone but you attach to a wall\.$/;
const ENDS = /^If you let go of your ([a-z]+) or your [a-z]+ (?:are|is) damaged, the spell ends\.$/;
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>\s*You gain a \+(\d) item bonus to Athletics checks to Climb while using your ([a-z]+)\.\s*<\/p>$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|rounds?|minutes?|checks?|Speed)\b/i;

/** Returns {climbAid, claimed} or null. */
export function compileClimbAid(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area || adapted.lifecycle?.sustained) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!minutes) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [body, ...rest] = html.split(/<hr\s*\/?>/i);
    if (rest.length > 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => ROPE.test(sentence));
    if (at < 0 || at > 2 || sentences.length !== at + 4 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const rope = ROPE.exec(sentences[at]), half = HALF.exec(sentences[at + 1]), others = OTHERS.exec(sentences[at + 2]), ends = ENDS.exec(sentences[at + 3]);
    if (!half || !others || !ends || new Set([rope[1], half[1], others[1], ends[1]]).size !== 1) return null;
    // Heightened: the stated bonus must be the linked Effect's only rule; the Effect's own link paragraph is the only other content.
    const links = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    let heightened = null;
    if (rest.length) {
        const paragraphs = [...rest[0].matchAll(/<p>[\s\S]*?<\/p>/gi)].map(match => match[0].trim());
        const entry = HEIGHTENED.exec(paragraphs[0] ?? "");
        const linkOnly = paragraphs.slice(1).every(paragraph => /^<p>\s*@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}\s*<\/p>$/.test(paragraph));
        if (!entry || !linkOnly || entry[3] !== rope[1] || links.length !== 1) return null;
        const rules = links[0].document?.mechanics?.rules ?? [];
        const rule = rules[0];
        if (rules.length !== 1 || rule.key !== "FlatModifier" || rule.selector !== "athletics" || rule.type !== "item" || Number(rule.value) !== Number(entry[2])
            || JSON.stringify(rule.predicate) !== '["action:climb"]') return null;
        heightened = { minRank: Number(entry[1]), rule: { key: "FlatModifier", selector: "athletics", type: "item", value: Number(entry[2]), predicate: ["action:climb"] },
            effect: links[0].label ?? links[0].reference, sourceText: htmlToPlainText(paragraphs[0]).trim() };
    } else if (links.length) return null;
    return {
        climbAid: { rope: rope[1], length: Number(rope[2]), fallCheckDC: Number(half[2]), halfDistance: true, heightened, durationSeconds: Number(minutes[1]) * 60,
            notes: [sentences[at], sentences[at + 2], sentences[at + 3]] },
        claimed: sentences
    };
}

/** The Effect's rules at a cast rank. */
export function climbAidRules(aid, { castRank, spellName }) {
    return [
        { key: "Note", selector: "athletics", predicate: ["action:climb"], outcome: ["success", "criticalSuccess"], title: spellName,
            text: `Climbing with the ${aid.rope}, you move half as far as usual (minimum 5 feet).` },
        { key: "Note", selector: "athletics", predicate: ["action:climb"], outcome: ["criticalFailure"], title: spellName,
            text: `The module rolls the DC ${aid.fallCheckDC} flat check: a success prevents the fall.` },
        ...(aid.heightened && castRank >= aid.heightened.minRank ? [{ ...aid.heightened.rule, label: spellName }] : [])
    ];
}

export function isExecutableClimbAid(aid) {
    return Boolean(aid) && /^[a-z]+$/.test(aid.rope ?? "") && Number.isInteger(aid.fallCheckDC) && aid.fallCheckDC >= 2 && aid.fallCheckDC <= 20
        && Number.isInteger(aid.durationSeconds) && aid.durationSeconds > 0
        && (aid.heightened == null || (Number.isInteger(aid.heightened.minRank) && aid.heightened.rule?.key === "FlatModifier"));
}

/** A flat check's result: 1d20 against the DC. */
export function flatCheckPasses(natural, dc) {
    return Number(natural) >= Number(dc);
}
