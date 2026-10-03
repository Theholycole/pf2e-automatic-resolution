// Visions swapped with the target (Shared Nightmare): "Merging minds with the target, you swap distressing visions. One of you will become
// @UUID[…]{Confused}, based on the target's Will save." with rows "You are Confused for 1 round." / "At the start of your next turn, you spend your
// first action with the Confused condition, then act normally." / "The target spends the first action of each of its turns Confused. The duration is
// 1 minute." / "The target is Confused. The duration is 1 minute.": the caster's Confused for its round; the caster's first confused action a card
// reminder (PF2e has no one-action Confused); the failure's first actions a note for its minute; the critical failure's Confused for its minute.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = /^Merging minds with the target, you swap distressing visions\. One of you will become (@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+)\}), based on the target's (Fortitude|Reflex|Will) save\.$/;

/** {html, caster, notes, reminder, sentences} or null. */
export function rewriteNightmareSwap(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    if (!lead) return null;
    const name = lead[3];
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const plain = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const critical = new RegExp(`^You are ${name} for (\\d+) rounds?\\.$`).exec(plain("Critical Success"));
    const success = new RegExp(`^At the start of your next turn, you spend your first action with the ${name} condition, then act normally\\.$`).test(plain("Success"));
    const failure = new RegExp(`^The target spends the first action of each of its turns ${name}\\. The duration is (\\d+) (minute|hour)s?\\.$`).exec(plain("Failure"));
    const worst = new RegExp(`^The target is ${name}\\. The duration is (\\d+) (minute|hour)s?\\.$`).exec(plain("Critical Failure"));
    if (lead[4].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || !critical || !success || !failure || !worst) return null;
    const casterText = `You are ${lead[1]} for ${critical[1]} round${critical[1] === "1" ? "" : "s"}.`;
    return {
        html: `<p>The target must attempt a ${lead[4]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> The target is unaffected.</p><p><strong>Critical Failure</strong> The target is ${lead[1]} for ${worst[1]} ${worst[2]}${worst[1] === "1" ? "" : "s"}.</p>`,
        caster: { slug: name.toLowerCase(), value: null, uuid: lead[2], duration: { value: Number(critical[1]), unit: "rounds", expiry: "turn-start" }, sourceText: casterText },
        failureNote: { label: "Shared nightmare", text: `The creature spends the first action of each of its turns ${name} (the GM plays it; PF2e's ${name} covers whole turns).`, sourceText: plain("Failure"), claimsRow: true, gmPlays: true,
            duration: { mode: "fixed", value: Number(failure[1]), unit: `${failure[2]}s`, expiry: null, anchor: "effect-start", offset: 0, sourceText: `${failure[1]} ${failure[2]}${failure[1] === "1" ? "" : "s"}` } },
        reminder: { kind: "spell-note", text: `On a success, the caster spends their first action at the start of their next turn ${name}, then acts normally (the GM plays it).`, sourceText: `Success ${plain("Success")}` },
        sentences: [lead[0], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`)]
    };
}
