import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

// Third-party batch 17 (2026-10-06): Tidal Grasp — a sustained hex's spell attack against the target's Fortitude DC, again on each Sustain.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));

test('Tidal Grasp: against Fortitude DC; Grabbed until the end of the next turn or an Escape; the critical success\'s damage at the rank; again on each Sustain; immune on a critical failure', () => {
    const plan = compileAbility(spell('Tidal Grasp'), {nativeEffectCatalog: new Map(), referencedSpells: new Map()});
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.resolution.attackDefense.statistic, 'fortitude');
    assert.equal(plan.resolution.sharedDamage.formula, '(2 * @item.rank)[bludgeoning]');
    assert.deepEqual(['criticalSuccess', 'success', 'failure'].map(degree => plan.resolution.outcomes[degree].damage.multiplier), [1, 0, 0]);
    const grabbed = plan.resolution.outcomes.success.effects[0];
    assert.deepEqual([grabbed.slug, grabbed.duration.expiry, grabbed.endsWhen[0].event], ['grabbed', 'turn-end', 'escape']);
    assert.deepEqual([plan.resolution.repeatable.window, plan.resolution.repeatable.attacks], ['sustain', 11]);
    assert.deepEqual(plan.resolution.temporaryImmunity.degrees, ['criticalFailure']);
    assert.equal(plan.targeting.actorConstraints.predicates[0].kind, 'gm-confirmed');
});
