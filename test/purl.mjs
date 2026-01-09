import test from 'tape';

import PURL from '../purl.mjs';

test('PURL class', (t) => {
	t.test('constructor with string', (st) => {
		const purl = new PURL('pkg:npm/lodash@4.17.21');
		st.equal(purl.type, 'npm', 'type is npm');
		st.equal(purl.namespace, null, 'namespace is null');
		st.equal(purl.name, 'lodash', 'name is lodash');
		st.equal(purl.version, '4.17.21', 'version is 4.17.21');
		st.equal(purl.qualifiers, null, 'qualifiers is null');
		st.equal(purl.subpath, null, 'subpath is null');
		st.end();
	});

	t.test('constructor with scoped package', (st) => {
		const purl = new PURL('pkg:npm/%40babel/core@7.0.0');
		st.equal(purl.type, 'npm', 'type is npm');
		st.equal(purl.namespace, '@babel', 'namespace is @babel');
		st.equal(purl.name, 'core', 'name is core');
		st.equal(purl.version, '7.0.0', 'version is 7.0.0');
		st.end();
	});

	t.test('constructor with object', (st) => {
		const purl = new PURL({
			name: 'lodash',
			type: 'npm',
			version: '4.17.21',
		});
		st.equal(purl.type, 'npm', 'type is npm');
		st.equal(purl.name, 'lodash', 'name is lodash');
		st.equal(purl.version, '4.17.21', 'version is 4.17.21');
		st.end();
	});

	t.test('constructor with object including namespace', (st) => {
		const purl = new PURL({
			name: 'core',
			namespace: '@babel',
			type: 'npm',
			version: '7.0.0',
		});
		st.equal(purl.namespace, '@babel', 'namespace is @babel');
		st.equal(purl.name, 'core', 'name is core');
		st.end();
	});

	t.test('constructor with qualifiers', (st) => {
		const purl = new PURL('pkg:npm/lodash@4.17.21?repository_url=https://github.com/lodash/lodash');
		// eslint-disable-next-line camelcase -- PURL qualifier key from spec
		st.deepEqual(purl.qualifiers, { repository_url: 'https://github.com/lodash/lodash' }, 'qualifiers parsed');
		st.end();
	});

	t.test('constructor with subpath', (st) => {
		const purl = new PURL('pkg:npm/lodash@4.17.21#lib/fp');
		st.equal(purl.subpath, 'lib/fp', 'subpath parsed');
		st.end();
	});

	t.test('toString with subpath', (st) => {
		const purl = new PURL({
			name: 'lodash',
			subpath: 'lib/fp',
			type: 'npm',
		});
		st.equal(`${purl}`, 'pkg:npm/lodash#lib/fp', 'subpath in output');
		st.end();
	});

	t.test('toString filters . and .. from subpath', (st) => {
		const purl = new PURL({
			name: 'lodash',
			subpath: './lib/../fp',
			type: 'npm',
		});
		st.equal(`${purl}`, 'pkg:npm/lodash#lib/fp', 'filters dots from subpath');
		st.end();
	});

	t.test('constructor with invalid string throws', (st) => {
		st.throws(() => new PURL('invalid'), TypeError, 'throws on invalid string');
		st.throws(() => new PURL('http://example.com'), TypeError, 'throws on non-purl URL');
		st.throws(() => new PURL('pkg:'), TypeError, 'throws on incomplete purl');
		st.throws(() => new PURL('pkg:npm/foo?invalid'), TypeError, 'throws on invalid qualifiers (no =)');
		st.throws(() => new PURL('pkg:123/foo'), TypeError, 'throws on invalid type (starts with number)');
		st.throws(() => new PURL('pkg:npm/'), TypeError, 'throws on trailing slash with no name');
		st.end();
	});

	t.test('constructor with invalid object throws', (st) => {
		// @ts-expect-error - testing invalid input
		st.throws(() => new PURL({}), TypeError, 'throws on missing type');
		// @ts-expect-error - testing invalid input
		st.throws(() => new PURL({ type: 'npm' }), TypeError, 'throws on missing name');
		st.throws(() => new PURL({ name: 'foo', type: '123invalid' }), TypeError, 'throws on invalid type');
		// @ts-expect-error - testing invalid input
		st.throws(() => new PURL(null), TypeError, 'throws on null');
		// @ts-expect-error - testing invalid input
		st.throws(() => new PURL(123), TypeError, 'throws on number');
		st.end();
	});

	t.test('toString produces canonical form', (st) => {
		const purl = new PURL({
			name: 'lodash',
			type: 'npm',
			version: '4.17.21',
		});
		st.equal(`${purl}`, 'pkg:npm/lodash@4.17.21', 'canonical string');
		st.end();
	});

	t.test('toString with namespace', (st) => {
		const purl = new PURL({
			name: 'core',
			namespace: '@babel',
			type: 'npm',
			version: '7.0.0',
		});
		st.equal(`${purl}`, 'pkg:npm/%40babel/core@7.0.0', 'encodes @ in namespace');
		st.end();
	});

	t.test('toString with qualifiers sorted', (st) => {
		const purl = new PURL({
			name: 'foo',
			qualifiers: { z: '1', a: '2' },
			type: 'npm',
		});
		st.equal(`${purl}`, 'pkg:npm/foo?a=2&z=1', 'qualifiers sorted alphabetically');
		st.end();
	});

	t.test('equals method', (st) => {
		const purl1 = new PURL('pkg:npm/lodash@4.17.21');
		const purl2 = new PURL('pkg:npm/lodash@4.17.21');
		const purl3 = new PURL('pkg:npm/lodash@4.17.20');
		st.ok(purl1.equals(purl2), 'equal purls');
		st.ok(purl1.equals('pkg:npm/lodash@4.17.21'), 'equal to string');
		st.notOk(purl1.equals(purl3), 'different versions not equal');
		st.end();
	});

	t.test('compare method', (st) => {
		const purl1 = new PURL('pkg:npm/aaa@1.0.0');
		const purl2 = new PURL('pkg:npm/bbb@1.0.0');
		const purl3 = new PURL('pkg:npm/aaa@1.0.0');
		st.equal(purl1.compare(purl2), -1, 'aaa < bbb');
		st.equal(purl2.compare(purl1), 1, 'bbb > aaa');
		st.equal(purl1.compare(purl3), 0, 'aaa == aaa');
		st.equal(purl1.compare('pkg:npm/bbb@1.0.0'), -1, 'compares with string');
		st.end();
	});

	t.test('qualifiers getter returns copy', (st) => {
		const purl = new PURL({
			name: 'foo',
			qualifiers: { a: '1' },
			type: 'npm',
		});
		const q1 = purl.qualifiers;
		const q2 = purl.qualifiers;
		st.notEqual(q1, q2, 'returns new object each time');
		st.deepEqual(q1, q2, 'but with same content');
		st.end();
	});

	t.test('parse static method', (st) => {
		const parsed = PURL.parse('pkg:npm/lodash@4.17.21');
		st.ok(parsed, 'returns parsed object');
		st.equal(parsed?.type, 'npm', 'type parsed');
		st.equal(parsed?.name, 'lodash', 'name parsed');
		st.equal(parsed?.version, '4.17.21', 'version parsed');

		st.equal(PURL.parse('invalid'), null, 'returns null for invalid');
		// @ts-expect-error - testing invalid input
		st.equal(PURL.parse(123), null, 'returns null for non-string');
		st.end();
	});

	t.test('parse with encoded @ in version', (st) => {
		// @ in version must be percent-encoded as %40
		const purl = new PURL('pkg:npm/foo@1.0.0-beta%40latest');
		st.equal(purl.name, 'foo', 'name is foo');
		st.equal(purl.version, '1.0.0-beta@latest', 'version contains @');
		st.end();
	});

	t.test('last @ is used as version delimiter', (st) => {
		// Without encoding, the last @ is treated as version delimiter
		const purl = new PURL('pkg:npm/foo@1.0.0-beta@latest');
		st.equal(purl.name, 'foo@1.0.0-beta', 'name includes everything up to last @');
		st.equal(purl.version, 'latest', 'version is text after last @');
		st.end();
	});

	t.test('type is normalized to lowercase', (st) => {
		const purl = new PURL({ name: 'foo', type: 'NPM' });
		st.equal(purl.type, 'npm', 'type is lowercased');
		st.end();
	});

	t.test('parses PURL with empty query string', (st) => {
		const purl = new PURL('pkg:npm/foo?');
		st.equal(purl.name, 'foo', 'name is foo');
		st.equal(purl.qualifiers, null, 'qualifiers is null for empty query');
		st.end();
	});

	t.test('parses PURL without version (@ only in type path)', (st) => {
		// Edge case: no / after type means no version can be extracted
		const parsed = PURL.parse('pkg:npm');
		st.equal(parsed, null, 'returns null for PURL without name segment');
		st.end();
	});

	t.test('handles @ before / in path (invalid type)', (st) => {
		// @ before / means the @ is part of the type/namespace, not version delimiter
		// This tests extractVersion returning early when atIndex <= slashIndex
		const parsed = PURL.parse('pkg:t@pe/name');
		st.equal(parsed, null, 'returns null for invalid type with @');
		st.end();
	});

	t.end();
});
