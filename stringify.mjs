/** @import { PURLComponents } from './purl.mjs' */

import PURL from './purl.mjs';

/**
 * Convert PURL components to a canonical PURL string.
 * @param {PURLComponents | PURL} components - PURL components or PURL object
 * @returns {string} Canonical PURL string
 */
export default function stringify(components) {
	return `${new PURL(components)}`;
}
