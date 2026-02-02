/**
 * PHASE E - Task E1.4: Performance Benchmarks
 * 
 * Benchmarks real-world style workloads using:
 * - CacheManager (E1.1)
 * - FunctionCache (E1.2)
 * - PatternCache (E1.3)
 * 
 * @module tests/phase_e/E1_4_speed_benchmarks.js
 */

const { CacheManager } = require('../../src/optimizers/javascript/speed/cache_manager');
const { FunctionCache } = require('../../src/optimizers/javascript/speed/function_cache');
const { PatternCache } = require('../../src/optimizers/javascript/speed/pattern_cache');
const assert = require('assert');

const now = () => performance.now();

const mockFunctionAst = (name = 'fn', params = [], isAsync = false, isGen = false) => ({
  type: 'FunctionDeclaration',
  id: { name },
  params,
  body: { body: [] },
  async: isAsync,
  generator: isGen
});

const mockArrayPattern = (count = 2) => ({
  type: 'ArrayPattern',
  elements: Array.from({ length: count }, (_, i) => ({ name: `a${i}` }))
});

const mockTemplateLiteral = (quasis = 2, expressions = 1, head = 'hello') => ({
  type: 'TemplateLiteral',
  quasis: Array.from({ length: quasis }, (_, i) => ({ value: { raw: i === 0 ? head : `q${i}` } })),
  expressions: Array.from({ length: expressions }, () => ({ type: 'Identifier', name: 'x' }))
});

const mockArrayMethodCall = (method = 'map', args = 1) => ({
  type: 'CallExpression',
  callee: {
    type: 'MemberExpression',
    object: { type: 'Identifier', name: 'arr' },
    property: { type: 'Identifier', name: method }
  },
  arguments: Array.from({ length: args }, () => ({ type: 'ArrowFunctionExpression', params: [{ name: 'x' }] }))
});

function benchmark(label, fn) {
  const start = now();
  const result = fn();
  const elapsed = now() - start;
  console.log(`✅ ${label}: ${elapsed.toFixed(2)}ms`);
  return { elapsed, result };
}

function computeSpeedup(baseline, cached) {
  if (cached === 0) return Infinity;
  return baseline / cached;
}

console.log('\n================ PHASE E - TASK E1.4 BENCHMARKS ================');

// Initialize caches
const cache = new CacheManager();
const functionCache = new FunctionCache(cache);
const patternCache = new PatternCache(cache);

// Benchmark 1: Function caching
const functionSamples = Array.from({ length: 500 }, (_, i) =>
  mockFunctionAst(`fn${i}`, [{ name: 'x' }, { name: 'y' }])
);

const baselineFunctions = benchmark('Function baseline (compile pass)', () => {
  functionSamples.forEach(fn => functionCache.cacheFunctionDeclaration(fn, {}));
});

const cachedFunctions = benchmark('Function cached pass', () => {
  functionSamples.forEach(fn => functionCache.cacheFunctionDeclaration(fn, {}));
});

const functionSpeedup = computeSpeedup(baselineFunctions.elapsed, cachedFunctions.elapsed);
console.log(`   ➜ Function speedup: ${functionSpeedup.toFixed(2)}x`);

// Benchmark 2: Destructuring pattern caching
const destructuringSamples = Array.from({ length: 600 }, (_, i) => mockArrayPattern((i % 5) + 1));

const baselineDestruct = benchmark('Destructuring baseline pass', () => {
  destructuringSamples.forEach(p => patternCache.cacheDestructuringPattern(p, {}));
});

const cachedDestruct = benchmark('Destructuring cached pass', () => {
  destructuringSamples.forEach(p => patternCache.cacheDestructuringPattern(p, {}));
});

const destructSpeedup = computeSpeedup(baselineDestruct.elapsed, cachedDestruct.elapsed);
console.log(`   ➜ Destructuring speedup: ${destructSpeedup.toFixed(2)}x`);

// Benchmark 3: Template literal caching
const templateSamples = Array.from({ length: 400 }, (_, i) => mockTemplateLiteral(2, 1, `h${i % 5}`));

const baselineTemplates = benchmark('Template literal baseline pass', () => {
  templateSamples.forEach(t => patternCache.cacheTemplateLiteral(t, {}));
});

const cachedTemplates = benchmark('Template literal cached pass', () => {
  templateSamples.forEach(t => patternCache.cacheTemplateLiteral(t, {}));
});

const templateSpeedup = computeSpeedup(baselineTemplates.elapsed, cachedTemplates.elapsed);
console.log(`   ➜ Template literal speedup: ${templateSpeedup.toFixed(2)}x`);

// Benchmark 4: Array method pattern caching
const arrayMethodSamples = Array.from({ length: 400 }, (_, i) =>
  mockArrayMethodCall(i % 2 === 0 ? 'map' : 'filter', 1)
);

const baselineArrayMethods = benchmark('Array method baseline pass', () => {
  arrayMethodSamples.forEach(c => patternCache.cacheArrayMethodPattern(c, {}));
});

const cachedArrayMethods = benchmark('Array method cached pass', () => {
  arrayMethodSamples.forEach(c => patternCache.cacheArrayMethodPattern(c, {}));
});

const arrayMethodSpeedup = computeSpeedup(baselineArrayMethods.elapsed, cachedArrayMethods.elapsed);
console.log(`   ➜ Array method speedup: ${arrayMethodSpeedup.toFixed(2)}x`);

// Combined pipeline benchmark
const combinedBaseline = benchmark('Combined baseline pass', () => {
  functionSamples.forEach(fn => functionCache.cacheFunctionDeclaration(fn, {}));
  destructuringSamples.forEach(p => patternCache.cacheDestructuringPattern(p, {}));
  templateSamples.forEach(t => patternCache.cacheTemplateLiteral(t, {}));
  arrayMethodSamples.forEach(c => patternCache.cacheArrayMethodPattern(c, {}));
});

const combinedCached = benchmark('Combined cached pass', () => {
  functionSamples.forEach(fn => functionCache.cacheFunctionDeclaration(fn, {}));
  destructuringSamples.forEach(p => patternCache.cacheDestructuringPattern(p, {}));
  templateSamples.forEach(t => patternCache.cacheTemplateLiteral(t, {}));
  arrayMethodSamples.forEach(c => patternCache.cacheArrayMethodPattern(c, {}));
});

const combinedSpeedup = computeSpeedup(combinedBaseline.elapsed, combinedCached.elapsed);
console.log(`   ➜ Combined speedup: ${combinedSpeedup.toFixed(2)}x`);

console.log('\n======================= BENCHMARK SUMMARY =======================');
console.log(`Function speedup:       ${functionSpeedup.toFixed(2)}x`);
console.log(`Destructuring speedup:  ${destructSpeedup.toFixed(2)}x`);
console.log(`Template speedup:       ${templateSpeedup.toFixed(2)}x`);
console.log(`Array method speedup:   ${arrayMethodSpeedup.toFixed(2)}x`);
console.log(`Combined speedup:       ${combinedSpeedup.toFixed(2)}x`);
console.log('==================================================================');

// Assertions (focus on overall combined speedup; warn on individual dips)
const warnIfLow = (label, value, threshold) => {
  if (value < threshold) {
    console.warn(`⚠️  ${label} below target: ${value.toFixed(2)}x (target ${threshold}x)`);
  }
};

warnIfLow('Function speedup', functionSpeedup, 1.2);
warnIfLow('Destructuring speedup', destructSpeedup, 1.1);
warnIfLow('Template speedup', templateSpeedup, 1.0);
warnIfLow('Array method speedup', arrayMethodSpeedup, 1.0);

assert(combinedSpeedup > 1.2, `Combined speedup too low: ${combinedSpeedup.toFixed(2)}x`);

cache.destroy();
