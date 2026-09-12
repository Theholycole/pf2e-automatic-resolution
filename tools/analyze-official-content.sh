#!/usr/bin/env bash
set -euo pipefail

content_root="${1:-/home/theholycole/Documents/ChatGPT/pf2e}"
output_dir="${2:-reports}"

if [[ ! -d "$content_root/spells/spells" ]]; then
    echo "PF2e spell content was not found at: $content_root/spells/spells" >&2
    exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
    echo "This development analyzer requires jq." >&2
    exit 1
fi

mkdir -p "$output_dir"
spell_rows="$(mktemp)"
trap 'rm -f "$spell_rows"' EXIT

find "$content_root/spells/spells" -type f -name '*.json' -print0 \
    | sort -z \
    | xargs -0 jq -c '
        def description: (.system.description.value // "");
        def count_matches($pattern): [description | scan($pattern; "i")] | length;
        def has_pattern($pattern): (description | test($pattern; "i"));
        def primary_save:
            if .system.defense.save == null then "none"
            elif .system.defense.save.basic == true then "basic"
            else "non-basic"
            end;
        def degree_sections: {
            criticalSuccess: has_pattern("<strong[^>]*>\\s*Critical\\s+Success"),
            success: has_pattern("<strong[^>]*>\\s*Success"),
            failure: has_pattern("<strong[^>]*>\\s*Failure"),
            criticalFailure: has_pattern("<strong[^>]*>\\s*Critical\\s+Failure")
        };
        def structural_bucket:
            if has_pattern("<strong[^>]*>\\s*Arrive") and has_pattern("<strong[^>]*>\\s*Depart")
                then "interactive-arrive-depart"
            elif has_pattern("chain ends if[^.]+critically succeeds")
                then "interactive-chain"
            elif has_pattern("begins to use a move action")
                then "interactive-movement"
            elif has_pattern("ends its turn in the area must also attempt this save")
                then "interactive-recurring-area"
            elif primary_save == "basic" and ((.system.damage // {}) | length) > 0
                then "basic-save-structured-damage"
            elif primary_save == "basic"
                then "basic-save-no-structured-damage"
            elif primary_save == "non-basic" and ([degree_sections[]] | all)
                then "non-basic-four-outcomes"
            elif primary_save == "non-basic"
                then "non-basic-compact-or-incomplete"
            elif count_matches("@Check\\[") > 1
                then "no-primary-save-multiple-inline-checks"
            elif count_matches("@Check\\[") == 1
                then "no-primary-save-inline-check"
            elif ((.system.damage // {}) | length) > 0
                then "no-primary-save-structured-damage"
            else "no-primary-save-other"
            end;
        {
            id: ._id,
            name,
            slug: (.system.slug // null),
            sourceFile: input_filename,
            rank: (.system.level.value // null),
            category: (.system.category.value // null),
            traits: (.system.traits.value // []),
            primarySave: primary_save,
            saveStatistic: (.system.defense.save.statistic // null),
            structuredDamageComponents: ((.system.damage // {}) | length),
            sustained: (.system.duration.sustained == true),
            duration: (.system.duration.value // ""),
            area: (.system.area // null),
            target: (.system.target.value // ""),
            inlineChecks: count_matches("@Check\\["),
            inlineDamage: count_matches("@Damage\\["),
            degreeSections: degree_sections,
            hasHeightening: (.system.heightening != null or has_pattern("Heightened\\s*\\(")),
            structuralBucket: structural_bucket,
            coverageStatus: "not-yet-compiled"
        }
    ' > "$spell_rows"

jq -s '
    def count_by($field):
        group_by(.[$field])
        | map({key: (.[0][$field] | tostring), count: length})
        | sort_by(-.count, .key);
    {
        formatVersion: 1,
        compatibility: {foundry: "14", pf2e: "8.5.0"},
        generatedAt: (now | todateiso8601),
        scope: "Official spell structural inventory. Runtime parser coverage is intentionally not claimed.",
        totals: {
            spells: length,
            sustained: (map(select(.sustained)) | length),
            withStructuredDamage: (map(select(.structuredDamageComponents > 0)) | length),
            withInlineChecks: (map(select(.inlineChecks > 0)) | length),
            withInlineDamage: (map(select(.inlineDamage > 0)) | length)
        },
        byPrimarySave: count_by("primarySave"),
        byStructuralBucket: count_by("structuralBucket"),
        spells: .
    }
' "$spell_rows" > "$output_dir/official-spell-inventory.json"

jq -r '
    "# Official PF2e 8.5.0 Spell Inventory\n",
    "This is a structural inventory, not a claim that the current runtime parser supports each spell. Actual coverage remains `not-yet-compiled` until the parser is extracted and executed against every entry.\n",
    "## Totals\n",
    "- Spells: \(.totals.spells)",
    "- Sustained: \(.totals.sustained)",
    "- Structured damage: \(.totals.withStructuredDamage)",
    "- Inline checks: \(.totals.withInlineChecks)",
    "- Inline damage: \(.totals.withInlineDamage)\n",
    "## Primary-save structure\n",
    (.byPrimarySave[] | "- \(.key): \(.count)"),
    "\n## Structural buckets\n",
    (.byStructuralBucket[] | "- \(.key): \(.count)"),
    "\n## Next analyzer milestone\n",
    "Extract the macro inference layer behind a Foundry-independent adapter, compile every spell into the normalized ability model, and replace `not-yet-compiled` with automatic, prompted, guided, unsafe, unsupported, or compiler-error."
' "$output_dir/official-spell-inventory.json" > "$output_dir/official-spell-inventory.md"

echo "Wrote $output_dir/official-spell-inventory.json"
echo "Wrote $output_dir/official-spell-inventory.md"

