// Explicit disposable-world checks for recurring end-of-turn saves.
// Spell names select test fixtures only.
const NS = 'pf2e-automatic-resolution', KEY = 'phase23RecurringVerification', FIXTURE = 'phase23RecurringFixture';
const assert = (value, message) => { if (!value) throw Error(message); };
const degrees = ['criticalSuccess', 'success', 'failure', 'criticalFailure'];
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function store() {
    const saved = game.user.getFlag(NS, KEY) ?? {results: [], actors: [], combats: [], cases: {}};
    return {saved, persist: () => game.user.setFlag(NS, KEY, saved)};
}

async function context() {
    assert(game.world.id === 'pftest' && game.user.isGM, 'Disposable pftest GM only.');
    const api = game.modules.get(NS).api;
    const {saved, persist} = store();
    const actor = async (name, {level = 5} = {}) => {
        const document = await Actor.create({name: `PFTEST P23 Recurring ${name}`, type: 'npc', flags: {[NS]: {[FIXTURE]: true}},
            system: {details: {level: {value: level}}, attributes: {hp: {value: 500, max: 500}, ac: {value: 20}},
                saves: {fortitude: {value: 10}, reflex: {value: 10}, will: {value: 10}}, traits: {value: ['humanoid']}}});
        saved.actors.push(document.id); await persist(); return document;
    };
    const token = async actor => {
        assert(canvas.scene, 'An active disposable test scene is required.');
        return (await canvas.scene.createEmbeddedDocuments('Token', [{...actor.prototypeToken.toObject(), actorId: actor.id, actorLink: true, x: 1300, y: 1300}]))[0];
    };
    const setup = async (name, {custom = false, rank = null} = {}) => {
        const caster = await actor(`${name} caster`, rank ? {level: rank * 2 - 1} : {level: 20}), casterToken = await token(caster);
        const [entry] = await caster.createEmbeddedDocuments('Item', [{name: 'General rules casting', type: 'spellcastingEntry',
            system: {tradition: {value: 'occult'}, prepared: {value: 'innate'}, spelldc: {dc: 24, value: 14}}}]);
        const pack = game.packs.get('pf2e.spells-srd'), row = (await pack.getIndex()).find(item => item.name === name);
        assert(row, `Missing native fixture ${name}`);
        const source = (await pack.getDocument(row._id)).toObject(); delete source._id;
        source.system.location = {value: entry.id};
        if (custom) { source.name = 'Custom recurring spell'; source.system.slug = 'custom-recurring-spell'; delete source._stats.compendiumSource; }
        const [spell] = await caster.createEmbeddedDocuments('Item', [source]);
        return {caster, casterToken, spell};
    };
    const state = card => game.messages.get(card.id).getFlag(NS, 'basicSaveState');
    const resolve = async (card, chosen) => {
        for (const [index, target] of state(card).targets.entries()) {
            await api.saves.rollSave(card, target.id, {skipDialog: true});
            await api.saves.correctTarget(card, target.id, {action: 'degree', degree: chosen[index] ?? chosen[0]});
        }
        await api.saves.finalize(card);
    };
    const cast = async (fixture, targets, chosen) => {
        const plan = await api.compile(fixture.spell);
        assert(api.saves.supports(plan), `${fixture.spell.name}: executable save plan`);
        const {card} = await api.saves.start(fixture.spell, {sourceActor: fixture.caster, plan, targets, castRank: fixture.spell.rank, dc: 24, skipConfirmation: true});
        await resolve(card, chosen); return card;
    };
    const combat = async participants => {
        const previous = game.combat?.id ?? null;
        const encounter = await Combat.create({scene: canvas.scene.id, active: false});
        saved.combats.push(encounter.id); await persist();
        await encounter.activate();
        await encounter.createEmbeddedDocuments('Combatant', participants.map(([token, initiative]) =>
            ({actorId: token.actorId, tokenId: token.id, sceneId: canvas.scene.id, initiative})));
        await encounter.startCombat();
        return {encounter, previous};
    };
    // Advance one turn and let the coordinator reconcile the boundary.
    const next = async encounter => { await encounter.nextTurn(); await wait(300); await api.ongoing.reconcile({clockEvent: true}); await wait(300); };
    const journalFor = card => api.ongoing.records().find(record => record.castId === state(card).castId);
    const recurringCards = castId => game.messages.contents.filter(message => message.getFlag(NS, 'ongoingCastId') === castId
        && message.getFlag(NS, 'basicSaveState')?.spellName?.endsWith('end-of-turn save'));
    const record = async (label, fn) => {
        let result;
        try { result = {label, passed: true, at: new Date().toISOString(), details: await fn()}; }
        catch (error) { result = {label, passed: false, error: error.message, stack: error.stack}; }
        saved.results.push(result); await persist(); return result;
    };
    return {api, saved, persist, actor, token, setup, state, resolve, cast, combat, next, journalFor, recurringCards, record};
}

const effectsOf = actor => actor.items.filter(item => item.type === 'effect' && item.flags?.[NS]?.outcomeEffect);

export const cases = {
    async environment() {
        return {foundry: game.version, pf2e: game.system.version, module: game.modules.get(NS).version, world: game.world.id,
            modules: [...game.modules.values()].filter(m => m.active).map(m => m.id), removal: game.pf2e.settings.automation.removeEffects};
    },
    async degrees(ctx) {
        const out = [];
        for (const [name, expected] of [
            ['Confusion', {criticalSuccess: [], success: [['stunned', 1, null]], failure: [['confused', null, 'end']], criticalFailure: [['confused', null, null]]}],
            ['Paralyze', {criticalSuccess: [], success: [['stunned', 1, null]], failure: [['paralyzed', null, null]], criticalFailure: [['paralyzed', null, 'reduce']]}]
        ]) {
            const fixture = await ctx.setup(name, {custom: true});
            const recipients = await Promise.all(degrees.map(degree => ctx.actor(`${name} ${degree}`)));
            const tokens = await Promise.all(recipients.map(ctx.token));
            const card = await ctx.cast(fixture, tokens, degrees);
            for (const [index, degree] of degrees.entries()) {
                const recipient = recipients[index];
                const got = effectsOf(recipient).flatMap(effect => effect.flags[NS].outcomeEffect.conditions.map(condition =>
                    [condition.slug, recipient.getCondition(condition.slug)?.value ?? null, effect.flags[NS].outcomeEffect.recurringSave?.mode ?? null]));
                assert(JSON.stringify(got) === JSON.stringify(expected[degree]), `${name}/${degree}: ${JSON.stringify(got)}`);
                for (const effect of effectsOf(recipient).filter(e => e.flags[NS].outcomeEffect.recurringSave)) {
                    assert(effect.flags[NS].outcomeEffect.recurringSave.dc === 24 && effect.flags[NS].outcomeEffect.recurringSave.statistic === 'will', 'Recurring save snapshots DC and statistic');
                }
                out.push({name, degree, conditions: got, durations: effectsOf(recipient).map(e => e.system.duration)});
            }
            assert(ctx.state(card).status === 'completed', `${name}: completed`);
        }
        return out;
    },
    async endMode(ctx) {
        assert(!game.combat?.started, 'No campaign combat may be running.');
        const fixture = await ctx.setup('Confusion', {custom: true});
        const [confused, critical] = [await ctx.actor('end-mode confused'), await ctx.actor('end-mode no save')];
        const [a, b] = [await ctx.token(confused), await ctx.token(critical)];
        const {encounter, previous} = await ctx.combat([[fixture.casterToken, 30], [a, 20], [b, 10]]);
        try {
            const card = await ctx.cast(fixture, [a, b], ['failure', 'criticalFailure']);
            const castId = ctx.state(card).castId;
            assert(confused.hasCondition('confused') && critical.hasCondition('confused'), 'Both confused');
            await ctx.next(encounter); // caster -> confused target
            assert(ctx.recurringCards(castId).length === 0, 'No save before the bearer ends its turn');
            await ctx.next(encounter); // confused target's turn ended
            let cards = ctx.recurringCards(castId);
            assert(cards.length === 1, `One end-of-turn card after the bearer's turn, got ${cards.length}`);
            await ctx.api.ongoing.reconcile({clockEvent: true});
            assert(ctx.recurringCards(castId).length === 1, 'Repeated reconcile does not replay the boundary');
            await ctx.resolve(cards[0], ['failure']);
            assert(confused.hasCondition('confused'), 'A failed recurring save keeps Confused');
            await ctx.next(encounter); // no-save target's turn ended
            assert(ctx.recurringCards(castId).length === 1, 'The critical failure recipient gets no recurring save');
            await ctx.next(encounter); // new round: caster
            await ctx.next(encounter); // confused target turn
            await ctx.next(encounter); // its turn ended again
            cards = ctx.recurringCards(castId);
            assert(cards.length === 2, `A second boundary prepares a second card, got ${cards.length}`);
            await ctx.resolve(cards[1], ['success']);
            assert(!confused.hasCondition('confused') && critical.hasCondition('confused'), 'Success ends only that recipient\'s confusion');
            const journal = ctx.journalFor(card);
            return {castId, journalStatus: journal.status, entries: journal.entries.map(e => ({status: e.status, reason: e.reason ?? null})),
                obligations: journal.obligations.filter(o => o.kind === 'recurring-save').map(o => ({status: o.status, degree: o.degree}))};
        } finally { await encounter.delete(); if (previous) await game.combats.get(previous)?.activate(); }
    },
    async reduceMode(ctx) {
        assert(!game.combat?.started, 'No campaign combat may be running.');
        const fixture = await ctx.setup('Paralyze', {custom: true});
        const [slow, fast] = [await ctx.actor('reduce-mode paralyzed'), await ctx.actor('reduce-mode critical')];
        const [a, b] = [await ctx.token(slow), await ctx.token(fast)];
        const {encounter, previous} = await ctx.combat([[fixture.casterToken, 30], [a, 20], [b, 10]]);
        try {
            const card = await ctx.cast(fixture, [a, b], ['criticalFailure', 'criticalFailure']);
            const castId = ctx.state(card).castId;
            const effect = actor => effectsOf(actor).find(e => e.flags[NS].outcomeEffect.recurringSave);
            assert(effect(slow)?.system.duration.value === 4 && effect(fast)?.system.duration.value === 4, 'Both Paralyzed for 4 rounds');
            const cardFor = actor => ctx.recurringCards(castId).filter(c => ctx.state(c).targets[0].actorUuid === actor.uuid && ctx.state(c).status !== 'completed').at(-1);
            const trail = [];
            await ctx.next(encounter); await ctx.next(encounter); // slow target's round-1 turn ended
            await ctx.resolve(cardFor(slow), ['failure']);
            trail.push({round: 1, degree: 'failure', rounds: effect(slow)?.system.duration.value});
            assert(effect(slow)?.system.duration.value === 4, 'Failure keeps the full duration');
            await ctx.next(encounter); // fast target's round-1 turn ended
            await ctx.resolve(cardFor(fast), ['criticalSuccess']);
            assert(!effect(fast) && !fast.hasCondition('paralyzed'), 'Critical success ends paralysis immediately');
            trail.push({round: 1, degree: 'criticalSuccess', ended: true});
            await ctx.next(encounter); await ctx.next(encounter); // slow target's round-2 turn ended
            await ctx.resolve(cardFor(slow), ['success']);
            assert(effect(slow)?.system.duration.value === 3 && slow.hasCondition('paralyzed'), 'Success shortens the remaining duration by 1 round');
            trail.push({round: 2, degree: 'success', rounds: 3});
            // The shortened timer expires at the caster's round-4 turn start: the
            // round-3 boundary is immediately followed by expiry with nothing between.
            for (let step = 0; step < 4; step++) await ctx.next(encounter);
            assert(!effect(slow) && !slow.hasCondition('paralyzed'), 'Shortened timer expires one round earlier');
            const journal = ctx.journalFor(card);
            trail.push({expired: journal.entries.map(e => e.reason)});
            const orphans = journal.obligations.filter(o => o.kind === 'recurring-save' && !['completed'].includes(o.status));
            assert(orphans.every(o => o.status === 'skipped' && o.reason === 'effect-ended'), `Saves overtaken by expiry are closed, got ${JSON.stringify(orphans)}`);
            return {castId, trail, cards: ctx.recurringCards(castId).length, obligations: journal.obligations.map(o => ({status: o.status, degree: o.degree ?? null, reason: o.reason ?? null}))};
        } finally { await encounter.delete(); if (previous) await game.combats.get(previous)?.activate(); }
    },
    async jump(ctx) {
        assert(!game.combat?.started, 'No campaign combat may be running.');
        const fixture = await ctx.setup('Confusion', {custom: true});
        const target = await ctx.actor('jump confused'), other = await ctx.actor('jump bystander');
        const [a, b] = [await ctx.token(target), await ctx.token(other)];
        const {encounter, previous} = await ctx.combat([[fixture.casterToken, 30], [a, 20], [b, 10]]);
        try {
            const card = await ctx.cast(fixture, [a], ['failure']);
            await encounter.update({turn: 2}); await wait(300);
            await ctx.api.ongoing.reconcile({clockEvent: true});
            const journal = ctx.journalFor(card);
            assert(journal.status === 'review' && ctx.recurringCards(journal.castId).length === 0, 'A skipped turn goes to review without rolling');
            return {status: journal.status, reason: journal.reviewReason};
        } finally { await encounter.delete(); if (previous) await game.combats.get(previous)?.activate(); }
    },
    async prepareReload(ctx) {
        assert(!game.combat?.started, 'No campaign combat may be running.');
        const fixture = await ctx.setup('Confusion', {custom: true});
        const target = await ctx.actor('reload confused'), token = await ctx.token(target);
        const {encounter} = await ctx.combat([[fixture.casterToken, 30], [token, 20]]);
        const card = await ctx.cast(fixture, [token], ['failure']);
        await ctx.next(encounter); await ctx.next(encounter);
        const cards = ctx.recurringCards(ctx.state(card).castId);
        assert(cards.length === 1, 'Pending card before reload');
        await fixture.spell.delete();
        ctx.saved.cases.reload = {actorId: target.id, castId: ctx.state(card).castId, cardId: cards[0].id, combatId: encounter.id};
        await ctx.persist(); return ctx.saved.cases.reload;
    },
    async reload(ctx) {
        const c = ctx.saved.cases.reload, target = game.actors.get(c.actorId);
        await ctx.api.ongoing.reconcile();
        const card = game.messages.get(c.cardId);
        assert(card && target.hasCondition('confused'), 'Card and condition survive reload and source deletion');
        assert(ctx.recurringCards(c.castId).length === 1, 'Reload does not replay the boundary');
        await ctx.resolve(card, ['criticalSuccess']);
        assert(!target.hasCondition('confused'), 'Recovery save after reload ends the confusion');
        await game.combats.get(c.combatId)?.delete();
        return c;
    },
    // The Ongoing spells panel offers the pending save; the GM clicks it.
    async prepareUi(ctx) {
        const fixture = await ctx.setup('Confusion', {custom: true});
        const target = await ctx.actor('ui confused'), token = await ctx.token(target);
        const {encounter} = await ctx.combat([[fixture.casterToken, 30], [token, 20]]);
        const card = await ctx.cast(fixture, [token], ['failure']);
        await ctx.next(encounter); await ctx.next(encounter);
        const pending = ctx.recurringCards(ctx.state(card).castId);
        assert(pending.length === 1, 'One pending end-of-turn card');
        ctx.saved.cases.ui = {actorId: target.id, cardId: pending[0].id, combatId: encounter.id};
        await ctx.persist();
        await ctx.api.ongoing.open();
        return ctx.saved.cases.ui;
    },
    async verifyUi(ctx) {
        const c = ctx.saved.cases.ui, card = game.messages.get(c.cardId);
        const target = ctx.state(card).targets[0];
        assert(target.degree && Number.isFinite(target.saveTotal), 'The panel control rolled the native Will save');
        await ctx.api.saves.finalize(card);
        const ended = ['success', 'criticalSuccess'].includes(target.degree);
        assert(game.actors.get(c.actorId).hasCondition('confused') === !ended, `Degree ${target.degree} applied`);
        await game.combats.get(c.combatId)?.delete();
        return {degree: target.degree, total: target.saveTotal, natural: target.saveNatural, confusedAfter: !ended};
    },
    // The caster's Dismiss control ends every contribution of that one cast.
    async dismiss(ctx) {
        const fixture = await ctx.setup('Confusion', {custom: true});
        const [a, b, other] = [await ctx.actor('dismiss one'), await ctx.actor('dismiss two'), await ctx.actor('dismiss other cast')];
        const card = await ctx.cast(fixture, [await ctx.token(a), await ctx.token(b)], ['failure', 'criticalFailure']);
        const second = await ctx.cast(fixture, [await ctx.token(other)], ['failure']);
        const record = ctx.journalFor(card);
        assert(record.dismissal?.scope === 'cast', 'The ongoing record carries cast-wide dismissal');
        await ctx.api.ongoing.request('dismiss-cast', {castId: record.castId, revision: record.revision});
        assert(!a.hasCondition('confused') && !b.hasCondition('confused'), 'Dismiss ends both recipients of this cast');
        assert(other.hasCondition('confused'), 'Another cast of the same spell is unaffected');
        const ended = ctx.journalFor(card);
        return {status: ended.status, endReason: ended.endReason, otherCast: ctx.journalFor(second).status};
    },
    async cleanup(ctx) {
        for (const id of ctx.saved.combats ?? []) await game.combats.get(id)?.delete();
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
        ctx.saved.actors = []; ctx.saved.combats = []; await ctx.persist();
        assert(!game.actors.some(a => a.getFlag(NS, FIXTURE)), 'No recurring fixture actors remain');
        return {actorsRemoved: ids.size, journalsRemoved: records.length, remainingFixtureActors: 0};
    }
};

export async function runCase(name) {
    const ctx = await context();
    assert(cases[name], `Unknown case ${name}`);
    return await ctx.record(name, () => cases[name](ctx));
}
export function results() { return store().saved; }
export async function reset() { const {saved, persist} = store(); saved.results = []; saved.cases = {}; await persist(); return saved; }
