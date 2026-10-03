// Rules a proved Effect + note adds, with values read from the caster when cast.

const clone = value => structuredClone(value);

/**
 * Rules a proof adds whose values are the caster's, read when cast (Summoner's Visage): "@caster:size" is the caster's size, and
 * "@caster:form-traits" the humanoid trait and the caster's ancestry traits — none when the caster isn't humanoid (that rule is dropped).
 */
export function casterResolvedRules(rules, caster) {
    const traits = [...(caster?.system?.traits?.value ?? [])];
    // (A character's ancestry traits; a creature without an ancestry item has its own creature traits.)
    const ancestry = caster?.ancestry ? [...(caster.ancestry.system?.traits?.value ?? [])] : traits;
    const humanoid = traits.includes("humanoid") || ancestry.includes("humanoid");
    return clone(rules).flatMap(rule => {
        if (rule.add === "@caster:form-traits") return humanoid ? [{ ...rule, add: [...new Set(["humanoid", ...ancestry.filter(trait => /^[a-z-]+$/.test(trait))])] }] : [];
        if (rule.value === "@caster:size") return [{ ...rule, value: caster?.system?.traits?.size?.value ?? caster?.size ?? "med" }];
        return [rule];
    });
}

/** Overrides whose values are the recipient's, read when cast (Canopy Crawler): "@recipient:highest-speed" is its highest Speed. */
export function recipientResolvedOverrides(overrides, actor) {
    // (PF2e's movement types; its travel Speed isn't one.)
    const speeds = actor?.system?.movement?.speeds ?? {};
    const values = ["land", "burrow", "climb", "fly", "swim"].map(type => Number(speeds[type]?.value));
    const legacy = actor?.system?.attributes?.speed;
    if (legacy) values.push(Number(legacy.value ?? legacy.total), ...(legacy.otherSpeeds ?? []).map(speed => Number(speed?.value ?? speed?.total)));
    const highest = Math.max(0, ...values.filter(Number.isFinite));
    return clone(overrides).map(override => override.patch?.value === "@recipient:highest-speed" ? { ...override, patch: { ...override.patch, value: highest } } : override);
}

/**
 * A creature's own attack made better (Clawsong: "… deals 1d6 slashing damage. If the target's claw attack already deals 1d6 slashing damage,
 * it deals 1d8 instead."): rules for each of the recipient's weapons of that base (or slug), by item id — the damage type, the dice, and the
 * die from what the weapon deals now.
 */
export function strikeUpgradeRules(upgrade, actor) {
    const weapons = (actor?.itemTypes?.weapon ?? []).filter(weapon => weapon.system?.baseItem === upgrade.strike || weapon.slug === upgrade.strike);
    return weapons.flatMap(weapon => {
        const damage = weapon._source?.system?.damage ?? weapon.system?.damage ?? {};
        const already = Number(damage.dice) === upgrade.dice && String(damage.die) === `d${upgrade.faces}` && damage.damageType === upgrade.type;
        const alteration = (property, value) => ({ key: "ItemAlteration", itemType: "weapon", predicate: [`item:id:${weapon.id}`], property, mode: "override", value });
        return [alteration("damage-type", upgrade.type), alteration("damage-dice-number", upgrade.dice), alteration("damage-dice-faces", already ? upgrade.alreadyFaces : upgrade.faces)];
    });
}
