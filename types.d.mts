/**
 * Namespace requirement for a PURL type.
 */
export type NamespaceRequirement = 'required' | 'optional' | 'prohibited';

/**
 * Component configuration for registry URL generation.
 */
export interface PURLRegistryComponents {
	/** Whether the type uses namespaces */
	namespace: boolean;
	/** Whether namespace is required */
	namespace_required?: boolean;
	/** Prefix for namespace (e.g., "@" for npm) */
	namespace_prefix?: string;
	/** Whether version is included in URL */
	version_in_url: boolean;
	/** Path separator for version */
	version_path?: string;
	/** Prefix for version */
	version_prefix?: string;
	/** Separator for version (e.g., "-" for hackage) */
	version_separator?: string;
	/** Default version string */
	default_version?: string;
	/** Whether URL has trailing slash */
	trailing_slash?: boolean;
	/** Special handling instructions */
	special_handling?: string;
}

/**
 * Registry configuration for a PURL type.
 */
export interface PURLRegistryConfig {
	/** Base URL for package pages */
	base_url: string;
	/** Regex for reverse-matching URLs to PURLs */
	reverse_regex: string;
	/** URI template for generating package URLs */
	uri_template: string;
	/** URI template with version included */
	uri_template_with_version?: string;
	/** URI template without namespace */
	uri_template_no_namespace?: string;
	/** URI template with version, without namespace */
	uri_template_with_version_no_namespace?: string;
	/** Component configuration */
	components: PURLRegistryComponents;
}

/**
 * Information about a PURL type.
 */
export interface PURLTypeInfo {
	/** Description of the package type */
	description: string;
	/** Default registry URL */
	default_registry: string | null;
	/** Namespace requirement */
	namespace_requirement: NamespaceRequirement | null;
	/** Example PURLs */
	examples: string[];
	/** Registry configuration */
	registry_config: PURLRegistryConfig | null;
}

/**
 * Raw type data from purl-types.json.
 */
export interface PURLTypeRaw {
	description: string;
	default_registry: string | null;
	namespace_requirement?: NamespaceRequirement;
	examples: string[];
	registry_config?: PURLRegistryConfig;
}

/**
 * Structure of the purl-types.json file.
 */
export interface PURLTypesData {
	version: string;
	description: string;
	source: string;
	last_updated: string;
	types: Record<string, PURLTypeRaw>;
}

/**
 * The version of the purl-types specification.
 */
export const specVersion: string;

/**
 * The source URL of the purl-types specification.
 */
export const specSource: string;

/**
 * The last updated date of the purl-types specification.
 */
export const specLastUpdated: string;

/**
 * List of all known PURL types from the official specification.
 */
export const knownTypes: readonly string[];

/**
 * Check if a type is a known/official PURL type.
 * @param type - The type to check
 * @returns True if the type is known
 */
export function isKnownType(type: string): boolean;

/**
 * Get information about a specific PURL type.
 * @param type - The type to get info for
 * @returns Type information or null if unknown
 */
export function getTypeInfo(type: string): PURLTypeInfo | null;

/**
 * Get the description for a PURL type.
 * @param type - The type
 * @returns Description or null if unknown type
 */
export function getTypeDescription(type: string): string | null;

/**
 * Get the default registry URL for a PURL type.
 * @param type - The type
 * @returns Default registry URL or null
 */
export function getDefaultRegistry(type: string): string | null;

/**
 * Get the namespace requirement for a PURL type.
 * @param type - The type
 * @returns Namespace requirement or null if unknown/unspecified
 */
export function getNsRequirement(type: string): NamespaceRequirement | null;

/**
 * Check if a PURL type requires a namespace.
 * @param type - The type
 * @returns True if namespace is required
 */
export function requiresNamespace(type: string): boolean;

/**
 * Check if a PURL type prohibits a namespace.
 * @param type - The type
 * @returns True if namespace is prohibited
 */
export function prohibitsNamespace(type: string): boolean;

/**
 * Get example PURLs for a type.
 * @param type - The type
 * @returns Array of example PURL strings or null if unknown type
 */
export function getExamples(type: string): readonly string[] | null;

/**
 * Get the registry configuration for a PURL type.
 * @param type - The type
 * @returns Registry configuration or null
 */
export function getRegistryConfig(type: string): PURLRegistryConfig | null;

/**
 * Get all types that have registry configurations.
 * @returns Array of type names with registry configs
 */
export function regConfigTypes(): readonly string[];

/**
 * Get all types that require a namespace.
 * @returns Array of type names that require namespace
 */
export function nsRequiredTypes(): readonly string[];

/**
 * Get all types that prohibit a namespace.
 * @returns Array of type names that prohibit namespace
 */
export function nsProhibitedTypes(): readonly string[];

/**
 * Get all types that have a default registry.
 * @returns Array of type names with default registries
 */
export function defRegistryTypes(): readonly string[];

/**
 * Get the raw type data for all known types.
 * @returns Map of type names to their info
 */
export function getAllTypeInfo(): Record<string, PURLTypeInfo>;

/**
 * Check if a namespace is valid for a given PURL type.
 * @param type - The PURL type
 * @param namespace - The namespace to check
 * @returns Error message if invalid, null if valid
 */
export function checkNamespace(type: string, namespace: string | null): string | null;
