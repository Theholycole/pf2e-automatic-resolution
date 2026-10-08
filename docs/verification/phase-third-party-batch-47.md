# Third-party batch 47: Fractal Frosting, Manifest Wicket Dominion

2026-10-07. The forty-seventh batch of the third-party modules' spells. It clears the last two effect-note spells.

## What changed

- **Fractal Frosting (Oracles+)** (`proxy-cast.js`; `effect-runtime.js`; `spellshape-runtime.js`):
  - Frostbite is cast with it, at the same rank.
  - For the minute, the caster holds an Effect (`castShaper`) that shapes each of its Frostbite casts, this first one included:
    - each target's ground (a 5-foot emanation) becomes difficult terrain until the caster's next turn; `around-creature` terrain gained `each`;
    - from 9th rank, Speed –5 feet on a failure and –15 feet on a critical failure; `generated` riders gained a degree filter.
  - The 60-foot range and the three targets are a note on the Effect.
  - The module's Effect (a ChoiceSet of –5/–15 feet for 1 round) is checked against the text. The module builds the penalty from the text instead of prompting.
- **Manifest Wicket Dominion (Magic+)** (new `wicket-dominion.js`, kind `caster-dominion`; `ongoing-families.js`):
  - A stationary 60-foot emanation, centred where the caster stands, for 1 minute.
  - While the caster is inside, it holds a status bonus equal to the spell's rank to `spell-damage` and `spell-healing`. This covers its slot spells and non-cantrip focus spells that have one of its wicket traits.
  - The area's member rules gained `memberCasterOnly`.
  - "Initial damage only" and "once per creature" are a GM note.
  - The module's Effect reads the target as the one in the area and counts slot spells only, so the rules come from the text.
- **Ongoing reconcile** (`ongoing-runtime.js`): a plain `reconcile()` arriving while another is queued but not yet started now shares that queued run, which reads the state as it starts.
  - Every token update asks for a reconcile, and each one resets every actor.
  - A region over six tokens took 3.9 s before the change and 0.9 s after.
- **Test cleanup** (`phase23-affliction-verification.mjs`): also removes orphaned Ongoing records, whose caster no longer exists, together with their areas. 112 such records were removed in the pftest world.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 46 | Batch 47 |
| --- | --- | --- |
| Effect | 76 | 78 |
| Effect-note | 2 | 0 |

Resolved: 205 of 227.

## Tests

`test/third-party-batch-47.test.js` (3). All 1,767 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-47-live-results.json), case `thirdPartyBatch47`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Fractal Frosting at 9th on two foes | Frostbite cast; the caster's Effect; difficult terrain around both |
| A failure, a critical failure | Speed –5 and –15 feet |
| A second Frostbite cast from the sheet | Shaped by Fractal Frosting; terrain around its target; Speed –15 on a critical failure |
| Wicket Dominion (fire/light wicket), Fireball inside | `6d6 + 3 fire` |
| Lightning Bolt inside | `4d12 electricity` (no wicket trait) |
| Fireball after leaving the area | Member Effect gone; `6d6 fire` |
