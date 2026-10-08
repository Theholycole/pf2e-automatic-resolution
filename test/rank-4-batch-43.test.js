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

const supported = plan => inspectSavePlan(plan).supported;


// Rank 4, batch 43 (2026-10-02): Tortoise and the Hare (the foe's Fortitude save on one enemy: Slowed 1 for 1 round / 3 rounds / 3 minutes; after
// Finalize, the card grants the other target — the caster or an ally — Quickened for 1 round on a failure or 1 minute on a critical failure, with
// the extra action's restriction as a note).

test("Tortoise and the Hare: the foe's rows and the other target's grant", async () => {
    const plan = compile(await spell("rank-4/tortoise-and-the-hare"));
    assert.deepEqual(inspectSavePlan(plan).blockers, []);
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{ kind: "enemy-of-caster" }]);
    const slowed = degree => (plan.resolution.outcomes[degree].effects ?? []).map(e => [e.slug, e.value, e.duration.value, e.duration.unit]);
    assert.deepEqual([slowed("criticalSuccess"), slowed("success"), slowed("failure"), slowed("criticalFailure")],
        [[], [["slowed", 1, 1, "rounds"]], [["slowed", 1, 3, "rounds"]], [["slowed", 1, 3, "minutes"]]]);
    const rows = plan.resolution.partnerGrant.rows;
    assert.deepEqual(Object.keys(rows), ["failure", "criticalFailure"]);
    assert.deepEqual([rows.failure.slug, rows.failure.duration.value, rows.failure.duration.unit, rows.criticalFailure.duration.value, rows.criticalFailure.duration.unit],
        ["quickened", 1, "rounds", 1, "minutes"]);
    assert.equal(plan.resolution.partnerGrant.restriction, "It can use the extra action only to Step, Stride, or Strike.");
    // A grant row the text doesn't state is blocked.
    const broken = structuredClone(plan); broken.resolution.partnerGrant.rows.success = { ...rows.failure, sourceText: "The foe is fine." };
    assert.notDeepEqual(inspectSavePlan(broken).blockers, []);
    // Another target line isn't read.
    const other = structuredClone(await spell("rank-4/tortoise-and-the-hare")); other.system.target.value = "1 foe";
    assert.equal(compile(other).resolution.partnerGrant, undefined);
});
