import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 18 (2026-10-06): effect-note proofs — Wishful Thinking (the ally's chosen effect; a second from 9th; the fly Speed and +1 from 6th), Life of the
// Party (the treat's temporary Hit Points by rank and damage bonus).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const catalog = new Map(items.filter(item => item.type === 'effect').flatMap(effect => {
    const profile = {id: effect._id, name: effect.name, type: 'effect', automation: {ruleKeys: [], requiresConfiguration: true, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules ?? [], duration: effect.system.duration ?? null, start: null}};
    return [[effect.name, profile], [effect._id, profile]];
}));
const compile = name => compileAbility(spell(name), {nativeEffectCatalog: catalog, referencedSpells: new Map()});

test('Wishful Thinking: every rule of the module\'s Effect claimed by the text; the 6th and 9th entries its choices\' ranks', () => {
    const plan = compile('Wishful Thinking');
    assert.equal(plan.automation.level, 'automatic');
    assert.equal(plan.resolution.effectNote.recipient, 'target');
    assert.equal(plan.resolution.effectNote.proof.claims.flatMap(claim => claim.rules ?? []).length, 9);
});

test('Life of the Party: 5 temporary Hit Points (+2 a rank) and +2 damage for the eater', () => {
    const plan = compile('Life of the Party');
    assert.equal(plan.automation.level, 'automatic');
    assert.deepEqual(plan.resolution.effectNote.proof.claims.find(claim => claim.step).step, {amount: 2, interval: 1, baseRank: 1});
});
