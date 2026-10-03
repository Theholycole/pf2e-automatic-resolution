# Rank 4 batch 83 — Asterism

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Asterism (4) | The five lines of starlight are one lingering area: the GM draws each line as a shape of the area's region. A creature that enters a line or starts its turn in one takes 4d6 fire (basic Reflex, +1d6 a rank), once a turn. The caster can Dismiss it. A card reminder covers how the lines anchor, the anchors' own immunity (leave them out in the area review) and the lines that break past 30 feet (delete those shapes). |

## Rules

- **Star lines (`src/compiler/star-lines.js`):**
  - It reads the area ("five 30-foot lines") and the lead.
  - It rewrites the text into the lingering trigger "A creature that enters the area or starts its turn in the area takes … A creature can take this damage only once per turn. You can Dismiss the spell."
  - The drawing rules, anchor immunity and line breaking become a reminder.
- **Interpretation:** the lines are shapes of one region, so "only once per turn, even if it moves through several lines" is the area's once-a-turn exposure. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-83.test.js` is new. Its negative case is another line count (not read).

A whole-corpus compile (b567 → b568) changed only Asterism.

## Evidence

[Live evidence](phase-rank-4-batch-83-live-results.json), case `rank4Batch83`, in the `pftest` world, at 5th rank (caster level 9). The region held two 1×6-square line shapes; the walker started outside both.

| Step | Result |
| --- | --- |
| Walks into the second line | exposed; failure: 5d6 fire = 16, lost 16 |

**Cleanup:** fixtures removed.
