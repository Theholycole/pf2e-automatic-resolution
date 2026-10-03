# Rank 2 batch 64 — Magnetic Repulsion

2026-10-01. Follows the user's decisions of 2026-10-01:
- An attack's metal: a penalty Effect the GM gives the attacker.
- Selective terrain: a region plus exemptions. The module now makes the terrain itself per creature, so no creature needs a marker.

| Spell | Now |
| --- | --- |
| Magnetic Repulsion (2) | The cast asks the GM who wears metal armor and who is made entirely of metal, with suggestions: PF2e's worn armor group (chain, plate or composite, not ceramic or leather) or a metal material, and the metal trait. It asks the same for the caster. A region covers the squares adjacent to the caster (its own squares are a hole) and moves with its token. Moving into it costs double for the metal-armored creatures and triple (greater difficult terrain) for the metal ones; nobody else is hindered. The caster's Effect lasts 1 minute: Slowed 1 when it wears metal armor, and a note on the extra Interact. The GM's control "the targeted creature attacks X with a metal object" gives the attacker a −1 status penalty (−2 if made of metal; +1 per 3 ranks) to its next attack roll against the caster. The penalty is removed after that roll, and expires at the end of the turn otherwise. When the minute ends, the region, the Effect and Slowed go. |

## Per-creature terrain

Foundry 14's movement-cost region behavior receives the moving token. `main.js` wraps `modifyMovementCost._getTerrainEffects`:
- A behavior flagged `selectiveTerrain` gives its difficulty per creature (by actor), for the listed actions (walk and travel).
- Any other behavior is Foundry's own.

PF2e's own terrain-ignore entries couldn't be used: they apply to all terrain anywhere, not to one region.

PF2e measures out-of-combat movement as the action "travel", so both actions are listed. This also showed that the module's other difficult-terrain regions set only "walk"; that's fixed below.

## Follow-up: travel on the other terrain regions

Foundry's movement-cost behavior reads the difficulty for the segment's action. A behavior with only `walk` therefore added no cost when a creature out of combat moved with "travel".

`runtime-utils.js` has a new `terrainDifficulties(movement, difficulty)`. It gives each listed movement type the difficulty and adds `travel` whenever `walk` is listed. Fly-only terrain stays fly-only. It's used by all four non-selective terrain behaviors:
- Glacial Causeway (`effect-runtime.js`, `#executeCauseway`).
- The hazard area's terrain (`effect-runtime.js`).
- `startLingering` (`ongoing-families.js`).
- `startTerrainArea` (`ongoing-families.js`).

Magnetic Repulsion's selective behavior is unchanged. The plans are unchanged (`terrain.movement` is still `["walk"]` or `["fly"]`).

**Tests:** 922/922 pass. `test/terrain-difficulties.test.js` is new. It checks walk → walk + travel, that fly-only stays fly-only, and that the input list isn't changed.

**Live, in `pftest`, out of combat:** each spell cast by a fresh caster, then a 30-foot path measured through a 10-foot-wide region with `createTerrainMovementPath` and `measureMovementPath`. The default action was "travel" every time.

| Spell (path) | Region difficulties | travel (default) | walk | fly |
| --- | --- | --- | --- | --- |
| No region | — | 30 | 30 | 30 |
| Glacial Causeway (causeway) | walk 2, travel 2 | **40** | 40 | — |
| Mud Pit (`startTerrainArea`) | walk 2, travel 2 | **40** | 40 | — |
| Tacky Pine Sap, 4th (hazard area) | walk 2, travel 2 | **40** | 40 | 30 |
| Ash Cloud, 3rd (`startLingering`, fly-only) | fly 2 | 30 | 30 | **40** |

Foundry also set crawl to 2 by itself on the walk regions. Fixtures removed.

## Rules

- **`repulsion-aura.js` (new family, kind `repulsion-aura`):** the three rule sentences and the Heightened (+3) entry exactly (one sentence of narration allowed). `repulsionPenalty` gives the penalty by rank.
- **`ongoing-families.js`:** `startRegionArea` takes `followToken`.
- **Runtime:**
  - The classification dialog (`classification` and `casterMetalArmor` in tests).
  - The region shapes (`repulsionShapes`).
  - The caster's Effect, with a unique slug that the attacker's penalty is predicated on (`target:effect:…`).
  - The `metal-attack` control and request (`metalAttack`). Metal creatures are kept as a list, because flag keys with dots (actor UUIDs) were expanded into nested objects. A first run read the wrong penalty because of this.
- **`main.js`:**
  - The selective-terrain wrapper.
  - An `updateToken` hook that moves a following region with its token.

## Tests

919/919 pass. `test/rank-2-batch-64.test.js` is new. It checks:
- the plan and the penalty by rank and metal;
- that another penalty type, terrain or condition isn't read.

A whole-corpus compile (b319 → b320) changed only Magnetic Repulsion.

## Coverage

**Census:** **1141 enabled**, up from 1140. Rank 2: 227 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-64-live-results.json), case `rank2Batch64`, in the `pftest` world (the caster marked as wearing metal armor).

**At the cast:**
- The caster is Slowed 1.
- The region has two shapes: the square and its hole.

**Moving two squares, the second adjacent to the caster** (Foundry's terrain path, as a drag measures it):

| Creature | Cost |
| --- | --- |
| Plain | 10 feet |
| Metal-armored | 15 feet |
| Metal | 20 feet |

**The region followed the caster's token** to its new place.

**Metal attack:** the metal creature got a −2 penalty Effect. Its Strike against the caster showed "Magnetic Repulsion −2", and the Effect was gone after the roll.

**After 61 seconds:** the region, the Effect and Slowed were gone.

**Cleanup:** fixtures removed.
