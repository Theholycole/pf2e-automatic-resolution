// A creature controlled until the end of the caster's turn (Temporary Possession): "You destroy the target thrall, using its destruction as a catalyst
// to temporarily possess an enemy. One living or undead target creature within 15 feet of the destroyed thrall must attempt a Will saving throw." with
// "Success The target is Controlled by you until the end of your turn, and you can have it take up to one action of your choice: Drop Prone, Interact,
// Release what it's holding, or Strike. The possessed creature's Strikes use and contribute toward your multiple attack penalty. At the end of your turn,
// the creature is no longer controlled and becomes Stunned 1. If the creature loses any Hit Points for any reason while it's possessed or stunned by this
// ability, you lose Hit Points equal to half that amount since your spirit partially lingers within its body." and "Failure As success, but you can
// spend up to 2 actions." (3 on a critical failure).
// Each row is a note on the creature until the end of the caster's turn: Controlled (the caster's players own its token), Stunned 1 when it ends, and
// half its lost Hit Points the caster's; the destroyed thrall is the controls card's.
import { htmlToPlainText } from "./description-parser.js";

const plain = html => htmlToPlainText(String(html ?? "")).replace(/\s+/g, " ").trim();
const C = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+)(?: (\d))?\}`;
const NUMBER = { one: 1, two: 2, three: 3 };
const INTRO = /^You destroy the target thrall, using its destruction as a catalyst to temporarily possess an enemy\. One (living or undead) target creature within (\d+) feet of the destroyed thrall must attempt an? (Fortitude|Reflex|Will) saving throw\.$/;
const SUCCESS = new RegExp(String.raw`^The target is ${C} by you until the end of your turn, and you can have it take up to (one|two|three|\d) actions? of your choice: ([A-Za-z ,']+)\. The possessed creature's Strikes use and contribute toward your multiple attack penalty\. At the end of your turn, the creature is no longer controlled and becomes ${C}\. If the creature loses any Hit Points for any reason while it's possessed or stunned by this ability, you lose Hit Points equal to half that amount since your spirit partially lingers within its body\.$`);
const MORE = /^As success, but you can spend up to (\d|two|three) actions\.$/;

/** {html, target, rows: {success, failure, criticalFailure}: note, thrall} or null. */
export function extractBriefControl(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [intro, table = ""] = html.split(/<hr\s*\/?>/i);
    const lead = INTRO.exec(plain(intro));
    if (!lead || lead[3].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = {};
    for (const [key, heading] of [["criticalSuccess", "Critical Success"], ["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]]) {
        const m = new RegExp(String.raw`<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>`).exec(table);
        if (!m) return null;
        rows[key] = plain(m[1]);
    }
    const success = SUCCESS.exec(rows.success), failure = MORE.exec(rows.failure), critical = MORE.exec(rows.criticalFailure);
    if (!/^The target is unaffected\.$/.test(rows.criticalSuccess) || !success || !failure || !critical) return null;
    const actions = word => NUMBER[word] ?? Number(word);
    const note = count => ({ label: `Possessed (${count} action${count === 1 ? "" : "s"})`,
        text: `Controlled by the caster until the end of the caster's turn: the caster can have it take up to ${count} action${count === 1 ? "" : "s"} (${success[5]}); its Strikes use and add to the caster's multiple attack penalty. Then it's no longer controlled and becomes ${success[7]}${success[8] ? ` ${success[8]}` : ""}. While it's possessed or stunned this way, the caster loses half the Hit Points it loses.`,
        sourceText: rows.success, minionControl: true, rules: [{ key: "GrantItem", uuid: success[1], flag: `condition${success[2]}`, onDeleteActions: { grantee: "restrict" } }],
        thenCondition: { uuid: success[6], slug: success[7].toLowerCase(), value: success[8] ? Number(success[8]) : null }, hpShare: { fraction: 0.5 },
        duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "source-turn", offset: 0, sourceText: "until the end of your turn" } });
    return {
        html: `<p>The target must attempt a ${lead[3]} saving throw.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> The target is unaffected.</p><p><strong>Critical Failure</strong> The target is unaffected.</p>`,
        target: `1 ${lead[1]} creature`, within: Number(lead[2]),
        rows: { success: note(actions(success[4])), failure: note(actions(failure[1])), criticalFailure: note(actions(critical[1])) },
        thrall: { text: `Destroy the target thrall: its token is removed. The possessed creature must be within ${lead[2]} feet of it.`, sourceText: plain(intro) }
    };
}
