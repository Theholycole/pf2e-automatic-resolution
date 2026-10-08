import assert from 'node:assert/strict';
import test from 'node:test';

import {TRADITION_ESSENCES} from '../scripts/essence-runtime.js';

// Third-party features batch 28 (2026-10-07): essence casting E2 — Weave Conduit's essences by tradition ("Arcane essence is material and mental, divine essence is spiritual
// and vital, occult essence is spiritual and mental, and primal essence is material and vital"). (The leak, the conduit and the reservoir are live.)
test('Weave Conduit: the two essences of each tradition', () => {
    assert.deepEqual(TRADITION_ESSENCES, {arcane: ['matter', 'mind'], divine: ['spirit', 'life'], occult: ['spirit', 'mind'], primal: ['matter', 'life']});
});
