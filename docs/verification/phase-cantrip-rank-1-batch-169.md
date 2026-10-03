# Cantrip / rank 1 batch 169 — checks and actions (note-only before)

2026-09-28.

| Spell | Now |
| --- | --- |
| Dim the Light | A Hide against each foe's Perception DC, no cover needed; Hidden until the end of the caster's turn |
| Omnidirectional Scan | The spell-attack Aid (DC 15; a critical failure is a failure) on the ally's next attack against the enemy |
| Reed Whistle | The whistle Effect for 1/4 hours; each Whistle spends an hour for 1d4 rounds of +2 circumstance to Seek the creature |
| Darkened Forest Form | Pest Form (Animal Form from 2nd, Elemental Form from 5th) resolved at this rank, for the sustained minute |

## Tests

784/784 pass. A whole-corpus compile (b252 → b253) changed only these 4 spells. Batch-21 is updated.

## Coverage

**Census:** **714 enabled**, up from 710.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-169-live-results.json), case `cr1Batch169`, in the `pftest` world, on a temporary scene.
- **Dim the Light:** Hidden from the only foe, with the marker. After 7 seconds (the turn out of combat) both were gone.
- **Omnidirectional Scan:**
  - The Aid was a critical success, +2.
  - The ally's Strike on another enemy didn't get it and kept the Effect. The Strike on the scanned enemy had "Aid (Omnidirectional Scan) +2" and used it up.
- **Reed Whistle:**
  - Rank 3 gave 4 hours. The card's Whistle left 3.
  - The caster and the ally (not the enemy) got the Seek Effect for 2 rounds (1d4), and the caster's Seek roll had +2.
  - At rank 1, one Whistle expended the spell.
- **Darkened Forest Form:**
  - Rank 1: "Spell Effect: Pest Form (Darkened Forest Form)", 1 minute, sustained, level 1, a battle form.
  - Rank 2 with Animal Form: "Animal Form (Ape) (Darkened Forest Form)", level 2. Animal Form at rank 1 was refused.
- **Found live:**
  - The Aid was first used up by an attack on another enemy. Its consume now needs that enemy's signature.
  - A second caster token (ctx.setup already places one) threw off the range check.
- **Cleanup:** fixtures and the temporary scene removed; no combats left.
