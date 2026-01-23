/** @import { PURLRegistryConfig } from './types.mjs' */

import PURL from './purl.mjs';
import { getRegistryConfig } from './types.mjs';

/**
 * Generate URL from registry config uri_template.
 * @param {PURLRegistryConfig} config - Registry configuration
 * @param {PURL} purl - The PURL
 * @returns {string} Generated URL
 */
function generateFromTemplate(config, purl) {
	const {
		name,
		namespace,
		version,
	} = purl;
	const { components } = config;
	const hasNamespace = namespace !== null;
	const hasVersion = version !== null;
	const supportsNamespace = components.namespace !== false;

	let template;

	if (hasVersion && config.uri_template_with_version) {
		// Use version template if PURL has namespace, OR if type doesn't support namespace
		if (hasNamespace || !supportsNamespace) {
			template = config.uri_template_with_version;
		} else if (config.uri_template_with_version_no_namespace) {
			// Type supports namespace but PURL doesn't have one
			template = config.uri_template_with_version_no_namespace;
		}
	}

	if (!template) {
		if (!hasNamespace && config.uri_template_no_namespace) {
			template = config.uri_template_no_namespace;
		} else {
			template = config.uri_template;
		}
	}

	let result = template
		.replace(/\{name\}/g, name)
		.replace(/\{namespace\}/g, namespace || '');

	if (hasVersion) {
		result = result.replace(/\{version\}/g, version);
	} else if (components.default_version) {
		result = result.replace(/\{version\}/g, components.default_version);
	}

	return result;
}

/**
 * Get golang package webpage URL (special handling for import paths).
 * @param {PURL} purl - The PURL
 * @returns {string} The package URL
 */
function getGolangURL(purl) {
	const {
		name,
		namespace,
		version,
	} = purl;
	const mod = namespace ? `${namespace}/${name}` : name;
	return `https://pkg.go.dev/${mod}${version ? `@${version}` : ''}`;
}

/**
 * Get Maven package webpage URL (special handling for artifact type).
 * @param {PURL} purl - The PURL
 * @returns {string} The package URL
 */
function getMavenURL(purl) {
	const {
		name,
		namespace,
		qualifiers,
		version,
	} = purl;
	const groupID = namespace || '';
	const ext = qualifiers?.type || 'jar';
	const base = `https://search.maven.org/artifact/${groupID}/${name}`;
	return version ? `${base}/${version}/${ext}` : base;
}

/**
 * Get GitHub package webpage URL.
 * @param {PURL} purl - The PURL
 * @returns {string} The package URL
 */
function getGitHubURL(purl) {
	const {
		name,
		namespace,
		version,
	} = purl;
	const base = `https://github.com/${namespace || ''}/${name}`;
	return version ? `${base}/tree/${version}` : base;
}

/**
 * Get Bitbucket package webpage URL.
 * @param {PURL} purl - The PURL
 * @returns {string} The package URL
 */
function getBitbucketURL(purl) {
	const {
		name,
		namespace,
		version,
	} = purl;
	const base = `https://bitbucket.org/${namespace || ''}/${name}`;
	return version ? `${base}/src/${version}` : base;
}

/**
 * Get Docker Hub package webpage URL.
 * @param {PURL} purl - The PURL
 * @returns {string} The package URL
 */
function getDockerURL(purl) {
	const {
		name,
		namespace,
		version,
	} = purl;
	const versionSuffix = version ? `?tab=tags&name=${version}` : '';
	if (namespace === 'library' || !namespace) {
		return `https://hub.docker.com/_/${name}${versionSuffix}`;
	}
	return `https://hub.docker.com/r/${namespace}/${name}${versionSuffix}`;
}

/**
 * Get Swift package webpage URL (GitHub-based).
 * @param {PURL} purl - The PURL
 * @returns {string | null} The package URL or null if no namespace
 */
function getSwiftURL(purl) {
	const { name, namespace } = purl;
	return namespace ? `https://github.com/${namespace}/${name}` : null;
}

/** @type {Record<string, (purl: PURL) => string | null>} */
const specialHandlers = {
	__proto__: null,
	bitbucket: getBitbucketURL,
	docker: getDockerURL,
	github: getGitHubURL,
	golang: getGolangURL,
	maven: getMavenURL,
	swift: getSwiftURL,
};

/**
 * Get the package webpage URL for a PURL.
 * @param {PURL | string} input - The PURL to get URL for
 * @returns {string | null} The package URL, or null if not available
 */
export default function url(input) {
	const purl = new PURL(input);
	const { type } = purl;

	// Check for special handlers first
	const specialHandler = specialHandlers[type];
	if (specialHandler) {
		return specialHandler(purl);
	}

	// Use registry_config from purl-types.json
	const config = getRegistryConfig(type);
	if (config) {
		return generateFromTemplate(config, purl);
	}

	return null;
}

/**
 * List of PURL types that support URL generation.
 * @type {string[]}
 */
export const supportedUrlTypes = [
	'bioconductor',
	'bitbucket',
	'cargo',
	'chrome',
	'clojars',
	'cocoapods',
	'composer',
	'conan',
	'conda',
	'cpan',
	'deno',
	'docker',
	'elm',
	'gem',
	'github',
	'golang',
	'hackage',
	'hex',
	'homebrew',
	'huggingface',
	'luarocks',
	'maven',
	'npm',
	'nuget',
	'pub',
	'pypi',
	'swift',
	'vscode',
];
