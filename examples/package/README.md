# Installed-package examples

These examples use only the package-root API shipped by `luascript`.

From the installed package directory:

```sh
node examples/package/transpile-js-to-lua.cjs
node examples/package/minimal-system.cjs
```

- `transpile-js-to-lua.cjs` imports `CoreTranspiler` and compiles one small
  JavaScript expression to Lua.
- `minimal-system.cjs` imports `UnifiedLuaScript` with `enableAll: false` and
  verifies the zero-component initialization contract.

The wider repository `examples/` tree and `tests/actual_programs/` are
repository-local compiler evidence. They are not installed-package examples
and are not implied by this directory.
