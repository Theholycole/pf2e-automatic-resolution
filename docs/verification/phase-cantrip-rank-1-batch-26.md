# Cantrip / rank 1 batch 26 — healing at the end of the targets' turns

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| Target `2 creatures who are hostile toward each other`: “The targets regain 1d4 Hit Points at the end of each of their own turns while the spell is in effect.” **Start Healing** starts an Ongoing record per target. At the end of each of its own turns, the target regains 1d4 (+1d4 per rank above 1st) as PF2e healing, for the spell's 5 rounds | Fated Healing (1) |
| “If a target uses a hostile action against the other target, the spell ends for the target that used the hostile action.”: a **GM:** reminder on the card to end that target's record | Fated Healing |

The turn-end trigger is batch 9's (Fire Ray's burning ground), healing instead of damaging.

**Kept strict (tests):**
- Healing that doesn't match the item's entry isn't read.
- Neither is an extra rule (a condition).

## Coverage

**Census:** **508 enabled**, up from 507.
- The b109 corpus diff against b108 changed only Fated Healing.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 563/563 tests pass (`test/cantrip-rank-1-batch-26.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-26-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch26` (in combat, both targets at 480 HP):
- One target was refused (“target exactly 2 creatures”).
- When A's turn ended, A healed 1 and B was unchanged.
- When B's turn ended, B healed 3.
- Each target had its own active record.

**Regressions:** `cr1Batch9` (burning ground) and `lingering` passed, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b109
python3 tools/build-phase-spell-batches.py /tmp/phase23-b109/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch26`, then `cleanup`.
