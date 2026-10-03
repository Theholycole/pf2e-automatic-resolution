# Rank 3 batch 92 — Martyr's Intervention

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Martyr's Intervention (3) | A reaction after the damage that took the target to 0 Hit Points. The target is back at 1 Hit Point (no longer dying or unconscious from it). The rest of the damage, the part beyond what took it to 1, is dealt to the caster as dealt (no immunities, weaknesses or resistances). Both become Wounded 1, or one more if already wounded. A caster who is wounded can't cast it (the requirement). |

## Rules

- **Martyr redirect (`src/compiler/damage-reactions.js`, a note family):**
  - It reads the trigger and requirement, the 1-Hit-Point sentence, the redirect and the wounding.
  - Narration saying it saves the target's life isn't a rule.
- **Runtime (effect kind `martyr-redirect`):**
  - **The amounts:** the target's last damage (the raw amount the module records), and the Hit Points it had (what PF2e's latest damage message for it took off). The caster takes the raw amount minus (those Hit Points − 1).
  - **The target:** dying and unconscious are removed, and it's set to 1 Hit Point.
  - **Wounded:** both creatures' wounded value is raised.

## Interpretation

"All remaining damage … is instead dealt to you": the damage as the target took it (after its IWR). The caster's own immunities, weaknesses and resistances don't apply, as with Protector's Sacrifice.

## Tests

`test/rank-3-batch-92.test.js` is new. It covers the kind's data, and a different Hit Point floor (not read).

A whole-corpus compile (b613 → b614) changed only Martyr's Intervention.

## Evidence

[Live evidence](phase-rank-3-batch-92-live-results.json), case `rank3Batch92`, in the `pftest` world.

| Step | Result |
| --- | --- |
| A 20-Hit-Point ally takes 30 | The reaction: the ally at 1, the caster loses 11, both Wounded 1 |
| The caster, still wounded, again | Refused |
| Unwounded, on the ally (now Wounded 1) again | The ally at 1 and Wounded 2 |

**Cleanup:** fixtures removed.
