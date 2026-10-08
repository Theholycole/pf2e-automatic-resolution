# Spell features batch 3: casting rules

2026-10-05, from the spell features audit (`docs/planning/spell-features-audit.md`).

`scripts/casting-rules-runtime.js` runs when a spell is cast:

- **Stupefied:** the caster rolls the DC 5 + value flat check. On a failure the spell is lost: the cast is marked, and every resolution card for it (saves, Effects, lingering areas, immediate and stored-trigger spells) refuses to run.
- **Steady Spellcasting:** a card on the caster's cast. When the GM marks the spell disrupted, its button rolls the DC 15 flat check; a success keeps the spell.
- **Communal Healing:** when Heal isn't cast with 3 actions, a card heals another willing living creature (the one targeted) for the spell's rank in Hit Points.
- **Counterspell:** each foe on the scene who could counter the spell gets a card (whispered to them and the GM):
  - Counterspell (prepared or spontaneous): the same spell, at the cast rank;
  - Master's Counterspell: any slot of that rank or higher, at –2;
  - Mythic Counterspell: listed with its Mythic Point.

  The button expends the slot and rolls the counteract check (d20 + the entry's spell attack modifier) against the caster's spell DC. If it counters, the spell is lost, as with Stupefied.

## Tests

`test/spell-features-batch-3.test.js` (4): the counteract outcome by degree and rank, and the counterspell options (prepared, Master's, spontaneous).

## Evidence

[Live evidence](phase-spell-features-batch-3-live-results.json), case `spellFeaturesBatch3`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Stupefied 20 caster casts a save spell | Flat check DC 25 failed; the save card refuses: "The spell was lost …" |
| Steady Spellcasting caster, the spell disrupted | Card shown; the flat check rolled and the spell's state matched the result |
| Communal Healing, Heal with 2 actions | Card shown; the targeted ally healed 2 (rank 2) |
| A prepared foe with Counterspell | Offered; the slot expended; the check rolled and the spell's lost state matched the outcome |
