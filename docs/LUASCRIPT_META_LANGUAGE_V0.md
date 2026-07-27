# LuaScript Meta-Language V0

Status: active V0.16 slice

Living-language direction and next slices are tracked in [LUASCRIPT_LIVING_META_LANGUAGE.md](LUASCRIPT_LIVING_META_LANGUAGE.md).

LuaScript `.ls` is a hybrid surface:

- The current executable JS-like LuaScript subset remains valid.
- A top-level `meta { ... }` block declares compile-time target policy.
- A top-level `verify { ... }` block declares fixture-level expectations.
- A top-level `repair { ... }` block declares canonical lowering repairs for target emitters.
- Compile-time blocks are stripped from runtime output and must not emit Lua statements.
- `verify` can also assert parser-owned feature slices, so a `.ls` file can fail fast if the language stops recognizing the syntax it depends on or starts depending on a forbidden syntax slice.

Only top-level compile-time blocks before executable statements are supported in V0.16.

The current active additions inside that V0.16 lane are:

- `meta profile portable_v1;` for a reusable cross-target contract.
- named diagnostics such as `async_unsupported` and `lua_continue_no_compatible_lowering`.
- emitted-helper repair assertions such as `lua_repair` and `python_repair`.
- explicit `.ls` target-policy assertions via `ls_policy` and `ls_not_policy`.
- explicit profile assertions via `profile`, `no_profile`, `implicit_profile`, and `no_implicit_profile`.
- profile composition with local override blocks, with explicit conflict failure on incompatible policy.

## Syntax

```ls
verify {
  stdout "meta_continue 8";
  feature "for-of";
  no_feature "classes";
  profile "portable_v1";
  no_profile "portable_runtime_v1";
  implicit_profile "portable_semantics_v1";
  no_implicit_profile "portable_v1";
  diagnostic "async_unsupported";
  lua_stdout "meta_continue 8";
  js_stdout "meta_continue 8";
  python_stdout "meta_continue 8";
  ls_stdout "meta_continue 8";
  lua_runtime_error "missingFunction";
  js_runtime_error "missingFunction";
  python_runtime_error "missingFunction";
  ls_runtime_error "missingFunction";
  lua_policy "adapters.indexing=zero_based";
  lua_not_policy "adapters.multiple_returns";
  lua_repair "indexing=zero_based";
  js_policy "requires=js.console";
  js_not_policy "adapters.multiple_returns";
  python_policy "requires=python.print";
  python_not_policy "resolve.continue=label_goto";
  python_repair "indexing=zero_based";
  ls_policy "forbid=js.prototype";
  ls_not_policy "resolve.continue=label_goto";
  lua_contains "_LS.index(";
  lua_not_contains "meta {";
  js_contains "console.log";
  js_not_contains "_LS.";
  python_contains "__ls_truthy";
  python_contains "__ls_index";
  python_contains "__ls_slice";
  python_not_contains "meta {";
  ls_contains "console.log";
  ls_not_contains "local ";
}

meta profile portable_v1;

meta {
  target lua {
    requires lua.goto;
    forbid js.prototype;
    resolve continue using label_goto;
    adapt indexing using zero_based;
    adapt length using array_length_property;
    adapt slicing using runtime_slice;
    adapt truthiness using js_truthy;
    adapt string_coercion using explicit_tostring;
    adapt multiple_returns using packed_array;
    diagnose async as unsupported "async is not supported in LuaScript V0";
  }

  target javascript {
    requires js.console;
    forbid js.prototype;
    resolve continue using native_continue;
    adapt truthiness using js_truthy;
  }

  target python {
    requires python.print;
    forbid python.imports;
    adapt indexing using zero_based;
    adapt length using array_length_property;
    adapt slicing using runtime_slice;
    adapt truthiness using js_truthy;
    adapt string_coercion using explicit_tostring;
    adapt multiple_returns using packed_array;
  }

  target luascript {
    requires js.console;
    forbid js.prototype;
    resolve continue using native_continue;
    adapt indexing using zero_based;
    adapt length using array_length_property;
    adapt slicing using runtime_slice;
    adapt truthiness using js_truthy;
    adapt string_coercion using explicit_tostring;
    adapt multiple_returns using packed_array;
  }
}

repair {
  target lua {
    lower indexing using zero_based;
    lower length using array_length_property;
    lower slicing using runtime_slice;
    lower truthiness using js_truthy;
    lower string_coercion using explicit_tostring;
    lower multiple_returns using packed_array;
  }

  target python {
    lower slicing using runtime_slice;
    lower multiple_returns using packed_array;
  }
}
```

## Policy Object

The compiler and language-completion harness attach policies in this shape:

```json
{
  "profiles": ["portable_v1"],
  "targets": {
    "lua": {
      "requires": ["lua.goto"],
      "forbid": ["js.prototype"],
      "resolve": {
        "continue": "label_goto"
      },
      "adapters": {
        "indexing": "zero_based",
        "length": "array_length_property",
        "slicing": "runtime_slice",
        "truthiness": "js_truthy",
        "string_coercion": "explicit_tostring",
        "multiple_returns": "packed_array"
      },
      "repairs": {
        "indexing": "zero_based",
        "length": "array_length_property",
        "slicing": "runtime_slice",
        "truthiness": "js_truthy",
        "string_coercion": "explicit_tostring",
        "multiple_returns": "packed_array"
      },
      "diagnostics": {
        "async": "async is not supported in LuaScript V0"
      }
    },
    "javascript": {
      "requires": ["js.console"],
      "forbid": ["js.prototype"],
      "resolve": {
        "continue": "native_continue"
      },
      "adapters": {
        "truthiness": "js_truthy"
      }
    },
    "python": {
      "requires": ["python.print"],
      "forbid": ["python.imports"],
      "adapters": {
        "indexing": "zero_based",
        "length": "array_length_property",
        "slicing": "runtime_slice",
        "truthiness": "js_truthy",
        "string_coercion": "explicit_tostring",
        "multiple_returns": "packed_array"
      },
      "repairs": {
        "slicing": "runtime_slice",
        "multiple_returns": "packed_array"
      }
    },
    "luascript": {
      "requires": ["js.console"],
      "forbid": ["js.prototype"],
      "resolve": {
        "continue": "native_continue"
      },
      "adapters": {
        "indexing": "zero_based",
        "length": "array_length_property",
        "slicing": "runtime_slice",
        "truthiness": "js_truthy",
        "string_coercion": "explicit_tostring",
        "multiple_returns": "packed_array"
      }
    }
  }
}
```

## Supported V0.16 Policies

Current supported `.ls` identity is a verified JS-like executable slice plus a top-level keyword-block meta layer: `meta`, `repair`, and `verify`. It is not yet a full distinct general-purpose language spec.

Current supported `.ls` profile set:

- `portable_semantics_v1` is the implicit executable baseline for raw `.ls`.
- `portable_semantics_v1` is also a supported explicit profile when a file wants to name the semantic-adapter contract.
- `portable_v1` is the supported explicit cross-target policy profile.

No other profile names are supported in V0.16. Explicit profiles are not the same thing as implicit profiles: `verify { profile "..."; }` checks declared profiles, while `verify { implicit_profile "..."; }` checks the default baseline profile set.

- `meta profile portable_v1`: expands the named portable contract for Lua, JavaScript, Python, and emitted `.ls`.
- `meta profile portable_semantics_v1`: expands the shared semantic-adapter contract for indexing, length, slicing, truthiness, string coercion, and packed multiple returns across Lua, JavaScript, Python, and emitted `.ls`.
- `target lua`, `target javascript`, `target python`, and `target luascript`: the current valid compile-time policy targets.
- `requires lua.goto`: records and validates that the Lua target may use `goto`; `resolve continue using label_goto` requires this capability.
- `requires js.console`: records that JavaScript emission/runtime expectations depend on console output support.
- `requires python.print`: records that Python emission/runtime expectations depend on `print`.
- `forbid js.prototype`: fails if executable `.ls` source uses JavaScript prototype access.
- `forbid lua.goto`: fails if Lua emission would need `goto` and also suppresses unnecessary loop labels when no `continue` is present.
- `forbid python.imports`: records that Python target policy must not depend on import support in the current slice.
- `resolve continue using label_goto`: uses loop-local Lua labels and `goto` for `continue`.
- `resolve continue using native_continue`: records native `continue` handling for JavaScript and Python targets.
- `adapt indexing using zero_based`: lowers computed reads and writes such as `items[0]` through runtime helpers so `.ls` keeps JS-style zero-based indexing on Lua and emits explicit `__ls_index`/`__ls_set_index` calls for Python target proof.
- `adapt length using array_length_property`: lowers `.length` on arrays, tables, and strings through runtime helpers on Lua and `len(...)` on Python.
- `adapt slicing using runtime_slice`: lowers `.slice(start, end)` through runtime helpers for arrays and strings on Lua and emitted Python.
- `adapt truthiness using js_truthy`: lowers branch conditions, loop conditions, ternaries, unary `!`, and short-circuit `&&`/`||` through JS-style truthiness helpers for Lua and emitted Python. JavaScript keeps native JS truthiness.
- `adapt string_coercion using explicit_tostring`: emits explicit mixed scalar string/number/boolean/null `+` handling for Lua and emitted Python. Python uses `__ls_add` plus `__ls_to_string` while preserving numeric addition when neither side is a string.
- `adapt multiple_returns using packed_array`: enables `many(a, b, ...)` as a packed array-like return value.
- `diagnose async as unsupported "..."`: replaces the generic parser failure with the configured diagnostic when `async` appears in executable source.
- `repair { target <target> { lower <feature> using <strategy>; } }`: declares canonical lowering repairs for the named target. V0.16 preserves those policies for Lua, JavaScript, and Python repair-block targets; Lua repairs are currently the broadest runtime-enforced repair path, with Python multiple-return repairs now executable for `many(...)`.

Native parser repair blocks currently support the active repair target set used by the language-completion harness. Emitted `.ls` repair identity is verified through profile policy plus `ls_repair` assertions, not through `repair { target luascript { ... } }` in this slice.

Known adapter and repair names are `indexing`, `length`, `slicing`, `truthiness`, `string_coercion`, and `multiple_returns`. V0.16 implements each of those as Lua-target runtime behavior for the current JS-like executable slice, implements Python-target JS truthiness through emitted `__ls_truthy`, `__ls_and`, and `__ls_or` helpers, implements Python-target indexing/assignment through `__ls_index` and `__ls_set_index`, implements Python-target `.length` through `len(...)`, implements Python-target `.slice(...)` through `__ls_slice`, implements Python-target mixed scalar string coercion through `__ls_add` and `__ls_to_string`, implements Python-target packed multiple returns by emitting `many(...)` as a Python list, and preserves the remaining cross-target policy metadata for JavaScript, Python, and emitted `.ls`. `portable_semantics_v1` is the first profile dedicated to reusing that semantic-adapter set without repeating per-target declarations in every fixture.

`multiple_returns using packed_array` intentionally normalizes multiple values into one array-like object. It does not expose raw Lua multi-value propagation yet.

Unknown targets, capabilities, strategies, diagnostic features, adapter features, adapter strategies, repair features, repair strategies, or diagnostic statuses fail compilation with explicit diagnostics.

## Embedded Verification

V0.16 supports these top-level verification assertions:

- `verify { stdout "..."; }`: the language-completion harness uses the value as expected stdout when the manifest does not provide one.
- `verify { diagnostic "..."; }`: the language-completion harness uses the value as expected diagnostic text for expected-failure fixtures.
- `verify { feature "..."; }`: the parser artifact must contain the named feature slice, such as `for-of`, `math-binders`, `pipelines`, `ranges`, `meta-blocks`, `repair-blocks`, or `verify-blocks`.
- `verify { no_feature "..."; }`: the parser artifact must not contain the named feature slice. This is useful for preventing examples from quietly relying on classes, try/catch, or other slices that should remain outside a fixture.
- `verify { profile "..."; }`: the active explicit meta profile set must contain the named profile.
- `verify { no_profile "..."; }`: the active explicit meta profile set must not contain the named profile.
- `verify { implicit_profile "..."; }`: the active implicit profile set must contain the named profile.
- `verify { no_implicit_profile "..."; }`: the active implicit profile set must not contain the named profile.
- `verify { lua_stdout "..."; }`: the language-completion harness uses the value as the exact expected stdout for emitted Lua runtime execution.
- `verify { js_stdout "..."; }`: the language-completion harness uses the value as the exact expected stdout for emitted JavaScript runtime execution.
- `verify { python_stdout "..."; }`: the language-completion harness uses the value as the exact expected stdout for emitted Python runtime execution.
- `verify { ls_stdout "..."; }`: the language-completion harness uses the value as the exact expected stdout for native and emitted `.ls` runtime execution.
- `verify { lua_runtime_error "..."; }`: the language-completion harness requires emitted Lua runtime execution to fail nonzero with matching diagnostic text.
- `verify { js_runtime_error "..."; }`: the language-completion harness requires emitted JavaScript runtime execution to fail nonzero with matching diagnostic text.
- `verify { python_runtime_error "..."; }`: the language-completion harness requires emitted Python runtime execution to fail nonzero with matching diagnostic text.
- `verify { ls_runtime_error "..."; }`: the language-completion harness requires native and emitted `.ls` runtime execution to fail nonzero with matching diagnostic text.
- `verify { lua_policy "path=value"; }`: the language-completion harness requires the Lua target policy object to contain the given path/value assertion. Array-valued paths such as `requires=lua.goto` and object paths such as `adapters.indexing=zero_based` are supported.
- `verify { lua_not_policy "path=value"; }`: the language-completion harness requires the Lua target policy object not to contain the given path/value assertion. Omitting `=value` checks only path presence or absence.
- `verify { js_policy "path=value"; }` / `verify { js_not_policy "path=value"; }`: the same policy presence/absence assertion for the JavaScript target policy object.
- `verify { python_policy "path=value"; }` / `verify { python_not_policy "path=value"; }`: the same policy presence/absence assertion for the Python target policy object.
- `verify { ls_policy "path=value"; }` / `verify { ls_not_policy "path=value"; }`: the same policy presence/absence assertion for the emitted `.ls` target policy object.
- `verify { lua_repair "feature=strategy"; }` / `verify { python_repair "feature=strategy"; }` / `verify { js_repair "feature=strategy"; }` / `verify { ls_repair "feature=strategy"; }`: the language-completion harness requires matching repair-capable target policy, target-specific stdout proof, and emitted helper evidence where the current target has helper markers.
- `verify { lua_contains "..."; }`: the language-completion harness requires emitted Lua output to contain the given text.
- `verify { lua_not_contains "..."; }`: the language-completion harness requires emitted Lua output not to contain the given text.
- `verify { js_contains "..."; }`: the language-completion harness requires emitted JavaScript output to contain the given text.
- `verify { js_not_contains "..."; }`: the language-completion harness requires emitted JavaScript output not to contain the given text.
- `verify { python_contains "..."; }`: the language-completion harness requires emitted Python output to contain the given text.
- `verify { python_not_contains "..."; }`: the language-completion harness requires emitted Python output not to contain the given text.
- `verify { ls_contains "..."; }`: the language-completion harness requires emitted `.ls` output to contain the given text.
- `verify { ls_not_contains "..."; }`: the language-completion harness requires emitted `.ls` output not to contain the given text.

Verification blocks are not executable code and do not appear in emitted runtime output. Feature assertions are evaluated against the parser-owned artifact before transpilation so the source itself carries a small self-audit contract.

Named diagnostics currently recognized by `verify { diagnostic "..." }` are:

- `async_unsupported`
- `lua_continue_no_compatible_lowering`
- `js_prototype_forbidden`

## Current Boundaries

- Canonical repair blocks are supported for Lua, JavaScript, and Python policy metadata. Lua repairs are currently the broadest runtime-enforced path; Python now runtime-enforces multiple-return repairs when `lower multiple_returns using packed_array` is declared.
- The Python target currently runtime-enforces `adapt truthiness using js_truthy`, `adapt indexing using zero_based`, `adapt length using array_length_property`, `adapt slicing using runtime_slice`, `adapt string_coercion using explicit_tostring`, and `adapt multiple_returns using packed_array`. Other Python adapters and repairs remain metadata until they have live target execution fixtures.
- Multiple returns are supported only through `many(...)` packed-array normalization.
- Capability negotiation now constrains the current Lua `continue` lowering path and records target-specific JavaScript/Python capabilities; it is still not automatic target selection.
- Profile names outside `portable_v1` and `portable_semantics_v1` are unsupported, and explicit profile declarations remain distinct from the implicit `portable_semantics_v1` executable baseline.
- `meta_identity_contract_portable_slice.ls` is the current identity-contract fixture for the V0.16 lane. It composes only existing supported profiles, proves Lua/JavaScript/Python/emitted-`.ls` stdout, asserts `meta`/`repair`/`verify`/profile feature slices, and excludes classes, for-of, try/catch, and template literals for that fixture.
- The `.ls` language is not yet a full distinct general-purpose spec; it is a verified executable JS-like slice plus a compile-time meta layer.
- Meta-language examples count as supported examples only when a current manifest, target runtime proof, docs boundary, and `claims:check` assertion name the slice. Full Unicode DSL material, broad multi-language demos, and unsupported profile names remain outside first-pass canonical `1.0` examples.
- Runtime proof is target-specific: `*_stdout` and `*_runtime_error` assertions execute the named target lane, while policy-only target-runtime metadata does not become native runtime support without a passing `language:<name>:bidirectional` gate.

## Verification

- `npm run test:luascript-meta`
- `npm run language:luascript:bidirectional`
- `npm run clarity:dogfood`

The V0.16 fixtures prove that files without meta blocks still run, compile-time blocks do not appear in emitted Lua, `continue` resolution runs on Lua only when `lua.goto` is required, `forbid lua.goto` blocks continue lowering and permits no-goto loops, embedded stdout, diagnostic, parser-feature, profile-presence, Lua/JavaScript/Python/`.ls` emitted-output verification, target-specific runtime stdout expectations, target-specific runtime-failure expectations, and Lua/JavaScript/Python policy assertions are honored, emitted `.ls` preserves cross-target policy blocks, semantic adapters and canonical repair blocks execute for zero-based indexing, `.length`, `.slice`, JS truthiness, string coercion, and packed multiple returns on Lua, Python target JS truthiness executes through emitted helpers for conditions, loop conditions, ternaries, unary `!`, and short-circuit `&&`/`||`, Python target indexing/assignment, `.length`, `.slice(...)`, string coercion, and packed multiple returns execute through emitted helpers, `len(...)`, or list emission, the identity-contract fixture binds supported profiles to feature/no-feature assertions and dogfood runtime proof, capability negotiation fails on forbidden prototype access, configured async diagnostics fire, feature-slice and profile-assertion mismatches fail clearly, and unknown meta/repair policies fail clearly.
