import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 49 (2026-10-07): Instant Surgery (Wizards+) — the spell attack against AC (+2 circumstance with View Internal Anatomy on the creature); a critical
// hit's two attributes each boosted or depleted, a hit's one of each; ±1 status to the attribute's rolls (±2 from 8th) for the minute.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Instant Surgery: the attack and the picks', () => {
    const plan = compile(spell('Instant Surgery'));
    assert.equal(plan.resolution.kind, 'attribute-surgery');
    const data = plan.resolution.attributeSurgery;
    assert.deepEqual([data.anatomy, data.value, data.heightened, data.seconds], [{name: 'view internal anatomy', bonus: 2}, 1, {rank: 8, add: 1}, 60]);
    assert.deepEqual(data.picks, {criticalSuccess: {count: 2, mixed: false}, success: {count: 2, mixed: true}});
    assert.deepEqual(data.attributes, ['str', 'dex', 'con', 'int', 'wis', 'cha']);
    assert.match(data.notes[0], /Aid you using Medicine/);
});
