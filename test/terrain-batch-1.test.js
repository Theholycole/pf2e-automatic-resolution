import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, isExecutableLingeringPlan, lingeringExposurePlan} from '../scripts/basic-save-core.js';

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

test('Cave Fangs: damage on casting, difficult terrain for the duration, Dismiss', async () => {
    const plan = compileAbility(await spell('rank-3/cave-fangs'));
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(inspectSavePlan(lingeringExposurePlan(plan)).blockers));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.terrain, lingering.dismissible, lingering.durationSeconds],
        [[], true, {difficulty: 2, movement: ['walk'], hazardous: false}, true, 60]);
    // Without the terrain sentence the "turn to dust" narration has nothing to end, and it's an ordinary save.
    const plain = await spell('rank-3/cave-fangs');
    plain.system.description.value = plain.system.description.value.replace(/Densely packed with protrusions, the area becomes difficult terrain for the duration\./, '');
    assert.equal(compileAbility(plain).resolution.lingering, undefined);
});

test('PF2e data over mismatched text (user decision): the Effect is applied with a data note', async () => {
    const effects = await catalog();
    const reinforce = compileAbility(await spell('cantrip/reinforce-eidolon'), {nativeEffectCatalog: effects});
    assert.equal(reinforce.automation.level, 'automatic');
    assert.equal(reinforce.resolution.ruleOverrides[0].patch.value, 'max(1,floor(@item.level/2))');
    const ghostly = compileAbility(await spell('cantrip/ghostly-shift'), {nativeEffectCatalog: effects});
    assert.equal(ghostly.automation.level, 'automatic');
    assert.equal(ghostly.nativeEffects.onUse[0].recipient.evidence, 'pf2e-target-over-text');
    // Its data rank is 3, where the Effect's resistance is the stated 2: only the recipient differs.
    assert.deepEqual(ghostly.resolution.dataNotes.map(note => /PF2e's Target is 1 creature/.test(note)), [true]);
    const song = compileAbility(await spell('cantrip/song-of-strength'), {nativeEffectCatalog: effects});
    assert.equal(song.automation.level, 'automatic');
    assert.match(song.resolution.dataNotes[0], /Disarm, Reposition, Shove, Trip/);
    // Action links outside a "+N bonus … such as …" sentence still block (Honeyed Words, Bullhorn). (Illusory Disguise's exact Impersonate
    // sentence, with PF2e's two Impersonate modifiers, is read since batch 138.)
    for (const path of ['rank-4/honeyed-words', 'cantrip/bullhorn']) {
        const plan = compileAbility(await spell(path), {nativeEffectCatalog: effects});
        assert.notEqual(plan.automation.level, 'automatic', path);
    }
});
