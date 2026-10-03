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
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}

test('"<Skill> checks to <Action>" bonuses the Effect\'s action predicates state', async () => {
    const effects = await catalog();
    const beast = compileAbility(await spell('rank-2/spirit-of-the-beast'), {nativeEffectCatalog: effects});
    assert.equal(beast.automation.level, 'prompted');
    assert.equal(beast.nativeEffects.onUse[0].recipient.actor, 'target');
    const mask = compileAbility(await spell('rank-3/inscrutable-mask'), {nativeEffectCatalog: effects});
    assert.equal(mask.automation.level, 'automatic');
    assert.equal(mask.resolution.dataNotes, undefined, 'an exact list needs no data note');
    // A list with anything else ("and against Perception checks to discern …") stays blocked (Honeyed Words), and so does
    // an action the Effect doesn't name.
    assert.notEqual(compileAbility(await spell('rank-4/honeyed-words'), {nativeEffectCatalog: effects}).automation.level, 'automatic');
    const other = await spell('rank-3/inscrutable-mask');
    other.system.description.value = other.system.description.value.replace('{Demoralize}', '{Coerce}');
    assert.notEqual(compileAbility(other, {nativeEffectCatalog: effects}).automation.level, 'automatic');
    // The dim-light qualifier needs the Effect's lighting predicates.
    const lit = await spell('rank-3/inscrutable-mask');
    lit.system.description.value = lit.system.description.value.replace('in areas of dim light or darkness', 'in bright light');
    assert.notEqual(compileAbility(lit, {nativeEffectCatalog: effects}).automation.level, 'automatic');
});

test('Animal Feature: "You gain a claw attack that deals 1d6 slashing damage and has the agile, finesse, and unarmed traits."', async () => {
    const effects = await catalog();
    const plan = compileAbility(await spell('rank-2/animal-feature'), {nativeEffectCatalog: effects});
    assert.equal(plan.automation.level, 'prompted');
    // A die or trait the Strike rule doesn't have is refused.
    for (const [from, to] of [['1d6 slashing', '1d8 slashing'], ['agile, finesse, and unarmed', 'agile, deadly, and unarmed']]) {
        const changed = await spell('rank-2/animal-feature');
        changed.system.description.value = changed.system.description.value.replace(from, to);
        assert.notEqual(compileAbility(changed, {nativeEffectCatalog: effects}).automation.level, 'prompted', to);
    }
});
