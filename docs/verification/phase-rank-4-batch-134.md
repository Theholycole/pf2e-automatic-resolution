# Rank 4 batch 134 — Umbral Graft

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Umbral Graft (4) | **Casting it** ends the spells the caster stole with a previous graft. **The caster's Effect** lasts 3 rounds, with the card's Steal; one attempt can be part of the cast. **The Steal** is PF2e's Thievery check against the foe's Perception DC; the foe must be within reach. **On a success**, a random spell Effect on the foe whose spell has a target entry. A critical success takes it automatically at the graft's rank or lower; a success, below it. Otherwise the caster's counteract check against that spell's DC decides. **The stolen spell** leaves the foe and either affects the caster or is stored, with a transfer button for a willing creature. It lasts its remaining time, at most 1 minute, and gains the shadow trait. Only one steal per graft. |

## Rules

- **`src/compiler/spell-steal.js`:** reads every sentence; the excluded innate spells and the GM's discretion are notes.
- **Runtime:**
  - **New kind `spell-steal`:** ends the previous grafts' stolen spells, then creates the caster's Effect and the card.
  - **`spellStealAttempt` / `spellStealTransfer`** (API and card buttons `spell-steal`, `spell-transfer`).

## Interpretation

- **"A spell affecting the foe"** is a PF2e Effect on it whose origin item is a spell with a non-empty target; its rank is the Effect's level.
- **The counteract check** uses PF2e's counteract rank table (critical success: up to 3 ranks higher; success: 1 higher; failure: lower).
- **The choice** (affect me or store) is a dialog when the button is used.

## Tests

`test/rank-4-batch-134.test.js` is new. It covers the data and an unrecognised clause (not read).

A whole-corpus compile (b673 → b674) changed only Umbral Graft.

## Evidence

[Live evidence](phase-rank-4-batch-134-live-results.json), case `rank4Batch134`, in the `pftest` world, cast at 4th rank.

| Step | Result |
| --- | --- |
| Steal a rank-3 Heroism (Thievery critical success) | It leaves the foe; the caster holds it for 1 minute with the shadow trait |
| A second Steal | Refused |
| A recast | The stolen Heroism ends |
| Steal a rank-6 Heroism (counteract critical success), stored | The stored Effect and its transfer card |
| Transfer to an ally | The ally holds Heroism (rank 6); the stored Effect is gone |

**Cleanup:** fixtures removed.
