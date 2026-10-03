import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, isNextAttackLifetime} from '../scripts/basic-save-core.js';

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



// Rank 3, batch 7 (2026-10-02): Shadow Projectile ("Off-Guard against the triggering attack").

test('Shadow Projectile: Off-Guard against the triggering attack on every affected row', async () => {
    const plan = compile(await spell('rank-3/shadow-projectile'));
    assert.deepEqual([plan.automation.pendingCapabilities, inspectSavePlan(plan).supported], [[], true]);
    for (const degree of ['success', 'failure', 'criticalFailure']) {
        const offGuard = plan.resolution.outcomes[degree].effects.find(effect => effect.slug === 'off-guard');
        assert.ok(isNextAttackLifetime(offGuard), degree);
    }
});

test('the scope is modelled only for a reaction', async () => {
    const source = await spell('rank-3/shadow-projectile');
    const copy = structuredClone(source);
    copy.system.time.value = '2';
    const plan = compile(copy);
    assert.ok(plan.automation.pendingCapabilities.includes('condition-scope:triggering-attack'));
});

test('the immunity naming the spell reads the same for a renamed copy, and a family is still refused', async () => {
    const source = await spell('rank-3/shadow-projectile');
    const copy = structuredClone(source);
    copy._id = 'detachedFixture01'; copy.name = 'Detached family fixture'; copy.system.slug = 'detached-family-fixture';
    assert.equal(inspectSavePlan(compile(copy)).supported, inspectSavePlan(compile(source)).supported);
    assert.equal(compile(copy).resolution.temporaryImmunity.duration.unit, 'hours');
    const family = withText(source, html => { assert.ok(html.includes('immune to <em>shadow projectile</em>')); return html.replace('immune to <em>shadow projectile</em>', 'immune to all shadow spells'); });
    assert.equal(compile(family).resolution.temporaryImmunity, undefined);
});
