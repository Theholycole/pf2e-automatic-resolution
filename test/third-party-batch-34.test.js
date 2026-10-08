import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {inspectSavePlan, isExecutableLingeringPlan, lingeringExposurePlan} from '../scripts/basic-save-core.js';
import {validNoteEffect} from '../scripts/note-effects.js';

// Third-party batch 34 (2026-10-06): Enchanting Rhapsody (Oracles+: enemies in the caster's 20-foot emanation when cast and as their turns end save; −1 / −2 status
// to saves against mental effects, Fascinated on a failure, the dance a note — while in the area and 1 round after leaving; a critical success immune for a minute).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Enchanting Rhapsody: the aura; each row a note while in the area and a round after; the critical success immune', () => {
    const plan = compile(spell('Enchanting Rhapsody'));
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(inspectSavePlan(lingeringExposurePlan(plan)).blockers));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.centre, lingering.events, lingering.initial, lingering.enemiesOnly, lingering.excludeCaster], ['caster', ['turn-end'], true, true, true]);
    const notes = degree => plan.resolution.outcomes[degree].noteEffects;
    assert.deepEqual(notes('success')[0].rules, [{key: 'FlatModifier', selector: 'saving-throw', type: 'status', value: -1, predicate: ['mental']}]);
    assert.deepEqual(notes('failure')[0].rules.map(rule => rule.key === 'GrantItem' ? rule.flag : rule.value), [-2, 'conditionFascinated']);
    assert.match(notes('criticalFailure')[0].text, /Perform \(dance\)/);
    for (const degree of ['success', 'failure', 'criticalFailure']) { assert.ok(validNoteEffect(notes(degree)[0])); assert.equal(notes(degree)[0].afterLeaveRounds, 1); }
    assert.deepEqual(plan.resolution.temporaryImmunity.degrees, ['criticalSuccess']);
});
