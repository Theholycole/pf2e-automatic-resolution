import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 38 (2026-10-06): Channel Imperial Dragon (Tian Xia+: the caster's dragon trait and its type's, resistance to its damage type, +1 to saves
// against that trait — the dragon its Imperial Dragon Emissary pick or asked; each Sustain's Diplomacy and Intimidation bonus, one more every 3 ranks).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Channel Imperial Dragon: five dragons from the dedication; the rules from the text; the Sustain option', () => {
    const plan = compile(spell('Channel Imperial Dragon'));
    assert.equal(plan.resolution.kind, 'stated-effect');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    const data = plan.resolution.statedEffect;
    assert.equal(data.presetFlag, 'imperialDragonEmissary.dragonType');
    const sea = data.choice.options.find(option => option.key === 'sea');
    assert.deepEqual(sea.rules, [{key: 'ActorTraits', add: ['dragon', 'water']}, {key: 'Resistance', type: 'cold', value: 'max(1,floor(@actor.level/2))'},
        {key: 'FlatModifier', selector: 'saving-throw', type: 'status', value: 1, predicate: ['water']}]);
    assert.deepEqual(data.choice.options.map(option => option.key), ['forest', 'sea', 'sky', 'soverign', 'underworld']);
    assert.deepEqual(data.socialBonus, {base: 1, rank: 3, interval: 3, add: 1});
    assert.deepEqual([data.gmOptions[0].self, data.gmOptions[0].duration], [true, {value: 1, unit: 'rounds', expiry: 'turn-end'}]);
});
