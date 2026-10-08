// Items that cast an official spell with numbers of their own (the spell features audit, batch F5, 2026-10-05): the spellhearts ("The spell DC of any
// spell cast by activating this item is 17. … Activate Cast a Spell Effect You cast Frostbite."), and weapons and charms that cast one spell ("You
// cast a 6th-rank Hydraulic Torrent. The spell DC is 31."). Read from the item's text into:
//   - casts: [{ uuid, name, rank (null: the spell's own; a cantrip at half the item's level), frequency, tradition }];
//   - the item's numbers: { dc, attack } (one gives the other: DC = 10 + attack), or the wielder's Strike with the item ("using your melee attack
//     modifier with searing blade as your spell attack modifier");
//   - the spellhearts' benefits after such a cast, by where the spellheart is affixed: [{ where, when, effect, text }] — "Weapon After you cast a cold
//     spell by activating the crystal, your Strikes with the weapon deal an additional 1d4 cold damage …" with PF2e's "Effect: Rime Crystal - Weapon".
// Null when the item casts nothing these forms read.
import { htmlToPlainText } from "./description-parser.js";

const plain = html => htmlToPlainText(html).replace(/\s+/g, " ").trim()
    // ("[[/r 1d20+7 #Spell Attack Roll]]{+7}": the shown number.)
    .replace(/\[\[\/r [^\]]+\]\]\{([^}]+)\}/g, "$1");
const SPELL = String.raw`@UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{([^}]+)\}`;
const TRADITIONS = ["arcane", "divine", "occult", "primal"];
// (A legacy school in "After you cast an enchantment spell by activating the horn": no trait any more — the item's own spells are of it, so any.)
const LEGACY_SCHOOLS = ["abjuration", "conjuration", "divination", "enchantment", "evocation", "necromancy", "transmutation"];

/** The numbers of the spells an item casts: { dc, attack } (either may be null), or null. */
export function readItemCastNumbers(text) {
    let m;
    if ((m = /The spell (?:attack modifier|attack roll) of any spell cast by [Aa]ctivating this item is \+(\d+),? and the spell DC (?:is )?(\d+)\./.exec(text))) return { attack: Number(m[1]), dc: Number(m[2]) };
    if ((m = /The spell DC of any spell cast by [Aa]ctivating this item is (\d+)\./.exec(text))) return { attack: null, dc: Number(m[1]) };
    if ((m = /The spell attack (?:modifier|roll) of any spell cast by [Aa]ctivating this item is \+(\d+)\./.exec(text))) return { attack: Number(m[1]), dc: null };
    return null;
}

/** The condition on the cast in "After you cast a cold spell by activating …": { any } | { nonCantrip } | { anyTraits } | null. */
function readWhen(kind) {
    const words = (kind ?? "").trim();
    if (!words) return { any: true };
    if (words === "non-cantrip") return { nonCantrip: true };
    const traits = words.split(/ or /).map(word => word.trim());
    if (traits.every(trait => LEGACY_SCHOOLS.includes(trait))) return { any: true, school: traits };
    if (traits.every(trait => /^[a-z]+$/.test(trait))) return { anyTraits: traits };
    return null;
}

/** A benefit PF2e gives no Effect for, from its text: extra dice on the affixed weapon's Strikes, or Concealed; null for a note. */
function buildAfter(text) {
    let m;
    // ("your Strikes with the weapon it's attached to deal an additional 1d6 poison damage until the end of your next turn")
    if ((m = /^your Strikes with the (?:affixed )?weapon(?: it['’]s attached to)? deal an additional (?:@Damage\[)?(\d+)d(\d+)(?:\[([a-z]+)\]\])? ?([a-z]+)? damage until (?:the )?end of your next turn\.?$/.exec(text)))
        return { type: "strike-dice", diceNumber: Number(m[1]), dieSize: `d${m[2]}`, damageType: m[3] ?? m[4], until: "caster-next-turn-end" };
    // ("you are surrounded by a fine mist. You become Concealed until the beginning of your next turn.")
    if (/You become @UUID\[Compendium\.pf2e\.conditionitems\.Item\.DmAIPqOBomZ7H95W\]\{Concealed\} until the beginning of your next turn\.?$/.test(text))
        return { type: "conditions", list: [{ uuid: "Compendium.pf2e.conditionitems.Item.DmAIPqOBomZ7H95W", slug: "concealed", value: null, until: "caster-turn-start" }] };
    return null;
}

/** An item's casts and numbers: { name, kind: "spellheart" | "item", numbers, casts, after, notes }, or null. */
export function readItemCasts(source) {
    const text = plain(source?.system?.description?.value ?? "");
    const level = Number(source?.system?.level?.value ?? 0);
    const spellheart = (source?.system?.traits?.value ?? []).includes("spellheart");
    const casts = [];
    let numbers = readItemCastNumbers(text);
    let m;
    // Spellhearts: "Activate Cast a Spell [Frequency once per day] Effect You cast [5th-rank] Vampiric Feast[ to summon …]."
    // (A summon's creature by where the spellheart is affixed — "to summon a Hunting Spider (armor), Wolf (melee weapon), …" — kept for the card.)
    const CAST = new RegExp(String.raw`Activate Cast a Spell (?:Frequency (once per [a-z]+) )?Effect [Yy]ou cast (?:(\d+)(?:st|nd|rd|th)[- ]rank )?${SPELL}(?: \(@Check\[[^\]]+\]\))?( to summon (?:[^.@]|@UUID\[[^\]]+\]\{[^}]+\})+)?\.?(?= Activate|$| [A-Z@])`, "g");
    while ((m = CAST.exec(text))) casts.push({ uuid: m[3], name: m[4], rank: m[2] ? Number(m[2]) : null, frequency: m[1] ?? null, tradition: null, ...(m[5] ? { note: `cast${m[5]}` } : {}) });
    // (Tian Xia+'s: "Activate— Cast a Spell Effect You cast the Detect Metal cantrip. In addition to metal, …"; "Activate Cast a Spell; Effect You cast Know the Way . In addition to
    // the effects of the cantrip, …"; "Activate—Send Message 3 Cast a Spell; Frequency once per day Effect You cast the Sending spell with the wearer of the other pair of jewelry as
    // the target." — the spell, and what the item adds to it as a note for the table.)
    if (!casts.length) {
        const NAMED = /Activate\s*(?:[—–-]\s*(?:[A-Z][\w' ]*?\s*)?(?:\d\s*)?)?Cast a Spell;? (?:Frequency (once per [a-z]+)(?:, plus overcharge;)? )?Effect You cast (?:the )?@UUID\[(Compendium\.pf2e\.spells-srd\.(?:Item\.)?[A-Za-z0-9]+)\]\{([^}]+)\} ?(?:cantrip|spell)?( with [^.]+)?\s?\.(?: (In addition [^]+?\.)(?= [A-Z][a-z]+ [a-z]| ?$))?/;
        if ((m = NAMED.exec(text))) {
            const notes = [m[4] ? `Cast${m[4]}.` : null, m[5] ?? null].filter(Boolean);
            // (Geojibom's Guidance: "After you cast the spell, you emanate bright light out to 10 feet and dim light 10 feet from your bright light for 1 minute. You automatically
            // gain the effects of the Detect Magic spell within the bright light." — the light on the caster's token for that long; the detection a note on it.)
            const glow = /After you cast the spell, you emanate bright light out to (\d+) feet and dim light (\d+) feet from your bright light for (\d+) minutes?\. (You automatically gain the effects of the @UUID\[[^\]]+\]\{Detect Magic\} spell within the bright light\.)/.exec(text.slice(m.index));
            const selfLight = glow ? { bright: Number(glow[1]), dim: Number(glow[1]) + Number(glow[2]), minutes: Number(glow[3]), text: glow[4].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1") } : null;
            casts.push({ uuid: m[2].replace(/spells-srd\.(?!Item\.)/, "spells-srd.Item."), name: m[3], rank: null, frequency: m[1] ?? null, tradition: null, ...(notes.length ? { note: notes.join(" ") } : {}), ...(selfLight ? { selfLight } : {}) });
        }
    }
    // Weapons and charms: "You cast a 5th-rank Ignition spell with a spell attack roll of +13."; "You cast a 6th-rank Hydraulic Torrent. The spell DC is 31.";
    // "A 6th-rank arcane Fireball spell explodes, centered on the sky hammer. The spell DC is 45."; "You cast the Ignition cantrip from the sword as a
    // 7th-rank arcane spell, using your melee attack modifier with searing blade as your spell attack modifier."
    if (!casts.length) {
        const frequency = /Frequency (once per [a-z]+) (?:Trigger [^.]+ )?Effect [^.]*?(?:You cast|spell explodes)/.exec(text)?.[1] ?? null;
        if ((m = new RegExp(String.raw`You cast a (\d+)(?:st|nd|rd|th)-rank ${SPELL} spell with a spell attack roll of \+(\d+)\.`).exec(text)))
            { casts.push({ uuid: m[2], name: m[3], rank: Number(m[1]), frequency, tradition: null }); numbers = { attack: Number(m[4]), dc: null }; }
        else if ((m = new RegExp(String.raw`You cast a (\d+)(?:st|nd|rd|th)-rank ${SPELL}\. The spell DC is (\d+)\.`).exec(text)))
            { casts.push({ uuid: m[2], name: m[3], rank: Number(m[1]), frequency, tradition: null }); numbers = { attack: null, dc: Number(m[4]) }; }
        else if ((m = new RegExp(String.raw`A (\d+)(?:st|nd|rd|th)-rank (arcane|divine|occult|primal) ${SPELL} spell explodes, centered on the ([a-z ]+?) ?\. The spell DC is (\d+)\.( You are immune to the [a-z]+'s effect, though your allies are not\.)?`).exec(text)))
            { casts.push({ uuid: m[3], name: m[4], rank: Number(m[1]), frequency, tradition: m[2], centeredOn: m[5], casterImmune: !!m[7] }); numbers = { attack: null, dc: Number(m[6]) }; }
        else if ((m = new RegExp(String.raw`You cast the ${SPELL} cantrip from the [a-z]+ as a (\d+)(?:st|nd|rd|th)-rank (arcane|divine|occult|primal) spell, using your melee attack modifier with [a-z ]+? as your spell attack modifier\.`).exec(text)))
            { casts.push({ uuid: m[1], name: m[2], rank: Number(m[3]), frequency, tradition: m[4] }); numbers = { attack: "strike", dc: null }; }
    }
    if (!casts.length) return null;
    // (A spellheart whose spells need no DC or attack — Light, Telekinetic Hand — states none.)
    numbers ??= { attack: null, dc: null };
    // (A cantrip without a stated rank: heightened to half the item's level, rounded up — as a scroll's or wand's.)
    const cantripRank = Math.max(1, Math.ceil(level / 2));
    // The spellhearts' sections: "Armor …", "Weapon …", "Melee Weapon …", "Ranged Weapon …"; those after a cast are its benefits.
    const after = [];
    const effects = [...text.matchAll(/@UUID\[(Compendium\.pf2e\.equipment-effects\.Item\.[A-Za-z0-9]+)\]\{Effect: [^}]+?(?: - | \()(Armor|Weapon|Melee Weapon|Ranged Weapon)\)?\}/g)].map(entry => ({ uuid: entry[1], where: entry[2].toLowerCase() }));
    const body = text.split(/ @UUID\[Compendium\.pf2e\.equipment-effects| Activate Cast a Spell/)[0];
    const sections = [...body.matchAll(/(?:^|\. |\.\s)(Armor|Melee Weapon|Ranged Weapon|Weapon)(?: \([a-z, ]+\))? (.+?)(?=(?:\. |\.$)(?:Armor|Melee Weapon|Ranged Weapon|Weapon)(?: \([a-z, ]+\))? [A-Z]|$)/g)];
    for (const section of sections) {
        const where = section[1].toLowerCase();
        const cast = /^After you [Cc]ast (?:a|an) ((?:non-cantrip|[a-z]+(?: or [a-z]+)?) )?[Ss]pell by [Aa]ctivating the [a-z'’ ]+? ?, (.+)$/.exec(section[2].trim());
        if (!cast) continue;
        const when = readWhen(cast[1]);
        if (!when) return null;
        const effect = effects.find(entry => entry.where === where)?.uuid ?? null;
        after.push({ where, when, effect, built: effect ? null : buildAfter(cast[2]), text: `${section[2].trim().replace(/\.?$/, ".")}` });
    }
    const tradition = TRADITIONS.find(entry => (source?.system?.traits?.value ?? []).includes(entry)) ?? null;
    return { name: source.name, kind: spellheart ? "spellheart" : "item", level, numbers, cantripRank,
        casts: casts.map(entry => ({ ...entry, tradition: entry.tradition ?? tradition })), after };
}
