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
        const index = await pack.getIndex({ fields: ["name", "type", "system.rules"] });
        this.#catalog = new Map();
        for (const entry of index) {
            const profile = {
                id: entry._id,
                name: entry.name,
                type: entry.type,
                sourceFile: PACK_ID,
                automation: automationProfile(entry)
            };
            this.#catalog.set(entry.name, profile);
            this.#catalog.set(entry._id, profile);
        }
        return this.#catalog;
    }

    clear() {
        this.#catalog = null;
    }
}
