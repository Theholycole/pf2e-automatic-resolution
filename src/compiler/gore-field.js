// A field of bloody roses grown from a thrall (Blossoming Gore): "This field appears in a 20-foot burst centered on a corner in the target thrall's space, and that
// thrall is destroyed. A creature that enters or starts its turn in the area takes 10 persistent bleed damage from the rose's thorns. You can Dismiss this spell." / "If
// a bleeding creature ends its turn in the area, it must attempt a Fortitude saving throw." with the results (Success {Drained 1}; Failure drained 1 and a thrall
// created adjacent to the field; Critical Failure {Drained 2} and 2 thralls) and "Heightened (+1) The persistent bleed damage increases by 2." — the thrall at 0 HP;
// the burst a region at its token's corner, two Ongoing areas: entering or starting a turn inside, the persistent bleed at the cast rank; a bleeding creature ending its
// turn inside, its save (Drained by the result); the thralls created the GM's (the necromancer's own rules).
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_UUID_START as C, LABELS } from "./text-patterns.js";

const RULES = {
    field: /^This field appears in a (\d+)-foot burst centered on a corner in the target thrall's space, and that thrall is destroyed\.$/,
    bleed: /^A creature that enters or starts its turn in the area takes (\d+) persistent ([a-z]+) damage from the rose's thorns\.$/,
    dismiss: /^You can Dismiss this spell\.$/,
    save: /^If a bleeding creature ends its turn in the area, it must attempt a (Fortitude|Reflex|Will) saving throw\.$/
};
const ROWS = {
    criticalSuccess: /^The creature is unaffected\.$/,
    success: new RegExp(String.raw`^The creature is ${C}Drained (\d)\}\.$`),
    failure: /^The creature is drained (\d), and a single thrall is created in an unoccupied space adjacent to the field\.$/,
    criticalFailure: new RegExp(String.raw`^The creature becomes ${C}Drained (\d)\}, and (\d+) thralls are created in unoccupied spaces adjacent to the field\.$`)
};
const STEP = /^Heightened \(\+1\) The persistent ([a-z]+) damage increases by (\d+)\.$/;

/** {goreField, claimed} or null. */
export function compileGoreField(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || !/^1 of your thralls$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, results = "", heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!minutes || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    const claimed = {};
    for (const [index, sentence] of sentences.entries()) {
        const key = Object.keys(RULES).find(name => !claimed[name] && RULES[name].test(sentence));
        if (key) { claimed[key] = RULES[key].exec(sentence); continue; }
        if (index === 0 && !/\d|@|\b(?:damage|save|bonus|penalty)\b/.test(sentence)) continue;
        return null;
    }
    const rows = {};
    for (const [, label, text] of results.matchAll(/<p>\s*<strong>([^<]+)<\/strong>\s*([\s\S]*?)<\/p>/g)) {
        const key = LABELS[label.trim()], line = text.replace(/\s+/g, " ").trim();
        if (!key || rows[key] || !ROWS[key].test(line)) return null;
        rows[key] = ROWS[key].exec(line);
    }
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (Object.keys(claimed).length !== Object.keys(RULES).length || Object.keys(rows).length !== 4 || !step || step[1] !== claimed.bleed[2] || claimed.save[1].toLowerCase() !== adapted.defense.statistic) return null;
    const drained = rows.success[1];
    return { goreField: { seconds: Number(minutes[1]) * 60, radius: Number(claimed.field[1]), bleed: { amount: Number(claimed.bleed[1]), type: claimed.bleed[2], step: Number(step[2]) },
            statistic: adapted.defense.statistic, drainedUuid: drained,
            rows: { success: { value: Number(rows.success[2]), thralls: 0 }, failure: { value: Number(rows.failure[1]), thralls: 1 }, criticalFailure: { value: Number(rows.criticalFailure[2]), thralls: Number(rows.criticalFailure[3]) } } },
        claimed: [...sentences, ...Object.values(rows).map(row => htmlToPlainText(row[0])), step[0]] };
}
