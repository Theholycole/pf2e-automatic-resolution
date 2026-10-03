# Rank 2 batch 35 — a revealed weakness, a caster row Effect, an object's pulse, a GM-triggered area

2026-10-01. Follows the user's decisions of 2026-10-01:
- Information a spell reveals is read from PF2e's data and whispered to the GM and the caster's player at the time the text says.
- What the module can't detect is a GM control.

| Spell | Now |
| --- | --- |
| The Parrot's Whisper (2) | A Will save; each row is a note on the target. The target's highest weakness (all of them on a tie, or "no weaknesses"), from PF2e's data, is whispered to the GM and the caster's owners. On a failure or critical failure it's whispered immediately. On a success it's whispered at the start of the caster's next turn, when the note runs out. The critical failure's one question is a note answered by the GM then. |
| Mental Map (2) | A Will save; the GM can set the result when the target chooses to fail. On a failure or critical failure the caster gets PF2e's Spell Effect: Mental Map for 1 day: a +2 circumstance bonus to Survival and Recall Knowledge, behind its toggle. The critical failure's option to erase the knowledge is a 24-hour note on the target. |
| Metal Reverberation (2) | A sustained lingering area: a 5-foot emanation the caster places on the target object (its space and the adjacent spaces). The creatures in it attempt a basic Fortitude save against 1d12 sonic (+1d12 every 2 ranks) when the spell is cast and on each Sustain. |
| Bralani Referendum (2) | A placed 20-foot burst. When it starts, the caster chooses one condition (one more every 2 ranks) from Clumsy, Drained, Enfeebled or Stupefied. The GM's Ongoing control takes the targeted creatures in the area that inflicted a chosen condition. Each attempts a basic Fortitude save against 2d6 slashing (+2d6 every 2 ranks), once a round. The spell can be Dismissed. |

## Rules

- **Compiler:**
  - The Parrot's Whisper rows become notes with `reveal` (`highest-weakness`, `now` or `expiry`).
  - `caster-row-effect.js` (new): the row sentence against PF2e's toggle and FlatModifier (`check:statistic:<skill>` or Recall Knowledge, 1 day).
  - `object-pulse.js` (new): a target object's "space and all adjacent spaces", when cast and on each Sustain, becomes a placed 5-foot emanation.
  - `gm-trigger-area.js` (new): the lingering area with the `gm-trigger` event and its conditions to choose.
- **`basic-save-core.js`:**
  - Checks `casterRowEffect` (the Effect's bonus exactly).
  - The lingering check accepts the `gm-trigger` event (once a round, placed, conditions from the stated list).
- **`note-effects.js`:** validates `reveal`; a reveal at expiry needs a fixed note.
- **Runtime:**
  - `reveal-runtime.js` (new) whispers the highest weakness.
  - The basic-save runtime reveals "now" when the note is made, and applies the caster's Effect at Finalize.
  - The Ongoing runtime reveals when the note expires, or when PF2e has already removed it on the caster's turn.
  - `startLingering` places the plan's area for a spell without one, and asks for the chosen conditions (`options.chosenConditions`).
  - The `gm-trigger` request and control.

## Tests

876/876 pass. `test/rank-2-batch-35.test.js` is new. It checks:
- the reveals and the highest-weakness reading;
- the caster Effect, and that a forged bonus is refused;
- the object's area;
- the GM trigger, and that a missing once-a-round rule is refused.

A whole-corpus compile (b288 → b289) changed only these four spells.

## Coverage

**Census:** **1102 enabled**, up from 1098. Rank 2: 188 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-35-live-results.json), case `rank2Batch35`, in the `pftest` world.
- **The Parrot's Whisper:** both targets have fire 5 and cold 3.
  - The failure target's "highest weakness: fire 5" was whispered (to the GM) at the cast.
  - The success target's was whispered when the caster's next turn began, and its note was gone.
- **Mental Map:**
  - The success gave the caster no Effect.
  - The critical failure gave Spell Effect: Mental Map (1 day, RollOption + FlatModifier) and the target's 24-hour note.
- **Metal Reverberation:**
  - At the cast one creature was asked; it failed: "1d12 sonic" (2 lost).
  - On the caster's Sustain it was asked again.
  - Ending the spell worked.
- **Bralani Referendum:**
  - Two chosen conditions at 2nd were refused. Enfeebled was chosen, and nothing was asked at the cast.
  - The control added the creature inside and refused the one outside ("not in the area"). The failure took "2d6 slashing" (4 lost).
  - A second trigger in the same round was refused.
- **Cleanup:** fixtures, combats and regions removed.

## Note

The first run timed out in the browser tool; the case was started again in the background and its result read when it finished.
