# Layer 5: Modern JS 2020+ - Implementation Plan

## Overview
Optional chaining (?.), nullish coalescing (??), BigInt support

## What needs to be done:
1. Review the transpiler codebase in src/
2. Identify which modules handle: test:modern
3. Implement transformations for: Modern JS 2020+
4. Create/enhance test files to verify behavior
5. Run tests until all pass

## Current status:
- Tests: test:modern
- Target coverage: HIGH priority
- Deadline: This overnight session

## Test command to verify:
\\\ash
npm run harness && npm run ir:validate:all && npm run test:modern
\\\

## Implementation guidance:
- Focus on making test stubs into real, failing tests
- Then implement transpiler features to make them pass
- Each feature should map to a specific transpiler module
- Verify with \
pm run harness\ after each change

## Files likely needing changes:
- src/transpiler.js (main logic)
- src/ir/ (intermediate representation)
- src/transforms/ (language transformations)
- tests/ (test cases)
