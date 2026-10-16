import { cloneJSON, nonEmptyString, normalizeSlug } from "./normalize.js";

export function normalizeDamageComponents(damage) {
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

// PF2e sometimes flags a save "basic" on a spell with no damage (Parch). A basic save only scales damage, so the flag is
// read as a slip when the item has no damage, the text never says "basic" nor rolls inline damage, and it has its own
// Critical Failure row; the text's table then decides the outcomes.
function mislabelledBasic(save, damage, description) {
    const text = String(description ?? "");
    return save.basic === true && Object.keys(damage ?? {}).length === 0
        && !/\bbasic\b/i.test(text) && !/@Damage\[/.test(text) && /Critical Failure/.test(text);
}

// (Save results whose save isn't named, on a restraint — the target unaffected on a critical success, its movement held until it Escapes: a Reflex save, the user's
// ruling of 2026-10-03.)
function unnamedRestraintSave(description) {
    const html = String(description ?? "");
    const rows = ["Critical Success", "Success", "Failure", "Critical Failure"].map(label => new RegExp(`<strong>${label}</strong>\\s*([^<]*(?:<(?!/p>)[^<]*)*)`).exec(html)?.[1] ?? null);
    if (rows.some(row => row === null) || !/^The target is unaffected\.\s*$/.test(rows[0])) return false;
    return rows.slice(1).every(row => /\bEscapes?\b/.test(row) && /\bmove\b/.test(row));
}

// And the other slip: a damaging spell flagged non-basic whose text says "… deals 6d6 bludgeoning damage and 2d6 persistent fire damage, with a basic Reflex
// save to each creature in the area" (Searing Rain, PF2e 8.6) and has no result table — its save is the basic save the text names, when that sentence
// names each of the item's damage entries.
function unflaggedBasic(save, damage, description) {
    const text = String(description ?? "");
    const entries = Object.values(damage ?? {});
    // (Not a text of action-count paragraphs: their own readers judge each version — Dynamic Caustic Blast.)
    if (save.basic === true || !entries.length || /<strong>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>|class="action-glyph"/.test(text)) return false;
    const plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const sentence = plain.split(/(?<=[.!?])\s+/).find(entry => /\bwith a basic (?:Fortitude|Reflex|Will) save\b/i.test(entry));
    const named = sentence ? /\bwith a basic (Fortitude|Reflex|Will) save\b/i.exec(sentence) : null;
    return !!named && named[1].toLowerCase() === String(save.statistic ?? "").toLowerCase()
        && entries.every(entry => sentence.includes(`${String(entry.formula ?? "").replace(/\s+/g, "")} ${entry.category === "persistent" ? "persistent " : ""}${String(entry.type ?? "").toLowerCase()} damage`));
}

function normalizeDefense(save, damage, description) {
    if (!save && unnamedRestraintSave(description)) return { kind: "save", statistic: "reflex", basic: false, assumed: "unnamed-restraint-save" };
    if (!save) return { kind: "none", statistic: null, basic: false };
    const ignored = mislabelledBasic(save, damage, description);
    const stated = !ignored && unflaggedBasic(save, damage, description);
    return {
        kind: "save",
        statistic: nonEmptyString(save.statistic)?.toLowerCase() ?? null,
        basic: (save.basic === true && !ignored) || stated,
        ...(ignored ? { basicFlagIgnored: true } : {}),
        ...(stated ? { basicFlagAssumed: "text" } : {})
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
        // (A ritual: PF2e's ritual data block.)
        ritual: system.ritual != null,
        activation: {
            time: nonEmptyString(system.time?.value),
            traits: Array.isArray(system.traits?.value) ? [...system.traits.value] : [],
            traditions: Array.isArray(system.traits?.traditions) ? [...system.traits.traditions] : [],
            requirements: nonEmptyString(system.requirements),
            cost: nonEmptyString(system.cost?.value)
        },
        targeting: {
            // (A few items end the target line with a period: "1 weapon that is unattended or wielded by a willing creature.")
            target: nonEmptyString(system.target?.value)?.replace(/\.$/, "") ?? null,
            range: nonEmptyString(system.range?.value),
            area: system.area ? cloneJSON(system.area) : null
        },
        defense: normalizeDefense(system.defense?.save, system.damage, system.description?.value),
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

