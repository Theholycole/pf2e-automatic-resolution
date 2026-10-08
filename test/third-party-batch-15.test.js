import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {inspectSavePlan, isCasterShare} from '../scripts/basic-save-core.js';

// Third-party batch 15 (2026-10-06): Freezing Cold (one basic save; the area and terrain by the actions spent as reminders), Blood Surge (the caster in its own
// area, a degree better; the blood rage's parts reminders).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = name => compileAbility(spell(name), {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Freezing Cold: a basic Reflex save for 1d6 cold; the squares and the terrain by actions on the card', () => {
    const plan = compile('Freezing Cold');
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.equal(plan.resolution.check.basic, true);
    const reminders = plan.resolution.reminders.filter(reminder => reminder.kind === 'third-party-note').map(reminder => reminder.text);
    assert.match(reminders[0], /1 action: 2 squares, 2 actions: 4 squares, 3 actions: 6 squares/);
    assert.match(reminders[1], /3 rounds \(3 actions\)/);
});

test('Blood Surge: the caster saves too, a degree better; the blood rage reminders', () => {
    const plan = compile('Blood Surge');
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.ok(isCasterShare(plan));
    assert.equal(plan.resolution.reminders.filter(reminder => reminder.kind === 'third-party-note').length, 2);
});
