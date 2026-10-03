# Define casting, targeting, and non-save spell workflows

ID: 04
Parent: [Full Spell Automation — First Major Milestone](../map.md)
Label: wayfinder:grilling
Type: grilling
Mode: HITL
Status: resolved
Assignee: theholycole
Blocked by: 03

## Question

What should the module own from choosing a spell through completing its immediate resolution, across save spells, spell attacks, healing, and spells that require no roll?

Decide the boundary with native casting, resource consumption, attack rolls, target selection and eligibility, areas/templates, heightening, multi-action variants, and player/GM choices. Account for object or location targets, target changes between steps, and spells that mix attack, save, healing, or native Effects. Preserve native roll choices, ownership boundaries, and the established save-card Finalize reaction window.

Use representative catalog spells to decide how players and the GM interact, which steps the system already performs, and which unresolved rules block a cast. Keep later-turn behavior in the ongoing-spell workflow ticket.

## Comments

### Accepted first round — 2026-09-19

The user accepted all seven recommendations:

1. Keep native PF2e casting and work from its spell card. Read the chosen rank and variant; leave resource spending already handled by PF2e with PF2e to avoid duplicate deductions.
2. Reuse choices made during casting. Collect only missing choices before affected rolls. Changing a choice afterward clears the results it invalidates.
3. Use an area template to suggest affected creatures, preserving GM correction controls. Flag uncertain boundaries and obstructions for review.
4. Check targeting rules that can be established reliably. Keep clearly ineligible targets visible as Unaffected with the agreed GM override. Flag uncertain range, cover, and line of effect for GM judgment.
5. Extend provisional results to spell attacks: native attack dialogs, applicable corrections/rerolls before finalization, and combined damage/Effect application. Gather required attack and save results within one cast workflow for mixed spells.
6. For healing and no-roll spells, use one Resolve action once targets and choices are ready, then post the result; omit an empty intermediate roll-collection card. Spells that also require saves use the staged save workflow.
7. Offer explicit object/location selection appropriate to the spell. Request missing information rather than infer an object or destination from creature targets, and identify mechanics needing adjudication.

### Accepted follow-up round — 2026-09-19

The user accepted the recommendations for application authority, target-bound rolls, and dependent resolution steps. The consolidated resolution follows.

## Answer

Resolved with the user on 2026-09-19 through explicit acceptance of all ten recommendations. The first seven accepted choices are recorded in the first-round comment above and remain part of this resolution.

### Application authority

Players may resolve healing and other no-roll spells when they own the caster and every affected actor. The GM resolves casts affecting actors they do not own. Spell attacks use GM finalization, matching the agreed save workflow. GM-dependent casts wait when no GM is connected.

This is the intended permission contract, not a claim about current enforcement. Read-only inspection found that existing no-save Effect controls require caster ownership or GM status, and execution requires update permission on every recipient or GM status. The current save coordinator can fall back to a non-GM when no GM is active; implementation must reconcile that fallback with the accepted GM-dependent behavior. Relevant code: `scripts/main.js`, `scripts/effect-runtime.js`, and `scripts/basic-save-runtime.js` at the inspected baseline `92b4fd4`.

### Target-bound rolls

Each attack or save remains attached to its original target. An attack result cannot be reassigned to a different target before finalization. Changing the target requires the appropriate new roll, while unaffected results remain intact. Targets can still be added before finalization where the spell permits it. This extends, rather than replaces, the accepted save-target correction controls.

### Dependent resolution steps

When a later step requires an earlier outcome to have been applied, use ordered steps within the same cast. Resolve the necessary earlier outcome before opening the dependent step. Applied steps stay locked; uncertain application stops for review. Ordinary spells retain a single finalization, with the established reaction window before it.

Missing casting choices, target changes, and provisional result corrections can invalidate only results that actually depend on them. They do not reopen an already applied step.

### Planning handoff

These decisions define the casting and immediate-resolution workflow. Detailed outcome interactions belong to [Define outcome application and native system ownership](05-define-outcome-ownership.md). Later-turn responsibilities remain with [Shape recurring saves and ongoing spell controls](06-shape-ongoing-workflow.md); baseline expiry behavior still requires its separate live experiment. Exact permission, retargeting, and ordered-step verification belongs to [Define the milestone verification and exit criteria](08-define-release-evidence.md).

No runtime behavior changed and no new automated or live verification is claimed by this planning resolution.
