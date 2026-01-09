
import parse from './parse.mjs';

/**
 * Get the namespace component from a PURL string.
 * @param {string} purl - PURL string
 * @returns {string | null} Namespace component or null if invalid or no namespace
 */
export default function namespace(purl) {
	return parse(purl)?.namespace ?? null;
}
