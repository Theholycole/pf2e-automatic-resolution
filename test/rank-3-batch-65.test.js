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


// Rank 3, batch 65 (2026-10-02): Annunciation of the Outer Gate (a 30-foot emanation: creatures that decline the invitation or don't understand it
// save Will: Frightened 1 / 2 / 3, its value not decreasing after a turn it damaged an agreeing creature (a note); the agreement is a note).

test("Annunciation of the Outer Gate: the refusers' save", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-3/annunciation-of-the-outer-gate"));
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].effects.map(e => [e.slug, e.value])), [[["frightened", 1]], [["frightened", 2]], [["frightened", 3]]]);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].noteEffects.map(n => [n.label, n.duration.value, n.duration.unit])), Array(3).fill([["Frightened floor", 10, "minutes"]]));
    assert.deepEqual(plan.resolution.reminders.map(r => r.kind), ["spell-note", "spell-note"]);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another floor isn't read.
    const other = compile(withText(await spell("rank-3/annunciation-of-the-outer-gate"), html => html.replace("doesn't decrease", "decreases by 2")));
    assert.equal(other.compilerEvidence.invitationSave, undefined);
});
