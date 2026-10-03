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

const noteOf = plan => plan.resolution.kind === 'spell-note' && plan.automation.level === 'automatic' ? plan.resolution.note : null;

// Rank 3, batch 30 (2026-10-02): Conjured Conveyance (a note: the vehicle's statistics are the GM's), Disruptive Transfer (the teleport a
// reminder; the creatures adjacent to the starting space save or are Dazzled 1 minute), Caster's Imposition ("On a failed save, the target
// can't …" a failure note; heightened 1 hour at 4th, 1 day at 5th).

test('Conjured Conveyance: a note, its vehicle stat blocks the GM\'s', async () => {
    assert.ok(noteOf(compile(await spell('rank-3/conjured-conveyance'))));
    // A resistance outside the stat blocks is refused.
    assert.equal(noteOf(compile(withText(await spell('rank-3/conjured-conveyance'), html => html.replace('You conjure an intricate vehicle', 'You gain resistance 5 to fire. You conjure an intricate vehicle')))), null);
});

test('Disruptive Transfer: Dazzled 1 minute on failing, the teleport reminder', async () => {
    const plan = compile(await spell('rank-3/disruptive-transfer'));
    assert.equal(supported(plan), true);
    assert.deepEqual(plan.resolution.outcomes.failure.effects.map(effect => [effect.slug, effect.duration.value, effect.duration.unit]), [['dazzled', 1, 'minutes']]);
    assert.ok(plan.resolution.reminders.some(reminder => reminder.kind === 'caster-movement' && /adjacent to the caster's starting space/.test(reminder.text)));
});

test('Caster\'s Imposition: the failure note, heightened durations', async () => {
    const plan = compile(await spell('rank-3/casters-imposition'));
    assert.equal(supported(plan), true);
    assert.match(plan.resolution.outcomes.failure.noteEffects[0].text, /can't participate in any ritual/);
    assert.deepEqual(plan.lifecycle.heightenedDurations.map(entry => [entry.minRank, entry.value, entry.unit]), [[4, 1, 'hours'], [5, 1, 'days']]);
    // A failed-save rule with a number in it is refused.
    assert.equal(supported(compile(withText(await spell('rank-3/casters-imposition'), html => html.replace("can't participate in any ritual", "takes a -2 penalty to rituals and can't participate in any ritual")))), false);
});
