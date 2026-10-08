import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {spellNoteDuration} from '../src/compiler/spell-note.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}

test('a bare "sustained" duration is PF2e\'s 10 minutes: those spells become sustained notes', async () => {
    assert.deepEqual(spellNoteDuration({durationSpec: {mode: 'sustained', maximum: null, raw: ''}}),
        {mode: 'fixed', value: 10, unit: 'minutes', expiry: 'turn-start', anchor: 'effect-start', offset: 0, sustained: true});
    for (const path of ['cantrip/prestidigitation', 'cantrip/ghost-sound', 'cantrip/telekinetic-hand']) {
        const plan = compileAbility(await spell(path), {nativeEffectCatalog: await catalog()});
        assert.equal(plan.resolution.kind, 'spell-note', path);
        assert.equal(plan.resolution.note.duration.sustained, true, path);
    }
    // A stated sustained maximum is still read as written.
    assert.equal(spellNoteDuration({durationSpec: {mode: 'sustained', maximum: {mode: 'fixed', value: 1, unit: 'minutes'}}}).value, 1);
});

test('Effect + note also takes one link applied on use, and is guided (not proven automation)', async () => {
    // (Uplifting Overture and Practice Makes Perfect are built since batches 139 and 142; a copy of the latter whose last sentence isn't the
    // re-graded check's form stays on this route.)
    const source = await spell('rank-1/practice-makes-perfect');
    source.system.description.value = source.system.description.value.replace("This bonus can change the outcome of the target's skill check.", 'The target also feels encouraged.');
    const plan = compileAbility(source, {nativeEffectCatalog: await catalog()});
    assert.equal(plan.resolution.kind, 'effect-note');
    assert.equal(plan.resolution.effectNote.recipient, 'target');
    assert.deepEqual([plan.automation.level, plan.automation.pendingCapabilities], ['guided', ['effect-note:unproven-text']]);
});
