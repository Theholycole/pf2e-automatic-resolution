# Rank 2 batch 34 — trait-extra persistent rows, a per-creature curse, a reaction blast, a trait-only area

2026-10-01. Follows the user's decision of 2026-10-01: what the module can't detect is a GM control that rolls and applies.

| Spell | Now |
| --- | --- |
| Worm's Repast (2) | A Fortitude save against 4d6 piercing (+2d6 every 2 ranks) and `floor(rank/2)`d6 persistent piercing. Success: full initial damage, no persistent damage. Failure: full initial and persistent damage, Off-Guard. Critical failure: double the initial damage, the same persistent damage, Off-Guard and Slowed 1. Off-Guard and Slowed end when the persistent piercing damage ends. A non-skeletal undead (PF2e's undead trait without the skeleton trait) adds `(floor(rank/2)+1)`d6 to the persistent damage. |
| Warrior's Regret (2) | A Will save. On a success, failure or critical failure the target gets a note. The note's Ongoing control asks the GM, at the end of the creature's turn, how many different creatures it damaged (0 to 4). It then deals that many d8 mental (+1d8 per creature every 2 ranks). Success: once. Failure: each turn, ending after a turn with none. Critical failure: each turn until the GM ends it (24 hours of atonement). |
| Pyrefowl Rebuke (2) | The triggering creature (the one targeted) attempts a basic Reflex save against 1d6 fire (+1d6 every 2 ranks); on a critical failure it's Dazzled until the end of its next turn. The card tells the caster to Fly up to 10 feet (+5 every 2 ranks) directly away, without provoking that creature's reactions on a critical failure. |
| Quench (2) | Only creatures with the fire trait in the 20-foot burst attempt a basic Fortitude save against 4d8 damage (+2d8 a rank). The card's Counteract button rolls against the one magical fire the GM names. The GM's reminder covers the non-magical fires, the item and artifact rules, the Sustain's move (which only puts out fires) and Counterspell. |

## Rules

- **`persistent-damage-compiler.js` `compileInlinePersistentRows`:**
  - Reads "…, dealing XdY T damage and <inline persistent> damage." followed by a separate save sentence.
  - Reads the "… and is <condition> (due to / by the pain) for as long as it takes persistent damage" rows, including "As failure, but … double the initial damage".
  - Reads the "respectively" heightened line.
  - Reads a trait's extra persistent dice: "If the target is a non-skeletal corporeal undead creature, you deal an extra …". "Non-skeletal" excludes PF2e's skeleton trait; "corporeal" is accepted only when the spell's target already says it.
- **`compile-ability.js`:**
  - `attachInlinePersistentRows` makes the rows' conditions (an "As failure" row's inherited ones too) end with the persistent damage, and builds the `persistent-extra` `traitVariant`.
  - A "see description" duration is the outcome's when every row Effect ends with the persistent damage.
  - Warrior's Regret's rows become notes with `triggeredDamage` `creatures-damaged`.
  - New pre-passes `reaction-blast.js` (Pyrefowl Rebuke) and `trait-area-blast.js` (Quench).
- **`basic-save-core.js`:**
  - `isPersistentExtraVariant`: the variant's rows must equal the main rows except for the persistent formula, which must be the main formula plus the stated extra.
  - `isTriggeredDamage` accepts `creatures-damaged` (`maxCount`, `endsOnZero`).
  - The `caster-movement` reminder is also accepted on a reaction's basic save, with `rankFeet`.
- **Runtime:**
  - A target with the variant's trait but none of its excluded traits uses the variant's rows.
  - The reminder's `{feet}` is filled in at the cast rank.
  - `hostileDamage` takes the GM's `count`; the Ongoing control asks for it.

## Tests

872/872 pass. `test/rank-2-batch-34.test.js` is new. It checks:
- the rows and the variant, that a forged variant formula is refused, and that a changed condition wording isn't read;
- the triggers, the trait predicate and the reminders;
- that an unknown sentence keeps Quench out.

A whole-corpus compile (b287 → b288) changed only these four spells.

## Coverage

**Census:** **1098 enabled**, up from 1094. Rank 2: 184 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-34-live-results.json), case `rank2Batch34`, in the `pftest` world.
- **Worm's Repast at 4th:** "6d6 piercing" (20).
  - The living failure lost 20, with persistent 2d6 and Off-Guard.
  - The zombie's critical failure lost 40, with persistent "(2d6 + 3d6)", Off-Guard and Slowed 1. Removing its persistent damage removed both conditions.
  - The skeleton's failure has persistent 2d6.
- **Warrior's Regret at 4th:** no damage at the cast, and a note on both targets.
  - Success with a count of 3: "6d8 mental" (26), then its note was gone.
  - Failure with a count of 1: "2d8 mental" (9), and the note stays. A count of 0: no damage, and the curse ended.
- **Pyrefowl Rebuke at 4th:** a critical failure, "2d6 fire" doubled (12 lost), Dazzled. The card says "Fly up to 15 feet".
- **Quench at 3rd:** the fire creature was eligible and the other wasn't. "6d8" (20) to the fire creature. The reminder was on the card. The Counteract against a named fire (DC 5, rank 1) was a critical success, so it was counteracted.
- **Cleanup:** fixtures removed.
