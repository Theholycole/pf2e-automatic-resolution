# Rank 4 batch 36 — Fallen Soldier's Lament

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Fallen Soldier's Lament (4) | A placed 30-foot area (the illusion's emanation), sustained for 1 minute. Each enemy in it attempts a Will save when the spell is cast and on each Sustain. Failure: Frightened 1. Critical failure: Frightened 2. Notes cover placing and moving the area, and the corpse limits. |

## Rules

- **Moving spirit save (`text-area-save.js` `extractMovingSpiritSave`):** the spell targets a corpse and has no area, with the text:
  - "Whenever you Cast this Spell or Sustain this spell, you move the illusion up to N feet and cause each enemy in a M-foot emanation of the spirit to attempt a X save against your spell DC."
  - "Enemies who fail become C a (or C b on a critical failure)."

  This is rewritten as "Each enemy in the area when you Cast this Spell and each time you Sustain the Spell must attempt a X save.", with the rows and a placed M-foot area. Notes cover the corpse limits and the 6th-rank entry; the GM moves the region before each Sustain.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-36.test.js` is new. Its negative case is a critical-failure clause in another form, which isn't read.

A whole-corpus compile (b446 → b447) changed only this spell.

## Evidence

[Live evidence](phase-rank-4-batch-36-live-results.json), case `rank4Batch36`, in the `pftest` world.
- **At cast:** the enemy inside had an initial exposure. Its card used Will, and it failed: Frightened 1. The ally inside wasn't exposed.
- **After moving the region and Sustaining:** the second enemy had a `sustain` exposure. It critically failed: Frightened 2.
- **Cleanup:** fixtures removed.
