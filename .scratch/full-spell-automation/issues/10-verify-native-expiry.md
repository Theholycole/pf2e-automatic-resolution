# Verify native expiry events in the baseline world

ID: 10
Parent: [Full Spell Automation — First Major Milestone](../map.md)
Label: wayfinder:task
Type: task
Mode: HITL
Status: resolved
Assignee: codex
Blocked by: none

## Question

Which observable events reliably distinguish an Effect expiring from being deleted on the actual Foundry v14 / PF2e 8.5.0 table, including reloads and GM handoff?

This is a prerequisite experiment for choosing ongoing-spell behavior, not production implementation. The [lifecycle research](../../../docs/research/spell-lifecycle-milestone.md) found source evidence that computed expiry may reset an actor without an Item update, while deletion depends on system settings. Source reading alone cannot establish live hook order.

Use a disposable baseline world and record its exact versions, module revision, and automation settings. The agent drives inspection when the live session is available; the human supplies the session or performs inaccessible table actions.

1. Prepare a timed native Effect, an existing effect-ended successor, and a timed condition wrapper. Record actor/token/Effect identities and observed Item, combat, and world-time events.
2. Expire by turn progression and world-time advancement with automatic Effect removal both enabled and disabled. Record rule suppression, document updates/deletion, and successor prompts separately.
3. Repeat across a reload, backward time change, and a change of active GM. Include two GM clients and a player to expose duplicate or lost prompts.
4. Capture whether the existing module transitions exactly once, misses a transition, or requires review. Preserve uncertain results without replaying mutations.

Resolve when the evidence identifies a usable event or reconciliation requirement for each tested route, and records remaining limitations explicitly. Link the trace/observation artifact in the answer. Carry any newly precise questions into their own tickets before deciding the ongoing-spell workflow.

## Comments

The user can provide their local Foundry during coding for automated live testing. Use that instance for this experiment when connected, with a disposable world or designated test fixtures. Verify versions, settings, and client-role availability before execution; do not assume access already exists or mark the experiment complete based on this offer.

### Connection established — 2026-09-19

The user designated `pftest` as disposable and authorized unrestricted test-world
modifications as Gamemaster. Login succeeded at `http://localhost:30000/game`.
Foundry 14.367 and installed PF2e 8.5.0 were identified. See the
[session record](../../../docs/research/local-foundry-session.md).
This is access evidence only: expiry settings, fixtures, event traces, second-GM
availability, and all experimental routes remain unverified.


## Answer

The [live baseline experiment](../../../docs/research/native-expiry-experiment.md) establishes the reconciliation requirement. Effective removal OFF produces computed expiry and ignored rules without Item updates/deletion; reload misses the current successor, and backward time reactivates retained rules. Effective removal ON deletes Effects and cascades the native condition, with one successor after confirmation on the tested time/turn paths. A pending successor was lost when its GM client disconnected, with another GM and player connected.

Use post-native time/combat reconciliation plus Item signals, persistent cast/obligation records independent of deleted Effects, consistent coordination, and stop-for-review recovery. The report identifies fixtures, event order, setting-cache caveat, trace storage, cleanup, and limits. This resolves the planning experiment; implementation-release verification remains pending in the [evidence matrix](../../../docs/planning/release-evidence-matrix.md).
