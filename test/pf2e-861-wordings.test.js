import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {compileAbility} from '../src/compiler/index.js';

// PF2e 8.6 rewrote these spells' text (2026-10-16): links to its own new spell Effects, plain damage and conditions for 8.5's inline rolls and links, emphasis,
// a row order, a moved heightened entry. Each compiles from 8.6.1's text to what it compiled to from 8.5's (.cache/pf2e-test-fixtures-861 beside the 8.5 set).
const root = version => fileURLToPath(new URL(`../.cache/${version === '8.5' ? 'pf2e-test-fixtures' : 'pf2e-test-fixtures-861'}/`, import.meta.url));
async function jsonFiles(dir) {
    const out = [];
    for (const entry of await readdir(dir, {withFileTypes: true})) {
        const child = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...await jsonFiles(child)); else if (entry.name.endsWith('.json')) out.push(child);
    }
    return out;
}
const options = {};
async function optionsFor(version) {
    if (options[version]) return options[version];
    const nativeEffectCatalog = new Map();
    for (const file of await jsonFiles(path.join(root(version), 'spell-effects'))) {
        const effect = JSON.parse(await readFile(file, 'utf8')); const rules = effect.system?.rules ?? [];
        nativeEffectCatalog.set(effect.name, {id: effect._id ?? null, name: effect.name, type: effect.type, sourceFile: path.relative(root(version), file),
            automation: {ruleKeys: [...new Set(rules.map(rule => rule.key).filter(Boolean))], requiresConfiguration: rules.some(rule => rule.key === 'ChoiceSet'), removesAfterRoll: rules.some(rule => rule.removeAfterRoll != null)},
            mechanics: {rules, duration: effect.system?.duration ?? null, start: effect.system?.start ?? null}, ...(effect.system?.badge ? {badge: effect.system.badge} : {})});
    }
    const sources = await Promise.all((await jsonFiles(path.join(root(version), 'spells', 'spells'))).map(async file => JSON.parse(await readFile(file, 'utf8'))));
    const referencedSpells = new Map(sources.filter(source => source._id).map(source => [`Compendium.pf2e.spells-srd.Item.${source._id}`, source]));
    return options[version] = {nativeEffectCatalog, referencedSpells};
}
const compile = async (version, relative) => compileAbility(JSON.parse(await readFile(path.join(root(version), 'spells/spells', `${relative}.json`), 'utf8')),
    {sourceFile: `spells/spells/${relative}.json`, ...await optionsFor(version)});
// What the module does with the plan: its route, level and pending parts, and each row's damage, conditions, notes and PF2e Effects.
const meaning = plan => JSON.stringify({
    kind: plan.resolution?.kind, level: plan.automation?.level, pending: [...(plan.automation?.pendingCapabilities ?? [])].sort(),
    rows: Object.fromEntries(Object.entries(plan.resolution?.outcomes ?? {}).map(([degree, outcome]) => [degree, {
        damage: outcome.damage, effects: (outcome.effects ?? []).map(effect => `${effect.slug}${effect.value ?? ''}`),
        notes: (outcome.noteEffects ?? []).map(note => note.label), native: (outcome.nativeEffects ?? []).map(effect => effect.label)
    }])),
    family: Object.fromEntries(['thrallStrike', 'darknessArea', 'burrowWard', 'sustainedSaveDamage', 'actionTale', 'imageDecoys', 'sacrifice', 'boneArmor']
        .filter(key => plan.resolution?.[key]).map(key => [key, plan.resolution[key]]))
});

const SPELLS = ['cantrip/thrall-charge', 'rank-2/bony-barrage', 'rank-2/burrow-ward', 'rank-2/darkness', 'rank-2/heat-metal', 'rank-3/ibexs-harvest',
    'rank-3/moonlight-ray', 'rank-3/personal-blizzard', 'rank-5/slither', 'rank-5/warshard-shot', 'rank-6/chromatic-image', 'rank-9/remake-physiology'];

for (const relative of SPELLS) {
    test(`PF2e 8.6.1's ${relative.split('/')[1]} compiles as 8.5's did`, async () => {
        const before = await compile('8.5', relative), after = await compile('8.6.1', relative);
        assert.notEqual(after.resolution?.kind, 'unsupported');
        // (The family's own records may name sentences that 8.6 reworded; their mechanics must agree.)
        const strip = text => text.replace(/"(?:sourceText|text|reminder|question)":"[^"]*"/g, '');
        assert.equal(strip(meaning(after)), strip(meaning(before)));
    });
}

test('Warshard Shot: the critical hit persistent damage at the cast rank, PF2e 8.6\'s own Effect left', async () => {
    const plan = await compile('8.6.1', 'rank-5/warshard-shot');
    const critical = plan.resolution.outcomes.criticalSuccess;
    assert.deepEqual(critical.damage.formulas.map(entry => entry.formula), ['(@item.rank)[persistent,spirit]']);
    assert.deepEqual([critical.noteEffects.map(note => note.label), critical.nativeEffects], [['AC penalty'], []]);
    assert.deepEqual(plan.resolution.outcomes.failure.damage.sourceComponentIds, ['jYKfng4z2gr7l9Eh']);
});

test('Darkness: the reader takes the emphasised "darkness" of 8.6 and still refuses another sentence', async () => {
    const source = JSON.parse(await readFile(path.join(root('8.6.1'), 'spells/spells/rank-2/darkness.json'), 'utf8'));
    const changed = structuredClone(source);
    changed.system.description.value = changed.system.description.value.replace('beyond the <em>darkness</em>.', 'beyond the <em>darkness</em> unless it is magical.');
    assert.equal(compileAbility(changed, await optionsFor('8.6.1')).resolution?.darknessArea, undefined);
    assert.equal(compileAbility(source, await optionsFor('8.6.1')).resolution.darknessArea.darkness.mode, 0);
});
