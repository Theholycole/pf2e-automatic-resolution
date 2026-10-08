import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

// Third-party batch 42 (2026-10-06): Chorus Made Manifest (Tian Xia+: the swarm form generated from the text behind its toggle; the Choral Swarm Attack the card's
// basic Fortitude save in a 15-foot cone, Deafened for a round on a critical failure).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Chorus Made Manifest: the form\'s rules behind the toggle; the swarm attack\'s own save plan', () => {
    const plan = compile(spell('Chorus Made Manifest'));
    assert.equal(plan.resolution.kind, 'stated-effect');
    const data = plan.resolution.statedEffect;
    assert.equal(data.toggle.option, 'chorus-form');
    assert.ok(data.rules.every(rule => JSON.stringify(rule.predicate) === '["chorus-form"]'));
    assert.deepEqual(data.rules.map(rule => [rule.key, rule.type ?? rule.selector ?? (rule.add ?? []).join('+'), rule.value ?? null]),
        [['ActorTraits', 'animal+swarm', null], ['Resistance', 'physical', 8], ['Weakness', 'area-damage', 8], ['Weakness', 'splash-damage', 8], ['Sense', 'low-light-vision', null], ['BaseSpeed', 'fly', 60]]);
    const attack = data.gmOptions[0];
    assert.equal(attack.kind, 'save');
    assert.equal(inspectSavePlan(attack.plan).supported, true);
    assert.deepEqual(attack.plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ['deafened']);
    assert.equal(attack.patch.area.value, 15);
});
