# Canonical Intermediate Representation (IR) Specification

**Status:** Draft (October 12, 2025)

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
