# Transformation workflow evidence

Read-only review of local PF2e 8.5.0 packs and module code; no live validation performed.

- Animal Form links 13 native Effects. Bear (`gQnDKDeBTtjwOWAk`) encodes BattleForm attacks, statistics, senses, movement, temporary HP, and rank-dependent size/reach.
- Dragon Form (`1pC1qjvCuAKzjYo8`) uses a 40-option ChoiceSet and encodes attacks, statistics, movement, resistances, and a granted breath action. Tradition-sensitive predicates require correct spellcasting context.
- Dragon Breath has no explicit frequency value and describes recharge in prose. This does not establish automatic usage enforcement.
- Investigate apparent missing rank-8 flight adjustment and Despair breath save mismatch; these are suspected data discrepancies, not demonstrated runtime failures.
- `scripts/effect-runtime.js` clones an Effect and assigns cast rank; explicit PF2e spell origin/context propagation is not visible in that creation path.

Before claiming support, verify base/heightened statistics, own-bonus selection, size/reach, temporary HP, choice cancellation, casting tradition, granted-action saves/damage/recharge, repeated casts, and clean removal on dismissal/expiry. Preserve unrelated changes.

## Implementation checkpoint — 2026-09-20

The later [Phase 5 release verification](../verification/phase-5-release.md)
records the implemented Animal/Dragon/Pest profiles and live evidence. Earlier
research statements above describe the investigation baseline, not final support.
