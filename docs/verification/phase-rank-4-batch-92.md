# Rank 4 batch 92 — Draw the Lightning

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Draw the Lightning (4) | The target's basic Reflex save against PF2e's 3d12 electricity (7d12 at 8th). The GM confirms the target is taller or higher than the caster. The caster answers on the card whether the sky is cloudy or stormy (yes adds 2d12). The caster gets PF2e's Spell Effect: its weapon choice (PF2e asks), its toggle, and 1d12 electricity (2d12 from 8th) on that weapon's first Strike each round, for 1 minute. Holding the weapon or hand aloft is a reminder. |

## Rules

- **Draw lightning (`src/compiler/draw-lightning.js`):**
  - It reads the bolt, the charge, the storm sentence, the Effect link, the target line and the heightening.
  - It rewrites the lead into the basic save and sets the target to "1 creature", with a GM-confirmed predicate.
  - It adds `resolution.diceUpgrade.adds` (2d12) and `resolution.casterRowEffect` of kind `weapon-cast`.
- **The `weapon-cast` claim (new):** `casterRowEffectMatches` proves PF2e's Effect is exactly:
  - the weapon ChoiceSet;
  - a damage toggle;
  - DamageDice of the type and die on `{weapon}-damage`, gated by the toggle, `ternary(gte(@item.level,8),2,1)`;
  - lasting the stated time.

  A basic save may carry it with this spell's sentences.
- **Dice added on a basic save:** the caster's yes adds the dice (no persistent part) with this spell's sentence. The card's line handles no persistent dice.
- **Weapon preset (optional):** `casterEffectSelection` on the cast presets the ChoiceSet; PF2e prompts otherwise.
- **Interpretation:** the sky is the caster's answer. "Taller or higher" is the GM's confirmation. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-92.test.js` is new. It covers the dice, the Effect claim, the predicate, another die (refused), and another sky (not read).

A whole-corpus compile (b583 → b584) changed only Draw the Lightning.

## Evidence

[Live evidence](phase-rank-4-batch-92-live-results.json), case `rank4Batch92`, in the `pftest` world, at 4th rank (caster level 7).

| Step | Result |
| --- | --- |
| Target | GM confirmation pending, then confirmed |
| Stormy sky: yes; failure | 5d12 electricity = 36, lost 36 |
| Caster | Spell Effect: Draw the Lightning (Dagger), the dagger chosen |

**Cleanup:** fixtures removed.
