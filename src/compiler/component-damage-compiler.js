import {DEGREES} from './constants.js';
import {extractInlineExpressions, htmlToPlainText, stripHeighteningHTML} from './description-parser.js';

const escapeRegExp = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const persistentComponent = component => component.category === 'persistent' || component.type === 'bleed';

function introClaims(adapted, direct, persistent) {
    const html = String(adapted.descriptionHTML ?? '');
    const preamble = htmlToPlainText(html.split(/<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0]);
    const persistentText = new RegExp(`\\b${escapeRegExp(persistent.formula)}\\s+persistent\\s+${escapeRegExp(persistent.type)}\\s+damage\\b`, 'i');
    // Or inline: "@Damage[2d4[persistent,fire]] damage".
    const persistentInline = new RegExp(`@Damage\\[${escapeRegExp(persistent.formula)}\\[persistent,${escapeRegExp(persistent.type)}\\]\\](?:\\s+damage\\b|,)`, 'i');
    const inlinePersistent = persistentInline.test(preamble);
    if (Number(persistentText.test(preamble)) + Number(inlinePersistent) !== 1) return false;
    const directText = direct.formula === '0' && direct.applyModifier
        ? new RegExp(`\\b${escapeRegExp(direct.type)}\\s+damage\\s+equal\\s+to\\s+your\\s+spellcasting\\s+modifier\\b`, 'i')
        : new RegExp(`\\b${escapeRegExp(direct.formula)}\\s+${escapeRegExp(direct.type)}\\s+damage\\b`, 'i');
    const directInline = new RegExp(`@Damage\\[${escapeRegExp(direct.formula)}\\[${escapeRegExp(direct.type)}\\]\\]\\s+damage\\b`, 'i');
    if (Number(directText.test(preamble)) + Number(directInline.test(preamble)) !== 1) return false;
    if (/\b\d+(?:d\d+)?\s+damage\b/i.test(preamble)) return false;
    const quantified = [...preamble.matchAll(/\b\d+(?:d\d+)?\s+(?:[a-z][a-z-]*\s+){0,3}damage\b/gi)];
    const expectedQuantified = (direct.formula === '0' && direct.applyModifier ? 0 : directText.test(preamble) ? 1 : 0) + (inlinePersistent ? 0 : 1);
    if (quantified.length !== expectedQuantified) return false;
    return [...preamble.matchAll(/@Damage\[/gi)].length === Number(directInline.test(preamble)) + Number(inlinePersistent);
}

// PF2e's fixed levels for a "(+N)" entry (Teeth to Terror's 4th, 6th, 8th, 10th): each level's two formulas must be the text's
// step that many times over the base, so the stored spell at the cast rank deals what the text says.
function fixedLevelsAsInterval(heightening, direct, persistent, descriptionHTML, rank) {
    const heading = /<strong\b[^>]*>\s*Heightened\s*\(\+(\d+)\)\s*<\/strong>([\s\S]*?)<\/p>/i.exec(String(descriptionHTML ?? ''));
    if (!heading || !Number.isInteger(rank)) return null;
    const interval = Number(heading[1]);
    const text = htmlToPlainText(heading[2]);
    const step = label => new RegExp(`\\bthe ${label} damage increases by (\\d+d\\d+)\\b`, 'i').exec(text)?.[1];
    const directStep = step(`(?:initial )?${escapeRegExp(direct.type)}`) ?? step('initial'), persistentStep = step(`persistent(?: ${escapeRegExp(persistent.type)})?`);
    if (!directStep || !persistentStep) return null;
    const add = (base, increase, times) => {
        const [b, f] = String(base).split('d').map(Number), [i, g] = increase.split('d').map(Number);
        return f === g ? `${b + i * times}d${f}` : null;
    };
    const levels = Object.entries(heightening.levels ?? {});
    if (!levels.length || levels.some(([level, data]) => {
        const times = (Number(level) - rank) / interval;
        const damage = data?.damage ?? {};
        return !Number.isInteger(times) || times < 1 || Object.keys(data).some(key => !['damage', 'target'].includes(key))
            || Object.keys(damage).length !== 2 || damage[direct.id]?.formula !== add(direct.formula, directStep, times)
            || damage[persistent.id]?.formula !== add(persistent.formula, persistentStep, times);
    })) return null;
    return {type: 'interval', interval, damage: {[direct.id]: directStep, [persistent.id]: persistentStep}};
}

function boundedHeightening(heightening, direct, persistent, descriptionHTML, rank) {
    if (!heightening) return true;
    if (heightening.type === 'fixed') {
        heightening = fixedLevelsAsInterval(heightening, direct, persistent, descriptionHTML, rank);
        if (!heightening) return false;
    }
    if (heightening.type !== 'interval' || !Number.isInteger(heightening.interval)
        || heightening.interval < 1 || !heightening.damage
        || Object.keys(heightening.damage).length !== 2) return false;
    const keys = new Set(Object.keys(heightening.damage));
    if (![direct.id, persistent.id].every(id => keys.has(id)
        && /^(?:[1-9]\d*|[1-9]\d*d(?:4|6|8|10|12))$/i.test(String(heightening.damage[id])))) return false;
    const source = String(descriptionHTML ?? '');
    const headings = [...source.matchAll(/<strong\b[^>]*>\s*Heightened\s*\(\+(\d+)\)\s*<\/strong>/gi)];
    if (headings.length !== 1 || Number(headings[0][1]) !== heightening.interval) return false;
    const heading = headings[0];
    const afterHeading = source.slice((heading.index ?? 0) + heading[0].length);
    const sentence = htmlToPlainText(afterHeading.split(/<\/p>/i)[0]);
    const directLabels = direct.type === persistent.type
        ? ['initial', `initial ${direct.type}`, direct.type]
        : ['initial', `initial ${direct.type}`, direct.type];
    const persistentLabels = direct.type === persistent.type
        ? ['persistent', `persistent ${persistent.type}`]
        : ['persistent', `persistent ${persistent.type}`, persistent.type];
    const labelPattern = values => values.map(escapeRegExp).join('|');
    // (It may first add targets: "You can target two additional creatures, the mental damage increases by 2d4, and …".)
    const expected = new RegExp(`^(?:You can target (?:one|two|three) additional creatures?, t|T)he (?:${labelPattern(directLabels)}) damage increases by ${escapeRegExp(heightening.damage[direct.id])},? and the (?:${labelPattern(persistentLabels)}) damage increases by ${escapeRegExp(heightening.damage[persistent.id])}\\.$`, 'i');
    return expected.test(sentence);
}

function exactConditionTail(tail, conditions) {
    const remaining = String(tail ?? '').trim();
    if (!conditions.length) return /^\.?$/.test(remaining);
    if (conditions.length !== 1) return false;
    const effect = conditions[0];
    if (effect.whileCondition || effect.endsWhen || effect.kind !== 'condition') return false;
    const lead = /^(?:,\s*)?and\s+(?:(?:it|the creature|the target)\s+)?(?:is|becomes?)\s+/i.exec(remaining);
    if (!lead) return false;
    const mention = effect.reference
        ? effect.raw
        : `${effect.name}${effect.value == null ? '' : ` ${effect.value}`}`;
    const duration = effect.duration?.sourceText;
    const expected = new RegExp(`^${escapeRegExp(mention)}${duration ? `\\s+${escapeRegExp(duration)}` : ''}\\.$`, 'i');
    return expected.test(remaining.slice(lead[0].length));
}

function degreeDamage(section, direct, persistent, degree) {
    const text = String(section?.text ?? '').trim();
    const conditions = section?.conditions ?? [];
    if (degree === 'criticalSuccess') return /^The (?:target|creature) is unaffected\.$/i.test(text)
        && conditions.length === 0 ? {mode: 'none', multiplier: 0, sourceComponentIds: []} : null;

    // (The critical failure may restate the failure: "As failure, but the creature takes double damage and …".)
    const directPhrase = new RegExp(`^(?:${degree === 'criticalFailure' ? 'As failure, but t|' : ''}T)he (?:target|creature) takes (half|full|double) (?:the )?(?:${escapeRegExp(direct.type)} )?damage\\b`, 'i').exec(text);
    if (!directPhrase) return null;
    const directMultiplier = {half: 0.5, full: 1, double: 2}[directPhrase[1].toLowerCase()];
    const rest = text.slice(directPhrase[0].length);
    // "… and the object deals no persistent fire damage." (an item that carries the persistent damage).
    const persistentPhrase = new RegExp(`^\\s+(?:and|but)\\s+(?:the object deals\\s+)?(?:(no|full|double(?: the)?)\\s+)?persistent(?:\\s+${escapeRegExp(persistent.type)})?\\s+damage\\b`, 'i').exec(rest);
    if (!persistentPhrase) return null;
    const modifier = persistentPhrase[1]?.toLowerCase() ?? 'full';
    const persistentMultiplier = modifier === 'no' ? 0 : modifier.startsWith('double') ? 2 : 1;
    const tail = rest.slice(persistentPhrase[0].length);
    if (!exactConditionTail(tail, conditions)) return null;
    if ((degree === 'success' && (directMultiplier !== 0.5 || persistentMultiplier !== 0))
        || (degree === 'failure' && (directMultiplier !== 1 || persistentMultiplier !== 1))
        || (degree === 'criticalFailure' && ![1, 2].includes(directMultiplier))) return null;
    const selected = [direct.id, ...(persistentMultiplier ? [persistent.id] : [])];
    return {
        mode: 'shared', multiplier: directMultiplier, sourceComponentIds: selected,
        ...(persistentMultiplier && persistentMultiplier !== directMultiplier
            ? {componentMultipliers: {[persistent.id]: persistentMultiplier}} : {})
    };
}

/** Exact two-component initial/persistent save grammar, independent of spell identity. */
export function compileComponentSelectiveDamage(adapted, description) {
    if (adapted.defense?.kind !== 'save' || adapted.defense.basic !== false
        || description.explicitSectionCount !== 4 || adapted.damageComponents?.length !== 2) return null;
    const [direct, persistent] = [
        adapted.damageComponents.find(component => !persistentComponent(component)),
        adapted.damageComponents.find(persistentComponent)
    ];
    if (!direct || !persistent || direct.id === persistent.id
        || [direct, persistent].some(component => component.kinds?.length !== 1
            || component.kinds[0] !== 'damage' || !component.type || !component.formula)
        || !boundedHeightening(adapted.heightening, direct, persistent, adapted.descriptionHTML, Number(adapted.rank))
        || !introClaims(adapted, direct, persistent)) return null;

    const byDegree = {};
    for (const degree of DEGREES) {
        const section = {...description.sections[degree], conditions: description.sectionConditions[degree]};
        const damage = degreeDamage(section, direct, persistent, degree);
        if (!damage) return null;
        byDegree[degree] = damage;
    }
    return {
        byDegree,
        proof: {
            kind: 'two-component-initial-persistent',
            componentIds: [direct.id, persistent.id],
            sourceText: Object.fromEntries(DEGREES.map(degree => [degree, description.sections[degree].text])),
            byDegree: Object.fromEntries(DEGREES.map(degree => [degree, {
                ...byDegree[degree],
                sourceComponentIds: [...byDegree[degree].sourceComponentIds],
                ...(byDegree[degree].componentMultipliers
                    ? {componentMultipliers: {...byDegree[degree].componentMultipliers}} : {})
            }]))
        }
    };
}

function inlineRankAmount(expression) {
    const simple = /^\(@item\.(?:rank|level)\)$/i.exec(expression);
    if (simple) return rank => rank;
    const stepped = /^\(([1-9]\d*)\*ceil\(@item\.(?:rank|level)\/([1-9]\d*)\)-([0-9]+)\)$/i.exec(expression);
    if (!stepped) return null;
    const [, scale, interval, subtract] = stepped.map(Number);
    return rank => scale * Math.ceil(rank / interval) - subtract;
}

function inlinePersistentHeightening(adapted, direct, persistentAmount) {
    const heightening = adapted.heightening;
    if (heightening?.type !== 'interval' || !Number.isInteger(heightening.interval)
        || heightening.interval < 1 || Object.keys(heightening.damage ?? {}).length !== direct.length
        || !direct.every(component => /^(?:[1-9]\d*)d(?:4|6|8|10|12)$/i.test(
            String(heightening.damage?.[component.id] ?? '')))) return false;
    const source = String(adapted.descriptionHTML ?? '');
    const headings = [...source.matchAll(/<strong\b[^>]*>\s*Heightened\s*\(\+(\d+)\)\s*<\/strong>/gi)];
    if (headings.length !== 1 || Number(headings[0][1]) !== heightening.interval) return false;
    const after = source.slice((headings[0].index ?? 0) + headings[0][0].length);
    const text = htmlToPlainText(after.split(/<\/p>/i)[0]);
    const directText = direct.length === 1
        ? `The ${direct[0].type} damage increases by ${heightening.damage[direct[0].id]}`
        : `The ${direct[0].type} damage and ${direct[1].type} damage each increase by ${heightening.damage[direct[0].id]}`;
    if (direct.length === 2 && heightening.damage[direct[0].id] !== heightening.damage[direct[1].id]) return false;
    const match = new RegExp(`^${escapeRegExp(directText)}, and the persistent bleed damage increases by ([1-9]\\d*)\\.$`, 'i').exec(text);
    if (!match) return false;
    const increment = Number(match[1]);
    const base = persistentAmount(adapted.rank);
    if (!Number.isInteger(base) || base < 1) return false;
    for (let rank = adapted.rank; rank <= 10; rank++) {
        const expected = base + Math.floor((rank - adapted.rank) / heightening.interval) * increment;
        if (persistentAmount(rank) !== expected) return false;
    }
    return true;
}

function inlinePersistentIntroduction(adapted, direct) {
    const source = stripHeighteningHTML(adapted.descriptionHTML);
    const beforeDegrees = source.split(/<hr\b/i)[0];
    const expressions = extractInlineExpressions(beforeDegrees, '@Damage[');
    if (expressions.length !== 1 || [...source.matchAll(/@Damage\[/gi)].length !== 1) return null;
    const expression = expressions[0];
    const parsed = /^(\(.+\))\[bleed\]$/i.exec(expression.body);
    const amount = parsed && inlineRankAmount(parsed[1]);
    if (!amount) return null;
    const prose = htmlToPlainText(beforeDegrees).replace(expression.raw, '<PERSISTENT>');
    const sentences = prose.split(/(?<=[.!?])\s+(?=[A-Z])/).map(part => part.trim()).filter(Boolean);
    if (sentences.length < 2 || sentences.length > 3) return null;
    const save = /^(?:Each|The) (?:living )?(?:creature|target)(?: in the (?:line|area))? must attempt a (Fortitude|Reflex|Will) save\.$/i.exec(sentences.at(-1));
    if (!save || save[1].toLowerCase() !== adapted.defense.statistic) return null;
    const damageSentences = sentences.slice(0, -1).filter(sentence => sentence.includes('<PERSISTENT>'));
    if (damageSentences.length !== 1) return null;
    const damageSentence = damageSentences[0];
    const verb = /\b(?:deal|dealing)\s+/i.exec(damageSentence);
    if (!verb) return null;
    const prefix = damageSentence.slice(0, verb.index ?? 0);
    const harmlessManifestation = /^[A-Z][a-z-]+(?: of [a-z-]+)? (?:curl|surge|stream|flow) out from your (?:fingertips|hands|mouth) and (?:race|flow|stream) through the air\.$/i;
    const harmlessDamageLead = /^[A-Z][a-z-]+(?: [a-z-]+){0,2} (?:open|form|appear|erupt) on the (?:target|creature) as you (?:expose|subject) (?:it|them) to [a-z-]+,\s*$/i;
    if (!(prefix.trim() === 'You' || harmlessDamageLead.test(prefix))
        || sentences.slice(0, -1).filter(sentence => sentence !== damageSentence)
            .some(sentence => !harmlessManifestation.test(sentence))) return null;
    const damageTail = damageSentence.slice((verb.index ?? 0) + verb[0].length);
    const directClaims = direct.map(component => `${component.formula} ${component.type} damage`);
    const directText = directClaims.join(' and ');
    const expected = new RegExp(`^${escapeRegExp(directText)} (?:and|plus) <PERSISTENT> damage(?: to (?:living )?(?:creatures|targets) in the (?:line|area))?\\.$`, 'i');
    if (!expected.test(damageTail)) return null;
    return {amount, sourceFormula: expression.body, baseExpression: parsed[1]};
}

/** One or two structured initial components plus one rank-scaled inline bleed component. */
export function compileInlinePersistentDamage(adapted, description) {
    if (adapted.defense?.kind !== 'save' || adapted.defense.basic !== false
        || description.explicitSectionCount !== 4 || ![1, 2].includes(adapted.damageComponents?.length)
        || !Number.isInteger(adapted.rank) || adapted.rank < 1
        || adapted.lifecycle?.duration != null || adapted.lifecycle?.sustained === true
        || (adapted.rules?.length ?? 0) > 0) return null;
    const direct = adapted.damageComponents;
    if (direct.some(component => component.category != null || component.applyModifier
        || component.kinds?.length !== 1 || component.kinds[0] !== 'damage'
        || !/^[1-9]\d*d(?:4|6|8|10|12)$/i.test(component.formula)
        || !component.type || !component.id)
        || new Set(direct.map(component => component.id)).size !== direct.length
        || new Set(direct.map(component => component.type)).size !== direct.length) return null;
    const introduction = inlinePersistentIntroduction(adapted, direct);
    if (!introduction || !inlinePersistentHeightening(adapted, direct, introduction.amount)) return null;
    if (Object.values(description.sectionConditions).some(effects => effects.length)) return null;
    const sections = Object.fromEntries(DEGREES.map(degree => [degree, description.sections[degree].text]));
    const initialLabel = direct.length === 1
        ? `(?:${escapeRegExp(direct[0].type)}|initial)` : 'initial';
    if (!/^The (?:creature|target) is unaffected\.$/i.test(sections.criticalSuccess)
        || !new RegExp(`^The (?:creature|target) takes half the ${initialLabel} damage and no persistent bleed damage\\.$`, 'i').test(sections.success)
        || !/^The (?:creature|target) takes full damage\.$/i.test(sections.failure)
        || !new RegExp(`^The (?:creature|target) takes double ${initialLabel} damage and double persistent bleed damage\\.$`, 'i').test(sections.criticalFailure)) return null;
    const ids = direct.map(component => component.id);
    const shared = multiplier => ({multiplier, sourceComponentIds: [...ids]});
    const nativeFormula = `${introduction.baseExpression}[persistent,bleed]`;
    const doubledFormula = `(2*(${introduction.baseExpression}))[persistent,bleed]`;
    const byDegree = {
        criticalSuccess: {mode: 'none', multiplier: 0, sourceComponentIds: []},
        success: {mode: 'shared', ...shared(0.5)},
        failure: {mode: 'mixed', shared: shared(1), formulas: [{formula: nativeFormula, source: 'description-inline'}], rollScope: 'combined'},
        criticalFailure: {mode: 'mixed', shared: shared(2), formulas: [{formula: doubledFormula, source: 'description-inline'}], rollScope: 'combined'}
    };
    return {byDegree, proof: {
        kind: 'inline-persistent-plus-structured', directComponentIds: ids,
        directComponents: direct.map(component => ({id: component.id, formula: component.formula, type: component.type})),
        sourceFormula: introduction.sourceFormula, persistentType: 'bleed',
        sourceText: sections, byDegree: structuredClone(byDegree)
    }};
}

/**
 * A save whose only damage is one structured persistent entry, taken by degree:
 * “The target takes half the persistent cold damage.” / “… (takes) the full persistent cold damage …” /
 * “… (takes) double the persistent cold damage …” (success, failure, critical failure; critical success unaffected).
 */
export function compilePersistentOnlyDamage(adapted, description) {
    if (adapted.defense?.kind !== 'save' || adapted.defense.basic !== false
        || description.explicitSectionCount !== 4 || adapted.damageComponents?.length !== 1) return null;
    const [component] = adapted.damageComponents;
    if (component.category !== 'persistent' || component.kinds?.length !== 1 || component.kinds[0] !== 'damage'
        || !component.type || !component.id || !/^[1-9]\d*d(?:4|6|8|10|12)$/i.test(String(component.formula ?? ''))) return null;
    const type = escapeRegExp(component.type);
    const phrase = new RegExp(`\\b(?:takes )?(half the|the full|double the) persistent ${type} damage\\b`, 'gi');
    const expected = {success: 0.5, failure: 1, criticalFailure: 2};
    const plainText = degree => htmlToPlainText(String(description.sections[degree]?.text ?? '')).replace(/\s+/g, ' ').trim();
    if (!/^The (?:target|creature) is unaffected\.$/i.test(plainText('criticalSuccess'))) return null;
    const byDegree = {criticalSuccess: {mode: 'none', multiplier: 0, sourceComponentIds: []}};
    for (const [degree, multiplier] of Object.entries(expected)) {
        const found = [...plainText(degree).matchAll(phrase)];
        if (found.length !== 1) return null;
        // “As failure, but double the persistent … damage.” states the doubled amount; other rows must say “takes”.
        if (!/^takes /i.test(found[0][0]) && !/^As failure, but $/i.test(plainText(degree).slice(0, found[0].index))) return null;
        if ({'half the': 0.5, 'the full': 1, 'double the': 2}[found[0][1].toLowerCase()] !== multiplier) return null;
        byDegree[degree] = {mode: 'shared', multiplier, sourceComponentIds: [component.id]};
    }
    return {byDegree, proof: {
        kind: 'persistent-only-degree-rows', componentIds: [component.id],
        sourceText: Object.fromEntries(DEGREES.map(degree => [degree, description.sections[degree].text])),
        byDegree: structuredClone(byDegree)
    }};
}
