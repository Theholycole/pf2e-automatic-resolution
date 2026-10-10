// Essence Eating Shell (Magus+): a Spellstrike made with an essence eating spellshell also puts an effect on its initial target and on the magus, chosen by the
// shell spell's school — schools the remaster dropped, so the caster picks (the user, 2026-10-10). Each school's effect is written here as a spell of its own, in
// PF2e's wording the compiler reads (its save, damage at the shell spell's rank and outcome rows), and resolved on the module's save card like any spell's:
// abjuration's force cube (basic Fortitude; Immobilized 1 round on a failure), conjuration's blinking (basic Fortitude; the DC 5 flat check for manipulate
// actions a note for 1 round), divination's vision (basic Will; Frightened 1, or 2), enchantment's prison (Will; Stupefied 2 for 1 round, or Confused), evocation's
// blast (basic Reflex, the Arcane Cascade type; a failure's weakness to it an Effect for the Spellstrike's damage), illusion's false reality (Will; difficult terrain
// everywhere for 1 minute, greater on a critical failure: a note), necromancy's sphere (basic Fortitude, void or vitality; Drained 2, or 4) and transmutation's
// morphing (Fortitude; Sickened 2, or 3, with −10 feet to its Speeds while sickened).

const CONDITION = {
    immobilized: "Compendium.pf2e.conditionitems.Item.eIcWbB5o3pP6OIMe",
    frightened: "Compendium.pf2e.conditionitems.Item.TBSHQspnbcqxsmjL",
    stupefied: "Compendium.pf2e.conditionitems.Item.e1XGnhKNSQIm5IXg",
    confused: "Compendium.pf2e.conditionitems.Item.yblD8fOR1J8rDwEQ",
    drained: "Compendium.pf2e.conditionitems.Item.4D2KBtexWXa6oUMR",
    sickened: "Compendium.pf2e.conditionitems.Item.fesd1n5eVhpCSS18"
};
const link = (slug, label) => `@UUID[${CONDITION[slug]}]{${label}}`;

export const ESSENCE_SCHOOLS = ["abjuration", "conjuration", "divination", "enchantment", "evocation", "illusion", "necromancy", "transmutation"];

const ROW = { criticalSuccess: "Critical Success", success: "Success", failure: "Failure", criticalFailure: "Critical Failure" };
const rows = outcomes => Object.entries(ROW).map(([degree, label]) => `<p><strong>${label}</strong> ${outcomes[degree]}</p>`).join("");
const basicRows = (failure, critical) => rows({ criticalSuccess: "The creature is unaffected.", success: "The creature takes half damage.",
    failure: `The creature takes full damage${failure ? ` and ${failure}` : ""}.`, criticalFailure: `The creature takes double damage${critical ? ` and ${critical}` : ""}.` });

/**
 * The school's effect at the shell spell's rank as a spell source: {name, statistic, basic, damage: [{formula, type}] | [], html, traits, note} — `note` the part
 * the GM plays (an Effect on a failure), or null. `cascadeType` is evocation's damage type, `vitality` necromancy's (the shell spell had the vitality trait).
 */
export function essenceShellEffect(school, { rank, cascadeType = "force", vitality = false }) {
    const r = Math.max(1, Number(rank) || 1);
    switch (school) {
        case "abjuration": return { statistic: "fortitude", basic: true, damage: [{ formula: `${r}d4`, type: "force" }], traits: ["force"],
            html: `<p>A cube of force compresses around the creature.</p><hr />${basicRows(`is ${link("immobilized", "Immobilized")} for 1 round`, `is ${link("immobilized", "Immobilized")} for 1 round`)}`, note: null };
        case "conjuration": return { statistic: "fortitude", basic: true, damage: [{ formula: `${r}d4`, type: "bludgeoning" }, { formula: `${r}d4`, type: "slashing" }], traits: ["teleportation"],
            html: `<p>The creature blinks in and out of existence.</p><hr />${basicRows(null, null)}`,
            note: { degrees: ["failure", "criticalFailure"], rounds: 1, castFlatCheck: { dc: 5, trait: "manipulate" }, text: "Phasing in and out of existence: a DC 5 flat check to use actions with the manipulate trait." } };
        case "divination": return { statistic: "will", basic: true, damage: [{ formula: `${r}d6`, type: "mental" }], traits: ["emotion", "fear", "mental"],
            html: `<p>The creature sees a vision of its death.</p><hr />${basicRows(`is ${link("frightened", "Frightened 1")}`, `is ${link("frightened", "Frightened 2")}`)}`, note: null };
        case "enchantment": return { statistic: "will", basic: false, damage: [], traits: ["mental"],
            html: `<p>The creature's mind is bound in a mental prison.</p><hr />${rows({ criticalSuccess: "The creature is unaffected.", success: "The creature is unaffected.",
                failure: `The creature is ${link("stupefied", "Stupefied 2")} for 1 round.`, criticalFailure: `The creature is ${link("confused", "Confused")} for 1 round.` })}`,
            note: { degrees: ["failure", "criticalFailure"], rounds: 1, text: "If the Spellstrike that caused this would give the creature the dying condition, the condition is permanent instead, with a new save each day." } };
        case "evocation": return { statistic: "reflex", basic: true, damage: [{ formula: `${r}`, type: cascadeType }], traits: [],
            html: `<p>Essence blasts the creature.</p><hr />${basicRows(null, null)}`,
            note: { degrees: ["failure", "criticalFailure"], rounds: 0, weakness: { type: cascadeType, value: r },
                text: `Weakness ${r} to ${cascadeType} (or its ${cascadeType} resistance ${r} lower), applied to the Spellstrike's damage; immune to ${cascadeType}: half damage of that type instead.` } };
        case "illusion": return { statistic: "will", basic: false, damage: [], traits: ["mental", "visual"],
            html: `<p>A false reality absorbs the creature.</p><hr />${rows({ criticalSuccess: "The creature is unaffected.", success: "The creature is unaffected.",
                failure: "The creature is unaffected.", criticalFailure: "The creature is unaffected." })}`,
            note: { degrees: ["failure", "criticalFailure"], rounds: 10, critical: "greater difficult terrain",
                text: "Every area around the creature is difficult terrain for it (greater difficult terrain on a critical failure). A creature that moves through it or Seeks to examine it can attempt to disbelieve." } };
        case "necromancy": { const type = vitality ? "vitality" : "void";
            return { statistic: "fortitude", basic: true, damage: [{ formula: `${r}d8`, type }], traits: ["death"],
                html: `<p>A sphere of death bombards the creature.</p><hr />${basicRows(`is ${link("drained", "Drained 2")}`, `is ${link("drained", "Drained 4")}`)}`,
                note: { degrees: ["failure", "criticalFailure"], rounds: 0, text: "Reduced to 0 Hit Points by this damage or the drained condition, the creature is slain; its afterlife can't be disturbed (see the feat)." }, fizzleType: type }; }
        case "transmutation": return { statistic: "fortitude", basic: false, damage: [], traits: ["morph"],
            html: `<p>The shell morphs the creature's inner anatomy.</p><hr />${rows({ criticalSuccess: "The creature is unaffected.", success: "The creature is unaffected.",
                failure: `The creature is ${link("sickened", "Sickened 2")}.`, criticalFailure: `The creature is ${link("sickened", "Sickened 3")}.` })}`,
            note: null, sickenedSpeed: -10 };
        // (A creature immune to sickened: "1d4 bludgeoning damage per level of the spell on a basic Fortitude save and suffers the status penalty to Speeds for 1
        // round after taking damage from a failure".)
        case "transmutation-immune": return { statistic: "fortitude", basic: true, damage: [{ formula: `${r}d4`, type: "bludgeoning" }], traits: ["morph"],
            html: `<p>The shell morphs the creature's inner anatomy.</p><hr />${basicRows(null, null)}`, note: null, sickenedSpeed: -10 };
        default: return null;
    }
}

/** The school's effect as a PF2e spell source the compiler reads (no id; the runtime gives it one and a parent). */
export function essenceShellSpellSource(school, options) {
    const effect = essenceShellEffect(school, options);
    if (!effect) return null;
    const name = `Essence Eating Shell: ${school[0].toUpperCase()}${school.slice(1).replace(/-immune$/, "")}`;
    const damage = Object.fromEntries(effect.damage.map((part, index) => [String(index), { formula: part.formula, type: part.type, category: null, materials: [], kinds: ["damage"] }]));
    return { effect, source: { name, type: "spell", img: "icons/magic/symbols/runes-star-pentagon-blue.webp",
        system: { slug: null, level: { value: Math.max(1, Number(options.rank) || 1) }, traits: { value: [...effect.traits], rarity: "common", traditions: [] },
            description: { value: effect.html }, time: { value: "1" }, duration: { value: "", sustained: false }, target: { value: "1 creature" }, range: { value: "" }, area: null,
            defense: { save: { statistic: effect.statistic, basic: effect.basic } }, damage, heightening: null } } };
}
