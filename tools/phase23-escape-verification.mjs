import {confirmedDamageSummary} from '../scripts/native-damage-receipt.js';
// Explicit disposable-world checks for event lifetimes (timer or Escape) and
// coordinated condition lists. Spell names select test fixtures only.
const NS = 'pf2e-automatic-resolution', KEY = 'phase23EscapeVerification', FIXTURE = 'phase23EscapeFixture';
const assert = (value, message) => { if (!value) throw Error(message); };
const degrees = ['criticalSuccess', 'success', 'failure', 'criticalFailure'];
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function store() {
    const saved = game.user.getFlag(NS, KEY) ?? {results: [], actors: [], cases: {}};
    return {saved, persist: () => game.user.setFlag(NS, KEY, saved)};
}

async function context() {
    assert(game.world.id === 'pftest' && game.user.isGM, 'Disposable pftest GM only.');
    const api = game.modules.get(NS).api;
    const {saved, persist} = store();
    const actor = async (name, {level = 5} = {}) => {
        const document = await Actor.create({name: `PFTEST P23 Escape ${name}`, type: 'npc', flags: {[NS]: {[FIXTURE]: true}},
            system: {details: {level: {value: level}}, attributes: {hp: {value: 500, max: 500}, ac: {value: 20}},
                movement: {speeds: {land: {value: 25}}}, saves: {fortitude: {value: 10}, reflex: {value: 10}, will: {value: 10}},
                skills: {athletics: {base: 10}}, traits: {value: ['humanoid']}}});
        saved.actors.push(document.id); await persist(); return document;
    };
    const token = async actor => {
        assert(canvas.scene, 'An active disposable test scene is required.');
        return (await canvas.scene.createEmbeddedDocuments('Token', [{...actor.prototypeToken.toObject(), actorId: actor.id, actorLink: true, x: 1200, y: 1200}]))[0];
    };
    // PF2e auto-heightens NPC spells to the caster's maximum rank, so the
    // caster level fixes the resolved rank: level 2r-1 casts at rank r.
    const setup = async (name, {custom = false, dc = 24, rank = null} = {}) => {
        const pack = game.packs.get('pf2e.spells-srd'), index = await pack.getIndex(), row = index.find(item => item.name === name);
        assert(row, `Missing native fixture ${name}`);
        const source = (await pack.getDocument(row._id)).toObject(); delete source._id;
        // PF2e clamps an NPC's spell to its maximum rank, so the caster is at least the level of the spell's own rank.
        const caster = await actor(`${name} caster`, {level: (rank ?? Number(source.system.level?.value ?? 3)) * 2 - 1}), casterToken = await token(caster);
        const [entry] = await caster.createEmbeddedDocuments('Item', [{name: 'General rules casting', type: 'spellcastingEntry',
            system: {tradition: {value: 'occult'}, prepared: {value: 'innate'}, spelldc: {dc, value: dc - 10}}}]);
        source.system.location = {value: entry.id};
        if (custom) {
            source.name = 'Custom shared-rule restraint'; source.system.slug = 'custom-shared-rule-restraint';
            delete source._stats.compendiumSource;
        }
        const [spell] = await caster.createEmbeddedDocuments('Item', [source]);
        return {caster, casterToken, spell, dc};
    };
    const cast = async (fixture, actors, chosen, rank = fixture.spell.baseRank) => {
        const targets = await Promise.all(actors.map(token));
        const plan = await api.compile(fixture.spell);
        assert(api.saves.supports(plan), `${fixture.spell.name}: executable save plan`);
        const {card} = await api.saves.start(fixture.spell, {sourceActor: fixture.caster, plan, targets, castRank: rank, dc: fixture.dc, skipConfirmation: true});
        const state = card.getFlag(NS, 'basicSaveState');
        for (const [index, target] of state.targets.entries()) {
            await api.saves.rollSave(card, target.id, {skipDialog: true});
            await api.saves.correctTarget(card, target.id, {action: 'degree', degree: chosen[index] ?? chosen[0]});
        }
        await api.saves.finalize(card);
        return card;
    };
    const state = card => card.getFlag(NS, 'basicSaveState');
    const restraints = actor => actor.items.filter(item => item.type === 'effect' && item.flags?.[NS]?.outcomeEffect?.escape);
    // A deterministic Escape check message routed through the real createChatMessage hook.
    const escapeMessage = async (actor, total, natural = 10) => {
        const roll = await new Roll(`${total}`).evaluate();
        const before = new Set(game.messages.contents.map(message => message.id));
        const message = await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor}), rolls: [roll], content: `PFTEST scripted Escape ${total}`,
            flags: {pf2e: {context: {type: 'skill-check', options: ['action:escape', 'action:escape:athletics'],
                origin: {actor: actor.uuid}, isReroll: false}}}
        });
        // Natural-die grading is unit-tested; this scripted roll has no die.
        await wait(600);
        const cards = game.messages.contents.filter(candidate => !before.has(candidate.id)
            && candidate.flags?.[NS]?.escapeTermination?.checkMessageId === message.id);
        return {message, card: cards[0] ?? null, natural};
    };
    const damageFor = (card, degree) => {
        const s = state(card);
        if (!s.damage?.rollJSON || degree === 'criticalSuccess') return 0;
        const base = CONFIG.Dice.rolls.find(r => r.name === 'DamageRoll').fromData(s.damage.rollJSON);
        const multiplier = {success: 0.5, failure: 1, criticalFailure: 2}[degree];
        return multiplier === 1 ? base.total : base.alter(multiplier, 0).total;
    };
    const record = async (label, fn) => {
        let result;
        try { result = {label, passed: true, at: new Date().toISOString(), details: await fn()}; }
        catch (error) { result = {label, passed: false, error: error.message, stack: error.stack}; }
        saved.results.push(result); await persist(); return result;
    };
    return {api, saved, persist, actor, token, setup, cast, state, restraints, escapeMessage, damageFor, record};
}

const EXPECT = {
    'Grasping Grave': {
        criticalSuccess: {speed: 25, conditions: {}},
        success: {speed: 25, conditions: {}},
        failure: {speed: 15, conditions: {}},
        criticalFailure: {speed: 25, conditions: {immobilized: true}, restraint: 'immobilized'}
    },
    "Shadow's Web": {
        criticalSuccess: {speed: 25, conditions: {}},
        success: {speed: 25, conditions: {enfeebled: 1}},
        failure: {speed: 25, conditions: {enfeebled: 2}},
        criticalFailure: {speed: 25, conditions: {stunned: 1, enfeebled: 2, immobilized: true}, restraint: 'immobilized'}
    }
};

function verifyTarget(ctx, name, degree, recipient, card) {
    const expected = EXPECT[name][degree];
    assert(ctx.state(card).status === 'completed', `${name}: completed`);
    for (const slug of ['immobilized', 'stunned', 'enfeebled']) {
        const want = expected.conditions[slug];
        const have = recipient.getCondition(slug);
        if (want === true) assert(!!have, `${name}/${degree}: ${slug} present`);
        else if (want) assert(have?.value === want, `${name}/${degree}: ${slug} ${want}, got ${have?.value}`);
        else assert(!have, `${name}/${degree}: no ${slug}`);
    }
    if (name === 'Grasping Grave') assert(recipient.system.movement.speeds.land.value === expected.speed, `${name}/${degree}: Speed ${expected.speed}`);
    const damage = ctx.damageFor(card, degree);
    assert(500 - recipient.hitPoints.value === damage, `${name}/${degree}: native damage exactly once`);
    const restraints = ctx.restraints(recipient);
    assert(restraints.length === (expected.restraint ? 1 : 0), `${name}/${degree}: one Escape-terminable Effect`);
    if (restraints[0]) {
        const effect = restraints[0];
        assert(effect.flags[NS].outcomeEffect.escape.dc === ctx.state(card).dc, 'Escape DC snapshots the cast DC');
        assert(effect.system.duration.value === 1 && effect.system.duration.unit === 'rounds', 'Restraint keeps its 1-round timer');
        assert(effect.flags[NS].outcomeEffect.conditions.map(c => c.slug).join() === 'immobilized', 'Only Immobilized ends on Escape');
    }
    return {name, degree, rank: ctx.state(card).castRank, damage, speed: recipient.system.movement.speeds.land.value,
        conditions: Object.fromEntries(['immobilized', 'stunned', 'enfeebled'].map(slug => [slug, recipient.getCondition(slug)?.value ?? !!recipient.getCondition(slug)])),
        effects: recipient.items.filter(item => item.type === 'effect').map(item => ({name: item.name, duration: item.system.duration, escape: item.flags?.[NS]?.outcomeEffect?.escape ?? null}))};
}

export const cases = {
    async environment(ctx) {
        return {foundry: game.version, pf2e: game.system.version, module: game.modules.get(NS).version, world: game.world.id,
            modules: [...game.modules.values()].filter(m => m.active).map(m => m.id), removal: game.pf2e.settings.automation.removeEffects};
    },
    async degrees(ctx) {
        const out = [];
        for (const name of Object.keys(EXPECT)) {
            const fixture = await ctx.setup(name), recipients = await Promise.all(degrees.map(degree => ctx.actor(`${name} ${degree}`)));
            const card = await ctx.cast(fixture, recipients, degrees);
            for (const [index, degree] of degrees.entries()) out.push(verifyTarget(ctx, name, degree, recipients[index], card));
            assert(confirmedDamageSummary(ctx.state(card)).damage === recipients.reduce((n, a) => n + 500 - a.hitPoints.value, 0), 'Group damage receipt exact');
            const before = recipients.map(a => ({hp: a.hitPoints.value, ids: a.items.map(i => i.id).sort().join()}));
            try { await ctx.api.saves.finalize(card); } catch {}
            assert(recipients.every((a, i) => a.hitPoints.value === before[i].hp && a.items.map(j => j.id).sort().join() === before[i].ids), 'Duplicate finalize is inert');
        }
        return out;
    },
    async ranks(ctx) {
        const out = [];
        for (const name of Object.keys(EXPECT)) {
            const base = (await ctx.setup(name)).spell.baseRank;
            // Expected dice come from the spell's own structured heightening data.
            const heightened = (spell, rank) => {
                const base = Number(/^(\d+)d/.exec(Object.values(spell._source.system.damage)[0].formula)[1]);
                const h = spell._source.system.heightening, step = Number(/^(\d+)d/.exec(Object.values(h?.damage ?? {})[0] ?? '0d0')[1]);
                return base + step * Math.floor((rank - spell.baseRank) / (h?.interval ?? 1));
            };
            for (let rank = base; rank <= 10; rank++) {
                const fixture = await ctx.setup(name, {rank});
                const recipient = await ctx.actor(`${name} rank ${rank}`), card = await ctx.cast(fixture, [recipient], ['criticalFailure'], rank);
                const formula = ctx.state(card).damage.formula, dice = Number(/^(\d+)d/.exec(formula)?.[1]);
                const expectedDice = heightened(fixture.spell, rank);
                assert(dice === expectedDice, `${name} rank ${rank}: heightened to ${expectedDice} dice, got ${formula}`);
                out.push({...verifyTarget(ctx, name, 'criticalFailure', recipient, card), formula});
            }
            // A card recording a rank PF2e cannot resolve must refuse to roll.
            const low = await ctx.setup(name, {rank: base}), recipient = await ctx.actor(`${name} clamped`);
            const {card} = await ctx.api.saves.start(low.spell, {sourceActor: low.caster, plan: await ctx.api.compile(low.spell),
                targets: [await ctx.token(recipient)], castRank: 10, dc: low.dc, skipConfirmation: true});
            let refused = null; try { await ctx.api.saves.rollDamage(card); } catch (error) { refused = error.message; }
            assert(refused && !ctx.state(card).damage.rollJSON && recipient.hitPoints.value === 500, 'Clamped rank refuses to roll damage');
            out.push({name, clampedRankRefusal: refused});
        }
        return out;
    },
    async escape(ctx) {
        const out = {};
        const fixture = await ctx.setup("Shadow's Web"), recipient = await ctx.actor('Web escapee');
        const card = await ctx.cast(fixture, [recipient], ['criticalFailure']);
        const [restraint] = ctx.restraints(recipient);
        const failed = await ctx.escapeMessage(recipient, fixture.dc - 1);
        assert(!failed.card && recipient.items.has(restraint.id), 'A failed Escape leaves the restraint and posts no card');
        const success = await ctx.escapeMessage(recipient, fixture.dc);
        assert(success.card, 'A successful Escape posts a GM review card');
        const data = success.card.flags[NS].escapeTermination;
        assert(data.entries.length === 1 && data.entries[0].effectUuid === restraint.uuid, 'The card lists exactly the beaten restraint');
        assert(success.card.whisper.length && success.card.whisper.every(id => game.users.get(id)?.isGM), 'Card is GM-whispered');
        await ctx.api.escape.end(success.card, data.entries[0].id);
        await ctx.api.ongoing.reconcile();
        assert(!recipient.items.has(restraint.id) && !recipient.hasCondition('immobilized'), 'Escape removes the restraint and its Immobilized');
        assert(recipient.getCondition('enfeebled')?.value === 2 && recipient.getCondition('stunned')?.value === 1, 'Escape keeps enfeebled 2 and Stunned 1');
        const record = ctx.api.ongoing.records().find(r => r.castId === ctx.state(card).castId);
        const entry = record?.entries?.find(e => e.uuid === restraint.uuid);
        assert(entry?.status === 'ended' && entry.reason === 'escaped', `Journal records the Escape ending, got ${entry?.status}/${entry?.reason}`);
        let repeat = null; try { await ctx.api.escape.end(success.card, data.entries[0].id); } catch (error) { repeat = error.message; }
        assert(repeat, 'A second End click is refused');
        const hp = recipient.hitPoints.value;
        out.shadowsWeb = {cardId: card.id, escapeCardId: success.card.id, dc: fixture.dc, hp, journal: entry, repeat,
            remaining: recipient.items.filter(i => i.type === 'effect').map(i => i.name)};
        return out;
    },
    async multiple(ctx) {
        const low = await ctx.setup('Grasping Grave', {dc: 24}), high = await ctx.setup('Grasping Grave', {dc: 30, custom: true});
        const recipient = await ctx.actor('double restraint');
        await ctx.cast(low, [recipient], ['criticalFailure']);
        await ctx.cast(high, [recipient], ['criticalFailure']);
        const [lowEffect, highEffect] = ctx.restraints(recipient).sort((a, b) => a.flags[NS].outcomeEffect.escape.dc - b.flags[NS].outcomeEffect.escape.dc);
        assert(lowEffect && highEffect, 'Two independent restraints');
        const partial = await ctx.escapeMessage(recipient, 26);
        assert(partial.card?.flags[NS].escapeTermination.entries.map(e => e.dc).join() === '24', 'Total 26 beats only DC 24');
        const both = await ctx.escapeMessage(recipient, 31);
        const entries = both.card?.flags[NS].escapeTermination.entries ?? [];
        assert(entries.length === 2, 'Total 31 beats both');
        const id = uuid => entries.find(e => e.effectUuid === uuid).id;
        await ctx.api.escape.end(both.card, id(highEffect.uuid));
        const status = game.messages.get(both.card.id).flags[NS].escapeTermination.status;
        assert(status[id(highEffect.uuid)] === 'Ended by Escape' && status[id(lowEffect.uuid)] === 'Not chosen', 'One Escape ends one restraint');
        assert(recipient.items.has(lowEffect.id) && !recipient.items.has(highEffect.id) && recipient.hasCondition('immobilized'), 'The unchosen restraint remains');
        return {status, remaining: ctx.restraints(recipient).map(e => e.name)};
    },
    async timer(ctx) {
        assert(!game.combat?.started, 'No campaign combat during world-time fixture checks');
        const fixture = await ctx.setup('Grasping Grave', {custom: true});
        const recipients = [await ctx.actor('timer crit'), await ctx.actor('timer fail')];
        const card = await ctx.cast(fixture, recipients, ['criticalFailure', 'failure']);
        const hp = recipients.map(a => a.hitPoints.value);
        await fixture.spell.delete();
        await game.time.advance(5); await ctx.api.ongoing.reconcile({clockEvent: true});
        assert(recipients[0].hasCondition('immobilized') && recipients[1].system.movement.speeds.land.value === 15, 'Before expiry both contributions remain after source deletion');
        await game.time.advance(2); await ctx.api.ongoing.reconcile({clockEvent: true});
        assert(!recipients[0].hasCondition('immobilized') && recipients[1].system.movement.speeds.land.value === 25, 'Timer ends Immobilized and the Speed penalty');
        assert(recipients.every((a, i) => a.hitPoints.value === hp[i]), 'Expiry never replays damage');
        const late = await ctx.escapeMessage(recipients[0], 99);
        assert(!late.card, 'No review card after the timer already ended the restraint');
        return {cardId: card.id, hp};
    },
    async prepareReload(ctx) {
        const fixture = await ctx.setup('Grasping Grave', {custom: true}), recipient = await ctx.actor('reload restraint');
        const card = await ctx.cast(fixture, [recipient], ['criticalFailure']);
        await fixture.spell.delete();
        ctx.saved.cases.reload = {actorId: recipient.id, cardId: card.id, effect: ctx.restraints(recipient)[0].uuid, dc: fixture.dc, hp: recipient.hitPoints.value};
        await ctx.persist(); return ctx.saved.cases.reload;
    },
    async reload(ctx) {
        const c = ctx.saved.cases.reload, recipient = game.actors.get(c.actorId);
        await ctx.api.ongoing.reconcile();
        assert(fromUuidSync(c.effect), 'Restraint survives reload and source deletion');
        const success = await ctx.escapeMessage(recipient, c.dc + 10);
        assert(success.card?.flags[NS].escapeTermination.entries[0].degree === 'criticalSuccess', 'Critical success after reload');
        await ctx.api.escape.end(success.card, success.card.flags[NS].escapeTermination.entries[0].id);
        assert(!fromUuidSync(c.effect) && !recipient.hasCondition('immobilized') && recipient.hitPoints.value === c.hp, 'Escape after reload ends only the restraint');
        return c;
    },
    // Real PF2e Escape action through its native dialog; the GM then clicks End.
    async prepareUi(ctx) {
        const fixture = await ctx.setup('Grasping Grave', {dc: 5}), recipient = await ctx.actor('UI escapee');
        await ctx.cast(fixture, [recipient], ['criticalFailure']);
        const effect = ctx.restraints(recipient)[0];
        ctx.saved.cases.ui = {actorId: recipient.id, effect: effect.uuid, messages: game.messages.size};
        await ctx.persist();
        void game.pf2e.actions.get('escape').use({actors: [recipient], statistic: 'athletics'});
        return ctx.saved.cases.ui;
    },
    async verifyUi(ctx) {
        const c = ctx.saved.cases.ui, recipient = game.actors.get(c.actorId);
        const check = game.messages.contents.find(m => m.flags?.pf2e?.context?.options?.includes('action:escape') && m.speaker.actor === recipient.id);
        const card = game.messages.contents.find(m => m.flags?.[NS]?.escapeTermination?.checkMessageId === check?.id);
        assert(check && card, 'Native Escape check produced a GM review card');
        const status = card.flags[NS].escapeTermination.status;
        assert(Object.values(status).includes('Ended by Escape'), 'The End button recorded the ending');
        assert(!fromUuidSync(c.effect) && !recipient.hasCondition('immobilized'), 'Clicked End removed the restraint');
        return {checkTotal: check.rolls[0].total, options: check.flags.pf2e.context.options, status};
    },
    async cleanup(ctx) {
        const actors = ctx.saved.actors.map(id => game.actors.get(id)).filter(a => a?.getFlag(NS, FIXTURE));
        const ids = new Set(actors.map(a => a.id)), uuids = new Set(actors.map(a => a.uuid));
        const records = ctx.api.ongoing.records().filter(r => uuids.has(r.sourceActorUuid));
        for (const r of records) await game.journal.get(r.journalId)?.update({[`flags.${NS}.ongoingCast.status`]: 'ended'});
        for (const scene of game.scenes) {
            const tokens = scene.tokens.filter(t => ids.has(t.actorId)).map(t => t.id);
            if (tokens.length) await scene.deleteEmbeddedDocuments('Token', tokens);
        }
        if (ids.size) await Actor.deleteDocuments([...ids], {[NS]: {ongoingCleanup: true}});
        for (const r of records) await game.journal.get(r.journalId)?.delete();
        ctx.saved.actors = []; await ctx.persist();
        assert(!game.actors.some(a => a.getFlag(NS, FIXTURE)), 'No Escape fixture actors remain');
        return {actorsRemoved: ids.size, journalsRemoved: records.length, remainingFixtureActors: 0};
    }
};

/** Run one named case; results persist on the GM user flag for export. */
export async function runCase(name) {
    const ctx = await context();
    assert(cases[name], `Unknown case ${name}`);
    return await ctx.record(name, () => cases[name](ctx));
}

export function results() { return store().saved; }
export async function reset() { const {saved, persist} = store(); saved.results = []; saved.cases = {}; await persist(); return saved; }
