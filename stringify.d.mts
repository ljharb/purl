import type PURL from './purl.mjs';
import type { PURLComponents, PURLString } from './purl.mjs';

/**
 * Convert PURL components to a canonical PURL string.
 * @param components - PURL components or PURL object
 * @returns Canonical PURL string
 */
declare function stringify(components: PURLComponents | PURL): PURLString;

export default stringify;
