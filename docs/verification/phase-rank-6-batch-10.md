# Rank 6 batch 10 — Chromatic Image, Personal Ocean, Cryostasis

2026-10-03. Ranks 6–10 pass, continued.

| Spell | Now |
| --- | --- |
| Chromatic Image | "This has the effects of Mirror Image, except …": Mirror Image's own text is compiled (its three images and hit chances) and its PF2e Effect goes on the caster. Each time an image is destroyed (the Mirror Image control; the GM targets the attacker), the card rolls the 1d4 color and applies that row to the attacker: 5 of the color's type and 5 mental, plus Frightened 1 for Green. With no target, the card names the color for the GM. |
| Personal Ocean | A note on the caster for 1 minute; "can attempt to counteract magical fires you move through" is the card's Counteract button (what happens on a failure is in the note). |
| Cryostasis | A note on the dying target for 1 hour (unlimited from 8th): "remains Unconscious but stable" is only a mention. The ice block's statistics are the GM's. "1 dying creature" now requires PF2e's Dying condition (Stabilize and Gray Shadow read the same target). |

## Tests

`test/rank-6-batch-10.test.js` is new. A whole-corpus compile (b742 → b743) changed these three, plus Stabilize and Gray Shadow (their "1 dying creature" target is now checked; Stabilize stays automatic, Gray Shadow unresolved).

## Evidence

[Live evidence](phase-rank-6-batch-10-live-results.json), case `rank6Batch10`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Chromatic Image, a missed attack with the attacker targeted | 2 images left; the color rolled Red; the attacker took 10 |
| Personal Ocean | The caster's 1-minute note; the counteract button on the card |
| Cryostasis on a healthy creature / a dying one | Refused ("isn't a valid target") / the 1-hour note |

**Cleanup:** fixtures removed.
