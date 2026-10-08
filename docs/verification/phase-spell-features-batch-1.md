# Spell features batch 1: text-built damage as PF2e spell damage

2026-10-05, from the spell features audit (`docs/planning/spell-features-audit.md`).

The module already rolls a spell's damage and healing through PF2e (`spell.getDamage`), so the caster's spell-damage rules apply. Verified live (`spellFeatureProbe`):

- Fireball with a +5 spell-damage bonus: "{(6d6 + 5)[fire]}";
- Heal with Healing Hands' rule: "1d10 + 5";
- a +2 spell attack bonus.

The exception was damage the module builds from the text, where the PF2e item has none or not that. It rolled its own formula, so those rules were lost:

- the 20 save spells whose shared damage is a text formula (Shadow Blast, Spiritual Weapon, Cinder Swarm, Unsettling Perspective …);
- the Effect runtime's direct text damage (Victory Cry).

`scripts/text-spell-damage.js` now builds that formula as PF2e spell damage:

- **Reading the formula:** `damagePools` splits "{A[type],B[persistent,type]}" into damage entries.
- **Plain dice:** `plainDice` works out each dice count at the cast rank, because PF2e reads plain dice. For example, "(2+floor((@item.rank - 3)/2)*1)d10" at 4th becomes "2d10".
- **The roll:** a copy of the spell with that damage at the cast rank goes through `getDamage`.

A formula it can't read is rolled as before.

## Tests

`test/spell-features-batch-1.test.js` (2).

## Evidence

[Live evidence](phase-spell-features-batch-1-live-results.json), case `spellFeaturesBatch1`, in the `pftest` world. The caster has a +5 spell-damage FlatModifier.

| Step | Result |
| --- | --- |
| Unsettling Perspective (4th), a failure | "{(2d10 + 5)[mental]}", 18 damage |
| Victory Cry (1st) | "1d6 + 5 sonic", 11 damage |
