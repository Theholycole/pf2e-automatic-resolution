export const ONGOING_FLAG = "ongoingCast";

export function coordinatorId(users) {
    return [...users].filter(user => user.active && user.isGM).sort((a, b) => a.id.localeCompare(b.id))[0]?.id ?? null;
}

export function boundaryKey(clock, actorUuid, event) {
    return `${clock.combatId}:${clock.round}:${clock.turn}:${actorUuid}:${event}`;
}

/** Compare actual roster positions. Skipped/backtracked/changed rosters need review. */
export function turnAdvance(previous, current) {
    if (!previous?.combatId || previous.combatId !== current?.combatId || !current.started) return "unknown";
    if (JSON.stringify(previous.roster) !== JSON.stringify(current.roster)) return "unknown";
    const count = current.roster.length;
    const delta = (current.round - previous.round) * count + current.turn - previous.turn;
    return delta === 0 ? "same" : delta === 1 ? "next" : delta < 0 ? "backward" : "jump";
}

export function petrifyProgress(value, degree, actionBudget) {
    if (!Number.isInteger(actionBudget) || actionBudget < 1) throw Error("Confirm the target's actions available before petrification.");
    const delta = { criticalSuccess: -1, success: -1, failure: 1, criticalFailure: 2 }[degree];
    if (delta == null) throw Error("A finalized saving throw is required.");
    const next = Math.max(0, value + delta);
    return { value: next, end: next === 0 ? "recovered" : next >= actionBudget ? "petrified" : null };
}

export function addObligation(record, obligation) {
    record.obligations ??= [];
    if (record.obligations.some(entry => entry.key === obligation.key)) return false;
    record.obligations.push({ status: "pending", ...obligation });
    return true;
}

export function dueWorldTime(record, now) {
    if (record.lastWorldTime == null || now <= record.lastWorldTime) return false;
    return (record.nextSaveAt != null && now >= record.nextSaveAt)
        || (record.sustainDueAt != null && now > record.sustainDueAt);
}
