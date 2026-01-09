import npa from 'npm-package-arg';

import PURL from './purl.mjs';

/**
 * Convert an npm package specifier to a PURL.
 * @param {string} spec - npm package specifier (e.g., "lodash@4.17.21", "@babel/core@7.0.0")
 * @returns {PURL} PURL object
 * @throws {TypeError} If the specifier is invalid or cannot be converted to a PURL
 */
export default function fromNPM(spec) {
	/** @type {import('npm-package-arg').Result} */
	let parsed;
	try {
		parsed = npa(spec);
	} catch (e) {
		throw new TypeError(`Invalid npm package specifier: ${spec}`, { cause: e });
	}

	// Only registry types can be converted to PURLs
	if (parsed.type !== 'version' && parsed.type !== 'tag' && parsed.type !== 'range') {
		throw new TypeError(`Cannot convert npm specifier type \`${parsed.type}\` to PURL: ${spec}`);
	}

	const {
		name,
		scope,
		rawSpec,
	} = parsed;

	if (!name) {
		throw new TypeError(`Invalid npm package specifier (no name): ${spec}`);
	}

	// For scoped packages, scope includes the @ (e.g., "@babel")
	// The @ will be percent-encoded when serializing the PURL
	const namespace = scope || null;

	// The name in npa is the full name including scope, we need just the package name
	// For @babel/core, name is "@babel/core", we want just "core"
	const packageName = scope ? name.slice(scope.length + 1) : name;

	// Only include version if it's an explicit version (not a range or tag)
	// For "latest" tag or ranges, we don't include version in PURL
	let version = null;
	if (parsed.type === 'version' && rawSpec) {
		version = rawSpec;
	}

	return new PURL({
		name: packageName,
		namespace,
		type: 'npm',
		version,
	});
}
