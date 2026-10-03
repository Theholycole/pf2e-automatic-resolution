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



// Rank 2, batch 20 (2026-09-30): a condition only for a creature the GM says is in the stated situation (Fear the Sun's Blinded "if the
// creature is already exposed to bright light"), and a creature ability as a note (Light Blindness).

test('Fear the Sun: Dazzled by row, Light Blindness as a 1-minute note, and Blinded gated on the GM\'s bright-light answer', async () => {
    const {inspectSavePlan, gmQuestionGate} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/fear-the-sun'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const {success, failure, criticalFailure} = plan.resolution.outcomes;
    assert.deepEqual([success.effects[0].slug, success.effects[0].duration.unit], ['dazzled', 'rounds']);
    assert.deepEqual([failure.effects[0].slug, failure.effects[0].duration.unit], ['dazzled', 'minutes']);
    const blinded = criticalFailure.effects.find(effect => effect.slug === 'blinded');
    assert.equal(blinded.gate.kind, 'gm-question');
    assert.equal(blinded.gate.question, 'Is it already exposed to bright light? If so, it\'s Blinded.');
    assert.deepEqual([blinded.duration.expiry, blinded.duration.anchor], ['turn-end', 'target-turn']);
    const note = criticalFailure.noteEffects[0];
    assert.deepEqual([note.label, note.duration.value, note.duration.unit], ['Light Blindness', 1, 'minutes']);
    assert.match(note.text, /bestiary-ability-glossary-srd/);
    const state = {outcomes: plan.resolution.outcomes, targets: [{id: 'a', degree: 'criticalFailure'}, {id: 'b', degree: 'failure'}]};
    assert.equal(gmQuestionGate(state, state.targets[0])?.kind, 'gm-question');
    assert.equal(gmQuestionGate(state, state.targets[1]), null);
});

test('Fear the Sun: a forged question gate, or one with extra keys, is refused', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/fear-the-sun'));
    const forged = structuredClone(plan);
    forged.resolution.outcomes.criticalFailure.effects.find(effect => effect.gate).gate.sourceText = 'Whenever it likes, it is Blinded.';
    assert.equal(inspectSavePlan(forged).supported, false);
    const extra = structuredClone(plan);
    extra.resolution.outcomes.criticalFailure.effects.find(effect => effect.gate).gate.value = 3;
    assert.equal(inspectSavePlan(extra).supported, false);
});

test('A gated sentence with a different shape stays unread', async () => {
    const source = withText(await spell('rank-2/fear-the-sun'), text => text.replace('If the creature is already exposed to bright light, it immediately becomes', 'If you wish, it becomes'));
    const blinded = compile(source).resolution.outcomes.criticalFailure.effects.find(effect => effect.slug === 'blinded');
    assert.notEqual(blinded?.gate?.kind, 'gm-question');
});
