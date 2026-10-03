#!/usr/bin/env python3
"""Regenerate docs/spell-resolution-status.md and docs/spell-resolution-by-rank.md
from the phase worklists.

Run after tools/build-phase-spell-batches.py. Counts each in-scope spell once,
under its primary phase and rule family, and by its rank.
"""
import datetime
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BATCHES = ROOT / "reports" / "phase-spell-batches"

names = {}
for line in (BATCHES / "README.md").read_text().splitlines():
    match = re.match(r"\| (\d) \| ([^|]+) \| (\d+) \| (\d+) \| (\d+) \|", line)
    if match:
        names[match[1]] = match[2].strip()

phases = []
for phase in sorted(names):
    rows = []
    for line in (BATCHES / f"phase-{phase}.md").read_text().splitlines():
        match = re.match(r"\| ([^|]+) \| (\d+) \| (\d+) \| \d+ \|$", line.strip())
        if match and match[1].strip() != "Rule family":
            rows.append((match[1].strip(), int(match[2]), int(match[3])))
    phases.append((phase, rows))

total = sum(t for _, rows in phases for _, t, _ in rows)
cannot = sum(n for _, rows in phases for _, _, n in rows)
out = [
    "# Automatic spell resolution status", "",
    f"Generated {datetime.date.today().isoformat()} from the current compiler output (Foundry 14.367, PF2e 8.5.0). "
    f"Each of the {total:,} in-scope spells and rituals is counted once, under its primary phase and rule family. "
    "\"Can resolve\" means the module has an enabled automatic route for the spell; for some spells, that route automates only part of the spell. "
    "Afflictions resolve their immediate outcome here and hand the finalized degree to the Pseudo Afflictions module, which applies stages and progression; without that module, the card tells the GM exactly which affliction and stage to apply.", "",
    "Phase 1 (GM corrections and authority) applies to every phase, so no spells are assigned to it.", "",
    "Regenerate with `python3 tools/build-spell-resolution-status.py` after `tools/build-phase-spell-batches.py`.", "",
    "## By phase", "", "| Phase | Worklist | Can resolve | Cannot resolve | Total |", "| --- | --- | ---: | ---: | ---: |",
]
for phase, rows in phases:
    t = sum(r[1] for r in rows)
    n = sum(r[2] for r in rows)
    out.append(f"| {phase} | {names[phase]} | {t - n} | {n} | {t} |")
out.append(f"| **All** | | **{total - cannot}** | **{cannot}** | **{total}** |")
out += ["", "## By rule family", ""]
for phase, rows in phases:
    out += [f"### Phase {phase}: {names[phase]}", "", "| Rule family | Can resolve | Cannot resolve | Total |", "| --- | ---: | ---: | ---: |"]
    for name, t, n in rows:
        out.append(f"| {name[0].upper() + name[1:]} | {t - n} | {n} | {t} |")
    out.append("")
catalog_rows = json.loads((BATCHES / "catalog.json").read_text())["spells"]
notes = sum(1 for s in catalog_rows if s.get("route") == "note")
effect_notes = sum(1 for s in catalog_rows if s.get("route") == "effect-note")
out[out.index("## By phase")-1:out.index("## By phase")-1] = ["", f"**Note only (counted apart):** {notes} further spells have no mechanical rule the module could apply. Casting one gives a rule-less note Effect with the spell's rules for its duration (on the caster, with a line to mark the area on the map, for a spell placed in the environment). Note-only spells count as resolved (user decisions: cantrips and rank 1 on 2026-09-29, every rank on 2026-09-30), and so do note-only rituals (2026-10-03). All are listed apart in [the rank view](spell-resolution-by-rank.md).", "", f"**Effect + note (counted apart):** {effect_notes} further spells link a PF2e Effect the module can't prove covers the text (or can't tell who receives it). Casting one applies PF2e's Effect as PF2e defines it, plus a note Effect with the spell's text. They're also counted under \"Cannot resolve\" and listed apart in the rank view."]
(ROOT / "docs" / "spell-resolution-status.md").write_text("\n".join(out))
print(f"{total - cannot} can resolve, {cannot} cannot, {total} total")

# By rank: the catalog's spells, by the folder PF2e files them under (cantrips apart from rank 1).
catalog = json.loads((BATCHES / "catalog.json").read_text())["spells"]
RANKS = ["cantrip"] + [f"rank-{n}" for n in range(1, 11)]
label = lambda rank: "Cantrips" if rank == "cantrip" else f"Rank {rank.split('-')[1]}"
by_rank = {rank: [s for s in catalog if s["sourceFile"].split("/")[2] == rank] for rank in RANKS}
assert sum(len(v) for v in by_rank.values()) == len(catalog), "a catalog spell has no rank folder"
pct = lambda a, b: f"{100 * a / b:.0f}%" if b else "—"
rank_out = [
    "# Spells that can resolve, by rank", "",
    f"Generated {datetime.date.today().isoformat()} from the current compiler output (Foundry 14.367, PF2e 8.5.0), with the same counts as "
    "[the status by phase](spell-resolution-status.md). \"Can resolve\" means the module has an enabled automatic route for the spell; "
    "for some spells, that route automates only part of the spell. Ranks are PF2e's spell ranks; cantrips are listed apart from rank 1, "
    "and rituals are counted at their rank.", "",
    "Regenerate with `python3 tools/build-spell-resolution-status.py`.", "",
    "\"Note only\" spells (counted apart; inside \"Can resolve\" at every rank and for rituals too, by user decision) have no mechanical rule to apply; casting one gives a rule-less note Effect "
    "with the spell's rules for its duration, and a spell placed in the environment puts it on the caster with a line to mark the area on the map.", "",
    "\"Effect + note\" spells (also counted apart, inside \"Cannot resolve\") link a PF2e Effect the module can't prove covers the text: casting one applies "
    "PF2e's Effect as PF2e defines it, plus a note Effect with the spell's text.", "",
    "| Rank | Can resolve | Note only | Effect + note | Cannot resolve | Total | Resolved | Spells (can / total) | Rituals (can / total) |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
]
all_can = all_total = all_note = all_effect_note = 0
for rank in RANKS:
    rows = by_rank[rank]
    can = sum(1 for s in rows if s["enabledRoute"])
    spells = [s for s in rows if not s["ritual"]]
    rituals = [s for s in rows if s["ritual"]]
    note = sum(1 for s in rows if s.get("route") == "note")
    effect_note = sum(1 for s in rows if s.get("route") == "effect-note")
    all_can += can; all_total += len(rows); all_note += note; all_effect_note += effect_note
    rank_out.append(f"| {label(rank)} | {can} | {note} | {effect_note} | {len(rows) - can} | {len(rows)} | {pct(can, len(rows))} "
                    f"| {sum(1 for s in spells if s['enabledRoute'])} / {len(spells)} | {sum(1 for s in rituals if s['enabledRoute'])} / {len(rituals)} |")
rank_out.append(f"| **All** | **{all_can}** | **{all_note}** | **{all_effect_note}** | **{all_total - all_can}** | **{all_total}** | **{pct(all_can, all_total)}** | | |")
assert all_can == total - cannot and all_total == total, "rank counts disagree with the phase counts"
rank_out += ["", "## By rank and phase", "", "Can resolve / total, by each spell's primary phase.", "",
             "| Rank | " + " | ".join(f"Phase {p}" for p in sorted(names)) + " |", "| --- |" + " ---: |" * len(names)]
for rank in RANKS:
    cells = []
    for phase in sorted(names):
        rows = [s for s in by_rank[rank] if str(s["primaryPhase"]) == phase]
        cells.append(f"{sum(1 for s in rows if s['enabledRoute'])} / {len(rows)}" if rows else "—")
    rank_out.append(f"| {label(rank)} | " + " | ".join(cells) + " |")
rank_out += ["", "## Spells that can resolve", ""]
for rank in RANKS:
    enabled = sorted(s["name"] for s in by_rank[rank] if s["enabledRoute"])
    rank_out += [f"<details><summary>{label(rank)}: {len(enabled)}</summary>", "", ", ".join(enabled) if enabled else "None yet.", "", "</details>", ""]
rank_out += ["## Note-only spells", ""]
for rank in RANKS:
    noted = sorted(s["name"] for s in by_rank[rank] if s.get("route") == "note")
    rank_out += [f"<details><summary>{label(rank)}: {len(noted)}</summary>", "", ", ".join(noted) if noted else "None.", "", "</details>", ""]
rank_out += ["## Effect + note spells", ""]
for rank in RANKS:
    listed = sorted(s["name"] for s in by_rank[rank] if s.get("route") == "effect-note")
    rank_out += [f"<details><summary>{label(rank)}: {len(listed)}</summary>", "", ", ".join(listed) if listed else "None.", "", "</details>", ""]
(ROOT / "docs" / "spell-resolution-by-rank.md").write_text("\n".join(rank_out))

