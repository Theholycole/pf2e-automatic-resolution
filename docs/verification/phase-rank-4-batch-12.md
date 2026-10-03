# Rank 4 batch 12 — Word of Freedom, Tireless Worker

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Word of Freedom (4) | The caster chooses one condition the target has (Confused, Frightened, Grabbed, Paralyzed or Restrained). It is set aside for 1 round and returns afterwards with its own duration paused. Suppressing Grabbed or Restrained also frees the target. |
| Tireless Worker (4) | The same for Clumsy, Encumbered, Enfeebled or Fatigued, for 1 minute. |

## Rules

- **Affliction care (`affliction-care-compiler.js`):** "You suppress one of the following conditions of your choice: …" (and "… your choice of one of the following conditions that's affecting the target: …") is a new `suppress-condition` operation. The grab/restraint sentence, the "returns after the spell ends" sentence, the example and the "duration doesn't elapse" sentence are claimed.
- **Care core and runtime:**
  - The operation is validated in the care core.
  - The caster's dialog offers the conditions the target has.
  - The runtime sets the condition aside with the existing marker (`setAsideEffect`) for the spell's duration.
- **Interpretation (logged):** Tireless Worker's Sustain: the GM deletes the marker if the spell isn't Sustained.

## Tests

1053 pass. `test/rank-4-batch-12.test.js` is new, with a negative case: an extra rule sentence stays blocked.

## Evidence

[Live evidence](phase-rank-4-batch-12-live-results.json), case `rank4Batch12`, in the `pftest` world.
- Word of Freedom on a Grabbed, Frightened 2 creature, choosing Grabbed:
  - Grabbed was suppressed (marker 1 round) and the card said it breaks free; Frightened 2 stayed.
  - Deleting the marker restored Grabbed.
- Tireless Worker on a Fatigued creature: Fatigued was suppressed (marker 1 minute).
- **Cleanup:** fixtures removed.
