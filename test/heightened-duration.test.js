import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {parseHeightenedDurations, heightenedDurationAt} from '../src/compiler/heightened-duration-compiler.js';
import {heightenedEffectDuration, SUPPORTED_RESOLUTION_KINDS} from '../scripts/runtime-core.js';
import {prepareNativeEffectSource} from '../scripts/native-outcome-effects.js';
import {EffectRuntime, MODULE_ID} from '../scripts/effect-runtime.js';

const root = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
function profileOf(effect, file) {
    const rules = effect.system?.rules ?? [];
    return {id: effect._id, name: effect.name, type: effect.type, sourceFile: file, automation: {
        ruleKeys: [...new Set(rules.map(rule => rule.key).filter(Boolean))],
        requiresConfiguration: rules.some(rule => rule.key === 'ChoiceSet'),
        removesAfterRoll: rules.some(rule => rule.removeAfterRoll != null)},
    mechanics: {rules, duration: effect.system?.duration ?? null, start: effect.system?.start}};
}
async function compileWith(spellPath, effectFiles, {edit = source => source, editEffect = effect => effect} = {}) {
    const catalog = new Map();
    for (const file of effectFiles) {
        const profile = profileOf(editEffect(await read(`spell-effects/${file}`)), file);
        catalog.set(profile.name, profile).set(profile.id, profile);
    }
    return compileAbility(edit(await read(`spells/spells/${spellPath}`)), {nativeEffectCatalog: catalog});
}
const heightened = rank => `<p><strong>Heightened (${rank})</strong> `;
const pending = plan => plan.automation.pendingCapabilities.filter(capability => capability.startsWith('heightened-duration'));

test('the Heightened wording parses into rank entries, and other duration talk is refused or ignored', () => {
    const parse = text => parseHeightenedDurations(`<p>Body.</p>${text}`);
    assert.deepEqual(parse(`${heightened('7th')}The duration increases to 1 hour.</p>`).entries,
        [{minRank: 7, value: 1, unit: 'hours', raw: 'The duration increases to 1 hour'}]);
    // A fixed-rank sequence, with "is" and the spell's duration.
    const sequence = parse(`${heightened('3rd')}The spell's duration is 1 hour.</p>${heightened('5th')}The spell's duration is 8 hours.</p>`);
    assert.deepEqual(sequence.entries.map(entry => [entry.minRank, entry.value, entry.unit]), [[3, 1, 'hours'], [5, 8, 'hours']]);
    assert.equal(heightenedDurationAt(sequence.entries, 2), null);
    assert.equal(heightenedDurationAt(sequence.entries, 4).value, 1);
    assert.equal(heightenedDurationAt(sequence.entries, 9).value, 8);
    // Inside a longer entry, and "until … daily preparations" (PF2e writes it as a day).
    assert.deepEqual(parse(`${heightened('9th')}The temporary Hit Points increase to 60, and the duration increases to 10 minutes.</p>`).entries[0].value, 10);
    assert.deepEqual(parse(`${heightened('5th')}The status bonus increases to +2, and the duration increases to lasting until the next time you make your daily preparations.</p>`).entries,
        [{minRank: 5, value: 1, unit: 'days', mode: 'daily-preparations', raw: 'the duration increases to lasting until the next time you make your daily preparations'}]);
    // A week is 7 days and a month 30 (rank 3 batch 28).
    assert.deepEqual(parse(`${heightened('5th')}The duration becomes 1 week.</p>`).entries, [{minRank: 5, value: 7, unit: 'days', raw: 'The duration becomes 1 week'}]);
    assert.deepEqual(parse(`${heightened('9th')}The duration is 1 month.</p>`).entries, [{minRank: 9, value: 30, unit: 'days', raw: 'The duration is 1 month'}]);
    // Durations this rule can't set: unlimited, a (+N) interval, "the duration of familiar form".
    for (const text of [`${heightened('7th')}The duration is unlimited.</p>`,
        `${heightened('+1')}The duration increases by 1 day.</p>`, `${heightened('6th')}Additionally, the duration of familiar form increases to 10 minutes.</p>`,
        `${heightened('4th')}The duration increases to 8 hours, or 1 day if you choose; the duration is unlimited for you.</p>`]) {
        const parsed = parse(text);
        assert.equal(parsed.entries.length, 0, text);
        assert.equal(parsed.unsupported.length, 1, text);
    }
    // Not the spell's duration: a condition's own duration (the condition rule's), and "during the spell's duration".
    assert.equal(parse(`${heightened('+2')}The duration of the deafened condition on a critical hit increases by 2 rounds.</p>`), null);
    assert.equal(parse(`${heightened('7th')}Each creature can teleport once during the spell's duration by taking a single action.</p>`), null);
});

test('a single Effect carrying only the base duration gets the heightened duration by rank', async () => {
    const fly = await compileWith('rank-4/fly.json', ['spell-effect-fly.json']);
    assert.equal(fly.resolution.kind, 'effect');
    assert.equal(fly.automation.level, 'automatic');
    assert.deepEqual(fly.lifecycle.heightenedDurations, [{minRank: 7, value: 1, unit: 'hours', raw: 'The duration increases to 1 hour'}]);
    assert.deepEqual(fly.resolution.applications[0].heightenedDuration, {template: {value: 5, unit: 'minutes'},
        branches: [{minRank: 7, maxRank: null, value: 1, unit: 'hours', raw: 'The duration increases to 1 hour'}]});
    assert.ok(fly.automation.compiledCapabilities.includes('heightened-duration'));

    const tremorsense = await compileWith('rank-2/tremorsense.json', ['spell-effect-tremorsense.json']);
    assert.equal(tremorsense.automation.level, 'automatic');
    assert.deepEqual(tremorsense.resolution.applications[0].heightenedDuration.branches.map(branch => [branch.minRank, branch.maxRank, branch.value, branch.unit]),
        [[3, 4, 1, 'hours'], [5, null, 8, 'hours']]);

    // "Until the next time you make daily preparations" on a 1-hour Effect: a day, as PF2e's own Effects write it.
    const deepSight = await compileWith('rank-3/deep-sight.json', ['spell-effect-deep-sight.json']);
    assert.equal(deepSight.automation.level, 'automatic');
    assert.deepEqual(deepSight.resolution.applications[0].heightenedDuration.branches.map(branch => [branch.minRank, branch.value, branch.unit]), [[7, 1, 'days']]);
});

test('a separate heightened Effect chosen by the rank-variant selector already carries the heightened duration', async () => {
    for (const [spell, effects, level] of [
        ['rank-1/tailwind.json', ['spell-effect-tailwind.json', 'spell-effect-tailwind-8-hours.json'], 'automatic'],
        ['rank-2/iron-gut.json', ['spell-effect-iron-gut.json', 'spell-effect-iron-gut-3rd-rank.json'], null],
        ['rank-3/wings-of-the-valkyrie.json', ['spell-effect-wings-of-the-valkyrie.json', 'spell-effect-wings-of-the-valkyrie-heightened.json'], null],
        // "Until your daily preparations" against PF2e's 24-hour variant.
        ['rank-2/darkvision.json', ['spell-effect-darkvision.json', 'spell-effect-darkvision-24-hours.json'], 'automatic']
    ]) {
        const plan = await compileWith(spell, effects);
        assert.equal(plan.resolution.kind, 'effect-variant', spell);
        assert.ok(plan.automation.compiledCapabilities.includes('heightened-duration'), spell);
        assert.deepEqual(pending(plan), [], spell);
        assert.ok(plan.resolution.applications.every(application => !application.heightenedDuration), spell);
        if (level) assert.equal(plan.automation.level, level, spell);
    }
});

test('a rank the plan can’t honour keeps the plan from being automatic', async () => {
    // The Heightened entry says something this rule can't set.
    const unlimited = await compileWith('rank-4/fly.json', ['spell-effect-fly.json'], {edit: source => {
        source.system.description.value = source.system.description.value.replace('The duration increases to 1 hour.', 'The duration is unlimited.');
        return source;
    }});
    assert.ok(SUPPORTED_RESOLUTION_KINDS.includes(unlimited.resolution.kind));
    assert.equal(unlimited.automation.level, 'guided');
    assert.deepEqual(pending(unlimited), ['heightened-duration:unparsed']);
    assert.equal(unlimited.resolution.applications[0].heightenedDuration, undefined);

    // The Effect's own duration is neither the spell's base duration nor the heightened one.
    const mismatch = await compileWith('rank-4/fly.json', ['spell-effect-fly.json'], {editEffect: effect => {
        effect.system.duration = {...effect.system.duration, value: 10, unit: 'minutes'};
        return effect;
    }});
    assert.equal(mismatch.automation.level, 'guided');
    assert.deepEqual(pending(mismatch), ['heightened-duration:effect-duration-mismatch']);

    // A heightened variant Effect that doesn't last the stated duration.
    const variant = await compileWith('rank-1/tailwind.json', ['spell-effect-tailwind.json', 'spell-effect-tailwind-8-hours.json'], {editEffect: effect => {
        if (/8 hours/.test(effect.name)) effect.system.duration = {...effect.system.duration, value: 4};
        return effect;
    }});
    assert.equal(variant.automation.level, 'guided');
    assert.deepEqual(pending(variant), ['heightened-duration:effect-duration-mismatch']);
});

test('the runtime picks the cast rank’s duration and refuses a template changed since compiling', t => {
    const prior = globalThis.foundry;
    globalThis.foundry = {utils: {deepClone: structuredClone}};
    t.after(() => { globalThis.foundry = prior; });
    const application = {heightenedDuration: {template: {value: 5, unit: 'minutes'}, branches: [
        {minRank: 7, maxRank: 8, value: 1, unit: 'hours'}, {minRank: 9, maxRank: null, value: 8, unit: 'hours'}]}};
    const template = {value: 5, unit: 'minutes', expiry: 'turn-start', sustained: false};
    assert.equal(heightenedEffectDuration(application, template, 4), null);
    assert.deepEqual(heightenedEffectDuration(application, template, 7), {value: 1, unit: 'hours'});
    assert.deepEqual(heightenedEffectDuration(application, template, 10), {value: 8, unit: 'hours'});
    assert.equal(heightenedEffectDuration({}, template, 10), null);
    assert.throws(() => heightenedEffectDuration(application, {...template, value: 10}, 7), /changed since the spell was compiled/);

    const source = prepareNativeEffectSource({uuid: 'Compendium.x', _stats: {}, toObject: () => ({
        _id: 'id', name: 'Spell Effect: Fly', type: 'effect', system: {level: {value: 4}, duration: template, rules: []}, flags: {}})},
    {castRank: 7, heightenedDuration: {value: 1, unit: 'hours'}});
    assert.deepEqual(source.system.duration, {value: 1, unit: 'hours', expiry: 'turn-start', sustained: false});
});

test('the Effect route creates the Effect with the heightened duration at the cast rank', async t => {
    const effectUuid = 'Compendium.pf2e.spell-effects.Item.Fly';
    const items = [];
    const caster = {id: 'source', uuid: 'Actor.source', name: 'Caster', documentName: 'Actor', items, canUserModify: () => true,
        async createEmbeddedDocuments(_type, sources) {
            const created = sources.map(source => ({...structuredClone(source), id: `effect-${items.length + 1}`,
                uuid: `Actor.source.Item.effect-${items.length + 1}`, actor: this, async delete() {}}));
            items.push(...created);
            return created;
        }};
    const duration = {value: 5, unit: 'minutes', expiry: 'turn-start', sustained: false};
    const template = {uuid: effectUuid, name: 'Spell Effect: Fly', type: 'effect', system: {duration}, _stats: {compendiumSource: effectUuid},
        toObject: () => ({_id: 'pack-id', name: 'Spell Effect: Fly', type: 'effect', system: {level: {value: 4}, duration: structuredClone(duration), rules: []}, flags: {}})};
    const prior = Object.fromEntries(['foundry', 'game', 'canvas', 'ChatMessage', 'Hooks', 'fromUuid'].map(key => [key, globalThis[key]]));
    globalThis.foundry = {utils: {deepClone: structuredClone, randomID: () => 'cast-1', escapeHTML: value => String(value)}};
    globalThis.game = {user: {id: 'gm', isGM: true, targets: new Set()}, users: {contents: [{id: 'gm', active: true, isGM: true}]},
        actors: {contents: [caster]}, messages: {get: () => null}};
    globalThis.canvas = {tokens: {placeables: []}};
    globalThis.ChatMessage = {getSpeaker: () => ({}), create: async data => ({id: 'receipt', ...data})};
    globalThis.Hooks = {callAll: () => {}};
    globalThis.fromUuid = async uuid => uuid === effectUuid ? template : null;
    t.after(() => Object.assign(globalThis, prior));

    const plan = {compilerVersion: 'test', source: {name: 'Fly', uuid: 'Actor.source.Item.fly'}, rank: 4,
        automation: {level: 'automatic', pendingCapabilities: []},
        nativeEffects: {onUse: [{uuid: effectUuid, reference: 'Spell Effect: Fly', recipient: {actor: 'source'}}],
            rankVariants: [], choiceVariants: [], deferred: [], sequences: [], terminations: []},
        resolution: {kind: 'effect', applications: [{kind: 'native-spell-effect', uuid: effectUuid, source: 'nativeEffects.onUse',
            heightenedDuration: {template: {value: 5, unit: 'minutes'}, branches: [{minRank: 7, maxRank: null, value: 1, unit: 'hours'}]}}]}};
    const runtime = new EffectRuntime();
    const cast = async castRank => (await runtime.execute({uuid: plan.source.uuid, actor: caster},
        {plan, sourceActor: caster, castRank, skipConfirmation: true})).created[0];
    const base = await cast(4);
    assert.deepEqual([base.system.duration.value, base.system.duration.unit], [5, 'minutes']);
    assert.equal(base.flags[MODULE_ID].runtime.heightenedDuration, undefined);
    const high = await cast(7);
    assert.deepEqual(high.system.duration, {value: 1, unit: 'hours', expiry: 'turn-start', sustained: false});
    assert.equal(high.system.level.value, 7);
    assert.deepEqual(high.flags[MODULE_ID].runtime.heightenedDuration, {value: 1, unit: 'hours'});
});
