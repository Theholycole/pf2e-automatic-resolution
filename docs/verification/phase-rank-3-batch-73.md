# Rank 3 batch 73 — Enthrall

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Enthrall (3) | Will, sustained (up to 10 minutes, PF2e's default). For each target, the card asks the GM's circumstance bonus (+0 to +4) for an unlikely-to-agree creature. Failure and critical failure: Fascinated for the spell's duration, plus an "Enthralled" note. On a failure, the note's control rolls its Will save when it witnesses something it disagrees with; a success ends only that creature's part and makes it immune for 1 hour (later casts refuse it). The critical failure gets no such save. One card for the cast starts the saves of creatures that came within range, each time the caster Sustains; those saves post no card of their own. A reminder covers the linguistic trait and what a successful target notices. |

## Rules

- **Enthrall rows (`src/compiler/enthrall-rows.js`):**
  - It reads both lead paragraphs (the GM's bonus up to +4; the newcomers; linguistic) and the four rows.
  - It produces:
    - the save adjustment, with choices 0 to 4;
    - "Fascinated for the spell's duration";
    - the failure note's `endSave {scope: creature, immunity: 1 hour}`;
    - a `chainSave {perCast, repeatable, cascade: false}`;
    - `laterImmunityKey`.
- **Runtime:**
  - `endSave` with `scope: creature` deletes only that creature's Effects from the cast and grants its immunity.
  - A per-cast chain card can be pressed again and starts saves from a plan without the chain.
  - `laterImmunityKey` keeps immune creatures out of new casts.

## Tests

`test/rank-3-batch-73.test.js` is new. Its negative cases are:

- an end save without its scope (refused);
- another newcomer rule (not read).

A whole-corpus compile (b561 → b562) changed only Enthrall.

## Evidence

[Live evidence](phase-rank-3-batch-73-live-results.json), case `rank3Batch73`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Failure (GM bonus +2) and critical failure | both Fascinated |
| The failure's end save (Will +40) | ended for that creature, now immune; the critical failure still Fascinated |
| The newcomers' card for a third creature | Fascinated on a failure; no further card; the card can be pressed again |
| A new cast at the immune creature | not eligible |

**Cleanup:** fixtures removed.
