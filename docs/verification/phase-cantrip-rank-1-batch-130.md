# Cantrip / rank 1 batch 130 — Invoke True Name

2026-09-28. The user took the recommendations: option (A).

| Rule | Spell |
| --- | --- |
| A new `spell-mark` route: one Effect on the target until the end of the current turn. It has Off-Guard (−2 circumstance AC) and −2 circumstance to saves, both only against the caster's spells, and weakness equal to double the rank to the caster's spell damage, removed after the first such damage. Knowing the true name is a GM reminder | Invoke True Name (cantrip) |

**Kept strict (tests):** it isn't read with any of these changes:
- a status penalty;
- weakness equal to the rank;
- an added condition;
- “against all attacks”.

## PF2e roll options (probed live before building)

I tried each predicate on throwaway `pftest` actors with Electric Arc and Ignition:
- **AC and save FlatModifiers:** `origin:signature:<caster>` with `item:type:spell` applied, dropping AC from 20 to 18 for the caster's spell attack. `origin:item:type:spell` never matched.
- **A plain Weakness `predicate`:** it's tested when the actor's data is prepared, so it never applied (weaknesses list empty).
- **A `custom` Weakness:** with `definition: ["item:type:spell", "self:signature:<caster>"]` it applied to the caster's spell damage (9 → 16 with weakness 7). The `origin:signature` form didn't.
- **Removal:** PF2e's `damage-taken` message carries those options, so the removal hook keys on it.

## Coverage

**Census:** **611 enabled**, up from 610.
- The b213 corpus diff against b212 changed only Invoke True Name.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 740/740 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-130-live-results.json), case `cr1Batch130`, in the `pftest` world. The spell was cast at rank 1 (weakness 2).
- **The caster's Ignition attack:** against DC 18 (AC 20 − 2).
- **Saves:** the Reflex save against the caster's Electric Arc had the −2 enabled; a plain Reflex save had it disabled.
- **First Electric Arc** (failure): total 4, 6 lost (weakness 2). The Effect then had only its two FlatModifiers.
- **Second Electric Arc:** total 6, 6 lost (no weakness).
- **Cleanup:** fixtures removed.
