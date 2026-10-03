// A spell attack whose effect depends on what the target is (Flense): "The effect depends on whether the target is a living creature, undead
// creature, or inanimate corpse. A creature or corpse that lacks flesh, muscle, and internal organs is immune to this spell." with one paragraph
// per kind:
//   "Living Creature Make a spell attack roll. On a hit, the target takes 2d6 slashing damage. On a critical hit, double the damage, and the target
//   also takes 1d4 persistent bleed damage. If this spell's damage kills the target, the corpse is only bones." / "Undead Creature … On a critical
//   hit, double the damage, and the target also becomes Enfeebled 1 for 1 minute. …" / "Inanimate Corpse …" (the GM's).
// Each creature paragraph is rewritten to an ordinary attack (the living one the base, the undead one the rows a creature with that trait
// uses); a corpse is a note; the flesh requirement is the GM's per target.
const PARAGRAPH = /<p>\s*<strong>\s*([A-Z][a-z]+ [A-Z][a-z]+)\s*<\/strong>\s*([\s\S]*?)<\/p>/g;
const INTRO = [/^The effect depends on whether the target is a living creature, undead creature, or inanimate corpse\.$/,
    /^A creature or corpse that lacks flesh, muscle, and internal organs is immune to this spell\.$/];
const ATTACK = /^Make a spell attack roll\. On a hit, the target takes (\d+d\d+) ([a-z]+) damage\. On a critical hit, double the damage, and the target also (.+?)\. (?:If this spell's damage (?:kills|destroys) the target, [a-z ,']+\.)$/;
const BLEED = /^takes (\d+)d(\d+) persistent bleed damage$/;
const CONDITION = /^becomes (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Za-z]+ \d\}) for (\d+) (minute|round)s?$/;
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \(\+1\)\s*<\/strong>\s*The slashing damage to living and undead creatures increases by (\d+d\d+), and the persistent bleed damage to living creatures increases by (\d+)d(\d+)\.\s*<\/p>$/;

const plainSentences = text => String(text ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);

/** {living, undead, corpseNote, predicate, sentences} (the two rewritten descriptions) or null. */
export function extractTraitModes(adapted) {
    if (!adapted.activation?.traits?.includes("attack") || adapted.defense?.kind !== "none") return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const cut = html.search(/<hr\b[^>]*>\s*<p>\s*<strong>\s*Heightened\b/i);
    if (cut < 0) return null;
    const base = html.slice(0, cut), rest = html.slice(cut);
    const paragraphs = Object.fromEntries([...base.matchAll(PARAGRAPH)].map(match => [match[1], match[2].trim()]));
    if (Object.keys(paragraphs).sort().join() !== "Inanimate Corpse,Living Creature,Undead Creature") return null;
    const intro = plainSentences(base.replace(PARAGRAPH, ""));
    if (intro.length !== 3 || !INTRO[0].test(intro[1]) || !INTRO[1].test(intro[2]) || /\d|@|\b(?:damage|save|bonus|penalty|condition)\b/i.test(intro[0])) return null;
    const corpse = plainSentences(paragraphs["Inanimate Corpse"]);
    if (corpse.some(sentence => /\d|@|\b(?:damage|save|creature)\b/i.test(sentence))) return null;
    const heightened = rest.match(/<p>\s*<strong>\s*Heightened[\s\S]*?<\/p>/gi) ?? [];
    const step = heightened.length === 1 ? HEIGHTENED.exec(heightened[0].trim()) : null;
    if (!step || !(adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === 1 && adapted.heightening.damage?.[components[0].id] === step[1])) return null;
    const read = name => {
        const text = plainSentences(paragraphs[name]).join(" ");
        const match = ATTACK.exec(text);
        if (!match || match[1] !== String(components[0].formula).replace(/\s+/g, "") || match[2] !== String(components[0].type).toLowerCase()) return null;
        return { dice: match[1], type: match[2], extra: match[3] };
    };
    const living = read("Living Creature"), undead = read("Undead Creature");
    if (!living || !undead) return null;
    const bleed = BLEED.exec(living.extra), condition = CONDITION.exec(undead.extra.replace(/\{([A-Za-z]+ \d)\}/, "{$1}"));
    // The bleed (1d4 at 1st rank, +1d4 a rank): the cast rank's dice.
    if (!bleed || bleed[1] !== "1" || bleed[2] !== step[3] || step[2] !== "1" || Number(adapted.rank) !== 1 || !condition) return null;
    const heightenedDamage = `<hr /><p><strong>Heightened (+1)</strong> The damage increases by ${step[1]}.</p>`;
    return {
        living: `<p>Make a spell attack roll. On a hit, the spell deals ${living.dice} ${living.type} damage. The spell deals double damage on a critical hit and @Damage[(@item.rank)d${bleed[2]}[persistent,bleed]] damage.</p>${heightenedDamage}`,
        undead: `<p>Make a spell attack roll. If you hit, you deal ${undead.dice} ${undead.type} damage.</p><p><strong>Critical Success</strong> The target takes double damage and is ${condition[1]} for ${condition[2]} ${condition[3]}${condition[2] === "1" ? "" : "s"}.</p><p><strong>Success</strong> The target takes full damage.</p>${heightenedDamage}`,
        corpseNote: { kind: "surroundings", text: `Inanimate Corpse: ${corpse.join(" ")} (The GM's; the module resolves creatures only.)`, sourceText: `Inanimate Corpse ${corpse.join(" ")}` },
        predicate: { kind: "gm-confirmed", question: "Does the creature have flesh, muscle and internal organs? (A creature without them is immune.)", sourceText: intro[2] },
        sentences: [...intro, ...plainSentences(paragraphs["Living Creature"]), ...plainSentences(paragraphs["Undead Creature"])]
    };
}

// Two adjacent squares of opposite energy (Redistribute Potential): "Creatures in either area take 4d4 damage with a basic Fortitude save.
// Choose one of the squares to steal heat, dealing cold damage, and the other to concentrate the stolen heat, dealing fire damage. A creature
// that fails its save also becomes Clumsy 1 from numbness if it's in the area of stolen heat or Enfeebled 1 from heat stroke if it's in the
// area of concentrated heat; these conditions last until the start of your next turn. If a creature is large enough to be in both squares, you
// choose only one of the areas for it to attempt its save against; it's unaffected by the other area."
// Each square is rewritten to an ordinary basic save with its rider; the GM picks each target's square on the card (the second square's
// rows, and its damage type swapped from the first's).
const ZONE_AREA = /^<p>\s*<strong>\s*Area\s*<\/strong>\s*two adjacent (\d+)-foot squares\s*<\/p>\s*(?:<hr\s*\/?>)?/i;
const ZONE_DAMAGE = /^Creatures in either area take (\d+d\d+) damage with a basic (Fortitude|Reflex|Will) save\.$/;
const ZONE_TYPES = /^Choose one of the squares to steal heat, dealing (cold) damage, and the other to concentrate the stolen heat, dealing (fire) damage\.$/;
const ZONE_RIDER = /^A creature that fails its save also becomes (@UUID\[[^\]]+\]\{[A-Za-z]+ \d\}) from [a-z ]+ if it's in the area of stolen heat or (@UUID\[[^\]]+\]\{[A-Za-z]+ \d\}) from [a-z ]+ if it's in the area of concentrated heat; these conditions last until the start of your next turn\.$/;
const ZONE_BOTH = /^If a creature is large enough to be in both squares, you choose only one of the areas for it to attempt its save against; it's unaffected by the other area\.$/;

export function extractZoneModes(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area?.type !== "square") return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category || String(components[0].type).toLowerCase() !== "untyped") return null;
    let html = String(adapted.descriptionHTML ?? "");
    const area = ZONE_AREA.exec(html);
    if (!area || Number(area[1]) !== Number(adapted.targeting.area.value)) return null;
    html = html.slice(area[0].length);
    const cut = html.search(/<hr\b[^>]*>\s*<p>\s*<strong>\s*Heightened\b/i);
    const rest = cut < 0 ? "" : html.slice(cut);
    const sentences = String(cut < 0 ? html : html.slice(0, cut)).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = sentences.findIndex(sentence => ZONE_DAMAGE.test(sentence));
    if (at < 0 || sentences.length !== at + 4 || !ZONE_TYPES.test(sentences[at + 1]) || !ZONE_RIDER.test(sentences[at + 2]) || !ZONE_BOTH.test(sentences[at + 3])) return null;
    if (sentences.slice(0, at).some(sentence => /\d|@|\b(?:damage|save|bonus|penalty|condition)\b/i.test(sentence))) return null;
    const [, dice, statistic] = ZONE_DAMAGE.exec(sentences[at]);
    if (dice !== String(components[0].formula).replace(/\s+/g, "") || statistic.toLowerCase() !== adapted.defense.statistic) return null;
    const [, cold, fire] = ZONE_TYPES.exec(sentences[at + 1]);
    const [, coldCondition, fireCondition] = ZONE_RIDER.exec(sentences[at + 2]);
    const body = (type, condition) => `<p>You deal ${dice} ${type} damage to all creatures in the area, with a basic ${statistic} save. A creature that fails its save is also ${condition} until the start of your next turn.</p>${rest}`;
    return {
        first: { type: cold, html: body(cold, coldCondition) }, second: { type: fire, html: body(fire, fireCondition) },
        question: `Which square is this creature in (it saves against that one only)? The ${cold} square (stolen heat) or the ${fire} square (concentrated heat).`,
        sentences: sentences.slice(0, at + 4)
    };
}
