import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readItemSpellshape} from '../src/compiler/item-spellshape.js';
import {unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Third-party features batch 43 (2026-10-08): PF2e's catalysts — the 62 that were GM notes, each read into riders (the user: "automate the 62 catalyst notes too").
const catalysts = JSON.parse(fs.readFileSync(new URL('../.cache/pf2e-spell-features/pf2e-catalysts.json', import.meta.url)));
const read = name => { const x = catalysts.find(entry => entry.name === name); return readItemSpellshape({name: x.name, type: 'consumable', system: {traits: {value: x.traits}, description: {value: x.text}, level: {value: x.level}}})?.activations?.[0]; };
const types = name => read(name).riders.map(rider => rider.type);

test('no catalyst is left a GM note', () => {
    assert.equal(catalysts.length, 107);
    for (const entry of catalysts) assert.ok(!types(entry.name).includes('note'), entry.name);
    // (PF2e's Effect alone carries the dragon scales' damage type.)
    assert.deepEqual(types('Dragon Breath Scale'), ['self-effect']);
    assert.deepEqual(types('Dragon Throat Scale'), ['self-effect']);
});

test('the cast-time riders', () => {
    assert.deepEqual(read('Alicorn Hair').riders, [{type: 'extra-targets', count: 1}]);
    assert.deepEqual(read('Black Ash').riders, [{type: 'cast-watch', watch: 'spell-damage-persistent', formula: '1d6', damageType: 'poison'}]);
    assert.deepEqual(read('Fearcracker').riders.map(r => [r.watch, r.condition.slug, r.condition.value]), [['image-destroyed', 'frightened', 1]]);
    assert.deepEqual(read('Ghostcracker').riders.map(r => [r.watch, r.condition.slug]), [['illusion-ended', 'frightened']]);
    assert.deepEqual(read('Dimensional Knot').riders.map(r => [r.type, r.condition.slug, r.condition.value]), [['targeted-ally-condition', 'stunned', 1]]);
    assert.deepEqual(read('Preserved Alecost').riders, [{type: 'food-temp-hp', perRank: 1, hours: 1}]);
    assert.deepEqual(read('Echoing Theater').riders.map(r => [r.type, r.days]), [['reminder', 7]]);
    assert.equal(read('Steadfast Sentinel').riders[0].unlimited, true);
    assert.equal(read("Warden's Eye").riders[0].who, 'target');
    assert.deepEqual(read('Nevercold (Refined)').riders.map(r => r.op ?? r.hours), ['duration', 'linger-resistance', 24]);
    assert.deepEqual(read('Deadlock Mint (Greater)').riders.map(r => r.type), ['cast-push-save', 'reminder']);
});

test('the requirements a catalyst names itself', () => {
    // (Broken Ram's Thorn: "the two-action version"; Deathless Light: any light spell; Shadow Ash: the undead the text names.)
    assert.deepEqual(read("Broken Ram's Thorn").requires, {spells: ['Howling Blizzard'], actions: [2]});
    assert.ok(unmetRequirement(read("Broken Ram's Thorn").requires, {name: 'Howling Blizzard', actions: 3, traits: [], rank: 5}));
    assert.equal(unmetRequirement(read("Broken Ram's Thorn").requires, {name: 'Howling Blizzard', actions: 2, traits: [], rank: 5}), null);
    assert.deepEqual(read('Deathless Light').requires, {traits: ['light']});
    assert.deepEqual(read('Deathless Light').riders, [{type: 'light-rank', by: 1, max: 7}]);
    assert.deepEqual(read('Shadow Ash').requires, {spells: ['Animate Dead', 'Summon Undead', 'Create Undead']});
    assert.deepEqual(read('Shadow Ash').riders[0], {type: 'summoned-shroud', formula: '3d6', damageType: 'cold', condition: {uuid: 'Compendium.pf2e.conditionitems.Item.4D2KBtexWXa6oUMR', slug: 'drained', value: 1}, riseDC: 11});
});

test('the save-card riders', () => {
    assert.deepEqual(read('Leaden Weight').riders.map(r => [r.type, r.degrees]), [['prone-after-move', ['failure', 'criticalFailure']]]);
    // (Necrotic Cap: "all acid damage the spell deals becomes void damage" — the persistent damage the card composes too.)
    assert.deepEqual(read('Necrotic Cap (Moderate)').riders.find(r => r.type === 'damage-type'), {type: 'damage-type', from: 'acid', to: 'void'});
    const cap = read('Necrotic Cap (Moderate)').riders[0];
    assert.deepEqual([cap.when, cap.list.map(c => [c.slug, c.value, c.whileCondition ?? null])], ['hit-or-failed', [['enfeebled', 2, null], ['sickened', 2, null], ['sickened', 1, 'persistent-damage']]]);
    assert.deepEqual(read('Dazzling Rosary').riders[0], {type: 'conditions', onlySave: 'spell-attack', degrees: {criticalSuccess: [{uuid: 'Compendium.pf2e.conditionitems.Item.TkIyaNPgTZFBCCuh', slug: 'dazzled', value: null, until: 'caster-turn-start'}]}});
    assert.deepEqual(read("Broken Ram's Thorn").riders, [{type: 'caltrops', skill: 'acrobatics', damageType: 'cold'}]);
    assert.deepEqual(read('Kirin Echo Chime').riders, [{type: 'redirect-push', feet: 30, degrees: ['failure', 'criticalFailure']}]);
    assert.deepEqual(read('Ogre Spider Filament').riders.map(r => [r.from, r.to.slug]), [['enfeebled', 'clumsy']]);
    assert.deepEqual(types('Seventh Prism (Triangular)'), ['double-durations', 'after-condition']);
    assert.deepEqual(read('Seventh Prism (Triangular)').riders[1].condition.rounds, 10);
    assert.deepEqual(types("Undertaker's Spade"), ['damage-material', 'incorporeal-condition']);
    const swirl = read('Swirling Sand').riders[0];
    assert.deepEqual([swirl.type, swirl.rounds, swirl.oneTarget, swirl.degrees], ['generated', 3, true, ['success', 'failure', 'criticalFailure']]);
    assert.deepEqual(read('Kushtaka Relic').riders.map(r => [r.degrees[0], r.rounds ?? 1]), [['failure', 10], ['criticalFailure', 1]]);
    const loop = read('Euphoric Loop (Greater)').riders[0];
    assert.deepEqual([loop.oneTarget, loop.statistic, loop.rows.criticalFailure.normal.value, loop.rows.criticalFailure.hostile.rounds], [false, 'will', 3, 2]);
    assert.equal(read('Euphoric Loop').riders[0].oneTarget, true);
});

test("the spell's Effects and its resolution", () => {
    assert.deepEqual(read('Consecrated Shield').riders, [{type: 'effect-patch', op: 'selector-swap', from: ['attack', 'attack-roll', 'strike-attack-roll'], to: 'ac'}]);
    assert.deepEqual(read('Witchwarg Fur').riders[0].resistance, {from: 'cold', to: 'fire'});
    assert.deepEqual(Object.keys(read('Dragon Scute (Moderate)').riders[0].options), ['arcane', 'divine', 'occult', 'primal']);
    assert.deepEqual(read('Dragon Scute (Lesser)').riders[0].options.occult, [{key: 'Resistance', type: 'mental', value: 10}]);
    assert.deepEqual(read('Chaos Falcon Feather').riders, [{type: 'effect-flag', flag: 'moveResistance', minutes: 1}]);
    assert.deepEqual(read('Demon Bone Tiles (Pusk)').riders.map(r => [r.flag, r.statistic, r.damageType]), [['shieldShards', 'reflex', 'bleed']]);
    assert.deepEqual(read('Feral Linguist').riders, [{type: 'effect-flag', flag: 'formSpeech'}]);
    assert.deepEqual(read('Feral Linguist (Greater)').riders[0].castOnce, {maxRank: 4});
    assert.deepEqual(['Force Tiles', 'Noxious Incense', 'Gravemist Taper', 'Irritating Seedpod', 'Odious Token', 'Skyfisher Vapors'].map(name => read(name).riders[0].op),
        ['wall-hazard', 'wall-smoke', 'mist-dread', 'area-turn-save', 'aura-on-ally', 'hidden-cloud']);
    assert.deepEqual(read('Gravemist Taper').riders[0].flatDC, 7);
    const pod = read('Irritating Seedpod (Major)').riders[0];
    assert.deepEqual([pod.dc, pod.failure.map(f => [f.slug, f.value, f.rounds, f.after ?? 0]), pod.oneRound, pod.immuneMinutes], [29, [['slowed', 2, 1, 0], ['slowed', 1, 3, 1]], false, 10]);
    assert.equal(read('Irritating Seedpod (Lesser)').riders[0].oneRound, true);
    assert.deepEqual(['Unsullied Blood (Lesser)', 'Unsullied Blood (Moderate)', 'Unsullied Blood (Greater)', 'Unsullied Blood (Major)'].map(name => read(name).riders[0].kind), ['heal', 'heal-then-temp', 'heal-then-temp', 'heal-then-temp']);
    const lemur = read('Literate Lemur').riders[0].mode;
    assert.deepEqual([lemur.key, lemur.statistic, lemur.failure.condition, lemur.criticalFailure.condition], ['fierce-debate', 'reflex', 'dazzled', 'blinded']);
});
