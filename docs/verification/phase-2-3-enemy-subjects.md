# Enemy-only subjects — verification

2026-09-25. This adds a shared actor predicate, `enemy-of-caster`, used by one-time area saves and by lingering areas. There's no spell-name dispatch.

## Rule

PF2e 8.5 defines enemies by alliance (`isEnemyOf`: both alliances set and different). The module follows that, with one addition for neutral creatures:
- **The caster:** never an enemy.
- **Same alliance as the caster:** an ally, so unaffected.
- **Different alliance:** an enemy, so affected.
- **No alliance on either side (neutral):** eligible, but the save card asks the GM “Is this creature an enemy of the caster?” before Finalize. The answer is combined with any other GM question into a single confirmation.

The caster's UUID and alliance are captured when the saves are prepared (`casterUuid`, `casterAlliance` in the card's target constraints), so a later alliance change doesn't rewrite an open card.

## Compiler

**One-time area saves:**
- **Description recipients** (`target-predicate-compiler.js`, no Target field):
  - “(each/all/every) (living) enemy/enemies in the <area>, (takes … damage and) must attempt … save”;
  - “damage to (all/each/your) (living) enemies in the <area>”, followed by `,` `.` `;` `(` “with” or “depending”.

  A description that also names creatures in the area as recipients is ambiguous and gets no enemy rule. A qualifier after the area (“all enemies within the area other than dragons”) doesn't match, so that spell keeps its own gap. “Living enemies” adds the living-creature rule too.
- **Target field:** `enemies in (the) area`, `enemies in the emanation/aura`.

**Lingering areas:**
- **Basic subject:** “A/Any/Each/An enemy that …”, and “You deal … to each enemy that …”.
- **Degree triggers:** “each enemy”, “an enemy that's in the area when …”, “each enemy in the area” at cast or Sustain. These set `lingering.enemiesOnly` and add the predicate to the plan, so each exposure's save card applies it.
- **Consistency check:** `isExecutableLingeringPlan` refuses an `enemiesOnly` plan without the predicate.
- **Damage-first trigger:** a degree trigger may now deal damage first (“… takes 1d4 mental damage and must attempt a Will save.”). The dice and type must be the spell's single damage entry, which the degree table scales. A degree trigger in a spell with a damage entry but no damage in the trigger is refused.

## Runtime

- `validateActorTarget` evaluates the predicate.
- Lingering membership leaves out the caster and the caster's allies (`isAllyOf`), so they never get exposure reviews. Neutral creatures are reviewed, and their card asks the GM.

## Effect on official spells

**Enabled routes now restricted to enemies (correctness):** Blinding Beauty, Divine Wrath, Entreat the Many, Shatter Mind, Shock and Awe, Synaptic Pulse. Before, they applied to every creature the user targeted, allies included.

**Other plans that gain the rule but stay blocked by their own gaps:**
- Wails of the Damned and Vampiric Revelry (with the living-creature rule);
- Divine Decree and Ordained Purpose;
- Bane, Infectious Melody, Consuming Darkness and Sepulchral Mask (these four no longer report `target-eligibility`).

**New routes:** none. Every official enemy-only lingering area still has a rule of its own:
- **Consuming Darkness:** the area grows on Sustain; a Speed penalty while inside.
- **Sepulchral Mask:** a caster Effect and a penalty.
- **Shadow Army:** a condition chosen at casting.
- **Shadow Raid:** a damage-type and save-type choice.
- **Infinitesimal Collapse Field:** “the first time”, plus conditions while in the area.
- **Nymph's Grace:** no degree table.

**Census:** 284 enabled (unchanged). 5 plans changed and no route was lost; all family regressions show 0.

## Evidence

**Automated:** 284/284 tests pass. New tests cover:
- the predicate's four cases (caster, ally, enemy, neutral);
- Shatter Mind, Synaptic Pulse and Divine Wrath carrying the rule and staying executable;
- enemy-only lingering areas, both degree and basic;
- a plan without the predicate being refused;
- a guide example, with a qualified variant that gets no rule.

[Live evidence](phase-2-3-enemy-subjects-live-results.json) on Foundry 14.367 / PF2e 8.5.0:
- **Shatter Mind**, cast by a party caster at itself, a party ally, an opposition foe and a neutral creature:
  - the caster was unaffected (“the caster isn't an enemy”);
  - the ally was unaffected (“an ally of the caster, not an enemy”);
  - the foe was affected with no question;
  - the neutral creature was affected, with the GM question.
- **Homebrew Thorn Ward** (“Each enemy that enters the area or starts its turn in the area takes 2d10 slashing damage …”): a party ally walking in produced no review, and an opposition foe walking in produced one. Deleting the area ended it.
- **Regressions rerun live:**
  - Breath of Drought, the homebrew Ember Vortex, Petal Storm and Songbird's Call;
  - Entreat the Many's rider matrix (general-rules harness);
  - Synaptic Pulse timed Stunned (rider harness).

**Fixture note:** pftest fixtures are NPCs, which default to the Opposition alliance, casters included. The phase23, rider and general-rules harnesses now put their casters on the Party alliance, so enemy-only spells still reach their targets. All fixtures were cleaned up afterwards.

## Reproduction

Live: `tools/phase23-affliction-verification.mjs` case `enemies`, then `cleanup`.
