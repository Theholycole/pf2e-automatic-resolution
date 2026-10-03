/** Select and scale PF2e-native damage instances before one damage application. */
export function selectComponentDamageRoll(evaluatedRoll, components, selection,
    {DamageRoll = (globalThis.CONFIG?.Dice?.rolls ?? []).find(type => type?.name === 'DamageRoll'),
        InstancePool = globalThis.CONFIG?.Dice?.termTypes?.InstancePool} = {}) {
    if (!DamageRoll?.fromTerms || !InstancePool?.fromRolls
        || !evaluatedRoll?._evaluated || !Array.isArray(evaluatedRoll.instances)) {
        throw new Error('An evaluated PF2e DamageRoll and native instance classes are required.');
    }
    const source = Array.isArray(components) ? components : [];
    const selectedIds = selection?.sourceComponentIds ?? [];
    if (!source.length || !Array.isArray(selectedIds) || !selectedIds.length
        || new Set(selectedIds).size !== selectedIds.length
        || ![0.5, 1, 2].includes(selection.multiplier)) {
        throw new Error('The component damage selection is incomplete.');
    }
    const sourceBySignature = new Map();
    const sourceById = new Map();
    const signature = (type, persistent) => `${String(type ?? '').toLowerCase()}|${persistent ? 'persistent' : 'direct'}`;
    for (const component of source) {
        if (!component?.id || !component.type || sourceById.has(component.id)) {
            throw new Error('The structured damage components are ambiguous.');
        }
        const key = signature(component.type, component.category === 'persistent' || component.type === 'bleed');
        if (sourceBySignature.has(key)) throw new Error('Structured damage components share one native signature.');
        sourceBySignature.set(key, component.id);
        sourceById.set(component.id, component);
    }
    if (selectedIds.some(id => !sourceById.has(id))) throw new Error('The damage selection names an unknown component.');
    const overrides = selection.componentMultipliers ?? {};
    if (Object.keys(overrides).some(id => !selectedIds.includes(id) || ![0.5, 1, 2].includes(overrides[id]))) {
        throw new Error('A component damage multiplier is unsupported.');
    }

    const nativeById = new Map();
    for (const instance of evaluatedRoll.instances) {
        const id = sourceBySignature.get(signature(instance.type, instance.persistent));
        if (!id || nativeById.has(id) || typeof instance.toJSON !== 'function') {
            throw new Error('PF2e native damage instances cannot be matched one-to-one with source components.');
        }
        nativeById.set(id, instance);
    }
    if (nativeById.size !== source.length) {
        throw new Error('PF2e omitted a structured damage component from its native roll.');
    }

    // PF2e may raise a zero-valued evaluated roll to its native minimum of 1
    // without changing the individual instance totals. Rebuilding the full
    // roll from those instances would silently discard that minimum (and its
    // increasedFrom metadata), so retain PF2e's original roll path whenever
    // the outcome selects every component at one common scale.
    if (selectedIds.length === source.length) {
        const multipliers = selectedIds.map(id => overrides[id] ?? selection.multiplier);
        if (multipliers.every(multiplier => multiplier === multipliers[0])) {
            const multiplier = multipliers[0];
            if (multiplier === 1) return evaluatedRoll;
            if (typeof evaluatedRoll.alter !== 'function') {
                throw new Error('PF2e cannot scale the complete native damage roll.');
            }
            const altered = evaluatedRoll.alter(multiplier, 0);
            if (altered?.instances?.length !== source.length) {
                throw new Error('PF2e could not retain every native damage component.');
            }
            return altered;
        }
    }

    const selected = selectedIds.map(id => {
        const native = nativeById.get(id);
        const copied = native.constructor.fromData(native.toJSON());
        const singleton = DamageRoll.fromTerms([InstancePool.fromRolls([copied])]);
        const multiplier = overrides[id] ?? selection.multiplier;
        const altered = multiplier === 1 ? singleton : singleton.alter(multiplier, 0);
        if (altered.instances?.length !== 1) throw new Error('PF2e could not scale one damage component.');
        return altered.instances[0];
    });
    const projected = DamageRoll.fromTerms([InstancePool.fromRolls(selected)]);
    if (projected.instances?.length !== selected.length) throw new Error('PF2e could not compose selected damage components.');
    return projected;
}

/** Compose pre-rolled structured damage and one inline persistent instance for one PF2e IWR pass. */
export function composeInlinePersistentDamageRoll(directRoll, persistentRoll, components, selection,
    {DamageRoll = (globalThis.CONFIG?.Dice?.rolls ?? []).find(type => type?.name === 'DamageRoll'),
        InstancePool = globalThis.CONFIG?.Dice?.termTypes?.InstancePool} = {}) {
    if (!DamageRoll?.fromData || !InstancePool?.fromRolls
        || !directRoll?._evaluated || !persistentRoll?._evaluated
        || typeof directRoll.toJSON !== 'function'
        || !Array.isArray(directRoll.instances) || !Array.isArray(persistentRoll.instances)) {
        throw new Error('Evaluated native direct and persistent DamageRolls are required.');
    }
    const source = Array.isArray(components) ? components : [];
    const selected = selection?.sourceComponentIds;
    if (![1, 2].includes(source.length) || !Array.isArray(selected)
        || selected.length !== source.length || new Set(selected).size !== source.length
        || ![1, 2].includes(selection.multiplier)
        || selection.componentMultipliers != null
        || source.some(component => component.category != null || component.kinds?.length !== 1
            || component.kinds[0] !== 'damage' || !component.type || !component.id)
        || new Set(source.map(component => component.id)).size !== source.length
        || new Set(source.map(component => component.type)).size !== source.length
        || selected.some(id => !source.some(component => component.id === id))) {
        throw new Error('Inline persistent composition requires every unique structured direct component.');
    }
    const observed = new Set();
    for (const instance of directRoll.instances) {
        if (instance.persistent || !source.some(component => component.type === instance.type)
            || observed.has(instance.type) || typeof instance.toJSON !== 'function') {
            throw new Error('Native direct damage instances do not match the structured components.');
        }
        observed.add(instance.type);
    }
    if (observed.size !== source.length || persistentRoll.instances.length !== 1
        || persistentRoll.instances[0].type !== 'bleed'
        || persistentRoll.instances[0].persistent !== true
        || persistentRoll.instances[0].options?.evaluatePersistent === true
        || persistentRoll.total !== 0
        || typeof persistentRoll.instances[0].toJSON !== 'function') {
        throw new Error('The native inline bleed instance is missing or ambiguous.');
    }
    const scaled = selection.multiplier === 1 ? directRoll : directRoll.alter(selection.multiplier, 0);
    if (scaled?.instances?.length !== source.length || !scaled._evaluated) {
        throw new Error('PF2e could not scale all structured direct damage.');
    }
    const instances = [...scaled.instances, persistentRoll.instances[0]].map(instance =>
        instance.constructor.fromData(instance.toJSON()));
    const pool = InstancePool.fromRolls(instances);
    const data = scaled.toJSON();
    data.terms = [pool.toJSON()];
    // DamageRoll.formula is localized display text. InstancePool.formula uses
    // each instance's raw _formula, but PF2e's alter() can move a type flavor
    // onto an inner die ("2 * 2d4[void]"). On a fresh parse that becomes an
    // untyped outer instance. Bind every native instance's own flavor to its
    // entire head expression so re-parsing preserves type and persistence.
    const canonicalInstances = instances.map(instance => {
        const head = instance.head?.formula;
        const flavor = instance.options?.flavor;
        if (typeof head !== 'string' || !head.trim()
            || typeof flavor !== 'string' || !/^[a-z0-9,_-]+$/i.test(flavor)) {
            throw new Error('A native damage instance lacks parseable head or flavor metadata.');
        }
        return `(${head})[${flavor}]`;
    });
    data.formula = `{${canonicalInstances.join(',')}}`;
    if (typeof DamageRoll.validate !== 'function' || !DamageRoll.validate(data.formula)) {
        throw new Error('PF2e could not serialize a parseable combined damage formula.');
    }
    const reparsed = new DamageRoll(data.formula);
    if (reparsed.instances?.length !== instances.length
        || reparsed.instances.some((instance, index) => instance.type !== instances[index].type
            || instance.persistent !== instances[index].persistent)) {
        throw new Error('The serialized native damage formula changes an instance type or persistence.');
    }
    const composed = DamageRoll.fromData(data);
    if (!composed?._evaluated) throw new Error('Combined native damage lost its evaluated state.');
    if (composed.instances?.length !== instances.length) {
        throw new Error(`Combined native damage changed instance count: ${instances.length} to ${composed.instances?.length}.`);
    }
    if (composed.total !== scaled.total) {
        throw new Error(`Combined native damage changed direct total: ${scaled.total} to ${composed.total}.`);
    }
    if (composed.instances.at(-1)?.persistent !== true || composed.instances.at(-1)?.type !== 'bleed') {
        throw new Error('Combined native damage lost its terminal persistent bleed instance.');
    }
    if (!/\bbleed\b/i.test(composed.formula ?? '')) {
        throw new Error('Combined native damage display formula omits bleed.');
    }
    // PF2e normalizes redundant grouping while reconstructing a Roll, so the
    // serialized string need not be byte-identical. It must still reparse to
    // the same ordered native damage types and persistent categories.
    const serializedFormula = composed.toJSON().formula;
    if (typeof serializedFormula !== 'string' || !DamageRoll.validate(serializedFormula)) {
        throw new Error('Combined native damage serialized an unparseable formula.');
    }
    const roundTrip = new DamageRoll(serializedFormula);
    if (roundTrip.instances?.length !== instances.length
        || roundTrip.instances.some((instance, index) => instance.type !== instances[index].type
            || instance.persistent !== instances[index].persistent)) {
        throw new Error('Combined native damage serialization changes an instance type or persistence.');
    }
    if (JSON.stringify(composed.options) !== JSON.stringify(scaled.options)) {
        const keys = new Set([...Object.keys(scaled.options ?? {}), ...Object.keys(composed.options ?? {})]);
        const changed = [...keys].filter(key => JSON.stringify(scaled.options?.[key]) !== JSON.stringify(composed.options?.[key]));
        throw new Error(`Combined native damage changed roll options: ${changed.join(', ') || 'key order'}.`);
    }
    return composed;
}
