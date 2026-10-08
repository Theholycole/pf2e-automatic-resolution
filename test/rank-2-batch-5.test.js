import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}, ...(e.system?.badge ? {badge: e.system.badge} : {})}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}
const effects = await catalog();
const compile = source => compileAbility(source, {nativeEffectCatalog: effects});



// Rank 2, batch 5 (2026-09-30): target lines with a stated limit — PF2e data where it has it, the GM's answer where it doesn't.
test('target lines: sizes, traits (present or absent), living or undead, not the caster, persistent bleed, enemies, and GM questions', async () => {
    const {compileActorTargetConstraints} = await import('../src/compiler/target-predicate-compiler.js');
    const {validateActorTarget, inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const of = target => compileActorTargetConstraints({target});
    assert.deepEqual(of('1 Medium or smaller creature').predicates, [{kind: 'size-at-most', size: 'med'}]);
    assert.deepEqual(of('1 corporeal creature').predicates, [{kind: 'trait', slug: 'incorporeal', present: false}]);
    assert.deepEqual(of('1 living humanoid').predicates.map(p => p.kind), ['living-creature', 'trait']);
    assert.deepEqual(of('1 creature taking bleed damage').predicates, [{kind: 'persistent-damage', damageType: 'bleed'}]);
    assert.deepEqual(of('each foe in the area').predicates, [{kind: 'enemy-of-caster'}]);
    assert.equal(of('1 flying creature').predicates[0].kind, 'gm-confirmed');
    assert.deepEqual(of('1 object held by 1 creature and the creature holding it'), {sourceText: '1 object held by 1 creature and the creature holding it', supportsActorTargets: true, complete: true, predicates: []});
    // The runtime checks against PF2e's actor data.
    const actor = ({traits = [], uuid = 'Actor.a', items = []} = {}) => ({uuid, type: 'npc', traits: new Set(traits), items, isOfType: () => true});
    const check = (target, a, extra = {}) => validateActorTarget({...of(target), ...extra}, a).eligible;
    assert.equal(check('1 corporeal creature', actor({traits: ['incorporeal']})), false);
    assert.equal(check('1 corporeal creature', actor()), true);
    assert.equal(check('1 living or undead creature', actor({traits: ['construct']})), false);
    assert.equal(check('1 living or undead creature', actor({traits: ['undead']})), true);
    assert.equal(check('1 creature other than you', actor({uuid: 'Actor.c'}), {casterUuid: 'Actor.c'}), false);
    assert.equal(check('1 creature other than you', actor({uuid: 'Actor.t'}), {casterUuid: 'Actor.c'}), true);
    const bleeding = actor({items: [{type: 'condition', slug: 'persistent-damage', system: {persistent: {damageType: 'bleed'}}}]});
    const burning = actor({items: [{type: 'condition', slug: 'persistent-damage', system: {persistent: {damageType: 'fire'}}}]});
    assert.deepEqual([check('1 creature taking bleed damage', bleeding), check('1 creature taking bleed damage', burning)], [true, false]);
    // Newly executable: Lock Item (rank 2), Aberrant Whispers (rank 3).
    assert.equal(inspectSavePlan(compile(await spell('rank-2/lock-item'))).supported, true);
    assert.equal(inspectSavePlan(compile(await spell('rank-3/aberrant-whispers'))).supported, true);
    // Kept strict: an unknown limit stays incomplete.
    assert.equal(of('1 creature that dreams of the sea').complete, false);
});
