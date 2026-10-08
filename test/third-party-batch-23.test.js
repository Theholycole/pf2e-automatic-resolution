import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {damageSwapApplies, inspectSavePlan, isExecutableLingeringPlan, lingeringExposurePlan} from '../scripts/basic-save-core.js';
import {violentLightEffectMatches} from '../src/compiler/violent-light.js';

// Third-party batch 23 (2026-10-06): Winter's Cold Embrace (the darkness's turn-end cold, spirit instead for a cold-shrugging creature without darkvision; its
// light rules a note), Aura of Violent Light (a willing ally's light: enemies ending their turns in it save, the emanation growing on Sustain to 15 feet).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const catalog = new Map(items.filter(item => item.type === 'effect').flatMap(effect => {
    const profile = {id: effect._id, name: effect.name, type: 'effect', automation: {ruleKeys: [], requiresConfiguration: true, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules ?? [], duration: effect.system.duration ?? null, start: null}, ...(effect.system.badge ? {badge: effect.system.badge} : {})};
    return [[effect.name, profile], [effect._id, profile]];
}));
const compile = name => compileAbility(spell(name), {nativeEffectCatalog: catalog, referencedSpells: new Map()});

test('Winter\'s Cold Embrace: the turn-end basic Fortitude cold in the burst; spirit instead for a cold-resistant creature without darkvision', () => {
    const plan = compile('Winter\'s Cold Embrace');
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(inspectSavePlan(lingeringExposurePlan(plan)).blockers));
    assert.deepEqual(plan.resolution.lingering.events, ['turn-end']);
    assert.deepEqual(plan.resolution.lingering.area, {type: 'burst', value: 40});
    const swap = plan.resolution.damageSwap;
    assert.deepEqual([swap.from, swap.to, swap.when], ['cold', 'spirit', 'resistant-no-darkvision']);
    const resistant = {attributes: {resistances: [{type: 'cold'}], immunities: []}, perception: {senses: []}};
    assert.equal(damageSwapApplies(swap, resistant), true);
    assert.equal(damageSwapApplies(swap, {...resistant, perception: {senses: [{type: 'darkvision'}]}}), false);
    assert.equal(damageSwapApplies(swap, {attributes: {resistances: [], immunities: []}, perception: {senses: []}}), false);
    assert.ok(plan.resolution.reminders.some(reminder => /Light does not enter the area/.test(reminder.text)));
});

test('Aura of Violent Light: the ally-centred 5-foot aura, enemies saving at the end of their turns; growth to 15 feet; the module Effect proved', () => {
    const plan = compile('Aura of Violent Light');
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(inspectSavePlan(lingeringExposurePlan(plan)).blockers));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.centre, lingering.aura.feet, lingering.events.join(), lingering.enemiesOnly, lingering.sustained, lingering.initial], ['targets', 5, 'turn-end', true, true, false]);
    assert.deepEqual([lingering.auraGrowth.feet, lingering.auraGrowth.maximum], [5, 15]);
    assert.equal(lingering.anchorAlly, true);
    assert.match(lingering.anchorEffect.uuid, /\.Item\.bRjQx1Kqy70IDcss$/);
    assert.deepEqual(plan.resolution.sharedDamage.components.map(component => `${component.formula} ${component.type}`), ['2 fire', '2 spirit']);
    assert.deepEqual(plan.targeting.actorConstraints.predicates.map(predicate => predicate.kind), ['enemy-of-caster']);
    const effect = items.find(item => item._id === 'bRjQx1Kqy70IDcss');
    assert.ok(violentLightEffectMatches(effect, {feet: 5, step: 5, maximum: 15}));
    assert.equal(violentLightEffectMatches(effect, {feet: 5, step: 5, maximum: 20}), false);
    // (A changed text — a 30-foot maximum — no longer matches the module's three radii, and isn't automated.)
    const changed = spell('Aura of Violent Light');
    changed.system.description.value = changed.system.description.value.replace('maximum of 15 feet', 'maximum of 30 feet');
    assert.equal(compileAbility(changed, {nativeEffectCatalog: catalog, referencedSpells: new Map()}).resolution.lingering?.auraGrowth, undefined);
});
