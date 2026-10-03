# Rank 5 batch 58 — Instant Minefield

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Instant Minefield (5) | The GM draws up to 6 mines as squares of the area's region, hidden from the players, for 10 minutes. The GM's Ongoing control is used when a mine explodes: the GM targets the creature that stepped on it and every creature within 5 feet. That opens one basic Reflex card (one roll) of PF2e's 3d6 fire and 3d6 piercing, each +1d6 a rank. After the sixth mine the spell ends. Seeing and finding the mines (invisibility, Seek against the spell DC) are a note. |

## Rules

- **Minefield (`src/compiler/minefield.js`):**
  - It reads both paragraphs and the heightening.
  - It writes the save as PF2e's two damage entries; PF2e's data heightens both.
  - The lingering declaration: placed, no exposure events, and `mines` (count, emanation), plus the note.
- **Mines (new):**
  - The `mine-exploded` control opens one card for the targeted creatures (the lingering exposure plan at the cast rank) and counts the mine.
  - At the stated count the record ends.
  - Validator: count 1–10, the emanation, and the compiled sentence.
- **Interpretation:** the explosion is the GM's report (the module can't see a hidden mine stepped on). Its creatures are the GM's targets. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-58.test.js` is new. It covers the declaration, both damage entries, the exposure plan, zero mines (refused), and another square rule (not read).

A whole-corpus compile (b588 → b589) changed only Instant Minefield.

## Evidence

[Live evidence](phase-rank-5-batch-58-live-results.json), case `rank5Batch58`, in the `pftest` world, at 6th rank (caster level 11).

| Step | Result |
| --- | --- |
| A mine explodes, catching two creatures | one card for both: 4d6 piercing + 4d6 fire = 31; both failed and lost 31; 5 mines left; the spell continues |

**Cleanup:** fixtures and region removed.
