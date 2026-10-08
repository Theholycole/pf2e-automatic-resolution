import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {readBloodMagic} from '../src/compiler/blood-magic.js';

// Spell features batch 2 (2026-10-05): every bloodline's blood magic text (PF2e's, exported from the system) read into the caster's options.
const rows = JSON.parse(readFileSync(new URL('../.cache/pf2e-spell-features/blood-magic-texts.json', import.meta.url), 'utf8'));
const read = slug => { const row = rows.find(entry => entry.option === slug); return readBloodMagic(row.text, row.link); };

test('every bloodline read', () => {
    assert.equal(rows.length, 18);
    for (const row of rows) assert.ok(readBloodMagic(row.text, row.link), row.option);
});

test('self, target, damage, choice and spite options', () => {
    assert.deepEqual(read('angelic').options.map(option => option.who), ['self', 'target']);
    assert.deepEqual(read('aberrant').options.map(option => option.who).sort(), ['self', 'target']);
    assert.deepEqual(read('undead').options.find(option => option.damage).damage, {type: 'void'});
    assert.deepEqual(read('psychopomp').options.find(option => option.damage).damage, {alive: 'void', undead: 'vitality'});
    assert.deepEqual(read('elemental').options.find(option => option.damage).damage, {flag: 'elementalBloodline.damageType'});
    assert.deepEqual(read('imperial').options.map(option => option.selection.value), ['ac', 'saving-throw']);
    assert.deepEqual(read('shadow').options.map(option => [option.who, option.selection.value]), [['self', 'stealth'], ['target', 'perception']]);
    assert.deepEqual(read('phoenix').options.map(option => option.who), ['self', 'target', 'target']);
    assert.ok(read('harrow').options[0].concealed);
    assert.deepEqual(read('hag').options[0].spite, {perRank: 4, type: 'mental', statistic: 'will'});
});
