# Third-party batch 68: the empty Dynamic Breathe Fire, Patron's Apocalypse

2026-10-07. The sixty-eighth batch of the third-party modules' spells, and the last. Both follow the user's decisions of 2026-10-07.

## What changed

- **The empty Dynamic Breathe Fire (Magic+)** (`compile-ability.js` `writtenTwin`; `effect-runtime.js`):
  - A spell entry with no text compiles as a `proxy-cast` of its written twin: the same name in the same pack.
  - The runtime loads the twin from the pack for the compiler.
  - The proxy loads the twin's variant (`options.variant`, or asked) and resolves it through its own route.
- **Patron's Apocalypse (Witches+)** (new `patron-apocalypse.js` and `supplements/patrons-apocalypse.js`, kind `patron-apocalypse`; `effect-runtime.js`; `ongoing-families.js`; `main.js`):
  - **The table:** the module's text refers to the apocalypses' list without giving it. The book's text, shared by the user, is kept as a supplement, and each entry is read by pattern (Cosmic, Corpses, Flames, Floods, Frost, Nature, Plague, Rapture).
  - **The cast:** the apocalypse is asked once and then kept on the caster. Up to four non-overlapping 10-foot bursts are placed.
  - **Each burst:** a region for the sustained minute. A creature starting its turn there takes the type's damage with a basic Reflex save, plus its effects:
    - member rules: Cosmic's Dazzled, Floods' −2, Rapture's +1 for the caster and allies;
    - Flames' concealment;
    - Frost's 1-round Speed penalty and Nature's 10 persistent bleed, whatever the save;
    - Plague's Sickened 1 on a failure;
    - Rapture spares the caster's side.
  - **The Sustain's move** (`apocalypseMove`): one burst moves up to 30 feet. Hazardous terrain stays where it was: each creature entering it takes 10 damage of the type, plus the effects.
  - **Runtime additions:** lingering hazards gained `alwaysEffect` (rules for some rounds, persistent damage); `startRegionArea` gained `enemiesOnly` and `concealment`.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 67 | Batch 68 |
| --- | --- | --- |
| Effect | 98 | 100 |
| Not enabled | 2 | 0 |

Resolved: **227 of 227**.

## Tests

`test/third-party-batch-68.test.js` (2). All 1,789 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-68-live-results.json), case `thirdPartyBatch68`, in the `pftest` world.

| Step | Result |
| --- | --- |
| The empty Dynamic Breathe Fire, a variant | Cast as the written copy: its save card |
| Patron's Apocalypse, Nature: overlapping bursts | Refused |
| Two bursts; the caster Sustains; the foe starts its turn in one | 120 piercing (basic Reflex) and 10 persistent bleed |
| A burst moved 40 feet | Refused |
| Moved 30 feet | Hazardous terrain left (10 damage) |
