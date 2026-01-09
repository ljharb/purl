import PURL from './purl.mjs';

/**
 * Get npm package webpage URL.
 * @param {PURL} purl - The PURL
 * @returns {string} The package URL
 */
function getNPMURL(purl) {
	const {
		name,
		namespace,
		version,
	} = purl;
	const pkgPath = namespace ? `${namespace}/${name}` : name;
	const base = `https://www.npmjs.com/package/${pkgPath}`;
	return version ? `${base}/v/${version}` : base;
}

/**
 * Get PyPI package webpage URL.
 * @param {PURL} purl - The PURL
 * @returns {string} The package URL
 */
function getPyPIURL(purl) {
	const { name, version } = purl;
	const base = `https://pypi.org/project/${name}`;
	return version ? `${base}/${version}/` : `${base}/`;
}

/**
 * Get RubyGems package webpage URL.
 * @param {PURL} purl - The PURL
 * @returns {string} The package URL
 */
function getGemURL(purl) {
	const { name, version } = purl;
	return `https://rubygems.org/gems/${name}${version ? `/versions/${version}` : ''}`;
}

/**
 * Get crates.io package webpage URL.
 * @param {PURL} purl - The PURL
 * @returns {string} The package URL
 */
function getCargoURL(purl) {
	const { name, version } = purl;
	return `https://crates.io/crates/${name}${version ? `/${version}` : ''}`;
}

/**
 * Get NuGet package webpage URL.
 * @param {PURL} purl - The PURL
 * @returns {string} The package URL
 */
function getNuGetURL(purl) {
	const { name, version } = purl;
	return `https://www.nuget.org/packages/${name}${version ? `/${version}` : ''}`;
}

/**
 * Get Hex.pm package webpage URL.
 * @param {PURL} purl - The PURL
 * @returns {string} The package URL
 */
function getHexURL(purl) {
	const { name, version } = purl;
	return `https://hex.pm/packages/${name}${version ? `/${version}` : ''}`;
}

/**
 * Get pkg.go.dev package webpage URL.
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
 * Get Maven package webpage URL.
 * @param {PURL} purl - The PURL
 * @returns {string} The package URL
 */
function getMavenURL(purl) {
	const {
		name: artifactID,
		namespace,
		qualifiers,
		version,
	} = purl;
	const groupID = namespace || '';
	const ext = qualifiers?.type || 'jar';
	return `https://search.maven.org/artifact/${groupID}/${artifactID}${version ? `/${version}/${ext}` : ''}`;
}

/**
 * Get Packagist package webpage URL.
 * @param {PURL} purl - The PURL
 * @returns {string} The package URL
 */
function getComposerURL(purl) {
	const {
		name,
		namespace: vendor,
	} = purl;
	return `https://packagist.org/packages/${vendor || ''}/${name}`;
}

/**
 * Get CocoaPods package webpage URL.
 * @param {PURL} purl - The PURL
 * @returns {string} The package URL
 */
function getCocoapodsURL(purl) {
	return `https://cocoapods.org/pods/${purl.name}`;
}

/**
 * Get pub.dev package webpage URL.
 * @param {PURL} purl - The PURL
 * @returns {string} The package URL
 */
function getPubURL(purl) {
	const { name, version } = purl;
	return `https://pub.dev/packages/${name}${version ? `/versions/${version}` : ''}`;
}

/**
 * Get Hackage package webpage URL.
 * @param {PURL} purl - The PURL
 * @returns {string} The package URL
 */
function getHackageURL(purl) {
	const { name, version } = purl;
	return `https://hackage.haskell.org/package/${name}${version ? `-${version}` : ''}`;
}

/**
 * Get Swift package webpage URL.
 * @param {PURL} purl - The PURL
 * @returns {string | null} The package URL or null if not available
 */
function getSwiftURL(purl) {
	const {
		name,
		namespace,
	} = purl;
	// Swift packages are typically GitHub repos
	return namespace ? `https://github.com/${namespace}/${name}` : null;
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
	return `https://github.com/${namespace || ''}/${name}${version ? `/tree/${version}` : ''}`;
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
	return `https://bitbucket.org/${namespace || ''}/${name}${version ? `/src/${version}` : ''}`;
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
	if (namespace === 'library' || !namespace) {
		return `https://hub.docker.com/_/${name}${version ? `?tab=tags&name=${version}` : ''}`;
	}
	return `https://hub.docker.com/r/${namespace}/${name}${version ? `?tab=tags&name=${version}` : ''}`;
}

/** @type {Record<string, (purl: PURL) => string | null>} */
const urlGenerators = {
	__proto__: null,
	bitbucket: getBitbucketURL,
	cargo: getCargoURL,
	cocoapods: getCocoapodsURL,
	composer: getComposerURL,
	docker: getDockerURL,
	gem: getGemURL,
	github: getGitHubURL,
	golang: getGolangURL,
	hackage: getHackageURL,
	hex: getHexURL,
	maven: getMavenURL,
	npm: getNPMURL,
	nuget: getNuGetURL,
	pub: getPubURL,
	pypi: getPyPIURL,
	swift: getSwiftURL,
};

/**
 * Get the package webpage URL for a PURL.
 * @param {PURL | string} input - The PURL to get URL for
 * @returns {string | null} The package URL, or null if not available
 */
export default function url(input) {
	const purl = new PURL(input);
	const generator = urlGenerators[purl.type];
	return generator ? generator(purl) : null;
}
