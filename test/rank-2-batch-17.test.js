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



// Rank 2, batch 17 (2026-09-30): damage on the creature's auditory actions and spells (Frozen Lungs), a floor until the creature does
// something (Ghoulish Cravings), a healing reduction at the cast rank (Imprinting Hand).

test('Frozen Lungs: each row\'s formula on its note, dealt when the GM reports an auditory action or a spell', async () => {
    const {inspectSavePlan, isTriggeredDamage} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/frozen-lungs'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const trigger = degree => plan.resolution.outcomes[degree].noteEffects.find(note => note.triggeredDamage).triggeredDamage;
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => trigger(degree).formula), ['1', '(floor(@item.rank/2))d8', '(floor(@item.rank/2) + 1)d8']);
    assert.ok(['success', 'failure', 'criticalFailure'].every(degree => isTriggeredDamage(trigger(degree))));
    assert.equal(isTriggeredDamage({...trigger('failure'), formula: '@actor.level'}), false);
    assert.equal(isTriggeredDamage({...trigger('failure'), frequency: 'once'}), false);
});

test('Ghoulish Cravings: Sickened 2 held at 1 (or 2) until it consumes raw meat', async () => {
    const {inspectSavePlan, isConditionFloor} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/ghoulish-cravings'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const {failure, criticalFailure} = plan.resolution.outcomes;
    assert.deepEqual([failure.conditionFloor.value, failure.conditionFloor.lifetime, failure.conditionFloor.liftedBy], [1, 'until-lifted', 'it consumes some raw meat']);
    assert.match(failure.conditionFloor.liftNote, /bite out of a corpse/);
    assert.deepEqual([criticalFailure.conditionFloor.value, criticalFailure.effects.map(effect => [effect.slug, effect.value])], [2, [['sickened', 2]]]);
    assert.equal(isConditionFloor({...failure.conditionFloor, liftedBy: null}), false);
});

test('Imprinting Hand: half / full / double damage and the healing reduction at the cast rank', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const {noteAmountAt, validNoteEffect} = await import('../scripts/note-effects.js');
    const plan = compile(await spell('rank-2/imprinting-hand'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const rows = ['success', 'failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree]);
    assert.deepEqual(rows.map(row => row.damage.multiplier ?? row.damage.shared?.multiplier), [0.5, 1, 2]);
    const notes = rows.map(row => row.noteEffects.find(note => note.rankAmount));
    assert.ok(notes.every(validNoteEffect));
    assert.deepEqual(notes.map(note => noteAmountAt(note.rankAmount, 2)), [4, 8, 16]);
    assert.deepEqual(notes.map(note => noteAmountAt(note.rankAmount, 3)), [6, 12, 24]);
});
