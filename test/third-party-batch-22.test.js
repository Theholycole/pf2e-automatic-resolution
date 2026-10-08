import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {inspectParts, inspectSavePlan} from '../scripts/basic-save-core.js';

// Third-party batch 22 (2026-10-06): Dynamic Ignition (the burning square for rolled rounds; the attacks, the critical hit's persistent fire, the three-action hit's too) and
// Dynamic Vampiric Feast (the next spell's marker; the touch and ranged versions as official Vampiric Feast, their temporary Hit Points' times).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
function mergeDeep(target, patch) { for (const [key, value] of Object.entries(patch)) target[key] = value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key]) ? mergeDeep(target[key], value) : value; return target; }
const variants = name => { const source = items.find(item => item.type === 'spell' && item.name === name && item.system.description.value);
    return Object.values(source.system.overlays).map(overlay => { const merged = structuredClone(source); merged.system = mergeDeep(merged.system, structuredClone(overlay.system)); delete merged.system.overlays; if (overlay.name) merged.name = overlay.name;
        return compileAbility(merged, {nativeEffectCatalog: new Map(), referencedSpells: new Map()}); }); };

test('Dynamic Ignition: the square (enter or end a turn, no save, 1d4 rounds); the attacks with their persistent fire', () => {
    const [square, two, twoMelee, three, threeMelee] = variants('Dynamic Ignition');
    const [part] = square.resolution.incarnate.phases;
    assert.deepEqual([part.kind, part.place.type, part.events.join(), part.roundsRoll, part.formula], ['hazard', 'square', 'enter,turn-end', '1d4', '(1+@item.rank)']);
    assert.deepEqual(inspectParts(square.resolution.incarnate.phases), []);
    for (const plan of [two, twoMelee, three, threeMelee]) assert.equal(inspectSavePlan(plan).supported, true);
    assert.equal(two.resolution.outcomes.success.damage.mode, 'shared');
    assert.equal(three.resolution.outcomes.success.damage.formulas[0].formula, '(@item.rank)d4[persistent,fire]');
    assert.equal(threeMelee.resolution.outcomes.criticalSuccess.damage.formulas[0].formula, '(@item.rank)d6[persistent,fire]');
});

test('Dynamic Vampiric Feast: the marker for the next spell; the touch (3 rounds) and the ranged (1 minute) temporary Hit Points', () => {
    const [one, two, three] = variants('Dynamic Vampiric Feast');
    assert.equal(one.resolution.kind, 'stated-effect');
    assert.deepEqual(one.resolution.statedEffect.vampiricNext, {fraction: 0.5, capPerRank: 5, rounds: 3, sourceText: one.resolution.statedEffect.vampiricNext.sourceText});
    for (const plan of [two, three]) { assert.equal(inspectSavePlan(plan).supported, true); assert.equal(plan.resolution.check.basic, true); }
    assert.deepEqual([two.resolution.casterSiphon?.duration ?? two.resolution.casterBenefit?.duration, three.resolution.casterSiphon?.duration ?? three.resolution.casterBenefit?.duration], [{value: 3, unit: 'rounds'}, {value: 1, unit: 'minutes'}]);
});
