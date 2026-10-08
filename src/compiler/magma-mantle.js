// PF2e's Effect for a lava form of two picked abilities, one swapped on a Sustain (Mantle of the Magma Heart): "… Upon Casting this Spell, pick two of the options
// below. You can Sustain this spell once per round to change one of your chosen abilities to a different option." with "Enlarging Eruption … until you grow to
// Large size. You're {Clumsy 1}. Your reach increases by 5 feet (by 10 feet if you started out Tiny), and you gain a +2 status bonus to melee damage. You can't
// choose this option if you're already Large or larger.", "Fiery Grasp … Your lava fists deal 1d8 bludgeoning damage as their base damage, plus an additional 2d6
// fire damage and 1d6 persistent fire damage.", "Heart of Fire … any creature that touches you, or that hits you with a melee unarmed attack or non-reach melee
// weapon attack, takes @Damage[2d6[fire]] damage." and "Warming Flames … You gain resistance 5 to cold and fire." — PF2e's Effect (each option proved against its
// rules) with the picks its choices; the text's Clumsy and reach added to Enlarging Eruption; Heart of Fire's damage the card's control for the creature that
// touched or hit; the swap the card's (the option-mantle runtime).
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_UUID_START as C, SPELL_EFFECT_LINK as LINK } from "./text-patterns.js";

const PICK = /^Upon Casting this Spell, pick (two) of the options below\.$/;
const SWAP = /^You can Sustain this spell once per round to change one of your chosen abilities to a different option\.$/;
const OPTIONS = {
    "enlarging-eruption": [/^You erupt in lava, which clings to you and hardens, causing your body to swell and burst until you grow to Large size\.$/, new RegExp(String.raw`^You're ${C}Clumsy (\d)\}\.$`),
        /^Your reach increases by (\d+) feet \(by (\d+) feet if you started out Tiny\), and you gain a \+(\d) status bonus to melee damage\.$/, /^You can't choose this option if you're already Large or larger\.$/],
    "fiery-grasp": [/^Your hands swell and grow with lava\.$/, /^You gain a lava fist unarmed attack in the brawling weapon group\.$/,
        /^Your lava fists deal (\d+)d(\d+) ([a-z]+) damage as their base damage, plus an additional (\d+)d(\d+) ([a-z]+) damage and (\d+)d(\d+) persistent ([a-z]+) damage\.$/],
    "heart-of-fire": [/^Your body's temperature becomes so hot that any creature that touches you, or that hits you with a melee unarmed attack or non-reach melee weapon attack, takes @Damage\[(\d+)d(\d+)\[([a-z]+)\]\] damage\.$/],
    "warming-flames": [/^Flames flicker around you, warming away the cold while protecting you from the heat\.$/, /^You gain resistance (\d+) to ([a-z]+) and ([a-z]+)\.$/]
};

/** {optionMantle, claimed} or null; the catalog proves PF2e's Effect. */
export function compileMagmaMantle(adapted, catalog) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const html = String(adapted.descriptionHTML ?? "");
    if (!minutes || /<hr/i.test(html)) return null;
    const list = /<ul>([\s\S]*?)<\/ul>/.exec(html);
    const intro = /^\s*<p>([\s\S]*?)<\/p>\s*<ul>/.exec(html);
    const link = [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => LINK.exec(match[1].trim())).find(Boolean);
    if (!list || !intro || !link) return null;
    const split = text => htmlToPlainText(text).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const lead = split(intro[1]);
    const pick = lead.findIndex(sentence => PICK.test(sentence));
    if (pick < 1 || pick !== lead.length - 2 || !SWAP.test(lead.at(-1)) || lead.slice(0, pick).some(sentence => /\d|@|\b(?:damage|save|bonus|penalty)\b/.test(sentence))) return null;
    const items = [...list[1].matchAll(/<li>\s*(?:<p>\s*)?<strong>([^<]+)<\/strong>\s*([\s\S]*?)(?:<\/p>\s*)?<\/li>/g)];
    const read = {};
    for (const item of items) {
        const slug = item[1].trim().toLowerCase().replace(/[^a-z]+/g, "-");
        const patterns = OPTIONS[slug], sentences = split(item[2]);
        if (!patterns || read[slug] || sentences.length !== patterns.length || patterns.some((pattern, index) => !pattern.test(sentences[index]))) return null;
        read[slug] = sentences.map((sentence, index) => patterns[index].exec(sentence));
    }
    if (Object.keys(read).length !== Object.keys(OPTIONS).length) return null;
    const entries = catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {});
    const effect = entries.find(entry => entry?.name === link[2]);
    const rules = effect?.mechanics?.rules ?? [];
    const slots = rules.map((rule, index) => rule.key === "RollOption" && Array.isArray(rule.suboptions) ? index : -1).filter(index => index >= 0);
    const names = slots.map(index => rules[index].option);
    const picked = value => rule => JSON.stringify(rule.predicate ?? []).includes(`:${value}`);
    const find = (key, value, test = () => true) => rules.find(rule => rule.key === key && picked(value)(rule) && test(rule));
    const e = read["enlarging-eruption"], f = read["fiery-grasp"][2], h = read["heart-of-fire"][0], w = read["warming-flames"][1];
    const sameOptions = slots.length === 2 && slots.every(index => JSON.stringify(rules[index].suboptions.map(option => option.value).sort()) === JSON.stringify(Object.keys(OPTIONS).sort()));
    const size = rules.findIndex(rule => rule.key === "CreatureSize" && picked("enlarging-eruption")(rule));
    const strike = find("Strike", "fiery-grasp");
    const dice = rules.filter(rule => rule.key === "DamageDice");
    const fire = dice.find(rule => !rule.category && rule.damageType === f[6]), persistent = dice.find(rule => rule.category === "persistent" && rule.damageType === f[9]);
    const resist = type => Number(rules.find(rule => rule.key === "Resistance" && rule.type === type && picked("warming-flames")(rule))?.value);
    if (!effect?.id || !sameOptions || size < 0 || rules[size].value !== "large" || rules[size].reach || Number(find("FlatModifier", "enlarging-eruption")?.value) !== Number(e[2][3])
        || find("FlatModifier", "enlarging-eruption").selector !== "melee-strike-damage" || rules.some(rule => rule.key === "GrantItem")
        || strike?.group !== "brawling" || Number(strike.damage?.base?.dice) !== Number(f[1]) || strike.damage.base.die !== `d${f[2]}` || strike.damage.base.damageType !== f[3]
        || Number(fire?.diceNumber) !== Number(f[4]) || fire.dieSize !== `d${f[5]}` || Number(persistent?.diceNumber) !== Number(f[7]) || persistent.dieSize !== `d${f[8]}`
        || resist(w[2]) !== Number(w[1]) || resist(w[3]) !== Number(w[1]) || !rules.some(rule => rule.key === "RollOption" && rule.option === "self:heart-of-fire")) return null;
    const or = value => ({ or: names.map(name => `${name}:${value}`) });
    return { optionMantle: { seconds: Number(minutes[1]) * 60, effect: { uuid: `Compendium.pf2e.spell-effects.Item.${effect.id}`, name: effect.name }, slots, picks: 2, swapTrait: "Sustain",
            options: items.map(item => ({ value: item[1].trim().toLowerCase().replace(/[^a-z]+/g, "-"), label: item[1].trim() })),
            // (The text over PF2e's data: Enlarging Eruption's reach and Clumsy.)
            ruleOverrides: [{ index: size, key: "CreatureSize", patch: { reach: { add: Number(e[2][1]) } } }],
            ruleAdditions: [{ key: "GrantItem", uuid: e[1][1], onDeleteActions: { grantee: "restrict" }, predicate: [or("enlarging-eruption")] }],
            sizeLimit: { option: "enlarging-eruption", below: "lg" },
            retaliation: { option: "heart-of-fire", formula: `${h[1]}d${h[2]}`, type: h[3], trigger: "touched it, or hit it with a melee unarmed attack or a non-reach melee weapon attack" },
            notes: [`Enlarging Eruption: the reach increases by ${e[2][2]} feet instead if you started out Tiny.`, "Swapping an ability is a Sustain (once per round)."] },
        claimed: [...lead, ...Object.values(read).flat().map(match => htmlToPlainText(match[0])), link[0]] };
}
