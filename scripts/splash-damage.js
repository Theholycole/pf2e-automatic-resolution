// Splash damage from a spell attack. PF2e rolls the splash entry inside the
// spell's damage roll: a same-type splash entry becomes a "[splash]" term of
// that instance ("(1d6 + 1[splash])[acid]"); another type becomes its own
// instance ("(1d4[splash])[sonic]"). PF2e's alter(2) doubles the whole roll,
// but splash damage isn't doubled on a critical hit. So the rolled totals are
// split into splash and non-splash parts, and each recipient gets a new roll
// with those fixed numbers:
//   the target: the non-splash part × the row's multiplier, plus the splash once
//     (added together before resistances and weaknesses);
//   each other creature within 5 feet: the splash only.

function flavors(term) {
    return String(term?.options?.flavor ?? "").split(",").map(value => value.trim()).filter(Boolean);
}

/** The splash total inside one evaluated term tree; throws on a shape it can't read. */
function splashTotal(term, inherited = false) {
    if (!term) return 0;
    const splash = inherited || flavors(term).includes("splash");
    // Grouping "( … )" and a flavored group
    if (term.term) return splashTotal(term.term, splash);
    // ArithmeticExpression: only a sum can be split
    if (Array.isArray(term.operands)) {
        const parts = term.operands.map(operand => splashTotal(operand, splash));
        if (parts.some(Boolean) && term.operator !== "+") throw new Error("Splash damage inside a non-additive expression can't be separated.");
        return parts.reduce((total, value) => total + value, 0);
    }
    if (!splash) return 0;
    const total = Number(term.total);
    if (!Number.isFinite(total)) throw new Error("A splash term has no evaluated total.");
    return total;
}

/** Each instance of an evaluated PF2e DamageRoll as {type, persistent, direct, splash}. */
export function splashParts(roll) {
    if (!roll?._evaluated || !Array.isArray(roll.instances)) throw new Error("An evaluated PF2e DamageRoll is required for splash damage.");
    return roll.instances.map(instance => {
        const total = Number(instance.total);
        const splash = splashTotal(instance.head ?? instance.terms?.[0]);
        if (!Number.isFinite(total) || splash > total) throw new Error("The splash damage can't be separated from the roll.");
        return { type: instance.type, persistent: instance.persistent === true, direct: total - splash, splash };
    });
}

/**
 * The fixed-number formula a recipient takes: the non-splash part × multiplier plus the splash
 * (or the splash only). Persistent instances are refused (none of the splash spells have one).
 */
export function splashFormula(parts, { multiplier = 1, splashOnly = false } = {}) {
    if (![1, 2].includes(multiplier)) throw new Error("Splash damage supports a hit or a critical hit only.");
    if (parts.some(part => part.persistent)) throw new Error("Splash damage with a persistent instance isn't supported.");
    const pieces = parts.flatMap(part => {
        const direct = splashOnly ? 0 : part.direct * multiplier;
        const terms = [direct ? String(direct) : null, part.splash ? `${part.splash}[splash]` : null].filter(Boolean);
        return terms.length ? [`(${terms.join(" + ")})[${part.type}]`] : [];
    });
    return pieces.length ? `{${pieces.join(",")}}` : null;
}

/** The evaluated PF2e DamageRoll for a recipient, or null when it takes nothing. */
export async function splashDamageRoll(parts, options, DamageRoll = (globalThis.CONFIG?.Dice?.rolls ?? []).find(type => type?.name === "DamageRoll")) {
    const formula = splashFormula(parts, options);
    if (!formula) return null;
    if (!DamageRoll) throw new Error("PF2e's DamageRoll is unavailable.");
    const roll = new DamageRoll(formula);
    await roll.evaluate();
    return roll;
}
