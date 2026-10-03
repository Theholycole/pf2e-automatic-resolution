# Rank 5 batch 4 — Domora's Defense, Spiral of Horrors, Unfolding Wind Buffet, Foul Miasma, Flames of Ego

2026-10-02. Part of the user's ranks 3–5 pass. Ranks 4 and 5, numbered in the rank-5 series.

| Spell | Now |
| --- | --- |
| Domora's Defense (5) | Each target gets PF2e's Effect (+1 circumstance to AC, fire resistance 5). The story opening is narration. The replica's Shield Block, Hardness and dissipation are notes on the Effect. |
| Spiral of Horrors (4) | PF2e's aura Effect on the caster: enemies in it get PF2e's Frightened 1, which holds while they're inside. |
| Unfolding Wind Buffet (5, focus) | The card asks whether one of the three unarmed Strikes hit; "no" means no save. Each row's push is the GM's reminder: half, normal or double "5 feet for each normal hit plus 10 feet for each critical hit". The critical failure is also Prone. |
| Foul Miasma (4, focus) | **Critical success:** a GM reminder to apply a successful save to its lowest-level disease in Pseudo Afflictions (afflictions are handed to that module). The failure rows were already GM notes. |
| Flames of Ego (5) | **Success:** Fascinated 1 round. **Failure / critical failure:** Fascinated 1 minute. Each row also gets a note Effect as long, carrying a TokenLight rule (bright 20, dim 60) and the show-off requirement (1 or 2 actions), plus "can't act hostile until …" on the failure rows. |

## Rules

- **Leading narration (`effect-note-proof.js`):** a run of rule-free sentences from the start is narration, not only sentences 1–3.
- **New Effect-note readers:**
  - "When you Cast this Spell, …, granting them a +N bonus to AC and X resistance N."
  - "Enemies in the area are Frightened N and can't reduce their frightened value below N …" (PF2e's enemy aura with the fear trait).
  - Domora's replica sentences are notes.
- **Strike-hit push (`compile-ability.js`, `basic-save-core.js`, `basic-save-runtime.js`):**
  - The text "Make two/three unarmed Strikes against the same target." / "If at least one was a successful hit, … pushed back N feet for each normal hit …, plus N feet for each critical hit." becomes a cast question.
  - Rows "half the / the / double the normal distance" become a push with `perHit`, validated against the cast question. The card states the per-hit distance and multiple.
- **Affliction save benefit:** "The target receives the benefit of a successful save against the lowest-level disease/poison/curse affecting it." is an `affliction-benefit` GM row note (whitelisted in core).
- **Flames of Ego shape (`compile-ability.js`):** the glow-and-fascination row family. Note Effects may now carry a `TokenLight` rule (`note-effects.js` validation, at most bright 120 and dim 240).

## Tests

1000 + 5 pass. `test/rank-5-batch-4.test.js` is new, with negative cases:
- a rule word in the story run;
- wrong resistance;
- wrong floor;
- an extra row clause;
- a forged note source.

A whole-corpus compile (b365 → b366) changed only these five.

## Evidence

[Live evidence](phase-rank-5-batch-4-live-results.json), case `rank5Batch4`, in the `pftest` world. It passed on the first run.
- **Domora's Defense:** +1 AC and fire resistance 5 on two allies.
- **Spiral of Horrors:** the aura Effect is on the caster.
- **Unfolding Wind Buffet:** Finalize was refused until the hit question was answered. The reminders said half and double; the critical failure was Prone.
- **Foul Miasma:** the critical-success reminder appeared on the card.
- **Flames of Ego:** the success was Fascinated with a 1-round note and its token had bright light 20; the failure was Fascinated for 1 minute, with the hostility line.
- **Cleanup:** fixtures removed.
