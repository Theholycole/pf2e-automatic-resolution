import {clone} from './runtime-utils.js';
import {nativeConditionTiming} from './condition-timing.js';
import {inspectTextModifierProof, inspectLinkedEffectClaim, proveRowModifierClaim, proveWeaknessClaim} from './effect-modifier-proof.js';
import {heightenedDurationAt} from '../src/compiler/heightened-duration-compiler.js';
import {speedConditionShape, proveAreaPenalty, proveRollTwice, twistedFormRulesMatch, griefCurseProves, rolledPartRulesMatch} from '../src/compiler/native-outcome-effect-compiler.js';
import {degreeChoiceRules, proveDegreeChoiceRow, degreeFlagRules, degreeObjectRules, proveDegreeFlagRow, ruleValueAtRank, proveFlagModifier, proveStaticModifier, proveStatedEffect} from '../src/compiler/degree-choice-effect.js';

const MODULE_ID = 'pf2e-automatic-resolution';
const RUNTIME_SCHEMA = 1;

function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === 'object') return Object.fromEntries(
        Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
            .map(([key, child]) => [key, canonical(child)]));
    return value;
}

function sameMechanics(left, right) {
    return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

export async function loadNativeEffectTemplate(uuid) {
    let template = null;
    try { template = await fromUuid(uuid); } catch (_) {}
    if (!template && /^Compendium\./i.test(uuid)) {
        const source = uuid.replace(/^Compendium\./i, '');
        const marker = '.Item.';
        const index = source.lastIndexOf(marker);
        if (index > 0) {
            const pack = game.packs.get(source.slice(0, index));
            const reference = source.slice(index + marker.length);
            if (pack) {
                try { template = await pack.getDocument(reference); } catch (_) {}
                if (!template) {
                    const packIndex = await pack.getIndex({fields: ['name']});
                    const entry = packIndex.find(candidate => candidate.name === reference);
                    if (entry) template = await pack.getDocument(entry._id);
                }
            }
        }
    }
    if (!template || !(template.type === 'effect' || template.isOfType?.('effect'))) {
        throw new Error(`Could not resolve native PF2e Effect ${uuid}.`);
    }
    return template;
}

export function inspectNativeOutcomeEffect(effect, template, {degree} = {}) {
    const fail = reason => ({supported: false, reason});
    if (effect?.scope !== 'outcome' || effect?.recipient?.actor !== 'target'
        || effect?.applicationRequiresConfirmation !== true
        || effect?.resolutionStatus !== 'resolved') return fail('outcome recipient or confirmation is unsupported');
    if (!template || template.type !== 'effect' || !effect.document?.id
        || template.id !== effect.document.id) return fail('native Effect identity changed');
    const proof = effect.outcomeRule;
    // An Effect lasting as long as the spell's persistent damage; its rules must all be stated by the text.
    if (proof?.kind === 'persistent-linked-effect') {
        // A hit row of a spell attack, or (check "save") a failed-save row; the compiler checks that the row deals that
        // persistent damage.
        const rows = proof.check === 'save' ? ['success', 'failure', 'criticalFailure'] : ['criticalSuccess', 'success'];
        if (proof.degree !== degree || !rows.includes(degree) || !/^[a-z]+$/.test(proof.damageType ?? '')) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration: template.system?.duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics)) return fail('native Effect mechanics changed');
        // A Weakness's (or a Speed penalty's) predicate must name the same persistent damage.
        if ((template.system?.rules ?? []).some(rule => Array.isArray(rule.predicate) && (rule.key === 'Weakness'
            ? rule.predicate.some(term => term !== `self:condition:persistent-damage:${proof.damageType}`)
            : rule.predicate.some(term => /^self:condition:persistent-damage\b/.test(String(term)) && term !== `self:condition:persistent-damage:${proof.damageType}`)))) return fail('the Effect is limited to other persistent damage');
        const inspection = inspectLinkedEffectClaim({mechanics}, proof.claimText);
        return inspection.supported ? {supported: true, reason: null, selection: null} : fail(inspection.reason);
    }
    // A flag-choice Effect preset to this degree's value, lasting while the persistent damage does; its rules at the cast
    // rank must be exactly the row's weaknesses.
    if (proof?.kind === 'persistent-linked-degree-effect') {
        if (proof.degree !== degree || !['success', 'failure', 'criticalFailure'].includes(degree) || !/^[a-z]+$/.test(proof.damageType ?? '')) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration: template.system?.duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(template.system?.duration, proof.templateDuration)
            || template.system?.duration?.unit !== 'unlimited') return fail('native Effect mechanics changed');
        const choice = degreeFlagRules(template.system?.rules, degree);
        if (!choice?.active || choice.choice.flag !== proof.selectionFlag || choice.offered[degree] !== proof.selectionValue) return fail('native degree choice changed');
        const row = proveDegreeFlagRow(choice.active, proof.claimText, {rank: proof.rank});
        if (!row || row.damageType !== proof.damageType) return fail('the Effect no longer states the row');
        return {supported: true, reason: null, selection: {flag: proof.selectionFlag, value: proof.selectionValue}};
    }
    // An Effect choosing {badge, degree} by the result, granting the row's condition at that badge (Overstuff).
    if (proof?.kind === 'degree-object-effect') {
        if (proof.degree !== degree || !['success', 'failure', 'criticalFailure'].includes(degree)) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration: template.system?.duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(template.system?.duration, proof.templateDuration)
            || template.system?.duration?.unit !== 'unlimited') return fail('native Effect mechanics changed');
        const shape = degreeObjectRules(template.system?.rules);
        if (!shape || shape.flag !== proof.selectionFlag || !sameMechanics(shape.offered[degree], proof.selectionValue)
            || JSON.stringify(proof.carriedConditions) !== JSON.stringify([shape.condition])) return fail('native degree choice changed');
        return {supported: true, reason: null, selection: {flag: proof.selectionFlag, value: {...proof.selectionValue}}};
    }
    // An Effect a row states exactly ("loses any immunity to bleed"), lasting the spell.
    if (proof?.kind === 'stated-effect') {
        if (proof.degree !== degree || !['success', 'failure', 'criticalFailure'].includes(degree)) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration: template.system?.duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(template.system?.duration, proof.templateDuration)) return fail('native Effect mechanics changed');
        return proveStatedEffect(template.system?.rules, proof.claimText, {rank: proof.rank ?? null}) ? {supported: true, reason: null, selection: null} : fail('the Effect no longer states the row');
    }
    // A penalty Effect the row states: a row's own Effect ending after the target's next turn, or a flag Effect preset to
    // the degree (lasting the spell, optionally with an end-of-turn save that ends it).
    if (proof?.kind === 'penalty-effect' || proof?.kind === 'flag-penalty-effect') {
        if (proof.degree !== degree || !['success', 'failure', 'criticalFailure'].includes(degree) || !proof.penalty) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration: template.system?.duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(template.system?.duration, proof.templateDuration)) return fail('native Effect mechanics changed');
        if (proof.kind === 'penalty-effect') {
            const duration = template.system?.duration ?? {};
            if (!proveStaticModifier(template.system?.rules, proof.penalty) || proof.durationAnchor !== 'target-turn' || duration.value !== 1 || duration.unit !== 'rounds' || duration.expiry !== 'turn-end') return fail('the Effect no longer states the row');
            return {supported: true, reason: null, selection: null};
        }
        const chosen = proveFlagModifier(template.system?.rules, degree, proof.penalty);
        if (!chosen || chosen.flag !== proof.selectionFlag || String(chosen.value) !== String(proof.selectionValue)) return fail('native degree choice changed');
        if (proof.recurringSave != null && !(proof.recurringSave.mode === 'end' && ['fortitude', 'reflex', 'will'].includes(proof.recurringSave.statistic))) return fail('the end-of-turn save is malformed');
        return {supported: true, reason: null, selection: {flag: proof.selectionFlag, value: proof.selectionValue}};
    }
    // A basic save's critical-failure Effect whose Weakness rules give exactly the rider's weakness at the cast rank.
    if (proof?.kind === 'weakness-effect') {
        if (proof.degree !== degree || degree !== 'criticalFailure') return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration: template.system?.duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(template.system?.duration, proof.templateDuration)) return fail('native Effect mechanics changed');
        const row = proveWeaknessClaim(mechanics, proof.claimText, value => ruleValueAtRank(value, proof.rank));
        if (!row || row.value !== proof.value || row.timing.durationAnchor !== proof.durationAnchor) return fail('the Effect no longer states the rider');
        return {supported: true, reason: null, selection: null};
    }
    // A row Effect whose rules are exactly the row sentence's penalties, lasting as that sentence says.
    if (proof?.kind === 'row-modifier-effect') {
        if (proof.degree !== degree || !['success', 'failure', 'criticalFailure'].includes(degree)) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration: template.system?.duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(template.system?.duration, proof.templateDuration)) return fail('native Effect mechanics changed');
        const row = proveRowModifierClaim(mechanics, String(proof.claimText ?? '').replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, '$1'), {rank: proof.rank ?? null});
        if (!row || !sameMechanics(row.modifiers, proof.modifiers) || row.timing.durationAnchor !== proof.durationAnchor || row.timing.durationOffset !== proof.durationOffset) return fail('the Effect no longer states the row');
        return {supported: true, reason: null, selection: null};
    }
    // The whole Effect, applied as-is, when its own rules give exactly the text's modifiers to this recipient.
    if (proof?.kind === 'text-modifier') {
        if (proof.degree !== degree || !['failure', 'criticalFailure'].includes(degree)) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration: template.system?.duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics)) return fail('native Effect mechanics changed');
        const inspection = inspectTextModifierProof(proof, {name: effect.document.name, mechanics});
        return inspection.supported ? {supported: true, reason: null, selection: null} : fail(inspection.reason);
    }
    // An Effect that picks its rules by degree: preset to this degree, its active rules must state exactly the row's claims.
    if (proof?.kind === 'degree-choice') {
        if (proof.degree !== degree || !['criticalSuccess', 'success', 'failure', 'criticalFailure'].includes(degree)) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration: template.system?.duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(template.system?.duration, proof.templateDuration)) return fail('native Effect mechanics changed');
        const choice = degreeChoiceRules(template.system?.rules, proof.selectionValue);
        if (!choice || choice.choice.rollOption !== proof.rollOption || !choice.offered.includes(proof.selectionValue)) return fail('native degree choice changed');
        // The caster's type choice (when the Effect has one) is the one the proof recorded.
        if (JSON.stringify(choice.casterChoice ? {flag: choice.casterChoice.flag, values: choice.casterChoice.values} : null) !== JSON.stringify(proof.casterChoice ?? null)) return fail('native caster choice changed');
        const row = proveDegreeChoiceRow(choice.active, (proof.claims ?? []).join(' '), {rank: proof.rank, casterChoice: choice.casterChoice, inherited: proof.inherited ?? null});
        if (row && !!row.escape !== !!proof.escape) return fail('the Effect no longer states the row');
        const plain = text => String(text ?? '').replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, '$1').replace(/\s+/g, ' ').trim();
        if (!row || JSON.stringify(row.claims) !== JSON.stringify((proof.claims ?? []).map(plain))
            || JSON.stringify([...row.conditions].sort()) !== JSON.stringify([...(proof.carriedConditions ?? [])].sort())) return fail('the Effect no longer states the row');
        return {supported: true, reason: null, selection: {rollOption: proof.rollOption, value: proof.selectionValue},
            ...(proof.casterChoice ? {casterChoice: {flag: proof.casterChoice.flag, values: proof.casterChoice.values}} : {})};
    }
    // A flag Effect with a Speed penalty by degree and a granted condition (Swampcall): the shape and the row's value, proved again.
    // The growing aura's penalty while the creature is in the area (Bane / Malediction): exactly the row's penalty.
    if (proof?.kind === 'area-penalty-effect') {
        if (proof.degree !== degree || !['failure', 'criticalFailure'].includes(degree) || proof.leaveArea !== true) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration: template.system?.duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(template.system?.duration, proof.templateDuration)) return fail('native Effect mechanics changed');
        return proveAreaPenalty(template.system?.rules, proof.claimText) ? {supported: true, reason: null, selection: null} : fail('the Effect no longer states the row');
    }
    // A penalty to the creature's next attack roll or skill check this round (Murmuration's critical failure): exactly that one modifier.
    if (proof?.kind === 'next-roll-penalty-effect') {
        if (proof.degree !== degree || degree !== 'criticalFailure' || !Number.isInteger(proof.penalty)) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration: template.system?.duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(template.system?.duration, proof.templateDuration)) return fail('native Effect mechanics changed');
        const rules = template.system?.rules ?? [];
        const [rule] = rules;
        return rules.length === 1 && rule.key === 'FlatModifier' && rule.type === 'status' && Number(rule.value) === -proof.penalty && rule.removeAfterRoll
            && JSON.stringify([rule.selector].flat().sort()) === '["attack","skill-check"]' ? {supported: true, reason: null, selection: null} : fail('the Effect no longer states the row');
    }
    // Another spell's Effect as-is on the row's result (Exchange Image's Illusory Disguise), for the row's time: the Impersonate bonuses only.
    if (proof?.kind === 'spell-copy-effect') {
        if (proof.degree !== degree || !['success', 'failure', 'criticalFailure'].includes(degree) || !proof.durationOverride) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration: template.system?.duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(template.system?.duration, proof.templateDuration)) return fail('native Effect mechanics changed');
        return (template.system?.rules ?? []).every(rule => rule.key === 'FlatModifier' && rule.selector === 'deception' && JSON.stringify(rule.predicate) === '["action:impersonate"]')
            ? {supported: true, reason: null, selection: null} : fail('the Effect no longer states the row');
    }
    // A form's Speed penalty on a hit (Threefold Limb's Ice): exactly that one penalty to all Speeds, to the start of the caster's next turn.
    if (proof?.kind === 'option-speed-effect') {
        if (proof.degree !== degree || !['criticalSuccess', 'success'].includes(degree) || !proof.option) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration: template.system?.duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(template.system?.duration, proof.templateDuration)) return fail('native Effect mechanics changed');
        const rules = template.system?.rules ?? [], duration = template.system?.duration ?? {};
        const [rule] = rules;
        return rules.length === 1 && rule.key === 'FlatModifier' && JSON.stringify([rule.selector].flat()) === '["all-speeds"]' && rule.predicate == null
            && rule.type === proof.type && Number(rule.value) === proof.value && duration.value === 1 && duration.unit === 'rounds' && duration.expiry === 'turn-start'
            ? {supported: true, reason: null, selection: null} : fail('the Effect no longer states the row');
    }
    // A penalty the creature's toggle turns on (Unravel Knowledge's critical failure): exactly the toggle and the row's penalty to everything it gates.
    if (proof?.kind === 'toggle-penalty-effect') {
        if (proof.degree !== degree || !['failure', 'criticalFailure'].includes(degree) || !/^[a-z-]+$/.test(proof.option ?? '')) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration: template.system?.duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(template.system?.duration, proof.templateDuration)) return fail('native Effect mechanics changed');
        const [toggle, penalty] = template.system?.rules ?? [];
        return (template.system?.rules ?? []).length === 2 && toggle?.key === 'RollOption' && toggle.toggleable === true && toggle.option === proof.option
            && penalty?.key === 'FlatModifier' && JSON.stringify(penalty.predicate) === JSON.stringify([proof.option]) && penalty.selector === 'all'
            && penalty.type === proof.penalty?.type && Number(penalty.value) === proof.penalty?.value && proof.penalty.value < 0
            ? {supported: true, reason: null, selection: null} : fail('the Effect no longer states the row');
    }
    // The roll-twice aura's Effect (Discomfiting Whispers): exactly the row's roll twice, keep the lower, on the next attack.
    if (proof?.kind === 'roll-twice-effect') {
        if (proof.degree !== degree || !['failure', 'criticalFailure'].includes(degree)) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration: template.system?.duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(template.system?.duration, proof.templateDuration)) return fail('native Effect mechanics changed');
        return proveRollTwice(template.system?.rules, proof.claimText) ? {supported: true, reason: null, selection: null} : fail('the Effect no longer states the row');
    }
    // Seal Fate: the Effect's choice of exactly the listed types and its Weakness of the chosen type at floor(rank/2); the caster's pick presets it.
    if (proof?.kind === 'chosen-weakness-effect') {
        if (proof.degree !== degree || !['success', 'failure', 'criticalFailure'].includes(degree)) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration: template.system?.duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(template.system?.duration, proof.templateDuration)) return fail('native Effect mechanics changed');
        const rules = template.system?.rules ?? [];
        const choice = rules.find(rule => rule.key === 'ChoiceSet'), weakness = rules.find(rule => rule.key === 'Weakness');
        const ok = rules.length === 2 && choice?.flag === proof.casterChoice?.flag && JSON.stringify((choice.choices ?? []).map(option => option.value)) === JSON.stringify(proof.casterChoice?.values)
            && weakness?.type === `{item|flags.system.rulesSelections.${choice.flag}}` && String(weakness.value).replace(/\s+/g, '') === 'floor(@item.level/2)';
        return ok ? {supported: true, reason: null, selection: null, casterChoice: {flag: proof.casterChoice.flag, values: proof.casterChoice.values}} : fail('the Effect no longer states the row');
    }
    // Synesthesia: the concentrate note, Clumsy and the Speed penalty (and, in the minute's Effect, the result choice granting Stunned on a critical
    // failure) exactly as the preamble and rows state them; the minute's preset to the row's result.
    if (proof?.kind === 'senses-effect') {
        if (proof.degree !== degree || !['success', 'failure', 'criticalFailure'].includes(degree)) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration: template.system?.duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(template.system?.duration, proof.templateDuration)) return fail('native Effect mechanics changed');
        const rules = template.system?.rules ?? [], senses = proof.senses ?? {};
        const badge = rule => (rule.alterations ?? []).find(alteration => alteration.property === 'badge-value')?.value;
        const notes = rules.filter(rule => rule.key === 'ItemAlteration');
        const clumsy = rules.filter(rule => rule.key === 'GrantItem' && /i3OJZU2nk64Df3xm$/.test(rule.uuid ?? '') && !rule.predicate);
        const speed = rules.filter(rule => rule.key === 'FlatModifier');
        const choice = rules.filter(rule => rule.key === 'ChoiceSet'), stunned = rules.filter(rule => rule.key === 'GrantItem' && /dfCMdR4wnpbYNTix$/.test(rule.uuid ?? ''));
        const base = notes.length === 3 && notes.every(rule => rule.property === 'description' && JSON.stringify(rule.predicate) === '["item:trait:concentrate"]')
            && clumsy.length === 1 && badge(clumsy[0]) === senses.clumsy
            && speed.length === 1 && JSON.stringify([speed[0].selector].flat()) === '["all-speeds"]' && speed[0].type === senses.speed?.type && Number(speed[0].value) === Number(senses.speed?.value);
        const chosen = proof.degreeChoice
            ? choice.length === 1 && choice[0].rollOption === proof.degreeChoice.rollOption && JSON.stringify((choice[0].choices ?? []).map(option => option.value)) === '["failure","critical-failure"]'
                && stunned.length === 1 && badge(stunned[0]) === senses.stunned && JSON.stringify(stunned[0].predicate) === JSON.stringify([`${proof.degreeChoice.rollOption}:critical-failure`])
                && rules.length === 7 && (choice[0].choices ?? []).some(option => option.value === proof.degreeChoice.value)
            : choice.length === 0 && stunned.length === 0 && rules.length === 5;
        return base && chosen ? {supported: true, reason: null, selection: proof.degreeChoice ? {rollOption: proof.degreeChoice.rollOption, value: proof.degreeChoice.value} : null}
            : fail('the Effect no longer states the row');
    }
    // Wish-Twisted Form: the chosen type's weakness at the rank, the Speed and save penalties (and the minute's result choice with the AC penalty on a
    // critical failure); the caster's type and the row's result preset.
    if (proof?.kind === 'twisted-form-effect') {
        if (proof.degree !== degree || !['success', 'failure', 'criticalFailure'].includes(degree)) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration: template.system?.duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(template.system?.duration, proof.templateDuration)) return fail('native Effect mechanics changed');
        if (!twistedFormRulesMatch(template.system?.rules, proof.claim ?? {speed: {}, saves: {}, ac: {}}, proof.degreeChoice?.value ?? null)) return fail('the Effect no longer states the row');
        const choice = (template.system?.rules ?? []).find(rule => rule.key === 'ChoiceSet' && rule.flag);
        if (choice?.flag !== proof.casterChoice?.flag || JSON.stringify((choice.choices ?? []).map(option => option.value)) !== JSON.stringify(proof.casterChoice?.values)) return fail('native caster choice changed');
        return {supported: true, reason: null, selection: proof.degreeChoice ? {rollOption: proof.degreeChoice.rollOption, value: proof.degreeChoice.value} : null,
            casterChoice: {flag: proof.casterChoice.flag, values: proof.casterChoice.values}};
    }
    // Infectious Melody: exactly the stated penalty, each result's Effect lasting its own stated time.
    if (proof?.kind === 'duration-bound-penalty-effect') {
        const duration = template.system?.duration;
        if (proof.degree !== degree || !['success', 'failure', 'criticalFailure'].includes(degree)) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(duration, proof.templateDuration)) return fail('native Effect mechanics changed');
        const rules = template.system?.rules ?? [];
        return rules.length === 1 && rules[0].key === 'FlatModifier' && rules[0].selector === proof.penalty?.selector && rules[0].type === proof.penalty?.type && Number(rules[0].value) === Number(proof.penalty?.value)
            ? {supported: true, reason: null, selection: null} : fail('the Effect no longer states the row');
    }
    // Necrotize: each part's rule proved against its list item; the part the cast's roll (or, the critical failure's second, the caster) gives.
    if (proof?.kind === 'rolled-part-effect') {
        const duration = template.system?.duration;
        if (proof.degree !== degree || !['success', 'failure', 'criticalFailure'].includes(degree) || !['rolled', 'caster'].includes(proof.pick) || (proof.pick === 'caster' && degree !== 'criticalFailure')) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(duration, proof.templateDuration)) return fail('native Effect mechanics changed');
        return rolledPartRulesMatch(template.system?.rules ?? [], proof.rollOption, proof.parts ?? [])
            ? {supported: true, reason: null, selection: null, rolledPart: {rollOption: proof.rollOption, values: proof.parts.map(part => part.value), pick: proof.pick}} : fail('the Effect no longer states the list');
    }
    // Canticle of Everlasting Grief: the suppressed bonuses, the row's Frightened (granted), the row's duration, and the critical failure's allies' aura.
    if (proof?.kind === 'grief-curse-effect') {
        const duration = template.system?.duration;
        if (proof.degree !== degree || !['success', 'failure', 'criticalFailure'].includes(degree) || (degree === 'criticalFailure') !== (proof.allies != null)) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(duration, proof.templateDuration)) return fail('native Effect mechanics changed');
        return griefCurseProves(template.system?.rules ?? [], {frightenedUuid: proof.frightened?.uuid, value: Number(proof.frightened?.value), allies: proof.allies})
            ? {supported: true, reason: null, selection: null} : fail('the Effect no longer states the row');
    }
    // Bestial Curse: exactly the stated weakness; the hours' Effect for a failure, the unlimited one for a critical failure.
    if (proof?.kind === 'weakness-curse-effect') {
        const duration = template.system?.duration;
        if (proof.degree !== degree || !['failure', 'criticalFailure'].includes(degree) || (degree === 'criticalFailure') !== (duration?.unit === 'unlimited')) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(duration, proof.templateDuration)) return fail('native Effect mechanics changed');
        const rules = template.system?.rules ?? [];
        return rules.length === 1 && rules[0].key === 'Weakness' && rules[0].type === proof.weakness?.type && Number(rules[0].value) === Number(proof.weakness?.value)
            ? {supported: true, reason: null, selection: null} : fail('the Effect no longer states the row');
    }
    // Outcast's Curse: the skills rolled twice keeping the lower, the minutes' Effect for a success and the unlimited one for the failing rows.
    if (proof?.kind === 'skill-roll-twice-effect') {
        const duration = template.system?.duration;
        if (proof.degree !== degree || !['success', 'failure', 'criticalFailure'].includes(degree)) return fail('the Effect is not stated for this result');
        if ((degree === 'success') !== (duration?.unit === 'minutes')) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(duration, proof.templateDuration)) return fail('native Effect mechanics changed');
        const rules = template.system?.rules ?? [];
        const [rule] = rules;
        const selectors = (proof.skills ?? []).map(skill => skill === 'lore' ? 'lore-skill-check' : skill);
        const twice = rule?.key === 'RollTwice' && rule.keep === 'lower' && rule.removeAfterRoll === false && Array.isArray(rule.selector)
            && JSON.stringify([...rule.selector].sort()) === JSON.stringify(selectors.sort());
        // (Sage's Curse: the permanent Effect's result choice, the critical failure's Recall Knowledge one degree worse.)
        if (proof.recallChoice) {
            const choice = rules[1], adjust = rules[2];
            const ok = twice && rules.length === 3 && choice?.key === 'ChoiceSet' && choice.rollOption === proof.recallChoice.rollOption
                && (choice.choices ?? []).some(option => option.value === proof.recallChoice.value) && adjust?.key === 'AdjustDegreeOfSuccess'
                && JSON.stringify(adjust.predicate) === JSON.stringify(['action:recall-knowledge', `${choice.rollOption}:critical-failure`]);
            return ok ? {supported: true, reason: null, selection: {rollOption: proof.recallChoice.rollOption, value: proof.recallChoice.value}} : fail('the Effect no longer states the row');
        }
        return rules.length === 1 && twice ? {supported: true, reason: null, selection: null} : fail('the Effect no longer states the row');
    }
    if (proof?.kind === 'degree-speed-condition') {
        if (proof.degree !== degree || !['failure', 'criticalFailure'].includes(degree) || proof.durationAnchor !== 'source-turn' || proof.durationOffset !== 1) return fail('the Effect is not stated for this result');
        const mechanics = {rules: template.system?.rules, duration: template.system?.duration, start: template.system?.start};
        if (!sameMechanics(mechanics, effect.document.mechanics) || !sameMechanics(template.system?.duration, proof.templateDuration)) return fail('native Effect mechanics changed');
        const shape = speedConditionShape(template.system?.rules);
        if (!shape || shape.flag !== proof.selectionFlag || shape.offered[degree] !== proof.selectionValue || shape.conditionId !== proof.conditionId
            || shape.modifierType !== proof.modifierType || JSON.stringify(shape.selectors) !== JSON.stringify(proof.selectors)) return fail('native degree choice changed');
        return {supported: true, reason: null, selection: {flag: shape.flag, value: proof.selectionValue}};
    }
    if (proof?.kind !== 'degree-speed-penalty' || proof.degree !== degree
        || !Number.isInteger(proof.selectionValue) || proof.selectionValue >= 0
        || !proof.selectionFlag || !proof.claimText
        || !((proof.durationAnchor === 'source-turn' && proof.durationOffset === 1
            && proof.templateDuration?.value === 1 && proof.templateDuration?.unit === 'rounds')
            || (proof.durationAnchor === 'effect-start' && proof.durationOffset === 0))
        || !['circumstance', 'status', 'item'].includes(proof.modifierType)) {
        return fail('degree selection proof is missing');
    }
    const duration = template.system?.duration;
    const start = template.system?.start;
    const rules = template.system?.rules;
    if (!Array.isArray(rules) || rules.length !== 2
        || !sameMechanics({rules, duration, start}, effect.document.mechanics)
        || !sameMechanics(duration, proof.templateDuration)
        || !sameMechanics(start, proof.templateStart)) return fail('native Effect mechanics changed');
    const choice = rules.find(rule => rule.key === 'ChoiceSet');
    const modifier = rules.find(rule => rule.key === 'FlatModifier');
    if (!choice || !modifier || choice.flag !== proof.selectionFlag
        || modifier.selector !== 'all-speeds' || modifier.type !== proof.modifierType
        || ![
            `@item.flags.system.rulesSelections.${choice.flag}`,
            `{item|flags.system.rulesSelections.${choice.flag}}`
        ].includes(modifier.value)) return fail('native Speed rule changed');
    const matches = (choice.choices ?? []).filter(candidate =>
        String(candidate.label ?? '').toLowerCase().endsWith(`.${degree.toLowerCase()}`)
        && candidate.value === proof.selectionValue);
    if (matches.length !== 1) return fail('native degree choice changed');
    return {supported: true, reason: null, selection: {flag: choice.flag, value: proof.selectionValue}};
}

/** Compile-time capability check using the catalog snapshot, before a live document exists. */
export function inspectCompiledNativeOutcomeEffect(effect, {degree} = {}) {
    const document = effect?.document;
    return inspectNativeOutcomeEffect(effect, {
        id: document?.id,
        type: document?.type,
        system: {
            rules: document?.mechanics?.rules,
            duration: document?.mechanics?.duration,
            start: document?.mechanics?.start
        }
    }, {degree});
}

export function prepareNativeEffectSource(template, runtime) {
    const source = clone(template.toObject());
    delete source._id;
    delete source.folder;
    delete source.sort;
    delete source.ownership;
    source._stats ??= {};
    source._stats.compendiumSource ??= template._stats?.compendiumSource ?? template.uuid;
    source._stats.duplicateSource = template.uuid;
    if (source.system?.level && Number.isFinite(runtime.castRank)) source.system.level.value = runtime.castRank;
    // The spell's heightened duration at this rank, where the Effect template carries only the base one.
    if (runtime.heightenedDuration) source.system.duration = {
        ...(source.system.duration ?? {}),
        value: runtime.heightenedDuration.value,
        unit: runtime.heightenedDuration.unit
    };
    if (runtime.sourceActorUuid) source.system.context = {
        ...(source.system.context ?? {}),
        origin: { ...(source.system.context?.origin ?? {}), actor: runtime.sourceActorUuid,
            item: runtime.sourceItemUuid ?? null }
    };
    // The text's duration where PF2e's differs ("until the start of your next turn").
    if (runtime.durationOverride) source.system.duration = { ...(source.system.duration ?? {}), ...clone(runtime.durationOverride) };
    // Text-proved corrections to PF2e's rules ({index, key, patch} or {index, key, remove}; removals from the highest index).
    if (runtime.ruleOverrides) {
        const rules = source.system?.rules ?? [];
        for (const override of [...runtime.ruleOverrides].sort((left, right) => right.index - left.index)) {
            if (!rules[override.index] || (override.key && rules[override.index].key !== override.key)) throw new Error(`${runtime.sourceItemName}: PF2e's Effect changed since it was compiled.`);
            if (override.remove) rules.splice(override.index, 1);
            else Object.assign(rules[override.index], clone(override.patch));
        }
    }
    // Rules the text states that PF2e's Effect lacks (Spirit Sense's toggle), proved by the compiler.
    if (Array.isArray(runtime.ruleAdditions) && runtime.ruleAdditions.length) source.system.rules = [...(source.system?.rules ?? []), ...clone(runtime.ruleAdditions)];
    source.flags ??= {};
    source.flags[MODULE_ID] = {
        ...source.flags[MODULE_ID],
        ...(runtime.operationId ? {ongoingOperation: runtime.operationId} : {}),
        runtime: {schema: RUNTIME_SCHEMA, ...clone(runtime)}
    };
    return source;
}

export function prepareNativeOutcomeEffectSource(effect, template, runtime) {
    const inspection = inspectNativeOutcomeEffect(effect, template, {degree: runtime.degree});
    if (!inspection.supported) throw new Error(`${template?.name ?? effect?.label ?? 'Effect'}: ${inspection.reason}.`);
    if (!runtime.targetActorUuid || !runtime.sourceActorUuid || !runtime.castInstanceId) {
        throw new Error('Native outcome Effect requires cast and actor ownership.');
    }
    const source = prepareNativeEffectSource(template, {
        ...runtime,
        ...(effect.outcomeRule?.ruleOverrides ? {ruleOverrides: effect.outcomeRule.ruleOverrides} : {}),
        resolutionKind: 'save',
        compilerVersion: runtime.compilerVersion
    });
    // "… against you and your allies" (the text): the penalty only on rolls whose target is the caster or one of the caster's allies here.
    if (effect.outcomeRule?.againstCasterSide) {
        const caster = fromUuidSync(runtime.sourceActorUuid);
        const side = [caster, ...(canvas?.tokens?.placeables ?? []).map(token => token.actor).filter(actor => actor && caster?.isAllyOf?.(actor))].filter(Boolean);
        const rule = source.system.rules[effect.outcomeRule.againstCasterSide.ruleIndex];
        if (rule?.key !== 'FlatModifier' || !side.length) throw new Error(`${template?.name ?? 'Effect'}: the penalty's rule or the caster's side is missing.`);
        rule.predicate = [{or: [...new Set(side.map(actor => `target:signature:${actor.signature}`))]}];
    }
    // The grief curse's Frightened and allies' aura are PF2e's for the cursed creature itself ("self:signature:{item|origin.signature}", which reads the
    // caster once the module records the cast's origin): bound to the target's own signature instead.
    if (effect.outcomeRule?.kind === 'grief-curse-effect') {
        const target = fromUuidSync(runtime.targetActorUuid);
        if (!target?.signature) throw new Error(`${template?.name ?? 'Effect'}: the cursed creature is missing.`);
        for (const rule of source.system.rules ?? []) if (JSON.stringify(rule.predicate) === '["self:signature:{item|origin.signature}"]') rule.predicate = [`self:signature:${target.signature}`];
    }
    // "any additional ranged attacks made with the same weapon, spell, or ability": the first ranged attack's item locks the penalty.
    if (effect.outcomeRule?.lockToFirstItem) source.flags[MODULE_ID].lockToFirstItem = clone(effect.outcomeRule.lockToFirstItem);
    // "until the end of its next turn": the module ends it after the target's next turn (PF2e's duration is only the upper bound).
    if (effect.outcomeRule?.endsAfterTargetTurn) {
        const combat = game.combat;
        source.flags[MODULE_ID].turnBound = combat?.started
            ? {combatId: combat.id, actorUuid: runtime.targetActorUuid, startedAt: {round: combat.round, turn: combat.turn}, seen: false}
            : {worldTime: game.time.worldTime};
    }
    if (inspection.selection) {
        // The ChoiceSet this proof reads (by flag, or by roll option), preset so PF2e doesn't prompt.
        const choice = source.system.rules.find(rule => rule.key === 'ChoiceSet'
            && (inspection.selection.flag ? rule.flag === inspection.selection.flag : rule.rollOption === inspection.selection.rollOption));
        choice.selection = inspection.selection.value;
        if (choice.flag) {
            source.flags.system ??= {};
            source.flags.system.rulesSelections ??= {};
            source.flags.system.rulesSelections[choice.flag] = inspection.selection.value;
        }
    }
    if (inspection.rolledPart) {
        // The part the cast's roll gave, or the caster's second pick (Necrotize).
        const value = inspection.rolledPart.pick === 'caster' ? runtime.casterChoice : runtime.rolledChoice;
        if (!inspection.rolledPart.values.includes(value)) throw new Error(`${template?.name ?? 'Effect'}: the ${inspection.rolledPart.pick === 'caster' ? "caster's pick" : 'rolled part'} is missing.`);
        const choice = source.system.rules.find(rule => rule.key === 'ChoiceSet' && rule.rollOption === inspection.rolledPart.rollOption);
        choice.selection = value;
    }
    if (inspection.casterChoice) {
        // The caster's choice for the cast (a damage type), preset the same way.
        const value = runtime.casterChoice;
        if (!inspection.casterChoice.values.includes(value)) throw new Error(`${template?.name ?? 'Effect'}: the caster's choice is missing.`);
        const choice = source.system.rules.find(rule => rule.key === 'ChoiceSet' && rule.flag === inspection.casterChoice.flag);
        choice.selection = value;
        source.flags.system ??= {};
        source.flags.system.rulesSelections ??= {};
        source.flags.system.rulesSelections[choice.flag] = value;
    }
    source.system.context = {
        ...(source.system.context ?? {}),
        target: {actor: runtime.targetActorUuid},
        roll: null
    };
    // A row that ends sooner than the Effect's own duration ("until the end of your next turn").
    if (effect.outcomeRule.durationOverride) source.system.duration = {...source.system.duration, ...effect.outcomeRule.durationOverride};
    // "Heightened (2nd) The effects last for 2 rounds.": the duration at the cast rank.
    const heightened = heightenedDurationAt(effect.outcomeRule.heightenedDurations ?? [], runtime.castRank);
    if (heightened) source.system.duration = {...source.system.duration, value: heightened.value, unit: heightened.unit,
        expiry: heightened.unit === 'rounds' ? source.system.duration.expiry : 'turn-start'};
    // "It can attempt to Escape against your spell DC to remove …": a successful Escape ends this Effect.
    if (effect.outcomeRule.escape) {
        if (!Number.isFinite(Number(runtime.dc))) throw new Error(`${template?.name ?? 'Effect'}: the spell DC for its Escape is missing.`);
        source.flags[MODULE_ID].outcomeEffect = {...(source.flags[MODULE_ID].outcomeEffect ?? {}), castId: runtime.castInstanceId,
            escape: {dc: Number(runtime.dc), event: 'escape', expirationMode: 'event', ...(effect.outcomeRule.escapeEndsOnly ? {endsOnly: effect.outcomeRule.escapeEndsOnly} : {})}};
        source.system.description = {...(source.system.description ?? {}), value: `${source.system.description?.value ?? ''}<p>${effect.outcomeRule.escapeEndsOnly
            ? `A successful Escape check against DC ${Number(runtime.dc)} ends its ${effect.outcomeRule.escapeEndsOnly} condition.` : `Ends early when the creature succeeds at an Escape check against DC ${Number(runtime.dc)}.`}</p>`};
    }
    // "until the creature leaves the area …": the lingering area removes it from a creature no longer inside.
    if (effect.outcomeRule.leaveArea) {
        if (!runtime.lingeringCastId) throw new Error(`${template?.name ?? 'Effect'}: it ends when the creature leaves the area, which needs the spell's lingering area.`);
        source.flags[MODULE_ID].leaveArea = {castId: runtime.lingeringCastId};
    }
    if (effect.outcomeRule.durationAnchor === 'source-turn' && !runtime.effectStart) {
        throw new Error('Native outcome Effect requires cast timing for its turn anchor.');
    }
    // "until the beginning of its next turn": PF2e ends a turn-start Effect only on its origin's turn, so the creature itself is the
    // origin; what the rules read from the caster ("half your level") is fixed at the caster's level first.
    if (effect.outcomeRule.durationAnchor === 'target-turn' && (source.system.duration?.expiry ?? 'turn-start') === 'turn-start' && source.system.duration?.unit === 'rounds') {
        const caster = fromUuidSync(runtime.sourceActorUuid);
        const level = Number(caster?.level ?? caster?.system?.details?.level?.value);
        if ((source.system.rules ?? []).some(rule => /@item\.origin\./.test(JSON.stringify(rule)))) {
            if (!Number.isFinite(level)) throw new Error(`${template?.name ?? 'Effect'}: the caster's level is missing.`);
            // (A value reading the level becomes its number, rounded down: "half your level".)
            source.system.rules = source.system.rules.map(rule => {
                if (!/@item\.origin\.level/.test(String(rule.value ?? ''))) return JSON.parse(JSON.stringify(rule).replace(/@item\.origin\.level/g, String(level)));
                const value = ruleValueAtRank(String(rule.value).replace(/@item\.origin\.level/g, String(level)), 0);
                if (!Number.isFinite(value)) throw new Error(`${template?.name ?? 'Effect'}: a rule's value can't be read at the caster's level.`);
                return {...rule, value: Math.floor(value)};
            });
            if (source.system.rules.some(rule => /@item\.origin\./.test(JSON.stringify(rule)))) throw new Error(`${template?.name ?? 'Effect'}: a rule reads more of the caster than its level.`);
        }
        source.system.context = {...(source.system.context ?? {}), origin: {...(source.system.context?.origin ?? {}), actor: runtime.targetActorUuid}};
    }
    // "until the end of the target's next turn": counted from the target's own turn.
    const targetInitiative = effect.outcomeRule.durationAnchor === 'target-turn'
        ? (game.combat?.combatants.find(combatant => combatant.actor?.uuid === runtime.targetActorUuid)?.initiative ?? null) : undefined;
    if (runtime.effectStart) {
        const timing = nativeConditionTiming({
            ...source.system.duration,
            anchor: effect.outcomeRule.durationAnchor,
            offset: effect.outcomeRule.durationOffset
        }, runtime.effectStart, runtime.sourceActorUuid, runtime.targetActorUuid);
        source.system.duration.value = timing.value;
        source.system.start = {
            value: runtime.effectStart.value,
            initiative: targetInitiative !== undefined ? targetInitiative : runtime.effectStart.initiative
        };
    }
    return source;
}

export async function createNativeEffect(actor, source) {
    const [created] = await actor.createEmbeddedDocuments('Item', [source], {keepId: false});
    if (!created) throw new Error(`${actor.name}: PF2e did not create ${source.name}.`);
    // PF2e starts an Effect at its origin's initiative (the caster). A target-turn timer counts from the target's turn,
    // while the origin stays the caster (its rules may read the origin).
    const wanted = source.system?.start?.initiative;
    if (wanted != null && created.system?.start && created.system.start.initiative !== wanted && typeof created.update === 'function') await created.update({'system.start.initiative': wanted});
    return created;
}
