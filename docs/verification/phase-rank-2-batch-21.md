# Rank 2 batch 21 — a fly-only cloud, a held item's persistent damage, a death and its reward

2026-09-30.

| Spell | Now |
| --- | --- |
| Ash Cloud (2) | A 20-foot burst for 1 minute. A creature that starts its turn in it saves (Fortitude): half / full 2d4 fire (+1d4 a rank); Dazzled 1 round on a failure, Blinded 1 round and double damage on a critical failure. The region is difficult terrain for flying only. The GM gets a note that creatures in it can't detect anything by smell. |
| Heat Metal (2) | 4d6 fire and 2d4 persistent fire (+2d6 / +1d4 a rank). Success: half the initial damage, no persistent. Failure: both. Critical failure: both doubled. The card asks whether the creature Releases the held item; yes makes its result one step better. |
| Death Knell (2) | Only a living creature at 0 HP can be targeted. Success: its Dying rises by 1 (PF2e's increase; at its maximum it dies). Failure: it dies. When it dies from the spell, the caster gets PF2e's Spell Effect: Death Knell (10 temporary HP and +1 status to attack and damage rolls, 10 minutes). |

## Rules

- **A cloud's start-of-turn damage:** "Creatures that start their turn within the cloud take 2d4 fire damage as …, with a Fortitude save." is a turn-start trigger whose damage is the spell's one entry.
- **Fly-only terrain:** "The cloud is difficult terrain for flying creatures, and creatures in the cloud can't …" gives the region a movement cost for `fly` only. The "can't" part becomes a GM note, with no "end the spell" suffix.
- **A held item's persistent damage:** the two-component rule now also reads:
  - the inline persistent damage (`@Damage[2d4[persistent,fire]] damage`);
  - a Heightened line without the comma before "and";
  - "and the object deals no / full / double persistent damage";
  - "As failure, but …" on the critical failure.
- **Release:** "If you target an item held by the creature, the creature can Release the item to improve their degree of success by one step …" is a GM-confirmed one-step improvement.
- **Death and its reward:**
  - "1 living creature that has 0 HP" adds an `hp-zero` target check.
  - "The target dies." is applied on the primary row: PF2e's Dead status, with Dying and Unconscious cleared.
  - "The target's Dying value increases by 1." is PF2e's own `increaseCondition`. Reaching the Dying maximum kills.
  - "If this kills it, you gain 10 temporary HP and a +1 status bonus to attack and damage rolls for 10 minutes." moves the linked Effect from the rows to `resolution.killEffect`. It's given to the caster once, when a row's death is applied. Its rules must be exactly the sentence's: checked at compile, in the core, and again on the live template.

## Heightened versions

- **Ash Cloud (+1):** 3d4 at 3rd. Live: "3d4 fire".
- **Heat Metal (+1):** 6d6 and 3d4 persistent at 3rd. Live: "6d6 fire + 3d4 persistent fire".
- **Death Knell:** no Heightened entry.

## Not in this batch

**Worm's Repast** still needs three things the save route doesn't combine yet:
- an extra persistent damage for non-skeletal undead, beside the main one;
- two conditions lasting while the persistent damage does;
- the spell ending on a success.

## Tests

835/835 pass. `test/rank-2-batch-21.test.js` is new. It checks:
- Ash Cloud's lingering declaration and a forged movement type;
- Heat Metal's rows, the Release map, and a changed row wording (refused);
- Death Knell's targeting, Dying increase, death and kill Effect;
- Death Knell's refusals: a forged benefit, a forged increase, and a sentence that doesn't match the Effect.

A whole-corpus compile (b274 → b275) changed only these three spells.

## Coverage

**Census:** **1057 enabled**, up from 1054. Rank 2: 145 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-21-live-results.json), case `rank2Batch21`, in the `pftest` world.
- **Ash Cloud at 3rd (in combat):**
  - The region's movement cost is fly 2, walk 1. The smell note was whispered to the GM.
  - No save when cast. One "started its turn in the area" exposure.
  - The failure dealt 3d4 fire (8, all lost) and Dazzled for 1 round.
  - Ending the spell removed the region.
- **Heat Metal at 3rd:**
  - Success lost 9 with no persistent damage; failure lost 18 plus 3d4 persistent; critical failure lost 36 plus "2 * 3d4" persistent.
  - The Release target rolled a failure; answering yes made it a success (lost 9, no persistent).
- **Death Knell:**
  - A creature above 0 HP was ineligible.
  - Before Finalize, the card listed "Dying +1", "Dies" and the caster's Effect.
  - Success: Dying 1. A success at Dying 3 reached 4 and died. Failure: dead. Critical success: untouched.
  - The caster got one Spell Effect: Death Knell (10 temporary HP, 10 minutes).
- **Cleanup:** fixtures, the combat and the region removed.
