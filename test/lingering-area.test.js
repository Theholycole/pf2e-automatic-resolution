import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, isExecutableLingeringPlan, lingeringExposurePlan} from '../scripts/basic-save-core.js';
import {footprintSquares, tokenDocumentDistance} from '../scripts/token-distance.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
function detached(original, description) {
    const item = structuredClone(original);
    item._id = 'custom-lingering01';
    if (item._stats) delete item._stats.compendiumSource;
    item.name = 'Custom Lingering Spell';
    item.system.slug = 'custom-lingering-spell';
    item.system.description.value = description;
    return item;
}

test('lingering damage areas compile their triggers and never run as a one-time save', async () => {
    const acid = compileAbility(await fixture('rank-5/acid-storm.json'));
    assert.equal(isExecutableLingeringPlan(acid), true);
    assert.deepEqual([acid.resolution.lingering.events, acid.resolution.lingering.centre, acid.resolution.lingering.durationSeconds], [['turn-start'], 'placed', 60]);
    assert.equal(inspectSavePlan(acid).supported, false, 'the plain save route refuses a lingering area');
    assert.equal(inspectSavePlan(lingeringExposurePlan(acid)).supported, true, 'each exposure is an ordinary basic save');
    const petal = compileAbility(await fixture('rank-4/petal-storm.json'));
    assert.equal(isExecutableLingeringPlan(petal), true);
    assert.deepEqual(petal.resolution.lingering.events, ['enter', 'turn-start']);
    assert.equal(petal.resolution.lingering.oncePerRound, true);
});

test('areas with extra rules stay blocked', async () => {
    // (Rust Cloud's metal rider is read since rank 4 batch 28, Frozen Fog's Mist and rider since rank 6 batch 2, Visions of Danger's disbelief since rank 7
    // batch 9; Toxic Cloud needs its referenced Mist, absent here.)
    for (const path of ['rank-5/toxic-cloud.json']) {
        const plan = compileAbility(await fixture(path));
        assert.equal(isExecutableLingeringPlan(plan), false, path);
    }
    // A reworded petal storm with a new rule sentence is not a lingering area.
    const petal = await fixture('rank-4/petal-storm.json');
    const extra = compileAbility(detached(petal, petal.system.description.value.replace('A creature can take damage', 'Creatures in the storm are also dazzled. A creature can take damage')));
    assert.equal(isExecutableLingeringPlan(extra), false);
    // Damage dice that don't match the spell's damage entry are refused.
    const mismatched = compileAbility(detached(petal, petal.system.description.value.replace('2d10 slashing', '3d10 slashing')));
    assert.equal(isExecutableLingeringPlan(mismatched), false);
});

test('sustained emanations with concealment compile (Songbird\'s Call)', async () => {
    const song = await fixture('rank-4/songbirds-call.json');
    const plan = compileAbility(song);
    assert.equal(isExecutableLingeringPlan(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.centre, lingering.sustained, lingering.concealment, lingering.excludeCaster],
        [['enter', 'turn-end'], 'caster', true, true, true]);
    assert.equal(lingering.durationSeconds, 60);
    // Changing the concealment sentence to something else blocks the spell.
    const altered = compileAbility(detached(song, song.system.description.value.replace('become concealed to creatures within it', 'become hidden to creatures within it')));
    assert.equal(isExecutableLingeringPlan(altered), false);
});

test('emanation distances come from token documents (PF2e 5-10-5 diagonals, nearest squares)', () => {
    const grid = {gridSize: 100, gridDistance: 5};
    const at = (x, y, size = 1) => ({x: x * 100, y: y * 100, width: size, height: size});
    assert.equal(tokenDocumentDistance(at(0, 0), at(1, 0), grid), 5, 'adjacent');
    assert.equal(tokenDocumentDistance(at(0, 0), at(3, 0), grid), 15);
    assert.equal(tokenDocumentDistance(at(0, 0), at(3, 3), grid), 20, 'three diagonals count 5-10-5');
    assert.equal(tokenDocumentDistance(at(0, 0), at(4, 0), grid), 20);
    assert.equal(footprintSquares(at(0, 0, 2), at(4, 0), 100), 3, 'a large token measures from its nearest square');
    assert.equal(footprintSquares(at(0, 0), at(0, 0), 100), 0);
    // (A Tiny token — half a square — measures from its square: 5 feet adjacent, 10 feet two squares away.)
    assert.equal(tokenDocumentDistance(at(12, 8, 0.5), at(13, 8), grid), 5, 'tiny, adjacent');
    assert.equal(tokenDocumentDistance(at(12, 8, 0.5), at(14, 8), grid), 10, 'tiny, two squares');
    assert.equal(tokenDocumentDistance(at(3, 3), at(17, 3), grid), 70);
});

test('degree-save areas: the preamble says who saves and when; the degree table says what happens', async () => {
    const drought = compileAbility(await fixture('rank-2/breath-of-drought.json'));
    assert.equal(isExecutableLingeringPlan(drought), true, JSON.stringify(drought.automation.pendingCapabilities));
    const lingering = drought.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.oncePerRound, lingering.sustained, lingering.durationSeconds], [['turn-end'], true, true, true, 600],
        'cast + end of turn; a sustained spell with no maximum lasts up to 10 minutes');
    const exposure = lingeringExposurePlan(drought);
    assert.equal(drought.resolution.check.basic, false);
    assert.equal(inspectSavePlan(exposure).supported, true, 'each exposure is the ordinary degree save');
    assert.ok(exposure.resolution.degreeAdjustment, 'water and plant creatures use the outcome one degree worse');
    assert.ok(exposure.targeting.actorConstraints.predicates.some(p => p.kind === 'gm-confirmed' && /moisture/.test(p.question)), 'the GM confirms creatures with no moisture are immune');
    assert.equal(inspectSavePlan(drought).supported, false, 'never a one-time save');

    const stagnate = compileAbility(await fixture('rank-5/stagnate-time.json'));
    assert.equal(isExecutableLingeringPlan(stagnate), true);
    assert.deepEqual([stagnate.resolution.lingering.events, stagnate.resolution.lingering.initial], [['turn-start'], false], '"begins its turn" is a turn-start exposure');
});

test('degree-save triggers refuse qualified subjects and cast-only saves', async () => {
    // (Gluttonous Growth's "unless it's already Grabbed or Restrained" is its skipWhile since rank 5 batch 31: test/rank-5-batch-31.test.js.)
    // (Since rank 5 batch 30 "all living creatures in the area" is a lingering subject — the card refuses nonliving creatures — but Tear the Veil
    // stayed unresolved by its other rules until rank 8 batch 14, which reads them: test/rank-8-batch-14.test.js.)
    assert.equal(isExecutableLingeringPlan(compileAbility(await fixture('rank-10/tear-the-veil.json'))), true);
    // A save only when the spell is cast is an ordinary area save (Swampcall's terrain makes it a lingering area: batch 88).
    const swampSource = await fixture('rank-1/swampcall.json');
    const swamp = compileAbility(detached(swampSource, swampSource.system.description.value.replace('The area becomes difficult terrain. ', '')));
    assert.equal(swamp.resolution.lingering, undefined);
    // A reworded trigger naming living creatures only is refused.
    const drought = await fixture('rank-2/breath-of-drought.json');
    const living = compileAbility(detached(drought, drought.system.description.value.replace('Each creature in the area', 'Each living creature in the area')));
    assert.equal(isExecutableLingeringPlan(living), false);
});

test('"You are …" outcome clauses are the caster, never the target (Mind Games)', async () => {
    // (Since rank 2 batch 22: the caster's condition and the spell's end, on a Sustain-repeated save.)
    const plan = compileAbility(await fixture('rank-2/mind-games.json'));
    const critical = plan.resolution.outcomes.criticalSuccess;
    assert.deepEqual(critical.effects, []);
    assert.deepEqual(critical.casterConditions.map(entry => [entry.slug, entry.value]), [['stunned', 1]]);
    assert.equal(critical.endsSpell, true);
    assert.equal(isExecutableLingeringPlan(plan), true);
    // A reworded caster clause stays the caster's and unread.
    const other = compileAbility(detached(await fixture('rank-2/mind-games.json'), (await fixture('rank-2/mind-games.json')).system.description.value.replace('and the spell ends', 'until the spell ends')));
    assert.equal(other.resolution.outcomes.criticalSuccess.semanticCoverage.clauses.find(c => /^You are/.test(c.text)).status, 'residual');
    assert.equal(isExecutableLingeringPlan(other), false);
});

test('sustained damage areas expose creatures when cast and on each Sustain', async () => {
    const petal = await fixture('rank-4/petal-storm.json');
    const item = detached(petal, '<p>Embers swirl through the area. When you Cast the Spell and the first time you Sustain it each round, each creature in the area takes 2d10 slashing damage (basic Reflex save).</p>');
    item.system.duration = {sustained: true, value: '1 minute'};
    const plan = compileAbility(item);
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(plan.automation.pendingCapabilities));
    assert.deepEqual([plan.resolution.lingering.events, plan.resolution.lingering.initial], [['sustain'], true]);
    // The same text on a spell that isn't sustained has nothing to sustain.
    const unsustained = structuredClone(item); unsustained.system.duration = {sustained: false, value: '1 minute'};
    assert.equal(isExecutableLingeringPlan(compileAbility(unsustained)), false);
});

test('enemy-only areas expose only enemies of the caster', async () => {
    const drought = await fixture('rank-2/breath-of-drought.json');
    const enemies = compileAbility(detached(drought, drought.system.description.value.replace('Each creature in the area', 'Each enemy in the area')));
    assert.equal(isExecutableLingeringPlan(enemies), true, JSON.stringify(enemies.automation.pendingCapabilities));
    assert.equal(enemies.resolution.lingering.enemiesOnly, true);
    assert.ok(lingeringExposurePlan(enemies).targeting.actorConstraints.predicates.some(p => p.kind === 'enemy-of-caster'));
    // Damage in the trigger must match the spell's damage entry.
    const petal = await fixture('rank-4/petal-storm.json');
    const basic = compileAbility(detached(petal, '<p>Thorns whirl through the area. Each enemy that enters the area or starts its turn in the area takes 2d10 slashing damage with a basic Reflex save.</p>'));
    assert.equal(isExecutableLingeringPlan(basic), true, JSON.stringify(basic.automation.pendingCapabilities));
    assert.equal(basic.resolution.lingering.enemiesOnly, true);
    // A lingering plan claiming enemies without the predicate is not executable.
    const tampered = structuredClone(basic);
    tampered.targeting.actorConstraints.predicates = tampered.targeting.actorConstraints.predicates.filter(p => p.kind !== 'enemy-of-caster');
    assert.equal(isExecutableLingeringPlan(tampered), false);
});

test('enemy recipients restrict one-time area saves; qualified enemies do not', async () => {
    const {validateActorTarget} = await import('../scripts/basic-save-core.js');
    for (const path of ['cantrip/shatter-mind.json', 'rank-5/synaptic-pulse.json', 'rank-4/divine-wrath.json']) {
        const plan = compileAbility(await fixture(path));
        assert.ok(plan.targeting.actorConstraints.predicates.some(p => p.kind === 'enemy-of-caster'), path);
        assert.equal(inspectSavePlan(plan).supported, true, path);
    }
    const constraints = {supportsActorTargets: true, complete: true, predicates: [{kind: 'enemy-of-caster'}], casterUuid: 'Actor.caster', casterAlliance: 'party'};
    const actor = (uuid, alliance) => ({uuid, alliance, type: 'npc', system: {traits: {value: []}}});
    assert.equal(validateActorTarget(constraints, actor('Actor.caster', 'party')).eligible, false, 'the caster');
    assert.equal(validateActorTarget(constraints, actor('Actor.ally', 'party')).eligible, false, 'an ally');
    assert.deepEqual(validateActorTarget(constraints, actor('Actor.foe', 'opposition')), {eligible: true, reason: null}, 'an enemy');
    assert.match(validateActorTarget(constraints, actor('Actor.neutral', null)).confirmation, /enemy/, 'a neutral creature is the GM\'s call');
});

test('different damage on Sustain: its own formula at the cast rank (Animated Assault)', async () => {
    const source = await fixture('rank-2/animated-assault.json');
    const plan = compileAbility(source);
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(plan.automation.pendingCapabilities));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.sustained], [['sustain'], true, true]);
    assert.deepEqual(lingering.sustainDamage, {formula: '(floor(@item.level/2))d10[bludgeoning]', type: 'bludgeoning'});
    // The cast exposure rolls the item's own damage; the Sustain exposure rolls the formula.
    const cast = lingeringExposurePlan(plan), sustain = lingeringExposurePlan(plan, {event: 'sustain'});
    assert.equal(cast.resolution.sharedDamage.mode, 'pf2e-item-damage');
    assert.deepEqual([sustain.resolution.sharedDamage.mode, sustain.resolution.sharedDamage.formula], ['formula', '(floor(@item.level/2))d10[bludgeoning]']);
    assert.equal(inspectSavePlan(cast).supported, true);
    assert.equal(inspectSavePlan(sustain).supported, true);
    assert.deepEqual(sustain.resolution.outcomes.criticalFailure.damage, {mode: 'shared', multiplier: 2, sourceComponentIds: ['sustain']});

    const html = source.system.description.value;
    // A formula reading anything other than the cast rank is refused.
    const actorRef = compileAbility(detached(source, html.replace('@item.level/2', '@actor.level/2')));
    assert.equal(isExecutableLingeringPlan(actorRef), false);
    // A different damage type on Sustain is refused.
    const retyped = compileAbility(detached(source, html.replace('d10[bludgeoning]]', 'd10[fire]]')));
    assert.equal(isExecutableLingeringPlan(retyped), false);
    // Cast damage with no Sustain sentence isn't a lingering area.
    const castOnly = compileAbility(detached(source, html.replace(/On subsequent rounds[^<]*/, '')));
    assert.equal(castOnly.resolution.lingering, undefined);
});
