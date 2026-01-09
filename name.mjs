
import parse from './parse.mjs';

/**
 * Get the name component from a PURL string.
 * @param {string} purl - PURL string
 * @returns {string | null} Name component or null if invalid
 */
export default function name(purl) {
	return parse(purl)?.name ?? null;
}
