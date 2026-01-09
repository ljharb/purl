import type PURL from './purl.mjs';
import type { PURLString } from './purl.mjs';

export interface ValidationSuccess {
	/** Package/version exists */
	valid: true;
	/** Latest version from registry */
	latestVersion: string | null;
}

export interface ValidationError {
	/** Package/version does not exist */
	valid: false;
	/** Error message */
	error: string;
	/** Latest version from registry (if known) */
	latestVersion: string | null;
}

export type ValidationResult = ValidationSuccess | ValidationError;

/**
 * List of PURL types that support registry validation.
 */
export const supportedTypes: readonly string[];

/**
 * Validate a PURL against its package registry.
 * @param input - The PURL to validate
 * @returns Validation result
 */
declare function validate(input: PURL | PURLString | string): Promise<ValidationResult>;

export default validate;
