import compare from './compare.mjs';

/**
 * Check if two PURLs are equal.
 * @param {string | import('./purl.mjs').default} a - First PURL
 * @param {string | import('./purl.mjs').default} b - Second PURL
 * @returns {boolean} True if equal
 */
export default function eq(a, b) {
	try {
		return compare(a, b) === 0;
	} catch {
		return false;
	}
}
