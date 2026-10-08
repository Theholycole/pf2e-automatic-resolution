import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {seedsAt} from '../src/compiler/divine-seeds.js';

// Third-party batch 65 (2026-10-07): Seeds of Divinity (Oracles+) — 4 seeds sprouting into bush tokens (10 × rank HP, AC 10 + 2 × rank); a bush a round old grown hazardous
// (2 × rank piercing and poison to each creature entering its square) or bountiful (a fruit: 2 × rank + 2 temporary HP and the maximum cursebound as a status damage bonus).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Seeds of Divinity: the seeds, the bushes and their growth', () => {
    const plan = compile(spell('Seeds of Divinity'));
    assert.equal(plan.resolution.kind, 'divine-seeds');
    const data = plan.resolution.divineSeeds;
    assert.deepEqual([data.count, data.throwFeet, data.growAfterSeconds, data.hazard.types, data.seconds], [4, 10, 6, ['piercing', 'poison'], 60]);
    assert.deepEqual([1, 3, 5].map(rank => seedsAt(data, rank)), [{hp: 10, ac: 12, damage: 2, tempHP: 4}, {hp: 30, ac: 16, damage: 6, tempHP: 8}, {hp: 50, ac: 20, damage: 10, tempHP: 12}]);
});
