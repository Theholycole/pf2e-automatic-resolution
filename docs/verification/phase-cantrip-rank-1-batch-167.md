# Cantrip / rank 1 batch 167 — rule sets (note-only before)

2026-09-28.

| Spell | Now |
| --- | --- |
| Unfetter Eidolon | The eidolon's toggle: +1 status to saves and DCs against grapple/immobilize/restrain; PF2e's Grapple and Reposition meet it automatically |
| Healing Plaster | The caster's plaster (one at a time), used up by Administer First Aid or Treat Wounds; +1 item from 3rd rank |
| Time Sense | A same-turn toggle, +1 status to one precise-timing roll, used up; then 1 hour before it again (not if left unused) |
| Glamorize | The GM's toggle, +1 status to a skill check the alterations help, for the hour |
| Unbroken Panoply | The chosen weapon's Strikes gain nonlethal; its potency is an item bonus to Diplomacy |

## Tests

782/782 pass. A whole-corpus compile (b250 → b251) changed only these 5 spells. Batch-59's Unfetter Eidolon test is updated.

## Coverage

**Census:** **707 enabled**, up from 702.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-167-live-results.json), case `cr1Batch167`, in the `pftest` world.
- **Unfetter Eidolon:**
  - Fortitude +0 with the toggle off, and +1 with it on (DC +1).
  - With the toggle off, a real Grapple against the eidolon had DC +1.
  - Casting on a non-eidolon was refused.
- **Healing Plaster:**
  - Rank 1: no rules. A rank 3 cast replaced it.
  - A Recall Knowledge Medicine check neither got the bonus nor used the plaster. A Treat Wounds check got "Healing Plaster +1" and used it up.
- **Time Sense:**
  - A first cast left unused was removed after 7 seconds, with no immunity.
  - With a second cast, an untoggled Perception roll had no bonus and kept the Effect. The toggled roll had "Time Sense +1", used it up, and left the caster immune.
  - A third cast reported `immune`.
- **Glamorize:** toggled, Deception +1; the Effect lasts 1 hour.
- **Unbroken Panoply:** the wielder's +1 weapon was chosen. Diplomacy +1, and the Strike's traits include nonlethal.
- **Found live:**
  - Grapple's DC is a `fortitude-dc` modifier checked against `action:grapple`, so Unfetter Eidolon has a second rule for it.
  - AdjustStrike needs `definition`.
  - The first run's NPC wielder had no weapon Strikes; the case uses a character.
- **Cleanup:** fixtures and probe actors removed; no combats or regions left.
