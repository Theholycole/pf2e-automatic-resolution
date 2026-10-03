# Rank 5 batch 18 — Unusual Anatomy

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Unusual Anatomy (5) | PF2e's Effect goes on the caster for 1 minute: resistance 10 to precision and critical hits (+5 per 2 ranks) and darkvision. It is proven against the text and acts as the retaliation marker. A creature that hits the caster with an unarmed attack or a non-reach melee weapon takes 2d6 acid damage (+1d6 per 2 ranks) through Retaliate. |

## Rules

- **Proven marker (`retaliation.js` `compileProvenMarker`):** used when one linked PF2e Effect isn't an Aura-only Effect.
  - Every non-narration sentence besides the retaliation must be proven against the Effect's rules by the effect-note proof (all rules claimed, the caster as recipient).
  - The Heightened entry's damage clause must equal the item's own heightening step. The rest of that entry is passed to the proof as the Effect's step.
- **New proof readers (`effect-note-proof.js`):**
  - "You gain resistance N to precision damage and resistance N to extra damage from critical hits." matches PF2e's one Resistance to both, with its step.
  - "You gain darkvision."
  - The critical-hits explanation is read as a note.
  - STEP now also reads "The resistances increase by N.".
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-18.test.js` is new. Its negative cases:
- a resistance value PF2e's Effect doesn't give;
- a Heightened damage step other than the item's.

A whole-corpus compile (b445 → b446) changed only this spell.

## Evidence

[Live evidence](phase-rank-5-batch-18-live-results.json), case `rank5Batch18`, in the `pftest` world, cast at 7th rank.
- PF2e's Effect is on the caster for 1 minute at level 7, and its description names Retaliate.
- The caster has resistance 15 to precision and critical hits, and darkvision.
- Retaliate rolled 3d6 acid = 13, and the attacker lost 13.
- **Cleanup:** fixtures removed.
