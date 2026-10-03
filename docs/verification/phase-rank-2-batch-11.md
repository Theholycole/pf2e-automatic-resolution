# Rank 2 batch 11 — a flat check rolled on acting, in a behaviour note

2026-09-30.

| Spell | Now |
| --- | --- |
| Binding Muzzle (2) | Success: a 1-round note (no mouth attacks, can't imbibe anything). Failure: the same for 1 minute, plus "must succeed at a DC 11 flat check to Cast a Spell with verbal components", with the check's roll link in the note. Critical failure: the same for 1 minute, plus "can't speak". |

## Rule

- **A flat check rolled on acting:** "must succeed at a @Check[flat|dc:N] to Cast a Spell … / to use … / when attempting to … / when casting …", optionally "or the action is lost / disrupted / fails". The creature rolls it when it acts, which the module can't intercept, so a behaviour row's note carries it, with PF2e's roll link.
  - Other flat checks (each morning; to target the creature) aren't read this way.
- **"As success, but the effect lasts 1 minute, and …"** adds its text to the success note, and the success row's "For 1 round," is dropped from it.

## Tests

806/806 pass. `test/rank-2-batch-11.test.js` is new. It checks the notes, their durations and text, and which flat checks qualify.

A whole-corpus compile (b264 → b265) changed only Binding Muzzle.

## Coverage

**Census:** **1041 enabled**, up from 1040. Rank 2: 129 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-11-live-results.json), case `rank2Batch11`, in the `pftest` world.
- **Success, failure, critical failure:** notes of 1 round / 1 minute / 1 minute.
- **Failure:** its note names verbal components, and PF2e's enricher turns its DC 11 flat check into a roll link.
- **Critical failure:** "can't speak", without the flat check.
- **Cleanup:** fixtures removed; no combats or PFTEST regions left.
