import test from 'tape';

import * as purl from '../index.mjs';

test('index exports', (t) => {
	t.equal(typeof purl.PURL, 'function', 'PURL is exported');
	t.equal(typeof purl.parse, 'function', 'parse is exported');
	t.equal(typeof purl.stringify, 'function', 'stringify is exported');
	t.equal(typeof purl.valid, 'function', 'valid is exported');
	t.equal(typeof purl.normalize, 'function', 'normalize is exported');
	t.equal(typeof purl.eq, 'function', 'eq is exported');
	t.equal(typeof purl.compare, 'function', 'compare is exported');
	t.equal(typeof purl.type, 'function', 'type is exported');
	t.equal(typeof purl.namespace, 'function', 'namespace is exported');
	t.equal(typeof purl.name, 'function', 'name is exported');
	t.equal(typeof purl.version, 'function', 'version is exported');
	t.equal(typeof purl.qualifiers, 'function', 'qualifiers is exported');
	t.equal(typeof purl.subpath, 'function', 'subpath is exported');
	t.equal(typeof purl.fromNPM, 'function', 'fromNPM is exported');
	t.end();
});
