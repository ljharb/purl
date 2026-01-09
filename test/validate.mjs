import test from 'tape';

import PURL from '../purl.mjs';
import validate, { supportedTypes } from '../validate.mjs';

// Set PURL_LIVE_TESTS=1 to run tests against real registries
const useLiveTests = process.env.PURL_LIVE_TESTS === '1';

/**
 * Get error from validation result (type narrowing helper).
 * @param {import('../validate.mjs').ValidationResult} result
 * @returns {string}
 */
function getError(result) {
	if (result.valid) {
		throw new Error('Expected invalid result');
	}
	return result.error;
}

/** @typedef {{ ok: boolean, status: number, json?: () => Promise<unknown> }} MockResponse */

/** @type {Record<string, MockResponse>} */
const mockResponses = {
	// npm
	'https://registry.npmjs.org/lodash': {
		ok: true,
		status: 200,
		json: async () => ({
			'dist-tags': { latest: '4.17.21' },
			versions: {
				'4.17.20': {},
				'4.17.21': {},
			},
		}),
	},
	'https://registry.npmjs.org/@babel%2Fcore': {
		ok: true,
		status: 200,
		json: async () => ({
			'dist-tags': { latest: '7.23.0' },
			versions: { '7.0.0': {}, '7.23.0': {} },
		}),
	},
	'https://registry.npmjs.org/this-package-does-not-exist-12345': {
		ok: false,
		status: 404,
	},
	'https://registry.npmjs.org/server-error-pkg': {
		ok: false,
		status: 500,
	},

	// pypi
	'https://pypi.org/pypi/requests/json': {
		ok: true,
		status: 200,
		json: async () => ({ info: { version: '2.31.0' } }),
	},
	'https://pypi.org/pypi/requests/999.999.999/json': {
		ok: false,
		status: 404,
	},
	'https://pypi.org/pypi/this-package-does-not-exist-12345/json': {
		ok: false,
		status: 404,
	},
	'https://pypi.org/pypi/server-error-pkg/json': {
		ok: false,
		status: 500,
	},
	'https://pypi.org/pypi/version-error-pkg/json': {
		ok: true,
		status: 200,
		json: async () => ({ info: { version: '1.0.0' } }),
	},
	'https://pypi.org/pypi/version-error-pkg/1.0.1/json': {
		ok: false,
		status: 500,
	},

	// gem
	'https://rubygems.org/api/v1/versions/rails.json': {
		ok: true,
		status: 200,
		json: async () => [
			{ number: '7.1.0' },
			{ number: '7.0.0' },
		],
	},
	'https://rubygems.org/api/v1/versions/this-gem-does-not-exist-12345.json': {
		ok: false,
		status: 404,
	},
	'https://rubygems.org/api/v1/versions/server-error-gem.json': {
		ok: false,
		status: 500,
	},

	// cargo
	'https://crates.io/api/v1/crates/serde': {
		ok: true,
		status: 200,
		// eslint-disable-next-line camelcase -- crates.io API uses snake_case
		json: async () => ({ crate: { max_version: '1.0.193' }, versions: [{ num: '1.0.193' }, { num: '1.0.192' }] }),
	},
	'https://crates.io/api/v1/crates/this-crate-does-not-exist-12345': {
		ok: false,
		status: 404,
	},
	'https://crates.io/api/v1/crates/server-error-crate': {
		ok: false,
		status: 500,
	},

	// nuget
	'https://api.nuget.org/v3/registration5-gz-semver2/newtonsoft.json/index.json': {
		ok: true,
		status: 200,
		json: async () => ({
			items: [{
				items: [
					{ catalogEntry: { version: '13.0.1' } },
					{ catalogEntry: { version: '13.0.2' } },
					{ catalogEntry: { version: '13.0.3' } },
				],
			}],
		}),
	},
	'https://api.nuget.org/v3/registration5-gz-semver2/this.pkg.does.not.exist.12345/index.json': {
		ok: false,
		status: 404,
	},
	'https://api.nuget.org/v3/registration5-gz-semver2/server-error-pkg/index.json': {
		ok: false,
		status: 500,
	},

	// hex
	'https://hex.pm/api/packages/phoenix': {
		ok: true,
		status: 200,
		json: async () => ({
			releases: [
				{ version: '1.7.10' },
				{ version: '1.7.9' },
			],
		}),
	},
	'https://hex.pm/api/packages/this_pkg_does_not_exist_12345': {
		ok: false,
		status: 404,
	},
	'https://hex.pm/api/packages/server_error_pkg': {
		ok: false,
		status: 500,
	},

	// maven
	'https://search.maven.org/solrsearch/select?q=g:"org.apache.commons"+AND+a:"commons-lang3"&rows=1&wt=json': {
		ok: true,
		status: 200,
		json: async () => ({
			response: {
				numFound: 1,
				docs: [{ latestVersion: '3.14.0' }],
			},
		}),
	},
	'https://search.maven.org/solrsearch/select?q=g:"org.apache.commons"+AND+a:"commons-lang3"+AND+v:"999.999.999"&rows=1&wt=json': {
		ok: true,
		status: 200,
		json: async () => ({
			response: { numFound: 0, docs: [] },
		}),
	},
	'https://search.maven.org/solrsearch/select?q=g:"fake.group"+AND+a:"fake-artifact"&rows=1&wt=json': {
		ok: true,
		status: 200,
		json: async () => ({
			response: { numFound: 0, docs: [] },
		}),
	},
	'https://search.maven.org/solrsearch/select?q=g:"server.error"+AND+a:"pkg"&rows=1&wt=json': {
		ok: false,
		status: 500,
	},
	'https://search.maven.org/solrsearch/select?q=g:"version.error"+AND+a:"pkg"&rows=1&wt=json': {
		ok: true,
		status: 200,
		json: async () => ({
			response: {
				numFound: 1,
				docs: [{ latestVersion: '1.0.0' }],
			},
		}),
	},
	'https://search.maven.org/solrsearch/select?q=g:"version.error"+AND+a:"pkg"+AND+v:"1.0.1"&rows=1&wt=json': {
		ok: false,
		status: 500,
	},

	// composer
	'https://repo.packagist.org/p2/laravel/framework.json': {
		ok: true,
		status: 200,
		json: async () => ({
			packages: {
				'laravel/framework': [
					{ version: 'v10.0.0' },
					{ version: 'v9.0.0' },
				],
			},
		}),
	},
	'https://repo.packagist.org/p2/fake-vendor/fake-pkg.json': {
		ok: false,
		status: 404,
	},
	'https://repo.packagist.org/p2/server-error/pkg.json': {
		ok: false,
		status: 500,
	},

	// pub
	'https://pub.dev/api/packages/http': {
		ok: true,
		status: 200,
		json: async () => ({
			latest: { version: '1.1.0' },
			versions: [
				{ version: '1.1.0' },
				{ version: '1.0.0' },
				{ version: '0.13.6' },
			],
		}),
	},
	'https://pub.dev/api/packages/this_pkg_does_not_exist_12345': {
		ok: false,
		status: 404,
	},
	'https://pub.dev/api/packages/server_error_pkg': {
		ok: false,
		status: 500,
	},

	// hackage
	'https://hackage.haskell.org/package/aeson/preferred': {
		ok: true,
		status: 200,
		json: async () => ({
			'normal-version': ['2.2.1.0', '2.2.0.0', '2.1.0.0'],
		}),
	},
	'https://hackage.haskell.org/package/this-pkg-does-not-exist-12345/preferred': {
		ok: false,
		status: 404,
	},
	'https://hackage.haskell.org/package/server-error-pkg/preferred': {
		ok: false,
		status: 500,
	},

	// cocoapods
	'https://trunk.cocoapods.org/api/v1/pods/AFNetworking': {
		ok: true,
		status: 200,
		json: async () => ({
			versions: [
				{ name: '4.0.1' },
				{ name: '4.0.0' },
				{ name: '3.2.1' },
			],
		}),
	},
	'https://trunk.cocoapods.org/api/v1/pods/ThisPodDoesNotExist12345': {
		ok: false,
		status: 404,
	},
	'https://trunk.cocoapods.org/api/v1/pods/ServerErrorPod': {
		ok: false,
		status: 500,
	},

	// Edge cases for empty/missing version data - to cover fallback branches
	'https://pub.dev/api/packages/empty-versions-pkg': {
		ok: true,
		status: 200,
		json: async () => ({
			latest: null,
			versions: [],
		}),
	},
	'https://hackage.haskell.org/package/empty-versions-pkg/preferred': {
		ok: true,
		status: 200,
		json: async () => ({
			'normal-version': [],
		}),
	},
	'https://trunk.cocoapods.org/api/v1/pods/EmptyVersionsPod': {
		ok: true,
		status: 200,
		json: async () => ({
			versions: [],
		}),
	},
	'https://search.maven.org/solrsearch/select?q=g:""+AND+a:"artifact-no-ns"&rows=1&wt=json': {
		ok: true,
		status: 200,
		json: async () => ({
			response: {
				numFound: 1,
				docs: [{ latestVersion: '1.0.0' }],
			},
		}),
	},
	'https://repo.packagist.org/p2//pkg-no-ns.json': {
		ok: true,
		status: 200,
		json: async () => ({
			packages: {
				'/pkg-no-ns': [{ version: '1.0.0' }],
			},
		}),
	},

	// NuGet with empty versions
	'https://api.nuget.org/v3/registration5-gz-semver2/empty-versions-pkg/index.json': {
		ok: true,
		status: 200,
		json: async () => ({
			items: [],
		}),
	},

	// Hex with empty releases
	'https://hex.pm/api/packages/empty-releases-pkg': {
		ok: true,
		status: 200,
		json: async () => ({
			releases: [],
		}),
	},

	// Maven with no latestVersion in docs
	'https://search.maven.org/solrsearch/select?q=g:"org.test"+AND+a:"no-latest"&rows=1&wt=json': {
		ok: true,
		status: 200,
		json: async () => ({
			response: {
				numFound: 1,
				docs: [{}],
			},
		}),
	},

	// Composer with empty packages
	'https://repo.packagist.org/p2/empty/pkg.json': {
		ok: true,
		status: 200,
		json: async () => ({
			packages: {},
		}),
	},

	// npm with missing dist-tags
	'https://registry.npmjs.org/no-dist-tags-pkg': {
		ok: true,
		status: 200,
		json: async () => ({
			'dist-tags': {},
			versions: {},
		}),
	},

	// pypi with missing info.version
	'https://pypi.org/pypi/no-version-info/json': {
		ok: true,
		status: 200,
		json: async () => ({
			info: {},
		}),
	},

	// gem with empty array
	'https://rubygems.org/api/v1/versions/empty-versions-gem.json': {
		ok: true,
		status: 200,
		json: async () => [],
	},

	// cargo with missing max_version
	'https://crates.io/api/v1/crates/no-max-version': {
		ok: true,
		status: 200,
		json: async () => ({
			crate: {},
			versions: [],
		}),
	},

	// NuGet empty items in page
	'https://api.nuget.org/v3/registration5-gz-semver2/empty-items-pkg/index.json': {
		ok: true,
		status: 200,
		json: async () => ({
			items: [{ items: [] }],
		}),
	},

	// Hackage with missing normal-version
	'https://hackage.haskell.org/package/missing-versions-pkg/preferred': {
		ok: true,
		status: 200,
		json: async () => ({}),
	},

	// Cocoapods with missing versions
	'https://trunk.cocoapods.org/api/v1/pods/MissingVersionsPod': {
		ok: true,
		status: 200,
		json: async () => ({}),
	},

	// Cargo with versions but no max_version - tests fallback to versions[0].num
	'https://crates.io/api/v1/crates/no-max-but-versions': {
		ok: true,
		status: 200,
		json: async () => ({
			crate: {},
			versions: [{ num: '1.0.0' }],
		}),
	},

	// Cargo - version not found with empty versions
	'https://crates.io/api/v1/crates/empty-versions-crate': {
		ok: true,
		status: 200,
		json: async () => ({
			crate: {},
			versions: [],
		}),
	},

	// NuGet with undefined items in data
	'https://api.nuget.org/v3/registration5-gz-semver2/undefined-items-pkg/index.json': {
		ok: true,
		status: 200,
		json: async () => ({}),
	},

	// NuGet with undefined items in page
	'https://api.nuget.org/v3/registration5-gz-semver2/undefined-page-items-pkg/index.json': {
		ok: true,
		status: 200,
		json: async () => ({
			items: [{}],
		}),
	},
};

/** @type {typeof globalThis.fetch} */
const originalFetch = globalThis.fetch;

/**
 * Mock fetch that returns predefined responses.
 * @param {string | URL | Request} input - The URL to fetch
 * @returns {Promise<Response>}
 */
function mockFetch(input) {
	const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

	const mockResponse = mockResponses[url];
	if (mockResponse) {
		// eslint-disable-next-line no-extra-parens -- JSDoc type cast
		return Promise.resolve(/** @type {Response} */ (mockResponse));
	}

	// For unknown URLs in mock mode, return 404
	// eslint-disable-next-line no-extra-parens -- JSDoc type cast
	return Promise.resolve(/** @type {Response} */ ({
		ok: false,
		status: 404,
		json: async () => ({}),
	}));
}

// Set up mock or real fetch
if (!useLiveTests) {
	// @ts-ignore -- replacing global fetch
	globalThis.fetch = mockFetch;
}

// Helper for mock-only subtests (HTTP errors, edge cases)
const mockOnlyTest = useLiveTests ? test.skip : test;

test('validate function - supportedTypes', (t) => {
	t.ok(Array.isArray(supportedTypes), 'supportedTypes is an array');
	t.ok(supportedTypes.includes('npm'), 'supports npm');
	t.ok(supportedTypes.includes('pypi'), 'supports pypi');
	t.ok(supportedTypes.includes('gem'), 'supports gem');
	t.ok(supportedTypes.includes('cargo'), 'supports cargo');
	t.ok(supportedTypes.includes('nuget'), 'supports nuget');
	t.ok(supportedTypes.includes('hex'), 'supports hex');
	t.ok(supportedTypes.includes('maven'), 'supports maven');
	t.ok(supportedTypes.includes('composer'), 'supports composer');
	t.ok(supportedTypes.includes('pub'), 'supports pub');
	t.ok(supportedTypes.includes('hackage'), 'supports hackage');
	t.ok(supportedTypes.includes('cocoapods'), 'supports cocoapods');
	t.end();
});

test('validate function - unsupported types', async (t) => {
	t.test('golang - unsupported', async (st) => {
		const result = await validate('pkg:golang/example.com/foo');
		st.equal(result.valid, false, 'unsupported type is invalid');
		st.ok(getError(result).includes('not supported'), 'error mentions not supported');
		st.equal(result.latestVersion, null, 'latestVersion is null');
	});

	t.test('accepts PURL instance', async (st) => {
		const purl = new PURL({ name: 'foo', type: 'unknown' });
		const result = await validate(purl);
		st.equal(result.valid, false, 'accepts PURL instance');
		st.ok(getError(result).includes('not supported'), 'error for unknown type');
	});

});

test('validate function - npm', async (t) => {
	t.test('existing package', async (st) => {
		const result = await validate('pkg:npm/lodash');
		st.equal(result.valid, true, 'lodash exists');
		st.ok(result.latestVersion, 'has latestVersion');
	});

	t.test('existing package with version', async (st) => {
		const result = await validate('pkg:npm/lodash@4.17.21');
		st.equal(result.valid, true, 'lodash@4.17.21 exists');
		st.ok(result.latestVersion, 'has latestVersion');
	});

	t.test('non-existent package', async (st) => {
		const result = await validate('pkg:npm/this-package-does-not-exist-12345');
		st.equal(result.valid, false, 'non-existent package is invalid');
		st.ok(getError(result).includes('not found'), 'error mentions not found');
	});

	t.test('scoped package', async (st) => {
		const result = await validate('pkg:npm/%40babel/core');
		st.equal(result.valid, true, '@babel/core exists');
		st.ok(result.latestVersion, 'has latestVersion');
	});

	t.test('non-existent version', async (st) => {
		const result = await validate('pkg:npm/lodash@999.999.999');
		st.equal(result.valid, false, 'non-existent version is invalid');
		st.ok(getError(result).includes('version'), 'error mentions version');
		st.ok(getError(result).includes('Recent'), 'error shows recent versions');
		st.ok(result.latestVersion, 'still has latestVersion');
	});

	// Mock-only test - skip when using live tests
	if (!useLiveTests) {
		t.test('HTTP error response', async (st) => {
			const result = await validate('pkg:npm/server-error-pkg');
			st.equal(result.valid, false, 'HTTP error is invalid');
			st.ok(getError(result).includes('500'), 'error mentions HTTP status');
		});
	}

});

test('validate function - pypi', async (t) => {
	t.test('existing package', async (st) => {
		const result = await validate('pkg:pypi/requests');
		st.equal(result.valid, true, 'requests exists');
		st.ok(result.latestVersion, 'has latestVersion');
	});

	t.test('non-existent package', async (st) => {
		const result = await validate('pkg:pypi/this-package-does-not-exist-12345');
		st.equal(result.valid, false, 'non-existent package is invalid');
		st.ok(getError(result).includes('not found'), 'error mentions not found');
	});

	t.test('non-existent version', async (st) => {
		const result = await validate('pkg:pypi/requests@999.999.999');
		st.equal(result.valid, false, 'non-existent version is invalid');
		st.ok(getError(result).includes('version'), 'error mentions version');
		st.ok(result.latestVersion, 'still has latestVersion');
	});

	// Mock-only tests - skip when using live tests
	if (!useLiveTests) {
		t.test('HTTP error response', async (st) => {
			const result = await validate('pkg:pypi/server-error-pkg');
			st.equal(result.valid, false, 'HTTP error is invalid');
			st.ok(getError(result).includes('500'), 'error mentions HTTP status');
		});

		t.test('version check HTTP error response', async (st) => {
			const result = await validate('pkg:pypi/version-error-pkg@1.0.1');
			st.equal(result.valid, false, 'version HTTP error is invalid');
			st.ok(getError(result).includes('500'), 'error mentions HTTP status');
			st.ok(result.latestVersion, 'still has latestVersion');
		});
	}

});

test('validate function - gem', async (t) => {
	t.test('existing package', async (st) => {
		const result = await validate('pkg:gem/rails');
		st.equal(result.valid, true, 'rails gem exists');
		st.ok(result.latestVersion, 'has latestVersion');
	});

	t.test('non-existent package', async (st) => {
		const result = await validate('pkg:gem/this-gem-does-not-exist-12345');
		st.equal(result.valid, false, 'non-existent gem is invalid');
		st.ok(getError(result).includes('not found'), 'error mentions not found');
	});

	t.test('non-existent version', async (st) => {
		const result = await validate('pkg:gem/rails@999.999.999');
		st.equal(result.valid, false, 'non-existent version is invalid');
		st.ok(getError(result).includes('version'), 'error mentions version');
		st.ok(result.latestVersion, 'still has latestVersion');
	});

	// Mock-only test - skip when using live tests
	if (!useLiveTests) {
		t.test('HTTP error response', async (st) => {
			const result = await validate('pkg:gem/server-error-gem');
			st.equal(result.valid, false, 'HTTP error is invalid');
			st.ok(getError(result).includes('500'), 'error mentions HTTP status');
		});
	}

});

test('validate function - cargo', async (t) => {
	t.test('existing package', async (st) => {
		const result = await validate('pkg:cargo/serde');
		st.equal(result.valid, true, 'serde exists');
		st.ok(result.latestVersion, 'has latestVersion');
	});

	t.test('non-existent package', async (st) => {
		const result = await validate('pkg:cargo/this-crate-does-not-exist-12345');
		st.equal(result.valid, false, 'non-existent crate is invalid');
		st.ok(getError(result).includes('not found'), 'error mentions not found');
	});

	t.test('non-existent version', async (st) => {
		const result = await validate('pkg:cargo/serde@999.999.999');
		st.equal(result.valid, false, 'non-existent version is invalid');
		st.ok(getError(result).includes('version'), 'error mentions version');
		st.ok(result.latestVersion, 'still has latestVersion');
	});

	// Mock-only test - skip when using live tests
	if (!useLiveTests) {
		t.test('HTTP error response', async (st) => {
			const result = await validate('pkg:cargo/server-error-crate');
			st.equal(result.valid, false, 'HTTP error is invalid');
			st.ok(getError(result).includes('500'), 'error mentions HTTP status');
		});
	}

});

test('validate function - nuget', async (t) => {
	t.test('existing package', async (st) => {
		const result = await validate('pkg:nuget/Newtonsoft.Json');
		st.equal(result.valid, true, 'Newtonsoft.Json exists');
		st.ok(result.latestVersion, 'has latestVersion');
	});

	t.test('non-existent package', async (st) => {
		const result = await validate('pkg:nuget/This.Pkg.Does.Not.Exist.12345');
		st.equal(result.valid, false, 'non-existent nuget package is invalid');
		st.ok(getError(result).includes('not found'), 'error mentions not found');
	});

	t.test('non-existent version', async (st) => {
		const result = await validate('pkg:nuget/Newtonsoft.Json@999.999.999');
		st.equal(result.valid, false, 'non-existent version is invalid');
		st.ok(getError(result).includes('version'), 'error mentions version');
		st.ok(result.latestVersion, 'still has latestVersion');
	});

	// Mock-only test - skip when using live tests
	if (!useLiveTests) {
		t.test('HTTP error response', async (st) => {
			const result = await validate('pkg:nuget/server-error-pkg');
			st.equal(result.valid, false, 'HTTP error is invalid');
			st.ok(getError(result).includes('500'), 'error mentions HTTP status');
		});
	}

});

test('validate function - hex', async (t) => {
	t.test('existing package', async (st) => {
		const result = await validate('pkg:hex/phoenix');
		st.equal(result.valid, true, 'phoenix exists');
		st.ok(result.latestVersion, 'has latestVersion');
	});

	t.test('non-existent package', async (st) => {
		const result = await validate('pkg:hex/this_pkg_does_not_exist_12345');
		st.equal(result.valid, false, 'non-existent hex package is invalid');
		st.ok(getError(result).includes('not found'), 'error mentions not found');
	});

	t.test('non-existent version', async (st) => {
		const result = await validate('pkg:hex/phoenix@999.999.999');
		st.equal(result.valid, false, 'non-existent version is invalid');
		st.ok(getError(result).includes('version'), 'error mentions version');
		st.ok(result.latestVersion, 'still has latestVersion');
	});

	// Mock-only test - skip when using live tests
	if (!useLiveTests) {
		t.test('HTTP error response', async (st) => {
			const result = await validate('pkg:hex/server_error_pkg');
			st.equal(result.valid, false, 'HTTP error is invalid');
			st.ok(getError(result).includes('500'), 'error mentions HTTP status');
		});
	}

});

test('validate function - maven', async (t) => {
	t.test('existing package', async (st) => {
		const result = await validate('pkg:maven/org.apache.commons/commons-lang3');
		st.equal(result.valid, true, 'commons-lang3 exists');
		st.ok(result.latestVersion, 'has latestVersion');
	});

	t.test('non-existent package', async (st) => {
		const result = await validate('pkg:maven/fake.group/fake-artifact');
		st.equal(result.valid, false, 'non-existent maven artifact is invalid');
		st.ok(getError(result).includes('not found'), 'error mentions not found');
	});

	t.test('non-existent version', async (st) => {
		const result = await validate('pkg:maven/org.apache.commons/commons-lang3@999.999.999');
		st.equal(result.valid, false, 'non-existent version is invalid');
		st.ok(getError(result).includes('version'), 'error mentions version');
		st.ok(result.latestVersion, 'still has latestVersion');
	});

	// Mock-only tests - skip when using live tests
	if (!useLiveTests) {
		t.test('HTTP error response', async (st) => {
			const result = await validate('pkg:maven/server.error/pkg');
			st.equal(result.valid, false, 'HTTP error is invalid');
			st.ok(getError(result).includes('500'), 'error mentions HTTP status');
		});

		t.test('version check HTTP error response', async (st) => {
			const result = await validate('pkg:maven/version.error/pkg@1.0.1');
			st.equal(result.valid, false, 'version HTTP error is invalid');
			st.ok(getError(result).includes('500'), 'error mentions HTTP status');
			st.ok(result.latestVersion, 'still has latestVersion');
		});
	}

});

test('validate function - composer', async (t) => {
	t.test('existing package', async (st) => {
		const result = await validate('pkg:composer/laravel/framework');
		st.equal(result.valid, true, 'laravel/framework exists');
		st.ok(result.latestVersion, 'has latestVersion');
	});

	t.test('non-existent package', async (st) => {
		const result = await validate('pkg:composer/fake-vendor/fake-pkg');
		st.equal(result.valid, false, 'non-existent composer package is invalid');
		st.ok(getError(result).includes('not found'), 'error mentions not found');
	});

	t.test('non-existent version', async (st) => {
		const result = await validate('pkg:composer/laravel/framework@999.999.999');
		st.equal(result.valid, false, 'non-existent version is invalid');
		st.ok(getError(result).includes('version'), 'error mentions version');
		st.ok(result.latestVersion, 'still has latestVersion');
	});

	// Mock-only test - skip when using live tests
	if (!useLiveTests) {
		t.test('HTTP error response', async (st) => {
			const result = await validate('pkg:composer/server-error/pkg');
			st.equal(result.valid, false, 'HTTP error is invalid');
			st.ok(getError(result).includes('500'), 'error mentions HTTP status');
		});
	}

});

test('validate function - pub', async (t) => {
	t.test('existing package', async (st) => {
		const result = await validate('pkg:pub/http');
		st.equal(result.valid, true, 'http exists');
		st.ok(result.latestVersion, 'has latestVersion');
	});

	t.test('non-existent package', async (st) => {
		const result = await validate('pkg:pub/this_pkg_does_not_exist_12345');
		st.equal(result.valid, false, 'non-existent pub package is invalid');
		st.ok(getError(result).includes('not found'), 'error mentions not found');
	});

	t.test('non-existent version', async (st) => {
		const result = await validate('pkg:pub/http@999.999.999');
		st.equal(result.valid, false, 'non-existent version is invalid');
		st.ok(getError(result).includes('version'), 'error mentions version');
		st.ok(result.latestVersion, 'still has latestVersion');
	});

	// Mock-only test - skip when using live tests
	if (!useLiveTests) {
		t.test('HTTP error response', async (st) => {
			const result = await validate('pkg:pub/server_error_pkg');
			st.equal(result.valid, false, 'HTTP error is invalid');
			st.ok(getError(result).includes('500'), 'error mentions HTTP status');
		});
	}

});

test('validate function - hackage', async (t) => {
	t.test('existing package', async (st) => {
		const result = await validate('pkg:hackage/aeson');
		st.equal(result.valid, true, 'aeson exists');
		st.ok(result.latestVersion, 'has latestVersion');
	});

	t.test('non-existent package', async (st) => {
		const result = await validate('pkg:hackage/this-pkg-does-not-exist-12345');
		st.equal(result.valid, false, 'non-existent hackage package is invalid');
		st.ok(getError(result).includes('not found'), 'error mentions not found');
	});

	t.test('non-existent version', async (st) => {
		const result = await validate('pkg:hackage/aeson@999.999.999');
		st.equal(result.valid, false, 'non-existent version is invalid');
		st.ok(getError(result).includes('version'), 'error mentions version');
		st.ok(result.latestVersion, 'still has latestVersion');
	});

	// Mock-only test - skip when using live tests
	if (!useLiveTests) {
		t.test('HTTP error response', async (st) => {
			const result = await validate('pkg:hackage/server-error-pkg');
			st.equal(result.valid, false, 'HTTP error is invalid');
			st.ok(getError(result).includes('500'), 'error mentions HTTP status');
		});
	}

});

test('validate function - cocoapods', async (t) => {
	t.test('existing package', async (st) => {
		const result = await validate('pkg:cocoapods/AFNetworking');
		st.equal(result.valid, true, 'AFNetworking exists');
		st.ok(result.latestVersion, 'has latestVersion');
	});

	t.test('non-existent package', async (st) => {
		const result = await validate('pkg:cocoapods/ThisPodDoesNotExist12345');
		st.equal(result.valid, false, 'non-existent cocoapod is invalid');
		st.ok(getError(result).includes('not found'), 'error mentions not found');
	});

	t.test('non-existent version', async (st) => {
		const result = await validate('pkg:cocoapods/AFNetworking@999.999.999');
		st.equal(result.valid, false, 'non-existent version is invalid');
		st.ok(getError(result).includes('version'), 'error mentions version');
		st.ok(result.latestVersion, 'still has latestVersion');
	});

	// Mock-only test - skip when using live tests
	if (!useLiveTests) {
		t.test('HTTP error response', async (st) => {
			const result = await validate('pkg:cocoapods/ServerErrorPod');
			st.equal(result.valid, false, 'HTTP error is invalid');
			st.ok(getError(result).includes('500'), 'error mentions HTTP status');
		});
	}

});

// Mock-only tests - edge cases with empty/missing data that can't be replicated with live registries
mockOnlyTest('validate function - edge cases (empty version data)', async (t) => {
	t.test('pub - empty versions array', async (st) => {
		const result = await validate('pkg:pub/empty-versions-pkg');
		st.equal(result.valid, true, 'empty versions still valid');
		st.equal(result.latestVersion, null, 'latestVersion is null');
	});

	t.test('pub - version not found with empty array', async (st) => {
		const result = await validate('pkg:pub/empty-versions-pkg@1.0.0');
		st.equal(result.valid, false, 'version not found');
		st.ok(getError(result).includes('none'), 'error mentions none for recent versions');
	});

	t.test('hackage - empty versions array', async (st) => {
		const result = await validate('pkg:hackage/empty-versions-pkg');
		st.equal(result.valid, true, 'empty versions still valid');
		st.equal(result.latestVersion, null, 'latestVersion is null');
	});

	t.test('hackage - version not found with empty array', async (st) => {
		const result = await validate('pkg:hackage/empty-versions-pkg@1.0.0');
		st.equal(result.valid, false, 'version not found');
		st.ok(getError(result).includes('none'), 'error mentions none for recent versions');
	});

	t.test('cocoapods - empty versions array', async (st) => {
		const result = await validate('pkg:cocoapods/EmptyVersionsPod');
		st.equal(result.valid, true, 'empty versions still valid');
		st.equal(result.latestVersion, null, 'latestVersion is null');
	});

	t.test('cocoapods - version not found with empty array', async (st) => {
		const result = await validate('pkg:cocoapods/EmptyVersionsPod@1.0.0');
		st.equal(result.valid, false, 'version not found');
		st.ok(getError(result).includes('none'), 'error mentions none for recent versions');
	});

	t.test('maven - no namespace', async (st) => {
		const purl = new PURL({ type: 'maven', name: 'artifact-no-ns' });
		const result = await validate(purl);
		st.equal(result.valid, true, 'valid without namespace');
		st.equal(result.latestVersion, '1.0.0', 'has latestVersion');
	});

	t.test('composer - no namespace', async (st) => {
		const purl = new PURL({ type: 'composer', name: 'pkg-no-ns' });
		const result = await validate(purl);
		st.equal(result.valid, true, 'valid without namespace');
		st.equal(result.latestVersion, '1.0.0', 'has latestVersion');
	});

	t.test('nuget - empty versions', async (st) => {
		const result = await validate('pkg:nuget/empty-versions-pkg');
		st.equal(result.valid, true, 'empty versions still valid');
		st.equal(result.latestVersion, null, 'latestVersion is null');
	});

	t.test('nuget - version not found with empty array', async (st) => {
		const result = await validate('pkg:nuget/empty-versions-pkg@1.0.0');
		st.equal(result.valid, false, 'version not found');
		st.ok(getError(result).includes('none'), 'error mentions none for recent versions');
	});

	t.test('hex - empty releases', async (st) => {
		const result = await validate('pkg:hex/empty-releases-pkg');
		st.equal(result.valid, true, 'empty releases still valid');
		st.equal(result.latestVersion, null, 'latestVersion is null');
	});

	t.test('hex - version not found with empty array', async (st) => {
		const result = await validate('pkg:hex/empty-releases-pkg@1.0.0');
		st.equal(result.valid, false, 'version not found');
		st.ok(getError(result).includes('none'), 'error mentions none for recent versions');
	});

	t.test('maven - no latestVersion in docs', async (st) => {
		const purl = new PURL({ type: 'maven', namespace: 'org.test', name: 'no-latest' });
		const result = await validate(purl);
		st.equal(result.valid, true, 'valid without latestVersion');
		st.equal(result.latestVersion, null, 'latestVersion is null');
	});

	t.test('composer - empty packages object', async (st) => {
		const purl = new PURL({ type: 'composer', namespace: 'empty', name: 'pkg' });
		const result = await validate(purl);
		st.equal(result.valid, true, 'valid with empty packages');
		st.equal(result.latestVersion, null, 'latestVersion is null');
	});

	t.test('composer - version not found with empty packages', async (st) => {
		const purl = new PURL({ type: 'composer', namespace: 'empty', name: 'pkg', version: '1.0.0' });
		const result = await validate(purl);
		st.equal(result.valid, false, 'version not found');
		st.ok(getError(result).includes('none'), 'error mentions none for recent versions');
	});

	t.test('npm - missing dist-tags.latest', async (st) => {
		const result = await validate('pkg:npm/no-dist-tags-pkg');
		st.equal(result.valid, true, 'valid without dist-tags');
		st.equal(result.latestVersion, null, 'latestVersion is null');
	});

	t.test('pypi - missing info.version', async (st) => {
		const result = await validate('pkg:pypi/no-version-info');
		st.equal(result.valid, true, 'valid without info.version');
		st.equal(result.latestVersion, null, 'latestVersion is null');
	});

	t.test('gem - empty versions array', async (st) => {
		const result = await validate('pkg:gem/empty-versions-gem');
		st.equal(result.valid, true, 'valid with empty versions');
		st.equal(result.latestVersion, null, 'latestVersion is null');
	});

	t.test('cargo - missing max_version', async (st) => {
		const result = await validate('pkg:cargo/no-max-version');
		st.equal(result.valid, true, 'valid without max_version');
		st.equal(result.latestVersion, null, 'latestVersion is null');
	});

	t.test('nuget - empty items in page', async (st) => {
		const result = await validate('pkg:nuget/empty-items-pkg');
		st.equal(result.valid, true, 'valid with empty items');
		st.equal(result.latestVersion, null, 'latestVersion is null');
	});

	t.test('hackage - missing normal-version', async (st) => {
		const result = await validate('pkg:hackage/missing-versions-pkg');
		st.equal(result.valid, true, 'valid without normal-version');
		st.equal(result.latestVersion, null, 'latestVersion is null');
	});

	t.test('cocoapods - missing versions property', async (st) => {
		const result = await validate('pkg:cocoapods/MissingVersionsPod');
		st.equal(result.valid, true, 'valid without versions property');
		st.equal(result.latestVersion, null, 'latestVersion is null');
	});

	t.test('cargo - no max_version but has versions[0]', async (st) => {
		const result = await validate('pkg:cargo/no-max-but-versions');
		st.equal(result.valid, true, 'valid with fallback to versions[0]');
		st.equal(result.latestVersion, '1.0.0', 'latestVersion from versions[0]');
	});

	t.test('cargo - version not found with empty versions', async (st) => {
		const result = await validate('pkg:cargo/empty-versions-crate@1.0.0');
		st.equal(result.valid, false, 'version not found');
		st.ok(getError(result).includes('none'), 'error mentions none for recent versions');
	});

	t.test('nuget - undefined items in data', async (st) => {
		const result = await validate('pkg:nuget/undefined-items-pkg');
		st.equal(result.valid, true, 'valid with undefined items');
		st.equal(result.latestVersion, null, 'latestVersion is null');
	});

	t.test('nuget - undefined items in page', async (st) => {
		const result = await validate('pkg:nuget/undefined-page-items-pkg');
		st.equal(result.valid, true, 'valid with undefined page items');
		st.equal(result.latestVersion, null, 'latestVersion is null');
	});

});

// Restore original fetch at the end
test.onFinish(() => {
	globalThis.fetch = originalFetch;
});
