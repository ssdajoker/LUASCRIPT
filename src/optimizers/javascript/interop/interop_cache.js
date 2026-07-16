/**
 * E5.1: Interop Cache
 * Cross-runtime optimization caching for transpilation and optimization results
 * 
 * Purpose: Cache and share transpilation results, optimizations, and metadata
 * across different runtime environments and JavaScript engines
 */

// Cache Configuration Constants
const DEFAULT_MAX_CACHE_SIZE = 1000;
const DEFAULT_CACHE_TTL_MS = 3600000; // 1 hour
const CACHE_KEY_HASH_LENGTH = 16;
const _DEFAULT_MAX_STACK_FRAMES = 50;

// Runtime Object Size Limits (in MB, multiply by BYTES_PER_KB squared)
const V8_MAX_OBJECT_SIZE_MB = 512;
const SPIDERMONKEY_MAX_OBJECT_SIZE_MB = 256;
const JSC_MAX_OBJECT_SIZE_MB = 128;
const BYTES_PER_KB = 1024;

// Conversion Constants
const CACHE_HIT_RATE_PERCENTAGE_MULTIPLIER = 100;
const LRU_EVICTION_PERCENTAGE = 0.1; // 10%

class InteropCache {
  constructor(options = {}) {
    this.options = {
      maxSize: options.maxSize || DEFAULT_MAX_CACHE_SIZE,
      ttl: options.ttl || DEFAULT_CACHE_TTL_MS,
      serializeFormat: options.serializeFormat || "json", // json or msgpack
      enableCompression: options.enableCompression !== false,
      enableMetrics: options.enableMetrics !== false,
      runtimes: options.runtimes || ["v8", "spidermonkey", "jsc", "chakra"]
    };

    this.cache = new Map();
    this.metadata = new Map();
    this.runtimeProfiles = new Map();
    this.sharedOptimizations = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      stores: 0,
      evictions: 0,
      compressionRatio: 0,
      crossRuntimeUses: 0
    };

    // Initialize runtime profiles
    this._initializeRuntimeProfiles();
  }

  /**
   * Initialize runtime capability profiles
   */
  _initializeRuntimeProfiles() {
    this.runtimeProfiles.set("v8", {
      name: "V8 (Node.js/Chrome)",
      features: ["async", "proxy", "weakmap", "bigint", "privatefields"],
      optimizations: ["tiered-compilation", "speculative-optimization", "inlining"],
      constraints: { maxObjectSize: V8_MAX_OBJECT_SIZE_MB * BYTES_PER_KB * BYTES_PER_KB }
    });

    this.runtimeProfiles.set("spidermonkey", {
      name: "SpiderMonkey (Firefox)",
      features: ["async", "proxy", "weakmap", "bigint"],
      optimizations: ["jit", "inline-caches", "type-specialization"],
      constraints: { maxObjectSize: SPIDERMONKEY_MAX_OBJECT_SIZE_MB * BYTES_PER_KB * BYTES_PER_KB }
    });

    this.runtimeProfiles.set("jsc", {
      name: "JavaScriptCore (Safari)",
      features: ["async", "proxy", "weakmap", "bigint"],
      optimizations: ["dfg", "ftl", "speculative-optimization"],
      constraints: { maxObjectSize: JSC_MAX_OBJECT_SIZE_MB * BYTES_PER_KB * BYTES_PER_KB }
    });

    this.runtimeProfiles.set("chakra", {
      name: "Chakra (Edge Legacy)",
      features: ["async", "proxy", "weakmap"],
      optimizations: ["simple-jit", "full-jit", "inline-caches"],
      constraints: { maxObjectSize: 256 * 1024 * 1024 }
    });
  }

  /**
   * Generate normalized cache key for AST nodes or code
   */
  _generateKey(input, _runtime = null) {
    const crypto = require("crypto");
    // Normalize the input for consistent hashing - NEVER include runtime in base key
    let keyInput = typeof input === "string" ? input : JSON.stringify(input);
    const hash = crypto.createHash("sha256").update(keyInput).digest("hex").substring(0, CACHE_KEY_HASH_LENGTH);
    return hash;
  }

  /**
   * Generate runtime-specific key
   */
  _generateRuntimeKey(input, runtime) {
    const baseKey = this._generateKey(input);
    return runtime ? `${runtime}:${baseKey}` : baseKey;
  }

  /**
   * Store transpilation result with runtime compatibility metadata
   */
  store(input, result, options = {}) {
    const {
      runtime = null,
      optimization = null,
      compatible = []
    } = options;

    const baseKey = this._generateKey(input);
    const timestamp = Date.now();

    // Store original result (not serialized)
    this.cache.set(baseKey, result);
    
    // Store metadata with normalized input reference
    this.metadata.set(baseKey, {
      timestamp,
      runtime,
      optimization,
      compatible: compatible || [],
      size: typeof result === "object" ? JSON.stringify(result).length : 0,
      created: new Date().toISOString(),
      input: typeof input === "string" ? input : JSON.stringify(input)
    });

    // Track shared optimizations
    if (optimization) {
      if (!this.sharedOptimizations.has(optimization)) {
        this.sharedOptimizations.set(optimization, []);
      }
      this.sharedOptimizations.get(optimization).push(baseKey);
    }

    this.metrics.stores++;

    // Enforce max size with LRU eviction
    if (this.cache.size > this.options.maxSize) {
      this._evictLRU();
    }

    return { key: baseKey, stored: true, size: this.metadata.get(baseKey).size };
  }

  /**
   * Retrieve cached result, checking runtime compatibility
   */
  retrieve(input, runtime = null) {
    const baseKey = this._generateKey(input);
    
    if (!this.cache.has(baseKey)) {
      this.metrics.misses++;
      return null;
    }

    const metadata = this.metadata.get(baseKey);
    
    // Check TTL
    if (Date.now() - metadata.timestamp > this.options.ttl) {
      this.cache.delete(baseKey);
      this.metadata.delete(baseKey);
      this.metrics.misses++;
      return null;
    }

    // Check runtime compatibility
    if (runtime && metadata.compatible.length > 0) {
      if (!metadata.compatible.includes(runtime)) {
        this.metrics.misses++;
        return null;
      }
    }

    this.metrics.hits++;
    
    const isCrossRuntime = runtime && metadata.runtime && metadata.runtime !== runtime;
    if (isCrossRuntime) {
      this.metrics.crossRuntimeUses++;
    }

    const result = this.cache.get(baseKey);

    return {
      data: result,
      metadata,
      crossRuntime: isCrossRuntime
    };
  }

  /**
   * Invalidate cache entries for a specific optimization
   */
  invalidateOptimization(optimization) {
    const keys = this.sharedOptimizations.get(optimization) || [];
    let count = 0;
    for (const key of keys) {
      this.cache.delete(key);
      this.metadata.delete(key);
      count++;
    }
    this.sharedOptimizations.delete(optimization);
    return count;
  }

  /**
   * Get compatible runtimes for a cached result
   */
  getCompatibleRuntimes(input) {
    const baseKey = this._generateKey(input);
    const metadata = this.metadata.get(baseKey);
    if (!metadata) return [];
    return metadata.compatible;
  }

  /**
   * Compute runtime intersection - which optimizations work across all specified runtimes
   */
  computeRuntimeIntersection(runtimes = []) {
    if (runtimes.length === 0) {
      runtimes = Array.from(this.runtimeProfiles.keys());
    }

    const profiles = runtimes.map(r => this.runtimeProfiles.get(r)).filter(p => p);
    if (profiles.length === 0) return [];

    // Find common features across all profiles
    const commonFeatures = profiles[0].features.filter(feature =>
      profiles.every(p => p.features.includes(feature))
    );

    return commonFeatures;
  }

  /**
   * Export cache for cross-process/cross-environment use
   */
  export(options = {}) {
    const { includeMetadata = true, format = "json" } = options;

    const exportData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      cache: Array.from(this.cache.entries()).map(([k, v]) => [
        k, 
        typeof v === "string" ? v : JSON.stringify(v)
      ]),
      metadata: includeMetadata ? Array.from(this.metadata.entries()) : undefined,
      metrics: this.metrics,
      runtimeProfiles: Array.from(this.runtimeProfiles.entries())
    };

    if (format === "json") {
      return JSON.stringify(exportData);
    }
    return exportData;
  }

  /**
   * Import cache from export format
   */
  import(data, options = {}) {
    const { merge = true } = options;

    let importData = typeof data === "string" ? JSON.parse(data) : data;

    if (!merge) {
      this.cache.clear();
      this.metadata.clear();
    }

    let imported = 0;
    for (const [key, value] of importData.cache) {
      // Try to parse JSON strings back to objects
      try {
        this.cache.set(key, typeof value === "string" ? JSON.parse(value) : value);
      } catch {
        // If not JSON, store as-is
        this.cache.set(key, value);
      }
      imported++;
    }

    if (importData.metadata) {
      for (const [key, meta] of importData.metadata) {
        this.metadata.set(key, meta);
      }
    }

    return { imported, totalSize: this.cache.size };
  }

  /**
   * LRU eviction when cache exceeds max size
   */
  _evictLRU() {
    if (this.cache.size <= this.options.maxSize) return;

    const sortedByAge = Array.from(this.metadata.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toEvict = Math.ceil(this.options.maxSize * LRU_EVICTION_PERCENTAGE);
    for (let i = 0; i < toEvict; i++) {
      const [key] = sortedByAge[i];
      this.cache.delete(key);
      this.metadata.delete(key);
      this.metrics.evictions++;
    }
  }

  /**
   * Get cache statistics and health metrics
   */
  getStats() {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? (this.metrics.hits / total * CACHE_HIT_RATE_PERCENTAGE_MULTIPLIER).toFixed(2) : 0;

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      utilization: ((this.cache.size / this.options.maxSize) * CACHE_HIT_RATE_PERCENTAGE_MULTIPLIER).toFixed(2) + "%",
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRate: hitRate + "%",
      stores: this.metrics.stores,
      evictions: this.metrics.evictions,
      compressionRatio: (this.metrics.compressionRatio * 100).toFixed(2) + "%",
      crossRuntimeUses: this.metrics.crossRuntimeUses,
      avgKeySize: this.cache.size > 0 ? 
        Math.round(Array.from(this.cache.keys()).reduce((sum, k) => sum + k.length, 0) / this.cache.size) : 0
    };
  }

  /**
   * Clear cache and reset metrics
   */
  clear(resetMetrics = false) {
    this.cache.clear();
    this.metadata.clear();
    this.sharedOptimizations.clear();
    
    if (resetMetrics) {
      this.metrics = {
        hits: 0,
        misses: 0,
        stores: 0,
        evictions: 0,
        compressionRatio: 0,
        crossRuntimeUses: 0
      };
    }
    
    return true;
  }
}

module.exports = InteropCache;
