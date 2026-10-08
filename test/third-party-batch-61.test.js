import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 61 (2026-10-07): Long Live the Revolution (Clerics+) — the act of rebellion; the noticing creatures' Will saves (willing ones failing, opposed ones +4,
// the critical successes' +1 cheers to +4); Fascinated rebels with the toggled +1 and their two controls; immunity for an hour; the Sustain's newcomers.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Long Live the Revolution: the call and its rows', () => {
    const plan = compile(spell('Long Live the Revolution'));
    assert.equal(plan.resolution.kind, 'rally-cry');
    const data = plan.resolution.rallyCry;
    assert.deepEqual([data.statistic, data.opposed, data.immuneHours, data.cheer, data.bonus, data.seconds], ['will', 4, 1, {per: 1, max: 4}, 1, 600]);
    assert.match(data.attitude, /decreases by one step/);
});
