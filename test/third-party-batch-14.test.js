import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 14 (2026-10-06): effect-note proofs — Liberator's Ferocity (resistance and damage bonus, twice the rank, for 1 round), Weapon Trance (Team+)
// (the proficiency equivalences, the cursebound bonus), Volley My Ally (the heightened Strike range).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const catalog = new Map(items.filter(item => item.type === 'effect').flatMap(effect => {
    const profile = {id: effect._id, name: effect.name, type: 'effect', automation: {ruleKeys: [], requiresConfiguration: true, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules ?? [], duration: effect.system.duration ?? null, start: null}};
    return [[effect.name, profile], [effect._id, profile]];
}));
const compile = name => compileAbility(spell(name), {nativeEffectCatalog: catalog, referencedSpells: new Map()});

test("Liberator's Ferocity: the caster's resistance (all-damage) and damage bonus, twice the rank, for 1 round", () => {
    const note = compile("Liberator's Ferocity").resolution.effectNote;
    assert.equal(note.recipient, 'source');
    assert.deepEqual(note.proof.ruleOverrides, [{index: 0, key: 'Resistance', patch: {type: 'all-damage'}}]);
    assert.deepEqual(note.proof.durationOverride, {value: 1, unit: 'rounds', expiry: 'turn-start'});
    assert.equal(note.duration.value, 1);
});

test('Weapon Trance (Team+): every rule proved (the weapon, the proficiencies, the cursebound bonus)', () => {
    const plan = compile('Weapon Trance (Team+)');
    assert.equal(plan.automation.level, 'automatic');
    assert.equal(plan.resolution.effectNote.proof.claims.filter(claim => claim.rules?.length).length, 2);
    assert.match(plan.resolution.effectNote.proof.notes.join(' '), /second weapon/);
});

test('Volley My Ally: the Strike range from rank 5, 15 feet a step', () => {
    const plan = compile('Volley My Ally');
    assert.equal(plan.automation.level, 'automatic');
    assert.deepEqual(plan.resolution.effectNote.proof.claims[0].step, {amount: 15, interval: 2, baseRank: 3});
});
