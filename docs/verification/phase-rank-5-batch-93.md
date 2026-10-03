# Rank 5 batch 93 — Dance of Darkness

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Dance of Darkness (5) | **The caster's Performance check** against the standard DC for its level sets the time: 1 minute on a critical success, 2 rounds on a success, otherwise 1 round. An unlisted critical failure counts as the failure, by PF2e's rule. **The 10-foot burst** is a region at the caster's position when pressed (the Stride's start or end; the GM moves the token), made dark like the linked Darkness spell. It uses that spell's own compiled darkness and notes at the cast rank, as an Ongoing area for that time. |

## Rules

- **`src/compiler/dance-darkness.js`:** reads every sentence and row.
- **Runtime:**
  - **New kind `dance-darkness`:** compiles the linked spell for its darkness.
  - **The DC:** `levelDC` from `check-helpers`.

## Interpretation

- **"Works the same way as … Darkness of the same rank"** reuses the module's Darkness: the same region behavior and the same notes, including the heightened ones from rank 4.

## Tests

`test/rank-5-batch-93.test.js` is new. It covers the data and an unrecognised clause (not read).

A whole-corpus compile (b702 → b703) changed only Dance of Darkness.

## Evidence

[Live evidence](phase-rank-5-batch-93-live-results.json), case `rank5Batch93`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 5th by a level 9 caster | DC 26; a critical failure: 1 round; 10-foot region fully dark (mode 0, modifier 1); Darkness's 3 notes including the rank 4 Concealed one |

**Cleanup:** fixtures and the area removed.
