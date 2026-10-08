import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 62 (2026-10-07): Unleash True Power (Witches+) — every other spell a rank higher (to 10th); a spell of 2 actions or less cast through the patron, 1d6
// spirit a rank of it (basic Fortitude); the end's 10d6 spirit basic Fortitude save card for the caster and every creature within 10 feet.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Unleash True Power: the heightening, the toll and the final shock', () => {
    const plan = compile(spell('Unleash True Power'));
    assert.equal(plan.resolution.kind, 'true-power');
    const data = plan.resolution.truePower;
    assert.deepEqual([data.maxActions, data.patron, data.heighten, data.seconds], [2, {die: 6, type: 'spirit', statistic: 'fortitude'}, {by: 1, cap: 10}, 60]);
    assert.deepEqual([data.end.radius, data.end.formula, data.end.type, data.end.statistic, data.end.includesCaster], [10, '10d6', 'spirit', 'fortitude', true]);
    assert.equal(data.endPlan.resolution.kind, 'save');
    assert.equal(data.endPlan.resolution.check.basic ?? true, true);
});
