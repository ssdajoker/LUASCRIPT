# LUASCRIPT Vision Audit

Last updated: 2026-04-30

## Current Answer

LUASCRIPT is staying true to the engineering vision: evidence-based support, live dogfood, canonical IR, strict gates, and no fake production claims.

It is beyond the original narrow scope because the bidirectional harness is turning the project into a small multi-language IR toolchain. That is useful only while it strengthens the LuaScript language and the JavaScript/`.ls` to Lua path.

It is still short of the language vision because `.ls` is currently a JS-like LuaScript slice, not a fully distinct language with a complete syntax spec, stable semantics, package/runtime model, and mature ecosystem.

## What Is LuaScript?

LuaScript is the project language and toolchain for compiling a supported JS-like `.ls` syntax into Lua, with canonical IR as the verification hub. The current practical identity is:

- Write focused `.ls` programs using the supported JS-like syntax.
- Compile them to Lua.
- Verify behavior through live Lua runtime execution.
- Keep unsupported syntax explicit through diagnostics instead of silent placeholder output.

## What Is Supported Now?

- JavaScript V1 Ring 2 medium-program slice through `npm run language:javascript:bidirectional`.
- LUASCRIPT `.ls` V1 Ring 2 JS-like medium-program slice through `npm run language:luascript:bidirectional`.
- Lua input V1 small-program slice through `npm run language:lua:bidirectional` and `npm run test:lua-input`.
- Python V1.2 small-program slice through `npm run language:python:bidirectional`.

The JavaScript and `.ls` Ring 2 slices include lexical closure state, nested object state, nested loops, loop `break`/`continue`, short-circuit side effects, and unsupported-feature diagnostics.

## What Is Intentionally Not Supported Yet?

- Full JavaScript.
- A complete distinct `.ls` language spec.
- Full Lua input beyond the documented V1 slice.
- Full Python beyond the V1.2 slice.
- Ruby, PHP, Dart, C#, Java, Elm, and Gleam runtime-qualified support.
- Unicode mathematical DSL syntax beyond quarantined design material.
- Production-ready multi-language claims based only on phase reports or parser/codegen snapshots.

## What Does 100% Mean?

100% means 100% of a named language slice and completion ring. It never means full-language support unless the full language has a declared spec and all rings pass live gates.

The rings are defined in `docs/LANGUAGE_COMPLETION_RULES.md`:

- Ring 1: small programs.
- Ring 2: medium programs.
- Ring 3: edge cases.
- Ring 4: unsupported diagnostics.
- Ring 5: docs/spec alignment.

## Direction Check

The next high-value work is not to add more language names. It is to deepen the verified JavaScript and `.ls` slices, then expand Lua input, then Python, and only then continue Ruby/PHP/Dart requalification when their runtimes and live gates are ready.
