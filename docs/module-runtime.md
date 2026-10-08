# Foundry Module Runtime

The repository root is an installable Foundry VTT v14 module directory. It is
compatible with PF2e 8.5.0 and loads through `module.json`.

## Completed execution paths

- `effect`: apply one official native PF2e Effect.
- `effect-variant`: select exactly one Effect from the actual cast rank.
- `effect-choice`: prompt for exactly one form, then apply only that Effect.
- `effect-sequence`: apply the primary Effect and preserve its deferred
  successor transition.
- Heightened durations: where a spell's Heightened entry changes its duration
  and the Effect only carries the base one, the created Effect takes the cast
  rank's duration (`application.heightenedDuration`). The template must still
  have the duration it was compiled with.
- Dismiss: store dismissal authority and scope on the embedded Effect and
  remove the correct Effect instance after confirmation.
- `save`: stage executable basic and degree-outcome saves with native
  per-target dialogs, replaceable provisional results, an editable target
  roster, and one final application of PF2e damage and conditions.

For cast-wide Dismiss transitions, the caster's embedded Effect is the
controlling document. Removing it from the actor sheet also removes every
linked Effect with the same cast-instance ID; the chat button is only a
convenience control.

The module adds **Resolve Native Effect** to supported PF2e spell chat cards.
Target-recipient spells use the user's currently targeted tokens. Source effects
use the casting actor. A guided plan shows its unresolved capabilities before
confirmation but still permits its deterministic native Effect portion to run.

Every Effect is cloned from `pf2e.spell-effects` using PF2e's normal embedded
Item creation lifecycle. If a multi-target application fails partway through,
the module rolls back the Effects already created by that attempt.

## Interactive saves

For executable save plans, the module converts PF2e's existing save button into
**Prepare Saves — [native save label]** instead of adding a second control.
Executable guided outcomes use the same workflow. Unsupported spells retain
PF2e's native save behavior and disclose that it will not apply module effects.

The same workflow also executes fully compiled non-basic saves. Their
degree-specific conditions are applied as native PF2e Effect wrappers using
`GrantItem`. This preserves the compiled value, gives fixed-duration
conditions a real PF2e expiration, keeps each spell's condition separate from
pre-existing conditions, and cascades removal between the wrapper and granted
condition. Conditions with the same effective lifetime share one spell Effect;
conditions with different lifetimes receive separate Effects so their expiry
remains correct. Condition immunity is left to PF2e's native GrantItem
processing.

An undurated valued Stunned condition from an executable outcome is represented
as action debt. The ongoing workflow requests confirmation of actual actions
lost when the recipient regains actions, rather than inventing a round timer.

An unvalued Stunned with a stated rounds or minutes duration (“stunned for 1
round”) is timed Stunned instead: the recipient can't act for that time. PF2e
has no native timed Stunned, so the module grants Stunned 1 in a named, timed
Effect (“Stunned (can't act for 1 round)”) with no action-debt recovery, and
the condition ends when the Effect expires.

Recognized basic-save failure and critical-failure riders use the same condition
machinery, including timed Clumsy, Enfeebled and Prone. A bounded “On a failure”
condition also applies on critical failure, while basic-save damage retains its
own multiplier. Each outcome receives an independent condition specification.
A rider does not bypass independent targeting, timing, native Effect or
unrecognized-prose gaps, including additional Speed rules.

The target phrase “undead or otherwise has void healing” compiles to a shared
creature predicate. It checks the undead trait or PF2e's prepared native
void-healing HP state and rechecks eligibility before applying the outcome.
See the [rider-family verification](verification/phase-2-rider-family.md).

Bounded persistent-damage prose can describe a critical-failure-only rider or
separate initial/persistent amounts across all four degrees. Initial damage uses
the native spell roll; persistent formulas use native PF2e DamageRoll and create
native persistent-damage conditions. Future ticks stay out of the original
resolution's confirmed damage total. Rank-derived formulas heighten once, and
explicit double damage multiplies the result rather than changing the dice count.
Additional condition, timing, targeting or unrecognized prose still blocks the
whole resolution. Native PF2e controls later ticks, recovery and type stacking.

Save-wide temporary immunity accepts bounded “the target/creature then becomes”
and “is then” clauses with a stated minute/hour duration. The existing marker
applies after any eligible resolved degree, including critical success, and
prevents repeat module applications until it expires. It does not suppress
manual native rolls or arbitrary third-party macros. See the
[damage and immunity batch evidence](verification/phase-2-damage-immunity.md).

Condition timing is scoped to its clause. A repeated predicate such as “and is”
starts a new clause, so a later Off-Guard deadline cannot turn a preceding
Stunned value into a timed condition. The native turn clock maps an explicit upcoming target turn to the correct
same-round deadline. A simple “A and B for one round” retains
its shared deadline. Bounded affirmative “forced to its knees, becoming prone”
prose, “falls prone” and “is knocked prone” create a native untimed Prone
contribution, separate from preceding timed
conditions. Uncompiled Prone instructions remain a resolution gap.

A standalone “half the [type] damage” sentence uses the shared damage roll only
when exactly one structured damage component matches that type. Pronoun-based
save-wide immunity requires an immediately preceding target save sentence that
matches the item's save statistic. Both rules apply to renamed/custom sources;
unknown clauses remain gated. Typed damage claims in the save preamble must
match structured damage components one-to-one, so additional or duplicate damage
instructions cannot be silently omitted. See the
[clause-family evidence](verification/phase-2-clause-family.md).

A condition explicitly linked to another condition in the same outcome receives
its own Effect and retains the exact root grant identity. For example, Slowed
while Sickened ends when that cast's Sickened contribution is recovered, removed
or expires. Other casts and unrelated conditions remain independent. Detaching
the root transfers its dependent Effects to manual management; detaching only
the dependent preserves it while ordinary root recovery continues. Missing or
ambiguous dependencies and unsupported dependency chains remain blocked.

These are general mechanisms derived from compiled source rules. Names in the
[verification record](verification/general-rules-phase-2-3.md) identify test
fixtures, not runtime profiles. Older specialized spell paths remain migration
debt; this expansion does not complete the catalog or the architecture migration.

The resolution begins with the currently targeted creatures and the cast DC;
the spell-card button does not open a second preparation confirmation. While
the card is collecting saves, target more creatures and use **Add Current
Targets** to append them. Existing actors are deduplicated, and both eligible
and unaffected actors are preserved on the card. The roster locks when
finalization begins. The card then provides these explicit stages:

1. Each **Roll Save** button opens PF2e's normal roll dialog. Reactions,
   modifiers, and other pre-roll choices remain available. The roll is stored
   directly in that actor's row—with its total, d20 result, modifier, and
   degree of success—rather than producing a separate chat card. Actor owners
   send the compact result to the active GM over Foundry's module socket, and
   the GM updates the persistent resolution card.
   **Roll All Unrolled Saves** lets the active GM open those same dialogs in
   sequence and skips targets that already have a provisional result. Like
   PF2e's native check buttons, Shift-click toggles the save dialog: with the
   default PF2e preference, Shift-click skips it. Shift-clicking Roll All
   applies that choice to the entire sequence.
2. **Roll Save Again** replaces that target's provisional result as long as
   damage has not been applied. Characters also receive an embedded **Hero
   Point Reroll** control, which consumes the point, marks the check as a PF2e
   reroll, and replaces the stored result without creating another chat card.
   When a primary outcome requires an immediate compiled secondary save, that
   target's row opens a separate secondary stage with its own statistic,
   traits, inline result, ordinary rerolls, and Hero Point rerolls. Changing the
   primary result removes or recreates the secondary stage deterministically.
3. **Finalize Saves & Resolve** is the explicit decision boundary. It locks the
   target roster and save results, evaluates the shared damage and each distinct
   required outcome formula exactly once, then applies no, half, full, or double
   damage through PF2e's native
   `applyDamage` path, including immunity, weakness, and resistance handling.
   Targets with the same outcome formula share its roll; mixed outcomes retain
   both their shared multiplier and separate damage rider. For degree-outcome
   saves, the same action applies the conditions compiled for each target.
4. The module posts one consolidated **Damage & Effects** result card. Damage
   totals are rendered in lightly emphasized PF2e-style type badges using the
   system's colors and familiar icons (fire, cold, electricity, and so on); persistent
   damage also displays the hourglass marker used by PF2e. Its
   normal three-card structure is therefore the original spell, the editable
   save-resolution card, and the final result card. Native PF2e save messages
   are not created by this workflow.

The resolution state is stored on the chat message and survives reloads. The
active GM coordinates save-message updates so the target's owner may click and
roll their own save. If application is interrupted, or a traced reroll appears
after that target's damage was applied, automation stops and labels the cast
for manual review rather than risking a second application.

Persisted TokenDocument UUIDs are authoritative when restoring targets after a
reload. Each synthetic actor is re-derived from its own token, and application
stops before making changes if two saved rows resolve to the same actor or a
token resolves to an actor other than the one originally snapshotted.

Compiled target eligibility is recorded when the resolution card is created
and checked again immediately before results are applied. An ineligible Actor
stays visible on the card as **Unaffected**, rolls no save, and receives no
damage or conditions; it does not prevent eligible creatures in the same area
from resolving. Reblooded requires the undead trait. Painful Vibrations, Stop
Heart, Enervation, and the saving-throw branch of Deathless March require living
creatures (creatures without the undead or construct trait). Bandit's Doom is
excluded because its initial target is an Item and its creature save occurs
only after the later theft trigger, which this Actor-save runtime does not yet
execute.

The executable degree-outcome gate requires complete semantic coverage and no
pending or delegated capability. It accepts bounded outcome-scoped formulas,
including persistent damage, formula reuse across targets, supported rank
variables, and simple interval heightening. It still excludes uncompiled
persistent-component exceptions, sustained or event-linked conditions, native
Effect outcome branches, deferred or recurring follow-up saves, unsupported
terminal effects, decisions, and manual instructions. Those plans retain
PF2e's original save-button behavior.

Immediate, non-recurring secondary saves are executable when all four of their
outcomes are fully bounded to supported damage, conditions, or automatic
death. Finalize waits for every required secondary result, rolls distinct
secondary-outcome damage formulas once, and applies those results together
with the primary outcome. Automatic death uses PF2e's Dead status and only
clears Dying and Unconscious after that status is confirmed. Phantasmal Killer
is the first official plan enabled by this path. Deferred or recurring
secondary saves—such as turn-end progression for Petrify—remain gated until a
durable combat reminder/controller can own them across later turns.

## Sequence behavior

Effect-ended sequences retain their successor data on the primary embedded
Effect, so chat history is not authoritative. Deletion or expiry prompts the
active GM to apply the successor. Action-used sequences expose a control on the
resolution receipt and also inspect PF2e action chat messages. The public API
can explicitly signal an action when a workflow does not create a chat message.
While a sequence's temporary-immunity successor remains active, the runtime
refuses to reapply its primary Effect and identifies the blocking actor in a
warning. This enforces both Shield and Guidance immunity markers.

## Public API

```js
const api = game.modules.get("pf2e-automatic-resolution").api;

await api.execute(spell, {
  castRank: 5,
  sourceActor: spell.actor,
  targets: [...game.user.targets]
});

await api.dismiss(effectItem);

await api.triggerActionUsed(actor, "Compendium.pf2e.feats-srd.Item.Shield Block");

await api.saves.start(spell, {
  plan: await api.compile(spell),
  castRank: 3,
  sourceActor: spell.actor,
  targets: [...game.user.targets]
});

await api.saves.addTargets(resolutionCard, [...game.user.targets]);
await api.saves.finalize(resolutionCard);
```

`basicSaves` remains as a backward-compatible alias of `saves`.

## Debug logging

Enable **Debug Logging** in Foundry's module settings to write cast-scoped,
structured diagnostics to the browser console. Logged data includes persisted
and resolved target identities, save revisions, damage multipliers and HP,
condition groups, every document returned by PF2e's `GrantItem` expansion, and
application state transitions. Logging is a client setting and is disabled by
default.

To print the persisted state for a resolution card from the console:

```js
game.modules.get("pf2e-automatic-resolution").api.debug.latest()
```

`api.debug.cast(messageOrId)` prints a specific card. The shorthand
`api.debugCast(messageOrId)` is also available.

`execute` accepts `choiceId` to bypass the choice dialog when another trusted UI
already collected the selection, and `skipConfirmation` for controlled testing.
Normal chat-card execution always preserves the confirmation window.

## Installation for development

Link or copy this repository into Foundry's `Data/modules` directory under the
folder name `pf2e-automatic-resolution`, enable it in a PF2e world, and reload.
No external Foundry modules are required.

## GM corrections before Finalize

The coordinating GM can expand **GM corrections** on a collecting save card to
exclude/restore a target, change a rolled primary or secondary degree, or mark
a target Affected/Unaffected for this cast. Original dice remain visible beside
the effective-degree note. Exclusion preserves the roll for restoration; a new
native roll clears its degree override. Changing the primary branch removes
inapplicable secondary results and requires a fresh secondary roll if recreated.
Eligibility corrections retain the original restriction and never install an
actor-wide immunity or change an actor's traits.

Corrections reject stale target revisions and lock when finalization begins or
manual review is required. They share the cast's queue with one-click Finalize;
only the active coordinating GM can write them. Player controls stay hidden.
Existing controls refresh locally on GM connect/disconnect or role changes,
while completed, unready, and busy controls stay locked.

PF2e damage requires a real target token. A snapshotted token must still resolve
to its original actor. Actor-only API calls can use exactly one active token;
missing or ambiguous damage tokens stop before any actor is changed. Excluded
and Unaffected targets are skipped. See the [Phase 1 release report](verification/phase-1-release.md)
for tested fixtures, permissions, and reproducible compiler test setup.

## Phase 2 outcome corrections and confirmed damage

Save state schema 9 adds per-target `conditionOverrides` and native application receipts on `damageResults`. The coordinating GM can adjust a compiled condition's positive value and fixed/unlimited duration from **GM corrections → Adjust [condition]** before Finalize. The dialog can restore the calculated outcome. Original values, durations, and the GM identity are retained. Primary or secondary rerolls and degree changes invalidate condition adjustments; completed or review-required casts remain locked. These controls do not authorize unsupported mechanics.

The existing `api.saves.correctTarget(card, targetId, correction)` accepts `{action: "condition", conditionIndex, changes: {value?, duration?}, expectedRevision?}`; an empty `changes` restores that condition. Indices select the current primary conditions followed by the current secondary conditions. Callers must use the current revision when retaining a selection across a dialog.

PF2e remains responsible for damage, IWR, shield reduction, temporary HP/stamina, and persistent damage. `native-damage-receipt.js` observes PF2e's `updateActor` damageTaken and its uniquely tagged `damage-taken` chat receipt. A successful receipt records actual native damage separately from healing, with no HP-delta estimate and no predicted persistent ticks. Missing or ambiguous receipts stop for review after possible irreversible application. Receipts are persisted before the next damage application. Group totals deduplicate application IDs; review states show an explicitly incomplete confirmed subtotal. Older results without receipts are not retroactively inferred.

Both public Apply and Finalize are serialized per cast. Outcome wrappers retain separate cast/application/target ownership; native GrantItem deletion removes that wrapper's grants, leaving other casts and pre-existing conditions intact. Receipt records include the native persistent-condition IDs for traceability; ending a timed clumsy/deafened wrapper does not end independent persistent damage.

This phase does not claim new catalog families. Save branches with unimplemented native Effects remain unsupported; existing direct native Effect mapping remains covered by runtime tests. Retained expiry, durable successor obligations, Guidance/Shield action-versus-ending reconciliation, and an ongoing overview belong to Phase 3.

## Phase 3 ongoing casts

The scene token controls include **Ongoing spells**. Grouped reminder cards also
open this overview. Players see casts they own or participate in; the GM sees
all casts and can end, detach contributions, or take over uncertain work.
Native save rolls remain provisional until GM finalization. Use explicit
**Sustain** controls for Bless and Floating Flame; generic Sustain chat messages
do not establish which spell was sustained.

JournalEntry flags under `pf2e-automatic-resolution.ongoingCast` hold durable
cast state, contribution UUIDs, obligations, exposure and confirmed transitions.
One active GM performs writes. No GM means work waits. Native PF2e expiry is
reconciled even when automatic removal is disabled, and confirmed ending
consequences survive deletion, reload and GM handoff without replay. Interrupted
writes require manual reconciliation. Detached and permanent contributions are
preserved. Module socket registration is required; after installing this
manifest change, return to Setup and relaunch the world once.

`api.ongoing.open()` opens controls; `records()` returns visible snapshots;
`reconcile()` requests a coordinator reconciliation. `start(item, options)`
supports verified baseline Petrify, Floating Flame and Bless. Custom
`startAura(item, declaration)` is GM-only and requires explicit radius,
`durationSeconds`, `frequency: "once-per-round"` and `events` containing
`enter` and/or `turn-start`, with native basic-save damage data. The GM reviews
membership before any collector is prepared. This API does not turn arbitrary
spells into verified auras.

Petrify requires a confirmed organic target and action budget. Flame requires
native Region placement and GM path/target review; it does not calculate legal
movement automatically. New damage exposures use native spell damage at the
cast rank. Uncertain timing and source loss stop for review. A player Flame path
left unresolved at turn end requires manual reconciliation. Review controls
never silently replay missed saves or damage. See the
[Phase 3 evidence and boundaries](verification/phase-3-release.md).

## Phase 4 immediate spells

Verified baseline Heal, Force Barrage and Disintegrate native spell cards offer
**Resolve Immediate Spell**. Cast normally first: native PF2e spends resources,
and cancellation does not refund them. Choose missing action variants and shard
allocations; review targets, range, visibility and willingness. Three-action
Heal suggests creatures from its native emanation for explicit review. The GM
can override unusual Heal eligibility before application.

Owned no-roll recipients can resolve without a connected GM. Attack/save casts
require one; native dialogs retain MAP, fortune/misfortune, modifiers and roll
visibility. Private or blind checks restrict the durable collector. The GM can
correct effective degrees, rank and eligible targets before **Finalize**.
Original rolls remain recorded. Replacement targets need new checks, rank
changes clear checks, and critical Disintegrate hits worsen the Fortitude result.
Applied steps stay locked; interrupted or partial application requires review.

State lives in ChatMessage flags `pf2e-automatic-resolution.immediateCast`.
`api.immediate.start(item, options)` prepares the verified spell workflow;
`roll(card, targetId, stage, options)` opens a native attack or save check;
`request(action, data)` routes authorized corrections/finalization to the active
GM; `recover()` marks interrupted application for review without replay.
Native source cards are identity-checked and claimed to prevent duplicate use.
Healing receipts count actual native HP restoration, including capped healing.

Explicit Disintegrate objects are GM-confirmed scene Tiles or Drawings with AC
and artifact/volume eligibility reviewed before an attack. This does not infer
wall geometry or destroy inventory items. Range, cover, walls and object limits
remain explicit review boundaries. These three profiles do not establish support
for every immediate spell. See the [Phase 4 verification](verification/phase-4-release.md).

## Phase 5 transformations

Cast Animal Form, Dragon Form or Pest Form normally, then use **Choose and Apply
Form** on its native card. Review rank, form, access and available space. The
caster must be a native character with one active token linked to actor size.
Native casting spends resources once; canceling a form does not refund them.
Overlapping polymorphs require the GM to resolve the native counteract check and
confirm its outcome before replacement.

Native Effects supply form statistics and Strikes. Use native Strike controls
for attacks; use **Use Dragon Breath — 2 actions** for its reviewed area and
save collector. Breath damage uses native preparation and damage application;
its 1d4-round recharge persists across reloads. Encounter changes can require an
explicit GM timing correction. Dismiss through **Ongoing spells**. Expiry and
dismissal remove this form and its grants while retaining damage, spent slots,
actor edits and unrelated Effects. Temporary HP cleanup checks its native source.

The integration prevents native spell-entry casting and consumable activation
while transformed, and suppresses movement modes not granted by the form. Speech,
other gear activation, hand-dependent actions, access, area geometry and space
remain explicit player/GM review responsibilities. Native creature handling
applies only to characters; NPC forms and other form spells remain unverified.
Sovereign Dragon is withheld pending conflicting save-source clarification.

`api.forms.start(item, options)` opens selection and review;
`api.forms.request(action, data)` routes owned actions to the active GM. Durable
form records use the existing ongoing Journal flags and retain source-card
identity. Interrupted writes require review and are never automatically replayed.
Version and native Effect mechanics guards stop changed baselines for review.
See the [Phase 5 verification](verification/phase-5-release.md).


## Phase 2–3 coverage expansion (in progress)

Phase 6 is deferred. This is a tested expansion of the earlier representative
phase checkpoints, not a claim of complete spell coverage. See
[coverage evidence](verification/phase-2-3-gap-closure.md) and the
[candidate ledger](../reports/condition-ongoing-coverage.md).

- Enfeeble and Stupefy: **Prepare Saves**, native saves, then **Finalize Saves & Resolve**.
  Final outcomes apply native valued conditions with their individual durations.
- Evil Eye, Fear, Clinging Ice and Paralyze: **Manage Ongoing Spell** on the native
  spell card prepares saves. Finalize the results, then use **Ongoing spells** for
  Sustain, sight review, Retch, or due Paralyze recovery saves as applicable.
- Evil Eye's Sickened remains after the spell ends. Ending only releases its
  visibility-dependent recovery floor. Sight is an explicit ruling; token movement,
  relevant conditions, walls or darkness invalidate it. Review other visibility
  changes yourself. Retch uses native Fortitude rolls and the recorded spell DC.
- Fear and compiled Frightened outcomes reduce each owned contribution at the
  recipient's turn end. An unrelated contribution is preserved.
- Clinging Ice applies native cold damage once. Sustain retains the native Speed
  penalty and does not deal that initial damage again.
- Blindness applies its temporary-immunity marker on each eligible finalized save
  outcome. Repeat module resolutions respect it until expiry. Arbitrary manual
  native rolls and third-party macros are outside this immunity guard.
- Timber and Arrow Salvo apply their critical-failure conditions. Daze includes
  Stunned 1. Numbered Stunned no longer uses a one-round timer: **Ongoing spells →
  resolve Stunned action loss** confirms actions lost when regaining actions and
  reduces only that cast's condition. Account for Quickened and Slowed in that
  confirmation. Timed Stunned is a separate mechanic.
- Paralyze: success applies Stunned 1; failure applies one-round paralysis;
  critical failure applies four-round paralysis with optional end-turn Will saves.
  Success on recovery shortens the original duration, critical success ends it.

A native save roll remains provisional until **Finalize Saves & Resolve**.
Unsupported spell cards now explicitly state that native saves do not apply
module effects. Older already-created Stunned Effects retain their historical
state and require manual review; they are not silently migrated.


Compiled Sickened outcomes also expose **Ongoing spells → Retch — 1 action** to
the recipient's owner and the GM. Finalize the native Fortitude save to reduce
that cast's Sickened contribution. Other conditions and previously applied damage
are preserved. Verified examples are Ashen Wind and Painful Vibrations. New
recovery records retain the spell data and original DC even if the spell is removed
from the caster's sheet; the caster actor must still exist. Older casts without
that snapshot require manual review. A connected GM is required for recovery.

The Evil Eye, Fear, Clinging Ice and Paralyze adapters check pinned PF2e 8.5.0
mechanical data before starting. A changed compendium profile stops for review
instead of silently inheriting the adapter's old rules.

### Composed save outcomes

The shared save executor can select source damage components and apply different
multipliers within one native damage application, alongside conditions and
supported native Effects. This enables Ancient Dust, Cutting Insult, Bursting
Bloom and Tempest Touch through shared source rules. Persistent damage is left
to PF2e’s native condition workflow and is excluded from initial HP receipts.
Degree-selected Speed Effects are preselected without a second ChoiceSet prompt;
their own cast timing and expiration remain independent of damage and conditions.

Every participating target’s component mapping and native Effect mechanics are
checked before any HP change. Unknown/ambiguous damage instances or changed
native templates stop the cast for review. Full native rolls retain PF2e’s
minimum-damage and scaling behavior. Existing stored casts are not recompiled or
migrated. `inspectSavePlan(plan)` exposes the same capability decision as the save
executor with structured blocker codes, paths and explanations; these populate
the regenerated queue/catalog and [family audit](../reports/phase-spell-batches/composition-family-audit.md).
See [verification and limitations](verification/phase-2-composition.md).


### Inline persistent damage and linked recovery

The shared executor also composes one or two structured initial damage types
with a proved, rank-dependent inline persistent bleed expression. Grim Tendrils
and Ulcerous Canker use this rule: success halves initial damage without bleed;
failure applies both; critical failure doubles both. Every target's combined
roll is validated before HP changes. Native PF2e applies the initial damage and
persistent condition together, with one IWR calculation and one initial-damage
receipt. Future persistent ticks remain PF2e's responsibility.

A bounded harmless-impression sentence can certify an otherwise empty save
outcome. This enables Missed Cue using the existing damage, Frightened decay and
linked-condition runtimes. Slowed on failure or critical failure ends when this
cast's Frightened ends, independently of unrelated Frightened contributions.
See [live verification results](verification/phase-2-3-inline-family.md) for
all save degrees, legal ranks, resistance, turn recovery, reload and ownership.


### Generated Speed modifiers and inherited lifetimes

Exact save-degree clauses can now compose a generated native `FlatModifier`
Effect with damage and conditions. The modifier has its own lifetime and cast
ownership, with source/target next-turn anchors and native typed stacking. This
enables Chilling Spray and Magical Fetters without spell-specific dispatch.

Inherited save results retain predecessor modifiers, even when an added condition
has a different duration. “For the duration” is resolved only when the relevant
predecessor lifetime is unambiguous. Every target's source-bound modifier proof is
checked before HP or Effect writes. Unknown rules and unsupported event endings
still block the whole save route. (Grasping Grave's Escape ending is now covered;
see below.)
See the [full family audit](../reports/phase-spell-batches/speed-cross-family-audit.md)
and [verification matrix](verification/phase-2-3-speed-family.md).

### Event lifetimes: timer or Escape, and coordinated condition lists

A clause-scoped grammar (`src/compiler/condition-list-lifetime.js`) parses
coordinated grants such as “Stunned 1, and enfeebled 2 for 1 round, and
Immobilized for 1 round or until it Escapes, whichever comes first”. Each item owns
the lifetime written directly after it; an item without one shares the next
written lifetime in the same list. Valued Stunned (action debt) and Prone (ends on
Stand) never borrow another item's timer or Escape. Negated or hypothetical
predicates, caster subjects (“You are…”) and ordinary words (“drained away”) are
not grants. The residual checker now requires every listed condition to compile,
so a dropped continuation item keeps the outcome unaccounted.

The only executable event ending is exactly `[{event: "escape", dc: "spell"}]`,
either with a fixed timer (`expirationMode: "first"`) or alone (`"event"`).
Escape-terminable conditions get their own Effect, flagged with the cast's
snapshotted spell DC, so an Escape never ends a same-timer neighbor.
`scripts/escape-termination.js` watches PF2e Escape checks (`action:escape` roll
option; PF2e attaches no DC), grades each check against every flagged restraint
on that actor, including natural 20/1, and whispers the GM a review card. A
successful Escape frees the creature from one restraint, so the GM ends the one it
escaped and the others are marked “Not chosen”. Clicking End re-grades against the
current Effect before deleting it. The ongoing journal records the reason
`escaped`, and a hero-point reroll supersedes older pending cards for that actor.

`rollDamage` now refuses to roll when PF2e resolves the spell at a different rank
than the cast records. For example, PF2e clamps NPC variants to the caster's maximum rank.
See the [family audit](../reports/phase-spell-batches/escape-family-audit.md) and
[verification](verification/phase-2-3-escape-family.md).

### Recurring end-of-turn saves

`src/compiler/recurring-save-lifetime.js` recognizes a whole outcome sentence that
grants a recurring save. It must name its scope exactly: “…at the end of each of its turns to
end the confusion” (mode `end`, scoped to the one named condition), or “…to reduce
the remaining duration by 1 round, or end it entirely on a critical success”
(mode `reduce`, scoped to every condition of the outcome sharing one whole-rounds
timer). A different statistic, an unknown noun, a start-of-turn variant or extra
text keeps the sentence residual. The save attaches before `As failure` inheritance
and is removed only by that degree's explicit “no save to end early”.

The runtime accepts only `{timing: "turn-end", mode, statistic, sourceText}` using
the primary save's statistic. Recurring conditions get their own Effect. The flag
records the mode, statistic and snapshotted DC. On the native ongoing journal,
`scripts/recurring-save-recovery.js` watches the bearer's turn end. It judges the
same pre-reconcile clock as Frightened decay, records one obligation per exact
boundary, and prepares a recovery save card. `end` removes the Effect on a success.
`reduce` lowers the rounds value by one on a success, or removes the Effect on a
critical success. A skipped, jumped or reversed turn order goes to GM review with
nothing rolled. A save overtaken by expiry at the next turn start is closed as
skipped. Out of combat there are no turn boundaries, so no recurring save is
prepared.

A save spell's exact sentence “You can Dismiss the spell.” compiles cast-wide
dismissal. The Ongoing spells panel then offers the caster's owner a Dismiss
control that ends every contribution of that cast. Other Dismiss wording stays a
`dismissal` gap.

Save preambles that change the degree of success for some creatures (“if such
creatures roll a critical success … they get a success instead”) now raise
`preamble:degree-adjustment` and block the save route.
See the [family audit](../reports/phase-spell-batches/recurring-family-audit.md) and
[verification](verification/phase-2-3-recurring-family.md).

### Damage-derived consequences

`src/compiler/damage-benefit-compiler.js` proves caster benefits from exact
sentences: temporary HP from (half) a single target's damage or from the most-damaged
creature, healing with excess as temporary HP, or temporary HP only on a kill. Each
needs one matching duration sentence and a damage type equal to the only structured
component. Proven “reduced to 0 HP by this spell … dies” sentences compile a
`death` post-damage terminal. The runtime marks Dead only when this cast's confirmed
damage took the creature from positive HP to 0. Benefits are computed from PF2e
damage receipts and granted through a caster Effect with the native `TempHP` rule.
PF2e keeps the higher value and removes the remainder when the Effect ends. The
runtime confirms the actor write, because PF2e applies it after the Effect is
created. Area text “damage to living creatures in the area” now compiles a
living-creature predicate, and uncompiled caster-benefit sentences in save
preambles block the route. See
[verification](verification/phase-2-3-damage-derived-family.md).

### Self-help endings and GM-confirmed eligibility

Conditions a creature ends with its own Interact action compile to
`[{event: "action", action: "interact"}]`, either first-of with a timer or alone. They get
their own Effect, and the Ongoing spells panel offers the bearer's owner or a GM an
“Interact to end …” control. The Escape grammar also accepts “…can attempt to
Escape with an Escape DC equal to your spell DC”. Creature states PF2e does not
model (blood, internal organs, breathing) compile to a `gm-confirmed` predicate.
Each target shows the question on the save card, and Finalize waits for the GM's
answer. Save preambles now flag entering an area, “while the spell/effect…”, and
counteracting. A plain conjunctive “while” no longer counts as an ongoing trigger.
Intentionally withdrawn routes are listed in
[`planning/withdrawn-routes.json`](planning/withdrawn-routes.json). See
[verification](verification/phase-2-3-self-help-family.md).

### Generalized basic-save degree riders

`src/compiler/basic-degree-rider.js` recognizes basic-save riders by degree phrase
plus exactly one positional grant run, with an optional “, or X on a critical
failure” alternative. It runs after the original fixed-prefix rider compiler and
composes with GM-confirmed creature-state eligibility. The remaining description
must pass the simple gate, which now also rejects caster movement, eligibility
words and plain condition grants. See
[verification](verification/phase-2-3-degree-rider-family.md).

### Creature-dependent degree adjustments

`src/compiler/degree-adjustment.js` compiles a save preamble sentence that shifts
the degree of success for some creatures. Trait subjects (“Water creatures and
plant creatures use the outcome one degree of success worse…”, “Creatures with
the X or Y traits…”) are evaluated per target from PF2e traits. A described
population with an explicit map (“if such creatures roll a critical success …
they get a success instead, and if they roll a failure, they get a critical
failure instead”) becomes a per-target GM question on the card. **Finalize** waits
until every rolled target's question is answered. The card keeps the rolled
degree and shows “Spell rule: rolled → effective”; a GM degree correction
overrides the adjustment. Any other degree-shift wording keeps
`preamble:degree-adjustment` and blocks the route. See
[verification](verification/phase-2-3-degree-adjustment-family.md).

### Affliction handoff

`src/compiler/affliction-handoff.js` compiles the exact outcome sentences that afflict a creature “at stage N” with the description's single stage block, typed full/double shared damage, plain outcome dice, and the touch-delivery sentence (“You deal XdY piercing damage to the touched creature and afflict it with …”), whose damage applies at every degree. Progression is delegated to the Pseudo Afflictions module: at Finalize, each afflicted target's confirmed degree is sent through its `pseudo-afflictions.processMessage` hook, and the card records whether it created or advanced its affliction Effect, or asks the GM to apply the affliction manually when that module is inactive or doesn't know the spell. The core also blocks any degree save whose structured damage no outcome applies. See [verification](verification/phase-2-3-affliction-family.md).

Batch 2 adds:
- **Damage-gated delivery** (`resolution.damageGate`): a target that takes 0 of the delivery damage skips the rest of its outcome.
- **A basic-save affliction rider** for spells without a degree table.
- **Stage blocks placed before the table**, with trait immunity checked per target.
- **Degree-scoped affliction immunity** (an Effect that later handoffs respect).
- **A save penalty against one affliction** that stops once the handler's Effect exists.
- **GM-confirmed anatomy targets.**
- **Narration about the spell's own introduced vehicle.**
- **Implied value 1** for a bare linked valued condition granted directly.

### Affliction care, curse floors and behaviour choices

- **Affliction care** is a GM-resolved route for no-save spells that act on existing afflictions and conditions (Restoration, Restorative Moment, Take its Course, Ectoplasmic Expulsion). A resolve button opens a choice dialog, and results are posted to one card. See `scripts/affliction-care-runtime.js`.
- **Counteract** is also on this route, as `op: "counteract"` with a `source`:
  - `effect`: by trait or granted condition;
  - `affliction`: Pseudo Afflictions, by trait;
  - `chosen-affliction`: the one picked for a stage reduction;
  - `spell-effect`: `system.fromSpell` or a spell origin, plus `otherTargets`, a GM-named area or item when no creature is targeted.
- Each counteract picks `1` or `any`.
- Plans carry a `recipient` (`target` / `self` / `counteract-target`), and may add `damage` (`@item.rank` of a type) and `heal` (the healing entry, with the Dying rule) operations, `negatedByImmunity`, `magicItem` and `artifactFails`.
- Choices come in as `{counteracts: {[source]: [{id, dc, rank}]}, otherTarget}`.
- The roll is the spellcasting entry's `counteraction` statistic against the entered DC, and `counteracts(degree, castRank, rank)` decides. See [verification](verification/phase-4-counteract-care.md).
- **Counteracting a spell or an item/ward:**
  - Sources `triggering-spell` (recipient `triggering-spell`) and `other` (recipient `counteract-target`, with `otherKinds`).
  - Plan fields: `counteractOutcome` (success / critical success text), `counteractRankBonus`, `counteractLimit`, `castingCondition` (Trigger/Requirements, shown as “Caster:” notes) and `restoreSlot` (heightened by rank).
  - `automatic` skips the roll.
  - `lose-hp` (dice × triggering rank) applies to the caster after the counteract, which records the triggering rank on the shared cast context.
  - The GM carries out the outcome. See [verification](verification/phase-4-counteract-spells.md).
- **Set aside (`scripts/set-aside-runtime.js`):** PF2e can't switch an Effect off, so suspending or suppressing works like this:
  1. The Effect's source is stored on a marker Effect whose duration is the set-aside time (a fixed time, or until the start of the caster's next turn via `nativeConditionTiming`).
  2. The Effect is deleted.
  3. When the marker expires, the Effect is recreated, keeping its id where free, with `start` moved forward by the time away. Expiry is checked by the lead GM on `updateWorldTime`/`updateCombat` and when PF2e's “remove expired effects” deletes the marker. The GM deleting the marker ends it early.
  4. The restore removes the marker first and tolerates it already being gone. That was a real race with PF2e's sweep, fixed in this batch.
- **Care plans may also carry:**
  - on the counteract: `setAside` (suspend), `anyAffliction`, `optional`, and a numeric `pick` (from `counteractPickStep`);
  - on the plan: `nearMiss` (ranks, and a suppress set-aside with `pauseDuration`), `excludeTraits`, `counteractOutcome.failure`, and the `awareness`/`normalStateNote` notes.
- See [verification](verification/phase-4-counteract-set-aside.md).
- **More care plan fields:**
  - on a counteract: `afflictionTraits` (Pseudo Afflictions afflictions of those traits that grant a listed condition are candidates);
  - on the plan: `empower` (the target's Drained for a circumstance bonus, passed as a PF2e `Modifier` to the counteract roll).
- **Recipient `targets`** (`maxTargets`, `includesCaster`) runs the chosen list option on each target, shares one healing roll (`context.shared.heal`) and posts one card. The dialog's counteract rows carry `data-actor`, and picks come back as `{actorUuid, id, dc, rank}`.
- See [verification](verification/phase-4-counteract-many.md).
- **Light or darkness counteracts:**
  - `src/compiler/light-darkness-counteract.js` takes the “passes through” / “overlaps with” sentence out of any spell before compiling. It becomes a `counteract-along-path` / `counteract-overlap` reminder, allowed only on the save card; other routes get `counteract-reminder-route`.
  - The save card renders a **Counteract the …** button (`data-save-action="counteract-reminder"`). `counteractReminder(card, index, {choice})` asks the GM for the effect's name, DC and rank, rolls the spellcasting entry's `counteraction` check, applies `counteracts(…)`, and posts a message flagged `reminderCounteract`. It's also on the API as `saves.counteractReminder`.
  - `extractConditionalClause` reads “…, plus an additional @Damage[…] damage to <trait> creatures.”
  - See [verification](verification/phase-4-light-darkness-counteract.md).
- **Standing wards:**
  - A care plan with a `ward` operation (`resolution.ward`: `trigger`, `named`, `reaction`, `endsAfterUse`, `successText`, `cantripRank`, `notes`, and `duration` or `untilDailyPreparations`) creates a marker Effect on the recipient.
  - The marker is flagged `runtime.kind: "counteract-ward"` with the ward and its cast rank, and is registered as a native Ongoing record (begin, attach, activate).
  - The Ongoing spells manager shows **Counteract with <spell>** to the caster's owner or GM. It sends `ward-counteract` to the coordinator, which rolls the spell's counteract statistic, applies `counteracts(degree, ward.rank, rank)`, posts a `wardCounteract` message, and ends the record if `endsAfterUse`.
  - `pf2e.restForTheNight` ends the caster's daily-preparation wards.
  - See [verification](verification/phase-4-counteract-wards.md).
  - Wards may also carry `rankOffset` (added to the ward's rank), `secret` (a `rollMode: "blindroll"` check, result whispered to GMs) and `seeThrough` (a success is reported as seeing through; nothing is counteracted).
  - A care counteract may be `secret`, and may `setAside` an Effect in `suppress` mode for a fixed duration. A care card whose operations are secret is whispered to GMs.
  - See [verification](verification/phase-4-counteract-area-wards.md).
- **Lost slots and explosions:**
  - A `triggering-spell` counteract may be `rankFromLostSlot`, with the plan's `costSlot` and `elementCycle`. The dialog's `lostSlot` (against, element, rank) is checked against the cycle, and the lost rank is the counteract rank.
  - A care plan may carry `explosion`, `explosionNote` and `explosionPlan`. `compile-ability.js` compiles the explosion sentence alone as a basic-save plan, and the care route takes the spell before the basic-save branch.
  - On success the runtime (`care.saves = basicSaves`) starts the explosion's save card for `choices.explosionTargets` or the GM's targets.
  - See [verification](verification/phase-4-counteract-explosion.md).
- **Curse floors** (`outcome.conditionFloor`) create a curse Effect holding a locked grant of the floor value, plus an optional situational condition behind a toggle.
- **Behaviour choices** (`resolution.castChoice`) add choice buttons to the save card, block Finalize until one is chosen, and are written onto the affliction handler's Effect.

See [verification](verification/phase-2-3-affliction-family.md).

### Homebrew spells and `api.diagnose`

`game.modules.get("pf2e-automatic-resolution").api.diagnose(item)` reports the route a spell would take (`save`, `effect`, `affliction-care`, `immediate`, `form`, `ongoing` or `none`), its automation level, any pending capabilities, the save-route blockers and the unclaimed outcome sentences. See [Writing homebrew spells](homebrew-spells.md) for the formatting the compiler recognises.

### Lingering damage areas

Basic-save spells whose area persists (enter / turn-start / turn-end exposure over a duration) compile to `resolution.lingering` and run in the Ongoing panel. The GM places the area, the module suggests each exposure (once per round where stated), and the GM confirms it before a normal save card is rolled. An area whose text grants concealment gives each creature inside a Concealed Effect that follows membership. A sustained area asks the caster to Sustain each turn in combat, and a missed Sustain ends it. Areas with a degree-of-success table use the same workflow: a preamble sentence naming who saves and when compiles to the exposure events, and each exposure is an ordinary degree-save card. “When you Cast the Spell and the first time you Sustain it each round …” exposes everyone inside when cast and on the first Sustain each round. When the Sustain sentence has its own `@Damage[...]` formula (Animated Assault), Sustain exposures roll that formula at the cast rank instead of the item's damage. Emanation membership is measured from token documents (nearest squares, 5-10-5 diagonals), not canvas objects. See [verification](verification/phase-3-lingering-areas.md).

### Enemy-only recipients

“Each enemy in the area …”, “damage to all enemies in the area” and a Target of `enemies in the area` compile to the `enemy-of-caster` target predicate. The save card judges each target against the caster's PF2e alliance, captured when the saves are prepared:
- the caster and its allies are unaffected;
- the other alliance is affected;
- for a neutral creature, the card asks the GM.

Enemy-only lingering areas never expose the caster or its allies. See [verification](verification/phase-2-3-enemy-subjects.md).

### One-sentence degree tables

A non-basic save whose last rules sentence is a whole table (“… must succeed at a Will save or become Frightened 1 (or Frightened 2 on a critical failure)”) is rewritten at compile time into the standard four-degree table. It then runs on the ordinary save route, or as a lingering area when its subject names a trigger. See [verification](verification/phase-2-3-compact-degree-tables.md).

### Sustained saves with a degree table

A sustained spell (fixed maximum) whose save has a degree table runs on the shared save route. Its conditions without their own duration, and those “for the duration of the spell”, last while the caster Sustains. The cast's record in the Ongoing panel asks for Sustain on the caster's turns, ends the cast and removes its conditions on a missed Sustain, and never runs past the maximum. A sustained save that says anything else about Sustaining stays blocked (`sustain-effect`). See [verification](verification/phase-3-sustained-conditions.md).

### Spell attacks

A single-target attack spell whose text is one of the recognised attack forms runs on the shared save card with the check `spell-attack`. **Roll Spell Attack** rolls the caster's PF2e spell attack (with the multiple attack penalty chosen) against the target's AC. Damage and conditions are applied by the result: a critical hit uses the Critical Success row, a hit the Success row, and a miss is unaffected. The chat card shows **Resolve Spell Attack** beside PF2e's own attack buttons. See [verification](verification/phase-4-spell-attacks.md).

### Extra damage by creature trait

“… deals an additional @Damage[…] damage to creatures with the <trait> trait” compiles to `resolution.conditionalDamage`. At Finalize, the roll is made once and applied, scaled by each target's result, only to targets with that trait. This works for basic saves, degree tables and spell attacks. See [verification](verification/phase-2-4-conditional-damage.md).

### GM reminders on the save card

An attack spell whose only extra rule is counteracting magical light or darkness along its ray (exact official wording) is automated, and the card shows that paragraph as a **GM:** reminder. The module doesn't track magical light or darkness, so the GM resolves the counteract check. Pushes and pulls in an attack's results are also shown as **GM:** notes, one per target for their result; tokens aren't moved automatically.

### Damage typed by a sorcerer bloodline

`src/compiler/bloodline-damage.js` claims three sentences where PF2e's bloodline rules supply the damage type. Each needs PF2e's own mechanism:
- the draconic whole-damage sentence needs the item's DamageAlteration for `dragonBloodline`;
- the elemental one needs no item rules (the Elemental bloodline alters PF2e's listed slugs);
- the draconic extra-dice clause needs the item's DamageDice with the same die, `@item.level` scaling and the slug.

The claimed rule leaves `adapted.rules`, so the simple basic-save gate sees no unknown rule. An untyped entry's damage sentence is read as “untyped damage”. The plan gets `resolution.bloodlineDamage` (`bloodline`, `flag`, `part`, `die`). `executableBloodlineDamage` requires PF2e item damage and, for a type rule, only untyped components.

At start, `bloodlineDamageType` refuses a caster whose `flags.system[flag].damageType` is missing. After PF2e's damage roll, `bloodlineRollMatches` requires the bloodline's type among the roll's instances, and no untyped instance for a type rule. Otherwise nothing is stored.

Two general readings came with this batch:
- `area-choice.js` turns an Area paragraph of templates plus “in one of the various listed shapes of your choosing” into an `area-choice` card reminder. It's accepted on non-attack save cards.
- `target-predicate-compiler.js` reads `N creatures no more than X feet from each other` as `actorConstraints.mutualWithin`. The save card checks every pair of target tokens at start.

The attack table also reads “against each creature” and a shared-penalty sentence placed between the attack and its hit sentence. See [verification](verification/phase-4-bloodline-damage.md).

### Messages

`src/compiler/message-compiler.js` reads three exact messaging texts. The plan is `resolution.kind: "message"` with `message`:
- `words`, and `wordsApproximate` for “roughly”;
- `reply` (`words`, `brief`, `window` `reaction-or-next-turn`/`immediate`, `withinRange`) or null;
- `range` (feet, or null for planetary);
- `delivery` (`immediate`/`when-asleep`), `maxTargets`, and `heightened` range or target changes.

Any other sentence refuses the plan. Message's item duration “see below” is its reply window.

`scripts/message-core.js` (`isExecutableMessagePlan`) is shared by the census, where the route is `message`, and by the runtime.

`scripts/message-runtime.js`:
- **Start:** checks the rank's target count, and each target's range from the caster's token. Enforces the word limit (not a “roughly” one). Creates one card per target (flag `message`), whispered to GMs and the owners of the caster and target. A dream message's card goes only to the caster and GMs until **Deliver**.
- **Reply** (`message-reply` request through the lead GM): checks the target's owner, one reply, the encounter window (`deadline`: the target's next turn in the running combat), range for Message, and the reply's word limit.
- **Deliver** (`message-deliver`, GM only): marks the card delivered and adds the target's owners to its whisper.
- **Chat card:** **Send Message** comes from `main.js`, and `api.messages` exposes `start`, `reply` and `deliver`.

See [verification](verification/phase-4-messaging.md).

### Spells cast through a thrall

`src/compiler/thrall-compiler.js` reads a Target of `1 of your thralls` with one of three sentences. The Target becomes the save's recipients: empty for an area, `1 creature` for a reach. The sentence becomes the ordinary save wording, and the plan gets `targeting.thrall`:
- **emanation:** `radius` must equal the item's emanation;
- **line or cone:** `size` must equal the item's area;
- **within:** `within` and `maxTargets: 1`, with no area;
- **always:** `range` (the item's range in feet) and `destroyed`.

A destroyed thrall adds a `thrall-destroyed` reminder. `executableThrall` checks the spec; the reminder is accepted only with `destroyed`.

In `basic-save-runtime.js` start:
- The thrall is `options.thrall`, or the one targeted token, or asked by `chooseThrall` among the targeted tokens. It's removed from the save targets.
- The caster's token must be within `range` of it.
- For an emanation or reach, every target must be within that distance of the thrall's token.
- `state.thrall` records it, and the reminder names it.

A line or cone isn't measured, since the caster places it. See [verification](verification/phase-2-thrall-spells.md).

### Temporary immunity wordings

`compileSaveImmunity` (`save-preamble.js`) reads more lead-ins before “temporarily immune”:
- “Regardless of the result/outcome/effects (of its save)”, “No matter the result”, “After attempting its save”, “After the effects are resolved”;
- “The target must attempt a <save> and is then temporarily immune for …”;
- a unit of days, which `basic-save-core.js` now accepts.

It stays strict in three ways:
- A pronoun subject must directly follow the target's own save of the item's statistic (`TARGET_SAVES`, including “… depending on its Will save.”).
- A named immunity must name this spell.
- Anything else returns null.

**New guard:** an outcome clause scoped to “against the triggering attack/Strike” adds `condition-scope:triggering-attack`. Before, that wording compiled to a plain condition with no duration.

**Census effect:** 12 plans gained an immunity reading. None became executable; each has other blockers (see [the note](verification/phase-2-temporary-immunity-wording.md)).

### Degree-of-success Effects

`src/compiler/degree-choice-effect.js` (`compileDegreeChoiceNativeEffects`, after the degree Speed binding) takes one Effect linked in the outcomes. It needs:
- exactly one ChoiceSet with a `rollOption` and degree values;
- every other rule a `FlatModifier`, `RollTwice` or condition `GrantItem`, unconditional or predicated only on `<rollOption>:<degree>`;
- a 1-round, turn-start duration.

`proveDegreeChoiceRow` matches each offered degree's active rules to the row's sentences:
- an attack penalty (value, type, and the “while it's off-guard” guard);
- “first time” or “every time” worse-of-two rolls;
- granted conditions, which must be the row's own.

**The outcome Effect** gets `outcomeRule.kind: "degree-choice"`, with the selection, `claims` (credited by residual prose) and `carriedConditions`. Those compiled conditions are marked `carriedBy`: `snapshotEffect` keeps the mark, and `groupedConditionSources` skips them.

**At run time:**
- `inspectNativeOutcomeEffect` re-proves the claims against the live template.
- `prepareNativeOutcomeEffectSource` presets the ChoiceSet, found by `rollOption` (or by flag for the Speed proof).
- PF2e appends the degree to the Effect's name.

**Lingering areas (same batch):**
- `compileLingeringSaveTriggers` merges “…, each creature in the area takes X damage.” and “An affected creature attempts a <save>.” into one trigger, claiming the original sentences.
- `extractConditionalClause` also reads “; creatures with the <trait> trait take an additional @Damage[…] damage”.

See [verification](verification/phase-3-degree-choice-effects.md).

### Long-tail rules (batch 2)

- **Sustained target saves:** `compileLingeringArea` falls back to `compileTargetRepeat` when there's no area. The lingering declaration is `centre: "targets"`, `events: ["sustain"]`, `initial: true`, with an optional `memberCondition`. `startLingering` records the targeted token (`declaration.targetTokenUuids`), and membership is that token. `syncMemberCondition` gives each member an Effect granting the condition, which ends with the cast. `isExecutableLingeringPlan` accepts `targets` only without an area and with a Sustain-only exposure.
- **Rest lifetimes:** `compileEffectDuration` reads the two rest wordings into `endsWhen: [{event: "rest", mode: "end" | "decrement"}]` (`isRestLifetime`). `compileRowRules` turns a “doesn't end when the spell's duration does” sentence into the same rest lifetime. `conditionDuration` gives these no timer, and the wrapper Effect carries `restLifetime`. `restLifetimes` in `main.js` runs on `pf2e.restForTheNight` (lead GM): it deletes “end” wrappers, and lowers each condition a “decrement” wrapper grants, deleting the wrapper at 0. PF2e fires that hook for player characters only.
- **Durations:** a bare “for the duration” is a fixed spell duration. “for an unlimited duration” is unlimited, only for the condition it follows (up to the next condition link).
- **Escape:** “At the end of each of its turns, the target can attempt to Escape. The Escape DC is equal to your spell DC.” after a timer is rewritten as “or until it Escapes (the DC is your spell DC)”.
- **Save-row forced movement:** “The creature moves N feet toward the center.” gives `forcedMovement` with `direction: "center"`. It's credited by residual prose and shown as a GM note.
- **Guard:** “(start|end) of each of its/the target's turns” in a save preamble is an `ongoing-trigger`.

See [verification](verification/phase-3-long-tail-batch-2.md).

### Long-tail rules (batch 3)

- **Any number of creatures:** the Target `any number of creatures` compiles as complete targeting with no predicates.
- **“Varies” durations:** the outcome durationSpec rule also accepts a valued Frightened or Sickened with no duration and no `endsWhen`, since PF2e ends it.
- **Rolled condition values:** `compileRowRules` reads `Drained [[/r 1d4]]` as `valueRoll: "1d4"` with `value: null` (valued slugs only). `basic-save-core` accepts `valueRoll` (`/^\d+d\d+$/`). Before `conditionSources`, the runtime rolls it with `new Roll`, writes `target.conditionOverrides[index]` (`rolled`, `userId`) and posts the roll.
- **Trailing timers and self-limiting conditions:** a valued Frightened or Sickened isn't timed by a timer written after another condition. This is handled in three places:
  - `condition-list-lifetime.js`: `selfLimiting && !own`;
  - the heuristic path in `description-parser.js`: timer candidates are dropped when another reference lies between;
  - `duration-compiler.js`: `rawAt`/`afterEffect`.
- **Degree-choice Effects:**
  - `ruleValueAtRank` evaluates rank arithmetic (`@item.level`, `ceil`/`floor`/`max`/`min`) safely.
  - `Weakness` rules are proven against “has weakness N to T” at the cast rank (`outcomeRule.rank`). “The spell can't be sustained.” is accepted only with “until the end of your next turn”.
  - The Effect may also last the spell's own duration (a fixed duration, or a sustained maximum). A row ending sooner gets `outcomeRule.durationOverride` (`1 rounds, turn-end`), which `native-outcome-effects.js` applies before timing.
  - Claims are stored as the raw row sentences so that residual prose credits them.
- **Stored triggers** (`src/compiler/stored-trigger.js`, `scripts/stored-trigger-runtime.js`):
  - `extractStoredTrigger` reads a “first creature that … triggers …, causing the spell to end” + “deals XdY T damage to the triggering creature, which must attempt a S save”, or a “When a creature …, it takes … depending on the result of its S save. The spell then ends.” preamble. The damage must be the single damage entry.
  - It rewrites the preamble into a one-target save and keeps the cast's Target in `castTarget`. The plan lifecycle becomes instantaneous, and it sets `plan.resolution.storedTrigger` (notes, caster row notes, `supersedes`, `durationSeconds`).
  - `inspectSavePlan` refuses it (route `stored-trigger`), and `isExecutableStoredTriggerPlan` accepts it.
  - The spell-card button **Set (waits for its trigger)** calls `StoredTriggerRuntime.start`. It ends a superseded casting, puts a marker Effect on the caster and begins an Ongoing record.
  - The Ongoing control **Trigger <spell>** (one targeted token) goes through the coordinator (`stored-trigger`). It opens a save card with `storedTriggerExposurePlan`, whispers the row notes to the GM and ends the record (`triggered`).

See [verification](verification/phase-3-long-tail-batch-3.md).

### Long-tail rules (batch 4)

- **Persistent-only damage:** `compilePersistentOnlyDamage` (`component-damage-compiler.js`) reads rows that say “half the / the full / double the persistent <type> damage” for a spell whose one damage entry is persistent. It uses the component proof `persistent-only-degree-rows`, accepted by `validate-plan.js` and `inspectSavePlan`. PF2e's `DamageRoll.alter` scales the persistent instance (“0.5 * 1d6 persistent cold”).
- **Persistent lifetimes in save rows:** `compileRowRules` turns “<condition> until the persistent <type> damage ends” into `endsWhen: {event: "persistent-damage-ended"}` when the row deals that persistent damage. A “varies” duration accepts these lifetimes, and also rows whose only Effects are persistent-linked.
- **Save-row persistent-linked Effects:** “Until the bleeding stops / While it's taking this persistent <type> damage / As long as …, the target has weakness N to A and B damage.” binds the row's Effect as `persistent-linked-effect` with `check: "save"`. That proof is allowed on success and failure rows of a save, and a spell attack keeps hit rows only. `inspectLinkedEffectClaim` reads `Weakness` rules; their predicate may only name the same persistent damage.
- **Flag degree Effects:** `compileDegreeFlagNativeEffects` (`degree-choice-effect.js`) handles an Effect after the table with one ChoiceSet `flag` whose numeric choices are labelled by degree. Its `Weakness` values use the flag and are proven per row at the cast rank (`proveDegreeFlagRow`). The kind is `persistent-linked-degree-effect`: the selection is preset by flag, and `persistentLink` is set at runtime.
- **Save adjustment:** `compileSaveAdjustment` (`save-preamble.js`) reads “If …, it gains a +N circumstance bonus to its save.” into `resolution.attackAdjustment` with `appliesTo: "save"`. The card asks the GM for each target using the attack-adjustment question. `rollSave` refuses an unanswered target and passes a `spell-save-adjustment` circumstance modifier.
- **Repeating stored triggers:** “If / Whenever / Each time a creature … during the spell's duration, it must attempt a S save.” with no damage gives `endsOnTrigger: false`. The duration “until the beginning of your next turn” gives `markerDuration {1 round, turn-start}`, and the marker starts at the caster's initiative. Triggering doesn't end the record. “, the penalty applying to its attack roll” becomes a note.
- **Inheritance:** in `mergeInheritedOutcome`, “As X, but <Condition N>” replaces the inherited condition of the same slug.

See [verification](verification/phase-3-long-tail-batch-4.md).

### Rank 1 batch 1

From now on, batches go through the blocked spells in rank order.

- **Rule-stated sentences (Effect route):** `ruleStatedSentences` in `direct-effect-resolution-compiler.js` sets aside a sentence the linked Effect's rules state exactly, before the completeness checks. It covers the Bulk limits (two `ActiveEffectLike` addends) and fists (a `Strike` fist plus `ItemAlteration`s).
- **Failed-save follow-up:** `compileBasicFailedSaveFollowUp` (`basic-follow-up.js`) reads “If the target fails the save, you … <action link> …” plus “Choose/Use …” sentences into a `failed-save-follow-up` reminder (evidence `basicFollowUp`). The card shows it as **Caster:**.
- **Basic save adjustment with a gated condition:** `compileBasicSaveAdjustmentRider` (`save-preamble.js`) makes the save question with a negative choice, allowed from −4 to 4 for saves. Its condition goes on success and both failure rows with `gate: {kind: "adjustment-and-damaged"}`, kept in the snapshot and in the grouping key. At Finalize it's applied only when the GM answered with a non-zero value and the damage receipts show damage; otherwise a note says why.
- **Row-modifier Effects:** `proveRowModifierClaim` (`effect-modifier-proof.js`) proves a row Effect whose rules are unconditional FlatModifiers stated by one row sentence with its duration. The kind is `row-modifier-effect`, anchored at effect start, or at the source turn for “until the end of your next turn”. It's re-proved at runtime in `native-outcome-effects.js`.
- **Rolled rounds:** `compileEffectDuration` reads “for [[/r NdM #rounds]]{NdM rounds}” / “for NdM rounds” right after a condition as `duration: {value: null, valueRoll}`. `isExecutableOutcomeCondition` accepts rounds only. At Finalize each target's roll is stored as a condition override (`rolledDuration`) and posted to chat. Rolled values and rolled durations merge into one override.
- **Basic save with its own table:** an instantaneous basic save whose explicit four rows restate the basic results compiles through the degree table (`compilerEvidence.basicTable`). This isn't done when the preamble has inline rolls, “instead” or a GM ruling, or a row mentions persistent damage.
- **Targets:** “the triggering foe/enemy”; a reaction's Target field that is its trigger (“A creature within N feet fails … check.”).
- **Guard:** “as determined by the GM” (or similar) in a save preamble is a `gm-adjudication` gap.

See [verification](verification/phase-rank-1-batch-1.md).

### Rank 1 batch 2

- **Rider grammar** (`basic-degree-rider.js`): “it's also …” / “they're …” are normalized before the list parser. A narrated participle lead (“is <adjective> by <noun>, becoming …”) is accepted when it has none of the flavor-blocking words.
- **Alternative area** (`compileBasicGeneralRider`): “You can change this spell's area to a @Template[…], provided you center the burst in …” (plus an optional size sentence) becomes an `area-choice` reminder, with `compilerEvidence.areaChoice`.
- **Weakness Effect rider:** `compileBasicWeaknessEffectRider` binds the one linked Effect to the critical failure as `weakness-effect`. `proveWeaknessClaim` (`effect-modifier-proof.js`) checks the Weakness types, the value at the cast rank and the duration. The compiler's unscoped link list is cleared so the link isn't pending.
- **Dice upgrade:** `compileBasicDiceUpgrade` gives `resolution.diceUpgrade {question, faces}` (evidence `basicDiceUpgrade`), unless the cast's own dice already have that size.
  - The card shows a **Caster:** Yes/No question (`dice-upgrade` action, `api.saves.answerDiceUpgrade`), and `rollDamage` refuses until it's answered.
  - “Yes” rebuilds PF2e's roll from its source formula (`toJSON().formula`, e.g. `{1d8[sonic]}`) with every die at the new size.
- **Unattended objects:** “Each creature and unattended object” is read as “Each creature” for a basic save, with an `object-damage` GM reminder (evidence `objectDamage`).
- **Action paragraphs** (`action-paragraphs.js`, `selectActionParagraph`): for a save spell cast as a PF2e variant with a 1–3 action time (Heal/Harm excluded):
  - The glyph paragraph for that count is kept and joined to the opening text.
  - Other glyph paragraphs, “Two Rounds” paragraphs, the action-count intro and variant-choice narration are removed.
  - Restating sentences must match the variant's data or they're kept (and block).
  - The Target “damage to a single enemy” is one enemy of the caster.
- **Evidence export:** `FilePicker.upload` returned `false` in `pftest` this run. The live results were read from the page and written to `docs/verification/` directly, with the regressions summarized.

See [verification](verification/phase-rank-1-batch-2.md).

### Rank 1 batch 3

- **Held triggers:** `extractHeldTrigger` (`stored-trigger.js`) reads a basic save whose damage happens when the cast's target does something. It gives `storedTrigger {held: true, …}`.
  - The repeating form must be sustained (`durationSeconds`). The once-only form has `markerDuration {1 round, turn-end, anchor target-turn, offset 1}`, and an optional `immunity`.
  - The caster's choice sentence becomes a note.
  - The text is rewritten to a plain basic save on the target. The adapted lifecycle is cleared, because the trigger keeps the Sustain; the plan lifecycle is instantaneous and not sustained.
  - `isExecutableStoredTriggerPlan` accepts the two held shapes. `storedTriggerExposurePlan` adds the immunity as `resolution.temporaryImmunity`.
- **Runtime:** `StoredTriggerRuntime.start` with `targets` (the spell card passes the user's targets) puts the marker on the target.
  - The sustained form is timed from the caster's initiative, with an Ongoing record `{sustained, castRound, maximumAt}`, so a missed Sustain ends it.
  - The next-turn form uses `nativeConditionTiming` with the target's initiative.
  - `trigger` always saves the stored target. The Ongoing control reads “Trigger <spell> (<target>)” and needs no targeting.
- **Targets:** `1 enemy` is one creature with the enemy-of-caster predicate.
- **Session note:** the `pftest` session dropped to the join page during this batch; rejoining as Gamemaster restored `FilePicker.upload`.

See [verification](verification/phase-rank-1-batch-3.md).

### Rank 1 batch 4

- **Penalty Effects** (`compilePenaltyEffects`, `degree-choice-effect.js`):
  - `parsePenaltyRow` reads a row's penalty (stated, “the penalty” from `preamblePenalty`, “the status penalty is –N”, or “As failure, except …”), optional end-of-turn save, “The spell ends at the end of the target's next turn.” and narration.
  - A flag Effect (`flagModifierShape`: one degree-labelled flag ChoiceSet plus one FlatModifier reading it) lasting the spell's fixed duration becomes `flag-penalty-effect` on each degree it offers (`selectionFlag/selectionValue`, optional `recurringSave`).
  - A row's plain one-modifier Effect lasting 1 round to a turn's end becomes `penalty-effect` (anchor `target-turn`).
  - The defining preamble sentence is claimed. Both kinds are re-proved at runtime (`proveFlagModifier`, `proveStaticModifier`).
- **Recurring save on a native Effect:** the runtime passes `recurringSave {mode: "end", statistic, dc}` into the Effect's runtime flags, so `recurring-save-recovery.js` handles it like a condition's. Residual prose credits the “can attempt another … save” sentence from the proof's claims.
- **Target-turn native Effects:** PF2e starts an Effect at its origin's initiative (the caster, which its rules may read). `createNativeEffect` updates `system.start.initiative` to the prepared value (the target's) when PF2e changed it.

See [verification](verification/phase-rank-1-batch-4.md).

### Rank 1 batch 5

- **Stated Effect after the table:** `compileStatedEffect` (`degree-choice-effect.js`) binds a single spell-duration Effect whose rules `proveStatedEffect` reads from one row sentence (Immunity remove) as `stated-effect`, on that row and on rows “As <that row>”.
  - The runtime marks these Effects `beforeDamage` and creates them before the target's damage. PF2e then applies bleed to a creature whose bleed immunity the Effect removed.
- **Thrall `within` form:** “A creature within N feet of the target thrall becomes …. The thrall is destroyed, and the creature must attempt a … saving throw.”
- **Inline options:** `normalizeInlineDamageFormula` drops `|shortLabel` and `|name:…`.
- **Condition roll** (`condition-roll.js`): the preamble roll and its result map give `resolution.conditionRoll {formula, results, chooseOn, options}`. Row effects are all three options marked `choiceGroup: "condition-roll"`, with their value and duration (a critical row may restate them), and claimed through `outcome.conditionRollClaims`.
  - The card rolls it in `start` (or uses `options.conditionRollResult`), and `targetOutcomeConditions` keeps only the rolled slug.
  - On a 4, readiness waits for **Caster:** buttons (`condition-choice`, `api.saves.chooseRolledCondition`).
  - `inspectSavePlan` requires each option exactly once and a well-formed roll.

See [verification](verification/phase-rank-1-batch-5.md).

### Rank 1 batch 6

- **Heightened allies option:** `compileSpell` sets aside a “Heightened (Nth) You can choose to have the benefits also affect all your allies in a @Template[emanation|distance:R] around the target.” block. A single-target Effect plan carries it as `resolution.heightenedAllies {minRank, radius, centre: "target"}`; any other route leaves `heightened-allies-option` pending. `EffectRuntime` asks the caster at that rank or higher (or reads `options.heightenedAllies`) and adds the caster's allies (`isAllyOf`) within the radius of the target's token.
- **Rule-stated sentences:** `ruleStatedSentences` also reads a DamageDice on Strike damage (`ruleValueAtRank` now evaluates `ternary/gte/gt/lte/lt`) and an AdjustStrike trait, and splits before a parenthesis. The duration-bound recipient check (`unscoped-effect-trigger-compiler.js`) ignores these sentences; the rank is passed in its context.

See [verification](verification/phase-rank-1-batch-6.md).

### Rank 1 batch 7

- **Attribute-chosen condition** (`attribute-condition.js`): `resolution.attributeCondition {options: [{slug, attributes}], tie: "creature-decides"}`. Row effects are every option (`choiceGroup: "attribute"`), with the row's value and the spell's fixed duration, claimed via `conditionRollClaims`.
  - `start` sets each target's `attributeCondition` from `actor.system.abilities.*.mod`: the single slug, or `pending` with the tied options.
  - The correction `attribute-condition` records a tie choice, and readiness waits for it. `targetOutcomeConditions` keeps the target's slug.
- **Caster-turn recurring saves:** `recurringSave.timing: "caster-turn-start"` (mode `end`) is accepted and written to the condition Effect. `recurring-save-recovery.js` adds the obligation when the caster's turn begins, instead of at the end of the bearer's turn.

See [verification](verification/phase-rank-1-batch-7.md).

### Rank 1 batch 8

- **Caster's type choice in a degree Effect** (`degree-choice-effect.js`): `degreeChoiceRules` accepts one more ChoiceSet when `casterTypeChoice` reads it as a flag of damage types without a predicate. Weakness types must be literal or that flag's reference.
  - `proveDegreeChoiceRow` reads the chosen-type weakness, “except the weakness is doubled” (from `inherited.chosenWeakness`) and “As failure, and … becomes <Condition> for 1 round or until they Escape” (a GrantItem with `onDeleteActions.grantee: "detach"`).
  - The outcome rule records `casterChoice`, `chosenWeakness` and `inherited`, and the runtime inspection re-proves them.
  - `compileCasterChoice` claims the preamble list (`casterChoiceSentence`), producing `resolution.casterChoice {flag, values, label}`. `weaknessSummarySentences` claims narration that only mentions weakness.
  - `residual-prose` accepts a clause that is only the Effect's link, and a proved “weakness N to” / “until they [[/act escape]]” clause.
- **Damage-type choice** (`lingering-area-compiler.js`): “takes 4d4 X or Y damage (your choice)” on one untyped entry gives `resolution.casterChoice {kind: "damage-type", values}`. `basic-save-runtime` rebuilds PF2e's `{4d4}` roll as `{4d4[type]}` and refuses any other form.
- **Card and ongoing plumbing:** `executableCasterChoice` guards both kinds. `state.casterChoice` has card buttons (`caster-choice`, `chooseCasterOption`) and a readiness check. `prepareNativeOutcomeEffectSource` presets the flag ChoiceSet from `runtime.casterChoice`. `startLingering` takes `options.casterChoice` or asks in a dialog, stores `record.casterChoice`, and passes it to every exposure card.
- **Next-turn areas:** “Any creature that's in the area or enters the area before the start of your next turn” gives events `initial` + `enter`, and `endsAt: "caster-turn-start"` (6 seconds) when the item has no duration. In combat `maximumAt` is null and reconcile ends the area when the caster's turn comes round. A cube counts as a placed area.

See [verification](verification/phase-rank-1-batch-8.md).

### Rank 1 batch 9

- **Several areas** (`lingering-area-compiler.js`): “<p><strong>Area</strong> three 5-foot bursts that don't overlap</p>” (two to five, the item's shape and size) sets `lingering.areaCount` and `separateAreas`. The areas' noun (“one of the clusters”, “a cluster”) is read as the area.
  - `startLingering` places `areaCount` templates (or takes `options.regions`). It refuses overlapping circles, and stores `regionUuids` (each also a cleanup entry).
  - Membership is any region. Reconcile ends the spell when all regions are gone and asks for review when only some are.
  - Any other Area paragraph adds the pending capability `area-paragraph`.
- **Once-per-round entering:** “the first time a creature enters … each round” gives `enterOncePerRound`. Reconcile skips another enter obligation for that actor in the same combat round, while turn-start exposures still apply.
- **Degree trigger with damage:** “…, it takes 3d4 poison damage with a Fortitude save (as …).” (`DEGREE_TAKES`). “Corpses within a <noun> decompose.” is claimed as narration about corpses.
- **Concealing clouds:** a basic area whose only exposure is on casting (`CAST_EACH`, “Each creature except you in the area when you Cast the Spell takes …”) lingers only with the concealment sentence. It has `events: []` and `initial: true`, and `isExecutableLingeringPlan` accepts that only with `concealment`.
  - Degree riders come from `compileBasicDegreeRiders` and are attached in `compile-ability`, which skips the other rider compilers.
  - A 1-round duration sets `endsAt: "caster-turn-start"`.
  - “This <noun> can be dispersed by a strong wind.” becomes `lingering.notes`, shown in the concealment Effect's description.

See [verification](verification/phase-rank-1-batch-9.md).

### Rank 1 batch 10

- **Damage with no check** (`src/compiler/direct-damage.js`): “It automatically hits and deals <dice> <type> damage to the target.” on a spell with no save, one damage entry and Target `1 creature` gives `resolution.kind: "direct-damage"`, which is in `SUPPORTED_RESOLUTION_KINDS`.
  - `EffectRuntime#executeDirectDamage` requires exactly one target (not the caster). It loads the cast-rank variant when the item isn't already at that rank, rolls `spell.getDamage()`, and applies the roll with IWR through `applyDamageWithReceipt`.
  - The card button reads **Deal Damage**.
- **Ally/enemy split** (`src/compiler/ally-enemy-split.js`): `resolution.allySplit {healing: {formula}, bonus, effect}`, with `proveAllyEffect` (one FlatModifier equal to the stated bonus, and the stated duration). It adds the `enemy-of-caster` predicate, and the linked Effect is no longer a pending scope.
  - `executableAllySplit` guards both save routes.
  - In the save runtime, `snapshotTargets` gives the caster's allies `mode: "ally"` (eligible, no save; `targetParticipates` skips them).
  - At Finalize, one `DamageRoll` of the healing formula at the cast rank heals each ally, and the re-proved Effect is created on each.

See [verification](verification/phase-rank-1-batch-10.md).

### Cantrip batch 1

- **Push rows** (`compileRowRules`, which now receives `adapted`): “takes half/full/double damage and is pushed N feet away from you” gives `outcome.forcedMovement {kind: "push", direction: "away"}`, removes that outcome's `forced-movement` manual instruction, and clears `manual:forced-movement` when none remain.
  - Not read when the Heightened text mentions distance or movement.
  - `residual-prose` drops the guided `forced-movement` claim for a claimed movement clause.
- **Terrain areas** (`lingering-area-compiler.js`):
  - Declaration: `lingering.terrain {difficulty: 2, movement: ["walk"], hazardous}`, with `enterDamage {formula, type}` for hazardous terrain and `recastEnds`. The clear-a-square sentence goes into `notes`.
  - Sentences: `CAST_ANY` (initial damage), `TERRAIN`, `ENTER_DAMAGE`, `CLEAR`, `RECAST`. Lines are accepted as areas.
  - An initial-only area lingers with concealment or terrain. “Until the start of your next turn, the area is …” sets `endsAt: "caster-turn-start"`.
  - `lingeringExposurePlan(plan, {event: "enter"})` rolls `enterDamage`, like `sustainDamage` for Sustain.
- **Runtime** (`ongoing-families.js`):
  - `startLingering` ends the caster's active record of the same spell (`recastEnds`), gives each region a `modifyMovementCost` behaviour (`difficulties.walk: 2`), whispers `notes` to the GMs, and stores `enterExposurePlan`.
  - Membership obligations carry their `event`, and `prepareSave` uses the enter plan for enter exposures.

See [verification](verification/phase-cantrip-batch-1.md).

### Cantrip batch 2

- **Attack-table degree Effects:**
  - `expandSpellAttackTable` accepts a spell Effect link after the attack sentence and places it after the Success row.
  - `degree-choice-effect.js` adds the value `critical-success` (`DEGREE_VALUE.criticalSuccess`). `proveDegreeChoiceRow` reads the Speed-penalty row and the Escape sentence, returning `escape: true`.
  - “for 1 round” counts as timing for 1-round Effects. The outcome rule carries `escape {dc: "spell"}` and `heightenedDurations` (from `parseHeightenedDurations`, which also reads “The effects last for N units”).
  - `validate-plan` and `inspectNativeOutcomeEffect` accept `criticalSuccess` for degree-choice Effects.
  - `prepareNativeOutcomeEffectSource` sets the heightened duration for `runtime.castRank`, and for Escape writes `flags.outcomeEffect.escape {dc: runtime.dc}` (the card's spell DC), which `EscapeTermination` grades.
  - `residual-prose` accepts the proved Escape sentence.
- **Replacement rule** (`direct-effect-resolution-compiler.js` `replacementRule`): `resolution.replaces {spells, sourceText}`. `EffectRuntime` first deletes the recipient's Effects named `Spell Effect: <other>` whose origin is the caster (or unset).
- **`resistanceMismatch`:** a stated literal resistance or “(minimum N)” is checked against the Effect's `Resistance` values at the rank (blocker `effect-value-mismatch`). Values that depend on the actor are only accepted when the text states no number.

See [verification](verification/phase-cantrip-batch-2.md).

### Terrain batch 1

- **Terrain areas:** `CAST_DEALING` (narration, then “dealing <dice> to creatures in the area with a basic … save”), a narrated `TERRAIN` prefix and `DUST` ending narration. “You can Dismiss the spell.” gives `lingering.dismissible`; `startLingering` writes `record.dismissal {authority: "source-actor", scope: "cast"}`, which the existing `dismiss-cast` control ends.
- **PF2e data over text** (user decision 2026-09-26): `analyzeNativeEffectCompleteness` collects `dataNotes` instead of blocking.
  - `resistanceMismatch` now returns a note.
  - A recipient with `evidence: "pf2e-target-over-text"`, from `unscoped-effect-trigger-compiler` when the text says “you” but the Target is one creature and the spell has a duration.
  - A “+N bonus … such as <actions>” sentence whose actions the Effect's FlatModifiers of that value and type name.
  - `compileDirectEffectResolution` copies the notes to `resolution.dataNotes`. `EffectRuntime` shows them in the apply dialog and whispers them to the GMs after applying (`flags.kind: "effect-data-note"`).

See [verification](verification/phase-terrain-batch-1.md).

### Terrain batch 2

- **Inline area results** (`compact-degree-table.js` `expandAreaResults`): the results sentence after an area trigger is rewritten as a table (“… until it leaves the area[ or Escapes].” / “As failure, but the creature is also …”), with `areaResults` returned.
- **Generated Speed penalties:** `clauseDuration` reads “until it leaves the area (or Escapes)” as `{mode: "leave-area", escape}`, and `inheritedSpeedClauseComplete` accepts a critical-failure “knocked Prone” or “Immobilized for 1 round or until it Escapes”.
  - `compileGeneratedSpeedPenalties(plan, {lingering})` runs for lingering areas (proof `lingering: true`). `inspectGeneratedSpeedProof` accepts leave-area penalties only with that proof.
  - `prepareGeneratedSpeedEffectSource` makes an unlimited Effect flagged `leaveArea {castId}` (the area's cast), plus `outcomeEffect.escape` when it Escapes; it requires the card's `lingeringCastId`.
- **Runtime:**
  - `OngoingFamilies.prepareSave` passes `lingeringCastId`, and the save runtime keeps it on the card state.
  - `clearLeaveArea` runs in each lingering reconcile (creatures not inside) and in `OngoingRuntime.end` (everyone).
  - `EscapeTermination.end` also ends the same cast's other Escape Effects on that creature.
- **Degree-save terrain:** `compileLingeringSaveTriggers` claims `DEGREE_TERRAIN` sentences into `lingering.terrain`, and an `area.details` “that contain …” becomes a note. `uncompiledSavePreamble` adds the `terrain` signal.
- **Effect link set aside:** `compile-ability` sets aside an unscoped Effect whose only rule is the table's Speed penalty (`compilerEvidence.areaEffectLink`).

See [verification](verification/phase-terrain-batch-2.md).

### Rank 2 batch 1

- **Persistent damage in a basic save:** `assessSimpleBasicSaveDescription` (`semantic-gate.js`) no longer treats “N persistent TYPE damage” as an uncompiled signal when it's exactly one of the item's persistent damage entries. The shared roll carries the persistent instance, and `DamageRoll.alter(multiplier)` scales it like PF2e's half/double buttons.
- **Save adjustments:** `compileSaveAdjustment` reads four phrasings (“If …, it gains/takes …”, “It gains … if …”, and a subject such as “A creature …”, “Prone creatures or those …” or “Creatures with the X trait” that “take(s) a –N … penalty”). It reads bonuses and penalties, circumstance or status, and strips a “The target must attempt a … save; ” lead and a colon lead-in. A basic save whose only extra sentence is one of these sets `compilerEvidence.basicSaveAdjustment`, which the core accepts as a compiled composition. The core now allows `status` for save adjustments, and `rollSave` passes the modifier with its type.
- **Inherited durations:** `mergeInheritedOutcome` rewrites “As success, but the effect lasts N unit.” / “As failure, except the duration is N unit.” to the inherited conditions with that fixed duration, and sets `inheritedDurationText`. Residual prose claims it (`inherited-duration`).
- **Belief narration:** residual prose claims “The target believes/feels/thinks …” as `narrative-context` when it has no signals or manual semantics, names none of the row's effects, and the row has compiled effects.

See [verification](verification/phase-rank-2-batch-1.md).

### Rank 2 batch 2

- **Granted attacks:** `ruleStatedSentences` (`direct-effect-resolution-compiler.js`) sets aside “(Label) You gain a <baseType> attack that deals NdM TYPE damage[ and has the … traits].” when a `Strike` rule matches its base type, damage and traits (plus `magical`).
- **Skill-to-action bonuses:** `analyzeNativeEffectCompleteness` also accepts an action sentence whose “bonus to” list is only skill checks (optionally “to <Action>[ or …]”, optionally “in areas of dim light or darkness”) and saves. Every action link must sit in such a phrase, and a `FlatModifier` of the value (`ruleValueAtRank`) and type on that skill must carry `action:<slug>` (and the lighting predicates for the qualifier). This exact form adds no data note; the “such as” form keeps its note.

See [verification](verification/phase-rank-2-batch-2.md).

### Rank 3 batch 1

- **Push rows:** `compileRowRules` reads “The creature/target [takes half/full/double damage and ]is pushed N feet[ away from you][ and knocked Prone].” A damage clause needs row damage, and a push-only row needs none. “and knocked Prone” needs the row's compiled Prone. A missing direction needs a cone or emanation area, or a creature target.
- **Push notes:** the wall and ledge sentences before the table go to `resolution.forcedMovementNotes` and the preamble's claimed sentences. `uncompiledSavePreamble` signals `collision` for any other firm-surface, solid-barrier or ledge sentence. The core refuses notes without a push row.
- **Runtime:** `state.forcedMovementNotes` holds the notes with `@Damage[…]` worked out at the cast rank (`Roll.safeEval`) and `[[/act …]]` named. `forcedMovementNote` appends them to each target's **GM:** push reminder.

See [verification](verification/phase-rank-3-batch-1.md).

### Rank 3 batch 2

- **Push rows:** `compileRowRules` rewrites the comma form and the damage-then-push two-sentence form into the push pattern. It accepts “and (is) (then) knocked Prone”, and `forcedMovement.sourceText` is the push clause itself.
- **Heightened distance:** “Heightened (+N) … the distance the target is moved on a failure and critical failure increases by M feet.” sets `forcedMovement.heightening {interval, feet}` on those rows. `snapshotOutcomes` adds the steps at the cast rank.
- **Pull before the saves:** the exact adjacent-creatures sentence becomes `reminders[{kind: "area-pull"}]` with `compilerEvidence.areaPull`. The core allows it only with that evidence, `reminderHTML` renders it as plain text, and `uncompiledSavePreamble`'s `forced-movement` signal now also catches “creatures that … are pushed/pulled”.
- **Correctness:**
  - `uncompiledSavePreamble` drops a reaction's leading Trigger paragraph.
  - `inferDamageMultiplier` ignores “equal to (half) the damage …” (a benefit's measure).
  - The residual `caster-subject` signal also catches a lowercase “you …” clause after a semicolon.
  - Fearful Feast had been compiling wrong multipliers behind its Trigger blocker. It now stays blocked on its unread rules.

See [verification](verification/phase-rank-3-batch-2.md).

### Cantrip / rank 1 batch 1

- **Narration:**
  - `uncompiledSavePreamble` drops “While …” sentences with no rule words before signalling.
  - `assessSimpleBasicSaveDescription` ignores “that only creatures in the area can hear/see”.
  - Residual prose claims a short rule-free, condition-free clause about the target as `narrative-context` in a row with effects.
- **Row notes:** `compileRowRules` adds `outcome.rowNotes [{kind: "remaining-actions"}]`. The core allows only that kind, with its exact sentence. `snapshotOutcomes` keeps them, and `forcedMovementNote` renders them as **GM:** lines per target.
- **Restated conditions:** “It then remains X and Y until …” clones the earlier rows' conditions with the same duration text (`remainsSourceText`, claimed as `condition`).
- **Ranged-attack penalty Effects:** `proveRowModifierClaim` (shared with the runtime re-check) proves the recoil sentence against a single `ranged-attack-roll` FlatModifier. It is either once (`removeAfterRoll`, unlimited, the condition from an earlier row) or round-long (1 round turn-start, with a GrantItem of that condition). The round-long form claims the extra “Until the start of their next turn …” sentence (`outcomeRule.claims`) and adds a `resolution.dataNote`.
- **Save cards now show `dataNotes`** (`state.dataNotes`) under the reminders, like the Effect route's **PF2e data** notes.

See [verification](verification/phase-cantrip-rank-1-batch-1.md).

### Cantrip / rank 1 batch 2

- **Target turn saves:** `compileLingeringSaveTriggers` → `compileTargetTurnSaves` handles a degree save with no area. It emits `lingering {centre: "targets", events: ["turn-start"], initial: false, sustained}`. `isExecutableLingeringPlan` accepts target-centred records with turn-start events as well as the sustain form. The runtime's existing target membership exposes the target at each of its turn starts.
- **Timing fix:** `nativeConditionTiming` (`condition-timing.js`) gives 0 rounds for offset 0 with turn-end expiry when the anchor creature's turn is the current one (“until the end of its turn” applied at its turn start). Turn-start expiry and offset 1 are unchanged.
- **Vision row Effect:** `proveRowModifierClaim` proves the visual Perception penalty with timing `target-turn`/0. A missing type becomes `resolution.dataNotes` (“untyped penalty a circumstance penalty”).
- **Weapon targets:**
  - `unscoped-effect-trigger-compiler` sets the recipient `weapon-wielder` (the target) or `weapon-wielder-self` (the caster) when the Effect has an owned-weapon ChoiceSet.
  - `target-predicate-compiler` completes those Target strings.
  - `ruleStatedSentences` proves the striking-rune, property-rune and extra-dice sentences, comparing with a punctuation-normalized copy.
  - `analyzeNativeEffectCompleteness` blocks any other “a +N … weapon” (`weapon-runes`) and adds the “until the start of your next turn” vs turn-end data note.

See [verification](verification/phase-cantrip-rank-1-batch-2.md).

### Cantrip / rank 1 batch 3

- **Pull saves:**
  - `compact-degree-table.js` `expandPull` rewrites the pull sentence, the optional Prone line and a variant's “instead of N” line into a table with “The target is pulled N feet toward you (and knocked Prone).”
  - `compileRowRules` reads that as `forcedMovement {kind: "pull", direction: "toward"}`, and the card's **GM:** note reads “pulled N feet toward the caster”.
- **Spell-attack targets:** `spell-attack-table.js` `TARGETS` accepts “1 living creature” and “1 creature or (unattended) object”. `target-predicate-compiler` completes “… or unattended object” (creatures are targeted; objects are the GM's).

See [verification](verification/phase-cantrip-rank-1-batch-3.md).

### Cantrip / rank 1 batch 4

- **Row Effect proofs:** `compileRowRules` tries each row sentence as written, with “can't use reactions and” split off (`rowNotes {kind: "no-reactions"}`, the row's `action-restriction` instruction removed), with “As failure, and the creature also takes …” rewritten, and, for a 1-round spell, with “ for 1 round.” added. `outcomeRule.claimText` is the proved form, and `claims` keeps the row's own sentence.
- **Inheritance:** an “As failure” critical row takes the failure row's proven Effect (`outcomeRule` cloned with `degree: "criticalFailure"`, `inheritedFrom`) and its row notes. `dropResolvedActionRestriction` clears `manual:action-restriction` when notes cover it.
- **Core:** row notes must be a known kind with its exact sentence. `no-reactions` also needs the row to apply effects, native Effects, damage or a push (user decision).
- **Preamble:** the per-action radius sentence is claimed for burst and emanation areas.
- **Push saves:** `compact-degree-table.js` `expandPush` reads the push sentence and allows only the action-count sentence and restatements matching the variant's target, range (a bare number too) or area. `expandPush` and `expandPull` refuse text that still has `action-glyph` paragraphs after the first `<hr>` (a base spell with variants).

See [verification](verification/phase-cantrip-rank-1-batch-4.md).

### Cantrip / rank 1 batch 5

- **Caster's move:**
  - `compact-degree-table.js` `expandMoveAny` rewrites the move and unwilling-save sentences into a table with “The target is moved up to N feet in any direction (M feet through a body of water).”, and returns a `willing-no-save` reminder.
  - `compileRowRules` reads it as `forcedMovement {kind: "push", upTo, optional, direction: "any", note}`. The core allows only that note form, and the card's push note adds “in any direction” and the note.
- **Reminder:** `willing-no-save` is allowed with `compilerEvidence.willingNoSave` and rendered plainly.

See [verification](verification/phase-cantrip-rank-1-batch-5.md).

### Cantrip / rank 1 batch 6 — note Effects

- **Compiler** (`src/compiler/note-effects.js`):
  - After residual analysis, `selectNoteClauses` turns each unclaimed clause whose guided kinds are behaviour, attitude, GM choice or perception into `outcome.noteEffects [{label, text, sourceText, duration}]`. So do clauses matching the explicit behaviour pattern or the reactions-scoped penalty. A clause is excluded if it has mechanical signals (damage, condition, save, state, movement, an unscoped modifier) or dice.
  - `noteDuration` uses `compileEffectDuration`, then “on its next turn”, then the spell's fixed or turn-boundary duration. A clause with no timing takes the row's other note duration. Text trimming drops already-applied damage and condition lead-ins.
  - The analysis re-runs, so residual prose claims `note-effect`, and the row's manual instructions of those kinds are dropped. “As X” rows inherit the named row's notes unless a note of the same label is their own.
  - Preamble sentences whose only signals are restriction, additional-condition or gm-adjudication are appended to the notes and claimed.
- **Runtime** (`scripts/note-effects.js`): `prepareNoteEffectSource` builds a rule-less Effect (book icon, a GM / player description, `nativeConditionTiming` for turn anchors). At Finalize the save runtime creates it on each target, lists “Note: …” and attaches it to the cast's ongoing record. The core validates notes with `validNoteEffect`.
- **Also:**
  - `proveRowModifierClaim` reads the “against you” penalty (predicate `target:signature:{item|origin.signature}`).
  - The save route accepts the two turn-boundary spell durations.
  - `target-predicate-compiler` reads “two/three creatures”.
  - A `caster-elects-success` reminder was added.

See [verification](verification/phase-cantrip-rank-1-batch-6.md).

### Cantrip / rank 1 batch 7 — Sustain-growing auras

- **Compiler:** `analyzeNativeEffectCompleteness` proves the growth sentence against the Aura rule's `N * @item.badge.value` radius and the counter badge (starting value 1, label count × N = the stated maximum). It returns `sustainGrowth {feet, maximum, badgeMax, sourceText}` (copied to `resolution.sustainGrowth`) instead of the `sustain-growth` blocker.
- **Runtime:** `EffectRuntime` begins the native record with `sustained`, `castRound`, `maximumAt` (the sustained maximum) and `growth`. `OngoingFamilies`' Sustain action raises the active entry's badge by one (capped, once per round). `mustSustain` already ends a native sustained record on a missed Sustain, which removes the aura.

See [verification](verification/phase-cantrip-rank-1-batch-7.md).

### Cantrip / rank 1 batch 8 — spell notes

A spell with nothing the module or PF2e could apply mechanically is resolved as a **spell note** (user direction; every rank, but counted apart from enabled spells).

- **Compiler:** `compileSpellNote` (`src/compiler/spell-note.js`) accepts a spell only when every one of these is absent: a save, the attack trait, damage entries, linked PF2e Effects, `@Damage`, linked conditions, counteracting, damage or healing dice, and any number PF2e could apply (a bonus or penalty, resistance, weakness, Hardness, Hit Points, a Speed, AC). The branch runs only where no other route compiled. It gives `resolution.kind "spell-note"` with `note {recipient, environment, text, target, area, duration, heightened, heightenedDurations}`.
  - **Recipient:** `target` for a creature Target line (“1 creature”, “up to 3 creatures”, “1 or 2 willing creatures”, “you and 1 ally”, “the triggering creature” …), otherwise `source` (the caster).
  - **Environment:** an area, a template, a place or thing as the target (object, wall, surface …), or, with no Target line, a wall, cloud, zone, terrain or squares in the text.
  - **Duration** (`spellNoteDuration`): fixed and turn-boundary durations as they are; sustained as its maximum with `sustained: true`; daily preparations as 1 day; unlimited; instantaneous as `null`. An unread duration leaves the spell off the route.
- **Runtime:** `EffectRuntime.#executeSpellNote` (the **Apply Spell Note** button).
  - It checks the target count against the Target line, raised by a heightened “you can target up to five creatures” that applies.
  - It creates `prepareSpellNoteEffectSource` Effects: rule-less, named “Spell Note: <spell>” (“(area)” for an environment spell). The description holds the spell's text plus the heightened paragraph that applies: the highest fixed rank reached, and each interval with its count. A heightened fixed duration replaces the spell's.
  - An environment spell's Effect and card tell the GM to mark the area on the map. An instantaneous spell posts the card only.
- **Reports:** `report-enabled-spells` gives these spells route `note`, `enabledRoute: false` and `noteOnly: true`. The status and by-rank docs show a separate “Note only” count and list.

See [verification](verification/phase-cantrip-rank-1-batch-8.md).

### Cantrip / rank 1 batch 9 — ground hazards

- **Compiler:** `spell-attack-table.js` reads `GROUND_HAZARD`: “On (any result other than a critical failure | a hit | a critical hit), the (ground|floor) in the target's space <label>, dealing @Damage[formula[type]] damage to each creature that (ends its turn | starts its turn | enters | enters or ends its turn) in (one of) the squares.”
  - It's returned as `groundHazard {where: "target-space", degrees, events, damage, label, sourceText}`.
  - `compile-ability` copies it to `resolution.groundHazard` with the spell's `durationSpec`: fixed rounds or minutes, or turn-boundary. Any other duration adds the pending `ground-hazard:duration`.
  - A new one-sentence attack form reads “The ray deals 2d6 fire damage on a hit (or double damage on a critical hit).”
- **Validation:** `inspectSavePlan` blocks a hazard with unknown degrees or events, a formula reading anything but `@item.rank`/`@item.level`, evidence that doesn't match, or another duration.
- **Runtime:**
  - **Placement:** the card state holds `groundHazard` with the formula at the cast rank (`hazardFormula`). At Finalize, each target whose degree qualifies calls `OngoingRuntime.startGroundHazard`.
  - **The region:** `OngoingFamilies.startGroundHazard` creates a Region: a rectangle over the target token's squares, flagged `groundHazard`. It then begins a `lingering` record: `centre: "placed"`, `hazardDamage`, the region as an entry (deleted when the record ends), and `endsAt: "target-turn-end"` for “until the end of the target's next turn”.
  - **The trigger:** in the lingering reconcile, a hazard record doesn't raise a GM membership review. Each trigger (keyed by combat, round, turn, event and actor) calls `applyHazardDamage`, which evaluates PF2e's `DamageRoll`, posts it, and applies it with `applyDamageWithReceipt` (IWR applies).
  - **The end:** after the target's first turn end following the cast (skipping a turn in progress), the record ends with `duration`. Out of combat it lasts one round of world time.
- **The card:** each qualifying target shows an **Area:** line, saying where the region was placed or why it couldn't be.

See [verification](verification/phase-cantrip-rank-1-batch-9.md).

### Cantrip / rank 1 batch 10 — attacks repeated on later turns

- **Compiler:** `spell-attack-table.js` reads three sentences in a row:
  - `REPEAT_TURNS`: “… once you finish Casting the Spell, and can repeat the attack once on each of your subsequent turns by taking a single action, which has the … traits.”
  - `REPEAT_TOTAL`: “After your third attack total, the spell ends.”
  - `WHEN_ATTACK`: “When you attack with …, make …”.
  - Together they become `repeatable {window: "subsequent-turns", attacks, actions: 1, traits, sourceText}`. The attack sentence is then read by the one-sentence forms.
  - `ATTACK` also accepts “against a creature within N feet”. Two new forms: “dealing … if you hit (or double damage on a critical hit)”, and `HIT_CAUSING_CRIT_PERSISTENT` (a condition on a hit; double damage and persistent damage on a critical hit, keeping the condition).
- **Validation:** `inspectSavePlan` allows `repeatable` only as `turn`, or `subsequent-turns` with 2–5 attacks, one action, a fixed spell duration and matching evidence.
- **Runtime** (`main.js`, the chat card button):
  - Each attack is recorded in the message's `repeatWindow` flag `{combatId, endsAt, attacks: [{round, turn}]}`, and `endsAt` is set by the first attack from the spell's fixed duration.
  - The button stays enabled while attacks remain. A click is refused off the caster's turn, or on a turn already used.
  - It then reads **Attacks Used** and is disabled.

See [verification](verification/phase-cantrip-rank-1-batch-10.md).

### Cantrip / rank 1 batch 11 — attitude notes

- **Compiler:**
  - `extractConditionReferences` skips attitude links (`ATTITUDES`), so no row applies an attitude as a condition. `residual-prose` strips attitude links before its signal checks (`ATTITUDE_LINK`), so those sentences reach `selectNoteClauses`.
  - Notes with one label and duration in a row merge (`sourceTexts`), and “Attitude” is matched before hostility, case-insensitively. `HOSTILE_ENDS` joins the note preamble. In a row, “If you use a hostile action …, the spell ends.” is its own note (“Ends if the caster is hostile”).
  - `residual-prose` claims “unaffected but thinks …”, the row's “You can Dismiss the spell.”, and the two charm after-effects sentences. A row's manual instruction for a clause settled as `no-effect` is dropped.
  - `compileSaveAdjustment` reads “It must attempt a Will save, with a +N circumstance bonus if …” (order `must`).
  - `target-predicate-compiler` gives “1 creature that could find you attractive” a `gm-confirmed` predicate.
- **Runtime:** `noteAtRank` (basic-save-runtime) gives a note whose duration is the spell's (`sourceText` = the item duration) the heightened duration at the cast rank (`lifecycle.heightenedDurations`).

See [verification](verification/phase-cantrip-rank-1-batch-11.md).

### Cantrip / rank 1 batch 12 — Effect + note

- **Compiler:** `compileEffectNote` (`spell-note.js`, sharing `noteBasics` with spell notes) runs only where no other route compiled. It gives `resolution.kind "effect-note"` with `effectNote {recipient: source|target|ask, effect {uuid, label, reference, sourceText}, text, target, area, environment, heightened, heightenedDurations, duration}`.
  - **Accepted:** no save or attack, exactly one link, unscoped and resolved in the catalog to an `effect`.
  - **Refused:** damage entries, `@Damage`, counteracting, and damage or healing dice.
  - **Duration** (`effectNoteDuration`): the spell's, or the Effect's own when the spell's is instantaneous or unreadable. `spellNoteDuration` turns weeks, months and years into days.
- **Runtime:** `EffectRuntime.#executeEffectNote` (the **Apply Effect + Note** button):
  - It resolves the recipient; `ask` opens a caster/targets dialog, or uses `options.recipient`. It checks the target count for a `target` recipient.
  - It loads the template and creates it with `prepareNativeEffectSource`/`createNativeEffect` (`resolutionKind: "effect-note"`), then adds the note with `prepareSpellNoteEffectSource`. PF2e's ChoiceSet prompts run as usual.
  - It posts an “Effect + note” card.
- **Reports:** route `effect-note` has `enabledRoute: false` and `effectNote: true`. The status and by-rank docs have an “Effect + note” column and list.

See [verification](verification/phase-cantrip-rank-1-batch-12.md).

### Cantrip / rank 1 batch 13 — bare sustained durations, on-use links

- `spellNoteDuration` reads a bare `sustained` (no maximum, no raw text) as 10 minutes, sustained.
- `compileEffectNote` takes the one link from `unscoped` or `onUse`, with nothing deferred or sequenced.
- Effect + note plans are `automation.level "guided"`, with `pendingCapabilities ["effect-note:unproven-text"]`. Batch 12 had marked them automatic. Routing and execution go by the resolution kind, so they're unchanged.

See [verification](verification/phase-cantrip-rank-1-batch-13.md).

### Cantrip / rank 1 batch 14 — numbers in spell notes

- **Compiler:** `judgeNumbers` (`spell-note.js`) replaces the blanket numeric refusal. For each sentence with a number:
  - `STAT_BLOCK` (a created thing, when the note goes on the caster), a clause-level `SITUATIONAL` bonus, or `ZERO_HP_ENDING` stays in the note.
  - `UNCONDITIONAL` (“The target/You/Your companion gains a +N type bonus to <statistic>.”, matching the recipient) becomes `note.rules` (`FlatModifier`, selector `saving-throw`/`ac`/`perception`/`attack-roll`/`initiative`/<skill>) with `note.ruleSources`.
  - Anything else refuses the spell.
  - A note with rules and an instantaneous duration isn't compiled.
  - `SINGLE_ACTOR_TARGET` also reads “your companion or eidolon”.
- **Runtime:** `validNoteRule` checks that shape. `prepareSpellNoteEffectSource` puts the rules on the note Effect and says the module applies the stated bonus. For an instantaneous environment spell whose text creates something, `#executeSpellNote`'s card tells the GM to mark the result.

See [verification](verification/phase-cantrip-rank-1-batch-14.md).

### Cantrip / rank 1 batch 15 — conditions without a save

- **Compiler:** `compileConditionNote` (`spell-note.js`) needs no check, damage or links, and exactly one sentence with exactly one condition link, matching `GRANTS`:
  - “The ally/target becomes C …” → target;
  - “You Step/Stride and become C.” → source;
  - “You gain the C condition … until the start/end of your next turn.” → source, own duration.
  - The Target line must fit. The duration is the spell's, or the sentence's own. The rest is judged by `judgeNumbers` and may carry no generated rules.
  - It gives `resolution.kind "condition-note"` (enabled, automatic). `compileSpellNote` now allows condition links when `conditionMentionsOnly` holds for every sentence, heightened ones included (`MENTIONS`). Restore, cure, remove, end, counteract or suppress wording refuses.
- **Runtime:** `#executeConditionNote` (**Apply Condition**) checks the recipients, including that a `1 ally` target is an ally. It loads PF2e's condition by UUID and creates `prepareConditionGrantSource` (GrantItem, cascade on delete; timing by `nativeConditionTiming`) plus the spell note.

See [verification](verification/phase-cantrip-rank-1-batch-15.md).

### Cantrip / rank 1 batch 16 — per-row durations

- **Compiler:** `compileDegreeDurationNotes` (`src/compiler/note-effects.js`) runs on non-basic save plans with no damage entries.
  - **Rows:** each is unaffected, `DURATION_ROW`, `NORMAL_DURATION_ROW` (the item's fixed duration), or `AS_ROW_BUT` (the named row's duration plus a non-mechanical restriction), with no conditions, Effects or damage.
  - **The effect:** the sentences before the table, minus `SAVE_SENTENCES` and `WILLING_CHOICE`. They must hold no damage, dice, conditions or counteracting, and pass `judgeNumbers` with no generated rules.
  - **Output:** each row gets a “Spell's effect” note with its duration, and the claimed sentences join the preamble claims. A `varies` item duration becomes `outcome`. `WILLING_CHOICE` becomes a `willing-choice` reminder (`compilerEvidence.willingChoice`, validated in `inspectSavePlan`, rendered as **GM:**).
- **Also:** `validNoteEffect` allows 1,000 characters. `residual-prose` doesn't count “beyond a range of N feet” in a note as movement. `SITUATIONAL` is case-insensitive and reads “to open the …” and “attempted with”. `ZERO_HP_ENDING` reads “reduce … to 0 Hit Points”.

See [verification](verification/phase-cantrip-rank-1-batch-16.md).

### Cantrip / rank 1 batch 17 — rolled row durations

- **Compiler:** `ROLLED_DURATION_ROW` gives the note `duration {value: null, valueRoll: "1d4", unit: "rounds"}`. `TARGET_DEALT_DAMAGE` (“… damage dealt by the target”) doesn't count as the spell's damage in the effect text. `SITUATIONAL` reads “doesn't incur the typical”.
- **Runtime:** before the note sources are prepared, Finalize rolls each participating target's `valueRoll` (a chat roll) into `target.noteRounds[index]`, which becomes the note's duration. `validNoteEffect` accepts a rolled rounds duration. `prepareNoteEffectSource` refuses one that wasn't rolled.

See [verification](verification/phase-cantrip-rank-1-batch-17.md).

### Cantrip / rank 1 batch 18 — healing halved

- `note-effects.js`: `BEHAVIOUR` reads “(vitality|healing) effects heal it only half as much as normal”, labelled “Healing halved”. The note text drops the row's damage clause (“The target takes full damage, and …”). The row's damage stays compiled as before.
- Signal Skyrocket stays blocked by its unclaimed preamble. Its enclosed-space damage condition isn't a gate the damage compile reads, so it must not be unblocked by claiming the other sentence.

See [verification](verification/phase-cantrip-rank-1-batch-18.md).

### Cantrip / rank 1 batch 19 — sleep rows, row penalties, rank gates

- **Row rules** (`compileRowRules`):
  - The wake row gives an `unconscious` condition (a fixed duration from “after N …”, `source: "row-rule"`, slug-resolved by `ConditionManager`) and a “Wakes up” note.
  - A penalty row gives a note with `rules: [FlatModifier]` (`selector` perception/saving-throw/fortitude/reflex/will/ac/attack-roll/<skill>). The note preamble isn't appended to a note with rules.
  - `addResidualProseAnalysis` drops a manual instruction whose sentences are all note clauses or name a condition the row applies.
- **Note rules:** `validNoteRule` allows penalties (−1 to −4, status or circumstance). `validNoteEffect` checks note rules. `prepareNoteEffectSource` puts them on the row note Effect.
- **Rank gate:**
  - `rankGateFor` finds the lowest fixed-rank Heightened entry mentioning row mechanics that isn't a read heightened duration. It sets `resolution.rankGate {maxRank, minRank, sourceText}`, validated against `compilerEvidence.rankGate`.
  - `BasicSaveRuntime.start` refuses a cast rank above `maxRank`.
  - This also covers already-enabled Horrific Visage (5+), Divine Plagues (5+) and Stormburst (7+). Those spells previously applied their base rows at those ranks.

See [verification](verification/phase-cantrip-rank-1-batch-19.md).

### Cantrip / rank 1 batch 20 — attitude step unless it saves

- `compact-degree-table.js` `expandAttitudeStep`: the attitude-step sentence becomes a written table (failure rows: “The target's attitude to you improves by one step (…) for the duration of the spell.”). The sentences after it stay before the table.
- `compileSaveImmunity` reads “Afterward, the target is temporarily immune for N minutes/hours/days” (days as 24 hours). `target-predicate-compiler` reads “1 non-hostile domesticated animal” (animal trait + `gm-confirmed`), and its restating sentences are claimed.
- `noteAtRank` also matches a note duration copied from the item (`duration.raw`).

See [verification](verification/phase-cantrip-rank-1-batch-20.md).

### Cantrip / rank 1 batch 21 — current-turn timing, more mentions

- `nativeConditionTiming` reads `anchor: "current-turn"`: the origin is the combatant whose turn it is at cast, with 0 rounds and turn-end expiry (out of combat, 1 round). Note and grant Effects accept it.
- `GRANTS` reads “They become C against the triggering attack and until the end of the current creature's turn.”
- `MENTIONS` reads “if … is C” case-insensitively, “The path/object/item …” capitalised, and the Stealth options “you can become C to a creature even if” / “unless you move into cover or become C before then”.

See [verification](verification/phase-cantrip-rank-1-batch-21.md).

### Cantrip / rank 1 batch 22 — Stabilize, passive counteracting, items

- `compileStabilize` (`spell-note.js`) gives `resolution.kind "stabilize"` (enabled). `EffectRuntime.#executeStabilize` (**Stabilize**) needs exactly one dying target. It removes Dying (`forceRemove`), increases Wounded, and keeps (or adds) Unconscious.
- `compileSpellNote` refuses only an active counteract (`ACTIVE_COUNTERACT`). `judgeNumbers` allows an object's restored Hit Points. `MENTIONS` reads the Broken-threshold clause.
- `#executeSpellNote` puts an instantaneous note's text (at the cast rank) on its card.

See [verification](verification/phase-cantrip-rank-1-batch-22.md).

### Cantrip / rank 1 batch 23 — bystanders' saves in notes

- `compileSpellNote` accepts a save item when `bystanderSaveOnly` holds. That needs a non-basic save, no results table, and every save sentence one of the bystander wordings (“If a … is attended by an unwilling creature, that creature can attempt …”, “Tiny animals and animal swarms of any size within range must attempt …”). The other note rules still apply.

See [verification](verification/phase-cantrip-rank-1-batch-23.md).

### Cantrip / rank 1 batch 24 — retaliation

- **Compiler:** `src/compiler/retaliation.js` `compileRetaliation` gives `resolution.kind "retaliation"`, with `retaliation {triggers: [{trigger, damage {componentId?, formula, type, persistent?}, sourceText}], durationSeconds, shortenPerHit, heightening}`. It's enabled automation.
- **Runtime:**
  - `EffectRuntime.#executeRetaliation` (**Set (retaliates)**) creates the marker Effect (`runtime.kind "retaliation"`) and an Ongoing record.
  - `OngoingRuntime` renders a **Retaliate** control per trigger, and `request("retaliate")` goes to `StoredTriggerRuntime.retaliate`.
  - That computes the formula (`heightenedComponentFormula` for the item's entry, `@item.rank` substituted otherwise), rolls PF2e's `DamageRoll` (persistent as `[persistent,type]`) and applies it with `applyDamageWithReceipt`. It refuses the caster as target, and shortens the marker by a round (ending at none) when `shortenPerHit`.

See [verification](verification/phase-cantrip-rank-1-batch-24.md).

### Cantrip / rank 1 batch 25 — temporary Hit Points from the triggering creature

- `src/compiler/temp-hp-reaction.js` `compileTempHpReaction` gives `resolution.kind "temp-hp"` (enabled). `EffectRuntime.#executeTempHp` reads the targeted creature's level and undead trait, and the caster's `spell.spellcasting.attribute` modifier. It creates an Effect with `{key: "TempHP", value}` for the spell's duration; deleting the Effect removes the temporary Hit Points.

See [verification](verification/phase-cantrip-rank-1-batch-25.md).

### Cantrip / rank 1 batch 26 — healing at the end of the targets' turns

- `compileTurnHealing` (`retaliation.js`) gives `resolution.kind "turn-healing"` (enabled). `EffectRuntime.#executeTurnHealing` checks the target count and computes the heightened formula. It calls `OngoingRuntime.startTurnHealing` per target.
- `OngoingFamilies.startTurnHealing` creates a `lingering` record: `centre: "targets"`, `events: ["turn-end"]`, `hazardDamage {heal: true}`, `maximumAt` from the duration.
- `applyHazardDamage`'s `heal` branch rolls the formula, applies it as healing (`applyDamageWithReceipt` with a negative amount), and recovers from Dying.

See [verification](verification/phase-cantrip-rank-1-batch-26.md).

### Cantrip / rank 1 batch 27 — Hit Point transfer

- `compileHpTransfer` (`retaliation.js`) gives `resolution.kind "hp-transfer"` (enabled). `EffectRuntime` computes the heightened amount and calls `OngoingRuntime.startHpTransfer`.
- `OngoingFamilies.startHpTransfer` creates a `lingering` record: `centre: "targets"`, the new event `source-turn-start` (fired when the caster's turn starts), `hazardDamage {transfer}`, a cast Dismiss, and `endsAtZero`. It transfers once at cast.
- `transferHitPoints` makes the direct `hp.value` updates (capped at the target's maximum). The reconcile ends the record (`caster-at-0-hp`) once the caster is at 0.

See [verification](verification/phase-cantrip-rank-1-batch-27.md).

### Cantrip / rank 1 batch 28 — retaliation with an aura Effect

- `compileRetaliation` accepts an emanation with one resolved linked Effect whose only rule is `Aura` (`retaliation.effect`), and the `AURA_CATCHES` trigger. `#executeRetaliation` creates PF2e's Effect (`prepareNativeEffectSource`, with the retaliation metadata) as the marker, attached to the Ongoing record.

See [verification](verification/phase-cantrip-rank-1-batch-28.md).

### Cantrip / rank 1 batch 29 — a discharge by the Strikes that hit

- `compileDischarge` (`retaliation.js`) gives a retaliation whose trigger damage is `{byCount: [formula per count], type}`. The Ongoing control asks for the count (a DialogV2), and `retaliate({count})` deals that entry at the cast rank. A missing or out-of-range count is refused.

See [verification](verification/phase-cantrip-rank-1-batch-29.md).

### Cantrip / rank 1 batch 30 — damage shared with the caster

- `compileDamageShare` (`retaliation.js`) gives `resolution.kind "damage-share"` (enabled), with `ranks [{rank, targets, amount}]` from the fixed-rank entries.
- `EffectRuntime.#executeDamageShare` applies `#applyHealing` at the cast rank, then creates a marker per target (`runtime.damageShare {amount}`) in one Ongoing record with a cast Dismiss.
- The Ongoing control prompts for the damage. `StoredTriggerRuntime.share` moves `min(amount, damage, missing HP)` directly. It records the round on the marker (`shareRound`, once per round) and ends the record when the caster is Unconscious.

See [verification](verification/phase-cantrip-rank-1-batch-30.md).

### Cantrip / rank 1 batch 31 — damage within melee reach

- `compileDirectDamage` also reads `REACH_HITS` (“You … that deals 1d4+1 force damage to a target within your melee reach.”, giving `damage.reach "melee"`) and the Spellstrike range sentence (`damage.notes`). Links are unwrapped, and “your attack” in narration isn't a rule word. `#executeDirectDamage` puts both as **GM:** lines on the damage card.

See [verification](verification/phase-cantrip-rank-1-batch-31.md).

### Cantrip / rank 1 batch 32 — Parch

- **`spell-source-adapter.js`:** `normalizeDefense` sets `basic: false` and `basicFlagIgnored: true` when PF2e flags a save basic and the item has no damage, the text has no “basic” and no `@Damage`, and it has a Critical Failure row.
- **`compileRowRules`:**
  - The row penalty also reads “its checks and DCs” (selector `all`, allowed by `validNoteRule`).
  - It reads a trailing “and is <condition> as long as it has this penalty”, which gives that condition the penalty's duration.
  - A `condition-duration-scope` pending set earlier is dropped once no unscoped duration is left.
- **`compileDegreeAdjustments`:**
  - Reads the Parch form as the predicate `trait-or-gm-confirmed` (`traits`, `question`).
  - `degreeAdjustmentFor` applies it from traits, or leaves it pending for the GM's “Yes — adjust degree” / “No”.
- **Save preamble:** it now has the signal `ends-early` (“the spell/effect ends”, “end the spell/effect”). With row notes, such sentences join every note, including a modifier's note. Otherwise the gap `preamble:ends-early` blocks. No enabled spell changed.

See [verification](verification/phase-cantrip-rank-1-batch-32.md).

### Cantrip / rank 1 batch 33 — Benediction

- **`analyzeNativeEffectCompleteness`:**
  - Reads optional growth when the Aura radius is `B + @item.badge.value * S`, `S` is the stated feet, and `B + S` is the spell's emanation. The result is `sustainGrowth {feet, maximum, badgeMax, optional: true}`.
  - Claims “<own name> can counteract <spell>.” as `resolution.gmNotes`.
- **`effect-runtime`:** takes optional growth with a fixed duration (`maximumAt` from that duration), and shows `gmNotes` as **GM:** lines.
- **`ongoing-families`:**
  - `mustSustain` skips optional growth.
  - The Sustain obligation reads “Optional Sustain to expand <spell>”.

See [verification](verification/phase-cantrip-rank-1-batch-33.md).

### Cantrip / rank 1 batch 34 — Overstuff

- **`degreeObjectRules` / `compileDegreeObjectNativeEffects`** (`degree-choice-effect.js`):
  - Read the object-valued flag ChoiceSet shape.
  - Bind the Effect to each offered degree with `outcomeRule {kind: "degree-object-effect", selectionFlag, selectionValue: {badge, degree}, carriedConditions, claims}`.
  - Return the preamble Speed sentence, which is claimed.
- **Residual prose:** the addendum's row clause is accounted for (its “action” signal and the `conditional-effect` manual instruction). `objectSettled` drops `manual:*` pending capabilities that no outcome still has.
- **`inspectNativeOutcomeEffect`:**
  - Re-proves the shape against the live template.
  - Returns `selection {flag, value}`. `prepareNativeOutcomeEffectSource` presets the ChoiceSet and `flags.system.rulesSelections`.

See [verification](verification/phase-cantrip-rank-1-batch-34.md).

### Cantrip / rank 1 batch 35 — Waking Nightmare

- **`compileConditionScopedRules`** (after `compileRowRules`):
  - Puts `gate {kind: "asleep", wakes: true, sourceText}` on the linked condition, in every row that carries it.
  - Drops the conditional-effect instruction it accounts for, and `manual:conditional-effect` when none is left.
  - Adds a “Hit while frightened” note (N rounds, `target-turn`, `turn-end`) to rows with Frightened N, and claims the preamble sentence.
- **`inspectSavePlan`:** accepts that gate shape.
- **At Finalize:** a gated entry applies only when the actor is Unconscious with HP above 0. The runtime then deletes its Unconscious (it wakes) and writes a card note. Otherwise the note says it wasn't asleep.
- **Residual prose:** claims the gated sentence.

See [verification](verification/phase-cantrip-rank-1-batch-35.md).

### Cantrip / rank 1 batch 36 — Wilding Word

- **`compileConditionScopedRules`:** reads the three Wilding Word rows exactly.
  - It removes the rows' Sickened effects.
  - It adds the notes, each with `triggeredCondition` on the Sickened one, lasting the spell's duration (`noteDuration`, sustained).
- **Residual prose:** accepts that note's clause.
- **Sustain:** the notes attach to the sustained cast's ongoing record, so a missed Sustain ends them.
- **Test update:** `cantrip-rank-1-batch-6` keeps its strictness check on a changed trigger (“each time it hits an ally”).

See [verification](verification/phase-cantrip-rank-1-batch-36.md).

### Cantrip / rank 1 batch 37 — Shroud of Night

- **`compileConditionScopedRules`:** reads the perceived-concealment sentence, in its own row or an inherited one.
  - It removes the row's Concealed.
  - It adds a note with `perceivedCondition`, claiming the sentence and a short rule-free lead-in.
  - It drops the conditional-effect instruction those sentences make up.
- **Reminder:** the willing-ally sentence before the table becomes the `willing-choice` reminder (`compilerEvidence.willingChoice`).

See [verification](verification/phase-cantrip-rank-1-batch-37.md).

### Cantrip / rank 1 batch 38 — Stumbling Curse

- **`compileConditionScopedRules`:** reads the three rows exactly. The trailing spell-effect link is stripped from the last row.
- **Notes:**
  - The penalty is a note with two FlatModifier rules, lasting `noteDuration` (the spell's; sustained).
  - A `gmPlays` “Stumbling Strides” note claims the Stride clauses (their movement/action signals).
- **The linked Effect:** it is dropped only when its rules and duration equal the generated ones (`compilerEvidence.setAsideEffect`).

See [verification](verification/phase-cantrip-rank-1-batch-38.md).

### Cantrip / rank 1 batch 39 — Weapon Surge

- **`ruleStatedSentences`:** proves the next-Strike sentence against the Effect's chosen-weapon FlatModifier, DamageDice (at the rank) and AdjustStrike.
- **`analyzeNativeEffectCompleteness`:** turns the “ends once you complete this Strike …” sentence into a data note.
- **`classifyImmediateApplication`:** accepts a held-weapon target when the text says “before the start of your next turn” and the Effect lasts exactly 1 round to the start of a turn.
- **Automation level:** prompted (PF2e's weapon prompt).

See [verification](verification/phase-cantrip-rank-1-batch-39.md).

### Cantrip / rank 1 batch 40 — Funeral Flames

- **`ruleStatedSentences`:** proves the while-you-wield sentence (potency, trait, torch light) and the dismiss-for-damage sentence (toggle, dice, faces against undead).
- **Data note:** says the toggle's dice aren't persistent.
- **Target:** the held-weapon form also reads “club or staff you're wielding”, in the trigger classifier and the target predicate.
- **Stricter damage check:** the completeness check now allows up to two words between the dice and “damage”, so “1d6 persistent fire damage” counts. No other plan changed.

See [verification](verification/phase-cantrip-rank-1-batch-40.md).

### Cantrip / rank 1 batch 41 — Halcyon Mists

- **`analyzeNativeEffectCompleteness`:**
  - Proves the temporary-HP-and-persistent sentence pair against `TempHP` and the formula badge, giving `resolution.endPersistent {types, choice}`.
  - Turns the Concealed/no-Hide sentence into a GM note.
  - Adds a `persistent-damage` blocker for unclaimed sentences that deal, take or end persistent damage. Stat blocks are excluded.
- **`effect-runtime`:** after the Effect is created, deletes the recipient's single matching persistent-damage condition. With several, it posts a caster line to choose.
- **Trigger classifier:** accepts “around the target, granting” as target language.
- **Corpus:** b124 changed Halcyon Mists, plus Elemental Gift (already guided), which gains the honest `persistent-damage` gap.

See [verification](verification/phase-cantrip-rank-1-batch-41.md).

### Cantrip / rank 1 batch 42 — Veil of Dreams

- **`proveStatedEffect`:** also proves the listed penalty with its trait override (`proveListedPenalty`).
- **`compileStatedEffect`:**
  - Tries single sentences and consecutive pairs.
  - Dedupes the same link listed in several rows by UUID.
  - Accepts a sustained spell whose maximum equals PF2e's sustained Effect.
  - Claims per sentence.
- **`compileConditionScopedRules`:** adds the “Concentrate actions” note (`gmPlays`) to rows inheriting the stated Effect.
- **Runtime:** `inspectNativeOutcomeEffect` re-proves the pair from the live template.

See [verification](verification/phase-cantrip-rank-1-batch-42.md).

### Cantrip / rank 1 batch 43 — Equal Footing

- **Target predicate `land-speed-above-caster`:**
  - The compiler, `validate-plan` and `inspectSavePlan` accept it.
  - The save card snapshots `casterLandSpeed`, and `validateActorTarget` compares PF2e land Speeds.
- **`proveRowModifierClaim`:** reads the Speed-and-condition form and returns `carries`. The row binding then marks the row's condition `carriedBy` that Effect.
- **`degreeChoiceRules` / `proveDegreeChoiceRow`:**
  - Accept the suppressing AdjustModifier and the Speed-and-condition sentence, including badge-upgraded grants.
  - Carried conditions join `carriedConditions`.
- **`compileDegreeChoiceNativeEffects`:**
  - Picks the one linked Effect with a degree ChoiceSet when a row's own Effect is also linked.
  - Accepts the Effect's own fixed duration when every bound row states it.

See [verification](verification/phase-cantrip-rank-1-batch-43.md).

### Cantrip / rank 1 batch 44 — Celestial Accord

- **Target predicate:** a GM-confirmed question for the pair's attitudes.
- **`compileDegreeAdjustments`:** reads the combat floor as a `gm-confirmed` map (failure and critical failure become success).
- **`compileConditionScopedRules`:** adds the “Penalty against the other target” note (`gmPlays`).
- **Inherited notes:** in the “As X, but …” inheritance, a replacing note keeps the named row's note when that one has a behaviour rule (can't, hostile, must) the new one lacks.
- **Corpus:** only Celestial Accord's notes changed (checked with a corpus-wide note-text comparison).

See [verification](verification/phase-cantrip-rank-1-batch-44.md).

### Cantrip / rank 1 batch 45 — Airburst

- **Target predicate `size-at-most`:** accepted by the compiler, `validate-plan` and `inspectSavePlan`. `validateActorTarget` reads PF2e's `actor.size`.
- **Push rows:** also read the inherited push and the push with no reactions (a note anchored to your turn's end).
- **`forcedMovement.heightening`:** can be `{minRank, distance}`, and the card uses that distance from that rank.
- **`object-push` reminder:** claims its preamble sentence.

See [verification](verification/phase-cantrip-rank-1-batch-45.md).

### Cantrip / rank 1 batch 46 — Eject Soul

- **`compileConditionScopedRules`:** reads the soul-exits row.
  - It keeps the Stunned for the stated rounds and drops the soul's Invisible.
  - It adds a `claimsRow` “Soul form” note. Residual prose treats every clause of that row as claimed, except damage and save signals.
- **Willing-choice reminder:** it also reads “You can allow allies to choose the degree of success …”, and its sentence is claimed in the preamble.
- **Target predicate:** living plus a GM soul question.
- **Incapacitation:** PF2e applies it, because saves roll with the spell item.

See [verification](verification/phase-cantrip-rank-1-batch-46.md).

### Cantrip / rank 1 batch 47 — Chastising Retort

- **`compileConditionScopedRules`:** reads the reveal-the-truth sentences, which must name a condition the row applies.
  - It removes the Off-Guard they name.
  - It adds a `gmPlays` “Reveal the truth” note, whose clauses residual prose accepts.
- **Rolled durations:** the Stupefied's 1d4 rounds (already supported) are rolled at Finalize.

See [verification](verification/phase-cantrip-rank-1-batch-47.md).

### Cantrip / rank 1 batch 48 — Ignite Ambition

- **`compileConditionScopedRules`:** reads the three rows exactly and adds 1-round `claimsRow` notes. The failure and critical failure notes carry the success text.
- **Narration:** the ambition sentence before the save is claimed (`compilerEvidence.triggerNarration`).
- **Target:** “one creature being influenced” has no predicate.
- **Critical success:** residual prose accepts the “unaffected and realized …” row.

See [verification](verification/phase-cantrip-rank-1-batch-48.md).

### Cantrip / rank 1 batch 49 — Lose the Path

- **Save preamble:** `IMMUNE_TAIL` accepts “immune” without “temporarily”.
- **`compileConditionScopedRules`:** reads the two Stride rows as 1-round `claimsRow` notes.

See [verification](verification/phase-cantrip-rank-1-batch-49.md).

### Cantrip / rank 1 batch 50 — Undeath's Blessing

- **`compileConditionScopedRules`:**
  - Reads “Effects as described above.” with the two described sentences.
  - Reads the halving row, flagged `otherSpellsDamage`: residual prose accepts its damage wording only when the row deals none itself.
  - Adds the willing-no-save reminder (`compilerEvidence.willingNoSave`).
  - The claimed sentences join the preamble claims.
- **Target predicate:** “1 living creature touched” is `living-creature`. That also completes Death Ward's target, which stays guided for its Effect.

See [verification](verification/phase-cantrip-rank-1-batch-50.md).

### Cantrip / rank 1 batch 51 — Cycle of Retribution

- **`compileConditionScopedRules`:** reads the three hostile-action rows against the single damage entry and the heightening.
  - Each row's note gets `triggeredDamage {trigger, dice, die, type, componentId, frequency, endsSpell, baseRank, heightening}`, and the row deals no immediate damage.
  - `inspectSavePlan` validates it (`isTriggeredDamage`) and counts it as using the shared damage.
- **`prepareNoteEffectSource`:** copies the payload, with `castRank` and `targetName`, into the note's runtime flags.
- **Ongoing:** lists “<spell>: <creature> took a hostile action” for such notes. The `hostile-damage` request (`storedTriggers.hostileDamage`) rolls `(dice + steps)dN[type]` and applies it with PF2e's IWR.
  - It deletes the note after a “once” row.
  - It refuses a second hit in the same combat round for a “round” row.

See [verification](verification/phase-cantrip-rank-1-batch-51.md).

### Cantrip / rank 1 batch 52 — Telekinetic Rend (text damage)

- **`compileTextDamage`** (`src/compiler/text-damage.js`): with a basic save and no damage entry, it reads the exact choice sentence.
  - It gives the adapter a synthetic untyped component and a canonical sentence, so the ordinary basic-save compilers judge the rest.
  - The plan then gets `sharedDamage {mode: "formula", formula: "(1+floor((@item.rank - 1)/2)*1)d6[untyped]", textDerived}`, `casterChoice {kind: "damage-type"}` and a data note.
- **`executableCasterChoice`:** accepts a text-derived formula.
- **Save card:** the formula path swaps `[untyped]` for the caster's pick.
- **Target:** “N non-overlapping N-foot bursts” is a creature target.

See [verification](verification/phase-cantrip-rank-1-batch-52.md).

### Cantrip / rank 1 batch 53 — Sacred Beasts (text damage)

- **`compileTextDamage`:** now takes a list of exact forms, each with the closing sentences allowed after it.
  - The GM-typed form uses the item's save statistic.
  - The text is read up to the Heightened block, not the first `<hr>` (a Requirements line has its own).

See [verification](verification/phase-cantrip-rank-1-batch-53.md).

### Cantrip / rank 1 batch 54 — Sepulchral Mask

- **`compileRowRules`:** reads the damage-and-trait-penalty row into a note with `rules: [{…, predicate: ["item:trait:X"]}]`.
  - `validNoteRule` allows that one predicate shape and the individual saves as selectors.
  - The row's modifier signals are claimed (`alongDamage`).
- **Lingering degree areas:** a “granting you …” preamble sentence proved by the single linked Effect becomes `lingering.casterEffect`.
  - `inspectCasterBenefitClaim` reads trait-limited save bonuses and “for 1 minute”.
  - `isExecutableLingeringPlan` re-proves it, and `startLingering` creates PF2e's Effect on the caster (proved again from the live template) as an entry of the cast.

See [verification](verification/phase-cantrip-rank-1-batch-54.md).

### Cantrip / rank 1 batch 55 — Nymph's Grace

- **`expandCompactDegreeTable`:** accepts a lingering trigger as the compact sentence's subject (checked by `lingeringTriggerEvents`), and one trailing “While <condition> by this effect, …” sentence, which joins the failure rows.
- **Enter-once trigger:** also reads “the first time an enemy enters …”.
- **`compileConditionScopedRules`:** turns that sentence into a note lasting as the row's condition.
- **Harness:** `cleanup` also removes `PFTEST` regions no active cast uses.

See [verification](verification/phase-cantrip-rank-1-batch-55.md).

### Cantrip / rank 1 batch 56 — Dirge of Doom

- **`compileConditionNote`:** a new `area-enemies` grant (an emanation, no target), with the area floor sentence (`condition.floor`, `floorText`).
- **`#executeConditionNote`:** refuses the caster or an ally among the targets.
- **`prepareConditionGrantSource`:** sets the GrantItem's `grantee: "restrict"` for a floor, and adds the leaving-the-area line.

See [verification](verification/phase-cantrip-rank-1-batch-56.md).

### Cantrip / rank 1 batch 57 — Veil of Confidence

- **`compileConditionNote`:** a new `reduce` grant (the caster), with `condition.reduceBy`.
- **`#executeConditionNote`:** decreases the condition that many steps (while it's present) and creates only the note.

See [verification](verification/phase-cantrip-rank-1-batch-57.md).

### Cantrip / rank 1 batch 58 — Tether

- **`compileConditionScopedRules`:** reads the tether rows. The Speed rows become notes with a `land-speed` circumstance modifier. The Immobilized row lasts the spell's duration with `endsWhen ["escape"]` and `expirationMode "first"`. The tether preamble sentences and their Heightened line are added to each note.
- **`validNoteRule`:** accepts `land-speed` from −5 to −30 in 5-foot steps.
- **`test/compiler.test.js`:** Tether's Immobilized is now that Escape lifetime, instead of the old representation.

See [verification](verification/phase-cantrip-rank-1-batch-58.md).

### Cantrip / rank 1 batch 59 — Precious Gleam

- **`ruleStatedSentences`:** proves the next-hit dice sentence (`DamageDice` on the chosen weapon, category or type) and the material-choice sentence (the material ChoiceSet and an `AdjustStrike` on `materials`).
- **`analyzeNativeEffectCompleteness`:** adds the every-hit data note, and one naming listed materials PF2e's choice doesn't offer.
- **Weapon-wielder recipient:** its duration also reads “until the beginning of your next turn”.
- **`adaptSpellSource`:** drops a trailing period from the Target line. Split the Tongue's trigger-target match takes the period as optional.

See [verification](verification/phase-cantrip-rank-1-batch-59.md).

### Cantrip / rank 1 batch 60 — Home Among Mulberry Leaves

- **`extractStrikePrelude` → `strikeConditions`:** a Strike with no damage, then “On a success, …” and “On a critical success, …, making it your choice of A or B …, in addition to <…ing> it.”. It becomes a Strike-result table (the critical row repeats the success row) and returns `conditionChoice`.
- **Escape grammar (`condition-list-lifetime.js`):** “, though it can attempt to Escape” as well as “, but …”.
- **`compileAbility`:** tags the two chosen conditions `choiceGroup: "caster-condition"`, claims the row (`conditionChoiceClaims`), and sets `resolution.casterChoice` `{kind: "condition"}`.
- **`executableCasterChoice`:** a condition choice needs a Strike-result plan, and exactly one claimed row holding exactly the choice's conditions.
- **`targetOutcomeConditions`:** applies only the selected one.
- **`saveCollectionReadiness`:** asks for the choice only when a participating target's row has it.

See [verification](verification/phase-cantrip-rank-1-batch-60.md).

### Cantrip / rank 1 batch 61 — Creative Splash

- **`rolled-condition-table.js` (new):**
  - `expandRolledConditionTable` rewrites a 1dN results table (Failure and Critical Failure columns) as degree rows, with lifetime-less conditions last.
  - `applyRolledConditionTable` proves each row's compiled conditions against the table's cells (slug, value, lifetime). It then marks them `choiceGroup: "condition-roll"` and claims the rows.
- **`resolution.conditionRoll`:** `chooseOn: []` (every result names a condition) and `labels` (the table's second column).
- **`conditionRollHTML`:** shows the result's label.

See [verification](verification/phase-cantrip-rank-1-batch-61.md).

### Cantrip / rank 1 batch 62 — Defended by Spirits

- **`compileRetaliation` → `compileGuardedAlly`:** Target “1 ally and 1 enemy”. One trigger with `fixedTarget: "enemy"`, plus `guard` and `sustained`.
- **Target predicate:** “1 ally and 1 enemy” is an actor target.
- **`#executeGuard`:** tells the two targets apart by `isAllyOf`, puts the marker on the ally, and records `metadata.guard` (the enemy's token). For a sustained cast it begins a sustained native record (`castRound`, `maximumAt`).
- **The Retaliate control:** uses the recorded enemy without targeting.
- **`StoredTriggerRuntime.retaliate`:** refuses any other creature.

See [verification](verification/phase-cantrip-rank-1-batch-62.md).

### Cantrip / rank 1 batch 63 — Hippocampus Retreat

- **`attackAdjustments`:** reads the movement block (`MOVE_AFTER`, `MOVE_AC`, `MOVE_END`) as an “always” caster benefit with `movement`, plus a `caster-movement` reminder.
- **`inspectCasterBenefitClaim`:** proves a speed `FlatModifier` from “… with a +10-foot circumstance bonus”, and accepts “At the end of the movement” for a 1-round Effect to a turn's start.
- **`compileAbility`:** sets `compilerEvidence.casterMovement` and adds the data note.
- **`reminderHTML`:** renders the reminder.
- **`inspectSavePlan`:** accepts it only on a spell-attack plan with a caster Effect.

See [verification](verification/phase-cantrip-rank-1-batch-63.md).

### Cantrip / rank 1 batch 64 — Silver's Refrain

- **`AREA_ALLIES`:** also reads “Weapon and unarmed attacks by allies in the area are treated as <material>.” (allies only).
- **`analyzeNativeEffectCompleteness`:** sets aside the automatic-counteract sentences and adds them to `gmNotes`.

See [verification](verification/phase-cantrip-rank-1-batch-64.md).

### Cantrip / rank 1 batch 65 — Untamed Shift

- **`ruleStatedSentences`:** proves “<Label> <noun> are an unarmed attack … deal NdM <type> damage.” against an unarmed `Strike` rule.
- **`analyzeNativeEffectCompleteness`:**
  - A data note when a heightened “choose up to two/three effects” is PF2e's level-predicated extra ChoiceSets.
  - A `gmNotes` entry for “You must cast <spell> using N actions for this benefit.”

See [verification](verification/phase-cantrip-rank-1-batch-65.md).

### Cantrip / rank 1 batch 66 — Shields of the Spirit

- **`compileRetaliation` → `compileAuraShields`:** proves the Effect's Aura (allies, not self), AC bonus and Raise a Shield grant.
- **Runtime:** the existing `data.effect` path puts PF2e's Effect on the caster as the marker.

See [verification](verification/phase-cantrip-rank-1-batch-66.md).

### Cantrip / rank 1 batch 67 — Buffeting Winds

- **`compileBasicTraitKnockback`:** reads the nonlethal damage sentence, the “Against <trait> … loses the nonlethal trait” sentence, the save sentence and the trait knockback. The remainder must pass the simple basic-save gate.
- **`forcedMovement.trait`:** validated; `movementNote` shows the push only for a target with that trait.
- **Reminder kind `nonlethal`:** validated and rendered.

See [verification](verification/phase-cantrip-rank-1-batch-67.md).

### Cantrip / rank 1 batch 68 — Lament

- **`compileBasicDamageBonus`:** `resolution.damageBonus` `{question, choices 0–10, type}`, with `compilerEvidence.basicDamageBonus`.
- **`inspectSavePlan`:** validates the damage bonus and accepts it as a basic-save composition.
- **Card:** `damageBonusHTML` shows 0–10 buttons (action `damage-bonus`), and `answerDamageBonus` records the answer (also on `api.saves`).
- **`saveCollectionReadiness`:** waits for the answer.
- **`rollDamage`:** rewrites PF2e's single instance, e.g. `{1d8[mental]}` → `{(1d8 + N)[mental]}`.

See [verification](verification/phase-cantrip-rank-1-batch-68.md).

### Cantrip / rank 1 batch 69 — Victory Cry

- **`compileDirectDamage` → `compileStruckDamage`:** `damage.struck`, notes, and (with no damage entry) `damage.formula` plus `dataNote`.
- **`#executeDirectDamage`:** rolls `damage.formula` with PF2e's `DamageRoll` at the cast rank, and adds the data note to the roll.
- **Target predicate:** “the triggering ally” is an actor target.

See [verification](verification/phase-cantrip-rank-1-batch-69.md).

### Cantrip / rank 1 batch 70 — Personal Rain Cloud

- **`compileAbility`:** rewrites “Creatures can attempt a <save> save to avoid the <noun>.” as rows (unaffected / its normal duration), and adds a `willing-no-save` reminder.
- **`compileDegreeDurationNotes`:**
  - Turns the effect's resistance sentence into a `Resistance` rule (heightened formula on the note's level) and appends the Heightened line to the note text.
  - Leaves the water-weakness damage sentence in the note.
- **`validRowNoteRule`:** accepts that `Resistance` for row notes only (`validNoteEffect`). Spell notes keep `validNoteRule` without it.

See [verification](verification/phase-cantrip-rank-1-batch-70.md).

### Cantrip / rank 1 batch 71 — Déjà Vu

- **`compileAbility`:** rewrites “The target must attempt a <save> save. If the target fails, <effect>” (no table) as rows.
- **`compileDegreeDurationNotes`:**
  - Checks linked conditions on the raw sentence. Before, links became labels first, so a linked condition in the effect wasn't caught; no compiled plan changed.
  - Exempts only `TRIGGERED_CONDITION`.

See [verification](verification/phase-cantrip-rank-1-batch-71.md).

### Cantrip / rank 1 batch 72 — Elysian Whimsy

- **`expandRolledNoteTable`:** failure and critical-failure notes per result (`choiceGroup: "condition-roll"`, `choice: "result-N"`), and `conditionRoll.kind: "notes"`.
- **`inspectSavePlan`:** validates rolled notes (one per option, and only notes in the row).
- **`targetOutcomeNotes`:** filters a target's notes by the rolled result. It's used wherever the card lists, rolls rounds for, or makes row notes.
- **Note rules:** `all-speeds` penalties are allowed.
- **Duration:** `varies` is accepted when every rolled note has its duration.

See [verification](verification/phase-cantrip-rank-1-batch-72.md).

### Cantrip / rank 1 batch 73 — Gift of the Anemos

- **`extractAuraTrigger`:** the aura's one-sentence save becomes the triggered save's rows, with `storedTrigger.aura` and `sustained`. The compile drops the area and lifecycle for the exposure.
- **`isExecutableStoredTriggerPlan`:** accepts the aura variant.
- **`StoredTriggerRuntime.start`:** begins a sustained native record for it.

See [verification](verification/phase-cantrip-rank-1-batch-73.md).

### Cantrip / rank 1 batch 74 — Song of the Soul

- **`compileDirectHealing`:** reads “That creature regains … immediately and …”, plus the `THRALL_RECIPIENT` and `TRAIT_BY_RECIPIENT` notes (only with the thrall Target).
- **Target predicate:** “1 of your thralls” with the chosen-creature sentence is an actor target.
- **`TARGET_APPLICATION`:** also reads “That creature regains … immediately and gains”.
- **Completeness:** adds the fast-healing range data note.

See [verification](verification/phase-cantrip-rank-1-batch-74.md).

### Cantrip / rank 1 batch 75 — Agitate

- **`compileDegreeDurationNotes`:** with the spell's damage entry, reads the no-move sentence as `triggeredDamage` with `trigger: "no-move"` and frequency `round`.
- **Rows:** deal no damage.
- **`isTriggeredDamage`:** accepts `no-move`.
- **Control label and roll flavour:** “didn't Stride, Fly or Swim this turn”.
- **Changed test:** batch 16's strict test now mutates Agitate's damage form instead of asserting Agitate blocked.

See [verification](verification/phase-cantrip-rank-1-batch-75.md).

### Cantrip / rank 1 batch 76 — Barbed Spear

- **`expandSpellAttackTable`:** reads `LODGED` as `hitRider` (added to both hit rows by `table()`).
- **`compileAbility`:** marks the hit rows' condition `increment: true` and adds a `lodged-removal` reminder.
- **Card:** the condition snapshot carries `increment`. At Finalize, an incremented condition becomes the creature's current value + 1 (a condition override).

See [verification](verification/phase-cantrip-rank-1-batch-76.md).

### Cantrip / rank 1 batch 77 — Magic's Vessel

- **`compileAbility`:** sets aside the slot-trigger sentence and its “(Resistance)” link (matched by label, since PF2e links by id) before the Effects are classified. It then proves that Effect and sets `resolution.triggeredEffect`.
- **Effect route:** the main Effect's runtime metadata carries it.
- **The Ongoing control:** `triggered-effect` → `StoredTriggerRuntime.triggeredEffect` creates PF2e's Effect on the recipient and completes this round's Sustain.

See [verification](verification/phase-cantrip-rank-1-batch-77.md).

### Cantrip / rank 1 batch 78 — Trade Death for Life

- **`compileBasicBeneficiaryEffect`:** sets `resolution.beneficiaryEffect` (with `compilerEvidence.basicBeneficiaryEffect`). The linked Effect is kept off the unscoped list.
- **`inspectSavePlan`:** accepts it as a basic-save composition, and accepts the sustained lifecycle (the Effect's).
- **Card:** `beneficiaryHTML` and `grantBeneficiaryEffect` (action `beneficiary-effect`, also on `api.saves`). It refuses before Finalize, without damage, a second time, or on the damaged creature.

See [verification](verification/phase-cantrip-rank-1-batch-78.md).

### Cantrip / rank 1 batch 79 — Draconic Barrage

- **`extractEffectTrigger`:** the Effect's text and the bombard save. The compile proves the Effect and sets `storedTrigger.effectMarker` `{uuid, label, flag}`, plus a `casterChoice` damage type.
- **`StoredTriggerRuntime.start`:** makes PF2e's Effect the marker.
- **`trigger`:** reads the Effect's `rulesSelections[flag]` before ending the spell and starts the save card with that `casterChoice`.

See [verification](verification/phase-cantrip-rank-1-batch-79.md).

### Cantrip / rank 1 batch 80 — Crushing Ground

- **`proveDegreeChoiceRow`:** proves the damage-and-land-Speed sentence and the plain Escape sentence (with Immobilized granted).
- **`compileAbility`:**
  - Adds the Escape data note.
  - Reads the `NO_ESCAPE` note as `triggeredDamage` with `trigger: "no-escape"` and frequency `once`.
- **Residual prose:** claims the plain Escape sentence.
- **Controls:** the label and roll flavour read “didn't Escape before the spell ended”.

See [verification](verification/phase-cantrip-rank-1-batch-80.md).

### Cantrip / rank 1 batch 81 — Glass Shield

- **`extractShieldTrigger`:** the shield's text and the explosion save.
- **The compile:** proves the shield Effect (Hardness by reading its ternary chain at each stated rank) and sets `effectMarker` (no type flag).
- **`isExecutableStoredTriggerPlan`:** accepts an Effect marker that lasts until the caster's next turn and ends on its trigger.
- **`StoredTriggerRuntime.start`:** writes the trigger and notes into the Effect marker's description.
- **`trigger`:** reads a chosen type only when the marker has a type flag.

See [verification](verification/phase-cantrip-rank-1-batch-81.md).

### Cantrip / rank 1 batch 82 — Rainbow's End

- **`compileSustainedCasterNote`** (`spell-note.js`): claims the “For the spell's duration, …” sentence (and a trait sentence) of a sustained basic save with riders; `compileBasicGeneralRider` gates the rest without the Sustain, and the plan carries `resolution.casterNote` with `compilerEvidence.casterNote`.
- **`isSustainedCasterNote`** (`basic-save-core.js`): the note's text is the compiled sentence, and its duration is the spell's sustained maximum. The note lets a sustained basic save pass the lifecycle check; a note on any other plan is refused.
- **Runtime:** the state carries `casterNote.castText` (`spellNoteText` at the cast rank). Finalize creates it on the caster with `prepareSpellNoteEffectSource` (PF2e's sustained flag). Both cards show it, before Finalize and once applied.
- **`condition-list-lifetime.js`:** the grant verb accepts “additionally” (“is additionally Dazzled”).

See [verification](verification/phase-cantrip-rank-1-batch-82.md).

### Cantrip / rank 1 batch 83 — Soul Siphon

- **`compileDamageBenefit`:** the “total amount of HP the target loses, including … Drained” benefit carries `measure: "hp-lost"`. Only this measure may state no duration (`duration: null`).
- **`isCasterDamageBenefit`:** accepts the measure only for a single target, fraction 1, temporary HP, with Drained in the failure or critical failure row.
- **`applyCasterBenefit`:** measures `hpBefore − hpAfter` (the Hit Points before the damage less those after the row's conditions). With no duration, the temporary HP Effect is unlimited. The card says “Hit Points lost (damage and Drained)” and “until used”.

See [verification](verification/phase-cantrip-rank-1-batch-83.md).

### Cantrip / rank 1 batch 84 — Savor the Sting

- **`compileDegreePersistentDamage`:** accepts the “This deals … damage; the target must attempt a … save.” sentence, which may follow a plain narration. It also accepts per-rank persistent dice `(@item.level)dN`, “half damage and no persistent damage”, the untyped Heightened sentence, one extra introduction sentence (left to the preamble gate) and a trailing Spell Effect link in a row.
- **`caster-mark.js`:** `parseCasterMarkClaim`, `proveCasterMark` (TokenMark plus the predicated FlatModifier) and `compileCasterMark`. The compile moves the one linked Effect out of the rows into `resolution.casterMark` (the degrees that deal the persistent damage) and claims the sentence for the preamble gate. The data note says the Effect has no end.
- **`isCasterMark`** (`basic-save-core.js`): the claim is the compiled one, and the mark's degrees are exactly the rows dealing that persistent type. The proof must hold again.
- **Runtime:** at Finalize, one PF2e Effect per marked target on the caster, with the TokenMark rule's `uuid` set to the target's token (PF2e skips its prompt). The live template is proved again first. Both cards show the marks.

See [verification](verification/phase-cantrip-rank-1-batch-84.md).

### Cantrip / rank 1 batch 85 — Phantom Pain

- **`compileConditionEndedPersistentDamage`** (`persistent-damage-compiler.js`): the rows' damage and `outcome.persistentEndsWith` on failure and critical failure. The claimed sentence drops its conditional manual instruction, and `residual-prose.js` claims it.
- **`isConditionEndedPersistent`** (`basic-save-core.js`): a failing row that deals that persistent type and grants that condition.
- **Runtime:** the state carries `persistentEndsWith` by degree. After a target's row is applied, the persistent conditions from the receipt (or that type's one condition) get `flags.pf2e-automatic-resolution.persistentEndsWith`.
- **`persistent-link-runtime.js`:** `reconcileConditionEndedPersistent` deletes a tagged persistent condition once the creature has no condition of that slug. It runs on any condition deletion and once at ready.

See [verification](verification/phase-cantrip-rank-1-batch-85.md).

### Cantrip / rank 1 batch 86 — Signal Skyrocket

- **`cast-gate.js`:** `compileCastGate` produces `resolution.castGate` ({question, sourceText}) and an optional `placement` reminder. It claims both sentences for the preamble gate.
- **`basic-save-core.js`:** validates the gate (a degree save, the compiled sentence) and the `placement` reminder (only with a gate). `saveCollectionReadiness` waits for `castGate.answer`.
- **Runtime:** `state.castGate` with `answer`, the card's Yes/No (`data-save-action="cast-gate"`) and `answerCastGate`, also at `api.saves.answerCastGate`. “No” sets `excluded` on every pending target.

See [verification](verification/phase-cantrip-rank-1-batch-86.md).

### Cantrip / rank 1 batch 87 — Zenith Star

- **`note-effects.js`:** `selectNoteClauses` appends `NOTE_CONTINUATIONS` clauses to the note before them (`sourceTexts`). `isNoteContinuation` lets `residual-prose.js` drop their movement, caster-subject and action signals, and `NOTE_INSTANCE_LIMIT_DISMISSAL` keeps `compileSaveDismissal` from counting the automatic Dismiss.
- **`compile-ability.js`:** `carriedByNotes` (reads `sourceTexts` and semicolon parts) now runs again after “As …” rows copy the named row's notes. This also removed some manual flags on Heart's Desire and Trickster's Twin, which remain blocked.
- **`parseHeightenedDurations(html, {baseRank, baseDuration})`:** expands “(+N) The duration increases by X unit” into per-rank entries. `attachHeightenedDurations` passes the plan's rank and duration, and `noteAtRank` uses the result.

See [verification](verification/phase-cantrip-rank-1-batch-87.md).

### Cantrip / rank 1 batch 88 — Swampcall

- **`compileLingeringSaveTriggers`:** keeps a save-only-when-cast area when the area also becomes difficult terrain. `isExecutableLingeringPlan` already accepts an initial-only area with terrain.
- **`native-outcome-effect-compiler.js`:** `speedConditionShape`, `proveSpeedConditionRows` and `compileDegreeSpeedConditionEffects` produce the `degree-speed-condition` outcome rule, with `carriedConditions`, `claims` and `leaveArea`.
  - `residual-prose.js` drops that rule's claimed signals.
  - `hasUnscopedConditionDuration` and `addNativeSpellEffects` count its claims.
  - The data note compares PF2e's duration with the text's.
- **`native-outcome-effects.js`:** `inspectNativeOutcomeEffect` proves the kind again from the live template. `prepareNativeOutcomeEffectSource` sets `flags.leaveArea` from the card's `lingeringCastId`, so `clearLeaveArea` removes the Effect at a turn change when the creature is outside.
- **`startLingering`:** places and records the area from `item.loadVariant({castRank})` (PF2e's heightened area).

See [verification](verification/phase-cantrip-rank-1-batch-88.md).

### Cantrip / rank 1 batch 89 — Putrefy Food and Drink

- **`compileSpellNote`:** checks `ACTIVE_COUNTERACT` on the base text. Fixed-rank Heightened entries with a counteract check become `note.rankGate` ({maxRank, minRank, sourceText}), and `note.heightened` keeps only the entries below the gate. `EffectRuntime.#executeSpellNote` refuses a cast above `maxRank`.
- **`target-predicate-compiler.js`:** food, water, liquid, drink and cubic-foot targets are things (no actor targets). This also cleared the leftover `target-eligibility` on Cleanse Cuisine, Scrying Ripples, Shape Wood and Waters of Prediction, which were already note spells.

See [verification](verification/phase-cantrip-rank-1-batch-89.md).

### Cantrip / rank 1 batch 90 — Scrounger's Glee

- **`expandCompactDegreeTable`:** accepts a trailing `THIS_FLOOR` sentence (appended to the failing rows) and a trailing Dismiss payoff (kept before the table).
- **`compileSpellFloors`:** `THIS_SPELL_FLOOR` reads “This condition …”, meaning the row's one condition, with an optional `whileText`. `isConditionFloor` accepts only “the target can hear you” on a spell floor. `conditionFloorLabel` now names spell floors “Can't reduce X below N while the spell lasts” instead of “Curse: …”.
- **`compileSaveDismissal`:** `DISMISS_HEAL` sets `lifecycle.dismissal.payoff` ({kind: healing, formula, recipient: ally, reaction, trigger}) with `compilerEvidence.dismissalPayoff`. The Heightened step is checked (`dismissHealHeightens`), and the sentence is claimed for the preamble gate.
- **`ongoing-runtime.js`:** the “Dismiss … — reaction: …” control. `dismiss-cast` with `payoff` rolls `payoffFormula` at the record's rank, heals the targeted ally with `applyDamageWithReceipt`, and ends the cast.

See [verification](verification/phase-cantrip-rank-1-batch-90.md).

### Cantrip / rank 1 batch 91 — Vengeful Glare

- **`text-damage.js`:** a third form (three sentences joined) with its own Heightened check; `read` may return null. It returns `persistent` ({question, formula: "(@item.rank)", sourceText}), which becomes `resolution.persistentRider`.
- **`executablePersistentRider`** (`basic-save-core.js`): used by both `isExecutableBasicSavePlan` and the degree inspector. It requires text-derived damage, the damage-type choice and the compiled sentence. Readiness waits for the answer.
- **Runtime:** `state.persistentRider` (with `castAmount`), the card's Yes/No (`persistent-rider`) and `answerPersistentRider`, also at `api.saves.answerPersistentRider`. A yes rolls `{<text formula of the type>,(@item.rank)[persistent,<type>]}`.
- **`target-predicate-compiler.js`:** accepts “one creature you can see”.

See [verification](verification/phase-cantrip-rank-1-batch-91.md).

### Cantrip / rank 1 batch 92 — Weaken Earth

- **`expandNegatingSave`** (`compact-degree-table.js`): writes the negating save as a table and produces a `hardness` reminder (`compilerEvidence.hardness`, allowed by the core's reminder list and rendered on the card).
- **`proveStatedEffect(rules, sentence, {rank})`:** proves “The target gains weakness N to T damage.” (one Weakness rule, worth N at the spell's rank). `compileStatedEffect` and the stated-effect proof carry `rank`.
- **`target-predicate-compiler.js`:** the “made of X” creature target is GM-confirmed.

See [verification](verification/phase-cantrip-rank-1-batch-92.md).

### Cantrip / rank 1 batch 93 — Bane, Malediction

- **`expandGrowingAura`** (`compact-degree-table.js`): writes the table, saying “Each enemy in the area when you Cast this Spell and each time you Sustain it must attempt a … save.”. It returns `growingAura` (set on the adapted spell) and a `counteract-spell` reminder (`compilerEvidence.counteractSpell`).
- **`compileLingeringSaveTriggers`:** with `growingAura` on an emanation, accepts the Sustain event on a spell that isn't sustained. It adds `optionalSustain`, `growth: {feet}` and `unaffectedOnly` to the declaration. `isExecutableLingeringPlan` accepts these only together, on a caster emanation whose only later event is Sustain.
- **`compileAreaPenaltyEffects` / `proveAreaPenalty`** (`native-outcome-effect-compiler.js`) produce the `area-penalty-effect` rule (`leaveArea`). It is proved again at application in `native-outcome-effects.js`.
- **`ongoing-families.js`:**
  - `sustainable` includes `optionalSustain`, labelled “Optional Sustain to expand …”. A missed Sustain doesn't end the area.
  - Sustain adds `growth.feet` to the recorded radius, once a round, and exposes only members without this cast's `leaveArea` Effect.
  - The existing leave-area cleanup removes the Effect.
- **Counteract reminders:** the card's Counteract button and `counteractReminder` accept `counteract-spell`.

See [verification](verification/phase-cantrip-rank-1-batch-93.md).

### Cantrip / rank 1 batch 94 — Flourishing Flora

- **`option-text-damage.js`:** `compileOptionTextDamage` rewrites the spell as an ordinary basic save. The compile then sets:
  - `casterChoice` {kind: "option", values, label, options: {name: {type}}};
  - the critical row's conditions tagged `choiceGroup: "caster-option"` and `option`;
  - an option-tagged inline formula (mixed damage);
  - `basicConditionRider` evidence.
- **`executableCasterChoice`:** the `option` kind (every extra belongs to one listed option, only on the critical row). The degree inspector accepts text-formula damage for this kind, and `targetOutcomeConditions` keeps only the chosen option's conditions.
- **Runtime:**
  - The snapshot keeps `option`.
  - `chooseCasterOption` drops the other options' formulas. A row left without formulas becomes shared damage, and its dropped keys are written as null because the card's flag update merges objects.
  - The text damage rolls as `options[selected].type`.

See [verification](verification/phase-cantrip-rank-1-batch-94.md).

### Cantrip / rank 1 batch 95 — Winter Bolt

- **`spell-attack-table.js`:** `LODGES` / `EXPLODES` / `REMOVED` in the written-table preamble, and the rows `LODGED_CRITICAL` / `LODGED_SUCCESS`, which become full damage. The Heightened step is checked, and the table returns `lodgedExplosion`.
- **`compile-ability.js`:** a note on both hit rows with `triggeredDamage` {trigger: "explosion", dice: rank, heightening +1, multiplier 2/1, adjacent: true, endsSpell: true}. `isTriggeredDamage` accepts that shape only for “explosion”.
- **Runtime:** the Ongoing control passes the GM's targets as `adjacentUuids`. `hostileDamage` rolls `(2*(Nd12))[cold]` after a critical hit (PF2e's application takes no multiplier), applies it to the creature and to each targeted token within 5 feet (with the `area-damage` option), and deletes the note.

See [verification](verification/phase-cantrip-rank-1-batch-95.md).

### Cantrip / rank 1 batch 96 — Withering Grasp

- **`spell-attack-table.js`:** handles:
  - the subject “Your X deals …” (preamble and rows);
  - “(both initial and persistent)”;
  - `SHIELD_BLOCKED` (becomes `shieldBlocked`);
  - `VOID_CONSTRUCTS` (becomes `voidConstructs`, only when every damage entry is void);
  - the rows' `OBJECT_HARDNESS` (an `object-hardness` reminder).
- **`compile-ability.js`:** sets `resolution.immunityBypass` {type: void, trait: construct} and the `shield-blocked` reminder, with their evidence. The core checks all three.
- **Runtime:** before a construct with void immunity takes the damage, it gets an Effect with `{key: "Immunity", mode: "remove", type: "void"}`, flagged `persistentLink` void, and the runtime verifies the immunity is gone. The Effect is deleted right away if the target has no persistent void; otherwise `reconcilePersistentLinks` removes it when that damage ends.

See [verification](verification/phase-cantrip-rank-1-batch-96.md).

### Cantrip / rank 1 batch 97 — Unfetter Eidolon

- **`spell-note.js`:** two `MENTIONS` patterns (“aiding … against being @C”, “effect that would make them … or @C”). Unfetter Eidolon becomes a note on the targeted eidolon (note only, counted apart).

See [verification](verification/phase-cantrip-rank-1-batch-97.md).

### Cantrip / rank 1 batch 98 — Gust of Wind

- **`expandGust`** (`compact-degree-table.js`, also tried before the written-table early exit): rewrites the trigger and rows. It returns `sizeLimit` (a `size-at-most` predicate added after the targets are compiled), `gust` (success note, flying question, critical row) and a `surroundings` reminder (`compilerEvidence.surroundings`).
- **`compile-ability.js`:** the success row's note and a GM-confirmed `degreeAdjustment` (failure → critical failure) are added at the end of the compile, once the rows exist.
- **`compileLingeringSaveTriggers`:** “until the start of your next turn” is 6 seconds with `endsAt: "caster-turn-start"`. A trigger without damage is allowed when a row states the damage.

See [verification](verification/phase-cantrip-rank-1-batch-98.md).

### Cantrip / rank 1 batch 99 — Hallowed Ground

- **`compileAreaAfterEffect`** (`lingering-area-compiler.js`, tried first in `compileLingeringArea` for basic saves): returns `memberEffect` {trait, weakness} (optionally `recastEnds` and a counteract sentence).
- **`compile-ability.js`:** proves the one linked Effect (a single Weakness of that type, worth the value at the spell's rank, for that trait) and adds uuid, label and document to `memberEffect`. It also adds the `counteract-spell` reminder (“raise undead”) and the necromancy data note.
- **`isExecutableLingeringPlan`:** an area with no later events may last for its member Effect.
- **`ongoing-families.js`:** `syncMemberEffect` gives each member of the trait PF2e's Effect (unlimited, flagged `leaveArea`) at the start and on each reconcile. `clearLeaveArea` removes it from those who left.

See [verification](verification/phase-cantrip-rank-1-batch-99.md).

### Cantrip / rank 1 batch 100 — Earth's Bile

- **`compileMovingArea`** (`lingering-area-compiler.js`, after `compileAreaAfterEffect`): a sustained area with `events: ["sustain"]`, `initial`, `moveOnSustain` and a note. It returns `persistentOnFailure` (the formula, and its doubled form).
- **`compile-ability.js`:** makes the failure and critical-failure rows mixed damage (shared plus that inline persistent formula), with `basicPersistentDamageRider` evidence.
- **Runtime:** unchanged. The GM moves the region before Sustaining, and the Sustain exposes the creatures inside it.

See [verification](verification/phase-cantrip-rank-1-batch-100.md).

### Cantrip / rank 1 batch 101 — Garden of Healing

- **`compileHealingPulse`** (new `src/compiler/healing-pulse.js`): proves the pulse sentence against the one healing entry and its heightening, and the after-Effect sentence against the linked Effect (one saving-throw `FlatModifier`, predicate `item:trait:<trait>`, and its minutes). It returns the resolution kind **`healing-pulse`** (added to `SUPPORTED_RESOLUTION_KINDS`).
- **`EffectRuntime`:** heightens the formula at the cast rank and calls `ongoing.startHealingPulse`.
- **`OngoingFamilies.startHealingPulse`:** a sustained lingering record centred on the caster (`declaration.healingPulse`, `events: []`) that pulses once when it starts.
- **`pulseHealing`:** one roll, applied as healing to each member and the caster, and back from Dying at 1 HP or more. It skips creatures holding the Effect, matched by its compendium uuid, and records `healedActorUuids`.
- **Sustain:** the lingering Sustain branch pulses on the first Sustain each round.
- **`OngoingRuntime.end`:** calls `applyPulseAfterEffect`, which gives PF2e's Effect (starting now) to each healed creature once per cast.

See [verification](verification/phase-cantrip-rank-1-batch-101.md).

### Cantrip / rank 1 batch 102 — Scouring Sand

- **`compileAreaCounteractTerrain`** (new `src/compiler/area-counteract-terrain.js`): for a lingering degree-save area, returns a `surroundings` reminder, a `counteract-spell` reminder (with evidence), a move-on-Sustain note for `lingering.notes`, and the claimed sentences. The note's whisper doesn't add "End the spell…".
- **`compileEffectDuration`:** “for its next action” after a condition sets `endsWhen: [{event: "action", action: "next"}]` (expiration `event`).
- **`isActionEndLifetime`:** also accepts `next`, when there is no duration.
- **Runtime:** the outcome Effect's `actionEnd.action` carries `next`; its name ends “(until its next action)”. Ongoing spells' `action-end` accepts `next`, with the control “X took its next action: end …”.

See [verification](verification/phase-cantrip-rank-1-batch-102.md).

### Cantrip / rank 1 batch 103 — Discomfiting Whispers

- **`expandRollTwiceAura`** (`compact-degree-table.js`): rewrites the sentence into a turn-start save with a table. Failure is “rolls twice … lower result” plus the Effect link; critical failure is “As failure.” It returns `failedAttackDamage`, which the lingering compiler copies into the declaration with the item's heightening. A damage entry with no rows is allowed for it.
- **`compileRollTwiceEffects` / `proveRollTwice`** (`native-outcome-effect-compiler.js`): outcome rule `roll-twice-effect`, inspected again at runtime in `native-outcome-effects.js`.
- **Core:** `isFailedAttackDamage`. `lingeringExposurePlan` drops the shared damage for it.
- **Ongoing:** a failed or critically failed exposure adds to `record.failedAttacks`. That entry ends when the creature's turn ends.
- **Controls:** the action `failed-attack` deals the damage via `DamageRoll` + `applyDamageWithReceipt`. With `failed: false` it clears the entry instead.

See [verification](verification/phase-cantrip-rank-1-batch-103.md).

### Cantrip / rank 1 batch 104 — Turbulent Tide

- **`strikeBreakPush`** (`strike-prelude.js`): returns the push sentence rewritten for the compact push table, `area: {emanation, 5}`, a `castGate` (the unbreakable-item sentence as the GM's question), and `strike-placement` reminders (the break, and the follow-up Stride).
- **`compile-ability.js`:** applies the prelude's `area` to `adapted.targeting`, and its `castGate` to the resolution, with evidence.
- **Runtime:** unchanged (the existing Strike reminder, cast gate and push notes).

See [verification](verification/phase-cantrip-rank-1-batch-104.md).

### Cantrip / rank 1 batch 105 — Wildfire

- **`expandHazardousBurst`** (`compact-degree-table.js`): rewrites the sentence into a turn-end save whose failure is the persistent damage, with a heightened formula `(1+floor((@item.rank - 1)/2))`. Note the spaces: `@item.rank-1` would read as one roll-data path. It returns `hazardMove` and `sustainGrowth`, which the lingering compiler copies into a sustained declaration.
- **Core:** `isHazardMove`. `lingeringExposurePlan` drops the shared damage for it.
- **Ongoing:** the first Sustain each round grows each placed circle region by the feet (converted to pixels) and raises `declaration.area.value`.
- **Control:** a GM-only “moved through the area” control (one targeted token, a squares prompt) runs the action `hazard-move`. It deals one `DamageRoll` per square through `applyDamageWithReceipt`, then posts one summary card.

See [verification](verification/phase-cantrip-rank-1-batch-105.md).

### Cantrip / rank 1 batch 106 — Mushroom Patch

- **`compileLingeringSaveTriggers`:** merges the round sentence and the following save sentence into “Each creature in the area when the spell is cast and at the start of each round must attempt …”. `TRIGGER_PHRASES` maps that to `initial` + `round-start`, which `isExecutableLingeringPlan` allows.
- **Ongoing reconcile:** a `round-start` exposure goes to every member when `clock.round` grows, or when combat starts.
- **`attachActionEnds`:** the `OUTSIDE` sentence sets `endsWhen: [{event: "action", action: "outside-action"}]` and drops the row's `conditional-effect` manual instruction. The residual prose treats that clause as compiled.
- **Runtime:** the Effect name suffix, and the Ongoing `action-end` control label “(outside the area): spend 1 action to end …”.

See [verification](verification/phase-cantrip-rank-1-batch-106.md).

### Cantrip / rank 1 batch 107 — Lift Nature's Caul

- **`compileBolsterSplit` / `proveBolsterEffect`** (new `src/compiler/bolster-split.js`): produces `resolution.bolster {question, uuid, document, claim, sourceText}`. Core checks it with `executableBolster`.
- **Bolster runtime:** targets start with `bolster: {status: "pending"}`. The corrections `bolstered` / `not-bolstered` set the status and eligibility, readiness waits for them, and Finalize creates PF2e's Effect on each bolstered target.
- **Row immunity:** `ROW_IMMUNE` marks `criticalSuccess.rowImmunityText` before the residual analysis. `temporaryImmunity.degrees = ["criticalSuccess"]` is validated in core, and the runtime applies the immunity only to those degrees.
- **Floor while a condition lasts:** `WHILE_CONDITION_FLOOR` in `compileSpellFloors`, which now runs for non-sustained spells when a row says so; spell-lasting floors still need a sustained spell. It produces `conditionFloor {lifetime: "while-condition", whileCondition: {slug, duration}}`.
- **Floor runtime:** the floor Effect has the held condition's timer. Its `outcomeEffect.linkedTo` points at that condition's wrapper grant, and it's attached to the Ongoing record, so `reconcileLinkedConditions` ends it with the root.

See [verification](verification/phase-cantrip-rank-1-batch-107.md).

### Cantrip / rank 1 batch 108 — Thrall Charge

- **`compileThrallStrike`** (new `src/compiler/thrall-strike.js`): produces the resolution kind **`thrall-strike`** (in `SUPPORTED_RESOLUTION_KINDS`), with `{dieSize, ranks, range}`.
- **`EffectRuntime`:** checks one targeted token (not the caster) within range, and asks the destroy question (`options.destroyThrall`). It creates an Effect on the thrall with `DamageDice` (`strike-damage`, no damage type), plus a `FlatModifier` status bonus when destroyed. The Effect is flagged `strikeRider`, so the existing hook removes it after that actor's Strike damage roll.

See [verification](verification/phase-cantrip-rank-1-batch-108.md).

### Cantrip / rank 1 batch 109 — Life Tap

- **`extractThrall`:** the `ONE_WITHIN` pattern (“One creature within N feet of the targeted thrall must attempt …”), and `DESTROYED` accepts “The targeted thrall is then destroyed.”.
- **`compileHealBack`** (new `src/compiler/heal-back.js`): sets the rows' Drained durations and produces `resolution.healBack {multiplier, measure: "hp-lost", within, degrees, onceEvery}`. Core validates it, and the residual analysis claims the rows through `healBackClaims`.
- **`uncompiledSavePreamble`:** flags untyped “NdM damage”. Only already-blocked spells gained the flag.
- **Runtime:** a completed card shows the heal control. `healBack(card, targets)` checks the target is the caster or an ally, the distance to the thrall, and the lock Effect (`healBackLock`). It heals `multiplier ×` the recorded HP lost (`hpBefore − hpAfter`), and creates the lock Effect for `onceEvery`.

See [verification](verification/phase-cantrip-rank-1-batch-109.md).

### Cantrip / rank 1 batch 110 — Vindicator's Mark

- **`extractAttackMark` / `proveStrikeMark`** (new `src/compiler/attack-mark.js`): rewrites the attack to the one-sentence form, with the Effect link placed after the heightening.
- **`compile-ability.js`:** binds `resolution.casterMark {kind: "strike-bonus", degrees: hit rows}`. It also sets the GM-confirmed target, a `mark-note` reminder, and `lifecycle.dismissal.payoff {kind: "damage", recipient: "marked-target"}`.
- **Core:** checks `isCasterMark` for the new kind, the dismissal payoff and the reminder kind.
- **`basic-save-runtime`:** proves the mark by kind, attaches it to the Ongoing record (which a strike-bonus mark now requires), and adjusts the card text.
- **`ongoing-runtime`:** `payoffFormula` reads `(ceil(@item.rank/N)+K)dX`. The confirmed Dismiss-for-damage control rolls `DamageRoll` on the token in the mark entry's `markedTokenUuid`, then ends the cast.

See [verification](verification/phase-cantrip-rank-1-batch-110.md).

### Cantrip / rank 1 batch 111 — Threefold Limb

- **`extractOptionAttack`** (new `src/compiler/option-attack.js`): rewrites the attack to the one-sentence form of an untyped text component; the Effect links go after the heightening.
- **`compile-ability.js`:** sets `sharedDamage {mode: "formula", textDerived}` and `casterChoice {kind: "option"}`. The hit rows get the Ice Effect (`outcomeRule.kind: "option-speed-effect"`, `choiceGroup: "caster-option"`) and the Steam note (tagged the same way), plus an `option-note` reminder.
- **Core:** `executableCasterChoice` gains an attack-path option branch, and option values may be two words. Option-tagged notes are checked, and `targetOutcomeNotes` filters by the chosen option. `validate-plan` and `native-outcome-effects` prove the new rule.
- **Runtime:** the row Effects are filtered by the chosen option, and the reminder is rendered.

See [verification](verification/phase-cantrip-rank-1-batch-111.md).

### Cantrip / rank 1 batch 112 — Pact Broker

- **`extractPactTrigger`** (`stored-trigger.js`): produces a held, sustained stored trigger with immunity and a note. It moves the rows' Effect link into the failure row, and rewrites the item's damage as “full damage”. It returns the one-worse `degreeAdjustment`, applied to the resolution with evidence, and the held spell's duration.
- **`compilePenaltyEffects`:** gains the selector pair “attack and damage rolls”, the qualifier “against you and your allies” (a data note when PF2e's Effect has no predicate) and “As failure, but the penalty is –N”. It treats one flag Effect linked in several rows as one, and accepts the held spell's duration (`heldDuration`) as the Effect's lifetime.
- **Runtime:** unchanged. The held marker, trigger, card question and immunity were already in place.

See [verification](verification/phase-cantrip-rank-1-batch-112.md).

### Cantrip / rank 1 batch 113 — Forge

- **`compile-ability.js`:** binds the critical-failure Effect as `weakness-effect` with `recipientTrait` (proved by `proveWeaknessClaim`, plus the heightened step), and adds a `hardness-by-damage` reminder (validated by evidence).
- **Target:** “N creature(s) or unattended X object(s)” is complete for creatures.
- **`uncompiledSavePreamble`:** flags capitalized condition names without links. No other spell changed.
- **Runtime:** the native-Effect loop skips a `recipientTrait` Effect on a creature without that trait, with a card note.

See [verification](verification/phase-cantrip-rank-1-batch-113.md).

### Cantrip / rank 1 batch 114 — Appearance of Wealth

- **`attachActionEnds`:** reads `FIRST_ACTION` (“until it has completed its first action on its next turn”) as `endsWhen: [{event: "action", action: "next-turn-action"}]`. Core, the Effect's name and description, and the Ongoing control accept the new kind.
- **`compile-ability.js`:** the lure sentence sets GM-confirmed actor constraints, and the disbelief and display sentences become `illusion-note` reminders (validated by evidence). All three are claimed from the preamble and from the Sustain check.

See [verification](verification/phase-cantrip-rank-1-batch-114.md).

### Cantrip / rank 1 batch 115 — Exchange Image

- **`compile-ability.js`:** the appearance-swap block takes PF2e's `Spell Effect: <spell>` from the catalog. Each row gets it as `outcomeRule.kind: "spell-copy-effect"`, with `durationOverride` and `alsoCaster`.
- **The block also sets:** the trait target, the `auto-critical-failure` reminder, a cast-wide Dismiss, and the outcome lifetime.
- **Inspection:** `native-outcome-effects` checks the Effect again (only its Impersonate bonuses).
- **Runtime:** after the target's Effect, the same source goes on the caster once (`state.casterCopyUuid`), attached to the Ongoing record.

See [verification](verification/phase-cantrip-rank-1-batch-115.md).

### Cantrip / rank 1 batch 116 — Flense

- **`extractTraitModes`** (new `src/compiler/trait-modes.js`): `compileSpell` compiles the living and undead paragraphs as two ordinary attacks. The living plan is returned, with `resolution.traitVariant {trait, outcomes}` from the undead one. Core checks that the variant's rows are executable too.
- **`snapshotOutcomes`:** also snapshots the variant's rows, sharing the cast's rolls.
- **Targets:** a target with the trait is marked `traitVariant`, and `outcomeForTarget` routes it to those rows.

See [verification](verification/phase-cantrip-rank-1-batch-116.md).

### Cantrip / rank 1 batch 117 — Redistribute Potential

- **`extractZoneModes`** (`trait-modes.js`): `compileSpell` compiles the two squares as basic saves, retyping the damage entry. The first is returned, with `traitVariant {kind: "zone", values, question, damageSwap}` and the second's rows. Core checks the zone variant.
- **Runtime:** targets start with `zone: {status: "pending"}`. The `zone` correction sets `traitVariant`, and readiness waits for it. The card shows the square buttons, and the damage apply swaps the type for the second square.

See [verification](verification/phase-cantrip-rank-1-batch-117.md).

### Cantrip / rank 1 batch 118 — Murmuration

- **`extractMurmurTrigger`** (`stored-trigger.js`): a held sustained trigger with the rows canonicalised, plus a text component.
- **`compile-ability.js`:** sets `sharedDamage {mode: "formula", formula: "(@item.rank)d4[untyped]", textDerived, degreeScaled}` and `casterChoice {kind: "damage-type"}` (which core now allows on degree saves with `degreeScaled`). The critical failure's Effect becomes `outcomeRule.kind: "next-roll-penalty-effect"`, inspected in `native-outcome-effects`.

See [verification](verification/phase-cantrip-rank-1-batch-118.md).

### Cantrip / rank 1 batch 119 — Crown of Prophets

- **`extractProphecyTrigger`** (`stored-trigger.js`): produces a stored trigger with `grantedStrike` and the Effect link. `compile-ability.js` proves the Effect's one Strike rule and sets `effectMarker` (flag null); the exposure save's lifecycle is reset.
- **Core:** `isExecutableStoredTriggerPlan` accepts `effectSustained` (an Effect marker, `endsOnTrigger: false`, sustained, with a duration).
- **Runtime:** the Effect-marker start begins a sustained record for sustained triggers, and the marker text no longer says the spell ends.

See [verification](verification/phase-cantrip-rank-1-batch-119.md).

### Cantrip / rank 1 batch 120 — notes by user decision

- **`spell-note.js`:** `DARKNESS_FORM` is stripped before the counteract check. `judgeNumbers` skips number-free Hit Point mentions. `SINGLE_ACTOR_TARGET` accepts “the triggering creature or object”.
- **Aura pair:** `compileEffectNote` accepts an Aura + Spell Effect pair (`effectNote.companion`). `addNativeSpellEffects` doesn't flag the pair's links as unscoped.
- **Target predicates:** “the triggering creature or object” is complete.

See [verification](verification/phase-cantrip-rank-1-batch-120.md).

### Cantrip / rank 1 batch 121 — Dancing Blade, Spirit Object

- **`extractSustainAttack`** (new `src/compiler/sustain-attack.js`): `compileSpell` compiles a rewritten copy (the attack trait, a text damage entry, no item heightening) as an ordinary spell attack.
- **The plan it returns:** a fixed lifecycle, `sharedDamage {mode: "formula", textDerived}`, a physical `damage-type` caster choice, `repeatable {window: "sustain", attacks, onCast}`, and `sustain-attack-note` reminders. A cantrip heightens from rank 1.
- **Core:** checks the sustain window, and the text-derived `damage-type` choice on spell attacks.
- **`main.js`:** the card button treats `sustain` like later-turn attacks (once per caster turn, within the duration), labelled “Sustain: Attack”.

See [verification](verification/phase-cantrip-rank-1-batch-121.md).

### Cantrip / rank 1 batch 122 — Grasping Vine

- **Row notes** (`compile-ability.js`): two new kinds, `reposition` (`REPOSITION_NOTE`) and `breakable` (`BREAKABLE_NOTE`), each claiming its exact row sentence. `breakable` drops the row's `conditional-effect` instruction.
- **`residual-prose.js`:** a `reposition` note explains the movement signal. A `breakable` note explains damage and modifier signals, unless its sentence has dice, a bonus or a penalty.
- **`basic-save-core.js`:** validates both kinds only beside a row that grabs.
- **Target predicates:** “1 unattended object of up to N Bulk, or SIZE or smaller creature that is currently on the ground” gives `size-at-most` plus a `gm-confirmed` question.
- **Object branch:** the `object-branch` reminder (`compilerEvidence.objectMove`) claims the object's move sentence. That sentence and the `reposition` notes no longer count as unclaimed Sustain text.

See [verification](verification/phase-cantrip-rank-1-batch-122.md).

### Cantrip / rank 1 batch 123 — Wish Market

- **New resolution kind `offer-effect`** (`src/compiler/offer-effect.js`): `compileOfferEffect` returns `resolution.offer`, which holds:
  - `bonus {type, value, byRank, skills}`;
  - `freeActions`;
  - `price {formula, rows[{face, label, type, value, skills}]}`;
  - `suppress {rounds, action}`;
  - `durationSeconds` and `text`.
- **Checks and rules:** `isExecutableOffer` checks the shape. `offerRules` builds the Effect's FlatModifiers; each price penalty has the predicate `{not: "self:effect:<spell>-price-suppressed"}`.
- **Runtime (`effect-runtime.js`):**
  - The skill comes from `options.offerSkill` or a DialogV2 select.
  - The module rolls the price, then creates one sustained Effect on the caster.
  - The card's control (`runtimeAction: "suppress"`, `data-repeatable`) replaces the 1-round marker Effect whose `system.slug` is that roll option.
- **`main.js`:** a repeatable receipt button is re-enabled after it's used.

See [verification](verification/phase-cantrip-rank-1-batch-123.md).

### Cantrip / rank 1 batch 124 — Shattering Gem

- **`extractGemTrigger`** (`stored-trigger.js`): a held stored trigger with `pool {label, hp, perStep, interval, flatDC, range}` and `saveTarget: "attacker"`.
- **`basic-save-core.js`:** `isStoredPool` and `storedPoolHp` are new. `isExecutableStoredTriggerPlan` accepts the pool form: timed, not sustained, and ends on its trigger.
- **`stored-trigger-runtime.js`:**
  - `#startHeld` sets the pool's marker for the spell's duration, with `flags.poolHp`.
  - `poolCheck` rolls the flat check and records `poolBlock`.
  - `poolAbsorb` restores the absorbed damage and lowers the pool. At 0, it calls `trigger` with the attacker (when within range) or ends the record.
  - `trigger` uses the given target for `saveTarget: "attacker"`.
- **`ongoing-runtime.js`:** the “was Struck” control replaces the generic Trigger control for a pool. It has actions `pool-check` and `pool-absorb`.
- **API:** `storedTriggers.poolCheck` / `poolAbsorb`.

See [verification](verification/phase-cantrip-rank-1-batch-124.md).

### Cantrip / rank 1 batch 125 — Trickster's Mirrors

- **`extractMirrorTrigger`** (`stored-trigger.js`): a caster stored trigger with `images {noun, start, max, perSustain, odds[{count, die, you}], range}` and `saveTarget: "attacker"`. It's sustained and not ended by its trigger.
- **`basic-save-core.js`:** `isStoredImages` is new, and `isExecutableStoredTriggerPlan` accepts the images form.
- **`stored-trigger-runtime.js`:**
  - `start` names the marker with the count (`flags.images`); the record is sustained.
  - `images({action: roll|miss|area|sustain})` updates the count. `miss` calls `trigger` (the save card) when the attacker is within range, and `sustain` completes the round's Sustain obligation.
- **`ongoing-runtime.js`:** four controls replace the generic Trigger control. The action is `images`.
- **API:** `storedTriggers.images`.

See [verification](verification/phase-cantrip-rank-1-batch-125.md).

### Cantrip / rank 1 batch 126 — Stick On

- **New resolution kind `size-bond`** (`src/compiler/size-bond.js`): `compileSizeBond` returns `sizeBond`, which holds:
  - `condition` (Immobilized);
  - `escape {dc: "spell"}`;
  - `dismissible`, `durationSeconds` and `objects`;
  - `texts {bond, smaller, same, larger}`.

  `compareSizes` uses PF2e's size slugs, and `isExecutableSizeBond` checks the shape.
- **Runtime (`effect-runtime.js` `#executeSizeBond`):**
  - The target's bond Effect carries `flags.outcomeEffect.escape {dc}`, so `escape-termination.js` grades Escape checks against it. A smaller target's bond has a GrantItem Immobilized.
  - For the same size or a larger target, the caster also gets an Effect; a larger target's grants Immobilized.
  - Every Effect's metadata has `termination: {scope: "cast-instance"}` in one Ongoing record. An Escape that deletes the target's bond ends the caster's Effect too.

See [verification](verification/phase-cantrip-rank-1-batch-126.md).

### Cantrip / rank 1 batch 127 — Grease; the speed test and non-save routes

- **`extractAreaOrObject`** (new `src/compiler/area-or-object.js`):
  - It rewrites the area branch into a degree table: the condition on failure and critical failure. The target becomes “N contiguous 5-foot squares”, a complete actor target in `target-predicate-compiler.js`.
  - It adds three reminders (`save-or-skill`, `surroundings`, `object-branch`), accepted when their `sourceText` is in `compilerEvidence.areaOrObject`.
- **`tools/test-cross-family-speed.mjs`:** an audited batch spell whose route isn't a save (a note, Effect + note, `offer-effect`, `size-bond`) must not gain a one-time save, the same exemption lingering areas and stored triggers have.
  - Before this, the test failed on Manifest Will from batch 120 onward, and the pipeline didn't show it. Batches 120–126 carry a correction note.

See [verification](verification/phase-cantrip-rank-1-batch-127.md).

### Cantrip / rank 1 batch 128 — Dehydrate

- **`extractPersistentFollowUp`** (new `src/compiler/persistent-follow-up.js`), used at the top of `compileSpell`:
  - It compiles two copies: the cast (a basic save; `defense.save.basic` set from the text) and the additional save (the table, one creature, no damage, no area).
  - `resolution.followUpSave` holds `{timing, damageType, statistic, question, note, outcomes, check, durationSeconds}`.
- **Basic saves with a trait degree adjustment:**
  - `compileDegreeAdjustments` has a new uniform form, “… get a result one degree of success worse than they rolled”.
  - In the basic branch, a trait-any adjustment is evidence `basicDegreeAdjustment` and keeps the level automatic.
  - `isExecutableBasicSavePlan` accepts only that adjustment.
- **`basic-save-core.js`:** `followUpExposurePlan` (the degree plan, guided) and `isExecutableFollowUpSave` are new.
- **`basic-save-runtime.js`:**
  - The state carries `followUpSave` with its `exposurePlan`.
  - After Finalize, each participating creature now taking that persistent damage gets `ongoing.startFollowUpSave`.
- **`ongoing-families.js`:**
  - `startFollowUpSave` starts a lingering `centre: "targets"` record with `events: ["turn-end"]`, `endsWithPersistent` and `reviewQuestion` (the review label).
  - The reconcile ends it when the persistent damage is gone, unless its turn just ended or a save is pending.

See [verification](verification/phase-cantrip-rank-1-batch-128.md).

### Cantrip / rank 1 batch 129 — Hand of the Apprentice

- **New resolution kind `weapon-throw`** (guided; `src/compiler/weapon-throw.js`):
  - `compileWeaponThrow` proves PF2e's Effect with `proveWeaponThrowEffect`: the ChoiceSet flag, the forced ability FlatModifier on `{…}-damage`, and CriticalSpecialization on `item:id:{…}`.
  - The plan carries `weaponThrow {effect, flag, ability}` and a data note.
- **`#executeWeaponThrow`** (`effect-runtime.js`):
  - Candidates are the caster's Strikes whose item is a held melee weapon.
  - The Effect's ChoiceSet gets `selection`, and the spell attack is `spell.rollAttack(null, n, {target})`.
  - On a hit, the card has a `weapon-damage` receipt button. It calls the Strike's `damage()` or `critical()` while the Effect is on the caster.

See [verification](verification/phase-cantrip-rank-1-batch-129.md).

### Cantrip / rank 1 batch 130 — Invoke True Name

- **New resolution kind `spell-mark`** (`src/compiler/spell-mark.js`):
  - `compileSpellMark` returns `spellMark {offGuard, savePenalty, weakness {perRank, once}, knownName}`.
  - `spellMarkRules` builds the Effect's rules for the caster's `signature`. Predicates checked live in PF2e 8.5:
    - AC and save FlatModifiers: `["origin:signature:<caster>", "item:type:spell"]`. `origin:item:type:spell` doesn't match.
    - Weakness: `type: "custom"` with `definition: ["item:type:spell", "self:signature:<caster>"]`. A plain Weakness `predicate` is tested when the actor's data is prepared, not per damage, so it never applies.
- **`#executeSpellMark`** (`effect-runtime.js`): the Effect lasts `0 rounds, turn-end` from the current combatant, with `flags.spellMark {signature, weaknessUsed}`.
- **`removeSpellMarkWeakness`** (a `createChatMessage` hook in `main.js`): on PF2e's `damage-taken` message whose options include `item:type:spell` and the mark's `self:signature`, the active GM removes the Weakness rule.

See [verification](verification/phase-cantrip-rank-1-batch-130.md).

### Cantrip / rank 1 batch 131 — Shielded Arm

- **New resolution kind `temporary-shield`** (`src/compiler/temporary-shield.js`): `compileTemporaryShield` returns `temporaryShield {part, acBonus, hardness, hp, heightening, durationSeconds, notes}`. `temporaryShieldAt` gives the values at a cast rank.
- **`#executeTemporaryShield`** (`effect-runtime.js`):
  - It creates an Effect for the duration and a shield item (`temporaryShieldSource`, in the new `scripts/temporary-shield-runtime.js`), linked by `flags.temporaryShield.castId`.
  - The item is held in one hand, with Bulk 0, the spell's Hardness, and `hp` at twice the spell's (PF2e 8.5 derives Broken Threshold as half the maximum; probed live).
  - A new cast replaces the target's earlier one.
- **`registerTemporaryShields`:** deleting one linked item deletes the other. An expired Effect, or a shield at or below its spell threshold, ends both, with a chat line.

See [verification](verification/phase-cantrip-rank-1-batch-131.md).

### Cantrip / rank 1 batch 132 — stated Effect applications

- **`unscoped-effect-trigger-compiler.js`:**
  - `statedApplication` is new; it runs before the other recipient rules. Its forms are the healing bonus, the first-Strike toggle, a reaction's named target, a rolled formula badge and a counter badge; each checks the Effect's rules or badge.
  - `AREA_ALLIES` also accepts “Each ally in the area gains”.
- **Target predicates:** “you or the triggering ally” and “your familiar” are complete targets.
- **Proof limit (not changed):** the shared completeness proof (`analyzeNativeEffectCompleteness`) blocks only listed patterns: damage, checks, templates, dismissal and so on. An extra bonus sentence the Effect doesn't carry isn't caught. A blocker for any leftover bonus or penalty would drop about 75 existing Effect spells (Heroism, Protection, Enlarge, …), whose bonus sentences the sentence-claimer doesn't match, so it wasn't added.

See [verification](verification/phase-cantrip-rank-1-batch-132.md).

### Cantrip / rank 1 batch 133 — Effect route: immunity, cast condition, both holders

- **The completeness proof** (`analyzeNativeEffectCompleteness`) claims the immunity sentences (`temporaryImmunity {key, duration, startsWhen: cast|effect-used}`), the cast condition (`castCondition`), the both-holders sentence (`alsoSource`), and the part-of-cast check and once-per-situation sentences (`gmNotes`). “Once it does this, the spell ends” becomes a data note.
- **`compileDirectEffectResolution`** passes `temporaryImmunity`, `castCondition` and `alsoSource` on.
- **`effect-runtime.js`:**
  - It refuses recipients holding the spell's immunity marker (`flags.spellImmunity.key`).
  - It creates the marker at the cast (`createSpellImmunity`), or flags the Effect `immunityOnUse`. The `deleteItem` hook `immunityOnEffectUsed` then creates the marker when the Effect is removed unexpired, except on rollback, replacement or cast end.
  - It applies `castCondition` to each recipient other than the caster, and adds the caster for `alsoSource`.
- **Unit-test mutations:** the proof still doesn't catch an added bonus or penalty sentence (batch 132), so those tests use added damage.

See [verification](verification/phase-cantrip-rank-1-batch-133.md).

### Cantrip / rank 1 batch 134 — Sure Strike, Unimpeded Stride, Scholarly Recollection

- **`statedApplication`:** three more forms: the next attack, the movement sentence, and the triggering check.
- **The completeness proof:**
  - It claims “You are then temporarily immune …” (immunity at the cast), the circumstance/flat-check sentence (when an AdjustModifier suppresses circumstance attack penalties), and the escape/Stride pair; each is a GM note.
  - It claims a reaction's Trigger line when every action it names is `action:<slug>` in the Effect's rules.
  - It adds a data note when RollTwice isn't removed after the attack.

See [verification](verification/phase-cantrip-rank-1-batch-134.md).

### Cantrip / rank 1 batch 135 — Magic Stone, Object Memory, Untamed Form, Muscle Barrier

- **`statedApplication`:** four forms: the carrier, the touched weapon, the polymorph and the flung thrall. A form naming the caster isn't refused for an object Target.
- **Target predicates:** “N non-magical stones or sling bullets” (carried by you or an ally), “1 weapon or tool”, and “1 of your thralls” with the flung sentence.
- **The completeness proof:** GM notes for the per-action stones, single use, the tool branch and long activities.
- **`compile-ability.js`:** a stated-polymorph “varies” duration becomes the Effect's, with a data note.

See [verification](verification/phase-cantrip-rank-1-batch-135.md).

### Cantrip / rank 1 batch 136 — Metal Merged, Nymph's Token, Traveling Workshop; free-action Dismiss

- **`statedApplication`:** three forms: the welded weapon, the token holder and the trained skills. The completeness proof claims their sentences as GM notes (each checked against the Effect's rules), plus a compiled termination's Dismiss sentence.
- **`effect-termination-compiler.js`:**
  - Link labels replace `@UUID` before the Dismiss sentence is found.
  - A free-action Dismiss gets a trigger only when its sentence states one (“when”, “whenever”, “after”, “if”, or “takes X damage”).
- **`validate-plan.js`:** accepts an untriggered free-action Dismiss whose sentence ends “Dismiss the spell as a free action.”
- **`effect-runtime.js`:** the Dismiss confirmation says “a free action”.
- **Target predicates:** “1 metal weapon you are wielding” is an object (the caster holds the Effect).
- **Process note:** the first b219 compile had Nymph's Token “unsafe” (the validator's free-action rule). The census counts the Effect route whatever its level, so 635 didn't change. The batch was re-run on the fixed code.

See [verification](verification/phase-cantrip-rank-1-batch-136.md).

### Cantrip / rank 1 batch 137 — Figment, Light, Read Aura, Fishing Spot

- **`statedApplication`:** four forms. A stated form also skips the “area or aura” veto (the word “aura” in Read Aura isn't an area).
- **The completeness proof:** claims each spell's remaining sentences as GM notes, only when the Effect's rules match. For Fishing Spot it builds `rolledChoice {formula, ruleIndex, values}` when the ChoiceSet's values appear in the text in order and match the die's faces.
- **`effect-runtime.js`:** rolls `rolledChoice` once per cast (posted to chat) and sets the ChoiceSet rule's `selection` in `#createEffect`.
- **Tests:** the batch-12 Effect + note example is now Animate Rope.

See [verification](verification/phase-cantrip-rank-1-batch-137.md).

### Cantrip / rank 1 batch 138 — Illusory Disguise, Swear Oath, Forbidding Ward

- **`statedApplication`:** the oath toggle, and the ward ally with `markTarget: "enemy"`.
- **The completeness proof:** claims the disguise and oath sentences. The disguise needs PF2e's two Impersonate modifiers with the stated value, and Figment and Read Aura now compare values too.
- **`effect-runtime.js`:** for `markTarget: "enemy"`, the targets are split by the caster's alliance (exactly 1 ally and 1 enemy). The Effect goes on the ally, and `#createEffect` sets each TokenMark rule's `uuid` to the enemy token.
- **Tests:** a terrain test no longer lists Illusory Disguise as blocked.

See [verification](verification/phase-cantrip-rank-1-batch-138.md).

### Cantrip / rank 1 batch 139 — Glimpse Weakness, Uplifting Overture (user decisions)

- **`spell-mark.js`:** `compileStrikeMark` and `strikeMarkRules` are new; the weakness is custom, with `definition [{or: [item:type:weapon, item:type:melee]}]`. `removeSpellMarkWeakness` also deletes `spellMark.strikeEnds` Effects on Strike damage.
- **New kind `aid-prepare`** (`aid-prepare.js`, `#executeAidPrepare`): it rolls the caster's skill with `dc 15` and `action:aid`, then creates a `removeAfterRoll` circumstance modifier on the ally.
- **Ordering:** both compile *before* the Effect + note route, whose linked PF2e Effect they set aside (a data note).
- **Tests:** the batch-12 and batch-13 Effect + note examples are now Spirit Ward and Practice Makes Perfect.

See [verification](verification/phase-cantrip-rank-1-batch-139.md).

### Cantrip / rank 1 batch 140 — Pyroclastic Truth (user decision)

- **`extractImpossibleBurst`** (new `src/compiler/impossible-spell.js`), used at the top of `compileSpell`: the cast is a rewritten basic save, and `resolution.impossibleBurst` holds `{mark, fuel, lethologic}`. The Fuel sentence may name any spell, so the route doesn't depend on the item's name (a rule-family check renames a copy).
- **New `scripts/impossible-runtime.js`:**
  - `startImpossibleMarks`, called from the basic save's finalize: it marks each target with `hpAfter < hpBefore` in one native Ongoing record, and adds the caster's `flags.lethologic` Effect once.
  - `fuelImpossible`, the Ongoing action `fuel` behind the “Fuel … (N marked)” control: `DamageRoll((rank)d12[persistent,fire])` for each marked creature.
  - `lethologicOnDamage`, a `createChatMessage` hook on `damage-taken`: Frightened, and Dying at its maximum.
- **The pipeline script** now prints FAILED for a rule-family or escape check that prints no result, as the speed check already does.

See [verification](verification/phase-cantrip-rank-1-batch-140.md).

### Cantrip / rank 1 batch 141 — Manifest Will (user decision)

- **New kind `aura-turn-effect`** (`src/compiler/aura-turn-effect.js`): the Aura and Spell Effect pair is proved rule by rule for each tradition. It compiles before the Effect + note route.
- **Runtime:**
  - `effect-runtime.js` applies PF2e's Aura to the caster and calls `ongoing.startTurnEffectAura`.
  - `ongoing-families.js`: `startTurnEffectAura` starts a lingering record centred on the caster, with `events: ["turn-start"]`, `turnEffect` and `includeCaster`.
  - Turn-start exposures go through the hazard path to `applyTurnEffect`. It checks eligibility (living or undead, allies), presets the ChoiceSet, adds the Escape `outcomeEffect` for primal, and creates the Cover Effect with lesser selected in place of PF2e's GrantItem.
- **Live-test notes:**
  - The pftest scene has about 150 older suites' tokens clustered around (1000, 1000) and (1400, 800), so the case uses the clear corner near (2200, 1100). Moves outside the 1800×1200 scene fail silently.
  - PF2e's 1-round Effects expire at the caster's next turn, so the case reads them before it.

See [verification](verification/phase-cantrip-rank-1-batch-141.md).

### Cantrip / rank 1 batch 142 — Practice Makes Perfect

- **New kind `check-bonus`** (`src/compiler/check-bonus-reaction.js`): the trigger, bonus and outcome sentences are proved, and it compiles before the Effect + note route. `checkDegree` and `regradeCheck` do the grading.
- **Runtime:** `effect-runtime.js` `#executeCheckBonus` finds the target's latest `skill-check` message (or `options.messageId`), refuses a check that didn't fail or an untrained skill, adds the bonus minus any existing bonus of that type, and posts the re-graded result with a GM reminder. NPC skills have no rank on the sheet, so the base bonus applies and the card says so.

See [verification](verification/phase-cantrip-rank-1-batch-142.md).

### Cantrip / rank 1 batch 143 — Inside Ropes

- **New kind `climb-aid`** (`src/compiler/climb-aid.js`): the rope, fall check, others and ends sentences are proved, and the Heightened bonus is checked against the linked Effect's rule. `climbAidRules` builds the Effect's rules for a cast rank.
- **Runtime:**
  - `effect-runtime.js` `#executeClimbAid` creates the Effect on the caster (flag `climbAid.fallCheckDC`).
  - `scripts/climb-aid-runtime.js` `climbAidOnCheck` runs on `createChatMessage`. On a `skill-check` with `action:climb` and outcome `criticalFailure` by a bearer, the active GM rolls 1d20 against the DC and posts the result.
- **Live-test note:** PF2e lists a predicated modifier on every Athletics roll, disabled when the predicate fails. The case counts only enabled modifiers.

See [verification](verification/phase-cantrip-rank-1-batch-143.md).

### Cantrip / rank 1 batch 144 — Flashy Disappearance

- **New kind `stride-hide`** (`src/compiler/stride-hide.js`): the six sentences are proved in order, and PF2e's Effect is checked (the Invisible grant plus the stated bonus predicated on `action:hide`). `hideResults` grades each observer.
- **Runtime:**
  - `effect-runtime.js` `#executeStrideHide` applies PF2e's Effect through `#createEffect` (flag `strideHide`) and posts the card with the receipt actions `stride-hide` and `stride-no-cover`.
  - The public `strideHide(effect, {noCover})` rolls `skills.stealth` with `action:hide`, gathers the observers (combatants when in combat on the scene, otherwise scene tokens; non-allied, with a Perception DC), deletes the Effect, and adds Hidden when every observer's DC is met.
- **Live-test note:** out of combat, the pftest scene's leftover tokens are all observers. The case therefore runs the Hide in a combat with only the caster and the foe.

See [verification](verification/phase-cantrip-rank-1-batch-144.md).

### Cantrip / rank 1 batch 145 — Eat Fire

- **New kind `cloud-action`** (`src/compiler/cloud-action.js`): the trigger, resistance, action, ending, cloud and Heightened sentences are proved, and PF2e's Resistance rule is matched to the text and step.
- **Runtime:**
  - `effect-runtime.js` `#executeCloudAction` applies PF2e's Effect (flag `cloudAction`) and posts the card with the receipt action `cloud-action`.
  - The public `cloudAction(effect, {region})` places the burst: it clones the spell with the burst as its area for PF2e's `placeTemplate`, or takes a given region. It checks the range from the caster's token, calls `ongoing.startCloud`, and deletes the Effect.
  - `ongoing-families.js` `startCloud` is a placed lingering record with `concealment: true`, no exposure events, and a maximum duration. `syncLingeringConcealment` gives the Concealed Effect to creatures inside.
  - `climb-aid-runtime.js` `cloudActionOnCondition` runs on `createItem`: a condition matching the Effect's `endsOnCondition` deletes it.
  - The API gains `spellActions.cloudAction` and `spellActions.strideHide`.

See [verification](verification/phase-cantrip-rank-1-batch-145.md).

### Cantrip / rank 1 batch 146 — Protect Companion

- **New kind `granted-block`** (`src/compiler/granted-block.js`):
  - The target, duration, AC and reaction sentences and the Heightened step are proved.
  - `readBlockReaction` checks PF2e's action text at cast time.
  - `blockTiers` lists the reaction's tiers for a cast rank.
- **Runtime:**
  - `effect-runtime.js` `#executeGrantedBlock` refuses under a `castLockout` Effect and checks the target's traits. It applies PF2e's Effect with the `grantedBlock` flag (tiers, lockout).
  - `grantedBlockOffer` runs from `main.js`'s `updateActor` hook when PF2e passes `damageTaken`. The active GM whispers the reaction card to the GM and the caster's owners.
  - `grantedBlock(effect, {tier, damage})` restores min(reduction, damage) Hit Points, lowers the caster's Hit Points, deletes the Effect, and creates the lockout Effect.
  - The API gains `spellActions.grantedBlock`.
- **Live-test note:** deleting the Effect runs the module's termination handling, which takes about a second. The case waits for the lockout before recasting.

See [verification](verification/phase-cantrip-rank-1-batch-146.md).

### Cantrip / rank 1 batch 147 — Spirit Ward

- **New kind `action-mode-effect`** (`src/compiler/action-mode-effect.js`): the bonus sentence, the "number of actions" sentence and the three mode paragraphs are proved, and PF2e's three rules are checked.
- **Runtime:**
  - `effect-runtime.js` `#executeActionModeEffect` picks recipients by mode: touch reach, range, or the caster plus `isAllyOf` allies within the emanation. It creates PF2e's Effect with `rolledSelection` set to the count (as a string: PF2e's `actionsNumber` keys).
  - All the Effects are attached to one native Ongoing record with `sustained: true`, so `reconcileSustainedNative` adds the Sustain obligations and a missed Sustain ends the cast.
- **Test:** batch-12's Effect + note example is now a Spirit Ward with a changed mode.
- **Live-test note:** the pftest caster is `party`, so the case sets the allies to the caster's alliance. The ChoiceSet renames the Effect ("… (Two)").

See [verification](verification/phase-cantrip-rank-1-batch-147.md).

### Cantrip / rank 1 batch 148 — Animate Rope

- **New kind `command-list`** (`src/compiler/command-list.js`): the command counts, the list, the attack command and PF2e's Effect are proved. `commandAttackPenalty` maps a degree to the Effect's choice.
- **Runtime:**
  - `effect-runtime.js` `#executeCommandList` creates the marker Effect and a native sustained record with `commands: {available, perSustain, list}`.
  - `commandListCommand` runs through `ongoing.request("command", {castId, command, targetUuid, attackNumber, skipDialog})` on the coordinator's queue. It spends a command. The attack rolls `spell.spellcasting.statistic.check.roll` against the target's save DC, then creates PF2e's Effect with `rolledSelection` and the `outcomeEffect.escape` flag, attached to the record.
  - `ongoing-families.js`'s native Sustain adds `perSustain` once per round.
  - `ongoing-runtime.js` adds two controls: the attack (at the user's target), and another command (a dialog).
- **Test:** batch-12's Effect + note example is now an Animate Rope with a changed command.

See [verification](verification/phase-cantrip-rank-1-batch-148.md).

### Cantrip / rank 1 batch 149 — Contagious Idea, and per-row save immunity

- **New kind `thought-choice`** (`src/compiler/thought-choice.js`): `extractThoughtChoice` proves the lead, the pleasant item (with PF2e's TempHP Effect) and the terrifying item.
  - `compileSpell` compiles the terrifying branch as its own item (a non-basic save, "1 creature"). It must be a save with no pending parts, and it's stored as `thoughtChoice.savePlan`.
  - `checkThoughtTargets` holds the targeting rule.
- **Runtime:** `effect-runtime.js` `#executeThoughtChoice` checks the targets and asks for the thought (or takes `thought`). Pleasant creates PF2e's Effect on each target. Terrifying calls `api.saves.start` with the stored save plan.
- **Save route (general):**
  - `compile-ability.js` adds `ROW_THEN_IMMUNE` and `rowImmunity`. The row-immunity block now collects every degree row naming immunity, with one duration, into `temporaryImmunity.degrees`.
  - `hasUnscopedConditionDuration` skips a row's own immunity clause.
  - The b232 diff also shows Feast of Ashes, Shadow Zombie, Cup of Dust, Subjugate Undead and Burning Blossoms. Each lost only its `manual:temporary-immunity` pending item (its critical-success "unaffected and is temporarily immune" row). They stay on the same route and are still pending for other reasons.

See [verification](verification/phase-cantrip-rank-1-batch-149.md).

### Cantrip / rank 1 batch 150 — Frenzied Revelry

- **New kind `ally-aura`** (`src/compiler/ally-aura.js`):
  - The sentences and Heightened steps are proved.
  - `bonusAt` evaluates PF2e's `ternary(gte(@item.level,N),A,…)`, and `allyAuraStep` gives the radius and bonus for a rank.
  - The critical Effect is PF2e's "(Critical)" Effect by name.
- **Runtime:**
  - `effect-runtime.js` calls `ongoing.startAllyAura`.
  - `ongoing-families.js` `startAllyAura` creates a lingering record, centred on the caster, with `memberEffect.allies`. `syncMemberEffect` now handles allies (the caster plus `isAllyOf` members), and the reconcile's `clearLeaveArea` keeps the caster.
  - `memberCriticalSave` runs on `createChatMessage`: a holder's critical-success `saving-throw` with the trait option and an enemy origin gets PF2e's critical Effect, whose rule is checked, for its rounds.

See [verification](verification/phase-cantrip-rank-1-batch-150.md).

### Cantrip / rank 1 batch 151 — text over PF2e data (Contagious Idea, Eat Fire, Spirit Ward, Frenzied Revelry)

User decision: these four follow the text, not PF2e's mismatched rules.
- **`ruleOverrides`** (`scripts/native-outcome-effects.js` `prepareNativeEffectSource`): `{index, key, patch}` or `{index, key, remove}`, removals applied from the highest index. It throws if the rule at that index isn't the named key. Every path that creates a native Effect (`#createEffect`, `syncMemberEffect`) passes through it.
  - **Contagious Idea:** `thoughtTempHP` (5, +1 per rank above the base; the base is 1 for a cantrip, because the pftest fixture stores the cantrip at its heightened level).
  - **Spirit Ward:** the predicate becomes `[{or: [origin:trait:haunt, origin:trait:spirit]}]`.
  - **Frenzied Revelry:** the selector becomes `saving-throw`.
- **Turn-bound Effects** (`climb-aid-runtime.js`):
  - `expireTurnBound` runs on `updateCombat` (turn or round), `deleteCombat` and `updateWorldTime`. It deletes the module's Effects flagged `turnBound`: `{combatId, round, turn}` in combat, or `{worldTime}` outside.
  - `turnBoundEnded` decides when they're over.
  - PF2e sets a new Effect's start initiative to its owner's own, so a reaction's "current turn" can't use PF2e's `turn-end` expiry.
  - Eat Fire uses this for its resistance Effect.
- **Eat Fire:** the Belch Smoke action deletes every Effect of the cast.

See [verification](verification/phase-cantrip-rank-1-batch-151.md).

### Cantrip / rank 1 batch 152 — Effects used once, and a duration override (text over PF2e data)

- **Compiler:** `direct-effect-resolution-compiler.js` now returns `consumeOn`, `ruleOverrides` and `durationOverride` in place of the data notes for:
  - next-attack RollTwice;
  - a once-used RollTwice;
  - the next Strike with a chosen weapon;
  - the next hit's dice;
  - a dismiss toggle (its DamageDice becomes persistent);
  - "until the start of your next turn" against PF2e's `turn-end`.
- **Runtime:**
  - The generic Effect route passes these fields to `#createEffect`. The `consumeOn` data is stored in `flags.<module>.runtime.consumeOn`, and `prepareNativeEffectSource` applies `durationOverride`.
  - `climb-aid-runtime.js` adds `rollConsumes` and `consumeUsedEffects` (on `createChatMessage`). The weapon is matched through the Effect's `rulesSelections[weaponFlag]` and the roll's `item:id:` option.
  - After 750 ms it removes only what's left, because PF2e removes Sure Strike itself after the roll (the module's deletion had raced it: "Item … does not exist").
- **Live-test notes:**
  - The pftest user has PF2e's "always show dialog" on, so the case rolls the check dialog.
  - Serrate and Precious Gleam target the wielder.

See [verification](verification/phase-cantrip-rank-1-batch-152.md).

### Cantrip / rank 1 batch 153 — value, type, attribute and next-turn corrections

- **Reinforce Eidolon:** `direct-effect-resolution-compiler.js` produces a Resistance `ruleOverrides` (`max(N,floor(@item.level/2))`) in place of the `resistanceMismatch` note.
- **Sting of the Sea:** a `row-modifier-effect` with a `typeNote` now carries `outcomeRule.ruleOverrides` (type `untyped`). `prepareNativeOutcomeEffectSource` passes a row's overrides on.
- **Swampcall:** a `degree-speed-condition` with `leaveArea` gets `durationOverride` (2 rounds, `turn-end`) and `endsAfterTargetTurn`. The source flag is `turnBound: {combatId, actorUuid, startedAt, seen}`.
  - `expireTurnBound` marks `seen` once that creature's later turn begins.
  - `turnBoundEnded` ends the Effect when the turn moves off it.
  - Outside combat it's `{worldTime}`.
- **Hand of the Apprentice:** `weaponThrow.abilityFromSpellcasting`. `#executeWeaponThrow` sets the ability FlatModifier to `spell.spellcasting.attribute`.

See [verification](verification/phase-cantrip-rank-1-batch-153.md).

### Cantrip / rank 1 batch 154 — rank-gated choices, a shape's time and a first-Strike toggle

- **Compiler:**
  - `rankGatedChoices` (from `{gte: [parent:level, N]}` ChoiceSets and "Heightened (Nth) You can choose up to two/three effects").
  - `shapeDuration` (`compile-ability.js`: the named spell and its minutes).
  - `autoToggle` (the stated-first-Strike recipient form).
- **Runtime:**
  - The generic route turns `rankGatedChoices` into `ruleOverrides` for the cast rank (remove, or patch the predicate).
  - `applyTextCorrections` (`climb-aid-runtime.js`) runs after each created Effect. It switches the toggle on, and extends the Effect and its granted form when the selected form's name matches the spell.
  - `autoToggleOnDamage` (`createChatMessage`) uses `toggleUsed`: a weapon, not unarmed, with the toggle on.
  - `autoToggleNewRound` runs on a round change, and outside combat on world time (6 seconds).

See [verification](verification/phase-cantrip-rank-1-batch-154.md).

### Cantrip / rank 1 batch 155 — scope corrections (Pact Broker, Savor the Sting)

- **Pact Broker:** `compile-ability.js` marks the "against you and your allies" penalty rows with `outcomeRule.againstCasterSide: {ruleIndex}`. `prepareNativeOutcomeEffectSource` sets that FlatModifier's predicate to `[{or: target:signature:<caster and allies on the scene>}]`, found through `isAllyOf`. PF2e puts `target:signature:<id>` on attack and damage rolls.
- **Savor the Sting:** `casterMark.endsWithTargetPersistent` is carried into the mark Effect's runtime flag (with `markedTokenUuid`). `endMarksWithoutPersistent` runs on `deleteItem` for `persistent-damage` conditions and removes marks whose target has none of that type left (`hasPersistentOf`).

See [verification](verification/phase-cantrip-rank-1-batch-155.md).

### Cantrip / rank 1 batch 156 — six scope corrections

- **Compiler:**
  - Murmuration: `outcomeRule.ruleOverrides` (the hostile predicate).
  - Curse of Recoil: `outcomeRule.lockToFirstItem`.
  - Healer's Blessing: `oncePerSource`, the recipient form.
  - Song of the Soul: `nearToken: {trait: "thrall", feet, ruleIndex}`.
  - Crushing Ground: `outcomeRule.escapeEndsOnly`.
  - Hippocampus Retreat: `casterEffect.endsAfterMovement`.
- **Runtime:**
  - `native-outcome-effects.js` sets the `lockToFirstItem` flag and `escape.endsOnly`.
  - `escape-termination.js` `endGrantedCondition` removes the condition's GrantItem and the granted item, and drops `outcomeEffect.escape` (`-=escape`).
  - `climb-aid-runtime.js` hooks:
    - `lockToFirstItem`: on an attack roll, the modifier is matched by `modifierLabel`, because PF2e strips "Spell Effect: " and "(Degree)" from labels.
    - `oncePerSourceOnHealing` / `oncePerSourceOnCast`: on a healing `damage-taken` message, keyed by the spell's `item:id`.
    - `nearTokenFor` (at cast) and `syncNearTokens` (on `updateToken`/`deleteToken`): the rule's predicate becomes `pf2e-automatic-resolution:out-of-range` while far.
    - `endAfterMovement`: on `updateToken`.
- **Live-test notes:**
  - PF2e's `applyDamage` heals with a negative number, not a healing roll.
  - PF2e's modifier labels drop the Effect's prefix and degree suffix.

See [verification](verification/phase-cantrip-rank-1-batch-156.md).

### Cantrip / rank 1 batch 157 — note-only families; terrain areas

- **`src/compiler/note-families.js`:** an ordered list of compilers for spells that would otherwise be note-only. `compile-ability.js` computes `noteFamily` before `compileSpellNote` (which it then skips), and one resolution branch sets `resolution.kind` and `resolution[key]`.
- **New kind `terrain-area`** (`src/compiler/terrain-area.js`, with `terrainAt`).
  - `effect-runtime.js` `#executeTerrainArea` takes the actions (a dialog or `actions`), places the burst (a spell clone's `placeTemplate`, or `options.region`) and calls `ongoing.startTerrainArea`.
  - `ongoing-families.js` `startTerrainArea` creates a lingering record with a `modifyMovementCost` behaviour (walk, plus fly from the Heightened rank). A 1-round area has `endsAt: "caster-turn-start"`. Removing the region ends the area.
- **Live-test note:** Foundry fills the behaviour's other movement types; crawl follows walk.

See [verification](verification/phase-cantrip-rank-1-batch-157.md).

### Cantrip / rank 1 batch 158 — stated check bonuses

- **Family `bonus-effect`** (`src/compiler/bonus-effect.js`, with `bonusValueAt`) is registered in `note-families.js`.
- **Runtime:** `effect-runtime.js` `#executeBonusEffect` creates one module Effect per duration group. The single-check group carries `runtime.consumeOn: {on: "skill-check", option: "action:track"}`, and `rollConsumes` now honours `option` for skill checks.
- **Test:** batch-14 asserts the new route for Fashionista and Groom Companion.

See [verification](verification/phase-cantrip-rank-1-batch-158.md).

### Cantrip / rank 1 batch 159 — roll families

- **`src/compiler/roll-families.js`:** `substitute-roll`, `secret-flat-check`, `repeat-check` and `retro-bonus`, registered in `note-families.js`.
- **Runtime (`effect-runtime.js`):**
  - `#executeSubstituteRoll`: SubstituteRoll rules with `predicate: [{not: "secret"}]` and `consumeOn: {on: "substituted-check"}`. `turnBound` is keyed to the caster.
  - `#executeSecretFlatCheck`: a blind roll whispered to the GM, then `createSpellImmunity`.
  - `#executeRepeatCheck`: the trigger is found by `action:recall-knowledge` and range; the roll uses the caster's statistic with the same DC.
  - `#executeRetroBonus`: a watcher Effect.
- **Hooks:**
  - `retroBonusOnRoll` (`climb-aid-runtime.js`, on `createChatMessage`) uses `regradeCheck`.
  - `rollConsumes` gains `substituted-check`: a save or skill check with no dice. PF2e's own `removeAfterRoll` doesn't remove a substitution Effect.
- **Live-test notes:**
  - The case ticks PF2e's `.substitutions input[data-sub-index]` in the check dialog.
  - NPC skills have no rank.

See [verification](verification/phase-cantrip-rank-1-batch-159.md).

### Cantrip / rank 1 batch 160 — damage reactions

- **`src/compiler/damage-reactions.js`:** `redirect-damage`, `delayed-damage` and `interposing-cover`, with `redirectAt`.
- **Runtime:**
  - `main.js` `updateActor` records `options.damageTaken` (`recordDamage` / `lastDamageOf`); `options.damage` overrides it.
  - `#executeRedirectDamage` restores the ally's HP and applies `applyDamage({damage, skipIWR: true})` to the caster.
  - `#executeDelayedDamage` restores HP and creates the `delayedDamage` Effect with `turnBound.untilStartOf` (the caster). `delayedDamageOnEnd` (`deleteItem`) deals the damage.
  - `#executeInterposingCover` creates the cover and Resistance Effect with `consumeOn: {on: "damage-taken"}` (`consumeOnDamageTaken`), turn-bound to the current turn.
- **Live-test note:** PF2e applies resistance only to typed damage; a bare number isn't reduced.
- **Test:** batch-59's note-route test is updated for Delay Consequence (the earlier note decision is superseded by the request to work on the note-only spells).

See [verification](verification/phase-cantrip-rank-1-batch-160.md).

### Cantrip / rank 1 batch 161 — Strike spells

- **`src/compiler/spell-strike.js`:** the five forms, plus `weaponQualifies`.
- **Runtime:**
  - `#executeSpellStrike` filters `actor.system.actions` by range and requirement, then `game.pf2e.actions.raiseAShield` for Shielding Strike.
  - The card buttons (`data-runtime-action="spell-strike"`) are handled in `handleReceiptAction` before its Effect lookup. `spellStrikeRoll` rolls `variants[n]`.

See [verification](verification/phase-cantrip-rank-1-batch-161.md).

### Cantrip / rank 1 batch 162 — action families

- **`src/compiler/action-families.js`:** `sustain-other`, `pull-toward` (with `pullPath`), `prompt-escape` and `spell-shield` (with `spellShieldHardness`).
- **Runtime:**
  - `#executeSustainOther` calls `ongoing.request("sustain")`.
  - `#executePullToward` moves the token with `teleport: true` (a plain x/y update doesn't stick on v14).
  - `#executePromptEscape` calls `game.pf2e.actions.escape`.
  - `#executeSpellShield` creates the Effect and a native sustained record with `spellShield`. `ensureSpellShield` recreates the shield if needed, clears a stale Raise a Shield Effect, and retries `raiseAShield` until PF2e reports it raised.
  - The native Sustain branch in `ongoing-families.js` calls `ensureSpellShield`. `temporary-shield-runtime.js` gains `keepOnDestroyed`: a destroyed shield goes without ending the spell.
- **Tests:** batches 15 and 16 are updated for Liberating Command and Bone Shield.

See [verification](verification/phase-cantrip-rank-1-batch-162.md).

### Cantrip / rank 1 batch 163 — check helpers

- **`src/compiler/check-helpers.js`:** `spellshape-duration`, `shared-save-better`, `save-replacement` and `perception-against-dc`, plus `LEVEL_DC` / `levelDC` (the GM Core table; PF2e exposes none).
- **Runtime:**
  - `#executeSpellshapeDuration` sets the caster's `spellshapePending` flag, with an id. `spellshapeOnEffect` runs on `createItem`: it updates the next matching Effects' duration, refunds a Focus Point, and clears only its own pending entry after 3 s (a newer one stays).
  - `#executeSharedSaveBetter` creates an AdjustDegreeOfSuccess Effect; `rollConsumes` `saving-throw` now honours `option`.
  - `#executeSaveReplacement` compares with `checkDegree`.
  - `#executePerceptionAgainstDC` uses `createSpellImmunity` and a toggle plus FlatModifier Effect.
- **Found live:** the first Extend Boost's delayed cleanup cleared the second one's pending duration, which is why the cleanup is now keyed by id.

See [verification](verification/phase-cantrip-rank-1-batch-163.md).

### Cantrip / rank 1 batch 164 — rule Effects

- **`src/compiler/rule-effects.js`:** `marching-song`, `shared-lore` (with `sharedLoreAt`) and `unarmed-reach`.
- **Runtime:**
  - `effect-runtime.js` adds a `#ruleEffect` helper.
  - `#executeMarchingSong`: a FlatModifier on `initiative`; the caster gets a toggle plus ActiveEffectLike override of `system.initiative.statistic`; then `createSpellImmunity`.
  - `#executeSharedLore`: Lore items flagged `sharedLoreCast`. `sharedLoreOnEnd` (`deleteItem`) removes them.
  - `#executeUnarmedReach`: AdjustStrike `weapon-traits` `reach` on `item:category:unarmed`.
- **Live-test notes:**
  - The lab scene's older tokens are all within 60 feet of anywhere, so the Song of Marching part runs on a temporary scene that is deleted afterwards.
  - PF2e stores rule selectors as arrays.
- **Test:** batch-8's note-helper test uses a reworded Share Lore.

See [verification](verification/phase-cantrip-rank-1-batch-164.md).

### Cantrip / rank 1 batch 165 — attack wards

- **`src/compiler/ward-families.js`:** `attack-ward` and `strike-absorber` (with `absorberHp` and `isStrikeDamage`).
- **Runtime:**
  - `#executeAttackWard` puts the ward Effect (flag `attackWard`: save, DC, `passes`, `wasted`, `barred`) on the target. `attackWardOnAttack` (`createChatMessage`) rolls the attacker's save on an attack roll against a warded token and records the row; an attack roll by the warded creature ends the ward.
  - `#executeStrikeAbsorber` starts an Ongoing record (`startAbsorber`) on the placed square. `absorberOnDamage` (`updateActor`, using `lastDamageOf` and `isStrikeDamage`) restores an adjacent ally's lost Hit Points from the tree's remainder and ends the record at 0.
- **Tests:** batch-8 (a reworded Sanctuary) and batch-16 (Protector Tree is now `strike-absorber`) are updated.

See [verification](verification/phase-cantrip-rank-1-batch-165.md).

### Cantrip / rank 1 batch 166 — summons

- **`src/compiler/summon-families.js`:** `summon` (with `SUMMON_LEVELS`, `summonMaxLevel` and `summonEligible`). It covers the standard summon wording at any rank, Summon Lesser Servitor's list and Phantasmal Minion's named creature.
- **Runtime:**
  - `#executeSummon` lists eligible compendium creatures (`summonCandidates`, from each Actor pack's index), or takes `options.summonUuid` / `summonTraits`.
  - It imports the creature: adds the summoned and minion traits, copies the caster's ownership and sets `system.details.alliance` to the caster's. PF2e sets a token's disposition from the alliance, so without this a bestiary creature came out hostile.
  - It places the token in the first free space ring by ring (`freeSpaceNear`) and puts a sustained Effect on the caster, flagged `summon`.
  - `summonOnEnd` (`deleteItem`) deletes the token and the imported actor.
- **Test:** batch-8's sustained-note test uses a reworded Summon Animal.

See [verification](verification/phase-cantrip-rank-1-batch-166.md).

### Cantrip / rank 1 batch 167 — rule sets

- **`src/compiler/rule-sets.js`:** `rule-set` (with `ruleSetRules`). Each spell's text becomes `{recipient, seconds, rules, rankRules, toggle, consumeOn, turnOnly, immunity, replacesPrevious, weapon, notes}`.
- **Runtime:**
  - `#executeRuleSet` resolves the recipient (self, a targeted eidolon, or the weapon's wielder) and picks the weapon (`{weaponId}` / `{potency}`). It adds a toggleable RollOption and replaces a previous cast, then applies `turnBound` and `immunityOnUse`.
  - `rollConsumes` gains `check-with-option` and `skill-check` `options` (any of).
  - `immunityOnEffectUsed` honours `onlyWhenUsed`: immune only when the Effect was used up (reason `used`).
- **Live-test notes:**
  - A target's DC against a check (Grapple on Fortitude DC) is a `fortitude-dc` modifier, evaluated with the check's own unprefixed options (`action:grapple`); `origin:` options and the `saving-throw` selector don't reach it.
  - AdjustStrike picks the weapon with `definition` (not `predicate`).
  - NPCs get no Strikes from weapon items.
- **Test:** batch-59's Unfetter Eidolon test now expects the rule set.

See [verification](verification/phase-cantrip-rank-1-batch-167.md).

### Cantrip / rank 1 batch 168 — items

- **`src/compiler/item-families.js`:** `conjured-item` (with `conjuredAt`) and `item-repair` (with `mendable`).
- **Runtime:**
  - `#executeConjuredItem` copies the named compendium item, or a chosen level-0 common weapon from the Item packs' index (`options.weaponUuid`). It sets `equipped.carryType: held` (hands from `usage`) and the rank's runes, flags the item `conjuredFor`, and puts an Effect flagged `conjuredItem` on the caster. `conjuredOnEnd` (`deleteItem`) removes the item.
  - `#executeItemRepair` picks from the owner's physical items that are within the limits, damaged and not destroyed (`options.itemId`), and updates `system.hp.value`.
- **Test:** batch-22's note test now expects Mending's `item-repair`.

See [verification](verification/phase-cantrip-rank-1-batch-168.md).

### Cantrip / rank 1 batch 169 — checks and actions

- **`src/compiler/check-actions.js`:** `hide-reaction`, `aid-attack`, `seek-whistle` and `form-choice`.
- **Runtime:**
  - `#executeHideReaction` uses `#hideObservers` (shared with the Stride-and-Hide observers) and `hideResults`. Its marker is flagged `hiddenTurnEnd` and `turnBound`, and `hiddenTurnEnd` (`deleteItem`, reason `turn-ended`) removes Hidden.
  - `#executeAidAttack` rolls the spellcasting statistic's check against DC 15 (`action:aid`) and uses `aidModifier`. The ally's Effect is a FlatModifier on `attack-roll` predicated on `target:signature`, with a matching `consumeOn`. `rollConsumes`' `attack-roll` now honours an `option`.
  - `#executeSeekWhistle`, plus the `seekWhistle` card action (`handleReceiptAction`).
  - `#executeFormChoice` runs `#execute` on the chosen form spell (from its compendium UUID) with this cast's rank and `castInstanceId` (`options.formUuid`, `options.choiceId`). It then renames the created Effects and sets them to this spell's sustained duration.
- **Live-test notes:**
  - `ctx.setup` already places the caster's token at (1600, 1600), so the case moves it rather than adding a second one.
  - An unowned character's alliance defaults to opposition.
  - `tokenDistance` takes placeables.
- **Test:** batch-21's condition-mention test now expects the automated kinds.

See [verification](verification/phase-cantrip-rank-1-batch-169.md).

### Cantrip / rank 1 batch 170 — saves and areas

- **`src/compiler/area-saves.js`:** `lure-save` (with `lured`), `cover-square` and `save-retry` (with `DEGREE_ORDER`).
- **Runtime:**
  - `#executeLureSave` rolls each eligible token's save in range against `#spellDC`, and failures get a `#ruleEffect`.
  - `#executeCoverSquare` flags the region `coverSquare` (castId, caster, rules). `coverSquareSync` (`updateToken`, `createToken`, `climb-aid-runtime.js`) adds or removes the occupant's cover Effect (`coverFrom`), using `regionHolds` for the centre test. It also pushes a creature not on the caster's side to a random free space around the square. `coverSquareOnEnd` (`deleteItem`) deletes the region and the cover Effects.
  - `#executeSaveRetry` reads the save cards' `basicSaveState` (`saveStatistic`, `traits`, the caster's target with `effectUuids`). It rolls the save against `state.dc`; on a better result it deletes the old Effects, then applies `state.outcomes[degree]`'s native Effects (`prepareNativeOutcomeEffectSource`) and conditions (`prepareConditionGrantSource` for timed ones). The actor flag `saveRetryUsed` keeps it once per cast.
- **Test:** batch-23's bystander-save test now expects `lure-save`.

See [verification](verification/phase-cantrip-rank-1-batch-170.md).

### Cantrip / rank 1 batch 171 — scene features

- **`src/compiler/scene-features.js`:** `shrub-wall` (with `shrubsAt`) and `scene-walls` (with `wallSegments`: a rectangle's or polygon's edges, a line shape's segment, or a plane's long midline).
- **Runtime:**
  - `#executeShrubWall` places the line. From the terrain rank it calls `ongoing.startTerrainArea`; otherwise the caster's Effect (flag `sceneWalls.regionUuid`) removes the line.
  - `#executeSceneWalls` creates `Wall` documents (move NORMAL/NONE, sight NORMAL/NONE, light and sound NONE) and an `AmbientLight`, all flagged `sceneWallCast`. `sceneWallsOnEnd` (`deleteItem`) removes them and the region, and a new cast replaces the last where the spell says so.
  - `#ruleEffect` now writes durations under a minute in rounds.
- **Test:** batch-8's environment-note example is now Helpful Steps.

See [verification](verification/phase-cantrip-rank-1-batch-171.md).

### Empty PF2e choices (2026-09-30)

The Effect route refuses, before applying, a PF2e Effect whose `ChoiceSet` would open with nothing in it:
- **A weapon choice:** `choices.ownedItems` with type `weapon`, when a recipient holds no weapon.
- **A choice gated on the recipient:** every option's predicate tests a `feat:` or `skill:` roll option, and none passes (tested with `game.pf2e.Predicate` against the actor's roll options). In the corpus this is Untamed Shift and Pocket Library.

The message names what's needed. Found by the cantrip/rank 1 smoke test. See [the check](verification/cantrip-rank-1-check-2026-09-30.md).

### Rank 2 batch 3 — degree durations with stated rules

- **`src/compiler/note-effects.js`:** `compileDegreeDurationNotes` also reads:
  - the `UNLIMITED_ROW` row wording, and more row wordings in `DURATION_ROW`;
  - `AFFECTED_CONDITION` and `INVISIBLE_TO_CONCEALED`, which become `GrantItem` of the condition (the second with `self:condition:invisible`);
  - `FAITH_AC_PENALTY`, which becomes a toggle `RollOption` plus the predicated FlatModifier;
  - `TRAIT_SAVE_BONUS`, which becomes a FlatModifier on `saving-throw` predicated `item:trait:…`.
- **`scripts/note-effects.js`:**
  - `validNoteEffect` accepts `duration.mode: "unlimited"`.
  - `validRowNoteRule` accepts those GrantItem, RollOption and toggled-FlatModifier shapes.
  - `prepareNoteEffectSource` writes an unlimited duration and labels FlatModifier and RollOption rules with the spell's name.

See [verification](verification/phase-rank-2-batch-3.md).

### Rank 2 batch 4 — forced movement

- **`src/compiler/action-versions.js`:** `applyActionVersion`, called in `compileAbility` after `adaptSpellSource`. It settles "If you cast the N-action version, you …" for a variant with a fixed action count.
- **`compileRowRules`:**
  - reads the optional move (forced movement with `upTo`, `optional`, `avoid` and `claims`, plus the knocked-Prone condition);
  - reads the pull to the space next to the caster (`toAdjacent`);
  - lets "As failure/success, …" rows inherit the named row's forced movement.
- **`residual-prose.js`:** forced-movement `claims` mark a clause handled. An optional move's clauses explain the caster-subject, choice and Prone signals.
- **`basic-save-core.js`:** the forced-movement check accepts `toAdjacent` pulls and `avoid`.
- **`basic-save-runtime.js`:** `movementNote` words the adjacent pull and the Prone refusal.
- **Target line:** "1 creature or an (und)attended object of N Bulk or less" is a creature (`target-predicate-compiler.js`).

See [verification](verification/phase-rank-2-batch-4.md).

### Rank 2 batch 5 — target lines

- **`target-predicate-compiler.js`:** reads the new target lines (see the verification).
- **`basic-save-core.js`:**
  - accepts and checks `trait` with `present: false`, `not-caster`, `living-or-undead` and `persistent-damage` (PF2e's persistent-damage condition, by `system.persistent.damageType`);
  - GM questions use the existing `gm-confirmed` check.
- **`basic-save-runtime.js`:** records the caster's uuid for `not-caster` as well as `enemy-of-caster`.

See [verification](verification/phase-rank-2-batch-5.md).

### Rank 2 batch 6 — falls a row states

- **`compileRowRules`:**
  - "The target falls N feet through the void before reappearing." on a row with no damage or effects of its own is `floor(N/2)` bludgeoning (`source: "description-falling"`), with `outcome.fallingText` claiming the sentence in `residual-prose.js`;
  - `FALL_RIDER_NOTE` ("Additionally, if this spell causes the target to fall, …") is a `fall-rider` row note beside the row's Prone, and removes that row's conditional-effect instruction.
- **`description-parser.js`:** unlinked "falls prone" followed by "and is/takes …" is Prone.
- **`residual-prose.js`:** a fall rider explains its caster-subject, modifier, movement, damage and save signals.
- **`basic-save-core.js`:** accepts the `fall-rider` row note only with its exact sentence and the row's Prone.

See [verification](verification/phase-rank-2-batch-6.md).

### Rank 2 batch 7 — a floor while the creature bleeds

- **`condition-floor-compiler.js`:** `compileSpellFloors` reads `WHILE_BLEEDING_FLOOR` as a floor with `lifetime: "while-persistent"` and `persistentDamage: "bleed"`, only when the target line requires persistent bleed damage (`persistentTarget`, from `compileAbility`). An "As failure, but the target is Frightened N." critical failure keeps the floor (`inheritedFrom: "failure"`).
- **`basic-save-core.js`:** `isConditionFloor` accepts `while-persistent` with a damage type.
- **`basic-save-runtime.js`:** the floor Effect carries `outcomeEffect.persistentLink`, so `persistent-link-runtime.js` removes it with the creature's last persistent damage of that type.
- **`validate-plan.js`:** accepts batch 5's `trait` (`present: false`), `not-caster`, `living-or-undead` and `persistent-damage` target predicates. Before, plans using them were marked unsafe.

See [verification](verification/phase-rank-2-batch-7.md).

### Rank 2 batch 8 — initial and inline persistent damage by row

- **`persistent-damage-compiler.js`:** `compileInlinePersistentRows` reads one structured initial entry and one inline persistent `@Damage` of the same type in the introduction, with the usual row wordings (`ROW_DAMAGE`), an optional `MOVE_TAIL` and `PERSISTENT_SPEED`. A fixed persistent amount is written as a rank formula from the Heightened entry (`(@item.level - 1)d6`); a self-scaling one must match it.
- **`compile-ability.js`:** `attachInlinePersistentRows`, just before the residual-prose analysis, when no row already deals persistent damage. It sets the rows' damage and the caster's move (`optional`, `casterDirection`). It links PF2e's Spell Effect on the rows that deal persistent damage (`persistent-linked-effect`). On a basic save it records `basicPersistentDamageRider`.
- **`residual-prose.js`:** a clause saying the creature takes persistent damage is claimed only when the row deals persistent damage (`persistentComponentIds`). Before, Combustion's rows were claimed while its persistent fire was never applied. A `casterDirection` move explains the gm-choice kind.
- **`effect-modifier-proof.js`:** `inspectLinkedEffectClaim` reads an `all-speeds` status penalty ("a –10-foot status penalty to its Speeds"). It accepts an encounter duration when every rule is predicated on persistent damage.
- **`native-outcome-effects.js`:** a linked Effect's persistent-damage predicates must name the linked damage type.

See [verification](verification/phase-rank-2-batch-8.md).

### Rank 2 batch 9 — a variant's text over its data; a save after the damage

- **`action-paragraphs.js`:** `textOverride` reads "This spell deals XdY T damage, and its area is a N-foot S." when it disagrees with the variant's data. `selectActionParagraph` returns it as `override`.
- **`compile-ability.js`:** applies the override to the adapted damage entry and area. Before validation it records `sharedDamage.formulaOverrides` (`componentId`, `formula`, `dataFormula`, `sourceText`) and data notes for the damage and the area.
- **`basic-save-core.js`:** `formula-override` accepts one override, for the plan's one PF2e damage entry, on a fixed-action variant only.
- **`basic-save-runtime.js`:** the card state carries `damage.formulaOverrides`. `rollDamage` clones the spell with the text's base formula, then loads the variant at the cast rank (`resolveSpellAtRank(…, {force: true})`), so PF2e's heightening still applies.
- **`semantic-gate.js`:** a bare "Creatures in the area must attempt a basic X save." right after the one damage sentence is that damage's save (`pairedDamage`); its "must attempt" isn't an unread rule.
- **`test/rank-1-batch-2.test.js`:** Disorienting Flash's 3-action variant now expects the text's 2d10 (following the user's text-over-data decision) where it expected a gap.

See [verification](verification/phase-rank-2-batch-9.md).

### Rank 2 batch 10 — whole-row behaviour notes; note-only spells counted resolved

- **`note-effects.js`:** `wholeRowNote` makes one note Effect (`wholeRow`, `claimsRow`) of a row that applies nothing. It requires:
  - only attitude links;
  - no dice, `@Damage`, `@Check` or inline rolls, and none of the `ROW_NOTE_BLOCKERS` words;
  - no guided kinds outside the note kinds, and no unexplained signals other than duration, timing, action and choice.

  The duration is the row's own (`ROW_ENDS`, `ROW_FOR`), the named row's (`ROW_LASTS`, `ROW_EXCEPT`), or the spell's. Its label comes from the note's first sentence.
- **`compile-ability.js` (`addResidualProseAnalysis`):** it's a fallback, tried only when the clause notes still leave the row partly unclaimed. It replaces those clause notes. A row with a whole-row note doesn't also inherit the named row's notes.
- **`tools/report-enabled-spells.mjs`, `tools/build-spell-resolution-status.py`:** note-only non-ritual spells of every rank count as enabled (user decision, 2026-09-30); note-only rituals and Effect + note spells are still apart.

See [verification](verification/phase-rank-2-batch-10.md).

### Rank 2 batch 11 — a flat check rolled on acting, in a behaviour note

- **`note-effects.js`:** `FLAT_ON_ACT` ("must succeed at a @Check[flat|dc:N] to Cast a Spell / to use … / when attempting to … / when casting …", optionally "or the action is lost / disrupted / fails") is allowed in a whole-row note, which is marked `flatCheckOnAct`. `ROW_LASTS` also reads "…, and <more>." Inherited text drops the named row's "For 1 round,".
- **`residual-prose.js`:** a clause claimed by a `flatCheckOnAct` note explains its save and modifier signals.

See [verification](verification/phase-rank-2-batch-11.md).

### Rank 2 batch 12 — a creature stuck to the caster; a caster note that ends with another Effect

- **`src/compiler/stuck-rider.js`** (new): `compileStuckRider` reads the stuck-to-the-caster sentences on a basic save with a fixed duration. It gives the failure rows Off-Guard with an Escape lifetime, and a Stuck note. It makes `resolution.casterNote` of kind `while-target-condition`, whose FlatModifier is predicated on `{or: [item:trait:X, self:action:trait:X]}` (PF2e's spell and action trait options).
- **`basic-save-core.js`:** `isWhileTargetConditionCasterNote` requires the stated penalty, the failing rows' Escape-lifetime condition and the spell's fixed duration.
- **`note-effects.js`:** `validNoteRule` accepts that trait `or` predicate on `all`. A note's description words penalties with a minus sign.
- **`basic-save-runtime.js`:** a `while-target-condition` caster note is made per creature at those degrees and flagged `runtime.endsWithEffectUuid` with that creature's Escape-lifetime Effect. The card says so.
- **`persistent-link-runtime.js`:** `endLinkedEffects` runs on `deleteItem` and deletes module Effects flagged to end with the deleted Effect (lead GM).

See [verification](verification/phase-rank-2-batch-12.md).

### Rank 2 batch 13 — conditions without a check; living creatures in an area; a terrain option

- **`spell-note.js` (`compileConditionNote`):** `GRANTS` also reads "It becomes @C." and "All (affected) targets are @C." (`several`: a Target of up to N creatures).
- **`compile-ability.js`:** `areaLiving` applies on an instantaneous basic save with an area and no Target. It rewrites "Each/All living creature(s) in the area" to the plain subject and adds a `living-creature` target check. `extractTerrainOption` (new `terrain-option.js`) takes out the caster's plants option as a `terrain-option` reminder.
- **`basic-save-core.js`:** accepts the `terrain-option` reminder by its exact sentence (`compilerEvidence.terrainOption`).
- **`semantic-gate.js`:** a "You … in the area." narration isn't an extra rule.

See [verification](verification/phase-rank-2-batch-13.md).

### Rank 2 batch 14 — sustained default, Prone lifetime, then-failure rows, a row's penalty

- **`duration-compiler.js`:** a sustained spell with no listed duration gets `maximum` 10 minutes (`ruleDefault: true`).
- **`basic-save-runtime.js`:** `conditionDuration` gives a Prone without its own duration an unlimited timer, and the group is attached to Ongoing as permanent (it outlives the cast).
- **`compileRowRules`:**
  - clears the "for N rounds" a Prone picked up from "falls Prone and can't use actions or reactions for N rounds";
  - "It then takes the effects of a failure." copies the failure's effects (`thenFailure`, claimed by `thenFailureText`), and the note inheritance treats the row as naming the failure;
  - `ROW_PENALTY` makes a note with its FlatModifier (attack-roll, ac, saving-throw, perception). It removes a PF2e Effect with exactly that modifier (`replacedLinks` claims the link text, plus a data note). It's skipped when the row already has a note.
- **`note-effects.js`:** `ROW_BUT` ("As success/failure, but …") in `wholeRowNote`, which ignores replaced links.

See [verification](verification/phase-rank-2-batch-14.md).

### Rank 2 batch 15 — heightened versions

- **`heightened-duration-compiler.js`:** `FIXED_CHANGE` also reads "The spell lasts (for) N …". `REMAINS_DAILY` reads "The <thing> remains/lasts until … daily preparations" (not "The duration …", which `DAILY_CHANGE` reads).
- **`spell-note.js` (`compileConditionNote`):** "…, rendering it @C." and Invisible's restated rules (`INVISIBLE_RESTATED`).
- **`effect-runtime.js`:** a condition note uses `spellNoteDurationAt` at the cast rank.
- **`compile-ability.js`:** `compileSecondaryTargets` reads the secondary-target Heightened entry into `resolution.secondaryTargets` and takes it out of `rankGateFor`.
- **`basic-save-core.js`:** `isSecondaryTargets`.
- **`basic-save-runtime.js`:**
  - `markSecondaryTargets` runs at `start` from that rank (one primary; up to `max` creatures that pass once the waived predicate is dropped; `secondaryOf` plus a GM confirmation), and finalize doesn't re-refuse them;
  - a secondary target's floor gets `persistentLink.actorUuid` (the primary) and says so.
- **`persistent-link-runtime.js`:** a link may name the creature whose persistent damage it follows. Reconciling that creature also removes other creatures' Effects that follow it.
- **`tools/cantrip-rank-1-smoke.mjs`:** `entries: [{name, rank}]` casts heightened (a level 2r−1 caster) and records each cast's Effects (name, level, duration).

See [verification](verification/phase-rank-2-batch-15.md).

### Rank 2 batch 16 — rank 1 spells heightened

- **`src/compiler/heightened-variants.js`** (new): `compileHeightenedVariants` gives `resolution.heightenedVariants` (`[{minRank, sourceText, outcomes, afflictionHandoff?}]`) for the entry wordings it reads (Sleep's, "they become X instead", the mark's Concealed, virulent affliction values). `rankGateFor` skips entries a variant covers.
- **`basic-save-core.js`:** `heightenedPlanAt(plan, castRank)`; `inspectSavePlan` checks each variant's rows.
- **`basic-save-runtime.js`:**
  - `start` uses `heightenedPlanAt`;
  - `patchHeightenedAffliction` updates Pseudo Afflictions' Effect after the handoff (virulent trait, stage condition values, granted conditions, stage text);
  - `resolveSpellAtRank` loads a spell with fixed-level heightening data even when it's already at the cast rank.
- **`ongoing-families.js`:** a lingering area's exposure plans are the cast rank's.
- **`runtime-utils.js`:** `spellAtCastRank`, used by the Effect, food, note-counteract and lingering routes.
- **`main.js`:**
  - `spellCardContext` compiles from the spell's own data: `unheightenedSource` reverts the fields PF2e's fixed-level heightening changed on the chat card's copy;
  - `bindNoteCounteractButtons`, and `api.noteCounteract`.
- **`spell-note.js`:** `HEIGHTENED_COUNTERACT` entries become `note.heightenedCounteract`, not a rank gate. The note card shows the Counteract button (`noteCounteract` in `effect-runtime.js`).
- **`condition-spell-runtime.js`:** a heightened copy's field that equals PF2e's own fixed-level value at the cast rank isn't a change.
- **`damage-reactions.js` + `effect-runtime.js`:** Interposing Earth's raised Hardness and HP are stated on its 4th-rank barrier.
- **`tools/cantrip-rank-1-smoke.mjs`:** records the save card's damage formula and each target's HP loss.

See [verification](verification/phase-rank-2-batch-16.md).

### Rank 2 batch 17 — action damage, a floor until lifted, a reduction by rank

- **`compile-ability.js`:**
  - `ACTION_DAMAGE` gives a note with `triggeredDamage` (`trigger: "auditory-or-cast"`, the row's `formula`, checked by `SAFE_FORMULA`);
  - `REDUCTION` gives a healing-reduction note per row with `rankAmount`;
  - the floor detection also reads "can't reduce this condition below … until it …".
- **`basic-save-core.js`:** `isTriggeredDamage` accepts the formula form; `isConditionFloor` accepts `until-lifted` (a `liftedBy` and an optional `liftNote`).
- **`stored-trigger-runtime.js` / `ongoing-runtime.js`:** the formula is rolled at the cast rank, with the trigger's wording.
- **`note-effects.js`:** `rankAmount` in `validNoteEffect`; `noteAmountAt`; `{amount}` is replaced when the note is made.
- **`condition-floor-compiler.js`:** `compileUntilLifted` (the failure row and "As failure, but … below X N until it …").
- **`basic-save-runtime.js`:** the `until-lifted` floor's label and note.
- **`description-parser.js`:** `inferDamageMultiplier` reads "takes half / the full <type> damage" anywhere in the row, for the spell's one damage entry.

See [verification](verification/phase-rank-2-batch-17.md).

### Rank 2 batch 18 — behaviour while the row's condition lasts

- **`compileRowRules`:** "While <condition> this way, it …" / "As failure, and it … as long as it is <condition>" gives a note with `whileCondition` (unlimited, `restriction`), only for a condition the row (or the named row) applies. It drops the unlinked "is <condition>" mention the parser read as a grant.
- **`note-effects.js`:** `validNoteEffect` accepts `whileCondition` with an unlimited duration.
- **`basic-save-runtime.js`:** such a note gets `runtime.endsWithEffectUuid` of that condition's Effect, so it ends with it (batch 12's linked-effect runtime).
- **`residual-prose.js`:** a restriction note explains its movement and condition signals.

See [verification](verification/phase-rank-2-batch-18.md).

### Rank 2 batch 19 — a repeated compulsion with an end-of-turn save; introduction rules

- **`compileRowRules`:**
  - the "On its next turn, before it does anything else, the target must …" row is a whole-row note ("can choose to be X" options aren't grants);
  - the repeating critical failure is a rounds note with `recurringSave` (`turn-end`, `reduce`).
- **`note-effects.js`:** `validNoteEffect` accepts `recurringSave` on a rounds note; `prepareNoteEffectSource` puts it in the runtime flags, where the Ongoing record's recurring-save runtime (`recurring-save-recovery.js`) finds it.
- **`residual-prose.js`:** such a note explains its save, duration and timing signals.
- **`compile-ability.js`:** "If the target has no X on its person, the spell fails." adds a `gm-confirmed` target question. "If the target is a willing ally …, they automatically fail the save." is an `auto-failure` reminder (`compilerEvidence.autoFailure`, checked in `basic-save-core.js`).

See [verification](verification/phase-rank-2-batch-19.md).

### Rank 2 batch 20 — a condition gated on the GM's answer; a creature ability as a note

- **`compile-ability.js`:** "If the creature / the target / it is <situation>, it (immediately) becomes <condition link> until …" sets that effect's `gate` to `{kind: "gm-question", question, sourceText}`. "The creature gains <bestiary ability link> for N rounds/minutes." is a note with the link. Note durations count toward a row's scoped durations.
- **`basic-save-core.js`:** the plan check accepts the gate (source shape, no other keys). `gmQuestionGate(state, target)` returns it for a target whose row has one; readiness waits for `target.gateAnswer`; the `gate-yes` / `gate-no` corrections set it.
- **`basic-save-runtime.js`:** the card shows the question with Yes / No buttons; the condition batch drops a gated condition answered no.
- **`residual-prose.js`:** the gated sentence counts as claimed.

See [verification](verification/phase-rank-2-batch-20.md).

### Rank 2 batch 21 — a fly-only cloud, a held item's persistent damage, a death and its reward

- **`lingering-area-compiler.js`:** a "take NdN type damage (as …), with a <save> save" trigger. "… is difficult terrain for flying creatures(, and creatures in the cloud can't …)" gives `terrain.movement: ["fly"]` and a note. The core accepts `["walk"]` or `["fly"]`. The region's GM note has no "end the spell" suffix for "Creatures in the area can't …".
- **`component-damage-compiler.js`:** the two-component proof reads inline persistent damage, a comma-less Heightened line, "the object deals … persistent damage", and "As failure, but" on the critical failure.
- **`degree-adjustment.js`:** the Release sentence is a `gm-confirmed` one-step-better map.
- **`target-predicate-compiler.js`:** "1 living creature that has 0 HP" → `living-creature` + `hp-zero` (checked by `validateActorTarget`).
- **`kill-effect.js` (new):**
  - `compileKillEffect` turns a row's "The target's <condition> value increases by N." into `conditionIncreases`.
  - It moves the linked caster Effect of "If this kills it, you gain …" from the death rows to `resolution.killEffect` (with its temporary HP, bonus and duration).
  - `killEffectMatches` checks the Effect's rules: exactly TempHP and a status FlatModifier to attack and damage, with the duration.
- **`basic-save-core.js`:**
  - `isPrimaryDeath` lets a primary row's automatic death through.
  - `isConditionIncreases` and `isKillEffect` check the new fields.
- **`basic-save-runtime.js`:**
  - The row snapshot carries `terminal` and `conditionIncreases`.
  - Finalize applies the increase with `actor.increaseCondition`, confirms the new value, and kills at the Dying maximum. It applies the row's death, then gives the caster the kill Effect once, re-proved on the live template.
  - Both cards list "Dies", "Dying +1" and the caster's Effect.

See [verification](verification/phase-rank-2-batch-21.md).

### Rank 2 batch 22 — a penalty while persistent, icy terrain, a save on each Sustain

- **`component-damage-compiler.js`:**
  - The inline persistent may end with a comma.
  - The critical failure may be full damage.
  - The Heightened line may add targets first.
  - `fixedLevelsAsInterval` accepts PF2e's fixed levels for a "(+N)" entry when every level is the text's step.
- **`compile-ability.js`:**
  - `componentStrikePenalty` adds a `whilePersistent` note with a `strike-attack-roll` FlatModifier limited by `item:slug:…` to the rows dealing that persistent damage.
  - "You are <Condition N> and the spell ends." gives `casterConditions` and `endsSpell`.
- **`note-effects.js`:**
  - `validNoteEffect` accepts `whilePersistent` on an unlimited note, and `prepareNoteEffectSource` puts it in `runtime.persistentLink`.
  - `validRowNoteRule` accepts the slug-limited Strike penalty.
- **`basic-save-core.js`:**
  - A `whilePersistent` note needs a row dealing that persistent damage.
  - `isCasterConditionEnd` checks the caster's row.
- **`basic-save-runtime.js`:**
  - Notes tied to persistent damage are skipped when none landed.
  - The caster's condition is raised once per cast.
- **`ongoing-families.js`:** a lingering record ends after a result whose row has `endsSpell`. Object notes carry no "end the spell" suffix.
- **`lingering-area-compiler.js`:**
  - `compileTargetSustainSaves` handles "Each time you Sustain this Spell, the target attempts another <save> save.".
  - Basic areas also read `CAST_YOU_DEAL`, `SURFACE_TERRAIN` and `OBJECT_NOTE`.
- **`basic-degree-rider.js`:** a critical-failure rider can read "If a creature in the area critically fails its <save> save (and was standing)", and "falls Prone" may be the Prone link.

See [verification](verification/phase-rank-2-batch-22.md).

### Rank 2 batch 23 — a veil for creatures not immune, a weakness of the caster's level

- **`lingering-area-compiler.js`:** "When a creature that isn't immune to <type> damage …, it must attempt …" sets `notImmune`. "You can Dismiss the <noun>." sets `dismissible`.
- **`compile-ability.js`:**
  - `notImmune` adds a `not-immune-damage` target predicate.
  - `compileSaveDismissal` accepts the spell's own noun.
  - Durations inside a degree-choice Effect's claims are the Effect's.
  - The spiritsense sentence becomes a target-turn note.
- **`basic-save-core.js`:** `validateActorTarget` reads PF2e's immunities for `not-immune-damage`. The lingering check needs the predicate matching `notImmune`.
- **`degree-choice-effect.js`:**
  - Dazzled is a carried condition.
  - A Weakness of `@item.origin.level` (or half) is proved from "equal to (half) your level", with "As failure, but the weakness is equal to your level" inherited.
  - "until the beginning of its next turn" is timed `target-turn`, offset 1.
- **`native-outcome-effects.js`:** for a target-turn, turn-start Effect, the caster-level values are fixed into the rules (rounded down) and the creature becomes the origin. PF2e only expires turn-start Effects on the origin's turn.

See [verification](verification/phase-rank-2-batch-23.md).

### Rank 2 batch 24 — no-save notes and a concealing cloud

- **`spell-note.js`:**
  - `judgeNumbers` skips a conjured creature's statistics (`conjured`, words of the spell's name when the text conjures a creature) and an object target's numbers (`objectTarget`).
  - `SITUATIONAL` adds "to those saving throws" and "Anyone Tracking you".
  - `BASE_COUNTERACT` gives `heightenedCounteract` entries with `base: true` and a `result`. `PASSIVE_COUNTERACT` (another effect's check against the spell DC) is left to the note.
  - Notes parse heightened "The duration is unlimited." (`parseHeightenedDurations(…, {unlimited: true})`), and `spellNoteDurationAt` returns `{mode: "unlimited"}`.
- **`compile-ability.js`:** `spellNoteTextDuration` reads "… or after N units, whichever comes first" for a "see text" duration.
- **`effect-runtime.js`:**
  - The note card labels a base counteract "Counteract". The counteract result states the entry's `result`.
  - `#executeConcealingArea` places the area (or takes `options.region`) and calls `startCloud`.
- **`concealing-area.js` (new family `concealing-area`):** Mist's concealment sentence, with optional narration and Dismiss.
- **`ongoing-families.js`:** `startCloud` takes `dismissible`.

See [verification](verification/phase-rank-2-batch-24.md).

### Rank 2 batch 25 — a confetti cloud, a lament against the caster's foes, darkness

- **`concealing-area.js`:**
  - "the area of the <noun>" with a different outer noun is accepted.
  - The area can be set by the actions spent (`sizes`).
  - The hearing penalty becomes `memberRules`: a RollOption toggle plus a FlatModifier gated by it.
  - `#executeConcealingArea` asks for the actions (or reads `options.actions`) and places the burst at that size. `startCloud(… memberRules)` adds the rules to each creature's in-area Effect.
- **`against-caster.js` (family `against-caster-area`):** `#executeAgainstCaster` collects the caster's PF2e enemies within the emanation (measured from the caster's token).
  - Each gets an Effect (1 round, turn-start, at the caster's initiative, origin the caster) with a FlatModifier on AC, `slug: off-guard`, predicated on `origin:signature:<caster>`.
  - Creatures with no alliance are listed for the GM.
- **`darkness-area.js` (family `darkness-area`):** `#executeDarknessArea` calls the new `startRegionArea`, a no-save lingering record whose region gets the given behaviours (here `adjustDarknessLevel`, override 1). The notes and heightened notes are whispered to the GM.

See [verification](verification/phase-rank-2-batch-25.md).

### Rank 2 batch 26 — maneuvers with a spell attack roll

- **`spell-maneuver.js` (family `spell-maneuver`):** the maneuver sentence, a reaction's Trigger, and Vanish Weapon's GM sentences.
- **`effect-runtime.js`:**
  - `#executeSpellManeuver` posts the card. It needs one targeted creature, and the card carries a button per maneuver and the multiple attack penalty.
  - `spellManeuver(message, {action, map, skipDialog})` runs `game.pf2e.actions.get(action).use({statistic: <the spell's spellcasting statistic>, target, multipleAttackPenalty})` and applies the stated result.
  - Disarm's PF2e Effect gets its weapon preset when the target has one non-unarmed Strike.
- **`main.js`:** `bindSpellManeuverButtons`; the API exposes `spellManeuver`.

See [verification](verification/phase-rank-2-batch-26.md).

### Rank 2 batch 27 — repeated spell attacks, object damage, GM-triggered areas

- **`sustain-attack.js`:** `spiritualAttack` reads Spiritual Weapon and Spiritual Armament into the repeated spell attack. It sets `types`, which `compile-ability.js` uses as the `casterChoice` values.
- **`object-damage.js` (family `object-damage`):** `objectDamageAt(data, rank)` gives the formula and the Hardness ignored. `#executeObjectDamage` rolls PF2e's DamageRoll and posts the GM's line.
- **`hazard-area.js` (family `hazard-area`):** `hazardFormulaAt(data, rank)`. `#executeHazardArea` places the area and calls `startRegionArea(… gmHazard)`, with difficult terrain when stated.
- **`ongoing-families.js`:** the GM's control (per square with a squares prompt, or ignite on all targeted creatures) and the `gm-hazard` request. Each roll is applied with `applyDamageWithReceipt` (PF2e's IWR; persistent damage becomes PF2e's condition). `endsSpell` ends the record.

See [verification](verification/phase-rank-2-batch-27.md).

### Rank 2 batch 28 — a sun ray, a blood-drinking hand

- **`trait-ray.js`:** a `compileSpell` pre-pass for Sun Blade. It builds a plain spell attack plus `conditionalDamage` (each trait, `(@item.rank - N)dX`), `castGate` and `diceUpgrade`.
  - **`basic-save-core.js`:** `diceUpgrade` is accepted with `compilerEvidence.attackDiceUpgrade` on a spell attack.
  - **`basic-save-runtime.js`:** conditional damage dice follow the "yes" to the upgrade.
- **`spell-attack-table.js`:** the "On a hit, you deal … (or double damage on a critical hit)." form.
- **Draw Blood's healing:**
  - **`compile-ability.js`:** `BLEED_HEALING` gives a note on the hit rows with `triggeredHealing` (`max(N,@item.rank)`, `bleed-damage`).
  - **`note-effects.js`:** validates it and copies it into the runtime flags.
  - **`ongoing-runtime.js`:** the control and the `triggered-healing` request.
  - **`stored-trigger-runtime.js`:** `triggeredHealing` heals the caster with `applyDamageWithReceipt`.

See [verification](verification/phase-rank-2-batch-28.md).

### Rank 2 batch 29 — an acid puddle left by a hit

- **`puddle-attack.js`:** a `compileSpell` pre-pass producing a spell attack plus `groundHazard` with `where: "target-and-adjacent"`.
- **`basic-save-core.js`:** the ground hazard's `where` may be `target-and-adjacent`, and its formula may be `(floor(@item.rank/N))dX`.
- **`basic-save-runtime.js`:** `hazardFormula` evaluates the floor.
- **`ongoing-families.js`:** `startGroundHazard` draws the region one square larger on each side for `target-and-adjacent`.

See [verification](verification/phase-rank-2-batch-29.md).

### Rank 2 batch 30 — stealing from minds and shadows, extracting poison

- **`steal-damage.js` (family `steal-damage`):**
  - `#executeStealDamage` gives the caster's note and posts the card.
  - `stealDamage(message, {target, amount, skipDialog})` runs `game.pf2e.actions.get("steal").use(…)`. On a success it rolls `stealDamageFormula(data, amount)`, applies it, and marks the card stolen.
- **`counteract-transfer.js` (family `counteract-transfer`):**
  - `counteractTransfer(message, {choice: {name, level, dc}, weaponId})` rolls the caster's counteract and, on a success, creates PF2e's Effect. Its ChoiceSets are preset (the level as a string), its duration runs to the end of the caster's next turn, and it is flagged `consumedBy`.
  - A `createChatMessage` hook in `main.js` deletes it after a damage roll, or a critically failed attack roll, with that weapon.
- **`main.js`:** the Steal and Counteract buttons; the API exposes `stealDamage` and `counteractTransfer`.

See [verification](verification/phase-rank-2-batch-30.md).

### Rank 2 batch 31 — blasts from the caster's own creatures

- **`sacrifice-blast.js`:** a `compileSpell` pre-pass giving a basic save, `resolution.sacrifice` and `resolution.boneArmor`.
- **`basic-save-core.js`:** `validSacrifice` and `validBoneArmor` run in `isExecutableBasicSavePlan` and `inspectDegreeSavePlan`. The readiness checks cover both answers, and `damageMultiplierForTarget` returns 0 for `target.boneArmor`.
- **`basic-save-runtime.js`:**
  - `sacrificeHTML` and `boneArmorHTML`, with `answerSacrifice(card, tokenUuid)` and `answerBoneArmor(card, answer)` (both exposed on the API). `markBoneArmor` uses PF2e alliances.
  - The retype replaces `[fire]` in the damage roll.
  - Finalize sets the minion's Dead status and creates the bone armor Effects.

See [verification](verification/phase-rank-2-batch-31.md).

### Rank 2 batch 32 — a constellation's blast

- **`constellation-blast.js`:** a `compileSpell` pre-pass giving a basic save, `casterChoice` (damage type) and `resolution.constellations`, plus the enemy predicate.
- **`basic-save-runtime.js`:**
  - `start` resolves the constellation and sets `check.statistic` and the damage type (`options.casterChoice`).
  - The damage-type replacement tolerates a roll PF2e already typed as chosen.
- **`basic-save-core.js`:** `validConstellations`.

See [verification](verification/phase-rank-2-batch-32.md).

### Rank 2 batch 33 — a target-animal note, a Prone mire, a bone cage

- **`spell-note.js`:** `bystanderSaveOnly`; `SINGLE_ACTOR_TARGET` accepts an animal.
- **`compact-degree-table.js`:** `expandSaveOrProne` and `expandCage` (a `structure` reminder recorded as `compilerEvidence.structure`).
- **`lingering-area-compiler.js`:** "beginning their turn"; the healing counteract as a note.
- **`basic-save-core.js`:** accepts the `structure` reminder.

See [verification](verification/phase-rank-2-batch-33.md).

### Rank 2 batch 34 — trait-extra persistent rows, a per-creature curse, a reaction blast, a trait-only area

- **`persistent-damage-compiler.js`:** `compileInlinePersistentRows` reads the "dealing … and …" introduction, rows ending their conditions with the persistent damage, and a trait's extra dice.
- **`compile-ability.js`:** the `persistent-extra` `traitVariant`, the "see description" outcome duration, and Warrior's Regret's `creatures-damaged` notes.
- **New pre-passes:** `reaction-blast.js` and `trait-area-blast.js`.
- **`basic-save-core.js`:** `isPersistentExtraVariant`, `creatures-damaged`, and the reaction `caster-movement` reminder.
- **Runtime:**
  - The variant's excluded traits.
  - `{feet}` at the cast rank.
  - `hostileDamage({count})` with the count dialog on the Ongoing control.

See [verification](verification/phase-rank-2-batch-34.md).

### Rank 2 batch 35 — a revealed weakness, a caster row Effect, an object's pulse, a GM-triggered area

- **Compiler:** note `reveal`; new `caster-row-effect.js`, `object-pulse.js` and `gm-trigger-area.js`.
- **Core:** `casterRowEffect`, and the `gm-trigger` lingering event.
- **Runtime:**
  - `reveal-runtime.js` and the reveal hooks (note creation, the Ongoing entry's end).
  - `applyCasterRowEffect`.
  - Placing the plan's area when the item has none.
  - `options.chosenConditions`, and the `gm-trigger` request and control.

See [verification](verification/phase-rank-2-batch-35.md).

### Rank 2 batch 36 — daily damage, an illusion's Disbelieve control, minion control

- **Compiler:** `daily` triggered damage; new `illusion-disbelief.js` and `minion-control.js`.
- **Core:** the `level-at-most` predicate; note rules `Immunity` and `BaseSpeed`; the note fields `disbelieve` and `minionControl`.
- **Runtime:**
  - `disbelieve` (request and control).
  - `minion-control-runtime.js` (grant, and restore on `deleteItem`).
  - Week-long conditions become days.

See [verification](verification/phase-rank-2-batch-36.md).

### Rank 2 batch 37 — a conjured tree as a token

- **`sustain-attack.js`:** `conjuredAttack`.
- **Plan:** `resolution.conjuredCreature`, checked by the core.
- **`basic-save-runtime.js`:**
  - `ensureConjuredCreature` (NPC, token, and the caster's `summon` Effect).
  - The reach check.
  - `freeSpaceNear` is exported from `effect-runtime.js`.

See [verification](verification/phase-rank-2-batch-37.md).

### Rank 2 batch 38 — image decoys, and a proved Effect + note

- **New:** `image-decoys.js` (note family) and `effect-note-proof.js`.
- **Census:** proved Effect + note plans count as enabled.
- **Runtime:**
  - The `image-decoys` executor, the `decoy` request and its controls.
  - The heightened Effect duration in the Effect + note executor.
  - "This spell has a duration of …" is read as a heightened duration.

See [verification](verification/phase-rank-2-batch-38.md).

### Rank 2 batch 39 — Effect + note spells proved

- **`effect-note-proof.js`:** `ruleValueAt`, scaled readers, the stated recipient, `endsAfterDamage`.
- **Runtime:**
  - The Effect + note executor's trait check.
  - `main.js` `endAfterDamage` on applied-damage messages and damage updates.

See [verification](verification/phase-rank-2-batch-39.md).

### Rank 2 batch 40 — two more Effect + note spells proved

- **`effect-note-proof.js`:** PF2e's table formulas, capped steps, heightened extra rules, target counts.
- **`note-effects.js`:** animals in the target limit.

See [verification](verification/phase-rank-2-batch-40.md).

### Rank 2 batch 41 — counted wisps, stored armor

- **New note families:** `wisps.js` and `stored-armor.js`.
- **Runtime:**
  - The `wisp` request and its controls.
  - The stored-armor executor, and `armorUpOnUse` on `createChatMessage`.

See [verification](verification/phase-rank-2-batch-41.md).

### Rank 2 batch 42 — a foe's weaknesses revealed, an added toggle

- **`effect-note-proof.js`:** multi-rule, shared, added-rule, reveal, immunity and subject readers.
- **Runtime:** `ruleAdditions`, the subject target with its immunity and reveal, and the `weaknesses-and-lowest-save` reveal.

See [verification](verification/phase-rank-2-batch-42.md).

### Rank 2 batch 43 — the eidolon as the caster's twin

- **`effect-note-proof.js`:** Impersonate, traits and size readers.
- **New:** `caster-resolved-rules.js` (`@caster:form-traits`, `@caster:size`).

See [verification](verification/phase-rank-2-batch-43.md).

### Rank 2 batch 44 — a save deferred to the GM's control

- **New:** `deferred-save.js`, the compile pre-pass, the `deferred-save` executor, and the `deferredSave` request and control.

See [verification](verification/phase-rank-2-batch-44.md).

### Rank 2 batch 45 — bleeding sealed with fire

- **New note family:** `cauterize.js`.
- **Runtime:** `cauterizeTarget` (with PF2e's `rollRecovery`), the `cauterize` request and its repeat control.

See [verification](verification/phase-rank-2-batch-45.md).

### Rank 2 batch 46 — heal or harm, with persistent damage on both sides

- **`heal-or-harm.js`:** the Soothing Mist grammar.
- **Plan:** `persistentRemoval`, checked by the core.
- **Runtime:** removal after healing.

See [verification](verification/phase-rank-2-batch-46.md).

### Rank 2 batch 47 — Knock

- **`effect-note-proof.js`:** `castCheck` and counteract readers.
- **Runtime:** the Effect + note card's buttons, and `noteCheck` (exposed on the API).

See [verification](verification/phase-rank-2-batch-47.md).

### Rank 2 batch 48 — objects: taken apart, hidden in a pack

- **New note family:** `dismantle.js`.
- **`spell-note.js`:** container-item mentions.
- **Runtime:** the `dismantle` executor and `dismantleOnEnd`.

See [verification](verification/phase-rank-2-batch-48.md).

### Rank 2 batch 49 — a light aura for allies, a tremorsense web

- **New note families:** `light-aura.js` and `hyphae.js`.
- **Runtime:**
  - The executors.
  - The generated aura Effect (a world Item).
  - `hyphaeOnMove`.
  - The `plant-strike` request and control.

See [verification](verification/phase-rank-2-batch-49.md).

### Rank 2 batch 50 — Faerie Fire

- **New note family:** `outline.js`.
- **Runtime:** the `outline` executor, `outlineOnCondition`, `outlineOnInvisible`.

See [verification](verification/phase-rank-2-batch-50.md).

### Rank 2 batch 51 — Glacial Causeway

- **New note family:** `causeway.js`.
- **`startRegionArea`:** `casterTurnEnd`.
- **Runtime:** the `causeway` executor.

See [verification](verification/phase-rank-2-batch-51.md).

### Rank 2 batch 52 — a battle form from the text

- **New note family:** `battle-form.js`.
- **Runtime:** the `battle-form` executor, and the `fuel-form` request and control.

See [verification](verification/phase-rank-2-batch-52.md).

### Rank 2 batch 53 — Helpful Reload

- **`effect-note-proof.js`:** `effectFromRank`.
- **Runtime:** the Effect skipped below that rank, and the weapon ChoiceSet preset.

See [verification](verification/phase-rank-2-batch-53.md).

### Rank 2 batch 54 — Thermal Remedy

- **`effect-note-proof.js`:** a chosen-benefit list is proved against PF2e's ChoiceSets and its values (`benefitChoice`, `targetLimit`).
- **Runtime:** the benefits are picked once and preset on every recipient.

See [verification](verification/phase-rank-2-batch-54.md).

### Rank 2 batch 55 — Gentle Breeze

- **`area-boon.js`:** a placed area whose occupants hold PF2e's Effect (with an added Medicine toggle), and healing for the living creatures that stay the full duration.
- **Runtime:** `startAreaBoon`, `stayers` and `applyStayHealing` (only on `maximum-duration`).

See [verification](verification/phase-rank-2-batch-55.md).

### Rank 2 batch 56 — Canopy Crawler

- **`effect-note-proof.js`:**
  - Overrides claimed with a rule; `@recipient:highest-speed` is resolved per recipient (`recipientResolvedOverrides`).
  - The `self-or-companion` recipient, with `bothFromRank`.

See [verification](verification/phase-rank-2-batch-56.md).

### Rank 2 batch 57 — Clawsong

- **`effect-note-proof.js`:** `strikeUpgrade`, which replaces PF2e's die upgrade with per-claw item alterations (`strikeUpgradeRules`), and `targetsByRank`.
- **Runtime:** the claw check, the per-recipient rules, and the limit by rank.

See [verification](verification/phase-rank-2-batch-57.md).

### Rank 2 batch 58 — Blazing Blade

- **`blade-attack.js`:** the repeat window `duration` (any number of one-action attacks while the spell lasts).
- **Heightened variants:** they can carry their own damage proof (`compilerEvidence`).

See [verification](verification/phase-rank-2-batch-58.md).

### Rank 2 batch 59 — Swallow Light

- **`breath-gate.js`:** the repeat window `duration` with a `counteract` gate (a card button) and a rolled `recharge`.
- **`validRepeatable`:** now checked on the simple basic-save route too.

See [verification](verification/phase-rank-2-batch-59.md).

### Rank 2 batch 60 — Expeditious Excavation

- **`pit-excavation.js`:** a degree save with Prone and a 5-foot fall.
- **`size-at-most`:** now takes `byRank`.

See [verification](verification/phase-rank-2-batch-60.md).

### Rank 2 batch 61 — Coiling Dance

- **`escape-aura.js`:** a sustained allies-only aura (`startAllyAura` with `sustained`, `alliesOnly` and `escapePrompt`).
- **The Escape card:** PF2e's Escape, raised to the caster's better skill.

See [verification](verification/phase-rank-2-batch-61.md).

### Rank 2 batch 62 — Invoke the Crimson Oath

- **`weapon-blast.js` / `weaponDamage`:** a basic save dealt with PF2e's Strike damage for the held melee weapon.
- **Critical failure:** the weapon's critical roll; a creature immune to critical hits takes the failure's damage instead.
- **Conversion:** physical damage to vitality against undead, when chosen.

See [verification](verification/phase-rank-2-batch-62.md).

### Rank 2 batch 63 — Falsify Heat

- **`option-veil.js`:** an option chosen per target, a generated Effect with a toggled skill bonus, and a Dismissable record.
- **`touch-disbelieve`:** a toucher's Perception against the spell DC, whispered.

See [verification](verification/phase-rank-2-batch-63.md).

### Rank 2 batch 64 — Magnetic Repulsion

- **`repulsion-aura.js`:** a region that follows the caster.
- **Per-creature terrain:** a `selectiveTerrain` flag on a movement-cost behavior, read by `main.js`'s wrapper.
- **The `metal-attack` control:** a one-roll penalty on the attacker.

See [verification](verification/phase-rank-2-batch-64.md).

### Rank 2 batch 65 — Steel Fortifications

- **`fortifications.js`:** hazard tokens with the stated statistics, size-selective regions, and a compiled crumble save run when one breaks.
- **`endsAtMaximum`:** a native record that ends at its maximum duration.

See [verification](verification/phase-rank-2-batch-65.md).

### Rank 2 batch 66 — Reaper's Lantern

- **`lantern-aura.js`:** one save per creature per cast, and outcome Effects held while inside.
- **Half healing:** a `preUpdateActor` hook on PF2e's healing updates.

See [verification](verification/phase-rank-2-batch-66.md).

### Rank 2 batch 67 — Palm-Held Sun

- **`sun-aura.js`:** a sustained aura's pulse on the cast and each Sustain, a GM-targeted sunlight save, and a fire trigger.
- **The `applyDamage` wrapper:** reports fire damage that cost Hit Points.

See [verification](verification/phase-rank-2-batch-67.md).

### Rank 2 batch 68 — Dancing Shield

- **Effect-note proof:** `shieldChoice`, preset from the shield.
- **`noteShieldBlock`:** the 4th-rank Shield Block for the target.

See [verification](verification/phase-rank-2-batch-68.md).

### Rank 2 batch 69 — Mark of Blood

- **`blood-mark.js`:** the marked weapon's next hit (an attack-message hook), the save card, the mark by outcome (one at a time), and the whispered Seek.

See [verification](verification/phase-rank-2-batch-69.md).

### Rank 2 batch 70 — Radiant Field

- **`radiant-field.js`:** a placed light, Light Blindness, a turn-start save with incapacitation, and concealment from 4th.

See [verification](verification/phase-rank-2-batch-70.md).

### Rank 2 batch 71 — Blazing Armory

- **`blazing-weapons.js`:** a weapon conjured for each target, with a fixed damage type, runes by rank, the free-hand rule, and a touch-damage button.

See [verification](verification/phase-rank-2-batch-71.md).

### Rank 2 batch 72 — Banishing Touch

- **`mythic-launch.js`:** an attack at mythic proficiency, with the damage and the launch by actions and rank; the push and the fall.

See [verification](verification/phase-rank-2-batch-72.md).

### Rank 2 batch 73 — Sea Surge

- **`wave-surge.js`:** the path's degree save, with the Swimming adjustment and `waveRepeat` (the wave-moves-on card).

See [verification](verification/phase-rank-2-batch-73.md).

### Rank 2 batch 74 — Burrow Ward

- **`burrow-ward.js`:** a sustained region following the caster, burrow-only terrain for the stone burrowers, and the underground creatures' saves.

See [verification](verification/phase-rank-2-batch-74.md).

### Rank 2 batch 75 — Web

- **`web-area.js`:** a difficult-terrain region, and a check card for each creature that enters or moves inside it, with the outcome applied.

See [verification](verification/phase-rank-2-batch-75.md).

### Rank 2 batch 76 — Helpful Wood Spirits

- **`spirit-aid.js`:** a sustained area whose aid is chosen on the cast and on each Sustain: Distract (Off-Guard on a failed save), Obstacle (terrain), Search (Perception), and Chores (GM).

See [verification](verification/phase-rank-2-batch-76.md).

### Rank 2 batch 77 — One with Plants

- **`plant-form.js`:** two modes — a generated tree battle form (Reflex successes become failures), or merged and Blinded with the GM's expulsion buttons.

See [verification](verification/phase-rank-2-batch-77.md).

### Rank 2 batch 78 — Illusory Creature

- **`illusory-creature.js`:** an NPC token (spell-DC AC, saves DC − 10) held by a sustained record; the card's Strike and Disbelieve; it ends when hit, on a failed save, or out of range.

See [verification](verification/phase-rank-2-batch-78.md).

### Rank 2 batch 79 — Sweetest Solstice (rituals)

- **`ritual-outcome.js`:** rituals resolved from the GM-confirmed degree. The casters get PF2e's Effects (choice preselected) and locked conditions; a `preUpdateItem` hook refuses a reduction below a lock while it lasts.

See [verification](verification/phase-rank-2-batch-79.md).

### Rank 2 batch 80 — Rite of Cleansing Flame

- **`ritual-outcome.js`:** an area cure of detrimental emotion/mental effects on the GM's targets (GM-confirmed); a casters' curse Effect with a Weakness; each caster's save locking a condition for as long as the curse lasts.

See [verification](verification/phase-rank-2-batch-80.md).

### Rank 2 batch 81 — Inveigle

- **`ritual-outcome.js`:** a target's PF2e attitude under a Dismissable record. An unwilling target's negating save and the card's end save (with the critical success's penalty) use the GM's DC. Heightened durations are picked on the card.

See [verification](verification/phase-rank-2-batch-81.md).

### Rank 2 batch 82 — Oil-Slicked Walls

- **`ritual-outcome.js`:** a GM-drawn area whose creatures take the Climb DC increase (`startAreaRules`/`syncAreaRules`, a generic placed area holding an Effect of given rules). The casters' backlash is a first-move-per-encounter check card (`ritualSlipCheck` on `updateToken`), with Prone on a failure.

See [verification](verification/phase-rank-2-batch-82.md).

### Rank 3 batch 3 — Personal Blizzard

- **`sustained-save-damage.js`:** a sustained single-target save. A success deals damage and the spell ends; a failure's persistent damage and Concealed Effect are held by the sustained record. The heightening is a flat step.

See [verification](verification/phase-rank-3-batch-3.md).

### Rank 3 batch 4 — Stinking Cloud

- **`borrowed-spell.js`:** "functions as @UUID[…]{Mist} except …" is read from the referenced spell (new compile option `referencedSpells`). The lingering degree branch reads concealment. A "while in the area" condition sits in its own Effect tied to the area (`isLeaveAreaLifetime`). Sickened and Frightened keep their own recovery when another condition stands before the phrase.

See [verification](verification/phase-rank-3-batch-4.md).

### Rank 3 batch 5 — Qi Blast

- **`selectActionSentences` (`action-paragraphs.js`):** action counts stated as "If you use N actions to cast …" sentences. Each PF2e variant's damage, area and heightening must match the text. A target of "All creatures" in an area is complete.

See [verification](verification/phase-rank-3-batch-5.md).

### Rank 3 batch 6 — Hypnotize

- **Lingering degree areas:** a listed trigger, with a GM control for an action used on the area (`gmAction`); Dazzled while inside (`memberCondition`); no new saves while holding the spell's condition (`skipWhile`). A condition "by the cloud" lasts while the area does (`isAreaLifetime`).

See [verification](verification/phase-rank-3-batch-6.md).

### Rank 3 batch 7 — Shadow Projectile

- **A reaction's condition "against the triggering attack"** lasts until the next attack roll against the creature (a `createChatMessage` hook) or the end of the current turn (`isNextAttackLifetime`). An immunity naming the spell reads the same for a renamed copy.

See [verification](verification/phase-rank-3-batch-7.md).

### Rank 3 batch 8 — Blastback

- **`compileBasicPushRider`:** a basic save whose failing creatures are pushed (`forcedMovement`), the caster spared (not-caster), and the text's heightened area as a GM reminder.

See [verification](verification/phase-rank-3-batch-8.md).

### Rank 3 batch 9 — Drain Life

- **`hp-capped` caster benefit:** temporary HP equal to the damage taken, at most the target's Hit Points. The joined "This deals …; the target must attempt a basic … save." passes the basic gate.

See [verification](verification/phase-rank-3-batch-9.md).

### Rank 3 batch 10 — Iron Rain

- **`compileDebrisTerrain`:** a basic-save burst dealing direct and persistent damage when cast, then difficult terrain for the spell's duration, with a pick-up note.

See [verification](verification/phase-rank-3-batch-10.md).

### Rank 3 batch 11 — Sculpt Sound

- A save spell's "You can @UUID[…]{Dismiss} the spell." is read as a Dismiss. "An unwilling target can attempt a … save." gives the willing-target reminder.

See [verification](verification/phase-rank-3-batch-11.md).

### Rank 3 batch 12 — Spectral Blade

- **`spectralAttack`:** a thrown blade's ranged spell attack when cast and on later Sustains, with PF2e's typed damage (`fixedType`, no choice).

See [verification](verification/phase-rank-3-batch-12.md).

### Rank 5 batch 1 — You're Mine

- A row note's "If it has actions left, it can act normally." is a restatement. A Heightened entry giving "Controlled for up to 1 minute" with an end-of-turn save becomes a rank variant.

See [verification](verification/phase-rank-5-batch-1.md).

### Rank 4 batch 1 — Deathless March

- **`trait-grant.js`:** creatures of a trait get a condition with no save (the `trait-grant` mode), while the stated others save. The traits the spell gains for them are a GM reminder.

See [verification](verification/phase-rank-4-batch-1.md).

### Rank 4 batch 2 — Haunting Spirit

- **The lingering target-turn save** accepts "At the start of each of the target's turns, it must attempt a … saving throw." and a run-away note. A lingering save's bare "The spell immediately ends." row ends the cast (`endsSpell`).

See [verification](verification/phase-rank-4-batch-2.md).

### Rank 4 batch 3 — Unbounded Sphere

- **A lingering area exposed only through the GM's control** ("Whenever a creature attempts to enter or leave the area …"). An "As failure, except …" row keeps its exception in the whole-row note.

See [verification](verification/phase-rank-4-batch-3.md).

### Rank 5 batch 2 — Glossolalia

- **A "varies" duration** read from the rows' own note times. "As failure, except the duration is N" applies that time to the inherited note.

See [verification](verification/phase-rank-5-batch-2.md).

### Rank 3 batch 13 — Battlefield Persistence, Tempest Cloak, Repel Metal

- **Proved Effect + note:** `endsAfterSave` / `endsAfterAttack` remove the Effect after the triggering roll. Readers can add notes, and narration openings are accepted. A proved immunity goes on the recipients.

See [verification](verification/phase-rank-3-batch-13.md).

### Rank 3 batch 14 — six proved Effect + note spells

- **More effect-note readers.** A multi-rule reader can end after the triggering roll, fixed-rank resistance values are checked at their rank, and `ruleValueAt` gains `max` / `min`. A proved Effect + note's own link counts as scoped.

See [verification](verification/phase-rank-3-batch-14.md).

### Rank 3 batch 15 — five proved Effect + note spells

- **More readers and notes.** A fixed-rank "The status bonus increases to +N." is checked against each claimed modifier. An area effect-note spell with no target line has no count limit.

See [verification](verification/phase-rank-3-batch-15.md).

### Rank 3 batch 16 — Return the Favor, Capital Dividend, Know the Enemy

- **Temporary-HP and healing-received steps** (`STEP_MORE`), a RollTwice reader, and narration accepted in the first three sentences.

See [verification](verification/phase-rank-3-batch-16.md).

### Rank 3 batch 17 — Confusing Cry, Fearful Feast

- **Row immunity** accepts "immune to this spell". "As failure, and … attacks itself." is a note, not plain inheritance. A row's "you regain HP equal to (half) the damage the target takes" is a `heal` caster benefit on those rows.

See [verification](verification/phase-rank-3-batch-17.md).

### Rank 5 batch 3 — Banishment

- **The extra-action option** ("You can spend an extra action … to give the creature a –N circumstance penalty to its save.") is a per-target save adjustment the caster answers. A row's "you are Stunned 1" goes on the caster. "The target is banished" is a GM reminder.

See [verification](verification/phase-rank-5-batch-3.md).

### Rank 5 batch 4 — Domora's Defense, Spiral of Horrors, Unfolding Wind Buffet, Foul Miasma, Flames of Ego

- **Effect-note proof:** a leading run of story sentences is narration. New readers cover the AC-and-resistance grant and the frightened-floor enemy aura.
- **Strike-hit push:** a cast question ("did one hit?") and a `perHit` push reminder.
- **Affliction save benefit:** a GM row note.
- **Note Effects:** they may carry a `TokenLight` rule (Flames of Ego's glow).

See [verification](verification/phase-rank-5-batch-4.md).

### Rank 5 batch 5 — Anchoring Air, Earthbind, Warshard Shot

- **Degree-choice Effects:** they read the triggering Strike's penalty and the "until the end of its turn" timing (target-turn). An unoffered "As failure, but … also X" degree takes the failure's Effect.
- **Safe fall:** a `fall` GM reminder.
- **AC penalty while persistent:** a note Effect that ends with the persistent damage.

See [verification](verification/phase-rank-5-batch-5.md).

### Rank 4 batch 4 — Downpour, Anointed Ground

- **Effect-note recipient `area`:** a placed lingering area whose occupants hold PF2e's Effect (with proved additions, and a once-per-cast ChoiceSet pick) and lose it on leaving.

See [verification](verification/phase-rank-4-batch-4.md).

### Rank 3 batch 18 — Safe Passage, Soothing Blossoms

- **Area Effects:** the area can be a drawn one (the Area paragraph), and sustained. "Assisted recovery" rolls PF2e's recovery flat checks for occupants at the cast and at each caster turn start.

See [verification](verification/phase-rank-3-batch-18.md).

### Rank 4 batch 5 — Wall of Fire, Wall of Thorns, Wall of Ice

- **`damaging-wall`:** a GM-drawn wall with its damage as the GM's control (a count per move action for thorns), turn-start damage (fire), difficult terrain (thorns) and the notes. Section Hit Points are given at the cast rank.

See [verification](verification/phase-rank-4-batch-5.md).

### Rank 3 batch 19 — Wall of Shadow, Wall of Water

- **Spell notes:** they accept "treat targets seen through the wall as Concealed" as a mention, Wall of Water's fire counteract as the card's button (its restatement passive), and "For instance, …" numbers as situational.

See [verification](verification/phase-rank-3-batch-19.md).

### Rank 4 batch 6 — Mercurial Stride, Chroma Leach

- **Caster-movement reminder.** **Restated item damage:** the rows' inline damage equal to the item's at its rank and step drops the shared roll.
- **Move-action save:** a note Effect with a `{dc}` check link (`spellDC`). **Permanent conditions:** unlimited, with a note.

See [verification](verification/phase-rank-4-batch-6.md).

### Rank 3 batch 20 — Gleaming Pet, Hydraulic Torrent, Localized Quake

- **Lingering `aura`:** saves for creatures adjacent to the target (centre `targets`).
- **Knockback rider:** with an objects reminder.
- **Area choice:** "Choose whether the spell's area is …". **Solid ground:** GM-confirmed eligibility.

See [verification](verification/phase-rank-3-batch-20.md).

### Rank 3 batch 21 — Firework Blast, Howling Blizzard

- **Basic save with a second-save table** on the failing rows, with an optional `check.modifier` (−2 after a critical failure).
- **Lingering area:** "fill the area until the start of your next turn, making the area difficult terrain", cones for that, and the action-variant area sentence (checked).

See [verification](verification/phase-rank-3-batch-21.md).

### Rank 3 batch 22 — Invisibility Cloak, Clairvoyance, Clairaudience, Scouting Eye, Drop Dead, Beastmaster Trance, Eyes of the Dead, Time Skip

- **Condition + note grants:** borrowed restrictions, "though it actually turns", "This lack of awareness makes you", "on its next turn".
- **Mention:** "You create an Invisible floating eye".
- **Targets:** "other than yourself" (refused on the caster), "one undead creature under your control", "one of your animal companions you can perceive".

See [verification](verification/phase-rank-3-batch-22.md).

### Rank 4 batch 7 — Movanic Glimmer, Forgotten Lines, Wordsmith

- **Spell notes:** two-statistic bonuses with a situational clause; "varies" with nothing timed (non-ritual) is instantaneous; "until the next time you Refocus" is unlimited.
- **Targets:** "1 animal" (enforced on notes); "text"/"document" targets are things.

See [verification](verification/phase-rank-4-batch-7.md).

### Rank 3 batch 23 — Bottomless Stomach, Peaceful Bubble, Hunter's Vision, Shared Invisibility

- **Spell-note mentions:** trigger state, rest rule, perception.
- **Condition-note recipient `self-and-targets`:** with a heightened target count.
- **Targets:** "1 hunted prey", "you and up to N willing creatures".

See [verification](verification/phase-rank-3-batch-23.md).

### Rank 4 batch 8 — Shroud of the Mantis, Life Connection, Divine Dragon's Watch

- **Grant:** "renders you @C, with the same restrictions as …".
- **Effect-note:** a granted reaction ("you gain the X reaction; once you use the reaction, the spell ends"); dice steps proved against PF2e's dice-number upgrade.

See [verification](verification/phase-rank-4-batch-8.md).

### Rank 5 batch 6 — Unblinking Flame Aura, Mind of Menace

- **Effect-note self-heal:** per rank, with a combined heal-and-resistance step.
- **Scaled multi-rule readers.**
- **An item save that belongs to a granted reaction** doesn't block the route.

See [verification](verification/phase-rank-5-batch-6.md).

### Rank 3 batch 24 — Subjugate Undead, Sudden Recollection, Rewrite Memory

- **Minion control:** Subjugate Undead's shape, with the caster-relative level limit `level-at-most-caster`.
- **Whole-row GM notes:** they accept the caster's choice, and unlimited spells resolve by outcome.

See [verification](verification/phase-rank-3-batch-24.md).

### Rank 4 batch 9 — Fire Shield

- **Effect-note proof of PF2e's shield attribute and resistance** (with stepped HP). A roll-carrying proof note is added to the note Effect.

See [verification](verification/phase-rank-4-batch-9.md).

### Rank 5 batch 7 — Glacial Skewer

- **Spell-attack table:** a critical-hit push phrased "the target takes double damage and is pushed …", and an obstacle condition gated by the GM's question.

See [verification](verification/phase-rank-5-batch-7.md).

### Rank 3 batch 25 — Moonlight Ray

- **Conditional damage after a semicolon.** **Spell-attack critical row:** "double X damage, as well as double Y damage if a …".

See [verification](verification/phase-rank-3-batch-25.md).

### Rank 4 batch 10 — Suggestion

- **Whole-row GM notes:** "The spell has a duration of N" and "As failure, but the base duration is N".

See [verification](verification/phase-rank-4-batch-10.md).

### Rank 3 batch 26 — Distracting Chatter, Excise Lexicon

- **The effect stated before the table, its length by the save:** each failing row's note (and stated condition) for that row's length.

See [verification](verification/phase-rank-3-batch-26.md).

### Rank 3 batch 27 — Echo Jump, Blazing Dive, Fungal Exhalation, Powerful Inhalation

- **Move then blast:** the move is the caster's reminder.
- **"Immune to this effect"** in a basic save with riders.
- **Basic-save row notes:** "can't … for N rounds", combined with a trait degree adjustment.

See [verification](verification/phase-rank-3-batch-27.md).

### Rank 4 batch 11 — Anathematic Reprisal, Life-Draining Roots

- **Basic-save rider:** timed immunity and a reaction's cast limit.
- **Caster benefit:** dice of temporary HP per living creature.

See [verification](verification/phase-rank-4-batch-11.md).

### Rank 3 batch 28 — Travel by Turtle, Tiny Wings, Transcribe Conflict

- **Spell notes:** conjured creatures named by the spell; a granted Speed as BaseSpeed; "in combats where you face".
- **Heightened durations:** weeks and months.

See [verification](verification/phase-rank-3-batch-28.md).

### Rank 4 batch 12 — Word of Freedom, Tireless Worker

- **Affliction care:** a chosen condition suppressed for the spell's duration (set-aside marker).

See [verification](verification/phase-rank-4-batch-12.md).

### Rank 5 batch 8 — Rip the Spirit, Spiritual Torrent

- **Basic save:** riders joined to the damage sentence.
- **Action paragraphs:** more restatements, and emanations stored as bursts.
- **Caster-undead energy swap.**

See [verification](verification/phase-rank-5-batch-8.md).

### Rank 4 batch 13 — Friends to Foes, Nightmare

- **Fear-of-allies note** and **"can't … while X" behaviour notes.**
- **Row immunity:** "becomes" and a week.
- **Sleep-timed save reminder; "awakens X" as a condition.**

See [verification](verification/phase-rank-4-batch-13.md).

### Rank 3 batch 29 — Sun's Fury

- **Effect proof:** a weapon's extra damage die and flat damage, and a torch's light.

See [verification](verification/phase-rank-3-batch-29.md).

### Rank 4 batch 14 — Font of Serenity

- **Area boon for allies only**, with text overrides and a counteract button.

See [verification](verification/phase-rank-4-batch-14.md).

### Rank 3 batch 30 — Conjured Conveyance, Disruptive Transfer, Caster's Imposition

- **Vehicle stat blocks** are the GM's.
- **"Each of them"** only after the adjacent-creatures sentence.
- **"On a failed save, the target can't …" table.**
- **Teleport reminder; "1 creature within N feet"; "Increase the duration to N".**

See [verification](verification/phase-rank-3-batch-30.md).

### Rank 4 batch 15 — Mystic Beacon, Magnetize, Elemental Sense

- **Spell notes:** another spell's heightening, "whenever", and Mechanoreception's mentions.

See [verification](verification/phase-rank-4-batch-15.md).

### Rank 5 batch 9 — Plasma Whirl

- **Narration "a temporary portal"**, and **parenthetical critical-failure riders**.

See [verification](verification/phase-rank-5-batch-9.md).

### Rank 3 batch 31 — Wall of Virtue

- **Damaging wall:** two damage types and a darkness counteract button.

See [verification](verification/phase-rank-3-batch-31.md).

### Rank 4 batch 16 — Spike Stones

- **Hazard area:** flat per-square damage for any creature on the ground.

See [verification](verification/phase-rank-4-batch-16.md).

### Rank 3 batch 32 — Time Jump, Cloud Dragon's Cloak, Shadow Jump

- **Spell notes:** mention-only conditions (a recast, an option, an attack's resolution).

See [verification](verification/phase-rank-3-batch-32.md).

### Rank 4 batch 17 — Vital Beacon, Healing Well

- **Food route taps:** a well's taps, and a beacon's weakening dice.

See [verification](verification/phase-rank-4-batch-17.md).

### Rank 3 batch 33 — Roaring Applause, Isolation

- **Note behaviours:** the manipulate-trait applause, and allies-only invisibility as a note.

See [verification](verification/phase-rank-3-batch-33.md).

### Rank 4 batch 18 — Diamond Dust

- **Lingering areas:** once per turn, and area notes.

See [verification](verification/phase-rank-4-batch-18.md).

### Rank 4 batch 19 — Life Siphon, Let Not the Fallen Rest

- **Direct healing:** per triggering rank, and allies at Dying N or less.

See [verification](verification/phase-rank-4-batch-19.md).

### Rank 5 batch 10 — Incarnates (Faerie Revelers, Skeletal Giant, Shadow Minuet)

- **Incarnate family:** a save plan for each phase, and buttons on the cast's card.
- **RollTwice row notes.**

See [verification](verification/phase-rank-5-batch-10.md).

### Rank 4 batch 20 — Talking Corpse (and three corpse notes)

- **"1 corpse" targets**, and **caster-scoped Deception penalties.**

See [verification](verification/phase-rank-4-batch-20.md).

### Rank 4 batch 21 — Commanding Lash, Electrified Crystal Ward

- **Borrowed effects** ("with the effects of the spell X"), and **hazard notes.**

See [verification](verification/phase-rank-4-batch-21.md).

### Rank 4 batch 22 — Elephant Form, Swarm Form

- **Battle-form ability Notes**, and **granted save actions** (a card button per action while the Effect lasts).

See [verification](verification/phase-rank-4-batch-22.md).

### Rank 4 batch 23 — Bind Heroic Spirit, Fortissimo Composition

- **Thrall-bound Effects** on the caster, and **spellshape Effects** (a check whose result is PF2e's Effect on the next composition's recipients).

See [verification](verification/phase-rank-4-batch-23.md).

### Rank 4 batch 24 — Retributive Pain, Conjured Clockwork

- **Triggered damage** (half the caster's last damage taken), and **optional Sustain growth** (an Ongoing control, once a round after the Sustain).

See [verification](verification/phase-rank-4-batch-24.md).

### Rank 3 batch 34 — Rouse Skeletons

- **Appearing damage and Sustain moves** in the lingering area; terrain sentences are never narration.

See [verification](verification/phase-rank-3-batch-34.md).

### Rank 5 batch 11 — Untwisting Iron Roots

- **Left terrain:** an instantaneous basic save's emanation becomes difficult terrain (a region the card places, which stays).

See [verification](verification/phase-rank-5-batch-11.md).

### Rank 3 batch 35 — Threatening Mimicry

- **Non-allied targets** (`non-ally-of-caster`), and the **fear-kept** note on Frightened rows.

See [verification](verification/phase-rank-3-batch-35.md).

### Rank 3 batch 36 — Incendiary Ashes

- **Weakness rows** proved by PF2e's per-degree Effects, and the **reduced-to-ashes** GM row note.

See [verification](verification/phase-rank-3-batch-36.md).

### Rank 3 batch 37 — Defensive Prescience

- **Attack-result damage:** misfortune on the triggering attack, and the spell's damage when the GM reports its result.

See [verification](verification/phase-rank-3-batch-37.md).

### Rank 4 batch 25 — Aromatic Lure

- **Lured** movement notes, and a **rolled stay** note.

See [verification](verification/phase-rank-4-batch-25.md).

### Rank 4 batch 26 — Dull Ambition

- **Initiative misfortune** notes (RollTwice on initiative) for hours, days or unlimited.

See [verification](verification/phase-rank-4-batch-26.md).

### Rank 4 batch 27 — Airlift, Animal Vision, Misty Memory, Wisdom of the Winds

- **Spell notes:** unwilling saves that only keep the spell off, a passive counteract, and an option's upper-bound duration. Note text is no longer truncated.

See [verification](verification/phase-rank-4-batch-27.md).

### Rank 3 batch 38 — Envenom Companion

- **Damage-triggered saves:** PF2e's Effect, plus a per-rank save button for the creature it damages. Also the `not-familiar` predicate.

See [verification](verification/phase-rank-3-batch-38.md).

### Rank 5 batch 12 — Lightning Storm

- **Sustain bolts:** the basic save repeated from the card once a round on a Sustain.

See [verification](verification/phase-rank-5-batch-12.md).

### Rank 5 batch 13 — Toxic Cloud, Incendiary Fog

- **Borrowed concealment** ("functions as Mist") on basic-save clouds, **breathing** creatures, and the **ignition** control that ends the spell.

See [verification](verification/phase-rank-5-batch-13.md).

### Rank 4 batch 28 — Rust Cloud

- **Cloud damage** sentences, and the **trait rust** rider (persistent damage plus the area's growth).

See [verification](verification/phase-rank-4-batch-28.md).

### Rank 4 batch 29 — Runic Impression

- **Rune choice** proved by PF2e's ChoiceSets and AdjustStrike, with the 8th-rank runes. A gated weapon choice is left to PF2e.

See [verification](verification/phase-rank-4-batch-29.md).

### Rank 4 batch 30 — Precious Metals

- **Material choice, Hardness and material change** proved by PF2e's ChoiceSets and ItemAlterations.

See [verification](verification/phase-rank-4-batch-30.md).

### Rank 4 batch 31 — Rebounding Barrier

- **Rebound barrier:** resistance against the triggering Strike, removed by its damage, plus rebound damage to the attacker.

See [verification](verification/phase-rank-4-batch-31.md).

### Rank 3 batch 39 — Focusing Hum

- **Action penalties on notes:** the caster's untyped skill penalty for two actions.

See [verification](verification/phase-rank-3-batch-39.md).

### Rank 4 batch 32 — Perfected Body

- **Save upgrade:** the caster's failed save one degree better (corrected on the module's card, or named for the GM).

See [verification](verification/phase-rank-4-batch-32.md).

### Rank 5 batch 14 — Quicken Time

- **Turn conditions** on a concealing area, and the "vice versa" concealment sentence.

See [verification](verification/phase-rank-5-batch-14.md).

### Rank 5 batch 15 — Horizon's Veil

- **Text area saves:** the text's save for an area whose item has none, with its rows; passing attacks are a note.

See [verification](verification/phase-rank-5-batch-15.md).

### Rank 3 batch 40 — Radiant Globe

- **Through-area saves:** the GM's control for attackers shooting through the area, with the save's rows.

See [verification](verification/phase-rank-3-batch-40.md).

### Rank 3 batch 41 — Sparkleskin

- **Triggered area saves** (a button for the creatures around the target), and **per-action bonuses** proved by PF2e's modifiers.

See [verification](verification/phase-rank-3-batch-41.md).

### Rank 3 batch 42 — Trade Items

- **Spell note** with the unwilling holder's save; items in a creature's possession are item targets.

See [verification](verification/phase-rank-3-batch-42.md).

### Rank 5 batch 16 — Glimmer of Charm

- **Aura save with immunity:** a turn-end Will save "with the following effects", with attitude note Effects. The 24-hour immunity stops later exposures.

See [verification](verification/phase-rank-5-batch-16.md).

### Rank 4 batch 33 — Vampiric Maiden

- **Typed temporary HP:** the void part of mixed damage, after PF2e's recorded IWR.

See [verification](verification/phase-rank-4-batch-33.md).

### Rank 4 batch 34 — Containment, Dirge of Remembrance

- **Force field Hit Points:** set per result and cast rank, on a note. Willing targets are a card note.
- **Dirge of Remembrance:** incorporeal creatures only. PF2e's bypass ignores their resistances. Semi-corporeal is a note.

See [verification](verification/phase-rank-4-batch-34.md).

### Rank 5 batch 17 — Blood Feast

- **Spell attack with half-damage temp HP:** a "gug" question on the card adds the extra dice.

See [verification](verification/phase-rank-5-batch-17.md).

### Rank 4 batch 35 — Dust Storm

- **Mist's concealment, borrowed:** with the area's own damage on entering or starting a turn inside (double for water-trait creatures). The rest are GM notes.

See [verification](verification/phase-rank-4-batch-35.md).

### Rank 3 batch 43 — Warning Stripes

- **Retaliation on touch or unarmed hit:** the marker goes on the caster or their animal companion.

See [verification](verification/phase-rank-3-batch-43.md).

### Rank 5 batch 18 — Unusual Anatomy

- **Proven PF2e Effect as a retaliation marker:** resistances and darkvision, plus acid damage on an unarmed or non-reach hit.

See [verification](verification/phase-rank-5-batch-18.md).

### Rank 4 batch 36 — Fallen Soldier's Lament

- **Moving area of enemy saves:** at cast and on each Sustain; Frightened 1 on a failure, 2 on a critical failure.

See [verification](verification/phase-rank-4-batch-36.md).

### Rank 4 batch 37 — Sacred Nimbus

- **Caster's-turn rain:** spirit damage to fiends, undead and spirit-weak creatures in the sustained area, with no save.

See [verification](verification/phase-rank-4-batch-37.md).

### Rank 3 batch 44 — Unbreaking Wave Advance

- **Push with collision damage:** the GM applies it from the push note, which gives it at the cast rank.

See [verification](verification/phase-rank-3-batch-44.md).

### Rank 4 batch 38 — Hot Air

- **Basic save plus a speech rider:** each auditory action or spell deals the spell's rank in fire damage while the spell lasts.

See [verification](verification/phase-rank-4-batch-38.md).

### Rank 5 batch 19 — Wronged Monk's Wrath

- **Two-type action variants:** written out as four rows, with the Deafened and persistent riders.

See [verification](verification/phase-rank-5-batch-19.md).

### Rank 3 batch 45 — Shroud of Flame

- **Sustained aura save plus a touch-retaliation marker:** Retaliate deals 3 fire (+1 per rank).

See [verification](verification/phase-rank-3-batch-45.md).

### Rank 5 batch 20 — Inevitable Disaster

- **Delayed accident:** the card waits for the GM's secret 1d4 rounds, and the GM picks the damage type.

See [verification](verification/phase-rank-5-batch-20.md).

### Rank 3 batch 46 — Elemental Annihilation Wave

- **Action variants:** the basic save, or four rows with pushes. The text's heightening corrects PF2e's bludgeoning step.

See [verification](verification/phase-rank-3-batch-46.md).

### Rank 5 batch 21 — Psychic Outburst

- **Action and two-round variants:** four rows with pushes. The push needs 3 actions in the "2 to 3" variant; the two-round variant hits enemies only.

See [verification](verification/phase-rank-5-batch-21.md).

### Rank 4 batch 39 — Mutilate

- **Self-cost save:** the caster's 1d4, and persistent bleed on a critical failure. The 3-action burst is a note.

See [verification](verification/phase-rank-4-batch-39.md).

### Rank 5 batch 22 — Scouring Pulse

- **Failure's persistent vitality with a halo note:** the note is removed with the persistent damage. The text's 2d8 applies at 8th rank.

See [verification](verification/phase-rank-5-batch-22.md).

### Rank 3 batch 47 — Overload Connection

- **Line to the familiar:** a basic save the card repeats on Sustain.

See [verification](verification/phase-rank-3-batch-47.md).

### Rank 4 batch 40 — Confront Selves

- **Sustain-repeated single-target save:** Clumsy 1 until the caster's next turn. A critical success ends the spell (note).

See [verification](verification/phase-rank-4-batch-40.md).

### Rank 3 batch 48 — Blood in the Water

- **Sustain-repeated hex save:** a water-terrain note when the target is damaged; the requirement, automatic Sustain and recast are notes.

See [verification](verification/phase-rank-3-batch-48.md).

### Rank 3 batch 49 — Gasping Marsh

- **Written basic rows read as a table:** a sustained turn-start area. The immunity stops repeat exposures.

See [verification](verification/phase-rank-3-batch-49.md).

### Rank 4 batch 41 — Ordained Purpose

- **GM's worse/better/neither choice per target:** the Drop Prone compulsion is a note.

See [verification](verification/phase-rank-4-batch-41.md).

### Rank 3 batch 50 — Hedge Prison

- **Prison notes:** the hedge's Hardness and Hit Points by result and rank. Larger targets are allowed by rank.

See [verification](verification/phase-rank-3-batch-50.md).

### Rank 3 batch 51 — Malicious Shadow

- **Sustain-repeated shadow Strike:** the physical damage type is the caster's pick; the rest are notes.

See [verification](verification/phase-rank-3-batch-51.md).

### Rank 3 batch 52 — Lashing Rope

- **Sustain-repeated rope Strike:** 3d6 slashing. The traits and the Trip result are notes.

See [verification](verification/phase-rank-3-batch-52.md).

### Rank 4 batch 42 — Soothing Spring

- **Soak card:** healing at the cast rank, removing Fatigued, for the pool's 16 places.

See [verification](verification/phase-rank-4-batch-42.md).

### Rank 3 batch 53 — Rend Magic

- **Attack plus damage when the target casts:** each spell is reported by the GM, and the damage is doubled after a critical hit.

See [verification](verification/phase-rank-3-batch-53.md).

### Rank 5 batch 23 — Chthonian Wrath

- **Rolled realm table:** the caster's pick types both untyped damage entries.

See [verification](verification/phase-rank-5-batch-23.md).

### Rank 3 batch 54 — Overwhelming Memory

- **A save whose caster picks the state:** the chosen memory's condition, or a note Effect, lasts until the start of the caster's next turn on the affected rows.

See [verification](verification/phase-rank-3-batch-54.md).

### Rank 3 batch 55 — Soul Cutter

- **Spell attack with one paragraph per action count:** each variant's own rows. The text's damage type is rolled over PF2e's variant data.

See [verification](verification/phase-rank-3-batch-55.md).

### Rank 3 batch 56 — Burning Trail

- **A damaging area placed later:** the cast's card places the trail the GM draws, for the rest of the duration.

See [verification](verification/phase-rank-3-batch-56.md).

### Rank 3 batch 57 — Spirit Veil

- **The caster's condition with an observer-relative second condition kept in the note:** heightened ranks add willing targets.

See [verification](verification/phase-rank-3-batch-57.md).

### Rank 4 batch 43 — Tortoise and the Hare

- **A foe's save whose rows also benefit another target:** after Finalize, the card grants the caster or an ally that row's condition.

See [verification](verification/phase-rank-4-batch-43.md).

### Rank 5 batch 24 — Control Water

- **Creatures of a trait saving with another spell's rows:** the caster targets them in the GM's unmarked area.

See [verification](verification/phase-rank-5-batch-24.md).

### Rank 3 batch 58 — Dive and Breach

- **Splashes along the caster's own movement:** a basic save on the targeted creatures. The movement is a note.

See [verification](verification/phase-rank-3-batch-58.md).

### Rank 5 batch 25 — Shadow Blast

- **The caster's damage type and area, the target's choice of save:** the card rolls each target's better save.

See [verification](verification/phase-rank-5-batch-25.md).

### Rank 5 batch 26 — Elemental Breath

- **A rolled element's variants:** each reads its own list item. The card handles the dice split and the terrain placement.

See [verification](verification/phase-rank-5-batch-26.md).

### Rank 3 batch 59 — Unseasonable Squall

- **Gust of Wind's burst cousin:** lingering saves, the flying question, and the critical failure's own roll with a push from the center.

See [verification](verification/phase-rank-3-batch-59.md).

### Rank 5 batch 27 — Impaling Spike

- **Impaling rows:** Immobilized until it Escapes, plus Off-Guard while immobilized. The ground and weakness parts are a GM note.

See [verification](verification/phase-rank-5-batch-27.md).

### Rank 4 batch 44 — Darkened Eyes

- **Suppressed senses:** a note Effect per row, plus the critical failure's Blinded with its end-of-turn save.

See [verification](verification/phase-rank-4-batch-44.md).

### Rank 4 batch 45 — Entangle Fate

- **Conditions gated on other targets' results:** they apply only when at least two of the cast's targets failed.

See [verification](verification/phase-rank-4-batch-45.md).

### Rank 3 batch 60 — Positive Attunement

- **Healing or harm again at the end of the caster's turns:** sustained Ongoing records, doubled after a critical failure.

See [verification](verification/phase-rank-3-batch-60.md).

### Rank 4 batch 46 — Freezing Touch

- **Persistent-only damage scaled by the result:** the card writes the halved or doubled persistent formula, which PF2e's multiplier doesn't do.

See [verification](verification/phase-rank-4-batch-46.md).

### Rank 5 batch 28 — Glacial Heart

- **An escalating end-of-turn save:** the condition rises on a failure and falls on a success, and ends at 0.

See [verification](verification/phase-rank-5-batch-28.md).

### Rank 3 batch 61 — Antlion Trap

- **A pit's lingering pull toward its center:** the heightened step grows the area and the pull.

See [verification](verification/phase-rank-3-batch-61.md).

### Rank 3 batch 62 — Undertow

- **A water area's swim penalties while inside:** PF2e's Effect is proved against the row and removed on leaving.

See [verification](verification/phase-rank-3-batch-62.md).

### Rank 5 batch 29 — Freezing Rain

- **A sustained area exposed only on Sustain:** the caster's freezing choice is the review.

See [verification](verification/phase-rank-5-batch-29.md).

### Rank 4 batch 47 — Living Terrain

- **A moving area that batters what it passes:** the lingering cast-and-Sustain exposures. The GM moves the region.

See [verification](verification/phase-rank-4-batch-47.md).

### Rank 5 batch 30 — Ancestral Winds

- **An area striking when cast and wherever it's moved on Sustain:** living creatures only.

See [verification](verification/phase-rank-5-batch-30.md).

### Rank 5 batch 31 — Gluttonous Growth and Grasping Earth (rank 4 batch 48)

- **Areas that hold and crush:** Sustain damages the creatures the spell holds, and a held creature doesn't save again.

See [verification](verification/phase-rank-5-batch-31.md).

### Rank 5 batch 32 — Flame Strike

- **Damage that cuts through its own type's protection:** half fire resistance, and the fire-immune take it untyped with a result one degree better.

See [verification](verification/phase-rank-5-batch-32.md).

### Rank 4 batch 49 — Ice Storm

- **A storm left by a save when cast:** the card places a sustained storm of difficult terrain that harms creatures ending their turns in it.

See [verification](verification/phase-rank-4-batch-49.md).

### Rank 4 batch 50 — Stifling Stillness

- **Air a creature strains to breathe:** a turn-start exposure with damage by the basic save and Fatigued whatever the result.

See [verification](verification/phase-rank-4-batch-50.md).

### Rank 4 batch 51 — Debilitating Dichotomy

- **A save the caster shares:** the card adds the caster, whose result is one degree better.

See [verification](verification/phase-rank-4-batch-51.md).

### Rank 4 batch 52 — Call the Blood

- **The target's blood drawn into the caster:** after Finalize, Sickened 2 for a living caster, or an undead caster's pick of temporary Hit Points and Quickened.

See [verification](verification/phase-rank-4-batch-52.md).

### Rank 4 batch 53 — Sanguine Mist

- **A cloud whose Sustain feeds the caster:** half the most a creature took on each Sustain, as temporary Hit Points for 1 minute.

See [verification](verification/phase-rank-4-batch-53.md).

### Rank 5 batch 33 — Invoke Spirits

- **A moved area whose Sustain exposures differ:** the critical failure's Fleeing only when cast.

See [verification](verification/phase-rank-5-batch-33.md).

### Rank 5 batch 34 — Divine Immolation

- **Damage of whichever type hurts more:** spirit instead of fire, read from PF2e's data; persistent rows written out.

See [verification](verification/phase-rank-5-batch-34.md).

### Rank 3 batch 63 — Noxious Metals

- **A table for some creatures only:** plant or wood creatures (PF2e's traits), or those the GM says have an anathema toward metal.

See [verification](verification/phase-rank-3-batch-63.md).

### Rank 5 batch 35 — Blood-Feasting Breath

- **Damage in one cone healing another:** the card heals the caster and the second cone's living creatures by the most one creature lost.

See [verification](verification/phase-rank-5-batch-35.md).

### Rank 4 batch 54 — Coral Eruption

- **Bursts that leave hazardous terrain:** the card places each burst; the per-square damage is the GM's control.

See [verification](verification/phase-rank-4-batch-54.md).

### Rank 5 batch 36 — Corrosive Muck

- **Separate pools striking once a round:** greater difficult terrain, one more pool every 2 ranks.

See [verification](verification/phase-rank-5-batch-36.md).

### Rank 5 batch 37 — Grisly Growths

- **A second save around the target:** unless it critically succeeds, a card starts the Will saves within 30 feet, with an hour's immunity.

See [verification](verification/phase-rank-5-batch-37.md).

### Rank 3 batch 64 — Cup of Dust

- **Hourly thirst damage:** the GM's Ongoing control deals each hour's damage for the day.

See [verification](verification/phase-rank-3-batch-64.md).

### Rank 4 batch 55 — Weapon Storm

- **Dice of the held weapon:** its die size (two-hand when held in both hands) and type, one more die each rank.

See [verification](verification/phase-rank-4-batch-55.md).

### Rank 5 batch 38 — Crucible of Iron

- **Rows that encase the target:** conditions until it Escapes, with persistent fire at the cast rank.

See [verification](verification/phase-rank-5-batch-38.md).

### Rank 5 batch 39 — Blister

- **Charges a save leaves:** a card pops one at a time, each a basic save around the target.

See [verification](verification/phase-rank-5-batch-39.md).

### Rank 3 batch 65 — Annunciation of the Outer Gate

- **A save only for those refusing an invitation:** Frightened by result, with the frightened floor and the agreement as notes.

See [verification](verification/phase-rank-3-batch-65.md).

### Rank 3 batch 66 — Croak Voice

- **A voice that fails and hurts:** the creature's own save control to end it, and the GM's control for auditory damage.

See [verification](verification/phase-rank-3-batch-66.md).

### Rank 4 batch 56 — Dreamer's Call

- **The caster's chosen course of action:** Fleeing, Prone, or a note on the failing rows, with Fascinated.

See [verification](verification/phase-rank-4-batch-56.md).

### Rank 4 batch 57 — Outcast's Curse

- **Skills rolled twice:** PF2e's Effects matched to rows by duration; attitude notes per row.

See [verification](verification/phase-rank-4-batch-57.md).

### Rank 4 batch 58 — Weaponize Secret

- **A rune discharged on attack:** the GM's control deals the damage once and ends the critical failure's persistent damage.

See [verification](verification/phase-rank-4-batch-58.md).

### Rank 4 batch 59 — Clownish Curse

- **A generated skill curse:** roll twice and failures become critical failures, for each row's time.

See [verification](verification/phase-rank-4-batch-59.md).

### Rank 4 batch 60 — Sage's Curse

- **Skills rolled twice, with Recall Knowledge worse on a critical failure:** PF2e's Effects with their result choice.

See [verification](verification/phase-rank-4-batch-60.md).

### Rank 4 batch 61 — Channel Arrogance

- **A quicker, weaker cast:** the GM's answer gives one degree better; Fascinated rows with the praise note.

See [verification](verification/phase-rank-4-batch-61.md).

### Rank 3 batch 67 — Censure Falsehoods

- **Lies that make it sicker:** the GM's control raises the sickened value to the stated maximum; the flat check on speech is a note.

See [verification](verification/phase-rank-3-batch-67.md).

### Rank 4 batch 62 — Daydreamer's Curse

- **A generated curse on checks and concentrate actions:** PF2e's roll-twice and degree adjustments keyed to the concentrate trait.

See [verification](verification/phase-rank-4-batch-62.md).

### Rank 4 batch 63 — Bestial Curse

- **A bestial form:** Clumsy, PF2e's weakness Effects bound by duration, Strike and flat-check notes.

See [verification](verification/phase-rank-4-batch-63.md).

### Rank 4 batch 64 — Infectious Melody

- **A penalty per result, by duration:** PF2e's three Effects bound by their times, with the singing note.

See [verification](verification/phase-rank-4-batch-64.md).

### Rank 4 batch 65 — Delusional Pride

- **Overconfidence:** the GM's control turns each failure into a penalty, −2 on a second.

See [verification](verification/phase-rank-4-batch-65.md).

### Rank 4 batch 66 — Unsettling Knowledge

- **Knowledge escaped by understanding it:** the creature's Recall Knowledge control ends Fascinated, frightens it, and holds a floor on a failure.

See [verification](verification/phase-rank-4-batch-66.md).

### Rank 4 batch 67 — Seal Fate

- **A weakness to the caster's chosen type:** PF2e's Effect preset from the card, for each result's time; the death rule as a note.

See [verification](verification/phase-rank-4-batch-67.md).

### Rank 4 batch 68 — Steal Voice

- **A stolen voice:** a Voiceless note Effect for each failing result's time; immunity for 1 minute; voiceless creatures left out by the GM.

See [verification](verification/phase-rank-4-batch-68.md).

### Rank 4 batch 69 — Vision of Beauty

- **An image only the target sees:** Stupefied and Fascinated for each row's time; the movement toward the image a note.

See [verification](verification/phase-rank-4-batch-69.md).

### Rank 4 batch 70 — Compel True Name

- **Per-result immunity to one caster:** the immunity now supports each result's own time and a per-caster key. The obedience is a Compelled note for 10 minutes or 8 hours.

See [verification](verification/phase-rank-4-batch-70.md).

### Rank 4 batch 71 — Favorable Review

- **Speech bound to praise:** a note for 1 week, or unlimited with the attitude shift; the subject a card reminder.

See [verification](verification/phase-rank-4-batch-71.md).

### Rank 4 batch 72 — Unsettling Perspective

- **Text damage with information rows:** the text's mental damage (PF2e has none) by the rows, Stunned 1 on a critical failure; what the caster learns a GM reminder.

See [verification](verification/phase-rank-4-batch-72.md).

### Rank 4 batch 73 — Inevitable Destination

- **A tether an Escape ends:** the Speed penalty a note with PF2e's modifier; notes can now carry an Escape against the spell DC; the pull a GM reminder, with Prone.

See [verification](verification/phase-rank-4-batch-73.md).

### Rank 4 batch 74 — Stasis

- **Time stopped:** Stunned 1; a Stasis note for 1 round, or 3 rounds that the end-of-turn Will save shortens.

See [verification](verification/phase-rank-4-batch-74.md).

### Rank 4 batch 75 — Trickster's Twin

- **Disbelief by Will save:** the Disbelieve control now supports a Will save with a threshold (automatic, success, critical success), per result.

See [verification](verification/phase-rank-4-batch-75.md).

### Rank 5 batch 40 — Synesthesia

- **PF2e's Effects by result:** the round and minute Effects, the minute one preset to the result (Stunned 2 on a critical failure); Concealed a note.

See [verification](verification/phase-rank-5-batch-40.md).

### Rank 4 batch 76 — Roar of the Dragon

- **The cast's caster Effect:** PF2e's Effect on the caster once per cast, with a toggle for its "dragons in the area" option; enemies other than dragons save.

See [verification](verification/phase-rank-4-batch-76.md).

### Rank 5 batch 41 — Hallucination

- **Disbelief with a penalty:** a Hallucination note per affected row with the Will-save Disbelieve; the critical failure's –4 circumstance penalty rides on the roll.

See [verification](verification/phase-rank-5-batch-41.md).

### Rank 4 batch 77 — Luring Wail

- **A lingering lure:** the emanation's saves at the cast and on entering; Fascinated until it leaves, the compulsion a note while fascinated; the named creature's –2 the GM's answer.

See [verification](verification/phase-rank-4-batch-77.md).

### Rank 5 batch 42 — Subconscious Suggestion

- **A suggestion held for its trigger:** a note until the caster's next preparations, saying how long the triggered suggestion lasts.

See [verification](verification/phase-rank-5-batch-42.md).

### Rank 5 batch 43 — Wish-Twisted Form

- **PF2e's Effects with the caster's type:** the round and minute Effects, preset to the chosen energy type and the result; the resistance reduction a note at the rank.

See [verification](verification/phase-rank-5-batch-43.md).

### Rank 5 batch 44 — Wave of Despair

- **A save at the start of each turn:** notes can now carry a start-of-turn save whose failure grants a condition for that turn (Slowed 1); no reactions a note.

See [verification](verification/phase-rank-5-batch-44.md).

### Rank 4 batch 78 — Shared Nightmare

- **A timed condition on the caster:** "You are Confused for 1 round." grants Confused to the caster for that time; the target's Confused and first-action note by result.

See [verification](verification/phase-rank-4-batch-78.md).

### Rank 4 batch 79 — Planar Tether

- **Notes can carry a ward:** a Planar tether note per result's time, with Ongoing spells' counteract control at the cast rank.

See [verification](verification/phase-rank-4-batch-79.md).

### Rank 5 batch 45 — Vindicator's Judgment

- **A weakness only against the caster:** a Judgment note with the weakness at the cast rank, for each result's time; the hunted prey the GM's answer.

See [verification](verification/phase-rank-5-batch-45.md).

### Rank 3 batch 68 — Behold the Weave

- **A locked timeline:** a note for the target's next turn with how much it commits (one action, two, or all); the 7th-rank area a reminder.

See [verification](verification/phase-rank-3-batch-68.md).

### Rank 3 batch 69 — Mind Reading

- **Information read from PF2e:** the Intelligence comparison whispered to the GM and the caster; immunity to this caster for every result; the thoughts the GM's.

See [verification](verification/phase-rank-3-batch-69.md).

### Rank 5 batch 46 — Slither

- **Biting, holding snakes:** the lingering burst's saves; the rows' text damage (persistent at the cast rank) and the hold until it Escapes; the snakes a reminder.

See [verification](verification/phase-rank-5-batch-46.md).

### Rank 5 batch 47 — Sawtooth Terrain

- **Serrated terrain:** the lingering burst's terrain and saves; the rows' slashing and bleed; the Speed penalty a note with PF2e's modifier until healed.

See [verification](verification/phase-rank-5-batch-47.md).

### Rank 5 batch 48 — Consuming Darkness

- **An emanation that grows on Sustain:** the lingering saves of enemies entering or starting a turn in it; Speed penalties until they leave; the radius +5 feet each round's first Sustain.

See [verification](verification/phase-rank-5-batch-48.md).

### Rank 5 batch 49 — Whispers of a Dead Goddess

- **Whispers that hold:** the lingering burst's saves, Stunned 1, the critical success's immunity; staying and the suggestion notes.

See [verification](verification/phase-rank-5-batch-49.md).

### Rank 4 batch 80 — Ranage's Circle

- **Clumsy until it moves:** a note granting Clumsy at the row's value (the GM ends it); the hold until it Escapes; the adjacent terrain a reminder.

See [verification](verification/phase-rank-4-batch-80.md).

### Rank 3 batch 70 — Crisis of Faith

- **A condition gated on the caster's answer:** the divine-caster question sets d8 dice and the failure's Stupefied; the critical failure's ban a note.

See [verification](verification/phase-rank-3-batch-70.md).

### Rank 3 batch 71 — Shift Blame

- **A rewritten memory:** every result immune for 24 hours; the failure's (and critical failure's) memory a note.

See [verification](verification/phase-rank-3-batch-71.md).

### Rank 5 batch 50 — Pack Breaker

- **A chained save:** each affected creature's card starts the same save for its former allies (the GM's targets); Unfriendly by a note; Confused by the rows.

See [verification](verification/phase-rank-5-batch-50.md).

### Rank 4 batch 81 — Shape Stone

- **A save or a skill check:** the creatures atop the stone roll their better of Reflex and Acrobatics; Prone on a failure; falling off a reminder.

See [verification](verification/phase-rank-4-batch-81.md).

### Rank 4 batch 82 — Waking Dream

- **Confused for a sustained spell, with an end-of-turn save:** the failure's confusion ends early on a success; concealment to it a note.

See [verification](verification/phase-rank-4-batch-82.md).

### Rank 5 batch 51 — Mind Probe

- **A question control:** each Sustain's question rolls the creature's Deception against the DC (penalized on a critical failure); the outcome whispered to the GM.

See [verification](verification/phase-rank-5-batch-51.md).

### Rank 3 batch 72 — Heart's Desire

- **Stupefied by row, with notes:** Stupefied 2 for 1 round or 1 minute; the reaction penalty, lost reactions and difficult terrain notes.

See [verification](verification/phase-rank-3-batch-72.md).

### Rank 3 batch 73 — Enthrall

- **An audience held while sustained:** the GM's bonus per target; Fascinated for the spell; a per-creature end save with immunity; a newcomers' card on each Sustain.

See [verification](verification/phase-rank-3-batch-73.md).

### Rank 5 batch 52 — Infectious Comedy

- **A joke that spreads:** Slowed and no-reaction notes for the sustained spell; a spread card for each Sustain.

See [verification](verification/phase-rank-5-batch-52.md).

### Rank 5 batch 53 — Geyser

- **A blast with a fall:** the rows' damage plus the fall's bludgeoning (half the push); staying aloft and the steam a reminder.

See [verification](verification/phase-rank-5-batch-53.md).

### Rank 3 batch 74 — Garden of Stone

- **A stalagmite's eruption:** the cast's basic save; the push, terrain and stalagmite a reminder.

See [verification](verification/phase-rank-3-batch-74.md).

### Rank 5 batch 54 — Mirror Malefactors

- **A ring that ends on a critical success:** the sustained target's repeated basic save; Frightened 1 locked while it lasts; a critical success ends the spell.

See [verification](verification/phase-rank-5-batch-54.md).

### Rank 3 batch 75 — Wall of Radiance

- **A wall as a lingering line:** moving into the placed wall is a basic save against its fire (heightened); the dazzle and concealment a reminder.

See [verification](verification/phase-rank-3-batch-75.md).

### Rank 4 batch 83 — Asterism

- **Lines as one lingering area:** each line is a shape of the area's region; entering one or starting a turn in one is a basic save (once a turn, heightened); anchors and breaking lines a reminder.

See [verification](verification/phase-rank-4-batch-83.md).

### Rank 4 batch 84 — Remember the Lost

- **Per-target larger dice (`targetUpgrade`):** the caster's yes or no for each target on the card; a "yes" target takes the larger roll in place of the shared one, scaled by its result.

See [verification](verification/phase-rank-4-batch-84.md).

### Rank 3 batch 76 — Swamp of Sloth

- **A burst the actions widen (`lingering.actionStep`):** the actions spent are asked when the area starts; each one past the first adds its feet. The turn-end basic save and difficult terrain are the lingering area's.

See [verification](verification/phase-rank-3-batch-76.md).

### Rank 5 batch 55 — Unravel Existence

- **Gated row damage:** a row's damage formula can carry the row's GM question; it's rolled and applied only for a target the GM answered yes for (Unravel Existence's creatures from other planes).

See [verification](verification/phase-rank-5-batch-55.md).

### Rank 3 batch 77 — Steal Shadow

- **A Sustain's basic save (`sustainStrike`):** the native sustained record keeps the targets whose save failed; the first Sustain each round opens a basic save card of the spell's damage for them.

See [verification](verification/phase-rank-3-batch-77.md).

### Rank 4 batch 85 — Captivating Adoration

- **One save per creature in an aura:** a per-degree immunity (the rows' hour; the spell's minute for failures) keeps re-entering creatures from saving again; the failure's Fascinated ends on leaving the area.

See [verification](verification/phase-rank-4-batch-85.md).

### Rank 3 batch 78 — Skyglass Prison

- **The `cage-broken` trigger:** a held row's note whose control deals the shards once (Escape, destruction or Dismiss) and ends that creature's restraint from the cast.

See [verification](verification/phase-rank-3-batch-78.md).

### Rank 4 batch 86 — Implement of Destruction

- **The `weapon-hit` trigger:** a row note's control for the weapon's hit (once, or persistent each hit) and, with `criticalCondition`, a critical-hit control adding the condition (linked to the persistent damage when the row says so).

See [verification](verification/phase-rank-4-batch-86.md).

### Rank 4 batch 87 — Bloodspray Curse

- **The `strike-wound` trigger:** one control per damage type of a wounding Strike, once a round: the row's formula of that type, with an optional extra persistent roll.

See [verification](verification/phase-rank-4-batch-87.md).

### Rank 4 batch 88 — Achaekek's Clutch

- **The `bleed-gained` trigger:** the GM gives the persistent damage the creature just gained; that amount is dealt as the stated type, once a round.

See [verification](verification/phase-rank-4-batch-88.md).

### Rank 5 batch 56 — Over the Coals

- **The `noncompliance` trigger:** a row note's control (once) dealing persistent damage and applying the row's conditions when the GM reports the target didn't comply.

See [verification](verification/phase-rank-5-batch-56.md).

### Rank 3 batch 79 — Unravel Knowledge

- **The `ability-used` trigger** (variants with their own dice) and the **`toggle-penalty-effect` proof** (PF2e's toggle and the penalty it gates).

See [verification](verification/phase-rank-3-batch-79.md).

### Rank 4 batch 89 — Fallow Field

- **Held healing (`lingering.healingSave`):** the area's marker on creatures inside; their PF2e healing is held, the save rolled, and the result's share restored (immune after a critical success).

See [verification](verification/phase-rank-4-batch-89.md).

### Rank 4 batch 90 — Ymeri's Mark

- **Held row conditions** (`locked` → PF2e's `restrict`) and the **`detonate` trigger**: Dismiss opens a basic save card for the creatures around the marked one (`detonationPlan`) and ends the spell.

See [verification](verification/phase-rank-4-batch-90.md).

### Rank 3 batch 80 — Lightning Lasso

- **A Sustain's hold (`sustainHold`):** each round's first Sustain deals the flat rank damage to the targets this cast still holds and restarts their escapable Effect.

See [verification](verification/phase-rank-3-batch-80.md).

### Rank 4 batch 91 — Call the Ten

- **Bolster with a heightened resistance:** the card's per-target yes (shielded) gives PF2e's resistance Effect and no save; a basic save may use it.

See [verification](verification/phase-rank-4-batch-91.md).

### Rank 4 batch 92 — Draw the Lightning

- **The `weapon-cast` Effect claim** (PF2e's weapon choice, toggle and gated dice on the caster) and **dice added on a basic save** by the caster's yes.

See [verification](verification/phase-rank-4-batch-92.md).

### Rank 4 batch 93 — Cloak of Light

- **A dual-mode aura** (Heal's living-healed / undead-saves at each adjacent creature's turn start) and the **caster's light** (`lingering.casterLight`, a TokenLight Effect for the area's life).

See [verification](verification/phase-rank-4-batch-93.md).

### Rank 4 batch 94 — Tomorrow's Dawn

- **Caster benefit proof** reads PF2e's TokenLight and a resistance with its heightened values; an adjacent aura's critical-failure condition lasts with the area.

See [verification](verification/phase-rank-4-batch-94.md).

### Rank 4 batch 95 — Door to Beyond

- **A child area:** a lingering record started with its parent (`parentCastId`) and ended with it — Door to Beyond's squares beside the door, dealing the spell's damage as turns end.

See [verification](verification/phase-rank-4-batch-95.md).

### Rank 5 batch 57 — Etheric Shards

- **A move's save (`lingering.moveSave`):** the GM's control with the squares traversed opens the creature's basic save card for that many dice (`moveSaveExposurePlan`).

See [verification](verification/phase-rank-5-batch-57.md).

### Rank 5 batch 58 — Instant Minefield

- **Mines (`lingering.mines`):** the GM's control opens one basic save card for the creatures each explosion catches and counts the mines; after the last the spell ends.

See [verification](verification/phase-rank-5-batch-58.md).

### Rank 3 batch 81 — Bloody Tendrils

- **A reach around several targets:** a targets-centred lingering aura of the stated feet, exposed at turn end (enemies only), with up to the stated number of targets at the cast rank.

See [verification](verification/phase-rank-3-batch-81.md).

### Rank 4 batch 96 — Purifying Veil

- **A target's own GM action:** a targets-centred lingering area (concealment) whose GM control exposes the target and then ends the spell.

See [verification](verification/phase-rank-4-batch-96.md).

### Rank 4 batch 97 — Personal Runewell

- **Allies' member Effect in a placed area:** the caster holds it only while inside; `notOwnSpell` keeps the area's own spell (its bolts) from being amplified.

See [verification](verification/phase-rank-4-batch-97.md).

### Rank 5 batch 59 — Steal the Sky

- **Damage-only gated rows:** a row's damage behind the GM's question with no gated condition beside it; the card asks it (`gmQuestionGate` reads the formula's gate).

See [verification](verification/phase-rank-5-batch-59.md).

### Rank 4 batch 98 — Overflowing Sorrow

- **Notes while in the area (`whileInArea`):** a lingering exposure's note removed when the creature leaves; a note may carry a −1 to −4 modifier to skill and Perception checks.

See [verification](verification/phase-rank-4-batch-98.md).

### Rank 4 batch 99 — Morass of Ages

- **In-area granted conditions:** a note's GrantItem lasting while the creature is inside; the caster's emanation grows on its optional control up to a stated maximum.

See [verification](verification/phase-rank-4-batch-99.md).

### Rank 3 batch 82 — Mycological Malady

- **Spell-bound afflictions:** a block that ends when the spell ends hands off on a sustained cast; the Pseudo Afflictions Effect is attached to the cast's Ongoing record and ends with it.

See [verification](verification/phase-rank-3-batch-82.md).

### Rank 5 batch 60 — Curse of Death

- **Afflictions:**
  - an immunity "regardless of the result", which outlives a lasting cast;
  - a stage cap, made by trimming the Effect's stage labels;
  - a success row that afflicts, sent to the handler as the degree that starts that stage;
  - rank-counted stage damage, written for Pseudo Afflictions at the cast's rank.

See [verification](verification/phase-rank-5-batch-60.md).

### Rank 3 batch 83 — Impending Doom

- **Cast timelines:** later rounds' conditions applied as each of the spell's rounds begins (at the caster's turn), and the end's damage rolled once at a per-degree multiplier; the Ongoing record keeps the cast alive until then.

See [verification](verification/phase-rank-3-batch-83.md).

### Rank 3 batch 84 — Coral Scourge

- **Growing conditions:** a condition Effect that grows by a step as each of its creature's turns begins (to a maximum, which grants a further condition for the cast), with an Interact that ends the cast or lowers it by 1 (0 keeps the cast).

See [verification](verification/phase-rank-3-batch-84.md).

### Rank 3 batch 85 — Infectious Ennui

- **Spread saves of their own:** a per-cast chain card carrying a separate spread plan (and its heightened plan), immune to this casting only; from 5th the spread's conditions are attached to the original cast and end with it.

See [verification](verification/phase-rank-3-batch-85.md).

### Rank 3 batch 86 — Weapon Tide

- **Action-shaped waves:** PF2e's variants as a chosen-type basic save; the card's terrain (3 actions only, or the two rounds' hazard on entering or ending a turn, once a turn, of the chosen type).

See [verification](verification/phase-rank-3-batch-86.md).

### Rank 3 batch 87 — Ring of Truth

- **Placed truth areas:** one save per creature, every result a note while inside carrying the area's skill penalty (PF2e's modifier); re-entry a reminder.

See [verification](verification/phase-rank-3-batch-87.md).

### Rank 4 batch 100 — Shaken Confidence

- **Next-roll misfortune by the trigger's kind:** the caster's option on the card; each failing row's note carries RollTwice on that roll, removed after the roll or at the end of the target's next turn.

See [verification](verification/phase-rank-4-batch-100.md).

### Rank 4 batch 101 — Mirror's Misfortune

- **Illusory duplicates:** a token of the caster's image for the spell's duration; the GM's control rolls the targeted attacker's save and shatters it (the spell ends); misfortune counted over the next N attack rolls (`consumeOn.count`).

See [verification](verification/phase-rank-4-batch-101.md).

### Rank 3 batch 88 — Cyclone Rondo

- **A Sustain's own basic save:** a lingering area's initial rows (Prone) with each Sustain's exposure a basic save of its own damage formula at the cast rank (`sustainBasic`).

See [verification](verification/phase-rank-3-batch-88.md).

### Rank 5 batch 61 — Strange Geometry

- **Separate placed cubes:** one save per creature on casting or entering; a failure's note for the spell with a disbelief that ends only that note.

See [verification](verification/phase-rank-5-batch-61.md).

### Rank 5 batch 62 — Pressure Zone

- **Outside-only recurring saves and a condition's own action save:** the end-of-turn save only while the creature is outside the cast's area; a per-condition 1-action save that removes just that grant.

See [verification](verification/phase-rank-5-batch-62.md).

### Rank 3 batch 89 — Ibex's Harvest

- **Action-count tales:** the actions spent set the targets: temporary Hit Points (heightened), or a chosen creature's basic save card (its own plan) plus temporary Hit Points for the others in the emanation.

See [verification](verification/phase-rank-3-batch-89.md).

### Rank 3 batch 90 — Stone Lance

- **Until-Escape Speed penalties and damage on Escape:** a generated Speed penalty lasting the spell's time unless the creature Escapes; an Escape-ended Effect may deal persistent damage to the escaper.

See [verification](verification/phase-rank-3-batch-90.md).

### Rank 5 batch 63 — Celestial Brand

- **Brands for the caster's side:** PF2e's marking Effect on the caster and every scene ally, its TokenMark on the trait-bound target; the target's immunity after the brand.

See [verification](verification/phase-rank-5-batch-63.md).

### Rank 4 batch 102 — Prophet's Luck

- **Foretold saves:** a prediction on the card; the target's save modifier used up by its next save; the result's aftermath on the caster or the target for the spell's time.

See [verification](verification/phase-rank-4-batch-102.md).

### Rank 4 batch 103 — Winning Streak

- **Streaks of critical hits:** Quickened held for the streak; the GM's control quickens each critical-hitting ally within the distance and extends it; a quiet full round ends it.

See [verification](verification/phase-rank-4-batch-103.md).

### Rank 3 batch 91 — Tracking Mayflies

- **Spell Strikes with conditions:** a GM-answered Off-Guard for one Strike (a temporary Effect around PF2e's roll) and a condition on a successful Strike.

See [verification](verification/phase-rank-3-batch-91.md).

### Rank 3 batch 92 — Martyr's Intervention

- **Taking the killing blow's rest:** the target back at 1 Hit Point, the caster taking the damage beyond that (as dealt), both wounded one more.

See [verification](verification/phase-rank-3-batch-92.md).

### Rank 5 batch 64 — Rallying Banner

- **Auras around a creature:** a target-centred lingering aura (the target included) whose generated Effect the caster's allies inside hold; the bearer's note; the GM moves it to a new bearer.

See [verification](verification/phase-rank-5-batch-64.md).

### Rank 5 batch 65 — Spellmaster's Ward

- **Runes against spell damage:** the actions set the runes on a sustained Effect; a spell's damage-taken message spends them, each restoring its roll until that damage is gone.

See [verification](verification/phase-rank-5-batch-65.md).

### Rank 4 batch 104 — Vital Luminance

- **A counter Effect as a reservoir:** PF2e's Effect's counter raised each caster turn; controls spending half of it on an undead (once a round) or all of it on the Dismiss.

See [verification](verification/phase-rank-4-batch-104.md).

### Rank 3 batch 93 — Warding Aggression

- **A ward from a Strike's result:** PF2e's degree Effect (ChoiceSet preset, TokenMark on the foe) after the card's Strike; kept by melee hits each caster turn, ended by a turn without one or the foe's death.

See [verification](verification/phase-rank-3-batch-93.md).

### Rank 3 batch 94 — Moth's Supper

- **Healing every stretch of world time:** the caster's Effect heals the item's dice per whole interval passed (`updateWorldTime`, and up to its end when it's deleted). The once-only extra for being treated is a card button.

See [verification](verification/phase-rank-3-batch-94.md).

### Rank 3 batch 95 — Whirling Scarves

- **A snag control on a rule-set card:** the targeted attacker's chosen melee Strike takes the penalty (an `item:id` predicate), turn-bound to the end of its turn or of its next.

See [verification](verification/phase-rank-3-batch-95.md).

### Rank 3 batch 96 — Sign of Conviction

- **A caster Effect on a sustained attack card (`castEffect`):** made with the first attack and keyed by the spell message; it ends on movement, and refuses later attacks once gone. Sustain attacks may be any number per turn (`perTurn: "any"`).

See [verification](verification/phase-rank-3-batch-96.md).

### Rank 3 batch 97 — Life Pact

- **A pact against a lethal blow:** on PF2e's damage update that would reach 0 HP (`preUpdateActor`, `damageTaken`), the update is raised by the other members' lost Hit Points just before the damage; then the pact's Effects end.

See [verification](verification/phase-rank-3-batch-97.md).

### Rank 3 batch 98 — Bonewall Bulwark

- **A conjured object with stated statistics:** a fixed AC, no saves and a larger size on the conjured-creature token, and a start-of-turn repeat window (`trigger: "turn-start"`, no attack on the cast).

See [verification](verification/phase-rank-3-batch-98.md).

### Rank 3 batch 99 — Horde of Underlings

- **A horde of trivial conjured tokens:** one unlinked actor, a token each; it attacks automatically on the cast, and a control moves each toward the nearest enemy, then attacks again (`minionHordeAct`).

See [verification](verification/phase-rank-3-batch-99.md).

### Rank 3 batch 100 — Mad Monkeys

- **A sustained area with a picked mischief:** the module rolls the Steal or each targeted creature's save and applies its row (timed condition, note, immunity, or a note lasting until the spell's Effect ends).

See [verification](verification/phase-rank-3-batch-100.md).

### Rank 3 batch 101 — One with Stone

- **The plant-form family reads stone too:** the substance comes from the text, and the battle form's traits from the data (none for a stone).

See [verification](verification/phase-rank-3-batch-101.md).

### Rank 3 batch 102 — Thief of Fortune

- **A siphoning counteract (`op.siphon`, `maxSeconds`):** the countered spell Effect stays, the caster gains a copy, and both keep half the remaining rounds.

See [verification](verification/phase-rank-3-batch-102.md).

### Rank 3 batch 103 — Ki Cutting Sight

- **A check that readies marked damage:** the caster's check at the target's DC; on a success, PF2e's Effect with its toggle swapped for a mark on the target, used up by the first damage roll against it. A Strike also matches `self:action:slug:strike`.

See [verification](verification/phase-rank-3-batch-103.md).

### Rank 3 batch 104 — Organsight

- **The check-mark family's persistent form:** the Effect lasts its time; consumption removes only the mark (`disarmMark`, limited by damage type); the check repeats once per later turn (`checkMarkAgain`).

See [verification](verification/phase-rank-3-batch-104.md).

### Rank 3 batch 105 — Consecrate Flesh

- **Retaliation with a marker plus additions:** PF2e's Effect (checked) plus the text's healing dice on `spell-healing`; Retaliate for the touch damage.

See [verification](verification/phase-rank-3-batch-105.md).

### Rank 3 batch 106 — Bone Flense

- **A weapon imbued through PF2e's Effects:** the weapon picked on the card (written into the rules), the bleed dice made persistent, and a skeleton toggle added.

See [verification](verification/phase-rank-3-batch-106.md).

### Rank 3 batch 107 — Ranger's Bramble

- **A borrowed spell plus a critical-failure rider:** the referenced spell's text for this spell's area and save, and the critical failure row's persistent damage from the inline roll.

See [verification](verification/phase-rank-3-batch-107.md).

### Rank 3 batch 108 — Phantom Prison

- **Trickster's Twin's family, prison form:** the cast's Will save, and the failure's note with a Will Disbelieve control that ends the spell.

See [verification](verification/phase-rank-3-batch-108.md).

### Rank 3 batch 109 — Zombie Horde

- **A thrall horde as a lingering area:** the area's own wording, and a GM control growing the region by the thralls destroyed (to the maximum).

See [verification](verification/phase-rank-3-batch-109.md).

### Rank 3 batch 110 — Primal Chorus

- **A one-roll initiative toggle:** a rule-set Effect for a day; "check-with-option" consumption now covers initiative rolls.

See [verification](verification/phase-rank-3-batch-110.md).

### Rank 3 batch 111 — Oneiric Mire

- **A lingering illusion with an end-of-turn save:** the rows last until Escape (the spell's own time kept for lingering exposures); the affected note's end-save removes the creature's effects and gives immunity on a critical success.

See [verification](verification/phase-rank-3-batch-111.md).

### Rank 3 batch 112 — Wall of Wind

- **A wall as a lingering line:** walking terrain, the flyer's save on entering, turn-long movement notes, and a GM-directed push on a critical failure.

See [verification](verification/phase-rank-3-batch-112.md).

### Rank 3 batch 113 — Pyrotechnics

- **Lingering modes (`lingeringModes`):** one compiled lingering plan per mode chosen when casting; the card asks the mode and starts its plan.

See [verification](verification/phase-rank-3-batch-113.md).

### Rank 3 batch 114 — Shifting Sand

- **In-area Effects for lingering areas (`memberRules`, `syncLingeringMembers`):** the area's rules on each creature standing in it, at the cast rank (bracketed values), removed when it leaves.

See [verification](verification/phase-rank-3-batch-114.md).

### Rank 3 batch 115 — Aqueous Orb

- **A rolling orb as a GM-action lingering area:** the GM's control triggers the save (once a turn per creature); the engulfed note ends on an Escape.

See [verification](verification/phase-rank-3-batch-115.md).

### Rank 3 batch 116 — Curse of Lost Time

- **Save modes by the target's kind (`saveModes`, `chooseSaveMode`):** one compiled save plan per kind; the card asks before the save starts.

See [verification](verification/phase-rank-3-batch-116.md).

### Rank 3 batch 117 — Circle of Protection

- **A target aura for everyone inside (`everyone`):** the alignment chosen; toggled bonuses with distinct modifier slugs.

See [verification](verification/phase-rank-3-batch-117.md).

### Rank 3 batch 118 — Invoke the Harrow

- **Option notes with rules and a counted end-save:** the caster's suit; the 6th-rank rows as a heightened variant; `endSave.successes`.

See [verification](verification/phase-rank-3-batch-118.md).

### Rank 4 batch 105 — Reflective Scales

- **A stored burst:** a Resistance Effect counting what it prevents (the damage wrapper), released as a compiled basic save given the stored dice.

See [verification](verification/phase-rank-4-batch-105.md).

### Rank 4 batch 106 — Cinder Swarm

- **Aura modes:** a target's 5-foot aura including it, exposed on Sustain; each kind a save plan of the text's rank formula.

See [verification](verification/phase-rank-4-batch-106.md).

### Rank 4 batch 107 — Sudden Swarm

- **A familiar's swarm form:** a generated Effect at the cast rank; the bites a compiled basic save of the item's damage, once per turn.

See [verification](verification/phase-rank-4-batch-107.md).

### Rank 4 batch 108 — Vital Seed

- **A seed that drains and then erupts:** the spell attack (a willing target is automatic), a compiled basic save for the creatures around the target, and Erupt reading that card's damage to heal (or harm an undead host).

See [verification](verification/phase-rank-4-batch-108.md).

### Rank 4 batch 109 — Spiritual Attunement

- **A plane picked on the card:** the rule-set gains a `choice` of options with their own rules, and a rank `scale`. The alignment is mapped to the remaster (good is holy, evil is unholy).

See [verification](verification/phase-rank-4-batch-109.md).

### Rank 4 batch 110 — Pest Swarm

- **An incarnate with listed options:** each option has its own Arrive and Depart, read from the text (the riders as rows), and an affliction exposure is its own save at its DC.
- **Card terrain lasting rounds:** an incarnate phase can now place terrain lasting whole rounds.

See [verification](verification/phase-rank-4-batch-110.md).

### Rank 4 batch 111 — Crystallized Vapors

- **A sustained spell attack with a terrain emanation around the caster:** a region following the caster, with selective difficult terrain (the caster exempt), made with the first attack.

See [verification](verification/phase-rank-4-batch-111.md).

### Rank 4 batch 112 — Ghostly Tragedy

- **A scene the caster pays for when it ends:** an Effect whose End control deals the stated dice per participant (the GM's count).

See [verification](verification/phase-rank-4-batch-112.md).

### Rank 4 batch 113 — Pernicious Poltergeist

- **A sustained area with listed effects:** each effect is a save of its own text, picked on the card once a round while the sustained Effect lasts.

See [verification](verification/phase-rank-4-batch-113.md).

### Rank 4 batch 114 — Safeguard Secret

- **Effect-note proof:** the stated bonus is checked against PF2e's rule, and the toggle and save bonus PF2e lacks are added. A recast ends the earlier ones, and there is no target limit for "any number".

See [verification](verification/phase-rank-4-batch-114.md).

### Rank 4 batch 115 — Bottle the Storm

- **A stored charge:** one-shot resistance whose prevented damage the existing counter records, released as a spell attack for that much.

See [verification](verification/phase-rank-4-batch-115.md).

### Rank 4 batch 116 — Community Restoration

- **Shared temporary Hit Points:** the triggering spell's rank is the caster's answer, and the allies' share is divided on the card.

See [verification](verification/phase-rank-4-batch-116.md).

### Rank 4 batch 117 — Variable Gravity

- **Switchable rule-set options:** the option is picked on the card and changed later with an action; a heightened duration applies.

See [verification](verification/phase-rank-4-batch-117.md).

### Rank 4 batch 118 — Chromatic Armor

- **Rolled resistances and an attacker's save:** the colors rolled on the card become resistances and light, and an adjacent attacker's Will save is followed by immunity until the end of its next turn.

See [verification](verification/phase-rank-4-batch-118.md).

### Rank 4 batch 119 — Shielding Formation

- **An area Effect granted on ending a turn inside the caster's moving emanation:** using its resistance ends the Effect, with immunity.

See [verification](verification/phase-rank-4-batch-119.md).

### Rank 4 batch 120 — Necrotic Radiation

- **An imbued object or square:** turn-end damage on the region, or on the object's holder (moved from the card); an attended object's holder saves for the spell's time.

See [verification](verification/phase-rank-4-batch-120.md).

### Rank 4 batch 121 — Rusting Grasp

- **Creature or item:** a creature's basic save with inline persistent damage, and an item's damage and rust rolled on the card for the GM (a generic `cardRoll` control).

See [verification](verification/phase-rank-4-batch-121.md).

### Rank 4 batch 122 — Phoenix Ward

- **A death ward:** damage of its type that drops the caster to 0 leaves 1 HP, then heals by the dice plus the absorbed damage, with a recast lockout.

See [verification](verification/phase-rank-4-batch-122.md).

### Rank 4 batch 123 — Murderous Vine

- **A grabbing attack with a crush while held:** an attack against the item's passive defense, and a turn hazard gated on that cast's Grabbed; a generic GM card control.

See [verification](verification/phase-rank-4-batch-123.md).

### Rank 4 batch 124 — Life's Fresh Bloom

- **A turn-start split area:** the living on the ground heal and get PF2e's Effect; undead and nindoru fiends save against Sickened.

See [verification](verification/phase-rank-4-batch-124.md).

### Rank 4 batch 125 — Bridge of Vines

- **Drawn lingering areas and per-creature row terrain:** the GM's region, and the rows' difficult terrain added for the creature that saved (until the spell ends, or its next turn).

See [verification](verification/phase-rank-4-batch-125.md).

### Rank 4 batch 126 — Life's Flowing River

- **A lingering line with damage for some creatures only:** the rows' damage gated by trait, row terrain until the creature's next turn, and a one-round immunity on a critical success.

See [verification](verification/phase-rank-4-batch-126.md).

### Rank 4 batch 127 — Ephemeral Hazards

- **Separate square hazards with a success lock:** PF2e's degree adjustment for a creature that saw through them; row terrain; saves once per turn.

See [verification](verification/phase-rank-4-batch-127.md).

### Rank 4 batch 128 — Wall of Mirrors

- **A struck wall:** the GM's wall, and a card control posting the striker's basic save of the item's damage.

See [verification](verification/phase-rank-4-batch-128.md).

### Rank 4 batch 129 — Replicate

- **An illusory double:** a token copy with part of the target's Hit Points, as the caster's minion, ending at 0 HP.

See [verification](verification/phase-rank-4-batch-129.md).

### Rank 4 batch 130 — Phantasmal Protagonist

- **A themed conjured creature:** a token of the stated statistics, and its thematic action from the card once a round (attack, temporary HP or save).

See [verification](verification/phase-rank-4-batch-130.md).

### Rank 4 batch 131 — Dutiful Challenge

- **A paired challenge:** PF2e's caster Effect proved, the enemy's mirror Effect by signature, an exempting save control, and defeat ending both.

See [verification](verification/phase-rank-4-batch-131.md).

### Rank 4 batch 132 — Chromatic Ray

- **A rolled-color ray:** the attack, then each color's damage, saves, borrowed spell or condition at the cast rank.

See [verification](verification/phase-rank-4-batch-132.md).

### Rank 4 batch 133 — Radiant Heart of Devotion

- **A sided emanation:** the remastered good side holds the bonuses; the others save at the start of their turns. The GM can reclassify a creature.

See [verification](verification/phase-rank-4-batch-133.md).

### Rank 4 batch 134 — Umbral Graft

- **Stealing a spell:** the card's Steal takes a random targeted spell off a foe (the rank rule or a counteract check); it affects the caster or is stored for a transfer.

See [verification](verification/phase-rank-4-batch-134.md).

### Rank 5 batch 66 — Belittling Boast

- **A boast:** one Intimidation check Demoralizes the enemies around the caster; the frightened take a penalty to the chosen statistic, and the caster gains a bonus.

See [verification](verification/phase-rank-5-batch-66.md).

### Rank 5 batch 67 — Chromatic Wall

- **A wall of a rolled color:** the card's control runs the color's crossing save (or the borrowed spell) for the creatures the GM targets.

See [verification](verification/phase-rank-5-batch-67.md).

### Rank 5 batch 68 — Cloak of Colors

- **A dazzling shroud:** adjacent creatures are Dazzled (an aura); the card's control flashes a melee hitter (its save, then immune for its turn).

See [verification](verification/phase-rank-5-batch-68.md).

### Rank 5 batch 69 — Establish Ward

- **A ward:** the caster is Quickened inside and Slowed 1 outside, swapped as it moves; the card's spell-attack Strikes hit creatures in the ward.

See [verification](verification/phase-rank-5-batch-69.md).

### Rank 5 batch 70 — Flame Dancer

- **Fiery Strikes and a dancing Demoralize:** PF2e's Effect, proved against the text; the card's control rolls the target's Demoralize with Performance.

See [verification](verification/phase-rank-5-batch-70.md).

### Rank 5 batch 71 — Flammable Fumes

- **A volatile cloud:** its poison hits on entering or starting a turn (once per round); from the next round, the GM's detonation gives everyone inside a Reflex save and ends it.

See [verification](verification/phase-rank-5-batch-71.md).

### Rank 5 batch 72 — Moon Frenzy

- **A feral frenzy:** PF2e's Effect, proved and corrected by the text (every Speed; the dice at the rank); each target's Will save to end it is a card control.

See [verification](verification/phase-rank-5-batch-72.md).

### Rank 5 batch 73 — Mantle of the Unwavering Heart

- **Two swappable abilities:** PF2e's Effect with the caster's picks; the card's swap re-makes it with the new choice.

See [verification](verification/phase-rank-5-batch-73.md).

### Rank 5 batch 74 — Forceful Hand

- **A shielding hand:** a token with the rank's statistics; the card's end-of-turn entries give cover or, at higher ranks, Swat, Grasp, Punch or Crush.

See [verification](verification/phase-rank-5-batch-74.md).

### Rank 5 batch 75 — Rewrite Possibility

- **Fate's reroll:** the target's initiative bonus; the caster's reaction rerolls its failed check with PF2e's reroll plus the status bonus.

See [verification](verification/phase-rank-5-batch-75.md).

### Rank 5 batch 76 — Shepherd of Souls

- **A sacrifice for an ally:** the caster loses the Hit Points it picks; the target regains twice that (from Dying too).

See [verification](verification/phase-rank-5-batch-76.md).

### Rank 5 batch 77 — Spiritual Guardian

- **A spirit guardian:** a token; the card's Attack (spell attack, picked type) and Protect (the first 10 damage beside it, off its Hit Points).

See [verification](verification/phase-rank-5-batch-77.md).

### Rank 5 batch 78 — Arcane Countermeasure

- **A countermeasure:** PF2e's Effect on the countered spell's targets, keyed to that spell (a toggle), the DCs added; the rank a GM line.

See [verification](verification/phase-rank-5-batch-78.md).

### Rank 5 batch 79 — Black Tentacles

- **Grabbing tentacles:** the caster's spell attack against each creature's Fortitude DC at the cast and as a creature ends its turn inside; held ones take the crush.

See [verification](verification/phase-rank-5-batch-79.md).

### Rank 5 batch 80 — Wall of Flesh

- **A living wall:** the mouths bite and the arms grab creatures ending their turns beside it (Ongoing's area); the eyes give the caster a Perception bonus.

See [verification](verification/phase-rank-5-batch-80.md).

### Rank 5 batch 81 — Mantle of the Magma Heart

- **A lava mantle:** PF2e's Effect with the picks (the text's Clumsy and reach added); Heart of Fire's burn and the Sustain swap are card controls.

See [verification](verification/phase-rank-5-batch-81.md).

### Rank 5 batch 82 — Blink Charge

- **A teleporting Strike:** the caster lands beside the target and Strikes with PF2e's force dice; a miss's force hits the target or the caster.

See [verification](verification/phase-rank-5-batch-82.md).

### Rank 5 batch 83 — Soulshelter Vessel

- **A healing stone:** a pool by Bulk; transfers by action; a rescue instead of dropping to 0 HP.

See [verification](verification/phase-rank-5-batch-83.md).

### Rank 5 batch 84 — Symphony of the Unfettered Heart

- **An unfettering song:** Performance counteracts an effect giving a listed condition (the source's DC and rank the GM's); a failure locks it for a day.

See [verification](verification/phase-rank-5-batch-84.md).

### Rank 5 batch 85 — Transmute Rock and Mud

- **Rock and mud:** the mud's terrain on the region, the falling mud's basic save, or mud to rock's save (Prone, Grabbed, Restrained) for the creatures inside.

See [verification](verification/phase-rank-5-batch-85.md).

### Rank 5 batch 86 — Tree of Life and Death

- **Two bound trees:** tokens whose canopies harm (basic save) or heal living creatures as Ongoing areas; either tree's fall ends both.

See [verification](verification/phase-rank-5-batch-86.md).

### Rank 5 batch 87 — Diadem of Divine Radiance

- **A radiant diadem:** PF2e's light Effect; the card throws mythic discs (spirit and persistent spirit, Dazzled).

See [verification](verification/phase-rank-5-batch-87.md).

### Rank 5 batch 88 — Summon Healing Servitor

- **A healing servitor:** PF2e's temporary-HP Effect on arrival; the card's departure heals the living and harms the undead (basic save) with one roll.

See [verification](verification/phase-rank-5-batch-88.md).

### Rank 5 batch 89 — Mirecloak

- **Prying shrouds:** PF2e's Effect (its toggle fixed); the card's retaliation posts the attacker's Will save, then ends that cloak (immune 24 hours).

See [verification](verification/phase-rank-5-batch-89.md).

### Rank 5 batch 90 — Ember Doppelgänger

- **A blazing duplicate:** a token with the text's statistics (its saves fail); the card's blast posts a basic Reflex card at the rank.

See [verification](verification/phase-rank-5-batch-90.md).

### Rank 5 batch 91 — Blossoming Gore

- **A field of bloody roses:** the thrall destroyed; persistent bleed on entering or starting a turn inside; a bleeding creature's turn-end save Drains it (the thralls are the GM's).

See [verification](verification/phase-rank-5-batch-91.md).

### Rank 5 batch 92 — Shall not Falter, Shall not Rout

- **A sealing stroke:** the caster's Effect; once each round, after a damaging weapon Strike, it recovers twice the rank (up to half its maximum HP).

See [verification](verification/phase-rank-5-batch-92.md).

### Rank 4 batch 135 — Infiltrator's Tunnel

- **Private portals:** the caster's Effect lists who passes freely; others' crossing is a Will save (a failure the GM's teleport).

See [verification](verification/phase-rank-4-batch-135.md).

### Rank 5 batch 93 — Dance of Darkness

- **A dark dance:** Performance against the level's DC sets the time of a burst made dark like the Darkness spell.

See [verification](verification/phase-rank-5-batch-93.md).

### Rank 3 batch 119 — rituals from their confirmed result

- **New family `ritual-degrees`:** the GM's confirmed result applies conditions (timed or locked), the target's record, damage with basic saves and rolled times. It covers Rest Eternal, Awaken Portal, Labyrinthine Prison, Reinforced Rations and Drain Planar Connection.

See [verification](verification/phase-rank-3-batch-119.md).

### Rank 3 batch 120 — rituals with choices, bonuses and backlash

- **`ritual-degrees` extended:** the GM's choice, toggled bonuses, permanent conditions, knockouts, PF2e's own Effects, rank-scaled and heightened damage. It now covers Mindscape Door, Astral Projection, Oblivious Expulsion, Garden of Death, Call Spirit and Rune Trap.
- **Fix:** basic-save multipliers are applied to ritual and Ongoing-area damage (Drain Planar Connection, Tree of Life and Death).

See [verification](verification/phase-rank-3-batch-120.md).

### Rank 3 batch 121 — Portrait of Spite and Geas

- **`ritual-degrees` extended:** a punishment chosen at the cast, its value set by each victim's save against the GM's DC (Portrait of Spite).
- **An obligation with its strain** (Geas's Sickened): card controls, with no other reduction or removal.
- **Limits:** the target's level by rank, and an unwilling target's save from 5th.

See [verification](verification/phase-rank-3-batch-121.md).

### Rank 3 batch 122 — drinks that cast spells

- **`ritual-degrees` extended:** the spells a drink casts on each drinker, as the module's own spell resolutions from the primary caster with the primary skill's counteract (care spells are the GM's controls).
- **PF2e's Effect with the result's choice preselected**, temporary Hit Points by heightened step, and "you and the drinkers".
- **Covers:** Fortifying Brew and Winter's Breath.

See [verification](verification/phase-rank-3-batch-122.md).

### Rank 3 batch 123 — rituals carrying a disease

- **`ritual-degrees` extended:** the ritual's own disease block becomes Pseudo Afflictions' Effect, and exposures save against it.
- **GM controls:** for the shots' hits, the infested area's creatures and the arthropods' bonus.
- **The hive** is a token whose destruction ends the ritual an hour later.
- **Covers:** Plague Shot and Mosquito Blight.

See [verification](verification/phase-rank-3-batch-123.md).

### Rank 3 batch 124 — Secure Siege Weapons and Wild Feast

- **`ritual-degrees` extended:** siege weapons' Hardness and HP by Effect rules, with the enemies' save or misfortune and the launch's fortune as controls (Secure Siege Weapons).
- **Wild Feast:** the masters' daily companion check (the minion trait removed for the day), and the ritual's area on the card.

See [verification](verification/phase-rank-3-batch-124.md).

### Rank 3 batch 125 — Loyalty's Ward and Footholds and Foothills

- **`ritual-degrees` extended:** a ward's criteria and its save to leave, with a hold and a wait (Loyalty's Ward).
- **Terrain options on a region** (roughen, smooth with restore, remove's fall), for the duration or permanently (Footholds and Foothills).

See [verification](verification/phase-rank-3-batch-125.md).

### Rank 4 batch 136 — stances with their own Strikes

- **New family `stance-strike`:** the stance Effect generated from the text. It covers the Strike (PF2e's Strike rule), the bonuses (toggled when only against ranged attacks) and a Strike's note. Entering a stance ends the others.
- **Covers:** Clinging Shadows Stance and Wild Winds Stance.

See [verification](verification/phase-rank-4-batch-136.md).

### Rank 5 batch 94 — the last rank 3–5 gaps, by the user's rulings

- **Restraining Chains:** an unnamed save on a restraint is Reflex; Clumsy and the hold end on an Escape.
- **Ravening Maw:** new kind `cannibal-hunger` (a failure gives the hunger; cannibalize and the round's damage are controls).
- **Elemental Tempest:** new kind `spell-storm` (the caster confirms the legacy evocation; resistance and weakness count once for foes the spell also hit).
- **Conglomerate of Limbs:** new kind `giant-thrall` (the thrall token by the thrall rules, and its two Strikes with the hold).
- **Census:** note-only rituals now count as resolved.

See [verification](verification/phase-rank-5-batch-94.md).

### Rank 3 batch 126 — thralls as tokens

- **Shared maker** (`scripts/thrall-tokens.js`): thrall tokens by the thrall rules. Their checks fail, their Strike uses the caster's spell attack, they're removed at 0 HP or when the caster's Effect ends.
- **Used by:** Create Thrall (new kind `thrall-create`), Bloody Tendrils, Blossoming Gore and Bind Heroic Spirit.
- **Destroying a thrall:** spells that destroy one remove module thrall tokens, and Zombie Horde counts them.

See [verification](verification/phase-rank-3-batch-126.md).

### Rank 6 batch 1 — chains, walls, salvos and repeated saves

- **Chain Lightning:** the save card's `chain` (order, distance, and the end at a critical success).
- **Blade Barrier and Flame Vortex:** lingering areas, with the GM's controls for passing through.
- **Explosive Barrage:** a basic save with Deafened.
- **New kind `repeat-save`** (For Love, For Lightning): a card button for each repeated save. Living Thunderbolt adds one to PF2e's Effect, plus its Escape rule.

See [verification](verification/phase-rank-6-batch-1.md).

### Rank 6 batch 2 — Poltergeist's Fury, Phantom Orchestra, Frozen Fog

- **New save adjustment for the caster's allies,** and the caster's own storm Effect (Poltergeist's Fury).
- **A burst on each Sustain** (Phantom Orchestra).
- **Mist's effects with a Clumsy and Speed rider** (Frozen Fog).

See [verification](verification/phase-rank-6-batch-2.md).

### Rank 8 batch 1 — rank 6–10 rituals

- **`ritual-degrees` extended with new actions:** `free` (conditions ended), `form` (a chosen form from the text's list), `curse-save` (each creature's save with a strain control) and `area-controls` (a ritual area's GM controls).
- **Covers:** Binding Circle, Separation, Freedom, Imprisonment, Sleepless Season, Void Harvest and Awaken Curse.

See [verification](verification/phase-rank-8-batch-1.md).

### Rank 6 batch 3 — Desiccate, Unfolding Wind Crash, Devouring Void, Field of Life, Stone to Flesh, Hasted Assault, Skeleton Army

- **Saves reworded** (Desiccate's living targets and water/plant penalty; Unfolding Wind Crash's jump and emanation).
- **Living-only lingering areas** (Devouring Void).
- **A field that heals the living and harms the undead** (Field of Life).
- **Ending a condition** (Stone to Flesh), and **the caster Quickened** (Hasted Assault).
- **Incarnate phases rolling the text's damage** (Skeleton Army).

See [verification](verification/phase-rank-6-batch-3.md).

### Rank 7 batch 1 — Power Word Stun, Power Word Blind, Power Word Kill, Fatal Aria, Disappearance, Implosion, Suffocate

- **Outcomes by the target's level** (the power words, Fatal Aria): the tier at the cast rank, its outcome, and temporary immunity.
- **Invisible to every sense** (Disappearance).
- **A new target each Sustain, never the same one twice** (Implosion).
- **Suffocation as a row note** with Unconscious (Suffocate).

See [verification](verification/phase-rank-7-batch-1.md).

### Rank 7 batch 2 — Clockwork Devotion, Sudden Transposition, Frigid Flurry, Accelerated Decomposition, Momentary Recovery, Hypnopompic Terrors, Eclipse Burst

- **Incarnate text damage of two types** (Clockwork Devotion).
- **Teleports as the GM's reminder on damaging rows** (Sudden Transposition).
- **An enemies-only line with a carry reminder** (Frigid Flurry).
- **A row's listed conditions as the caster's pick** (Accelerated Decomposition).
- **The caster Slowed after a teleport** (Momentary Recovery).
- **Sleeping targets one step worse** (Hypnopompic Terrors), and **void damage only for the living** (Eclipse Burst).

See [verification](verification/phase-rank-7-batch-2.md).

### Rank 8 batch 2 — Arctic Rift, Time Beacon, Project Image, Migration, Wall of Force

- **Held by ice until it Escapes** (Arctic Rift), with the ice's statistics as a reminder.
- **Notes with a counteract button or Speed rules** (Time Beacon, Project Image, Migration's five Speeds, land included).
- **An invisible wall that blocks movement** (Wall of Force).

See [verification](verification/phase-rank-8-batch-2.md).

### Rank 6 batch 4 — Divine Decree, Petrify, Lignify

- **A level-gated second save** and a "sent home" GM note (Divine Decree).
- **Slowed that turns to stone** at the creature's action count, through its end-of-turn saves (Petrify, Lignify), with a trait's save bonus (Lignify's plants).

See [verification](verification/phase-rank-6-batch-4.md).

### Rank 9 batch 1 — Frost Pillar, Uncontrollable Dance, Dimensional Excision

- **A one-sentence save made into rows** (Frost Pillar), with its ice as a reminder.
- **A compulsion as a behaviour note timed by the row's condition** (Uncontrollable Dance).
- **A basic save scaling persistent damage too** (Dimensional Excision), with a GM question for its penalty and death at 0 HP.

See [verification](verification/phase-rank-9-batch-1.md).

### Rank 7 batch 3 — Hungry Depths, Mask of Terror

- **A vortex that grows or moves**, saved against when cast and by those it moves through (Hungry Depths).
- **A save for each creature acting against the masked target** (Mask of Terror), with its short immunity.

See [verification](verification/phase-rank-7-batch-3.md).

### Rank 6 batch 5 — Spellsurge, Planar Palace, Ethereal Jaunt, Proliferating Eyes, Mislead

- **Notes that only mention a condition** (Spellsurge, Planar Palace, Ethereal Jaunt, Proliferating Eyes).
- **The caster Invisible with a duplicate** (Mislead).

See [verification](verification/phase-rank-6-batch-5.md).

### Rank 6 batch 6 — Zealous Conviction, Scintillating Safeguard, Flaming Fusillade

- **Effect + note spells whose PF2e Effect is proved against the text** (Zealous Conviction's temporary HP and Will bonus, Scintillating Safeguard's chosen resistance, Flaming Fusillade's Ignition bonus).

See [verification](verification/phase-rank-6-batch-6.md).

### Rank 7 batch 4 — Prismatic Armor, Apex Companion

- **Chromatic Armor in every color, Blinded on a critical failure** (Prismatic Armor).
- **An animal companion's apex form proved against PF2e's Effect**, with its 15-foot reach added (Apex Companion).

See [verification](verification/phase-rank-7-batch-4.md).

### Rank 7 batch 5 — Regenerate, Incarnate Tempest of Shades, Summon Stampede

- **Regeneration proved against PF2e's Effect** (Regenerate).
- **Incarnate phases with plural inline saves, enemy wording and inline dice** (Tempest of Shades, Summon Stampede).

See [verification](verification/phase-rank-7-batch-5.md).

### Rank 8 batch 3 — Spiritual Epidemic

- **A curse that spreads to whoever casts on its victim**, through a repeatable card per affected creature.

See [verification](verification/phase-rank-8-batch-3.md).

### Rank 7 batch 6 — Skeletal Lancers, Recurring Nightmare, Living Graveyard, Perfected Thrall, Telekinetic Bombardment

- **Special thralls with their statistics, Thrall Charge dice and card controls** (Skeletal Lancers, Recurring Nightmare, Living Graveyard, Perfected Thrall).
- **A lobbed missile's save, with its area and rubble as a reminder** (Telekinetic Bombardment).

See [verification](verification/phase-rank-7-batch-6.md).

### Rank 10 batch 1 — Hero's Defiance

- **The caster's last-moment healing** (Hero's Defiance), with its trigger and limits on the card.

See [verification](verification/phase-rank-10-batch-1.md).

### Rank 6 batch 7 — Nature's Reprisal, Phantasmal Calamity

- **Enemy-only hazardous plant squares** (Nature's Reprisal) on the per-square control.
- **A second save on the critical failure** (Phantasmal Calamity), with a recurring save to end the condition and a note.

See [verification](verification/phase-rank-6-batch-7.md).

### Rank 8 batch 4 — Confusing Colors, Vibrant Pattern

- **Lingering clouds with several rows' conditions** (Confusing Colors): no new saves while affected; rolled Stunned rounds; a later condition as a note.
- **A condition saved off once outside the area** (Vibrant Pattern).

See [verification](verification/phase-rank-8-batch-4.md).

### Rank 8 batch 5 — Canticle of Everlasting Grief, Warp Mind

- **A curse Effect per result, proved** (Canticle of Everlasting Grief), with its own Frightened and allies' aura bound to the cursed creature.
- **Confused for the first action of the next turn** (Warp Mind), with its immunity and the instant-effects reminder.

See [verification](verification/phase-rank-8-batch-5.md).

### Rank 6 batch 8 — Necrotize

- **A rolled choice on PF2e's Effect** (the cast's 1d4 sets its ChoiceSet), with the critical failure's second pick asked on the card.

See [verification](verification/phase-rank-6-batch-8.md).

### Rank 7 batch 7 — Defy the Gods

- **The caster's Effect gated on the target's traits** (Defy the Gods' resistance).

See [verification](verification/phase-rank-7-batch-7.md).

### Rank 7 batch 8 — Pollen Pods, Curse of the Spirit Orchestra

- **Bulbs on the minefield route with a degree table** (Pollen Pods).
- **A generated skill curse with any-skill degree changes** (Curse of the Spirit Orchestra).

See [verification](verification/phase-rank-7-batch-8.md).

### Rank 8 batch 6 — Spirit Song

- **A basic-save table read as damage, a Stunned rider and row notes** (Spirit Song).

See [verification](verification/phase-rank-8-batch-6.md).

### Rank 6 batch 9 — Suspended Retribution

- **A GM-triggered omen save on the target** (Suspended Retribution), on Purifying Veil's route.

See [verification](verification/phase-rank-6-batch-9.md).

### Rank 9 batch 2 — the user's answers

- **Adventure rituals are the GM's** (their text whispered), by rarity and publication.
- **Results only the GM can play are whispered to the GM** (Catch Your Name, Telepathic Demand).

See [verification](verification/phase-rank-9-batch-2.md).

### Rank 6 batch 10 — Chromatic Image, Personal Ocean, Cryostasis

- **A borrowed spell's images with a rolled retaliation** (Chromatic Image), and two notes (Personal Ocean's counteract, Cryostasis's dying target).

See [verification](verification/phase-rank-6-batch-10.md).

### Rank 6 batch 11 — Tentacular Innervation

- **An unarmed spell Strike with several conditions on a hit** (Tentacular Innervation).

See [verification](verification/phase-rank-6-batch-11.md).

### Rank 6 batch 12 — Boots on the Ground, Crusade

- **Two more notes** (illusory troops' statistics; level-tier behaviour).

See [verification](verification/phase-rank-6-batch-12.md).

### Rank 9 batch 3 — Unblinking Flame Ignition

- **A damaging aura on the caster with a proved Effect** (Unblinking Flame Ignition).

See [verification](verification/phase-rank-9-batch-3.md).

### Rank 7 batch 9 — Visions of Danger

- **A lingering illusion area with a Disbelieve control** (Visions of Danger).

See [verification](verification/phase-rank-7-batch-9.md).

### Rank 7 batch 10 — Entrancing Eyes

- **An emanation with per-casting immunity and a Sustain focus control** (Entrancing Eyes).

See [verification](verification/phase-rank-7-batch-10.md).

### Rank 6 batch 13 — Dominate, Never Mind

- **Controlled with its saves** (Dominate) and **attribute modifiers set by an Effect** (Never Mind).

See [verification](verification/phase-rank-6-batch-13.md).

### Rank 6 batch 14 — Claim Undead

- **Controlled undead with their saves** (Claim Undead).

See [verification](verification/phase-rank-6-batch-14.md).

### Rank 9 batch 4 — Unspeakable Shadow

- **A Frightened floor for a fixed time and a save-or-die critical failure** (Unspeakable Shadow).

See [verification](verification/phase-rank-9-batch-4.md).

### Rank 6 batch 15 — Manifold Lives

- **A turn-start save granting Slowed for that turn** (Manifold Lives), on Wave of Despair's rule.

See [verification](verification/phase-rank-6-batch-15.md).

### Rank 6 batch 16 — Spellwrack

- **Persistent damage each time a spell affects the cursed creature** (a GM control).

See [verification](verification/phase-rank-6-batch-16.md).

### Rank 7 batch 11 — Inexhaustible Cynicism

- **A doubts note with a turn-end damage control** (Inexhaustible Cynicism).

See [verification](verification/phase-rank-7-batch-11.md).

### Rank 6 batch 17 — Cast into Time

- **A damage table with a "disappears until your turn ends" reminder** (Cast into Time).

See [verification](verification/phase-rank-6-batch-17.md).

### Rank 6 batch 18 — Awaken Entropy

- **A burst that grows to a maximum with stepped dice**, and force for creatures void doesn't affect.

See [verification](verification/phase-rank-6-batch-18.md).

### Rank 6 batch 19 — Rose's Thorns

- **A growing thorn burst**: critical failure bleeds and Immobilizes, per-square damage, +5 feet per Sustain.

See [verification](verification/phase-rank-6-batch-19.md).

### Rank 9 batch 5 — Voracious Gestalt

- **An aura that grows on souls**: its own turn damage; the GM's soul control adds 20 feet and 1d6, once a round.

See [verification](verification/phase-rank-9-batch-5.md).

### Rank 8 batch 7 — Divine Aura

- **A growing ward on the caster's allies**: +1 status (toggles +2/+4); the GM's melee-hit control blinds on a failed Will save.

See [verification](verification/phase-rank-8-batch-7.md).

### Rank 6 batch 20 — Field of Razors

- **A razor thicket that grows by the caster's reaction**: per-square damage, difficult terrain, 1 minute (user's ruling).

See [verification](verification/phase-rank-6-batch-20.md).

### Rank 7 batch 12 — Orb of Twisting Fate, Beheading Buzz Saw, Expunge Blood

- **Lasting behaviour notes** by result, a **table save with persistent damage and a death save**, and a **condition that rises while bleeding**.

See [verification](verification/phase-rank-7-batch-12.md).

### Rank 8 batch 8 — Maze of Locked Doors, Medusa's Wrath

- **Trapped notes by result** with the hallway reminder, and **a Strike whose Slowed escalates to Petrified**.

See [verification](verification/phase-rank-8-batch-8.md).

### Rank 9 batch 6 — Massacre

- **A level-limited death line** with death at 0 HP and **a backlash when it kills no one**.

See [verification](verification/phase-rank-9-batch-6.md).

### Rank 8 batch 9 — Falling Sky

- **Flyers slammed to the ground** (falling damage from their elevation) and **everyone's save** for Prone and Stunned.

See [verification](verification/phase-rank-8-batch-9.md).

### Rank 7 batch 13 — Darklight

- **A draining field of darkness**: the region dark, a basic save on entering or starting a turn inside, chosen allies spared.

See [verification](verification/phase-rank-7-batch-13.md).

### Rank 8 batch 10 — GM-handled spells and GM options

- **The user's GM-handled ruling** (16 world-scale and information/travel/ward spells), with **GM options** on the world-scale ones that can affect creatures.

See [verification](verification/phase-rank-8-batch-10.md).

### Rank 8 batch 11 — incarnates by parts

- **Incarnates by parts** (`incarnate-phases.js`, `compileIncarnateParts`): each Arrive and Depart becomes save, attack, cloud, damage, healing, Effect, condition-reduction or cast-spell parts, each checked by `inspectIncarnatePlan`. The incarnate card runs each part on the creatures the GM targets.
- **d20 limits** (`d20-clamp.js`) and **turn-start note damage** (`incarnate-parts-runtime.js`).

See [verification](verification/phase-rank-8-batch-11.md).

### Rank 7 batch 14 — control (group 2a)

- **Controls card** for a save's controls (Puppet Strings' forced Strike and Stride, Possession's body-died save, Temporary Possession's thrall).
- **Note endings** (`note-end-runtime.js`: `thenCondition`, `endsInDeath`, `hpShare`), Controlled with the caster's ownership for each turn the start-of-turn save fails, and the caster's condition while a possession note lasts.

See [verification](verification/phase-rank-7-batch-14.md).

### Rank 7 batch 15 — conjured tokens and copies (group 2b)

- **Conjured tokens** on incarnate-style cards: stated statistics, removed with the spell or at 0 HP, with a concealing area that follows the token.
- **Creature copies:** `copyCreature`, Duplicate Foe's `duplicate`, and the `check-copy` part. A copy loses HP after the caster's turn and can halve its Strike damage. Buttons can act on the conjured token, and the `terrain` part makes its area difficult terrain.

See [verification](verification/phase-rank-7-batch-15.md).

### Rank 6 batch 21 — the rest of group 2

- **Summon parts** (a named creature beside a dying target, ended with its Dying; a listed stat block fitted to the corpse), **form Effects by rank** (AC set, temporary HP, 1 HP instead of 0), plans by rank on parts, and ChoiceSet preselection.

See [verification](verification/phase-rank-6-batch-21.md).

### Rank 7 batch 16 — group 3, part 1

- **Lantern auras with degree rows** (per-degree Effects held while inside, enemies-only, sustained, a chosen radius), a row condition's **`insteadIfHeld`**, and a lingering area's **`sleeperDamage`**.

See [verification](verification/phase-rank-7-batch-16.md).

### Rank 8 batch 14 — group 3, part 2

- Row movement toward/to the center and **rises**, **living-only terrain**, the **draining center** child area (`drainCenter`), and the **GM mark** (`gmMark`) with turn-start damage that can kill.

See [verification](verification/phase-rank-8-batch-14.md).

### Rank 10 batch 2 — group 3, part 3

- Save-once auras whose rows last outside the area, with immunity, minion control, a default radius and Dismiss; placed **greater terrain** parts; the lingering **condition choice**; and the **`note-held`** degree adjustment.

See [verification](verification/phase-rank-10-batch-2.md).

### Rank 7 batch 17 — group 3, part 4

- Lingering areas made as a **region following the caster** (row terrain, optional expansion), **sustained caster Effects**, and the **shadows' area** (an enemies-only hazard of the chosen type; disbelief halves it).

See [verification](verification/phase-rank-7-batch-17.md).

### Rank 9 batch 7 — group 3, part 5

- Note Effects ended by **total damage** (`damageLimit`, also with an unlimited Escape note) and **turn-start attacks** (`turnStartAttack`: flat check, basic save, damage, Off-Guard).

See [verification](verification/phase-rank-9-batch-7.md).

### Rank 9 batch 8 — the end of group 3

- The **`hazard`** card part, **rolled tables read by degree** (`rollResults`, a critical failure's offset), lingering **`exposureDamage`**, and lingering-area **afflictions** with their own maximum duration.

See [verification](verification/phase-rank-9-batch-8.md).

### Rank 8 batch 15 — group 4, part 1

- Lasting states as **row note Effects**, with the note flags `halfStrikes`, `sourceSavesBetter` and `turnStartFlat`, and the outcome lifecycle for "varies".

See [verification](verification/phase-rank-8-batch-15.md).

### Rank 6 batch 22 — group 4, part 2

- **Keyed GM questions** on row conditions, **condition-linked notes** (`withCondition`: ended with the condition, Weakness scaled by its value), and Weakness rules on row notes.

See [verification](verification/phase-rank-6-batch-22.md).

### Rank 9 batch 9: group 4, part 3

- **Target-following auras** (`targetAura`: a region on the target, a penalty for allies inside it, conditions applied by degree), **counter badges** on note Effects, and a **rolled condition** chosen by degree.

See [verification](verification/phase-rank-9-batch-9.md).

### Rank 8 batch 16: group 5, part 1

- **Form riders** (`form-riders.js`): a form's auras are regions following the caster, with damage or saves; turn-end recovery; moving saves on the form's card. Each applies only to the option picked on PF2e's Effect.

See [verification](verification/phase-rank-8-batch-16.md).

### Rank 7 batch 18: group 5, part 2

- The form's card gains **retaliate** and **temp-hp** parts (temporary Hit Points once a round, ending with the form), plus spell-attack Strikes with a chosen type.

See [verification](verification/phase-rank-7-batch-18.md).

### Rank 9 batch 10: group 5, part 3

- **A caster's form after a save** (`casterForm`): PF2e's Effect and a following aura at Finalize. When a form's Effect ends, its auras end, and full Hit Points are restored where stated (`form-aura-runtime.js`).

See [verification](verification/phase-rank-9-batch-10.md).

### Rank 6 batch 23: group 5, part 4

- **Generated forms** (`generated-form`, `generated-forms.js`): the module's Effect from the text, with toggle grants, option slots and saving auras.

See [verification](verification/phase-rank-6-batch-23.md).

### Rank 10 batch 3: the end of group 5

- Generated forms answer PF2e's choice ahead (`choiceSelections`). The form's card gains **cast-form**, which casts one of the caster's polymorph spells with stated temporary Hit Points, each form once.

See [verification](verification/phase-rank-10-batch-3.md).

### Rank 6 batch 24: group 7, part 1

- **Teleports** (`teleport-runtime.js`): a space picked and checked (range, inside the area, unoccupied), then the token moved at once; swaps; Hit Point sharing; descent and elevation parts on spell cards.

See [verification](verification/phase-rank-6-batch-24.md).

### Rank 8 batch 17: the end of group 7

- The card's **fuse** part: the target hidden, the caster's temporary Hit Points and reach, and the target's return beside the caster when the Effect ends.

See [verification](verification/phase-rank-8-batch-17.md).

### Rank 9 batch 11: group 8, part 1

- **Mode cards** (`mode-cards.js`): the card's area (`setAreaMode`: member Effects in slots, terrain), modes with hidden actions, "never twice in a row", and the launch part.

See [verification](verification/phase-rank-9-batch-11.md).

### Rank 7 batch 19: the end of group 8

- Mode areas gain an area's own condition save (while inside, with immunity), resizing, child hazards, held shields, kept saves (`remembered`) with turn-end damage and the leaving trigger, and the chosen radius.

See [verification](verification/phase-rank-7-batch-19.md).

### Rank 10 batch 4: group 9, part 1

- **Blast cards** (`blast-cards.js`): multi-pool text formulas with a picked type, the hazard's picked type and terrain, temporary Hit Points shared with allies (**temp-share**), and **glyph** turn-end saves.

See [verification](verification/phase-rank-10-batch-4.md).

### Rank 8 batch 18: group 9, part 2

- **Prismatic cards** (`prismatic-cards.js`): the **beam-roll**, **sequence** and **fumarole** parts. Area hazards with a basic save now apply a failure's added effect. Referenced spells are loaded two levels deep.

See [verification](verification/phase-rank-8-batch-18.md).

### Rank 7 batch 20: group 10, attack shapes

- **Attack cards** (`attack-shapes.js`, `scripts/attack-shapes-runtime.js`): the **attack-save**, **charge** and **teeth** parts and hazard lines between the caster and its targets.
- A card's **lasting record** (Sustained or timed) holds its parts' Effects and ends them with the spell.
- The marks' payoff at 0 Hit Points.
- Save cards take a card's degree adjustment and attack bonus.

See [verification](verification/phase-rank-7-batch-20.md).

### Rank 8 batch 19: group 11, triggers

- **Trigger cards** (`trigger-cards.js`, `scripts/trigger-runtime.js`): the **link**, **sacrifice**, **fury**, **leech**, **mimic**, **death-mark**, **word** and **emblem** parts.
- Hooks on damage taken (the link, the fury's curse) and on spells cast (the leech).
- Self parts.
- Cards that replace an earlier casting.

See [verification](verification/phase-rank-8-batch-19.md).

### Rank 10 batch 5: group 13, revival

- **Revival cards** (`revival-cards.js`, `scripts/revival-runtime.js`): the **raise**, **revive**, **shock** and **renewal** parts.
- Held healing for raised creatures and their death when the spell ends.
- Region areas ending at the end of a creature's next turn.

See [verification](verification/phase-rank-10-batch-5.md).

### Rank 6 batch 25: group 14, things picked up

- **Pickup cards** (`pickup-cards.js`, `scripts/pickup-runtime.js`): the **seed**, **pod** and **gift** parts.
- The card's things as an item on the caster.
- One burning area shared by every throw.
- Affliction stages lowered.

See [verification](verification/phase-rank-6-batch-25.md).

### Rank 9 batch 12: groups 15 and 16

- **Support cards** (`support-cards.js`, `scripts/support-runtime.js`): the **true-target**, **covenant** and **heartbolt** parts.
- Placed card areas holding PF2e's Effect.
- The covenant's hold at 0 Hit Points.

See [verification](verification/phase-rank-9-batch-12.md).

### Rank 9 batch 13: the user's answers

- Save cards can lower the creature's resistances by a stated amount (Cataclysm), using PF2e's own record of each resistance it applied.
- Damage moved between creatures asks the GM for its type when PF2e didn't record one.
- A form's Heightened extra die reaches its own auras and moving saves.

See [verification](verification/phase-rank-9-batch-13.md).

### Spellshape batch 1: the core

- **Spellshapes and wands** (`src/compiler/spellshape-readers.js`, `scripts/spellshape-runtime.js`): the cast's spellshape (PF2e's selector, or a feat armed by its card) and wand, read into requirements and riders. PF2e's selector is switched off after the cast. The save card applies the riders.

See [verification](verification/phase-spellshape-batch-1.md) and the plan, `docs/planning/spellshape-wand-plan.md`.

### Spellshape batch 2: family B riders

- Riders on damaged or hit-or-failed creatures, rank-long and caster-turn durations, PF2e's linked Effects, reductions, marks, GM notes, and widened lines.
- Named-spell and damage-type requirements; wands' "…, but …" clauses.
- Arming by card for any spellshape feat.

See [verification](verification/phase-spellshape-batch-2.md).

- **Spellshape family C (save card):** persistent and splash damage by rank on damaged creatures, a Focus Point spent for extra damage, one chosen damaged creature for a generated or PF2e Effect (ChoiceSet preset with the spell's type), and Chaotic Spell's d6 rolled once per cast. See [verification](verification/phase-spellshape-batch-3.md).

- **Spellshape family B wands (batch 4):** conditions with their own durations and an end-of-turn save ending one; a condition following the spell's (`syncShapeFollow`); persistent damage on a condition the spell grants; a trait for the spell's affliction; rider Effects tied to the spell's own Effects (`shapeTieEnded`: gone with them, or a condition when they run their course); turn-start damage while the spell's condition lasts. A wand's unresolvable stored spell is replaced by its current printing (`currentPrinting` in `main.js`). See [verification](verification/phase-spellshape-batch-4.md).

- **Spellshape family A (batch 5):** the shaped area (`baseArea`, `grownArea`) kept on the cast as `shaping.area` and given to its template in `widenCastTemplate` (enlarged, never shrunk); range and origin riders read as the table's; Reach of the Dead's thrall destroyed in `recordShaping`; equipment wands armed by their card or counted by their PF2e toggle (switched off after). See [verification](verification/phase-spellshape-batch-5.md).

- **Spellshape family E (batch 6):** cast riders on the caster or a chosen ally as the cast is recorded (`applyCastRiders`: resistances, PF2e Effects with their choice, Dualistic Synergy, Familiar's Resolve); Vampiric Spell's temporary Hit Points after the card; Safeguard Spell leaves the caster off the save card. See [verification](verification/phase-spellshape-batch-6.md).

- **Spellshape family J (batch 7):** a spent slot given back for the feats that don't expend it (`refundSlot`, as a cast rider); the casting feats (subtle, fewer actions, reactions, cover, senses) read as the table's. See [verification](verification/phase-spellshape-batch-7.md).

- **Spellshape family D (batch 8):** the card's damage retyped (every type, `shapeTypeSwapFor`), given a chosen metal (`shapeMaterialFor`), resistances by type lowered up to the caster's level (`shapeResistanceLowersFor`, with Cataclysm's add-back); nonlethal knock-outs at 0 Hit Points. See [verification](verification/phase-spellshape-batch-8.md).

- **Spellshape family F (batch 9):** riders on the creature PF2e's applied healing or damage reaches (`shapeOnApplied`, from the message's spell id to the shaped cast): PF2e Effects, Strike dice, Martyr's Hit Points, extra healing, counteracts through the care runtime; Healing Transformation's healing at the cast; casts with no roll (no `spell-cast` context) recorded too. See [verification](verification/phase-spellshape-batch-9.md).

- **Spellshape family G and the rank (batch 10):** targets singled out on the card (`assignShapeTargets`: half damage only, damage less the rank), the cast's rank changed (`shaping.castRank`) and the DC with mythic proficiency (`mythicDC`). See [verification](verification/phase-spellshape-batch-10.md).

- **Spellshape families H and I (batch 11):** terrain Regions of the spellshape's own (`shapeTerrain`, from the cast's template, around a creature, or a placed burst) with their hazard (`shapeTerrainMove`, `shapeTerrainTurnEnd`) and end (`expireShapeTerrain`); Echoing Spell's second casting gets its slot back. See [verification](verification/phase-spellshape-batch-11.md).

- **Spellshape family C cards (batch 12):** a spellshape's own save card built from its numbers and compiled at the caster's DC (`startShapeCard`, `shapeDC`); cards at the cast (`castCards`), cards with a button (`runShapeCard`: the summoned creature, the circle, the surge's centre, the undead), the circle detonating on the caster's turn (`detonateOnTurn`); Daunting Spell's rows with Stupefied while frightened. See [verification](verification/phase-spellshape-batch-12.md).

- **Spellshapes, the last feats (batch 13):** all 131 read. Dousing, Shadow, Shared Sight, Sinbladed, Spell Shroud, Vigorous Anthem, Coven Spell (its card the reaction: the ally who cast last), Apparition's Reflection; feats with no lead read sentence by sentence. See [verification](verification/phase-spellshape-batch-13.md).

- **Spellshape wands (batch 14):** all 49 wand kinds read. Terrain from the spell's area (with a turn-end save), the landing and kill-burst cards, counteracts through the care runtime, turn-start healing; a wand's other rules whispered to the GM at the cast (`wandRule`). See [verification](verification/phase-spellshape-batch-14.md).

- **Sinbladed Spell (batch 15):** no check on the spell (the user's answer); bleed equal to the rank on a hit or failed save. See [verification](verification/phase-spellshape-batch-15.md).

### Forced movement and the watching wands (spellshape batch 16)

Pushes and pulls the module carries out move the token itself (`forced-movement.js`): walls and the scene's edge stop it, and it never ends in another creature's space (it ends adjacent instead). The wands that watch PF2e's checks or the turns (Hawthorn, Shocking Haze, the Spider, Traitorous Thoughts, Shardstorm, Thundering Echoes, Toxic Blades) put an Effect with `spellshapeWatch` on the creature they follow; Continuation lengthens the cast's Effects. Evidence: `docs/verification/phase-spellshape-batch-16.md`.

### Wands at the card and the template (spellshape batch 17)

Wands that act on the spell's outcome or its placed template: the Ash Puppet's zombie, which also works from Disintegrate's immediate card; Contagious Frailty's spread; Choking Mist's Remaining Air; Fey Flames' Will card; Caustic Effluence's ground; Toxic Blades' poison exposure. Wand casts now work with the immediate runtime, and consumable wands with no stored spell arm the next cast. Evidence: `docs/verification/phase-spellshape-batch-17.md`.

### The wands' buttons (spellshape batch 18)

Refracting Rays, Chromatic Burst, Legerdemain, Teeming Ghosts, Shattering Images and Rolling Flames post a card at the cast. Its button acts on the targeted token: the ray again, the burst card, the spotlight's Will card, frightened 2, the shards, and the rolling flames' terrain. Evidence: `docs/verification/phase-spellshape-batch-18.md`.

### Stated bonuses, Speeds and senses (notes batch 1)

The `stated-effect` note family turns stated bonuses, Speeds and senses into Effects for the right recipients: the caster, each target, the caster and the targets, or the familiar. It handles toggles, options and alternatives. Spells: Movanic Glimmer, Chameleon Coat, Penumbral Disguise, Uncover Device, Discern Lies, Threefold Aspect, Chosen Gravity, Part the Mists to Paradise, Stonesense, Elemental Sense, Enhance Senses, Tiny Wings, Feet to Fins. Evidence: `docs/verification/phase-notes-batch-1.md`.

### Forced-movement notes (notes batch 3)

The module now moves creatures out of an area (Garden of Stone, Blade Barrier, Lifewood Cage), to an adjacent space (Frost Pillar) and into a line (Tornadic Gale). A push stopped by a wall knocks the creature Prone (Arcane Explosion) or deals damage for the feet left (Planar Collision). Incarnate cards give their pushes a centre. Evidence: `docs/verification/phase-notes-batch-3.md`.

### Spellsurge's aura and Theogeny's punishment (notes batch 2)

Spellsurge's Interference is PF2e's Aura rule handing a world Effect (+2 circumstance to saves against mental effects) to every creature within 10 feet. Theogeny's foes take 10 spirit on critical hits and critically failed saves, through note-watchers.js. Evidence: `docs/verification/phase-notes-batch-2.md`.

### GM notes for the GM only; the remaining notes (notes batch 4)

GM notes (gm-notes.js) are whispered when they stand alone and removed from shared cards on players' screens. The module now also carries out Vacuum's suffocation, Stone Lance's "on the ground", Pact Broker's penalty to Lie, Pyrotechnics' creature fire source, Theogeny's punishment and Musical Shift's flat and sharp. Evidence: `docs/verification/phase-notes-batch-4.md`.

### GM notes hidden in Effect descriptions (notes batch 5)

GM notes in Effect descriptions carry PF2e's `data-visibility="gm"`. It's added on creation, on description updates, and once for existing Effects when the world loads, so PF2e hides those notes from players. Evidence: `docs/verification/phase-notes-batch-5.md`.

### GM asides split into GM notes (notes batch 6)

GM asides in an Effect's description — a parenthesis naming the GM, or a sentence starting "The GM" — become GM notes of their own, hidden from players. Evidence: `docs/verification/phase-notes-batch-6.md`.

### GM asides in chat cards (notes batch 7)

On players' clients, a shared card's GM asides — parentheses naming the GM, and "The GM …" sentences — are taken out of its text, text node by text node, so buttons keep working. Evidence: `docs/verification/phase-notes-batch-7.md`.

### GM asides in button labels (notes batch 8)

Players' clients also take GM asides out of a card's button labels (text only; the handlers stay). Evidence: `docs/verification/phase-notes-batch-8.md`.

### GM asides in Effect names (notes batch 9)

An Effect name's GM asides are moved into its description as GM notes hidden from players; this happens on creation, on rename and once at world load. Evidence: `docs/verification/phase-notes-batch-9.md`.

### GM asides in chat message flavors (notes batch 10)

Players' clients also take GM asides out of a message's flavor line. Evidence: `docs/verification/phase-notes-batch-10.md`.

### GM asides in roll tooltips (notes batch 11)

Players' clients also take GM asides out of roll tooltips: the dice tooltip's text, and data-tooltip, title and aria-label attributes. Evidence: `docs/verification/phase-notes-batch-11.md`.

### Text-built damage as PF2e spell damage (spell features batch 1)

Damage the module builds from the text is rolled as PF2e spell damage: a copy of the spell with that damage, at the cast rank, through getDamage. The caster's spell-damage rules now apply to it. Evidence: `docs/verification/phase-spell-features-batch-1.md`.

### Sorcerer blood magic (spell features batch 2)

Casting a blood magic spell posts the bloodline's options, read from PF2e's text: an Effect for the caster or a target, damage per rank, Concealed, or Hag's spite. Tenacious Blood Magic, Blood Sovereignty, Blood Rising and Blood Ascendancy are handled too. Evidence: `docs/verification/phase-spell-features-batch-2.md`.

### Casting rules (spell features batch 3)

Stupefied's flat check, Steady Spellcasting, Communal Healing and Counterspell (with Master's and Mythic) run on each cast. A lost spell's cards refuse to resolve. Evidence: `docs/verification/phase-spell-features-batch-3.md`.

### Items whose activation is a spellshape (spell features batch 4)

Grimoires, rings, tattoos, runes, a scythe and a potion arm their activation for the next spell, read from PF2e's text (`src/compiler/item-spellshape.js`). Their riders are in `scripts/item-spellshape-runtime.js`: an attack against a save DC, rerolled 1s, regeneration, turn-start save areas, Strike dice and retaliation, cards, the Lie, and the feats they borrow. Evidence: `docs/verification/phase-spell-features-batch-4.md`.

### Items that cast a spell (spell features batch 5)

Spellhearts, weapons and charms cast their spells through PF2e from an entry pinned to the item's DC and attack (`src/compiler/item-casts.js`, `scripts/item-cast-runtime.js`). Then the spellheart's benefit applies where it's affixed. Spell Reservoir stores a cast spell and releases it on a hit at DC 30. Evidence: `docs/verification/phase-spell-features-batch-5.md`.

### Items that act on a spell cast (spell features batch 6)

Rune of Sin's resistance to divine spells, Book of Warding Prayers' card, and the Reflecting Shield and Spell Duelist's Siphon counteract reactions run on each cast (`scripts/spell-trigger-items-runtime.js`). Evidence: `docs/verification/phase-spell-features-batch-6.md`.

### Conditions on casting (spell features batch 7)

Restrained, Grabbed, Deafened, Fascinated and Confused casters, and concealed or hidden targets, are checked as each spell is cast (`scripts/casting-rules-runtime.js`). A failed flat check loses the spell or drops the missed target. Evidence: `docs/verification/phase-spell-features-batch-7.md`.

### Actions that change a spell (spell features batch 8)

Spellstrike and the shots (the Strike decides the spell attack), Intercession Spell, Dueling Counter, Absorb into the Aegis, Only You and I, Ring Bell and Draw From the Pages (`scripts/spell-actions-runtime.js`). Evidence: `docs/verification/phase-spell-features-batch-8.md`.

### Creature abilities on spells (spell features batch 9)

Creature abilities read from each creature's own text run on each cast: aura and reaction counteracts, Intercept Summons, Blasphemous Aura's halved healing, Eldritch Attraction, Warped Fulu's immunity to item spells, Channel Magic and Metamagic Alteration (`scripts/creature-spell-abilities-runtime.js`). Evidence: `docs/verification/phase-spell-features-batch-9.md`.

### Boons, curses and relics on spells (spell features batch 10)

Nethys's Moderate Curse's flat check, Sarenrae's Major Curse's nonlethal spells, and River's Reflection's swapped vitality and void apply on each cast. The rest of PF2e's compendiums were read. Evidence: `docs/verification/phase-spell-features-batch-10.md`.

### Third-party content (third-party batch 1)

The third-party modules' spells: their older link forms read, their own Effects catalogued and loaded from their packs. Census: `node tools/third-party-census.mjs`. Evidence: `docs/verification/phase-third-party-batch-1.md`.

### Third-party batch 2

Residual Bad Luck's held frightened (a watched note), Wreak Havok's Arcane Cascade type, area choice and off-guard against the caster, and Creature's Howl's plural immunity. Evidence: `docs/verification/phase-third-party-batch-2.md`.

### Third-party batch 3

Third-party rows read into generated Effects (`src/compiler/third-party-rows.js`: Cursed Mark, Demand Compliance, Golden Touch). Each module's own Effect is checked rule by rule at each degree (`moduleEffectAt`, `sameStatedRules`), and the text's Effect is applied. Also Hand of Judgement's GM save question and Grand Finale's later dazzled and required-spell reminder. Evidence: `docs/verification/phase-third-party-batch-3.md`.

### Third-party batch 4

Ray of Light's basic-save riders and third-party condition riders (`basic-feature-riders.js`). Effect + note proofs for Cosmic Tune, Virtue's Light (stacking holy weakness), Glutton For Blood and Dual-Pattern Strike (overrides, confirm, caster choice). Module Effects' `flags.pf2e.rulesSelections` is rewritten to `flags.system.rulesSelections`. Plain degree headings are read. The "Dynamic" spells' action-glyph versions are read in `glyph-versions.js` (the text's heightened formula, version immunity, next-attack off-guard). Evidence: `docs/verification/phase-third-party-batch-4.md`.

### Third-party batch 5

Spell attacks from third-party text (curly apostrophes, "the AC of a target within", an optional push away, a critical hit's condition). Staff Striker's grip variants. Dynamic Divine Lance. Needle of Vengeance+'s held critical condition, attached to the held spell (`parentCastId`). Old-Mage's Echo's `spell-cast-rank` triggered damage. Silence of the Archmage's note flat check on casting (`castFlatCheck`). The Witches+ save on each Sustain (`repeatable.save`, `endsRepeat`). Evidence: `docs/verification/phase-third-party-batch-5.md`.

### Third-party batch 6

The Witches+ hexes that save again on each Sustain:
- Holding Glyph: a toggle-gated penalty, and `move-action` triggered damage.
- Realityflicker: the rolled condition with a critical failure's second roll (`conditionRoll.criticalSecond`).
- Lost in the Crowd: off-guard to the caster, can't flank until a Seek succeeds (Perception disbelief that ends only its note).
- Judge Soul: `damageTypeFrom.kind "text"` with the void/vitality swap, death at 0 HP, and Drained raised by "or increases its drained value".

Evidence: `docs/verification/phase-third-party-batch-6.md`.

### Third-party batch 7

Hemophilia: a weakness note, and a once-only Drained increase (`triggeredIncrease.once`). Creeping Cold: the text's persistent damage (`textFormula`), and a penalty while it lasts. Ravaging End: an `allPools` caster type, and persistent damage held by the row's note (`holdsPersistent` → `endsWithEffectUuid`, the row's DC). Evidence: `docs/verification/phase-third-party-batch-7.md`.

### Third-party batch 8

The End is Nigh: the caster's Frightened on a critical success, a misfortune note, and a frightened floor (`conditionFloor`, `note-watchers.js`). Sensory Deprivation: two caster picks on a critical failure (`casterChoice.twoOn`), and the restricted trait's spells refused (`castForbid`). Bewilder: a GM-played note with the end-of-turn save. Evidence: `docs/verification/phase-third-party-batch-8.md`.

### Third-party batch 9

Quick Siphon: the caster's healing, then one persistent bleed it may end (`healing.endPersistent`). Umbral Escape: the module's Effect proved, its "all" resistance patched to "all-damage", its granted immunity Effect accepted (`grantedImmunity`). Shadow's Betrayal: a spell attack from the text, the darkness question, and the damage typed by the target's Strike (`damageTypeFrom.kind: "target-strike"`). Careless Swings: the caster's trait, as a note. Shade of Night: a note whose text follows the cast rank (`rankText`). Evidence: `docs/verification/phase-third-party-batch-9.md`.

### Third-party batch 10

Siphoning Rivulet: the text's bleed rolled as damage now (`damage.immediate`, PF2e's `evaluatePersistent`), the caster's temporary Hit Points from the total bleed (`damage.siphon`). Unknowable Icon: a rune's stored trigger whose Trigger saves every targeted creature on one card (`storedTrigger.area`). Drown: a penalty on checks with item traits (selector `check`), the held breath's note with its re-save, `third-party-note` reminders. Kinetic Tow: forced movement toward the caster's pick (`direction: "chosen"`). Evidence: `docs/verification/phase-third-party-batch-10.md`.

### Third-party batch 11

The text's save where the item has none (`fitTextSave`, Eternal Slumber: Unconscious for the spell or for good, the Drowsy note). Summon Jury as an incarnate (bold phase titles, the penalties' heightening kept): its row notes' modifiers take the cast rank's value (`rankValues`), and a "next" roll's is removed after it. Sudden Outbreak: the GM-confirmed diseased target, and its disease saves in GM-played notes. Evidence: `docs/verification/phase-third-party-batch-11.md`.

### Third-party batch 12

Ruler of Everything: "creatures are temporarily immune" read as the immunity; the nobility bonus as the GM's save question; Prone with GM-played behaviour notes. Web of Darkness: Speed penalties as `all-speeds` notes for the spell, the strands' AC and HP at the cast rank, Immobilized for the spell. Divine Adjudication: the damage rows; the caster's conditional bonus a GM note. Evidence: `docs/verification/phase-third-party-batch-12.md`.

### Third-party batch 13

Beguile: the caster's voice or appearance on the card, its condition for the sustained spell (`optionConditionRows`), the GM's notes. Dream Come True: fantasy or nightmare as sets of entries on every row (`optionSetRows`), Stupefied ending with Off-Guard, the nightmare's frightened floor and its Confused while frightened, and the rows' own times where the item's duration "varies" (`rowDurations`). Evidence: `docs/verification/phase-third-party-batch-13.md`.

### Third-party batch 14

Effect + note proofs: Liberator's Ferocity (the resistance and damage bonus at twice the rank; the text's round over an Effect with no end, via `durationOverride`), Weapon Trance (Team+) (PF2e's proficiency equivalences, the cursebound bonus), Volley My Ally (the heightened Strike range). Evidence: `docs/verification/phase-third-party-batch-14.md`.

### Third-party batch 15

Freezing Cold: one basic save where the action counts change only the area and terrain (`fitActionAreas`, reminders). Blood Surge: the caster in its own area, one degree better (the caster-share rule, now for an area the caster must be in: `casterShareArea`), with the blood rage's parts as reminders. Evidence: `docs/verification/phase-third-party-batch-15.md`.

### Third-party batch 16

The user's 2026-10-06 ruling: third-party spells of the 2026-10-04 GM-handled kinds count the same. Seven are GM cards (`user-rulings.js` with the ruling's date): If Walls Could Talk, Fall to Ruin, Raise Mountain, Thousand-Year Flood, State of the Art, Sacrosanct Promise, From Thine Sight. Raise Mountain and Thousand-Year Flood have GM options (the latter rolling the text's formula, since its item has no damage). Evidence: `docs/verification/phase-third-party-batch-16.md`.

### Third-party batch 17

Tidal Grasp: a spell attack against a save's DC (`resolution.attackDefense`, the card's adjustment from AC), Grabbed until the end of the next turn or an Escape, the critical success's text damage, the attack again on each Sustain (`sustainAttackAgain`), immunity on the attack's critical failure, and the target's size by rank as the GM's question. Evidence: `docs/verification/phase-third-party-batch-17.md`.

### Third-party batch 18

Effect + note proofs: Wishful Thinking (its choices, a second from 9th, the fly Speed and +1 from 6th, each listed effect's rules; `heightenedClaims`) and Life of the Party (the treat's temporary Hit Points by rank and damage bonus). The Effect + note route presets PF2e's choices from `choiceSelections`. Evidence: `docs/verification/phase-third-party-batch-18.md`.

### Third-party batch 19

Dynamic Caustic Blast by variant (`fitCausticVersion`): the Hardness notes by rank, the burst's table with its critical persistent acid, and the Splash variant's no-save ring (direct damage on any number of targets). Dynamic Telekinetic Projectile (`fitProjectileVersion`): the held weapon's range until the turn ends (`untilTurnEnd`, 0 rounds), and each type variant's attack. Evidence: `docs/verification/phase-third-party-batch-19.md`.

### Third-party batch 20

Action versions: a "1 to 3"-action spell with no PF2e variants compiles each count's version, and the card asks the actions spent (`action-versions`; Dynamic Shield, each version official Shield's sequence). Dynamic Fly: each variant's Effect proved (`fitFlyVersion`), with the text's end-of-next-turn duration. Proofs now strip a module's own Effect link and accept both land-Speed paths. Evidence: `docs/verification/phase-third-party-batch-20.md`.

### Third-party batch 21

Dynamic Gouging Claw (`fitClawVersion`): the claw Strike as PF2e's Strike rule element with its critical specialization, then immune (the stated-effect route's immunity); the bleeding attack with the caster's type; and a new `compound` plan (the claw, its reach until the next turn ends, then the attack's card). A live audit of all 172 resolved spells, after which the proofs read PF2e's bracket values (`ruleValueAt`). Evidence: `docs/verification/phase-third-party-batch-21.md`.

### Third-party batch 22

Dynamic Ignition (`fitIgnitionVersion`): the burning square (a hazard part: a square, entering or ending a turn, rounds rolled at placement; incarnate cards keep a variant's overlays), and the attacks with their persistent fire. Dynamic Vampiric Feast (`fitFeastVersion`): the next spell's temporary-HP marker read by the save card's finalize, and the touch and ranged versions as official Vampiric Feast. Evidence: `docs/verification/phase-third-party-batch-22.md`.

### Third-party batch 23

Winter's Cold Embrace (`fitColdEmbrace`): the burst's turn-end basic Fortitude cold, spirit instead for a creature that is cold-immune or cold-resistant and has no darkvision (`damageSwap` `resistant-no-darkvision`). Aura of Violent Light (`violent-light.js`): a willing ally's aura saved against as enemies end their turns, growing 5 feet on the first Sustain each round to 15. The module's Effect is on the ally, its badge raised with the aura (`auraGrowth`, `anchorEffect`, `anchorAlly`). Evidence: `docs/verification/phase-third-party-batch-23.md`.

### Third-party batch 24

Propagating Arc (`propagating-arc.js`): the target's basic save, then on its failure an `areaFollowUp` card for the others around it (`outer`, `excludeCentre`, `needsInner`): the text's (rank)d6 formula with a basic save, half beyond 10 feet (`halfTargetUuids` → `shapeHalf`), none when no one is within 10 feet. Warped Visage (`sustain-ally-save.js`): Enfeebled while sustained; the first Sustain each turn gives one ally of a failed target within 30 feet a Will save card against Frightened, with immunity (`sustainAllySave`). Evidence: `docs/verification/phase-third-party-batch-24.md`.

### Third-party batch 25

Cosmic Glow (`cosmic-glow.js`): a placed square's basic save when cast and on each Sustain after the GM moves it (`moveOnSustain`), Fascinated on a critical failure; the caster and its allies inside hold the +2 Recall Knowledge Effect (`memberRules`, `memberAllies`, `memberCaster`) and can be left out of the damage on review. Evidence: `docs/verification/phase-third-party-batch-25.md`.

### Third-party batch 26

View Internal Anatomy (`stated-effect.js` `anatomy`): the caster's precision damage (the rank's amount) on Strikes and damaging spell attacks against the one targeted creature (`againstTarget`, its signature filled in), the creature's physical facts whispered to the GM (reveal kind `anatomy`), and a GM option for an ally who Aided. Evidence: `docs/verification/phase-third-party-batch-26.md`.

### Third-party batch 27

Hope Prevails (`condition-lower.js`): three `action-versions`, each a `condition-lower` plan that lowers Frightened by 2: the touched target, a target with the proved module Effect (+2 vs fear), or every creature in the caster's 30-foot emanation. A frightened condition an Effect grants is kept, and the card has the GM's counteract button. Evidence: `docs/verification/phase-third-party-batch-27.md`.

### Third-party batch 28

Energy Exertion (`fitEnergyExertion`): each PF2e variant is a spell attack whose text dice, `(@item.rank)d4` or `(2*@item.rank)d4`, stay untyped until the card asks for the residual energy's damage type (`casterChoice` `damage-type`); the trait is a note. Evidence: `docs/verification/phase-third-party-batch-28.md`.

### Third-party batch 29

Technomancy Ray (`fitTechnomancyRay`): a spell attack whose die the caster's Crafting rank sets when rolled (`skillDie`: d4, d6 at master, d8 at legendary); double damage and 1 persistent damage on a critical hit; fire, or the Variable Core's type asked on the card, which retypes the row's persistent damage too (`casterChoice.outcomeFormulas`). Evidence: `docs/verification/phase-third-party-batch-29.md`.

### Third-party batch 30

Mark of Mystery (`mark-ward.js`, `mark-ward-runtime.js`): ward Effects on the caster and the targeted ally. An attack roll on either, or a module save card against either, starts the spell's Will save card for that creature (Frightened 1 or 2, immune for an hour), asked once each; a creature of the caster's tradition's types (or a dragon or spellcaster of it) gets the module's proved −1 penalty Effect first. Evidence: `docs/verification/phase-third-party-batch-30.md`.

### Third-party batch 31

Unhelpful Nudge (`fitNudge`): a failed save pushes 10 feet where the caster chooses during the Stride. A gated follow-up save (the GM's "pushed into another creature or object?") makes it Prone on a failure. Row follow-up saves can now carry a GM-question gate (`synchronizeSecondary`, `gmQuestionGates`). Evidence: `docs/verification/phase-third-party-batch-31.md`.

### Third-party batch 32

Targeted Ward (`targeted-ward.js`): three `action-versions`, each the opponent's Will save card. At Finalize the caster's 4-round Effect (`casterWard`) has a ChoiceSet for the defense and the row's status bonus to it against that opponent (one more from 5th rank). The one-action version's bonus is behind a toggle. Evidence: `docs/verification/phase-third-party-batch-32.md`.

### Third-party batch 33

Discern Secrets+ (`stated-effect.js` `secrets`): the caster chooses +1 status on the targets' Recall Knowledge, Seek and Sense Motive rolls, or the removal of each target's Concealed (one an Effect grants is kept, with the counteract), while sustained. Two targets from 5th rank (`maxTargets`); the module's dead Effect links are claimed (`ignoresLinks`). Evidence: `docs/verification/phase-third-party-batch-33.md`.

### Third-party batch 34

Enchanting Rhapsody (`rhapsody-aura.js`): the caster's emanation, saved against by enemies when cast and as their turns end. Its rows are notes (−1/−2 to mental saves, Fascinated granted, the dance a GM note) that last while the creature is in the area and, with `afterLeaveRounds`, 1 round after it leaves. A critical success is immune for a minute. Evidence: `docs/verification/phase-third-party-batch-34.md`.

### Third-party batch 35

Overwhelming Festivities (`trigger-aura.js`, `trigger-aura-runtime.js`): the module's Aura on the caster, its radius proved at each rank. An enemy holding its Effect that fails an emotion save, or newly becomes Frightened, takes the text's persistent mental damage at the cast rank (the active GM's watcher). Evidence: `docs/verification/phase-third-party-batch-35.md`.

### Third-party batch 36

Divine Eclipse (`divine-eclipse.js`): the caster's 60-foot emanation, saved against as turns end except by the blessed and creatures within their bright light. Up to 5 blessed targets hold the module's proved light and fast-healing Effect while inside (`blessed`, `syncBlessed`). Evidence: `docs/verification/phase-third-party-batch-36.md`.

### Third-party batch 37

Shadow Puppetry (`pulse-area.js`): the placed burst deals the text's dice of the caster's chosen type to each creature in it, with no save, when cast and on the first Sustain each turn (region area `sustainPulse`, `areaPulse`). Evidence: `docs/verification/phase-third-party-batch-37.md`.

### Third-party batch 38

Channel Imperial Dragon (`stated-effect.js` `imperialDragon`): the caster's Effect from the text (the dragon traits, resistance to its damage type, +1 to saves against its trait). The dragon comes from the caster's Imperial Dragon Emissary flag or is asked from the dedication's five (`presetFlag`). The Sustain's Diplomacy and Intimidation bonus is a self GM option until the end of the caster's next turn. Evidence: `docs/verification/phase-third-party-batch-38.md`.

### Third-party batch 39

Metamorphic Armor (`rule-sets.js` `metamorphic`): the caster's switchable 1-minute Effect. Each listed resistance type (half the level, or half + 2 for energy), +1 circumstance AC, or +1 status Reflex against area spells is an option, switched when it Strikes. Evidence: `docs/verification/phase-third-party-batch-39.md`.

### Third-party batch 40

Secret of the Forebearers (`stated-effect.js` `forebearers`): the patron's skill is asked at the cast. The card's `aid-roll` option is the forebearers' once-a-turn Aid (that skill against DC 15, a failure a success, legendary a critical success; the bonus on the next attack roll or skill check). After an aided success, the second option makes the caster Concealed until its next turn. Evidence: `docs/verification/phase-third-party-batch-40.md`.

### Third-party batch 41

Shadow Wield (`fitShadowWield`): each variant (melee 1d8, ranged 1d6) is a spell attack repeated on Sustain, with the caster's type among bludgeoning, piercing and slashing and void for the GM's "more detrimental". The card also sets a spell's own type toggle (its suboptions) to its choice before rolling, so the item's type overrides follow it. Evidence: `docs/verification/phase-third-party-batch-41.md`.

### Third-party batch 42

Chorus Made Manifest (`swarm-form.js`): the caster's 1-minute Effect with the swarm form's rules (traits, resistance, weaknesses, low-light vision, fly 60) behind its toggle. The Choral Swarm Attack is a card option starting its own basic Fortitude save in the cone (the text's formula; Deafened on a critical failure). Evidence: `docs/verification/phase-third-party-batch-42.md`.

### Third-party batch 43

Planar Court (`courtRows`): the text's Will save (the text-save fitter reads it at a sentence's end). The caster names an attribute on the card, and the failing rows are sustained notes with a −1/−2 status penalty to that attribute's checks, DCs and saves (`-based`). The caster is Doomed 1 on a critical success. Readers can now name row narration (`narration`). Evidence: `docs/verification/phase-third-party-batch-43.md`.

### Third-party batch 44

Ice Guardian (`ice-guardian.js`): the conjured Large guardian token, its stats by rank (`conjure.step`). A following region gives the caster and its allies beside it lesser cover (`conjure.coverAura`, member rules, the guardian excluded). The Sustain's standard cover is a card part. Evidence: `docs/verification/phase-third-party-batch-44.md`.

### Third-party batch 45

Hyper-Arcane Pressure Point Strike (`pressure-point.js`): the struck creature is marked. The card's activation option starts the text's Fortitude save, using the caster's unarmed Strike damage read at the cast (`strikeDamage`) by the row, with Enfeebled 1/2 for a round and a flat-check note; activating ends the spell (`endsCast`). Evidence: `docs/verification/phase-third-party-batch-45.md`.

### Third-party batch 46

Coalesce Form, Untamed Aspect Shift and Witch's Bottle (`proxy-cast.js`, kind `proxy-cast`): the caster picks the spell the text names (the daily polymorph; Pest Shift, or Animal Shift from 2nd; one of its own hex spells), and the module resolves that spell as its own card would. Coalesce and Untamed cast it at this spell's rank; Untamed adds the +2 attack toggle; Witch's Bottle slows the caster by the hex's actions. Evidence: `docs/verification/phase-third-party-batch-46.md`.

### Third-party batch 47

Fractal Frosting (`proxy-cast.js` shaper) and Manifest Wicket Dominion (new `wicket-dominion.js`, kind `caster-dominion`).
- **Fractal Frosting:** casts Frostbite at its rank. For the minute, a caster Effect (`castShaper`) adds spellshape riders to every Frostbite cast: difficult terrain around each target, and from 9th rank a Speed penalty of –5 or –15 feet by the result.
- **Manifest Wicket Dominion:** a stationary emanation. The caster alone holds a +rank status bonus to damage and healing while inside (`memberCasterOnly`).

Also changed:
- Plain Ongoing reconciles now coalesce.
- The test cleanup removes orphaned records.

Evidence: `docs/verification/phase-third-party-batch-47.md`.

### Third-party batch 48

Promised Renewal (new `promised-renewal.js`, kind `renewal`):
- **A corpse:** the plant growth starts at once.
- **A dying creature:** it gets the Fortitude save card (Dying +2, or +3 on a critical failure). If the save kills it, the growth starts around it (`renewalOnKill`, on `saveApplied`).
- **The growth:** a region with difficult terrain, giving fast healing to fungus, plant and wood minions, both grown by the Heightened (+2) entry.

Evidence: `docs/verification/phase-third-party-batch-48.md`.

### Third-party batch 49

Instant Surgery (new `instant-surgery.js`, kind `attribute-surgery`): the caster's spell attack against the target's AC, +2 circumstance with View Internal Anatomy aimed at it.
- **Critical hit:** two attributes, each boosted or depleted.
- **Hit:** one attribute boosted and one depleted.

The result is the target's 1-minute Effect, ±1 status to the `<attr>-based` selectors (±2 from 8th rank). Evidence: `docs/verification/phase-third-party-batch-49.md`.

### Third-party batch 50

Garden of Crystals (new `crystal-garden.js`, kind `crystal-garden`):
- The caster's emanation of difficult terrain, with a reminder Effect that the caster ignores it.
- Three clusters placed by the caster: walled off, with creatures inside moved to the nearest free adjacent space.
- The squares around the clusters: a member rule of critical-only force dice (1d10, +1d10 every 2 ranks). The module's Effect is checked against this at every rank.
- With no duration, it lasts until the GM ends it (`durationSeconds: null`). Walls, regions and the reminder end with it (`extraEntryUuids`).

Evidence: `docs/verification/phase-third-party-batch-50.md`.

### Third-party batch 51

Gruesome Marionettist (new `blood-marionette.js`, kind `marionette`):
- The caster names the prohibited and directed actions.
- The target's Fortitude save sets the bleed: half and until the caster's next turn, full, or double, the last two for the sustained minute.
- The target's Effect card has the GM's controls (`marionetteAct`):
  - "prohibited" applies the persistent bleed at the cast rank;
  - "directed" makes the target immune until its next turn.

Evidence: `docs/verification/phase-third-party-batch-51.md`.

### Third-party batch 52

Mind's Eye Wink (new `dream-hazard.js`, kind `dream-hazard`):
- **The area:** a lingering Will save in the GM's drawn squares. Creatures in it when cast, or entering it, save.
  - A failure gives Stupefied 1 while inside and for 1 round after leaving.
  - A critical failure gives Stupefied 2 while inside, then Stupefied 1 after leaving. A new note option, `afterLeaveRules`, holds those after-leaving rules.
  - Disbelief is the area's Perception control.
- **The object:** the holder's save on the card; a failure gives −1/−2 to checks, behind a toggle.

Evidence: `docs/verification/phase-third-party-batch-52.md`.

### Third-party batch 53

Lucky Decision (new `fate-roll.js`, kind `fate-roll`): the d20 is kept on the caster's Effect, with two reactions on the card (`fateAct`):
- **Your Good Luck:** a forced fortune SubstituteRoll, one rule per selector.
- **Their Bad Luck:** the enemy's Will save, then its one-roll penalty, plus the kept result on a failure.

Either reaction ends the spell. Evidence: `docs/verification/phase-third-party-batch-53.md`.

### Third-party batch 54

Wooden Engulfment (new `engulfing-tree.js`, kind `engulfing-tree`):
- **The tree:** a token with HP and AC at the rank, Immobilized. Creatures in its square are moved beside it (`moveOutOfBoxes`, now shared with Garden of Crystals).
- **The grab** (`treeGrab`): the caster's spell attack against the Reflex DC, giving Grabbed, or Restrained on a critical success, until the end of the caster's next turn.

Garden of Crystals was re-run live after the refactor. Evidence: `docs/verification/phase-third-party-batch-54.md`.

### Third-party batch 55

Famed Figure (`illusory-creature.js` `compileFamedFigure`, kind `illusory-creature`): Illusory Creature's token and card.
- Melee Strike (1+rank)d4 and ranged Strike rank d4 (30 feet), with the multiple attack penalty.
- Casting it again ends the caster's earlier image.

Illusory Creature's live case was re-run; its fixed waits are now polls. Evidence: `docs/verification/phase-third-party-batch-55.md`.

### Third-party batch 56

Coiling Grasp (new `weapon-grapple.js`, kind `weapon-grapple`):
- The Grapple rolls the higher of Athletics and the spell attack against Fortitude, after the Heightened size check.
- Critical success: Immobilized. Success: Grabbed. Each lasts until the end of the caster's next turn.
- Each Sustain tries again (`weaponGrapple`).
- On a critical failure, the target chooses to grab the caster or knock it Prone.

Evidence: `docs/verification/phase-third-party-batch-56.md`.

### Third-party batch 57

Dream Logic (new `dream-table.js`, kind `dream-table`): each creature in the aura saves, or takes a failure if willing.
- A failure rolls the 1d4 table. A critical failure rolls twice and the caster picks.
- The entries: Object Fallacy's +1; Static Time lengthening timed Effects; Untethered, the module's fly Effect, checked against the text; Warped Energy's per-type DamageAlteration.

Evidence: `docs/verification/phase-third-party-batch-57.md`.

### Third-party batch 58

Honorable Death (new `honor-duel.js`, kind `honor-duel`): the champion and the Will save, then the target's Effect for its row's time.
- **End-of-turn control** (`honorAct`): if the target took no hostile action, 2×rank spirit damage with a basic save. On the longer rows a recovery save follows (−1 round, or ended).
- **At 0 HP:** the target dies (`honorDeath`). The module reads "a creature" as the target, logged for review.

Evidence: `docs/verification/phase-third-party-batch-58.md`.

### Third-party batch 59

Shine Spotlight (new `spotlight.js`, kind `spotlight`):
- The burst is a region: +1 status to Perform and −1 circumstance to Stealth, from the text.
- Non-allied onlookers within 15 feet save, or become Fascinated and Off-Guard until the spell ends.
- The performer's control (`spotlightPerform`) uses its Performance against each onlooker's Will DC.

Evidence: `docs/verification/phase-third-party-batch-59.md`.

### Third-party batch 60

Coiling Creepers (new `creeper-maneuver.js`, kind `creeper-maneuver`):
- The burst is difficult terrain.
- The card's maneuver control (`creepersAct`): Disarm, Reposition or Trip with the spell attack modifier and multiple attack penalty, against a creature in or beside the area that is Huge or smaller.
- A cleared square is cut from the region.

Evidence: `docs/verification/phase-third-party-batch-60.md`.

### Third-party batch 61

Long Live the Revolution (new `rally-cry.js`, kind `rally-cry`):
- The act of rebellion is kept on the caster's Effect.
- The saves (`rallySaves`) are PF2e's, with incapacitation. Willing creatures fail, opposed ones get +4, and critical successes add cheers up to +4.
- Rebels are Fascinated, with a toggled +1. Their controls (`rallyAct`) are a new save, or persuasion (not on a critical failure).
- Immunity lasts 1 hour, and the Sustain lets newcomers save.

Evidence: `docs/verification/phase-third-party-batch-61.md`.

### Third-party batch 62

Unleash True Power (new `true-power.js`, kind `true-power`):
- **Heightening:** the caster's Effect shapes every other spell +1 rank, up to 10th. This uses `castShaper` with `spellSlug: "*"`; the rank-change rider gained a numeric cap.
- **Through the patron** (`truePowerCast`): 1d6 spirit per rank, basic Fortitude.
- **The end:** a 10d6 spirit basic Fortitude save card for the caster and every creature within 10 feet (a `deleteItem` hook).

Evidence: `docs/verification/phase-third-party-batch-62.md`.

### Third-party batch 63

Mystic Bomb (new `mystic-bomb.js`, kind `mystic-bomb`): the bomb's region, its damage of the Arcane Cascade's type.
- With creatures in it, it explodes at once: a basic Reflex save card from a variant of the spell.
- Otherwise it waits, with controls (`bombAct`): explode, grow (+5 ft to 20), and Aid (+1d6/+2d6, limited uses).

Evidence: `docs/verification/phase-third-party-batch-63.md`.

### Third-party batch 64

Spirit Boundary (new `spirit-boundary.js`, kind `spirit-boundary`):
- The shield's version is chosen by the actions spent. Its inline HP and reduction are checked against the Heightened entry.
- The burst is a region for the minute.
- Damage whose origin is across the edge is reduced (`boundaryOnDamage`), the shield taking it once per effect, until it is destroyed at 0 HP.

Evidence: `docs/verification/phase-third-party-batch-64.md`.

### Third-party batch 65

Seeds of Divinity (new `divine-seeds.js`, kind `divine-seeds`):
- Seeds sprout into bush tokens, with HP and AC at the rank.
- The Sustain's grow control (`seedsAct`) works once a bush is a round old:
  - hazardous: an enter hazard of {piercing, poison} on its square;
  - bountiful: a fruit giving temporary HP and the cursebound damage bonus.
- The bushes end with the spell.

Evidence: `docs/verification/phase-third-party-batch-65.md`.

### Third-party batch 66

Prism of Power (new `power-prism.js`, kind `power-prism`): the prism is a 5-foot region for the minute, with the chosen option on the card (`prismAct`):
- **Scatter:** one spell attack against up to 2 ACs within 5 feet.
- **Diffract:** the cone size from the feet left.
- **Refract:** a GM note.

Evidence: `docs/verification/phase-third-party-batch-66.md`.

### Third-party batch 67

Animated Spark (new `animated-spark.js`, kind `animated-spark`):
- The objects become a PF2e familiar mastered by the caster, with Construct, 2 chosen abilities, and a weakness equal to the caster's level.
- Its token lasts the sustained 10 minutes; casting again ends the earlier one.
- Disperse (`sparkDisperse`): a (1+rank)d4 basic Reflex save card in a 5-foot emanation, then the spell ends.

Evidence: `docs/verification/phase-third-party-batch-67.md`.

### Third-party batch 68

The last two, per the user's decisions:
- **The empty Dynamic Breathe Fire** (`writtenTwin`, `proxy-cast` with variants) casts its written copy.
- **Patron's Apocalypse** (new `patron-apocalypse.js`, kind `patron-apocalypse`, with the book's table in `supplements/patrons-apocalypse.js`):
  - burst regions with a basic-save turn-start hazard and the type's effects;
  - the Sustain's move leaves hazardous terrain.
- Lingering hazards gained `alwaysEffect` (rules for some rounds, persistent damage), and `startRegionArea` gained `enemiesOnly` and `concealment`.

All 227 resolved. Evidence: `docs/verification/phase-third-party-batch-68.md`.

### Third-party features batch 1

The "+" modules' spellshapes are read by `readPlusSpellshape` (`plus-spellshapes.js`), the fallback of `readSpellshapeFeat`. The first seven:
- Persistent Spell and Bleeding Spell: persistent riders (`oneTarget`, the spell's type, `critDouble`).
- Trepidation Spell: a conditions rider with `unlessImmune`.
- Heightened Spell: a rank change.
- Dueling Wand: a `self-rules` cast rider.
- Draining Cast: a slot refund and an `hp-cost`.
- Befuddling Spell: a note.

The new `belowHighest` requirement uses the caster's highest castable rank. Evidence: `docs/verification/phase-third-party-features-batch-1.md`.

### Third-party features batch 2

More "+" spellshapes in `plus-spellshapes.js`. A leading Requirements becomes a table requirement unless the form reads it.
- Heroic Recovery+: a `healed-effect` with `atLevel` rules.
- Mighty Summons: a rank change capped at 10.
- Storm Spell: area terrain whose damage is the rank, whose rounds are the cursebound value, and whose type is chosen at the cast. It requires `minCursebound` and `inEncounter`.
- Travel Channel, Ride the Spell (`rangeOrArea`), Slot Rehearsed Reload: the table's.
- Tenacious Magic: mythic proficiency.

Evidence: `docs/verification/phase-third-party-features-batch-2.md`.

### Third-party features batch 3

Seven "+" spellshapes, in `plus-spellshapes.js`, that change a spell's targets, area or damage:
- Safe Spell (`exclude-allies`) and Compressed Spell (`compress`, its save penalty for that card) work on the card's targets.
- Reshaped Spell (`reshape`) changes the template.
- The Lurking Storm (`damage-split`) splits the rolled damage.
- Sacrificial Spell: a `self-rules` with `untilRoll`, removed with the next roll.
- Transmute Spell (`transmute`): an essence chosen at the cast; Mind adds flat damage, Spirit skips creatures without the weakness.
- Huddle Channel: the table's.

Evidence: `docs/verification/phase-third-party-features-batch-3.md`.

### Third-party features batch 4

Magic+'s mystic duo:
- `mysticLinkEffect` and `mysticDuoOf` find the link and the duo, and the `mysticLink` requirement is checked.
- Eldritch Resilience (`duo-effect`) puts the module's Effect on the duo, tied to the link.
- Spell and Steel uses `extra-damage`, with `cantripFormula` and `damageTypeFrom: "duo-weapon"`.

Linked Target Spell, Twinned Target Spell and Ally Form use `redirect-self`: a self-only Effect gets its recipients from `shapeSelfRecipients`, and `shapeSelfAfter` ties, caps or ends the copies. Evidence: `docs/verification/phase-third-party-features-batch-4.md`.

### Third-party features batch 5

Four more "+" spellshapes:
- Drain Destiny (`mythic-drain`): Mythic Points on a hit.
- Reporting Spell (`report`): one fact about an affected enemy, whispered; the enemy immune for a day.
- Enlightening Spell (`ally-recipient-effect`, through `shapeRecipientsAfter` from the Effect route and the healing path): the module's Effect on the allies reached, when the caster is cursebound.
- Beguiling Feint (`feint-check`): Deception against Perception on the card, Intelligence instead of Charisma, with Off-Guard for the spell or on the caster.

Evidence: `docs/verification/phase-third-party-features-batch-5.md`.

### Third-party features batch 6

Seeking Spell:
- `cover-reduce`: `shapeCoverReduceFor` adds a modifier to the card's attack roll, never more than the target's cover bonus.
- `seek-retry`: a Sustain reminder after a plain miss.

Tandem Casting, Spell Tag (`touchOnly`), Distilled Magic, Mixed-Potency Tincture, Recharging Spellgun and Elemental Study Notes are table rules; the last four are marked `passive`. Evidence: `docs/verification/phase-third-party-features-batch-6.md`.

### Third-party features batch 7

`readItemSpellshape` falls back to `readPlusItemSpellshape`: each spellshape activation of a "+" item is read as a feat. This covers the Power Rings' Veracious Spell and the scepters' Sicken Spell, Energy Ablation, Heighten Spell, Reach Spell, Dangerous Odds and Purifying Spell.

`recordShaping` also finds an item that offers PF2e's spellshape selector suboption, and reads its activation of that name. Evidence: `docs/verification/phase-third-party-features-batch-7.md`.

### Third-party features batch 8

The Power Ring runes:
- Hone Spell (`hone`) leaves one target on the card, and `rollSave` replaces its save with the caster's spell attack (with the ring's bonus), mapped to save degrees.
- Veracious Summon (`summon-strike-bonus`) uses the summon route's `shapeSummonedAfter` to give the summoned creature a status bonus to its Strikes.
- `powerRingBonus` reads the worn ring's bonus.

Evidence: `docs/verification/phase-third-party-features-batch-8.md`.

### Third-party features batch 9

Fury of a Thousand uses riders for each spell (`spell`); only the cast spell's are kept. Murmuration's `dual-damage` (`shapeDualFor`) deals the damage in full as each type, per the user's decision. `effect-value` (`shapeAdjustEffects`) sets Murmuration's −3 and Song of Strength's +2.

Held-trigger spells keep the cast's message. When they trigger, the card reads that cast's spellshape riders through `shapeMessageId`. Evidence: `docs/verification/phase-third-party-features-batch-9.md`.

### Third-party features batch 10

Text rules: `readTextRules` (`plus-feature-rules.js`) gives a passive feature's rules from its text. `text-rules.js` wraps `ItemPF2e#prepareRuleElements` so they apply in memory; nothing is saved, and official items are untouched.

Passive cast riders: `readPassiveCastRider` is read at every cast the holder makes.

The first entries:
- Rudimentary Perfectionism: twice only from a slot.
- Power of Blood: the bleed (`self-persistent`) and the flat-check notes.
- Wayward Gifts: the Effect verified, and the primal gift's temporary Hit Points on PF2e's Sustain (`waywardSustain`).

Evidence: `docs/verification/phase-third-party-features-batch-10.md`.

### Third-party features batch 11

- Steady Spellcasting's card reads its DC and its slot refund from the feat's text (Magus+'s Steady Spellcasting+: DC 10, the slot given back).
- Text rules fix the Effects of Comfort of Struggle (`levelFrom: "origin-cursebound"`, set by `textRulesOnCreate`) and Scholar's Lore.
- New passive riders:
  - `offguard-save-penalty` (Cloaked Casting) and `offguard-concealed` (Extended Cloaking);
  - `redirect-self` to the familiar, optional (Monstrous Familiar);
  - `consume-target-effect` (Scholar's Lore).
- Slot-Charged Spell (`slot-charge`).

Evidence: `docs/verification/phase-third-party-features-batch-11.md`.

### Third-party features batch 12

Magic+'s wickets (`readWicket`) are passive riders. They require the caster inside its dominion (the dominion region's `casterDominion` flag, `wicketDominionOf`) and a slot or Focus spell with a wicket trait.

At the cast, riders are filtered by `ifTraits`, by `minLevel` (Overwhelming Wicket at 11th) and by `threaded` (once a round), and optional damage swaps are asked.

The first four:
- Luminor: persistent fire; Blinded.
- Propulsor: a push with `attackDegrees`; a `damaged-save` card.
- Erosior: terrain around creatures while the dominion lasts; `degree-rules` Speed penalty.
- Verdor: Immobilized.

Evidence: `docs/verification/phase-third-party-features-batch-12.md`.

### Third-party features batch 13

The other seven wickets:
- Mortisor (`targeted-condition`, `on-kill-rules`);
- Savior (`healed-full-effect`);
- Atmosphor (`self-rules` with `until`, `follow`);
- Desolator (notes);
- Fabricator (`dominion-creature-effect`, gone with the dominion);
- Magnetor (`magnet-pull`, `target-rules`);
- Ardor (`twin-target`).

Wicket Infusion (`infuse-trait`) gives the wicket's riders the chosen trait. Evidence: `docs/verification/phase-third-party-features-batch-13.md`.

### Third-party features batch 14

- Table-only features (`TABLE` in `plus-feature-rules.js`) are read but add nothing at the cast.
- Worn equipment carries passive riders, such as Embodiment: a `self-rules` with the ring's bonus, for the spell's duration.
- Text rules fix Effect: Embodiment Ring Rune.
- The form lists are checked when the module loads.

Evidence: `docs/verification/phase-third-party-features-batch-14.md`.

### Third-party features batch 15

"+" features that regain a Focus Point (`readFocusRegain`) do so when their card is posted (`focusRegainOnCard`), up to the pool's maximum and within their frequency. Emergency Infusion bleeds first; Monastic Practices checks Religion against the level's DC first. Evidence: `docs/verification/phase-third-party-features-batch-15.md`.

### Third-party features batch 16

`readCastReaction` reads four reactions:
- Archmage's Counter (no slot, half-level rank, optional Mythic Point) and Seal the Wicket (wicket-trait slots) join the Counterspell options.
- Haughty Correction and Residual Energy Capture are casting-rules cards.

Evidence: `docs/verification/phase-third-party-features-batch-16.md`.

### Third-party features batch 17

Features that cast a spell themselves (`readActionCast`, `actionCastOnCard`): Become Elemental (Elemental Form at 7th with the text's +31/+14 and +10 feet) and Create Elemental (Summon Elemental at half the level, the energy's trait) spend the residual energy. Constructed Spark replaces the Animated Spark cast with Summon Construct at the highest rank (`replace-spell`). Evidence: `docs/verification/phase-third-party-features-batch-17.md`.

### Third-party features batch 18

The Wildblood instinct: its module rules for rage damage on spells are verified against the text; Effect: Wildblood Infusion is given after each cast (the spell's damage type, replacing an earlier one); Explosive Blood doubles the rage damage on spells and melee Strikes until the end of the next turn (requires raging). Evidence: `docs/verification/phase-third-party-features-batch-18.md`.

### Third-party features batch 19

Magic+'s aspect summons summon their aspect creature at the cast rank, with the module's statistics Effect from the caster (`#aspectStatistics`; choices by PF2e's choice sets or `aspectSelections`). Aspect Sage gives the summoned aspect one aspect ability it lacks (`aspect-ability` rider). Evidence: `docs/verification/phase-third-party-features-batch-19.md`.

### Third-party features batch 20

Colossal Summon gives a 10th-rank summon its listed abilities (`colossal` rider): Gargantuan in 6 by 6 squares, +20 feet, Trample, Earth-Shatterer (casts Earthquake from an innate entry, once per minute) and the Megalophobia aura (a following aura's Will save with direct condition rows, then immunity), which ends before the summon is removed. Colossal Aspect Form answers an aspect form's size ahead (`form-choice`, `shapeChoiceSelectionsFor`): Gargantuan with reach 25, a 6-by-6 token and Trample, undone as the form ends. Evidence: `docs/verification/phase-third-party-features-batch-20.md`.

### Third-party features batch 21

A module's Effect linked without its name is named from the native Effect catalog (`normalizeLegacyLinks(item, catalog)`), so Celestial Shift and Aberration Shift apply their aspect battle forms instead of compiling as notes. Evidence: `docs/verification/phase-third-party-features-batch-21.md`.

### Third-party features batch 22

Magus+'s Spellstrike variants (Imposing, Pummeling, Flaying, Banishing, Living Grimoire, Inverted Energy) are armed by their card. The next fitting cast is delivered by a Spellstrike (`spellstrike` rider), and the caster's first Strike after it applies the variant by its degree (`applySpellstrikeVariant` in `spell-actions-runtime.js`). Evidence: `docs/verification/phase-third-party-features-batch-22.md`.

### Third-party features batch 23

A delivered cast is read from the Strike `deliveredStrikeMessage` picks: the mystic duo's (Scissored Assault), the spellgun's attack (Big Shot), the first successful of two (Dual-Weapon Spellstrike, its second Strike −3 or −2 agile) or the Strike after Residual Spellstrike (−5 or −4). Reverse Spellstrike expends the highest slot and casts the hostile spell that targeted the magus, delivered. Each cast's targets are kept on its message. Evidence: `docs/verification/phase-third-party-features-batch-23.md`.

### Third-party features batch 24

Whirling Wand Strike (a wand's spell, Spellstruck if the caster says so, +half the rank to the Strike's damage) and Eat This! (the module's eat-this toggle for the Strike). `readSpellstrikeFeature` reads the Spellstrike permissions, Dealer of Death's card draw (applied on the caster's Spellstrike Strikes by `spellstrikeFeatures`) and Slide Slice's critical-hit reminder. Evidence: `docs/verification/phase-third-party-features-batch-24.md`.

### Third-party features batch 25

An Arcane Cascade stance's damage type comes from the actor's latest spell (`cascadeTypeAhead`, wrapping PF2e's item creation): PF2e's force or the same-turn spell's type, Magus+'s the spell's type. Havok Cascade's havok spells deal the level in damage to the caster and fail if it's avoided (`self-damage`). Reservoir of Power and Puppet String are applied from their cards. Evidence: `docs/verification/phase-third-party-features-batch-25.md`.

### Third-party features batch 26

Don Visage (an Arcana check after a spell: the module's Effect for 3 or 4 rounds), Slidecasting (a cast and a move in the same combat turn: the Slidecast Effect, its bonus status, once a turn, `slidecastNow`) and Invigorate (a creature brought to 0 by the magus's spell or Spellstrike: its card, the Effect on the magus and its familiar, `invigorateOnDamage`). Evidence: `docs/verification/phase-third-party-features-batch-26.md`.

### Third-party features batch 27

Magic+'s essence casting around its own pool (`scripts/essence-runtime.js`): each essence caster's cast read with the pool from before it — a completed cycle gives the caster's terminus at that cycle, a leak is counted, a draw after either without Essence Rebirth is undone; combat start sets the pool (Initial Draw); combat end ends the essence spells' Effects and records. Evidence: `docs/verification/phase-third-party-features-batch-27.md`.

### Third-party features batch 28

Essence casting E2 (`scripts/essence-runtime.js`): Channel Essence Leak's choice on a leak; Essence Conduit's +1 on the next 1- or 2-action cast (no leak for a 1-action essence spell) with Weave Conduit's essence benefit; Life Essence Reservoir — its size from the healing spells, spent by essence-spell healing (the excess taken back), refilled on Refocus. Evidence: `docs/verification/phase-third-party-features-batch-28.md`.

### Third-party features batch 29

Essence casting E3a (`scripts/essence-runtime.js`): the Incantations action and the essence items' activations arm the next essence spell — an incantation out of combat (the pool opened and put back; Maintaining Incantations unless Incantation Mastery; a new one ending the long one), the bell (in combat, no cost), the amulet (no reduction), the chalice (free healing) — and Refocus dismisses incantations and gives back their reductions. Evidence: `docs/verification/phase-third-party-features-batch-29.md`.

### Third-party features batch 30

Essence casting E3b (`scripts/essence-runtime.js`): Unstable Draw (a draw 1 above the essence draw, the flat check, the next essence spell's leak, Unstable Aura's reminder), Terminus of Life's temporary Hit Points, Essence Summoner's bonus to a summon from an essence spell, and the essence spells' 1-day temporary immunity (an immune target left out of the cast). Evidence: `docs/verification/phase-third-party-features-batch-30.md`.

### Third-party features batch 31

Magic+'s power ring runes, read from the worn rune (`src/compiler/plus-feature-rules.js` PASSIVE, `scripts/spellshape-runtime.js`):
- The `attack-crit` rider, on a critical spell attack hit or a natural 20: Immobilizing, Ramming and Perishing open a save card at the rune's DC; Scourging adds persistent damage.
- Overwhelming's natural 19 with Veracious Spell (`basic-save-runtime.js`).
- Energy's Gather Power and Release Power buttons.

The census now also reads the essence items and the Energy rune. Evidence: `docs/verification/phase-third-party-features-batch-31.md`.

### Third-party features batch 32

Blue Salt Crystal, a catalyst for Drown (`src/compiler/item-spellshape.js` and the `spell-persistent` rider in `scripts/spellshape-runtime.js`), and Gray Dust Ammunition (`scripts/plus-ammo-runtime.js`: the card arms the next Strike, a hit marks the creature, its next cast opens the save card). `startShapeCard` can take a spellcasting entry. Evidence: `docs/verification/phase-third-party-features-batch-32.md`.

### Third-party features batch 33

Cast riders:
- Arcane Generator and Transmogrification Boost: the `borrowed-damage` rider and `borrowedDamage` in `scripts/spellshape-runtime.js`, with the `hasSave` requirement.
- Essence Strike: the `essence-strike` action in `scripts/text-rules.js`.
- Essence Mystic Dedication: the `havok-choice` rider in `recordShaping`, and the conflux alias in `spellshape-readers.js`.
- Geojibom's Guidance: the NAMED item cast's overcharge frequency and `selfLight` in `scripts/item-cast-runtime.js`.

Evidence: `docs/verification/phase-third-party-features-batch-33.md`.

### Third-party features batch 34

Spell Ignition (the `spell-ignition` action in `scripts/text-rules.js`: a terrain region whose turn-end save now also deals damage and can spare the caster, in `shapeTerrainTurnEnd`) and Cone of Figments (the `cone-burst` Spellstrike hit rider in `scripts/spell-actions-runtime.js`). Evidence: `docs/verification/phase-third-party-features-batch-34.md`.

### Third-party features batch 35

Triplicate Casting: the `triplicate` action (`scripts/text-rules.js`) arms the caster; `triplicateOnCast` gives back every slot of its three casts but the highest rank's. Evidence: `docs/verification/phase-third-party-features-batch-35.md`.

### Third-party features batch 36

The focus-pool features (`scripts/plus-focus-runtime.js`, hooked in `main.js`): Golden Core's Refocus, I Am Omnipotent!'s free wizard focus spells, Bargain Soul's Focus Point and slot, Revitalizing Bun's restore button. Evidence: `docs/verification/phase-third-party-features-batch-36.md`.

### Third-party features batch 37

The counteract features (`scripts/plus-counteract-runtime.js`): a card whose button counteracts on the targeted creature (Dismiss Paltry Magic, Oracle's Eyes, Snuff Out and its void alternative, Spell Pyrophore and its burn). Evidence: `docs/verification/phase-third-party-features-batch-37.md`.

### Third-party features batch 38

Cast riders:
- Stigmata: its action, its Harm persistent rider (`degreesByActions`, `whileCasterBleeding`, the `per4levels-d4` formula), and its Heal part (`scripts/plus-cast-riders-runtime.js` `stigmataOnHealing`).
- Archmemory (`regain-last-slot`) and Spell Eating (`eat-slot`).
- Black Book Hex: the `self-damage` rider's `rank` formula and damage type.
- Outsider Caller (`summonBurstOnCast`).

The card handlers now ignore messages with a roll context. Evidence: `docs/verification/phase-third-party-features-batch-38.md`.

### Third-party features batch 39

The witch's hex familiar abilities (`scripts/plus-hex-familiar-runtime.js`: on a hex cast or Sustain, the auras' and targets' module Effects, Sunlit Dawn, Reprising Melody, Stumbling Steps; the rest GM reminders). Evidence: `docs/verification/phase-third-party-features-batch-39.md`.

### Third-party features batch 40

Consume Item Magic and Vital Pululation (`scripts/text-rules.js` actions), and the Evolution Surge add-ons (`scripts/plus-cast-riders-runtime.js` `surgeAddonOnCreate`). The rest of the spell-modifier triage is recorded in the audit. Evidence: `docs/verification/phase-third-party-features-batch-40.md`.

### Third-party features batch 41

Wizards+'s exploits and Channel Smite+ (`scripts/plus-exploit-runtime.js`): the exploit card's Rebuttal and Unravel, paid with a slot meeting the Cost; Channel Smite+'s expended Harm or Heal on the next melee Strike. Evidence: `docs/verification/phase-third-party-features-batch-41.md`.

### Third-party features batch 42

PF2e's 107 catalysts (`src/compiler/catalysts.js` via `readItemSpellshape`). Each arms its spell's next cast. Riders by text, PF2e's Effects at the cast, Thunderbird Tuft's retaliation, Wood-Rotted Root's spores (`catalystSporesOnDamage`, with `installDamageTypeMemory`), and catalyst notes to the GM at the cast. Evidence: `docs/verification/phase-third-party-features-batch-42.md`.

### Third-party features batch 43

PF2e's catalysts that were GM notes, now automated (`scripts/catalyst-runtime.js`).

- **Hook points:** cast riders, save-card riders, the Effects' patches once the cast resolves (or its lingering area starts), and event hooks (damage with its recorded source, destroyed images, flat checks, turns, moves, Effects ending, casts in a form, the spell shield's Shield Block).
- **Other changes:** a lingering area's initial save carries the cast's spellshapes and catalysts.
- **Evidence:** `docs/verification/phase-third-party-features-batch-43.md`.

### PF2e variants (action counts)

A spell cast as a PF2e variant is resolved as that variant: the card records its overlay ids and reloads the spell with them for every roll. A base card of a spell with variants lists which variants are automated. The census compiles each variant.

### Direct healing

A spell whose only effect is one stated healing entry (optionally with a linked Effect) resolves on the Effect route: **Resolve Healing** rolls PF2e's own healing (variant and rank included) and applies it to the recipients, checking vitality/void eligibility. See [verification](verification/phase-4-direct-healing.md).

`resolution.healing` may also carry:
- `within`: an emanation's radius. Every recipient's token must be that close to the caster's.
- `noWoundedIncrease`.
- `notes`: `free-movement` / `reaction-limit`, shown on the healing roll message.

Each recipient that had Dying and ends at 1 HP or more loses Dying and Unconscious and gains Wounded (skipped with `noWoundedIncrease`). PF2e 8.5 doesn't do this itself. The result records `revived`. See [verification](verification/phase-4-healing-riders.md).

### Coming back from Dying

`scripts/dying-recovery.js` applies the Dying rule wherever the module restores Hit Points, because PF2e 8.5 leaves it to the table. A creature that was dying before the healing and has 1 HP or more after it loses Dying and Unconscious, and gains Wounded 1 (or +1). The routes that use it:
- direct healing (`effect-runtime.js`; `noWoundedIncrease` keeps Wounded);
- Heal / Harm on the immediate card (`immediate-runtime.js`);
- heal-or-harm healing rows on the save card;
- a caster's damage-derived healing (`basic-save-runtime.js`).

The change is recorded as `revived` and shown on the card or result (“No longer dying (awake); Wounded 0 → 1.”). See [verification](verification/phase-4-dying-recovery.md).

### Conjured food

`src/compiler/food-healing.js` reads food-making healing spells: one narration sentence, the eating sentence, and the food's end (the spell's duration, or a time in the text). Heightened “produces an additional piece of food” and “any amount … with a single Interact action” become `food.pieces.perRank` and `food.anyAmount`. The plan is `resolution.kind: "healing"` with `healing.recipient: "consumer"` and `healing.food`. Any other sentence, a healing amount that isn't the item's entry, or food with no end refuses the plan. At run time, **Resolve Healing** posts a food card (flag `food`: pieces, remaining, `expiresAt` in world time, the spell's UUID and cast rank). **Eat** (or `api.eatFood({messageId, eaterUuid, count})`) goes through the lead GM (`consume-food` request). It checks the time, the pieces left and the eater's owner. It claims the pieces, rolls PF2e's healing once per piece at the cast rank (`loadVariant({castRank})`), and applies the sum to the eater through `applyDamageWithReceipt`, with the vitality/void check and `recoverFromDying`. The eater isn't checked against the spell's Target. An eater with no token on the scene uses its prototype token for PF2e's message. See [verification](verification/phase-4-food-healing.md).

### Heal or harm

A heal-or-harm spell (Harm, and Heal's variants) is compiled per PF2e variant from its fixed grammar: the 1- and 3-action variants become a save card in dual mode (`resolution.dualMode: {energy}`), the 2-action healing variant becomes direct healing, and the 2-action damage variant an ordinary basic save. On a dual card each target is classified when it's added (void heals undead and void-healing creatures and harms the living; vitality the reverse; constructs and non-creatures are unaffected). Healed targets take no save and have no roll button. At Finalize they regain the shared roll's total through `applyDamageWithReceipt` (negative damage, no IWR), after the harmed targets are resolved. Heal itself still uses its dedicated immediate profile, which takes precedence on the chat card. See [verification](verification/phase-4-heal-or-harm.md).

### Void or vitality by the creature

`src/compiler/energy-by-creature.js` reads two wordings. **Execute's pair** ("… takes N void damage with a basic <save> save. If the target is undead or otherwise has void healing, … takes N vitality damage …") is compiled per PF2e variant: the variant's single damage entry must be that energy and amount, and the plan gets a target predicate. Void gets `not-undead-or-void-healing`, and vitality gets `undead-or-void-healing`; `validateActorTarget` refuses the other creatures. **Divine Armageddon's swap sentence** ("A creature harmed by vitality damage … takes vitality damage instead of void damage from this spell.") becomes `resolution.damageSwap: {from: "void", to: "vitality", when: "undead-or-void-healing"}`. It's accepted only on a basic save with shared damage, a void component, and no dual mode (`executableDamageSwap`). At Finalize, `basic-save-runtime.js` renames the void type in the evaluated roll for each undead or void-healing target (`swapDamageType`, dice results kept), applies it, and records `damageSwapped`. The GM convenience "Leveled" rolls are set aside. See [verification](verification/phase-4-energy-by-creature.md).

### Self / not-self Effects

A creature-kind mode list (Lay on Hands, Touch of the Void) is compiled per PF2e variant: the healing variant becomes Effect + healing, and the damage variant a basic save whose failure and critical failure apply the Effect. Each Effect application carries a `text-modifier` proof. The proof holds the recipient context the text names (the caster or not, undead or not) and the modifiers the Effect's own FlatModifier/AdjustModifier rules give that recipient, and those must equal the text's claim. At run time the live Effect's rules must equal the compiled ones and the proof is re-checked. The Effect is created only for recipients matching the context; other recipients are only healed or damaged, and the save card's result notes the skipped Effect. See [verification](verification/phase-4-self-conditional-effects.md).

### Spell attacks with several damage entries

A spell attack whose text names every structured damage entry in one list is compiled with an `attack-component-rows` proof: each row selects the entries it deals (all of them on a hit or critical hit, or the entry a written miss row keeps). The save card's existing per-entry selection (`selectComponentDamageRoll`) rolls PF2e's damage once and applies only the selected instances, scaled by the row, so persistent entries become PF2e persistent-damage conditions and double with the rest. See [verification](verification/phase-4-attack-damage-entries.md).

### Persistent-linked lifetimes

A condition (`endsWhen: {event: "persistent-damage-ended", damageType}`) or a native outcome Effect (`outcomeRule.kind: "persistent-linked-effect"`) can last as long as the target takes the spell's persistent damage of one type. The save card creates it with an unlimited duration and a `persistentLink` flag. If the creature has no persistent damage of that type after the damage is applied (for example immunity to that damage type), the item is skipped and the result card notes it. `scripts/persistent-link-runtime.js` removes linked items when the last persistent-damage condition of that type is deleted, and on world load; only the lead active GM does this. The ongoing cast record then ends with reason `persistent-damage-ended`. See [verification](verification/phase-4-persistent-linked.md).

### Splash damage

A spell attack naming a Splash damage entry compiles with `resolution.splash: {radius: 5, componentIds}`. When the card starts, every other creature within 5 feet of the single target (document-based distance) is added as a `mode: "splash"` row. These rows take no roll and aren't part of the attack. At Finalize, `scripts/splash-damage.js` splits PF2e's evaluated roll into splash parts (terms flavored `splash`) and non-splash parts:
- the target gets a fixed-number PF2e roll of non-splash × row multiplier plus the splash once;
- on a hit or critical hit, each splash row gets the splash alone;
- on a miss, the splash rows are marked unaffected.

A fixed round duration can carry `duration.heightening` (“the duration of the deafened condition increases by 2 rounds”); the card applies it for the cast rank. See [verification](verification/phase-4-splash-damage.md).

### Spell-attack variants that carry a choice

These are compiler rules only; the save card is unchanged. A spell attack's type list (“bludgeoning, piercing, or slashing damage—as appropriate …”), material paragraphs, action-count paragraphs (range, and a half-damage miss) and melee option are read against the PF2e variant being cast. The variant's damage entry, material, Time and range must agree with the text. Paragraphs for other variants are set aside. See [verification](verification/phase-4-attack-variant-choices.md).

### Strike-prelude spells

`src/compiler/strike-prelude.js` sets a spell's Strike sentence aside, removes the narration, and rewrites the rest into the save route's grammar. Save-route plans get `resolution.strikePrelude` and the reminders `strike-prelude` / `strike-placement`, which the save card renders; the Strike itself is the caster's PF2e Strike. When the card starts, additional damage on a hit becomes a generated Effect on the caster. It carries a `DamageDice` rule on `melee-strike-damage` / `ranged-strike-damage` and lasts until the end of the turn. `scripts/strike-prelude-runtime.js` removes it after a Strike damage roll whose domains include its selector. See [verification](verification/phase-4-strike-prelude.md).

### Strike results

A Strike-prelude spell whose rider depends on the Strike's result compiles to a save-card check with statistic `strike` (`strikePrelude.result: true`; `basic-save-core.js` refuses a `strike` check without it). The card needs exactly one target. Its **Read Strike Result** button (`rollSave`) takes the degree from the caster's latest PF2e Strike attack message against that target, made after the card appeared (`findStrikeMessage`: an `attack-roll` context with the `strike-attack-roll` domain). The result is recorded like a spell attack's. A save plan without a native PF2e save button now gets the module's own chat button, labelled **Resolve Strike Spell**, **Resolve Spell Attack** or **Prepare Saves**. See [verification](verification/phase-4-strike-result.md).

### Strike spells with caster Effects

A Strike spell whose other rules are carried by its linked PF2e Effects compiles (`src/compiler/strike-effects.js`) to `resolution.kind: "strike-effects"`, with one or two `applications` phased `before` / `after`. Two Effects are phased by the damage their rules add, as stated in the text; the `before` one is then one-Strike (`removeAfterStrike`). `scripts/strike-effects-core.js` checks the plan, and the census counts it as the `strike` route.

On the chat card, **Resolve Strike Spell** (`scripts/strike-effects-runtime.js`) creates the `before` Effects on the caster. Their origin is the spell at its cast rank, so rank-dependent rules apply. The `after` Effects are recorded on the caster (`pendingStrikeEffects`). When the caster's Strike is resolved (a Strike damage roll, or a Strike attack roll that misses), the lead GM's client removes the one-Strike Effects and creates the pending ones. See [verification](verification/phase-4-strike-effects.md).

### Target-dependent attack adjustments

A spell attack can carry `resolution.attackAdjustment`: a question, choices with whole-number values, a modifier type, and optionally `onApplies`, a persistent formula for targets whose answer is non-zero.
- **Start:** each target gets `attackAdjustment: {status: "pending"}`.
- **Answering:** the card shows the question with one button per choice (`correctTarget` action `attack-adjustment`). An answer is refused after that target's attack is rolled.
- **Rolling:** `rollSave` refuses to roll until the question is answered, then passes the answer as a PF2e `Modifier` to `spell.rollAttack`.
- **`onApplies`:** joins `conditionalDamage` as an entry gated on the answer, with `doubles: false`. It's rolled once and applied to answered, hit targets without scaling.

Cover and concealment rules are `attack-cover` reminders. See [verification](verification/phase-4-attack-adjustments.md).

### Caster Effects on spell attacks

A spell attack can carry `resolution.casterEffect`: the linked Effect, `when` (`always` / `hit`), the clause, and the compiled Effect snapshot. `inspectCasterBenefitClaim` proves the clause against the Effect's rules (FlatModifier, BaseSpeed, and TempHP from a `(@item.level)dN` badge) and its duration, both at compile time and in `inspectDegreeSavePlan`. At Finalize, the card re-checks the live Effect and creates it on the caster when `always`, or when any target was hit. The result card shows “Caster: … applied” or “no benefit (the attack didn't hit)”. Catalog profiles now carry an Effect's `badge` (outside `mechanics`). See [verification](verification/phase-4-caster-effects.md).

### Spell-attack rows with narration and endings

These are compiler rules only. Row dice equal to the entry (or twice it) become full (or double) damage. Narration after a condition's duration is dropped. The Interact-ending lifetime also reads “… to <narration> and end the X condition, but not the Y condition”, where Y must be one of the outcome's conditions. A Spell Effects link right after a row with a Speed penalty is set aside and recorded in `compilerEvidence.rowEffectLinks`. See [verification](verification/phase-4-attack-row-rules.md).

### Repeated blasts and attack follow-up saves

A spell attack with the repeat-window wording carries `resolution.repeatable: {window: "turn", range}`, and its Target becomes one creature per blast. The spell's chat button stays available as **Blast Again**, with one save card per click. The first blast records the combat round and turn on the message (`repeatWindow`), and later clicks are refused once that turn has passed (outside combat the window stays open). `basic-save-core.js` accepts “until the end of your turn” as the repeat window rather than a lifetime.

An attack's critical-hit “must succeed at a <save> saving throw or <outcome>” becomes the critical row's own follow-up save sentence. The item's non-basic save is then only that follow-up. The follow-up save compiler now masks `@UUID` links, so a branch isn't cut at a link's first dot. The residual analyzer also credits Prone granted by a claimed follow-up branch. See [verification](verification/phase-4-repeat-and-follow-up.md).

### Attack condition riders

Compiler rules, plus one reminder kind:
- A hit condition and a different critical-hit condition, each with its own duration, become the two hit rows.
- An empty Target is one creature when the attack says “against the target”.
- `the triggering creature` / `the creature that took damage` is one target, but only when the attack is “against the triggering creature's AC”. `target-predicate-compiler.js` accepts “the creature that took damage”.
- A lone persistent damage entry reads as the damage list. `attack-component-rows` proof and `validate-plan.js` accept one component only when it's persistent.
- “… and the target is X for the duration.” with “When the target's persistent Y damage ends, the spell automatically ends.” is a persistent-linked condition with no timer of its own. The condition carrier Effect takes the spell's fixed duration, so it ends at whichever comes first.
- “The foam can be removed with N Interact actions, which ends the persistent Y damage.” becomes a `removal` reminder. `inspectDegreeSavePlan` accepts it only on a spell attack with a persistent-linked condition.

Incapacitation on the attack is PF2e's own: `spell.rollAttack` receives the spell and target, and PF2e lowers the degree. See [verification](verification/phase-4-attack-condition-riders.md).
