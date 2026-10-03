// A sustained emanation around the caster whose Effect each creature gets as it begins its turn inside, by the caster's tradition (Manifest
// Will; user decision "build it properly"):
//   "You are Concealed from creatures beyond the edge of the emanation but can't use that concealment to Hide. Any creature that begins its turn
//   in the emanation is affected based on your patron's tradition." with PF2e's "Aura: X" (on the caster) and "Spell Effect: X" (a tradition
//   choice and one rule per tradition) and a list: Arcane (weakness to spell damage for 1 round), Divine (a living or undead creature gains
//   temporary Hit Points for 1 round), Occult (an allied creature has Lesser Cover while inside and for 1 round after it leaves), Primal (a
//   –10-foot status penalty to all its Speeds for 1 round or until it Escapes).
// Casting puts PF2e's Aura on the caster and starts an Ongoing record on the emanation; at the start of each creature's turn inside (the
// caster's too), PF2e's Spell Effect is applied with the caster's tradition, to the creatures the list names; Primal's ends on an Escape
// against the spell DC. The caster's concealment from outside is a GM note.
import { htmlToPlainText } from "./description-parser.js";
import { proveEffectNote } from "./effect-note-proof.js";

const BEGINS = /^Any creature that begins its turn in the emanation is affected based on your patron's tradition\.$/;
const CONCEALED = /^You are @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Concealed\} from creatures beyond the edge of the emanation but can't use that concealment to (?:@UUID\[[^\]]+\]\{Hide\}|Hide)\.$/;
const ITEMS = {
    arcane: /A creature that begins its turn in the emanation gains weakness (\d+) to spell damage for 1 round\./,
    divine: /A living or undead creature that begins its turn in the emanation gains (\d+) temporary Hit Points for 1 round\./,
    occult: /An allied creature that begins its turn in the emanation has @UUID\[(Compendium\.pf2e\.other-effects\.Item\.[A-Za-z0-9]+)\]\{Lesser Cover\} while inside the emanation, and for 1 round after it leaves\./,
    primal: /A creature that begins its turn in the emanation has a [–-](\d+)-foot status penalty to all its Speeds for 1 round or until it (?:@UUID\[[^\]]+\]\{Escapes\}|Escapes)\./
};

/** Returns {auraTurnEffect, claimed} or null. */
// A burning aura around the caster (Unblinking Flame Ignition): "Any creature who starts their turn within 5 feet of you takes @Damage[1d12[fire]] damage." with
// PF2e's Effect proved for the rest of the text (the senses, the fly Speed, Quickened — its extra action's limit a note): the Effect on the caster, and an
// emanation on the caster that deals the damage to each other creature as its turn starts (no save).
const BURN = /\s*Any creature who starts their turn within (\d+) feet of you takes @Damage\[(\d+d\d+|\d+)\[([a-z]+)\]\] damage\./;
const QUICK_LIMIT = /, and you can use the extra action each round only to ([A-Z][a-z]+) or (?:@UUID\[[^\]]+\]\{([A-Z][a-z]+)\}|([A-Z][a-z]+)) using your flames\./;
export function compileIgnitionAura(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim()) return null;
    const rounds = /^(\d+) rounds?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const html = String(adapted.descriptionHTML ?? "");
    const burn = BURN.exec(html), limit = QUICK_LIMIT.exec(html);
    const linked = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    if (!rounds || !burn || !limit || linked.length !== 1 || linked[0].resolutionStatus !== "resolved" || /<strong>\s*Heightened/i.test(html)) return null;
    const proof = proveEffectNote({ ...adapted, descriptionHTML: html.replace(burn[0], "").replace(limit[0], ".") }, { heightened: [] }, linked[0].document);
    if (globalThis.process?.env?.PROOF_DEBUG && !proof) console.error("ignition aura: the Effect isn't proved");
    if (!proof || proof.claims.some(claim => claim.recipient && claim.recipient.actor !== "source")) return null;
    return { auraTurnEffect: { ignition: true, casterEffect: { uuid: linked[0].uuid, label: linked[0].label ?? linked[0].document?.name }, area: { type: "emanation", value: Number(burn[1]) },
            durationSeconds: Number(rounds[1]) * 6, damage: { formula: `${burn[2]}[${burn[3]}]`, excludeCaster: true },
            notes: [`You can use Quickened's extra action only to ${limit[1]} or ${limit[2] ?? limit[3]} using your flames.`] },
        claimed: [htmlToPlainText(burn[0]).trim(), ...proof.claims.map(claim => claim.sentence)] };
}

export function compileAuraTurnEffect(adapted, nativeSpellEffects) {
    const ignition = compileIgnitionAura(adapted, nativeSpellEffects);
    if (ignition) return ignition;
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "none" || area?.type !== "emanation" || adapted.lifecycle?.sustained !== true || (adapted.damageComponents ?? []).length) return null;
    const links = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    const aura = links.find(entry => /^Aura: /.test(entry.document?.name ?? entry.label ?? "") && (entry.document?.mechanics?.rules ?? []).some(rule => rule.key === "Aura"));
    const effect = links.find(entry => entry !== aura && /^Spell Effect: /.test(entry.document?.name ?? entry.label ?? ""));
    if (links.length !== 2 || !aura || !effect || aura.resolutionStatus !== "resolved" || effect.resolutionStatus !== "resolved") return null;
    const rules = effect.document?.mechanics?.rules ?? [];
    const choice = rules.find(rule => rule.key === "ChoiceSet");
    if (!choice || JSON.stringify((choice.choices ?? []).map(entry => entry.value)) !== '["arcane","divine","occult","primal"]' || !choice.rollOption) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const plain = htmlToPlainText(html);
    const lead = htmlToPlainText(html.split(/<p>\s*@UUID/)[0]).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const begins = lead.find(sentence => BEGINS.test(sentence)), concealed = lead.find(sentence => CONCEALED.test(sentence));
    if (!begins || !concealed || lead.length !== 3) return null;
    const found = Object.fromEntries(Object.entries(ITEMS).map(([key, pattern]) => [key, pattern.exec(plain)]));
    if (Object.values(found).some(match => !match)) return null;
    const option = value => `${choice.rollOption}:${value}`;
    const ruleFor = value => rules.find(rule => JSON.stringify(rule.predicate) === JSON.stringify([option(value)]));
    // Each list item is the Effect's rule for that tradition (at rank 1; the Heightened entry raises arcane and divine by the rank).
    const weakness = ruleFor("arcane"), temp = ruleFor("divine"), cover = ruleFor("occult"), speed = ruleFor("primal");
    if (!(weakness?.key === "Weakness" && weakness.type === "spells" && weakness.value === "@item.level" && Number(found.arcane[1]) === 1)) return null;
    if (!(temp?.key === "TempHP" && temp.value === "2*@item.level" && Number(found.divine[1]) === 2)) return null;
    if (!(cover?.key === "GrantItem" && cover.uuid === found.occult[1])) return null;
    if (!(speed?.key === "FlatModifier" && speed.selector === "all-speeds" && speed.type === "status" && speed.value === -Number(found.primal[1]))) return null;
    const heightened = /<strong>\s*Heightened \(\+1\)\s*<\/strong>\s*An arcane manifestation increases its weakness by 1 and a divine manifestation increases its temporary Hit Points by 2\./.test(html);
    if ((html.match(/<strong>\s*Heightened/gi) ?? []).length !== (heightened ? 1 : 0)) return null;
    return {
        auraTurnEffect: {
            aura: { uuid: aura.uuid, label: aura.label ?? aura.document?.name }, effect: { uuid: effect.uuid, label: effect.label ?? effect.document?.name, choiceRuleIndex: rules.indexOf(choice) },
            recipients: { arcane: "any", divine: "living-or-undead", occult: "allies", primal: "any" }, escapeEnds: ["primal"],
            area: { type: "emanation", value: Number(area.value) }, durationSeconds: Number(/^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? ""))?.[1] ?? 0) * 60,
            gmNotes: ["The caster is Concealed from creatures beyond the emanation's edge (not to Hide).", "Occult: the ally keeps Lesser Cover for 1 round after leaving; it's renewed at the start of each of its turns inside."]
        },
        claimed: [begins, concealed, ...Object.values(found).map(match => match[0])]
    };
}
