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

test('additional official critical-failure phrasings compile as complete save plans', async () => {
    const cases = [
        ['cantrip/void-warp.json', 'enfeebled', 1, {value: 1, unit: 'rounds', anchor: 'source-turn', expiry: 'turn-start'}],
        ['rank-6/entreat-the-many.json', 'prone', null, null]
    ];
    for (const [path, slug, value, duration] of cases) {
        const plan = compileAbility(await spell(path));
        assert.equal(isExecutableDegreeSavePlan(plan), true, path);
        assert.ok(plan.compilerEvidence.basicConditionRider, path);
        const effect = plan.resolution.outcomes.criticalFailure.effects[0];
        assert.equal(effect.slug, slug, path);
        assert.equal(effect.value, value, path);
        if (duration) {
            for (const [key, expected] of Object.entries(duration)) assert.equal(effect.duration[key], expected, `${path}: ${key}`);
        } else assert.equal(effect.duration, null, path);
    }
});

test('renamed custom spell compiles changed condition value and duration', async () => {
    const original = await spell('cantrip/void-warp.json');
    const description = original.system.description.value
        .replace('{Enfeebled 1}', '{Enfeebled 2}')
        .replace('until the start of your next turn', 'for 2 rounds');
    const custom = independentCopy(original, 'Mindglass Pulse', description);
    const plan = compileAbility(custom);
    const effect = plan.resolution.outcomes.criticalFailure.effects[0];

    assert.equal(custom._stats.compendiumSource, undefined);
    assert.equal(isExecutableDegreeSavePlan(plan), true);
    assert.equal(plan.source.name, 'Mindglass Pulse');
    assert.equal(effect.slug, 'enfeebled');
    assert.equal(effect.value, 2);
    assert.equal(effect.duration.value, 2);
    assert.equal(effect.duration.unit, 'rounds');
});

test('figurative mind introduction is interpreted generically without the old exact Daze sentence', async () => {
    const original = await spell('cantrip/daze.json');
    const description = original.system.description.value.replace(
        "You push into the target's mind and daze it with a mental jolt.",
        "You push into the creature's mind and unsettle it with a psychic whisper."
    );
    const plan = compileAbility(independentCopy(original, 'Whispering Pulse', description));

    assert.equal(isExecutableDegreeSavePlan(plan), true);
    assert.equal(plan.resolution.outcomes.criticalFailure.effects[0].slug, 'stunned');
});

test('other rules remain explicit gaps instead of being discarded with a rider', async () => {
    // (Haunting Hymn's "that only creatures in the area can hear" is read as narration since cantrip/rank-1 batch 1.)
    const examples = [
        'cantrip/frostbite.json'
    ];
    for (const path of examples) {
        const plan = compileAbility(await spell(path));
        assert.equal(isExecutableDegreeSavePlan(plan), false, path);
        assert.ok(plan.automation.pendingCapabilities.length > 0, path);
    }
    // Torturous Trauma's organ rule is no longer discarded: it compiles to a
    // GM-confirmed eligibility question that must be answered per target.
    const trauma = compileAbility(await spell('cantrip/torturous-trauma.json'));
    assert.ok(trauma.targeting.actorConstraints.predicates.some(predicate => predicate.kind === 'gm-confirmed'
        && /internal organs/.test(predicate.question)));

    const original = await spell('cantrip/void-warp.json');
    const addedRule = independentCopy(original, 'Mindglass Pulse', original.system.description.value
        .replace('</p>', ' The target is also pushed 5 feet away.</p>'));
    const plan = compileAbility(addedRule);
    assert.equal(isExecutableDegreeSavePlan(plan), false);
    assert.equal(plan.compilerEvidence.basicConditionRider, undefined);

    const expandedRider = independentCopy(original, 'Mindglass Pulse', original.system.description.value.replace(
        '{Enfeebled 1} until the start of your next turn.',
        '{Enfeebled 1} until the start of your next turn and is pushed 5 feet.'
    ));
    const expandedPlan = compileAbility(expandedRider);
    assert.equal(expandedPlan.compilerEvidence.basicConditionRider, undefined);
    assert.equal(isExecutableDegreeSavePlan(expandedPlan), false);

    for (const introduction of [
        'Victims become slowed 1.',
        'You push the target 5 feet away before the damage.'
    ]) {
        const changed = independentCopy(original, 'Mindglass Pulse', original.system.description.value.replace(
            'You call upon the Void to harm life force.', introduction
        ));
        const result = compileAbility(changed);
        assert.equal(result.compilerEvidence.basicConditionRider, undefined, introduction);
        assert.equal(isExecutableDegreeSavePlan(result), false, introduction);
    }
});
