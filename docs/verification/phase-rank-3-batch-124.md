# Rank 3 batch 124 — Secure Siege Weapons and Wild Feast

2026-10-03. Part of the user's ranks 3–5 pass. This batch extends `ritual-degrees`.

**New:**

- **`fortify`:** Effect rules raising a siege weapon's Hardness and maximum HP (by its level). This works on vehicle and hazard actors.
- **The siege controls:** an enemy's save, with a toggled misfortune on a failure; and a launch target's one-roll fortune.
- **`companions`:** the masters' daily check. On a failure, the companion's minion trait is removed for the day.
- **The ritual's area on the card**, doubled by heightened step. This is also shown for Garden of Death and Reinforced Rations.

| Ritual | Now |
| --- | --- |
| Secure Siege Weapons (3) | **Critical success:** each targeted siege weapon gets Hardness +10 and maximum HP +3 × its level for 1 month. Also the caster's controls: an enemy operating, moving or picking one up attempts a Will save (DC 20); on a failure it rolls twice and takes the worse on Load and Strike checks with it (behind a toggle). The targets of one an enemy launches roll their save twice and take the better. **Success:** Hardness +5, HP +2 × level. **Critical failure:** the targeted siege weapons are Broken. |
| Wild Feast (4) | **Success:** the targeted creatures take a −2 status penalty to Command an Animal and Demoralize against animals, fungi and plants for 3 days. The card gives the area (500-foot burst, doubled per 2 ranks). **Critical success:** the same, plus the daily control: the master's better of Diplomacy and Nature against the ritual's DC; on a failure, the companion loses the minion trait for the day. **Critical failure:** each caster is marked with the forbidden cravings curse (the text). |

## Rules

- **`src/compiler/ritual-degrees.js`:** readers, the ritual's area and its "Double the ritual's area" step.
- **`scripts/effect-runtime.js`:** `fortify`, `ritualSiege`, `companions` and `ritualCompanions`.

## Interpretation

Listed in `docs/planning/pending-user-decisions.md`.

## Tests

`test/rank-3-batch-124.test.js` is new. It covers both rituals' actions and area, and a changed sentence in each (not read).

A whole-corpus compile (b708 → b709) changed these two rituals, and gave Garden of Death and Reinforced Rations their area field (a card reminder). The other rituals gained an empty `area` field.

## Evidence

[Live evidence](phase-rank-3-batch-124-live-results.json), case `rank3Batch124`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Secure Siege Weapons, critical success, on a level 4 vehicle (Hardness 5, 40 HP) | Hardness 15, 52 HP |
| The operate control: Will −40 and Will +60 | Misfortune (toggle, keep lower); resisted |
| The launch control | One-roll fortune on saves (keep higher) |
| Secure Siege Weapons, critical failure | The vehicle Broken |
| Wild Feast at 6th, success | −2 status, the predicate above, 72 hours; the card's area a 1000-foot burst |
| Wild Feast, critical success: the daily control | Master's check failed: the wolf lost the minion trait |
| Wild Feast, critical failure | The caster cursed (record) |

**Cleanup:** fixtures removed.
