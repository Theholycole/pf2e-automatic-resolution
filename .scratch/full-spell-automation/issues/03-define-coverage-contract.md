# Define the spell coverage and exception contract

ID: 03
Parent: [Full Spell Automation — First Major Milestone](../map.md)
Label: wayfinder:grilling
Type: grilling
Mode: HITL
Status: resolved
Assignee: theholycole
Blocked by: 01

## Question

How should coverage be recorded so that a spell, its heightened ranks and variants, and custom spells using recognized structures can be judged complete without concealing unsupported mechanics?

Define the coverage unit and the distinct states for compiled, executable, automatically checked, and live-verified behavior. Specify how approved narrative/affliction exceptions and future explicitly accepted mechanical exceptions are recorded, how independent manual portions are demonstrated, and how unrecognized custom mechanics are reported. An unsupported mechanic with manual instructions remains a gap unless the user explicitly accepts that exception.

Use the catalog research to make this concrete. Resolve the reporting and acceptance contract with the user, including how newly discovered gaps reopen completion, rather than implementing a coverage dashboard.

## Answer

Resolved with the user on 2026-09-19. The user accepted all three recommendations about partial spell support, heightened-rank verification, and player-facing explanations. This resolution incorporates the previously accepted milestone scope and exception rules.

### Coverage and availability

Account for each baseline catalog document by stable source identity, with its legal ranks, distinct casting variants, and mechanically distinct outcome branches recorded beneath it. Keep separate source records even when their names match. The final ritual membership remains subject to [Define ritual inclusion through referenced mechanics](11-define-referenced-ritual-saves.md).

A completely supported casting variant may be available while other variants of that spell remain unsupported. Clearly identify available variants, block unsupported variants, and keep the overall spell incomplete until all its required variants are accounted for. A supported variant must satisfy its own execution requirements; enabling it is not evidence that the rest of the spell works.

Record compilation, executable-runtime support, automated verification, and live verification separately. They are distinct evidence dimensions, not interchangeable labels or necessarily a single progression. A compiler success does not establish runtime support, and a shared live-tested workflow does not mean every spell using it was individually live-tested. Newly discovered unsupported behavior or invalidated verification returns the affected coverage entry to an open gap.

### Verification

Automatically check every legal rank and distinct casting variant, including supported mechanical outcomes. Live-test every distinct workflow and representative complex spells, selecting representative ranks especially where a new effect or behavior appears. Every catalog entry and meaningful rank/variant must be accounted for; the milestone is not complete on compiler coverage alone.

Keep the detailed coverage and testing record in a separate report that distinguishes what was checked automatically, what was actually exercised in Foundry, and remaining gaps. Exact fixtures, evidence capture, and release gates belong to [Define the milestone verification and exit criteria](08-define-release-evidence.md).

### Exceptions and player-facing explanations

Before resolution, show a short plain-language explanation of what the module will automate and what requires manual handling. Integrate this with the existing workflow; the established one-click Finalize and reaction window remain in force.

Narrative adjudication and delegated afflictions retain their accepted exception status. Any other unsupported mechanical outcome remains a gap unless the user explicitly accepts an exception. Record the affected mechanic, the scope of the exception, and its acceptance with the relevant coverage entry. Manual instructions by themselves do not make an unsupported mechanic complete.

Partial automation within a variant is permitted only when its manual portion is independent: it cannot alter targeting, saves, damage, or effect application. Record that independence with the exception; where it cannot be established, keep the affected path blocked.

Custom spells using recognized official structures receive the corresponding supported workflow. Unrecognized mechanics must be identified and remain subject to the same gap and independence rules; arbitrary homebrew completeness is outside this milestone.

This is a planning decision. It does not implement a report, change runtime availability, or claim any new tests have passed.
