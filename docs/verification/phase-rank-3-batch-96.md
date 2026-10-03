# Rank 3 batch 96 — Sign of Conviction

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Sign of Conviction (3) | An ordinary spell attack from the card on the cast and on every Sustain, any number per turn. It deals 2d10 (+1d10 per 2 ranks), double on a critical hit, of the type the caster picks from the deity's list: fire, spirit, cold or force. The first attack makes the caster's Effect, sustained, for the minute: +1 status to AC and saves, and Immobilized. Moving the caster's token ends it, and later attacks from that card are refused because the spell has ended. The Shove DC, the light and the deity's types are notes. |

## Rules

- **Sustain attack (`src/compiler/sustain-attack.js`):** a new `signAttack` reader handles:
  - the gain, Shove DC, ending, blast, attack and multiple-Sustain sentences;
  - the deity's three paragraphs;
  - the heightening, checked against PF2e's.

  The repeat window is `sustain` with `perTurn: "any"`; `castEffect` holds the stated rules.
- **Validation (`basic-save-core`):** `castEffect` must be exactly the status bonuses to AC and saves and a granted condition, proved by the same sentence; `perTurn` may only be `"any"`.
- **Runtime:**
  - `ensureCastEffect` makes the Effect with the card's first attack, keyed by the spell message. It's flagged `endsAfterMovement`, and a later attack after the Effect is gone is refused.
  - The card's Sustain window allows any number of attacks on the caster's turn when `perTurn` is `"any"`.

## Interpretation

- **The damage types are offered together.** PF2e's remastered deities have no good, evil or neutral alignment, so all four types (fire, spirit, cold, force) are offered. The note says which go with which deity.
- **"Stop being immobilized" ends it only with the Effect.** Immobilized comes from the Effect, so it ends when the Effect ends (or the caster's token moves). Stopping the Sustain is a note: delete the Effect.

## Tests

`test/rank-3-batch-96.test.js` is new. It covers the attack, the window, the formula and the Effect's rules, and a bonus to another statistic (not read).

A whole-corpus compile (b620 → b621) changed only Sign of Conviction.

## Evidence

[Live evidence](phase-rank-3-batch-96-live-results.json), case `rank3Batch96`, in the `pftest` world, cast at 5th rank.

| Step | Result |
| --- | --- |
| The first attack (spirit) | 3d10 spirit, applied; the Effect: AC +1, saves +1, Immobilized, sustained |
| The second attack (fire) | 3d10 fire; still one Effect |
| The caster's token moves | The Effect and Immobilized are gone |
| A third attack from the same card | Refused ("the spell has ended") |
| A new casting | Works again |

**Cleanup:** fixtures removed.
