// A stone holding a pool of healing for one creature (Soulshelter Vessel): "You create a pool of healing within the object, which starts out with 40 HP worth of
// healing per Bulk of the object. … When you Cast the Spell, the targeted creature regains 10 HP, which come out of the object's pool. You can also spend a single
// action … to repeat this transfer. When the pool is empty, the object becomes broken. The spell ends if the object becomes broken or the targets are no longer within
// 500 feet of each other." / "If the target creature would be reduced to 0 Hit Points, the creature regains either 20 HP or the amount left in the object's pool,
// whichever is lower. The object immediately becomes broken, ending the spell." with "Heightened (+2) Increase the maximum Bulk of the item by 1 …, the amount of HP
// exchanged each time the stone is used by 5, and the amount of HP exchanged when the creature would be reduced to 0 HP by 10 …" — the creature's Effect holding the
// pool (the stone's Bulk the caster's, at most the rank's); the cast's transfer; the card's transfer action; at 0 HP the rescue, then the spell ends; the distance
// the GM's.
import { htmlToPlainText } from "./description-parser.js";

const RULES = {
    pool: /^You create a pool of healing within the object, which starts out with (\d+) HP worth of healing per Bulk of the object\. \(These HP can only be used by the creature, and don't increase the object's HP\.\)$/,
    cast: /^When you Cast the Spell, the targeted creature regains (\d+) HP, which come out of the object's pool\.$/,
    repeat: /^You can also spend a single action-which has the ([a-z, ]+) traits-to repeat this transfer\.$/,
    empty: /^When the pool is empty, the object becomes broken\.$/,
    ends: /^The spell ends if the object becomes broken or the targets are no longer within (\d+) feet of each other\.$/,
    rescue: /^If the target creature would be reduced to 0 Hit Points, the creature regains either (\d+) HP or the amount left in the object's pool, whichever is lower\.$/,
    broken: /^The object immediately becomes broken, ending the spell\.$/
};
const STEP = /^Heightened \(\+(\d)\) Increase the maximum Bulk of the item by (\d+) \(potentially increasing the size of the healing pool\), the amount of HP exchanged each time the stone is used by (\d+), and the amount of HP exchanged when the creature would be reduced to 0 HP by (\d+) \(or by the amount left in the pool, if it's lower\)\.$/;

/** {soulVessel, claimed} or null. */
export function compileSoulVessel(adapted) {
    const target = /^1 willing creature and 1 non-magical stone object of (\d+) or (\d+) Bulk$/i.exec(String(adapted.targeting?.target ?? "").trim());
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || !target) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!minutes || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?)])\s+(?=[A-Z])/).filter(Boolean);
    const claimed = {};
    for (const [index, sentence] of sentences.entries()) {
        const key = Object.keys(RULES).find(name => !claimed[name] && RULES[name].test(sentence));
        if (key) { claimed[key] = RULES[key].exec(sentence); continue; }
        if (index === 0 && !/\d|@|\b(?:damage|save|bonus|penalty)\b/.test(sentence)) continue;
        return null;
    }
    const stepText = htmlToPlainText(heightened).replace(/\s+/g, " ").trim();
    const step = STEP.exec(stepText);
    if (Object.keys(claimed).length !== Object.keys(RULES).length || !step) return null;
    return { soulVessel: { seconds: Number(minutes[1]) * 60, bulk: { min: Number(target[1]), max: Number(target[2]) }, perBulk: Number(claimed.pool[1]), transfer: Number(claimed.cast[1]),
            rescue: Number(claimed.rescue[1]), distance: Number(claimed.ends[1]), actionTraits: claimed.repeat[1].split(/, (?:and )?/),
            step: { interval: Number(step[1]), bulk: Number(step[2]), transfer: Number(step[3]), rescue: Number(step[4]) } },
        claimed: [...sentences, stepText] };
}

/** The most Bulk, the transfer and the rescue at a cast rank. */
export function soulVesselAt(data, castRank, baseRank) {
    const steps = Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.step.interval));
    return { maxBulk: data.bulk.max + steps * data.step.bulk, transfer: data.transfer + steps * data.step.transfer, rescue: data.rescue + steps * data.step.rescue };
}
