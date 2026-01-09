/** @import { PURLComponents, ParsedPURLComponents } from './purl.mjs' */

import compare from './compare.mjs';
import eq from './eq.mjs';

const SCHEME = 'pkg';

// Valid type regex: starts with letter, contains only [a-z0-9.+-]
const TYPE_REGEX = /^[a-z][a-z0-9.+-]*$/;

// Characters that must be percent-encoded in different contexts per ECMA-427
// Note: @ must be encoded in namespace/name segments since it's a PURL delimiter
const ENCODE_COMPONENT = /[^a-zA-Z0-9._~!$&'()*+,;=:@/-]/g;
const ENCODE_SEGMENT = /[^a-zA-Z0-9._~!$&'()*+,;=:-]/g;

/**
 * Percent-encode a string for use in PURL components.
 * @param {string} str - String to encode
 * @param {RegExp} pattern - Pattern matching characters to encode
 * @returns {string} Encoded string
 */
function percentEncode(str, pattern) {
	return str.replace(pattern, (char) => {
		const hex = char.charCodeAt(0).toString(16).toUpperCase();
		return `%${hex.padStart(2, '0')}`;
	});
}

/**
 * Percent-decode a string.
 * @param {string} str - String to decode
 * @returns {string} Decoded string
 */
function percentDecode(str) {
	return decodeURIComponent(str);
}

/**
 * Extract subpath from remainder string.
 * @param {string} remainder - Remainder string
 * @returns {{ subpath: string | null, remainder: string }} Extracted subpath and remaining string
 */
function extractSubpath(remainder) {
	const hashIndex = remainder.indexOf('#');
	if (hashIndex === -1) {
		return { remainder, subpath: null };
	}
	return {
		remainder: remainder.slice(0, hashIndex),
		subpath: percentDecode(remainder.slice(hashIndex + 1)),
	};
}

/**
 * Parse qualifier pairs from query string.
 * @param {string} queryString - Query string
 * @returns {Record<string, string> | null} Qualifiers object or null if invalid
 */
function parseQualifiers(queryString) {
	if (queryString.length === 0) {
		return null;
	}
	/** @type {Record<string, string>} */
	const qualifiers = { __proto__: null };
	const pairs = queryString.split('&');
	for (const pair of pairs) {
		const eqIndex = pair.indexOf('=');
		if (eqIndex === -1) {
			return null;
		}
		const key = percentDecode(pair.slice(0, eqIndex)).toLowerCase();
		const value = percentDecode(pair.slice(eqIndex + 1));
		qualifiers[key] = value;
	}
	return qualifiers;
}

/**
 * Extract qualifiers from remainder string.
 * @param {string} remainder - Remainder string
 * @returns {{ qualifiers: Record<string, string> | null, remainder: string } | null} Result or null if invalid
 */
function extractQualifiers(remainder) {
	const queryIndex = remainder.indexOf('?');
	if (queryIndex === -1) {
		return { qualifiers: null, remainder };
	}
	const queryString = remainder.slice(queryIndex + 1);
	const qualifiers = parseQualifiers(queryString);
	if (queryString.length > 0 && qualifiers === null) {
		return null;
	}
	return { qualifiers, remainder: remainder.slice(0, queryIndex) };
}

/**
 * Extract version from remainder string.
 * @param {string} remainder - Remainder string
 * @returns {{ version: string | null, remainder: string }} Extracted version and remaining string
 */
function extractVersion(remainder) {
	const atIndex = remainder.lastIndexOf('@');
	if (atIndex === -1) {
		return { remainder, version: null };
	}
	const slashIndex = remainder.indexOf('/');
	if (slashIndex === -1 || atIndex <= slashIndex) {
		return { remainder, version: null };
	}
	return {
		remainder: remainder.slice(0, atIndex),
		version: percentDecode(remainder.slice(atIndex + 1)),
	};
}

/**
 * Encode a namespace segment (encode / as %2F).
 * @param {string} segment - Segment to encode
 * @returns {string} Encoded segment
 */
function encodeNsSeg(segment) {
	return percentEncode(segment, ENCODE_SEGMENT).replace(/\//g, '%2F');
}

/**
 * Encode a name component.
 * @param {string} name - Name to encode
 * @returns {string} Encoded name
 */
function encodeName(name) {
	return percentEncode(name, ENCODE_SEGMENT);
}

/**
 * Encode a version component.
 * @param {string} version - Version to encode
 * @returns {string} Encoded version
 */
function encodeVersion(version) {
	return percentEncode(version, ENCODE_COMPONENT);
}

/**
 * Encode a qualifier key (must be lowercase).
 * @param {string} key - Key to encode
 * @returns {string} Encoded key
 */
function encodeQualifierKey(key) {
	return percentEncode(key.toLowerCase(), ENCODE_SEGMENT);
}

/**
 * Encode a qualifier value.
 * @param {string} value - Value to encode
 * @returns {string} Encoded value
 */
function encodeQualifierValue(value) {
	return percentEncode(value, ENCODE_COMPONENT);
}

/**
 * Encode a subpath segment.
 * @param {string} segment - Segment to encode
 * @returns {string} Encoded segment
 */
function encodeSubpathSegment(segment) {
	return percentEncode(segment, ENCODE_SEGMENT);
}

/**
 * PURL class representing a Package URL per ECMA-427.
 */
export default class PURL {
	/** @type {string} */
	#type;

	/** @type {string | null} */
	#namespace;

	/** @type {string} */
	#name;

	/** @type {string | null} */
	#version;

	/** @type {Record<string, string> | null} */
	#qualifiers;

	/** @type {string | null} */
	#subpath;

	/**
	 * Create a PURL instance.
	 * @param {string | PURLComponents | PURL} input - PURL string, components object, or another PURL instance
	 */
	constructor(input) {
		if (input instanceof PURL) {
			this.#type = input.type;
			this.#namespace = input.namespace;
			this.#name = input.name;
			this.#version = input.version;
			this.#qualifiers = input.qualifiers;
			this.#subpath = input.subpath;
		} else if (typeof input === 'string') {
			const parsed = PURL.parse(input);
			if (!parsed) {
				throw new TypeError(`Invalid PURL: ${input}`);
			}
			this.#type = parsed.type;
			this.#namespace = parsed.namespace;
			this.#name = parsed.name;
			this.#version = parsed.version;
			this.#qualifiers = parsed.qualifiers;
			this.#subpath = parsed.subpath;
		} else {
			if (!input || typeof input !== 'object') {
				throw new TypeError('PURL input must be a string or object');
			}
			const normalizedType = typeof input.type === 'string' ? input.type.toLowerCase() : input.type;
			if (typeof normalizedType !== 'string' || !TYPE_REGEX.test(normalizedType)) {
				throw new TypeError(`Invalid PURL type: ${input.type}`);
			}
			if (typeof input.name !== 'string' || input.name.length === 0) {
				throw new TypeError('PURL name is required and must be a non-empty string');
			}

			this.#type = normalizedType;
			this.#namespace = input.namespace ?? null;
			this.#name = input.name;
			this.#version = input.version ?? null;
			this.#qualifiers = input.qualifiers ?? null;
			this.#subpath = input.subpath ?? null;
		}
	}

	/** @returns {string} Package type */
	get type() {
		return this.#type;
	}

	/** @returns {string | null} Package namespace */
	get namespace() {
		return this.#namespace;
	}

	/** @returns {string} Package name */
	get name() {
		return this.#name;
	}

	/** @returns {string | null} Package version */
	get version() {
		return this.#version;
	}

	/** @returns {Record<string, string> | null} Qualifiers */
	get qualifiers() {
		return this.#qualifiers ? { ...this.#qualifiers } : null;
	}

	/** @returns {string | null} Subpath */
	get subpath() {
		return this.#subpath;
	}

	/**
	 * Convert to canonical PURL string.
	 * @returns {string} Canonical PURL string
	 */
	toString() {
		let result = `${SCHEME}:${this.#type}/`;

		if (this.#namespace) {
			const segments = this.#namespace.split('/');
			result += segments.map(encodeNsSeg).join('/');
			result += '/';
		}

		result += encodeName(this.#name);

		if (this.#version) {
			result += `@${encodeVersion(this.#version)}`;
		}

		const quals = this.#qualifiers;
		if (quals && Object.keys(quals).length > 0) {
			const sortedKeys = Object.keys(quals).sort();
			const pairs = sortedKeys.map((key) => `${encodeQualifierKey(key)}=${encodeQualifierValue(quals[key])}`);
			result += `?${pairs.join('&')}`;
		}

		if (this.#subpath) {
			const segments = this.#subpath.split('/').filter((s) => s !== '' && s !== '.' && s !== '..');
			result += `#${segments.map(encodeSubpathSegment).join('/')}`;
		}

		return result;
	}

	/**
	 * Parse a PURL string into components.
	 * @param {string} purl - PURL string to parse
	 * @returns {ParsedPURLComponents | null} Parsed components or null if invalid
	 */
	static parse(purl) {
		if (typeof purl !== 'string' || !purl.startsWith(`${SCHEME}:`)) {
			return null;
		}

		const { subpath, remainder: r1 } = extractSubpath(purl.slice(4));
		const qualResult = extractQualifiers(r1);
		if (!qualResult) {
			return null;
		}
		const { qualifiers, remainder: r2 } = qualResult;
		const { version, remainder: r3 } = extractVersion(r2);

		const typeEndIndex = r3.indexOf('/');
		if (typeEndIndex === -1) {
			return null;
		}

		const type = r3.slice(0, typeEndIndex).toLowerCase();
		if (!TYPE_REGEX.test(type)) {
			return null;
		}

		const segments = r3.slice(typeEndIndex + 1).split('/').map(percentDecode);
		if (segments.length === 0 || segments[segments.length - 1] === '') {
			return null;
		}

		// After line 340 check, segments is guaranteed to be non-empty with a non-empty last element
		// eslint-disable-next-line no-extra-parens -- JSDoc type cast
		const name = /** @type {string} */ (segments.pop());

		const namespace = segments.length > 0 ? segments.join('/') : null;

		return {
			name,
			namespace,
			qualifiers,
			subpath,
			type,
			version,
		};
	}

	/**
	 * Check if two PURLs are equal.
	 * @param {PURL | string} other - Other PURL to compare
	 * @returns {boolean} True if equal
	 */
	equals(other) {
		return eq(this, other);
	}

	/**
	 * Compare two PURLs for sorting.
	 * @param {PURL | string} other - Other PURL to compare
	 * @returns {number} negative, zero, or positive
	 */
	compare(other) {
		return compare(this, other);
	}
}
