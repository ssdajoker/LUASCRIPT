# CLARITY SUPER CANON - Implementation Plan

## Phase 1: Exception Handling Refactor ✓
**Goal**: Separate Catch and Finally into independent nodes for better cross-language support

### Changes:
1. **IR Nodes** (`src/ir/nodes.js`):
   - Add `FinallyClause` node class (separate from CatchClause)
   - Update TryStatement to reference separate catch/finally node IDs
   - Add NodeCategory.FINALLY

2. **IR Builder** (`src/ir/builder.js`):
   - Add `finallyClause(body, options)` method
   - Update `tryStatement(block, handlers, finalizer, options)` to support multiple catch clauses

3. **Lowerer** (`src/ir/try_lowerer.js`):
   - Update to create separate FinallyClause nodes
   - Support multiple catch handlers (language-specific)

4. **Validation** (`src/validation/ir-validator.js`):
   - Add validation for FinallyClause
   - Validate TryStatement structure

## Phase 2: Standardized Import/Export ✓
**Goal**: Unified import/export across JavaScript, TypeScript, Python, Ruby, Java, Dart

### Changes:
1. **IR Nodes** (`src/ir/nodes.js`):
   - Add `ImportDeclaration` node class
   - Add `ExportDeclaration` node class
   - Add `ImportSpecifier`, `ExportSpecifier` support
   - Support: default, named, namespace imports

2. **IR Builder** (`src/ir/builder.js`):
   - Add `importDeclaration(specifiers, source, options)`
   - Add `exportDeclaration(specifiers, declaration, options)`
   - Add `importSpecifier(local, imported, options)`
   - Add `exportSpecifier(local, exported, options)`

3. **Parser Updates**:
   - Update TypeScript parser
   - Update Ruby parser (require/load)
   - Update Python parser (import/from)
   - Update Java parser (import)

## Phase 3: Validation Layer Enhancement ✓
**Goal**: Comprehensive validation for AST and IR

### Changes:
1. **AST Validator** (`src/validation/ast-validator.js`):
   - Add `visitImportDeclaration`
   - Add `visitExportDeclaration`
   - Add `visitFinallyClause`
   - Enhanced error messages

2. **IR Validator** (`src/validation/ir-validator.js`):
   - Add `validateImportDeclaration`
   - Add `validateExportDeclaration`
   - Add `validateFinallyClause`
   - Add `validateTryStatement` enhancement

3. **New Validator** (`src/validation/semantic-validator.js`):
   - Semantic analysis (scope, types, undefined references)
   - Cross-reference validation
   - Duplicate detection

## Phase 4: Test Suite Extension ✓
**Goal**: Comprehensive test coverage for all new features

### Test Files:
1. `tests/clarity_super_canon_exception_handling.js` - Exception handling tests (42 tests)
2. `tests/clarity_super_canon_import_export.js` - Import/export tests (48 tests)
3. `tests/clarity_super_canon_validation.js` - Validation tests (36 tests)
4. `tests/ruby_clarity_super_canon_complete.js` - Ruby parser complete tests (60 tests)

### Coverage Targets:
- Exception handling: 100% coverage
- Import/export: 100% coverage across all languages
- Validation: 100% error path coverage
- Ruby parser: 100% syntax coverage

## Phase 5: Ruby Parser Completion ✓
**Goal**: 100% passing Ruby parser with full language support

### Changes:
1. **Ruby Parser** (`src/parsers/ruby_parser.js`):
   - Complete class/module parsing
   - Complete block/proc/lambda support
   - Complete symbols and string interpolation
   - Complete exception handling (begin/rescue/ensure/raise)
   - Complete iterators (each, map, select, etc.)

2. **Ruby-specific IR nodes**:
   - Symbol literals
   - Hash literals with => syntax
   - String interpolation
   - Regex literals

## Execution Strategy
1. Implement Phase 1 (Exception Handling)
2. Implement Phase 2 (Import/Export)
3. Implement Phase 3 (Validation)
4. Create Phase 4 (Test Suite)
5. Complete Phase 5 (Ruby Parser)
6. Execute all tests
7. Verify 100% pass rate

## Success Criteria
- ✅ All new IR nodes implemented
- ✅ All validation rules functional
- ✅ All tests passing (186 new tests)
- ✅ Ruby parser at 100% completion
- ✅ Documentation complete
- ✅ Zero regressions in existing tests
