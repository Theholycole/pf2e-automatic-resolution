import { MODULE_ID } from "./effect-runtime.js";
import {
    damageMultiplierForTarget,
    basicSaveReadiness,
    saveCollectionReadiness,
    checkRollSkipDialog,
    isExecutableDegreeSavePlan,
    isExecutableSavePlan,
    normalizeSaveDegree,
    outcomeDamageRollIds,
    outcomeForTarget,
    readableSaveDegree,
    recordProvisionalSave,
    recordSecondarySave,
    requiredOutcomeDamageRolls,
    secondaryOutcomeForTarget,
    secondarySaveForTarget,
    sharedDamageRequired,
    SAVE_DEGREES,
    validateActorTarget
} from "./basic-save-core.js";
import {
    activeUsers,
    actorFromTarget,
    clone,
    confirmAction,
    escapeHTML,
    randomID
} from "./runtime-utils.js";
import { debugError, debugLog } from "./debug.js";

const SAVE_SCHEMA = 7;
const SAVE_OPTION_PREFIX = "pf2e-auto-basic-save";

function tokenDocumentFromTarget(target) {
    if (!target || target.documentName === "Actor") return null;
    if (target.document?.documentName === "Token") return target.document;
    return target.documentName === "Token" ? target : null;
}

function tokenUuidFromSyntheticActorUuid(actorUuid) {
    return String(actorUuid ?? "").match(/^(Scene\.[^.]+\.Token\.[^.]+)(?:\.Actor\.[^.]+)?$/)?.[1] ?? null;
}

async function resolveTargetDocuments(target) {
    const tokenUuid = target.tokenUuid ?? tokenUuidFromSyntheticActorUuid(target.actorUuid);
    const resolvedToken = tokenUuid ? await fromUuid(tokenUuid) : null;
    const token = tokenDocumentFromTarget(resolvedToken) ?? resolvedToken;
    const actor = token?.actor ?? await fromUuid(target.actorUuid);
    return { actor, token };
}

function assertPersistedTargetIdentity(target, actor) {
    if (actor && actor.uuid !== target.actorUuid) {
        throw new Error(`${target.name}: the persisted token now resolves to a different actor. Results were not applied.`);
    }
}

function snapshotTargets(targets, constraints) {
    const records = new Map();
    for (const target of Array.isArray(targets) ? targets : [...(targets ?? [])]) {
        const actor = actorFromTarget(target);
        if (!actor || records.has(actor.uuid)) continue;
        const token = tokenDocumentFromTarget(target);
        const eligibility = validateActorTarget(constraints, actor);
        records.set(actor.uuid, {
            id: randomID(),
            actorUuid: actor.uuid,
            tokenUuid: token?.uuid ?? null,
            name: actor.name,
            eligible: eligibility.eligible,
            eligibilityReason: eligibility.reason,
            degree: null,
            saveMessageId: null,
            saveTimestamp: 0,
            rollRevision: 0,
            reroll: false,
            saveTotal: null,
            saveNatural: null,
            saveModifier: null,
            lastSubmissionId: null,
            secondary: null,
            supportsHeroPoints: typeof actor.isOfType === "function"
                ? actor.isOfType("character")
                : actor.type === "character",
            applicationStatus: eligibility.eligible ? "pending" : "unaffected",
            hpBefore: null,
            hpAfter: null,
            damageResults: [],
            effectUuids: [],
            conditionResults: [],
            terminalResult: null,
            terminalApplied: false,
            reviewRequired: false
        });
    }
    return [...records.values()];
}

function normalizeDC(value) {
    const dc = Number(value);
    return Number.isFinite(dc) && dc > 0 ? dc : null;
}

function spellDC(spell, actor) {
    const candidates = [
        spell?.spellcasting?.statistic?.dc?.value,
        spell?.spellcasting?.statistic?.dc,
        spell?.spellcasting?.dc?.value,
        actor?.getStatistic?.("spell-dc")?.dc?.value,
        actor?.system?.attributes?.spellDC?.value,
        actor?.system?.attributes?.classOrSpellDC?.value
    ];
    return candidates.map(normalizeDC).find(Boolean) ?? null;
}

function resolveSpellAtRank(spell, castRank) {
    if (typeof spell?.loadVariant !== "function" || Number(spell.rank) === Number(castRank)) return spell;
    try { return spell.loadVariant({ castRank }) ?? spell; }
    catch (error) {
        console.warn(`${MODULE_ID} | Could not load the rank-${castRank} variant of ${spell?.name}.`, error);
        return spell;
    }
}

function degreeFromMessage(message) {
    const pf2e = message.flags?.pf2e ?? {};
    const roll = message.rolls?.[0];
    for (const candidate of [
        pf2e.context?.outcome,
        pf2e.context?.degreeOfSuccess,
        pf2e.context?.degree,
        pf2e.outcome,
        pf2e.degreeOfSuccess,
        roll?.degreeOfSuccess,
        roll?.options?.degreeOfSuccess,
        message.system?.degreeOfSuccess
    ]) {
        const degree = normalizeSaveDegree(candidate);
        if (degree) return degree;
    }
    return null;
}

function isRerollMessage(message) {
    const context = message.flags?.pf2e?.context ?? {};
    const options = Array.isArray(context.options) ? context.options : [];
    return context.isReroll === true
        || options.includes("check:reroll")
        || options.includes("check:reroll:hero-points");
}

function saveReference(message) {
    const options = message.flags?.pf2e?.context?.options ?? [];
    for (const option of Array.isArray(options) ? options : []) {
        const match = String(option).match(new RegExp(`^${SAVE_OPTION_PREFIX}:([^:]+):([^:]+)$`));
        if (match) return { castId: match[1], targetId: match[2] };
    }
    return null;
}

function messageActor(message) {
    try { if (message.actor) return message.actor; } catch (_) {}
    const actorId = message.speaker?.actor;
    return actorId ? game.actors.get(actorId) ?? null : null;
}

function isCardCoordinator(card) {
    const users = activeUsers();
    const leader = users.find(user => user.isGM)
        ?? users.find(user => user.id === card?.author?.id)
        ?? users[0]
        ?? null;
    return !leader || leader.id === game.user.id;
}

function hpValue(actor) {
    const value = Number(actor?.system?.attributes?.hp?.value);
    return Number.isFinite(value) ? value : null;
}

function initiativeForActor(actor) {
    return game.combat?.combatants?.find(combatant => combatant.actor?.uuid === actor?.uuid)?.initiative ?? null;
}

function heightenOutcomeFormula(entry, baseRank, castRank) {
    const steps = entry.heightening?.type === "interval"
        ? Math.max(0, Math.floor((castRank - baseRank) / entry.heightening.interval))
        : 0;
    if (!steps) return entry.formula;
    const base = /^(\d+)d(\d+)(\[[^\]]+\])$/i.exec(entry.formula);
    const increase = /^(\d+)d(\d+)$/i.exec(entry.heightening.formula);
    if (!base || !increase || base[2] !== increase[2]) {
        throw new Error(`Unsupported outcome damage heightening: ${entry.formula} + ${entry.heightening.formula}.`);
    }
    return `${Number(base[1]) + steps * Number(increase[1])}d${base[2]}${base[3]}`;
}

function snapshotEffect(effect) {
    return {
        kind: effect.kind,
        slug: effect.slug,
        name: effect.name,
        value: effect.value,
        duration: clone(effect.duration)
    };
}

function snapshotOutcomes(plan, castRank) {
    const rollByFormula = new Map();
    const snapshotDamage = (source, scope) => {
        const damage = clone(source);
        for (const entry of damage.formulas ?? []) {
            entry.formula = heightenOutcomeFormula(entry, Number(plan.rank), castRank);
            const key = `${scope}:${entry.formula}`;
            let roll = rollByFormula.get(key);
            if (!roll) {
                roll = {
                    id: `outcome-damage-${rollByFormula.size + 1}`,
                    formula: entry.formula,
                    rollJSON: null,
                    total: null,
                    instances: [],
                    rollOptions: []
                };
                rollByFormula.set(key, roll);
            }
            entry.rollId = roll.id;
        }
        return damage;
    };
    const snapshotSecondary = (followUp, primaryDegree, index) => {
        const id = `secondary-${primaryDegree}-${index + 1}`;
        return {
            id,
            timing: clone(followUp.timing),
            check: clone(followUp.check),
            outcomes: Object.fromEntries(SAVE_DEGREES.map(degree => {
                const outcome = followUp.outcomes[degree];
                return [degree, {
                    damage: snapshotDamage(outcome.damage, id),
                    effects: clone(outcome.effects ?? []).map(snapshotEffect),
                    terminal: clone(outcome.terminal)
                }];
            }))
        };
    };
    const outcomes = Object.fromEntries(SAVE_DEGREES.map(degree => {
        const outcome = plan.resolution.outcomes[degree];
        return [degree, {
            damage: snapshotDamage(outcome.damage, "primary"),
            effects: clone(outcome.effects ?? []).map(snapshotEffect),
            followUps: (outcome.followUps ?? []).map((followUp, index) =>
                snapshotSecondary(followUp, degree, index))
        }];
    }));
    return { outcomes, outcomeRolls: [...rollByFormula.values()] };
}

function planUsesSharedDamage(plan) {
    return SAVE_DEGREES.some(degree => {
        const outcome = plan.resolution.outcomes?.[degree];
        return ["shared", "mixed"].includes(outcome?.damage?.mode)
            || (outcome?.followUps ?? []).some(followUp => SAVE_DEGREES.some(secondaryDegree =>
                followUp.outcomes?.[secondaryDegree]?.damage?.mode === "primary-shared"));
    });
}

function synchronizeSecondary(state, target) {
    const followUp = (outcomeForTarget(state, target)?.followUps ?? [])[0] ?? null;
    if (!followUp) {
        target.secondary = null;
        return null;
    }
    if (target.secondary?.followUpId === followUp.id) return target.secondary;
    target.secondary = {
        followUpId: followUp.id,
        degree: null,
        rollRevision: 0,
        reroll: false,
        saveTotal: null,
        saveNatural: null,
        saveModifier: null,
        lastSubmissionId: null,
        reviewRequired: false
    };
    return target.secondary;
}

function outcomeEffectsForTarget(state, target) {
    const primary = outcomeForTarget(state, target)?.effects ?? [];
    const secondaryOutcome = secondaryOutcomeForTarget(state, target);
    return [...primary, ...(secondaryOutcome?.effects ?? [])];
}

function existingCondition(actor, slug) {
    try {
        const matches = actor.conditions?.bySlug?.(slug);
        if (matches?.length) return matches.find(condition => condition.active) ?? matches[0];
    } catch (_) {}
    return actor.items?.find(item => item.type === "condition" && item.slug === slug && item.active !== false) ?? null;
}

function conditionValue(condition) {
    for (const candidate of [condition?.value, condition?.system?.value?.value, condition?.system?.badge?.value]) {
        const value = Number(candidate);
        if (Number.isFinite(value)) return value;
    }
    return 0;
}

async function clearConditionCompletely(actor, slug) {
    for (let attempt = 0; attempt < 12; attempt++) {
        const before = existingCondition(actor, slug);
        if (!before) return;
        const value = conditionValue(before);
        if (typeof actor.decreaseCondition === "function") await actor.decreaseCondition(slug);
        else if (before.delete && before.readonly !== true) await before.delete();
        else return;
        const after = existingCondition(actor, slug);
        if (!after || (after.id === before.id && conditionValue(after) === value)) return;
    }
}

async function applyTerminalDeath(state, target, actor, terminal) {
    if (typeof actor.toggleStatusEffect !== "function") {
        throw new Error(`${target.name} does not expose PF2e's dead-status control.`);
    }
    if (!actor.statuses?.has?.("dead")) await actor.toggleStatusEffect("dead", { active: true });
    if (actor.statuses?.has?.("dead") !== true) {
        throw new Error(`PF2e did not confirm the Dead status on ${target.name}.`);
    }
    await clearConditionCompletely(actor, "dying");
    await clearConditionCompletely(actor, "unconscious");
    target.terminalResult = clone(terminal);
    target.terminalApplied = true;
    debugLog(state.castId, "terminal death applied", {
        targetId: target.id,
        actorUuid: actor.uuid,
        label: terminal.label ?? "Dies"
    });
}

function conditionLabel(condition) {
    return `${condition.name}${condition.value == null ? "" : ` ${condition.value}`}`;
}

const DAMAGE_ICONS = Object.freeze({
    acid: "vial",
    bleed: "droplet",
    bludgeoning: "hammer",
    cold: "snowflake",
    electricity: "bolt",
    fire: "fire",
    force: "sparkles",
    mental: "brain",
    piercing: "bow-arrow",
    poison: "spider",
    slashing: "axe",
    sonic: "waveform-lines",
    spirit: "ghost",
    vitality: "sun",
    void: "skull"
});

function damageTypeFromFormula(formula) {
    const configured = CONFIG.PF2E?.damageTypes ?? {};
    const types = String(formula ?? "").match(/\[([^\]]+)\]/g)?.flatMap(group =>
        group.slice(1, -1).split(",").map(value => value.trim())) ?? [];
    return types.find(type => Object.hasOwn(configured, type) || type in DAMAGE_ICONS) ?? "untyped";
}

function damageTypeLabel(type, persistent = false) {
    const key = CONFIG.PF2E?.damageTypes?.[type];
    const localized = key && globalThis.game?.i18n?.localize ? game.i18n.localize(key) : null;
    const label = localized && localized !== key
        ? localized
        : type.replace(/(^|-)([a-z])/g, (_match, separator, letter) => `${separator ? " " : ""}${letter.toUpperCase()}`);
    return `${persistent ? "Persistent " : ""}${label} Damage`;
}

function damageInstances(roll, fallback = {}) {
    const instances = Array.isArray(roll?.instances) ? roll.instances : [];
    if (!instances.length) return [{
        type: damageTypeFromFormula(fallback.formula ?? roll?.formula),
        formula: fallback.formula ?? roll?.formula ?? null,
        total: Number.isFinite(Number(fallback.total ?? roll?.total)) ? Number(fallback.total ?? roll.total) : null,
        persistent: /\[([^\]]*,)?persistent(,[^\]]*)?\]/i.test(fallback.formula ?? roll?.formula ?? "")
    }];
    return instances.map(instance => ({
        type: instance.type ?? damageTypeFromFormula(instance.formula),
        formula: instance.head?.expression ?? instance.formula ?? null,
        total: Number.isFinite(Number(instance.total)) ? Number(instance.total) : null,
        persistent: instance.persistent === true
    }));
}

function damageBadge(part, { multiplier = 1 } = {}) {
    const type = part.type ?? damageTypeFromFormula(part.formula);
    const icon = DAMAGE_ICONS[type];
    const persistent = part.persistent === true;
    const value = persistent
        ? String(part.formula ?? "Persistent damage").replace(/\[[^\]]+\]/g, "").trim()
        : part.total ?? "—";
    const multiplierLabel = multiplier !== 1 ? `<small>×${escapeHTML(multiplier)}</small>` : "";
    return `<span class="damage color ${escapeHTML(type)} pf2e-auto-damage-result"
        title="${escapeHTML(damageTypeLabel(type, persistent))}">
        ${multiplierLabel}<strong>${escapeHTML(value)}</strong>
        ${persistent ? '<i class="fa-duotone fa-hourglass pf2e-auto-damage-icon"></i>' : ""}
        ${icon ? `<i class="fa-solid fa-${icon} pf2e-auto-damage-icon"></i>` : ""}
        <span>${escapeHTML(damageTypeLabel(type, persistent))}</span>
    </span>`;
}

function damageParts(entry) {
    return entry?.instances?.length ? entry.instances : [{
        type: damageTypeFromFormula(entry?.formula),
        formula: entry?.formula,
        total: entry?.total,
        persistent: /persistent/i.test(entry?.formula ?? "")
    }];
}

function damageRollBadges(entry) {
    const parts = damageParts(entry);
    return `<div class="pf2e-auto-damage-results">${parts.map(part => damageBadge(part)).join("")}</div>`;
}

function saveResultBadge(target) {
    if (!target.degree) return "Not rolled";
    const total = target.saveTotal == null ? "" : `<strong>${escapeHTML(target.saveTotal)}</strong> `;
    const breakdown = target.saveNatural == null || target.saveModifier == null
        ? ""
        : `<small>d20 ${escapeHTML(target.saveNatural)} ${target.saveModifier >= 0 ? "+" : "−"}${escapeHTML(Math.abs(target.saveModifier))}</small>`;
    const detail = target.saveNatural == null
        ? ""
        : ` title="Natural ${escapeHTML(target.saveNatural)}${target.saveModifier == null ? "" : `; modifier ${target.saveModifier >= 0 ? "+" : ""}${escapeHTML(target.saveModifier)}`}"`;
    return `<span class="pf2e-auto-save-result ${escapeHTML(target.degree)}"${detail}>
        <i class="fa-solid fa-dice-d20"></i> ${total}${escapeHTML(readableSaveDegree(target.degree))}${breakdown}
    </span>`;
}

function conditionDuration(condition, lifecycle) {
    if (condition.duration == null
        && condition.slug === "stunned"
        && Number.isInteger(condition.value)
        && condition.value >= 1
        && condition.value <= 3) {
        return {
            value: 1,
            unit: "rounds",
            expiry: "turn-start",
            anchor: "target-turn",
            derived: "stunned-action-debt"
        };
    }
    const duration = condition.duration ?? (lifecycle?.durationSpec?.mode === "fixed"
        ? lifecycle.durationSpec
        : null);
    if (!duration || duration.mode === "unlimited") {
        return { value: -1, unit: "unlimited", expiry: null, anchor: "effect-start" };
    }
    return {
        value: Number(duration.value),
        unit: duration.unit,
        expiry: duration.expiry ?? null,
        anchor: duration.anchor ?? "effect-start"
    };
}

function conditionGrant(condition, ruleFlag, multiple) {
    const template = game.pf2e?.ConditionManager?.getCondition(condition.slug);
    if (!template) throw new Error(`PF2e condition ${condition.slug} is unavailable.`);
    const valued = template.system?.value?.isValued === true;
    if (valued && !Number.isInteger(condition.value)) {
        throw new Error(`${condition.name} requires a compiled condition value.`);
    }
    if (!valued && condition.value != null) {
        throw new Error(`${condition.name} does not accept a condition value.`);
    }
    const conditionUuid = template._stats?.compendiumSource
        ?? (template.uuid?.startsWith("Compendium.") ? template.uuid : null)
        ?? `Compendium.pf2e.conditionitems.Item.${template.id}`;
    const alterations = condition.value == null ? [] : [{
        mode: "override",
        property: "badge-value",
        value: condition.value
    }];
    return {
        condition,
        template,
        ruleFlag,
        rule: {
            key: "GrantItem",
            uuid: conditionUuid,
            flag: ruleFlag,
            allowDuplicate: true,
            alterations,
            onDeleteActions: { granter: "cascade", grantee: multiple ? "detach" : "cascade" }
        }
    };
}

function conditionGroupSource(state, target, actor, conditions) {
    const duration = conditionDuration(conditions[0], state.lifecycle);
    const initiative = duration.anchor === "target-turn"
        ? initiativeForActor(actor)
        : state.effectStart.initiative;
    const multiple = conditions.length > 1;
    const grants = conditions.map((condition, index) =>
        conditionGrant(condition, `condition${index + 1}`, multiple));
    const labels = conditions.map(conditionLabel);
    const applicationId = randomID();
    const source = {
        name: `${state.spellName}: ${labels.join(", ")}`,
        type: "effect",
        img: grants[0].template.img,
        flags: { [MODULE_ID]: { outcomeEffect: {
            schema: SAVE_SCHEMA,
            applicationId,
            castId: state.castId,
            targetId: target.id,
            degree: target.degree,
            secondaryDegree: target.secondary?.degree ?? null,
            conditions: grants.map(grant => ({
                slug: grant.condition.slug,
                label: conditionLabel(grant.condition),
                ruleFlag: grant.ruleFlag
            }))
        } } },
        system: {
            description: { value: `<p>Applies ${labels.map(escapeHTML).join(", ")} from <strong>${escapeHTML(state.spellName)}</strong> after a ${escapeHTML(readableSaveDegree(target.degree))}${target.secondary ? ` and a secondary ${escapeHTML(readableSaveDegree(target.secondary.degree))}` : ""}.</p>` },
            duration: {
                value: duration.value,
                unit: duration.unit,
                expiry: duration.expiry,
                sustained: false
            },
            fromSpell: true,
            level: { value: state.castRank },
            rules: grants.map(grant => grant.rule),
            start: { value: state.effectStart.value, initiative },
            tokenIcon: { show: true },
            traits: { value: [] }
        }
    };
    return {
        applicationId,
        conditions: grants.map(grant => ({ condition: grant.condition, ruleFlag: grant.ruleFlag })),
        duration,
        source
    };
}

function groupedConditionSources(state, target, actor) {
    const groups = new Map();
    for (const condition of outcomeEffectsForTarget(state, target)) {
        const duration = conditionDuration(condition, state.lifecycle);
        const key = JSON.stringify(duration);
        const group = groups.get(key) ?? [];
        group.push(condition);
        groups.set(key, group);
    }
    return [...groups.values()].map(conditions =>
        conditionGroupSource(state, target, actor, conditions));
}

function outcomeEffectMetadata(effect) {
    return effect?.getFlag?.(MODULE_ID, "outcomeEffect")
        ?? effect?.flags?.[MODULE_ID]?.outcomeEffect
        ?? null;
}

function documentDiagnostic(document) {
    return {
        name: document?.name ?? null,
        type: document?.type ?? document?.documentName ?? null,
        uuid: document?.uuid ?? null,
        parentUuid: document?.parent?.uuid ?? null,
        outcomeEffect: outcomeEffectMetadata(document)
    };
}

function stateFromCard(card) {
    return clone(card?.getFlag(MODULE_ID, "basicSaveState") ?? card?.flags?.[MODULE_ID]?.basicSaveState ?? null);
}

function cardForCast(castId) {
    return game.messages.find(message =>
        message.getFlag(MODULE_ID, "basicSaveState")?.castId === castId) ?? null;
}

function resultSummary(state, target) {
    if (target.eligible === false) {
        return `<strong>Unaffected</strong> — ${escapeHTML(target.eligibilityReason ?? "invalid target")}`;
    }
    const multiplier = damageMultiplierForTarget(state, target);
    const formulas = [
        ...(outcomeForTarget(state, target)?.damage?.formulas ?? []),
        ...(secondaryOutcomeForTarget(state, target)?.damage?.formulas ?? [])
    ].map(entry => entry.formula);
    const damageLabels = [
        ...(multiplier > 0 ? [`×${multiplier} shared damage`] : []),
        ...formulas
    ];
    const scale = damageLabels.length ? ` — ${escapeHTML(damageLabels.join(" + "))}` : " — no damage";
    const expectedEffects = outcomeEffectsForTarget(state, target).map(conditionLabel);
    if (secondaryOutcomeForTarget(state, target)?.terminal?.kind === "death") expectedEffects.push("Dies");
    const appliedEffects = (target.conditionResults ?? []).map(result =>
        `${result.label}${result.status === "immune" ? " (immune)" : ""}`);
    if (target.terminalApplied) appliedEffects.push(target.terminalResult?.label ?? "Dead");
    const effects = target.applicationStatus === "applied" ? appliedEffects : expectedEffects;
    const effectSummary = effects.length ? ` — ${effects.map(escapeHTML).join(", ")}` : "";
    const reroll = target.reroll ? ` <span class="pf2e-auto-save-reroll">(revision ${target.rollRevision})</span>` : "";
    const applied = target.applicationStatus === "applied" ? " <strong>Applied</strong>" : "";
    const review = target.reviewRequired ? " <strong class=\"warning\">Manual review</strong>" : "";
    return `${saveResultBadge(target)}${scale}${effectSummary}${reroll}${applied}${review}`;
}

function renderResultCard(state) {
    const rows = state.targets.map(target => {
        if (target.eligible === false) {
            return `<li><strong>${escapeHTML(target.name)}</strong>: Unaffected — ${escapeHTML(target.eligibilityReason ?? "invalid target")}</li>`;
        }
        const damage = (target.damageResults ?? []).flatMap(result => damageParts(result)
            .map(part => damageBadge(part, { multiplier: result.kind === "shared" ? result.multiplier : 1 })));
        const conditions = (target.conditionResults ?? []).map(result =>
            `${result.label}${result.status === "immune" ? " (immune)" : ""}`);
        if (target.terminalApplied) conditions.push(target.terminalResult?.label ?? "Dead");
        const conditionsHTML = conditions.length
            ? `<div class="pf2e-auto-result-conditions">${conditions.map(escapeHTML).join(", ")}</div>`
            : "";
        const secondary = target.secondary
            ? `<div class="pf2e-auto-secondary-result"><strong>Secondary ${escapeHTML(secondarySaveForTarget(state, target)?.check?.statistic ?? "")} save</strong>${saveResultBadge(target.secondary)}</div>`
            : "";
        return `<li class="pf2e-auto-save-target"><div class="pf2e-auto-result-heading"><strong>${escapeHTML(target.name)}</strong>${saveResultBadge(target)}</div>${secondary}`
            + `${damage.length ? `<div class="pf2e-auto-damage-results">${damage.join("")}</div>` : ""}${conditionsHTML}`
            + `${!damage.length && !conditions.length ? "<div>No damage or effects</div>" : ""}</li>`;
    }).join("");
    return `<section class="pf2e-auto-runtime-card pf2e-auto-save-result-card">
        <header><strong>${escapeHTML(state.spellName)} — Damage &amp; Effects</strong></header>
        <p>Resolved at rank ${escapeHTML(state.castRank)} against DC ${escapeHTML(state.dc)} ${escapeHTML(state.saveStatistic)}.</p>
        <ul class="pf2e-auto-save-targets">${rows}</ul>
    </section>`;
}

function renderCard(state) {
    const readiness = saveCollectionReadiness(state);
    const collecting = state.status === "collecting";
    const unrolledSaves = state.targets.flatMap(target => {
        if (target.eligible === false || target.applicationStatus !== "pending") return [];
        return [
            ...(!target.degree ? [{ target, stage: "primary" }] : []),
            ...(target.secondary && !target.secondary.degree ? [{ target, stage: "secondary" }] : [])
        ];
    });
    const damage = state.damage?.enabled === false
        ? `<p><strong>Shared damage:</strong> none</p>`
        : state.damage?.rollJSON
            ? `<div><strong>Shared damage:</strong>${damageRollBadges(state.damage)}</div>`
            : `<p><strong>Shared damage:</strong> rolls when saves are finalized</p>`;
    const requiredRolls = requiredOutcomeDamageRolls(state);
    const outcomeDamage = !state.outcomes
        ? ""
        : unrolledSaves.length
            ? `<p><strong>Outcome damage:</strong> waiting for all saves</p>`
            : requiredRolls.length === 0
            ? `<p><strong>Outcome damage:</strong> none required</p>`
            : `<div class="pf2e-auto-outcome-damage"><strong>Outcome damage:</strong>${requiredRolls.map(entry =>
                `<div>${entry.rollJSON ? damageRollBadges(entry) : `${escapeHTML(entry.formula)} — rolls when finalized`}</div>`
            ).join("")}</div>`;
    const rows = state.targets.map(target => `
        <li class="pf2e-auto-save-target">
            <div><strong>${escapeHTML(target.name)}</strong>: ${resultSummary(state, target)}</div>
            ${target.eligible === false ? "" : `<button type="button" class="pf2e-auto-save-button" data-save-action="roll-save"
                data-message-id="${escapeHTML(state.messageId)}" data-target-id="${escapeHTML(target.id)}"
                data-save-stage="primary"
                title="Shift-click toggles PF2e's save dialog."
                ${target.applicationStatus !== "pending" || !collecting ? "disabled" : ""}>
                <i class="fa-solid fa-dice-d20"></i> ${target.degree ? "Roll Save Again" : `Roll ${escapeHTML(state.saveStatistic)} Save`}
            </button>${target.supportsHeroPoints && target.degree && collecting ? `<button type="button" class="pf2e-auto-save-button"
                data-save-action="hero-reroll" data-message-id="${escapeHTML(state.messageId)}" data-target-id="${escapeHTML(target.id)}" data-save-stage="primary">
                <i class="fa-solid fa-circle-h"></i> Hero Point Reroll
            </button>` : ""}${target.secondary ? `<div class="pf2e-auto-secondary-save"><strong>Secondary ${escapeHTML(secondarySaveForTarget(state, target)?.check?.statistic ?? "")} save</strong>
                <div>${saveResultBadge(target.secondary)}</div>
                <button type="button" class="pf2e-auto-save-button" data-save-action="roll-save"
                    data-message-id="${escapeHTML(state.messageId)}" data-target-id="${escapeHTML(target.id)}" data-save-stage="secondary"
                    title="Shift-click toggles PF2e's save dialog." ${target.applicationStatus !== "pending" || !collecting ? "disabled" : ""}>
                    <i class="fa-solid fa-dice-d20"></i> ${target.secondary.degree ? "Roll Secondary Save Again" : "Roll Secondary Save"}
                </button>${target.supportsHeroPoints && target.secondary.degree && collecting ? `<button type="button" class="pf2e-auto-save-button"
                    data-save-action="hero-reroll" data-message-id="${escapeHTML(state.messageId)}" data-target-id="${escapeHTML(target.id)}" data-save-stage="secondary">
                    <i class="fa-solid fa-circle-h"></i> Hero Point Reroll
                </button>` : ""}</div>` : ""}`}
        </li>`).join("");
    const review = state.reviewRequired
        ? `<p class="warning"><strong>Automation stopped:</strong> ${escapeHTML(state.reviewReason)}</p>`
        : "";
    const complete = state.status === "completed" ? "<p><strong>Resolution complete.</strong></p>" : "";
    return `<section class="pf2e-auto-runtime-card pf2e-auto-basic-save-card">
        <header><strong>${escapeHTML(state.spellName)} — ${state.saveIsBasic !== false ? "Basic " : ""}Save Resolution</strong></header>
        <p>DC ${escapeHTML(state.dc)} ${escapeHTML(state.saveStatistic)}; cast at rank ${escapeHTML(state.castRank)}.</p>
        ${damage}${outcomeDamage}<ul class="pf2e-auto-save-targets">${rows}</ul>${review}${complete}
        <div class="pf2e-auto-runtime-controls">
            <button type="button" class="pf2e-auto-save-button" data-save-action="roll-all"
                data-message-id="${escapeHTML(state.messageId)}" title="Shift-click toggles PF2e's save dialog for the entire sequence."
                ${!unrolledSaves.length || !collecting ? "disabled" : ""}>
                <i class="fa-solid fa-dice-d20"></i> ${unrolledSaves.length
                    ? `Roll All Unrolled Saves (${unrolledSaves.length})`
                    : "All Saves Rolled"}
            </button>
            <button type="button" class="pf2e-auto-save-button" data-save-action="add-targets"
                data-message-id="${escapeHTML(state.messageId)}" ${!collecting ? "disabled" : ""}>
                <i class="fa-solid fa-user-plus"></i> Add Current Targets
            </button>
            <button type="button" class="pf2e-auto-save-button" data-save-action="finalize"
                data-message-id="${escapeHTML(state.messageId)}" ${!readiness.ready || !collecting ? "disabled" : ""}>
                <i class="fa-solid fa-wand-magic-sparkles"></i> Finalize Saves &amp; Resolve
            </button>
        </div>
        ${!readiness.ready && collecting && !state.reviewRequired ? `<small>${escapeHTML(readiness.reason)}</small>` : ""}
    </section>`;
}

export class BasicSaveRuntime {
    #jobs = new Map();

    supports(plan) {
        return isExecutableSavePlan(plan);
    }

    canCoordinate(card) {
        return isCardCoordinator(card);
    }

    async start(spell, options = {}) {
        const plan = options.plan;
        if (!this.supports(plan)) throw new Error(`${plan?.source?.name ?? spell?.name ?? "Spell"} is not an executable save plan.`);
        const sourceActor = options.sourceActor ?? spell?.actor ?? null;
        if (!sourceActor) throw new Error("The casting actor could not be resolved.");
        const targetInputs = Array.isArray(options.targets)
            ? options.targets
            : [...(options.targets ?? game.user.targets)];
        const constraints = plan.targeting.actorConstraints;
        const targets = snapshotTargets(targetInputs, constraints);
        if (!targets.length) throw new Error(`${plan.source.name}: target every affected creature before preparing saves.`);
        const castRank = Number(options.castRank ?? spell?.rank ?? plan.rank);
        const dc = normalizeDC(options.dc) ?? spellDC(spell, sourceActor);
        if (!dc) throw new Error(`${plan.source.name}: the caster's spell DC could not be resolved.`);
        const saveIsBasic = plan.resolution.check.basic === true;

        const confirmed = options.skipConfirmation === true || await confirmAction({
            title: `${plan.source.name} — Prepare ${saveIsBasic ? "Basic " : ""}Saves`,
            content: `<p>Snapshot ${targets.length} target${targets.length === 1 ? "" : "s"} at DC ${dc}?</p><p>No damage is applied until the final confirmation.</p>`,
            label: "Prepare Saves"
        });
        if (!confirmed) return { status: "cancelled", plan };

        const degreeOutcome = isExecutableDegreeSavePlan(plan);
        const outcomeSnapshot = degreeOutcome
            ? snapshotOutcomes(plan, castRank)
            : { outcomes: null, outcomeRolls: [] };
        const state = {
            schema: SAVE_SCHEMA,
            castId: randomID(),
            messageId: null,
            sourceActorUuid: sourceActor.uuid,
            sourceItemUuid: spell.uuid ?? plan.source.uuid ?? null,
            spellName: plan.source.name,
            compilerVersion: plan.compilerVersion,
            baseRank: Number(plan.rank),
            castRank,
            dc,
            saveStatistic: plan.resolution.check.statistic,
            saveIsBasic,
            targetConstraints: clone(constraints),
            outcomes: outcomeSnapshot.outcomes,
            lifecycle: degreeOutcome ? clone(plan.lifecycle) : null,
            effectStart: {
                value: game.time?.worldTime ?? 0,
                initiative: initiativeForActor(sourceActor)
            },
            traits: [...(spell.system?.traits?.value ?? [])],
            damage: {
                enabled: plan.resolution.sharedDamage != null && planUsesSharedDamage(plan),
                rollJSON: null,
                formula: null,
                total: null,
                rollOptions: [],
                instances: [],
                outcomeRolls: outcomeSnapshot.outcomeRolls
            },
            targets,
            status: "collecting",
            reviewRequired: false,
            reviewReason: null,
            resultMessageId: null,
            createdAt: Date.now()
        };
        debugLog(state.castId, "save prepared", {
            moduleVersion: game.modules?.get(MODULE_ID)?.version ?? null,
            spell: state.spellName,
            castRank: state.castRank,
            dc: state.dc,
            statistic: state.saveStatistic,
            targets: state.targets.map(target => ({
                id: target.id,
                name: target.name,
                actorUuid: target.actorUuid,
                tokenUuid: target.tokenUuid,
                eligible: target.eligible,
                eligibilityReason: target.eligibilityReason
            })),
            targetConstraints: state.targetConstraints
        });
        const card = await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: sourceActor }),
            content: `<section class="pf2e-auto-runtime-card"><p>Preparing ${escapeHTML(plan.source.name)}…</p></section>`,
            flags: { [MODULE_ID]: { kind: "save-resolution", basicSaveState: state } }
        });
        state.messageId = card.id;
        try { await this.#updateCard(card, state); }
        catch (error) {
            await card.delete().catch(() => {});
            throw error;
        }
        if (options.sourceMessageId) {
            try {
                await game.messages.get(options.sourceMessageId)?.setFlag(MODULE_ID, "saveCast", {
                    castId: state.castId,
                    resolutionMessageId: card.id
                });
            } catch (error) {
                console.warn(`${MODULE_ID} | The save-resolution card was created, but its source card could not be marked.`, error);
            }
        }
        return { status: "prepared", plan, card, state };
    }

    async handleCardAction(button, event = null) {
        const card = game.messages.get(button.dataset.messageId);
        if (!card) throw new Error("The save-resolution card no longer exists.");
        const castId = stateFromCard(card)?.castId;
        if (button.dataset.saveAction === "add-targets") return await this.#queue(castId, () => this.addTargets(card));
        if (button.dataset.saveAction === "finalize") return await this.#queue(castId, () => this.finalize(card));
        // Kept for save cards persisted by module versions before 0.6.0.
        if (button.dataset.saveAction === "roll-damage") return await this.#queue(castId, () => this.rollDamage(card));
        if (button.dataset.saveAction === "roll-outcome-damage") {
            return await this.#queue(castId, () => this.rollOutcomeDamage(card, button.dataset.rollId));
        }
        if (button.dataset.saveAction === "roll-all") return await this.rollAll(card, { event });
        if (button.dataset.saveAction === "roll-save") {
            return await this.rollSave(card, button.dataset.targetId, { event, stage: button.dataset.saveStage });
        }
        if (button.dataset.saveAction === "hero-reroll") {
            return await this.rollSave(card, button.dataset.targetId, { heroPoint: true, stage: button.dataset.saveStage });
        }
        if (button.dataset.saveAction === "apply") return await this.#queue(castId, () => this.apply(card));
        throw new Error(`Unknown save-resolution action ${JSON.stringify(button.dataset.saveAction)}.`);
    }

    async addTargets(card, targets = game.user.targets) {
        const state = stateFromCard(card);
        if (!state) throw new Error("The save-resolution state is missing.");
        if (!isCardCoordinator(card)) throw new Error("The active GM must add targets to this cast.");
        if (state.status !== "collecting") throw new Error(`${state.spellName}: targets are locked after finalization begins.`);
        const snapshots = snapshotTargets(targets, state.targetConstraints);
        const existing = new Set(state.targets.map(target => target.actorUuid));
        const added = snapshots.filter(target => !existing.has(target.actorUuid));
        if (!added.length) {
            globalThis.ui?.notifications?.info?.(`${state.spellName}: no new targeted actors to add.`);
            return { status: "nothing-to-add", added: 0, state };
        }
        state.targets.push(...added);
        await this.#updateCard(card, state);
        debugLog(state.castId, "save targets added", {
            added: added.map(target => ({
                id: target.id,
                name: target.name,
                actorUuid: target.actorUuid,
                tokenUuid: target.tokenUuid,
                eligible: target.eligible,
                eligibilityReason: target.eligibilityReason
            }))
        });
        return { status: "added", added: added.length, targets: added, state };
    }

    async finalize(card) {
        let state = stateFromCard(card);
        if (!state) throw new Error("The save-resolution state is missing.");
        if (!isCardCoordinator(card)) throw new Error("The active GM must finalize this cast.");
        const readiness = saveCollectionReadiness(state);
        if (!readiness.ready) throw new Error(`${state.spellName}: ${readiness.reason}`);
        state.status = "finalizing";
        await this.#updateCard(card, state);
        debugLog(state.castId, "save finalization started", { targetCount: state.targets.length });
        try {
            if (sharedDamageRequired(state) && !state.damage?.rollJSON) {
                await this.rollDamage(card, { postMessage: false });
            }
            state = stateFromCard(card);
            for (const entry of requiredOutcomeDamageRolls(state).filter(candidate => !candidate.rollJSON)) {
                await this.rollOutcomeDamage(card, entry.id, { postMessage: false });
            }
            return await this.apply(card, { skipConfirmation: true, createResultCard: true });
        } catch (error) {
            state = stateFromCard(card);
            if (state && state.status === "finalizing") {
                state.status = "collecting";
                await this.#updateCard(card, state).catch(() => {});
            }
            throw error;
        }
    }

    async rollDamage(card, { postMessage = true } = {}) {
        const state = stateFromCard(card);
        if (!state) throw new Error("The save-resolution state is missing.");
        if (state.damage.enabled === false) return { status: "not-required", state };
        if (state.damage.rollJSON) return { status: "already-rolled", state };
        if (!isCardCoordinator(card)) throw new Error("The active GM must roll this cast's shared damage.");
        const sourceActor = await fromUuid(state.sourceActorUuid);
        const sourceSpell = await fromUuid(state.sourceItemUuid);
        if (!sourceActor || !sourceSpell) throw new Error(`${state.spellName}: the original caster or spell is unavailable.`);
        if (!game.user.isGM && !sourceActor.canUserModify?.(game.user, "update")) {
            throw new Error(`You do not have permission to roll ${state.spellName}'s damage.`);
        }
        const spell = resolveSpellAtRank(sourceSpell, state.castRank);
        if (typeof spell.getDamage !== "function") throw new Error(`${state.spellName} does not expose PF2e spell damage.`);
        const prepared = await spell.getDamage({ skipDialog: true });
        const roll = prepared?.template?.damage?.roll;
        if (!roll) throw new Error(`PF2e returned no damage roll for ${state.spellName}.`);
        await roll.evaluate();
        state.damage.rollJSON = clone(roll.toJSON());
        state.damage.formula = roll.formula;
        state.damage.total = roll.total;
        state.damage.rollOptions = [...(prepared.context?.options ?? [])];
        state.damage.instances = damageInstances(roll, {
            formula: state.damage.formula,
            total: state.damage.total
        });
        await this.#updateCard(card, state);
        debugLog(state.castId, "shared damage rolled", {
            formula: state.damage.formula,
            total: state.damage.total,
            rollOptions: state.damage.rollOptions
        });
        if (postMessage) try {
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: sourceActor }),
                flavor: `<strong>${escapeHTML(state.spellName)}</strong> — Shared Save Damage`,
                flags: { [MODULE_ID]: { kind: "basic-save-damage", castId: state.castId } }
            });
        } catch (error) {
            console.warn(`${MODULE_ID} | Shared damage was stored, but its roll message could not be posted.`, error);
        }
        return { status: "rolled", roll, state };
    }

    async rollOutcomeDamage(card, rollId, { postMessage = true } = {}) {
        const state = stateFromCard(card);
        if (!state) throw new Error("The save-resolution state is missing.");
        if (state.targets.some(target => target.eligible !== false && !target.degree)) {
            throw new Error("Finish every provisional save before rolling outcome-specific damage.");
        }
        const entry = requiredOutcomeDamageRolls(state).find(candidate => candidate.id === rollId);
        if (!entry) throw new Error("That outcome damage roll is not required by the current save results.");
        if (entry.rollJSON) return { status: "already-rolled", state };
        if (!isCardCoordinator(card)) throw new Error("The active GM must roll this cast's outcome damage.");
        const sourceActor = await fromUuid(state.sourceActorUuid);
        const sourceSpell = await fromUuid(state.sourceItemUuid);
        if (!sourceActor || !sourceSpell) throw new Error(`${state.spellName}: the original caster or spell is unavailable.`);
        if (!game.user.isGM && !sourceActor.canUserModify?.(game.user, "update")) {
            throw new Error(`You do not have permission to roll ${state.spellName}'s damage.`);
        }
        const DamageRoll = (CONFIG.Dice?.rolls ?? []).find(candidate => candidate?.name === "DamageRoll");
        if (!DamageRoll) throw new Error("PF2e's DamageRoll class could not be resolved.");
        if (typeof DamageRoll.validate === "function" && !DamageRoll.validate(entry.formula)) {
            throw new Error(`${state.spellName}: PF2e rejected outcome damage formula ${entry.formula}.`);
        }
        const spell = resolveSpellAtRank(sourceSpell, state.castRank);
        const rollData = spell.getRollData?.({ castRank: state.castRank }) ?? {
            item: { rank: state.castRank, level: state.castRank }
        };
        const roll = new DamageRoll(entry.formula, rollData, { rollerId: game.user.id });
        await roll.evaluate();
        entry.rollJSON = clone(roll.toJSON());
        entry.total = roll.total;
        entry.instances = damageInstances(roll, { formula: entry.formula, total: entry.total });
        entry.rollOptions = [...new Set([
            ...(spell.getRollOptions?.("item") ?? []),
            ...(state.traits ?? []).map(trait => `item:trait:${trait}`)
        ])];
        await this.#updateCard(card, state);
        debugLog(state.castId, "outcome damage rolled", {
            rollId: entry.id,
            formula: entry.formula,
            total: entry.total,
            requiredBy: state.targets.filter(target => outcomeDamageRollIds(state, target).includes(entry.id))
                .map(target => ({ targetId: target.id, name: target.name, degree: target.degree }))
        });
        if (postMessage) try {
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: sourceActor }),
                flavor: `<strong>${escapeHTML(state.spellName)}</strong> — ${escapeHTML(entry.formula)}`,
                flags: { [MODULE_ID]: { kind: "outcome-save-damage", castId: state.castId, rollId: entry.id } }
            });
        } catch (error) {
            console.warn(`${MODULE_ID} | Outcome damage was stored, but its roll message could not be posted.`, error);
        }
        return { status: "rolled", roll, state };
    }

    async rollSave(card, targetId, { event = null, skipDialog = null, heroPoint = false, stage = "primary" } = {}) {
        const state = stateFromCard(card);
        const target = state?.targets?.find(candidate => candidate.id === targetId);
        if (!state || !target) throw new Error("The selected save target is unavailable.");
        if (state.status !== "collecting") throw new Error(`${state.spellName}: saves are locked after finalization begins.`);
        if (target.eligible === false) throw new Error(`${target.name} is unaffected: ${target.eligibilityReason}.`);
        if (target.applicationStatus !== "pending") throw new Error(`${target.name}'s result has already been applied.`);
        const { actor, token } = await resolveTargetDocuments(target);
        const sourceActor = await fromUuid(state.sourceActorUuid);
        const sourceSpell = await fromUuid(state.sourceItemUuid);
        if (!actor || !sourceActor || !sourceSpell) throw new Error("The target, caster, or original spell is unavailable.");
        assertPersistedTargetIdentity(target, actor);
        if (!game.user.isGM && !actor.canUserModify?.(game.user, "update")) {
            throw new Error(`You do not have permission to roll ${target.name}'s save.`);
        }
        const secondarySave = stage === "secondary" ? secondarySaveForTarget(state, target) : null;
        const saveRecord = stage === "secondary" ? target.secondary : target;
        if (stage === "secondary" && (!secondarySave || !saveRecord)) {
            throw new Error(`${target.name} has no required secondary save.`);
        }
        const statisticSlug = secondarySave?.check?.statistic ?? state.saveStatistic;
        const statistic = actor.saves?.[statisticSlug];
        if (!statistic || typeof statistic.roll !== "function") {
            throw new Error(`${target.name} has no PF2e ${statisticSlug} save statistic.`);
        }
        const spell = resolveSpellAtRank(sourceSpell, state.castRank);
        const traits = [...new Set([...(state.traits ?? []), ...(secondarySave?.check?.traits ?? [])])];
        let heroPoints = null;
        if (heroPoint) {
            if (!saveRecord.degree) throw new Error(`${target.name} must roll this save before using a Hero Point reroll.`);
            heroPoints = actor.getResource?.("hero-points") ?? null;
            if (!heroPoints || Number(heroPoints.value) < 1 || typeof actor.updateResource !== "function") {
                throw new Error(`${target.name} has no Hero Point available.`);
            }
        }
        debugLog(state.castId, "save roll requested", {
            targetId: target.id,
            targetName: target.name,
            savedActorUuid: target.actorUuid,
            savedTokenUuid: target.tokenUuid,
            resolvedActorUuid: actor.uuid,
            resolvedTokenUuid: token?.uuid ?? null,
            stage,
            statistic: statisticSlug
        });
        const roll = await statistic.roll({
            dc: state.dc,
            token: token ?? undefined,
            item: spell,
            origin: sourceActor,
            label: `${state.spellName} — ${target.name} ${stage === "secondary" ? "Secondary " : ""}${statisticSlug} Save`,
            title: `${state.spellName} — ${target.name} ${stage === "secondary" ? "Secondary " : ""}${statisticSlug} Save`,
            extraRollOptions: [
                `${SAVE_OPTION_PREFIX}:${state.castId}:${target.id}`,
                ...(heroPoint ? ["check:reroll", "check:reroll:hero-points"] : []),
                ...traits.map(trait => `item:trait:${trait}`)
            ],
            traits,
            createMessage: false,
            skipDialog: heroPoint ? true : typeof skipDialog === "boolean"
                ? skipDialog
                : checkRollSkipDialog(event, game.user.settings?.showCheckDialogs ?? true)
        });
        if (!roll) return null;
        const degree = normalizeSaveDegree(roll.options?.degreeOfSuccess ?? roll.degreeOfSuccess);
        if (!degree) throw new Error(`${target.name}'s save returned no recognized degree of success.`);
        if (heroPoint) await actor.updateResource("hero-points", Number(heroPoints.value) - 1);
        const natural = roll.dice?.flatMap(die => die.results ?? [])
            .find(result => result.active !== false && result.discarded !== true)?.result ?? null;
        const submission = {
            type: "inline-save-result",
            submissionId: randomID(),
            castId: state.castId,
            targetId: target.id,
            stage,
            actorUuid: actor.uuid,
            userId: game.user.id,
            degree,
            total: roll.total,
            natural,
            modifier: roll.options?.totalModifier,
            reroll: heroPoint || saveRecord.degree != null
        };
        if (isCardCoordinator(card)) await this.#acceptInlineSave(submission);
        else game.socket.emit(`module.${MODULE_ID}`, submission);
        return roll;
    }

    async handleSocket(payload) {
        const card = payload?.type === "inline-save-result" ? cardForCast(payload.castId) : null;
        if (!card || !isCardCoordinator(card)) return;
        await this.#acceptInlineSave(payload);
    }

    async rollAll(card, { event = null, skipDialog = null } = {}) {
        let state = stateFromCard(card);
        if (!state) throw new Error("The save-resolution state is missing.");
        if (!isCardCoordinator(card)) throw new Error("The active GM must start the roll-all sequence.");
        const primaryTargets = state.targets.filter(target =>
            target.eligible !== false && target.applicationStatus === "pending" && !target.degree);
        const initialSecondaryTargets = state.targets.filter(target =>
            target.eligible !== false && target.applicationStatus === "pending"
            && target.secondary && !target.secondary.degree);
        if (!primaryTargets.length && !initialSecondaryTargets.length) {
            return { status: "nothing-to-roll", rolled: 0, state };
        }

        let rolled = 0;
        for (const target of primaryTargets) {
            const result = await this.rollSave(card, target.id, { event, skipDialog });
            if (!result) return { status: "cancelled", rolled, state };
            rolled += 1;
        }
        state = stateFromCard(card);
        const secondaryTargets = state.targets.filter(target =>
            target.eligible !== false && target.applicationStatus === "pending"
            && target.secondary && !target.secondary.degree);
        for (const target of secondaryTargets) {
            const result = await this.rollSave(card, target.id, { event, skipDialog, stage: "secondary" });
            if (!result) return { status: "cancelled", rolled, state };
            rolled += 1;
        }
        return { status: "rolled", rolled, state };
    }

    async handleSaveMessage(message) {
        const reference = saveReference(message);
        if (!reference) return;
        const card = cardForCast(reference.castId);
        if (!card || !isCardCoordinator(card)) return;
        const degree = degreeFromMessage(message);
        const actor = messageActor(message);
        if (!degree || !actor) return;
        await this.#queue(reference.castId, async () => {
            const state = stateFromCard(card);
            const target = state?.targets?.find(candidate => candidate.id === reference.targetId);
            if (!state || !target || target.actorUuid !== actor.uuid) {
                console.warn(`${MODULE_ID} | Ignored a save whose actor did not match its snapshotted target.`, message);
                return;
            }
            if (target.saveMessageId === message.id || target.postApplicationMessageId === message.id) return;
            const result = recordProvisionalSave(state, target.id, {
                degree,
                messageId: message.id,
                timestamp: message.timestamp ?? Date.now(),
                reroll: isRerollMessage(message)
            });
            synchronizeSecondary(state, target);
            debugLog(state.castId, "save result recorded", {
                messageId: message.id,
                targetId: target.id,
                targetName: target.name,
                actorUuid: actor.uuid,
                degree,
                reroll: isRerollMessage(message),
                status: result.status,
                revision: target.rollRevision,
                requiredOutcomeDamage: requiredOutcomeDamageRolls(state).map(entry => ({
                    id: entry.id,
                    formula: entry.formula,
                    rolled: entry.rollJSON != null
                }))
            });
            await this.#updateCard(card, state);
            if (result.status === "manual-review") {
                globalThis.ui?.notifications?.warn(`${state.spellName}: ${state.reviewReason} Correct the result manually.`);
            }
        });
    }

    async apply(card, { skipConfirmation = false, createResultCard = true } = {}) {
        const state = stateFromCard(card);
        if (!state) throw new Error("The save-resolution state is missing.");
        if (!isCardCoordinator(card)) throw new Error("The active GM must confirm and apply this cast's results.");
        const readiness = basicSaveReadiness(state);
        if (!readiness.ready) throw new Error(`${state.spellName}: ${readiness.reason}`);
        const resolvedTargets = await Promise.all(state.targets.map(resolveTargetDocuments));
        const actors = resolvedTargets.map(target => target.actor);
        if (actors.some(actor => !actor)) throw new Error(`${state.spellName}: one or more targets are unavailable.`);
        state.targets.forEach((target, index) => assertPersistedTargetIdentity(target, actors[index]));
        if (new Set(actors.map(actor => actor.uuid)).size !== actors.length) {
            throw new Error(`${state.spellName}: multiple saved targets now resolve to the same actor. Results were not applied.`);
        }
        for (const [index, actor] of actors.entries()) {
            const target = state.targets[index];
            if (target.eligible === false) continue;
            const eligibility = validateActorTarget(state.targetConstraints, actor);
            if (!eligibility.eligible) {
                target.eligible = false;
                target.eligibilityReason = eligibility.reason;
                target.applicationStatus = "unaffected";
            }
        }
        debugLog(state.castId, "application targets resolved", {
            targets: state.targets.map((target, index) => ({
                id: target.id,
                name: target.name,
                degree: target.degree,
                savedActorUuid: target.actorUuid,
                savedTokenUuid: target.tokenUuid,
                resolvedActorUuid: actors[index]?.uuid ?? null,
                resolvedTokenUuid: resolvedTargets[index].token?.uuid ?? null
            }))
        });
        if (!game.user.isGM && actors.some((actor, index) =>
            state.targets[index].eligible !== false && !actor.canUserModify?.(game.user, "update"))) {
            throw new Error("A GM must apply damage to targets you do not own.");
        }
        const conditionSources = state.targets.map((target, index) =>
            groupedConditionSources(state, target, actors[index]));
        const summary = state.targets.map(target => {
            if (target.eligible === false) {
                return `<li>${escapeHTML(target.name)}: unaffected — ${escapeHTML(target.eligibilityReason)}</li>`;
            }
            const multiplier = damageMultiplierForTarget(state, target);
            const formulas = [
                ...(outcomeForTarget(state, target)?.damage?.formulas ?? []),
                ...(secondaryOutcomeForTarget(state, target)?.damage?.formulas ?? [])
            ]
                .map(entry => entry.formula);
            const conditions = outcomeEffectsForTarget(state, target).map(conditionLabel);
            if (secondaryOutcomeForTarget(state, target)?.terminal?.kind === "death") conditions.push("Dies");
            const result = [
                ...(multiplier > 0 ? [`×${multiplier} shared damage`] : []),
                ...formulas,
                ...conditions
            ].join(", ");
            const degrees = target.secondary
                ? `${readableSaveDegree(target.degree)}; secondary ${readableSaveDegree(target.secondary.degree)}`
                : readableSaveDegree(target.degree);
            return `<li>${escapeHTML(target.name)}: ${escapeHTML(degrees)} — ${escapeHTML(result || "no damage or effects")}</li>`;
        }).join("");
        const confirmed = skipConfirmation || await confirmAction({
            title: `${state.spellName} — Apply Results`,
            content: `<p>Apply the compiled damage and conditions for these provisional results?</p><ul>${summary}</ul>`,
            label: "Apply Results"
        });
        if (!confirmed) return { status: "cancelled", state };

        const outcomeRolls = new Map(requiredOutcomeDamageRolls(state).map(entry => [entry.id, entry]));
        const needsDamage = sharedDamageRequired(state) || outcomeRolls.size > 0;
        const DamageRoll = needsDamage
            ? (CONFIG.Dice?.rolls ?? []).find(candidate => candidate?.name === "DamageRoll")
            : null;
        if (needsDamage && !DamageRoll?.fromData) throw new Error("PF2e's DamageRoll class could not be resolved.");
        state.status = "applying";
        await this.#updateCard(card, state);
        const createdEffects = [];
        let damageApplied = false;
        try {
            for (let index = 0; index < state.targets.length; index++) {
                const target = state.targets[index];
                if (target.applicationStatus === "applied" || target.eligible === false) continue;
                const { actor, token } = resolvedTargets[index];
                target.applicationStatus = "applying";
                target.damageResults ??= [];
                target.hpBefore = hpValue(actor);
                await this.#updateCard(card, state);
                const multiplier = damageMultiplierForTarget(state, target);
                debugLog(state.castId, "target application started", {
                    targetId: target.id,
                    targetName: target.name,
                    actorUuid: actor.uuid,
                    tokenUuid: token?.uuid ?? null,
                    degree: target.degree,
                    secondaryDegree: target.secondary?.degree ?? null,
                    damageMultiplier: multiplier,
                    outcomeDamage: outcomeDamageRollIds(state, target).map(id => ({
                        id,
                        formula: outcomeRolls.get(id)?.formula ?? null,
                        total: outcomeRolls.get(id)?.total ?? null
                    })),
                    hpBefore: target.hpBefore,
                    conditionGroups: conditionSources[index].map(group => ({
                        applicationId: group.applicationId,
                        duration: group.duration,
                        conditions: group.conditions.map(entry => conditionLabel(entry.condition))
                    }))
                });
                if (multiplier > 0) {
                    const baseRoll = DamageRoll.fromData(clone(state.damage.rollJSON));
                    const damage = multiplier === 1 ? baseRoll : baseRoll.alter(multiplier, 0);
                    // Treat entry into PF2e's damage workflow as irreversible: a hook
                    // can throw after HP has already changed.
                    damageApplied = true;
                    await actor.applyDamage({
                        damage,
                        token: token ?? undefined,
                        skipIWR: false,
                        rollOptions: new Set(state.damage.rollOptions ?? []),
                        shieldBlockRequest: CONFIG.PF2E?.chatDamageButtonShieldToggle ?? false
                    });
                    target.damageResults.push({
                        kind: "shared",
                        formula: state.damage.formula,
                        multiplier,
                        total: damage.total,
                        instances: damageInstances(damage, {
                            formula: state.damage.formula,
                            total: damage.total
                        })
                    });
                    debugLog(state.castId, "target damage applied", {
                        targetId: target.id,
                        actorUuid: actor.uuid,
                        multiplier,
                        hpBefore: target.hpBefore,
                        hpAfter: hpValue(actor)
                    });
                }
                for (const rollId of outcomeDamageRollIds(state, target)) {
                    const entry = outcomeRolls.get(rollId);
                    if (!entry?.rollJSON) throw new Error(`${target.name}: required outcome damage ${rollId} is unavailable.`);
                    const damage = DamageRoll.fromData(clone(entry.rollJSON));
                    damageApplied = true;
                    await actor.applyDamage({
                        damage,
                        token: token ?? undefined,
                        skipIWR: false,
                        rollOptions: new Set(entry.rollOptions ?? []),
                        shieldBlockRequest: CONFIG.PF2E?.chatDamageButtonShieldToggle ?? false
                    });
                    target.damageResults.push({
                        kind: "outcome",
                        rollId,
                        formula: entry.formula,
                        multiplier: 1,
                        total: damage.total,
                        instances: damageInstances(damage, {
                            formula: entry.formula,
                            total: damage.total
                        })
                    });
                    debugLog(state.castId, "target outcome damage applied", {
                        targetId: target.id,
                        actorUuid: actor.uuid,
                        rollId,
                        formula: entry.formula,
                        total: damage.total,
                        hpAfter: hpValue(actor)
                    });
                }
                const batch = conditionSources[index];
                if (batch.length) {
                    const created = await actor.createEmbeddedDocuments("Item", batch.map(entry => entry.source), { keepId: false });
                    const applicationIds = new Set(batch.map(entry =>
                        entry.source.flags[MODULE_ID].outcomeEffect.applicationId));
                    const wrappers = created.filter(effect =>
                        applicationIds.has(outcomeEffectMetadata(effect)?.applicationId));
                    debugLog(state.castId, "PF2e condition documents returned", {
                        targetId: target.id,
                        actorUuid: actor.uuid,
                        requestedWrappers: batch.length,
                        returnedDocuments: created.map(documentDiagnostic),
                        matchedWrappers: wrappers.map(documentDiagnostic)
                    });
                    createdEffects.push(...wrappers);
                    if (wrappers.length !== batch.length) {
                        throw new Error(`${target.name}: PF2e returned ${created.length} documents but only ${wrappers.length} of ${batch.length} compiled condition Effects could be identified.`);
                    }
                    const wrappersByApplicationId = new Map(wrappers.map(effect =>
                        [outcomeEffectMetadata(effect).applicationId, effect]));
                    const retained = [];
                    target.conditionResults = [];
                    for (const entry of batch) {
                        const applicationId = entry.applicationId;
                        const effect = wrappersByApplicationId.get(applicationId);
                        const grantRules = effect?.system?.rules?.filter(rule => rule.key === "GrantItem") ?? [];
                        let appliedConditions = 0;
                        for (const grant of entry.conditions) {
                            const rule = grantRules.find(candidate => candidate.flag === grant.ruleFlag);
                            const ignored = rule?.ignored === true;
                            if (!ignored) appliedConditions += 1;
                            target.conditionResults.push({
                                slug: grant.condition.slug,
                                label: conditionLabel(grant.condition),
                                status: ignored ? "immune" : "applied",
                                effectUuid: ignored ? null : effect?.uuid ?? null
                            });
                        }
                        if (appliedConditions === 0) {
                            await effect.delete({ [MODULE_ID]: { reason: "condition-immune" } });
                        } else if (effect) {
                            retained.push(effect);
                        }
                    }
                    target.effectUuids = retained.map(effect => effect.uuid);
                }
                const terminal = secondaryOutcomeForTarget(state, target)?.terminal ?? null;
                if (terminal?.kind === "death") {
                    // A confirmed terminal status and cleared 0-HP conditions
                    // cannot be transactionally reconstructed on rollback.
                    damageApplied = true;
                    await applyTerminalDeath(state, target, actor, terminal);
                }
                target.hpAfter = hpValue(actor);
                target.applicationStatus = "applied";
                await this.#updateCard(card, state);
                debugLog(state.castId, "target application completed", {
                    targetId: target.id,
                    actorUuid: actor.uuid,
                    hpBefore: target.hpBefore,
                    hpAfter: target.hpAfter,
                    conditions: target.conditionResults,
                    effectUuids: target.effectUuids
                });
            }
            state.status = "completed";
            await this.#updateCard(card, state);
            if (createResultCard && !state.resultMessageId) {
                try {
                    const resultCard = await ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ actor: await fromUuid(state.sourceActorUuid) }),
                        content: renderResultCard(state),
                        flags: { [MODULE_ID]: { kind: "save-resolution-result", saveResult: {
                            schema: SAVE_SCHEMA,
                            castId: state.castId,
                            resolutionMessageId: state.messageId
                        } } }
                    });
                    state.resultMessageId = resultCard.id;
                    await this.#updateCard(card, state);
                } catch (error) {
                    console.warn(`${MODULE_ID} | Results were applied, but the result summary card could not be created.`, error);
                }
            }
            debugLog(state.castId, "save resolution completed", {
                messageId: state.messageId,
                targets: state.targets.map(target => ({
                    name: target.name,
                    actorUuid: target.actorUuid,
                    degree: target.degree,
                    secondaryDegree: target.secondary?.degree ?? null,
                    hpBefore: target.hpBefore,
                    hpAfter: target.hpAfter,
                    damageResults: target.damageResults,
                    effectUuids: target.effectUuids
                }))
            });
            Hooks.callAll(`${MODULE_ID}.saveApplied`, { card, state });
            if (state.saveIsBasic !== false) Hooks.callAll(`${MODULE_ID}.basicSaveApplied`, { card, state });
            return { status: "applied", state };
        } catch (error) {
            debugError(state.castId, "save resolution failed", error, {
                damageApplied,
                status: state.status,
                targets: state.targets
            });
            if (!damageApplied) {
                await Promise.allSettled(createdEffects.map(effect => effect.delete({
                    [MODULE_ID]: { reason: "rollback" }
                })));
                for (const target of state.targets) {
                    target.applicationStatus = "pending";
                    target.hpBefore = null;
                    target.hpAfter = null;
                    target.damageResults = [];
                    target.effectUuids = [];
                    target.conditionResults = [];
                    target.terminalResult = null;
                    target.terminalApplied = false;
                }
                state.status = "collecting";
                await this.#updateCard(card, state).catch(() => {});
                throw error;
            }
            state.status = "review";
            state.reviewRequired = true;
            state.reviewReason = "Result application was interrupted after irreversible damage may have been applied.";
            await this.#updateCard(card, state).catch(() => {});
            throw error;
        }
    }

    async #updateCard(card, state) {
        await card.update({
            content: renderCard(state),
            [`flags.${MODULE_ID}.basicSaveState`]: clone(state)
        });
    }

    async #acceptInlineSave(payload) {
        const card = cardForCast(payload.castId);
        if (!card || !isCardCoordinator(card)) return { status: "ignored" };
        return await this.#queue(payload.castId, async () => {
            const state = stateFromCard(card);
            const target = state?.targets?.find(candidate => candidate.id === payload.targetId);
            if (!state || !target || target.actorUuid !== payload.actorUuid) {
                throw new Error("The inline save result does not match its snapshotted target.");
            }
            const stage = payload.stage === "secondary" ? "secondary" : "primary";
            const saveRecord = stage === "secondary" ? target.secondary : target;
            if (!saveRecord) throw new Error(`${target.name} has no required secondary save.`);
            if (saveRecord.lastSubmissionId === payload.submissionId) return { status: "duplicate", state, target };
            const { actor } = await resolveTargetDocuments(target);
            assertPersistedTargetIdentity(target, actor);
            const user = game.users?.get?.(payload.userId)
                ?? game.users?.contents?.find(candidate => candidate.id === payload.userId)
                ?? null;
            if (!user || (!user.isGM && !actor?.canUserModify?.(user, "update"))) {
                throw new Error(`${target.name}: the submitting user cannot roll this actor's save.`);
            }
            const recorder = stage === "secondary" ? recordSecondarySave : recordProvisionalSave;
            const result = recorder(state, target.id, {
                degree: payload.degree,
                messageId: null,
                timestamp: Date.now(),
                reroll: payload.reroll,
                total: payload.total,
                natural: payload.natural,
                modifier: payload.modifier,
                submissionId: payload.submissionId
            });
            if (stage === "primary") synchronizeSecondary(state, target);
            const recorded = stage === "secondary" ? target.secondary : target;
            debugLog(state.castId, "inline save result recorded", {
                submissionId: payload.submissionId,
                targetId: target.id,
                targetName: target.name,
                actorUuid: target.actorUuid,
                userId: payload.userId,
                stage,
                degree: recorded.degree,
                total: recorded.saveTotal,
                natural: recorded.saveNatural,
                modifier: recorded.saveModifier,
                revision: recorded.rollRevision,
                status: result.status
            });
            await this.#updateCard(card, state);
            if (result.status === "manual-review") {
                globalThis.ui?.notifications?.warn(`${state.spellName}: ${state.reviewReason} Correct the result manually.`);
            }
            return { status: result.status, state, target };
        });
    }

    async #queue(key, work) {
        const prior = this.#jobs.get(key) ?? Promise.resolve();
        const job = prior.catch(() => {}).then(work);
        this.#jobs.set(key, job);
        try { return await job; }
        finally { if (this.#jobs.get(key) === job) this.#jobs.delete(key); }
    }
}
