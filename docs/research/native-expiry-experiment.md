# Native expiry experiment

Observed in disposable `pftest`, 2026-09-19 (local), Foundry **14.367**, PF2e
**8.5.0**, module **0.8.2**, runtime commit
`92b4fd488f4d73eeed74ad77a78a65411e28bb47`. Production runtime was unchanged.

## Reproduction and evidence

The agent drove Foundry's macro editor and controls through the browser.
The isolated [diagnostic](../../tools/expiry-experiment.mjs) was invoked as:

```js
await (await import('/modules/pf2e-automatic-resolution/tools/expiry-experiment.mjs?v=3')).run(this);
```

The persistent evidence is on `Macro.jTXt6OCb5uKf5tbK`, named
**PFTEST — Expiry investigation**, flag
`pf2e-automatic-resolution.expiryExperiment`: `runs`, `snapshots`, and `events`.
Use **Show full trace** to inspect it. The trace includes world time, observer
client, native active GM, document UUIDs, Item/combat/time events, and prepared
rule suppression. Fixtures and two laboratory scenes remain in the disposable
world for inspection. This file records the relevant observations and limits.

Fixture: native Guidance applied through the module's public `execute` API,
with its actual effect-ended successor metadata; a one-round native Effect
containing a diagnostic RollOption; and a one-round GrantItem wrapper granting
the native Deafened condition. The wrapper is a minimal lifecycle fixture,
not a full exercise of the save runtime's condition grouping and overlap code.
Guidance's native duration is one round, `turn-start`.

Expected observations were recorded by the experiment ticket before execution:
distinguish computed expiry, rule suppression, updates, deletion, wrapper
cleanup, and successor prompts; repeat on time/turn boundaries, reloads,
backward time, and multiple clients. The results below include failures.

## Results

| Case | Setup and observations | Implication |
| --- | --- | --- |
| World time during a running encounter | At world time 18→25, remaining duration became -1/expired while prepared `system.expired` stayed false and rules remained enabled. Only `updateWorldTime` was observed for that change. | A raw clock change inside combat is not equivalent to PF2e's encounter refresh. |
| Saved setting versus effective setting | Setting removal false through `game.settings.set` left cached `game.pf2e.settings.automation.removeEffects` true until reload. Initial fixtures were consequently deleted despite the saved false value. | Those initial trials are not removal-OFF evidence. Always record both values and reload after changing this setting. |
| World-time expiry, effective removal OFF | Run 3, actor `Actor.674FVtmg85iQLFYw`, world time 25→32. Guidance, native Effect, and wrapper remained with `system.expired=true`, computed expiry true, and their rules ignored. No Item update/deletion or follow-up prompt. | Item hooks alone miss confirmed native expiry. |
| Granted condition with removal OFF | Run 3's Deafened document remained; its own rules still reported `ignored=false` after wrapper expiry. | Wrapper expiry alone does not establish condition cleanup. Verify the full production GrantItem configuration before claiming timed-condition correctness with removal off. |
| Reload after retained expiry | Run 3 at time 32 retained the same expired Effects and enabled Deafened rules; no Guidance immunity or recovery prompt appeared. | Current ready handling does not reconcile the missed transition. |
| Backward time, effective removal OFF | Run 3 at 32→25: retained Effects became unexpired and their rules enabled again. | Native state can reactivate. A durable confirmed-ending record must prevent silent replay or resurrection of already resolved module consequences. |
| Turn progression, effective removal OFF | Run 3 and a second linked actor in test encounter `JuKqkpI3pIT95tTK`. At round 2/time 31, remaining 0 was not yet expired for this fixture's original anchor. At round 3/time 37, Effects were expired and rules ignored; no Item update/deletion or successor prompt. | Reconcile after encounter updates. Exact-zero duration is not by itself an expiry predicate. |
| World-time expiry, effective removal ON | Run 4, `Actor.vBdNc2EjypxfYIWm`, setting verified true after reload, encounter paused, time 37→44. Observed `updateWorldTime`, then deletion of Guidance, native Effect, wrapper, and Deafened; one follow-up dialog; one immunity after confirmation. | Deletion route works in this tested uninterrupted case, including cascade cleanup. |
| Two GMs and player | Original GM, temporary GM2, and Player2 were simultaneously connected through independent local browser origins. Run 5 at 44→51 deleted the four fixture Items. Only original GM received the follow-up; neither GM2 nor player showed it. Native `activeGM` and actor updater were already GM2, while module prompt leadership remained original GM. | Native updater and current module leader differ. A single consistent coordinator is needed for future ongoing work. |
| Pending prompt lost on GM disconnect | Closed original GM's client without confirming run 5. GM2 remained, observed the deletion events, and snapshot `Actor.QaNWG5NFrOUqFjTT` had no Items and no successor prompt. That actor still had no Items after GM2's reload and later tests. | The pending successor is not durably recoverable once its primary document is gone. Save a pending obligation before losing the authoritative document. |
| Turn progression, effective removal ON | Run 6, `Actor.C2KTdBLsWLmCwx7g`, encounter `iQwKekqUQHAo2irX`. At round 3/time 63, observed time update, combat update, four Item deletions, one successor dialog, and one immunity after confirmation. | Turn-driven deletion and successor worked on the remaining GM. This is not proof of all initiative anchors. |

The first fixture's condition UUID used a name, which native GrantItem did not
resolve. Its wrapper had no granted condition. The harness was corrected to
resolve the pack's actual ID before run 2. Run 1 is excluded from condition
evidence; valid OFF evidence starts at run 3 after the setting reload.

## Integration requirements established by this experiment

1. Reconcile tracked cast state after native combat updates and out-of-combat
   world-time changes, as well as Item updates/deletion. Read native expiry
   after its processing completes; use an idempotent queued reconciliation,
   not an assumed universal hook order or an arbitrary fixed delay.
2. Maintain a durable cast/obligation record independently of transient Effects
   and chat presentation. Persist pending ending work while its source can
   still be identified. A deleted primary Effect cannot be the only record.
3. Choose one coordinator consistently, retaining actor ownership checks.
   Reconcile on ready and GM availability changes. Interrupted or unproven
   application becomes Needs review; preserve the last confirmed state.
4. Keep observed native expiry distinct from a confirmed module ending.
   Backward clock changes must not silently undo recorded consequences.
5. Explicitly verify ownership and lifetime of granted conditions, including
   removal-OFF behavior. Source inspection of the save runtime is not a pass.

The installed PF2e runtime corroborates the observations: its `EffectTracker`
resets actors and optionally removes expired Effects; its `updateWorldTime`
handler skips tracker refresh while `game.combat.started`; cached automation
settings are initialized separately. Installed source inspected:
`Data/systems/pf2e/pf2e.mjs`. These readings explain the trace, not substitute
for additional live checks.

## Limits and cleanup

This experiment establishes the need and boundaries for reconciliation. It
does not verify a new controller, all source/target initiative anchors, tied
initiative, turn-end expiry, skipped turns, synthetic actors, overlapping
grants, absent-GM player mutation, or an interruption after a damage write.
Those are explicit implementation-release cases in the evidence matrix.

The original saved removal setting was true and was restored. Auxiliary
browser clients were closed. Diagnostic observer shutdown was performed on
each surviving client; closing/reloading a client also discards its observers.
The temporary GM account is retained as a disabled test record. A fresh reload
verified its effective and stored role were both **0**, and native active GM
returned to the original Gamemaster. Test documents and world-time changes
remain in this user-designated disposable world. No campaign world was used.
