# CI/CD Troubleshooting
**Status**: ACTIVE  
**Phase**: Current  
**Last updated**: 2025-12-19

Common CI/CD issues and remedies.
- Lint gate fails: fix lint errors or scope lint to changed files temporarily.
- Verify gate fails: run 
pm run verify locally; check harness/parity/determinism output.
- Install issues: ensure 
pm ci uses the lockfile; clear npm cache if needed.
- Missing tools: Lua/LuaJIT for Lua-side tests; Node 18/20 for CI parity.

---
**Navigation**: ← CI/CD | ↑ Index | Next →
