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

// Rank 3, batch 21 (2026-10-02): Firework Blast, Howling Blizzard.

test('Firework Blast: basic fire damage; the failures roll a second Fortitude save with its own table, −2 after a critical failure', async () => {
    const plan = compile(await spell('rank-3/firework-blast'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const failure = plan.resolution.outcomes.failure.followUps[0], critical = plan.resolution.outcomes.criticalFailure.followUps[0];
    assert.deepEqual([failure.check.statistic, failure.check.modifier, critical.check.modifier.value], ['fortitude', undefined, -2]);
    const timers = followUp => followUp.outcomes.criticalFailure.effects.map(effect => `${effect.slug} ${effect.duration.value} ${effect.duration.unit}`);
    assert.deepEqual(timers(critical), ['blinded 1 rounds', 'dazzled 1 minutes', 'deafened 1 minutes']);
    assert.deepEqual([plan.resolution.outcomes.success.followUps ?? [], plan.resolution.outcomes.criticalSuccess.followUps ?? []], [[], []]);
    assert.equal(inspectSavePlan(compile(withText(await spell('rank-3/firework-blast'), html => html.replace('Deafened</a>', 'Deafened</a>').replace('for 1 round.</p>', 'for 1 round and Stunned 1.</p>')))).supported, false);
});

test('Howling Blizzard: basic cold damage; the area is difficult terrain until the caster\'s next turn; each action variant\'s area', async () => {
    const plan = compile(await spell('rank-5/howling-blizzard'));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([plan.resolution.lingering.initial, plan.resolution.lingering.endsAt, plan.resolution.lingering.terrain.difficulty, plan.resolution.lingering.area], [true, 'caster-turn-start', 2, {type: 'cone', value: 60}]);
    // The 3-action variant (PF2e's overlay): a 30-foot burst.
    const three = await spell('rank-5/howling-blizzard'); three.system.time.value = '3'; three.system.area = {type: 'burst', value: 30};
    assert.equal(isExecutableLingeringPlan(compile(three)), true);
    // A variant whose area isn't the stated one is refused.
    const wrong = await spell('rank-5/howling-blizzard'); wrong.system.area = {type: 'cone', value: 30};
    assert.equal(isExecutableLingeringPlan(compile(wrong)), false);
});
