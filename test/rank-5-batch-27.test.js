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


// Rank 5, batch 27 (2026-10-02): Impaling Spike (8d6 piercing cold iron, Reflex: a failure Immobilized until it Escapes (spell DC), a critical
// failure double damage and Off-Guard for as long as it's immobilized; standing on solid ground and the weakness damage each turn a GM note).

test("Impaling Spike: the impaling rows", async () => {
    const plan = compile(await spell("rank-5/impaling-spike"));
    assert.deepEqual(inspectSavePlan(plan).blockers, []);
    const fail = plan.resolution.outcomes.failure, crit = plan.resolution.outcomes.criticalFailure;
    assert.deepEqual(fail.effects.map(e => [e.slug, e.endsWhen?.[0]?.event]), [["immobilized", "escape"]]);
    assert.deepEqual(crit.effects.map(e => e.slug), ["immobilized", "off-guard"]);
    assert.equal(crit.damage.multiplier, 2);
    assert.match(fail.noteEffects[0].text, /weakness to cold iron/);
    assert.equal((plan.resolution.outcomes.success.noteEffects ?? []).length, 0);
    // A spike of another material than the damage entry's isn't read.
    const other = compile(withText(await spell("rank-5/impaling-spike"), html => html.replace("made of cold iron", "made of silver")));
    assert.equal(other.compilerEvidence.impaleRows, undefined);
});
