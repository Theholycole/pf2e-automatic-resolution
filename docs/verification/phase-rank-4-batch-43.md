# Rank 4 batch 43 — Tortoise and the Hare

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Tortoise and the Hare (4) | The foe's Fortitude save, targeting one enemy. **Success:** Slowed 1 for 1 round. **Failure:** Slowed 1 for 3 rounds. **Critical failure:** Slowed 1 for 3 minutes. After Finalize, the card offers the other target's grant for the foe's result. The caster targets themself or an ally and grants Quickened (1 round on a failure, 1 minute on a critical failure), with a note: the extra action is only for Step, Stride or Strike. |

## Rules

- **Partner grant (`partner-grant.js` `rewritePartnerGrant`):**
  - It reads the target "1 foe, and either yourself or 1 ally", and "The effects depend on the foe's X save."
  - It reads these row forms: "The targets are unaffected.", "The foe is … , and the other target is unaffected.", and "The foe is … and the other target is [C] for N rounds/minutes. It can use the extra action to …".
  - The foe's parts become an ordinary non-basic save on one enemy. The other target's condition per row (linked by name) becomes `resolution.partnerGrant`.
- **Validator:** the partner grant needs:
  - a non-basic save;
  - stated rows, each with PF2e's condition UUID and a fixed duration;
  - each row's text among the claimed rows.
- **Runtime:**
  - After Finalize, the card shows the grant for the foe's degree.
  - `grantPartner(card, targets)` grants once. It refuses the foe and anyone who is neither the caster nor an ally.
  - It applies PF2e's condition (a condition grant) and the restriction note.
  - It is exposed on the saves API.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-43.test.js` is new. Its negative cases are:
- an unstated grant row (blocked);
- another target line (not read).

A whole-corpus compile (b475 → b477) changed only this spell. (b476 predates a fix to the claimed-row evidence; the reports were rebuilt from b477.)

## Evidence

[Live evidence](phase-rank-4-batch-43-live-results.json), case `rank4Batch43`, in the `pftest` world, cast at 4th rank.

| Foe's result | Foe | Grant to the foe | Grant to an ally | Second grant |
| --- | --- | --- | --- | --- |
| Failure | Slowed 1, 3 rounds | Refused | Quickened, with the note | Refused |
| Success | Slowed 1, 1 round | Nothing to grant | Nothing to grant | — |

**Cleanup:** fixtures removed.
