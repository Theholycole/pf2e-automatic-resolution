# Cantrip / rank 1 batch 107 — Lift Nature's Caul

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Aberrations or worshippers of Outer Gods or Great Old Ones are bolstered … and gain a +1 status bonus to Will saving throws and attack rolls for 1 minute, while all other creatures must attempt a Will saving throw.”: the GM's yes/no per target. Yes gives PF2e's Bonus Effect (proved: +1 status to Will and attack rolls, 1 minute) and no save | Lift Nature's Caul (1) |
| Critical success “unaffected and temporarily immune for 1 hour”: the spell's immunity on that result only | Lift Nature's Caul |
| Success Sickened 1; failure Stupefied 1 (1 minute) and Frightened 1; critical failure Stupefied 1 (1 minute) and Frightened 2 | Lift Nature's Caul |
| “It can't reduce the value of its frightened condition below 1 as long as it remains stupefied by this spell.”: a floor Effect linked to that Stupefied | Lift Nature's Caul |
| Duration “varies”: the rows' own lifetimes | Lift Nature's Caul |

**Kept strict (tests):** it isn't read with any of these changes:
- another bonus value, or AC;
- an added condition with the immunity;
- a floor above the granted value;
- a floor tied to the area.

## Coverage

**Census:** **588 enabled**, up from 587.
- The b190 corpus diff against b189 changed only Lift Nature's Caul (newly executable).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 706/706 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-107-live-results.json), case `cr1Batch107`:
- **Before the answers:** finalizing was refused.
- **“Bolstered” target:** got the Bonus Effect and no conditions.
- **Critical success:** got the immunity Effect and no conditions.
- **Success:** Sickened 1, with no immunity.
- **Critical failure:**
  - Frightened 2 and Stupefied 1, with a 1-minute floor Effect. The floor's locked Frightened 1 sits beside Frightened 2.
  - Two Frightened drops left Frightened 1.
  - Removing Stupefied ended the floor, and the next drop cleared Frightened.

**Regressions:** `cr1Batch56` (Dirge of Doom's spell floor) and `cr1Batch16` (temporary immunity) passed. No combats or `PFTEST` regions were left.
