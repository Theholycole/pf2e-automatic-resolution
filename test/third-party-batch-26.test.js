import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 26 (2026-10-06): View Internal Anatomy (Wizards+: the caster's precision damage on Strikes and damaging spell attacks against that
// creature, the rank's amount; its physical facts to the GM; a GM option for an ally who Aided).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = name => compileAbility(spell(name), {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('View Internal Anatomy: precision damage against the one creature; the reveal; the Aid option', () => {
    const plan = compile('View Internal Anatomy');
    assert.equal(plan.resolution.kind, 'stated-effect');
    const data = plan.resolution.statedEffect;
    assert.deepEqual([data.recipient, data.againstTarget, data.perRank, data.seconds], ['self', true, 1, 60]);
    assert.deepEqual(data.rules.map(rule => [rule.selector, rule.damageCategory, rule.value, rule.predicate.join()]),
        [['strike-damage', 'precision', '{castRank}', 'target:signature:{targetSignature}'], ['spell-damage', 'precision', '{castRank}', 'target:signature:{targetSignature},item:trait:attack']]);
    assert.equal(data.reveal.kind, 'anatomy');
    assert.deepEqual(data.gmOptions.map(option => [option.kind, option.duration.unit, option.rules[0].selector]), [['effect', 'rounds', 'strike-damage']]);
    // (A different precision step than the text's 1 isn't read.)
    const changed = spell('View Internal Anatomy');
    changed.system.description.value = changed.system.description.value.replace('increases by 1.', 'increases by 2.');
    assert.notEqual(compileAbility(changed, {nativeEffectCatalog: new Map(), referencedSpells: new Map()}).resolution.kind, 'stated-effect');
});
