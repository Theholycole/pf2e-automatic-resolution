// Damage PF2e's item doesn't define, stated exactly by the text (user decision 2026-09-27): a basic save whose item has no
// damage entry, where the text gives the dice, the types chosen between and the heightening. The compiler reads the spell as if
// its item had one untyped entry of those dice (so the ordinary basic-save compilers judge it); the card rolls the stated formula
// at the cast rank, of the chosen type, and notes that PF2e's item has no damage entry.
import { htmlToPlainText } from "./description-parser.js";

const FORMS = [
    {   // "You deal your choice of 1d6 bludgeoning or 1d6 slashing damage to all creatures in the area, with a basic Fortitude save."
        pattern: /^You deal your choice of (\d+)d(\d+) ([a-z]+) or \1d\2 ([a-z]+) damage to all creatures in the area, with a basic (Fortitude|Reflex|Will) save\.$/,
        read: match => ({ dice: Number(match[1]), die: Number(match[2]), types: [match[3], match[4]], statistic: match[5].toLowerCase(), chooser: "caster" }),
        // "A creature large enough to be in more than one of the bursts takes damage only once." — each creature saves once.
        after: [/^A creature large enough to be in more than one of the bursts takes damage only once\.$/]
    },
    {   // "The animal or swarm assaults all creatures in the area, dealing 2d6 damage. The damage is either bludgeoning, piercing, or
        // slashing based on the animal that was conjured, as determined by the GM." (the save is the item's basic save)
        pattern: /^The animal or swarm assaults all creatures in the area, dealing (\d+)d(\d+) damage\. The damage is either ([a-z]+), ([a-z]+), or ([a-z]+) based on the animal that was conjured, as determined by the GM\.$/,
        joined: 2,
        read: match => ({ dice: Number(match[1]), die: Number(match[2]), types: [match[3], match[4], match[5]], statistic: null, chooser: "gm" }),
        after: [/^After their attacks, the animals return to your deity's plane\.$/]
    },
    {   // "The gaze deals 1d4 damage (basic Fortitude save). It deals your choice of cold damage or fire damage and gains the appropriate
        // trait. If you already dealt damage to the creature earlier this turn, it also takes 1 persistent damage of the gaze's type
        // (@Damage[(@item.rank)[cold,persistent]]{…} or @Damage[(@item.rank)[fire,persistent]]{…})." with "Heightened (+1) The initial
        // damage increases by 1d4 and persistent damage by 1.": the persistent damage when the caster says the condition holds.
        pattern: /^The [a-z]+ deals (\d+)d(\d+) damage \(basic (Fortitude|Reflex|Will) save\)\. It deals your choice of ([a-z]+) damage or ([a-z]+) damage and gains the appropriate trait\. If you (already dealt damage to the creature earlier this turn), it also takes (\d+) persistent damage of the [a-z]+'s type \(@Damage\[\(@item\.rank\)\[([a-z]+),persistent\]\]\{[^}]+\} or @Damage\[\(@item\.rank\)\[([a-z]+),persistent\]\]\{[^}]+\}\)\.$/,
        joined: 3,
        read: match => (match[4] === match[8] && match[5] === match[9] ? { dice: Number(match[1]), die: Number(match[2]), types: [match[4], match[5]], statistic: match[3].toLowerCase(),
            chooser: "caster", persistent: { condition: match[6], amount: Number(match[7]) } } : null),
        heightened: /<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The initial damage increases by (\d+)d(\d+) and persistent damage by (\d+)\.\s*<\/p>/i,
        after: []
    },
    {   // A list of types (Shadow Blast, rewritten): "You deal 6d8 damage of one type you choose (acid, bludgeoning, …) to all creatures in the
        // area, with a basic Reflex save."
        pattern: /^You deal (\d+)d(\d+) damage of one type you choose \(([a-z]+(?:, [a-z]+)+)\) to all creatures in the area, with a basic (Fortitude|Reflex|Will) save\.$/,
        read: match => ({ dice: Number(match[1]), die: Number(match[2]), types: match[3].split(", "), statistic: match[4].toLowerCase(), chooser: "caster" }),
        after: []
    }
];
const HEIGHTENED = /<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The damage increases by (\d+)d(\d+)\.\s*<\/p>/i;
const RULE_WORDS = /\d|@|\b(?:damage|save|bonus|penalty|condition|can't|must|each|whenever|until|immune|fail\w*|succe\w*|prone|push\w*|pull\w*|knock\w*)\b/i;

// Retributive Pain: "Trigger A creature in range damages you." / "The target takes mental damage equal to half the triggering damage." (the
// item's basic save): the damage is half what the creature just dealt the caster (the card reads the caster's last damage taken).
const TRIGGER_DAMAGED = /^Trigger A creature in range damages you\.$/;
const HALF_TRIGGERING = /^The target takes ([a-z]+) damage equal to half the triggering damage\.$/;

function triggeredTextDamage(adapted, html) {
    if (!/^reaction$/i.test(String(adapted.activation?.time ?? "").trim()) || !/^the triggering creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const [trigger, body, ...extra] = html.split(/<hr\s*\/?>/i);
    if (extra.length || !TRIGGER_DAMAGED.test(htmlToPlainText(trigger ?? "").replace(/\s+/g, " ").trim())) return null;
    const sentences = htmlToPlainText(body ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const half = HALF_TRIGGERING.exec(sentences.at(-1) ?? "");
    if (!half || sentences.slice(0, -1).some(sentence => RULE_WORDS.test(sentence))) return null;
    const statistic = adapted.defense.statistic;
    return {
        component: { id: "text-damage", formula: "1d4", type: "untyped", category: null, applyModifier: false, kinds: ["damage"], materials: [] },
        html: `<p>You deal 1d4 damage to all creatures in the area, with a basic ${statistic[0].toUpperCase()}${statistic.slice(1)} save.</p>`,
        triggered: { fraction: 0.5, type: half[1], source: "caster-last-damage", sourceText: half[0] },
        sourceText: half[0], claimed: [htmlToPlainText(trigger).trim(), ...sentences],
        note: `PF2e's item has no damage entry; the damage is half the triggering damage (“${half[0]}”), from the caster's last damage taken.`
    };
}

export function compileTextDamage(adapted) {
    if (adapted?.defense?.kind !== "save" || adapted.defense.basic !== true || (adapted.damageComponents ?? []).length) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const triggered = triggeredTextDamage(adapted, html);
    if (triggered) return triggered;
    // Everything before the Heightened block (a Requirements line can sit before its own rule).
    const cut = html.search(/<p>\s*<strong>\s*Heightened/i);
    const base = (cut < 0 ? html : html.slice(0, cut)).replace(/<hr\s*\/?>\s*$/i, "");
    const sentences = htmlToPlainText(base).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const hits = [];
    for (const form of FORMS) for (let index = 0; index < sentences.length; index++) {
        const joined = sentences.slice(index, index + (form.joined ?? 1)).join(" ");
        const match = form.pattern.exec(joined);
        const read = match ? form.read(match) : null;
        if (read) hits.push({ form, index, length: form.joined ?? 1, text: joined, ...read });
    }
    if (hits.length !== 1) return null;
    const [hit] = hits;
    if (new Set(hit.types).size !== hit.types.length || (hit.statistic && hit.statistic !== adapted.defense.statistic)) return null;
    const statistic = hit.statistic ?? adapted.defense.statistic;
    // After the damage, only the form's own closing sentences; before it, only narration (no numbers, links or rule words).
    const after = sentences.slice(hit.index + hit.length);
    if (after.some(sentence => !hit.form.after.some(pattern => pattern.test(sentence)))) return null;
    const before = sentences.slice(0, hit.index);
    if (before.some(sentence => RULE_WORDS.test(sentence))) return null;
    const heightened = (hit.form.heightened ?? HEIGHTENED).exec(html);
    const heightenedBlocks = (html.match(/<strong>\s*Heightened/gi) ?? []).length;
    if (heightenedBlocks > (heightened ? 1 : 0) || (heightened && Number(heightened[3]) !== hit.die)) return null;
    // The persistent amount is the rank ("(@item.rank)"): it must be the stated amount at the spell's rank, rising 1 a rank.
    const baseRankValue = Number(adapted.rank) || 1;
    if (hit.persistent && (hit.persistent.amount !== baseRankValue || !heightened || Number(heightened[1]) !== 1 || Number(heightened[4]) !== 1)) return null;
    const { dice, die } = hit;
    const canonical = `You deal ${dice}d${die} damage to all creatures in the area, with a basic ${statistic[0].toUpperCase()}${statistic.slice(1)} save.`;
    // (The vetted narration is left out of what the basic-save compilers read.)
    const rewritten = `<p>${canonical}</p>${cut < 0 ? "" : `<hr />${html.slice(cut)}`}`;
    const baseRank = Number(adapted.rank) || 1;
    const formula = heightened
        ? `(${dice}+floor((@item.rank - ${baseRank})/${Number(heightened[1])})*${Number(heightened[2])})d${die}[untyped]`
        : `${dice}d${die}[untyped]`;
    return {
        component: { id: "text-damage", formula: `${dice}d${die}`, type: "untyped", category: null, applyModifier: false, kinds: ["damage"], materials: [] },
        html: rewritten, formula, types: hit.types, chooser: hit.chooser, sourceText: hit.text,
        claimed: [hit.text, ...after, ...before],
        ...(hit.persistent ? { persistent: { question: `Is this true: you ${hit.persistent.condition}? If so, it also takes persistent damage of the chosen type equal to the spell's rank.`,
            formula: "(@item.rank)", sourceText: hit.text } } : {}),
        note: `PF2e's item has no damage entry; the damage is read from the text (“${hit.text}”${heightened ? `, heightened: ${htmlToPlainText(heightened[0]).trim()}` : ""}).${hit.chooser === "gm" ? " The GM picks the type by the animal." : ""}${after.some(sentence => /only once/.test(sentence)) ? " Each creature takes it once, even in both bursts." : ""}`
    };
}
