# Rank 2 batch 69 — Mark of Blood

2026-10-01. Follows the user's decision of 2026-10-01: information is whispered to the GM and the caster.

| Spell | Now |
| --- | --- |
| Mark of Blood (2) | Casting puts an Effect on the caster for a held piercing or slashing weapon (asked among several), for 1 minute. The next hit with that weapon (PF2e's attack message, read by the active GM) ends the Effect and posts the struck creature's Will save card. The outcome marks it with an unlimited Effect: on a success, a mark only; on a failure, plus a Seek check; on a critical failure, plus an automatic Seek. Marking another creature ends the caster's earlier mark. The Seek card's button rolls the caster's Perception against the creature's Will DC (or succeeds automatically). A critical failure ends the curse. A success whispers the creature's compass direction and distance when it's alive and on the same scene within a mile; otherwise the GM gives it. |

## Rules

- **`blood-mark.js` (new pre-pass, kind `blood-mark`):**
  - It reads the three rule sentences and the four rows exactly (one sentence of narration allowed). The target must be "1 piercing or slashing weapon you're wielding".
  - It compiles before the degree-table route, which otherwise claims this spell.
- **Runtime:**
  - `#executeBloodMark` — the weapon and the Effect.
  - `bloodMarkHit`, from a `createChatMessage` hook on attack rolls.
  - `bloodMarkSave` — the mark by outcome, one curse at a time.
  - `bloodMarkSeek` — the check, the curse ending, and the whispered direction and distance.
  - The card buttons and API entries.

## Tests

932/932 pass. `test/rank-2-batch-69.test.js` is new. It checks:
- the plan;
- that a changed Seek, trigger or ending isn't read.

A whole-corpus compile (b324 → b325) changed only Mark of Blood.

## Coverage

**Census:** **1146 enabled**, up from 1145. Rank 2: 232 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-69-live-results.json), case `rank2Batch69`, in the `pftest` world (a character caster with a rapier).
- **Cast:** "Mark of Blood (Rapier)" on the caster.
- **The rapier hit the first creature:** the Effect ended and the save card was posted.
- **The first creature's save:** a critical failure. It was marked, with an automatic Seek.
- **Seek:** the whisper read "… blood first — east, about 10 feet away."
- **Second cast:** it hit the second creature, which failed and was marked. The first creature's mark was removed.
- **Cleanup:** fixtures removed.
