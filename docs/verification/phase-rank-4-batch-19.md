# Rank 4 batch 19 — Life Siphon, Let Not the Fallen Rest

2026-10-02. Part of the user's ranks 3–5 pass. (Let Not the Fallen Rest is rank 5; it's batched with the same route.)

| Spell | Now |
| --- | --- |
| Life Siphon (4) | A reaction. The caster gives the triggering spell's rank and heals 1d8 per rank (3d8 for a 3rd-rank spell). |
| Let Not the Fallen Rest (5) | The targeted allies within 30 feet that are dying, or unconscious, at Dying 2 or less regain 4d10 Hit Points (+1d10 a rank) and leave Dying (PF2e's Wounded rule). They can Stand as a free action (a note). The module refuses a target that isn't an ally or isn't dying or unconscious. |

## Rules

- **Direct healing (`healing-compiler.js`):**
  - "You use some of the spell's magic to heal yourself, regaining NdM Hit Points per rank of the spell." on a reaction becomes `perTriggeringRank`.
  - "Each allied creature within the emanation whose Dying value is N or less regains … and can Stand as a free action …" becomes allies only with `dyingMax` and a free-Stand note.
  - The PFS note paragraph is set aside.
- **Runtime (`effect-runtime.js`):**
  - Per-rank healing asks the triggering rank (or takes `triggeringRank`) and rolls that many dice.
  - `dyingMax` checks each target is the caster's ally and dying, or unconscious, at that value or less.
  - The caster healing itself isn't checked as a target.
- **Interpretation (logged):** the Dying reading follows PFS's note.

## Tests

1074 pass. `test/rank-4-batch-19.test.js` is new, with a negative case: non-allied wording stays blocked.

A whole-corpus compile (b405 → b406) changed only these two.

## Evidence

[Live evidence](phase-rank-4-batch-19-live-results.json), case `rank4Batch19`, in the `pftest` world.
- Life Siphon with triggering rank 3: the caster healed 19 (3d8).
- Let Not the Fallen Rest:
  - An unconscious ally at Dying 2 went to 23 HP and Dying 0.
  - A healthy ally was refused (not dying), and so was an enemy (not an ally).
- **Cleanup:** fixtures removed.
