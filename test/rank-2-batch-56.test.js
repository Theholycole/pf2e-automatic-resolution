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



// Rank 2, batch 56 (2026-10-01): Canopy Crawler.

import {recipientResolvedOverrides} from '../scripts/caster-resolved-rules.js';

test('Canopy Crawler: the climb Speed is the recipient\'s highest Speed; yourself or your companion, both at 5th', async () => {
    const plan = compile(await spell('rank-2/canopy-crawler'));
    const note = plan.resolution.effectNote;
    assert.deepEqual([plan.automation.level, note.recipient, note.proof.bothFromRank], ['automatic', 'self-or-companion', 5]);
    assert.deepEqual(note.proof.ruleOverrides, [{index: 0, key: 'BaseSpeed', patch: {value: '@recipient:highest-speed'}}]);
    const actor = {system: {movement: {speeds: {land: {value: 25}, fly: {value: 40}, climb: null, travel: {value: 60}}}}};
    assert.equal(recipientResolvedOverrides(note.proof.ruleOverrides, actor)[0].patch.value, 40);
    assert.equal(recipientResolvedOverrides(note.proof.ruleOverrides, {system: {movement: {speeds: {land: {value: 30}}}}})[0].patch.value, 30);
});

test('Canopy Crawler: another Speed or another hands rule is not proved', async () => {
    const source = await spell('rank-2/canopy-crawler');
    for (const [from, to] of [['equal to their highest Speed', 'equal to their land Speed'], ['with a hand occupied', 'with both hands occupied']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.automation.level, 'automatic', from);
    }
});
