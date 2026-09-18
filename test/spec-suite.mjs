import test from 'tape';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { basename, join } from 'path';

import PURL from '../purl.mjs';

/**
 * The canonical PURL test suite, vendored as the `vendor/package-url/purl-spec` submodule.
 * `npm run pretests-only` initializes it; when it is absent (a bare `tape` run, or the published
 * tarball, which excludes it), these tests are skipped.
 *
 * Each case is one of three `test_type`s:
 * - `parse`: the input string parses into the expected components
 * - `build`: the input components serialize to the expected canonical string
 * - `validate`: the input string round-trips to the expected canonical string
 *
 * A case with `expected_failure` must be rejected: `new PURL(...)` throws a `TypeError`.
 */
const TESTS_DIR = join(import.meta.dirname, '..', 'vendor', 'package-url', 'purl-spec', 'tests');

/**
 * Cases where this package does not match the suite, keyed by `${file}|${test_type}|${input}`.
 * Every entry is asserted to still deviate, so a change that makes one match fails this suite until
 * its entry is removed.
 */
const KNOWN_DEVIATIONS = new Set([
	'bazel|build|{"type":"bazel","namespace":null,"name":"rules_java","version":"7.8.0","qualifiers":{"repository_url":"https://example.org/bazel-registry"},"subpath":null}',
	'bazel|validate|pkg:bazel/rules_java@7.8.0?repository_url=https://bcr.bazel.build/',
	'bazel|validate|pkg:bazel/rules_java@7.8.0?repository_url=https://example.org/bazel-registry/',
	'bitbucket|parse|pkg:bitbucket/birKenfeld/pyGments-main@244fd47e07d1014f0aed9c',
	'bitbucket|validate|pkg:bitbucket/birKenfeld/pyGments-main@244fd47e07d1014f0aed9c',
	'brew|build|{"type":"brew","namespace":"some-org/some-tap","name":"some-app","version":"1.2.3","qualifiers":{"repository_url":"https://github.com/some-org/homebrew-some-tap.git"},"subpath":null}',
	'brew|parse|pkg:brew/Homebrew/Core/sqlite@3.43.2',
	'brew|parse|pkg:brew/SQLite@3.43.2',
	'brew|validate|pkg:brew/Homebrew/Core/sqlite@3.43.2',
	'brew|validate|pkg:brew/SQLite@3.43.2',
	'brew|validate|pkg:brew/some-org/some-tap/some-app@1.2.3?repository_url=https:%2F%2Fgithub.com%2Fsome-org%2Fhomebrew-some-tap.git',
	'chrome-extension|parse|pkg:chrome-extension/44444algnefjeiefhmpklpfiohadpglk',
	'chrome-extension|parse|pkg:chrome-extension/dlpngalgnefjeiefhmpklpfiohadpglk@1.2.3-beta',
	'chrome-extension|parse|pkg:chrome-extension/dlpngalgnefjeiefhmpklpfiohadpglk@1.2.3.4.5',
	'chrome-extension|parse|pkg:chrome-extension/dogs',
	'cocoapods|build|{"type":"cocoapods","namespace":null,"name":"GoogleUtilities","version":"7.5.2","qualifiers":null,"subpath":"NSData+zlib"}',
	'cocoapods|validate|pkg:cocoapods/GoogleUtilities@7.5.2#NSData+zlib',
	'composer|parse|pkg:composer/Laravel/Laravel@5.5.0',
	'composer|validate|pkg:composer/Laravel/Laravel@5.5.0',
	'cpan|build|{"type":"cpan","namespace":"GDT","name":"URI::PackageURL","version":null,"qualifiers":null,"subpath":null}',
	'cpan|build|{"type":"cpan","namespace":null,"name":"URI::PackageURL","version":null,"qualifiers":null,"subpath":null}',
	'cpan|parse|pkg:cpan/GDT/URI::PackageURL',
	'cpan|parse|pkg:cpan/LWP::UserAgent@6.7.6',
	'cpan|parse|pkg:cpan/URI::PackageURL',
	'deb|build|{"type":"deb","namespace":"debian","name":"attr","version":"1:2.4.47-2+b1","qualifiers":{"arch":"amd64"},"subpath":null}',
	'deb|validate|pkg:deb/debian/attr@1:2.4.47-2%2Bb1?arch=amd64',
	'gem|parse|pkg:gem/jruby-launcher@1.1.2?Platform=java',
	'generic|build|{"type":"generic","namespace":null,"name":"bitwarderl","version":null,"qualifiers":{"vcs_url":"git+https://git.fsfe.org/dxtr/bitwarderl@cc55108da32"},"subpath":null}',
	'generic|build|{"type":"generic","namespace":null,"name":"openssl","version":"1.1.10g","qualifiers":{"checksum":"sha256:de4d501267da","download_url":"https://openssl.org/source/openssl-1.1.0g.tar.gz"},"subpath":null}',
	'generic|validate|pkg:generic/bitwarderl?vcs_url=git%2Bhttps://git.fsfe.org/dxtr/bitwarderl%40cc55108da32',
	'generic|validate|pkg:generic/openssl@1.1.10g?download_url=https://openssl.org/source/openssl-1.1.0g.tar.gz&checksum=sha256:de4d501267da',
	'github|parse|pkg:github/Package-url/purl-Spec@244fd47e07d1004f0aed9c',
	'github|validate|pkg:github/Package-url/purl-Spec@244fd47e07d1004f0aed9c',
	'git|build|{"type":"git","namespace":"codeberg.org","name":"forgejo/forgejo","version":"a72d2c07cfca03b55371089de6aa230d8c951fa0","qualifiers":null,"subpath":"options/locale_readme.md"}',
	'git|build|{"type":"git","namespace":"codeberg.org","name":"forgejo/forgejo","version":"a72d2c07cfca03b55371089de6aa230d8c951fa0","qualifiers":null,"subpath":null}',
	'git|parse|pkg:git/codeberg.org/forgejo/forgejo@a72d2c07cfca03b55371089de6aa230d8c951fa0',
	'git|parse|pkg:git/codeberg.org/forgejo/forgejo@a72d2c07cfca03b55371089de6aa230d8c951fa0#options/locale_readme.md',
	'git|validate|pkg:git/github/Package-url/purl-Spec@244fd47e07d1004f0aed9c',
	'golang|parse|pkg:GOLANG/google.golang.org/genproto#/googleapis/api/annotations/',
	'golang|parse|pkg:GOLANG/google.golang.org/genproto@abcdedf#/googleapis/api/annotations/',
	'hex|build|{"type":"hex","namespace":null,"name":"bar","version":"1.2.3","qualifiers":{"repository_url":"https://myrepo.example.com"},"subpath":null}',
	'hex|validate|pkg:hex/bar@1.2.3?repository_url=https://myrepo.example.com',
	'huggingface|build|{"type":"huggingface","namespace":"microsoft","name":"deberta-v3-base","version":"559062ad13d311b87b2c455e67dcd5f1c8f65111","qualifiers":{"repository_url":"https://hub-ci.huggingface.co"},"subpath":null}',
	'huggingface|parse|pkg:huggingface/EleutherAI/gpt-neo-1.3B@797174552AE47F449AB70B684CABCB6603E5E85E',
	'huggingface|validate|pkg:huggingface/EleutherAI/gpt-neo-1.3B@797174552AE47F449AB70B684CABCB6603E5E85E',
	'huggingface|validate|pkg:huggingface/microsoft/deberta-v3-base@559062ad13d311b87b2c455e67dcd5f1c8f65111?repository_url=https://hub-ci.huggingface.co',
	'julia|build|{"type":"julia","namespace":null,"name":"RegisterQD","version":"0.3.1","qualifiers":{"repository_url":"https://github.com/HolyLab/HolyLabRegistry","uuid":"ac24ea0c-1830-11e9-18d4-81f172323054"},"subpath":null}',
	'julia|parse|pkg:julia/Dates',
	'julia|validate|pkg:julia/RegisterQD@0.3.1?repository_url=https://github.com/HolyLab/HolyLabRegistry&uuid=ac24ea0c-1830-11e9-18d4-81f172323054',
	'luarocks|build|{"type":"luarocks","namespace":"username","name":"packagename","version":"0.1.0-1","qualifiers":{"repository_url":"https://example.com/private_rocks_server/"},"subpath":null}',
	'luarocks|validate|pkg:luarocks/username/packagename@0.1.0-1?repository_url=https://example.com/private_rocks_server/',
	'maven|build|{"type":"maven","namespace":"groovy","name":"groovy","version":"1.0","qualifiers":{"repository_url":"https://maven.google.com"},"subpath":null}',
	'maven|build|{"type":"maven","namespace":"org.apache.xmlgraphics","name":"batik-anim","version":"1.9.1","qualifiers":{"classifier":"foo","repository_url":"repo.spring.io/release"},"subpath":null}',
	'maven|build|{"type":"maven","namespace":"org.apache.xmlgraphics","name":"batik-anim","version":"1.9.1","qualifiers":{"classifier":"sources","repository_url":"repo.spring.io/release"},"subpath":null}',
	'maven|validate|pkg:Maven/org.apache.xmlgraphics/batik-anim@1.9.1?classifier=sources&repositorY_url=https://repo.spring.io/release',
	'maven|validate|pkg:Maven/org.apache.xmlgraphics/batik-anim@1.9.1?type=pom&repositorY_url=repo.spring.io/release',
	'maven|validate|pkg:maven/groovy/groovy@1.0?repository_url=https://maven.google.com',
	'maven|validate|pkg:maven/org.apache.xmlgraphics/batik-anim@1.9.1?classifier=sources&repository_url=repo.spring.io/release',
	'maven|validate|pkg:maven/org.apache.xmlgraphics/batik-anim@1.9.1?type=war&repository_url=https://repo.spring.io/release',
	'mlflow|build|{"type":"mlflow","namespace":null,"name":"CreditFraud","version":"3","qualifiers":{"repository_url":"https://westus2.api.azureml.ms/mlflow/v1.0/subscriptions/a50f2011-fab8-4164-af23-c62881ef8c95/resourceGroups/TestResourceGroup/providers/Microsoft.MachineLearningServices/workspaces/TestWorkspace"},"subpath":null}',
	'mlflow|build|{"type":"mlflow","namespace":null,"name":"creditfraud","version":"3","qualifiers":{"repository_url":"https://adb-5245952564735461.0.azuredatabricks.net/api/2.0/mlflow"},"subpath":null}',
	'mlflow|build|{"type":"mlflow","namespace":null,"name":"creditfraud","version":"3","qualifiers":{"repository_url":"https://westus2.api.azureml.ms/mlflow/v1.0/subscriptions/a50f2011-fab8-4164-af23-c62881ef8c95/resourceGroups/TestResourceGroup/providers/Microsoft.MachineLearningServices/workspaces/TestWorkspace"},"subpath":null}',
	'mlflow|build|{"type":"mlflow","namespace":null,"name":"trafficsigns","version":"10","qualifiers":{"model_uuid":"36233173b22f4c89b451f1228d700d49","repository_url":"https://adb-5245952564735461.0.azuredatabricks.net/api/2.0/mlflow","run_id":"410a3121-2709-4f88-98dd-dba0ef056b0a"},"subpath":null}',
	'mlflow|build|{"type":"mlflow","namespace":null,"name":"trafficsigns","version":"10","qualifiers":{"model_uuid":"36233173b22f4c89b451f1228d700d49","run_id":"410a3121-2709-4f88-98dd-dba0ef056b0a","repository_url":"https://adb-5245952564735461.0.azuredatabricks.net/api/2.0/mlflow"},"subpath":null}',
	'mlflow|parse|pkg:mlflow/CreditFraud@3?repository_url=https://adb-5245952564735461.0.azuredatabricks.net/api/2.0/mlflow',
	'mlflow|validate|pkg:mlflow/CreditFraud@3?repository_url=https://adb-5245952564735461.0.azuredatabricks.net/api/2.0/mlflow',
	'mlflow|validate|pkg:mlflow/CreditFraud@3?repository_url=https://westus2.api.azureml.ms/mlflow/v1.0/subscriptions/a50f2011-fab8-4164-af23-c62881ef8c95/resourceGroups/TestResourceGroup/providers/Microsoft.MachineLearningServices/workspaces/TestWorkspace',
	'mlflow|validate|pkg:mlflow/creditfraud@3?repository_url=https://adb-5245952564735461.0.azuredatabricks.net/api/2.0/mlflow',
	'mlflow|validate|pkg:mlflow/creditfraud@3?repository_url=https://westus2.api.azureml.ms/mlflow/v1.0/subscriptions/a50f2011-fab8-4164-af23-c62881ef8c95/resourceGroups/TestResourceGroup/providers/Microsoft.MachineLearningServices/workspaces/TestWorkspace',
	'mlflow|validate|pkg:mlflow/trafficsigns@10?model_uuid=36233173b22f4c89b451f1228d700d49&repository_url=https://adb-5245952564735461.0.azuredatabricks.net/api/2.0/mlflow&run_id=410a3121-2709-4f88-98dd-dba0ef056b0a',
	'mlflow|validate|pkg:mlflow/trafficsigns@10?model_uuid=36233173b22f4c89b451f1228d700d49&run_id=410a3121-2709-4f88-98dd-dba0ef056b0a&repository_url=https://adb-5245952564735461.0.azuredatabricks.net/api/2.0/mlflow',
	'npm|build|{"type":"npm","namespace":null,"name":"mypackage","version":"12.4.5","qualifiers":{"vcs_url":"git://host.com/path/to/repo.git@4345abcd34343"},"subpath":null}',
	'npm|parse|pkg:npm/%40babel/core#/googleapis/api/annotations/',
	'npm|parse|pkg:npm/@babel/core#/googleapis/api/annotations/',
	'npm|validate|pkg:npm/@babel/core#/googleapis/api/annotations/',
	'npm|validate|pkg:npm/mypackage@12.4.5?vcs_url=git://host.com/path/to/repo.git%404345abcd34343',
	'oci|build|{"type":"oci","namespace":null,"name":"debian","version":"sha256:244fd47e07d10","qualifiers":{"arch":"amd64","repository_url":"docker.io/library/debian","tag":"latest"},"subpath":null}',
	'oci|build|{"type":"oci","namespace":null,"name":"debian","version":"sha256:244fd47e07d10","qualifiers":{"repository_url":"ghcr.io/debian","tag":"bullseye"},"subpath":null}',
	'oci|build|{"type":"oci","namespace":null,"name":"static","version":"sha256:244fd47e07d10","qualifiers":{"repository_url":"gcr.io/distroless/static","tag":"latest"},"subpath":null}',
	'oci|validate|pkg:oci/debian@sha256%3A244fd47e07d10?repository_url=docker.io/library/debian&arch=amd64&tag=latest',
	'oci|validate|pkg:oci/debian@sha256%3A244fd47e07d10?repository_url=ghcr.io/debian&tag=bullseye',
	'oci|validate|pkg:oci/static@sha256%3A244fd47e07d10?repository_url=gcr.io/distroless/static&tag=latest',
	'otp|build|{"type":"otp","namespace":"namespace","name":"hex","version":"2.1.1","qualifiers":null,"subpath":null}',
	'otp|build|{"type":"otp","namespace":null,"name":"asn1","version":"5.4.1","qualifiers":{"platform":"linux","arch":"amd64","repository_url":"https://github.com/erlang/otp","vcs_url":"git+https://github.com/erlang/otp.git"},"subpath":"src/asn1ct.erl"}',
	'otp|parse|pkg:otp/namespace/hex@2.1.1',
	'otp|validate|pkg:otp/asn1@5.4.1?arch=amd64&platform=linux&repository_url=https://github.com/erlang/otp&vcs_url=git%2Bhttps://github.com/erlang/otp.git#src/asn1ct.erl',
	'pypi|parse|pkg:PYPI/Django_package@1.11.1.dev1',
	'pypi|validate|pkg:PYPI/Django_package@1.11.1.dev1',
	'rpm|parse|pkg:Rpm/fedora/curl@7.50.3-1.fc25?Arch=i386&Distro=fedora-25',
	'specification|build|{"type":"generic","namespace":null,"name":"openssl","version":"1.1.10g","qualifiers":{"checksum":"sha1:ad9503c3e994a4f,sha256:41bf9088b3a1e6c1ef1d"},"subpath":null}',
	'specification|build|{"type":"npm","namespace":null,"name":"myartifact","version":"1.0.0","qualifiers":{"in production":"true"},"subpath":null}',
	'specification|parse|pkg:npm/myartifact@1.0.0?in%20production=true',
	'specification|validate|pkg:generic/bitwarderl?checksum=sha1:ad9503c3e994a4f%2Csha256:41bf9088b3a1e6c1ef1d',
	'swid|build|{"type":"swid","namespace":"Acme/example.com","name":"Enterprise+Server","version":"1.0.0","qualifiers":{"tag_id":"75b8c285-fa7b-485b-b199-4745e3004d0d"},"subpath":null}',
	'swid|build|{"type":"swid","namespace":"Adobe+Systems+Incorporated","name":"Adobe+InDesign","version":"CC","qualifiers":{"tag_id":"CreativeCloud-CS6-Win-GM-MUL"},"subpath":null}',
	'swid|validate|pkg:swid/Acme/example.com/Enterprise+Server@1.0.0?tag_id=75b8c285-fa7b-485b-b199-4745e3004d0d',
	'swid|validate|pkg:swid/Adobe+Systems+Incorporated/Adobe+InDesign@CC?tag_id=CreativeCloud-CS6-Win-GM-MUL',
	'swift|build|{"type":"swift","namespace":null,"name":"Alamofire","version":"5.4.3","qualifiers":null,"subpath":null}',
	'swift|parse|pkg:swift/Alamofire@5.4.3',
	'vcpkg|build|{"type":"vcpkg","namespace":"boost","name":"asio","version":"1.84.0","qualifiers":null,"subpath":null}',
	'vcpkg|build|{"type":"vcpkg","namespace":null,"name":"zlib","version":"1.3.1","qualifiers":{"vcs_url":"git+https://github.com/microsoft/vcpkg@b5d3197b1a8a3f4c2d9e0f1a2b3c4d5e6f708192","triplet":"x64-linux"},"subpath":null}',
	'vcpkg|parse|pkg:vcpkg/boost/asio@1.84.0',
	'vcpkg|validate|pkg:vcpkg/zlib@1.3.1?triplet=x64-linux&vcs_url=git%2Bhttps:%2F%2Fgithub.com%2Fmicrosoft%2Fvcpkg%40b5d3197b1a8a3f4c2d9e0f1a2b3c4d5e6f708192',
	'vscode-extension|build|{"type":"vscode-extension","namespace":null,"name":"java","version":"1.46.2025091308","qualifiers":null,"subpath":null}',
	'vscode-extension|parse|pkg:vscode-extension/java@1.46.2025091308',
]);

/**
 * Load every case in the suite.
 * @returns {Record<string, any>[]} Test cases
 */
function loadCases() {
	const files = ['spec', 'types'].flatMap((dir) => readdirSync(join(TESTS_DIR, dir)).map((file) => join(TESTS_DIR, dir, file)));
	return files.flatMap((file) => {
		const name = basename(file, '-test.json');
		return JSON.parse(readFileSync(file, 'utf8')).tests.map((/** @type {object} */ testCase) => ({ file: name, ...testCase }));
	});
}

/**
 * Normalize components for comparison, since the suite spells absent components inconsistently.
 * @param {any} components - Components to normalize
 * @returns {string} Comparable JSON
 */
function normalizeComponents(components) {
	const quals = components.qualifiers;
	return JSON.stringify({
		name: components.name ?? null,
		namespace: components.namespace ?? null,
		qualifiers: quals && Object.keys(quals).length > 0
			? Object.fromEntries(Object.entries(quals).toSorted())
			: null,
		subpath: components.subpath ?? null,
		type: components.type ?? null,
		version: components.version ?? null,
	});
}

/**
 * Run a single suite case.
 * @param {any} testCase - Suite case
 * @returns {{ actual: string, ok: boolean }} What the implementation produced, and whether it matched
 */
export function runCase(testCase) {
	try {
		const purl = new PURL(testCase.input);
		if (testCase.expected_failure) {
			return { actual: `${purl}`, ok: false };
		}
		if (testCase.test_type === 'parse') {
			const actual = normalizeComponents(purl);
			return { actual, ok: actual === normalizeComponents(testCase.expected_output) };
		}
		const actual = `${purl}`;
		return { actual, ok: actual === testCase.expected_output };
	} catch (e) {
		// invalid input is rejected with a TypeError; anything else is a bug, not a rejection
		return {
			actual: `rejected: ${e instanceof Error ? e.message : e}`,
			ok: !!testCase.expected_failure && e instanceof TypeError,
		};
	}
}

/**
 * The key a case is listed under in `KNOWN_DEVIATIONS`.
 * @param {any} testCase - Suite case
 * @returns {string} Key
 */
export function caseKey(testCase) {
	return `${testCase.file}|${testCase.test_type}|${typeof testCase.input === 'string' ? testCase.input : JSON.stringify(testCase.input)}`;
}

export { KNOWN_DEVIATIONS, loadCases, TESTS_DIR };

test('canonical PURL test suite', { skip: !existsSync(TESTS_DIR) && 'vendor/package-url/purl-spec submodule is not initialized' }, (t) => {
	const cases = loadCases();
	t.ok(cases.length > 0, `loaded ${cases.length} cases`);

	const deviated = new Set();
	for (const testCase of cases) {
		const key = caseKey(testCase);
		const { actual, ok } = runCase(testCase);
		const label = `[${testCase.file}/${testCase.test_type}] ${testCase.description}: ${key.split('|')[2]} -> ${actual}`;

		if (KNOWN_DEVIATIONS.has(key)) {
			deviated.add(key);
			t.notOk(ok, `known deviation, still deviating: ${label}`);
		} else {
			t.ok(ok, label);
		}
	}

	t.deepEqual([...KNOWN_DEVIATIONS].filter((key) => !deviated.has(key)), [], 'every known deviation corresponds to a case in the suite');

	t.end();
});
