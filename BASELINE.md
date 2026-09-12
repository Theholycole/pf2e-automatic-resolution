# PF2e Automatic Spell Resolution — Behavioral Baseline

## Compatibility contract

- Foundry Virtual Tabletop: **v14**
- Pathfinder Second Edition system: **8.5.0**
- Macro version: **8.40**
- Baseline date: **2026-09-11**
- Baseline macro: `PF2e AUTOMATIC SPELL RESOLUTION Macro.txt`
- Baseline macro SHA-256: `796836765569b5b17e8b5a856de2b063d5dbb33c4bac6d019aa02254ae8fa5ba`
- Macro size: **508,813 bytes**
- Official-content snapshot: `/home/theholycole/Documents/ChatGPT/pf2e`
- Official-content JSON files: **29,674**
- Official-content aggregate SHA-256: `0c2d5a5a66359bb04147d4b83069f2b10b49e782f4a7ccd23ecd7ff69e91c4e4`

The aggregate content hash is calculated by sorting every JSON pathname, hashing
each file, and hashing the resulting ordered list. It identifies the supplied
PF2e 8.5.0 content snapshot; it is not an upstream release checksum.

## Freeze policy

The v8.40 macro is the immutable reference implementation. New module work must
not edit it. A changed macro checksum means the baseline was modified and must
be investigated before comparing behavior.

Critical fixes discovered during characterization are implemented in the new
module branch of the code, accompanied by a regression fixture. They do not
silently alter the reference file.

## Intended interaction contract

1. Detect a source use or rules trigger automatically.
2. Present a reminder or resolution control before rolling.
3. Use PF2e's native roll dialog so participants can add relevant modifiers.
4. Treat the result as provisional and accept native rerolls.
5. Replace the provisional outcome when a valid reroll occurs.
6. Apply damage and effects only after GM confirmation.
7. Do not automatically reverse an already-applied result unless a future
   transaction ledger can prove that reversal is safe.

Zero-input resolution is appropriate only when the rules require no decision or
reaction window.

## Known behavioral evidence

`Chain lightning Test.txt` records a successful Foundry v14 / PF2e 8.5.0 run of
the ordered-chain path. The recorded behavior includes:

- Embedded spell-card recognition at rank 6 and DC 40.
- Four ordered Reflex saves.
- Immediate chain stopping on a critical success.
- One shared 8d12 electricity roll.
- Correct basic-save multipliers for the preceding targets.
- Resolution-cycle reset when the master card is deleted.
- Cast removal when the original card is deleted.

## Characterization matrix

The following behaviors require live Foundry fixtures before the module can be
declared behaviorally equivalent to v8.40:

| Area | Required representative fixture |
| --- | --- |
| Basic save | Shared damage, all four degrees, IWR |
| Non-basic save | Per-degree damage and conditions |
| Condition-only | Valued and unvalued conditions |
| Reroll | Before application and after application |
| Heightening | Interval and fixed-rank changes |
| Sustained | Multiple targets and end-of-cast cleanup |
| Timed effects | Caster-anchored and target-anchored expiry |
| Ongoing save | Turn-end recovery and terminal state |
| Secondary save | Success and failure branches |
| Random table | Shared selection and per-creature choice |
| Multi-save trigger | Crossing and temporary immunity |
| Spell flow | Chain, arrival/departure, movement, recurring area |
| Source forms | Prepared spell, spontaneous spell, scroll, wand |
| Eligibility | Spell immunity and target predicates |
| Target mode | Conditional damage, substitution, and healing |
| Cast-wide result | Kill ledger, backlash, and caster temporary HP |
| Recovery | Browser reload and interrupted application |

## Baseline verification

Run:

```bash
sha256sum "PF2e AUTOMATIC SPELL RESOLUTION Macro.txt"
```

The result must equal the macro checksum recorded above.

