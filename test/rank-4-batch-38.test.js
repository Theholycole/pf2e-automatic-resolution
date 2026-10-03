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


// Rank 4, batch 38 (2026-10-02): Hot Air (basic Fortitude 4d6 fire; on a failure the target burns when it speaks: a note for the sustained spell
// whose Ongoing control deals the spell's rank in fire damage each time the GM reports an auditory action or a non-subtle spell).

test("Hot Air: the basic save and the speech rider", async () => {
    const plan = compile(await spell("rank-4/hot-air"));
    assert.equal(plan.resolution.kind, 'save');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    assert.deepEqual(inspectSavePlan(plan).blockers, []);
    for (const degree of ['failure', 'criticalFailure']) {
        const note = plan.resolution.outcomes[degree].noteEffects[0];
        assert.equal(note.triggeredDamage.trigger, 'auditory-or-cast');
        assert.equal(note.triggeredDamage.formula, '@item.rank');
        assert.equal(note.duration.sustained, true);
        assert.deepEqual(note.rankAmount, {base: 4, step: 1, interval: 1, baseRank: 4, multiplier: 1});
    }
    assert.equal((plan.resolution.outcomes.success.noteEffects ?? []).length, 0);
    // A Heightened step other than the item's is refused.
    const other = compile(withText(await spell("rank-4/hot-air"), html => html.replace('increases by 1d6', 'increases by 2d6')));
    assert.notDeepEqual(other.automation.pendingCapabilities, []);
});
