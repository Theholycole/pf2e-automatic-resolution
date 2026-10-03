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



// Rank 2, batch 25 (2026-10-01): a concealing cloud sized by actions with a toggled penalty to hear (Confetti Cloud); enemies around the caster
// off-guard against its attacks (Menacing Lament); a region of magical darkness with the light notes (Darkness).

test('Confetti Cloud: concealment, the size by actions, Dismiss, and the toggled hearing penalty', async () => {
    const plan = compile(await spell('rank-2/confetti-cloud'));
    assert.equal(plan.resolution.kind, 'concealing-area');
    const data = plan.resolution.concealingArea;
    assert.deepEqual([data.sizes, data.durationSeconds, data.dismissible], [{1: 5, 2: 10, 3: 15}, 60, true]);
    assert.deepEqual(data.memberRules[1], {key: 'FlatModifier', selector: 'perception', type: 'circumstance', value: -2, predicate: ['confetti-cloud-hearing']});
    const other = compile(withText(await spell('rank-2/confetti-cloud'), text => text.replace('on Perception checks to hear', 'on Perception checks')));
    assert.notEqual(other.resolution.kind, 'concealing-area');
});

test('Menacing Lament: enemies in the emanation, off-guard only against the caster, until its next turn', async () => {
    const plan = compile(await spell('rank-2/menacing-lament'));
    assert.equal(plan.resolution.kind, 'against-caster-area');
    assert.deepEqual(plan.resolution.againstCaster, {radius: 30, penalty: {selector: 'ac', type: 'circumstance', value: -2, slug: 'off-guard'}, flankingNote: true,
        duration: {value: 1, unit: 'rounds', expiry: 'turn-start'}});
    const other = compile(withText(await spell('rank-2/menacing-lament'), text => text.replace('against your attacks', 'against all attacks')));
    assert.notEqual(other.resolution.kind, 'against-caster-area');
});

test('Darkness: a fully dark region, the light notes, and darkvision\'s concealment from 4th', async () => {
    const plan = compile(await spell('rank-2/darkness'));
    assert.equal(plan.resolution.kind, 'darkness-area');
    const data = plan.resolution.darknessArea;
    assert.deepEqual([data.darkness, data.durationSeconds, data.heightened.map(entry => entry.minRank)], [{mode: 0, modifier: 1}, 60, [4]]);
    const other = compile(withText(await spell('rank-2/darkness'), text => text.replace('From outside, it appears as a globe of pure darkness.', 'Creatures inside are blinded.')));
    assert.notEqual(other.resolution.kind, 'darkness-area');
});
