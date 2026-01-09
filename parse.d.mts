import type PURL from './purl.mjs';
import type { PURLString } from './purl.mjs';

/**
 * Parse a PURL string into a PURL object.
 * @param purl - PURL string to parse
 * @returns PURL object or null if invalid
 */
declare function parse(purl: PURLString | string): PURL | null;

export default parse;
