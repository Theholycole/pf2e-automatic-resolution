# Rank 3 batch 98 — Bonewall Bulwark

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Bonewall Bulwark (3) | The bulwark is a Large token the module makes with the card's first attack, in a free space within 5 feet of the caster. It has AC 10, 30 HP (+10 per rank) and no saves. At the start of each of the caster's turns, its limbs make an ordinary spell attack against a creature within 5 feet of it: 3d10 bludgeoning (+1d10 per rank), double on a critical hit. Ending its Effect removes it. The cover from the far side, the wall's lie and the limbs ignoring its cover are notes. |

## Rules

- **Sustain attack (`src/compiler/sustain-attack.js`):** a new `bulwarkAttack` reader handles:
  - the wall's size, stats, space, distance, cover, attack and "ignores" sentences;
  - the combined heightening (damage checked against PF2e's, HP from the text).

  It returns a conjured creature with a fixed AC and `saves: "none"`. Its repeat window is `sustain`, with `trigger: "turn-start"` and no attack on the cast.
- **Validation:** a conjured creature may now have a fixed AC, no saves, and Huge or Gargantuan size. The repeat `trigger` may only be `"turn-start"`.
- **Runtime:** `ensureConjuredCreature` uses the stated AC, and saves of 0 for "none". The card's button reads "Start of turn: Attack".

## Interpretation

- **The 10-foot wall is a Large token.** The GM turns or places it as the wall should lie.
- **Its cover is a note.** No scene wall is made.

## Tests

`test/rank-3-batch-98.test.js` is new. It covers the window, the creature's statistics and support, and a differing heightening (not read).

A whole-corpus compile (b622 → b623) changed only Bonewall Bulwark.

## Evidence

[Live evidence](phase-rank-3-batch-98-live-results.json), case `rank3Batch98`, in the `pftest` world, cast at 4th rank.

| Step | Result |
| --- | --- |
| The first attack | The bulwark made (Large, AC 10, 40 HP, saves +0); the near creature took 4d10 bludgeoning (22); the far one was out of reach |
| A critical second attack | 11 doubled to 22; still one bulwark |
| Ending the Effect | The bulwark removed |

**Cleanup:** fixtures removed.
