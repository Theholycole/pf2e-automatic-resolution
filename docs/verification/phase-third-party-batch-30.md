# Third-party batch 30: Mark of Mystery

2026-10-06. The thirtieth batch of the third-party modules' spells: a ward that frightens creatures who target the marked creatures.

## What changed

- **Mark of Mystery (Witches+)** (new `mark-ward.js`, resolution kind `mark-ward`; new `scripts/mark-ward-runtime.js`):
  - The cast puts a ward Effect on the caster and on the targeted ally (refused for a non-ally) for 1 minute. The caster's tradition is read from its spellcasting.
  - **The trigger:** a creature targets either one with a harmful effect. That is an attack roll on either (PF2e's message; `main.js`), or a save card the module starts against either (`basic-save-runtime.js`).
  - **The save:** a Will save card, which is its own compiled plan: Frightened 1 on a failure, 2 on a critical failure, then immune for 1 hour. It's asked once per creature until the immunity takes over. The caster and the other marked creature don't trigger it.
  - **The penalty:** a creature of one of the caster's tradition's listed types, or a dragon or spellcaster of that tradition, first gets the module's −1 status penalty Effect. The Effect is proved against the text: saves against this spell, by its slug.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 29 | Batch 30 |
| --- | --- | --- |
| Effect | 62 | 63 |
| Not enabled | 41 | 40 |

Resolved: 185 of 227.

## Tests

`test/third-party-batch-30.test.js` (1). All 1,748 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-30-live-results.json), case `thirdPartyBatch30`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast (primal) on an ally | Ward on the caster and the ally |
| An animal Strikes the ally | One Will save card for it; the −1 penalty Effect first |
| Its failure | Frightened 1; immune |
| It Strikes again | No card |
| A humanoid arcane caster casts Daze on the caster | Its own card; no penalty |
