# Third-party batch 29: Technomancy Ray

2026-10-06. The twenty-ninth batch of the third-party modules' spells: an attack whose die comes from the caster's skill rank.

## What changed

- **Technomancy Ray (Inventors+)** (`glyph-versions.js` `fitTechnomancyRay`; new `skillDie`; caster-choice `outcomeFormulas`):
  - A spell attack against AC.
  - **The die:** the item's damage is a flag its class feature would set. The module uses the text's die instead: d4, d6 when the caster is master in Crafting, d8 when legendary. The die is read from the caster's Crafting rank when the damage is rolled (`skillDie`, `basic-save-runtime.js`). The check requires the sentence the compiler read (`basic-save-core.js`).
  - **A critical hit:** double damage and 1 persistent damage.
  - **The type:** fire, or the caster's Variable Core type (acid, cold or electricity). It's a class pick, so the card asks. The choice also retypes the row's persistent damage (`outcomeFormulas`).

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 28 | Batch 29 |
| --- | --- | --- |
| Save (spell attacks included) | 62 | 63 |
| Not enabled | 42 | 41 |

Resolved: 184 of 227.

## Tests

`test/third-party-batch-29.test.js` (1). All 1,747 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-29-live-results.json), case `thirdPartyBatch29`, in the `pftest` world.

| Cast (rank 1) | Result |
| --- | --- |
| NPC caster (no Crafting rank), acid, critical hit | 1d4 acid, 1 doubled to 2; persistent 1 acid |
| Character master in Crafting, fire, hit | 1d6 fire, 4 taken; no persistent damage |
