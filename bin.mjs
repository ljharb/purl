#!/usr/bin/env node

import pargs from 'pargs';
import pkg from './package.json' with { type: 'json' };

const {
	help,
	values,
	positionals: [input],
} = await pargs(import.meta.filename, {
	allowPositionals: 1,
	options: {
		check: {
			default: false,
			short: 'c',
			type: 'boolean',
		},
		json: {
			default: false,
			type: 'boolean',
		},
		version: {
			default: false,
			type: 'boolean',
		},
	},
});

await help();

if (values.version) {
	console.log(`v${pkg.version}`);
	process.exit(0);
}

import { styleText } from 'util';

import PURL from './purl.mjs';
import fromNPM from './from-npm.mjs';
import valid from './valid.mjs';
import url from './url.mjs';
import validate from './validate.mjs';

/** @type {PURL | null} */
let purl = null;

/** @type {'purl' | 'npm' | null} */
let source = null;

// Check for missing input
if (!input) {
	console.error(styleText('red', 'Missing required <input> argument'));
	process.exitCode = 1;
}

// First, try to parse as a PURL
const validPurl = input && valid(input);
if (validPurl) {
	purl = new PURL(input);
	source = 'purl';
} else if (input) {
	// Try to parse as an npm specifier
	try {
		purl = fromNPM(input);
		source = 'npm';
	} catch {
		// Neither a valid PURL nor a valid npm specifier
		console.error(styleText('red', `Invalid input: "${input}" is neither a valid PURL nor a valid npm package specifier`));
		process.exitCode = 1;
	}
}

/** @type {string | null} */
let latestVersion = null;

// Validate against registry if --check flag is set
if (purl && source && values.check) {
	try {
		const validation = await validate(purl);
		latestVersion = validation.latestVersion || null;
		if (!validation.valid) {
			console.error(styleText('red', validation.error));
			process.exitCode = 1;
			purl = null; // Don't output the PURL if validation failed
		}
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		console.error(styleText('red', `Validation error: ${message}`));
		process.exitCode = 1;
		purl = null;
	}
}

if (purl && source) {
	const purlString = `${purl}`;
	const packageURL = url(purl);

	/** @type {Record<string, unknown>} */
	const output = {
		input,
		parsed: {
			name: purl.name,
			namespace: purl.namespace,
			qualifiers: purl.qualifiers,
			subpath: purl.subpath,
			type: purl.type,
			version: purl.version,
		},
		purl: purlString,
		source,
		url: packageURL,
	};

	if (values.check && latestVersion) {
		output.latestVersion = latestVersion;
	}

	const JSON_INDENT = 2;
	if (values.json) {
		// Output only JSON to stdout
		console.log(JSON.stringify(output, null, JSON_INDENT));
	} else {
		// Output parse info on stderr (first, so it appears before stdout in terminal)
		console.error(JSON.stringify(output, null, JSON_INDENT));

		// Output normalized PURL on stdout (green when colors enabled)
		console.log(styleText('green', purlString));
	}
}
