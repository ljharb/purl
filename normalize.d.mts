import type { PURLString } from './purl.mjs';

/**
 * Normalize a PURL string to its canonical form.
 * @param purl - PURL string to normalize
 * @returns Normalized PURL string
 * @throws {TypeError} If the input is not a valid PURL
 */
declare function normalize(purl: PURLString | string): PURLString;

export default normalize;
