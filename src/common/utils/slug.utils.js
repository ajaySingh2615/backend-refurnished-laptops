/**
 * Convert a string to a URL-friendly slug.
 * "Dell Latitude 5520 — 16 GB" → "dell-latitude-5520-16-gb"
 */
export function slugify(text) {
  return text
    .toString()
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}
