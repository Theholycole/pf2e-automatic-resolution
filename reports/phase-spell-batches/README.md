# Spell implementation batches by phase

This is a new **planning worklist**, built from all **1,870 in-scope documents** (1,827 non-ritual spells and 43 rituals). It preserves the other 124 rituals separately. Generating this worklist does not change module behavior.

Each spell has one proposed primary worklist, explicit cross-phase signals, its current module route, source description and language cohort. **Phase assignments are provisional source-based inferences, not a newly verified phase completion denominator.** Enabled counts mean any current module route; they include partial Effect automation, not necessarily the proposed phase workflow. Phase 1 corrections and Phase 9 acceptance are cross-cutting.

| Phase | Worklist | Primary entries | Enabled route | Not enabled | Including dependency signals |
| --- | --- | --- | --- | --- | --- |
| 2 | Outcome-specific Effects and conditions | 595 | 595 | 0 | 1330 |
| 3 | Ongoing rules and recurring saves | 611 | 611 | 0 | 1511 |
| 4 | Immediate resolution and choices | 240 | 240 | 0 | 981 |
| 5 | Transformations | 63 | 63 | 0 | 63 |
| 6 | Summons and created creatures | 56 | 56 | 0 | 56 |
| 7 | Spatial effects and movement | 212 | 212 | 0 | 230 |
| 8 | Rituals | 43 | 43 | 0 | 43 |
| 9 | Catalog completion and unresolved classification | 50 | 50 | 0 | 50 |

The 51 primary Phase 9 entries are the unresolved assignment queue. **Leave these 51 review entries until last; current implementation proceeds through Phase 2 rule families.** See [the rider-family checkpoint](../../docs/verification/phase-2-rider-family.md) for the first completed expansion. **Phase 9 acceptance still covers all 1,870 entries**, as does the Phase 1 authority/correction framework wherever applicable.

## Browse the lists

- [Phase 2–3 implementation queue](phase-2-3-queue.md) — rule families, wording groups and shared test contracts.
- [Searchable catalog](index.html) — filter phase, rule family, status and wording; inspect source excerpts and differences.
- [Alphabetical master list](all-spells.md) — all 1,870 entries.
- [Phase 1: GM corrections](phase-1.md)
- [Phase 2: Outcome-specific Effects and conditions](phase-2.md)
- [Phase 3: Ongoing rules and recurring saves](phase-3.md)
- [Phase 4: Immediate resolution and choices](phase-4.md)
- [Phase 5: Transformations](phase-5.md)
- [Phase 6: Summons and created creatures](phase-6.md)
- [Phase 7: Spatial effects and movement](phase-7.md)
- [Phase 8: Rituals](phase-8.md)
- [Phase 9: Catalog completion and unresolved classification](phase-9.md)
- [Excluded/skipped rituals](excluded-rituals.md).
- [Machine-readable catalog and batches](catalog.json).

## How to use the 1124 language cohorts

1. Start with a Phase 2 or 3 cohort. Read the anchor and every member’s full description, including heightened and linked rules.
2. Confirm the exact shared rule grammar and identify exceptions. Split a cohort whenever target predicates, degree branches, timing, recurrence, rank changes or terminal outcomes differ materially.
3. Implement the smallest reusable rule primitive. These lists are test fixtures and planning metadata, never a spell-name dispatch table.
4. Generate per-member source/plan assertions for every legal rank and variant. Use representative live cases only for identical behavior; add cases for distinct mechanics.
5. Keep unsupported clauses gated and update evidence for each member. Enabled route is not full automation; partial native Effect routes remain labelled.

Grouping uses the same candidate phase and mechanic family, then normalized matched-clause word/bigram similarity (numbers and dice abstracted, condition names and save statistics abstracted for matching only), threshold 0.15, maximum 12 members. Values are preserved in the original source and JSON. Singletons stay separate instead of being forced into unrelated batches. Similarity scores are linguistic, not probabilities of correctness. Large families become several nearby cohorts.

Public and GM-only source descriptions are included in this GM planning catalog; similarity uses matched rule-clause excerpts, with full text only as an unmatched fallback. Scores can miss paraphrases or overvalue reused wording. Phase signals can overmatch quoted alternatives, references or incidental movement. Review is mandatory before treating a candidate cohort as a shared implementation/test contract. The full catalog is not semantically audited by this generator.

Reproduce with `python3 tools/build-phase-spell-batches.py <fresh compiler report>` after refreshing `reports/spell-enablement.json`. Authoritative phase definitions remain in [the implementation plan](../../docs/planning/full-spell-implementation-plan.md).
