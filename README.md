# purl <sup>[![Version Badge][npm-version-svg]][package-url]</sup>

[![github actions][actions-image]][actions-url]
[![coverage][codecov-image]][codecov-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

[![npm badge][npm-badge-png]][package-url]

A [PURL (Package URL)][purl-spec] parser and serializer, implementing the [TC54 PURL specification][purl-spec].

## Install

```sh
npm install purl
```

## CLI Usage

```sh
purl [options] <input>
```

### Arguments

- `input` - An npm package specifier or PURL string

### Options

- `--check, -c` - Validate the package exists on its registry and show latest version
- `--json` - Output only JSON to stdout (no colored PURL output)
- `--help` - Show help message
- `--version` - Show version number

### Behavior

- If input is a valid PURL string, outputs the normalized PURL on stdout
- If input is an npm package specifier, converts it to a PURL and outputs on stdout
- Parse information (including package URL if available) is output on stderr as JSON
- With `--json`, outputs only JSON to stdout (useful for scripting)
- Exit code 1 if input is invalid or validation fails

### Examples

```sh
purl lodash@4.17.21           # outputs pkg:npm/lodash@4.17.21
purl @babel/core@7.0.0        # outputs pkg:npm/%40babel/core@7.0.0
purl express                  # outputs pkg:npm/express
purl 'pkg:pypi/requests@2.28' # outputs pkg:pypi/requests@2.28
purl -c lodash@4.17.21        # validates package exists, then outputs PURL
```

### Supported Registry Checks (`--check`)

npm, pypi, gem, cargo, nuget, hex, maven, composer, pub, hackage, cocoapods

## API

```js
import {
	PURL,
	parse,
	stringify,
	valid,
	normalize,
	eq,
	compare,
	type,
	namespace,
	name,
	version,
	qualifiers,
	subpath,
	fromNPM,
	nativeName,
	url,
	validate,
	validateTypes,
} from 'purl';
```

### `PURL` class

```js
import PURL from 'purl/purl';

const purl = new PURL('pkg:npm/lodash@4.17.21');

purl.type;       // 'npm'
purl.namespace;  // null
purl.name;       // 'lodash'
purl.version;    // '4.17.21'
purl.qualifiers; // null
purl.subpath;    // null

String(purl);    // 'pkg:npm/lodash@4.17.21'

// From components
const purl2 = new PURL({
	type: 'npm',
	namespace: '@babel',
	name: 'core',
	version: '7.0.0',
});
String(purl2);   // 'pkg:npm/%40babel/core@7.0.0'

// Instance methods
purl.equals(other);  // boolean
purl.compare(other); // -1 | 0 | 1
```

### `parse(purl)`

Parse a PURL string into a `PURL` object. Returns `null` if invalid.

```js
import parse from 'purl/parse';

parse('pkg:npm/lodash@4.17.21'); // PURL instance
parse('invalid');                // null
```

### `stringify(components)`

Convert PURL components to a canonical PURL string.

```js
import stringify from 'purl/stringify';

stringify({ type: 'npm', name: 'lodash', version: '4.17.21' });
// 'pkg:npm/lodash@4.17.21'
```

### `valid(purl)`

Returns the normalized PURL string if valid, `null` otherwise.

```js
import valid from 'purl/valid';

valid('pkg:NPM/lodash@4.17.21'); // 'pkg:npm/lodash@4.17.21'
valid('invalid');                // null
```

### `normalize(purl)`

Normalize a PURL string. Throws if invalid.

```js
import normalize from 'purl/normalize';

normalize('pkg:NPM/lodash@4.17.21'); // 'pkg:npm/lodash@4.17.21'
normalize('invalid');                // throws
```

### `eq(a, b)`

Compare two PURLs for equality.

```js
import eq from 'purl/eq';

eq('pkg:npm/lodash@4.17.21', 'pkg:NPM/lodash@4.17.21'); // true
eq('pkg:npm/lodash@4.17.21', 'pkg:npm/lodash@4.17.20'); // false
```

### `compare(a, b)`

Compare two PURLs for sorting. Returns `-1`, `0`, or `1`.

```js
import compare from 'purl/compare';

['pkg:npm/bbb', 'pkg:npm/aaa'].sort(compare);
// ['pkg:npm/aaa', 'pkg:npm/bbb']
```

### Component accessors

Each accessor returns the component value or `null` if invalid/missing.

```js
import type from 'purl/type';
import namespace from 'purl/namespace';
import name from 'purl/name';
import version from 'purl/version';
import qualifiers from 'purl/qualifiers';
import subpath from 'purl/subpath';

type('pkg:npm/lodash@4.17.21');      // 'npm'
namespace('pkg:npm/%40babel/core');  // '@babel'
name('pkg:npm/lodash@4.17.21');      // 'lodash'
version('pkg:npm/lodash@4.17.21');   // '4.17.21'
qualifiers('pkg:npm/foo?a=b');       // { a: 'b' }
subpath('pkg:npm/foo#lib/index.js'); // 'lib/index.js'
```

### `fromNPM(specifier)`

Convert an npm package specifier to a `PURL` object.

```js
import fromNPM from 'purl/from-npm';

fromNPM('lodash@4.17.21');    // PURL for pkg:npm/lodash@4.17.21
fromNPM('@babel/core@7.0.0'); // PURL for pkg:npm/%40babel/core@7.0.0
fromNPM('lodash@^4.0.0');     // PURL for pkg:npm/lodash (no version for ranges)
```

### `nativeName(purl)`

Get a PURL's package name as its own ecosystem writes it: in an install command, a manifest's dependency list, or the registry's package identifier.
Accepts a PURL string or a `PURL` instance.
Only the type, namespace, and name are used; the version, qualifiers, and subpath are ignored.

Throws a `TypeError` if the PURL is invalid, including when it is invalid for its type: a namespace the type's [purl-spec definition](https://github.com/package-url/purl-spec/tree/main/types) requires but is missing, or prohibits but is present (eg, `pkg:maven/commons-lang3` with no `groupId`, or `pkg:gem/a/b`), or a namespace or name the ecosystem can not have (eg, an npm namespace that is not an `@scope`).
Returns `null` if the PURL's type has no single well-defined native package name, or is not one of `knownTypes`.

```js
import nativeName from 'purl/native-name';

nativeName('pkg:npm/%40babel/core@7.0.0');                // '@babel/core'
nativeName('pkg:npm/babel/core');                         // throws (an npm namespace must be an `@scope`)
nativeName('pkg:maven/org.apache.commons/commons-lang3'); // 'org.apache.commons:commons-lang3'
nativeName('pkg:golang/github.com/gorilla/mux@1.8.0');    // 'github.com/gorilla/mux'
nativeName('pkg:deb/debian/curl@7.50.3-1?arch=i386');     // 'curl'
nativeName('pkg:deb/curl');                               // throws (a `deb` namespace, the vendor, is required)
nativeName('pkg:generic/openssl@1.1.0g');                 // null
```

The name and namespace are used as written in the PURL; no ecosystem-specific normalization is applied.
For example, a spec-conformant `pypi` PURL holds the [normalized](https://packaging.python.org/en/latest/specifications/name-normalization/) project name (`typing-extensions`), which may differ from the author's spelling (`typing_extensions`), and an `npm` name is checked with `validate-npm-package-name`'s `validForOldPackages`, so legacy names like `JSONStream` are allowed.

| Native name | Types |
| --- | --- |
| `name`; throws with a namespace | bitnami, cargo, chrome-extension, cocoapods, conda, cran, gem, hackage, mlflow, nuget, pub, pypi |
| `name`; `null` with a namespace, which has no defined meaning for these types | bioconductor, deno, homebrew |
| `name`; throws without a namespace, which is not part of the name | alpm, apk, deb, qpkg, rpm (the vendor); cpan (the author's PAUSE id; also throws for a legacy `::` module name) |
| `name`; an optional namespace is ignored | conan (the vendor; user/channel are qualifiers); hex (a private organization) |
| `namespace/name`; throws without a namespace, or with a multi-segment one | bitbucket, composer, elm, github, huggingface |
| `namespace/name`, or `name` without a namespace; throws with a multi-segment namespace | clojars |
| `namespace/name`, or `name` without a namespace; the namespace may contain `/` | docker, luarocks |
| `namespace/name`; throws without a namespace; the namespace may contain `/` | golang, swift |
| `namespace:name` (`groupId:artifactId`); throws without a namespace, or with a multi-segment one | maven |
| `namespace.name` (`publisher.name`); throws without a namespace, or with a multi-segment one | vscode-extension |
| `@scope/name` or `name`; throws unless valid per `validate-npm-package-name` | npm |
| always `null` | generic (identified by `download_url`/`vcs_url`), git (identified by its repository URL; throws without a namespace), oci (identified by digest and `repository_url`; throws with a namespace), swid (identified by `tag_id`; the name is a display name) |

A `docker` PURL's `repository_url` qualifier is ignored like any other qualifier, so `pkg:docker/distroless/static?repository_url=gcr.io` yields `distroless/static`, not `gcr.io/distroless/static`.

### `url(purl)`

Get the registry URL for a PURL.

```js
import url from 'purl/url';

url('pkg:npm/lodash@4.17.21');       // 'https://www.npmjs.com/package/lodash/v/4.17.21'
url('pkg:pypi/requests@2.28.0');     // 'https://pypi.org/project/requests/2.28.0/'
url('pkg:github/ljharb/qs@6.11.0');  // 'https://github.com/ljharb/qs/tree/6.11.0'
```

#### Supported URL Types

bioconductor, bitbucket, cargo, chrome-extension, clojars, cocoapods, composer, conan, conda, cpan, deno, docker, elm, gem, github, golang, hackage, hex, homebrew, huggingface, luarocks, maven, npm, nuget, pub, pypi, swift, vscode-extension

### `validate(purl)`

Validate a PURL against its package registry. Returns a promise.

```js
import validate, { supportedTypes } from 'purl/validate';

const result = await validate('pkg:npm/lodash@4.17.21');
// { valid: true, latestVersion: '4.17.21' }

const result2 = await validate('pkg:npm/nonexistent-package-xyz');
// { valid: false, error: 'npm package "nonexistent-package-xyz" not found', latestVersion: null }

supportedTypes; // ['npm', 'pypi', 'gem', 'cargo', 'nuget', 'hex', 'maven', 'composer', 'pub', 'hackage', 'cocoapods']
```

## Tests

Clone the repo, `npm install`, and run `npm test`.

## Versions before v2

Prior to v2, `purl` was a different package.
v0 was just a placeholder, but v1 can be found both on [archive.org](https://web.archive.org/web/20201029170451/https://github.com/intuitivcloud/purl) and on the [original](https://github.com/ljharb/purl/tree/original) branch of this repo.

[package-url]: https://npmjs.org/package/purl
[npm-version-svg]: https://versionbadg.es/ljharb/purl.svg
[npm-badge-png]: https://nodei.co/npm/purl.png?downloads=true&stars=true
[license-image]: https://img.shields.io/npm/l/purl.svg
[license-url]: LICENSE
[downloads-image]: https://img.shields.io/npm/dm/purl.svg
[downloads-url]: https://npm-stat.com/charts.html?package=purl
[codecov-image]: https://codecov.io/gh/ljharb/purl/branch/main/graphs/badge.svg
[codecov-url]: https://app.codecov.io/gh/ljharb/purl/
[actions-image]: https://img.shields.io/github/check-runs/ljharb/purl/main
[actions-url]: https://github.com/ljharb/purl/actions
[purl-spec]: https://tc54.org/purl/
