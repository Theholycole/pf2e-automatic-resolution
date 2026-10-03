# Phase 5 — transformations (verified checkpoint)

Baseline: Foundry 14.367, PF2e 8.5.0, module manifest 0.8.2; disposable pftest,
September 20, 2026. No release version, commit or tag has been created.

## Implemented scope

Animal Form, Dragon Form and Pest Form on native character actors. Form choice,
rank, casting tradition, explicit space/access review precede application.
Native Effects own statistics, strikes, temporary HP, senses and resistances.
Durable ongoing records own dismissal, expiry, grants and uncertain-write review.
Dragon Breath uses the existing native save collector and native inline damage
preparation, with persisted 1d4-round recharge and GM timing review.

The form guard prevents native entry casting and consumable use before resources
are spent and suppresses prepared movement types not granted by this form.
Underlying actor sources and unrelated Effects remain unchanged.

## Source investigation

- Native PF2e BattleForm only supports character actors; NPCs are explicitly
  rejected rather than receiving a cosmetic Effect.
- Spell origin context follows PF2e's own drag/drop Effect context, including
  spellcasting tradition, attribute and rank-specific origin roll options.
- Installed Dragon Form omits rank 8's +20 status fly Speed and encodes Despair
  with Reflex. Cloned Effects receive narrow corrections; compendiums stay intact.
  [Dragon Form](https://2e.aonprd.com/Spells.aspx?ID=1502) confirms both changes.
- Native Dragon Form's hasHands occurs inside overrides; the module also sets
  the BattleForm field. Native inline damage alteration supplies breath type
  and the extra four rank-8 dice.
- Sovereign's save differs between installed spell text and Archives of Nethys;
  that choice remains unavailable pending source clarification.
- [Polymorph](https://2e.aonprd.com/Traits.aspx?ID=670) requires replacement Speeds,
  restricted actions and a counteract check for overlapping polymorphs. Native
  BattleForm left unrelated movement types available. The scoped prepared-data
  correction removes those until the form ends. Overlap confirmation records a
  GM ruling after native counteract resolution; it does not invent a result.

## Live evidence

| Case | Observed result |
| --- | --- |
| Animal Form 2/4/5 | Passed AC 26/28/28 at level 10, temp HP 5/15/20, Medium/Large/Huge, native attacks +9/+16/+18 and rank-5 doubled dice; dismissal restores actor. Casts `JPt6O9tuYl08FAGb`, `DH6oSDbjeccWUQ5y`, `scQV12iEyWEoRUcy`. |
| Dragon Form 6/8 | Passed AC 28/31, fly 100/120, native strikes, matching occult resistance and Despair Will. Granted breath removed at dismissal. Casts `vhJc8hZUmeqqryKt`, `M584ea66LqXl9V6X`. |
| Dragon Breath | Rank 8 native formula 14d6 sonic, total 45; native Will save corrected to Failure, 45 confirmed damage; duplicate activation blocked; recharge 3 persisted over reload. Card `ztzNIYHZTjEcYKQO`. |
| Tradition and movement | Primal Adamantine physical resistance/burrow, divine Requiem resistances/swim, arcane Mirage spell resistance/climb, mismatched primal Mirage no arcane resistance. Casts `txgvPXGSELSTwqvp`, `fQ5YeuwEHLusVxWJ`, `A89KFAW27O5X5ywO`, `OqSihwHBmQbr5k0k`. |
| Pest Form | Ranks 1/4 ground and rank 4 flying passed Tiny, no Strikes, AC 25, Athletics −4, Acrobatics/Stealth +10, physical weakness and optional flight. Casts `faCVbIRNX9ZZgeXr`, `AlYFYYLnOIhmoaON`, `NX2HDF1WGQgCjWYE`. |
| Reversion and resource preservation | Native slot spent once; transformed casting blocked before spending. 12 slashing consumed 5 temp HP then 7 real HP. Dismiss preserved HP 93, spent slot, rename, unrelated bonus, restored unrelated fly 50. Cast `TXKvmeto3GWRsMOx`. |
| Contrasting animals / own bonuses | Frog tongue reach 15, rank-5 Snake native 4d4 plus 2d6 poison, Orca swim-only 35; own +18 unarmed/Athletics retained over form +9. Casts `4KUkJcnsIIe3hVWw`, `bCMXs9P3BI3QvuMw`, `fR4l3o7iQgdA9e8r`. |

Detailed reports, including failed fixture/development attempts, are retained on
Macro.BNZ7O7p2tRsjh3ew under pf2e-automatic-resolution.formVerification.
The authored verification harness is tools/form-verification.mjs, opened through
the existing ongoing verification macro's Open Phase 5 verification control.

## Additional release checks

- Native token dimensions 1/2/3 confirmed at Animal ranks 2/4/5; casts
  `gAaapqaUEk7fOVPY`, `5L2X3Sudv2mvEpqP`, `6Hlv86rEiGkkIlk4`.
- Native visible agile Claw dialog showed +18 and MAP −4; roll total 28 from
  1d20+14, native damage formula 2d8+7 slashing. Cast `zWRB5vD38usIYRLA`.
- Explicit clock-driven expiry with removal OFF (`FswG4Vh2x0aFB20D`) and ON
  (`DLlBfdNGCZNl43sG`) removed form, granted breath and form temporary HP.
  Saved and effective settings were checked after reload. Original ON restored.
- Native expired BattleForm skips its onDelete cleanup when ignored. A scoped
  wrapper delegates to native TempHP source-aware cleanup even after expiry.
  Independent 40 temporary HP survived: cast `LEJq7SyNePDc5Mjy`.
- PF2e dispatches some actor/token updates after Effect creation returns. The
  module waits for observed native HP and size updates before confirming success;
  missing confirmation stops for review. Earlier failed development attempts
  remain in the harness history, followed by passing reruns.
- Choice and space cancellation created no Effect and retained the native spent
  slot. Overlap cancellation preserved the original; explicit GM-confirmed
  success replaced only the old form (`Uf1rlKgexGbsjlTl` → `e5r7b20uPaOaHDT4`).
  This tested outcome intake, not an actual native counteract roll.
- Owned Player2 start/dismiss passed (`HC8pfegpF50C8Bai`); no connected GM blocked
  application without changing the character. Actor/macro ownership reset to 0,
  temporary hotbar entry removed, player logged out.
- Elapsed recharge enabled a new breath (`yTODxSGfiwWTXQJu`); critical-success
  save applied zero damage. An unstarted combat ID now correctly uses world time.
- Post-create interruption (`mCFXkQ6fEoOgn3YQ`) retained one Effect and Needs review;
  source-card retry and reconciliation did not create a duplicate.
- Original GM disconnected; temporary GM independently ended durable cast
  `CSXRFwYEeJyYqYOu`, removing form, grant and temporary HP. Original GM restored;
  temporary GM role verified 0 after cleanup.

- Final UI inspection confirmed native breath card text (14d6 sonic, Basic Will),
  module activation opening the 30-foot cone/DC 26 review, and compact Animal
  form statistics with expandable native rules. Review cancellation stayed safe.

## Boundaries

This checkpoint covers Animal, Dragon and Pest Form profiles, not every form
spell. Native Effect mechanics are hash-guarded on PF2e 8.5.0. NPCs, Sovereign
Dragon and unverified form families remain unavailable. Speech, non-consumable
gear activation, hand-dependent actions, access, space and area geometry require
explicit adjudication. Test fixtures and intentional Needs review evidence remain
in the disposable world; temporary account permissions are removed separately.

## Automated verification

101 tests passed, zero failures, including form rank/size, cloned native
corrections, optional flight, recharge timing, scoped guards, temporary HP cleanup
and native mechanics baselines. Final source hashes are recorded alongside this
report. No version bump, commit or release tag is implied by this checkpoint.
