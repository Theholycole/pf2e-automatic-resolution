import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
function detached(original, description) {
    const item = structuredClone(original);
    item._id = 'custom-attack00001';
    if (item._stats) delete item._stats.compendiumSource;
    item.name = 'Custom Attack Spell';
    item.system.slug = 'custom-attack-spell';
    item.system.description.value = description;
    return item;
}
const view = plan => Object.fromEntries(Object.entries(plan.resolution.outcomes).map(([degree, outcome]) =>
    [degree, [outcome.damage?.mode === 'shared' ? outcome.damage.multiplier : 0, ...outcome.effects.map(e => `${e.slug}${e.value ?? ''}`)]]));

test('spell attacks compile to a table keyed by the attack result', async () => {
    const expected = {
        'cantrip/divine-lance.json': {criticalSuccess: [2], success: [1], failure: [0], criticalFailure: [0]},
        'rank-1/admonishing-ray.json': {criticalSuccess: [2], success: [1], failure: [0], criticalFailure: [0]},
        'rank-8/polar-ray.json': {criticalSuccess: [2, 'drained2'], success: [1, 'drained2'], failure: [0], criticalFailure: [0]},
        'rank-2/murder-of-crows.json': {criticalSuccess: [2, 'blinded'], success: [1, 'dazzled'], failure: [0], criticalFailure: [0]},
        'rank-1/snowball.json': {criticalSuccess: [2], success: [1], failure: [0], criticalFailure: [0]}
    };
    for (const [path, outcomes] of Object.entries(expected)) {
        const plan = compileAbility(await fixture(path));
        assert.equal(plan.resolution.check.statistic, 'spell-attack', path);
        assert.ok(plan.compilerEvidence.spellAttack, path);
        assert.deepEqual(view(plan), outcomes, path);
        assert.equal(inspectSavePlan(plan).supported, true, `${path}: ${JSON.stringify(inspectSavePlan(plan).blockers)}`);
    }
    // Murder of Crows: Dazzled / Blinded for 1 round.
    const crows = compileAbility(await fixture('rank-2/murder-of-crows.json'));
    assert.deepEqual([crows.resolution.outcomes.success.effects[0].duration?.value, crows.resolution.outcomes.criticalSuccess.effects[0].duration?.value], [1, 1]);
});

test('attack spells with other rules stay blocked', async () => {
    // Fire Ray's burning ground is read (cantrip-rank-1-batch-9.test.js); a hazard trigger it can't read stays blocked.
    // (Sticky Fire's persistent-linked Enfeebled is supported: persistent-linked.test.js.)
    const ray = await fixture('rank-1/fire-ray.json');
    assert.equal(inspectSavePlan(compileAbility(detached(ray, ray.system.description.value.replace('ends its turn in', 'stands in')))).supported, false);
    const lance = await fixture('cantrip/divine-lance.json');
    // Dice that don't match the damage entry, or an extra rule after the attack, are refused.
    assert.equal(compileAbility(detached(lance, lance.system.description.value.replace('2d4 spirit', '3d4 spirit'))).compilerEvidence.spellAttack, undefined);
    const extra = compileAbility(detached(lance, lance.system.description.value.replace('critical hit).', 'critical hit). The target is pushed 5 feet.')));
    assert.equal(inspectSavePlan(extra).supported, false);
    // Not an attack spell: no rewrite.
    const noTrait = structuredClone(lance); noTrait.system.traits.value = noTrait.system.traits.value.filter(t => t !== 'attack');
    assert.equal(compileAbility(noTrait).compilerEvidence.spellAttack, undefined);
});

test('several targets: one attack per target, and a shared multiple attack penalty (Slashing Gust)', async () => {
    const gust = compileAbility(await fixture('cantrip/slashing-gust.json'));
    assert.equal(inspectSavePlan(gust).supported, true, JSON.stringify(inspectSavePlan(gust).blockers));
    assert.equal(gust.resolution.check.sharedMultipleAttackPenalty, true);
    assert.equal(gust.targeting.actorConstraints.supportsActorTargets, true);
    // The critical row takes the heightening-aware bleed from "On a critical success, a target also takes …".
    assert.deepEqual(gust.resolution.outcomes.criticalSuccess.damage, {mode: 'mixed', shared: {multiplier: 2, sourceComponentIds: ['rrgCumtxsY2Gaxqv']},
        formulas: [{formula: '(@item.level)d4[bleed]', source: 'description-inline'}], rollScope: 'outcome'});
    const html = (await fixture('cantrip/slashing-gust.json')).system.description.value;
    const base = await fixture('cantrip/slashing-gust.json');
    // Without the penalty sentence, each target's attack uses its own attack number.
    const separate = compileAbility(detached(base, html.replace(/If you're attacking two creatures[^<]*/, '')));
    assert.equal(separate.resolution.check.sharedMultipleAttackPenalty, undefined);
    assert.equal(inspectSavePlan(separate).supported, true);
    // A critical row that doesn't name the persistent damage the extra sentence restates is refused.
    const mismatch = compileAbility(detached(base, html.replace('1d4 persistent bleed damage', 'no bleeding')));
    assert.equal(inspectSavePlan(mismatch).supported, false);
    // The shared-penalty sentence means nothing for a single target: refused.
    const single = structuredClone(base); single.system.target.value = '1 creature';
    assert.equal(inspectSavePlan(compileAbility(single)).supported, false);
});

test('pushes and pulls are recorded by result for the GM', async () => {
    const expected = {
        'rank-1/hurtling-stone.json': {criticalSuccess: {kind: 'push', distance: 10, upTo: true, optional: true, direction: 'any'}, success: {kind: 'push', distance: 5, upTo: true, optional: true, direction: 'any'}},
        'cantrip/imaginary-weapon.json': {criticalSuccess: {kind: 'push', distance: 10, upTo: false, optional: true, direction: 'away'}},
        'rank-4/shadow-strike.json': {criticalSuccess: {kind: 'pull', distance: 20, upTo: true, optional: false, direction: 'toward'}, success: {kind: 'pull', distance: 10, upTo: true, optional: false, direction: 'toward'}}
    };
    for (const [path, moves] of Object.entries(expected)) {
        const plan = compileAbility(await fixture(path));
        assert.equal(inspectSavePlan(plan).supported, true, `${path}: ${JSON.stringify(inspectSavePlan(plan).blockers)}`);
        const found = Object.fromEntries(Object.entries(plan.resolution.outcomes).filter(([, o]) => o.forcedMovement).map(([d, o]) => [d, o.forcedMovement]));
        assert.deepEqual(found, moves, path);
    }
    const stone = await fixture('rank-1/hurtling-stone.json');
    // Other movement wording is not recognised: blocked.
    const teleport = compileAbility(detached(stone, stone.system.description.value.replace('you can push it up to 10 feet', 'you can teleport it up to 10 feet')));
    assert.equal(inspectSavePlan(teleport).supported, false);
    // A malformed movement record is refused by the core.
    const plan = compileAbility(stone);
    const tampered = structuredClone(plan); tampered.resolution.outcomes.success.forcedMovement = {kind: 'hurl', distance: 5};
    assert.equal(inspectSavePlan(tampered).supported, false);
});

test('persistent damage not doubled on a critical hit (Acid Arrow)', async () => {
    const arrow = compileAbility(await fixture('rank-2/acid-arrow.json'));
    assert.equal(inspectSavePlan(arrow).supported, true, JSON.stringify(inspectSavePlan(arrow).blockers));
    const persistent = [{formula: '(floor(@item.rank/2))d6[persistent,acid]', source: 'description-inline'}];
    assert.deepEqual(arrow.resolution.outcomes.criticalSuccess.damage, {mode: 'mixed', shared: {multiplier: 2, sourceComponentIds: ['0']}, formulas: persistent, rollScope: 'outcome'});
    assert.deepEqual(arrow.resolution.outcomes.success.damage, {mode: 'mixed', shared: {multiplier: 1, sourceComponentIds: ['0']}, formulas: persistent, rollScope: 'outcome'});
    assert.deepEqual([arrow.resolution.outcomes.failure.damage.mode, arrow.resolution.outcomes.criticalFailure.damage.mode], ['none', 'none']);
    const source = await fixture('rank-2/acid-arrow.json');
    const html = source.system.description.value;
    // A persistent formula reading anything but the cast rank is refused.
    assert.equal(inspectSavePlan(compileAbility(detached(source, html.replace('@item.rank/2', '@actor.level/2')))).supported, false);
    // Without "but not the persistent damage", the wording isn't recognised.
    assert.equal(inspectSavePlan(compileAbility(detached(source, html.replace(', but not the persistent damage', '')))).supported, false);
});

test('silver damage stated in the text must be in the damage data (Moonbeam)', async () => {
    const moonbeam = compileAbility(await fixture('rank-1/moonbeam.json'));
    assert.equal(inspectSavePlan(moonbeam).supported, true, JSON.stringify(inspectSavePlan(moonbeam).blockers));
    assert.deepEqual(moonbeam.compilerEvidence.damageMaterials, ['This is silver damage for the purposes of weaknesses, resistances, and the like.']);
    assert.deepEqual(view(moonbeam), {criticalSuccess: [2, 'dazzled'], success: [1, 'dazzled'], failure: [0], criticalFailure: [0]});
    assert.deepEqual([moonbeam.resolution.outcomes.criticalSuccess.effects[0].duration.unit, moonbeam.resolution.outcomes.success.effects[0].duration.unit], ['minutes', 'rounds']);
    // The same sentence without silver in the damage entry is not accepted.
    const source = await fixture('rank-1/moonbeam.json');
    const plain = structuredClone(source); plain.system.damage['0'].materials = [];
    assert.equal(inspectSavePlan(compileAbility(plain)).supported, false);
    // Moonlight Ray: supported since rank 3 batch 25 (its silver cold damage proved the same way).
    assert.equal(inspectSavePlan(compileAbility(await fixture('rank-3/moonlight-ray.json'))).supported, true);
});

test('action-count variants: the chosen PF2e variant carries damage and targets (Blazing Bolt, Splinter Volley)', async () => {
    const bolt = await fixture('rank-2/blazing-bolt.json');
    // The base spell has no damage of its own: only a variant can be resolved.
    assert.equal(inspectSavePlan(compileAbility(bolt)).supported, false);
    const variant = id => {
        const item = structuredClone(bolt);
        Object.assign(item.system, structuredClone(bolt.system.overlays[id].system));
        for (const entry of Object.values(item.system.damage)) entry.kinds ??= ['damage'];
        delete item.system.overlays;
        return item;
    };
    const one = compileAbility(variant('wlrbtv7c5shfmdh1'));     // 1 action: 2d6, 1 creature
    const more = compileAbility(variant('hqiwae0wgehycnex'));    // 2 or 3 actions: 4d6, 2 or more creatures
    assert.equal(inspectSavePlan(one).supported, true, JSON.stringify(inspectSavePlan(one).blockers));
    assert.equal(inspectSavePlan(more).supported, true, JSON.stringify(inspectSavePlan(more).blockers));
    assert.equal(one.resolution.check.sharedMultipleAttackPenalty, undefined);
    assert.equal(more.resolution.check.sharedMultipleAttackPenalty, true);
    // A 2-action variant whose damage doesn't match "increases to 4d6" is refused.
    const wrong = variant('hqiwae0wgehycnex'); Object.values(wrong.system.damage)[0].formula = '3d6';
    assert.equal(inspectSavePlan(compileAbility(wrong)).supported, false);

    const volley = compileAbility(await fixture('rank-2/splinter-volley.json'));
    assert.equal(inspectSavePlan(volley).supported, true, JSON.stringify(inspectSavePlan(volley).blockers));
    assert.deepEqual(volley.resolution.outcomes.criticalSuccess.damage.formulas.map(f => f.formula), ['(floor(@item.level/2))[bleed]']);
    assert.equal(volley.resolution.check.sharedMultipleAttackPenalty, true);
    // Banishing Touch and Horizon Thunder Sphere stay blocked.
    for (const path of ['rank-2/banishing-touch.json', 'rank-1/horizon-thunder-sphere.json']) {
        const source = await fixture(path).catch(() => null);
        if (source) assert.equal(inspectSavePlan(compileAbility(source)).supported, false, path);
    }
});
