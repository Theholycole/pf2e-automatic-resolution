import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 33 (2026-10-06): Discern Secrets+ (Witches+: the caster's choice — +1 status on the targets' Recall Knowledge, Seek and Sense Motive rolls while
// sustained, or each target's Concealed removed (an Effect's kept, with the counteract); two targets from 5th rank).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Discern Secrets+: the two options; sustained; two targets at 5th; the dead links claimed', () => {
    const plan = compile(spell('Discern Secrets+'));
    assert.equal(plan.resolution.kind, 'stated-effect');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    const data = plan.resolution.statedEffect;
    assert.deepEqual([data.recipient, data.sustained, data.maxTargets], ['targets', true, {base: 1, rank: 5, count: 2}]);
    assert.deepEqual(data.choice.options.map(option => option.key), ['secrets', 'concealed']);
    assert.deepEqual(data.choice.options[0].rules[0], {key: 'FlatModifier', selector: ['perception', 'skill-check'], type: 'status', value: 1, predicate: [{or: ['action:recall-knowledge', 'action:seek', 'action:sense-motive']}]});
    assert.equal(data.choice.options[1].removes.slug, 'concealed');
});
