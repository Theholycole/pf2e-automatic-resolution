# Rank 4 batch 1 — Deathless March

2026-10-02. Part of the user's ranks 3–5 pass. The first rank 4 batch.

| Spell | Now |
| --- | --- |
| Deathless March (4) | One save card for the creatures in the emanation. **Undead** get Quickened for 1 minute with no save, in an Effect noting that the extra action can be used only to Stride. **Living creatures** roll a Will save: Frightened 1 / 2 / 3, plus Paralyzed for 1 round on a critical failure. **Other creatures** (constructs) are unaffected. The card reminds that the spell has the emotion, fear and mental traits for living creatures, so their immunities and bonuses apply. |

## Rules

- **`trait-grant.js` (new rewrite before the save compilers):** it reads three sentences:
  - "Undead creatures within the area gain the Quickened condition for 1 minute, which they can use only to Stride.";
  - "Living creatures in the area must attempt a Will save.";
  - "This gains the emotion, fear, and mental traits for living creatures.".

  The save compiler sees only the saving sentence. The plan gets `traitGrant`, the `trait-note` reminder, and the living-creature target predicate.
- **Save route:**
  - `basic-save-core.js` validates `traitGrant` and the reminder; `targetParticipates` excludes the `trait-grant` mode.
  - `basic-save-runtime.js`: such targets get the mode (eligible, no save button), and at Finalize the condition Effect (GrantItem, the stated time, the note).
  - `strike-prelude-runtime.js` renders the reminder.
- **Run note:** the first live run found `traitGrant` missing. It had been assigned before the save resolution was built, so it was overwritten. It now goes with the later plan additions. The unit test checks the field itself.

## Tests

982 + 2 pass. `test/rank-4-batch-1.test.js` is new. It checks:
- the grant, the predicate and the reminder;
- that a changed grant or save statistic isn't read.

A whole-corpus compile (b351 → b353) changed only Deathless March.

## Coverage

**Census:** **1171 enabled** (milestone; 1167 non-ritual), up from 1170. Rank 4: 111 of 285.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-4-batch-1-live-results.json), case `rank4Batch1`, in the `pftest` world.
- **Modes:** the undead got `trait-grant`, the living creature saved, and the construct was ineligible.
- **The undead:** Quickened in an Effect lasting 1 minute, with the Stride note; not Frightened.
- **The living creature (critical failure):** Frightened 3 and Paralyzed; not Quickened.
- **The construct:** nothing.
- **The card:** carried the traits reminder.
- **Cleanup:** fixtures removed.
