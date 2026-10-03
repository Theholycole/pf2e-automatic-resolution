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


// Rank 5, batch 50 (2026-10-02): Pack Breaker (Will: every result immune for 1 hour; PF2e's Unfriendly by a note for 1 minute; Confused 1 round / 1
// minute; each affected creature's former allies within reach save too — a card per creature starting the same save).

test("Pack Breaker: Unfriendly notes, Confused, immunity and the chained save", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/pack-breaker"));
    assert.deepEqual(plan.resolution.chainSave.degrees, ["success", "failure", "criticalFailure"]);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].noteEffects.map(n => [n.rules[0].flag, n.duration.value, n.duration.unit])),
        [[["conditionUnfriendly", 1, "minutes"]], [["conditionUnfriendly", 1, "minutes"]], [["conditionUnfriendly", 1, "minutes"]]]);
    assert.deepEqual(["failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].effects.map(e => [e.slug, e.duration.value, e.duration.unit])), [[["confused", 1, "rounds"]], [["confused", 1, "minutes"]]]);
    assert.equal(plan.resolution.temporaryImmunity.duration.value, 1);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    const bad = structuredClone(plan); bad.resolution.chainSave.sourceText = "Something else.";
    assert.ok((inspectSavePlan(bad).blockers ?? []).some(b => b.code === "chain-save" || /chained save/.test(b.message)));
    // Another chain isn't read.
    const other = compile(withText(await spell("rank-5/pack-breaker"), html => html.replace("within its reach", "within 30 feet")));
    assert.equal(other.compilerEvidence.packBreaker, undefined);
});
