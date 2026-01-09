/**
 * Get the namespace component from a PURL string.
 * @param purl - PURL string
 * @returns Namespace component or null if invalid or no namespace
 */
declare function namespace(purl: string): string | null;

export default namespace;
