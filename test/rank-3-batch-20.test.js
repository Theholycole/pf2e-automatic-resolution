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



import {isExecutableLingeringPlan} from '../scripts/basic-save-core.js';

// Rank 3, batch 20 (2026-10-02): Gleaming Pet, Hydraulic Torrent, Localized Quake.

test('Gleaming Pet: creatures adjacent to the companion save as their turns start; the critical success\'s 10-minute immunity', async () => {
    const plan = compile(await spell('rank-3/gleaming-pet'));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([plan.resolution.lingering.centre, plan.resolution.lingering.aura, plan.resolution.lingering.events, plan.resolution.lingering.initial], ['targets', {feet: 5}, ['turn-start'], false]);
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, {value: 10, unit: 'minutes'});
    const forged = structuredClone(plan); forged.resolution.lingering.aura = {feet: 30};
    assert.equal(isExecutableLingeringPlan(forged), false);
});

test('Hydraulic Torrent: the knockback by degree is the GM\'s, the objects a reminder', async () => {
    const plan = compile(await spell('rank-4/hydraulic-torrent'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].forcedMovement.distance), [5, 10]);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['object-push']);
    assert.equal(inspectSavePlan(compile(withText(await spell('rank-4/hydraulic-torrent'), html => html.replace('(10 feet on a critical failure)', '(10 feet on a critical failure) and Prone')))).supported, false);
});

test('Localized Quake: the caster\'s emanation-or-cone choice; only creatures on solid ground (the GM confirms); Prone on a failure', async () => {
    const plan = compile(await spell('rank-4/localized-quake'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.match(plan.resolution.reminders[0].text, /15-foot emanation or a 15-foot cone/);
    assert.deepEqual(plan.targeting.actorConstraints.predicates.map(predicate => predicate.kind), ['gm-confirmed']);
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].effects.map(effect => effect.slug)), [['prone'], ['prone']]);
});
