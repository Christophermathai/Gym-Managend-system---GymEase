const js = require("@eslint/js");
const { FlatCompat } = require("@eslint/eslintrc");
const tseslint = require("typescript-eslint");

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = tseslint.config(
  {
    ignores: ["dist", ".next", "node_modules", "electron", "migration_scripts", "eslint.config.js"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/ban-ts-comment": "off"
    },
  },
);
