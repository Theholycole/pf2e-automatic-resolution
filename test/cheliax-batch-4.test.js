import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, isExecutableLingeringPlan} from '../scripts/basic-save-core.js';

// PF2e 8.6's last two new spells, after the user's answers (2026-10-16): Brimstone Rain (A: 1 minute) and Rude Awakening (A: a card for the ally).
const base = new URL('../.cache/pf2e-test-fixtures-861/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('Brimstone Rain: a 1-minute lingering area (difficult terrain, the turn-start Fortitude save), its blast a basic Reflex save card when it starts', async () => {
    const source = await spell('rank-5/brimstone-rain');
    const plan = compile(source);
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.durationSeconds, lingering.dismissible, lingering.terrain?.difficulty], [['turn-start'], 60, true, 2]);
    assert.equal(plan.resolution.check.statistic, 'fortitude');
    assert.equal(plan.resolution.outcomes.failure.damage.formulas[0].formula, '(@item.level - 3)d6[persistent,poison]');
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => [effect.slug, effect.value]), [['sickened', 1]]);
    assert.deepEqual(plan.resolution.outcomes.success.effects ?? [], []);
    const blast = plan.resolution.castSavePlan;
    assert.equal(inspectSavePlan(blast).supported, true, JSON.stringify(inspectSavePlan(blast).blockers));
    assert.deepEqual([blast.resolution.check.statistic, blast.resolution.check.basic], ['reflex', true]);
    assert.match(plan.resolution.reminders.map(reminder => reminder.text).join(' '), /breathing creatures/);
    assert.match(plan.resolution.dataNotes.join(' '), /no duration: the area lasts 1 minute/);
    // Kept strict: a duration in the data (nothing to decide) or another wording isn't this reading.
    const timed = structuredClone(source); timed.system.duration = {value: '1 minute', sustained: false};
    assert.equal(compile(timed).resolution.castSavePlan, undefined);
    assert.equal(compile(withText(source, text => text.replace('You can Dismiss the spell.', 'You can Sustain the spell.'))).resolution.castSavePlan, undefined);
});

test('Rude Awakening: the ally\'s card — a Will save (+2 circumstance) to suppress an emotion effect, frightened or stupefied; the status bonuses as written', async () => {
    const source = await spell('rank-1/rude-awakening');
    const plan = compile(source);
    assert.equal(plan.resolution.kind, 'suppression-save');
    assert.equal(plan.automation.level, 'automatic');
    const data = plan.resolution.suppressionSave;
    assert.deepEqual([data.statistic, data.bonus, data.against, data.seconds], ['will', {value: 2, type: 'circumstance'}, {traits: ['emotion'], conditions: ['frightened', 'stupefied']}, 60]);
    assert.deepEqual(data.rules.map(rule => [rule.type, rule.value, rule.predicate ?? null]), [['status', 1, null], ['status', 2, ['item:trait:emotion']]]);
    // (PF2e's Effect isn't applied as well: its circumstance bonuses would stack differently.)
    assert.deepEqual(plan.nativeEffects.unscoped, []);
    assert.match(plan.resolution.dataNotes.join(' '), /Reflex save; the text's Will save is the ally's/);
    assert.notEqual(compile(withText(source, text => text.replace('suppressing the effect', 'ending the effect'))).resolution.kind, 'suppression-save');
});
