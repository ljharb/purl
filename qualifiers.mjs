
import parse from './parse.mjs';

/**
 * Get the qualifiers component from a PURL string.
 * @param {string} purl - PURL string
 * @returns {Record<string, string> | null} Qualifiers object or null if invalid or no qualifiers
 */
export default function qualifiers(purl) {
	const parsed = parse(purl);
	return parsed?.qualifiers ?? null;
}
