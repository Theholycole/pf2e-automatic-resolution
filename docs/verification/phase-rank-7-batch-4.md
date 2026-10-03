# Rank 7 batch 4 — Prismatic Armor, Apex Companion

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Prismatic Armor | Color-armor route, read through the Chromatic Armor it names (`compileBorrowedColorArmor`): every color at once (no roll), resistance 5 to the seven types (10 from 9th), Chromatic Armor's light and its adjacent attacker's Will save. An attacker's critical failure is Blinded instead of Dazzled. |
| Apex Companion | Effect + note, proved. PF2e's Effect has Huge, 30 temporary HP, darkvision, a damage-dice step plus deadly d12 on its weapons, and +10-foot status to its Speeds. The 15-foot reach is patched onto PF2e's size rule as `reach: {override: 15}`; PF2e's size alone gave 10, checked live. The space it needs and ignoring difficult terrain are the note. The target is the GM's yes/no for "your animal companion". The note-proof now splits a list's items into sentences even when one opens with a number. |

## Tests

`test/rank-7-batch-4.test.js` is new. A whole-corpus compile (b727 → b729) changed only these two spells.

## Evidence

[Live evidence](phase-rank-7-batch-4-live-results.json), case `rank7Batch4`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Prismatic Armor at 9th | Resistance 10 to all seven types, its light; an adjacent attacker's critical failure: Blinded (not Dazzled) |
| Apex Companion at 10th | Huge, reach 15, 30 temporary HP, land 25 → 35 and fly 30 → 40, darkvision |

**Cleanup:** fixtures removed.
