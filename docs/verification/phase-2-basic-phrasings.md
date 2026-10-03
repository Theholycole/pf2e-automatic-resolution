# Basic-save and outcome phrasings — verification

2026-09-25. After the larger families, the rest of Phase 2 is small groups. This batch adds four reusable phrasings, each with a spell it unblocks. No spell-name or ID dispatch was added.

| Phrasing | Rule | Spell |
| --- | --- | --- |
| “Each undead creature in the area takes 4d12 vitality damage.” | The target predicate becomes `trait: undead`. For the simple basic-save gate, the restriction (and any other mention of undead) is already accounted for. | Eradicate Undeath |
| “The water also extinguishes non-magical fires in the area.” | An environment-only sentence (The/Its/This … extinguishes non-magical fires/flames) is narration and is removed before the simple gate. | Crashing Wave |
| “Terrestrial creatures in the affected area must attempt a Reflex save …” | This becomes a GM-confirmed eligibility question (is the creature on the ground?), so a flier can be marked unaffected. | Shockwave |
| “As failure, plus the creature takes 1d6 bludgeoning damage.” | The dice become the spell's single structured damage entry when formula and type match; with no damage entry and no heightening, they're rolled as written. | Shockwave |

**Evidence:**
- **Automated:** 267/267 tests pass. The [homebrew guide](../homebrew-spells.md) has examples for all four phrasings, and each is covered by a test.
- **Corpus:** the delta changes exactly these 3 spells, and all regressions show 0.
- **Census:** **275 enabled**.

[Live evidence](phase-2-basic-phrasings-live-results.json):
- **Shockwave:** the grounded creature fell prone and took the 1d6 on a critical failure. The creature the GM marked non-terrestrial was unaffected.
- **Eradicate Undeath:** damaged only the undead creature; the living one was ineligible.
- **Crashing Wave:** applied half damage on a success.
