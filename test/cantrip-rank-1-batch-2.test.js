import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {isExecutableLingeringPlan, inspectSavePlan, lingeringExposurePlan} from '../scripts/basic-save-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}

test('Sting of the Sea: the target saves at the start of each of its turns while the spell is sustained', async () => {
    const plan = compileAbility(await spell('cantrip/sting-of-the-sea'), {nativeEffectCatalog: await catalog()});
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(inspectSavePlan(lingeringExposurePlan(plan)).blockers));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.centre, lingering.events, lingering.initial, lingering.sustained], ['targets', ['turn-start'], false, true]);
    const success = plan.resolution.outcomes.success.nativeEffects[0].outcomeRule;
    assert.deepEqual([success.kind, success.durationAnchor, success.durationOffset], ['row-modifier-effect', 'target-turn', 0]);
    // (User decision: the text's untyped penalty.)
    assert.deepEqual(success.ruleOverrides, [{index: 0, key: 'FlatModifier', patch: {type: 'untyped'}}]);
    // Another save statistic than the item's isn't the trigger.
    const other = await spell('cantrip/sting-of-the-sea');
    other.system.description.value = other.system.description.value.replace('attempt a Fortitude save at the beginning', 'attempt a Will save at the beginning');
    assert.equal(compileAbility(other, {nativeEffectCatalog: await catalog()}).resolution.lingering, undefined);
});

test('weapon spells: the Effect goes on the wielder, and its sentences are the Effect\'s rules', async () => {
    const effects = await catalog();
    const level = async path => compileAbility(await spell(path), {nativeEffectCatalog: effects});
    const runic = await level('rank-1/runic-weapon');
    assert.deepEqual([runic.automation.level, runic.nativeEffects.onUse[0].recipient.evidence], ['prompted', 'weapon-wielder']);
    const shillelagh = await level('rank-1/shillelagh');
    assert.deepEqual([shillelagh.automation.level, shillelagh.nativeEffects.onUse[0].recipient.actor], ['prompted', 'source']);
    const serrate = await level('rank-1/serrate');
    assert.equal(serrate.automation.level, 'prompted');
    // (User decision: the text's "until the start of your next turn".)
    assert.deepEqual(serrate.resolution.durationOverride, {value: 1, unit: 'rounds', expiry: 'turn-start'});
    assert.equal((await level('rank-1/conductive-weapon')).automation.level, 'prompted');
    // A stated rune or die the Effect doesn't give is refused.
    const wrong = await spell('rank-1/runic-weapon');
    wrong.system.description.value = wrong.system.description.value.replace('<em>+1 striking weapon</em>, gaining a +1', '<em>+2 striking weapon</em>, gaining a +2');
    assert.match(wrong.system.description.value, /\+2 striking weapon/);
    assert.notEqual(compileAbility(wrong, {nativeEffectCatalog: effects}).automation.level, 'prompted');
    const dice = await spell('rank-1/serrate');
    dice.system.description.value = dice.system.description.value.replace('1d4 slashing', '1d6 slashing');
    assert.notEqual(compileAbility(dice, {nativeEffectCatalog: effects}).automation.level, 'prompted');
});
