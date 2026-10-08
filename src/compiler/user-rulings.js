// The user's rulings that name spells (not compiler rules): each entry is a decision the user made about specific spells, recorded with its date and
// reason, keyed by PF2e's compendium id. The compiler reads a ruling only after every rule has had its turn, and never to choose how a spell is automated.
//
// GM-handled (user decision 2026-10-04: "6 and 12 can be skipped and count as resolved"): world-scale or terrain-reshaping spells (group 6) and
// non-combat information, travel and ward spells (group 12). When no route automates one, its card whispers its text to the GM, marked as theirs to run.
export const GM_HANDLED = Object.freeze({
    // Group 6 — world-scale or terrain-reshaping.
    x7SPrsRxGb2Vy2nu: { name: "Earthquake", group: "world-scale" },
    xxhS66k68u5iIOHC: { name: "Upheaval", group: "world-scale" },
    ljo9CEmnCMZXqfOQ: { name: "Restore Ground", group: "world-scale" },
    A7NXFVgENRVtYoe3: { name: "Trim the Blight", group: "world-scale" },
    rillrYLb7V2mRyU7: { name: "Call of the Quenching", group: "world-scale" },
    "7zJxrjhK1LasSjSw": { name: "Under Sunless Skies", group: "world-scale" },
    VbP3EPkHDvDKX3eM: { name: "Veil of Broken Reality", group: "world-scale" },
    BI4iwu3nApyIG0zY: { name: "Astral Labyrinth", group: "world-scale" },
    "9dyWP9RGCFwunGEo": { name: "Theogeny", group: "world-scale" },
    "5uWwusDkfmOOlZjK": { name: "Shipwreck", group: "world-scale" },
    // Group 12 — non-combat information, travel and wards.
    r784cIz17eWujtQj: { name: "Scrying", group: "information" },
    y2cQYLr5mljDSu1G: { name: "Unrelenting Observation", group: "information" },
    oKC36WjFD1jgqUN5: { name: "Forest of Gates", group: "travel" },
    "3KiM09e8DN9AdTPA": { name: "Hag's Fruit", group: "ward" },
    kLxJx7BECVgHh2vb: { name: "Temporal Ward", group: "ward" },
    VUMtDHr8CRwwr3Mj: { name: "Aura of the Unremarkable", group: "information" },
    // Third-party spells of the same kinds (user decision 2026-10-06, asked: "Should third-party spells of those kinds count the same way?" — "Yes, same
    // rule"), keyed by the module item's compendium id.
    MS3jjbVdiFErpk9r: { name: "If Walls Could Talk", group: "information", ruling: "2026-10-06" },
    MXE5g6zlZz6ulE8b: { name: "Fall to Ruin", group: "world-scale", ruling: "2026-10-06" },
    "8p4xVEywQr8pN5QN": { name: "Raise Mountain", group: "world-scale", ruling: "2026-10-06" },
    D3dXH3Tw6ia6WzjX: { name: "Thousand-Year Flood", group: "world-scale", ruling: "2026-10-06" },
    "7g1QXbVbNs3ja0wv": { name: "State of the Art", group: "world-scale", ruling: "2026-10-06" },
    R6VTdIS6rtkAvHCx: { name: "Sacrosanct Promise", group: "non-combat", ruling: "2026-10-06" },
    jVDve0pBqR3YfJh3: { name: "From Thine Sight", group: "non-combat", ruling: "2026-10-06" }
});
export const GM_HANDLED_RULING = { date: "2026-10-04", text: "6 and 12 can be skipped and count as resolved" };

/** The GM-handled ruling for a spell source (by its compendium id, or the id its copy came from), or null. */
export function gmHandledRuling(item) {
    const ids = [item?._id, item?._stats?.compendiumSource, item?.flags?.core?.sourceId, item?.uuid].filter(Boolean).map(value => String(value).split(".").at(-1));
    for (const id of ids) if (Object.hasOwn(GM_HANDLED, id)) return { id, ...GM_HANDLED[id] };
    return null;
}
