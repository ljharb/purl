/**
 * Get the qualifiers component from a PURL string.
 * @param purl - PURL string
 * @returns Qualifiers object or null if invalid or no qualifiers
 */
declare function qualifiers(purl: string): Record<string, string> | null;

export default qualifiers;
