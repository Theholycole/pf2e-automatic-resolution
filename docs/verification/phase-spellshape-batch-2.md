# Spellshape batch 2: family B riders

2026-10-05. More rider forms, and arming by card for any spellshape feat.

- **Riders added:**
  - conditions on creatures the spell *damaged*, or that it *hit or that failed*;
  - durations of "rounds equal to the spell rank", and "until the start of your next turn" (ended as the caster's turn starts);
  - PF2e's Effect the feat links, on a critical failure or "unless the target is unaffected";
  - a condition reduced;
  - a mark with its duration and what the caster knows;
  - the GM's part, whispered once per cast;
  - a line twice as wide (the template is widened as it's created).
- **Requirements added:** named spells ("cast Harm or Heal to damage one creature") and a damage type ("deals fire damage").
- **Wands:** their "You cast …, but …" clause is read as rider sentences, and narration is skipped.
- **Arming by card** now works for any spellshape feat (posting its card is using the action). A cast with both the selector and the card counts the feat once.

| Feat or wand | Now |
| --- | --- |
| Overburdening Spell | A single-target spell: PF2e's Effect (–15-foot Speeds, doubled for climb, fly and swim) unless the target is unaffected. |
| Portentous Spell | Fascinated with the caster until the start of its next turn, for creatures hit or failing. The reactions' –2 (PF2e's Effect) is the GM's note. |
| Tender Ministrations | A non-cantrip single-target spell: the target's Frightened down by 1. An animal's counteract is the GM's note. |
| Branding Spell | A non-cantrip fire spell: on a failed save, the brand Effect for a week with what the caster knows. |
| Dizzying Spell | A single-target Will spell: Stupefied 2 for 1 round, 3 on a critical failure. |
| Wand of Noisome Acid | A creature damaged by Acid Grip is Sickened 1. The spell DC for the recovery is the GM's note. |
| Wand of Clinging Rime | Frigid Flurry's failures take persistent cold (1d6, 2d6, 3d6 by rank). |
| Wand of Splintered Sorrows | A creature damaged by Splinter Volley: Stupefied 2 for the rank's rounds; on a critical hit, Slowed 1 too. |
| Wand of Crackling Lightning | The bolt's line is twice as wide; failures are Off-Guard for 1 round. |
| Cast Down | Read (Prone when damaged; PF2e's Effect on a critical failure). It needs Heal and Harm on a module card: family F. |

## Tests

`test/spellshape-batch-2.test.js` is new. Coverage: 11 of 131 feats and 5 of 49 wand kinds read.

## Evidence

[Live evidence](phase-spellshape-batch-2-live-results.json), case `spellshapeBatch2`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Fear with Overburdening Spell (success) | PF2e's Effect |
| Fireball with Portentous Spell (failure, success) | Fascinated; not |
| Enfeeble with Tender Ministrations (the target Frightened 2) | Frightened 1 |
| Fireball with Branding Spell (failure, success) | Branded; not |
| Fear with Dizzying Spell (critical failure) | Stupefied 3 |
| Wand of Noisome Acid (failure) | Sickened 1 |
| Wand of Clinging Rime (failure, critical success) | Persistent cold; not |
| Wand of Splintered Sorrows (hit, critical hit) | Stupefied 2 for 2 rounds; and Slowed 1 |
| Wand of Crackling Lightning (failure, success); a line template for the cast | Off-Guard; not; width 100 → 200 |
