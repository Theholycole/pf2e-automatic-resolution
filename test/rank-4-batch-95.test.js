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


// Rank 4, batch 95 (2026-10-02): Door to Beyond (a placed 20-foot emanation around the door, the caster out of it; Large or smaller creatures save as their
// turns begin or on entering, pulled 10 or 20 feet toward the centre; the squares beside the door a child area dealing PF2e's 4d6 slashing, +1d6 a rank, as
// turns end; the objects a note; Dismiss).

test("Door to Beyond: the pull and the door's decompression", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/door-to-beyond"));
    const lingering = plan.resolution.lingering;
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([lingering.centre, lingering.events, lingering.excludeCaster, lingering.dismissible], ["placed", ["enter", "turn-start"], true, true]);
    assert.deepEqual([lingering.doorHazard.dice, lingering.doorHazard.die, lingering.doorHazard.type, lingering.doorHazard.heightening], [4, 6, "slashing", { interval: 1, dice: 1 }]);
    assert.deepEqual(["failure", "criticalFailure"].map(d => [plan.resolution.outcomes[d].forcedMovement.direction, plan.resolution.outcomes[d].forcedMovement.distance]), [["center", 10], ["center", 20]]);
    assert.ok(plan.targeting.actorConstraints.predicates.some(p => p.kind === "size-at-most" && p.size === "lg"));
    for (const event of ["enter", "turn-start"]) assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan, { event })).blockers ?? [], []);
    const bad = structuredClone(plan); bad.compilerEvidence.doorBeyond = [];
    assert.equal(isExecutableLingeringPlan(bad), false);
    const other = compile(withText(await spell("rank-4/door-to-beyond"), html => html.replace("You are unaffected by your own", "You are affected by your own")));
    assert.equal(other.compilerEvidence.doorBeyond, undefined);
});
