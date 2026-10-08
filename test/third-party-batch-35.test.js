import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {auraRadiusAt} from '../src/compiler/trigger-aura.js';

// Third-party batch 35 (2026-10-06): Overwhelming Festivities (Oracles+: the module's Aura on the caster, its radius the text's at each rank; an enemy in it
// failing a save against an emotion effect, or newly Frightened, takes the persistent mental damage at the cast rank).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const catalog = new Map(items.filter(item => item.type === 'effect').flatMap(effect => {
    const profile = {id: effect._id, name: effect.name, type: 'effect', mechanics: {rules: effect.system.rules ?? [], duration: effect.system.duration ?? null, start: null}};
    return [[effect.name, profile], [effect._id, profile]];
}));
const compile = (source, withCatalog = true) => compileAbility(source, {nativeEffectCatalog: withCatalog ? catalog : new Map(), referencedSpells: new Map()});

test('Overwhelming Festivities: the trigger aura; the module Aura\'s radius proved; the persistent mental formula', () => {
    const plan = compile(spell('Overwhelming Festivities'));
    assert.equal(plan.resolution.kind, 'trigger-aura');
    const data = plan.resolution.triggerAura;
    assert.deepEqual([data.trait, data.condition, data.type, data.persistent, data.formula], ['emotion', 'frightened', 'mental', true, '(3+floor((@item.rank - 3)/2))d4']);
    assert.deepEqual(data.radius, {base: 15, baseRank: 3, interval: 2, feet: 5});
    assert.deepEqual([3, 4, 5, 7].map(rank => auraRadiusAt('10 + 5 * (ceil(@item.level /2)-1)', rank)), [15, 15, 20, 25]);
    assert.notEqual(compile(spell('Overwhelming Festivities'), false).resolution.kind, 'trigger-aura');
});
