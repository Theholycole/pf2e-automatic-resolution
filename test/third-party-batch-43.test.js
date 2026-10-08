import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {executableCasterChoice, inspectSavePlan, isCasterConditionOnly} from '../scripts/basic-save-core.js';
import {validNoteEffect} from '../scripts/note-effects.js';

// Third-party batch 43 (2026-10-06): Planar Court (Clerics+: the text's Will save; the caster names an attribute — −1 / −2 status to its checks, DCs and saves while
// sustained; the caster Doomed 1 on a critical success; the vanishing the GM's).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Planar Court: the attribute pick; the sustained penalty notes; the caster\'s Doomed', () => {
    const plan = compile(spell('Planar Court'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual([plan.resolution.check.statistic, plan.resolution.check.basic], ['will', false]);
    assert.ok(executableCasterChoice(plan));
    assert.deepEqual(plan.resolution.casterChoice.values, ['str', 'dex', 'con', 'int', 'wis', 'cha']);
    const str = degree => plan.resolution.outcomes[degree].noteEffects.find(note => note.option === 'str');
    assert.deepEqual([str('failure').rules[0].selector, str('failure').rules[0].value, str('criticalFailure').rules[0].value], ['str-based', -1, -2]);
    assert.ok(validNoteEffect(str('failure')) && str('failure').duration.sustained);
    assert.ok(isCasterConditionOnly(plan.resolution.outcomes.criticalSuccess));
    assert.match(plan.resolution.reminders.at(-1).text, /vanish from the field/);
});
