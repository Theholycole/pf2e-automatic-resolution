# Rank 5 batch 60 — Curse of Death

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Curse of Death (5) | A sustained Fortitude save. Every result makes the target immune to curses of death for 1 day; that Effect outlives the cast. Success: the curse at stage 1, and its counter can't go past stage 1. Failure: stage 1. Critical failure: stage 2. The curse goes to Pseudo Afflictions and ends when the spell ends. Its stage damage is counted at the cast's rank: 4d6, 8d6 and 12d6 at 5th, one die more for each rank above. Stage 4 (death) is the handler's. |

## Rules (`src/compiler/affliction-handoff.js`, `scripts/basic-save-runtime.js`)

- **A whole-cast immunity:**
  - The rule: "Regardless of the result, the target is temporarily immune to all curses of death for 1 day."
  - It becomes each degree's affliction immunity.
  - The name must be the block's own; the plural "curses of death" is accepted.
  - A lasting cast attaches the immunity to its Ongoing record as permanent, so ending the spell doesn't remove it.
- **A capped stage:**
  - The rule: "… at stage 1, and the stage of the curse can't increase beyond stage 1."
  - The affliction is recorded with `maxStage`.
  - The runtime trims the new Pseudo Afflictions Effect's stage labels to that many. PF2e takes the counter's max from them, and Pseudo Afflictions never raises past it.
  - The core checks `maxStage` is within the stages.
- **A success that afflicts:** Pseudo Afflictions does nothing on a success, so such a row goes to the handler as a failure (stage 1) or a critical failure (stage 2). The new Effect is then set to the row's stage, except for an affliction with an onset.
- **Stage damage counted from the rank:**
  - The rule: `@Damage[(max(4,(@item.rank)-1))d6[void]]`.
  - Pseudo Afflictions wrote this as `{0[void]}`.
  - The compiler records each stage's count expression (`rankDamage`).
  - The runtime evaluates it at the cast rank with a small parser (digits, + − ×, parentheses, max, min only) and writes the stage formula.
  - Any other use of `@item.rank` in a stage blocks the spell.
- **Critical failure without a closing period:** "… at stage 2" (no full stop) is read like the other rows.

## Tests

`test/rank-5-batch-60.test.js` is new. It covers:

- each degree's immunity;
- the capped and uncapped stages;
- the rank counts at 5th, 6th and 9th;
- a parser refusal;
- a tampered cap (rejected);
- an immunity to something else (blocked);
- a cap past the stages (blocked).

The affliction unit tests and batch 82 still pass. A whole-corpus compile (b596 → b597) changed only Curse of Death.

**Live regression of the affliction family:** `family`, `repeatedPoison`, `familyTwo`, `damageGate`, `goblinImmunity`, `blisterImmunity`, `abyssalPenalty`, `cordyceps`, `marinersCurse` and `rank3Batch82` all pass. `repeatedPoison` and `familyTwo` failed in a back-to-back run because the run before had deleted the caster; run alone after a reload, they pass.

## Evidence

[Live evidence](phase-rank-5-batch-60-live-results.json), case `rank5Batch60`, in the `pftest` world, at 5th rank (caster level 9) and 6th (caster level 11).

| Step | Result |
| --- | --- |
| The cast, four degrees | All four immune for 1 day. Critical success: no curse. Success: stage 1, counter max 1. Failure: stage 1. Critical failure: stage 2. |
| Stage 1 damage at 5th | `{4d6[void]}` |
| The success's Effect raised by one | still 1 |
| A second cast on the failed creature | "immune … not afflicted"; it stays at stage 1 |
| The cast ended | every curse gone, every immunity kept |
| At 6th | stage 1 damage `{5d6[void]}` |

**Cleanup:** fixtures removed.
