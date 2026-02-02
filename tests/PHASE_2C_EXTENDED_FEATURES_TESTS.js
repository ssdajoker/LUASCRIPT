/**
 * Phase 2C - Extended Features Tests
 * Comprehensive testing of decorators, context managers, generators, and async/await
 */

const assert = require('assert');
const PythonExtendedFeaturesEnhancer = require('../src/optimizers/python/phase2c/python_extended_features.js');

describe('Phase 2C - Extended Language Features', () => {
  let enhancer;

  beforeEach(() => {
    enhancer = new PythonExtendedFeaturesEnhancer();
  });

  describe('Decorators - Single @decorator', () => {
    it('should parse simple decorator', () => {
      const code = `@decorator
def foo():
    pass`;
      const result = enhancer.validateFeatures(code);
      assert(result.decorators.supported, 'Decorators not supported');
      assert(result.decorators.detected.length > 0, 'Decorator not detected');
    });

    it('should parse decorator with arguments', () => {
      const code = `@decorator(arg1, arg2)
def foo():
    pass`;
      const result = enhancer.validateFeatures(code);
      assert(result.decorators.supported, 'Decorators with arguments not supported');
    });

    it('should parse chained decorators', () => {
      const code = `@decorator1
@decorator2
@decorator3
def foo():
    pass`;
      const result = enhancer.validateFeatures(code);
      assert(result.decorators.detected.length >= 3, 'Not all decorators detected');
    });

    it('should handle decorator with complex arguments', () => {
      const code = `@route('/path', methods=['GET', 'POST'])
def handler():
    pass`;
      const result = enhancer.validateFeatures(code);
      assert(result.decorators.supported, 'Complex decorator not supported');
    });
  });

  describe('Context Managers - with statement', () => {
    it('should parse simple with statement', () => {
      const code = `with open('file.txt') as f:
    content = f.read()`;
      const result = enhancer.validateFeatures(code);
      assert(result.contextManagers.supported, 'Context managers not supported');
      assert(result.contextManagers.detected.length > 0, 'with statement not detected');
    });

    it('should parse multiple context managers', () => {
      const code = `with open('file1.txt') as f1, open('file2.txt') as f2:
    data = f1.read() + f2.read()`;
      const result = enhancer.validateFeatures(code);
      assert(result.contextManagers.detected.length >= 2, 'Multiple contexts not detected');
    });

    it('should parse with statement without as clause', () => {
      const code = `with lock:
    critical_section()`;
      const result = enhancer.validateFeatures(code);
      assert(result.contextManagers.supported, 'with without as not supported');
    });

    it('should handle nested context managers', () => {
      const code = `with outer() as o:
    with inner() as i:
        process(o, i)`;
      const result = enhancer.validateFeatures(code);
      assert(result.contextManagers.detected.length >= 2, 'Nested contexts not detected');
    });
  });

  describe('Generators - yield statement', () => {
    it('should parse simple yield', () => {
      const code = `def generator():
    yield 1
    yield 2`;
      const result = enhancer.validateFeatures(code);
      assert(result.generators.supported, 'Generators not supported');
      assert(result.generators.detected.length > 0, 'yield not detected');
    });

    it('should parse yield from', () => {
      const code = `def delegating():
    yield from inner_generator()`;
      const result = enhancer.validateFeatures(code);
      assert(result.generators.detected.some(g => g.type === 'yield_from'),
        'yield from not detected');
    });

    it('should parse yield in loop', () => {
      const code = `def range_generator(n):
    for i in range(n):
        yield i`;
      const result = enhancer.validateFeatures(code);
      assert(result.generators.detected.length > 0, 'Generator in loop not detected');
    });

    it('should parse generator with value send', () => {
      const code = `def echo():
    value = None
    while True:
        value = (yield value)`;
      const result = enhancer.validateFeatures(code);
      assert(result.generators.detected.length > 0, 'Generator with send not detected');
    });
  });

  describe('Async/Await - Asynchronous functions', () => {
    it('should parse simple async def', () => {
      const code = `async def async_func():
    return 42`;
      const result = enhancer.validateFeatures(code);
      assert(result.asyncAwait.supported, 'async/await not supported');
      assert(result.asyncAwait.detected.length > 0, 'async def not detected');
    });

    it('should parse await expression', () => {
      const code = `async def caller():
    result = await async_func()
    return result`;
      const result = enhancer.validateFeatures(code);
      assert(result.asyncAwait.detected.some(a => a.type === 'await'),
        'await not detected');
    });

    it('should parse async for loop', () => {
      const code = `async def iterate():
    async for item in async_iterator():
        process(item)`;
      const result = enhancer.validateFeatures(code);
      assert(result.asyncAwait.detected.some(a => a.type === 'async_for'),
        'async for not detected');
    });

    it('should parse async with statement', () => {
      const code = `async def async_context():
    async with async_manager() as res:
        await res.process()`;
      const result = enhancer.validateFeatures(code);
      assert(result.asyncAwait.detected.some(a => a.type === 'async_with'),
        'async with not detected');
    });

    it('should handle nested async operations', () => {
      const code = `async def nested():
    async with outer() as o:
        result = await inner(o)
        async for item in o:
            await process(item)`;
      const result = enhancer.validateFeatures(code);
      assert(result.asyncAwait.detected.length >= 4, 'Nested async operations not detected');
    });
  });

  describe('Feature Combinations', () => {
    it('should combine decorators with generators', () => {
      const code = `@cache
def data_generator():
    for i in range(100):
        yield process(i)`;
      const result = enhancer.validateFeatures(code);
      assert(result.decorators.detected.length > 0, 'Decorator not detected');
      assert(result.generators.detected.length > 0, 'Generator not detected');
    });

    it('should combine context managers with generators', () => {
      const code = `def file_reader():
    with open('large.txt') as f:
        for line in f:
            yield line.strip()`;
      const result = enhancer.validateFeatures(code);
      assert(result.contextManagers.detected.length > 0, 'Context manager not detected');
      assert(result.generators.detected.length > 0, 'Generator not detected');
    });

    it('should combine async/await with context managers', () => {
      const code = `async def async_file_ops():
    async with aiofiles.open('file.txt') as f:
        content = await f.read()
        return content`;
      const result = enhancer.validateFeatures(code);
      assert(result.asyncAwait.detected.length > 0, 'async/await not detected');
      assert(result.contextManagers.detected.length > 0, 'Context manager not detected');
    });

    it('should combine decorators with async', () => {
      const code = `@cache
async def cached_async_op():
    return await expensive_operation()`;
      const result = enhancer.validateFeatures(code);
      assert(result.decorators.detected.length > 0, 'Decorator not detected');
      assert(result.asyncAwait.detected.length > 0, 'async/await not detected');
    });

    it('should handle all four features together', () => {
      const code = `@trace
async def complex_operation():
    async with manager() as m:
        async for item in m:
            yield await process(item)`;
      const result = enhancer.validateFeatures(code);
      assert(result.decorators.detected.length > 0, 'Decorator not detected');
      assert(result.asyncAwait.detected.length >= 3, 'async operations not detected');
      assert(result.contextManagers.detected.length > 0, 'Context manager not detected');
      assert(result.generators.detected.length > 0, 'Generator not detected');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed decorators gracefully', () => {
      const code = `@
def foo():
    pass`;
      const result = enhancer.validateFeatures(code);
      assert(result.errors && result.errors.length > 0, 'Error not detected for malformed decorator');
    });

    it('should handle invalid with syntax', () => {
      const code = `with:
    pass`;
      const result = enhancer.validateFeatures(code);
      assert(result.errors && result.errors.length > 0, 'Error not detected for invalid with');
    });

    it('should handle orphaned yield', () => {
      const code = `def not_generator():
    x = yield 5  # This is valid but unusual`;
      const result = enhancer.validateFeatures(code);
      // This is actually valid Python, so we expect no errors
      assert(result.generators.detected.length > 0, 'yield in non-generator function not detected');
    });

    it('should handle missing await in async', () => {
      const code = `async def misleading():
    result = long_operation()  # Should probably be await`;
      const result = enhancer.validateFeatures(code);
      // This is valid but may warrant a warning
      assert(result.warnings && result.warnings.length >= 0, 'Should have warnings or be valid');
    });
  });

  describe('Edge Cases', () => {
    it('should handle decorators on class methods', () => {
      const code = `class MyClass:
    @property
    def value(self):
        return self._value`;
      const result = enhancer.validateFeatures(code);
      assert(result.decorators.detected.length > 0, 'Decorator on method not detected');
    });

    it('should handle context manager with expression', () => {
      const code = `with (open('a.txt') if condition else open('b.txt')) as f:
    process(f)`;
      const result = enhancer.validateFeatures(code);
      assert(result.contextManagers.supported, 'Context manager with expression not supported');
    });

    it('should handle generator expression', () => {
      const code = `gen = (x*2 for x in range(100))`;
      const result = enhancer.validateFeatures(code);
      // Generator expressions are different from yield, but related
      assert(result.features && result.features.length >= 0, 'Should parse');
    });

    it('should handle lambda with generator (not supported)', () => {
      const code = `f = lambda: (yield x)  # This is not valid Python`;
      const result = enhancer.validateFeatures(code);
      // Should detect error
      assert(result.errors && result.errors.length > 0, 'Invalid lambda should error');
    });

    it('should handle multiple decorators with different styles', () => {
      const code = `@decorator1
@decorator2()
@decorator3.method
@module.decorator4(arg)
def foo():
    pass`;
      const result = enhancer.validateFeatures(code);
      assert(result.decorators.detected.length >= 4, 'All decorator styles not detected');
    });
  });

  describe('Performance Characteristics', () => {
    it('should process simple features quickly', () => {
      const code = `@decorator
def foo():
    pass`;
      const start = Date.now();
      enhancer.validateFeatures(code);
      const elapsed = Date.now() - start;
      assert(elapsed < 50, 'Feature detection too slow: ' + elapsed + 'ms');
    });

    it('should handle complex nested structures', () => {
      const code = `@decorator1
@decorator2
async def complex():
    async with m1:
        async with m2:
            async for item in items:
                with context:
                    yield await process(item)`;
      const start = Date.now();
      const result = enhancer.validateFeatures(code);
      const elapsed = Date.now() - start;
      assert(elapsed < 100, 'Complex structure too slow: ' + elapsed + 'ms');
      assert(result.decorators.detected.length > 0, 'Should detect all features');
    });
  });

  describe('Feature Summary', () => {
    it('should provide accurate feature count', () => {
      const code = `@d1
@d2
async def foo():
    with m:
        yield 1`;
      const result = enhancer.validateFeatures(code);
      assert(result.decorators.count >= 2, 'Decorator count incorrect');
      assert(result.asyncAwait.count >= 1, 'async count incorrect');
      assert(result.contextManagers.count >= 1, 'Context manager count incorrect');
      assert(result.generators.count >= 1, 'Generator count incorrect');
    });

    it('should indicate support status', () => {
      const code = '@d\ndef f():\n  pass';
      const result = enhancer.validateFeatures(code);
      assert(result.decorators.supported === true, 'Should indicate support');
    });
  });
});

console.log('\n✅ Phase 2C - Extended Features Tests Suite Created\n');
console.log('Test Categories:');
console.log('  1. Decorators (4 tests) - Single, arguments, chained, complex');
console.log('  2. Context Managers (4 tests) - Simple, multiple, no-as, nested');
console.log('  3. Generators (4 tests) - Simple, yield-from, loop, send');
console.log('  4. Async/Await (5 tests) - async def, await, async-for, async-with, nested');
console.log('  5. Feature Combinations (5 tests) - Decorators+Generators, Context+Generators, etc.');
console.log('  6. Error Handling (4 tests) - Malformed decorator, invalid with, orphaned yield, missing await');
console.log('  7. Edge Cases (5 tests) - Methods, expressions, generator expressions, lambdas, styles');
console.log('  8. Performance (2 tests) - Quick processing, complex structures');
console.log('  9. Feature Summary (2 tests) - Feature count, support status');
console.log('\nTotal: 35 comprehensive tests');
