export const SUPPORTED_RESOLUTION_KINDS = Object.freeze([
    // (The caster's action count asked on the card, then that version's own plan: Dynamic Shield.)
    "action-versions",
    // (Parts run in order — an Effect, then an attack card: Dynamic Gouging Claw's three actions.)
    "compound",
    "effect",
    "effect-variant",
    "effect-choice",
    "effect-sequence",
    "generated-form",
    "healing",
    "direct-damage",
    "spell-note",
    "effect-note",
    "condition-note",
    "stabilize",
    "retaliation",
    "temp-hp",
    "turn-healing",
    "healing-pulse",
    "self-pulse",
    "thrall-strike",
    "offer-effect",
    "size-bond",
    "weapon-throw",
    "spell-mark",
    "temporary-shield",
    "aid-prepare",
    "aura-turn-effect",
    "check-bonus",
    "climb-aid",
    "stride-hide",
    "cloud-action",
    "granted-block",
    "action-mode-effect",
    "command-list",
    "thought-choice",
    "ally-aura",
    "area-boon",
    "escape-aura",
    "option-veil",
    "repulsion-aura",
    "fortifications",
    "lantern-aura",
    "sun-aura",
    "blood-mark",
    "radiant-field",
    "conjured-weapons",
    "mythic-launch",
    "burrow-ward",
    "web-area",
    "spirit-aid",
    "plant-form",
    "illusory-creature",
    "ritual-outcome",
    "sustained-save-damage",
    "terrain-area",
    "concealing-area",
    "against-caster-area",
    "darkness-area",
    "spell-maneuver",
    "object-damage",
    "hazard-area",
    "damaging-wall",
    "incarnate",
    "steal-damage",
    "image-decoys",
    "mirror-duplicate",
    "action-tale",
    "brand-mark",
    "prophecy",
    "winning-streak",
    "martyr-redirect",
    "rally-banner",
    "rune-ward",
    "luminance",
    "strike-ward",
    "interval-heal",
    "hp-pact",
    "minion-horde",
    "mischief-modes",
    "check-mark",
    "weapon-imbue",
    "protection-circle",
    "stored-burst",
    "familiar-swarm",
    "seed-drain",
    "scene-cost",
    "sustain-options",
    "stored-charge",
    "shared-temp-hp",
    "color-armor",
    "imbued-hazard",
    "rust-grasp",
    "death-ward",
    "grab-attack",
    "bloom-area",
    "struck-wall",
    "replica",
    "protagonist",
    "challenge",
    "color-ray",
    "radiant-heart",
    "spell-steal",
    "boast",
    "color-wall",
    "flash-cloak",
    "ward",
    "skill-demoralize",
    "fume-cloud",
    "frenzy",
    "option-mantle",
    "force-hand",
    "rewrite-fate",
    "sacrifice-heal",
    "guardian",
    "countermeasure",
    "tentacle-area",
    "flesh-wall",
    "blink-strike",
    "soul-vessel",
    "skill-counteract",
    "rock-mud",
    "tree-pair",
    "disc-throw",
    "servitor",
    "mire-cloak",
    "ember-double",
    "gore-field",
    "strike-heal",
    "stance-strike",
    "cannibal-hunger",
    "spell-storm",
    "giant-thrall",
    "thrall-create",
    "repeat-save",
    "restore-condition",
    "level-tiers",
    "thrall-summon",
    "portal-pair",
    "dance-darkness",
    "ritual-degrees",
    "wisps",
    "stored-armor",
    "deferred-save",
    "cauterize",
    "dismantle",
    "light-aura",
    "hyphae",
    "outline",
    "causeway",
    "battle-form",
    "counteract-transfer",
    "bonus-effect",
    "substitute-roll",
    "secret-flat-check",
    "repeat-check",
    "retro-bonus",
    "redirect-damage",
    "delayed-damage",
    "interposing-cover",
    "spell-strike",
    "sustain-other",
    "pull-toward",
    "prompt-escape",
    "spell-shield",
    "spellshape-duration",
    "spellshape-effect",
    "rebound-barrier",
    "save-upgrade",
    "shared-save-better",
    "save-replacement",
    "perception-against-dc",
    "marching-song",
    "shared-lore",
    "unarmed-reach",
    "attack-ward",
    "strike-absorber",
    "summon",
    "rule-set",
    "stated-effect",
    "condition-lower",
    "mark-ward",
    "trigger-aura",
    "pulse-area",
    "proxy-cast",
    "caster-dominion",
    "renewal",
    "attribute-surgery",
    "crystal-garden",
    "marionette",
    "dream-hazard",
    "fate-roll",
    "engulfing-tree",
    "weapon-grapple",
    "dream-table",
    "honor-duel",
    "spotlight",
    "creeper-maneuver",
    "rally-cry",
    "true-power",
    "mystic-bomb",
    "spirit-boundary",
    "divine-seeds",
    "power-prism",
    "animated-spark",
    "patron-apocalypse",
    "conjured-item",
    "suppression-save",
    "item-repair",
    "hide-reaction",
    "aid-attack",
    "seek-whistle",
    "form-choice",
    "lure-save",
    "cover-square",
    "save-retry",
    "shrub-wall",
    "scene-walls",
    "hp-transfer",
    "damage-share"
]);

function inRankRange(branch, castRank) {
    return castRank >= branch.minRank
        && (branch.maxRank === null || castRank <= branch.maxRank);
}

export function selectRankBranch(selector, castRank) {
    const rank = Number(castRank);
    if (!Number.isInteger(rank) || rank < 1) {
        throw new Error("A positive integer cast rank is required.");
    }
    const matches = (selector?.branches ?? []).filter(branch => inRankRange(branch, rank));
    if (matches.length !== 1) {
        throw new Error(`Cast rank ${rank} matched ${matches.length} Effect branches; expected exactly one.`);
    }
    return matches[0];
}

export function selectChoiceBranch(selector, choiceId) {
    if (!choiceId) throw new Error("An Effect choice is required.");
    const matches = (selector?.branches ?? []).filter(branch => branch.choiceId === choiceId);
    if (matches.length !== 1) {
        throw new Error(`Choice ${JSON.stringify(choiceId)} matched ${matches.length} Effect branches; expected exactly one.`);
    }
    return matches[0];
}

export function selectApplications(plan, { castRank = null, choiceId = null } = {}) {
    const resolution = plan?.resolution;
    if (!SUPPORTED_RESOLUTION_KINDS.includes(resolution?.kind)) {
        throw new Error(`Resolution kind ${JSON.stringify(resolution?.kind)} is not executable by this runtime.`);
    }

    if (resolution.kind === "effect") return [resolution.applications[0]];
    if (resolution.kind === "effect-sequence") return [resolution.applications[0]];
    if (resolution.kind === "effect-variant") {
        const branch = selectRankBranch(resolution.selector, castRank);
        return [resolution.applications.find(application => application.uuid === branch.effectUuid
            && application.rankRange?.minRank === branch.minRank
            && application.rankRange?.maxRank === branch.maxRank)];
    }
    const branch = selectChoiceBranch(resolution.selector, choiceId);
    return [resolution.applications.find(application =>
        application.uuid === branch.effectUuid && application.choiceId === branch.choiceId)];
}

export function effectForApplication(plan, application) {
    if (!application) throw new Error("The selected application is missing from the compiled plan.");
    const collection = {
        "nativeEffects.onUse": plan.nativeEffects?.onUse,
        "nativeEffects.rankVariants": plan.nativeEffects?.rankVariants,
        "nativeEffects.choiceVariants": plan.nativeEffects?.choiceVariants
    }[application.source] ?? [];
    const matches = collection.filter(effect => effect.uuid === application.uuid
        && (!application.choiceId || effect.choiceId === application.choiceId)
        && (!application.rankRange
            || (effect.rankRange?.minRank === application.rankRange.minRank
                && effect.rankRange?.maxRank === application.rankRange.maxRank)));
    if (matches.length !== 1) {
        throw new Error(`Application ${application.uuid} matched ${matches.length} native Effect specifications; expected exactly one.`);
    }
    return matches[0];
}

/**
 * "Heightened (7th) The duration increases to 1 hour.": the duration the created Effect takes at this cast rank,
 * or null when the template's own duration applies. The template must still have the duration it was compiled with.
 */
export function heightenedEffectDuration(application, templateDuration, castRank) {
    const heightened = application?.heightenedDuration;
    if (!heightened) return null;
    const branch = (heightened.branches ?? []).find(candidate => inRankRange(candidate, Number(castRank)));
    if (!branch) return null;
    if (Number(templateDuration?.value) !== Number(heightened.template?.value) || templateDuration?.unit !== heightened.template?.unit) {
        throw new Error("The Effect's duration changed since the spell was compiled; its heightened duration can't be set.");
    }
    return { value: branch.value, unit: branch.unit };
}

export function recipientActorType(effect, castRank) {
    if (effect?.recipient?.actor !== "rank-dependent") return effect?.recipient?.actor ?? null;
    return selectRankBranch({ branches: effect.recipient.branches }, castRank).actor;
}
