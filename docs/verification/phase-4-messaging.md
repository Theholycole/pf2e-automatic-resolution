# Messages — verification

2026-09-26. This batch works on Phase 4's **Information / adjudication** group (33 blocked).

## Choosing the batch

The larger groups have no shared rule left:
- **Attack (44):** its remaining shared wording, temporary HP from damage, would need per-type or HP-capped damage that PF2e's receipt doesn't give.
- **Healing (34):** one-offs.

The largest shared rule in Information is the **messaging spell**: the caster's words delivered to a creature, with at most one reply. There's no spell-name dispatch.

## Compiler (`src/compiler/message-compiler.js`)

**Accepted:** only items with no save, no damage, no area and no rules, with one of three exact texts:

| Like | Text | Reads as |
| --- | --- | --- |
| Message | “You mouth words quietly, … transferred directly to the ears of the target.” and its three sentences (privacy, brief reply, reply delivered) | A range in feet. A brief reply as a reaction or on the target's next turn, within range. |
| Sending | “You send the creature a mental message of N words or fewer, and it can respond immediately with its own message of N words or fewer.” | Both word counts. |
| Dream Message | “You send a message to your target's dream.” and its four sentences | Roughly N words, held until the target sleeps, one-way. |

**Heightened:** “The spell's range increases to N feet.” and “You can target up to N creatures you know by name and have met in person. …” are read. Any other heightened text refuses the plan.

**Targets:** `1 creature you know well` and `1 creature you know by name and have met in person` are the caster's own knowledge, and are read like “your companion”.

**Duration:** Message's “see below” is its reply window.

**Result:** `resolution.kind: "message"`. `scripts/message-core.js` checks the plan, and the census counts it as a new `message` route.

## Runtime (`scripts/message-runtime.js`)

**Send Message** (the caster's owner) asks for the text, then:
- checks the target count at the cast rank;
- checks range from the caster's token;
- enforces the word limit (not a “roughly” one);
- creates one card per target, whispered to GMs and the owners of the caster and target.

A dream message's card is seen by the caster and GMs until the GM presses **Deliver**. The target's owners are then added, and the card says the spell ended for that target.

**Reply** (the target's owner, through the lead GM):
- one reply;
- within the encounter window: by the end of the target's next turn in the running combat;
- within range, for Message;
- within the reply's word limit.

## Coverage

**New:**
- **Message:** 120 feet, or 500 from rank 3.
- **Sending:** 25 words each way.
- **Dream Message:** 10 targets from rank 4.

**Census:** **390 enabled**, up from 387 (Information / adjudication: 3 of 33).
- The b59 corpus diff against b58 changed exactly these 3 plans.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

**Still blocked in the group:**
- telepathy and bonds for a duration (Telepathy, Telepathic Bond, Empathic Link);
- Mindlink, and delayed or carried messages (Timely Reminder, Voice on the Breeze, Animal Messenger);
- Tremor Signs: shared earth, and known meanings;
- detection and knowledge spells (GM adjudication).

## Evidence

**Automated:** 423/423 tests pass.
- `test/messaging.test.js`:
  - Message's range, heightened range and reply;
  - Sending's counts;
  - Dream Message's delivery and heightened targets;
  - refusals: an extra sentence, an unknown heightened clause, and Telepathy.
- `test/homebrew-guide.test.js` compiles the guide's example.

[Live evidence](phase-4-messaging-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `messaging`:
- **Message:**
  - A target 135 feet away was refused (“more than 120 feet away”).
  - A target beside the caster received the whisper (GMs only, as the NPC has no player owner) and replied once. A second reply was refused (“already replied”).
  - A reply sent after the target moved 135 feet away was refused (“must be within 120 feet”).
  - In an encounter (caster first, target second), the deadline was round 1, turn 1. After two turns passed, a reply was refused (“had to come by the end of … next turn”).
- **Sending:** 26 words were refused (“the spell allows 25 or fewer”), both for the message and for the reply. 25 words each way were sent.
- **Dream Message:**
  - Two targets at rank 3 were refused (“reaches 1 creature”).
  - At rank 4, two cards were created, both waiting. Delivering one marked only that card delivered, with “the spell ends for …”. A second delivery was refused.
- **The interface:** on a Sending chat card, with a token targeted, **Send Message** opened the dialog. The typed text was whispered to the targeted creature, the spell card was marked, and the card showed **Reply**. The waiting dream card showed **Deliver** to the GM.
- **Regressions:** `foodHealing`, `directHealing` and `bloodlineDamage` passed. Cleanup left no fixtures, and the test encounter was deleted.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b59
node tools/diff-compiled-plans.mjs /tmp/phase23-b58/official-spell-compiler-report.json /tmp/phase23-b59/official-spell-compiler-report.json
node tools/report-enabled-spells.mjs /tmp/phase23-b59/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b59/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `messaging`, then `cleanup`.
