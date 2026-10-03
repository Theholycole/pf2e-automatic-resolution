# Rank 3 batch 109 — Zombie Horde

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Zombie Horde (3) | A lingering placed 10-foot burst, using the lingering compiler's own wording: difficult terrain, and a creature that starts its turn inside takes 3d4 bludgeoning (+1d4 per rank) with a basic Fortitude save — basic as the text says, though PF2e's data says not. It can be Dismissed. Three card notes cover destroying the target thrall (placing the burst on its square), the Sustain's move (move the region) and the thralls' growth. The GM's control grows the burst 5 feet per thrall destroyed, to 30 feet. |

## Rules

- **`src/compiler/thrall-compiler.js`:** `rewriteThrallHorde` reads the six sentences and checks the burst size, damage and save against the item. It returns the rewritten text, a basic defense, no target, `thrallGrowth` and the notes.
- **`compileSpell`:** applies it before the area compilers.
- **`src/compiler/lingering-area-compiler.js`:** both declaration paths carry the rewrite's notes and `thrallGrowth`.
- **Validation (`basic-save-core`):** the growth must be in steps of 5 feet with a maximum above the area, on a placed burst.
- **Runtime (`ongoing-families`):** the GM's control asks how many thralls were destroyed, and the `thrall-growth` action grows the region up to the maximum.

## Interpretation

- **The save is basic.** The text says so; PF2e's data doesn't.
- **Which tokens are thralls is the caster's call.** PF2e has no thrall trait, so destroying them is the GM's or caster's, reported to the control.
- **Moving the horde is moving the region.** The Sustain's 15-foot move is done by hand.

## Tests

`test/rank-3-batch-109.test.js` is new. It covers the save, the area's events, size, terrain and Dismiss, the growth and notes, and a different growth step (not read).

A whole-corpus compile (b633 → b634) changed only Zombie Horde.

## Evidence

[Live evidence](phase-rank-3-batch-109-live-results.json), case `rank3Batch109`, in the `pftest` world, in combat.

| Step | Result |
| --- | --- |
| The area | Difficult terrain; three notes; growth to 30 |
| The foe starts its turn inside and fails | 3d4 bludgeoning (6), applied |
| Two thralls | 20 feet |
| Three more | Capped at 30 |
| One more | "at-maximum"; the region is 30 feet |

**Cleanup:** fixtures, combat and region removed.
