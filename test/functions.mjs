import test from 'tape';

import PURL from '../purl.mjs';
import parse from '../parse.mjs';
import stringify from '../stringify.mjs';
import valid from '../valid.mjs';
import normalize from '../normalize.mjs';
import eq from '../eq.mjs';
import compare from '../compare.mjs';

test('parse function', (t) => {
	t.test('returns PURL for valid string', (st) => {
		const purl = parse('pkg:npm/lodash@4.17.21');
		st.ok(purl instanceof PURL, 'returns PURL instance');
		st.ok(purl, 'purl is not null');
		st.equal(purl?.name, 'lodash', 'name parsed');
		st.end();
	});

	t.test('returns null for invalid string', (st) => {
		st.equal(parse('invalid'), null, 'returns null');
		st.equal(parse(''), null, 'returns null for empty');
		st.equal(parse('pkg:'), null, 'returns null for incomplete');
		st.end();
	});

	t.end();
});

test('stringify function', (t) => {
	t.test('converts components to string', (st) => {
		const result = stringify({
			name: 'lodash',
			type: 'npm',
			version: '4.17.21',
		});
		st.equal(result, 'pkg:npm/lodash@4.17.21', 'produces canonical string');
		st.end();
	});

	t.test('converts PURL instance to string', (st) => {
		const purl = new PURL('pkg:npm/lodash@4.17.21');
		st.equal(stringify(purl), 'pkg:npm/lodash@4.17.21', 'stringifies PURL instance');
		st.end();
	});

	t.end();
});

test('valid function', (t) => {
	t.test('returns normalized string for valid purl', (st) => {
		st.equal(valid('pkg:npm/lodash@4.17.21'), 'pkg:npm/lodash@4.17.21', 'returns normalized');
		st.equal(valid('pkg:NPM/lodash@4.17.21'), 'pkg:npm/lodash@4.17.21', 'normalizes type case');
		st.end();
	});

	t.test('returns null for invalid purl', (st) => {
		st.equal(valid('invalid'), null, 'returns null');
		st.equal(valid(''), null, 'returns null for empty');
		st.end();
	});

	t.end();
});

test('normalize function', (t) => {
	t.test('normalizes valid purl', (st) => {
		st.equal(normalize('pkg:npm/lodash@4.17.21'), 'pkg:npm/lodash@4.17.21', 'normalizes');
		st.equal(normalize('pkg:NPM/lodash@4.17.21'), 'pkg:npm/lodash@4.17.21', 'normalizes type');
		st.end();
	});

	t.test('throws for invalid purl', (st) => {
		st.throws(() => normalize('invalid'), TypeError, 'throws on invalid');
		st.end();
	});

	t.end();
});

test('eq function', (t) => {
	t.test('compares two purls', (st) => {
		st.ok(eq('pkg:npm/lodash@4.17.21', 'pkg:npm/lodash@4.17.21'), 'equal strings');
		st.ok(eq('pkg:NPM/lodash@4.17.21', 'pkg:npm/lodash@4.17.21'), 'case insensitive type');
		st.notOk(eq('pkg:npm/lodash@4.17.21', 'pkg:npm/lodash@4.17.20'), 'different versions');
		st.end();
	});

	t.test('compares PURL instances', (st) => {
		const purl1 = new PURL('pkg:npm/lodash@4.17.21');
		const purl2 = new PURL('pkg:npm/lodash@4.17.21');
		st.ok(eq(purl1, purl2), 'equal instances');
		st.ok(eq(purl1, 'pkg:npm/lodash@4.17.21'), 'instance and string');
		st.end();
	});

	t.test('returns false for invalid input', (st) => {
		st.notOk(eq('invalid', 'pkg:npm/lodash'), 'invalid first arg');
		st.notOk(eq('pkg:npm/lodash', 'invalid'), 'invalid second arg');
		st.end();
	});

	t.end();
});

test('compare function', (t) => {
	t.test('compares two purls for sorting', (st) => {
		st.equal(compare('pkg:npm/aaa', 'pkg:npm/bbb'), -1, 'aaa < bbb');
		st.equal(compare('pkg:npm/bbb', 'pkg:npm/aaa'), 1, 'bbb > aaa');
		st.equal(compare('pkg:npm/aaa', 'pkg:npm/aaa'), 0, 'aaa == aaa');
		st.end();
	});

	t.test('compares PURL instances', (st) => {
		const purl1 = new PURL('pkg:npm/aaa');
		const purl2 = new PURL('pkg:npm/bbb');
		st.equal(compare(purl1, purl2), -1, 'PURL instances: aaa < bbb');
		st.equal(compare(purl2, purl1), 1, 'PURL instances: bbb > aaa');
		st.equal(compare(purl1, purl1), 0, 'PURL instances: aaa == aaa');
		st.end();
	});

	t.test('can be used with Array.sort', (st) => {
		const purls = ['pkg:npm/zzz', 'pkg:npm/aaa', 'pkg:npm/mmm'];
		const sorted = purls.sort(compare);
		st.deepEqual(sorted, ['pkg:npm/aaa', 'pkg:npm/mmm', 'pkg:npm/zzz'], 'sorted correctly');
		st.end();
	});

	t.end();
});
