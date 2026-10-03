// A cloud that poisons whoever enters it or starts a turn in it and later detonates at a flame (Flammable Fumes): "… A creature that enters the cloud or is within
// the cloud at the start of its turn takes 2d6 poison damage. A creature can take the poison damage from flammable fumes only once per round." / "One round after
// you conjure the cloud, the gases loses stability and become flammable. If an open flame is brought into the cloud, or if anyone within the area uses a fire
// effect, the cloud detonates in a massive blaze that deals @Damage[10d6[fire]] damage to all creatures within it with a @Check[reflex|basic] save, and the spell
// ends." with "Heightened (+2) The poison damage increases by 1d6 and the fire damage on an explosion increases by 2d6." — the placed cloud deals its poison
// itself (once per round per creature); from a round after the cast, the GM's detonation control: every creature in the cloud's basic save of the blaze at the
// cast rank (a compiled plan), then the spell ends. Its invisibility is a note.
import { htmlToPlainText } from "./description-parser.js";

const RULES = {
    hidden: /^The gases are invisible, requiring a successful Perception check against your spell DC to detect visually, though their acrid smell and toxic effects are clear once a creature has entered the cloud\.$/,
    hazard: /^A creature that enters the cloud or is within the cloud at the start of its turn takes (\d+)d(\d+) ([a-z]+) damage\.$/,
    once: /^A creature can take the ([a-z]+) damage from [a-z ]+ only once per round\.$/,
    delay: /^One round after you conjure the cloud, the gases loses? stability and become flammable\.$/,
    blast: /^If an open flame is brought into the cloud, or if anyone within the area uses a fire effect, the cloud detonates in a massive blaze that deals @Damage\[(\d+)d(\d+)\[([a-z]+)\]\] damage to all creatures within it with a @Check\[(reflex|fortitude|will)\|basic\] save, and the spell ends\.$/
};
const STEP = /^Heightened \(\+(\d)\) The ([a-z]+) damage increases by (\d+)d(\d+) and the ([a-z]+) damage on an explosion increases by (\d+)d(\d+)\.$/;

/** {fumeCloud, claimed} or null. */
export function compileFumeCloud(adapted) {
    const area = adapted.targeting?.area;
    if ((adapted.defense?.kind ?? "none") !== "none" || String(adapted.targeting?.target ?? "").trim() || !["burst", "cylinder"].includes(area?.type) || !(Number(area.value) > 0)) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!minutes || rest.length) return null;
    const plain = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    const raw = body.replace(/<[^@>]*>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (plain.length !== raw.length) return null;
    const claimed = {};
    for (const [index, sentence] of raw.entries()) {
        const key = Object.keys(RULES).find(name => !claimed[name] && RULES[name].test(sentence));
        if (key) { claimed[key] = RULES[key].exec(sentence); continue; }
        if (index === 0 && !/\d|@|\b(?:damage|save|bonus|penalty)\b/.test(plain[index])) continue;
        return null;
    }
    if (Object.keys(claimed).length !== Object.keys(RULES).length) return null;
    const { hazard, once, blast } = claimed;
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (once[1] !== hazard[3] || !step || step[2] !== hazard[3] || step[4] !== hazard[2] || step[5] !== blast[3] || step[7] !== blast[2]) return null;
    // (PF2e's damage entry is the poison.)
    const [entry, ...others] = adapted.damageComponents ?? [];
    if (others.length || !entry || String(entry.formula ?? "").replace(/\s+/g, "") !== `${hazard[1]}d${hazard[2]}` || entry.type !== hazard[3]) return null;
    return { fumeCloud: { seconds: Number(minutes[1]) * 60, delayRounds: 1, interval: Number(step[1]),
            hazard: { dice: Number(hazard[1]), faces: Number(hazard[2]), type: hazard[3], step: Number(step[3]) },
            blast: { dice: Number(blast[1]), faces: Number(blast[2]), type: blast[3], statistic: blast[4], step: Number(step[6]) },
            notes: [plain[raw.findIndex(sentence => RULES.hidden.test(sentence))]] },
        claimed: [...plain, htmlToPlainText(heightened).replace(/\s+/g, " ").trim()] };
}

/** The poison's and the blast's dice at a cast rank. */
export function fumeCloudAt(data, castRank, baseRank) {
    const steps = Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.interval));
    return { hazard: `${data.hazard.dice + steps * data.hazard.step}d${data.hazard.faces}`, blast: `${data.blast.dice + steps * data.blast.step}d${data.blast.faces}` };
}
