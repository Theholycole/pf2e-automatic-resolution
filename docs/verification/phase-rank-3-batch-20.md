# Rank 3 batch 20 — Gleaming Pet, Hydraulic Torrent, Localized Quake

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Gleaming Pet (3) | A lingering record on the targeted companion. Each creature within 5 feet of it (not the companion) saves as its own turn starts (the GM reviews, as with other lingering areas). **Failure:** Dazzled 1 round. **Critical failure:** Blinded 1 round. **Critical success:** immune for 10 minutes. |
| Hydraulic Torrent (4) | Basic Fortitude save against 8d6 bludgeoning. The GM pushes creatures 5 feet on a failure and 10 on a critical failure; unattended objects automatically failing is a reminder. |
| Localized Quake (4) | The caster chooses a 15-foot emanation or cone (the card says so). The GM confirms each target is standing on solid ground. Basic Reflex save against 4d6 bludgeoning, and Prone on a failure. |

## Rules

- **Adjacent-creature saves (`lingering-area-compiler.js`, core, `ongoing-families.js`):** "Any creature that begins its turn adjacent to the target must attempt a X save." gives the lingering centre `targets` with `aura: {feet: 5}`. Membership is the tokens within 5 feet of the target, excluding the target. Core accepts only that aura with turn-start events.
- **Targets:** "your companion or eidolon" is the caster's pick, like "your companion".
- **Row immunity:** "The creature is unaffected and is immune for N minutes." is the row's temporary immunity.
- **Knockback rider (`basic-degree-rider.js`):** "The X deals NdN T damage." / "Each creature in the area must attempt a basic X save; unattended objects automatically fail." / "Creatures and objects that fail are also knocked back N feet (M feet on a critical failure)." is a push by degree plus an `object-push` reminder.
- **Area choice (`area-choice.js`):** "Choose whether the spell's area is a N-foot X or a N-foot Y when you cast it." (no item area) is the caster's choice.
- **Solid ground:** "Each creature in the area standing on solid ground takes …" is a GM-confirmed eligibility (before this, the qualifier would have been dropped).

## Tests

1019 + 3 = 1022 pass. `test/rank-3-batch-20.test.js` is new, with negative cases:
- a forged 30-foot aura;
- an extra Prone in the knockback sentence.

A whole-corpus compile (b373 → b374) changed these three. It also changed four plans whose target is "your companion or eidolon": Rapid Adaptation, Thundering Dominance, Burning Trail and Envenom Companion. Their target constraint is now complete, but none of them became executable or lost executability.

## Evidence

[Live evidence](phase-rank-3-batch-20-live-results.json), case `rank3Batch20`, in the `pftest` world. It passed on the first run.
- **Gleaming Pet:**
  - Nothing happened at the cast.
  - The adjacent creature was exposed as its turn started; its failure gave Dazzled.
  - Neither the far creature nor the companion itself was exposed on their turns.
- **Hydraulic Torrent:** the 5- and 10-foot push reminders and the objects reminder appeared.
- **Localized Quake:** one solid-ground question; the failure was Prone; the area choice was on the card.
- **Cleanup:** the combat and fixtures were removed.
