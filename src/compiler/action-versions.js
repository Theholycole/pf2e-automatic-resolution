// Rows that depend on the number of actions spent ("If you cast the 3-action version, you can move the target up to 5 feet; …"): a PF2e
// variant with a fixed action count reads its own version. For the matching count the clause becomes the row's own sentence ("You can move
// the target up to 5 feet; …"); for any other count it's dropped (up to the end of the row). A spell cast without a fixed count (its base
// card) is left as it is.

const ACTION_VERSION = /If you cast the (\d)-action version, you ([^<]*?)(?=\s*<\/p>)/g;

/** The description at a fixed action count, or null when there's nothing to settle. */
export function applyActionVersion(html, time) {
    const count = /^\s*(\d)\s*$/.exec(String(time ?? ""))?.[1];
    if (!count || !/If you cast the \d-action version, you /.test(String(html ?? ""))) return null;
    return String(html).replace(ACTION_VERSION, (_match, version, rest) => version === count ? `You ${rest}` : "").replace(/\s+<\/p>/g, "</p>");
}
