# Residual Outcome Prose Worklist

Compiler version: 0.15.1

Analyzed outcome plans: 334

Unclaimed clauses: 778

A clause can appear under more than one signal. Examples are bounded excerpts for compiler design, not spell-specific exceptions.

## action (81)

- **Airburst — success:** The creature takes a -2 status penalty to checks made during its reactions until the end of your turn.
- **Command — failure:** For the first action on its next turn, the creature must use a single action to do as you command.
- **Command — criticalFailure:** The target must use all its actions on its next turn to obey your command.
- **Overselling Flourish — criticalFailure:** The creature uses its remaining actions to watch you in awe.
- **Scouring Sand — failure:** The creature is @UUID[Compendium.pf2e.conditionitems.Item.Dazzled] for 1 minute or until it uses an Interact action to get the sand out of its eyes.

## choice (11)

- **Boneshaker — success:** it can choose to fall @UUID[Compendium.pf2e.conditionitems.Item.Prone] to avoid moving.
- **Expeditious Excavation — criticalSuccess:** The creature is unaffected and can choose to either descend the pit without damage or move to the nearest available space of its choice.
- **The Parrot's Whisper — criticalSuccess:** The parrot chatters about various random topics for 1 round and reveals no relevant information.
- **The Parrot's Whisper — success:** In the meantime, the parrot chatters about various random topics.
- **Aqueous Orb — criticalSuccess:** The creature can either let the orb pass (remaining in its space or moving out of the orb's path into a space of the creature's choice) or allow itself to be pushed in front of the orb to the end of the orb's movement.

## condition (4)

- **Shadow Army — failure:** The creature takes full damage and gains the chosen condition until the end of its next turn.
- **Shadow Army — criticalFailure:** The creature takes double damage and gains the chosen condition until the end of its next turn.
- **Ranage's Circle — success:** This condition lasts until they move from their current position.
- **Tanglecurse — criticalFailure:** As failure, but the emanation increases to 15 feet, and the condition value caused by the spores increases to 2.

## damage (115)

- **Puff of Poison — success:** The target takes half initial damage and no persistent damage.
- **Puff of Poison — failure:** The target takes full initial and persistent damage.
- **Puff of Poison — criticalFailure:** The target takes double initial and persistent damage.
- **Cycle of Retribution — success:** The next time the target takes a hostile action, the target takes 1d4 mental damage;
- **Cycle of Retribution — failure:** The first time in a round when the target takes a hostile action, the target takes 1d4 mental damage.

## duration (286)

- **Agitate — success:** The duration is 1 round.
- **Agitate — failure:** The duration is 2 rounds.
- **Agitate — criticalFailure:** The duration is 4 rounds.
- **Airburst — success:** The creature takes a -2 status penalty to checks made during its reactions until the end of your turn.
- **Airburst — criticalFailure:** The creature is pushed 5 feet away from you and can't use reactions until the end of your turn.

## modifier (79)

- **Airburst — success:** The creature takes a -2 status penalty to checks made during its reactions until the end of your turn.
- **Celestial Accord — success:** It has a -2 status penalty to attack rolls against the other target for 1 round.
- **Chilling Spray — failure:** The creature takes full damage and takes a –5-foot status penalty to its Speeds for 2 rounds.
- **Chilling Spray — criticalFailure:** The creature takes double damage and takes a –10-foot status penalty to its Speeds for 2 rounds.
- **Curse of Recoil — failure:** The recoil imposes a –1 status penalty to the ranged attack and renders the target off-guard until the beginning of their next turn.

## movement (48)

- **Gust of Wind — success:** The creature can't move against the wind.
- **Swampcall — criticalFailure:** As failure, but the penalty to Speeds (except Swim speed) is -15 feet.
- **Tether — success:** The target takes a –5-foot circumstance penalty to its Speed as long as it's within 30 feet of you.
- **Charitable Urge — failure:** This might require the target to Interact to retrieve an item or move to reach the nearest creature, and passing the item off requires an Interact action as normal.
- **Dimensional Drop — success:** The target falls 10 feet through the void before reappearing.

## save (37)

- **Albatross Curse — failure:** During this time, the target must roll twice and take the worse result on their next Will save, after which the albatross disappears.
- **Binding Muzzle — failure:** As success, but the effect lasts 1 minute, and they must succeed at a @Check[flat|dc:11] to Cast a Spell with verbal components.
- **Charitable Urge — criticalFailure:** At the end of each of its turns, the target can attempt a new Will save to reduce the remaining duration by 1 round, ending the effects entirely on a critical success.
- **Aqueous Orb — failure:** The creature can get free either by Swimming with a successful @Check[athletics|traits:action:swim|dc:10] check or by @UUID[Compendium.pf2e.actionspf2e.Item.Escape]{Escaping} against your spell DC.
- **Croak Voice — success:** Whenever it uses an action that has the auditory trait or attempts to Cast a Spell that doesn't have the subtle trait, it must succeed at a @Check[flat|dc:5] or the action is lost.

## state (34)

- **Goblin Pox — failure:** The target is afflicted with goblin pox at stage 1.
- **Goblin Pox — criticalFailure:** The target is afflicted with goblin pox at stage 2.
- **Spider Sting — failure:** The target is afflicted with spider venom at stage 1.
- **Spider Sting — criticalFailure:** The target is afflicted with spider venom at stage 2.
- **Advanced Scurvy — failure:** The target is afflicted with advanced scurvy at stage 1.

## timing (98)

- **Airburst — success:** The creature takes a -2 status penalty to checks made during its reactions until the end of your turn.
- **Curse of Recoil — success:** The recoil from their ranged attack causes the target to be @UUID[Compendium.pf2e.conditionitems.Item.Off-Guard] until the beginning of their next turn.
- **Curse of Recoil — failure:** The recoil imposes a –1 status penalty to the ranged attack and renders the target off-guard until the beginning of their next turn.
- **Curse of Recoil — criticalFailure:** The recoil imposes a –2 status penalty to the ranged attack and renders the target off-guard until the beginning of their next turn.
- **Curse of Recoil — criticalFailure:** Until the start of their next turn, any additional ranged attacks made with the same weapon, spell, or ability take the same penalty.

## unclassified (162)

- **Celestial Accord — success:** The creature is filled with doubt about its own intentions and feels an urge to cooperate with the other.
- **Dehydrate — criticalSuccess:** The creature takes no additional effect.
- **Equal Footing — failure:** During this time, it can't benefit from bonuses to its Speeds or take other penalties to its Speeds.
- **Exchange Image — success:** You take on the target's appearance, and they take yours.
- **Exchange Image — success:** This has the same effects as a 1st-rank @UUID[Compendium.pf2e.spells-srd.Item.Illusory Disguise] spell, except that the target can't Dismiss the disguise.
