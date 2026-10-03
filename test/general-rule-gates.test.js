import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {compileAbility} from '../src/compiler/index.js';
import {isExecutableSavePlan} from '../scripts/basic-save-core.js';

const fixture = async () => JSON.parse(await readFile(new URL('../.cache/pf2e-test-fixtures/spells/spells/cantrip/timber.json', import.meta.url)));
const voidWarpFixture = async () => JSON.parse(await readFile(new URL('../.cache/pf2e-test-fixtures/spells/spells/cantrip/void-warp.json', import.meta.url)));

test('basic-save condition riders reject independent Speed rules at either failure degree', async () => {
    for (const [phrase, degrees] of [
        ['On a critical failure', ['criticalFailure']],
        ['On a failure', ['failure', 'criticalFailure']]
    ]) {
        const original = await voidWarpFixture();
        original.name = 'Custom void pulse';
        original.system.slug = 'custom-void-pulse';
        delete original._stats.compendiumSource;
        original.system.description.value = original.system.description.value.replace('On a critical failure', phrase);
        const baseline = compileAbility(original);
        assert.equal(isExecutableSavePlan(baseline), true, phrase);
        for (const degree of ['failure', 'criticalFailure']) {
            assert.equal(baseline.resolution.outcomes[degree].effects.length, degrees.includes(degree) ? 1 : 0);
        }

        for (const clause of [
            "The target's Speed is halved.",
            'The target has a +10-foot status bonus to its Speed.'
        ]) {
            const source = structuredClone(original);
            source.system.description.value = source.system.description.value.replace('The target takes', `${clause} The target takes`);
            const plan = compileAbility(source);
            assert.equal(plan.compilerEvidence.basicConditionRider, undefined, `${phrase}: ${clause}`);
            assert.equal(isExecutableSavePlan(plan), false, `${phrase}: ${clause}`);
        }
    }
});

test('a recognized basic-save rider cannot clear independent targeting, lifecycle or native Effect gaps', async () => {
    for (const mutate of [
        source => { source.system.target.value = 'one creature that has betrayed you'; },
        source => { source.system.duration.value = 'until the third bell tolls'; },
        source => { source.system.description.value += '<p>@UUID[Compendium.pf2e.spell-effects.Item.UnknownEffect]{Unaccounted Effect}</p>'; },
        source => { source.system.rules = [{key:'FlatModifier', selector:'ac', value:1, type:'status'}]; }
    ]) {
        const source = await fixture();
        mutate(source);
        assert.equal(isExecutableSavePlan(compileAbility(source)), false);
    }
});

test('linked-condition source compilation accepts custom identities but retains other mechanical gaps', async () => {
    for (const name of ['rank-1/scramble-body', 'rank-4/divine-wrath']) {
        const source = JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${name}.json`, import.meta.url)));
        source.name = 'Custom condition linkage'; source._id = 'newIdentity'; source.system.slug = 'new-identity';
        delete source._stats.compendiumSource;
        source.system.description.value = source.system.description.value.replace('Sickened 2', 'Sickened 3').replace('Slowed 1', 'Slowed 2');
        const plan = compileAbility(source);
        assert.equal(isExecutableSavePlan(plan), true, name);
        assert.equal(plan.resolution.outcomes.criticalFailure.effects.find(effect => effect.slug === 'slowed').value, 2);
        source.system.description.value = source.system.description.value.replace('<strong>Critical Failure</strong>',
            '<strong>Critical Failure</strong> At the end of each turn, the target takes 3 damage.');
        assert.equal(isExecutableSavePlan(compileAbility(source)), false, `${name}: unknown recurring damage`);
    }
});
