// Damage set by the caster's sorcerer bloodline, which PF2e applies itself:
//   "The damage type depends on the magical tradition related to the dragon that influenced your bloodline." (Dragon
//   Breath: the item's own DamageAlteration reads the draconic bloodline's damage type.)
//   "This spell deals damage according to your elemental influence (for instance, slashing for air or fire for fire) and
//   has your element's trait." (Elemental Toss, Elemental Blast: the Elemental bloodline's DamageAlteration and trait
//   ItemAlteration apply to them.)
//   "… plus 1d4 additional damage of a type determined by the magical tradition related to the dragon that influenced
//   your bloodline: arcane force, divine spirit, occult mental, or primal fire." (Flurry of Claws: the item's own
//   DamageDice rule adds it.)
// The sentence is taken out and the damage entry stays PF2e's: its roll carries the bloodline's type. The runtime
// refuses a caster without that bloodline choice, and a roll PF2e left untyped.

const DRACONIC_TYPE = /\s*The damage type depends on the magical tradition related to the dragon that influenced your bloodline\./;
const ELEMENTAL_TYPE = /\s*This spell deals damage according to your elemental influence \(for instance, slashing for air or fire for fire\) and has your element's trait\./;
// "the creatures takes 1d8 slashing plus 1d4 additional damage of a type determined by …: arcane force, divine spirit,
// occult mental, or primal fire."
const DRACONIC_EXTRA = /On a hit, the (?:target|creatures?) takes? (\d+d\d+) ([a-z]+) plus (\d+)d(\d+) additional damage of a type determined by the magical tradition related to the dragon that influenced your bloodline: (?:<strong>)?arcane(?:<\/strong>)? force, (?:<strong>)?divine(?:<\/strong>)? spirit, (?:<strong>)?occult(?:<\/strong>)? mental, or (?:<strong>)?primal(?:<\/strong>)? fire\./;
// Its heightened entry: "The initial damage increases by 1d8 and the additional damage increases by 1d4."
const EXTRA_HEIGHTENED = /The initial damage increases by (\d+d\d+) and the additional damage increases by (\d+)d(\d+)\./;
const DRACONIC_FLAG = "{actor|flags.system.dragonBloodline.damageType}";

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function claimRule(rules, test) {
    const index = rules.findIndex(test);
    return index < 0 ? null : [rules[index], rules.filter((_, i) => i !== index)];
}

/** Returns {html, rules, bloodline} with the sentence and its PF2e rule claimed, or null. */
export function rewriteBloodlineDamage(adapted) {
    const html = String(adapted.descriptionHTML ?? "");
    const slug = String(adapted.source?.slug ?? "");
    const rules = adapted.rules ?? [];
    const components = adapted.damageComponents ?? [];
    const one = components.length === 1 && !components[0].category ? components[0] : null;
    const untyped = one && String(one.type ?? "untyped").toLowerCase() === "untyped";
    // "… dealing 5d6 damage …": the entry has no type of its own, so name it for the damage readers.
    const typed = text => text.replace(new RegExp(String.raw`\b${String(one.formula).replace(/\s+/g, "").replace(/[+]/g, "\\+")} damage\b`), `${String(one.formula).replace(/\s+/g, "")} untyped damage`);
    if (DRACONIC_TYPE.test(html)) {
        if (!untyped) return null;
        const claimed = claimRule(rules, rule => rule.key === "DamageAlteration" && rule.mode === "override" && rule.property === "damage-type"
            && same(rule.selectors, ["spell-damage"]) && rule.value === DRACONIC_FLAG && same(rule.predicate, [`item:slug:${slug}`]));
        if (!claimed) return null;
        return { html: typed(html.replace(DRACONIC_TYPE, "")), rules: claimed[1],
            bloodline: { bloodline: "draconic", flag: "dragonBloodline", part: "type", sourceText: DRACONIC_TYPE.exec(html)[0].trim() } };
    }
    if (ELEMENTAL_TYPE.test(html)) {
        // The Elemental bloodline's own rules alter the spell; the item carries none for it.
        if (!untyped || rules.length) return null;
        return { html: typed(html.replace(ELEMENTAL_TYPE, "")), rules,
            bloodline: { bloodline: "elemental", flag: "elementalBloodline", part: "type", sourceText: ELEMENTAL_TYPE.exec(html)[0].trim() } };
    }
    const extra = DRACONIC_EXTRA.exec(html);
    if (extra) {
        const [, formula, type, count, die] = extra;
        if (!one || String(one.formula).replace(/\s+/g, "") !== formula || String(one.type).toLowerCase() !== type) return null;
        // The item's DamageDice: the bloodline's type, dN dice, one per rank (the text's count at the spell's rank).
        const heightened = EXTRA_HEIGHTENED.exec(html);
        const perRank = heightened ? `${heightened[2]}d${heightened[3]}` : null;
        if (heightened && (perRank !== `1d${die}` || adapted.heightening?.interval !== 1)) return null;
        const scaling = heightened ? "@item.level" : count;
        if (heightened && Number(count) !== Number(adapted.rank)) return null;
        const claimed = claimRule(rules, rule => rule.key === "DamageDice" && rule.damageType === DRACONIC_FLAG && rule.dieSize === `d${die}`
            && String(rule.diceNumber) === String(scaling) && rule.selector === "spell-damage" && Array.isArray(rule.predicate) && rule.predicate.includes(`item:slug:${slug}`));
        if (!claimed) return null;
        let next = html.replace(DRACONIC_EXTRA, `On a hit, the target takes ${formula} ${type} damage.`);
        if (heightened) next = next.replace(EXTRA_HEIGHTENED, `The damage increases by ${heightened[1]}.`);
        return { html: next, rules: claimed[1],
            bloodline: { bloodline: "draconic", flag: "dragonBloodline", part: "extra", die: `d${die}`, sourceText: extra[0] } };
    }
    return null;
}
