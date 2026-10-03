// An emanation on the caster giving the caster and allies inside PF2e's Effect, with a critical-save rider (Frenzied Revelry):
//   "You and your allies gain a +1 status bonus to saving throws against mental effects while in the area." / "Whenever someone benefiting from
//   this bonus critically succeeds at a saving throw against an enemy's mental effect, its revelry increases, granting it a +1 status bonus to
//   attack rolls and damage rolls for 1 round." with "Heightened (4th) The emanation's radius is 10 feet, and the status bonus to saves is +2."
//   (and 7th) and PF2e's Effect (the save bonus by rank, and a Note on a critical success against an enemy's mental effect).
// Casting starts a lingering record centred on the caster for the duration: the caster and each ally inside hold PF2e's Effect, lost on
// leaving (the radius from the rank). When a holder critically succeeds at a save against an enemy's mental effect, PF2e's critical Effect
// (the +1 to attacks and damage for 1 round) goes on it. PF2e's modifier is on Will saves only; the module's Effect puts it on every save.
import { htmlToPlainText } from "./description-parser.js";

const BONUS = /^You and your allies gain a \+(\d) status bonus to saving throws against ([a-z]+) effects while in the area\.$/;
const CRITICAL = /^Whenever someone benefiting from this bonus critically succeeds at a saving throw against an enemy's ([a-z]+) effect, its [a-z]+ increases, granting it a \+(\d) status bonus to attack rolls and damage rolls for (\d+) rounds?\.$/;
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>\s*The emanation's radius is (\d+) feet, and the status bonus to saves is \+(\d)\.\s*<\/p>$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|rounds?|minutes?)\b/i;

/** Returns {allyAura, claimed} or null. */
export function compileAllyAura(adapted, nativeSpellEffects) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || area?.type !== "emanation" || adapted.lifecycle?.sustained) return null;
    if (!/^you and allies in the area$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const links = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    if (!minutes || links.length !== 1 || links[0].resolutionStatus !== "resolved") return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].trim());
    if (paragraphs.length !== 2 || !/^@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}$/.test(paragraphs[1]) || rest.length > 1) return null;
    const sentences = htmlToPlainText(`<p>${paragraphs[0]}</p>`).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => BONUS.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 2 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const bonus = BONUS.exec(sentences[at]), critical = CRITICAL.exec(sentences[at + 1]);
    if (!critical || critical[1] !== bonus[2]) return null;
    // Heightened: fixed ranks, each a radius and a bonus.
    const steps = [{ rank: Number(adapted.rank ?? 1), radius: Number(area.value), bonus: Number(bonus[1]) }];
    const entries = rest.length ? [...rest[0].matchAll(/<p>[\s\S]*?<\/p>/gi)].map(match => match[0].trim()) : [];
    for (const entry of entries) {
        const raised = HEIGHTENED.exec(entry);
        if (!raised) return null;
        steps.push({ rank: Number(raised[1]), radius: Number(raised[2]), bonus: Number(raised[3]) });
    }
    // PF2e's Effect: the bonus by rank (its ternary must give each step's value), and the critical-success Note.
    const rules = links[0].document?.mechanics?.rules ?? links[0].document?.rules ?? [];
    const flat = rules.find(rule => rule.key === "FlatModifier"), note = rules.find(rule => rule.key === "Note");
    if (rules.length !== 2 || !flat || !note || flat.type !== "status" || JSON.stringify(flat.predicate) !== JSON.stringify([`item:trait:${bonus[2]}`])) return null;
    if (!["will", "saving-throw"].includes(flat.selector) || !steps.every(step => bonusAt(flat.value, step.rank) === step.bonus)) return null;
    if (JSON.stringify(note.outcome) !== '["criticalSuccess"]' || JSON.stringify([...(note.predicate ?? [])].sort()) !== JSON.stringify([`item:trait:${bonus[2]}`, "origin:enemy"].sort())) return null;
    const effectName = links[0].label ?? links[0].reference;
    return {
        allyAura: {
            effect: { uuid: links[0].uuid, label: effectName }, trait: bonus[2], steps, durationSeconds: Number(minutes[1]) * 60,
            critical: { uuid: `Compendium.pf2e.spell-effects.Item.${effectName} (Critical)`, label: `${effectName} (Critical)`, bonus: Number(critical[2]), rounds: Number(critical[3]) },
            // "saving throws against mental effects": PF2e's modifier is on Will only; the module's Effect puts it on every save (user decision).
            ...(flat.selector === "will" ? { ruleOverrides: [{ index: rules.indexOf(flat), key: "FlatModifier", patch: { selector: "saving-throw" } }] } : {})
        },
        claimed: [...sentences, ...entries.map(entry => htmlToPlainText(entry).trim())]
    };
}

/** PF2e's `ternary(gte(@item.level,N),A,…)` value at a rank (a plain number stays). */
export function bonusAt(value, rank) {
    if (Number.isFinite(Number(value))) return Number(value);
    let text = String(value).replace(/\s+/g, "");
    for (let depth = 0; depth < 5; depth++) {
        const match = /^ternary\(gte\(@item\.(?:level|rank),(\d+)\),(\d+),(.+)\)$/.exec(text);
        if (!match) return Number.isFinite(Number(text)) ? Number(text) : null;
        if (Number(rank) >= Number(match[1])) return Number(match[2]);
        text = match[3];
    }
    return null;
}

/** The step (radius and bonus) at a cast rank. */
export function allyAuraStep(aura, castRank) {
    return [...aura.steps].sort((left, right) => left.rank - right.rank).filter(step => step.rank <= Number(castRank)).at(-1) ?? aura.steps[0];
}
