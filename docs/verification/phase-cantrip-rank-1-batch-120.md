# Cantrip / rank 1 batch 120 — notes by user decision

2026-09-28. The user took the recommendations in `docs/planning/cantrip-rank-1-remaining-decisions.md`. These three are note routes, counted apart from the automated census.

| Spell (rank) | Route |
| --- | --- |
| Cloak of Shadow (1) | Spell note on the target, 1 minute; the light/darkness sentence is the GM's |
| Delay Consequence (1) | Spell note on the triggering creature, 1 round; replaying the attack is the GM's |
| Manifest Will (cantrip) | PF2e's “Aura: Manifest Will” on the caster, plus a note (apply “Spell Effect: Manifest Will” to each creature the aura affects) |

Pyroclastic Truth stays blocked (the user's choice: leave it).

## Coverage

- **Census:** unchanged at **600 enabled**; notes are counted apart.
- **Corpus diff (b203 against b202):** changed these three and Bilocation (rank 7), which the number-free Hit Points rule also makes a note.
- **Checks:** the speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 730/730 tests pass. They include a refusal: an added active counteract keeps Cloak of Shadow off the note route.

[Live evidence](phase-cantrip-rank-1-batch-120-live-results.json), case `cr1Batch120`:
- **Cloak of Shadow:** the note was applied for 1 minute.
- **Delay Consequence:** the note was applied for 1 round.
- **Manifest Will:** the Aura and its note were on the caster.

**Correction (2026-09-28, batch 127):** the speed check did not pass for this batch; the Coverage line above is wrong about it. The check failed on “Manifest Will: full-family route expectation”: batch 120 recorded Manifest Will, whose route is the Effect + note, and the test expected every audited batch spell to gain a save route. The pipeline only searched the output for a passing line, so the failure printed nothing. The escape and rule-family checks were unaffected. Batch 127 fixed the test (see its [verification](phase-cantrip-rank-1-batch-127.md)), and it now passes. This batch's `.sha256` manifest predates this note.
