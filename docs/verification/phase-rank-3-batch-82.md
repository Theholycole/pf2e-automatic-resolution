# Rank 3 batch 82 — Mycological Malady

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Mycological Malady (3) | A sustained Fortitude save. Success: Enfeebled 2 for 1 round. Failure or critical failure: voidcap spores at stage 1 or 2. The disease goes to Pseudo Afflictions, and its Effect is attached to the cast, so ending the spell ends the disease and what it granted. Undead that aren't incorporeal are open to the disease; that rule, and the GM's call on other non-living organic creatures, is a reminder on the card. |

## Rules

- **An affliction that ends with its spell (`src/compiler/affliction-handoff.js`):**
  - A block that says "This disease ends when the spell ends" (or the same for a curse or poison) may hand off on a sustained or lasting cast. Without that sentence such a cast stays blocked (`affliction-handoff:lifecycle`).
  - The block is marked `endsWithSpell`. The save runtime attaches the Effect Pseudo Afflictions creates to the cast's Ongoing record, so ending the cast deletes it.
  - A stage raised on an Effect from an earlier cast is not attached; it keeps that cast's end.
- **The affliction's traits inside the bold heading:** "Voidcap Spores (disease)" is now read as the name Voidcap Spores with the trait disease.
- **A lifted immunity to the spell's own affliction:**
  - The module never checks a creature's own immunity to the affliction's kind.
  - "Undead that aren't incorporeal … don't have their normal immunity to this disease", and the optional sentence about the GM's discretion that follows it, become a card reminder.
  - The kind named must be one of the block's traits.
- `test/affliction-handoff.test.js` now asserts the blocked lifecycle on the spell with that sentence removed.

## Tests

`test/rank-3-batch-82.test.js` is new. It covers the handoff and reminder, the cast without the "ends when the spell ends" sentence (blocked), and the immunity sentence naming another kind (blocked).

A whole-corpus compile (b595 → b596) changed Mycological Malady, which now resolves. Curse of Death changed only in its blockers: the lifecycle one is gone and its other rules still block it.

## Evidence

[Live evidence](phase-rank-3-batch-82-live-results.json), case `rank3Batch82`, in the `pftest` world, at 3rd rank (caster level 5).

| Degree | After the cast | After ending the cast |
| --- | --- | --- |
| Success | Enfeebled 2 | nothing |
| Failure | Affliction Effect at stage 1 (Enfeebled 2) | nothing |
| Critical failure | Affliction Effect at stage 2 (Enfeebled 2, Slowed 1) | nothing |

The cast's Ongoing record held 3 entries.

**Cleanup:** fixtures removed.
