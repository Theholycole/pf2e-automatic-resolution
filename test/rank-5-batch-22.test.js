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


// Rank 5, batch 22 (2026-10-02): Scouring Pulse (the Area paragraph is the item's cylinder; 6d8 vitality, Reflex, written out as rows: the failing
// rows add 1d8 persistent vitality (2d8 from 8th rank, the text's); a halo note on those rows while the persistent damage lasts).

test("Scouring Pulse: the rows, the persistent damage and the halo note", async () => {
    const plan = compile(await spell("rank-5/scouring-pulse"));
    assert.equal(plan.resolution.kind, 'save');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    assert.deepEqual(inspectSavePlan(plan).blockers, []);
    for (const degree of ['failure', 'criticalFailure']) {
        assert.equal(plan.resolution.outcomes[degree].damage.formulas[0].formula, '(1 + floor(@item.rank / 8))d8[persistent,vitality]');
        assert.equal(plan.resolution.outcomes[degree].noteEffects[0].whilePersistent, 'vitality');
    }
    assert.equal((plan.resolution.outcomes.success.noteEffects ?? []).length, 0);
    // An Area paragraph other than the item's isn't read.
    const other = compile(withText(await spell("rank-5/scouring-pulse"), html => html.replace('10-foot radius, 60-foot-tall', '15-foot radius, 60-foot-tall')));
    assert.notDeepEqual(other.automation.pendingCapabilities, []);
});
