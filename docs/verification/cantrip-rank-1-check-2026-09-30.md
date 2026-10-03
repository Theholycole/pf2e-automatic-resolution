# Cantrips and rank 1: working check and cleanup

2026-09-29 to 2026-09-30. The first write-up stopped before the 60 flagged smoke-test spells were triaged; that triage is now done (the last section).

## Summary

- **Dead and duplicate code:** removed and merged; behaviour unchanged. 786/786 unit tests pass, and a whole-corpus compile (b255 → b256) changed 0 of 1,994 plans.
- **Live regression:** all 170 cantrip/rank 1 live cases (`cr1Batch1`–`cr1Batch171`; there is no `cr1Batch151`) pass in the `pftest` world, after 19 of them (about 30 individual checks) were updated for stale expectations or test bugs. No module bug was found.
- **Smoke test** of all 506 cantrips and rank 1 spells:

| Result | Spells |
| --- | --- |
| Worked | 435 |
| Refused on purpose | 11 |
| No button found | 37 |
| Error or timeout | 23 |

The 60 flagged spells are now triaged (last section). Most were bugs in the test itself. Two were real module bugs: an Effect's weapon or feat/skill choice could open empty. Both are fixed. The final result is 483 work, 22 are refused on purpose (the test fixtures lack what the spell needs), and 1 needs a manual step by design.

## Code cleanup

**Removed (nothing used them):**
- `nativeRoll` (`scripts/immediate-runtime.js`)
- `escapeClaim` (`scripts/effect-modifier-proof.js`)
- `DEGREE_ADJUSTMENT_DEGREES` (`src/compiler/degree-adjustment.js`)
- `NOTE_FAMILY_KINDS` (`src/compiler/note-families.js`)
- `isConditionalDamage` (`src/compiler/conditional-damage.js`)

**Merged duplicates:**
- `src/compiler/description-parser.js` now exports `plainText`, `splitSentences` and `durationSeconds(text, {rounds})`.
- Ten compiler files had identical private copies of `plain` and `split`; they now import these. The files are `damage-reactions`, `check-helpers`, `rule-effects`, `ward-families`, `summon-families`, `rule-sets`, `item-families`, `check-actions`, `area-saves` and `scene-features`.
- Four files had their own `secondsOf`; they now import `durationSeconds`.
- `scripts/effect-runtime.js`: the summon list and the Arms of Nature weapon list shared one filterable-list dialog, copied twice. It is now one helper, `promptFiltered`.

**Checked and found clean:**
- **Resolution kinds:** every kind in `SUPPORTED_RESOLUTION_KINDS` is produced by some spell, and every kind the runtime branches on is produced.
- **Private methods:** none is unused.
- **Other exports:** the rest of the dead-code scan's hits were false positives: constants used through spreads, or exports used only inside their own file.

## Live regression of the 170 cases

The first sweep failed 69 cases. Most of those came from the sweep itself:
- **State left between cases:** a leftover combat, the wrong scene, or old chat cards.
- **Browser throttling:** Chromium throttles timers on a hidden page, so the cases timed out.
  - A silent `AudioContext` in the test page stops the throttling, and cases then run at normal speed.
  - Worth doing again for any long run.

Re-run in isolation (end every combat, return to the lab scene, clean up, and reload between groups), the failures came down to tests written before a later batch deliberately changed the spell. None was a module regression.

**Updated to current behaviour** (a comment in each names the batch that changed it):

| Case | Spell | Changed in | Now |
| --- | --- | --- | --- |
| 1 | Curse of Recoil | 156 | No data note |
| 2 | Serrate | 152 | Duration override, not a note |
| 2 | Sting of the Sea | 153 | No data note |
| 12 | Sure Strike | 152 | No note Effect |
| 12 | Glimpse Weakness | 139 | A spell mark |
| 12 | Light | 137 | Goes on the targeted creature |
| 13 | Uplifting Overture | 139 | A prepared Aid |
| 14 | Groom Companion | 158 | Bonus Effect; needs a minion or eidolon |
| 14 | Fashionista | 158 | Bonus Effect |
| 39 | Weapon Surge | 152 | No data note |
| 40 | Funeral Flames | 152 | No data note |
| 59 | Precious Gleam | 152 | "Every hit" note gone |
| 63 | Hippocampus Retreat | 156 | No data note |
| 65 | Untamed Shift | 154 | "Level" note gone |
| 74 | Song of the Soul | 156 | Refused without a thrall |
| 80 | Crushing Ground | 156 | No data note |
| 84 | Savor the Sting | 155 | No data note |
| 97 | Unfetter Eidolon | 167 | A non-eidolon is refused |
| 120 | Manifest Will | 141 | No note |
| 120 | Delay Consequence | 160 | Dropped from this case |

**Moved to spells that are still notes.** The case tests the note route, and these spells now have their own route:

| Case | Was | Now | Changed in |
| --- | --- | --- | --- |
| 8 | Sanctuary | Buoyant Bubbles | 165 |
| 8 | Wall of Shrubs | Illusory Object | 171 |
| 8 | Summon Animal | Store Time | 166 |
| 8 | Share Lore | Breadcrumbs | 164 |
| 22 | Mending | Create Water | 168 |

**Test bugs fixed:**
- **Case 10 (Biting Words):** counted every Biting Words card in the log, including older runs'. It now counts only its own.
- **Case 136 (Nymph's Token):** never answered the Dismiss confirmation, which uses `data-action="ok"`.

Every case later re-run fresh passes, including the ones that were order-sensitive in the sweep (55, 141, 161 and 162). Cases 166 and 168, which use the refactored dialog, were re-run after the refactor.

## Smoke test of all 506 cantrips and rank 1 spells

**What it does:** [`tools/cantrip-rank-1-smoke.mjs`](../../tools/cantrip-rank-1-smoke.mjs) posts each spell's PF2e card from an NPC caster, next to an ally and an enemy, and clicks the module's button. It:
- tries the enemy, the ally, both, then no target;
- answers module dialogs with the first choice;
- replaces template placement with a region at the enemy;
- rolls and finalizes any save card.

**Results:** in [cantrip-rank-1-smoke-results.json](cantrip-rank-1-smoke-results.json). The page refused the final upload, so that file was written from the results read back from the page.

- **Worked (435):** resolved with no error.
- **Refused on purpose (11):** the module's own stated refusals, because the NPC fixture lacks what the spell needs (a melee or ranged Strike, a bloodline, a Lore, a sustained spell, a resolved mental effect). These are working as intended.
  - Cackle, Dimensional Assault, Elemental Toss, Flurry of Claws, Hand of the Apprentice, Perfected Mind, Share Lore, Shielding Strike, Shooting Star, Sky Laughs at Waves, Spinning Staff.
- **Not triaged (60):**
  - **Variant cards (11):** the button appears only after a variant is chosen, which the test doesn't do. Not a fault.
    - Concordant Choir, Gouging Claw, Gravitational Pull, Harm, Heal Animal, Heal Companion, Horizon Thunder Sphere, Kinetic Ram, Lay on Hands, Telekinetic Projectile, Touch of the Void.
  - **GM question before the roll (6):** the card asks the GM a question first, which the test didn't answer. Working as designed.
    - Charm, Charming Touch, Phase Bolt, Shocking Grasp, Thunderstrike, Wilding Word.
  - **Timed out (13):** these open a PF2e weapon or option prompt (`PickAThingPrompt`, `ChoiceSet`) that the test's auto-answer didn't click; 13 such prompts were still open at the end.
    - Beseech the Sphinx, Blood Ward, Conductive Weapon, Entreat Spirit, Funeral Flames, Object Memory, Pocket Library, Precious Gleam, Runic Weapon, Serrate, Shillelagh, Untamed Shift, Weapon Surge.
    - Several of these (Serrate, Weapon Surge, Funeral Flames, Precious Gleam, Runic Weapon) pass their own live cases, so this is most likely the test.
  - **No button found (26):** needs checking.
    - Allegro, Blood Infusion, Bone Spear, Dead Weight, Deathly Scream, Defended by Spirits, Extradimensional Cover, Fact Check, Fated Healing, Forbidding Ward, Foresee the Path, Groom Companion, Liberating Command, Life Tap, Mending, Necromancer's Generosity, Necrotic Bomb, Omnidirectional Scan, Practice Makes Perfect, Protect Companion, Protector's Sacrifice, Share Burden, Song of the Soul, Stabilize, Unbroken Panoply, Unfetter Eidolon.
    - Many of these resolve in their own live cases today (Mending, Extradimensional Cover, Groom Companion, Omnidirectional Scan, Unfetter Eidolon, Liberating Command, Song of the Soul, Stabilize).
    - The likely cause is the test checking for the button 0.7 s after posting the card, before it's drawn, or a card path that needs a target first. Not confirmed.
  - **Other errors (4):**
    - **Acid Splash:** the stubbed caster became the splash target. Its attack returned no degree, and the ally's save changed while the dialog was open.
    - **Corpse Bloom:** the stubbed placement put both areas on the enemy, so they overlapped.
    - **Home Among Mulberry Leaves:** wants the caster's PF2e Strike first, and the NPC has none.
    - **Pest Form:** battle forms need a character actor.
    - All four look like limits of the fixture or the stub; not confirmed.

## Triage of the 60 flagged spells

The 60 flagged spells were re-run after two fixes: one to the smoke test, one to the module.

**The smoke test** (`tools/cantrip-rank-1-smoke.mjs`) had bugs of its own:
- **Deleting the spell on a retry:** the cleanup between target tries removed every item added to the caster, including the spell. The retry card then came from a deleted spell and had no module button. This caused most of the "no button" results, in the full run too.
- **Card copies:** each card is drawn twice in the log, and only the first copy was searched. Now any copy with the button counts, after a wait of up to 6 s.
- **Variants:** a scripted click on PF2e's variant button posts nothing. The test now posts the first variant's card as PF2e does (`loadVariant({overlayIds}).toMessage()`).
- **PF2e prompts:** the pick-a-thing prompts are now answered, both the button list (`button.select-button`) and the dropdown (down arrow, Enter, Save).
- **GM questions:** the save card's GM question is answered with its first choice, and splash targets aren't rolled.
- **Retries:** the test retries other targets only for a refusal about the target. It no longer retries because the message names the enemy. The caster itself is now one of the targets tried.
- **Noise:** the window-size warning, and old cards whose fixture actor is gone, are no longer counted.
- **Caster:** a character caster holding a club, a staff and a shortbow (`casterType: "character"`) is used for the weapon and form spells.

**The module** had two real bugs, both in `scripts/effect-runtime.js`'s Effect route. PF2e Effects whose `ChoiceSet` picks from the recipient could open a choice with nothing in it, which can't be answered. The module now refuses before applying:
- **A weapon choice** (`choices.ownedItems` with type weapon) when the recipient holds no weapon. The message says to target a creature with a weapon. Affected: Conductive Weapon, Precious Gleam, Runic Weapon, Serrate, Weapon Surge, Funeral Flames, Shillelagh and Object Memory, when the target held nothing.
- **A choice whose every option needs a feat or a trained skill** the recipient lacks. The message names what's needed ("the Untamed Form feat", "trained in Arcana").
  - Only Untamed Shift and Pocket Library have such a choice in the corpus.
  - Batch 65 (Untamed Shift with the feats), batch 2 and batch 39 (weapon spells) still pass.

**Results:** all 60 now resolve or are refused on purpose. Details are in `cantrip-rank-1-smoke-results.json` → `retriage`, with the raw runs in `cantrip-rank-1-smoke-rerun-*.json`.

**Works (43):** the 11 variant cards other than Heal Animal and Touch of the Void; the six spells with a GM question; Acid Splash, Corpse Bloom and the no-button spells that had a usable target; and, with the character caster, the weapon spells, Pest Form and Unbroken Panoply.

**Refused on purpose (16):** the module's own checks, because the fixture lacks what the spell needs:

| Spell | Why |
| --- | --- |
| Groom Companion, Protect Companion | No companion or minion |
| Unfetter Eidolon | No eidolon |
| Stabilize | No dying creature |
| Mending | No damaged item |
| Protector's Sacrifice | No damage to react to |
| Fact Check | No Recall Knowledge check to check |
| Practice Makes Perfect | No failed skill check |
| Liberating Command | No grabbed, immobilized or restrained creature |
| Song of the Soul | No thrall |
| Necromancer's Generosity | No undead |
| Heal Animal | No animal |
| Touch of the Void (Healing) | No target |
| Extradimensional Cover | The placed square held an enemy |
| Untamed Shift, Pocket Library | No qualifying feat or trained skill (the new check) |

**Works as designed (1):** Home Among Mulberry Leaves asks for the caster's own PF2e Strike against the target before reading its result.

**Final smoke-test tally for all 506 cantrips and rank 1 spells:**

| Result | Spells |
| --- | --- |
| Works | 483 (435 + 43 + 5) |
| Refused on purpose (the module's checks against the test fixtures) | 22 (6 + 16) |
| Works as designed with a manual step first | 1 |

The "+ 5" are Strike spells refused in the first run that resolve with the character caster: Dimensional Assault, Shielding Strike, Shooting Star, Spinning Staff and Hand of the Apprentice.

The other 6 first-run refusals stand, because the fixture lacks what the spell needs:
- Cackle: no sustained spell.
- Elemental Toss and Flurry of Claws: no bloodline.
- Perfected Mind: no module-resolved mental effect.
- Share Lore: no Lore.
- Sky Laughs at Waves: no one-handed sword.

No commit, push or version bump was made.

## Files changed

- **Module code:**
  - `scripts/effect-runtime.js` (`promptFiltered`; the empty-choice checks)
  - `scripts/immediate-runtime.js`
  - `scripts/effect-modifier-proof.js`
  - `src/compiler/description-parser.js`
  - `src/compiler/conditional-damage.js`
  - `src/compiler/degree-adjustment.js`
  - `src/compiler/note-families.js`
  - the ten compiler files above
- **Tests and tools:**
  - `tools/phase23-affliction-verification.mjs`: the stale and broken cases above.
  - `tools/cantrip-rank-1-smoke.mjs`: new.
- **Docs:** this file, `cantrip-rank-1-smoke-results.json`, `cantrip-rank-1-smoke-rerun-*.json`, and `docs/module-runtime.md` (the empty-choice checks).
- **`pftest` world:** clean afterwards. Fixtures, the smoke scene and actors, and open dialogs removed; no combats.
