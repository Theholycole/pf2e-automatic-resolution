# Rank 2 batch 73 — Sea Surge

2026-10-01. Follows the Gust of Wind pattern: the GM confirms a condition PF2e can't see ("If the creature was Swimming"). It needed no new user decision.

| Spell | Now |
| --- | --- |
| Sea Surge (2) | The GM places the wave's 60-foot path (a line, widened to the wall's width). The Large or smaller creatures in it make a Fortitude degree save; Huge ones aren't eligible. A failure is Prone. A critical failure takes 3d6 bludgeoning, is pushed 20 feet away from the caster (the GM moves the token, as with the module's other pushes), and is knocked Prone. For each creature the GM answers whether it was Swimming; if so, a failure becomes a critical failure. A second card moves the wave on at the start of the caster's next turn: the GM places its next path, and the creatures in it save the same way, once. Fires and objects are a GM note. |

## Rules

- **`wave-surge.js` (new pre-pass):**
  - It reads the four sentences and the three rows exactly (one sentence of narration allowed; no Critical Success row, which is taken as unaffected).
  - It compiles to the ordinary degree save on a 60-foot line, with:
    - the size limit;
    - the `gm-confirmed` degree adjustment (Swimming);
    - the surroundings reminder;
    - `waveRepeat`.
- **`basic-save-core.js`:** `waveRepeat` needs its distance and the compiled sentence.
- **`basic-save-runtime.js`:**
  - `start` posts the wave card (not for the second leg).
  - `waveRepeat` places the path (or takes a region in tests), finds the creatures in it, and starts the same save without another card.

## Tests

940/940 pass. `test/rank-2-batch-73.test.js` is new. It checks:
- the plan, and that a forged sentence is refused;
- that a changed condition, distance or damage isn't read.

A whole-corpus compile (b328 → b329) changed only Sea Surge.

## Coverage

**Census:** **1150 enabled**, up from 1149. Rank 2: 236 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-73-live-results.json), case `rank2Batch73`, in the `pftest` world.
- **Eligibility:** the Medium creatures were eligible; the Huge one wasn't.
- **The walker:** failed (not Swimming). It is Prone with no damage.
- **The swimmer:** its own roll failed; Swimming was answered yes, which made it a critical failure. It is Prone, lost 7 HP, and the card says it's pushed 20 feet away from the caster.
- **The wave moved on:** its new path held one creature, which got the save. No third card was posted.
- **Cleanup:** fixtures removed.

## Note

A first run overrode the swimmer's degree on the card, which (as designed) bypasses the adjustment. The case now lets the swimmer's own roll stand.
