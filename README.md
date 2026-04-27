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

### `url(purl)`

Get the registry URL for a PURL.

```js
import url from 'purl/url';

url('pkg:npm/lodash@4.17.21');       // 'https://www.npmjs.com/package/lodash/v/4.17.21'
url('pkg:pypi/requests@2.28.0');     // 'https://pypi.org/project/requests/2.28.0/'
url('pkg:github/ljharb/qs@6.11.0');  // 'https://github.com/ljharb/qs/tree/6.11.0'
```

#### Supported URL Types

bioconductor, bitbucket, cargo, chrome, clojars, cocoapods, composer, conan, conda, cpan, deno, docker, elm, gem, github, golang, hackage, hex, homebrew, huggingface, luarocks, maven, npm, nuget, pub, pypi, swift, vscode

### `validate(purl)`

Validate a PURL against its package registry. Returns a promise.

```js
import validate, { supportedTypes } from 'purl/validate';

const result = await validate('pkg:npm/lodash@4.17.21');
// { valid: true, latestVersion: '4.17.21' }

const result2 = await validate('pkg:npm/nonexistent-package-xyz');
// { valid: false, error: 'Package "nonexistent-package-xyz" not found on npm', latestVersion: null }

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
