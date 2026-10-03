# Rank 4 batch 97 — Personal Runewell

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Personal Runewell (4) | A placed 15-foot cylinder for the minute. The caster and allies inside hold PF2e's Spell Effect (spell damage + the spell's rank, status) while inside; the runewell's own bolts aren't amplified. When an enemy casts a spell inside, the GM uses the Ongoing control: that opens its basic Reflex card against the bolts, PF2e's 4d6 force (+1d6 a rank). A recast ends the previous runewell; the caster can Dismiss it. The amplification's "no duration" limit is a note. |

## Rules

- **Runewell (`src/compiler/runewell.js`):**
  - It reads the area paragraph, the two options, the recast and Dismiss sentence, the heightening and the PFS note.
  - It writes the lingering declaration: placed cylinder, recast ends, Dismiss, the allies' member Effect (`notOwnSpell`), the GM action for an enemy's spell, and the note.
- **Member Effect for allies (extended):**
  - It may be PF2e's FlatModifier on spell damage of `@spell.rank`, with this spell's sentence.
  - In a placed area the caster holds it only while inside.
  - `notOwnSpell` adds a predicate excluding the area's own spell (PF2e's `item:id` option), so the bolts aren't amplified.
- **Interpretation:**
  - The caster's choice per spell: allies' spells are amplified, enemies' are punished (the GM's control).
  - PF2e's Effect amplifies any spell damage; the "doesn't have a duration" limit is the GM's (a note).
  - Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-97.test.js` is new. It covers the declaration, the exposure plan, another Effect value (refused), and another ally rule (not read).

A whole-corpus compile (b591 → b592) changed only Personal Runewell.

## Evidence

[Live evidence](phase-rank-4-batch-97-live-results.json), case `rank4Batch97`, in the `pftest` world, at 4th rank (caster level 7).

| Step | Result |
| --- | --- |
| Start | the caster inside holds the Effect; the enemy inside doesn't |
| The GM: the enemy cast a spell; failure | 4d6 force = 14, lost 14 (not amplified) |
| The caster leaves the cylinder | its Effect removed |

**Cleanup:** fixtures and region removed.
