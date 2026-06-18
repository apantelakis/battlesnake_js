import js from "@eslint/js";
import globals from "globals";
import jestPlugin from "eslint-plugin-jest";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { ignores: ["docs/**"] },
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.node },
    rules: {
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
    }
  },
  {
    files: ["**/*.test.js"],
    plugins: { jest: jestPlugin },
    languageOptions: {
      globals: globals.jest
    },
    rules: {
      ...jestPlugin.configs.recommended.rules
    }
  }
]);
