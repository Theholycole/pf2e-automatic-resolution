// A column of lava that encases what it hits (Volcanic Eruption): "Area 5-foot radius, 80-foot-tall cylinder" / "The ground opens up, spraying a column of
// lava …, dealing 14d6 fire damage to creatures in the area. The lava rapidly cools and encases creatures in the area. A creature encased in rock is
// Clumsy 1 and takes a –10-foot status penalty to its Speeds. All normal terrain is difficult terrain to a flying creature, and such creatures immediately
// descend 20 feet the moment they're encased, but they don't take damage from this fall. A creature encased in rock can attempt to Escape against your
// spell DC to end the effect. Otherwise, the creature remains encased until it takes a total of 50 damage, freeing it from the rock. Additionally,
// creatures in the area and those within 5 feet of the lava column automatically take (@item.rank-4)d6 fire damage from the intense heat, regardless of
// the results of their saving throws." with rows of half, full (and encased) and double damage (and encased), and "Heightened (+1) The damage in the area
// increases by 2d6, and the damage from the intense heat increases by 1d6." — a card of parts: the column's save (the failing rows' "Encased in rock"
// note: Clumsy 1 and the Speed penalty as PF2e's rules, ended by an Escape against the spell DC or 50 total damage) and the heat's damage, no save,
// to the creatures the GM targets (in the area and within 5 feet of it).
import { plainOrEmpty as plain } from "./text-patterns.js";

const C = name => String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{${name}\}`;
const LEAD = [
    /^The ground opens up, spraying a column of lava high into the air in a vertical cylinder, dealing (\d+d\d+) ([a-z]+) damage to creatures in the area\.$/,
    /^The lava rapidly cools and encases creatures in the area\.$/,
    new RegExp(String.raw`^A creature encased in rock is ${C("Clumsy (\\d)")} and takes a [-–−](\d+)-foot status penalty to its Speeds\.$`),
    /^All normal terrain is difficult terrain to a flying creature, and such creatures immediately descend (\d+) feet the moment they're encased, but they don't take damage from this fall\.$/,
    /^A creature encased in rock can attempt to @UUID\[[^\]]+\]\{Escape\} against your spell DC to end the effect\.$/,
    /^Otherwise, the creature remains encased until it takes a total of (\d+) damage, freeing it from the rock\.$/,
    /^Additionally, creatures in the area and those within (\d+) feet of the lava column automatically take @Damage\[\(@item\.rank ?-(\d+)\)d(\d+)\[([a-z]+)\]\] damage from the intense heat, regardless of the results of their saving throws\.$/
];
const ROWS = { criticalSuccess: /^The creature is unaffected\.$/, success: /^The creature takes half damage\.$/, failure: /^The creature takes full damage and is encased\.$/, criticalFailure: /^The creature takes double damage and is encased\.$/ };
const STEP = /^Heightened \(\+(\d)\) The damage in the area increases by (\d+d\d+), and the damage from the intense heat increases by 1d(\d+)\.$/;

/** {saveHTML, encased, heat, notes, sentences} or null. */
export function extractLavaColumn(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || adapted.targeting?.area?.type !== "cylinder" || (adapted.damageComponents ?? []).length !== 1) return null;
    const [areaPart, body, table, heightened, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!heightened || rest.length || !/^Area \d+-foot radius, \d+-foot-tall cylinder$/.test(plain(areaPart))) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(match => match[1].trim());
    if (paragraphs.length !== 2 || !/^@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}$/.test(paragraphs[1])) return null;
    const sentences = paragraphs[0].replace(/\s+/g, " ").split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (sentences.length !== LEAD.length) return null;
    const m = LEAD.map((pattern, index) => pattern.exec(sentences[index]));
    if (m.some(hit => !hit)) return null;
    const component = adapted.damageComponents[0];
    if (component.category || String(component.formula).replace(/\s+/g, "") !== m[0][1] || String(component.type).toLowerCase() !== m[0][2]) return null;
    for (const [degree, heading] of [["criticalSuccess", "Critical Success"], ["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]]) {
        const row = new RegExp(String.raw`<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>`).exec(table);
        if (!row || !ROWS[degree].test(plain(row[1]))) return null;
    }
    const step = STEP.exec(plain(heightened));
    if (!step || step[3] !== m[6][3] || adapted.heightening?.type !== "interval" || String(adapted.heightening.damage?.[component.id] ?? "").replace(/\s+/g, "") !== step[2]) return null;
    const [, clumsyUuid, clumsy, penalty] = m[2];
    // (A row note grants a condition at its own value 1.)
    if (clumsy !== "1") return null;
    const plainSentences = sentences.map(plain);
    return {
        saveHTML: `<p>${sentences[0]}</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage.</p><p><strong>Critical Failure</strong> The creature takes double damage.</p><hr /><p><strong>Heightened (+${step[1]})</strong> The damage increases by ${step[2]}.</p>`,
        encased: { label: "Encased in rock", text: `Encased in rock: Clumsy ${clumsy} and a –${penalty}-foot status penalty to its Speeds. A flying creature descends ${m[3][1]} feet at once (no falling damage) and all normal terrain is difficult terrain for it. It ends when the creature Escapes (the spell DC) or has taken ${m[5][1]} damage in total.`,
            sourceText: plainSentences.slice(1, 6).join(" "), rules: [{ key: "GrantItem", uuid: clumsyUuid, flag: "conditionClumsy" },
                { key: "FlatModifier", selector: "all-speeds", type: "status", value: -Number(penalty) }],
            escape: true, damageLimit: Number(m[5][1]), duration: { mode: "unlimited", value: null, unit: null, sourceText: "until it Escapes or takes the stated damage" } },
        // (Spaced: Foundry would read "@item.rank-4" as one data path.)
        heat: { formula: `(@item.rank - ${m[6][2]})d${m[6][3]}[${m[6][4]}]`, within: Number(m[6][1]), sourceText: plainSentences[6] },
        sentences: plainSentences
    };
}
