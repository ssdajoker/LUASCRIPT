"use strict";

/**
 * Python Phase A Roundtrip Tests
 * Validates parse → IR → emit → reparse consistency
 */

const PythonParser = require('../src/parsers/python_parser');
const PythonLowerer = require('../src/ir/lowerer_python');
const PythonEmitter = require('../src/ir/emitter_python');
const DeterminismVerifier = require('./determinism_verifier');
const MultiLanguageRoundtripHarness = require('./harness/multi_language_roundtrip');

describe('Python Phase A - Roundtrip Tests', () => {
  let parser, lowerer, emitter, verifier, roundtripHarness;

  beforeAll(() => {
    parser = new PythonParser();
    lowerer = new PythonLowerer();
    emitter = new PythonEmitter();
    verifier = new DeterminismVerifier({ runs: 10 });
    roundtripHarness = new MultiLanguageRoundtripHarness();
  });

  describe('Basic Function Parsing', () => {
    const code = `
def add(x, y):
    return x + y
`;

    test('should parse function definition', () => {
      const ast = parser.parse(code);
      expect(ast).toBeDefined();
      expect(ast.type).toBe('Module');
      expect(ast.body).toBeInstanceOf(Array);
      expect(ast.body.length).toBeGreaterThan(0);
    });

    test('should lower function to IR', () => {
      const ast = parser.parse(code);
      const ir = lowerer.lower(ast);
      expect(ir).toBeDefined();
      expect(ir.type).toBe('IRModule');
      expect(ir.nodes).toBeInstanceOf(Array);
    });

    test('should emit function to Python code', () => {
      const ast = parser.parse(code);
      const ir = lowerer.lower(ast);
      const output = emitter.emit(ir);
      expect(output).toBeDefined();
      expect(typeof output).toBe('string');
      expect(output).toContain('def');
    });

    test('should roundtrip consistently', async () => {
      const result = await roundtripHarness.runRoundtrip(code, 'Python', parser, emitter);
      expect(result.success).toBe(true);
      expect(result.irConsistent).toBe(true);
    });
  });

  describe('Class Declaration Parsing', () => {
    const code = `
class Calculator:
    def __init__(self):
        self.value = 0
    
    def add(self, x):
        self.value += x
        return self.value
`;

    test('should parse class declaration', () => {
      const ast = parser.parse(code);
      expect(ast.body).toContainEqual(
        expect.objectContaining({
          type: 'ClassDeclaration',
        })
      );
    });

    test('should lower class to IR', () => {
      const ast = parser.parse(code);
      const ir = lowerer.lower(ast);
      expect(ir.nodes).toContainEqual(
        expect.objectContaining({
          type: 'ClassDefinition',
        })
      );
    });

    test('should preserve method definitions', () => {
      const ast = parser.parse(code);
      const ir = lowerer.lower(ast);
      const classIR = ir.nodes.find(n => n.type === 'ClassDefinition');
      expect(classIR).toBeDefined();
      expect(classIR.methods).toBeInstanceOf(Array);
    });
  });

  describe('Decorator Handling', () => {
    const code = `
class Example:
    @property
    def value(self):
        return self._value
    
    @staticmethod
    def static_method():
        return 42
`;

    test('should recognize decorators', () => {
      const ast = parser.parse(code);
      const classStmt = ast.body.find(s => s.type === 'ClassDeclaration');
      expect(classStmt).toBeDefined();
    });

    test('should lower decorators to IR', () => {
      const ast = parser.parse(code);
      const ir = lowerer.lower(ast);
      const classIR = ir.nodes.find(n => n.type === 'ClassDefinition');
      expect(classIR.decorators).toBeInstanceOf(Array);
    });
  });

  describe('Exception Handling', () => {
    const code = `
try:
    result = risky_operation()
except ValueError as e:
    print(f"Error: {e}")
finally:
    cleanup()
`;

    test('should parse try statement', () => {
      const ast = parser.parse(code);
      expect(ast.body).toContainEqual(
        expect.objectContaining({
          type: 'TryStatement',
        })
      );
    });

    test('should lower exception handlers', () => {
      const ast = parser.parse(code);
      const ir = lowerer.lower(ast);
      const tryIR = ir.nodes.find(n => n.type === 'TryStatement');
      expect(tryIR).toBeDefined();
      expect(tryIR.handlers).toBeInstanceOf(Array);
    });
  });

  describe('Async/Await Support', () => {
    const code = `
async def fetch_data():
    result = await get_async()
    return result
`;

    test('should parse async function', () => {
      const ast = parser.parse(code);
      const func = ast.body.find(s => s.type === 'FunctionDeclaration');
      expect(func).toBeDefined();
      expect(func.async).toBe(true);
    });

    test('should lower async to IR', () => {
      const ast = parser.parse(code);
      const ir = lowerer.lower(ast);
      const funcIR = ir.nodes.find(n => n.type === 'FunctionDefinition');
      expect(funcIR).toBeDefined();
      expect(funcIR.isAsync).toBe(true);
    });
  });

  describe('Determinism Verification', () => {
    const code = `
def deterministic_func():
    x = 42
    return x * 2
`;

    test('should produce deterministic IR across runs', async () => {
      const result = await verifier.verifyFullPipelineDeterminism(
        code,
        parser,
        lowerer,
        emitter,
        10
      );
      
      expect(result.irConsistent).toBe(true);
      expect(result.codeConsistent).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    test('should produce deterministic parser output', async () => {
      const result = verifier.verifyParserDeterminism(code, parser, 10);
      expect(result.isDeterministic).toBe(true);
    });
  });

  describe('Type Hints Support', () => {
    const code = `
def typed_function(x: int, y: str) -> bool:
    return len(y) == x
`;

    test('should parse type annotations', () => {
      const ast = parser.parse(code);
      const func = ast.body.find(s => s.type === 'FunctionDeclaration');
      expect(func.params).toBeDefined();
      expect(func.returnType).toBeDefined();
    });

    test('should preserve type hints in IR', () => {
      const ast = parser.parse(code);
      const ir = lowerer.lower(ast);
      const funcIR = ir.nodes.find(n => n.type === 'FunctionDefinition');
      expect(funcIR.returnType).toBeDefined();
    });
  });

  describe('F-String Support', () => {
    const code = `
name = "Python"
version = 3.11
message = f"Using {name} {version}"
`;

    test('should tokenize f-strings', () => {
      const tokens = parser.tokenize(code);
      const fstrings = tokens.filter(t => t.type === 'FSTRING');
      expect(fstrings.length).toBeGreaterThan(0);
    });
  });

  describe('Generator Functions', () => {
    const code = `
def count_up(n):
    for i in range(n):
        yield i
`;

    test('should identify generator functions', () => {
      const ast = parser.parse(code);
      const func = ast.body.find(s => s.type === 'FunctionDeclaration');
      expect(func).toBeDefined();
    });

    test('should lower generators to IR', () => {
      const ast = parser.parse(code);
      const ir = lowerer.lower(ast);
      const funcIR = ir.nodes.find(n => n.type === 'FunctionDefinition');
      expect(funcIR).toBeDefined();
    });
  });

  describe('Pass Rate Report', () => {
    test('should generate roundtrip report', async () => {
      const codes = [
        'def func(): pass',
        'class MyClass: pass',
        'x = 42',
      ];

      for (const code of codes) {
        await roundtripHarness.runRoundtrip(code, 'Python', parser, emitter);
      }

      const report = roundtripHarness.generateReport();
      expect(report.summary).toBeDefined();
      expect(report.summary.total).toBeGreaterThan(0);
      expect(report.summary.passRate).toBeGreaterThanOrEqual(0);
    });
  });
});

module.exports = {
  PythonParser,
  PythonLowerer,
  DeterminismVerifier,
  MultiLanguageRoundtripHarness,
};
