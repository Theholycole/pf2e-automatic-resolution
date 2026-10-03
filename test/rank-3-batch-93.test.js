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


// Rank 3, batch 93 (2026-10-03): Warding Aggression (the card's melee Strike; its result picks PF2e's Effect's degree, marking the foe; the ward ends at the end of
// a caster turn without a melee hit on that foe, or when the foe dies).

test("Warding Aggression: PF2e's degree Effect from the Strike's result", async () => {
    const plan = compile(await spell("rank-3/warding-aggression"));
    assert.equal(plan.resolution.kind, "strike-ward");
    assert.deepEqual(plan.resolution.strikeWard.degrees, { criticalSuccess: "critical-success", success: "success", failure: "failure", criticalFailure: null });
    assert.equal(plan.resolution.strikeWard.markSlug, "warding-aggression");
    // A bonus PF2e's Effect doesn't give isn't read.
    const other = compile(withText(await spell("rank-3/warding-aggression"), html => html.replace("You gain a +1 status bonus to AC", "You gain a +3 status bonus to AC")));
    assert.notEqual(other.resolution.kind, "strike-ward");
});
