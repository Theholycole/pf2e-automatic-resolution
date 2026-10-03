import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility, adaptSpellSource} from '../src/compiler/index.js';
import {compileDirectHealing} from '../src/compiler/healing-compiler.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
const variant = (source, id) => {
    const item = structuredClone(source);
    const overlay = source.system.overlays[id].system;
    for (const [key, value] of Object.entries(overlay)) {
        item.system[key] = key === 'damage'
            ? Object.fromEntries(Object.entries(item.system.damage).map(([k, v]) => [k, {...v, ...(value[k] ?? {})}]))
            : value && typeof value === 'object' && !Array.isArray(value) ? {...item.system[key], ...value} : value;
    }
    delete item.system.overlays;
    return item;
};

test('healing alone: Heal Companion and Heal Animal, by action count', async () => {
    for (const [path, base, two] of [['rank-1/heal-companion.json', '1d10', '1d10+8'], ['rank-1/heal-animal.json', '1d8', '1d8+8']]) {
        const source = await fixture(path).catch(() => null);
        if (!source) continue;
        for (const [id, overlay] of Object.entries(source.system.overlays)) {
            const plan = compileAbility(variant(source, id));
            assert.equal(plan.resolution.kind, 'healing', path);
            assert.equal(plan.automation.level, 'automatic', `${path}: ${JSON.stringify(plan.automation.pendingCapabilities)}`);
            assert.equal(plan.resolution.healing.formula, overlay.system.time.value === '2' ? two : base, path);
        }
        // A 2-action variant whose healing doesn't include the additional 8 is refused.
        const twoId = Object.keys(source.system.overlays).find(id => source.system.overlays[id].system.time?.value === '2');
        const wrong = variant(source, twoId); wrong.system.damage['0'].formula = base;
        assert.equal(compileAbility(wrong).resolution.kind, 'unsupported', path);
    }
    const animal = compileAbility(await fixture('rank-1/heal-animal.json'));
    assert.deepEqual(animal.targeting.actorConstraints.predicates.map(p => p.kind), ['trait', 'living-creature']);
    // The base item ("1 or 2" actions) isn't resolved: a variant must be chosen.
    assert.equal(animal.resolution.kind, 'unsupported');
});

test('healing with a linked Effect (Soothe)', async () => {
    const soothe = await fixture('rank-1/soothe.json');
    const healing = compileDirectHealing(adaptSpellSource(soothe));
    assert.equal(healing.healing.formula, '1d10+4');
    // The bonus clause is left for the Effect's completeness check.
    assert.deepEqual(healing.remainingText, ['The target gains a +2 status bonus to saves against mental effects for the duration.']);
});

test('healing sentences with other rules or mismatched dice are refused', async () => {
    const companion = await fixture('rank-1/heal-companion.json');
    const reworded = structuredClone(companion);
    reworded.system.description.value = companion.system.description.value.replace('You restore 1d10 Hit Points', 'You restore 2d10 Hit Points');
    assert.equal(compileDirectHealing(adaptSpellSource(reworded)), null, 'dice must be the healing entry');
    const extra = structuredClone(companion);
    extra.system.description.value = companion.system.description.value.replace("You heal your animal companion's wounds.", "You heal your animal companion's wounds. It also gains a +1 status bonus to AC until your next turn.");
    const plan = compileAbility(extra);
    assert.notEqual(plan.resolution.kind === 'healing' && plan.automation.level === 'automatic', true, 'an extra rule with no Effect blocks it');
});
