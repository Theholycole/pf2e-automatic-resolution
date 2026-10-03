# Rank 2 batch 8 — initial and persistent damage by row

2026-09-30.

| Spell | Now |
| --- | --- |
| Acid Grip (2) | 2d8 acid, plus 1d6 persistent acid per 2 ranks. Success: half, no persistent. Failure: full and persistent. Critical failure: double, and the persistent damage not doubled ("full persistent damage"). The caster may move the target up to 5 / 10 / 20 feet in any direction; the GM moves the token. On a failure or critical failure the target gets PF2e's Spell Effect (−10-foot status penalty to Speeds), removed with its persistent acid. |
| Combustion (3) | **Fixed.** It was counted as enabled, but its 2d6 persistent fire was never applied. Now: failure 4d8 fire plus 2d6 persistent fire, critical failure double both, and the persistent damage grows 1d6 per rank. |

## Rules

- **Rows by damage part:** a spell with one structured damage entry and one inline persistent `@Damage` of the same type in its introduction has its rows read by part:
  - "half (initial) damage and no persistent damage";
  - "full damage and persistent damage" / "full damage, as well as full persistent damage" / "full initial and persistent damage";
  - "double damage and full / double (the) persistent damage" / "double initial and persistent damage".

  The critical failure's persistent amount is doubled only when the row says so.
- **Heightening:**
  - A self-scaling persistent formula (Acid Grip's `floor(@item.level/2)d6`) must match its Heightened entry.
  - A fixed one (Combustion's 2d6) becomes a rank formula from the entry (`(@item.level - 1)d6`).
  - Any other Heightened wording leaves the plan unproven.
- **The introduction:** its other sentences must be narration, or "A creature taking persistent damage from this spell takes a –N-foot status penalty to its Speeds." with the Spell Effect linked after it.
  - PF2e's Effect must be exactly that penalty, predicated on the spell's persistent damage type.
  - It's applied on the rows that deal persistent damage and removed with the persistent damage.
  - Its encounter duration is accepted because its only rule applies while the persistent damage lasts.
- **The move:** ", and the claw moves it up to N feet in a direction of your choice" is the caster's optional move. The card reads "can be pushed up to N feet in any direction (the caster's choice)".

## Bug found: persistent damage claimed but not applied

Combustion's rows ("… as well as full persistent damage") were claimed as damage because the row dealt its 4d8 fire, but the persistent fire was never compiled. Two changes:
- **The fix:** the residual-prose analysis now claims a clause that deals persistent damage only when the row really deals persistent damage (a structured persistent entry, a persistent formula or the persistent-damage condition).
- **The audit:** a check of every enabled save plan for rows that state persistent damage without dealing it found only Combustion, and now finds none.

## Tests

798/798 pass. `test/rank-2-batch-8.test.js` is new. It checks:
- both spells' rows, formulas, moves and linked Effect;
- the refusals: a mismatched Heightened entry, a different Speed penalty, and a linked Effect predicated on another damage type;
- that the new residual guard leaves an unpaid persistent row unclaimed.

A whole-corpus compile (b261 → b262) changed 3 plans: Acid Grip, Combustion and Divine Immolation.
- Divine Immolation (5) was already blocked. The new guard now also leaves its persistent-damage rows unclaimed, which is correct, since they don't apply persistent damage yet.

## Coverage

**Census:** **807 enabled**, up from 806. Rank 2: 72 of 245. Rank 3 is unchanged at 61, since Combustion was already counted.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-8-live-results.json), case `rank2Batch8`, in the `pftest` world.
- **Acid Grip, one cast at success, failure and critical failure:**
  - HP lost: 4 / 8 / 16 (half / full / double of one 2d8 roll).
  - Persistent damage: none / 1d6 acid / 1d6 acid.
  - The Speed Effect only on the failure and critical failure; the failure target's land Speed went from 25 to 15.
  - The card's GM notes: "can be pushed up to 5 / 10 / 20 feet in any direction (the caster's choice)".
  - Deleting the failure target's persistent acid removed its Effect, and its Speed returned to 25. The critical failure target kept its Effect.
- **Combustion:**
  - Rank 3 failure: 2d6 persistent fire.
  - Heightened to rank 4: 3d6.
  - Rank 3 critical failure: (2 × 2d6) persistent fire.
  - Success: none.
- **Cleanup:** fixtures removed; no combats or PFTEST regions left.
