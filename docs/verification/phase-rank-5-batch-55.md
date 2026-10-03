# Rank 5 batch 55 — Unravel Existence

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Unravel Existence (5) | A sustained lingering burst. When it's cast and on the first Sustain each later round, each creature in it saves (Fortitude rows) against PF2e's 5d10 force damage (+1d10 every 2 ranks). On a failure or critical failure, a creature the GM says isn't native to the plane also takes the text's persistent force damage (1d10 at 5th) and is Off-Guard until that damage ends. The dust at 0 Hit Points is a reminder. |

## Rules

- **Reality unravel (`src/compiler/reality-unravel.js`):**
  - It reads the lead, the rider and the dust sentence.
  - It writes the basic save out as rows: the failing rows add the rider's persistent damage and Off-Guard "as long as it takes this persistent damage".
  - The rider's formula gets its dice count wrapped (`(floor((@item.rank -3)/2))d10`), which Foundry's roll parser needs.
- **Gated row damage (new):**
  - A row's damage formula can carry the row's `gm-question` gate.
  - `outcomeDamageRollIds` leaves it out unless the GM answered yes for that target. The gated Off-Guard was already skipped on a no.
  - The validator requires a gated condition in the same row with the same question. The question gate also accepts this spell's compiled sentence.
- **Interpretation:** the rider's persistent damage isn't doubled on a critical failure ("also takes"). "Native inhabitant" is the GM's answer per creature. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-55.test.js` is new. It covers the plan, the exposures (cast and Sustain), the roll selection by answer, a mismatched gate (refused), and another qualifier (not read).

A whole-corpus compile (b570 → b571) changed only Unravel Existence.

## Evidence

[Live evidence](phase-rank-5-batch-55-live-results.json), case `rank5Batch55`, in the `pftest` world, at 5th rank (caster level 9), in combat.

| Creature | Result |
| --- | --- |
| Native (GM: no), failure | 5d10 force = 38, lost 38; no persistent damage, not Off-Guard |
| From another plane (GM: yes), failure | 5d10 force = 25, lost 25; persistent 1d10 force; Off-Guard |
| Next round's Sustain | both exposed again |

**Cleanup:** fixtures, combat and region removed.
