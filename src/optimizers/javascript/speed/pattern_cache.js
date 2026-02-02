/**
 * PHASE E - Task E1.3: Pattern Literal Caching
 * 
 * Caches frequently repeated literal and structural patterns during transpilation:
 * - Destructuring patterns (array/object)
 * - Template literals
 * - Array method call patterns (map/filter/reduce)
 * 
 * Performance Targets:
 * - Pattern hit rate: 70%+ on typical codebases
 * - Speedup on repeat patterns: 50%+
 * - Memory usage: <3MB per 1000 cached patterns
 * 
 * @example
 * const patternCache = new PatternCache(cacheManager);
 * const cached = patternCache.cacheDestructuringPattern(patternAst, context);
 * 
 * @module src/optimizers/javascript/speed/pattern_cache
 */

const { CacheManager } = require('./cache_manager');

class PatternCache {
  /**
   * @param {CacheManager} cacheManager - L1/L2/L3 cache instance
   * @param {Object} options - Configuration options
   * @param {boolean} options.normalizeKeys - Normalize keys (default: true)
   * @param {number} options.maxCacheSize - Max patterns to cache (default: 20000)
   */
  constructor(cacheManager, options = {}) {
    this.cache = cacheManager;
    this.normalizeKeys = options.normalizeKeys !== false;
    this.maxCacheSize = options.maxCacheSize || 20000;

    this.stats = {
      cached: 0,
      compiled: 0,
      reused: 0,
      hits: 0,
      misses: 0,
      patterns: {
        destructuring: 0,
        template: 0,
        arrayMethod: 0
      }
    };
  }

  /**
   * Cache or retrieve a destructuring pattern
   * @param {Object} patternAst - ArrayPattern or ObjectPattern
   * @param {Object} context - Transpilation context
   * @returns {string} Cached pattern compilation
   */
  cacheDestructuringPattern(patternAst, context) {
    const key = this.createDestructuringKey(patternAst);
    const cached = this.cache.get(key);

    if (cached) {
      this.stats.reused++;
      this.stats.hits++;
      return cached;
    }

    this.stats.misses++;
    this.stats.patterns.destructuring++;

    const compiled = this._compileDestructuringPattern(patternAst, context);
    this.cache.set(key, compiled, 1);
    this.stats.compiled++;

    return compiled;
  }

  /**
   * Cache or retrieve a template literal pattern
   * @param {Object} templateAst - TemplateLiteral AST
   * @param {Object} context - Transpilation context
   * @returns {string} Cached template compilation
   */
  cacheTemplateLiteral(templateAst, context) {
    const key = this.createTemplateKey(templateAst);
    const cached = this.cache.get(key);

    if (cached) {
      this.stats.reused++;
      this.stats.hits++;
      return cached;
    }

    this.stats.misses++;
    this.stats.patterns.template++;

    const compiled = this._compileTemplateLiteral(templateAst, context);
    this.cache.set(key, compiled, 1);
    this.stats.compiled++;

    return compiled;
  }

  /**
   * Cache or retrieve an array method call pattern
   * @param {Object} callAst - CallExpression AST
   * @param {Object} context - Transpilation context
   * @returns {string} Cached array method compilation
   */
  cacheArrayMethodPattern(callAst, context) {
    const key = this.createArrayMethodKey(callAst);
    const cached = this.cache.get(key);

    if (cached) {
      this.stats.reused++;
      this.stats.hits++;
      return cached;
    }

    this.stats.misses++;
    this.stats.patterns.arrayMethod++;

    const compiled = this._compileArrayMethodPattern(callAst, context);
    this.cache.set(key, compiled, 1);
    this.stats.compiled++;

    return compiled;
  }

  /**
   * Create a unique key for destructuring patterns
   * @param {Object} patternAst - ArrayPattern or ObjectPattern
   * @returns {string}
   */
  createDestructuringKey(patternAst) {
    const type = patternAst?.type || 'UnknownPattern';
    const shape = this._hashPatternShape(patternAst);
    return `destruct_${type}_${shape}`;
  }

  /**
   * Create a unique key for template literals
   * @param {Object} templateAst - TemplateLiteral
   * @returns {string}
   */
  createTemplateKey(templateAst) {
    const quasis = templateAst?.quasis?.length || 0;
    const exprs = templateAst?.expressions?.length || 0;
    const head = this._hashTemplateHead(templateAst);
    return `template_q${quasis}_e${exprs}_${head}`;
  }

  /**
   * Create a unique key for array method patterns
   * @param {Object} callAst - CallExpression
   * @returns {string}
   */
  createArrayMethodKey(callAst) {
    const method = this._extractArrayMethodName(callAst) || 'unknown';
    const args = callAst?.arguments?.length || 0;
    const callbackShape = this._hashCallbackShape(callAst?.arguments?.[0]);
    return `array_${method}_args${args}_${callbackShape}`;
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests * 100).toFixed(1) : '0';
    const reuseRate = this.stats.compiled > 0 ? (this.stats.reused / (this.stats.reused + this.stats.compiled) * 100).toFixed(1) : '0';

    return {
      ...this.stats,
      totalRequests,
      hitRate: `${hitRate}%`,
      reuseRate: `${reuseRate}%`,
      cacheSize: this.cache.l1Cache.size + this.cache.l2Cache.size + this.cache.l3Cache.size()
    };
  }

  /**
   * Get cached patterns by type
   * @param {string} pattern - Pattern type
   * @returns {number}
   */
  getCachedCountByPattern(pattern) {
    return this.stats.patterns[pattern] || 0;
  }

  /**
   * Clear cache and reset stats
   */
  clearCache() {
    this.cache.clear();
    Object.keys(this.stats).forEach(key => {
      if (typeof this.stats[key] === 'number') {
        this.stats[key] = 0;
      }
    });
  }

  /**
   * Get performance metrics
   * @returns {Object}
   */
  getPerformanceMetrics() {
    return {
      cacheSizeMB: ((this.stats.compiled || 0) * 0.001).toFixed(2),
      patternsCompiled: this.stats.compiled,
      patternsReused: this.stats.reused,
      speedupFactor: this.stats.compiled > 0 ? (this.stats.reused / this.stats.compiled).toFixed(2) : '1.00',
      patterns: this.stats.patterns
    };
  }

  // ----- Private helper methods -----

  _compileDestructuringPattern(patternAst, context) {
    const type = patternAst?.type || 'Pattern';
    const itemCount = Array.isArray(patternAst?.elements)
      ? patternAst.elements.length
      : Array.isArray(patternAst?.properties)
        ? patternAst.properties.length
        : 0;

    return `-- destructuring ${type} (${itemCount} items)`;
  }

  _compileTemplateLiteral(templateAst, context) {
    const quasis = templateAst?.quasis?.length || 0;
    const exprs = templateAst?.expressions?.length || 0;
    return `-- template literal q${quasis} e${exprs}`;
  }

  _compileArrayMethodPattern(callAst, context) {
    const method = this._extractArrayMethodName(callAst) || 'arrayMethod';
    const args = callAst?.arguments?.length || 0;
    return `-- array method ${method} (${args} args)`;
  }

  _hashPatternShape(patternAst) {
    if (!patternAst) return 'empty';
    if (patternAst.type === 'ArrayPattern') {
      return `arr_${(patternAst.elements || []).length}`;
    }
    if (patternAst.type === 'ObjectPattern') {
      return `obj_${(patternAst.properties || []).length}`;
    }
    return `unknown_${patternAst.type || 'none'}`;
  }

  _hashTemplateHead(templateAst) {
    const raw = templateAst?.quasis?.[0]?.value?.raw || '';
    return raw.substring(0, 12).replace(/\s+/g, '_') || 'empty';
  }

  _extractArrayMethodName(callAst) {
    const callee = callAst?.callee;
    if (!callee) return null;
    if (callee.type === 'MemberExpression') {
      return callee.property?.name || callee.property?.value || null;
    }
    return callee.name || null;
  }

  _hashCallbackShape(callbackAst) {
    if (!callbackAst) return 'nocb';
    const type = callbackAst.type || 'Unknown';
    const params = callbackAst.params?.length || 0;
    return `${type}_${params}`;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PatternCache };
}
