
import parse from './parse.mjs';

/**
 * Get the subpath component from a PURL string.
 * @param {string} purl - PURL string
 * @returns {string | null} Subpath component or null if invalid or no subpath
 */
export default function subpath(purl) {
	return parse(purl)?.subpath ?? null;
}
