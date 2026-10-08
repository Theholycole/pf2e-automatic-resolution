import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {illusoryAt} from '../src/compiler/illusory-creature.js';

// Third-party batch 55 (2026-10-07): Famed Figure (Witches+) — Illusory Creature's token and card: Medium or smaller (+1 size a rank), 30 feet from the caster, melee
// (1+rank)d4 and ranged rank d4 mental (30 feet), the multiple attack penalty, the earlier image ended when it's cast again.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Famed Figure: the illusory creature with melee and ranged Strikes', () => {
    const plan = compile(spell('Famed Figure'));
    assert.equal(plan.resolution.kind, 'illusory-creature');
    const data = plan.resolution.illusoryCreature;
    assert.deepEqual([data.maxSize, data.rangeFeet, data.actions, data.saveOffset, data.map, data.endsOnRecast], ['med', 30, 2, 10, true, true]);
    assert.deepEqual([1, 2, 5].map(rank => illusoryAt(data, rank, 1)), [{maxSize: 'med', formula: '2d4', rangedFormula: '1d4'}, {maxSize: 'lg', formula: '3d4', rangedFormula: '2d4'}, {maxSize: 'grg', formula: '6d4', rangedFormula: '5d4'}]);
    assert.equal(data.notes.length, 8);
});
