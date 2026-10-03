# Rank 2 batch 67 — Palm-Held Sun

2026-10-01. Follows the user's decisions of 2026-10-01:
- A trait PF2e can't detect ("a particular vulnerability to sunlight") is the GM's on a card.
- The text over PF2e's data: PF2e's Aura is 60 feet; the text's emanation is 30.

| Spell | Now |
| --- | --- |
| Palm-Held Sun (2) | PF2e's Effect goes on the caster: its light (bright 30, dim 60), and its Aura set to the text's 30-foot emanation. It lasts as a sustained record of up to a minute. On the cast and each Sustain, every void-healing creature in the aura takes 1 vitality damage. A card then lets the GM target the creatures vulnerable to sunlight, and starts their Fortitude save (Slowed 1 for 1 round on a failure). Whenever a creature in the aura loses Hit Points to damage with fire in it, from any source, it takes 1 vitality damage (PF2e decides its effect: nothing on a living creature). A missed Sustain ends it. |

## Rules

- **`sun-aura.js` (new family, kind `sun-aura`):**
  - It reads the light, pulse and fire sentences exactly (one sentence of narration allowed).
  - PF2e's Effect must be exactly its TokenLight (the text's bright and dim) and an Aura, whose radius the module overrides.
  - The sunlight save is compiled as a degree sub-plan (`sunlightPlan`).
- **`ongoing-families.js`:**
  - `auraCreatures` (the caster included).
  - `sunPulse`, run when cast and on each native Sustain.
  - `sunSunlight` (the GM's targets, checked to be in the aura; the save card).
  - `sunFire`.
- **`main.js`:**
  - The sunlight card's button.
  - **A wrapper on PF2e's `applyDamage`**, applied once: when a creature loses Hit Points to a roll with fire damage in it, it reports `sun-fire` to the GM's record. PF2e's damage-taken message doesn't record damage types, so the roll is read where it's applied.

## Tests

928/928 pass. `test/rank-2-batch-67.test.js` is new. It checks:
- the plan, the override and the sub-plan;
- that a changed pulse, duration or trigger isn't read.

A whole-corpus compile (b322 → b323) changed only Palm-Held Sun.

## Coverage

**Census:** **1144 enabled**, up from 1143. Rank 2: 230 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-67-live-results.json), case `rank2Batch67`, in the `pftest` world.
- **When cast:** the Effect's Aura was 30 and its light 30. The undead inside lost 1; the undead 35 feet away lost nothing.
- **Sunlight:** the GM targeted the living creature. It critically failed its save and is Slowed.
- **Fire:** 4 fire damage to the undead inside cost it 5 HP (4 + 1 vitality).
- **Sustain** on the caster's turn: the undead lost 1 more, and a second sunlight card was posted.
- **Cleanup:** fixtures and the combat were removed.
