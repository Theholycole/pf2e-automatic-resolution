// Dreams that cloud real threats (Waking Dream): "You cloud the target's mind with vivid, dreamlike imagery, so they have difficulty distinguishing real
// threats from imagined ones." with rows "The target is distracted by the visions and treats all other creatures as Concealed for 1 round, and you can't
// Sustain the Spell to increase the duration." / "The target is Confused. In addition to the creatures present, the target might also attack wildly at thin
// air, attempting to fend off the dreams. It can attempt a new save at the end of each of its turns to end the confusion. Even if the confused effect ends
// early, the target treats all other creatures as concealed for 1 round." / "As failure, but the target gets no save to end the effect early.": Confused
// for the sustained spell (ending early on the failure's end-of-turn save); everything Concealed *to it* a note (the success's round; after the
// confusion, a round); the success's no-Sustain a reminder.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const SUCCESS = new RegExp(String.raw`^The target is distracted by the visions and treats all other creatures as ${C}Concealed\} for (\d+) rounds?, and you can't Sustain the Spell to increase the duration\.$`);
const FAILURE = new RegExp(String.raw`^The target is (${C}Confused\})\. (In addition to the creatures present, the target might also attack wildly at thin air, attempting to fend off the dreams\.) (It can attempt a new save at the end of each of its turns to end the confusion\.) Even if the confused effect ends early, the target treats all other creatures as concealed for (\d+) rounds?\.$`);

/** {html, notes, reminder, sentences} or null. */
export function rewriteWakingVisions(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || adapted.lifecycle?.sustained !== true || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length || !minutes) return null;
    const lead = htmlToPlainText(body).replace(/\s+/g, " ").trim();
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const plain = heading => htmlToPlainText(row(heading)).replace(/\s+/g, " ").trim();
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(row("Failure"));
    if (!/^You cloud the target's mind with vivid, dreamlike imagery, so they have difficulty distinguishing real threats from imagined ones\.$/.test(lead) || rows.length !== 4
        || plain("Critical Success") !== "The target is unaffected." || !success || !failure || plain("Critical Failure") !== "As failure, but the target gets no save to end the effect early.") return null;
    const statistic = `${adapted.defense.statistic[0].toUpperCase()}${adapted.defense.statistic.slice(1)}`;
    const after = `When the confusion ends (early or with the spell), all other creatures are Concealed to it for ${failure[4]} round${failure[4] === "1" ? "" : "s"} (the GM's).`;
    const spellTime = { mode: "fixed", value: Number(minutes[1]), unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: `${minutes[1]} minute${minutes[1] === "1" ? "" : "s"}` };
    return {
        html: `<p>The target must attempt a ${statistic} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> The target is ${failure[1]} for the spell's duration. ${failure[3]}</p><p><strong>Critical Failure</strong> The target is ${failure[1]} for the spell's duration.</p>`,
        notes: {
            success: { label: "Dream visions", text: "All other creatures are Concealed to it (the GM rolls its flat checks).", sourceText: plain("Success"), claimsRow: true, gmPlays: true,
                duration: { mode: "fixed", value: Number(success[1]), unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: `${success[1]} round${success[1] === "1" ? "" : "s"}` } },
            failure: { label: "Dream visions", text: `${failure[2].replace(/^In addition to the creatures present, the target/, "Besides the creatures present, it")} ${after}`, sourceText: plain("Failure"), claimsRow: true, gmPlays: true, duration: { ...spellTime } },
            criticalFailure: { label: "Dream visions", text: `${failure[2].replace(/^In addition to the creatures present, the target/, "Besides the creatures present, it")} It gets no save to end the confusion early. ${after}`, sourceText: plain("Critical Failure"), claimsRow: true, gmPlays: true, duration: { ...spellTime } }
        },
        reminder: { kind: "spell-note", text: "On a success the caster can't Sustain the spell to extend it: it ends after its first round.", sourceText: `Success ${plain("Success")}` },
        sentences: [lead, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`)]
    };
}
