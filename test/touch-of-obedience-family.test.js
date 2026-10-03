import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {extractScopedConditionReferences} from '../src/compiler/description-parser.js';
import {compileSaveImmunity} from '../src/compiler/save-preamble.js';
import {isExecutableSavePlan} from '../scripts/basic-save-core.js';

const sourceURL = new URL('../.cache/pf2e-test-fixtures/spells/spells/rank-1/touch-of-obedience.json', import.meta.url);
const source = async () => JSON.parse(await readFile(sourceURL, 'utf8'));

function detached(original, description, name = 'Commanding Touch') {
    const item = structuredClone(original);
    item._id = 'custom-commanding-touch';
    delete item._stats.compendiumSource;
    item.name = name;
    item.system.slug = name.toLowerCase().replaceAll(' ', '-');
    item.system.description.value = description;
    return item;
}

test('Touch of Obedience compiles save-wide immunity and independent timed and action-ended conditions', async () => {
    const plan = compileAbility(await source());
    assert.equal(isExecutableSavePlan(plan), true);
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, {value: 1, unit: 'hours'});
    assert.equal(plan.lifecycle.durationSpec.mode, 'outcome');
    assert.deepEqual(plan.resolution.outcomes.criticalSuccess.effects, []);
    for (const degree of ['success', 'failure']) {
        const effects = plan.resolution.outcomes[degree].effects;
        assert.equal(effects.length, 1, degree);
        assert.equal(effects[0].slug, 'stupefied', degree);
        assert.equal(effects[0].duration.mode, 'fixed', degree);
        assert.equal(effects[0].duration.unit, 'rounds', degree);
        assert.equal(effects[0].duration.expiry, 'turn-end', degree);
        assert.equal(effects[0].duration.anchor, 'source-turn', degree);
        assert.equal(effects[0].duration.offset, 1, degree);
    }
    assert.equal(plan.resolution.outcomes.success.effects[0].value, 1);
    assert.equal(plan.resolution.outcomes.failure.effects[0].value, 2);
    const [stupefied, prone] = plan.resolution.outcomes.criticalFailure.effects;
    assert.equal(stupefied.slug, 'stupefied');
    assert.equal(stupefied.value, 2);
    assert.equal(stupefied.duration.mode, 'fixed');
    assert.equal(stupefied.duration.value, 1);
    assert.equal(stupefied.duration.unit, 'minutes');
    assert.equal(prone.slug, 'prone');
    assert.equal(prone.value, null);
    assert.deepEqual(prone.duration, {mode: 'unlimited', value: null, unit: null});
});

test('renamed source keeps the mechanics and changed immunity duration', async () => {
    const original = await source();
    const item = detached(original, original.system.description.value
        .replace('temporarily immune for 1 hour.', 'temporarily immune for 2 hours.'));
    const plan = compileAbility(item);
    assert.equal(isExecutableSavePlan(plan), true);
    assert.equal(plan.source.name, 'Commanding Touch');
    assert.equal(plan.resolution.temporaryImmunity.key, 'commanding-touch');
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, {value: 2, unit: 'hours'});
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ['stupefied', 'prone']);
});

test('pronoun immunity requires an adjacent explicit target save matching the item statistic', async () => {
    const original = await source();
    const text = original.system.description.value;
    for (const replacement of [
        'An ally attempts a Will save.',
        'The target attempts a Reflex save.',
        'The target attempts a Will save. An ally watches.'
    ]) {
        const item = detached(original, text.replace('The target attempts a Will save.', replacement));
        const plan = compileAbility(item);
        assert.equal(plan.resolution.temporaryImmunity, undefined, replacement);
        assert.equal(isExecutableSavePlan(plan), false, replacement);
        assert.ok(plan.automation.pendingCapabilities.includes('preamble:temporary-immunity'), replacement);
    }
    assert.equal(compileSaveImmunity(text, 'reflex'), null);
});

test('rules after a recognized preamble immunity cannot be swallowed as narration', async () => {
    const original = await source();
    const text = original.system.description.value;
    for (const sentence of [
        'The target gains 1 action.',
        'The target is pushed 5 feet.',
        'The target takes 1d4 fire damage.'
    ]) {
        for (const [description, expectedGap] of [
            [text.replace('temporarily immune for 1 hour.', `temporarily immune for 1 hour. ${sentence}`), 'preamble:post-immunity-text'],
            [text.replace('The target attempts a Will save.', `${sentence} The target attempts a Will save.`), null]
        ]) {
            const plan = compileAbility(detached(original, description));
            assert.equal(isExecutableSavePlan(plan), false, sentence);
            if (expectedGap) assert.ok(plan.automation.pendingCapabilities.includes(expectedGap), sentence);
            else assert.ok(plan.automation.pendingCapabilities.some(capability => capability.startsWith('preamble:')), sentence);
        }
    }
});

test('unlinked prone extraction requires the affirmative predicate and leaves unrelated text unclaimed', async () => {
    const original = await source();
    const text = original.system.description.value;
    for (const replacement of [
        "and isn't forced to its knees, becoming prone.",
        'and might be forced to its knees, becoming prone.',
        'and is forced to its knees, becoming prone and loses 1 action.',
        'and is forced to its knees.'
    ]) {
        const item = detached(original, text.replace('and is forced to its knees, becoming prone.', replacement));
        const plan = compileAbility(item);
        assert.equal(isExecutableSavePlan(plan), false, replacement);
        assert.equal(plan.resolution.outcomes.criticalFailure.effects.some(effect => effect.slug === 'prone'), false, replacement);
    }
    assert.equal(extractScopedConditionReferences('The target might be forced to its knees, becoming prone.').length, 0);
});

test('unlinked falls and knocked prone compile on the degree that states them', async () => {
    for (const [path, expected] of [
        ['rank-3/gravity-wave.json', ['prone']],
        ['rank-5/blazing-fissure.json', ['prone']],
        ['rank-5/stormburst.json', ['prone', 'stunned']]
    ]) {
        const item = JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
        const plan = compileAbility(item);
        assert.equal(isExecutableSavePlan(plan), true, path);
        assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug).sort(), expected.sort(), path);
        assert.equal(plan.resolution.outcomes.criticalFailure.effects.find(effect => effect.slug === 'prone').duration.mode, 'unlimited', path);
    }
});

test('extra condition grants remain uncompiled; a Stand restriction is a note Effect (user decision)', async () => {
    const original = await source();
    const text = original.system.description.value;
    for (const extra of ['and is deafened, ']) {
        const item = detached(original, text.replace('and is forced to its knees, becoming prone.',
            `${extra}and is forced to its knees, becoming prone.`));
        const plan = compileAbility(item);
        assert.equal(isExecutableSavePlan(plan), false, extra);
    }
});

test('preamble damage claims match structured components one to one, including bleed', async () => {
    const path = new URL('../.cache/pf2e-test-fixtures/spells/spells/rank-5/weight-of-the-world.json', import.meta.url);
    const original = JSON.parse(await readFile(path, 'utf8'));
    assert.equal(isExecutableSavePlan(compileAbility(original)), true);
    const repeated = structuredClone(original);
    repeated.system.description.value = repeated.system.description.value.replace(
        'with a Fortitude save.', 'with a Fortitude save. The creature takes 2d12 bludgeoning damage.');
    const plan = compileAbility(repeated);
    assert.equal(isExecutableSavePlan(plan), false);
    assert.ok(plan.automation.pendingCapabilities.includes('preamble:damage'));
});

test('a Stand restriction beside the condition becomes a note Effect', async () => {
    const original = await source();
    const item = detached(original, original.system.description.value.replace('and is forced to its knees, becoming prone.', 'and cannot Stand, and is forced to its knees, becoming prone.'));
    const plan = compileAbility(item);
    assert.ok(Object.values(plan.resolution.outcomes).some(outcome => (outcome.noteEffects ?? []).some(note => /cannot Stand/.test(note.text))));
});
