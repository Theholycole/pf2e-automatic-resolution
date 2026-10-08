import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {diffractCone} from '../src/compiler/power-prism.js';

// Third-party batch 66 (2026-10-07): Prism of Power (Oracles+) — the 5-foot prism for the minute; Scatter (one spell attack against the AC of up to 2 creatures within 5 feet),
// Diffract (a cone of half the line's remaining feet, at least 5), Refract (the GM measuring from the prism).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Prism of Power: the three options', () => {
    const plan = compile(spell('Prism of Power'));
    assert.equal(plan.resolution.kind, 'power-prism');
    const data = plan.resolution.powerPrism;
    assert.deepEqual([data.size, data.seconds, data.modes.scatter, data.modes.diffract], [5, 60, {targets: 2, reach: 5}, {minimum: 5}]);
    assert.deepEqual([60, 45, 25, 5, 0].map(feet => diffractCone(data, feet)), [30, 20, 10, 5, 5]);
    assert.match(data.modes.refract.note, /line of effect and line of sight from the prism/);
});
