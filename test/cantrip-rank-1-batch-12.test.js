import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {spellNoteDuration} from '../src/compiler/spell-note.js';
import {SUPPORTED_RESOLUTION_KINDS} from '../scripts/runtime-core.js';

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

test('Effect + note: PF2e\'s linked Effect on the clear recipient, plus a note with the spell\'s text (user decision)', async () => {
    const effects = await catalog();
    assert.ok(SUPPORTED_RESOLUTION_KINDS.includes('effect-note'));
    const compile = async path => compileAbility(await spell(path), {nativeEffectCatalog: effects});
    // (Sure Strike, Muscle Barrier, Figment and Light are proven Effects since batches 134–137; Animate Rope still takes this route.)
    // (Animate Rope's commands are automated since batch 148; a changed command keeps it on this route.)
    const ropeSource = await spell('rank-1/animate-rope');
    ropeSource.system.description.value = ropeSource.system.description.value.replace('forms a tidy, coiled stack.', 'forms a tidy, coiled stack and deals 1 damage.');
    const rope = compileAbility(ropeSource, {nativeEffectCatalog: effects});
    assert.equal(rope.resolution.kind, 'effect-note');
    assert.match(rope.resolution.effectNote.effect.label, /Animate Rope/);
    // A creature Target: the targets.
    // (Glimpse Weakness is a Strike weakness on the foe since batch 139.)
    // (Spirit Ward's action modes are proved since batch 147; a changed mode keeps it on this route.)
    const ward = await spell('rank-1/spirit-ward');
    ward.system.description.value = ward.system.description.value.replace('The spell has a range of touch.', 'The spell has a range of touch or reach.');
    const wardPlan = compileAbility(ward, {nativeEffectCatalog: effects});
    assert.equal(wardPlan.resolution.kind, 'effect-note');
    assert.equal(wardPlan.resolution.effectNote.recipient, 'target');
    // An instantaneous spell whose Effect lasts: the note lasts as the Effect does.
    const gaze = await compile('rank-1/cinder-gaze');
    assert.equal(gaze.resolution.kind, 'effect-note');
    assert.equal(gaze.resolution.effectNote.duration?.mode, 'fixed');
});

test('long durations become days (PF2e Effects count at most days)', async () => {
    assert.deepEqual(spellNoteDuration({durationSpec: {mode: 'fixed', value: 1, unit: 'months'}}), {mode: 'fixed', value: 30, unit: 'days', expiry: 'turn-start', anchor: 'effect-start', offset: 0});
    assert.equal(spellNoteDuration({durationSpec: {mode: 'fixed', value: 1, unit: 'weeks'}}).value, 7);
    const harrowing = compileAbility(await spell('rank-1/harrowing'), {nativeEffectCatalog: await catalog()});
    assert.deepEqual([harrowing.resolution.effectNote.duration.value, harrowing.resolution.effectNote.duration.unit], [30, 'days']);
});

test('Effect + note: kept strict', async () => {
    const effects = await catalog();
    // Two linked Effects (alternatives or several recipients) aren't guessed.
    assert.notEqual(compileAbility(await spell('rank-1/magics-vessel'), {nativeEffectCatalog: effects}).resolution.kind, 'effect-note');
    // Damage, healing and counteracting never become a note beside an Effect.
    const sure = await spell('rank-1/sure-strike');
    for (const extra of [' It deals 1d6 fire damage to you.', ' You attempt to counteract the effect.']) {
        const copy = structuredClone(sure); copy.system.description.value = copy.system.description.value.replace('</p>', `${extra}</p>`);
        assert.notEqual(compileAbility(copy, {nativeEffectCatalog: effects}).resolution.kind, 'effect-note');
    }
    // An Effect PF2e doesn't have (not in the catalog) isn't applied.
    assert.notEqual(compileAbility(sure, {nativeEffectCatalog: new Map()}).resolution.kind, 'effect-note');
    // A spell with a save keeps its save route.
    const save = structuredClone(sure); save.system.defense = {save: {basic: false, statistic: 'will'}};
    assert.notEqual(compileAbility(save, {nativeEffectCatalog: effects}).resolution.kind, 'effect-note');
});
