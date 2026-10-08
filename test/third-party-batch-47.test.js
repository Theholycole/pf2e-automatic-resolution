import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 47 (2026-10-07): Fractal Frosting (Oracles+) — Frostbite cast with it, and each Frostbite for the minute shaped: difficult terrain around each
// target for a round; from 9th the Speed penalty by the target's result. The module's Effect (its ChoiceSet of –5 and –15 feet) checked against the text. Manifest Wicket
// Dominion (Magic+): the stationary emanation; the caster inside — its slot and Focus spells with its wicket traits +rank status damage or healing.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const effect = id => { const found = items.find(item => item._id === id); return {id, name: found.name, mechanics: {rules: found.system.rules, duration: found.system.duration}}; };
const catalog = new Map([['OPBNdJPRJgcGVqp1', effect('OPBNdJPRJgcGVqp1')]]);
const compile = (source, nativeEffectCatalog = catalog) => compileAbility(source, {nativeEffectCatalog, referencedSpells: new Map()});

test('Fractal Frosting: Frostbite, and its casts shaped for the minute', () => {
    const plan = compile(spell('Fractal Frosting'));
    assert.equal(plan.resolution.kind, 'proxy-cast');
    const data = plan.resolution.proxyCast;
    assert.deepEqual(data.list.map(entry => [entry.name, entry.uuid]), [['Frostbite', 'Compendium.pf2e.spells-srd.Item.IxhGEKl63R4QBvkj']]);
    assert.deepEqual([data.sameRank, data.shaper.spellSlug, data.shaper.seconds, data.shaper.maxTargets, data.shaper.range], [true, 'frostbite', 60, 3, 60]);
    const [terrain, fail, crit] = data.shaper.riders;
    assert.deepEqual([terrain.type, terrain.where, terrain.each, terrain.feet, terrain.until], ['terrain', 'around-creature', true, 5, 'caster-turn-start']);
    assert.deepEqual([fail.minRank, fail.degrees, fail.rules[0].value, crit.degrees, crit.rules[0].value], [9, ['failure'], -5, ['criticalFailure'], -15]);
});

test('Fractal Frosting: without the module\'s matching Effect it isn\'t compiled', () => {
    assert.notEqual(compile(spell('Fractal Frosting'), new Map()).resolution.kind, 'proxy-cast');
});

test('Manifest Wicket Dominion: the caster\'s bonus while inside', () => {
    const plan = compile(spell('Manifest Wicket Dominion'));
    assert.equal(plan.resolution.kind, 'caster-dominion');
    const data = plan.resolution.casterDominion;
    assert.deepEqual([data.radius, data.seconds, data.centre], [60, 60, 'caster-stationary']);
    const [rule] = data.rules;
    assert.deepEqual([rule.key, rule.selector, rule.type, rule.value], ['FlatModifier', ['spell-damage', 'spell-healing'], 'status', '@spell.level']);
    assert.deepEqual(rule.predicate[0], {or: ['item:spell-slot', {and: ['item:trait:focus', {not: 'item:trait:cantrip'}]}]});
    assert.match(data.notes[0], /only once per spell/);
});
