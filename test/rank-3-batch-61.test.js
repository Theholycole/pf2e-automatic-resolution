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


// Rank 3, batch 61 (2026-10-02): Antlion Trap (a lingering burst of difficult terrain; a Reflex save on entering and at the start of a turn inside:
// pulled 5 / 10 feet toward the center, a critical failure also Immobilized until it Escapes; Heightened (+2): the burst and the failing pull +5 feet).

test("Antlion Trap: the pit's lingering rows", async () => {
    const plan = compile(await spell("rank-3/antlion-trap"));
    const lingering = plan.resolution.lingering;
    assert.deepEqual(lingering.events, ["enter", "turn-start"]);
    assert.equal(lingering.terrain.difficulty, 2);
    assert.deepEqual([lingering.areaStep.interval, lingering.areaStep.feet, lingering.areaStep.baseRank], [2, 5, 3]);
    const move = degree => plan.resolution.outcomes[degree].forcedMovement;
    assert.deepEqual([move("success").distance, move("success").direction, move("success").heightening], [5, "center", undefined]);
    assert.deepEqual([move("failure").distance, move("failure").heightening.feet, move("criticalFailure").heightening.feet], [10, 5, 5]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(e => [e.slug, e.endsWhen?.[0]?.event]), [["immobilized", "escape"]]);
    // Another heightened entry isn't read.
    const other = compile(withText(await spell("rank-3/antlion-trap"), html => html.replace("by 5 feet", "by 10 feet and the duration by 1 minute")));
    assert.equal(other.compilerEvidence.antlionPit, undefined);
});
