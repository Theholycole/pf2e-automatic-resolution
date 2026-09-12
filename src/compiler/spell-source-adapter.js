import { cloneJSON, nonEmptyString, normalizeSlug } from "./normalize.js";

function normalizeDamageComponents(damage) {
    return Object.entries(damage ?? {}).map(([id, component]) => ({
        id,
        formula: nonEmptyString(component?.formula),
        type: nonEmptyString(component?.type),
        category: nonEmptyString(component?.category),
        applyModifier: component?.applyMod === true,
        kinds: Array.isArray(component?.kinds) ? [...component.kinds] : [],
        materials: Array.isArray(component?.materials) ? [...component.materials] : []
    }));
}

function normalizeDefense(save) {
    if (!save) return { kind: "none", statistic: null, basic: false };
    return {
        kind: "save",
        statistic: nonEmptyString(save.statistic)?.toLowerCase() ?? null,
        basic: save.basic === true
    };
}

export function adaptSpellSource(item, { sourceFile = null } = {}) {
    if (!item || typeof item !== "object") {
        throw new TypeError("A PF2e item source object is required.");
    }
    if (item.type !== "spell") {
        throw new TypeError(`The spell adapter cannot compile item type ${JSON.stringify(item.type)}.`);
    }

    const system = item.system ?? {};
    const name = nonEmptyString(item.name) ?? "Unnamed Spell";
    const duration = system.duration ?? {};

    return {
        source: {
            documentType: "Item",
            itemType: "spell",
            id: nonEmptyString(item._id),
            uuid: nonEmptyString(item.uuid),
            name,
            slug: nonEmptyString(system.slug) ?? normalizeSlug(name),
            image: nonEmptyString(item.img),
            sourceFile,
            publication: cloneJSON(system.publication ?? null)
        },
        rank: Number.isFinite(Number(system.level?.value)) ? Number(system.level.value) : null,
        category: nonEmptyString(system.category?.value),
        activation: {
            time: nonEmptyString(system.time?.value),
            traits: Array.isArray(system.traits?.value) ? [...system.traits.value] : [],
            traditions: Array.isArray(system.traits?.traditions) ? [...system.traits.traditions] : [],
            requirements: nonEmptyString(system.requirements),
            cost: nonEmptyString(system.cost?.value)
        },
        targeting: {
            target: nonEmptyString(system.target?.value),
            range: nonEmptyString(system.range?.value),
            area: system.area ? cloneJSON(system.area) : null
        },
        defense: normalizeDefense(system.defense?.save),
        damageComponents: normalizeDamageComponents(system.damage),
        heightening: cloneJSON(system.heightening ?? null),
        lifecycle: {
            duration: nonEmptyString(duration.value),
            sustained: duration.sustained === true
        },
        descriptionHTML: String(system.description?.value ?? ""),
        rules: cloneJSON(system.rules ?? [])
    };
}

