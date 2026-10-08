import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 37 (2026-10-06): Shadow Puppetry (Wizards+: the placed burst's damage, of the caster's type, to each creature in it when cast and on the first
// Sustain each turn — no save; the item's variants' saves aren't the text's).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Shadow Puppetry: the pulse area; the ten types; the text\'s dice by rank', () => {
    const plan = compile(spell('Shadow Puppetry'));
    assert.equal(plan.resolution.kind, 'pulse-area');
    const data = plan.resolution.pulseArea;
    assert.deepEqual(data.types, ['acid', 'bludgeoning', 'cold', 'electricity', 'fire', 'force', 'piercing', 'slashing', 'sonic', 'spirit']);
    assert.equal(data.formula, '(1+(@item.rank - 1)*1)d6');
    assert.deepEqual([data.area, data.sustained, data.seconds], [{type: 'burst', value: 5}, true, 60]);
});
