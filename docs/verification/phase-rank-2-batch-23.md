# Rank 2 batch 23 — a veil for creatures not immune, a weakness of the caster's level

2026-09-30.

| Spell | Now |
| --- | --- |
| Veil of Spirits (2) | A 20-foot burst for 1 minute. A creature that isn't immune to spirit damage (PF2e's immunity list) saves (Reflex) when it starts its turn inside. PF2e's Spell Effect: Veil of Spirits is preset to the result and lasts until the start of that creature's next turn. Success: Dazzled. Failure: Dazzled and weakness to spirit equal to half the caster's level. Critical failure: weakness equal to the caster's level. The failure rows add a note: a creature with spiritsense can't use it meanwhile. The caster can Dismiss the veil. |

## Rules

- **An immunity qualifier on the trigger:** "When a creature that isn't immune to spirit damage begins its turn within the area, it must attempt a Reflex save." is a turn-start trigger. The plan's target check is `not-immune-damage: spirit`, read from PF2e's immunities.
- **Dismiss by the spell's noun:** "You can Dismiss the veil." is the cast's Dismiss when the noun names the spell earlier in its text. Rust Cloud's "the cloud" is now read too; it stays blocked for other reasons.
- **A degree-choice Effect with a weakness of the caster's level:**
  - "The creature is dazzled and gains a weakness to spirit damage equal to half your level until the beginning of its next turn …" and "As failure, but the weakness is equal to your level." are checked against the Effect's Weakness rules (`(@item.origin.level / 2)`, `@item.origin.level`) and its Dazzled grant.
  - The rows' Dazzled is carried by the Effect.
- **"Until the beginning of its next turn":** the Effect is counted from the creature's own turn.
  - PF2e ends a turn-start Effect only on its origin's turn. So, for such an Effect, the module fixes the caster-level values into the rules (rounded down) and makes the creature the origin.
  - Before this, the Effect would have stayed until the round after. This affects no other spell: no other one has a target-turn, turn-start Effect.
- **A sense lost while dazzled:** "A creature with spiritsense can't use that imprecise sense while it's dazzled in this way." is a note, lasting as the Effect does. "As failure" repeats it.

## Tests

842/842 pass. `test/rank-2-batch-23.test.js` is new. It checks:
- the trigger, the immunity check, Dismiss, each row's Effect selection and timing, and the notes;
- that a weakness the text and Effect disagree on is refused;
- that a Dismiss noun the text doesn't use stays unread.

A whole-corpus compile (b276 → b277) changed Veil of Spirits and Rust Cloud (its Dismiss only).

## Coverage

**Census:** **1061 enabled**, up from 1060. Rank 2: 149 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-23-live-results.json), case `rank2Batch23`, in the `pftest` world: a level-6 caster, in combat.
- **When cast:** no save.
- **Failure creature (its turn start):** Dazzled, weakness 3 to spirit, the Effect at its initiative (30) for 1 round turn-start, and the spiritsense note.
- **Critical-failure creature:** Dazzled, weakness 6, and the note.
- **Creature immune to spirit:** ineligible ("immune to spirit damage").
- **At the failure creature's next turn:** its Effect was gone.
- **Ending the spell** removed the region. Fixtures, the combat and the region were cleaned up.
