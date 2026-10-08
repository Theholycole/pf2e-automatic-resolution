// A ritual resolved from its confirmed outcome (the ritual workflow decision, ticket 07: the ceremony and its skill checks are native rolls and
// the GM's adjudication; this module begins from the confirmed result, then applies that degree's consequences, asking for any missing input —
// the secondary casters, a DC it can't read — and never guessing it).
// Each sentence of the body and of the four degrees is read by a general rule:
//   - narration (no rule words) and the ceremony's own conditions ("This ritual can only be performed once each …", "If performed …, the DCs of
//     the ritual's skill checks are reduced by 2.") are the GM's notes;
//   - "The ritual succeeds." / "The ritual fails." / "The ritual has no effect.";
//   - "The casters of the ritual gain a +1 status bonus to saves against fear effects for 1 month or until the end of winter, whichever comes
//     first." — PF2e's linked Effect on every caster, its rules proved against the text (the bonus, its type, the traits; its degree choice
//     preselected) and the text's duration;
//   - "The casters of the ritual become … Sickened 4 and can't reduce the condition for 12 hours." — the condition on every caster, locked at
//     that value for that long, then left to ordinary recovery;
//   - "Those within the area when the ritual successfully concludes are immediately cured of all detrimental emotion and mental effects; …" —
//     the creatures the GM targets in the area lose those effects (the GM confirms the list); ceasing hostilities is the GM's;
//   - "The ritual's power lingers within its casters, granting them a +1 status bonus against emotion and mental effects for 1 month." — as the
//     casters' bonus above;
//   - "The ritual has its intended effect, but …" (the base effect still happens); "All casters … gain weakness 5 to cold and unholy." — PF2e's
//     linked Effect, its Weakness proved; "This is a curse effect." (a note);
//   - "As failure, but each caster must succeed at a @Check[fortitude|dc:17] save or be permanently Drained 1 for as long as they have …" — the
//     failure's consequences, then each caster's save: a failure is the condition locked for as long as the failure's Effect lasts;
//   - "The target is helpful toward you, so …" — PF2e's attitude on the target (one creature, its level checked) for the ritual's duration,
//     Dismissable; "If the creature is unwilling to accept the ritual, it can attempt a Will save to negate the effect." (the GM says whether
//     it's willing and gives the DC); "… it also can attempt a Will save to end the effect early." (the card's button); "The ritual succeeds and
//     the target takes a -4 status penalty to Will saves to end the effect."; "The ritual fails and the target instead hates you, becoming
//     hostile to you for the duration."; a Heightened entry's shorter durations by what's used (the GM picks), its range and cost (notes);
//   - "The DC for Athletics checks to Climb the affected walls increases by 10, and a creature who fails a check to climb also drops anything
//     they are carrying." — the area the GM places over them: its creatures' Climb checks take the increase (as a penalty to the check) and the
//     failure's note;
//   - "For 1 week, the first time each encounter that a primary or secondary caster takes an action to move, they must attempt a Reflex save or
//     Acrobatics check to Balance against the ritual's casting DC or fall Prone." / "A caster can Step or Crawl without having to attempt a check
//     or save." — each caster's first move in each encounter gets the check card (the GM gives the DC; a Step or Crawl is the card's no-check
//     button); a failure is Prone.
import { htmlToPlainText } from "./description-parser.js";
import { HEADINGS, RULE_WORDS_BROAD as RULE_WORDS, trimmedSentences as split } from "./text-patterns.js";

const CEREMONY = [
    /^This ritual can only be performed once each [a-z ]+\.$/,
    /^If performed [^,]+, the DCs of the ritual's skill checks are reduced by (\d+)\.$/,
    /^This ritual is performed over \d+ (?:hours?|minutes?|days?) of [^.]+\.$/
];
const SUCCEEDS = /^The ritual succeeds\.$/;
const FAILS = /^The ritual (?:fails|has no effect)\.$/;
const CASTER_BONUS = /^The casters of the ritual gain an? \+(\d+) (status|circumstance) bonus to saves against ([a-z]+(?: and [a-z]+)?) effects (?:until the end of ([a-z]+)|for (\d+) (day|week|month)s?(?: or until the end of ([a-z]+), whichever comes first)?)\.$/;
const CASTER_LOCK = /^The casters of the ritual become [a-z ]+ and become @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+) (\d+)\} and can't reduce the condition for (\d+) (hours|days)\.$/;
const LINGERS = /^The ritual's power lingers within its casters, granting them an? \+(\d+) (status|circumstance) bonus against ([a-z]+(?: and [a-z]+)?) effects for (\d+) (day|week|month)s?\.$/;
const AREA_CURE = /^Those within the area when the ritual successfully concludes are immediately cured of all detrimental ([a-z]+(?: and [a-z]+)?) effects; affected creatures cease any current hostilities as though they'd failed a save against calm, though this doesn't control their future actions\.$/;
const INTENDED = /^The ritual has its intended effect, but ([^.]+)\.$/;
const CASTER_WEAKNESS = /^All casters ([^.]+?),? and gain weakness (\d+) to ([a-z]+(?: and [a-z]+)?)\.$/;
const KIND_OF_EFFECT = /^This is an? (curse|disease|poison) effect\.$/;
const AS_FAILURE_SAVE = /^As failure, but each caster must succeed at a @Check\[(fortitude|reflex|will)\|dc:(\d+)\] save or be permanently @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+) (\d+)\} for as long as they have the ([a-z ]+)\.$/;
const ATTITUDE = /^The target is (helpful|friendly|indifferent|unfriendly|hostile) toward you, so it [^.]+\.$/;
const END_SAVE = /^If you ever ask the target to do something [^,]+, not only does it refuse, but it also can attempt an? (Fortitude|Reflex|Will) save to end the effect early\.$/;
const NEGATE = /^If the creature is unwilling to accept the ritual, it can attempt an? (Fortitude|Reflex|Will) save to negate the effect\.$/;
const END_PENALTY = /^The ritual succeeds and the target takes an? [-–−](\d+) (status|circumstance) penalty to (Fortitude|Reflex|Will) saves to end the effect\.$/;
const INSTEAD = /^The ritual fails and the target instead [a-z ]+, becoming (helpful|friendly|indifferent|unfriendly|hostile) to you for the duration\.$/;
const TARGET = /^1 creature of a level no greater than (double|triple) the [a-z' ]+ rank$/i;
const DURATION = /^(\d+) (day|week|month|year)s?( or until dismissed)?$/i;
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>([\s\S]*?)<\/p>$/;
const H_RANGE = /^You can use [a-z ]+ on a creature up to \d+ (?:miles?|feet) away throughout the casting, as long as [^.]+\.$/;
const H_COST = /^The base cost is [\d,]+ gp\.$/;
const H_DURATION = /^The duration is shorter, and based on [^:]+: (\d+) (day|week|month)s? for ([^.]+?),? or (\d+) (day|week|month)s? for ([^.]+)\.$/;
const CLIMB = /^The DC for Athletics checks to Climb the affected ([a-z ]+) increases by (\d+)(, and a creature who fails a check to climb also drops anything (?:they are|it is) carrying)?\.$/;
const SLIP = /^For (\d+) (day|week|month)s?, the first time each encounter that a primary or secondary caster takes an action to move, they must attempt an? (Fortitude|Reflex|Will) save or (Acrobatics|Athletics) check to (?:@UUID\[[^\]]+\]\{Balance\}|Balance) against the ritual's casting DC or fall @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Prone\}\.$/;
const SLIP_EXEMPT = /^A caster can (?:@UUID\[[^\]]+\]\{Step\}|Step) or (?:@UUID\[[^\]]+\]\{Crawl\}|Crawl) without having to attempt a check or save\.$/;
const EFFECT_LINK = /^<p>\s*@UUID\[Compendium\.pf2e\.spell-effects\.Item\.([^\]]+)\]\{[^}]+\}\s*<\/p>$/;
const DAYS = { day: 1, week: 7, month: 30, year: 365 };

/** PF2e's Effect proved against "+N status bonus to saves against X and Y effects" at a degree: the rules active once its choice is that degree. */
function proveCasterBonus(entry, degree, bonus, type, traits) {
    const rules = entry?.mechanics?.rules ?? [];
    const choice = rules.findIndex(rule => rule.key === "ChoiceSet");
    const choiceRule = rules[choice];
    const slug = degree.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    if (choiceRule && !(choiceRule.choices ?? []).some(option => option.value === slug)) return null;
    const option = choiceRule?.rollOption;
    // A trait term: "fear", or {or: ["item:trait:emotion", "item:trait:mental"]} (each of them).
    const traitsOf = term => typeof term === "string" ? (term.includes(":") ? null : [term])
        : Array.isArray(term?.or) && term.or.every(entry => /^item:trait:[a-z]+$/.test(entry)) ? term.or.map(entry => entry.slice(11)) : undefined;
    const active = rules.filter(rule => rule.key === "FlatModifier").filter(rule => (rule.predicate ?? []).every(term => traitsOf(term) !== undefined && (traitsOf(term) !== null || term === `${option}:${slug}`)));
    if (rules.some((rule, index) => index !== choice && rule.key !== "FlatModifier")) return null;
    const granted = active.map(rule => (rule.predicate ?? []).map(traitsOf).filter(Boolean));
    if (!active.every(rule => rule.selector === "saving-throw" && rule.type === type && Number(rule.value) === bonus) || granted.some(terms => terms.length !== 1)) return null;
    if (JSON.stringify(granted.flatMap(terms => terms[0]).sort()) !== JSON.stringify([...traits].sort())) return null;
    return choiceRule ? [{ index: choice, key: "ChoiceSet", patch: { selection: slug } }] : [];
}

/** PF2e's Effect proved against "gain weakness N to X and Y": its one rule. */
function proveWeakness(entry, value, types) {
    const rules = entry?.mechanics?.rules ?? [];
    return rules.length === 1 && rules[0].key === "Weakness" && Number(rules[0].value) === value
        && JSON.stringify([...(rules[0].type ?? [])].sort()) === JSON.stringify([...types].sort());
}

/** Returns {ritualOutcome, claimed} or null. */
export function compileRitualOutcome(item, adapted, catalog) {
    const ritual = item?.system?.ritual;
    if (!ritual?.primary?.check) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length > 1) return null;
    const notes = [], claimed = [], links = [], base = { areaCure: null, attitude: null, endSave: null, negateSave: null };
    // The body: links to PF2e's Effects, the ceremony's conditions, and narration.
    for (const paragraph of body.match(/<p>[\s\S]*?<\/p>/gi) ?? []) {
        const link = EFFECT_LINK.exec(paragraph);
        if (link) { links.push(link[1]); continue; }
        for (const sentence of split(htmlToPlainText(paragraph))) {
            if (CEREMONY.some(pattern => pattern.test(sentence))) { notes.push(sentence); claimed.push(sentence); continue; }
            const cure = AREA_CURE.exec(sentence);
            if (cure && !base.areaCure) { base.areaCure = { traits: cure[1].split(" and "), sourceText: sentence }; claimed.push(sentence); continue; }
            const attitude = ATTITUDE.exec(sentence), endSave = END_SAVE.exec(sentence), negate = NEGATE.exec(sentence);
            if (attitude && !base.attitude) { base.attitude = { slug: attitude[1], sourceText: sentence }; claimed.push(sentence); continue; }
            if (endSave && !base.endSave) { base.endSave = { statistic: endSave[1].toLowerCase(), sourceText: sentence }; claimed.push(sentence); continue; }
            if (negate && !base.negateSave) { base.negateSave = { statistic: negate[1].toLowerCase(), sourceText: sentence }; claimed.push(sentence); continue; }
            if (RULE_WORDS.test(sentence)) return null;
            claimed.push(sentence);
        }
    }
    const outcomes = {};
    for (const [degree, heading] of Object.entries(HEADINGS)) {
        const row = new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>((?:\s*<p>\s*@UUID\[[^\]]+\]\{[^}]+\}\s*</p>)*)`).exec(table);
        if (!row) return null;
        const rowLinks = [...row[2].matchAll(/@UUID\[Compendium\.pf2e\.spell-effects\.Item\.([^\]]+)\]/g)].map(match => match[1]);
        const outcome = { base: null, casterEffects: [], casterLocks: [], casterSaves: [], endPenalty: null, attitude: null, climb: null, slip: null, notes: [] };
        const rowLink = name => {
            const names = [...rowLinks, ...links];
            return names.length === 1 ? catalog?.get?.(names[0]) ?? null : null;
        };
        for (const sentence of split(htmlToPlainText(row[1]))) {
            claimed.push(sentence);
            if (SUCCEEDS.test(sentence)) { outcome.base = true; continue; }
            if (FAILS.test(sentence)) { outcome.base = false; continue; }
            const penalty = END_PENALTY.exec(sentence);
            if (penalty && base.endSave && penalty[3].toLowerCase() === base.endSave.statistic) { outcome.base = true; outcome.endPenalty = { value: -Number(penalty[1]), type: penalty[2] }; continue; }
            const climb = CLIMB.exec(sentence);
            if (climb && !outcome.climb) { outcome.climb = { surface: climb[1], increase: Number(climb[2]), dropOnFailure: !!climb[3], sourceText: sentence }; continue; }
            const slip = SLIP.exec(sentence);
            if (slip && !outcome.slip) { outcome.slip = { days: Number(slip[1]) * DAYS[slip[2]], save: slip[3].toLowerCase(), skill: slip[4].toLowerCase(), prone: slip[5], exempt: null, sourceText: sentence }; continue; }
            if (SLIP_EXEMPT.test(sentence) && outcome.slip && !outcome.slip.exempt) { outcome.slip.exempt = sentence; continue; }
            const instead = INSTEAD.exec(sentence);
            if (instead && base.attitude) { outcome.base = false; outcome.attitude = { slug: instead[1], sourceText: sentence }; continue; }
            const intended = INTENDED.exec(sentence);
            if (intended && !RULE_WORDS.test(intended[1])) { outcome.base = true; outcome.notes.push(sentence); continue; }
            const kind = KIND_OF_EFFECT.exec(sentence);
            if (kind && outcome.casterEffects.length) { outcome.casterEffects.at(-1).kindNote = sentence; continue; }
            const asFailure = AS_FAILURE_SAVE.exec(sentence);
            if (asFailure && degree === "criticalFailure" && outcomes.failure?.casterEffects.length === 1) {
                Object.assign(outcome, { base: outcomes.failure.base, casterEffects: structuredClone(outcomes.failure.casterEffects), notes: [...outcomes.failure.notes, ...outcome.notes] });
                outcome.casterSaves.push({ statistic: asFailure[1], dc: Number(asFailure[2]), failure: { uuid: asFailure[3], slug: asFailure[4].toLowerCase(), value: Number(asFailure[5]), whileEffect: 0 },
                    sourceText: sentence });
                continue;
            }
            const weakness = CASTER_WEAKNESS.exec(sentence);
            if (weakness && !RULE_WORDS.test(weakness[1])) {
                const entry = rowLink();
                if (!entry || !proveWeakness(entry, Number(weakness[2]), weakness[3].split(" and "))) return null;
                outcome.casterEffects.push({ uuid: `Compendium.pf2e.spell-effects.Item.${entry.id}`, name: entry.name, ruleOverrides: [], duration: null, endsAt: null, sourceText: sentence });
                continue;
            }
            const lingers = LINGERS.exec(sentence);
            if (lingers) {
                const entry = rowLink();
                const overrides = proveCasterBonus(entry, degree, Number(lingers[1]), lingers[2], lingers[3].split(" and "));
                if (!overrides) return null;
                outcome.casterEffects.push({ uuid: `Compendium.pf2e.spell-effects.Item.${entry.id}`, name: entry.name, ruleOverrides: overrides,
                    duration: { value: Number(lingers[4]) * DAYS[lingers[5]], unit: "days", expiry: "turn-start" }, endsAt: null, sourceText: sentence });
                continue;
            }
            const bonus = CASTER_BONUS.exec(sentence);
            if (bonus) {
                const name = [...rowLinks, ...links];
                if (name.length !== 1) return null;
                const entry = catalog?.get?.(name[0]);
                const overrides = proveCasterBonus(entry, degree, Number(bonus[1]), bonus[2], bonus[3].split(" and "));
                if (!overrides) return null;
                const days = bonus[5] ? Number(bonus[5]) * DAYS[bonus[6]] : null;
                outcome.casterEffects.push({ uuid: `Compendium.pf2e.spell-effects.Item.${entry.id}`, name: entry.name, ruleOverrides: overrides,
                    duration: days ? { value: days, unit: "days", expiry: "turn-start" } : null,
                    endsAt: bonus[4] ?? bonus[7] ?? null, sourceText: sentence });
                continue;
            }
            const lock = CASTER_LOCK.exec(sentence);
            if (lock) {
                outcome.casterLocks.push({ uuid: lock[1], slug: lock[2].toLowerCase(), value: Number(lock[3]), seconds: Number(lock[4]) * (lock[5] === "hours" ? 3600 : 86400), sourceText: sentence });
                continue;
            }
            if (RULE_WORDS.test(sentence)) return null;
            outcome.notes.push(sentence);
        }
        outcomes[degree] = outcome;
    }
    if (outcomes.success.base !== true && !outcomes.success.casterEffects.length && !outcomes.success.climb) return null;
    if (Object.values(outcomes).some(outcome => outcome.slip && !outcome.slip.exempt)) return null;
    // The target ("1 creature of a level no greater than double the ritual's rank") and the duration, for an attitude.
    let target = null, duration = null, heightened = null;
    if (base.attitude || base.endSave || base.negateSave) {
        const limit = TARGET.exec(String(item.system?.target?.value ?? "").trim());
        const lasts = DURATION.exec(String(item.system?.duration?.value ?? "").trim());
        if (!base.attitude || !base.endSave || !base.negateSave || base.endSave.statistic !== base.negateSave.statistic || !limit || !lasts) return null;
        target = { levelPerRank: limit[1].toLowerCase() === "double" ? 2 : 3 };
        duration = { days: Number(lasts[1]) * DAYS[lasts[2].toLowerCase()], dismissable: !!lasts[3] };
    }
    if (rest.length) {
        const entry = HEIGHTENED.exec(rest[0]);
        if (!entry || !duration) return null;
        heightened = { minRank: Number(entry[1]), durations: [], notes: [] };
        for (const sentence of split(htmlToPlainText(entry[2]))) {
            claimed.push(sentence);
            const shorter = H_DURATION.exec(sentence);
            if (shorter) { heightened.durations = [{ days: Number(shorter[1]) * DAYS[shorter[2]], label: shorter[3] }, { days: Number(shorter[4]) * DAYS[shorter[5]], label: shorter[6] }]; continue; }
            if (H_RANGE.test(sentence) || H_COST.test(sentence)) { heightened.notes.push(sentence); continue; }
            return null;
        }
        if (!heightened.durations.length) return null;
    }
    // An area's rules last the ritual's duration ("1 week").
    if (Object.values(outcomes).some(outcome => outcome.climb)) {
        const lasts = DURATION.exec(String(item.system?.duration?.value ?? "").trim());
        if (!lasts) return null;
        duration ??= { days: Number(lasts[1]) * DAYS[lasts[2].toLowerCase()], dismissable: !!lasts[3] };
    }
    // A critical success is a better success: with no statement of its own, the ritual's effect happens.
    if (outcomes.criticalSuccess.base === null && outcomes.success.base === true) outcomes.criticalSuccess.base = true;
    // The ritual's own effect needs a degree that has it.
    if (base.areaCure && !Object.values(outcomes).some(outcome => outcome.base === true)) return null;
    return {
        ritualOutcome: { primary: String(ritual.primary.check), secondary: { casters: Number(ritual.secondary?.casters ?? 0), checks: String(ritual.secondary?.checks ?? "") },
            cost: String(item.system?.cost?.value ?? ""), notes, base, outcomes, target, duration, heightened },
        claimed
    };
}
