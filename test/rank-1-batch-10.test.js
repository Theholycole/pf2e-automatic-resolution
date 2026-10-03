import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {compileDirectDamage} from '../src/compiler/direct-damage.js';
import {proveAllyEffect} from '../src/compiler/ally-enemy-split.js';
import {executableAllySplit, inspectSavePlan, targetParticipates} from '../scripts/basic-save-core.js';
import {SUPPORTED_RESOLUTION_KINDS} from '../scripts/runtime-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}

test('Force Bolt: damage with no check, applied to its one target', async () => {
    const plan = compileAbility(await spell('rank-1/force-bolt'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level, plan.resolution.damage.count], ['direct-damage', 'automatic', 1]);
    assert.ok(SUPPORTED_RESOLUTION_KINDS.includes('direct-damage'));
    // Another formula, a rider, or a spell attack isn't read.
    const other = await spell('rank-1/force-bolt');
    other.system.description.value = other.system.description.value.replace('deals 1d4+1 force damage', 'deals 1d6+1 force damage');
    assert.equal(compileAbility(other).resolution.kind === 'direct-damage', false);
    const rider = await spell('rank-1/force-bolt');
    rider.system.description.value = rider.system.description.value.replace('to the target.', 'to the target. The target is also dazzled for 1 round.');
    assert.equal(compileAbility(rider).resolution.kind === 'direct-damage', false);
    // (Cantrip/rank 1 batch 31: Force Fang's melee reach and Spellstrike range are read as GM reminders.) Another range isn't.
    const fang = await spell('rank-1/force-fang');
    fang.system.description.value = fang.system.description.value.replace('within your melee reach', 'within 60 feet');
    assert.notEqual(compileAbility(fang).resolution.kind, 'direct-damage');
    assert.equal(compileDirectDamage({defense: {kind: 'save'}, activation: {time: '1'}, targeting: {target: '1 creature'}, damageComponents: [], descriptionHTML: ''}), null);
});

test('Rejuvenating Flames: allies healed with the Effect, enemies saving', async () => {
    const effects = await catalog();
    const plan = compileAbility(await spell('rank-1/rejuvenating-flames'), {nativeEffectCatalog: effects});
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const split = plan.resolution.allySplit;
    assert.deepEqual([split.healing.formula, split.bonus], ['(@item.level)d4[healing]', {value: 1, type: 'status', statistic: 'fortitude', duration: '1 minute'}]);
    assert.ok(plan.targeting.actorConstraints.predicates.some(predicate => predicate.kind === 'enemy-of-caster'));
    assert.equal(targetParticipates({mode: 'ally'}), false);
    // An Effect giving more than the text says, or for longer, is refused.
    const mechanics = effects.get('Spell Effect: Rejuvenating Flames').mechanics;
    assert.equal(proveAllyEffect(mechanics, split.bonus), true);
    assert.equal(proveAllyEffect({...mechanics, rules: [{...mechanics.rules[0], value: 2}]}, split.bonus), false);
    assert.equal(proveAllyEffect(mechanics, {...split.bonus, duration: '10 minutes'}), false);
    assert.equal(executableAllySplit({...plan, compilerEvidence: {...plan.compilerEvidence, allySplit: []}}), false);
    // A text bonus that differs from the Effect isn't compiled.
    const wrong = await spell('rank-1/rejuvenating-flames');
    wrong.system.description.value = wrong.system.description.value.replace('+1 status bonus to Fortitude', '+2 status bonus to Fortitude');
    assert.equal(compileAbility(wrong, {nativeEffectCatalog: effects}).resolution.allySplit, undefined);
});
