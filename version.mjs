
import parse from './parse.mjs';

/**
 * Get the version component from a PURL string.
 * @param {string} purl - PURL string
 * @returns {string | null} Version component or null if invalid or no version
 */
export default function version(purl) {
	return parse(purl)?.version ?? null;
}
