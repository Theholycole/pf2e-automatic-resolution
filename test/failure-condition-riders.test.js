import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {compileAbility} from '../src/compiler/index.js';
import {isExecutableDegreeSavePlan} from '../scripts/basic-save-core.js';

const contentRoot = process.env.PF2E_CONTENT_ROOT
    ?? fileURLToPath(new URL('../.cache/pf2e-test-fixtures', import.meta.url));
const multipliers = {criticalSuccess: 0, success: 0.5, failure: 1, criticalFailure: 2};

async function spell(path) {
    return JSON.parse(await readFile(`${contentRoot}/spells/spells/${path}`, 'utf8'));
}

function independentCopy(source, name, description = source.system.description.value) {
    const stats = {...source._stats};
    delete stats.compendiumSource;
    return {
        ...source,
        _id: `custom-${name.replaceAll(' ', '-').toLowerCase()}`,
        _stats: stats,
        name,
        system: {
            ...source.system,
            slug: name.toLowerCase().replaceAll(' ', '-'),
            description: {...source.system.description, value: description}
        }
    };
}

function checkDegrees(plan, slug, value, duration) {
    for (const [degree, multiplier] of Object.entries(multipliers)) {
        const outcome = plan.resolution.outcomes[degree];
        assert.equal(outcome.damage.multiplier, multiplier, `${degree}: damage multiplier`);
        assert.deepEqual(outcome.damage.sourceComponentIds, multiplier ? ['0'] : [], `${degree}: damage components`);
        assert.deepEqual(outcome.effects.map(effect => effect.slug),
            degree === 'failure' || degree === 'criticalFailure' ? [slug] : [], `${degree}: conditions`);
        if (outcome.effects.length) {
            assert.equal(outcome.effects[0].value, value, `${degree}: condition value`);
            if (duration) {
                for (const [key, expected] of Object.entries(duration)) {
                    assert.equal(outcome.effects[0].duration[key], expected, `${degree}: duration ${key}`);
                }
            } else assert.equal(outcome.effects[0].duration, null, `${degree}: duration`);
        }
    }
    assert.notStrictEqual(plan.resolution.outcomes.failure.effects[0],
        plan.resolution.outcomes.criticalFailure.effects[0]);
}

test('official failure riders inherit to critical failure with basic-save damage scaling', async () => {
    // An omitted critical-failure effect uses the failure effect (Player Core,
    // Degrees of Success); basic-save damage still doubles on critical failure.
    const examples = [
        ['rank-1/tempest-surge.json', 'clumsy', 2, '1d12', 'electricity',
            {mode: 'fixed', value: 1, unit: 'rounds', anchor: 'effect-start', expiry: 'turn-start'}],
        ['rank-1/updraft.json', 'prone', null, '2d6', 'bludgeoning', null]
    ];
    for (const [path, slug, value, formula, type, duration] of examples) {
        const plan = compileAbility(await spell(path));
        assert.equal(isExecutableDegreeSavePlan(plan), true, path);
        assert.ok(plan.compilerEvidence.basicConditionRider, path);
        assert.equal(plan.resolution.sharedDamage.components[0].formula, formula, path);
        assert.equal(plan.resolution.sharedDamage.components[0].type, type, path);
        checkDegrees(plan, slug, value, duration);
    }
});

test('renamed detached spell uses changed condition value, duration, and heightening', async () => {
    const original = await spell('rank-1/tempest-surge.json');
    const description = original.system.description.value
        .replace('{Clumsy 2}', '{Clumsy 3}')
        .replace('for 1 round', 'for 2 rounds');
    const custom = independentCopy(original, 'Sirocco Pulse', description);
    custom.system.level = {...original.system.level, value: 5};
    const plan = compileAbility(custom);

    assert.equal(custom._stats.compendiumSource, undefined);
    assert.equal(isExecutableDegreeSavePlan(plan), true);
    assert.equal(plan.source.name, 'Sirocco Pulse');
    assert.equal(plan.rank, 5);
    assert.equal(plan.resolution.sharedDamage.components[0].formula, '1d12');
    assert.equal(plan.resolution.sharedDamage.heightening.damage['0'], '1d12');
    assert.equal(plan.resolution.sharedDamage.heightening.interval, 1);
    assert.deepEqual(plan.resolution.sharedDamage.heightening, compileAbility(original).resolution.sharedDamage.heightening);
    checkDegrees(plan, 'clumsy', 3,
        {mode: 'fixed', value: 2, unit: 'rounds', anchor: 'effect-start', expiry: 'turn-start'});
});

test('uncompiled movement and extra rider clauses keep the whole save guided', async () => {
    const original = await spell('rank-1/tempest-surge.json');
    const edits = [
        value => value.replace('for 1 round.', 'for 1 round and is pushed 5 feet.'),
        value => value.replace('for 1 round.', 'for 1 round. The target is also pushed 5 feet.'),
        value => value.replace('You surround a foe in a swirling storm of violent winds, roiling clouds, and crackling lightning.',
            'You push the target 5 feet before the storm strikes.'),
    ];
    for (const [index, edit] of edits.entries()) {
        const custom = independentCopy(original, `Sirocco Pulse ${index}`, edit(original.system.description.value));
        const plan = compileAbility(custom);
        assert.equal(plan.compilerEvidence.basicConditionRider, undefined, `edit ${index}`);
        assert.equal(isExecutableDegreeSavePlan(plan), false, `edit ${index}`);
    }
    // A second exact rider is a known rule: the general grammar composes both.
    const twoRiders = compileAbility(independentCopy(original, 'Sirocco Pulse two riders', original.system.description.value
        .replace('for 1 round.', 'for 1 round. On a failure, the target is also @UUID[Compendium.pf2e.conditionitems.Item.j91X7x0XSomq8d60]{Prone}.')));
    assert.equal(isExecutableDegreeSavePlan(twoRiders), true);
    for (const degree of ['failure', 'criticalFailure']) {
        assert.deepEqual(twoRiders.resolution.outcomes[degree].effects.map(effect => effect.slug).sort(), ['clumsy', 'prone'], degree);
    }
});
