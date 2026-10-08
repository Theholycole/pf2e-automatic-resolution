import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {inspectSavePlan, isExecutableLingeringPlan, lingeringExposurePlan} from '../scripts/basic-save-core.js';

// Third-party batch 25 (2026-10-06): Cosmic Glow (Wizards+: the placed square's basic Reflex fire when cast and on each Sustain after the GM blinks it,
// Fascinated on a critical failure; the caster and its allies in it hold the +2 Recall Knowledge bonus while there).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = name => compileAbility(spell(name), {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Cosmic Glow: the square saved against when cast and on each Sustain, Fascinated on a critical failure; the ally and caster bonus while inside', () => {
    const plan = compile('Cosmic Glow');
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(inspectSavePlan(lingeringExposurePlan(plan)).blockers));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.centre, lingering.area, lingering.events, lingering.initial, lingering.moveOnSustain, lingering.sustained], ['placed', {type: 'square', value: 5}, ['sustain'], true, true, true]);
    assert.deepEqual(lingering.memberRules, [{key: 'FlatModifier', selector: 'skill-check', type: 'status', value: 2, predicate: ['action:recall-knowledge']}]);
    assert.deepEqual([lingering.memberAllies, lingering.memberCaster], [true, true]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ['fascinated']);
    assert.equal(plan.resolution.outcomes.criticalFailure.damage.multiplier, 2);
    // (The caster's bonus without the compiler's sentences isn't accepted.)
    const broken = structuredClone(plan); broken.compilerEvidence.cosmicGlow = [];
    assert.equal(isExecutableLingeringPlan(broken), false);
});
