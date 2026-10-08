import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 51 (2026-10-07): Gruesome Marionettist (Magic+) — the prohibited and directed actions the caster names; the target's Fortitude save sets the share
// of the 5d10 persistent bleed (half and until the caster's next turn, full, double) and the time; the directed action protects it until its next turn.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Gruesome Marionettist: the save sets the share and the time', () => {
    const plan = compile(spell('Gruesome Marionettist'));
    assert.equal(plan.resolution.kind, 'marionette');
    const data = plan.resolution.marionette;
    assert.deepEqual([data.statistic, data.traits, data.dice, data.die, data.type, data.baseRank], ['fortitude', ['attack', 'manipulate', 'move'], 5, 10, 'bleed', 5]);
    assert.deepEqual(data.share, {criticalSuccess: null, success: 0.5, failure: 1, criticalFailure: 2});
    assert.deepEqual(data.ends, {success: 'caster-next-turn-start', failure: 'duration', criticalFailure: 'duration'});
});
