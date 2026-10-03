# Counteract family (part 2): spells as they're cast, items and wards — verification

2026-09-26. This continues the [counteract family](phase-4-counteract-care.md): counteracts whose target isn't an Effect on a creature. That means a spell being cast (a reaction), a magic item, or a ward on a door or chest.

## Rule

The GM names the thing in the dialog and gives its rank, and its counteract DC unless the counteract is automatic. For a spell, the DC is its caster's spell DC. The card then:
1. rolls the caster's PF2e counteract check, adding any rank bonus the spell states;
2. applies the rank rules;
3. states the spell's own outcome, which the GM carries out, since there's no Foundry document to change.

What the module applies itself:
- the automatic counteract (no roll);
- the counteract rank bonus;
- the Hit Points lost per rank of the triggering spell;
- the artifact rule (fails without a roll).

## Compiler (`affliction-care-compiler.js`)

**Recipients:**
- `the triggering spell`, or no Target with a Trigger naming a spell, becomes `triggering-spell`.
- `1 magic item` becomes `counteract-target` (kinds [item]).
- `one magically sealed or warded doorway or chest` becomes `counteract-target` (kinds [spell]).

**Trigger / Requirements:** these paragraphs are kept as `castingCondition` and shown to the caster.

| Sentence | Plan |
|---|---|
| “You attempt to counteract the triggering spell.” / “Attempt to counteract the target spell.” | counteract `triggering-spell` |
| “You automatically counteract the spell, but the feedback brings you unavoidable harm.” | … `automatic` |
| “You lose 1d8 Hit Points per rank of the triggering spell.” | `lose-hp` (caster, 1d8 per rank) |
| “If the spell would be counteracted, it instead continues with the caster as a target instead of you.” | `counteractOutcome.success` |
| “If the attempt is successful, any creatures … take only half as much damage, but the spell otherwise works as normal.” | `counteractOutcome.success` |
| “Treat <spell>'s counteract rank as 2 higher for this attempt.” | `counteractRankBonus` |
| “<Spell> can't affect spells that aren't targeted (such as area spells).” | `counteractLimit` |
| “You attempt to counteract it.” | counteract `other` |
| “If you succeed, it's deactivated for 1 week.” / “On a critical success, it's destroyed.” | `counteractOutcome` |
| “If it's an artifact or similar item, you automatically fail.” | `artifactFails` |
| “Attempt a counteract check against the target spell or magical effect that wards or seals a doorway or chest, …” | counteract `other` |
| “If you succeed, you recover its energy, restoring one of your expended spell slots of 3rd rank or lower.” + Heightened “You can restore an expended spell slot of 4th rank or lower.” | `restoreSlot` by rank |

Outcome sentences without a matching counteract are refused, and so is a Hit Point loss without a triggering-spell counteract.

`target-predicate-compiler.js` reads `the triggering spell` and a warded doorway or chest as non-creature targets.

## Runtime (`affliction-care-runtime.js`)

- **Dialog:** the triggering spell's name and rank, plus its caster's spell DC unless automatic. For an item or ward: its name, DC and rank, the kind only when both kinds are possible, and the artifact box when the spell has that rule.
- **Operations** share one cast context, so `lose-hp` uses the triggering spell's rank recorded by the counteract.
- **Result card:** the outcome as a “GM to apply” line, and the Trigger and limits as “Caster:” lines.
- **Bug fixes:** the report works with no creature. The caster's token (for self-care) is taken directly from `getActiveTokens(false, true)`, which already returns documents.

## Coverage

**New:**
- **Spell Riposte:** the spell is turned back on its caster. The Trigger and the targeted-only limit are noted.
- **Shadow Siphon:** counteract rank +2; a success halves the damage.
- **Nullify:** automatic, and the caster loses 1d8 HP per rank of the triggering spell.
- **Disjunction:** deactivated on a success, destroyed on a critical success, and artifacts fail.
- **Return To Essence:** the ward ends and a slot of rank 3 or lower is restored (4 at 8th rank, 5 at 9th, 6 at 10th).

**Census:** **358 enabled**, up from 353 (Counteract: 9 of 22).
- The corpus diff against b48 changed exactly these 5 plans.
- Dispel Magic's plan gained only `otherKinds`.
- The speed, escape and six rule-family checks report 0 regressions.

**Still to do in the family:**
- Elemental Counter (losing a slot of the countering element);
- Spell Turning (an hour-long ward used as a reaction);
- Delay Affliction (suspend), Sound Body (suppress at 2 ranks lower) and Luminous Stardust Healing (possession);
- Soothing Ballad (10 targets);
- standing wards (Spell Immunity, Veil of Privacy, Rigid Form, Planar Seal, Truesight);
- Umbral Graft, Seize Soul;
- counteracts inside other routes (Moonlight Ray and others in Phases 2–3).

## Evidence

**Automated:** 393/393 tests pass. `test/counteract-care.test.js` adds:
- each spell's plan, and Return To Essence's slot by rank;
- the order rule (Hit Point loss after the counteract);
- a Shadow Siphon with its counteract sentence removed, which is refused.

[Live evidence](phase-4-counteract-spells-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `counteractSpells` (DC 1 always counteracts, DC 80 never):
- **Spell Riposte:**
  - A critical success against a rank-5 spell said it “continues with its caster as the target instead of you”.
  - DC 80: “not counteracted; it takes effect as normal”.
  - The Trigger and limit were on the card.
- **Shadow Siphon:** the check read “rank 7 including +2 vs 8”, and the success said to halve the damage.
- **Nullify:** with a rank-3 spell, it was counteracted automatically (no roll), and the caster lost 11 HP (3d8 = 11).
- **Disjunction:**
  - A critical success destroyed the staff.
  - In an earlier run, a success (DC 1 with a natural 1) deactivated it for 1 week.
  - An artifact failed without a roll; DC 80 left the ring.
- **Return To Essence:** the ward was counteracted, and a slot of rank 3 or lower was restored (rank 4 or lower when cast at 8th).
- **Dialog:** Nullify's dialog asked only for the triggering spell's name and rank.
- **Regressions:** `counteractCare` and `care` were rerun, and both passed. Cleanup ran.
