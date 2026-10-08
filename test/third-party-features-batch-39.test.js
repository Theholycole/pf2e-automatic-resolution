import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readHexFamiliar} from '../scripts/plus-hex-familiar-runtime.js';

// Third-party features batch 39 (2026-10-07): the witch's hex familiar abilities (applied live).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const familiars = items.filter(entry => entry.name.startsWith('Familiar of') && entry._pack.includes('witches'));

test('every hex familiar ability is read; the automated ones by mode', () => {
    assert.equal(familiars.length, 17);
    const modes = Object.fromEntries(familiars.map(entry => [entry.name, readHexFamiliar(structuredClone(entry))?.mode]));
    assert.ok(Object.values(modes).every(Boolean));
    assert.deepEqual([modes['Familiar of Churning Saltwater'], modes['Familiar of Faraway Worlds'], modes['Familiar of Murky Worlds'], modes['Familiar of Illogical Forms'], modes['Familiar of Keen Senses+'],
        modes['Familiar of Sunlit Dawn'], modes['Familiar of Reprising Melody'], modes['Familiar of Stumbling Steps']],
        ['aura', 'aura', 'target', 'familiar-and-target', 'familiar', 'target-condition', 'target-choice', 'target-push']);
    assert.match(readHexFamiliar(structuredClone(familiars.find(entry => entry.name === 'Familiar of Conflicting Authority'))).text, /DC 15 flat check/);
});
