import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility, adaptSpellSource} from '../src/compiler/index.js';
import {expandCompactDegreeTable} from '../src/compiler/compact-degree-table.js';
import {inspectSavePlan, isExecutableLingeringPlan} from '../scripts/basic-save-core.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
const C = id => `Compendium.pf2e.conditionitems.Item.${id}`;
const FRIGHTENED = C('TBSHQspnbcqxsmjL'), PRONE = C('j91X7x0XSomq8d60');
function detached(original, description) {
    const item = structuredClone(original);
    item._id = 'custom-compact0001';
    if (item._stats) delete item._stats.compendiumSource;
    item.name = 'Custom Compact Spell';
    item.system.slug = 'custom-compact-spell';
    item.system.description.value = description;
    return item;
}
const effects = (plan, degree) => plan.resolution.outcomes[degree].effects.map(e => [e.slug, e.value ?? null, e.duration?.value ?? null]);

test('a one-sentence degree table becomes the standard table', async () => {
    const base = await fixture('cantrip/information-overload.json');
    const forms = {
        'must succeed … or become … (or … on a critical failure)': `<p>Dread fills the target. The target must succeed at a Will save or become @UUID[${FRIGHTENED}]{Frightened 1} (or @UUID[${FRIGHTENED}]{Frightened 2} on a critical failure).</p>`,
        'becomes … if it fails': `<p>Dread fills the target. The target becomes @UUID[${FRIGHTENED}]{Frightened 1} if it fails a Will save (or @UUID[${FRIGHTENED}]{Frightened 2} on a critical failure).</p>`,
        ', causing it to become … if it fails': `<p>Dread fills the target, causing it to become @UUID[${FRIGHTENED}]{Frightened 1} if it fails a Will save (or @UUID[${FRIGHTENED}]{Frightened 2} on a critical failure).</p>`
    };
    for (const [name, html] of Object.entries(forms)) {
        const item = detached(base, html);
        item.system.duration = {sustained: false, value: ''};
        const plan = compileAbility(item);
        assert.ok(plan.compilerEvidence.compactDegreeTable, name);
        assert.deepEqual([effects(plan, 'criticalSuccess'), effects(plan, 'success'), effects(plan, 'failure'), effects(plan, 'criticalFailure')],
            [[], [], [['frightened', 1, null]], [['frightened', 2, null]]], name);
        assert.equal(inspectSavePlan(plan).supported, true, `${name}: ${JSON.stringify(inspectSavePlan(plan).blockers)}`);
    }
    // "or fall Prone", with no critical-failure outcome: the failure outcome applies on both.
    const prone = detached(base, `<p>The ground heaves. Each creature in the area must succeed at a Will save or fall @UUID[${PRONE}]{Prone}.</p>`);
    prone.system.duration = {sustained: false, value: ''};
    const plan = compileAbility(prone);
    assert.deepEqual([effects(plan, 'failure'), effects(plan, 'criticalFailure')], [[['prone', null, null]], [['prone', null, null]]]);
});

test('compact sentences with conditions, back-references or trailing rules are not expanded', async () => {
    // "On a critical hit, … the target you hit must succeed …" depends on an attack roll.
    const earth = compileAbility(await fixture('rank-2/exploding-earth.json'));
    assert.equal(earth.compilerEvidence.compactDegreeTable, undefined);
    // "Each of them must succeed …" refers back to another sentence: only Disruptive Transfer's creatures adjacent to the caster's starting
    // space (rank 3 batch 30), and not after any other sentence.
    const transfer = await fixture('rank-3/disruptive-transfer.json');
    assert.ok(compileAbility(transfer).compilerEvidence.compactDegreeTable);
    const other = structuredClone(transfer); other.system.description.value = other.system.description.value.replace('Creatures adjacent to your initial location', 'Creatures you can see');
    assert.equal(compileAbility(other).compilerEvidence.compactDegreeTable, undefined);
    const base = await fixture('cantrip/information-overload.json');
    const adapted = html => adaptSpellSource(detached(base, html));
    const sentence = `The target must succeed at a Will save or become @UUID[${FRIGHTENED}]{Frightened 1}.`;
    assert.equal(expandCompactDegreeTable(adapted(`<p>${sentence} The frightened condition can't be reduced while the spell lasts.</p>`)), null, 'a rule after it');
    assert.equal(expandCompactDegreeTable(adapted(`<p>${sentence} ${sentence}</p>`)), null, 'two compact sentences');
    assert.equal(expandCompactDegreeTable(adapted(`<p>The target must succeed at a Fortitude save or become @UUID[${FRIGHTENED}]{Frightened 1}.</p>`)), null, 'the save named must be the item save');
    // Information Overload (sustained) is expanded, and its conditions last while it's sustained.
    const overload = compileAbility(base);
    assert.ok(overload.compilerEvidence.compactDegreeTable);
    assert.equal(inspectSavePlan(overload).supported, true, JSON.stringify(inspectSavePlan(overload).blockers));
});

test('a compact table can linger (The Queen\'s Rainbow)', async () => {
    const plan = compileAbility(await fixture('rank-2/the-queens-rainbow.json'));
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(plan.automation.pendingCapabilities));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.area, lingering.centre], [['enter', 'turn-start'], false, {type: 'line', value: 60}, 'placed']);
    assert.deepEqual([effects(plan, 'failure'), effects(plan, 'criticalFailure')], [[['dazzled', null, 1]], [['blinded', null, 1]]]);
});
