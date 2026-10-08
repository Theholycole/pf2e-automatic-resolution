import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 58 (2026-10-07): Honorable Death (Clerics+) — the champion, the Will save; the target's Effect (until the end of its turn, 4 rounds, 1 minute) with the
// end-of-turn control (twice the rank in spirit damage, basic Will, unless it fought; the save that shortens it); the target reduced to 0 Hit Points dies.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Honorable Death: the rows and the damage', () => {
    const plan = compile(spell('Honorable Death'));
    assert.equal(plan.resolution.kind, 'honor-duel');
    const data = plan.resolution.honorDuel;
    assert.deepEqual([data.range, data.statistic, data.damage, data.recovery, data.seconds, data.deathAtZero], [30, 'will', {type: 'spirit', perRank: 2, statistic: 'will'}, 'will', {success: 6, failure: 24, criticalFailure: 60}, true]);
});
