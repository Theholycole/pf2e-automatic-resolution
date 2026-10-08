import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 53 (2026-10-07): Lucky Decision (Magic+) — the d20 kept until the next daily preparations; Your Good Luck (the caster's next roll is the kept
// result, fortune) and Their Bad Luck (the enemy's Will save: –2; the kept result and –2; –4), either ending the spell.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Lucky Decision: the kept d20 and its two reactions', () => {
    const plan = compile(spell('Lucky Decision'));
    assert.equal(plan.resolution.kind, 'fate-roll');
    const data = plan.resolution.fateRoll;
    assert.deepEqual([data.good.name, data.bad.name, data.bad.statistic, data.selectors], ['Your Good Luck', 'Their Bad Luck', 'will', ['attack-roll', 'saving-throw', 'skill-check']]);
    assert.deepEqual(data.bad.rows, {criticalSuccess: null, success: {penalty: 2, substitute: false}, failure: {penalty: 2, substitute: true}, criticalFailure: {penalty: 4, substitute: true}});
});
