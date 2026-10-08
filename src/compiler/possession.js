// A possession save (Possession): "The target must attempt a Will save. If you want to exert less control over the target, you can choose to use the
// effects of any degree of success more favorable to the target. While you're possessing a target, your own body is Unconscious and can't wake up
// normally. You can sense everything the possessed target does. You can Dismiss this spell. If the possessed body dies, the spell ends and you must
// succeed at a Fortitude save against your spell DC or be Paralyzed for 1 hour, or 24 hours on a critical failure. If the spell ends during an encounter,
// you act just before the possessed creature's initiative." with rows: possessed without control; partial control ("At the start of each of the
// target's turns, it attempts another Will save. If it fails, it's Controlled by you on that turn; if it succeeds, it chooses its own actions; and if it
// critically succeeds, it forces you out and the spell ends."); full control ("The target is controlled by you.").
// Each possessed creature holds a note for the spell's time (the partial control's start-of-turn save; the full control's Controlled and the caster's
// ownership of its token); the caster's body is Unconscious while that note lasts; the body's death is the controls card's Fortitude save.
import { CONDITION_LINK_UNVALUED as C, plainOrEmpty as plain } from "./text-patterns.js";

const INTRO = [
    [/^You send your mind and soul into the target's body, attempting to take control\.$/, "narration"],
    [/^The target must attempt an? (Fortitude|Reflex|Will) save\.$/, "lead"],
    [/^If you want to exert less control over the target, you can choose to use the effects of any degree of success more favorable to the target\.$/, "favorable"],
    [new RegExp(String.raw`^While you're possessing a target, your own body is ${C} and can't wake up normally\.$`), "body"],
    [/^You can sense everything the possessed target does\.$/, "senses"],
    [/^You can Dismiss this spell\.$/, "dismiss"],
    [new RegExp(String.raw`^If the possessed body dies, the spell ends and you must succeed at an? (Fortitude|Reflex|Will) save against your spell DC or be ${C} for (\d+) (hour|minute)s?, or (\d+) (hour|minute)s? on a critical failure\.$`), "death"],
    [/^If the spell ends during an encounter, you act just before the possessed creature's initiative\.$/, "initiative"]
];
const SUCCESS = /^You possess the target but can't control it\. You ride along in the body while the spell lasts\.$/;
const FAILURE = new RegExp(String.raw`^You possess the target and take partial control of it\. You no longer have a separate turn; instead, you might control the target\. At the start of each of the target's turns, it attempts another (Fortitude|Reflex|Will) save\. If it fails, it's ${C} by you on that turn; if it succeeds, it chooses its own actions; and if it critically succeeds, it forces you out and the spell ends\.$`);
const CRITICAL = new RegExp(String.raw`^You possess the target fully, and it can only watch as you manipulate it like a puppet\. The target is (?:controlled|${C}) by you\.$`);

/** {html, notes: {success, failure, criticalFailure}, body, death, reminders, sentences} or null. */
export function extractPossession(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [intro, table = ""] = html.split(/<hr\s*\/?>/i);
    const rows = {};
    for (const [key, heading] of [["criticalSuccess", "Critical Success"], ["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]]) {
        const m = new RegExp(String.raw`<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>`).exec(table);
        if (!m) return null;
        rows[key] = plain(m[1]);
    }
    const found = {};
    for (const sentence of plain(intro).split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean)) {
        const hit = INTRO.find(([pattern]) => pattern.test(sentence));
        if (!hit || found[hit[1]]) return null;
        found[hit[1]] = { sentence, m: hit[0].exec(sentence) };
    }
    if (INTRO.some(([, key]) => !found[key])) return null;
    const statistic = found.lead.m[1].toLowerCase();
    const failure = FAILURE.exec(rows.failure), critical = CRITICAL.exec(rows.criticalFailure);
    if (!/^The target is unaffected\.$/.test(rows.criticalSuccess) || !SUCCESS.test(rows.success) || !failure || !critical || failure[1].toLowerCase() !== statistic) return null;
    const controlled = { uuid: failure[2], slug: failure[3].toLowerCase(), name: failure[3] };
    if (critical[1] && critical[1] !== controlled.uuid) return null;
    const death = found.death.m;
    return {
        // (Only the lead before the rows: the other sentences are the notes, the caster's condition, the controls and the reminders.)
        html: `<p>${found.lead.sentence}</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> The target is unaffected.</p><p><strong>Critical Failure</strong> The target is @UUID[${controlled.uuid}]{${controlled.name}}.</p>`,
        controlled,
        notes: {
            success: { label: "Possessed (riding along)", text: "The caster's mind rides along in this body without controlling it, sensing everything it does." },
            failure: { label: "Possessed (partial control)", text: `The caster's mind holds partial control. At the start of each of its turns it attempts a ${found.lead.m[1]} save: on a failure it's ${controlled.name} by the caster that turn (the module gives the caster's players its token for the turn), on a success it acts on its own, and on a critical success it forces the caster out and the spell ends.`,
                recurringSave: { timing: "turn-start", mode: "turn-condition", statistic, condition: { slug: controlled.slug, value: null, uuid: controlled.uuid }, endOnCriticalSuccess: true } },
            criticalFailure: { label: "Possessed (full control)", text: `The caster's mind fully controls this body: it's ${controlled.name}, and the caster's players own its token while the spell lasts.`, minionControl: true }
        },
        body: { uuid: found.body.m[1], slug: found.body.m[2].toLowerCase(), text: `${found.body.sentence} ${found.senses.sentence} ${found.dismiss.sentence}`, sourceText: found.body.sentence },
        death: { statistic: death[1].toLowerCase(), uuid: death[2], name: death[3], failure: { value: Number(death[4]), unit: death[5] }, criticalFailure: { value: Number(death[6]), unit: death[7] }, sourceText: found.death.sentence },
        reminders: [found.favorable.sentence, found.initiative.sentence],
        sentences: Object.values(found).map(entry => entry.sentence)
    };
}
