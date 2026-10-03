# Rank 3 batch 125 — Loyalty's Ward and Footholds and Foothills

2026-10-03. Part of the user's ranks 3–5 pass. These are the last two rank 3–5 rituals with text.

**New in `ritual-degrees`:**

- **`ward`:** the criteria chosen at the cast. The DC is the caster's higher class or spell DC (or the GM's). The control "a held creature tries to leave" rolls its save. On a failure, it is held and can't try again for the stated time (a second try in that time is refused).
- **`terrain`:** the option chosen on the area's region (the GM's selected region, or a circle of the area at the caster or a given position):
  - **Roughen:** difficult terrain, or greater on terrain already difficult.
  - **Smooth:** the region's own terrain one step easier.
  - **Remove:** the crater's fall control.
  - **Add:** GM lines.
  - **Duration:** for a success, the terrain is removed and the eased terrain restored when the caster's week-long Effect ends. A critical success is permanent.
- **The area's growth per heightened step** on the card.

| Ritual | Now |
| --- | --- |
| Loyalty's Ward (5) | **Critical success:** the wards hold the chosen criteria's creatures. Trying to leave: a Will save against the higher DC; on a failure, held, and no new try for 24 hours. **Success:** the wait is 1 hour. **Critical failure:** the wards hold those not meeting the criteria instead. Lasts 1 week. |
| Footholds and Foothills (5) | **Critical success:** the chosen option permanently. **Success:** for 1 week. **Area:** a 30-foot burst, +20 feet per rank. **Remove:** the fall control (15 bludgeoning, Prone). **Critical failure:** the primary caster's record ("treats the terrain as difficult") for 1 week. |

## Rules

- **`src/compiler/ritual-degrees.js`:**
  - Readers, with the criteria list items read.
  - Option paragraphs ("**Roughen** …") are read as that option's notes.
  - "The area increases by 20 feet."
- **`scripts/effect-runtime.js`:** `ward` and `ritualWard`, `#ritualTerrain`, `ritualFall` and `ritualTerrainOnEnd` (on the `deleteItem` hook in `scripts/main.js`).

## Interpretation

Listed in `docs/planning/pending-user-decisions.md`.

## Tests

`test/rank-3-batch-125.test.js` is new. It covers both rituals' actions and the area, and a changed sentence in each (not read).

A whole-corpus compile (b709 → b710) changed only these two rituals.

## Evidence

[Live evidence](phase-rank-3-batch-125-live-results.json), case `rank3Batch125`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Loyalty's Ward, critical success | DC 26 (the caster's own) |
| Its control: Will −40 and Will +60 | Held 24 hours; left freely |
| The held creature tries again | Refused (waiting) |
| Loyalty's Ward, success | Held 1 hour |
| Loyalty's Ward, critical failure | Inverted |
| Footholds at 6th, success, Roughen at a position | A 50-foot circle of difficult terrain (walk 2) |
| Its Effect ended | The region gone |
| Critical success, Roughen, on a selected region already difficult | Greater difficult terrain added (2 and 3) |
| Success, Smooth, on that region | Eased to 1 |
| Its Effect ended | Restored to 2 |
| Critical success, Remove: the fall control | 15 bludgeoning and Prone; the crater's region kept (permanent) |
| Critical failure | The caster's record for 168 hours |

**Cleanup:** fixtures and regions removed.
