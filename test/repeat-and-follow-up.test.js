import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {compileSecondarySave} from '../src/compiler/secondary-save-compiler.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
const supported = plan => inspectSavePlan(plan).supported;

test('repeated blasts: Scorching Blast and Aqueous Blast', async () => {
    const scorching = compileAbility(await fixture('rank-1/scorching-blast.json'));
    assert.equal(supported(scorching), true, JSON.stringify(inspectSavePlan(scorching).blockers));
    assert.deepEqual([scorching.resolution.repeatable.window, scorching.resolution.repeatable.range], ['turn', 30]);
    assert.equal(scorching.resolution.outcomes.criticalSuccess.damage.mode, 'mixed');
    const aqueous = compileAbility(await fixture('rank-1/aqueous-blast.json'));
    assert.equal(supported(aqueous), true, JSON.stringify(inspectSavePlan(aqueous).blockers));
    assert.equal(aqueous.resolution.outcomes.criticalSuccess.effects[0].slug, 'prone');
    // Without the repeat window, "until the end of your turn" is still a lifetime the save route can't manage.
    const plan = compileAbility(await fixture('rank-1/aqueous-blast.json'));
    delete plan.resolution.repeatable;
    assert.equal(supported(plan), false);
    // The window sentence without its attack sentence is refused.
    const source = await fixture('rank-1/aqueous-blast.json');
    source.system.description.value = source.system.description.value.replace('When you do so, attempt a ranged spell attack roll. ', '');
    assert.equal(supported(compileAbility(source)), false);
});

test("an attack's critical follow-up save: Exploding Earth", async () => {
    const plan = compileAbility(await fixture('rank-2/exploding-earth.json'));
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    const [followUp] = plan.resolution.outcomes.criticalSuccess.followUps;
    assert.equal(followUp.check.statistic, 'fortitude');
    assert.equal(followUp.outcomes.failure.effects[0].slug, 'prone');
    assert.equal(followUp.outcomes.success.effects.length, 0);
    assert.deepEqual(plan.resolution.splash.radius, 5);
});

test('follow-up branches keep linked conditions whole', () => {
    const section = {html: '', text: 'The target must succeed at a Fortitude saving throw or fall @UUID[Compendium.pf2e.conditionitems.Item.j91X7x0XSomq8d60]{Prone}.'};
    const followUp = compileSecondarySave(section);
    assert.equal(followUp.outcomes.failure.rawText, 'fall @UUID[Compendium.pf2e.conditionitems.Item.j91X7x0XSomq8d60]{Prone}.');
    assert.equal(followUp.outcomes.failure.effects[0].slug, 'prone');
});
