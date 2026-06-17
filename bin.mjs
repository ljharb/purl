#!/usr/bin/env node

import pargs from 'pargs';

const {
	help,
	values,
	positionals: [input],
} = await pargs(import.meta.filename, {
	allowPositionals: 1,
	description: {
		examples: [
			{ command: 'purl lodash@4.17.21', description: 'outputs pkg:npm/lodash@4.17.21' },
			{ command: 'purl @babel/core@7.0.0', description: 'outputs pkg:npm/%40babel/core@7.0.0' },
			{ command: 'purl express', description: 'outputs pkg:npm/express' },
			{ command: "purl 'pkg:pypi/requests@2.28'", description: 'outputs pkg:pypi/requests@2.28' },
			{ command: 'purl -c lodash@4.17.21', description: 'validates package exists, then outputs PURL' },
		],
		sections: [
			{
				body: '- If input is a valid PURL string, outputs the normalized PURL on stdout\n- If input is an npm package specifier, converts it to a PURL and outputs on stdout\n- Parse information (including package URL if available) is output on stderr as JSON\n- With --json, outputs only JSON to stdout (useful for scripting)\n- Exit code 1 if input is invalid or validation fails',
				title: 'Behavior',
			},
			{
				body: 'npm, pypi, gem, cargo, nuget, hex, maven, composer, pub, hackage, cocoapods',
				title: 'Supported registry checks (--check)',
			},
		],
		summary: 'purl - Package URL (PURL) parser and converter',
	},
	options: {
		check: {
			default: false,
			description: 'Validate the package exists on its registry and show latest version',
			short: 'c',
			type: 'boolean',
		},
		json: {
			default: false,
			description: 'Output only JSON to stdout (no colored PURL output)',
			type: 'boolean',
		},
	},
	positionals: [{ description: 'An npm package specifier or PURL string', name: 'input' }],
});

await help();

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
