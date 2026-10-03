// Becoming a plant or a stone, or merging with one (One with Plants, One with Stone; user decisions 2026-10-01: a battle form PF2e has no Effect for is generated from the
// text; a trigger the module can't detect is the GM's control):
//   "You can either transform into a plant or merge with plant matter." / "While transformed, you can't move or affect anything outside the plant,
//   but you can cast spells as long as they don't require line of effect beyond the plant." / "You can Dismiss this spell." with the list
//   Merge with Plants (10 minutes; touch a plant big enough or the spell is disrupted; hear but not see outside; if the plant takes damage you're
//   expelled and take 10d6 damage; Magic Passage expels you without damage; the spell ends if you're ever outside the plant) and Turn into a Plant
//   (8 hours; a Large plant, typically a tree; Perception doesn't reveal it, a Nature or Survival check against the spell DC does; you observe
//   with your normal senses; AC 20, only status and circumstance bonuses and penalties apply; successes and critical successes on Reflex saves
//   are failures).
// The cast asks the mode. Either way a Dismissable record holds a generated Effect on the caster: Immobilized (it can't move). The tree is a
// battle form (AC 20, Large, the plant trait) whose Reflex successes are failures; merged, the caster is Blinded (hearing only). The record's
// controls expel a merged caster: the plant took damage (10d6) or Magic Passage (none); either ends the spell. The rest are notes.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i;
// (One with Stone the same with "stone": "You become a Large stone." and "As a stone, your AC is 23, …".)
const EITHER = /^You can either transform into an? (plant|stone) or merge with (?:plant matter|stone)\.$/;
const WHILE = /^While transformed, you can't move or affect anything outside the (plant|stone), but you can cast spells as long as they don't require line of effect beyond the (?:plant|stone)\.$/;
const DISMISS = /^You can Dismiss this spell\.$/;
const MERGE = [
    /^The spell's duration is (\d+) (minutes|hours)\.$/,
    /^While casting the spell, you must touch an? (?:plant|stone) with enough volume to fit you and your possessions or the spell is disrupted\.$/,
    /^While merged, you can hear, but not see, what's going on outside the (?:plant|stone)\.$/,
    /^If the (?:plant|stone) takes damage while you're inside it, you're expelled from the (?:plant|stone) and take (\d+d\d+) damage\.$/,
    /^(?:<em>)?Magic passage(?:<\/em>)? expels you without dealing damage\.$/i,
    /^The spell ends if you're ever outside the (?:plant|stone)\.$/
];
const TREE = [
    /^The spell's duration is (\d+) (minutes|hours)\.$/,
    /^You become an? (Tiny|Small|Medium|Large|Huge) (?:plant[-—–]typically a tree|stone)\.$/,
    /^Perception checks don't reveal your true nature, but a successful Nature or Survival check against your spell DC reveals that you appear to be an? (?:plant|stone) that is strangely new to the area\.$/,
    /^While in this form, you can observe everything around you, using your normal senses\.$/,
    /^As an? (?:plant|stone), your AC is (\d+), and only status bonuses, status penalties, circumstance bonuses, and circumstance penalties affect you\.$/,
    /^Any successes and critical successes you roll on (Fortitude|Reflex|Will) saves are failures\.?$/
];
const SIZES = { Tiny: "tiny", Small: "sm", Medium: "med", Large: "lg", Huge: "huge" };
const seconds = (value, unit) => Number(value) * (unit === "hours" ? 3600 : 60);

/** Returns {plantForm, claimed} or null. */
export function compilePlantForm(adapted) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim()) return null;
    if (!(adapted.activation?.traits ?? []).includes("polymorph")) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const list = /<ul>([\s\S]*?)<\/ul>\s*$/i.exec(html);
    if (!list || /<hr/i.test(html)) return null;
    const lead = htmlToPlainText(html.slice(0, list.index)).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const substance = EITHER.exec(lead[0] ?? "")?.[1];
    if (lead.length !== 3 || !substance || WHILE.exec(lead[1])?.[1] !== substance || !DISMISS.test(lead[2])) return null;
    const items = [...list[1].matchAll(/<li>\s*<strong>([^<]+)<\/strong>([\s\S]*?)<\/li>/gi)].map(match => ({ name: match[1].trim(),
        sentences: htmlToPlainText(match[2].replace(/<\/?em>/g, "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean) }));
    const merge = items.find(item => /^Merge with (?:Plants|Stone)$/.test(item.name)), tree = items.find(item => /^Turn into an? (?:Plant|Stone)$/.test(item.name));
    if (items.length !== 2 || !merge || !tree || merge.sentences.length !== MERGE.length || tree.sentences.length !== TREE.length) return null;
    const m = MERGE.map((pattern, index) => pattern.exec(merge.sentences[index])), t = TREE.map((pattern, index) => pattern.exec(tree.sentences[index]));
    if (m.some(match => !match) || t.some(match => !match)) return null;
    return {
        plantForm: {
            immobilized: true, notes: [lead[1]], substance,
            modes: {
                merge: { name: merge.name, durationSeconds: seconds(m[0][1], m[0][2]), blinded: true, expel: { formula: m[3][1], sourceText: m[3][0] }, passage: m[4][0],
                    notes: [m[1][0], m[5][0]] },
                // (A plant gains the plant trait; the text gives a stone none.)
                tree: { name: tree.name, durationSeconds: seconds(t[0][1], t[0][2]), size: SIZES[t[1][1]], ac: Number(t[4][1]), worse: { statistic: t[5][1].toLowerCase() }, traits: substance === "plant" ? ["plant"] : [],
                    notes: [t[2][0], t[3][0], "Only status and circumstance bonuses and penalties affect you (PF2e's battle form)."] }
            }
        },
        claimed: [...lead, ...merge.sentences, ...tree.sentences]
    };
}
