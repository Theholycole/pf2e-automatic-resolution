# Rank 3 batch 117 — Circle of Protection

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Circle of Protection (3) | The caster picks the alignment. A 10-foot aura around the touched creature lasts 1 minute (an hour from 4th). Every creature inside holds the module's Effect with two toggles: +1 status to AC and saves against that alignment's creatures, and +3 against their controlling effects or summoned attackers. The summoned creatures' Will save to enter is the GM's note. PF2e's Protection Effect, an unconditional +1, isn't used. |

## Rules

- **`src/compiler/protection-circle.js`:** `compileProtectionCircle` reads the five sentences and the heightened duration. `circleMember` builds the generated Effect: two toggles and two FlatModifiers, each with its own slug.
- **Runtime:**
  - `#executeProtectionCircle` asks the alignment and uses Ongoing's target aura.
  - `startTargetAura` now takes `everyone`, for every creature inside rather than allies only, and `transferable`.

## Interpretation

- **The alignment is the caster's pick.** PF2e's remastered creatures carry no alignment, so it's a label, and the bonuses are toggles the roller sets.
- **PF2e's Effect isn't used.** Its bonus applies against everything; the text says against that alignment only.

## Gotcha

Two FlatModifiers in one Effect on the same statistic need their own slugs. Otherwise PF2e keys them alike and keeps only one. This was found live: the +1 vanished.

## Tests

`test/rank-3-batch-117.test.js` is new. It covers the data, the distinct slugs, and a different bonus (not read).

A whole-corpus compile (b641 → b642) changed only Circle of Protection.

## Evidence

[Live evidence](phase-rank-3-batch-117-live-results.json), case `rank3Batch117`, in the `pftest` world, cast at 4th rank.

| Step | Result |
| --- | --- |
| The cast | An hour; the warded creature and a foe beside it hold the Effect; a farther one doesn't |
| The +1 toggle | AC +1 |
| The +3 toggle | AC +3 |
| Ended | The Effects are gone |

**Cleanup:** fixtures removed.
