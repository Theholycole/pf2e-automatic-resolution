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


// Rank 3, batch 53 (2026-10-02): Rend Magic (a melee spell attack: 3d10 force, double on a critical hit; the hit rows' note for 1 minute: each time the
// GM reports the target Casting a Spell, (ceil(rank/2) − 1)d10 force — doubled after a critical hit; ending without a spell is the GM's).

test("Rend Magic: the attack and the cast-punishing note", async () => {
    const plan = compile(await spell("rank-3/rend-magic"));
    assert.equal(plan.resolution.check.statistic, 'spell-attack');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    assert.deepEqual(inspectSavePlan(plan).blockers, []);
    const hit = plan.resolution.outcomes.success.noteEffects[0].triggeredDamage, crit = plan.resolution.outcomes.criticalSuccess.noteEffects[0].triggeredDamage;
    assert.equal(hit.trigger, 'spell-cast');
    assert.equal(hit.formula, '(ceil(@item.rank/2)-1)d10');
    assert.equal(crit.formula, '2*((ceil(@item.rank/2)-1)d10)');
    assert.equal((plan.resolution.outcomes.failure.noteEffects ?? []).length, 0);
    // A cast-damage step other than 1d10 a step isn't read.
    const other = compile(withText(await spell("rank-3/rend-magic"), html => html.replace('casts a spell increases by 1d10', 'casts a spell increases by 2d10')));
    assert.notDeepEqual(other.automation.pendingCapabilities, []);
});
