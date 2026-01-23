import test from 'tape';

import {
	specVersion,
	specSource,
	specLastUpdated,
	knownTypes,
	isKnownType,
	getTypeInfo,
	getTypeDescription,
	getDefaultRegistry,
	getNsRequirement,
	requiresNamespace,
	prohibitsNamespace,
	getExamples,
	getRegistryConfig,
	regConfigTypes,
	nsRequiredTypes,
	nsProhibitedTypes,
	defRegistryTypes,
	getAllTypeInfo,
	checkNamespace,
} from '../types.mjs';

test('types module - spec metadata', (t) => {
	t.test('specVersion', (st) => {
		st.equal(typeof specVersion, 'string', 'specVersion is a string');
		st.ok(specVersion.length > 0, 'specVersion is not empty');
		st.ok((/^\d+\.\d+\.\d+$/).test(specVersion), 'specVersion matches semver pattern');
		st.end();
	});

	t.test('specSource', (st) => {
		st.equal(typeof specSource, 'string', 'specSource is a string');
		st.ok(specSource.startsWith('https://'), 'specSource is a URL');
		st.end();
	});

	t.test('specLastUpdated', (st) => {
		st.equal(typeof specLastUpdated, 'string', 'specLastUpdated is a string');
		st.ok((/^\d{4}-\d{2}-\d{2}$/).test(specLastUpdated), 'specLastUpdated is ISO date format');
		st.end();
	});

	t.end();
});

test('types module - knownTypes', (t) => {
	t.ok(Array.isArray(knownTypes), 'knownTypes is an array');
	t.ok(knownTypes.length > 0, 'knownTypes has entries');
	t.ok(knownTypes.includes('npm'), 'knownTypes includes npm');
	t.ok(knownTypes.includes('pypi'), 'knownTypes includes pypi');
	t.ok(knownTypes.includes('maven'), 'knownTypes includes maven');
	t.ok(knownTypes.includes('cargo'), 'knownTypes includes cargo');
	t.ok(knownTypes.includes('gem'), 'knownTypes includes gem');

	// Verify sorted
	const sorted = [...knownTypes].sort();
	t.deepEqual(knownTypes, sorted, 'knownTypes is sorted alphabetically');

	t.end();
});

test('types module - isKnownType', (t) => {
	t.test('returns true for known types', (st) => {
		st.ok(isKnownType('npm'), 'npm is known');
		st.ok(isKnownType('pypi'), 'pypi is known');
		st.ok(isKnownType('maven'), 'maven is known');
		st.ok(isKnownType('cargo'), 'cargo is known');
		st.ok(isKnownType('gem'), 'gem is known');
		st.ok(isKnownType('nuget'), 'nuget is known');
		st.ok(isKnownType('golang'), 'golang is known');
		st.ok(isKnownType('docker'), 'docker is known');
		st.end();
	});

	t.test('returns false for unknown types', (st) => {
		st.notOk(isKnownType('notatype'), 'notatype is not known');
		st.notOk(isKnownType('foo'), 'foo is not known');
		st.notOk(isKnownType(''), 'empty string is not known');
		st.end();
	});

	t.test('handles non-string input', (st) => {
		// @ts-expect-error - testing invalid input
		st.notOk(isKnownType(null), 'null returns false');
		// @ts-expect-error - testing invalid input
		st.notOk(isKnownType(undefined), 'undefined returns false');
		// @ts-expect-error - testing invalid input
		st.notOk(isKnownType(123), 'number returns false');
		// @ts-expect-error - testing invalid input
		st.notOk(isKnownType({}), 'object returns false');
		st.end();
	});

	t.end();
});

test('types module - getTypeInfo', (t) => {
	t.test('returns info for npm', (st) => {
		const info = getTypeInfo('npm');
		st.ok(info, 'info is not null');
		st.equal(typeof info?.description, 'string', 'has description');
		st.ok((info?.description?.length ?? 0) > 0, 'description is not empty');
		st.equal(info?.default_registry, 'https://registry.npmjs.org', 'npm has correct default registry');
		st.equal(info?.namespace_requirement, 'optional', 'npm namespace is optional');
		st.ok(Array.isArray(info?.examples), 'has examples array');
		st.ok((info?.examples?.length ?? 0) > 0, 'examples has entries');
		st.ok(info?.registry_config, 'npm has registry_config');
		st.end();
	});

	t.test('returns info for maven (namespace required)', (st) => {
		const info = getTypeInfo('maven');
		st.ok(info, 'info is not null');
		st.equal(info?.namespace_requirement, 'required', 'maven namespace is required');
		st.end();
	});

	t.test('returns info for gem (namespace prohibited)', (st) => {
		const info = getTypeInfo('gem');
		st.ok(info, 'info is not null');
		st.equal(info?.namespace_requirement, 'prohibited', 'gem namespace is prohibited');
		st.end();
	});

	t.test('returns info for types without registry_config', (st) => {
		const info = getTypeInfo('docker');
		st.ok(info, 'info is not null');
		st.equal(info?.registry_config, null, 'docker has no registry_config');
		st.end();
	});

	t.test('returns null for unknown type', (st) => {
		st.equal(getTypeInfo('notatype'), null, 'returns null for unknown');
		st.equal(getTypeInfo(''), null, 'returns null for empty string');
		st.end();
	});

	t.end();
});

test('types module - getTypeDescription', (t) => {
	t.equal(typeof getTypeDescription('npm'), 'string', 'returns string for npm');
	t.ok((getTypeDescription('npm')?.length ?? 0) > 0, 'npm description is not empty');
	t.equal(getTypeDescription('notatype'), null, 'returns null for unknown type');
	t.equal(getTypeDescription(''), null, 'returns null for empty string');
	t.end();
});

test('types module - getDefaultRegistry', (t) => {
	t.equal(getDefaultRegistry('npm'), 'https://registry.npmjs.org', 'npm has correct registry');
	t.equal(getDefaultRegistry('pypi'), 'https://pypi.org', 'pypi has correct registry');
	t.equal(getDefaultRegistry('cargo'), 'https://crates.io', 'cargo has correct registry');
	t.equal(getDefaultRegistry('gem'), 'https://rubygems.org', 'gem has correct registry');

	// Types without default registry
	t.equal(getDefaultRegistry('deb'), null, 'deb has no default registry');
	t.equal(getDefaultRegistry('rpm'), null, 'rpm has no default registry');

	// Unknown type
	t.equal(getDefaultRegistry('notatype'), null, 'unknown type returns null');
	t.end();
});

test('types module - getNsRequirement', (t) => {
	t.equal(getNsRequirement('maven'), 'required', 'maven requires namespace');
	t.equal(getNsRequirement('composer'), 'required', 'composer requires namespace');
	t.equal(getNsRequirement('swift'), 'required', 'swift requires namespace');

	t.equal(getNsRequirement('npm'), 'optional', 'npm has optional namespace');

	t.equal(getNsRequirement('gem'), 'prohibited', 'gem prohibits namespace');
	t.equal(getNsRequirement('cran'), 'prohibited', 'cran prohibits namespace');

	// Types without explicit requirement
	t.equal(getNsRequirement('cargo'), null, 'cargo has no explicit requirement');

	// Unknown type
	t.equal(getNsRequirement('notatype'), null, 'unknown type returns null');
	t.end();
});

test('types module - requiresNamespace', (t) => {
	t.ok(requiresNamespace('maven'), 'maven requires namespace');
	t.ok(requiresNamespace('composer'), 'composer requires namespace');
	t.ok(requiresNamespace('swift'), 'swift requires namespace');

	t.notOk(requiresNamespace('npm'), 'npm does not require namespace');
	t.notOk(requiresNamespace('gem'), 'gem does not require namespace');
	t.notOk(requiresNamespace('cargo'), 'cargo does not require namespace');
	t.notOk(requiresNamespace('notatype'), 'unknown type returns false');
	t.end();
});

test('types module - prohibitsNamespace', (t) => {
	t.ok(prohibitsNamespace('gem'), 'gem prohibits namespace');
	t.ok(prohibitsNamespace('cran'), 'cran prohibits namespace');
	t.ok(prohibitsNamespace('chrome'), 'chrome prohibits namespace');

	t.notOk(prohibitsNamespace('npm'), 'npm does not prohibit namespace');
	t.notOk(prohibitsNamespace('maven'), 'maven does not prohibit namespace');
	t.notOk(prohibitsNamespace('cargo'), 'cargo does not prohibit namespace');
	t.notOk(prohibitsNamespace('notatype'), 'unknown type returns false');
	t.end();
});

test('types module - getExamples', (t) => {
	t.test('returns examples for npm', (st) => {
		const examples = getExamples('npm');
		st.ok(Array.isArray(examples), 'returns an array');
		st.ok((examples?.length ?? 0) > 0, 'has examples');
		st.ok(examples?.every((ex) => ex.startsWith('pkg:npm/')), 'all examples are npm PURLs');
		st.end();
	});

	t.test('returns examples for maven', (st) => {
		const examples = getExamples('maven');
		st.ok(Array.isArray(examples), 'returns an array');
		st.ok(examples?.every((ex) => ex.startsWith('pkg:maven/')), 'all examples are maven PURLs');
		st.end();
	});

	t.test('returns null for unknown type', (st) => {
		st.equal(getExamples('notatype'), null, 'returns null for unknown');
		st.end();
	});

	t.end();
});

test('types module - getRegistryConfig', (t) => {
	t.test('returns config for npm', (st) => {
		const config = getRegistryConfig('npm');
		st.ok(config, 'config is not null');
		st.equal(typeof config?.base_url, 'string', 'has base_url');
		st.equal(typeof config?.reverse_regex, 'string', 'has reverse_regex');
		st.equal(typeof config?.uri_template, 'string', 'has uri_template');
		st.ok(config?.components, 'has components');
		st.equal(config?.components.namespace, true, 'npm supports namespace');
		st.equal(config?.components.namespace_required, false, 'npm namespace not required');
		st.end();
	});

	t.test('returns config for maven', (st) => {
		const config = getRegistryConfig('maven');
		st.ok(config, 'config is not null');
		st.equal(config?.components.namespace, true, 'maven supports namespace');
		st.equal(config?.components.namespace_required, true, 'maven namespace is required');
		st.equal(config?.components.version_in_url, true, 'maven version in url');
		st.end();
	});

	t.test('returns config for cargo (no namespace)', (st) => {
		const config = getRegistryConfig('cargo');
		st.ok(config, 'config is not null');
		st.equal(config?.components.namespace, false, 'cargo has no namespace');
		st.end();
	});

	t.test('returns null for types without registry_config', (st) => {
		st.equal(getRegistryConfig('docker'), null, 'docker has no registry_config');
		st.equal(getRegistryConfig('deb'), null, 'deb has no registry_config');
		st.end();
	});

	t.test('returns null for unknown type', (st) => {
		st.equal(getRegistryConfig('notatype'), null, 'returns null for unknown');
		st.end();
	});

	t.end();
});

test('types module - regConfigTypes', (t) => {
	const types = regConfigTypes();
	t.ok(Array.isArray(types), 'returns an array');
	t.ok(types.length > 0, 'has entries');
	t.ok(types.includes('npm'), 'includes npm');
	t.ok(types.includes('pypi'), 'includes pypi');
	t.ok(types.includes('cargo'), 'includes cargo');
	t.notOk(types.includes('docker'), 'does not include docker');
	t.notOk(types.includes('deb'), 'does not include deb');

	// All types in list should have registry_config
	for (const type of types) {
		t.ok(getRegistryConfig(type), `${type} has registry_config`);
	}

	t.end();
});

test('types module - nsRequiredTypes', (t) => {
	const types = nsRequiredTypes();
	t.ok(Array.isArray(types), 'returns an array');
	t.ok(types.includes('maven'), 'includes maven');
	t.ok(types.includes('composer'), 'includes composer');
	t.ok(types.includes('swift'), 'includes swift');
	t.notOk(types.includes('npm'), 'does not include npm');
	t.notOk(types.includes('cargo'), 'does not include cargo');

	// All types in list should require namespace
	for (const type of types) {
		t.ok(requiresNamespace(type), `${type} requires namespace`);
	}

	t.end();
});

test('types module - nsProhibitedTypes', (t) => {
	const types = nsProhibitedTypes();
	t.ok(Array.isArray(types), 'returns an array');
	t.ok(types.includes('gem'), 'includes gem');
	t.ok(types.includes('cran'), 'includes cran');
	t.notOk(types.includes('npm'), 'does not include npm');
	t.notOk(types.includes('maven'), 'does not include maven');

	// All types in list should prohibit namespace
	for (const type of types) {
		t.ok(prohibitsNamespace(type), `${type} prohibits namespace`);
	}

	t.end();
});

test('types module - defRegistryTypes', (t) => {
	const types = defRegistryTypes();
	t.ok(Array.isArray(types), 'returns an array');
	t.ok(types.length > 0, 'has entries');
	t.ok(types.includes('npm'), 'includes npm');
	t.ok(types.includes('pypi'), 'includes pypi');
	t.ok(types.includes('cargo'), 'includes cargo');
	t.notOk(types.includes('deb'), 'does not include deb (no default registry)');
	t.notOk(types.includes('rpm'), 'does not include rpm (no default registry)');

	// All types in list should have a default registry
	for (const type of types) {
		t.ok(getDefaultRegistry(type), `${type} has default registry`);
	}

	t.end();
});

test('types module - getAllTypeInfo', (t) => {
	const allInfo = getAllTypeInfo();
	t.equal(typeof allInfo, 'object', 'returns an object');
	t.ok(Object.keys(allInfo).length > 0, 'has entries');

	// Check that it has the same types as knownTypes
	const allKeys = Object.keys(allInfo).sort();
	t.deepEqual(allKeys, [...knownTypes].sort(), 'contains all known types');

	// Check structure of a few entries
	t.ok(allInfo.npm, 'has npm');
	t.equal(typeof allInfo.npm.description, 'string', 'npm has description');
	t.ok(Array.isArray(allInfo.npm.examples), 'npm has examples array');

	t.ok(allInfo.maven, 'has maven');
	t.equal(allInfo.maven.namespace_requirement, 'required', 'maven namespace_requirement preserved');

	t.ok(allInfo.gem, 'has gem');
	t.equal(allInfo.gem.namespace_requirement, 'prohibited', 'gem namespace_requirement preserved');

	t.end();
});

test('types module - examples are valid PURLs', (t) => {
	// Verify that examples from a few types are parseable PURL strings
	const typesToCheck = ['npm', 'maven', 'cargo', 'pypi', 'gem'];

	for (const type of typesToCheck) {
		const examples = getExamples(type);
		t.ok(examples, `${type} has examples`);
		for (const example of examples || []) {
			t.ok(example.startsWith('pkg:'), `${type} example starts with pkg:`);
			t.ok(example.includes(`pkg:${type}/`), `${type} example includes pkg:${type}/`);
		}
	}

	t.end();
});

test('types module - registry_config URI templates', (t) => {
	// Check that URI templates contain expected placeholders
	const npmConfig = getRegistryConfig('npm');
	t.ok(npmConfig?.uri_template.includes('{name}'), 'npm uri_template has {name}');
	t.ok(npmConfig?.uri_template_no_namespace?.includes('{name}'), 'npm uri_template_no_namespace has {name}');
	t.ok(npmConfig?.uri_template_with_version?.includes('{version}'), 'npm uri_template_with_version has {version}');

	const mavenConfig = getRegistryConfig('maven');
	t.ok(mavenConfig?.uri_template.includes('{namespace}'), 'maven uri_template has {namespace}');
	t.ok(mavenConfig?.uri_template.includes('{name}'), 'maven uri_template has {name}');
	t.ok(mavenConfig?.uri_template_with_version?.includes('{version}'), 'maven uri_template_with_version has {version}');

	t.end();
});

test('types module - checkNamespace', (t) => {
	t.test('types that require namespace', (st) => {
		// maven requires namespace
		st.equal(checkNamespace('maven', 'org.example'), null, 'maven with namespace is valid');
		st.ok(checkNamespace('maven', null)?.includes('requires'), 'maven without namespace returns error');
		st.ok(checkNamespace('maven', '')?.includes('requires'), 'maven with empty namespace returns error');

		// composer requires namespace
		st.equal(checkNamespace('composer', 'vendor'), null, 'composer with namespace is valid');
		st.ok(checkNamespace('composer', null)?.includes('requires'), 'composer without namespace returns error');

		// swift requires namespace
		st.equal(checkNamespace('swift', 'github.com/apple'), null, 'swift with namespace is valid');
		st.ok(checkNamespace('swift', null)?.includes('requires'), 'swift without namespace returns error');

		st.end();
	});

	t.test('types that prohibit namespace', (st) => {
		// gem prohibits namespace
		st.equal(checkNamespace('gem', null), null, 'gem without namespace is valid');
		st.ok(checkNamespace('gem', 'somenamespace')?.includes('prohibits'), 'gem with namespace returns error');

		// cran prohibits namespace
		st.equal(checkNamespace('cran', null), null, 'cran without namespace is valid');
		st.ok(checkNamespace('cran', 'ns')?.includes('prohibits'), 'cran with namespace returns error');

		st.end();
	});

	t.test('types with optional namespace', (st) => {
		// npm has optional namespace
		st.equal(checkNamespace('npm', null), null, 'npm without namespace is valid');
		st.equal(checkNamespace('npm', '@babel'), null, 'npm with namespace is valid');

		// cargo has no explicit requirement (null), so both should be valid
		st.equal(checkNamespace('cargo', null), null, 'cargo without namespace is valid');
		st.equal(checkNamespace('cargo', 'some/ns'), null, 'cargo with namespace is valid');

		st.end();
	});

	t.test('unknown types', (st) => {
		// unknown types return null (no validation error)
		st.equal(checkNamespace('unknown', null), null, 'unknown type without namespace is valid');
		st.equal(checkNamespace('unknown', 'ns'), null, 'unknown type with namespace is valid');

		st.end();
	});

	t.end();
});

test('types module - comprehensive type coverage', (t) => {
	// Verify all 38 known types are properly configured
	t.equal(knownTypes.length, 38, 'exactly 38 known types');

	const expectedTypes = [
		'alpm',
		'apk',
		'bioconductor',
		'bitbucket',
		'bitnami',
		'cargo',
		'chrome',
		'clojars',
		'cocoapods',
		'composer',
		'conan',
		'conda',
		'cpan',
		'cran',
		'deb',
		'deno',
		'docker',
		'elm',
		'gem',
		'generic',
		'github',
		'golang',
		'hackage',
		'hex',
		'homebrew',
		'huggingface',
		'luarocks',
		'maven',
		'mlflow',
		'npm',
		'nuget',
		'oci',
		'pub',
		'pypi',
		'qpkg',
		'rpm',
		'swid',
		'swift',
	];

	t.deepEqual(knownTypes, expectedTypes, 'all expected types present and sorted');

	t.end();
});

test('types module - all types have required metadata', (t) => {
	for (const type of knownTypes) {
		const info = getTypeInfo(type);
		t.ok(info, `${type} has info`);
		t.equal(typeof info?.description, 'string', `${type} has description`);
		t.ok((info?.description?.length ?? 0) > 0, `${type} description is not empty`);
		t.ok(Array.isArray(info?.examples), `${type} has examples array`);
		t.ok((info?.examples?.length ?? 0) > 0, `${type} has at least one example`);
	}
	t.end();
});

test('types module - all examples are valid PURL strings', (t) => {
	for (const type of knownTypes) {
		const examples = getExamples(type) || [];
		for (const example of examples) {
			t.ok(example.startsWith('pkg:'), `${type} example "${example}" starts with pkg:`);
			t.ok(example.startsWith(`pkg:${type}/`), `${type} example "${example}" has correct type`);
		}
	}
	t.end();
});

test('types module - namespace requirements are consistent', (t) => {
	const required = nsRequiredTypes();
	const prohibited = nsProhibitedTypes();

	// No type should be in both lists
	for (const type of required) {
		t.notOk(prohibited.includes(type), `${type} is not in both required and prohibited`);
	}

	// All required types should pass requiresNamespace check
	for (const type of required) {
		t.ok(requiresNamespace(type), `${type} passes requiresNamespace check`);
		t.notOk(prohibitsNamespace(type), `${type} does not prohibit namespace`);
	}

	// All prohibited types should pass prohibitsNamespace check
	for (const type of prohibited) {
		t.ok(prohibitsNamespace(type), `${type} passes prohibitsNamespace check`);
		t.notOk(requiresNamespace(type), `${type} does not require namespace`);
	}

	t.end();
});

test('types module - registry config consistency', (t) => {
	const withConfig = regConfigTypes();

	for (const type of withConfig) {
		const config = getRegistryConfig(type);
		t.ok(config, `${type} has registry_config`);
		t.equal(typeof config?.uri_template, 'string', `${type} has uri_template`);
		t.equal(typeof config?.base_url, 'string', `${type} has base_url`);
		t.ok(config?.components, `${type} has components`);
	}

	// Types with registry_config should be a subset of all known types
	for (const type of withConfig) {
		t.ok(knownTypes.includes(type), `${type} with registry_config is in knownTypes`);
	}

	t.end();
});

test('types module - default registry types', (t) => {
	const withRegistry = defRegistryTypes();

	for (const type of withRegistry) {
		const registry = getDefaultRegistry(type);
		t.ok(registry, `${type} has default_registry`);
		t.ok(registry?.startsWith('https://'), `${type} default_registry is HTTPS URL`);
	}

	// Common types should have default registries
	const commonTypes = ['npm', 'pypi', 'cargo', 'gem', 'nuget', 'maven'];
	for (const type of commonTypes) {
		t.ok(withRegistry.includes(type), `${type} has default registry`);
	}

	t.end();
});
