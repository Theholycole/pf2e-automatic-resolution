import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {compileSaveImmunity} from '../src/compiler/save-preamble.js';

const spell = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}.json`, import.meta.url), 'utf8'));
const read = (text, statistic = 'will', name = 'Shadow Projectile') => compileSaveImmunity(`<p>${text}</p>`, statistic, name);

test('temporary immunity: the common wordings after a save', () => {
    assert.deepEqual(read('The target takes 3d8 mental damage, depending on its Will save. Regardless of the result of its save, it\'s temporarily immune to shadow projectile for 1 hour.').duration, {value: 1, unit: 'hours'});
    assert.deepEqual(read('The target must attempt a Will save. After attempting its save, the target becomes temporarily immune for 24 hours.').duration, {value: 24, unit: 'hours'});
    assert.deepEqual(read('The target must attempt a Will save and is then temporarily immune for 24 hours.').duration, {value: 24, unit: 'hours'});
    assert.deepEqual(read('After the effects are resolved, the target is temporarily immune for 1 day.').duration, {value: 1, unit: 'days'});
    assert.deepEqual(read('Regardless of the outcome, the target is then temporarily immune for 1 minute.').duration, {value: 1, unit: 'minutes'});
    assert.deepEqual(read('Regardless of the effects of the saving throw, the creature is then temporarily immune to pack breaker for 1 hour.', 'will', 'Pack Breaker').duration, {value: 1, unit: 'hours'});
});

test('temporary immunity: refused when the scope or the antecedent is wrong', () => {
    // Immune to another spell, or a family of spells.
    assert.equal(read('Regardless of the result, the target is temporarily immune to all curses of death for 1 day.', 'fortitude', 'Curse of Death'), null);
    // "it" must follow the target's own save with the item's statistic.
    assert.equal(read('An ally attempts a Will save. Regardless of the result of its save, it\'s temporarily immune for 1 hour.'), null);
    assert.equal(read('The target takes 3d8 mental damage, depending on its Reflex save. Regardless of the result of its save, it\'s temporarily immune for 1 hour.'), null);
    // Units PF2e Effects can't hold.
    assert.equal(read('The target is then temporarily immune for 1 week.'), null);
});

// (Rank 3 batch 7: in a reaction, the condition lasts until the next attack roll against the creature or the end of the current turn.)
test('a condition limited to the triggering attack lasts until that attack', async () => {
    const plan = compileAbility(await spell('rank-3/shadow-projectile'));
    assert.equal(plan.resolution.temporaryImmunity.duration.unit, 'hours');
    assert.ok(!plan.automation.pendingCapabilities.includes('condition-scope:triggering-attack'));
    for (const degree of ['success', 'failure', 'criticalFailure'])
        assert.deepEqual(plan.resolution.outcomes[degree].effects.find(effect => effect.slug === 'off-guard').endsWhen, [{event: 'next-attack'}], degree);
});
