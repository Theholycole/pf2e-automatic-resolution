// A melee spell attack whose damage type and extra effect depend on a form the caster picks (Threefold Limb):
//   "Make a melee spell attack roll. On a hit, the target takes 2d6 damage; the type of damage dealt and any additional effect depends on
//   the form you choose. On a critical hit, double the damage." with a list of forms:
//   "Ice The limb deals cold damage, and the target takes a –10-foot status penalty to its Speeds until the start of your next turn. This
//   spell gains the cold trait." (+ PF2e's Effect) / "Liquid Water The limb deals bludgeoning damage and you can Reposition the target up to
//   10 feet." / "Steam The limb deals fire damage and steam clings to the target, making all creatures Concealed to them until the start of
//   your next turn or they perform an Interact action to wave the steam away. This spell gains the fire trait."
// The attack is the ordinary one-sentence form of the text's damage (PF2e's item has none), typed by the form picked when casting; on a
// hit the form's extra applies: PF2e's Effect (proved), the caster's Reposition (a reminder), or a note Effect on the target.
import { htmlToPlainText } from "./description-parser.js";

const ATTACK = /^Make a melee spell attack roll\.$/;
const HIT = /^On a hit, the target takes (\d+)d(\d+) damage; the type of damage dealt and any additional effect depends on the form you choose\.$/;
const CRIT = /^On a critical hit, double the damage\.$/;
const TYPES = new Set(["acid", "bludgeoning", "cold", "electricity", "fire", "force", "mental", "piercing", "poison", "slashing", "sonic", "spirit", "vitality", "void"]);
const DEALS = /^The [a-z]+ deals ([a-z]+) damage,? and (.+?)\.$/;
const SPEED = /^the target takes a [–−-](\d+)-foot (status|circumstance) penalty to its Speeds until the start of your next turn$/;
const REPOSITION = /^you can (?:@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{Reposition\}|Reposition) the target up to (\d+) feet$/;
const CLINGS = /^([a-z]+) clings to the target, making all creatures (?:@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Concealed\}|Concealed) to them until the start of your next turn or they perform an Interact action to [a-z ]+ away$/;
const TRAIT = /^This spell gains the ([a-z]+) trait\.$/;
const EFFECT_LINK = /^@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}$/;
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The damage increases by (\d+)d(\d+)\.\s*<\/p>$/;

/** {html, component, formula, options, choiceLabel, links, claimed, note} or null. */
export function extractOptionAttack(adapted) {
    if (!adapted.activation?.traits?.includes("attack") || (adapted.damageComponents ?? []).length || adapted.defense?.kind !== "none" || adapted.targeting?.area) return null;
    if (!/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const cut = html.search(/<hr\b[^>]*>\s*<p>\s*<strong>\s*Heightened\b/i);
    const base = cut < 0 ? html : html.slice(0, cut), rest = cut < 0 ? "" : html.slice(cut);
    const list = /<ul>([\s\S]*?)<\/ul>/i.exec(base);
    if (!list || htmlToPlainText(base.slice(list.index + list[0].length)).trim()) return null;
    const lead = htmlToPlainText(base.slice(0, list.index)).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = lead.findIndex(sentence => ATTACK.test(sentence));
    if (at < 0 || lead.length !== at + 3 || !HIT.test(lead[at + 1]) || !CRIT.test(lead[at + 2])) return null;
    if (lead.slice(0, at).some(sentence => /\d|@|\b(?:damage|save|bonus|penalty|condition)\b/i.test(sentence))) return null;
    const [, dice, die] = HIT.exec(lead[at + 1]);
    const options = {}, links = [], claimed = [...lead];
    for (const [, item] of list[1].matchAll(/<li>([\s\S]*?)<\/li>/gi)) {
        const name = /^\s*(?:<p>\s*)?<strong>\s*([A-Z][A-Za-z ]+?)\s*<\/strong>/.exec(item)?.[1];
        if (!name) return null;
        const body = htmlToPlainText(item.replace(/^\s*(?:<p>\s*)?<strong>[^<]*<\/strong>/, "")).split(/(?<=[.!?}])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
        const deals = DEALS.exec(body[0] ?? "");
        if (!deals || !TYPES.has(deals[1]) || options[name.toLowerCase()]) return null;
        const option = { name, type: deals[1], sourceText: `${name}: ${body.join(" ")}` };
        const extra = deals[2];
        let speed, reposition, clings;
        if ((speed = SPEED.exec(extra))) option.speedEffect = { value: -Number(speed[1]), type: speed[2], claimText: `The target takes a -${speed[1]}-foot ${speed[2]} penalty to its Speeds until the start of your next turn.` };
        else if ((reposition = REPOSITION.exec(extra))) option.reminder = `${name}: on a hit, you can Reposition the target up to ${reposition[1]} feet (the module doesn't move it).`;
        else if ((clings = CLINGS.exec(extra))) option.note = { label: `${name}: all creatures concealed to it`, text: `${clings[1][0].toUpperCase()}${clings[1].slice(1)} clings to this creature: all creatures are concealed to it (DC 5 flat check to target them) until the start of the caster's next turn. It ends early if the creature uses an Interact action to wave it away (delete this Effect).` };
        else return null;
        for (const sentence of body.slice(1)) {
            const trait = TRAIT.exec(sentence);
            if (trait && trait[1] === deals[1] && !option.trait) { option.trait = trait[1]; continue; }
            if (EFFECT_LINK.test(sentence) && option.speedEffect && !option.link) { option.link = sentence; links.push({ option: name.toLowerCase(), link: sentence }); continue; }
            return null;
        }
        if (option.speedEffect && !option.link) return null;
        options[name.toLowerCase()] = option;
        claimed.push(option.sourceText);
    }
    if (Object.keys(options).length < 2) return null;
    const heightened = rest.match(/<p>\s*<strong>\s*Heightened[\s\S]*?<\/p>/gi) ?? [];
    const step = heightened.length === 1 ? HEIGHTENED.exec(heightened[0].trim()) : null;
    if (heightened.length !== (step ? 1 : 0) || (step && step[3] !== die)) return null;
    const baseRank = Number(adapted.rank) || 1;
    const formula = step ? `(${dice}+floor((@item.rank - ${baseRank})/${step[1]})*${step[2]})d${die}[untyped]` : `${dice}d${die}[untyped]`;
    return {
        // (The forms' Effect links go after the heightening, outside the attack's own text; the forms below bind them.)
        html: `<p>${lead.slice(0, at).join(" ")} Make a melee spell attack roll against the target. On a hit, the target takes ${dice}d${die} untyped damage (double damage on a critical hit).</p>${rest}${links.map(entry => `<p>${entry.link}</p>`).join("")}`,
        component: { id: "text-damage", formula: `${dice}d${die}`, type: "untyped", category: null, applyModifier: false, kinds: ["damage"], materials: [] },
        formula, options, choiceLabel: "Form", links, claimed,
        note: `PF2e's item has no damage entry; the damage is read from the text (“${lead[at + 1]}”), of the type the chosen form deals.`
    };
}
