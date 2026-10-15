import assert from 'node:assert/strict';
import test from 'node:test';

import {spellDurationSeconds} from '../scripts/item-cast-runtime.js';

// api.castFromItem (2026-10-15, for the item module): the temporary entry and spell stay for the spell's duration — at least 10 minutes, at most an hour.
test("a spell's stated duration in seconds", () => {
    const at = value => spellDurationSeconds({system: {duration: {value}}});
    assert.deepEqual(['1 minute', '10 minutes', '1 hour', 'until the end of your next turn', '', 'sustained up to 1 minute', '1 day'].map(at),
        [60, 600, 3600, 12, 0, 60, 86400]);
});
