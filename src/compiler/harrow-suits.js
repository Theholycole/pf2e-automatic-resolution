// A drawn card's boon or bane on a failed Will save (Invoke the Harrow): "… When you draw a card, you can choose to impart a boon or bane associated with the
// card's suit. The target must attempt a Will save. On a failure, they receive the effects of the chosen boon or bane. If you target an ally with this spell,
// they can choose to willingly accept the effects without attempting a saving throw. The target can attempt to remove the card's influence by using an
// action, which has the concentrate trait, to attempt the saving throw again; on a success, the effect ends." with the six suits (Hammers: +2 status to
// damage rolls / Enfeebled 1; Keys: +1 status to AC / Clumsy 1; Shields: temporary Hit Points twice the rank / Drained 1; Books: +1 status to skill checks /
// Stupefied 1; Stars: +1 status to saves / Confused; Crowns: roll twice, higher, on one check / roll twice, lower, on one check of your choosing) and
// "Heightened (6th) The duration is 1 minute. The target must succeed a total of two saving throws to end the effect. The value of boons and banes doubles.
// The Crowns suit affects a total of three checks during the duration."
// The caster picks the suit and boon or bane on the card (the draw is the caster's: a note); a failed save gives the target the module's Effect with it for
// the duration, its control the target's save again (an action; a success ends it — two at 6th); from 6th the doubled values and a minute.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK as C } from "./text-patterns.js";

const LEAD = [/^You draw a card from the harrow, either one from a deck you have in hand or magically produce one as part of the spell\.$/,
    /^You use the power of the card's suit to influence a creature around you\.$/,
    /^When you draw a card, you can choose to impart a boon or bane associated with the card's suit\.$/,
    /^The target must attempt a (Will) save\.$/,
    /^On a failure, they receive the effects of the chosen boon or bane\.$/,
    /^If you target an ally with this spell, they can choose to willingly accept the effects without attempting a saving throw\.$/,
    /^The target can attempt to remove the card's influence by using an action, which has the concentrate trait, to attempt the saving throw again; on a success, the effect ends\.$/,
    /^To determine the card, draw a card from a harrow deck\.$/,
    /^If you don't have a harrow deck available, you can roll 1d6 to randomly determine the suit you draw\.$/];
const SUITS = [
    ["hammers", new RegExp(String.raw`^1\. Hammers \(Str\) Boon: The target gains a \+(\d) status bonus to damage rolls; Bane: The target is ${C}\.$`), "damage"],
    ["keys", new RegExp(String.raw`^2\. Keys \(Dex\) Boon: The target gains a \+(\d) status bonus to AC; Bane: The target is ${C}\.$`), "ac"],
    ["shields", new RegExp(String.raw`^3\. Shields \(Con\) Boon: The target gains temporary Hit Points equal to twice the spell's rank; Bane: The target is ${C}\.$`), "temp-hp"],
    ["books", new RegExp(String.raw`^4\. Books \(Int\) Boon: The target gains a \+(\d) status bonus to skill checks; Bane: The target is ${C}\.$`), "skill-check"],
    ["stars", new RegExp(String.raw`^5\. Stars \(Wis\) Boon: The target gains a \+(\d) status bonus to saving throws; Bane: The target is ${C}\.$`), "saving-throw"],
    ["crowns", /^6\. Crowns \(Cha\) Boon: The target can roll twice and take the higher result on a single check during the duration\. This is a fortune effect; Bane: The target must roll twice and take the lower result on a single check of your choosing during the duration\. This is a misfortune effect\.$/, "crowns"]];
const STEP = /^Heightened \((\d)th\) The duration is (\d+) minutes?\. The target must succeed a total of two saving throws to end the effect\. The value of boons and banes doubles\. The Crowns suit affects a total of three checks during the duration\.$/;
const title = text => text[0].toUpperCase() + text.slice(1);

function options(paragraphs, double, rank) {
    const out = {};
    for (const [key, pattern, kind] of SUITS) {
        const text = paragraphs.find(paragraph => pattern.test(paragraph));
        if (!text) return null;
        const match = pattern.exec(text);
        const factor = double ? 2 : 1;
        const bonus = kind === "temp-hp" || kind === "crowns" ? null : Number(match[1]) * factor;
        const condition = kind === "crowns" ? null : { uuid: match[kind === "temp-hp" ? 1 : 2], name: match[kind === "temp-hp" ? 2 : 3], value: Number(match[kind === "temp-hp" ? 3 : 4] ?? 0) * factor || null };
        const boonRules = kind === "damage" || kind === "ac" || kind === "skill-check" || kind === "saving-throw" ? [{ key: "FlatModifier", selector: kind, type: "status", value: bonus }]
            : kind === "temp-hp" ? [{ key: "TempHP", value: `${2 * factor}*@item.level` }]
            : [{ key: "RollTwice", selector: "check", keep: "higher", removeAfterRoll: true }];
        const baneRules = kind === "crowns" ? [{ key: "RollOption", domain: "all", option: "harrow-crowns-bane", toggleable: true, label: "The caster's chosen check (roll twice, take the lower)", value: false },
                { key: "RollTwice", selector: "check", keep: "lower", removeAfterRoll: true, predicate: ["harrow-crowns-bane"] }]
            : [{ key: "GrantItem", uuid: condition.uuid, flag: `condition${condition.name}`, allowDuplicate: true, onDeleteActions: { granter: "cascade", grantee: "cascade" },
                ...(condition.value ? { alterations: [{ mode: "override", property: "badge-value", value: condition.value }] } : {}) }];
        out[`${key} boon`] = { label: `${title(key)}: boon`, text: kind === "crowns" ? `It can roll twice and take the higher result on a single check${double ? " (three times)" : ""}. Fortune.` : kind === "temp-hp" ? `Temporary Hit Points equal to ${2 * factor} × the spell's rank.` : `+${bonus} status bonus to ${kind === "ac" ? "AC" : kind.replace("-", " ")}${kind === "damage" ? " rolls" : kind === "skill-check" ? "s" : "s"}.`, rules: boonRules, crowns: kind === "crowns" ? (double ? 3 : 1) : null, sourceText: text };
        out[`${key} bane`] = { label: `${title(key)}: bane`, text: kind === "crowns" ? `It must roll twice and take the lower result on a single check of the caster's choosing${double ? " (three checks)" : ""} — switch the toggle on for that check. Misfortune.` : `${condition.name}${condition.value ? ` ${condition.value}` : ""}.`, rules: baneRules, crowns: kind === "crowns" ? (double ? 3 : 1) : null, sourceText: text };
    }
    return out;
}

/** {html, casterChoice, notes: {base, heightened}, minRank, reminder, sentences} or null. */
export function extractHarrowSuits(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || !/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim()) || (adapted.damageComponents ?? []).length) return null;
    const rounds = /^(\d+) rounds?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    const leadText = paragraphs.filter(paragraph => !/^\d\. /.test(paragraph));
    const lead = leadText.flatMap(paragraph => paragraph.split(/(?<=[.!?])\s+(?=[A-Z@])/));
    const step = STEP.exec(htmlToPlainText(rest.join(" ")).replace(/\s+/g, " ").trim());
    if (!rounds || !step || lead.length !== LEAD.length || LEAD.some((pattern, index) => !pattern.test(lead[index])) || LEAD[3].exec(lead[3])[1].toLowerCase() !== adapted.defense.statistic) return null;
    const suitParagraphs = paragraphs.filter(paragraph => /^\d\. /.test(paragraph));
    const base = options(suitParagraphs, false), high = options(suitParagraphs, true);
    if (!base || !high || suitParagraphs.length !== 6) return null;
    const keys = Object.keys(base);
    const note = (option, entry, duration, successes) => ({ label: `Harrow: ${entry.label}`, text: `${entry.text} It can use an action (concentrate) to attempt its Will save again: the control${successes > 1 ? `; ${successes} successes end it` : "; a success ends it"}.`,
        sourceText: entry.sourceText, rules: entry.rules, choiceGroup: "caster-option", option, endSave: { statistic: "will", label: "uses an action (concentrate) to shake it off", oncePerRound: false, ...(successes > 1 ? { successes } : {}) },
        duration });
    const short = { mode: "fixed", value: Number(rounds[1]), unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: adapted.lifecycle.duration };
    const long = { mode: "fixed", value: Number(step[2]), unit: "minutes", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: `${step[2]} minute` };
    return {
        html: `<p>The target must attempt a Will save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p><p><strong>Failure</strong> The target is unaffected.</p><p><strong>Critical Failure</strong> The target is unaffected.</p>`,
        casterChoice: { kind: "option", values: keys, labels: Object.fromEntries(keys.map(key => [key, base[key].label])), label: "Suit: boon or bane", rows: ["failure", "criticalFailure"] },
        notes: { base: keys.map(key => note(key, base[key], short, 1)), heightened: keys.map(key => note(key, high[key], long, 2)) },
        minRank: Number(step[1]),
        reminder: "Draw a card from a harrow deck (or roll 1d6: 1 Hammers, 2 Keys, 3 Shields, 4 Books, 5 Stars, 6 Crowns) and pick its boon or bane on the card. An ally can willingly accept it without the save (record its result as a failure).",
        sentences: [...lead, ...suitParagraphs, step[0]]
    };
}
