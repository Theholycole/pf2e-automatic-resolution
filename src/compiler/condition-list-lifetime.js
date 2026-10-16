// Clause-scoped grammar for coordinated condition grants such as
// "is Stunned 1, and enfeebled 2 for 1 round, and Immobilized for 1 round or
// until it Escapes, whichever comes first". Each list item owns the lifetime
// written directly after it. An item without its own lifetime shares the next
// written lifetime in the same list ("dazzled and Enfeebled 1 for 1 minute").
// A valued Stunned condition is self-limiting by PF2e rule and never borrows a
// timer. The proof is positional, so a lifetime or Escape clause cannot leak to
// a condition outside its own list run.

export const PF2E_CONDITION_NAMES = Object.freeze([
    "blinded", "clumsy", "concealed", "confused", "controlled", "cursebound", "dazzled", "deafened",
    "doomed", "drained", "dying", "encumbered", "enfeebled", "fascinated", "fatigued", "fleeing",
    "frightened", "grabbed", "hidden", "immobilized", "invisible", "observed", "off-guard", "paralyzed",
    "persistent-damage", "petrified", "prone", "quickened", "restrained", "sickened", "slowed",
    "stunned", "stupefied", "unconscious", "undetected", "unnoticed", "wounded"
]);

const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const UNIT = "rounds?|minutes?|hours?|days?|weeks?";
const LINK = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[^\]]+\]\{[^}]+\}`;
const PLAIN = PF2E_CONDITION_NAMES.filter(name => name !== "persistent-damage")
    .map(name => name.replace("-", "[- ]")).join("|");
// A plain (unlinked) name counts only in grant position: followed by a value,
// a lifetime, a list separator or the clause end. "drained away" and
// "controlled by you" are prose, not condition grants.
const PLAIN_ITEM = String.raw`\b(?:${PLAIN})(?:\s+\d+)?(?=\s*(?:[,.;]|$)|\s+(?:and|or|for|until|unless|permanently)\b|\s+by\s+(?:the|a|an)\s)`;
const ITEM = String.raw`(?:${LINK}(?:\s+\d+)?|${PLAIN_ITEM})`;
const TIMER = String.raw`\s+for\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:${UNIT})\b`
    + String.raw`|\s+until\s+(?:the\s+)?(?:start|beginning|end)\s+of\s+(?:its|their|your|the target's|the creature's)\s+(?:next\s+)?turn\b`
    + String.raw`|\s+until\s+(?:its|their|your|the target's|the creature's)\s+(?:next\s+)?turn\s+(?:begins?|starts?|ends?)\b`
    + String.raw`|\s+permanently\b`;
const SUBJECT = String.raw`(?:it|they|the target|the creature)`;
const ESCAPE_DC = String.raw`(?:\s+\((?:against your spell DC|the DC is your spell DC|the Escape DC is your spell DC|with a DC equal to your spell DC)\)|\s+against your spell DC|\s+with an Escape DC equal to your spell DC)`;
const SPELL_ENDS = String.raw`(?:\s+or\s+(?:until\s+)?the spell ends)`;
// Escape may be plain text, a PF2e action link, or an inline /act escape.
// (Or the shadow taken back with a Grapple against the spell DC: Tenebrous Freedom's rewritten rows, PF2e 8.6 — "until it Grapples against your spell DC".)
const ESCAPE_WORD = String.raw`(?:@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.SkZAQRkLLkmBQNB9\]\{Escapes?\}|\[\[/act escape\]\]\{Escapes?\}|Escapes?|Grapples(?= against your spell DC))`;
const ESCAPE = String.raw`(?:(?:,)?\s+or\s+until\s+${SUBJECT}\s+(?:successfully\s+)?${ESCAPE_WORD}|\s+until\s+${SUBJECT}\s+(?:successfully\s+)?${ESCAPE_WORD}|\s+unless\s+${SUBJECT}\s+${ESCAPE_WORD}|,\s+(?:but|though)\s+${SUBJECT}\s+can\s+attempt\s+to\s+${ESCAPE_WORD})${ESCAPE_DC}?(?:,\s+whichever comes first)?`;
// The creature's own Interact action ends the condition ("until it uses an
// Interact action to wipe its eyes"; "though it can Interact to ... and remove
// the condition"). The purpose phrase is short flavor bounded by punctuation.
const PURPOSE = String.raw`(?:\s+to\s+[a-z' ]{1,40}?(?=[,.;]|$)|(?=[,.;]|$))`;
// (Or "until they Interact to clear their vision": Unending Tears, PF2e 8.6.)
const ACTION_END = String.raw`(?:(?:,)?\s+or\s+until\s+${SUBJECT}\s+uses?\s+an\s+Interact\s+action${PURPOSE}|\s+until\s+${SUBJECT}\s+uses?\s+an\s+Interact\s+action${PURPOSE}|\s+until\s+${SUBJECT}\s+Interacts?${PURPOSE}|,\s+though\s+${SUBJECT}\s+can\s+Interact\s+to\s+[a-z' ]{1,40}?\s+and\s+remove\s+the\s+condition)(?:,\s+whichever comes first)?`;
/** Escape-DC wording the positional grammar proves; residual analysis may claim it. */
export const ESCAPE_DC_PATTERN = new RegExp(ESCAPE_DC, "gi");
// A short agent phrase ("immobilized by the vampiric maiden for 1 round") is
// flavor only when a lifetime immediately follows it.
const AGENT = String.raw`(?:\s+by\s+(?:the|a|an)\s+[a-z'-]+(?:\s+[a-z'-]+){0,3}(?=\s+(?:for|until|or|unless)\b))?`;
const LIFETIME = String.raw`${AGENT}(?:${TIMER})?(?:${ESCAPE}|${ACTION_END})?${SPELL_ENDS}?`;
const SEPARATOR = String.raw`(?:\s*,\s*(?:and\s+|or\s+)?(?:also\s+)?|\s+(?:and|or)\s+(?:also\s+)?)`;
// "You are Confused" grants the caster a condition, never the save's target.
const VERB = String.raw`(?<!\byou\s)(?<!\byou're\s)\b(?:is|are|becomes?|become|gains?|be|becoming)\s+(?:(?:also|additionally)\s+)?(?:knocked\s+)?`;

function durationFromTimer(text) {
    if (/\bpermanently\b|\bfor an unlimited duration\b/i.test(text)) return { mode: "unlimited", value: null, unit: null };
    const fixed = /\bfor\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(rounds?|minutes?|hours?|days?|weeks?)\b/i.exec(text);
    if (fixed) {
        const unit = fixed[2].toLowerCase().replace(/s$/, "") + "s";
        return {
            value: Number(fixed[1]) || NUMBER_WORDS[fixed[1].toLowerCase()],
            unit,
            expiry: unit === "rounds" ? "turn-start" : null,
            anchor: "effect-start",
            sourceText: fixed[0]
        };
    }
    const boundary = /\buntil\s+(?:the\s+)?(start|beginning|end)\s+of\s+(its|their|your|the target's|the creature's)\s+(next\s+)?turn\b/i.exec(text);
    const after = /\buntil\s+(its|their|your|the target's|the creature's)\s+(next\s+)?turn\s+(begins?|starts?|ends?)\b/i.exec(text);
    if (after) return {
        value: 1,
        unit: "rounds",
        expiry: /^ends?$/i.test(after[3]) ? "turn-end" : "turn-start",
        anchor: after[1].toLowerCase() === "your" ? "source-turn" : "target-turn",
        offset: after[2] ? 1 : 0,
        sourceText: after[0]
    };
    if (!boundary) return null;
    return {
        value: 1,
        unit: "rounds",
        expiry: boundary[1].toLowerCase() === "end" ? "turn-end" : "turn-start",
        anchor: boundary[2].toLowerCase() === "your" ? "source-turn" : "target-turn",
        offset: boundary[3] ? 1 : 0,
        sourceText: boundary[0]
    };
}

function lifetimeFrom(text) {
    if (!text) return null;
    const grapple = /\bGrapples against your spell DC\b/.test(text);
    const escape = /\bEscapes?\b/i.test(text) || grapple;
    const actionEnd = /\bInteract\b/.test(text);
    const duration = durationFromTimer(text);
    const spellEnds = /\bthe spell ends\b/i.test(text);
    if (!escape && !actionEnd && !duration && !spellEnds) return null;
    return {
        text: text.trim().replace(/^,\s*/, ""),
        duration,
        escape,
        escapeDC: escape ? "spell" : null,
        ...(grapple ? { escapeCheck: "grapple" } : {}),
        actionEnd: actionEnd ? "interact" : null,
        spellEnds,
        whicheverFirst: /\bwhichever comes first\b/i.test(text)
    };
}

function itemSlug(item) {
    const label = /\{([^}]+)\}/.exec(item)?.[1] ?? item;
    return label.replace(/\s+\d+\s*$/, "").trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * Parse every coordinated condition grant in plain text.
 * @returns {Array<{slug, value, index, end, raw, lifetime, ownLifetime, listIndex}>}
 */
export function parseConditionLists(text) {
    const source = String(text ?? "").replace(/[’]/g, "'");
    const items = [];
    const head = new RegExp(`${VERB}(${ITEM})(${LIFETIME})`, "gi");
    const tail = new RegExp(`^${SEPARATOR}(${ITEM})(${LIFETIME})`, "i");
    let listIndex = 0;
    for (const match of source.matchAll(head)) {
        // Negated or hypothetical predicates ("isn't forced to its knees,
        // becoming prone", "might be stunned") are not grants.
        const clauseStart = [...source.slice(0, match.index).matchAll(/[.;!?](?=\s|$)/g)].at(-1)?.index + 1 || 0;
        if (/\b(?:not|never|might|may|could|would|cannot)\b|n't\b/i.test(source.slice(clauseStart, match.index + match[0].length - match[1].length - match[2].length))) continue;
        // Unlinked Prone keeps its proven predicates: only "knocked prone"
        // opens a list here; "becoming prone" stays with its exact grammar.
        if (/^prone\b/i.test(match[1]) && !/\bknocked\s+$/i.test(match[0].slice(0, match[0].length - match[1].length - match[2].length))) continue;
        const run = [];
        let cursor = (match.index ?? 0) + match[0].length;
        const firstEnd = cursor - match[2].length;
        run.push({ raw: match[1], index: firstEnd - match[1].length, end: firstEnd, lifetimeText: match[2] });
        for (;;) {
            const next = tail.exec(source.slice(cursor));
            if (!next) break;
            const itemEnd = cursor + next[0].length - next[2].length;
            run.push({ raw: next[1], index: itemEnd - next[1].length, end: itemEnd, lifetimeText: next[2] });
            cursor += next[0].length;
        }
        // Shared trailing lifetime: walk backwards so each unlifed item takes the
        // next written lifetime in its own list run.
        let trailing = null;
        for (let position = run.length - 1; position >= 0; position -= 1) {
            const entry = run[position];
            const own = lifetimeFrom(entry.lifetimeText);
            const slug = itemSlug(entry.raw);
            const value = /\s(\d+)\s*$/.exec(entry.raw.replace(/\{([^}]+)\}$/, " $1"))?.[1];
            const valued = value != null;
            if (own) trailing = own;
            // Valued Stunned ends by losing actions; Prone ends when the creature
            // Stands. Neither borrows another list item's timer or Escape.
            // Frightened (lowered each turn) and Sickened (ended by retching) are self-limiting too: "frightened 3 and
            // fleeing for 1 round" times only the fleeing.
            const selfLimiting = (slug === "stunned" && valued) || slug === "prone" || (["frightened", "sickened"].includes(slug) && valued && !own);
            items.unshift({
                slug,
                value: valued ? Number(value) : null,
                index: entry.index,
                end: entry.end,
                raw: entry.raw,
                ownLifetime: own,
                lifetime: own ?? (selfLimiting ? null : trailing),
                listIndex,
                // The whole grant run, from its verb to its last lifetime.
                runStart: match.index,
                runEnd: cursor
            });
        }
        listIndex += 1;
    }
    return items;
}

/** Find the list item proving a reference's lifetime, if any. */
export function listLifetimeFor(reference, items) {
    return items.find(item => item.slug === reference.slug
        && item.index < reference.end && reference.index < item.end) ?? null;
}
