// An illusory hazard of dream colours (Mind's Eye Wink): "Area (4 contiguous 5-foot squares) All solid ground in the area is a brilliant burst of colors from the
// Dreamlands. Creatures in the area or that enter the area must make a Will save. A creature that fails its save is Stupefied 1 as long as they are in the area and
// for 1 round after they leave. On a critical failure, the creature is Stupefied 2 while in the area and stupefied 1 for 1 round after they leave the area." /
// "Target (1 object of Bulk 1 or less) …" / "A creature can attempt to disbelieve the effect as normal after using a Seek action. If it successfully disbelieves, it
// ignores the effect for the remaining duration.": the area branch a lingering save in the GM's drawn squares (each creature in it when cast or entering it); the
// failing rows' Stupefied while the creature is inside and for the round after it leaves (the critical failure's value 1 after it leaves); the disbelief the
// area's control (Perception against the spell DC). The object branch: the holder's save rolled on the card, its penalty to checks using the object an Effect
// behind a toggle (user decision 2026-10-01: objects roll on the card).
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const AREA = /^<strong>Area \((\d+) cont[a-z]*guous 5-foot squares\)<\/strong> ([\s\S]+)$/;
const TARGET = /^<strong>Target \((1 object of Bulk 1 or less)\)<\/strong> ([\s\S]+)$/;
const SAVE = /^Creatures in the area or that enter the area must make a (Fortitude|Reflex|Will) save\.$/;
const FAILURE = /^A creature that fails its save is @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+) (\d)\} as long as they are in the area and for (\d) rounds? after they leave\.$/;
const CRITICAL = /^On a critical failure, the creature is @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+) (\d)\} while in the area and ([a-z]+) (\d) for (\d) rounds? after they leave the area\.$/;
const DISBELIEVE = [/^A creature can attempt to disbelieve the effect as normal after using a \[\[\/act seek\]\] action\.$/, /^If it successfully disbelieves, it ignores the effect for the remaining duration\.$/];
const OBJECT = /^If you target an attended object or a creature picks up the unattended object, the creature that has the object must attempt a (Fortitude|Reflex|Will) save\.$/;
const OBJECT_PENALTY = /^On a failure, the wielder takes a [–-](\d) circumstance penalty to all checks that involve using the object; or a [–-](\d) circumstance on a critical failure\.$/;
const LINK = /^@UUID\[Compendium\.[A-Za-z0-9_.-]+\.Item\.[A-Za-z0-9]{16}\]\{[^}]+\}$/;

const split = text => text.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@\[])/);

/** {html, area, lingering, notes, sentences} or null. */
export function rewriteDreamHazard(item) {
    const system = item?.system ?? {};
    if (!system.defense?.save?.statistic || system.area?.value || String(system.target?.value ?? "").trim() || Object.keys(system.damage ?? {}).length) return null;
    if (!/^1 minute$/.test(String(system.duration?.value ?? "").trim())) return null;
    const statistic = system.defense.save.statistic, name = item.name;
    const html = String(system.description?.value ?? "");
    const lead = /^<p>([\s\S]*?)<\/p>\s*<ul>([\s\S]*)<\/ul>\s*$/.exec(html.trim());
    if (!lead || NARRATION_RULES.test(htmlToPlainText(lead[1]))) return null;
    const items = [...lead[2].matchAll(/<li>\s*<p>([\s\S]*?)<\/p>\s*<\/li>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const area = AREA.exec(items[0] ?? ""), target = TARGET.exec(items[1] ?? "");
    if (items.length !== 2 || !area || !target) return null;
    const areaSentences = split(area[2]), targetSentences = split(target[2]);
    const save = SAVE.exec(areaSentences[1] ?? ""), failure = FAILURE.exec(areaSentences[2] ?? ""), critical = CRITICAL.exec(areaSentences[3] ?? "");
    const link = targetSentences.at(-1) ?? "";
    if (areaSentences.length !== 4 || NARRATION_RULES.test(areaSentences[0]) || !save || !failure || !critical || save[1].toLowerCase() !== statistic
        || failure[1] !== critical[1] || critical[4].toLowerCase() !== failure[2].toLowerCase() || failure[4] !== critical[6] || !LINK.test(link)
        || !DISBELIEVE[0].test(targetSentences.at(-3) ?? "") || !DISBELIEVE[1].test(targetSentences.at(-2) ?? "")
        || targetSentences.length !== 6 || !OBJECT.test(targetSentences[1]) || !OBJECT_PENALTY.test(targetSentences[2])) return null;
    const slug = failure[2].toLowerCase(), after = Number(failure[4]);
    const inArea = { mode: "unlimited", sourceText: "as long as they are in the area" };
    const grant = value => ({ key: "GrantItem", uuid: failure[1], flag: `condition${failure[2]}`, onDeleteActions: { grantee: "restrict" }, alterations: [{ mode: "override", property: "badge-value", value }] });
    const objectText = targetSentences.slice(0, -3).map(sentence => htmlToPlainText(sentence)).join(" ");
    return {
        html: `<p>Each creature that's in the area when you Cast the Spell or that enters the area must attempt a ${save[1]} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p><p><strong>Failure</strong> The creature is unaffected.</p><p><strong>Critical Failure</strong> The creature is unaffected.</p>`,
        area: { type: "square", value: 10 },
        lingering: { drawnArea: `${area[1]} contiguous 5-foot squares`,
            disbelief: { statistic: "perception", key: `${item.system?.slug ?? "dream-hazard"}-disbelieved`, label: "Seeks and tries to disbelieve the illusion", sourceText: `${htmlToPlainText(targetSentences.at(-3))} ${targetSentences.at(-2)}` } },
        notes: {
            failure: { label: name, text: `${failure[2]} ${failure[3]} while it's in the area and ${after} round after it leaves.`, sourceText: htmlToPlainText(areaSentences[2]), claimsRow: true,
                duration: inArea, whileInArea: true, afterLeaveRounds: after, rules: [grant(Number(failure[3]))] },
            criticalFailure: { label: name, text: `${critical[2]} ${critical[3]} while it's in the area, and ${critical[4]} ${critical[5]} for ${after} round after it leaves.`, sourceText: htmlToPlainText(areaSentences[3]), claimsRow: true,
                duration: inArea, whileInArea: true, afterLeaveRounds: after, afterLeaveRules: [grant(Number(critical[5]))], rules: [grant(Number(critical[3]))] }
        },
        object: { what: target[1], statistic: OBJECT.exec(targetSentences[1] ?? "")?.[1]?.toLowerCase() ?? null, penalty: OBJECT_PENALTY.exec(targetSentences[2] ?? "") ? { failure: Number(OBJECT_PENALTY.exec(targetSentences[2])[1]), criticalFailure: Number(OBJECT_PENALTY.exec(targetSentences[2])[2]) } : null,
            text: objectText },
        sentences: [htmlToPlainText(area[2]).trim(), htmlToPlainText(target[2]).trim()]
    };
}
