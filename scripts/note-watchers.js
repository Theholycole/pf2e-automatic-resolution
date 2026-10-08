// Notes the module now carries out by watching PF2e's messages (the notes audit, notes batch 4):
// - Theogeny's foes: "all enemies take 10 spirit damage whenever they're critically hit by an attack or whenever they critically fail a saving throw" —
//   the GM option's Effect carries `gmOption.watch.critPunish`.
// - Musical Shift (PF2e's Effect, its roll option): flat — "Whenever an enemy critically fails at a Strike, saving throw, or skill check, they fall Prone";
//   sharp — "Whenever an enemy takes piercing or slashing damage, they also take 2d6 persistent bleed damage".
const MODULE_ID = "pf2e-automatic-resolution";
const activeGM = () => game.user?.isGM && game.users.activeGM?.id === game.user.id;
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

const optionsOf = actor => { try { return new Set(actor?.getRollOptions?.(["all"]) ?? []); } catch (_) { return new Set(); } };

async function damage(actor, formula, type, label) {
    const DamageRoll = CONFIG.Dice.rolls.find(roll => roll.name === "DamageRoll");
    const roll = await new DamageRoll(`${formula}[${type}]`).evaluate();
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<strong>${escapeHTML(label)}</strong>` }).catch(() => null);
    const token = actor.getActiveTokens?.(true, true)?.[0];
    await actor.applyDamage({ damage: roll, token, rollOptions: new Set([`${MODULE_ID}:note-watch`]) });
    return roll.total;
}

/** PF2e's messages the watched notes follow. */
export async function noteWatchMessage(message) {
    if (!activeGM()) return [];
    const context = message.flags?.pf2e?.context;
    if (!context?.type) return [];
    const options = context.options ?? [];
    if (options.some(option => String(option).startsWith(`${MODULE_ID}:note-watch`) || String(option).startsWith("pf2e-auto-application:"))) return [];
    const roller = message.actor;
    const done = [];
    const critFailed = context.outcome === "criticalFailure";
    // Theogeny: the critically hit target, or the creature critically failing a save.
    const punished = context.type === "attack-roll" && context.outcome === "criticalSuccess" && context.target?.actor ? fromUuidSync(context.target.actor)
        : context.type === "saving-throw" && critFailed ? roller : null;
    for (const effect of punished?.itemTypes?.effect ?? []) {
        const punish = effect.flags?.[MODULE_ID]?.gmOption?.watch?.critPunish;
        if (!punish) continue;
        done.push({ theogeny: await damage(punished, punish.formula, punish.type, `${effect.flags[MODULE_ID].gmOption.spell}: ${punished.name} is ${context.type === "attack-roll" ? "critically hit" : "critically failing a save"}`) });
    }
    // Musical Shift (flat): a critical failure at a Strike, a saving throw or a skill check: Prone.
    if (critFailed && roller && ["attack-roll", "saving-throw", "skill-check"].includes(context.type) && (context.type !== "attack-roll" || options.includes("action:strike") || (context.domains ?? []).includes("strike-attack-roll"))
        && optionsOf(roller).has("musical-shift:flat") && !roller.hasCondition?.("prone")) {
        await roller.increaseCondition("prone");
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: roller }), content: `<p><strong>Musical Shift</strong> (flat): ${escapeHTML(roller.name)} critically failed and falls Prone.</p>` }); } catch (_) {}
        done.push({ prone: roller.name });
    }
    // Musical Shift (sharp): piercing or slashing damage taken: 2d6 persistent bleed.
    if (context.type === "damage-taken" && roller && optionsOf(roller).has("musical-shift:sharp") && options.some(option => /(?:^|:)damage:type:(?:piercing|slashing)$/.test(String(option)))) {
        const source = (await fromUuid("Compendium.pf2e.conditionitems.Item.lDVqvLKA6eF3Df60").catch(() => null))?.toObject();
        if (source) {
            source.system.persistent = { formula: "2d6", damageType: "bleed", dc: 15 };
            await roller.createEmbeddedDocuments("Item", [source]);
            try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: roller }), content: `<p><strong>Musical Shift</strong> (sharp): ${escapeHTML(roller.name)} takes 2d6 persistent bleed damage.</p>` }); } catch (_) {}
            done.push({ bleed: roller.name });
        }
    }
    // Dynamic Daze: the caster's next attack roll against the holder uses its off-guard, then the note goes.
    const attacked = context.type === "attack-roll" && roller && context.target?.actor ? fromUuidSync(context.target.actor) : null;
    const consumed = (attacked?.itemTypes?.effect ?? []).filter(effect => effect.flags?.[MODULE_ID]?.runtime?.consumedBySourceAttack && effect.flags[MODULE_ID].runtime.sourceActorUuid === roller.uuid);
    if (consumed.length) { await attacked.deleteEmbeddedDocuments("Item", consumed.map(effect => effect.id)); done.push({ consumed: attacked.name }); }
    // Residual Bad Luck: a failed attack roll or skill check while the note lasts — its frightened isn't reduced as that turn ends.
    if (roller && ["attack-roll", "skill-check"].includes(context.type) && ["failure", "criticalFailure"].includes(context.outcome)) {
        const note = (roller.itemTypes?.effect ?? []).find(effect => effect.flags?.[MODULE_ID]?.runtime?.conditionHold?.slug === "frightened");
        if (note && !roller.getFlag(MODULE_ID, "frightenedHold")) {
            await roller.setFlag(MODULE_ID, "frightenedHold", { source: note.name, at: game.time.worldTime, value: Number(roller.getCondition?.("frightened")?.value ?? 0) });
            done.push({ frightenedHold: roller.name });
        }
    }
    return done;
}

/** The end of a creature's turn (after PF2e reduces its conditions): a held frightened put back. */
export async function noteWatchEndTurn(combatant) {
    const actor = combatant?.actor;
    // (A note's floor — "cannot reduce their frightened condition below 1 for the duration of the spell" (The End is Nigh): put back after PF2e's reduction.)
    const floor = Math.max(0, ...(actor?.itemTypes?.effect ?? []).map(effect => effect.flags?.[MODULE_ID]?.runtime?.conditionFloor).filter(entry => entry?.slug === "frightened").map(entry => Number(entry.value)));
    if (activeGM() && floor > 0) {
        await new Promise(resolve => setTimeout(resolve, 400));
        const now = Number(actor.getCondition?.("frightened")?.value ?? 0);
        if (now < floor) {
            if (now === 0) await actor.increaseCondition("frightened", { value: floor });
            else await actor.getCondition("frightened").update({ "system.value.value": floor });
            try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p>${escapeHTML(actor.name)}'s frightened can't go below ${floor} while the spell lasts.</p>` }); } catch (_) {}
        }
    }
    const hold = actor?.getFlag?.(MODULE_ID, "frightenedHold");
    if (!activeGM() || !hold) return null;
    await actor.unsetFlag(MODULE_ID, "frightenedHold");
    // (After PF2e's own reduction settles: its frightened back to what it was when it failed, if still lower.)
    await new Promise(resolve => setTimeout(resolve, 400));
    const now = Number(actor.getCondition?.("frightened")?.value ?? 0), held = Number(hold.value ?? 0);
    if (held <= now) return { held: actor.name, unchanged: true };
    if (now === 0) await actor.increaseCondition("frightened", { value: held });
    else await actor.getCondition("frightened").update({ "system.value.value": held });
    try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p><strong>${escapeHTML(hold.source)}</strong>: ${escapeHTML(actor.name)} failed a check, so its frightened isn't reduced this turn.</p>` }); } catch (_) {}
    return { held: actor.name };
}
