# Healing from conjured food — verification

2026-09-26. This batch continues Phase 4. The largest group, **Attack and dependent result** (46 blocked), is still one-off mechanisms. Its biggest cluster is Strike spells that change the Strike itself (reach, range increment, concealment, cover, a Fly or Raise a Shield first, two Strikes), and each of those needs its own PF2e hook. So this batch takes the largest shared rule in **Healing / recipient mode** (36 blocked): the spell makes food, and the healing happens when a creature eats it. There's no spell-name dispatch.

## Compiler (`src/compiler/food-healing.js`)

**Item:** no save, no Target, no area, and one Healing entry (one piece's healing).

**Text:**
- **Narration:** exactly one sentence before the eating sentence, with no rule words. It conjures the food.
- **Eating:**
  - “A creature can consume the food with an Interact action to regain X Hit Points (and be nourished as if it had eaten a meal).”
  - “A creature who eats the produce with an Interact action regains X HP.”
  - X must be the item's healing entry.
- **When the food goes:**
  - “If uneaten, the food crumbles to dust after N minutes.” (also rounds or hours; also “withers away” or “vanishes”);
  - or “The <thing>, as well as any unconsumed pieces of <food>, wither away at the end of the duration.” with the item's Duration.
  - Food with no end is refused.
- **Heightened entries:**
  - “The <thing> produces an additional piece of food.” gives one more piece per step.
  - With it, “A creature can consume any amount of food from the same casting with a single Interact action.” and the square-meal sentence (a note) are read.
  - “The Hit Points restored increase by N.” is accepted only when the item's heightening data holds it.
  - Anything else refuses the plan.
- **Set aside:** PF2e's “Consume all produce” `@Damage` convenience paragraph.

**Result:** `resolution.kind: "healing"` with `healing.recipient: "consumer"` and `healing.food` (`pieces`, `anyAmount`, `expires`, `notes`).

## Runtime (`effect-runtime.js`, `main.js`, `ongoing-runtime.js`)

**Resolve Healing** posts a food card (flag `food`). It shows the pieces left out of the pieces made, when the food withers, and who has eaten, plus an **Eat** button while any food is left.

**Eat:**
- The eater is the user's one targeted token, else their one controlled token, else their character.
- With “any amount”, a prompt asks how many pieces.
- The request goes to the lead GM as `consume-food`. The public API is `api.eatFood({messageId, eaterUuid, count})`.

**Checks:**
- the food hasn't withered away (world time);
- there are pieces left;
- the user owns the eater;
- the spell still makes food;
- the healing energy suits the eater (vitality refuses undead and constructs).

The eater isn't the spell's target, so the Target constraints don't apply to it.

**Applying:**
- The pieces are claimed first, so no two eaters get the same piece.
- Each piece is PF2e's healing roll at the cast rank (`loadVariant({castRank})`).
- The sum is applied through `applyDamageWithReceipt`, followed by `recoverFromDying`.
- A message lists the rolls, any Dying recovery and the nourishment note, and the card is updated.
- An eater with no token on the scene uses its prototype token for PF2e's healing message.

## Coverage

**New:**
- **Cornucopia:** one piece per rank, any number eaten at once, gone after the 10-minute duration.
- **Nature's Bounty:** one 3d10+12 piece (heightened by PF2e's data), nourishing, gone after 1 minute.

**Census:** **383 enabled**, up from 381 (Healing / recipient mode: 26 of 60, 34 left).
- The b57 corpus diff against b56 changed exactly these 2 plans (level and pending).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

**Still blocked nearby:**
- **Soothing Spring:** an hour's soak, Fatigued removal, and a structure pool.
- **Bounty of the Sky:** allies-only gifts in an area, with a choice of three benefits including affliction stages.

## Evidence

**Automated:** 413/413 tests pass.
- `test/food-healing.test.js` covers:
  - both plans, with pieces at ranks 1, 3 and 6, the timing and notes;
  - refusals: an extra rule, a mismatched amount, food with no end, and an unknown heightened sentence;
  - the food card's text and button.
- `test/homebrew-guide.test.js` compiles the guide's example.

[Live evidence](phase-4-food-healing-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `foodHealing`:
- **Cornucopia at rank 3:**
  - It made 3 pieces.
  - A creature ate 2 in one go: the rolls were 5 and 6 (each 1d6+4), and it healed 11, from 300 to 311.
  - One piece was left, and the card showed “1 of 3 pieces of food left” and who ate.
  - An undead eater was refused (“isn't healed by vitality energy”), and asking for 2 pieces was refused (“only 1 piece left”).
- **Nature's Bounty:**
  - A dying creature at 0 HP ate and healed 33. Dying ended with Wounded 1, and the nourishment note was shown.
  - A second bite was refused (“all been eaten”).
  - A new cast, eaten after 61 seconds of world time, was refused (“withered away”) and healed nothing.
- **The Eat button:** a rank-1 Cornucopia card, with a token targeted. Clicking the rendered button healed that token by 6 (5 to 11), and the card showed the eater with no button left.
- **Regressions:** `healingRiders`, `directHealing` and `healOrHarm` all passed. Cleanup ran, and the hand-made button fixture was removed.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b57
node tools/diff-compiled-plans.mjs /tmp/phase23-b56/official-spell-compiler-report.json /tmp/phase23-b57/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b57/official-spell-compiler-report.json
node tools/test-cross-family-speed.mjs /path/to/verified-content /tmp/phase23-b57/official-spell-compiler-report.json reports/phase-spell-batches/speed-family-baseline.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `foodHealing`, then `cleanup`.
