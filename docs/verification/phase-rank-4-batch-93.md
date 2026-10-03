# Rank 4 batch 93 — Cloak of Light

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Cloak of Light (4) | A sustained 5-foot emanation around the caster (adjacent creatures), the caster out of it. A creature starting its turn in it is exposed in Heal's dual mode: a living creature regains PF2e's 4d6 vitality roll (no save), and an undead one saves (basic Fortitude) against it. Both heighten +2d6 every 2 ranks. The caster sheds bright light 30 feet and dim to 60 (a TokenLight Effect) while it lasts. |

## Rules

- **Holy cloak (`src/compiler/holy-cloak.js`):**
  - It reads the glow, the living sentence, the undead sentence and the heightening.
  - It rewrites the text into the lingering turn-start save on a 5-foot emanation, with PF2e's damage-and-healing entry as damage for the area compiler.
  - It sets `dualMode` (vitality) with its heal-or-harm evidence, `excludeCaster`, and `casterLight`.
- **Caster light (new):** `startLingering` puts a TokenLight Effect on the caster, which ends with the area. Validator: within 120/240 feet, from the compiled sentence.
- **Interpretation:** "adjacent" is the 5-foot emanation. Constructs are unaffected (Heal's rule). Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-93.test.js` is new. It covers the declaration, the dual mode, the light, the exposure plan, a dim light below bright (refused), and another healing (not read).

A whole-corpus compile (b584 → b585) changed only Cloak of Light.

## Evidence

[Live evidence](phase-rank-4-batch-93-live-results.json), case `rank4Batch93`, in the `pftest` world, at 4th rank (caster level 7), in combat.

| Step | Result |
| --- | --- |
| Start | caster light: bright 30, dim 60 |
| A living ally beside it starts its turn | healing mode: 4d6 = 14, regained 14 |
| An undead beside it starts its turn; failure | 4d6 vitality = 16, lost 16 |
| End | light removed |

**Cleanup:** fixtures and combat removed.
