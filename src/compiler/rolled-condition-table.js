// A condition picked by one roll for the cast, stated as a table of the roll's results with a failure and a critical-failure
// column (Creative Splash):
//   "Roll [[/r 1d4 #Creative Splash]] to determine the color of the illusion. Each creature in the area must succeed at a Will
//   save or take the effect listed on the table for the color." and rows "1 | White | Dazzled for 1 round | Dazzled for 1
//   minute", …
// The table is rewritten as the ordinary degree rows ("The target is Dazzled for 1 round, …, or Frightened 1."); after the rows
// are compiled, each row's conditions must be exactly the table's (value and lifetime), and they're marked as the roll's
// choice. The card rolls once for the cast and applies only the rolled result's condition.
import { htmlToPlainText } from "./description-parser.js";
import { unlinkText as labelOf } from "./text-patterns.js";

const ROLL = /^Roll \[\[\/r (1d(\d+))(?: #[^\]]*)?\]\] to determine the ([a-z]+) of the [a-z]+\.$/;
const SAVE = /^Each creature in the area must succeed at an? (Fortitude|Reflex|Will) save or take the effect listed on the table for the ([a-z]+)\.$/;
const LINK = /^@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Za-z-]+)(?: (\d+))?\}$/;
const PLAIN = /^([A-Z][a-z-]+)(?: (\d+))?$/;
const LIFETIME = /^(.+?)(?: for (\d+) (round|minute)s?)?$/;
// A condition that ends by PF2e's own rule needs no written lifetime.
const SELF_ENDING = new Set(["frightened", "sickened"]);

const cellText = html => String(html ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

function parseCell(text, fallback = null) {
    const [, head, amount, unit] = LIFETIME.exec(text) ?? [];
    if (!head) return null;
    const link = LINK.exec(head), plain = !link && PLAIN.exec(head);
    const name = link?.[2] ?? plain?.[1];
    if (!name) return null;
    const slug = name.toLowerCase();
    const uuid = link?.[1] ?? (fallback?.slug === slug ? fallback.uuid : null);
    if (!uuid) return null;
    const value = link ? (link[3] == null ? null : Number(link[3])) : (plain[2] == null ? null : Number(plain[2]));
    if (!amount && !SELF_ENDING.has(slug)) return null;
    return { slug, name, uuid, value, lifetime: amount ? { value: Number(amount), unit: `${unit}s` } : null };
}

const phrase = cell => `@UUID[${cell.uuid}]{${cell.name}${cell.value == null ? "" : ` ${cell.value}`}}${cell.lifetime ? ` for ${cell.lifetime.value} ${cell.lifetime.value === 1 ? cell.lifetime.unit.replace(/s$/, "") : cell.lifetime.unit}` : ""}`;

/** The rewritten description and the roll, or null for anything outside this shape. */
export function expandRolledConditionTable(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || (adapted.damageComponents ?? []).length) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const table = /<table\b[^>]*>([\s\S]*?)<\/table>/i.exec(html);
    if (!table) return null;
    const [before, after] = [html.slice(0, table.index), html.slice(table.index + table[0].length)];
    if (htmlToPlainText(after).trim()) return null;
    const lead = htmlToPlainText(before).replace(/\s+/g, " ").trim();
    const sentences = lead.split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const rollIndex = sentences.findIndex(sentence => ROLL.test(sentence));
    if (rollIndex < 0 || sentences.length !== rollIndex + 2) return null;
    const roll = ROLL.exec(sentences[rollIndex]), save = SAVE.exec(sentences[rollIndex + 1]);
    if (!save || save[1].toLowerCase() !== adapted.defense.statistic || save[2] !== roll[3]) return null;
    const narration = sentences.slice(0, rollIndex);
    if (narration.some(sentence => /\d|@/.test(sentence))) return null;
    const head = [...table[1].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map(match => cellText(match[1]));
    if (head.length !== 4 || head[0] !== roll[1] || head[2] !== "Failure" || head[3] !== "Critical Failure") return null;
    const rows = [...table[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(match => [...match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(cell => cellText(cell[1])))
        .filter(cells => cells.length);
    const faces = Number(roll[2]);
    if (rows.length !== faces) return null;
    const entries = [];
    for (const [index, cells] of rows.entries()) {
        if (cells.length !== 4 || Number(cells[0]) !== index + 1) return null;
        const failure = parseCell(cells[2]);
        const criticalFailure = failure && parseCell(cells[3], failure);
        if (!failure || !criticalFailure || failure.slug !== criticalFailure.slug) return null;
        entries.push({ result: index + 1, label: cells[1], failure, criticalFailure });
    }
    if (new Set(entries.map(entry => entry.failure.slug)).size !== entries.length) return null;
    // A condition without a lifetime goes last, so it can't borrow the next written one.
    const ordered = [...entries].sort((a, b) => Number(!a.failure.lifetime) - Number(!b.failure.lifetime));
    if (ordered.some(entry => !entry.failure.lifetime !== !entry.criticalFailure.lifetime)) return null;
    const list = degree => {
        const phrases = ordered.map(entry => phrase(entry[degree]));
        return `The target is ${phrases.slice(0, -1).join(", ")}, or ${phrases.at(-1)}.`;
    };
    return {
        html: `${narration.length ? `<p>${narration.join(" ")}</p>` : ""}<p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> ${list("failure")}</p><p><strong>Critical Failure</strong> ${list("criticalFailure")}</p>`,
        conditionRoll: { formula: roll[1], results: Object.fromEntries(entries.map(entry => [entry.result, entry.failure.slug])), chooseOn: [],
            options: ordered.map(entry => entry.failure.slug), labels: Object.fromEntries(entries.map(entry => [entry.failure.slug, entry.label])) },
        expected: { failure: ordered.map(entry => entry.failure), criticalFailure: ordered.map(entry => entry.criticalFailure) },
        sentences: [sentences[rollIndex], sentences[rollIndex + 1]]
    };
}

/** After the rows are compiled: each row holds exactly the table's conditions; they're marked as the roll's choice. */
export function applyRolledConditionTable(plan, expanded) {
    for (const degree of ["failure", "criticalFailure"]) {
        const outcome = plan.resolution.outcomes?.[degree];
        const effects = outcome?.effects ?? [];
        const expected = expanded.expected[degree];
        if (effects.length !== expected.length || (outcome.nativeEffects ?? []).length) return false;
        const matches = effects.every((effect, index) => {
            const cell = expected[index];
            if (effect.kind !== "condition" || effect.slug !== cell.slug || (effect.value ?? null) !== cell.value || effect.endsWhen) return false;
            if (!cell.lifetime) return effect.duration == null;
            return effect.duration?.mode === "fixed" && effect.duration.value === cell.lifetime.value && effect.duration.unit === cell.lifetime.unit;
        });
        if (!matches) return false;
    }
    for (const degree of ["failure", "criticalFailure"]) {
        const outcome = plan.resolution.outcomes[degree];
        for (const effect of outcome.effects) effect.choiceGroup = "condition-roll";
        outcome.conditionRollClaims = [outcome.rawText];
    }
    return true;
}

// Behaviours picked by one roll for the cast (Elysian Whimsy): "You overwhelm the target … if it fails a Will save. Roll [[/r 1d4]] to
// determine the spell's effect." and a two-column table "1d4 | Effect", each row a behaviour for the target's next turn, optionally
// with "On a critical failure, …" (or a Speed penalty "For 1 round, it takes a –5-foot status penalty to its Speeds (-10-foot status
// penalty on a critical failure), …"). A success is unaffected; a failure (or critical failure) gets the rolled row's note.
const NOTE_INTRO = /^[A-Z][^.]* if it fails an? (Fortitude|Reflex|Will) save\.$/;
const NOTE_ROLL = /^Roll \[\[\/r (1d(\d+))(?: #[^\]]*)?\]\] to determine the spell's effect\.$/;
const CRITICAL_CLAUSE = /\s*On a critical failure, ([^.]+\.)$/;
const SPEED_ROW = /^(.*?)For 1 round, it takes a [–-](\d+)-foot status penalty to its Speeds \([–-](\d+)-foot status penalty on a critical failure\), ([a-z ,']+)\.$/;
const NOTE_BLOCKERS = /\d|\b(?:damage|save|bonus|immune|resistance|weakness)\b|conditionitems\.|@Damage|@Check/i;
const NEXT_TURN = { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 1, sourceText: "its next turn" };
const ONE_ROUND = { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: "For 1 round" };

export function expandRolledNoteTable(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || (adapted.damageComponents ?? []).length) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const table = /<table\b[^>]*>([\s\S]*?)<\/table>/i.exec(html);
    if (!table || htmlToPlainText(html.slice(table.index + table[0].length)).trim()) return null;
    const lead = htmlToPlainText(html.slice(0, table.index)).replace(/\s+/g, " ").trim();
    const sentences = lead.split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const intro = sentences.length === 2 ? NOTE_INTRO.exec(sentences[0]) : null;
    const roll = sentences.length === 2 ? NOTE_ROLL.exec(sentences[1]) : null;
    if (!intro || !roll || intro[1].toLowerCase() !== adapted.defense.statistic) return null;
    const head = [...table[1].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map(match => cellText(match[1]));
    if (head.length !== 2 || head[0] !== roll[1]) return null;
    const rows = [...table[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(match => [...match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(cell => cellText(cell[1])))
        .filter(cells => cells.length);
    if (rows.length !== Number(roll[2])) return null;
    const notes = { failure: [], criticalFailure: [] };
    for (const [index, cells] of rows.entries()) {
        if (cells.length !== 2 || Number(cells[0]) !== index + 1) return null;
        const choice = `result-${index + 1}`, label = `${roll[1]} ${index + 1}`;
        const speed = SPEED_ROW.exec(cells[1]);
        if (speed) {
            // The Speed penalty is the note's rule; the rest of the row is narration.
            if (/conditionitems\./.test(`${speed[1]} ${speed[4]}`) || NOTE_BLOCKERS.test(labelOf(`${speed[1]} ${speed[4]}`))) return null;
            const text = value => labelOf(`${speed[1]}For 1 round, it takes a –${value}-foot status penalty to its Speeds, ${speed[4]}.`).trim();
            const rule = value => [{ key: "FlatModifier", selector: "all-speeds", type: "status", value: -Number(value) }];
            notes.failure.push({ label, text: text(speed[2]), sourceText: cells[1], duration: { ...ONE_ROUND }, rules: rule(speed[2]), choiceGroup: "condition-roll", choice });
            notes.criticalFailure.push({ label, text: text(speed[3]), sourceText: cells[1], duration: { ...ONE_ROUND }, rules: rule(speed[3]), choiceGroup: "condition-roll", choice });
            continue;
        }
        const critical = CRITICAL_CLAUSE.exec(cells[1]);
        const base = critical ? cells[1].slice(0, critical.index).trim() : cells[1];
        // (Action links are labels here; a condition link blocks.)
        const blocked = text => /conditionitems\./.test(text) || NOTE_BLOCKERS.test(labelOf(text));
        if (!/\bon its next turn\b/.test(base) || blocked(base) || (critical && blocked(critical[1]))) return null;
        notes.failure.push({ label, text: labelOf(base), sourceText: cells[1], duration: { ...NEXT_TURN }, choiceGroup: "condition-roll", choice });
        notes.criticalFailure.push({ label, text: labelOf(critical ? `${base} On a critical failure: ${critical[1]}` : base), sourceText: cells[1], duration: { ...NEXT_TURN }, choiceGroup: "condition-roll", choice });
    }
    const options = rows.map((_, index) => `result-${index + 1}`);
    return {
        html: `<p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> The target is affected by the rolled result.</p><p><strong>Critical Failure</strong> The target is affected by the rolled result.</p>`,
        conditionRoll: { formula: roll[1], results: Object.fromEntries(options.map((option, index) => [index + 1, option])), chooseOn: [], options,
            labels: Object.fromEntries(options.map((option, index) => [option, `result ${index + 1}`])), kind: "notes" },
        notes, sentences
    };
}
