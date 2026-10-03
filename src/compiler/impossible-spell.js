// An impossible spell's damage burst that marks the creatures it damages, a Fuel action that burns the marked, and the caster's lethologic
// mark (Pyroclastic Truth; user decision):
//   "… dealing 2d12 fire damage to all creatures, structures, and unattended objects in the area. All creatures damaged by this spell are marked
//   by fire for the duration of the spell." / "When you Fuel Pyroclastic Truth, all creatures marked by fire take @Damage[(@item.level)d12
//   [persistent,fire]] damage." / "Lethologic Mark … Whenever you take fire damage, you become Frightened 1. Additionally, if you're reduced to
//   0 Hit Points by a fire effect, you instantly die … To heal this mark, you must perform an atone ritual …"
// The cast is an ordinary basic save (structures and objects are the GM's). Each creature that loses Hit Points to it gets a mark Effect for
// the spell's duration; the Ongoing record's Fuel control deals the persistent damage to every creature still marked. The caster gets the
// lethologic mark Effect (once): fire damage makes them Frightened 1, and fire damage that drops them to 0 kills them outright; healing it is a note.
import { htmlToPlainText } from "./description-parser.js";

const BURST = /\bdealing (\d+d\d+) ([a-z]+) damage to all creatures, structures, and unattended objects in the area\.(?=\s|$)/;
const MARKED = /^All creatures damaged by this spell are marked by ([a-z]+) for the duration of the spell\.$/;
const FUEL = /^When you Fuel ([A-Z][A-Za-z' ]+), all creatures marked by ([a-z]+) take @Damage\[\(@item\.(?:level|rank)\)d(\d+)\[persistent,([a-z]+)\]\] damage\.$/;
const DEATH = /^Additionally, if you're reduced to 0 Hit Points by an? ([a-z]+) effect, you instantly die\b[^.]*\.$/;
const HEAL = /^To heal this mark, [^.]+\.$/;

/** Returns {mainHTML, impossible, claimed} or null. */
export function extractImpossibleBurst(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || !adapted.targeting?.area || !(adapted.traits ?? adapted.source?.traits ?? []).includes?.("impossible") && !/\bimpossible spell\b/i.test(String(adapted.descriptionHTML))) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [body, ...rest] = html.split(/<hr\s*\/?>/i);
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1]);
    if (paragraphs.length !== 3) return null;
    const first = htmlToPlainText(`<p>${paragraphs[0]}</p>`).replace(/\s+/g, " ").trim();
    const burst = BURST.exec(first);
    if (!burst || burst[1] !== String(components[0].formula).replace(/\s+/g, "") || burst[2] !== String(components[0].type).toLowerCase()) return null;
    const firstSentences = first.split(/(?<=[.!?])\s+(?=[A-Z])/);
    // Before the burst: narration only.
    const burstAt = firstSentences.findIndex(sentence => BURST.test(sentence));
    if (burstAt !== firstSentences.length - 2 || firstSentences.slice(0, burstAt).some(sentence => /\d|@|\b(?:damage|save|bonus|penalty|condition|immune)\b/i.test(sentence))) return null;
    const marked = MARKED.exec(firstSentences.at(-1) ?? "");
    if (!marked || marked[1] !== burst[2]) return null;
    const fuel = FUEL.exec(paragraphs[1].trim());
    // (The sentence names the spell; the route doesn't depend on the item's name.)
    if (!fuel || fuel[2] !== marked[1] || fuel[4] !== burst[2]) return null;
    const markText = paragraphs[2].replace(/^\s*<strong>\s*Lethologic Mark\s*<\/strong>\s*/i, "");
    if (markText === paragraphs[2]) return null;
    const markSentences = htmlToPlainText(`<p>${markText}</p>`).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/);
    const frightenedRaw = /Whenever you take ([a-z]+) damage, you become @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Frightened (\d)\}\./.exec(markText);
    const death = markSentences.map(sentence => DEATH.exec(sentence)).find(Boolean);
    const heal = markSentences.find(sentence => HEAL.test(sentence));
    if (!frightenedRaw || !death || !heal || frightenedRaw[1] !== burst[2] || death[1] !== burst[2]) return null;
    // Heightened (+1): "The initial fire damage increases by 2d12, and the persistent fire damage increases by 1d12." — the item's own step, and
    // the Fuel damage's dice follow the rank (its formula).
    if (rest.length) {
        const entry = /Heightened \(\+(\d+)\)\s*<\/strong>\s*The initial [a-z]+ damage increases by (\d+d\d+), and the persistent [a-z]+ damage increases by 1d(\d+)\./.exec(rest.join(""));
        const step = adapted.heightening?.damage?.[components[0].id];
        if (!entry || String(step ?? "").replace(/\s+/g, "") !== entry[2] || Number(entry[3]) !== Number(fuel[3]) || Number(adapted.heightening?.interval) !== Number(entry[1])) return null;
    }
    const statistic = adapted.defense.statistic[0].toUpperCase() + adapted.defense.statistic.slice(1);
    return {
        mainHTML: `<p>You deal ${burst[1]} ${burst[2]} damage to all creatures in the area, with a basic ${statistic} save.</p>${rest.length ? `<hr />${rest.join("<hr />")}` : ""}`,
        impossible: {
            mark: { label: `marked by ${marked[1]}`, sourceText: firstSentences.at(-1) },
            fuel: { dieSize: Number(fuel[3]), damageType: fuel[4], sourceText: htmlToPlainText(`<p>${paragraphs[1]}</p>`).trim() },
            lethologic: { frightened: { damageType: frightenedRaw[1], value: Number(frightenedRaw[2]) }, deathAtZero: { damageType: death[1] }, healNote: heal,
                text: markSentences.join(" ").replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1") },
            objectsNote: "Structures and unattended objects in the area also take the damage: the GM applies it.",
            narration: firstSentences.slice(0, burstAt)
        },
        claimed: [first, htmlToPlainText(`<p>${paragraphs[1]}</p>`).trim(), ...markSentences]
    };
}

export function isExecutableImpossible(impossible) {
    return Boolean(impossible) && typeof impossible.mark?.label === "string" && Number.isInteger(impossible.fuel?.dieSize) && /^[a-z]+$/.test(impossible.fuel.damageType ?? "")
        && /^[a-z]+$/.test(impossible.lethologic?.frightened?.damageType ?? "") && Number.isInteger(impossible.lethologic.frightened.value)
        && /^[a-z]+$/.test(impossible.lethologic?.deathAtZero?.damageType ?? "") && typeof impossible.lethologic.healNote === "string";
}
