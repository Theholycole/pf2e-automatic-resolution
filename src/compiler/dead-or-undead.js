// A spell for dead creatures or undead ones (Song of the Fallen): "If you target dead creatures, the bodies animate and can continue acting as if they
// were alive. A creature animated in this way has 60 temporary Hit Points. The animated creatures are Slowed 1 but can otherwise act normally. Creatures
// animated with this spell die again once the spell ends. If you target undead creatures, each undead must attempt a basic Will save." with rows
// "Critical Success The undead takes 5d6 vitality damage. … Critical Failure The undead is destroyed."
// The card holds the two, one used up by the other: the dead ones' Effect (the temporary Hit Points, Slowed, death when it ends), and the undead's save.
import { CONDITION_LINK as C, plainOrEmpty as plain } from "./text-patterns.js";

const TARGET = /^up to (\d+) dead creatures or up to \1 undead creatures$/i;
const OPENING = /^You [a-z]+ an? [a-z ,]+ that either rouses the dead to action or reminds undead that they should lay to rest\.$/;
const DEAD = /^If you target dead creatures, the bodies animate and can continue acting as if they were alive\.$/;
const TEMP = /^A creature animated in this way has (\d+) temporary Hit Points\.$/;
const SLOWED = new RegExp(String.raw`^The animated creatures are (?:${C}|(slowed) (\d)) but can otherwise act normally\.$`);
const DIES = /^Creatures animated with this spell die again once the spell ends\.$/;
const UNDEAD = /^If you target undead creatures, each undead must attempt an? (?:basic )?(Fortitude|Reflex|Will) save\.$/;
const ROW = /^The undead (?:takes (@Damage\[[^\]]*\]\]) damage(?: and is (?:slowed|@UUID\[[^\]]+\]\{Slowed\}) (\d) for (\d+) (round|minute)s?)?|is destroyed)\.$/;

/** {statistic, count, dead: {temp, slowed, text, sourceText}, rowsHtml, sentences} or null. */
export function extractDeadOrUndead(adapted) {
    const target = TARGET.exec(String(adapted.targeting?.target ?? "").trim());
    if (!target) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [intro, table = ""] = html.split(/<hr\s*\/?>/i);
    const sentences = plain(intro).split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (sentences.length !== 6 || !OPENING.test(sentences[0]) || !DEAD.test(sentences[1]) || !DIES.test(sentences[4])) return null;
    const temp = TEMP.exec(sentences[2]), slowed = SLOWED.exec(sentences[3]), undead = UNDEAD.exec(sentences[5]);
    if (!temp || !slowed || !undead) return null;
    const rows = {};
    for (const [key, heading] of [["criticalSuccess", "Critical Success"], ["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]]) {
        const m = new RegExp(String.raw`<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>`).exec(table);
        const row = m ? ROW.exec(plain(m[1])) : null;
        if (!row) return null;
        rows[key] = row[0].includes("destroyed") ? "The target dies."
            : `The target takes ${row[1]} damage${row[2] ? ` and is @UUID[Compendium.pf2e.conditionitems.Item.xYTAsEpcJE1Ccni3]{Slowed ${row[2]}} for ${row[3]} ${row[4]}${row[3] === "1" ? "" : "s"}` : ""}.`;
    }
    const slowUuid = slowed[1] ?? "Compendium.pf2e.conditionitems.Item.xYTAsEpcJE1Ccni3";
    return {
        statistic: undead[1].toLowerCase(), count: Number(target[1]),
        dead: { temp: Number(temp[1]), slowed: { uuid: slowUuid, slug: "slowed", value: Number(slowed[3] ?? slowed[5]) },
            text: `Animated: it acts as if alive, with ${temp[1]} temporary Hit Points, Slowed ${slowed[3] ?? slowed[5]}. It dies again when the spell ends (when it's no longer Sustained, or after its maximum time).`,
            sourceText: sentences.slice(1, 5).join(" ") },
        rowsHtml: `<p>The target must attempt a ${undead[1]} save.</p><hr />` + Object.entries(rows).map(([key, text]) => `<p><strong>${{ criticalSuccess: "Critical Success", success: "Success", failure: "Failure", criticalFailure: "Critical Failure" }[key]}</strong> ${text}</p>`).join(""),
        undeadSource: sentences[5], sentences
    };
}
