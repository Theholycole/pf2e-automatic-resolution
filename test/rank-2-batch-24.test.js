import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

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



// Rank 2, batch 24 (2026-09-30): no-save spells as notes (a "see text" duration with its stated bound, a conjured creature's statistics, an
// object's numbers, situational bonuses, the spell's own counteract), heightened notes reaching "unlimited", and a placed concealing cloud (Mist).

test('Notes: a stated upper bound for a "see text" duration (Animal Messenger)', async () => {
    const plan = compile(await spell('rank-2/animal-messenger'));
    assert.equal(plan.resolution.kind, 'spell-note');
    assert.deepEqual([plan.resolution.note.duration.value, plan.resolution.note.duration.unit], [24, 'hours']);
    const other = compile(withText(await spell('rank-2/animal-messenger'), text => text.replace('or after 24 hours, whichever comes first', 'or when you choose')));
    assert.notEqual(other.resolution.kind, 'spell-note');
});

test('Notes: a conjured creature\'s statistics and an object\'s numbers are the GM\'s', async () => {
    for (const path of ['rank-2/marvelous-mount', 'rank-2/ghostly-carrier', 'rank-2/waterproof', 'rank-2/fireproof', 'rank-2/slough-skin'])
        assert.equal(compile(await spell(path)).resolution.kind, 'spell-note', path);
    assert.equal(compile(await spell('rank-2/marvelous-mount')).resolution.note.recipient, 'target');
    // A creature's unconditional number is not a note.
    const creature = compile(withText(await spell('rank-2/waterproof'), text => text.replace('The hydrophobic properties of the spell also grant', 'You gain')));
    assert.notEqual(creature.resolution.kind, 'spell-note');
});

test('Notes: "The duration is unlimited." from its rank', async () => {
    const {spellNoteDurationAt} = await import('../src/compiler/spell-note.js');
    const note = compile(await spell('rank-2/waterproof')).resolution.note;
    assert.deepEqual([4, 8].map(rank => spellNoteDurationAt(note, rank)), [{mode: 'fixed', value: 1, unit: 'days', expiry: 'turn-start', anchor: 'effect-start', offset: 0}, {mode: 'unlimited'}]);
    assert.deepEqual(spellNoteDurationAt(note, 2), note.duration);
});

test('Notes: the spell\'s own counteract against what the GM names (Enhance Victuals, Pave Ground)', async () => {
    const victuals = compile(await spell('rank-2/enhance-victuals')).resolution.note.heightenedCounteract;
    assert.deepEqual(victuals.map(entry => [entry.base, entry.target, entry.result]), [[true, 'any poisons in the food or water', 'is counteracted']]);
    const pave = compile(await spell('rank-2/pave-ground')).resolution.note.heightenedCounteract;
    assert.deepEqual(pave.map(entry => entry.result), ['making it normal terrain']);
    // Another counteract wording keeps the spell off the note route.
    const other = compile(withText(await spell('rank-2/enhance-victuals'), text => text.replace('the spell attempts to counteract any poisons in the food or water', 'you can counteract any poison you choose')));
    assert.notEqual(other.resolution.kind, 'spell-note');
});

test('Mist: a placed concealing area the caster can Dismiss', async () => {
    const plan = compile(await spell('rank-2/mist'));
    assert.equal(plan.resolution.kind, 'concealing-area');
    assert.deepEqual(plan.resolution.concealingArea, {area: {type: 'burst', value: 20}, durationSeconds: 60, dismissible: true});
    const other = compile(withText(await spell('rank-2/mist'), text => text.replace('and all creatures outside the mist become concealed to creatures within it', 'and they gain a +1 status bonus to AC')));
    assert.notEqual(other.resolution.kind, 'concealing-area');
});
