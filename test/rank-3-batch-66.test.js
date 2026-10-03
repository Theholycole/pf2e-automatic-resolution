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


// Rank 3, batch 66 (2026-10-02): Croak Voice (Fortitude; a hoarse voice's flat check; once a round an Interact to massage its throat, a Fortitude
// save that ends the spell; failure: 2d10 mental for each auditory action (+1d10 a rank); critical failure doubled, no massage).

test("Croak Voice: the throat massage and the auditory damage", async () => {
    const { inspectSavePlan, isTriggeredDamage } = await import("../scripts/basic-save-core.js");
    const { validNoteEffect } = await import("../scripts/note-effects.js");
    const plan = compile(await spell("rank-3/croak-voice"));
    const notes = degree => plan.resolution.outcomes[degree].noteEffects;
    assert.deepEqual(notes("success").map(n => [n.endSave?.statistic, n.triggeredDamage ?? null]), [["fortitude", null]]);
    assert.deepEqual(notes("failure").map(n => [n.endSave?.oncePerRound, n.triggeredDamage.trigger, n.triggeredDamage.dice, n.triggeredDamage.die, n.triggeredDamage.multiplier ?? 1]), [[true, "auditory", 2, 10, 1]]);
    assert.deepEqual(notes("criticalFailure").map(n => [n.endSave ?? null, n.triggeredDamage.multiplier]), [[null, 2]]);
    assert.ok(["success", "failure", "criticalFailure"].every(d => notes(d).every(validNoteEffect)));
    assert.ok(notes("failure").every(n => isTriggeredDamage(n.triggeredDamage)));
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another ending isn't read.
    const other = compile(withText(await spell("rank-3/croak-voice"), html => html.replace("On a success, the spell ends.", "On a success, it can speak.")));
    assert.equal(other.compilerEvidence.hoarseVoice, undefined);
});
