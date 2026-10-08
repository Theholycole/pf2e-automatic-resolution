const PACK_ID = "pf2e.spell-effects";

function automationProfile(entry) {
    const rules = entry.system?.rules ?? [];
    return {
        ruleKeys: [...new Set(rules.map(rule => rule.key).filter(Boolean))],
        requiresConfiguration: rules.some(rule => rule.key === "ChoiceSet"),
        removesAfterRoll: rules.some(rule => rule.removeAfterRoll != null)
    };
}

export class NativeEffectCatalog {
    #catalog = null;

    async get({ refresh = false } = {}) {
        if (this.#catalog && !refresh) return this.#catalog;
        const pack = game.packs.get(PACK_ID);
        if (!pack) throw new Error(`Required PF2e compendium ${PACK_ID} is unavailable.`);
        const index = await pack.getIndex({ fields: ["name", "type", "system.rules", "system.duration", "system.start", "system.badge"] });
        this.#catalog = new Map();
        for (const entry of index) {
            const profile = {
                id: entry._id,
                name: entry.name,
                type: entry.type,
                sourceFile: PACK_ID,
                automation: automationProfile(entry),
                mechanics: {
                    rules: structuredClone(entry.system?.rules ?? []),
                    duration: structuredClone(entry.system?.duration ?? null),
                    start: structuredClone(entry.system?.start ?? null)
                },
                ...(entry.system?.badge ? { badge: structuredClone(entry.system.badge) } : {})
            };
            this.#catalog.set(entry.name, profile);
            this.#catalog.set(entry._id, profile);
        }
        // (The active modules' Effects — third-party spells link their own: indexed after PF2e's, which keep their names.)
        for (const modulePack of game.packs.filter(candidate => candidate.metadata?.packageType === "module" && candidate.documentName === "Item")) {
            let moduleIndex;
            try { moduleIndex = await modulePack.getIndex({ fields: ["name", "type", "system.rules", "system.duration", "system.start", "system.badge"] }); } catch (_) { continue; }
            for (const entry of moduleIndex) {
                if (entry.type !== "effect" || this.#catalog.has(entry._id)) continue;
                const profile = { id: entry._id, name: entry.name, type: entry.type, sourceFile: modulePack.collection, automation: automationProfile(entry),
                    mechanics: { rules: structuredClone(entry.system?.rules ?? []), duration: structuredClone(entry.system?.duration ?? null), start: structuredClone(entry.system?.start ?? null) },
                    ...(entry.system?.badge ? { badge: structuredClone(entry.system.badge) } : {}) };
                if (!this.#catalog.has(entry.name)) this.#catalog.set(entry.name, profile);
                this.#catalog.set(entry._id, profile);
            }
        }
        return this.#catalog;
    }

    clear() {
        this.#catalog = null;
    }
}
