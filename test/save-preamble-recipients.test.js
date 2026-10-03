import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {recipientQualifiers, uncompiledSavePreamble} from '../src/compiler/save-preamble.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };
const pending = plan => plan.automation.pendingCapabilities;

// Preamble audit (2026-10-02): rules before the degree table that no compiler claimed passed the gate when written in the plural
// ("bypasses its resistances") or as a recipient limit ("Each incorporeal creature …"). Both now block unless compiled.

test('modifier words are read in the plural too', () => {
    for (const sentence of ['This damage bypasses its resistances.', 'It loses its weaknesses.', 'Its bonuses are suppressed.', 'The target takes the penalties.'])
        assert.ok(uncompiledSavePreamble(`<p>${sentence}</p>`).includes('modifier'), sentence);
});

test('recipient qualifiers: recipients only, not narration or the chosen target', () => {
    const qualifiers = text => recipientQualifiers(text).map(entry => entry.qualifier);
    assert.deepEqual(qualifiers('Each incorporeal creature in the area takes 4d10 sonic damage.').includes('incorporeal'), true);
    assert.deepEqual(qualifiers('It deals 8d10 cold damage to creatures in the area, plus an additional 8d4 void damage to living creatures.'), ['living']);
    assert.deepEqual(qualifiers('Foes in the area must attempt a Will save.'), ['enemy']);
    assert.deepEqual(qualifiers('Each creature in the area that can hear must attempt a Will save.'), ['sense:hear']);
    assert.deepEqual(qualifiers('Nonliving creatures are immune to this spell\'s effects.'), ['non-living']);
    for (const narration of ['Barnacles, coral, and other rough aquatic creatures grow on the target\'s body.', 'As your enemies attempt to approach you, you create a field.',
        'The triggering enemy attempts a Will save.', 'You exhale a shimmering cloud of toxic breath at an enemy\'s face.', 'The blood itself damages the flesh of the undead.'])
        assert.deepEqual(qualifiers(narration), [], narration);
    // Only the save's own gate (which knows the compiled targeting) raises the signal.
    assert.ok(!uncompiledSavePreamble('<p>Each incorporeal creature in the area takes 4d10 sonic damage.</p>').includes('recipient-qualifier'));
    assert.ok(uncompiledSavePreamble('<p>Each incorporeal creature in the area takes 4d10 sonic damage.</p>', null, {recipients: () => false}).includes('recipient-qualifier'));
});

test('Dirge of Remembrance: the bypass and the incorporeal limit are compiled; either dropped blocks', async () => {
    const source = await spell('rank-4/dirge-of-remembrance');
    assert.deepEqual(pending(compileAbility(source)), []);
    const unread = compileAbility(withText(source, html => html.replace('(this damage bypasses its resistances)', '(this damage bypasses all its resistances)')));
    assert.ok(pending(unread).includes('preamble:modifier'), JSON.stringify(pending(unread)));
    const otherTrait = compileAbility(withText(source, html => html.replace('Each incorporeal creature', 'Each spectral creature')));
    assert.ok(pending(otherTrait).includes('preamble:recipient-qualifier'), JSON.stringify(pending(otherTrait)));
});

test('Moonburst: silver for weaknesses and resistances is PF2e\'s own material on the damage; without it the sentence blocks', async () => {
    const source = await spell('rank-7/moonburst');
    assert.deepEqual(pending(compileAbility(source)), []);
    const plain = structuredClone(source);
    for (const entry of Object.values(plain.system.damage)) entry.materials = [];
    assert.ok(pending(compileAbility(plain)).includes('preamble:modifier'));
});

test('Eclipse Burst: void damage only to living creatures is PF2e\'s own void rule, so the two entries together run', async () => {
    const plan = compileAbility(await spell('rank-7/eclipse-burst'));
    assert.ok(!pending(plan).includes('preamble:recipient-qualifier'));
    assert.equal(inspectSavePlan(plan).supported, true);
});

test('enemy recipients given by "Foes" or a template compile to the enemy restriction', async () => {
    const visage = compileAbility(await spell('rank-3/horrific-visage'));
    assert.deepEqual([visage.targeting.actorConstraints.predicates, pending(visage)], [[{kind: 'enemy-of-caster'}], []]);
    const minuet = compileAbility(await spell('rank-4/incarnate-shadow-minuet'));
    const arrive = minuet.resolution.incarnate.phases.find(phase => phase.key === 'arrive');
    assert.deepEqual(arrive.plan.targeting.actorConstraints.predicates, [{kind: 'enemy-of-caster'}]);
});

test('hearing, perceiving the caster, and solid ground are the GM\'s yes/no per target', async () => {
    for (const [path, word] of [['rank-5/confusing-cry', 'hear'], ['rank-3/roaring-applause', 'understand'], ['rank-5/blazing-fissure', 'solid ground']]) {
        const plan = compileAbility(await spell(path));
        assert.deepEqual(pending(plan), [], path);
        const [predicate] = plan.targeting.actorConstraints.predicates;
        assert.equal(predicate.kind, 'gm-confirmed', path);
        assert.ok(predicate.question.includes(word), path);
    }
    // Blazing Fissure's damage in the same sentence is still matched against PF2e's: a different amount blocks.
    const changed = compileAbility(withText(await spell('rank-5/blazing-fissure'), html => html.replace('4d6 bludgeoning', '5d6 bludgeoning')));
    assert.notDeepEqual(pending(changed), []);
});
