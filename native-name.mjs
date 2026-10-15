import validateNPMName from 'validate-npm-package-name';

import PURL from './purl.mjs';

/** @typedef {(type: string, namespace: string | null, name: string) => string | null} NativeNamer */

/**
 * @param {string} type - The PURL type
 * @param {string} reason - Why the PURL is invalid for its type
 * @returns {TypeError}
 */
function invalid(type, reason) {
	return new TypeError(`Invalid \`${type}\` PURL: ${reason}`);
}

/**
 * Namespace requirements are from the purl-spec type definitions.
 * @type {NativeNamer}
 */
function nameOnly(type, namespace, name) {
	if (namespace !== null) {
		throw invalid(type, 'a namespace is not allowed');
	}
	return name;
}

/**
 * The namespace is the distro or vendor, which is required but not part of the package name.
 * @type {NativeNamer}
 */
function vendorAndName(type, namespace, name) {
	if (namespace === null) {
		throw invalid(type, 'a namespace (the vendor) is required');
	}
	return name;
}

/** @type {NativeNamer} */
function ignoreNamespace(_type, _namespace, name) {
	return name;
}

/** @type {NativeNamer} */
function never() {
	return null;
}

/**
 * Join a namespace and name that must each be exactly one path segment.
 * @param {string} separator - The separator the ecosystem uses
 * @returns {NativeNamer}
 */
function ownerAndName(separator) {
	return function joinOwnerAndName(type, namespace, name) {
		if (namespace === null) {
			throw invalid(type, 'a namespace is required');
		}
		if (namespace.includes('/')) {
			throw invalid(type, 'the namespace must be a single segment');
		}
		if (name.includes('/')) {
			throw invalid(type, 'the name must not contain `/`');
		}
		return `${namespace}${separator}${name}`;
	};
}

const ownerSlashName = ownerAndName('/');

/** @type {NativeNamer} */
function requiredPath(type, namespace, name) {
	if (namespace === null) {
		throw invalid(type, 'a namespace is required');
	}
	return `${namespace}/${name}`;
}

/** @type {NativeNamer} */
function optionalPath(_type, namespace, name) {
	return namespace === null ? name : `${namespace}/${name}`;
}

/**
 * These types have no purl-spec definition, so a namespace has no defined meaning, and thus no native name.
 * @type {NativeNamer}
 */
function undefinedNamespace(_type, namespace, name) {
	return namespace === null ? name : null;
}

/**
 * Leiningen/deps.edn lib symbols: `group/artifact`, or a bare `artifact` when the group is the same.
 * @type {NativeNamer}
 */
function clojars(type, namespace, name) {
	return namespace === null ? name : ownerSlashName(type, namespace, name);
}

/**
 * The name is the distribution name, and the namespace is the uploader's PAUSE id.
 * @type {NativeNamer}
 */
function cpan(type, namespace, name) {
	if (namespace === null) {
		throw invalid(type, 'a namespace (the author) is required');
	}
	if (name.includes('::')) {
		throw invalid(type, 'the name must be a distribution name, not a `::` module name');
	}
	return name;
}

/** @type {NativeNamer} */
function npm(type, namespace, name) {
	if (namespace !== null && (!namespace.startsWith('@') || namespace.includes('/'))) {
		throw invalid(type, 'the namespace must be an `@scope`');
	}
	const fullName = namespace === null ? name : `${namespace}/${name}`;
	// allows legacy names like `JSONStream`
	if (!validateNPMName(fullName).validForOldPackages) {
		throw invalid(type, `\`${fullName}\` is not a valid npm package name`);
	}
	return fullName;
}

/** @type {NativeNamer} */
function oci(type, namespace) {
	if (namespace !== null) {
		throw invalid(type, 'a namespace is not allowed');
	}
	// identified by digest and `repository_url`, not by a name
	return null;
}

/** @type {NativeNamer} */
function git(type, namespace) {
	if (namespace === null) {
		throw invalid(type, 'a namespace is required');
	}
	// identified by its repository URL
	return null;
}

/** @type {Record<string, NativeNamer | null>} */
const namers = {
	__proto__: null,
	// Arch Linux `pacman -S <name>`
	alpm: vendorAndName,
	// Alpine `apk add <name>`
	apk: vendorAndName,
	bioconductor: undefinedNamespace,
	bitbucket: ownerSlashName,
	bitnami: nameOnly,
	cargo: nameOnly,
	'chrome-extension': nameOnly,
	clojars,
	cocoapods: nameOnly,
	composer: ownerSlashName,
	// a conan reference is `name/version@user/channel`; the PURL namespace is the vendor, not part of it
	conan: ignoreNamespace,
	conda: nameOnly,
	cpan,
	cran: nameOnly,
	// Debian `apt install <name>`
	deb: vendorAndName,
	deno: undefinedNamespace,
	// `docker pull [registry/][namespace/]name`; a `repository_url` qualifier is ignored like all qualifiers
	docker: optionalPath,
	// elm.json `author/project`
	elm: ownerSlashName,
	gem: nameOnly,
	// identified by `download_url`/`vcs_url` qualifiers, not by a name
	generic: never,
	git,
	github: ownerSlashName,
	golang: requiredPath,
	hackage: nameOnly,
	// mix: `{:name, organization: "namespace"}`; a private organization is not part of the package name
	hex: ignoreNamespace,
	homebrew: undefinedNamespace,
	huggingface: ownerSlashName,
	// LuaRocks 3 namespaced rocks: `luarocks install user/name`
	luarocks: optionalPath,
	maven: ownerAndName(':'),
	// `models:/<name>/<version>`
	mlflow: nameOnly,
	npm,
	nuget: nameOnly,
	oci,
	pub: nameOnly,
	pypi: nameOnly,
	// the name is already the full dotted package id
	qpkg: vendorAndName,
	// `dnf install <name>`
	rpm: vendorAndName,
	// identified by `tag_id`; the name is a non-unique display name
	swid: never,
	// the full repository location, eg `github.com/apple/swift-nio`
	swift: requiredPath,
	// `publisher.name`, as in `code --install-extension ms-python.python`
	'vscode-extension': ownerAndName('.'),
};

/**
 * Get a PURL's package name as its own ecosystem writes it.
 * @param {string | PURL} purl - PURL string or instance
 * @returns {string | null} Native package name, or null if the type has no well-defined native name
 * @throws {TypeError} If the PURL is invalid, including for its type
 */
export default function nativeName(purl) {
	const {
		type,
		name,
		namespace,
	} = new PURL(purl);
	const namer = namers[type];
	return namer ? namer(type, namespace || null, name) : null;
}
