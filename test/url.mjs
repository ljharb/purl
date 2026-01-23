import test from 'tape';

import PURL from '../purl.mjs';
import url, { supportedUrlTypes } from '../url.mjs';

test('url function - npm', (t) => {
	t.equal(url('pkg:npm/lodash'), 'https://www.npmjs.com/package/lodash', 'npm package URL');
	t.equal(url('pkg:npm/lodash@4.17.21'), 'https://www.npmjs.com/package/lodash/v/4.17.21', 'npm package with version');
	t.equal(url('pkg:npm/%40babel/core'), 'https://www.npmjs.com/package/@babel/core', 'scoped npm package');
	t.equal(url('pkg:npm/%40babel/core@7.0.0'), 'https://www.npmjs.com/package/@babel/core/v/7.0.0', 'scoped npm package with version');
	t.end();
});

test('url function - pypi', (t) => {
	t.equal(url('pkg:pypi/requests'), 'https://pypi.org/project/requests/', 'pypi package URL');
	t.equal(url('pkg:pypi/requests@2.28.0'), 'https://pypi.org/project/requests/2.28.0/', 'pypi package with version');
	t.end();
});

test('url function - gem', (t) => {
	t.equal(url('pkg:gem/rails'), 'https://rubygems.org/gems/rails', 'gem package URL');
	t.equal(url('pkg:gem/rails@7.0.0'), 'https://rubygems.org/gems/rails/versions/7.0.0', 'gem package with version');
	t.end();
});

test('url function - cargo (no version URL in spec)', (t) => {
	t.equal(url('pkg:cargo/serde'), 'https://crates.io/crates/serde', 'cargo package URL');
	// purl-types.json doesn't have uri_template_with_version for cargo
	t.equal(url('pkg:cargo/serde@1.0.0'), 'https://crates.io/crates/serde', 'cargo package with version (no version URL)');
	t.end();
});

test('url function - nuget', (t) => {
	t.equal(url('pkg:nuget/Newtonsoft.Json'), 'https://www.nuget.org/packages/Newtonsoft.Json', 'nuget package URL');
	t.equal(url('pkg:nuget/Newtonsoft.Json@13.0.1'), 'https://www.nuget.org/packages/Newtonsoft.Json/13.0.1', 'nuget package with version');
	t.end();
});

test('url function - hex (no version URL in spec)', (t) => {
	t.equal(url('pkg:hex/phoenix'), 'https://hex.pm/packages/phoenix', 'hex package URL');
	// purl-types.json doesn't have uri_template_with_version for hex
	t.equal(url('pkg:hex/phoenix@1.6.0'), 'https://hex.pm/packages/phoenix', 'hex package with version (no version URL)');
	t.end();
});

test('url function - golang (special handler)', (t) => {
	t.equal(url('pkg:golang/golang.org%2Fx/text'), 'https://pkg.go.dev/golang.org/x/text', 'golang package URL');
	t.equal(url('pkg:golang/golang.org%2Fx/text@v0.3.7'), 'https://pkg.go.dev/golang.org/x/text@v0.3.7', 'golang package with version');
	const purlNoNs = new PURL({ name: 'text', type: 'golang' });
	t.equal(url(purlNoNs), 'https://pkg.go.dev/text', 'golang package without namespace');
	t.end();
});

test('url function - maven (special handler)', (t) => {
	t.equal(url('pkg:maven/org.apache/commons-lang3'), 'https://search.maven.org/artifact/org.apache/commons-lang3', 'maven package URL');
	t.equal(url('pkg:maven/org.apache/commons-lang3@3.12.0'), 'https://search.maven.org/artifact/org.apache/commons-lang3/3.12.0/jar', 'maven package with version');
	t.equal(url('pkg:maven/org.apache/commons-lang3@3.12.0?type=pom'), 'https://search.maven.org/artifact/org.apache/commons-lang3/3.12.0/pom', 'maven package with custom type');
	const purlNoNs = new PURL({ name: 'artifact', type: 'maven' });
	t.equal(url(purlNoNs), 'https://search.maven.org/artifact//artifact', 'maven package without namespace');
	t.end();
});

test('url function - composer', (t) => {
	t.equal(url('pkg:composer/laravel/framework'), 'https://packagist.org/packages/laravel/framework', 'composer package URL');
	const purlNoNs = new PURL({ name: 'framework', type: 'composer' });
	t.equal(url(purlNoNs), 'https://packagist.org/packages//framework', 'composer package without namespace');
	t.end();
});

test('url function - cocoapods (no version URL in spec)', (t) => {
	t.equal(url('pkg:cocoapods/AFNetworking'), 'https://cocoapods.org/pods/AFNetworking', 'cocoapods package URL');
	// purl-types.json doesn't have uri_template_with_version for cocoapods
	t.equal(url('pkg:cocoapods/AFNetworking@4.0.0'), 'https://cocoapods.org/pods/AFNetworking', 'cocoapods with version (no version URL)');
	t.end();
});

test('url function - pub (no version URL in spec)', (t) => {
	t.equal(url('pkg:pub/flutter'), 'https://pub.dev/packages/flutter', 'pub package URL');
	// purl-types.json doesn't have uri_template_with_version for pub
	t.equal(url('pkg:pub/flutter@2.0.0'), 'https://pub.dev/packages/flutter', 'pub with version (no version URL)');
	t.end();
});

test('url function - hackage', (t) => {
	t.equal(url('pkg:hackage/aeson'), 'https://hackage.haskell.org/package/aeson', 'hackage package URL');
	t.equal(url('pkg:hackage/aeson@2.0.0'), 'https://hackage.haskell.org/package/aeson-2.0.0', 'hackage package with version');
	t.end();
});

test('url function - swift (special handler)', (t) => {
	t.equal(url('pkg:swift/github.com%2Fapple/swift-argument-parser'), 'https://github.com/github.com/apple/swift-argument-parser', 'swift package URL');
	const purlWithoutNs = new PURL({ name: 'swift-argument-parser', type: 'swift' });
	t.equal(url(purlWithoutNs), null, 'swift package without namespace returns null');
	t.end();
});

test('url function - github (special handler)', (t) => {
	t.equal(url('pkg:github/lodash/lodash'), 'https://github.com/lodash/lodash', 'github package URL');
	t.equal(url('pkg:github/lodash/lodash@4.17.21'), 'https://github.com/lodash/lodash/tree/4.17.21', 'github package with version');
	const purlNoNs = new PURL({ name: 'lodash', type: 'github' });
	t.equal(url(purlNoNs), 'https://github.com//lodash', 'github package without namespace');
	t.end();
});

test('url function - bitbucket (special handler)', (t) => {
	t.equal(url('pkg:bitbucket/atlassian/aui'), 'https://bitbucket.org/atlassian/aui', 'bitbucket package URL');
	t.equal(url('pkg:bitbucket/atlassian/aui@8.0.0'), 'https://bitbucket.org/atlassian/aui/src/8.0.0', 'bitbucket package with version');
	const purlNoNs = new PURL({ name: 'aui', type: 'bitbucket' });
	t.equal(url(purlNoNs), 'https://bitbucket.org//aui', 'bitbucket package without namespace');
	t.end();
});

test('url function - docker (special handler)', (t) => {
	t.equal(url('pkg:docker/library/nginx'), 'https://hub.docker.com/_/nginx', 'docker official image URL');
	t.equal(url('pkg:docker/library/nginx@1.21'), 'https://hub.docker.com/_/nginx?tab=tags&name=1.21', 'docker official image with version');
	const purlWithoutNs = new PURL({ name: 'nginx', type: 'docker' });
	t.equal(url(purlWithoutNs), 'https://hub.docker.com/_/nginx', 'docker image without namespace');
	const purlUserImage = new PURL({ name: 'myapp', namespace: 'myuser', type: 'docker' });
	t.equal(url(purlUserImage), 'https://hub.docker.com/r/myuser/myapp', 'docker user image URL');
	const purlUserImgVer = new PURL({ name: 'myapp', namespace: 'myuser', type: 'docker', version: 'latest' });
	t.equal(url(purlUserImgVer), 'https://hub.docker.com/r/myuser/myapp?tab=tags&name=latest', 'docker user image with version');
	t.end();
});

test('url function - chrome', (t) => {
	t.equal(url('pkg:chrome/cjpalhdlnbpafiamejdnhcphjbkeiagm'), 'https://chromewebstore.google.com/detail/cjpalhdlnbpafiamejdnhcphjbkeiagm', 'chrome extension URL');
	// Chrome Web Store doesn't support version in URL
	t.equal(url('pkg:chrome/cjpalhdlnbpafiamejdnhcphjbkeiagm@1.0.0'), 'https://chromewebstore.google.com/detail/cjpalhdlnbpafiamejdnhcphjbkeiagm', 'chrome extension with version (no version URL)');
	t.end();
});

test('url function - vscode', (t) => {
	t.equal(url('pkg:vscode/ms-python/python'), 'https://marketplace.visualstudio.com/items?itemName=ms-python.python', 'vscode extension URL');
	t.equal(url('pkg:vscode/esbenp/prettier-vscode@10.1.0'), 'https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode', 'vscode extension with version (no version URL)');
	const purlNoNs = new PURL({ name: 'python', type: 'vscode' });
	// vscode namespace is required, but URL generation should still work
	t.equal(url(purlNoNs), 'https://marketplace.visualstudio.com/items?itemName=.python', 'vscode extension without namespace');
	t.end();
});

test('url function - additional registry_config types', (t) => {
	// bioconductor
	t.equal(url('pkg:bioconductor/GenomicRanges'), 'https://bioconductor.org/packages/GenomicRanges', 'bioconductor package URL');

	// clojars
	t.equal(url('pkg:clojars/ring/ring'), 'https://clojars.org/ring/ring', 'clojars package URL');
	const clojarsNoNs = new PURL({ name: 'ring', type: 'clojars' });
	// clojars has uri_template_no_namespace: https://clojars.org/{name}
	t.equal(url(clojarsNoNs), 'https://clojars.org/ring', 'clojars without namespace');

	// conan
	t.equal(url('pkg:conan/openssl'), 'https://conan.io/center/recipes/openssl', 'conan package URL');

	// conda - template hardcodes conda-forge, doesn't use PURL namespace
	t.equal(url('pkg:conda/anaconda/numpy'), 'https://anaconda.org/conda-forge/numpy', 'conda package URL');
	const condaNoNs = new PURL({ name: 'numpy', type: 'conda' });
	t.equal(url(condaNoNs), 'https://anaconda.org/conda-forge/numpy', 'conda without namespace');

	// cpan - uses /dist/ not /pod/
	t.equal(url('pkg:cpan/Moose'), 'https://metacpan.org/dist/Moose', 'cpan package URL');

	// deno
	t.equal(url('pkg:deno/std'), 'https://deno.land/x/std', 'deno package URL');

	// elm
	t.equal(url('pkg:elm/elm/core'), 'https://package.elm-lang.org/packages/elm/core/latest', 'elm package URL');
	const elmNoNs = new PURL({ name: 'core', type: 'elm' });
	t.equal(url(elmNoNs), 'https://package.elm-lang.org/packages//core/latest', 'elm without namespace');

	// homebrew
	t.equal(url('pkg:homebrew/wget'), 'https://formulae.brew.sh/formula/wget', 'homebrew package URL');

	// huggingface
	t.equal(url('pkg:huggingface/bert-base'), 'https://huggingface.co/bert-base', 'huggingface package URL');

	// luarocks
	t.equal(url('pkg:luarocks/luasocket'), 'https://luarocks.org/modules/luasocket', 'luarocks package URL');

	t.end();
});

test('url function - unknown type', (t) => {
	const purl = new PURL({ name: 'foo', type: 'unknown' });
	t.equal(url(purl), null, 'unknown type returns null');
	t.end();
});

test('url function - types without registry_config', (t) => {
	// deb, rpm, etc don't have registry_config
	const debPurl = new PURL({ name: 'curl', type: 'deb' });
	t.equal(url(debPurl), null, 'deb type returns null (no registry_config)');

	const rpmPurl = new PURL({ name: 'curl', type: 'rpm' });
	t.equal(url(rpmPurl), null, 'rpm type returns null (no registry_config)');

	t.end();
});

test('url function - accepts PURL instance', (t) => {
	const purl = new PURL('pkg:npm/lodash');
	t.equal(url(purl), 'https://www.npmjs.com/package/lodash', 'accepts PURL instance');
	t.end();
});

test('supportedUrlTypes', (t) => {
	t.ok(Array.isArray(supportedUrlTypes), 'is an array');
	t.ok(supportedUrlTypes.length > 0, 'has entries');

	// Check some expected types
	t.ok(supportedUrlTypes.includes('npm'), 'includes npm');
	t.ok(supportedUrlTypes.includes('pypi'), 'includes pypi');
	t.ok(supportedUrlTypes.includes('cargo'), 'includes cargo');
	t.ok(supportedUrlTypes.includes('gem'), 'includes gem');
	t.ok(supportedUrlTypes.includes('maven'), 'includes maven');
	t.ok(supportedUrlTypes.includes('golang'), 'includes golang');
	t.ok(supportedUrlTypes.includes('docker'), 'includes docker');
	t.ok(supportedUrlTypes.includes('github'), 'includes github');
	t.ok(supportedUrlTypes.includes('bitbucket'), 'includes bitbucket');
	t.ok(supportedUrlTypes.includes('swift'), 'includes swift');

	// Verify all supported types return a URL for basic input
	for (const type of supportedUrlTypes) {
		const purl = new PURL({ name: 'test', namespace: 'test', type });
		const result = url(purl);
		// Most should return a string, swift returns null without namespace
		if (type === 'swift') {
			// swift with namespace should work
			const swiftPurl = new PURL({ name: 'test', namespace: 'ns', type: 'swift' });
			t.equal(typeof url(swiftPurl), 'string', `${type} with namespace returns string`);
		} else {
			t.equal(typeof result, 'string', `${type} returns string URL`);
		}
	}

	t.end();
});
