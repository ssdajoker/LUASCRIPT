# Mathematical Operator Support

LUASCRIPT treats Unicode mathematical notation as first-class syntax. The
`EnhancedLexer` recognises the symbols listed below and the enhanced parser and
transpiler convert them into Lua code or runtime helper calls. This reference is
derived from `src/lexer/enhanced_lexer.py` and `src/transpiler/enhanced_transpiler.py`
so it reflects the symbols that are tokenised today along with their runtime
behaviour.

## Arithmetic and unary operators

| Symbol | Token type | Description | Lua emission / notes |
| ------ | ---------- | ----------- | ------------------- |
| `×` | `MULTIPLY_UNICODE` | Multiplication sign | Emits `*`. |
| `÷` | `DIVIDE_UNICODE` | Division sign | Emits `/`. |
| `−` | `MINUS_UNICODE` | Unary or binary minus | Emits `-`. |
| `±` | `PLUS_MINUS` | Plus-or-minus | Tokenised; generation support is planned. |
| `√` | `SQRT` | Square-root prefix operator | Emits `math.sqrt(...)`. |

## Comparison operators

| Symbol | Token type | Description | Lua emission / notes |
| ------ | ---------- | ----------- | ------------------- |
| `≤` | `LESS_EQUAL_UNICODE` | Less-than or equal | Emits `<=`. |
| `≥` | `GREATER_EQUAL_UNICODE` | Greater-than or equal | Emits `>=`. |
| `≠` | `NOT_EQUAL_UNICODE` | Not equal | Emits `~=` (Lua's not-equal). |
| `≈` | `APPROXIMATELY` | Approximately equal | Tokenised; lowering not implemented yet. |
| `∝` | `PROPORTIONAL` | Proportional to | Tokenised; lowering not implemented yet. |

## Set, logic, and composition operators

| Symbol | Token type | Description | Lua emission / notes |
| ------ | ---------- | ----------- | ------------------- |
| `∈` | `ELEMENT_OF` | Element-of test | Emits call to `_LS.math.element_of`. |
| `∉` | `NOT_ELEMENT_OF` | Not an element of | Tokenised; lowering not implemented yet. |
| `⊂` | `SUBSET` | Proper subset | Tokenised; lowering not implemented yet. |
| `⊃` | `SUPERSET` | Proper superset | Tokenised; lowering not implemented yet. |
| `∪` | `UNION` | Set union | Emits call to `_LS.math.union`. |
| `∩` | `INTERSECTION` | Set intersection | Emits call to `_LS.math.intersection`. |
| `∅` | `EMPTY_SET` | Empty set literal | Tokenised; lowering not implemented yet. |
| `∘` | `COMPOSITION` | Function composition | Tokenised; lowering not implemented yet. |
| `⊙` | `BINARY_COMPOSITION` | Binary composition / Hadamard product | Tokenised; lowering not implemented yet. |
| `λ` | `LAMBDA` | Lambda literal starter | Tokenised; lowering not implemented yet. |

## Calculus and summation symbols

| Symbol | Token type | Description | Lua emission / notes |
| ------ | ---------- | ----------- | ------------------- |
| `∑` | `SUMMATION` | Summation | Tokenised; lowering not implemented yet. |
| `∏` | `PRODUCT` | Product | Tokenised; lowering not implemented yet. |
| `∫` | `INTEGRAL` | Integral | Tokenised; lowering not implemented yet. |
| `∂` | `PARTIAL` | Partial derivative | Tokenised; lowering not implemented yet. |
| `∇` | `NABLA` | Gradient / divergence operator | Tokenised; lowering not implemented yet. |
| `Δ` | `DELTA` | Difference operator | Tokenised; lowering not implemented yet. |

## Directional arrows

| Symbol | Token type | Description | Lua emission / notes |
| ------ | ---------- | ----------- | ------------------- |
| `→` | `ARROW_RIGHT` | Right arrow | Tokenised; lowering not implemented yet. |
| `←` | `ARROW_LEFT` | Left arrow | Tokenised; lowering not implemented yet. |
| `⇒` | `ARROW_DOUBLE` | Double arrow | Tokenised; lowering not implemented yet. |
| `↔` | `ARROW_LEFT_RIGHT` | Bidirectional arrow | Tokenised; lowering not implemented yet. |

## Superscripts and subscripts

| Glyphs | Token type | Behaviour |
| ------ | ---------- | --------- |
| `⁰`–`⁹` | `SUPERSCRIPT_NUMBER` | Parsed as exponentiation. For example `x²` becomes `x ^ 2` in the emitted Lua. |
| `₀`–`₉` | `SUBSCRIPT_NUMBER` | Captured as part of identifier names (e.g. `x₁`) for downstream processing. |

These tokens pair with the mathematical constants handled by the same lexer
(`π`, `ℯ`, `φ`, `∞`) and enable LUASCRIPT programs to mirror textbook notation.
Where the transpiler does not yet implement a lowering rule, the symbol still
lexes cleanly and is reserved for future phases of the compiler pipeline.
