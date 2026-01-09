/**
 * Get the subpath component from a PURL string.
 * @param purl - PURL string
 * @returns Subpath component or null if invalid or no subpath
 */
declare function subpath(purl: string): string | null;

export default subpath;
