# Rank 2 batch 4 — forced movement

2026-09-30.

| Spell | Now |
| --- | --- |
| Boneshaker (2) | Each PF2e variant reads its own rows. The 2-action version is damage and Enfeebled. The 3-action version adds the caster's optional move: up to 5 / 15 / 25 feet, which the target can refuse by falling Prone. Its critical failure also knocks the target Prone. The base card (2 or 3 actions) offers the variants. |
| Retrieving Hook (2) | Success: pulled 5 feet toward the caster. Failure: pulled to the nearest empty space adjacent to the caster. Critical failure: the same pull, and Off-Guard for 1 round. The target line's unattended object is the GM's; the module targets creatures. |
| Antlion Trap (4, still unresolved for other reasons) | Its critical failure ("As failure, and …") now carries the failure's pull. |

## Rules

- **The action count (`src/compiler/action-versions.js`):** a variant with a fixed action count settles "If you cast the N-action version, you …" clauses. The matching version's clause becomes the row's own sentence, and any other version's is dropped. A base card with "2 or 3" actions is left as it is.
- **An optional move:**
  - "You can move the target up to N feet; it can choose to fall Prone to avoid moving." is forced movement with `upTo` and `optional` set, and `avoid: "prone"`.
  - The hazard wording is `avoid: "hazard-prone"`.
  - "then knock the target prone" adds Prone.
  - The Prone link inside the refusal isn't a condition the row gives.
- **A pull to the space next to the caster:** "pulled to the nearest empty space adjacent to you" is `{kind: "pull", toAdjacent: true}` with no distance.
- **"As failure, …" and "As success, …" rows** carry the named row's forced movement when they don't state their own.
- **The card:** the save card's GM line names the move and the Prone refusal. Moving the token stays the GM's.

## Tests

789/789 pass. `test/rank-2-batch-4.test.js` is new.

A whole-corpus compile (b257 → b258) changed only Boneshaker, Retrieving Hook and Antlion Trap.

The speed check (`tools/test-cross-family-speed.mjs`) now accepts a recorded spell that resolves through a supported PF2e variant rather than its base card (Boneshaker).

## Coverage

**Census:** **801 enabled**, up from 799. Rank 2: 67 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-4-live-results.json), case `rank2Batch4`, in the `pftest` world. Each cast was a PF2e variant or the spell's own card, with the target confirmed.
- **Boneshaker, 3 actions:**
  - Success: not Prone. The card says the target can be pushed up to 5 feet in any direction and can choose to fall Prone instead.
  - Critical failure: Enfeebled 2 and Prone. The card says up to 25 feet, and "if moved toward a hazard … can fall Prone".
- **Boneshaker, 2 actions:** failure gives Enfeebled 1 and no move line.
- **Retrieving Hook:** the failure's and the critical failure's targets are both "pulled to the nearest empty space adjacent to the caster". Only the critical failure is Off-Guard.
- **Found:** the Foundry session had dropped to the join page again. I rejoined as Gamemaster.
- **Cleanup:** fixtures removed; no combats left.
