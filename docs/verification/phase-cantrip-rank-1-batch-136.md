# Cantrip / rank 1 batch 136 — Metal Merged, Nymph's Token, Traveling Workshop

2026-09-28. This continues the push to 100%. These three were on the Effect + note route.

| Rule | Spell |
| --- | --- |
| PF2e's +4 to the Reflex DC against Disarm on the caster; not dropping the weapon is a GM note | Metal Merged (1) |
| PF2e's +1 Performance and Will Effect on the ally; keeping the token is a GM note; Dismiss as a free action | Nymph's Token (1) |
| PF2e's Crafting and Thievery rank upgrades on the caster; the tools and the 8-hour mode are a GM note | Traveling Workshop (1) |

**Fixed along the way:**
- **Dismiss sentence lost:** a Dismiss sentence with a `@UUID` link was split at the link's dots.
- **Free-action Dismiss:** it was always read as triggered by taking damage. The first live run's dialog read “Use triggered free action (damage-taken)”. It's now an untriggered free action when the sentence gives no trigger, and the validator accepts that.

**Kept strict (tests):** it isn't read with any of these changes:
- +2 instead of +4;
- an added AC bonus;
- Stealth instead of Thievery.

## Coverage

**Census:** **635 enabled**, up from 632.
- The b219 diff changed only these three; one termination changed (Nymph's Token's).
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 746/746 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-136-live-results.json), case `cr1Batch136`, in the `pftest` world, re-run on the final code.
- **Metal Merged:** the caster got the Effect.
- **Nymph's Token:** the ally got the Effect (Will +1), and the caster didn't.
  - The Dismiss dialog read “Use a free action to Dismiss …”; the harness clicked it, and the Effect was removed.
- **Traveling Workshop** (a character caster): Crafting and Thievery went from untrained to trained.
- **Cleanup:** fixtures removed.
