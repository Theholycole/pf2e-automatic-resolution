// Planning-only family definitions for whole-family audits. Names and IDs
// are report output; membership never enables or dispatches behavior.
import {parseConditionLists} from '../src/compiler/condition-list-lifetime.js';

const events = effect => (Array.isArray(effect.endsWhen) ? effect.endsWhen : effect.endsWhen ? [effect.endsWhen] : []).map(event => event.event);
const degreesWith = (plan, predicate) => Object.entries(plan.resolution?.outcomes ?? {})
    .filter(([, outcome]) => outcome.effects?.some(predicate)).map(([degree]) => degree);

export const FAMILY_SETS = {
    'event-lifetimes': {
        title: 'Event lifetimes and coordinated condition lists',
        outputStem: 'reports/phase-spell-batches/escape-family-audit',
        detailLabel: 'Escape degrees',
        rowDetails: plan => ({detail: degreesWith(plan, effect => events(effect).includes('escape'))}),
        families: [
            {id: 'escape', title: 'Escape wording', definition: 'Every nonritual, non-review source description that mentions Escape (plain text, action link or inline /act), including penalties, grabs, restraints, wall and summon rules.',
                match: (_plan, text) => /\bEscap(?:es?|ing)\b/.test(text)},
            {id: 'condition-list', title: 'Coordinated condition grants', definition: 'Save outcomes whose text grants two or more conditions in one coordinated list, where positional lifetime scope matters.',
                match: plan => plan.resolution?.kind === 'save' && Object.values(plan.resolution.outcomes ?? {}).some(outcome =>
                    Object.values(Object.groupBy(parseConditionLists(outcome.rawText), item => item.listIndex)).some(run => run.length > 1))},
            {id: 'event-lifetime', title: 'Compiled event-terminated conditions', definition: 'Save outcome conditions compiled with an ending event (Escape, spell end, leaving an area, removal of another condition).',
                match: plan => Object.values(plan.resolution?.outcomes ?? {}).some(outcome => outcome.effects?.some(effect => events(effect).length))}
        ]
    },
    'damage-derived': {
        title: 'Damage-derived consequences: death at 0 HP and caster benefits',
        outputStem: 'reports/phase-spell-batches/damage-derived-family-audit',
        detailLabel: 'Compiled consequence',
        rowDetails: plan => ({detail: [
            ...(plan.resolution?.postDamageTerminal ? ['dies at 0 HP'] : []),
            ...(plan.resolution?.casterBenefit ? [`${plan.resolution.casterBenefit.kind} (${plan.resolution.casterBenefit.aggregate}, ${plan.resolution.casterBenefit.condition})`] : [])
        ]}),
        families: [
            {id: 'death-at-zero', title: 'Death or destruction at 0 HP', definition: 'Every nonritual, non-review description where reaching 0 HP kills, destroys or turns a creature to dust.',
                match: (_plan, text) => /\b(?:0|zero) (?:hp|hit points)\b[^.]*\b(?:dies?|killed?|death|destroyed|dust|slain)\b|\b(?:dies?|killed?)\b[^.]*\b(?:0|zero) (?:hp|hit points)\b/i.test(text)},
            {id: 'caster-benefit', title: 'Caster healing or temporary HP', definition: 'Descriptions granting the caster temporary Hit Points or Hit Points, typically from damage dealt.',
                match: (_plan, text) => /\byou (?:gain|regain)\b[^.]*\b(?:temporary Hit Points|Hit Points)\b/i.test(text)},
            {id: 'area-living', title: 'Area damage to living creatures only', definition: 'Area descriptions that deal damage to living creatures (or living enemies) in the area.',
                match: (_plan, text) => /\bdamage to (?:all |each )?living (?:creatures?|enemies) in the\b/i.test(text)}
        ]
    },
    'self-help': {
        title: 'Self-help endings, creature-state eligibility and preamble trigger safety',
        outputStem: 'reports/phase-spell-batches/self-help-family-audit',
        detailLabel: 'Compiled',
        rowDetails: plan => ({detail: [
            ...(Object.values(plan.resolution?.outcomes ?? {}).some(outcome => outcome.effects?.some(effect => events(effect).includes('action'))) ? ['Interact ending'] : []),
            ...(Object.values(plan.resolution?.outcomes ?? {}).some(outcome => outcome.effects?.some(effect => events(effect).includes('escape'))) ? ['Escape ending'] : []),
            ...(plan.targeting?.actorConstraints?.predicates?.some(predicate => predicate.kind === 'gm-confirmed') ? ['GM-confirmed eligibility'] : [])
        ]}),
        families: [
            {id: 'self-help-ending', title: 'Conditions ended by the creature\u2019s own Interact action or Escape', definition: 'Descriptions where the affected creature ends a condition or effect with an Interact action or an Escape.',
                match: (_plan, text) => /\b(?:Interact|spend (?:an|a single|one) action|uses an Interact)\b[^.]*\b(?:end|remove|extricate|free|wipe)s?\b|\bcan attempt to Escape\b/i.test(text)},
            {id: 'state-immunity', title: 'Creature-state immunity', definition: 'Descriptions making creatures without blood, organs, breath or similar states immune or unaffected.',
                match: (_plan, text) => /\b(?:(?:a )?creatures? with no|creatures? (?:that|which) lack|a creature that doesn't|creatures? that don't)\b[^.]{0,50}\b(?:is|are) (?:immune|unaffected)\b/i.test(text)},
            {id: 'preamble-trigger', title: 'Save preambles with while, entering or counteract', definition: 'Save spells whose rules before the degree table mention while, entering an area, or counteracting.',
                match: (plan, text) => plan.resolution?.kind === 'save' && /\b(?:while|enters?|counteract)/i.test(text.split(/Critical Success/)[0])}
        ]
    },
    'degree-riders': {
        title: 'Basic-save degree riders',
        outputStem: 'reports/phase-spell-batches/degree-rider-family-audit',
        detailLabel: 'Rider degrees',
        rowDetails: plan => ({detail: plan.resolution?.check?.basic === true
            ? ['failure', 'criticalFailure'].filter(degree => plan.resolution.outcomes?.[degree]?.effects?.length) : []}),
        families: [
            {id: 'basic-rider', title: 'Basic saves with failure or critical-failure condition text', definition: 'Basic saves whose description attaches a condition to failing or critically failing creatures.',
                match: (plan, text) => plan.resolution?.check?.basic === true && /\b(?:fail(?:s|ed|ure)?|critical(?:ly)? fail(?:s|ure)?)\b[^.]*\b(?:blinded|clumsy|confused|dazzled|deafened|drained|enfeebled|fatigued|fleeing|frightened|grabbed|immobilized|off-guard|paralyzed|prone|restrained|sickened|slowed|stunned|stupefied)\b/i.test(text.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, '$1'))}
        ]
    },
    'afflictions': {
        title: 'Affliction handoff: immediate outcomes and starting stage',
        outputStem: 'reports/phase-spell-batches/affliction-family-audit',
        detailLabel: 'Compiled',
        rowDetails: plan => ({detail: [
            ...(plan.resolution?.afflictionHandoff ? [`${plan.resolution.afflictionHandoff.name} (${Object.entries(plan.resolution.outcomes).filter(([, outcome]) => outcome.affliction).map(([degree, outcome]) => `${degree} stage ${outcome.affliction.stage}`).join(', ')})`] : []),
            ...(plan.compilerEvidence?.afflictionDelivery ? ['delivery damage at every degree'] : [])
        ]}),
        families: [
            {id: 'affliction', title: 'Spells with a poison, disease or curse stage block', definition: 'Every nonritual, non-review spell whose description carries an affliction stage block (delegated progression).',
                match: plan => (plan.automation?.delegatedCapabilities ?? []).includes('affliction-resolution')},
            {id: 'afflicted-wording', title: '\u201cafflicted with \u2026 stage\u201d wording', definition: 'Descriptions that afflict a creature at a stated stage, with or without a stage block.',
                match: (_plan, text) => /\bafflict(?:ed|s)? (?:it |the \w+ )?with\b[^.]*\bstage \d/i.test(text)}
        ]
    },
    'degree-adjustments': {
        title: 'Creature-dependent degree adjustments and timed Stunned',
        outputStem: 'reports/phase-spell-batches/degree-adjustment-family-audit',
        detailLabel: 'Compiled',
        rowDetails: plan => ({detail: [
            ...(plan.resolution?.degreeAdjustment ? [`degree adjustment (${plan.resolution.degreeAdjustment.predicate.kind === 'trait-any' ? plan.resolution.degreeAdjustment.predicate.traits.join('/') : 'GM-confirmed'})`] : []),
            ...degreesWith(plan, effect => effect.slug === 'stunned' && effect.value == null && effect.duration?.mode === 'fixed').map(degree => `timed Stunned on ${degree}`)
        ]}),
        families: [
            {id: 'degree-adjustment', title: 'Creature-dependent degree shifts', definition: 'Save spells whose preamble or rules change the degree of success for some creatures (\u201cget a success instead\u201d, \u201cone degree worse\u201d).',
                match: (plan, text) => plan.resolution?.kind === 'save' && /\b(?:degrees? of success|one degree (?:better|worse)|(?:gets?|use|uses) (?:a |the )?(?:critical )?(?:success|failure|outcome)\b[^.]{0,60}\binstead\b)/i.test(text)},
            {id: 'timed-stunned', title: 'Unvalued Stunned with a duration', definition: 'Save spells granting Stunned (no value) for a stated number of rounds or minutes.',
                match: (plan, text) => plan.resolution?.kind === 'save' && /\bstunned\b(?!\s*\d)[^.]{0,40}\bfor (?:\d+|one|1) (?:rounds?|minutes?)\b/i.test(text.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, '$1'))}
        ]
    },
    'recurring-saves': {
        title: 'Recurring saves and creature-dependent degree shifts',
        outputStem: 'reports/phase-spell-batches/recurring-family-audit',
        detailLabel: 'Recurring-save degrees',
        rowDetails: plan => ({detail: degreesWith(plan, effect => effect.recurringSave).map(degree => {
            const mode = plan.resolution.outcomes[degree].effects.find(effect => effect.recurringSave).recurringSave.mode;
            return `${degree} (${mode})`;
        })}),
        families: [
            {id: 'recurring-save', title: 'New, additional or repeated saves', definition: 'Every nonritual, non-review source description with a new/another/additional save, or a save tied to the start or end of a turn (recovery, recurrence, repeated exposure, secondary saves).',
                match: (_plan, text) => /\b(?:new|another|additional)\b[^.]{0,40}\b(?:save|saving throw)s?\b|\b(?:end|start|beginning) of (?:each of )?(?:its|their|your) turns?\b[^.]*\b(?:save|saving throw)\b/i.test(text)},
            {id: 'duration-shortening', title: 'Remaining-duration reduction', definition: 'Descriptions that reduce a remaining duration or end an effect entirely on a critical success.',
                match: (_plan, text) => /\breduce the remaining duration\b|\bend (?:it|the effect|the effects) entirely on a critical success\b/i.test(text)},
            {id: 'degree-adjustment', title: 'Creature-dependent degree shifts', definition: 'Save spells whose preamble or rules change the degree of success for some creatures (\u201cget a success instead\u201d, \u201cone degree worse\u201d).',
                match: (plan, text) => plan.resolution?.kind === 'save' && /\b(?:degrees? of success|one degree (?:better|worse)|(?:gets?|use|uses) (?:a |the )?(?:critical )?(?:success|failure|outcome)\b[^.]{0,60}\binstead\b)/i.test(text)}
        ]
    }
};
