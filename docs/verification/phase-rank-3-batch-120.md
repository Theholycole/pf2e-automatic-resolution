# Rank 3 batch 120 — rituals with choices, bonuses and backlash

2026-10-03. Part of the user's ranks 3–5 pass. This batch extends `ritual-degrees` (from rank 3 batch 119) with new actions.

**New actions:**

- **The GM's choice** between a result's outcomes: asked, or the `choice` option.
- **Bonuses or penalties** as rule Effects, behind a toggle when the text limits them to a moment. A target that isn't on the scene (a called spirit) gets a reminder instead.
- **Permanent conditions.**
- **Knocked out:** 0 HP and dying (1 + wounded).
- **PF2e's own Effect** for the result.
- **Damage to the casters and the targets.**
- **Damage scaled by a stated rank:** the stored spell's rank is asked, or given by the `storedRank` option.
- **Heightened damage:** the formula and DC at the cast rank.

| Ritual | Now |
| --- | --- |
| Mindscape Door (3) | **Critical failure:** the GM picks. Either the casters take 9d6 mental (basic Will DC 26; 20d6 DC 40 at 8th), or 1d4 casters are pulled in (rolled). The other results are GM lines. |
| Astral Projection (5) | **Critical success:** each target's +4 circumstance bonus to Fortitude, behind the toggle "your astral form died". **Critical failure:** all casters permanently Doomed 1 and knocked out (0 HP, dying). |
| Oblivious Expulsion (5) | **Success:** the target's "memories removed" record. **Critical success:** that and the "hard to detect" record. **Critical failure:** the target's "immune to the ritual" record for 1 month (720 hours). |
| Garden of Death (4) | **Critical success:** PF2e's "Spell Effect: Garden of Death (Critical Success)" on every caster. **Critical failure:** a GM line. |
| Call Spirit (5) | **Critical success:** the spirit's −2 circumstance penalty to Deception, applied to the targeted spirit (a reminder if none is targeted). |
| Rune Trap (3) | **Critical failure:** (4 × the stored spell's rank)d6 force to all casters and the targets, no save. |

## Rules

- **`src/compiler/ritual-degrees.js`:** readers for each new sentence, and the Heightened damage steps.
- **`scripts/effect-runtime.js` `#executeRitualDegrees`:** the new action types.

## Fix

A basic save's multiplier was being dropped: PF2e's `applyDamage` has no multiplier option. The roll is now scaled with PF2e's `alter`, as in the basic-save runtime. Two places had the bug:

- `#executeRitualDegrees`, used by Drain Planar Connection (rank 3 batch 119).
- The Ongoing areas' basic-save hazard (`scripts/ongoing-families.js`), used by Tree of Life and Death (rank 5 batch 86).

Both cases now check the exact doubling, and both were rerun and passed. Their reports have a correction line.

## Interpretation

- **Mindscape Door's "the GM decides"** is a choice on the card.
- **The silver cord's save** happens only if the astral form dies. Its bonus is behind a toggle rather than always on.
- **Rune Trap's backlash** "the casters and the target": the targets are the creatures the GM targets, since the target is an object or area.

## Tests

`test/rank-3-batch-120.test.js` is new. It covers each ritual's actions and an unrecognised rule sentence (not read).

A whole-corpus compile (b704 → b705) changed only the six rituals, apart from an empty `damageSteps` field added to the batch 119 rituals.

## Evidence

[Live evidence](phase-rank-3-batch-120-live-results.json), case `rank3Batch120`, with `rank3Batch119` and `rank5Batch86` rerun, in the `pftest` world.

| Step | Result |
| --- | --- |
| Mindscape Door at 8th, critical failure, feedback | 20d6 rolled 71; the helper (Will −40) lost 142 (doubled) |
| Mindscape Door, critical failure, pulled | 1d4 rolled (1) |
| Astral Projection, critical success | The target's cord Effect: a toggle and +4 |
| Astral Projection, critical failure | Both casters Doomed 1, dying 1, at 0 HP |
| Oblivious Expulsion, success | Only "memories removed" |
| Oblivious Expulsion, critical failure | Immune for 720 hours |
| Garden of Death, critical success | PF2e's Effect on both casters |
| Call Spirit, critical success | The spirit's Deception −2; with no spirit targeted, a reminder only |
| Rune Trap, critical failure, stored rank 2 | 8d6 force (34) to the target and both casters, no save |
| Drain Planar Connection rerun | The helper lost 130 (2 × 65) |
| Tree of Life and Death rerun | The foe took 20 (doubled) |

**Cleanup:** fixtures removed.
