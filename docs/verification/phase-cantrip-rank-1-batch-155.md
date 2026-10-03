# Cantrip / rank 1 batch 155 — Pact Broker and Savor the Sting (scope)

2026-09-28. User decision (the text over PF2e's data).

| Spell | PF2e | Now |
| --- | --- | --- |
| Pact Broker | −1/−2 to all the creature's attack and damage rolls | Only against the caster and the caster's allies (their signatures). The hex ending early is still a note |
| Savor the Sting | The caster's mark Effect never ends | Removed when the target's persistent mental damage ends |

## Tests

767/767 pass, including `hasPersistentOf` and the structured plan fields.

## Coverage

**Census:** **655 enabled** (unchanged).
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-155-live-results.json), case `cr1Batch155`, in the `pftest` world.
- **Pact Broker (failure):**
  - The foe's Effect predicate names the caster and the caster's ally, not the foe.
  - A PF2e modifier with that predicate is enabled against the caster's signature and disabled against another creature's.
- **Savor the Sting (failure):** the target had persistent damage and the caster had the mark. Deleting the persistent damage removed the mark.
- **Cleanup:** fixtures removed, and no combats left.
