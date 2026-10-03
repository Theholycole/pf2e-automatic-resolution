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


// Rank 4, batch 13 (2026-10-02): Friends to Foes (the fear-of-allies note on each Frightened row; "It can't move closer to its allies while
// frightened." a behaviour note; Confused until no longer frightened), Nightmare (the save when the target next sleeps, a +4 question,
// a week's immunity on a critical success, Drained 2 until no longer Fatigued).

test('Friends to Foes: Frightened rows carry the fear-of-allies note; the failure\'s movement note; the critical failure\'s Confused while frightened', async () => {
    const plan = compile(await spell('rank-4/friends-to-foes'));
    assert.equal(supported(plan), true);
    for (const degree of ['success', 'failure', 'criticalFailure'])
        assert.ok(plan.resolution.outcomes[degree].noteEffects.some(note => note.label === 'Fear of allies' && note.whileCondition === 'frightened'), degree);
    assert.ok(plan.resolution.outcomes.failure.noteEffects.some(note => note.label === 'Movement' && note.whileCondition === 'frightened'));
    assert.equal(plan.resolution.outcomes.criticalFailure.effects.find(effect => effect.slug === 'confused').whileCondition, 'frightened');
    // Another distance than the text's form is refused.
    assert.equal(supported(compile(withText(await spell('rank-4/friends-to-foes'), html => html.replace('within 10 feet of an ally', 'within sight of an ally')))), false);
});

test('Nightmare: the sleep-timed save reminder, the +4 question, a week\'s immunity, Drained 2 while Fatigued', async () => {
    const plan = compile(await spell('rank-4/nightmare'));
    assert.equal(supported(plan), true);
    assert.ok(plan.resolution.reminders.some(reminder => reminder.kind === 'save-timing'));
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, {value: 7, unit: 'days'});
    assert.deepEqual(plan.resolution.temporaryImmunity.degrees, ['criticalSuccess']);
    const critical = plan.resolution.outcomes.criticalFailure.effects;
    assert.deepEqual(critical.map(effect => [effect.slug, effect.value, effect.whileCondition ?? null]), [['drained', 2, 'fatigued'], ['fatigued', null, null]]);
    // A month's immunity isn't read.
    assert.equal(compile(withText(await spell('rank-4/nightmare'), html => html.replace('for 1 week', 'for 1 month'))).resolution.temporaryImmunity ?? null, null);
});
