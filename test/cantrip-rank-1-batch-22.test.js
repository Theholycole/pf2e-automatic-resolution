import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {SUPPORTED_RESOLUTION_KINDS} from '../scripts/runtime-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('Stabilize: loses Dying, stays Unconscious at 0 Hit Points', async () => {
    assert.ok(SUPPORTED_RESOLUTION_KINDS.includes('stabilize'));
    const plan = compileAbility(await spell('cantrip/stabilize'));
    assert.equal(plan.resolution.kind, 'stabilize');
    // Another rule after it, or another target, isn't read.
    const source = await spell('cantrip/stabilize');
    assert.notEqual(compileAbility(withText(source, text => text.replace('0 Hit Points.', '0 Hit Points. It regains 1d8 Hit Points.'))).resolution.kind, 'stabilize');
    const other = structuredClone(source); other.system.target.value = '1 creature';
    assert.notEqual(compileAbility(other).resolution.kind, 'stabilize');
});

test('notes: being counteracted by another effect, an item\'s Hit Points and Broken state', async () => {
    assert.equal(compileAbility(await spell('rank-1/cinder-scribe')).resolution.kind, 'spell-note');
    // (Mending restores the item's Hit Points since batch 168.)
    assert.equal(compileAbility(await spell('rank-1/mending')).resolution.kind, 'item-repair');
    // A counteract check the spell makes stays mechanical.
    const scribe = await spell('rank-1/cinder-scribe');
    assert.notEqual(compileAbility(withText(scribe, text => text.replace('</p>', ' You can attempt to counteract a magical fire.</p>'))).resolution.kind, 'spell-note');
    // Restoring a creature's Hit Points isn't the item's.
    const mending = structuredClone(await spell('rank-1/mending')); mending.system.target.value = '1 creature';
    assert.ok(!['spell-note', 'item-repair'].includes(compileAbility(mending).resolution.kind));
});
