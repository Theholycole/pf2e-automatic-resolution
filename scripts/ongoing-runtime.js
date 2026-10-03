import { fuelImpossible } from "./impossible-runtime.js";
import {resolveStunned,stunnedControls} from './stunned-recovery.js';
import {reconcileConditionRecovery} from './condition-decay.js';
import {reconcileRecurringSaves} from './recurring-save-recovery.js';
import { reconcileConditionGrowth, grownCondition, setGrownValue, removeGrant } from './condition-growth.js';
import { reconcileLinkedConditions, ownsDeletedRootGrant } from './linked-condition-runtime.js';
import { MODULE_ID, createStreakQuickened } from "./effect-runtime.js";
import { clone, escapeHTML, randomID, activeUsers, confirmAction } from "./runtime-utils.js";
import { ONGOING_FLAG, coordinatorId } from "./ongoing-core.js";
import { counteracts } from "./affliction-care-core.js";
import { applyDamageWithReceipt } from "./native-damage-receipt.js";
import { revealInformation } from "./reveal-runtime.js";

const flag = item => item?.flags?.[MODULE_ID]?.runtime ?? item?.flags?.[MODULE_ID]?.outcomeEffect;
const value = journal => journal?.getFlag(MODULE_ID, ONGOING_FLAG);
const allActors = () => [...new Map([
    ...(game.actors?.contents ?? []),
    ...(game.scenes?.contents ?? []).flatMap(scene => scene.tokens.contents.map(token => token.actor).filter(Boolean))
].map(actor => [actor.uuid, actor])).values()];

/** A Dismiss payoff's dice at the cast rank: "(ceil(@item.level/2))d4" at rank 3 is "2d4". */
export function payoffFormula(formula, rank) {
    // (Or "(ceil(@item.rank/2)+1)d6": one more die.)
    return String(formula).replace(/^\(ceil\(@item\.(?:level|rank)\/(\d)\)(?:\+(\d+))?\)d/, (all, interval, plus) => `${Math.ceil(Number(rank) / Number(interval)) + Number(plus ?? 0)}d`);
}

export class OngoingRuntime {
    forms = null;
    #queue = Promise.resolve();
    #dialog = null;
    #requests = new Map();
    #runtime;
    #saves;
    #family;
    connect(runtime, saves, family) { this.#runtime = runtime; this.#saves = saves; this.#family = family; }
    isCoordinator() { return coordinatorId(activeUsers()) === game.user.id; }
    assertCoordinator() {
        if (!this.isCoordinator()) throw Error("The coordinating GM must manage ongoing spell state. Work waits while no GM is available.");
    }
    hasSave(cardId) { return this.#family?.hasSave(cardId) ?? false; }
    assertSave(cardId) { return this.#family?.assertSave(cardId); }
    finalizeSave(card, state) { return this.enqueue(() => this.#family.finalizeSave(card, state)); }
    startGroundHazard(args) { return this.enqueue(() => this.#family.startGroundHazard(args)); }
    startTurnHealing(args) { return this.enqueue(() => this.#family.startTurnHealing(args)); }
    startTurnHazard(args) { return this.enqueue(() => this.#family.startTurnHazard(args)); }
    startFollowUpSave(args) { return this.enqueue(() => this.#family.startFollowUpSave(args)); }
    startTurnEffectAura(args) { return this.enqueue(() => this.#family.startTurnEffectAura(args)); }
    startCloud(args) { return this.enqueue(() => this.#family.startCloud(args)); }
    startAbsorber(args) { return this.enqueue(() => this.#family.startAbsorber(args)); }
    absorberOnDamage(message, helpers) { return this.enqueue(() => this.#family.absorberOnDamage(message, helpers)); }
    startTerrainArea(args) { return this.enqueue(() => this.#family.startTerrainArea(args)); }
    startRegionArea(args) { return this.enqueue(() => this.#family.startRegionArea(args)); }
    startTargetAura(args) { return this.enqueue(() => this.#family.startTargetAura(args)); }
    startAllyAura(args) { return this.enqueue(() => this.#family.startAllyAura(args)); }
    startAreaBoon(args) { return this.enqueue(() => this.#family.startAreaBoon(args)); }
    escapePrompt(message, options) { return this.#family.escapePrompt(message, options); }
    startLanternAura(args) { return this.enqueue(() => this.#family.startLanternAura(args)); }
    sunPulse(castId) { return this.enqueue(() => this.#family.sunPulse(castId)); }
    startRadiantField(args) { return this.enqueue(() => this.#family.startRadiantField(args)); }
    startWeb(args) { return this.enqueue(() => this.#family.startWeb(args)); }
    startAreaRules(args) { return this.enqueue(() => this.#family.startAreaRules(args)); }
    startSpiritAid(args) { return this.enqueue(() => this.#family.startSpiritAid(args)); }
    memberCriticalSave(message) { return this.#family?.memberCriticalSave(message); }
    startHealingPulse(args) { return this.enqueue(() => this.#family.startHealingPulse(args)); }
    startHpTransfer(args) { return this.enqueue(() => this.#family.startHpTransfer(args)); }
    records() { return (game.journal?.contents ?? []).filter(journal => value(journal)); }
    find(castId) { return this.records().find(journal => value(journal).castId === castId); }
    clock() {
        const combat = game.combat;
        return { worldTime: game.time.worldTime, combatId: combat?.id ?? null, started: combat?.started === true,
            round: combat?.round ?? 0, turn: combat?.turn ?? 0,
            actorUuid: combat?.combatant?.actor?.uuid ?? null,
            roster: (combat?.turns ?? []).map(turn => `${turn.id}:${turn.actor?.uuid}:${turn.initiative}`) };
    }
    async save(journal, record) {
        this.assertCoordinator();
        if (JSON.stringify(value(journal)) === JSON.stringify(record)) return;
        record.revision = (record.revision ?? 0) + 1;
        await journal.setFlag(MODULE_ID, ONGOING_FLAG, clone(record));
        this.refreshView();
    }
    enqueue(fn) {
        const work = this.#queue.catch(() => {}).then(() => { this.assertCoordinator(); return fn(); });
        this.#queue = work;
        return work;
    }
    async begin(record) {
        this.assertCoordinator();
        if (this.find(record.castId)) throw Error("This ongoing cast already has a durable record.");
        const actors = await Promise.all([record.sourceActorUuid, ...(record.recipientUuids ?? [])].filter(Boolean).map(uuid => fromUuid(uuid)));
        const ownership = { default: 0 };
        for (const user of game.users) if (!user.isGM && actors.some(actor => actor?.testUserPermission(user, "OWNER"))) ownership[user.id] = 2;
        return await JournalEntry.create({ name: `${record.name} — Ongoing`, ownership,
            flags: { [MODULE_ID]: { [ONGOING_FLAG]: { schema: 1, revision: 0, status: "creating", entries: [], obligations: [],
                createdAt: game.time.worldTime, lastWorldTime: game.time.worldTime, clock: this.clock(), ...clone(record) } } } });
    }
    async attach(journal, effect, { permanent = false } = {}) {
        const record = clone(value(journal));
        const metadata = flag(effect);
        if (record.entries.some(entry => entry.uuid === effect.uuid)) return;
        // A permanent entry is recorded but outlives the cast (a condition the spell only floors while it lasts).
        record.entries.push({ uuid: effect.uuid, actorUuid: effect.actor.uuid, status: "active", metadata: clone(metadata),
            duration: clone(effect.system.duration), permanent: permanent === true });
        await this.save(journal, record);
    }
    async activate(journal) {
        const record = clone(value(journal));
        // (A timeline still to run — Impending Doom's later rounds — keeps a cast with no Effects yet.)
        record.status = record.kind === "native" && record.entries.length === 0 && !(record.timeline && !record.timeline.ended) ? "ended" : "active";
        if (record.status === "ended") record.endedAt = game.time.worldTime;
        await this.save(journal, record);
    }
    async review(journal, reason, { resumable = false } = {}) { const record = clone(value(journal)); record.status = "review"; record.reviewReason = reason; record.resumable = resumable; await this.save(journal, record); }

    async adopt(effect) {
        const metadata = flag(effect);
        if (!metadata || metadata.completedSequenceId) return null;
        const castId = metadata.castInstanceId ?? metadata.castId;
        let journal = this.find(castId);
        const legacy = !journal;
        if (!journal) journal = await this.begin({ castId, name: metadata.sourceItemName ?? effect.name, kind: "native",
            sourceActorUuid: metadata.sourceActorUuid ?? effect.actor.uuid, recipientUuids: [effect.actor.uuid] });
        if (!value(journal).entries.some(entry => entry.uuid === effect.uuid)) await this.attach(journal, effect);
        if (legacy && value(journal).status === "creating") await this.activate(journal);
        return journal;
    }

    async deleted(effect, options = {}) {
        if (!this.isCoordinator() || options[MODULE_ID]?.ongoingCleanup
            || ["rollback", "condition-immune"].includes(options[MODULE_ID]?.reason)) return;
        if (!flag(effect)) {
            if (effect?.type !== "condition") return;
            return this.enqueue(async () => {
                for (const journal of this.records()) {
                    const record = value(journal);
                    if (record.status === "active" && ownsDeletedRootGrant(record, effect)) await this.#reconcileRecord(journal);
                }
            });
        }
        return this.enqueue(async () => {
            const journal = await this.adopt(effect);
            if (!journal) return;
            const record = clone(value(journal));
            const entry = record.entries.find(entry => entry.uuid === effect.uuid);
            if (!entry || entry.status !== "active" || entry.detached) return;
            if (entry.metadata?.termination?.scope === "cast-instance") for (const sibling of record.entries) {
                if (!sibling.detached && !sibling.permanent && sibling.uuid !== entry.uuid) { sibling.status = "ended"; sibling.reason = "cast-ended"; }
            }
            entry.status = "ended";
            entry.reason = options[MODULE_ID]?.reason ?? "deleted";
            const event = entry.metadata?.sequence?.transition?.event;
            if (event === "effect-ended") entry.successor = "pending";
            // Sheet deletion/expiry of Shield is not proof Shield Block occurred.
            if (event === "action-used") entry.successor = "not-triggered";
            await this.save(journal, record);
            await this.#reconcileRecord(journal);
        });
    }

    async reconcile({ recover = false, clockEvent = false } = {}) {
        if (!this.isCoordinator()) return;
        return this.enqueue(async () => {
            // Read PF2e's prepared expiry after a native reset. Do not force clock
            // expiry in combat: PF2e intentionally uses encounter processing there.
            if (!game.combat?.started || clockEvent) {
                const actors = allActors();
                for (const actor of actors) actor.reset();
            }
            for (const actor of allActors()) for (const effect of actor.items) if (flag(effect)) await this.adopt(effect);
            for (const journal of this.records()) {
                const record = value(journal);
                if (recover && ["creating", "applying", "ending"].includes(record.status)) {
                    await this.review(journal, "An operation was interrupted. Reconcile its last confirmed state; nothing will be replayed.");
                    continue;
                }
                await this.#reconcileRecord(journal, { clockEvent, recover });
            }
            await this.remind();
            this.refreshView();
        });
    }

    async #reconcileRecord(journal, { clockEvent = false, recover = false } = {}) {
        let record = clone(value(journal));
        if (["review", "creating", "applying", "ending"].includes(record.status)) return;
        if (record.status === "ended") return;
        for (const entry of record.entries) {
            if (entry.detached || entry.permanent) continue;
            const effect = await fromUuid(entry.uuid);
            if (entry.status === "active" && (!effect || effect.system?.expired === true || effect.isExpired === true)) {
                entry.status = "ended";
                entry.reason = effect ? "expired" : "missing";
                // "The parrot tells you the target's highest weakness at the start of your next turn": when the note runs out (or PF2e already
                // removed it as expired: it's gone on the caster's turn).
                const runOut = effect || (game.combat?.started && this.clock().actorUuid === entry.metadata?.sourceActorUuid);
                if (runOut && entry.metadata?.reveal?.timing === "expiry") try {
                    const holder = effect?.actor ?? await fromUuid(entry.actorUuid);
                    if (holder) await revealInformation(holder, { kind: entry.metadata.reveal.kind, sourceActorUuid: entry.metadata.sourceActorUuid, spellName: entry.metadata.sourceItemName ?? record.name });
                } catch (error) { console.warn(`${MODULE_ID} | The revealed information could not be posted.`, error); }
                if (entry.metadata?.sequence?.transition?.event === "effect-ended") entry.successor = "pending";
                if (!effect && entry.metadata?.sequence?.transition?.event === "action-used") {
                    record.status = "review"; record.reviewReason = "The primary Effect disappeared while unobserved. Confirm whether its action was used.";
                }
                await this.save(journal, record);
            }
            if (entry.status === "ended" && effect) {
                record.status = "ending"; await this.save(journal, record);
                this.assertCoordinator();
                await effect.delete({ [MODULE_ID]: { ongoingCleanup: true, skipSequence: true, skipCascade: true, reason: "confirmed-ending" } });
                record.status = "active"; await this.save(journal, record);
            }
            if (entry.successor === "pending" && record.status !== "review") {
                await this.#successor(journal, entry.uuid);
                record = clone(value(journal));
            }
        }
        if (record.status === "review") return;
        if (record.kind === "form") { await this.forms.reconcile(journal, record); return; }
        if (record.kind !== "native") {
            await this.#family?.reconcile(journal, record, { clockEvent, recover });
            return;
        }
        // ("If a full round passes without … critically succeeding …, the winning streak breaks": a round after the last round it was kept going.)
        if (record.streak && game.time.worldTime >= record.streak.expiresAt + 6) { await this.end(journal, { reason: "streak-broken" }); return; }
        // (Warding Aggression: the foe dead, or a caster turn over without a melee hit on it, ends the ward.)
        if (record.wardStrike) {
            const foe = await fromUuid(record.wardStrike.foeActorUuid);
            if (!foe || Number(foe.system?.attributes?.hp?.value ?? 1) <= 0) { await this.end(journal, { reason: "foe-dead" }); return; }
            const combat = game.combat;
            if (combat?.started) {
                const key = `${combat.id}:${combat.round}:${combat.turn}`, casterNow = combat.combatant?.actor?.uuid === record.sourceActorUuid;
                const ward = clone(record.wardStrike);
                if (ward.casterTurn && ward.casterTurn !== key) {
                    if (ward.lastHit !== ward.casterTurn) { await this.end(journal, { reason: "no-hit" }); return; }
                    ward.casterTurn = null;
                }
                if (casterNow && ward.casterTurn !== key) ward.casterTurn = key;
                if (JSON.stringify(ward) !== JSON.stringify(record.wardStrike)) { const fresh = clone(value(journal)); fresh.wardStrike = ward; await this.save(journal, fresh); record = clone(value(journal)); }
            }
        }
        // ("At the start of each of your turns, increase your reservoir": once per caster turn, the Effect's counter.)
        if (record.luminance && game.combat?.started && game.combat.combatant?.actor?.uuid === record.sourceActorUuid) {
            const turnKey = `${game.combat.id}:${game.combat.round}`;
            if (record.luminance.lastTurn !== turnKey && game.combat.round > (record.castRound ?? 0)) {
                const effect = await fromUuid(record.luminance.effectUuid);
                const fresh = clone(value(journal)); fresh.luminance.lastTurn = turnKey; fresh.luminance.struck = []; await this.save(journal, fresh);
                if (effect) await effect.update({ "system.badge.value": Number(effect.system.badge?.value ?? 0) + record.luminance.perTurn });
                record = clone(value(journal));
            }
        }
        // A cast whose parts aren't Effects (Steel Fortifications' tokens and regions): it ends when its duration runs out.
        if (record.endsAtMaximum === true && record.maximumAt != null && game.time.worldTime >= record.maximumAt) { await this.end(journal, { reason: "maximum-duration" }); return; }
        // A sustained cast's conditions end when the caster stops sustaining (or at the maximum).
        if (record.sustained && await this.#family?.reconcileSustainedNative(journal, record, { clockEvent, recover })) return;
        record = clone(value(journal));
        // Both recovery steps judge the same turn boundary from the pre-reconcile clock.
        const previousClock = clone(record.clock);
        if (await reconcileConditionRecovery(this, journal, record, {clockEvent,recover})) return;
        if (await reconcileRecurringSaves(this, this.#saves, journal, {previousClock, clockEvent, recover})) return;
        if (await reconcileConditionGrowth(this, journal, {previousClock, clockEvent, recover})) return;
        if (await reconcileLinkedConditions(this, journal, value(journal))) return;
        record = clone(value(journal));
        // Later rounds' conditions and the end's damage (Impending Doom): the timeline ends the cast itself.
        if (record.timeline && !record.timeline.ended && typeof this.#family?.reconcileTimeline === "function") { await this.#family.reconcileTimeline(journal); return; }
        if (record.entries.length && record.entries.every(entry => entry.status === "ended" || entry.detached || entry.permanent)) {
            record.status = "ended"; record.endedAt = game.time.worldTime;
            await this.save(journal, record);
        }
    }

    async reconcileLinks(journal) {
        this.assertCoordinator();
        return reconcileLinkedConditions(this, journal, value(journal));
    }

    async #successor(journal, uuid) {
        const record = clone(value(journal)), entry = record.entries.find(entry => entry.uuid === uuid);
        if (entry.successor !== "pending") return;
        const actor = await fromUuid(entry.actorUuid);
        if (!actor) return this.review(journal, "The successor recipient is unavailable.");
        const metadata = entry.metadata;
        const existing = actor.items.find(item => item.flags?.[MODULE_ID]?.ongoingOperation === `${record.castId}:${uuid}:successor`
            || (item.flags?.[MODULE_ID]?.runtime?.castInstanceId === record.castId
                && item.flags?.[MODULE_ID]?.runtime?.completedSequenceId === metadata.sequence.id));
        if (existing) { entry.successor = "completed"; entry.successorUuid = existing.uuid; await this.save(journal, record); return; }
        record.status = "applying"; entry.successor = "applying"; await this.save(journal, record);
        try {
            this.assertCoordinator();
            const effect = await this.#runtime.createSuccessor(actor, metadata, `${record.castId}:${uuid}:successor`);
            entry.successorUuid = effect.uuid; entry.successor = "completed"; record.status = "active";
            await this.save(journal, record);
        } catch (error) { await this.review(journal, `Successor application is uncertain: ${error.message}`); throw error; }
    }

    /** Warding Aggression: the caster's melee hit on the warded foe this turn keeps the ward (main.js, on PF2e's attack message). */
    async wardHit(actorUuid, targetTokenUuid) {
        for (const journal of this.records()) {
            const record = value(journal);
            if (record?.status !== "active" || !record.wardStrike || record.sourceActorUuid !== actorUuid || record.wardStrike.foeTokenUuid !== targetTokenUuid || !game.combat?.started) continue;
            const fresh = clone(record); fresh.wardStrike.lastHit = `${game.combat.id}:${game.combat.round}:${game.combat.turn}`;
            await this.save(journal, fresh);
        }
    }

    /** Vital Luminance's controls: an undead's half-reservoir damage (once a round, in the bright light), or the Dismiss (the reservoir's healing or damage; the spell ends). */
    async #luminance({ castId, mode, tokenUuid }, user = game.user) {
        const journal = this.find(castId), record = journal ? clone(value(journal)) : null;
        if (!record?.luminance || record.status !== "active") throw Error("The luminance is gone.");
        const token = await fromUuid(tokenUuid), effect = await fromUuid(record.luminance.effectUuid);
        if (!token?.actor || !effect) throw Error("The creature or the luminance isn't there.");
        const reservoir = Number(effect.system.badge?.value ?? 0);
        const traits = token.actor.traits ?? new Set(token.actor.system?.traits?.value ?? []);
        const undead = traits.has?.("undead") ?? traits.includes?.("undead");
        const DamageRoll = (CONFIG.Dice?.rolls ?? []).find(candidate => candidate?.name === "DamageRoll");
        const { tokenDistance } = await import("./token-distance.js");
        const casterToken = (await fromUuid(record.sourceActorUuid))?.getActiveTokens?.(true, true)?.[0] ?? null;
        if (mode === "undead") {
            if (!undead) throw Error(`${token.name} isn't undead.`);
            if (casterToken && tokenDistance(casterToken, token) > record.luminance.bright) throw Error(`${token.name} isn't in the bright light.`);
            if (record.luminance.struck.includes(token.actor.uuid)) throw Error(`${token.name} already took it this round.`);
            const amount = Math.floor(reservoir / 2);
            const roll = await new DamageRoll(`${amount}[vitality]`).evaluate();
            await token.actor.applyDamage({ damage: roll, token, skipIWR: false });
            record.luminance.struck.push(token.actor.uuid); await this.save(journal, record);
            return { status: "struck", amount };
        }
        if (casterToken && tokenDistance(casterToken, token) > record.luminance.bright * 2) throw Error(`${token.name} isn't within the light.`);
        if (undead) { const roll = await new DamageRoll(`${reservoir}[vitality]`).evaluate(); await token.actor.applyDamage({ damage: roll, token, skipIWR: false }); }
        else await token.actor.applyDamage({ damage: -reservoir, token, skipIWR: true });
        await this.end(journal, { reason: "dismissed" });
        return { status: "dismissed", amount: reservoir, healed: !undead };
    }

    /** Winning Streak: a reported critical hit by the target or its ally within the distance: quickened (if not already), and the streak goes another round. */
    async #streakCrit({ castId, tokenUuid }, user = game.user) {
        if (!user.isGM) throw Error("The GM reports the critical hit.");
        const journal = this.find(castId), record = journal ? clone(value(journal)) : null;
        if (!record?.streak || record.status !== "active") throw Error("The winning streak is over.");
        const token = await fromUuid(tokenUuid), centre = await fromUuid(record.streak.targetTokenUuid);
        if (!token?.actor || !centre) throw Error("The creatures of the streak aren't on the scene.");
        const { tokenDistance } = await import("./token-distance.js");
        const ally = token.id === centre.id || (typeof centre.actor?.isAllyOf === "function" && centre.actor.isAllyOf(token.actor) && tokenDistance(centre, token) <= record.streak.radius);
        if (!ally) throw Error(`${token.name} isn't the target or one of its allies within ${record.streak.radius} feet.`);
        const has = record.entries.some(entry => entry.status === "active" && entry.actorUuid === token.actor.uuid);
        if (!has) {
            const effect = await createStreakQuickened(token.actor, { castInstanceId: record.castId, castRank: record.streak.castRank, sourceActorUuid: record.sourceActorUuid, sourceItemUuid: record.sourceItemUuid, sourceItemName: record.name, data: record.streak.data });
            await this.attach(journal, effect);
        }
        const fresh = clone(value(journal));
        fresh.streak.expiresAt = game.time.worldTime + 6;
        await this.save(journal, fresh);
        return { status: "extended", quickened: !has, expiresAt: fresh.streak.expiresAt };
    }

    /** A condition's own 1-action save: the bearer's save against the spell DC; a success removes that condition (the Effect's other conditions stay). */
    async #conditionSave({ castId, uuid, ruleFlag, degree = null }, user = game.user) {
        const journal = this.find(castId), record = journal ? clone(value(journal)) : null;
        const entry = record?.entries.find(candidate => candidate.uuid === uuid && candidate.status === "active");
        const condition = entry?.metadata?.conditions?.find(c => c.ruleFlag === ruleFlag && c.actionSave);
        const effect = entry ? await fromUuid(uuid) : null;
        if (!condition || !effect) throw Error("This condition has no save of its own.");
        if (!user.isGM && !effect.actor?.testUserPermission(user, "OWNER")) throw Error("Only the creature's owner or a GM can use its action.");
        if (!effect.flags?.pf2e?.itemGrants?.[ruleFlag]) throw Error(`${effect.actor.name} no longer has that condition from ${record.name}.`);
        let result = degree;
        if (!result) {
            const roll = await effect.actor.saves?.[condition.actionSave.statistic]?.roll({ dc: { value: condition.actionSave.dc }, skipDialog: true });
            result = ["criticalFailure", "failure", "success", "criticalSuccess"][roll?.degreeOfSuccess ?? -1];
        }
        if (!["criticalSuccess", "success", "failure", "criticalFailure"].includes(result)) throw Error("The save's result is unknown.");
        if (["success", "criticalSuccess"].includes(result)) {
            const others = Object.keys(effect.flags?.pf2e?.itemGrants ?? {}).filter(flag => flag !== ruleFlag);
            if (others.length) await removeGrant(effect, ruleFlag);
            else await effect.delete({ [MODULE_ID]: { reason: "condition-saved" } });
        }
        return { status: ["success", "criticalSuccess"].includes(result) ? "removed" : "kept", degree: result };
    }

    async actionUsed(effect) {
        if (!this.isCoordinator()) return this.request("native-action", { effectUuid: effect.uuid });
        return this.enqueue(async () => {
            const journal = await this.adopt(effect), record = clone(value(journal));
            const entry = record.entries.find(entry => entry.uuid === effect.uuid);
            if (record.status !== "active" || entry.status !== "active" || entry.detached || entry.metadata?.sequence?.transition?.event !== "action-used") throw Error("This action is no longer available.");
            entry.status = "ended"; entry.reason = "action-used"; entry.successor = "pending";
            await this.save(journal, record);
            await this.#reconcileRecord(journal);
            return { status: "applied" };
        });
    }

    async end(journal, { reason = "gm-ended", skipSuccessor = false } = {}) {
        const record = clone(value(journal));
        if (record.status === "ended") return { status: "already-ended" };
        if (record.status !== "active") throw Error("Reconcile uncertain or pending work before ending this cast.");
        if (record.kind === 'condition-spell') return this.#family.conditions.end(journal, reason);
        record.status = "ending"; record.endReason = reason; await this.save(journal, record);
        try {
            for (const entry of record.entries) {
                if (entry.detached || entry.permanent) continue;
                const effect = await fromUuid(entry.uuid);
                this.assertCoordinator();
                // "Once this spell ends, the target becomes temporarily immune for 1 minute.": the immunity now starts its time.
                const afterEnd = effect?.flags?.[MODULE_ID]?.spellImmunity?.afterEnd;
                if (afterEnd) {
                    await effect.update({ "system.duration": { value: afterEnd.value, unit: afterEnd.unit, expiry: "turn-start", sustained: false },
                        "system.start": { value: game.time.worldTime, initiative: game.combat?.combatant?.initiative ?? null },
                        [`flags.${MODULE_ID}.spellImmunity.afterEnd`]: null, [`flags.${MODULE_ID}.spellImmunity.startedAt`]: game.time.worldTime });
                    entry.detached = true; entry.status = "released"; entry.reason = reason;
                    continue;
                }
                if (effect) await effect.delete({ [MODULE_ID]: { ongoingCleanup: true, skipSequence: true, skipCascade: true, reason } });
                entry.status = "ended"; entry.reason = reason;
                if (!skipSuccessor && entry.metadata?.sequence?.transition?.event === "effect-ended") entry.successor = "pending";
            }
            // A lingering area's "until it leaves the area" Effects end with the area.
            if (record.kind === "lingering" && typeof this.#family?.clearLeaveArea === "function") await this.#family.clearLeaveArea(record, null);
            // "once this spell ends, any creature that has been affected by its healing gains …": PF2e's Effect on each creature it healed.
            if (record.kind === "lingering" && record.declaration?.healingPulse && typeof this.#family?.applyPulseAfterEffect === "function") await this.#family.applyPulseAfterEffect(record);
            // "if it remains within the area for the full duration, regains 10 Hit Points": only when the duration ran out.
            if (record.kind === "lingering" && record.declaration?.stayHealing && reason === "maximum-duration" && typeof this.#family?.applyStayHealing === "function") await this.#family.applyStayHealing(record);
            if(record.kind === "form") { await this.forms.reconcile(journal, record); if(value(journal).status === "review") return {status:"review"}; }
            record.status = "active"; await this.save(journal, record);
            for (const entry of record.entries.filter(entry => entry.successor === "pending")) await this.#successor(journal, entry.uuid);
            const ended = clone(value(journal));
            if (ended.status === "review") return { status: "review" };
            ended.status = "ended"; ended.endedAt = game.time.worldTime;
            await this.save(journal, ended);
            // (A second area started with this one — Door to Beyond's squares beside the door — ends with it.)
            for (const child of this.records().filter(other => value(other)?.parentCastId === record.castId && value(other).status === "active")) await this.end(child, { reason: "parent-ended" });
            return { status: "ended" };
        } catch (error) { await this.review(journal, `Ending was interrupted: ${error.message}`); throw error; }
    }

    /** A ward's counteract: the ward's spell at its cast rank against the named effect; Spell Turning ends after it. */
    async wardCounteract({ castId, uuid, name, dc, rank }, user = game.user) {
        const journal = this.find(castId);
        const record = value(journal);
        const entry = record?.entries.find(e => e.uuid === uuid && e.status === "active");
        const ward = entry?.metadata?.ward;
        if (!ward) throw Error("This ward isn't active.");
        const caster = await fromUuid(record.sourceActorUuid);
        if (!user.isGM && !caster?.testUserPermission(user, "OWNER")) throw Error("You do not control this ward.");
        if (!name || !Number.isFinite(Number(dc)) || !Number.isInteger(Number(rank))) throw Error(`${record.name}: name the effect and enter its counteract DC and rank.`);
        const spell = await fromUuid(entry.metadata.sourceItemUuid);
        const statistic = spell?.spellcasting?.counteraction ?? spell?.spellcasting?.statistic;
        if (!statistic) throw Error(`${record.name}: the caster's counteract statistic is unavailable.`);
        // "The GM rolls a secret counteract check": blind roll, and the result is whispered to the GM.
        const roll = await statistic.check.roll({ dc: { value: Number(dc) }, item: spell, extraRollOptions: ["action:counteract"], skipDialog: true, ...(ward.secret ? { rollMode: "blindroll" } : {}) });
        // "as if the globe were a Dispel Magic spell 1 rank lower"
        const wardRank = ward.rank + (ward.rankOffset ?? 0);
        const countered = counteracts(roll.degreeOfSuccess, wardRank, Number(rank));
        const degree = ["critical failure", "failure", "success", "critical success"][roll.degreeOfSuccess];
        // Seeing through (Truesight, Glimpse the Truth): the check succeeds, but nothing is counteracted.
        const outcome = countered ? (ward.seeThrough ? `The check succeeds against ${escapeHTML(name)}: ${escapeHTML(ward.successText.charAt(0).toLowerCase() + ward.successText.slice(1))}`
            : `<strong>GM to apply:</strong> ${escapeHTML(name)} is counteracted${ward.successText ? `: ${escapeHTML(ward.successText.charAt(0).toLowerCase() + ward.successText.slice(1))}` : "."}`)
            : ward.seeThrough ? `The check fails against ${escapeHTML(name)}: you don't see through it.` : `${escapeHTML(name)} is not counteracted.`;
        const message = await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), flags: { [MODULE_ID]: { wardCounteract: { castId, name, dc: Number(dc), rank: Number(rank), degree: roll.degreeOfSuccess, countered } } },
            ...(ward.secret ? { whisper: ChatMessage.getWhisperRecipients("GM").map(each => each.id) } : {}),
            content: `<section class="pf2e-auto-runtime-card"><header><strong>${escapeHTML(record.name)} — counteract</strong></header><p>Counteract check vs DC ${escapeHTML(dc)}: ${escapeHTML(degree)} (rank ${escapeHTML(wardRank)}${ward.rankOffset ? ` (${escapeHTML(ward.rankOffset)})` : ""} vs ${escapeHTML(rank)}).</p><p>${outcome}</p>${ward.endsAfterUse ? `<p>${escapeHTML(record.name)} ends.</p>` : ""}</section>` });
        // "Whether or not the counteract attempt is successful, spell turning then ends."
        if (ward.endsAfterUse) await this.end(journal, { reason: "ward-used" });
        return { countered, degree: roll.degreeOfSuccess, messageId: message.id };
    }

    /** Wards lasting until the caster's next daily preparations end when the caster rests for the night. */
    async dailyPreparations(actor) {
        if (!this.isCoordinator()) return;
        for (const journal of this.records()) {
            const record = value(journal);
            if (record.status !== "active" || record.sourceActorUuid !== actor?.uuid) continue;
            if (record.entries.some(e => e.status === "active" && e.metadata?.ward?.untilDailyPreparations)) await this.enqueue(() => this.end(journal, { reason: "daily-preparations" }));
        }
    }

    async request(action, data = {}) {
        if (this.isCoordinator()) return this.#dispatch(action, data, game.user);
        const coordinator = coordinatorId(activeUsers());
        if (!coordinator) throw Error("An active GM is required. This work has not been applied.");
        const requestId = randomID();
        return await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => { this.#requests.delete(requestId); reject(Error("The GM did not confirm completion. Check the ongoing record before trying again.")); }, 15000);
            this.#requests.set(requestId, { resolve, reject, timeout });
            game.socket.emit(`module.${MODULE_ID}`, { type: "ongoing-request", action, data, userId: game.user.id, requestId, coordinator });
        });
    }
    async socket(payload) {
        if (payload?.type === "ongoing-response" && payload.userId === game.user.id) {
            const pending = this.#requests.get(payload.requestId);
            if (!pending) return;
            clearTimeout(pending.timeout); this.#requests.delete(payload.requestId);
            payload.error ? pending.reject(Error(payload.error)) : pending.resolve(payload.result);
        }
        if (payload?.type !== "ongoing-request" || !this.isCoordinator() || payload.coordinator !== game.user.id) return;
        const user = game.users.get(payload.userId);
        if (!user?.active) return;
        try { const result = await this.#dispatch(payload.action, payload.data, user);
            game.socket.emit(`module.${MODULE_ID}`, { type: "ongoing-response", userId: user.id, requestId: payload.requestId, result });
        } catch (error) { game.socket.emit(`module.${MODULE_ID}`, { type: "ongoing-response", userId: user.id, requestId: payload.requestId, error: error.message }); }
    }
    async #dispatch(action, data, user) {
        if (action === "start-form") return this.enqueue(() => this.forms.apply(data, user));
        if (["execute-native", "start-family"].includes(action)) {
            const item = await fromUuid(data.itemUuid);
            if (!item?.actor || (!user.isGM && !item.actor.testUserPermission(user, "OWNER"))) throw Error("You do not own this caster.");
            const targets = await Promise.all((data.targetUuids ?? []).map(uuid => fromUuid(uuid)));
            if (action === "execute-native" && !user.isGM && targets.some(target => !(target?.actor ?? target)?.testUserPermission(user, "OWNER"))) throw Error("A GM must apply Effects to these targets.");
            const result = await (action === "start-family" ? this.#family : this.#runtime)[action === "start-family" ? "start" : "execute"](item, { sourceActor: item.actor, targets, castRank: data.castRank, sourceMessageId: data.sourceMessageId });
            return { status: result.status, castInstanceId: result.castInstanceId, castId: result.castId };
        }
        if (action === "ward-counteract") return this.enqueue(() => this.wardCounteract(data, user));
        if (action === "consume-food") return this.enqueue(() => this.#runtime.consumeFood(data, user));
        if (action === "stored-trigger") return this.storedTriggers.trigger(data, user);
        if (action === "retaliate") return this.storedTriggers.retaliate(data, user);
        if (action === "share") return this.storedTriggers.share(data, user);
        if (action === "fuel") {
            const journal = this.find(data.castId), record = journal?.getFlag(MODULE_ID, ONGOING_FLAG);
            if (!record) throw Error("This spell isn't tracked.");
            const caster = await fromUuid(record.sourceActorUuid);
            if (!user.isGM && !caster?.testUserPermission(user, "OWNER")) throw Error("You don't control this spell.");
            return fuelImpossible(record);
        }
        if (action === "command") {
            const journal = this.find(data.castId);
            if (!journal) throw Error("This spell isn't tracked.");
            return this.enqueue(() => this.#runtime.commandListCommand(this, journal, data, user));
        }
        if (action === "images") return this.storedTriggers.images(data, user);
        if (action === "disbelieve") return this.storedTriggers.disbelieve(data, user);
        if (action === "end-save") return this.storedTriggers.endSave(data, user);
        if (action === "triggered-increase") return this.storedTriggers.triggeredIncrease(data, user);
        if (action === "triggered-penalty") return this.storedTriggers.triggeredPenalty(data, user);
        if (action === "recall-escape") return this.storedTriggers.recallEscape(data, user);
        if (action === "question-check") return this.storedTriggers.questionCheck(data, user);
        if (action === "touch-disbelieve") return this.storedTriggers.touchDisbelieve(data, user);
        if (action === "metal-attack") return this.storedTriggers.metalAttack(data, user);
        if (action === "lantern-save") return this.enqueue(() => this.#family.lanternSave(data, user));
        if (action === "healing-save") return this.enqueue(() => this.#family.healingSave(data, user));
        if (action === "sun-sunlight") return this.enqueue(() => this.#family.sunSunlight(data, user));
        if (action === "radiant-save") return this.enqueue(() => this.#family.radiantSave(data, user));
        if (action === "web-check") return this.enqueue(() => this.#family.webCheck(data, user));
        if (action === "spirit-aid") return this.enqueue(() => this.#family.spiritAidChoice(data, user));
        if (action === "sun-fire") return this.enqueue(() => this.#family.sunFire(data, user));
        if (action === "decoy") return this.storedTriggers.decoy(data, user);
        if (action === "wisp") return this.storedTriggers.wisp(data, user);
        if (action === "deferred-save") return this.storedTriggers.deferredSave(data, user);
        if (action === "mirror-shatter") return this.storedTriggers.mirrorShatter(data, user);
        if (action === "streak-crit") return this.enqueue(() => this.#streakCrit(data, user));
        if (action === "luminance") return this.enqueue(() => this.#luminance(data, user));
        if (action === "transfer-aura") return this.enqueue(() => this.#family.transferAura(data, user));
        if (action === "condition-save") return this.enqueue(() => this.#conditionSave(data, user));
        if (action === "cauterize") return this.storedTriggers.cauterize(data, user);
        if (action === "plant-strike") return this.storedTriggers.plantStrike(data, user);
        if (action === "fuel-form") return this.storedTriggers.fuelForm(data, user);
        if (action === "pool-check") return this.storedTriggers.poolCheck(data, user);
        if (action === "pool-absorb") return this.storedTriggers.poolAbsorb(data, user);
        if (action === "hostile-damage") return this.storedTriggers.hostileDamage(data, user);
        if (action === "detonate") return this.storedTriggers.detonate(data, user);
        if (action === "triggered-healing") return this.storedTriggers.triggeredHealing(data, user);
        if (action === "triggered-effect") return this.storedTriggers.triggeredEffect(data, user);
        if (action === "message-reply") return this.enqueue(() => this.messages.reply(data, user));
        if (action === "message-deliver") return this.enqueue(() => this.messages.deliver(data, user));
        if (["native-action", "dismiss-native"].includes(action)) {
            const effect = await fromUuid(data.effectUuid), metadata = flag(effect);
            if (!effect || !metadata) throw Error("The native Effect is unavailable.");
            const authorityActor = action === "dismiss-native" && metadata.termination?.authority?.actor === "target"
                ? effect.actor : await fromUuid(metadata.sourceActorUuid);
            if (!user.isGM && !authorityActor?.testUserPermission(user, "OWNER")) throw Error("You do not control this Effect's action.");
            return action === "native-action" ? this.actionUsed(effect) : this.#runtime.dismiss(effect);
        }
        const journal = this.find(data.castId);
        if (!journal) throw Error("The ongoing cast is unavailable.");
        const record = value(journal), actor = await fromUuid(record.sourceActorUuid);
        const owner = user.isGM || actor?.testUserPermission(user, "OWNER");
        // The bearer (or GM) spends its own Interact action to end an Effect.
        if (action === "action-end") return this.enqueue(async () => {
            const fresh = clone(value(journal));
            const entry = fresh.entries.find(candidate => candidate.uuid === data.uuid && candidate.status === "active" && !candidate.detached);
            if (!entry || !["interact", "next", "next-turn-action", "outside-action"].includes(entry.metadata?.actionEnd?.action)) throw Error("This Effect cannot be ended by the creature's action.");
            const effect = await fromUuid(entry.uuid);
            if (!effect) throw Error("The Effect already ended.");
            if (!user.isGM && !effect.actor?.testUserPermission(user, "OWNER")) throw Error("Only the affected creature's owner or a GM can use its Interact action.");
            // "it reduces its clumsy condition by 1, instead of decreasing it to 0" (Coral Scourge's critical failure): lowered, the cast goes on.
            if (entry.metadata.growth?.interact === "reduce") {
                const current = Number(grownCondition(effect)?.value ?? 0);
                if (current > 0) await setGrownValue(effect, current - 1, fresh.name);
                return { status: "reduced", value: Math.max(0, current - 1) };
            }
            await effect.delete({ [MODULE_ID]: { reason: "action-ended" } });
            // "… decreasing the clumsy condition to 0 and ending the spell": the rest of the cast (a grown condition's further one) ends too.
            if (entry.metadata.growth?.interact === "end" && value(journal).status === "active") await this.end(journal, { reason: "action-ended" });
            return { status: "ended" };
        });
        if (!owner && !["roll","condition-actions-lost","condition-retch"].includes(action)) throw Error("Only the caster's owner or GM can act on this cast.");
        if (action === "dismiss-cast") return this.enqueue(async () => {
            const fresh = clone(value(journal));
            if (data.revision != null && fresh.revision !== data.revision) throw Error("This cast changed. Refresh the overview.");
            if (fresh.dismissal?.scope !== "cast" || fresh.dismissal.authority !== "source-actor") throw Error("This cast cannot be Dismissed.");
            // "You can Dismiss the spell as a reaction when an ally …, restoring … Hit Points to that ally.": heal the named ally, then end.
            // "You can Dismiss the spell on your turn if your last action dealt damage to the target …, instantly dealing an additional … damage to
            // it.": the payoff's damage (PF2e's roll, with IWR) on the creature the caster's mark is on.
            if (data.payoff && fresh.dismissal.payoff?.kind === "damage") {
                const payoff = fresh.dismissal.payoff;
                const mark = fresh.entries.find(entry => entry.status === "active" && entry.metadata?.markedTokenUuid);
                const token = mark ? await fromUuid(mark.metadata.markedTokenUuid) : null;
                if (!token?.actor) throw Error(`${fresh.name}: the marked creature isn't on the scene.`);
                const DamageRoll = (CONFIG.Dice?.rolls ?? []).find(candidate => candidate?.name === "DamageRoll");
                const formula = `${payoffFormula(payoff.formula, Number(fresh.rank ?? 1))}[${payoff.damageType}]`;
                const roll = await new DamageRoll(formula).evaluate();
                await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: await fromUuid(fresh.sourceActorUuid) }), flavor: `${escapeHTML(fresh.name)}: Dismissed — ${escapeHTML(token.actor.name)} takes the additional damage` });
                const before = Number(token.actor.hitPoints?.value ?? 0);
                await applyDamageWithReceipt(token.actor, { damage: roll, token, skipIWR: false, rollOptions: new Set() }, randomID());
                const result = await this.end(journal, { reason: "dismissed" });
                return { ...(result ?? {}), status: "dismissed", damage: { formula: roll.formula, total: roll.total, lost: before - Number(token.actor.hitPoints?.value ?? 0), actorUuid: token.actor.uuid } };
            }
            if (data.payoff) {
                const payoff = fresh.dismissal.payoff;
                if (payoff?.kind !== "healing" || payoff.recipient !== "ally") throw Error("This cast's Dismiss restores no Hit Points.");
                const token = data.targetUuid ? await fromUuid(data.targetUuid) : null;
                const ally = token?.actor;
                if (!ally) throw Error(`${fresh.name}: target the ally (${payoff.trigger}) before Dismissing.`);
                const rank = Number(fresh.rank ?? 1);
                const formula = payoffFormula(payoff.formula, rank);
                const roll = await new Roll(formula).evaluate();
                await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: await fromUuid(fresh.sourceActorUuid) }), flavor: `${escapeHTML(fresh.name)}: Dismissed — restores Hit Points to ${escapeHTML(ally.name)}` });
                const before = Number(ally.hitPoints?.value ?? 0);
                await applyDamageWithReceipt(ally, { damage: -roll.total, token, skipIWR: true, rollOptions: new Set() }, randomID());
                const result = await this.end(journal, { reason: "dismissed" });
                return { ...(result ?? {}), status: "dismissed", healing: { formula: roll.formula, total: roll.total, restored: Number(ally.hitPoints?.value ?? 0) - before, allyUuid: ally.uuid } };
            }
            return this.end(journal, { reason: "dismissed" });
        });
        if (["end", "detach", "resolve-review", "resume-reviewed"].includes(action) && !user.isGM) throw Error("Only a GM can make this correction.");
        return this.enqueue(async () => {
            const fresh = clone(value(journal));
            if (data.revision != null && fresh.revision !== data.revision) throw Error("This cast changed. Refresh the overview.");
            if (action === "condition-actions-lost") return resolveStunned(this,journal,fresh,data,user);
            if (action === "end") return this.end(journal);
            if (action === "detach") {
                const entry = fresh.entries.find(entry => entry.uuid === data.uuid);
                if (!entry) throw Error("The contribution is unavailable.");
                entry.detached = true;
                for (const dependent of fresh.entries) if (dependent.metadata?.linkedTo?.rootEffectUuid === entry.uuid) dependent.detached = true;
                await this.save(journal, fresh);
                if (fresh.kind === "condition-spell") await this.#reconcileRecord(journal);
                return { status: "detached" };
            }
            if (action === "resume-reviewed") {
                if (fresh.status !== "review" || !fresh.resumable) throw Error("Uncertain document writes cannot be resumed automatically. Take over this cast manually.");
                fresh.status = "active"; fresh.reviewResolution = "GM reconciled missed timing and confirmed current state";
                fresh.clock = this.clock(); fresh.lastWorldTime = game.time.worldTime;
                if (fresh.nextSaveAt != null) fresh.nextSaveAt = game.time.worldTime + 6;
                if (fresh.sustainDueAt != null) { fresh.sustainDueAt = game.time.worldTime + 6; fresh.sustainedRound = fresh.clock.round; }
                if (fresh.sustained && fresh.kind === "native") { fresh.sustainClock = fresh.clock; fresh.sustainedRound = fresh.clock.round; }
                fresh.reviewReason = null; fresh.resumable = false;
                await this.save(journal, fresh); return { status: "active" };
            }
            if (action === "resolve-review") {
                if (fresh.status !== "review") throw Error("This cast does not need review.");
                // Acknowledge only, never retry a possibly applied operation.
                fresh.status = "ended"; fresh.reviewResolution = "GM took over remaining work";
                await this.save(journal, fresh); return { status: "managed-manually" };
            }
            if (fresh.kind === "form") return this.forms.action(journal, action, data, user);
            return this.#family?.action(journal, action, data, user) ?? { status: "unavailable" };
        });
    }

    async remind() {
        const groups = new Map();
        for (const journal of this.records()) {
            const record = clone(value(journal));
            if (record.status !== "active") continue;
            const pending = record.obligations.filter(o => o.status === "pending" && !o.reminded);
            if (!pending.length) continue;
            // Persist the notification claim first: a disconnect may suppress a
            // reminder, but cannot replay it. The overview remains authoritative.
            for (const obligation of pending) obligation.reminded = true;
            await this.save(journal, record);
            const users = [...game.users].filter(u => u.isGM || journal.testUserPermission(u, "OBSERVER")).map(u => u.id).sort();
            const key = users.join(","), group = groups.get(key) ?? { users, lines: [] };
            group.lines.push(...pending.map(o => `${record.name}: ${o.label ?? o.kind}`)); groups.set(key, group);
        }
        for (const group of groups.values()) await ChatMessage.create({ whisper: group.users,
            content: `<h3>Ongoing spells — actions due</h3><ul>${group.lines.map(line => `<li>${escapeHTML(line)}</li>`).join("")}</ul><button type="button" data-pf2e-ongoing-open>Open ongoing spells</button>` });
    }

    async open() {
        const journals = this.records().filter(journal => game.user.isGM || journal.testUserPermission(game.user, "OBSERVER"));
        const rows = [];
        for (const journal of journals) {
            const record = value(journal);
            if (record.status === "ended") continue;
            const caster = await fromUuid(record.sourceActorUuid);
            const controls = await stunnedControls(this,journal,record);
            if (game.user.isGM) {
                if (record.status === "review" && record.resumable) controls.push({ action: `resume-${journal.id}`, label: `Resume ${record.name} after timing review`, callback: async () => {
                    const confirmed = await foundry.applications.api.DialogV2.confirm({ window: { title: "Confirm reconciled timing" }, content: "<p>Resolve missed events in order using the recorded obligations and current actor state. Confirm any required Sustain occurred. This resumes from the current time without applying, rolling, or replaying missed benefits.</p>", rejectClose: false });
                    if (confirmed) return this.request("resume-reviewed", { castId: record.castId, revision: record.revision });
                } });
                if (record.status === "active") controls.push({ action: `end-${journal.id}`, label: `End ${record.name}`, callback: () => this.request("end", { castId: record.castId, revision: record.revision }) });
            }
            // The caster's owner may Dismiss a save cast that allows it.
            if (record.status === "active" && record.dismissal?.scope === "cast"
                && (game.user.isGM || caster?.testUserPermission(game.user, "OWNER"))) {
                controls.push({ action: `dismiss-cast-${journal.id}`, label: `Dismiss ${record.name} — 1 action`, callback: () => this.request("dismiss-cast", { castId: record.castId, revision: record.revision }) });
                // Dismissed when the caster's last action damaged the marked target: the payoff's damage on it (the GM confirms).
                if (record.dismissal.payoff?.kind === "damage") controls.push({ action: `dismiss-damage-${journal.id}`,
                    label: `Dismiss ${record.name} (${record.dismissal.payoff.condition}): ${payoffFormula(record.dismissal.payoff.formula, Number(record.rank ?? 1))} ${record.dismissal.payoff.damageType} damage to the marked creature`,
                    callback: async () => (await confirmAction({ title: `Dismiss ${record.name}`, content: `<p>Confirm: ${escapeHTML(record.dismissal.payoff.condition)}.</p>`, label: "Dismiss and deal the damage" }))
                        && this.request("dismiss-cast", { castId: record.castId, revision: record.revision, payoff: true }) });
                // Dismissed as a reaction, healing the ally the caster targets.
                if (record.dismissal.payoff?.kind === "healing") controls.push({ action: `dismiss-heal-${journal.id}`,
                    label: `Dismiss ${record.name} — reaction: ${record.dismissal.payoff.trigger}; restore ${payoffFormula(record.dismissal.payoff.formula, Number(record.rank ?? 1))} HP to the targeted ally`,
                    callback: () => this.request("dismiss-cast", { castId: record.castId, revision: record.revision, payoff: true,
                        targetUuid: game.user.targets.size === 1 ? game.user.targets.first().document.uuid : null }) });
            }
            if (game.user.isGM) {
                if (record.status === "review") controls.push({ action: `review-${journal.id}`, label: `Take over ${record.name} manually`, callback: () => this.request("resolve-review", { castId: record.castId, revision: record.revision }) });
            }
            if (game.user.isGM) for (const entry of record.entries.filter(entry => entry.status === "active" && !entry.detached && (!entry.permanent || record.kind === "condition-spell"))) {
                const document = await fromUuid(entry.uuid);
                controls.push({ action: `detach-${journal.id}-${controls.length}`, label: `Detach ${document?.name ?? "missing contribution"}`, callback: () => this.request("detach", { castId: record.castId, uuid: entry.uuid, revision: record.revision }) });
            }
            if (record.status === "active") for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && ["interact", "next", "next-turn-action", "outside-action"].includes(e.metadata?.actionEnd?.action))) {
                const effect = await fromUuid(entry.uuid);
                const named = effect?.name.replace(/^[^:]*:\s*/, "").replace(/ \((?:ends on Interact|until its next action|until its first action next turn|1 action outside the area ends it)\)$/, "");
                const kind = entry.metadata.actionEnd.action;
                if (effect && (game.user.isGM || effect.actor?.isOwner)) controls.push({ action: `interact-${journal.id}-${controls.length}`,
                    label: entry.metadata.growth?.interact === "reduce" ? `${effect.actor.name}: Interact to lower ${named} by 1 — 1 action` : kind === "next" ? `${effect.actor.name} took its next action: end ${named}` : kind === "next-turn-action" ? `${effect.actor.name} completed its first action this turn: end ${named}` : kind === "outside-action" ? `${effect.actor.name} (outside the area): spend 1 action to end ${named}` : `${effect.actor.name}: Interact to end ${named} — 1 action`,
                    callback: () => this.request("action-end", { castId: record.castId, uuid: entry.uuid }) });
            }
            if (record.status === "active") for (const entry of record.entries.filter(e => e.status === "active" && !e.detached)) {
                const effect = await fromUuid(entry.uuid), metadata = entry.metadata;
                const authority = metadata?.termination?.authority?.actor === "target" ? effect?.actor : caster;
                if (metadata?.termination && (game.user.isGM || authority?.testUserPermission(game.user, "OWNER"))) controls.push({
                    action: `dismiss-${journal.id}-${controls.length}`, label: `Dismiss ${record.name}`,
                    callback: () => this.request("dismiss-native", { effectUuid: entry.uuid }) });
            }
            // An animated object's commands: the attack at the targeted creature, or another command.
            if (record.status === "active" && record.commands && (game.user.isGM || caster?.testUserPermission(game.user, "OWNER"))) {
                const list = record.commands.list, left = record.commands.available;
                controls.push({ action: `command-attack-${journal.id}`, label: `${record.name}: ${list.attack.name} the targeted creature (${left} command${left === 1 ? "" : "s"} left)`,
                    callback: () => { const target = [...game.user.targets][0]; return this.request("command", { castId: record.castId, command: list.attack.name, targetUuid: target?.document?.uuid ?? null }); } });
                controls.push({ action: `command-other-${journal.id}`, label: `${record.name}: another command (${list.commands.map(command => command.name).join(", ")})`,
                    callback: async () => {
                        const command = await foundry.applications.api.DialogV2.prompt({ window: { title: `${record.name} — command` },
                            content: `<select name="command">${list.commands.map(command => `<option value="${command.name}">${command.name}: ${command.text}</option>`).join("")}</select>`,
                            ok: { label: "Command", callback: (_event, button) => button.form.elements.command.value }, rejectClose: false });
                        return command ? this.request("command", { castId: record.castId, command }) : null;
                    } });
            }
            // An impossible spell's marks: Fuel burns every creature still marked.
            if (record.status === "active" && record.entries.some(e => e.status === "active" && !e.detached && e.metadata?.impossibleMark)
                && (game.user.isGM || caster?.testUserPermission(game.user, "OWNER"))) {
                const marked = record.entries.filter(e => e.status === "active" && e.metadata?.impossibleMark).length;
                controls.push({ action: `fuel-${journal.id}`, label: `Fuel ${record.name} (${marked} marked)`, callback: () => this.request("fuel", { castId: record.castId }) });
            }
            // A spell waiting for its trigger: the targeted creature saves, then the spell ends.
            if (record.status === "active") for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.storedTrigger)) {
                if (!(game.user.isGM || caster?.testUserPermission(game.user, "OWNER"))) continue;
                // Images around the caster (Trickster's Mirrors): the odds when an attack would hit, a miss breaking one, area damage, a Sustain.
                if (entry.metadata.storedTrigger.images) {
                    const images = entry.metadata.storedTrigger.images, count = (await fromUuid(entry.uuid))?.getFlag(MODULE_ID, "images") ?? images.start;
                    const act = (action, attackerUuid = null) => this.request("images", { castId: record.castId, uuid: entry.uuid, action, attackerUuid });
                    controls.push({ action: `images-roll-${journal.id}-${controls.length}`, label: `${record.name}: an attack would hit (${count} ${images.noun}${count === 1 ? "" : "s"}; roll)`, callback: () => act("roll") },
                        { action: `images-miss-${journal.id}-${controls.length}`, label: `${record.name}: an attack missed, not critically (target the attacker)`, callback: () => {
                            const targets = [...game.user.targets];
                            if (targets.length !== 1) return ui.notifications.warn(`Target the one creature whose attack missed.`);
                            return act("miss", targets[0].document.uuid);
                        } },
                        { action: `images-area-${journal.id}-${controls.length}`, label: `${record.name}: damage on everything in the space (all ${images.noun}s destroyed)`, callback: () => act("area") },
                        { action: `images-sustain-${journal.id}-${controls.length}`, label: `Sustain ${record.name} (+1 ${images.noun}, up to ${images.max})`, callback: () => act("sustain") });
                    continue;
                }
                // A Hit Point pool (Shattering Gem): "Struck" with the attacker targeted — the flat check, then the damage the pool takes first.
                if (entry.metadata.storedTrigger.pool) {
                    const pool = entry.metadata.storedTrigger.pool, left = (await fromUuid(entry.uuid))?.getFlag(MODULE_ID, "poolHp") ?? entry.metadata.poolHp;
                    controls.push({ action: `pool-${journal.id}-${controls.length}`, label: `${record.name}: ${entry.metadata.targetName} was Struck (${pool.label} ${left} HP; target the attacker)`,
                        callback: async () => {
                            const targets = [...game.user.targets];
                            if (targets.length !== 1) return ui.notifications.warn(`Target the one creature that Struck ${entry.metadata.targetName}.`);
                            const check = await this.request("pool-check", { castId: record.castId, uuid: entry.uuid });
                            if (!check?.success) return;
                            const damage = await foundry.applications.api.DialogV2.prompt({ window: { title: `${record.name} — the ${pool.label} blocks` },
                                content: `<label>Damage ${foundry.utils.escapeHTML(entry.metadata.targetName)} just took from that Strike <input type="number" name="damage" min="0" value="0" autofocus></label>`,
                                ok: { label: "Block", callback: (_event, button) => Number(button.form.elements.damage.value) }, rejectClose: false });
                            if (!Number.isInteger(damage)) return;
                            return this.request("pool-absorb", { castId: record.castId, uuid: entry.uuid, damage, attackerUuid: targets[0].document.uuid });
                        } });
                    continue;
                }
                // Held on the cast's target: that creature saves; nothing to target.
                const held = entry.metadata.storedTrigger.held === true;
                controls.push({ action: `stored-trigger-${journal.id}-${controls.length}`, label: held ? `Trigger ${record.name} (${entry.metadata.targetName ?? "its target"})` : `Trigger ${record.name} (targeted creature)`,
                    callback: async () => {
                        if (held) return this.storedTriggers.trigger({ castId: record.castId, uuid: entry.uuid, targetUuid: entry.metadata.targetTokenUuid });
                        const targets = [...game.user.targets];
                        if (targets.length !== 1) return ui.notifications.warn(`Target the one creature that triggered ${record.name}.`);
                        return this.storedTriggers.trigger({ castId: record.castId, uuid: entry.uuid, targetUuid: targets[0].document.uuid });
                    } });
            }
            // Thorns: each trigger deals its damage to the targeted creature.
            if (record.status === "active") for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.retaliation)) {
                if (!(game.user.isGM || caster?.testUserPermission(game.user, "OWNER"))) continue;
                entry.metadata.retaliation.triggers.forEach((trigger, index) => controls.push({ action: `retaliate-${journal.id}-${controls.length}`,
                    label: `Retaliate: ${record.name}${entry.metadata.retaliation.triggers.length > 1 ? ` (${trigger.trigger.replace(/\.$/, "")})` : ""} — ${trigger.fixedTarget === "enemy" && entry.metadata.guard ? entry.metadata.guard.enemyName : "targeted creature"}`,
                    callback: async () => {
                        // A guarded ally's enemy is recorded: no targeting.
                        if (trigger.fixedTarget === "enemy" && entry.metadata.guard?.enemyTokenUuid)
                            return this.request("retaliate", { castId: record.castId, uuid: entry.uuid, index, targetUuid: entry.metadata.guard.enemyTokenUuid });
                        const targets = [...game.user.targets];
                        if (targets.length !== 1) return ui.notifications.warn(`Target the one creature that set off ${record.name}.`);
                        // A discharge scaled by the Strikes that hit: ask how many.
                        let count = null;
                        if (trigger.damage?.byCount) {
                            count = await foundry.applications.api.DialogV2.wait({ window: { title: `${record.name} — Strikes that hit this turn` }, content: "<p>How many Strikes hit with the weapon this turn?</p>",
                                buttons: trigger.damage.byCount.map((_, n) => ({ action: String(n + 1), label: String(n + 1), callback: () => n + 1 })), close: () => null, rejectClose: false });
                            if (!count) return;
                        }
                        return this.request("retaliate", { castId: record.castId, uuid: entry.uuid, index, targetUuid: targets[0].document.uuid, count });
                    } }));
            }
            // "Each time the target takes a hostile action, the target takes 1d4 mental damage": the GM reports the hostile action.
            if (record.status === "active") for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.triggeredDamage)) {
                if (!(game.user.isGM || caster?.testUserPermission(game.user, "OWNER"))) continue;
                const who = entry.metadata.triggeredDamage.targetName ?? (await fromUuid(entry.actorUuid))?.name ?? "the target";
                // (Or "didn't Stride, Fly or Swim this turn": Agitate's damage at the end of its turn.)
                const what = { "no-move": "didn't Stride, Fly or Swim this turn", "no-escape": "didn't Escape before the spell ended",
                    explosion: "— the lodged projectile explodes (target the adjacent creatures it also hits)", "spell-affected": "became affected by a spell with a duration", "no-seek": "ended its turn without Seeking or otherwise trying to disbelieve its surroundings", "auditory-or-cast": "performed an auditory action or Cast a Spell", "spell-cast": "Cast a Spell",
                    daily: "— a day has passed (its daily damage)", hourly: "— an hour has passed (its hourly damage)", auditory: "used an action with the auditory trait", "attack-against-caster": "attacked the caster (discharge the rune)", "cage-broken": "Escaped, or the cage was destroyed or Dismissed (the shards)", "weapon-hit": "was hit by the target weapon", noncompliance: "didn't comply with the demand by the end of its next turn (if it complied, end the spell instead)", "strike-wound": `took at least ${entry.metadata.triggeredDamage.threshold} piercing or slashing damage from a single Strike`,
                    "attack-result": `'s attack was a ${(entry.metadata.triggeredDamage.results ?? []).map(result => result === "criticalFailure" ? "critical failure" : "failure").join(" or ")}` }[entry.metadata.triggeredDamage.trigger] ?? "took a hostile action";
                // (Warrior's Regret: the GM gives how many different creatures it damaged this turn.)
                const counted = entry.metadata.triggeredDamage.trigger === "creatures-damaged";
                controls.push({ action: `hostile-${journal.id}-${controls.length}`, label: counted ? `${record.name}: ${who}'s turn ended (creatures it damaged)` : `${record.name}: ${who}${what.startsWith("'") ? "" : " "}${what}`,
                    callback: async () => {
                        let count = null;
                        if (counted) {
                            count = await foundry.applications.api.DialogV2.wait({ window: { title: `${record.name} — creatures damaged` }, content: `<p>How many different creatures did ${escapeHTML(who)} intentionally damage this turn?</p>`,
                                buttons: Array.from({ length: entry.metadata.triggeredDamage.maxCount + 1 }, (_, n) => ({ action: String(n), label: String(n), callback: () => n })), close: () => null, rejectClose: false });
                            if (count == null) return;
                        }
                        return this.request("hostile-damage", { castId: record.castId, uuid: entry.uuid, count,
                            adjacentUuids: entry.metadata.triggeredDamage.adjacent ? [...game.user.targets].map(token => token.document.uuid) : [] });
                    } });
                // (Ymeri's Mark: Dismiss to detonate — with or without the marked creature; the general one is replaced.)
                if (entry.metadata.triggeredDamage.trigger === "detonate") {
                    controls.pop();
                    for (const includeTarget of [false, true]) controls.push({ action: `detonate-${includeTarget ? "with" : "without"}-${journal.id}-${controls.length}`,
                        label: `${record.name}: Dismiss — detonate the mark on ${who} (${entry.metadata.triggeredDamage.emanation}-foot emanation${includeTarget ? ", including it" : ", not including it"})`,
                        callback: () => this.request("detonate", { castId: record.castId, uuid: entry.uuid, includeTarget }) });
                }
                // (Unravel Knowledge: one control per kind of ability; the general one is replaced.)
                if (entry.metadata.triggeredDamage.trigger === "ability-used") {
                    controls.pop();
                    for (const [index, variant] of (entry.metadata.triggeredDamage.variants ?? []).entries()) controls.push({ action: `hostile-ability-${index}-${journal.id}-${controls.length}`,
                        label: `${record.name}: ${who} used ${variant.label} (once a round: ${variant.dice}d${variant.die}${variant.heightening ? "+" : ""} ${entry.metadata.triggeredDamage.type})`,
                        callback: () => this.request("hostile-damage", { castId: record.castId, uuid: entry.uuid, variant: index }) });
                }
                // (Achaekek's Clutch: the GM gives the persistent damage's amount; the general one is replaced.)
                if (entry.metadata.triggeredDamage.trigger === "bleed-gained") {
                    controls.pop();
                    const td = entry.metadata.triggeredDamage;
                    controls.push({ action: `hostile-bleed-${journal.id}-${controls.length}`, label: `${record.name}: ${who} gained persistent ${td.persistentType} damage (once a round: that amount as ${td.type})`,
                        callback: async () => {
                            const amount = await foundry.applications.api.DialogV2.prompt({ window: { title: `${record.name} — the persistent ${td.persistentType} damage` },
                                content: `<p>How much persistent ${escapeHTML(td.persistentType)} damage did ${escapeHTML(who)} gain (for example 1d6 or 4)?</p><input type="text" name="amount">`,
                                ok: { label: "Rake", callback: (_event, button) => button.form.elements.amount.value }, rejectClose: false });
                            if (!amount) return;
                            return this.request("hostile-damage", { castId: record.castId, uuid: entry.uuid, amount });
                        } });
                }
                // (Bloodspray Curse: one control per damage type of the wounding Strike; the general one is replaced.)
                if (entry.metadata.triggeredDamage.trigger === "strike-wound") {
                    controls.pop();
                    for (const type of entry.metadata.triggeredDamage.types ?? []) controls.push({ action: `hostile-${type}-${journal.id}-${controls.length}`,
                        label: `${record.name}: ${who} took at least ${entry.metadata.triggeredDamage.threshold} ${type} damage from a single Strike (once a round)`,
                        callback: () => this.request("hostile-damage", { castId: record.castId, uuid: entry.uuid, damageType: type }) });
                }
                // (Implement of Destruction: a critical hit by the weapon also gives the row's condition.)
                if (entry.metadata.triggeredDamage.criticalCondition) controls.push({ action: `hostile-critical-${journal.id}-${controls.length}`,
                    label: `${record.name}: ${who} was critically hit by the target weapon (the damage and ${entry.metadata.triggeredDamage.criticalCondition.slug} ${entry.metadata.triggeredDamage.criticalCondition.value})`,
                    callback: () => this.request("hostile-damage", { castId: record.castId, uuid: entry.uuid, critical: true }) });
            }
            // The Everfull Moon: Fuel.
            if (record.status === "active") for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.fuelForm)) {
                if (!(game.user.isGM || caster?.testUserPermission(game.user, "OWNER"))) continue;
                controls.push({ action: `fuel-${journal.id}-${controls.length}`, label: `${record.name}: Fuel (${entry.metadata.fuelForm.tempHP} temporary Hit Points)`,
                    callback: () => this.request("fuel-form", { castId: record.castId, uuid: entry.uuid }) });
            }
            // Fungal Hyphae: a plant Strike at the targeted creature (the multiple attack penalty chosen).
            if (record.status === "active") for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.plantStrike)) {
                if (!(game.user.isGM || caster?.testUserPermission(game.user, "OWNER"))) continue;
                controls.push({ action: `plant-${journal.id}-${controls.length}`, label: `${record.name}: a plant Strike at the targeted creature`, callback: async () => {
                    const [token] = [...game.user.targets]; if (!token) return ui.notifications.warn("Target the creature first.");
                    const map = await foundry.applications.api.DialogV2.wait({ window: { title: `${record.name} — multiple attack penalty` }, content: "<p>Which attack is this, this turn?</p>",
                        buttons: [["0", "First"], ["1", "Second (−5)"], ["2", "Third or later (−10)"]].map(([action, label]) => ({ action, label, callback: () => Number(action) })), close: () => null, rejectClose: false });
                    if (map == null) return;
                    return this.request("plant-strike", { castId: record.castId, uuid: entry.uuid, targetUuid: token.document.uuid, map });
                } });
            }
            // Cauterize Wounds: repeat for the targeted creature.
            if (record.status === "active") for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.cauterize)) {
                if (!(game.user.isGM || caster?.testUserPermission(game.user, "OWNER"))) continue;
                controls.push({ action: `cauterize-${journal.id}-${controls.length}`, label: `${record.name}: repeat for the targeted creature (1 action)`,
                    callback: () => { const [token] = [...game.user.targets]; if (!token) return ui.notifications.warn("Target the creature first.");
                        return this.request("cauterize", { castId: record.castId, uuid: entry.uuid, targetUuid: token.actor.uuid }); } });
            }
            // Albatross Curse: the target did what the spell invites; it saves now.
            if (record.status === "active" && game.user.isGM) for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.deferredSave)) {
                controls.push({ action: `deferred-${journal.id}-${controls.length}`, label: `${record.name}: ${entry.metadata.targetName ?? "the target"} killed the ${entry.metadata.deferredSave.trigger} (it saves)`,
                    callback: () => this.request("deferred-save", { castId: record.castId, uuid: entry.uuid }) });
            }
            // Rallying Banner: the bearer touched a willing creature; the banner moves to it.
            if (record.status === "active" && record.declaration?.transferable && game.user.isGM) controls.push({ action: `transfer-${journal.id}-${controls.length}`,
                label: `${record.name}: move the banner to the targeted creature`,
                callback: () => { const [token] = [...game.user.targets]; if (!token) return ui.notifications.warn("Target the new bearer.");
                    return this.request("transfer-aura", { castId: record.castId, tokenUuid: token.document.uuid }); } });
            // Vital Luminance: an undead in the bright light damaged the caster; or the Dismiss into a targeted creature.
            if (record.status === "active" && record.luminance && (game.user.isGM || caster?.isOwner)) for (const [mode, label] of [["undead", "the targeted undead damaged you in the bright light (half the reservoir)"], ["dismiss", "Dismiss into the targeted creature (heal it, or damage an undead)"]])
                controls.push({ action: `luminance-${mode}-${journal.id}-${controls.length}`, label: `${record.name}: ${label}`,
                    callback: () => { const [token] = [...game.user.targets]; if (!token) return ui.notifications.warn("Target the creature first.");
                        return this.request("luminance", { castId: record.castId, mode, tokenUuid: token.document.uuid }); } });
            // Winning Streak: the targeted creature critically hit a significant foe.
            if (record.status === "active" && record.streak && game.user.isGM) controls.push({ action: `streak-${journal.id}-${controls.length}`,
                label: `${record.name}: the targeted creature critically hit a significant foe (the streak goes on)`,
                callback: () => { const [token] = [...game.user.targets]; if (!token) return ui.notifications.warn("Target the creature that got the critical hit.");
                    return this.request("streak-crit", { castId: record.castId, tokenUuid: token.document.uuid }); } });
            // A condition's own 1-action save (Pressure Zone's popped ears): the bearer (or GM) rolls it; a success loses just that condition.
            if (record.status === "active") for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && (e.metadata?.conditions ?? []).some(c => c.actionSave))) {
                const effect = await fromUuid(entry.uuid);
                if (!effect || !(game.user.isGM || effect.actor?.isOwner)) continue;
                for (const condition of entry.metadata.conditions.filter(c => c.actionSave && effect.flags?.pf2e?.itemGrants?.[c.ruleFlag]))
                    controls.push({ action: `condition-save-${journal.id}-${controls.length}`, label: `${effect.actor.name}: 1 action — ${condition.actionSave.statistic[0].toUpperCase()}${condition.actionSave.statistic.slice(1)} save to lose ${condition.label ?? condition.slug}`,
                        callback: () => this.request("condition-save", { castId: record.castId, uuid: entry.uuid, ruleFlag: condition.ruleFlag }) });
            }
            // Mirror's Misfortune: a creature took a hostile action against the duplicate; it saves, and the duplicate shatters.
            if (record.status === "active" && game.user.isGM) for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.mirrorDuplicate)) {
                controls.push({ action: `mirror-${journal.id}-${controls.length}`, label: `${record.name}: the targeted creature attacked the duplicate (it saves; the duplicate shatters)`,
                    callback: () => { const [token] = [...game.user.targets]; if (!token) return ui.notifications.warn("Target the attacker first.");
                        return this.request("mirror-shatter", { castId: record.castId, uuid: entry.uuid, targetUuid: token.actor.uuid }); } });
            }
            // Flame Wisp: send a wisp at the targeted creature the caster's Strike damaged, or add one for a fire spell.
            if (record.status === "active") for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.wisps)) {
                if (!(game.user.isGM || caster?.testUserPermission(game.user, "OWNER"))) continue;
                controls.push({ action: `wisp-${journal.id}-${controls.length}`, label: `${record.name}: a Strike damaged the targeted creature (send a wisp)`,
                    callback: () => { const [token] = [...game.user.targets]; if (!token) return ui.notifications.warn("Target the creature first.");
                        return this.request("wisp", { castId: record.castId, uuid: entry.uuid, action: "strike", targetUuid: token.document.uuid }); } });
                controls.push({ action: `wisp-${journal.id}-${controls.length}`, label: `${record.name}: you cast a ${entry.metadata.wisps.trait} spell (a new wisp)`,
                    callback: () => this.request("wisp", { castId: record.castId, uuid: entry.uuid, action: "regrow" }) });
            }
            // Mirror Image: the GM reports how an attack against the caster went; the control rolls which it hits.
            if (record.status === "active") for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.imageDecoys)) {
                if (!(game.user.isGM || caster?.testUserPermission(game.user, "OWNER"))) continue;
                for (const [result, label] of [["hit", "an attack would hit"], ["critical", "an attack would critically hit"], ["miss", "an attack missed (not a critical failure)"]])
                    controls.push({ action: `decoy-${journal.id}-${controls.length}`, label: `${record.name}: ${label}${entry.metadata.imageDecoys.colors ? " (target the attacker)" : ""}`,
                        callback: () => this.request("decoy", { castId: record.castId, uuid: entry.uuid, result, attackerUuid: [...game.user.targets][0]?.document?.uuid ?? null }) });
            }
            // The creature's Recall Knowledge to end its fascination (Unsettling Knowledge): its owner or the GM picks the caster's chosen skill.
            if (record.status === "active") for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.recallEscape)) {
                const actor = await fromUuid(entry.actorUuid);
                if (!(game.user.isGM || actor?.testUserPermission(game.user, "OWNER"))) continue;
                controls.push({ action: `recall-escape-${journal.id}-${controls.length}`, label: `${record.name}: ${actor?.name ?? "the creature"} Recalls Knowledge to end its fascination`,
                    callback: async () => {
                        const skill = await foundry.applications.api.DialogV2.prompt({ window: { title: `${record.name} — the chosen skill` },
                            content: `<select name="skill">${entry.metadata.recallEscape.skills.map(skill => `<option value="${skill}">${skill[0].toUpperCase()}${skill.slice(1)}</option>`).join("")}</select>`,
                            ok: { label: "Recall Knowledge", callback: (_event, button) => String(button.form.elements.skill.value) }, rejectClose: false });
                        if (skill) return this.request("recall-escape", { castId: record.castId, uuid: entry.uuid, skill });
                    } });
            }
            // A question asked with each Sustain (Mind Probe): the creature's Deception against the DC, the result whispered to the GM.
            if (record.status === "active" && game.user.isGM) for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.questionCheck)) {
                const actor = await fromUuid(entry.actorUuid);
                controls.push({ action: `question-check-${journal.id}-${controls.length}`, label: `${record.name}: ask ${actor?.name ?? "the creature"} a question (its ${entry.metadata.questionCheck.skill} vs DC ${entry.metadata.questionCheck.dc})`,
                    callback: () => this.request("question-check", { castId: record.castId, uuid: entry.uuid }) });
            }
            // The creature's failed roll, reported by the GM (Delusional Pride): the penalty, raised on a second failure.
            if (record.status === "active" && game.user.isGM) for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.triggeredPenalty)) {
                const actor = await fromUuid(entry.actorUuid);
                controls.push({ action: `triggered-penalty-${journal.id}-${controls.length}`, label: `${record.name}: ${actor?.name ?? "the creature"} failed an attack roll or skill check (penalty)`,
                    callback: () => this.request("triggered-penalty", { castId: record.castId, uuid: entry.uuid }) });
            }
            // What raises the creature's condition, reported by the GM (Censure Falsehoods).
            if (record.status === "active" && game.user.isGM) for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.triggeredIncrease)) {
                const actor = await fromUuid(entry.actorUuid);
                controls.push({ action: `triggered-increase-${journal.id}-${controls.length}`, label: `${record.name}: ${actor?.name ?? "the creature"} ${entry.metadata.triggeredIncrease.trigger} (${entry.metadata.triggeredIncrease.slug} +1)`,
                    callback: () => this.request("triggered-increase", { castId: record.castId, uuid: entry.uuid }) });
            }
            // The creature's own action to end the spell with a save (Croak Voice): its owner or the GM rolls it.
            if (record.status === "active") for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.endSave)) {
                const actor = await fromUuid(entry.actorUuid);
                if (!(game.user.isGM || actor?.testUserPermission(game.user, "OWNER"))) continue;
                const statistic = entry.metadata.endSave.statistic[0].toUpperCase() + entry.metadata.endSave.statistic.slice(1);
                controls.push({ action: `end-save-${journal.id}-${controls.length}`, label: `${record.name}: ${actor?.name ?? "the creature"} — ${entry.metadata.endSave.label} (${statistic} save to end it)`,
                    callback: () => this.request("end-save", { castId: record.castId, uuid: entry.uuid }) });
            }
            // "The target can also try to disbelieve the illusion if it touches the treasure, …": the GM reports the interaction.
            if (record.status === "active" && game.user.isGM) for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.disbelieve)) {
                const who = entry.metadata.targetName ?? (await fromUuid(entry.actorUuid))?.name ?? "the target";
                controls.push({ action: `disbelieve-${journal.id}-${controls.length}`, label: `${record.name}: ${who} interacts with the illusion (Disbelieve)`,
                    callback: () => this.request("disbelieve", { castId: record.castId, uuid: entry.uuid }) });
            }
            // "Attacks made with metal objects against you take a -1 status penalty": the GM targets the attacker before its attack.
            if (record.status === "active" && game.user.isGM) for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.metalAttack)) {
                const who = entry.metadata.targetName ?? "the caster";
                controls.push({ action: `metal-attack-${journal.id}-${controls.length}`, label: `${record.name}: the targeted creature attacks ${who} with a metal object (penalty for its next attack roll)`,
                    callback: () => { const token = [...game.user.targets][0]; if (!token || game.user.targets.size !== 1) { ui.notifications.warn("Target the one attacking creature."); return null; }
                        return this.request("metal-attack", { castId: record.castId, uuid: entry.uuid, tokenUuid: token.document.uuid }); } });
            }
            // "a creature that touches the target can attempt to disbelieve the illusion": the GM targets the toucher.
            if (record.status === "active" && game.user.isGM) for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.touchDisbelieve)) {
                const who = entry.metadata.targetName ?? (await fromUuid(entry.actorUuid))?.name ?? "the target";
                controls.push({ action: `touch-disbelieve-${journal.id}-${controls.length}`, label: `${record.name}: the targeted creature touches ${who} (Disbelieve)`,
                    callback: () => { const token = [...game.user.targets][0]; if (!token || game.user.targets.size !== 1) { ui.notifications.warn("Target the one creature that touches it."); return null; }
                        return this.request("touch-disbelieve", { castId: record.castId, uuid: entry.uuid, tokenUuid: token.document.uuid }); } });
            }
            // "you regain … Hit Points each time the target takes bleed damage": the GM reports the bleed damage.
            if (record.status === "active") for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.triggeredHealing)) {
                if (!(game.user.isGM || caster?.testUserPermission(game.user, "OWNER"))) continue;
                const who = entry.metadata.triggeredHealing.targetName ?? (await fromUuid(entry.actorUuid))?.name ?? "the target";
                controls.push({ action: `healing-${journal.id}-${controls.length}`, label: `${record.name}: ${who} took bleed damage (the caster regains Hit Points)`,
                    callback: () => this.request("triggered-healing", { castId: record.castId, uuid: entry.uuid }) });
            }
            // Magic's Vessel: the caster cast a spell from a slot — the triggered Effect for this cast's recipient.
            if (record.status === "active") for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.triggeredEffect)) {
                if (!(game.user.isGM || caster?.testUserPermission(game.user, "OWNER"))) continue;
                const who = (await fromUuid(entry.actorUuid))?.name ?? "the target";
                controls.push({ action: `triggered-${journal.id}-${controls.length}`, label: `${record.name}: you cast a spell from a slot — resistance for ${who} (and Sustain)`,
                    callback: () => this.request("triggered-effect", { castId: record.castId, uuid: entry.uuid }) });
            }
            // Life Link: a linked creature took damage — share it with the caster.
            if (record.status === "active") for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.damageShare)) {
                if (!(game.user.isGM || caster?.testUserPermission(game.user, "OWNER"))) continue;
                controls.push({ action: `share-${journal.id}-${controls.length}`, label: `${record.name}: ${entry.metadata.targetName} took damage`, callback: async () => {
                    const damage = await foundry.applications.api.DialogV2.prompt({ window: { title: `${record.name} — damage taken` },
                        content: `<label>Damage ${foundry.utils.escapeHTML(entry.metadata.targetName)} just took <input type="number" name="damage" min="0" value="0" autofocus></label>`,
                        ok: { label: "Share", callback: (_event, button) => Number(button.form.elements.damage.value) }, rejectClose: false });
                    if (!Number.isInteger(damage)) return;
                    return this.request("share", { castId: record.castId, uuid: entry.uuid, damage });
                } });
            }
            // A standing ward: counteract what the GM names (the ward's cast rank), each time it's triggered.
            if (record.status === "active") for (const entry of record.entries.filter(e => e.status === "active" && !e.detached && e.metadata?.ward)) {
                const ward = entry.metadata.ward;
                if (!(game.user.isGM || caster?.testUserPermission(game.user, "OWNER"))) continue;
                controls.push({ action: `ward-${journal.id}-${controls.length}`, label: `${ward.reaction ? "Reaction: " : ""}Counteract with ${record.name}${ward.named ? ` (${ward.named})` : ""}`,
                    callback: async () => {
                        const choice = await foundry.applications.api.DialogV2.prompt({ window: { title: `${record.name} — counteract` },
                            content: `<p>${escapeHTML(ward.trigger)}</p>${(ward.notes ?? []).map(note => `<p>${escapeHTML(note)}</p>`).join("")}
                                <label>The effect or spell <input type="text" name="name"></label><label>Its counteract DC <input type="number" name="dc"></label>
                                <label>Its counteract rank${ward.cantripRank ? " (a cantrip counts as 1st rank)" : ""} <input type="number" name="rank"></label>`,
                            ok: { label: "Roll counteract", callback: (_event, button) => ({ name: String(button.form.elements.name.value).trim(), dc: Number(button.form.elements.dc.value), rank: Number(button.form.elements.rank.value) }) },
                            rejectClose: false });
                        if (choice) return this.request("ward-counteract", { castId: record.castId, uuid: entry.uuid, ...choice });
                    } });
            }
            controls.push(...(record.kind === "form" ? this.forms.controls(journal, record) : await this.#family?.controls(journal, record) ?? []));
            const entries = [];
            for (const entry of record.entries) {
                const document = await fromUuid(entry.uuid), actor = await fromUuid(entry.actorUuid);
                const remaining = document?.remainingDuration?.remaining;
                entries.push(`${document?.name ?? "Ended contribution"} → ${actor?.name ?? "Missing recipient"}: ${entry.detached ? "Managed separately" : entry.status}${Number.isFinite(remaining) ? `, ${Math.max(0, Math.ceil(remaining))} seconds remaining` : ""}`);
            }
            rows.push({ record, caster, entries, controls });
        }
        const actions = rows.flatMap(row => row.controls);
        let actionIndex = 0;
        this.#dialog?.close();
        this.#dialog = new foundry.applications.api.DialogV2({ window: { title: "Ongoing spells" }, position: { width: 780 },
            content: rows.length ? `<div style="max-height:65vh;overflow:auto">${rows.map(({ record, caster, entries, controls }) => `<section><h3>${escapeHTML(record.name)}</h3><p>Caster: ${escapeHTML(caster?.name ?? "Missing source — review required")} · ${escapeHTML(record.status)}</p><p>${escapeHTML(record.reviewReason ?? "")}</p><ul>${entries.map(entry => `<li>${escapeHTML(entry)}</li>`).join("")}</ul><p>${record.obligations.filter(o => !["completed", "skipped"].includes(o.status)).map(o => escapeHTML(`${o.label ?? o.kind}: ${o.status}`)).join("; ")}</p><div style="display:flex;flex-wrap:wrap;gap:6px">${controls.map(control => `<button type="button" style="width:auto" data-ongoing-index="${actionIndex++}">${escapeHTML(control.label)}</button>`).join("")}</div></section>`).join("")}</div>` : "<p>No active tracked spells.</p>",
            buttons: [{ action: "refresh", label: "Refresh overview", callback: () => this.open() }, { action: "close", label: "Close overview" }]
        });
        const dialog = this.#dialog;
        dialog.addEventListener("render", () => {
            for (const button of dialog.element.querySelectorAll("[data-ongoing-index]")) button.addEventListener("click", async () => {
                button.disabled = true;
                try { await actions[Number(button.dataset.ongoingIndex)].callback(); } catch (error) { ui.notifications.error(error.message); }
                await this.open();
            });
        }, { once: true });
        this.#dialog.render(true);
    }
    refreshView() { /* Explicit refresh keeps an open decision from being replaced mid-click. */ }
}
