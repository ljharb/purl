import config from '@ljharb/eslint-config/flat/node/22';

export default [
	...config,
	{
		rules: {
			'func-style': 'off',
			'multiline-comment-style': 'off',
			'no-magic-numbers': 'off',
		},
	},
];
