import { lingeringTriggerEvents } from "./lingering-area-compiler.js";
// Compact degree tables: a non-basic save written as one sentence instead of
// Critical Success / Success / Failure / Critical Failure entries.
//   "… must succeed at a Fortitude saving throw or become Dazzled for 1 round (or Blinded for 1 round on a critical failure)."
//   "… causing it to become Stupefied 1 if it fails a Will save (or Stupefied 2 on a critical failure)."
// The sentence is rewritten as a save sentence plus a standard table, so the
// ordinary degree, preamble, residual and lingering compilers judge the result.
// A success is unaffected; the failure outcome also applies on a critical
// failure unless the sentence names a critical-failure outcome.

// Sentences a compact sentence may be followed by (see expandCompactDegreeTable).
const THIS_FLOOR = /^This condition can't be reduced below \d+ while the spell is active(?: and the target can hear you)?\.$/;
const DISMISS_PAYOFF_LEAD = /^You can Dismiss the spell as a reaction when /;
const HEADING = /<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i;
const LINK = /@UUID\[[^\]]+\]\{[^}]+\}/g;
// A condition, optionally valued, optionally with a duration: "Dazzled for 1 round", "@UUID[…]{Stupefied 1}".
const CONDITION = String.raw`(?:@@\d+@@|[A-Za-z]+(?: \d+)?)(?: for \d+ (?:round|minute)s?)?`;
const CRIT = String.raw`(?: \(or (${CONDITION}) on a critical failure\))?`;
const STAT = String.raw`(Fortitude|Reflex|Will)`;
// ("Each of them" after the sentence naming them: Disruptive Transfer's creatures adjacent to where the caster was.)
const SUBJECT = /^(?:The target|(?:Each|Every|All|Any) (?:creatures?|enem(?:y|ies))|Each of them|Creatures|Enemies)(?: (?:who|that|in|within)\b[^,]*)?$/;
const FORMS = [
    // "<subject> must succeed at a Fortitude save(ing throw) or become/be <condition> (or <condition> on a critical failure)."
    { pattern: new RegExp(String.raw`^(.+?) must succeed at an? ${STAT} sav(?:e|ing throw) or (?:be|become) (${CONDITION})${CRIT}\.$`), verb: "is" },
    // "<subject> must succeed at a Reflex save or fall Prone."
    { pattern: new RegExp(String.raw`^(.+?) must succeed at an? ${STAT} sav(?:e|ing throw) or fall (${CONDITION})${CRIT}\.$`), verb: "falls" },
    // "The target becomes Frightened 1 if it fails a Will save (or Frightened 2 on a critical failure)."
    { pattern: new RegExp(String.raw`^(The target) becomes (${CONDITION}) if it fails an? ${STAT} save${CRIT}\.$`), verb: "is", order: "subject-condition-stat" },
    // "<narration>, causing it to become Stupefied 1 if it fails a Will save (or Stupefied 2 on a critical failure)."
    { pattern: new RegExp(String.raw`^(.+?), causing it to become (${CONDITION}) if it fails an? ${STAT} save${CRIT}\.$`), verb: "is", order: "narration-condition-stat" }
];

// An area's inline results after its trigger ("Each round that a creature starts its turn in the area, it must attempt a
// Reflex save."): "On a failure, it takes a –10-foot circumstance penalty to its Speeds until it leaves the area, and on a
// critical failure, it's also Immobilized for 1 round." A following "Creatures can attempt to Escape to remove these
// effects." lets an Escape end both.
const AREA_RESULTS = /^On a failure, it takes a [–−-](\d+)-foot (circumstance|status) penalty to its Speeds until it leaves the area, and on a critical failure, it(?:'s| is) also (knocked )?(@@\d+@@|[A-Z][a-z]+)( for 1 round)?\.$/;
const AREA_ESCAPE = /^Creatures can attempt to (?:@@\d+@@|Escape) to remove these effects\.$/;
const AREA_TRIGGER = /\b(?:starts?|begins?|ends?) (?:its|their) turns? in the area\b|\benters? the area\b/i;

function expandAreaResults(adapted, html) {
    const [base, ...rest] = html.split(/(?=<hr\b)/i);
    const links = [];
    const masked = base.replace(LINK, link => `@@${links.push(link) - 1}@@`);
    const unmask = text => text.replace(/@@(\d+)@@/g, (_, index) => links[Number(index)]);
    const sentences = masked.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const index = sentences.findIndex(sentence => AREA_RESULTS.test(sentence));
    if (index < 1 || sentences.filter(sentence => AREA_RESULTS.test(sentence)).length !== 1) return null;
    // The sentence before names who saves, in an area, and when.
    const trigger = sentences[index - 1];
    if (!AREA_TRIGGER.test(trigger) || !new RegExp(String.raw`must attempt an? ${adapted.defense.statistic} save`, "i").test(trigger)) return null;
    const [, value, type, knocked, condition, forRound] = AREA_RESULTS.exec(sentences[index]);
    const escape = AREA_ESCAPE.test(sentences[index + 1] ?? "");
    const until = `until it leaves the area${escape ? " or Escapes" : ""}`;
    const extra = `${knocked ? "knocked " : ""}${unmask(condition)}${forRound ?? ""}${escape && forRound ? " or until it Escapes" : ""}`;
    const table = [["Critical Success", "The creature is unaffected."], ["Success", "The creature is unaffected."],
        ["Failure", `The creature takes a –${value}-foot ${type} penalty to its Speeds ${until}.`],
        ["Critical Failure", `As failure, but the creature is also ${extra}.`]]
        .map(([heading, body]) => `<p><strong>${heading}</strong> ${body}</p>`).join("");
    const kept = sentences.filter((sentence, position) => position !== index && !(escape && position === index + 1)).map(unmask);
    return { html: `<p>${kept.join(" ")}</p>${table}${rest.join("")}`, sourceText: unmask(sentences[index]), ...(escape ? { escapeText: unmask(sentences[index + 1]) } : {}),
        areaResults: { value: Number(value), type, escape } };
}

// "The target is pulled 10 feet closer to you unless it succeeds at a Fortitude save. On a critical failure, it's also knocked
// Prone." — with a variant's "The spell targets one creature and pulls the target 20 feet instead of 10." after it.
const PULL = /^The target is pulled (\d+) feet closer to you unless it succeeds at an? (Fortitude|Reflex|Will) save\.$/;
const PULL_PRONE = /^On a critical failure, it's also knocked (@@\d+@@)\.$/;
const PULL_VARIANT = /^The spell targets one creature and pulls the target (\d+) feet instead of (\d+)\.$/;

// "Any creature targeted by this spell must succeed at a Fortitude saving throw or be pushed 10 feet away from you (or 20 feet
// on a critical failure)." — followed only by the action-count sentence and the cast variant's restated targets or area.
const PUSH = /^(?:Any creature targeted by this spell|The target|Each creature in the area) must succeed at an? (Fortitude|Reflex|Will) sav(?:e|ing throw) or be pushed (\d+) feet away from you(?: \(or (\d+) feet on a critical failure\))?\.$/;
const ACTIONS_DECIDE = /^The spell's area or range and how many creatures it affects is based on how many actions you spend when Casting the Spell\.$/;

function expandPush(adapted, html) {
    const [base, ...rest] = html.split(/(?=<hr\b)/i);
    // Paragraphs for other action counts still in the text: only a PF2e variant cast (its own paragraph) is read.
    if (/class="action-glyph"/.test(rest.join(""))) return null;
    const links = [];
    const masked = base.replace(LINK, link => `@@${links.push(link) - 1}@@`);
    const unmask = text => text.replace(/@@(\d+)@@/g, (_, index) => links[Number(index)]);
    const sentences = masked.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const index = sentences.findIndex(sentence => PUSH.test(sentence));
    if (index < 0) return null;
    const [, statistic, feet, critical] = PUSH.exec(sentences[index]);
    if (statistic.toLowerCase() !== adapted.defense.statistic) return null;
    const target = String(adapted.targeting?.target ?? "").trim().toLowerCase(), range = String(adapted.targeting?.range ?? "").trim().toLowerCase();
    const area = adapted.targeting?.area;
    for (const sentence of sentences.slice(index + 1)) {
        if (ACTIONS_DECIDE.test(sentence)) continue;
        const one = /^The spell targets one creature within (\d+) feet\.$/.exec(sentence);
        // (PF2e's variant data may store the range as a bare number: "15".)
        if (one && /^(?:1|one) creature$/.test(target) && !area && range.replace(/\s*feet$/, "") === one[1]) continue;
        const all = /^The spell targets all creatures in an? @@(\d+)@@\.$/.exec(sentence);
        const template = all ? /@Template\[(?:type:)?(\w+)\|distance:(\d+)\]/.exec(links[Number(all[1])]) : null;
        if (template && area && String(area.type).toLowerCase() === template[1].toLowerCase() && Number(area.value) === Number(template[2])) continue;
        return null;
    }
    const pushed = distance => `The creature is pushed ${distance} feet away from you.`;
    const table = [["Critical Success", "The creature is unaffected."], ["Success", "The creature is unaffected."],
        ["Failure", pushed(feet)], ["Critical Failure", pushed(critical ?? feet)]]
        .map(([heading, body]) => `<p><strong>${heading}</strong> ${body}</p>`).join("");
    const preamble = sentences.slice(0, index).map(unmask).concat(`Each targeted creature must attempt a ${statistic} save.`).join(" ");
    return { html: `<p>${preamble}</p>${table}${rest.join("")}`, sourceText: sentences.slice(index).map(unmask).join(" ") };
}

// "You move the target up to 10 feet in any direction along the ground or 20 feet through a body of water. An unwilling target
// can attempt a Fortitude save, and it avoids being moved if it succeeds." — the caster's move by result; a willing target
// doesn't save (a reminder).
const MOVE_ANY = /^You move the target up to (\d+) feet in any direction along the ground or (\d+) feet through a body of water\.$/;
const UNWILLING_SAVE = /^An unwilling target can attempt an? (Fortitude|Reflex|Will) save, and it avoids being moved if it succeeds\.$/;

function expandMoveAny(adapted, html) {
    const [base, ...rest] = html.split(/(?=<hr\b)/i);
    if (/class="action-glyph"/.test(rest.join(""))) return null;
    const sentences = base.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const index = sentences.findIndex(sentence => MOVE_ANY.test(sentence));
    if (index < 0 || index !== sentences.length - 2) return null;
    const save = UNWILLING_SAVE.exec(sentences[index + 1]);
    if (!save || save[1].toLowerCase() !== adapted.defense.statistic) return null;
    const [, ground, water] = MOVE_ANY.exec(sentences[index]);
    const moved = `The target is moved up to ${ground} feet in any direction (${water} feet through a body of water).`;
    const table = [["Critical Success", "The target is unaffected."], ["Success", "The target is unaffected."], ["Failure", moved], ["Critical Failure", moved]]
        .map(([heading, body]) => `<p><strong>${heading}</strong> ${body}</p>`).join("");
    const preamble = sentences.slice(0, index).concat(`The target must attempt a ${save[1]} save.`).join(" ");
    return { html: `<p>${preamble}</p>${table}${rest.join("")}`, sourceText: sentences.slice(index).join(" "),
        reminder: { kind: "willing-no-save", text: "A willing target doesn't attempt the save: set its result to failure.", sourceText: sentences[index + 1] } };
}

function expandPull(adapted, html) {
    const [base, ...rest] = html.split(/(?=<hr\b)/i);
    // Paragraphs for other action counts still in the text: only a PF2e variant cast (its own paragraph) is read.
    if (/class="action-glyph"/.test(rest.join(""))) return null;
    const links = [];
    const masked = base.replace(LINK, link => `@@${links.push(link) - 1}@@`);
    const unmask = text => text.replace(/@@(\d+)@@/g, (_, index) => links[Number(index)]);
    const sentences = masked.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const index = sentences.findIndex(sentence => PULL.test(sentence));
    if (index < 0) return null;
    const [, feet, statistic] = PULL.exec(sentences[index]);
    if (statistic.toLowerCase() !== adapted.defense.statistic) return null;
    let used = 1, distance = Number(feet), prone = null;
    const proneMatch = PULL_PRONE.exec(sentences[index + used] ?? "");
    if (proneMatch && /\{Prone\}$/.test(unmask(proneMatch[1]))) { prone = unmask(proneMatch[1]); used++; }
    const variant = PULL_VARIANT.exec(sentences[index + used] ?? "");
    if (variant) { if (Number(variant[2]) !== Number(feet)) return null; distance = Number(variant[1]); used++; }
    // The pull (and its lines) must end the rules text.
    if (index + used !== sentences.length) return null;
    const pulled = `The target is pulled ${distance} feet toward you`;
    const table = [["Critical Success", "The target is unaffected."], ["Success", "The target is unaffected."],
        ["Failure", `${pulled}.`], ["Critical Failure", prone ? `${pulled} and knocked ${prone}.` : `${pulled}.`]]
        .map(([heading, body]) => `<p><strong>${heading}</strong> ${body}</p>`).join("");
    const preamble = sentences.slice(0, index).map(unmask).concat(`The target must attempt a ${statistic} save.`).join(" ");
    return { html: `<p>${preamble}</p>${table}${rest.join("")}`, sourceText: sentences.slice(index, index + used).map(unmask).join(" ") };
}

// "You improve the target's attitude to you by one step (unfriendly to neutral, …) for the duration of the spell unless it succeeds at
// a Will save.": a failure improves its attitude (a note, user decision). Sentences after it (temporary immunity, who the spell
// works on, the GM's call) stay before the table, where their own rules read them.
const ATTITUDE_STEP = /^You improve the target's attitude to you by one step (\([^)]*\)) for the duration of the spell unless it succeeds at an? (Fortitude|Reflex|Will) save\.$/;

function expandAttitudeStep(adapted, html) {
    const [base, ...rest] = html.split(/(?=<hr\b)/i);
    const sentences = base.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const index = sentences.findIndex(sentence => ATTITUDE_STEP.test(sentence));
    if (index < 0) return null;
    const [, steps, statistic] = ATTITUDE_STEP.exec(sentences[index]);
    if (statistic.toLowerCase() !== adapted.defense.statistic) return null;
    const improved = `The target's attitude to you improves by one step ${steps} for the duration of the spell.`;
    const table = [["Critical Success", "The target is unaffected."], ["Success", "The target is unaffected."], ["Failure", improved], ["Critical Failure", improved]]
        .map(([heading, body]) => `<p><strong>${heading}</strong> ${body}</p>`).join("");
    const preamble = [...sentences.slice(0, index), `The target must attempt a ${statistic} save.`, ...sentences.slice(index + 1)].join(" ");
    return { html: `<p>${preamble}</p>${table}${rest.join("")}`, sourceText: sentences[index] };
}

// "If your target has Hardness, you can affect one contiguous object, up to a 5-foot cube, or one creature, decreasing the Hardness by 5,
// to a minimum of 0. If the target lacks Hardness, it gains weakness 3 to physical damage. A target with a Fortitude modifier can attempt
// a Fortitude saving throw, negating the effect on a success.": the weakness on a failed save (the rows' Effect proves it); the Hardness
// is the GM's (a reminder: PF2e's Effect gives only the weakness).
const NEGATES = /^A target with an? (Fortitude|Reflex|Will) modifier can attempt an? (Fortitude|Reflex|Will) saving throw, negating the effect on a success\.$/;
const LACKS_HARDNESS = /^If the target lacks Hardness, it gains weakness (\d+) to ([a-z]+) damage\.$/;
const HAS_HARDNESS = /^If your target has Hardness, [^.@\d]*(?:up to an? \d+-foot cube, )?[^.@\d]*decreasing the Hardness by (\d+), to a minimum of 0\.$/;
const HARDNESS_HEIGHTENED = /^Hardness decreases by (\d+), /;

function expandNegatingSave(adapted, html) {
    const [base, ...rest] = html.split(/(?=<hr\b)/i);
    const links = [];
    const masked = base.replace(LINK, link => `@@${links.push(link) - 1}@@`);
    const unmask = text => text.replace(/@@(\d+)@@/g, (_, index) => links[Number(index)]);
    const sentences = masked.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = pattern => sentences.findIndex(sentence => pattern.test(sentence));
    const save = at(NEGATES), lacks = at(LACKS_HARDNESS), has = at(HAS_HARDNESS);
    if (save < 0 || lacks < 0 || has < 0 || !(has < lacks && lacks < save)) return null;
    const statistic = NEGATES.exec(sentences[save]);
    if (statistic[1] !== statistic[2] || statistic[1].toLowerCase() !== adapted.defense.statistic) return null;
    // Before them only narration; after them only the Effect's link.
    const narration = sentences.slice(0, has);
    if (narration.some(sentence => /\d|@@|\b(?:damage|save|bonus|penalty|condition|Hardness|weakness)\b/i.test(sentence))) return null;
    const after = sentences.slice(save + 1);
    if (after.length > 1 || (after.length === 1 && !/^@@\d+@@$/.test(after[0]))) return null;
    const [, value, type] = LACKS_HARDNESS.exec(sentences[lacks]);
    const row = `The target gains weakness ${value} to ${type} damage.`;
    const table = [["Critical Success", "The target is unaffected."], ["Success", "The target is unaffected."], ["Failure", row], ["Critical Failure", "As failure."]]
        .map(([heading, body]) => `<p><strong>${heading}</strong> ${body}</p>`).join("");
    const heightened = htmlToPlain(rest.join(" "));
    const step = /Heightened \(\+(\d)\)\s*(.*)$/.exec(heightened);
    const hardnessStep = step ? HARDNESS_HEIGHTENED.exec(step[2]) : null;
    const hardness = Number(HAS_HARDNESS.exec(sentences[has])[1]);
    return {
        html: `<p>${narration.concat(`The target must attempt a ${statistic[1]} save.`).join(" ")}</p>${table}${after.length ? `<p>${unmask(after[0])}</p>` : ""}${rest.join("")}`,
        sourceText: [sentences[has], sentences[lacks], sentences[save]].join(" "),
        reminder: { kind: "hardness", text: `A target with Hardness (an object, hazard or structure of stone or earth, or such a creature) doesn't take the weakness: `
            + `its Hardness decreases by ${hardness}${hardnessStep ? ` (${hardnessStep[1]} more per +${step[1]} ranks)` : ""}, to a minimum of 0, for the spell's duration, on a failed save. `
            + "The module applies PF2e's weakness Effect only; exclude a creature with Hardness and lower it yourself.", sourceText: sentences[has] }
    };
}
// An aura that grows on an optional Sustain (Bane, Malediction):
//   "Enemies in the area must succeed at a Will save or take a –1 status penalty to attack rolls as long as they are in the area." /
//   "Once per round on subsequent turns, you can Sustain the spell to increase the emanation's radius by 10 feet and force enemies in
//   the area that weren't yet affected to attempt another saving throw." / optionally "Bane can counteract @UUID[…]{Bless}."
// The save becomes a table whose failure is the penalty while in the area; the lingering area makes enemies inside save when it's cast
// and, on each Sustain, the enemies not yet affected after the radius grows.
const AURA_SAVE = /^Enemies in the area must succeed at an? (Fortitude|Reflex|Will) save or take an? [–−-](\d) (status|circumstance) penalty to (attack rolls|AC) as long as they(?: are|'re) in the area\.$/;
const AURA_GROWTH = /^Once per round on subsequent turns, you can Sustain the spell to increase the emanation's radius by (\d+) feet and force enemies in the area that weren't yet affected to attempt (?:another|a) saving throw\.$/;
const AURA_COUNTERACT = /^[A-Z][A-Za-z' ]+ can counteract (?:@@(\d+)@@|([a-z' ]+))\.$/;

function expandGrowingAura(adapted, html) {
    if (adapted.targeting?.area?.type !== "emanation") return null;
    const [base, ...rest] = html.split(/(?=<hr\b)/i);
    const links = [];
    const masked = base.replace(LINK, link => `@@${links.push(link) - 1}@@`);
    const unmask = text => text.replace(/@@(\d+)@@/g, (_, index) => links[Number(index)]);
    const sentences = masked.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const save = sentences.findIndex(sentence => AURA_SAVE.test(sentence));
    const growth = sentences.findIndex(sentence => AURA_GROWTH.test(sentence));
    if (save < 0 || growth !== save + 1) return null;
    const [, statistic, value, type, stat] = AURA_SAVE.exec(sentences[save]);
    if (statistic.toLowerCase() !== adapted.defense.statistic) return null;
    const narration = sentences.slice(0, save);
    if (narration.some(sentence => /\d|@@|\b(?:damage|save|bonus|penalty|condition)\b/i.test(sentence))) return null;
    let counteract = null;
    const effectLinks = [];
    for (const sentence of sentences.slice(growth + 1)) {
        const found = AURA_COUNTERACT.exec(sentence);
        if (found && !counteract) {
            const name = found[1] != null ? /\{([^}]+)\}$/.exec(links[Number(found[1])])?.[1] : found[2];
            if (!name || (found[1] != null && !/^@UUID\[Compendium\.pf2e\.spells-srd\./.test(links[Number(found[1])]))) return null;
            counteract = { name: name.toLowerCase(), sourceText: unmask(sentence) };
            continue;
        }
        if (/^@@\d+@@$/.test(sentence) && /^@UUID\[Compendium\.pf2e\.spell-effects\./.test(links[Number(sentence.slice(2, -2))])) { effectLinks.push(unmask(sentence)); continue; }
        return null;
    }
    if (effectLinks.length !== 1) return null;
    const row = `The creature takes a –${value} ${type} penalty to ${stat} as long as it's in the area.`;
    const table = [["Critical Success", "The creature is unaffected."], ["Success", "The creature is unaffected."], ["Failure", row], ["Critical Failure", "As failure."]]
        .map(([heading, body]) => `<p><strong>${heading}</strong> ${body}</p>`).join("");
    const saveSentence = `Each enemy in the area when you Cast this Spell and each time you Sustain it must attempt a ${statistic} save.`;
    return {
        html: `<p>${narration.map(unmask).concat(saveSentence).join(" ")}</p>${table}<p>${effectLinks[0]}</p>${rest.join("")}`,
        sourceText: `${unmask(sentences[save])} ${unmask(sentences[growth])}`,
        growingAura: { feet: Number(AURA_GROWTH.exec(sentences[growth])[1]), sourceText: unmask(sentences[growth]) },
        ...(counteract ? { reminder: { kind: "counteract-spell", target: counteract.name, text: `${counteract.sourceText} If it's active where this spell is, roll the counteract check.`, sourceText: counteract.sourceText } } : {})
    };
}
// A gust along a line (Gust of Wind): "Large or smaller creatures in the area must attempt a Fortitude save. Large or smaller creatures
// that later move into the gust must attempt the save on entering." with the wind's effect on the surroundings ("The wind extinguishes
// small non-magical fires, …") and the rows "The creature can't move against the wind." / "… knocked Prone. If it was flying, it takes the
// effects of critical failure instead." / "The creature is pushed 30 feet in the wind's direction, knocked prone, and takes 2d6 bludgeoning
// damage.": a lingering area (when cast, and on entering) for creatures up to that size; the push is away from the caster (the wind blows
// from the caster's square); a flying creature's failure is a critical failure (the GM says whether it flew).
const SIZED_SAVE = /^(Tiny|Small|Medium|Large|Huge) or smaller creatures in the area must attempt an? (Fortitude|Reflex|Will) save\.$/;
const SIZED_ENTER = /^(Tiny|Small|Medium|Large|Huge) or smaller creatures that later move into the ([a-z]+) must attempt the save on entering\.$/;
const WIND_SURROUNDINGS = /^The wind extinguishes small non-magical fires, disperses fog and mist, blows objects of light Bulk or less around, and pushes larger objects\.$/;
const WIND_ORIGIN = /^A [a-z ]+ wind issues forth from your palm, blowing from the point where you are when you Cast the Spell to the line's opposite end\.$/;
const GUST_ROWS = {
    criticalSuccess: /^The creature is unaffected\.$/,
    success: /^The creature can't move against the wind\.$/,
    failure: /^The creature is knocked (@@\d+@@)\. If it was flying, it takes the effects of critical failure instead\.$/,
    criticalFailure: /^The creature is pushed (\d+) feet in the wind's direction, knocked prone, and takes (\d+d\d+) ([a-z]+) damage\.$/
};

function expandGust(adapted, html) {
    if (adapted.targeting?.area?.type !== "line" || !HEADING.test(html)) return null;
    const [base] = html.split(/<hr\b/i);
    const links = [];
    const mask = text => text.replace(LINK, link => `@@${links.push(link) - 1}@@`);
    const plain = text => text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const sentences = plain(mask(base)).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const origin = sentences.findIndex(sentence => WIND_ORIGIN.test(sentence)), surroundings = sentences.findIndex(sentence => WIND_SURROUNDINGS.test(sentence));
    const save = sentences.findIndex(sentence => SIZED_SAVE.test(sentence)), enter = sentences.findIndex(sentence => SIZED_ENTER.test(sentence));
    if ([origin, surroundings, save, enter].some(index => index < 0) || sentences.length !== 4) return null;
    const [, size, statistic] = SIZED_SAVE.exec(sentences[save]);
    if (SIZED_ENTER.exec(sentences[enter])[1] !== size || statistic.toLowerCase() !== adapted.defense.statistic) return null;
    const rows = {};
    for (const [degree, heading] of [["criticalSuccess", "Critical Success"], ["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]]) {
        const row = new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*<\/strong>([\s\S]*?)<\/p>`, "i").exec(html);
        const match = row && GUST_ROWS[degree].exec(plain(mask(row[1])));
        if (!match) return null;
        rows[degree] = { match, text: plain(row[1]) };
    }
    const prone = links[Number(rows.failure.match[1].slice(2, -2))];
    if (!/\{Prone\}$/.test(prone ?? "")) return null;
    const [, feet, dice, type] = rows.criticalFailure.match;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== dice || String(components[0].type).toLowerCase() !== type) return null;
    const table = [["Critical Success", "The creature is unaffected."], ["Success", "The creature is unaffected."],
        ["Failure", `The creature is knocked ${prone}.`], ["Critical Failure", `The creature takes full damage, is pushed ${feet} feet away from you, and is knocked ${prone}.`]]
        .map(([heading, body]) => `<p><strong>${heading}</strong> ${body}</p>`).join("");
    const rest = html.split(/(?=<hr\b)/i).slice(2).join("");
    return {
        html: `<p>Each creature in the area when you Cast this Spell or that later moves into the area must attempt a ${statistic} save.</p>${table}${rest}`,
        sourceText: [sentences[save], sentences[enter]].join(" "),
        sizeLimit: { Tiny: "tiny", Small: "sm", Medium: "med", Large: "lg", Huge: "huge" }[size],
        gust: {
            windNote: { text: rows.success.text, sourceText: rows.success.text },
            flying: { question: "Was the creature flying? If so, it takes the critical failure's effects.", sourceText: rows.failure.text },
            criticalSource: rows.criticalFailure.text
        },
        reminder: { kind: "surroundings", text: `${sentences[origin]} ${sentences[surroundings]} The GM applies this to fires, fog and objects.`, sourceText: sentences[surroundings] }
    };
}
// A squall in a burst (Unseasonable Squall): "You issue a blast of sudden wind that ripples outward from the center of the burst." / "The wind
// extinguishes small non-magical fires, disperses fog and mist, scatters objects of light Bulk or less, and pushes unsecured objects of 1 Bulk or
// less 5 feet away from the spell's origin point." / "Each Medium or smaller creature in the area when you Cast the Spell or that moves into
// spell's area must attempt a Fortitude saving throw." with "Success The creature is unaffected." / "Failure … knocked Prone. If the creature was
// Flying, it gets a critical failure instead." / "Critical Failure The creature is pushed 30 feet away from the center of the burst, is knocked
// Prone, and takes 2d6 bludgeoning damage." — the gust's lingering area for the burst: the push away from the burst's center, and the critical
// failure's damage the text's (PF2e's item has none) as that row's own roll.
const SQUALL_ORIGIN = /^You issue a blast of sudden wind that ripples outward from the center of the burst\.$/;
const SQUALL_SURROUNDINGS = /^The wind extinguishes small non-magical fires, disperses fog and mist, scatters objects of light Bulk or less, and pushes unsecured objects of \d+ Bulk or less \d+ feet away from the spell's origin point\.$/;
const SQUALL_SAVE = /^Each (Tiny|Small|Medium|Large|Huge) or smaller creature in the area when you Cast the Spell or that moves into spell's area must attempt an? (Fortitude|Reflex|Will) saving throw\.$/;
const SQUALL_ROWS = {
    success: /^The creature is unaffected\.$/,
    failure: /^The creature is knocked (@@\d+@@)\. If the creature was Flying, it gets a critical failure instead\.$/,
    criticalFailure: /^The creature is pushed (\d+) feet away from the center of the burst, is knocked Prone, and takes (\d+d\d+) ([a-z]+) damage\.$/
};

function expandSquall(adapted, html) {
    if (adapted.targeting?.area?.type !== "burst" || !HEADING.test(html) || (adapted.damageComponents ?? []).length) return null;
    const [base] = html.split(/<hr\b/i);
    const links = [];
    const mask = text => text.replace(LINK, link => `@@${links.push(link) - 1}@@`);
    const plain = text => text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const sentences = plain(mask(base)).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    if (sentences.length !== 3 || !SQUALL_ORIGIN.test(sentences[0]) || !SQUALL_SURROUNDINGS.test(sentences[1]) || !SQUALL_SAVE.test(sentences[2])) return null;
    const [, size, statistic] = SQUALL_SAVE.exec(sentences[2]);
    if (statistic.toLowerCase() !== adapted.defense.statistic) return null;
    if (/<strong>\s*Critical Success\s*<\/strong>/i.test(html)) return null;
    const rows = {};
    for (const [degree, heading] of [["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]]) {
        const row = new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*<\/strong>([\s\S]*?)<\/p>`, "i").exec(html);
        const match = row && SQUALL_ROWS[degree].exec(plain(mask(row[1])));
        if (!match) return null;
        rows[degree] = { match, text: plain(row[1]) };
    }
    const prone = links[Number(rows.failure.match[1].slice(2, -2))];
    if (!/\{Prone\}$/.test(prone ?? "")) return null;
    const [, feet, dice, type] = rows.criticalFailure.match;
    const table = [["Critical Success", "The creature is unaffected."], ["Success", "The creature is unaffected."], ["Failure", `The creature is knocked ${prone}.`],
        ["Critical Failure", `The creature takes @Damage[${dice}[${type}]] damage. The creature is pushed ${feet} feet away from the center of the burst and knocked ${prone}.`]]
        .map(([heading, body]) => `<p><strong>${heading}</strong> ${body}</p>`).join("");
    const rest = html.split(/(?=<hr\b)/i).slice(2).join("");
    return {
        html: `<p>Each creature in the area when you Cast this Spell or that later moves into the area must attempt a ${statistic} save.</p>${table}${rest}`,
        sourceText: sentences[2],
        sizeLimit: { Tiny: "tiny", Small: "sm", Medium: "med", Large: "lg", Huge: "huge" }[size],
        gust: {
            windNote: null,
            flying: { question: "Was the creature flying? If so, it takes the critical failure's effects.", sourceText: rows.failure.text },
            criticalSource: rows.criticalFailure.text
        },
        reminder: { kind: "surroundings", text: `${sentences[1]} The GM applies this to fires, fog and objects.`, sourceText: sentences[1] }
    };
}
const htmlToPlain = html => String(html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// An aura whose failed save makes the creature roll its first attack twice (Discomfiting Whispers):
//   "Each creature that starts their turn within the area of this spell must succeed at a Will save or roll twice on their first attack
//   roll that round and take the lower result." / "If an attack roll modified in this way results in a failure, the creature that rolled
//   the failed attack takes 1d6 void damage." with one linked Effect.
// The save becomes a table whose failure (and critical failure) is PF2e's Effect; the damage on a failed modified attack is the
// lingering record's control (`failedAttackDamage`), the item's one damage entry.
const ROLL_TWICE_SAVE = /^Each creature that starts (?:its|their) turn within the area of this spell must succeed at an? (Fortitude|Reflex|Will) save or roll twice on (?:its|their) first attack roll that round and take the lower result\.$/;
const FAILED_ATTACK = /^If an attack roll modified in this way results in a failure, the creature that rolled the failed attack takes (\d+d\d+) ([a-z]+) damage\.$/;

function expandRollTwiceAura(adapted, html) {
    if (adapted.targeting?.area?.type !== "emanation") return null;
    const [base, ...rest] = html.split(/(?=<hr\b)/i);
    const links = [];
    const masked = base.replace(LINK, link => `@@${links.push(link) - 1}@@`);
    const unmask = text => text.replace(/@@(\d+)@@/g, (_, index) => links[Number(index)]);
    const sentences = masked.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const save = sentences.findIndex(sentence => ROLL_TWICE_SAVE.test(sentence));
    if (save < 0 || !FAILED_ATTACK.test(sentences[save + 1] ?? "")) return null;
    if (ROLL_TWICE_SAVE.exec(sentences[save])[1].toLowerCase() !== adapted.defense.statistic) return null;
    const narration = sentences.slice(0, save);
    if (narration.some(sentence => /\d|@@|\b(?:damage|save|bonus|penalty|condition|attack)\b/i.test(sentence))) return null;
    const after = sentences.slice(save + 2);
    if (after.length !== 1 || !/^@@\d+@@$/.test(after[0]) || !/^@UUID\[Compendium\.pf2e\.spell-effects\./.test(links[Number(after[0].slice(2, -2))])) return null;
    const [, dice, type] = FAILED_ATTACK.exec(sentences[save + 1]);
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== dice || String(components[0].type).toLowerCase() !== type) return null;
    const row = `The creature rolls twice on its first attack roll this round and takes the lower result. ${unmask(after[0])}`;
    const table = [["Critical Success", "The creature is unaffected."], ["Success", "The creature is unaffected."], ["Failure", row], ["Critical Failure", "As failure."]]
        .map(([heading, body]) => `<p><strong>${heading}</strong> ${body}</p>`).join("");
    const saveSentence = `Each creature that starts its turn in the area must attempt a ${ROLL_TWICE_SAVE.exec(sentences[save])[1]} save.`;
    return {
        html: `<p>${narration.map(unmask).concat(saveSentence).join(" ")}</p>${table}${rest.join("")}`,
        sourceText: unmask(sentences[save]),
        failedAttackDamage: { componentId: components[0].id, formula: dice, type, sourceText: sentences[save + 1] }
    };
}
// A burning burst that is hazardous terrain and grows on each Sustain (Wildfire):
//   "The area becomes hazardous terrain." / "A creature that moves on the ground through the area takes 1 fire damage for every square
//   of that area it moves into." / "A creature that ends its turn in the area must succeed at a Reflex save or take
//   @Damage[1[persistent,fire]] damage." / "Each time you sustain this spell, the radius of the burst increases by 5 feet." with
//   "Heightened (+2) Increase the damage and persistent damage by 1."
// The save becomes a turn-end table whose failure is the persistent damage (raised by the heightening); the per-square damage is the
// lingering record's control (`hazardMove`, the item's one damage entry); the growth is `sustainGrowth`.
const HAZARD_TERRAIN = /^The area becomes hazardous terrain\.$/;
const HAZARD_MOVE = /^A creature that moves on the ground through the area takes (\d+) ([a-z]+) damage for every square of that area it moves into\.$/;
const TURN_END_PERSISTENT = /^A creature that ends its turn in the area must succeed at an? (Fortitude|Reflex|Will) save or take @@(\d+)@@ damage\.$/;
const SUSTAIN_GROWTH = /^Each time you sustain this spell, the radius of the (burst|emanation) increases by (\d+) feet\.$/i;
const BOTH_HEIGHTENED = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*Increase the damage and persistent damage by (\d+)\.\s*<\/p>$/;

function expandHazardousBurst(adapted, html) {
    const area = adapted.targeting?.area;
    if (!["burst", "emanation"].includes(area?.type) || adapted.lifecycle?.sustained !== true) return null;
    const [base, ...rest] = html.split(/(?=<hr\b)/i);
    const links = [];
    const masked = base.replace(LINK, link => `@@${links.push(link) - 1}@@`).replace(/@Damage\[[^\]]*\[[^\]]*\]\]/g, link => `@@${links.push(link) - 1}@@`);
    const unmask = text => text.replace(/@@(\d+)@@/g, (_, index) => links[Number(index)]);
    const sentences = masked.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => HAZARD_TERRAIN.test(sentence));
    if (at < 0 || !HAZARD_MOVE.test(sentences[at + 1] ?? "") || !TURN_END_PERSISTENT.test(sentences[at + 2] ?? "") || !SUSTAIN_GROWTH.test(sentences[at + 3] ?? "") || sentences.length !== at + 4) return null;
    if (sentences.slice(0, at).some(sentence => /\d|@@|\b(?:damage|save|bonus|penalty|condition|terrain)\b/i.test(sentence))) return null;
    const [, amount, type] = HAZARD_MOVE.exec(sentences[at + 1]);
    const [, statistic, link] = TURN_END_PERSISTENT.exec(sentences[at + 2]);
    const persistent = /^@Damage\[(\d+)\[persistent,([a-z]+)\]\]$/.exec(links[Number(link)]);
    const [, shape, feet] = SUSTAIN_GROWTH.exec(sentences[at + 3]);
    if (!persistent || persistent[2] !== type || statistic.toLowerCase() !== adapted.defense.statistic || shape.toLowerCase() !== area.type) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category || String(components[0].formula).trim() !== amount || String(components[0].type).toLowerCase() !== type) return null;
    // "Heightened (+2) Increase the damage and persistent damage by 1.": the item's own heightening raises the per-square damage by that.
    const heightened = rest.join("").match(/<p>\s*<strong>\s*Heightened[\s\S]*?<\/p>/gi) ?? [];
    const both = heightened.length === 1 ? BOTH_HEIGHTENED.exec(heightened[0].trim()) : null;
    if (heightened.length > (both ? 1 : 0)) return null;
    const step = adapted.heightening?.damage?.[components[0].id];
    if (both && !(adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(both[1]) && String(step).trim() === both[2])) return null;
    if (!both && step) return null;
    const baseRank = Number(adapted.rank) || 1;
    const formula = both ? `(${persistent[1]}+floor((@item.rank - ${baseRank})/${both[1]})${both[2] === "1" ? "" : `*${both[2]}`})` : persistent[1];
    const table = [["Critical Success", "The creature is unaffected."], ["Success", "The creature is unaffected."],
        ["Failure", `The creature takes @Damage[${formula}[persistent,${type}]] damage.`], ["Critical Failure", "As failure."]]
        .map(([heading, body]) => `<p><strong>${heading}</strong> ${body}</p>`).join("");
    const saveSentence = `Each creature that ends its turn in the area must attempt a ${statistic} save.`;
    return {
        html: `<p>${sentences.slice(0, at).map(unmask).concat(saveSentence).join(" ")}</p>${table}${rest.join("")}`,
        sourceText: unmask(sentences[at + 2]),
        hazardMove: { componentId: components[0].id, formula: amount, type, heightening: both ? { interval: Number(both[1]), increase: Number(both[2]) } : null,
            sourceText: [sentences[at], sentences[at + 1]] },
        sustainGrowth: { feet: Number(feet), sourceText: sentences[at + 3] }
    };
}
// "Creatures in the area when the spell is cast or beginning their turn in the area must succeed at a Reflex save or fall Prone." (Carrion
// Mire): the save's subject, then a table where a failure (and a critical failure) knocks the creature Prone.
const SAVE_OR_PRONE = /^(.+?) must succeed at an? (Fortitude|Reflex|Will) save or fall (@@\d+@@|prone)\.$/;

function expandSaveOrProne(adapted, html) {
    const [base, ...rest] = html.split(/(?=<hr\b)/i);
    const links = [];
    const masked = base.replace(LINK, link => `@@${links.push(link) - 1}@@`);
    const unmask = text => text.replace(/@@(\d+)@@/g, (_, index) => links[Number(index)]);
    const sentences = masked.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const index = sentences.findIndex(sentence => SAVE_OR_PRONE.test(sentence));
    if (index < 0 || sentences.filter(sentence => SAVE_OR_PRONE.test(sentence)).length !== 1) return null;
    const [, subject, statistic, prone] = SAVE_OR_PRONE.exec(sentences[index]);
    if (statistic.toLowerCase() !== adapted.defense.statistic) return null;
    const link = prone === "prone" ? null : links[Number(/@@(\d+)@@/.exec(prone)[1])];
    if (link && !/\{Prone\}$/.test(link)) return null;
    const falls = `The creature falls ${link ?? "prone"}.`;
    const table = [["Critical Success", "The creature is unaffected."], ["Success", "The creature is unaffected."], ["Failure", falls], ["Critical Failure", falls]]
        .map(([heading, body]) => `<p><strong>${heading}</strong> ${body}</p>`).join("");
    const preamble = [...sentences.slice(0, index), `${subject} must attempt a ${statistic} save.`, ...sentences.slice(index + 1)].map(unmask).join(" ");
    return { html: `<p>${preamble}</p>${table}${rest.join("")}`, sourceText: unmask(sentences[index]) };
}

// A conjured cage that traps the creatures in its space (Osseous Cage):
//   "Creatures in the space where you create the cage can attempt a Reflex save; if they fail or don't attempt the save, they're trapped within
//   it." / "A creature inside the cage is Immobilized until it Escapes, uses an effect that can pass through solid objects, or destroys the
//   cage." with the cage's statistics, its cover, the size limit and the Heightened step as the GM's notes (one reminder).
const CAGE_SAVE = /^Creatures in the space where you create the ([a-z]+) can attempt an? (Fortitude|Reflex|Will) save; if they fail or don't attempt the save, they're trapped within it\.$/;
const CAGE_HOLD = /^A creature inside the ([a-z]+) is (@@\d+@@) until it Escapes, uses an effect that can pass through solid objects, or destroys the \1\.$/;
const CAGE_NOTES = [
    /^The spell automatically fails if the space contains a creature larger than the spell's area\.$/,
    /^The [a-z]+ has AC \d+, Hardness \d+, and \d+ Hit Points, and it's immune to critical hits and precision damage\.$/,
    /^The [a-z ]+ provides lesser cover from attacks that pass through the [a-z]+, either from the outside to the inside or visa versa\.$/
];
const CAGE_STEP = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*(The spell's area grows by \d+ feet on a ?side and it's Hit Points increase by \d+\.)\s*<\/p>$/;

function expandCage(adapted, html) {
    const [base, ...rest] = html.split(/(?=<hr\b)/i);
    if (rest.length > 1) return null;
    const links = [];
    const masked = base.replace(LINK, link => `@@${links.push(link) - 1}@@`);
    const unmask = text => text.replace(/@@(\d+)@@/g, (_, index) => links[Number(index)]);
    const sentences = masked.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => CAGE_SAVE.test(sentence));
    const holdAt = sentences.findIndex(sentence => CAGE_HOLD.test(sentence));
    if (at < 0 || holdAt < 0) return null;
    const [, thing, statistic] = CAGE_SAVE.exec(sentences[at]), hold = CAGE_HOLD.exec(sentences[holdAt]);
    if (statistic.toLowerCase() !== adapted.defense.statistic || hold[1] !== thing || !/\{Immobilized\}$/.test(links[Number(/@@(\d+)@@/.exec(hold[2])[1])])) return null;
    const notes = [], narration = [];
    for (const [index, sentence] of sentences.entries()) {
        if (index === at || index === holdAt) continue;
        if (CAGE_NOTES.some(pattern => pattern.test(sentence))) { notes.push(unmask(sentence)); continue; }
        if (index < at && !/\d|@@|\b(?:damage|save|bonus|penalty|condition)\b/i.test(sentence)) { narration.push(sentence); continue; }
        return null;
    }
    if (notes.length !== CAGE_NOTES.length || narration.length > 1) return null;
    const step = rest.length ? CAGE_STEP.exec(rest[0].replace(/^<hr\s*\/?>\s*/i, "").trim()) : null;
    if (rest.length && !step) return null;
    const immobilized = `The creature is ${unmask(hold[2])} until it Escapes.`;
    const table = [["Critical Success", "The creature is unaffected."], ["Success", "The creature is unaffected."], ["Failure", immobilized], ["Critical Failure", immobilized]]
        .map(([heading, body]) => `<p><strong>${heading}</strong> ${body}</p>`).join("");
    const text = [`It can also get out with an effect that passes through solid objects, or by destroying the ${thing}.`, ...notes, ...(step ? [`Heightened (+${step[1]}): ${step[2]}`] : [])].join(" ");
    return { html: `<p>${narration.map(unmask).concat(`Each creature in the area must attempt a ${statistic} save.`).join(" ")}</p>${table}`,
        sourceText: unmask(sentences[at]), reminder: { kind: "structure", text, sourceText: [unmask(sentences[holdAt]), ...notes, ...(step ? [step[2]] : [])].join(" ") } };
}

// "A magical interference prevents the target from contributing to any form of cooperative spellcasting." / "On a failed save, the target
// can't participate in any ritual unless they can cast the ritual alone, and they can't access any spells provided by a coven or similar
// cooperative ability." (Caster's Imposition) — the item's save; what a failing target can't do is the failure rows' (a note on the target).
const FAILED_SAVE_RULE = /^On a failed save, the target (can't [^@\d]+)\.$/;
function expandFailedSaveRule(adapted, html) {
    const [base, ...rest] = html.split(/(?=<hr\b)/i);
    if (/@UUID|@Damage|@Check|\[\[/.test(base)) return null;
    const sentences = base.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => FAILED_SAVE_RULE.test(sentence));
    if (at !== sentences.length - 1 || at > 1 || (at === 1 && /\d|\b(?:damage|save|bonus|penalty|immune|Sustain|must)\b/i.test(sentences[0]))) return null;
    const statistic = adapted.defense.statistic[0].toUpperCase() + adapted.defense.statistic.slice(1);
    const rule = FAILED_SAVE_RULE.exec(sentences[at])[1];
    const table = [["Critical Success", "The target is unaffected."], ["Success", "The target is unaffected."], ["Failure", `The target ${rule}.`], ["Critical Failure", "As failure."]]
        .map(([heading, body]) => `<p><strong>${heading}</strong> ${body}</p>`).join("");
    return { html: `<p>${at ? `${sentences[0]} ` : ""}The target must attempt a ${statistic} save.</p>${table}${rest.join("")}`, sourceText: sentences[at] };
}

export function expandCompactDegreeTable(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false) return null;
    const html = String(adapted.descriptionHTML ?? "");
    // (A gust along a line has its own written table: see expandGust.)
    const gustTable = expandGust(adapted, html);
    if (gustTable) return gustTable;
    const squall = expandSquall(adapted, html);
    if (squall) return squall;
    if (HEADING.test(html)) return null;
    const area = adapted.targeting?.area ? expandAreaResults(adapted, html) : null;
    if (area) return area;
    const pull = !adapted.targeting?.area ? expandPull(adapted, html) : null;
    if (pull) return pull;
    const push = expandPush(adapted, html);
    if (push) return push;
    const prone = expandSaveOrProne(adapted, html);
    if (prone) return prone;
    const cage = expandCage(adapted, html);
    if (cage) return cage;
    const moveAny = !adapted.targeting?.area ? expandMoveAny(adapted, html) : null;
    if (moveAny) return moveAny;
    const attitude = !adapted.targeting?.area ? expandAttitudeStep(adapted, html) : null;
    if (attitude) return attitude;
    const negating = !adapted.targeting?.area ? expandNegatingSave(adapted, html) : null;
    if (negating) return negating;
    const aura = expandGrowingAura(adapted, html);
    if (aura) return aura;
    const rollTwice = expandRollTwiceAura(adapted, html);
    if (rollTwice) return rollTwice;
    const hazardous = expandHazardousBurst(adapted, html);
    if (hazardous) return hazardous;
    const gust = expandGust(adapted, html);
    if (gust) return gust;
    const failedSave = !adapted.targeting?.area ? expandFailedSaveRule(adapted, html) : null;
    if (failedSave) return failedSave;
    // Rules before any heightening; links masked so their dots don't split sentences.
    const [base, ...rest] = html.split(/(?=<hr\b)/i);
    const links = [];
    const masked = base.replace(LINK, link => `@@${links.push(link) - 1}@@`);
    const unmask = text => text.replace(/@@(\d+)@@/g, (_, index) => links[Number(index)]);
    const text = masked.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const matches = sentences.flatMap((sentence, index) => FORMS.map(form => ({ form, index, match: form.pattern.exec(sentence) })).filter(found => found.match));
    // Exactly one compact sentence, and it ends the rules text — or is followed only by "While confused by this effect, …",
    // which says what the result's condition means for this spell (it joins the failure rows).
    const WHILE_RESULT = /^While ([a-z]+) by this effect, [^.]+\.$/i;
    let trailing = matches.length === 1 ? sentences.slice(matches[0].index + 1) : [];
    // Or by the result's floor ("This condition can't be reduced below 1 while the spell is active and the target can hear you.",
    // which joins the failure rows) and the cast's Dismiss payoff ("You can Dismiss the spell as a reaction when …, restoring …
    // Hit Points to that ally.", which stays before the table for the Dismiss compiler).
    const floorTrail = trailing.length && THIS_FLOOR.test(trailing[0]) ? trailing.shift() : null;
    const payoffTrail = trailing.length && DISMISS_PAYOFF_LEAD.test(trailing[0]) ? trailing.shift() : null;
    if ((floorTrail || payoffTrail) && trailing.length) return null;
    if (matches.length !== 1 || !(trailing.length === 0 || (trailing.length === 1 && WHILE_RESULT.test(unmask(trailing[0]).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1"))))) return null;
    if (floorTrail) trailing = [floorTrail];
    const { form, match } = matches[0];
    let subject, condition, statistic, critical;
    if (form.order === "subject-condition-stat") [, subject, condition, statistic, critical] = match;
    else if (form.order === "narration-condition-stat") { [, subject, condition, statistic, critical] = match; subject = `${subject}. The target`; }
    else [, subject, statistic, condition, critical] = match;
    if (statistic.toLowerCase() !== adapted.defense.statistic) return null;
    // The subject names who saves, with no condition in front ("On a critical hit, …") and no
    // back-reference ("Each of them"). Narration before ", causing it to" is its own sentence.
    // Or a lingering area's trigger ("The first time an enemy enters the aura each round, or if they start their turn within the
    // aura, they"): the lingering compiler reads it from the rewritten save sentence.
    const areaTrigger = !!adapted.targeting?.area && lingeringTriggerEvents(unmask(subject)) != null;
    const bare = form.order === "narration-condition-stat" || SUBJECT.test(subject) || areaTrigger;
    if (!bare) return null;
    // ("Each of them" only after "Creatures adjacent to your initial location …": Disruptive Transfer's, whose teleport reminder names them.)
    if (/^Each of them$/.test(subject) && !/^Creatures adjacent to your initial location [a-z ,']+\.$/.test(sentences[matches[0].index - 1] ?? "")) return null;
    const noun = /\btarget\b/i.test(subject) ? "The target" : "The creature";
    const extra = trailing.length ? ` ${unmask(trailing[0])}` : "";
    const outcome = value => `${noun} ${form.verb} ${unmask(value)}.${extra}`;
    const saveSentence = `${unmask(subject)} must attempt a ${statistic} save.`;
    const table = [["Critical Success", `${noun} is unaffected.`], ["Success", `${noun} is unaffected.`],
        ["Failure", outcome(condition)], ["Critical Failure", outcome(critical ?? condition)]]
        .map(([heading, body]) => `<p><strong>${heading}</strong> ${body}</p>`).join("");
    const preamble = sentences.slice(0, matches[0].index).map(unmask).concat(saveSentence, ...(payoffTrail ? [unmask(payoffTrail)] : [])).join(" ");
    return {
        html: `<p>${preamble}</p>${table}${rest.join("")}`,
        sourceText: unmask(sentences[matches[0].index])
    };
}
