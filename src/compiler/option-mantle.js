// PF2e's Effect for a form of two picked abilities that can be swapped (Mantle of the Unwavering Heart): "… Upon Casting this Spell, pick two of the options below.
// As a single action, which has the concentrate trait, you can change one of your chosen abilities to a different option from the list." with the options
// ("Evergreen Vitality You gain fast healing 3 and a +2 bonus to saves against poison and disease. …" / "Overwhelming Perfume (aura, olfactory) … @Template[emanation|
// distance:15]. Creatures in the aura can't benefit from the scent ability and are {Sickened 1} as long as they remain in the aura. …" / "Towering Trunk … Increase
// your size to Large. You're {Clumsy 1}. Your reach increases by 5 feet (or by 10 feet if you started out Tiny), and you gain a grasping branch unarmed attack; this
// attack is in the brawling weapon group and deals @Damage[2d8[bludgeoning]] damage plus Grab." / "Unyielding Will … You're immune to being {Fascinated}, and you get
// a +1 bonus to saves and DCs against mental effects.") — PF2e's Effect (each option proved against its rules) with the two picks set as its choices; the card's
// control swaps one; its Grab note keyed to the picks (PF2e's names an option that doesn't exist); the rest notes.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_UUID_START as C, SPELL_EFFECT_LINK as LINK } from "./text-patterns.js";

const LEAD = [/^Upon Casting this Spell, pick (two) of the options below\.$/, /^As a single action, which has the ([a-z]+) trait, you can change one of your chosen abilities to a different option from the list\.$/];
const OPTIONS = {
    "evergreen-vitality": [/^You gain fast healing (\d+) and a \+(\d) bonus to saves against poison and disease\.$/, /^This effect has the healing and vitality traits\.$/],
    "overwhelming-perfume": [/^A cloud of potent floral scent surrounds you in a @Template\[emanation\|distance:(\d+)\]\.$/,
        new RegExp(String.raw`^Creatures in the aura can't benefit from the scent ability and are ${C}Sickened (\d)\} as long as they remain in the aura\.$`), /^The sickness is a disease effect\.$/],
    "towering-trunk": [/^You grow to a considerable height\.$/, /^Increase your size to Large\.$/, new RegExp(String.raw`^You're ${C}Clumsy (\d)\}\.$`),
        /^Your reach increases by (\d+) feet \(or by (\d+) feet if you started out Tiny\), and you gain a grasping branch unarmed attack; this attack is in the brawling weapon group and deals @Damage\[(\d+)d(\d+)\[([a-z]+)\]\] damage plus Grab\.$/],
    "unyielding-will": [/^Your mind becomes incredibly resilient to change\.$/, new RegExp(String.raw`^You're immune to being ${C}Fascinated\}, and you get a \+(\d) bonus to saves and DCs against mental effects\.$`)]
};

/** {optionMantle, claimed} or null; the catalog proves PF2e's Effect. */
export function compileOptionMantle(adapted, catalog) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const html = String(adapted.descriptionHTML ?? "");
    if (!minutes || /<hr/i.test(html)) return null;
    const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const link = paragraphs.map(paragraph => LINK.exec(paragraph)).find(Boolean);
    const list = /<ul>([\s\S]*?)<\/ul>/.exec(html);
    if (!link || !list || paragraphs.length !== 2) return null;
    const split = text => htmlToPlainText(text).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const lead = split(paragraphs[0]);
    if (lead.length !== 3 || /\d|@|\b(?:damage|save|bonus|penalty)\b/.test(lead[0]) || !LEAD[0].test(lead[1]) || !LEAD[1].test(lead[2])) return null;
    const items = [...list[1].matchAll(/<li>\s*<strong>([^<]+)<\/strong>\s*(?:\(([a-z, ]+)\)\s*)?([\s\S]*?)<\/li>/g)];
    const read = {};
    for (const item of items) {
        const slug = item[1].trim().toLowerCase().replace(/[^a-z]+/g, "-");
        const patterns = OPTIONS[slug];
        const sentences = split(item[3]);
        if (!patterns || read[slug] || sentences.length !== patterns.length || patterns.some((pattern, index) => !pattern.test(sentences[index]))) return null;
        read[slug] = sentences.map((sentence, index) => patterns[index].exec(sentence));
    }
    if (Object.keys(read).length !== Object.keys(OPTIONS).length) return null;
    // PF2e's Effect: its two choices list the four options; each option's rules are the text's numbers.
    const entries = catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {});
    const effect = entries.find(entry => entry?.name === link[2]);
    const rules = effect?.mechanics?.rules ?? [];
    const slots = rules.map((rule, index) => rule.key === "RollOption" && Array.isArray(rule.suboptions) ? index : -1).filter(index => index >= 0);
    const names = slots.map(index => rules[index].option);
    const picked = value => rule => JSON.stringify(rule.predicate ?? []).includes(`:${value}`);
    const find = (key, value, test = () => true) => rules.find(rule => rule.key === key && picked(value)(rule) && test(rule));
    const v = read["evergreen-vitality"], p = read["overwhelming-perfume"], t = read["towering-trunk"], u = read["unyielding-will"];
    const sameOptions = slots.length === 2 && slots.every(index => JSON.stringify(rules[index].suboptions.map(option => option.value).sort()) === JSON.stringify(Object.keys(OPTIONS).sort()));
    const aura = find("Aura", "overwhelming-perfume"), strike = find("Strike", "towering-trunk");
    const auraEffect = aura ? entries.find(entry => (aura.effects ?? []).some(link => link.uuid === `Compendium.pf2e.spell-effects.Item.${entry?.id}`)) : null;
    const grant = (auraEffect?.mechanics?.rules ?? []).find(rule => rule.key === "GrantItem");
    const note = rules.findIndex(rule => rule.key === "Note" && rule.text === "PF2E.BattleForm.Note.Grab");
    if (!effect?.id || !sameOptions || Number(find("FastHealing", "evergreen-vitality")?.value) !== Number(v[0][1])
        || Number(find("FlatModifier", "evergreen-vitality", rule => JSON.stringify(rule.predicate).includes("item:trait:poison"))?.value) !== Number(v[0][2])
        || Number(aura?.radius) !== Number(p[0][1]) || grant?.uuid !== p[1][1] || find("CreatureSize", "towering-trunk")?.value !== "large" || Number(find("CreatureSize", "towering-trunk")?.reach?.add) !== Number(t[3][1])
        || find("GrantItem", "towering-trunk")?.uuid !== t[2][1] || strike?.damage?.base?.damageType !== t[3][5] || Number(strike.damage.base.dice) !== Number(t[3][3]) || strike.damage.base.die !== `d${t[3][4]}` || strike.group !== "brawling"
        || find("Immunity", "unyielding-will")?.type !== "fascinated" || Number(find("FlatModifier", "unyielding-will")?.value) !== Number(u[1][2]) || note < 0) return null;
    const or = { or: names.map(name => `${name}:towering-trunk`) };
    return { optionMantle: { seconds: Number(minutes[1]) * 60, effect: { uuid: `Compendium.pf2e.spell-effects.Item.${effect.id}`, name: effect.name }, slots, picks: 2, swapTrait: LEAD[1].exec(lead[2])[1],
            options: Object.keys(OPTIONS).map(value => ({ value, label: items.find(item => item[1].trim().toLowerCase().replace(/[^a-z]+/g, "-") === value)[1].trim() })),
            ruleOverrides: [{ index: note, key: "Note", patch: { predicate: [or] } }],
            notes: [`Towering Trunk: the reach increases by ${t[3][2]} feet instead if you started out Tiny.`, "Overwhelming Perfume: creatures in the aura can't benefit from the scent ability; the sickness is a disease effect.", "Evergreen Vitality has the healing and vitality traits."] },
        claimed: [...lead, ...Object.values(read).flat().map(match => htmlToPlainText(match[0])), link[0]] };
}
