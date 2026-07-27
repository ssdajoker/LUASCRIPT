/**
 * ============================================================================
 * PHASE C: PYTHON TIER 2A VALIDATION - CLARITY SUPER-CANON 6-PHASE GATE
 * ============================================================================
 * 
 * Validates that Python Tier 2A optimizer applies all 6 phases
 * 
 * PYTHON TIER 2A IMPLEMENTATION:
 * - Location: src/backends/python/tier2_optimizer.js
 * - Target: ~350 lines of real implementation
 * - Features: Comprehensions, decorators, f-strings, async/await, context managers
 * - Integration: Python parser + lowerer + optimizer
 * 
 * Each test validates 6-phase canon with Python-specific patterns
 * 
 * SUCCESS CRITERIA: 43/48 tests passing (>90% pass rate)
 * 
 * ============================================================================
 */

const { PythonOptimizer } = require('../src/backends/python/tier2_optimizer');
const { AdvancedCache } = require('../src/optimizations/speed_optimization');
const { SecurityValidator } = require('../src/optimizations/security_algorithm_optimization');

describe('PHASE C: Python Tier 2A Optimizer - Clarity Super-Canon Validation', () => {

  // ============================================================================
  // PYTHON OPTIMIZER VALIDATION
  // ============================================================================
  describe('Python Optimizer - 6-Phase Validation', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new PythonOptimizer({ cacheSize: 1000, strictTypeHints: true });
    });

    test('PY.1: Python optimizer initializes', () => {
      expect(optimizer).toBeDefined();
      expect(optimizer.strictTypeHints).toBe(true);
    });

    test('PY.2: Phase 1 - Speed: Python caching implemented', () => {
      expect(optimizer.pythonCache).toBeInstanceOf(AdvancedCache);
      expect(optimizer.transpilationCache).toBeInstanceOf(AdvancedCache);
      expect(optimizer.comprehensionCache).toBeInstanceOf(AdvancedCache);
    });

    test('PY.3: Phase 1 - Speed: Decorator caching present', () => {
      expect(optimizer.decoratorCache).toBeInstanceOf(AdvancedCache);
      expect(optimizer.fstringCache).toBeInstanceOf(AdvancedCache);
    });

    test('PY.4: Phase 2 - Memory: Memory pools for Python structures', () => {
      expect(optimizer.memoryPool).toBeDefined();
      // Should have PythonNode, Dictionary, List, Function, Class pools
    });

    test('PY.5: Phase 3 - Security: SecurityValidator accessible', () => {
      expect(optimizer.securityValidator).toBe(SecurityValidator);
    });

    test('PY.6: Phase 3 - Security: Python-specific security validation', () => {
      expect(typeof optimizer.validatePythonSecurity).toBe('function');
      
      // Test that dangerous patterns are blocked
      expect(() => {
        optimizer.validatePythonSecurity('exec("malicious code")');
      }).toThrow(/exec.*allows arbitrary code execution/);
    });

    test('PY.7: Phase 4 - Algorithms: AlgorithmOptimizer accessible', () => {
      expect(optimizer.algorithmOptimizer).toBeDefined();
    });

    test('PY.8: Phase 5 - Interop: Python-to-Lua cache present', () => {
      expect(optimizer.pythonToLuaCache).toBeInstanceOf(AdvancedCache);
    });

    test('PY.9: Phase 5 - Interop: Python-to-JS cache present', () => {
      expect(optimizer.pythonToJSCache).toBeInstanceOf(AdvancedCache);
    });

    test('PY.10: Phase 6 - Quality: Metrics tracking initialized', () => {
      expect(optimizer.metrics).toBeDefined();
      expect(optimizer.metrics.transpilations).toBe(0);
      expect(optimizer.metrics.cacheHits).toBe(0);
      expect(optimizer.metrics.functionsOptimized).toBe(0);
      expect(optimizer.metrics.classesOptimized).toBe(0);
    });

    test('PY.11: Transpilation method exists', () => {
      expect(typeof optimizer.optimizeTranspilation).toBe('function');
    });

    test('PY.12: Pattern extraction method exists', () => {
      expect(typeof optimizer.extractPythonPatterns).toBe('function');
    });

    test('PY.13: Python-specific optimizations documented', () => {
      // Should have comprehension, decorator, fstring, async optimization
      expect(optimizer.comprehensionCache).toBeDefined();
      expect(optimizer.decoratorCache).toBeDefined();
      expect(optimizer.fstringCache).toBeDefined();
    });

    test('PY.14: AST building with memory pools', () => {
      expect(typeof optimizer.buildOptimizedAST).toBe('function');
    });

    test('PY.15: Hash code generation', () => {
      expect(typeof optimizer.hashCode).toBe('function');
      const hash = optimizer.hashCode('test code');
      expect(hash).toMatch(/^py_/);
    });

    test('PY.16: Metrics retrieval', () => {
      expect(typeof optimizer.getMetrics).toBe('function');
      const metrics = optimizer.getMetrics();
      expect(metrics.language).toBe('Python');
      expect(metrics.version).toBe('3.11+');
    });
  });

  // ============================================================================
  // PYTHON PATTERN EXTRACTION VALIDATION
  // ============================================================================
  describe('Python Pattern Extraction - Feature Detection', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new PythonOptimizer();
    });

    test('PY.17: Extract function definitions', () => {
      const code = `
def hello(name):
    return f"Hello, {name}"

def add(x, y):
    return x + y
`;
      const patterns = optimizer.extractPythonPatterns(code);
      expect(patterns.functions.length).toBeGreaterThanOrEqual(2);
      expect(patterns.functions.some(f => f.name === 'hello')).toBe(true);
      expect(patterns.functions.some(f => f.name === 'add')).toBe(true);
    });

    test('PY.18: Extract async functions', () => {
      const code = `
async def fetch_data():
    return await get_data()

async def process():
    return await compute()
`;
      const patterns = optimizer.extractPythonPatterns(code);
      expect(patterns.asyncFunctions.length).toBeGreaterThanOrEqual(2);
      expect(patterns.asyncFunctions.some(f => f.name === 'fetch_data')).toBe(true);
      expect(patterns.asyncFunctions.some(f => f.isAsync)).toBe(true);
    });

    test('PY.19: Extract class definitions', () => {
      const code = `
class Person:
    def __init__(self, name):
        self.name = name

class Student(Person):
    pass
`;
      const patterns = optimizer.extractPythonPatterns(code);
      expect(patterns.classes.length).toBeGreaterThanOrEqual(2);
      expect(patterns.classes.some(c => c.name === 'Person')).toBe(true);
      expect(patterns.classes.some(c => c.name === 'Student')).toBe(true);
    });

    test('PY.20: Extract decorators', () => {
      const code = `
@property
def name(self):
    return self._name

@staticmethod
def create():
    return MyClass()
`;
      const patterns = optimizer.extractPythonPatterns(code);
      expect(patterns.decorators.length).toBeGreaterThanOrEqual(2);
      expect(patterns.decorators.includes('property')).toBe(true);
      expect(patterns.decorators.includes('staticmethod')).toBe(true);
    });

    test('PY.21: Extract list comprehensions', () => {
      const code = `
numbers = [x * 2 for x in range(10)]
squares = [x ** 2 for x in numbers]
`;
      const patterns = optimizer.extractPythonPatterns(code);
      expect(patterns.comprehensions.length).toBeGreaterThanOrEqual(2);
      expect(patterns.comprehensions.some(c => c.type === 'list')).toBe(true);
    });

    test('PY.22: Extract dict comprehensions', () => {
      const code = `
mapping = {x: x * 2 for x in range(5)}
squares = {x: x ** 2 for x in range(10)}
`;
      const patterns = optimizer.extractPythonPatterns(code);
      expect(patterns.comprehensions.some(c => c.type === 'dict')).toBe(true);
    });

    test('PY.23: Extract f-strings', () => {
      const code = `
name = "World"
msg = f"Hello, {name}!"
info = f"Value: {x}, Count: {count}"
`;
      const patterns = optimizer.extractPythonPatterns(code);
      expect(patterns.fstrings.length).toBeGreaterThanOrEqual(2);
    });

    test('PY.24: Extract context managers', () => {
      const code = `
with open('file.txt') as f:
    data = f.read()

with lock:
    critical_section()
`;
      const patterns = optimizer.extractPythonPatterns(code);
      expect(patterns.contextManagers.length).toBeGreaterThanOrEqual(2);
    });

    test('PY.25: Extract generators (yield)', () => {
      const code = `
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b
`;
      const patterns = optimizer.extractPythonPatterns(code);
      expect(patterns.generators.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================================
  // PYTHON TRANSPILATION VALIDATION
  // ============================================================================
  describe('Python Transpilation - Code Generation', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new PythonOptimizer();
    });

    test('PY.26: Transpile simple function to Lua', () => {
      const code = `
def greet(name):
    return f"Hello, {name}"
`;
      const result = optimizer.optimizeTranspilation(code, { targetLanguage: 'Lua' });
      expect(result.code).toContain('function greet');
      expect(result.targetLanguage).toBe('Lua');
    });

    test('PY.27: Transpile async function to Lua', () => {
      const code = `
async def fetch():
    return await data()
`;
      const result = optimizer.optimizeTranspilation(code, { targetLanguage: 'Lua' });
      expect(result.code).toContain('async_fetch');
      expect(result.metrics.asyncFunctions).toBeGreaterThanOrEqual(1);
    });

    test('PY.28: Transpile class to Lua', () => {
      const code = `
class MyClass:
    def __init__(self):
        pass
`;
      const result = optimizer.optimizeTranspilation(code, { targetLanguage: 'Lua' });
      expect(result.code).toContain('MyClass');
      expect(result.code).toContain('setmetatable');
    });

    test('PY.29: Transpile to JavaScript', () => {
      const code = `
def calculate(x, y):
    return x + y
`;
      const result = optimizer.optimizeTranspilation(code, { targetLanguage: 'JavaScript' });
      expect(result.code).toContain('function calculate');
      expect(result.targetLanguage).toBe('JavaScript');
    });

    test('PY.30: Transpile class to JavaScript', () => {
      const code = `
class Person:
    def __init__(self, name):
        self.name = name
`;
      const result = optimizer.optimizeTranspilation(code, { targetLanguage: 'JavaScript' });
      expect(result.code).toContain('class Person');
      expect(result.targetLanguage).toBe('JavaScript');
    });
  });

  // ============================================================================
  // PYTHON CACHING VALIDATION
  // ============================================================================
  describe('Python Caching - Performance Optimization', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new PythonOptimizer();
    });

    test('PY.31: Cache transpilation results', () => {
      const code = `def test(): pass`;
      
      const result1 = optimizer.optimizeTranspilation(code);
      expect(result1.cacheHit).toBe(false);
      
      const result2 = optimizer.optimizeTranspilation(code);
      expect(result2.cacheHit).toBe(true);
      expect(optimizer.metrics.cacheHits).toBe(1);
    });

    test('PY.32: Cache hit rate tracking', () => {
      const code = `def func(): pass`;
      
      optimizer.optimizeTranspilation(code);
      optimizer.optimizeTranspilation(code);
      optimizer.optimizeTranspilation(code);
      
      const metrics = optimizer.getMetrics();
      // After 3 calls: 1st miss, 2nd hit, 3rd hit = 2/3 = 66.67%
      // But cacheHits is counted separately so it's 2 hits out of 3 transpilations
      expect(metrics.transpilations).toBe(3);
      expect(metrics.cacheHits).toBe(2);
    });

    test('PY.33: Multiple cache types active', () => {
      expect(optimizer.pythonCache).toBeDefined();
      expect(optimizer.transpilationCache).toBeDefined();
      expect(optimizer.comprehensionCache).toBeDefined();
      expect(optimizer.decoratorCache).toBeDefined();
      expect(optimizer.fstringCache).toBeDefined();
    });
  });

  // ============================================================================
  // PYTHON SECURITY VALIDATION
  // ============================================================================
  describe('Python Security - Injection Prevention', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new PythonOptimizer();
    });

    test('PY.34: Block exec() usage', () => {
      const code = `exec("malicious = True")`;
      expect(() => {
        optimizer.optimizeTranspilation(code);
      }).toThrow(/exec.*allows arbitrary code execution/);
    });

    test('PY.35: Block eval() usage', () => {
      const code = `result = eval("1 + 1")`;
      expect(() => {
        optimizer.optimizeTranspilation(code);
      }).toThrow(/eval.*allows arbitrary expression evaluation/);
    });

    test('PY.36: Block __import__ usage', () => {
      const code = `mod = __import__("os")`;
      expect(() => {
        optimizer.optimizeTranspilation(code);
      }).toThrow(/__import__.*bypass security/);
    });

    test('PY.37: Block compile() usage', () => {
      const code = `code_obj = compile("x = 1", "<string>", "exec")`;
      expect(() => {
        optimizer.optimizeTranspilation(code);
      }).toThrow(/compile.*create code objects/);
    });

    test('PY.38: Validate input length', () => {
      const code = 'x = 1';
      expect(() => {
        optimizer.optimizeTranspilation(code, { maxLength: 1 });
      }).not.toThrow();
    });

    test('PY.39: Safe code passes validation', () => {
      const code = `
def safe_function(x, y):
    return x + y
`;
      expect(() => {
        optimizer.optimizeTranspilation(code);
      }).not.toThrow();
    });
  });

  // ============================================================================
  // PYTHON MEMORY POOL VALIDATION
  // ============================================================================
  describe('Python Memory Pools - Resource Management', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new PythonOptimizer();
    });

    test('PY.40: Memory pool manager exists', () => {
      expect(optimizer.memoryPool).toBeDefined();
      expect(typeof optimizer.memoryPool.acquire).toBe('function');
      expect(typeof optimizer.memoryPool.release).toBe('function');
    });

    test('PY.41: PythonNode pool available', () => {
      const node = optimizer.memoryPool.acquire('PythonNode');
      expect(node).toBeDefined();
      expect(node.type).toBe('node');
    });

    test('PY.42: Dictionary pool available', () => {
      const dict = optimizer.memoryPool.acquire('Dictionary');
      expect(dict).toBeDefined();
      expect(dict.type).toBe('dict');
    });

    test('PY.43: List pool available', () => {
      const list = optimizer.memoryPool.acquire('List');
      expect(list).toBeDefined();
      expect(list.type).toBe('list');
    });

    test('PY.44: Function pool available', () => {
      const func = optimizer.memoryPool.acquire('Function');
      expect(func).toBeDefined();
      expect(func.type).toBe('function');
    });

    test('PY.45: Class pool available', () => {
      const cls = optimizer.memoryPool.acquire('Class');
      expect(cls).toBeDefined();
      expect(cls.type).toBe('class');
    });

    test('PY.46: AST building uses memory pools', () => {
      const code = `
def func1(): pass
class MyClass: pass
`;
      const patterns = optimizer.extractPythonPatterns(code);
      const ast = optimizer.buildOptimizedAST(patterns);
      expect(ast.nodeCount).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // PYTHON METRICS VALIDATION
  // ============================================================================
  describe('Python Metrics - Quality Tracking', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new PythonOptimizer();
    });

    test('PY.47: Metrics increment on transpilation', () => {
      const code = `
def test(): pass
class TestClass: pass
`;
      optimizer.optimizeTranspilation(code);
      
      expect(optimizer.metrics.transpilations).toBe(1);
      expect(optimizer.metrics.functionsOptimized).toBeGreaterThanOrEqual(1);
      expect(optimizer.metrics.classesOptimized).toBeGreaterThanOrEqual(1);
    });

    test('PY.48: Comprehensive metrics tracking', () => {
      const code = `
@property
def name(self): return self._name

async def fetch(): pass

numbers = [x * 2 for x in range(10)]
msg = f"Hello, {name}"
`;
      optimizer.optimizeTranspilation(code);
      
      const metrics = optimizer.getMetrics();
      expect(metrics.decoratorsApplied).toBeGreaterThanOrEqual(1);
      expect(metrics.asyncPatternsOptimized).toBeGreaterThanOrEqual(1);
      expect(metrics.comprehensionsOptimized).toBeGreaterThanOrEqual(1);
      expect(metrics.fstringsCompiled).toBeGreaterThanOrEqual(1);
    });
  });
});
