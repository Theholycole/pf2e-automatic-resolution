// Spells whose attack has its own shape (feature group 10), as a card of parts:
//   - an attack, then a save: "Make a spell attack against the target." / "If you hit a creature, it takes 6d12 poison damage and 6d12 spirit damage with a
//     basic Fortitude save." / "If you critically hit, the target gets a result one degree of success worse than the outcome of its Fortitude save." — the
//     card rolls the attack, and a hit starts the save (a degree worse on a critical hit);
//   - an attack, then a shock wave: "This weapon attacks using your spell attack modifier." / "On a hit, the weapon deals 7d12 force damage, or double
//     damage on a critical hit." / "… It emits in a @Template[line|…] line starting from the target …" / "Your target and any other creatures within the
//     area of the spell take … damage, with a basic Reflex save.";
//   - several attacks leaving lines: "Make a ranged spell attack roll against each target." (one penalty for all) and "each arrow leaves a line of
//     hazardous terrain between you and the target that lasts for 1 minute" — the module draws each line;
//   - a mark: "On a hit, you deal 6d8 void damage (or double damage on a critical hit) and place a mark on their body for the duration of the spell." /
//     "A marked creature is Enfeebled 1 and Stupefied 1." / "When a marked creature is reduced to 0 Hit Points, all other marked creatures become
//     Off-Guard and Clumsy 1 for 1 round.";
//   - an area's attack against each creature's Fortitude DC: "Make a spell attack roll against the Fortitude DC of each creature in the area." — teeth that
//     attach (damage, a Speed penalty, no Step), attempt again as a creature ends its turn there, and let go when it leaves;
//   - a charge: "You Fly up to 120 feet in a straight line to an empty space adjacent to the target creature and make a melee spell attack." with the
//     elemental effect chosen on the cast;
//   - a sustained hold: "make a spell attack roll against the targets. On a success, they're Immobilized until the spell ends or they Escape; on a
//     critical success, they're also Restrained …" and the held creatures' basic save, again on each Sustain.
import { capitalize as Stat, CONDITION_LINK_HYPHENATED as UUID, blocks, condition, plain, sentenceSplit as split } from "./text-patterns.js";

// (An attack whose miss does nothing: only its hit rows.)
const hitRows = (critical, hit) => `<hr /><p><strong>Critical Success</strong> ${critical}</p><p><strong>Success</strong> ${hit}</p>`;
// ("Heightened (+1) The damage increases by 1d8.": the stated dice at the rank.)
const ranked = (count, step, rank) => step ? `(${count} + ${step} * (@item.rank - ${rank}))` : String(count);

/** {parts, notes, claimed, options?, sustain?, markTrigger?} or null. */
export function extractAttackCard(adapted) {
    for (const reader of [attackThenSave, attackThenWave, arrowLines, doomMark, teethArea, cometCharge, sustainedHold]) { const found = reader(adapted); if (found) return found; }
    return null;
}

// (Every sentence read: the stated ones claimed, the rest flavour — no number, inline roll, damage or save left behind.)
const unread = (sentences, found) => sentences.filter(sentence => !found.some(match => match?.[0] === sentence)).filter(sentence => /\d|@|\b(?:damage|save|attack|Speed)\b/i.test(sentence));
const range = adapted => Number(/^(\d+) feet$/.exec(adapted.targeting?.range ?? "")?.[1] ?? NaN);

function attackThenSave(adapted) {
    const parts = blocks(adapted);
    if (parts.length !== 3 || adapted.defense?.basic !== true || !(adapted.activation?.traits ?? []).length) return null;
    const sentences = split(plain(parts[0]));
    const STATED = [/^Make a spell attack against the target\.$/,
        /^If you hit a creature, it takes (\d+)d(\d+) ([a-z]+) damage and (\d+)d(\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\.$/,
        /^If you critically hit, the target gets a result one degree of success worse than the outcome of its (Fortitude|Reflex|Will) save\.$/,
        /^If you hit a non-magical object that's made of organic material \([^)]*\), it melts away into a foul-smelling sludge\.$/, /^A single casting can destroy no more than a (\d+)-foot cube of matter\.$/];
    const found = STATED.map(pattern => sentences.map(sentence => pattern.exec(sentence)).find(Boolean));
    if (!found.every(Boolean) || unread(sentences, found).length) return null;
    const [, hit, worse, , cube] = found;
    const statistic = hit[7].toLowerCase();
    if (worse[1].toLowerCase() !== statistic || statistic !== adapted.defense.statistic) return null;
    const table = split(plain(parts[1]));
    // ("Failure … the target takes @Damage[2d12[persistent,acid]] damage." / "Critical Failure As failure, but the target takes double damage, plus
    // @Damage[4d12[persistent,acid]] damage.": the rows the save reads, each persistent roll stated with its row.)
    const ROW_STATED = [/^Critical Success The target is unaffected\.$/, /^Success The target takes half damage\.$/, /^Failure The target takes full damage\.$/,
        /^[A-Z][^.—]*—the target takes @Damage\[(\d+d\d+)\[persistent,([a-z]+)\]\] damage\.$/, /^Critical Failure As failure, but the target takes double damage, plus @Damage\[(\d+d\d+)\[persistent,([a-z]+)\]\] damage\.$/];
    const rowFound = ROW_STATED.map(pattern => table.map(sentence => pattern.exec(sentence)).find(Boolean));
    if (!rowFound.every(Boolean) || table.length !== ROW_STATED.length) return null;
    const [, , , failPersistent, critPersistent] = rowFound;
    const step = /^Heightened \(\+1\) The ([a-z]+) damage and ([a-z]+) damage each increase by (\d+)d(\d+)\.$/.exec(plain(parts[2]));
    if (!step || step[1] !== hit[3] || step[2] !== hit[6] || Number(step[4]) !== Number(hit[2]) || Number(step[4]) !== Number(hit[5])) return null;
    const rank = Number(adapted.rank);
    const formula = `{${ranked(hit[1], Number(step[3]), rank)}d${hit[2]}[${hit[3]}],${ranked(hit[4], Number(step[3]), rank)}d${hit[5]}[${hit[6]}]}`;
    const feet = range(adapted);
    if (!Number.isFinite(feet)) return null;
    return {
        parts: [{ key: "ray", title: "The attack, then the save", kind: "attack-save", range: feet, critWorse: true,
            saveSpec: { type: "save", statistic, basic: false, damage: { formula: `${hit[1]}d${hit[2]}`, type: hit[3] }, formula,
                html: `<p>The target takes ${hit[1]}d${hit[2]} ${hit[3]} damage and must attempt a ${Stat(statistic)} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
                    + `<p><strong>Success</strong> The target takes half damage.</p><p><strong>Failure</strong> The target takes full damage and @Damage[${failPersistent[1]}[persistent,${failPersistent[2]}]] damage.</p>`
                    + `<p><strong>Critical Failure</strong> The target takes double damage and @Damage[${critPersistent[1]}[persistent,${critPersistent[2]}]] damage.</p>` },
            repeat: { trigger: "the spell is cast again" }, reminder: `Target the creature: the module rolls the spell attack; on a hit, its basic ${Stat(statistic)} save (one degree worse on a critical hit).` }],
        notes: [`A hit on a non-magical object made of organic material melts it into sludge (no more than a ${cube[1]}-foot cube for a casting): the GM's.`],
        claimed: [...found.map(match => match[0]), ...table, plain(parts[2])]
    };
}

function attackThenWave(adapted) {
    const parts = blocks(adapted);
    if (parts.length !== 2 || adapted.defense?.basic !== true) return null;
    const sentences = split(plain(parts[0]));
    const STATED = [/^This weapon attacks using your spell attack modifier\.$/, /^On a hit, the weapon deals (\d+)d(\d+) ([a-z]+) damage, or double damage on a critical hit\.$/,
        /^After the attack, whether it succeeds or fails, divine energy bursts from the weapon in a shock wave\.$/,
        /^It emits in a @Template\[line\|distance:(\d+)\|width:(\d+)\]\{[^}]+\} line starting from the target and continuing in a direction you choose\.$/,
        /^Your target and any other creatures within the area of the spell take @Damage\[(\(ternary\(gte\(@item\.rank,(\d+)\),(\d+),(\d+)\)\)d(\d+)\[([a-z]+)\])\] damage, with a basic (Fortitude|Reflex|Will) save\.$/];
    const found = STATED.map(pattern => sentences.map(sentence => pattern.exec(sentence)).find(Boolean));
    if (!found.every(Boolean) || unread(sentences, found).length) return null;
    const [, hit, , line, wave] = found;
    const step = /^Heightened \((\d+)th\) The ([a-z]+) damage increases by (\d+)d(\d+), and the ([a-z]+) damage increases by (\d+)d(\d+)\.$/.exec(plain(parts[1]));
    const statistic = wave[7].toLowerCase();
    if (!step || step[2] !== hit[3] || Number(step[4]) !== Number(hit[2]) || step[5] !== wave[6] || Number(step[1]) !== Number(wave[2]) || Number(wave[3]) - Number(wave[4]) !== Number(step[6])
        || statistic !== adapted.defense.statistic) return null;
    const feet = range(adapted);
    if (!Number.isFinite(feet)) return null;
    const force = `(ternary(gte(@item.rank,${step[1]}),${Number(hit[1]) + Number(step[3])},${hit[1]}))`;
    return {
        parts: [
            { key: "strike", title: "The weapon's attack", kind: "action", spec: { type: "attack", range: feet, damage: { formula: `${force}d${hit[2]}`, type: hit[3] },
                rowsHTML: hitRows("The target takes double damage.", "The target takes full damage.") },
                repeat: { trigger: "the spell is cast again" }, reminder: "Target the creature: the weapon's spell attack." },
            { key: "wave", title: "The shock wave", kind: "action", spec: { type: "save", statistic, basic: true, area: true, areaShape: { type: "line", value: Number(line[1]) },
                damage: { formula: `${wave[4]}d${wave[5]}`, type: wave[6] }, formula: wave[1],
                html: `<p>Each creature takes ${wave[4]}d${wave[5]} ${wave[6]} damage (basic ${Stat(statistic)} save).</p>` },
                repeat: { trigger: "the spell is cast again" }, reminder: `After the attack, hit or miss: place the ${line[2]}-foot-wide, ${line[1]}-foot line from the target, then target it and the other creatures in it.` }],
        notes: ["The manifested weapon is the deity's favored weapon: flavour only."],
        claimed: [...found.map(match => match[0]), plain(parts[1])]
    };
}

function arrowLines(adapted) {
    const parts = blocks(adapted);
    if (parts.length !== 2 || adapted.defense?.kind !== "none" || !(adapted.activation?.traits ?? []).includes("attack")) return null;
    const sentences = split(plain(parts[0]));
    const STATED = [/^Make a ranged spell attack roll against each target\.$/, /^Each attack counts toward your multiple attack penalty, but you don't increase your penalty until you've made all your attacks\.$/,
        /^Each arrow deals (\d+)d(\d+) ([a-z]+) damage and (\d+)d(\d+) ([a-z]+) damage\.$/,
        /^Regardless of the result, each arrow leaves a line of hazardous terrain between you and the target that lasts for (\d+) minutes?\.$/,
        /^A creature that enters or starts its turn in the hazardous terrain takes @Damage\[(\d+)\[([a-z]+)\]\] damage; a creature can only be damaged by this hazardous terrain once per round\.$/,
        /^You summon a bow and launch up to (three) [^.]*\.$/];
    const found = STATED.map(pattern => sentences.map(sentence => pattern.exec(sentence)).find(Boolean));
    if (!found.every(Boolean) || unread(sentences, found).length) return null;
    const [, , arrow, lines, hazard] = found;
    const count = Number(/^up to (\d+) creatures$/.exec(adapted.targeting?.target ?? "")?.[1] ?? NaN), feet = range(adapted);
    if (count !== 3 || !Number.isFinite(feet)) return null;
    const table = split(plain(parts[1]));
    return {
        parts: [
            { key: "arrows", title: "The arrows", kind: "action", spec: { type: "attack", range: feet, count, // (The card's attack sentence: the same rule in the wording the spell-attack reader knows.)
                sharedPenalty: "Each attack counts toward your multiple attack penalty, but your penalty doesn't increase until you've made all your attacks.",
                damage: { formula: `${arrow[1]}d${arrow[2]}`, type: arrow[3] }, formula: `{${arrow[1]}d${arrow[2]}[${arrow[3]}],${arrow[4]}d${arrow[5]}[${arrow[6]}]}`, rowsHTML: `<hr />${parts[1]}` },
                repeat: { trigger: "the spell is cast again" }, reminder: `Target up to ${count} creatures: one spell attack each (the same multiple attack penalty for all).` },
            { key: "lines", title: "The lines of hazardous terrain", kind: "hazard", between: true, formula: hazard[1], type: hazard[2], events: ["enter", "turn-start"], oncePerRound: true,
                rounds: Number(lines[1]) * 10, label: "the hazardous terrain", reminder: `Each line deals ${hazard[1]} ${hazard[2]} damage to a creature entering it or starting its turn there, once per round.`,
                repeat: { trigger: "the spell is cast again" }, actionLabel: "target the creatures shot, then draw the lines" }],
        notes: [],
        claimed: [...found.map(match => match[0]), ...table]
    };
}

function doomMark(adapted) {
    const parts = blocks(adapted);
    if (parts.length !== 2 || adapted.defense?.kind !== "none" || !(adapted.activation?.traits ?? []).includes("attack")) return null;
    const sentences = split(plain(parts[0]));
    const STATED = [/^Whenever you Cast this Spell and the first time you Sustain this spell on subsequent turns, make a ranged spell attack against the AC of a creature within (\d+) feet\.$/,
        /^On a hit, you deal (\d+)d(\d+) ([a-z]+) damage \(or double damage on a critical hit\) and place a mark on their body for the duration of the spell\.$/,
        new RegExp(String.raw`^A marked creature is ${UUID} and ${UUID}\.$`),
        new RegExp(String.raw`^When a marked creature is reduced to 0 Hit Points, all other marked creatures become ${UUID} and ${UUID} for (\d+) rounds?\.$`)];
    const found = STATED.map(pattern => sentences.map(sentence => pattern.exec(sentence)).find(Boolean));
    if (!found.every(Boolean) || unread(sentences, found).length) return null;
    const [within, hit, marked, payoff] = found;
    const step = /^Heightened \(\+1\) The damage increases by (\d+)d(\d+)\.$/.exec(plain(parts[1]));
    const minutes = Number(/^(\d+) minutes?$/.exec(adapted.lifecycle?.duration ?? "")?.[1] ?? NaN);
    if (!step || Number(step[2]) !== Number(hit[2]) || !Number.isFinite(minutes)) return null;
    const rank = Number(adapted.rank);
    const mark = `${condition(marked[1], marked[2], marked[3])} and ${condition(marked[4], marked[5], marked[6])} for ${minutes} minute${minutes === 1 ? "" : "s"}`;
    return {
        parts: [{ key: "dart", title: "The dart", kind: "action", spec: { type: "attack", range: Number(within[1]), damage: { formula: `${ranked(hit[1], Number(step[1]), rank)}d${hit[2]}`, type: hit[3] },
            rowsHTML: hitRows(`The target takes double damage and is ${mark}.`, `The target takes full damage and is ${mark}.`) },
            repeat: { trigger: "the spell is cast or first Sustained on a later turn" }, reminder: `Target a creature within ${within[1]} feet: the spell attack; a hit marks it until the spell ends.` }],
        // (The marks: the card's record ends them with the spell; a marked creature at 0 Hit Points gives the others the stated conditions.)
        lasting: { seconds: minutes * 60, sustained: false },
        markTrigger: { conditions: [{ uuid: payoff[1], slug: payoff[2].toLowerCase(), value: payoff[3] ? Number(payoff[3]) : null }, { uuid: payoff[4], slug: payoff[5].toLowerCase(), value: payoff[6] ? Number(payoff[6]) : null }],
            rounds: Number(payoff[7]), sourceText: payoff[0] },
        notes: [],
        claimed: [...found.map(match => match[0]), ...sentences.filter(sentence => /^You launch a dart/.test(sentence)), plain(parts[1])]
    };
}

function teethArea(adapted) {
    const parts = blocks(adapted);
    if (parts.length !== 1 || adapted.targeting?.area?.type !== "burst") return null;
    const sentences = split(plain(parts[0]));
    const STATED = [/^This globe of pure darkness is identical to that created by a (\d+)(?:st|nd|rd|th)-rank @UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{([A-Za-z ]+)\} spell\.$/,
        /^Make a spell attack roll against the (Fortitude|Reflex|Will) DC of each creature in the area\.$/,
        /^Any creature that fails takes (\d+)d(\d+) ([a-z]+) damage as teeth attach to it\.$/,
        /^While the teeth are attached, it takes a [–-](\d+)-foot circumstance penalty to its Speeds and can't Step\.$/,
        /^Whenever a creature ends its turn in the area, the teeth attempt to attach to that creature if they haven't already, and they deal (\d+)d(\d+) ([a-z]+) damage to any creature they're already attached to\.$/,
        /^The shadowy teeth become unattached from any creature that leaves the area but can't otherwise be detached from a creature while that creature remains in the area\.$/,
        /^You can Dismiss the spell\.$/];
    const found = STATED.map(pattern => sentences.map(sentence => pattern.exec(sentence)).find(Boolean));
    if (!found.every(Boolean) || unread(sentences, found).length) return null;
    const [like, against, bite, slow, gnaw] = found;
    const minutes = Number(/^(\d+) minutes?$/.exec(adapted.lifecycle?.duration ?? "")?.[1] ?? NaN);
    if (!Number.isFinite(minutes)) return null;
    return {
        parts: [{ key: "teeth", title: "The ravenous darkness", kind: "teeth", place: { type: "burst", value: Number(adapted.targeting.area.value) }, seconds: minutes * 60,
            darkness: { uuid: like[2], name: like[3], rank: Number(like[1]) }, statistic: against[1].toLowerCase(), formula: `${bite[1]}d${bite[2]}`, type: bite[3],
            gnaw: `${gnaw[1]}d${gnaw[2]}`, gnawType: gnaw[3], speedPenalty: Number(slow[1]), traits: [],
            reminder: `Place the ${adapted.targeting.area.value}-foot burst: magical darkness (as rank-${like[1]} ${like[3]}); the module rolls the spell attack against each creature's ${against[1]} DC inside, then as each creature ends its turn there.` }],
        notes: [],
        claimed: [...found.map(match => match[0]), ...sentences.filter(sentence => /^(You create a shroud|Blunt, gnashing teeth)/.test(sentence))]
    };
}

function cometCharge(adapted) {
    const parts = blocks(adapted);
    const html = String(adapted.descriptionHTML ?? "");
    if (parts.length !== 1 || adapted.defense?.kind !== "none" || !/<ul>/.test(html)) return null;
    const intro = split(plain(html.split("<ul>")[0]));
    const STATED = [/^You Fly up to (\d+) feet in a straight line to an empty space adjacent to the target creature and make a melee spell attack\.$/,
        /^This movement doesn't trigger reactions, and you can fly through other creatures as part of this movement\.$/,
        new RegExp(String.raw`^If you began this movement at a higher elevation than your target, it's ${UUID} against this attack\.$`),
        /^When you Cast this Spell, choose one of the elemental effects below\.$/, /^The spell gains the traits listed, and the melee spell attack gains the chosen elemental effect\.$/];
    const found = STATED.map(pattern => intro.map(sentence => pattern.exec(sentence)).find(Boolean));
    if (!found.every(Boolean) || unread(intro, found).length) return null;
    const [fly, , offGuard] = found;
    const choices = [], claimed = [...found.map(match => match[0]), ...intro.filter(sentence => /^Wreathed in elemental power/.test(sentence))];
    for (const [, item] of html.matchAll(/<li>([\s\S]*?)<\/li>/g)) {
        const head = /^<p><strong>([^<]+)<\/strong> \(([a-z, ]+)\) /.exec(item.trim());
        if (!head) return null;
        const sentences = split(plain(item)).map((sentence, index) => index === 0 ? sentence.replace(`${head[1]} (${head[2]}) `, "") : sentence);
        const CRIT = /^On a critical hit, the target takes double damage\.$/;
        if (!sentences.some(sentence => CRIT.test(sentence))) return null;
        const hit = sentences.map(sentence => /^If you hit, the target takes (.+)\.$/.exec(sentence)).find(Boolean);
        if (!hit) return null;
        let m, spec = null, metal = null, extra = "", notes = [];
        const TAIL = new RegExp(String.raw`^(\d+)d(\d+) ([a-z]+) damage(?: and (\d+)d(\d+) persistent ([a-z]+) damage)?(?: and (?:takes a [–-](\d+)-foot circumstance penalty to its Speeds for (\d+) minutes?|is ${UUID} for (\d+) (round|minute)s?))?$`);
        if ((m = TAIL.exec(hit[1]))) {
            const formula = m[4] ? `{${m[1]}d${m[2]}[${m[3]}],${m[4]}d${m[5]}[persistent,${m[6]}]}` : `${m[1]}d${m[2]}[${m[3]}]`;
            if (m[7]) extra = ` and takes a –${m[7]}-foot circumstance penalty to its Speeds for ${m[8]} minute${m[8] === "1" ? "" : "s"}`;
            if (m[9]) extra = ` and is ${condition(m[9], m[10], m[11])} for ${m[12]} ${m[13]}${m[12] === "1" ? "" : "s"}`;
            spec = { formula, damage: { formula: `${m[1]}d${m[2]}`, type: m[3] } };
        } else if ((m = /^(\d+)d(\d+) ([a-z]+) damage, or (\d+)d(\d+) ([a-z]+) damage if the target is wearing metal armor or is primarily made of metal$/.exec(hit[1])) && m[3] === m[6]) {
            spec = { formula: `${m[1]}d${m[2]}[${m[3]}]`, damage: { formula: `${m[1]}d${m[2]}`, type: m[3] } };
            metal = { formula: `${m[4]}d${m[5]}[${m[6]}]`, damage: { formula: `${m[4]}d${m[5]}`, type: m[6] }, question: "Is the target wearing metal armor or primarily made of metal?" };
        } else return null;
        const rest = sentences.filter(sentence => sentence !== hit[0] && !CRIT.test(sentence));
        for (const sentence of rest) {
            if (/^You're wreathed in [a-z ]+\.$/.test(sentence)) continue;
            if (/^The target can Interact to remove the splinters and end the clumsy condition inflicted by this spell\.$/.test(sentence)) { notes.push("The target can Interact to remove the splinters (delete the Clumsy Effect)."); continue; }
            return null;
        }
        claimed.push(...sentences);
        const key = head[1].toLowerCase().replace(/[^a-z]+/g, "-");
        const attack = (damage, formula) => ({ type: "attack", range: 5, melee: true, damage, formula,
            rowsHTML: hitRows(`The target takes double damage${extra}.`, `The target takes full damage${extra}.`) });
        choices.push({ key, label: head[1], traits: head[2].split(/,\s*/), notes,
            parts: [
                { key: "charge", title: `${head[1]}: the charge`, kind: "charge", feet: Number(fly[1]), attack: "attack", ...(metal ? { metalAttack: "attack-metal", question: metal.question } : {}),
                    offGuard: { uuid: offGuard[1], slug: offGuard[2].toLowerCase() }, traits: [], reminder: `Target the creature: the caster flies up to ${fly[1]} feet to a space beside it, then the melee spell attack (the target Off-Guard if the caster began higher).` },
                { key: "attack", title: `${head[1]}: the attack`, kind: "action", hidden: true, spec: attack(spec.damage, spec.formula) },
                ...(metal ? [{ key: "attack-metal", title: `${head[1]}: the attack (metal)`, kind: "action", hidden: true, spec: attack(metal.damage, metal.formula) }] : [])] });
    }
    if (choices.length < 2) return null;
    return { options: { label: "elemental effect", choices }, parts: [], notes: ["The spell gains the chosen effect's traits."], claimed };
}

function sustainedHold(adapted) {
    const parts = blocks(adapted);
    if (parts.length !== 1 || adapted.defense?.basic !== true || adapted.lifecycle?.sustained !== true) return null;
    const sentences = split(plain(parts[0]));
    const HOLD = new RegExp(String.raw`^On a success, they're ${UUID} until the spell ends or they @UUID\[[^\]]+\]\{Escape\}; on a critical success, they're also ${UUID} until the spell ends or they Escape\.$`);
    const STATED = [/^When you cast the spell, make a spell attack roll against the targets\.$/, HOLD,
        /^Each target that's immobilized or restrained also takes (\d+)d(\d+) ([a-z]+) damage from the constricting waves, with a basic (Fortitude|Reflex|Will) save\.$/,
        /^The first time each subsequent round when you sustain the Spell, if all the targets aren't immobilized or restrained, make a spell attack roll against any targets who are free but remain within range, with the same effects as when you cast the spell, immobilizing or restraining them depending on your spell attack roll\.$/,
        /^Creatures who are immobilized or restrained take (\d+)d(\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\.$/];
    const found = STATED.map(pattern => sentences.map(sentence => pattern.exec(sentence)).find(Boolean));
    if (!found.every(Boolean) || unread(sentences, found).length) return null;
    const [, hold, crush, , again] = found;
    const statistic = crush[4].toLowerCase();
    if (statistic !== adapted.defense.statistic || again.slice(1).join() !== crush.slice(1).join()) return null;
    const count = Number(/^(\d+) creatures$/.exec(adapted.targeting?.target ?? "")?.[1] ?? NaN), feet = range(adapted);
    if (!Number.isFinite(count) || !Number.isFinite(feet)) return null;
    const immobilized = condition(hold[1], hold[2]), restrained = condition(hold[4], hold[5]);
    return {
        parts: [
            { key: "bind", title: "The strands' attack", kind: "action", spec: { type: "attack", range: feet, count, noDamage: true,
                // (Until it Escapes — or the spell ends: the card's record holds the Effects and ends them with the spell.)
                rowsHTML: hitRows(`The target is ${immobilized} and ${restrained} until it Escapes.`, `The target is ${immobilized} until it Escapes.`) },
                repeat: { trigger: "the spell is first Sustained in a round (only the free targets still in range)" }, reminder: `Target the creatures (up to ${count}): one spell attack each.` },
            { key: "crush", title: "The constricting waves", kind: "action", spec: { type: "save", statistic, basic: true, area: true, damage: { formula: `${crush[1]}d${crush[2]}`, type: crush[3] },
                html: `<p>Each creature takes ${crush[1]}d${crush[2]} ${crush[3]} damage (basic ${Stat(statistic)} save).</p>` },
                repeat: { trigger: "the spell is cast or Sustained" }, reminder: "Target the creatures immobilized or restrained by the strands." }],
        lasting: { seconds: 600, sustained: true },
        notes: [],
        claimed: [...found.map(match => match[0]), ...sentences.filter(sentence => /^You wrap enemies/.test(sentence))]
    };
}
