// Strike-prelude spells: the caster makes the spell's Strike with PF2e. A reminder on the card says so, and
// additional damage on a hit ("if you hit, you deal an additional 3d8 sonic damage") is added to that Strike's own
// damage roll by a PF2e damage-dice Effect on the caster, so it combines with the Strike's damage before
// resistances and doubles on a critical hit. The Effect lasts until the end of the caster's turn and is removed after
// the caster's next Strike damage roll.
const MODULE_ID = "pf2e-automatic-resolution";

/** A card reminder's text for the card. */
export function reminderHTML(reminder, escapeHTML) {
    if (reminder.kind === "strike-prelude") return `<p class="pf2e-auto-gm-reminder"><strong>Strike:</strong> ${escapeHTML(reminder.text)} <em>Make it with PF2e's own Strike; PF2e rolls and applies its damage.</em></p>`;
    if (reminder.kind === "lodged-removal") return `<p class="pf2e-auto-gm-reminder"><strong>GM:</strong> ${escapeHTML(reminder.text)}</p>`;
    if (reminder.kind === "nonlethal") return `<p class="pf2e-auto-gm-reminder"><strong>GM:</strong> ${escapeHTML(reminder.text)} <em>A living creature this reduces to 0 Hit Points falls unconscious instead of dying; PF2e doesn't track this, so adjust it yourself.</em></p>`;
    if (reminder.kind === "caster-movement") return `<p class="pf2e-auto-gm-reminder"><strong>Caster:</strong> ${escapeHTML(reminder.text)} <em>Move your token yourself after the attack; the module doesn't.</em></p>`;
    if (reminder.kind === "attack-cover") return `<p class="pf2e-auto-gm-reminder"><strong>GM:</strong> ${escapeHTML(reminder.text)} <em>Leave the target's cover and concealment out of this attack yourself; the module doesn't track them.</em></p>`;
    // Light or darkness the spell counteracts where it passes or lands: the GM names it; the card's button rolls.
    if (["counteract-along-path", "counteract-overlap"].includes(reminder.kind)) return `<p class="pf2e-auto-gm-reminder"><strong>GM:</strong> ${escapeHTML(reminder.text)} <em>If magical ${escapeHTML(reminder.target)} is ${reminder.kind === "counteract-overlap" ? "in the area" : "along the path or on the target"}, use Counteract to roll the caster's counteract check against it.</em></p>`;
    // (Its own counteract modifier and rank: Incarnate Deific Herald's Midnight Wrath.)
    if (reminder.kind === "counteract-fixed") return `<p class="pf2e-auto-gm-reminder"><strong>GM:</strong> ${escapeHTML(reminder.text)} <em>Put out the non-magical ${escapeHTML(reminder.target)} yourself; for each magical ${escapeHTML(reminder.target)} in the area, use Counteract (+${escapeHTML(reminder.modifier)}, counteract rank ${escapeHTML(reminder.rank)}).</em></p>`;
    if (reminder.kind === "removal") return `<p class="pf2e-auto-gm-reminder"><strong>GM:</strong> ${escapeHTML(reminder.text)} <em>When the creature has done so, remove its persistent damage condition; what this spell linked to it ends with it.</em></p>`;
    if (reminder.kind === "object-damage") return `<p class="pf2e-auto-gm-reminder"><strong>GM:</strong> ${escapeHTML(reminder.text)} <em>Apply it to them yourself; the module resolves creatures only.</em></p>`;
    if (reminder.kind === "failed-save-follow-up") return `<p class="pf2e-auto-gm-reminder"><strong>Caster:</strong> ${escapeHTML(reminder.text)} <em>For each target that fails; make this check yourself.</em></p>`;
    // Creatures pulled into the area before the saves: the reminder's text says it all.
    if (reminder.kind === "caster-elects-success") return `<p class="pf2e-auto-gm-reminder"><strong>Caster:</strong> ${escapeHTML(reminder.text)}</p>`;
    // A basic save's push rider: the spared caster, and the area's heightened size (the text's; PF2e's data has none).
    if (["caster-spared", "heightened-area", "trait-note", "caster-movement"].includes(reminder.kind)) return `<p class="pf2e-auto-gm-reminder"><strong>GM:</strong> ${escapeHTML(reminder.text)}</p>`;
    if (reminder.kind === "willing-choice") return `<p class="pf2e-auto-gm-reminder"><strong>GM:</strong> ${escapeHTML(reminder.text)}</p>`;
    if (reminder.kind === "willing-no-save") return `<p class="pf2e-auto-gm-reminder"><strong>GM:</strong> ${escapeHTML(reminder.text)}</p>`;
    if (reminder.kind === "object-push") return `<p class="pf2e-auto-gm-reminder"><strong>GM:</strong> ${escapeHTML(reminder.text)}</p>`;
    if (["object-hardness", "shield-blocked", "surroundings", "mark-note", "option-note", "hardness-by-damage", "illusion-note", "auto-critical-failure", "sustain-attack-note", "object-branch", "save-or-skill", "weapon-critical"].includes(reminder.kind)) return `<p class="pf2e-auto-gm-reminder"><strong>GM:</strong> ${escapeHTML(reminder.text)}</p>`;
    if (reminder.kind === "counteract-spell") return `<p class="pf2e-auto-gm-reminder"><strong>GM:</strong> ${escapeHTML(reminder.text.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1"))} <em>Use Counteract to roll the caster's counteract check against it.</em></p>`;
    if (reminder.kind === "hardness") return `<p class="pf2e-auto-gm-reminder"><strong>GM:</strong> ${escapeHTML(reminder.text)}</p>`;
    if (reminder.kind === "placement") return `<p class="pf2e-auto-gm-reminder"><strong>GM:</strong> ${escapeHTML(reminder.text)}</p>`;
    if (reminder.kind === "area-pull") return `<p class="pf2e-auto-gm-reminder"><strong>GM:</strong> ${escapeHTML(reminder.text)}</p>`;
    if (reminder.kind === "strike-placement") return `<p class="pf2e-auto-gm-reminder"><strong>GM:</strong> ${escapeHTML(reminder.text)} <em>Target the creatures in the area accordingly.</em></p>`;
    return `<p class="pf2e-auto-gm-reminder"><strong>GM:</strong> ${escapeHTML(reminder.text)} <em>Resolve this counteract check yourself; the module doesn't track magical ${escapeHTML(reminder.target)}.</em></p>`;
}

/** The PF2e Effect source adding the on-hit dice to the caster's next Strike. */
export function strikeRiderSource({ spellName, reach, formula, damageType, castId, sourceItemUuid, img = "icons/svg/sword.svg" }) {
    const dice = /^(\d+)d(\d+)$/.exec(String(formula));
    if (!dice || !/^[a-z]+$/.test(damageType ?? "")) throw new Error(`${spellName}: the Strike's additional damage can't be read.`);
    return {
        name: `${spellName}: additional damage on this Strike`,
        type: "effect",
        img,
        flags: { [MODULE_ID]: { strikeRider: { castId, sourceItemUuid } } },
        system: {
            description: { value: `<p>Your next ${reach === "ranged" ? "ranged" : "melee"} Strike this turn deals an additional ${formula} ${damageType} damage if it hits. Removed after that Strike's damage roll.</p>` },
            duration: { value: 0, unit: "rounds", expiry: "turn-end", sustained: false },
            rules: [{ key: "DamageDice", selector: reach === "ranged" ? "ranged-strike-damage" : "melee-strike-damage",
                diceNumber: Number(dice[1]), dieSize: `d${dice[2]}`, damageType }],
            tokenIcon: { show: true },
            traits: { value: [] }
        }
    };
}

/** Removes the caster's Strike-rider Effects once one of its Strike damage rolls is posted. */
export function registerStrikeRiders() {
    Hooks.on("createChatMessage", message => {
        // PF2e marks a Strike's damage roll with flags.pf2e.strike and its "…strike-damage" domains.
        const context = message?.flags?.pf2e?.context;
        const domains = context?.domains ?? [];
        if (context?.type !== "damage-roll" || !message.flags.pf2e.strike || !domains.includes("strike-damage")) return;
        const actor = message.actor ?? (message.speaker?.actor ? game.actors.get(message.speaker.actor) : null);
        if (!actor || !(actor.isOwner && (game.user.isGM || !game.users.some(user => user.active && user.isGM)))) return;
        // Only a rider whose dice this Strike's damage roll used (melee or ranged).
        const riders = [...(actor.itemTypes?.effect ?? [])].filter(effect => effect.flags?.[MODULE_ID]?.strikeRider
            && (effect.system?.rules ?? []).some(rule => [rule.selector].flat().some(selector => domains.includes(selector))));
        if (riders.length) actor.deleteEmbeddedDocuments("Item", riders.map(effect => effect.id), { [MODULE_ID]: { reason: "strike-rider-used" } })
            .catch(error => console.error(`${MODULE_ID} | The Strike's additional-damage Effect could not be removed.`, error));
    });
}

/**
 * The caster's latest PF2e Strike attack against this target, made after the card appeared: the message PF2e posts
 * for a Strike (an "attack-roll" context with the "strike-attack-roll" domain) whose target is the card's target.
 * Null if none yet.
 */
export function findStrikeMessage({ casterUuid, targetActorUuid, targetTokenUuid = null, after = 0 }, messages = game.messages?.contents ?? []) {
    const matches = messages.filter(message => {
        const context = message?.flags?.pf2e?.context;
        // PF2e's Strike attack rolls carry the "strike-attack-roll" domain.
        if (context?.type !== "attack-roll" || !(context.domains ?? []).includes("strike-attack-roll") || Number(message.timestamp ?? 0) < after) return false;
        if ((message.actor?.uuid ?? null) !== casterUuid) return false;
        const target = context.target ?? {};
        return target.actor === targetActorUuid || (targetTokenUuid && target.token === targetTokenUuid);
    });
    return matches.sort((a, b) => Number(a.timestamp) - Number(b.timestamp)).at(-1) ?? null;
}
