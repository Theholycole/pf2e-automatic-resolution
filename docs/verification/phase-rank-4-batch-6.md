# Rank 4 batch 6 — Mercurial Stride, Chroma Leach

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Mercurial Stride (4) | The card reminds the caster of the Stride (passing through one creature's space, not ending a turn there); the GM targets the creature passed through, which saves. **Success:** Sickened 1. **Failure:** Sickened 2 and the row's (@item.level+2)d6 poison. **Critical failure:** Sickened 2 and double those dice. The item's 6d6 poison is that failure damage restated, so it isn't rolled again. |
| Chroma Leach (4) | As before for Enfeebled and Drained, and the gnome −2 question. **Failure:** adds a 1-round "Listless" note Effect whose check link carries the spell DC (`@Check[will\|dc:N\|traits:mental,emotion]`) for each move action it tries; this replaces a wrongly compiled immediate secondary save. **Critical failure:** Enfeebled 2 and Drained 2 with no end (it was 1 minute), the Listless note, and a "Permanent" note (no lessening with rest; magic such as Sound Body removes them). |

## Rules

- **Caster movement (`compile-ability.js`, core reminder whitelist, `strike-prelude-runtime.js`):** "You … Stride up to …" with "During this movement, you can pass through one creature's space …" and "Passing through a creature's space in this way exposes it to …, with a X save." becomes a `caster-movement` reminder. The sentences are claimed from the preamble.
- **Restated item damage (`compile-ability.js`):** an item component whose dice equal a row's inline damage at the spell's rank, growing by the item's heightened step, is the rows' damage. The shared roll is dropped, with evidence. It's checked at the next interval too.
- **Move-action save (`compile-ability.js`):** the Listless note (with `spellDC`); "permanently X N and Y N (although magic such as … can remove these conditions)" means unlimited conditions plus a note.
- **Note DC (`note-effects.js`):** `spellDC` replaces `{dc}` with the cast's DC when the Effect is made. It's validated, and refused without a DC.

## Tests

1017 + 2 = 1019 pass. `test/rank-4-batch-6.test.js` is new, with a negative case: an inline damage that doesn't restate the item's keeps the shared damage and the block.

The whole-corpus compiles (b371 → b372 → b373) changed only Mercurial Stride, then Chroma Leach.

## Evidence

[Live evidence](phase-rank-4-batch-6-live-results.json), case `rank4Batch6`, in the `pftest` world.
- **Mercurial Stride:** the failure was Sickened 2 and lost 27 (6d6); the reminder was on the card.
- **Chroma Leach:**
  - The failure was Enfeebled 2 and Drained 1, with the Listless note (1 round) reading `@Check[will|dc:25|traits:mental,emotion]`.
  - The critical failure was Enfeebled 2 (unlimited) and Drained 2, with the Permanent and Listless notes.
- **Run note:** the first run didn't answer Chroma Leach's gnome question before rolling (refused, as designed); the case now answers it.
- **Cleanup:** fixtures removed.
