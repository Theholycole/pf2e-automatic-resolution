// Small basic-save spells whose sentences only need the ordinary wording (each read whole):
//   Desiccate — "You pull the moisture from the targets' bodies, dealing 10d10 void damage. Creatures made of water (such as water elementals) and plant creatures use
//   the outcome for one degree of success worse than the result of their saving throw. Creatures whose bodies contain no significant moisture (such as earth elementals)
//   are immune to desiccate." — the basic save on the living targets, water and plant creatures one degree worse (their PF2e traits), a creature without moisture the
//   GM's question (unaffected);
//   Unfolding Wind Crash — "You jump up to 120 feet in any direction and then deal 18d6 bludgeoning damage to creatures within a 20‐foot emanation after you land, with a
//   basic Reflex save. Creatures who critically fail are also knocked {Prone}." — the jump the caster's reminder, the basic save in the emanation where they land,
//   Prone on a critical failure.
import { htmlToPlainText } from "./description-parser.js";

const MOISTURE = {
    pull: /^You pull the moisture from the targets' bodies, dealing (\d+d\d+) ([a-z]+) damage\.$/,
    worse: /^Creatures made of water \(such as water elementals\) and plant creatures use the outcome for one degree of success worse than the result of their saving throw\.$/,
    immune: /^Creatures whose bodies contain no significant moisture \(such as earth elementals\) are immune to [a-z]+\.$/
};
const JUMP = /^You jump up to (\d+) feet in any direction and then deal (\d+d\d+) ([a-z]+) damage to creatures within an? (\d+)[‐-]foot emanation after you land, with a basic (Fortitude|Reflex|Will) save\.$/;
// Dimensional Excision — "… The creature takes 14d10 damage (no damage type) and 2d10 persistent bleed damage and must attempt a Will save. If the target is not on its
// home plane, it takes a –4 status penalty to this save. A creature reduced to 0 HP has their entire body sectioned out and banished across multiple planes and
// dimensions, leaving nothing behind but their gear." — the basic save on both entries, the GM's home-plane question (its penalty), and death at 0 HP.
const EXCISE = {
    takes: /^The creature takes (\d+d\d+) damage \((no damage type)\) and (\d+d\d+) persistent ([a-z]+) damage and must attempt an? (Fortitude|Reflex|Will) save\.$/,
    home: /^If the target is not on its home plane, it takes a [–-]\d status penalty to this save\.$/,
    gone: /^A creature reduced to 0 HP has their entire body [^.]+, leaving nothing behind but their gear\.$/
};
const KNOCKED = /^Creatures who critically fail are also knocked (@UUID\[[^\]]+\]\{Prone\})\.$/;

// Frigid Flurry — "<strong>Area</strong> (continued) line up to 120 feet" / "… The flurry deals 9d6 cold damage and 9d6 slashing damage to all foes, with a basic Reflex
// save, but the gust flows harmlessly around your allies. The wind then picks you up and carries you to the other end of the area. While carried this way, you
// temporarily transform into a flurry of snow crystals and become immune to all damage and effects except fire damage, effects with the fire trait, and any other effect
// the GM decides would affect snow." — the basic save for the enemies in the line; the carry and its immunity the caster's reminder.
const FOES = /^The [a-z]+ deals (\d+d\d+) ([a-z]+) damage and (\d+d\d+) ([a-z]+) damage to all foes, with a basic (Fortitude|Reflex|Will) save, but the [a-z]+ flows harmlessly around your allies\.$/;
const CARRIED = /^The wind then picks you up and carries you to the other end of the area\.$/;
const CARRY_IMMUNE = /^While carried this way, you temporarily transform into [^,]+ and become immune to all damage and effects except ([a-z]+) damage, effects with the \1 trait, and any other effect the GM decides would affect [a-z]+\.$/;
const AREA_LEAD = /^<p>\s*<strong>Area<\/strong>\s*\(continued\) line up to (\d+) feet\s*<\/p>$/;
const NARRATION = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i;
const split = html => html.replace(/<\/?p>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
const matches = (adapted, formula, type, statistic) => (adapted.damageComponents ?? []).length === 1 && String(adapted.damageComponents[0].formula).replace(/\s+/g, "") === formula
    && String(adapted.damageComponents[0].type).toLowerCase() === type && statistic.toLowerCase() === adapted.defense.statistic;

/** {html, area?, constraints?, reminders, sentences} or null. */
export function rewriteSmallSave(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const heightened = rest.length ? `<hr />${rest.join("<hr />")}` : "";
    const sentences = split(body), plain = sentences.map(sentence => htmlToPlainText(sentence));
    // Desiccate.
    if (sentences.length === 3 && /^any number of living creatures$/i.test(String(adapted.targeting?.target ?? "").trim()) && MOISTURE.worse.test(plain[1]) && MOISTURE.immune.test(plain[2])) {
        const pull = MOISTURE.pull.exec(plain[0]);
        if (!pull || !matches(adapted, pull[1], pull[2], adapted.defense.statistic)) return null;
        const statistic = adapted.defense.statistic[0].toUpperCase() + adapted.defense.statistic.slice(1);
        return { html: `<p>Each target takes ${pull[1]} ${pull[2]} damage with a basic ${statistic} save. Creatures with the water or plant traits get a result one degree of success worse than they rolled.</p>${heightened}`,
            constraints: { sourceText: "any number of living creatures (those without significant moisture immune: the GM's)", supportsActorTargets: true, complete: true,
                predicates: [{ kind: "living-creature" }, { kind: "gm-confirmed", question: "Does its body contain significant moisture? A creature without it (such as an earth elemental) is immune.", sourceText: plain[2] }] },
            reminders: [], sentences: plain };
    }
    // Dimensional Excision.
    if (sentences.length === 4 && /^1 creature$/i.test(String(adapted.targeting?.target ?? "").trim())) {
        const takes = EXCISE.takes.exec(plain[1]), home = EXCISE.home.exec(plain[2]);
        const components = adapted.damageComponents ?? [];
        const direct = components.find(component => !component.category), persistent = components.find(component => component.category === "persistent");
        if (!takes || !home || !EXCISE.gone.test(plain[3]) || NARRATION.test(plain[0].replace(/\bbanish(?:ing|es)?\b/g, "")) || components.length !== 2 || !direct || !persistent
            || takes[5].toLowerCase() !== adapted.defense.statistic || String(direct.formula).replace(/\s+/g, "") !== takes[1] || String(persistent.formula).replace(/\s+/g, "") !== takes[3]
            || String(persistent.type).toLowerCase() !== takes[4] || !(String(direct.type).toLowerCase() === "untyped" && takes[2] === "no damage type")) return null;
        const statistic = takes[5];
        const lead = `The creature takes ${takes[1]} damage and ${takes[3]} persistent ${takes[4]} damage with a basic ${statistic} save.`;
        return { html: `<p>${lead} ${plain[2]} If this damage reduces the creature to 0 Hit Points, it dies.</p>${heightened}`,
            basicPersistent: lead, reminders: [{ kind: "spell-note", text: `${plain[3]} (Its gear stays where it was.)`, sourceText: plain[3] }], sentences: plain.slice(1) };
    }
    // Spirit Song: "…, dealing 14d6 spirit damage that causes their bodies to momentarily freeze up …, depending on the result of their Fortitude save." / "The
    // vibrating waves … penetrate into, but not through, solid barriers, …" with rows "The creature takes no damage." / "… half damage and can't use reactions
    // until the beginning of its turn." / "… full damage, can't use reactions until the beginning of its turn, and is {Stunned 1}." / "… double damage, …, and is
    // {Stunned 2}." — the basic save with its Stunned rider; the lost reactions a note on each of those rows (until the creature's turn starts); the barriers
    // the GM's reminder.
    const song = rewriteReactionRows(adapted, rest);
    if (song) return song;
    // Frigid Flurry.
    if (adapted.targeting?.area?.type === "line") {
        const [lead, body, ...steps] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(part => part.trim());
        const area = AREA_LEAD.exec(lead ?? "");
        if (!area || !body || Number(area[1]) !== Number(adapted.targeting.area.value)) return null;
        const lines = split(body).map(sentence => htmlToPlainText(sentence));
        const at = lines.findIndex(sentence => FOES.test(sentence));
        if (at < 0 || lines.length !== at + 3 || lines.slice(0, at).some(sentence => NARRATION.test(sentence)) || !CARRIED.test(lines[at + 1]) || !CARRY_IMMUNE.test(lines[at + 2])) return null;
        const foes = FOES.exec(lines[at]);
        const components = adapted.damageComponents ?? [];
        const wanted = [[foes[1], foes[2]], [foes[3], foes[4]]];
        if (foes[5].toLowerCase() !== adapted.defense.statistic || components.length !== 2 || !wanted.every(([dice, type]) => components.some(component => String(component.formula).replace(/\s+/g, "") === dice && String(component.type).toLowerCase() === type))) return null;
        return { html: `<p>Each creature in the area takes ${foes[1]} ${foes[2]} damage and ${foes[3]} ${foes[4]} damage with a basic ${foes[5]} save.</p>${steps.length ? `<hr />${steps.join("<hr />")}` : ""}`,
            enemiesOnly: true,
            reminders: [{ kind: "caster-movement", text: `${lines[at + 1]} ${lines[at + 2]} (Move the caster's token to the line's far end; the immunity lasts only for that move.)`, sourceText: lines[at + 1] }],
            sentences: lines.slice(at) };
    }
    // Unfolding Wind Crash.
    if (sentences.length === 2 && !adapted.targeting?.area && !String(adapted.targeting?.target ?? "").trim()) {
        const jump = JUMP.exec(plain[0]), knocked = KNOCKED.exec(sentences[1]);
        if (!jump || !knocked || !matches(adapted, jump[2], jump[3], jump[5])) return null;
        return { html: `<p>Each creature in the area takes ${jump[2]} ${jump[3]} damage with a basic ${jump[5]} save. A creature that critically fails its save is also knocked ${knocked[1]}.</p>${heightened}`,
            area: { type: "emanation", value: Number(jump[4]) },
            reminders: [{ kind: "caster-movement", text: `The caster jumps up to ${jump[1]} feet in any direction: move the token. The ${jump[4]}-foot emanation is centred where they land: target the creatures in it.`, sourceText: plain[0] }],
            sentences: plain };
    }
    return null;
}

// Row wordings the readers take once reworded (each whole sentence matched):
//   Suffocate — "The creature takes double damage, and all the air is pulled from the creature's lungs. The creature falls {Unconscious} and starts suffocating for
//   the duration." — double damage and Unconscious; the suffocation the row's note (as the failure's "must hold its breath or suffocate").
const ROW_REWRITES = [
    [/<strong>Critical Failure<\/strong> The creature takes double damage, and all the air is pulled from the creature's lungs\. The creature falls (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Unconscious\}) and starts suffocating for the duration\./,
        (match, unconscious) => `<strong>Critical Failure</strong> The creature takes double damage and is ${unconscious}. For the duration, the creature is suffocating.`],
    // "The target spends the first action on its next turn with the {Confused} condition." (Warp Mind's success): the condition until its first action.
    [/(<strong>(?:Success|Failure)<\/strong>) The target spends the first action on its next turn with the (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Z][a-z]+\}) condition\./,
        (match, heading, condition) => `${heading} The target is ${condition} until it has completed its first action on its next turn.`]
];

// Teleports the caster chooses, on rows that also deal damage (Sudden Transposition): "Critical Success The target can teleport if it wants, but it chooses the
// destination within the area." / "Failure You teleport the target and choose its destination; the target takes 10d10 bludgeoning damage." / "Critical Failure You
// teleport the target and choose its destination; the target takes @Damage[20d10[bludgeoning]] damage and is knocked {Prone}." — the damage (20d10 is the item's
// 10d10 doubled) and Prone on the rows; each teleport the GM's reminder (move the token).
const TELEPORT_ROWS = {
    criticalSuccess: /<strong>Critical Success<\/strong> The target can teleport if it wants, but it chooses the destination within the area\./,
    failure: /<strong>Failure<\/strong> You teleport the target and choose its destination; the target takes (\d+d\d+) ([a-z]+) damage\./,
    criticalFailure: /<strong>Critical Failure<\/strong> You teleport the target and choose its destination; the target takes @Damage\[(\d+)d(\d+)\[([a-z]+)\]\] damage and is knocked (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Prone\})\./
};

// A save with no table, its two outcomes in one sentence (Frost Pillar): "Ice crystallizes around a creature, imprisoning it within an icy pillar. On a successful
// saving throw, the creature is pushed to an adjacent space of its choice; otherwise, it's frozen inside the pillar and becomes {Restrained} as its body can barely
// move within the ice. The ice has AC 10, Hardness 10, and 60 Hit Points; it's immune to critical hits, cold damage, and precision damage, and it has weakness 15 to
// fire. If the ice is destroyed, the creature within is freed and the spell immediately ends." — the rows: a success unaffected (it steps aside: the GM's reminder),
// a failure Restrained while the spell lasts; the ice's statistics the GM's reminder.
const PILLAR = {
    split: /^On a successful saving throw, the creature is pushed to an adjacent space of its choice; otherwise, it's frozen inside the [a-z]+ and becomes (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Restrained\}) as [^.]+\.$/,
    stats: /^The ([a-z]+) has AC (\d+), Hardness (\d+), and (\d+) Hit Points; it's immune to critical hits, ([a-z]+) damage, and precision damage, and it has weakness (\d+) to ([a-z]+)\.$/,
    freed: /^If the [a-z]+ is destroyed, the creature within is freed and the spell immediately ends\.$/
};
function rewritePillar(adapted) {
    if (!/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim()) || (adapted.damageComponents ?? []).length) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<hr\s*\/?>|<strong>/i.test(html)) return null;
    const sentences = split(html), plain = sentences.map(sentence => htmlToPlainText(sentence));
    const at = sentences.findIndex(sentence => PILLAR.split.test(sentence));
    if (at < 0 || sentences.length !== at + 3 || plain.slice(0, at).some(sentence => NARRATION.test(sentence)) || !PILLAR.stats.test(plain[at + 1]) || !PILLAR.freed.test(plain[at + 2])) return null;
    const restrained = PILLAR.split.exec(sentences[at])[1], stats = PILLAR.stats.exec(plain[at + 1]);
    const statistic = adapted.defense.statistic[0].toUpperCase() + adapted.defense.statistic.slice(1);
    return { html: `<p>${sentences.slice(0, at).join(" ")} The target must attempt a ${statistic} save.</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Failure</strong> The creature is ${restrained}.</p><p><strong>Critical Failure</strong> The creature is ${restrained}.</p>`,
        sentences: plain.slice(at),
        reminders: [{ kind: "object-hold", text: `On a success (or critical success) the creature moves to an adjacent space of its choice (move its token). On a failure it's frozen in the ${stats[1]}: an object with AC ${stats[2]}, Hardness ${stats[3]}, ${stats[4]} Hit Points, immune to critical hits, ${stats[5]} and precision damage, weakness ${stats[6]} to ${stats[7]}. Destroying it frees the creature and ends the spell (end the Effect).`, sourceText: plain[at + 1] }] };
}

// A spell whose lead states the condition and whose rows give only its duration and a compulsion (Uncontrollable Dance): "For the duration of the spell, the target
// is {Off-Guard} and can't use reactions. While affected, the creature can't use move actions except to dance, using the Stride action to move up to half its
// Speed." with rows "The spell's duration is 3 rounds, and the target must spend at least 1 action each turn dancing." — each row the condition for its time,
// and the compulsion (no reactions, dancing at half Speed, the actions it must spend) as the row's behaviour note.
const DANCE = {
    lead: /^For the duration of the spell, the target is (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Z][A-Za-z-]+\}) and can't use reactions\.$/,
    move: /^While affected, the creature can't use move actions except to ([a-z]+), using the Stride action to move up to half its Speed\.$/,
    row: /^The spell's duration is (\d+ (?:round|minute)s?), and the target must spend (at least \d+ actions?|all its actions) each turn ([a-z]+)\.$/
};
function rewriteCompulsionRows(adapted) {
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(part => part.trim());
    if (!table || rest.length) return null;
    const lead = split(body);
    const at = lead.findIndex(sentence => DANCE.lead.test(sentence));
    if (at < 0 || lead.length !== at + 2 || lead.slice(0, at).some(sentence => NARRATION.test(htmlToPlainText(sentence))) || !DANCE.move.test(htmlToPlainText(lead[at + 1]))) return null;
    const condition = DANCE.lead.exec(lead[at])[1], verb = DANCE.move.exec(htmlToPlainText(lead[at + 1]))[1];
    const paragraphs = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => paragraphs.find(text => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(text))?.replace(/^<strong>[^<]*<\/strong>\s*/, "");
    if (paragraphs.length !== 4 || row("Critical Success") !== "The target is unaffected.") return null;
    const rows = ["Success", "Failure", "Critical Failure"].map(heading => DANCE.row.exec(row(heading) ?? ""));
    // ("dance" → "dancing")
    if (rows.some(match => !match || match[3].replace(/ing$/, "") !== verb.replace(/e$/, ""))) return null;
    const line = match => `The target is ${condition} for ${match[1]}. It can't use reactions, it ${verb}s at half its Speed instead of moving normally, and it must spend ${match[2]} each turn ${match[3]}.`;
    return { html: `<p>${lead.slice(0, at).join(" ")}</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
            + rows.map((match, index) => `<p><strong>${["Success", "Failure", "Critical Failure"][index]}</strong> ${line(match)}</p>`).join(""),
        sentences: [htmlToPlainText(lead[at]), htmlToPlainText(lead[at + 1]), ...rows.map(match => match[0])], reminders: [] };
}

// A thrown missile in a burst or a line (Telekinetic Bombardment): "Your missile crashes down in either a {burst 10} (for most missiles) or a {line 30} (for something
// long and tall, like a tree or a ship's mast), dealing 14d6 bludgeoning damage and turning its area into difficult terrain as it breaks into rubble. All creatures in
// the area must attempt a Reflex save. If the area is a line, it doesn't have to start from your square but can instead start anywhere in range, as long as the
// entire area remains within range." — the save on the creatures the GM targets in the chosen shape; the shape and the rubble's difficult terrain the reminder.
const LOB = /^(<p>[^<]*?\.) Your missile crashes down in either a @Template\[type:burst\|distance:(\d+)\] \(for most missiles\) or a @Template\[type:line\|distance:(\d+)\] \(for something long and tall, like a tree or a ship's mast\), dealing (@Damage\[(?:[^\[\]]|\[[^\]]*\])+\]) damage and turning its area into difficult terrain as it breaks into rubble\. (All creatures in the area must attempt an? (?:Fortitude|Reflex|Will) save\.) (If the area is a line, it doesn't have to start from your square but can instead start anywhere in range, as long as the entire area remains within range\.)<\/p>/;
function rewriteLob(adapted) {
    const html = String(adapted.descriptionHTML ?? ""), match = LOB.exec(html);
    if (!match || NARRATION.test(htmlToPlainText(match[1]).replace(/—[^—]+—/, ""))) return null;
    const claimed = htmlToPlainText(match[0]).replace(/\s+/g, " ").trim();
    return { html: html.replace(match[0], `${match[1]} It deals ${match[4]} damage. ${match[5]}</p>`), sentences: [claimed],
        reminders: [{ kind: "area-shape", text: `Place a ${match[2]}-foot burst, or a ${match[3]}-foot line for something long and tall (it can start anywhere in range, as long as it's all within range), and target the creatures in it. Its area becomes difficult terrain (rubble): mark it on the map.`, sourceText: claimed }] };
}

/** {html, sentences, reminders} or null: a degree table's rows reworded. */
export function rewriteSaveRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic) return null;
    const pillar = rewritePillar(adapted) ?? rewriteCompulsionRows(adapted) ?? rewriteLob(adapted);
    if (pillar) return pillar;
    let html = String(adapted.descriptionHTML ?? ""), sentences = [];
    const reminders = [];
    const components = adapted.damageComponents ?? [];
    const teleport = Object.fromEntries(Object.entries(TELEPORT_ROWS).map(([degree, pattern]) => [degree, pattern.exec(html)]));
    if (Object.values(teleport).every(Boolean) && components.length === 1 && String(components[0].formula).replace(/\s+/g, "") === teleport.failure[1]
        && String(components[0].type).toLowerCase() === teleport.failure[2] && teleport.criticalFailure[3] === teleport.failure[2]
        && `${Number(teleport.criticalFailure[1]) / 2}d${teleport.criticalFailure[2]}` === teleport.failure[1]) {
        const claimed = Object.values(teleport).map(match => htmlToPlainText(match[0].replace(/<\/?strong>/g, "")).trim());
        html = html.replace(teleport.criticalSuccess[0], "<strong>Critical Success</strong> The target is unaffected.")
            .replace(teleport.failure[0], "<strong>Failure</strong> The target takes full damage.")
            .replace(teleport.criticalFailure[0], `<strong>Critical Failure</strong> The target takes double damage and is knocked ${teleport.criticalFailure[4]}.`);
        return { html, sentences: claimed, reminders: [{ kind: "teleport", text: "Teleport: on a failure or critical failure, the caster moves the target's token to an unoccupied space of their choice entirely within the area and in their line of sight; on a critical success, the target may move itself there instead.", sourceText: claimed.join(" ") }] };
    }
    // "dealing 8d10 cold damage to creatures in the area, plus an additional 8d4 void damage to living creatures" (Eclipse Burst): the item's two entries together —
    // PF2e's void damage already harms only the living (its own rule for undead and constructs).
    const living = /dealing (\d+d\d+) ([a-z]+) damage to ([a-z ]+), plus an additional (\d+d\d+) void damage to living creatures\./.exec(html);
    if (living && components.length === 2 && [[living[1], living[2]], [living[4], "void"]].every(([dice, type]) => components.some(component => String(component.formula).replace(/\s+/g, "") === dice && String(component.type).toLowerCase() === type))) {
        sentences.push(htmlToPlainText(living[0]));
        html = html.replace(living[0], `dealing ${living[1]} ${living[2]} damage and ${living[4]} void damage to ${living[3]}.`);
    }
    // "takes double the mental damage" (Hypnopompic Terrors' critical failure), when that type is the spell's only damage: double damage.
    // (Only with no other damage in the text — an inline or persistent roll keeps "the void damage" distinct: Grim Tendrils.)
    const only = components.length === 1 && !/@Damage\[|\bpersistent\b/i.test(html) ? String(components[0].type).toLowerCase() : null;
    if (only) for (const [phrase, plain] of [["double the", "double"], ["half the", "half"], ["the full", "full"]]) {
        const wording = new RegExp(`\\btakes ${phrase} ${only} damage\\b`, "g");
        if (wording.test(html)) { sentences.push(`takes ${phrase} ${only} damage`); html = html.replace(wording, `takes ${plain} damage`); }
    }
    // "is paralyzed for 2 rounds" in a row, where a row before links Paralyzed: the same condition, linked.
    // (Each linked condition's id, by name: "{Slowed 1}" is Slowed's.)
    const links = new Map([...html.matchAll(/@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+)(?: \d+)?\}/g)].map(match => [match[2].toLowerCase(), match[1]]));
    const link = (name, label) => `@UUID[${links.get(name)}]{${label}}`;
    html = html.replace(/(<strong>(?:Critical Success|Success|Failure|Critical Failure)<\/strong>[^<]*?\bis )([a-z]+)( for \d+ (?:round|minute)s?\b)/g, (all, before, name, after) => {
        if (!links.has(name)) return all;
        sentences.push(`is ${name}${after}`);
        return `${before}${link(name, name[0].toUpperCase() + name.slice(1))}${after}`;
    });
    // "Critical Failure The creature takes double damage, is {Immobilized} by a layer of ice, and is slowed 1 as long as it's immobilized. The ice is an object with
    // 60 Hit Points, Hardness 5, immunity to cold damage, and vulnerability 10 to fire. It has object immunities and is destroyed if the target Escapes." (Arctic
    // Rift): Immobilized and Slowed 1 until it Escapes (the spell DC); the ice's statistics the GM's reminder (breaking it frees the creature).
    const ice = /<strong>Critical Failure<\/strong> The creature takes double damage, is (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Immobilized\}) by a layer of ice, and is slowed 1 as long as it's immobilized\. The ice is an object with (\d+) Hit Points, Hardness (\d+), immunity to ([a-z]+) damage, and vulnerability (\d+) to ([a-z]+)\. It has object immunities and is destroyed if the target Escapes\./.exec(html);
    if (ice && links.has("slowed")) {
        const step = /The damage increases by \d+d\d+ and the ice's Hit Points increase by (\d+)\./.exec(htmlToPlainText(html));
        sentences.push(htmlToPlainText(ice[0].replace(/<\/?strong>/g, "")).trim());
        html = html.replace(ice[0], `<strong>Critical Failure</strong> The creature takes double damage and is ${ice[1]} and ${link("slowed", "Slowed 1")} until it Escapes.`);
        reminders.push({ kind: "object-hold", text: `A critically failing creature is held by ice: an object with ${ice[2]} Hit Points${step ? ` (+${step[1]} per rank above ${adapted.rank})` : ""}, Hardness ${ice[3]}, immunity to ${ice[4]} and object immunities, and weakness ${ice[5]} to ${ice[6]}. Destroying the ice frees it (remove its Immobilized and Slowed).`, sourceText: sentences.at(-1) });
    }
    for (const [pattern, replace] of ROW_REWRITES) {
        const match = pattern.exec(html);
        if (!match) continue;
        sentences.push(htmlToPlainText(match[0].replace(/<\/?strong>/g, "")).trim());
        html = html.replace(pattern, replace);
    }
    // "Warp mind's effects happen instantly, so {Dispel Magic} and other effects that counteract spells can't counteract them. However, {Wish} rituals and abilities
    // that can remove non-magical effects can still counteract the effects." (Warp Mind): what can end the conditions, the GM's reminder.
    const instant = /\s*[A-Z][a-z]+(?: [a-z]+)*'s effects happen instantly, so @UUID\[[^\]]+\]\{([A-Za-z ]+)\} and other effects that counteract spells can't counteract them\. However, @UUID\[[^\]]+\]\{([A-Za-z ]+)\} rituals and abilities that can remove non-magical effects can still counteract the effects\./.exec(html.split(/<hr\s*\/?>/i)[0]);
    if (instant) {
        const plain = htmlToPlainText(instant[0]).trim();
        sentences.push(plain);
        reminders.push({ kind: "spell-note", text: `The effects are instant: ${instant[1]} and other effects that counteract spells can't end them, but ${instant[2]} and abilities that remove non-magical effects can.`, sourceText: plain });
        html = html.replace(instant[0], "");
    }
    // "After the stunned condition ends, the creature is confused for the remaining duration of the spell." (Confusing Colors' critical failure): the
    // later condition a note on the row (the GM applies it once the first ends), for the spell's duration.
    const notes = [], recurring = [];
    const then = / After the ([a-z]+) condition ends, the creature is ([a-z]+) for the remaining duration of the spell\./.exec(html);
    const spell = /^(\d+) (round|minute)s?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (then && spell && links.has(then[1]) && links.has(then[2])) {
        const cap = word => word[0].toUpperCase() + word.slice(1);
        const row = /<strong>(Critical Success|Success|Failure|Critical Failure)<\/strong>(?:(?!<strong>)[\s\S])*$/.exec(html.slice(0, then.index))?.[1];
        if (row) {
            sentences.push(then[0].trim());
            notes.push({ degree: { "Critical Success": "criticalSuccess", Success: "success", Failure: "failure", "Critical Failure": "criticalFailure" }[row],
                note: { label: `Then ${cap(then[2])}`, text: `When the ${cap(then[1])} condition from this spell ends, the creature is ${cap(then[2])} for the rest of the spell: apply it then.`, sourceText: then[0].trim(),
                    duration: { mode: "fixed", value: Number(spell[1]), unit: `${spell[2]}s`, expiry: "turn-start", anchor: "effect-start", offset: 0, sustained: adapted.lifecycle?.sustained === true, sourceText: "the remaining duration of the spell" } } });
            html = html.replace(then[0], "");
        }
    }
    // "The creature is Blinded by the pattern. If it exits the pattern, it can attempt a new save to recover from the Blinded condition at the end of each of
    // its turns, to a maximum duration of 1 minute." (Vibrant Pattern): the condition for that long, ended by a save at the end of each of its turns once it's
    // outside the area.
    const exit = /<strong>(Failure|Critical Failure)<\/strong> The creature is ([A-Z][a-z]+) by the ([a-z]+)\. If it exits the \3, it can attempt a new save to recover from the \2 condition at the end of each of its turns, to a maximum duration of (\d+) (round|minute)s?\./.exec(html);
    if (exit && links.has(exit[2].toLowerCase())) {
        sentences.push(htmlToPlainText(exit[0].replace(/<\/?strong>/g, "")).trim());
        recurring.push({ degree: exit[1] === "Failure" ? "failure" : "criticalFailure", slug: exit[2].toLowerCase(),
            recurringSave: { timing: "turn-end", mode: "end", statistic: adapted.defense.statistic, outsideArea: true, sourceText: htmlToPlainText(exit[0].replace(/<strong>[^<]*<\/strong>/, "")).trim() } });
        html = html.replace(exit[0], `<strong>${exit[1]}</strong> The creature is ${link(exit[2].toLowerCase(), exit[2])} for ${exit[4]} ${exit[5]}${exit[4] === "1" ? "" : "s"}.`);
    }
    // Entrancing Eyes: "Critical Success The target is unaffected and becomes immune to this particular casting of the spell." (immune to this caster's
    // spell for its duration), the critical failure's "… and can't take reactions. In addition, all creatures and objects other than you are {Concealed} from
    // the target." (a note for the row's time), and the paragraph after the table — "During any round you Sustain the Spell, you can use a single action, …,
    // to focus your entrancing eyes on a single creature you can see within 30 feet. This creature must immediately make a Will save against the spell as if
    // it were ending its turn in the emanation. If the creature was already Fascinated by your entrancing eyes before its save, a failed save causes it to be
    // {Paralyzed} for 1 round. You can't use this action to focus on the same creature more than once per round." — the GM's control exposing the targeted
    // creature, the Paralyzed a note on the failing rows.
    let immunity = null, focus = null, dominate = null;
    const castingImmune = /<strong>Critical Success<\/strong> The target is unaffected and becomes immune to this particular casting of the spell\./.exec(html);
    const spellSpan = /^(\d+) (minute|hour)s?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (castingImmune && spellSpan) {
        sentences.push(htmlToPlainText(castingImmune[0].replace(/<\/?strong>/g, "")).trim());
        immunity = { degrees: ["criticalSuccess"], byCaster: true, duration: { value: Number(spellSpan[1]), unit: `${spellSpan[2]}s` }, sourceText: htmlToPlainText(castingImmune[0].replace(/<strong>[^<]*<\/strong>/, "")).trim() };
        html = html.replace(castingImmune[0], "<strong>Critical Success</strong> The target is unaffected.");
    }
    const eyesCritical = /(<strong>Critical Failure<\/strong> Until the end of its next turn, the target is (@UUID\[[^\]]+\]\{[A-Z][a-z]+ \d\}), (?:@UUID\[[^\]]+\]\{)?Fascinated\}?), and can't take reactions\. In addition, all creatures and objects other than you are (?:@UUID\[[^\]]+\]\{Concealed\}|concealed) from the target\./.exec(html);
    if (eyesCritical && links.has("fascinated")) {
        sentences.push(htmlToPlainText(eyesCritical[0].replace(/<\/?strong>/g, "")).trim());
        notes.push({ degree: "criticalFailure", note: { label: "Entranced", text: "Until the end of its next turn, the creature can't take reactions, and all creatures and objects other than the caster are Concealed from it.",
            sourceText: htmlToPlainText(eyesCritical[0].replace(/<strong>[^<]*<\/strong>/, "")).trim(), duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 1, sourceText: "until the end of its next turn" } } });
        html = html.replace(eyesCritical[0], `<strong>Critical Failure</strong> Until the end of its next turn, the target is ${eyesCritical[2]} and ${link("fascinated", "Fascinated")}.`);
    }
    const focusParagraph = /<hr\s*\/?>\s*<p>During any round you Sustain the Spell, you can use a single action, which has the [a-z]+ trait, to focus your [a-z ]+ on a single creature you can see within (\d+) feet\. This creature must immediately make an? (Fortitude|Reflex|Will) save against the spell as if it were ending its turn in the emanation\. If the creature was already Fascinated by your [a-z ]+ before its save, a failed save causes it to be (@UUID\[[^\]]+\]\{Paralyzed\}) for (\d+) rounds?\. You can't use this action to focus on the same creature more than once per round\.<\/p>/.exec(html);
    if (focusParagraph && adapted.lifecycle?.sustained === true) {
        const plain = htmlToPlainText(focusParagraph[0]).replace(/\s+/g, " ").trim();
        sentences.push(plain);
        focus = { actions: ["focus"], label: `was focused on with the Sustain action (within ${focusParagraph[1]} feet; once per creature per round)`, sourceText: plain };
        const paralyzed = { label: "Focused", text: `If it was already Fascinated by these eyes before this save (the Sustain focus), it's also Paralyzed for ${focusParagraph[4]} round${focusParagraph[4] === "1" ? "" : "s"}: apply it then.`,
            sourceText: plain, duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 1, sourceText: "until the end of its next turn" } };
        for (const degree of ["failure", "criticalFailure"]) notes.push({ degree, note: structuredClone(paralyzed) });
        html = html.replace(focusParagraph[0], "");
    }
    // Never Mind: Failure "The target is {Stupefied 4} with an unlimited duration." (permanently); Critical Failure "The target's intellect is permanently reduced
    // below that of an animal, and it treats its Charisma, Intelligence, and Wisdom modifiers as –5. It loses all class abilities that require mental faculties,
    // including all spellcasting. If the target is a PC, they become an NPC under the GM's control." — an unlimited Effect overriding those three modifiers
    // (PF2e's ActiveEffectLike), the lost abilities and the PC becoming an NPC its note; "The effects of this curse can be removed only through effects that
    // target curses." the GM's reminder.
    const forever = /(<strong>Failure<\/strong> The target is @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Z][a-z]+ \d\}) with an unlimited duration\./.exec(html);
    const mindless = /<strong>Critical Failure<\/strong> The target's intellect is permanently reduced below that of an animal, and it treats its Charisma, Intelligence, and Wisdom modifiers as [–−-](\d)\. (It loses all class abilities that require mental faculties, including all spellcasting\.) (If the target is a PC, they become an NPC under the GM's control\.)/.exec(html);
    const curseOnly = /\s*The effects of this curse can be removed only through effects that target curses\./.exec(html);
    if (forever && mindless) {
        sentences.push(...[forever, mindless].map(match => htmlToPlainText(match[0].replace(/<\/?strong>/g, "")).trim()));
        html = html.replace(forever[0], `${forever[1]} permanently.`).replace(mindless[0], "<strong>Critical Failure</strong> The target is unaffected.");
        notes.push({ degree: "criticalFailure", note: { label: "Mind destroyed", text: `Its Charisma, Intelligence and Wisdom modifiers are –${mindless[1]}. ${mindless[2]} ${mindless[3]}`, sourceText: htmlToPlainText(mindless[0].replace(/<strong>[^<]*<\/strong>/, "")).trim(), claimsRow: true,
            rules: ["cha", "int", "wis"].map(attribute => ({ key: "ActiveEffectLike", mode: "override", path: `system.abilities.${attribute}.mod`, value: -Number(mindless[1]) })), duration: { mode: "unlimited", sourceText: "permanently" } } });
        if (curseOnly) { const plain = htmlToPlainText(curseOnly[0]).trim(); sentences.push(plain); reminders.push({ kind: "spell-note", text: plain, sourceText: plain }); html = html.replace(curseOnly[0], ""); }
    }
    // Dominate: "If you issue an obviously self-destructive order, the target doesn't act until you issue a new order." (the GM's reminder); Failure "You
    // control the target. It gains the {Controlled} condition, but it can attempt a Will save at the end of each of its turns. On a success, the spell ends."
    // (Controlled for the spell — until daily preparations, 1 day — ended by that save) and Critical Failure "As a failure, but the target receives a new save
    // only if you give it a new order that is against its nature, such as killing its allies." (Controlled for the day; the new save the GM's, a note).
    const controlled = /<strong>Failure<\/strong> You control the target\. It gains the (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Controlled\}) condition, but it can attempt an? (Fortitude|Reflex|Will) save at the end of each of its turns\. On a success, the spell ends\./.exec(html);
    const controlledCritical = /<strong>Critical Failure<\/strong> As a failure, but the target receives a new save only if you give it a new order that is against its nature, such as ([^.]+)\./.exec(html);
    const selfDestructive = /\s*If you issue an obviously self-destructive order, the target doesn't act until you issue a new order\./.exec(html);
    const daily = /^until the next time you make your daily preparations$/i.test(String(adapted.lifecycle?.duration ?? "").trim());
    if (controlled && controlledCritical && daily && controlled[2].toLowerCase() === adapted.defense.statistic) {
        sentences.push(...[controlled, controlledCritical].map(match => htmlToPlainText(match[0].replace(/<\/?strong>/g, "")).trim()));
        html = html.replace(controlled[0], `<strong>Failure</strong> The target is ${controlled[1]} for 1 day.`).replace(controlledCritical[0], `<strong>Critical Failure</strong> The target is ${controlled[1]} for 1 day.`);
        recurring.push({ degree: "failure", slug: "controlled", recurringSave: { timing: "turn-end", mode: "end", statistic: adapted.defense.statistic, sourceText: htmlToPlainText(controlled[0].replace(/<strong>[^<]*<\/strong>/, "")).trim() } });
        notes.push({ degree: "criticalFailure", note: { label: "Dominated", text: `It gets a new ${controlled[2]} save (ending the spell on a success) only when the caster gives it an order against its nature, such as ${controlledCritical[1]}: the GM rolls it.`,
            sourceText: htmlToPlainText(controlledCritical[0].replace(/<strong>[^<]*<\/strong>/, "")).trim(), duration: { mode: "fixed", value: 1, unit: "days", expiry: null, anchor: "effect-start", offset: 0, sourceText: "until daily preparations" } } });
        if (selfDestructive) { const plain = htmlToPlainText(selfDestructive[0]).trim(); sentences.push(plain); reminders.push({ kind: "spell-note", text: plain, sourceText: plain }); html = html.replace(selfDestructive[0], ""); }
        // (The rows hold the day; "Heightened (10th) The duration is unlimited." is a rank the card refuses — resolve it by hand.)
        const unlimited = /<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>\s*The duration is unlimited\./.exec(html);
        dominate = { outcomeDuration: true, ...(unlimited ? { rankGate: { maxRank: Number(unlimited[1]) - 1, minRank: Number(unlimited[1]), sourceText: "The duration is unlimited." } } : {}) };
    }
    // Cast into Time: "A creature that falls into time disappears until the end of your turn. It then reappears in the same space it left; if that space is
    // occupied, it appears in the nearest empty space, chosen by the GM. Creatures that are immune to mental effects can still be affected by this spell but take no
    // mental damage." with rows "The creature falls into time. When it returns, it takes half damage." … — the rows' damage and conditions at once (it returns by the
    // end of the caster's turn); the disappearance the GM's reminder (hide the token until then); the mental immunity is PF2e's own (a reminder).
    const intoTime = /\s*(A creature that falls into time disappears until the end of your turn\. It then reappears in the same space it left; if that space is occupied, it appears in the nearest empty space, chosen by the GM\.)\s*(Creatures that are immune to mental effects can still be affected by this spell but take no mental damage\.)/.exec(html);
    const falls = [...html.matchAll(/(<strong>(?:Success|Failure|Critical Failure)<\/strong>) The creature falls into time\. When it returns, it takes /g)];
    if (intoTime && falls.length === 3) {
        sentences.push(intoTime[1], intoTime[2], ...falls.map(match => htmlToPlainText(match[0].replace(/<strong>[^<]*<\/strong>/, "")).trim()));
        for (const match of falls) html = html.replace(match[0], `${match[1]} The creature takes `);
        html = html.replace(intoTime[0], "");
        reminders.push({ kind: "spell-note", text: `Each creature that isn't unaffected falls into time: hide its token until the end of your turn, then return it to its space (or the nearest empty one, the GM's choice). Its damage and conditions apply as it returns.`, sourceText: intoTime[1] },
            { kind: "spell-note", text: "Creatures immune to mental effects are still affected but take no mental damage (PF2e's immunity removes it).", sourceText: intoTime[2] });
    }
    // Inexhaustible Cynicism: the lead's doubts ("For the duration, each target is unwilling to receive …") and "Finally, the creature takes 6d6 mental damage at the
    // end of each of its turns (with no save) unless it spent at least 1 action that turn Seeking or otherwise interacting with its surroundings in an attempt to
    // disbelieve the illusions …" with rows "The creature is affected for 1 round." / "… for 1 minute." / "… for 1 hour." — each failing row a note for its time
    // holding the doubts, whose Ongoing control (the GM reports a turn without Seeking) deals the item's damage.
    const cynic = /<p>\s*Finally, the creature takes (\d+)d(\d+) ([a-z]+) damage at the end of each of its turns \(with no save\) unless it spent at least 1 action that turn Seeking or otherwise interacting with its surroundings in an attempt to disbelieve the illusions that it feels are obviously surrounding it\.\s*<\/p>/.exec(html);
    const doubts = /<p>\s*You inflict your targets with a crushing doubt about everyone and everything around them\. (For the duration, [\s\S]*?)<\/p>/.exec(html);
    const affected = Object.fromEntries(["Success", "Failure", "Critical Failure"].map(heading => [heading, new RegExp(String.raw`<strong>${heading}<\/strong> The creature is affected for (\d+) (round|minute|hour)s?\.`).exec(html)]));
    const cynicComponent = (adapted.damageComponents ?? []).length === 1 ? adapted.damageComponents[0] : null;
    if (cynic && doubts?.[1] && Object.values(affected).every(Boolean) && cynicComponent && !cynicComponent.category && String(cynicComponent.formula).replace(/\s+/g, "") === `${cynic[1]}d${cynic[2]}` && String(cynicComponent.type).toLowerCase() === cynic[3]) {
        const doubtText = htmlToPlainText(doubts[1]).replace(/\s+/g, " ").trim();
        sentences.push(htmlToPlainText(doubts[0]).replace(/\s+/g, " ").trim(), htmlToPlainText(cynic[0]).trim(), ...Object.entries(affected).map(([heading, match]) => `${heading} ${htmlToPlainText(match[0].replace(/<strong>[^<]*<\/strong>/, "")).trim()}`));
        for (const [heading, match] of Object.entries(affected)) {
            const degree = { Success: "success", Failure: "failure", "Critical Failure": "criticalFailure" }[heading];
            notes.push({ degree, note: { label: "Cynicism", text: `${doubtText} At the end of each of its turns it takes ${cynic[1]}d${cynic[2]} ${cynic[3]} damage unless it spent an action that turn Seeking or interacting with its surroundings to disbelieve (the GM reports it: the control).`,
                sourceText: htmlToPlainText(match[0].replace(/<strong>[^<]*<\/strong>/, "")).trim(), claimsRow: true, gmPlays: true,
                duration: { mode: "fixed", value: Number(match[1]), unit: `${match[2]}s`, expiry: match[2] === "round" ? "turn-start" : null, anchor: "effect-start", offset: 0, sourceText: `for ${match[1]} ${match[2]}` },
                triggeredDamage: { trigger: "no-seek", dice: Number(cynic[1]), die: Number(cynic[2]), type: cynic[3], componentId: cynicComponent.id, frequency: "round", endsSpell: false, baseRank: Number(adapted.rank) } } });
            html = html.replace(match[0], `<strong>${heading}</strong> The creature is unaffected.`);
        }
        html = html.replace(cynic[0], "").replace(doubts[0], "<p>Each target must attempt a Will save.</p>");
    }
    // Spellwrack: Success "Whenever the target becomes affected by a spell with a duration, the target takes @Damage[2d12[persistent,force]] damage. Each time it
    // takes persistent force damage from spellwrack, it reduces the remaining duration of spells affecting it by 1 round. Only a successful @Check[arcana] check
    // against your spell DC can help the target recover from the persistent damage; the curse and the persistent damage end after 1 minute." / Failure "As success,
    // but the curse and persistent damage do not end on their own." / Critical Failure "As failure, but the persistent force damage is @Damage[4d12[persistent,force]]."
    // — the curse a note (1 minute, or unlimited) whose control, when the GM reports a spell with a duration affecting it, gives the persistent damage; the shortened
    // durations and the Arcana recovery the GM's (the note).
    const wrack = /<strong>Success<\/strong> Whenever the target becomes affected by a spell with a duration, the target takes @Damage\[(\d+)d(\d+)\[persistent,([a-z]+)\]\] damage\. (Each time it takes persistent \3 damage from (?:<em>)?[a-z]+(?:<\/em>)?\s*, it reduces the remaining duration of spells affecting it by 1 round\.) Only a successful @Check\[(arcana|occultism|religion|nature)\] check against your spell DC can help the target recover from the persistent damage; the curse and the persistent damage end after (\d+) (minute|hour)s?\./.exec(html);
    const wrackFail = /<strong>Failure<\/strong> As success, but the curse and persistent damage do not end on their own\./.exec(html);
    const wrackCrit = /<strong>Critical Failure<\/strong> As failure, but the persistent ([a-z]+) damage is @Damage\[(\d+)d(\d+)\[persistent,\1\]\]\./.exec(html);
    if (wrack && wrackFail && wrackCrit && wrackCrit[1] === wrack[3] && wrackCrit[3] === wrack[2]) {
        sentences.push(...[wrack, wrackFail, wrackCrit].map(match => htmlToPlainText(match[0].replace(/<\/?strong>/g, "")).trim()));
        const skill = wrack[5][0].toUpperCase() + wrack[5].slice(1);
        const text = dice => `Whenever it becomes affected by a spell with a duration, it takes ${dice}d${wrack[2]} persistent ${wrack[3]} damage (the GM reports it: the control). Each time it takes that persistent damage, the remaining duration of spells affecting it drops by 1 round. Only a successful ${skill} check against the spell DC helps it recover from the persistent damage.`;
        const curse = (degree, dice, duration, match) => notes.push({ degree, note: { label: "Spellwrack", text: text(dice), sourceText: htmlToPlainText(match[0].replace(/<strong>[^<]*<\/strong>/, "")).trim(), claimsRow: true, gmPlays: true, duration,
            triggeredDamage: { trigger: "spell-affected", dice: Number(dice), die: Number(wrack[2]), type: wrack[3], persistent: true, frequency: "each", endsSpell: false, baseRank: Number(adapted.rank) } } });
        curse("success", wrack[1], { mode: "fixed", value: Number(wrack[6]), unit: `${wrack[7]}s`, expiry: null, anchor: "effect-start", offset: 0, sourceText: `after ${wrack[6]} ${wrack[7]}` }, wrack);
        curse("failure", wrack[1], { mode: "unlimited", sourceText: "do not end on their own" }, wrackFail);
        curse("criticalFailure", wrackCrit[2], { mode: "unlimited", sourceText: "do not end on their own" }, wrackCrit);
        html = html.replace(wrack[0], "<strong>Success</strong> The target is unaffected.").replace(wrackFail[0], "<strong>Failure</strong> The target is unaffected.").replace(wrackCrit[0], "<strong>Critical Failure</strong> The target is unaffected.");
    }
    // Manifold Lives: Failure "The creature takes full damage and is stupefied 2 for 1 minute. While affected, the creature must attempt another save at the start of
    // its turn; on a failure, it's {Slowed 1} for that turn as it sobs uncontrollably." (Stupefied 2 for the minute, and Wave of Despair's turn-start save granting
    // Slowed 1 for that turn, a note for the minute) and Critical Failure "The creature takes double damage and for 1 minute, it's {Stupefied 4} and slowed 1 as it
    // sobs uncontrollably." (both for the minute).
    const sobs = /<strong>Failure<\/strong> The creature takes full damage and is ([a-z]+) (\d) for (\d+) (minute|round)s?\. While affected, the creature must attempt another save at the start of its turn; on a failure, it's (@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+) (\d)\}) for that turn as it sobs uncontrollably\./.exec(html);
    const sobsCritical = /<strong>Critical Failure<\/strong> The creature takes double damage and for (\d+) (minute|round)s?, it's (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Z][a-z]+ \d\}) and ([a-z]+) (\d) as it sobs uncontrollably\./.exec(html);
    if (sobs && sobsCritical && links.has(sobs[1]) && sobsCritical[4] === sobs[7].toLowerCase()) {
        sentences.push(...[sobs, sobsCritical].map(match => htmlToPlainText(match[0].replace(/<\/?strong>/g, "")).trim()));
        const cap = word => word[0].toUpperCase() + word.slice(1);
        const span = (value, unit) => `${value} ${unit}${value === "1" ? "" : "s"}`;
        html = html.replace(sobs[0], `<strong>Failure</strong> The creature takes full damage and is ${link(sobs[1], `${cap(sobs[1])} ${sobs[2]}`)} for ${span(sobs[3], sobs[4])}.`)
            .replace(sobsCritical[0], `<strong>Critical Failure</strong> The creature takes double damage and is ${sobsCritical[3]} and @UUID[${sobs[6]}]{${sobs[7]} ${sobsCritical[5]}} for ${span(sobsCritical[1], sobsCritical[2])}.`);
        const plain = htmlToPlainText(sobs[0].replace(/<strong>[^<]*<\/strong>/, "")).trim();
        notes.push({ degree: "failure", note: { label: "Sobbing", text: `At the start of each of its turns it attempts another ${adapted.defense.statistic[0].toUpperCase()}${adapted.defense.statistic.slice(1)} save; on a failure it is ${sobs[7]} ${sobs[8]} for that turn (the module grants it).`,
            sourceText: plain, gmPlays: true, recurringSave: { timing: "turn-start", mode: "turn-condition", statistic: adapted.defense.statistic, condition: { slug: sobs[7].toLowerCase(), value: Number(sobs[8]), uuid: sobs[6] }, sourceText: plain },
            duration: { mode: "fixed", value: Number(sobs[3]), unit: `${sobs[4]}s`, expiry: null, anchor: "effect-start", offset: 0, sourceText: span(sobs[3], sobs[4]) } } });
    }
    // Unspeakable Shadow: "A creature that has the frightened condition from unspeakable shadow must spend at least one of its actions each turn to either attack
    // its shadow (…) or flee from its shadow (…)." (a note while it's frightened); Failure "… {Frightened 3}. It can't reduce its frightened value below 1 for 1
    // minute." (the floor for that minute); Critical Failure "The target is so afraid, it might instantly die. It must succeed at a Fortitude save or die; this saving
    // throw has the incapacitation trait. If it succeeds at its save, the target is {Frightened 4} and can't reduce its frightened value below 1 for 1 minute." —
    // Phantasmal Killer's wording (the second save; a failure dies), the floor on the row.
    const floors = [];
    const shadowLead = /\s*A creature that has the frightened condition from (?:<em>)?[a-z ]+(?:<\/em>)? must spend at least one of its actions each turn to either attack its shadow \(making a Strike ineffectually\) or flee from its shadow \(using one action to move away as though it had the fleeing condition\)\./.exec(html);
    const floorFail = /(<strong>Failure<\/strong> The target is @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Frightened 3\}\.) It can't reduce its frightened value below (\d) for (\d+) (minute|round)s?\./.exec(html);
    const dieCrit = /<strong>Critical Failure<\/strong> The target is so afraid, it might instantly die\. It must succeed at a Fortitude save or die; this saving throw has the incapacitation trait\. If it succeeds at its save, the target is (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Frightened 4\}) and can't reduce its frightened value below (\d) for (\d+) (minute|round)s?\./.exec(html);
    if (shadowLead && floorFail && dieCrit) {
        sentences.push(htmlToPlainText(shadowLead[0]).trim(), ...[floorFail, dieCrit].map(match => htmlToPlainText(match[0].replace(/<\/?strong>/g, "")).trim()));
        html = html.replace(shadowLead[0], "").replace(floorFail[0], floorFail[1])
            .replace(dieCrit[0], `<strong>Critical Failure</strong> The target is so afraid it might die. It must attempt a @Check[fortitude|traits:incapacitation] save; if the target fails, it dies. On a successful Fortitude save, the target is ${dieCrit[1]}.`);
        for (const [degree, match] of [["failure", floorFail], ["criticalFailure", dieCrit]])
            floors.push({ degree, floor: { slug: "frightened", value: Number(match[2]), lifetime: "fixed", duration: { value: Number(match[3]), unit: `${match[4]}s` }, liftedBy: null, situational: null, sourceTexts: [htmlToPlainText(match[0].replace(/<strong>[^<]*<\/strong>/, "")).trim()] } });
        // (The critical failure's note goes with the Frightened 4 of its successful second save: compile-ability puts it there.)
        for (const degree of ["success", "failure", "criticalFailure"]) notes.push({ degree, ...(degree === "criticalFailure" ? { secondary: ["success", "criticalSuccess"] } : {}), note: { label: "Shadow", text: "While Frightened by this spell, it must spend at least one action each turn either attacking its shadow (a Strike that does nothing) or fleeing from it (one action moving away, as though Fleeing).",
            sourceText: htmlToPlainText(shadowLead[0]).trim(), whileCondition: "frightened", duration: { mode: "unlimited", sourceText: "while frightened" } } });
    }
    // Claim Undead: "If the target is controlled by another creature, that controller attempts a Will saving throw to retain control; otherwise, the target must
    // attempt a Will save." (the GM rolls the controller's save on the card: a reminder) with Failure "The target becomes controlled by you and follows your
    // orders. It (or the creature previously controlling it) can attempt a new Will save at the end of each of its turns; on a success, the spell ends, and the
    // creature becomes stunned 1 and confused for 1 round. If you issue an obviously self-destructive order, …" and Critical Failure "As failure, but … receives a
    // new save only if you give it a new order that is against its nature." — PF2e's Controlled for the spell's minutes (the failure's ended by that save;
    // the Stunned and Confused after it a note), the self-destructive order and the critical failure's new save the GM's.
    const CONTROLLED_UUID = "Compendium.pf2e.conditionitems.Item.9qGBRpbX9NEwtAAr";
    const claimed = /<strong>Failure<\/strong> The target becomes controlled by you and follows your orders\. It \(or the creature previously controlling it\) can attempt a new (Fortitude|Reflex|Will) save at the end of each of its turns; on a success, the spell ends, and the creature becomes stunned 1 and confused for 1 round\. If you issue an obviously self-destructive order, the target doesn't act until you issue a new order\./.exec(html);
    const claimedCritical = /<strong>Critical Failure<\/strong> As failure, but the target \(or the creature previously controlling it\) receives a new save only if you give it a new order that is against its nature\./.exec(html);
    const controller = /If the target is controlled by another creature, that controller attempts an? (Fortitude|Reflex|Will) saving throw to retain control; otherwise, the target must attempt an? \1 save\./.exec(html);
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (claimed && claimedCritical && controller && minutes && claimed[1].toLowerCase() === adapted.defense.statistic && links.has("stunned") && links.has("confused")) {
        sentences.push(...[claimed, claimedCritical].map(match => htmlToPlainText(match[0].replace(/<\/?strong>/g, "")).trim()), htmlToPlainText(controller[0]));
        const span = `${minutes[1]} minute${minutes[1] === "1" ? "" : "s"}`;
        html = html.replace(claimed[0], `<strong>Failure</strong> The target is @UUID[${CONTROLLED_UUID}]{Controlled} for ${span}.`)
            .replace(claimedCritical[0], `<strong>Critical Failure</strong> The target is @UUID[${CONTROLLED_UUID}]{Controlled} for ${span}.`)
            .replace(controller[0], `The target must attempt a ${claimed[1]} save.`);
        recurring.push({ degree: "failure", slug: "controlled", recurringSave: { timing: "turn-end", mode: "end", statistic: adapted.defense.statistic, sourceText: htmlToPlainText(claimed[0].replace(/<strong>[^<]*<\/strong>/, "")).trim() } });
        const length = { mode: "fixed", value: Number(minutes[1]), unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: `for ${span}` };
        notes.push({ degree: "failure", note: { label: "Claimed", text: "When its end-of-turn save frees it, the spell ends and it's Stunned 1 and Confused for 1 round (apply them then). It doesn't act on an obviously self-destructive order until given a new one.", sourceText: htmlToPlainText(claimed[0].replace(/<strong>[^<]*<\/strong>/, "")).trim(), duration: { ...length } } },
            { degree: "criticalFailure", note: { label: "Claimed", text: `It gets a new ${claimed[1]} save only when the caster gives it an order against its nature (the GM rolls it; a success ends the spell, then Stunned 1 and Confused for 1 round). It doesn't act on an obviously self-destructive order until given a new one.`, sourceText: htmlToPlainText(claimedCritical[0].replace(/<strong>[^<]*<\/strong>/, "")).trim(), duration: { ...length } } });
        reminders.push({ kind: "spell-note", text: `If the undead is controlled by another creature, that controller attempts the ${claimed[1]} save to keep control: roll its save for the target's result.`, sourceText: htmlToPlainText(controller[0]) });
    }
    return sentences.length ? { html, sentences, reminders, ...(notes.length ? { notes } : {}), ...(recurring.length ? { recurring } : {}), ...(immunity ? { immunity } : {}), ...(focus ? { focus } : {}), ...(dominate ? { dominate } : {}), ...(floors.length ? { floors } : {}) } : null;
}

// A curse that spreads to those who cast on its victim (Spiritual Epidemic): "Any creature that casts a divine or occult spell on the target while it's affected is
// targeted by spiritual epidemic and must also attempt a Will save. The curse continues to spread in this way." — the lead without those sentences; each affected
// creature's card (pressed whenever such a creature casts on it) starts that caster's save with the same table, which spreads again.
const SPREAD = /\s*(Any creature that casts an? ((?:arcane|divine|occult|primal)(?: or (?:arcane|divine|occult|primal))?) spell on the target while it's affected is targeted by [a-z ]+ and must also attempt an? (Fortitude|Reflex|Will) save\.)\s+(The curse continues to spread in this way\.)/;
/** {html, chain, sentences} or null. */
export function rewriteSpreadingCurse(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [lead] = html.split(/<hr\s*\/?>/i);
    const match = SPREAD.exec(lead);
    if (!match || match[3].toLowerCase() !== adapted.defense.statistic) return null;
    return { html: html.replace(match[0], ""), sentences: [htmlToPlainText(match[1]), htmlToPlainText(match[4])],
        chain: { degrees: ["success", "failure", "criticalFailure"], label: `creature that casts a ${match[2]} spell on it`, sourceText: htmlToPlainText(match[1]), repeatable: true } };
}

const SONG_LEAD = /^[A-Z][^.]*, dealing (\d+d\d+) ([a-z]+) damage [a-z ,]*?depending on the result of their (Fortitude|Reflex|Will) save\.$/;
const SONG_BARRIER = /^The vibrating waves of [a-z ]+ penetrate into, but not through, solid barriers, damaging incorporeal creatures hiding in solid objects in the area but not passing onward to damage creatures in other rooms\.$/;
const SONG_ROWS = {
    criticalSuccess: /^The creature takes no damage\.$/,
    success: /^The creature takes half damage and can't use reactions until the beginning of its turn\.$/,
    failure: /^The creature takes full damage, can't use reactions until the beginning of its turn, and is (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Stunned (\d)\})\.$/,
    criticalFailure: /^The creature takes double damage, can't use reactions until the beginning of its turn, and is (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Stunned (\d)\})\.$/
};
function rewriteReactionRows(adapted, rest) {
    const [lead, table, ...steps] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(part => part.trim());
    if (!table || steps.length > 1) return null;
    const leadSentences = htmlToPlainText(lead).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const damage = SONG_LEAD.exec(leadSentences[0] ?? "");
    const components = adapted.damageComponents ?? [];
    if (!damage || leadSentences.length !== 2 || !SONG_BARRIER.test(leadSentences[1]) || damage[3].toLowerCase() !== adapted.defense.statistic || components.length !== 1 || components[0].category
        || String(components[0].formula).replace(/\s+/g, "") !== damage[1] || String(components[0].type).toLowerCase() !== damage[2]) return null;
    const row = heading => (new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>`).exec(table)?.[1] ?? "").replace(/\s+/g, " ").trim();
    const rows = Object.fromEntries(Object.entries(SONG_ROWS).map(([degree, pattern]) => [degree, pattern.exec(row({ criticalSuccess: "Critical Success", success: "Success", failure: "Failure", criticalFailure: "Critical Failure" }[degree]))]));
    if (Object.values(rows).some(match => !match)) return null;
    const statistic = damage[3];
    const note = { label: "No reactions", text: "The creature can't use reactions until the beginning of its turn.", sourceText: "can't use reactions until the beginning of its turn",
        duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-start", anchor: "target-turn", offset: 0, sourceText: "until the beginning of its turn" } };
    return { html: `<p>You deal ${damage[1]} ${damage[2]} damage to each creature in the area (basic ${statistic} save). On a failed save, a creature becomes ${rows.failure[1]}, or ${rows.criticalFailure[1]} on a critical failure.</p>${steps.length ? `<hr />${steps[0]}` : ""}`,
        rowNotes: Object.fromEntries(["success", "failure", "criticalFailure"].map(degree => [degree, [structuredClone(note)]])),
        reminders: [{ kind: "spell-note", text: `${leadSentences[1]} (The GM includes or leaves out creatures accordingly.)`, sourceText: leadSentences[1] }],
        sentences: [...leadSentences, ...Object.values(rows).map(match => htmlToPlainText(match[0]).trim())] };
}
