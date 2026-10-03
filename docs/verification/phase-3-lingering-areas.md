# Lingering damage areas — verification

2026-09-25. This is a new shared workflow for basic-save spells whose area persists and damages creatures that enter it, or start or end their turns in it. No spell-name or ID dispatch was added. The older per-spell Floating Flame and aura adapters are unchanged.

## Compiler (`src/compiler/lingering-area-compiler.js`)

**Accepts:**
- a basic save;
- one structured damage entry;
- a burst, cylinder (placed) or emanation (around the caster);
- an `N rounds/minutes` duration, fixed or sustained.

**Every sentence must be one of:**
- **A trigger with its damage:** “A/Any/Each creature (other than you) that enters the <area> / starts|begins its turn in the <area> / ends its turn in the <area> … takes XdY TYPE damage (basic X save)”. The damage may instead be a following “It takes …” sentence. The form “You deal XdY TYPE damage to each creature that …” also works. Dice, type and save must match the item.
- **An initial exposure:** “inside the <area> when it's created / when you Cast the Spell”.
- **A once-per-round limit.**
- **An end-of-duration narration** (“… fall harmlessly …”).
- **Concealment:** “All creatures within the <area> become concealed, and all creatures outside the <area> become concealed to creatures within it.” The area name may be up to four words (“the area of whirling birds”).
- **One opening narration sentence.**

**Anything else blocks the route:** other concealment wording, Mist, moving areas, “breathing”, anything extra Sustain does, disbelief, riders.

Triggers also accept “enters or ends its turn in …”, and the damage sentence may end with a short “as …” clause (“… as the birds peck at it.”).

**Core:** `isExecutableLingeringPlan` validates the declaration and checks that each exposure's save (`lingeringExposurePlan`) is an ordinary executable basic save. `inspectSavePlan` refuses lingering plans, so they never run as a one-time save.

## Runtime (`OngoingFamilies.startLingering`, kind `lingering`)

- **Casting:** “Place Lingering Area” (or “Start Lingering Emanation”) places PF2e's template as a region and records the cast in the Ongoing journal. The region is an entry, so ending the spell removes it. Creatures already inside are members, not “entering” (unless the spell has an initial exposure).
- **Membership:**
  - A placed area tests each token's document centre with `RegionDocument.testPoint`. The document centre is used because token-update reconciles run before the canvas animation ends.
  - An emanation measures from the token documents: squares between the nearest occupied squares, with PF2e's 5-10-5 diagonals (`scripts/token-distance.js`). Canvas token objects aren't used, because they lag behind the documents and sit at (0,0) when the scene isn't rendered. The same helper now serves the custom aura and the ally-area Effect route.
- **Triggers:** “enter” is a token newly inside on a token-update reconcile. Turn start and turn end come from combat turn advances (the actor whose turn starts, or the previous actor whose turn ended).
- **Once per round:** enforced per actor and round, across pending reviews and damage already taken.
- **Exposures:** each becomes a GM review in the Ongoing panel (Affected / Unaffected). A confirmed exposure prepares a normal basic-save card with the cast's DC.
- **Ending:** the spell ends at its maximum duration, or immediately when its region is deleted.
- **Concealment:** every creature inside (and the caster, for an emanation) gets an Effect “<spell>: inside (concealed)”. It grants PF2e's Concealed condition and adds an attack-roll note (creatures outside are concealed to it, DC 5 flat check). PF2e 8.5 doesn't roll concealment flat checks, so the table does. Effects are added and removed as membership changes, and ending the spell removes them all. They're stored as a list of `{actorUuid, effectUuid}`, because Foundry expands dotted flag keys, so a map keyed by UUID would be mangled.
- **Sustain:** a sustained area adds a Sustain obligation on each of the caster's combat turns after the cast round. Combat starting on the caster's turn counts, for spells cast before initiative. Combat start also counts as a turn start for “starts its turn in the area” exposure. The Sustain action only keeps the spell going. If the caster's turn ends unsustained, the spell ends (`missed-sustain`).

## Coverage

**New routes (3):**
- **Acid Storm:** start of turn.
- **Petal Storm:** enter or start of turn, once per round.
- **Songbird's Call:** sustained 15-foot emanation; enter or end of turn, excluding the caster; concealment inside.

**Refused with reasons (tested):**
- **Toxic Cloud:** Mist, a moving area, breathing.
- **Rust Cloud:** concealment, growth.
- **Frozen Fog:** Mist, a moving area, a rider.
- **Visions of Danger:** disbelief.

## Evidence

**Automated:** 272/272 tests pass. The new `test/lingering-area.test.js` covers compilation, the refusal as a one-time save, the exposure plan, blocked variants and mismatched dice. The homebrew guide has a lingering-area section, and its example is covered by a test.

**Regressions:** all regressions show 0.

**Census:** **282 enabled**.

[Live evidence](phase-3-lingering-area-live-results.json) on Foundry 14.367 / PF2e 8.5.0:
- **Membership at cast:** Petal Storm's region was placed, and only the creature inside was a member.
- **Start of turn:** starting combat and advancing to that creature's turn flagged a turn-start exposure.
- **Entering:** a creature moving in was flagged as entering. The first creature stepping out and back in that round wasn't flagged again.
- **GM review:** the GM confirmed the entering creature (save card, failure, 16 damage) and declined the other (no damage).
- **Ending:** deleting the region ended the spell.
- **Real UI path:** Acid Storm's card showed “Place Lingering Area”. The template was placed with the mouse, the cast became active, and deleting its region ended it.

Two fixes came out of the live runs:
- The membership test now uses the token document's centre, because reconciles ran mid-animation.
- The wait for token movement is now capped, after a movement promise never settled and left a cast stuck in “creating”.

## Concealment and sustained areas (follow-up batch)

**Automated:** 275/275 tests pass. New tests cover:
- Songbird's Call compiling to a sustained emanation with concealment, with altered concealment wording blocked;
- document-based distances (adjacent, straight, diagonal 5-10-5, large tokens);
- a guide example (a sustained moth cloud with concealment).

**Corpus:** only Songbird's Call changed. All family regressions (speed, escape, damage-derived, self-help, degree riders, recurring saves, degree adjustments, afflictions) show 0. **283 enabled.**

[Live evidence](phase-3-lingering-concealment-live-results.json) comes from two consecutive passing runs:
- **At cast:** the caster and an ally inside the emanation were concealed; an enemy 60 feet away wasn't.
- **Entering:** the enemy moving in got a GM exposure review and concealment.
- **Leaving:** moving back out removed the enemy's concealment.
- **Sustain:** combat started on the caster's turn and requested Sustain. Sustaining cleared it. The next round asked again, and ending that turn unsustained ended the spell (`missed-sustain`).
- **Ending:** no token on the scene kept a concealment Effect for the cast.

**Regressions rerun live:** Petal Storm lingering, duration-bound buffs, reaction buffs, the custom aura, and Floating Flame with Bless in combat.

**Fixes found live:**
- Emanation membership used canvas `distanceTo`, whose token objects were stale (0,0) while the scene wasn't rendered. It now uses the documents.
- Concealment was kept in a map keyed by actor UUID, which Foundry expanded into nested objects. The map was never found, so Effects were recreated on every reconcile. It's now a list.
- Sustain wasn't requested when combat started on the caster's turn, but the missed-Sustain check still ended the spell.

Stale Effects from the two runs before the list fix were removed. The harness cleanup now sweeps orphaned concealment Effects.

The `reactionBuffs` harness case no longer includes Practice Makes Perfect, which is intentionally refused (unlimited Effect).

## Degree-save areas and Sustain exposure (follow-up batch)

This batch targeted Phase 3's largest families: Sustain (153 spells) and area exposure (84). About 40 unresolved spells open with “Each creature in the area when the spell is cast or that ends its turn in the area must attempt a … save”, and about 47 repeat their effect “when you Cast the Spell and the first time you Sustain it each round”. Most carry bespoke extra rules (enemies only, living creatures only, moving or growing areas, different Sustain damage, choices), so the shared grammar enables few official spells today. Every one of those spells now fails only on its own extra rules.

**Compiler (`compileLingeringSaveTriggers`, `lingeringTriggerEvents`):**
- **Degree-save areas:** the one preamble sentence ending “must attempt a Fortitude/Reflex/Will save” is split into event phrases: in the area when cast, enters, starts or begins its turn, ends its turn, and cast plus first Sustain each round. The phrases are removed, and the remainder must be a bare subject (“each creature”, “any creature that”, “each round that a creature”). Any qualifier leaves residue and refuses the area. The degree table compiles as usual, and the claimed sentence is passed to the preamble checker, so no other preamble rule is waived. A save only at casting stays an ordinary area save.
- **Basic Sustain damage:** “When you Cast the Spell and the first time you Sustain it each round, each creature in the area takes XdY TYPE damage (basic X save).” gives `events: ['sustain']` plus exposure at casting. The spell must be sustained, and the dice must match the damage entry.
- **Durations:** a sustained spell with no maximum lasts up to 10 minutes; “sustained up to 1 minute” is also read.
- **GM-confirmed immunity:** “Creatures whose bodies contain no significant moisture (such as …) are immune to <spell>.”
- **“Objects are unaffected.”** is accepted, because saves are only for creatures.

**Runtime:**
- `lingeringExposurePlan` drops the Sustain controller as well as the duration, so a degree table runs as an ordinary save card for each exposure.
- The first Sustain each round of a spell with a `sustain` event queues a GM exposure review for every creature inside at that moment. The Sustain button reminds the GM to move the area first when the spell allows it.
- A degree save with no damage counts as an exposure whatever the result; before, exposures were forgotten when no damage was taken.

**Safety fixes found while auditing:**
- **Caster-subject clauses:** an outcome clause whose subject is the caster (“You are Stunned 1 and the spell ends”) was compiled as a condition on the target. Mind Games' critical success is the known case. Such clauses are now residual. It affected 2 disabled spells (Mind Games, Animus Mine), and no enabled route changed.
- **Stagnate Time:** “Any creature that begins its turn in the area must attempt a Will save” ran as a single save at casting, because the preamble checker knew “starts its turn” but not “begins its turn”. Both are now recognised. Stagnate Time moved from the shared save route to the lingering route with a turn-start exposure. This is recorded in `docs/planning/withdrawn-routes.json` as a move, not a loss.

**Coverage:**
- **Breath of Drought (new):** exposure at casting and at the end of each turn; a degree table (Sickened 1 or 2); water and plant creatures use the outcome one degree worse; the GM confirms the moisture immunity.
- **Stagnate Time:** now resolved as a lingering area.
- **Refused, with reasons:** Gluttonous Growth (“unless it's already grabbed”), Tear the Veil (living creatures only), Circle of Weakness (weakness and a damage-type choice), Entrancing Eyes (immune to this casting, focus action), Grasping Earth (Sustain damage to grabbed creatures), Scouring Sand, Ring of Truth, Undertow and Whispers of a Dead Goddess (own rules). Entangling Flora, Sea of Thought and Oneiric Mire write their outcomes as prose, with no degree table. Animated Assault deals different damage on Sustain.

**Evidence:**
- **Tests:** 281/281. New tests cover Breath of Drought, Stagnate Time, qualified subjects and cast-only saves being refused, the caster-subject clause, a homebrew Sustain area, and two guide examples.
- **Corpus:** 36 plans changed; the only route change is Stagnate Time moving from save to ongoing. All family regressions show 0. **284 enabled.**

[Live evidence](phase-3-lingering-degree-sustain-live-results.json):

**Breath of Drought** (placed area):
- Both creatures inside at casting were flagged.
- The GM confirmed the moisture question, and real saves were rolled. The human failed (Sickened 1). The plant creature failed and the spell's rule made it a critical failure (Sickened 2).
- In combat, the caster sustained, and the human ending its turn inside was flagged again.
- Deleting the area ended the spell.

**Homebrew Ember Vortex** (Sustain damage):
- Only the creature inside was flagged at casting.
- A creature walking in wasn't flagged, because entering isn't a trigger for this spell.
- The first Sustain flagged both creatures inside. A second Sustain in the same round added nothing.
- The confirmed exposure dealt damage, and ending the spell worked.

**Regressions:** Petal Storm and Songbird's Call passed. Fixtures, encounters and concealment Effects were all cleaned up (0 left).

Stagnate Time wasn't cast live; its turn-start exposure uses the path verified by Petal Storm, and its degree save uses the path verified by Breath of Drought.

## Different damage on Sustain (follow-up batch)

**Compiler:** a basic lingering area can pair a cast sentence with a Sustain sentence:
- **Cast sentence:** “This/The <noun> deals XdY TYPE damage (basic X save) to each creature in the area.” The dice and type must match the damage entry.
- **Sustain sentence:** “On subsequent rounds, the first time each round you Sustain this Spell, it deals @Damage[FORMULA[TYPE]] damage (basic X save) to each creature in the area.”

The Sustain formula must be of the same type and save, and may read only `@item.level` or `@item.rank`. The pair gives `events: ['sustain']`, `initial: true` and `sustainDamage: {formula, type}`. A cast sentence without the Sustain sentence isn't a lingering area. Up to two opening narration sentences are now accepted (still checked for rule words).

**Core:**
- `lingeringExposurePlan(plan, {event: 'sustain'})` gives a basic save whose shared damage is `{mode: 'formula', formula}`. Each degree's shared multiplier points at that single component.
- `isExecutableBasicSavePlan` accepts `formula` shared damage only when the formula ends in a damage type and reads only the cast rank.
- `isExecutableLingeringPlan` also checks the Sustain exposure plan.

**Runtime:**
- The record keeps `sustainExposurePlan`. Sustain exposure reviews carry `event: 'sustain'`, and their save cards use that plan.
- The card rolls the formula once with PF2e's `DamageRoll`, using the spell's roll data at the cast rank. Halving, doubling and application are the ordinary shared-damage path.

**Coverage:** **Animated Assault (new)**. Still blocked by their own rules:
- **Sanguine Mist:** temporary HP for the caster.
- **Seize Identity:** a degree save at casting, then aging with Enfeebled.
- **Lightning Lasso:** only “if the target is still immobilized”.
- **Steal Shadow:** only after a failed save.

**Evidence:**
- **Tests:** 286/286. They cover Animated Assault and both of its exposure plans, and refuse a Sustain formula reading `@actor`, a different damage type on Sustain, and cast damage alone. There's also a guide example.
- **Corpus:** only Animated Assault changed. All family regressions show 0. **285 enabled.**

[Live evidence](phase-3-sustain-damage-live-results.json):
- **Animated Assault cast at rank 4:** the cast exposure rolled the heightened item damage, `4d10 bludgeoning` (32), taken in full on a failure.
- **First Sustain in combat:** it exposed the creature inside, and its card rolled `2d10 bludgeoning` (11 = floor(4/2)d10), doubled to 22 on a critical failure.
- **Ending:** worked.
- **Regressions:** the homebrew Ember Vortex, Breath of Drought, Petal Storm and the enemy-only cases were rerun live.

## Reproduction

Live: `tools/phase23-affliction-verification.mjs` cases `lingering` and `songbird` (each creates its own region or tokens and combat), then `cleanup`. Degree and Sustain areas: cases `drought` and `sustainArea`. Different damage on Sustain: case `sustainDamage`.
