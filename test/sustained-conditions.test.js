import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, isSustainedConditionPlan, sustainedMaximumSeconds, isSpellLifetime, isExecutableLingeringPlan} from '../scripts/basic-save-core.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
function detached(original, description) {
    const item = structuredClone(original);
    item._id = 'custom-sustained01';
    if (item._stats) delete item._stats.compendiumSource;
    item.name = 'Custom Sustained Spell';
    item.system.slug = 'custom-sustained-spell';
    item.system.description.value = description;
    return item;
}

test('sustained degree saves: conditions last while sustained, up to the maximum', async () => {
    for (const path of ['cantrip/information-overload.json', 'rank-1/unexpected-windfall.json']) {
        const plan = compileAbility(await fixture(path));
        assert.equal(isSustainedConditionPlan(plan), true, path);
        assert.equal(sustainedMaximumSeconds(plan.lifecycle), 60, path);
        assert.equal(inspectSavePlan(plan).supported, true, `${path}: ${JSON.stringify(inspectSavePlan(plan).blockers)}`);
    }
    // "encumbered for the duration of the spell" is a spell-lifetime condition.
    const windfall = compileAbility(await fixture('rank-1/unexpected-windfall.json'));
    assert.equal(windfall.resolution.outcomes.failure.effects.every(isSpellLifetime), true);
    assert.equal(isSpellLifetime(windfall.resolution.outcomes.success.effects[0]), false, 'Encumbered for 1 round keeps its own duration');
});

test('any other Sustain rule keeps a sustained save blocked', async () => {
    // Fiendish Rift's Sustain rule (a new exposure each Sustain) is the lingering-area route's: never a one-time save.
    const rift = compileAbility(await fixture('rank-7/fiendish-rift.json'));
    assert.equal(isExecutableLingeringPlan(rift), true);
    assert.equal(inspectSavePlan(rift).supported, false);
    const windfall = await fixture('rank-1/unexpected-windfall.json');
    const repeated = compileAbility(detached(windfall, windfall.system.description.value.replace('<p>Coins', '<p>Each time you Sustain this spell, the target attempts another save. Coins')));
    assert.ok(repeated.automation.pendingCapabilities.includes('sustain-effect'));
});

test('a spell-lifetime condition needs the Sustain controller', async () => {
    const plan = compileAbility(await fixture('rank-1/unexpected-windfall.json'));
    // The same outcomes on a plan that isn't a sustained cast are refused, not left running to the maximum.
    const unsustained = structuredClone(plan);
    unsustained.lifecycle = {...unsustained.lifecycle, sustained: false, durationSpec: {mode: 'fixed', value: 1, unit: 'minutes'}, controller: {required: false}};
    assert.equal(isSustainedConditionPlan(unsustained), false);
    assert.ok(inspectSavePlan(unsustained).blockers.some(b => b.code === 'spell-lifetime'));
    // A sustained spell with no fixed maximum isn't accepted.
    const unbounded = structuredClone(plan);
    unbounded.lifecycle.durationSpec = {mode: 'sustained', maximum: null};
    assert.equal(isSustainedConditionPlan(unbounded), false);
});
