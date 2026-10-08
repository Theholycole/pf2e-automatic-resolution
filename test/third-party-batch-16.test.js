import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

// Third-party batch 16 (2026-10-06, the user's ruling "Yes, same rule"): third-party spells of the 2026-10-04 GM-handled kinds are GM cards, counted resolved;
// the parts that act on creatures are the GM's options.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = name => compileAbility(spell(name), {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('the seven third-party GM-handled spells: GM cards under the 2026-10-06 ruling', () => {
    for (const name of ['If Walls Could Talk', 'Fall to Ruin', 'Raise Mountain', 'Thousand-Year Flood', 'State of the Art', 'Sacrosanct Promise', 'From Thine Sight']) {
        const plan = compile(name);
        assert.equal(plan.resolution.kind, 'spell-note', name);
        assert.equal(plan.resolution.note.gmHandled.ruling, '2026-10-06', name);
    }
});

test("GM options: Raise Mountain's Reflex rows; Thousand-Year Flood's 10d10 basic Reflex, rolled from the text", () => {
    const [mountain] = compile('Raise Mountain').resolution.note.gmHandled.options;
    assert.equal(inspectSavePlan(mountain.plan).supported, true);
    assert.equal(mountain.plan.resolution.outcomes.criticalFailure.effects[0].slug, 'prone');
    const [tossed] = compile('Thousand-Year Flood').resolution.note.gmHandled.options;
    assert.equal(inspectSavePlan(tossed.plan).supported, true);
    assert.equal(tossed.plan.resolution.sharedDamage.formula, '10d10[bludgeoning]');
});
