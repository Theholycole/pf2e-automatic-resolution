// Doubt on the next roll of the kind that failed (Shaken Confidence): "Trigger An enemy within 30 feet of you critically fails an attack roll, Perception check,
// or skill check." / "… The enemy attempts a Will saving throw." with rows "The target is unaffected." / "The target is briefly shaken and unsure of its
// abilities. It must roll twice and take the worse result on the next roll of the same type as the critical failure that triggered the spell (such as …). If
// the target doesn't attempt any qualifying checks, the spell ends at the end of the target's next turn.": the caster names the triggering roll on the card
// (an attack roll, Perception, or one skill); a failing row's note carries PF2e's misfortune (roll twice, keep the lower) on the next such roll, removed after
// that roll, or at the end of the target's next turn.
import { htmlToPlainText } from "./description-parser.js";

const TRIGGER = /^Trigger An enemy within (\d+) feet of you critically fails an attack roll, Perception check, or skill check\.$/;
const SAVE = /^The enemy attempts an? (Fortitude|Reflex|Will) saving throw\.$/;
const FAILURE = /^The target is briefly [a-z ]+\. It must roll twice and take the worse result on the next roll of the same type as the critical failure that triggered the spell \(such as [^)]+\)\. If the target doesn't attempt any qualifying checks, the spell ends at the end of the target's next turn\.$/;
export const ROLL_TYPES = { "attack roll": "attack-roll", perception: "perception", acrobatics: "acrobatics", arcana: "arcana", athletics: "athletics", crafting: "crafting",
    deception: "deception", diplomacy: "diplomacy", intimidation: "intimidation", medicine: "medicine", nature: "nature", occultism: "occultism", performance: "performance",
    religion: "religion", society: "society", stealth: "stealth", survival: "survival", thievery: "thievery" };

/** {html, choice, notes, constraint, sentences} or null. */
export function rewriteMisfortuneRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length || !/^reaction$/i.test(String(adapted.activation?.time ?? "").trim())) return null;
    const [trigger, body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const plain = html => htmlToPlainText(html).replace(/\s+/g, " ").trim();
    const trig = TRIGGER.exec(plain(trigger));
    const sentences = plain(body).split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const save = SAVE.exec(sentences.at(-1) ?? "");
    if (!trig || !save || save[1].toLowerCase() !== adapted.defense.statistic || sentences.slice(0, -1).some(sentence => /\d|@|\b(?:damage|bonus|penalty|condition|immune|must|can't)\b/i.test(sentence))) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => plain(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "");
    if (rows.length !== 2 || row("Success") !== "The target is unaffected." || !FAILURE.test(row("Failure"))) return null;
    const turn = { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 1, sourceText: "until the end of the target's next turn" };
    const notes = Object.entries(ROLL_TYPES).map(([option, selector]) => ({ label: "Shaken confidence",
        text: `It rolls twice and takes the worse result on its next ${option === "perception" ? "Perception check" : option === "attack roll" ? "attack roll" : `${option[0].toUpperCase()}${option.slice(1)} check`} (this ends after that roll); if it makes none, this ends at the end of its next turn.`,
        sourceText: row("Failure"), claimsRow: true, duration: { ...turn }, rules: [{ key: "RollTwice", selector, keep: "lower", removeAfterRoll: true }], choiceGroup: "caster-option", option }));
    return {
        html: `<p>The target must attempt a ${save[1]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> The target is unaffected.</p><p><strong>Critical Failure</strong> The target is unaffected.</p>`,
        choice: { kind: "option", values: Object.keys(ROLL_TYPES), label: "Triggering roll", rows: ["failure", "criticalFailure"] },
        notes,
        constraint: { sourceText: String(adapted.targeting?.target ?? ""), supportsActorTargets: true, complete: true, predicates: [{ kind: "enemy-of-caster" }] },
        sentences: [plain(trigger), ...sentences, row("Success"), row("Failure")]
    };
}
