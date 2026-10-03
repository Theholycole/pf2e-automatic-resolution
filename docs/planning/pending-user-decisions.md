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

