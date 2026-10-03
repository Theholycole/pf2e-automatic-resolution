// Little spirits giving one kind of aid a round, chosen when cast and on each Sustain (Helpful Wood Spirits):
//   "Choose the kind of aid your wood spirits supply from the list below when you Cast the Spell." / "The first time each round you Sustain the
//   spell, you can move the area occupied by the apparitions up to 10 feet and you can choose the kind of aid they provide this round." with the
//   list Chores (a minor manual task, objects of 2 Bulk or less), Distract ("Creatures in the area are Off-Guard unless they succeed at a Reflex
//   save."), Obstacle ("The area they occupy is difficult terrain.") and Search (they Seek in the area "using your Perception check as their own").
// The GM places the burst: a sustained lingering area. On the cast (and each Sustain's card) the caster picks the aid: Chores is the GM's;
// Distract rolls the caster's foes' saves in the area (Off-Guard while inside, until the next aid); Obstacle makes the area difficult terrain
// until the next aid; Search rolls the caster's Perception to Seek (the GM tells what's found). Moving the area is the GM's (move the region).
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i;
const CHOOSE = /^Choose the kind of aid your [a-z ]+ supply from the list below when you Cast the Spell\.$/;
const SUSTAIN = /^The first time each round you Sustain the spell, you can move the area occupied by the apparitions up to (\d+) feet and you can choose the kind of aid they provide this round\.$/;
const ITEMS = {
    Chores: /^The [a-z ]+ perform a minor manual task of your choice, such as cleaning, opening a door, picking up an unattended object, or carrying an object from one location to another\. The spirits can't pick up or carry an object of greater than (\d+) Bulk\.$/,
    Distract: /^The [a-z ]+ distract your foes, clambering all over their feet and bodies and being a nuisance\. Creatures in the area are (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Off-Guard\}) unless they succeed at an? (Fortitude|Reflex|Will) save\.$/,
    Obstacle: /^The [a-z ]+ fill the area as a chaotic, bouncing mass\. The area they occupy is difficult terrain\.$/,
    Search: /^The [a-z ]+ (?:@UUID\[[^\]]+\]\{Seek\}|Seek) in the area they occupy, using your Perception check as their own\. You learn anything they do from Seeking in this way\.$/
};

/** Returns {spiritAid, claimed} or null. */
export function compileSpiritAid(adapted) {
    const area = adapted.targeting?.area;
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || area?.type !== "burst" || adapted.lifecycle?.sustained !== true) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const html = String(adapted.descriptionHTML ?? "");
    const list = /<ul>([\s\S]*?)<\/ul>\s*$/i.exec(html);
    if (!minutes || !list || /<hr/i.test(html)) return null;
    const paragraphs = [...html.slice(0, list.index).matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(`<p>${match[1]}</p>`).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 2) return null;
    const second = paragraphs[1].split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim());
    if (second.length !== 2 || !CHOOSE.test(second[0]) || !SUSTAIN.exec(second[1])) return null;
    // (The first paragraph is what the spirits are: no rule beyond "a simple task each round" and that they can't be harmed.)
    const first = paragraphs[0].split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim());
    const known = [/^These spirits are a magical echo of the true spirits that live on the Plane of Wood and can't be attacked, damaged, or otherwise interfered with\.$/, /^They perform a simple task each round\.$/];
    if (first.some(sentence => NARRATION_RULES.test(sentence) && !known.some(pattern => pattern.test(sentence)))) return null;
    const aids = {};
    for (const item of [...list[1].matchAll(/<li>\s*<strong>([^<]+)<\/strong>([\s\S]*?)<\/li>/gi)]) {
        const name = item[1].trim(), text = htmlToPlainText(item[2]).replace(/\s+/g, " ").trim();
        const found = ITEMS[name]?.exec(text);
        if (!found || aids[name]) return null;
        aids[name] = { text, ...(name === "Distract" ? { condition: /@UUID\[([^\]]+)\]/.exec(found[1])[1], statistic: found[2].toLowerCase(), foes: true } : {}) };
    }
    if (Object.keys(aids).length !== Object.keys(ITEMS).length) return null;
    return {
        spiritAid: { area: { type: "burst", value: Number(area.value) }, durationSeconds: Number(minutes[1]) * 60, moveFeet: Number(SUSTAIN.exec(second[1])[1]), aids },
        claimed: [...first, ...second, ...Object.values(aids).map(aid => aid.text)]
    };
}
