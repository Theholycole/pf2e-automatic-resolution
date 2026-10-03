// Tendrils of blood that lash nearby enemies (Bloody Tendrils): "You conjure forth stationary tentacles formed from pure, partially hardened blood. You create
// up to 3 Medium thralls shaped like bloody tendrils in range. These tendrils are immune to physical damage and can't move. The tendril's Strike has a reach of
// 10 feet. Whenever an enemy ends it turn within the reach of one or more tendrils, the tendril lashes out at them, dealing 1d12 bludgeoning damage with a basic
// Reflex save." with "Heightened (+3) The number of thralls this spell can create increases by 1, and the damage increases by 1d12.": the tendril thralls the
// cast's targets (their tokens, up to 3 — 1 more every 3 ranks); an enemy ending its turn within 10 feet of any of them saves (PF2e's damage, heightened),
// once a turn; the tendrils' immunity and stillness a note.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const CREATE = /^You create up to (\d+) (Medium) thralls shaped like [a-z ]+ in range\.$/;
const IMMUNE = /^These tendrils are immune to physical damage and can't move\.$/;
const REACH = /^The tendril's Strike has a reach of (\d+) feet\.$/;
const LASH = /^Whenever an enemy ends it(?:s)? turn within the reach of one or more tendrils, the tendril lashes out at them, dealing (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\.$/;
const STEP = /^Heightened \(\+(\d)\) The number of thralls this spell can create increases by (\d), and the damage increases by (\d+d\d+)\.$/;

/** {html, lingering, sentences} or null. */
export function rewriteBloodTendrils(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim() || adapted.lifecycle?.sustained) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const components = adapted.damageComponents ?? [];
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const create = CREATE.exec(sentences[1] ?? ""), reach = REACH.exec(sentences[3] ?? ""), lash = LASH.exec(sentences[4] ?? ""), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (sentences.length !== 5 || NARRATION_RULES.test(sentences[0]) || !create || !IMMUNE.test(sentences[2]) || !reach || !lash || !step) return null;
    const [, formula, type, statistic] = lash;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== formula || String(components[0].type).toLowerCase() !== type
        || statistic.toLowerCase() !== adapted.defense.statistic) return null;
    return {
        html: `<p>Each creature takes ${formula} ${type} damage with a basic ${statistic} save.</p>`,
        lingering: { events: ["turn-end"], initial: false, oncePerRound: false, excludeCaster: true, enemiesOnly: true, area: null, centre: "targets", aura: { feet: Number(reach[1]) },
            maxTargets: { count: Number(create[1]), step: { interval: Number(step[1]), add: Number(step[2]) }, baseRank: Number(adapted.rank) || 1 },
            durationSeconds: Number(minutes[1]) * 60, sustained: false, concealment: false,
            // (The tendrils are thralls: tokens by the thrall rules, with the text's immunity, stillness and reach — made when none are targeted.)
            thrallTokens: { size: "med", speed: 0, immunities: ["physical"], reach: Number(reach[1]) },
            notes: [`The tendril thralls (${create[2]}, up to ${create[1]}; +${step[2]} every ${step[1]} ranks) are made beside you when none are targeted. ${sentences[2]}`],
            sourceText: [sentences[4]] },
        sentences: [...sentences, htmlToPlainText(heightened).trim()]
    };
}
