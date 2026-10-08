import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 45 (2026-10-06): Hyper-Arcane Pressure Point Strike (Magus+: the struck creature marked; the activation's Fortitude save the card's option — the
// caster's unarmed Strike damage by the row, Enfeebled 1 (2 on a critical failure) for a round, the flat check a note; the spell then ends).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Hyper-Arcane Pressure Point Strike: the mark; the activation save with the Strike damage placeholder; the rows', () => {
    const plan = compile(spell('Hyper-Arcane Pressure Point Strike'));
    assert.equal(plan.resolution.kind, 'stated-effect');
    const data = plan.resolution.statedEffect;
    assert.deepEqual([data.recipient, data.seconds, data.strikeDamage], ['targets', 60, true]);
    const [activate] = data.gmOptions;
    assert.deepEqual([activate.kind, activate.endsCast, activate.plan.resolution.check.statistic], ['save', true, 'fortitude']);
    assert.equal(activate.plan.resolution.sharedDamage.formula, '{strikeDamage}');
    assert.deepEqual([activate.plan.resolution.sharedDamage.components[0].formula, activate.plan.resolution.sharedDamage.components[0].type], ['{strikeDice}', '{strikeType}']);
    const rows = activate.plan.resolution.outcomes;
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => [rows[degree].damage.multiplier, rows[degree].effects.map(effect => `${effect.slug} ${effect.value}`).join()]),
        [[0.5, 'enfeebled 1'], [1, 'enfeebled 1'], [2, 'enfeebled 2']]);
    assert.match(rows.failure.noteEffects[0].text, /flat check/);
});
