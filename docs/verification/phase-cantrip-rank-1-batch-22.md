# Cantrip / rank 1 batch 22 — Stabilize, passive counteracting, items

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “The target loses the Dying condition, though it remains Unconscious at 0 Hit Points.” (Target `1 dying creature`): a **Stabilize** button. It removes Dying, raises Wounded by 1 (PF2e's rule for losing Dying) and keeps the creature Unconscious. A target that isn't dying is refused | Stabilize (cantrip) |
| Being counteracted by another effect (“it's erased only if it's counteracted by an effect similar to dispel magic”) is how the spell ends, not a counteract it makes | Cinder Scribe (1): a spell note. Also Bracing Tendrils (3), Seize Soul (9) |
| On an object target: “You restore 5 Hit Points per spell rank to the target, potentially removing the Broken condition if this repairs it past the item's Broken Threshold.” is the item's, and the GM's to update | Mending (1): a spell note |
| An instantaneous spell note's card now shows the spell's rules (at the cast rank), since no Effect holds them | all instantaneous spell notes |

**Kept strict (tests):**
- An extra rule after Stabilize's sentence (healing), or another Target, isn't read.
- A counteract the spell makes (“You can attempt to counteract …”) keeps it off the note route.
- Restoring a creature's Hit Points isn't an item's.

## Coverage

**Census:** **503 enabled**, up from 502. Note only: 365 non-ritual.
- The b105 corpus diff against b104 changed exactly the five spells named above.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 555/555 tests pass (`test/cantrip-rank-1-batch-22.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-22-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch22`:
- **Stabilize:**
  - A healthy target was refused (“isn't dying”).
  - The dying one (Dying 2, 0 HP) lost Dying, stayed Unconscious at 0 HP, and had Wounded 1.
- **Mending:** the card read “You repair the target item. You restore 5 Hit Points per spell rank to the target, …”.

**Regressions:** `cr1Batch8` (instantaneous-note card) and `cr1Batch14` passed, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b105
python3 tools/build-phase-spell-batches.py /tmp/phase23-b105/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch22`, then `cleanup`.
