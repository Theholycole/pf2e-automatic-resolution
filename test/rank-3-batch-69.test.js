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


// Rank 3, batch 69 (2026-10-02): Mind Reading (Will: every result immune to this caster's Mind Reading for 1 hour; the Intelligence comparison read
// from PF2e and whispered on a success or failure; the surface thoughts the GM's — the critical failure's for the sustained minute).

test("Mind Reading: the caster's immunity, the whispered Intelligence comparison, the thoughts notes", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const { compareIntelligence } = await import("../scripts/reveal-runtime.js");
    const plan = compile(await spell("rank-3/mind-reading"));
    assert.deepEqual([plan.resolution.temporaryImmunity.byCaster, plan.resolution.temporaryImmunity.degrees.length, plan.resolution.temporaryImmunity.duration], [true, 4, { value: 1, unit: "hours" }]);
    const note = d => plan.resolution.outcomes[d].noteEffects?.[0];
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => [note(d).reveal.kind, note(d).duration.value, note(d).duration.unit]),
        [["intelligence-compare", 1, "rounds"], ["intelligence-compare", 1, "rounds"], ["intelligence-compare", 1, "minutes"]]);
    assert.deepEqual([compareIntelligence({ abilities: { int: { mod: 4 } } }, { abilities: { int: { mod: 2 } } }), compareIntelligence({ abilities: { int: { mod: 2 } } }, { abilities: { int: { mod: 2 } } }),
        compareIntelligence({ abilities: { int: { mod: -1 } } }, { abilities: { int: { mod: 2 } } })], ["higher", "equal", "lower"]);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another immunity scope isn't read.
    const other = compile(withText(await spell("rank-3/mind-reading"), html => html.replace("immune to your mind reading", "immune to all mind reading")));
    assert.equal(other.compilerEvidence.mindRead, undefined);
});
