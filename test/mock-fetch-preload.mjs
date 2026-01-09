// Mock fetch responses for CLI testing via NODE_OPTIONS --import
// This file is loaded before bin.mjs when running CLI tests

/** @typedef {{ ok: boolean, status: number, json?: () => Promise<unknown>, text?: () => Promise<string> } | 'THROW_ERROR' | 'THROW_STRING'} MockResponse */

/** @type {Record<string, MockResponse>} */
const mockResponses = {
	// npm
	'https://registry.npmjs.org/lodash': {
		ok: true,
		status: 200,
		json: async () => ({
			'dist-tags': { latest: '4.17.21' },
			versions: { '4.17.20': {}, '4.17.21': {} },
		}),
	},
	'https://registry.npmjs.org/@babel%2Fcore': {
		ok: true,
		status: 200,
		json: async () => ({
			'dist-tags': { latest: '7.24.0' },
			versions: { '7.0.0': {}, '7.24.0': {} },
		}),
	},
	'https://registry.npmjs.org/this-pkg-does-not-exist-xyz123': {
		ok: false,
		status: 404,
		json: async () => ({}),
	},

	// pypi - base info
	'https://pypi.org/pypi/requests/json': {
		ok: true,
		status: 200,
		json: async () => ({
			info: { version: '2.31.0' },
			releases: { '2.28.0': [{}], '2.31.0': [{}] },
		}),
	},
	// pypi - version check
	'https://pypi.org/pypi/requests/2.28.0/json': {
		ok: true,
		status: 200,
		json: async () => ({ info: { version: '2.28.0' } }),
	},
	'https://pypi.org/pypi/this-pkg-does-not-exist-xyz123/json': {
		ok: false,
		status: 404,
		json: async () => ({}),
	},

	// gem - uses /versions/ endpoint
	'https://rubygems.org/api/v1/versions/rails.json': {
		ok: true,
		status: 200,
		json: async () => [{ number: '7.0.0' }, { number: '7.1.3' }],
	},
	'https://rubygems.org/api/v1/versions/this-gem-does-not-exist-xyz123.json': {
		ok: false,
		status: 404,
		json: async () => ({}),
	},

	// cargo
	'https://crates.io/api/v1/crates/serde': {
		ok: true,
		status: 200,
		json: async () => ({
			crate: {
				// eslint-disable-next-line camelcase -- crates.io API uses snake_case
				max_version: '1.0.195',
			},
			versions: [{ num: '1.0.0' }, { num: '1.0.195' }],
		}),
	},
	'https://crates.io/api/v1/crates/this-crate-does-not-exist-xyz123': {
		ok: false,
		status: 404,
		json: async () => ({}),
	},

	// nuget - registration5-gz-semver2
	'https://api.nuget.org/v3/registration5-gz-semver2/newtonsoft.json/index.json': {
		ok: true,
		status: 200,
		json: async () => ({
			items: [{
				items: [
					{ catalogEntry: { version: '13.0.1' } },
					{ catalogEntry: { version: '13.0.3' } },
				],
			}],
		}),
	},
	'https://api.nuget.org/v3/registration5-gz-semver2/this.pkg.does.not.exist.xyz123/index.json': {
		ok: false,
		status: 404,
		json: async () => ({}),
	},

	// hex
	'https://hex.pm/api/packages/phoenix': {
		ok: true,
		status: 200,
		json: async () => ({
			releases: [{ version: '1.6.0' }, { version: '1.7.10' }],
		}),
	},
	'https://hex.pm/api/packages/this_pkg_does_not_exist_xyz123': {
		ok: false,
		status: 404,
		json: async () => ({}),
	},

	// maven - with quoted values
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
	'https://search.maven.org/solrsearch/select?q=g:"fake.group.xyz"+AND+a:"fake-artifact-123"&rows=1&wt=json': {
		ok: true,
		status: 200,
		json: async () => ({
			response: { numFound: 0, docs: [] },
		}),
	},

	// composer
	'https://repo.packagist.org/p2/laravel/framework.json': {
		ok: true,
		status: 200,
		json: async () => ({
			packages: {
				'laravel/framework': [{ version: '10.0.0' }, { version: '9.0.0' }],
			},
		}),
	},
	'https://repo.packagist.org/p2/fake-vendor-xyz/fake-pkg-123.json': {
		ok: false,
		status: 404,
		json: async () => ({}),
	},

	// pub
	'https://pub.dev/api/packages/http': {
		ok: true,
		status: 200,
		json: async () => ({
			latest: { version: '1.2.0' },
			versions: [{ version: '1.2.0' }, { version: '1.1.0' }],
		}),
	},
	'https://pub.dev/api/packages/this_pkg_does_not_exist_xyz123': {
		ok: false,
		status: 404,
		json: async () => ({}),
	},

	// hackage
	'https://hackage.haskell.org/package/aeson/preferred': {
		ok: true,
		status: 200,
		json: async () => ({
			'normal-version': ['2.1.2.1', '2.0.0.0'],
		}),
	},
	'https://hackage.haskell.org/package/this-pkg-does-not-exist-xyz123/preferred': {
		ok: false,
		status: 404,
		json: async () => ({}),
	},

	// cocoapods - trunk API
	'https://trunk.cocoapods.org/api/v1/pods/AFNetworking': {
		ok: true,
		status: 200,
		json: async () => ({
			versions: [{ name: '4.0.1' }, { name: '4.0.0' }, { name: '0.9.0' }],
		}),
	},
	'https://trunk.cocoapods.org/api/v1/pods/ThisPodDoesNotExistXyz123': {
		ok: false,
		status: 404,
		json: async () => ({}),
	},

	// Special mock to simulate network error (Error object)
	'https://registry.npmjs.org/throw-network-error-xyz': 'THROW_ERROR',

	// Special mock to simulate non-Error throw (for instanceof Error false branch)
	'https://registry.npmjs.org/throw-string-error-xyz': 'THROW_STRING',
};

/**
 * @param {string | URL | Request} input
 * @returns {Promise<Response>}
 */
function mockFetch(input) {
	const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
	const mockResponse = mockResponses[url];
	if (mockResponse === 'THROW_ERROR') {
		return Promise.reject(new Error('Network error'));
	}
	if (mockResponse === 'THROW_STRING') {
		// eslint-disable-next-line prefer-promise-reject-errors -- testing non-Error rejection
		return Promise.reject('String error thrown');
	}
	if (mockResponse) {
		// eslint-disable-next-line no-extra-parens -- JSDoc type cast
		return Promise.resolve(/** @type {Response} */ (mockResponse));
	}
	// eslint-disable-next-line no-extra-parens -- JSDoc type cast
	return Promise.resolve(/** @type {Response} */ ({
		ok: false,
		status: 404,
		json: async () => ({}),
	}));
}

// Only mock if not running live tests
if (process.env.PURL_LIVE_TESTS !== '1') {
	// @ts-ignore -- replacing global fetch
	globalThis.fetch = mockFetch;
}
