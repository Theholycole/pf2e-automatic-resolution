// Spells whose PF2e Effect leaves the rest of the text to the module (feature group 15), and Heartbolt (group 16), as a card of parts:
//   - Tangling Creepers: the placed 40-foot burst holding PF2e's Effect (the –10-foot Speeds) for the creatures in it, and "Once per round, you can
//     Sustain the spell to make a vine lash out from any square within the expanse of creepers. … Make a melee spell attack roll against the target; on
//     a success, … Immobilized for 1 round or until the creature Escapes (against your spell DC), whichever comes first.";
//   - True Target: "Designate a creature. The first time each target makes an attack roll against that creature during true target's duration, the
//     attacker rolls twice and uses the better result." — PF2e's Effect on each target, its mark on the designated creature, used by the first attack;
//   - Sacred Covenant: "When a target would be reduced to 0 Hit Points but not immediately killed, … It remains at 1 Hit Point, gains 50 temporary Hit
//     Points that last for 1 minute, and increases its Wounded condition by 1." once, then immune until its next daily preparations;
//   - Heartbolt: the target healed (a willing living creature) or damaged (undead, basic Fortitude), then "all other creatures within a 20-foot
//     emanation from the original target" healed or damaged the smaller amount.
import { htmlToPlainText } from "./description-parser.js";

const plain = html => htmlToPlainText(html).replace(/\s+/g, " ").trim();
const split = text => text.split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
const blocks = adapted => String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/);
const UUID = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Za-z-]+)(?: (\d+))?\}`;
const EFFECT = /^@UUID\[Compendium\.pf2e\.spell-effects\.Item\.([^\]]+)\]\{(Spell Effect: [^}]+)\}$/;
const matchAll = (sentences, patterns) => patterns.map(pattern => sentences.map(sentence => pattern.exec(sentence)).find(Boolean));
const unread = (sentences, found, allowed = []) => sentences.filter(sentence => !found.some(match => match?.[0] === sentence) && !allowed.some(pattern => pattern.test(sentence)));
const minutes = adapted => Number(/^(\d+) minutes?$/.exec(adapted.lifecycle?.duration ?? "")?.[1] ?? NaN);
// (PF2e's Effect the text links, from the catalog: its id and rules.)
const catalogEffect = (catalog, name) => (catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {})).find(entry => entry?.name === name) ?? null;

/** {parts, notes, claimed, area?, lasting?} or null. */
export function extractSupportCard(adapted, catalog = null) {
    for (const reader of [creepers, trueTarget, covenant, heartbolt]) { const found = reader(adapted, catalog); if (found) return found; }
    return null;
}

function creepers(adapted, catalog) {
    const parts = blocks(adapted);
    if (parts.length !== 1 || adapted.targeting?.area?.type !== "burst") return null;
    const lead = split(plain(parts[0]));
    const LEAD = [/^Any creature moving on the land, or Climbing or Swimming within the creepers, takes a [–-](\d+)-foot circumstance penalty to its Speeds while in the area\.$/,
        /^Once per round, you can Sustain the spell to make a vine lash out from any square within the expanse of creepers\.$/, /^This vine has a (\d+)-foot reach\.$/,
        new RegExp(String.raw`^Make a melee spell attack roll against the target; on a success, the vine pulls the target into the creepers and makes it ${UUID} for (\d+) rounds? or until the creature @UUID\[[^\]]+\]\{Escapes\} \(against your spell DC\), whichever comes first\.$`),
        EFFECT];
    const found = matchAll(lead, LEAD);
    if (!found.every(Boolean) || unread(lead, found, [/^Dense, twitching creepers sprout\b[^\d]*$/]).length) return null;
    const [penalty, , reach, vine, link] = found;
    const effect = catalogEffect(catalog, link[2]);
    const rules = effect?.mechanics?.rules ?? [];
    const seconds = minutes(adapted) * 60;
    if (!effect?.id || !(rules.length === 1 && rules[0].key === "FlatModifier" && rules[0].value === -Number(penalty[1])) || !Number.isFinite(seconds)) return null;
    return {
        area: { label: "The creepers", shape: "burst", radius: Number(adapted.targeting.area.value), place: true, seconds, sustained: false, excludeCaster: false,
            base: { memberEffect: { uuid: `Compendium.pf2e.spell-effects.Item.${effect.id}`, all: true } } },
        parts: [{ key: "vine", title: "The vine (on a Sustain)", kind: "action", spec: { type: "attack", melee: true, count: 1, noDamage: true,
            rowsHTML: `<hr /><p><strong>Critical Success</strong> The target is @UUID[${vine[1]}]{${vine[2]}} for ${vine[4]} round or until it Escapes, whichever comes first.</p>`
                + `<p><strong>Success</strong> The target is @UUID[${vine[1]}]{${vine[2]}} for ${vine[4]} round or until it Escapes, whichever comes first.</p>` },
            repeat: { trigger: "the spell is Sustained (once per round)" }, reminder: `Target a creature within ${reach[1]} feet of a square of the creepers: the vine's melee spell attack.` }],
        notes: [],
        claimed: [...found.map(match => match[0]), ...lead.filter(sentence => /^Dense, twitching creepers sprout\b/.test(sentence))]
    };
}

function trueTarget(adapted, catalog) {
    const parts = blocks(adapted);
    if (parts.length !== 1) return null;
    const lead = split(plain(parts[0]));
    const LEAD = [/^Designate a creature\.$/, /^The first time each target makes an attack roll against that creature during [a-z ]+ 's duration, the attacker rolls twice and uses the better result\.$/,
        new RegExp(String.raw`^The attacker also ignores circumstance penalties to the attack roll and any flat check required due to the designated creature being ${UUID} or ${UUID}\.$`), EFFECT];
    const found = matchAll(lead, LEAD);
    if (!found.every(Boolean) || unread(lead, found, [/^You delve into the possible futures\b[^\d]*$/]).length) return null;
    const effect = catalogEffect(catalog, found[3][2]);
    const rules = effect?.mechanics?.rules ?? [];
    const mark = rules.find(rule => rule.key === "TokenMark");
    const count = Number(/^(\d+) creatures$/.exec(adapted.targeting?.target ?? "")?.[1] ?? NaN);
    if (!effect?.id || !mark?.slug || !rules.some(rule => rule.key === "RollTwice") || !Number.isFinite(count)) return null;
    return {
        parts: [{ key: "designate", title: "The designated creature", kind: "true-target", count, effectUuid: `Compendium.pf2e.spell-effects.Item.${effect.id}`, markSlug: mark.slug,
            reminder: `Target up to ${count} attackers and pick the designated creature: PF2e's Effect on each, marking that creature; each one's first attack roll against it uses it up.` }],
        notes: ["The attackers also ignore the flat check for the designated creature being Concealed or Hidden (the GM skips it)."],
        claimed: [...found.map(match => match[0]), ...lead.filter(sentence => /^You delve into the possible futures\b/.test(sentence))]
    };
}

function covenant(adapted, catalog) {
    const parts = blocks(adapted);
    if (parts.length !== 1 || adapted.lifecycle?.duration !== "until your next daily preparations") return null;
    const lead = split(plain(parts[0]));
    const LEAD = [/^All creatures are bound by your deity's edicts and anathema\.$/, /^Violating an anathema ends the spell effect on the creature that committed the anathema, but nobody else\.$/,
        /^When a target would be reduced to 0 Hit Points but not immediately killed, it avoids being knocked out and continues to fight\.$/,
        new RegExp(String.raw`^It remains at (\d+) Hit Points?, gains (\d+) temporary Hit Points that last for (\d+) minutes?, and increases its ${UUID} condition by (\d+)\.$`),
        /^Each target can only avoid being knocked out in this way once, then becomes immune to [a-z ]+ until its next daily preparations\.$/, EFFECT];
    const found = matchAll(lead, LEAD);
    if (!found.every(Boolean) || unread(lead, found, [/^You and your allies make a sacred pact\b[^\d]*$/]).length) return null;
    const [, , , keep, , link] = found;
    const effect = catalogEffect(catalog, link[2]);
    const temp = (effect?.mechanics?.rules ?? []).find(rule => rule.key === "TempHP");
    if (!effect?.id || Number(temp?.value) !== Number(keep[2]) || keep[5].toLowerCase() !== "wounded") return null;
    return {
        parts: [{ key: "pact", title: "The pact", kind: "covenant", count: 6, hp: Number(keep[1]), effectUuid: `Compendium.pf2e.spell-effects.Item.${effect.id}`, wounded: Number(keep[7]),
            reminder: "Target the caster and up to 5 willing creatures: each is bound; the first time one would drop to 0 Hit Points (not killed outright), the module keeps it at 1 with PF2e's 50 temporary Hit Points and Wounded +1." }],
        notes: ["All are bound by the caster's deity's edicts and anathema: a creature violating an anathema loses the pact (the GM deletes its Effect)."],
        claimed: [...found.map(match => match[0]), ...lead.filter(sentence => /^You and your allies make a sacred pact\b/.test(sentence))]
    };
}

function heartbolt(adapted) {
    const parts = blocks(adapted);
    if (parts.length !== 2 || adapted.defense?.basic !== true) return null;
    const lead = split(plain(parts[0]));
    const LEAD = [/^If the target is a willing living creature, it regains (\d+)d(\d+)\+(\d+) Hit Points\.$/,
        /^If the target is undead, the bolt deals that amount of (vitality) damage to it instead, with a basic (Fortitude) save\.$/,
        /^The energy then explodes outward, affecting all other creatures within a @Template\[type:emanation\|distance:(\d+)\] from the original target, healing living creatures for @Damage\[\(floor\(@item\.rank \/ 2\) \* (\d+)\)\[vitality,healing\]\|shortLabel\] Hit Points and dealing @Damage\[\(floor\(@item\.rank \/ 2\) \* (\d+)\)\[vitality\]\] damage to undead creatures with a basic (Fortitude) saving throw\.$/];
    const found = matchAll(lead, LEAD);
    if (!found.every(Boolean) || unread(lead, found, [/^Your heart ejects a bolt\b[^\d]*$/]).length) return null;
    const [heal, harm, burst] = found;
    const step = /^Heightened \(\+(\d+)\) The amount of healing or damage the original target receives increases by (\d+)d(\d+)\+(\d+), and the healing or damage that all creatures receive from the emanation increases by (\d+)\.$/.exec(plain(parts[1]));
    const rank = Number(adapted.rank);
    if (!step || Number(step[3]) !== Number(heal[2]) || Number(step[5]) !== Number(burst[2]) || burst[2] !== burst[3] || Number(step[1]) !== 2) return null;
    const statistic = harm[2].toLowerCase();
    const steps = `floor((@item.rank - ${rank}) / ${step[1]})`;
    const bolt = `(${heal[1]} + ${step[2]} * ${steps})d${heal[2]} + (${heal[3]} + ${step[4]} * ${steps})`;
    const plume = `(floor(@item.rank / 2) * ${burst[2]})`;
    return {
        parts: [{ key: "bolt", title: "The bolt and its plume", kind: "heartbolt", radius: Number(burst[1]), boltFormula: bolt, plumeFormula: plume, type: harm[1],
            boltSpec: { type: "save", statistic, basic: true, damage: { formula: `${heal[1]}d${heal[2]}+${heal[3]}`, type: harm[1] }, formula: `{(${bolt})[${harm[1]}]}`,
                html: `<p>The target takes ${heal[1]}d${heal[2]}+${heal[3]} ${harm[1]} damage (basic ${statistic[0].toUpperCase() + statistic.slice(1)} save).</p>` },
            plumeSpec: { type: "save", statistic, basic: true, area: true, damage: { formula: `${burst[2]}`, type: harm[1] }, formula: `{${plume}[${harm[1]}]}`,
                html: `<p>Each creature takes ${burst[2]} ${harm[1]} damage (basic ${statistic[0].toUpperCase() + statistic.slice(1)} save).</p>` },
            reminder: `Target the willing living creature or the undead: it's healed (or damaged, basic Fortitude); then every other creature within ${burst[1]} feet of it is healed (living) or damaged (undead).` }],
        notes: [],
        claimed: [...found.map(match => match[0]), ...lead.filter(sentence => /^Your heart ejects a bolt\b/.test(sentence)), plain(parts[1])]
    };
}
