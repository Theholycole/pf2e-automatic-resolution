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


// Rank 3, batch 28 (2026-10-02): notes — Travel by Turtle (the conjured turtle, a boat; its heightened durations of a day, a week, a
// month), Tiny Wings (the familiar's 20-foot fly Speed as PF2e's BaseSpeed), Transcribe Conflict (the initiative bonus against one kind of
// foe, the GM's).

const noteOf = plan => plan.resolution.kind === 'spell-note' && plan.automation.level === 'automatic' ? plan.resolution.note : null;

test('Travel by Turtle: a note; the heightened durations of 1 day, 1 week (7 days) and 1 month (30 days)', async () => {
    const plan = compile(await spell('rank-3/travel-by-turtle'));
    assert.ok(noteOf(plan));
    assert.deepEqual(plan.lifecycle.heightenedDurations.map(entry => [entry.minRank, entry.value, entry.unit]), [[5, 1, 'days'], [7, 7, 'days'], [9, 30, 'days']]);
    // A creature the spell doesn't name isn't the conjured one: its Speed sentence is refused.
    assert.equal(noteOf(compile(withText(await spell('rank-3/travel-by-turtle'), html => html.replaceAll('turtle', 'beast')))), null);
});

test('Tiny Wings: the familiar\'s fly Speed is a BaseSpeed rule (a stated Effect since notes batch 1, with the +15 feet for a familiar that flies)', async () => {
    const stated = compile(await spell('rank-3/tiny-wings')).resolution.statedEffect;
    assert.deepEqual(stated.rules, [{key: 'BaseSpeed', selector: 'fly', value: 20}]);
    assert.equal(stated.recipient, 'familiar');
    // A Speed the caster gains on a familiar's spell is refused (the recipient is the familiar).
    assert.equal(noteOf(compile(withText(await spell('rank-3/tiny-wings'), html => html.replace('Your familiar gains a 20-foot fly Speed.', 'You gain a 20-foot fly Speed.')))), null);
});

test('Transcribe Conflict: a note, the initiative bonus only against the foe kind (the GM\'s); heightened durations', async () => {
    const plan = compile(await spell('rank-3/transcribe-conflict'));
    assert.ok(noteOf(plan));
    assert.equal(noteOf(plan).rules, undefined);
    assert.deepEqual(plan.lifecycle.heightenedDurations.map(entry => [entry.minRank, entry.value, entry.unit]), [[5, 8, 'hours'], [8, 1, 'days']]);
    // An unconditional bonus isn't left to the GM.
    assert.equal(noteOf(compile(withText(await spell('rank-3/transcribe-conflict'), html => html.replace(' in combats where you face that exact kind of foe', '')))), null);
});
