# Rank 3 batch 100 — Mad Monkeys

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Mad Monkeys (3) | The caster picks the mischief. The caster's Effect (sustained, 1 minute) carries it, and it's produced on the targeted creatures on the cast and by the card's control on the first Sustain each round. See the modes below. Calm, moving the area and the stolen items are notes. |

**The three mischiefs:**

- **Flagrant Burglary:** the module rolls Thievery at the spell DC − 10 against one creature's Perception DC.
- **Raucous Din:** each creature rolls a Fortitude save.
  - Critical success: immune for 10 minutes (skipped later).
  - Success: unaffected.
  - Failure: Deafened for 1 round.
  - Critical failure: Deafened for 1 minute.
- **Tumultuous Gymnastics:** each creature rolls a Reflex save.
  - Critical success and success: as above.
  - Failure: a DC 5 flat-check note for 1 round.
  - Critical failure: the note lasts until the spell ends, and the spell's end removes it.

## Rules

- **Mischief modes (`src/compiler/mischief-modes.js`, compiled in `compileSpell`):** it reads:
  - the choose, produce and move sentences;
  - each mode paragraph: the Steal and its Thievery, or the save and its four rows;
  - each row: immune, unaffected, a timed condition, the flat check, or "as failure" until the spell ends.
- **Runtime:**
  - **New effect kind:** `mischief-modes`.
  - **`mischiefAct`** (also on the module API) does one of two things:
    - The Steal: roll vs Perception DC with natural 20s and 1s.
    - The saves: PF2e's save at the spell DC, then a row Effect (a condition by an in-memory GrantItem, or a note).
  - **The spell's end:** a `deleteItem` hook removes the clinging notes when the caster's Effect is deleted.

## Interpretation

- **The creatures in the area are the targeted ones.** The caster targets them on each use.
- **The stolen item is the GM's.** Getting it back is a note.

## Tests

`test/rank-3-batch-100.test.js` is new. It covers the three modes' data, and an extra condition in a row (not read).

A whole-corpus compile (b624 → b625) changed only Mad Monkeys.

## Evidence

[Live evidence](phase-rank-3-batch-100-live-results.json), case `rank3Batch100`, in the `pftest` world, spell DC 24.

| Step | Result |
| --- | --- |
| Din | The low-save creature critically failed: Deafened, 1 minute. The high one critically succeeded: immune, and skipped on the next use. |
| Gymnastics | Critical failures: the clinging note lasts the spell's 10 rounds; deleting the caster's Effect removed both notes. |
| Burglary | Thievery 32 vs Perception DC 10: stolen (critical). Two targets refused. |

The failure row's 1-round note wasn't exercised: the rolls were critical failures, and the assertion allows for that.

**Cleanup:** fixtures removed.
