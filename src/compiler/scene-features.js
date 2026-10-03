// Note-only spells that put something on the map the table plays by (Wall of Shrubs, House of Imaginary Walls, Hologram Cage): the line of shrubs
// (difficult terrain from 3rd rank), an invisible wall that blocks movement, a cube of light that blocks sight.
import { durationSeconds, plainText as plain, splitSentences as split } from "./description-parser.js";

const secondsOf = text => durationSeconds(text, { rounds: true });
const sections = rest => rest.flatMap(section => section.split(/(?=<p>\s*<strong>\s*Heightened)/)).map(plain).filter(Boolean);

// Wall of Shrubs: "The wall of shrubs stands in a line 60 feet long, is less than 5 feet tall, and is a foot thick, providing lesser cover." with
// "Heightened (3rd) The shrubs are 10 feet tall and 5 feet thick, provide standard cover, are difficult terrain, and have a Climb DC of 15. The
// duration increases to 10 minutes." and "Heightened (5th) As 3rd rank, but the shrubs provide greater cover and the duration is 1 hour. You can
// choose to form a ring …" — the line placed for the rank's duration, difficult terrain (PF2e's) from the rank that says so; its cover (by
// the attack's line) and Climb DC are on the caster's Effect.
const SHRUBS = /^The [a-z ]+ stands in a line (\d+) feet long, is less than 5 feet tall, and is a foot thick, providing (lesser|standard|greater) cover\.$/;
export function compileShrubWall(adapted) {
    if (String(adapted.targeting?.target ?? "").trim() || (adapted.damageComponents ?? []).length || adapted.lifecycle?.sustained) return null;
    const seconds = secondsOf(adapted.lifecycle?.duration);
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = split(plain(body));
    const at = sentences.findIndex(sentence => SHRUBS.test(sentence));
    if (!seconds || at < 0 || sentences.length !== at + 1 || sentences.slice(0, at).some(sentence => /\d|@|\b(?:damage|saves?|bonus|penalty|DC|terrain)\b/i.test(sentence))) return null;
    const [, length, cover] = SHRUBS.exec(sentences[at]);
    const steps = [{ minRank: Number(adapted.rank ?? 1), cover, terrain: false, climbDC: null, seconds, ring: null }];
    for (const text of sections(rest)) {
        const third = /^Heightened \((\d+)(?:st|nd|rd|th)\) The [a-z]+ are (\d+) feet tall and (\d+) feet thick, provide (lesser|standard|greater) cover, are difficult terrain, and have a Climb DC of (\d+)\. The duration increases to (\d+) (minute|hour)s?\.$/.exec(text);
        const fifth = /^Heightened \((\d+)(?:st|nd|rd|th)\) As \d+(?:st|nd|rd|th) rank, but the [a-z]+ provide (lesser|standard|greater) cover and the duration is (\d+) (minute|hour)s?\. You can choose to form a ring of [a-z]+ with a diameter of up to (\d+) feet instead of a line\.$/.exec(text);
        const last = steps.at(-1);
        if (third) steps.push({ minRank: Number(third[1]), cover: third[4], terrain: true, climbDC: Number(third[5]), seconds: Number(third[6]) * (third[7] === "hour" ? 3600 : 60), ring: null });
        else if (fifth) steps.push({ ...last, minRank: Number(fifth[1]), cover: fifth[2], seconds: Number(fifth[3]) * (fifth[4] === "hour" ? 3600 : 60), ring: Number(fifth[5]) });
        else return null;
    }
    return { shrubWall: { lengthFeet: Number(length), steps }, claimed: [...sentences, ...sections(rest)] };
}

/** The shrubs at a cast rank. */
export function shrubsAt(data, castRank) {
    return data.steps.filter(step => castRank >= step.minRank).at(-1) ?? data.steps[0];
}

// House of Imaginary Walls: "You mime an Invisible 10-foot-by-10-foot wall adjacent to you and within your reach. The wall is solid to those
// creatures that don't disbelieve it, even incorporeal creatures. … The wall has AC 10, Hardness equal to double the spell's rank, and HP equal to
// quadruple the spell's rank." — a wall on the map that blocks movement (not sight: it's invisible) for the duration; disbelief, immunity and its
// AC/Hardness/HP are on the caster's Effect.
const MIME = /^You mime an? (?:@UUID\[[^\]]+\]\{Invisible\}|Invisible) (\d+)-foot-by-(\d+)-foot wall adjacent to you and within your reach\.$/;
const MIME_SOLID = /^The wall is solid to those creatures that don't disbelieve it, even incorporeal creatures\.$/;
const MIME_STATS = /^The wall has AC (\d+), Hardness equal to double the spell's rank, and HP equal to quadruple the spell's rank\.$/;
// Hologram Cage: "Area 1 cube 20 feet on each side" / "The walls shed bright light for 10 feet (and dim light for the next 20 feet) and completely
// block line of sight; …" / "if you Cast the Spell again, your previous hologram cage ends." with "Heightened (7th) … you can expand the cube to
// be 25 feet on each side." — the cube's walls block sight (not movement) and a light at its centre sheds the light; a new cast ends the last.
const CAGE_LIGHT = /^The walls shed bright light for (\d+) feet \(and dim light for the next (\d+) feet\) and completely block line of sight; creatures within the cage can't be seen by creatures outside of it, though they can see each other, and creatures outside of it can't see into it\.$/;
const CAGE_AGAIN = /^You can (?:@UUID\[[^\]]+\]\{Dismiss\}|Dismiss) the spell, and if you Cast the Spell again, your previous [a-z ]+ ends\.$/;
// Wall of Force: "You form an {Invisible} wall of pure magical force up to 50 feet long and up to 20 feet high. The wall has no discernible thickness. You
// must create the wall in an unbroken open space so its edges don't pass through any creatures or objects, or the spell is lost. The wall has AC 10, Hardness
// 30, and 60 Hit Points, and it's immune to critical hits and precision damage. The wall blocks physical effects from passing through it, and because it's made
// of force, it blocks incorporeal and ethereal creatures as well. Teleportation effects can pass through the barrier, as can visual effects (since the wall is
// invisible). Wall of force is immune to counteracting effects of its level or lower, but the wall is automatically destroyed by a {Disintegrate} spell of any
// rank." with "Heightened (+2) The Hit Points of the wall increase by 20." — a wall on the map that blocks movement (not sight), its statistics at the cast rank
// on the caster's Effect, the rest notes.
const FORCE = {
    form: /^You form an? (?:@UUID\[[^\]]+\]\{Invisible\}|Invisible) wall of [a-z ]+ up to (\d+) feet long and up to (\d+) feet high\.$/,
    stats: /^The wall has AC (\d+), Hardness (\d+), and (\d+) Hit Points, and it's immune to critical hits and precision damage\.$/,
    step: /^Heightened \(\+(\d)\) The Hit Points of the wall increase by (\d+)\.$/,
    notes: [/^The wall has no discernible thickness\.$/, /^You must create the wall in an unbroken open space so its edges don't pass through any creatures or objects, or the spell is lost\.$/,
        /^The wall blocks physical effects from passing through it, and because it's made of force, it blocks incorporeal and ethereal creatures as well\.$/,
        /^Teleportation effects can pass through the barrier, as can visual effects \(since the wall is invisible\)\.$/,
        /^[A-Za-z ]+ is immune to counteracting effects of its level or lower, but the wall is automatically destroyed by an? (?:@UUID\[[^\]]+\]\{[A-Za-z ]+\}|[A-Za-z ]+) spell of any rank\.$/]
};
export function compileSceneWalls(adapted) {
    if (String(adapted.targeting?.target ?? "").trim() || (adapted.damageComponents ?? []).length || adapted.lifecycle?.sustained) return null;
    const seconds = secondsOf(adapted.lifecycle?.duration);
    if (!seconds) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").replace(/<\/?em>/g, "").split(/<hr\s*\/?>/i);
    const sentences = split(plain(body));
    const force = FORCE.form.exec(sentences[0] ?? "");
    if (force && sentences.length === 7 && FORCE.stats.test(sentences[3] ?? "")) {
        const notes = [sentences[1], sentences[2], ...sentences.slice(4)];
        if (!notes.every(sentence => FORCE.notes.some(pattern => pattern.test(sentence)))) return null;
        const steps = sections(rest);
        const step = steps.length === 1 ? FORCE.step.exec(steps[0]) : null;
        if (steps.length && !step) return null;
        const [, ac, hardness, hp] = FORCE.stats.exec(sentences[3]);
        return { sceneWalls: { shape: "plane", lengthFeet: Number(force[1]), blocksMove: true, blocksSight: false, light: null, seconds, replacesPrevious: false,
            stats: { ac: Number(ac), hardness: Number(hardness), hp: Number(hp), hpStep: step ? { interval: Number(step[1]), add: Number(step[2]), baseRank: Number(adapted.rank) || 1 } : null },
            notes: [`It's up to ${force[2]} feet high.`, ...notes.map(sentence => sentence.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1"))] },
            claimed: [...sentences, ...steps] };
    }
    const mime = MIME.exec(sentences[0] ?? "");
    if (mime && MIME_SOLID.test(sentences[1] ?? "") && MIME_STATS.test(sentences.at(-1) ?? "") && !rest.length) {
        const middle = sentences.slice(2, -1);
        if (middle.some(sentence => /\bdamage\b|\bbonus\b|\bpenalty\b/.test(sentence))) return null;
        return { sceneWalls: { shape: "plane", lengthFeet: Number(mime[1]), blocksMove: true, blocksSight: false, light: null, seconds, replacesPrevious: false,
            stats: { ac: Number(MIME_STATS.exec(sentences.at(-1))[1]), hardnessPerRank: 2, hpPerRank: 4 }, notes: middle.map(sentence => sentence.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")) },
            claimed: sentences };
    }
    const area = adapted.targeting?.area;
    const parts = [body, ...rest].map(plain);
    const cageAt = parts.findIndex(part => split(part).some(sentence => CAGE_LIGHT.test(sentence)));
    if (area?.type === "cube" && cageAt >= 0) {
        const cage = split(parts[cageAt]);
        const light = CAGE_LIGHT.exec(cage.find(sentence => CAGE_LIGHT.test(sentence)));
        if (cage.some(sentence => !CAGE_LIGHT.test(sentence) && !CAGE_AGAIN.test(sentence) && !/^You weave light into a cube of vivid and fantastic patterns\.$/.test(sentence))) return null;
        const others = parts.filter((_part, index) => index !== cageAt);
        const steps = [];
        for (const part of others) {
            if (/^Area 1 cube \d+ feet on each side$/.test(part)) continue;
            const step = /^Heightened \((\d+)(?:st|nd|rd|th)\) The range of the spell increases to (\d+) feet, and you can expand the cube to be (\d+) feet on each side\.$/.exec(part);
            if (!step) return null;
            steps.push({ minRank: Number(step[1]), sizeFeet: Number(step[3]), rangeFeet: Number(step[2]) });
        }
        return { sceneWalls: { shape: "cube", sizeFeet: Number(area.value), steps, blocksMove: false, blocksSight: true, light: { bright: Number(light[1]), dim: Number(light[1]) + Number(light[2]) },
            seconds, replacesPrevious: cage.some(sentence => CAGE_AGAIN.test(sentence)), stats: null, notes: [] }, claimed: [...parts] };
    }
    return null;
}

/** The wall segments (pixel coordinates) for a region's first shape: a rectangle's or polygon's edges (a cube), or its long midline (a plane). */
export function wallSegments(shape, mode) {
    let points = null;
    if (shape?.type === "rectangle") points = [[shape.x, shape.y], [shape.x + shape.width, shape.y], [shape.x + shape.width, shape.y + shape.height], [shape.x, shape.y + shape.height]];
    else if (shape?.type === "polygon") { points = []; for (let i = 0; i + 1 < shape.points.length; i += 2) points.push([shape.points[i], shape.points[i + 1]]); }
    else if (shape?.type === "line") {
        const angle = (Number(shape.rotation ?? 0) * Math.PI) / 180;
        return [[shape.x, shape.y, Math.round(shape.x + shape.length * Math.cos(angle)), Math.round(shape.y + shape.length * Math.sin(angle))]];
    }
    if (!points?.length) return [];
    if (mode === "plane") {
        const xs = points.map(point => point[0]), ys = points.map(point => point[1]);
        const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
        return maxX - minX >= maxY - minY ? [[minX, (minY + maxY) / 2, maxX, (minY + maxY) / 2]] : [[(minX + maxX) / 2, minY, (minX + maxX) / 2, maxY]];
    }
    return points.map((point, index) => [...point, ...points[(index + 1) % points.length]]);
}
