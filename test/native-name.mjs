import test from 'tape';

import PURL from '../purl.mjs';
import nativeName from '../native-name.mjs';
import { nativeName as indexNativeName } from '../index.mjs';
import { knownTypes } from '../types.mjs';

/** @type {Record<string, [string, string | null | typeof TypeError][]>} */
const cases = {
	alpm: [
		['pkg:alpm/arch/pacman@6.0.1-1?arch=x86_64', 'pacman'],
		['pkg:alpm/arch/containers-common@1:0.47.4-4?arch=x86_64', 'containers-common'],
		['pkg:alpm/pacman', TypeError],
	],
	apk: [
		['pkg:apk/alpine/curl@7.83.0-r0?arch=x86', 'curl'],
		['pkg:apk/openwrt/luci', 'luci'],
		['pkg:apk/curl', TypeError],
	],
	bioconductor: [
		['pkg:bioconductor/IRanges@2.28.0', 'IRanges'],
		['pkg:bioconductor/bioc/IRanges', null],
	],
	bitbucket: [
		['pkg:bitbucket/birkenfeld/pygments-main@2.13.0', 'birkenfeld/pygments-main'],
		['pkg:bitbucket/pygments-main', TypeError],
		['pkg:bitbucket/a/b/c', TypeError],
		['pkg:bitbucket/a/b%2Fc', TypeError],
	],
	bitnami: [
		['pkg:bitnami/wordpress@6.2.0?distro=debian-12', 'wordpress'],
		['pkg:bitnami/bitnami/wordpress', TypeError],
	],
	cargo: [
		['pkg:cargo/rand@0.7.2', 'rand'],
		['pkg:cargo/serde_json', 'serde_json'],
		['pkg:cargo/foo/rand', TypeError],
	],
	'chrome-extension': [
		['pkg:chrome-extension/nkbihfbeogaeaoehlefnkodbefgpgknn@11.16.16', 'nkbihfbeogaeaoehlefnkodbefgpgknn'],
		['pkg:chrome-extension/google/cjpalhdlnbpafiamejdnhcphjbkeiagm', TypeError],
	],
	clojars: [
		['pkg:clojars/org.clojure/clojure@1.11.1', 'org.clojure/clojure'],
		['pkg:clojars/ring/ring-core@1.9.5', 'ring/ring-core'],
		['pkg:clojars/ring', 'ring'],
		['pkg:clojars/a/b/c', TypeError],
	],
	cocoapods: [
		['pkg:cocoapods/AFNetworking@4.0.1', 'AFNetworking'],
		['pkg:cocoapods/ShareKit@2.0#Twitter', 'ShareKit'],
		['pkg:cocoapods/someone/Alamofire', TypeError],
	],
	composer: [
		['pkg:composer/symfony/console@6.1.7', 'symfony/console'],
		['pkg:composer/console', TypeError],
		['pkg:composer/a/b/c', TypeError],
	],
	conan: [
		['pkg:conan/openssl@3.0.3', 'openssl'],
		['pkg:conan/openssl.org/openssl@3.0.3?user=bincrafters&channel=stable', 'openssl'],
	],
	conda: [
		['pkg:conda/absl-py@0.4.1?build=py36h06a4308_0&channel=main&subdir=linux-64&type=tar.bz2', 'absl-py'],
		['pkg:conda/conda-forge/numpy', TypeError],
	],
	cpan: [
		['pkg:cpan/GDT/URI-PackageURL@2.22', 'URI-PackageURL'],
		['pkg:cpan/OALDERS/libwww-perl@6.76', 'libwww-perl'],
		['pkg:cpan/Moose@2.2014', TypeError],
		['pkg:cpan/GDT/URI::PackageURL', TypeError],
	],
	cran: [
		['pkg:cran/ggplot2@3.4.0', 'ggplot2'],
		['pkg:cran/data.table', 'data.table'],
		['pkg:cran/foo/ggplot2', TypeError],
	],
	deb: [
		['pkg:deb/debian/curl@7.50.3-1?arch=i386&distro=jessie', 'curl'],
		['pkg:deb/ubuntu/dpkg@1.19.0.4?arch=amd64', 'dpkg'],
		['pkg:deb/curl', TypeError],
	],
	deno: [
		['pkg:deno/std@0.177.0#http/server', 'std'],
		['pkg:deno/%40std/path', null],
	],
	docker: [
		['pkg:docker/cassandra@latest', 'cassandra'],
		['pkg:docker/library/nginx@1.21.6', 'library/nginx'],
		['pkg:docker/smartentry/debian@dc437cc87d10', 'smartentry/debian'],
		['pkg:docker/gcr.io/distroless/static@latest', 'gcr.io/distroless/static'],
	],
	elm: [
		['pkg:elm/elm/http@2.0.0', 'elm/http'],
		['pkg:elm/elm-community/json-extra@4.3.0', 'elm-community/json-extra'],
		['pkg:elm/http', TypeError],
		['pkg:elm/a/b/c', TypeError],
	],
	gem: [
		['pkg:gem/rails@7.0.4', 'rails'],
		['pkg:gem/a/b', TypeError],
	],
	generic: [
		['pkg:generic/openssl@1.1.10g', null],
		['pkg:generic/acme/widget@1.0', null],
	],
	git: [
		['pkg:git/gitlab.gnome.org/GNOME/adwaita-fonts', null],
		['pkg:git/projects.blender.org/blender/blender.git', null],
		['pkg:git/blender.git', TypeError],
	],
	github: [
		['pkg:github/torvalds/linux@6.1', 'torvalds/linux'],
		['pkg:github/linux', TypeError],
		['pkg:github/a/b/c', TypeError],
		['pkg:github/a/b%2Fc', TypeError],
	],
	golang: [
		['pkg:golang/github.com/gorilla/context@234fd47e07d1004f0aed9c', 'github.com/gorilla/context'],
		['pkg:golang/github.com%2Fgorilla/mux@1.8.0', 'github.com/gorilla/mux'],
		['pkg:golang/google.golang.org/genproto#googleapis/api/annotations', 'google.golang.org/genproto'],
		['pkg:golang/fmt', TypeError],
	],
	hackage: [
		['pkg:hackage/AC-HalfInteger@1.2.1', 'AC-HalfInteger'],
		['pkg:hackage/foo/aeson', TypeError],
	],
	hex: [
		['pkg:hex/jason@1.1.2', 'jason'],
		['pkg:hex/acme/foo@2.3.0', 'foo'],
	],
	homebrew: [
		['pkg:homebrew/wget@1.21.3', 'wget'],
		['pkg:homebrew/homebrew/cask/firefox', null],
	],
	huggingface: [
		['pkg:huggingface/microsoft/deberta-v3-base@559062ad13d311b87b2c455e67dcd5f1c8f65111', 'microsoft/deberta-v3-base'],
		['pkg:huggingface/distilbert-base-uncased@043235d6088ecd3dd5fb5ca3592b6913fd516027', TypeError],
	],
	luarocks: [
		['pkg:luarocks/luasocket@3.1.0-1', 'luasocket'],
		['pkg:luarocks/hisham/luafilesystem@1.8.0-1', 'hisham/luafilesystem'],
	],
	maven: [
		['pkg:maven/org.apache.commons/commons-lang3@3.12.0', 'org.apache.commons:commons-lang3'],
		['pkg:maven/junit/junit@4.13.2?type=jar', 'junit:junit'],
		['pkg:maven/commons-lang3', TypeError],
		['pkg:maven/org/apache/commons-lang3', TypeError],
	],
	mlflow: [
		['pkg:mlflow/trafficsigns@10?model_uuid=36233173b22f4c89b451f1228d700d49&run_id=410a3121-2709-4f88-98dd-dba0ef056b0a', 'trafficsigns'],
		['pkg:mlflow/someteam/creditfraud@3', TypeError],
	],
	npm: [
		['pkg:npm/lodash@4.17.21', 'lodash'],
		['pkg:npm/%40babel/core@7.20.0', '@babel/core'],
		['pkg:npm/Lodash', 'Lodash'],
		['pkg:npm/JSONStream@1.3.5', 'JSONStream'],
		['pkg:npm/babel/core', TypeError],
		['pkg:npm/%40a/%40b/c', TypeError],
		['pkg:npm/%40/core', TypeError],
		['pkg:npm/.hidden', TypeError],
		['pkg:npm/has%20space', TypeError],
	],
	nuget: [
		['pkg:nuget/Newtonsoft.Json@13.0.1', 'Newtonsoft.Json'],
		['pkg:nuget/Microsoft/AspNetCore', TypeError],
	],
	oci: [
		['pkg:oci/debian@sha256%3A244fd47e07d10?repository_url=docker.io/library/debian&arch=amd64&tag=latest', null],
		['pkg:oci/library/debian', TypeError],
	],
	pub: [
		['pkg:pub/flutter_bloc@8.1.0', 'flutter_bloc'],
		['pkg:pub/dart/http', TypeError],
	],
	pypi: [
		['pkg:pypi/django-allauth@12.23', 'django-allauth'],
		['pkg:pypi/Typing_Extensions', 'Typing_Extensions'],
		['pkg:pypi/foo/requests', TypeError],
	],
	qpkg: [
		['pkg:qpkg/blackberry/com.qnx.sdp@7.0.0.SGA201702151847', 'com.qnx.sdp'],
		['pkg:qpkg/com.qnx.sdp', TypeError],
	],
	rpm: [
		['pkg:rpm/fedora/centerim@4.22.10-1.el6?arch=i686&epoch=1&distro=fedora-25', 'centerim'],
		['pkg:rpm/opensuse/NetworkManager', 'NetworkManager'],
		['pkg:rpm/curl', TypeError],
	],
	swid: [
		['pkg:swid/Acme/example.com/Enterprise+Server@1.0.0?tag_id=75b8c285-fa7b-485b-b199-4745e3004d0d', null],
		['pkg:swid/Fedora@29?tag_id=org.fedoraproject.Fedora-29', null],
	],
	swift: [
		['pkg:swift/github.com/Alamofire/Alamofire@5.6.4', 'github.com/Alamofire/Alamofire'],
		['pkg:swift/github.com/apple/swift-package-manager@1.7.0', 'github.com/apple/swift-package-manager'],
		['pkg:swift/Alamofire', TypeError],
	],
	'vscode-extension': [
		['pkg:vscode-extension/ms-python/python@2024.0.1', 'ms-python.python'],
		['pkg:vscode-extension/golang/go@0.39.1?platform=win32-x64', 'golang.go'],
		['pkg:vscode-extension/python', TypeError],
		['pkg:vscode-extension/a/b/c', TypeError],
	],
};

test('nativeName', (t) => {
	t.equal(indexNativeName, nativeName, 'is exported from the root');

	t.test('every known type has cases', (st) => {
		st.deepEqual(Object.keys(cases).toSorted(), knownTypes, 'cases cover exactly the known types');
		st.end();
	});

	knownTypes.forEach((type) => {
		t.test(type, (st) => {
			cases[type].forEach(([purl, expected]) => {
				if (expected === TypeError) {
					st.throws(() => nativeName(purl), TypeError, `${purl} throws`);
				} else {
					st.equal(nativeName(purl), expected, `${purl} -> ${expected}`);
				}
			});
			st.end();
		});
	});

	t.test('accepts a PURL instance', (st) => {
		st.equal(nativeName(new PURL('pkg:npm/%40babel/core@7.0.0')), '@babel/core', 'from a string-constructed PURL');
		st.equal(
			nativeName(new PURL({
				name: 'commons-lang3',
				namespace: 'org.apache.commons',
				type: 'maven',
			})),
			'org.apache.commons:commons-lang3',
			'from a components-constructed PURL',
		);
		st.throws(() => nativeName(new PURL('pkg:npm/babel/core')), TypeError, 'a PURL instance that is invalid for its type throws');
		st.end();
	});

	t.test('ignores version, qualifiers, and subpath', (st) => {
		const expected = nativeName('pkg:npm/%40babel/core');
		st.equal(expected, '@babel/core', 'bare PURL');
		st.equal(nativeName('pkg:npm/%40babel/core@7.0.0'), expected, 'with version');
		st.equal(nativeName('pkg:npm/%40babel/core?vcs_url=git%2Bhttps://github.com/babel/babel'), expected, 'with qualifiers');
		st.equal(nativeName('pkg:npm/%40babel/core#lib/index.js'), expected, 'with subpath');
		st.equal(nativeName('pkg:npm/%40babel/core@7.0.0?a=b#lib/index.js'), expected, 'with all three');
		st.end();
	});

	t.test('treats an empty namespace as absent', (st) => {
		st.equal(nativeName('pkg:gem//rails'), 'rails', 'type that prohibits a namespace');
		st.throws(() => nativeName('pkg:maven//commons-lang3'), TypeError, 'type that requires a namespace');
		st.end();
	});

	t.test('returns null for an unknown type', (st) => {
		st.equal(nativeName('pkg:unknowntype/foo'), null, 'unknown type');
		st.equal(nativeName('pkg:julia/Example'), null, 'type with a purl-spec definition that purl does not know');
		st.end();
	});

	t.test('throws for an invalid PURL', (st) => {
		st.throws(() => nativeName('invalid'), TypeError, 'not a PURL');
		st.throws(() => nativeName(''), TypeError, 'empty string');
		st.throws(() => nativeName('pkg:'), TypeError, 'incomplete');
		st.throws(() => nativeName('pkg:npm/'), TypeError, 'missing name');
		st.end();
	});

	t.test('throws for a non-string, non-PURL argument', (st) => {
		// @ts-expect-error - testing invalid input
		st.throws(() => nativeName(undefined), TypeError, 'undefined');
		// @ts-expect-error - testing invalid input
		st.throws(() => nativeName(null), TypeError, 'null');
		// @ts-expect-error - testing invalid input
		st.throws(() => nativeName(42), TypeError, 'number');
		st.end();
	});

	t.end();
});
