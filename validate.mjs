/* eslint max-lines: ["warn", 600] -- registry validators require substantial code */
/** @import { ValidationResult, ValidationSuccess, ValidationError } from './validate.mjs' */

import PURL from './purl.mjs';

const HTTP_NOT_FOUND = 404;
const RECENT_COUNT = 5;

/**
 * Create an error result.
 * @param {string} error - Error message
 * @param {string | null} [latestVersion] - Latest version if known
 * @returns {ValidationError}
 */
function errorResult(error, latestVersion = null) {
	return {
		error,
		latestVersion,
		valid: false,
	};
}

/**
 * Create a success result.
 * @param {string | null} latestVersion - Latest version
 * @returns {ValidationSuccess}
 */
function successResult(latestVersion) {
	return {
		latestVersion,
		valid: true,
	};
}

/**
 * Validate that an npm package (and optionally version) exists on the registry.
 * @param {string} packageName - Full package name (including scope if any)
 * @param {string | null} version - Specific version to check
 * @returns {Promise<ValidationResult>}
 */
async function validateNPM(packageName, version) {
	const encodedName = packageName.replace('/', '%2F');
	const apiURL = `https://registry.npmjs.org/${encodedName}`;

	const response = await fetch(apiURL);

	if (response.status === HTTP_NOT_FOUND) {
		return errorResult(`npm package "${packageName}" not found`);
	}
	if (!response.ok) {
		return errorResult(`npm registry error: HTTP ${response.status}`);
	}

	const packument = await response.json();
	const latestVersion = packument['dist-tags']?.latest || null;

	if (version && packument.versions && !packument.versions[version]) {
		const recent = Object.keys(packument.versions)
			.slice(-RECENT_COUNT)
			.toReversed()
			.join(', ');
		return errorResult(
			`npm version "${version}" not found for "${packageName}". Recent: ${recent}`,
			latestVersion,
		);
	}

	return successResult(latestVersion);
}

/**
 * Validate that a PyPI package (and optionally version) exists.
 * @param {string} packageName - Package name
 * @param {string | null} version - Specific version to check
 * @returns {Promise<ValidationResult>}
 */
async function validatePyPI(packageName, version) {
	const baseURL = `https://pypi.org/pypi/${packageName}/json`;
	const baseResponse = await fetch(baseURL);

	if (baseResponse.status === HTTP_NOT_FOUND) {
		return errorResult(`PyPI package "${packageName}" not found`);
	}
	if (!baseResponse.ok) {
		return errorResult(`PyPI registry error: HTTP ${baseResponse.status}`);
	}

	const baseData = await baseResponse.json();
	const latestVersion = baseData.info?.version || null;

	if (version) {
		const versionURL = `https://pypi.org/pypi/${packageName}/${version}/json`;
		const versionResponse = await fetch(versionURL);
		if (versionResponse.status === HTTP_NOT_FOUND) {
			return errorResult(
				`PyPI version "${version}" not found for "${packageName}"`,
				latestVersion,
			);
		}
		if (!versionResponse.ok) {
			return errorResult(`PyPI registry error: HTTP ${versionResponse.status}`, latestVersion);
		}
	}

	return successResult(latestVersion);
}

/**
 * Validate that a RubyGems package (and optionally version) exists.
 * @param {string} packageName - Gem name
 * @param {string | null} version - Specific version to check
 * @returns {Promise<ValidationResult>}
 */
async function validateGem(packageName, version) {
	const apiURL = `https://rubygems.org/api/v1/versions/${packageName}.json`;
	const response = await fetch(apiURL);

	if (response.status === HTTP_NOT_FOUND) {
		return errorResult(`RubyGems package "${packageName}" not found`);
	}
	if (!response.ok) {
		return errorResult(`RubyGems registry error: HTTP ${response.status}`);
	}

	/** @typedef {{ number: string }} GemVersion */
	// eslint-disable-next-line no-extra-parens -- JSDoc type cast
	const versions = /** @type {GemVersion[]} */ (await response.json());
	const latestVersion = versions[0]?.number || null;

	if (version) {
		const found = versions.some((v) => v.number === version);
		if (!found) {
			const recent = versions.slice(0, RECENT_COUNT).map((v) => v.number).join(', ');
			return errorResult(
				`RubyGems version "${version}" not found for "${packageName}". Recent: ${recent}`,
				latestVersion,
			);
		}
	}

	return successResult(latestVersion);
}

/**
 * Validate that a crates.io package (and optionally version) exists.
 * @param {string} packageName - Crate name
 * @param {string | null} version - Specific version to check
 * @returns {Promise<ValidationResult>}
 */
async function validateCargo(packageName, version) {
	const apiURL = `https://crates.io/api/v1/crates/${packageName}`;
	const response = await fetch(apiURL, { headers: { 'User-Agent': 'purl-cli' } });

	if (response.status === HTTP_NOT_FOUND) {
		return errorResult(`Cargo crate "${packageName}" not found`);
	}
	if (!response.ok) {
		return errorResult(`crates.io registry error: HTTP ${response.status}`);
	}

	/** @typedef {{ num: string }} CrateVersion */
	/** @typedef {{ crate?: { max_version?: string }, versions?: CrateVersion[] }} CrateData */
	// eslint-disable-next-line no-extra-parens -- JSDoc type cast
	const data = /** @type {CrateData} */ (await response.json());
	const latestVersion = data.crate?.max_version || data.versions?.[0]?.num || null;

	if (version) {
		const found = data.versions?.some((v) => v.num === version);
		if (!found) {
			const recent = data.versions?.slice(0, RECENT_COUNT).map((v) => v.num).join(', ') || 'none';
			return errorResult(
				`Cargo version "${version}" not found for "${packageName}". Recent: ${recent}`,
				latestVersion,
			);
		}
	}

	return successResult(latestVersion);
}

/**
 * Validate that a NuGet package (and optionally version) exists.
 * @param {string} packageName - Package name
 * @param {string | null} version - Specific version to check
 * @returns {Promise<ValidationResult>}
 */
async function validateNuGet(packageName, version) {
	const lowerName = packageName.toLowerCase();
	const apiURL = `https://api.nuget.org/v3/registration5-gz-semver2/${lowerName}/index.json`;
	const response = await fetch(apiURL);

	if (response.status === HTTP_NOT_FOUND) {
		return errorResult(`NuGet package "${packageName}" not found`);
	}
	if (!response.ok) {
		return errorResult(`NuGet registry error: HTTP ${response.status}`);
	}

	/** @typedef {{ catalogEntry?: { version: string } }} NuGetItem */
	/** @typedef {{ items?: NuGetItem[] }} NuGetPage */
	/** @typedef {{ items?: NuGetPage[] }} NuGetIndex */
	// eslint-disable-next-line no-extra-parens -- JSDoc type cast
	const data = /** @type {NuGetIndex} */ (await response.json());

	/** @type {string[]} */
	const allVersions = [];
	for (const page of data.items || []) {
		for (const item of page.items || []) {
			if (item.catalogEntry?.version) {
				allVersions.push(item.catalogEntry.version);
			}
		}
	}

	const lastIndex = allVersions.length - 1;
	const latestVersion = lastIndex >= 0 ? allVersions[lastIndex] : null;

	if (version) {
		if (!allVersions.includes(version)) {
			const recent = allVersions.slice(-RECENT_COUNT).reverse().join(', ') || 'none';
			return errorResult(
				`NuGet version "${version}" not found for "${packageName}". Recent: ${recent}`,
				latestVersion,
			);
		}
	}

	return successResult(latestVersion);
}

/**
 * Validate that a Hex.pm package (and optionally version) exists.
 * @param {string} packageName - Package name
 * @param {string | null} version - Specific version to check
 * @returns {Promise<ValidationResult>}
 */
async function validateHex(packageName, version) {
	const apiURL = `https://hex.pm/api/packages/${packageName}`;
	const response = await fetch(apiURL);

	if (response.status === HTTP_NOT_FOUND) {
		return errorResult(`Hex package "${packageName}" not found`);
	}
	if (!response.ok) {
		return errorResult(`Hex registry error: HTTP ${response.status}`);
	}

	/** @typedef {{ version: string }} HexRelease */
	/** @typedef {{ releases?: HexRelease[] }} HexData */
	// eslint-disable-next-line no-extra-parens -- JSDoc type cast
	const data = /** @type {HexData} */ (await response.json());
	const latestVersion = data.releases?.[0]?.version || null;

	if (version) {
		const found = data.releases?.some((r) => r.version === version);
		if (!found) {
			const recent = data.releases?.slice(0, RECENT_COUNT).map((r) => r.version).join(', ') || 'none';
			return errorResult(
				`Hex version "${version}" not found for "${packageName}". Recent: ${recent}`,
				latestVersion,
			);
		}
	}

	return successResult(latestVersion);
}

/**
 * Validate that a Maven package (and optionally version) exists.
 * @param {string} groupID - Group ID
 * @param {string} artifactID - Artifact ID
 * @param {string | null} version - Specific version to check
 * @returns {Promise<ValidationResult>}
 */
async function validateMaven(groupID, artifactID, version) {
	const searchURL = `https://search.maven.org/solrsearch/select?q=g:"${groupID}"+AND+a:"${artifactID}"&rows=1&wt=json`;
	const response = await fetch(searchURL);

	if (!response.ok) {
		return errorResult(`Maven registry error: HTTP ${response.status}`);
	}

	/** @typedef {{ latestVersion?: string }} MavenDoc */
	/** @typedef {{ response: { numFound: number, docs: MavenDoc[] } }} MavenSearch */
	// eslint-disable-next-line no-extra-parens -- JSDoc type cast
	const data = /** @type {MavenSearch} */ (await response.json());

	if (data.response.numFound === 0) {
		return errorResult(`Maven artifact "${groupID}:${artifactID}" not found`);
	}

	const latestVersion = data.response.docs[0]?.latestVersion || null;

	if (version) {
		const versionURL = `https://search.maven.org/solrsearch/select?q=g:"${groupID}"+AND+a:"${artifactID}"+AND+v:"${version}"&rows=1&wt=json`;
		const versionResponse = await fetch(versionURL);
		if (!versionResponse.ok) {
			return errorResult(`Maven registry error: HTTP ${versionResponse.status}`, latestVersion);
		}
		// eslint-disable-next-line no-extra-parens -- JSDoc type cast
		const versionData = /** @type {MavenSearch} */ (await versionResponse.json());
		if (versionData.response.numFound === 0) {
			return errorResult(
				`Maven version "${version}" not found for "${groupID}:${artifactID}"`,
				latestVersion,
			);
		}
	}

	return successResult(latestVersion);
}

/**
 * Validate that a Packagist (Composer) package exists.
 * @param {string} vendor - Vendor name
 * @param {string} packageName - Package name
 * @param {string | null} version - Specific version to check
 * @returns {Promise<ValidationResult>}
 */
async function validateComposer(vendor, packageName, version) {
	const apiURL = `https://repo.packagist.org/p2/${vendor}/${packageName}.json`;
	const response = await fetch(apiURL);

	if (response.status === HTTP_NOT_FOUND) {
		return errorResult(`Composer package "${vendor}/${packageName}" not found`);
	}
	if (!response.ok) {
		return errorResult(`Packagist registry error: HTTP ${response.status}`);
	}

	/** @typedef {{ version: string }} ComposerVersion */
	/** @typedef {{ packages: Record<string, ComposerVersion[]> }} ComposerData */
	// eslint-disable-next-line no-extra-parens -- JSDoc type cast
	const data = /** @type {ComposerData} */ (await response.json());
	const pkgKey = `${vendor}/${packageName}`;
	const versions = data.packages?.[pkgKey] || [];
	const latestVersion = versions[0]?.version || null;

	if (version) {
		const found = versions.some((v) => v.version === version);
		if (!found) {
			const recent = versions.slice(0, RECENT_COUNT).map((v) => v.version).join(', ') || 'none';
			return errorResult(
				`Composer version "${version}" not found for "${pkgKey}". Recent: ${recent}`,
				latestVersion,
			);
		}
	}

	return successResult(latestVersion);
}

/**
 * Validate that a pub.dev package exists.
 * @param {string} packageName - Package name
 * @param {string | null} version - Specific version to check
 * @returns {Promise<ValidationResult>}
 */
async function validatePub(packageName, version) {
	const apiURL = `https://pub.dev/api/packages/${packageName}`;
	const response = await fetch(apiURL);

	if (response.status === HTTP_NOT_FOUND) {
		return errorResult(`pub.dev package "${packageName}" not found`);
	}
	if (!response.ok) {
		return errorResult(`pub.dev registry error: HTTP ${response.status}`);
	}

	/** @typedef {{ version: string }} PubVersion */
	/** @typedef {{ latest?: PubVersion, versions?: PubVersion[] }} PubData */
	// eslint-disable-next-line no-extra-parens -- JSDoc type cast
	const data = /** @type {PubData} */ (await response.json());
	const latestVersion = data.latest?.version || null;

	if (version) {
		const found = data.versions?.some((v) => v.version === version);
		if (!found) {
			const recent = data.versions?.slice(0, RECENT_COUNT).map((v) => v.version).join(', ') || 'none';
			return errorResult(
				`pub.dev version "${version}" not found for "${packageName}". Recent: ${recent}`,
				latestVersion,
			);
		}
	}

	return successResult(latestVersion);
}

/**
 * Validate that a Hackage package exists.
 * @param {string} packageName - Package name
 * @param {string | null} version - Specific version to check
 * @returns {Promise<ValidationResult>}
 */
async function validateHackage(packageName, version) {
	const apiURL = `https://hackage.haskell.org/package/${packageName}/preferred`;
	const response = await fetch(apiURL, { headers: { Accept: 'application/json' } });

	if (response.status === HTTP_NOT_FOUND) {
		return errorResult(`Hackage package "${packageName}" not found`);
	}
	if (!response.ok) {
		return errorResult(`Hackage registry error: HTTP ${response.status}`);
	}

	/** @typedef {{ 'normal-version': string[] }} HackageData */
	// eslint-disable-next-line no-extra-parens -- JSDoc type cast
	const data = /** @type {HackageData} */ (await response.json());
	const versions = data['normal-version'] || [];
	const latestVersion = versions[0] || null;

	if (version) {
		if (!versions.includes(version)) {
			const recent = versions.slice(0, RECENT_COUNT).join(', ') || 'none';
			return errorResult(
				`Hackage version "${version}" not found for "${packageName}". Recent: ${recent}`,
				latestVersion,
			);
		}
	}

	return successResult(latestVersion);
}

/**
 * Validate that a CocoaPods pod exists.
 * @param {string} podName - Pod name
 * @param {string | null} version - Specific version to check
 * @returns {Promise<ValidationResult>}
 */
async function validateCocoapods(podName, version) {
	const apiURL = `https://trunk.cocoapods.org/api/v1/pods/${podName}`;
	const response = await fetch(apiURL);

	if (response.status === HTTP_NOT_FOUND) {
		return errorResult(`CocoaPods pod "${podName}" not found`);
	}
	if (!response.ok) {
		return errorResult(`CocoaPods registry error: HTTP ${response.status}`);
	}

	/** @typedef {{ name: string }} CocoapodVersion */
	/** @typedef {{ versions?: CocoapodVersion[] }} CocoapodData */
	// eslint-disable-next-line no-extra-parens -- JSDoc type cast
	const data = /** @type {CocoapodData} */ (await response.json());
	const versions = data.versions || [];
	const latestVersion = versions[0]?.name || null;

	if (version) {
		const found = versions.some((v) => v.name === version);
		if (!found) {
			const recent = versions.slice(0, RECENT_COUNT).map((v) => v.name).join(', ') || 'none';
			return errorResult(
				`CocoaPods version "${version}" not found for "${podName}". Recent: ${recent}`,
				latestVersion,
			);
		}
	}

	return successResult(latestVersion);
}

/**
 * List of PURL types that support registry validation.
 * @type {string[]}
 */
export const supportedTypes = [
	'cargo',
	'cocoapods',
	'composer',
	'gem',
	'hackage',
	'hex',
	'maven',
	'npm',
	'nuget',
	'pub',
	'pypi',
];

/**
 * Validate a PURL against its package registry.
 * @param {PURL | string} input - The PURL to validate
 * @returns {Promise<ValidationResult>}
 */
export default async function validate(input) {
	const {
		name,
		namespace,
		type,
		version,
	} = new PURL(input);

	switch (type) {
		case 'npm': {
			const pkgName = namespace ? `${namespace}/${name}` : name;
			return validateNPM(pkgName, version);
		}
		case 'pypi':
			return validatePyPI(name, version);
		case 'gem':
			return validateGem(name, version);
		case 'cargo':
			return validateCargo(name, version);
		case 'nuget':
			return validateNuGet(name, version);
		case 'hex':
			return validateHex(name, version);
		case 'maven':
			return validateMaven(namespace || '', name, version);
		case 'composer':
			return validateComposer(namespace || '', name, version);
		case 'pub':
			return validatePub(name, version);
		case 'hackage':
			return validateHackage(name, version);
		case 'cocoapods':
			return validateCocoapods(name, version);
		default:
			return errorResult(`Registry validation not supported for type "${type}"`);
	}
}
