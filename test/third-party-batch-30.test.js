import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {ofTradition} from '../scripts/mark-ward-runtime.js';

// Third-party batch 30 (2026-10-06): Mark of Mystery (Witches+: the ward on the caster and the marked ally; a creature targeting either saves against Frightened,
// then is immune for an hour; the module's −1 penalty for creatures of the caster's tradition).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const catalog = new Map(items.filter(item => item.type === 'effect').flatMap(effect => {
    const profile = {id: effect._id, name: effect.name, type: 'effect', mechanics: {rules: effect.system.rules ?? [], duration: effect.system.duration ?? null, start: null}};
    return [[effect.name, profile], [effect._id, profile]];
}));
const compile = (source, withCatalog = true) => compileAbility(source, {nativeEffectCatalog: withCatalog ? catalog : new Map(), referencedSpells: new Map()});

test('Mark of Mystery: the ward plan; the triggered Will save (Frightened 1 / 2, an hour\'s immunity); the traditions\' types and penalty Effect', () => {
    const plan = compile(spell('Mark of Mystery'));
    assert.equal(plan.resolution.kind, 'mark-ward');
    const data = plan.resolution.markWard;
    assert.equal(data.statistic, 'will');
    assert.deepEqual(data.traditions.primal, ['animal', 'beast', 'elemental', 'fey', 'fungus', 'plant']);
    assert.match(data.penalty.uuid, /\.Item\.0MYmoIO5mSb6QBFm$/);
    assert.equal(inspectSavePlan(data.plan).supported, true);
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => data.plan.resolution.outcomes[degree].effects.map(effect => `${effect.slug} ${effect.value}`).join()), ['frightened 1', 'frightened 2']);
    assert.deepEqual([data.plan.resolution.temporaryImmunity.duration.value, data.plan.resolution.temporaryImmunity.duration.unit], [1, 'hours']);
    assert.notEqual(compile(spell('Mark of Mystery'), false).resolution.kind, 'mark-ward');
    const actor = (traits, entries = []) => ({traits: new Set(traits), itemTypes: {spellcastingEntry: entries}});
    assert.equal(ofTradition(actor(['animal']), 'primal', data.traditions.primal), true);
    assert.equal(ofTradition(actor(['dragon', 'primal']), 'primal', data.traditions.primal), true);
    assert.equal(ofTradition(actor(['humanoid'], [{tradition: 'primal'}]), 'primal', data.traditions.primal), true);
    assert.equal(ofTradition(actor(['humanoid']), 'primal', data.traditions.primal), false);
});
