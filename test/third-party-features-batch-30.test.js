import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {essenceGrantsImmunity} from '../scripts/essence-runtime.js';

// Third-party features batch 30 (2026-10-07): essence casting E3b — which essence spells "counteract effects, reduce or remove conditions or afflictions, and so on" (their 1-day
// temporary immunity). (Unstable Draw, Terminus of Life and Essence Summoner are live.)
const spells = fs.readdirSync(new URL('../.cache/pf2e-test-fixtures/spells/spells/', import.meta.url), {recursive: true}).filter(file => file.endsWith('.json'))
    .map(file => JSON.parse(fs.readFileSync(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${file}`, import.meta.url))));
const spell = name => spells.find(entry => entry.name === name);

test('counteracting and removal spells grant the immunity; others do not', () => {
    for (const name of ['Cleanse Affliction', 'Clear Mind', 'Sound Body']) assert.equal(essenceGrantsImmunity(spell(name)), true, name);
    for (const name of ['Breathe Fire', 'Heal', 'Mystic Armor']) assert.equal(essenceGrantsImmunity(spell(name)), false, name);
});
