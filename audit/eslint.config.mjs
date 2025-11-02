// ESLint v9 flat config (JS-only) stored under audit/ to respect read-only repo policy
export default [
  // Base JS rules
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    ignores: [
      "node_modules/**",
      "audit/**",
      ".git/**",
      "dist/**",
      "build/**",
      "**/*.min.js"
    ],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        console: "readonly",
        module: "readonly",
        require: "readonly",
        __dirname: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { args: "none", ignoreRestSiblings: true }],
      "no-undef": "warn",
      "no-console": "off",
      "eqeqeq": "warn",
      "curly": ["warn", "multi-line"],
      "no-var": "warn",
      "prefer-const": "warn"
    }
  },
  // Node environment for src files (allow Node globals)
  {
    files: ["src/**/*.js"],
    languageOptions: {
      globals: {
        Buffer: "readonly",
        __filename: "readonly",
        __dirname: "readonly",
        setImmediate: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        WebAssembly: "readonly",
        global: "readonly"
      }
    }
  },
  // Node environment for tests
  {
    files: ["test/**/*.js", "tests/**/*.js"],
    languageOptions: {
      globals: {
        Buffer: "readonly",
        setImmediate: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        console: "readonly"
      }
    }
  }
];
