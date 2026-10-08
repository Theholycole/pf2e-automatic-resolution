# Pending user decisions (ranks 3–5 pass, from 2026-10-02)

The user is away. Spells that need a decision the existing rules don't settle are set aside here, with the question and options, and
work continues on the others. Interpretations made without asking (where the text settles it) are listed too, for review.

## Questions (spells set aside)

### 1. Temporary HP from one damage type of several (Vampiric Maiden, rank 4)
"This deals 4d4 piercing damage and 4d4 void damage … You gain temporary Hit Points equal to the void damage the target takes (after
applying resistances, weaknesses, and the like)." PF2e's damage receipt gives only the total HP lost; the module's rule is never to re-run
IWR itself. Options:
- **A. Apply the void damage as its own PF2e application** (two applyDamage calls: piercing, then void), so its receipt is exactly the void
  taken. Side effects: two damage messages; an "all damage" resistance applies to each part separately.
- **B. Compute the void share** from the rolled void instance × the degree, then the target's void resistance/weakness/immunity (an
  approximation of PF2e's IWR).
- **C. GM enters the amount** on the card (the module grants what the GM types).

### 2. Temporary HP divided among allies as the caster chooses (Community Restoration, rank 4 reaction)
"You gain 2 temporary Hit Points per rank of the triggering spell, and can grant an equal number divided as you choose among allies affected
by the triggering spell." PF2e's Effect gives the caster their share (rank chosen in its ChoiceSet); the allies' share is a free split. Options:
- **A. An allocation control on the card**: the caster names the triggering spell's allies and types each one's share (must total at most
  2 × rank); the module grants them temporary HP for 1 minute.
- **B. All to one ally** the caster picks (simplest automatic case; the split is a note).
- **C. A note**: the module grants the caster's share; the allies' split is the GM's.

### 3. Half of a creature's resistance (Flame Strike, rank 5)
"Because the flame is infused with divine energy, creatures in the area apply only half their usual fire resistance. Creatures that are immune
to fire, instead of gaining the usual benefit of immunity, treat the results of their saving throws as one degree of success better." PF2e has no
switch for "half resistance", and the module's rule is never to re-run IWR. Options:
- **A. Apply with PF2e's IWR, then deal the difference**: after PF2e applies the damage, the module deals extra fire damage equal to half the
  target's fire resistance (read from the actor), skipping IWR for that top-up. Immune creatures: the degree one better, and the damage
  applied ignoring the immunity.
- **B. Apply ignoring resistance, then let the GM correct**: the module skips fire resistance and immunity entirely and the card tells the GM
  to restore half the resistance.
- **C. A GM reminder**: PF2e's IWR applies unchanged; the card tells the GM the half-resistance and immunity rules.

### 4. Rituals whose outcomes are narrative (Call Spirit, Footholds and Foothills, Loyalty's Ward, and ~20 more at ranks 3–5)
Note-only spells count as resolved (2026-09-30), but note-only rituals don't. Many remaining rank 3–5 milestone rituals have outcomes that are
mostly narrative (a spirit answers questions; terrain reshapes; a ward traps chosen creatures). Options:
- **A. A ritual note card**: the GM confirms the ceremony's degree (ticket 07), and the card posts that degree's text as a note Effect on the
  casters (and the target, where there is one), with any mechanical part automated where it can be. These count as resolved.
- **B. Keep them apart**: only rituals with automated consequences count; narrative ones stay unresolved.

**Status (2026-10-03):** mostly settled without needing the choice. Every in-scope rank 3–5 ritual with text now has its mechanical parts automated through `ritual-degrees` (rank 3 batches 119–125), so it counts as resolved under either option:
- the GM confirms the degree;
- conditions, records, saves, diseases, terrain, wards and controls are applied;
- narrative parts are card notes.

Two in-scope rituals are left: **Mindscape Shift** (rank 3) and **Transmigrate** (rank 4). Their text is empty in PF2e 8.5 (adventure-specific), so there is nothing to automate. The choice still matters for note-only rituals (Bountiful Oasis, Butterfly Bender and others), which stay apart.

## Interpretations made without asking

- Stinking Cloud (rank 3 batch 4): "Sickened 1 and Slowed 1 while in the cloud" ends only the Slowed on leaving — **confirmed by the user 2026-10-02**.
- Sculpt Sound (rank 3 batch 11): Dismissing the spell also ends its critical failure's Stupefied 2 (dismissing ends a spell's effects; as Tether).
- Foul Miasma (rank 5 batch 4): the critical success's "benefit of a successful save against the lowest-level disease" is a GM reminder,
  since afflictions are delegated to Pseudo Afflictions (the module doesn't change their stages from a save card).
- Unfolding Wind Buffet (rank 5 batch 4): the push distance from the Strikes' hits is the GM's reminder (pushes are always GM reminders);
  the card asks only whether one Strike hit.
- Spiral of Horrors (rank 5 batch 4): PF2e's aura grants Frightened 1 to enemies while inside it (PF2e's reading of "can't reduce … below 1
  for the spell's duration").
- Chroma Leach (rank 4 batch 6): the failure's "if the target tries to use a move action, it must succeed at a Will save … or the action is
  lost" is a 1-round note Effect with a clickable check at the spell's DC (the module can't intercept the action). "Permanently enfeebled 2 and
  Drained 2" are unlimited conditions plus a note that they don't lessen with rest.
- Localized Quake (rank 3 batch 20): "standing on solid ground" is the GM's yes/no per target.
- Wordsmith (rank 4 batch 7): "until the next time you Refocus" is a note with no fixed end (the GM removes it when the caster Refocuses).
- Forgotten Lines (rank 4 batch 7): a "varies" duration with nothing timed in the text is instantaneous (the card only).
- Moonlight Ray (rank 3 batch 25): the text gives the extra 5d6 spirit damage to targets with the unholy trait, and its critical row says "double
  spirit damage if a fiend or undead" (older wording). The module applies the extra damage to unholy targets and doubles it on a critical hit.
- Distracting Chatter (rank 3 batch 26): Off-Guard is applied for each row's length; the –2 to purely auditory Perception checks and the DC 5 flat
  checks (its own auditory actions, and auditory effects aimed at it) are in the note on the target for the same length, as the module can't tell
  which checks are auditory.
- Life-Draining Roots (rank 4 batch 11): "1d4 temporary Hit Points for every living creature in the line" counts every living target in the
  line, whatever its save (even a critical success, which takes no damage).
- Heightened durations in weeks or months (rank 3 batch 28): a week is 7 days and a month 30 days (PF2e Effects have no longer unit).
  Travel by Turtle, Oathkeeper's Insignia, Construct Mindscape, Return Beacon and Teleportation Circle use them.
- Travel by Turtle (rank 3 batch 28): the conjured turtle doesn't fight and works as a boat, so it is a note on the caster, not a token.
- Tiny Wings (rank 3 batch 28): the familiar gets PF2e's BaseSpeed fly 20. For a familiar that already flies, the "+15-foot status bonus
  instead" is in the note for the GM.
- Tireless Worker (rank 4 batch 12): the suppression lasts the spell's 1 minute. If the caster stops Sustaining, the GM deletes the
  "suppressed" marker Effect, which restores the condition.
- Font of Serenity (rank 4 batch 14): PF2e's Effect gives +2 from 4th rank (`ternary(gte(@item.level,4),2,1)`), but the text says +1 with
  "Heightened (+4) The bonus increases by 1". The text is applied (a rule override): +1 at 4th–7th, +2 at 8th.
- Conjured Conveyance (rank 3 batch 30): the conjured vehicle is a note on the caster (its statistics are the GM's), as Travel by Turtle.
- Shadow Jump (rank 3 batch 32): at 8th the caster "can become Invisible" on arrival. That is the caster's choice, so it is in the note; the
  module doesn't apply Invisible.
- Isolation (rank 3 batch 33): "Invisible, but only to its allies" isn't applied as PF2e's Invisible, which would hide the target from everyone.
  It's a note on the target for the GM.
- Let Not the Fallen Rest (rank 4 batch 19): "whose Dying value is 2 or less" follows PFS's note: an ally that is unconscious with Dying ≤ 2,
  or conscious with Dying 1–2. A conscious ally without Dying is refused.
- Incarnate spells (rank 5 batch 10): the manifestation's space and Speed are the GM's (a note; the GM places it). Arrive and Depart are
  buttons on the cast's card: the GM targets the creatures each reaches and presses it (Depart at the end of the caster's next turn).
  Incarnate Shadow Minuet's Depart darkness globe is a note (the GM's lighting).
- Fortissimo Composition (rank 4 batch 23): with no creatures targeted, the GM types the DC ("usually the highest Will DC of the
  composition's targets"). The Effect goes to every recipient of the next composition cast within a minute. A critical failure gives no Effect
  and spends the Focus Point; the text has no row for it.
- Retributive Pain (rank 4 batch 24): "the triggering damage" is the caster's last damage taken (PF2e's `damageTaken`), halved and rounded
  down. The module doesn't check which creature dealt it; the caster targets the triggering creature.
- Conjured Clockwork (rank 4 batch 24): the optional expansion is an Ongoing control usable once a round, after that round's Sustain.
- Rouse Skeletons (rank 3 batch 34): "creatures on the ground" is the GM's review. Flying creatures are left out when the targets are
  reviewed. Moving the area is the GM moving the region before the Sustain.
- Untwisting Iron Roots (rank 5 batch 11): the spell has no duration, so the rubble's difficult terrain stays as a region until the GM
  removes it. "You can move through the difficult terrain normally" is a GM note: Foundry's terrain region can't exempt one token.
- Defensive Prescience (rank 3 batch 37): on a critical failure, "if its attack is a failure" is read as a failure or worse. The attack's
  result is the GM's report (an Ongoing control); the misfortune is a RollTwice on the creature's next attack roll, removed after it.
- Incendiary Ashes (rank 3 batch 36): "reduced to ashes" when killed by fire is a GM row note.
- Aromatic Lure (rank 4 batch 25): the compelled movement is a 1-round note (the GM moves the creature toward the square the caster chose).
  The critical failure's 1d4-round stay is rolled when the save resolves and counts from then; the note asks the GM to count it from arrival.
- Envenom Companion (rank 3 batch 38): PF2e's Effect adds the poison to the first unarmed hit when its "first hit" toggle is on. It doesn't check
  piercing or slashing, so a data note asks the player to leave the toggle off for other Strikes. The damaged creature's save is a card button
  the GM uses (targeting that creature).
- Toxic Cloud (rank 5 batch 13): "each breathing creature" is the GM's review (creatures that don't breathe are left out). The drift (10 feet
  away from the caster each round) is the GM moving the region.
- Incendiary Fog (rank 5 batch 13): the ignition (an open flame or fire effect in the cloud) is the GM's control. The GM targets the creatures
  in the cloud; once their saves are resolved, the spell ends.
- Perfected Body (rank 4 batch 32): whether the failed save qualifies (an effect with the morph, poison or polymorph trait, or one that would
  give one of the listed conditions) is the caster's reaction trigger; the module doesn't check it, and a GM reminder says so. On a module save
  card still being resolved, the module corrects the caster's result; otherwise it names PF2e's last failed save (within a minute) and its new
  result for the GM to apply.
- Horizon's Veil (rank 5 batch 15): PF2e's item has no save, so the text's Will save is used (text over data). The −2 to ranged attacks
  passing through the area is a GM note.
- Glimmer of Charm (rank 5 batch 16): the attitude changes are note Effects lasting the spell (the GM sets attitudes). The 24-hour
  immunity applies whatever the result, and a creature holding it isn't asked to save again when it ends a turn in the aura. The same now
  applies to every lingering area whose spell has temporary immunity.
- Vampiric Maiden (rank 4 batch 33): the temporary Hit Points are the void part of the damage the target took. That is the void roll plus
  PF2e's own recorded resistance or weakness for void (read from PF2e's damage-taken message, not recomputed). If PF2e applied
  something that can't be split by type (for example resistance to all damage), the card stops for GM review rather than guessing.
- Containment (rank 4 batch 34): the force field is a note on the creature, with its Hit Points at the cast rank and result. The GM
  tracks the field and deletes the note when the field is destroyed. A willing target doesn't save, so the card tells the GM to set its
  result to failure (the field's normal effect).
- Dirge of Remembrance (rank 4 batch 34): "(this damage bypasses its resistances)" uses PF2e's own bypass option on the damage roll, which
  ignores every resistance. Only incorporeal creatures are eligible. On a failure or critical failure, semi-corporeal is a note for the
  spell's duration, and the GM plays the ghost touch benefit.
- Blood Feast (rank 5 batch 17): "If you are a gug, …" is a yes/no question to the caster on the card. A yes adds 2d6 piercing to the
  damage, and 1d8 to the critical hit's persistent bleed. PF2e has no gug trait to check, so the question is asked rather than read from
  the caster.
- Dust Storm (rank 4 batch 35): Mist's concealment comes from Mist's own text. The area deals its damage itself when a creature enters or
  starts its turn inside, doubled for the water trait. "Made primarily of liquid" can't be read from PF2e data, so it is a GM note (the
  GM doubles the damage for those creatures). Holding breath (unbreathable air) is a GM note, since PF2e doesn't automate suffocation.
- Warning Stripes (rank 3 batch 43): if the caster targets one creature other than themselves, it is treated as their animal companion,
  after the caster confirms (PF2e doesn't mark animal companions reliably). The 30-foot range is checked. Who touched or hit the bearer is
  the GM's call: they use the Retaliate control in Ongoing spells.
- Unusual Anatomy (rank 5 batch 18): PF2e's Effect (resistance to precision and critical hits, darkvision) is applied as proven against the
  text. Whether a hit came from an unarmed attack or a non-reach melee weapon is the GM's call: they use the Retaliate control (3d6 acid at
  7th rank, from the item's heightening).
- Fallen Soldier's Lament (rank 4 batch 36): the illusion's 30-foot emanation is a region the GM places (in the corpse's space) and moves
  up to 30 feet before each Sustain. Each enemy in it then saves. The corpse limits (size, dead within 8 hours, any size from 6th) are notes.
- Sacred Nimbus (rank 4 batch 37): PF2e's item lists a Reflex save, but the text states none, so the rain deals its damage with no save
  (text over data). Only creatures with the fiend or undead trait, or with PF2e's weakness to spirit, take it. The cloud's 15-foot move on
  Sustain is the GM moving the region.
- Unbreaking Wave Advance (rank 3 batch 44): the push is a GM reminder, as with every push. The collision damage (3d6, +1d6 per rank)
  applies only if the push would move the creature into a barrier or another creature, so it is the GM's: the push note gives it at the
  cast rank. The card itself deals no damage.
- Hot Air (rank 4 batch 38): the burning on speech is a note on the failing target for the sustained spell. The GM reports each auditory
  action or non-subtle spell in Ongoing spells, and the module deals the spell's rank in fire damage. Whether a spell is subtle is the
  GM's call.
- Wronged Monk's Wrath (rank 5 batch 19): the basic save's riders (failure: Deafened 1 round; critical failure: 2d12 persistent
  electricity and Deafened 1 minute) are written out as the four rows of a basic save. The card treats it as a non-basic save whose rows
  say the same thing.
- Shroud of Flame (rank 3 batch 45): touching the caster (an unarmed hit, a Grapple, or another touch) is the GM's call: they use the
  Retaliate control on the caster's marker, which lasts as long as the area. The area's cast and Sustain saves are the usual lingering
  exposures.
- Inevitable Disaster (rank 5 batch 20): the GM's secret 1d4-round delay is a reminder on the card, which waits until the accident. The
  GM picks the damage type on the card: the three physical types plus acid, cold, electricity, fire, force, poison and sonic, for "more
  unusual environments". The module doesn't track the delay itself.
- Elemental Annihilation Wave (rank 3 batch 46): PF2e's item heightens the bludgeoning damage by 1d6 per 2 ranks, but the text says 3d6.
  Text over data, so the card adds the missing 2d6 per step. The air-to-metal-and-wood trait option is a card note. The two-round
  variant (60-foot cone with Gust of Wind's effects for a round) isn't automated yet; it stays unsupported when cast.
- Psychic Outburst (rank 5 batch 21): PF2e has one variant for 2 or 3 actions (the same damage), so the push reminder on a failed save says
  "only if the spell was cast with 3 actions" and the GM checks. The two-round variant affects only enemies (the caster's allies aren't
  eligible) and always pushes.
- Mutilate (rank 4 batch 39): the caster's own 1d4 slashing is rolled and applied once when the card finalizes, with the caster's IWR.
  Casting with 3 actions (a 5-foot burst instead of one creature) is a card note: the caster targets every creature in the burst. PF2e has
  no 3-action variant to cast.
- Scouring Pulse (rank 5 batch 22): PF2e's persistent formula, ternary(gte(@item.level,5),1,2), reads backwards against the text. Text over
  data: 1d8 persistent vitality on a failure, and 2d8 from 8th rank. The persistent damage isn't doubled on a critical failure (it's the
  failure's added damage, not the basic damage). The halo (light, no concealment, concealed instead of undetected) is a GM note on the
  creature while the persistent damage lasts. The extra 1d4 rounds of light at 8th rank is the GM's.
- Overload Connection (rank 3 batch 47): the caster targets the creatures in the line between them and their familiar. The familiar isn't a
  victim unless the GM rules it's in the way. The first Sustain each later turn repeats the save from the card, as Lightning Storm does.
- Confront Selves (rank 4 batch 40): Clumsy 1 applies on every result except a critical success. A critical success ends the spell; the
  card's note tells the caster not to Sustain it again, and the module doesn't end the repeats itself.
- Blood in the Water (rank 3 batch 48): whether the target can bleed is the GM's per-target question. The requirement (persistent bleed,
  or slashing from the caster's last action), the automatic Sustain on dealing slashing damage, and a recast ending the previous casting
  are card notes the caster or GM acts on. The water terrain is a 1-round note on every result that deals damage.
- Gasping Marsh (rank 3 batch 49): a basic save whose four rows are written out is read as that table when the basic reading can't
  compile them (Acid Grip and others already compiled keep their basic reading). "Each breathing creature" is the GM's review, through a
  note. Moving the mist when Sustaining is the GM moving the region. The 1-minute immunity stops repeat exposures.
- Ordained Purpose (rank 4 batch 41): the two described creatures (lost abilities by acting against its beliefs: one degree worse; filling
  its appointed station, at the GM's discretion: one degree better) are one GM choice per target: worse, better or neither. If both apply,
  the GM picks neither, since they cancel. The Drop Prone compulsion (and "can't Stand" on a critical failure) is a note for the creature's
  next turn, which the GM plays.
- Hedge Prison (rank 3 batch 50): the hedge is a note on the trapped creature with its AC, Hardness and Hit Points at the cast rank (half
  on a success, half again on a critical failure, rounded down). The GM tracks the hedge and deletes the note when it's destroyed. The
  larger targets from 5th (Large) and 7th (Huge) use the eligibility size limit.
- Malicious Shadow (rank 3 batch 51): the damage type is picked on each Strike's card; the note says to keep the type chosen when the
  spell was cast. The multiple attack penalty is applied by the player. The shadow vanishing without a shadow (end the spell) and
  counteracting another effect that controls the shadow are notes for the GM.
- Lashing Rope (rank 3 batch 52): each rope Strike is a melee spell attack from the card. Using the rope to Trip (an Athletics check with
  the trip trait), the reach, and the Trip critical failure's replacement result are the GM's, through notes.
- Soothing Spring (rank 4 batch 42): the GM presses Soak for a creature that spent the full hour in the pool. It heals at the cast rank and
  removes Fatigued. The card allows 16 soaks, the pool's capacity in Medium creatures. A Large creature counting as four, a Huge one
  filling the pool, and fatigue returning from its source are notes.
- Rend Magic (rank 3 batch 53): each spell the target casts is reported by the GM in Ongoing spells, and the module deals the cast damage
  (doubled after a critical hit). The spell ending when the target ends a turn without casting is the GM's: they delete the note.
- Chthonian Wrath (rank 5 batch 23): the caster rolls the 1d4 realm (the module doesn't roll it) and picks the result on the card. PF2e
  merges the two equal untyped entries into one roll, so the card splits it evenly into the realm's two damage types.
- Overwhelming Memory (rank 3 batch 54): the caster picks the memory on the card. Its condition lasts until the start of the caster's
  next turn on the success, failure and critical-failure rows. Gleeful's "can't use reactions" is a note Effect for the same time
  (PF2e has no condition for it).
- Soul Cutter (rank 3 batch 55): PF2e's three variants deal bludgeoning damage, but the text says spirit, so spirit is rolled (text over
  data). The reach ("an adjacent target", "a target within 30 feet") is a card note, and the player picks the target.
- Burning Trail (rank 3 batch 56): the module can't see the companion's first Stride. The GM draws the trail along that Stride, selects
  it, and presses "Place the trail" on the cast's card. The trail lasts for the rest of the minute. A creature entering it is the GM's
  control, and a creature in it as its turn starts takes the damage automatically.
- Spirit Veil (rank 3 batch 57): PF2e's Concealed is applied, but "Hidden from undead" depends on who observes, so it stays in the note.
  So does the spell ending on a hostile action or on Interacting with undead (the GM deletes the Effects). At higher ranks the caster
  targets the extra willing creatures; the 30-foot range is not checked.
- Tortoise and the Hare (rank 4 batch 43): only the foe saves, so the cast targets the foe (one enemy). After Finalize, the caster
  targets themself or an ally and presses "Grant" on the card. That creature gets that row's Quickened (1 round on a failure, 1 minute
  on a critical failure), plus a note restricting the extra action.
- Control Water (rank 5 batch 24): the 50-by-50-foot area has no template. The caster targets the water-trait creatures in it, and the
  module refuses creatures without the trait. The water level is a GM note.
- Dive and Breach (rank 3 batch 58): the module doesn't move the caster. The player makes both Leaps, and the caster targets the
  creatures within 5 feet of either splash. A creature in both splashes is targeted once, so it takes the damage once.
- Shadow Blast (rank 5 batch 25): "Reflex or Will (target's choice)" is played as each target choosing its better save, so the card
  rolls whichever modifier is higher. The caster picks the damage type on the card and places the chosen area shape; it is a note,
  with no template choice.
- Elemental Breath (rank 5 batch 26): the caster rolls the element and casts that PF2e variant.
  - "A creature made of metal" is read as the metal trait.
  - Air's push is 10 feet away from the caster.
  - Earth's "on the ground" is a GM note: remove Prone from a creature that isn't on the ground.
  - The GM selects Wood's cone region on the card to place the terrain.
  - For Water and Wood, the caster answers how many heightened dice go to the second type.
- Unseasonable Squall (rank 3 batch 59): played like Gust of Wind. The GM answers whether a creature was flying, and its failure
  becomes a critical failure. The critical failure's 2d6 bludgeoning (PF2e's item has no damage) is rolled for that row. The push
  away from the burst's center is the GM's. The wind's effect on fires and objects is a GM reminder.
- Impaling Spike (rank 5 batch 27): Immobilized until it Escapes (spell DC), and Off-Guard on a critical failure while it's immobilized.
  Two parts are GM notes: whether the target stands on solid ground, and the damage equal to its weakness to cold iron at the end of
  each of its turns. Automating that turn-end weakness damage would be a new mechanism; ask the user.
- Darkened Eyes (rank 4 batch 44): PF2e has no rule that suppresses a sense, so the suppressed darkvision or low-light vision is a note
  Effect for each row's duration (the GM plays it). The critical failure's Blinded is automated, including its end-of-turn save.
- Freezing Touch (rank 4 batch 46): PF2e ignores a damage multiplier on persistent damage, so the card writes the scaled formula itself:
  floor(XdY/2) on a success, (2 × XdY) on a critical failure. The fire-trait escape (a free Escape or a DC 10 flat check) is a GM note
  on the failing rows.
- Entangle Fate (rank 4 batch 45): "more than one of the targets failed to resist" counts the targets on this cast's card with a failure
  or critical failure (at least two). "For the duration of the spell" is its fixed 3 rounds. The 2-to-4 target count isn't enforced:
  the caster targets them.
- Heightening audit (2026-10-02, `tools/audit-heightening-text.mjs`): every resolved spell's "Heightened (+N) … increases by XdY" was
  compared with PF2e's heightening interval and per-entry dice. Text over data throughout:
  - Breath of Life: the text heals 1d8 more per 2 ranks; PF2e's item adds 1d8 per rank. The card now rolls PF2e's healing with the text's
    dice count (6d8 at 7th rank, not 7d8). If PF2e's roll isn't the count the module expects, the card stops with an error rather than
    guessing. Direct healing whose text step uses another die than PF2e's entry is refused.
  - A variant whose text raises every die a size (Cry of Destruction's d12s after dealing damage, melee Ignition's d6s, Sun Blade's d6s in
    bright sunlight) raises the heightened dice too. PF2e's variants already do this, so they're left as they are.
  - Already using the text: Elemental Annihilation Wave (the 3d6 correction from batch 46), Wall of Ice (1d6 per 2 ranks, where PF2e says
    per rank), Tacky Pine Sap (its own floor(rank/2)d6; PF2e's item has no heightening) and Elemental Breath's Water/Wood split.
  - Heightened damage that PF2e's item has no entry for (a "persistent … on a critical hit", "the subsequent damage", damage against a
    creature type, fast healing) can't disagree with PF2e's step, so it was outside this audit. Those spells roll inline formulas or text
    formulas of their own.
- Save preamble audit (2026-10-02): every resolved save plan's text before its degree table was checked for sentences no compiler
  claimed that hold rule words (plural forms included) or limit who is affected. Most were narration ("You fling a spray of tiny
  shooting stars…") or rules compiled without claiming their sentence (Worm's Repast's undead dice, Imprinting Hand, Forge's Hardness).
  The gate now reads plurals (resistances, weaknesses, bonuses, penalties, immunities) and recipient limits ("Each incorporeal creature
  …", "… to living creatures", "Foes in the area", "Each enemy creature within …", "that can hear", "on solid ground"). A limit passes
  only if the compiled targeting carries it. Limits in narration ("rough aquatic creatures grow…", "As your enemies attempt to approach
  you") and the already-chosen target ("The triggering enemy attempts…") don't count. Rules that were really being dropped:
  - Eclipse Burst: "plus an additional 8d4 void damage to living creatures". PF2e's item rolls the void part against every creature, so
    the spell now blocks (no longer resolved) until a living-only damage part is compiled.
  - Horrific Visage ("Foes in the area"), Incarnate Tempest of Shades and Incarnate Shadow Minuet's Arrive ("Each enemy creature within
    a @Template…", "All enemies within a @Template… of your shadow"): these now compile to the existing enemy restriction. Before, every
    targeted creature saved.
  - Confusing Cry ("that can hear"), Roaring Applause ("must be able to see, hear, or otherwise understand you") and Blazing Fissure ("on
    solid ground") are now the GM's yes/no per target. This follows Localized Quake and Terrestrial creatures.
  - Moonburst's "cold damage is silver damage for the purposes of weaknesses, resistances" is PF2e's own silver material on the damage,
    so it counts as compiled. Without that material, the sentence blocks.
  - Dirge of Remembrance: the bypass claims only "(this damage bypasses its resistances)". "Each incorporeal creature" has to be in the
    targeting, so a different creature type blocks.
- Positive Attunement (rank 3 batch 60): each PF2e variant is cast separately.
  - The healing variant refuses undead and constructs.
  - The healing at the end of each of the caster's turns is a sustained Ongoing record. "Effects that increase healing only increase the
    initial healing" is a GM note.
  - The damage variant targets an undead (or void-healing) creature. A failure or critical failure starts the same turn-end damage,
    doubled for the critical failure. A success damages once.
- Glacial Heart (rank 5 batch 28): the end-of-turn save moves the granted Slowed. A failure adds 1, a critical failure adds 2 (at most
  4), and a success or critical success removes 1. At 0 the Effect ends. The text gives nothing for a critical success, so it is read
  as a success. The save's incapacitation trait and the encasing ice (its Hardness, Hit Points, Force Open, and Stunned when broken
  from outside) are a GM note. The same "escalate" mode can later serve Petrify, Lignify and Vitrifying Blast (rank 6).
- Antlion Trap (rank 3 batch 61): played as a lingering area. A save happens on entering and at the start of a turn inside; there is
  no save on casting, since the text gives none. "Increases … the amount a creature moves on a failure" is read as also applying to the
  critical failure, which works "as failure". Unsecured objects and the blocked-space rule are GM notes.
- Undertow (rank 3 batch 62): the critical failure's "pulled 10 feet down" is a GM note. The water's depth and its Swim DC (the spell
  DC) are area notes. PF2e's Effect (the two swim penalties) is applied on the failing rows and removed when the creature leaves the area.
- Freezing Rain (rank 5 batch 29): there is no save when cast. The first Sustain each round exposes the creatures inside. The caster
  chooses whether the rain freezes; when it doesn't, the GM marks every creature unaffected in the review. Moving the area (the GM
  moves the region) and putting out non-magical fires are notes.
- Living Terrain (rank 4 batch 47): the GM moves the region, up to 15 feet in a straight line, when the caster casts and Sustains.
  The creatures it covers or passes over are the review's affected creatures. Its "no damage" critical success is read as unaffected.
- Consuming Darkness: deferred. Its degree-save lingering area needs radius growth on Sustain, and its Speed penalty "for as long as it
  remains in the area" isn't read yet.
- Ancestral Winds (rank 5 batch 30): the GM moves the region, up to 30 feet, on the first Sustain each round. The living creatures in the
  new area are exposed, and nonliving creatures are refused by the card. The critical failure's "As failure, but … Stunned 1" is read as
  keeping the failure's Frightened 2.
- Gluttonous Growth (rank 5 batch 31) and Grasping Earth (rank 4 batch 48): Grabbed and Restrained "until it Escapes" also end when the
  spell ends. The Sustain damage goes to each creature this spell holds; a creature that is both takes the Restrained damage. Gluttonous
  Growth's held creatures don't save again at the start of their turns, and its heightening follows the text (+2d6 a rank) rather than
  PF2e's data. Its terrain hinders walking and flying.
- Flame Strike (rank 5 batch 32): "half their usual fire resistance" is rounded down. Only the creature's highest resistance counts, so an
  all-damage or energy resistance higher than the halved fire resistance still applies instead. A fire-immune creature "instead of gaining
  the usual benefit of immunity" takes the damage as untyped, by its one-degree-better result.
- Ice Storm (rank 4 batch 49): the hail is the save card. After Finalize, the GM selects the area and the card places the storm (difficult
  terrain, Sustained). The second cloud outdoors and "a Large creature in both clouds" are notes; the GM places the second cloud.
- Stifling Stillness (rank 4 batch 50): the action "on their turn" straining to breathe is taken as the creature's exposure when its turn
  starts. Fatigued follows whatever the result, even a critical success, because the text gives it without a save. Who breathes or holds
  its breath is the GM's call at review.
- Debilitating Dichotomy (rank 4 batch 51): the card adds the caster's own token as a second saver, so the caster needs a token. A
  GM-overridden critical failure for the caster would also Stun it; the rule itself never produces one, because the caster's result is
  one degree better.
- Call the Blood (rank 4 batch 52): "the void damage the target takes" is the HP damage PF2e applied (after resistance). The caster's part
  is read from PF2e's mode of being and void healing. A construct caster gets nothing. The caster's part is a card button after Finalize.
- Sanguine Mist (rank 4 batch 53): each Sustain exposure card offers half the most a creature lost on it. The caster keeps the higher
  temporary Hit Points (they don't stack), held as a 1-minute Effect. The cast exposure gives none, because the text ties them to Sustaining.
- Invoke Spirits (rank 5 batch 33): the basic save becomes plain rows with the critical failure's conditions, as in Ancestral Winds. On a
  Sustain, the critical failure drops Fleeing; the GM moves the region first.
- Divine Immolation (rank 5 batch 34): "more detrimental (as determined by the GM)" is read from PF2e's data. Spirit replaces fire when the
  creature is immune to fire (and not to spirit), or when its spirit weakness less resistance beats its fire weakness less resistance; a
  tie stays fire. The persistent part follows. "Double persistent damage" is twice the rolled persistent dice, each turn.
- Noxious Metals (rank 3 batch 63): the plant and wood traits are read from PF2e. For every other creature, the card asks the GM whether
  it has an anathema toward metal. Sickened lasts as long as that creature's persistent poison damage.
- Blood-Feasting Breath (rank 5 batch 35): the placed cone is the first cone. After Finalize, the GM targets the living creatures in the
  second cone, and the card heals them and the caster by the most any one creature lost (HP damage after resistance). A creature from the
  first cone can't be healed.
- Coral Eruption (rank 4 batch 54): after Finalize, the GM selects the bursts' regions (a third only underwater), and the card places the
  terrain for 1 minute. "Moves through the area" damage per square is the GM's Ongoing control (target the creature and give the squares)
  at the cast rank. The persistent bleed on a critical failure isn't doubled.
- Corrosive Muck (rank 5 batch 36): PF2e's item has no area, so the text's two 10-foot bursts (one more per 2 ranks) are placed. "Each round
  that a creature starts its turn … or enters a pool" is one exposure per creature per round, which also covers a Large creature in both
  pools. The persistent acid on a critical failure isn't doubled.
- Grisly Growths (rank 5 batch 37): after Finalize, unless the target critically succeeded, a card's button starts the Will saves for every
  creature within 30 feet of the target, the target included and allies too, as the text says. Each is then temporarily immune for 1 hour.
  "No effect on a mutable anatomy or no limbs (ooze, protean)" is a note; the GM excludes such a target.
- Cup of Dust (rank 3 batch 64): handled like Feast of Ashes, hourly. The GM's Ongoing control deals each hour's damage (untyped, because PF2e's
  item has no damage entry; the text's dice at the cast rank). Fatigued stays until removed. "Can't be healed" is the note's.
- Weapon Storm (rank 4 batch 55): the caster picks any weapon it holds. The die is the weapon's, or its two-hand die when held in both
  hands, and the type is the weapon's main damage type. Versatile, runes and modifiers aren't added: the text says only "dice of damage".
  The cone (or the 10-foot emanation) is the caster's placement; the critical specialization is a GM reminder.
- Crucible of Iron (rank 5 batch 38): the critical failure's Dazzled, Enfeebled and Immobilized all end when the creature Escapes (or after
  the minute). The success row's Dazzled lasts 1 round. The persistent fire follows the text's step: one more d10 every 2 ranks.
- Blister (rank 5 batch 39): after Finalize, a card holds the blister count (1, 2 or 4) for the spell's minute. Each pop is the caster's
  action: target the creature with the blisters and those in the cone, then press. Each pop is its own basic save, and the last ends the
  spell.
- Annunciation of the Outer Gate (rank 3 batch 65): the GM leaves out the creatures that accept the invitation when targeting. The refusers'
  "frightened doesn't decrease after a turn it damaged an agreeing creature" is a note Effect for the 10 minutes; the agreement among
  those who accepted is a card note.
- Croak Voice (rank 3 batch 66): the DC 5 flat check on auditory actions and non-subtle spells is the table's (a note). The throat massage
  is the creature's own Ongoing control (owner or GM): its Fortitude save against the spell DC, once a round, a success ending the spell.
  The auditory damage is the GM's control (the item's dice at the cast rank, doubled on a critical failure).
- Dreamer's Call (rank 4 batch 56): the caster picks the course of action on the card; it applies to failures and critical failures. Fleeing
  lasts as Fascinated does (until the end of the target's next turn); Prone lasts until it Stands; approach and Release are notes. The
  critical failure's "every action" is a note.
- Outcast's Curse (rank 4 batch 57): PF2e's two Effects carry the roll-twice; they're told apart by their durations (the minutes' one for a
  success, the unlimited one for failures). The initial attitudes are notes: one step for 10 minutes, one step for good, two steps for good.
- Weaponize Secret (rank 4 batch 58): the GM picks the secret. When the creature attacks the caster, the GM presses the discharge control:
  the text's 7d6 (+2d6 a rank) once, which ends that creature's rune, and on a critical failure also removes its persistent mental. The
  persistent damage is 1d6 + 1 per rank above 4th.
- Clownish Curse (rank 4 batch 59): PF2e has no Effect, so the module makes one per row: RollTwice (keep the lower) on Acrobatics, Stealth
  and Thievery, and PF2e's AdjustDegreeOfSuccess (failure to critical failure) on each, for 1 round, 1 hour or permanently. The noises
  and awkwardness are narration.
- Sage's Curse (rank 4 batch 60): PF2e's Effects carry the roll-twice; the permanent one's own choice (failure or critical failure) makes
  Recall Knowledge one degree worse on a critical failure. The "one true, one erroneous piece of knowledge" is a GM note for the row's time.
- Channel Arrogance (rank 4 batch 61): whether the spell was cast with 1 action is the GM's answer on the card for each target (one degree
  better if so). The flat check on speech while Fascinated is a note lasting as long as the Fascinated (1 round, or 1 minute on a critical
  failure).
- Censure Falsehoods (rank 3 batch 67): who may be targeted (a liar the caster is aware of) is a card note. The flat check on speech is a
  note while the creature is sickened. The critical failure's "Deception or Stealth check raises the sickened value" is the GM's control,
  which the module applies (up to 4).
- Daydreamer's Curse (rank 4 batch 62): the module generates the Effect. "Checks with the concentrate trait" are read from PF2e's
  `item:trait:concentrate` roll option, which a concentrate action's check carries (checked live with Seek). The critical failure's "every
  concentrate check one degree worse" replaces the success row's "critical success becomes a success".
- Bestial Curse (rank 4 batch 63): PF2e's two Effects carry the silver weakness, bound by duration (1 hour; unlimited). The caster's choice
  of claw, hoof, horn or jaws Strike, and the flat check on manipulate actions, are notes for the row's time. The success row's "the spell ends
  when it recovers from Clumsy" is Clumsy's own 1 round.
- Infectious Melody (rank 4 batch 64): PF2e's three penalty Effects are bound by their durations. Singing to speak, Perform, the flat check
  and "nearly impossible to remain Undetected" are a note for the row's time; nothing grants Undetected. Only foes that hear it are
  affected (a card note).
- Delusional Pride (rank 4 batch 65): a failed attack roll or skill check is the GM's report (the Ongoing control). The penalty Effect lasts
  until the end of the creature's turn if it's that creature's turn, otherwise until the end of its next turn. A second report while it lasts
  makes it −2.
- Unsettling Knowledge (rank 4 batch 66): the caster's chosen skill isn't recorded at cast. The creature's Recall Knowledge control asks for
  it (one of the five). The frightened floor on a failed check is a locked Frightened 1 for the rest of the spell's minute.
- Seal Fate (rank 4 batch 67): the caster picks the damage type on the card, which presets PF2e's Effect. The Effect lasts until the end of
  the caster's next turn, 1 minute, or unlimited by result. "Dies if reduced to 0 Hit Points by the chosen damage at or below the level" is a
  note with the level at the cast rank (7, +4 every 2 ranks): the GM applies death.
- Steal Voice (rank 4 batch 68): "voiceless" has no PF2e condition, so it is a note Effect for each failing row's time (the critical failure's "permanent" is unlimited). The caster's option to speak in the target's voice is in the note. Creatures with no voice are left out by the GM (card reminder).
- Vision of Beauty (rank 4 batch 69): on a failure the target moves toward the image for 1 round and is "then" Fascinated for 1 round. Fascinated is applied at the cast for 2 rounds (covering both); the critical failure's 1 minute also starts at the cast. The movement is a GM note for the target's next turn.
- Compel True Name (rank 4 batch 70): the command itself is a GM-played "Compelled" note (10 minutes / 8 hours) that the GM ends early when the instruction is done or becomes self-destructive. Immunity applies to this caster's castings only. What the target learns of the caster's true name is a card reminder.
- Favorable Review (rank 4 batch 71): the critical failure's attitude change (two steps better toward the named subject or creatures tied to it) is in the note, not applied as PF2e attitude conditions, since its target is the subject rather than the caster.
- Unsettling Perspective (rank 4 batch 72): PF2e has no damage data, so the text's 2d10 mental (+1d10 per 2 ranks) is used. What the caster learns about the target's social standing is a card reminder for the GM to tell, not data the module can read.
- Inevitable Destination (rank 4 batch 73): the tether (can't move farther from the caster; ends if the caster moves farther away) is a GM note for the spell's 2 rounds; a successful Escape vs the spell DC offers the GM a button to end it. The critical failure's 10-foot pull is a GM reminder (the module doesn't move tokens).
- Stasis (rank 4 batch 74): the stasis (invulnerable, untargetable, other durations paused) is a GM note; the module can't pause PF2e's timers, so the note asks the GM to. Objects as targets and their automatic critical failure are the GM's (card reminder).
- Trickster's Twin (rank 4 batch 75): disbelieving ends the whole spell (it has one target). The listed triggers (a nonsensical action, the target engaging the double) are the GM's to spot; the GM then uses the Disbelieve control.
- Roar of the Dragon (rank 4 batch 76): PF2e's caster Effect only applies with a roll option nothing sets; the module adds a toggle to the created Effect so the caster can switch it on against a dragon that was in the area. Dragon-tied non-dragons are left to the GM (reminder).
- Hallucination (rank 5 batch 41): at 6th/8th the caster's choice between more targets and a longer duration isn't asked on the card; the notes last 1 hour and a reminder tells the GM to extend them (until daily preparations / unlimited) if the caster chose duration.
- Luring Wail (rank 4 batch 77): "as long as it is in the emanation and can hear" is read as Fascinated until it leaves the area, with the compulsion a GM note while Fascinated; hearing is the GM's call in the area review.
- Subconscious Suggestion (rank 5 batch 42): the suggestion is an unlimited GM note (held until the caster's next daily preparations); the 1-minute/1-hour obedience once triggered is in the note text, not a timer.
- Wish-Twisted Form (rank 5 batch 43): "the target's resistances are reduced by 5" (+1/rank) isn't in PF2e's Effects; it's a GM note with the amount at the cast rank.
- Wave of Despair (rank 5 batch 44): "can't use reactions" is in the Despair note (the GM enforces it); the start-of-turn save and its Slowed 1 for that turn are automated.
- Shared Nightmare (rank 4 batch 78): "spend your/its first action Confused" (success on the caster, failure on the target) is GM-played (card reminder / note); PF2e has no one-action Confused.
- Planar Tether (rank 4 batch 79): the automatic counteract is the GM's control (Ongoing spells, "Counteract with Planar Tether") when a teleport/plane shift would affect the creature; nothing detects teleportation.
- Vindicator's Judgment (rank 5 batch 45): the weakness applies only to the caster's Strikes/divine spells, which PF2e's Weakness rule can't scope, so it's a GM note with the amount at the cast rank (also the critical failure's per-round Off-Guard).
- Behold the Weave (rank 3 batch 68): the committed actions are GM-played via a note for the target's next turn; the 7th-rank "all enemies within a 30-foot emanation" is the caster's targeting (reminder).
- Mind Reading (rank 3 batch 69): the Intelligence comparison is read from PF2e and whispered; "vague surface thoughts" are the GM's to describe (note). Immunity covers this caster only.
- Slither (rank 5 batch 46): the critical failure's "double damage" doubles the persistent poison too; freeing a creature by destroying its snake (AC = spell DC, 12 HP +6/2 ranks) is the GM's (reminder).
- Sawtooth Terrain (rank 5 batch 47): the critical failure's "double damage" doubles the bleed too; the Speed penalty is an unlimited note with PF2e's modifier that the GM ends after magical healing or a successful Administer First Aid vs the spell DC.
- Whispers of a Dead Goddess (rank 5 batch 49): "won't voluntarily leave" and the whispered suggestion are GM-played notes (the suggestion's note lasts the sustained minute; the GM ends it early if the creature leaves).
- Ranage's Circle (rank 4 batch 80): "Clumsy until they move from their position" is a note granting Clumsy that the GM deletes when the creature moves; the adjacent squares' difficult terrain is a card reminder (not a placed region).
- Crisis of Faith (rank 3 batch 70): the caster answers once per cast whether the target casts divine spells (d8 dice and the failure's Stupefied on yes); "can't cast divine spells for 1 round" is a note.
- Shift Blame (rank 3 batch 71): the altered memory is an unlimited GM note; with no critical-failure row, a critical failure gets the failure's note.
- Pack Breaker (rank 5 batch 50): Unfriendly is applied as PF2e's attitude condition (via a note) for 1 minute; "former allies within its reach" are the GM's targets on the chained card.
- Shape Stone (rank 4 batch 81): "a Reflex save or Acrobatics check" rolls the target's better modifier (assumed choice); falling off the stone on a critical failure is the GM's move.
- Waking Dream (rank 4 batch 82): "treats all other creatures as concealed" is a GM note (PF2e has no 'others concealed to me' rule); the success's "can't Sustain" is a card reminder.
- Mind Probe (rank 5 batch 51): each question is the GM's control (its Deception vs the DC, whispered result); the answer itself is the GM's. Asking the same question again isn't tracked (the note says it repeats the result).
- Heart's Desire (rank 3 batch 72): the -2 to reaction checks, "can't use reactions" and "all spaces are difficult terrain for the target" are GM notes.
- Enthrall (rank 3 batch 73): the GM picks targets (those who notice), answers the +0..+4 bonus, triggers the disagreement save, ends the fascination on hostile acts or Diplomacy/Intimidation, and presses the newcomers' card on each Sustain.
- Infectious Comedy (rank 5 batch 52): "can't use actions or reactions for 1 round" and "can't use reactions" are GM notes; the spread's new target (not one already targeted) is the GM's pick on the card.
- Geyser (rank 5 batch 53): the fall's damage (half the push: 10 / 20 bludgeoning) is applied with the row's damage; for a creature that flies or stays aloft the GM undoes it. The 1-round steam concealment is a reminder.
- Garden of Stone (rank 3 batch 74): the push to the nearest space, the 20-foot difficult terrain and the stalagmite object are a card reminder (not placed regions/tokens).
- Wall of Radiance (rank 3 batch 75): the wall is a GM-placed line region whose entry triggers the save; Dazzled for adjacent creatures and the 4th-rank concealment are a card reminder.
- Asterism (rank 4 batch 83): the five lines are shapes of one GM-drawn region (once a turn across all lines); anchors' immunity (leave them out in the review) and broken lines (delete the shape) are a card reminder.
- Remember the Lost (rank 4 batch 84): a named enemy takes only the larger dice ((2 × (rank − 1))d10) in place of the 6d6, scaled by its result; the caster answers per enemy on the card; the GM confirms the immunity per creature; the guessing rule is a reminder.
- Swamp of Sloth (rank 3 batch 76): PF2e's item has no area and the text names no initial radius; the module uses a 5-foot burst (the smallest; the published stat block says '5-foot burst or more'), +5 per extra action and per heightening step. The sludge beasts are narration.
- Unravel Existence (rank 5 batch 55): 'not a native inhabitant of the plane' is the GM's yes/no per creature on the card; the rider's persistent damage is not doubled on a critical failure; the dust at 0 HP is a reminder.
- Steal Shadow (rank 3 batch 77): the critical failure's cast damage is full (not double; 'As failure, but … Enfeebled 2'); the throttle's card opens automatically on each round's first Sustain for the failed targets — leave it unfinalized to not throttle.
- Captivating Adoration (rank 4 batch 85): 'for its next action' = Fascinated until the end of its next turn plus a reminder to remove it after that action; 're-entry uses the original result' = no new save (an immunity for the spell's minute after a failure, an hour after a success); the GM re-applies Fascinated to a failed creature that returns; the attitude step on a critical failure is the GM's.
- Skyglass Prison (rank 3 batch 78): the shards are a GM-reported control (Escape, destroyed cage, Dismiss, or a success's cage breaking at the start of the caster's next turn) — not automatic on the Escape card; using it ends that creature's restraint.
- Implement of Destruction (rank 4 batch 86): the weapon's hits are GM controls on the enemy's note; a critical hit's added damage isn't doubled; after a critical failure the Doomed 1 isn't tied to the persistent damage (the text gives no duration); the weapon itself is a reminder.
- Bloodspray Curse (rank 4 batch 87): the wounding Strike (10+ piercing/slashing) is a GM control per type, once a round; the failure's inline bleed is applied as persistent bleed.
- Achaekek's Clutch (rank 4 batch 88): 'that amount' = the persistent bleed's amount as written (the GM types e.g. 1d6; it's rolled again as slashing); the critical failure's flat-check DC 20/15 is the GM's (in the note).
- Over the Coals (rank 5 batch 56): noncompliance is the GM's control (end of its next turn); a later compliance is ended by the GM (persistent damage removal included); the 9th-rank second target is a reminder (the save card takes the GM's targets).
- Unravel Knowledge (rank 3 batch 79): the chosen ability's use is a GM control per variant (specialized 3d8 or basic/untrained 3d4 — the GM picks the one matching the cast's choice); the critical failure's −2 is PF2e's toggled Effect (the creature/GM toggles it the first time each round).
- Fallow Field (rank 4 batch 89): the module holds PF2e healing (negative damage, incl. fast healing/regeneration applied that way) on creatures inside and rolls their Will save automatically at the spell DC, restoring all/all/half/none; direct HP edits aren't watched.
- Ymeri's Mark (rank 4 batch 90): the duration save is the text's Fortitude (PF2e's defense is the explosion's Reflex); '1 week' = 7 days; Fatigued is held (PF2e restrict); detonation = a Dismiss control (with/without the marked creature) opening a basic Reflex card for creatures within 10 ft.
- Lightning Lasso (rank 3 batch 80): every round's first Sustain shocks each still-held target ((rank−2)×2) and restarts its hold (no opt-out short of not sustaining); the critical failure's Restrained shares the failure's time.
- Call the Ten (rank 4 batch 91): the caster's designation (shielded vs attacked) is the card's per-target yes/no; the caster can be among the targets.
- Draw the Lightning (rank 4 batch 92): the cloudy/stormy sky is the caster's yes (+2d12); 'taller or higher than you' is the GM's per-target confirmation; PF2e's Effect asks which weapon (unarmed for an empty hand).
- Cloak of Light (rank 4 batch 93): 'adjacent' = the caster's 5-foot emanation; living creatures are healed with no save (Heal's dual rule), constructs unaffected; the light is a TokenLight Effect for the spell.
- Tomorrow's Dawn (rank 4 batch 94): 'adjacent' = the caster's 5-foot emanation; 'nindoru fiend or undead' is the GM's per-creature confirmation; the critical failure's Slowed lasts while the aura (the spell) does; Sickened keeps its own recovery.
- Door to Beyond (rank 4 batch 95): 'adjacent to the door' = the 8 squares around the door's square (a child region, no save, caster excluded); the pull is toward the area's centre (the GM places the 20-ft emanation on the door's space); objects are a note.
- Etheric Shards (rank 5 batch 57): each move action through the area is the GM's control (target + squares) opening the basic Reflex card; the difficult terrain covers walking and flying (incorporeal noted).
- Instant Minefield (rank 5 batch 58): the GM draws the mines as region squares (hidden) and reports each explosion with its caught creatures targeted (one card, one roll); the spell ends after the last mine.
- Bloody Tendrils (rank 3 batch 81): the tendril thralls are tokens the player places and targets when the area starts (the module doesn't create them); one exposure per enemy turn end however many tendrils reach it.
- Purifying Veil (rank 4 batch 96): moving through the veil = leaving it: the GM's control gives the basic Will save, then the spell ends; the target is Concealed (outside creatures concealed to it noted).
- Personal Runewell (rank 4 batch 97): allies' spells are amplified (PF2e's Effect while inside; it applies to any spell damage — the 'no duration' limit is a GM note), enemies' spells are punished (GM control → basic Reflex); the caster's own runewell bolts aren't amplified. Side effect: placed-area ally Effects now go to the caster only while inside.
- Steal the Sky (rank 5 batch 59): 'hits a surface' is the GM's yes/no per creature; the fall damage assumes the full descent (60 ft +20/rank → half as bludgeoning), a nearer surface is the GM's adjustment; the grounding is a 1-minute note.
- Overflowing Sorrow (rank 4 batch 98): each creature saves once (immune for the spell after any result); the GM re-applies its note on re-entry; the heightened +5 ft is always taken (shrink if not chosen); the emotion suppression and flat check are GM notes while inside.
- Morass of Ages (rank 4 batch 99): 'slowed 1 when it starts its turn in the area' = Slowed 1 while inside (same effect on its actions); the per-creature difficult terrain is a GM note; one save per creature (GM re-applies on re-entry); optional +5 ft growth to 60 after each Sustain.
- Mycological Malady (rank 3 batch 82): the disease ends with the cast (its Pseudo Afflictions Effect is deleted when the spell ends); the module doesn't check disease immunity, so the 'undead aren't immune / other organic non-living at GM discretion' rule is a card reminder.
- Curse of Death (rank 5 batch 60): the 1-day immunity outlives the cast (only the curse ends with the spell); the success's 'can't increase beyond stage 1' caps Pseudo Afflictions' counter; a second cast on an immune creature adds another day-long immunity Effect (harmless duplicate).
- Impending Doom (rank 3 batch 83): 'on the second/third round' = when that round of the spell begins at the caster's turn (PF2e's round-duration boundary); conditions from earlier rounds last until the spell ends (off-guard etc.), Frightened decays normally, Stunned uses the action-loss reminder; the end damage is one roll, halved (rounded down) / doubled per degree.
- Coral Scourge (rank 3 batch 84): Paralyzed at clumsy 4 lasts until the spell ends (lowering clumsy afterwards doesn't lift it); the growth happens at the start of each of the target's turns, including the first after the cast.
- Infectious Ennui (rank 3 batch 85): the spread is a card the GM presses at the start of the target's turn (GM picks the creature); 'immune to this casting' = immune to this cast's spreads for up to 1 minute; at 5th the spread's Slowed ends when the original cast ends.
- Weapon Tide (rank 3 batch 86): the 3-action difficult terrain is the GM's button on the card (the card can't know the actions spent); the two-rounds empowered wave is PF2e's own variant; hazard once per turn across entering and ending the turn.
- Ring of Truth (rank 3 batch 87): the –2 Deception penalty rides on every result's in-area note (all creatures in the area save); the bell behaviour is GM-played; re-entry restores the note by reminder.
- Shaken Confidence (rank 4 batch 100): the caster names the triggering roll type on the card (attack roll, Perception or a skill; Lore skills not listed — GM handles); the misfortune note ends after that roll or at the end of the target's next turn.
- Mirror's Misfortune (rank 4 batch 101): the duplicate is an unlinked token copy of the caster on its square (the GM moves it / the caster Steps); the GM's control (attacker targeted) rolls the save; the misfortune covers the attacker's next 2/4 attack rolls within an hour (module-counted).
- Cyclone Rondo (rank 3 batch 88): on Sustain the GM moves the region; creatures inside after the move are exposed, those only passed through are added on review.
- Strange Geometry (rank 5 batch 61): each creature saves once (on first being in or entering any cube); the failure's difficult terrain and random-exit teleport are a GM-played note for the spell; disbelieving ends that creature's note only.
- Pressure Zone (rank 5 batch 62): immune 1 hour after any result (no re-ask on re-entry while affected); failure lasts until its outside-the-zone end-of-turn save; popping ears = per-condition 1-action save; anatomy immunity is the GM's.
- Ibex's Harvest (rank 3 batch 89): the caster (in its own emanation) also gains the 3-action temporary HP; 'willing' is the caster's call; PF2e's broken Effect link is replaced by the module's TempHP Effects.
- Stone Lance (rank 3 batch 90): one Escape ends both the impaling penalty and the critical Immobilized (one restraint); the bleed on Escape is persistent; 'on the ground' is the GM's (reminder).
- Celestial Brand (rank 5 batch 63): 'you and your allies' = caster + every scene token allied by PF2e alliance (each holds PF2e's marking Effect); target immunity runs the brand's round + 1 minute.
- Prophet's Luck (rank 4 batch 102): the heightened +2/+3 also applies to the aftermath (caster bonus / target penalty for 10 minutes); 'obvious threat' is the caster's call.
- Winning Streak (rank 4 batch 103): 'significant foe' is the GM's (control); quickened creatures stay quickened while the streak lasts; the streak breaks at the second round boundary after the last reported critical hit.
- Tracking Mayflies (rank 3 batch 91): whether the target is magical is the GM's answer (the Off-Guard button); the doubled range and concealment changes are notes (the Strike is PF2e's).
- Martyr's Intervention (rank 3 batch 92): resolved after PF2e applied the damage (target restored to 1 HP, out of dying/unconscious); the redirected rest ignores the caster's IWR (as Protector's Sacrifice).
- Rallying Banner (rank 5 batch 64): 'allies' = PF2e alliance allies within 200 ft of the bearer (bearer included); fear saves automatic (trait), despair/confused/controlled saves via a toggle on the Effect; group members who aren't allies and sight/hearing are the GM's.
- Spellmaster's Ward (rank 5 batch 65): the prevention is applied right after PF2e's damage (restoring HP); spell damage identified by PF2e's message origin type.
- Vital Luminance (rank 4 batch 104): the reservoir grows at the start of each caster turn after the casting round (not the casting turn); the undead damage is the GM's control (half, once a round per creature).
- Warding Aggression (rank 3 batch 93): 'the end of any turn in which you didn't hit' read as the caster's turns; the foe's death = its HP at 0.
- Moth's Supper (rank 3 batch 94): the extra 4d4 "when someone successfully Treats your Wounds" is a card button pressed once (PF2e's Treat Wounds dialog names no patient); the blood-and-rot sense is a note; the first 2d4 comes 10 minutes after casting.
- Whirling Scarves (rank 3 batch 95): PF2e rolls no concealment flat check, so the snag is a card control (target the attacker, pick its Strike) after a melee miss on that check; Concealed is granted for everything ("only against attacks" and the ranged DC 6+ are Effect notes).
- Sign of Conviction (rank 3 batch 96): PF2e's remastered deities have no alignment, so all four damage types (fire, spirit, cold, force) are offered with a note on which deity gives which; moving the caster's token ends the Effect (and the card refuses more attacks); stopping the Sustain is a note (delete the Effect).
- Life Pact (rank 3 batch 97): a member with fewer than the stated Hit Points loses only what it has (left at 0 HP; no Dying is added for that loss); the pact needs at least two targets; it triggers on PF2e's damage updates (incl. a player-owned actor's manual HP drop).
- Bonewall Bulwark (rank 3 batch 98): the 10-foot wall is a Large token (AC 10, stated HP, no saves) the GM turns or places; its cover is a note (no scene wall).
- Horde of Underlings (rank 3 batch 99): the underlings are placed in free squares near the caster (move them into the cone as chosen); their move is a straight search toward the nearest enemy (no pathfinding); 'enemy' = a token of the opposite disposition; their difficult terrain is a note.
- Mad Monkeys (rank 3 batch 100): the creatures in the area are the ones the caster targets on each use; the stolen item is the GM's (note); Calm making them docile and moving the area are notes.
- One with Stone (rank 3 batch 101): read by One with Plants' family; the stone gains no trait (the text gives none).
- Thief of Fortune (rank 3 batch 102): "each round both are affected counts for two rounds" is applied at once (both keep half the remaining time; ending the copy early doesn't restore the original's); 'beneficial' and 'valid target' are the caster's judgement (notes).
- QUESTION — Restraining Chains (rank 3): the text has four save rows but neither PF2e's data nor the text names the save (no Defense). Options: (a) the GM picks the save on the card; (b) treat as Reflex (typical for restraint); (c) leave unsupported. Deferred.
- Ki Cutting Sight (rank 3 batch 103): PF2e's toggle is replaced by a mark on the target (the text names it); 'a Strike' also matches PF2e's self:action:slug:strike (its own action:strike predicate never matches Strike damage — checked live).
- Organsight (rank 3 batch 104): the Medicine checks 'that depend on its organs/skin' are roller toggles; the Recall Knowledge DC is the creature's level DC adjusted for rarity; a Lore is a parameter of the check (default Medicine).
- Consecrate Flesh (rank 3 batch 105): the extra healing dice apply to the caster's spell healing rolls (PF2e's spell-healing selector); 'only when initially cast' is a note; touching is the GM's Retaliate.
- Bone Flense (rank 3 batch 106): the bleed dice are persistent (the text; PF2e adds ordinary bleed); 'a creature with a skeleton or exoskeleton' is the roller's toggle; who may be targeted (Red Mantis / mantis leg) is the GM's note.
- Ranger's Bramble (rank 3 batch 107): Entangling Flora's rules in the bramble's 5-foot burst; the critical failure's bleed is persistent (bleed in PF2e; 'Escaping doesn't end it').
- Phantom Prison (rank 3 batch 108): being trapped and blind to the outside is a GM-played note (no condition stated); the re-saves on interacting/escaping/outside effects are the GM's Disbelieve control; 'Large or smaller' and the 8th-rank 5 targets are a card note.
- Zombie Horde (rank 3 batch 109): the save is basic (the text; PF2e's data says not); the thralls destroyed are the caster's/GM's to report (no thrall trait); moving the horde is moving the region.
- Primal Chorus (rank 3 batch 110): 'until your next daily preparations' = 24 hours (PF2e's convention); the Will saves of significant creatures and how many respond are the GM's (note); the initiative bonus is a toggle for an encounter with a replying enemy.
- Oneiric Mire (rank 3 batch 111): 'no longer needs to make Will saves' = immune to the spell for its minute (on a critical success at the area's save or the end-of-turn save); the end-of-turn save is the creature's control, once a round.
- Wall of Wind (rank 3 batch 112): only flyers save (the GM leaves walkers out at review; for them it's difficult terrain); the critical failure's push direction is the GM's (away from the wall); the ranged-attack penalty and blocked ammunition/gases are a reminder.
- Pyrotechnics (rank 3 batch 113): the 1d6 cold to a fire-creature target is a reminder (GM rolls it); the smoke's -4 Perception and 'can't recover while in the cloud' are reminders; rising/falling is moving the region.
- Shifting Sand (rank 3 batch 114): 'ignores the area's difficult terrain/penalty until end of turn' is the GM's (a toggle switches the penalty off); the Prone for an already-immobilized creature is a GM note; moving the area on Sustain (carrying the immobilized) is a reminder.
- Aqueous Orb (rank 3 batch 115): the orb trying to move through a creature is the GM's control (once per turn per creature); being engulfed is a note ending on an Escape (Swimming DC 10 is the GM's); the fires are a reminder.
- Curse of Lost Time (rank 3 batch 116): the caster picks the target's kind on the card (living/construct); the object case is the GM's reminder (bearer's save, 4d6 with Hardness, the curse); immunities (ageless, precious materials, artifacts) are the GM's.
- Circle of Protection (rank 3 batch 117): the alignment is the caster's pick and the bonuses are toggles (remastered creatures have no alignment); PF2e's unconditional +1 Effect is not used; the summoned creatures' Will save is the GM's note.
- Invoke the Harrow (rank 3 batch 118): the caster picks the suit and boon/bane on the card (the draw or 1d6 is a reminder); an ally accepting it is recorded as a failure; the Crowns bane's 'check of your choosing' is a toggle.
- Reflective Scales (rank 4 batch 105): 'damage prevented' = the chosen type's damage in each hit, up to the resistance; the explosion's targets are those the caster targets in the 20-foot emanation.
- Cinder Swarm (rank 4 batch 106): 'enemies in the aura' = the GM leaves out allies at review; the ants' 5-foot move is the caster's direction (push 'any'); the fireflies' 24-hour immunity to blindness is a reminder.
- Sudden Swarm (rank 4 batch 107): the bites are piercing by default (the GM may change it); the 0-HP rule (1 HP, spell ends) is a note; the creatures in its space are the targeted ones.
- Vital Seed (rank 4 batch 108): the drained creatures are every other token within 15 feet of the target (the caster too, if that close); "the damage a single creature took" is the damage applied after IWR; Erupt waits for the drain card to be finalized.
- QUESTION — Spiritual Attunement (rank 4 batch 109): PF2e 8.5 has no alignment damage/traits. I mapped good → holy and evil → unholy (Strike trait and the opposed resistance); lawful/chaotic do nothing (note), so Axis and the Maelstrom give no rules. Options: keep this mapping; or treat every non-Boneyard plane as spirit resistance; or make the spell note-only.
- Pest Swarm (rank 4 batch 110): the squadron is picked on the card; "exposed to violin spider venom" is the venom's own Fortitude save at its stated DC 24 for those who failed (GM targets them), and its stage is handed off for the GM (Pseudo Afflictions has no Effect for this venom); the webs' "for 1 minute; Escape removes it" is "until it Escapes" capped at 1 minute; "can't use concentrate actions for 1 round" is a note.
- Crystallized Vapors (rank 4 batch 111): the terrain emanation is made with the first ball-of-ice attack (the cast's own card), follows the caster's token, and exempts the caster.
- Ghostly Tragedy (rank 4 batch 112): the GM gives the number of apparitions when the scene ends (the card's control); the caster takes 2d6 void per apparition.
- QUESTION — Conglomerate of Limbs (rank 4, not done): the thrall's statistics beyond 40 HP / Speed 25 / Huge (its AC, saves and the unarmed Strike's attack and damage) come from the necromancer's thrall rules, not the spell text or the fixtures. Options: (a) a token with only the stated HP/Speed/size and the GM rolls its two Strikes, the module posting the Fortitude save vs Grabbed/Restrained for each hit creature; (b) give me the thrall statistics to build; (c) leave it unresolved.
- Pernicious Poltergeist (rank 4 batch 113): Frighten's "Frightened 2 on a failure" also applies on a critical failure; one effect per combat round (the button), the GM targets the creatures in the burst.
- QUESTION — Elemental Tempest (rank 4 wizard focus, not done): it triggers on "an evocation spell" but PF2e 8.5 has no school traits, and it combines its damage with the other spell's before IWR. Options: (a) a card control after the next spell (the caster confirms it qualifies, gives its rank and type), foes within 10 feet take Nd6 of that type separately (IWR applied twice — not the text); (b) the same, but the module refunds the double-applied resistance / weakness for foes the spell also damaged; (c) leave it unresolved.
- Safeguard Secret (rank 4 batch 114): the +4 to concealing skill checks and to saves against extraction share one toggle the player switches on for such rolls (PF2e's own predicate option); a recast removes the caster's earlier Effects from everyone.
- Bottle the Storm (rank 4 batch 115): the resistance covers the first electricity damage after the cast (the triggering effect); the stored amount is min(resistance, that damage); the release is the card's spell attack.
- Community Restoration (rank 4 batch 116): the caster gives the triggering spell's rank and divides the allies' share on the card (the module's TempHP Effects, not PF2e's rank-choice Effect).
- Variable Gravity (rank 4 batch 117): high gravity's "+2 to DCs to resist forced movement / being knocked Prone" applies to the Fortitude DC (Shove, Reposition) and Reflex DC (Trip); jumping, falling and halved forced movement are notes.
- Chromatic Armor (rank 4 batch 118): an 8 (matching color) is the GM's answer of the most recent damage type in the past minute (or a reroll); the GM presses the attacker control after an adjacent creature's attack.
- Shielding Formation (rank 4 batch 119): whether the triggering damage qualifies (physical / spell / magical) is the holder's choice when switching the toggle; the caster's use also gives the 10-minute immunity (no regrant) besides blocking a new casting.
- Necrotic Radiation (rank 4 batch 120): the attended holder's Reflex save is PF2e's roll (not a save card) since its result only sets the spell's time; the GM moves the hazard when the object changes hands.
- Rusting Grasp (rank 4 batch 121): "plus 2d6 persistent on a failed save" applies on failure and critical failure (not doubled), untyped (the text names no type); the item mode is rolled on the card for the GM (objects decision).
- Phoenix Ward (rank 4 batch 122): the trigger is checked after PF2e applies the damage (the caster at 0, fire in it); the absorbed damage is estimated from the damage roll with the creature's IWR (temporary HP not counted).
- Murderous Vine (rank 4 batch 123): the vine's AC/HP are a GM note with a "vine destroyed" control (not a token, as with Skyglass Prison's cage); the crush runs only while that cast's Grabbed holds.
- Life's Fresh Bloom (rank 4 batch 124): "standing on the ground" is token elevation 0; the undead's turn-start Fortitude save is PF2e's roll (no card).
- Bridge of Vines (rank 4 batch 125): the GM draws the 10-foot-wide bridge; "attempt to use the bridge" = entering it; the bridge's AC/Hardness/HP are a note (not a token).
- Life's Flowing River (rank 4 batch 126): the push "along the river's path in the direction of flow" is a push away from the caster (the river runs away from you); "ignores the river's effects until its next turn" = no new exposure until then.
- Ephemeral Hazards (rank 4 batch 127): a failing creature's difficult terrain covers all four hazard squares (not only the touched one); "can't pass through a hazard" and the believed damage type's IWR are GM notes; the success lock is PF2e's AdjustDegreeOfSuccess (failure/critical failure → success).
- Wall of Mirrors (rank 4 batch 128): no duration is stated, so the wall lasts until removed/destroyed (the control stays on the card); concealment across it is a GM note; the sections' stats are a note (not tokens).
- Replicate (rank 4 batch 129): "one quarter of the original's Hit Points" = a quarter of its maximum (the double starts full); missing item bonuses are a GM note; willingness is the caster's confirmation (unconscious needs none).
- Phantasmal Protagonist (rank 4 batch 130): the villain's "Off-Guard (Slowed 1 on a critical failure)" gives Slowed 1 instead of Off-Guard on a critical failure; the protagonist is a module-made NPC token (conjured decision), not PF2e's Kingmaker bestiary actor.
- Dutiful Challenge (rank 4 batch 131): "defeated" = 0 HP; the GM presses the exemption control when another creature's hostile action affects the enemy.
- Chromatic Ray (rank 4 batch 132): the violet's teleport is a 120-foot push away (GM places); blue/indigo run the borrowed spell's own resolution — Petrify (rank 6) and Warp Mind (rank 7) aren't resolved by the module yet, so at 6th+ those are the GM's for now; the critical blue's Clumsy 1 is an Effect the GM removes with the petrification.
- QUESTION — Radiant Heart of Devotion (rank 4 batch 133): no alignment in PF2e 8.5; I made good = caster + allies + holy creatures, evil = unholy creatures, neutral = the rest, with GM reclassification buttons on the card. Options: keep; or use only holy/unholy traits (allies without holy would be dazzled); or make all sides the GM's pick per creature.

## Belittling Boast (rank 5 batch 66) — QUESTION

The text gives the caster "a +1 status penalty" to the boasted statistic, but the Heightened entry says "the bonus and penalty increase to 2". I read it as a +1 status **bonus** (+2 at 8th). Confirm?

## Chromatic Wall (rank 5 batch 67) — QUESTION

The 8 ("Reroll, and creatures that pass through the wall take a -2 circumstance penalty to their saves"): I apply −2 circumstance to saves as an Effect on each crossing creature until the end of its turn, so it covers the wall's save. Should it last longer (for example, while the wall stands)?

## Establish Ward (rank 5 batch 69) — QUESTION

The 30-foot burst has no range, so I place the ward around the caster's position when cast (a GM-selected region can be passed instead). Is that the centre you want, or should it always be a GM-drawn region?

## Forceful Hand (rank 5 batch 74) — QUESTION

The text gives the hand an AC and Hit Points but no saves. I set its saves at the spell DC − 10, as for other conjured objects. Keep that, or should it have no saves (automatically failing, like an unattended object)?

## Shepherd of Souls (rank 5 batch 76) — QUESTION

The module can't stop the triggering damage before it lands, so the reaction runs afterward: the target regains twice the sacrifice (the reduction plus any excess, as the text adds up). Is that acceptable, or do you want a pre-damage prompt?

## Black Tentacles (rank 5 batch 79) — QUESTION

When a creature ends its turn in the area and the tentacles succeed at grabbing it, I also deal the 3d6 ("Any creature you succeed against is Grabbed and takes 3d6"). Should the turn-end grab deal no damage (only the 1d6 to creatures already held)?

## Symphony of the Unfettered Heart (rank 5 batch 84) — QUESTION

"If you fail, you can't target the same effect on the target for 1 day": the module can't tell which effect applied a condition, so the lock is per condition on that target. OK?

## Blossoming Gore (rank 5 batch 91) — QUESTION

The thralls created on a failed save (1, or 2 on a critical failure) are a GM line on the card, as for Create Thrall and Conglomerate of Limbs: a thrall's statistics come from the necromancer's rules, which aren't in the spell text or the fixtures. If you give me the thrall statistics, I can create them as tokens (here and for Conglomerate of Limbs).

## Ravening Maw (rank 5, not done) — QUESTION

PF2e's data gives a Will save (not basic), but the text lists no results for it (the effect is described only as what happens to the target). Options:
- (a) A failure gives the whole effect for 3 rounds and a success nothing (my guess at the missing rows).
- (b) Apply the effect with no save.
- (c) Leave it unresolved until the rows are known. It's the same gap as Restraining Chains, which has rows but no named save.

## Rituals (rank 3 batches 119–121) — interpretations made without asking

- **The confirmed result:** the GM gives the ritual's outcome (and the secondary casters); the module applies it. A resisting target's save that only gates the whole ritual (Rest Eternal, Labyrinthine Prison) is part of that confirmed result.
- **A save the ritual calls for (Portrait of Spite, Geas from 5th):** rolled against a DC the GM gives (the primary check's DC, as Astral Projection's text says for its own save). Is that the DC you want?
- **Portrait of Spite's critical failure** ("you and the secondary casters experience the curse … with the effects of a critical success"): each caster also gets the Will save, as the critical success row gives one. Should the casters get no save (always 4)?
- **Portrait of Spite's 1d6 hours:** the condition applies at once, and the card states the rolled hours over which it takes hold.
- **Geas's Sickened:** card controls the GM presses (a day it couldn't comply: Sickened 1, then +1 a day up to 4; complying: it ends). While it lasts, the module refuses any other reduction or removal.
- **Mindscape Door's "the GM decides":** a choice on the card.
- **Astral Projection's +4 to the save against dying:** behind a toggle on the target, because it applies only to that save.
- **Fortifying Brew and Winter's Breath, the spells the drink casts:**
  - Care spells (Cleanse Affliction, Clear Mind, Sound Body, Sure Footing) are card controls the GM presses for each relevant affliction or condition. Each runs the module's own spell at the stated rank, from the primary caster.
  - Their counteract check uses the primary check's skill. Fortifying Brew says so; Winter's Breath doesn't say, and I used the same. Should Winter's Breath use something else (for example, a counteract modifier from the ritual's DC)?
  - Environmental Endurance (no condition to choose) is cast on each guest at once.
- **Winter's Breath's success: "one of the five spells"** — the text lists four. I offer the four, one per guest. Is there a fifth you want (for example, the temporary Hit Points as a choice)?
- **"You and your guests" / "you and the other drinkers":** the primary caster plus the creatures the GM targets as guests or drinkers. A secondary caster who drinks is targeted like any guest.
- **Rituals carrying a disease (Plague Shot, Mosquito Blight):**
  - The disease is built from the ritual's own stage block as Pseudo Afflictions' Effect. Pseudo Afflictions has no Siege Sickness, and Mosquito Blight's critical success changes the stages.
  - **Plague Shot's critical failure** ("exposed … at stage 2"): each targeted creature saves. A failure starts at stage 2; a critical failure one stage later, as for any exposure.
  - **Plague Shot's hits:** the GM presses a control after a hit and targets the creatures within 60 feet. The ten pieces of ammunition aren't counted.
  - **Mosquito Blight's DC:** the disease names no DC, so the GM gives one (the primary check's DC).
  - **Mosquito Blight's area:** the area has no size in the text or data. Entering creatures, and each day's residents, are exposed by a GM control. Arthropods get their +1 by a GM control, because PF2e has no "arthropod" trait.
  - **Mosquito Blight's hive:** a token beside the caster. At 0 HP, or when the GM says it was removed, the ritual ends 1 hour later.
- **Secure Siege Weapons:**
  - A siege weapon is a vehicle or hazard token the GM targets; its Hardness and maximum HP are raised by Effect rules.
  - The enemy's save and the launch's fortune are GM controls.
  - The misfortune lasts while the ritual does, behind a toggle for Load and Strike checks with the weapon. "Load" is not a PF2e roll the module can tell apart.
- **Wild Feast:**
  - The −2 to Command an Animal and Demoralize goes on the creatures the GM targets in the (huge) area.
  - On a critical success, the masters' daily check is a GM control against the ritual's DC (the GM's). The master rolls their better of Diplomacy and Nature.
  - The casters' "forbidden cravings" curse is a record carrying the text, because the ghoul curse's rules aren't in the text.
- **Loyalty's Ward:**
  - The criteria are asked at the cast. "A creature meeting them tries to leave" is a GM control (the module can't judge the criteria or see the room).
  - The DC is the higher of the caster's class DC and spell DCs, or the GM's when the caster has neither.
  - The critical failure holds the other creatures, with the critical success's 24-hour wait (the text gives none).
- **Footholds and Foothills:**
  - The option is asked at the cast. The area is the GM's selected region, or a circle of the area's size at the caster (or a given position).
  - **Roughen:** difficult terrain, or greater difficult terrain on terrain already difficult.
  - **Smooth:** eases the selected region's own terrain by one step. Map terrain not in a region is a GM line.
  - **Add and Remove:** GM lines for the map. The crater's fall is a control: 15 bludgeoning (half of 30 feet) and Prone.
- **Stances with their own Strikes (Clinging Shadows Stance, Wild Winds Stance):**
  - The stance Effect is generated from the text (decision 10's rule for forms), not PF2e's feat Effect, which isn't in the verified fixtures and lacks Clinging Shadows' +2 to the Escape DC.
  - That bonus is +2 circumstance to the caster's Athletics DC.
  - Wild Winds' ignoring of concealment and cover is a note on the Strike.
  - Entering a stance ends the caster's other stance Effects.

## Answered 2026-10-03

- **Restraining Chains:** treat the unnamed save as Reflex (B). Done in rank 5 batch 94. The rule: save results with no named save, on a restraint the creature Escapes from.
- **Ravening Maw:** a failure gives the whole effect, a success nothing (A). Done in rank 5 batch 94.
- **Conglomerate of Limbs:** the thrall rules you gave (from the thrall trait). Done in rank 5 batch 94. Applied to every thrall-making spell at ranks 1–5 (rank 3 batch 126): Create Thrall, Bloody Tendrils, Blossoming Gore, Bind Heroic Spirit. Spells that destroy a thrall (Zombie Horde, Necrotic Bomb and the others) remove the module's thrall tokens.
- **Elemental Tempest:** B with the caster's manual confirmation (schools were removed in the Remaster; legacy spells may still count as evocation). Done in rank 5 batch 94.
- **Note-only rituals count as resolved.** The census now counts them.

# Ranks 6–10 pass (from 2026-10-03)

The user asked for ranks 6–10 to be done with every decision saved for the end. Questions are marked QUESTION; the rest are interpretations made without asking.

## Rank 6 batch 1 — interpretations
- **Chain Lightning:** the chain is the targets in the order targeted. Each must be within 30 feet of the one before, or the card refuses. Every target rolls its save; at Finalize, the targets after the first critical success are excluded. Line of effect is a reminder.
- **Blade Barrier:** a lingering line placed by the GM. The save comes when it's cast and as a turn ends inside; a creature trying to pass through is a GM control. The success's push on creation and the critical failure's stop on passing are card reminders.
- **Explosive Barrage:** the GM places the 20-foot burst and the 1d4 extra bursts (rolled from the reminder), then targets every creature caught (each once).
- **Flame Vortex:** the creatures in the cylinder save when it's cast and after each Sustain's move; those it moved through use a GM control (once per round each). The ceiling restriction is a note.
- **For Love, For Lightning:** each arc is the card's button (the caster picks the enemy within 30 feet of the weapon each time). Drawing the weapon ends the spell: delete the Effect.
- **Living Thunderbolt:** PF2e's Effect plus a rule that makes Escape checks successes. The rule sits behind a toggle (on by default) that the GM turns off when the hold is magical and of a higher rank. Moving through a creature is the card's button.

## Rank 6 batch 2 — interpretations
- **Poltergeist's Fury:** the damage is only when it's cast; Sustaining grows the storm for its cover only. An ally's success becomes a critical success (alliance read from PF2e). The caster's lesser cover is +1 circumstance to AC while the spell lasts.
- **Phantom Orchestra:** the GM moves the burst's region before each Sustain's explosion.
- **Frozen Fog:** Mist's concealment, the save as a turn starts inside, and a failure's Clumsy. The −10 Speed penalty is a rule Effect for the same minute; it doesn't end early if the Clumsy is removed early.

## Rank 8 batch 1 (rituals) — interpretations
- **Binding Circle:** the called creature is targeted and must be at most double the rank's level. The critical success's hold is a 1-day record on it; the bargain is the GM's.
- **Separation:** both targets get the "separated" record (100 feet, the DC 5 flat check) for 1 month, or 1 year on a critical success. The unwilling targets' Will save is part of the confirmed result.
- **Freedom:** PF2e's Petrified is ended on the target; other imprisoning Effects are the GM's to delete.
- **Imprisonment:** the caster picks the form (Object from 9th, Oubliette at 10th; a critical success allows one rank higher). The form is a record with its text. The chains' Will save, Hardness and HP are in that text, for the GM.
- **Sleepless Season:** the GM gives the ritual's DC. Each living targeted creature saves; a failure gets the curse for 1 week. On a critical success, a GM control raises Enfeebled each fatigued day (to 4), locked while fatigued; another control releases the lock when it stops being fatigued. Becoming Fatigued after 16 hours awake is the GM's (PF2e condition).
- **Void Harvest:** the area's controls for the year: a living creature's first damage each day (Will or Doomed +1), undead inside (vitality resistance equal to their level) and, on a critical success, living creatures inside (−2 to saves against death and void). The 1-mile area and its yearly sustaining are the GM's.
- **Awaken Curse:** the curse's holder is targeted and gets a record of the counteract rank change. The curse's leaps and the critical failure's transfer are the GM's.
- **QUESTION — adventure rituals not done:** Terminate Bloodline (its result table belongs to relatives' saves, not to the ritual), Rite of the Red Star, Raga of Remembrance, Purify Tanglebriar and Perfection of Essence. They name specific places and creatures and have their own subsystems. Should these be automated (with guesses about their subsystems), or left as they are? **ANSWERED 2026-10-03:** leave them to the GM (adventure books hold more). Done in rank 9 batch 2: a GM note whispered with the ritual's text.

## Rank 6 batch 3 — interpretations
- **Desiccate:** water and plant creatures are those with PF2e's water or plant trait (one degree worse). A creature "without significant moisture" is the GM's yes/no on the card (immune if no).
- **Unfolding Wind Crash:** the jump is the caster's reminder. The GM moves the caster's token, then targets the creatures in the 20-foot emanation around the landing spot.
- **Devouring Void:** only living creatures (PF2e mode of being) are exposed. Leaving the area (a move action, Reflex save, disrupted on a failure) is a note, not a control.
- **Field of Life:** the living are healed and the undead harmed as each turn starts inside. A creature that is neither (a construct) is untouched. No save for the undead (the text states none).
- **Stone to Flesh:** the targeted creature's Petrified is removed, with any Effect that grants it. Turning a stone object to flesh is a GM note on the card (cast with no creature targeted).
- **Hasted Assault:** Quickened for 1 minute via an Effect; the Stride/Strike-only limit is the note.
- **Skeleton Army:** each phase's damage is read from the text (the item has none) and rolled from that formula.

## Rank 7 batch 1 — interpretations
- **Power words / Fatal Aria:** "dies instantly" sets HP to 0 and PF2e's Dead status (for a PC too). "Drops to 0 HP and becomes Dying 1" sets HP to 0 and Dying to at least 1. Power Word Kill's "+1 if already Dying" is honoured; Fatal Aria doesn't say it, so an already-Dying creature keeps its higher value. The temporary immunity is per spell (any caster), held by an Effect on the target.
- **Power Word Stun's "Stunned for N rounds":** PF2e's Stunned condition held by an Effect for that time (its value isn't used).
- **Implosion:** the corporeal-only rule is a note. "Can't affect more than one creature per turn" is the GM's (one press per Sustain).
- **Suffocate:** the suffocation rules (holding breath; suffocating) are a GM note on the failure and critical-failure rows. Both rows also apply damage or Unconscious, per your behaviour-note rule. Unconscious lasts while the spell is sustained. "Needs to breathe" is the GM's yes/no.
- **Orb of Twisting Fate:** not done. Its success row is behaviour only (Stride randomly or do nothing), which your rule keeps blocked.

## Rank 7 batch 2 — interpretations
- **Sudden Transposition:** each teleport is a GM reminder (move the token; on a critical success the target may move itself). It counts as resolved because both failing rows also deal damage, as with push notes. The 20d10 on a critical failure is the item's 10d10 doubled.
- **QUESTION — Collective Transposition** (and teleport-only rows in general): its rows only teleport, with no damage or condition. Under your behaviour-note rule I left it unresolved. Should teleport-only rows count as resolved with a GM reminder (the GM moves the tokens), the way pushes are? **ANSWERED 2026-10-03:** only when the distance is in miles or more (beyond any battle map). Collective Transposition (within 30 feet) stays unresolved.
- **Frigid Flurry:** "all foes" means enemies by PF2e alliance; allies are ineligible. Being carried to the line's end and the immunity during the carry are a caster reminder (no Effect, since it lasts only for the move).
- **Accelerated Decomposition:** the caster picks one condition on the card when a target succeeds (one pick per cast, shared by every succeeding target, since there is one target). "Drained 1 for 1 round" keeps the text's 1 round.
- **Momentary Recovery:** the caster's Slowed 1 is automated. The teleport, the actions during it and their limits are the note.
- **Hypnopompic Terrors:** "a sleeping creature" is the GM's yes/no per target (not read from PF2e's Unconscious). Waking it (removing Unconscious) is in the question's text, for the GM.
- **Eclipse Burst:** "additional void damage to living creatures" is left to PF2e's void rule (no damage to undead or constructs; verified live). It's back on the save route, recorded in withdrawn-routes.json under "restored". Counteracting magical light is the existing reminder.
- **Never Mind, Orb of Twisting Fate, Restore Ground, Deity's Strike:** not done yet. Never Mind's critical failure is only an intellect loss and an "NPC under the GM's control" (no condition), so your behaviour rule keeps it blocked.

## Rank 8 batch 2 — interpretations
- **Arctic Rift:** "slowed 1 as long as it's immobilized" means both end when it Escapes (the spell DC). Breaking the ice is the GM's (remove both conditions); its HP rises 5 per rank above 8th.
- **Time Beacon:** the rewind itself is the GM's. The card's Counteract button rolls once per harmful effect the GM names; if any check fails, the caster can't return.
- **Project Image:** a note on the caster. Originating spells from the image, and its AC and saves equal to the caster's, are the GM's.
- **Migration:** the five Speeds are BaseSpeed rules on each targeted creature for 8 hours. Target the caster too to include them. PF2e takes the higher of BaseSpeed and the creature's own Speed. Animal form and its limits, the immunities "at the GM's discretion" and travel speed are the note.
- **Wall of Force:** placed along a 50-foot line; the 20-foot height is a note. The wall's HP is shown on the card, not tracked; destroying it means ending the Effect, which removes the Foundry wall.

## Rank 6 batch 4 — interpretations
- **Divine Decree:** only creatures at or below the stated level (10 at 7th, +2 per rank) attempt the second Will save; it reads PF2e's creature level. "Sent back to its home plane" is a GM note (the GM knows each side's home plane). The second save's critical failure kills (death effect).
- **Petrify / Lignify:** "fully unable to act" means Slowed equal to its actions: 3, or 4 if it's Quickened when the save resolves. Other unusual action counts are the GM's. Lignify's "non-magically petrified, turned to wood" is PF2e's Petrified condition. "The spell ends if the slowed condition is removed": removing the Slowed Effect ends it. Lignify's plant bonus also applies to its end-of-turn saves.
- **Petrify's old route:** it used to match Petrify by compendium ID through a separate Ongoing workflow (asking the GM for the action budget). That ID match is removed in favour of the text-driven save card, per your "rules, not names" rule.
- **Medusa's Wrath, Calcification:** not done. Medusa's Wrath is an unarmed Strike with these rows, and Calcification destroys a thrall and adds bludgeoning weaknesses with PF2e Effects. Both are left for a later pass.

## Rank 9 batch 1 — interpretations
- **Frost Pillar:** a success (or critical success) is unaffected apart from stepping to an adjacent space of its choice (GM moves the token). Restrained lasts while the spell is sustained; breaking the ice is the GM's (end the Effect). The text gives no Escape, so none is offered.
- **Uncontrollable Dance:** the success row's "3 rounds" and the failure's "1 minute" are both Off-Guard's time and the note's. "Can't use reactions" and the dancing are the note (PF2e has no rule for them).
- **General rule (new):** a behaviour note with no time of its own lasts as long as the one timed condition its row applies.
- **Dimensional Excision:** the basic save halves or doubles the persistent bleed too (PF2e's own scaling, checked live). "Not on its home plane" is the GM's yes/no per target, with a −4 status penalty. Reduced to 0 HP means dead (PF2e's Dead status); the gear left behind is a reminder.
- **QUESTION — Catch Your Name, Telepathic Demand:** their result is information that isn't PF2e data (a private name and location) or another spell's effect (Suggestion's command). Should these resolve with a GM whisper of what the caster learns or commands, or stay unresolved? **ANSWERED 2026-10-03:** resolve by commands to the GM. Done in rank 9 batch 2.

## Rank 7 batch 3 — interpretations
- **Hungry Depths:** creatures already inside when it grows on a Sustain don't save again; only those it moves through do, as the text says. Growing (+5 feet, to 15) and moving (10 feet) are the GM's region edits. Underwater, its shape is the GM's.
- **Mask of Terror:** "hostile action" is any the GM judges hostile; the GM presses the card's button and targets the creature acting. Frightened 2 applies before its action; on a critical failure the action is voided by the GM. At 8th, a multi-target hostile action gets one save (one press).

## Rank 6 batch 5 — interpretations
- **Spellsurge, Planar Palace, Ethereal Jaunt, Proliferating Eyes:** notes (counted resolved per the note-only rule). Their conditions are only mentions: an example, an invisible entrance or sensor, and how the Material Plane looks from the Ethereal Plane. Ethereal Jaunt's damage when pushed out of an object at the end is the GM's (in the note).
- **Proliferating Eyes:** the note goes on the caster (the eyes are theirs to use); the eyes spreading by touch is the GM's.
- **Mislead:** the caster is Invisible while sustained (the hostile-action exception is in the note); the duplicate's actions are the GM's.

## Rank 6 batch 6 — interpretations
- **Zealous Conviction:** "must comply with your request" and the repugnant task's end-of-turn Will save are the GM's (in the note). PF2e's Effect carries the temporary HP and the Will bonus.
- **Scintillating Safeguard:** one damage type chosen by the caster for all targets; the resistance lasts until the target next takes damage (the triggering effect's initial damage).
- **Flaming Fusillade:** the caster casts Ignition from their own spells (the card reminds them); Ignition's one-action casting during the minute is the GM's.
- **Not done (Effect + note):** Sacred Covenant (PF2e's Effect grants 50 temporary HP at once, but the text grants them only when the target would drop to 0), True Target (its designated-creature mark needs a target picked at creation, and "the first attack only"), Tangling Creepers (an area plus a Sustain attack), Prismatic Armor (Chromatic Armor's attacker saves with Blinded), Apex Companion.

## Rank 7 batch 4 — interpretations
- **Prismatic Armor:** all seven colors at once (no roll, so no 2/3-action choice); Blinded on a critical failure lasts until the end of the attacker's next turn, like Chromatic Armor's Dazzled.
- **Apex Companion:** "your animal companion" is the GM's yes/no on the target. The 15-foot reach is set on its size rule. Ignoring difficult terrain is a note (PF2e has no rule for it).

## Rank 7 batch 5 — interpretations
- **Regenerate:** PF2e's regeneration Effect carries the healing and the acid/fire deactivation; the "can't die / Dying stops at 3 / Wounded 4 stays unconscious" rules are the GM's (note).
- **Incarnate Tempest of Shades:** the critical failure's Fleeing lasts 1 round (the "or until no longer frightened" can only end it earlier if the GM removes the Frightened).
- **Summon Stampede:** the GM targets the Large-or-smaller creatures whose spaces it enters (hazards and structures are the GM's), and handles the terrain counteract.

## Rank 8 batch 3 — interpretations
- **Spiritual Epidemic:** "while it's affected" means while any of its conditions from this spell last (the GM judges). Each spread card can be pressed for every new caster, with no limit or immunity (the text gives none). A caster that critically succeeds isn't affected and so gets no card.

## Rank 7 batch 6 — interpretations
- **Special thralls:** follow your thrall rules (they fail every check, and checks against them succeed). Thrall Charge's extra dice are a toggle on the thrall's Strike (turn it on when Thrall Charge orders the Strike). "Up to 5" lancers: the caster gives the number (5 by default).
- **Controls are the GM's to press:** the nightmare entering a creature's space (its save), the graveyard appearing (Prone save for creatures within 10 feet) and Striding (five base thralls), the perfected thrall's critical hit (up to four base thralls), the lancers' 5 piercing (once per Strike, the GM's), and resummoning the nightmare once its token is gone (once per round). Base thralls from controls are placed automatically near the special thrall.
- **Perfected Thrall's "loses 20 HP instead of being destroyed by an ability"** is a note (other spells' destroy-a-thrall steps don't check it yet).
- **Telekinetic Bombardment:** the GM places the burst or line and marks the rubble's difficult terrain (it lasts until cleared; the spell has no duration).

## Rank 10 batch 1 — interpretations
- **Hero's Defiance:** the caster's 6d8+20 healing is applied when the spell is cast; the GM then applies the attack's damage. The trigger and the Refocus limit are notes. Life Siphon and Breath of Life (already automatic) now show their trigger as a note too.

## Rank 6 batch 7 — interpretations
- **Nature's Reprisal:** the GM presses the per-square control for an enemy entering hazardous squares (squares that were already difficult terrain from plants). The enemies-only difficult terrain is a note, not a region (a region would slow everyone).
- **Phantasmal Calamity:** the "believes it's trapped" note lasts the Stunned condition's 1 minute; if the end-of-turn Will save ends the Stunned early, the GM removes the note.
- **Not done:** Visions of Danger (a lingering area whose disbelievers stop taking damage; needs a per-creature exemption), Entrancing Eyes (the critical success's immunity to this casting, and the Sustain focus action), Heartbolt (heal-or-harm on the target and a second heal-or-harm emanation around it), Field of Razors (no duration in its data, and a growing area), Falling Stars (four areas, one save, each damage type once).

## Rank 8 batch 4 — interpretations
- **Confusing Colors:** the critical failure's Confused after the Stunned ends is a note for the rest of the spell (the GM applies Confused once Stunned ends). "Currently affected by the cloud" means holding Confused or Stunned from it. Creatures within 20 feet outside the cloud being Dazzled is a GM note.
- **Vibrant Pattern:** "to a maximum duration of 1 minute" is the Blinded condition's duration; its end-of-turn save only counts once the creature is outside the pattern.

## Rank 8 batch 5 — interpretations
- **Canticle of Everlasting Grief:** PF2e's Effects carry the whole curse (Frightened included), so the rows don't apply Frightened separately. The critical failure's aura gives allies within 15 feet PF2e's own allies' copy (bonuses suppressed, no Frightened).
- **Warp Mind:** "spends the first action on its next turn with the Confused condition" = Confused until it completes that first action.
- **Not done:** Unblinking Flame Ignition (PF2e's Effect covers the senses, fly Speed and Quickened, but the 1d12 fire to creatures starting their turn within 5 feet needs an aura-damage control the module doesn't have yet).

## Rank 6 batch 8 — interpretations
- **Necrotize:** one 1d4 roll per cast picks the body part for every target (the text says "roll … to randomly determine which" once). The critical failure's "second debilitation" is one pick per cast on the card; if the caster picks the rolled part again, the creature just holds two copies (the text means a different one).

## Rank 7 batch 7 — interpretations
- **Defy the Gods:** "Drained 1 and Stupefied 1 for 1 round" gives both conditions that duration. The caster's resistance comes once per cast, however many targets qualify (it's one Effect, 1 minute).

## Rank 7 batch 8 — interpretations
- **Pollen Pods:** the GM presses a bulb's control when a creature moves adjacent to it or it's touched or damaged (AC 5); the bulbs' spacing is a note. The old one-time save stays listed as a withdrawn route ("Moved, not lost").
- **Curse of the Spirit Orchestra:** the success's curse lasts until the start of the caster's next turn. The musicians are narration (no token).

## Rank 8 batch 6 — interpretations
- **Spirit Song:** "until the beginning of its turn" ends at the start of the affected creature's next turn. The table is treated as a basic save because its rows are exactly no/half/full/double damage.
- **Not done:** Ray of Corruption (a spell attack whose hit leads to a basic save, a critical hit worsening that save, and objects melting), Awaken Entropy (a growing area whose damage die steps up on each Sustain and switches to force for creatures void can't harm), Unbreaking Wave Containment (repeated spell attacks on Sustain), Patron's Protector (a familiar form with its own actions).

## Rank 6 batch 9 — interpretations
- **Suspended Retribution:** once the omen activates (the target takes the chosen action and saves), the spell ends — the text describes a single strike of the sword, noose or skull. The caster's chosen trigger isn't recorded by the module; it's in the note for the GM.

## Where the ranks 6–10 pass stopped (2026-10-03)
Resolvable spells went from 1608 to 1689 of 1870. By rank (resolvable/total): 6: 36→65 of 117; 7: 26→52 of 87; 8: 18→34 of 67; 9: 14→21 of 60; 10: 13→19 of 39.
The ones left mostly need a new subsystem rather than another reading of the text:
- Option incarnates with arrive/depart choices (Summon Irii, Summon Elemental Herald, Incarnate Kaiju and others), battle and monster forms (Monstrosity Form, Qi Form, Avatar).
- Two-round spells (Vampiric Revelry, Metallic Meteorite Glyph), and moving, growing or reshaping areas (Whirlpool, Whirlwind, Awaken Entropy, Field of Razors, Falling Stars, Planar Collision).
- Disbelief exemptions inside a lingering area (Visions of Danger, Shadow Raid), an aura that damages creatures near the caster (Unblinking Flame Ignition), and attacks that lead into saves (Ray of Corruption).
- Behaviour-only rows that your rule keeps blocked (Orb of Twisting Fate, Never Mind, Temporal Ward, Repulsion), plus the QUESTIONs above.

## Rank 9 batch 2 — the user's answers applied (2026-10-03)
- **Adventure rituals:** identified by rule — an uncommon, rare or unique ritual published in an adventure or a Lost Omens setting book that no route resolves. That also gives 30 out-of-scope adventure rituals the GM card; rulebook rituals (Resurrect, Control Weather …) are unchanged.
- **Telepathic Demand:** "1 month" of immunity is 30 days (PF2e Effects count days).
- **Teleport-only rows:** the miles-or-more rule is recorded; no remaining spell resolves by it alone yet (Forest of Gates also heals as a night's rest, which needs building).

## Rank 6 batch 10 — interpretations
- **Chromatic Image:** each destroyed image rolls its own color (the text says "whenever a foe destroys one of the images"). The attacker is the creature the GM targets when pressing the Mirror Image control; without a target the card only names the color. A missed attack that destroys an image counts as the foe destroying it.
- **Cryostasis:** the ice block's AC, Hardness and HP, and the target being untargetable while the ice holds, are the GM's (note). Breaking the ice ends the spell (the GM ends the note).

## Rank 6 batches 11–12 — interpretations
- **Tentacular Innervation:** only PF2e Strikes with the unarmed trait or category qualify. Grabbed lasts the spell's minute unless the target Escapes (the GM deletes the Effect); severing the tentacles is the GM's.
- **Crusade:** treated as a note (no condition or damage). The tier a creature falls in, and the Will save at 15th, are the GM's.
- **Not done:** Corrosive Body (temporary HP on the first acid retaliation each round), Shock to the System (revives a creature dead within a round).

## Rank 9 batch 3, rank 7 batch 9 — interpretations
- **Unblinking Flame Ignition:** the aura burns every other creature starting its turn within 5 feet, allies included ("any creature"), not the caster.
- **Visions of Danger:** a disbeliever keeps its exemption for the rest of the spell. The GM decides when a creature may try (after a critical success on its save, Interacting with the monsters, or Seeking them) and presses the control; the module doesn't prompt after a critical success by itself.

## Rank 7 batch 10 — interpretations
- **Entrancing Eyes:** "immune to this particular casting" is immune to this caster's spell for its minute (a second casting by the same caster within that minute would also skip the creature). The Paralyzed for a creature already Fascinated by the eyes is a note on the failing rows (the GM applies it when the focus caused the save).

## Rank 6 batch 13 — interpretations
- **Dominate:** "until the next time you make your daily preparations" is 1 day, as PF2e's Effects write it. The 10th-rank "unlimited" version is refused on the card (resolve it by hand).
- **Never Mind:** this resolves your earlier "not done" note. The critical failure isn't behaviour only: its −5 Charisma, Intelligence and Wisdom modifiers are applied by an Effect. The critical failure row doesn't also give Stupefied (the text doesn't say "as failure").

## Rank 6 batch 14, rank 9 batch 4 — interpretations
- **Claim Undead:** when the undead's end-of-turn save frees it, the following Stunned 1 and Confused are a note (the GM applies them). An undead controlled by someone else: the GM rolls the controller's Will save and enters its result for the target.
- **Unspeakable Shadow:** the critical failure's floor goes on even if the creature then dies (harmless). The shadow behaviour is a note only while Frightened by the spell.

## Rank 6 batches 15–16, rank 7 batch 11 — interpretations
- **Manifold Lives:** "While affected" is the failure's minute (the Stupefied 2's time).
- **Spellwrack:** the GM reports each spell with a duration that affects the target; the module adds the persistent force damage (PF2e's condition). Shortening other spells' durations is the GM's.
- **Inexhaustible Cynicism:** the GM decides at each turn's end whether the creature Sought or interacted to disbelieve; the control deals the 6d6 when it didn't.

## Rank 6 batch 17 — interpretations
- **Cast into Time:** the damage and Sickened apply when the card is finalized (the creature returns by the end of the caster's turn); hiding and returning the token is the GM's.

## Second stop (2026-10-03, after "continue working on rank 5-10")
Rank 5 was already complete. Resolvable spells went from 1698 to 1715 of 1870 in this stretch, with new support for: a borrowed spell's images with a rolled retaliation (Chromatic Image), a dying-creature target check, a damaging caster aura (Unblinking Flame Ignition), a Disbelieve control for a lingering area (Visions of Danger), per-casting immunity and a Sustain focus control (Entrancing Eyes), Controlled with its saves (Dominate, Claim Undead), attribute modifiers set by an Effect (Never Mind), a fixed-time condition floor and save-or-die (Unspeakable Shadow), and "spell-affected" / "no-seek" triggered damage (Spellwrack, Inexhaustible Cynicism).
- **Not done in this stretch:** Shadow Army (a lingering area with a cast-time condition choice and a lasting one-degree-better rule), Vitrifying Blast (a weakness that tracks the Slowed value), the single-form incarnates Beseech Arcanotheign and Jassim's Allegiance (named manifestations, trait-gated depart effects), Shock to the System (revival), Corrosive Body (temporary HP from retaliation).

## Growing areas (2026-10-03, after "work on spells that have areas that grow")
Resolvable went from 1715 to 1719: Awaken Entropy (rank-6 batch 18), Rose's Thorns (rank-6 batch 19), Voracious Gestalt (rank-9 batch 5), Divine Aura (rank-8 batch 7).
- **Awaken Entropy:** the force damage replaces void for a creature that PF2e's data says void doesn't affect (constructs, undead and the like). The growth and the dice step happen on the first Sustain each turn, never past 40 feet or d12.
- **Rose's Thorns:** the per-square damage (5, or 8 from rank 9) is the GM's hazard control; the area grows 5 feet on every Sustain.
- **Voracious Gestalt:** whether a slain creature was threat enough to feed the gestalt is the GM's call. The GM's soul control works once a round and adds 20 feet and 1d6 to the turn damage, with no limit on how far it grows. At review, the GM leaves out creatures that aren't living or that the caster doesn't choose.
- **Divine Aura:** PF2e's creatures no longer carry alignment traits, so "opposite alignment" is the GM's call. The allies' Effect has toggles for +2 (opposite creature) and +4 (its Controlled effects, or creatures it summoned), and the GM presses the melee-hit control for the Will save. The caster doesn't get the Effect ("allies in the area").
- **ANSWERED (1 minute; done in rank-6 batch 20, 1720 resolvable) — Field of Razors:** neither the data nor the text gives a duration (the data says not sustained, value empty). Should the thicket last until the GM ends it in Ongoing spells, or 1 minute, or something else? With that settled, it's difficult terrain, per-square damage (5 slashing, +2 per rank) and a caster's control to grow it 5 feet (up to 4 times, to 40 feet) when a creature inside takes slashing, piercing or bleed damage.
- **Not done:** Control Sand. Its growth is one of three modes switched on each Sustain (Sand Shield is a Shield Block shield with Hardness 14 and 21 HP; Sandblast is a basic save on one creature; Sandstorm grows the area to 30 feet with damage and suffocation), on top of a dazzling save while inside. It needs a mode-switching subsystem.

## Third pass (2026-10-04, after "lets keep working on spells rank 6 - 10")
### Rank 7 batch 12 — interpretations
- **Orb of Twisting Fate:** on a success the note lasts until the end of the target's next turn ("The spell then ends"). On a failure it lasts the spell's 10 rounds, with a Will save at the end of each of its turns that ends it. The random direction of the Stride is the GM's.
- **Beheading Buzz Saw:** it has no critical success row, so a critical success is unaffected, as on a success. Whether a creature has a head it needs (or this is its last head) is the GM's call: the card reminds them to skip the second save for any other creature.
- **Expunge Blood:** "Drained 1 and Clumsy 1 for 1 round" times only the Clumsy; Drained keeps its own recovery (your ruling on such lists, 2026-10-02). The bleeding rise applies to the creature's Clumsy (PF2e keeps one Clumsy per creature).
### Rank 8 batch 8 — interpretations
- **Maze of Locked Doors:** being trapped in the hallway is the GM's to play off the map: hiding the token, the doors' checks, and the counteract against teleports inside (all on the card's reminder). The note's own time is automated; the GM ends it early when the doors are passed.
- **Medusa's Wrath:** the later saves are the item's Fortitude save, although the first check is the caster's Strike. As with Petrify, the ongoing save's incapacitation trait isn't applied. Slowed 3 takes all 3 actions, so the creature is Petrified then (4 if it's Quickened).
### Rank 9 batch 6 — interpretations
- **Massacre:** "every living creature in the line" for the backlash means the card's living targets, including those above the level limit (the GM targets everyone in the line). A creature counts as killed if it's at 0 Hit Points or dead when the card finishes.
### Rank 8 batch 9 — interpretations
- **Falling Sky:** "flying" means the token is above 0 elevation, and the area's bottom is the ground; if the cylinder starts in the air, the GM adjusts (card reminder). "Twice as much damage as if they had fallen the distance" is the distance itself (PF2e's falling damage is half), at most 60. A flyer that critically succeeds still takes the fall but isn't Prone.
### Rank 7 batch 13 — interpretations
- **Darklight:** the spared allies are the allies the caster targets when the area starts (up to four). The caster isn't their own ally, so they aren't spared; the GM leaves them out at review if they stand inside. The light and sight rules (light sources, darkvision as Concealed, the spared allies seeing through) are GM notes.

## Fourth pass (2026-10-04): "6 and 12 can be skipped and count as resolved. all other group features i want you to build the feature and then test it"
### Rank 8 batch 10 — GM-handled spells and GM options (your ruling)
- Groups 6 and 12 (16 spells) are recorded as your ruling in `src/compiler/user-rulings.js`, keyed by PF2e's compendium ids. The compiler reads the ruling only when no rule automates the spell; the card whispers the text to the GM.
- Per your follow-up ("spells that can affect creatures have an option to do so … chosen by the gm"), 9 of the 10 world-scale spells have GM-only option buttons. Shipwreck affects vehicles only, so it has none. Interpretations: Earthquake's fissure fall is 40 feet (20 bludgeoning, landing Prone); Trim the Blight's failing rows take full damage; Theogeny's fly Speed is the land Speed; Veil of Broken Reality's Slowed lasts the day, and its "16th level or lower critically fails" is the GM's correction on the card.

### Rank 8 batch 11 — incarnates by parts (group 1), interpretations
- **Holy Host (Angels):** the smoke has no stated duration. It lasts 1 minute, as Unholy Army's own smoke does, and the GM can end it sooner in Ongoing spells. **QUESTION:** keep 1 minute, or make it last until the end of your next turn?
- **Incarnate Archmage:** "beneficial spells' durations don't decrease within 100 feet" is a GM reminder on the card; the module doesn't pause other spells' durations. Blocking the force burst with Shield is the GM's too.
- **Summon Oliphaunt of Jandelay:** a creature smashed to powder at 0 HP, unattended objects destroyed (or saved), and force effects destroyed are GM reminders beside the save.
- **Beseech Arcanotheign:** paying the memory price and the mythic Recall Knowledge are the caster's own, shown as a reminder.
- **Incarnate Wild Rose:** "Grabbed/Restrained by a vine for the duration of the spell or until they Escape" lasts until the creature Escapes; the card reminds the GM that it ends with the spell.
- **Summon Warden of the Wild:** a spell the warden casts with no stated rank is cast at that spell's own rank. "Reduced to 3 rounds" shortens the Effects it makes. The exceptions (Mountain Resilience isn't shortened by hits; Feet to Fins keeps the land Speed) are added to those Effects' text for the GM.
- **Summon Irii:** "while within 30 feet of the fate/fortune" is the GM's: the Effect lasts the spell, and the GM removes it from a creature that moves away.
- **Summon Ancient Fleshforged:** "a skeleton or other undead made almost entirely of bones" is the GM's yes/no for each target on the save card. For the Thorn Caller, a creature that was invisible gets Concealed added, and the GM treats it as no longer invisible.
### Rank 7 batch 14 — control (group 2a), interpretations
- **Puppet Strings:** the forced Strike's critical hit doubles its 7d6, as a Strike's does. Forced Strides are the GM's (the caster names the path; the token is moved by hand).
- **Possession:** when the possessed body dies, the controls card's save is the caster's own Fortitude against their spell DC; the GM ends the spell in Ongoing spells. Choosing a more favorable degree is the GM's correction on the save card.
- **Song of the Fallen:** the animated dead die again when their Effect ends (the spell's maximum, or when the GM ends it because the caster stopped Sustaining).
### Rank 7 batch 15 — conjured tokens and copies (group 2b), interpretations
- **Duplicate Foe / Reanimate Foe:** PF2e keeps minions out of the encounter, so a copy acts on its caster's turn; "each turn after it takes its actions" it loses its Hit Points when the caster's turn ends.
- **Lifewood Cage:** Hardness 20 is resistance 20 to all damage on the cage token. Being trapped is a note (the GM keeps the token inside); being pushed out is the GM's move.
- **Elemental Confluence:** Water's +2 circumstance bonus against a target inside the confluence is added in PF2e's attack dialog (the button says so). "Choose up to two elementals" is the caster's limit on the buttons each Cast or Sustain.
- **Dragon Turret:** the breath's type is the casting entry's tradition.
### Rank 6 batch 21 — group 2 rest, interpretations
- **Weapon of Judgment:** the damage type is picked on the card (bludgeoning, piercing, slashing or spirit); the GM rules when spirit is worse for the creature. Its attack number is picked on the card, separate from the caster's.
- **Shambling Horror:** the horror keeps its living Speeds and physical melee Strikes "as the GM decides" — the chosen stat block is used as is, and the GM adjusts.
- **Patron's Protector:** "AC becomes 28" is the difference from the familiar's current AC, so later changes to its AC still count. The Protector's Shove push is moved by hand.
### Rank 7 batch 16 — group 3 part 1, interpretations
- **Infinitesimal Collapse Field:** "enters or starts their turn in the emanation" — an enemy already inside when the spell is cast is asked at once (as if its turn had started there). "Enemy" means a creature that isn't the caster's ally.
- **Repulsion:** both rows only restrict movement toward the caster, so each is a note on the creature's Effect while it's inside (no terrain region). With no critical-failure row, a critical failure uses the failure row. The radius is picked in 5-foot steps.
- **Indolent Haze:** the sleepers' damage sentence sits in the critical-failure row but describes any unconscious creature in the area, so it applies to every unconscious creature at each exposure, whatever its save. PF2e may wake a creature that takes damage; this damage puts it back to sleep, as the text says.
### Rank 8 batch 14 — group 3 part 2, interpretations
- **Whirlpool, Tear the Veil:** "drawn/pulled toward the center" is the card's GM reminder (the module doesn't move tokens, as with every push and pull). "Drawn to the center" moves it all the way.
- **Whirlwind, Stars of Another Sky:** "rises N feet into the air" is a GM reminder to raise the token's elevation. Whirlwind's granted fly Speed is a note Effect for the spell's minute. Creatures the whirlwind moved through use the area's "moved through" control. The once-a-round limit is the area's one-save-per-round rule.
- **Tear the Veil:** the center burst sits at the area's center. The wraith the destroyed creature becomes is the GM's to place (a GM reminder; the module sets it to 0 HP and Dead). The death save's incapacitation is a degree better for a creature above level 20 (twice rank 10).
- **Stars of Another Sky:** the item has no cylinder height, so the GM marks a creature at the top ("reached the top" control, with a no-soul variant for double damage). Fascinated lasts until the spell ends; the GM removes it after another hostile action. The 1-day immunity is the critical success's.
### Rank 10 batch 2 — group 3 part 3, interpretations
- **Pied Piping:** PF2e's item has no area, so the caster picks the emanation's radius (60 feet offered, up to 120). The rows don't say "while in the area", so the Effects last for the spell wherever the creature goes. The critical failure is PF2e's Controlled plus the caster's control of a minion (the 2026-10-01 "minion: Effect+ownership" decision). The GM removes an Effect after a hostile action or a harmful command.
- **Flesh Tsunami:** the cone is placed from the destroyed thrall's space by the GM. The grasp's save is pressed only after a second thrall is destroyed (a reminder on the part).
- **Shadow Army:** the condition is picked once, when the area starts. A critical success leaves a "sees through the shadows" note, and that creature's later saves against this casting are a degree better automatically. Hide and Sneak among the clones is a GM note.
- **Vacuum:**
  - "Starts to suffocate" uses PF2e's out-of-air rule: Unconscious plus the suffocation note (as Suffocate does).
  - Holding its breath is the success and failure rows' note. While a creature holds that note, its later saves against the spell are a degree better.
  - "Ceases holding its breath" is the GM's control.
  - Creatures that don't breathe are excluded by the GM on the card.
  - The caster's −1 against inhaled threats is a GM note.
  - With no critical-success row, a critical success counts as a success.
### Rank 7 batch 17 — group 3 part 4, interpretations
- **Unbreaking Wave Barrier:**
  - "Within the area … only once each round" means a save when cast, as each round starts, and on entering, at most once a round per creature.
  - The pushes (away from the caster) are the card's GM reminders. The collision damage (2d6 per extra 5 feet) is a reminder note for the GM.
  - The emanation is a region that follows the caster's token, so each failing creature's difficult terrain is its own.
- **Shadow Raid:**
  - PF2e's item gives bludgeoning, but the text lets the caster choose bludgeoning, piercing or slashing, so the damage is the text's untyped dice of the chosen type.
  - Each target uses its better save (Reflex or Will).
  - The lasting shadows are placed after Finalize; they deal the type's damage to each enemy ending its turn there.
  - The GM's disbelief control (a Perception check against the spell DC) halves that damage.
  - "Concealed to enemies in the area" is a GM note, because PF2e's Concealed isn't per observer.
### Rank 9 batch 7 — group 3 part 5, interpretations
- **Volcanic Eruption:** the "encased" rows use PF2e's own rules (Clumsy 1, −10 status to all Speeds) on a note Effect that ends on an Escape against the spell DC or after 50 total damage. A flying creature's descent and difficult terrain are notes. The heat is a separate no-save damage button: the GM targets the creatures in the area and within 5 feet of the column.
- **Nature's Enmity:** "any time it's adjacent to the plants and fungi" is treated as always, since the vegetation springs from every surface; the GM removes the Effect if that's not true. The Effect lasts the spell's 10 minutes; leaving the area is the GM's (remove it). The flat check, basic save, damage and Off-Guard at the start of each turn are the module's. The primal-spell flat check and hostile natural creatures are notes.
- **Fix found while testing:** Foundry reads `@item.rank-6` as one data path (worth 0), so Blessed Boundary's heightened dice were wrong above 6th. Its formula is now spaced (`@item.rank - 6`).
### Rank 9 batch 8 — the end of group 3, interpretations
- **Burning Blossoms:** "any enemy that can see the tree, even outside the area" is the GM's choice of targets. The new save "at the end of its turn if it can still see the tree" is the GM pressing the save part again. The critical failure's "until the spell ends" is the spell's 1 minute. "The tree's fire damage doesn't end it; other hostile actions do" is a note (the GM removes Fascinated). The petals' area is the cylinder's 30-foot radius.
- **Unfathomable Song:** each target's save card rolls 1d4 once. A failure uses that result, and a critical failure uses it plus 1 (the "1d4+1"). Result 5 gives Stunned for 1 round and Stupefied 1 (unlimited). "Can't be affected on subsequent rounds" on a critical success is the 1-minute immunity.
- **Dread Mosquito Storm:** the 1 void damage is dealt at each exposure, before the save. The disease is handed to Pseudo Afflictions / the GM (the accepted affliction exception). It isn't tied to the spell's minute, since it has its own 6-round maximum. The success row's "recovers after 1 round, sickened stays" is a note for the GM, and so is the thrall when an afflicted creature dies.
### Rank 8 batch 15 — group 4 part 1, interpretations
- **Undermine Reality:** "its Strikes deal half damage" halves damage the module sees as a Strike from that creature (PF2e's `item:type:melee` or `item:type:weapon` roll option). "Creatures saving against its spells and effects get a result one degree better" applies on the module's save cards when the quasi-real creature is the caster; PF2e's own saves are the GM's. The failure's minute is 10 rounds, so its end-of-turn Will save can run.
- **Fabricated Truth:** the statement is the caster's choice (the GM keeps it). The critical success's "knows you tried to trick it" is whispered to the GM (the "info: whisper" decision). An earlier casting's counteract is a GM note.
- **Cursed Metamorphosis:** the harmless animal is the caster's choice; the transformation is a generated note Effect (the "forms" decision). The success's minor features are cosmetic and revert with the Sickened.
- **Remake Physiology:** one note carries the −20 Speeds, the four conditions and Dazzled as PF2e's rules, with the module's turn-start DC 5 flat check (Slowed 1 for that round on a failure). "Permanent" is an unlimited duration.
### Rank 6 batch 22 — group 4 part 2, interpretations
- **Calcification:** the GM picks the creature within 60 feet of where the thrall was. Bone creatures' immunity is a note (exclude them). An incorporeal creature's loss of the incorporeal trait is a note (the GM). The success's weakness lasts its 1 round; the failure's lasts while the creature is Slowed.
- **Vitrifying Blast:** the blast's save is Reflex (PF2e's item) and the ongoing save Fortitude, as the text says. The weakness follows the creature's current Slowed value (3 × it) and ends with it.
- **Chrysopoetic Curse:** "if wearing any armor or clothing" and "if holding any weapons or other objects" are the GM's yes/no questions for each creature on the card. The held objects' Hardness −5 and the critical failure's liquid-gold square are notes (the GM). PF2e's Encumbered includes its own Clumsy 1.
- **Dread Secret:** the chosen weakness or resistance isn't in the data, so the success's 1 damage (or lost resistance) is a note for the GM. A target that doesn't have the chosen weakness or resistance is excluded on the card.

### Rank 9 batch 9: the end of group 4, interpretations
- **Fateful Condemnation:** "the target's allies" is PF2e's ally relation (`isAllyOf`). The aura is a 10-foot region that follows the doomed creature for the spell's minute.
- **Overwhelming Presence:** the tribute counter is lowered by the GM, one point for each action or item paid. Fascinated ends at 0.
- **Tanglecurse:** "until the curse is lifted" is an unlimited duration that the GM ends. Its reactivation every 24 hours is a GM note.
- **Undertaker:** the stone shell is a GM note with its stats, not a token. Whether the target touches the ground is the GM's question on the card. If the target moves off the ground, the GM corrects it.
- **Seize Identity:** the disguise and Silence use PF2e's own Effects. The rule that targets must be intelligent is the GM's to check.
### Rank 8 batch 16: group 5 part 1 (battle forms), interpretations
- **Monstrosity Form:**
  - Heightened (9th) "increase damage by one damage die" is applied to the Strikes, as PF2e's Effect does. Spine Rake stays 4d8+10, and the shroud stays 2d6. **QUESTION:** should Spine Rake and the shroud also gain a die at 9th?
  - Spine Rake's "each creature you're adjacent to during your movement" is the GM's targets.
  - A creature already inside the shroud when it appears hasn't "entered" it.
- **Nature Incarnate:** Green Caress gives no timing. Its save is rolled when an enemy enters the aura or starts its turn there, at most once a round per creature. Trample's trampled creatures are the GM's targets.
- **Qi Form:** the corona deals its damage at the start of each creature's turn, as the text says. Its size control switches it between 5 and 30 feet.
- **Battle forms on NPCs:** PF2e applies BattleForm statistics only to characters. The module's riders work for any caster.
### Rank 7 batch 18: group 5 part 2, interpretations
- **Corrosive Body:**
  - "Any creature that touches you or damages you with an unarmed melee attack or non-reach melee weapon" is the GM pressing the card's touch with that creature targeted.
  - "The first time each round … in this way" covers both the touch and the caster's unarmed acid. Both share one temporary-Hit-Points roll per round.
  - The new temporary Hit Points replace the caster's current ones only if higher (PF2e's rule).
  - "Any remaining temporary HP expires": when the Effect ends, the caster's temporary Hit Points go to 0, unless another source has since given more.
- **One with the Land:**
  - The terrain vengeance Strike is the caster's spell attack. Strike penalties (multiple attack) are the GM's.
  - The difficult terrain lasts at most the spell's minute. Removing natural difficult terrain is the GM's.
  - "Significant physical damage to the natural feature" is the GM's call: the card's Expelled deals the 10d6, and the GM ends the Effect.
### Rank 9 batch 10: group 5 part 3, interpretations
- **Arcane Explosion:**
  - "All creatures and objects … (basic Fortitude saving throw)" is the creatures' basic save. The objects are a GM reminder.
  - The fall to Prone when a pushed creature can't complete the movement is a GM reminder.
  - The form lasts until the caster Dismisses it (the Effect is removed). Removing it ends the adjacent-damage aura and restores maximum Hit Points.
  - The caster isn't hit by its own blast.
### Rank 6 batch 23: group 5 part 4, interpretations
- **Blanket of Stars:** "under a starry night sky" is the caster's toggle on the Effect (still or moving). "Any creature" includes allies. A creature immune to mental or visual effects is unaffected.
- **Mantle of Heaven's Slopes:**
  - "You gain cover" is standard cover: +2 circumstance to AC, to Reflex saves against areas, and to Hide and Sneak.
  - "Counts as silver" is a GM note (PF2e's Strike rule has no material).
  - The free-action Sense Motive and Shove and the projected voice are notes.
### Rank 10 batch 3: the end of group 5, interpretations
- **Avatar:**
  - "fly" with no number is a fly Speed equal to the land Speed.
  - "no land Speed" is a land Speed of 0.
  - Melee Strikes are Strength-based and ranged Strikes Dexterity-based. Finesse is a trait on the Strike, so PF2e handles it.
  - The shields (Hardness 15, can't be damaged), a reload, silver and "damages only undead" are GM notes.
- **Metamorphosis:**
  - "Any form you could choose with a polymorph spell in your spell repertoire or that you could prepare" is the polymorph spells on the caster's sheet that have no target, of rank 8 or lower.
  - The caster picks the rank (8 or lower).
  - The 40 temporary Hit Points replace whatever the caster had.
  - A new form ends the previous one.
### Rank 6 batch 24: group 7 part 1 (teleports), interpretations
- **Teleport destinations:** the GM (or caster) clicks the space. The module checks distance (PF2e's 5-10-5 squares from the caster), that the space is inside the area when the text says so, and that it's unoccupied. Line of sight is the GM's.
- **Willing creatures** that "automatically fail" or don't save: the GM sets them to a failure on the card.
- **Unexpected Transposition:** "1 creature other than the triggering enemy" is the GM's target. The immunity marks both the caster and the target.
- **Magnetic Dominion:**
  - The eligible targets (metal armor, made of metal, the metal trait, unattended metal objects) are the GM's to pick.
  - Moving into an occupied space means moving the occupant first.
  - "Into the air" descends harmlessly (a note).
  - Magnetic Repulsion is the caster's choice (the card's button).
- **All is One, One is All:** any number of pairs swap (one press per pair). The Hit Point split is entered once.
- **Proximal Shift:** the crater's damage is the text's flat 5. The terrain lasts its stated minute.
### Rank 8 batch 17: the end of group 7, interpretations
- **Heaving Earth:** the explosion's "pushed back 10 feet" is away from the caster. The heightened second target is a second target on the card.
- **Earth and Sky:**
  - "Then falls" is PF2e's falling: half the distance as bludgeoning damage, landing Prone.
  - The launch is the full 100 feet. If the caster rises less, the GM corrects the damage.
  - On a success, Arrest a Fall (with a fly Speed) is the GM's.
- **Deluge:** the flyers are pressed first. Those forced to the ground then attempt the save too (the GM targets them).
- **Amalgamizing Leap:**
  - On a success, the target stays where it is and the caster leaves with "a piece". The Enfeebled 1 lasts until the end of the caster's next turn (the spell's duration).
  - The fused target's Speeds and senses for the caster are GM notes.
### Rank 9 batch 11 and rank 7 batch 19: group 8 (mode spells), interpretations
- **Storm Lord:**
  - The emanation follows the caster and affects it.
  - "Ranged attacks take a −4 circumstance penalty" applies to creatures inside making ranged attacks; attacks from outside are the GM's.
  - Fog is Concealed for the creatures inside (as mist).
  - Dousing flames is a note.
- **Wrathful Storm and Storm of Vengeance:**
  - The cloud is placed by the GM; its creatures are those under it.
  - The Tornado's "thrown 40 feet upward" includes PF2e's falling (20 bludgeoning, Prone); a flying creature can Arrest its Fall (the GM).
  - Greater difficult terrain for flyers is a note.
  - The thunderclap's 1-hour immunity on a success is a GM note (the GM doesn't target that creature).
- **Musical Shift:** PF2e's own Effect, with its choice set by the slot (enemies: key, allies: time). The Flat and Sharp riders are PF2e's notes.
- **Dancing Fountain:**
  - The burst stays where the caster stood when casting.
  - Chasing Jets' move is the push reminder (the caster's direction, staying inside).
  - Flashing Spray lasts until the next display.
- **Impaling Briars:**
  - The Wall is a placed 60-foot line of greater difficult terrain for 1 round; the rest of Wall of Thorns' text is the GM's.
  - A critical hit with the impaling briars doubles the damage (the spell attack's critical success) and Immobilizes.
- **Control Sand:**
  - The caster isn't affected by its own sand.
  - The 10-minute immunity follows any save against the dazzling, success or failure.
  - Switching modes removes the shield and the sandstorm.
- **Vibrant Vibrato:**
  - The success row's "persistent" inline damage is dealt at the end of each of the creature's turns while it's inside, as the text says.
  - The shattering sound happens once per creature.
### Rank 10 batch 4: group 9 part 1, interpretations
- **Falling Stars:** each creature is targeted once, on the part for where it stands (a centre, or only an explosion). Pick the same type on both.
- **Planar Collision:**
  - The firm-surface damage is the GM's.
  - The hazardous ground is a placed region lasting a year and a day; the GM ends it when it's counteracted.
- **Cataclysm:**
  - Each creature is on the ground, flying or swimming. A swimming creature takes neither the quake nor the winds.
  - **QUESTION:** "Treat the resistances … as if they were 10 lower" is a GM note for now. Should the module automate it?
- **Vampiric Revelry:** only living enemies take the damage (the GM targets them). The allies' share is the caster's computed amount.
- **Metallic Meteorite Glyph:** the glyph's meteor uses the caster's spell DC.
### Rank 8 batch 18: group 9 part 2, interpretations
- **Prismatic Spray:**
  - Each targeted creature's beam is rolled by the module. The potent beam rerolls 8s and repeats.
  - "The same d20 for both saves" is a GM reminder.
  - Violet's planar trip on a critical failure is a GM note.
- **Rainbow Fumarole:**
  - The color is rolled once for the casting.
  - A creature is affected at most once per turn (moving through and ending its turn there count once).
  - "All": the caster picks the color for each creature as it is hit.
  - Yellow's push is a GM reminder.
- **Prismatic Wall:**
  - Passing through runs all seven layers in order on the targeted creature.
  - Counteracting layers in order is the GM's.
### Rank 7 batch 20: group 10, interpretations
- **Ray of Corruption:**
  - The save's rows: half on a success; full plus 2d12 persistent acid on a failure; double plus 4d12 persistent acid on a critical failure.
  - A critical hit makes the save one degree worse.
- **Deity's Strike:** the GM places the line from the target, then targets everyone in it, the struck creature included.
- **Pierce the Sky:**
  - The lines run from the caster's token to each creature shot.
  - They are one area, so a creature takes the 12 electricity at most once per round across all lines.
- **Doom Mark:**
  - A mark lasts until the spell's minute (from the cast) ends.
  - The 0-Hit-Point payoff happens each time a marked creature drops.
- **Ravenous Darkness:**
  - "Fails" (the spell attack against its Fortitude DC) means a success or critical success on the attack; a critical success has no extra effect.
  - Dismissing is ending the area (deleting its region).
- **Comet Charge:**
  - The caster lands in the free space beside the target nearest where it started, at the target's elevation.
  - The target's Off-Guard is a +2 circumstance bonus on that attack.
  - Rust's metal check is the GM's answer on the card.
- **Unbreaking Wave Containment:**
  - On a Sustain, the GM targets only the free targets still in range for the strands, and the held creatures for the crush.
  - A missed Sustain ends the hold.
  - **QUESTION:** the crush's 10d6 is read as dealt again on each Sustain ("Creatures who are immobilized or restrained take 10d6 …"). Is that right, or only when newly held?
### Rank 8 batch 19: group 11, interpretations
- **Damage types moved to another creature** (Bound in Death, Love's Sacrifice): the type the triggering damage's item names (PF2e's damage-taken message), else untyped.
- **Bound in Death:**
  - "Half the damage instead of you": the caster gets that half back.
  - "Can't take damage from it for 1 round": no saves until a round's time has passed.
  - **QUESTION:** the transferred damage uses the triggering damage's type when PF2e names it, else untyped (so the foe's resistances then don't apply). Should the GM pick the type when it's unknown?
- **Love's Sacrifice:**
  - The caster never reached 0, so it isn't Dying, Unconscious or Wounded afterwards.
  - The damage is what the GM states (default: the last damage the caster took).
- **Blinding Fury:**
  - "Can't observe" is an Effect naming the creature, until the end of the cursed creature's turn; Hidden is the GM's on the map.
  - When it damages several creatures at once, the first processed is the one (the text's random pick).
- **Divinity Leech:**
  - The watch works whatever the first save's result.
  - "The divine spell is lost" and the success's better results are GM notes on the cast.
- **Mimic Spell:**
  - The spell is the triggering creature's latest spell card (or the GM's pick).
  - The counteract check is the caster's spell attack modifier against that spell's DC.
- **Touch of Death:**
  - The mark follows the caster's latest unarmed Strike hit (or the GM's word); "alive" excludes undead and constructs.
  - With the immunity against being killed, a critical failure deals the failure's result.
- **Unblinking Flame Emblem:**
  - "+1 status bonus to attack rolls against it" is a –1 status penalty to its AC.
  - The fire dice go to the caster and its allies on the scene.
  - The caster's Off-Guard is a –2 circumstance penalty to AC, except against the target.
### Rank 10 batch 5: group 13, interpretations
- **Raise Dead:** Wounded is left as it was. Drained's HP loss happens before the 1 Hit Point is set, so the creature has 1.
- **Revival:**
  - "The same effects and limitations as Raise Dead" includes the week's debilitation for the raised.
  - Only the GM's question covers the time limit, Disintegrate, death effects and Pharasma.
- **Shock to the System:**
  - "Right before yours" is the caster's initiative + 0.5. A corpse not in the combat is added.
  - Thunderstrike's copy is innate at the caster's DC and attack modifier, in the caster's tradition.
  - Outside creatures being hidden from those inside is a GM note.
- **Moment of Renewal:**
  - "Detrimental effects that would be gone after 24 hours" are Effects ending within 24 hours that grant conditions or impose penalties. Running spells' Effects are kept.
  - "24 hours of rest" is a day of long-term rest: Constitution modifier (at least 1) × twice the level in Hit Points; Fatigued removed; Drained and Doomed down by 1; Wounded removed at full Hit Points.
### Rank 6 batch 25: group 14, interpretations
- **Fire Seeds:**
  - All the acorns' flames are one area. A creature takes the flames once per round across them, and the whole area burns until a minute after the latest throw.
  - The creatures caught in a burst don't also "enter" its flames.
  - Who throws doesn't change anything; one acorn is taken from the thrower if given, else from any holder.
- **Tree of Seasons:** the tree itself is a GM note; each pod is a part used once.
- **Bounty of the Sky:**
  - "In the area" is within 30 feet of the caster when the gift is collected.
  - An affliction's stage is the module's tracked affliction (the Pseudo Afflictions handler's Effect).
### Rank 9 batch 12: groups 15 and 16, interpretations
- **Tangling Creepers:** PF2e's Effect applies to every creature inside the placed burst (its rule names land, climb and swim Speeds). The vine's reach from the creepers is the GM's targeting.
- **True Target:** the GM designates the creature on the card. "The first time each target makes an attack roll against that creature" removes that attacker's Effect after its first attack roll against the mark.
- **Sacred Covenant:**
  - "Would be reduced to 0 Hit Points" is held whenever an update would take a pact-holder to 0 or less.
  - "Not immediately killed" (death effects, massive damage) is the GM's.
  - The immunity lasts until the GM removes it at the next daily preparations.
- **Heartbolt:** the plume reaches every other creature within 20 feet of the target, the caster included. Constructs are neither healed nor harmed.
### Answers 2026-10-05 (applied in rank-9 batch 13)
- **Unbreaking Wave Containment:** the crush is dealt on every Sustain (unchanged).
- **Bound in Death / Love's Sacrifice:** when PF2e didn't record the damage's type, the GM picks it.
- **Cataclysm:** the module applies "resistances 10 lower". Each resistance stops only min(damage, resistance − 10).
- **Monstrosity Form:** at 9th, the shroud and Spine Rake gain a die too.
### Spellshapes and wands (batches 1–4), interpretations
- **Using a spellshape:** turning on PF2e's Spellshape selector, or posting the feat's card (the only way for feats PF2e gives no selector, such as Knockback Spell), arms it for the caster's next spell this turn. The module switches the selector off after that cast.
- **Requirements** are checked against the spell as PF2e shaped it. A feat whose requirement isn't met does nothing, and the GM is told why.
- **Pushes** (Knockback Spell) are a GM reminder with the distance and direction; the token is moved by hand.
- **Consecrate Spell:** "the rank of your focus spells" is half the caster's level, rounded up. The extra damage is doubled and halved as the spell's own damage is.
- **Choices on the cast** (Consecrate's damage type, Marked for Rebuke's and Forcible Energy's creature) are asked of the GM when the card resolves.
- **Chaotic Spell:** the d6 is rolled once for the cast, as it's cast.
- **A wand's stored spell:** a wand keeps a copy of its spell as printed when the wand was made. When the module can't resolve that copy but can resolve the compendium's current printing, the card uses the current printing at the wand's rank (Wand of Tormented Slumber's Sleep, Wand of Clinging Rime's Frigid Flurry).
- **Wand of Dazzling Rays:** a critical hit's Blinded lasts as long as the Dazzled (the rank's rounds); the Fortitude save at the end of each of the target's turns uses the spell DC and ends only that Blinded.
- **Wand of Dumbfounding Doom:** Stupefied is set whenever the spell's own Frightened is granted or rises (never lowered), and lasts for the spell's 3 rounds.
- **Wand of Tormented Slumber:** the persistent mental damage is automated. Waking (only on 4+ damage in one roll) and Frightened 1 on waking from damage are GM notes.
- **Wand of Wearying Dance:** "forced to dance for 1 minute" means the spell's Effect on the creature lasted 1 minute and ran its course. Fatigued is applied then; not if the dance ended early.
- **Wand of Paralytic Shock:** the 1d12 electricity is dealt at the start of each of the creature's turns while the spell's own Stunned or Paralyzed Effect is on it.
### Spellshapes and wands (batch 5, family A), interpretations
- **Larger areas:** the module grows the spell's own area (with its fixed heightening) by the feat's or wand's rule, and enlarges the cast's template to that size when it's placed. A template PF2e already enlarged (Widen Spell's own rule) is left as it is; templates are never shrunk.
- **Range and origin** (Reach Spell, Wand of Reaching, Familiar and Natural Conduit, Seneschal Spell, In Tune, Touch Focus's touch range): the module doesn't measure ranges or origins, so these are read and left to the table, with no GM note.
- **Touch Focus:** its +2 to the attack is PF2e's rule. Prone applies on a hit (a success or critical success on the spell attack).
- **Reach of the Dead:** one of the caster's thralls within 60 feet is destroyed as the spell is cast. The GM picks when there are several; with none, the GM is told.
- **Wands that hold no spell in PF2e** (Wand of Reaching, Continuation, Mercy…): posting the wand's card is its activation, for the caster's next spell this turn. A wand with a PF2e toggle (Wand of Widening) counts when its toggle is on for the cast, and the module switches the toggle off after. The spell must be of the wand's rank and meet its Craft Requirements' limits (actions, duration, area, range).
### Spellshapes (batch 6, family E), interpretations
- **When:** the caster's benefits (resistances, PF2e's Effects, Dualistic Synergy, Familiar's Resolve) apply as the spell is cast, whatever its save card does. Energy Ablation says so outright ("regardless of whether or not your spell dealt damage").
- **Vampiric Spell:** "the initial damage" is the damage the spell's card dealt to each creature. Half of the most, rounded down, becomes temporary Hit Points for 1 minute; they don't stack with higher temporary Hit Points.
- **Elemental Defense:** "resistance to effects that have the element traits" is PF2e's resistance to each element of the spell (air, earth, fire, metal, water, wood).
- **Current Spell:** PF2e's Effect, its element taken from the spell (asked when it has both air and water).
- **Dualistic Synergy:** the arcane bonus applies to Recall Knowledge until the end of the turn. PF2e doesn't mark halcyon spells, so a halcyon spell's second benefit is the GM's.
- **Familiar's Resolve:** "against effects that would cause you to be doomed or frightened" is PF2e's `inflicts:doomed` / `inflicts:frightened` on the save. The caster or one ally within 30 feet, chosen.
- **Skeletal Extension:** PF2e 8.5 has no grave trait; a "grave spell" is a necromancer's focus spell (the focus and necromancer traits). "That destroys a thrall" is the table's.
- **Safeguard Spell:** the caster is left out of the spell's save card.
- **Gusting Spell's Fly, Defensive Coordination's Raise a Shield:** the table's.
### Spellshapes (batch 7, family J), interpretations
- **A slot not spent** (Bloodline, Ley Line and Mystery Conduit, Unlimited Potential, Galvanize Spell, Sepulchral Sublimation): PF2e spends the slot as the spell is cast, and the module gives it back once the cast is recorded. That means a prepared slot is marked unexpended, a spontaneous or flexible slot regains 1, and an innate spell regains a use. A spell above the feat's rank, or with a duration, keeps the slot spent.
- **The table's:** the subtle trait (PF2e adds it), fewer actions, reactions not triggered, identifying, cover, concealment, senses, Look Again's second cast, a mythic point or minion spent as the feat's cost, and the requirements the module can't check ("at least 2 ranks lower than your highest slot"). These are read, with no GM note.
- **Sepulchral Sublimation:** "a necromancy spell" names a school PF2e no longer has, so it's the table's; the minion destroyed is too.
### Spellshapes (batch 8, family D), interpretations
- **Spiritual Secret:** "a witch cantrip or witch spell" isn't checked (PF2e doesn't mark a spell's class); every damage type the spell deals becomes spirit. PF2e changes the traits.
- **Golden Dragon's Bounty:** the metal is chosen as the spell is cast and applies to the spell's bludgeoning, piercing and slashing damage (PF2e's materials, for weaknesses and resistances).
- **Overwhelming Energy, Surging Might, Overwhelming Breath:**
  - The card gives back the damage each listed resistance would stop, up to the caster's level.
  - A resistance to all damage isn't "resistance to fire damage", so it isn't lowered.
  - Only the card's damage is affected. The spell's later persistent or ongoing damage is the GM's, despite "This applies to all damage the spell deals".
  - Overwhelming Breath's Strikes are the GM's.
- **Nonlethal Spell, Wand of Mercy:** PF2e doesn't handle nonlethal damage, so a creature the spell's card brings to 0 Hit Points is knocked out (Unconscious) instead of dying or dead. For the wand, the caster chooses at the cast whether it's nonlethal.
- **Steam Spell:** the table's. **Bizarre Transformation:** a GM note, as Untamed Form's attacks are chosen at the table.
### Spellshapes (batch 9, family F), interpretations
- **Heal and Harm** resolve with PF2e's own buttons. The module follows PF2e's applied healing or damage back to the shaped cast (the spell's id on the message), and applies the riders to the creature healed or damaged.
- **"The target regains Hit Points from the spell":** riders apply when PF2e's healing from that cast is applied to the creature.
- **Divine Infusion:** "its melee weapons and unarmed attacks" are PF2e's melee Strikes; the type is void for Harm and vitality for Heal. The dice are by the cast rank, until the end of the creature's next turn.
- **Martyr:** the Hit Points come straight off the caster (temporary Hit Points and resistances don't apply), once per cast.
- **Cleansing Spell:** the extra Hit Points (the caster's level) go to the first creature the spell heals. The counteract runs against one tracked disease or poison of the first afflicted creature it heals.
- **Purifying Spell:** the counteract uses the module's counteract card, against the creature's tracked disease or poison.
- **Cast Down:** Prone when Harm or Heal damages the creature. PF2e's Effect applies when that creature's save against the cast was a critical failure.
- **Healing Transformation:** the healing goes to the spell's one creature: the caster for a polymorph with no target.
- **A cast with no save, attack or damage** (Pest Form): PF2e posts its card without roll options, so the module reads the Spellshape selector from the caster as it stands.
- **The table's:** Ebb and Flow, Echoing Channel, Interweave Dispel (the player picks the targets or casts Dispel Magic). **The GM's notes:** Blessed Spell, Remediate.
- **Command Undead** (Harm becomes a control save) is left for the spellshape save cards.
### Spellshapes (batches 10 and 11: targets, rank, terrain, time), interpretations
- **Split Shot:** the GM picks the second target on the card. It takes half the card's damage and none of the row's other effects.
- **Tempest-Sun Redirection:** the spared targets are ticked on the card; each takes the damage less the rank. Until the caster's next turn starts, the caster resists twice the rank of the damage those creatures deal (PF2e's resistance against their signatures).
- **Rank changes** (Split Hex −2, Simple Mastery +1 up to the highest, Mythic Heightening to the highest, Form Control −2): the card resolves at the changed rank. "The highest rank you can cast" is the caster's highest slot.
- **Mythic proficiency** (Mythic Casting, Mythic Heightening): the save card's DC uses the caster's level + 10 in place of the spell's proficiency bonus. A spell attack's mythic bonus is the GM's.
- **Contagious Spell, Split Hex's second target:** the player targets one more creature; the module doesn't count targets.
- **Charred Remains:** the spell's placed area is copied into its own terrain (difficult and hazardous for 1 minute), so removing the template doesn't remove it. The GM reports a creature's squares moved through it (1 fire each), from the terrain card.
- **Snowdrift Spell:** the GM picks the creature on the card; the snow is its squares and those around it, difficult terrain until the caster's next turn starts.
- **Garland Spell:** grown from its card at the targeted token (thorns or vines). A creature ending its turn there takes the damage automatically; one moving in is reported by the GM. Once per turn, the caster and its familiar immune, 1 minute; a new garland replaces the old.
- **Rockslide Spell, Worldsphere Gravity, Into the Future, Sow Spell:** the GM's notes (squares, planar effects, a delayed or planted spell).
- **Echoing Spell:** the next cast of the same spell before the end of the caster's next turn gets its slot back.
### Spellshapes (batch 12, family C cards), interpretations
- **A spellshape's own save:** built as a spell of its own from the feat's numbers, compiled by the module, and resolved on its own card at the caster's spell DC (or the higher of the class DC and spell DC when the text says so).
- **Heraldic Proclamation:** every ally within 30 feet of the caster regains twice the rank; every enemy within 30 feet gets the basic Will card. Allies and enemies are by PF2e's alliance.
- **Explosive and Ostentatious Arrival:** the GM targets the summoned creature's token on the feat's card. The creatures around it take the damage, with no save, its type from the creature's traits (chosen when it has several). Ostentatious Arrival spares the caster; the eidolon's manifestation is the table's.
- **Explosive Metamorphosis:** the energy is chosen at the cast, the polymorph's own energy trait when it has one.
- **Secondary Detonation Array:** the GM places the circle at a targeted token. It detonates as the caster's next turn begins (or by its card's button), on the creatures in it, with the spell's damage type (chosen when several).
- **Vexing Tempest:** the creatures within 15 feet of the caster's familiar, the familiar excepted. The push is the GM's reminder; Prone applies.
- **Thundering Surge:**
  - The flat check is rolled at the cast.
  - On a success or critical success, the GM targets the burst's centre (the spell's target or a point in its area).
  - On a failure, the burst is around the caster.
  - The save is basic Fortitude against the higher DC, with Prone by its stated result.
- **Kaleidoscopic Entreaty:** the creatures within 10 feet of the caster, against the higher of the class DC and spell DC.
- **Grasping Spirits Spell:** after the spell's own card, its target's Fortitude card; the pull is the GM's reminder.
- **Command Undead:**
  - The GM targets the undead on the card. A creature above the caster's level − 3 is unaffected.
  - Otherwise it makes a Will save against the spell DC. A critical success makes it immune for 24 hours; a failure makes it the caster's minion for 1 minute (1 hour on a critical failure), with ownership given to the caster's players and the minion trait.
  - The other controller's save is the GM's.
- **Daunting Spell:** its rows join the spell's own save. Stupefied lasts as long as the creature is frightened. The nemesis rule and the "can't reduce below 1" are the GM's notes.
### Spellshapes (batch 13, the last feats), interpretations
- **Dousing Spell:** the spell's target's persistent acid and fire get DC 10, and the module rolls the DC 10 flat check at once (a success ends it). The water trait is PF2e's.
- **Shadow Spell:**
  - The creature is chosen on the card. An enemy qualifies only if the spell hit it or it failed its save.
  - An enemy gets the −2 to Perception and an ally the +2 to Stealth, unless a choice is given.
  - A new Shadow Spell ends the caster's older one.
- **Shared Sight:** the allies the caster targets get spiritsense for 1 minute.
- **Sinbladed Spell (answered 2026-10-05):** the sins are the Runelord's school of Thassilonian rune magic, which PF2e doesn't mark on spells. Every spell cast with Sinbladed Spell is taken as valid (no check); its bleed equal to the rank applies on a hit or a failed save.
- **Spell Shroud:** everyone within 15 feet of the caster at the cast, the caster included, is Concealed until the caster's next turn starts. Creatures moving in or out later are the GM's.
- **Vigorous Anthem:** PF2e's Effect (temporary Hit Points) on the caster and every ally in Courageous Anthem's 60-foot emanation.
- **Coven Spell:** posting its card is its reaction. PF2e's Effect goes to the ally within 30 feet who cast last; its second option (another spellshape) is the GM's.
- **Apparition's Reflection:** the caster is Confused until the end of its next turn after the cast; the slot regained and the apparition spell are the table's.
- **Energy Fusion, Harrow Casting, Vengeful Spirit Deck, Mystical Flare:** the GM's notes (a second spell's slot and type; harrow cards). **Bond Conservation, Call and Response, Cascade Bearer's Flexibility, the Courageous feats, Harmonize, Knowledge of Shapes, Recover Spell, Shield Spell Reinforcement, Synergistic Spell, Unstable Patronage, What Could Have Been:** the table's.
### Wands (batch 14), interpretations
- **A wand's own rule the module doesn't apply** is whispered to the GM as the spell is cast, as the wand's text without the narration. This covers Wand of Shattering Images' shards, Thundering Echoes' echoes, Shardstorm's shards, Refracting Rays' chain, Legerdemain's action, Hybrid Form's two forms, Continuation's longer duration, and the 6th-rank Pernicious Poison's own poison.
- **Plain wands** (Magic Wand, Pistol Wand) only cast their spell; Wand Cane only holds a wand; Wand of the Pampered Pet only describes the space.
- **A wand naming its spell** (an equipment wand armed by its card) applies only to that spell's casting.
- **Wand of the Snowfields:** a copy of Howling Blizzard's area is difficult terrain for 1 minute.
- **Wand of Hopeless Night:**
  - A copy of Darkness's area lasts for the spell's duration.
  - A creature ending its turn inside gets the DC 20 Will card: Frightened 1, or 2 on a critical failure.
  - A creature counts as inside by Foundry's record, or by its centre.
- **Wand of Crushing Leaps:** the GM targets the caster's token where it lands, on the card. The creatures beside it are Off-Guard until their next turn starts, and the space and those around it are difficult terrain for 1 minute. The 60-foot jump is the table's.
- **Wand of Slaughter:** a creature the card brings to 0 Hit Points (not undead or a construct) releases 14 void damage on the creatures within 20 feet, with no save.
- **Wand of Mental Purification:** a counteract against one mental Effect on the targeted creature, at Soothe's rank + 1.
- **Arboreal Wand:** a counteract against the targeted creature's affliction (the GM picks the lowest-level one) at half the wand's item level.
- **Wand of Overflowing Life:** as the caster's next turn starts, it regains Heal's 1-action healing at 3rd rank (3d8); one such Effect at a time.
- **Cyrusian Wand:** whether a Mythic Point is spent is asked at the cast; if so, the save card's DC uses mythic proficiency.

### Forced movement and the GM-note wands (batches 16–18), interpretations

The user (2026-10-05): "automate as much as you can" and "for any forced movement make sure no two tokens end in the same space. If one token moves into another's space they instead end adjacent".

- **Forced movement:** the module moves the token in the nearest of the 8 grid directions away from (or toward) the origin, square by square, diagonals 5 then 10 feet; a wall or the scene's edge stops it. If it would end in another creature's space (a token with an actor, not hidden), it ends in the free space adjacent to that creature nearest where it was going, ties broken by nearest where it came from. If no adjacent space is free, it stays where it was. Origins: the caster (or its familiar or hand), the template's centre for "from the center", the caster for an emanation, the nearest point of a wall or area for a hazard. "Up to", "any direction", per-hit and action-limited moves stay the GM's.
- **Wand of Hawthorn:** an unarmed Strike (PF2e's `item:category:unarmed` or `item:trait:unarmed` option) that hits the target; "otherwise touches it" and the engulfing creature stay notes.
- **Wand of Shocking Haze:** any failed flat check by a creature adjacent to the caster counts. The module can't tell which concealment a flat check was for.
- **Wand of the Spider:** a failed Athletics check or Reflex save by a creature inside the web's template.
- **Wand of Traitorous Thoughts:** both a success and a critical success are made one step worse, following the wand's own examples; the check message's outcome is changed and the GM is whispered what the caster learns. Only the first such check counts.
- **Wand of Shardstorm:** the 1-action force barrage's shards (1, plus 1 per 2 ranks above 1st) are shared among the targeted creatures in turn. Each creature's shards are one damage roll, as in force barrage.
- **Wand of Thundering Echoes:** each echo is the spell again in the template's area, one rank lower, at the original DC. It stops when the dice would drop below 2d10 or the rank below the spell's own.
- **Wand of Continuation:** the duration of each Effect the cast makes within 10 minutes (the module's, or PF2e's with the spell as origin) is multiplied by 1.5, switching to a smaller unit when the result isn't whole (1 minute becomes 15 rounds).
- **Wand of the Ash Puppet:** the zombie appears where the powdered creature stood, and that creature's token is hidden, not deleted. The zombie is owned like the caster and has the minion and summoned traits. It goes after 1 minute or at 0 Hit Points.
- **Wand of Contagious Frailty:** the spread is an Enfeeble save card for every creature within 10 feet of the enfeebled target, the caster included, with each degree one step better.
- **Wand of Fey Flames:** every creature in the faerie fire's template gets the Will card; PF2e's Effect is applied on a failure or a critical failure.
- **Wand of Choking Mist:** PF2e's Effect: Remaining Air is applied to the creatures in the mist when it's placed.
- **Wand of Caustic Effluence:** on Grease's area, a failed Reflex save that leaves the creature prone deals 1d6 acid. The area becomes ground where a creature that begins its turn prone takes 1d6 acid, for the spell's duration. The object uses stay notes.
- **Wand of Toxic Blades:** a creature damaged by the spell's save card (Blessed Boundary's shell card) gets a Cave Worm Venom save card at the poison's own DC 32: stage 1 on a failure, stage 2 on a critical failure. This happens at most once per creature per turn.
- **Wand of Refracting Rays:** after the cast, a card refracts the ray to the targeted creature, which must be within 30 feet of the last one and not targeted before. The ray is cast again with its own attack and color, and the card returns after a hit. The GM presses it only if the first ray hit.
- **Wand of Chromatic Burst:** the button asks for a color, removes the armored creature's Chromatic Armor Effect, and starts a 20-foot emanation basic Reflex card of that color's damage type at the cast's rank.
- **Wand of Legerdemain:** the button starts a Will card for each enemy within 30 feet; a failure gives Fascinated until the end of the caster's next turn. The GM applies the +4 for recent threats and the fascination's other limits.
- **Wand of Teeming Ghosts:** the button needs the caster's False Vitality Effect and temporary Hit Points. It removes both and raises the targeted creature's frightened to 2.
- **Wand of Shattering Images:** the button deals 5 slashing to the targeted destroyer only if it's adjacent to the caster.
- **Wand of Rolling Flames:** the button lays the flames on the targeted token's square and the squares around it, as difficult and hazardous terrain until the caster's next turn. Pressing it again (a Sustain) replaces the old flames. Moving through uses the terrain card; a creature that ends its turn where it began it takes 1 fire per square it occupies in the flames.

### Notes audit (notes batches 1 and 3), interpretations

The user (2026-10-05): "check all spells with notes and see if anything in notes could be automated". The audit is in `docs/planning/notes-automation-audit.md`.

- **Situational bonuses:** a bonus the text limits to a situation the module can't see ("when someone Lies", "to pass as the chosen age", "in dim light or darkness", "against forced movement") is a toggle on the Effect. PF2e's own action options (Hide, Disable a Device, Command an Animal, Shove, Reposition) apply it without the toggle.
- **Elemental Sense:** Tremorsense and Mechanoreception (PF2e's see-invisibility) become senses. Heatsense, Magnetoreception, Woodsense and Aquatic Echolocation have no matching PF2e sense and stay notes.
- **Enhance Senses:** doubling the target's imprecise senses stays a note.
- **Personal Ocean:** stays on its note route to keep its fire counteract; its swim Speed is the GM's.
- **"The nearest unoccupied space" or "a space of its choice" next to an area** (Garden of Stone, Blade Barrier, Lifewood Cage, Frost Pillar): the module moves the creature to the nearest free space outside the area (Frost Pillar: an adjacent space). The GM moves it elsewhere if it chooses.
- **Tornadic Gale:** the GM targets the creatures adjacent to the line as well. The module moves each one of Medium size or smaller that's outside the line into the nearest free space inside it, before the pushes.
- **A push stopped short:** only a wall or the scene's edge counts as a firm surface. Arcane Explosion's creature is knocked Prone; Planar Collision's takes bludgeoning damage equal to the feet left. A creature that ends beside another creature (the adjacency rule) completes its push.
- **Warping Pull:** stays the GM's (the caster picks the square).

### GM notes and notes batches 2 and 4, interpretations

The user (2026-10-05): "continue with N2 and N4 and also make all GM notes only visible to the GM".

- **GM notes:** a module note is the GM's unless it's labelled for the caster or player or reports a result ("Caster:", "Strike:", "Moved:"). Those stay public.
  - A message made only of GM notes is whispered to the GMs.
  - A shared card keeps its other content; players' clients drop the GM notes from it.
  - Notes inside player-owned Effects' descriptions are hidden from players only where they use PF2e's `data-visibility="gm"` (the note Effects' "mark the area" line).
- **Vacuum's suffocation:** PF2e's rules as the spell's note states them. A DC 20 Fortitude save at the end of each of the creature's turns, +5 DC and +1d10 each later turn; a failure deals the dice, a critical failure kills. The GM removes the Effect when the creature can breathe.
- **Stone Lance:** "on the ground" means elevation 0. A critical hit on a creature above that gives no Immobilized; the speed penalty stays.
- **Pact Broker:** the caster's penalty is a toggle the caster switches on once the target accepts.
- **Pyrotechnics:** a token targeted as the fire source that has an actor is a creature, and takes the cold damage as the area starts.
- **Theogeny:** the 10 spirit damage applies to a creature carrying the foes' option Effect, when an attack roll against it is a critical success or it critically fails a save.
- **Musical Shift:** flat covers a critical failure at a Strike (attack roll), a save or a skill check. Sharp covers damage taken whose roll options include piercing or slashing. The bleed's flat-check DC is 15.
- **Spellsurge:** only Interference becomes an aura. Mana Well, Overpower Resistance and Ward stay notes. Changing the ability means casting again.

### Spell features (batches 1–6), interpretations

The user (2026-10-05): "audit and implement all of them" (what in PF2e builds on the official spells). The audit is in `docs/planning/spell-features-audit.md`.

- **Text-built damage (F1):** a spell whose damage the module builds from its text is rolled as PF2e spell damage, so the caster's spell-damage rules apply to it as to any other spell.
- **Blood magic (F2):**
  - The bloodline is read from PF2e's blood magic toggle, else from the actor's bloodline features.
  - The target option needs the creature targeted.
  - Hag's spite is spent by the first creature the GM marks as having damaged the caster.
- **Casting rules (F3):**
  - **Stupefied:** its flat check runs on every cast; a failure loses the spell, and its cards refuse to resolve.
  - **Steady Spellcasting:** its check waits for the GM to mark the spell disrupted.
  - **Communal Healing:** heals the creature targeted when its button is pressed.
  - **Counterspell:** offered to every foe on the scene who could counter.
    - The counteract modifier is the entry's spell attack modifier.
    - Master's Counterspell's –2 applies to any slot of the rank or higher.
- **Spellshape items (F4):**
  - "Prepared from this grimoire", the depicted dragon's damage type, a "wall spell" and a blood-manipulating spell are the table's to judge.
  - **Shadow Signet:** the roll against AC is moved by AC minus the chosen DC, which gives the same degree as rolling against that DC.
  - **Hundred-Moth Caress:** its damage to the wielder is untyped and ignores everything. The spell's extra void goes to each creature the spell damages.
  - **Bloodstained Treatise:** its blood is fixed where the chosen target stood.
  - **Radiant Tome:** its light moves with the caster.
  - **Liar's Lexicon:** its Lie is against every creature on the scene not allied with the caster.
- **Item casts (F5):**
  - A spellheart's cantrip is heightened to half the item's level, rounded up. Another spell with no stated rank is cast at its own rank.
  - When only the DC or the attack is stated, the other is 10 apart.
  - A character's item entry sets the actor's spell DC if it's the higher one (PF2e's own rule for entries).
  - A legacy school in a spellheart's benefit ("an enchantment spell") counts any spell cast from that spellheart.
  - **Spell Reservoir:** "can target a creature other than the caster" is read as a spell with targets other than "you".
- **Spell-trigger items (F6):**
  - **Rune of Sin:** must be invested.
  - **Spell Duelist's Siphon:** the grimoire counts as raised when the holder has Raise a Tome (raising it is the player's). Its counteract uses the holder's best spell attack modifier at half the holder's level.
  - **Reflecting Shield:** a reflected spell is turned back by the GM.

### Spell features (batches 7–10: conditions, actions, creatures, the rest), interpretations

The user (2026-10-06): "audit and implement all of them" (the conditions, the spell-delivering actions, the creature abilities and the compendiums the first audit hadn't read).

- **Conditions:**
  - Restrained loses any spell with the manipulate trait. Grabbed and Deafened lose it on a failed DC 5 flat check; this is checked before Stupefied's.
  - Fascinated and Confused are told to the GM, not enforced.
  - The concealed and hidden flat checks are for spells with a "Targets" line, against the PF2e conditions on each target.
  - A missed target is left out of the spell's cards; when every target is missed, the card refuses.
- **Spell delivery:**
  - The Spellstrike-type card is offered on every fitting cast, since whether the caster delivers it is the player's to say. The Strike that counts is the caster's first against the target after the cast.
  - Spellstrike with a save spell is disrupted only by a critically failed Strike after the cast.
- **Intercession Spell:** offered to every allied creature with the action; whether the caster is its hierophant is the table's.
- **Dueling Counter:** offered among the counters whenever its holder has a slot. The duel and the tradition focus are the table's.
- **Absorb into the Aegis:**
  - It counteracts at half its holder's level, rounded up.
  - Its shield damage is reduced by the shield's Hardness.
  - Only a success counteracts.
- **Ring Bell:** offered for any foe's cast within 30 feet; the Exploit Vulnerability target is the table's. The stupefied lasts until the end of the thaumaturge's next turn.
- **Creature abilities:**
  - They're read from each creature's own copy; the glossary's templates (with "+x" or an empty DC) aren't.
  - Aura counteracts use counteract rank half the creature's level, rounded up, where the text gives none.
  - Blasphemous Aura's halving falls on the spell's targets (the caster when none), once.
  - Warped Fulu counts a spell cast from a scroll or wand (PF2e's embedded spell).
- **Curses and relics:**
  - Nethys's Moderate Curse's failure loses the spell; the GM casts the opposite kind.
  - Sarenrae's Major Curse's minimum damage and +4 are told to the GM, not applied.
  - River's Reflection swaps the damage type; the healing's swap is the GM's.

### Third-party modules (batches 1–3), interpretations
- **The modules' own Effects** (user decision 2026-10-06, "Check each one"):
  - Each linked Effect is read at each degree and compared rule by rule with the row's text.
  - The module applies an Effect built from the text, for the text's time, either way. The data note says whether the module's Effect matched.
  - An Effect whose choice is made by hand (Demand Compliance's "-1"/"-2") isn't read by degree.
- **Wreak Havok:** with no Arcane Cascade stance chosen, the damage is force (the stance's own type).
- **Residual Bad Luck:** the held frightened is the value it had when the check failed, restored after PF2e's end-of-turn reduction.
- **Cursed Mark:**
  - The mark is PF2e's misfortune on the next saving throw (RollTwice, keep the lower), removed after that save.
  - The Interact actions to remove it are told on the Effect: the player removes it.
- **Demand Compliance:**
  - The demand holds only on a failure or critical failure: a success "immediately ends" the spell.
  - The demand is a GM note for the spell's duration. The GM ends the spell when the target completes the demanded action.
- **Golden Touch:**
  - The module applies the rows to creatures.
  - What the rows say of an object target (its holder's Stealth penalty, checks made with it, Broken) is told on the note.
  - "Weakness 4" at rank 4 with Heightened (+1) is the cast rank; doubled on a failure.
  - Slowed and Petrified last the spell's duration, until the end of the caster's next turn.
- **Hand of Judgement:** whether the target broke the area's laws within the last week is the GM's question on the card; a "yes" gives –2 to its save.
- **Grand Finale:**
  - "Blinded and deafened for 1 round, and then dazzled for 1 minute": Dazzled lasts 11 rounds from the cast. PF2e's Blinded overrides it for the first round.
  - Ending the required spell and placing the area are a card reminder.
- **Ray of Light:** "shadow trait or light blindness" is the GM's question per creature. The ambient light and the longer line at higher ranks are reminders.
- **"On a failure" in a basic save's rider:** also applies on a critical failure.
- **Virtue's Light:** a holy weakness the creature already has is added to (existing + twice the rank), as the text says; PF2e would keep only the higher.
- **Glutton For Blood:** the GM removes the fast healing when the target stops bleeding or leaves range.
- **Dual-Pattern Strike:**
  - The card asks whether both Strikes hit before applying the sigil.
  - The module Effect's extra choice for Elaborate Patterned Strike (a feat the text doesn't name) is removed, and the weakness set to the text's value.
- **Module Effects:** their old `flags.pf2e.rulesSelections` paths are read as PF2e's current `flags.system.rulesSelections`.
- **"Dynamic" spells:**
  - Each action-count variant reads its own version.
  - A version's immunity ("immune to the one-action version") applies to that version only.
  - The text's heightened step wins over the variant's data, for example Breathe Fire's 2d6.
  - Breathe Fire's one-action square "within 15 feet" gives the variant that range.
- **Dynamic Daze, one action:** off-guard against the caster only, removed after the caster's next attack roll against the creature or as the caster's turn ends.
- **Staff Striker:** the variant the caster picks is the grip; the two-handed variant's 1d8 assumes they wield the staff in two hands.
- **Needle of Vengeance+:** the critical failure's Enfeebled 1 comes from the triggered save that critically fails, and lasts until the spell ends.
- **Old-Mage's Echo:**
  - The GM reports each cast and its rank.
  - The deafened flat check for non-auditory, non-subtle spells is on the note, not rolled.
- **Silence of the Archmage:**
  - The success's Interact to break free is the player removing the Effect.
  - Removing the curse is the GM's.
  - Activating items and affixing talismans under the DC 11 check are the GM's; casting is rolled.
- **Saves on each Sustain:** offered once per caster turn on the cast message, up to the spell's maximum. A row that ends the spell closes them.
- **Lurking Doom:** the critical failure's concentrate check lasts until the caster's next turn ends. Concentrate spells are rolled; other concentrate actions are the GM's.
- **Holding Glyph:**
  - The penalty "against forced movement effects" is a toggle the GM switches on for such a save (or a Shove's or Reposition's DC).
  - The GM reports move actions.
  - Both last until the next Sustain's save.
- **Realityflicker:** a critical failure's second roll that repeats the first, or comes up 4, is the caster's choice of a different condition.
- **Lost in the Crowd:**
  - On a critical failure, "off-guard to your allies in addition to you" is PF2e's Off-Guard.
  - "Treat all creatures as enemies for flanking" is PF2e's can't-flank, ended by a successful Seek.
- **Judge Soul:**
  - The text's void damage overrides the item's bludgeoning, and creatures with void healing take vitality.
  - The permanent death, the shades and the caster's reincarnation are told to the GM.
- **Hemophilia:** the GM reports the first bleed damage while the spell lasts.
- **Creeping Cold:** its damage comes from the text, since the item has none.
- **Ravaging End:**
  - The persistent damage ends when the spell's note on the creature does.
  - Assisted recovery can't end it automatically while the spell lasts; that's on the note for the GM.
- **The End is Nigh:** the frightened floor lasts as long as the misfortune Effect, which PF2e removes after its next attack roll or save (the spell ends then).
- **Sensory Deprivation:** a restricted trait's spells are refused at the cast; its other such actions, and its manipulate Interacts, are the GM's.
- **Bewilder:** the flat check on each hostile action is the GM's (the note).
- **Quick Siphon:** ending one persistent bleed is the caster's pick after the healing; keeping it is allowed.
- **Umbral Escape:** the module's Effect lasts until the caster's next turn, but the text's resistance lasts only during the Stride. A note says to remove the Effect when the Stride ends; its granted immunity stays.
- **Shadow's Betrayal:**
  - The item has no attack trait, but its text makes a spell attack roll, so it counts toward the multiple attack penalty as PF2e's spell attacks do.
  - Off-guard is answered at the card as +2 to the attack.
  - The target's Strikes are read from its sheet; whether it is "wielding" one is the GM's.
- **Careless Swings:** the Strike's added trait is a note only, because reactions to it are triggered by hand.
- **Shade of Night:** PF2e's senses aren't changed; the reduced vision is a GM-played note in the cast rank's words.
- **Siphoning Rivulet:** the extra 4d4 is bleed damage dealt at once (the text adds it to the bleed being taken), not a new persistent condition. The caster gives the triggering bleed amount.
- **Unknowable Icon:** the GM triggers the rune when it activates and targets the creatures within 10 feet. Its save is basic, as the text says (the item's data isn't marked basic).
- **Drown:** a creature that doesn't breathe is set unaffected by the GM. Holding breath and suffocation are the GM's, from the note.
- **Kinetic Tow:** the GM moves the target toward the chosen creature or object. The re-save is rolled as Fortitude; using Athletics instead is the GM's.
- **Text saves where the item has none (Eternal Slumber):** the text's save is used, not basic, when the item's data has no save and the text names exactly one save over a full degree table.
- **Eternal Slumber:** the waking save and the caster's ending condition are the GM's, from the notes. Concentrate actions other than spells are the GM's.
- **Summon Jury:** the critical failure's penalty to the Depart save is a toggle the GM switches on for that save.
- **Sudden Outbreak:** whether the target is diseased, and its disease saves, are the GM's.
- **Ruler of Everything:** whether a creature is noble is the GM's answer. Removing Prone after the rebuking reaction, the hostility restriction and the Stand restriction are the GM's.
- **Web of Darkness:** "its Speed" is read as all its Speeds, as the official spells' penalties are. The tether, the Escape and cutting free are the GM's.
- **Divine Adjudication:** the caster's +1 to attacks against the creature is a GM note, since only the GM knows the creature's acts.
- **Beguile:** a hostile action by the caster ends the conditions; the GM removes them. The critical failure's turn-start save, the move and the adjacency's Off-Guard are the GM's.
- **Dream Come True:** disbelief (a single concentrate action, its check unstated) is the GM's. Fascinated (fantasy, critical failure) lasts until disbelieved.
- **Warped Visage (deferred):** its Sustain makes one of the target's allies save, and no control does that yet.
- **Liberator's Ferocity:** the resistance applies against the triggering attack only, and the damage bonus against the triggering creature only (the GM's). Both last 1 round, as the text says.
- **Weapon Trance (Team+):** for a second weapon, the Effect is applied again with its own weapon choice.
- **Freezing Cold:** the caster places the area for the actions spent; the terrain's rounds are the GM's.
- **Blood Surge:** the blood rage's additional damage and its optional damage type are the class's (Barbarians+), so they're reminders. The card rolls force.
- **Tidal Grasp:** the target's size limit by rank is the GM's question. An Escape's critical success also leaving it immune is the GM's.
- **Wishful Thinking:** the end-of-turn Deception check (the spell ends on a failure) and the water breathing are the caster's and GM's, from the notes.
- **Life of the Party:** each creature that eats a treat is targeted for the Effect. The second treat's Sickened 1, and removing the damage bonus once the temporary HP are gone, are the GM's.
- **Dynamic versions (in progress):** where a version's text says "with a basic … save" but its PF2e variant marks the save not basic (Dynamic Caustic Blast's two-action version), the text's basic save is used (`glyph-versions.js`).
- **Dynamic Caustic Blast:** whether a creature has Hardness, and lowering it once, are the GM's. The three-action Splash variant is cast on the ring's creatures as its own card.
- **Dynamic Telekinetic Projectile:** the hurled object's limits (1 Bulk or less, unattended, within range) and the three-action version's cover are the GM's.
- **Action versions (Dynamic Shield):** a spell cast with 1 to 3 actions and no PF2e variants asks the actions spent on its card.
- **Dynamic Fly:** the three-action version's Fly (up to twice) and the one-action version's Fly are the caster's own moves.
- **Dynamic Gouging Claw:** the module's linked Effect has no rules, so the text's claw Strike is applied as PF2e's Strike rule element. The three-action attack's 20-foot reach is a reminder.
- **Dynamic Vampiric Feast:** the two- and three-action versions use a basic Fortitude save, from the item's data, as official Vampiric Feast does; their text names no save. The one-action marker applies to the caster's next spell that deals damage through a save or attack card.
- **Dynamic Ignition:** casting the one-action version again ends the previous square; the GM ends it in Ongoing spells.
- **Aura of Violent Light:** the aura's light is a note. The emanation that enemies save against is the bright light's radius.
- **Propagating Arc:** the spread uses one roll of the text's (rank)d6 for every creature. The creatures 10 to 20 feet away take half of what their own basic save gives.
- **Warped Visage:** the caster names the ally that saves, by targeting it. When there's only one ally in reach, that ally is used; otherwise a dialog asks. The critical failure's "not treated as an ally" is a GM note.
- **Cosmic Glow:** the caster and its allies in the glow's square hold the +2 Recall Knowledge bonus while there. Choosing the bonus "instead" of damage is done by leaving that creature out when reviewing the Sustain's targets. The light is a note.
- **Technomancy Ray:** the die comes from the caster's Crafting rank, not the item's class-feature flag. The Variable Core type is acid, cold or electricity, asked on the card.
- **Mark of Mystery:** "you or an ally" is read as the caster and the targeted ally, the two who bear the mark. The triggers are an attack roll on either, or a save card the module starts against either. A creature that has saved is immune right away; the text's "or is no longer frightened" doesn't come up within the spell's 1 minute.
- **Targeted Ward:** the caster picks the defense on the Effect's ChoiceSet. The one-action version's bonus is behind a toggle the caster switches on for the focused action. The three-action version's one change of defense is a note: edit the Effect's choice.
- **Discern Secrets+:** the +1 status bonus applies to the targets' Recall Knowledge, Seek and Sense Motive rolls, as PF2e's own Discern Secrets Effect reads "the statistic used for the roll". The module's links name Effects PF2e no longer has, so the Effect is built from the text.
- **Enchanting Rhapsody:** enemies still in the area save again as each of their turns ends. A repeated note doesn't stack (the status penalties don't).
- **Overwhelming Festivities:** "fails a save against an emotion effect" is read from PF2e's saving-throw message: the emotion trait in its roll options. "Gains the frightened condition from an effect" is any new Frightened condition while the creature is in the aura.
- **Divine Eclipse:** the caster isn't exposed to its own darkness. Everywhere in the emanation counts as dim light or darkness, except within 5 feet of a blessed creature (its bright light). Other light sources the GM leaves lit fall under the GM's review of each exposure.
- **Shadow Puppetry:** the text states no save, so none is rolled. The item's two PF2e variants add a Will or Reflex save that the text doesn't have.
- **Channel Imperial Dragon:** the dragon is the caster's class pick. It's read from the caster's Imperial Dragon Emissary choice when present, otherwise asked from that dedication's five dragons (their trait and damage type). The Sustain's bonus is a GM option on the card. The spell gaining the dragon's tradition is a note.
- **Secret of the Forebearers:** the patron's skill is asked at the cast. The forebearers' Aid is a card option the GM presses when the caster calls on it: DC 15, once a turn. Its bonus applies to the caster's next attack roll or skill check that turn. The concealment after an aided success is the second option.
- **Planar Court:** the caster names the attribute on the card, and the penalty uses PF2e's "-based" selector for its checks, DCs and saves. Both creatures vanishing until the target's next turn is a GM reminder; the GM hides their tokens.
- **Ice Guardian:** "You and your allies gain lesser cover while you are adjacent to the guardian" is read per creature: the caster and each ally beside the guardian. The guardian's saves aren't stated, so they're +0. Its Stride on a Sustain is the caster moving its token.
- **Proxy spells:**
  - Coalesce Form: the daily "anatomical configuration" is asked when cast, from the polymorph spells of PF2e and the "+" modules, at this spell's rank.
  - Untamed Aspect Shift: offers the two spells its text names (Animal Shift from 2nd). Shapes added by druid feats are the GM's.
  - Witch's Bottle: offers the caster's own hex spells, cast at their own rank.
  - Each picked spell is resolved as its own card would be: Ongoing family, lingering area, Effect or save card.
- **Fractal Frosting:**
  - Frostbite is cast with it at the same rank.
  - For the minute, a caster Effect shapes each Frostbite cast, including this first one: difficult terrain in a 5-foot emanation around each target until the caster's next turn.
  - From 9th rank, a target that fails takes a –5-foot Speed penalty; one that critically fails takes –15 feet. The text gives "1 round" for both.
  - The range of 60 feet and the three targets are a note on the caster's Effect. PF2e's targeting decides them.
- **Manifest Wicket Dominion:**
  - The area is centred where the caster stands when casting, and stays there ("stationary").
  - Only the caster benefits, and only while inside: "while within the area" is read as the caster being in it. The module's Effect asks for the target to be in the area instead, and counts slot spells only.
  - "Focus Points or your spell slots" is read as slot spells plus non-cantrip focus spells.
  - The wicket traits are the two set by the caster's wicket feat (`flags.pf2e.wicketTraits`).
  - "Initial damage only" and "once per creature" are a GM note.
- **Promised Renewal:**
  - The fast healing follows the Heightened (+2) entry: 3, then +2 every 2 ranks (5 at 5th, 7 at 7th). The inline roll `3 + 2 * (rank − 3)` would add 2 every rank.
  - A corpse is a creature that is dead, or at 0 Hit Points and neither dying nor unconscious. It gets the growth at once, with no save.
  - A creature that isn't dying and isn't a corpse can't be targeted.
  - The fast healing is for creatures with the minion trait and one of the fungus, plant or wood traits.
  - The text says the fast healing also applies to creations with Hit Points, such as Protector Tree. That part is a GM note.
- **Instant Surgery:**
  - "All rolls made with these attributes" is read as PF2e's `<attribute>-based` checks: skills, saves and attacks keyed to that attribute.
  - Damage rolls aren't changed.
  - View Internal Anatomy counts as active on the creature when the caster holds that spell's Effect aimed at it.
  - A miss gives nothing, since the text has no failure rows.
  - The willing creature's Aid is a note.
- **Garden of Crystals:**
  - The spell has no duration, so the crystals and the terrain stay until the GM ends the spell in the Ongoing manager.
  - The emanation is centred where the caster stands when casting.
  - "Though you can ignore it" is a reminder Effect on the caster, because Foundry's difficult terrain can't exempt one creature.
  - The crystals "occupy the area": each cluster's squares are walled off for movement. Their 10-foot height and whether they block sight are the GM's.
  - Every creature in a cluster, of any side, is moved to the nearest free adjacent space.
  - "Adjacent to one of these clusters" is a creature standing in the squares around a cluster. Those creatures get the critical force dice on Strikes, spells and impulses, as the module's Effect gives.
- **Gruesome Marionettist:**
  - The item marks the save as basic, but the text gives its own rows, so the rows are used.
  - The caster names the two actions when casting.
  - Whether the creature took the prohibited or the directed action is the GM's call, with a button on the card for each.
  - Each prohibited action applies the persistent bleed again. PF2e keeps the one that already runs.
  - On a success the spell lasts until the caster's next turn. On a failure it lasts for the sustained minute.
- **Mind's Eye Wink:**
  - The caster picks the area or the object when casting.
  - **Area:** the GM draws the 4 squares as a region and selects it. Each creature in it when cast, or entering it, attempts the Will save.
    - A failure gives Stupefied 1 while inside and for 1 round after leaving.
    - A critical failure gives Stupefied 2 while inside, then Stupefied 1 for 1 round after leaving.
    - Disbelief after a Seek is the area's Perception control.
  - **Object:** following the 2026-10-01 objects decision, the holder's Will save is rolled on the card. A failure gives an Effect with −1 (−2 on a critical failure) circumstance to checks, behind a "Using the object" toggle.
  - The unattended object's pick-up belief is the GM's.
- **Lucky Decision:**
  - The d20 is rolled when casting and kept on the caster's Effect until the GM removes it at the next daily preparations.
  - Using a reaction is a button on the card. Its trigger (a non-secret roll, an enemy about to roll) is the player's and GM's call.
  - The substituted d20 covers the next attack roll, saving throw or skill check, through PF2e's SubstituteRoll, which is forced since the reaction has been used.
  - The penalty applies to that one roll and is then used up.
- **Wooden Engulfment:**
  - The tree is a token (decision 2026-10-01: conjured creatures are tokens), Huge to fill the 15-foot square. Its saves aren't stated.
  - Creatures in the square are moved to the nearest free adjacent space. The text lets them choose the square; the GM can move them again.
  - The grab is the caster's spell attack against the creature's Reflex DC, with the multiple attack penalty the caster picks.
  - At the cast, the grab is made only when one creature within reach is targeted. After that it's the card's control on each Sustain.
  - Grabbed and Restrained last until the end of the caster's next turn.
  - The tree that outlives the spell in soil is a note. Its token is removed when the spell ends.
- **Famed Figure:**
  - It is handled like Illusory Creature: a token, and the card's Strike and Disbelieve controls.
  - The melee Strike deals (1+rank)d4 mental and the ranged Strike rank d4 mental, within 30 feet of the image.
  - The image's multiple attack penalty is asked for each Strike.
  - Casting it again ends the caster's earlier image.
  - "Recovers from half the damage if the spell ends while observed" is a note. The Disbelieve control's recovery is automated.
- **Coiling Grasp:**
  - The Grapple rolls whichever of Athletics and the spell attack modifier is higher, against the target's Fortitude DC.
  - The row's condition (Immobilized on a critical success, Grabbed on a success) lasts until the end of the caster's next turn. A Sustain tries again, and each attempt replaces the last hold.
  - A failure holds nothing.
  - On a critical failure, the target's choice is asked: grab the caster, or knock it Prone.
  - The required flail and the hand holding it, and the Escape, are notes.
- **Dream Logic:**
  - The save happens once, for each creature in the aura when the spell is cast, not the caster. The text doesn't say a Sustain or entering the aura repeats it.
  - A willing creature takes a failure.
  - Object Fallacy and Static Time say "you", which is read as the creature that failed:
    - Object Fallacy: +1 circumstance to Make a Request and Demoralize until the start of its next turn, plus the object-speech note.
    - Static Time: its timed Effects are lengthened by the 1d4 rounds. Conditions with a duration but no Effect are the GM's.
  - Warped Energy: each of the five energy types gets its replacement rolled when applied (1d4 among the other four), until the end of the creature's turn.
- **Honorable Death** (one interpretation to review):
  - **For review:** "A creature that is reduced to 0 Hit Points while this spell is active is instantly killed" is read as the spell's **target** only. Read literally, it would kill any creature, the party included, which seemed unlikely to be meant. Say if every creature should die at 0 HP while it lasts.
  - Whether the target took a hostile action against the caster or the champion is the GM's call, through the end-of-turn control.
  - The damage is twice the cast rank in spirit damage, with a basic Will save.
  - On a failure or critical failure, the recovery save follows the damage step at the end of each of the target's turns. Its success removes 1 round; its critical success ends the spell.
- **Shine Spotlight:**
  - The Stealth penalty is circumstance, as the text says; the module's Effect gives a status penalty. The Perform bonus applies only to the Perform action.
  - "Within 15 feet of the burst" is measured from the burst's edge to the creature's centre, less half its width.
  - Onlookers save once, when the spell is cast.
  - The fascination lasts until the spell ends. When the fascination is removed, the off-guard goes with it.
  - A performer's Sustain is the card's control. Its Performance must exceed each onlooker's Will DC.
- **Coiling Creepers:**
  - The maneuver is PF2e's own: the caster's spell attack modifier against the creature's Reflex DC (Disarm, Trip) or Fortitude DC (Reposition).
  - "In the area or an adjacent square" is measured from the burst's edge.
  - "Treated as a Large creature" means it can target Huge or smaller.
  - Results:
    - Trip: Prone, plus 1d6 bludgeoning on a critical success.
    - Disarm: on a success, −2 with the item until the start of its turn. On a critical success, the item drop is the GM's.
    - Reposition: the 5 or 10 feet is the GM's, from the card.
    - The maneuvers' critical failures don't apply to the creepers.
  - A cleared square is the card's control: the targeted token's square is cut from the area. The damage that clears a square is shown at the cast rank.
- **Long Live the Revolution:**
  - The GM targets the creatures that notice the call. Who is willing, and who is in conflict with the act (+4), are the GM's options.
  - The saves are PF2e's own, with the spell as origin, so incapacitation applies.
  - The critical successes' bonus is counted on the caster's Effect and applies to later saves against this spell (the Sustain's newcomers), up to +4. It doesn't stack with the opposed +4.
  - A success or critical success gives immunity for 1 hour, as does ending the effect through its controls.
  - The rebels' attitude change is a note. Their +1 is behind a toggle for checks to complete the act.
  - The spell is sustained with no stated limit, so it is set to 10 minutes.
  - "Your spell automatically fails" for an unfit act is the GM's.
- **Unleash True Power:**
  - "Spells you cast while this hex is active are heightened by one rank" applies to every other spell the caster casts while the Effect lasts, through the cast's shaping. It is capped at 10th; a spell already at 10th stays there.
  - A spell cast through the patron is the card's control. The toll is 1d6 spirit per rank of that spell, after its heightening, with a basic Fortitude save against the caster's own spell DC.
  - Turning it into a single action, and the first-Sustain limit, are the player's.
  - When the Effect ends, the final shock is a save card for the caster and every creature within 10 feet.
- **Mystic Bomb:**
  - The damage type is read from the caster's Arcane Cascade Effect's choice, or asked.
  - A waiting bomb is moved by moving its region; the "explode" control then checks for creatures in it.
  - Growing the burst is the end-of-turn control, 5 feet at a time up to 20 feet.
  - An Aid uses the ally's higher of Athletics and Arcana against the standard DC for the caster's level. A success adds 1d6 and counts once; a critical success adds 2d6 and counts twice.
  - Each ally can Aid once. The number of Aids is 3, plus 1 per rank above 6th. Once it's used up, further attempts fail.
  - Expansive Spellstrike is a note.
- **Spirit Boundary:**
  - Damage "passes through" the shield when its origin (the attacker) and the creature damaged are on opposite sides of the shield's edge.
  - This needs PF2e to record the damage's origin, which it does when damage is applied from an item (a Strike, a spell). Damage with no origin isn't reduced.
  - The reduction comes after the damage: the Hit Points are given back.
  - "Only takes damage once" counts one effect as the same origin item within the same turn and a few seconds.
  - The spell is destroyed at 0 HP. Dismissing it is the three-action version's card control.
- **Seeds of Divinity:**
  - The bushes are tokens (decision 2026-10-01), placed by the caster where each seed lands. Releasing or throwing a seed is the player's.
  - "Maximum cursebound value" is asked when casting; the oracle's sheet doesn't hold it.
  - A hazardous bush deals its piercing and poison damage to a creature entering its square. "Moving through" is read as entering.
  - A bountiful bush's fruit lasts until the spell ends: the temporary HP and the status damage bonus.
  - The bushes' concealment is a note.
- **Prism of Power:**
  - The option is chosen when casting, as the text says.
  - **Scatter:** the card rolls one spell attack against the AC of each targeted creature (up to 2, within 5 feet of the prism's square). The spell's damage for each hit is rolled from the spell's own card.
  - **Diffract:** the card asks the feet the line had left. It computes the cone (half, in 5-foot steps, at least 5) and can place it from the line spell.
  - **Refract:** measuring line of effect, cover and range from the prism is the GM's, from the card's note.
- **Animated Spark:**
  - The animated objects are a PF2e familiar whose master is the caster, so their statistics are a familiar's for the caster's level. They have the minion trait, Construct, and 2 abilities chosen when casting.
  - The abilities are offered from PF2e's familiar abilities, excluding Spellcasting. The "pet abilities" limit before 11th level is the GM's.
  - The weakness type is asked when casting; the weakness equals the caster's level.
  - Disperse rolls (1+rank)d4 of the chosen type on the creatures within 5 feet, with a basic Reflex save. The spell then ends.
  - Casting it again ends the earlier spark.
  - The unsustained task, and the School of Unified Magical Theory's multiple familiars, are notes.
- **ANSWERED 2026-10-07 (the last two third-party spells):**
  - Patron's Apocalypse's table is missing from Foundry's data. The user shared the book's text (Lesson of Apocalypses), now kept in `src/compiler/supplements/patrons-apocalypse.js`.
  - The empty Dynamic Breathe Fire copy: "Use the full copy's plan".
- **Patron's Apocalypse:**
  - The apocalypse is asked on the first cast and then kept on the caster ("selected when you first take the Lesson").
  - Each burst is a region. A creature starting its turn there takes the apocalypse's damage with a basic Reflex save. The extras:
    - Cosmic: Dazzled while inside.
    - Corpses: undead healing is left to PF2e's void healing.
    - Flames: a concealing area.
    - Floods: −2 to saves and checks against forced movement and water while inside.
    - Frost: −10 feet to all Speeds for 1 round, whatever the save.
    - Nature: 10 persistent bleed, whatever the save.
    - Plague: Sickened 1 on a failed save.
    - Rapture: the caster and its allies take no damage and get +1 status to attack rolls while inside.
  - On a Sustain, a burst moved up to 30 feet leaves hazardous terrain where it was. A creature entering it takes 10 damage of the type, plus the extras (Plague's Sickened for any creature passing through).
  - The bursts follow the usual Sustain rule: each ends if it isn't sustained.
- **The empty Dynamic Breathe Fire:** casting it casts the written copy at the same rank, asking which of its versions (variants).
- **ANSWERED 2026-10-06 (third-party scope):** asked whether third-party spells of the 2026-10-04 GM-handled kinds count the same way, the user chose "Yes, same rule". GM-handled: If Walls Could Talk, Fall to Ruin, Raise Mountain, Thousand-Year Flood, State of the Art, Sacrosanct Promise, From Thine Sight (batch 16). Long Live the Revolution isn't clearly of those kinds, so it stays to be automated.
- **Third-party features batch 1 (2026-10-07, "+" spellshapes):**
  - Persistent Spell: "matching the damage type of the spell" means the spell's damage type; with several, the caster picks (as the text says). The doubling on a critical doubles the persistent formula.
  - Bleeding Spell: "one creature of your choice … made when you Cast the Spell" is asked at the cast when the spell has more than one target.
  - Trepidation Spell: "at least 2 ranks below your maximum rank" is compared with the highest rank the caster can cast. A Frightened from the spell itself is raised to the rider's value, not added to.
  - Heightened Spell: the cast rank goes up by 2 for the whole resolution. The text's limits (no extra targets, counteract and incapacitation at the real rank) are posted as a note for the GM.
  - Dueling Wand: the bonus is a status bonus to spell attack rolls until the end of the turn, by the caster's level.
  - Draining Cast: the Hit Points are lowered directly (no damage, resistance or temporary Hit Points).
  - Befuddling Spell: other creatures' checks against the spell are the GM's, from the posted note.
- **Third-party features batch 2 (2026-10-07):**
  - A "+" spellshape's leading Requirements (spellgun wielded, mystic link active) is a table requirement unless the module can check it. Storm Spell's cursebound value and encounter are checked.
  - Heroic Recovery+ "At 16th level": the caster's level. The damage bonus stays +1, as the text raises only Speed and attack.
  - Mighty Summons: "as if the spell were 1 rank higher" resolves the whole cast at that rank (the summon's level is what it changes), capped at 10th. Past 10th, the Special's "two levels higher" is the GM's note.
  - Storm Spell: the terrain's damage uses the rank the spell resolves at, and lasts as many rounds as the cursebound value at the cast.
  - Travel Channel, Ride the Spell and Slot Rehearsed Reload give the caster an action or movement it takes itself; the module doesn't move the token.
  - Tenacious Magic: the next spell uses mythic proficiency, with no Mythic Point spent. Once per day is the table's.
- **Third-party features batch 3 (2026-10-07):**
  - Safe Spell: "allies" are targets on the caster's side. The caster picks them on the card, and they take nothing from the spell.
  - Compressed Spell: the caster picks the one creature among the targets in the area; the rest are excluded. The size compared is the area as cast (after any widening). The module's Effect (−3 untyped, unlimited) isn't used; the text's status penalty lasts for that save only.
  - Reshaped Spell: a cone becomes a line twice its length and 5 feet wide; a line becomes a 90° cone half its length.
  - The Lurking Storm: the rolled total is halved, bludgeoning taking the odd point. Persistent damage keeps its type.
  - Sacrificial Spell: "all your targets are living creatures" is the table's. The d12s apply only to that cast's healing roll.
  - Transmute Spell: the essence and type are asked at the cast, not when the action is used; "your main spellcasting tradition" is the table's. Spirit: a creature without a weakness to holy, spirit or unholy takes no damage from the spell, but its other effects still apply. Mind's extra mental damage applies to each creature the spell damages.
  - Huddle Channel: applying PF2e's roll to the second creature is the table's; the module checks the 1-action Harm or Heal on one creature.
- **Third-party features batch 4 (2026-10-07, mystic duo):**
  - The duo is the other creature on the scene holding Magic+'s Effect: Mystic Link (the link the caster made, else the one that made the caster's, else the only linked creature). "Your mystic link is active" means the caster holds that Effect.
  - Eldritch Resilience: the module's Effect, at the spell's rank, with its "Ranked Spell" or "Cantrip" choice set from the spell. It ends when the duo's link ends.
  - Spell and Steel: "a successful Strike since your last turn" is the table's. The damage is added to the spell's for each creature, so a save scales it. Its type is one of the duo's weapons' types, asked when the duo has several.
  - Linked Target Spell: "targets yourself" is the table's. The duo's Effect ends with the duo's link, and using it again deletes the earlier Effect.
  - Twinned Target Spell: the caster keeps its own Effect when the link ends; only the duo's copy ends.
  - Ally Form: "a battle form" is a polymorph spell from a slot. The ally is an adjacent creature on the caster's side, asked when there are several. A longer duration is cut to 1 minute.
- **Third-party features batch 5 (2026-10-07):**
  - Drain Destiny: "regain a Mythic Point" stops at the caster's maximum. A target's point is taken only if it has one. The Spellstrike use is the table's.
  - Reporting Spell: the caster picks the enemy and the fact. When the enemy has no weakness, immunity or resistance, the caster learns that it has none. The automatic facts are added to the same whisper (to the caster's owners and the GM). Saves tied for lowest count as the weakest.
  - Enlightening Spell: "targets an ally" means each ally that receives the spell's Effect or healing. The bonus Effect is given only while the caster is cursebound, as the text says.
  - Beguiling Feint: rolled when the save card opens, against the target the caster picks within 30 feet. Off-Guard "to your spell" lasts until the card finishes. Concealment from one creature can't be expressed in PF2e, so it is a reminder Effect on the caster; on a success, the reminder says it ends after a hostile action.
  - Explosive Blood (not yet done): Rage's extra damage comes from each instinct's own rules, so doubling it needs a class-feature reader. It is left for a later batch.
- **Third-party features batch 6 (2026-10-07):**
  - Seeking Spell: the cover reduction is a modifier on the card's attack, never more than the target's cover bonus. Retrying a missed attack with a Sustain is the caster's action, given as a reminder on that target.
  - Spellshape-trait entries that don't change how a spell resolves are table rules, read but not applied: the eidolon's or ally's own actions (Tandem Casting, Spell Tag), daily preparations and items (Distilled Magic, Mixed-Potency Tincture, Recharging Spellgun), and Learn a Spell or Research (Elemental Study Notes). Distilled Magic's concoctions could become an item cast later, with the item-cast family.
- **Third-party features batch 7 (2026-10-07, "+" item spellshapes):**
  - Each item's spellshape activation is read as a feat. The item's other activations (Rotting Aura and the like) belong to later families.
  - Veracious Spell: the bonus each ring's text states (Iron +1). It lasts this turn; for later Sustain attacks it is the table's.
  - Energy Ablation (scepter): "one energy type the spell could deal" is asked among the spell's own listed types.
  - Purifying Spell (scepter): counteracting the sickened condition is a GM note, since a condition has no counteract level of its own.
  - Dangerous Odds: the reaction to reroll a success is the caster's, using the card's Roll Save Again.
- **Third-party features batch 8 (2026-10-07, Power Ring runes):**
  - Hone Spell: a miss means "no effect", recorded as a critical success; a hit as a failure; a critical hit as a critical failure. The ring's item bonus is the best Veracious Spell bonus among the rings the caster wears invested.
  - Veracious Summon: "a status bonus to its Strikes" applies to Strike attack rolls only. The module's Effect (every attack roll) isn't used. Not using Veracious Spell while the summon lasts is the table's.
  - Not yet done: the Essence Spell items (Magic Chalice, Magic Amulet and the like). They change Magic+'s essence casting costs, so they wait for that family.
- **ANSWERED 2026-10-07 (Fury of a Thousand):** for "You deal both types of damage instead of piercing or sonic" on Murmuration, the user chose "Full damage of each": the creature takes the spell's full damage as piercing and again as sonic.
- **Third-party features batch 9 (2026-10-07):**
  - Fury of a Thousand: the user's "Full damage of each" is applied to Murmuration's success and failure damage (the type choice isn't asked). Its critical failure already deals both types, so only the −3 changes it. Song of Strength's +2 covers both of PF2e's bonuses. The Birds of a Feather selection is the table's.
  - A spell held for its trigger keeps the spellshapes it was cast with, and they apply when it triggers.
- **Third-party features batch 10 (2026-10-07, passive features):**
  - When a "+" feature's own rules contradict its text, the text's rules replace them in memory as PF2e prepares the item. The item isn't edited, and official PF2e items are never touched.
  - Rudimentary Perfectionism: "twice that amount if the spell was cast from a spell slot". Heightened focus and innate spells get the ranks once.
  - Power of Blood: the bleed is PF2e's persistent-damage condition, put on directly. That its later ticks ignore resistances is a reminder on the condition, since PF2e applies resistances to each tick.
  - Wayward Gifts' primal gift: it follows PF2e's Sustain action, with the rank of the hex the witch sustains.
- **Third-party features batch 11 (2026-10-07):**
  - Comfort of Struggle: the value is the oracle's cursebound value when the Effect is made (at least 1, at most 3), as the feat text says ("If you are cursebound 2 when you use …"). The bonus or penalty goes after the next roll.
  - Scholar's Lore: putting the Effect on after the Recall Knowledge is the table's. Once on, it applies only to the caster's spells and is removed after the caster's next spell card.
  - Cloaked Casting: "one of your wizard spells" is the table's. The −1 to saves applies when the single target is Off-Guard as the card opens. Keeping concealment while casting, and the Unified Theory slot, are the table's.
  - Extended Cloaking: the concealment toward each Off-Guard enemy is a reminder Effect on the caster, since PF2e can't make a creature concealed to only one other.
  - Monstrous Familiar: the caster is asked whether the battle form goes on its familiar. The familiar is the familiar actor whose master is the caster.
  - Slot-Charged Spell: the prepared slot is asked for (any unspent prepared slot except the spell's own) and marked expended.
- **Third-party features batch 12 (2026-10-07, wickets):**
  - "Within the area" means the caster's token is inside its own Manifest Wicket Dominion region. "Once per round" counts per combat round (outside combat, per 6 seconds of game time). A threaded rule that is only the table's doesn't use up the round.
  - Overwhelming Wicket applies from the caster's 11th level (Through the Wicket).
  - "You can choose to deal spirit damage instead of fire damage": asked at the cast when the spell deals that type. Luminor's threaded persistent damage follows the choice ("You can deal spirit damage … with your threaded magic").
  - Propulsor's "a direction of your choice": pushed away from the caster; the GM can move it otherwise. Its Stand for a prone creature is the table's.
  - Erosior's terrain is the squares around each creature hit or failing, and is removed when the dominion's region goes.
  - Verdor's cover squares and Immobilized escape DC are the table's.
- **Third-party features batch 13 (2026-10-07, wickets):**
  - Mortisor: "below half Hit Points" is read as the creature was targeted, before the spell's damage.
  - Savior: the immunity lasts 1 minute as the text says, not the module Effect's 1 round.
  - Desolator: lowering the light and the darkness weakness are the GM's; PF2e has no reliable light-level reading.
  - Fabricator: the creature's Effect lasts while the dominion does, as "while within the area" is read loosely (the GM can remove it if the creature leaves).
  - Magnetor: the two creatures are pulled toward each other in turn, as forced movement. A creature choosing to fail is the table's.
  - Ardor: both creatures take half damage and get +2 to their saves; halving durations is a GM note on the card.
  - Wicket Infusion: the trait is asked among the wicket feat's own traits.
- **Third-party features batch 14 (2026-10-07):** features whose rule is a preparation, a stance, a held spell or a point of origin the player picks are table rules: read, with nothing applied at the cast. Embodiment's bonus lasts as long as the battle form spell; it isn't removed early if the form is dismissed.
- **Third-party features batch 15 (2026-10-07, Focus Points):** posting a "+" feature's card counts as using it, as with the spellshapes. The point is regained at once, within the item's frequency; its trigger ("an ally falls to 0 Hit Points") is the table's. Monastic Practices uses PF2e's standard level-based DC, as its text says ("a standard DC of your level"), not the bare level its inline check shows.
- **Third-party features batch 16 (2026-10-07, reactions):**
  - Archmage's Counter: "your spellcasting attribute modifier plus your spellcasting proficiency bonus" comes from the holder's first spellcasting entry. With a Mythic Point, the check uses mythic proficiency (level + 10) plus the attribute.
  - Haughty Correction is offered only when a spell is cast (its counteract and Recall Knowledge triggers are the table's). "One degree worse or better" from the trigger's own result is the table's, since a cast has no degree. Its success Stupefied lasts 1 round.
  - Residual Energy Capture: the module's Effect is kept as is. Its air, earth, water, wood and metal damage types (bludgeoning, piercing, slashing) are the module's reading, and spending the energy is its toggle (noted, not changed).
- **Third-party features batch 17 (2026-10-07, spells cast by features):**
  - Become Elemental: the form's Strike numbers at 7th rank are replaced by the text's +31 attack and +14 damage; the +10 feet is a status bonus to all Speeds.
  - Create Elemental: "half your level" is rounded down (at least 1); the elemental is picked among those of the residual energy's trait.
  - Constructed Spark: Animated Spark's card still posts; its effects are replaced by Summon Construct at the highest rank the caster can cast. The creature is asked at the cast.
  - Form of the Imperial and Controlled Wrath are the table's (read, nothing applied).
- **Third-party features batch 18 (2026-10-07, Wildblood):**
  - The rage damage on spells is the module's own rules (2; 4 from 7th level and 8 with greater weapon specialization, for a barbarian), kept as they match the text.
  - Wildblood Infusion is given after every spell the wildblood casts. Its damage type is the spell's (asked when there are several); with no damage, the rage damage keeps its type. A later cast's Infusion replaces the earlier one.
  - Explosive Blood: "would also damage you" (the caster within the spell's area) is the table's. The doubling is an Effect until the end of the caster's next turn, on spells and melee Strikes.
- **Third-party features batch 19 (2026-10-07, aspect summons):**
  - Magic+'s 13 "Summon … Aspect" spells had been counted resolved but only applied the statistics Effect. They now summon the linked aspect creature at a level equal to the cast rank and put the module's statistics Effect on it from the caster, as the module's macro does. The aspect's form, size and damage type are asked by PF2e's choice sets.
  - The aspect's DC is the module's: the caster's spell DC attribute minus 2 for the summon (its AspectForm), not the casting entry's DC.
  - The spells state no range (except Summon Fey Aspect's 5 feet). The summon trait's usual 30 feet is used, and the summon is sustained up to 1 minute as the spells say.
  - Aspect Sage: "a single common aspect ability" is any action in the module's aspect folders that the summon doesn't already have (the module marks no rarity, so all count as common). It's given to the summoned aspect and leaves with it.
- **Third-party features batch 20 (2026-10-07, Colossal Summon and Colossal Aspect Form):**
  - The summon's abilities use the casting's spell DC: Trample's Reflex DC, Earth-Shatterer's Earthquake (from an innate entry on the summon) and Megalophobia's Will DC. The texts give no DC.
  - The Trample given to a Colossal Summon is PF2e's creature Trample: Huge or smaller, the creature's first melee Strike. A creature that already has Trample, or an aspect form that already has one, gets a reminder Effect for "damage dice one size larger". That roll is the table's, since Trample rolls the listed Strike's damage.
  - Earth-Shatterer casts Earthquake at its own rank (8th). The text says "the effects of an Earthquake" without a rank. A second use within a minute is refused.
  - Megalophobia: every creature but the summon makes the save, allies and the summoner too, as the text names no exception. Frightened is applied as PF2e's condition (it decays). Fleeing lasts while the creature is frightened. "Treat all squares in the area as difficult terrain" is a note for the table. The aura ends with the summon.
  - Colossal Aspect Form: the module's Gargantuan size choice (reach 20) is answered ahead, then its reach is raised to the text's 25. The token returns to its own size, and the Trample is removed, when the form ends.
- **Third-party features batch 21 (2026-10-07):** Celestial Shift and Aberration Shift link their module Effect without a name, so they had compiled as notes. The link is now named from the Effect catalog (only an Effect, "Spell Effect: …" or "Effect: …"), and both apply their aspect battle form as the other aspect forms do. The third-party census moves from note 53 / effect 100 to note 51 / effect 102. Choices on items a form grants (Aberrant Lair's) are PF2e's prompts.
- **Third-party features batch 22 (2026-10-07, Magus+ Spellstrike variants):**
  - A variant is armed by posting its card, like a spellshape. The caster's next 1- or 2-action spell with a spell attack or a save is delivered by a Spellstrike, and the variant applies on the caster's first Strike after that cast, by the Strike's degree.
  - "You're in Arcane Cascade" is read from the stance's roll option (as the module's own rules read it), and "wearing heavy armor" from the worn armor. "Your Spellstrike is charged", "are unarmed" and "wielding a weapon in the flail group" are the table's, since PF2e doesn't track a charged Spellstrike.
  - The module's Effects for Imposing, Flaying and Living Grimoire last 1 round from their own start. The text's "until the end of your next turn" is used instead, on Effects built from the text. Living Grimoire's −1 applies only to attacks against the magus (PF2e's target signature).
  - Pummeling: "push your target up to 10 feet" pushes the full distance away from the caster, by PF2e's movement (a second diagonal costs 10 feet). Striding after it is the table's.
  - Flaying: the Arcana check is against the standard DC of the creature's level (the text names none), after the Strike, whatever its degree. The damage type is asked.
  - Banishing: the Will save is against the casting's spell DC. Incapacitation (not a spell) improves the save by one degree for a creature of a higher level than the caster, unless it's summoned. A banished creature the module summoned has its summon ended; any other is the GM's to send away (told by whisper), as with Banishment. The −2 for a Spellstrike that triggered a weakness is the table's, since the damage comes later.
  - Living Grimoire's once a day is the table's.
  - Inverted Energy: one of the spell's energy types (acid, cold, electricity, fire, force, void, vitality, sonic — the text's negative and positive read as void and vitality) becomes another of them, both asked. Its traits changing is the table's.
- **Third-party features batch 23 (2026-10-07, Spellstrikes by other Strikes):**
  - Dual-Weapon Spellstrike: the cast reads the first successful of the caster's first two Strikes against the target after it, else the first. The second Strike's −3 (−2 agile) is an Effect on the caster for that Strike. Rolling both with the current multiple attack penalty is the table's.
  - Residual Spellstrike: its card, after the latest Spellstrike's Strike got a failure, hands the cast to the next Strike. That Strike carries −5 (−4 agile) and should be rolled as a first attack, since PF2e's multiple attack penalty can't be replaced. "Not the fortune trait" and "your other diametric weapon" are the table's.
  - Reverse Spellstrike: the hostile spell is the latest cast by a creature not allied with the magus that targeted it (each cast's targets are now kept on its message), takes 1 or 2 actions and has a spell attack or a save. A slot of the highest rank the magus can cast is expended (a spontaneous slot, or a prepared spell). The spell is borrowed in an innate entry with that slot's tradition and DC, heightened to that rank, and removed at the end of the magus's next turn. A cantrip heightens as cantrips do (half the level, rounded up). "In the last turn" and "your Spellstrike is charged" are the table's.
  - Scissored Assault: the mystic duo's Strike after the cast delivers it. Combining the damage for resistances, the spell's traits on the Strike, and fizzling if the duo doesn't Strike before the caster's next turn are the table's.
  - Big Shot: the makeshift spellgun's Activation is only text in Wizards+, so the cast reads the caster's next attack roll against the target with the spellgun (any attack roll if no spellgun is tracked), or a spell attack roll. Its "two attacks for your multiple attack penalty" is the table's.
- **Third-party features batch 24 (2026-10-07, Magus+ Spellstrike features):**
  - Whirling Wand Strike: armed by its card, a spell cast from a wand asks "Spellstrike with the wand?". Yes delivers it, with +half the spell's rank as a status bonus to the Strike's damage (the "damage … on your Spellstrike" read as the Strike's). No leaves the cast and Strike apart, the table's.
  - Overcharging a wand (Second-Hand Wand's flat check 5, Whirling Wand Strike's no flat check) is the table's: PF2e doesn't roll overcharging.
  - Eat This!: the module's own eat-this toggle (its scatter radius) is turned on for the Strike and off after. "The scatter's additional damage equals the spell's rank" is shown as a note, since PF2e's scatter damage isn't changed by a rule.
  - Dealer of Death: a Spellstrike whose Strike uses a weapon named as a deck, cards or harrow, with a damaging spell, rolls the d6 table. A match gives +the spell's rank (half the level for a cantrip) of that type to the Strike's damage.
  - Slide Slice: its reminder (Stride up to half your Speed) is whispered on a Spellstrike's critical hit. "You used Slidecast before" is the table's.
  - Horizon Spellshell, Starlit Span+, Flinging Figments and Second-Hand Wand allow Spellstrikes the delivery never restricted (ranged Strikes, wands); their first range increment is the table's.
  - Recharging Reload and Warded Stitch only recharge a Spellstrike, which PF2e doesn't track: recorded with the martial entries.
- **Third-party features batch 25 (2026-10-07, cascades after a cast):**
  - An Arcane Cascade stance's damage type is answered before PF2e asks, from the actor's most recent spell.
    - PF2e's Arcane Cascade: force, or one type that spell could deal, only after a cast on the same combat turn. Outside combat any earlier cast counts.
    - Magus+'s cascades (Arcane Cascade+, Havok, Slidecast, Puppet String, Don Visage, Invigorate): that spell's type, asked among its types when it has several; force when it dealt none.
    - Untyped damage (Wreak Havok's) isn't a type.
  - Havok Cascade: a havok-trait spell (Wreak Havok) cast in the Havok stance deals untyped damage equal to the level to the caster. If less is taken (resisted, absorbed), the spell is lost.
  - Reservoir of Power: the most recent spell must be from a prepared or spontaneous slot (not a cantrip or focus spell). It enters the caster's cascade stance (Havok's if it has one) and gives the module's Effect. Remastered spells have no school, so the school is asked. Necromancy's healing (the cascade's damage value), which the module's Effect lacks, is applied. Conjuration's Step and Illusion's terrain are the table's.
  - Puppet String: the most recent spell needs the illusion or mental trait. The tethered enemy is one it targeted, or its Spellstrike's target, within 30 feet. The module's Effects are used, with the required trait the spell's and the weakness 1/2/3 by weapon specialization. Breaking the string beyond 30 feet is the table's.
  - The Reservoir of Power Effect is the module's (the feat's text doesn't link it).
- **Third-party features batch 26 (2026-10-07, Don Visage, Slidecasting, Invigorate):**
  - Don Visage: the most recent spell is the requirement (a melee Spellstrike counts through its cast). The Arcana check is against the level's standard DC. The module's Effect lasts 3 rounds, or 4 on a critical success, with its demeanor asked and its cascade type from the spell. The skill actions with Arcana are the table's.
  - Slidecasting: in combat, any move of the magus's token and a spell cast in the same combat turn give the module's Effect once that turn: 2 rounds (3 or 4 with weapon specialization), its +1 the text's status rather than the module's circumstance. A forced move counts, since the module can't tell a Step from being moved. Out of combat there's no turn: the table's.
  - Invigorate: when a creature drops to 0 Hit Points from damage whose source is a spell of the magus, or a Strike after its delivered Spellstrike, its card is offered to the magus. The button puts the module's Effect on the magus and its familiar (the black blade). Wielding the black blade and the Will save against its Ego are the table's.
  - The Don Visage Effect is the module's (the action's text doesn't link it).
- **Third-party features batch 27 (2026-10-07, essence casting E1):**
  - Magic+'s script keeps the pool; this module reads each cast as its message is made, with the pool from before the cast.
  - A full caster's 2- or 3-action essence spell at a full pool completes a cycle. Its terminus is a feat with the terminus trait or a "Terminus of" name, asked when there are several. Its Effect gets the encounter's cycle (1, 2, 3+ as 3) as its badge, replacing the earlier one.
  - Terminus of Renewal is offered only while incantations reduce the pool; it removes the Maintaining Incantations Effect. Terminus of Ultima is offered at a pool of 9 or more after another cycle. Bounded Might is left to Magic+'s bounded steps.
  - A draw after a cycle or a leak, without Essence Rebirth, is undone (the pool set back) with a message.
  - Combat start sets the pool to 0, or to the essence draw with Initial Draw (the text lets the caster draw less: the table's).
  - Combat end removes every Effect from an essence spell of its casters (origin or the module's source item) and the encounter's termini, ends the module's ongoing records from those spells, and sets the pools to 0. Spells cast outside an encounter (incantations) aren't touched.
- **Third-party features batch 28 (2026-10-07, essence casting E2):**
  - Channel Essence Leak: on each leak, the caster picks +1 to its own AC and saves, or −1 to one creature the spell targeted (actor flag `essenceLeakChoice` presets it). It lasts until the end of the caster's next turn.
  - Essence Conduit: its card arms the next 1- or 2-action cast. A focus spell, cantrip or 1-action essence spell raises the essence by 1, up to the pool; the 1-action spell then doesn't leak. A 2-action essence spell raises it as usual.
  - Weave Conduit: the two essences of the caster's essence entry's tradition (arcane matter/mind, divine spirit/life, occult spirit/mind, primal matter/life) are offered. Life gives temporary Hit Points equal to the level; Spirit gives a 30-foot imprecise spiritsense to the end of the next turn. Matter's move, Mind's Recall Knowledge and Spirit's Seek are the table's.
  - Life Essence Reservoir:
    - Its size is Magic+'s flag (the highest healing spell's rank × 12, 18 or 24), kept from the actor's prepared and spontaneous healing spells. A signature spell counts at its entry's highest slot; cantrips and innate or focus spells don't count.
    - Healing from the caster's essence spell spends the reservoir. Any healing beyond what the reservoir held is taken back from the creature.
    - Refocus restores the rank × 4, 6 or 8.
    - Choosing to heal less, and excluding creatures, are the table's.
- **Third-party features batch 29 (2026-10-07, essence casting E3a):**
  - Incantations: the action's card arms the caster's next essence spell, refused during an encounter. Normal or long is asked (actor flag `essenceIncantationMode`); the casting time is the table's.
    - The essence pool is opened to its maximum for that cast, so Magic+ unlocks the ranks "up to your current essence pool", then put back as it was.
    - A normal incantation adds 1 to Effect: Maintaining Incantations (the module's, which the text doesn't link), lowering the draw and pool. Under Incantation Mastery it doesn't, when the spell's rank is below the current, already reduced, draw and the spell has no duration.
    - A new incantation ends the earlier long incantation's Effects.
  - Refocus asks whether to Dismiss the incantations (actor flag `essenceDismissIncantations`). Those dismissed, those without a duration, and those whose Effects are gone give back their reduction.
  - Magic Bell: once a day, an essence spell up to its rank as an incantation with the normal casting time, in an encounter too, with no reduction and no change to the essence.
  - Magic Amulet: once a day, the next incantation up to its rank doesn't reduce and doesn't end the long incantation. Placing it on the target is the table's.
  - Magic Chalice: once a day, the next essence spell up to its rank heals without spending the reservoir (that cast's healing, within 2 minutes). Ignoring the 1-day temporary immunity is the table's until that immunity is applied.
  - Magic Tome adds spells: the table's. Magic+'s second "Magic Tome (1st-Rank)" carries the bell's text and is read as a bell.
- **Third-party features batch 30 (2026-10-07, essence casting E3b):**
  - Unstable Draw: its card arms the next draw cantrip, which draws to 1 above the essence draw (within the pool) and rolls the DC 10 flat check.
    - Short of a critical success, the next essence spell leaks (the essence to 0, counted).
    - A failure's limit (a 2- or 3-action spell of exactly that rank) is warned, not blocked.
    - A critical failure's stupefied 1 lasts until that spell.
    - Unstable Aura's DC 5 flat check for ranged attacks is a reminder Effect until that spell.
  - Terminus of Life's Effect: a spell that raises the essence (a draw cantrip, or a 2- or 3-action essence spell below the full pool) and heals no one gives temporary Hit Points to the caster or one of its targets (asked; actor flag `lifeTerminusTarget`). They are the rank × (cycle + 1), doubled for an essence spell, keep no end, and don't stack.
  - Essence Summoner: a creature summoned by an essence spell gets +2 status (rank 2 below the essence before the cast) or +1 (1 below) to attack, AC, saves and skill checks. Its evolving action is the table's.
  - The 1-day temporary immunity applies to essence spells whose text counteracts, or reduces, removes, ends or cures a condition, affliction, curse, disease or poison. It is set on each target per caster and spell. An immune target is left out of the cast. The Magic Chalice's cast ignores it.
  - The table's: Terminus of Soul's reroll, Terminus of Summoning's free Sustain, Terminus of Insight's Recall Knowledge, and Terminus of Power's damage on non-damaging spells. The NPC termini are also the table's, since Magic+ doesn't track an NPC's essence (its Effect is a counter).
- **Third-party features batch 31 (2026-10-07, power ring runes):**
  - The rune's choice is its ChoiceSet selection. Immobilizing's trait narrows the spells it applies to; Scourging's damage type is matched against the spell's ("physical" means bludgeoning, piercing or slashing, and deals bleed).
  - "The origin of the spell" (Ramming) is read as the caster: rays and attack spells start there.
  - Perishing's Die! is a reaction, so it is asked (actor flag `passiveChoices.Perishing` answers it in advance). Its incapacitation uses half the rune's level as the rank. The extra heart wording is the GM's note.
  - Scourging adds its 1d10 even when the spell already deals persistent damage of that type. PF2e keeps the higher of the two, and the +2 DC to end it is the table's.
  - Energy's Release Power is cast from the caster's first spellcasting entry at half its level, rounded up (PF2e needs one for the attack roll). Gather Power is a button after the cast; using it as the next action is the table's.
- **Third-party features batch 32 (2026-10-07, catalyst and ammunition):**
  - Blue Salt Crystal's damage follows the text, "equal to the rank of the spell", not the module's @item.level. "For the duration of the spell" is an Effect lasting the spell's stated duration (1 minute for Drown), or ending with the spell's own Effects on the creature. Ending a sustained spell early is the GM's (delete the Effect).
  - Gray Dust Ammunition: its card (the Interact activation) arms the shooter's next Strike. A hit marks the target, and a miss spends it. "Fired at spellcasters" is not checked: a creature that never casts never triggers it. The backfire card uses the marked creature's own spellcasting entry ("their own magic").
  - PF2e's own catalysts (about 110 items with the catalyst trait) aren't covered by any audit. They are flagged as a separate task.
- **Third-party features batch 33 (2026-10-07, cast riders):**
  - Arcane Generator and Transmogrification Boost: the borrowed damage is a separate damage roll after the spell's own, with its own IWR, once per cast.
    - Overdrive's is PF2e's Effect: Overdrive value: half the Intelligence modifier (all of it on a critical success), plus 1, 2 or 3 at 3rd, 7th and 15th level. It has the spell's first damage type; a failed Overdrive gives 1 fire.
    - Offensive Boost's is PF2e's die (1d6 unless a rule changes it) of the chosen type.
  - "A conflux spell" is a magus focus spell (focus and magus traits), since the remaster dropped the conflux trait. Essence Mystic Dedication's choice is asked at the cast (actor flag `passiveChoices["Essence Mystic Dedication"]` answers it in advance). The module's Effect is created with its toggle on until the next turn starts; while it is there, Havok Cascade's damage is doubled.
  - Essence Strike's "ignores circumstance penalties … and any flat check" is the table's.
  - **QUESTION (not blocking):** Essence Eating Shell (Magus+) picks one of eight effects by the school of the shell's spell. Remastered spells have no school. Should the caster pick the school at the Spellstrike (as Reservoir of Power asks), or should it be mapped from traits? Until answered it stays the table's.
- **Third-party features batch 34 (2026-10-07, Spell Ignition and Cone of Figments):**
  - Spell Ignition:
    - "The level of the spell you cast" is its rank (half for a cantrip, minimum 1).
    - The area is the last spell's template region if it has one, otherwise its targets' spaces at the moment of the action. The stance's type is Magus+'s selection, or force without a stance.
    - Weapon specialization is read from the caster's feats (`weapon-specialization`, `greater-weapon-specialization`).
    - The Spell ignition class feature's other parts (counting as in Arcane Cascade, Capture Magic's and Resounding Cascade's options) are the table's.
  - Cone of Figments:
    - The cone starts at the target's far side, pointing away from the caster, 90°. Its creatures are found by their centres, excluding the target and the caster.
    - A spell with no damage gives one of the schools' types, asked (force, the weapon's, mental, void, vitality), since remastered spells have no school.
    - "Thrown" and "within the first range increment" are the table's.
  - `REQUIREMENT` now also reads "Requirement" (singular).
- **Third-party features batch 35 (2026-10-07, Triplicate Casting):**
  - "Dynamic mastery" is the caster's own selection, which Magic+ doesn't record, so it is the table's. Any non-cantrip, non-focus spell cast with a one-action version qualifies.
  - The three casts must be this turn (or, out of combat, consecutive). A cast that doesn't qualify ends the arming.
  - Each slot is spent as PF2e casts it. The module then gives back all but the highest rank's, so a spontaneous caster ends with one slot of that rank spent; a prepared caster keeps the highest-rank prepared spell expended.
- **Third-party features batch 36 (2026-10-07, focus pool):**
  - PF2e's Refocus restores nothing on its own. With Golden Core, the Refocus card restores the 2 points (or fills the pool from 18th level).
  - I Am Omnipotent!'s requirement is read from the caster's latest spell card (a critical hit, or a target's critically failed save). The focus point is given back after PF2e spends it. PF2e's stupefied flat check isn't suppressed, so ignoring it is the table's.
  - Bargain Soul acts when its Effect is put on. The Effect's own rules grant Doomed 1 and Drained 1; raising existing values is PF2e's. The slot is asked among the spent ones at least a rank below the highest (actor flag `passiveChoices["Bargain Soul"]`, by index, answers it in advance).
  - Revitalizing Bun's restore is a button on its card, usable once while revitalized.
- **Third-party features batch 37 (2026-10-07, counteract features):**
  - What can be counteracted:
    - The targeted creature's spell Effects (PF2e's fromSpell, a spell origin, or the module's cast).
    - For Oracle's Eyes: Effects with the illusion trait, and the listed conditions.
    - For Snuff Out: Effects with the light trait or a TokenLight rule.
    - A condition granted by an Effect already listed is counteracted through that Effect.
  - The DC is the Effect's caster's spell (or class) DC; the rank is the Effect's level. When either is unknown, the GM is asked.
  - Modifiers: "your spell attack modifier" is the caster's first spellcasting entry's spell attack. Oracle's Eyes and Snuff Out state no rank, so it is half the level, rounded up.
  - Snuff Out's "automatically succeeding if the light source is non-magical" is the table's.
- **Third-party features batch 38 (2026-10-07, cast riders):**
  - Stigmata:
    - Its bleed is PF2e's persistent bleed condition. "Cannot be removed" and its ending action are the table's.
    - Its riders apply while the cleric has any persistent bleed.
    - The 3-action Heal is told apart by the cast's area or time.
  - Archmemory: the caster's last cast is taken as this turn's; checking the turn is the table's.
  - Spell Eating: any spontaneous or prepared slot of the caster's (the archetype's entry is the caster's to pick, asked by rank).
  - Outsider Caller: offered on every summon-trait cast. The "chosen spell, once per day" is the table's. The burst catches every creature within 15 feet of the targeted summoned creature, caster included, as the emanation reads.
  - The card handlers now ignore messages with a roll context (a damage message carrying a feat as its origin had re-triggered them).
- **Third-party features batch 39 (2026-10-07, hex familiar abilities):**
  - Triggered by a hex cast, or by PF2e's Sustain card (the slug `sustain`/`sustain-a-spell`) while a hex lasts. The familiar is the familiar actor whose master is the witch.
  - "A creature within N feet" is the creature the GM targets; the distance is the table's. The auras catch every creature within the distance of the familiar's token except the witch ("others").
  - Reprising Melody's choice is asked (actor flag `passiveChoices["Familiar of Reprising Melody"]`: `reduce` or `give`). Stumbling Steps pushes away from the familiar (the direction is otherwise the caster's).
  - The module's Effects keep their own durations and choices (Keen Senses asks for its sense).
- **Third-party features batch 40 (2026-10-07):**
  - Consume Item Magic: "previously cast during the day" is read as a spent slot.
    - Prepared: a prepared spell spent at that rank, sharing a trait with the item.
    - Spontaneous: a spent slot of that rank, with a repertoire spell up to that rank sharing a trait. `magical` and `consumable` don't count as shared.
  - Vital Pululation: the Heal is built from PF2e's compendium through the caster's first entry, at one rank below the highest castable. Its targets are the creatures within its area, the oracle excluded.
  - The surge add-ons act when PF2e's Spell Effect: Evolution Surge is put on a creature, the caster read from its origin.
  - **QUESTION (not blocking):** Wizards+'s exploits (Rebuttal and Unravel modes paid with spell slots) and Channel Smite+ are recorded for the ability module, as Strikes or slot-cost actions rather than spells. Should they be built here instead?
- **ANSWERED 2026-10-08:** "build exploits and Channel Smite and Catalyst Items here too". The QUESTION from batch 40 is answered; the catalyst task in its own session was stopped (no edits) and built here.
- **Third-party features batches 41–42 (2026-10-08, exploits, Channel Smite+, catalysts):**
  - Exploits:
    - The Cost is read from the text. Force and vitality/void count as energy traits; "provides an AC bonus" means the spell's text or a FlatModifier to AC.
    - The slot is asked when several pay (actor flag `passiveChoices[name]`, an index); the expended spell's rank drives the effect.
    - Rebuttal's triggering creature is the targeted one.
    - Fickle Fate's aura is an Effect whose creatures beginning their turn within 15 feet get the bonus for the round. Its predicates are PF2e's `misfortune`/`fortune` roll options.
    - Impromptu Incarnation summons through the expended spell (the creature asked, or actor flag `passiveChoices["Impromptu Incarnation summon"]`). It is two sizes larger by PF2e's size rule with its token resized, reach +10, Immobilized, and departs at the end of the caster's next turn (Rebuttal) or third (Unravel).
    - Force Disruption's Unravel bursts: the targeted creatures, pushed away from the caster.
    - Immortality Clause's Effect is given the text's regeneration deactivation (force, spirit), which the module's data lacks. Its Rebuttal and Babbling Profusion's are the GM's.
    - Dimensional Jump tells the distance; moving the token is the GM's.
  - Channel Smite+: "the expended spell's damage" is its 1-action damage (1d8 per rank) as spirit, half for 1 action. The 3-action area is a basic save card on the targeted creatures; the struck creature's one-degree-worse save is the GM's on the card.
  - Catalysts:
    - Arming is the catalyst's card (PF2e's Use posts it). Spell names match case-insensitively.
    - A catalyst's PF2e Effect that alters the spell goes on the caster as the spell is cast; Effects that are the creatures' go on them.
    - Thunderbird Tuft: weapon Strikes count as metal weapons, unarmed ones don't; reach weapons are ignored.
    - Wood-Rotted Root: "physical damage" is read from the damage types PF2e's applyDamage was given (the module notes them, as the damage message names none). The save is the text's fixed DC; a failure takes the damage.
    - Deadlock Mint's emanation size (not in its text) and unattended objects are the GM's.
    - Defiled Costa (Greater)'s death on a critical failure is the GM's.
- **ANSWERED 2026-10-08:** "automate the 62 catalyst notes too" (third-party features batch 43). No catalyst posts a GM note now. Interpretations:
    - Reminder Effects stand for what the module doesn't place or restrict (ranges, lines, squares, recordings, disguises, the lockbox, the homunculus's renewal, cold immunity). They last the spell, the text's span, or the caster's turn. Deadlock Mint's objects and Kushtaka Relic's possession are reminders too.
    - Deathless Light arms any spell with the light trait, not only the Darkness it links. The save card's counteract against darkness uses the raised rank (at most 7); elsewhere a reminder Effect on the caster gives it.
    - Shadow Ash's spells are read as Animate Dead, Summon Undead and Create Undead. Its text names "an animate dead spell or create undead ritual"; Summon Undead is animate dead's remastered name. "Melee Strike": damage from a weapon or NPC melee item that isn't ranged. The rise: a DC 11 flat check at 0 Hit Points, then an Effect lasting 1d4 rounds; when it ends the creature has half its Hit Points (unless the GM removes its remains).
    - Literate Lemur's Fierce Debate names no save: Reflex (the 2026-10-03 rule for an unnamed save).
    - Leaden Weight on Gravity Well: "knocked Prone after it moves" is after the spell's pull. A creature the pull didn't move is knocked prone after its next move.
    - Necrotic Cap: "on a hit" (the legacy attack) is a failed save on the remastered Acid Grip. "Can't reduce sickened below 1 while taking persistent void damage" is a sickened 1 held while it has persistent damage. Its void type also covers the persistent damage the card composes.
    - Broken Ram's Thorn's caltrops are a ring Region around each creature in the area (the adjacent squares). The first creature moving in is the GM's button: Acrobatics against the spell DC, then the rank in cold, and the ring is spent.
    - Noxious Incense's smoke is the wall's area grown by a square each way (it includes the wall's own squares).
    - Gravemist Taper: the mist's flat checks are PF2e's flat-check rolls whose roller or target is inside the mist. A total below 7 makes the roller frightened 1.
    - Kirin Echo Chime: a flying creature is one whose token's elevation is above 0. The caster's direction is asked once per cast.
    - Euphoric Loop: "if the spell ended because of a hostile action" is asked of the GM when the charm's Effect ends.
    - Odious Token: the ally is the creature the caster targets.
    - Demon Bone Tiles: PF2e records nothing for a Shield Block with the spell's shield. The module marks the shield's Effect when PF2e's applyDamage is asked to Shield Block with it.
    - Chaos Falcon Feather: the Sustain moves the resistance to the targeted creature and asks the new energy from PF2e's own list.
    - Lingering spells' initial saves (Howling Blizzard, Gust of Wind, Toxic Cloud) now carry the cast's spellshapes and catalysts. Recurring exposures don't.
- **ANSWERED 2026-10-07 (third-party features scope):**
  - Magic+'s essence casting: "Automate the system". Track essence on the caster (draw cantrips, essence spells, cycles, leaks, incantations, the life reservoir), then the Terminus feats and the Essence Spell items on top.
  - Magus+ (the "magus" module): "Everything". The Spellstrike variants and confluxes, plus the Arcane Cascade and Havok stances, Strike riders and martial passives.
  - The 773 grants-spell, spell-modifier and mentions-spells entries: "Triage then automate". Automate those that change how spells resolve, and record the rest as out of scope with a reason.
- **ANSWERED 2026-10-07 (Magus+ scope, refining "Everything"):** "Split by spell link". The spell-linked parts of Magus+ are built in this module: Spellstrike variants, conflux and focus spells, the cascades entered after a cast, Reverse Spellstrike, Scissored Assault and Big Shot. The purely martial ones (armor, ropes, senses, Strike-only feats) are recorded for the separate pf2e-automatic-ability-resolution module, so this module isn't bloated with non-spell automation.
