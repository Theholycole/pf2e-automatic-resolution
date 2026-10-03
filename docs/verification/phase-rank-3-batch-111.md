# Rank 3 batch 111 — Oneiric Mire

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Oneiric Mire (3) | A lingering placed burst of difficult terrain. Each creature in it at the cast, or entering it, rolls a Will save. A critical success leaves it unaffected and immune for the spell (disbelieved); a success, unaffected. A failure gives −10 feet to its Speeds until it Escapes; a critical failure is that plus Immobilized until it Escapes. The failing rows' note carries the end-of-turn Will save (once a round): a success removes this spell's effects on the creature, and a critical success also makes it immune (disbelief). |

## Rules

- **`src/compiler/twin-illusion.js`:** `rewriteIllusoryMire` reads the seven sentences. It returns the lingering area's table (row immunity, the penalty and Immobilized "until it Escapes") and the notes with `endSave` (scope creature, `immunityOnCritical`).
- **`generated-speed-modifier.js`:** a critical failure's "As failure, but … also X until it Escapes" now completes an Escape-lasting penalty.
- **`basic-save-core.js`:** `lingeringExposurePlan` keeps the spell's fixed time as `lifecycle.spellDuration`, which the save runtime uses for a penalty until Escape.
- **End-save (`note-effects.js`, `stored-trigger-runtime.js`):** `immunityOnCritical` makes the creature immune, keyed by the spell, on a critical success.

## Interpretation

- **"No longer needs to make Will saves" is temporary immunity for the spell's minute.** It comes on a critical success, either on the area's save or on the end-of-turn save.
- **The end-of-turn save is the creature's control.** It is offered once a round.

## Tests

`test/rank-3-batch-111.test.js` is new. It covers the area, the rows, the immunity, the notes' end-save, and a changed penalty (not read).

A whole-corpus compile (b635 → b636) changed only Oneiric Mire.

## Evidence

[Live evidence](phase-rank-3-batch-111-live-results.json), case `rank3Batch111`, in the `pftest` world.

| Step | Result |
| --- | --- |
| A critical failure | Immobilized, Speed 15, the note |
| A critical success | Immune, unaffected |
| The end-save at Will −40 | Continues |
| The end-save at Will +90 | Critical success; all the spell's Effects on it removed; immune |

The Enthrall (`rank3Batch73`) and Wildfire (`cr1Batch105`) cases were rerun and passed.

**Cleanup:** fixtures and region removed.
