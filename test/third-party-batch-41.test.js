import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {executableCasterChoice, inspectSavePlan} from '../scripts/basic-save-core.js';

// Third-party batch 41 (2026-10-06): Shadow Wield (Magic+: each variant — melee 1d8, ranged 1d6 — a spell attack repeated on Sustain; the caster's type among
// bludgeoning, piercing and slashing, void the GM's "more detrimental").
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Shadow Wield: the melee and ranged variants\' attacks, their dice heightened every 2 ranks, the types', () => {
    const base = spell('Shadow Wield');
    const variant = id => { const copy = structuredClone(base); Object.assign(copy.system, structuredClone(copy.system.overlays[id].system)); delete copy.system.overlays; return compile(copy); };
    for (const [id, formula] of [['y1oKRHfBpBdNB9uE', '(1+floor((@item.rank - 1)/2)*1)d8[untyped]'], ['oCKlpSrRFho1WIJu', '(1+floor((@item.rank - 1)/2)*1)d6[untyped]']]) {
        const plan = variant(id);
        assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
        assert.equal(plan.resolution.check.statistic, 'spell-attack');
        assert.equal(plan.resolution.sharedDamage.formula, formula);
        assert.deepEqual(plan.resolution.casterChoice.values, ['bludgeoning', 'piercing', 'slashing', 'void']);
        assert.ok(executableCasterChoice(plan));
    }
});
