import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

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



// Rank 2, batch 52 (2026-10-01): The Everfull Moon.

test('The Everfull Moon: the battle form generated from the text, with brackets, Fuel and the mark', async () => {
    const plan = compile(await spell('rank-2/the-everfull-moon'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level], ['battle-form', 'automatic']);
    const [form, saves, skills] = plan.resolution.battleForm.rules;
    assert.deepEqual([form.key, form.overrides.armorClass.modifier, form.overrides.tempHP, form.overrides.size, form.overrides.speeds], ['BattleForm', '18 + @actor.level', 20, 'lg', {land: 40}]);
    assert.deepEqual(form.overrides.strikes.jaws.damage, {damageType: 'piercing', dice: 2, die: 'd8'});
    assert.deepEqual(form.brackets.map(bracket => [bracket.start, bracket.value.tempHP, bracket.value.strikes.claw.modifier, bracket.value.armorClass.modifier]),
        [[4, 40, 16, '20 + @actor.level'], [6, 60, 22, '22 + @actor.level'], [8, 80, 28, '24 + @actor.level'], [10, 100, 34, '26 + @actor.level']]);
    assert.deepEqual([saves.value, skills.selector], [1, ['acrobatics', 'athletics']]);
    assert.equal(plan.resolution.battleForm.mark.weakness, 'silver');
    assert.notEqual(compile(withText(await spell('rank-2/the-everfull-moon'), html => html.replace('20 temporary Hit Points.', '20 temporary Hit Points and fast healing 5.'))).resolution.kind, 'battle-form');
});
