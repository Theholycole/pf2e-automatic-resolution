// A spell's damage the module builds from its text (the PF2e item has none, or not that): rolled as PF2e spell damage, so the caster's spell-damage rules
// apply as they do to PF2e's own (a FlatModifier on spell-damage, DamageDice, an AdjustModifier) — the spell features audit, batch F1, 2026-10-05.
// The text's formula becomes a copy of the spell with that damage, at the cast rank; PF2e's getDamage builds the roll. Null when the formula isn't one it
// can carry (the caller then rolls the formula as before).

/** "(50)" → "50", but "(a)+(b)" is left alone: the outer brackets only when they enclose the whole. */
function unwrap(text) {
    if (!/^\(.*\)$/.test(text)) return text;
    let depth = 0;
    for (let index = 0; index < text.length; index++) {
        if (text[index] === "(") depth++;
        else if (text[index] === ")") { depth--; if (depth === 0 && index < text.length - 1) return text; }
    }
    return text.slice(1, -1);
}

/** "{A[type],B[persistent,type]}" or "A[type]": [{formula, type, category}] or null. */
export function damagePools(formula) {
    const text = String(formula ?? "").trim();
    const inner = /^\{(.*)\}$/.exec(text)?.[1] ?? text;
    const pools = [];
    let depth = 0, start = 0;
    for (let index = 0; index <= inner.length; index++) {
        const character = inner[index];
        if (character === "(" || character === "[" || character === "{") depth++;
        else if (character === ")" || character === "]" || character === "}") depth--;
        if ((character === "," && depth === 0) || index === inner.length) { pools.push(inner.slice(start, index).trim()); start = index + 1; }
    }
    const read = pools.map(pool => {
        const match = /^(.+)\[([a-z]+(?:,[a-z]+)?)\]$/.exec(pool);
        if (!match) return null;
        const [category, type] = match[2].includes(",") ? match[2].split(",") : [null, match[2]];
        if (category && category !== "persistent") return null;
        const expression = unwrap(match[1].trim());
        return { formula: expression, type, category: category ?? null };
    });
    return read.length && read.every(Boolean) ? read : null;
}

/** A formula with its rank written in and each dice count worked out: "(2+floor((@item.rank - 3)/2)*1)d10" at 4th → "2d10" (null when it can't be). */
export function plainDice(formula, rank) {
    let text = String(formula).replace(/@item\.(?:rank|level)/g, String(rank));
    if (/@/.test(text)) return null;
    const count = expression => { if (!/^[\d\s+\-*/().,a-z]*$/i.test(expression) || /\bd\d/.test(expression)) return null;
        try { const value = Function("floor", "ceil", "min", "max", `return (${expression});`)(Math.floor, Math.ceil, Math.min, Math.max); return Number.isFinite(value) ? Math.trunc(value) : null; } catch (_) { return null; } };
    // ("(expr)dN": the count; a flat "(expr)" whole: its value.)
    for (let at = text.search(/\)d\d/); at >= 0; at = text.search(/\)d\d/)) {
        let depth = 0, open = -1;
        for (let index = at; index >= 0; index--) { if (text[index] === ")") depth++; else if (text[index] === "(") { depth--; if (depth === 0) { open = index; break; } } }
        const n = open >= 0 ? count(text.slice(open + 1, at)) : null;
        if (n == null) return null;
        text = `${text.slice(0, open)}${n}${text.slice(at + 1)}`;
    }
    if (!/d\d/.test(text)) { const n = count(text); return n == null ? null : String(n); }
    return /\(/.test(text) ? null : text;
}

/** The text's damage as PF2e spell damage at the cast rank: { roll, context } (an unevaluated DamageRoll) or null. */
export async function textSpellDamage(spell, formula, { castRank } = {}) {
    const pools = damagePools(formula);
    if (!pools || !spell?.actor || typeof spell.toObject !== "function") return null;
    // ("0[mental]": no damage to build.)
    if (pools.every(pool => /^0+$/.test(pool.formula))) return null;
    try {
        const source = spell.toObject();
        source._id = spell.id ?? source._id;
        // (PF2e reads plain dice: "(2+floor((@item.rank - 3)/2)*1)d10" at the cast rank is "2d10".)
        const rank = Number(castRank ?? spell.rank);
        const plain = pools.map(pool => ({ ...pool, formula: plainDice(pool.formula, rank) }));
        if (plain.some(pool => !pool.formula)) return null;
        source.system.damage = Object.fromEntries(plain.map((pool, index) => [`text${index}`, { formula: pool.formula, type: pool.type, category: pool.category, materials: [], kinds: ["damage"] }]));
        source.system.heightening = null;
        foundry.utils.setProperty(source, "system.location.heightenedLevel", Number(castRank ?? spell.rank));
        const copy = new CONFIG.Item.documentClass(source, { parent: spell.actor });
        const prepared = await copy.getDamage({ skipDialog: true });
        const roll = prepared?.template?.damage?.roll ?? null;
        return roll ? { roll, context: prepared.context ?? null } : null;
    } catch (error) {
        console.warn("pf2e-automatic-resolution | The text's damage couldn't be built as PF2e spell damage; rolling its formula.", error);
        return null;
    }
}
