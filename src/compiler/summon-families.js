// Summon spells (note-only before): Summon Animal, Construct, Fey, Plant or Fungus, Undead, Elemental, Celestial, Dragon, Entity, Giant,
// Monitor, Fiend, Summon Lesser Servitor, Phantasmal Minion. The caster picks a creature from the Actor compendiums that has one of the stated
// traits and is at most the stated level for the cast rank; it is imported with the summoned and minion traits and placed within range, and it
// is removed when the spell's (sustained) Effect on the caster ends.
import { plainText as plain, splitSentences as split } from "./description-parser.js";
import { TRADITIONS } from "./text-patterns.js";


/** The summon trait's table: the highest creature level for each spell rank (Player Core). */
export const SUMMON_LEVELS = { 1: -1, 2: 1, 3: 2, 4: 3, 5: 5, 6: 7, 7: 9, 8: 11, 9: 13, 10: 15 };
const level = text => Number(String(text).replace(/[–−]/, "-"));
const traitList = text => text.split(/,\s*(?:or\s+)?|\s+or\s+/).map(trait => trait.trim().toLowerCase()).filter(Boolean);

// "You summon a creature that has the animal trait and whose level is –1 to fight for you." (or "the plant or fungus trait", "5 or lower").
const STANDARD = /^You summon a creature that has the ([a-z]+(?: or [a-z]+)?) trait and whose level is ([–−-]?\d+)(?: or lower)? to fight for you\.$/;
const TABLE_HEIGHTENED = /^Heightened As listed in the (?:@UUID\[[^\]]+\]\{summon\}|summon) trait\.$/;
const DEITY_NOTE = /^The GM might determine your deity restricts the specific types of [a-z]+ you can summon in certain cases\.$|^For instance, /;
const TRADITION = /^If the [a-z]+ has a magical tradition trait \(arcane, divine, occult, or primal\), you can summon it only if you're using that tradition to cast [a-z ]+\.$/;
// Summon Lesser Servitor: "You summon a common celestial, fiend, or monitor of level –1. You can choose to instead summon a common animal of
// level –1 that hails from the Outer Sphere; you can choose for this animal to gain the celestial and holy traits, the fiend and unholy traits,
// or the monitor trait." with "Heightened (2nd) The creature can be level 1 or lower." entries.
const SERVITOR = /^You summon a common ([a-z]+(?:, [a-z]+)*,? or [a-z]+) of level ([–−-]?\d+)\.$/;
const SERVITOR_ANIMAL = /^You can choose to instead summon a common animal of level ([–−-]?\d+) that hails from the Outer Sphere; you can choose for this animal to gain (.+)\.$/;
// Phantasmal Minion: "You summon a @UUID[Compendium…Actor…]{Phantasmal Minion}." — that creature.
const NAMED = /^You summon an? @UUID\[(Compendium\.[^\]]+\.Actor\.[^\]]+)\]\{([^}]+)\}\.$/;

function lifecycle(adapted) {
    const range = /^(\d+) feet$/i.exec(String(adapted.targeting?.range ?? "").trim());
    const raw = String(adapted.lifecycle?.duration ?? "").trim();
    const minutes = /^(?:sustained up to )?(\d+) minutes?$/i.exec(raw);
    const sustained = adapted.lifecycle?.sustained === true || /^sustained/i.test(raw);
    // (A "sustained" spell with no stated maximum lasts at most 10 minutes.)
    if (!range || !sustained || !(minutes || raw === "" || /^sustained$/i.test(raw))) return null;
    return { rangeFeet: Number(range[1]), durationSeconds: minutes ? Number(minutes[1]) * 60 : 600, sustained: true };
}

// Magic+'s aspect summons: "You call upon an animal to do your bidding. You summon an @UUID[…]{animal aspect} that can be up to Medium in size (or a different size,
// as determined by your choice of aspect)." with the aspect creature, its "Spell Effect: … Aspect Statistics" and the module's macro linked after it — that creature, at
// a level of the cast rank, with the statistics Effect from the caster (as the macro does: its AspectForm reads the caster's spell DC); its choices the caster's.
const ASPECT = /^<p>((?:(?!<\/p>).)*?)You summon an? @UUID\[[^\]]+\]\{([a-z]+ aspect)\} that can be up to ([A-Z][a-z]+) in size(?: \(or a different size, as determined by your choice of aspect\))?\.(?:\s*<br\s*\/?>\s*<em>See @UUID\[[^\]]+\]\{Aspect Summoning\} for more\.<\/em>)?<\/p>\s*<p>@UUID\[(Compendium\.[^\]]+?\.actors)\.(?:Actor\.|Item\.)?([A-Za-z0-9]+)\](?:\{([^}]+)\})?\s*@UUID\[(Compendium\.[^\]]+?\.(?:misc|spell-effects)\.(?:Item\.)?[A-Za-z0-9]+)\]\{(Spell Effect: [^}]+)\}<\/p>\s*<p>@UUID\[Compendium\.[^\]]+?\.macros\.[^\]]+\](?:\{[^}]+\})?<\/p>$/;
const docUuid = (uuid, type) => uuid.replace(new RegExp(`^(Compendium\\.[^.]+\\.[^.]+)\\.(?!${type}\\.)`), `$1.${type}.`);

function compileAspectSummon(adapted) {
    const html = String(adapted.descriptionHTML ?? "").replace(/\s+/g, " ").trim();
    const match = ASPECT.exec(html);
    if (!match || /\d|@/.test(match[1])) return null;
    const raw = String(adapted.lifecycle?.duration ?? "").trim();
    const minutes = /^(?:sustained up to )?(\d+) minutes?$/i.exec(raw);
    if (!minutes || adapted.lifecycle?.sustained !== true) return null;
    const range = /^(\d+) feet$/i.exec(String(adapted.targeting?.range ?? "").trim());
    return { summon: { rangeFeet: range ? Number(range[1]) : 30, durationSeconds: Number(minutes[1]) * 60, sustained: true, actorUuid: `${match[4]}.Actor.${match[5]}`, actorName: match[6] ?? match[2].replace(/\b[a-z]/g, letter => letter.toUpperCase()),
        // (The module's statistics Effect: the compiler reads it as PF2e's spell Effects are; the loader finds it in the module's pack.)
        aspect: { kind: match[2], maxSize: match[3].toLowerCase(), statistics: { uuid: docUuid(match[7], "Item"), name: match[8] } }, notes: [] },
        claimed: [plain(html)] };
}

/** Returns {summon, claimed} or null. */
export function compileSummon(adapted) {
    if (adapted.defense?.kind !== "none" && adapted.defense?.kind !== undefined) return null;
    if (String(adapted.targeting?.target ?? "").trim() || (adapted.damageComponents ?? []).length) return null;
    const aspect = compileAspectSummon(adapted);
    if (aspect) return aspect;
    const life = lifecycle(adapted);
    if (!life) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = split(plain(body));
    const heightened = plain(rest.join(" "));
    const baseRank = Number(adapted.rank ?? adapted.level ?? 1);
    const standardAt = sentences.findIndex(sentence => STANDARD.test(sentence));
    if (standardAt === 0) {
        const [, traits, base] = STANDARD.exec(sentences[0]);
        if (SUMMON_LEVELS[baseRank] !== level(base) || (rest.length && !TABLE_HEIGHTENED.test(heightened))) return null;
        const after = sentences.slice(1);
        const tradition = after.some(sentence => TRADITION.test(sentence));
        if (after.some(sentence => !DEITY_NOTE.test(sentence) && !TRADITION.test(sentence))) return null;
        return { summon: { ...life, traits: traitList(traits), levels: { table: "summon-trait", baseRank }, rarity: "common", traditionMatch: tradition,
            notes: after.filter(sentence => DEITY_NOTE.test(sentence)) }, claimed: [...sentences, heightened].filter(Boolean) };
    }
    const servitorAt = sentences.findIndex(sentence => SERVITOR.test(sentence));
    if (servitorAt >= 0) {
        const [, traits, base] = SERVITOR.exec(sentences[servitorAt]);
        const animal = SERVITOR_ANIMAL.exec(sentences[servitorAt + 1] ?? "");
        if (!animal || level(animal[1]) !== level(base) || sentences.slice(0, servitorAt).some(sentence => /\d|@/.test(sentence))) return null;
        const animalTraits = animal[2].replace(/^the /, "").split(/,\s*(?:or\s+)?the\s+|\s+or\s+the\s+/)
            .map(group => /^([a-z]+)(?: and ([a-z]+))? traits?$/.exec(group.trim())).map(match => match ? [match[1], match[2]].filter(Boolean) : null);
        if (!animalTraits.length || animalTraits.some(group => !group)) return null;
        const byRank = { [baseRank]: level(base) };
        const entries = [...heightened.matchAll(/Heightened \((\d+)(?:st|nd|rd|th)\) The creature can be level ([–−-]?\d+) or lower\./g)];
        if (entries.length !== (heightened.match(/Heightened/g) ?? []).length) return null;
        for (const entry of entries) byRank[Number(entry[1])] = level(entry[2]);
        const notes = sentences.slice(servitorAt + 2);
        if (notes.some(sentence => !/\banathema\b|^For example, |^The GM might determine/.test(sentence))) return null;
        return { summon: { ...life, traits: traitList(traits), levels: { byRank }, rarity: "common", traditionMatch: false,
            animal: { level: level(animal[1]), traitChoices: animalTraits }, notes }, claimed: [...sentences, heightened].filter(Boolean) };
    }
    const named = NAMED.exec(sentences[0] ?? "");
    if (named && !rest.length) {
        const notes = sentences.slice(1);
        if (notes.some(sentence => /\d|\b(?:damage|saves?|bonus|penalty|Hit Points|Strikes?)\b/i.test(sentence.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")))) return null;
        return { summon: { ...life, actorUuid: named[1], actorName: named[2], notes: notes.map(sentence => sentence.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")) },
            claimed: sentences };
    }
    return null;
}

/** The highest level of creature the spell summons at a cast rank. */
export function summonMaxLevel(data, castRank) {
    if (data.levels?.table === "summon-trait") return SUMMON_LEVELS[Math.max(1, Math.min(10, castRank))];
    const ranks = Object.keys(data.levels?.byRank ?? {}).map(Number).filter(rank => rank <= castRank).sort((a, b) => a - b);
    return ranks.length ? data.levels.byRank[ranks.at(-1)] : null;
}

/** Whether a compendium creature (its index entry) may be summoned: type, traits, level, rarity, tradition. */
export function summonEligible(data, entry, { castRank, tradition = null, allowRarity = false } = {}) {
    if (entry?.type !== "npc") return false;
    const traits = entry.system?.traits?.value ?? [];
    const creatureLevel = Number(entry.system?.details?.level?.value);
    const max = summonMaxLevel(data, castRank);
    if (!Number.isFinite(creatureLevel) || max === null) return false;
    if (!allowRarity && data.rarity && (entry.system?.traits?.rarity ?? "common") !== data.rarity) return false;
    if (data.traditionMatch && tradition && traits.some(trait => TRADITIONS.includes(trait) && trait !== tradition)) return false;
    if ((data.requireTraits ?? []).some(trait => !traits.includes(trait))) return false;
    if (data.traits.some(trait => traits.includes(trait))) return creatureLevel <= max;
    // Summon Lesser Servitor's animal option.
    return Boolean(data.animal) && traits.includes("animal") && creatureLevel <= max;
}
