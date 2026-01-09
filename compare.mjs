import PURL from './purl.mjs';

/**
 * Compare two PURLs for sorting.
 * @param {string | PURL} a - First PURL
 * @param {string | PURL} b - Second PURL
 * @returns {number} negative, zero, or positive
 */
export default function compare(a, b) {
	return `${new PURL(a)}`.localeCompare(`${new PURL(b)}`);
}
