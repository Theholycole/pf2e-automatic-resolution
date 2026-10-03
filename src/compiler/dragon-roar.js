// A roar that frightens enemies and impresses dragons (Roar of the Dragon): "You channel the might of dragons into your voice, … The impressive roar grants
// you a +2 circumstance bonus to Diplomacy checks for 10 minutes against dragons that were in the area at the time of casting." with PF2e's Effect,
// then "Roar of the dragon affects non-dragon creatures with deep ties to dragonkind … as if they had the dragon trait. The GM decides if a creature
// is aligned enough with dragonkind to be affected in this way. All enemies within the area other than dragons must attempt a Will save; to these
// enemies, roar of the dragon is a fear effect." and the Frightened rows: the enemies' save (dragons left out; the GM leaves out dragon-tied ones);
// PF2e's Effect on the caster once per cast, with a toggle for "against a dragon that was in the area".
import { htmlToPlainText } from "./description-parser.js";
import { casterRowEffectMatches } from "./caster-row-effect.js";

const GRANT = /^The impressive roar grants you an? \+(\d) (circumstance|status) bonus to ([A-Z][a-z]+) checks for (\d+) (minute|hour)s? against ([a-z]+)s that were in the area at the time of casting\.$/;
const TIES = /^[A-Z][a-z ]+ affects non-([a-z]+) creatures with deep ties to [a-z]+kind \([^)]+\) as if they had the \1 trait\. The GM decides if a creature is aligned enough with [a-z]+kind to be affected in this way\.$/;
const WHO = /^All enemies within the area other than ([a-z]+)s must attempt a (Fortitude|Reflex|Will) save; to these enemies, [a-z ]+ is a fear effect\.$/;

/** {html, effect, reminder, sentences} or null. */
export function rewriteDragonRoar(adapted, { catalog = null } = {}) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || !adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 3) return null;
    const link = /^@UUID\[(Compendium\.pf2e\.spell-effects\.Item\.([^\]]+))\]\{[^}]+\}$/.exec(paragraphs[1]);
    const first = htmlToPlainText(paragraphs[0]).split(/(?<=[.!?])\s+(?=[A-Z@])/), third = htmlToPlainText(paragraphs[2]).split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const grant = GRANT.exec(first.at(-1) ?? ""), ties = TIES.exec(third.slice(0, 2).join(" ")), who = WHO.exec(third[2] ?? "");
    if (!link || first.length !== 2 || /\d|@/.test(first[0]) || !grant || third.length !== 3 || !ties || !who || ties[1] !== grant[6] || who[1] !== grant[6]
        || who[2].toLowerCase() !== adapted.defense.statistic) return null;
    const entry = catalog?.get?.(link[2]);
    // (The area option is the Effect's own predicate term beside the trait: read from PF2e, not from the spell's name.)
    const predicate = (entry?.mechanics?.rules ?? [])[0]?.predicate ?? [];
    const option = Array.isArray(predicate) && predicate.length === 2 && predicate[0] === `target:trait:${grant[6]}` && typeof predicate[1] === "string" ? predicate[1] : null;
    const claim = { kind: "cast", skill: grant[3].toLowerCase(), type: grant[2], value: Number(grant[1]), trait: grant[6], option,
        duration: { value: Number(grant[4]), unit: `${grant[5]}s` } };
    if (!entry?.mechanics || !casterRowEffectMatches(entry.mechanics, claim)) return null;
    return {
        html: `<p>All enemies in the area other than ${who[1]}s must attempt a ${who[2]} save.</p><hr />${table}`,
        effect: { kind: "cast", degrees: ["criticalSuccess", "success", "failure", "criticalFailure"], uuid: link[1], reference: entry.name ?? link[2],
            document: { id: entry.id ?? null, name: entry.name, type: entry.type ?? "effect", mechanics: structuredClone(entry.mechanics) }, ...claim, claimText: grant[0],
            toggleLabel: `Against a ${grant[6]} that was in the area when the spell was cast` },
        exclude: grant[6],
        reminder: { kind: "spell-note", text: `Creatures with deep ties to ${grant[6]}kind count as ${grant[6]}s (the GM decides): leave them out of the save.`, sourceText: third.slice(0, 2).join(" ") },
        sentences: [first[1], third.slice(0, 2).join(" "), third[2]]
    };
}
