# Rank 3 batch 56 — Burning Trail

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Burning Trail (3) | Casting posts a card that waits for the trail. After the target's first Stride, the GM draws the trail as a region, selects it and presses "Place the trail". It lasts for the rest of the minute. A creature entering it takes 2d10 fire damage (+1d10 every 2 ranks) through the GM's Ongoing control. A creature in it as its turn starts takes the damage automatically. The height and concealment are GM notes. |

## Rules

- **Damaging wall, deferred form (`damaging-wall.js`):** a spell with a target (your companion or eidolon, or one creature) is read when it has:
  - "The first time the target Strides …, they leave behind a [noun] …";
  - "Any creature that enters or starts its turn in the [noun]'s area takes NdM T damage.";
  - the height and concealment notes;
  - the usual heightening step.
  The plan carries `damagingWall.deferred`.
- **Runtime (`effect-runtime.js`):**
  - A deferred wall cast without a region posts a card with a "Place the [noun]" button, flagged `deferredWall`.
  - `placeDeferredWall(message, {region})` is GM-only and works once. It starts the region area for the remaining duration through the shared `#startDamagingWall`.
  - The button is bound in `main.js`, and the method is exposed on the API.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-56.test.js` is new. Its negative cases are:
- another target;
- a trail not tied to the first Stride.

A whole-corpus compile (b473 → b474) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-56-live-results.json), case `rank3Batch56`, in the `pftest` world, cast at 5th rank.

| Step | Result |
| --- | --- |
| Cast | Deferred card with the place button; 3d10 fire |
| Placed on a drawn region | 60 seconds remaining; a creature entering lost 13 (3d10 fire = 13) |
| Second placement | Refused |

**Cleanup:** fixtures removed.
