## Objective
Establish a hybrid pipeline that keeps canonical IR as the source of truth and confines regex to tiny, well-defined post-emit patches until native IR support closes gaps.

## Current state
- Legacy regex transpiler still active; canonical IR pipeline exists but emitter lacks support for several constructs (template literals, for-of, classes, switch, nuanced brace grouping).
- Goldens exist for IR structure, but emitted-Lua goldens and LuaJIT execution coverage are limited.
- Docs overstate hybrid integration; regex and IR run separately.

## Proposed pipeline
1) Parse → normalize → canonical IR → emit Lua (primary path).
2) Optional micro regex post-pass (scoped): formatting-only patches where IR emission is temporarily incomplete.
3) LuaJIT execution of emitted Lua for golden fixtures and examples to assert runtime correctness.

## Workstream A: IR completeness
- Add emitter support: TemplateLiteral → string.format; ForOf → ipairs; ClassDeclaration/MethodDefinition → metatable+__index, constructors; Switch → if/elseif chain.
- Handle brace/statement grouping to avoid mis-converted ends.
- Update IR schema/validator if new metadata needed (minimal changes expected).

## Workstream B: Golden coverage
- Add IR goldens for the above constructs.
- Add emitted-Lua goldens (IR → Lua) for the same fixtures.
- Add LuaJIT execution tests for emitted Lua goldens (assert stdout/exit code).

## Workstream C: Test matrix
- Unit: emitter node-kind tests.
- Integration: IR parse+emit → LuaJIT for examples (hello, simple, simple_class, vector, mathematical_showcase).
- Parity: compare legacy output vs IR for selected legacy cases; gate via CI.

## Workstream D: Pipeline switch + fallbacks
- Make canonical IR the default path in transpiler; keep legacy regex only as post-pass for known gaps, behind a flag.
- Document fallback points and the toggle.
- Once emitters land and tests are green, remove legacy full pipeline.

## Workstream E: CI
- Add jobs: IR goldens validate; emit goldens validate; LuaJIT run of goldens and examples; parity check (temp) until legacy removed.
- Cache LuaJIT install or allow matrix with/without LuaJIT.

## Docs/status alignment
- Update README/PROJECT_STATUS/TODO to reflect: IR-primary pipeline; regex limited to post-emit patches; list remaining gaps and test commands (goldens, LuaJIT job).

## Risks/mitigations
- Emitter gaps: mitigate with feature-focused tests before switching default.
- LuaJIT availability: gate job or install in CI; provide skip flag locally.
- Behavior drift: rely on goldens + parity + LuaJIT runtime asserts.
