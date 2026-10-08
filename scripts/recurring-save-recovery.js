// Recurring end-of-turn saves on outcome Effects. When the bearer's turn ends,
// the ongoing coordinator records one obligation for that exact boundary and
// prepares a recovery save card (the cast's snapshotted DC and statistic). The
// finalized degree ends the Effect ("end"), or shortens its rounds timer by one
// and ends it on a critical success ("reduce"). A skipped, jumped or reversed
// turn order goes to GM review; no save is replayed.
import {MODULE_ID} from './effect-runtime.js';
import {clone} from './runtime-utils.js';
import {addObligation, boundaryKey, turnAdvance} from './ongoing-core.js';
import {emptyConditionSavePlan} from './condition-spell-core.js';
import {grantMinionControl} from './minion-control-runtime.js';

const state = journal => journal.getFlag(MODULE_ID, 'ongoingCast');

export function recurringEntry(record, uuid) {
    return record.entries.find(entry => entry.uuid === uuid && entry.status === 'active' && !entry.detached
        && ['end', 'reduce', 'escalate', 'turn-condition'].includes(entry.metadata?.recurringSave?.mode));
}

/** Pure outcome of one recurring save for a remaining rounds timer. */
export function recurringSaveResult(mode, degree, remainingRounds) {
    if (!['criticalSuccess', 'success', 'failure', 'criticalFailure'].includes(degree)) throw Error('Finalize the recurring save first.');
    if (mode === 'end') return ['success', 'criticalSuccess'].includes(degree) ? {end: true} : {end: false};
    if (mode !== 'reduce') throw Error('Unknown recurring save mode.');
    if (degree === 'criticalSuccess') return {end: true};
    if (degree !== 'success') return {end: false};
    if (!Number.isInteger(remainingRounds) || remainingRounds < 1) throw Error('The remaining duration is not a whole number of rounds.');
    return remainingRounds - 1 <= 0 ? {end: true} : {end: false, rounds: remainingRounds - 1};
}

async function prepareCard(ongoing, saves, journal, record, obligation) {
    const entry = recurringEntry(record, obligation.effectUuid);
    const effect = entry && await fromUuid(entry.uuid);
    if (!effect) { obligation.status = 'skipped'; obligation.reason = 'effect-ended'; return; }
    const caster = await fromUuid(record.sourceActorUuid);
    const dc = Number(entry.metadata.recurringSave.dc ?? record.dc);
    if (!record.recoverySource || !caster || !Number.isFinite(dc)) throw Error('The original spell or DC is unavailable for the recurring save.');
    const spell = new CONFIG.Item.documentClass(clone(record.recoverySource), {parent: caster});
    const plan = emptyConditionSavePlan(spell, entry.metadata.recurringSave.statistic);
    plan.resolution.check.purpose = 'condition-recovery';
    // (The spell's save bonus for a trait goes on its later saves too: Lignify's plant creatures.)
    if (entry.metadata.recurringSave.traitSaveBonus) plan.resolution.traitSaveBonus = clone(entry.metadata.recurringSave.traitSaveBonus);
    plan.source.name = `${record.name} — end-of-turn save`;
    const {card} = await saves.start(spell, {sourceActor: caster, plan, targets: [effect.actor], castRank: record.rank, dc,
        recoverySource: record.recoverySource, skipConfirmation: true});
    await card.setFlag(MODULE_ID, 'ongoingCastId', record.castId);
    obligation.cardId = card.id;
    obligation.status = 'collecting';
}

/** Returns true when the record went to review. */
export async function reconcileRecurringSaves(ongoing, saves, journal, {previousClock, clockEvent = false, recover = false} = {}) {
    const record = clone(state(journal));
    const tracked = record.entries.filter(entry => recurringEntry(record, entry.uuid));
    const clock = ongoing.clock();
    // A save due at a boundary immediately followed by expiry has nothing left
    // to end; close it rather than leave a finalizable orphan.
    const orphaned = record.obligations.filter(obligation => obligation.kind === 'recurring-save'
        && ['pending', 'collecting'].includes(obligation.status) && !recurringEntry(record, obligation.effectUuid));
    for (const obligation of orphaned) { obligation.status = 'skipped'; obligation.reason = 'effect-ended'; }
    if (orphaned.length && !tracked.length) { await ongoing.save(journal, record); return false; }
    if (!tracked.length) return false;
    const advance = turnAdvance(previousClock, clock);
    if ((clockEvent || recover) && previousClock?.started && !['same', 'next'].includes(advance)) {
        await ongoing.review(journal, 'Turn order changed. Review missed end-of-turn saves; none were rolled or replayed.', {resumable: true});
        return true;
    }
    const casterTurn = entry => entry.metadata.recurringSave.timing === 'caster-turn-start';
    const ownTurnStart = entry => entry.metadata.recurringSave.timing === 'turn-start';
    // ("if it's no longer in the pressure zone": inside the cast's lingering area, no save this turn.)
    const insideArea = async entry => {
        const castId = entry.metadata.recurringSave.outsideArea;
        if (!castId) return false;
        const area = ongoing.find(castId), data = area ? state(area) : null;
        if (!data || data.status !== 'active') return false;
        const regions = (await Promise.all((data.regionUuids ?? [data.regionUuid]).filter(Boolean).map(uuid => fromUuid(uuid)))).filter(Boolean);
        const actor = await fromUuid(entry.actorUuid);
        return (actor?.getActiveTokens?.(true, true) ?? []).some(token => regions.some(region => { const centre = token.getCenterPoint?.() ?? token.center;
            return region.testPoint({ x: centre.x, y: centre.y, elevation: token.elevation ?? 0 }); }));
    };
    if (advance === 'next') for (const entry of tracked.filter(entry => !casterTurn(entry) && !ownTurnStart(entry) && entry.actorUuid === previousClock.actorUuid)) {
        if (await insideArea(entry)) continue;
        const effect = await fromUuid(entry.uuid);
        addObligation(record, {key: boundaryKey(previousClock, entry.uuid, 'recurring-save'), kind: 'recurring-save',
            effectUuid: entry.uuid, actorUuid: entry.actorUuid,
            label: `${effect?.actor?.name ?? 'Recipient'}: end-of-turn ${entry.metadata.recurringSave.statistic} save (${record.name})`});
    }
    // "… must attempt another save at the start of its turn": when its own turn begins.
    if (advance === 'next') for (const entry of tracked.filter(entry => ownTurnStart(entry) && entry.actorUuid === clock.actorUuid)) {
        const effect = await fromUuid(entry.uuid);
        addObligation(record, {key: boundaryKey(clock, entry.uuid, 'recurring-save-turn-start'), kind: 'recurring-save',
            effectUuid: entry.uuid, actorUuid: entry.actorUuid,
            label: `${effect?.actor?.name ?? 'Recipient'}: start-of-turn ${entry.metadata.recurringSave.statistic} save (${record.name})`});
    }
    // "At the start of each of your turns, the target can attempt another Will save": when the caster's turn begins.
    if (advance === 'next' && clock.actorUuid === record.sourceActorUuid) for (const entry of tracked.filter(casterTurn)) {
        const effect = await fromUuid(entry.uuid);
        addObligation(record, {key: boundaryKey(clock, entry.uuid, 'recurring-save-caster-turn'), kind: 'recurring-save',
            effectUuid: entry.uuid, actorUuid: entry.actorUuid,
            label: `${effect?.actor?.name ?? 'Recipient'}: ${entry.metadata.recurringSave.statistic} save at the start of the caster's turn (${record.name})`});
    }
    const due = record.obligations.filter(obligation => obligation.kind === 'recurring-save' && obligation.status === 'pending' && !obligation.cardId);
    if (due.length) {
        record.status = 'applying';
        await ongoing.save(journal, record);
        try {
            for (const obligation of due) await prepareCard(ongoing, saves, journal, record, obligation);
        } catch (error) {
            await ongoing.review(journal, `Recurring save preparation interrupted: ${error.message}`);
            return true;
        }
        record.status = 'active';
    }
    record.clock = clock; record.lastWorldTime = clock.worldTime;
    await ongoing.save(journal, record);
    return false;
}

export function recurringObligation(journal, cardId) {
    return state(journal)?.obligations?.find(obligation => obligation.cardId === cardId && obligation.kind === 'recurring-save') ?? null;
}

export function assertRecurringSave(journal, cardId, saveState) {
    const record = state(journal), obligation = recurringObligation(journal, cardId);
    if (!obligation || obligation.status !== 'collecting') throw Error('This end-of-turn save is no longer collecting.');
    const entry = recurringEntry(record, obligation.effectUuid);
    if (!entry) throw Error('This recurring save contribution ended or was detached.');
    if (saveState.targets.length !== 1 || saveState.targets[0].actorUuid !== entry.actorUuid) throw Error('An end-of-turn save must retain its original recipient.');
    return {record: clone(record), obligationKey: obligation.key, entry};
}

export async function finalizeRecurringSave(family, journal, card, saveState) {
    const {record, obligationKey} = assertRecurringSave(journal, card.id, saveState);
    const obligation = record.obligations.find(o => o.key === obligationKey), target = saveState.targets[0];
    const entry = recurringEntry(record, obligation.effectUuid), effect = await fromUuid(entry.uuid);
    if (target.excluded || target.eligible === false || !effect) {
        obligation.status = 'completed'; obligation.reason = effect ? 'excluded' : 'effect-ended';
        await family.ongoing.save(journal, record); return;
    }
    const mode = entry.metadata.recurringSave.mode;
    const rounds = effect.system.duration?.unit === 'rounds' ? Number(effect.system.duration.value) : null;
    // (A condition the save raises or lowers: Glacial Heart's slowed. Its granted condition's value moves; at 0 the Effect ends.)
    const granted = mode === 'escalate' ? effect.actor?.itemTypes?.condition?.find(condition => condition.slug === entry.metadata.recurringSave.slug
        && (condition.flags?.pf2e?.grantedBy?.id === effect.id || (effect.flags?.pf2e?.itemGrants ? Object.values(effect.flags.pf2e.itemGrants).some(grant => grant.id === condition.id) : false))) : null;
    if (mode === 'escalate' && !granted) throw Error(`${effect.name}: its granted ${entry.metadata.recurringSave.slug} condition is missing.`);
    const escalated = mode === 'escalate' ? Math.min(entry.metadata.recurringSave.maximum, Number(granted.value ?? granted.system?.value?.value ?? 0) + Number(entry.metadata.recurringSave.steps?.[target.degree] ?? 0)) : null;
    // (A failed start-of-turn save grants its condition for that turn; the note goes on.)
    const turnCondition = mode === 'turn-condition' ? entry.metadata.recurringSave.condition : null;
    // ("When a creature becomes fully unable to act due to the slowed condition …, leaving the target Petrified permanently": slowed at its action count — 3, or 4 when
    // Quickened — petrifies it and ends the spell.)
    const atActions = mode === 'escalate' ? entry.metadata.recurringSave.atActions : null;
    const actionCount = atActions ? 3 + (effect.actor?.hasCondition?.('quickened') ? 1 : 0) : null;
    // (Possession: a critical success forces the caster out — the note ends.)
    const result = mode === 'turn-condition' ? (target.degree === 'criticalSuccess' && entry.metadata.recurringSave.endOnCriticalSuccess ? {end: true} : {end: false, grant: ['failure', 'criticalFailure'].includes(target.degree)})
        : atActions && escalated >= actionCount ? {end: true, petrify: atActions}
        : mode === 'escalate' ? (escalated <= 0 ? {end: true} : {end: false, value: escalated}) : recurringSaveResult(mode, target.degree, mode === 'reduce' ? rounds : null);
    record.status = 'applying'; obligation.status = 'applying'; await family.ongoing.save(journal, record);
    try {
        if (result.petrify && !effect.actor.hasCondition?.(result.petrify.slug)) await effect.actor.increaseCondition(result.petrify.slug);
        if (result.end) {
            await effect.delete({[MODULE_ID]: {ongoingCleanup: true, reason: 'recurring-save'}});
            entry.status = 'ended'; entry.reason = 'recurring-save';
        } else if (result.rounds) {
            await effect.update({'system.duration.value': result.rounds});
            entry.duration = clone(effect.system.duration);
        } else if (result.value != null) {
            await granted.update({'system.value.value': result.value});
        } else if (result.grant) {
            const name = `${turnCondition.slug[0].toUpperCase()}${turnCondition.slug.slice(1)}${turnCondition.value ? ` ${turnCondition.value}` : ""}`;
            const [turnEffect] = await effect.actor.createEmbeddedDocuments('Item', [{name: `${record.name}: ${name} (this turn)`, type: 'effect', img: 'icons/svg/downgrade.svg',
                flags: {[MODULE_ID]: {turnCondition: {castId: record.castId}}},
                system: {duration: {value: 0, unit: 'rounds', expiry: 'turn-end', sustained: false}, start: {value: game.time.worldTime, initiative: game.combat?.combatant?.initiative ?? null},
                    description: {value: `<p>${name} for this turn, from a failed save against <strong>${record.name}</strong>.</p>`},
                    rules: [{key: 'GrantItem', uuid: turnCondition.uuid, onDeleteActions: {grantee: 'restrict'}, ...(turnCondition.value ? {alterations: [{mode: 'override', property: 'badge-value', value: turnCondition.value}]} : {})}]}}]);
            // (Controlled by the caster that turn: the caster's players own its token until the turn's Effect ends — Possession's partial control.)
            if (turnCondition.slug === 'controlled' && turnEffect) await grantMinionControl(turnEffect, effect.actor, record.sourceActorUuid);
        }
        target.conditionResults = [{label: result.petrify ? `${effect.actor.name} is ${result.petrify.slug} permanently; ${effect.name} ended` : result.end ? `${effect.name} ended` : result.rounds ? `${effect.name}: ${result.rounds} rounds remain` : result.value != null ? `${effect.name}: ${entry.metadata.recurringSave.slug} ${result.value}`
            : result.grant ? `${turnCondition.slug}${turnCondition.value ? ` ${turnCondition.value}` : ""} this turn` : `${effect.name} continues`,
            status: 'applied', effectUuid: effect.uuid}];
        obligation.status = 'completed'; obligation.degree = target.degree;
        record.status = record.entries.every(e => e.status === 'ended' || e.detached) ? 'ended' : 'active';
        if (record.status === 'ended') record.endedAt = game.time.worldTime;
        await family.ongoing.save(journal, record);
        if (result.end) await family.ongoing.reconcileLinks(journal);
    } catch (error) {
        await family.ongoing.review(journal, `End-of-turn save outcome interrupted: ${error.message}`);
        throw error;
    }
}

export async function recurringControls(family, journal, record) {
    if (record.status !== 'active') return [];
    const controls = [];
    for (const obligation of record.obligations.filter(o => o.kind === 'recurring-save' && o.status === 'collecting' && o.cardId)) {
        const actor = await fromUuid(obligation.actorUuid);
        if (!game.user.isGM && !actor?.isOwner) continue;
        controls.push({action: `recurring-${journal.id}-${obligation.key}`, label: `Roll ${obligation.label}`, callback: async () => {
            const card = game.messages.get(obligation.cardId);
            if (!card) throw Error('The end-of-turn save card is missing. The GM must review it; no replacement is rolled.');
            for (const target of card.getFlag(MODULE_ID, 'basicSaveState').targets) if (!target.degree) await family.saves.rollSave(card, target.id);
        }});
    }
    return controls;
}
