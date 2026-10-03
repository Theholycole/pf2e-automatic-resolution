// Extra damage for creatures with a trait: "The water deals an additional
// @Damage[((@item.level*2)-2)d6[spirit]] damage to creatures with the unholy
// trait in the area." Only an inline roll is accepted (it carries its own
// heightening); its formula may read only the cast rank. The extra damage is
// rolled once for the cast and scaled like the spell's shared damage for each
// target that has the trait.

const SENTENCE = /(?:(?<=^)|(?<=<p>)|(?<=[.!?]\s))(?:The [a-z]+|It|This spell) deals an additional @Damage\[([^\[\]]+\[([a-z]+)\])\] damage to (?:creatures|each creature|targets|each target) with the ([a-z-]+) trait(?: in the area)?\./g;

// "If the target has the holy trait, you deal an extra 5d6 spirit damage." — fixed dice; any heightening is
// read from the Heightened entry ("… the spirit damage against holy creatures increases by 2d6").
// (Moonlight Ray: "The ray deals 5d6 cold damage; if the target has the unholy trait, you deal an extra 5d6 spirit damage." — after a semicolon.)
const STATIC = /(?:(?:(?<=^)|(?<=<p>)|(?<=[.!?]\s))If|(?<=;\s)if) the target has the ([a-z-]+) trait, you deal an extra (\d+)d(\d+) ([a-z]+) damage\./g;

function staticConditional(html, { rank, heightening }) {
    const found = [...String(html ?? "").matchAll(STATIC)];
    if (found.length !== 1 || !Number.isInteger(rank)) return null;
    const [sentence, trait, count, faces, type] = found[0];
    const heightened = String(html).split(/<strong>\s*Heightened\b/i).slice(1).join(" ").replace(/<[^>]+>/g, " ");
    const increase = new RegExp(String.raw`\bthe ${type} damage(?: against [a-z ]+)? increases by (\d+)d${faces}\b`, "i").exec(heightened);
    let formula = `${count}d${faces}[${type}]`;
    if (increase) {
        // Only the item's own fixed-interval heightening can scale it.
        const interval = heightening?.type === "interval" ? Number(heightening.interval) : null;
        if (!Number.isInteger(interval) || interval < 1) return null;
        const steps = interval === 1 ? `(@item.rank - ${rank})` : `floor((@item.rank - ${rank})/${interval})`;
        formula = `(${count}+${increase[1]}*${steps})d${faces}[${type}]`;
    } else if (/<strong>\s*Heightened\b/i.test(html) && new RegExp(String.raw`\b${type} damage\b`, "i").test(heightened)) return null; // mentioned, but not in a form we read
    return { conditionalDamage: [{ formula, damageType: type, trait: trait.toLowerCase(), sourceText: sentence }], sentence };
}

// A clause of the damage sentence: "… dealing 8d10 cold damage to all creatures in the area, plus an additional
// @Damage[(@item.rank+1)d10[vitality]] damage to undead creatures." The clause is taken out of the description (the
// rest of the sentence is the spell's damage) and becomes the trait's extra damage.
const CLAUSE = /, plus an additional @Damage\[([^\[\]]+\[([a-z]+)\])\] damage to ([a-z-]+) creatures(?= in the area\.|\.)/g;
// "… each creature in the area takes 7d6 spirit damage; creatures with the holy trait take an additional @Damage[10[spirit]]
// damage." — the same extra damage, after a semicolon.
const SEMICOLON_CLAUSE = /; creatures with the ([a-z-]+) trait take an additional @Damage\[([^\[\]]+\[([a-z]+)\])\] damage(?=\.)/g;

export function extractConditionalClause(html) {
    const found = [...[...String(html ?? "").matchAll(CLAUSE)].map(match => [match[0], match[1], match[2], match[3]]),
        ...[...String(html ?? "").matchAll(SEMICOLON_CLAUSE)].map(match => [match[0], match[2], match[3], match[1]])];
    if (found.length !== 1) return null;
    const [clause, formula, type, trait] = found[0];
    // "living" isn't a trait; only a creature trait gates the damage.
    if (trait === "living" || [...formula.matchAll(/@([a-z0-9_.-]+)/gi)].some(match => !["item.rank", "item.level"].includes(match[1].toLowerCase()))) return null;
    if (/persistent|,/.test(formula.match(/\[([^\]]+)\]$/)?.[1] ?? "")) return null;
    return { html: String(html).replace(clause, ""), conditional: { conditionalDamage: [{ formula, damageType: type, trait, sourceText: clause.replace(/^[,;]\s*/, "") }], sentence: clause } };
}

export function compileConditionalDamage(html, options = {}) {
    const found = [...String(html ?? "").matchAll(SENTENCE)];
    if (!found.length) return staticConditional(html, options);
    if (found.length !== 1) return null;
    const [sentence, formula, type, trait] = found[0];
    if ([...formula.matchAll(/@([a-z0-9_.-]+)/gi)].some(match => !["item.rank", "item.level"].includes(match[1].toLowerCase()))) return null;
    if (/persistent|,/.test(formula.match(/\[([^\]]+)\]$/)?.[1] ?? "")) return null;
    return { conditionalDamage: [{ formula, damageType: type, trait: trait.toLowerCase(), sourceText: sentence }], sentence };
}

