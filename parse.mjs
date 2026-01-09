import PURL from './purl.mjs';

/**
 * Parse a PURL string into a PURL object.
 * @param {string} purl - PURL string to parse
 * @returns {PURL | null} PURL object or null if invalid
 */
export default function parse(purl) {
	try {
		return new PURL(purl);
	} catch {
		return null;
	}
}
