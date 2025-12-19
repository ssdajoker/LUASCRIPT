# Copilot Instructions

## Goals
- Keep IR pipeline deterministic, fast, and schema-aligned.
- Prefer edits that improve test visibility (harness, parity, validation) and agent/automation ergonomics.
- Default to non-breaking changes; guard new behavior with tests or feature flags when possible.

## Style and Practices
- JavaScript/TypeScript: favor small pure functions, explicit return values, and early validation.
- Lua emission: keep output minimal and stable; avoid unnecessary temporaries.
- Workflows: keep jobs additive/advisory unless explicitly required; surface artifacts in step summaries.
- Comments: only for intent or tricky code paths.

## Preferred APIs/Modules
- IR pipeline: use `parseAndLower`, `validateIR`, and `emitLuaFromIR` from `src/ir` helpers.
- Context packs: reuse `scripts/context_pack.js` helpers for instructions/endpoints/artifacts.
- Tests: extend `tests/ir/harness.test.js` or parity suites for IR behavior.

## Do Not Touch (without explicit approval)
- `src/ir/pipeline.js`, `src/ir/emitter.js`, and IR schema definitions except when tests demand and scope is agreed.
- Historical reports in `reports/` and golden fixtures in `tests/golden_ir/` unless regenerating with the approved workflow.
- Release metadata in `runtime_runtime.json` and `luascript` manifest blocks in `package.json`.

## Breadcrumb Trail Protocol (Async Coordination)

### When to Submit Work Items
After running tests, submit failures as work items for Gemini to handle:
1. **After harness runs** with failures (automatic in harness.test.js)
2. **After expanding parity suite** if new tests reveal gaps
3. **After discovering missing features** via commented-out test analysis

### Work Submission Context
Provide rich context for effective fixes:
- **Error message** and stack trace
- **Test case name** and source snippet
- **Expected vs actual** behavior description
- **Priority classification**:
  - `high`: Parse errors, missing IR node types, emitter crashes
  - `medium`: Semantic errors, optimization failures
  - `low`: Documentation gaps, warning cleanup

### Check Sync Status Before Testing
Avoid redundant work by checking agent activity:
```bash
curl http://localhost:8787/sync-status
```
If `geminiActive: true`, wait for work items to be completed before expanding tests.

### Work Queue Integration
Harness automatically POSTs to `/submit-work` on failures. For manual submissions:
```javascript
const response = await fetch('http://localhost:8787/submit-work', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'parse-error',
    priority: 'high',
    description: 'Spread in object literals not supported',
    context: { testCase: 'test_object_spread', error: err.message }
  })
});
```

### Coordination Workflow
1. **Expand test coverage** → uncomment or add test cases
2. **Run harness** → `npm run harness`
3. **Failures submitted** → work items created automatically
4. **Check sync-status** → wait for Gemini to claim/complete
5. **Validate fixes** → re-run harness after Gemini completes work
6. **Iterate** → expand more coverage or move to next feature

## Coordination
- See shared rules in [assistant_coordination.md](assistant_coordination.md) for Copilot + Gemini handoffs.
- **Work Queue**: Submit test failures to `/submit-work` (automatic in harness), check `/sync-status` before expanding tests.
- **Breadcrumb Trail**: Leave rich context in work items for Gemini (error messages, test cases, priority).
- If a change might alter emitted Lua shapes or IR structure, add/update a harness case and parity test, then note it in CI summaries.
- When adding automation, ensure artifacts remain in `artifacts/` and are referenced from workflow summaries.
- Update context packs after expanding tests: `npm run copilot:context`
