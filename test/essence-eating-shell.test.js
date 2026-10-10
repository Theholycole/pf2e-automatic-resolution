import assert from 'node:assert/strict';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {ESSENCE_SCHOOLS, essenceShellSpellSource} from '../src/compiler/essence-shell.js';

// Essence Eating Shell (Magus+, the user's 2026-10-10 answer: the caster picks the school): each school's effect, written as a spell, compiles to the module's save
// card with its damage at the shell spell's rank and its rows.
const compile = (school, options) => {
    const {effect, source} = essenceShellSpellSource(school, options);
    return {effect, plan: compileAbility({...source, _id: 'essenceshell0001'}, {nativeEffectCatalog: new Map(), referencedSpells: new Map()})};
};
const rowSlugs = (plan, degree) => (plan.resolution.outcomes?.[degree]?.effects ?? []).map(effect => `${effect.slug}${effect.value ?? ''}`).join('+');

test('every school compiles to a save card', () => {
    for (const school of [...ESSENCE_SCHOOLS, 'transmutation-immune']) {
        const {plan} = compile(school, {rank: 3, cascadeType: 'fire'});
        assert.equal(plan.resolution.kind, 'save', school);
    }
});

test('the damage at the shell spell rank, and the rows', () => {
    const abjuration = compile('abjuration', {rank: 4}).plan;
    assert.deepEqual(abjuration.resolution.sharedDamage.components.map(component => component.formula), ['4d4']);
    assert.equal(rowSlugs(abjuration, 'failure'), 'immobilized');
    assert.equal(rowSlugs(compile('divination', {rank: 2}).plan, 'criticalFailure'), 'frightened2');
    assert.equal(rowSlugs(compile('enchantment', {rank: 5}).plan, 'criticalFailure'), 'confused');
    assert.equal(rowSlugs(compile('necromancy', {rank: 3}).plan, 'failure'), 'drained2');
    assert.equal(rowSlugs(compile('transmutation', {rank: 3}).plan, 'criticalFailure'), 'sickened3');
    // (Evocation: the rank as damage of the Arcane Cascade's type; necromancy: void, or vitality when the shell spell had that trait.)
    assert.deepEqual(compile('evocation', {rank: 6, cascadeType: 'electricity'}).effect.damage, [{formula: '6', type: 'electricity'}]);
    assert.equal(compile('necromancy', {rank: 3, vitality: true}).effect.fizzleType, 'vitality');
    assert.deepEqual(compile('conjuration', {rank: 2}).effect.note.castFlatCheck, {dc: 5, trait: 'manipulate'});
});
