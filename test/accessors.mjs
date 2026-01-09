import test from 'tape';

import type from '../type.mjs';
import namespace from '../namespace.mjs';
import name from '../name.mjs';
import version from '../version.mjs';
import qualifiers from '../qualifiers.mjs';
import subpath from '../subpath.mjs';

test('type accessor', (t) => {
	t.equal(type('pkg:npm/lodash@4.17.21'), 'npm', 'returns type');
	t.equal(type('pkg:pypi/django@3.0.0'), 'pypi', 'returns pypi type');
	t.equal(type('invalid'), null, 'returns null for invalid');
	t.end();
});

test('namespace accessor', (t) => {
	t.equal(namespace('pkg:npm/%40babel/core@7.0.0'), '@babel', 'returns namespace');
	t.equal(namespace('pkg:npm/lodash@4.17.21'), null, 'returns null when no namespace');
	t.equal(namespace('invalid'), null, 'returns null for invalid');
	t.end();
});

test('name accessor', (t) => {
	t.equal(name('pkg:npm/lodash@4.17.21'), 'lodash', 'returns name');
	t.equal(name('pkg:npm/%40babel/core@7.0.0'), 'core', 'returns name from scoped');
	t.equal(name('invalid'), null, 'returns null for invalid');
	t.end();
});

test('version accessor', (t) => {
	t.equal(version('pkg:npm/lodash@4.17.21'), '4.17.21', 'returns version');
	t.equal(version('pkg:npm/lodash'), null, 'returns null when no version');
	t.equal(version('invalid'), null, 'returns null for invalid');
	t.end();
});

test('qualifiers accessor', (t) => {
	t.deepEqual(
		qualifiers('pkg:npm/lodash@4.17.21?repository_url=https://github.com/lodash/lodash'),
		// eslint-disable-next-line camelcase -- PURL qualifier key from spec
		{ repository_url: 'https://github.com/lodash/lodash' },
		'returns qualifiers',
	);
	t.equal(qualifiers('pkg:npm/lodash@4.17.21'), null, 'returns null when no qualifiers');
	t.equal(qualifiers('invalid'), null, 'returns null for invalid');
	t.end();
});

test('subpath accessor', (t) => {
	t.equal(subpath('pkg:npm/lodash@4.17.21#lib/fp'), 'lib/fp', 'returns subpath');
	t.equal(subpath('pkg:npm/lodash@4.17.21'), null, 'returns null when no subpath');
	t.equal(subpath('invalid'), null, 'returns null for invalid');
	t.end();
});
