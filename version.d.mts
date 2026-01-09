/**
 * Get the version component from a PURL string.
 * @param purl - PURL string
 * @returns Version component or null if invalid or no version
 */
declare function version(purl: string): string | null;

export default version;
