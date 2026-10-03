# Rank 5 batch 19 — Wronged Monk's Wrath

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Wronged Monk's Wrath (5) | Each action count's PF2e variant casts with its own numbers: 1 action is a 5-foot emanation, 2d6 force and 2d12 electricity; 2 actions is 10-foot, 3d6 and 3d12; 3 actions is 20-foot, 4d6 and 4d12. There is one Reflex save. Failure: full damage and Deafened 1 round. Critical failure: double damage, 2d12 persistent electricity and Deafened 1 minute. Heightened steps follow the text. |

## Rules

- **Two damage types by action count (`action-paragraphs.js` `selectTwoTypeActionSentences`):** the text has these parts:
  - "…, dealing NdA X damage and MdB Y damage to creatures in the area.";
  - "If you use 2/3 actions to cast the spell, increase the size of the emanation to F feet and the damage to … X damage and … Y damage.";
  - the run-on rider paragraph "Each creature attempts one basic Reflex save … On a failed save, the creature is C for N rounds; on a critical failure, the creature also takes @Damage[…persistent…] damage and is c for M minutes.";
  - "Heightened (+2) The X damage increases by … and the Y damage by …, or … and … if you use 2 or 3 actions".

  This is rewritten for the cast variant as the basic save's four rows plus the riders, and the variant's data must agree with the text. The save is then non-basic, since the rows state it.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-19.test.js` is new and covers all three variants. Its negative case is a variant whose data disagrees with the text.

A whole-corpus compile (b450 → b451) changed no base plan; this spell's three variant plans now resolve.

## Evidence

[Live evidence](phase-rank-5-batch-19-live-results.json), case `rank5Batch19`, in the `pftest` world: the 2-action variant at 7th rank.
- The area is a 10-foot emanation, the save is Reflex, and the damage is 5d6 force + 5d12 electricity = 49.

| Result | Damage taken | Deafened | Persistent electricity |
| --- | --- | --- | --- |
| Failure | 49 | 1 round | none |
| Critical failure | 98 | 1 minute | 2d12 |

**Cleanup:** fixtures removed.
