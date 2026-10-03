# Rank 7 batch 2 — Clockwork Devotion, Sudden Transposition, Frigid Flurry, Accelerated Decomposition, Momentary Recovery, Hypnopompic Terrors, Eclipse Burst

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Clockwork Devotion | Incarnate. A phase's text damage of two types ("4d8 slashing damage and 4d8 fire damage") is two entries, rolled as one formula. The rider table reads "takes an additional {persistent} damage" on a critical failure. |
| Sudden Transposition | Rows reworded (`save-rewrites.js`): failure full damage, critical failure double damage and Prone (the text's 20d10 is the item's 10d10 doubled). Each teleport is the GM's reminder on the card (new reminder kind `teleport`, proven by the reworded sentences). |
| Frigid Flurry | Reworded to the basic Reflex save in the line, enemies only (allies are ineligible). Being carried to the far end, and its immunity, are the caster's reminder. |
| Accelerated Decomposition | New caster choice `option` / `row-condition`: the success row's listed conditions ("your choice of Clumsy 1, Drained 1, or Enfeebled 1 for 1 round") are options, one applied. The card asks only when a target lands on that row. |
| Momentary Recovery | Condition-note grant: the caster is Slowed 1 until the end of their next turn. The teleport and the actions on the way are the note. |
| Hypnopompic Terrors | New degree adjustment: a sleeping target (the GM's yes/no) gets one step worse. The rows normalize "double the mental damage" (the spell's only damage) and the lowercase "paralyzed for 2 rounds" (linked in the row before). |
| Eclipse Burst | "plus an additional 8d4 void damage to living creatures" becomes the item's two entries together. PF2e's void damage already spares undead and constructs (checked live). |

The row rewordings also fixed the order and durations of two linked conditions in Noise Blast and Weight of the World ("is deafened for 1 minute" now has its minute). Nothing else changed status.

## Tests

`test/rank-7-batch-2.test.js` is new. A whole-corpus compile (b720 → b721) changed these spells. It also re-linked lowercase condition names (with the same meaning) in Gritty Wheeze, Spray of Stars, Unraveling Blast, Zenith Star, Fear the Sun, Ignite Fireworks, Unrelenting Gravity, Sparkleskin, Bursting Bloom, Mantis's Grasp, Painful Vibrations, Utter Destruction, Pollen Pods and Phantasmagoria.

## Evidence

[Live evidence](phase-rank-7-batch-2-live-results.json), case `rank7Batch2`, in the `pftest` world. (Fixture HP readings include a 400 reset from the fixture's default HP; the damage itself is the rest.)

| Step | Result |
| --- | --- |
| Clockwork Devotion's Depart, critical failure | Damage and persistent fire |
| Sudden Transposition, failure and critical failure | Both damaged; only the critical failure is Prone; the teleport reminder shown |
| Frigid Flurry on a foe and an ally | The ally is ineligible and untouched; the foe is damaged; the carry reminder shown |
| Accelerated Decomposition, success | Finalize waits for the pick; Drained 1 only |
| Momentary Recovery | The caster is Slowed 1 |
| Hypnopompic Terrors, both critical failures; one confirmed asleep | The adjustment applies to one and not the other; Paralyzed and Frightened 2 |
| Eclipse Burst on a living creature and a construct | The construct takes less (no void) |

**Cleanup:** fixtures removed.
