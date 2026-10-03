# Rank 2 batch 22 — a penalty while persistent, icy terrain, a save on each Sustain

2026-09-30.

| Spell | Now |
| --- | --- |
| Teeth to Terror (2) | 2d4 mental and 1d4 persistent mental. Success: half the initial damage, no persistent. Failure: full damage, the persistent damage, Frightened 1. Critical failure: the same, Frightened 3. The text says full damage on a critical failure, not double. A note on each creature taking the persistent damage gives −1 circumstance to its Strikes with jaws or teeth, and goes when that persistent damage ends. Heightened (+2): +2d4 / +1d4 and two more targets (PF2e's fixed levels, checked against the text). |
| Rime Slick (2) | When cast: 2d4 cold to each creature in a 15-foot burst (basic Reflex); a critical failure also knocks it Prone. The area stays difficult terrain for 1 minute. The GM gets two notes: picking up an unattended object takes a save or check, and the ice melts under fire. Heightened (5th / 8th): 8d4 / 14d4 (PF2e's fixed levels). |
| Mind Games (2) | The target saves (Will) when cast and each time the spell is Sustained. Failure: Stunned 1. Critical failure: Stunned 2. Critical success: the caster is Stunned 1 and the spell ends. |

## Rules

- **Two-component damage (initial and persistent):**
  - The inline persistent damage may be followed by a comma instead of "damage".
  - A critical failure may say "full damage".
  - The Heightened line may first add targets ("You can target two additional creatures, the mental damage increases by …").
  - PF2e's fixed levels for a "(+N)" entry are accepted only when every level's two formulas are the text's step over the base.
- **A Strike penalty while persistent:** "The target takes a −N circumstance penalty to Strikes with its X or Y while it is taking persistent <type> damage." becomes a note on the rows dealing that persistent damage.
  - It carries a FlatModifier on `strike-attack-roll`, limited to the `item:slug:x` / `item:slug:y` Strikes.
  - It has `whilePersistent`. The runtime removes it when the persistent damage ends, and doesn't create it when no persistent damage landed.
  - The core refuses such a note on a row without that persistent damage.
- **A cast-time area that stays as terrain:**
  - "When you Cast this Spell, you deal … to each creature in the area (basic Reflex save)."
  - "You also create a layer of ice on all surfaces in the area, which become difficult terrain."
  - The two object sentences are GM notes.
  - The critical-failure rider reads "If a creature in the area critically fails its Reflex save and was standing, it also falls Prone."
- **A save on each Sustain:** "The target must attempt a Will save. Each time you Sustain this Spell, the target attempts another Will save." for one sustained creature with no damage. It's the "targets" lingering record: a save when cast and on each Sustain.
- **The caster's row:** "You are Stunned 1 and the spell ends." gives `casterConditions` and `endsSpell`.
  - The save card raises the caster's condition to that value, once for the cast.
  - The Ongoing record ends after a result whose row ends the spell.
  - A clause about the caster with any other wording stays unread.

## Heightened versions

- **Teeth to Terror at 4th:** "4d4 mental + 2d4 persistent mental", with three targets.
- **Rime Slick at 5th:** "8d4 cold".
- **Mind Games:** no Heightened entry.

## Tests

839/839 pass. `test/rank-2-batch-22.test.js` is new. It checks:
- Teeth to Terror's rows, its note and rule, the note's refusals, and a fixed level that isn't the text's step;
- Rime Slick's declaration and exposure rows;
- Mind Games' trigger and caster row, with forged values refused.

`test/lingering-area.test.js` updated its Mind Games test. It used to expect the caster's clause unread. It now expects the caster fields, and that a reworded caster clause stays unread.

A whole-corpus compile (b275 → b276) changed only these three spells.

## Coverage

**Census:** **1060 enabled**, up from 1057. Rank 2: 148 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-22-live-results.json), case `rank2Batch22`, in the `pftest` world.
- **Teeth to Terror at 4th:**
  - Success lost 3 with no persistent damage, no Frightened and no note.
  - Failure lost 6, with 2d4 persistent, Frightened 1 and the note.
  - Critical failure lost 6, with 2d4 persistent, Frightened 3 and the note.
  - Deleting the failure target's persistent damage removed its note.
  - A probe NPC with the note's rule: its Jaws Strike went from +10 to +9; its Claw stayed +10.
- **Rime Slick at 5th:**
  - The region's walk cost is 2, and the two object notes were whispered to the GM.
  - A critical failure took 8d4 doubled (52) and is Prone.
  - Ending the spell removed the region.
- **Mind Games:**
  - Failure when cast: Stunned 1.
  - In combat, the Sustain prepared another save. Before Finalize, the card showed "Caster stunned 1, the spell ends".
  - On a critical success the caster is Stunned 1 and the record ended.
- **Cleanup:** fixtures, combats and regions removed.
