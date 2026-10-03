import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {afflictionStageDelta, carePlanAtRank, counteracts, isExecutableCarePlan, nextAfflictionBadge, stageLengthSeconds} from '../scripts/affliction-care-core.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
function detached(original, description) {
    const item = structuredClone(original);
    item._id = 'custom-care-spell1';
    if (item._stats) delete item._stats.compendiumSource;
    item.name = 'Custom Care Spell';
    item.system.slug = 'custom-care-spell';
    item.system.description.value = description;
    return item;
}

test('the four affliction-care spells compile to executable operations', async () => {
    const moment = compileAbility(await fixture('rank-5/restorative-moment.json'));
    assert.equal(isExecutableCarePlan(moment), true);
    assert.deepEqual(moment.resolution.operations.map(op => op.op), ['decrease-conditions', 'affliction-saves']);
    assert.deepEqual(moment.resolution.operations[0].slugs, ['doomed', 'drained']);
    assert.deepEqual(moment.resolution.immunity, {value: 1, unit: 'days'});
    const restoration = compileAbility(await fixture('rank-2/restoration.json'));
    assert.equal(isExecutableCarePlan(restoration), true);
    assert.deepEqual(restoration.resolution.modes.map(mode => mode.id), ['lessen-toxin', 'reduce-condition']);
    assert.equal(restoration.resolution.oncePerExposure, true);
    const course = compileAbility(await fixture('rank-4/take-its-course.json'));
    assert.equal(isExecutableCarePlan(course), true);
    assert.deepEqual(course.resolution.unwillingSave, {statistic: 'will', negates: true});
    const expulsion = compileAbility(await fixture('rank-5/ectoplasmic-expulsion.json'));
    assert.equal(isExecutableCarePlan(expulsion), true);
    assert.deepEqual(expulsion.resolution.operations[0].traits, ['emotion', 'possession']);
    assert.equal(expulsion.resolution.counteractFailure.bonus, 2);
});

test('heightened entries change the operations by cast rank', async () => {
    const restoration = compileAbility(await fixture('rank-2/restoration.json')).resolution;
    const at2 = carePlanAtRank(restoration, 2), at4 = carePlanAtRank(restoration, 4), at6 = carePlanAtRank(restoration, 6);
    assert.deepEqual(at2.modes.find(mode => mode.id === 'reduce-condition').operations[0].from, ['clumsy', 'enfeebled', 'stupefied']);
    assert.deepEqual(at4.modes.find(mode => mode.id === 'reduce-condition').operations[0].from, ['clumsy', 'enfeebled', 'stupefied', 'drained']);
    assert.equal(at2.modes.find(mode => mode.id === 'lessen-toxin').operations[0].by, 1);
    assert.equal(at4.modes.find(mode => mode.id === 'lessen-toxin').operations[0].by, 2);
    assert.ok(at4.modes.some(mode => mode.id === 'reduce-doomed') && !at2.modes.some(mode => mode.id === 'reduce-doomed'));
    assert.deepEqual([at4.permanent.doomed.allowed, at6.permanent.doomed.allowed], [false, true]);
    const course = compileAbility(await fixture('rank-4/take-its-course.json')).resolution;
    assert.deepEqual([carePlanAtRank(course, 4).pickAny, carePlanAtRank(course, 7).pickAny], [false, true]);
});

test('PF2e affliction and counteract arithmetic', () => {
    assert.deepEqual([0, 1, 2, 3].map(degree => afflictionStageDelta(degree)), [2, 1, -1, -2]);
    assert.deepEqual([0, 1, 2, 3].map(degree => afflictionStageDelta(degree, true)), [2, 1, 0, -1]);
    // Without onset badge = stage; with onset badge 1 is the onset.
    assert.equal(nextAfflictionBadge({badge: 2, max: 3, onset: false}, -2), null, 'cured');
    assert.equal(nextAfflictionBadge({badge: 2, max: 3, onset: false}, 2), 3, 'capped at the last stage');
    assert.equal(nextAfflictionBadge({badge: 3, max: 6, onset: true}, -1), 2, 'stage 2 → 1 is badge 2 with onset');
    assert.equal(nextAfflictionBadge({badge: 3, max: 6, onset: true}, -5, 1), 2, 'floor at stage 1 never re-enters onset');
    assert.equal(stageLengthSeconds({value: 1, unit: 'days'}), 86400);
    assert.deepEqual([0, 1, 2, 3].map(degree => counteracts(degree, 5, 6)), [false, false, true, true]);
    assert.deepEqual([0, 1, 2, 3].map(degree => counteracts(degree, 5, 4)), [false, true, true, true]);
    assert.equal(counteracts(3, 5, 9), false);
});

test('reworded care sentences block instead of compiling a guess', async () => {
    const moment = await fixture('rank-5/restorative-moment.json');
    const reworded = compileAbility(detached(moment, moment.system.description.value.replace('temporarily immune for 1 day', 'temporarily immune for 1 day unless it is asleep')));
    assert.equal(isExecutableCarePlan(reworded), false);
    const restoration = await fixture('rank-2/restoration.json');
    const extra = compileAbility(detached(restoration, restoration.system.description.value.replace('cure the affliction.', 'cure the affliction. The target also regains 10 Hit Points.')));
    assert.equal(isExecutableCarePlan(extra), false);
});

test('curse floors and a behaviour choice compile on the save route', async () => {
    const curse = compileAbility(await fixture('rank-5/mariners-curse.json'));
    assert.equal(inspectSavePlan(curse).supported, true);
    assert.deepEqual(curse.resolution.outcomes.failure.effects.map(e => [e.slug, e.value]), [['sickened', 1]]);
    assert.deepEqual(curse.resolution.outcomes.criticalFailure.effects.map(e => [e.slug, e.value]), [['sickened', 2]]);
    assert.equal(curse.resolution.outcomes.failure.conditionFloor.value, 1);
    assert.deepEqual(curse.resolution.outcomes.failure.conditionFloor.situational.grant, {slug: 'slowed', value: 1});
    const cordyceps = compileAbility(await fixture('rank-3/cordyceps-command.json'));
    assert.equal(inspectSavePlan(cordyceps).supported, true);
    assert.deepEqual(cordyceps.resolution.castChoice.options.map(option => option.name), ['Ascend', 'Consume', 'Descend', 'Lure']);
    assert.equal(cordyceps.resolution.castChoice.stage, 3);
});
