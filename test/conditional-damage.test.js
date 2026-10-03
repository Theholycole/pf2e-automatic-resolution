import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {compileConditionalDamage} from '../src/compiler/conditional-damage.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
function detached(original, description) {
    const item = structuredClone(original);
    item._id = 'custom-conditional1';
    if (item._stats) delete item._stats.compendiumSource;
    item.name = 'Custom Conditional Spell';
    item.system.slug = 'custom-conditional-spell';
    item.system.description.value = description;
    return item;
}

test('extra damage by trait: Holy Cascade (basic save)', async () => {
    const plan = compileAbility(await fixture('rank-4/holy-cascade.json'));
    assert.deepEqual(plan.resolution.conditionalDamage.map(e => [e.formula, e.trait]), [['((@item.level*2)-2)d6[spirit]', 'unholy']]);
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(plan.resolution.check.basic, true);
});

test('extra damage by trait in a spell attack', async () => {
    const base = await fixture('rank-1/admonishing-ray.json');
    const html = '<p>A pale ray lances out. Make a spell attack roll. The ray deals 2d6 bludgeoning damage. The ray deals an additional @Damage[(@item.rank)d6[vitality]] damage to creatures with the undead trait.</p><p><strong>Critical Success</strong> The target takes double damage.</p><p><strong>Success</strong> The target takes full damage.</p>';
    const plan = compileAbility(detached(base, html));
    assert.equal(plan.resolution.check.statistic, 'spell-attack');
    assert.deepEqual(plan.resolution.conditionalDamage.map(e => [e.formula, e.trait]), [['(@item.rank)d6[vitality]', 'undead']]);
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
});

test('only an inline, rank-only, non-persistent roll is accepted', () => {
    const ok = '<p>The water deals an additional @Damage[(@item.rank)d6[spirit]] damage to creatures with the unholy trait in the area.</p>';
    assert.ok(compileConditionalDamage(ok));
    assert.equal(compileConditionalDamage(ok.replace('@item.rank', '@actor.level')), null, 'reads the actor');
    assert.equal(compileConditionalDamage(ok.replace('[spirit]', '[persistent,spirit]')), null, 'persistent');
    assert.equal(compileConditionalDamage('<p>If the target has the holy trait, you deal an extra 5d6 spirit damage.</p>'), null, 'static dice heighten only in prose');
    assert.equal(compileConditionalDamage(ok + ok), null, 'two such sentences');
});

test('rays with fixed extra dice and counteract along the path (Chilling Darkness, Holy Light)', async () => {
    for (const [path, trait, target] of [['rank-3/chilling-darkness.json', 'holy', 'light'], ['rank-3/holy-light.json', 'unholy', 'darkness']]) {
        const plan = compileAbility(await fixture(path));
        assert.equal(inspectSavePlan(plan).supported, true, `${path}: ${JSON.stringify(inspectSavePlan(plan).blockers)}`);
        // 5d6 at rank 3, +2d6 per rank from the Heightened entry.
        assert.deepEqual(plan.resolution.conditionalDamage.map(e => [e.formula, e.trait]), [['(5+2*(@item.rank - 3))d6[spirit]', trait]]);
        assert.deepEqual(plan.resolution.reminders.map(r => [r.kind, r.target]), [['counteract-along-path', target]]);
    }
    // Moonlight Ray (silver damage; its semicolon form) is supported since rank 3 batch 25: the extra spirit damage on unholy targets, and its
    // critical row's "as well as double spirit damage if a fiend or undead" read as doubling that extra damage (an interpretation logged for the
    // user). (Sun Blade — weapon requirement, sunlight dice — is supported since rank 2 batch 28.)
    const moonlight = compileAbility(await fixture('rank-3/moonlight-ray.json'));
    assert.equal(inspectSavePlan(moonlight).supported, true);
    assert.deepEqual(moonlight.resolution.conditionalDamage.map(e => [e.formula, e.trait]), [['(5+2*(@item.rank - 3))d6[spirit]', 'unholy']]);
    assert.equal(inspectSavePlan(compileAbility(await fixture('rank-2/sun-blade.json'))).supported, true);
    const base = await fixture('rank-3/chilling-darkness.json');
    const html = base.system.description.value;
    // A reworded counteract paragraph isn't a known reminder: blocked.
    const reworded = compileAbility(detached(base, html.replace('attempts to counteract the light', 'dispels the light')));
    assert.equal(inspectSavePlan(reworded).supported, false);
    // Extra dice the Heightened entry mentions in another form: refused.
    const odd = compileAbility(detached(base, html.replace('the spirit damage against holy creatures increases by 2d6', 'the spirit damage doubles')));
    assert.equal(odd.resolution.conditionalDamage, undefined);
    // Unknown reminders are refused by the core.
    const plan = compileAbility(base);
    const tampered = structuredClone(plan); tampered.resolution.reminders = [{kind: 'anything', text: 'x'}];
    assert.equal(inspectSavePlan(tampered).supported, false);
});
