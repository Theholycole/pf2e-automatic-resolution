import {nativeConditionTiming} from './condition-timing.js';
import {MODULE_ID} from './effect-runtime.js';
import {inheritedSpeedClauseComplete,parseGeneratedSpeedClause} from '../src/compiler/generated-speed-modifier.js';

const DEGREES = ['criticalSuccess','success','failure','criticalFailure'];

function validModifier(modifier, rawText) {
    const duration = modifier?.duration;
    const claimMatches = modifier?.inheritedFrom
        ? /^As (?:critical success|success|failure|critical failure)\b/i.test(String(rawText ?? ''))
            && typeof modifier.claimText === 'string' && modifier.claimText.length > 0
        : modifier?.claimText === String(rawText ?? '').replace(/\s+/g,' ').trim();
    return modifier?.kind === 'speed-penalty' && modifier.selector === 'all-speeds'
        && ['circumstance','status','item'].includes(modifier.modifierType)
        && Number.isInteger(modifier.value) && modifier.value < 0 && modifier.value % 5 === 0
        && claimMatches
        // "until it leaves the area (or Escapes)": no timer; the lingering area removes it.
        && (duration?.mode === 'leave-area' ? duration.value === null && typeof duration.sourceText === 'string' && (duration.escape == null || duration.escape === true)
        // ("until it Escapes": the spell's time, an Escape ending it sooner.)
        : duration?.mode === 'escape' ? duration.value === null && typeof duration.sourceText === 'string'
        : duration?.mode === 'fixed' && Number.isInteger(duration.value) && duration.value > 0
        && ['rounds','minutes','hours'].includes(duration.unit)
        && (duration.unit === 'rounds'
            ? ['turn-start','turn-end'].includes(duration.expiry)
            : duration.expiry === null)
        && ((duration.anchor === 'effect-start' && duration.offset === 0)
            || (['source-turn','target-turn'].includes(duration.anchor)
                && duration.unit === 'rounds' && duration.value === 1 && duration.offset === 1))
        && typeof duration.sourceText === 'string' && duration.sourceText.length > 0);
}

/** Check source-bound compiler proof before routing or creating any target document. */
export function inspectGeneratedSpeedProof(proof, outcomes, {lifecycle} = {}) {
    const hasModifiers = DEGREES.some(degree => (outcomes?.[degree]?.modifiers ?? []).length > 0);
    if (!proof && !hasModifiers) return {supported:true,used:false,reason:null};
    // A lingering area's proof is judged on its exposures (instantaneous); its penalties may last until leaving the area.
    const leaveArea = DEGREES.some(degree => (outcomes?.[degree]?.modifiers ?? []).some(modifier => modifier.duration?.mode === 'leave-area'));
    // (Or the spell's fixed time when every penalty lasts until the creature Escapes: Stone Lance.)
    const allEscape = hasModifiers && DEGREES.every(degree => (outcomes?.[degree]?.modifiers ?? []).every(modifier => modifier.duration?.mode === 'escape'));
    if (proof?.kind !== 'degree-speed-penalties' || (leaveArea && proof.lingering !== true)
        || lifecycle && !proof.lingering && ((lifecycle.durationSpec?.mode !== 'instantaneous' && !(allEscape && lifecycle.durationSpec?.mode === 'fixed' && !lifecycle.sustained))
            || lifecycle.controller?.required === true)) {
        return {supported:false,used:true,reason:'generated Speed proof or item lifecycle changed'};
    }
    for (const degree of DEGREES) {
        const outcome = outcomes?.[degree];
        const modifiers = outcome?.modifiers ?? [];
        if (!outcome || !Array.isArray(modifiers) || modifiers.length > 1
            || proof.sourceText?.[degree] !== outcome.rawText
            || JSON.stringify(proof.byDegree?.[degree]) !== JSON.stringify(modifiers)
            || JSON.stringify(proof.conditionEffects?.[degree]) !== JSON.stringify(
                (outcome.effects ?? []).map(effect => ({slug:effect.slug,value:effect.value,duration:effect.duration})))
            || modifiers.some(modifier => !validModifier(modifier,outcome.rawText))) {
            return {supported:false,used:true,reason:`${degree} Speed modifier differs from source proof`};
        }
        for (const modifier of modifiers) if (modifier.inheritedFrom) {
            const parent=proof.byDegree?.[modifier.inheritedFrom];
            const {inheritedFrom,...own}=modifier;
            if (!Array.isArray(parent) || parent.length !== 1
                || JSON.stringify(parent[0]) !== JSON.stringify(own)
                || !inheritedSpeedClauseComplete(outcomes,degree,modifier.inheritedFrom,modifier)
                || !String(outcome.rawText).toLowerCase().startsWith(
                    `as ${modifier.inheritedFrom.replace(/([A-Z])/g,' $1').toLowerCase()}`)) {
                return {supported:false,used:true,reason:`${degree} Speed inheritance changed`};
            }
        }
        for (const modifier of modifiers) if (!modifier.inheritedFrom
            && JSON.stringify(parseGeneratedSpeedClause(outcome)) !== JSON.stringify(modifier)) {
            return {supported:false,used:true,reason:`${degree} Speed modifier no longer matches its source clause`};
        }
        const inherited = /^As (critical success|success|failure|critical failure)\b/i.exec(
            String(outcome.rawText ?? '').trim());
        const predecessor = inherited && ({'critical success':'criticalSuccess',success:'success',
            failure:'failure','critical failure':'criticalFailure'})[inherited[1].toLowerCase()];
        if (predecessor && predecessor !== degree && (proof.byDegree?.[predecessor]?.length ?? 0) > 0
            && !modifiers.some(modifier => modifier.inheritedFrom === predecessor)) {
            return {supported:false,used:true,reason:`${degree} omits inherited Speed modifier`};
        }
    }
    return {supported:true,used:true,reason:null};
}

export function prepareGeneratedSpeedEffectSource(modifier, runtime) {
    if (!validModifier(modifier,runtime.claimText)
        || !runtime.castId || !runtime.sourceActorUuid || !runtime.targetActorUuid
        || !runtime.effectStart) throw new Error('Generated Speed penalty lacks certified cast timing or ownership.');
    const leaveArea = modifier.duration.mode === 'leave-area';
    if (leaveArea && !runtime.lingeringCastId) throw new Error('A penalty that lasts until the creature leaves the area needs its lingering area.');
    // ("until it Escapes": the spell's own fixed time, with the Escape the outcome Effect carries.)
    const untilEscape = modifier.duration.mode === 'escape';
    const spellTime = untilEscape ? runtime.spellDuration : null;
    if (untilEscape && !(Number.isInteger(spellTime?.value) && spellTime.value > 0 && ['rounds','minutes','hours'].includes(spellTime.unit))) throw new Error('A penalty until the creature Escapes needs the spell\'s fixed duration.');
    const timing = leaveArea ? {value:-1,originActorUuid:runtime.sourceActorUuid} : untilEscape ? {value:spellTime.value,originActorUuid:runtime.sourceActorUuid}
        : nativeConditionTiming(modifier.duration,runtime.effectStart,runtime.sourceActorUuid,runtime.targetActorUuid);
    const duration = leaveArea ? {value:-1,unit:'unlimited',expiry:null,sustained:false} : untilEscape ? {value:spellTime.value,unit:spellTime.unit,expiry:spellTime.unit === 'rounds' ? 'turn-start' : null,sustained:false}
        : {value:timing.value,unit:modifier.duration.unit,expiry:modifier.duration.expiry,sustained:false};
    return {
        name:`${runtime.sourceItemName}: ${Math.abs(modifier.value)}-foot Speed penalty`,
        type:'effect',img:'icons/svg/downgrade.svg',
        flags:{[MODULE_ID]:{
            ongoingOperation:runtime.operationId,
            // Removed by the lingering area when the creature leaves it (or the area ends); an Escape ends it too.
            ...(leaveArea ? {leaveArea:{castId:runtime.lingeringCastId}} : {}),
            ...((leaveArea && modifier.duration.escape) || untilEscape ? {outcomeEffect:{castId:runtime.castId,escape:{dc:Number(runtime.dc),event:'escape',expirationMode:untilEscape ? 'first' : 'event',
                ...(untilEscape && runtime.escapeDamage ? {damage:{...runtime.escapeDamage}} : {})},conditions:[]}} : {}),
            runtime:{schema:1,kind:'generated-speed-penalty',castInstanceId:runtime.castId,
                sourceActorUuid:runtime.sourceActorUuid,sourceItemUuid:runtime.sourceItemUuid,
                sourceItemName:runtime.sourceItemName,targetActorUuid:runtime.targetActorUuid,
                degree:runtime.degree,compilerVersion:runtime.compilerVersion}
        }},
        system:{level:{value:runtime.castRank},duration,
            start:{value:runtime.effectStart.value,initiative:runtime.effectStart.initiative},
            context:{origin:{actor:timing.originActorUuid,item:runtime.sourceItemUuid},
                target:{actor:runtime.targetActorUuid},roll:null},
            rules:[{key:'FlatModifier',selector:'all-speeds',type:modifier.modifierType,value:modifier.value}]}
    };
}

export function generatedSpeedLabel(modifier) {
    return `${Math.abs(modifier.value)}-foot ${modifier.modifierType} Speed penalty`;
}
