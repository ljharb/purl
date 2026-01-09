import type PURL from './purl.mjs';
import type { PURLString } from './purl.mjs';

/**
 * Compare two PURLs for sorting.
 * @param a - First PURL
 * @param b - Second PURL
 * @returns negative, zero, or positive
 */
declare function compare(a: PURLString | string | PURL, b: PURLString | string | PURL): number;

export default compare;
