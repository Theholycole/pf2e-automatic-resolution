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


// Rank 4, batch 106 (2026-10-03): Cinder Swarm (two kinds of insect, each a save plan of the text's formula exposed on the target's 5-foot aura when cast
// and on each Sustain; the ants' failing rows push 5 feet in the caster's direction; the fireflies' rows dazzle or blind).

test("Cinder Swarm: the two swarms around the target", async () => {
    const plan = compile(await spell("rank-4/cinder-swarm"));
    const [ants, flies] = plan.resolution.lingeringModes;
    assert.deepEqual([ants.key, flies.key], ["fire-ants", "fireflies"]);
    for (const mode of [ants, flies]) {
        assert.deepEqual(mode.plan.resolution.lingering.aura, { feet: 5, includeTargets: true });
        assert.deepEqual([mode.plan.resolution.lingering.events.join(), mode.plan.resolution.lingering.initial], ["sustain", true]);
        assert.equal(supported({ ...mode.plan, resolution: { ...mode.plan.resolution, lingering: undefined } }), true);
    }
    assert.equal(ants.plan.resolution.sharedDamage.formula, "{(3+2*(@item.rank - 4))d6[piercing],2d6[persistent,fire]}");
    assert.equal(ants.plan.resolution.outcomes.failure.forcedMovement.direction, "any");
    assert.deepEqual(flies.plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ["blinded"]);
    // A different move isn't read.
    const other = compile(withText(await spell("rank-4/cinder-swarm"), html => html.replace("must move 5 feet", "must fly 5 feet")));
    assert.equal(other.resolution.lingeringModes, undefined);
});
