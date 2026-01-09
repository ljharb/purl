import type PURL from './purl.mjs';
import type { PURLString } from './purl.mjs';

/**
 * Check if two PURLs are equal.
 * @param a - First PURL
 * @param b - Second PURL
 * @returns True if equal
 */
declare function eq(a: PURLString | string | PURL, b: PURLString | string | PURL): boolean;

export default eq;
