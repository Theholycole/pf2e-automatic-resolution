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



// Rank 2, batch 70 (2026-10-01): Radiant Field.

test('Radiant Field: the light, Light Blindness, the turn-start save (incapacitation), 4th-rank concealment', async () => {
    const plan = compile(await spell('rank-2/radiant-field'));
    const field = plan.resolution.radiantField;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, field.area.value, field.durationSeconds, field.statistic, field.failRounds, field.incapacitation],
        ['radiant-field', 'automatic', 20, 60, 'fortitude', 1, true]);
    assert.equal(field.ability.slug, 'light-blindness');
    assert.deepEqual(field.fromRank, {rank: 4, concealed: true, outside: true});
    assert.equal(field.notes.length, 1);
});

test('Radiant Field: changed rows or heightening are not read', async () => {
    const source = await spell('rank-2/radiant-field');
    for (const [from, to] of [['remains blinded for 1 round', 'remains blinded for 1 minute'], ['this is an incapacitation effect', 'this is a fear effect'], ['are @UUID[Compendium.pf2e.conditionitems.Item.DmAIPqOBomZ7H95W]{Concealed} to creatures outside', 'are hidden to creatures outside']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.resolution.kind, 'radiant-field', from);
    }
});
