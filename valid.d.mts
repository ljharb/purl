import type { PURLString } from './purl.mjs';

/**
 * Validate a PURL string and return its normalized form.
 * @param purl - PURL string to validate
 * @returns Normalized PURL string or null if invalid
 */
declare function valid(purl: PURLString | string): PURLString | null;

export default valid;
