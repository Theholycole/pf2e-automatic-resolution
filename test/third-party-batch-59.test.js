import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 59 (2026-10-07): Shine Spotlight (Wizards+) — the burst's creatures +1 status to Perform and –1 circumstance to Stealth (the text's, not the module
// Effect's status Stealth penalty); non-allied onlookers within 15 feet save or are Fascinated and Off-Guard while fascinated; a performer's Perform against their Will DCs.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Shine Spotlight: the area, the onlookers and the performer', () => {
    const plan = compile(spell('Shine Spotlight'));
    assert.equal(plan.resolution.kind, 'spotlight');
    const data = plan.resolution.spotlight;
    assert.deepEqual([data.radius, data.reach, data.statistic, data.seconds], [5, 15, 'will', 60]);
    assert.deepEqual(data.rules.map(rule => [rule.selector, rule.type, rule.value]), [['performance', 'status', 1], ['stealth', 'circumstance', -1]]);
    assert.match(data.fascinated, /conditionitems\.Item\.AdPVz7rbaVSRxHFg$/);
    assert.match(data.offGuard, /conditionitems\.Item\.AJh5ex99aV6VTggg$/);
});
