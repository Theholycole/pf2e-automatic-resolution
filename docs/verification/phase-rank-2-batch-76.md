# Rank 2 batch 76 — Helpful Wood Spirits

2026-10-01. It needed no new user decision. Chores and the area's move are the GM's, as with the module's other manual tasks.

| Spell | Now |
| --- | --- |
| Helpful Wood Spirits (2) | The GM places the 5-foot burst. It's a sustained area for up to a minute. The caster picks the aid when casting, and on each Sustain through a card (once a round). Changing the aid removes the previous aid's terrain and Off-Guard. |

The four aids:
- **Chores:** a GM note with the task's limits.
- **Distract:** the caster's foes in the area roll their Reflex saves against the spell DC. Those that fail are Off-Guard while inside, until the next aid. Allies aren't asked.
- **Obstacle:** the area becomes difficult terrain until the next aid.
- **Search:** the caster's Perception is rolled to Seek. The caster learns what is found; the GM tells.

The card also says the area can move 10 feet (the GM moves the region). A missed Sustain ends the spell.

## Rules

- **`spirit-aid.js` (new pre-pass, kind `spirit-aid`):** the choose and Sustain sentences, the four list items exactly, and the known narration.
- **`ongoing-families.js`:**
  - `startSpiritAid` — a placed sustained lingering record.
  - `spiritPulse` — clears the previous aid, then applies the new one.
  - `spiritAidChoice` — the `spirit-aid` request, once a round in combat.
  - The Sustain branch posts the aid card.
- **`main.js`:** the card's buttons.

## Tests

946/946 pass. `test/rank-2-batch-76.test.js` is new. It checks:
- the plan;
- that a changed save, terrain, or an extra aid isn't read.

A whole-corpus compile (b331 → b332) changed only Helpful Wood Spirits.

## Coverage

**Census:** **1153 enabled**, up from 1152. Rank 2: 239 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-76-live-results.json), case `rank2Batch76`, in the `pftest` world.
- **Distract when cast:** the foe failed and is Off-Guard. The ally wasn't asked.
- **The Sustain in combat:** posted the aid card. Choosing Obstacle removed the Off-Guard, and moving into the area cost 15 feet.
- **A second choice that round:** refused.
- **The missed Sustain:** ended the spell and removed the area.
- **A separate cast with Search:** rolled the caster's Perception (`action:seek`).
- **Cleanup:** fixtures removed.
