
**Temporary HP and ending persistent damage.** “…, granting 1d8 temporary Hit Points and ending one source of persistent acid, bleed, fire, poison, or void damage affecting it. If the creature has persistent damage from more than one of these sources, you choose the one that ends.” is automated when:
- the linked Effect's `TempHP` is `@item.badge.value`;
- its badge is the formula `(@item.level)dN`, matching the text's dice at the spell's rank.

The module ends the recipient's one persistent damage of those types. If it has several, the card asks the caster to choose which to remove. “… Concealed until the beginning of their next turn, though this obvious concealment can't be used to Hide.” (with the Effect granting Concealed) becomes a **GM:** reminder.

A sentence that deals, takes or ends persistent damage and that the Effect's proof doesn't claim blocks the Effect. A battle form's stat block (“Damage 2d4 piercing plus 1 persistent bleed”) isn't such a sentence.
# Writing homebrew spells that the module can resolve

This guide explains how to build a homebrew spell item so PF2e Automatic Spell Resolution recognises it and resolves it automatically. Examples include rolling saves, applying damage and conditions, applying Effects, and handing afflictions to Pseudo Afflictions.

Every example in this guide is compiled by the automated test `test/homebrew-guide.test.js`, so the wording shown here is known to work.

## How the module reads a spell

The module never looks up a spell by its name. It reads two things:

1. The spell item's standard PF2e fields: defense (save), damage, heightening, target, area, duration, traits and cast time.
2. The spell's description. Each sentence must be something the module can prove it understands.

It then picks a route:

| Route | What it handles | Works for homebrew? |
| --- | --- | --- |
| **Save** | Basic saves and degree-of-success tables: damage, conditions and their lifetimes, riders, afflictions | Yes |
| **Effect** | Buffs and reactions that apply one PF2e spell Effect | Yes, but the Effect must come from PF2e's own *Spell Effects* compendium (see below) |
| **Affliction care** | No-save spells that reduce or advance afflictions, reduce conditions, or counteract | Yes, for the phrasings listed below |
| Immediate, Form, older ongoing workflows | Specific official spells (Heal, Force Barrage, Disintegrate, battle forms and a few others) | **No.** These check the spell against the official item and refuse edited copies. |

When a spell card is posted, a resolve button replaces or joins the native buttons. If nothing matches, the card says *“Manual resolution: this spell is not yet automated.”* The spell still works normally in PF2e in that case; the module just doesn't automate it.

**The golden rule:** a description sentence that the module can't account for blocks the automation instead of being ignored. Keep descriptions to the mechanics plus at most one short sentence of flavour at the start.

## Check your spell with `diagnose`

Put the spell on an actor, then run this in a macro or the browser console:

```js
const item = game.actors.getName("My Caster").items.getName("My Spell");
const report = await game.modules.get("pf2e-automatic-resolution").api.diagnose(item);
console.log(report.route, report.level, report.pending, report.blockers, report.unclaimed);
```

- **`route`:** `save`, `effect`, `affliction-care`, `immediate`, `form`, `ongoing` or `none`.
- **`pending`:** capabilities the compiler couldn't prove (see the [code table](#common-pending-codes)).
- **`unclaimed`:** the exact outcome sentences it couldn't account for, per degree. Usually this tells you which sentence to reword.

## Item fields

| Field | What to set |
| --- | --- |
| **Defense** | For a save spell: the save statistic, and tick **basic** only for a basic save. |
| **Damage** | Each damage roll as a structured damage entry (formula such as `2d6`, damage type). Don't put basic-save damage only in the text; the module rolls the structured entry. Persistent damage uses category *persistent*. |
| **Heightening** | Use PF2e's heightening fields (for example interval +1 adding `1d6` to damage entry 0). Text-only heightening isn't read, except for persistent damage in an outcome and a buff's heightened duration (see below). |
| **Target** | Plain PF2e forms: `1 creature`, `1 willing creature`, `1 creature touched`, `up to 5 creatures`, `1 undead creature`, `1 living creature`. Also `1 creature with bones`, with a skeleton, with teeth or with blood; these give the GM a confirmation question. Reactions can use `the triggering creature`. Leave the target blank for area spells or spells that affect only you. |
| **Area** | Use the Area field (burst, cone, emanation, line). A `10-foot burst` typed into Target also works. |
| **Duration** | Leave it **blank** (instantaneous) when each outcome states its own time limits. Use `N rounds/minutes/hours/days` for a buff or a lasting spell. Use `varies` only when *every* condition in the outcomes states its own time. Tick **sustained** only for sustained spells. |
| **Traits** | Normal PF2e traits. For afflictions, the `poison`/`disease` trait lets “… venom poison” match an affliction named “… Venom”. |
| **Cast time** | `reaction` or `free` for reactions, with a `<strong>Trigger</strong>` line in the description. |

**Cantrips** heighten to half the caster's level automatically. The module refuses to roll if PF2e resolves a different rank from the one the card recorded, so cast cantrips at the rank PF2e shows.

## Description formatting

Write the description in the item's HTML editor. Keep these rules:

- **One idea per sentence**, ending with a full stop.
- **Link conditions** with PF2e's condition links, including the value in the label: `@UUID[Compendium.pf2e.conditionitems.Item.TBSHQspnbcqxsmjL]{Frightened 2}`. Dragging a condition from the Conditions compendium into the editor creates the link. Plain text such as “frightened 2” also works when it directly follows “is”, “becomes” or “gains”.
- **A linked valued condition with no number** (“becomes @UUID[…]{Clumsy}”) counts as value 1. A value written after the link, such as `{Drained} [[/r 1d4]]`, isn't supported (rolled values are a gap).
- **Separate sections** with `<hr />`. Heightened entries go last, as `<p><strong>Heightened (+1)</strong> …</p>`.

### Condition link IDs

`Compendium.pf2e.conditionitems.Item.<ID>`:

| Condition | ID | Condition | ID |
| --- | --- | --- | --- |
| Blinded | `XgEqL1kFApUbl5Z2` | Frightened | `TBSHQspnbcqxsmjL` |
| Clumsy | `i3OJZU2nk64Df3xm` | Grabbed | `kWc1fhmv9LBiTuei` |
| Confused | `yblD8fOR1J8rDwEQ` | Immobilized | `eIcWbB5o3pP6OIMe` |
| Controlled | `9qGBRpbX9NEwtAAr` | Off-Guard | `AJh5ex99aV6VTggg` |
| Dazzled | `TkIyaNPgTZFBCCuh` | Paralyzed | `6uEgoh53GbXuHpTF` |
| Deafened | `9PR9y0bi4JPKnHPR` | Prone | `j91X7x0XSomq8d60` |
| Doomed | `3uh1r86TzbQvosxv` | Restrained | `VcDeM8A5oI6VqhbM` |
| Drained | `4D2KBtexWXa6oUMR` | Sickened | `fesd1n5eVhpCSS18` |
| Enfeebled | `MIRkyAjyBeXivMa7` | Slowed | `xYTAsEpcJE1Ccni3` |
| Fascinated | `AdPVz7rbaVSRxHFg` | Stunned | `dfCMdR4wnpbYNTix` |
| Fatigued | `HL2l2VRSaQHu9lUw` | Stupefied | `e1XGnhKNSQIm5IXg` |
| Fleeing | `sDPxOjQ9kx2RZE8D` | Unconscious | `fBnFDH2MTzgFijKf` |

## 1. Basic save that only deals damage

Set a basic save, one structured damage entry and a single damage sentence:

```html
<p>A whip of frost lashes the target, dealing 2d6 cold damage with a basic Reflex save.</p>
<hr />
<p><strong>Heightened (+1)</strong> The damage increases by 1d6.</p>
```

There must be exactly one sentence that mentions damage. Avoid words the module treats as extra rules, such as *also*, *additional*, *until*, *for 1 round*, condition names, *immune*, *becomes*, *move*, *push*, *temporary* and *persistent*, unless they're part of a supported rider below.

**Persistent damage in a basic save:** “The spray deals 2d10 piercing damage and 1 persistent bleed damage to all creatures in the area, with a basic Reflex save.” works when the spell has a structured damage entry of exactly that persistent formula and type. The basic save halves or doubles the persistent part as PF2e's own buttons do (a success leaves `0.5 * 1` bleed).

**A penalty to the save the GM judges:** “Prone creatures or those taking persistent bleed damage take a –2 status penalty to the save.” (a short lead-in ending in a colon is narration). The card asks the GM for each target before its save, as for the bonus described below.

## 2. Basic save with a rider

Add one rider sentence after the damage sentence:

```html
<p>A bolt of numbing cold deals 2d6 cold damage with a basic Fortitude save. On a critical failure, the target is also @UUID[Compendium.pf2e.conditionitems.Item.i3OJZU2nk64Df3xm]{Clumsy 1} for 1 round.</p>
```

**Rider openings:**
- “On a failure,” / “On a failed save,” / “On a critical failure,”
- “If the target (critically) fails,”
- “A creature that (critically) fails its save”
- “Creatures that (critically) fail”

Plain “fails” means failure and critical failure; “critically fails” means critical failure only.

**What can follow:** one list of conditions with lifetimes (see [Lifetimes](#condition-lifetimes)). You can add an alternative for the worse degree: “…, or @UUID[…]{Sickened 2} on a critical failure.”

The subject may be written “it's also …” (“If a target critically fails the save, it's also Deafened for 1 minute.”). A short narration may come before the condition, if it has no numbers or rules: “A creature that critically fails its save is disoriented by the explosion of water, becoming Off-Guard until the end of your next turn.”

**Basic-save phrasings that are also understood:**
- **Only one creature type is hit:** “Each undead creature in the area takes 4d12 vitality damage.” Only undead targets are affected; other targets are marked unaffected.
- **A side effect on the environment:** “The water also extinguishes non-magical fires in the area.” This is treated as narration.

**Other supported basic-save extras** (exact sentences):
- **Death at 0 HP:** “If this damage reduces the target to 0 Hit Points, it dies.”
- **Caster healing or temporary HP:** “You gain temporary Hit Points equal to half the damage the target takes.” The temporary HP needs a duration sentence, for example “The temporary Hit Points last for 1 minute.”
  - One single-target shape may omit the duration: “You gain temporary Hit Points equal to the total amount of HP the target loses, including the HP lost from becoming Drained.” The rows must grant Drained. The amount is the target's Hit Points before the damage less those after its row, since PF2e lowers them for Drained at once. With no duration stated, the temporary HP last until used.
- **Creature-state immunity (GM question):** “A creature with no blood is immune.” / “Creatures that lack organs are unaffected by this spell.”
- **An alternative area with a condition:** “You can change this spell's area to a @Template[burst|distance:5], provided you center the burst in a body of water.”, optionally followed by “This body of water can be as small as a pond or creek, but not as small as a puddle or bathtub.” The card lists both areas; the caster places one.
- **A weakness Effect on a critical failure:** “On a critical failure, the target also gains weakness 1 to bludgeoning until the start of your next turn.” plus one Spell Effect link. The Effect's only rules must be `Weakness` of those types, whose value at the cast rank is the stated number (`@item.level` works), and it must last as stated (“until the start of your next turn” is 1 round ending at a turn's start).
- **A caster question that changes the dice:** “If you already dealt damage to an enemy this turn with a Strike or spell, increase the damage dice from this spell to d12s.” The card asks the caster (Yes/No) before damage is rolled, and “Yes” rolls d12s. If the cast's own damage already uses d12s (PF2e's own variant for it), nothing is asked.
- **A caster question that adds damage:** “If you have any harmful conditions imposed by emotion effects, <spell> deals additional mental damage equal to the counteract rank of the highest-level effect.” (the type must be the spell's one damage entry's). Before damage is rolled, the card asks the caster for that rank (0 to 10; 0 if none) and adds it to the roll (“1d8 + 2 mental”). Finalize waits for the answer.
- **Unattended objects:** “Each creature and unattended object in the area takes …” damages the creatures; the card reminds the GM that objects take it too.
- **A caster reminder on a failed save:** see section 3.
- **Affliction on a failed save:** “Creatures who fail their save are afflicted with stage 1 of X (on a critical failure, the creature moves immediately to stage 2).” It needs a stage block (see [Afflictions](#5-afflictions-pseudo-afflictions)).

**An Effect for another creature after a damaging save.** A basic save with one linked Effect (exactly fast healing at the cast rank, sustained):
- “If the target takes damage, a willing creature within the hex's range gains fast healing 1 for as long as you Sustain the hex.” (the amount is the rank);
- “The target takes damage only once from this spell, whether or not you Sustain it.”;
- optionally one opening sentence of narration.

The save deals its damage once. After Finalize, if the target took damage, the card's **Grant to targeted creature** button puts PF2e's Effect on the one willing creature the caster targets (not the damaged one). It works once. With no damage, nothing is granted. The Effect's own sustained duration carries the spell.

**Nonlethal damage and a knockback for one kind of creature.** A basic save with one damage entry:

```html
<p>You release a quick burst of wind … . The wind deals 2d4 bludgeoning damage, which is nonlethal against living creatures. Against undead, the winds are more vicious, and the spell loses the nonlethal trait against such creatures. Each creature in the area must attempt a basic Reflex save. On a failure, undead creatures are also knocked back 5 feet (or 10 feet on a critical failure).</p>
```

- **Damage:** the damage sentence must match the entry. The trait in “Against <trait>” must be the knocked-back one.
- **Narration:** one sentence of narration may come first.
- **On the card:** the damage is the ordinary basic save. Nonlethal is a **GM:** reminder, since PF2e doesn't track it: a living creature reduced to 0 Hit Points falls unconscious instead of dying. A failing (5 feet) or critically failing (10 feet) creature with the trait gets a push note; others get none.

## 3. Save with a degree-of-success table

Leave **basic** unticked. Put the table after an `<hr />`, with all four headings spelled exactly like this:

```html
<p>Shadowy hands clutch at the target, which must attempt a Will save.</p>
<hr />
<p><strong>Critical Success</strong> The target is unaffected.</p>
<p><strong>Success</strong> The target is @UUID[Compendium.pf2e.conditionitems.Item.TBSHQspnbcqxsmjL]{Frightened 1}.</p>
<p><strong>Failure</strong> The target is @UUID[Compendium.pf2e.conditionitems.Item.TBSHQspnbcqxsmjL]{Frightened 2} and @UUID[Compendium.pf2e.conditionitems.Item.xYTAsEpcJE1Ccni3]{Slowed 1} for 1 round.</p>
<p><strong>Critical Failure</strong> The target is @UUID[Compendium.pf2e.conditionitems.Item.TBSHQspnbcqxsmjL]{Frightened 3} and @UUID[Compendium.pf2e.conditionitems.Item.eIcWbB5o3pP6OIMe]{Immobilized} until it Escapes (the DC is your spell DC).</p>
```

**Damage in a table:**
- “The target takes half damage / full damage / double damage.” This uses the structured damage entry.
- “The target takes full piercing damage …” also works when the spell has a single damage entry of that type.
- Extra damage in an outcome must be an inline roll: `@Damage[1d6[poison]]`.
- Persistent damage in an outcome: `@Damage[1d6[persistent,bleed]]`.
- **Only persistent damage:** give the spell one structured damage entry with the **persistent** category (for example `1d6` cold), say it before the table (“The target takes 1d6 persistent cold damage with a Fortitude save.”), and write each row as “The target takes half the persistent cold damage.”, “… (takes) the full persistent cold damage …” and “… (takes) double the persistent cold damage …” (or “As failure, but double the persistent cold damage.”). Critical success must be “The target is unaffected.”

**Other outcome forms:**
- **Extra damage on top of another degree:** “As failure, plus the creature takes 1d6 bludgeoning damage.” If the dice match the spell's single damage entry, that entry is rolled; with no damage entry and no heightening, the dice are rolled as written.
- **Only creatures on the ground** (before the table): “Terrestrial creatures in the affected area must attempt a Reflex save …”. The GM confirms for each target whether it's on the ground.
- **Inheritance:** “As failure, but …” and “As success, …” are understood. After “but”, a valued condition replaces the inherited one's value (“As success, but Frightened 2.” gives Frightened 2, not Frightened 1 and 2).
- **A longer duration:** “As success, but the effect lasts 1 minute.” (also “As failure, except the duration is 10 minutes.”) gives the inherited row's conditions the new fixed duration, in rounds, minutes, hours or days. The inherited row must have only conditions with fixed durations of their own. A later row inheriting it (“As failure, and …”) gets the new duration too.
- **Short narration in a row:** “The creature is thrown off by your display.” / “The creature fully believes your performance, leaving itself open.” is narration when it starts “The target/creature/It/They is/are/fully/becomes”, runs 90 characters or less, and names no condition or number. It also can't contain rule words (can, must, only, instead, gains, loses, until, while, takes, immediately …), and the row must have conditions stated elsewhere.
- **A restated condition:** “It then remains dazzled and off-guard until the start of your turn.” in a row with no conditions of its own takes those conditions from an earlier row with the same stated duration.
- **Note Effects (behaviour, attitude, choices):** a row clause the module can't carry out, such as “The target can't use hostile actions against you.”, “The target treats no other creature as an ally for 3 rounds.”, “For the first action on its next turn, the creature must use a single action to do as you command.” or “It can't Delay or take any reactions until it has obeyed this urge.”, becomes a rule-less Effect on the creature. The Effect is named after the spell and the rule, carries the text in its description, and lasts as the clause says: its own words, “on its next turn”, the row's other note, or the spell's duration. “As failure, but …” replaces the failure row's note of the same kind. Sentences before the table that only explain the noted behaviour (a list of commands, “It can't Delay …”) are added to the note. A clause with unread damage, conditions, saves, movement or other automatable rules is never a note.
- **Falling asleep:** “The creature falls unconscious. If it's still unconscious after 1 minute, it wakes up automatically.” applies PF2e's Unconscious for that time, with a note that it can wake earlier as PF2e's rules allow.
- **A row penalty:** “The creature takes a –1 status penalty to Perception checks for 1 round.” (Perception, saving throws, a named save, AC, attack rolls or a skill; −1 to −4 status or circumstance; rounds or minutes) becomes a note Effect carrying that modifier. “… to its checks and DCs …” is PF2e's all-checks-and-DCs modifier (as Frightened's). “… for 1 minute and is Dazzled as long as it has this penalty.” gives the row's condition the penalty's duration.
- **Ending early:** a sentence before the table saying how the effect ends early (“If a creature affected by parch drinks a liquid, …, the spell ends.”, “… can end the effect as a two-action activity …”) is added to the row notes, including a modifier's note. The GM removes the notes when it happens. A spell with no row notes and such a sentence stays blocked.
- **Heightened rows:** a fixed-rank Heightened entry that changes the rows (conditions, their values, “on a failure …”) and isn't read otherwise makes that rank and above refuse on the card (“Resolve it by hand”). The ranks below are automated. Heightened durations the module reads (“The effects last for 1 minute.”) don't gate.
- **Only if asleep:** “If it's asleep, it wakes up and is Paralyzed for 1 round.” The condition (and the same condition in rows that say “As failure, …”) applies only to a creature asleep at Finalize: PF2e's Unconscious with Hit Points above 0. That creature wakes (its Unconscious ends); others get a card note instead.
- **While frightened:** “A creature frightened by this spell takes 1 additional mental damage each time it's hit by a Strike.” (before the table) becomes a “Hit while frightened” note on each row that applies Frightened N. It lasts N of the creature's turns, ending at the end of its turn, as Frightened drops. A “Heightened (+1) The mental damage increases by 1.” entry is added to the note for the GM.
- **Against the caster, and when it damages the caster:**
  - Success: “When the target attempts an attack roll or skill check that would harm you, it takes a -2 status penalty to its roll.”
  - Failure: “As success, but the target also becomes Sickened 1 each time it damages you.”
  - Critical failure: “As failure, but the sickened value is 2.”

  These become notes for the spell's duration (“Penalty against the caster”, “Sickened when it damages you”). Which rolls would harm the caster, and each time it damages the caster, are the table's to judge. The cast itself applies no Sickened. On a sustained spell the notes end with the cast.
- **What the creature sees:** “It treats bright light as dim light, and unless it has greater darkvision, all creatures are Concealed to it.” describes what the target perceives. It isn't PF2e's Concealed on the target, which would conceal the target from others. It becomes a “What it can see” note for the spell's duration, with a short lead-in about the target (“The target is shrouded in murky darkness.”). Any other sentence in the row blocks.
- **A willing ally chooses:** “If you cast this hex (or spell) on a willing ally (…), the ally can choose which result it gets without rolling.” is a **GM:** reminder to set its result on the card.
- **Two skills, and a stumbling Stride:**
  - Success: “The target takes a -2 status penalty to Athletics and Acrobatics checks.”
  - Failure: “As success, and each time the target Strides, it uses the first 5 feet of movement of the Stride to move 5 feet in a random direction (this is forced movement). This has no effect on a creature with only 5 feet of movement.”
  - Critical failure: “As failure, except you control the direction of the target's first 5 feet of movement of the Stride.”

  The penalty is a note Effect with generated modifiers for the spell's duration. The Strides are a note the GM plays. A linked PF2e Effect giving exactly that penalty for that duration is set aside, since the note carries the same rules. Any other penalty keeps the link, and the spell stays blocked.
- **Damage on a hostile action:** Rows “The next time the target takes a hostile action, the target takes 1d4 mental damage; the spell's duration then ends.” / “The first time in a round when the target takes a hostile action, the target takes 1d4 mental damage.” / “Each time the target takes a hostile action, the target takes 1d4 mental damage.” (the spell's own damage entry; “Heightened (+1) The mental damage increases by 1d4.”):
  - Each row puts a “Hostile actions” note on the creature for the spell's duration.
  - The Ongoing panel then offers “<spell>: <creature> took a hostile action”. It deals the damage at the cast rank, once and then ends that creature's note, once a round, or each time.
- **How other spells treat it:**
  - **Failure:** “Effects as described above.”, with the effect before the table (“For the duration, Harm and Heal spells treat the creature as undead. In addition, harm spells gain a +2 status bonus to the Hit Points restored to the target.”), becomes a note for the spell's duration that includes its heightening.
  - **Success:** “The target heals half as much from heal and takes half as much damage from harm for 1 round.” becomes a 1-round note. The GM applies both.
  - **Unwilling target:** “An unwilling target can attempt a Will save to reduce the effects.” is the willing-no-save reminder.
  - **Target:** “1 living creature touched” is living.
- **The triggering Stride:** “The creature treats all squares as difficult terrain for its Stride.” / “As failure, except that you determine where the target moves during the Stride, though you can't move it into hazardous terrain or to a place it can't stand.” become 1-round notes the GM plays. “Regardless of the result, the creature is immune to <spell> for 1 hour.” is the usual temporary immunity; “temporarily” may be left out.
- **A penalty against the triggering effect:** Success: “The target takes a -1 status penalty to its defenses against the triggering effect. This penalty is -2 if the target is being encouraged to advance its own ambitions. The target doesn't realize you Cast the Spell on it.” Failure: “As success, but the penalty is -4 if …” Critical failure: “As success, but the creature automatically follows a suggestion that advances its own ambitions.” These become 1-round notes the GM applies, since they depend on what the target is being asked to do. Target “one creature being influenced” is the creature the trigger names. “The target is unaffected and realized you attempted to influence its reaction with magic.” needs nothing.
- **Revealing the truth:** “The creature can immediately choose to reveal the truth about its deception as a free action to immediately recover Hit Points equal to the mental damage it took and lose the stupefied condition from the spell. If it does, … If the creature used Deception to successfully Feint and it reveals the truth in this way, the target of the creature's Feint is no longer Off-Guard due to the successful Feint.” is the creature's choice: a 1-round note the GM plays. The Off-Guard named there is the Feint target's and is never applied to this creature.
- **The soul leaves the body:** “The target's soul exits its body and the target's body becomes stunned for 1 round. While their body is stunned in this way, … When the target's body ceases being stunned, the target's soul instantly returns to their body as the target wakes.”:
  - The body's Stunned applies for that time.
  - The soul's form becomes a “Soul form” note for the same time, including “is Invisible”, which is the soul's and never applied to the body. A heightened entry about willing allies joins the note.
  - Target “1 living creature that has a soul” is living, plus a GM question. “You can allow allies to choose the degree of success instead of rolling a saving throw.” is the willing-choice reminder.
- **Up to a size:** Target “all creatures and unattended objects” with “Large or smaller creatures must attempt a Fortitude save.” limits the save to creatures of that PF2e size or smaller.
  - **Objects:** “Unattended objects of 1 Bulk or less are pushed 5 feet away from you.” is a **GM:** reminder, with a heightened distance when one applies.
  - **Push forms:** also read are “As success, and the creature is pushed 5 feet away from you.” (the success row's notes carry over) and “The creature is pushed 5 feet away from you and can't use reactions until the end of your turn.” (the reactions part becomes a note to the end of your turn).
  - **Heightened distance:** “Heightened (4th) Increase the area to a 10-foot emanation and increase the distance objects and creatures are pushed to 10 feet.” makes the push 10 feet from that rank. The GM places the larger area.
- **A pair that dislike each other:** Target “2 creatures that each have an unfriendly or worse attitude toward the other” is a GM question for each target.
- **No worse than success in combat:** “A creature currently engaged in combat can't get a result worse than success, and a target that is subject to hostility from any other creature ceases to be affected by <spell>.” is a GM-confirmed degree floor: a failure or critical failure becomes a success. The whole sentence also joins the row notes. Another wording isn't read as a floor; it stays a reminder on the notes.
- **A penalty against one creature:** “It has a -2 status penalty to attack rolls against the other target for 1 round.”, with a short lead-in about the creature, becomes a note for that time. The GM applies the penalty against that creature.
- **“As failure, but …” with a note of the same kind:** the note replaces the failure's. If the failure's note had a behaviour rule the new one lacks (“can't make hostile actions …”), the new note keeps it: “As on a failure: … But: …”.
- **A faster target:** Target “1 creature with a land Speed greater than yours” compares the creature's PF2e land Speed with the caster's when the saves are prepared. A creature that isn't faster is ineligible.
- **Clumsy and slowed, by row Effects:**
  - **A row's own Effect:** “The target is Clumsy 1 and takes a –10-foot status penalty to all its Speeds until the end of your next turn.” is proved by an Effect linked in that row. Its rules must be exactly an `all-speeds` FlatModifier and a GrantItem of that condition, at value 1 or badge-upgraded to the value. The Effect carries the condition.
  - **A degree-choice Effect after the table:** it states “The target is clumsy 1 and takes a –15-foot status penalty to all its Speeds for 1 minute.”, with the grant predicated per degree (the critical failure's badge-upgraded to 2). “During this time, it can't benefit from bonuses to its Speeds or take other penalties to its Speeds.” is its AdjustModifier suppressing every other Speed modifier. The Effect's own duration (1 minute) counts when every row it's bound to states it.
- **A penalty against effects with a trait:** “The creature takes full damage and takes a –1 status penalty to Will saves against emotion effects for 1 round.” (or “takes double damage and a –1 …”) gives the row's damage and a note carrying a FlatModifier on that save, predicated on `item:trait:emotion`, for the stated time.
- **An aura's inline result:** “The first time an enemy enters the aura each round, or if they start their turn within the aura, they must succeed at a Will saving throw or become Confused for 1 round.”
  - This becomes a lingering emanation around the caster: entering once a round, starting a turn inside, enemies only.
  - A failure or critical failure gives that condition; a success is unaffected.
  - One following “While confused by this effect, …” sentence becomes a note lasting as the condition does.
- **A lingering area's caster benefit:** “You manifest …, granting you a +1 status bonus to Will saving throws against emotion effects for 1 minute.” with the one linked Effect giving exactly that (the same trait predicate, 1 minute). PF2e's Effect is put on the caster when the area starts.
- **A penalty PF2e's Effect states, sustained:** “The target takes a -1 status penalty to Perception, attack rolls, and Will saves. This penalty increases to -2 for Will saves against sleep effects.” (success), with the Effect link after the table. The linked Effect must have exactly:
  - one `FlatModifier` on those statistics, with that type and value and no predicate;
  - one `AdjustModifier` overriding that save to the higher value for `item:trait:<trait>`.

  It's applied on the success row and on every row saying “As success, …”, for the spell's duration. A sustained spell needs PF2e's Effect to be sustained for the same maximum. “As success, and any time the target uses a concentrate action, it must succeed at a DC 5 flat check or the action is disrupted.” adds a “Concentrate actions” note the GM plays.
- **Healing halved:** “The target takes full damage, and vitality effects heal it only half as much as normal for 1 round.”: the row's damage is applied, and a “Healing halved” note Effect lasts the stated time. The GM halves the healing; the module doesn't.
- **Attitudes:** a link to an attitude (Friendly, Helpful, Indifferent, Unfriendly, Hostile) is never applied as a condition. A row's attitude sentences (“The target's attitude becomes Friendly toward you. If it was Friendly, it becomes Helpful.”) become one **Attitude** note for the spell's duration, and “As failure, but the target is helpful.” replaces it. “If you use hostile actions against the target, the spell ends.” is added to the notes (before the table) or becomes its own note (in a row). A heightened duration (“Heightened (4th) The duration lasts until the next time you make your daily preparations.”) lengthens notes that last the spell's duration.
- **Rows that only give the duration:** “The duration is 1 minute.”, “The target is affected for 1 round.”, “The effect lasts for 1 round.”, “The effect lasts its normal duration.” (the item's duration), “The creature is affected for [[/gmr 1d4 #rounds]]{1d4 rounds}.” (rolled for each creature at Finalize), or “As failure, but the target can't perceive anything beyond a range of 10 feet.” The effect described before the table becomes a note (“Spell's effect”) lasting each row's duration. It may hold situational numbers and damage the target deals (“All physical damage dealt by the target … becomes nonlethal”), but no damage the spell deals, dice, conditions or unconditional bonuses. Before the table, “The spell's duration depends on the target's Fortitude save.”, “An unwilling target must attempt a Will save.” and the temporary-immunity sentence are read as the save's own. “A willing target can choose to critically fail their saving throw.” (or “You can allow allies to choose the outcome …”) is a **GM:** reminder to set its result. Set the item's duration to `varies` (or the normal duration).
- **A save to avoid the effect, with no table:** “Creatures can attempt a Reflex save to avoid the cloud.” (the item's save, not basic, no damage entry) reads as a success or better avoiding it, and a failure or worse getting the effect for the item's duration. The save is optional, so a **GM:** reminder says to set a willing creature's result to a failure. In the effect:
  - “The target gains fire resistance 2.” is a `Resistance` rule on the note. With “Heightened (+1) The amount of fire resistance increases by 2.” its value is at the cast rank.
  - “Creatures with weakness to water take damage equal to their weakness at the end of each of their turns.” stays in the note for the GM.
- **Damage the GM reports, in the effect:** “During the duration, the target must Stride, Fly, or Swim at least once each turn or take 2d8 mental damage at the end of its turn.” must be the item's damage entry. The note then carries an Ongoing control, “<spell>: <creature> didn't Stride, Fly or Swim this turn”, which deals that damage at the cast rank, once a round. The dice are heightened by one “Heightened (+1) The damage increases by 2d8.”. The rows deal no damage themselves. “The GM might decide to add additional move actions …” stays in the note.
- **A save sentence then the failure, with no table:** “The target must attempt a Will save. If the target fails, whatever actions …” reads the same way: a failure or worse gets the rest as the note for the item's duration. A condition in the effect blocks the note, except the triggered form “If the target can't <…>, it can act as it chooses for that action but becomes Stupefied 1 until the end of its turn.”, which stays in the note for the GM to apply when it happens.
- **An attitude step unless it saves:** “You improve the target's attitude to you by one step (unfriendly to neutral, neutral to friendly, friendly to helpful) for the duration of the spell unless it succeeds at a Will save.” gives the failure rows an Attitude note (heightened durations apply). “Afterward, the target is temporarily immune for 1 day.” is 24 hours of immunity. Target `1 non-hostile domesticated animal` needs the animal trait and the GM's confirmation.
- **A GM-judged save bonus:** “It must attempt a Will save, with a +4 circumstance bonus if you or your allies recently threatened it or used hostile actions against it.” asks the GM per target before the save, and adds the bonus on yes.
- **What an unaffected target believes:** “The target is unaffected but thinks your spell was something harmless instead of charm, unless it identifies the spell.” is narration.
- **GM-judged Target:** `1 creature that could find you attractive`: the GM confirms each target before its save.
- **Behaviour the GM carries out, beside something real:** “The creature can't use reactions and takes a -2 status penalty to Perception checks and Will saves.” splits in two. The penalty is proved by the row's PF2e Effect (with no timing, the spell's 1-round duration), and “It can't use reactions.” becomes a **GM:** note on that target's result. A behaviour rule is allowed only in a row that also applies a condition, an Effect, damage or a push (your decision); a row that's only behaviour stays blocked. “As failure, and the creature also takes …” adds the critical row's own Effect, and the failure row's Effect and note carry into it.
- **Losing the rest of the turn:** “The creature uses its remaining actions to watch you in awe.” becomes a **GM:** note on that target's result.
- **What the target believes:** “The target believes every spirit it sees is an imminent threat. It's Stupefied 3 for 1 round.” A clause starting “The target believes/feels/thinks …” with no rules in it is narration, if the row's conditions come from its other clauses.
- **No effect:** “The target is unaffected.” and “The target takes no damage.”

### Sustained spells

Give the item a sustained duration with a maximum (Duration `1 minute` with **Sustained** ticked). The table's conditions then last while you Sustain the spell:
- a condition with no duration of its own lasts as long as the spell;
- “The target is encumbered for the duration of the spell.” means the same;
- a condition with its own duration (“for 1 round”) keeps it.

The Ongoing panel asks for **Sustain** on the caster's turns. If the caster's turn ends without it, the spell ends and its conditions are removed; they never last past the maximum.

Don't describe anything else that Sustaining does (another save, moving the effect). The module blocks the spell when the text mentions Sustain, except for the lingering-area forms in section 3b.

### One-sentence tables

A short save can skip the table and say it in one sentence, as the **last** sentence before any heightening:

```html
<p>Dread fills the target. The target must succeed at a Will save or become @UUID[Compendium.pf2e.conditionitems.Item.TBSHQspnbcqxsmjL]{Frightened 1} (or @UUID[Compendium.pf2e.conditionitems.Item.TBSHQspnbcqxsmjL]{Frightened 2} on a critical failure).</p>
```

The module rewrites it as a full table: Critical Success and Success are unaffected, Failure gets the first outcome, and Critical Failure gets the “(or … on a critical failure)” outcome, or the first outcome again if there's none.

Accepted forms:
- “<subject> must succeed at a Will save or become / be <condition>”;
- “<subject> must succeed at a Reflex save or fall Prone”;
- “The target becomes <condition> if it fails a Will save”;
- “<narration>, causing it to become <condition> if it fails a Will save”.

A condition may have a value and a duration (“Dazzled for 1 round”). The subject must be plain: “The target”, “Each creature (in the area)”, “Creatures who enter or begin their turn in the area”. A subject after a condition (“On a critical hit, … the target you hit”) or pointing back (“Each of them”) isn't rewritten. Nor is a sentence followed by more rules, or a spell with two such sentences.

With an area and a trigger subject, it's a lingering area (section 3b). Remember that the item's save must be non-basic.

### Extra damage by creature trait

A save or spell-attack spell can deal extra damage to creatures with a trait. Add one sentence, using an inline roll:

```html
<p>The water deals an additional @Damage[((@item.level*2)-2)d6[spirit]] damage to creatures with the unholy trait in the area.</p>
```

The subject may be “The <noun>”, “It” or “This spell”, and the recipients “creatures / each creature / targets / each target with the <trait> trait (in the area)”. The roll is made once for the cast, only if some damaged target has the trait. Each such target takes it scaled like the spell's damage: half on a basic-save success, double on a critical failure or a critical hit.

The formula may read only `@item.level` / `@item.rank`, so it heightens by itself. Persistent extra damage isn't accepted. Use one such sentence per spell. The extra damage may also be a clause at the end of the damage sentence: “… dealing 8d10 cold damage to all creatures in the area, plus an additional @Damage[(@item.rank+1)d10[vitality]] damage to undead creatures.” (a creature trait; “living” isn't one).

The same extra damage may follow a semicolon: “… each creature in the area takes 7d6 spirit damage; creatures with the holy trait take an additional @Damage[10[spirit]] damage.”

Fixed dice also work in a spell attack: “If the target has the holy trait, you deal an extra 5d6 spirit damage.” If the Heightened entry says “the spirit damage (against holy creatures) increases by 2d6”, the extra damage grows with the item's heightening interval (5d6 at the spell's rank, +2d6 per step). If the Heightened entry mentions that damage in any other way, the spell is blocked.

**Counteracting light or darkness where the spell passes or lands.** In any save or spell-attack spell, one of these is accepted, with the spell's name in the middle:

> If the ray passes through an area of magical light or targets a creature affected by magical light, <spell> attempts to counteract the light. If you need to determine whether the ray passes through an area of light, draw a line between yourself and the (spell's) target.

> If the globe overlaps with an area of magical darkness (or affects a creature affected by magical darkness), <spell> attempts to counteract the darkness effect.

- **Words that may vary:** “ray”, “light”, “beam” and “line”; “globe”, “burst” and “cloud”; “light” or “darkness”. The second sentence of the first form is optional.
- **On the card:** the module doesn't track where magical light and darkness are, so the card shows the sentence as a **GM:** reminder with a **Counteract the darkness** (or light) button. The GM names the effect and gives its counteract DC and rank. The card then rolls the caster's PF2e counteract check (at the cast rank) and posts whether it's counteracted; the GM ends it.
- Only one such sentence per spell. A spell that doesn't resolve on the save card stays unresolved.

### Damage typed by a sorcerer bloodline

PF2e's sorcerer bloodlines can set a spell's damage type. The module leaves the roll to PF2e and checks that the bloodline was applied. Use one of these, with an untyped damage entry unless noted:

- **Draconic, the whole damage:** “The damage type depends on the magical tradition related to the dragon that influenced your bloodline.” The item needs PF2e's rule: a DamageAlteration with mode `override`, property `damage-type`, selectors `["spell-damage"]`, value `{actor|flags.system.dragonBloodline.damageType}` and predicate `["item:slug:<your slug>"]` (copy it from Dragon Breath).
- **Elemental, the whole damage:** “This spell deals damage according to your elemental influence (for instance, slashing for air or fire for fire) and has your element's trait.” The item has no rules. The Elemental bloodline's own alteration applies only to PF2e's listed slugs (`elemental-toss`, `elemental-blast`), so a homebrew spell with a new slug is refused when its damage is rolled.
- **Draconic, extra dice:** “On a hit, the target takes 1d8 slashing plus 1d4 additional damage of a type determined by the magical tradition related to the dragon that influenced your bloodline: arcane force, divine spirit, occult mental, or primal fire.” The damage entry is the typed part (`1d8` slashing). The item needs PF2e's DamageDice rule: selector `spell-damage`, damage type `{actor|flags.system.dragonBloodline.damageType}`, the text's die size, and a predicate naming your slug. With “Heightened (+1) The initial damage increases by 1d8 and the additional damage increases by 1d4.”, its dice number is `@item.level` and the spell must be rank 1.

**When cast:** a caster without that bloodline choice in PF2e is refused (“has no draconic bloodline choice”). If PF2e's roll doesn't carry the bloodline's type, nothing is recorded.

**Also in this family:**
- **An area picked from a list:** a first paragraph `<p><strong>Area</strong> @Template[burst|distance:10], @Template[cone|distance:30], or @Template[line|distance:60]</p>` and “… in one of the various listed shapes of your choosing, …” in the damage sentence. The item has no area. A Range such as `30 feet (burst only)` is shown with the burst. The card lists the shapes; the caster places one and targets the creatures in it.
- **Targets close together:** a Target such as `2 creatures no more than 10 feet from each other` is checked when the card starts. Each pair of target tokens must be within that distance.
- **Two attacks, one penalty:** “Make a spell attack roll against each creature. This counts as two attacks for your multiple attack penalty, but the penalty doesn't increase until you've made both attacks.” Both targets use one attack number.

### Cast through a thrall

A spell with Target `1 of your thralls` works from the thrall's space. PF2e has no thrall trait, so the thrall is whichever targeted token the caster chooses. With more than one targeted token, the card asks which one it is. The item needs a Range in feet (the thrall must be that close to the caster). Use one of these, with the item's area matching:

- **An emanation around it:** “Each creature within a 10-foot emanation of the thrall takes 1d12 void damage with a basic Fortitude save.” The area is an emanation of that size, and each target must be within 10 feet of the thrall's token.
- **A line or cone from its space:** “Destroy the target thrall, and each creature in a 15-foot line originating from the thrall's former space takes 2d6 piercing damage with a basic Reflex save.” The area is that line or cone. The caster places it and targets the creatures in it.
- **One creature near it:** “The target thrall launches itself at a creature within 15 feet, and the target must attempt a Fortitude saving throw.” There's no area. One target, within 15 feet of the thrall, followed by the degree table as usual.

Add “This destroys the thrall.” or “The (target) thrall is destroyed.” to destroy it. The card then shows a **GM:** note to remove the thrall's token; the module doesn't delete it. The thrall never makes a save.

### Enemies only

An area spell that affects only enemies says so as the recipient of its save or damage:
- “Each enemy in the area must attempt a Will save.” (also “Enemies in the area must attempt …”, or “Each enemy in the area takes 2d6 void damage and must attempt …”);
- “You deal 3d4 mental damage to all enemies in the area, with a basic Will save.” (also “to each enemy” or “to your enemies”);
- a Target field of `enemies in the area`.

On the save card, the caster and its allies (same PF2e alliance, **Party** or **Opposition**) are marked unaffected. Creatures of the other alliance are affected. For a creature with no alliance (neutral), the card asks the GM whether it's an enemy. Set actor alliances in their sheets for this to work well.

If the text qualifies the enemies (“all enemies within the area other than dragons”) or also names creatures in the area as recipients, no enemy rule is applied, and the qualifier's own gap remains.

“Living enemies” gives both the enemy rule and the living-creature rule.

### Condition lifetimes

Write the lifetime straight after the condition or the condition list. A lifetime written after a list applies to every condition in that list. The exception is a valued Frightened or Sickened, which PF2e ends on its own; put its timer straight after it if it needs one.

| Lifetime | Example wording |
| --- | --- |
| Timer | `for 1 round`, `for 3 rounds`, `for 1 minute`, `for 10 minutes`, `for one hour` |
| Turn boundary | `until the start of your next turn`, `until the end of its next turn`, `until its next turn begins`, `until the end of the target's next turn` |
| Timer | `for the duration` (a spell with a fixed Duration: that duration) |
| Permanent | `permanently`, `for an unlimited duration` (only the condition the phrase follows) |
| Rest | `until it next gets eight hours of rest`, or `, decreasing these conditions by 1 for each eight hours of rest it gets` (valued conditions); and “The <condition> condition doesn't end when the spell's duration does (but can still be removed with a night's rest or by similar means).” PF2e's Rest for the Night ends or lowers them. It only runs for player characters, so for an NPC the GM removes them. |
| Escape | also “… for 1 minute. At the end of each of its turns, the target can attempt to Escape. The Escape DC is equal to your spell DC.”; `until it Escapes`, `, or until it Escapes`, `, but it can attempt to Escape`, optionally with `(the DC is your spell DC)` / `against your spell DC`, and `, whichever comes first` |
| Interact | `until it uses an Interact action to <purpose>`, `, though it can Interact to <purpose> and remove the condition` |
| Rolled rounds | `Stupefied 1 for [[/r 1d4 #rounds]]{1d4 rounds}` or `for 1d4 rounds`: rolled for each creature at Finalize, posted to chat. Only the condition the phrase directly follows. |
| Spell ends | `… or until the spell ends` |
| Persistent damage | `slowed 1 until the persistent cold damage ends`: the row must deal the spell's persistent damage of that type. The condition goes when the creature no longer has that persistent damage. |
| Self-limiting | Frightened, Sickened, Prone and numbered Stunned need no timer; PF2e ends them. A timer written after another condition (“Frightened 3 and Fleeing for 1 round”) belongs to that other condition only. |
| Stunned for a time | `@UUID[…]{Stunned} for 1 round`: loses all actions for that time |

**A rolled value:** “The target is @UUID[…]{Drained} `[[/r 1d4]]`.” When the target fails, the module rolls the value, posts the roll and applies that value. Only a single `NdM` roll is read.

**Duration “varies”:** give the item a blank or “varies” duration only when every condition in the table lasts on its own terms. That means a timer, a turn boundary, or a condition PF2e ends by itself (Frightened, Sickened).

**Any number of creatures:** a Target field of `any number of creatures` needs no other targeting rule.

**A basic save that writes its own table:** an instantaneous basic save may also spell out the four rows, as long as they restate the basic results. Critical success must be “The target is unaffected.”, then “takes half damage…”, “takes full damage…”, and “takes double damage…” (or “As failure, but the creature takes double damage…”), with extra rules after them. The table is then read like any other. It isn't used when the text before the table has an inline roll, “instead” or a GM ruling, or a row mentions persistent damage.

**Through a thrall, onto a creature near it:** “A creature within 15 feet of the target thrall becomes <narration>. The thrall is destroyed, and the creature must attempt a Fortitude saving throw.” Target the thrall and the creature. The card checks the distance and reminds you to remove the thrall.

**Inline damage display options:** `@Damage[…|shortLabel]` and `|name:…` are read as the plain roll. Other options (such as `|options:…`) still block the spell.

**One paragraph per action count** (for PF2e variants): after the opening text, which must say the number of actions decides (“The number of actions you spend Casting this Spell determines …”), write one paragraph per count, starting with PF2e's action glyph (`<span class="action-glyph">2</span>`), optionally followed by a trait note like “(manipulate)”. Give the spell a PF2e variant (overlay) for each count with its own area, targets and damage.

When a variant is cast, only its own paragraph applies. A sentence restating the variant's targets, area or damage must agree with the variant's data:
- “The spell targets one creature (within 30 feet).” / “The spell targets up to five creatures.”
- “The spell targets all creatures in a @Template[…].”
- “The spell is a 30-foot cone(, dealing 2d6 electricity damage and 2d6 fire damage).”
- “This spell deals 1d10 sonic damage, and its area is a 5-foot square.”
- “This spell affects a single 5-foot square and deals 4d6 force damage.”
- “The line is 60 feet long.”

Anything else in the paragraph is read like the rest of the spell (a basic save sentence, a rider). A restatement that disagrees with the data blocks that variant. Only 1-, 2- and 3-action variants are read; a “Two Rounds” casting isn't. “The spell deals 1d4 sonic damage to a single enemy, with a basic Fortitude save.” targets one enemy.

**A reaction whose Target field is its trigger** (“A creature within 30 feet fails a Deception or Diplomacy check.”) targets that triggering creature. So do the Targets “the triggering foe” and “the triggering enemy”.

**Something the caster does when the target fails a basic save:** “If the target fails the save, you … @UUID[…actionspf2e…]{Recall Knowledge}.”, optionally followed by “Choose …” / “Use …” sentences with no numbers or rules. The card shows it to the caster. The module doesn't make that check.

**A GM-judged penalty and condition on a basic save:** “A target wearing metal armor or made of metal takes a –1 circumstance bonus to its save, and if damaged by the spell is Clumsy 1 for 1 round.” (PF2e's own text says “bonus” with a minus sign.) The card asks the GM for each target. A “yes” target saves at −1, and gets the condition for 1 round only if the spell damaged it.

**A bonus or penalty to the save the GM judges** (before the table): “If the target doesn't understand the language or you're not speaking a language, it gains a +4 circumstance bonus to its save.” Also accepted: “the target gets …”, “to the Will save”, “It gains a +4 circumstance bonus to this save if …”, “If the target is not on its home plane, it takes a –4 status penalty to this save.”, “A creature afflicted by a disease takes a –2 circumstance penalty to this save.”, and “The target must attempt a Fortitude save; creatures with the gnome trait take a –2 circumstance penalty to this save.” Only one such sentence, a circumstance or status value of 1 to 4, and a condition that isn't about the roll itself (“taking persistent damage” is allowed). The card asks the GM for each target (“Yes (+4)” / “No”) and adds the bonus to that target's save. The save can't be rolled until the question is answered.

**Forced movement toward an area's centre:** a row reading exactly “The creature moves 15 feet toward the center.” shows a **GM:** note on the card by result. Tokens aren't moved.

**A push in a damage row:** “The creature takes full damage and is pushed 5 feet away from you.” (half, full or double damage) keeps the row's damage and shows a **GM:** push note on the card by result. Tokens aren't moved. If the Heightened text changes the distance (“the distance the target is moved … increases by 5 feet”), the push isn't read and the spell stays blocked.

**A push-only row:** “The creature is pushed 15 feet away from you.” works in a row with no damage. “The target is pushed 10 feet away from you and knocked Prone.” also gives the row's Prone. “is pushed 10 feet” without “away from you” is read as away from the caster only when the area is a cone or emanation, or the spell targets creatures.

**A one-sentence push save:** “Any creature targeted by this spell must succeed at a Fortitude saving throw or be pushed 10 feet away from you (or 20 feet on a critical failure).” (also “The target” / “Each creature in the area”) becomes a table with push notes by result. Only the action-count sentence and the cast variant's own restated targets (“The spell targets one creature within 15 feet.”) or area may follow. The base spell, still holding every action paragraph, isn't read this way; the pull form has the same guard.

**The caster moves an unwilling target:** “You move the target up to 10 feet in any direction along the ground or 20 feet through a body of water. An unwilling target can attempt a Fortitude save, and it avoids being moved if it succeeds.” (the item's save, ending the rules text) gives a failure or critical failure a **GM:** note that the target can be pushed up to 10 feet in any direction (the caster's choice), with the water distance. The card also reminds the GM that a willing target doesn't save: set its result to failure.

**Radius by action count:** “For each additional action you use when Casting the Spell, increase the burst's radius by 5 feet.” is read when the spell has a burst or emanation area. PF2e's action-count variants carry each radius.

**A one-sentence pull save:** “The target is pulled 10 feet closer to you unless it succeeds at a Fortitude save. On a critical failure, it's also knocked Prone.” becomes a table in which failure pulls the target 10 feet toward you (a **GM:** note), and a critical failure also knocks it Prone. In a PF2e variant, “The spell targets one creature and pulls the target 20 feet instead of 10.” sets the variant's distance; it must name the base distance. The sentences must end the rules text.

**What the GM does with the push:** these sentences before the table are added to the push note, with the damage worked out at the cast rank:
- “If the creature's movement causes it to hit a firm surface, such as a wall, it takes @Damage[…] damage.”;
- “A creature knocked off a ledge or the like can [[/act grab-an-edge]] to avoid falling.”

Any other sentence about a firm surface, a solid barrier or a ledge blocks the spell (`preamble:collision`).

More push-row wordings:
- “The target takes double damage, is pushed 10 feet away from you, and is knocked Prone.”;
- a damage sentence, then the push: “The creature takes double damage. The creature is pushed 20 feet away from you and is then knocked Prone.”

**A heightened push distance:** “Heightened (+2) … the distance the target is moved on a failure and critical failure increases by 5 feet.” adds that many feet per step to the failure and critical-failure pushes at the cast rank. Any other heightened wording about the distance still blocks.

**A penalty to the triggering ranged attack (PF2e Effects in the rows):** “The recoil imposes a –1 status penalty to the ranged attack and renders the target off-guard until the beginning of their next turn.” works in either of two forms:
- the row's Effect has a `ranged-attack-roll` FlatModifier removed after the roll, and an earlier row states that condition with the same duration;
- the Effect lasts until the start of their next turn and grants the condition. Its extra sentence “Until the start of their next turn, any additional ranged attacks made with the same weapon, spell, or ability take the same penalty.” is claimed with a **PF2e data** note, because the Effect penalizes every ranged attack.

**A target that saves at the start of each of its turns:** with Target `1 creature`, no area and no structured damage, “For the duration of the spell, the target must attempt a Fortitude save at the beginning of its turn.” (the item's save) makes the degree table apply at the start of each of the target's turns while the spell lasts. There is no save when it's cast. A sustained spell ends if you don't Sustain it. “The portal follows the target around, and the tentacle can't be targeted or harmed.” is narration. A row's “until the end of its turn” then ends with that same turn.

**A penalty against you:** “The target takes a –1 circumstance penalty to attack rolls and damage rolls against you.” needs a row Effect whose only rule is that FlatModifier on attack and damage with PF2e's `target:signature:{item|origin.signature}` predicate. With no timing in the row, it lasts the spell's “until the start of your next turn”.

**Spell durations “until the start of your next turn” and “until the end of the target's next turn”** are read on the save route, since each row's conditions and notes carry their own timing.

**Two targets:** Target “two creatures” (or “three creatures”) is read. “…, but you can elect to have one automatically succeed on its saving throw.” becomes a **Caster:** reminder to set that target's result to success.

**A row Effect penalizing vision:** “The target takes a –2 penalty to Perception checks involving vision until the end of its turn.” needs an Effect whose only rule is a Perception FlatModifier with the `visual` predicate, lasting 1 round to a turn's end. If the text gives no type, the card notes the Effect's type.

**Narration before the table:** a “While …” sentence with no rule words (“While the sound is loud, only those closest can feel the true sting of death in it.”), and “… that only creatures in the area can hear” in a basic save's opening, are narration.

**A pull before the saves:** “All Medium or smaller creatures that are adjacent to the line are pulled to the nearest unoccupied space within the line.” becomes a **GM:** reminder on the card. Any other sentence saying creatures are pushed or pulled before the table blocks the spell (`preamble:forced-movement`).

**A save at the start of each of the target's turns** (“At the start of each of the target's turns, it must attempt a Will saving throw.”) is a recurring save, not a one-time one. It isn't automated yet.

**Recurring saves:** add one of these sentences to the same outcome.
- “It can attempt a new Will save at the end of each of its turns to end the enfeebled condition.” (“the target”, “the creature” and Fortitude/Reflex/Will all work.)
- “At the end of each of its turns, the target can attempt a new save to reduce the remaining duration by 1 round, or end it entirely on a critical success.”

**Temporary immunity** (before the table): “The target is then temporarily immune for 1 minute.” Minutes, hours or days. Also accepted:
- “Regardless of the result (of its save), the target is (then) temporarily immune for …”, and the same after “Regardless of the outcome”, “No matter the result”, “After attempting its save” or “After the effects are resolved”;
- “The target must attempt a Will save and is then temporarily immune for 24 hours.”;
- “it's / it is” in place of “the target”, but only right after the sentence where the target makes the item's save (“… depending on its Will save.” counts);
- “temporarily immune to <this spell's name> for …”.

Immunity to a different spell, or to a group of spells (“all curses of death”, “your mind reading”), isn't read, and neither is a length in weeks.

A condition that applies only against one attack (“off-guard against the triggering attack”) blocks the spell. The module has no way to end it after that attack.

**You can Dismiss the spell.** A save spell with exactly this sentence lets the caster end every contribution of the cast from the Ongoing panel.

**Creature-dependent degree changes** (before the table):
- “Water creatures and plant creatures use the outcome one degree of success worse than the result of their saving throw.” This is checked from traits; also “Creatures with the fire or metal traits …”.
- “The target must attempt a Fortitude save; if used on a creature that has the water trait or a creature made primarily of liquid (such as many oozes), the creature uses the outcome for one degree of success worse than the result.” A creature with the trait is shifted automatically. For any other creature, the card asks the GM whether it fits the description.

**A basic save with no damage.** PF2e sometimes marks a save “basic” on a spell that deals no damage. When the item has no damage, the text never says “basic” or rolls inline damage, and it has its own Critical Failure row, the flag is ignored and the text's table decides the results.

**Curse floors:**
- “The target becomes sickened 1 and can't reduce its sickened condition below 1 while the curse remains.”
- Optionally “The curse can be lifted by …” and “Whenever the target is sickened and on the water at least a mile from shore, it is also Slowed 1.”
- The last one becomes a GM toggle on the curse Effect.

### A degree-of-success Effect after the table

Put one Spell Effect link after the degree table when its PF2e Effect picks its rules by degree. The Effect needs one ChoiceSet with a `rollOption` (for example `distracting-decoy`) offering `success`, `failure` and/or `critical-failure`. Every other rule must be predicated on `<rollOption>:<degree>`, or be unconditional. The module applies the Effect on each degree it offers and presets that degree, so PF2e doesn't ask. Each row must state exactly what the Effect gives for that degree:

- **A penalty to attacks:** “(As failure, but) the creature (also) takes a –2 circumstance penalty to attacks.” This must match a `FlatModifier` on `attack` or `attack-roll` with the same type and value. Add “while it's off-guard” only if the Effect also grants Off-Guard.
- **Rolling twice:** “The first time during the duration that the target attempts an attack roll or skill check, it must roll twice and use the worse result.” (or “Every time …”). This must match a `RollTwice` with `keep: lower` on attack rolls and skill checks. “Every time” needs `removeAfterRoll: false`.
- **A condition the Effect grants** (`GrantItem`: Off-Guard, Encumbered, Immobilized or Clumsy) must also be the row's own condition. The Effect carries it; the module doesn't apply it a second time.

- **A condition plus weakness:** “The target is Encumbered and has weakness 2 to electricity.” This must match a `Weakness` rule of that type whose value, at the cast rank, is that number. Rank arithmetic such as `1+@item.level` or `ceil(@item.level/2)*2` is read; anything reading the actor is refused.
- **“The spell can't be sustained.”** is accepted only in a row that ends “until the end of your next turn”.

The Effect's own duration must be one of:
- 1 round, ending at the start of a turn. The row must say “until the start of your next turn”, or the spell must last 1 round.
- The spell's own duration: its fixed duration, or a sustained spell's maximum. A row with no timing lasts as long as the spell (and ends with it if a Sustain is missed). A row saying “until the end of your next turn” lasts until then instead.

Any rule the row doesn't state, or a claim the rules don't give, blocks the spell.

**On a spell attack:** the Effect link can follow the attack sentence (“Attempt a spell attack roll against the target. @UUID[…]{Spell Effect: …}”) before a Critical Success / Success / Failure table. There the ChoiceSet offers `critical-success` and `success`, the hit rows. Rows may also say:
- “The target (gains the Immobilized condition and) takes a –10-foot circumstance penalty to its Speeds for 1 round.”: a `FlatModifier` on `all-speeds` of that type and value, with the named condition granted by the Effect.
- “It can attempt to Escape against your spell DC to remove the penalty (and the immobilized condition).”: a successful Escape against the caster's spell DC ends the whole Effect, through the usual Escape card. The sentence must name every condition the Effect grants.
- **Row damage with the Effect:** “The target takes full damage, is Off-Guard, and takes a –10-foot circumstance penalty to Speed.” The damage is the row's; the Effect must grant the condition and carry the land-Speed modifier.
- **Escape:** “It can attempt to [[/act escape]] against your spell DC.” with an Effect granting Immobilized. A successful Escape ends the whole Effect. If the Effect grants other conditions too, a **PF2e data** note says they end with it.
- **Delayed damage:** “If it doesn't Escape, the target takes an additional 2d6 bludgeoning damage when the spell ends.” must be the item's damage. It becomes a note with an Ongoing control, “<creature> didn't Escape before the spell ended”, that deals it once, heightened by “Heightened (+1) Increase the initial damage and additional damage by 2d6.”.
- “for 1 round” with a 1-round Effect.
- “Heightened (2nd) The effects last for 2 rounds.” (or “The duration increases to …”): the created Effect's duration from that rank.

**An Effect choosing a badge and a degree** (like Overstuff). The Effect's rules must be exactly:
- **One flag `ChoiceSet`:** its choices are labelled `PF2E.Check.Result.Degree.Check.<degree>`, with the value `{badge: 1–4, degree: "<that degree>"}`.
- **One `RollOption`:** `<flag>:{item|flags.system.rulesSelections.<flag>.degree}`.
- **One `GrantItem`:** Sickened, `onDeleteActions` `cascade`, with its badge overridden by `@item.flags.system.rulesSelections.<flag>.badge`.
- **Speed penalties:** `FlatModifier`s on `land-speed` or `all-speeds`, predicated only on `self:condition:sickened`.
- **Optionally one description addendum:** an `ItemAlteration` for one degree.
- **Duration:** unlimited.

The text must match those rules:
- Before the table: “A target sickened by this spell takes a –10-foot status penalty to its Speed until it's no longer sickened.”
- Each offered row: “The target is sickened N.” (N the badge).
- The addendum's row: “The target is Sickened 1, but if it spends an action to end the condition, it succeeds automatically.”

The module applies the Effect with that row's choice preset. The Effect carries the Sickened, so the module doesn't apply it a second time. When the Sickened ends, PF2e removes the Effect.

### A spell that waits for its trigger

A spell you set now whose save happens later, when a creature triggers it. It has a non-basic save, no area, a timed duration (minutes, hours, days) and a degree table. Before the table, write one of these pairs:

```html
<p>The first creature that uses a magical mental effect against you triggers the warding glyph, causing the spell to end. The warding glyph deals 4d8 mental damage to the triggering creature, which must attempt a Will save.</p>
```

or “When a creature <does something>, it takes 8d8 mental damage and is doomed, depending on the result of its Will save. The spell then ends.”

The damage in the sentence must be the spell's single damage entry. Also allowed before the table:
- “You can Sustain the spell to suppress …”, “You can Dismiss the spell.” and “You can choose up to N creatures when you cast this spell; if you do, those creatures can … without triggering the ward.” These are shown as notes for the GM.
- Both “You can only have one <name> active at a time.” and “If you cast the spell again, the newer casting supersedes the older.”, together. A new casting then ends your earlier one.
- One sentence of narration with no rules in it.

In a row, “You're unaffected by the triggering mental effect.” is a GM note for that result.

**A trigger any number of creatures can set off** (no damage entry): “If a creature attempts to attack you during the spell's duration, it must attempt a Will save.” (also “Whenever / Each time a creature …”), with the Duration `until the beginning of your next turn`. Each triggering creature saves, and the spell stays set until then. A row's “, the penalty applying to its attack roll” (only for an attack trigger) becomes a note: the condition applies before that attack.

**A trigger held on the spell's own target** (a basic save; Target `1 creature` or `1 enemy`; one damage entry):
- **Any number of times while sustained:** “The target takes 2 mental damage any time it uses a hostile action against the named creature, with a basic Will save.” The Duration must be sustained (for example 1 minute). The caster's choice comes first: “Name yourself or one of your allies.”
- **Once, on the target's next turn:** “If the creature attempts that action on its next turn, it must surmount your lock to do so, causing it to take 2d6 mental damage (with a basic Will save).” No Duration. The choice: “Choose "Strike," "Stride," "Cast a Spell," or a specific action you know the creature to have (such as …).” Optionally “The target is then temporarily immune for 1 minute.”
- One opening sentence of narration is allowed.

Target the creature and use **Set (waits for its trigger)**. The marker goes on that creature and lasts while sustained (a missed Sustain ends it) or until the end of its next turn. **Trigger <spell>** in Ongoing spells opens its basic save. The once-only form then ends and applies the temporary immunity.

**When cast:** the card's **Set (waits for its trigger)** button puts a marker Effect on the caster, tracked in **Ongoing spells** for the duration. When the trigger happens, target the triggering creature and use **Trigger <spell>**. An ordinary save card opens for it, and the spell ends. The GM decides whether the trigger happened.

**A caster Effect whose Sustain ends it with a save.** A basic save item with one untyped damage entry, no Target, a fixed duration, one linked Effect, and:
- “Choose fire, force, mental, or spirit damage when you Cast the Spell.”, “For the duration of the spell, your Strikes with weapons or unarmed attacks deal 1 additional damage of the chosen type, as …”, and optionally “You can Sustain the spell to change the damage type.”;
- “In addition, you can Sustain the spell to have the dragons fly off to bombard a creature within 60 feet. That creature takes 2d4 damage of the chosen type (basic Reflex save). Once the dragons have been used in this way, they wink out of existence and the spell ends.”

The Effect must have:
- a damage-type toggle offering exactly the listed types;
- a `strike-damage` modifier of the stated amount at the cast rank, of that type;
- a `spell-damage` type override.

Casting it puts PF2e's Effect on the caster as the marker (the caster picks the type with its toggle). **Trigger** (with the creature targeted) opens the basic save card with the Effect's chosen type and ends the spell.

**A shield that explodes on its Shield Block.** A basic save item, no Target, lasting until the start of your next turn, one linked Effect, and:
- “This counts as using the Raise a Shield action, giving you a +1 circumstance bonus to AC until the start of your next turn, but it doesn't require a hand to use.”, “You can Shield Block with the glass shield.”, “It has Hardness 2.”, and optionally “You can use the spell's reaction to reduce damage from any spell or magical effect …”;
- “When you Shield Block, the shield explodes in a shower of glass. If creature that broke it is within 5 feet, the shards deal 1d4 piercing damage to that creature with a basic Reflex save. After you use Shield Block, the spell ends and you can't cast it again for 10 minutes.”;
- Heightened entries “Heightened (3rd) The shield has Hardness 4, and the damage increases to 3d4.” (each matching the item's damage at that rank).

The Effect must hold exactly:
- the raised shield (that AC);
- its Hardness at every stated rank;
- the shield roll option.

It must last 1 round to a turn's start. Casting it puts PF2e's Effect on the caster as the marker, with the range and cooldown as notes. **Trigger** (with the creature that broke the shield targeted) opens the basic save card and ends the spell.

**A sustained basic save with the caster's note.** A basic save, sustained with a fixed maximum, whose only other sentences are degree riders and:
- one sentence starting “For the spell's duration,” (“For the spell's duration, an ally who's adjacent to you can Interact and be instantly teleported to an unoccupied space in the spell's area, as long as they don't travel more than 60 feet.”) with no damage, save, bonus, penalty, Hit Points, healing, condition, immunity, resistance, weakness, Strike or attack in it;
- optionally, right after it, “This effect has the teleportation trait.” (any one trait).

The save is resolved once. At Finalize the caster gets a note Effect with those sentences for the spell's maximum, marked as sustained, with each Heightened paragraph that applies at the cast rank. A rider's “the duration of the dazzled condition on a failed save increases by 1 round” heightens that condition's rounds. Riders may say “is additionally Dazzled”.

**Initial and persistent damage by row, and a caster's bonus while it lasts.** A degree save (not basic) with one item damage entry and:
- **Narration:** a delivery narration, or a plain “You …” sentence with nothing mechanical in it, but only before “This deals …”.
- **Damage:** “This deals 1d4 mental damage and @Damage[(@item.level)d4[persistent,mental]] damage; the target must attempt a Will save.” The older “The target takes … and @Damage[…], depending on its … save.” also works. The persistent damage is `(@item.level)dN` (one die per rank, Heightened (+1)) or `(ceil(@item.level/N))dM`.
- **Rows:** “The target is unaffected.”, “… takes half (initial) damage and no persistent damage.”, “… takes full initial and persistent damage.”, “… takes double initial and persistent damage.” A bare Spell Effect link after a row belongs to the Effect, not the row.
- **Heightening:** “Heightened (+1) The initial damage increases by 1d4 and the persistent damage increases by 1d4.” (or the typed form).

Optionally, one more sentence: “As long as the target is taking persistent damage from this spell, you gain a +1 status bonus to attack rolls and skill checks against the target.” This bonus is +1 to +4 (status or circumstance) to attack rolls, skill checks, damage rolls, saving throws or Perception checks. It needs the one linked Effect to hold exactly:
- a TokenMark;
- one FlatModifier with that bonus, predicated on `target:condition:persistent-damage:<type>` and `target:mark:<slug>`.

At Finalize, PF2e's Effect goes on the caster for each target that took the persistent damage, with its TokenMark bound to that target's token. The caster needs a token. PF2e's Effect has no end of its own, and the card says to remove it once the persistent damage is gone.

**Persistent damage that ends with a row's condition.** A degree save (not basic) with one item damage entry and:
- “<narration>, dealing 2d4 mental damage and @Damage[(@item.level)d4[persistent,mental]] damage.” (the narration with nothing mechanical in it) and “The target must attempt a Will save.”;
- the rows “The target is unaffected.”, “The target takes full initial damage but no persistent damage(, and the spell ends immediately).”, “The target takes full initial and persistent damage, and the target is @UUID[…]{Sickened 1}. If the target recovers from being Sickened, the persistent damage ends and the spell ends.” and “As failure, but the target is @UUID[…]{Sickened 2}.” (the critical failure repeats the failure's damage);
- “Heightened (+1) The damage increases by 2d4 and the persistent damage by 1d4.”

At Finalize, the persistent condition the failing rows create is tagged with the condition (any condition the rows grant, named in the “recovers from being …” sentence). When the creature no longer has that condition, the lead GM's client removes it, the same way the other direction (a condition lasting as long as persistent damage) is handled.

**A save only in a situation the GM judges.** A degree save (not basic) with an area, one item damage entry and the save sentence “If the rocket explodes in an enclosed space smaller than the full size of the burst, each creature in the area takes 1d10 sonic damage depending on the result of its Reflex save.” The sentence takes the form “If the <thing> explodes/bursts/detonates/lands/strikes …, each creature in the area takes <item damage> … its <save> save.”

The card asks the GM once: “Does this hold: …? If not, no creature is affected.” Finalize waits for the answer, and “no” excludes every target. A sentence restricting where the projectile goes (“You can't change the direction or distance of the rocket …”) is a GM note on the card, but only when this gate exists and the sentence names nothing mechanical.

**A note's continuation, and interval heightened durations.** A row note (behaviour, perception or what the caster senses) also carries the clauses right after it that only continue it:
- “This is enough to track the creature, but not pinpoint their exact square (…).”
- the caster's limit on active instances: “You can set a number of zenith stars equal to your Wisdom modifier; if you exceed this number, your oldest zenith star is automatically Dismissed.” That “Dismissed” isn't read as a Dismiss rule.

An “As failure, but …” row inherits the named row's notes, along with the instructions those notes carry.

“Heightened (+1) The duration increases by 1 day.” counts only for a spell with a fixed duration in that unit. It becomes one heightened duration per rank (2 days at 2nd rank, 3 at 3rd, …), which the spell's notes and Effects then use.

**A terrain area whose save is only when cast, with a Speed-and-condition Effect.** A degree save (not basic) with a placed area:
- “The area becomes difficult terrain.”
- “Creatures in the area when you Cast this Spell must attempt a Reflex saving throw.”

This is now a lingering area: the region carries PF2e's difficult terrain for the spell's duration, and there are no later saves.

The rows may use one linked Effect with exactly:
- a ChoiceSet by degree (failure / critical failure, negative multiples of 5);
- one FlatModifier reading it on the listed Speeds;
- one GrantItem condition.

The rows must say so:
- **Failure:** optionally a narration sentence, then “The creature takes a –10-foot circumstance penalty to its Speeds (except for its swim Speed, if any) and becomes @UUID[…]{Off-Guard}.” The Speeds must be the four non-swim Speeds, or all five without the exception.
- **Critical Failure:** “As failure, but the penalty to Speeds (except Swim speed) is -15 feet.”

With “These effects last until the creature leaves the area or until the end of its next turn, whichever comes first.”, the Effect is removed when the creature leaves the area. PF2e's own one-round duration applies otherwise, and the card's data note says so. PF2e's heightened area (“Heightened (3rd) … the area increases to a 20-foot burst”) is the one placed at the cast rank.

**A note on a thing, and a note's heightened counteract.** A spell note whose Target names a thing rather than a creature (“1 cubic foot of clean food or water”, water, liquid, drink, cubic feet, as for items and objects) targets no creature. The reminder goes on the caster.

A counteract check only in a fixed-rank Heightened entry (“Heightened (2nd) You can target an alchemical elixir with this spell, attempting a counteract check against it.”) doesn't stop the note. The note serves the ranks below that entry, and a cast at that rank or above is refused (“Resolve it by hand”). A counteract check in the base text, or in a (+N) entry, still keeps the spell off the note route.

**A compact save with a floor and a Dismiss that heals.** A compact save sentence (“The target becomes Frightened 1 if it fails a Will save (or Frightened 2 on a critical failure).”) may be followed by:
- “This condition can't be reduced below 1 while the spell is active and the target can hear you.” It joins the failure rows as a floor for as long as the (sustained) spell lasts. Only “while the target can hear you” is accepted as the qualifier, and it's the GM's: the floor Effect says to delete it while the target can't hear;
- “You can Dismiss the spell as a reaction when an ally …, restoring @Damage[(ceil(@item.level/2))d4[healing]] Hit Points to that ally.” For a per-interval formula, the Heightened entry must say “The number of Hit Points restored when you Dismiss the spell increases by 1dN.” in step. The ongoing record's control then Dismisses the spell as a reaction, rolls the healing at the cast rank, heals the targeted ally and ends the spell.

**Text damage with a type choice and a conditional persistent rider.** A basic save whose item has no damage entry, with “The gaze deals 1d4 damage (basic Fortitude save). It deals your choice of cold damage or fire damage and gains the appropriate trait. If you already dealt damage to the creature earlier this turn, it also takes 1 persistent damage of the gaze's type (@Damage[(@item.rank)[cold,persistent]]{…} or @Damage[(@item.rank)[fire,persistent]]{…}).” and “Heightened (+1) The initial damage increases by 1d4 and persistent damage by 1.”:
- The card asks for the type, and asks whether the condition holds. Finalize waits for both.
- A yes adds the rank's persistent damage of that type to the roll; the save scales it with the rest.
- The persistent amount must equal the spell's rank and rise by 1 a rank, and both @Damage links must be the two types offered.

The Target “one creature you can see” is a creature the caster targets.

**A save that negates, with a stated weakness Effect.** A degree save with no table, whose sentences are:
- narration, then “If your target has Hardness, … decreasing the Hardness by 5, to a minimum of 0.”;
- “If the target lacks Hardness, it gains weakness 3 to physical damage.”;
- “A target with a Fortitude modifier can attempt a Fortitude saving throw, negating the effect on a success.”;
- optionally the Effect's link.

The rows become: unaffected on a success; on a failure or critical failure, “The target gains weakness 3 to physical damage.” That is PF2e's Effect, whose one Weakness rule must be worth the stated value at the spell's rank. The Hardness decrease (and its Heightened step) is a GM reminder: exclude a creature with Hardness and lower it yourself.

The Target “1 creature, unattended object, or hazard or structure made of stone or earth” is a creature the GM confirms is made of that.

**An aura that grows on an optional Sustain.** A degree save with an emanation, narration, and:
- “Enemies in the area must succeed at a Will save or take a –1 status penalty to attack rolls (or AC) as long as they are in the area.”
- “Once per round on subsequent turns, you can Sustain the spell to increase the emanation's radius by 10 feet and force enemies in the area that weren't yet affected to attempt another (or a) saving throw.”
- Optionally “… can counteract Bless.” (a spell link or a name).
- One Spell Effect link.

This becomes a lingering area around the caster for the spell's duration:
- **When cast:** the enemies inside save.
- **On each optional Sustain** (once a round, the Ongoing spells control): the radius grows, then the enemies inside without this cast's penalty save.
- **Failure or critical failure:** PF2e's Effect, which must be exactly that FlatModifier (attack rolls: `attack`; AC: `ac`) lasting unlimited or the spell's duration. The area removes it when the creature leaves.
- **Counteract sentence:** a card reminder with a Counteract button that rolls the caster's counteract check.

**Text damage whose type and critical extra are an option the caster picks.** A basic save whose item has no damage entry, with:
- narration, then “All creatures in the target area take 2d4 damage.”;
- “The type of damage depends on the type of plant you choose to grow.”, “On a critical failure, targets experience additional effects, also depending on what you choose to grow.” and “The type of plant and its effects are chosen when you Cast the Spell.”;
- a list, each entry “<strong>Name</strong> <Type> damage, and <extra> on a critical failure.”, where the extra is:
  - @UUID[…]{Condition} for N rounds;
  - “the affected creatures fall @UUID[…]{Prone}”;
  - @Damage[(@item.level)[bleed]] damage, which needs “Heightened (+1) The damage increases by 1dN, and the persistent bleed damage from <that option> increases by 1.”

The card asks for the option. The damage rolls as that option's type, and a critical failure applies only that option's extra.

**A lodged projectile that explodes.** A spell attack with a written table (critical success, success) and:
- “The bolt deals 1d8 piercing damage and lodges in the target.”;
- “At the end of the target's next turn, the bolt shatters, releasing … that deals @Damage[(@item.rank)d12[cold]|options:area-damage] damage to the target and all adjacent creatures.”;
- “The bolt can be removed with an Interact action, which causes it to melt harmlessly without detonating.”;
- the rows “The initial bolt deals full damage and is especially well anchored, taking 2 Interact actions to remove. The bolt's explosion deals double damage.” and “The bolt and its explosion deal full damage.”;
- a Heightened (+1) entry that includes “the explosion damage increases by 1d12”.

Both hits deal the bolt's full damage. The target gets a “Lodged bolt” note until the end of its next turn, saying how many Interact actions remove it. The note's Ongoing control deals the explosion (the rank's dice, doubled after a critical hit) to it and to the adjacent creatures the GM targets, then ends the note.

**Void damage that affects constructs.** A spell attack whose damage entries are all void may say “Unlike normal void damage, the void damage from <spell> damages objects, constructs, and the like by eroding away their substance.”. For a target with the construct trait and PF2e's void immunity, the module first adds an Effect with PF2e's `Immunity` rule in `remove` mode for void. The Effect stays only while the spell's persistent void damage does, so later persistent damage also applies. Undead are unchanged, since the text names objects and constructs only.

In the same spell, two things are GM reminders:
- “If a creature uses an item to block <spell>, such as with the Shield Block reaction, the item is automatically affected, but the creature doesn't take damage (…).”;
- a hit row's “If you target an object, lower its Hardness by N for 1 minute.” (with its Heightened step).

“Your touch deals 1d12 void damage plus 1d4 persistent void damage.” and “Your touch deals double damage (both initial and persistent).” are read like “The ray deals …”.

**A note that names what it protects against.** In a note spell, a condition link that only names a protection (“aiding them against being @UUID[…]{Immobilized}”, “any effect that would make them grappled, immobilized, or @UUID[…]{Restrained}”) is a mention. No condition is applied, and the note carries the text.

**A gust along a line.** A degree save with a line area, lasting “until the start of your next turn”, whose text is:
- “A … wind issues forth from your palm, blowing from the point where you are when you Cast the Spell to the line's opposite end.”;
- “The wind extinguishes small non-magical fires, disperses fog and mist, blows objects of light Bulk or less around, and pushes larger objects.”;
- “<Size> or smaller creatures in the area must attempt a Fortitude save. <Size> or smaller creatures that later move into the gust must attempt the save on entering.”;
- the rows “The creature is unaffected.”, “The creature can't move against the wind.”, “The creature is knocked Prone. If it was flying, it takes the effects of critical failure instead.” and “The creature is pushed 30 feet in the wind's direction, knocked prone, and takes 2d6 bludgeoning damage.” (the item's damage).

This becomes a lingering line:
- **Who saves:** creatures up to that size, when it's cast and on entering. It ends when the caster's turn starts.
- **Success:** a “Can't move against the wind” note until then.
- **Failure:** Prone. The card asks the GM whether the creature was flying; if so, the failure counts as a critical failure.
- **Critical failure:** the damage, a push of that distance away from the caster (the wind blows from the caster's square), and Prone.
- **The wind's effect on fires, fog and objects:** a GM reminder.

A lingering degree save's trigger may omit the damage when a row itself says “The creature takes full (half, double) damage”.

**An area that saves when cast, then marks creatures of a trait inside.** A basic save with a burst, a fixed duration and several damage entries, whose text is:
- narration, then “Each <trait> creature in the area takes 1d6 vitality damage and 1d4 spirit damage when you Cast the Spell, with a basic Fortitude save.” (every entry named once);
- “After that, <trait> creatures have weakness 1 to vitality damage and your necromancy spells while in the area.”;
- optionally “This spell also automatically attempts to counteract any attempt to raise undead in the area (…).” and “If you Cast this Spell again, any previous <spell> you had cast ends.”;
- one Spell Effect link whose only rule is that Weakness, at the spell's rank.

This becomes a lingering area:
- **When cast:** creatures of that trait inside save; others are unaffected.
- **While inside:** creatures of that trait have PF2e's Effect. A creature entering gets it, and one leaving loses it (at the next turn change).
- **Necromancy spells:** the weakness to them is a data note, since PF2e's Effect doesn't give it.
- **Raising undead:** a Counteract reminder.

**A sustained area chosen anew each Sustain, with persistent damage a save negates.** A sustained basic save with a burst (or cylinder), up to two narration sentences, and exactly:
- “When you Cast this Spell and the first time you Sustain it each round thereafter, choose an area within range.”;
- “Each creature in the area takes 1d4 fire damage, 1d4 bludgeoning damage, and @Damage[(ceil(@item.rank/2))[persistent,fire]] damage (the persistent fire damage is negated on a successful save).” (every entry named once);
- a Heightened (+2) entry that includes “the persistent fire damage increases by 1”.

This becomes a sustained lingering area. Creatures in it save when it's cast, and again on each Sustain after the GM moves the area to its new spot (the card's note says so). The entries follow the basic save. The persistent damage applies only on a failure, and doubles on a critical failure.

**A sustained emanation that heals on a pulse, with an Effect once it ends.** A sustained emanation, no save, one healing entry, one narration sentence (no rules in it), and exactly:
- “When you cast this spell and the first time you Sustain it on each subsequent round, you generate a pulse of … that heals each creature within the emanation for 1d4 Hit Points.” (the item's healing entry);
- “The calm of this effect lingers; once this spell ends, any creature that has been affected by its healing gains a +1 circumstance bonus to saves against emotion effects for 10 minutes but does not receive any healing from additional castings of the spell while the bonus persists.”, with one linked Effect whose only rule is that bonus (to saving throws, for effects of that trait) for that long;
- a Heightened (+N) entry raising the pulse by the item's own heightening dice.

When cast, and on the first Sustain each round, one healing roll heals each creature within the emanation, the caster included. A creature still holding PF2e's Effect (from an earlier casting) isn't healed. A second Sustain in the same round doesn't pulse. When the spell ends (Dismissed, a missed Sustain or its duration), each creature it healed gets PF2e's Effect.

**A lingering area that loosens terrain and counteracts what makes it.** A lingering degree-save area (a save when cast and at the end of a turn in it), plus exactly these sentences in order:
- “For the duration of the spell, any plant-based difficult terrain smaller than a tree becomes loose, allowing each 5-foot square of it to be cleared with a single Interact action.”;
- “In addition, *this spell* attempts to counteract @UUID[…]{Entangling Flora} and other effects that create or manipulate plant-based terrain in its area.” (the same kind of terrain);
- “Successfully counteracting an effect removes only the portion of its area that overlaps with *this spell's* area.”;
- “After one such attempt, the effect is temporarily immune to *this spell's* counteract for 24 hours.”

The terrain is a GM reminder on the card. The counteract is the card's Counteract control against the named spell; its text keeps the overlap and the 24-hour immunity. A Heightened entry that only lets the caster move the burst on Sustain becomes a GM note (move the area's region). An “As the 3rd-rank version, except the range is … and the area is …” entry must match the item's own heightening data.

**A condition “for its next action”.** A condition followed directly by “for its next action” lasts until the creature takes its next action. PF2e doesn't track actions, so Ongoing spells shows a “took its next action” control that ends that Effect only.

**An aura that makes a failing creature roll its first attack twice.** A sustained emanation with a Will (or other) save and one damage entry. It has narration without rules, and exactly:
- “Each creature that starts their turn within the area of this spell must succeed at a Will save or roll twice on their first attack roll that round and take the lower result.”;
- “If an attack roll modified in this way results in a failure, the creature that rolled the failed attack takes 1d6 void damage.” (the item's damage entry);
- one linked Effect whose only rule is RollTwice (keep lower, attacks, removed after the roll), lasting no longer than the end of the creature's turn.

This is a lingering aura:
- A creature starting its turn inside saves. A failure or critical failure gives it PF2e's Effect.
- While that Effect lasts (until the end of the creature's turn), Ongoing spells offers two controls: “… attack roll (rolled twice) failed”, which deals the damage heightened to the cast rank with PF2e's IWR, and “… didn't fail”.

**A Strike whose weapon breaks and pushes the creatures next to you.** No area and no damage entry, narration without rules, and exactly:
- “Make a melee Strike with your improvised weapon.”;
- “The weapon then breaks, and each creature adjacent to you must succeed at a Fortitude saving throw against your spell DC or be pushed 5 feet away from you (10 feet on a critical failure).”;
- “You can Stride after the target of your Strike if they are pushed but you must move the same distance and in the same direction.”;
- “If the item has a Hardness greater than your level, or if it's an artifact, cursed item, or other item that's difficult to break or destroy, it doesn't break and adjacent creatures don't need to attempt Fortitude saves.”

The card tells the caster to make the Strike with PF2e. Creatures in a 5-foot emanation save; a failure pushes 5 feet and a critical failure 10, as GM notes like every push. Before finalizing, the GM answers whether the weapon broke; “no” leaves every creature unaffected. The breaking and the caster's follow-up Stride are reminders.

**A burning burst that is hazardous terrain and grows on each Sustain.** A sustained burst with a Reflex save and one flat damage entry. It has narration without rules, and exactly:
- “The area becomes hazardous terrain.”;
- “A creature that moves on the ground through the area takes 1 fire damage for every square of that area it moves into.” (the damage entry);
- “A creature that ends its turn in the area must succeed at a Reflex save or take @Damage[1[persistent,fire]] damage.”;
- “Each time you sustain this spell, the radius of the burst increases by 5 feet.”;
- optionally “Heightened (+2) Increase the damage and persistent damage by 1.”, matching the item's heightening.

This is a lingering area:
- A creature ending its turn inside saves. A failure or critical failure takes the persistent fire, raised by 1 per 2 ranks.
- Each Sustain widens the placed region by 5 feet.
- A GM control asks how many squares a targeted creature moved into. Each square deals the per-square damage separately, with PF2e's IWR on each.

**An area that saves when cast and as each round begins.** In a lingering degree-save area, the two sentences “When the spell is cast and at the beginning of each round, <narration>.” and “Creatures in the area must attempt a Fortitude save.” read as one trigger. Creatures inside save when it's cast, and again whenever a combat round begins, including combat starting. The area's “The area becomes difficult terrain.” is PF2e's movement cost on its region.

**A condition ended by 1 action outside the area.** “If the creature moves to outside area, they can spend 1 action to rub their eyes, removing the dazzled condition.” after that condition's row gives the Effect an Ongoing-spells control: “(outside the area): spend 1 action to end …”. The timer still applies, whichever comes first.

**Creatures of a kind the GM judges get a bonus instead of saving.** In a degree save: “X are bolstered by … and gain a +1 status bonus to Will saving throws and attack rolls for 1 minute, while all other creatures must attempt a Will saving throw.” with one linked Effect whose only rule is exactly that bonus for that long. The card asks the GM, for each target, whether it's one of X:
- **Yes:** no save, and PF2e's Effect at Finalize.
- **No:** it saves.

Finalize waits for every answer.

**Immunity on a critical success only.** A critical-success row of exactly “The creature is unaffected and temporarily immune for 1 hour.” (no other row mentions immunity) gives the spell's temporary immunity to critical successes only.

**A floor while another of the row's conditions lasts.** “It can't reduce the value of its frightened condition below 1 as long as it remains stupefied by this spell.” in a row that grants both, with Stupefied on a timer. A floor Effect keeps Frightened at 1 or more. It is linked to the row's Stupefied Effect: Ongoing spells ends it when Stupefied ends, and it has Stupefied's timer too. The row's Frightened keeps PF2e's own lifetime.

**A thrall commanded to Stride and Strike with extra damage.** Target “1 of your thralls”, a range in feet, no save and no damage entry. Narration without rules, then exactly “You command the target thrall to Stride and then make a Strike that deals an additional 1d6 damage.” and “You can destroy the thrall as part of this Strike to add a status bonus to the Strike's damage equal to this spell's rank.”. Fixed-rank Heightened entries of the form “The additional damage increases to 2d6.” may follow.

Cast with the thrall targeted, within range. The caster answers whether the thrall is destroyed by this Strike. A PF2e Effect on the thrall then adds the dice for the rank (of the Strike's own damage type) to its next Strike damage roll, plus a status bonus equal to the rank when the thrall is destroyed. The Effect is removed after that damage roll. The GM moves the thrall, rolls its Strike, and removes a destroyed thrall.

**A drain that heals someone the caster picks.** A degree save through a thrall (“One creature within 30 feet of the targeted thrall must attempt a Fortitude saving throw. The targeted thrall is then destroyed.”):
- **Critical success:** unaffected.
- **Success:** exactly “The creature is Drained 1 but recovers after 1 minute. You or an ally of your choice within 30 feet of the thrall regains Hit Points equal to double the amount the creature lost. A creature can be healed by this spell only once every 10 minutes.”
- **Failure / critical failure:** “As success, but Drained 2 / 3.”

Each row's Drained lasts the stated time. After Finalize, the caster targets itself or an ally within that distance of the thrall. The creature regains double the Hit Points the save's creature lost (PF2e lowers them for Drained at once), and is marked for 10 minutes. A second casting can't heal it while the mark lasts.

**Untyped dice damage in a save's preamble** (“You take 2d6 damage.”) now counts as an unread rule.

**A spell attack that marks the target for your weapon damage.** An attack spell targeting “your hunted prey”:
- **Narration**, without rules.
- **The attack:** “Make a spell attack against the target. On a hit, you deal 2d4 spirit damage and the target is marked by … that only you can see.”
- **The bonus:** “For the duration of your spell, the marked target takes an additional +2 damage from all your weapon or unarmed attacks.”
- **Invisibility:** “Invisible targets marked by your … are Concealed to you, rather than Undetected.”
- **The Dismiss:** “You can Dismiss the spell on your turn if your last action dealt damage to the target with a weapon or unarmed attack, instantly dealing an additional @Damage[(ceil(@item.rank/2)+1)d6[spirit]] damage to it.”
- **The link and heightening:** one linked Effect, and “Heightened (+2) The initial damage increases by 2d4, the additional damage you deal increases by 1, and the damage dealt when the spell is Dismissed increases by 1d6.”

How it resolves:
- **Target:** the GM confirms it's the hunted prey.
- **The attack:** the ordinary spell attack, with double damage on a critical hit (PF2e's rule).
- **On a hit:** PF2e's Effect goes on the caster, marking the target's token. It must be exactly a TokenMark and a Strike-damage bonus against the mark, worth +2 and +1 per 2 ranks.
- **Invisibility:** a GM note.
- **Dismiss:** Ongoing spells' control asks the GM to confirm the condition. It then deals the payoff to the marked creature and ends the mark.

**A melee spell attack whose form sets the damage type and the extra.** No damage entry, target 1 creature. Narration without rules, then exactly “Make a melee spell attack roll. On a hit, the target takes 2d6 damage; the type of damage dealt and any additional effect depends on the form you choose. On a critical hit, double the damage.”, and a list of forms. Each form is “The limb deals TYPE damage(,) and …” with one of:
- “the target takes a –10-foot status penalty to its Speeds until the start of your next turn” and a linked Effect (only that penalty, 1 round);
- “you can Reposition the target up to 10 feet”;
- “steam clings to the target, making all creatures Concealed to them until the start of your next turn or they perform an Interact action to wave the steam away”.

A form may also say “This spell gains the TYPE trait.” A Heightened (+N) entry of the same die may follow.

The caster picks the form on the card. The attack deals the text's damage (a data note says so), of that form's type, doubled on a critical hit. On a hit, the form's extra applies:
- **Speed penalty:** PF2e's Effect on the target.
- **Reposition:** a reminder (the module doesn't move the target).
- **Steam:** a note Effect on the target until the caster's next turn; the GM deletes it if the creature waves the steam away.

**A pact held on the target (a degree save on each hostile action).** A sustained degree save on 1 creature, with exactly these sentences:
- “If the target accepts and doesn't take hostile actions against you and your allies during the hex's duration, you take a –1 status penalty to Deception checks to Lie to them.”
- “If they refuse and take a hostile action against you or an ally during the hex's duration, they must first attempt a Will save.”
- “If they accepted the offer and then take a hostile action against you or an ally during the hex's duration, they must first attempt a Will save and treat the result as one category worse.”
- “Regardless of the outcome, the target is then temporarily immune for 1 minute.”

The rows: failure “takes 2d4 mental damage and a –1 status penalty to attack and damage rolls against you and your allies for the hex's duration”; critical failure “As failure, but the penalty is –2.”; one linked flag Effect.

How it resolves:
- **Casting** puts the waiting marker on the target.
- **Each hostile action** is an Ongoing control that opens the target's Will save. The card asks the GM whether it had accepted the pact; yes makes the result one degree worse.
- **Failure / critical failure:** the item's damage, and PF2e's Effect preset to −1 / −2. PF2e's Effect has no “against you and your allies” and lasts 1 minute from the save; a data note says so.
- **After the save:** the target is immune for 1 minute.
- **Deception:** the caster's penalty is a note on the marker.

**A save whose critical failure weakens creatures of a trait.** A degree save with “If the target is a metal object, reduce its Hardness by an amount equal to the damage dealt until the end of your next turn.” before the table, and a critical failure of exactly “The target takes double damage, and if it's a metal creature, it gains weakness 2 to physical damage until the end of your next turn.” with one linked Effect (that weakness, 1 round ending at turn end). A Heightened entry may raise the weakness; the Effect's value must rise by the same amount per rank.

On a critical failure, the damage doubles, and PF2e's Effect goes only on a creature with that trait (by PF2e's traits); others get a card note. The metal object's Hardness is a GM reminder. The Target “1 creature or unattended metal object” accepts any creature; objects are the GM's.

**Unlinked condition names in a save's preamble** (“The target is also Slowed 1.”) now count as an unread rule.

**An illusion that lures creatures near its area.** A sustained degree save with exactly these sentences:
- “Each creature within 20 feet of the area that could be enticed by material wealth must attempt a Will saving throw.”
- “A creature that enters the area automatically disbelieves the illusion, and disbelieving the illusion ends any Fascinated condition imposed by the spell.”
- “As long as you Sustain the Spell, other creatures react to the treasure like they would any other illusion, but they are not at risk of becoming Fascinated.”

The rows grant only Fascinated.

How it resolves:
- **Targets:** the caster targets the creatures, and the GM confirms each one (within 20 feet, and could be enticed).
- **Success:** “Fascinated … until it has completed its first action on its next turn” lasts until Ongoing spells' “completed its first action this turn” control ends it.
- **Failure:** Fascinated while the spell is sustained.
- **Disbelief and the Sustain's display:** card notes.

**Swapped appearances.** Target “you and 1 other humanoid”. A degree save with:
- **Preamble:** narration, “You trade appearances with the target, with the effects depending on the result of the target's Will saving throw.”, and “Willing and Unconscious targets automatically critically fail this saving throw.”
- **Rows:** success “You take on the target's appearance, and they take yours. This has the same effects as a 1st-rank Illusory Disguise spell, except that the target can't Dismiss the disguise. The duration is 1 minute or until Dismissed.”; failure “As success, but the duration is 1 hour or until Dismissed.”; critical failure “As success, but the duration is 24 hours.”

How it resolves:
- **Target:** must have the humanoid trait.
- **Each row:** PF2e's Illusory Disguise Effect goes on the target and on the caster, lasting the row's time. It must hold only its Impersonate bonuses.
- **Dismiss:** the caster can Dismiss the cast, which ends both Effects.
- **Willing or unconscious targets:** a GM reminder to set critical failure.

**A spell attack whose effect depends on the target's kind.** “The effect depends on whether the target is a living creature, undead creature, or inanimate corpse. A creature or corpse that lacks flesh, muscle, and internal organs is immune to this spell.”, with one paragraph each:
- **Living Creature** and **Undead Creature:** “Make a spell attack roll. On a hit, the target takes 2d6 slashing damage. On a critical hit, double the damage, and the target also …”, plus one narration sentence about the remains.
- **Inanimate Corpse:** narration.

How it resolves:
- **Both creature paragraphs** are the ordinary attack.
- **Living critical hit:** 1d4 persistent bleed (+1d4 a rank), as the Heightened entry says.
- **Undead critical hit:** its condition, for its time. A creature with the undead trait uses the undead rows.
- **Flesh:** the GM confirms each target has it.
- **Corpses:** a GM note.

**Two squares of opposite energy.** An Area paragraph “two adjacent 5-foot squares” (the item's square), then:
- “Creatures in either area take 4d4 damage with a basic Fortitude save.” (the untyped damage entry);
- “Choose one of the squares to steal heat, dealing cold damage, and the other to concentrate the stolen heat, dealing fire damage.”;
- the failure rider “… Clumsy 1 … if it's in the area of stolen heat or Enfeebled 1 … if it's in the area of concentrated heat; these conditions last until the start of your next turn.”;
- “If a creature is large enough to be in both squares, you choose only one of the areas for it to attempt its save against; it's unaffected by the other area.”

Each square becomes an ordinary basic save with its rider. The card asks the GM which square each creature is in, and Finalize waits for the answers. The cast's one roll is cold, and swapped to fire for a creature in the fire square; a failure applies that square's condition.

**A warning held on the target.** A sustained degree save on 1 creature, no damage entry:
- **The warning:** “The target feels …, warning it to keep away from a creature you designate that's within 30 feet of you when you Cast this Spell (which can include yourself).”
- **The trigger:** “Once per round, if the target moves closer to the designated creature, it must attempt a Will save or take @Damage[(@item.rank)d4[piercing]] or @Damage[(@item.rank)d4[sonic]] damage.”
- **Rows:** unaffected / half / full. The critical failure is both types (the same dice) plus “if it attempts an attack roll or hostile skill check this round, it takes a –2 status penalty to the roll.”, with one linked Effect.
- **Heightening:** “The damage increases by 1d4, or by 2d4 on a critical failure (…)” may follow.

How it resolves:
- **Casting** puts the waiting marker on the target, with a note about the designated creature and the once-a-round limit.
- **Each move closer** is an Ongoing control that opens the target's save. The caster picks the damage type on the card; the damage is the text's `(rank)d4` (a data note says so).
- **Critical failure:** both types, and PF2e's Effect. That Effect is a −2 on its next attack roll or skill check this round (any skill check, not only hostile ones; a data note says so).

**A caster Effect that grants a Strike, with a basic save called on each Cast or Sustain.** A sustained basic save with no Target:
- **Narration**, then “You gain a fangs unarmed attack that deals 1d6 piercing damage and has the agile, finesse, and versatile poison traits.” and “The first time you Cast or Sustain this spell each round, you can perform one of the following as a free action.”
- **A named option** (Serpentine Advice).
- **A named action** with Requirements and an Effect: “… at the required creature, dealing 2d4 poison damage (basic Fortitude save).”
- **One linked Effect.** It must be exactly that Strike: damage and traits, sustained, 1 minute.

How it resolves:
- **Casting** puts PF2e's Effect on the caster. It is the waiting marker, and the Ongoing record ends on a missed Sustain.
- **The named action** is the Trigger control, which opens the basic save on the targeted creature. It can be used any number of times while the spell lasts; the once-a-round limit and the requirement are the GM's.
- **The other option** is a note on the Effect.

**Notes by user decision (2026-09-28).**
- **Magical darkness overcoming light:** the sentence “This is a form of magical darkness and can therefore overcome non-magical light or attempt to counteract magical light.” no longer keeps a spell off the note route. The lighting is the GM's, and the note keeps the sentence (Cloak of Shadow).
- **Number-free Hit Points:** a sentence mentioning Hit Points without a number and without anything gained or lost (“do not reduce Hit Points”) is no longer a number an Effect must carry (Delay Consequence; also Bilocation).
- **Reaction targets:** “the triggering creature or object” is the note's target.
- **Auras:** a spell linking PF2e's “Aura: X” and its “Spell Effect: X” takes the Effect + note route. The aura goes on the caster, and the note says to apply the Spell Effect to each creature the aura affects (Manifest Will).

**A spell whose Sustain makes its attack.**
- **Dancing Blade:** an animated weapon Strikes when cast and on each Sustain (or Changes Partners), “using your spell attack modifier … 3d6 damage, of a type determined by the weapon”.
- **Spirit Object:** an animated object Strikes when commanded on a Sustain, “Make a melee spell attack roll … 2d4 damage … bludgeoning, piercing, or slashing … as appropriate for the object”.

Each is an ordinary spell attack of the text's damage (heightened as its Heightened entry says; a data note says the damage is the text's):
- **Damage type:** the caster picks bludgeoning, piercing or slashing for each attack.
- **The source card:** after the first attack, it offers “Sustain: Attack”, once per turn of the caster's while the spell lasts.
- **The GM's:** changing partners, the object's movement, and the multiple attack penalty (notes on the card).

**A grab with GM notes (Grasping Vine).** A Reflex save against a creature target (“1 unattended object of up to 8 Bulk, or Medium or smaller creature that is currently on the ground”):
- **Targets:** creatures up to the stated size (PF2e's size). The GM confirms each is on the ground; an object target is the GM's (“If the target is an item, you can move it 10 feet …” is a reminder).
- **Rows:** Grabbed with the Escape end (success: until the end of your next turn; failure and critical failure: until it Escapes).
- **GM row notes:**
  - “… or destroys the vine (the vine has AC 15 and 10 Hit Points), at which point the spell ends.” The GM ends the grab in Ongoing spells.
  - “The first time each round you Sustain this spell, you can Reposition the grabbed target up to 5 feet.”
  - “As failure, and you can immediately Reposition the target up to 10 feet.”

  A Reposition note needs the row to grab. A breakable note needs a Grabbed with an Escape end, and no damage, bonus or penalty in its sentence.

**A sustained bargain (Wish Market).** No save, no Target, sustained, one table:

```html
<p>… You gain a +1 status bonus to Perception checks and your choice of Acrobatics, Athletics, Nature, Occultism, or Religion checks for the spell's duration, and you can either Recall Knowledge or Seek as a free action. However, you also pay a random price; roll 1d4 on the table below. The first time each round you Sustain the spell, you can either Recall Knowledge or Seek as a free action or haggle with the merchant to suppress the price's penalty for 1 round.</p>
<table>… <td><p>1</p></td><td><p><strong>Your Social Graces</strong>: For the spell's duration, you take a –2 status penalty to Diplomacy and Society checks.</p></td> …</table>
<hr /><p><strong>Heightened (4th)</strong> The status bonus increases to +2.</p>
```

How it resolves:
- **Casting:** the caster picks one of the listed skills. The module rolls the price and puts one Effect on the caster: the bonus to Perception and that skill, and the price row's penalties.
- **Price table:** its rows must be exactly the die's faces, each a penalty to two skills other than the listed ones.
- **Heightened entries:** each may only raise the bonus.
- **The Haggle button:** it adds a “price suppressed” Effect for the stated rounds, and the price's penalties are off while it lasts. The button stays available for later Sustains.
- **The caster's to play:** the free Recall Knowledge or Seek, and the once-a-round limit.
- **Opening narration:** it can't hold rule words.

**A Hit Point pool that blocks Strikes (Shattering Gem).** A basic save, “1 creature”, a timed duration:

```html
<p>A large gem floats around the target … . The gem has 5 Hit Points. Each time a creature Strikes the target, the target attempts a @Check[flat|dc:11|showDC:all]. On a success, the gem blocks the attack, so the attack first damages the gem and then applies any remaining damage to the target. If the gem is reduced to 0 Hit Points, it shatters, immediately dealing 1d8 slashing damage (basic Reflex save) to the creature that destroyed it, as long as that creature is within 10 feet of the target.</p><hr /><p><strong>Heightened (+1)</strong> The gem has 5 additional Hit Points, and the damage dealt by its detonation increases by 1d8.</p>
```

How it resolves:
- **Casting** puts a marker on the target with the pool's Hit Points (heightened as the entry says; the damage step must match the item's).
- **Each Strike:** use “Struck” in Ongoing spells with the attacker targeted. It rolls the flat check; on a success, enter the damage the target just took, and up to the pool's remaining Hit Points of it are restored.
- **At 0:** the attacker gets the basic save if it's within the range; either way, the spell ends.
- **Opening narration:** one sentence, with no rule words.

**Images that take hits (Trickster's Mirrors).** A basic save, no Target, sustained. The text reads, in order:
- “You are surrounded by up to 3 mirrors that …”;
- “You start with 1 mirror and gain an additional mirror each time you Sustain this spell, up to a maximum of 3 mirrors.”;
- “Any attack that would hit you has a random chance of hitting one of your mirrors instead of you.”;
- one odds sentence per count, e.g. “With two mirrors, there is a 1 in 3 chance of hitting you (1–2 on 1d6).”;
- “Once an image is hit, it is destroyed.”;
- “If an attack roll fails to hit your AC but doesn't critically fail, it destroys a mirror.”;
- “If the attacker was within 5 feet, they must succeed at a basic Will save or take 1d4 mental damage …”;
- “A damaging effect that affects all targets within your space … destroys all of the mirrors.”

Each odds sentence must be consistent: its faces are that share of its die.

How it resolves: a marker on the caster counts the images, with these Ongoing controls:
- **An attack would hit:** rolls the odds for the current count. On an image's faces, that image is destroyed.
- **An attack missed, not critically** (attacker targeted): one image breaks. If the attacker is within range, its basic save card opens.
- **Damage on everything in the space:** all the images are destroyed.
- **Sustain:** one more image, up to the most, and this round's Sustain is recorded.

**Stuck together by size (Stick On).** No save; the Target is “1 creature” or “1 creature or object”; a timed duration. The text reads, in order:
- “You and the target become inseparable for the spell's duration or until the target Escapes.”;
- “If the creature is smaller than you, it's @UUID[…]{Immobilized} and pulled along with you as you move.”;
- “If the target is the same size as you, you're both pulled along with each other as either moves, but you both treat all spaces as difficult terrain.”;
- “If the target is larger than you, you're immobilized and pulled along as the target moves.”;
- optionally, “You can Dismiss this spell.”

At most one opening sentence of narration (no rule words) is allowed, and no Heightened entry.

How it resolves: casting compares PF2e's sizes.
- **The target's bond Effect:** it ends when the target Escapes against the caster's spell DC. A smaller target's bond grants PF2e's Immobilized.
- **A larger target:** the caster gets an Effect granting Immobilized.
- **The same size:** both get the difficult-terrain rule as a note.
- **Ending:** the cast's Effects end together, whether by Escape, the duration, or Dismiss (End in Ongoing spells).
- **The GM's:** moving the stuck creature, and an object target.

**An area or an object (Grease).** A degree save (not basic), with no damage. It needs the intro “You conjure grease, choosing an area or target.” and a list of exactly two items:
- **Area [N contiguous 5-foot squares]**, in four sentences:
  - “All solid ground in the area is covered with grease.”;
  - “Each creature standing on the greasy surface must succeed at a Reflex save or an Acrobatics check against your spell DC or fall @UUID[…]{Prone}.”;
  - “Creatures using an action to move onto the greasy surface … must attempt either a Reflex save or an Acrobatics check to Balance.”;
  - “A creature that Steps or Crawls doesn't have to attempt a check or save.”
- **Target [the item's Target line]**: what the object does, with no damage or condition.

How it resolves (user decision):
- **The area branch** is the save. The caster targets the creatures on the surface: success is unaffected, and failure or critical failure falls Prone.
- **Reminders on the card:**
  - a creature may use Acrobatics instead, and the GM sets its result;
  - the later Balance checks and the Step/Crawl exemption;
  - the whole object branch.

**Persistent damage with an additional save each turn (Dehydrate).** An area save whose one damage entry is persistent, with two paragraphs and a table:

```html
<p>… All creatures in the area take 1d6 persistent fire damage with a basic Fortitude save; creatures with the water or plant traits get a result one degree of success worse than they rolled. The spell ends for a creature when its persistent damage ends.</p>
<p>A creature affected by <em>dehydrate</em> attempts an additional Fortitude save at the end of each of its turns, before rolling to recover from the persistent damage. It can forgo this additional save if it consumed water or a similar hydrating liquid within the last round (…).</p>
<hr /><p><strong>Success</strong> …</p><p><strong>Failure</strong> The creature is @UUID[…]{Enfeebled 1} until the end of its next turn.</p> …
```

How it resolves:
- **Casting** is a basic save: the text says “basic”, even when the item's defense doesn't. The trait sentence is a degree adjustment read from PF2e's traits.
- **The record:** each creature now taking that persistent damage gets an Ongoing record. At the end of each of its turns, the GM confirms it didn't drink (“Unaffected” skips), and the additional save's card opens with the table.
- **Ending:** the record ends when that creature's persistent damage of that type ends. The turn that just ended, and a pending save, are finished first.

A basic save may also carry, as its only other sentence, a trait degree adjustment worded “Creatures with the X or Y traits get a result one degree of success worse than they rolled.”

**A hurled weapon (Hand of the Apprentice), guided.** An attack spell with no damage entry, “1 creature”, and one linked PF2e Effect. The Effect must be exactly:
- a weapon ChoiceSet (owned weapon items);
- one ability FlatModifier forced on the chosen weapon's damage;
- that weapon's critical specialization.

The text reads, in order:
- “You hurl a held melee weapon with which you are trained at the target, making a spell attack roll.”;
- “On a success, you deal the weapon's damage as if you had hit with a melee Strike, but adding your spellcasting ability modifier to damage, rather than your Strength modifier.”;
- “On a critical success, you deal double damage, and you add the weapon's critical specialization effect.”;
- “Regardless of the outcome, the weapon flies back to you and returns to your hand.”

How it resolves:
- **Casting:** the caster picks a held melee weapon that has a Strike (a character's weapon item; an NPC's attacks aren't weapons, so it's refused). PF2e's Effect goes on the caster with that choice, and PF2e's spell attack is rolled against the target.
- **On a hit:** the card's button rolls that weapon's own Strike damage through PF2e's damage dialog: the critical roll on a critical success, with the specialization. PF2e's damage card applies it.
- **Data note:** PF2e's Effect uses a fixed ability (Intelligence), and the card notes it.
- **The GM's:** training in the weapon.

**An edge for the caster's spells (Invoke True Name).** No save, “1 creature” (optionally “whose true name you know”), no duration. The text reads, in order:
- “Until the end of the current turn, the target is @UUID[…]{Off-Guard} against your spells and takes a -2 circumstance penalty to saving throws against your spells.”;
- “In addition, the first time this turn the target takes damage from one of your spells, it has weakness to that damage equal to double the rank of ….”

How it resolves: one Effect on the target until the end of the current turn.
- **Off-Guard and the save penalty:** −2 circumstance to AC (Off-Guard's penalty, so it doesn't stack with a real Off-Guard) and the save penalty, each applying only to the caster's spells.
- **The weakness:** double the cast rank to the caster's spell damage. It's removed after the caster's first spell damage to that creature.
- **The GM's:** knowing the true name.

**A body part used as a shield (Shielded Arm).** No save, “1 willing creature”, a timed duration (“1 minute or until expended”). The text reads, in order:
- “It can use the Raise a Shield action to instead raise its arm, gaining a +2 circumstance bonus to AC.”;
- “It can Shield Block with its Raised arm as well; when it does, the target reduces the damage as if it had a shield with Hardness 4 and 15 Hit Points.”;
- “This shield doesn't have a Broken Threshold, and the spell ends if the shield's Hit Points are expended.”;
- at most the two notes (no unarmed or shield-bash change; the anathema note);
- at most a Heightened entry “The Hardness increases by N, and the Hit Points increase by M.”

How it resolves (user decision):
- **The shield:** a temporary PF2e shield item on the target. PF2e's own Raise a Shield and Shield Block use it, and PF2e counts it as held in one hand.
- **The duration:** an Effect. Removing either the Effect or the shield removes the other.
- **Hit Points:** PF2e always gives a shield a Broken Threshold of half its maximum, so the item carries twice the spell's Hit Points. When the Hit Points above the threshold are gone, the spell ends and both are removed.

**When a linked Effect applies (stated forms).** A spell with one linked PF2e Effect and no save applies it when cast when one of these sentences says who holds it (and the Effect is proven against the rest of the text):
- **Healing bonus:** “When the target regains Hit Points from a healing vitality spell, it regains N additional Hit Points.” The Effect is a single `healing-received` modifier, on the target. A “only the first time … from a given healing spell” sentence becomes a data note, because PF2e's Effect adds to every healing.
- **First Strike each round:** “On your first weapon Strike each round, you gain a status bonus to damage …”, with PF2e's toggle on the Strike-damage modifier. It goes on the caster, with a data note to switch the toggle for that Strike.
- **A named reaction target:** a reaction or free action whose Target is “you or the triggering ally”, “the triggering ally” or “your familiar”. The Effect goes on that creature.
- **A rolled result:** “Upon completion, roll 1d4 for your prediction.”, with PF2e's formula badge of that die labelled with the listed results. It goes on the caster, and PF2e rolls the badge.
- **A counted resource:** “When you Cast the Spell, the wheel has one mote of …”, with PF2e's counter badge starting at 1. It goes on the caster, with a data note to raise the badge.
- **Allies in the area:** “Each ally in the area gains …” now counts, like “Allies in the area gain …”.

**Effects with immunity, a cast condition, two holders, or a caster's check.** A spell whose one PF2e Effect is proven may also say:
- **Immunity from the cast:** “After a creature has been targeted with …, it becomes temporarily immune for 24 hours.” Each recipient gets an immunity marker, and a recipient holding it is refused.
- **Immunity once used:** “After canceling out …, the spell ends, and you are then temporarily immune to … for 10 minutes.” The marker comes when the Effect is removed before it expires (PF2e deletes a used fortune toggle).
- **Ending after use:** “Once it does this, the spell ends.” If PF2e's Effect doesn't remove itself, the module removes it after the roll it's for (a saving throw, attack roll, skill check or Perception check its RollTwice names); otherwise a data note says to remove it.
- **A condition on cast:** “When you Cast the Spell, the target falls Unconscious if it wasn't already.” (with the wake-up sentences). PF2e's condition is applied with the Effect, and waking early is a GM note.
- **Not Off-Guard:** “You are not Off-Guard to the attacker or spellcaster until the beginning of your next turn.” This is a GM note.
- **Both holders:** “the two of you share any vision-based senses (…) and gain a +2 status bonus to Perception checks, but if either of you are Blinded or Dazzled, you both are.” The Effect (exactly that bonus) goes on the target and the caster, and the shared senses are a GM note.
- **A check as part of the cast:** “As part of Casting this Spell, you Recall Knowledge using Society to gain information about ….” It's a caster reminder, and “only once in a given social situation” is a GM note.

**More stated Effect forms (batch 134).**
- **The next attack rolled twice:** “The next time you make an attack roll before the end of your turn, roll it twice and use the better result.” PF2e's RollTwice goes on the caster, and the module removes it after the next attack roll (user decision: the text).
- **Immunity after use:** “You are then temporarily immune to … for 10 minutes.” Immunity starts at the cast.
- **Ignoring penalties and a flat check:** “The attack ignores circumstance penalties to the attack roll and any flat check required due to the target being Concealed or Hidden.” PF2e's suppression covers the penalties; the flat check is a GM note.
- **Escape and Stride:** “You immediately escape from every magical effect that has you Immobilized or Grabbed unless …” and “You then Stride.” are a GM note. “During this movement, you ignore difficult terrain …” is PF2e's Effect on the caster.
- **The triggering check rolled twice:** “The GM rolls the triggering check twice and uses the better result.” on a reaction, with PF2e's RollTwice removed after the roll, goes on the caster. The actions its Trigger names are covered when the Effect's predicates name them.

**Who holds the Effect (batch 135).**
- **The carrier:** “The stones must be unattended or carried by you or a willing ally.” with PF2e's alterations to the holder's slings. The caster targets the carrier; the stone count per action and the single use are GM notes.
- **The caster, for a touched weapon:** “If you touch a weapon, your proficiency rank with that weapon temporarily increases to trained …” with PF2e's MartialProficiency. The object Target doesn't matter, and the tool branch and “no benefit for activities longer than a minute” are GM notes.
- **The caster, for a polymorph:** “You can polymorph into any form listed in Pest Form, which lasts 10 minutes.” with PF2e's form choice. A “varies” duration is the Effect's (“All other … shapes last 1 minute.”), with a data note for the 10-minute shapes.
- **The creature a thrall is flung at:** “The thrall is split into pieces and flung toward a willing creature within 15 feet of it, destroying the thrall and granting that creature … temporary Hit Points …”. The caster targets that creature, and a data note says to remove the thrall.

**Table rules around a stated Effect (batch 136).**
- **A welded weapon:** “For the duration of this spell, you can't drop your weapon, and you gain a +4 circumstance bonus to your Reflex DC against attempts to Disarm you.” PF2e's Disarm modifier goes on the caster; not dropping the weapon is a GM note.
- **A token of favor:** “… you can Interact to pass the token to an ally within your reach. As long as the ally has the token on their person, they gain a +1 status bonus to Performance checks and Will saves.” The Effect goes on the ally the caster targets; losing the token is a GM note.
- **Trained skills:** “For the duration of this spell, you are trained in Crafting and Thievery.” PF2e's rank upgrades go on the caster. The tools and the 8-hour exploration casting are a GM note, which also says PF2e raises the rank by level.
- **Untriggered free-action Dismiss:** “You can Dismiss the spell as a free action.” It's now an untriggered free action. Before, a free-action Dismiss was always read as triggered by taking damage, and a Dismiss link's dots hid the sentence.

**Utility spells with a proven Effect (batch 137).**
- **Figment:** “When you Cast or Sustain the Spell, you can attempt to Create a Diversion with the illusion, gaining a +2 circumstance bonus to your Deception check.” PF2e's bonus goes on the caster; the illusion's make-up and disbelief are GM notes.
- **Light:** “If you create the light in the same space as a willing creature, you can attach the light to the creature …” PF2e's token light goes on the creature the caster targets (itself included). A light left in place, its colour, moving it on a Sustain, and the four-lights limit are notes.
- **Read Aura:** “You or anyone you advise about the aura gains a +2 circumstance bonus to Identify Magic on the item.” It goes on the caster (a data note covers advised creatures). What's magical, and illusions, are GM notes.
- **Fishing Spot:** “… roll 1d8 to see which fish you caught …” with PF2e's choice of exactly those fish, in the listed order. The module rolls and answers PF2e's choice, and the Effect goes on the creature that eats the fish (the caster targets it). Cooking and eating are GM notes.

**More proven Effects (batch 138).**
- **Illusory Disguise:** “Casting illusory disguise counts as setting up a disguise for the Impersonate use of Deception; it ignores any circumstance penalties …, gives a +4 status bonus …, and lets the target add its level …”, with PF2e's two Impersonate modifiers (the stated bonus). The appearance rules and the ignored penalty are GM notes.
- **Swear Oath:** PF2e's toggle for the readied action's roll goes on the caster. Readying the action, the 1-action casting and regaining the Focus Point are notes.
- **Forbidding Ward:** “The target ally gains a +1 status bonus … against the target enemy's attacks, spells, and other effects.” With “1 ally and 1 enemy” targeted, PF2e's Effect goes on the ally, and its TokenMark is set to the enemy's token.
- Stated forms now compare their number with PF2e's modifier.

**User decisions (batch 139).**
- **A Strike weakness on the foe (Glimpse Weakness):** “The first ally that hits the target with a successful Strike deals additional precision damage equal to 1 + this spell's rank, and then the spell ends.” The foe gets a custom weakness of that amount to Strike damage (weapon or creature Strikes) for the spell's duration, removed after the first Strike damage. PF2e's Effect (built for the ally) isn't applied; a GM note covers precision immunity and the caster's own Strikes.
- **A prepared Aid (Uplifting Overture):** “This counts as having prepared to Aid your ally on a skill check of your choice …”.
  - Casting asks the ally's skill and rolls the caster's Aid check with the stated skill against DC 15. A failure becomes a success, and legendary is a critical success.
  - The ally gets PF2e's Aid result as a circumstance modifier to that skill's next check: critical success +2 (+3 master, +4 legendary), success +1, critical failure −1.
  - The GM's “might rule you can't” sentence is a note.

**An impossible spell's burst (Pyroclastic Truth, user decision).** A basic save; the item's traits include `impossible`. It needs three paragraphs and an optional Heightened (+1):
- **The burst:** “… dealing 2d12 fire damage to all creatures, structures, and unattended objects in the area. All creatures damaged by this spell are marked by fire for the duration of the spell.”
- **Fuel:** “When you Fuel <spell>, all creatures marked by fire take @Damage[(@item.level)d12[persistent,fire]] damage.”
- **The mark:** “Lethologic Mark … Whenever you take fire damage, you become Frightened 1. Additionally, if you're reduced to 0 Hit Points by a fire effect, you instantly die … To heal this mark, …”

How it resolves:
- **The save:** an ordinary basic save. Structures and objects are a data note.
- **The fire mark:** each creature that loses Hit Points gets a “marked by fire” Effect for the spell's duration.
- **Fuel:** a Fuel control in Ongoing spells gives every creature still marked (rank)d12 persistent fire.
- **The Lethologic Mark:** it's automated on the caster, once. Fire damage makes them Frightened 1, and fire damage to 0 Hit Points sets Dying to its maximum (dead). Its description has the healing requirement; delete the Effect once the mark is healed.

**An emanation's Effect at each turn start, by tradition (Manifest Will, built properly by user decision).** It needs a sustained emanation, PF2e's “Aura: X” and “Spell Effect: X” (a tradition ChoiceSet plus one rule per tradition), and the list. Each list item must match its rule:
- **Arcane:** weakness to spell damage.
- **Divine:** temporary Hit Points, for a living or undead creature.
- **Occult:** Lesser Cover, for an allied creature.
- **Primal:** a −10-foot status penalty to all Speeds, “or until it Escapes”.

How it resolves:
- **Casting:** PF2e's Aura goes on the caster, and a sustained Ongoing record starts on the emanation. The tradition is the spell's spellcasting tradition, or the caster picks.
- **Each turn start inside** (the caster included): PF2e's Spell Effect is applied with that tradition to the creatures the tradition names, replacing this cast's earlier one.
- **Primal:** its Effect ends on an Escape against the spell DC.
- **Occult:** the module creates PF2e's Cover Effect itself, set to lesser, for 1 round; PF2e's grant would ask for the level.
- **GM notes:** the caster's concealment from outside, and occult cover after leaving.

**A reaction that improves a check already rolled (Practice Makes Perfect).** It needs a reaction whose target is the triggering creature, the trigger "fails a skill check for a skill in which you or they are trained", "a +N status bonus to the triggering check, or a +M bonus if … master or better", and "This bonus can change the outcome". How it resolves:
- The triggering creature's latest skill check (or the one named) is read: its total, DC and natural die. A check that didn't fail is refused, and so is a skill the creature is untrained in.
- The bonus is +M at master or better, otherwise +N. A status bonus the check already has is replaced, not stacked.
- The check is re-graded (natural 20 and 1 still step the degree), and the card gives the new result for the GM to apply.
- PF2e's own Effect (a bonus to later checks) isn't applied.

**A climbing rope on the caster (Inside Ropes).** It needs a self spell lasting minutes, with "use the X as N feet of rope to help you Climb", "half as quickly … (minimum 5 feet), but you can attempt a DC N flat check whenever you critically fail to prevent a fall", the other-creatures sentence and the spell-ends sentence. The Heightened bonus must be the linked Effect's only rule. How it resolves:
- **Casting:** one Effect goes on the caster for the duration, replacing an earlier one. It carries PF2e Notes on Climb checks (move half as far, minimum 5 feet).
- **A critically failed Climb** by the bearer: the module rolls the flat check (a success prevents the fall).
- **From the Heightened rank:** the linked Effect's +1 item bonus to Athletics checks to Climb is on the module's Effect. PF2e's Effect isn't applied separately.
- **Notes on the Effect:** others can climb the rope, and the spell ends if it's let go or damaged.

**Invisible for a Stride, then a Hide (Flashy Disappearance).** It needs a self spell with no duration, with six sentences: temporarily Invisible, Undetected unless they see invisible creatures, "You Stride.", the Hide check at the end of the movement (with cover, greater cover or concealment), the Stealth bonus, and the invisibility ending as Observed or Hidden. PF2e's Effect must be exactly Invisible's grant plus the stated bonus on `action:hide`. How it resolves:
- **Casting:** PF2e's Effect goes on the caster (Invisible, and +2 status to Hide). The card says to Stride, and has two buttons.
- **Hide:** rolls PF2e's Stealth check with the Hide option (the bonus applies), and compares it with each observer's Perception DC. The observers are the non-allied combatants when the caster is in combat on the scene, otherwise the non-allied creatures on the scene. Then the Effect ends. PF2e's Hidden goes on the caster when the check meets every DC. Otherwise the card lists who it's Hidden from, as a GM note.
- **No cover:** ends the Effect; the caster is Observed.

**A reaction resistance with a cloud action (Eat Fire).** It needs:
- a reaction "You would take X damage", lasting until the end of your next turn;
- "resistance N to X damage until the end of the current turn";
- "you can use the Y action", and the Unconscious/inhale/exhale ending;
- the one-action paragraph: a burst within N feet, Concealed inside and concealed to them, lasting N minutes or until a strong wind;
- "Heightened (+3) The resistance increases by 5."

PF2e's Effect must be exactly that Resistance (`5*ceil(level/3)`). How it resolves:
- **Casting** (user decision: the text): PF2e's Effect goes on the caster for the spell's duration, without its Resistance rule. The resistance is a second Effect that ends with the current turn: in combat, when the turn it was cast on ends; outside combat, once time passes.
- **The action's button:** places the burst, refused if its centre is beyond the range. It starts a lingering concealment area for the duration (creatures inside are Concealed, with the flat-check note for creatures outside), and the Effect ends.
- **Unconscious:** the Effect ends when the caster gains Unconscious.
- **GM notes:** inhaling or exhaling, and a strong wind.

**A companion ward that grants a damage-reducing reaction (Protect Companion).** It needs:
- the target "your eidolon, or a creature with the minion trait under your control", lasting until the start of your next turn;
- the AC sentence, matching PF2e's Effect exactly;
- "You gain the [action] reaction; after using the reaction, the spell ends and you can't cast [this spell] again for N minutes";
- the Heightened (+2) step with the lower-tier choice.

The reaction's base numbers and trigger are read from PF2e's action when cast, and checked. How it resolves:
- **Casting:** PF2e's Effect goes on the target, which must have the minion or eidolon trait. A caster under the lockout is refused.
- **When the target takes damage** (PF2e's `damageTaken`): the caster gets a card with one button per tier (base, plus one per Heightened step).
- **The reaction:** the damage is reduced (the Hit Points restored), the caster loses the tier's Hit Points, the spell ends, and a 10-minute lockout Effect goes on the caster.
- **GM notes:** control of the target, riders that came with the damage, and Dying from the damage.

**Action-count modes that choose the Effect's recipients (Spirit Ward).** It needs a sustained "1 to 3" action spell targeting 1 creature, with the bonus sentence, "The number of actions you spend … determines its targets, range, area, and other parameters", and three action paragraphs: touch; a range with the living-creature upgrade; and an emanation that "targets you and all your allies". PF2e's Effect must be exactly the action-count ChoiceSet, the stated bonus, and the living upgrade at 2 actions. How it resolves:
- **Casting:** the caster gives the action count (a dialog, or `actions`).
  - **1 action:** one creature within reach (at least 5 feet).
  - **2 actions:** one creature within the range.
  - **3 actions:** the caster and each ally in the emanation.
- **The Effect:** PF2e's Effect goes on each recipient with the count selected (PF2e applies the +2 for a living target at 2 actions). The cast is a sustained Ongoing record for its maximum duration.
- **The bonus's scope** (user decision: the text): PF2e's predicate also covers every spell. The module's Effect keeps only spirit and haunt origins (`origin:trait:spirit`, `origin:trait:haunt`).

**An animated object's commands, one an attack (Animate Rope).** It needs a sustained spell with "You can give it N commands when you Cast the Spell, and N each time you Sustain the Spell", and a command list. Exactly one command must be an attack: a spell attack against a save DC, a Speed penalty by degree, an Escape end, and the object's stats, with PF2e's Effect (a degree ChoiceSet feeding the Speed modifier). The other commands must state no rules. How it resolves:
- **Casting:** starts a sustained Ongoing record holding the command count, with a marker Effect on the caster.
- **Each Sustain:** adds the per-Sustain commands (once per round).
- **The attack command** (a control, at the targeted creature): rolls PF2e's spell attack against its save DC (MAP chosen on the roll). On a hit, PF2e's Effect goes on it with the degree's penalty and an Escape end against the spell DC. It ends with the spell.
- **Other commands:** post what the object does.
- **Every command** spends one; with none left, the control refuses.
- **GM note:** breaking the object.

**Two thoughts for one or two creatures (Contagious Idea).** It needs:
- the target "1 or 2 creatures other than yourself (see text)";
- the four lead sentences: the choice, the second creature, not the same creature or yourself, and the second within N feet of the first;
- a pleasant item with temporary Hit Points and PF2e's Effect;
- a terrifying item: its save plus a degree table that compiles as a save with no pending parts.

How it resolves:
- **Targets:** checked when cast. One or two creatures, not the caster, the first within range, and the second within the stated distance of the first.
- **Pleasant** (user decision: the text): PF2e's Effect goes on each target with its TempHP set to 5, +1 per rank above the spell's own (a cantrip counts from 1st rank). PF2e's rule gives the rank.
- **Terrifying:** starts the module's save card with the compiled degree table.

**A degree row's own immunity (general).** A non-basic save's rows can each carry "The target is unaffected and (is) temporarily immune for N …" or "The target is [condition] and is then temporarily immune for N …". Every row that names immunity must be one of these forms, with the same duration. The immunity applies on those degrees only. It was previously only the critical-success "unaffected" form. The row's immunity duration isn't read as the condition's duration.

**An emanation giving the caster and allies inside an Effect, with a critical-save rider (Frenzied Revelry).** It needs:
- a non-sustained emanation targeting "you and allies in the area";
- "You and your allies gain a +N status bonus to saving throws against X effects while in the area";
- the critical sentence (a +N status bonus to attack and damage rolls for N rounds);
- fixed-rank Heightened entries, each a radius and a bonus.

PF2e's Effect must give each rank's bonus (its ternary is evaluated) and carry the critical-success Note against an enemy's X effect. How it resolves:
- **Casting:** a lingering record centred on the caster, with the radius for the rank.
- **Holding the Effect:** the caster and each ally inside hold PF2e's Effect; leaving removes it.
- **The rider:** a holder's critical success at a save against an enemy's X effect adds PF2e's critical Effect for its rounds. The Effect's rule is checked first.
- **Every save** (user decision: the text): PF2e's modifier is on Will saves only. The module's Effect puts it on all saving throws against mental effects.

**Text over PF2e's rules, when the text is proved (general).** A compiler can record `ruleOverrides` for PF2e's linked Effect: patch or remove one rule, checked by index and key. The runtime applies them when it creates the Effect, and refuses if the rule changed. Used for Contagious Idea (TempHP), Spirit Ward (predicate) and Frenzied Revelry (selector). Eat Fire removes its Resistance rule and adds a turn-bound Effect.

**Used once, as the text says (general, user decision).** Where PF2e's Effect lasts longer than the text's single use, the plan carries `consumeOn`. The module removes the Effect after that roll:
- **`attack-roll`:** Sure Strike.
- **`saving-throw`:** Bit of Luck.
- **`strike`:** the chosen weapon's miss or damage (Weapon Surge).
- **`weapon-damage`:** Precious Gleam.
- **`damage-roll` with the Effect's toggle:** Funeral Flames.

A text duration that differs is a `durationOverride`: Serrate lasts until the start of the caster's next turn.

**Value, type, attribute and next-turn corrections (user decision: the text).**
- **Reinforce Eidolon:** "resistance … equal to half the spell's rank (minimum 1)" with PF2e's `floor(@item.level/2)` becomes `max(1,floor(@item.level/2))` (a rule override).
- **Sting of the Sea:** a row whose text penalty is untyped makes PF2e's typed modifier untyped. This is the save route's per-row `ruleOverrides`.
- **Hand of the Apprentice:** the damage uses the caster's spellcasting attribute, not the one PF2e's modifier names.
- **Swampcall:** "until the end of its next turn" is ended by the module after the creature's next turn, or sooner if it leaves. PF2e's duration becomes 2 rounds, as an upper bound only.

**Rank-gated choices, a shape's time and a first-Strike toggle (user decision: the text).**
- **Untamed Shift:** PF2e offers the extra choices by the caster's level (6 and 10). The module offers them by the cast rank the Heightened entries name: removed below that rank, and the level term dropped at or above it.
- **Untamed Form:** "any form listed in Pest Form, which lasts 10 minutes". When the chosen shape is from Pest Form, the module sets the Effect and the granted form to 10 minutes.
- **Gravity Weapon:** "On your first weapon Strike each round". PF2e's toggle starts on, the first weapon Strike's damage roll switches it off, and each new round switches it back on (out of combat, once 6 seconds pass).

**Scope corrections (user decision: the text).**
- **Pact Broker:** "a –1 status penalty to attack and damage rolls against you and your allies". PF2e's modifier covers every roll. The module's Effect predicates it on the `target:signature` of the caster and each of the caster's allies on the scene when it's applied. The hex ending sooner stays a note.
- **Savor the Sting:** "As long as the target is taking persistent damage from this spell, you gain …". PF2e's mark Effect has no end. The module removes it when that target's last persistent damage of the type ends.

**Six more scope corrections (user decision: the text).**
- **Murmuration (critical failure):** "an attack roll or hostile skill check". The −2 only applies to rolls with `attack`, `item:trait:attack` or `target:enemy`, and is removed after that roll.
- **Curse of Recoil (critical failure):** "any additional ranged attacks made with the same weapon, spell, or ability". The target's first ranged attack locks the penalty to that item (`item:id:`).
- **Healer's Blessing:** "only the first time it regains HP from a given healing spell". After the bonus adds to a heal from a spell, that spell's item is excluded. A new cast of it lifts the exclusion.
- **Song of the Soul:** "for as long as it's within 15 feet of the target thrall". The nearest thrall within 15 feet is bound when cast (the cast refuses without one), and the fast healing is off while the creature is farther away.
- **Crushing Ground (critical failure):** "It can attempt to Escape". A successful Escape ends only Immobilized. The Effect (Off-Guard) stays and can't be escaped again.
- **Hippocampus Retreat:** "At the end of the movement, your lower limbs return to normal". The caster's Effect is removed when its token next moves.

**Families for note-only spells (general).** `note-families.js` runs before the note route. The first family whose text proves out decides the spell's route.

**Difficult-terrain areas (500 Toads, Mud Pit, Earthworks, Warped Terrain).** A spell with no save, damage or target, whose only rule is difficult terrain in a burst, plus narration and notes. The notes cover clearing squares, disbelieving, and traps the area can set off.
- **Size:** a fixed burst, or one sized by the actions spent (three templates, or "+5 feet per additional action").
- **Casting:** places the burst and starts a lingering area with PF2e's movement cost for the duration. A 1-round area ends at the start of the caster's next turn.
- **Flying:** from the Heightened rank that says so, the area is difficult terrain for flying creatures too.

**Stated check bonuses (Fashionista, Groom Companion, Root Reading; note-only before).** A spell whose only rules are "gains a +N status bonus on/to <Skill> checks (to <Action>)". Two forms are also read: Root Reading's Seek bonus until the end of your next turn, and its +1 to the initial Track check. The module's Effect goes on the recipient with a FlatModifier per bonus, predicated on the named action.
- **Recipient:** a willing target, the companion or eidolon (checked by trait), or the caster.
- **Duration:** the spell's; or 1 round ending at the end of the caster's next turn; or until that one check, removed after it.
- **Heightening:** "+1 per 2 ranks, to a maximum of +4 at 7th".
- **Notes on the Effect:** appearance, and anything the GM decides.

**Rolls (Diviner's Sight, Read Fate, Fact Check, Nudge Fate; note-only before).**
- **Diviner's Sight:** the module rolls the d20. PF2e's SubstituteRoll goes on the target's saves and skill checks (not secret ones); the player picks it in PF2e's check dialog. The module removes the Effect once a check is made without a d20, or after the caster's next turn. A new casting replaces the caster's earlier one.
- **Read Fate:** the module rolls the secret DC 6 flat check for the GM only, with what to say on a success or failure. The target is then immune for 24 hours, and a second cast on it is refused.
- **Fact Check:** the reaction finds the triggering Recall Knowledge check (the caster's, or an ally's within 30 feet). It rolls the caster's check with that skill against the same DC, and the card tells the GM what the degree reveals. For an NPC caster, training is the GM's to confirm.
- **Nudge Fate:** a hex Effect on the target. The first failed attack, skill check or save that +1 status would improve is re-graded on a card, and the hex ends. A new casting replaces the earlier one.

**Damage reactions (Protector's Sacrifice, Delay Consequence, Interposing Earth; note-only before).** The module keeps each creature's last damage (PF2e's `damageTaken`).
- **Protector's Sacrifice:** 3 per rank of the ally's last damage (an ally within 30 feet) is restored to it and dealt to the caster, with no IWR. Other effects of the attack are notes.
- **Delay Consequence:** the target's last damage is restored now and dealt when the Effect ends: at the start of the caster's next turn, or on Dismiss (delete the Effect). The attack's other effects are the GM's then.
- **Interposing Earth:** an Effect on the caster with standard cover (+2 circumstance to AC and Reflex) and resistance 2 to all damage (8 from 4th rank). It ends with the damage it's for, or at the end of the turn. The barrier's statistics and its 3 rounds on the map are notes.

**Strike spells (Shielding Strike, Spinning Staff, Dimensional Assault, Sky Laughs at Waves, Shooting Star; note-only before).** A spell whose effect is a Strike.
- **Weapons:** the requirement (a staff, a one-handed sword, a ranged or thrown weapon) and the range decide which of the caster's Strikes qualify. With none, the cast is refused.
- **First action:** where stated, the caster Raises a Shield (PF2e's action) if it holds one.
- **The card:** a button per qualifying weapon rolls PF2e's own Strike. Spinning Staff has two buttons each, the second at the multiple attack penalty.
- **Notes:** teleporting or flying the token, falling, disruption, Shooting Star's cover reduction and trail, and Spinning Staff's Spellstrike recharge.

**Actions the module takes (Cackle, Friendfetch, Liberating Command, Bone Shield; note-only before).**
- **Cackle:** Sustains the caster's sustained Ongoing spell (the caster picks, if there are several).
- **Friendfetch:** each willing target (1 or 2, within 30 feet) is moved along the line toward the caster, to the free square closest to it (forced movement).
- **Liberating Command:** a Grabbed, Immobilized or Restrained target rolls PF2e's Escape as its reaction; any other target is refused.
- **Bone Shield:**
  - A temporary PF2e shield (Hardness 3, +3 per 2 ranks; 1 HP, no Broken Threshold) is held and raised when cast.
  - Its destruction doesn't end the spell. Each Sustain recreates it if needed and raises it.
  - The +2 Hardness against piercing or slashing is a note.

**Checks that shape other rolls or spells (Extend Boost, Lingering Composition, Share Burden, Counter Performance, Foresee the Path; note-only before).**
- **Extend Boost and Lingering Composition:** the check (the eidolon tradition's skill, or Performance) is rolled against the level-based DC. That's the caster's level, or the highest level among the caster and allies within 60 feet. The next Boost/Reinforce Eidolon, or cantrip composition, gets the result's duration (4/3/1 rounds), and a failure refunds its Focus Point.
- **Share Burden:** PF2e's AdjustDegreeOfSuccess (one degree better) goes on the ally's next save against an emotion effect, and is removed after it. The caster sharing the outcome is a note.
- **Counter Performance:** the Performance check is rolled. Each save the caster or an ally within 60 feet made against an auditory or visual effect in the last minute is compared with it, and the card gives the better results.
- **Foresee the Path:** Perception against the enemy's higher Will or Deception DC, then the enemy is immune for 1 minute. On a success, the ally gets the reaction (a note), and a toggle gives the +2/+1 status bonus for its melee reaction Strikes.

**PF2e rule Effects (Song of Marching, Share Lore, Tentacular Limbs; note-only before).**
- **Song of Marching:** the caster and each ally within 60 feet get +1 status to initiative. The caster's Effect has a toggle to use Performance for initiative (PF2e's initiative statistic). All of them are then immune for 1 day (the markers run from the cast through the day after). Hustling is a note.
- **Share Lore:** each target (up to 3; more by rank) gets a trained Lore item for one of the caster's Lores (two at 5th), removed when the spell's Effect ends. The duration follows the rank.
- **Tentacular Limbs:** the caster's unarmed Strikes gain the reach trait (PF2e's AdjustStrike). Touch spells at 10 feet, and the extra action for 20 feet, are notes.

**Attack wards (Sanctuary, Protector Tree; note-only before).**
- **Sanctuary:** the target gets the ward Effect. Each attack roll against it has the attacker roll a Will save against the spell DC, and the row is applied: a critical success ends the spell; a success lets that creature attack the target this turn; a failure wastes the action (the card says so) and bars it for the turn; a critical failure bars it for the rest of the spell. The ward ends when the warded creature makes an attack.
- **Protector Tree:** a 5-foot square holds the tree's 10 Hit Points (+10 per rank). Strike damage to an ally adjacent to it is taken from the tree first (the ally is restored by that much); when the tree reaches 0 it is gone, the spell ends and the rest goes to the ally. The tree's AC 10 is a note.

**Summons (Summon Animal, Construct, Fey, Plant or Fungus, Undead, Elemental, Celestial, Dragon, Entity, Giant, Monitor, Fiend, Summon Lesser Servitor, Phantasmal Minion; note-only before).**
- The caster picks the creature from a list of the Actor compendiums' common creatures that have one of the spell's traits and are at most the level for the cast rank (the summon trait's table: rank 1 → –1, 2 → 1, 3 → 2, 4 → 3, 5 → 5, then +2 per rank). Summon Dragon leaves out dragons of another magical tradition.
- **Summon Lesser Servitor:** a celestial, fiend or monitor, or an animal that gains the chosen traits (celestial and holy, fiend and unholy, or monitor). Its levels follow its own heightened entries (to level 3 at 4th rank).
- **Phantasmal Minion:** that creature.
- The creature is imported with the summoned and minion traits, the caster's alliance and owners, and placed in the nearest free space within range. It is removed when the caster's sustained Effect for the spell ends. Deity restrictions are notes.

**Rule sets (Unfetter Eidolon, Healing Plaster, Time Sense, Glamorize, Unbroken Panoply; note-only before).**
- **Unfetter Eidolon:** the eidolon's Effect has a toggle for effects that would grapple, immobilize or restrain it (or Reposition / Swallow Whole). The toggle gives +1 status to its saves and their DCs. PF2e's Grapple and Reposition against its Fortitude DC get the +1 without the toggle. The unlimited distance and unmanifesting are notes.
- **Healing Plaster:** the caster's Effect (a new cast replaces it) stands in for healer's tools. A Medicine check to Administer First Aid or Treat Wounds uses it up; from 3rd rank that check gets +1 item.
- **Time Sense:** until the end of the caster's turn, a toggle gives +1 status to one attack roll, Perception check, save or skill check that needs precise timing. The roll uses it up, and the caster can't gain it again for 1 hour. Left unused, it costs nothing.
- **Glamorize:** the caster's Effect for the hour has a toggle the GM switches on for a task the alterations help: +1 status to that skill check.
- **Unbroken Panoply:** the wielder's chosen (broken) weapon gains nonlethal on its Strikes, and its potency is an item bonus to Diplomacy. The broken condition's suppression and the end on new damage are notes.

**Items (Summon Instrument, Arms of Nature, Mending; note-only before).**
- **Summon Instrument:** the linked instrument (the virtuoso one from 5th rank) is in the caster's hands for the hour. It's removed when the spell ends, and a new cast replaces the last.
- **Arms of Nature:** the caster picks a common base weapon of 2 Bulk or less. It's created in their hands with the rank's runes (+1; +1 striking at 3rd; +2 striking at 5th; +3 greater striking at 7th) and removed when the minute ends. Its material is a note.
- **Mending:** a damaged, not destroyed item of the targeted creature (or the caster) within the rank's limits regains 5 Hit Points per rank, to its maximum. The limits are light Bulk non-magical; 1 Bulk at 2nd; 2 Bulk non-magical or 1 Bulk magical at 3rd. PF2e's broken status follows the Hit Points.

**Checks and actions (Dim the Light, Omnidirectional Scan, Reed Whistle, Darkened Forest Form; note-only before).**
- **Dim the Light:** PF2e's Stealth check with the Hide option against each foe's Perception DC; no cover is needed. The caster is Hidden when the check meets every DC. A marker removes Hidden at the end of the caster's turn; the GM deletes it first if the caster is in cover or concealed then.
- **Omnidirectional Scan:** the ally and the enemy must be within the 30-foot emanation. The caster's Aid check uses the spell attack against DC 15, and a critical failure counts as a failure. The ally's next attack roll against that enemy, until the start of the caster's next turn, gets the Aid result (+2/+3/+4 by the spell attack's rank, or +1). Seeking the emanation is PF2e's own Seek.
- **Reed Whistle:** the caster's Effect lasts 1 hour (4 at 3rd). Its Whistle button (with the creature targeted) takes an hour off it, ending it when none is left. For 1d4 rounds the caster and allies get +2 circumstance to Seek. Point Out's hidden-not-undetected is a note.
- **Darkened Forest Form:** the caster picks Pest Form (Animal Form from 2nd, Elemental Form from 5th), and the module resolves that spell at this spell's rank with PF2e's form and its choice. The form's Effect lasts this spell's sustained minute. Changing shape on a Sustain is casting again.

**Saves and areas (Verminous Lure, Extradimensional Cover, Perfected Mind; note-only before).**
- **Verminous Lure:** the target gets the lure's Effect (the scent notes). Each Tiny animal and each animal swarm (any size) within 30 feet of the caster rolls its Will save against the spell DC. Those that fail get the Effect "drawn to" the target; what they do (touch it, or attack it if hostile) is the GM's, from the row.
- **Extradimensional Cover:** a creature in the placed square has standard cover (+2 circumstance to AC, to Reflex saves against area effects, and to Stealth to Hide, Sneak or Avoid Notice). A creature not on the caster's side that stops in it is moved to a random free space next to it. The square is refused if an enemy is in it, and it ends with the minute.
- **Perfected Mind:** for a mental spell the module resolved with a Will save on the caster, whose Effects are still on them, the caster rolls a new Will save against that DC. A better result replaces the old row's Effects with the new row's (its PF2e Effects and timed conditions); an equal or worse one changes nothing. Once per effect.

**Scene features (Wall of Shrubs, House of Imaginary Walls, Hologram Cage; note-only before).**
- **Wall of Shrubs:** the 60-foot line is placed for the rank's duration (1 minute; 10 minutes at 3rd; 1 hour at 5th). From 3rd rank it's PF2e difficult terrain. The cover it gives (lesser; standard at 3rd; greater at 5th), the Climb DC 15 and the 5th-rank ring are on the caster's Effect; the GM judges an attack's line.
- **House of Imaginary Walls:** a Foundry wall along the placed 10-foot line blocks movement, but not sight, since the wall is invisible. It lasts 1 round. Disbelief and its immunity, and the wall's AC 10, Hardness 2 × rank and HP 4 × rank, are on the caster's Effect.
- **Hologram Cage:** the cube's four edges become Foundry walls that block sight but not movement, with a light at its centre (bright 10 feet and dim 30 feet beyond the walls, approximated from the centre). A new cast ends the last cage, and it goes when the minute ends. From 7th rank the cube is 25 feet.

**The effect before the table, with its rules, for each row's duration (Revealing Light, Brand the Impenitent; Penumbral Shroud's bonus).**
- **Revealing Light:** the target is Dazzled for its row's duration. An invisible creature also gets Concealed. That other effects' concealment ends is a note.
- **Brand the Impenitent:** −1 status to AC against attacks by followers of the caster's faith, behind a toggle the table switches on. The critical failure has an unlimited duration.
- **Penumbral Shroud:** +1 status to saves against light effects, as a modifier.

**Forced movement (Boneshaker, Retrieving Hook).**
- **Boneshaker:** the variant you cast decides the rows. The 3-action version lets you move the target up to 5 / 15 / 25 feet (it can fall Prone instead), and its critical failure knocks it Prone. The 2-action version doesn't move it.
- **Retrieving Hook:** a failure or critical failure pulls the target to the nearest empty space next to you. The critical failure also leaves it Off-Guard for 1 round.
- The card tells the GM the move; the token is moved by hand.

**Target lines with a limit (e.g. Lock Item, Aberrant Whispers).** A spell's stated target limit is checked on the save card:
- **From PF2e's data:** size, traits (such as not incorporeal), living or undead, not the caster, taking persistent bleed damage, foes only.
- **Otherwise a GM question:** for example, whether the creature is flying or on the ground.

A creature that doesn't qualify is shown as ineligible and isn't affected.

**Falls a row states (Dimensional Drop, Unrelenting Gravity).**
- **Dimensional Drop:** "falls 20 feet (40 feet) through the void" is falling damage: 10 (20) bludgeoning, half the distance.
- **Unrelenting Gravity:** a failure or critical failure is Prone and Encumbered for 1 round. Whether the spell makes the creature fall (from a height) is the GM's; the card's GM note gives the Arrest a Fall rule (your spell DC, or no Arrest a Fall and doubled falling damage).

**A condition floor while the creature bleeds (Horrifying Blood Loss).** A failure is Frightened 2, a critical failure Frightened 3. Until the creature stops taking persistent bleed damage, its Frightened can't drop below 1: a floor Effect holds it and is removed with the last persistent bleed condition. Only a creature taking bleed damage can be targeted; the 4th-rank secondary targets are the GM's.

**Initial and persistent damage by row (Acid Grip, Combustion).** The spell's damage and the persistent damage written in its introduction are read row by row: half and no persistent on a success, full and persistent on a failure, and double on a critical failure. The critical failure's persistent amount is doubled only when the row says "double … persistent" ("full persistent damage" isn't doubled). A fixed persistent amount grows as the Heightened entry says.
- **Acid Grip:** the card tells the GM the caster may move the target up to 5 / 10 / 20 feet in any direction. On a failure or critical failure, PF2e's Spell Effect (−10-foot status penalty to Speeds) is applied and removed with the persistent acid.

**A variant's paragraph over PF2e's variant data (Disorienting Flash).** When the paragraph for the number of actions spent states other damage or another area than PF2e's variant ("This spell deals 2d10 sonic damage, and its area is a 20-foot burst."), the text's is used: its damage is rolled (heightened as usual), and a data note on the card names the difference. The damage must be the variant's one entry of the same type.

**A basic save in the sentence after the damage (Inner Radiance Torrent).** "… deal 4d4 force damage to all creatures in a 60-foot line. Creatures in the area must attempt a basic Reflex save." is read like a one-sentence basic save.

**A row that is only behaviour (Paranoia, Vicious Jealousy).** A result row that applies nothing and says only how the creature behaves becomes one note Effect with the row's text, for the row's duration ("The spell ends after 1 round.", "For 1 round, …", "As success, but the effect lasts 1 minute.", or the spell's). "As failure, except …" rows add their text to the failure's note. A row with any roll rule, number, damage, condition or its own timing ("within the next hour") isn't read this way.

**A flat check when the creature acts (Binding Muzzle).** "… must succeed at a DC 11 flat check to Cast a Spell with verbal components" (or "when attempting to Cast a Spell …", "… or the action is lost") is rolled when the creature acts, which the module can't intercept: the row's note carries it, with the check's roll link. Binding Muzzle: 1 round on a success, 1 minute on a failure (plus the flat check) and on a critical failure (plus "can't speak").

**Stuck to the caster (Frog Tongue).** On a failure the creature takes the damage and is stuck:
- **The creature:** Off-Guard for the spell's duration, ended by a successful Escape against the spell DC, and a "Stuck" note with what the GM plays: it can't move beyond the tongue's reach, severing the tongue (a Strike dealing at least 10 slashing damage against AC equal to the spell DC) ends the spell, and so does the caster moving it out of reach.
- **The caster:** a note with −2 circumstance to checks of spells and actions with the auditory trait, made for each stuck creature and removed automatically when that creature's Off-Guard Effect ends.

**A condition without a check (Blur, Loose Time's Arrow).** "It becomes Concealed." (after a sentence naming the target) and "All affected targets are Quickened." (Target: up to N creatures) apply PF2e's condition to each targeted creature for the spell's duration, with a note of the spell's other rules.

**Living creatures in an area (Sudden Blight).** On an instantaneous basic save with an area and no Target line, "Each living creature in the area takes …" checks each target is living. "You can also direct the blight to rot all Small and Tiny non-creature plants in the area, …" (with its counteract sentence) is the caster's terrain option, shown to the GM on the card.

**Sustained with no listed duration; Prone; "then" rows; a row's penalty (Laughing Fit, Calm).**
- A sustained spell with no listed duration can be Sustained for up to 10 minutes (Player Core).
- Prone never takes the spell's duration: it lasts until the creature Stands, even after the spell ends.
- "It then takes the effects of a failure." gives the critical failure the failure row's effects and notes too.
- A row whose only rule is a stated penalty ("Calming urges impose a -1 status penalty to the creature's attack rolls.") is a note Effect with that modifier, for the row's or the spell's duration. A PF2e Effect linked for exactly that modifier is replaced, with a data note.
- "As failure, but hostility doesn't end the effect." is the failure's note plus "But: …".

**Heightened versions.** A spell cast heightened uses its Heightened entries:
- **Duration changes:** "The duration increases to …", "The spell lasts 1 minute, …", "The symbol remains until the next time you make your daily preparations". These set the created Effect's or note's duration at that rank.
- **Bonuses and choices:** PF2e's own Effects scale with the cast rank.
- **Behaviour changes:** shown on the spell's note at that rank.
- **Secondary targets (Horrifying Blood Loss at 4th):** up to four creatures that aren't bleeding join as secondary targets, each with the GM's question (can it see the primary target?). Their Frightened floor ends when the primary target stops bleeding.

**Heightened rows (rank 1 check).** A fixed-rank Heightened entry that rewrites a save's rows is used from that rank on:
- Sleep at 4th: Unconscious for 1 round / 1 minute, and Prone, with no waking by Perception.
- Mushroom Patch at 9th: Blinded instead of Dazzled.
- Zenith Star at 4th: its note adds ignoring Concealed.
- Divine Plagues at 5th: Pseudo Afflictions' plague is made virulent, with its conditions at value 2.

A note spell's heightened counteract ("You can target an alchemical elixir …, attempting a counteract check against it") gets a Counteract button on its card. PF2e's fixed-level heightening data (Dehydrate's 4d6 at 3rd, Fear's 5 targets) is applied when the spell is rolled at that rank.

**Damage when the creature acts; a floor until it does something; a reduction by rank (Frozen Lungs, Ghoulish Cravings, Imprinting Hand).**
- "For the spell's duration, the target takes @Damage[…] damage whenever it performs an auditory action or Casts a Spell." puts the row's formula on the creature's note. Ongoing spells has a control to deal it each time the GM reports such an action, at the cast rank.
- "… Sickened 2 and can't reduce this condition below sickened 1 until it first consumes some raw meat; …" holds the floor on an Effect until the GM deletes it (when it eats). The rest of the sentence is the Effect's note.
- "The first time within the next minute … that healing is reduced by 8. …" with rows "half / the full / double the healing reduction" and "Heightened (+1) … increase by 4" becomes a note on the creature with the number at the cast rank and row. PF2e can't reduce healing itself.

**Behaviour while the row's condition lasts (With Friends like These).** "While sickened this way, it doesn't treat any other target of the spell as an ally." and "As failure, and it can't end a move action within 10 feet of any other target as long as it is sickened." are notes on the creature that end with that condition's Effect (when it recovers from Sickened, the notes go).

**A compulsion that repeats, shortened by a save (Charitable Urge).**
- "On its next turn, before it does anything else, the target must …" is a note for its next turn. A condition it "can choose to be" instead is its option, not a grant.
- "As failure, except the duration is 4 rounds, and the target must repeat the effects of a failure on each of its turns. At the end of each of its turns, the target can attempt a new Will save to reduce the remaining duration by 1 round, ending the effects entirely on a critical success." is a 4-round note with that end-of-turn save (Ongoing spells prepares it when the creature's turn ends).
- "If the target has no items on its person, the spell fails." is the GM's question per target.

**Willing allies auto-fail (Retrieving Hook).** "If the target is a willing ally or unattended object, they automatically fail the save." is a card reminder; the GM sets that target's result.

**A condition only in a stated situation; a creature ability (Fear the Sun).**
- "If the creature is already exposed to bright light, it immediately becomes Blinded until the end of its next turn, as it …" puts a Yes / No question on the card for that target ("Is it already exposed to bright light?"). Finalize waits for the answer; Blinded is applied only on yes.
- "The creature gains Light Blindness for 1 minute." (a bestiary ability) is a note for that time with the ability's link.

**A cloud that hinders flyers (Ash Cloud).** "The cloud is difficult terrain for flying creatures, and creatures in the cloud can't detect anything using their sense of smell." makes the region difficult terrain for flying only, and the GM gets the rest as a note. "Creatures that start their turn within the cloud take 2d4 fire damage as …, with a Fortitude save." is the start-of-turn save.

**A held item's heat (Heat Metal).** Inline persistent damage beside the initial damage, rows reading "the object deals no / full / double persistent damage", and "the creature can Release the item to improve their degree of success by one step" (the GM's yes on the card).

**A death and its reward (Death Knell).**
- "1 living creature that has 0 HP" is checked on each target.
- "The target's Dying value increases by 1." raises Dying through PF2e; at its maximum the creature dies.
- "The target dies." sets PF2e's Dead status.
- "If this kills it, you gain …" with the Spell Effect linked after the table gives the caster that Effect once, when the spell kills a target. The Effect's rules must be the sentence's.

**A penalty while the persistent damage lasts (Teeth to Terror).** "The target takes a -1 circumstance penalty to Strikes with its jaws or teeth while it is taking persistent mental damage." is a note with that penalty on the Strikes so named (PF2e's item slug), on the rows dealing the persistent damage; it goes when the persistent damage ends. A critical failure may say "full damage", and the Heightened line may add targets first.

**Icy ground after a cast-time save (Rime Slick).** "When you Cast this Spell, you deal 2d4 cold damage to each creature in the area (basic Reflex save)." then "You also create a layer of ice on all surfaces in the area, which become difficult terrain." keeps the area as terrain for the duration. "If a creature in the area critically fails its Reflex save and was standing, it also falls Prone." is the critical failure's Prone. The sentences about unattended objects and melting are GM notes.

**A save on each Sustain, and the caster's own result (Mind Games).** "The target must attempt a Will save. Each time you Sustain this Spell, the target attempts another Will save." saves when cast and on each Sustain. A row "You are Stunned 1 and the spell ends." stuns the caster and ends the spell.

**A veil for creatures not immune (Veil of Spirits).** "When a creature that isn't immune to spirit damage begins its turn within the area, it must attempt a Reflex save." exposes only creatures PF2e doesn't list as immune to that damage. The linked degree-choice Effect's rows may give "a weakness to <type> damage equal to (half) your level until the beginning of its next turn"; the Effect lasts until the start of the creature's next turn. "A creature with <sense> can't use that sense while it's <condition> in this way." is a note. "You can Dismiss the <noun>." works when the noun is the spell's own.

**No-save spells as notes.** A spell with no check is a note unless it states a mechanic the module must automate. These also read as notes:
- a "see text" duration with "… or after 24 hours, whichever comes first" (that's the note's duration);
- a conjured creature's statistics ("The mount … has a Speed of 40 feet", "The carrier has your AC and saves") when the text says "You create/conjure a … creature";
- numbers given to a targeted object ("grant resistance 10 to acid and a +2 bonus to saves …");
- bonuses tied to a situation ("to those saving throws", "Anyone Tracking you gains …").
- "Heightened (8th) The duration is unlimited." makes the note unlimited from that rank.
- The spell's own counteract ("the spell attempts to counteract any poisons in the food or water"; "You can attempt a counteract check against magical … in the area, making it … for the duration if you succeed") is a Counteract button on the note card.

**A concealing cloud (Mist).** "All creatures within the mist become Concealed, and all creatures outside the mist become concealed to creatures within it." with an area, a fixed duration and no save: the placed area keeps creatures inside Concealed (with the flat-check note for those outside) as they move. "You can Dismiss the cloud." is the caster's Dismiss.

**Clouds, laments and darkness (no save).**
- A concealing cloud may be sized by the actions spent ("The number of actions you spend when Casting this Spell determines its area." with a 1/2/3-action paragraph each). "… take a –2 circumstance penalty on Perception checks to hear" becomes a "Perception check to hear" toggle on the creature's in-area Effect.
- "Enemies in the area are Off-Guard against your attacks and gain no benefits from flanking you for the duration." (a 1-round emanation): each enemy (PF2e alliances) within range is off-guard against the caster's attacks only, until the start of the caster's next turn.
- Darkness's text makes its placed area fully dark for the duration (Foundry's darkness level); light sources and magical light are GM notes.

**Maneuvers with a spell attack roll (Telekinetic Maneuver, Vanish Weapon).** "You can attempt to Disarm, Shove, Reposition, or Trip the target using a spell attack roll instead of an Athletics check." (or "the triggering creature" for a reaction) posts a card with a button per maneuver. Each rolls PF2e's action with the spell's spellcasting statistic, and the module applies its result (Prone, Trip's 1d6, PF2e's Disarm Effect, the caster's Prone or off-guard on a critical failure); movement is the GM's.

**Repeated weapon attacks, objects, GM-triggered hazards.**
- Spiritual Weapon / Spiritual Armament: a spell attack when cast and on each Sustain (from the spell's card), the caster picking the damage type each time from the text's types.
- "You deal 2d10 sonic damage to the object, ignoring the object's Hardness if it is 4 or lower." on an unattended object: the card rolls it at the cast rank and states the Hardness; the GM applies it.
- "enemies who move into the dust trigger explosions, taking 1d4 fire damage for every square they pass through" and "When a creature within the area uses a fire effect or receives fire damage, the sap ignites, dealing … persistent fire damage to anyone standing on it; this burns up the sap …": the GM's control in Ongoing spells rolls and applies the damage to the targeted creatures (per square, or igniting and ending the spell).

**A spell attack with trait extras and a situational die upgrade (Sun Blade); healing as the target bleeds (Draw Blood).**
- "If the target is unholy, the ray deals an additional 1d4 spirit damage, and if the target is undead, …" adds each trait's extra damage (PF2e traits).
- "You must be wielding a sword or spear to cast …" is the GM's question on the card.
- "If you are in an area of bright natural sunlight, increase the die size of each damage die by one step" is the caster's question, enlarging every die.
- "For the duration of the spell, you regain … Hit Points each time the target takes bleed damage." leaves a note on a hit; the GM's control in Ongoing spells heals the caster.

**A hit that leaves a damaging puddle (Disintegrating Puddle).** "On a success, the target takes 2d12 acid damage, and acid splatters to the ground in the target's space and all spaces adjacent to the target." with "The acid puddle lasts for 1 minute; a creature that enters or starts its turn in the acid puddle takes … damage." draws the puddle around a hit target; entering it or starting a turn in it deals the damage (no save).

**Stealing and extracting.** "you can use the Steal action to attempt to take one Lore skill proficiency / one of the foe's prepared spells …" with "If you succeed at your check to Steal …, you deal NdX mental damage … per proficiency rank / per rank of the spell stolen" gives the caster a note and a Steal card (PF2e's Steal; the GM names what was taken; the module rolls and applies the damage). Extract Poison's counteract is a card button; on a success PF2e's Effect coats the held weapon until its next damage roll.

**Blasts from the caster's own creatures (Final Sacrifice, Bony Barrage).** "The target is immediately slain, and the explosion deals … to creatures within 20 feet of it with a basic Reflex save." with "If the target has the cold or water trait, the spell deals cold damage …": the card asks which minion; it's slain and its trait sets the damage type. "Destroy the target thrall, and each creature in a 30-foot cone … with a basic Reflex save." with the second thrall's bone armor: the card reminds the GM about the thrall and asks about the bone armor (no damage and +1 AC for the caster and its allies).

**A constellation's blast (Shining Starlight Attack).** An "Area varies" spell whose table names, per constellation, the area, the save and the damage type: the cast asks for the constellation (defaulting to PF2e's Starlit Sentinel flag), then it's an ordinary basic save of the enemies in the area with that save and type.

**A data save the text never mentions (Impart Empathy, Fate's Travels, Painted Scout).** A non-basic save in PF2e's data, with no results table, and a text that never mentions a save: a note.

**Save or fall Prone (Carrion Mire).** "must succeed at a Reflex save or fall Prone" is read as a table: Prone on a failure or critical failure. A sustained area whose creatures save at the cast and at the start of their turns (once a round). The vitality-healing counteract is a GM note.

**A trapping cage (Osseous Cage).** Creatures in the space save; on a failure they're Immobilized until they Escape (spell DC), and the Effect ends with the spell. The other exits, the cage's AC, Hardness and Hit Points, its lesser cover, the size limit and the Heightened step are the GM's reminder on the card.

**Persistent rows ending their conditions, and a trait's extra dice (Worm's Repast).** Rows that read the initial and the inline persistent damage apart, with conditions "for as long as it takes persistent damage" (they end with it). "If the target is a non-skeletal corporeal undead creature, you deal an extra …": a creature with PF2e's undead trait and not the skeleton trait takes the extra dice in the same persistent damage.

**Damage per creature the target damaged (Warrior's Regret).** A note whose Ongoing control asks the GM, at the end of the creature's turn, how many different creatures it damaged (at most the stated number), and deals that many dice. Once on a success; each turn on a failure until a turn with none; each turn on a critical failure until the GM ends it.

**A reaction's blast and move (Pyrefowl Rebuke).** The triggering creature (targeted) saves; the caster's move away, with its distance at the cast rank, is a reminder on the card.

**Damage only to a trait's creatures (Quench).** Only creatures with the trait in the area save. The counteract against one effect is the card's button; fires, the item and artifact rules, the Sustain's move and Counterspell are the GM's reminder.

**Information revealed (The Parrot's Whisper).** The module reads the creature's highest weakness from PF2e and whispers it to the GM and the caster's owners. It does so immediately, or at the start of the caster's next turn when the text says so.

**A failed save that benefits the caster (Mental Map).** PF2e's linked Effect goes on the caster when a target gets that row. Its rules must be exactly the stated bonus. "The target can choose to fail" means the GM sets the result.

**A target object's pulse (Metal Reverberation).** Damage to the creatures in the object's space and the adjacent spaces when cast and on each Sustain: a 5-foot emanation the caster places on the object.

**A save the GM triggers (Bralani Referendum).** The conditions are chosen when the area starts. When a creature in the area inflicts one, the GM targets it and uses the spell's Ongoing control; it saves once a round.

**Damage each day (Feast of Ashes).** A note for the spell's duration whose Ongoing control deals the day's damage when the GM reports a day has passed.

**Disbelieving an illusion (Phantasmal Treasure).** A Disbelieve control rolls the creature's Perception against the spell DC when the GM says it interacts with the illusion. A success ends the spell.

**Making a creature the caster's minion (Shadow Zombie).** A note with the stated resistance, immunity and Speed as PF2e rules. The caster's player owns the creature, which has the minion trait, until the note ends; then both are restored.

**A conjured creature with statistics (Avenging Wildwood).** The module makes it as a temporary NPC token with the stated AC, saves and Hit Points at the cast rank, owned like the caster. Its Strikes are spell attacks from the card, against creatures within its reach. It's removed with the caster's Effect when the spell ends.

**Images that take attacks (Mirror Image).** PF2e's Effect counts the images. The Ongoing controls roll the stated odds when an attack would hit or critically hit, and destroy an image on a miss. The last image ends the spell.

**A proved Effect + note (See the Unseen).** When every rule sentence is one of the linked Effect's rules and the rest is the GM's, the spell is automatic. The Effect gets the heightened duration.

**Resistance against the triggering effect (Warping Pull).** PF2e's resistance Effect is removed once the creature has taken that damage.

**Counted wisps (Flame Wisp).** PF2e's Effect adds the wisp's dice to every Strike; the text spends a wisp each time. The module removes that rule and counts the wisps. A control sends one at the creature a Strike damaged, and another adds one when a fire spell is cast.

**Stored armor (Instant Armor).** The worn armor comes off when cast. Using the granted Armor Up! puts it back on and ends the spell.

**A save the target triggers (Albatross Curse).** PF2e's first Effect when cast. When the target kills the albatross, the GM's control rolls its save and applies the row. The roll-twice Effects go after the next Will save, as the text says.

**A sustained aura's trigger.** An emanation, sustained, no Target, no damage, and no table:

```html
<p>… When an enemy in the aura critically fails a Strike against you, they must succeed at a Reflex save or become @UUID[…]{Off-Guard} until the end of your next turn. When you cast or sustain this spell, you can either Step, @UUID[…]{Shove} … or jump 10 feet … .</p>
```

- **Casting it:** the cast puts a marker on the caster for the spell's duration. It must be sustained; a missed Sustain ends it.
- **The trigger:** each time, **Trigger** (with that enemy targeted) opens a save card. A failure applies the condition for its stated time, and the spell stays.
- **Notes:** “When you cast or sustain this spell, you can either …” is a note on the marker. One opening sentence of narration is allowed.

### An Effect lasting while the persistent damage does

The row deals the spell's persistent damage and links a PF2e Effect with an **unlimited** duration. The Effect is removed when the creature no longer has that persistent damage.

- **In the row:** “Until the bleeding stops, the target has weakness 1 to piercing and slashing damage. @UUID[…]{Spell Effect: …}” (also “While it's taking this persistent <type> damage, …” or “As long as it is taking persistent <type> damage, …”). The Effect's `Weakness` rules must give exactly that. A predicate may only be `self:condition:persistent-damage:<type>`. “As failure” rows inherit it.
- **After the table, chosen by degree:** “While it's taking this persistent poison damage, it has weakness 1 to fire and weakness 1 to slashing.” in each row it applies to, and one Effect link after the table. The Effect has one ChoiceSet with a `flag` whose choices are labelled `PF2E.Check.Result.Degree.Check.failure` / `…criticalFailure` with number values, and `Weakness` rules whose value uses `{item|flags.system.rulesSelections.<flag>}` (and optionally `@item.level` arithmetic). The module presets the degree's value; the weakness at the cast rank must match each row.

### An Effect in a degree row

A PF2e Effect linked inside a row (not after the table) is applied on that row when one sentence of the row states exactly its rules and duration:

- “The creature (is distracted by its amusement and) takes a -1 status penalty on/to Perception checks and Will saves for 1 round.” Also “for 1 minute” or “until the end of your next turn”.
- The Effect's rules must all be unconditional `FlatModifier`s of that type and value, on exactly the named statistics: Perception checks, Fortitude/Reflex/Will saves, saving throws, attack rolls, AC, skill checks or damage rolls. Its duration must be the stated one: 1 round ending at a turn's start, 1 minute, or 1 round ending at a turn's end.
- Words before “and takes” may only be narration, with no numbers, conditions or rules.

## 3b. Lingering damage areas

For an area that stays for a while and hurts creatures in it:
- **Defense:** a **basic** save.
- **Damage:** exactly one damage entry.
- **Area:** a **burst**, **cylinder** or **cube** (placed by the caster) or an **emanation** (around the caster).
- **Duration:** `N rounds` or `N minutes`. A **sustained** duration works too, and so does no duration with “before the start of your next turn” (see below).

Write the trigger and the damage:

```html
<p>A squall of thorns whirls through the area. A creature that enters the squall or starts its turn in the squall takes 2d10 piercing damage with a basic Reflex save. A creature can take damage from the thorns only once per round.</p>
```

**Triggers**, in any combination:
- “enters the <area>”;
- “starts/begins its turn in the <area>”;
- “ends its turn in the <area>”;
- “enters or ends its turn in the <area>” (and “enters or starts its turn in …”);
- “is inside the <area> when it's created / when you Cast the Spell”, which also hits creatures already inside on casting.

**Other forms that work:**
- The subject can be “A creature”, “Any creature”, “Each creature”, or “A creature other than you” (which excludes the caster). “Each enemy” / “An enemy” exposes only enemies of the caster (see *Enemies only* in section 3).
- “You deal 3d8 acid damage to each creature that starts its turn in the area (basic Reflex save).” also works.
- The damage may also be a sentence of its own after the trigger: “It takes 2d10 slashing damage with a basic Reflex save.”
- The dice and type must match the damage entry.
- A short “as …” clause may end the damage sentence: “… takes 1d6 piercing damage as the birds peck at it.”

**Optional sentences:**
- “A creature can take damage from the <noun> only once per round.”
- “At the end of the duration, the … fall harmlessly …” (narration).
- Up to two opening sentences of narration.
- **Concealment:** “All creatures within the <area> become concealed, and all creatures outside the <area> become concealed to creatures within it.”

**Concealment.** With that sentence, every creature inside the area gets an Effect (“<spell>: inside (concealed)”) that grants PF2e's Concealed condition. An emanation counts the caster as inside. The Effect also adds a note to that creature's attack rolls: creatures outside are concealed to it (DC 5 flat check). PF2e doesn't roll concealment flat checks automatically, so the table rolls them. The Effect follows the area: it's added when a creature enters and removed when it leaves or the spell ends.

**Sustained areas.** With Duration `sustained up to 1 minute`, the caster's turns in combat ask for **Sustain** in the Ongoing spells panel. A Sustain that isn't done before the caster's turn ends ends the spell and removes its area and concealment. A spell cast before combat asks for Sustain on the caster's first turn in the encounter. Sustaining only keeps the spell going; it doesn't add damage.

```html
<p>A swarm of moths flutters around you. All creatures within the moth cloud become concealed, and all creatures outside the moth cloud become concealed to creatures within it. A creature other than you that enters or ends its turn in the area takes 1d6 slashing damage as the moths batter it.</p>
```

With a 10-foot emanation, `sustained up to 1 minute`, and one 1d6 slashing damage entry with a basic Reflex save, this is a sustained lingering area with concealment.

**When cast, the card shows “Place Lingering Area”:**
1. You place the template.
2. The module then watches the area: creatures entering it (token moves), and creatures starting or ending their turns in it (combat turns).
3. Each exposure appears in the **Ongoing spells** panel for the GM to confirm or mark unaffected, which accounts for walls, flying and so on.
4. Confirmed exposures get a normal save card.

The spell ends at the end of its duration, or when the area is deleted.

**Damage when cast and on each Sustain.** A sustained area can deal its damage when cast and again when Sustained:

```html
<p>Embers swirl through the area. When you Cast the Spell and the first time you Sustain it each round, each creature in the area takes 2d10 slashing damage (basic Reflex save).</p>
```

Creatures inside when it's cast are exposed. The first Sustain each round exposes everyone inside at that moment. Entering or starting a turn inside doesn't count unless the text says so. If the spell lets the caster move the area, drag the area first, then press **Sustain**. The damage must match the damage entry.

**Different damage on Sustain.** Put the cast damage and the Sustain damage in two sentences:

```html
<p>Debris lifts from the ground and hurls itself around. This assault deals 2d10 bludgeoning damage (basic Reflex save) to each creature in the area. On subsequent rounds, the first time each round you Sustain this Spell, it deals @Damage[(floor(@item.level/2))d10[bludgeoning]] damage (basic Reflex save) to each creature in the area.</p>
```

The first sentence must match the damage entry; that damage heightens with the item as usual. The second is its own `@Damage[...]` formula, of the same damage type and save. The formula may use only `@item.level` or `@item.rank` (the cast rank), so it heightens by itself. Each Sustain exposure rolls that formula once for the card, halved or doubled by each creature's result.

**Areas with a degree-of-success table.** A save with a Critical Success / Success / Failure / Critical Failure table can also linger. One sentence before the table says who saves and when:

```html
<p>Choking dust fills the area. Each creature in the area when the spell is cast or that ends its turn in the area afterward must attempt a Fortitude save.</p>
<p><strong>Success</strong> The creature is unaffected.</p>
<p><strong>Failure</strong> The creature is @UUID[Compendium.pf2e.conditionitems.Item.fesd1n5eVhpCSS18]{Sickened 1}.</p>
<p><strong>Critical Failure</strong> The creature is @UUID[Compendium.pf2e.conditionitems.Item.fesd1n5eVhpCSS18]{Sickened 2}.</p>
```

Use the degree-table rules from section 3 for the outcomes, and a non-basic save on the item.

The sentence is any mix of:
- “(each creature) in the area when the spell is cast / when you Cast the Spell”;
- “enters the area”;
- “starts/begins its turn in the area”;
- “ends its turn in the area (afterward)”;
- “enter or begin/end their turn in the area” (plural subjects also work);
- “When you Cast the Spell and the first time you Sustain it each round, each creature in the area …”;

followed by “must attempt a Fortitude/Reflex/Will save”. The damage can come first: “… takes 1d4 mental damage and must attempt a Will save”, or as its own sentence followed by “An affected creature attempts a Fortitude save.” (“… the first time you Sustain it each turn on subsequent rounds, each creature in the area takes 7d6 spirit damage. An affected creature attempts a Fortitude save.”). It must match the spell's only damage entry, and the table then scales it (“takes half damage”).

The subject must be plain (“each creature”, “any creature that”, “a creature that”, “each round that a creature”) or name enemies (“each enemy”, “an enemy that's in the area when …”). Enemies are handled as in *Enemies only*: the caster and its allies never trigger the area. Other words that narrow the subject, such as “living creatures”, “Medium or smaller” or “unless it's already grabbed”, block the spell, because the module can't check them yet.

A save only when the spell is cast (“Creatures in the area when you Cast the Spell must attempt a Will save.”) is an ordinary area save, not a lingering one.

**A sustained save on the spell's target** (no area; Target `1 creature`; sustained): “The target is cloaked in the freezing void, which deals 3d6 cold damage immediately and the first time each round you Sustain the Spell on future turns, with a basic Fortitude save.” Optionally add “The target is Fatigued for as long as the effect persists.” The chat card's **Start Sustained Spell (targeted creature)** starts it for the targeted creature. The target saves when cast and again on each Sustain, and holds the condition until the spell ends.

These already-supported rules work with it too: “Objects are unaffected.”, a creature-trait degree rule (“Plant creatures use the outcome one degree of success worse …”), and a GM-confirmed immunity (“Creatures whose bodies contain no significant moisture (such as fire elementals) are immune to <spell>.”).

**Duration:** a sustained spell with no stated maximum lasts up to 10 minutes. `sustained up to 1 minute` is also read.

**Difficult terrain.** An area can be terrain, with or without lingering damage:
- “The ground in the area becomes difficult terrain for the duration of the spell.”
- “Until the start of your next turn, the area is difficult terrain and hazardous terrain.”: with no Duration on the item, this sentence sets the lifetime.

The module gives the area's region PF2e's difficult-terrain movement cost (ground movement costs double), removed when the spell ends.
- **Hazardous terrain** needs its damage: “Any creature entering the square takes @Damage[(1d4 + ceil(@item.level / 2) - 1)[piercing]] damage with a basic Reflex saving throw.” Entering rolls that formula (which may use only the cast rank) instead of the item's damage.
- **Damage when cast:** “Any creature in the area takes 1d4 piercing damage with a basic Reflex saving throw.” or “The scattering rocks deal 2d4 bludgeoning damage (basic Reflex save).” (matching the damage entry).
- **Optional:**
  - “A creature can Interact to clear a square of this scree.”: a GM note; edit the region to remove the square.
  - “If you cast this spell again, any previous <spell name> you've cast ends.”: casting again ends the caster's earlier area of that spell.
- **Area:** a line or cube works as well as a burst.

Also read:
- **Damage when cast with narration first:** “Sharp flowstone formations protrude from the ground and ceiling, dealing 6d6 piercing damage to creatures in the area with a basic Reflex save.”
- **Terrain after a short narration:** “Densely packed with protrusions, the area becomes difficult terrain for the duration.”
- **An ending note:** “The protrusions turn to dust when the spell ends.”
- **Dismiss:** “You can Dismiss the spell.” gives the Ongoing spells panel a Dismiss control that ends the area.

**Degree-save areas with terrain:** a degree-table area may also state its terrain (“All surfaces in the area are difficult terrain.”, “The area becomes difficult terrain, similarly to a shallow bog.”). Terrain wording the module can't read blocks the spell (`preamble:terrain`) rather than being dropped.

**Inline results that last until the creature leaves the area.** After the trigger sentence:

```html
<p>All surfaces in the area are difficult terrain. Each round that a creature starts its turn in the area, it must attempt a Reflex save. On a failure, it takes a –10-foot circumstance penalty to its Speeds until it leaves the area, and on a critical failure, it's also @UUID[…]{Immobilized} for 1 round. Creatures can attempt to @UUID[…]{Escape} to remove these effects.</p>
```

- **The results are read as a table.** The penalty has no timer: it ends when the creature leaves the area, or when the area ends. The critical failure adds the named condition (“knocked Prone”, or “Immobilized for 1 round”).
- **The optional Escape sentence** lets a successful Escape against the spell DC end both the penalty and the condition in one check. The Escape card ends a cast's Effects together.
- **A linked Effect** whose only rule is that same Speed penalty (PF2e's convenience copy) is set aside.
- **An area detail** “… that contain plants” becomes a GM note to trim the region.

Difficult terrain for flying creatures, greater difficult terrain and terrain for only some creatures aren't read yet.

**Several separate areas.** Put an Area paragraph before the text, matching the item's area (here a 5-foot burst):

```html
<p><strong>Area</strong> three 5-foot bursts that don't overlap</p><hr />
<p>You conjure three deadly clusters of flesh-devouring fungi. Whenever a creature starts its turn in one of the clusters or the first time a creature enters a cluster each round, it takes 3d4 poison damage with a Fortitude save as poisonous spores fill the air. Corpses within a cluster rapidly decompose.</p>
```

This works for two to five bursts or cylinders with a degree-of-success table (the damage must match the one damage entry; the table scales it).
- The caster places each area in turn, and areas that overlap are refused.
- A creature in any of the areas counts as inside.
- The text names the areas with their own noun: “one of the clusters”, “a cluster”.
- “the first time a creature enters a cluster each round” exposes an entering creature once per round. Starting its turn in an area still counts.
- Removing one area asks the GM to review; removing them all ends the spell.

An Area paragraph worded any other way blocks the spell (pending `area-paragraph`) rather than being ignored.

**A concealing cloud exposed only when cast.** A basic-save area that only damages when cast lingers if it also conceals:

```html
<p>You emit a cloud of toxic smoke that temporarily obscures you from sight. Each creature except you in the area when you Cast the Spell takes 1d6 poison damage (basic Fortitude save). A creature that critically fails the saving throw also becomes @UUID[Compendium.pf2e.conditionitems.Item.fesd1n5eVhpCSS18]{Sickened 1}. All creatures in the area become concealed, and all creatures outside the smoke become concealed to creatures within it. This smoke can be dispersed by a strong wind.</p>
```

With a 10-foot emanation and Duration `1 round`:
- Creatures inside, except the caster, are exposed when it's cast.
- Everyone inside, including the caster, is concealed.
- It ends at the start of the caster's next turn (any 1-round area does, in combat).
- Degree riders (“A creature that critically fails …”) work as in section 2.
- “This <noun> can be dispersed by a strong wind.” goes into the concealment Effect's description; the GM ends the spell in Ongoing spells when it happens.

Without the concealment sentence, it's an ordinary area save.

**An area until the start of your next turn.** With no Duration on the item, the trigger sentence may set the area's lifetime:

```html
<p>Blades of thought rain down. Any creature that's in the area or enters the area before the start of your next turn takes 4d4 bludgeoning or piercing damage (your choice), with a basic Reflex saving throw.</p>
```

Creatures inside when it's cast are exposed, and so is any creature that enters. In combat the area ends when the caster's next turn starts. Out of combat it ends after 1 round. A **cube** area works here too, as does any area above.

**The caster's choice of damage type.** “takes 4d4 bludgeoning or piercing damage (your choice)” works only when the item's damage entry is the same dice with type **untyped**. The caster picks the type when the area starts, and every exposure's damage is rolled as that type. A typed damage entry, or dice that differ, isn't read.

**A degree Effect that reads the caster's damage type.** A degree-save area's Effect can carry a second ChoiceSet: a flag offering damage types (`energyType`: acid, cold, …), with no predicate. Its Weakness rules read it as `{item|flags.system.rulesSelections.energyType}`. The preamble must list exactly those types:

```html
<p>Choose one type of damage from the following list: acid, cold, electricity, fire, force, or sonic. When you Cast the Spell and the first time you Sustain it each turn, each creature in the area must attempt a Fortitude saving throw.</p>
<p><strong>Critical Success</strong> The creature is unaffected.</p>
<p><strong>Success</strong> The creature gains weakness 1 to the chosen damage type for 1 round.</p>
<p><strong>Failure</strong> As success, except the weakness is doubled.</p>
<p><strong>Critical Failure</strong> As failure, and the creature becomes @UUID[Compendium.pf2e.conditionitems.Item.eIcWbB5o3pP6OIMe]{Immobilized} for 1 round or until they [[/act escape]].</p>
<p>@UUID[Compendium.pf2e.spell-effects.Item.…]{Spell Effect: …}</p>
```

The Effect needs:
- the degree ChoiceSet (see *A degree-of-success Effect after the table* in section 3);
- the type ChoiceSet;
- Weakness rules whose value at the cast rank is the one each row states. “except the weakness is doubled” is twice the named row's weakness; “As failure, and …” keeps it.
- A condition the row names must be the Effect's GrantItem. “or until they Escape” needs that grant to detach, so escaping ends only the condition.

The caster chooses the type once, when the area starts, and every exposure's Effect uses it. Opening narration that only mentions weakness (“… amplifies energy-based weaknesses on creatures inside the circle.”) is accepted with this choice; narration with numbers or other rules isn't.

**Not supported yet:** Mist, areas that move on their own, growing areas, concealment worded any other way, “breathing creatures”, disbelief, extra riders on the damage, and “the first time a creature …” (once per casting).

## 3d. Spell attacks

Give the spell the **attack** trait, **no** save, Target `1 creature`, and one damage entry. Then write the attack in one of these ways:

```html
<p>A bolt of light streaks out. Make a ranged spell attack against the target's AC. On a hit, the target takes 2d4 spirit damage (double damage on a critical hit).</p>
```

Other accepted forms:
- “Make a ranged spell attack roll, dealing 1d8 piercing damage on a success and double damage on a critical success.”
- “Make a spell attack roll against the target's AC. On a hit, the target takes 6d4 piercing damage and is Dazzled for 1 round (double damage and Blinded for 1 round on a critical hit).”
- A table with the hit rows. Put the attack sentence (and optionally the damage, “The ray deals 2d6 bludgeoning damage.”) before it:

```html
<p>You fire a ray of frost. Make a spell attack roll against the target.</p>
<p><strong>Critical Success</strong> The target takes double damage and is @UUID[Compendium.pf2e.conditionitems.Item.4D2KBtexWXa6oUMR]{Drained 2}.</p>
<p><strong>Success</strong> The target takes full damage.</p>
```

**How the rows map:** Critical Success is a critical hit, Success is a hit, and Failure / Critical Failure are misses (unaffected, unless you write a Failure row). Rows use the same wording as a save table (section 3).

**On the chat card:** the card gets a **Resolve Spell Attack** button beside PF2e's own attack buttons. For each target, **Roll Spell Attack** asks which attack this is on the caster's turn, for the multiple attack penalty. It then rolls the caster's PF2e spell attack against that target's AC. Damage and conditions are applied by the result, with the usual GM corrections before Finalize.

**Different action counts.** Two ways work:
- **Only the number of targets changes:** keep one damage entry and say so. “You can spend a third action while casting this spell to fire splinters at two different targets instead of one.” or “For each additional action you use when Casting the Spell, you can fire an additional ray at a different target, to a maximum of three rays targeting three different targets for 3 actions.” Give the Target field the most targets (`1 or 2 creatures`, `1 or more creatures`) and target accordingly.
- **The damage changes:** use PF2e's **variants** (overlays), one per action count, each with its own damage, Target and Time. In the text, say “If you spend 2 or more actions Casting the Spell, the damage increases to 4d6 fire damage on a hit, and it still deals double damage on a critical hit.” Each variant's damage entry must match what the text gives that action count.

Cast the variant from PF2e's card (its variant buttons). The variant's card gets **Resolve Spell Attack**, and rolls use that variant. The base card says which variants are automated. Other things that depend on actions (range, launching, a second casting round) aren't supported yet.

**Silver (or cold iron, adamantine) damage.** Tick the material on the damage entry, then you may say so in the text: “This is silver damage for the purposes of weaknesses, resistances, and the like.” (or “<Spell>'s cold damage is silver damage …”). PF2e's damage roll applies the material to weaknesses and resistances. The sentence is accepted only when the damage entry really has that material; otherwise it blocks the spell. Result rows may say “The beam deals double damage …” as well as “The target takes …”.

**Persistent damage that isn't doubled on a critical hit.**

```html
<p>An arrow of acid flies out. Make a spell attack against the target. On a hit, you deal 3d8 acid damage plus @Damage[(floor(@item.rank/2))d6[persistent,acid]] damage. On a critical hit, double the initial damage, but not the persistent damage.</p>
```

The initial damage must be the damage entry. The persistent roll is added once, undoubled, on both a hit and a critical hit. Its formula may read only `@item.rank` / `@item.level`, so it heightens by itself; the module won't add the Heightened text's increase a second time.

**Pushes and pulls.** These forms are recognised in a result row (“The target takes double damage and you can push it up to 10 feet.”) or in a one-sentence attack (“If you hit, you deal 2d6 force damage. On a critical success, you deal double damage and can choose to detonate your weapon to push the target 10 feet away from you.”):
- “you can push it up to N feet” (optional);
- “can choose to … to push the target N feet away from you” (optional);
- “the target is pulled up to N feet toward you”;
- “is knocked back N feet”;
- “is pushed N feet away from you”.

The card shows each target's movement for their result as a **GM:** note (for example “… is pulled up to 20 feet toward the caster. Move the token; the module doesn't.”). Damage and conditions are applied as usual. Tokens aren't moved automatically, because walls, space and direction are the GM's call. An attack sentence may also say “against your target's AC”.

**Several targets.** A Target of `1 or 2 creatures`, `up to 3 creatures` or `2 creatures` works with “Make a spell attack roll against each target's AC.”
- The card holds one attack per target. Each asks for its attack number, since each attack normally raises the multiple attack penalty.
- If the text says the penalty is shared, the first attack number chosen is used for every target: “If you're attacking two creatures, this counts as two attacks for your multiple attack penalty, but the penalty doesn't increase until after both attacks.” (Or: “Each attack counts toward your multiple attack penalty, but your penalty doesn't increase until you've made all your attacks.”)
- A sentence restating the critical row's persistent damage with its heightening makes the row roll that inline formula. For example, “On a critical success, a target also takes @Damage[(@item.level)d4[bleed]] damage.” with a Critical Success row that names “1d4 persistent bleed damage”.

**Several damage entries.** Give the item one damage entry per damage type (a persistent entry has category **Persistent**; bleed is always persistent), and name them all together in one list:
- “The wire deals 1d4 slashing damage and 1d4 electricity damage, depending on your spell attack roll against the target's AC.” (then a written table);
- “On a success, the icicle deals 2d6 piercing damage and 1d6 cold damage.”;
- “If you hit, you deal 1d8 fire damage plus 1d8 persistent fire damage.”

The list must name every entry exactly once, with its dice and type. A hit deals every entry and a critical hit doubles every entry, persistent ones included.
- **A miss that still deals one entry:** write all four rows, with the Failure row “The target takes the electricity damage, but not the slashing damage.” and the Critical Failure row “The target is unaffected.”
- **Critical hits naming the persistent entry:** “On a critical success, you deal double damage and double bleed damage.” also works.
- **Extra damage by creature type:** “…, and if the target is undead, the icicle deals an additional 1d4 vitality damage. On a critical success, the target takes double damage and takes a –10-foot circumstance penalty to its Speeds for 1 round.” The extra damage is rolled once and applied only to creatures with that trait. It doubles on a critical hit, and “The vitality damage increases by 1d4.” in the Heightened entry heightens it.
- **A choice of damage type:** “you deal your choice of 2d6 slashing damage or 2d6 piercing damage, plus 2 persistent bleed damage”. Make one PF2e variant per type, each with its damage entry set to that type; the base item isn't resolved.

**While the persistent damage lasts.** A condition or Effect can last exactly as long as the spell's persistent damage. The spell needs a persistent damage entry of that type.
- **A condition, in a one-sentence attack:** add “The target is Enfeebled 1 until they recover from their persistent fire damage.” (or “Additionally, the target is Enfeebled 1 until it removes the persistent poison damage.”). The condition joins the hit and critical-hit results.
- **An Effect, before a written table:** add “As long as the target is taking persistent damage from this spell, the target takes a –1 status penalty to saves against electricity effects.” then link a PF2e Spell Effect.
  - The Effect must have an unlimited duration.
  - Every rule it has must be stated in that sentence. That means a status or circumstance bonus or penalty to AC, saves, attack rolls or damage rolls. For attackers' bonuses (an EphemeralEffect on the origin), write “creatures gain a +1 status bonus to attack rolls … against the target”.

Neither gets a timer. When the creature no longer has persistent damage of that type (it recovers, or the condition is removed), the active GM's client removes the condition or Effect. If the creature never took the persistent damage (for example, it's immune), the condition or Effect isn't applied, and the result card says so.

**Splash damage.** Give the item a damage entry with category **Splash** (it can share the main entry's type) and name it in the damage list:
- “Make a spell attack. If you hit, you deal 1d6 acid damage plus 1 splash acid damage. On a critical success, the target also takes @Damage[(ceil(@item.level/2))[persistent,acid]] damage.”
- “Make a spell attack roll. If you hit, you deal 4d8 bludgeoning damage plus 1d4 sonic splash damage. On a critical success, the target is also Deafened for 1 round.”

The Target must be `1 creature`. When cast, the card lists every other creature within 5 feet of the target as **Splash** (no roll):
- **The target:** on a hit, it takes the damage plus the splash. On a critical hit, it takes double the non-splash damage plus the splash once. The splash is added before resistances and weaknesses.
- **Each creature within 5 feet:** on a hit or critical hit, it takes the splash. That includes allies and you, and the GM can exclude any of them.
- **A miss:** splashes no one.

**Choices carried by PF2e variants.** When the text leaves something to the caster, make one PF2e variant per choice. Each variant's item data must agree with the text:
- **A damage type from a list:** “If you hit, you deal 2d6 bludgeoning, piercing, or slashing damage—as appropriate for the object you hurled.” Each variant's damage entry has one of the listed types.
- **A material:** “The needles impart any special properties of the metal that forms them; …” and “All the needles are made of the same metal, and the metal returns to you after the attack.” Each variant's damage entry carries its material (silver, cold iron, adamantine), which PF2e's roll applies against weaknesses and resistances.
- **Action counts:** “The number of actions you spend when Casting this Spell determines its range as well as other parameters.” followed by one paragraph per action count, starting with the action glyph: “This spell has a range of 30 feet.” or “This spell has a range of 60 feet and deals half damage on a failure (but not a critical failure).” The cast variant's Time and range must match its paragraph. The half-damage paragraph gives that variant a half-damage miss. Paragraphs for other action counts (and a “Two Rounds” paragraph) describe other variants.
- **A melee option:** “If the target is within your melee reach, you can choose to make a melee spell attack … which increases all the spell's damage dice to d6s.” Only the ranged variant resolves; the melee one isn't automated yet.

Also accepted in a table's preamble:
- a damage sentence “Make a spell attack roll against the target's AC, dealing 2d4 fire damage on a hit.”;
- a damage sentence “If you hit, you deal …”;
- rows written as “You deal double damage.”;
- “1 Bulk or less” in the narration.

**Attack bonuses that depend on the target.** The GM answers a question for each target on the card, and the answer is added to that target's spell attack roll:
- “Make a ranged spell attack roll; if the target is wearing metal armor or is made of metal, you gain a +1 circumstance bonus to your attack roll with <spell>.” The card asks “Is the target wearing metal armor or made of metal?”.
- “Make a ranged spell attack roll against your target's AC; if the target has any circumstance bonuses to AC (such as from a shield or cover), reduce that bonus by 2 for this attack.” The GM picks None / +1 / +2 or more, and that much is added to the attack.
- A persistent rider for metal targets: “If the target is wearing metal armor or is made of metal, you gain a +1 circumstance bonus to your attack roll with <spell>, and the target also takes @Damage[(1d4+((@item.level)-1))[persistent,electricity]] damage on a hit.” It must be followed by “On a critical hit, double the initial damage, but not the persistent damage.” The persistent damage is rolled once, for the targets marked metal that are hit, and isn't doubled.

Each target's attack can be rolled only after the GM answers. An answer can't be changed after the attack is rolled.

**Cover and concealment rules** (“This attack ignores the target's Concealed condition and ignores all cover except greater cover.”) appear on the card for the GM, who leaves them out of the attack. A Heightened entry that changes the rule is named with its rank.

**A benefit for you, carried by the spell's Effect.** Link a PF2e Spell Effect after the attack and state what it gives you in one clause. The clause must match the Effect exactly: its rules (a bonus or penalty to your AC, saves, attack or damage rolls, a Speed, or temporary Hit Points from a rolled badge such as `(@item.level)d4`) and its duration.
- **Always:** “Regardless of whether you hit, you gain a fly Speed of 15 feet until the end of your next turn.” or “You gain a +1 circumstance bonus to your AC for the duration, as …” (for a spell lasting 1 round).
- **On a hit:** “On a hit, the mouth deals 2d6 piercing damage, and you gain 1d4 temporary Hit Points that last until the beginning of your next turn.” The dice count is the spell's rank.
- **Durations:** “until the beginning of your next turn” and “until the end of your next turn” must be the Effect's 1-round duration with that expiry. “for the duration” must match a spell whose own duration is 1 round.
- **Movement after the attack:** “Then, Swim up to 30 feet; if you already have a swim Speed, you can Swim up to your Speed with a +10-foot circumstance bonus.”, optionally followed by “You gain a +2 circumstance bonus to your AC against reactions triggered by this movement.” and “At the end of the movement, <…> return to normal.”
  - **The proof:** the Effect's speed modifier (`swim-speed`, that value and type) and its AC modifier, lasting 1 round to the start of a turn. The speed named in the sentence must be the movement's.
  - **On the card:** the move is a **Caster:** reminder (move your token yourself). A **PF2e data** note says the Effect's AC bonus applies against everything and lasts until your next turn, so remove it when the movement ends.

When the card is finalized, the Effect goes on you (the result card says so), or not, if it's on-hit and the attack missed. A spell whose own duration is the clause's (“until the end of your next turn”) is fine: the Effect carries it.

**A lodged projectile.** After a one-sentence spell attack: “The spear remains lodged within a creature it hits, making the target Clumsy 1 (or increasing its clumsy condition by 1 if it is already clumsy) for 1 minute or until the spear is removed with a successful Athletics check against your spell DC as an Interact action, whichever comes first.” (the three condition names must match).
- **Hit rows:** the condition is added to both hit rows. Its value is one more than the creature's current value when it already has the condition.
- **Ending:** at the stated time, or when the creature uses an Interact action.
- **Reminder:** a **GM:** reminder says to end it only on a successful Athletics check.

**Result rows, written freely.** In a written table after a spell attack:
- A row may state the damage dice: the entry's own dice read as full damage and twice them as double damage (“The creature takes 4d6 bludgeoning damage” for a 2d6 entry). So heightening scales them.
- Narration after a condition's duration is fine (“… Dazzled for 1 minute as saltwater sprays into its eyes.”).
- A condition can end early on an Interact action. For example: “The creature can spend an Interact action to rub its eyes and end the blinded condition, but not the dazzled condition.” The condition that stays must be another condition of that row.
- A Spell Effects link placed right after a row with a Speed penalty is set aside; the row's text is what's applied.
- The attack may be “against a target within range”.

**Blasts you repeat during your turn.** Use this wording (Target left empty, Duration “until the end of your turn”):
- “For the remainder of your turn, you can blast targets within 30 feet with this fire by spending a single action which has the attack and concentrate traits. When you do so, attempt a ranged spell attack roll. If you hit, you inflict 2d8 fire damage. On a critical hit, the target takes @Damage[…persistent…] damage.”
- Or, for the critical hit: “On a critical hit, the blast knocks the target Prone.”

The spell's chat card button becomes **Blast Again** after each blast. Each click is one blast: target one creature, and a new attack card opens, where you pick the attack number for the multiple attack penalty. In combat, the blasts end when your turn does.

**Attacks repeated on later turns.** Give the spell a fixed duration (for example 1 minute) and one damage entry, then write:
- “You can attack with your words once when you finish Casting the Spell, and can repeat the attack once on each of your subsequent turns by taking a single action, which has the attack, concentrate, and linguistic traits.” (the first clause may name any attack, like “spit at a foe”);
- “After your third attack total, the spell ends.” (second to fifth);
- “When you attack with biting words, make a ranged spell attack roll against a creature within 30 feet, dealing 2d6 sonic damage if you hit (or double damage on a critical hit).” It may instead be “dealing 1d6 acid damage and causing the target to be Dazzled for 1 round if you hit. On a critical hit, you deal double damage and the target takes @Damage[@item.level[persistent,acid]] damage.”

The chat card's button becomes **Attack Again (2 of 3)** after the first attack. In combat, each click is allowed once per turn of the caster's; on another turn it explains why not. Once the attacks are used or the duration has run out, it reads **Attacks Used**. An empty Target is one creature.

**A save after a critical hit.** “If you hit, you deal 4d6 bludgeoning damage plus 1d6 bludgeoning splash damage. On a critical hit, double the initial damage, but not the splash damage, and the target you hit must succeed at a Fortitude saving throw or fall Prone.” The item's save must be that Fortitude save (not basic), and the attack may start “Attempt a spell attack …”. On a critical hit the card asks for the follow-up save; a failure knocks the target Prone.

**Different conditions on a hit and a critical hit.** “On a hit, you deal 2d6 poison damage, plus you blast the target's eyes, making them Dazzled for 1 round as the stinging ink blurs … On a critical hit, double the poison damage, and the target becomes dazzled for 1 minute by the foul ink.” The critical hit's condition replaces the hit's. If it says “double the <type> damage”, the type must be the damage entry's. A trailing cosmetic sentence such as “The ink stain remains for 1 hour before fading, although vigorous cleansing … can remove the ink before then.” adds no rule.

**Target left empty.** If the attack says “Make a spell attack roll against the target.” (or “against the target's AC.”), an empty Target field is read as one creature.

**Reactions against the triggering creature.** With a Target of `the triggering creature` (or `the creature that took damage`), write the attack as “Make a ranged spell attack against the triggering creature's AC.” Target that creature when you cast. A Target like this is refused if the attack doesn't name the triggering creature.

**Only persistent damage.** One persistent damage entry, stated with its dice and type: “On a hit, salt scours its open wound, dealing 2d6 persistent acid damage.” (a short flavour clause before “dealing” is fine). The hit applies the persistent damage and a critical hit doubles it.

**A condition for the spell's duration, ending with its persistent damage.** Give the spell a duration (for example 1 minute) and a persistent damage entry, then write all of:
- “If you hit, you deal 5d10 acid damage and 1d6 persistent acid damage, and the target is Blinded for the duration.”
- “When the target's persistent acid damage ends, the spell automatically ends.”
- Optionally, how the persistent damage can be removed: “The foam can be removed with 3 Interact actions, which ends the persistent acid damage.” (and “These Interact actions don't need to be consecutive.”).

The condition lasts the spell's duration, or until the creature no longer has that persistent damage. The removal sentence appears on the card as a **GM:** note: when the creature has taken those actions, remove its persistent damage condition, and the condition ends with it. Without the “spell automatically ends” sentence, “for the duration” isn't linked and the spell stays unresolved.

**Incapacitation.** A spell attack with the incapacitation trait is rolled by PF2e with the spell and target, so PF2e lowers the result by one degree against a creature whose level is more than twice the spell's rank.

**Heightened condition durations.** “Heightened (+2) … the duration of the deafened condition increases by 2 rounds” lengthens the result's condition for each step above the spell's rank. It needs a fixed interval (`+N`) and a condition that lasts a fixed number of rounds.

**Burning ground (a hazard in the target's squares).** Give the spell a duration of `until the end of the target's next turn` (or a number of rounds or minutes), then write, after the attack:
- “On any result other than a critical failure, the ground in the target's space catches fire, dealing @Damage[(@item.rank)d6[fire]] damage to each creature that ends its turn in one of the squares.”
- The result may instead be “On a hit” or “On a critical hit”, and the trigger “starts its turn”, “enters” or “enters or ends its turn”. The formula may read only `@item.rank` or `@item.level`.

At Finalize, the module places a region (orange) over the target's squares. When a creature ends its turn there (or enters, or starts its turn, as written), the module rolls the damage and applies it. There's no save and no GM prompt. With `until the end of the target's next turn`, the region is removed after that turn's damage. The attack can also be written “The ray deals 2d6 fire damage on a hit (or double damage on a critical hit).”

**Not supported yet:**
- an area, or extra targets that depend on the actions spent;
- pushes and pulls worded any way other than the forms above;
- splash damage with a critical-hit save (“must succeed at a Fortitude saving throw or fall Prone”);
- a persistent-linked penalty with no PF2e Effect (for example “it takes a –1 status penalty to its AC” on its own);
- increasing an existing condition (“or increasing its clumsy condition by 1 if it is already clumsy”), or a condition removed by a skill check;
- any rule outside the attack and its results (terrain, lingering effects other than the burning ground above, extra actions).

## 3e. Spells with a Strike

A spell that has you make a Strike and then does something that doesn't depend on the Strike's result. You make the Strike with PF2e as usual (PF2e rolls it and applies its damage); the module resolves the rest.

**The text:** optional narration (no rules in it), then the Strike sentence, then the rest:

```html
<p>You swing your massive weapon, creating a wave of sonic vibrations. Make a melee Strike with your two-handed weapon. Each creature in a 15-foot cone from you must attempt a basic Fortitude save against your spell DC or take 2 sonic damage. On a critical failure, the creature is knocked @UUID[Compendium.pf2e.conditionitems.Item.j91X7x0XSomq8d60]{Prone}. The target of your Strike must be within the cone or the effect fails.</p>
```

- **Strike sentences:** “Make a melee Strike (with your two-handed weapon | against a creature in your reach).” and “Make a ranged (firearm) Strike.”
- **After the Strike:** “Regardless of the result (of your Strike), …” is fine. The area must be the item's own area (“a 15-foot cone from you”, “a 20-foot emanation around you”, “that cone”). Then write:
  - a basic save (“… must attempt a basic Fortitude save against your spell DC or take 2 sonic damage”, “All creatures in that cone take 6d8 sonic damage (basic Fortitude save).”), optionally with a critical-failure condition; or
  - a one-sentence table (“each enemy in … must succeed at a Will save against your spell DC or be Frightened 1 (or Frightened 2 on a critical failure)”). If the item has no defense set, this sentence supplies the save.
- **Placement rules** (“The target of your Strike must be within the cone or the effect fails.”, “that creature becomes the point of origin of a 15-foot cone, aimed directly away from you.”) appear on the card for the GM.
- **Additional damage on a hit:** “Make a melee Strike against a creature in your reach; if you hit, you deal an additional 3d8 sonic damage.” When the card starts, the caster gets an Effect that adds 3d8 sonic to their melee Strike damage. So it's part of the Strike's own damage roll: it combines before resistances and doubles on a critical hit. The Effect is removed after that damage roll, or at the end of the turn.
- **Requirements** (“You're wielding a loaded firearm.”) belong in the item's Requirements field; the copy PF2e shows in the description is ignored.

**When cast:** the card shows “**Strike:** Make a … Strike. Make it with PF2e's own Strike; PF2e rolls and applies its damage.” and resolves the rest like any save spell.

**A rider that depends on the Strike's result.** This form is read (movement before the Strike is allowed):

```html
<p>A wave of water carries you forward. You Stride up to 50 feet. This movement doesn't trigger reactions. You can make a Strike at any point during your Stride. If your Strike hits and deals damage, the wave flows after you to batter the target of your Strike, dealing 2d10 bludgeoning damage and pushing it 10 feet in a direction of your choice.</p>
```

- **The item:** one damage entry (the rider's, here 2d10 bludgeoning), no save, no area.
- **When cast:** target the creature you'll Strike, then open the card (**Resolve Strike Spell**) and make the Strike with PF2e. Then click **Read Strike Result**: the card reads the degree from PF2e's Strike message against that creature, made after the card appeared (the latest one, so PF2e rerolls count).
- **A hit or critical hit** applies the rider: its damage (not doubled, because it isn't the Strike's damage) and the push, shown as a GM note. A miss applies nothing.
- **“and deals damage”** becomes a GM question on the target row.

**Conditions that depend on the Strike's result.** A Strike with no damage of the spell's own (a Requirements line may come first):

```html
<p>… Make a melee Strike with your qi-infused fabric. On a success, the target is @UUID[…]{Immobilized} until the start of your next turn, though it can attempt to @UUID[…]{Escape} against your spell DC. On a critical success, your needles anchor in the target's nerve centers after the threads bind it, making it your choice of @UUID[…]{Clumsy 1} or @UUID[…]{Enfeebled 1} until the start of your next turn, in addition to immobilizing it.</p>
```

- **The item:** no damage entry, no save, no area. The text before the Strike is narration only.
- **When cast:** as above: make the Strike with PF2e, then **Read Strike Result**.
- **A hit:** the success sentence's conditions, read like any row (“, though it can attempt to Escape against your spell DC” ends the condition on an Escape, or at the stated time, whichever is first).
- **A critical hit:** the success sentence's conditions plus the critical ones. “in addition to <…ing> it” must name the success sentence's condition.
- **“your choice of A or B”:** two linked conditions. The card asks the caster once (**Caster: choose the condition on a critical hit**), only when a target critically hit. Only the chosen condition applies.
- **A miss:** nothing.

**Effects on you that change the Strike.** When a PF2e Spell Effect models what the spell does to your Strike, link it after the text:

```html
<p>Make a melee Strike with a weapon you're holding, except that any physical damage the weapon would deal is force damage instead.</p>
<p>@UUID[Compendium.pf2e.spell-effects.Item.Effect: Force Fling]{Effect: Force Fling}</p>
```

- **When cast:** the card's **Resolve Strike Spell** puts the Effect on you, then you make the Strike with PF2e. If the Effect asks for a choice (such as Inner Upheaval's damage type), PF2e asks when it's applied.
- **Two Effects, one for this Strike and one for afterwards:** link both, and state each one's damage in its own sentence.
  - The Strike's own: “If the Strike hits, you deal an additional 1d6 electricity damage and 1d6 sonic damage.”
  - Afterwards: “After the attack, regardless of the result, your melee Strikes deal an additional 1 electricity damage and 1 sonic damage for the duration of the spell.”

  The module matches each Effect by the damage its rules add. The first Effect goes on you at once and is removed when the Strike is resolved (its damage roll, or its attack roll when it misses). The second starts then, so it doesn't add to the first Strike.
- **The rest of the text may only describe your Strike.** Anything about other creatures (saves, areas, conditions on a target), results by degree (“Critical Success …”), or an ending you must keep up (“ends if … at the end of any turn”) blocks the spell.

**Not supported yet:**
- rules that change the Strike itself without a PF2e Effect (range, reach, concealment, cover);
- result riders other than the damage-and-push form above (conditions, Effects, degree tables such as “Critical Success You gain …”);
- two Strikes in one spell.

## 4. Buffs and reactions (Effect route)

The Effect route applies **one** PF2e spell Effect, and it must be one from PF2e's own **Spell Effects** compendium (`Compendium.pf2e.spell-effects`). Link it anywhere in the description:

```html
<p>You steel an ally, granting it a +1 status bonus to attack rolls, Perception checks, saving throws, and skill checks.</p>
<p>@UUID[Compendium.pf2e.spell-effects.Item.Spell Effect: Heroism]{Spell Effect: Heroism}</p>
```

With Duration `1 minute` and Target `1 creature`, this applies Heroism's Effect to the target when cast.

**Homebrew Effect items (your own world or module Effects) aren't recognised by this route yet.** For custom mechanics, use the save route's conditions, or apply your Effect by hand.

The spell must meet all of these:
- **Structure:** no save, no area (except the ally-area form below), exactly one linked Effect.
- **Recipient:** the Target (`1 creature` / `1 willing creature` / `1 creature touched`), or blank for yourself. With a blank target, don't name another recipient such as an ally, your eidolon or your companion.
- **Duration:** a real duration, and no “each round”, “whenever”, “the first time” or “then”.
- **Completeness:** nothing in the text beyond what the Effect's rules do. These words block the spell unless the Effect handles them:
  - damage dice;
  - condition links (unless the Effect grants the condition);
  - action links or “spend a single action” (unless the Effect grants the action);
  - inline checks or templates;
  - “counteract”, “teleport” or “immune to this spell”;
  - “divided … among”;
  - incapacitation;
  - “You cast X as part of casting”;
  - “Dismiss” (unless the Effect handles it).

A choice such as “Choose acid, cold, electricity, fire, or sonic” is fine when the Effect has a PF2e ChoiceSet; PF2e shows its own prompt.

**More buff targets:** Target can also be `up to 3 creatures`, `up to 5 willing creatures`, `1 to 3 willing creatures`, `1 ally`, `1 living creature`, `1 willing animal`, `your animal companion` or `your eidolon`. Every targeted creature gets the Effect. For a companion or eidolon, the caster targets it.

**Auras from PF2e Effects:** if the linked PF2e Effect contains an **Aura** rule (for example *Aura: Protector's Sphere*), the Effect goes on the aura's centre: you, or your single target. PF2e then gives and removes the aura's benefit as creatures move in and out.

These wordings are refused, because the Effect alone wouldn't handle them:
- “the newer spell replaces the older one”;
- “Each time you Sustain the spell, the radius increases …”;
- a size change when the Effect has no size rule;
- Shield Block granted by the spell.

**Area buffs for you and your allies:** set the Area to an **emanation** (for example 30 feet), leave Target blank, give a real duration (`1 round`, `1 minute`, …) and write one sentence:
- “You and all allies in the area gain …”, “You and your allies gain …” (you and your allies), or
- “Allies in the area gain …” / “Your allies in the area gain …” / “Weapon and unarmed attacks by allies in the area are treated as silver.” (allies only).

```html
<p>Your chant stirs your companions. You and all allies in the area gain a +1 status bonus to attack rolls, damage rolls, and saves against fear effects.</p>
<p>@UUID[Compendium.pf2e.spell-effects.Item.Spell Effect: Courageous Anthem]{Spell Effect: Courageous Anthem}</p>
```

When cast, the Effect goes to you (if named) and to every PF2e ally of yours whose token is within the emanation. PF2e's alliance setting decides who counts as an ally, and PF2e's token distance decides who is in range. If the GM targets tokens before resolving, those targets are used instead.

Auras that keep applying (“while within the emanation”, “each round”) are ongoing and aren't handled by this rule.

**Auras that grow on Sustain:** with a sustained duration, “Each time you Sustain the spell, the emanation's radius increases by 5 feet, to a maximum of 30 feet.” is automated when the linked Aura Effect's radius is `5 * @item.badge.value` and its counter badge starts at 1 and has 6 steps (5 × 6 = 30). Casting starts a sustained cast. Each Sustain (once per round, from the Ongoing control) raises the badge, so PF2e grows the aura. A missed Sustain ends the spell and removes the aura.

**Optional growth.** With a fixed duration, “Once per round on subsequent turns, you can Sustain the spell to increase the emanation's radius by 10 feet.” is automated when:
- the linked Aura Effect's radius is `5 + @item.badge.value * 10`;
- its first value (15) is the spell's emanation;
- its counter badge starts at 1.

Each Sustain raises the badge up to its last label. A skipped Sustain doesn't end the spell, which lasts its own duration.

**An Effect granted each time you cast from a slot.** “Each time you Cast a Spell from your spell slots, you automatically Sustain this spell and grant its target resistance to damage from spells equal to the spell's rank, until the start of your next turn.”, with a second linked Effect labelled “… (Resistance)”.
- **The Effect:** it must be exactly a rank ChoiceSet and a `Resistance` to `spells` of that rank, lasting 1 round to a turn's start.
- **Casting:** the spell's own Effect goes on the target as usual.
- **In Ongoing spells:** **“<spell>: you cast a spell from a slot — resistance for <target> (and Sustain)”** grants the resistance Effect to that creature (PF2e asks for the rank) and records this round's Sustain.

**Counteracting another spell:** “Benediction can counteract malediction.” (the spell's own name) is a **GM:** reminder on the card. Casting it against that spell is a counteract check the GM resolves.

**An automatic counteract:** “In addition, this spell automatically attempts to counteract any @UUID[…]{Translocate} cast by a devil within the area or cast by a devil attempting to enter the area using dimension door.” (and “If a devil attempts to enter the area using dimension door and the spell is counteracted, the devil remains where it started.”) is a **GM:** reminder. The GM rolls the counteract check when it happens.

**A weapon's next Strike.** Target “1 weapon you're wielding”, with a PF2e Effect whose ChoiceSet picks one of the recipient's weapons:
- **Text:** “On your next Strike with that weapon before the start of your next turn, you gain a +1 status bonus to the attack roll and the weapon deals an additional 1d6 spirit damage, and the Strike gains the sanctified trait.”
- **Proof:**
  - A `FlatModifier` on `{weapon}-attack` of that value and type.
  - A `DamageDice` on `{weapon}-damage` with that die, type and number at the cast rank.
  - An `AdjustStrike` adding the trait.
- **Recipient:** the Effect goes on the caster (the wielder). It must last exactly 1 round, to the start of a turn.
- **Ending:** “<Spell> ends once you complete this Strike or the weapon leaves your possession.” ends it: the module removes PF2e's Effect after that Strike with the chosen weapon (a miss, or its damage roll). Leaving your possession is the GM's.

**A weapon's next hit, in a chosen metal.** Target “1 weapon that is unattended or wielded by a willing creature”, lasting “until the beginning of your next turn” (read as the start), with a PF2e Effect whose ChoiceSet picks one of the recipient's weapons:
- **“On the next successful attack with that weapon during the spell's duration, the attack deals an additional 1d6 precision damage.”:** a `DamageDice` on `{weapon}-damage` with that die, category (or type) and number at the cast rank, and no predicate.
- **“You can choose for the metal to become your choice of cold iron, silver, or steel, causing the attack to bypass resistances accordingly.”:** a material ChoiceSet whose options are all in the list, and an `AdjustStrike` adding the chosen material to that weapon.
- **Recipient:** the Effect goes on the targeted wielder.
- **PF2e data notes:**
  - The module removes the Effect after the next damage roll with the chosen weapon, so the dice apply to one hit (user decision: the text).
  - A listed material PF2e doesn't offer (steel) is named. To choose it, the caster picks either option and the GM ignores the material. PF2e's choice applies even when the list doesn't match.
- **Kept strict:** another die or damage category isn't proved, and a longer duration doesn't put the Effect on the wielder.

A Target line ending in a period (“… wielded by a willing creature.”) is read without it.

**A club or staff ablaze.** Target “one club or staff you're wielding”, with a PF2e Effect whose ChoiceSet picks one of the recipient's weapons:
- “While you wield the target weapon, it becomes a +1 weapon, gains the versatile fire trait, and sheds light as brightly as a torch.”: potency on the chosen weapon at the rank, the trait added to it, and a torch's light (`TokenLight`, bright 20 and dim 40).
- “Whenever you successfully Strike a creature with the weapon, you can Dismiss the spell as a free action to deal 1d6 persistent fire damage to the target; if the target is undead, increase the persistent damage dice to d8s.”:
  - A toggleable `dismiss-…` `RollOption`.
  - A `DamageDice` on the weapon's damage under that toggle, at the rank.
  - A `DamageAlteration` upgrading the faces against `target:mode:undead`.
  - The toggle's dice are made persistent (a rule override), and the module removes the Effect after the damage roll with the toggle on: the spell is Dismissed (user decision: the text).

**Heightened durations:** PF2e has no heightening field for a spell's duration, so the module reads it from the Heightened entries. Use a fixed-rank entry with one of these sentences:
- “The duration increases to 1 hour.”;
- “The duration is 8 hours.” / “The spell's duration becomes 10 minutes.”;
- “The duration is until the next time you make your daily preparations.” (PF2e Effects write this as 1 day, so the Effect gets 1 day).

```html
<p><strong>Heightened (7th)</strong> The duration increases to 1 hour.</p>
```

The sentence can sit inside a longer entry (“… and the duration increases to 10 minutes.”), and several fixed-rank entries form a sequence: `Heightened (3rd)` 1 hour, then `Heightened (5th)` 8 hours. Each duration applies from its rank up, until a higher entry states another one.

When cast at that rank or higher, the linked Effect is created with the heightened duration. That works when the Effect's own duration is the spell's base duration (for example Duration `5 minutes` and an Effect lasting 5 minutes). If a second Effect is linked for the heightened rank (like *Spell Effect: Tailwind (8 hours)*), that Effect is chosen by rank instead and must already last the heightened duration.

Anything else keeps the spell guided (`heightened-duration:*`): an unlimited duration, weeks or longer, a `(+N)` entry that changes the duration, an Effect whose duration is neither the base nor the heightened one, or a duration change worded another way.

**Reactions:** set Cast time to `reaction`, start with `<strong>Trigger</strong> …`, and state the recipient in a sentence of its own:
- “You gain …” when there's no target;
- “The target gains …” or “It gains …” with a target such as `the triggering creature` or `1 creature`.

If the reaction applies only to “the triggering …” attack, save or check, the Effect must end on its own or be removed after the roll. PF2e Effects with an unlimited duration are refused, because they would keep applying.

### Penalty Effects the rows state

A PF2e Effect whose rule is one `FlatModifier` penalty, stated by the rows:
- **The penalty:** “The target takes a –1 status penalty to saves against your emotion effects.” (also “…, taking a –1 status penalty …” after narration such as “The target believes the resemblance and is susceptible to your influence”). The statistic is saves, saving throws or attack rolls.
- **The qualifier** must match the rule's predicate exactly:
  - “against your emotion effects”: `item:trait:emotion` and `origin:signature:{item|origin.signature}`;
  - “against creatures other than you”: `{not: target:signature:{item|origin.signature}}`.
- **A penalty defined before the table:** “You deal 1d10 mental damage to the creature and cause it to take a -1 status penalty to attack rolls against creatures other than you.” Rows then say “The target takes half/full damage and the penalty.” or “…, and the status penalty is -2.” A critical-failure row may say “As failure, except the status penalty is –2.”
- **A degree Effect after the table:** one ChoiceSet `flag` with choices labelled by degree (`PF2E.Check.Result.Degree.Check.failure` …) and number values, read by the FlatModifier's value (`@item.flags.system.rulesSelections.<flag>`). It must last the spell's duration; the module presets the degree's value.
- **A row's own Effect** (a fixed penalty) with “The spell ends at the end of the target's next turn.” must last 1 round ending at a turn's end. It's counted from the target's turn.
- **An end-of-turn save:** “…, but can attempt another Will save at the end of each of its turns, ending the spell's effect on a success.” after the penalty gives that row's Effect an end-of-turn save. A success removes it.
- Plain narration sentences (no numbers or rules) may accompany a row.

### An Effect a row states, after the table

One Spell Effect link after the table, lasting the spell's duration, whose rules one row states exactly:
- “The target loses any immunity to bleed (and is considered to be a creature with blood for the purposes of effects and requirements).” needs exactly one `Immunity` rule with `mode: remove` and that type. The “creature with blood” words are accepted only for bleed.

The Effect applies on that row and on every row written “As <that row>, …”. It's applied before the row's damage, so a creature that was immune to bleed takes the bleed.

### A condition chosen by the target's highest attribute

Before the table: “The target is cursed with an adverse condition depending on its highest attribute modifier: Strength (@UUID[…]{Enfeebled}); Dexterity (@UUID[…]{Clumsy}); Constitution (@UUID[…]{Drained}); or Intelligence, Wisdom, or Charisma (@UUID[…]{Stupefied}).” It must be followed by “On a tie, the creature decides which of the conditions associated with the tied attributes to take.” All six attributes must be covered, each once. The rows say “The condition's value is 1.” (or “The target is unaffected.”). The condition lasts the spell's fixed duration.

Optionally add “At the start of each of your turns, the target can attempt another Will save, ending the effect on a success.” The save is offered at the start of each of the caster's turns.

The card reads each target's attribute modifiers. When the highest ones tie across different conditions, the card waits for the creature's choice.

### A condition chosen by one roll

Before the table: “Roll [[/r 1d4]]. On a 1, the foe becomes clumsy; on a 2, it becomes enfeebled; on a 3, it becomes stupefied; and on a 4, you choose which condition applies.” Each row then reads:
- “The target is either Clumsy 1, Enfeebled 1, or Stupefied 1 for 1 round, depending on the result of the d4.”, the three conditions in the same order with one value; or
- “As failure, but <narration>. The condition's value is 3, and the condition lasts for 2 rounds.”

The card rolls once for the cast and applies only that condition to every target. On a 4 it waits for the caster to pick one.

**As a table.** “Roll [[/r 1d4]] to determine the color of the illusion. Each creature in the area must succeed at a Will save or take the effect listed on the table for the color.”, followed by a table with columns `1d4 | <label> | Failure | Critical Failure`:
- **Rows:** one row per result (1 to 4, in order), each a condition with its own value and lifetime (“Dazzled for 1 round”). A condition PF2e ends itself (Frightened, Sickened) may have no lifetime. A critical-failure cell may name the condition without a link (“Dazzled for 1 minute”).
- **Conditions:** each result's condition is different, and a row's two cells name the same one.
- **The save:** the sentence's save must be the item's. Only narration may come before the roll sentence, and nothing may follow the table.
- **On the card:** the rolled result names its row (“1d4: 3 — Yellow: frightened”). Only that condition applies, at the failure or critical-failure cell's value and lifetime.

**Behaviours by the roll.** “You overwhelm the target with … if it fails a Will save. Roll [[/r 1d4]] to determine the spell's effect.” and a two-column table `1d4 | Effect`, one row per result:
- **Each row:** a behaviour “on its next turn” (a note to the end of the target's next turn), optionally with “On a critical failure, …” (added to the critical failure's note).
- **A Speed row:** “For 1 round, it takes a –5-foot status penalty to its Speeds (-10-foot status penalty on a critical failure), …” is a 1-round note carrying that penalty on all Speeds.
- **Kept out of the rows:** damage, saves, bonuses and conditions.
- **On the card:** one roll for the cast (“1d4: 2 — the note for result 2”). A failing creature gets only that result's note; a success gets nothing. The item's `varies` duration is read from the notes.

### A heightened option to include allies

“Heightened (3rd) You can choose to have the benefits also affect all your allies in a @Template[emanation|distance:10] around the target.” on a single-target Effect spell asks the caster, when cast at that rank or higher, whether to include allies. If yes, the Effect also goes to the caster's allies (by PF2e alliance) within 10 feet of the target's token. Any other wording in that entry blocks the spell.

### When PF2e's Effect and the text differ

PF2e's Effect data decides when it differs from the text only in a value, a recipient or the examples it covers. The GM gets a note in the apply dialog and a whisper after it's applied. Three cases are read:
- **A stated resistance** (“resistance 2 to all damage”, “(minimum 1)”) that the Effect gives differently at the spell's rank.
- **A text that speaks to the caster** (“You gain …”) while the item's Target is a creature: the Effect goes to the target.
- **A “+N bonus … such as <actions>” sentence** whose action links are all named by the Effect's matching modifiers. The note says other actions are the GM's call.

Action links anywhere else still block, and so does a rule the Effect doesn't have at all.

### Two spells that replace each other

“Special Your eidolon can benefit from either boost eidolon or @UUID[…]{Reinforce Eidolon}, but not both; if you cast one of these spells during the other's duration, the newer spell replaces the older one.”
- One of the two names must be this spell.
- When this spell's Effect is applied, the caster's Effect from the other spell (“Spell Effect: <name>”) is removed from each recipient first.

**Stated resistance values:** a resistance number the text states (“resistance 2 to all damage”) or a minimum (“(minimum 1)”) must be what the Effect's Resistance rule gives at the spell's rank. Otherwise the spell is blocked (`effect-value-mismatch`). A value “equal to …” is left to the Effect.

### Sentences an Effect's rules state

On the Effect route, a sentence is accepted when the Effect's rules give exactly what it says:
- **Extra Strike damage:** “Each target's unarmed and weapon Strikes deal an extra 1d4 vitality damage.” needs one unconditional `DamageDice` on `strike-damage` with that die, type and number of dice at the cast rank. PF2e's `ternary(gte(@item.level,5),3,…)` forms are read.
- **A trait for the Strikes:** “If you have the holy trait, you can add that trait to this spell and to the Strikes affected by the spell.” needs an `AdjustStrike` adding that trait with the predicate `parent:origin:trait:holy`.
- “The number of targets is equal to the number of actions you spent casting this spell.” and a parenthetical aside such as “(This damage typically damages only undead).” may accompany them.
- **Bulk:** “The target can carry 3 more Bulk than normal before becoming Encumbered and up to a maximum of 6 more Bulk.” needs exactly two `ActiveEffectLike` “add” rules, on `inventory.bulk.encumberedAfterAddend` (3) and `inventory.bulk.maxAddend` (6).
- **Fists:** “Your fists deal 1d6 bludgeoning damage, lose the nonlethal trait, and have reach.” needs a `Strike` rule with `fist: true`, and fist `ItemAlteration`s that upgrade the damage die (once for d6, twice for d8), remove nonlethal and add reach.
- **A granted attack:** “You gain a claw attack that deals 1d6 slashing damage and has the agile, finesse, and unarmed traits.” (an option's label, such as “Claws”, may lead) needs a `Strike` rule with that `baseType`, damage (dice, die, type) and traits. PF2e's added `magical` is allowed.
- **An unarmed attack by name:** “Untamed claws are an unarmed attack, have the agile and finesse traits, and deal 1d6 slashing damage.” or “Untamed jaws are an unarmed attack that deal 1d8 piercing damage.” needs an unarmed `Strike` rule whose `baseType` is the noun (claws → `claw`), with that damage and those traits. PF2e's added `unarmed` and `magical` are allowed.
- **More choices when heightened:** “Heightened (6th) You can choose up to two effects from the list.” read by PF2e's extra choices on the actor's level (`parent:level` 6, 10) rather than the rank. A **PF2e data** note says to choose only as many as the cast rank allows.
- **An option's action cost:** “You must cast <spell> using 2 actions for this benefit.” (after the option's label) is a **GM:** note. PF2e's choice doesn't check it.
- **Weapon spells:** the Effect goes on the weapon's wielder, and PF2e's own prompt picks the weapon. The Effect must have a ChoiceSet of the recipient's own weapons.
  - With Target “1 (metal) weapon (that is unattended or wielded by a willing creature / you or a willing ally)”, you target the wielder.
  - “1 weapon you're wielding” / “1 club or staff you hold” applies to you.
  - An unattended weapon needs a wielder: apply the Effect by hand.
  - Sentences the Effect must state:
    - “The target becomes a +1 striking weapon, gaining a +1 item bonus to attacks …”: potency and striking alterations of those values at the cast rank.
    - “The target becomes a +1 shock weapon.”: potency, and an AdjustStrike adding that property rune to the chosen weapon.
    - “Strikes with the target weapon deal an additional 1d4 slashing damage …”: DamageDice on the chosen weapon's damage.
  - Any other “a +N … weapon” sentence blocks.
  - Where the text says “until the start of your next turn” and the Effect lasts to a turn's end, the card notes it.
- **Skill checks to named actions:** “… gains a +1 status bonus to Athletics checks, Intimidation checks to Demoralize, and Stealth checks to Hide or Sneak.” The list after “bonus to” may hold only “<Skill> checks”, “<Skill> checks to <Action>[ or <Action>]” and “<Save> saves”. For each action there must be a `FlatModifier` of that value (at the cast rank) and type, on that skill, with the `action:<slug>` predicate. “… to Hide in areas of dim light or darkness” also needs the `lighting:dim-light` and `lighting:darkness` predicates.

## 4b. Healing

**The item:** no save; one damage entry of kind **Healing** (e.g. `1d10+4`); Target `1 creature` / `1 willing living creature` (must be living) / `1 undead minion you control` (must be undead) / your companion (or blank for yourself).

**The text:**

```html
<p>You grace the target's mind, healing its wounds. The target regains 1d10+4 Hit Points when you Cast the Spell.</p>
```

Also accepted: “You restore 1d10 Hit Points to your animal companion.” and “You heal an animal's wounds, restoring 1d8 Hit Points to the target.” The dice (or a flat amount such as `6`) must be the healing entry.

**Healing a creature near your thrall.** Target `1 of your thralls`, one healing entry, and:
- “Choose one living or undead creature of your choice within 15 feet of the target thrall.”
- “That creature regains 1d8 Hit Points immediately and gains fast healing 1 for as long as it's within 15 feet of the target thrall.”
- optionally “This spell has the vitality trait if you heal a living creature or the void trait if you choose an undead creature.”

The caster targets that creature (not the thrall), which is healed by PF2e's roll and gets the linked fast-healing Effect. Either kind of creature can be healed. The thrall's range and the trait are **Caster:** notes on the roll. A **PF2e data** note says the Effect lasts its full duration, so remove it if the creature moves away.

**With a linked Effect:** add “… and gains a +2 status bonus to saves against mental effects for the duration.” plus the Effect link (section 4). The Effect is applied, then the healing.

**Without one:** any other rule blocks the spell.

**When cast:** the card shows **Resolve Healing**. The healing is rolled with PF2e's own roll (so heightening applies) and applied to the targeted creatures:
- vitality healing refuses undead and constructs;
- void healing needs an undead or void-healing creature.

**Different action counts:** make PF2e variants (Time `1` and `2`). The 2-action variant's healing includes the bonus. In the text: “The number of actions you spend Casting this Spell determines range and other parameters. 1 The spell has a range of touch. 2 The spell has a range of 30 feet and restores an additional 8 Hit Points to the target.” Cast a variant; the base item isn't resolved.

**Several targets by actions:** “You can spend 1 to 3 actions Casting this Spell, and you can target a number of creatures equal to the actions spent. Each target regains 3d6 Hit Points.” Make one PF2e variant per action count, each with Time `1`/`2`/`3` and a Target naming that many creatures (`2 living creatures`). Cast a variant; the base item isn't resolved.

**Targets near you:** give the item an **emanation** area (for example 20 feet) as well as a Target. The emanation limits where the targets can be: a target farther from the caster's token is refused before anything is rolled.

**Dying and Wounded.** PF2e leaves Dying to the table. Wherever the module heals (this route, Heal/Harm, heal-or-harm save cards, and a caster healed by the damage it deals), a creature that had Dying and is healed to 1 HP or more loses Dying and Unconscious, and gains Wounded 1 (or +1), as the rules say. The card shows the change. Add “If the target had the Dying condition, coming back from Dying due to this healing doesn't increase its Wounded condition.” and Wounded stays as it was.

**Reactions to a death:** Target `the triggering creature`, and write “You prevent the target from dying and restore 5d8 Hit Points to the target.” A limit on when the reaction can be used (“You can't use <spell> if the triggering effect was a death effect or an effect that leaves no remains, such as Disintegrate.”) is shown on the healing message for the caster; the module doesn't check it.

**A free movement for the healed creature:** “The target regains 6d8 Hit Points and can Fly up to 30 feet as a free action along a path of their choice; this movement doesn't trigger reactions but can never put the target in danger, so if they attempt to move toward an enemy or into a hazard, the movement immediately ends.” (Fly, Stride, Step, Swim, Climb or Burrow). The healing message shows it; the creature moves itself.

**Healing from conjured food:** the spell makes food, and a creature is healed when it eats. The item has no save, no Target and no area, and its one Healing entry is one piece's healing. The text is one sentence that makes the food (no rules in it), the eating sentence, and when the food goes:

```html
<p>A glowing plum drops into your palm. A creature can consume the food with an Interact action to regain 2d8+6 Hit Points. If uneaten, the food crumbles to dust after 1 minute.</p>
```

- **Eating:** “A creature can consume the food with an Interact action to regain X Hit Points (and be nourished as if it had eaten a meal).” or “A creature who eats the produce with an Interact action regains X HP.”
- **When it goes:** “If uneaten, the food crumbles to dust (or withers away, or vanishes) after N rounds/minutes/hours.”, or “The <thing>, as well as any unconsumed pieces of <food>, wither away at the end of the duration.” with a Duration on the item.
- **More food when heightened:** “Heightened (+1) The <thing> produces an additional piece of food.”, optionally with “A creature can consume any amount of food from the same casting with a single Interact action.” and a sentence about nourishment. A healing increase belongs in the item's heightening data (“The Hit Points restored increase by 6.”).
- **When cast:** **Resolve Healing** posts a food card with the pieces left and when they go. Target (or control) the creature that eats and press **Eat**. Each piece is PF2e's healing roll at the cast rank. The energy rule and Dying recovery apply to the eater. Food that has all been eaten, or has gone, can't be eaten.

**Not supported yet:** healing over time, healing in an area (other than as a range limit on targets), and heal-or-harm spells outside the wording below (see “Heal or harm”).

### Healing allies and harming enemies in one area

A basic-save area can heal allies and harm enemies with separate rolls:

```html
<p>You create a gout of flame that both heals and burns. You restore @Damage[(@item.level)d4[healing]] HP to all allies in the area, and those allies gain a +1 status bonus to Fortitude saves for 1 minute. Enemies in the area take 1d4 fire damage with a basic Reflex save. @UUID[Compendium.pf2e.spell-effects.Item.…]{Spell Effect: …}</p>
```

- **Item:** a basic save, an area, and one damage entry matching the enemy sentence.
- **Healing:** an inline `@Damage[…[healing]]` formula that may use only `@item.level` / `@item.rank`.
- **Effect:** the linked Effect's only rule must be the stated save bonus (`FlatModifier`, that save, type and value, no predicate), lasting the stated time.
- **On the card:** the caster's allies take no save; at Finalize they're healed by one roll of the formula and get the Effect. Enemies save against the damage. A creature that is neither ally nor enemy is the GM's call, as in *Enemies only*.

### Enemies in an aura held at a condition

An emanation with no check (and no Target):

```html
<p>Enemies within the area are @UUID[Compendium.pf2e.conditionitems.Item.TBSHQspnbcqxsmjL]{Frightened 1}. They can't reduce their frightened value below 1 while they remain in the area.</p>
```

- The caster targets the enemies in the emanation. The card refuses the caster or an ally.
- Each gets PF2e's condition at that value for the spell's duration. The grant is set so the condition can't be removed, and so can't drop below that value, while it lasts.
- The Effect tells the GM to delete it if the creature leaves the area.
- The floor sentence must name the same condition and value.

### Lowering the caster's condition

“You reduce your current @UUID[…]{Frightened} condition by 1, and whenever you would become Frightened during the duration, reduce the amount by 1.” (no check, no Target):
- The caster's condition goes down by that amount now, if it has one.
- The rest of the text, such as how it ends, is a note on the caster for the spell's duration.
- Both amounts must match, and so must both condition names.

### Tethered to the caster

A Reflex save whose preamble binds the target to the caster (“… The creature can still try to @UUID[…]{Escape}, and it or others can break the tethers by attacking them (the tethers have AC 15 and 10 Hit Points). You must stay within 30 feet of the target while it's tethered; …”):
- **Speed rows:** “The target takes a –5-foot circumstance penalty to its Speed as long as it's within 30 feet of you.” and “… a –10-foot circumstance penalty to its Speed and can't move more than 30 feet away from you until it Escapes or the spell ends.” become notes for the spell's duration. Each carries a circumstance `FlatModifier` on `land-speed` (−5 to −30, in 5-foot steps). The distance limit stays in the note, for the GM.
- **“Immobilized until it Escapes or the spell ends.”:** PF2e's Immobilized, which ends at the spell's duration or when the target Escapes, whichever comes first.
- **The preamble** (Escape, the tethers' AC and Hit Points, the 30-foot limit on the caster) is added to each note, with “Heightened (+1) The tethers' AC increases by 3, and their Hit Points increase by 10.” The GM works out the tethers' numbers at the cast rank.
- **Kept strict:** a Speed row with any other condition, such as “for 1 hour”, isn't read.

### Damage stated only by the text

A basic save whose item has **no damage entry**, where the text states the damage exactly (user decision, 2026-09-27):

```html
<p>Your mind creates a violent axis of motion in a nearby space that can smash or sever at your will. You deal your choice of 1d6 bludgeoning or 1d6 slashing damage to all creatures in the area, with a basic Fortitude save. A creature large enough to be in more than one of the bursts takes damage only once.</p><hr /><p><strong>Heightened (+2)</strong> The damage increases by 1d6.</p>
```

- **What's read:** the dice (the same for both types), the two types, and one “Heightened (+N) The damage increases by XdY.”
- **Before the damage sentence:** only narration.
- **After it:** only “A creature large enough to be in more than one of the bursts takes damage only once.”
- **A GM-chosen type:** also read is “The animal or swarm assaults all creatures in the area, dealing 2d6 damage. The damage is either bludgeoning, piercing, or slashing based on the animal that was conjured, as determined by the GM.” with the item's basic save. It may be followed only by “After their attacks, the animals return to your deity's plane.” The card's type choice is then labelled as the GM's. A Requirements line may sit before the rules.
- **On the card:** the damage is rolled from that formula at the cast rank, of the type the caster picks. A **PF2e data** note says the item has no damage entry. If the item does have damage data, PF2e's is used.

### Damage with no check

A spell with no save and no attack that simply hits:

```html
<p>You fire an arrow-shaped bolt of force. It automatically hits and deals 1d4+1 force damage to the target.</p>
```

- **Item:** Target `1 creature`, one damage entry with the same dice and type, and 1 to 3 actions.
- **Text:** up to two opening sentences of narration are fine. Any other sentence (a rider, a range rule, a second target) blocks the spell.
- **Melee reach:** “You … that deals 1d4+1 force damage to a target within your melee reach.” also works. The card reminds the GM that the target must be within the caster's melee reach.
- **Spellstrike range:** “If you can use Spellstrike with a ranged weapon …, you can instead target a creature in the first range increment of your ranged weapon.” becomes a **GM:** reminder on the card.
- **Resolve Damage** on the card rolls PF2e's damage once, at the cast rank (a focus spell heightens with the caster), and applies it to the one targeted creature with its resistances and weaknesses.
- **Damage on the creature an ally struck:** a reaction with the Target “the triggering ally” and “Trigger An ally within range critically succeeds at a melee Strike.”, then:
  - “The weapon used to make the Strike deals an additional 1d6 sonic damage (not doubled due to the critical hit), and the ally can immediately attempt to Shove the creature struck, even if the ally's hands are full.”;
  - optionally the Athletics bonus sentence.

  The caster targets the creature struck, and the damage is rolled on its own (not doubled). The Shove and its bonuses are **GM:** notes on the roll. If the item has no damage entry, the text's dice (heightened by one “Heightened (+N) The sonic damage increases by 1d6.”) are rolled at the cast rank, with a **PF2e data** note.

### Heal or harm

One roll of void or vitality energy that heals one kind of creature and harms the other, like Harm and Heal. Void heals undead (and void-healing creatures) and harms the living; vitality is the reverse. Constructs and objects are unaffected.

**The text:** keep this wording, changing only the energy, the dice, the ranges, the extra healing and the emanation size:

```html
<p>You channel void energy to harm the living or heal the undead. If the target is a living creature, you deal 2d6 void damage to it, and it gets a basic Fortitude save. If the target is a willing undead creature, you restore that amount of Hit Points. The number of actions you spend when Casting this Spell determines its targets, range, area, and other parameters.</p>
<p>1 The spell has a range of touch.</p>
<p>2 (concentrate) The spell has a range of 60 feet. If you're healing an undead creature, increase the Hit Points restored by 6.</p>
<p>3 (concentrate) You disperse void energy in a @Template[emanation|distance:15]. This targets all living and undead creatures in the area.</p>
```

For vitality: “You channel vital energy to heal the living or damage the undead. If the target is a willing living creature, you restore 2d6 Hit Points. If the target is undead, you deal that amount of vitality damage to it, and it gets a basic Fortitude save.” (and “If you're healing a living creature …”, “You disperse vital energy …”).

**The item:** a basic save; one damage entry of the energy's type with the dice, kinds **Damage** and **Healing**. Add PF2e variants (overlays), and cast a variant; the base item isn't resolved:

| Variant | Time | Item data | Resolves as |
| --- | --- | --- | --- |
| Touch | `1` | range `touch` | save card; each target is healed or harmed |
| Healing | `2` | range as the text; no save; damage `2d6+6`, kinds **Healing** only | **Resolve Healing** (the healed kind only) |
| Harm | `2` | range as the text; damage kinds **Damage** only | ordinary basic save (the harmed kind only) |
| Area | `3` | emanation of the text's size; no range | save card; each creature in the area is healed or harmed |

**When cast (touch and area):** each target's row says whether it's healed or harmed. Healed creatures don't roll a save; they regain the spell's rolled amount at Finalize. Harmed creatures roll the basic save as usual. Unaffected creatures are marked unaffected.

### Healing or harm by creature, with an Effect for yourself or others

A touch that heals one kind of creature and harms the other, like Lay on Hands and Touch of the Void, with a PF2e Spell Effect that applies only to yourself, only to someone else, or on a failed save.

**The text:** a narration sentence, a two-entry list, and the Effect link:

```html
<p>Your palm glows with vitality, mending the living and searing the undead.</p>
<ul><li><strong>Willing Living Creature</strong> The target regains 8 Hit Points. If the target is someone other than yourself, it also gains a +2 status bonus to AC for 1 round.</li>
<li><strong>Undead Creature</strong> The target takes 2d6 vitality damage with a basic Fortitude save; on a failure, the target also takes a –2 status penalty to AC for 1 round.</li></ul>
<p>@UUID[Compendium.pf2e.spell-effects.Item.Spell Effect: Lay on Hands]{Spell Effect: Lay on Hands}</p>
```

- **Energy:** the spell's `vitality` or `void` trait decides which entry heals. Vitality heals the living; void heals the undead (the healing entry's heading must say **Willing**).
- **Effect clauses:** “If the target is yourself, you also gain …” or “If the target is someone other than yourself, it also gains …” on the healing entry, and “; on a failure, the target also takes …” on the damage entry. Each takes a +/−N status or circumstance bonus or penalty to AC, damage rolls, attack rolls or saving throws, for 1 round. Either clause can be left out.
- **The Effect:** one from PF2e's Spell Effects compendium, lasting 1 round. Its rules must give exactly the stated modifier to that recipient. The module reads the Effect's FlatModifier and AdjustModifier rules, with “yourself” and “undead” predicates, and refuses the spell if they give anything else. Lay on Hands' and Touch of the Void's Effects are built this way.

**The item:** Target and range as you like; no damage on the base item. Add two PF2e variants (overlays), and cast a variant:

| Variant | Item data | Resolves as |
| --- | --- | --- |
| Healing | no save; damage `8`, kinds **Healing** only | **Resolve Healing**: heals, and applies the Effect only to the recipient the clause names |
| Vs. the other kind | basic Fortitude save; damage `2d6` of the energy's type, kinds **Damage** | save card: damage, and the Effect on a failure or critical failure |

A recipient the text doesn't cover isn't given the Effect, and the result card says so. For example, the Effect isn't applied when you heal yourself with a “someone other than yourself” clause, or when a void-healing creature that isn't undead fails the save against Lay on Hands.

### Void or vitality by the creature

Two wordings where the energy depends on what the target is. Void harms creatures without void healing; vitality harms undead and void-healing creatures.

**One target, one energy per variant** (like Execute). The text states both sides:

```html
<p>A spear of grave-cold pierces the target. The target takes 40 void damage with a basic Fortitude save. If the target is undead or otherwise has void healing, the spell loses the death and void traits and gains the vitality trait, and the target takes 40 vitality damage with a basic Fortitude save.</p>
```

- **The item:** a basic save and one damage entry, `40` void. Add two PF2e variants (overlays): one keeps void, and the other sets the damage type to `vitality` (and swaps the traits, if you like). Cast a variant.
- **When cast:** the void variant refuses undead and void-healing targets ("take the vitality variant"), and the vitality variant refuses the others. Both amounts in the text must be the variant's damage entry, and a narration sentence before them must hold no rule.

**An area whose void part becomes vitality** (like Divine Armageddon):

```html
<p>Grave light pours over the area. Creatures in the area take 6d6 void damage and 6d6 spirit damage. A creature harmed by vitality damage, such as one with void healing, takes vitality damage instead of void damage from this spell.</p>
```

- **The item:** a basic save; damage entries matching the damage sentence (one must be void). "Leveled" `@Damage` convenience paragraphs of void or vitality damage (as PF2e adds) are allowed and ignored.
- **When cast:** one roll for everyone. At Finalize, an undead or void-healing creature takes the void part as vitality (the same dice), and its row says "void → vitality for this creature".
- The damage sentence must start "Creatures in the area take …" or "Each creature in the area takes …" and name every damage entry. Any other sentence besides one narration sentence blocks the spell.

## 4c. Messages

A spell whose effect is words sent to a creature, with at most one reply. The item has no save, no damage, no area and no rules. **Send Message** on the chat card asks for the text, then whispers it to the target's owners, the caster's owners and the GM.

**Words both ways (like Sending).** Range `planetary` (or `N feet`), and Target `1 creature`, `1 creature you know well` or `1 creature you know by name and have met in person`:

```html
<p>You send the creature a mental message of 25 words or fewer, and it can respond immediately with its own message of 25 words or fewer.</p>
```

Both counts are enforced. The target's owner presses **Reply** once.

**Mouthed words with a brief reply (like Message).** Range `N feet`, with this exact text:

```html
<p>You mouth words quietly, but instead of coming out of your mouth, they're transferred directly to the ears of the target. While others can't hear your words any better than if you normally mouthed them, the target can hear your words as if they were standing next to you. The target can give a brief response as a reaction, or as a free action on their next turn if they wish, but they must be able to see you and be within range to do so. If they respond, their response is delivered directly to your ear, just like the original message.</p>
```

- **Range:** the target's token must be within range when the message is sent, and when it replies.
- **The reply window:** in a running encounter, the reply must come by the end of the target's next turn.
- **Seeing:** whether the target can see the caster is theirs to judge.
- **Heightened:** “Heightened (3rd) The spell's range increases to 500 feet.” lengthens the range.

**A dream message (like Dream Message).** One-way; delivered when the target sleeps:

```html
<p>You send a message to your target's dream. The message is one-way, up to 1 minute of speech (roughly 150 words). If the target is asleep, they receive the message instantly. If not, they receive it the next time they sleep. As soon as they receive it, the spell ends, and you know the message was sent.</p>
```

- **Delivery:** the card waits, visible to the caster and GM, until the GM presses **Deliver** (the target is asleep). The target's owners then see it.
- **Word count:** “roughly” means it's shown but not enforced.
- **Heightened:** “Heightened (4th) You can target up to 10 creatures you know by name and have met in person. You must send the same message to all of them; the spell ends for each creature individually” allows more targets, each with its own card.

**Not supported:** telepathy for a duration, emotions, messages carried by animals or the wind, delayed reminders, and any other sentence.

## 4d. Spell notes (nothing mechanical)

A spell with no save, no attack, no damage or healing, no linked PF2e Effect, no linked condition and no counteracting is resolved as a **spell note**. Numbers are judged sentence by sentence:
- **Allowed in the note:** a created thing's statistics (“The plant has AC 10, Hardness 5, and 20 Hit Points.”), a bonus whose clause says when it applies (“… to Stealth checks to Hide while in dim light …”), and an ending at 0 Hit Points.
- **A rule on the note Effect:** an unconditional bonus to the recipient (“Your companion gains a +1 status bonus to Performance checks.”) becomes a +1 status Performance modifier. Written “You gain …” only when the note goes on the caster. It must name saving throws, AC, Perception, attack rolls, initiative or a skill, with a +1 to +4 status, circumstance or item bonus.
- **Keeps the spell off the route:** temporary Hit Points, resistance, weakness, Speeds, and any other number.
- **Counteracting:** a counteract the spell makes (“attempt to counteract …”, “can counteract …”) keeps it off the route. Being counteracted by another effect (“it's erased only if it's counteracted by …”) doesn't.
- **Bystanders' saves:** a save only creatures the GM picks make, never the targets (“If a light source is attended by an unwilling creature, that creature can attempt a Reflex save to …”, “Tiny animals and animal swarms of any size within range must attempt a Will save.”), with no results table, stays in the note. The GM runs those saves.
- **Objects:** on an object target, “You restore 5 Hit Points per spell rank to the target, potentially removing the Broken condition …” is the item's, and the GM's to update. An instantaneous spell's card shows its rules. **Apply Spell Note** on the chat card puts a rule-less Effect named “Spell Note: <spell>” on the creatures, holding the spell's text for its duration. These spells are counted apart from enabled spells.

- **Who gets it:** the targets, when the Target line names creatures (“1 creature”, “up to 3 creatures”, “you and 1 ally”). Otherwise the caster gets it.
- **The environment:** a spell with an area, a template, or a place or thing as its target (an object, a wall, a surface) puts the note on the caster as “Spell Note: <spell> (area)”. The Effect and the card tell the GM to mark the area on the map; the module doesn't track it.
- **Duration:** as the spell's Duration field says. A sustained spell's Effect lasts the maximum and is marked sustained: remove it when the caster stops Sustaining. A bare `sustained` (no maximum) is PF2e's 10 minutes. “Until your next daily preparations” is 1 day. An unlimited duration is unlimited. An instantaneous spell gets the card only; if it leaves something in the world (it creates, grows or raises something, a wall, a bridge, difficult terrain), the card tells the GM to mark the result on the map.
- **Heightened:** write entries as “Heightened (3rd) …” or “Heightened (+2) …”. At the cast rank, the Effect's text adds the highest fixed entry reached and each interval that applies (with its count). “The duration of the spell is 1 hour” in an entry that applies sets the Effect's duration. “you can target up to five creatures” raises the target count.
- **Not a note:** a spell with any of the mechanical parts above takes its mechanical route, or stays blocked if that route can't read it. It's never reduced to a note. A duration the module can't read also keeps the spell off this route.

## 4f. A condition without a save

A spell with no save, attack, damage or linked Effect that grants one linked condition is resolved as **Apply Condition**. The module applies PF2e's condition (through an Effect that grants it, deleted with it) for the stated duration, plus a note Effect with the rest of the text. The accepted wordings:
- “The ally becomes Quickened and can use the additional action to Strike, Stride, or Step.” (Target `1 ally`, `1 willing creature` or `1 creature`; for an ally, the card refuses a non-ally), for the spell's duration;
- “You Step and become Concealed.” (no Target), for the spell's duration;
- “You gain the Concealed condition during this movement and until the start of your next turn.” (its own duration).
- “They become Concealed against the triggering attack and until the end of the current creature's turn.” (a reaction; Target `1 willing creature`): until the acting creature's turn ends (out of combat, 1 round).

A spell that only **mentions** a condition can be a spell note (section 4d): “If the target is Grabbed, Immobilized, or Restrained, …”, “an Unconscious ally”, “ignoring the target's Concealment”, “You make the object Invisible”, “The path can be visible or Invisible”, “you can become Hidden to a creature even if …”. Restoring, removing, reducing or granting a condition never is.

## 4g. Stabilize

Target `1 dying creature`, no save, and the rule “The target loses the Dying condition, though it remains Unconscious at 0 Hit Points.” (with Dying and Unconscious linked). **Stabilize** on the card removes Dying, raises Wounded by 1 (PF2e's rule for losing Dying), and keeps the creature Unconscious. It refuses a target that isn't dying. Any other sentence must be short narration.

## 4h. Thorns (retaliation)

A spell on the caster (Target empty or `self`, a fixed duration, no save) whose rules deal damage to creatures that hit or grab the caster. **Set (retaliates)** puts a marker Effect on the caster, tracked in Ongoing spells. Each trigger is a **Retaliate** control there: target the creature that set it off and use it, and the damage is rolled and applied (no save). The accepted wordings:
- “Adjacent creatures that hit you with a melee or unarmed attack take 1d4 piercing damage (as …).” or “Whenever a creature touches you or hits you with a melee unarmed attack, it takes 1 piercing damage.”, matching the item's damage entry (heightened by the item's interval);
- “Adjacent creatures that hit you with a melee attack, as well as creatures that hit you with unarmed attacks, take @Damage[(@item.rank)[piercing]] damage each time they do.”, optionally followed by “Anytime you cast a vitality spell, the thorns' damage increases to @Damage[(@item.rank)d6[piercing]] until the start of your next turn.” (a second control);
- “Additionally, if you become Grabbed, Restrained, or otherwise held Immobilized in a creature's grasp, such as by being engulfed or swallowed, the creature takes @Damage[(ceil(@item.rank / 2))d4[persistent,bleed]] damage.” (persistent damage);
- “Each time a creature takes damage in this way, <spell>'s duration decreases by 1 round.” The module shortens the marker, and ends the spell at none left.
- An emanation around the caster with one linked PF2e Effect that is only an Aura: “Each time a creature within the emanation takes fire damage, it catches on fire, taking @Damage[(ceil(@item.level/2)+1)d4[persistent,fire]] damage.” PF2e's aura Effect is the marker.
- Target `1 weapon`: “If a creature is wielding the weapon at the end of its turn, the weapon discharges a burst of sound targeting one creature adjacent to the wielder. The sonic damage dealt is equal to the number of successful Strikes … (to a maximum of 4 …).” with the list “1: @Damage[…], 2: …, 3: …, 4: …”. The Retaliate control asks how many Strikes hit, and deals that entry.

**An ally guarded against one enemy.** Target `1 ally and 1 enemy`, a fixed or sustained duration, one damage entry, no linked Effect, and:
- “Each time the enemy attacks and damages the ally, the enemy takes 1d6 spirit damage.” (matching the entry, heightened by the item's interval);
- optionally “The enemy is aware of these spirits and has a general sense that attacking the ally will draw the spirits' ire.”, and one narration sentence before.

**Set (retaliates)** needs exactly the two targets. It tells them apart by the caster's PF2e alliance: one ally (not the caster) and one creature that isn't an ally. The marker (“<spell> (against <enemy>)”) goes on the ally. The Ongoing control **Retaliate: <spell> — <enemy>** needs no targeting and hits only that enemy. A sustained spell adds the usual Sustain control each turn, and a missed Sustain ends it.

**Shields in the caster's champion aura.** No Target or area, one damage entry, one linked PF2e Effect, and these sentences only:
- “You Raise your Shield, causing ephemeral spirit shields to float within your champion's aura.”
- “The shields last until the start of your next turn or until you're no longer raising your shield, whichever comes first.”
- “While one of your allies is in your champion's aura, the shields grant them a +1 status bonus to AC, and each time an enemy makes an attack against the ally, the enemy takes 1d4 spirit damage (even if it misses).”
- optionally the two sentences about the benefit applying only in the aura and not to you.

The Effect must have exactly three rules:
- an Aura giving allies (not the caster) an Effect;
- the AC `FlatModifier` (status, that value);
- PF2e's Raise a Shield `GrantItem`.

It must last 1 round to a turn's start. **Set (retaliates)** puts PF2e's Effect on the caster as the marker. **Retaliate** (target the attacker) deals the damage, heightened by the item's interval.

## 4i. Temporary Hit Points from a triggering creature

A reaction with the trigger “A living creature within N feet of you dies, or an undead creature within N feet of you is destroyed.” and the rules “You gain temporary Hit Points equal to the triggering creature's level plus your spellcasting attribute modifier.” (optionally “If the triggering creature was undead, double the number of temporary Hit Points you gain.”), plus “These last for the duration of the spell, and the spell ends if all the temporary Hit Points are depleted earlier.” Target the creature that died, and the card's button gives the caster those temporary Hit Points, on an Effect using PF2e's TempHP rule for the spell's duration.

## 4j. Healing at the end of the targets' turns

Target `1 creature` or `2 creatures (who are hostile toward each other)`, a fixed duration, one healing entry, and “The targets regain 1d4 Hit Points at the end of each of their own turns while the spell is in effect.” (matching the entry). **Start Healing** starts an Ongoing record for each target. At the end of each of its own turns, the target regains the healing, heightened by the item's interval and applied with PF2e's healing. “If a target uses a hostile action against the other target, the spell ends for the target that used the hostile action.” is a GM reminder to end that target's record.

## 4k. A Hit Point transfer

Target `1 willing creature`, a fixed duration, and “When you Cast this Spell and at the start of each of your turns, if the target is below maximum Hit Points, it regains 2 Hit Points (or the difference between its current and maximum Hit Points, if that's lower). You lose as many Hit Points as the target regained.” The optional sentences are read: no modifiers, temporary Hit Points ignored, works on undead, no regeneration, Dismiss and ending at 0 Hit Points. So is “Heightened (+1) The number of Hit Points transferred each time increases by 2.”

**Link (transfer Hit Points)** moves them now and at the start of each of the caster's turns, as direct Hit Point changes. The spell ends when the caster is at 0 Hit Points.

## 4l. Damage shared with the caster

Target `1 creature other than you`, one healing entry, a fixed duration, and:
- “When you first Cast the Spell, the target recovers 1d4 Hit Points.”
- “The first time each round that the target takes damage, reduce the damage it takes by 3 (to a minimum of 0 damage).”
- “You lose 3 Hit Points each time, or the total damage dealt, if less than 3; this damage ignores any immunities or resistances you have and can't otherwise be mitigated in any way.”
- optionally “The spell ends immediately if you fall Unconscious.” and “You can Dismiss the spell.”

Fixed-rank Heightened entries may read “You can target 2 creatures other than you. The initial healing increases to 3d4 Hit Points and the maximum damage reduced and Hit Points lost increases to 5.”

**Link (heal, then share damage)** applies PF2e's healing at the cast rank and marks each target. When a target takes damage, the Ongoing control “<spell>: <target> took damage” asks how much. Up to the amount comes back to the target (never past its maximum), and the caster loses as much, once per round per target.

## 4e. Effect + note (a linked Effect the module can't prove)

A spell with no save or attack that links exactly one PF2e Effect (unscoped, or applied on use), whose text the module can't prove the Effect covers (or which doesn't say who receives it), is resolved as **Effect + note**. The plan is *guided*: PF2e's Effect isn't proven to carry the spell. **Apply Effect + Note** on the card does two things:
- It applies PF2e's Effect as PF2e defines it (its rules, its duration, and any choice PF2e asks for).
- It adds a rule-less “Spell Note: <spell>” Effect holding the spell's text at the cast rank, for the spell's duration.

These spells are counted apart from enabled spells.

- **Who gets it:** the caster when the text says “you …” and has no Target, and the targets when the Target line names creatures. Otherwise the card asks the caster who receives it: the caster or the targeted creatures.
- **Durations:** as for spell notes (section 4d). An instantaneous spell whose Effect lasts takes the Effect's duration for the note. Weeks, months and years become days.
- **Not this route:** damage entries or dice, healing, `@Damage`, counteracting, a save or attack, or more than one linked Effect. Those take their own routes or stay blocked.
- To have the module prove the whole spell instead (and count it as enabled), write the text in one of the Effect-route forms in section 4.

## 5. Afflictions (Pseudo Afflictions)

The save route resolves the immediate outcome and hands the final degree to the **Pseudo Afflictions** module. Without Pseudo Afflictions, the card tells the GM which affliction and stage to apply.

```html
<p>Your touch spreads a marsh fever. The target must attempt a Fortitude save.</p>
<hr />
<p><strong>Critical Success</strong> The target is unaffected.</p>
<p><strong>Success</strong> The target is @UUID[…]{Sickened 1}.</p>
<p><strong>Failure</strong> The target is afflicted with mire fever at stage 1.</p>
<p><strong>Critical Failure</strong> The target is afflicted with mire fever at stage 2.</p>
<hr />
<p><strong>Mire Fever</strong> (disease)</p>
<p><strong>Level</strong> 1</p>
<p><strong>Maximum Duration</strong> 6 days</p>
<p><strong>Stage 1</strong> @UUID[…]{Sickened 1} (1 day)</p>
<p><strong>Stage 2</strong> @UUID[…]{Enfeebled 1} and sickened 1 (1 day)</p>
```

**Rules:**
- Exactly one stage block, with the name in bold and consecutive `Stage 1`, `Stage 2`, … entries. It may also sit before the table between two `<hr />`.
- Outcomes must say “is afflicted with NAME at stage N”, “is afflicted with stage N NAME” or “takes full/double the TYPE damage and becomes afflicted with NAME at stage N”. NAME must match the block's name (a leading “the” and a trailing poison/disease word are allowed).
- The spell's Duration must be blank (instantaneous).
- **Delivery damage** that happens before the save: “You deal 1d4 piercing damage to the touched creature and afflict it with NAME. The target must attempt a Fortitude save.” To make the save depend on the damage: “If the target takes piercing damage, they must attempt a Fortitude save.”
- **Immunity:** “Creatures that have the goblin trait … are immune” inside the block is checked from traits.

**Pseudo Afflictions only knows spells in its own registry, keyed by spell slug.** A homebrew affliction spell resolves everything else, and its card tells the GM to apply the affliction manually, unless Pseudo Afflictions knows its slug.

## 6. Affliction care (no save)

These phrasings work, each as a sentence of its own (a single short opening narration sentence is allowed):

- “The target decreases the values of any Doomed and Drained conditions it has by 1 and can immediately attempt one saving throw against each affliction it has with a stage length of 1 day or less.”
- “The target is then temporarily immune for 1 day.”
- **Mode lists:** a `<ul>` with `<li><strong>Lessen a Toxin</strong> Reduce the stage of one toxin the target suffers from by one stage. This can't reduce the stage below stage 1 or cure the affliction.</li>` and `<li><strong>Reduce a Condition</strong> Reduce the value of the target's Clumsy, Enfeebled, or Stupefied condition by 2. You can instead reduce two of the listed conditions by 1 each.</li>`, introduced by “When you cast X, choose to either reduce a condition or lessen the effect of a toxin.”
- “An unwilling target can attempt a Will save to negate X.”
- **Counteract:** “You immediately attempt to counteract a single effect on the target with the emotion or possession trait, or an effect giving the target the Controlled or Fascinated condition.”

Target must be `1 creature` or `1 willing creature`, or empty for your own care (“… affecting you”). The GM resolves these from a choice dialog.

### Counteract checks

The card rolls the caster's PF2e counteract check (its spellcasting's counteract modifier; the counteract rank is the cast rank) against each thing the GM picks, using that thing's counteract DC and rank. The dialog suggests them:
- **A Pseudo Afflictions affliction:** its DC, and half its level rounded up.
- **A spell's Effect:** its level, and the originating caster's spell DC when known.

By the rules, a critical success counteracts up to 3 ranks higher, a success up to 1 higher, and a failure only lower ranks. A counteracted Effect or affliction is removed (an affliction is cured).

Accepted sentences:
- **Your own effects:** “Attempt a counteract check against one emotion effect affecting you.” (no Target). Heightened: “You can attempt counteract checks against any number of emotion effects affecting you.”
- **Anything magical (Dispel Magic):** Target `1 spell effect or unattended magic item`, with “Attempt a counteract check against the target.”
  - Target a creature to counteract a spell's Effect on it, or target no one and name an area or item in the dialog. The card then says to end the area, or makes the item mundane.
  - Optionally add all three of: “If you successfully counteract a magic item, the item becomes a mundane item of its type for 10 minutes.”, “This doesn't change the item's non-magical properties.” and “If the target is an artifact or similar item, you automatically fail.”
- **Damage, then an affliction:** “Deal poison damage equal to the spell's rank to the target, then attempt a counteract check against one disease or poison afflicting the target.”
  - The damage entry must be `@item.rank` of that type.
  - Optional: “If the target is immune to poison, this spell has no effect.” and “The target is then temporarily immune for 24 hours.”
  - Heightened: “You can attempt counteract checks against any number of poisons or diseases afflicting the target.”
- **A choice of healing or counteract:** “You heal yourself in one of the following ways, chosen by you when you cast the spell.” followed by list items “You regain 8 Hit Points.” (the healing entry) and “You attempt to cure one poison or disease afflicting you; attempt to counteract the affliction.”
  - “Heightened (+1) If you choose to regain Hit Points, the Hit Points regained increase by 8.” must match the entry's interval heightening.
- **Reduce, then counteract at higher ranks:** “Choose an affliction on the target, such as a curse, disease, or poison. If it has advanced past stage one, reduce the stage by one. This reduction can be applied only once to a given case of an affliction, with the case ending when it's completely cured.”
  - Then “Heightened (3rd) Attempt to counteract the affliction if it is a disease or poison.”
  - The counteract is against the affliction chosen for the reduction, if it has a listed trait.

**Counteracting a spell as it's cast** (a reaction): Target `the triggering spell`, or none with a Trigger naming a spell. Write “You attempt to counteract the triggering spell.” or “Attempt to counteract the target spell.” The GM names the spell, its rank and its caster's spell DC. Also accepted:
- **What a success does instead of ending it:** “If the spell would be counteracted, it instead continues with the caster as a target instead of you.” or “If the attempt is successful, any creatures that would be damaged by the spell instead take only half as much damage, but the spell otherwise works as normal.”
- “Treat <spell>'s counteract rank as 2 higher for this attempt.” The bonus is added to the rank.
- “<Spell> can't affect spells that aren't targeted (such as area spells).” This is shown to the caster.
- **Automatic:** “You automatically counteract the spell, but the feedback brings you unavoidable harm.” No roll and no DC.
- **A cost:** “You lose 1d8 Hit Points per rank of the triggering spell.” The caster loses that many HP (not damage).

The Trigger line is repeated on the card for the caster; the module doesn't check it.

**Using a lost spell slot's rank:** “You lose your spell slot as if you had cast the triggering spell.” + “You then attempt to counteract the triggering spell, using the rank of the spell you lost for the counteract rank.” + “You can lose a plant or wood spell to counter earth, an earth spell to counter water, …” (the cycle). The dialog asks for the triggering spell's element and the element and rank of the spell you lose, checks them against the cycle, and uses that rank for the check. The card tells the caster to expend the slot.

**A counteract that sets off an explosion:** Target `1 magic item or spell effect`, with the item's basic save and damage entry, and:
- “You attempt to counteract the target.”
- “If the attempt succeeds, an explosion of magical force deals 8d6 force damage with a basic Reflex save.”
- Optionally the item rule (“If you successfully counteract the magic of an item, it's deactivated for 1 week (or destroyed on a critical success) and the explosion is a 5-foot emanation from the item.”) and the spell rule (“If you successfully counteract a spell, the effect ends and the explosion affects …”).

The explosion's damage and save must be the item's own; they're compiled from that sentence as a basic save. On a success, the Effect ends (a spell on a creature) or the card states the item rule by degree, and a save card for the explosion opens for the creatures you target.

**Counteracting an item or a ward:** Target `1 magic item` or `one magically sealed or warded doorway or chest`, with “You attempt to counteract it.” or “Attempt a counteract check against the target spell or magical effect that wards or seals a doorway or chest, such as …”. Outcomes:
- “If you succeed, it's deactivated for 1 week.” and “On a critical success, it's destroyed.”;
- “If it's an artifact or similar item, you automatically fail.”;
- “If you succeed, you recover its energy, restoring one of your expended spell slots of 3rd rank or lower.” with Heightened “You can restore an expended spell slot of 4th rank or lower.”

The GM carries these out; the card says which one applies.

**Suspend instead of end:** “You attempt to counteract any one affliction you are aware the target has, suspending its effects for 1 hour on a success rather than removing it.”
- On a success the affliction is set aside for that time, then comes back at the same stage.
- Optional: “The target is then temporarily immune to <spell> for 1 day.” and the awareness sentence (“You don't need to have identified …”).
- Heightened: “The target recovers an additional 1d8 Hit Points, and you can attempt to suspend an additional affliction” (the healing entry's interval step; one more affliction per step).

**Suppress on a near miss:** “Attempt to counteract an effect of your choice imposing one of these conditions on the target: Blinded, Dazzled, …” with:
- “If you didn't counteract the effect, but you would have if its counteract rank were 2 lower, instead suppress the effect until the beginning of your next turn.”
- “The effect's duration doesn't elapse while it's suppressed.”
- Optional: “This spell can't counteract or suppress curses, diseases, or conditions that are part of the target's normal state.” Effects with those traits aren't offered; the rest of the sentence is shown to the caster.
- Heightened: “Add Drained and Slowed to the list of conditions.” or “As 4th rank, plus add Petrified.”

The suppressed Effect is set aside until the start of your next turn, then comes back with its own duration unchanged. Also accepted:
- “If you failed to counteract the effect but you would have …”;
- “This spell can't counteract or suppress conditions that are part of curses, diseases, or a natural state of the target.”;
- “Add Immobilized, Slowed, and Restrained to the list of conditions.”

**A poison or non-curse effect:** “You can attempt to counteract a single poison or non-curse effect imparting the Clumsy, Dazzled, … or Stupefied condition.”
- Curse effects aren't offered.
- A Pseudo Afflictions poison is offered when its current stage imposes one of the listed conditions.
- Optional: “The target can choose to empower the flames with their life force, becoming Drained 1 (or increasing their drained value by 1, if already under the condition) to grant you a +1 circumstance bonus to your counteract check.” The dialog asks; if ticked, the target gains Drained and the +1 goes on the roll.

**You and your allies:** Target `you and up to 9 allies`, with “Choose one of the following three effects:” and list items. Each option applies to every target, and a healing option is rolled once for all:
- “The spell attempts to counteract fear effects on the targets.” (every fear-trait effect on each target, each with its own DC and rank);
- “The spell attempts to counteract effects imposing paralysis on the targets.”;
- “The spell restores 7d8 Hit Points to the targets.” (the healing entry; “When used to heal, <spell> restores 1d8 more Hit Points.” must match its interval heightening).

**Healing alongside:** “The target regains 16 Hit Points.” / “The target recovers 3d8 Hit Points.” (the healing entry; “The amount of healing increases by 8.” must match its interval heightening).

**A possession counteract:** “If they were affected by a possession effect, you attempt to counteract the effect, casting out the possessing entity on a success and preventing them from possessing the target again for 1 week.” Optionally add “If you fail, the entity is immune to being cast out by this spell for 1 week, though you can still heal the target as normal.” Both outcomes for the entity are GM notes; with no possession effect, only the healing happens.

**Standing wards:** a spell that lasts and counteracts something whenever it comes up. Casting it puts a ward Effect on the warded creature (or you), tracked in **Ongoing spells**. Each time the ward is triggered, use its **Counteract with <spell>** control: name the effect and give its DC and rank, and the caster's counteract check (at the ward's cast rank) decides. The spell needs a fixed duration (“8 hours”) or “until the next time you make your daily preparations” (the ward ends when the caster rests for the night). Accepted sentences:
- **A named spell:** “Choose a spell and name it aloud as part of the verbal component.” + “<Spell> attempts to counteract that spell whenever <spell>'s target is the target of the named spell or in that spell's area.” The dialog asks for the named spell.
- “<Spell> attempts to counteract all detection, revelation, and scrying effects used against the target or the target's gear throughout the duration, counting cantrips as 1st-rank spells for this purpose.” (Target may be `1 creature or object`; ward a creature.)
- **A reaction:** “For the duration of this spell, whenever you're targeted by a harmful polymorph effect, you can use your reaction to attempt to counteract the effect.” (no Target).
- **Reflecting a spell:** “When a spell targets you, you can spend a reaction to attempt to reflect it.” + “This uses the rules for counteracting the spell, but if the spell is successfully counteracted, the effect is turned back on the caster.” + “Whether or not the counteract attempt is successful, <spell> then ends.”
- **Notes shown with the ward:** “Successfully counteracting a spell that targets an area or multiple targets … negates the effects only for the … target.”, “<Spell> can't affect spells that aren't targeted (such as area spells).”, and the “reflect … back at you again” sentence.
- **Heightened:** “The duration increases to 10 minutes.”
- **An area (no Target; the ward sits on you):** “You create a visible magical barrier that attempts to counteract teleportation effects and planar travel into or out of the area, …”; “You create an immobile globe around yourself that attempts to counteract any spell from outside the globe whose area or targets enter into the globe, as if the globe were a Dispel Magic spell 1 rank lower than its actual spell rank.” The rank offset is applied to the check.
- **Seeing through, secretly:** “The GM rolls a secret counteract check against any illusion, morph or polymorph effect in the area, but only for the purpose of determining whether you see through it (…)”, or “The GM attempts a secret counteract check against each illusion that is at least partially within the area. Instead of counteracting the illusion, you see through it (…).” The roll is blind and the result is whispered to the GM; a success says you see through it, and nothing ends.
- **Suppressing, secretly, for the spell's duration** (Target `the creature you hit`): “The GM attempts a secret counteract check against each illusion affecting the creature; on a success, you suppress the illusion for the duration, rather than end the effect.” Each illusion Effect is set aside for the spell's duration and then returns.

Without Pseudo Afflictions, a counteract against an affliction becomes a GM instruction on the card.

## Common pending codes

| Code | Meaning and usual fix |
| --- | --- |
| `residual-prose` | An outcome sentence isn't understood. See `unclaimed` for the exact sentence, and reword it into a supported form or remove it. |
| `description-effects` / `description-lifecycle` / `description-target-predicates` | A basic save's description has extra rules beyond the damage sentence and a supported rider. |
| `preamble:*` (for example `preamble:modifier`, `preamble:restriction`, `preamble:ongoing-trigger`) | A sentence before the degree table adds a rule (a bonus, “can't”, “each turn”, …). Move it into an outcome in a supported form, or remove it. |
| `item-duration-grammar` | The Duration field isn't a form the module reads. Use blank, `N rounds/minutes/…`, or `varies` (only if every condition states its own time). |
| `target-eligibility` | The Target field isn't a recognised form; see [Item fields](#item-fields). |
| `condition-duration-scope` | A lifetime's scope is ambiguous. Put the lifetime directly after the condition, or after a single list. |
| `native-spell-effect-scope` / `-recipient` | An Effect link has no provable recipient or timing; see [Buffs and reactions](#4-buffs-and-reactions-effect-route). |
| `manual:*` (for example `manual:conditional-effect`, `manual:forced-movement`) | The text contains a mechanic the module doesn't automate (“if”, “whenever”, pushes, choices, attitude changes, …). |
| `affliction-handoff:*` | The affliction name, stage or lifetime can't be proved; see [Afflictions](#5-afflictions-pseudo-afflictions). |
| `heightened-duration:*` | A Heightened entry changes the duration in a way the Effect route can't set (`unparsed`), the linked Effect's duration is neither the base nor the heightened one (`effect-duration-mismatch`), or the base duration isn't a fixed time (`base-not-fixed`); see [Buffs and reactions](#4-buffs-and-reactions-effect-route). |
| `unused-shared-damage` | A damage entry is never applied by any outcome; say how each degree takes it. |

## Pitfalls

- **Extra flavour sentences in outcomes block the spell.** Keep flavour in the first sentence of the description, before the rules.
- **Don't give a homebrew spell the slug of an official spell** that has a dedicated workflow (Heal, Force Barrage, Disintegrate, battle forms). The module will try that workflow and refuse the edited copy.
- **Rolled condition values** (`[[/r 1d4]]`), GM-choice wording (“at the GM's discretion”) and position-dependent rules stay manual.
