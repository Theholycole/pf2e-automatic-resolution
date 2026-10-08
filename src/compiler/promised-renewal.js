// A dying creature or a corpse grown over (Promised Renewal): "If the target was a living creature with the dying condition, it must attempt a Fortitude save against your
// spell DC or it increases its dying condition by 2 (or by 3 if it critically failed). If the target was a corpse or a living creature that died from failing its
// Fortitude save, you immediately create an abundant growth of natural plant life in a 15-foot emanation of the target, including enveloping the target. The area
// becomes difficult terrain and minions with the fungus, plant, or wood traits gain fast healing 3 while within the emanation. This fast healing applies to effects you
// create with these traits as well if they have Hit Points, such as the Protector Tree spell." with "Heightened (+2) Increase the emanation by 5 feet and the fast
// healing by 2.": the dying creature's save card (Dying +2 on a failure, +3 on a critical failure); a corpse, or a creature the save kills, the centre of the growth
// for the spell's 4 rounds — difficult terrain, and fast healing for the minions of those traits inside (both grown by the Heightened entry); other creations with
// Hit Points the GM's note. (The inline roll grows the fast healing by 2 a rank; the Heightened entry by 2 every 2 ranks — the module follows the Heightened entry.)
import { htmlToPlainText } from "./description-parser.js";
import { ITEM_LINK_PLAIN as LINK, NARRATION_RULES } from "./text-patterns.js";

const SAVE = /^If the target was a living creature with the dying condition, it must attempt a (Fortitude|Reflex|Will) save against your spell DC or it increases its dying condition by (\d) \(or by (\d) if it critically failed\)\.$/;
const GROWTH = /^If the target was a corpse or a living creature that died from failing its \1 save, you immediately create an abundant growth of natural plant life in a @Template\[emanation\|distance:(\d+)\] of the target, including enveloping the target\.$/;
const TERRAIN = /^The area becomes difficult terrain and minions with the ([a-z]+), ([a-z]+), or ([a-z]+) traits gain fast healing \[\[\/r (\d+) \+ \d+ \* \(@item\.level - \d+\)\]\] while within the emanation\.$/;
const CREATIONS = /^This fast healing applies to effects you create with these traits as well if they have Hit Points, such as the @UUID\[[^\]]+\]\{([^}]+)\} spell\.$/;
const STEP = /^Heightened \(\+(\d)\) Increase the emanation by (\d+) feet and the fast healing by (\d+)\.$/;
const DYING = "@UUID[Compendium.pf2e.conditionitems.Item.yZRUzMqrMmfLu0V1]{Dying}";

/** {saveHTML, statistic, growth, sentences} or null. */
export function extractPromisedRenewal(item) {
    const rounds = /^(\d+) rounds?$/.exec(String(item?.system?.duration?.value ?? "").trim());
    if (!rounds || item.system?.duration?.sustained || item.system?.area?.value || Object.keys(item.system?.damage ?? {}).length) return null;
    const [body, heightened = "", ...rest] = String(item.system?.description?.value ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    // (Each sentence's links kept: the plain text drops them, so the sentences are matched on the paragraph itself, its tags stripped.)
    const raw = String(paragraphs[0] ?? "").replace(/<[^>]+>/g, "").split(/(?<=[.!?)])\s+(?=[A-Z@])/);
    const save = SAVE.exec(raw[1] ?? ""), growth = save ? new RegExp(GROWTH.source.replace("\\1", save[1])).exec(raw[2] ?? "") : null, terrain = TERRAIN.exec(raw[3] ?? ""), creations = CREATIONS.exec(raw[4] ?? "");
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 2 || raw.length !== 5 || NARRATION_RULES.test(raw[0]) || !save || !growth || !terrain || !creations || !step || !LINK.test(paragraphs[1])
        || !/(?:^|\b)1 corpse or living creature with the dying condition$/.test(String(item.system?.target?.value ?? "").trim())) return null;
    const interval = Number(step[1]);
    return {
        saveHTML: `<p>The target must attempt a ${save[1]} save.</p><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> The target's ${DYING} value increases by ${save[2]}.</p><p><strong>Critical Failure</strong> The target's ${DYING} value increases by ${save[3]}.</p>`,
        statistic: save[1].toLowerCase(),
        growth: { radius: Number(growth[1]), seconds: Number(rounds[1]) * 6, baseRank: Number(item.system?.level?.value ?? 1), interval, feet: Number(step[2]),
            fastHealing: { base: Number(terrain[4]), add: Number(step[3]) }, traits: [terrain[1], terrain[2], terrain[3]], difficult: true,
            notes: [`${raw[4].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")} (The GM gives it to such a creation in the area.)`], sourceText: [raw[2], raw[3]] },
        sentences: [raw[1], raw[2], raw[3], raw[4], htmlToPlainText(heightened).trim()]
    };
}

/** The growth at a rank: its radius and fast healing. */
export function renewalAt(growth, rank) {
    const steps = Math.max(0, Math.floor((Number(rank) - growth.baseRank) / growth.interval));
    return { radius: growth.radius + steps * growth.feet, fastHealing: growth.fastHealing.base + steps * growth.fastHealing.add };
}
