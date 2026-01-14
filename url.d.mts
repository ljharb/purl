import type PURL from './purl.mjs';
import type { PURLString } from './purl.mjs';

/**
 * Get the package webpage URL for a PURL.
 * @param input - The PURL to get URL for
 * @returns The package URL, or null if not available
 */
declare function url(input: PURL | PURLString | string): string | null;

/**
 * List of PURL types that support URL generation.
 */
export const supportedUrlTypes: readonly string[];

export default url;
