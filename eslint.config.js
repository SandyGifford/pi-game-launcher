import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

// Relative imports must never reach across a workspace boundary; use @repo/ specifiers instead.
const CROSS_PACKAGE_PATTERNS = [
	"../**/client",
	"../**/client/**",
	"../**/server",
	"../**/server/**",
	"../**/shared",
	"../**/shared/**",
];

const restrict = (names, message) => ({
	"no-restricted-imports": [
		"error",
		{
			paths: names.map((name) => ({ name, message })),
			patterns: [
				{
					group: CROSS_PACKAGE_PATTERNS,
					message: "Do not import across workspace boundaries; use @repo/ specifiers.",
				},
				...names.map((name) => ({ group: [`${name}/*`], message })),
			],
		},
	],
});

export default [
	{
		ignores: ["**/node_modules", "**/dist", "**/coverage"],
	},

	js.configs.recommended,
	...tseslint.configs.recommended,

	{
		files: ["**/*.{js,jsx,ts,tsx}"],
		languageOptions: {
			parserOptions: {
				ecmaVersion: "latest",
				sourceType: "module",
			},
		},
		rules: {
			"linebreak-style": ["error", "unix"],
			quotes: ["error", "double", { avoidEscape: true }],
			semi: ["error", "always"],
			"no-unused-vars": "off", // Handled by TypeScript
			"prefer-const": "error",
			"no-var": "error",
			eqeqeq: ["error", "always"],
			"no-nested-ternary": "warn",
			"no-console": "error",
		},
	},

	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: true,
			},
		},
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					args: "none",
					varsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/no-explicit-any": "error",
			"@typescript-eslint/prefer-readonly": "error",
			"@typescript-eslint/consistent-type-imports": "error",
		},
	},

	// Dependency direction: client -> shared, server -> shared, shared -> nothing
	{
		files: ["client/**/*.{js,jsx,ts,tsx}"],
		plugins: { "react-hooks": reactHooks },
		settings: {
			"react-hooks": {
				additionalEffectHooks: "(usePromise|useWindowHandler)",
			},
		},
		rules: {
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": "error",
			...restrict(
				["@repo/server"],
				"The client must not depend on the server; share code via @repo/shared."
			),
		},
	},
	{
		files: ["server/**/*.{js,jsx,ts,tsx}"],
		rules: restrict(
			["@repo/client"],
			"The server must not depend on the client; share code via @repo/shared."
		),
	},
	{
		files: ["shared/**/*.{js,jsx,ts,tsx}"],
		rules: restrict(
			["@repo/client", "@repo/server"],
			"Shared code must remain independent of the client and server."
		),
	},

	{
		files: ["server/**/*.{js,ts}"],
		rules: { "no-console": "off" },
	},

	{
		files: ["client/plopfile.mjs"],
		languageOptions: { globals: { process: "readonly" } },
	},
];
