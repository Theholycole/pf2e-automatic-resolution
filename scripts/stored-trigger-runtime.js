// Stored-trigger spells (Animus Mine, Bandit's Doom, Crescent Scepter): casting sets a marker Effect on the caster,
// tracked in Ongoing spells for the spell's duration. When the trigger happens, the GM (or the caster's owner) targets
// the triggering creature and uses "Trigger <spell>": an ordinary save card opens for it, and the spell ends (or, for a
// trigger any number of creatures can set off, stays set).
import { assertSpellNotLost, dropMissedTargets } from "./casting-rules-runtime.js";
import { isExecutableStoredTriggerPlan, storedPoolHp, storedTriggerExposurePlan, detonationPlan } from "./basic-save-core.js";
import { escapeHTML, randomID, MODULE_ID } from "./runtime-utils.js";
import { disbeliefPain } from "./disbelief-pain.js";
import { ONGOING_FLAG } from "./ongoing-core.js";
import { nativeConditionTiming } from "./condition-timing.js";
import { applyDamageWithReceipt } from "./native-damage-receipt.js";
import { heightenedComponentFormula } from "../src/compiler/retaliation.js";
import { tokenDistance } from "./token-distance.js";
import { createNativeEffect, loadNativeEffectTemplate, prepareNativeEffectSource } from "./native-outcome-effects.js";
import { prepareConditionGrantSource } from "./note-effects.js";
import { castSpellFromUuid } from './cast-spell.js';

function markerDuration(seconds) {
    for (const [unit, size] of [["days", 86400], ["hours", 3600], ["minutes", 60]]) if (seconds % size === 0) return { value: seconds / size, unit };
    return { value: Math.ceil(seconds / 60), unit: "minutes" };
}

export class StoredTriggerRuntime {
    ongoing = null;
    saves = null;

    supports(plan) { return isExecutableStoredTriggerPlan(plan); }

    async start(spell, plan, { sourceActor = spell?.actor, castRank = spell?.rank, sourceMessageId = null, targets = null } = {}) {
        // (A spell lost to a disruption or a counterspell has no effect: casting-rules-runtime.js.)
        assertSpellNotLost(sourceMessageId);
        // (A concealed or hidden target the spell's flat check missed is left out.)
        targets = dropMissedTargets(sourceMessageId, targets) ?? targets;
        if (!this.supports(plan)) throw new Error(`${plan?.source?.name ?? "Spell"} is not an executable stored-trigger spell.`);
        const stored = plan.resolution.storedTrigger;
        if (stored.held) return this.#startHeld(spell, plan, { sourceActor, castRank, sourceMessageId, targets: targets ?? [...(game.user?.targets ?? [])] });
        // "The newer casting supersedes the older": end the caster's earlier casting of this spell.
        if (stored.supersedes) for (const journal of this.ongoing.records()) {
            const record = journal.getFlag(MODULE_ID, ONGOING_FLAG);
            if (record?.status === "active" && record.sourceActorUuid === sourceActor.uuid && record.entries?.some(entry => entry.metadata?.storedTrigger && entry.metadata.sourceItemSlug === plan.source.slug))
                await this.ongoing.end(journal, { reason: "superseded" });
        }
        const castInstanceId = randomID();
        const metadata = { schema: 1, kind: "stored-trigger", castInstanceId, sourceActorUuid: sourceActor.uuid, sourceItemUuid: spell.uuid, sourceItemName: spell.name,
            sourceItemSlug: plan.source.slug, castRank: Number(castRank), storedTrigger: stored };
        const notes = [...stored.notes, ...stored.rowNotes.map(note => `${note.degree}: ${note.text}`)];
        // PF2e's own Effect as the marker (Draconic Barrage): its toggle holds the chosen damage type.
        if (stored.effectMarker) {
            const template = await loadNativeEffectTemplate(stored.effectMarker.uuid);
            if (!template) throw new Error(`${spell.name}: PF2e's ${stored.effectMarker.label} is unavailable.`);
            const source = prepareNativeEffectSource(template, metadata);
            // The trigger and its notes on PF2e's Effect ("… you can't cast it again for 10 minutes").
            source.system.description = { value: `${source.system.description?.value ?? ""}<p><strong>${escapeHTML(spell.name)}</strong>: ${escapeHTML(stored.trigger)} Use “Trigger ${escapeHTML(spell.name)}” in Ongoing spells with that creature targeted${stored.endsOnTrigger === false ? "" : "; the spell then ends"}.</p>${notes.map(note => `<p>${escapeHTML(note)}</p>`).join("")}` };
            const marker = await createNativeEffect(sourceActor, source);
            // (A sustained spell's record ends when a Sustain is missed.)
            const journal = await this.ongoing.begin({ castId: castInstanceId, name: spell.name, kind: "native", sourceActorUuid: sourceActor.uuid, sourceItemUuid: spell.uuid, recipientUuids: [sourceActor.uuid],
                ...(stored.sustained ? { sustained: true, castRound: this.ongoing.clock?.().round ?? 0, maximumAt: game.time.worldTime + stored.durationSeconds } : {}) });
            await this.ongoing.attach(journal, marker);
            await this.ongoing.activate(journal);
            if (sourceMessageId) try { await game.messages.get(sourceMessageId)?.setFlag(MODULE_ID, "ongoingCastId", castInstanceId); } catch (_) {}
            return { status: "set", castId: castInstanceId, effectUuid: marker.uuid };
        }
        const [effect] = await sourceActor.createEmbeddedDocuments("Item", [{
            name: stored.images ? `${spell.name} (${stored.images.noun}s: ${stored.images.start})` : `${spell.name} (waiting for its trigger)`, type: "effect", img: spell.img,
            flags: { [MODULE_ID]: { runtime: metadata, ...(stored.images ? { images: stored.images.start } : {}) } },
            system: { level: { value: Number(castRank) }, duration: stored.markerDuration ? { ...stored.markerDuration, sustained: false } : { ...markerDuration(stored.durationSeconds), expiry: null, sustained: false },
                // "Until the beginning of your next turn" counts from the caster's turn in combat.
                start: { value: game.time.worldTime, initiative: stored.markerDuration ? (game.combat?.combatants.find(combatant => combatant.actor?.uuid === sourceActor.uuid)?.initiative ?? null) : null },
                fromSpell: true, rules: [], context: { origin: { actor: sourceActor.uuid, item: spell.uuid }, target: { actor: sourceActor.uuid }, roll: null },
                description: { value: `<p><strong>${escapeHTML(spell.name)}</strong>: ${escapeHTML(stored.trigger)} Use “Trigger ${escapeHTML(spell.name)}” in Ongoing spells with that creature targeted${stored.endsOnTrigger ? "; the spell then ends" : ", each time a creature does"}.</p>${notes.map(note => `<p>${escapeHTML(note)}</p>`).join("")}` } }
        }]);
        // A sustained aura (or images): a missed Sustain ends it.
        const journal = await this.ongoing.begin({ castId: castInstanceId, name: spell.name, kind: "native", sourceActorUuid: sourceActor.uuid, sourceItemUuid: spell.uuid, recipientUuids: [sourceActor.uuid],
            ...((stored.aura || stored.images) && stored.sustained ? { sustained: true, castRound: this.ongoing.clock?.().round ?? 0, maximumAt: game.time.worldTime + stored.durationSeconds } : {}) });
        await this.ongoing.attach(journal, effect);
        await this.ongoing.activate(journal);
        if (sourceMessageId) try { await game.messages.get(sourceMessageId)?.setFlag(MODULE_ID, "ongoingCastId", castInstanceId); } catch (_) {}
        return { status: "set", castId: castInstanceId, effectUuid: effect.uuid };
    }

    /** A trigger held on the cast's target: the marker goes on that creature, for its next turn or while sustained. */
    async #startHeld(spell, plan, { sourceActor, castRank, sourceMessageId, targets }) {
        const stored = plan.resolution.storedTrigger;
        if (targets.length !== 1) throw new Error(`${spell.name}: target the one creature the spell is cast on.`);
        const token = targets[0].document ?? targets[0];
        const target = token.actor;
        if (!target) throw new Error(`${spell.name}: the targeted token has no actor.`);
        const castInstanceId = randomID();
        const combat = game.combat;
        const initiativeOf = uuid => combat?.combatants.find(combatant => combatant.actor?.uuid === uuid)?.initiative ?? null;
        let duration, initiative;
        const poolHp = stored.pool ? storedPoolHp(stored.pool, Number(castRank), Number(plan.rank) || 1) : null;
        if (stored.pool) {
            // The spell's own duration, counted from the cast.
            duration = { ...markerDuration(stored.durationSeconds), expiry: "turn-start", sustained: false };
            initiative = initiativeOf(sourceActor.uuid);
        } else if (stored.sustained) {
            duration = { ...markerDuration(stored.durationSeconds), expiry: "turn-start", sustained: false };
            initiative = initiativeOf(sourceActor.uuid);
        } else {
            // "on its next turn": until the end of the target's next turn.
            const cast = { value: game.time.worldTime, started: combat?.started === true, turn: combat?.turn ?? 0, turnActors: (combat?.turns ?? []).map(turn => turn.actor?.uuid ?? null) };
            const timing = nativeConditionTiming(stored.markerDuration, cast, sourceActor.uuid, target.uuid);
            duration = { value: timing.value, unit: "rounds", expiry: "turn-end", sustained: false };
            initiative = initiativeOf(target.uuid);
        }
        const metadata = { schema: 1, kind: "stored-trigger", castInstanceId, sourceActorUuid: sourceActor.uuid, sourceItemUuid: spell.uuid, sourceItemName: spell.name,
            sourceItemSlug: plan.source.slug, castRank: Number(castRank), storedTrigger: stored, targetActorUuid: target.uuid, targetTokenUuid: token.uuid, targetName: token.name,
            ...(stored.pool ? { poolHp } : {}),
            // (The cast's message: its spellshapes apply when the spell is triggered — Fury of a Thousand on Murmuration.)
            ...(sourceMessageId ? { sourceMessageId } : {}) };
        const [effect] = await target.createEmbeddedDocuments("Item", [{
            name: stored.pool ? `${spell.name} (${stored.pool.label}: ${poolHp} HP)` : `${spell.name} (waiting for its trigger)`, type: "effect", img: spell.img,
            flags: { [MODULE_ID]: { runtime: metadata, ...(stored.pool ? { poolHp } : {}) } },
            system: { level: { value: Number(castRank) }, duration, start: { value: game.time.worldTime, initiative },
                fromSpell: true, rules: [], context: { origin: { actor: stored.sustained ? sourceActor.uuid : target.uuid, item: spell.uuid }, target: { actor: target.uuid }, roll: null },
                description: { value: stored.pool ? `<p><strong>${escapeHTML(spell.name)}</strong>: the ${escapeHTML(stored.pool.label)} has ${poolHp} Hit Points.</p>${stored.notes.map(note => `<p>${escapeHTML(note)}</p>`).join("")}`
                    : `<p><strong>${escapeHTML(spell.name)}</strong>: ${escapeHTML(stored.trigger)} Use “Trigger ${escapeHTML(spell.name)}” in Ongoing spells when it does${stored.endsOnTrigger ? "; the spell then ends" : ""}.</p>${stored.notes.map(note => `<p>${escapeHTML(note)}</p>`).join("")}` } }
        }]);
        const journal = await this.ongoing.begin({ castId: castInstanceId, name: spell.name, kind: "native", sourceActorUuid: sourceActor.uuid, sourceItemUuid: spell.uuid, recipientUuids: [target.uuid],
            ...(stored.sustained ? { sustained: true, castRound: this.ongoing.clock?.().round ?? 0, maximumAt: game.time.worldTime + stored.durationSeconds } : {}) });
        await this.ongoing.attach(journal, effect);
        // (A rule on the caster for the spell's time — Pact Broker's penalty to Lie to a target that accepted: its toggle.)
        let casterEffect = null;
        if (stored.casterRules) {
            const rules = [{ key: "RollOption", domain: "all", option: stored.casterRules.toggle.option, toggleable: true, label: stored.casterRules.toggle.label, value: false }, ...foundry.utils.deepClone(stored.casterRules.rules)];
            [casterEffect] = await sourceActor.createEmbeddedDocuments("Item", [{ name: `${spell.name} (${target.name})`, type: "effect", img: spell.img,
                flags: { [MODULE_ID]: { runtime: { schema: 1, kind: "stored-trigger-caster", castInstanceId, sourceActorUuid: sourceActor.uuid, sourceItemUuid: spell.uuid, sourceItemName: spell.name, targetActorUuid: sourceActor.uuid } } },
                system: { level: { value: Number(castRank) }, duration, start: { value: game.time.worldTime, initiative }, rules,
                    description: { value: `<p>Switch on “${escapeHTML(stored.casterRules.toggle.label)}” once ${escapeHTML(target.name)} accepts.</p>` } } }]);
            await this.ongoing.attach(journal, casterEffect);
        }
        await this.ongoing.activate(journal);
        if (sourceMessageId) try { await game.messages.get(sourceMessageId)?.setFlag(MODULE_ID, "ongoingCastId", castInstanceId); } catch (_) {}
        return { status: "set", castId: castInstanceId, effectUuid: effect.uuid, ...(casterEffect ? { casterEffectUuid: casterEffect.uuid } : {}) };
    }

    /**
     * Thorns set off: the trigger's damage (no save) at the cast rank on the targeted creature. A spell whose duration shrinks with each
     * hit loses a round; at none left, it ends.
     */
    async retaliate({ castId, uuid, index, targetUuid, count = null }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("retaliate", { castId, uuid, index, targetUuid, count });
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const metadata = entry?.metadata;
        const trigger = metadata?.retaliation?.triggers?.[index];
        if (!trigger) throw new Error("This spell isn't set to retaliate.");
        const caster = await fromUuid(metadata.sourceActorUuid);
        if (!user.isGM && !caster?.testUserPermission(user, "OWNER")) throw new Error("You don't control this spell.");
        // A guarded ally's retaliation hits only the recorded enemy.
        if (trigger.fixedTarget === "enemy" && targetUuid !== metadata.guard?.enemyTokenUuid) throw new Error(`${metadata.sourceItemName}: it only harms ${metadata.guard?.enemyName ?? "the enemy it was cast against"}.`);
        const token = await fromUuid(targetUuid);
        const actor = token?.actor;
        if (!actor) throw new Error(`${metadata.sourceItemName}: target the creature that set it off.`);
        if (actor.uuid === metadata.sourceActorUuid) throw new Error(`${metadata.sourceItemName}: target the creature that set it off, not the caster.`);
        const { damage } = trigger;
        const height = metadata.retaliation.heightening;
        let formula;
        if (damage.byCount) {
            // How many Strikes hit this turn (1 to the maximum): that entry's damage.
            if (!Number.isInteger(count) || count < 1 || count > damage.byCount.length) throw new Error(`${metadata.sourceItemName}: choose how many Strikes hit (1–${damage.byCount.length}).`);
            formula = String(damage.byCount[count - 1]).replace(/@item\.(?:rank|level)/g, String(metadata.castRank));
        } else if (damage.componentId) {
            const steps = height?.type === "interval" ? Math.floor((metadata.castRank - metadata.baseRank) / height.interval) : 0;
            formula = heightenedComponentFormula(damage.formula, height?.damage?.[damage.componentId], steps);
        } else formula = String(damage.formula).replace(/@item\.(?:rank|level)/g, String(metadata.castRank));
        const DamageRoll = (CONFIG.Dice?.rolls ?? []).find(candidate => candidate?.name === "DamageRoll");
        const roll = await new DamageRoll(`(${formula})[${damage.persistent ? `persistent,${damage.type}` : damage.type}]`).evaluate();
        try { await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: caster }), flavor: `<strong>${escapeHTML(metadata.sourceItemName)}</strong>: ${escapeHTML(token.name)} — ${escapeHTML(trigger.trigger)}` }); } catch (_) {}
        const spell = await castSpellFromUuid(metadata);
        const receipt = await applyDamageWithReceipt(actor, { damage: roll, token, item: spell ?? undefined, rollOptions: new Set(), skipIWR: false }, randomID());
        let ended = false;
        if (metadata.retaliation.shortenPerHit) {
            const effect = await fromUuid(entry.uuid);
            const remaining = Number(effect?.remainingDuration?.remaining ?? 0);
            const rounds = Math.floor(remaining / 6) - 1;
            if (rounds < 1) { await this.ongoing.end(journal, { reason: "duration" }); ended = true; }
            else await effect.update({ "system.duration": { value: rounds, unit: "rounds", expiry: "turn-start", sustained: false },
                "system.start": { value: game.time.worldTime, initiative: game.combat?.combatants?.find(combatant => combatant.actor?.uuid === metadata.sourceActorUuid)?.initiative ?? null } });
        }
        return { status: "retaliated", total: roll.total, formula: roll.formula, receipt, ended };
    }

    /** Draw Blood: the creature with this note took bleed damage — the caster regains the stated Hit Points (at the cast rank). */
    async triggeredHealing({ castId, uuid }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("triggered-healing", { castId, uuid });
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const healing = entry?.metadata?.triggeredHealing;
        if (!healing) throw new Error("This creature has no triggered healing.");
        const caster = await fromUuid(entry.metadata.sourceActorUuid);
        if (!caster) throw new Error("The caster is gone.");
        if (!user.isGM && !caster.testUserPermission(user, "OWNER")) throw new Error("You don't control this spell.");
        const rank = Number(healing.castRank);
        const amount = Number(/^max\((\d+), ?@item\.rank\)$/.exec(healing.formula)?.[1] ?? NaN);
        if (!Number.isFinite(amount) || !Number.isFinite(rank)) throw new Error("The healing formula can't be read at the cast rank.");
        const total = Math.max(amount, rank);
        const token = caster.getActiveTokens?.()?.[0]?.document ?? null;
        const before = Number(caster.system?.attributes?.hp?.value ?? 0);
        const receipt = await applyDamageWithReceipt(caster, { damage: -total, token, skipIWR: true, rollOptions: new Set() }, randomID());
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }),
            content: `<p><strong>${escapeHTML(entry.metadata.sourceItemName)}</strong>: ${escapeHTML(healing.targetName ?? "the target")} took bleed damage; ${escapeHTML(caster.name)} regains ${total} Hit Points.</p>` }); } catch (_) {}
        return { status: "healed", total, gained: Number(caster.system?.attributes?.hp?.value ?? 0) - before, receipt };
    }

    /** The Everfull Moon's Fuel: the temporary Hit Points at the cast rank (temporary Hit Points don't stack: the higher stays). */
    async fuelForm({ castId, uuid }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("fuel-form", { castId, uuid });
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const fuel = entry?.metadata?.fuelForm;
        const caster = entry ? await fromUuid(entry.metadata.sourceActorUuid) : null;
        if (!fuel || !caster) throw new Error("This spell can't be Fueled.");
        if (!user.isGM && !caster.testUserPermission(user, "OWNER")) throw new Error("You don't control this spell.");
        const current = Number(caster.system?.attributes?.hp?.temp ?? 0);
        if (fuel.tempHP > current) await caster.update({ "system.attributes.hp.temp": fuel.tempHP });
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), content: `<p><strong>${escapeHTML(entry.metadata.sourceItemName)}</strong>: Fueled — ${fuel.tempHP} temporary Hit Points${fuel.tempHP > current ? "" : " (the current ones are as high)"}.</p>` }); } catch (_) {}
        return { status: "fueled", tempHP: Number(caster.system?.attributes?.hp?.temp ?? 0) };
    }

    /**
     * Fungal Hyphae's plant Strike: the caster's spell attack (with the multiple attack penalty the caster gives) against the targeted creature's
     * AC; on a hit the damage, doubled on a critical hit, with PF2e's IWR.
     */
    async plantStrike({ castId, uuid, targetUuid, map = 0 }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("plant-strike", { castId, uuid, targetUuid, map });
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const strike = entry?.metadata?.plantStrike;
        const caster = entry ? await fromUuid(entry.metadata.sourceActorUuid) : null;
        if (!strike || !caster) throw new Error("This spell has no plant Strikes.");
        if (!user.isGM && !caster.testUserPermission(user, "OWNER")) throw new Error("You don't control this spell.");
        const token = targetUuid ? await fromUuid(targetUuid) : null;
        const target = token?.actor;
        if (!target) throw new Error("Target the creature first.");
        const spell = await castSpellFromUuid(entry.metadata);
        const statistic = spell?.spellcasting?.statistic;
        if (!statistic) throw new Error(`${entry.metadata.sourceItemName}: the caster's spell attack is unavailable.`);
        const penalty = [0, -5, -10][Number(map)] ?? 0;
        const modifiers = penalty ? [new game.pf2e.Modifier({ label: "Multiple attack penalty", slug: "multiple-attack-penalty", modifier: penalty, type: "untyped" })] : [];
        const roll = await statistic.check.roll({ dc: { value: Number(target.armorClass?.value ?? target.system?.attributes?.ac?.value) }, extraRollOptions: ["action:strike", "spell-attack"], modifiers, skipDialog: true });
        const degree = roll?.degreeOfSuccess ?? null;
        if (degree === null || degree < 2) return { status: "missed", degree };
        const DamageRoll = (CONFIG.Dice?.rolls ?? []).find(candidate => candidate?.name === "DamageRoll");
        const damage = await new DamageRoll(degree === 3 ? `(2*(${strike.formula}))[${strike.type}]` : `(${strike.formula})[${strike.type}]`).evaluate();
        try { await damage.toMessage({ speaker: ChatMessage.getSpeaker({ actor: caster }), flavor: `<strong>${escapeHTML(entry.metadata.sourceItemName)}</strong>: a plant Strike at ${escapeHTML(token.name)}${degree === 3 ? " (critical hit)" : ""}` }); } catch (_) {}
        const receipt = await applyDamageWithReceipt(target, { damage, token, item: spell ?? undefined, rollOptions: new Set(), skipIWR: false }, randomID());
        return { status: "hit", degree, formula: damage.formula, total: damage.total, receipt };
    }

    /** Cauterize Wounds' repeat (1 action, concentrate): seal the targeted creature, which must be one of the spell's targets. */
    async cauterize({ castId, uuid, targetUuid }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("cauterize", { castId, uuid, targetUuid });
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const data = entry?.metadata?.cauterize;
        const caster = entry ? await fromUuid(entry.metadata.sourceActorUuid) : null;
        if (!data || !caster) throw new Error("This spell isn't active.");
        if (!user.isGM && !caster.testUserPermission(user, "OWNER")) throw new Error("You don't control this spell.");
        const target = targetUuid ? await fromUuid(targetUuid) : null;
        const actor = target?.actor ?? target;
        if (!actor || !data.targetUuids.includes(actor.uuid)) throw new Error(`${entry.metadata.sourceItemName}: target one of the spell's targets.`);
        const { cauterizeTarget } = await import("./effect-runtime.js");
        return cauterizeTarget(actor, data, { castInstanceId: castId, castRank: entry.metadata.castRank, sourceActor: caster, itemOrSource: await castSpellFromUuid(entry.metadata), spellName: entry.metadata.sourceItemName });
    }

    /**
     * Albatross Curse: the target killed the albatross. Its save against the spell DC; the success's condition (1 round), or the row's PF2e
     * Effect (its roll twice removed after that roll); the first Effect ends.
     */
    async deferredSave({ castId, uuid, degree = null }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("deferred-save", { castId, uuid, degree });
        if (!user.isGM) throw new Error("The GM decides when the target does it.");
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const effect = entry ? await fromUuid(uuid) : null;
        const data = effect?.flags?.[MODULE_ID]?.runtime?.deferredSave;
        const actor = effect?.actor;
        if (!data || !actor) throw new Error("This creature has no pending save from the spell.");
        const runtime = effect.flags[MODULE_ID].runtime;
        // (A degree given by the GM — a test or a reroll they've already made — else PF2e's save.)
        let result = degree;
        if (!result) {
            const roll = await actor.saves?.[data.statistic]?.roll({ dc: { value: data.dc }, skipDialog: true, extraRollOptions: ["deferred-save"] });
            result = ["criticalFailure", "failure", "success", "criticalSuccess"][roll?.degreeOfSuccess ?? -1];
        }
        if (!["criticalSuccess", "success", "failure", "criticalFailure"].includes(result)) throw new Error("The save's result is unknown.");
        const row = data.rows[result];
        const created = [];
        const base = { castId, castInstanceId: castId, castRank: runtime.castRank, sourceActorUuid: runtime.sourceActorUuid, sourceItemUuid: runtime.sourceItemUuid, sourceItemName: runtime.sourceItemName, targetActorUuid: actor.uuid };
        if (row?.condition) {
            const template = await fromUuid(row.condition.uuid);
            const [grant] = await actor.createEmbeddedDocuments("Item", [prepareConditionGrantSource(row.condition, template, { ...base,
                duration: { mode: "fixed", value: row.condition.rounds, unit: "rounds", expiry: "turn-start", anchor: "effect-start" } })]);
            if (grant) created.push(grant);
        } else if (row?.effect) {
            const template = await loadNativeEffectTemplate(row.effect.uuid);
            if (!template) throw new Error(`${runtime.sourceItemName}: PF2e's ${row.effect.label} is unavailable.`);
            created.push(await createNativeEffect(actor, prepareNativeEffectSource(template, { ...base, schema: 1, kind: "deferred-save-row", ruleOverrides: data.ruleOverrides })));
        }
        for (const document of created) await this.ongoing.attach(journal, document);
        await effect.delete();
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: await fromUuid(runtime.sourceActorUuid) }),
            content: `<p><strong>${escapeHTML(runtime.sourceItemName)}</strong>: ${escapeHTML(actor.name)} killed the ${escapeHTML(data.trigger)} — ${escapeHTML(result.replace(/([A-Z])/g, " $1").toLowerCase())}${created.length ? `: ${escapeHTML(created.map(document => document.name).join(", "))}` : ""}.</p>` }); } catch (_) {}
        return { status: "resolved", degree: result, created: created.map(document => document.name) };
    }

    /**
     * Mirror's Misfortune: the attacker of the duplicate saves against the spell DC; a failing row's misfortune — its next attack rolls (that many)
     * rolled twice keeping the lower, for the row's time — and the duplicate shatters (the caster's Effect ends: the token goes, the spell ends).
     */
    async mirrorShatter({ castId, uuid, targetUuid, degree = null }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("mirror-shatter", { castId, uuid, targetUuid, degree });
        if (!user.isGM) throw new Error("The GM decides when the duplicate is attacked.");
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const effect = entry ? await fromUuid(uuid) : null;
        const data = effect?.flags?.[MODULE_ID]?.runtime?.mirrorDuplicate;
        const attacker = targetUuid ? await fromUuid(targetUuid) : null;
        if (!data) throw new Error("The duplicate is already gone.");
        if (!attacker?.saves) throw new Error("Target the creature that attacked the duplicate.");
        const runtime = effect.flags[MODULE_ID].runtime;
        let result = degree;
        if (!result) {
            const roll = await attacker.saves?.[data.statistic]?.roll({ dc: { value: data.dc }, skipDialog: true, extraRollOptions: ["mirror-shatter"] });
            result = ["criticalFailure", "failure", "success", "criticalSuccess"][roll?.degreeOfSuccess ?? -1];
        }
        if (!["criticalSuccess", "success", "failure", "criticalFailure"].includes(result)) throw new Error("The save's result is unknown.");
        const row = data.rows[result];
        let created = null;
        if (row) {
            // (Its own time — "within the next hour" — not the spell's: it outlives the shattered duplicate.)
            const hours = row.seconds % 3600 === 0;
            [created] = await attacker.createEmbeddedDocuments("Item", [{ name: `${runtime.sourceItemName}: misfortune (${row.count} attack rolls)`, type: "effect", img: "icons/svg/daze.svg",
                system: { duration: { value: hours ? row.seconds / 3600 : row.seconds / 60, unit: hours ? "hours" : "minutes", expiry: null, sustained: false },
                    start: { value: game.time.worldTime, initiative: game.combat?.combatant?.initiative ?? null }, level: { value: Number(runtime.castRank) },
                    description: { value: `<p>${escapeHTML(row.sourceText)}</p><p>Removed after its ${row.count} attack rolls.</p>` },
                    // (PF2e would remove it after the first roll; the module counts the rolls.)
                    rules: [{ key: "RollTwice", selector: "attack-roll", keep: "lower", removeAfterRoll: false }] },
                // (Its own record: it outlives the spell, so it isn't the shattered cast's entry.)
                flags: { [MODULE_ID]: { runtime: { schema: 1, kind: "mirror-misfortune", castInstanceId: randomID(), sourceActorUuid: runtime.sourceActorUuid, sourceItemUuid: runtime.sourceItemUuid,
                    sourceItemName: runtime.sourceItemName, consumeOn: { on: "attack-roll", count: row.count } } } } }]);
        }
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: await fromUuid(runtime.sourceActorUuid) }),
            content: `<p><strong>${escapeHTML(runtime.sourceItemName)}</strong>: ${escapeHTML(attacker.name)} shattered the duplicate — ${escapeHTML(result.replace(/([A-Z])/g, " $1").toLowerCase())}${created ? `: ${escapeHTML(created.name)}` : ""}. The spell ends.</p>` }); } catch (_) {}
        await this.ongoing.end(journal, { reason: "duplicate-shattered" });
        return { status: "shattered", degree: result, created: created ? created.name : null };
    }

    /**
     * Flame Wisp: "strike" sends a wisp at the targeted creature (the dice at the cast rank, with PF2e's IWR) and spends it; "regrow" adds one
     * (a spell of the stated trait was cast) up to the maximum.
     */
    async wisp({ castId, uuid, action, targetUuid = null }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("wisp", { castId, uuid, action, targetUuid });
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const effect = entry ? await fromUuid(uuid) : null;
        const wisps = effect?.flags?.[MODULE_ID]?.runtime?.wisps;
        if (!wisps || !["strike", "regrow"].includes(action)) throw new Error("This spell has no wisps.");
        const caster = await fromUuid(entry.metadata.sourceActorUuid);
        if (!user.isGM && !caster?.testUserPermission(user, "OWNER")) throw new Error("You don't control this spell.");
        let count = Number(wisps.count), result = { status: "unchanged" };
        if (action === "regrow") {
            if (count >= wisps.max) throw new Error(`${entry.metadata.sourceItemName}: already ${wisps.max} wisps.`);
            count += 1; result = { status: "regrown" };
        } else {
            if (count <= 0) throw new Error(`${entry.metadata.sourceItemName}: no wisps left.`);
            const token = targetUuid ? await fromUuid(targetUuid) : null;
            if (!token?.actor) throw new Error("Target the creature the Strike damaged.");
            const DamageRoll = (CONFIG.Dice?.rolls ?? []).find(candidate => candidate?.name === "DamageRoll");
            const roll = await new DamageRoll(`(${wisps.formula})[${wisps.type}]`).evaluate();
            try { await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: caster }), flavor: `<strong>${escapeHTML(entry.metadata.sourceItemName)}</strong>: a wisp hurtles at ${escapeHTML(token.name)}` }); } catch (_) {}
            const spell = await castSpellFromUuid(entry.metadata);
            const receipt = await applyDamageWithReceipt(token.actor, { damage: roll, token, item: spell ?? undefined, rollOptions: new Set(), skipIWR: false }, randomID());
            count -= 1; result = { status: "damaged", formula: roll.formula, total: roll.total, receipt };
        }
        await effect.update({ name: effect.name.replace(/\(\d+ wisps?\)/, `(${count} wisp${count === 1 ? "" : "s"})`), [`flags.${MODULE_ID}.runtime.wisps.count`]: count });
        return { ...result, count };
    }

    /**
     * Mirror Image: an attack hit ("hit"), critically hit ("critical") or missed without critically failing ("miss") the caster. A hit or
     * critical hit rolls the stated die for the images left (the low numbers hit the caster); a hit image is destroyed — and a critical hit
     * that hit an image becomes a hit on the caster; a miss destroys an image. The last image ends the spell.
     */
    async decoy({ castId, uuid, result, attackerUuid = null }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("decoy", { castId, uuid, result, attackerUuid });
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const effect = entry ? await fromUuid(uuid) : null;
        const decoys = effect?.flags?.[MODULE_ID]?.runtime?.imageDecoys;
        if (!decoys || !["hit", "critical", "miss"].includes(result)) throw new Error("This spell has no images, or the attack's result is unknown.");
        const caster = await fromUuid(entry.metadata.sourceActorUuid);
        if (!user.isGM && !caster?.testUserPermission(user, "OWNER")) throw new Error("You don't control this spell.");
        let images = Number(decoys.images), outcome, roll = null;
        if (result === "miss") { images -= 1; outcome = "The attack destroys an image and has no other effect."; }
        else {
            const chance = decoys.chances[String(images)];
            roll = await new Roll(`1d${chance.die}`).evaluate();
            if (roll.total <= chance.max) outcome = result === "critical" ? "The attack hits you: a critical hit." : "The attack hits you.";
            else { images -= 1; outcome = result === "critical" ? "It hits an image (destroyed); the attack becomes a hit against you." : "It hits an image instead (destroyed); the attack misses you."; }
            try { await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: caster }), flavor: `${escapeHTML(entry.metadata.sourceItemName)}: ${decoys.images} image${decoys.images === 1 ? "" : "s"} left (1–${chance.max} hits you)` }); } catch (_) {}
        }
        // Chromatic Image: a destroyed image's color, rolled; its row on the attacker (the GM targets it).
        let color = null;
        if (decoys.colors && images < Number(decoys.images)) {
            const attackerToken = attackerUuid ? await fromUuid(attackerUuid) : null;
            const attacker = attackerToken?.actor ?? null;
            const colorRoll = await new Roll(`1d${decoys.colors.die}`).evaluate();
            const row = decoys.colors.rows.find(candidate => candidate.face === colorRoll.total);
            try { await colorRoll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: caster }), flavor: `${escapeHTML(entry.metadata.sourceItemName)}: the destroyed image was ${escapeHTML(row?.label ?? "?")}` }); } catch (_) {}
            color = { face: colorRoll.total, label: row?.label ?? null, applied: false };
            if (row && attacker) {
                const DamageRoll = (CONFIG.Dice?.rolls ?? []).find(candidate => candidate?.name === "DamageRoll");
                const roll = await new DamageRoll(`{${row.damage.join(",")}}`).evaluate();
                try { await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: caster }), flavor: `<strong>${escapeHTML(entry.metadata.sourceItemName)}</strong>: ${escapeHTML(row.label)} — ${escapeHTML(attacker.name)}` }); } catch (_) {}
                const spell = await castSpellFromUuid(entry.metadata);
                await applyDamageWithReceipt(attacker, { damage: roll, token: attackerToken.object ?? attackerToken, item: spell ?? undefined, rollOptions: new Set(), skipIWR: false }, randomID());
                if (row.condition) {
                    // (PF2e adds the value to an existing condition: raise it to the row's value, never lower it.)
                    const current = Number(attacker.getCondition?.(row.condition.slug)?.value ?? 0);
                    if (!row.condition.value) { if (!attacker.hasCondition?.(row.condition.slug)) await attacker.increaseCondition(row.condition.slug); }
                    else if (current < row.condition.value) await attacker.increaseCondition(row.condition.slug, { value: row.condition.value - current });
                }
                color.applied = true;
            }
            outcome = `${outcome} The image was ${row?.label ?? "?"}${row && !attacker ? " (target the attacker and apply it by hand)" : ""}.`;
        }
        const ended = images <= 0;
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), content: `<p><strong>${escapeHTML(entry.metadata.sourceItemName)}</strong>: ${escapeHTML(outcome)} ${ended ? "The last image is gone; the spell ends." : `${images} image${images === 1 ? "" : "s"} left.`}</p>`,
            // (Fearcracker: an image destroyed, and by whom — catalyst-runtime.js.)
            flags: { [MODULE_ID]: { kind: "image-decoys", castId, images, result, destroyed: images < Number(decoys.images), attackerUuid } } }); } catch (_) {}
        if (ended) await this.ongoing.end(journal, { reason: "images-destroyed" });
        else if (images !== decoys.images) await effect.update({ name: effect.name.replace(/\(\d+ images?\)/, `(${images} image${images === 1 ? "" : "s"})`), [`flags.${MODULE_ID}.runtime.imageDecoys.images`]: images });
        return { status: ended ? "ended" : "resolved", hitsCaster: /hits you|becomes a hit/.test(outcome), critical: /critical hit\./.test(outcome), images, roll: roll?.total ?? null, color };
    }

    /**
     * An illusion's disbelief (Phantasmal Treasure): the creature interacted with it. Its Perception against the spell DC; on a success the
     * spell ends (every Effect of the cast with it).
     */
    async disbelieve({ castId, uuid }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("disbelieve", { castId, uuid });
        if (!user.isGM) throw new Error("The GM decides when a creature interacts with the illusion.");
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const disbelieve = entry?.metadata?.disbelieve;
        if (!disbelieve || !Number.isFinite(disbelieve.dc)) throw new Error("This creature has no illusion to disbelieve.");
        const actor = (await fromUuid(uuid))?.actor;
        // (A Will save, or nothing to roll when it disbelieves automatically; Perception otherwise.)
        const statistic = disbelieve.statistic === "will" ? actor?.saves?.will : actor?.perception;
        if (disbelieve.needs !== "automatic" && !statistic?.roll) throw new Error(`The creature's ${disbelieve.statistic === "will" ? "Will save" : "Perception"} is unavailable.`);
        const Modifier = game.pf2e?.Modifier;
        const penalty = disbelieve.penalty && Modifier ? [new Modifier({ slug: "disbelieve-penalty", label: "Trusts its false senses", modifier: disbelieve.penalty.value, type: disbelieve.penalty.type })] : [];
        if (disbelieve.penalty && !Modifier) throw new Error("PF2e's Modifier class is unavailable for the disbelief penalty.");
        const roll = disbelieve.needs === "automatic" ? null : await statistic.roll({ dc: { value: disbelieve.dc }, extraRollOptions: ["action:disbelieve"], skipDialog: true, modifiers: penalty });
        const degree = roll?.degreeOfSuccess ?? null;
        // (And Yet it Still Hurts: an attempt hurts, whatever its result.)
        if (roll) await disbeliefPain({ casterUuid: record.sourceActorUuid, itemUuid: record.sourceItemUuid ?? null, rank: record.rank ?? record.castRank, target: actor, spellName: record.name }).catch(() => null);
        const disbelieved = disbelieve.needs === "automatic" || Number(degree) >= (disbelieve.needs === "criticalSuccess" ? 3 : 2);
        if (disbelieved && disbelieve.endsSpell) await this.ongoing.end(journal, { reason: "disbelieved" });
        // (Only this creature's note: the illusion stays for the others.)
        else if (disbelieved) await (await fromUuid(uuid))?.delete();
        return { status: disbelieved ? "disbelieved" : "believed", degree, ended: disbelieved && disbelieve.endsSpell };
    }

    /**
     * Mind Probe: the caster asks a question; the creature's Deception against the spell DC decides what the caster learns (whispered to the GM):
     * a failure gives the answer, a success withholds it, a critical success gives a false answer the caster believes.
     */
    async questionCheck({ castId, uuid }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("question-check", { castId, uuid });
        if (!user.isGM) throw new Error("The GM rolls the creature's check.");
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const question = entry?.metadata?.questionCheck;
        if (!question || !Number.isFinite(question.dc)) throw new Error("This creature has no question to answer.");
        const actor = (await fromUuid(uuid))?.actor;
        const statistic = actor?.skills?.[question.skill];
        if (!statistic?.roll) throw new Error(`The creature's ${question.skill} is unavailable.`);
        const Modifier = game.pf2e?.Modifier;
        if (question.penalty && !Modifier) throw new Error("PF2e's Modifier class is unavailable for the penalty.");
        const modifiers = question.penalty ? [new Modifier({ slug: "question-penalty", label: entry.metadata.sourceItemName, modifier: question.penalty.value, type: question.penalty.type })] : [];
        const roll = await statistic.roll({ dc: { value: question.dc }, skipDialog: true, modifiers, rollMode: "gmroll" });
        const degree = Number(roll?.degreeOfSuccess ?? 0);
        const outcome = degree >= 3 ? "a false answer the caster believes is true" : degree === 2 ? "no answer: the caster doesn't learn it" : "the true answer";
        await ChatMessage.create({ whisper: ChatMessage.getWhisperRecipients("GM").map(each => each.id), speaker: { alias: entry.metadata.sourceItemName },
            content: `<p><strong>${entry.metadata.sourceItemName}</strong>: ${actor.name}'s ${question.skill} ${["critical failure", "failure", "success", "critical success"][degree]} — the caster gets ${outcome}. (The same question always gets this result.)</p>`,
            flags: { [MODULE_ID]: { questionCheck: { castId, actorUuid: actor.uuid, degree } } } });
        return { status: degree >= 3 ? "false-answer" : degree === 2 ? "withheld" : "answered", degree };
    }

    /**
     * Unsettling Knowledge: the creature's Recall Knowledge (the caster's chosen skill) against the spell DC ends its fascination; it then becomes
     * frightened, and on a failed check its frightened can't drop below the floor for the rest of the note's time (a locked granted condition).
     */
    async recallEscape({ castId, uuid, skill }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("recall-escape", { castId, uuid, skill });
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const escape = entry?.metadata?.recallEscape;
        if (!escape || !Number.isFinite(escape.dc)) throw new Error("This creature has no knowledge to recall.");
        if (!escape.skills.includes(skill)) throw new Error(`Recall Knowledge with one of: ${escape.skills.join(", ")}.`);
        const note = await fromUuid(uuid), actor = note?.actor;
        if (!actor?.skills?.[skill]?.roll) throw new Error("The creature's skill is unavailable.");
        if (!user.isGM && !actor.testUserPermission(user, "OWNER")) throw new Error("The creature's owner or the GM rolls it.");
        const roll = await actor.skills[skill].roll({ dc: { value: escape.dc }, skipDialog: true, extraRollOptions: ["action:recall-knowledge"] });
        const degree = Number(roll?.degreeOfSuccess ?? 0);
        // The fascination ends: this cast's outcome Effect granting it.
        const fascination = (actor.itemTypes?.effect ?? []).filter(effect => effect.flags?.[MODULE_ID]?.outcomeEffect?.sourceItemUuid === entry.metadata.sourceItemUuid
            && (effect.flags[MODULE_ID].outcomeEffect.conditions ?? []).some(condition => condition.slug === "fascinated"));
        if (fascination.length) await actor.deleteEmbeddedDocuments("Item", fascination.map(effect => effect.id));
        const current = Number(actor.getCondition?.("frightened")?.value ?? 0);
        if (current < escape.frightened) await actor.increaseCondition("frightened", { value: current ? escape.frightened - current : escape.frightened });
        let floor = false;
        if (degree < 2) {
            const template = await fromUuid("Compendium.pf2e.conditionitems.Item.TBSHQspnbcqxsmjL");
            const remaining = note.system?.duration ? { value: note.system.duration.value, unit: note.system.duration.unit, expiry: note.system.duration.expiry ?? null, sustained: false } : { value: 1, unit: "minutes", expiry: null, sustained: false };
            await actor.createEmbeddedDocuments("Item", [{ name: `${entry.metadata.sourceItemName}: frightened can't go below ${escape.floor}`, type: "effect", img: template?.img ?? "icons/svg/terror.svg",
                flags: { [MODULE_ID]: { recallFloor: { castId } } },
                system: { duration: remaining, start: note.system?.start ?? { value: game.time.worldTime }, description: { value: `<p>The creature can't reduce its frightened condition below ${escape.floor} for the rest of the spell's duration.</p>` },
                    rules: [{ key: "GrantItem", uuid: "Compendium.pf2e.conditionitems.Item.TBSHQspnbcqxsmjL", flag: "conditionFloor", allowDuplicate: true,
                        alterations: [{ mode: "override", property: "badge-value", value: escape.floor }], onDeleteActions: { granter: "cascade", grantee: "restrict" } }] } }]);
            floor = true;
        }
        await note.delete();
        return { status: degree >= 2 ? "understood" : "failed", degree, frightened: Number(actor.getCondition?.("frightened")?.value ?? 0), floor };
    }

    /**
     * The creature failed an attack roll or skill check (Delusional Pride): the penalty until the end of its turn (of its next turn when it rolled
     * outside its turn), raised to the second value on a second failure while it lasts.
     */
    async triggeredPenalty({ castId, uuid }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("triggered-penalty", { castId, uuid });
        if (!user.isGM) throw new Error("The GM reports it.");
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const penalty = entry?.metadata?.triggeredPenalty;
        if (!penalty) throw new Error("This creature has no penalty to take.");
        const actor = (await fromUuid(uuid))?.actor;
        if (!actor) throw new Error("The creature is gone.");
        const held = (actor.itemTypes?.effect ?? []).find(effect => effect.flags?.[MODULE_ID]?.triggeredPenalty?.castId === castId && !effect.isExpired);
        const [first, second] = penalty.values;
        const ownTurn = game.combat?.started && game.combat.combatant?.actor?.uuid === actor.uuid;
        const rules = value => penalty.selectors.map(selector => ({ key: "FlatModifier", selector, type: penalty.type, value, label: entry.metadata.sourceItemName }));
        if (held) {
            await held.update({ "system.rules": rules(second), [`flags.${MODULE_ID}.triggeredPenalty.value`]: second, name: `${entry.metadata.sourceItemName}: ${second} penalty` });
            return { status: "raised", value: second };
        }
        await actor.createEmbeddedDocuments("Item", [{ name: `${entry.metadata.sourceItemName}: ${first} penalty`, type: "effect", img: "icons/svg/downgrade.svg",
            flags: { [MODULE_ID]: { triggeredPenalty: { castId, value: first } } },
            system: { duration: { value: ownTurn ? 0 : 1, unit: "rounds", expiry: "turn-end", sustained: false },
                start: { value: game.time.worldTime, initiative: game.combat?.combatant?.initiative ?? null },
                description: { value: `<p>${first} ${penalty.type} penalty to attack rolls and skill checks until the end of ${ownTurn ? "its turn" : "its next turn"}.</p>` }, rules: rules(first) } }]);
        return { status: "penalized", value: first };
    }

    /** The GM reports what raises the creature's condition (Censure Falsehoods' lies): its value goes up by 1, to the stated maximum. */
    async triggeredIncrease({ castId, uuid }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("triggered-increase", { castId, uuid });
        if (!user.isGM) throw new Error("The GM reports it.");
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const increase = entry?.metadata?.triggeredIncrease;
        if (!increase) throw new Error("This creature has no condition to raise.");
        const note = await fromUuid(uuid), actor = note?.actor;
        if (!actor) throw new Error("The creature is gone.");
        if (increase.once && note.getFlag(MODULE_ID, "increaseUsed")) throw new Error(`${entry.metadata.sourceItemName}: that only happens the first time.`);
        const current = Number(actor.getCondition?.(increase.slug)?.value ?? 0);
        if (current >= increase.maximum) return { status: "at-maximum", value: current };
        // (PF2e's increase adds 1, clamped to the maximum.)
        await actor.increaseCondition(increase.slug, { max: increase.maximum });
        if (increase.once) await note.setFlag(MODULE_ID, "increaseUsed", true);
        return { status: "raised", value: Number(actor.getCondition?.(increase.slug)?.value ?? current + 1) };
    }

    /** The creature's action to end the spell (Croak Voice's throat massage): its save against the spell DC, once a round when stated; a success ends it. */
    async endSave({ castId, uuid }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("end-save", { castId, uuid });
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const save = entry?.metadata?.endSave;
        if (!save || !Number.isFinite(save.dc)) throw new Error("This creature has no save to end the spell.");
        const note = await fromUuid(uuid), actor = note?.actor;
        if (!actor?.saves?.[save.statistic]?.roll) throw new Error("The creature's save is unavailable.");
        if (!user.isGM && !actor.testUserPermission(user, "OWNER")) throw new Error("The creature's owner or the GM rolls it.");
        const round = game.combat?.started ? `${game.combat.id}:${game.combat.round}` : null;
        if (save.oncePerRound && round && note.getFlag(MODULE_ID, "endSaveRound") === round) throw new Error(`${entry.metadata.sourceItemName}: ${actor.name} already tried this round.`);
        if (round) await note.setFlag(MODULE_ID, "endSaveRound", round);
        const roll = await actor.saves[save.statistic].roll({ dc: { value: save.dc }, skipDialog: true });
        const degree = roll?.degreeOfSuccess ?? null;
        // ("must succeed a total of two saving throws": the successes are counted on the note.)
        let ended = Number(degree) >= 2;
        if (ended && Number(save.successes) > 1) {
            const count = Number(note.getFlag(MODULE_ID, "endSaveSuccesses") ?? 0) + 1;
            await note.setFlag(MODULE_ID, "endSaveSuccesses", count);
            if (count < Number(save.successes)) return { status: "continues", degree, ended: false, successes: count };
        }
        // (Only this creature's part, then its immunity: the cast's Effects on it end, the others' go on.)
        if (ended && save.scope === "creature") {
            const mine = record.entries.filter(candidate => candidate.status === "active" && candidate.actorUuid === actor.uuid);
            for (const candidate of mine) { const effect = await fromUuid(candidate.uuid); if (effect) await effect.delete({ [MODULE_ID]: { ongoingCleanup: true, reason: "saved" } }); }
            // (Or only on a critical success, keyed by the spell: Oneiric Mire's disbelief.)
            const immunity = save.immunity ?? (save.immunityOnCritical && Number(degree) === 3 ? { ...save.immunityOnCritical, key: String(entry.metadata.sourceItemName ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") } : null);
            if (immunity) await actor.createEmbeddedDocuments("Item", [{ name: `${entry.metadata.sourceItemName}: Temporary immunity`, type: "effect", img: "icons/svg/shield.svg",
                flags: { [MODULE_ID]: { spellImmunity: { key: immunity.key } } },
                system: { duration: { value: immunity.value, unit: immunity.unit, expiry: "turn-start", sustained: false }, start: { value: game.time.worldTime },
                    description: { value: `<p>Temporarily immune to ${entry.metadata.sourceItemName}.</p>` }, rules: [] } }]);
            return { status: "ended-for-creature", degree, ended: true };
        }
        if (ended) await this.ongoing.end(journal, { reason: "saved" });
        return { status: ended ? "ended" : "continues", degree, ended };
    }

    /**
     * An attack with a metal object against the repulsing caster (Magnetic Repulsion): the attacker gets a one-roll status penalty to its next
     * attack roll against the caster (−1, or −2 for a creature the cast marked as made of metal, raised by the heightened steps).
     */
    async metalAttack({ castId, uuid, tokenUuid }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("metal-attack", { castId, uuid, tokenUuid });
        if (!user.isGM) throw new Error("The GM decides when a creature attacks with a metal object.");
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const metal = entry?.metadata?.metalAttack;
        const attacker = (await fromUuid(tokenUuid))?.actor;
        if (!metal || !attacker) throw new Error("Target the attacking creature, with the spell active.");
        if (attacker.uuid === record.sourceActorUuid) throw new Error("Target the attacker, not the caster.");
        // (A list of actor UUIDs: flag keys with dots would be expanded.)
        const madeOfMetal = (metal.metalActors ?? []).includes(attacker.uuid);
        const value = madeOfMetal ? metal.metal : metal.base;
        const [effect] = await attacker.createEmbeddedDocuments("Item", [{ name: `${record.name}: metal attack (−${value})`, type: "effect", img: "icons/svg/downgrade.svg",
            flags: { [MODULE_ID]: { metalAttackPenalty: { castId } } },
            system: { duration: { value: 1, unit: "rounds", expiry: "turn-end", sustained: false }, start: { value: game.time.worldTime, initiative: game.combat?.combatant?.initiative ?? null },
                description: { value: `<p>−${value} status penalty to this creature's next attack roll against ${escapeHTML(entry.metadata.targetName ?? "the caster")} (it attacks with a metal object).</p>` },
                rules: [{ key: "FlatModifier", selector: "attack-roll", type: "status", value: -value, predicate: [`target:effect:${metal.slug}`], removeAfterRoll: "if-enabled", label: record.name }] } }]);
        return { status: "applied", value, madeOfMetal, effectUuid: effect.uuid };
    }

    /**
     * An illusion disbelieved by touch (Falsify Heat): the touching creature's Perception against the spell DC. On a success it sees through
     * the illusion on that target (whispered to the GM and the caster's owners); the spell goes on for everyone else.
     */
    async touchDisbelieve({ castId, uuid, tokenUuid }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("touch-disbelieve", { castId, uuid, tokenUuid });
        if (!user.isGM) throw new Error("The GM decides when a creature touches the target.");
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const disbelieve = entry?.metadata?.touchDisbelieve;
        if (!disbelieve || !Number.isFinite(Number(disbelieve.dc))) throw new Error("This creature has no illusion to disbelieve.");
        const toucher = (await fromUuid(tokenUuid))?.actor;
        const target = (await fromUuid(uuid))?.actor;
        if (!toucher?.perception?.roll) throw new Error("The touching creature's Perception is unavailable.");
        if (toucher === target) throw new Error("Target the creature that touches it, not the illusion's target.");
        const roll = await toucher.perception.roll({ dc: { value: Number(disbelieve.dc) }, extraRollOptions: ["action:disbelieve"], skipDialog: true });
        if (roll) await disbeliefPain({ casterUuid: record.sourceActorUuid, itemUuid: record.sourceItemUuid ?? null, rank: record.rank ?? record.castRank, target: toucher, spellName: record.name }).catch(() => null);
        const degree = roll?.degreeOfSuccess ?? null;
        const disbelieved = Number(degree) >= 2;
        const caster = await fromUuid(record.sourceActorUuid);
        const whisper = game.users.filter(candidate => candidate.isGM || (caster && caster.testUserPermission(candidate, "OWNER"))).map(candidate => candidate.id);
        try { await ChatMessage.create({ whisper, content: `<p><strong>${escapeHTML(record.name)}</strong>: ${escapeHTML(toucher.name)} ${disbelieved ? "sees through the illusion" : "believes the illusion"} on ${escapeHTML(target?.name ?? "the target")}.</p>` }); } catch (_) {}
        return { status: disbelieved ? "disbelieved" : "believed", degree };
    }

    /**
     * Cycle of Retribution: the creature with this note took a hostile action. It takes the spell's damage (heightened by the
     * cast rank) — once and then its part of the spell ends, once a round, or each time.
     */
    async hostileDamage({ castId, uuid, adjacentUuids = [], count = null, critical = false, damageType = null, amount = null, variant = null }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("hostile-damage", { castId, uuid, adjacentUuids, count, critical, damageType, amount, variant });
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const trigger = entry?.metadata?.triggeredDamage;
        if (!trigger) throw new Error("This creature has no triggered damage.");
        const what = { "no-move": "didn't Stride, Fly or Swim this turn", "no-escape": "didn't Escape before the spell ended", explosion: "— the lodged projectile explodes", "spell-affected": "became affected by a spell with a duration", "no-seek": "ended its turn without Seeking or otherwise trying to disbelieve its surroundings",
            "auditory-or-cast": "performed an auditory action or Cast a Spell", "spell-cast": "Cast a Spell", "move-action": "took an action with the move trait", "spell-cast-rank": `Cast a rank-${amount} spell`, daily: "went another day without sating its hunger", hourly: "went another hour without quenching its thirst", auditory: "used an action with the auditory trait", "attack-against-caster": "attempted a Strike or spell attack against the caster (the rune is discharged)", "cage-broken": "is cut by the shards of its broken cage", "weapon-hit": critical ? "was critically hit by the target weapon" : "was hit by the target weapon", "strike-wound": `took at least ${trigger.threshold} ${damageType} damage from a single Strike`, "bleed-gained": `gained persistent ${trigger.persistentType} damage (${amount})`, noncompliance: "didn't comply with the demand", "ability-used": `used ${trigger.variants?.[variant]?.label ?? "the chosen ability"}`, "creatures-damaged": `damaged ${count} different creature${count === 1 ? "" : "s"} this turn`,
            "attack-result": `made an attack that was a ${(trigger.results ?? []).map(result => result === "criticalFailure" ? "critical failure" : "failure").join(" or ")}` }[trigger.trigger] ?? "took a hostile action";
        // Warrior's Regret: the GM's count of the different creatures it damaged this turn (at most the stated number).
        if (trigger.trigger === "creatures-damaged" && !(Number.isInteger(count) && count >= 0 && count <= trigger.maxCount))
            throw new Error(`Give the number of different creatures it damaged this turn (0 to ${trigger.maxCount}).`);
        const caster = await fromUuid(entry.metadata.sourceActorUuid);
        if (!user.isGM && !caster?.testUserPermission(user, "OWNER")) throw new Error("You don't control this spell.");
        const note = await fromUuid(uuid), actor = note?.actor;
        if (!actor) throw new Error("The creature is gone.");
        const round = game.combat?.started ? `${game.combat.id}:${game.combat.round}` : null;
        if (trigger.frequency === "round" && round && note.getFlag(MODULE_ID, "hostileRound") === round) throw new Error(`${entry.metadata.sourceItemName}: ${actor.name} already took this damage this round.`);
        const scaled = trigger.trigger === "ability-used" ? { ...trigger, ...(trigger.variants?.[Number(variant)] ?? {}) } : trigger;
        const steps = scaled.heightening ? Math.max(0, Math.floor((Number(trigger.castRank) - Number(trigger.baseRank)) / scaled.heightening.interval)) : 0;
        const perStep = scaled.dice + steps * (scaled.heightening?.dice ?? 0);
        const dice = trigger.trigger === "creatures-damaged" ? perStep * count : perStep;
        // No creature damaged: no damage; a failure's curse ends ("until the target spends a complete round without intentionally damaging
        // another creature"), and a success's single turn is over.
        if (trigger.trigger === "creatures-damaged" && count === 0) {
            const ended = trigger.endsOnZero || trigger.endsSpell;
            if (ended) await note.delete();
            try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), content: `<p><strong>${escapeHTML(entry.metadata.sourceItemName)}</strong>: ${escapeHTML(actor.name)} damaged no creature this turn${ended ? "; the curse ends" : ""}.</p>` }); } catch (_) {}
            return { status: "no-damage", total: 0, formula: null, receipt: null, ended, multiplier: 1, adjacent: [] };
        }
        const DamageRoll = (CONFIG.Dice?.rolls ?? []).find(candidate => candidate?.name === "DamageRoll");
        // A lodged projectile's explosion on a critical hit: double the damage (in the roll, as PF2e's application takes no multiplier).
        // (Croak Voice's critical failure: the auditory damage doubled.)
        const doubled = ["explosion", "auditory"].includes(trigger.trigger) && Number(trigger.multiplier) === 2;
        // (A row's own formula — Frozen Lungs' "(floor(@item.rank/2))d8" — at the cast rank.)
        const formula = trigger.formula ? String(trigger.formula).replace(/@item\.(?:rank|level)\b/g, String(Number(trigger.castRank))) : null;
        if (critical && !trigger.criticalCondition) throw new Error(`${entry.metadata.sourceItemName}: a critical hit adds nothing here.`);
        // (Unravel Knowledge: the variant the GM picks — the chosen ability, or a basic or untrained one — with its own dice and heightening.)
        const chosenVariant = trigger.trigger === "ability-used" ? trigger.variants?.[Number(variant)] : null;
        if (trigger.trigger === "ability-used" && !chosenVariant) throw new Error(`${entry.metadata.sourceItemName}: choose which kind of ability it used.`);
        // (Old-Mage's Echo: the cast spell's rank the GM gives.)
        if (trigger.trigger === "spell-cast-rank" && !(Number.isInteger(Number(amount)) && Number(amount) >= 0 && Number(amount) <= 10)) throw new Error(`${entry.metadata.sourceItemName}: give the rank of the spell it cast (0 to 10).`);
        // (Achaekek's Clutch: the persistent damage's amount the GM gives — a number or dice.)
        if (trigger.trigger === "bleed-gained" && !/^\s*\d+(?:d\d+)?(?:\s*\+\s*\d+(?:d\d+)?)*\s*$/.test(String(amount ?? ""))) throw new Error(`${entry.metadata.sourceItemName}: give the persistent ${trigger.persistentType} damage's amount (for example 1d6 or 4).`);
        // (Bloodspray Curse: the wounding Strike's type, one of the row's.)
        if (trigger.trigger === "strike-wound" && !(trigger.types ?? []).includes(damageType)) throw new Error(`${entry.metadata.sourceItemName}: choose the Strike's damage type (${(trigger.types ?? []).join(" or ")}).`);
        // (Implement of Destruction's failing rows: the weapon's added damage is persistent.)
        const type = trigger.trigger === "strike-wound" ? damageType : trigger.persistent ? `persistent,${trigger.type}` : trigger.type;
        const roll = await new DamageRoll(trigger.trigger === "bleed-gained" ? `(${String(amount).trim()})[${type}]` : trigger.trigger === "spell-cast-rank" ? `${Number(trigger.perRank) * Number(amount)}[${type}]` : formula ? `(${formula})[${type}]` : doubled ? `(2*(${dice}d${scaled.die}))[${type}]` : `(${dice}d${scaled.die})[${type}]`).evaluate();
        try { await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: caster }), flavor: `<strong>${escapeHTML(entry.metadata.sourceItemName)}</strong>: ${escapeHTML(actor.name)} ${what}` }); } catch (_) {}
        const spell = await castSpellFromUuid(entry.metadata);
        const token = actor.getActiveTokens?.()?.[0]?.document;
        // A lodged projectile's explosion: doubled on a critical hit, to the creature and each adjacent creature the GM targeted.
        const multiplier = trigger.trigger === "explosion" ? Number(trigger.multiplier ?? 1) : 1;
        const options = trigger.trigger === "explosion" ? new Set(["area-damage"]) : new Set();
        const receipt = await applyDamageWithReceipt(actor, { damage: roll, token, item: spell ?? undefined, rollOptions: options, skipIWR: false }, randomID());
        const adjacent = [];
        if (trigger.trigger === "explosion" && trigger.adjacent) for (const tokenUuid of adjacentUuids ?? []) {
            const other = await fromUuid(tokenUuid);
            if (!other?.actor || other.actor.uuid === actor.uuid) continue;
            if (!token || tokenDistance(token, other) > 5) throw new Error(`${entry.metadata.sourceItemName}: ${other.name} isn't adjacent to ${actor.name}.`);
            const hit = await applyDamageWithReceipt(other.actor, { damage: roll, token: other, item: spell ?? undefined, rollOptions: new Set(options), skipIWR: false }, randomID());
            adjacent.push({ name: other.name, damage: hit.damage });
        }
        let ended = false;
        // (Weaponize Secret: the discharged rune also ends the creature's persistent damage of that type.)
        let persistentEnded = 0;
        if (trigger.endsPersistent) {
            const persistent = (actor.itemTypes?.condition ?? []).filter(condition => condition.slug === "persistent-damage" && condition.system?.persistent?.damageType === trigger.endsPersistent);
            if (persistent.length) { await actor.deleteEmbeddedDocuments("Item", persistent.map(condition => condition.id)); persistentEnded = persistent.length; }
        }
        // "As success, but the Strike also deals an additional … bleed damage.": the extra persistent roll at the cast rank.
        let extra = null;
        if (trigger.extra) {
            const extraRoll = await new DamageRoll(`(${String(trigger.extra.formula).replace(/@item\.(?:rank|level)\b/g, String(Number(trigger.castRank)))})[${trigger.extra.persistent ? "persistent," : ""}${trigger.extra.type}]`).evaluate();
            try { await extraRoll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: caster }), flavor: `<strong>${escapeHTML(entry.metadata.sourceItemName)}</strong>: ${escapeHTML(actor.name)} also takes the ${escapeHTML(trigger.extra.type)}` }); } catch (_) {}
            const extraReceipt = await applyDamageWithReceipt(actor, { damage: extraRoll, token, item: spell ?? undefined, rollOptions: new Set(), skipIWR: false }, randomID());
            extra = { formula: extraRoll.formula, total: extraRoll.total, receipt: extraReceipt };
        }
        // "If the enemy is critically hit by the weapon, the enemy is Doomed 1 (for as long as it takes this persistent mental damage).": the
        // condition at its value (never lowering a higher one), as an Effect that ends with that persistent damage when the row says so.
        let criticalCondition = null;
        if (critical) {
            const spec = trigger.criticalCondition;
            const condition = await fromUuid(spec.uuid);
            if (spec.whilePersistent) {
                const [created] = await actor.createEmbeddedDocuments("Item", [{ name: `${entry.metadata.sourceItemName}: ${condition?.name ?? spec.slug} ${spec.value} (while taking persistent ${trigger.type} damage)`, type: "effect", img: condition?.img,
                    system: { duration: { value: -1, unit: "unlimited", expiry: null, sustained: false }, start: { value: game.time.worldTime },
                        rules: [{ key: "GrantItem", uuid: spec.uuid, flag: `condition${spec.slug.replace(/(^|-)([a-z])/g, (_m, _d, c) => c.toUpperCase())}`, allowDuplicate: true, onDeleteActions: { grantee: "cascade" },
                            alterations: [{ mode: "override", property: "badge-value", value: spec.value }] }] },
                    flags: { [MODULE_ID]: { runtime: { persistentLink: { damageType: trigger.type }, castId: record.castId } } } }]);
                criticalCondition = { slug: spec.slug, value: spec.value, effectUuid: created?.uuid ?? null, whilePersistent: true };
            } else {
                const current = Number(actor.getCondition?.(spec.slug)?.value ?? 0);
                if (current < spec.value) await actor.increaseCondition(spec.slug, { value: spec.value - current }); // (PF2e adds the value to an existing condition.)
                criticalCondition = { slug: spec.slug, value: Math.max(current, spec.value), whilePersistent: false };
            }
        }
        // (Over the Coals: the row's conditions too — "it is Drained 1 and takes …", never lowering a higher value.)
        const conditionsApplied = [];
        for (const spec of trigger.conditions ?? []) {
            const current = Number(actor.getCondition?.(spec.slug)?.value ?? 0);
            if (current < spec.value) await actor.increaseCondition(spec.slug, { value: spec.value - current }); // (PF2e adds the value to an existing condition.)
            conditionsApplied.push({ slug: spec.slug, value: Math.max(current, spec.value) });
        }
        // (Skyglass Prison: the broken cage no longer holds it — this cast's restraint on the creature ends too.)
        if (trigger.trigger === "cage-broken") {
            const held = (actor.itemTypes?.effect ?? []).filter(effect => effect.id !== note.id && effect.flags?.[MODULE_ID]?.outcomeEffect?.castId === record.castId);
            if (held.length) await actor.deleteEmbeddedDocuments("Item", held.map(effect => effect.id), { [MODULE_ID]: { reason: "cage-broken" } });
        }
        // (Old-Mage's Echo's critical failure: Deafened until the start of its next turn, each time — an Effect holding PF2e's condition.)
        if (trigger.timedCondition) {
            const spec = trigger.timedCondition, condition = await fromUuid(spec.uuid);
            const start = { value: game.time.worldTime, initiative: game.combat?.combatants?.find(combatant => combatant.actor?.uuid === actor.uuid)?.initiative ?? null };
            await actor.createEmbeddedDocuments("Item", [{ name: `${entry.metadata.sourceItemName}: ${condition?.name ?? spec.slug}`, type: "effect", img: condition?.img ?? "icons/svg/deaf.svg",
                system: { duration: { value: 1, unit: "rounds", expiry: spec.duration.expiry, sustained: false }, start,
                    rules: [{ key: "GrantItem", uuid: spec.uuid, flag: `condition${spec.slug.replace(/(^|-)([a-z])/g, (_m, _d, c) => c.toUpperCase())}`, allowDuplicate: true, onDeleteActions: { grantee: "cascade" } }] } }]);
            conditionsApplied.push({ slug: spec.slug, value: null, rounds: 1 });
        }
        if (trigger.endsSpell) { await note.delete(); ended = true; }
        else if (trigger.frequency === "round" && round) await note.setFlag(MODULE_ID, "hostileRound", round);
        return { status: "damaged", total: roll.total, formula: roll.formula, receipt, ended, multiplier, adjacent, persistentEnded, criticalCondition, extra, conditionsApplied };
    }

    /**
     * Ymeri's Mark: the caster Dismisses the spell to detonate the mark — a basic save card of the spell's damage at the cast rank for the creatures
     * within the emanation around the marked creature (it too, if the caster chooses); the spell ends.
     */
    async detonate({ castId, uuid, includeTarget = false }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("detonate", { castId, uuid, includeTarget });
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const trigger = entry?.metadata?.triggeredDamage;
        if (trigger?.trigger !== "detonate") throw new Error("This creature carries no mark to detonate.");
        const caster = await fromUuid(entry.metadata.sourceActorUuid);
        if (!user.isGM && !caster?.testUserPermission(user, "OWNER")) throw new Error("You don't control this spell.");
        const note = await fromUuid(uuid), marked = note?.actor;
        const token = marked?.getActiveTokens?.()?.[0]?.document;
        if (!token) throw new Error(`${entry.metadata.sourceItemName}: the marked creature isn't on the scene.`);
        const spell = await castSpellFromUuid(entry.metadata);
        if (!spell) throw new Error(`${entry.metadata.sourceItemName}: the spell is no longer on the caster.`);
        const plan = detonationPlan(await game.modules.get(MODULE_ID).api.compile(spell));
        if (!plan) throw new Error(`${entry.metadata.sourceItemName}: the spell no longer has an explosion.`);
        const inside = token.parent.tokens.filter(other => other.actor && (other.id !== token.id ? tokenDistance(token, other) <= trigger.emanation : includeTarget));
        let card = null;
        if (inside.length) ({ card } = await this.saves.start(spell, { plan, sourceActor: caster, targets: inside.map(other => other.object ?? other), castRank: trigger.castRank, dc: record.dc ?? undefined, skipConfirmation: true }));
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), content: `<p><strong>${escapeHTML(entry.metadata.sourceItemName)}</strong>: the mark on ${escapeHTML(marked.name)} detonates (${trigger.emanation}-foot emanation${includeTarget ? ", the marked creature included" : ""}): ${inside.length ? inside.map(other => escapeHTML(other.name)).join(", ") : "no creature"} ${inside.length === 1 ? "saves" : "save"}.</p>` }); } catch (_) {}
        await this.ongoing.end(journal, { reason: "dismissed" });
        return { status: "detonated", cardId: card?.id ?? null, targets: inside.map(other => other.uuid) };
    }

    /**
     * Magic's Vessel: the caster cast a spell from a slot. PF2e's triggered Effect (its rank choice prompts) goes on the recipient of this
     * cast's Effect, and the spell counts as sustained this round.
     */
    async triggeredEffect({ castId, uuid }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("triggered-effect", { castId, uuid });
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const triggered = entry?.metadata?.triggeredEffect;
        if (!triggered) throw new Error("This spell has no triggered Effect.");
        const caster = await fromUuid(entry.metadata.sourceActorUuid);
        if (!user.isGM && !caster?.testUserPermission(user, "OWNER")) throw new Error("You don't control this spell.");
        const recipient = (await fromUuid(uuid))?.actor;
        if (!recipient) throw new Error("The recipient is gone.");
        const template = await loadNativeEffectTemplate(triggered.uuid);
        if (!template) throw new Error(`${entry.metadata.sourceItemName}: PF2e's ${triggered.label} is unavailable.`);
        const effect = await createNativeEffect(recipient, prepareNativeEffectSource(template, { castInstanceId: entry.metadata.castInstanceId, castRank: entry.metadata.castRank,
            sourceActorUuid: entry.metadata.sourceActorUuid, sourceItemUuid: entry.metadata.sourceItemUuid, sourceItemName: entry.metadata.sourceItemName, triggeredBy: triggered.trigger }));
        // "… you automatically Sustain this spell": this round's Sustain is done.
        if (triggered.sustains && record.sustained) {
            const fresh = structuredClone(record);
            fresh.sustainedRound = this.ongoing.clock?.().round ?? fresh.sustainedRound;
            for (const obligation of fresh.obligations ?? []) if (obligation.kind === "sustain" && obligation.status === "pending") obligation.status = "completed";
            await this.ongoing.save(journal, fresh);
        }
        return { status: "granted", effectUuid: effect?.uuid ?? null };
    }

    /**
     * Life Link: the linked creature took `damage`; up to the amount comes back to it and the caster loses as much (direct changes that
     * no resistance mitigates). Once per round per creature; the spell ends if the caster is Unconscious.
     */
    async share({ castId, uuid, damage }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("share", { castId, uuid, damage });
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const metadata = entry?.metadata;
        if (!metadata?.damageShare) throw new Error("This creature isn't linked.");
        const caster = await fromUuid(metadata.sourceActorUuid);
        if (!user.isGM && !caster?.testUserPermission(user, "OWNER")) throw new Error("You don't control this spell.");
        if (metadata.damageShare.endsUnconscious && caster?.hasCondition?.("unconscious")) { await this.ongoing.end(journal, { reason: "caster-unconscious" }); throw new Error(`${metadata.sourceItemName}: the caster is unconscious; the spell has ended.`); }
        if (!Number.isInteger(damage) || damage < 0) throw new Error(`${metadata.sourceItemName}: enter the damage the creature took.`);
        const effect = await fromUuid(entry.uuid);
        const round = game.combat?.started ? `${game.combat.id}:${game.combat.round}` : null;
        if (round && effect?.getFlag(MODULE_ID, "shareRound") === round) throw new Error(`${metadata.sourceItemName}: already shared this round for ${metadata.targetName}.`);
        const target = await fromUuid(metadata.targetActorUuid);
        const hp = actor => actor.system.attributes.hp;
        const moved = Math.min(metadata.damageShare.amount, damage, Math.max(0, Number(hp(target).max) - Number(hp(target).value)));
        if (moved > 0) {
            await target.update({ "system.attributes.hp.value": Number(hp(target).value) + moved });
            await caster.update({ "system.attributes.hp.value": Math.max(0, Number(hp(caster).value) - moved) });
        }
        if (round) await effect.setFlag(MODULE_ID, "shareRound", round);
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), content: `<p><strong>${escapeHTML(metadata.sourceItemName)}</strong>: ${moved} of ${escapeHTML(metadata.targetName)}'s damage moved to ${escapeHTML(caster.name)}.</p>` }); } catch (_) {}
        return { status: "shared", moved };
    }

    /**
     * The images around the caster (Trickster's Mirrors). `roll`: an attack would hit the caster — the odds for the current count say
     * whether it hits the caster or an image (destroyed). `miss`: an attack failed but not critically — an image breaks, and the attacker
     * saves if it's close. `area`: damage on everything in the caster's space destroys them all. `sustain`: one more (up to the most), and
     * this round's Sustain is done.
     */
    async images({ castId, uuid, action, attackerUuid = null }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("images", { castId, uuid, action, attackerUuid });
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const metadata = entry?.metadata, images = metadata?.storedTrigger?.images;
        if (!images) throw new Error("This spell has no images.");
        const caster = await fromUuid(metadata.sourceActorUuid);
        if (!user.isGM && !caster?.testUserPermission(user, "OWNER")) throw new Error("You don't control this spell.");
        const marker = await fromUuid(entry.uuid);
        if (!marker) throw new Error(`${metadata.sourceItemName}: the marker is gone.`);
        const count = marker.getFlag(MODULE_ID, "images") ?? images.start;
        const set = async value => marker.update({ name: `${metadata.sourceItemName} (${images.noun}s: ${value})`, [`flags.${MODULE_ID}.images`]: value });
        const say = async text => { try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), content: `<p><strong>${escapeHTML(metadata.sourceItemName)}</strong>: ${text}</p>` }); } catch (_) {} };
        if (action === "roll") {
            if (count < 1) { await say(`no ${escapeHTML(images.noun)}s left; the attack hits ${escapeHTML(caster.name)}.`); return { status: "hits-you", count }; }
            const odds = images.odds[count - 1];
            const roll = await new Roll(odds.die).evaluate();
            const hitsYou = roll.total <= odds.you;
            await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: caster }), flavor: `<strong>${escapeHTML(metadata.sourceItemName)}</strong> — ${count} ${escapeHTML(images.noun)}${count === 1 ? "" : "s"} (${odds.you === 1 ? "1" : `1–${odds.you}`} hits ${escapeHTML(caster.name)}): ${hitsYou ? `the attack hits ${escapeHTML(caster.name)}` : `the attack hits a ${escapeHTML(images.noun)}, which is destroyed`}` });
            if (!hitsYou) await set(count - 1);
            return { status: hitsYou ? "hits-you" : "hits-image", roll: roll.total, count: hitsYou ? count : count - 1 };
        }
        if (action === "miss") {
            if (count < 1) { await say(`no ${escapeHTML(images.noun)}s left to break.`); return { status: "none", count }; }
            await set(count - 1);
            const attacker = attackerUuid ? await fromUuid(attackerUuid) : null;
            const casterToken = caster.getActiveTokens?.()?.[0] ?? null;
            const distance = attacker?.object && casterToken ? tokenDistance(attacker.object, casterToken) : null;
            await say(`the miss breaks a ${escapeHTML(images.noun)} (${count - 1} left).`);
            if (distance != null && distance <= images.range) {
                const triggered = await this.trigger({ castId, uuid, targetUuid: attackerUuid }, user);
                return { status: "broken", count: count - 1, distance, cardId: triggered.cardId };
            }
            return { status: "broken", count: count - 1, distance, cardId: null };
        }
        if (action === "area") { await set(0); await say(`all the ${escapeHTML(images.noun)}s are destroyed.`); return { status: "cleared", count: 0 }; }
        if (action === "sustain") {
            const next = Math.min(images.max, count + images.perSustain);
            await set(next);
            if (record.sustained) {
                const fresh = structuredClone(record);
                fresh.sustainedRound = this.ongoing.clock?.().round ?? fresh.sustainedRound;
                for (const obligation of fresh.obligations ?? []) if (obligation.kind === "sustain" && obligation.status === "pending") obligation.status = "completed";
                await this.ongoing.save(journal, fresh);
            }
            await say(`Sustained: ${next} ${escapeHTML(images.noun)}${next === 1 ? "" : "s"}.`);
            return { status: "sustained", count: next };
        }
        throw new Error(`Unknown images action ${JSON.stringify(action)}.`);
    }

    /** A pool's entry and marker, checked for the user's control. */
    async #poolEntry(castId, uuid, user) {
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const metadata = entry?.metadata;
        if (!metadata?.storedTrigger?.pool) throw new Error("This spell has no Hit Point pool.");
        const caster = await fromUuid(metadata.sourceActorUuid);
        if (!user.isGM && !caster?.testUserPermission(user, "OWNER")) throw new Error("You don't control this spell.");
        const marker = await fromUuid(entry.uuid);
        if (!marker) throw new Error(`${metadata.sourceItemName}: the marker is gone.`);
        return { journal, metadata, caster, marker, pool: metadata.storedTrigger.pool, left: marker.getFlag(MODULE_ID, "poolHp") ?? metadata.poolHp };
    }

    /** A creature Struck the pool's target: the target's flat check (on a success the pool blocks, and the GM enters the damage). */
    async poolCheck({ castId, uuid }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("pool-check", { castId, uuid });
        const { metadata, caster, marker, pool } = await this.#poolEntry(castId, uuid, user);
        const roll = await new Roll("1d20").evaluate();
        const success = roll.total >= pool.flatDC;
        await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: caster }), flavor: `<strong>${escapeHTML(metadata.sourceItemName)}</strong> — ${escapeHTML(metadata.targetName)}'s flat check (DC ${pool.flatDC}): ${success ? `success, the ${escapeHTML(pool.label)} blocks` : "failure"}` });
        await marker.setFlag(MODULE_ID, "poolBlock", success);
        return { status: "checked", roll: roll.total, success };
    }

    /**
     * The pool takes the Strike's damage first: what the target just took comes back, up to what the pool has left. At 0 the pool bursts:
     * the attacker saves if it's within range, and the spell ends.
     */
    async poolAbsorb({ castId, uuid, damage, attackerUuid }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("pool-absorb", { castId, uuid, damage, attackerUuid });
        const { journal, metadata, caster, marker, pool, left } = await this.#poolEntry(castId, uuid, user);
        if (marker.getFlag(MODULE_ID, "poolBlock") !== true) throw new Error(`${metadata.sourceItemName}: roll the flat check first; the ${pool.label} blocks only on a success.`);
        if (!Number.isInteger(damage) || damage < 0) throw new Error(`${metadata.sourceItemName}: enter the damage the target took.`);
        const target = await fromUuid(metadata.targetActorUuid);
        const hp = target.system.attributes.hp;
        const absorbed = Math.min(damage, left);
        const restored = Math.min(absorbed, Math.max(0, Number(hp.max) - Number(hp.value)));
        if (restored > 0) await target.update({ "system.attributes.hp.value": Number(hp.value) + restored });
        const remaining = left - absorbed;
        await marker.update({ name: `${metadata.sourceItemName} (${pool.label}: ${remaining} HP)`, [`flags.${MODULE_ID}.poolHp`]: remaining, [`flags.${MODULE_ID}.poolBlock`]: false });
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), content: `<p><strong>${escapeHTML(metadata.sourceItemName)}</strong>: the ${escapeHTML(pool.label)} takes ${absorbed} of the ${damage} damage (${restored} restored to ${escapeHTML(metadata.targetName)}); ${remaining} HP left.</p>` }); } catch (_) {}
        if (remaining > 0) return { status: "absorbed", absorbed, restored, remaining };
        // Broken: the creature that broke it saves if it's within range of the target.
        const attacker = await fromUuid(attackerUuid), targetToken = await fromUuid(metadata.targetTokenUuid);
        const distance = attacker?.object && targetToken?.object ? tokenDistance(attacker.object, targetToken.object) : null;
        if (distance != null && distance <= pool.range) {
            const triggered = await this.trigger({ castId, uuid, targetUuid: attackerUuid }, user);
            return { status: "shattered", absorbed, restored, remaining: 0, distance, cardId: triggered.cardId };
        }
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), content: `<p><strong>${escapeHTML(metadata.sourceItemName)}</strong>: the ${escapeHTML(pool.label)} shatters; ${escapeHTML(attacker?.name ?? "the attacker")} is more than ${pool.range} feet away and takes no damage.</p>` }); } catch (_) {}
        await this.ongoing.end(journal, { reason: "broken" });
        return { status: "shattered", absorbed, restored, remaining: 0, distance, cardId: null };
    }

    /** The trigger happened: the targeted creature saves, and the spell ends. */
    async trigger({ castId, uuid, targetUuid, targetUuids = null }, user = game.user) {
        if (!this.ongoing.isCoordinator()) return this.ongoing.request("stored-trigger", { castId, uuid, targetUuid, ...(targetUuids ? { targetUuids } : {}) });
        const journal = this.ongoing.find(castId);
        const record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
        const entry = record?.entries?.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const metadata = entry?.metadata;
        if (!metadata?.storedTrigger) throw new Error("This spell isn't waiting for a trigger.");
        const caster = await fromUuid(metadata.sourceActorUuid);
        if (!user.isGM && !caster?.testUserPermission(user, "OWNER")) throw new Error("You don't control this spell.");
        // Held on the cast's target: always that creature (a pool's burst: the attacker who broke it).
        const target = await fromUuid(metadata.storedTrigger.held && metadata.storedTrigger.saveTarget !== "attacker" ? metadata.targetTokenUuid : targetUuid ?? targetUuids?.[0]);
        const token = target?.documentName === "Token" ? target : target?.document ?? null;
        if (!token?.actor) throw new Error(`${metadata.sourceItemName}: target the creature that triggered it.`);
        // (A rune's area — Unknowable Icon: every creature the GM targets near it saves on one card.)
        const tokens = [token];
        if (metadata.storedTrigger.area && Array.isArray(targetUuids)) for (const each of targetUuids.slice(1)) {
            const found = await fromUuid(each);
            const other = found?.documentName === "Token" ? found : found?.document ?? null;
            if (!other?.actor) throw new Error(`${metadata.sourceItemName}: a targeted creature is gone.`);
            if (!tokens.some(entry => entry.id === other.id)) tokens.push(other);
        }
        const spell = await castSpellFromUuid(metadata);
        if (!spell) throw new Error(`${metadata.sourceItemName}: the spell is no longer on the caster.`);
        const plan = await game.modules.get(MODULE_ID).api.compile(spell);
        if (!this.supports(plan)) throw new Error(`${metadata.sourceItemName}: the spell no longer waits for a trigger.`);
        // The marker Effect's chosen damage type (read now: ending the spell removes the Effect before the damage is rolled).
        let casterChoice;
        if (metadata.storedTrigger.effectMarker?.flag) {
            const marker = await fromUuid(uuid);
            casterChoice = marker?.flags?.system?.rulesSelections?.[metadata.storedTrigger.effectMarker.flag] ?? undefined;
            if (!plan.resolution.casterChoice?.values?.includes(casterChoice)) throw new Error(`${metadata.sourceItemName}: choose the damage type on the Effect first.`);
        }
        // (A condition lasting the spell — Needle of Vengeance+'s critical failure — is attached to this held spell's record: it ends with it.)
        const exposure = storedTriggerExposurePlan(plan);
        const lasting = metadata.storedTrigger.attachConditions === true;
        const { card } = await this.saves.start(spell, { plan: exposure, sourceActor: caster, targets: tokens, castRank: metadata.castRank, skipConfirmation: true,
            ...(casterChoice ? { casterChoice } : {}), ...(lasting ? { parentCastId: record.castId } : {}), ...(metadata.sourceMessageId ? { shapeMessageId: metadata.sourceMessageId } : {}) });
        const rowNotes = metadata.storedTrigger.rowNotes ?? [];
        if (rowNotes.length) await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), whisper: ChatMessage.getWhisperRecipients("GM").map(each => each.id),
            content: `<section class="pf2e-auto-runtime-card"><header><strong>${escapeHTML(metadata.sourceItemName)} — triggered by ${escapeHTML(token.name)}</strong></header>${rowNotes.map(note => `<p><strong>GM, on a ${escapeHTML(note.degree.replace(/([A-Z])/g, " $1").toLowerCase())}:</strong> ${escapeHTML(note.text)}</p>`).join("")}</section>` });
        // A trigger that doesn't end the spell stays set for the next creature.
        if (metadata.storedTrigger.endsOnTrigger !== false) await this.ongoing.end(journal, { reason: "triggered" });
        return { status: "triggered", cardId: card.id, ended: metadata.storedTrigger.endsOnTrigger !== false };
    }
}
