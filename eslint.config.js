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
  "../**/shared-node",
  "../**/shared-node/**",
  "../**/infra",
  "../**/infra/**",
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

  // Dependency direction: client -> shared; server -> shared/shared-node; shared-node -> shared; infra -> shared/shared-node; shared -> nothing
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
        ["@repo/server", "@repo/infra", "@repo/shared-node"],
        "The client may depend only on @repo/shared, not @repo/server, @repo/infra, or @repo/shared-node."
      ),
    },
  },
  {
    files: ["server/**/*.{js,jsx,ts,tsx}"],
    rules: restrict(
      ["@repo/client", "@repo/infra"],
      "The server may depend on @repo/shared and @repo/shared-node, not @repo/client or @repo/infra."
    ),
  },
  {
    files: ["shared/**/*.{js,jsx,ts,tsx}"],
    rules: restrict(
      ["@repo/client", "@repo/server", "@repo/infra", "@repo/shared-node"],
      "The shared package must not depend on other workspace packages."
    ),
  },
  {
    files: ["shared-node/**/*.{js,jsx,ts,tsx}"],
    rules: restrict(
      ["@repo/client", "@repo/server", "@repo/infra"],
      "The shared-node package may depend on @repo/shared, not @repo/client, @repo/server, or @repo/infra."
    ),
  },
  {
    files: ["infra/**/*.{js,jsx,ts,tsx}"],
    rules: restrict(
      ["@repo/client", "@repo/server"],
      "The infra package may depend on @repo/shared and @repo/shared-node, not @repo/client or @repo/server."
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
