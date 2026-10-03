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



// Rank 2, batch 57 (2026-10-01): Clawsong.

import {strikeUpgradeRules} from '../scripts/caster-resolved-rules.js';

test('Clawsong: PF2e\'s trait rules kept, its die upgrade replaced by the text\'s claw damage; 6 targets from 4th', async () => {
    const plan = compile(await spell('rank-2/clawsong'));
    const note = plan.resolution.effectNote, proof = note.proof;
    assert.deepEqual([plan.automation.level, note.recipient, note.targetStrike], ['automatic', 'target', 'claw']);
    assert.deepEqual(proof.strikeUpgrade, {strike: 'claw', type: 'slashing', dice: 1, faces: 6, alreadyFaces: 8});
    assert.deepEqual(proof.ruleOverrides, [{index: 0, key: 'DamageAlteration', remove: true}]);
    assert.deepEqual(proof.targetsByRank, [{rank: 4, limit: 6}]);
    const claw = (id, die, damageType) => ({id, slug: 'claw', system: {baseItem: 'claw'}, _source: {system: {damage: {dice: 1, die, damageType}}}});
    const rules = strikeUpgradeRules(proof.strikeUpgrade, {itemTypes: {weapon: [claw('a', 'd6', 'slashing'), claw('b', 'd6', 'piercing'), claw('c', 'd4', 'slashing')]}});
    assert.deepEqual(rules.filter(rule => rule.property === 'damage-dice-faces').map(rule => [rule.predicate[0], rule.value]), [['item:id:a', 8], ['item:id:b', 6], ['item:id:c', 6]]);
    assert.ok(rules.filter(rule => rule.property === 'damage-type').every(rule => rule.value === 'slashing'));
});

test('Clawsong: another die, type or trait is not proved', async () => {
    const source = await spell('rank-2/clawsong');
    for (const [from, to] of [['deals 1d6 slashing damage. If', 'deals 1d6 piercing damage. If'], ['it deals 1d8 instead', 'it deals 1d4 instead'], ['gains the deadly 1d8 trait', 'gains the deadly 1d10 trait']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.automation.level, 'automatic', from);
    }
});
