# Third-party batch 44: Ice Guardian

2026-10-06. The forty-fourth batch of the third-party modules' spells: a conjured guardian that gives cover to the creatures beside it.

## What changed

- **Ice Guardian (Oracles+)** (new `ice-guardian.js`, through the `incarnate` card's conjured token as Dragon Turret's):
  - **The guardian:** a Large token the module makes beside the caster: 30 Hit Points, AC 22, weakness 3 to bludgeoning (each +10, +3, +3 a rank above 3rd), and immunity to cold. It's removed when the spell ends or it's destroyed. The conjured token's statistics now step by rank (`conjure.step`).
  - **Lesser cover:** a region follows the guardian. The caster and its allies beside it hold +1 circumstance AC (`conjure.coverAura`, a region area with member rules for the caster and allies). The guardian itself is left out (`excludeTokenUuids`).
  - **The Sustain:** standard cover (+2 circumstance to AC, to Reflex saves against area effects, and to Stealth to Hide or Sneak) until the start of the caster's next turn, as a card part on the creatures the caster targets. The guardian's Stride is the caster moving its token.
- **Note rules:** cover's Reflex and Stealth parts are now accepted.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 43 | Batch 44 |
| --- | --- | --- |
| Effect (incarnate) | 71 | 72 |
| Not enabled | 27 | 26 |

Resolved: 199 of 227.

## Tests

`test/third-party-batch-44.test.js` (1). All 1,762 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-44-live-results.json), case `thirdPartyBatch44`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at rank 4 | The guardian: 40 HP, AC 25, weakness bludgeoning 6, immune to cold, Large |
| An ally beside it / a foe beside it | Ally AC +1 / foe +0; the guardian's own AC stays 25 |
| The Sustain part on the ally | AC +2 (standard cover) |
