# Rank 2 batch 63 — Falsify Heat

2026-10-01. Follows the user's decision of 2026-10-01 on disbelief: a Disbelieve control rolls the creature's Perception against the spell DC when the GM says it interacts.

| Spell | Now |
| --- | --- |
| Falsify Heat (2) | The cast asks for the body temperature: one target at 2nd, and from 4th up to 10, each with its own choice. Each target gets a generated Effect for 8 hours. Moderate and Warm each give +2 circumstance to Deception checks to Impersonate, behind a toggle naming what is impersonated (PF2e can't tell). Moderate also carries the GM note that the target is Invisible to heatvision and similar senses (PF2e has no such sense). The cast is a Dismissable Ongoing record. Its control, "the targeted creature touches X (Disbelieve)", rolls the touching creature's Perception against the spell DC and whispers the result to the GM and the caster. The spell goes on for everyone else. |

## Rules

- **`option-veil.js` (new family, kind `option-veil`):**
  - It reads the touch-disbelief, Dismiss and choice sentences, the option list (each a look, ending in its skill bonus on Impersonate, with an optional "Invisible to …" sentence), and the 4th-rank entry.
  - Anything else in the list isn't read.
- **Runtime:**
  - `#executeOptionVeil` makes the choices, the Effects (a RollOption toggle plus a FlatModifier predicated on `action:impersonate` and the toggle) and the Ongoing record (Dismiss).
  - **`touch-disbelieve`:** a control and request. `touchDisbelieve` rolls the toucher's Perception against the spell DC and whispers the result to the GM and the caster's owners.

## Tests

917/917 pass. `test/rank-2-batch-63.test.js` is new. It checks:
- the options, the target tiers and the disbelief;
- that an extra benefit, another trigger for disbelief, or another choice isn't read.

A whole-corpus compile (b318 → b319) changed only Falsify Heat.

## Coverage

**Census:** **1140 enabled**, up from 1139. Rank 2: 226 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-63-live-results.json), case `rank2Batch63`, in the `pftest` world.
- **At 2nd, Moderate on one creature:**
  - "Falsify Heat (Moderate)" for 8 hours, with the heatvision note.
  - No Deception modifier with the toggle off; +2 on Impersonate with it on.
- **Two targets at 2nd:** refused.
- **Dismiss:** the Effect is gone.
- **At 4th, two creatures:** "Falsify Heat (Moderate)" and "Falsify Heat (Warm)".
- **Touch:** the toucher's Perception critically failed. The whisper read "… veil toucher believes the illusion on … veil a", and the spell stayed active.
- **Cleanup:** fixtures removed.
