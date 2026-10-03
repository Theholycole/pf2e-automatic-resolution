# Rank 2 batch 56 — Canopy Crawler

2026-10-01. Follows the user's decisions of 2026-10-01: the text over mismatched PF2e data, and a companion choice settled on the card.

| Spell | Now |
| --- | --- |
| Canopy Crawler (2) | PF2e's Effect goes on the caster when nothing is targeted, or on the target. Its climb Speed is the recipient's highest Speed, read when cast; PF2e's own rule uses the land Speed. A target other than the caster must have the animal and minion traits, or the GM confirms it's the caster's animal companion. From 5th, the caster and the companion can both be targets, and the duration is 1 hour. Climbing with a hand occupied (two with Combat Climber) is the note. |

## Rules

- **`effect-note-proof.js`:**
  - A reader for the climb Speed sentence claims PF2e's BaseSpeed rule with an override (`@recipient:highest-speed`). Single-rule claims can carry an override, gathered as the proof's `ruleOverrides`.
  - A note for the hands sentence, and the opening narration.
  - The recipient `self-or-companion`, and `bothFromRank` from the entry "The spell's duration increases to 1 hour, and you can target both yourself and your animal companion with a single casting."
- **`caster-resolved-rules.js`:** `recipientResolvedOverrides` is the highest of land, burrow, climb, fly and swim. PF2e's travel Speed isn't one of them.
- **Runtime:**
  - The Effect + note executor resolves the overrides per recipient.
  - For `self-or-companion`, it checks the number of targets by rank, and the companion (by its traits, or the GM's confirmation).

## Tests

903/903 pass. `test/rank-2-batch-56.test.js` is new. It checks:
- the plan and the highest Speed (travel Speed excluded);
- that another Speed or another hands rule isn't proved.

A whole-corpus compile (b310 → b311) changed only Canopy Crawler.

## Coverage

**Census:** **1133 enabled**, up from 1132. Rank 2: 219 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-56-live-results.json), case `rank2Batch56`, in the `pftest` world. The caster has land 25 and fly 40; the companion (animal, minion) has land 35.
- **At 2nd:**
  - No target: the caster climbs 40.
  - The companion: it climbs 35, for 10 minutes.
  - Both as targets: refused.
  - A creature without the traits, not confirmed: refused, and no Effect.
- **At 5th, both targeted:** climb 40 and 35, for 1 hour.
- **Cleanup:** fixtures removed.
