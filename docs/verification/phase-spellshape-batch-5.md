# Spellshape batch 5: family A, area, range and origin

2026-10-05. Feats and wands that change a spell's area, range or origin, and wands for any spell.

- **The area:** each shape's rule ("Add 5 feet to the radius of a burst that normally has a radius of at least 10 feet"; Growth Spell's "for lines, expand the length by 15 feet") grows the spell's own area at the cast rank. The size is kept on the cast (`shaping.area`), and the cast's template is enlarged to it as it's placed. It is never shrunk, so a template PF2e already enlarged is left as it is.
- **Range and origin:** read and left to the table; the module doesn't measure ranges.
- **Reach of the Dead:** the caster's thrall within 60 feet is destroyed as the spell is cast.
- **Touch Focus:** Prone on a hit.
- **Requirements added:** "has a range"; "with 1 or more targets and a range farther than touch"; "with an emanation area"; an area list joined by "and does not have a duration"; Spiritual Expansion Spell's other use (an emanation with a duration).
- **Wands for any spell:**
  - Equipment wands such as Wand of Reaching hold no spell in PF2e. Posting the wand's card arms it for the next spell, like a feat's card.
  - Wand of Widening's PF2e toggle counts when it's on for the cast, and is switched off after.
  - The spell must be of the wand's rank and meet its Craft Requirements' limits.
- **Feats:** Requirements, Frequency and Trigger lines are preconditions, not unread rules. An action link ("@UUID[…]{Cast a Spell}") reads as its name.

| Feat or wand | Now |
| --- | --- |
| Widen Spell, Spiritual Expansion Spell | Bursts of 10 feet or more +5; cones and lines of 15 feet or less +5, longer +10. Spiritual Expansion also allows an emanation with a duration (+5). |
| Growth Spell | A non-cantrip area spell: bursts +5, cones +10, lines +15. |
| Wand of Widening | The same as Widen Spell, for a spell of the wand's rank. |
| Reach Spell, Wand of Reaching | Read; the range is the table's. |
| Familiar Conduit, Natural Conduit, Seneschal Spell, In Tune | Read; the origin is the table's. |
| Reach of the Dead | The thrall is destroyed. |
| Touch Focus | Prone on a hit (PF2e's +2 to the attack). |

## Tests

`test/spellshape-batch-5.test.js` is new. Coverage: 28 of 131 feats and 12 of 49 wand kinds read.

## Evidence

[Live evidence](phase-spellshape-batch-5-live-results.json), case `spellshapeBatch5`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Widen Spell (selector) on Fireball; templates at 20 and 25 feet | 20 → 25; both 25; the selector off |
| Growth Spell (card) on Lightning Bolt; a 120-foot line | 135 |
| Spiritual Expansion Spell on Fireball | 20 → 25 |
| Wand of Widening (held, its toggle) on 1st-rank Breathe Fire; a 15-foot cone | 20; the toggle off |
| Wand of Reaching (card) on Fear (1st), Fireball (3rd) | Applies; "it isn't cast at rank 1" |
| Reach Spell, Familiar Conduit, Seneschal Spell | Read, no GM note |
| Reach of the Dead with a thrall 2 squares away | The thrall destroyed |
| Touch Focus on Holy Light: a hit, a miss | Prone; not |
