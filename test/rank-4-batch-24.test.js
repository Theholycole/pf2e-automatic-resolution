import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

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

const supported = plan => inspectSavePlan(plan).supported;


// Rank 4, batch 24 (2026-10-02): Retributive Pain (half the triggering damage: the card reads the caster's last damage taken) and Conjured
// Clockwork (a lingering burst whose optional Sustain growth is the caster's control).

test('Retributive Pain: a basic save on half the triggering damage', async () => {
    const plan = compile(await spell('rank-4/retributive-pain'));
    assert.equal(supported(plan), true);
    assert.equal(plan.automation.level, 'automatic');
    assert.deepEqual(plan.resolution.sharedDamage.triggeredDamage, {fraction: 0.5, type: 'mental', source: 'caster-last-damage',
        sourceText: 'The target takes mental damage equal to half the triggering damage.'});
    assert.equal(plan.resolution.sharedDamage.formula, '0[mental]');
    // Another fraction isn't read.
    const other = compile(withText(await spell('rank-4/retributive-pain'), html => html.replace('equal to half the', 'equal to twice the')));
    assert.equal(supported(other), false);
});

test('Conjured Clockwork: the lingering burst and its optional growth', async () => {
    const plan = compile(await spell('rank-4/conjured-clockwork'));
    const lingering = plan.resolution.lingering;
    assert.equal(plan.automation.level, 'automatic');
    assert.deepEqual(lingering.sustainGrowth, {feet: 5, optional: true,
        sourceText: 'On subsequent rounds, the first time you Sustain the spell each round, you can expand the radius of the clockwork device by 5 feet.'});
    assert.ok(lingering.terrain);
    assert.equal(lingering.sustained, true);
    // Without the growth sentence's wording it isn't read.
    const other = compile(withText(await spell('rank-4/conjured-clockwork'), html => html.replace('you can expand the radius', 'you can reshape the radius')));
    assert.notEqual(other.automation.level, 'automatic');
});
