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
  "no-async-promise-executor": "error",
  "no-cond-assign": ["error", "except-parens"],
  "no-constant-binary-expression": "error",
  "no-constant-condition": ["error", { checkLoops: false }],
  "no-control-regex": "error",
  "no-debugger": "error",
  "no-dupe-args": "error",
  "no-dupe-else-if": "error",
  "no-dupe-keys": "error",
  "no-duplicate-case": "error",
  "no-empty": ["error", { allowEmptyCatch: true }],
  "no-empty-character-class": "error",
  "no-ex-assign": "error",
  "no-extra-boolean-cast": "error",
  "no-fallthrough": "error",
  "no-func-assign": "error",
  "no-import-assign": "error",
  "no-inner-declarations": ["error", "functions"],
  "no-invalid-regexp": "error",
  "no-irregular-whitespace": "error",
  "no-loss-of-precision": "error",
  "no-misleading-character-class": "error",
  "no-obj-calls": "error",
  "no-prototype-builtins": "error",
  "no-regex-spaces": "error",
  "no-setter-return": "error",
  "no-sparse-arrays": "error",
  "no-unexpected-multiline": "error",
  "no-unreachable": "error",
  "no-unsafe-finally": "error",
  "no-unsafe-negation": "error",
  "use-isnan": "error",
  "valid-typeof": "error",
  eqeqeq: "error"
};

export default [
  {
    ignores: ["node_modules/**", "dist/**", "build/**", "coverage/**", ".git/**"]
  },
  
  // Backend Code - Relaxed (must come before IR patterns to take precedence)
  {
    files: ["src/backends/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: nodeGlobals
    },
    rules: {
      ...recommendedCoreRules,
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "semi": ["warn", "always"],
      "quotes": ["warn", "double"],
      "indent": ["warn", 2],
      "complexity": ["warn", 20]
    }
  },

  // IR Core - Strict
  {
    files: ["src/ir/**/*.js"],
    ignores: ["src/ir/transforms/**/*.js", "src/ir/validators/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: nodeGlobals
    },
    rules: {
      ...recommendedCoreRules,
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
      "semi": ["error", "always"],
      "quotes": ["error", "double"],
      "indent": ["error", 2],
      "no-console": ["warn"],
      "complexity": ["warn", 10]
    }
  },

  // IR Extended - Moderate
  {
    files: ["src/ir/transforms/**/*.js", "src/ir/validators/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: nodeGlobals
    },
    rules: {
      ...recommendedCoreRules,
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "warn",
      "semi": ["warn", "always"],
      "quotes": ["warn", "double"],
      "indent": ["warn", 2],
      "no-console": ["warn"],
      "complexity": ["warn", 15]
    }
  },

  // General Code - Most Relaxed (excluding backends and IR which have specific configs)
  {
    files: ["src/**/*.js", "lib/**/*.js"],
    ignores: ["src/backends/**/*.js", "src/ir/**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "commonjs",
      globals: nodeGlobals
    },
    rules: {
      ...recommendedCoreRules,
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "semi": ["warn"],
      "quotes": ["warn"],
      "indent": ["warn"]
    }
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
