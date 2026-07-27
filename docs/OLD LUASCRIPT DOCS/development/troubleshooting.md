# Troubleshooting
**Status**: ACTIVE  
**Phase**: Current  
**Last updated**: 2025-12-19

Common issues and remedies.
- Lint failures: run 
pm run lint; if tooling missing, 
pm install. If backlog is large, scope lint or fix incrementally.
- Determinism/IR errors: run 
pm run verify to reproduce locally; check src/ir/nodes.js serialization and 	ests/ir/determinism.test.js.
- CI red due to lint backlog: see ../ci-cd/README.md for current gates; consider scoping lint to changed files temporarily.
- Missing status clarity: refer to ../../PROJECT_STATUS.md (canonical).
- Suspected flake: rerun 
pm run harness and 
pm run test:parity to isolate.
- Missing Lua deps: ensure Lua/LuaJIT is installed if Lua-side tests/benchmarks are used.

---
**Navigation**: ← Development | ↑ Index | Next →
