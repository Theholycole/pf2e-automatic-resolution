# Rank 2 batch 12 — a creature stuck to the caster

2026-09-30.

| Spell | Now |
| --- | --- |
| Frog Tongue (2) | 2d8 bludgeoning, basic Reflex save. On a failure or critical failure the creature is stuck: Off-Guard for 1 minute, ended by a successful Escape against the spell DC, and a Stuck note. The caster gets a −2 circumstance penalty to checks of spells and actions with the auditory trait while it's stuck. |

## Rules

- **The failing rows:** Off-Guard with the spell's duration and an Escape lifetime; the existing Escape runtime grades Escape checks against the snapshotted spell DC.
- **The Stuck note (the GM's):** the tether ("can't move beyond the reach of your tongue"), severing the tongue (a Strike dealing at least 10 slashing damage; AC equal to the spell DC; it ends the spell) and the caster moving the creature out of reach (it ends the spell).
- **The caster's penalty:** a note Effect with −2 circumstance to `all` checks, predicated on the trait.
  - PF2e gives a spell's traits as `item:trait:auditory` and the acting creature's action traits as `self:action:trait:auditory` (checked in PF2e's source; Demoralize is an auditory action). The predicate is either.
  - It's made only for a creature that failed.
  - It's deleted automatically when that creature's Off-Guard Effect is (on an Escape, or when the spell ends). This new general link is flagged `endsWithEffectUuid` and handled in `persistent-link-runtime.js`.
- The whole stuck rider must be present; a partial text stays a gap.

**Limit:** the Stuck note on the creature stays after an Escape. Its text tells the GM to remove it.

## Tests

808/808 pass. `test/rank-2-batch-12.test.js` is new. It checks:
- the rows, the note and the caster note;
- the rule-shape refusals, the refusal without the Escape lifetime, and a partial text.

A whole-corpus compile (b265 → b266) changed only Frog Tongue.

## Coverage

**Census:** **1042 enabled**, up from 1041. Rank 2: 130 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-12-live-results.json), case `rank2Batch12`, in the `pftest` world.
- **Damage:** the success took 5 and the failure 10, one roll.
- **The success:** no Off-Guard.
- **The failure:** "Frog Tongue: Off-Guard (until Escape)" and the Stuck note. The caster got "Spell Note: Frog Tongue" with a −2 circumstance modifier predicated on either auditory option.
- **Its Off-Guard Effect deleted, as a successful Escape does:** the Off-Guard went, and the caster's note and modifier were removed.
- **PF2e's predicate:** matches an auditory spell and an auditory action; doesn't match a visual one.
- **Cleanup:** fixtures removed; no combats or PFTEST regions left. The probe actor used to inspect Demoralize was deleted.
