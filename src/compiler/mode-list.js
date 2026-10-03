// Creature-kind mode lists: a healing entry and a damage entry chosen by the
// kind of creature touched, each a PF2e variant, sharing one linked Effect.
//   <ul><li><strong>Willing Living Creature</strong> The target regains 6 Hit Points. If the target is someone
//     other than yourself, it also gains a +2 status bonus to AC for 1 round.</li>
//   <li><strong>Undead Creature</strong> The target takes 1d6 vitality damage with a basic Fortitude save; on a
//     failure, the target also takes a –2 status penalty to AC for 1 round.</li></ul>
//   @UUID[…]{Spell Effect: Lay on Hands}
// The variant's item data picks its entry (healing only: the healing entry; damage with a basic save: the
// damage entry). The entry's Effect clause is applied only when the Effect's own rules give exactly the
// stated modifier to that recipient (self or not, undead or not; see effect-modifier-proof.js), and only to
// the recipient the clause names: yourself, someone other than yourself, or (on a failed save) the target.
import { htmlToPlainText } from "./description-parser.js";
import { effectModifiers, isOneRoundEffect } from "../../scripts/effect-modifier-proof.js";

const HEAD = /^(Willing )?(Living|Undead) Creature$/;
const LINK = /@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}/g;
const STAT = { "AC": "ac", "damage rolls": "damage", "attack rolls": "attack-roll", "saving throws": "saving-throw" };
const MODIFIER = String.raw`an? ([+-]\d+) (status|circumstance) (?:bonus|penalty) to (AC|damage rolls|attack rolls|saving throws) for 1 round`;
const HEALS = /^The target regains (\d+(?:d\d+)?(?:\+\d+)?) Hit Points\.$/;
const SELF_CLAUSE = new RegExp(String.raw`^If the target is (someone other than yourself|yourself), (?:it|you) also gains? ${MODIFIER}\.$`);
const DAMAGE = new RegExp(String.raw`^The target takes (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save(?:; on a failure, the target also takes ${MODIFIER})?\.$`);
const RULE_WORDS = /\d|\b(?:damage|save|bonus|penalty|Hit Points|round|condition|immune)\b/i;

function claim(sign, type, stat) {
    return { selector: STAT[stat], type, value: Number(sign) };
}

function parse(html) {
    const text = String(html ?? "");
    const list = /<ul>\s*((?:<li>[\s\S]*?<\/li>\s*){2})<\/ul>/i.exec(text);
    if (!list || (text.match(/<ul\b/gi) ?? []).length !== 1) return null;
    const entries = [...list[1].matchAll(/<li>([\s\S]*?)<\/li>/gi)].map(([, body]) => {
        const head = /^\s*(?:<p>)?\s*<strong>([^<]+)<\/strong>/i.exec(body);
        return head ? { head: HEAD.exec(head[1].trim()), text: htmlToPlainText(body.slice(head[0].length)).replace(/–/g, "-").replace(/\s+/g, " ").trim() } : null;
    });
    if (entries.length !== 2 || entries.some(entry => !entry?.head)) return null;
    // Around the list: narration only, the Effect link, and (optionally) the heightening entry.
    const links = text.match(LINK) ?? [];
    const outside = text.replace(list[0], " ").split(/<hr\b/i);
    const rest = htmlToPlainText(outside[0].replace(LINK, " ")).replace(/\s+/g, " ").trim();
    const after = outside.slice(1).join(" ").replace(LINK, " ");
    if (links.length !== 1 || RULE_WORDS.test(rest) || !/^(?:\s*[^>]*>\s*<p>\s*<strong>Heightened \(\+1\)<\/strong>[^<]*<\/p>)?\s*(?:<p>\s*<\/p>\s*)*$/i.test(after)) return null;
    return { entries, link: links[0] };
}

/**
 * Rewrites a mode-list variant into its route's canonical text (direct healing or a basic save) and
 * returns the Effect clause to attach. Null for anything outside the grammar.
 */
export function compileModeList(adapted, nativeEffects) {
    const grammar = parse(adapted.descriptionHTML);
    if (!grammar) return null;
    const traits = new Set(adapted.activation?.traits ?? []);
    const energy = traits.has("vitality") && !traits.has("void") ? "vitality" : traits.has("void") && !traits.has("vitality") ? "void" : null;
    if (!energy) return null;
    const [healedKind, harmedKind] = energy === "vitality" ? ["Living", "Undead"] : ["Undead", "Living"];
    const healEntry = grammar.entries.find(entry => entry.head[2] === healedKind);
    const harmEntry = grammar.entries.find(entry => entry.head[2] === harmedKind);
    if (!healEntry || !harmEntry || !healEntry.head[1]) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const component = components[0], formula = String(component.formula).replace(/\s+/g, "");
    const kinds = JSON.stringify(component.kinds ?? []);
    const effect = (nativeEffects.unscoped ?? []).length === 1 && (nativeEffects.onUse ?? []).length === 0 ? nativeEffects.unscoped[0] : null;
    if (!effect || effect.sourceText !== grammar.link || effect.resolutionStatus !== "resolved" || !isOneRoundEffect(effect.document?.mechanics)) return null;
    const side = kind => kind === "Living" ? { kind: "living-creature" } : { kind: "undead-or-void-healing" };
    const proofFor = (context, modifier, claimText) => {
        const actual = effectModifiers({ name: effect.document.name, rules: effect.document.mechanics.rules }, context);
        return actual && JSON.stringify(actual) === JSON.stringify([modifier])
            ? { kind: "text-modifier", context, modifiers: [modifier], claimText } : null;
    };
    const evidence = { energy, sourceText: htmlToPlainText(adapted.descriptionHTML).replace(/\s+/g, " ").trim() };
    const rest = String(adapted.descriptionHTML).split(/(?=<hr\b)/i).slice(1).join("").replace(LINK, "");

    // Healing variant: the healing entry, with its Effect for yourself or for someone else.
    if (kinds === JSON.stringify(["healing"]) && adapted.defense?.kind === "none") {
        const [first, ...clauses] = healEntry.text.split(/(?<=\.)\s+(?=[A-Z])/);
        const heals = HEALS.exec(first);
        if (!heals || heals[1] !== formula || clauses.length > 1) return null;
        const self = clauses.length ? SELF_CLAUSE.exec(clauses[0]) : null;
        if (clauses.length && !self) return null;
        const constraints = { sourceText: `1 ${healEntry.head[0].toLowerCase()}`, supportsActorTargets: true, complete: true, predicates: [side(healedKind)] };
        const base = { mode: "healing", html: `<p>The target regains ${component.formula} Hit Points.</p>${rest}`, constraints, evidence };
        if (!self) return { ...base, effect: null };
        const recipientCondition = self[1] === "yourself" ? "self" : "not-self";
        const proof = proofFor({ self: recipientCondition === "self", undead: healedKind === "Undead" }, claim(self[2], self[3], self[4]), clauses[0]);
        return proof ? { ...base, effect: { entry: effect, recipientCondition, proof } } : null;
    }
    // Damage variant: the damage entry with a basic save, its Effect on a failed save (never on yourself).
    const basicSave = adapted.defense?.kind === "save" && adapted.defense.basic === true;
    if (kinds === JSON.stringify(["damage"]) && basicSave) {
        const damage = DAMAGE.exec(harmEntry.text);
        if (!damage || damage[1] !== formula || damage[2] !== String(component.type).toLowerCase() || damage[2] !== energy
            || damage[3].toLowerCase() !== adapted.defense.statistic) return null;
        const constraints = { sourceText: `1 ${harmEntry.head[0].toLowerCase()}`, supportsActorTargets: true, complete: true, predicates: [side(harmedKind)] };
        const base = { mode: "damage", html: `<p>You deal ${component.formula} ${energy} damage to the target (basic ${damage[3]} save).</p>${rest}`, constraints, evidence };
        if (!damage[4]) return { ...base, effect: null };
        const proof = proofFor({ self: false, undead: harmedKind === "Undead" }, claim(damage[4], damage[5], damage[6]),
            `on a failure, the target also takes a ${damage[4]} ${damage[5]} penalty to ${damage[6]} for 1 round`);
        return proof ? { ...base, effect: { entry: effect, recipientCondition: "not-self", proof, degrees: ["failure", "criticalFailure"] } } : null;
    }
    return null;
}
