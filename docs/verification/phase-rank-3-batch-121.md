# Rank 3 batch 121 — Portrait of Spite and Geas

2026-10-03. Part of the user's ranks 3–5 pass. This batch extends `ritual-degrees`.

**New:**

- **A punishment chosen at the cast:** one of the listed conditions, asked once (or the `punishment` option). Its value depends on each victim's save against the ritual's DC. The GM gives the DC (or the `saveDC` option).
- **An obligation with its strain:** the record on the creature, with card controls for the GM. A day it couldn't comply raises the condition, up to the stated maximum. Complying again ends it. Until then, the module refuses any other reduction or removal (this also covers a locked condition at value 1).
- **The target's level by rank** ("no greater than double the … rank").
- **An unwilling target's save from the heightened rank:** a success leaves it untouched; a failure sets how long the record lasts.

| Ritual | Now |
| --- | --- |
| Portrait of Spite (5) | **Critical success:** the chosen Clumsy, Drained, Enfeebled or Stupefied at 4 for 1 year; 2 on a successful Will save; nothing on a critical success. **Success:** 2, 1 or nothing. **Critical failure:** each caster takes the critical success's punishment, with their own save. The card states the 1d6 hours over which it takes hold. |
| Geas (3) | **Success:** the target's geas record. While it can't comply, the GM's control applies Sickened 1, then +1 a day (at most 4). It can't be reduced or removed until it complies. **Critical success:** the same, plus a +1 status bonus to skill checks behind the toggle "This skill check directly upholds the geas". **Critical failure:** the geas falls on the primary caster. **Target level:** at most double the cast rank. **From 5th:** the GM says whether the target is unwilling. An unwilling target rolls a Will save: a success negates the geas; a failure binds it for 1 week (1 year at 7th, until removed at 9th). |

## Rules

- **`src/compiler/ritual-degrees.js`:** the readers, an `amend` step ("On a successful Will save, the condition value is 2 …" amends the punishment), the Heightened unwilling entries and the level per rank.
- **`scripts/effect-runtime.js`:** `punish`, the strain controls (`ritualStrain`) and the unwilling save. A condition's value is now set directly, because PF2e's `increaseCondition` adds to an existing value.
- **`scripts/main.js`:** the lock hook reads either lock, and a new `preDeleteItem` hook refuses removal.

## Interpretation

The DC, the casters' save on Portrait's critical failure, the onset and Geas's controls are listed in `docs/planning/pending-user-decisions.md`.

## Tests

`test/rank-3-batch-121.test.js` is new. It covers both rituals' actions, mixed values (not read) and a changed strain sentence (not read).

A whole-corpus compile (b705 → b706) changed only these two rituals, apart from empty `levelPerRank` and `unwilling` fields added to the other rituals.

## Evidence

[Live evidence](phase-rank-3-batch-121-live-results.json), case `rank3Batch121`, with `rank3Batch120` and `rank3Batch119` rerun, in the `pftest` world.

| Step | Result |
| --- | --- |
| Portrait, critical success, Enfeebled, target Will −40 vs DC 20 | Enfeebled 4 for 8760 hours |
| Portrait, success, target Will +60 | Critical success: unaffected (an earlier run's natural 1 gave a success: 1) |
| Portrait, critical failure, Clumsy | The helper (Will −40) Clumsy 4; the primary caster as its own save gave (4) |
| Geas at 3rd on a level 7 creature | Refused (at most 6) |
| Geas, success: the control twice | Sickened 1, then 2 |
| Reducing it, then removing it | Refused both times (still 2) |
| Complying | Sickened gone |
| Geas, critical success | The toggled +1 to skill checks |
| Geas at 5th, unwilling, Will −40 | Bound for 168 hours |
| Geas at 5th, unwilling, Will +60 | Resisted: nothing applied |
| Geas, critical failure | The primary caster under the geas |

**Cleanup:** fixtures removed.
