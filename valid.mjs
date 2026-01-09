import parse from './parse.mjs';

/**
 * Validate a PURL string and return its normalized form.
 * @param {string} purl - PURL string to validate
 * @returns {string | null} Normalized PURL string or null if invalid
 */
export default function valid(purl) {
	const parsed = parse(purl);
	return parsed ? `${parsed}` : null;
}
