import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 57 (2026-10-07): Dream Logic (Oracles+) — each creature in the 30-foot aura saves (or takes a failure); 1d4 on the table (twice on a critical failure,
// the caster picking): Object Fallacy (+1 to Make a Request and Demoralize), Static Time (timed Effects 1d4 rounds longer), Untethered (the module's fly Speed Effect,
// checked), Warped Energy (each energy type's replacement rolled).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const effect = id => { const found = items.find(item => item._id === id); return {id, name: found.name, mechanics: {rules: found.system.rules, duration: found.system.duration}}; };
const compile = (source, nativeEffectCatalog) => compileAbility(source, {nativeEffectCatalog, referencedSpells: new Map()});

test('Dream Logic: the save and the table', () => {
    const plan = compile(spell('Dream Logic'), new Map([['oDiqzXcbYLuT1bN7', effect('oDiqzXcbYLuT1bN7')]]));
    assert.equal(plan.resolution.kind, 'dream-table');
    const data = plan.resolution.dreamTable;
    assert.deepEqual([data.statistic, data.radius, data.die, data.critical, data.willing], ['will', 30, 4, 'twice-caster-picks', true]);
    assert.deepEqual(data.entries.map(entry => [entry.roll, entry.kind]), [[1, 'social'], [2, 'extend'], [3, 'fly'], [4, 'warp']]);
    assert.equal(data.entries[0].bonus, 1);
    assert.equal(data.entries[1].die, 4);
    assert.deepEqual(data.entries[3].types, ['acid', 'cold', 'electricity', 'fire', 'sonic']);
    assert.match(data.entries[0].note, /^Until the start of its next turn, it can speak/);
    assert.notEqual(compile(spell('Dream Logic'), new Map()).resolution.kind, 'dream-table');
});
