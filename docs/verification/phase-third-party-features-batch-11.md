# Third-party features batch 11: more passive features and their Effects

2026-10-07. The eleventh batch of the "+" modules' entries that build on spells ([audit](../planning/third-party-features-audit.md)), in the cast-rider family.

## What changed

- **Steady Spellcasting+** (Magus+; it shares PF2e's `steady-spellcasting-magus` slug): the casting-rules card now reads the DC from the feat's text. This version's is 10; PF2e's is still 15.
  - "If you cast a non-cantrip spell that was disrupted by a reaction, you do not expend the focus point or spell slot": when the check fails, the spell is lost and its slot (or Focus Point) is given back.
- **Effect: Comfort of Struggle** (Oracles+), from its text:
  - The module's value, max(cursebound, 3), is never below 3. Now the Effect's level is set to the oracle's cursebound value as the Effect is made, and the bonus or penalty is that level, between 1 and 3.
  - Both are removed after the roll ("the next …").
- **Effect: Scholar's Lore** (Wizards+): the −1 to saves and AC now applies only against the origin's spells (the module's applied to anyone's).
  - The feat's passive rider removes the Effect from the creatures the caster's next spell card reached ("against the next spell you cast").
- **Passive riders:**
  - **Cloaked Casting**: a single enemy that is Off-Guard gets −1 circumstance to its save against the spell, for that save only. The attack bonus is the module's rule.
  - **Extended Cloaking**: for each Off-Guard enemy of a slot spell, a reminder Effect on the caster: Concealed to it for the spell's rank in rounds.
  - **Monstrous Familiar**: a battle form from a slot can be put on the caster's familiar (asked). The module's Effect (temporary Hit Points, 4 × level) goes on it too.
- **Slot-Charged Spell** (Wizards+, an action without the spellshape trait): one prepared slot is asked for and expended, and the spell is heightened by half that slot's rank (at least 1), up to the highest rank.
  - The "+" spellshape reader now also reads actions that shape the next cast without the trait.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is still 227 of 227.

## Census

| Family | Batch 10 | Batch 11 |
| --- | --- | --- |
| cast-rider | 3 / 66 | 9 / 66 |
| spell-modifier | 0 / 201 | 1 / 201 |

## Tests

`test/third-party-features-batch-11.test.js` (3). All 1,815 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-11-live-results.json), case `thirdPartyFeaturesBatch11`. It also re-ran `spellFeaturesBatch3` (PF2e's Steady Spellcasting, Stupefied, Communal Healing, Counterspell), which still passes.

| Step | Result |
| --- | --- |
| Steady Spellcasting+, Fireball at 3 from a slot | Card DC 10; on a failed check, the spell lost and the rank-3 slot back (2 → 3) |
| Comfort of Struggle's Effect at Cursebound 2 | Level 2; rules min(3, max(1, level)), removed after the roll |
| Scholar's Lore's Effect on the foe, Fear at 1 | The save −1; the Effect gone after the card |
| Cloaked Casting, Fear at 2 on an Off-Guard foe | The save −1 circumstance; gone after the card |
| Extended Cloaking, the same | The concealment reminder for 2 rounds |
| Monstrous Familiar, Animal Form (ape) at 2 | The form and the module's Effect (40 temporary Hit Points) on the familiar; none on the caster |
| Slot-Charged Spell, Fear at 1 (highest 5), the rank-4 slot | Fear at 3; the slot expended |
