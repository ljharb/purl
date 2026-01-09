import PURL from './purl.mjs';

/**
 * Normalize a PURL string to its canonical form.
 * @param {string} purl - PURL string to normalize
 * @returns {string} Normalized PURL string
 * @throws {TypeError} If the input is not a valid PURL
 */
export default function normalize(purl) {
	return `${new PURL(purl)}`;
}
