# Foundry Module Runtime

The repository root is an installable Foundry VTT v14 module directory. It is
compatible with PF2e 8.5.0 and loads through `module.json`.

## Completed execution paths

- `effect`: apply one official native PF2e Effect.
- `effect-variant`: select exactly one Effect from the actual cast rank.
- `effect-choice`: prompt for exactly one form, then apply only that Effect.
- `effect-sequence`: apply the primary Effect and preserve its deferred
  successor transition.
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

For the nine current official plans that the compiler classifies as complete
and automatic, the module converts PF2e's existing save button into **Prepare
Saves — [native save label]** instead of adding a second control. These spells
are Electric Arc, Acidic Burst, Animal Allies, Breathe Fire, Sudden Bolt,
Fireball, Lightning Bolt, Cone of Cold, and Spirit Blast. Guided and unsupported
spells retain PF2e's original save-button behavior.

The same workflow also executes 31 fully compiled non-basic saves. Their
degree-specific conditions are applied as native PF2e Effect wrappers using
`GrantItem`. This preserves the compiled value, gives fixed-duration
conditions a real PF2e expiration, keeps each spell's condition separate from
pre-existing conditions, and cascades removal between the wrapper and granted
condition. Conditions with the same effective lifetime share one spell Effect;
conditions with different lifetimes receive separate Effects so their expiry
remains correct. Condition immunity is left to PF2e's native GrantItem
processing.

An undurated valued Stunned condition from an executable outcome is represented
as action debt through the start of the target's next turn. The current safe
gate accepts Stunned 1–3; larger values remain on PF2e's manual path until a
multi-turn action-debt controller is implemented.

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
