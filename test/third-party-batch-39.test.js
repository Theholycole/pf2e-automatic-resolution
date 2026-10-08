import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 39 (2026-10-06): Metamorphic Armor (Magus+: the caster's switchable Effect — each listed resistance type, +1 circumstance to AC, or +1 status to
// Reflex saves against area spells; the Strike the caster's).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Metamorphic Armor: nine switchable options from the list; the resistances at half the level', () => {
    const plan = compile(spell('Metamorphic Armor'));
    assert.equal(plan.resolution.kind, 'rule-set');
    const data = plan.resolution.ruleSet;
    assert.deepEqual(data.choice.options.map(option => option.key), ['resist-bludgeoning', 'resist-piercing', 'resist-slashing', 'resist-acid', 'resist-cold', 'resist-electricity', 'resist-fire', 'ac', 'reflex']);
    assert.deepEqual(data.choice.options[0].rules, [{key: 'Resistance', type: 'bludgeoning', value: 'max(1,floor(@actor.level/2))'}]);
    assert.deepEqual(data.choice.options[6].rules, [{key: 'Resistance', type: 'fire', value: 'floor(@actor.level/2)+2'}]);
    assert.deepEqual(data.choice.options[7].rules, [{key: 'FlatModifier', selector: 'ac', type: 'circumstance', value: 1}]);
    assert.equal(data.seconds, 60);
    assert.match(data.choice.switchable, /Strike/);
});
