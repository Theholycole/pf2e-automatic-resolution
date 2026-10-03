# Rank 3 batch 81 — Bloody Tendrils

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Bloody Tendrils (3) | The tendril thralls are the cast's targets: their tokens, up to 3 (1 more every 3 ranks), targeted when the area starts. An enemy ending its turn within 10 feet of any of them saves (basic Reflex) against PF2e's 1d12 bludgeoning (+1d12 every 3 ranks), once per turn. The tendrils' immunity to physical damage and stillness are a note. |

## Rules

- **Blood tendrils (`src/compiler/blood-tendrils.js`):**
  - It reads the five sentences and the heightening.
  - It writes the lingering declaration: centred on the targets with a 10-foot aura, turn-end events, enemies only, the caster out, and the targets' count and step (`maxTargets`), plus the note.
- **Several centres (extended):**
  - The targets-centred aura may now be wider than 5 feet and exposed at turn end, with this spell's sentence.
  - `startLingering` accepts up to the count at the cast rank.
  - Membership is the union of the targets' reaches (one exposure per creature).
- **Interpretation:** the thralls are the player's tokens (the module doesn't make them). Logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-81.test.js` is new. It covers the declaration, the exposure plan, all creatures instead of enemies (refused), and another reach (not read).

A whole-corpus compile (b589 → b590) changed only Bloody Tendrils.

## Evidence

[Live evidence](phase-rank-3-batch-81-live-results.json), case `rank3Batch81`, in the `pftest` world, at 3rd rank (caster level 5), in combat.

| Step | Result |
| --- | --- |
| An enemy 10 feet from the thrall ends its turn | exposed; failure: 1d12 bludgeoning = 8, lost 8 |
| An enemy 25 feet away ends its turn | not exposed |

**Cleanup:** fixtures and combat removed.
