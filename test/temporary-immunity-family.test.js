import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {compileAbility} from '../src/compiler/index.js';
import {isExecutableDegreeSavePlan} from '../scripts/basic-save-core.js';

const contentRoot = process.env.PF2E_CONTENT_ROOT
    ?? fileURLToPath(new URL('../.cache/pf2e-test-fixtures', import.meta.url));

async function spell(path) {
    return JSON.parse(await readFile(`${contentRoot}/spells/spells/${path}`, 'utf8'));
}

function detachedCopy(source, name, description) {
    const stats = {...source._stats};
    delete stats.compendiumSource;
    return {
        ...source,
        _id: `custom-${name.toLowerCase().replaceAll(' ', '-')}`,
        _stats: stats,
        name,
        system: {
            ...source.system,
            slug: name.toLowerCase().replaceAll(' ', '-'),
            description: {...source.system.description, value: description}
        }
    };
}

function checkDeafenedOutcomes(plan) {
    const outcomes = plan.resolution.outcomes;
    assert.deepEqual(outcomes.criticalSuccess.effects, []);
    for (const [degree, expected] of Object.entries({
        success: {mode: 'fixed', value: 1, unit: 'rounds', anchor: 'effect-start', expiry: 'turn-start'},
        failure: {mode: 'fixed', value: 10, unit: 'minutes', anchor: 'effect-start', expiry: null},
        criticalFailure: {mode: 'unlimited', value: null, unit: null}
    })) {
        assert.equal(outcomes[degree].damage.mode, 'none', degree);
        assert.equal(outcomes[degree].effects.length, 1, degree);
        assert.equal(outcomes[degree].effects[0].slug, 'deafened', degree);
        assert.equal(outcomes[degree].effects[0].value, null, degree);
        for (const [key, value] of Object.entries(expected)) {
            assert.equal(outcomes[degree].effects[0].duration[key], value, `${degree}: ${key}`);
        }
    }
}

test('Deafness compiles each outcome and the save-wide temporary immunity', async () => {
    const plan = compileAbility(await spell('rank-2/deafness.json'));
    assert.equal(isExecutableDegreeSavePlan(plan), true);
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    assert.equal(plan.resolution.temporaryImmunity.key, 'deafness');
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, {value: 1, unit: 'minutes'});
    checkDeafenedOutcomes(plan);
});

test('existing becomes grammar retains Blindness outcome and immunity mapping', async () => {
    const plan = compileAbility(await spell('rank-3/blindness.json'));
    assert.equal(isExecutableDegreeSavePlan(plan), true);
    assert.equal(plan.resolution.temporaryImmunity.key, 'blindness');
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, {value: 1, unit: 'minutes'});
    assert.equal(plan.resolution.outcomes.success.effects[0].slug, 'blinded');
    assert.equal(plan.resolution.outcomes.failure.effects[0].duration.value, 1);
    assert.equal(plan.resolution.outcomes.failure.effects[0].duration.unit, 'minutes');
    assert.equal(plan.resolution.outcomes.criticalFailure.effects[0].duration.mode, 'unlimited');
});

test('detached renamed source compiles changed immunity units and preserves condition timing', async () => {
    const original = await spell('rank-2/deafness.json');
    for (const [durationText, duration] of [
        ['2 minutes', {value: 2, unit: 'minutes'}],
        ['3 hours', {value: 3, unit: 'hours'}]
    ]) {
        const custom = detachedCopy(original, 'Echo Silence', original.system.description.value
            .replace('temporarily immune for 1 minute.', `temporarily immune for ${durationText}.`));
        const plan = compileAbility(custom);
        assert.equal(custom._stats.compendiumSource, undefined);
        assert.equal(isExecutableDegreeSavePlan(plan), true, durationText);
        assert.equal(plan.source.name, 'Echo Silence');
        assert.equal(plan.resolution.temporaryImmunity.key, 'echo-silence');
        assert.deepEqual(plan.resolution.temporaryImmunity.duration, duration);
        checkDeafenedOutcomes(plan);
    }
});

test('qualified immunity clauses and unrelated effects stay gated', async () => {
    const original = await spell('rank-2/deafness.json');
    for (const suffix of [
        'against this spell only if it can hear',
        'unless it takes sonic damage',
        'and its allies are also immune'
    ]) {
        const custom = detachedCopy(original, 'Echo Silence', original.system.description.value
            .replace('temporarily immune for 1 minute.', `temporarily immune for 1 minute ${suffix}.`));
        const plan = compileAbility(custom);
        assert.equal(plan.resolution.temporaryImmunity, undefined, suffix);
        assert.equal(isExecutableDegreeSavePlan(plan), false, suffix);
        assert.ok(plan.automation.pendingCapabilities.includes('preamble:temporary-immunity'), suffix);
    }
    // Fear the Sun's other rules are read since rank 2 batch 20 (its Light Blindness note and the GM-gated Blinded): executable, with the
    // spell's immunity.
    const sun = compileAbility(await spell('rank-2/fear-the-sun.json'));
    assert.equal(isExecutableDegreeSavePlan(sun), true);
    assert.deepEqual(sun.resolution.temporaryImmunity.duration, {value: 1, unit: 'minutes'});
});

test('a conditional prefix cannot masquerade as an unconditional immunity sentence', async () => {
    const original = await spell('rank-2/deafness.json');
    for (const prefix of ['If the target is in daylight, ', 'Only if the target is human, ']) {
        const custom = detachedCopy(original, 'Echo Silence', original.system.description.value
            .replace('The target is then temporarily immune for 1 minute.',
                `${prefix}the target is then temporarily immune for 1 minute.`));
        const plan = compileAbility(custom);
        assert.equal(plan.resolution.temporaryImmunity, undefined, prefix);
        assert.equal(isExecutableDegreeSavePlan(plan), false, prefix);
        assert.ok(plan.automation.pendingCapabilities.includes('preamble:temporary-immunity'), prefix);
    }
});
