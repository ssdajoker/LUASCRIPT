// Flat config that avoids external fetches so linting can run in locked-down CI
// environments. Rules are declared inline instead of importing `@eslint/js`
// (which may be blocked) but still mirror the strictness tiers from the
// ESLint cleanup plan.

// Define Node.js globals once for reuse
const nodeGlobals = {
  console: "readonly",
  process: "readonly",
  Buffer: "readonly",
  global: "readonly",
  __dirname: "readonly",
  __filename: "readonly",
  require: "readonly",
  module: "readonly",
  exports: "readonly",
  setTimeout: "readonly",
  setInterval: "readonly",
  setImmediate: "readonly",
  clearTimeout: "readonly",
  clearInterval: "readonly",
  clearImmediate: "readonly",
  WebAssembly: "readonly",
  WeakRef: "readonly",
  FinalizationRegistry: "readonly"
};

const recommendedCoreRules = {
  "constructor-super": "error",
  "for-direction": "error",
  "getter-return": "error",
  "no-async-promise-executor": "error",
  "no-case-declarations": "error",
  "no-class-assign": "error",
  "no-compare-neg-zero": "error",
  "no-cond-assign": ["error", "except-parens"],
  "no-constant-binary-expression": "error",
  "no-constant-condition": ["error", { checkLoops: false }],
  "no-const-assign": "error",
  "no-control-regex": "error",
  "no-debugger": "error",
  "no-delete-var": "error",
  "no-dupe-args": "error",
  "no-dupe-class-members": "error",
  "no-dupe-else-if": "error",
  "no-dupe-keys": "error",
  "no-duplicate-case": "error",
  "no-empty": ["error", { allowEmptyCatch: true }],
  "no-empty-character-class": "error",
  "no-empty-pattern": "error",
  "no-ex-assign": "error",
  "no-extra-boolean-cast": "error",
  "no-fallthrough": "error",
  "no-func-assign": "error",
  "no-global-assign": "error",
  "no-import-assign": "error",
  "no-inner-declarations": ["error", "functions"],
  "no-invalid-regexp": "error",
  "no-irregular-whitespace": "error",
  "no-loss-of-precision": "error",
  "no-misleading-character-class": "error",
  "no-new-symbol": "error",
  "no-obj-calls": "error",
  "no-octal": "error",
  "no-prototype-builtins": "error",
  "no-redeclare": "error",
  "no-regex-spaces": "error",
  "no-self-assign": "error",
  "no-setter-return": "error",
  "no-shadow-restricted-names": "error",
  "no-sparse-arrays": "error",
  "no-this-before-super": "error",
  "no-undef": "error",
  "no-unexpected-multiline": "error",
  "no-unreachable": "error",
  "no-unused-labels": "error",
  "no-unsafe-finally": "error",
  "no-unsafe-negation": "error",
  "no-useless-catch": "error",
  "no-useless-escape": "error",
  "no-with": "error",
  "use-isnan": "error",
  "valid-typeof": "error",
  "require-yield": "error",
  "eqeqeq": "error"
};

const tier1CoreRules = {
  ...recommendedCoreRules,
  "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  "no-undef": "error",
  "semi": ["error", "always"],
  "quotes": ["error", "double"],
  "indent": ["error", 2],
  "no-console": ["warn"],
  "complexity": ["warn", 10]
};

const tier2ExtendedRules = {
  ...tier1CoreRules,
  "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  "no-undef": "warn",
  "semi": ["warn", "always"],
  "quotes": ["warn", "double"],
  "indent": ["warn", 2],
  "complexity": ["warn", 15]
};

const tier3BackendRules = {
  ...tier2ExtendedRules,
  "complexity": ["warn", 20]
};

const tier4GeneralRules = {
  ...tier3BackendRules,
  "complexity": "off",
  "no-console": "off",
  "no-undef": "warn",
  "indent": ["warn", 4]
};

export default [
  {
    ignores: ["node_modules/**", "dist/**", "build/**", "coverage/**", ".git/**"]
  },

  // General Code - Most Relaxed (base for tiering)
  {
    files: ["src/**/*.js", "lib/**/*.js"],
    ignores: ["src/ir/**", "src/backends/**"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "commonjs",
      globals: nodeGlobals
    },
    rules: tier4GeneralRules
  },

  // IR General - Moderate (default for IR files outside core/transform/validators)
  {
    files: ["src/ir/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: nodeGlobals
    },
    rules: tier2ExtendedRules
  },

  // Backend Code - Relaxed
  {
    files: ["src/backends/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: nodeGlobals
    },
    rules: tier3BackendRules
  },

  // IR Extended - Moderate
  {
    files: ["src/ir/transforms/**/*.js", "src/ir/validators/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: nodeGlobals
    },
    rules: tier2ExtendedRules
  },

  // IR Core - Strictest
  {
    files: ["src/ir/core/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: nodeGlobals
    },
    rules: tier1CoreRules
  },

  // Test Files - Relaxed
  {
    files: ["**/*.test.js", "**/__tests__/**/*.js", "test/**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "commonjs",
      globals: {
        ...nodeGlobals,
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly"
      }
    },
    rules: {
      ...recommendedCoreRules,
      "no-unused-vars": ["warn"]
    }
  }
];
