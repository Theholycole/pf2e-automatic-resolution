import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {compileAbility} from '../src/compiler/index.js';
import {extractScopedConditionReferences} from '../src/compiler/description-parser.js';
import {isExecutableDegreeSavePlan} from '../scripts/basic-save-core.js';

const contentRoot = process.env.PF2E_CONTENT_ROOT
    ?? fileURLToPath(new URL('../.cache/pf2e-test-fixtures', import.meta.url));

async function spell(path) {
    return JSON.parse(await readFile(`${contentRoot}/spells/spells/${path}`, 'utf8'));
}

function detachedCopy(source, name) {
    const stats = {...source._stats};
    delete stats.compendiumSource;
    return {
        ...source,
        _id: `custom-${name.toLowerCase().replaceAll(' ', '-')}`,
        name,
        _stats: stats,
        system: {
            ...source.system,
            slug: name.toLowerCase().replaceAll(' ', '-'),
            damage: structuredClone(source.system.damage),
            description: {...source.system.description}
        }
    };
}

function expectDegrees(plan, type, formula, targetBoundary, sourceBoundary,
    targetTiming = {expiry: 'turn-start', offset: 0},
    sourceTiming = {expiry: 'turn-start', offset: 1}) {
    assert.equal(isExecutableDegreeSavePlan(plan), true);
    assert.equal(plan.resolution.sharedDamage.components.length, 1);
    const component = plan.resolution.sharedDamage.components[0];
    assert.equal(component.type, type);
    assert.equal(component.formula, formula);
    for (const [degree, multiplier] of Object.entries({
        criticalSuccess: 0, success: 0.5, failure: 1, criticalFailure: 2
    })) {
        const damage = plan.resolution.outcomes[degree].damage;
        assert.equal(damage.multiplier, multiplier, degree);
        assert.deepEqual(damage.sourceComponentIds, multiplier ? [component.id] : [], degree);
    }
    const failure = plan.resolution.outcomes.failure.effects;
    assert.deepEqual(failure.map(effect => [effect.slug, effect.value]), [['off-guard', null]]);
    assert.deepEqual(failure[0].duration, {
        mode: 'fixed', value: 1, unit: 'rounds',
        anchor: 'target-turn', sourceText: targetBoundary, ...targetTiming
    });
    const critical = plan.resolution.outcomes.criticalFailure.effects;
    assert.deepEqual(critical.map(effect => [effect.slug, effect.value]),
        [['stunned', 1], ['off-guard', null]]);
    assert.equal(critical[0].duration, null, 'Stunned 1 is action debt, not timed');
    assert.deepEqual(critical[1].duration, {
        mode: 'fixed', value: 1, unit: 'rounds',
        anchor: 'source-turn', sourceText: sourceBoundary, ...sourceTiming
    });
}

test('typed half damage and separate condition clauses compile all official outcomes', async () => {
    const plan = compileAbility(await spell('rank-1/unraveling-blast.json'));
    expectDegrees(plan, 'mental', '2d4',
        'until the start of its turn', 'until the start of your next turn');
    assert.deepEqual(plan.resolution.sharedDamage.heightening, {
        type: 'interval', interval: 1, damage: {'hI7EFjOWaaWklCOZ': '3d4'}
    });
});

test('detached renamed source changes typed damage and scoped turn timing', async () => {
    const original = await spell('rank-1/unraveling-blast.json');
    const custom = detachedCopy(original, 'Shattered Possibility');
    const [component] = Object.values(custom.system.damage);
    component.formula = '4d6';
    component.type = 'cold';
    custom.system.description.value = custom.system.description.value
        .replace('2d4 mental damage', '4d6 cold damage')
        .replace('half the mental damage', 'half the cold damage')
        .replace('until the start of its turn', 'until the end of its next turn')
        .replace('until the start of your next turn', 'until the end of your next turn');
    custom.system.level = {value: 5};
    const plan = compileAbility(custom);
    expectDegrees(plan, 'cold', '4d6',
        'until the end of its next turn', 'until the end of your next turn',
        {expiry: 'turn-end', offset: 1}, {expiry: 'turn-end', offset: 1});
    assert.equal(custom._stats.compendiumSource, undefined);
    assert.equal(plan.rank, 5);
    assert.equal(plan.resolution.sharedDamage.heightening.damage.hI7EFjOWaaWklCOZ, '3d4');
    assert.equal(plan.resolution.outcomes.failure.effects[0].duration.expiry, 'turn-end');
    assert.equal(plan.resolution.outcomes.failure.effects[0].duration.offset, 1);
    assert.equal(plan.resolution.outcomes.criticalFailure.effects[1].duration.expiry, 'turn-end');
});

test('typed half damage requires a single matching structured damage component and exact clause', async () => {
    const original = await spell('rank-1/unraveling-blast.json');
    const mutations = [
        source => { Object.values(source.system.damage)[0].type = 'fire'; },
        source => { source.system.damage.other = {...Object.values(source.system.damage)[0], type: 'mental'}; },
        source => { source.system.description.value = source.system.description.value
            .replace('half the mental damage.', 'half the mental damage and gains an action.'); },
        source => { source.system.description.value = source.system.description.value
            .replace('half the mental damage.', 'half the mental damage. It is pushed 5 feet.'); },
        source => { source.system.description.value = source.system.description.value
            .replace('and it must attempt a Will save.',
                'and it must attempt a Will save. The creature takes 1d4 fire damage.'); }
    ];
    for (const [index, mutate] of mutations.entries()) {
        const custom = detachedCopy(original, `Broken Future ${index}`);
        mutate(custom);
        const plan = compileAbility(custom);
        assert.equal(isExecutableDegreeSavePlan(plan), false, `mutation ${index}`);
    }
});

test('repeated condition predicate scopes timing but a simple conjunction shares it', () => {
    const separatelyScoped = extractScopedConditionReferences(
        'The creature becomes @UUID[Compendium.pf2e.conditionitems.Item.Stunned]{Stunned 1}, '
        + 'and is @UUID[Compendium.pf2e.conditionitems.Item.OffGuard]{Off-Guard} for 2 rounds.'
    );
    assert.deepEqual(separatelyScoped.map(effect => [effect.slug, effect.duration?.value ?? null]),
        [['stunned', null], ['off-guard', 2]]);

    const shared = extractScopedConditionReferences(
        'The creature is @UUID[Compendium.pf2e.conditionitems.Item.Blinded]{Blinded} '
        + 'and @UUID[Compendium.pf2e.conditionitems.Item.Deafened]{Deafened} for 1 round.'
    );
    assert.deepEqual(shared.map(effect => [effect.slug, effect.duration?.value ?? null]),
        [['blinded', 1], ['deafened', 1]]);
});

test('existing conditions keep independent expiry and native recovery semantics', async () => {
    const eagle = compileAbility(await spell('rank-3/eagles-cry.json'));
    assert.equal(isExecutableDegreeSavePlan(eagle), true);
    const eagleCritical = eagle.resolution.outcomes.criticalFailure.effects;
    assert.deepEqual(eagleCritical.map(effect => effect.slug), ['fleeing', 'frightened']);
    assert.equal(eagleCritical[0].duration.value, 1);
    assert.equal(eagleCritical[0].duration.unit, 'rounds');
    assert.equal(eagleCritical[0].expirationMode, 'duration');
    assert.equal(eagleCritical[1].value, 2);
    assert.equal(eagleCritical[1].duration, null, 'Frightened decays by its normal recovery');
    assert.equal(eagleCritical[1].expirationMode, undefined);

    const vibrations = compileAbility(await spell('rank-4/painful-vibrations.json'));
    assert.equal(isExecutableDegreeSavePlan(vibrations), true);
    for (const [degree, value, unit] of [['failure', 1, 'rounds'], ['criticalFailure', 2, 'minutes']]) {
        const effects = vibrations.resolution.outcomes[degree].effects;
        assert.deepEqual(effects.map(effect => effect.slug), ['sickened', 'deafened']);
        assert.equal(effects[0].value, value);
        assert.equal(effects[0].duration, null, `${degree}: Sickened uses Retch recovery`);
        assert.equal(effects[0].expirationMode, undefined);
        assert.equal(effects[1].duration.value, 1);
        assert.equal(effects[1].duration.unit, unit);
        assert.equal(effects[1].expirationMode, 'duration');
    }
});
