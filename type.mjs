
import parse from './parse.mjs';

/**
 * Get the type component from a PURL string.
 * @param {string} purl - PURL string
 * @returns {string | null} Type component or null if invalid
 */
export default function type(purl) {
	return parse(purl)?.type ?? null;
}
