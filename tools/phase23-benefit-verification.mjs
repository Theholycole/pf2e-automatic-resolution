// Explicit disposable-world checks for damage-derived consequences: death at
// 0 HP and caster temporary HP / healing. Spell names select fixtures only.
const NS = 'pf2e-automatic-resolution', KEY = 'phase23BenefitVerification', FIXTURE = 'phase23BenefitFixture';
const assert = (value, message) => { if (!value) throw Error(message); };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function store() {
    const saved = game.user.getFlag(NS, KEY) ?? {results: [], actors: [], cases: {}};
    return {saved, persist: () => game.user.setFlag(NS, KEY, saved)};
}

async function context() {
    assert(game.world.id === 'pftest' && game.user.isGM, 'Disposable pftest GM only.');
    const api = game.modules.get(NS).api;
    const {saved, persist} = store();
    const actor = async (name, {level = 5, hp = 500, max = 500, traits = ['humanoid'], resistances = []} = {}) => {
        const document = await Actor.create({name: `PFTEST P23 Benefit ${name}`, type: 'npc', flags: {[NS]: {[FIXTURE]: true}},
            system: {details: {level: {value: level}}, attributes: {hp: {value: hp, max, temp: 0}, ac: {value: 20}, resistances},
                saves: {fortitude: {value: 10}, reflex: {value: 10}, will: {value: 10}}, traits: {value: traits}}});
        saved.actors.push(document.id); await persist(); return document;
    };
    const token = async actor => (await canvas.scene.createEmbeddedDocuments('Token', [{...actor.prototypeToken.toObject(), actorId: actor.id, actorLink: true, x: 1400, y: 1400}]))[0];
    const setup = async (name, {casterHp = 500, rank = null, custom = false} = {}) => {
        const pack = game.packs.get('pf2e.spells-srd'), row = (await pack.getIndex()).find(item => item.name === name);
        assert(row, `Missing native fixture ${name}`);
        const source = (await pack.getDocument(row._id)).toObject(); delete source._id;
        const castRank = rank ?? source.system.level.value;
        const caster = await actor(`${name} caster`, {level: castRank * 2 - 1, hp: casterHp});
        const casterToken = await token(caster);
        const [entry] = await caster.createEmbeddedDocuments('Item', [{name: 'General rules casting', type: 'spellcastingEntry',
            system: {tradition: {value: 'occult'}, prepared: {value: 'innate'}, spelldc: {dc: 24, value: 14}}}]);
        source.system.location = {value: entry.id};
        if (custom) { source.name = 'Custom draining spell'; source.system.slug = 'custom-draining-spell'; delete source._stats.compendiumSource; }
        const [spell] = await caster.createEmbeddedDocuments('Item', [source]);
        assert(spell.rank === castRank, `${name}: PF2e resolves rank ${castRank}`);
        return {caster, casterToken, spell};
    };
    const state = card => game.messages.get(card.id).getFlag(NS, 'basicSaveState');
    const start = async (fixture, targets) => {
        const plan = await api.compile(fixture.spell);
        assert(api.saves.supports(plan), `${fixture.spell.name}: executable save plan`);
        return (await api.saves.start(fixture.spell, {sourceActor: fixture.caster, plan, targets, castRank: fixture.spell.rank, dc: 24, skipConfirmation: true})).card;
    };
    const cast = async (fixture, targets, chosen) => {
        const card = await start(fixture, targets);
        for (const [index, target] of state(card).targets.entries()) {
            if (target.eligible === false) continue;
            await api.saves.rollSave(card, target.id, {skipDialog: true});
            await api.saves.correctTarget(card, target.id, {action: 'degree', degree: chosen[index] ?? chosen[0]});
        }
        await api.saves.finalize(card);
        return card;
    };
    const dealt = target => (target.damageResults ?? []).reduce((total, result) => total + Number(result.receipt?.damage ?? 0), 0);
    const temp = actor => Number(actor.system.attributes.hp.temp ?? 0);
    const benefitEffect = actor => actor.items.find(item => item.type === 'effect' && item.flags?.[NS]?.outcomeEffect?.casterBenefit);
    const record = async (label, fn) => {
        let result;
        try { result = {label, passed: true, at: new Date().toISOString(), details: await fn()}; }
        catch (error) { result = {label, passed: false, error: error.message, stack: error.stack}; }
        saved.results.push(result); await persist(); return result;
    };
    return {api, saved, persist, actor, token, setup, state, start, cast, dealt, temp, benefitEffect, record};
}

export const cases = {
    async environment() {
        return {foundry: game.version, pf2e: game.system.version, module: game.modules.get(NS).version, world: game.world.id,
            modules: [...game.modules.values()].filter(m => m.active).map(m => m.id), removal: game.pf2e.settings.automation.removeEffects};
    },
    // Half the void damage each single target takes, after resistance.
    async feast(ctx) {
        const out = [];
        for (const [degree, resist] of [['criticalSuccess', 0], ['success', 0], ['failure', 0], ['criticalFailure', 0], ['failure', 5]]) {
            const fixture = await ctx.setup('Vampiric Feast');
            const target = await ctx.actor(`feast ${degree} r${resist}`, {resistances: resist ? [{type: 'void', value: resist, exceptions: [], doubleVs: []}] : []});
            const card = await ctx.cast(fixture, [await ctx.token(target)], [degree]);
            const s = ctx.state(card), damage = ctx.dealt(s.targets[0]), expected = Math.floor(damage / 2);
            assert(500 - target.hitPoints.value === damage, `${degree}: receipt equals HP lost`);
            assert(s.casterBenefitResult.amount === expected && ctx.temp(fixture.caster) === expected, `${degree}: caster temp HP ${expected}, got ${ctx.temp(fixture.caster)}`);
            assert(expected === 0 ? !ctx.benefitEffect(fixture.caster) : ctx.benefitEffect(fixture.caster)?.system.duration.value === 1, `${degree}: 1-minute Effect only when positive`);
            out.push({degree, resist, damage, temp: ctx.temp(fixture.caster)});
        }
        return out;
    },
    async stacking(ctx) {
        const fixture = await ctx.setup('Vampiric Feast');
        await fixture.caster.update({'system.attributes.hp.temp': 200});
        const target = await ctx.actor('stacking target');
        const card = await ctx.cast(fixture, [await ctx.token(target)], ['criticalFailure']);
        const s = ctx.state(card);
        assert(s.casterBenefitResult.status === 'kept-existing' && ctx.temp(fixture.caster) === 200 && !ctx.benefitEffect(fixture.caster), 'Higher existing temp HP is kept; no dangling Effect');
        const low = await ctx.setup('Vampiric Feast');
        await low.caster.update({'system.attributes.hp.temp': 1});
        const target2 = await ctx.actor('stacking replace target');
        const card2 = await ctx.cast(low, [await ctx.token(target2)], ['criticalFailure']);
        const expected = Math.floor(ctx.dealt(ctx.state(card2).targets[0]) / 2);
        assert(ctx.temp(low.caster) === expected, 'Higher new temp HP replaces lower');
        return {kept: s.casterBenefitResult, replaced: expected};
    },
    async expiry(ctx) {
        assert(!game.combat?.started, 'No combat for world-time checks');
        const fixture = await ctx.setup('Vampiric Feast', {custom: true});
        const target = await ctx.actor('expiry target');
        await ctx.cast(fixture, [await ctx.token(target)], ['criticalFailure']);
        const granted = ctx.temp(fixture.caster);
        assert(granted > 0, 'Temp HP granted');
        await fixture.spell.delete();
        await game.time.advance(59); await ctx.api.ongoing.reconcile({clockEvent: true}); await wait(300);
        assert(ctx.temp(fixture.caster) === granted, 'Temp HP remain before 1 minute');
        await game.time.advance(2); await ctx.api.ongoing.reconcile({clockEvent: true}); await wait(500);
        assert(ctx.temp(fixture.caster) === 0 && !ctx.benefitEffect(fixture.caster), 'Remaining temp HP are lost after 1 minute');
        return {granted};
    },
    // Most-damaged living creature; undead in the area are not recipients.
    async exsanguination(ctx) {
        const fixture = await ctx.setup('Vampiric Exsanguination');
        const living = [await ctx.actor('exsang living A'), await ctx.actor('exsang living B', {resistances: [{type: 'void', value: 10, exceptions: [], doubleVs: []}]})];
        const undead = await ctx.actor('exsang undead', {traits: ['undead']});
        const card = await ctx.cast(fixture, [...await Promise.all(living.map(ctx.token)), await ctx.token(undead)], ['failure', 'criticalFailure', 'failure']);
        const s = ctx.state(card);
        assert(s.targets[2].eligible === false && undead.hitPoints.value === 500, 'Undead is not a living recipient');
        const damages = s.targets.slice(0, 2).map(ctx.dealt), expected = Math.floor(Math.max(...damages) / 2);
        assert(s.casterBenefitResult.amount === expected && ctx.temp(fixture.caster) === expected, `Temp HP from the most-damaged creature: ${expected}`);
        return {damages, expected};
    },
    // Heal the caster, then excess as temporary HP; 60 damage kills a 40 HP target.
    async devour(ctx) {
        const out = [];
        for (const [label, casterHp, targetHp, degree] of [['wounded caster', 470, 500, 'failure'], ['full caster', 500, 40, 'failure'], ['sturdy', 500, 500, 'success']]) {
            const fixture = await ctx.setup('Devour Life', {casterHp});
            const target = await ctx.actor(`devour ${label}`, {hp: targetHp, max: 500});
            const card = await ctx.cast(fixture, [await ctx.token(target)], [degree]);
            const s = ctx.state(card), damage = ctx.dealt(s.targets[0]), amount = Math.floor(damage / 2);
            const healed = Math.min(amount, 500 - casterHp);
            assert(fixture.caster.hitPoints.value === casterHp + healed, `${label}: healed ${healed}`);
            assert(ctx.temp(fixture.caster) === amount - healed, `${label}: excess ${amount - healed} as temp HP`);
            const dead = target.statuses.has('dead');
            assert(dead === (targetHp - damage <= 0), `${label}: dies only when this damage reduces it to 0`);
            if (dead) assert(!target.hasCondition('dying') && !target.hasCondition('unconscious'), 'Dead, not dying');
            out.push({label, damage, amount, healed, temp: ctx.temp(fixture.caster), dead});
        }
        return out;
    },
    // Temporary HP only when the spell kills.
    async hunger(ctx) {
        const out = [];
        for (const [label, targetHp] of [['kill', 1], ['survive', 500]]) {
            const fixture = await ctx.setup('All-Encompassing Hunger');
            const target = await ctx.actor(`hunger ${label}`, {hp: targetHp, max: 500});
            const card = await ctx.cast(fixture, [await ctx.token(target)], ['criticalFailure']);
            const s = ctx.state(card), damage = ctx.dealt(s.targets[0]);
            const killed = target.statuses.has('dead');
            assert(killed === (label === 'kill'), `${label}: death`);
            assert(ctx.temp(fixture.caster) === (killed ? damage : 0), `${label}: temp HP ${killed ? damage : 0}`);
            out.push({label, damage, killed, temp: ctx.temp(fixture.caster)});
        }
        return out;
    },
    async vision(ctx) {
        const out = [];
        for (const [label, hp, degree] of [['killed', 5, 'criticalFailure'], ['survives', 500, 'criticalFailure'], ['already down', 0, 'failure']]) {
            const fixture = await ctx.setup('Vision of Death');
            const target = await ctx.actor(`vision ${label}`, {hp, max: 500});
            await ctx.cast(fixture, [await ctx.token(target)], [degree]);
            const dead = target.statuses.has('dead');
            assert(dead === (label === 'killed'), `${label}: dead ${dead}`);
            out.push({label, dead, hp: target.hitPoints.value, frightened: target.getCondition('frightened')?.value ?? null});
        }
        return out;
    },
    async refusal(ctx) {
        const fixture = await ctx.setup('Vampiric Feast');
        const targets = [await ctx.actor('refusal A'), await ctx.actor('refusal B')];
        const card = await ctx.start(fixture, await Promise.all(targets.map(ctx.token)));
        for (const target of ctx.state(card).targets) {
            await ctx.api.saves.rollSave(card, target.id, {skipDialog: true});
            await ctx.api.saves.correctTarget(card, target.id, {action: 'degree', degree: 'failure'});
        }
        let error = null; try { await ctx.api.saves.finalize(card); } catch (caught) { error = caught.message; }
        assert(error && targets.every(a => a.hitPoints.value === 500) && ctx.temp(fixture.caster) === 0, 'Two targets for a single-target benefit are refused before any damage');
        return {error};
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
        assert(!game.actors.some(a => a.getFlag(NS, FIXTURE)), 'No benefit fixture actors remain');
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
