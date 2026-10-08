// The numbers PF2e's own spell card rolls, for resolvers that don't run that card (pf2e-resolution-core's families, the PF2e Combat Simulator):
//   - healing: the item's damage entries of kind "healing", their heightening, and who is healed;
//   - check, sharedDamage and outcomes: a spell PF2e rolls itself — an attack, or a save with damage — when the plan has none of its own
//     (Telekinetic Projectile, Gouging Claw); outcomes are the rows PF2e's card applies (an attack's double on a critical hit, a basic save's
//     0 / ½ / 1 / 2), built by the compiler's own row builder;
//   - byActions: PF2e's overlays for the spell cast with 1, 2 or 3 actions (Heal: touch; 30 feet and 8 more healing; a 30-foot emanation —
//     Blazing Bolt: 2d6 for one action, 4d6 for two or three), each a partial plan whose keys replace the base's;
//   - variants: PF2e's other overlays, picked by what the spell is cast at (Lay on Hands: healing, or damage and a save against undead),
//     and damageTypeChoices where they only pick a damage type (Telekinetic Projectile's bludgeoning, piercing or slashing);
//   - missiles: the missiles a spell fires per action and per heightened rank (Force Barrage), with one missile's damage (sharedDamage);
//   - applications: the PF2e spell Effects an unsupported plan links but couldn't place (Bless), with who gets them from its target line.
// Read from PF2e's item data, so they're what PF2e rolls at the table; the text only fills what the data lacks (who is healed, the missiles).
// They go in resolution.native, which live play never reads: it rolls PF2e's own card (or the variant PF2e casts), and its own resolution.healing
// drives its healing.
import { adaptSpellSource, normalizeDamageComponents } from "./spell-source-adapter.js";
import { cloneJSON, nonEmptyString } from "./normalize.js";

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// (What a variant changes: the formulas and types. Heal's 2-action vs. undead only narrows its kinds to damage.)
const rolled = components => (components ?? []).map(component => [component.id, component.formula, component.type]);
// (An entry with no kinds is damage, as PF2e reads it: Blazing Bolt's overlays.)
const withKinds = components => components.map(component => (component.kinds.length ? component : { ...component, kinds: ["damage"] }));
const damageOf = components => components.filter(component => component.formula && component.kinds.includes("damage"));

/** Who a spell's healing reaches: vitality heals the living, void the undead; otherwise its target line says ("1 willing creature"). */
function recipientsOf(components, target) {
    const types = new Set(components.map(component => component.type));
    if (types.has("vitality")) return "living";
    if (types.has("void")) return "undead";
    const text = String(target ?? "");
    return /\bwilling\b/i.test(text) ? "willing" : /\bliving\b/i.test(text) ? "living" : /\bundead\b/i.test(text) ? "undead" : "any";
}

/** The healing entries among normalized damage components, or null. */
const healingComponents = components => {
    const healing = components.filter(component => component.formula && component.kinds.includes("healing"));
    return healing.length ? healing : null;
};

/** The base damage components with an overlay's damage entries laid over them (by id); an overlay's own new entries are added. */
function overlaidComponents(base, overlayDamage) {
    const patches = withKinds(normalizeDamageComponents(overlayDamage));
    const merged = base.map(component => {
        const patch = overlayDamage?.[component.id];
        if (!patch) return component;
        const normal = patches.find(entry => entry.id === component.id);
        return { ...component, ...(patch.formula != null ? { formula: normal.formula } : {}), ...(patch.type != null ? { type: normal.type } : {}),
            ...(patch.category !== undefined ? { category: normal.category } : {}), ...(Array.isArray(patch.kinds) ? { kinds: normal.kinds } : {}) };
    });
    return [...merged, ...patches.filter(entry => !base.some(component => component.id === entry.id))];
}

/** The base heightening with an overlay's heightening laid over it. */
function overlaidHeightening(base, overlay) {
    if (!overlay) return cloneJSON(base);
    if (!base) return cloneJSON(overlay);
    return { ...cloneJSON(base), ...cloneJSON(overlay), damage: { ...(base.damage ?? {}), ...cloneJSON(overlay.damage ?? {}) } };
}

/** The targeting keys an overlay sets, normalized like the plan's own targeting. */
function overlayTargeting(system) {
    const out = {};
    if (system.range && "value" in system.range) out.range = nonEmptyString(system.range.value);
    if (system.area !== undefined) out.area = system.area ? cloneJSON(system.area) : null;
    if (system.target && "value" in system.target) out.target = nonEmptyString(system.target.value)?.replace(/\.$/, "") ?? null;
    return out;
}

/** The check a source's traits and defense give: an attack, or a save (the adapter's reading, its corrections included), or null. */
function checkOf(traits, defense) {
    if ((traits ?? []).includes("attack")) return { statistic: "spell-attack", basic: false };
    return defense?.kind === "save" && defense.statistic ? { statistic: defense.statistic, basic: defense.basic === true } : null;
}

/** An overlay's save (`defense: null` removes the base's), normalized like the adapter's. */
const overlayDefense = (system, base) => (system.defense === undefined ? base
    : system.defense?.save ? { kind: "save", statistic: nonEmptyString(system.defense.save.statistic)?.toLowerCase() ?? null, basic: system.defense.save.basic === true } : { kind: "none" });

/** An overlay as a partial plan over the base: targeting, check, healing, sharedDamage and outcomes where they change. */
function overlayEntry(overlay, base, outcomesFor) {
    const entry = {};
    const components = overlay.damage ? overlaidComponents(base.components, overlay.damage) : base.components;
    const heightening = overlay.damage || overlay.heightening ? overlaidHeightening(base.heightening, overlay.heightening) : base.heightening;
    // (Healing that changes: Heal's 2-action "+8", Lay on Hands' healing.)
    const healing = healingComponents(components);
    if (healing && !same(rolled(healing), rolled(base.healing?.components))) entry.healing = { components: healing, heightening, recipients: recipientsOf(healing, overlay.target?.value ?? base.target) };
    // (Damage that changes.)
    const damage = damageOf(components);
    if (damage.length && !same(rolled(damage), rolled(damageOf(base.components)))) entry.sharedDamage = { mode: "pf2e-item-damage", rollOnce: true, components: damage, heightening };
    const check = checkOf(base.traits, overlayDefense(overlay, base.defense));
    if (!same(check, base.check)) entry.check = check;
    const rows = check && (entry.sharedDamage || entry.check) && damage.length ? outcomesFor(check, damage.map(component => component.id)) : null;
    if (rows) entry.outcomes = rows;
    return entry;
}

/** The action counts an overlay's time covers: "1", "2 or 3", "1 to 3". */
function actionCounts(time) {
    const m = /^\s*(\d)(?:\s*(?:or|to)\s*(\d))?\s*$/.exec(String(time ?? ""));
    if (!m) return [];
    const from = Number(m[1]), to = Number(m[2] ?? m[1]);
    return [1, 2, 3].filter(count => count >= from && count <= to);
}

/** PF2e's action-count overlays as partial plans: { "1": { targeting }, "2": { targeting, healing }, … }, or null. */
function byActionsOf(overlays, base, outcomesFor) {
    const groups = new Map();
    for (const overlay of overlays) for (const count of actionCounts(overlay.time?.value)) groups.set(String(count), [...(groups.get(String(count)) ?? []), overlay]);
    if (!groups.size) return null;
    const out = {};
    for (const [actions, group] of [...groups].sort(([a], [b]) => Number(a) - Number(b))) {
        const entry = {};
        // (Targeting: a key the overlays agree on — Heal's two 2-action overlays (vs. living, vs. undead) share their range, not their target line.)
        const targetings = group.map(overlayTargeting);
        const targeting = {};
        for (const key of ["range", "area", "target"]) {
            const values = targetings.filter(t => key in t).map(t => t[key]);
            if (values.length && values.length === group.length && values.every(value => same(value, values[0]))) targeting[key] = values[0];
        }
        if (Object.keys(targeting).length) entry.targeting = targeting;
        for (const overlay of group.filter(overlay => overlay.damage || overlay.heightening)) {
            const { healing, sharedDamage, outcomes } = overlayEntry({ ...overlay, defense: undefined }, base, outcomesFor);
            if (healing) entry.healing = healing;
            if (sharedDamage) { entry.sharedDamage = sharedDamage; if (outcomes) entry.outcomes = outcomes; }
        }
        if (Object.keys(entry).length) out[actions] = entry;
    }
    return Object.keys(out).length ? out : null;
}

/** Overlays that only pick a component's damage type: { [componentId]: [types] }, or null. */
function damageTypeChoicesOf(overlays) {
    const typeOnly = overlay => overlay.damage && Object.keys(overlay).every(key => ["damage", "defense"].includes(key) && (key !== "defense" || overlay.defense === null))
        && Object.values(overlay.damage).every(entry => Object.keys(entry).every(key => ["type", "category"].includes(key)));
    if (!overlays.length || !overlays.every(typeOnly)) return null;
    const choices = {};
    for (const overlay of overlays) for (const [id, entry] of Object.entries(overlay.damage)) if (entry.type) choices[id] = [...new Set([...(choices[id] ?? []), entry.type])];
    return Object.keys(choices).length ? choices : null;
}

/** Missiles fired per action ("increase the number of shards you shoot by one", "Heightened (+2) You fire one additional shard with each action"). */
function missilesOf(text) {
    const perAction = /For each additional action you use when Casting the Spell, increase the number of ([a-z]+?)s? you (?:shoot|fire) by one/i.exec(text);
    if (!perAction) return null;
    const heightened = new RegExp(String.raw`Heightened \(\+(\d+)\)\s*You (?:shoot|fire) one additional ${perAction[1]} with each action`, "i").exec(text);
    return { perActions: { 1: 1, 2: 2, 3: 3 }, ...(heightened ? { perRanks: { interval: Number(heightened[1]), extra: 1 } } : {}) };
}

/** Who a linked spell Effect goes to: "self", "target", "allies-in-area" or "enemies-in-area" — the compiler's recipient, else the target line. */
function effectRecipients(entry, target, area) {
    const actor = entry.recipient?.actor;
    if (actor === "source" || /^\s*you\s*$/i.test(target)) return "self";
    if (actor === "area-allies" || (area && /\ballies\b/i.test(target))) return "allies-in-area";
    if (actor === "area-enemies" || (area && /\benem(?:y|ies)\b/i.test(target))) return "enemies-in-area";
    return "target";
}

/** An unsupported plan's linked spell Effects (Bless: "you and allies in the area"), or null. */
function applicationsOf(plan) {
    if (plan?.resolution?.kind !== "unsupported") return null;
    const linked = ["onUse", "deferred", "unscoped"].flatMap(key => plan.nativeEffects?.[key] ?? []).filter(entry => entry?.kind === "native-spell-effect" && entry.uuid);
    const target = String(plan.targeting?.target ?? ""), area = plan.targeting?.area ?? null;
    const seen = new Set();
    const applications = linked.filter(entry => !seen.has(entry.uuid) && seen.add(entry.uuid))
        .map(entry => ({ kind: "native-spell-effect", uuid: entry.uuid, label: entry.label ?? entry.reference ?? null, recipients: effectRecipients(entry, target, area), ...(area ? { area: cloneJSON(area) } : {}) }));
    return applications.length ? applications : null;
}

/**
 * The healing for the core: { components, heightening, recipients }. A plan whose live runtime heals already (resolution.healing: { formula,
 * damageType, recipient, … }) keeps its own fields, and its formula and heightening correction win over PF2e's data — they're what the table rolls
 * (Breath of Life heightens every 2 ranks, as its text says, not every rank as PF2e's data does).
 */
function healingFor(components, heightening, target, existing) {
    const data = healingComponents(components);
    const live = existing?.formula ? [{ id: data?.[0]?.id ?? "0", formula: existing.formula, type: existing.damageType ?? data?.[0]?.type ?? "untyped", category: null,
        applyModifier: false, kinds: ["healing"], materials: [] }] : null;
    const parts = live && !(data?.length === 1 && data[0].formula === existing.formula) ? live : data;
    if (!parts) return null;
    const correction = existing?.heighteningCorrection;
    const steps = correction?.text ? { type: "interval", interval: correction.text.interval, damage: Object.fromEntries(parts.map(part => [part.id, `${correction.text.dice}d${correction.faces}`])) } : heightening;
    return { ...(existing ? cloneJSON(existing) : {}), components: parts, heightening: steps, recipients: recipientsOf(parts, target) };
}

/**
 * A spell plan's resolution.native: { healing?, check?, sharedDamage?, outcomes?, byActions?, variants?, damageTypeChoices?, missiles?, applications?,
 * dataCorrected? }.
 * check, sharedDamage and outcomes only where the plan has none of its own. outcomesFor(check, componentIds) builds the rows (the compiler's).
 */
export function nativeNumbers(item, resolution, { outcomesFor = () => null, plan = null } = {}) {
    const system = item?.system ?? {};
    const adapted = adaptSpellSource(item);
    const components = withKinds(normalizeDamageComponents(system.damage));
    const heightening = cloneJSON(system.heightening ?? null);
    const out = {};
    const healing = healingFor(components, heightening, system.target?.value, resolution?.healing ?? null);
    if (healing) out.healing = healing;
    // (A spell PF2e rolls itself: its check, its damage, and the rows its card applies.)
    const check = checkOf(adapted.activation.traits, adapted.defense);
    const damage = damageOf(components);
    if (damage.length && !resolution?.sharedDamage) out.sharedDamage = { mode: "pf2e-item-damage", rollOnce: true, components: damage, heightening };
    if (check && !resolution?.check?.statistic) {
        out.check = check;
        const shared = out.sharedDamage ?? resolution?.sharedDamage;
        const rows = shared?.components?.length ? outcomesFor(check, shared.components.map(component => component.id)) : null;
        if (rows) out.outcomes = rows;
    }
    // (Where the compiler read PF2e's data differently from the text: the basic flag on a spell without damage, a heightening the text corrects.)
    const corrected = [adapted.defense.basicFlagIgnored ? "basic-flag-ignored" : null, resolution?.healing?.heighteningCorrection ? "healing-heightening" : null].filter(Boolean);
    if (corrected.length) out.dataCorrected = corrected;
    const overlays = Object.values(system.overlays ?? {}).filter(overlay => overlay?.overlayType === "override" && overlay.system).map(overlay => ({ ...overlay.system, name: overlay.name ?? null }));
    const base = { components, heightening, healing: healingComponents(components) ? { components: healingComponents(components) } : null, check, defense: adapted.defense,
        traits: adapted.activation.traits, target: system.target?.value };
    const timed = overlays.filter(overlay => actionCounts(overlay.time?.value).length);
    const byActions = byActionsOf(timed, base, outcomesFor);
    if (byActions) out.byActions = byActions;
    // (The other overlays: a damage type to pick, or variants by what the spell is cast at.)
    const others = overlays.filter(overlay => !actionCounts(overlay.time?.value).length).map(({ name, ...system }) => ({ name, system }));
    const choices = damageTypeChoicesOf(others.map(other => other.system));
    if (choices) out.damageTypeChoices = choices;
    else if (others.length) {
        const variants = others.map(({ name, system }) => ({ name, ...(Object.keys(overlayTargeting(system)).length ? { targeting: overlayTargeting(system) } : {}), ...overlayEntry(system, base, outcomesFor) }))
            .filter(variant => Object.keys(variant).length > 1);
        if (variants.length) out.variants = variants;
    }
    const text = String(system.description?.value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const missiles = missilesOf(text);
    if (missiles) out.missiles = missiles;
    const applications = applicationsOf(plan);
    if (applications) out.applications = applications;
    return out;
}
