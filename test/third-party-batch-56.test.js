import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {grappleSizeAt} from '../src/compiler/weapon-grapple.js';

// Third-party batch 56 (2026-10-07): Coiling Grasp (Magus+) — the Grapple with the higher of Athletics and the spell attack against the Fortitude DC: Immobilized on a
// critical success, Grabbed on a success, the target's choice on a critical failure (grab the caster, or Prone); the Sustain's control; Large at 3rd, Huge at 6th.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Coiling Grasp: the rows and the sizes', () => {
    const plan = compile(spell('Coiling Grasp'));
    assert.equal(plan.resolution.kind, 'weapon-grapple');
    const data = plan.resolution.weaponGrapple;
    assert.deepEqual([data.rows.criticalSuccess.slug, data.rows.success.slug, data.defense, data.seconds], ['immobilized', 'grabbed', 'fortitude', 24]);
    assert.match(data.rows.criticalFailure.prone, /j91X7x0XSomq8d60$/);
    assert.deepEqual([1, 2, 3, 6, 9].map(rank => grappleSizeAt(data, rank)), ['med', 'med', 'lg', 'huge', 'grg']);
    assert.ok(data.notes.every(note => !note.includes('@UUID')));
});
