# Quick Start
**Status**: ACTIVE  
**Phase**: Current  
**Last updated**: 2025-12-19

Get set up, run a transpilation, and verify locally.

## Install
1) Clone and cd into the repo.  
2) Install deps: 
pm ci  
3) Optional: install Lua/LuaJIT if running Lua-side tests/benchmarks.

## First transpilation / sanity
- Run 
pm run harness to exercise the IR pipeline on core cases.  
- Run 
pm run verify for the full local gate (harness + IR validate + parity + determinism).  
- Quick manual transpile (example):
  `ash
  echo "function add(x,y){ return x+y; }" > /tmp/demo.js
  npm run harness
  `
- To see golden IR comparisons: 
pm run ir:emit:goldens (optional).

## Common tasks
- Full tests: 
pm test
- Parity only: 
pm run test:parity
- IR validation: 
pm run ir:validate:all
- Coverage: 
pm run test:coverage

## Need more?
- Troubleshooting: see ../development/troubleshooting.md
- CI/CD details: see ../ci-cd/README.md

---
**Navigation**: ← Home | ↑ Index | Next →
