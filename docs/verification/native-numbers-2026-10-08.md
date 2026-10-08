# Native numbers for the resolution core

2026-10-08. Asked for by the auto-combat session (pf2e-resolution-core's families and the PF2e Combat Simulator).

Live play leaves some spells to PF2e's own spell card:
- Heal, Harm and Force Barrage run in the module's immediate runtime, with numbers written in code.
- Soothe, Telekinetic Projectile, Lay on Hands, Blazing Bolt and others are rolled by PF2e's own card.

So their plans had no numbers. Every spell plan now carries, in `resolution.native`, the numbers PF2e's own card rolls, read from PF2e's item data. Live play never reads that key, so resolution is unchanged.

## What's compiled

`src/compiler/native-numbers.js`, applied by `compileAbility` to every spell plan:

- **`healing`:** `{ components, heightening, recipients }`.
  - The item's damage entries of kind healing. Vitality heals the "living" and void the "undead"; otherwise the target line decides ("willing", "living", "undead", "any").
  - Where live play already heals (`resolution.healing`), its fields are copied in unchanged, and its formula and heightening correction win over PF2e's data. For example, Breath of Life heightens every 2 ranks, as its text says.
- **`check`, `sharedDamage` and `outcomes`:** only where the plan has none of its own.
  - `check` is an attack, or a save from the adapter's defense reading.
  - `outcomes` are the compiler's own rows: an attack ×2 / ×1 / none / none, a basic save 0 / ½ / 1 / 2.
- **`byActions`:** PF2e's overlays per action count (times "1", "2 or 3", "1 to 3"), as partial plans. Examples:
  - Heal: touch; 30 feet and +8 healing (+8 per rank); a 30-foot emanation.
  - Blazing Bolt: 2d6, or 4d6, each with its own rows.
- **`variants`:** the other overlays. Example: Lay on Hands is healing for the living, or damage with a basic Fortitude save against undead.
- **`damageTypeChoices`:** for overlays that only pick a damage type (Telekinetic Projectile, Gouging Claw).
- **`missiles`:** Force Barrage's shards per action and per 2 ranks, with one shard's damage.
- **`applications`:** on `unsupported` plans only, the PF2e spell Effects the plan links but couldn't place. Each comes with recipients: "self", "target", "allies-in-area" or "enemies-in-area", from the compiler's recipient reading, else the target line. Example: Bless goes to "you and allies in the area", a 15-foot emanation.
- **`dataCorrected`:** the corrections the compiler makes to PF2e's data (an ignored basic flag, a healing heightening).

Why `native`, and not the core's first draft of fields at resolution level? Live play's effect runtime heals whenever `resolution.healing` is set. The compiler leaves it unset on purpose in some cases (Quick Siphon with mismatched data). Writing numbers there would have changed live play.

## Evidence

- **Official compile (1,994 plans):** removing `resolution.native` gives back the baseline byte for byte, and the three analysis reports are identical.
  - Added: `check` on 153 plans, `sharedDamage` 138, `outcomes` 58, `healing` 55, `variants` 43, `byActions` 27, `applications` 7, `dataCorrected` 4, `damageTypeChoices` 2, `missiles` 1.
- **Third-party snapshot** (227 spells, readers over 4,703 items): identical once `native` is removed. Added: `check` on 49, `byActions` 22, `sharedDamage` 21, `variants` 12, `applications` 8, `outcomes` 5, and 1 each of `healing`, `damageTypeChoices` and `dataCorrected`.
- **Unit tests:** 1884 pass, including the new `test/native-numbers.test.js` (Heal, Harm, Soothe, Breath of Life, Force Barrage, Telekinetic Projectile, Gouging Claw, Blazing Bolt, Lay on Hands, Bless, Fireball).
- **Live, through the core:** the spell compiler is registered with the core's registry, in the spell module's `pf2eResolutionCoreReady` handler. `preparePlan(spell).plan` equals `readPlan(api.compile(spell))` for Prismatic Wall, Fireball, Heal, Force Barrage, Blazing Bolt, Lay on Hands and Soothe, and `planFor` then answers from the cache.
