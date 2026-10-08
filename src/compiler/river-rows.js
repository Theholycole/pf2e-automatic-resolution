// A river whose waters trip everyone and hurt the undead (Life's Flowing River): "You create a flowing river of ghostly water and that sheds dim light for 10
// feet on each side. The river begins in an adjacent square to you and extends in a straight 5-foot path to its maximum range or until it hits a solid
// barrier, whichever comes first. A creature that begins its turn in the glowing waters of the river or who enters one of the river's spaces must attempt a
// Will save. If the creature is undead or a nindoru, it takes @Damage[4d6[mental]] damage, modified by the result of their Will save." with rows "The
// creature ignores the river's effects until the start of its next turn. If the creature is undead or a nindoru, it takes no damage." / "The creature
// treats all squares occupied by the river as difficult terrain until the start of its next turn. … half damage." / "As success, but the creature is also
// knocked {Prone}. … full damage." / "As failure, but the creature is pushed 20 feet along the river's path in the direction of flow. … double mental
// damage." and "Heightened (+1) The mental damage increases by 1d6." — the lingering line (entering or starting a turn in it): the rows' damage only for
// undead and nindoru creatures (the text's formula at the cast rank), Prone, the push away from the caster (the flow), the river difficult terrain for the
// creature until its next turn, and on a critical success no exposure until then.
import { htmlToPlainText } from "./description-parser.js";
import { HEADINGS, HEIGHTENED_TYPED_DAMAGE_STEP as STEP } from "./text-patterns.js";

const LEAD = [/^You create a flowing river of ghostly water and that sheds dim light for (\d+) feet on each side\.$/,
    /^The river begins in an adjacent square to you and extends in a straight 5-foot path to its maximum range or until it hits a solid barrier, whichever comes first\.$/,
    /^A creature that begins its turn in the glowing waters of the river or who enters one of the river's spaces must attempt a (Fortitude|Reflex|Will) save\.$/,
    /^If the creature is ([a-z]+) or an? ([a-z]+), it takes @Damage\[(\d+)d(\d+)\[([a-z]+)\]\] damage, modified by the result of their (Fortitude|Reflex|Will) save\.$/];
const TRAIT_DAMAGE = { criticalSuccess: /^If the creature is ([a-z]+) or an? ([a-z]+), it takes no damage\.$/, success: /^If the creature is ([a-z]+) or an? ([a-z]+), it takes half damage\.$/,
    failure: /^If the creature is ([a-z]+) or an? ([a-z]+), it takes full damage\.$/, criticalFailure: /^If the creature is ([a-z]+) or an? ([a-z]+), it takes double ([a-z]+ )?damage\.$/ };
const ROWS = { criticalSuccess: /^The creature ignores the river's effects until the start of its next turn\.$/,
    success: /^The creature treats all squares occupied by the river as difficult terrain until the start of its next turn\.$/,
    failure: /^As success, but the creature is also knocked (@UUID\[[^\]]+\]\{Prone\})\.$/,
    criticalFailure: /^As failure, but the creature is pushed (\d+) feet along the river's path in the direction of flow\.$/ };

/** {html, area, formula, damageTraits, lingering, immunity, notes, claimed} or null. */
export function rewriteRiverRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim() || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const range = /^(\d+) feet$/.exec(String(adapted.targeting?.range ?? "").trim());
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!minutes || !range || !table || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (sentences.length !== LEAD.length || LEAD.some((pattern, index) => !pattern.test(sentences[index]))) return null;
    const statistic = LEAD[2].exec(sentences[2])[1], hurt = LEAD[3].exec(sentences[3]);
    if (statistic.toLowerCase() !== adapted.defense.statistic || hurt[6] !== statistic) return null;
    const written = [];
    let push = null;
    for (const [degree, heading] of Object.entries(HEADINGS)) {
        const row = new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*<\/strong>([\s\S]*?)<\/p>`, "i").exec(table);
        const parts = htmlToPlainText(row?.[1] ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/);
        const rule = ROWS[degree].exec(parts[0] ?? ""), damage = TRAIT_DAMAGE[degree].exec(parts[1] ?? "");
        if (parts.length !== 2 || !rule || !damage || damage[1] !== hurt[1] || damage[2] !== hurt[2]) return null;
        if (degree === "criticalFailure") push = Number(rule[1]);
        written.push(`${heading} ${parts.join(" ")}`);
    }
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (heightened.trim() && !(step && step[2] === hurt[5] && step[4] === hurt[4])) return null;
    const prone = /@UUID\[[^\]]+\]\{Prone\}/.exec(table)[0];
    const base = Number(adapted.rank) || 1;
    return {
        html: `<p>Each creature that enters the area or starts its turn in the area must attempt a ${statistic} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage and is knocked ${prone}.</p><p><strong>Critical Failure</strong> The creature takes double damage and is pushed ${push} feet away from you and knocked ${prone}.</p>`,
        area: { type: "line", value: Number(range[1]) },
        damage: { formula: `${hurt[3]}d${hurt[4]}`, type: hurt[5], text: step ? `(${hurt[3]} + ${step[3]}*floor((@item.rank - ${base})/${step[1]}))d${hurt[4]}[${hurt[5]}]` : `${hurt[3]}d${hurt[4]}[${hurt[5]}]` },
        damageTraits: { traits: [hurt[1], hurt[2]], sourceText: sentences[3] },
        lingering: { rowTerrain: { degrees: ["success", "failure", "criticalFailure"], until: "next-turn-start", sourceText: written[1] } },
        immunity: { degrees: ["criticalSuccess"], sourceText: written[0] },
        notes: [`The river sheds dim light for ${LEAD[0].exec(sentences[0])[1]} feet on each side.`, "A critically failing creature is pushed along the river's path, in its direction of flow (away from you)."],
        claimed: [...sentences, ...written, ...(step ? [step[0]] : [])]
    };
}
