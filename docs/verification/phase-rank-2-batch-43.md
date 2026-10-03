# Rank 2 batch 43 — the eidolon as the caster's twin

2026-10-01. Follows the user's decision of 2026-10-01: an Effect + note spell counts once the module covers what PF2e's Effect doesn't.

| Spell | Now |
| --- | --- |
| Summoner's Visage (2) | PF2e's Effect on the targeted eidolon (others are refused): its Impersonate toggle, +4 status to Deception to Impersonate the caster, and its level added while untrained. The module adds two rules PF2e's Effect lacks, read from the caster when cast. If the caster is humanoid, the eidolon gains the humanoid trait and the caster's ancestry traits (a creature with no ancestry item gives its own creature traits). It also takes the caster's size (the twin; its larger size's reach goes with it). At 4th it lasts 1 hour. The purely cosmetic change, the gear rules and Dismiss are the note. |

## Rules

- **`effect-note-proof.js`:** readers for the Impersonate sentence (the toggle and its two modifiers) and for the traits and size sentences (added rules).
- **`caster-resolved-rules.js` (new):** `casterResolvedRules` resolves `@caster:form-traits` and `@caster:size` (dropping the traits rule for a caster who isn't humanoid). `effect-runtime.js` uses it before adding the rules.

## Tests

887/887 pass. `test/rank-2-batch-43.test.js` is new. It checks:
- the proof and the resolved rules (an elf and a dragon caster);
- that a changed bonus isn't proved.

A whole-corpus compile (b296 → b297) changed only Summoner's Visage.

## Coverage

**Census:** **1118 enabled**, up from 1117. Rank 2: 204 of 245.

## Evidence

[Live evidence](phase-rank-2-batch-43-live-results.json), case `rank2Batch43`, in the `pftest` world (a small elf caster at 4th; run again after the resolver moved to its own module).
- A target without the eidolon trait was refused.
- The large eidolon got the Effect for 1 hour: FlatModifier ×2, RollOption, ActorTraits and CreatureSize.
- Its traits gained elf and humanoid, and its size became small.
- Deleting the Effect restored its traits and large size.
