# Rank 4 batch 7 — Movanic Glimmer, Forgotten Lines, Wordsmith (and Impart Empathy)

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Movanic Glimmer (4) | A note on the targeted animal carrying +2 status to Perception and to Will saves. The Nature-checks-to-Command +1 is another creature's situational check (the note). A non-animal target is refused. |
| Forgotten Lines (4) | "varies" with nothing timed in the text means an instantaneous note: the card only. |
| Wordsmith (4) | The caster's note with no fixed end ("until the next time you Refocus": the GM removes it). |
| Impart Empathy (2, side effect) | "1 animal" now compiles as an animal target; it was a note that target eligibility blocked. |

## Rules

- **Two-statistic bonus (`spell-note.js` `judgeNumbers`):** "… gains a +N type bonus to X and Y, and <situational clause>" gives the two rules; the clause must be situational.
- **Durations (`compile-ability.js`):**
  - "varies" with no time words is instantaneous, for non-rituals only (the adapter now records `ritual`).
  - "until the next time you Refocus" has no fixed end.
- **Targets:** "1 animal" requires the animal trait; "text(s)" and "document(s)" are things.
- **Runtime:** the spell-note runtime enforces trait predicates on the targets.
- **Test updated:** `test/cantrip-rank-1-batch-14.test.js` asserted Movanic Glimmer stays off the note route, so its unconditional bonus wasn't dropped. The bonus is now carried as rules; the test asserts them, and a variant whose second clause isn't situational stays off the route.

## Tests

1026 + 2 = 1028 pass. `test/rank-4-batch-7.test.js` is new, with a negative case: a timed sentence keeps "varies" unresolved.

A whole-corpus compile (b376 → b377) changed these four and Animal Vision (whose "1 animal" target is now complete; still not executable). Binding Circle and Borrow Time, rituals, briefly changed until the ritual exclusion was added.

## Evidence

[Live evidence](phase-rank-4-batch-7-live-results.json), case `rank4Batch7`, in the `pftest` world. It passed on the first run.
- **Movanic Glimmer:** the animal's Perception and Will each rose by 2; a non-animal was refused.
- **Forgotten Lines:** the card was posted and no Effect was made.
- **Wordsmith:** an unlimited note on the caster.
- **Impart Empathy:** cast on an animal, with its note.
- **Cleanup:** fixtures removed.
