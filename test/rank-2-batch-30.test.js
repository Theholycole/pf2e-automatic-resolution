import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}, ...(e.system?.badge ? {badge: e.system.badge} : {})}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}
const effects = await catalog();
const compile = source => compileAbility(source, {nativeEffectCatalog: effects});
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };



// Rank 2, batch 30 (2026-10-01): stealing a Lore or a spell with damage by what was taken (Umbral Mindtheft, Umbral Extraction); counteracting
// a poison and coating the held weapon with PF2e's Effect (Extract Poison).

test('Umbral Mindtheft and Umbral Extraction: the Steal card\'s damage by what was taken', async () => {
    const {stealDamageFormula} = await import('../src/compiler/steal-damage.js');
    const mind = compile(await spell('rank-2/umbral-mindtheft'));
    assert.equal(mind.resolution.kind, 'steal-damage');
    assert.deepEqual([mind.resolution.stealDamage.kind, stealDamageFormula(mind.resolution.stealDamage, 1), stealDamageFormula(mind.resolution.stealDamage, 4)], ['lore', '2d6[mental]', '8d6[mental]']);
    const theft = compile(await spell('rank-2/umbral-extraction'));
    assert.deepEqual([theft.resolution.stealDamage.kind, stealDamageFormula(theft.resolution.stealDamage, 3), stealDamageFormula(theft.resolution.stealDamage, 0)], ['spell', '3d4[mental]', null]);
    const other = compile(withText(await spell('rank-2/umbral-extraction'), text => text.replace('As normal, you can Steal only', 'You deal 1d6 fire damage. As normal, you can Steal only')));
    assert.notEqual(other.resolution.kind, 'steal-damage');
});

test('Extract Poison: the counteract and PF2e\'s Effect shape', async () => {
    const {transferEffectShape} = await import('../src/compiler/counteract-transfer.js');
    const plan = compile(await spell('rank-2/extract-poison'));
    assert.equal(plan.resolution.kind, 'counteract-transfer');
    assert.deepEqual([plan.resolution.counteractTransfer.thing, plan.resolution.counteractTransfer.faces, plan.resolution.counteractTransfer.weaponFlag, plan.resolution.counteractTransfer.levelFlag],
        ['poison', 6, 'weapon', 'level']);
    const rules = [{key: 'ChoiceSet', flag: 'weapon', choices: {ownedItems: true, types: ['weapon']}}, {key: 'ChoiceSet', flag: 'level', choices: {config: 'levels'}},
        {key: 'DamageDice', damageType: 'poison', dieSize: 'd8', diceNumber: '@item.flags.system.rulesSelections.level', selector: '{item|flags.system.rulesSelections.weapon}-damage'}];
    assert.equal(transferEffectShape(rules, 6, 'poison'), null);
    rules[2].dieSize = 'd6';
    assert.deepEqual(transferEffectShape(rules, 6, 'poison'), {weaponFlag: 'weapon', levelFlag: 'level'});
});
