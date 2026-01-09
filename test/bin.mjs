import test from 'tape';

import { join } from 'path';
import { promisify } from 'util';
import { execFile as execFileC } from 'child_process';
import { fileURLToPath } from 'url';

const execFile = promisify(execFileC);

const bin = join(import.meta.dirname, '../bin.mjs');
const mockPreload = fileURLToPath(new URL('./mock-fetch-preload.mjs', import.meta.url));

// Set PURL_LIVE_TESTS=1 to run tests against real registries
const useLiveTests = process.env.PURL_LIVE_TESTS === '1';

/**
 * Run the CLI with given arguments.
 * @param {string[]} args - CLI arguments
 * @param {{ useMock?: boolean }} [options] - Options
 * @returns {Promise<{ code: number, stdout: string, stderr: string }>}
 */
async function runCli(args, { useMock = false } = {}) {
	/** @type {NodeJS.ProcessEnv} */
	const env = { ...process.env, NO_COLOR: '1' };

	// Use NODE_OPTIONS to inject mock fetch for --check tests when not using live tests
	if (useMock && !useLiveTests) {
		env.NODE_OPTIONS = `${env.NODE_OPTIONS || ''} --import ${mockPreload}`.trim();
	}

	const [result] = await Promise.all([
		execFile(bin, args, { env }),
	].map((x) => x.catch((e) => e)));

	return {
		code: result.code ?? 0,
		stderr: `${result.stderr ?? ''}`.trim(),
		stdout: `${result.stdout ?? ''}`.trim(),
	};
}

test('CLI - basic parsing (no --check)', async (t) => {
	t.test('npm PURL input', async (st) => {
		const result = await runCli(['pkg:npm/lodash@4.17.21']);
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stdout, 'pkg:npm/lodash@4.17.21', 'stdout is PURL');
		st.ok(result.stderr.includes('"source": "purl"'), 'source is purl');
		st.ok(result.stderr.includes('"url":'), 'includes url');
		st.notOk(result.stderr.includes('"latestVersion"'), 'no latestVersion without --check');
	});

	t.test('npm specifier input', async (st) => {
		const result = await runCli(['lodash@4.17.21']);
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stdout, 'pkg:npm/lodash@4.17.21', 'stdout is PURL');
		st.ok(result.stderr.includes('"source": "npm"'), 'source is npm');
	});

	t.test('scoped npm package', async (st) => {
		const result = await runCli(['@babel/core@7.0.0']);
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stdout, 'pkg:npm/%40babel/core@7.0.0', 'encodes @ in namespace');
		st.ok(result.stderr.includes('"namespace": "@babel"'), 'namespace parsed');
	});

	t.test('pypi PURL input', async (st) => {
		const result = await runCli(['pkg:pypi/requests@2.28.0']);
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stdout, 'pkg:pypi/requests@2.28.0', 'stdout is PURL');
		st.ok(result.stderr.includes('"type": "pypi"'), 'type is pypi');
		st.ok(result.stderr.includes('pypi.org'), 'url contains pypi.org');
	});

	t.test('maven PURL input', async (st) => {
		const result = await runCli(['pkg:maven/org.apache.commons/commons-lang3@3.12.0']);
		st.equal(result.code, 0, 'exit code is 0');
		st.ok(result.stdout.includes('pkg:maven/org.apache.commons/commons-lang3@3.12.0'), 'stdout is PURL');
		st.ok(result.stderr.includes('"type": "maven"'), 'type is maven');
		st.ok(result.stderr.includes('"namespace": "org.apache.commons"'), 'namespace parsed');
	});

	t.test('gem PURL input', async (st) => {
		const result = await runCli(['pkg:gem/rails@7.0.0']);
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stdout, 'pkg:gem/rails@7.0.0', 'stdout is PURL');
		st.ok(result.stderr.includes('"type": "gem"'), 'type is gem');
		st.ok(result.stderr.includes('rubygems.org'), 'url contains rubygems.org');
	});

	t.test('cargo PURL input', async (st) => {
		const result = await runCli(['pkg:cargo/serde@1.0.0']);
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stdout, 'pkg:cargo/serde@1.0.0', 'stdout is PURL');
		st.ok(result.stderr.includes('"type": "cargo"'), 'type is cargo');
		st.ok(result.stderr.includes('crates.io'), 'url contains crates.io');
	});

	t.test('nuget PURL input', async (st) => {
		const result = await runCli(['pkg:nuget/Newtonsoft.Json@13.0.1']);
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stdout, 'pkg:nuget/Newtonsoft.Json@13.0.1', 'stdout is PURL');
		st.ok(result.stderr.includes('"type": "nuget"'), 'type is nuget');
	});

	t.test('hex PURL input', async (st) => {
		const result = await runCli(['pkg:hex/phoenix@1.6.0']);
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stdout, 'pkg:hex/phoenix@1.6.0', 'stdout is PURL');
		st.ok(result.stderr.includes('"type": "hex"'), 'type is hex');
	});

	t.test('composer PURL input', async (st) => {
		const result = await runCli(['pkg:composer/laravel/framework@9.0.0']);
		st.equal(result.code, 0, 'exit code is 0');
		st.ok(result.stdout.includes('pkg:composer/laravel/framework@9.0.0'), 'stdout is PURL');
		st.ok(result.stderr.includes('"type": "composer"'), 'type is composer');
	});

	t.test('golang PURL input', async (st) => {
		const result = await runCli(['pkg:golang/github.com%2Fgorilla/mux@1.8.0']);
		st.equal(result.code, 0, 'exit code is 0');
		st.ok(result.stderr.includes('"type": "golang"'), 'type is golang');
		st.ok(result.stderr.includes('pkg.go.dev'), 'url contains pkg.go.dev');
	});

	t.test('invalid input', async (st) => {
		const result = await runCli(['git://invalid']);
		st.equal(result.code, 1, 'exit code is 1');
		st.ok(result.stderr.includes('Invalid input'), 'error message');
	});

	t.test('missing input', async (st) => {
		const result = await runCli([]);
		st.equal(result.code, 1, 'exit code is 1');
		st.ok(result.stderr.includes('Missing required <input> argument'), 'missing input error');
	});

});

// Tests for --json flag
test('CLI - with --json flag', async (t) => {
	t.test('outputs JSON to stdout only', async (st) => {
		const result = await runCli(['--json', 'pkg:npm/lodash@4.17.21']);
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stderr, '', 'stderr is empty');
		const json = JSON.parse(result.stdout);
		st.equal(json.purl, 'pkg:npm/lodash@4.17.21', 'JSON contains purl');
		st.equal(json.source, 'purl', 'JSON contains source');
		st.equal(json.parsed.name, 'lodash', 'JSON contains parsed.name');
		st.equal(json.parsed.version, '4.17.21', 'JSON contains parsed.version');
	});

	t.test('works with npm specifier', async (st) => {
		const result = await runCli(['--json', 'lodash@4.17.21']);
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stderr, '', 'stderr is empty');
		const json = JSON.parse(result.stdout);
		st.equal(json.purl, 'pkg:npm/lodash@4.17.21', 'JSON contains purl');
		st.equal(json.source, 'npm', 'source is npm');
	});

	t.test('includes url in JSON', async (st) => {
		const result = await runCli(['--json', 'pkg:npm/lodash']);
		st.equal(result.code, 0, 'exit code is 0');
		const json = JSON.parse(result.stdout);
		st.ok(json.url, 'JSON contains url');
		st.ok(json.url.includes('npmjs.com'), 'url is npm URL');
	});

	t.test('works with --check', async (st) => {
		const result = await runCli(['--json', '--check', 'lodash'], { useMock: true });
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stderr, '', 'stderr is empty');
		const json = JSON.parse(result.stdout);
		st.equal(json.purl, 'pkg:npm/lodash', 'JSON contains purl');
		st.ok(json.latestVersion, 'JSON contains latestVersion');
	});
});

// Tests for --version flag
test('CLI - with --version flag', async (t) => {
	t.test('outputs version to stdout', async (st) => {
		const result = await runCli(['--version']);
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stderr, '', 'stderr is empty');
		st.ok(result.stdout.startsWith('v'), 'version starts with v');
		st.match(result.stdout, /^v\d+\.\d+\.\d+/, 'version matches semver pattern');
	});
});

// Tests for --check flag - uses mocked responses by default
// Set PURL_LIVE_TESTS=1 to run against real registries instead
test('CLI - with --check flag (valid packages)', async (t) => {
	t.test('npm - valid package', async (st) => {
		const result = await runCli(['-c', 'lodash'], { useMock: true });
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stdout, 'pkg:npm/lodash', 'stdout is PURL');
		st.ok(result.stderr.includes('"latestVersion"'), 'has latestVersion');
	});

	t.test('npm - valid package with version', async (st) => {
		const result = await runCli(['--check', 'lodash@4.17.21'], { useMock: true });
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stdout, 'pkg:npm/lodash@4.17.21', 'stdout is PURL');
		st.ok(result.stderr.includes('"latestVersion"'), 'has latestVersion');
	});

	t.test('npm - valid scoped package', async (st) => {
		const result = await runCli(['-c', '@babel/core'], { useMock: true });
		st.equal(result.code, 0, 'exit code is 0');
		st.ok(result.stdout.includes('pkg:npm/%40babel/core'), 'stdout is PURL');
		st.ok(result.stderr.includes('"latestVersion"'), 'has latestVersion');
	});

	t.test('pypi - valid package', async (st) => {
		const result = await runCli(['-c', 'pkg:pypi/requests'], { useMock: true });
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stdout, 'pkg:pypi/requests', 'stdout is PURL');
		st.ok(result.stderr.includes('"latestVersion"'), 'has latestVersion');
	});

	t.test('pypi - valid package with version', async (st) => {
		const result = await runCli(['-c', 'pkg:pypi/requests@2.28.0'], { useMock: true });
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stdout, 'pkg:pypi/requests@2.28.0', 'stdout is PURL');
		st.ok(result.stderr.includes('"latestVersion"'), 'has latestVersion');
	});

	t.test('gem - valid package', async (st) => {
		const result = await runCli(['-c', 'pkg:gem/rails'], { useMock: true });
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stdout, 'pkg:gem/rails', 'stdout is PURL');
		st.ok(result.stderr.includes('"latestVersion"'), 'has latestVersion');
	});

	t.test('cargo - valid package', async (st) => {
		const result = await runCli(['-c', 'pkg:cargo/serde'], { useMock: true });
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stdout, 'pkg:cargo/serde', 'stdout is PURL');
		st.ok(result.stderr.includes('"latestVersion"'), 'has latestVersion');
	});

	t.test('nuget - valid package', async (st) => {
		const result = await runCli(['-c', 'pkg:nuget/Newtonsoft.Json'], { useMock: true });
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stdout, 'pkg:nuget/Newtonsoft.Json', 'stdout is PURL');
		st.ok(result.stderr.includes('"latestVersion"'), 'has latestVersion');
	});

	t.test('hex - valid package', async (st) => {
		const result = await runCli(['-c', 'pkg:hex/phoenix'], { useMock: true });
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stdout, 'pkg:hex/phoenix', 'stdout is PURL');
		st.ok(result.stderr.includes('"latestVersion"'), 'has latestVersion');
	});

	t.test('maven - valid package', async (st) => {
		const result = await runCli(['-c', 'pkg:maven/org.apache.commons/commons-lang3'], { useMock: true });
		st.equal(result.code, 0, 'exit code is 0');
		st.ok(result.stdout.includes('pkg:maven/org.apache.commons/commons-lang3'), 'stdout is PURL');
		st.ok(result.stderr.includes('"latestVersion"'), 'has latestVersion');
	});

	t.test('composer - valid package', async (st) => {
		const result = await runCli(['-c', 'pkg:composer/laravel/framework'], { useMock: true });
		st.equal(result.code, 0, 'exit code is 0');
		st.ok(result.stdout.includes('pkg:composer/laravel/framework'), 'stdout is PURL');
		st.ok(result.stderr.includes('"latestVersion"'), 'has latestVersion');
	});

	t.test('pub - valid package', async (st) => {
		const result = await runCli(['-c', 'pkg:pub/http'], { useMock: true });
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stdout, 'pkg:pub/http', 'stdout is PURL');
		st.ok(result.stderr.includes('"latestVersion"'), 'has latestVersion');
	});

	t.test('hackage - valid package', async (st) => {
		const result = await runCli(['-c', 'pkg:hackage/aeson'], { useMock: true });
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stdout, 'pkg:hackage/aeson', 'stdout is PURL');
		st.ok(result.stderr.includes('"latestVersion"'), 'has latestVersion');
	});

	t.test('cocoapods - valid package', async (st) => {
		const result = await runCli(['-c', 'pkg:cocoapods/AFNetworking'], { useMock: true });
		st.equal(result.code, 0, 'exit code is 0');
		st.equal(result.stdout, 'pkg:cocoapods/AFNetworking', 'stdout is PURL');
		st.ok(result.stderr.includes('"latestVersion"'), 'has latestVersion');
	});

});

test('CLI - with --check flag (invalid packages)', async (t) => {
	t.test('npm - non-existent package', async (st) => {
		const result = await runCli(['-c', 'this-pkg-does-not-exist-xyz123'], { useMock: true });
		st.equal(result.code, 1, 'exit code is 1');
		st.ok(result.stderr.includes('not found'), 'error mentions not found');
		st.equal(result.stdout, '', 'no stdout on failure');
	});

	t.test('npm - non-existent version', async (st) => {
		const result = await runCli(['-c', 'lodash@999.999.999'], { useMock: true });
		st.equal(result.code, 1, 'exit code is 1');
		st.ok(result.stderr.includes('version'), 'error mentions version');
		st.ok(result.stderr.includes('not found'), 'error mentions not found');
	});

	t.test('pypi - non-existent package', async (st) => {
		const result = await runCli(['-c', 'pkg:pypi/this-pkg-does-not-exist-xyz123'], { useMock: true });
		st.equal(result.code, 1, 'exit code is 1');
		st.ok(result.stderr.includes('not found'), 'error mentions not found');
	});

	t.test('gem - non-existent package', async (st) => {
		const result = await runCli(['-c', 'pkg:gem/this-gem-does-not-exist-xyz123'], { useMock: true });
		st.equal(result.code, 1, 'exit code is 1');
		st.ok(result.stderr.includes('not found'), 'error mentions not found');
	});

	t.test('cargo - non-existent package', async (st) => {
		const result = await runCli(['-c', 'pkg:cargo/this-crate-does-not-exist-xyz123'], { useMock: true });
		st.equal(result.code, 1, 'exit code is 1');
		st.ok(result.stderr.includes('not found'), 'error mentions not found');
	});

	t.test('nuget - non-existent package', async (st) => {
		const result = await runCli(['-c', 'pkg:nuget/This.Pkg.Does.Not.Exist.Xyz123'], { useMock: true });
		st.equal(result.code, 1, 'exit code is 1');
		st.ok(result.stderr.includes('not found'), 'error mentions not found');
	});

	t.test('hex - non-existent package', async (st) => {
		const result = await runCli(['-c', 'pkg:hex/this_pkg_does_not_exist_xyz123'], { useMock: true });
		st.equal(result.code, 1, 'exit code is 1');
		st.ok(result.stderr.includes('not found'), 'error mentions not found');
	});

	t.test('maven - non-existent package', async (st) => {
		const result = await runCli(['-c', 'pkg:maven/fake.group.xyz/fake-artifact-123'], { useMock: true });
		st.equal(result.code, 1, 'exit code is 1');
		st.ok(result.stderr.includes('not found'), 'error mentions not found');
	});

	t.test('composer - non-existent package', async (st) => {
		const result = await runCli(['-c', 'pkg:composer/fake-vendor-xyz/fake-pkg-123'], { useMock: true });
		st.equal(result.code, 1, 'exit code is 1');
		st.ok(result.stderr.includes('not found'), 'error mentions not found');
	});

	t.test('pub - non-existent package', async (st) => {
		const result = await runCli(['-c', 'pkg:pub/this_pkg_does_not_exist_xyz123'], { useMock: true });
		st.equal(result.code, 1, 'exit code is 1');
		st.ok(result.stderr.includes('not found'), 'error mentions not found');
	});

	t.test('hackage - non-existent package', async (st) => {
		const result = await runCli(['-c', 'pkg:hackage/this-pkg-does-not-exist-xyz123'], { useMock: true });
		st.equal(result.code, 1, 'exit code is 1');
		st.ok(result.stderr.includes('not found'), 'error mentions not found');
	});

	t.test('cocoapods - non-existent package', async (st) => {
		const result = await runCli(['-c', 'pkg:cocoapods/ThisPodDoesNotExistXyz123'], { useMock: true });
		st.equal(result.code, 1, 'exit code is 1');
		st.ok(result.stderr.includes('not found'), 'error mentions not found');
	});

});

test('CLI - with --check flag (unsupported types)', async (t) => {
	t.test('golang - unsupported for check', async (st) => {
		const result = await runCli(['-c', 'pkg:golang/github.com%2Fgorilla/mux'], { useMock: true });
		st.equal(result.code, 1, 'exit code is 1');
		st.ok(result.stderr.includes('not supported'), 'error mentions not supported');
	});

	t.test('github - unsupported for check', async (st) => {
		const result = await runCli(['-c', 'pkg:github/lodash/lodash'], { useMock: true });
		st.equal(result.code, 1, 'exit code is 1');
		st.ok(result.stderr.includes('not supported'), 'error mentions not supported');
	});

	t.test('docker - unsupported for check', async (st) => {
		const result = await runCli(['-c', 'pkg:docker/library/nginx'], { useMock: true });
		st.equal(result.code, 1, 'exit code is 1');
		st.ok(result.stderr.includes('not supported'), 'error mentions not supported');
	});

});

// Mock-only test - skip when using live tests
const mockOnlyTest = useLiveTests ? test.skip : test;

mockOnlyTest('CLI - with --check flag (network error)', async (t) => {
	t.test('network error during validation (Error object)', async (st) => {
		const result = await runCli(['-c', 'throw-network-error-xyz'], { useMock: true });
		st.equal(result.code, 1, 'exit code is 1');
		st.ok(result.stderr.includes('Validation error'), 'error mentions validation error');
		st.ok(result.stderr.includes('Network error'), 'error message contains thrown Error message');
		st.equal(result.stdout, '', 'no stdout on failure');
	});

	t.test('network error during validation (non-Error throw)', async (st) => {
		const result = await runCli(['-c', 'throw-string-error-xyz'], { useMock: true });
		st.equal(result.code, 1, 'exit code is 1');
		st.ok(result.stderr.includes('Validation error'), 'error mentions validation error');
		st.ok(result.stderr.includes('String error thrown'), 'error message contains stringified non-Error');
		st.equal(result.stdout, '', 'no stdout on failure');
	});

});
