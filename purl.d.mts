/**
 * PURL scheme - always "pkg" per ECMA-427.
 */
export type PURLScheme = 'pkg';

/**
 * PURL type - starts with a letter, contains only [a-z0-9.+-].
 * Common types: npm, pypi, gem, cargo, nuget, hex, maven, composer, pub, hackage, cocoapods, golang, docker, github, bitbucket, swift.
 */
export type PURLType = string;

/**
 * PURL namespace segment - percent-encoded string (@ encoded as %40).
 */
export type PURLNamespace = string;

/**
 * PURL name segment - percent-encoded string.
 */
export type PURLName = string;

/**
 * PURL version - percent-encoded string prefixed with @.
 */
export type PURLVersion = `@${string}`;

/**
 * PURL qualifiers - key=value pairs separated by &, prefixed with ?.
 */
export type PURLQualifiers = `?${string}`;

/**
 * PURL subpath - path segments separated by /, prefixed with #.
 */
export type PURLSubpath = `#${string}`;

/**
 * Base PURL string without optional components: pkg:type/name
 */
export type PURLBase = `${PURLScheme}:${PURLType}/${PURLName}`;

/**
 * PURL string with namespace: pkg:type/namespace/name
 */
export type PURLWithNamespace = `${PURLScheme}:${PURLType}/${PURLNamespace}/${PURLName}`;

/**
 * A PURL string type that matches the format: pkg:type/[namespace/]name[@version][?qualifiers][#subpath]
 */
export type PURLString = `pkg:${PURLType}/${string}`;

export interface PURLComponents {
	/** Package type (e.g., "npm", "pypi", "gem") */
	type: string;
	/** Package namespace (e.g., "@babel" for npm scoped packages) */
	namespace?: string | null;
	/** Package name */
	name: string;
	/** Package version */
	version?: string | null;
	/** Key-value qualifiers */
	qualifiers?: Record<string, string> | null;
	/** Subpath within the package */
	subpath?: string | null;
}

export interface ParsedPURLComponents {
	/** Package type (e.g., "npm", "pypi", "gem") */
	type: string;
	/** Package namespace (e.g., "@babel" for npm scoped packages) */
	namespace: string | null;
	/** Package name */
	name: string;
	/** Package version */
	version: string | null;
	/** Key-value qualifiers */
	qualifiers: Record<string, string> | null;
	/** Subpath within the package */
	subpath: string | null;
}

/**
 * PURL class representing a Package URL per ECMA-427.
 */
declare class PURL {
	/**
	 * Create a PURL instance.
	 * @param input - PURL string, components object, or another PURL instance
	 */
	constructor(input: PURLString | string | PURLComponents | PURL);

	/** Package type */
	readonly type: string;

	/** Package namespace */
	readonly namespace: string | null;

	/** Package name */
	readonly name: string;

	/** Package version */
	readonly version: string | null;

	/** Qualifiers */
	readonly qualifiers: Record<string, string> | null;

	/** Subpath */
	readonly subpath: string | null;

	/**
	 * Convert to canonical PURL string.
	 */
	toString(): PURLString;

	/**
	 * Parse a PURL string into components.
	 * @param purl - PURL string to parse
	 * @returns Parsed components or null if invalid
	 */
	static parse(purl: PURLString | string): ParsedPURLComponents | null;

	/**
	 * Check if two PURLs are equal.
	 * @param other - Other PURL to compare
	 */
	equals(other: PURL | PURLString | string): boolean;

	/**
	 * Compare two PURLs for sorting.
	 * @param other - Other PURL to compare
	 * @returns negative, zero, or positive
	 */
	compare(other: PURL | PURLString | string): number;
}

export default PURL;
