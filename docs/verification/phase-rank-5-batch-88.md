# Rank 5 batch 88 — Summon Healing Servitor

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Summon Healing Servitor (5) | **Arrive:** PF2e's Spell Effect on the targeted allies (within 20 feet of the servitor), lasting until the departure. Its temporary HP (20, +8 per 2 ranks) are proved against the text at both ranks. **Depart** (the card's control, at the end of the caster's next turn) is one roll of 3d8 (+1d8 per 2 ranks). The targeted living creatures heal it. The undead among them get a basic Fortitude save card against that same amount of vitality. The arrival's Effects end, and their temporary HP with them. A second Depart is refused. |

## Rules

- **`src/compiler/servitor.js`:** reads every sentence, both phases and the Heightened entry; the catalog proves the Effect's TempHP formula. `servitorDice` gives the dice.
- **`compile-ability`:** the undead's basic save is a compiled plan; at the departure its formula is the roll's total.
- **Runtime:** new kind `servitor`; `cardAction("servitor-depart")`.

## Interpretation

- **"That much damage"** is the same roll as the healing.
- **Who is willing, living or undead** is the GM's targeting, checked by the creature's mode of being.

## Tests

`test/rank-5-batch-88.test.js` is new. It covers the data, the dice by rank, the undead plan (supported) and an unrecognised clause (not read).

A whole-corpus compile (b696 → b697) changed only Summon Healing Servitor.

## Evidence

[Live evidence](phase-rank-5-batch-88-live-results.json), case `rank5Batch88`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 5th; an ally targeted | 20 temporary HP |
| Depart; the ally and an undead creature targeted | Roll 19: the ally heals 19 and loses the temporary HP; the undead fails and loses 19 |
| Depart again | Refused |
| Cast at 7th | 28 temporary HP |

**Cleanup:** fixtures removed.
