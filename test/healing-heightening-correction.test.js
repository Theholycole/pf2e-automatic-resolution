import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {correctHealingFormula} from '../src/compiler/healing-compiler.js';

const root = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, root), 'utf8'));

// Heightening audit (2026-10-02, tools/audit-heightening-text.mjs): Breath of Life's text heightens by 1d8 per 2 ranks ("Heightened (+2) The
// healing increases by 1d8."), PF2e's item by 1d8 per rank. The text wins: the card rolls PF2e's healing with the text's dice count.

test("Breath of Life: the text's healing step over PF2e's", async () => {
    const source = await spell('rank-5/breath-of-life');
    const plan = compileAbility(source);
    assert.equal(plan.automation.level, 'automatic');
    const correction = plan.resolution.healing.heighteningCorrection;
    assert.deepEqual({...correction, sourceText: undefined}, {faces: 8, baseDice: 5, baseRank: 5, text: {interval: 2, dice: 1}, data: {interval: 1, dice: 1}, sourceText: undefined});
    // PF2e's roll at each rank (one d8 per rank) → the text's (one d8 per 2 ranks).
    assert.equal(correctHealingFormula('{5d8[healing]}', correction, 5), '{5d8[healing]}');
    assert.equal(correctHealingFormula('{6d8[healing]}', correction, 6), '{5d8[healing]}');
    assert.equal(correctHealingFormula('{7d8[healing]}', correction, 7), '{6d8[healing]}');
    assert.equal(correctHealingFormula('(5 + 4)d8[healing]', correction, 9), '7d8[healing]');
    // A roll that isn't PF2e's count for the rank (a changed item, another die) is refused rather than guessed.
    assert.throws(() => correctHealingFormula('{8d8[healing]}', correction, 7), /isn't the 7d8/);
    assert.throws(() => correctHealingFormula('{7d6[healing]}', correction, 7), /isn't the 7d8/);
    // Data that agrees with the text needs no correction.
    const agreeing = structuredClone(source); agreeing.system.heightening.interval = 2;
    assert.equal(compileAbility(agreeing).resolution.healing.heighteningCorrection, undefined);
    // A text die PF2e's entry doesn't roll can't be corrected: the spell is refused.
    const otherDie = structuredClone(source); otherDie.system.description.value = otherDie.system.description.value.replace('increases by 1d8', 'increases by 1d10');
    assert.notEqual(compileAbility(otherDie).resolution.kind, 'healing');
});

test('direct healing whose heightening agrees with the text carries no correction', async () => {
    for (const path of ['rank-4/rebuke-death']) {
        const source = await spell(path);
        const item = structuredClone(source);
        const overlay = Object.values(source.system.overlays).find(entry => entry.system.time?.value === '1').system;
        Object.assign(item.system, {target: overlay.target, time: overlay.time}); delete item.system.overlays;
        const plan = compileAbility(item);
        assert.equal(plan.resolution.kind, 'healing');
        assert.equal(plan.resolution.healing.heighteningCorrection, undefined);
    }
});
