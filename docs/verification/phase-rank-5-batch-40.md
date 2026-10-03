# Rank 5 batch 40 — Synesthesia

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Synesthesia (5) | Will. PF2e's Effects apply by result. Success: the 1-round Effect. Failure: the 1-minute Effect preset to "failure". Critical failure: the 1-minute Effect preset to "critical failure", which grants Stunned 2. The Effects carry the concentrate flat-check note, Clumsy 3 and the –10-foot status Speed penalty. Each affected row also gets a "Rewired senses" note for the same time: everything is Concealed from the creature, which PF2e's Effects don't carry. The 9th-rank heightening (up to five targets) only changes how many targets the caster picks. |

## Rules

- **Senses Effects (`compileSensesEffects`, proof `senses-effect`):**
  - It reads the preamble's flat check, Clumsy and Speed penalty, the two "affected for" rows, and the critical failure's Stunned.
  - It checks PF2e's two Effects (bound by duration) against those numbers:
    - Clumsy's badge;
    - the `all-speeds` modifier;
    - the minute Effect's result ChoiceSet and its Stunned grant predicated on the critical failure.
  - The runtime proof checks the same, plus the three concentrate notes.
  - The minute Effect is preset to the row's result.
- **Plan:** the text's Stunned isn't granted a second time. Concealed is a note per row. The "varies" duration becomes the rows' own times.

## Tests

`test/rank-5-batch-40.test.js` is new. Its negative case is another Clumsy value (not read: the Effect wouldn't state it).

A whole-corpus compile (b537 → b538) changed only Synesthesia.

## Evidence

[Live evidence](phase-rank-5-batch-40-live-results.json), case `rank5Batch40`, in the `pftest` world (caster level 17).

| Rank | Result | PF2e Effect | Clumsy | Stunned | Land Speed | Note |
| --- | --- | --- | --- | --- | --- | --- |
| 9 | success | 1 round | 3 | — | 15 | 1 round |
| 9 | critical failure | 1 minute | 3 | 2 | 15 | 1 minute |
| 5 | failure | 1 minute | 3 | — | 15 | 1 minute |
| 5 | critical success | — | — | — | 25 | — |

**Cleanup:** fixtures removed.
