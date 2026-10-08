// A burning tree that fascinates those who see it (Burning Blossoms): "Area 30-foot radius, 100-foot tall cylinder" / "… Any creature that ends its turn
// under the tree's branches takes 6d6 fire damage from the burning petals. Any enemy that can see the tree, even if the enemy is outside the spell's area,
// must attempt a Will save. This is an emotion, mental, and visual effect. Creatures Fascinated with the tree must use at least one of their actions on
// each of their turns to move toward the tree." with "Critical Success … temporarily immune for 24 hours." / "Success … must attempt a new save at the
// end of its turn if it can still see the tree." / "Failure … Fascinated with the tree until the end of its next turn. If it can still see the tree at
// the end of its turn, it must attempt a new save." / "Critical Failure … fascinated with the tree until the spell ends. The tree's fire damage doesn't
// end the fascination, but other hostile actions end it as normal. If the fascination ends, the creature must attempt a new save …" and "Heightened (+1)
// The damage increases by 1d6." — a card of parts: the tree's area (placed for the spell's time; the petals' damage, no save, to each creature ending
// its turn there) and the enemies' Will save (pressed again by the GM each time a creature that can still see the tree ends its turn), its rows'
// Fascinated, immunity and the move-toward note.
import { plainOrEmpty as plain } from "./text-patterns.js";

const FASCINATED = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Fascinated\}`;
const LEAD = [
    /^An intangible hollow tree grows to towering height, radiating a fiery passion and fascinating viewers\.$/,
    /^The base of the tree takes up a single square and grows (\d+) feet upward, while its branches extend outward (\d+) feet, forming the spell's cylindrical area\.$/,
    /^The tree then blossoms, growing delicate white flowers that burn with white-hot fire\.$/,
    /^As the tree's branches gently rustle in the wind, flower petals drift to the ground in a shower of flame\.$/,
    /^Any creature that ends its turn under the tree's branches takes (\d+)d(\d+) ([a-z]+) damage from the burning petals\.$/,
    /^Any enemy that can see the tree, even if the enemy is outside the spell's area, must attempt an? (Fortitude|Reflex|Will) save\.$/,
    /^This is an? ([a-z]+), ([a-z]+), and ([a-z]+) effect\.$/,
    new RegExp(String.raw`^Creatures ${FASCINATED} with the tree must use at least one of their actions on each of their turns to move toward the tree\.$`)
];
const ROWS = {
    criticalSuccess: /^The creature is unaffected and is temporarily immune for (\d+) hours\.$/,
    success: /^The creature is unaffected, but it must attempt a new save at the end of its turn if it can still see the tree\.$/,
    failure: new RegExp(String.raw`^The creature is ${FASCINATED} with the tree until the end of its next turn\. If it can still see the tree at the end of its turn, it must attempt a new save\.$`),
    criticalFailure: /^The creature is fascinated with the tree until the spell ends\. The tree's fire damage doesn't end the fascination, but other hostile actions end it as normal\. If the fascination ends, the creature must attempt a new save at the end of its turn if it can still see the tree\.$/
};
const STEP = /^Heightened \(\+(\d)\) The damage increases by (\d+)d(\d+)\.$/;

/** {saveHTML, hazard, traits, drawn, steadfast, notes, sentences} or null. */
export function extractFieryTree(adapted) {
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!minutes || adapted.lifecycle?.sustained || adapted.defense?.kind !== "save" || adapted.defense.basic || adapted.targeting?.area?.type !== "cylinder" || (adapted.damageComponents ?? []).length !== 1) return null;
    const [areaPart, body, table, heightened, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!heightened || rest.length || !/^Area \d+-foot radius, \d+-foot tall cylinder$/.test(plain(areaPart))) return null;
    const sentences = body.replace(/<\/?p>/g, "").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (sentences.length !== LEAD.length) return null;
    const m = LEAD.map((pattern, index) => pattern.exec(sentences[index]));
    if (m.some(hit => !hit) || m[5][1].toLowerCase() !== adapted.defense.statistic || Number(m[1][2]) !== Number(adapted.targeting.area.value)) return null;
    const component = adapted.damageComponents[0];
    if (component.category || String(component.formula).replace(/\s+/g, "") !== `${m[4][1]}d${m[4][2]}` || String(component.type).toLowerCase() !== m[4][3]) return null;
    const rows = {};
    for (const [degree, heading] of [["criticalSuccess", "Critical Success"], ["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]]) {
        const row = new RegExp(String.raw`<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>`).exec(table);
        const text = row ? row[1].replace(/\s+/g, " ").trim() : "";
        rows[degree] = ROWS[degree].exec(text);
        if (!rows[degree]) return null;
    }
    const step = STEP.exec(plain(heightened));
    if (!step || step[3] !== m[4][2] || Number(step[1]) !== 1) return null;
    const rank = Number(adapted.rank) || 1, dice = Number(m[4][1]), per = Number(step[2]);
    const fascinated = rows.failure[1];
    const toward = "It must use at least one of its actions on each of its turns to move toward the tree.";
    return {
        saveHTML: `<p>Each enemy that can see the tree must attempt a ${m[5][1]} save.</p><hr /><p><strong>Critical Success</strong> The creature is unaffected and temporarily immune for ${rows.criticalSuccess[1]} hours.</p>`
            + `<p><strong>Success</strong> The creature is unaffected.</p><p><strong>Failure</strong> The creature is @UUID[${fascinated}]{Fascinated} until the end of its next turn.</p>`
            + `<p><strong>Critical Failure</strong> The creature is @UUID[${fascinated}]{Fascinated} for ${minutes[1]} minute${minutes[1] === "1" ? "" : "s"}.</p>`,
        // (Spaced: Foundry would read "@item.rank-2" as one data path.)
        hazard: { place: { type: "burst", value: Number(m[1][2]) }, events: ["turn-end"], formula: `(${dice}+${per}*(@item.rank - ${rank}))d${m[4][2]}`, type: m[4][3], rounds: Number(minutes[1]) * 10,
            label: "the burning petals", sourceText: plain(sentences[4]) },
        traits: [m[6][1], m[6][2], m[6][3]],
        drawn: { failure: { label: "Drawn to the tree", text: toward, sourceText: plain(sentences[7]), duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 1, sourceText: "until the end of its next turn" } },
            criticalFailure: { label: "Drawn to the tree", text: `${toward} The tree's fire damage doesn't end its fascination; other hostile actions do (remove it then).`, sourceText: plain(rows.criticalFailure[0]),
                duration: { mode: "fixed", value: Number(minutes[1]), unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: "until the spell ends" } } },
        repeat: "a creature that can still see the tree ends its turn (after a success or a failure, or once a critical failure's fascination has ended)",
        notes: [`The tree is ${m[1][1]} feet tall; its branches make the ${m[1][2]}-foot-radius area.`],
        sentences: [plain(areaPart), ...sentences.map(plain), ...Object.values(rows).map(row => plain(row[0])), plain(heightened)]
    };
}
