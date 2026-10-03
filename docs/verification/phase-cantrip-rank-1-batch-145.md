# Cantrip / rank 1 batch 145 — Eat Fire

2026-09-28. This replaces the Effect + note route.

| Rule | Spell |
| --- | --- |
| PF2e's resistance Effect on the caster (1 round kept, with a data note: the text says the current turn). **Belch Smoke** (a card button) places a 5-foot burst within 20 feet, refusing one out of range, and starts a 1-minute lingering area: creatures inside are Concealed. It also ends the spell. Unconscious ends the spell automatically; inhaling or exhaling and a strong wind are GM notes | Eat Fire (cantrip) |

**Kept strict (tests):** it isn't read with any of these changes:
- resistance 10 (the Effect gives 5);
- an added Hidden clause;
- cloud damage;
- a +10 Heightened step;
- a changed ending list.

## Coverage

**Census:** **650 enabled**, up from 649.
- The b228 diff changed only Eat Fire.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 756/756 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-145-live-results.json), case `cr1Batch145`, in the `pftest` world.
- **Cast:** the caster had the Effect and fire resistance 5.
- **Out of range:** a burst centred 40 feet away was refused ("must be within 20 feet (it was 40)"), and nothing started.
- **Belch Smoke:**
  - The cloud started, the Effect ended, and the resistance was gone.
  - The caster and the near creature inside were Concealed; the far creature wasn't.
  - Removing the region ended the area, and both lost Concealed.
- **Unconscious:** a second cast's Effect was deleted when the caster gained Unconscious.
- **Cleanup:** fixtures removed, no combats, and no PFTEST regions left.
