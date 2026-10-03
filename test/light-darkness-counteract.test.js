import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {extractLightDarknessCounteract} from '../src/compiler/light-darkness-counteract.js';
import {extractConditionalClause} from '../src/compiler/conditional-damage.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {reminderHTML} from '../scripts/strike-prelude-runtime.js';

const spell = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}.json`, import.meta.url), 'utf8'));
const supported = plan => inspectSavePlan(plan).supported;

test('light and darkness counteract sentences become one card reminder', () => {
    const along = extractLightDarknessCounteract('<p>Rule.</p><p>If the light passes through an area of magical darkness or targets a creature affected by magical darkness, <em>radiant beam</em> attempts to counteract the darkness. If you need to determine whether the light passes through an area of darkness, draw a line between yourself and the target.</p>');
    assert.equal(along.html, '<p>Rule.</p>');
    assert.deepEqual(along.reminders.map(r => [r.kind, r.target]), [['counteract-along-path', 'darkness']]);
    const overlap = extractLightDarknessCounteract('<p>If the globe overlaps with an area of magical light or affects a creature affected by magical light, <em>eclipse burst</em> attempts to counteract the light effect.</p>');
    assert.deepEqual(overlap.reminders.map(r => [r.kind, r.target]), [['counteract-overlap', 'light']]);
    assert.equal(extractLightDarknessCounteract('<p>No counteract here.</p>'), null);
    // Light and darkness mismatched ("magical darkness … counteract the light") isn't read.
    assert.equal(extractLightDarknessCounteract('<p>If the globe overlaps with an area of magical darkness, x attempts to counteract the light effect.</p>'), null);
    assert.match(reminderHTML(overlap.reminders[0], String), /Counteract to roll the caster's counteract check/);
});

test('extra damage for a creature trait written as a clause of the damage sentence', () => {
    const found = extractConditionalClause('<p>Dealing 8d10 cold damage to all creatures in the area, plus an additional @Damage[(@item.rank+1)d10[vitality]] damage to undead creatures.</p>');
    assert.equal(found.html, '<p>Dealing 8d10 cold damage to all creatures in the area.</p>');
    assert.deepEqual(found.conditional.conditionalDamage.map(c => [c.formula, c.trait]), [['(@item.rank+1)d10[vitality]', 'undead']]);
    // "living" isn't a trait.
    assert.equal(extractConditionalClause('<p>Dealing 8d10 cold damage, plus an additional @Damage[8d4[void]] damage to living creatures.</p>'), null);
});

test('save spells with a light or darkness counteract (Radiant Beam, Moonburst, Sunburst)', async () => {
    const beam = compileAbility(await spell('rank-4/radiant-beam'));
    assert.equal(supported(beam), true, JSON.stringify(inspectSavePlan(beam).blockers));
    assert.deepEqual(beam.resolution.reminders.map(r => [r.kind, r.target]), [['counteract-along-path', 'darkness']]);
    assert.deepEqual(beam.resolution.outcomes.criticalFailure.effects.map(e => [e.slug, e.duration.value]), [['dazzled', 4]]);
    for (const name of ['moonburst', 'sunburst']) {
        const plan = compileAbility(await spell(`rank-7/${name}`));
        assert.equal(supported(plan), true, `${name}: ${JSON.stringify(inspectSavePlan(plan).blockers)}`);
        assert.deepEqual(plan.resolution.reminders.map(r => [r.kind, r.target]), [['counteract-overlap', 'darkness']]);
        assert.deepEqual(plan.resolution.conditionalDamage.map(c => [c.trait, c.damageType]), [['undead', 'vitality']]);
        assert.equal(plan.resolution.outcomes.criticalFailure.effects[0].slug, 'blinded');
    }
    // An unknown reminder kind is still refused.
    const beamPlan = compileAbility(await spell('rank-4/radiant-beam'));
    beamPlan.resolution.reminders[0].kind = 'counteract-anywhere';
    assert.equal(supported(beamPlan), false);
    // Chilling Darkness keeps its reminder through the shared extractor.
    const darkness = compileAbility(await spell('rank-3/chilling-darkness'));
    assert.equal(supported(darkness), true);
    assert.deepEqual(darkness.resolution.reminders.map(r => [r.kind, r.target]), [['counteract-along-path', 'light']]);
});
