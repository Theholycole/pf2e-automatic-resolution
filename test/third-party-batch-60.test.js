import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {creepersClearAt} from '../src/compiler/creeper-maneuver.js';

// Third-party batch 60 (2026-10-07): Coiling Creepers (Witches+) — the difficult burst; the creepers' Disarm, Reposition or Trip with the spell attack modifier and the
// multiple attack penalty against a creature in or beside the area (Huge or smaller); a square cleared by 10 slashing or 2 fire at 3rd (+5 and +1 a rank).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Coiling Creepers: the area, the maneuvers and the clearing', () => {
    const plan = compile(spell('Coiling Creepers'));
    assert.equal(plan.resolution.kind, 'creeper-maneuver');
    const data = plan.resolution.creepers;
    assert.deepEqual([data.radius, data.seconds, data.maxTarget, data.maneuvers], [10, 60, 'huge', {disarm: 'reflex', reposition: 'fortitude', trip: 'reflex'}]);
    assert.deepEqual([creepersClearAt(data, 3), creepersClearAt(data, 5)], [{slashing: 10, fire: 2}, {slashing: 20, fire: 4}]);
    assert.equal(data.notes.length, 2);
});
