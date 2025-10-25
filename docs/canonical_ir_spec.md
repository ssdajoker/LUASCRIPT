# Canonical Intermediate Representation (IR) Specification

**Status:** v1.0.0 (October 13, 2025)
Schema (latest v1): docs/canonical_ir.schema.json
Schema (frozen 1.0.0): docs/schema/1.0.0/canonical_ir.schema.json
Versioning policy: docs/VERSIONING.md

## 🎯 Purpose

Provide a single, authoritative schema for the JavaScript → Lua (and future backend) transpilation pipeline. This document encodes the shared expectations captured in:

- `reports/canonical_ir_status.md` (audit findings, remediation plan)
- `META_OVERSIGHT.md` (META-TEAM responsibilities)
- `QUALITY_GATES_ENFORCEMENT.md` (daily/weekly acceptance criteria)
- `docs/audits/phase3_algorithms.md` (Knuth-led complexity review)

The canonical IR must:

1. **Enable provable correctness and complexity analysis** (Donald Knuth).
2. **Offer deterministic, inspectable architecture hooks** (Linus Torvalds).
3. **Remain developer-friendly and easy to extend** (Steve Jobs, Yukihiro Matsumoto).
4. **Support exhaustive automated validation** (Ada Lovelace).

---

## 🧭 Design Principles

| Principle | Source | Implication for IR |
|-----------|--------|-------------------|
| Formal rigor and proofs | Donald Knuth | Explicit node typing, semantic invariants, replayable lowering steps. |
| Robust architecture | Linus Torvalds | Immutable structural contract, versioned schema, deterministic serialization. |
| Delightful developer experience | Steve Jobs, Yukihiro Matsumoto | Human-readable JSON, ergonomic builder APIs, rich comments/tooling metadata. |
| Comprehensive testing | Ada Lovelace | Schema validation, golden snapshots, differential checks between backends. |

Additional cross-team expectations:

- **Parser integration**: `src/parser.js` / `src/language/parser.ts` lower into this IR before any backend codegen.
- **Backend parity**: Lua emitter, WASM backend, and future targets must consume the same IR nodes.
- **Auditability**: Each IR artifact carries trace metadata for tooling (`PerformanceTools`, audit scripts).

---

## 🧱 Top-Level Schema

Canonical IR artifacts are encoded as JSON (or a structurally identical in-memory graph) and versioned via `schemaVersion`. All nodes share a common base shape.

```json
{
  "schemaVersion": "1.0.0",
  "module": {
    "id": "mod_00001",
    "source": {
      "path": "examples/hello.js",
      "hash": "sha256:…"
    },
    "directives": ["use strict"],
  "body": ["NodeRef"],
    "exports": {
      "type": "named", // "commonjs", "esmodule", etc.
      "entries": [{ "name": "foo", "local": "id_42" }]
    },
    "metadata": {
      "authoredBy": "parser-lowerer",
      "createdAt": "2025-10-12T07:32:11.120Z",
      "toolchain": {
        "parser": "parser.js@5.4.0",
        "lowerer": "ir-lowerer@1.0.0"
      }
    }
  }
}
```

### Base Node Contract

All IR nodes extend the following structure:

```json
{
  "id": "id_12345",          // globally unique within module
  "kind": "FunctionDeclaration", // enum discriminator
  "span": {                    // original source range (UTF-16 indices)
    "start": { "line": 5, "column": 2, "offset": 89 },
    "end":   { "line": 12, "column": 1, "offset": 213 }
  },
  "flags": {                   // bitfield map (const, async, generator, etc.)
    "const": false,
    "async": false,
    "hoisted": true
  },
  "doc": {
    "leadingComments": ["/** adds two numbers */"],
    "trailingComments": []
  },
  "meta": {
    "typeHint": "(number, number) => number",
    "cfg": { "entry": "bb_5", "exit": "bb_9" },
    "auditTags": ["knuth:needs-proof"],
    "loweringTraceId": "trace_001ab"
  }
}
```

- **`flags`** supports cross-cutting annotations without expanding the node surface.
- **`meta.cfg`** references control-flow graph fragments (see below).
- **`meta.auditTags`** allow Donald Knuth / QA to flag nodes requiring proofs or extra review.

---

## 🧩 Node Families

### 1. Module-Level Nodes

| Kind | Fields | Notes |
|------|--------|-------|
| `ImportDeclaration` | `specifiers`: [{ `local`, `imported`, `type`: "default" or "named" or "namespace" }], `source`: string | Keep 1:1 with ES module semantics. |
| `ExportDeclaration` | `exported`: string, `local`: string, `declaration`: `NodeRef`?, `exportKind`: "named" / "default" | Handles re-export vs inline. |
| `TypeAlias` | `name`, `typeAnnotation` | Optional (future typed JS). |

### 2. Statement Nodes

| Kind | Core Fields |
|------|-------------|
| `BlockStatement` | `statements`: [`StatementNodeRef`] |
| `VariableDeclaration` | `declarations`: [{ `id`: `PatternNodeRef`, `init`: `ExpressionNodeRef`?, `kind`: "var" / "let" / "const" }] |
| `FunctionDeclaration` | `name`, `params`, `body`, `async`, `generator`, `returnType?` |
| `ClassDeclaration` | `name`, `superClass?`, `body`: [`ClassElementNodeRef`] |
| `IfStatement` | `test`, `consequent`, `alternate?` |
| `SwitchStatement` | `discriminant`, `cases`: [{ `test?`, `consequent`: [`StatementNodeRef`] }] |
| `ForStatement` | `init?`, `test?`, `update?`, `body` |
| `ForOfStatement` | `left`, `right`, `await` |
| `WhileStatement` | `test`, `body` |
| `DoWhileStatement` | `test`, `body` |
| `TryStatement` | `block`, `handler?`, `finalizer?` |
| `ReturnStatement` | `argument?` |
| `ThrowStatement` | `argument` |
| `BreakStatement` | `label?` |
| `ContinueStatement` | `label?` |

### 3. Expression Nodes

| Kind | Core Fields |
|------|-------------|
| `Identifier` | `name`, `binding`: `id_x` |
| `Literal` | `value`, `raw`, `literalKind`: "string"/"number"/"boolean"/"null"/"regex" |
| `BinaryExpression` | `operator`, `left`, `right` |
| `LogicalExpression` | `operator`, `left`, `right` |
| `AssignmentExpression` | `operator`, `left`, `right` |
| `UnaryExpression` | `operator`, `argument`, `prefix` |
| `UpdateExpression` | `operator`, `argument`, `prefix` |
| `ConditionalExpression` | `test`, `consequent`, `alternate` |
| `CallExpression` | `callee`, `arguments`, `optional`, `typeArguments?` |
| `MemberExpression` | `object`, `property`, `computed`, `optional` |
| `NewExpression` | `callee`, `arguments` |
| `ArrowFunctionExpression` | `params`, `body`, `async` |
| `ObjectExpression` | `properties`: [`PropertyNodeRef`] |
| `ArrayExpression` | `elements`: [`ExpressionNodeRef`] (nullable entries allowed) |
| `TemplateLiteral` | `quasis`, `expressions` |

### 4. Pattern & Misc Nodes

- `ObjectPattern`, `ArrayPattern`, `RestElement`, `AssignmentPattern`
- `ClassBody`, `MethodDefinition`, `Property`
- `ProgramComment` nodes for documentation retention (Matsumoto requirement).

---

## 🔁 Control-Flow Graph (CFG)

Consistent with Knuth’s request for provable control-flow reasoning, each function-like node references a CFG:

```json
{
  "cfg": {
    "id": "cfg_func_001",
    "blocks": [
      {
        "id": "bb_1",
        "kind": "entry",
        "statements": ["id_200", "id_201"]
      },
      {
        "id": "bb_2",
        "kind": "conditional",
        "condition": "id_205",
        "true": "bb_3",
        "false": "bb_4"
      }
    ],
    "successors": {
      "bb_1": ["bb_2"],
      "bb_2": ["bb_3", "bb_4"],
      "bb_3": ["bb_exit"],
      "bb_4": ["bb_exit"]
    },
    "predecessors": { … }
  }
}
```

- Blocks reference IR node IDs, ensuring traceability.
- Deterministic ordering satisfies Linus’ reproducibility demand.
- CFG serialization enables Ada’s automated validation harnesses.

---

## 🧪 Validation Strategy

1. **Schema Definition**: Publish JSON Schema at `docs/canonical_ir.schema.json`; use AJV (Node) + `jsonschema` (Python) for validation.  
2. **Golden Snapshots**: Commit canonical IR outputs in `tests/golden_ir/*.json` with diff-based regression checks.  
3. **Differential Backends**: Compare Lua emitter vs WASM backend outputs from the same IR to guarantee backend parity.  
4. **Proof Hooks**: `meta.auditTags` drive dashboards surfaced during Knuth’s weekly gates.  
5. **Performance Traces**: Embed `meta.perf` metrics (lowerer duration, node counts) for Linus’ system health checks.

### How to validate (CLI)

- JSON Schema only:
  - npm run -s ir:validate:schema
- Invariants + parsing path:
  - npm run -s ir:validate
- All IR checks (schema + invariants):
  - npm run -s ir:validate:all
- Check committed goldens:
  - npm run -s ir:golden:check
- Compare pipeline output to a subset of goldens (shape parity):
  - npm run -s ir:golden:parity
- Generate IR status report (used by CI reproducibility):
  - npm run -s ir:report
- Determinism guard (run report twice and diff):
  - npm run -s ir:repro

Schema URLs:

- Latest v1: docs/canonical_ir.schema.json
- Frozen v1.0.0: docs/schema/1.0.0/canonical_ir.schema.json

---

## 🛠️ Builder API Requirements

Expose `irBuilder` utilities (`src/ir/builder.js`) with the following ergonomics:

- Chained construction (`builder.program().addFunction(...)`).
- Automatic ID allocation + span propagation from parser AST.
- Immutable nodes to avoid mutation bugs (Torvalds requirement).
- Helpful error messages, inline docs, and code samples (Jobs/Matz requirement).

---

## 🔗 Parser → IR Lowering Contract

| Step | Responsibility | Output |
|------|----------------|--------|
| 1. Parse | `src/parser.js` | ESTree-compatible AST |
| 2. Normalize | `src/ir/normalizer.js` | Removes parser quirks, resolves scopes |
| 3. Lower | `src/ir/lowerer.js` | Canonical IR graph (this schema) |
| 4. Validate | `npm run ir:validate` | Schema + invariants |
| 5. Emit | `src/backends/lua/emitter.js`, `src/backends/wasm/emitter.js` | Target-specific code |

Lowering must be deterministic: same input JS yields byte-identical IR JSON.

---

## 📚 Example

```javascript
// input.js
export function add(a, b) {
  const result = a + b;
  return result;
}
```

```json
{
  "schemaVersion": "1.0.0",
  "module": {
    "id": "mod_add",
    "source": { "path": "input.js", "hash": "sha256:…" },
    "body": [
      {
        "id": "id_1",
        "kind": "ExportDeclaration",
        "exportKind": "named",
        "declaration": "id_2",
        "span": { … }
      },
      {
        "id": "id_2",
        "kind": "FunctionDeclaration",
        "name": "add",
        "params": [
          { "id": "id_3", "kind": "Identifier", "name": "a" },
          { "id": "id_4", "kind": "Identifier", "name": "b" }
        ],
        "body": "id_5",
        "meta": { "cfg": { "entry": "bb_entry", "exit": "bb_exit" } }
      }
    ],
    "blocks": [
      {
        "id": "id_5",
        "kind": "BlockStatement",
        "statements": ["id_6", "id_7"]
      },
      {
        "id": "id_6",
        "kind": "VariableDeclaration",
        "declarations": [
          {
            "id": "id_8",
            "pattern": "id_9",
            "init": "id_10",
            "kind": "const"
          }
        ]
      },
      {
        "id": "id_7",
        "kind": "ReturnStatement",
        "argument": "id_9"
      },
      {
        "id": "id_10",
        "kind": "BinaryExpression",
        "operator": "+",
        "left": "id_3",
        "right": "id_4"
      }
    ]
  }
}
```

### Additional examples

Arrow function (single-expression):

```json
{
  "schemaVersion": "1.0.0",
  "module": {
    "id": "mod_arrow",
    "body": ["id_fn", "id_ret"],
    "metadata": { "authoredBy": "example" }
  },
  "nodes": {
    "id_fn": {
      "id": "id_fn",
      "kind": "ArrowFunctionExpression",
      "params": ["id_a"],
      "body": "id_add"
    },
    "id_a": { "id": "id_a", "kind": "Identifier", "name": "a" },
    "id_b": { "id": "id_b", "kind": "Identifier", "name": "b" },
    "id_add": { "id": "id_add", "kind": "BinaryExpression", "operator": "+", "left": "id_a", "right": "id_b" },
    "id_ret": { "id": "id_ret", "kind": "ReturnStatement", "argument": "id_add" }
  }
}
```

Switch statement lowering (conceptual, represented as IfStatement chain):

```json
{
  "schemaVersion": "1.0.0",
  "module": { "id": "mod_switch", "body": ["id_if"] },
  "nodes": {
    "id_disc": { "id": "id_disc", "kind": "Identifier", "name": "x" },
    "id_lit1": { "id": "id_lit1", "kind": "Literal", "value": 1 },
    "id_test": { "id": "id_test", "kind": "BinaryExpression", "operator": "==", "left": "id_disc", "right": "id_lit1" },
    "id_if": { "id": "id_if", "kind": "IfStatement", "test": "id_test", "consequent": null, "alternate": null }
  }
}
```

### Additional Example: Conditional and Loop with Spans

```json
{
  "schemaVersion": "1.0.0",
  "module": {
    "id": "mod_ctrl",
    "source": { "path": "control.js", "hash": "sha256:…" },
    "body": ["id_1", "id_2"],
    "directives": [],
    "exports": { "type": "named", "entries": [] }
  },
  "nodes": {
    "id_1": {
      "id": "id_1",
      "kind": "IfStatement",
      "test": "id_3",
      "consequent": "id_4",
      "alternate": null,
      "span": { "start": {"line":1,"column":0,"offset":0}, "end": {"line":3,"column":1,"offset":42} }
    },
    "id_2": {
      "id": "id_2",
      "kind": "WhileStatement",
      "test": "id_5",
      "body": "id_6",
      "span": { "start": {"line":4,"column":0,"offset":43}, "end": {"line":6,"column":1,"offset":88} }
    }
  }
}
```

Span fields must include start/end with numeric line, column, and offset fields. Validators should ensure shape-correct spans when present, and function nodes’ `meta.cfg` entries must reference CFGs that exist with valid entry/exit blocks.

### Additional Example: Function with CFG and meta.perf

```json
{
  "schemaVersion": "1.0.0",
  "module": {
    "id": "mod_cfg",
    "source": { "path": "cfg.js", "hash": "sha256:…" },
    "body": ["id_fn"],
    "metadata": { "metaPerf": { "parseMs": 0.22, "normalizeMs": 0.11, "lowerMs": 0.35, "totalMs": 0.68, "nodeCount": 12 } }
  },
  "nodes": {
    "id_fn": {
      "id": "id_fn",
      "kind": "FunctionDeclaration",
      "name": "f",
      "params": [],
      "body": "id_blk",
      "meta": { "cfg": { "id": "cfg_f", "entry": "bb_1", "exit": "bb_exit" } }
    },
    "id_blk": { "id": "id_blk", "kind": "BlockStatement", "statements": [] }
  },
  "controlFlowGraphs": {
    "cfg_f": {
      "id": "cfg_f",
      "blocks": [
        { "id": "bb_1", "kind": "entry", "statements": [] },
        { "id": "bb_exit", "kind": "exit", "statements": [] }
      ]
    }
  }
}
```

Validator invariants (non-exhaustive):

- All `module.body` entries must reference existing `nodes` by id.
- All `nodes` ids must match the balanced-ternary id format.
- If a `span` is present, it must include numeric `start` and `end` with `line`, `column`, `offset`.
- `FunctionDeclaration.meta.cfg` must reference an existing CFG; `entry` and `exit` must exist in that CFG’s `blocks`.
- Node `kind` must be one of the allowed enumerations in this draft; unknown kinds should fail validation.

---

## 📍 Open Questions

1. **Type System**: Align with TypeScript parser output (`src/language/parser.ts`). Proposal: optional `meta.types` referencing gradual type annotations.
2. **Decorators / Stage-3 Features**: Extend node set or use `meta.experimental` bag.
3. **Macro & Preprocessing Hooks**: Determine whether macros produce IR nodes or operate as AST transforms pre-lowering.
4. **Dataflow Facts**: Evaluate storing SSA form vs. computing on demand. Knuth requests proofs; SSA would ease verification but increases complexity.

---

## ✅ Acceptance Checklist (per META-TEAM)

- **Donald Knuth**: Complexity proofs attached to lowering invariants, CFG exported, golden IR reviewed weekly.
- **Linus Torvalds**: Deterministic serializer, `npm run ir:validate` in CI, schema version bump policy documented.
- **Ada Lovelace**: 95%+ test coverage for lowering + emitters, property-based tests for random JS fixtures.
- **Steve Jobs**: Developer docs published in `/docs`, quickstart added to README, `irBuilder` API has examples.

---

## 📆 Next Steps

1. Implement `src/ir/` scaffolding (builder, normalizer, schema validator).
2. Wire parser output into lowerer (`src/parser.js` → IR).
3. Update Lua / WASM emitters to consume canonical IR.
4. Add CI jobs: `npm run ir:lint`, `npm run ir:test`.
5. Present schema to META-TEAM for sign-off (record meeting notes in `reports/ir_signoff_2025-10-xx.md`).
