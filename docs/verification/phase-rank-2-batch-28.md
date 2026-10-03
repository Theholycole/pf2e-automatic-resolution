# Rank 2 batch 28 — a sun ray, a blood-drinking hand

2026-10-01.

| Spell | Now |
| --- | --- |
| Sun Blade (2) | A spell attack of 1d4 fire (+1d4 a rank), doubled on a critical hit. Against an unholy target it adds 1d4 spirit, and against an undead target 1d4 vitality (both for one that's both), each +1d4 a rank and scaled like the hit. The card asks the GM whether the caster wields a sword or spear (no means nothing happens). It asks the caster whether it's in bright natural sunlight: yes makes every die a d6, the extras too. |
| Draw Blood (2) | A melee spell attack of 4d4 piercing and 2 persistent bleed (+2d4 and +1 a rank), doubled on a critical hit. A hit leaves a "Drawn blood" note on the target for the spell's minute. Ongoing spells has a control: each time the GM reports it took bleed damage, the caster regains `max(2, rank)` Hit Points. |

## Rules

- **`trait-ray.js` (new pre-pass):** Sun Blade's sentences exactly.
  - The spell becomes an ordinary spell attack of the base damage, with `conditionalDamage` for each trait.
  - The weapon requirement is the existing `castGate`.
  - The sunlight upgrade is the existing `diceUpgrade`. The core now also accepts it on a spell attack (evidence `attackDiceUpgrade`), and the runtime applies it to the trait extras' dice too.
- **`spell-attack-table.js`:** a new form, "… On a hit, you deal <damage list> (or double damage on a critical hit).".
- **`compile-ability.js`:** "For the duration of the spell, you regain @Damage[(max(N,@item.rank))[vitality,healing]] Hit Points each time the target takes bleed damage." is taken out of the attack's text. It becomes a note on the hit rows with `triggeredHealing`, lasting the spell's fixed duration.
- **`note-effects.js`, `ongoing-runtime.js`, `stored-trigger-runtime.js`:** the note carries `triggeredHealing` into the runtime flags. Ongoing spells shows its control, and `triggeredHealing` heals the caster.

## Tests

857/857 pass.
- `test/rank-2-batch-28.test.js` is new. It checks both spells' data and refuses forged or changed versions.
- `test/conditional-damage.test.js` had expected Sun Blade blocked; it now expects it supported. Moonlight Ray is still blocked.

A whole-corpus compile (b281 → b282) changed only these two spells.

## Coverage

**Census:** **1082 enabled**, up from 1080. Rank 2: 170 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-28-live-results.json), case `rank2Batch28`, in the `pftest` world.
- **Sun Blade at 3rd:**
  - The card asked both questions.
  - With sunlight, against an unholy undead target: 2d6 fire (9), plus 2d6 spirit (9) and 2d6 vitality (9); it lost 27.
  - Without sunlight, against a plain target: 2d4 fire (5), no extras; it lost 5.
- **Draw Blood at 3rd:**
  - A hit dealt 6d4 piercing (14 lost) and 3 persistent bleed.
  - The "Drawn blood" note lasts 1 minute.
  - The control healed the caster for 3 (gained 3).
- **Cleanup:** fixtures removed.
