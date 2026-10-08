import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {gardenDice} from '../src/compiler/crystal-garden.js';

// Third-party batch 50 (2026-10-07): Garden of Crystals (Oracles+) — the difficult emanation, three walled clusters, critical force dice beside them (1d10, one more
// every 2 ranks — the module's Effect checked at every rank).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const effect = id => { const found = items.find(item => item._id === id); return {id, name: found.name, mechanics: {rules: found.system.rules, duration: found.system.duration}}; };
const compile = (source, nativeEffectCatalog = new Map()) => compileAbility(source, {nativeEffectCatalog, referencedSpells: new Map()});

test('Garden of Crystals: the terrain, the clusters and the dice', () => {
    const catalog = new Map([['NsA3mbbBphp9kx77', effect('NsA3mbbBphp9kx77')]]);
    const plan = compile(spell('Garden of Crystals'), catalog);
    assert.equal(plan.resolution.kind, 'crystal-garden');
    const data = plan.resolution.crystalGarden;
    assert.deepEqual([data.radius, data.clusters], [20, {count: 3, burst: 5, height: 10}]);
    assert.deepEqual([data.crit.die, data.crit.type, data.selectors], ['d10', 'force', ['strike-damage', 'spell-damage', 'impulse-damage']]);
    assert.deepEqual([4, 5, 6, 8, 10].map(rank => gardenDice(data.crit, rank)), [1, 1, 2, 3, 4]);
    assert.match(data.exemption, /though you can ignore it/);
    // (Without the module's matching Effect it isn't compiled.)
    assert.notEqual(compile(spell('Garden of Crystals')).resolution.kind, 'crystal-garden');
});
