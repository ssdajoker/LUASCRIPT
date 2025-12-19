# Essential Context Files for Gemini

## 🎯 Priority Files for Current Task (Async Function Parsing)

### 1. Work Context & Coordination
**[COPILOT_GEMINI_HANDOFF.md](../COPILOT_GEMINI_HANDOFF.md)** - START HERE
- Current work item (Task #2: async function parsing)
- Full stack trace and error details
- Implementation recommendations
- Blocking tests and expected outcomes

**[gemini-instructions.md](../gemini-instructions.md)**
- Your role in async coordination
- Work queue polling protocol
- MCP endpoints for claiming/completing tasks
- Priority order and validation workflow

**[ASYNC_COORDINATION_DEMO.md](../ASYNC_COORDINATION_DEMO.md)**
- Complete workflow example (continue/break fix)
- Timeline of successful agent coordination
- Validation patterns and completion workflow

### 2. Parser/Lexer Implementation (Core Fix Target)
**[src/phase1_core_lexer.js](../src/phase1_core_lexer.js)**
- Token definitions and keyword recognition
- WHERE TO ADD: `async` and `await` keywords
- Pattern: Search for other keywords like `function`, `const`, `let`

**[src/phase1_core_parser.js](../src/phase1_core_parser.js)**
- Function declaration parsing logic
- WHERE TO FIX: `parseFunctionDeclaration()` method
- Add async modifier handling (look for existing modifiers)

**[src/phase1_core_ast.js](../src/phase1_core_ast.js)**
- AST node definitions
- WHERE TO ADD: `async` property to FunctionDeclaration node
- Pattern: Check existing node properties for guidance

### 3. IR Pipeline & Lowering
**[src/ir/pipeline.js](../src/ir/pipeline.js)**
- Entry point for parse → lower → validate flow
- Error handling (line 31 mentioned in stack trace)
- Validation hooks

**[src/ir/lowerer.js](../src/ir/lowerer.js)**
- AST → IR transformation
- WHERE TO UPDATE: Preserve async flag in lowered functions
- Look for `lowerFunctionDeclaration()` method

**[src/ir/nodes.js](../src/ir/nodes.js)**
- IR node factory functions
- WHERE TO UPDATE: Add async metadata to IR function nodes

### 4. Code Generation (Emitter)
**[src/ir/emitter.js](../src/ir/emitter.js)**
- IR → Lua code generation
- Recent fixes: ContinueStatement, BreakStatement (lines 66-68)
- WHERE TO ADD: Async function emission logic
- Pattern: Look at existing function emission for guidance

### 5. Test Validation
**[tests/ir/harness.test.js](../tests/ir/harness.test.js)**
- Test cases including new async tests (lines 329-340)
- Validation assertions to satisfy
- Auto-submission logic (lines 350+)
- Expected Lua output patterns

---

## 📚 Supporting Context Files

### Architecture & Design
**[README.md](../README.md)**
- Project overview and goals
- IR pipeline architecture
- Phase breakdown (parsing, lowering, emitting)

**[DESIGN_GSS.md](../DESIGN_GSS.md)** (if exists)
- System architecture decisions
- Design patterns used

### Recent Work & Changes
**[CHANGELOG.md](../CHANGELOG.md)**
- Recent feature additions (spread/rest, continue/break)
- Version history

**[artifacts/copilot_breadcrumb_trail.md](../artifacts/copilot_breadcrumb_trail.md)**
- Copilot's test expansion session
- Expected failure patterns

### Coordination Protocols
**[assistant_coordination.md](../assistant_coordination.md)**
- Copilot ↔ Gemini workflow
- Role definitions
- Escalation procedures

**[copilot-instructions.md](../copilot-instructions.md)**
- Copilot's responsibilities (for context on handoffs)
- Breadcrumb trail protocol

### MCP Integration
**[scripts/mcp_servers.js](../scripts/mcp_servers.js)**
- Work queue implementation (lines with workQueue, handleWorkQueue)
- Endpoints: /work-queue, /submit-work, /sync-status
- Task states and transitions

**[context_pack_gemini.json](../context_pack_gemini.json)** (if exists)
- MCP endpoint URLs
- Available tools and resources

---

## 🔍 Quick Reference Patterns

### Finding Similar Implementations
To understand how to add `async`:
```bash
# Search for how other keywords are handled
grep -n "function" src/phase1_core_lexer.js
grep -n "parseFunctionDeclaration" src/phase1_core_parser.js

# See how other modifiers work
grep -n "static" src/phase1_core_parser.js
grep -n "export" src/phase1_core_parser.js
```

### Understanding the Flow
1. **Lexer** tokenizes `async function` → `[ASYNC, FUNCTION, ...]`
2. **Parser** builds AST → `{ kind: 'FunctionDeclaration', async: true, ... }`
3. **Lowerer** transforms to IR → preserve `async` metadata
4. **Emitter** generates Lua → emit coroutine wrapper or advisory comment

### Validation Pattern
```javascript
// In harness test:
runCase('async function declaration', 
  'async function fetchData() { return 42; }', 
  ({ lua }) => {
    assert.ok(lua.includes('fetchData'), 'function name missing');
    assert.ok(lua.includes('return'), 'return statement missing');
    // Optionally: assert.ok(lua.includes('coroutine') || true, 'async advisory');
  }
);
```

---

## 🚀 Implementation Checklist

Based on these files, here's the recommended fix sequence:

### Phase 1: Lexer (src/phase1_core_lexer.js)
- [ ] Add `async` to keyword tokens (around line with `function`, `const`, etc.)
- [ ] Add `await` to keyword tokens
- [ ] Test: Tokenize `async function() {}` without errors

### Phase 2: Parser (src/phase1_core_parser.js)
- [ ] Update `parseFunctionDeclaration()` to check for `async` modifier
- [ ] Add `async: true/false` property to FunctionDeclaration nodes
- [ ] Handle `await` as expression (if needed for await test)
- [ ] Test: Parse `async function fetchData() { return 42; }` → AST

### Phase 3: Lowerer (src/ir/lowerer.js)
- [ ] Preserve `async` flag in lowered function IR nodes
- [ ] Add metadata: `{ async: true }` to IR function representation
- [ ] Test: Lower async AST → IR with async metadata

### Phase 4: Emitter (src/ir/emitter.js)
- [ ] Check `node.meta?.async` in function emission
- [ ] Emit Lua coroutine wrapper OR advisory comment
- [ ] Test: Emit IR → Lua without "does not support" error

### Phase 5: Validation (tests/ir/harness.test.js)
- [ ] Run `npm run harness`
- [ ] Verify async function test passes
- [ ] Mark task #2 complete via MCP

---

## 💡 Pro Tips

1. **Start Small**: Get lexer working first, then parser, then lowerer, then emitter
2. **Use Existing Patterns**: Copy how `function` keyword is handled
3. **Run Tests Early**: `npm run harness` after each phase to catch issues
4. **Check Stack Traces**: Error messages point to exact line numbers
5. **Advisory Approach**: If full coroutine emission is complex, emit comment: `-- async function (advisory)`

---

## 📞 MCP Endpoints for Coordination

Once you start work:
```bash
# Claim task #2
curl "http://localhost:8787/work-queue?action=claim&id=2&agent=gemini"

# After testing and validation
curl "http://localhost:8787/work-queue?action=complete&id=2&result=fixed&agent=gemini"

# Check coordination status
curl "http://localhost:8787/sync-status"
```

**Remember**: Start MCP server first: `npm run mcp:serve`

---

**Good luck!** The breadcrumb trail from Copilot has all the context you need. Follow the patterns in the codebase, validate with harness, and update the work queue when complete. 🚀
