import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 40 (2026-10-06): Secret of the Forebearers (Witches+: the patron's skill asked; the card's options — the forebearers' Aid once a turn (a failure a
// success, legendary a critical success) and Concealed after an aided success).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Secret of the Forebearers: the skill choice; the Aid and the concealment options', () => {
    const plan = compile(spell('Secret of the Forebearers'));
    assert.equal(plan.resolution.kind, 'stated-effect');
    const data = plan.resolution.statedEffect;
    assert.equal(data.choice.options.length, 16);
    const [aid, concealed] = data.gmOptions;
    assert.deepEqual([aid.kind, aid.skill, aid.dc, aid.failureToSuccess, aid.legendaryCritical, aid.self], ['aid-roll', '{chosen}', 15, true, true, true]);
    assert.deepEqual([concealed.kind, concealed.duration, concealed.rules[0].key], ['effect', {value: 1, unit: 'rounds', expiry: 'turn-start'}, 'GrantItem']);
    assert.equal(data.seconds, 60);
});
