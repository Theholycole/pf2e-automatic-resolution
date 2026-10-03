# Rank 5 batch 64 — Rallying Banner

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Rallying Banner (5) | The banner rises over a willing creature for the spell's minute: an aura 200 feet around the bearer. The caster's allies inside, the bearer included, hold an Effect while there: +1 status to attack rolls; +1 status to saves against fear effects (PF2e's trait), plus a toggle for a save against despair or against becoming confused or controlled. The bearer has a note: it can stand its ground (Stunned instead of Fleeing), and it can pass the banner by touch. The GM's Ongoing control moves the banner to the targeted creature. Members of the banner's group who aren't the caster's allies, and creatures that can't see or hear it, are the GM's. |

## Rules

- **Rally banner (`src/compiler/rally-banner.js`, compiled in `compileSpell`):**
  - It reads the target, the inspired creatures (their distance), the matched bonuses, the stand-your-ground and transfer sentences, and the transfer action.
  - It builds the member Effect's rules: two FlatModifiers and a toggleable RollOption.
- **Ongoing:**
  - **`startTargetAura`:** a lingering record centred on the target's token, with `aura.includeTargets` and a generated `memberEffect` for allies. It also makes the bearer's note and a GM reminder.
  - **Generated member Effects:** `syncMemberEffect` makes them from the declaration (lost on leaving the aura).
  - **`transferAura`:** the record now centres on the new bearer, and the bearer's note moves to it.
- **Runtime:** effect kind `rally-banner`.

## Interpretation

"Your allies" are the creatures PF2e's alliance makes the caster's allies; the group's other members, sight and hearing are the GM's.

## Tests

`test/rank-5-batch-64.test.js` is new. It covers the kind's data, the predicate, the bearer note, and uneven bonuses (not read).

A whole-corpus compile (b614 → b615) changed only Rallying Banner.

## Evidence

[Live evidence](phase-rank-5-batch-64-live-results.json), case `rank5Batch64`, in the `pftest` world, at 5th rank.

| Step | Result |
| --- | --- |
| The banner on an ally | The bearer and the near ally inspired; the enemy not; the bearer's note |
| The near ally's Will save against a fear effect | +1 Rallying Banner |
| A plain Will save | No bonus |
| The banner moved to the near ally | The note now on it |
| The cast ended | Every Effect gone |

**Cleanup:** fixtures removed.
