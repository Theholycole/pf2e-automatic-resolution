# PF2e 8.5.0 milestone catalog research

Research date: 2026-09-19. Decision-enabling findings; no runtime changes or live verification performed.

## Verified catalog and provenance

The accepted baseline contains **1,827 non-ritual spell documents**, not 1,277: 1,277 regular spells (including 71 cantrips), 545 focus documents, and 5 impossible spells. The 167 ritual documents are a separate inclusion review. These are source-document counts, not counts of distinct names, rank configurations, outcomes, or tested workflows.

The [upstream 8.5.0 release](https://github.com/foundryvtt/pf2e/releases/tag/pf2e-8.5.0) points to commit `3601a90ce232134c590d9641df9b62a7254aee6d`. The exact-tag recursive tree was acquired by the parallel lifecycle researcher from [GitHub's tree API](https://api.github.com/repos/foundryvtt/pf2e/git/trees/pf2e-8.5.0?recursive=1), stored at `/tmp/pf2e-spell-lifecycle-tree.json`; its `truncated` flag is false. User-provided local source: `/run/media/theholycole/Bigger Local Disk/PF2e Notes/pf2e`.

I compared every upstream blob below `packs/pf2e/spells/` to the corresponding local file, removing the `packs/pf2e/` prefix. All **1,995 JSON blobs match byte-for-byte by Git blob SHA-1**, with zero missing or mismatched files. Reproduce the comparison as `SHA1(b"blob " + ASCII(byte_length) + b"\0" + file_bytes)` against each tree entry's `sha`. The total consists of 1,994 content documents plus `spells/_folders.json` metadata. This directly verifies pack provenance without relying on a missing system manifest or matching counts.

The checked-in inventory's 1,277 source paths exactly equal the upstream `spells/spells/` paths, with zero missing/extra paths, and inventory and compiler-report IDs match each other. However, [the compilation tool](../../tools/compile-official-content.mjs) explicitly scans only `spells/spells`; focus, impossible, and ritual directories are omitted. This is a scope gap, not an unexplained upstream content change. The 5 impossible documents have `type: spell` and belong under the accepted shipped-spell scope: Call of the Quenching, Pyroclastic Truth, The Everfull Moon, Under Sunless Skies, Veil of Broken Reality. See the [baseline spell pack](https://github.com/foundryvtt/pf2e/tree/pf2e-8.5.0/packs/pf2e/spells).

For stable accounting, retain release commit, relative source path, `_id`, publication metadata, and content hash. Use pack plus `_id` for identity, never name alone; retain legacy/remaster records when both ship. Track rank, cast-action variants, choices and outcome branches below each source identity. A runtime actor's cloned spell ID is not necessarily its original compendium identity.

## Ritual inclusion rule and reviewed direct requirements

Include a ritual when at least one legal rank, choice, ritual outcome, or later event explicitly calls for a creature saving throw. Conditional or optional resistance still counts; so do caster-backlash saves, alternative save/check paths, and explicitly described disease/poison saves. Distinguish the ritual's primary/secondary skill checks from these creature saves. Do not count a save bonus, a save statistic, a save DC used only for counteracting, a phrase explicitly denying a save, or ordinary prose using “save.” The [ritual casting rules](https://2e.aonprd.com/Rules.aspx?ID=2256) distinguish primary/secondary skill checks and explain the default ritual effect save DC; individual text can override it.

Scanning the full local description corpus for save words and inline Fortitude/Reflex/Will checks produced candidates; semantic reading of those clauses and relevant surrounding outcomes confirms **29 direct save-bearing rituals** below. This is a verified direct-requirement subset, **not yet a certified exhaustive ritual closure**: references to other spells, granted actions, and conditions can introduce saves without a literal save instruction in the ritual text. Do not declare every nonmatch excluded until those references have been classified. Affliction-bearing rituals remain catalog members even when their progression is delegated under the accepted exception.

| Ritual | Source `_id` | Why it qualifies |
| --- | --- | --- |
| [Astral Projection](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/astral-projection.json) | `4Cntq9odgW6xMpAs` | Fortitude after an astral form dies; ritual success modifies the save. |
| [Awaken Curse](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/awaken-curse.json) | `6P2fzrYkaiiptxlY` | A transferred curse forces its new target to save; inherited curse DC and effects. |
| [Binding Circle](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/binding-circle.json) | `2ykmAVKrsAWcazcC` | Unwilling extraplanar creature can resist the summons with Will. |
| [Call Spirit](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/call-spirit.json) | `gsYEuWv04XTDxe91` | Unwilling spirit can resist with Will; critical success substitutes a trickster. |
| [Confound the Eye and Confuse the Mind](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/confound-the-eye-and-confuse-the-mind.json) | `dobuPIfpDHjIq8DP` | Observers attempting Recognize Spell make Will saves. |
| [Drain Planar Connection](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/drain-planar-connection.json) | `Jte2jlX59a1yQPp8` | Failure and critical failure inflict basic Reflex damage on secondary casters. |
| [Geas](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/geas.json) | `Q690d3mw3TUrKX7E` | Rank 5 and higher allow unwilling targets, who can attempt Will saves. |
| [Imprisonment](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/imprisonment.json) | `2CNqkt2s2IYkVnv6` | Chains option makes would-be rescuers attempt Will saves later. |
| [Inveigle](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/inveigle.json) | `5pwK2FZX6QwgtfqX` | Initial unwilling-target Will save and later Will saves to end the effect. |
| [Labyrinthine Prison](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/labyrinthine-prison.json) | `WRRbNyGam4ytTRgr` | Unwilling-target Will save; critical success changes ritual outcome. |
| [Loyalty's Ward](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/loyaltys-ward.json) | `qBSyP5csMVmaOWCF` | Qualifying creatures save with Will when trying to leave; retry cooldown depends on ritual outcome. |
| [Mindscape Door](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/mindscape-door.json) | `8MAHUK6jphbME4BR` | GM-selected critical-failure backlash deals basic Will damage; rank 8 changes damage/DC. |
| [Mosquito Blight](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/mosquito-blight.json) | `dNpIc5k1aCI3bHIg` | Area entry/daily exposure to explicitly specified Fortitude disease. |
| [Oblivious Expulsion](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/oblivious-expulsion.json) | `QIjc7Zyej0P3b9v5` | Unwilling creature may negate with Will. |
| [Oil-Slicked Walls](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/oil-slicked-walls.json) | `bOf5WuLh6ZJloi7F` | Critical-failure ongoing trigger offers Reflex or Acrobatics; Step/Crawl exempt. |
| [Perfection of Essence](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/perfection-of-essence.json) | `kExRMPVI07iIFCaa` | Mandatory ingested poison uses Fortitude DC 43; failure automatically fails first save. |
| [Plague Shot](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/plague-shot.json) | `NjN6md0KpdelWpu7` | Ammunition impact exposes creatures to specified Fortitude disease; critical failure exposes casters area. |
| [Portrait of Spite](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/portrait-of-spite.json) | `Z60JRD78wT3afOEJ` | Target Will save combines with ritual degree to set chosen condition value. |
| [Purify Tanglebriar](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/purify-tanglebriar.json) | `ZVdKM0HkgpWykrqf` | Critical failure deals basic Fortitude DC 38 damage to casters. |
| [Rest Eternal](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/rest-eternal.json) | `MTNlvZ0A9xY5sOg1` | Unwilling spirit can resist with Will; critical success conceals resistance. |
| [Rite of Cleansing Flame](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/rite-of-cleansing-flame.json) | `KwDyrUIlnOrpdxYi` | Critical failure requires Fortitude DC 17 against lasting drained. |
| [Rite of the Red Star](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/rite-of-the-red-star.json) | `fLiowSDQXo3vCQDh` | Portal transit on success, or backlash on failure, requires Fortitude DC 36. |
| [Secure Siege Weapons](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/secure-siege-weapons.json) | `a9og2ZYfr8kAeltU` | Enemies operating or moving siege weapons attempt Will DC 20. |
| [Separation](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/separation.json) | `jh6d9n4VQTeOewEU` | Either unwilling target can defeat the ritual with Will against higher class/spell DC. |
| [Sleepless Season](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/sleepless-season.json) | `bTFWSpHEvXq8IK37` | Living creatures in area make Fortitude saves against a sleep-preventing curse. |
| [Teleportation Circle](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/teleportation-circle.json) | `5ZW1w9f4gWlSIuWA` | Unwilling creatures save with Will on transit and again at turn end while remaining. |
| [Terminate Bloodline](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/terminate-bloodline.json) | `yUM5OYeMY8971b2S` | Conscious initial target and exposed family make Fortitude saves; disease progression follows. |
| [Unbearable Cacophony](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/unbearable-cacophony.json) | `XhfsRLfQjN3ed1zI` | Later sounds inflict basic Fortitude sonic damage. |
| [Void Harvest](https://github.com/foundryvtt/pf2e/blob/pf2e-8.5.0/packs/pf2e/spells/rituals/void-harvest.json) | `NjK0kWRC6FYsPwXC` | First damage each day triggers Will against gaining/increasing doomed. |

The candidate false positives are Anima Invocation (Modified), Asmodean Wager, Blunt the Final Blade, City of Sin, Community Repair, Dread Ambience, Fortifying Brew, Lucky Month, Mystic Carriage, Sweetest Solstice, Vital Singularity, Ward Domain, and Winter's Breath. Their matched text concerns bonuses/penalties, fortune applied to otherwise occurring rolls, statistics, counteract modifiers, explicit no-save consequences, or ordinary language. These are exclusions from the **direct-text** set only; for example, Ward Domain's linked illusory object effect can create a separate semantic question about disbelieving illusions. Sources are the same verified ritual directory.

Ritual completeness therefore currently has a verified floor of **1,856 spell/ritual documents** (1,827 + 29), not a final denominator. Resolve referenced-mechanic inclusion consistently before freezing the count. This is a scope interpretation question, not permission to omit explicitly save-bearing variants such as heightened Geas or Imprisonment's Chains.

## Mechanical families the coverage ledger must distinguish

These are fact-based coverage dimensions, not a proposed implementation order. Examples exist in the verified local pack and [current report](../../reports/official-spell-compiler-report.json).

| Family | Representative coverage obligations |
| --- | --- |
| Saving throws | Basic, degree-specific, immediate secondary, deferred and recurring saves; per-target eligibility and traits; automatic terminal outcomes. |
| Spell attacks | Telekinetic Projectile: attack result, critical result, selected damage type and targeting. |
| Healing and mixed recipients | Heal/Harm: action variants, living/undead treatment, healing vs damaging outcomes, rank changes. |
| No-roll damage | Unconditional or selected damage without a primary save; separate from spell attacks. |
| Effects, forms and choices | Animal Form and native spell Effects: selectable forms, rank options, recipient, granted actions and dismissal. |
| Summoning | Summon Animal: summon selection, token/actor lifecycle, command/action constraints and sustain. |
| Counteracting | Dispel Magic: source rank, target effect, check and effect termination. |
| Spatial outcomes | Translocate and Wall of Stone: placement, movement, terrain, objects, areas and line/eligibility constraints. |
| Persistent and triggered behavior | Floating Flame, Petrify, Chain Lightning: sustain, recurring areas, later saves, ordered targets and stopping rules. |
| Cross-cutting state | Temporary immunity, persistent damage, damage-triggered transitions, durations, source/target expiry anchors, affliction delegation, recovery after reload. |
| Narrative with mechanics | Illusions, attitude, information and wishes: distinguish adjudicated content from measurable mechanical consequences. |
| Rituals | Ritual primary result plus creature-save result, backlash, long durations, inherited effects and noncombat triggers. |

Focus and impossible content must receive its own family review; adding their counts to a regular-spell coverage percentage does not demonstrate that those families have been characterized.

## Existing evidence is three different things

1. **Structural/compiler evidence:** inventory reports 1,277 regular spells, including 730 without a primary save and 183 sustained. The compiler report was generated `2026-09-12T07:12:01.173Z` by compiler 0.15.1: 35 automatic, 505 guided, 15 prompted, 722 unsupported. It reports 478 save-kind plans. These labels are not end-to-end execution evidence. Sources: [inventory](../../reports/official-spell-inventory.json), [compiler report](../../reports/official-spell-compiler-report.json).
2. **Executable-runtime evidence:** that report's separate gate admits 40 saves (9 basic, 31 degree-outcome), including the immediate secondary-save Phantasmal Killer path. [Runtime documentation](../module-runtime.md) describes native Effect, rank/choice, sequence and dismissal paths, but excludes sustained/event-linked conditions, recurring follow-ups and other unbounded work from the save gate. Do not add compiler automatic counts to executable save counts: they measure different things and overlap.
3. **Live evidence:** [BASELINE.md](../../BASELINE.md) cites a historical successful Chain Lightning **macro** run and lists required live characterization fixtures. That does not verify the module's whole catalog. No Foundry live tests or project tests were run by this research task. Existing tests/docs and historical handoff statements must keep their source and execution date in any acceptance ledger.

## Remaining facts and closure recommendation

The source acquisition/provenance blocker is resolved by the user's mounted baseline corpus. Exact regular/focus/impossible membership is established. Remaining work: semantic closure of all 167 rituals over referenced effects/conditions; a complete ID manifest including focus/impossible/qualified rituals; accounting for each rank and variant; and runtime/live acceptance evidence beyond the existing narrow report. Decide whether save-bearing granted downstream abilities and ordinary condition recovery qualify a ritual, then apply that rule across every ritual rather than silently using keyword matches as the denominator.

**Keep this research ticket open**, or move only the precise remaining ritual-closure question into a named follow-up before closing it. The ticket asks for exact membership; 29 directly verified ritual inclusions do not satisfy that requirement for all indirect mechanics. No permission or network download is now needed to finish that investigation.
