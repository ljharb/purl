import config from '@ljharb/eslint-config/flat/node/22';
import esmConfig from '@ljharb/eslint-config/flat/esm';

export default [
	...config,
	{
		rules: {
			'func-style': 'off',
			'multiline-comment-style': 'off',
			'no-magic-numbers': 'off',
		},
	},
	...esmConfig.map((x) => ({
		...x,
		files: ['README.md/**'],
		languageOptions: {
			...x.languageOptions,
			ecmaVersion: 2024,
		},
	})),
];
