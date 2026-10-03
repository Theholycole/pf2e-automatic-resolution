# Coming back from Dying — verification

2026-09-26. This follows the [direct-healing riders](phase-4-healing-riders.md) batch: the Dying rule now applies on every route where the module restores Hit Points.

## Why

PF2e 8.5 doesn't remove Dying when a creature is healed, and doesn't add Wounded. A live probe showed an NPC healed from 0 HP kept Dying 1, and the system code has no such automation. The rules say a creature with 1 Hit Point or more loses Dying and wakes up, and losing Dying gives Wounded 1 (or +1 if it's already wounded).

## Change

`scripts/dying-recovery.js`:
- `isDying(actor)` is read before the healing.
- After the healing, `recoverFromDying(actor, wasDying, {keepWounded})` removes Dying and Unconscious and raises Wounded. It does this only when the creature was dying and now has 1 HP or more.
- `revivedNote` formats the result for cards.

Where it's used:

| Route | File | Shown on |
|---|---|---|
| Direct healing (“Resolve Healing”) | `effect-runtime.js` | a follow-up chat line after the healing roll |
| Heal / Harm immediate card | `immediate-runtime.js` | the target's row |
| Heal-or-harm healing on a save card | `basic-save-runtime.js` | the healed row |
| Caster healed by damage dealt (heal-then-temp benefit) | `basic-save-runtime.js` | the “Caster:” line |

A spell that says coming back doesn't raise Wounded (Rebuke Death) keeps Wounded unchanged.

## Evidence

**Automated:** 385/385 tests pass. `test/dying-recovery.test.js` covers:
- recovery with Wounded +1;
- the keep-Wounded case;
- no change at 0 HP;
- no change when the creature wasn't dying.

[Live evidence](phase-4-dying-recovery-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `dyingRecovery`:
- **Heal, immediate card (1 action):** a creature at 0 HP with Dying 1, Wounded 1 and Unconscious ended at 1 HP with no Dying, awake and Wounded 2. The card said so.
- **Heal, save card (1-action variant, heal-or-harm):** a creature at 0 HP with Dying 1 and Unconscious ended at 1 HP with no Dying, awake and Wounded 1. The healed row said so.
- **Regressions:** `healingRiders` (direct healing, including Rebuke Death keeping Wounded 0), `healOrHarm` and `directHealing` were rerun, and all passed. Cleanup left no fixtures.

**Not tested live:** the caster's damage-derived healing while dying. A dying caster is unconscious and can't cast, so it only matters for a caster at 0 HP who is somehow still acting. It uses the same helper as the other routes.
