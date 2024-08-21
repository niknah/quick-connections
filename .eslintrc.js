module.exports = {
	env: {
		browser: true,
		es2021: true,
	},
	extends: [
		'airbnb-base',
	],
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	rules: {
		indent: ['error', 'tab'],
		'no-tabs': 'off',
		'import/extensions': 'off',
		'prefer-rest-params': 'off', // allow use of arguments
	},
};
