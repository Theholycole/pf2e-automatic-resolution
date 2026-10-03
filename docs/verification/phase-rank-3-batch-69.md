# Rank 3 batch 69 — Mind Reading

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Mind Reading (3) | Will. Every result makes the target immune to this caster's Mind Reading for 1 hour. On a success, failure or critical failure, the module reads PF2e's Intelligence modifiers and whispers to the GM and the caster whether the target's is higher, equal or lower (user decision 2026-10-01: information is whispered). A "Mind read" note holds the surface-thoughts part for the GM to describe: 1 round, or on a critical failure the sustained minute with re-detection on each Sustain. A card reminder covers the critical success's reverse reading. |

## Rules

- **Mind read (`src/compiler/mind-read.js`):**
  - It reads the lead (save, 1-hour immunity to "your" Mind Reading), the four rows, and the sustained duration.
  - It produces notes with `reveal: intelligence-compare (now)` and a per-caster immunity for every result.
- **Reveal, generalized (`scripts/reveal-runtime.js`, `scripts/note-effects.js`):** a new `intelligence-compare` kind, through `compareIntelligence(actor, caster)`.
- **Interpretation:** surface thoughts are the GM's. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-69.test.js` is new. It checks the comparison helper on all three outcomes. Its negative case is another immunity scope (not read).

A whole-corpus compile (b548 → b549) changed only Mind Reading.

## Evidence

[Live evidence](phase-rank-3-batch-69-live-results.json), case `rank3Batch69`, in the `pftest` world (caster Intelligence +0).

| Result | Whispered | Note | Immune to this caster |
| --- | --- | --- | --- |
| Success (Int +5) | higher | 1 round | yes |
| Failure (Int −3) | lower | 1 round | yes |
| Critical failure | equal | 1 minute | yes |
| Critical success | — | — | yes |

A second cast by the same caster found all four immune.

**Cleanup:** fixtures removed.
