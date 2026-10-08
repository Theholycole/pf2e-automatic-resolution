// Text the module needs but doesn't ship — a book's table the Foundry data lacks (Patron's Apocalypse's apocalypses, from the user's own copy of the book): read at
// startup from the user's file outside the module (Data/pf2e-automatic-resolution-supplements/, scripts/main.js; the tests read .cache/supplements/), kept here for
// the compiler. Without it, the spell that needs it isn't automated.
export const SUPPLEMENT_FOLDER = "pf2e-automatic-resolution-supplements";
export const SUPPLEMENT_FILES = { patronsApocalypse: "patrons-apocalypse.json" };

const supplements = new Map();
export function setSupplement(name, value) { supplements.set(name, value ?? null); }
export function supplement(name) { return supplements.get(name) ?? null; }
