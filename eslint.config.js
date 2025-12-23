import js from "@eslint/js";

// Note: This is an ESM file (eslint.config.js is always ESM)
// but the source code is CommonJS. This is fine - ESLint supports it.
// Ignore the MODULE_TYPELESS_PACKAGE_JSON warning - it's a known false positive
// for eslint.config.js files when the project uses CommonJS.

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
      ...js.configs.recommended.rules,
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
      ...js.configs.recommended.rules,
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
      ...js.configs.recommended.rules,
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
      ...js.configs.recommended.rules,
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
      ...js.configs.recommended.rules,
      "no-unused-vars": ["warn"]
    }
  }
];
