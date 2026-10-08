import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {renewalAt} from '../src/compiler/promised-renewal.js';

// Third-party batch 48 (2026-10-07): Promised Renewal (Oracles+) — a dying creature's Fortitude save (Dying +2, +3 on a critical failure); a corpse, or the creature
// the save kills, the centre of the growth for 4 rounds: difficult terrain, fast healing for fungus, plant and wood minions inside (Heightened (+2): 5 feet and 2 more).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Promised Renewal: the save card and the growth', () => {
    const plan = compile(spell('Promised Renewal'));
    assert.equal(plan.resolution.kind, 'renewal');
    const {savePlan, growth} = plan.resolution.renewal;
    assert.equal(savePlan.resolution.kind, 'save');
    assert.equal(savePlan.resolution.check.statistic ?? savePlan.resolution.check.save, 'fortitude');
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => savePlan.resolution.outcomes[degree].conditionIncreases.map(entry => [entry.slug, entry.amount])), [[['dying', 2]], [['dying', 3]]]);
    assert.deepEqual([growth.radius, growth.seconds, growth.traits, growth.difficult], [15, 24, ['fungus', 'plant', 'wood'], true]);
    assert.deepEqual([3, 4, 5, 7].map(rank => renewalAt(growth, rank)), [{radius: 15, fastHealing: 3}, {radius: 15, fastHealing: 3}, {radius: 20, fastHealing: 5}, {radius: 25, fastHealing: 7}]);
    assert.match(growth.notes[0], /Protector Tree spell/);
});
