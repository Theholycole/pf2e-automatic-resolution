import {analyzeDescription, htmlToPlainText, stripHeighteningHTML} from './description-parser.js';
import {compileEffectDuration} from './duration-compiler.js';
import {assessSimpleBasicSaveDescription} from './semantic-gate.js';

const CONDITION = '@UUID\\[Compendium\\.pf2e\\.conditionitems\\.Item\\.[^\\]]+\\]\\{[^}]+\\}';
const CRITICAL_FAILURE_PREFIXES = [
    'On a critical failure, (?:the target|the creature) (?:is|is also|also is) (?:knocked )?',
    'If (?:the target|a target|the creature|a creature|it) critically fails (?:the|its) save, (?:it|the target|the creature) (?:is|is also|also is) (?:knocked )?',
    "If (?:the target|a target|the creature|a creature|it) critically fails (?:the|its) save, (?:it's|they're) also (?:knocked )?",
    'A creature that critically fails its save is knocked for a loop, making it ',
    '(?:Additionally, )?(?:creatures|the creatures) (?:that|who) critically fail the save are (?:also )?(?:knocked )?'
];
const FAILURE_PREFIXES = [
    'On a failure, (?:the target|the creature) (?:is|is also|also is) (?:knocked )?'
];
const DURATION = "(?: for \\d+ (?:rounds?|minutes?|hours?|days?|weeks?)| until (?:the )?(?:start|beginning|end) of (?:its|their|your|the target's|the creature's) (?:next )?turn)?";
const RIDERS = [
    ...CRITICAL_FAILURE_PREFIXES.map(prefix => ({
        degrees: ['criticalFailure'],
        pattern: new RegExp(`^${prefix}${CONDITION}${DURATION}(?: from the force of the impact)?\\.$`, 'i')
    })),
    ...FAILURE_PREFIXES.map(prefix => ({
        degrees: ['failure', 'criticalFailure'],
        pattern: new RegExp(`^${prefix}${CONDITION}${DURATION}\\.$`, 'i')
    }))
];

// A figurative push into a mind is not forced movement. Keep the rest of the
// introduction for the ordinary semantic gate, including any physical push.
function normalizeFigurativeMovement(sentence) {
    return sentence.replace(/\bpush(?= into (?:the |a |an )?(?:(?:target|creature)'s|their|its) mind\b)/gi, 'reach');
}

/** A complete basic save with one bounded failure or critical-failure condition. */
export function compileBasicConditionRider(adapted) {
    if (!adapted.defense.basic) return null;
    const text = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML));
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
    const riders = sentences.flatMap(sentence => RIDERS
        .filter(rider => rider.pattern.test(sentence))
        .map(rider => ({...rider, sentence})));
    if (riders.length !== 1) return null;
    const {sentence, degrees} = riders[0];
    const conditions = analyzeDescription(sentence).allConditionReferences;
    if (conditions.length !== 1 || !['prone', 'dazzled', 'deafened', 'blinded', 'frightened', 'enfeebled', 'clumsy', 'stupefied', 'stunned', 'fatigued'].includes(conditions[0].slug)) return null;

    const damageIndex = sentences.findIndex(value => /\bdamage\b/i.test(value));
    const riderIndex = sentences.indexOf(sentence);
    if (damageIndex < 0 || damageIndex >= riderIndex) return null;
    const introductions = sentences.slice(0, damageIndex);
    if (introductions.some(value => /\b(?:becomes?|gains?|receives?|loses?)\b/i.test(value))) return null;
    const remainder = sentences.filter((_value, index) => index !== riderIndex)
        .map((value, index) => index < damageIndex ? normalizeFigurativeMovement(value) : value)
        .join(' ');
    const base = {...adapted, descriptionHTML: remainder};
    if (!assessSimpleBasicSaveDescription(base, analyzeDescription(remainder)).complete) return null;

    const effect = compileEffectDuration(conditions[0], sentence, adapted.lifecycle);
    if (/\b(?:for|until)\b/i.test(sentence) && !effect.duration) return null;
    return {degrees, effect, sourceText: sentence};
}
