# LUASCRIPT Denali Package Migration Notes

Status: released stable Denali migration contract
Last updated: 2026-07-30
Applies to: `luascript@1.0.1`

These notes describe the package-boundary changes shipped by Denali v1.0.1.

## Consumer Runtime Floor

Old declaration: Node `>=14.0.0`.

Denali declaration: Node `>=14.17.0`.

Why: the shipped TypeScript compiler eagerly loads exact `typescript@5.9.3`, whose own engine floor is Node `>=14.17`. Keeping the lower package declaration would promise an engine range the runtime dependency does not promise.

Required action: consumers on Node 14.0 through 14.16 must upgrade to Node 14.17 or newer before adopting a package containing this boundary. Node `14.17.1` is the executable floor probe because the npm-distributed `node` package does not provide `14.17.0`.

Verification:

```bash
node -v
npm run test:package-contract
```

The consumer-floor probe covers installed root import and a small JS-to-Lua transpilation. It does not claim that the repository's modern development dependencies or full source test suite support Node 14.

## Clean Package Import

Old behavior: an actual tarball could install successfully but `require("luascript")` failed because `src/compilers/typescript-to-ir.js` eagerly required TypeScript while TypeScript was development-only.

Candidate behavior: exact `typescript@5.9.3` is a runtime dependency. YAML and `@types/esprima` are development-only because the candidate root runtime does not load them.

Required action: none for ordinary consumers. Do not omit production dependencies during installation.

Fallback: if a downstream environment deliberately strips dependencies, restore the package's declared production dependencies; deep-import workarounds are not supported.

## Unified Facade Options And Version

Old behavior:

- `enableAll: false` was retained in options but all five components were still enabled unless each component was separately disabled.
- `getSystemStatus().version` reported the future-looking literal `1.0.0` while the package was `0.1.0-beta.0`.

Candidate behavior:

- `enableAll: false` is a master disable and initializes zero components.
- status version is sourced from `package.json` and must equal the installed package version.

Required action: code that accidentally relied on the broken `enableAll: false` behavior must remove that option or explicitly opt into the needed components under a future deliberately designed selective-enable API. This candidate does not interpret a component-level `true` as overriding the master disable.

Verification:

```js
const { UnifiedLuaScript } = require("luascript");
const system = new UnifiedLuaScript({ enableAll: false });
await system.initializationPromise;
console.log(system.getSystemStatus());
system.shutdown();
```

The reported component count should be zero and the version should match `require("luascript/package.json").version` while no future `exports` map is declared.

## Package Contents And Root Runtime

The candidate `files` list is:

- `src/`
- `test/`
- `examples/package/`
- `README.md`
- `LICENSE`

The packed `src/` tree now excludes Python bytecode/cache files, backups, nested source tests, and source-local prompt files. Generated artifacts, docs, archives, and root-level `runtime/` are absent.

Root-level `runtime/runtime.lua` and `runtime/core/enhanced_runtime.lua` are intentionally not added. Candidate root JavaScript imports do not require them. The deep `src/transpiler.js` and `src/luascript_compiler.py` routes that expect them remain non-public repository tools; promoting either route requires a separate installed-package contract and working runtime-path proof.

Required action: consumers must use the documented root package API. Do not depend on unpackaged root runtime helpers or deep Python/legacy source routes.

## Installed Examples

Old behavior: the package README pointed to repository-local `examples/` and
`tests/actual_programs/` material that the tarball did not ship.

Candidate behavior: only `examples/package/` is added to the tarball. Its two
executable examples import the package root and prove a small
`CoreTranspiler` workflow plus the `UnifiedLuaScript({ enableAll: false })`
contract. The wider repository examples and the 55-entry actual-program suite
remain local compiler evidence and are not package compatibility promises.

Required action: installed consumers should start with:

```bash
node node_modules/luascript/examples/package/transpile-js-to-lua.cjs
node node_modules/luascript/examples/package/minimal-system.cjs
```

Do not infer that repository-local `.ls`, mathematical, legacy-runtime, or
actual-program fixtures ship with the package.

## Repository Metadata

Repository, bugs, and homepage metadata now point to `ssdajoker/LUASCRIPT` rather than the stale `ssdajoker/LUAS` location. No code migration is required.

## Release Boundary

These changes ship in `luascript@1.0.1`, tag `v1.0.1`. The versioned local
release and GitHub release are authoritative distribution surfaces. npm
registry publication is not claimed because the package was previously
unpublished and this release host was not authenticated to npm.

Verify the installed-package boundary with `npm run test:package-contract` and
the complete release state with `npm run denali:rc:preflight`.
