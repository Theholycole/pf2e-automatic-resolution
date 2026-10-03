# Rank 2 batch 25 — a confetti cloud, a lament against the caster's foes, darkness

2026-10-01.

| Spell | Now |
| --- | --- |
| Confetti Cloud (2) | A placed burst of 5 / 10 / 15 feet by the actions spent, for 1 minute. Creatures inside are Concealed, with the flat-check note for creatures outside. Their in-area Effect also has a "Perception check to hear" toggle: switched on, it gives the –2 circumstance penalty. The caster can Dismiss it. |
| Menacing Lament (2) | Each enemy of the caster (PF2e alliances) within the 30-foot emanation gets an Effect until the start of the caster's next turn. It's a –2 circumstance penalty to AC (PF2e's off-guard slug, so no stacking with Off-Guard), only against the caster's attacks (`origin:signature`). It also states that the creature gains no benefit from flanking the caster (GM). A creature with no alliance is listed for the GM. |
| Darkness (2) | A placed 20-foot burst for 1 minute whose region is fully dark (Foundry's darkness-level override). The GM gets two notes: lights inside are dark, and magical light of the cast rank or lower is suppressed. From 4th, darkvision's concealment is also a GM note. |

## Rules (new families)

- **`concealing-area`, extended:**
  - "All creatures within the (area of the) <noun> become Concealed, and all creatures outside the <noun> become concealed to creatures within it."
  - The area by actions: "The number of actions you spend when Casting this Spell determines its area." with three "<n> (…) The spell's area is a @Template[burst|distance:N]." paragraphs.
  - "Additionally, creatures in the area of the <noun> … take a –N circumstance penalty on Perception checks to hear." becomes the in-area Effect's toggle (`<slug>-hearing`) and the FlatModifier it gates.
- **`against-caster-area` (new):** "Enemies in the area are Off-Guard against your attacks (and gain no benefits from flanking you) for the duration." for a 1-round emanation with no save. Recipients are PF2e enemies of the caster in range, measured from the caster's token.
- **`darkness-area` (new):** Darkness's five sentences exactly. The region gets `adjustDarknessLevel` (override, 1) through a new `startRegionArea` lingering record, whose region (and behaviours) go when the spell ends. A Heightened darkvision entry is a note from its rank.

## Tests

850/850 pass. `test/rank-2-batch-25.test.js` is new. It checks each family's data, and refuses a changed wording for each.

A whole-corpus compile (b278 → b279) changed only these three spells.

## Coverage

**Census:** **1073 enabled**, up from 1070. Rank 2: 161 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-25-live-results.json), case `rank2Batch25`, in the `pftest` world.
- **Confetti Cloud (3 actions):**
  - 15-foot area; the creature inside is Concealed.
  - Its Perception shows the Confetti Cloud –2 with the toggle on, and nothing with it off.
  - Ending the spell removed the concealment.
- **Menacing Lament:**
  - The foe within 30 feet got the Effect: AC –2, slug off-guard, predicate the caster's `origin:signature`, 1 round turn-start at the caster's initiative.
  - The ally, the far foe and the creature with no alliance got none; the last was listed for the GM.
  - At the start of the caster's next turn the Effect was gone.
  - A separate probe: the caster's Strike against the foe (AC 20) had DC 18 with the off-guard −2; another attacker's had DC 20.
- **Darkness at 4th:**
  - The region has `adjustDarknessLevel` (override, 1).
  - The GM notes name rank 4 and darkvision.
  - Ending the spell removed the region.
- **Cleanup:** fixtures, the combat and the regions removed.
