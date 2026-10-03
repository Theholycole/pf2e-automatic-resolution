# Rank 5 batch 79 — Black Tentacles

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Black Tentacles (5) | **The area** is placed (PF2e's template, or a given region) for 1 minute. **At the cast**, the caster's spell attack against each creature inside's Fortitude DC: a success means Grabbed by the tentacles (until it Escapes or the spell ends) and 3d6 bludgeoning. **As a creature ends its turn inside** (Ongoing's area), the tentacles attempt to grab it, or deal 1d6 bludgeoning to one they hold. **The card's control** "Released" frees a targeted creature that Escaped (spell DC) or whose tentacle was destroyed. The tentacles' AC, the 12 damage and Dismiss are GM notes. |

## Rules

- **`src/compiler/tentacle-area.js`:** reads every sentence; PF2e's damage entry is the capture's.
- **`scripts/tentacle-grab.js`:** `tentacleAttempt`, shared by the cast and Ongoing's turn-end hazard (a `tentacles` branch in `applyHazardDamage`).
- **Runtime:** new kind `tentacle-area`; `cardAction("tentacle-release")`.

## Interpretation

- **QUESTION: the turn-end grab's damage.** "Any creature you succeed against is Grabbed and takes 3d6" is read as covering every successful attempt, the turn-end ones too.
- **Every creature inside** is attacked, allies included ("capture creatures in the area").

## Tests

`test/rank-5-batch-79.test.js` is new. It covers the data and an unrecognised clause (not read).

A whole-corpus compile (b687 → b688) changed only Black Tentacles.

## Evidence

[Live evidence](phase-rank-5-batch-79-live-results.json), case `rank5Batch79`, in the `pftest` world, in combat.

| Step | Result |
| --- | --- |
| Cast; a weak creature (Fortitude −40) and a strong one (+60) inside, one outside | The weak one Grabbed and 3d6; the strong one missed; the outside one untouched |
| The weak one's turn ends | 1d6 |
| The strong one, made weak, ends its turn | Grabbed and 3d6 |
| The card releases the weak one | Its grab and Grabbed gone |
| The spell ends | The strong one's grab gone |

**Cleanup:** fixtures, combat and the region removed.
