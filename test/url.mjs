import test from 'tape';

import PURL from '../purl.mjs';
import url from '../url.mjs';

test('url function', (t) => {
	t.test('npm package', (st) => {
		st.equal(url('pkg:npm/lodash'), 'https://www.npmjs.com/package/lodash', 'npm package URL');
		st.equal(url('pkg:npm/lodash@4.17.21'), 'https://www.npmjs.com/package/lodash/v/4.17.21', 'npm package with version');
		st.equal(url('pkg:npm/%40babel/core'), 'https://www.npmjs.com/package/@babel/core', 'scoped npm package');
		st.equal(url('pkg:npm/%40babel/core@7.0.0'), 'https://www.npmjs.com/package/@babel/core/v/7.0.0', 'scoped npm package with version');
		st.end();
	});

	t.test('pypi package', (st) => {
		st.equal(url('pkg:pypi/requests'), 'https://pypi.org/project/requests/', 'pypi package URL');
		st.equal(url('pkg:pypi/requests@2.28.0'), 'https://pypi.org/project/requests/2.28.0/', 'pypi package with version');
		st.end();
	});

	t.test('gem package', (st) => {
		st.equal(url('pkg:gem/rails'), 'https://rubygems.org/gems/rails', 'gem package URL');
		st.equal(url('pkg:gem/rails@7.0.0'), 'https://rubygems.org/gems/rails/versions/7.0.0', 'gem package with version');
		st.end();
	});

	t.test('cargo package', (st) => {
		st.equal(url('pkg:cargo/serde'), 'https://crates.io/crates/serde', 'cargo package URL');
		st.equal(url('pkg:cargo/serde@1.0.0'), 'https://crates.io/crates/serde/1.0.0', 'cargo package with version');
		st.end();
	});

	t.test('nuget package', (st) => {
		st.equal(url('pkg:nuget/Newtonsoft.Json'), 'https://www.nuget.org/packages/Newtonsoft.Json', 'nuget package URL');
		st.equal(url('pkg:nuget/Newtonsoft.Json@13.0.1'), 'https://www.nuget.org/packages/Newtonsoft.Json/13.0.1', 'nuget package with version');
		st.end();
	});

	t.test('hex package', (st) => {
		st.equal(url('pkg:hex/phoenix'), 'https://hex.pm/packages/phoenix', 'hex package URL');
		st.equal(url('pkg:hex/phoenix@1.6.0'), 'https://hex.pm/packages/phoenix/1.6.0', 'hex package with version');
		st.end();
	});

	t.test('golang package', (st) => {
		st.equal(url('pkg:golang/golang.org%2Fx/text'), 'https://pkg.go.dev/golang.org/x/text', 'golang package URL');
		st.equal(url('pkg:golang/golang.org%2Fx/text@v0.3.7'), 'https://pkg.go.dev/golang.org/x/text@v0.3.7', 'golang package with version');
		const purlNoNs = new PURL({ name: 'text', type: 'golang' });
		st.equal(url(purlNoNs), 'https://pkg.go.dev/text', 'golang package without namespace');
		st.end();
	});

	t.test('maven package', (st) => {
		st.equal(url('pkg:maven/org.apache/commons-lang3'), 'https://search.maven.org/artifact/org.apache/commons-lang3', 'maven package URL');
		st.equal(url('pkg:maven/org.apache/commons-lang3@3.12.0'), 'https://search.maven.org/artifact/org.apache/commons-lang3/3.12.0/jar', 'maven package with version');
		st.equal(url('pkg:maven/org.apache/commons-lang3@3.12.0?type=pom'), 'https://search.maven.org/artifact/org.apache/commons-lang3/3.12.0/pom', 'maven package with custom type');
		const purlNoNs = new PURL({ name: 'artifact', type: 'maven' });
		st.equal(url(purlNoNs), 'https://search.maven.org/artifact//artifact', 'maven package without namespace');
		st.end();
	});

	t.test('composer package', (st) => {
		st.equal(url('pkg:composer/laravel/framework'), 'https://packagist.org/packages/laravel/framework', 'composer package URL');
		const purlNoNs = new PURL({ name: 'framework', type: 'composer' });
		st.equal(url(purlNoNs), 'https://packagist.org/packages//framework', 'composer package without namespace');
		st.end();
	});

	t.test('cocoapods package', (st) => {
		st.equal(url('pkg:cocoapods/AFNetworking'), 'https://cocoapods.org/pods/AFNetworking', 'cocoapods package URL');
		st.end();
	});

	t.test('pub package', (st) => {
		st.equal(url('pkg:pub/flutter'), 'https://pub.dev/packages/flutter', 'pub package URL');
		st.equal(url('pkg:pub/flutter@2.0.0'), 'https://pub.dev/packages/flutter/versions/2.0.0', 'pub package with version');
		st.end();
	});

	t.test('hackage package', (st) => {
		st.equal(url('pkg:hackage/aeson'), 'https://hackage.haskell.org/package/aeson', 'hackage package URL');
		st.equal(url('pkg:hackage/aeson@2.0.0'), 'https://hackage.haskell.org/package/aeson-2.0.0', 'hackage package with version');
		st.end();
	});

	t.test('swift package', (st) => {
		st.equal(url('pkg:swift/github.com%2Fapple/swift-argument-parser'), 'https://github.com/github.com/apple/swift-argument-parser', 'swift package URL');
		const purlWithoutNs = new PURL({ name: 'swift-argument-parser', type: 'swift' });
		st.equal(url(purlWithoutNs), null, 'swift package without namespace returns null');
		st.end();
	});

	t.test('github package', (st) => {
		st.equal(url('pkg:github/lodash/lodash'), 'https://github.com/lodash/lodash', 'github package URL');
		st.equal(url('pkg:github/lodash/lodash@4.17.21'), 'https://github.com/lodash/lodash/tree/4.17.21', 'github package with version');
		const purlNoNs = new PURL({ name: 'lodash', type: 'github' });
		st.equal(url(purlNoNs), 'https://github.com//lodash', 'github package without namespace');
		st.end();
	});

	t.test('bitbucket package', (st) => {
		st.equal(url('pkg:bitbucket/atlassian/aui'), 'https://bitbucket.org/atlassian/aui', 'bitbucket package URL');
		st.equal(url('pkg:bitbucket/atlassian/aui@8.0.0'), 'https://bitbucket.org/atlassian/aui/src/8.0.0', 'bitbucket package with version');
		const purlNoNs = new PURL({ name: 'aui', type: 'bitbucket' });
		st.equal(url(purlNoNs), 'https://bitbucket.org//aui', 'bitbucket package without namespace');
		st.end();
	});

	t.test('docker package', (st) => {
		st.equal(url('pkg:docker/library/nginx'), 'https://hub.docker.com/_/nginx', 'docker official image URL');
		st.equal(url('pkg:docker/library/nginx@1.21'), 'https://hub.docker.com/_/nginx?tab=tags&name=1.21', 'docker official image with version');
		const purlWithoutNs = new PURL({ name: 'nginx', type: 'docker' });
		st.equal(url(purlWithoutNs), 'https://hub.docker.com/_/nginx', 'docker image without namespace');
		const purlUserImage = new PURL({ name: 'myapp', namespace: 'myuser', type: 'docker' });
		st.equal(url(purlUserImage), 'https://hub.docker.com/r/myuser/myapp', 'docker user image URL');
		const purlUserImgVer = new PURL({ name: 'myapp', namespace: 'myuser', type: 'docker', version: 'latest' });
		st.equal(url(purlUserImgVer), 'https://hub.docker.com/r/myuser/myapp?tab=tags&name=latest', 'docker user image with version');
		st.end();
	});

	t.test('unknown type', (st) => {
		const purl = new PURL({ name: 'foo', type: 'unknown' });
		st.equal(url(purl), null, 'unknown type returns null');
		st.end();
	});

	t.test('accepts PURL instance', (st) => {
		const purl = new PURL('pkg:npm/lodash');
		st.equal(url(purl), 'https://www.npmjs.com/package/lodash', 'accepts PURL instance');
		st.end();
	});

	t.end();
});
