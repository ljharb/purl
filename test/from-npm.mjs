import test from 'tape';

import PURL from '../purl.mjs';
import fromNPM from '../from-npm.mjs';

test('fromNPM function', (t) => {
	t.test('converts simple package name', (st) => {
		const purl = fromNPM('lodash');
		st.ok(purl instanceof PURL, 'returns PURL instance');
		st.equal(purl.type, 'npm', 'type is npm');
		st.equal(purl.name, 'lodash', 'name is lodash');
		st.equal(purl.namespace, null, 'namespace is null');
		st.equal(purl.version, null, 'version is null for bare name');
		st.equal(`${purl}`, 'pkg:npm/lodash', 'canonical string');
		st.end();
	});

	t.test('converts package with version', (st) => {
		const purl = fromNPM('lodash@4.17.21');
		st.equal(purl.name, 'lodash', 'name is lodash');
		st.equal(purl.version, '4.17.21', 'version is 4.17.21');
		st.equal(`${purl}`, 'pkg:npm/lodash@4.17.21', 'canonical string');
		st.end();
	});

	t.test('converts scoped package', (st) => {
		const purl = fromNPM('@babel/core');
		st.equal(purl.namespace, '@babel', 'namespace is @babel');
		st.equal(purl.name, 'core', 'name is core');
		st.equal(`${purl}`, 'pkg:npm/%40babel/core', 'canonical string with encoded @');
		st.end();
	});

	t.test('converts scoped package with version', (st) => {
		const purl = fromNPM('@babel/core@7.0.0');
		st.equal(purl.namespace, '@babel', 'namespace is @babel');
		st.equal(purl.name, 'core', 'name is core');
		st.equal(purl.version, '7.0.0', 'version is 7.0.0');
		st.equal(`${purl}`, 'pkg:npm/%40babel/core@7.0.0', 'canonical string');
		st.end();
	});

	t.test('does not include version for ranges', (st) => {
		const purl = fromNPM('lodash@^4.17.0');
		st.equal(purl.name, 'lodash', 'name is lodash');
		st.equal(purl.version, null, 'version is null for range');
		st.equal(`${purl}`, 'pkg:npm/lodash', 'no version in string');
		st.end();
	});

	t.test('does not include version for tags', (st) => {
		const purl = fromNPM('lodash@latest');
		st.equal(purl.name, 'lodash', 'name is lodash');
		st.equal(purl.version, null, 'version is null for tag');
		st.end();
	});

	t.test('throws for invalid specifier', (st) => {
		st.throws(() => fromNPM(''), TypeError, 'throws on empty');
		st.end();
	});

	t.test('throws for non-registry types', (st) => {
		st.throws(() => fromNPM('git://github.com/foo/bar'), TypeError, 'throws on git URL');
		st.throws(() => fromNPM('https://example.com/foo.tgz'), TypeError, 'throws on tarball URL');
		st.throws(() => fromNPM('/path/to/local'), TypeError, 'throws on local path');
		st.end();
	});

	t.test('throws for malformed package name', (st) => {
		// This makes npa throw an error (caught and re-thrown as TypeError)
		st.throws(() => fromNPM('@@scope/pkg'), TypeError, 'throws on malformed scope');
		st.end();
	});

	t.end();
});
