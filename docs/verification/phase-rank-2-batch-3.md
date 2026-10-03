# Rank 2 batch 3 — the effect before the table, with its rules, for each row's duration

2026-09-30.

| Spell | Now |
| --- | --- |
| Revealing Light (2) | Dazzled for the row's duration (2 rounds / 1 minute / 10 minutes). An invisible creature is Concealed too. That other effects' concealment ends is a note. |
| Brand the Impenitent (2) | −1 status to AC against attacks by followers of the caster's faith, behind a toggle, for 1 round / 1 minute / unlimited. Ignoring concealment and a follower being immune are notes. |
| Penumbral Shroud (1) | Its +1 status bonus to saves against light effects is now a real modifier (before, it was only in the note). |

## Rule

The degree-duration route (the effect described before the table, lasting each row's duration) now also accepts:
- **More row wordings:** "The spell lasts for N", "The light affects the creature for N", and "The spell has an unlimited duration" (an unlimited Effect).
- **Rules from the effect's sentences:**
  - "A creature affected by … is [condition]." grants PF2e's condition from the note Effect, and it's removed with it.
  - "If the creature was Invisible, it becomes Concealed instead." grants Concealed only when the creature has Invisible (`self:condition:invisible`).
  - "… a −1 status penalty to AC against attacks by followers of your faith." is a toggle plus the penalty.
  - "… a +1 status bonus to saving throws against light effects." is the bonus, predicated on the trait.
- **Labels:** a note Effect's modifiers are now labelled with the spell's name. PF2e showed only "Spell's effect", the part after the Effect name's colon.

## Tests

787/787 pass:
- `test/rank-2-batch-3.test.js` is new.
- Batch-19 (Sleep) and batch-32 (Parch) expect the new modifier label.
- `test/rank-2-batch-1.test.js` was rebuilt (see below).

A whole-corpus compile (b256 → b257) changed only these 3 spells.

## Coverage

**Census:** **799 enabled**, up from 797. Rank 2: 65 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-3-live-results.json), case `rank2Batch3`, in the `pftest` world.
- **Revealing Light:**
  - Two failures: both Dazzled, for 1 minute. Only the invisible target is also Concealed.
  - Deleting the note Effect removed the Dazzled.
- **Brand the Impenitent:** a critical failure is unlimited. AC is unchanged until the toggle is on, then −1.
- **Penumbral Shroud:** a failure lasts 10 minutes. A Will save against a light effect has "Penumbral Shroud +1"; a plain Will save doesn't.
- **Cleanup:** fixtures removed; no combats left.

## Incident: `test/rank-2-batch-1.test.js` overwritten

While setting up this batch I created the test file with shell redirection, not knowing rank 2 batches 1 and 2 already existed (2026-09-26). That overwrote the original batch 1 test file (4 tests). It isn't recoverable from any session log.

I rebuilt it from [its verification](phase-rank-2-batch-1.md), with 4 tests over the same areas:
- the persistent damage gate and its refusal;
- Feral Shades' save question;
- the save-adjustment refusals;
- Manifestation of Spirits' durations and the belief refusal.

The original's exact assertions are lost. This batch's test is in `test/rank-2-batch-3.test.js`.
