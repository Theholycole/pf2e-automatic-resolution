export function normalizeSlug(value) {
    return String(value ?? "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function cloneJSON(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function nonEmptyString(value) {
    const text = typeof value === "string" ? value.trim() : "";
    return text || null;
}

