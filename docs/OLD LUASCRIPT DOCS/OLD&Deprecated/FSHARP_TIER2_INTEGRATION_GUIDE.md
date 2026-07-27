# F# Tier 2 Integration Guide

## Overview
This guide documents the Tier 2 elevation changes for the F# Phase C pipeline. It covers semantic validation hooks, nested computation expression modeling, ForensicDebugTools integration, and test coverage expansion.

## What Changed
- **Nested computation expressions** are now modeled as nested AST nodes instead of flattened strings.
- **Type provider syntax errors** (e.g., missing `>`) are surfaced in diagnostics.
- **Overlapping partial active patterns** emit warnings for duplicate/overlapping cases.
- **Units of measure** now track declared/used measures and warn on undeclared usage.
- **DU exhaustiveness** emits warnings when matches omit union cases.
- **ForensicDebugTools** is integrated in parser loops and computation expression generation.
- **Generator profiling hooks** record generation timing and CE translation time.

## Diagnostics
Diagnostics are available on `ast.metadata.diagnostics`:
- `errors`: hard parse errors or malformed constructs
- `warnings`: semantic validation warnings

Measure tracking is available on `ast.metadata.measures`:
- `defined`: measures declared with `[<Measure>] type ...`
- `used`: measures referenced via `<m>` suffixes

## ForensicDebugTools Integration
Pass `forensicMode` or a `forensicDebugTools` instance to enable diagnostics:
- **Parser**: iteration tracking for main parse loop and sub-loops
- **Generator**: timeout + iteration tracking in computation expression translation

Example configuration (pseudocode):
- `new FSharpParser({ forensicMode: 'development' })`
- `new FSharpGenerator({ forensicMode: 'validation' })`

## Tests
New Tier 2 semantic edge case tests were added in:
- [src/phase_c/tests/fsharp_forensic_edge_cases.js](src/phase_c/tests/fsharp_forensic_edge_cases.js)

These tests validate:
- Nested CE modeling
- Type provider syntax errors
- Partial active pattern overlap warnings
- Measure declaration/usage validation
- DU exhaustiveness warnings

## Run Commands
Use the existing test runners in this repo to execute:
- F# Phase C tests
- F# forensic edge cases

Refer to [README.md](README.md) for the standard test execution workflow.
