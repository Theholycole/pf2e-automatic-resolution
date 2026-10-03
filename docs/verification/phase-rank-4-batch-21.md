# Rank 4 batch 21 — Commanding Lash, Electrified Crystal Ward

2026-10-02. Part of the user's ranks 3–5 pass. (Electrified Crystal Ward is rank 3.)

| Spell | Now |
| --- | --- |
| Commanding Lash (4) | Command's own text and Will rows, borrowed from the referenced spell: the critical failure's "all its actions" note, and the failure's first-action note. A GM question gives −2 if the target is Frightened, Stupefied or taking persistent damage. The target is then temporarily immune for 1 hour; the spell lasts until the end of the target's next turn. |
| Electrified Crystal Ward (3) | A note card: place PF2e's Electric Latch Rune hazard on the object (its DCs are the spell DC). The hazard's damage at the rank is 3d12 electricity, +1d12 per 2 ranks. |

## Rules

- **Borrowed effects (`borrowed-spell.js`, `rewriteBorrowedEffects`):** "…, with the effects of the spell @UUID[…]{X}." brings in the referenced spell's opening and rows (not its Heightened entries). It requires the same non-basic save, and this spell's other sentences join the opening. The module loads referenced spells before compiling, as for "functions as".
- **Durations:** "until the end of your target's next turn" is read (the item duration compiler, and the save route's turn-boundary list).
- **Hazard notes (`spell-note.js`):** "You create an @UUID[…hazards…]{X} hazard …" with "The hazard's damage increases by …" is a note. The item's damage is the hazard's, and the note gives it.
- **Targets:** "1 hinge or latch" is an object; "A creature you dealt damage to on your most recent action." is a creature the caster judges.

## Tests

1080 pass. `test/rank-4-batch-21.test.js` is new, with a negative case: without the referenced spell, Commanding Lash isn't read.

A whole-corpus compile (b409 → b413) changed only these two.

## Evidence

[Live evidence](phase-rank-4-batch-21-live-results.json), case `rank4Batch21`, in the `pftest` world.
- Commanding Lash: the −2 was set; the critical failure got Command's note; a 1-hour immunity Effect was created.
- Electrified Crystal Ward: the note card gives 3d12 electricity.
- **Cleanup:** fixtures removed.
