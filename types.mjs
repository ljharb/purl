/**
 * @import {
 *   PURLTypeInfo,
 *   PURLTypesData,
 *   PURLRegistryConfig,
 *   NamespaceRequirement,
 * } from './types.mjs'
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/** @type {PURLTypesData} */
const purlTypesData = require('./vendor/purl-spec/purl-types.json');

const { fromEntries } = Object;

/**
 * The version of the purl-types specification.
 * @type {string}
 */
export const specVersion = purlTypesData.version;

/**
 * The source URL of the purl-types specification.
 * @type {string}
 */
export const specSource = purlTypesData.source;

/**
 * The last updated date of the purl-types specification.
 * @type {string}
 */
export const specLastUpdated = purlTypesData.last_updated;

/**
 * List of all known PURL types from the official specification.
 * @type {string[]}
 */
export const knownTypes = Object.keys(purlTypesData.types).toSorted();

/**
 * Check if a type is a known/official PURL type.
 * @param {string} type - The type to check
 * @returns {boolean} True if the type is known
 */
export function isKnownType(type) {
	return typeof type === 'string' && type in purlTypesData.types;
}

/**
 * Get information about a specific PURL type.
 * @param {string} type - The type to get info for
 * @returns {PURLTypeInfo | null} Type information or null if unknown
 */
export function getTypeInfo(type) {
	if (!isKnownType(type)) {
		return null;
	}
	const { [type]: info } = purlTypesData.types;
	return {
		// eslint-disable-next-line camelcase -- purl-types.json uses snake_case
		default_registry: info.default_registry ?? null,
		description: info.description,
		examples: info.examples,
		// eslint-disable-next-line camelcase -- purl-types.json uses snake_case
		namespace_requirement: info.namespace_requirement ?? null,
		// eslint-disable-next-line camelcase -- purl-types.json uses snake_case
		registry_config: info.registry_config ?? null,
	};
}

/**
 * Get the description for a PURL type.
 * @param {string} type - The type
 * @returns {string | null} Description or null if unknown type
 */
export function getTypeDescription(type) {
	return getTypeInfo(type)?.description ?? null;
}

/**
 * Get the default registry URL for a PURL type.
 * @param {string} type - The type
 * @returns {string | null} Default registry URL or null
 */
export function getDefaultRegistry(type) {
	return getTypeInfo(type)?.default_registry ?? null;
}

/**
 * Get the namespace requirement for a PURL type.
 * @param {string} type - The type
 * @returns {NamespaceRequirement | null} Namespace requirement or null if unknown/unspecified
 */
export function getNsRequirement(type) {
	return getTypeInfo(type)?.namespace_requirement ?? null;
}

/**
 * Check if a PURL type requires a namespace.
 * @param {string} type - The type
 * @returns {boolean} True if namespace is required
 */
export function requiresNamespace(type) {
	return getNsRequirement(type) === 'required';
}

/**
 * Check if a PURL type prohibits a namespace.
 * @param {string} type - The type
 * @returns {boolean} True if namespace is prohibited
 */
export function prohibitsNamespace(type) {
	return getNsRequirement(type) === 'prohibited';
}

/**
 * Get example PURLs for a type.
 * @param {string} type - The type
 * @returns {string[] | null} Array of example PURL strings or null if unknown type
 */
export function getExamples(type) {
	return getTypeInfo(type)?.examples ?? null;
}

/**
 * Get the registry configuration for a PURL type.
 * @param {string} type - The type
 * @returns {PURLRegistryConfig | null} Registry configuration or null
 */
export function getRegistryConfig(type) {
	return getTypeInfo(type)?.registry_config ?? null;
}

/**
 * Get all types that have registry configurations.
 * @returns {string[]} Array of type names with registry configs
 */
export function regConfigTypes() {
	return knownTypes.filter((type) => purlTypesData.types[type].registry_config !== undefined);
}

/**
 * Get all types that require a namespace.
 * @returns {string[]} Array of type names that require namespace
 */
export function nsRequiredTypes() {
	return knownTypes.filter((type) => purlTypesData.types[type].namespace_requirement === 'required');
}

/**
 * Get all types that prohibit a namespace.
 * @returns {string[]} Array of type names that prohibit namespace
 */
export function nsProhibitedTypes() {
	return knownTypes.filter((type) => purlTypesData.types[type].namespace_requirement === 'prohibited');
}

/**
 * Get all types that have a default registry.
 * @returns {string[]} Array of type names with default registries
 */
export function defRegistryTypes() {
	return knownTypes.filter((type) => {
		const reg = purlTypesData.types[type].default_registry;
		return reg !== null && reg !== undefined;
	});
}

/**
 * Get the raw type data for all known types.
 * @returns {Record<string, PURLTypeInfo>} Map of type names to their info
 */
export function getAllTypeInfo() {
	/** @type {Record<string, PURLTypeInfo>} */
	return fromEntries(knownTypes.map((type) => [type, getTypeInfo(type)]));
}

/**
 * Check if a namespace is valid for a given PURL type.
 * @param {string} type - The PURL type
 * @param {string | null} namespace - The namespace to check
 * @returns {string | null} Error message if invalid, null if valid
 */
export function checkNamespace(type, namespace) {
	const hasNamespace = namespace !== null && namespace !== '';
	const requirement = getNsRequirement(type);

	if (requirement === 'required' && !hasNamespace) {
		return `Type "${type}" requires a namespace`;
	}
	if (requirement === 'prohibited' && hasNamespace) {
		return `Type "${type}" prohibits a namespace`;
	}

	return null;
}
