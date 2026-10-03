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


// Rank 3, batch 72 (2026-10-02): Heart's Desire (Will: Stupefied 2 for 1 round / 1 minute / 1 minute; the reaction penalty, no reactions, and the difficult
// terrain notes for the same time).

test("Heart's Desire: Stupefied 2 by row and the notes", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-3/hearts-desire"));
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].effects.map(e => [e.slug, e.value, e.duration.value, e.duration.unit])),
        [[["stupefied", 2, 1, "rounds"]], [["stupefied", 2, 1, "minutes"]], [["stupefied", 2, 1, "minutes"]]]);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].noteEffects.map(n => [n.duration.value, n.duration.unit])),
        [[[1, "rounds"]], [[1, "minutes"]], [[1, "minutes"]]]);
    assert.match(plan.resolution.outcomes.criticalFailure.noteEffects[0].text, /difficult terrain/);
    assert.equal(plan.lifecycle.durationSpec.mode, "outcome");
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // A Stupefied value the rows don't share isn't read.
    const other = compile(withText(await spell("rank-3/hearts-desire"), html => html.replace("the target is stupefied 2 and can't use reactions", "the target is stupefied 3 and can't use reactions")));
    assert.equal(other.compilerEvidence.desireRows, undefined);
});
