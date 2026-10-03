import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}, ...(e.system?.badge ? {badge: e.system.badge} : {})}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}
const effects = await catalog();
const compile = source => compileAbility(source, {nativeEffectCatalog: effects});
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

const supported = plan => inspectSavePlan(plan).supported;


// Rank 4, batch 23 (2026-10-02): Bind Heroic Spirit (rank 3: PF2e's Effect on the caster; the target thrall is removed — a GM note) and Fortissimo
// Composition (a Performance check boosting the next named composition: PF2e's Effect with the bonus selected on its recipients; a failure
// refunds the Focus Point).

test('Bind Heroic Spirit: PF2e\'s Effect on the caster, the thrall a note', async () => {
    const plan = compile(await spell('rank-3/bind-heroic-spirit'));
    assert.equal(plan.resolution.kind, 'effect');
    assert.equal(plan.automation.level, 'automatic');
    assert.equal(plan.nativeEffects.onUse[0].recipient.actor, 'source');
    assert.match(plan.nativeEffects.onUse[0].recipient.dataNote, /Remove the target thrall/);
    // Another bonus (not PF2e's attack-and-save one) isn't read.
    const other = compile(withText(await spell('rank-3/bind-heroic-spirit'), html => html.replace('attack rolls and saving throws', 'damage rolls')));
    assert.notEqual(other.automation.level, 'automatic');
});

test('Fortissimo Composition: the check, PF2e\'s Effect for the next composition, the refund', async () => {
    const plan = compile(await spell('rank-4/fortissimo-composition'));
    assert.equal(plan.resolution.kind, 'spellshape-effect');
    const data = plan.resolution.spellshapeEffect;
    assert.deepEqual(data.next.spells, ['Courageous Anthem', 'Rallying Anthem', 'Song of Strength']);
    assert.deepEqual(data.bonuses, {criticalSuccess: 3, success: 2});
    assert.deepEqual(data.refundOn, ['failure']);
    assert.equal(data.effect.flag, 'fortissimoBonus');
    assert.equal(data.dc, 'highest-target-will');
    // A row PF2e's Effect doesn't offer isn't read.
    const other = compile(withText(await spell('rank-4/fortissimo-composition'), html => html.replace('increases to +3', 'increases to +4')));
    assert.notEqual(other.resolution.kind, 'spellshape-effect');
});
