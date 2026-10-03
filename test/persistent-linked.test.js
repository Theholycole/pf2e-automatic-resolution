import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, isPersistentLinkedLifetime} from '../scripts/basic-save-core.js';
import {inspectCompiledNativeOutcomeEffect} from '../scripts/native-outcome-effects.js';
import {inspectLinkedEffectClaim} from '../scripts/effect-modifier-proof.js';
import {persistentLinkType, hasPersistentDamage} from '../scripts/persistent-link-runtime.js';

const root = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const catalogOf = effect => {
    const profile = {id: effect._id, name: effect.name, type: effect.type, sourceFile: 'spell-effects', automation: {
        ruleKeys: [...new Set(effect.system.rules.map(rule => rule.key))], requiresConfiguration: false, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules, duration: effect.system.duration, start: effect.system.start}};
    return new Map([[profile.name, profile], [profile.id, profile]]);
};

test('persistent-linked condition: Sticky Fire and Widow\'s Bite', async () => {
    for (const [path, type] of [['rank-2/sticky-fire.json', 'fire'], ['rank-3/widows-bite.json', 'poison']]) {
        const plan = compileAbility(await read(`spells/spells/${path}`));
        assert.equal(inspectSavePlan(plan).supported, true, `${path}: ${JSON.stringify(inspectSavePlan(plan).blockers)}`);
        for (const degree of ['criticalSuccess', 'success']) {
            const [condition] = plan.resolution.outcomes[degree].effects;
            assert.equal(condition.slug, 'enfeebled');
            assert.equal(condition.value, 1);
            assert.deepEqual(condition.endsWhen, {event: 'persistent-damage-ended', damageType: type});
            assert.equal(isPersistentLinkedLifetime(condition), true);
        }
        assert.equal(plan.resolution.outcomes.failure.effects.length, 0);
        assert.equal(plan.resolution.outcomes.criticalSuccess.damage.multiplier, 2);
    }
});

test('persistent-linked condition: a type the spell has no persistent entry for is refused', async () => {
    const source = await read('spells/spells/rank-2/sticky-fire.json');
    source.system.description.value = source.system.description.value.replace('persistent fire damage.</p>', 'persistent acid damage.</p>');
    assert.equal(inspectSavePlan(compileAbility(source)).supported, false);
    // The linked sentence with a different attack form is not dropped silently.
    const other = await read('spells/spells/rank-2/sticky-fire.json');
    other.system.description.value = other.system.description.value.replace('dealing 1d8 fire damage and 1d8 persistent fire damage on a hit.',
        'dealing 1d8 fire damage and 1d8 persistent fire damage on a hit and pushing it 5 feet.');
    assert.equal(inspectSavePlan(compileAbility(other)).supported, false);
});

test('persistent-linked Effect: Charged Javelin', async () => {
    const effect = await read('spell-effects/spell-effect-charged-javelin.json');
    const plan = compileAbility(await read('spells/spells/rank-1/charged-javelin.json'), {nativeEffectCatalog: catalogOf(effect)});
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    for (const degree of ['criticalSuccess', 'success']) {
        const [applied] = plan.resolution.outcomes[degree].nativeEffects;
        assert.equal(applied.outcomeRule.kind, 'persistent-linked-effect');
        assert.equal(applied.outcomeRule.damageType, 'electricity');
        assert.equal(inspectCompiledNativeOutcomeEffect(applied, {degree}).supported, true);
        // The same proof on a miss row is refused.
        assert.equal(inspectCompiledNativeOutcomeEffect({...applied, outcomeRule: {...applied.outcomeRule, degree: 'failure'}}, {degree: 'failure'}).supported, false);
    }
    // Claims are read against the Effect's rules.
    const claim = plan.resolution.outcomes.success.nativeEffects[0].outcomeRule.claimText;
    const mechanics = {rules: effect.system.rules, duration: effect.system.duration};
    assert.equal(inspectLinkedEffectClaim({mechanics}, claim).supported, true);
    assert.equal(inspectLinkedEffectClaim({mechanics}, claim.replace('–1 status penalty', '–2 status penalty')).supported, false);
    assert.equal(inspectLinkedEffectClaim({mechanics: {...mechanics, duration: {unit: 'rounds', value: 1}}}, claim).supported, false);
    // Without the Effect in the catalog, the plan is blocked.
    assert.equal(inspectSavePlan(compileAbility(await read('spells/spells/rank-1/charged-javelin.json'))).supported, false);
});

test('persistent link runtime helpers', () => {
    const effect = {flags: {'pf2e-automatic-resolution': {outcomeEffect: {persistentLink: {damageType: 'fire'}}}}};
    const native = {flags: {'pf2e-automatic-resolution': {runtime: {persistentLink: {damageType: 'electricity'}}}}};
    assert.equal(persistentLinkType(effect), 'fire');
    assert.equal(persistentLinkType(native), 'electricity');
    assert.equal(persistentLinkType({flags: {}}), null);
    const actor = {itemTypes: {condition: [{slug: 'persistent-damage', system: {persistent: {damageType: 'fire'}}}]}};
    assert.equal(hasPersistentDamage(actor, 'fire'), true);
    assert.equal(hasPersistentDamage(actor, 'poison'), false);
});
