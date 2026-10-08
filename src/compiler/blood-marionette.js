// A creature's blood made to obey (Gruesome Marionettist): "Choose two actions or activities the creature can take that have either the attack, manipulate, or move
// traits, one is prohibited and the other is directed. If the creature takes the prohibited action or activity, it takes 5d10 persistent bleed damage. If the creature
// takes the directed action or activity, it is immune to the bleed damage from this spell until the beginning of its next turn." with "Critical Success The target is
// unaffected." / "Success The creature takes half the persistent bleed damage and the spell ends at the beginning of your next turn." / "Failure The creature takes the
// full persistent bleed damage and the spell lasts for the duration." / "Critical Failure As failure, except the creature takes double the persistent bleed damage."
// and "Heightened (+1) The persistent bleed damage increases by 1d10.": the caster names the two actions; the target's save sets the share of the damage and the
// time (until the caster's next turn, or the sustained duration); the target's Effect holds them, its card's controls for the GM — the prohibited action taken
// (the persistent bleed at the cast rank and share, unless the directed action protects it) and the directed action taken (immune until its next turn).
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES } from "./text-patterns.js";

const CHOOSE = /^Choose two actions or activities the creature can take that have either the ([a-z]+), ([a-z]+), or ([a-z]+) traits, one is prohibited and the other is directed\.$/;
const PROHIBITED = /^If the creature takes the prohibited action or activity, it takes (\d+)d(\d+) persistent ([a-z]+) damage\.$/;
const DIRECTED = /^If the creature takes the directed action or activity, it is immune to the \3 damage from this spell until the beginning of its next turn\.$/;
const ROWS = { criticalSuccess: /^The target is unaffected\.$/, success: /^The creature takes half the persistent ([a-z]+) damage and the spell ends at the beginning of your next turn\.$/,
    failure: /^The creature takes the full persistent ([a-z]+) damage and the spell lasts for the duration\.$/, criticalFailure: /^As failure, except the creature takes double the persistent ([a-z]+) damage\.$/ };
const STEP = /^Heightened \(\+1\) The persistent ([a-z]+) damage increases by 1d(\d+)\.$/;

/** {marionette, sentences} or null. */
export function extractMarionette(item) {
    const save = item?.system?.defense?.save;
    // (The item calls its save basic; the text gives its own rows — the text is read.)
    if (!save?.statistic || !item.system?.duration?.sustained || !/^1 minute$/.test(String(item.system?.duration?.value ?? "").trim())) return null;
    const [body, heightened = "", ...rest] = String(item.system?.description?.value ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const lead = htmlToPlainText(paragraphs[0] ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const choose = CHOOSE.exec(lead[1] ?? ""), prohibited = PROHIBITED.exec(lead[2] ?? "");
    const directed = prohibited ? new RegExp(DIRECTED.source.replace("\\3", prohibited[3])).test(lead[3] ?? "") : false;
    const row = heading => htmlToPlainText(paragraphs.find(p => p.startsWith(`<strong>${heading}</strong>`))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const rows = Object.fromEntries(Object.entries(ROWS).map(([degree, pattern]) => [degree, pattern.exec(row({ criticalSuccess: "Critical Success", success: "Success", failure: "Failure", criticalFailure: "Critical Failure" }[degree]))]));
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 5 || lead.length !== 4 || NARRATION_RULES.test(lead[0]) || !choose || !prohibited || !directed || Object.values(rows).some(entry => !entry) || !step
        || [rows.success[1], rows.failure[1], rows.criticalFailure[1], step[1]].some(type => type !== prohibited[3]) || step[2] !== prohibited[2]) return null;
    const components = Object.values(item.system?.damage ?? {});
    if (components.length > 1 || (components[0] && (components[0].type !== prohibited[3] || String(components[0].formula).replace(/\s+/g, "") !== `${prohibited[1]}d${prohibited[2]}`))) return null;
    return {
        marionette: { statistic: save.statistic, traits: [choose[1], choose[2], choose[3]], dice: Number(prohibited[1]), die: Number(prohibited[2]), type: prohibited[3], baseRank: Number(item.system?.level?.value ?? 1),
            share: { criticalSuccess: null, success: 0.5, failure: 1, criticalFailure: 2 }, ends: { success: "caster-next-turn-start", failure: "duration", criticalFailure: "duration" }, seconds: 60 },
        sentences: [lead[1], lead[2], lead[3], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(row), htmlToPlainText(heightened).trim()]
    };
}
