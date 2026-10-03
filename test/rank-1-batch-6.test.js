import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {ruleValueAtRank} from '../src/compiler/degree-choice-effect.js';
import {ruleStatedSentences} from '../src/compiler/direct-effect-resolution-compiler.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}

test('Protection: the Effect on the target; from 3rd rank, the caster may add allies around the target', async () => {
    const plan = compileAbility(await spell('rank-1/protection'), {nativeEffectCatalog: await catalog()});
    assert.deepEqual([plan.resolution.kind, plan.automation.level], ['effect', 'automatic']);
    assert.deepEqual([plan.resolution.heightenedAllies.minRank, plan.resolution.heightenedAllies.radius], [3, 10]);
    // Any other wording in that heightened entry isn't read.
    const other = await spell('rank-1/protection');
    other.system.description.value = other.system.description.value.replace('around the target', 'around you');
    // (Its proven route is refused; the spell falls to Effect + note, counted apart.)
    assert.notEqual(compileAbility(other, {nativeEffectCatalog: await catalog()}).resolution.kind, 'effect');
});

test('Infuse Vitality: the extra Strike damage and the holy option are the Effect\'s own rules', async () => {
    const plan = compileAbility(await spell('rank-1/infuse-vitality'), {nativeEffectCatalog: await catalog()});
    assert.deepEqual([plan.resolution.kind, plan.automation.level], ['effect', 'automatic']);
    assert.deepEqual([1, 3, 5].map(rank => ruleValueAtRank('ternary(gte(@item.level,5),3,ternary(gte(@item.level,3),2,1))', rank)), [1, 2, 3]);
    const rules = [{key: 'DamageDice', selector: 'strike-damage', dieSize: 'd4', damageType: 'vitality', diceNumber: 1}];
    assert.deepEqual(ruleStatedSentences("Each target's unarmed and weapon Strikes deal an extra 1d6 vitality damage.", rules, {rank: 1}), [], 'a different die');
    assert.equal(ruleValueAtRank('@actor.level', 1), null);
});
