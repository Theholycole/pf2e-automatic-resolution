# Generalized basic-save degree riders — verification

2026-09-25. This batch adds a degree-phrase grammar for basic-save riders on top of the positional condition-list parser. It composes riders with GM-confirmed creature-state eligibility and hardens the simple basic-save gate. The original fixed-prefix rider compiler still runs first, so the eight earlier rider spells keep identical plans. No spell-name or ID dispatch was added.

## Coverage

New shared-save routes (2):

- **Torturous Trauma:** basic Fortitude; bludgeoning damage equal to 1d4 plus the spellcasting modifier. A critical failure adds Fatigued until the start of the caster's next turn. Living targets only, and the GM confirms per target that the creature has internal organs.
- **Vomit Swarm:** basic Reflex; a failure or critical failure adds Sickened 1, with native Retch recovery. “Once the spell ends, the swarm disappears” is flavor for this instantaneous spell.

The [family audit](../../reports/phase-spell-batches/degree-rider-family-audit.md) covers **45 basic saves with failure or critical-failure condition text; 10 are executable**. The rest stay blocked by their own rules:
- **Radiant Beam:** counteracting darkness.
- **Fungal Exhalation:** the ambiguous “immune to this effect”.
- **Haunting Hymn:** its hearing clause, per the earlier caution.
- **Pain of Ages:** timed unvalued Stunned.
- **Redistribute Potential:** area-dependent conditions.
- **Localized Quake and Rime Slick:** standing-on-ground requirements.
- **Rainbow's End:** lifecycle.
- **Rip the Spirit and Disorienting Flash:** action variants.
- **Unfolding Wind Crash:** caster movement.

## Grammar

- **Degree phrases:** “On a critical failure,” and “On a failure / failed save / failed saving throw,”; “If <subject> (critically) fails[ the save],”; “A/Any creature that (critically) fails its/the/this save/saving throw”; “(Additionally,) creatures that (critically) fail[ the save]”. Plain “fails” means failure and critical failure; “critically fails” means critical failure only.
- **Sentence shape:** after the phrase, an optional subject and “also/additionally” lead into exactly one coordinated grant run, with its own positional lifetimes, followed by the sentence end.
- **Alternatives:** “, or X on a critical failure” replaces the failure grant for critical failures.
- **Prone:** “also falls prone” keeps Prone's proven unlinked predicate.
- **Rejected text:** any other text rejects the sentence, including “from numbness if…”, “as it reels…”, “and is pushed 5 feet”, “and was standing”, and an alternative attached to a critical-failure phrase.
- **Remainder:** the rest of the description (minus a compiled GM-confirmed immunity sentence) must still pass the simple basic-save gate.

## Safety corrections to the simple gate

The gate that admits remainder text now rejects:
- Caster movement (“jump”).
- Creature-eligibility words (“unaffected”, “lack”).
- Plain condition grants: become, gain, receive or lose, and any unlinked PF2e condition name.

Unfolding Wind Crash's “You jump up to 120 feet…” and a test edit's “Victims become slowed 1.” had passed the old gate. No enabled route changed.

## Evidence

**236/236 automated tests pass.** The new `test/basic-degree-rider.test.js` covers degree mapping, alternatives, rejection of unaccounted text, both spells, a detached copy, and the gate hardening. Two older tests were updated because their assumptions changed:
- A second exact rider now composes (clumsy plus prone) instead of blocking.
- Torturous Trauma's organ rule now compiles to a GM confirmation instead of a gap.

The corpus delta changes exactly two plans. Every family regression passes: Speed, event-lifetime, recurring, damage-derived, self-help and degree-rider. The census gives **214 enabled nonritual routes** and **83 executable shared-save plans**; the primary worklists are Phase 2: 136 / 435 and Phase 3: 31 / 593.

[Live evidence](phase-2-3-rider-live-results.json) on Foundry 14.367 / PF2e 8.5.0:
- **Torturous Trauma:** damage of 0 / 2 / 4 / 8 by degree, Fatigued on the critical failure only (a rounds Effect expiring at turn start), and a creature confirmed as having no organs left unaffected.
- **Vomit Swarm:** Sickened 0 / 0 / 1 / 1 with damage of 0 / 6 / 12 / 24, and the panel offered native Retch recovery.

Fixtures were removed after export.

## Reproduction

Same pipeline as earlier batches, using `/tmp/phase23-b5`, plus `node tools/report-rule-family.mjs degree-riders … reports/phase-spell-batches/degree-rider-family-baseline.json`. Live: `tools/phase23-rider-verification.mjs` cases `environment`, `torturousTrauma`, `vomitSwarm`, `cleanup`.
