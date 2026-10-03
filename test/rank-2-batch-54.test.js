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



// Rank 2, batch 54 (2026-10-01): Thermal Remedy.

test('Thermal Remedy: the benefit list, its entries and PF2e\'s ChoiceSets proved together', async () => {
    const plan = compile(await spell('rank-2/thermal-remedy'));
    const note = plan.resolution.effectNote;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, note.recipient, note.targetLimit], ['effect-note', 'automatic', 'target', 10]);
    assert.deepEqual(note.proof.benefitChoice.picks, [{rank: 2, count: 1}, {rank: 4, count: 2}, {rank: 7, count: 3}]);
    assert.deepEqual(note.proof.benefitChoice.choices.map(choice => choice.value), ['temp-hp', 'fire-resistance', 'bonus-vs-disease']);
    assert.deepEqual(note.proof.benefitChoice.flags, ['spellEffectThermalRemedy', 'spellEffectThermalRemedyTwo']);
});

test('Thermal Remedy: a changed value or count is not proved; the limit is the text\'s', async () => {
    const source = await spell('rank-2/thermal-remedy');
    for (const [from, to] of [['Gain 5 temporary', 'Gain 6 temporary'], ['resistance to fire increases to 3', 'resistance to fire increases to 4'],
        ['bonus against disease increases to +3', 'bonus against disease increases to +4'], ['provides two benefits', 'provides three benefits']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.automation.level, 'automatic', from);
    }
    assert.equal(compile(withText(source, html => html.replace('Up to 10 creatures', 'Up to 12 creatures'))).resolution.effectNote.targetLimit, 12);
});
