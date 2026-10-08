import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {executableCasterChoice, inspectSavePlan} from '../scripts/basic-save-core.js';

// Third-party batch 21 (2026-10-06): Dynamic Gouging Claw — the claw Strike (PF2e's Strike rule element, its critical specialization, then immune), the bleeding
// attack (the caster's type; the bleed not doubled), and the three-action compound (the claw, its reach, the attack with doubled bleed).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
function mergeDeep(target, patch) { for (const [key, value] of Object.entries(patch)) target[key] = value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key]) ? mergeDeep(target[key], value) : value; return target; }
const source = items.find(item => item.type === 'spell' && item.name === 'Dynamic Gouging Claw' && item.system.description.value);
const [one, two, three] = Object.values(source.system.overlays).map(overlay => { const merged = structuredClone(source); merged.system = mergeDeep(merged.system, structuredClone(overlay.system)); delete merged.system.overlays;
    return compileAbility(merged, {nativeEffectCatalog: new Map(), referencedSpells: new Map()}); });

test('one action: the claw Strike for a minute, its critical specialization, then immune for 10 minutes', () => {
    assert.equal(one.resolution.kind, 'stated-effect');
    const [strike, crit] = one.resolution.statedEffect.rules;
    assert.deepEqual([strike.key, strike.damage.base.die, strike.group, strike.traits.join()], ['Strike', 'd6', 'knife', 'agile,finesse,unarmed']);
    assert.equal(crit.key, 'CriticalSpecialization');
    assert.deepEqual(one.resolution.statedEffect.immunity.duration, {value: 10, unit: 'minutes'});
});

test('two actions: the attack, the caster\'s type, the bleed not doubled on a critical hit', () => {
    assert.equal(inspectSavePlan(two).supported, true);
    assert.ok(executableCasterChoice(two));
    assert.equal(two.resolution.outcomes.criticalSuccess.damage.formulas[0].formula, '(@item.rank)[persistent,bleed]');
    assert.equal(two.resolution.outcomes.criticalSuccess.damage.shared.multiplier, 2);
});

test('three actions: the claw, its reach until the end of the next turn, then the attack with doubled bleed', () => {
    assert.equal(three.resolution.kind, 'compound');
    const [strike, reach, attack] = three.resolution.parts.map(part => part.plan);
    assert.equal(strike.resolution.kind, 'stated-effect');
    assert.deepEqual([reach.resolution.statedEffect.rules[0].value, reach.resolution.statedEffect.expiry], ['reach-15', 'turn-end']);
    assert.equal(inspectSavePlan(attack).supported, true);
    assert.equal(attack.resolution.outcomes.criticalSuccess.damage.formulas[0].formula, '(2*(2+floor((@item.rank - 1)/1)*1))[persistent,bleed]');
});
