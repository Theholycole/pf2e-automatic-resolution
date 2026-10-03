# Rank 3 batch 93 — Warding Aggression

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Warding Aggression (3) | The card gives a button per melee Strike; the caster targets the foe and Strikes (PF2e's own Strike). The result picks PF2e's Effect's degree: critical success, success or failure. The Effect marks the foe and gives +1 AC against it, +2 on a success, and on a critical success +2 plus PF2e's granted +3 for a round. A critical failure applies nothing. The ward ends at the end of a caster turn in which it didn't hit that foe with a melee Strike, or when the foe dies. |

## Rules

- **Strike ward (`src/compiler/strike-ward.js`, compiled in `compileSpell`):**
  - It reads the Strike, the also-effects sentence, the ending sentence and the four rows.
  - It proves PF2e's Effect: five rules in all; a TokenMark; the degree ChoiceSet (critical success, success, failure); the FlatModifier against the mark at the failure's value; the upgrade to the success's value; and the granted critical Effect (+3 for 1 round).
- **Runtime:**
  - **New effect kind:** `strike-ward`. The card's `strikeWardRoll` (also on the module API) rolls the Strike at the targeted foe, then makes PF2e's Effect with the degree preset and the TokenMark on the foe, on a native record with `wardStrike`.
  - **Melee hits:** a hook on PF2e's attack messages records the caster's melee hit on the warded foe for the turn.
  - **The end:** the native reconcile ends the ward when the foe's Hit Points reach 0, or when a caster turn ends without a recorded hit.

## Interpretation

"At the end of any turn in which you didn't hit that foe" is read as the caster's turns. The ward isn't dropped at the end of every other creature's turn.

## Tests

`test/rank-3-batch-93.test.js` is new. It covers the kind's data, and a bonus PF2e's Effect doesn't give (not read).

A whole-corpus compile (b617 → b618) changed only Warding Aggression.

## Evidence

[Live evidence](phase-rank-3-batch-93-live-results.json), case `rank3Batch93`, in the `pftest` world, in combat.

| Step | Result |
| --- | --- |
| The Strike (a critical hit) | PF2e's Effect at "critical-success", marking the foe |
| The caster's turn ends after that hit | The ward stays |
| Its next turn ends without a hit | The ward ends |
| A new casting, a critical hit | "critical-success"; the +3 Effect granted |
| The foe's Hit Points reach 0 | The ward ends |

An earlier attempt's Strike missed (a failure): +1, and the ward ended at that turn's end with no hit, which is also correct.

**Cleanup:** fixtures and combat removed.
